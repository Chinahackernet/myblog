# ELK 日志平台

采集链路通常为 Beats/Agent → Logstash → Elasticsearch → Kibana。设计时明确字段规范、时间戳、索引生命周期、脱敏、权限和查询性能。

```bash
curl -s http://<ES>:9200/_cluster/health?pretty
curl -s http://<ES>:9200/_cat/indices?v
```

先做小流量验证，再扩大采集；日志可能包含凭据和个人信息，必须控制访问并设置保留周期。
