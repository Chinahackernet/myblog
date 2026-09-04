# LVS NAT 与 DR 模型实战

## NAT 模型

调度器同时承担请求转发和响应回程，配置简单但吞吐受调度器网卡和连接跟踪能力限制。规划时必须确认后端默认网关指向调度器。

## DR 模型

调度器只改写二层目标地址，响应由 Real Server 直接返回客户端。后端需要把 VIP 配置在 `lo` 并抑制 ARP，交换网络还要确认 VLAN 和 MAC 学习策略。

```bash
ipvsadm -A -t <VIP>:80 -s wrr
ipvsadm -a -t <VIP>:80 -r <RS_IP>:80 -g -w 1
ipvsadm -Ln --stats
```

上线前逐台摘除、加入并验证健康检查；回滚按“停止新流量—确认连接排空—恢复旧路径”执行。
