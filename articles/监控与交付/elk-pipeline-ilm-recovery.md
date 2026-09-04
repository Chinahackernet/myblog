# ELK Logstash 队列、TLS、ILM 与集群恢复

## 1. 数据流

Beats/Agent 采集 → Logstash 解析与脱敏 → Kafka/持久队列缓冲 → Elasticsearch 索引 → Kibana 查询。解析失败必须进入 dead-letter 流，而不是静默丢弃。

## 2. Logstash 队列与 TLS

启用 persistent queue 需要独立磁盘和容量预算；Kafka 模式则按分区、保留期和消费滞后计算。Beats、Logstash、Elasticsearch 之间启用 TLS，证书轮换要先扩容新证书再撤旧证书。

```conf
input { beats { port => 5044 ssl_enabled => true ssl_certificate => "/etc/logstash/tls.crt" } }
filter { json { source => "message" } mutate { remove_field => ["password","token"] } }
output { elasticsearch { hosts => ["https://es-1:9200"] index => "app-%{+YYYY.MM.dd}" } }
```

## 3. 分片、副本与 ILM

分片数影响并发和恢复，过多会放大集群状态与小文件；副本数决定故障域和查询吞吐。ILM 以热/温/冷/删除阶段管理 rollover、保留期和快照，不应只按磁盘满才删除。

## 4. 恢复演练

监控 cluster health、pending tasks、JVM、磁盘水位、segment、写入拒绝和查询 P99。恢复时先停止写入或降级采集，确认快照仓库，再按索引优先级恢复；恢复后校验文档数、时间范围、字段映射和查询结果。

脱敏规则必须有单元测试和抽样审计，避免个人数据进入日志或快照。任何删除和 ILM 调整都要审批并保留影响评估。

## 队列容量与背压

按日志字节率、峰值倍数、下游可用吞吐和最长故障窗口计算 persistent queue/Kafka 容量。队列接近上限时应触发背压和采集降级，优先保留安全审计与核心业务日志；不要让 Logstash 无限重试导致磁盘耗尽。

索引模板固定字段类型和时间字段，避免同名字段在不同服务中出现 string/object 冲突。分片数以每日写入量和目标 shard 大小估算，扩容优先调整 rollover 和副本，而不是盲目增加主分片。快照恢复后要做 alias、ILM phase、模板和权限完整性检查。

日志脱敏在最靠近源头的可信边界完成，二次脱敏用于防止遗漏。生产日志查询应按租户授权、默认时间范围和结果上限，避免一次查询拖垮集群。
