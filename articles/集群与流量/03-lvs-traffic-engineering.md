# LVS 流量工程：NAT、DR、TUN、连接追踪与调度器高可用

## 1. 数据路径与选型

LVS/IPVS 在内核中完成四层连接调度。NAT 模式由调度器双向改写地址，部署简单但回包经过调度器，带宽和连接追踪压力集中；DR 模式只改写二层目的 MAC，后端直接从真实网卡回包，要求后端抑制 ARP 并处于同一二层；TUN 模式通过 IP 隧道跨网段转发，后端必须支持隧道和正确 MTU。

```text
client -> VIP:443 -> director-01/02 -> real-server-01..N
                         | NAT: 双向经过 director
                         | DR: 请求经 director，响应经 real server
                         | TUN: 请求封装后到远端 real server
```

选型必须结合东西向带宽、故障域、MTU、源地址可见性、会话保持和运维复杂度。不要因为 DR 吞吐高就忽略 ARP、交换机端口安全和回程路由要求。

## 2. IPVS 配置与验证

以内核工具 `ipvsadm` 为例，生产应将规则纳入配置管理，并在启动时恢复。调度算法（rr、wrr、lc、sh、sed）必须用真实流量验证；短连接、长连接和大文件的权重需求不同。

```bash
sysctl -w net.ipv4.ip_forward=1
ipvsadm -A -t 10.20.0.100:443 -s sh
ipvsadm -a -t 10.20.0.100:443 -r 10.20.0.11:443 -m   # NAT
ipvsadm -a -t 10.20.0.100:443 -r 10.20.0.12:443 -g   # DR
ipvsadm -Ln --stats --rate
conntrack -S
```

健康检查必须是应用级探针，失败后立即摘除 Real Server，并在恢复稳定窗口后再加回。`ipvsadm -Ln --stats` 只证明连接分发，不证明后端业务成功。

## 3. NAT、DR、TUN 多节点演练

NAT 实验先确认 director 的内外网卡和后端默认网关指向 director；后端只允许来自业务源和 director 的流量。DR 实验中 VIP 同时配置在 lo 上，设置 `arp_ignore=1`、`arp_announce=2`，并验证交换机不会学习错误 MAC。TUN 实验需要 `ip tunnel`、路由和 MTU 校验。

```bash
sysctl -w net.ipv4.conf.all.arp_ignore=1
sysctl -w net.ipv4.conf.all.arp_announce=2
curl -sk --resolve shop.example:443:10.20.0.100 https://shop.example/health
tcpdump -ni eth0 'arp or host 10.20.0.100'
```

## 4. 连接追踪与容量

NAT 和防火墙依赖 conntrack。容量估算应使用峰值新建连接率、连接平均时长和安全余量：`并发连接 ≈ 新建连接率 × 平均保持秒数`。检查 `nf_conntrack_count/max`、SYN backlog、TIME_WAIT、端口耗尽和丢包；不能简单把 `nf_conntrack_max` 调到很大而忽略内存。

```bash
sysctl net.netfilter.nf_conntrack_count net.netfilter.nf_conntrack_max
ss -s
nstat -az | egrep 'Tcp|Ip'
```

调整超时前先识别业务协议；过短会误杀长连接，过长会放大故障时残留。大规模变更要分批并观察 CPU、内存和新建连接错误。

## 5. 调度器高可用与脑裂

两台 director 使用 Keepalived/VRRP 提供 VIP，状态同步要区分“VIP 所有权”和“IPVS 连接状态”。配置 `track_script` 检查 IPVS、上游探针和关键网卡；优先级切换要有抖动抑制。双主脑裂会导致 ARP 震荡和连接不一致，必须用交换机探测、BFD、云厂商健康检查或 fencing 机制避免双活。

演练顺序：记录当前 VIP/MAC 和连接计数→停止主节点服务→确认 VIP 收敛→执行业务探针和长连接测试→恢复节点但不立即抢占→确认连接与日志→回切。恢复后检查旧节点是否仍响应 VIP，防止“看似切换、实际双答复”。

## 验收标准

- NAT、DR、TUN 三种路径均有抓包证据和回程路径说明。
- Real Server 摘除、恢复、权重调整不造成错误路由。
- conntrack、SYN backlog、端口和带宽有容量阈值与告警。
- director 故障切换满足目标 RTO，且无双主、VIP 漂移循环和未授权后端暴露。

