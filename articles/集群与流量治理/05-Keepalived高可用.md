# Keepalived 高可用

VRRP 提供 VIP 漂移，`vrrp_script` 可将本地服务健康状态纳入选举。配置时必须避免双主、脑裂和健康检查误判。

```bash
keepalived -t -f /etc/keepalived/keepalived.conf
ip addr show
journalctl -u keepalived --since '10 min ago'
```

演练应验证主节点故障、VIP 漂移、业务连续性、恢复抢占策略和告警闭环。
