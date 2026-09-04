# Kubernetes Ingress 与存储实战

Ingress 只描述路由规则，必须有 Ingress Controller 才能实际处理流量。生产配置应明确 TLS Secret、默认后端、超时、访问日志和限流策略。

```bash
kubectl get ingress -A
kubectl describe ingress <NAME> -n <NS>
kubectl get storageclass,pv,pvc -A
```

PVC 绑定成功不等于应用具备正确权限；要验证挂载、读写、扩容、备份和故障域。StatefulSet 的数据恢复必须结合存储快照和应用一致性。
