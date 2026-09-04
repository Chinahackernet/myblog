# Kubernetes 工作负载与 Service

Deployment 管理无状态副本，StatefulSet 管理稳定身份，DaemonSet 管理节点级代理，Job/CronJob 管理一次性任务。Service 提供稳定访问入口，Ingress 负责 HTTP/HTTPS 路由。

```bash
kubectl get pod,svc,deploy -A
kubectl describe pod <POD> -n <NS>
kubectl logs <POD> -n <NS> --previous
```

排障按 Pod 状态、事件、探针、资源、网络和依赖顺序进行；发布使用滚动策略并验证回滚。
