# DNS、NTP 与基础网络服务

## DNS 解析链

解析涉及 stub resolver、缓存、递归服务器、权威服务器和搜索域。故障先区分本机配置、递归超时、权威错误、TTL 未生效和 Split-horizon，再决定修改客户端或 DNS 服务。

```bash
resolvectl status; resolvectl query api.example.com; dig +trace api.example.com; dig @192.0.2.53 api.example.com SOA
```

应用连接失败不一定是 DNS：缓存中的旧地址、IPv6 优先、证书 SAN 和代理环境都可能造成假象。变更记录 TTL、发布窗口、回滚记录和实际权威响应。

集群、证书、日志和数据库复制依赖稳定时间。使用 chrony/systemd-timesyncd，配置多个源并监控 offset、stratum、频率和 leap 状态；不要用手工 `date -s` 修复生产时钟。

```bash
chronyc tracking; chronyc sources -v; timedatectl timesync-status
```

时间跳变可能导致 token 失效、日志顺序错乱、选主异常和事务问题。维护窗口内调整时钟，必要时采用平滑校时并记录影响。

