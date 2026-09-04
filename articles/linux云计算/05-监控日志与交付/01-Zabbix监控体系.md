# Zabbix 监控体系

监控设计从服务目标出发：可用性、延迟、错误率、容量和饱和度。模板应区分发现规则、采集项、触发器、依赖关系、标签和维护窗口。

```text
Agent/Proxy → Server → Database → Web/UI
```

先监控 Zabbix 自身，再接入主机、端口、进程、MySQL、Redis 和 URL。告警必须有级别、责任人、抑制条件和 Runbook 链接，避免只堆指标。
