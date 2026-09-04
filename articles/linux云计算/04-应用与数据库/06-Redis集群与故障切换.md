# Redis 集群与故障切换

Redis Sentinel 解决主从监控和故障切换；Redis Cluster 提供分片和槽位迁移。二者都不自动解决业务幂等、持久化和跨地域容灾。

```bash
redis-cli -h <SENTINEL> -p 26379 SENTINEL masters
redis-cli -h <NODE> INFO replication
redis-cli -c -h <NODE> CLUSTER INFO
```

演练包括主节点故障、客户端重连、复制积压、脑裂保护、数据恢复和告警确认。版本升级先做兼容性验证和回滚演练。
