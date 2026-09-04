# Redis 认证、ACL 与管理操作

## 认证模型

Redis 生产环境启用 TLS 和 ACL，禁用默认用户或限制其命令；按应用、读写、运维和备份角色拆分账号。网络层只允许应用网段访问数据端口，管理端口单独隔离。

```bash
redis-cli --tls --cacert ca.crt -h redis-1 ACL LIST; redis-cli ACL SETUSER app on >REPLACE_ME ~app:* +@read +@write -CONFIG -MODULE
```

## 管理边界

`FLUSHALL`、`CONFIG SET`、`DEBUG`、`MODULE` 和全库扫描属于高风险操作，必须审批、限来源并记录结果。慢查询、大 key、热 key、连接数、内存碎片和复制 backlog 是日常巡检重点。

凭据轮换采用新旧并行窗口，客户端验证新账号后再撤销旧账号。RDB/AOF、日志和监控标签不得泄露业务敏感数据。

