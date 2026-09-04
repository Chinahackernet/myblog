# Elasticsearch 集群、分片与恢复

## 集群模型

节点角色、主节点选举、分片路由、segment、translog 和 JVM heap 共同决定性能。主分片数按数据量和目标 shard 大小估算，副本数按故障域和查询吞吐规划。

```bash
curl -s https://es-1:9200/_cluster/health?pretty; curl -s https://es-1:9200/_cat/shards?v; curl -s https://es-1:9200/_cluster/pending_tasks?pretty
```

避免字段类型漂移、无限 mapping 和过高基数；索引模板、alias、ILM、权限和快照仓库进入版本管理。磁盘水位触发前应停止低优先级写入或迁移，不要等到只读保护。

快照恢复前校验仓库、权限、版本和索引优先级；恢复后核对文档数、时间范围、mapping、alias 和查询结果。节点替换按故障域和 rebalance 速度分批，避免恢复流量拖垮线上查询。

