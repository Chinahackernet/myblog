# Kubernetes PV/PVC、RBAC、审计与多租户

## 1. 存储生命周期

PV 描述实际存储，PVC 是命名空间内的申请，StorageClass 定义动态供给和回收策略。`Delete` 回收策略可能删除底层数据，生产数据库通常使用 `Retain` 并由备份系统管理。

```bash
kubectl get sc,pv,pvc -A; kubectl describe pvc data-api
```

StatefulSet 的稳定身份和卷绑定不能替代数据库复制。扩容前验证 CSI 快照、克隆、拓扑感知、IOPS 和故障域。

## 2. RBAC 与服务账户

默认拒绝，按命名空间和资源动作授予 Role/RoleBinding；禁止给业务 Pod `cluster-admin`。关闭自动挂载不需要的 token，启用短期 projected token，定期审计 `kubectl auth can-i`。

## 3. 审计与多租户

审计策略记录认证主体、请求资源、响应码和来源，敏感对象按 Metadata 级别采集。资源配额、LimitRange、Pod Security Admission、命名空间网络隔离和节点污点共同形成租户边界。

## 验收

创建普通服务账户，验证只能读写指定资源；删除 PVC、节点故障、CSI 恢复和审计查询分别演练，确认数据保留策略和权限无越界。

## 存储故障树

PVC Pending 先查 StorageClass、拓扑、配额和 CSI controller；挂载失败再查节点插件、权限、设备和文件系统；I/O 超时则区分存储后端、网络和应用 fsync。恢复期间禁止强制删除 Pod 或 PVC，除非已确认不会触发底层数据删除。

RBAC 审计按主体、动词、资源和命名空间聚合，定期清理不再使用的 RoleBinding。Webhook、CSI 和监控组件所需的 cluster-wide 权限要用资源级约束和网络隔离补偿。Secret 只在必要命名空间可读，备份和审计日志同样加密。

多租户容量使用 ResourceQuota、LimitRange、PriorityClass 和 PodDisruptionBudget 联动；配额不能只限制 CPU/内存，还要限制 PVC、LoadBalancer、NodePort 和对象数量，防止控制面被资源洪峰拖垮。
