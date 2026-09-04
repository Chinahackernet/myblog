# ELK 日志平台：Logstash 队列、TLS、ILM、分片与集群恢复

## 1. 采集链路与数据契约

生产链路通常为 Agent/Filebeat → Logstash（解析、脱敏、路由）→ Elasticsearch → Kibana。日志事件必须有时间戳、主机/服务/环境、请求 ID、schema 版本和原始来源；解析失败进入隔离索引，不得静默丢弃。先定义字段类型，避免同一字段在不同服务中一会儿字符串、一会儿数字导致 mapping 冲突。

## 2. Logstash 队列与背压

Persistent Queue（PQ）可以在 Elasticsearch 短时不可用时落盘，但需要评估磁盘容量、检查点和恢复时间。队列大小按峰值事件速率 × 预期中断时长 × 安全系数计算；死信队列保存解析失败样本并限制保留。

```conf
input { beats { port => 5044 ssl => true ssl_certificate => "/etc/pki/logstash.crt" ssl_key => "/etc/pki/logstash.key" } }
filter {
  json { source => "message" target => "event" tag_on_failure => ["_jsonparsefailure"] }
  mutate { add_field => { "schema_version" => "1" } }
  mutate { remove_field => ["password", "token", "authorization"] }
}
output { elasticsearch { hosts => ["https://es-01:9200"] index => "app-%{+YYYY.MM.dd}" ssl => true } }
```

## 3. Elasticsearch 分片、副本与 ILM

主分片数量应依据目标数据量、单分片大小、写入速率和恢复窗口规划，不能按节点数机械设置。副本提供查询并发和节点故障能力，但会放大存储、网络和恢复成本。ILM 将热/温/冷阶段与 rollover、保留和删除绑定，生命周期策略必须先在测试索引验证。

```bash
curl -sS https://es-01:9200/_cluster/health?pretty
curl -sS https://es-01:9200/_cat/shards?v
curl -sS -XGET https://es-01:9200/_ilm/explain/app-000001?pretty
```

## 4. TLS、脱敏与恢复

Beats→Logstash、Logstash→Elasticsearch、Kibana→Elasticsearch 均使用 TLS；证书续期要有 staging、到期告警和原子替换。脱敏应在最早的可信边界执行，保留哈希化关联能力但不可逆。快照仓库跨故障域保存，恢复演练要覆盖索引、模板、ILM、用户权限和 Kibana 对象。

集群故障按 master 选举、磁盘水位、线程池拒绝、分片未分配、mapping 冲突和快照错误分层。恢复时先停止写入或降采集，再修复集群健康；不要在红色状态下盲目增加副本或强制分配未知数据。

## 5. 查询、成本与安全审计

查询优先使用时间范围、业务标签和明确字段，禁止在生产对超大索引执行无界 wildcard 或脚本查询。按热/温/冷节点与数据访问频率分配成本，审计索引和业务日志分开保留。对登录、读取敏感索引、修改 ILM、删除数据和快照恢复设置审计规则；日志平台自身的管理员权限使用独立账号和短期授权。

## 6. 恢复验收

恢复不仅检查 cluster green，还要验证索引模板、别名、ILM 阶段、用户角色、Kibana 可视化、时间解析、脱敏规则和关键查询 P95。故障期间记录 PQ 深度、丢弃事件、解析失败比例和下游拒绝，恢复后以事件 ID 样本对账，确认没有静默丢日志。

日志检索结果不能直接作为审计原件；对取证事件保存原始事件、采集时间、链路 ID 和哈希校验，并限制导出权限。超过保留期限的数据按策略删除，同时保留删除作业的审计证明。
