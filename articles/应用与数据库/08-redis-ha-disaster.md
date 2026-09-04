# Redis 企业级运维：Sentinel、Cluster、内存治理与灾备

## 1. 数据模型与持久化边界

Redis 的延迟优势来自内存数据结构与事件循环，代价是大 key、阻塞命令和 fork 重写会影响尾延迟。上线前定义 key 命名、TTL、最大 value、集合基数和热 key 策略；缓存、会话、队列和强一致数据不能用同一套持久化与淘汰假设。

```bash
redis-cli INFO memory
redis-cli --latency-history -h 127.0.0.1 -i 1
redis-cli SLOWLOG GET 20
redis-cli --bigkeys
```

RDB 适合低开销快照，AOF 提供更细粒度的重放窗口但会产生 rewrite 和 fsync 成本。`appendfsync everysec` 的数据丢失窗口与磁盘延迟要在业务上确认；灾备不能只复制 RDB 文件，还要验证版本、配置、ACL 和恢复时间。

## 2. Sentinel 高可用

Sentinel 通过 quorum 判断主节点客观下线，再选举 leader 并执行故障转移。quorum 不是“需要多少节点同意就一定安全”，还要保证多数 Sentinel 分布在独立故障域，客户端正确订阅主节点变化并处理重连。

```conf
sentinel monitor mymaster 10.40.0.11 6379 2
sentinel down-after-milliseconds mymaster 5000
sentinel failover-timeout mymaster 60000
sentinel parallel-syncs mymaster 1
```

切换前确认副本偏移、复制积压、客户端拓扑刷新和写入 fencing。演练网络分区、主节点磁盘满、复制中断和 Sentinel 少数派，重点观察是否出现双主写入与数据分叉。

## 3. Cluster、槽位迁移与一致性

Redis Cluster 将 16384 个槽分配到主节点，副本负责故障转移；多 key 操作必须落在同一 hash slot，可使用 hash tag（如 `{tenant42}:cart`）但要防止热点集中。迁移采用 `MIGRATING/IMPORTING` 状态和 `MOVED/ASK` 重定向，客户端必须支持集群协议。

```bash
redis-cli -c -h 10.40.0.11 CLUSTER INFO
redis-cli -c -h 10.40.0.11 CLUSTER NODES
redis-cli --cluster check 10.40.0.11:6379
redis-cli --cluster reshard 10.40.0.11:6379 --cluster-use-empty-masters
```

迁移期间观察 key 迁移速率、复制延迟、错误重定向和业务 P99；大 key 迁移可能阻塞事件循环，需分批并设置停止阈值。Cluster 不提供跨槽事务和强一致多主写，应用必须接受最终一致或重新设计 key。

## 4. 内存、ACL 与恢复

`maxmemory` 需低于物理内存并预留复制缓冲、AOF/RDB fork 和系统开销。`allkeys-lfu`、`volatile-ttl` 等淘汰策略要和业务语义匹配；监控 evicted_keys、mem_fragmentation_ratio、复制 backlog 和 fork 延迟。ACL 采用最小命令集与 key pattern，禁用危险命令或通过受控管理员通道执行。

```bash
redis-cli ACL SETUSER app on >replace-me ~app:{*} +get +set +del +expire
redis-cli ACL LOG 20
```

灾备恢复在新集群执行：校验备份→恢复数据→校验 key 数量/抽样值/TTL→回放业务写入→切换连接。记录 RPO、RTO、丢失 key 范围和缓存预热成本；旧集群保留只读观察期，避免误切回。

## 5. 故障注入与容量验证

演练应使用可回收的测试 key，分别注入主节点断电、复制链路丢包、AOF 磁盘满、fork 阻塞、热 key 和槽位迁移。观察客户端重试是否形成惊群，Sentinel 是否在 quorum 以内完成切换，Cluster 是否出现大量 `MOVED/ASK`。每次演练记录切换时长、丢失写入、连接错误、CPU 峰值和恢复后的重同步流量。

内存容量以峰值 key 数、平均/最大 value、过期抖动、复制缓冲、AOF rewrite 和系统余量共同计算；在压测中验证 `used_memory_peak`、`mem_fragmentation_ratio`、evicted_keys、blocked_clients 和 instantaneous_ops_per_sec。达到保护阈值时优先降级非核心缓存和写入，而不是无计划地提升 `maxmemory`。
