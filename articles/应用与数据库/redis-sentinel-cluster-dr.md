# Redis Sentinel/Cluster、ACL、淘汰与灾备

## 1. 数据模型与持久化

Redis 是内存优先的数据结构服务器；持久化策略决定故障后的 RPO。RDB 适合周期快照，AOF 记录写操作，混合模式兼顾恢复速度和数据损失窗口。任何策略都必须通过真实数据量测试恢复时间。

## 2. Sentinel 高可用

Sentinel 以 quorum 判断主观/客观下线并选举领导者；quorum 不等于多数派，部署至少三台且跨故障域。客户端必须支持拓扑刷新和重连，不能把固定主地址写死。

```bash
redis-cli -h sentinel-1 -p 26379 SENTINEL get-master-addr-by-name mymaster
redis-cli -h sentinel-1 -p 26379 SENTINEL ckquorum mymaster
```

## 3. Cluster 与槽位迁移

Cluster 将 16384 个槽映射到主节点，副本只负责故障接管。迁移时逐批移动槽位，控制 `MIGRATE` 带宽和业务延迟；跨槽事务、Lua 和多 key 操作必须使用 hash tag 或改写模型。

```bash
redis-cli --cluster check 10.0.0.11:6379
redis-cli --cluster reshard 10.0.0.11:6379
```

## 4. 内存、ACL 与安全

`maxmemory` 应低于容器/主机可用内存，给 fork、复制和碎片预留空间。淘汰策略按业务语义选择，缓存与持久数据不能共用无边界实例。使用 ACL 用户、命令分类、TLS 和网络隔离；禁用默认用户和危险命令。

## 5. 灾备

跨地域复制需评估延迟和脑裂；异地副本不是自动一致。定期把 RDB/AOF 复制到隔离存储，恢复到临时集群后校验 key 数、抽样值、TTL 和业务不变量。故障时先停止写入或切换为只读，避免双活覆盖。

## 内存与延迟分析

`used_memory` 之外要观察 allocator RSS、碎片率、fork 峰值和复制 backlog。RDB/AOF 重写会短时复制页并消耗额外内存；将 `maxmemory` 设到物理/容器上限会让重写触发 OOM。对缓存实例设置淘汰策略、热点 key 保护和大 key 扫描，禁止在生产使用 `KEYS *`。

槽位迁移前先检查跨槽命令、客户端版本和重试策略；迁移过程中监控 `MIGRATING/IMPORTING`、网络流量和 P99。Sentinel 故障切换后验证新主的 ACL、复制偏移、AOF/RDB 和客户端拓扑刷新，不能只看 `role:master`。

灾备恢复后重新生成 ACL token、TLS 证书和客户端连接信息，旧集群凭据立即撤销。对包含个人数据的 RDB/AOF 采用加密、访问审计和最短保留期。
