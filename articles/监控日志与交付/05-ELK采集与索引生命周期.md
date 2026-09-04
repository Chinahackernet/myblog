# ELK 采集与索引生命周期

## 字段规范

统一 `@timestamp`、主机、服务、环境、级别、请求 ID 和消息字段；生产日志先脱敏再离开主机。

## 链路验证

```bash
filebeat test output
curl -s http://<ES>:9200/_cluster/health?pretty
```

Logstash 管道应设置队列、失败路由和限速；Elasticsearch 需要规划分片、副本、磁盘水位和 ILM。索引按数据生命周期滚动、迁移和删除，不用手工无限创建索引。

## 故障顺序

采集端 → 网络/TLS → Logstash pipeline → Elasticsearch bulk 拒绝 → Kibana 查询。每层保留可观测指标和积压告警。
