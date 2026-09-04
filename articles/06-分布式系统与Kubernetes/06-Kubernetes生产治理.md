# Kubernetes 生产治理

## 资源与可靠性

每个工作负载设置 requests/limits、readiness/liveness/startup 探针、PodDisruptionBudget 和副本策略。requests 影响调度，limits 影响运行时上限，不能照抄默认值。

## 发布与回滚

```bash
kubectl rollout status deploy/<APP> -n <NS>
kubectl rollout history deploy/<APP> -n <NS>
kubectl rollout undo deploy/<APP> -n <NS>
```

发布前验证镜像、配置、迁移和权限；回滚后确认数据库兼容性、队列积压和外部依赖。etcd 备份、审计、RBAC 和 NetworkPolicy 必须定期演练。
