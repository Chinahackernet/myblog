# Kubernetes CNI、NetworkPolicy 与 Ingress Controller

## 1. 网络分层

CNI 为 Pod 配置接口和路由；Service 提供稳定虚拟地址；Ingress Controller 处理 HTTP/TLS 入口。先画清 Pod-to-Pod、Pod-to-Service、Node-to-External 三条路径，再定位策略或路由问题。

```bash
kubectl get pods -A -o wide; kubectl get svc,ingress -A; kubectl describe pod <name>
```

## 2. NetworkPolicy

默认拒绝后按命名空间、标签、端口和方向放行，策略要覆盖 DNS、监控、镜像仓库和必要的控制面流量。

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata: {name: api-default-deny, namespace: prod}
spec:
  podSelector: {}
  policyTypes: [Ingress, Egress]
```

不同 CNI 对策略、主机网络、加密和可观测性的实现不同；上线前用拒绝/允许矩阵和临时诊断 Pod 测试。

## 3. Ingress 与 TLS

Ingress Controller 以 Deployment/DaemonSet 运行，证书存入 Secret 并自动续期。配置请求体、超时、WebSocket、源地址和速率限制时，要与后端和外部负载均衡器一致。管理面和 admission webhook 不应暴露公网。

## 故障演练

分别阻断 CNI、删除 Endpoint、耗尽 NodePort、过期证书和拒绝策略，观察事件、控制器日志、连接追踪和业务探针。修复顺序先恢复网络可达，再恢复应用路由，最后收紧策略。

## CNI 选型与排查顺序

选型比较 Pod 地址规模、BGP/overlay、加密、NetworkPolicy、eBPF 可观测性、Windows/裸机支持和升级路径。排查从 DNS、Pod 路由、Service Endpoint、kube-proxy/eBPF 规则、节点防火墙到外部 LB 逐层收敛；不要在应用容器内凭 `curl` 结果猜测 CNI 状态。

Ingress 入口应设置 body size、header 数量、连接/请求超时和速率限制，且把真实客户端地址限制在可信代理链。证书 Secret 轮换后检查 Controller reload、旧连接和 OCSP；WebSocket 要验证长连接排空和跨节点回程。

NetworkPolicy 上线先以审计/观测模式生成候选规则，再切换默认拒绝。任何临时 debug Pod、hostNetwork 或特权容器都要设置过期时间并纳入审计。
