# LVS NAT/DR/TUN 多节点与调度器高可用

## 1. 数据路径与模式选择

LVS 在内核 IPVS 层工作，调度器只处理连接元组，后端服务处理应用协议。NAT 模式由 Director 双向改写地址，部署简单但回包经过 Director；DR 模式只改写二层目的 MAC，后端直接回客户端，吞吐更高；TUN 模式以 IP-in-IP 封装，适合跨三层网络但要求后端支持隧道。

| 模式 | 回包路径 | 约束 | 典型场景 |
| --- | --- | --- | --- |
| NAT | RS→Director→Client | Director 带宽成为瓶颈 | 小规模、地址隔离 |
| DR | RS→Client 直回 | 同二层、抑制 ARP | 高吞吐 Web |
| TUN | RS 经隧道直回 | MTU、隧道和路由 | 跨网段 |

## 2. NAT 实验骨架

```bash
sysctl -w net.ipv4.ip_forward=1; ipvsadm -A -t 198.51.100.10:80 -s sh; ipvsadm -a -t 198.51.100.10:80 -r 192.0.2.21:80 -m; ipvsadm -a -t 198.51.100.10:80 -r 192.0.2.22:80 -m
```

生产必须配置反向路径过滤、conntrack 容量、超时和健康检查。用 `ipvsadm -Ln --stats --rate` 验证连接数、包速率和调度分布，后端用抓包确认源地址符合预期。

## 3. DR/TUN 关键细节

DR 后端在 loopback 配置 VIP，并关闭 VIP 接口 ARP 响应：`arp_ignore=1`、`arp_announce=2`。Director 和 RS 的 MTU、VLAN、网卡 offload 必须一致。TUN 模式验证 `ip tunnel`、路由、封装开销和防火墙放行，避免因 MTU 黑洞造成间歇性超时。

## 4. 连接追踪与容量

IPVS 连接表和 Netfilter conntrack 是两个容量面。`nf_conntrack_count` 接近 `nf_conntrack_max` 时会丢包；TIME_WAIT、短连接和大连接超时会放大表项。按峰值新建连接率、平均保持时间和安全余量估算，而不是盲目调大。

```bash
ipvsadm -Ln --stats; sysctl net.netfilter.nf_conntrack_count net.netfilter.nf_conntrack_max; ss -s
```

## 5. Director 高可用

两台 Director 用 Keepalived 提供 VIP，但要避免“VIP 在主机上、IPVS 表为空”的假活。状态脚本必须同时检查 IPVS 规则、后端健康、内核转发和本地服务；降级时先撤 VIP，再清理连接。会话保持需评估源地址、持久化模板和故障切换时的连接重建。

## 故障排查

1. VIP 不通：查 ARP/邻居和交换机 VLAN。
2. 连接建立后超时：区分回程路由、rp_filter、MTU 与 conntrack。
3. 分布不均：核对调度算法、持久化模板和后端权重。
4. 切换后旧连接失败：这是连接状态不复制的预期，应用必须支持重试。

## 验收

压测 NAT/DR/TUN 的新建连接、吞吐和 P99；拔掉 Director、RS、交换链路分别演练，记录 VIP 收敛时间、失败连接比例和回切影响。

## 多节点演练

实验至少包含两台 Director、三台 RS 和一台客户端。先固定客户端源端口，分别压测短连接与长连接，观察 IPVS 连接表、conntrack 表、网卡 PPS 和 CPU softirq。NAT 重点测 Director 出入口带宽；DR 重点测 ARP 抑制、回程路由和交换机 MAC 学习；TUN 重点测 MTU、封装开销和跨网段 ACL。

调度器高可用不能只测试 VIP 漂移：在主 Director 上清空 IPVS 表、停止健康脚本、阻断 VRRP 三种情况下分别切换。后备 Director 接管后验证新连接分布、旧连接失败比例和应用重试；记录收敛时间并以业务 SLO 判断是否可接受。

变更前保存 `ipvsadm -Sn`、sysctl、路由和 firewall 状态。回滚顺序是恢复上一份规则、确认后端健康、再恢复 VIP；若两台 Director 同时持有 VIP，先在交换机或 fencing 层隔离一台，禁止同时刷新 ARP。
