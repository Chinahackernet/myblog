# Redis 运维与数据建模

## 数据结构与成本

String、Hash、List、Set、Sorted Set、Stream 的时间复杂度和内存布局不同。建模先确定访问命令、最大元素数、TTL 和热点分布；禁止把无限增长的 List/Stream 当作永久队列。

```bash
redis-cli --latency-history -h redis-1
redis-cli MEMORY USAGE key-name; redis-cli SLOWLOG GET 20
```

## 持久化与重写

RDB/AOF 重写会产生 fork 和复制页开销，必须为峰值内存、磁盘空间和 I/O 预留余量。AOF fsync 策略影响数据损失和延迟；恢复测试要测实际加载时间，不要只看文件大小。

## 操作安全

使用 ACL、TLS、网络隔离和命令分类，限制 `CONFIG`、`MODULE`、`DEBUG` 等管理能力。大 key、热 key、阻塞命令和全库扫描都应有检测与处置 runbook。容量告警同时看内存、碎片、复制 backlog、连接和命中率。

故障切换后验证客户端拓扑刷新、幂等重试和消息重复；恢复数据时先隔离旧集群，抽样校验 key、TTL、版本和业务不变量。

