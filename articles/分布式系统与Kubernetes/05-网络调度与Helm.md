# Kubernetes 网络、调度与 Helm

CNI 负责 Pod 网络，Service 提供服务发现；NetworkPolicy 控制东西向访问。调度由资源请求、节点选择、亲和性、污点和容忍度共同决定。

```bash
kubectl get nodes --show-labels
kubectl get networkpolicy -A
helm list -A
helm history <RELEASE> -n <NS>
```

Helm Chart 必须版本化并经过 lint、渲染、测试和审批；回滚后仍需验证数据库迁移和外部依赖，不能只看 Pod 为 Running。
