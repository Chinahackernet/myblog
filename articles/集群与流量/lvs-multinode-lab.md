# LVS 多节点实验 Runbook

## 拓扑

```text
client 198.51.100.50 ── VIP 198.51.100.10 ── Director-1/2
                                              ├─ RS-1 192.0.2.21
                                              ├─ RS-2 192.0.2.22
                                              └─ RS-3 192.0.2.23
```

Director-1/2 通过 VRRP 提供 VIP，RS 运行同版本服务。NAT、DR、TUN 分别在独立实验窗口验证，不要在同一 VIP 上混用模型。

## 预检

检查内核 IPVS 模块、转发、rp_filter、网卡 MTU、时钟、ARP、firewall 和后端健康。保存所有节点的 `ip addr`、`ip route`、`sysctl -a`、`ipvsadm -Sn` 和规则集。

## 测试矩阵

| 测试 | 观察项 | 通过标准 |
| --- | --- | --- |
| 1000 并发短连接 | 新建连接率、P99、conntrack | 无异常重传，分布符合算法 |
| 停止 RS-1 | IPVS 权重、5xx | 新连接不再进入故障节点 |
| 阻断 VRRP | VIP、ARP、收敛时间 | 唯一 MASTER，业务快速恢复 |
| Director 断电 | 旧连接、新连接 | 旧连接按预期失败，新连接恢复 |

故障后按“隔离→取证→恢复规则→验证后端→恢复 VIP”顺序执行。不要在两台 Director 同时持有 VIP 时刷新 ARP 或清空连接表。

