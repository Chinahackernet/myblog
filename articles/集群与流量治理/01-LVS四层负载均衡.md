# LVS 四层负载均衡

LVS 工作在传输层，通过 IPVS 将连接调度到 Real Server。常见模型有 NAT、DR 和 TUN；生产优先根据网络拓扑、回程路径和运维复杂度选择。

## 设计检查

- 明确 VIP、协议、端口、Real Server 和健康检查方式。
- DR 模式要求后端对 VIP 做隐藏绑定，并保证响应从正确网关返回。
- 记录调度算法（rr、wrr、lc、wlc）与连接超时策略。

## 验证

```bash
ipvsadm -Ln --stats
ss -s
curl -sS http://<VIP>/health
```

故障时沿 VIP→调度器→Real Server→回程路径逐层检查，不要只在调度器上抓包。
