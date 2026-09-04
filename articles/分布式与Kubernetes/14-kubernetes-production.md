# Kubernetes 生产平台：CNI、策略、存储、RBAC、升级与灾备

## 1. 控制面与数据面

Kubernetes 控制面由 API Server、etcd、Scheduler、Controller Manager 组成；节点运行 kubelet、容器运行时和 CNI。API Server 是所有状态变更的入口，etcd 是一致性数据源。生产拓扑要隔离控制面网络、etcd 磁盘、节点业务网和入口流量，并为每类故障定义替代路径。

```bash
kubectl cluster-info
kubectl get --raw='/readyz?verbose'
kubectl get nodes -o wide
kubectl get --raw='/metrics' | head
```

## 2. CNI、NetworkPolicy 与 Ingress

CNI 负责 Pod 地址分配、路由和网络策略实现；NetworkPolicy 默认不生效，必须先设置 namespace 默认拒绝，再按应用端口、命名空间和身份放行。Ingress Controller 终止 TLS 或透传请求，证书、真实客户端 IP、超时和 WebSocket 参数要显式定义。

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata: {name: api-default-deny, namespace: prod}
spec:
  podSelector: {}
  policyTypes: [Ingress, Egress]
```

排障顺序为 Pod IP/路由→Service Endpoints→NetworkPolicy→Ingress 规则→外部负载均衡。不要只在应用容器中执行 curl；同时从同 namespace、跨 namespace 和入口节点验证，才能定位策略或 DNS 问题。

## 3. 工作负载、资源与存储

Deployment 用于无状态滚动发布，StatefulSet 用于稳定身份和有序存储；requests 参与调度，limits 触发 cgroup 限制，过低会 OOM、过高会造成碎片。PodDisruptionBudget、拓扑分布和反亲和性用于降低维护与单故障域风险。

PV/PVC/StorageClass 的回收策略要和数据价值匹配；数据库卷必须验证 fsync、快照一致性、扩容和恢复。ConfigMap/Secret 不等于密钥管理系统，生产应配合 KMS、外部 Secret Store 和审计。

## 4. RBAC、审计与升级

RBAC 按 namespace、ServiceAccount 和 verb/resource 最小授权，禁止把 `cluster-admin` 绑定给应用。启用 API 审计并对读取 Secret、创建特权 Pod、修改 RBAC 和 exec 操作告警。升级前核对版本偏差、API 弃用、CNI/CSI/Ingress 兼容矩阵，先在 canary 节点执行并保留 drain 回滚路径。

## 5. etcd 备份与故障演练

etcd 备份必须加密、跨故障域保存并定期恢复验证。恢复流程是停止不安全写入→确认快照版本与成员列表→恢复到隔离集群→检查对象、证书、RBAC 和业务探针→再切换控制面。不要把在线 etcd 数据目录复制到另一集群直接启动。

```bash
ETCDCTL_API=3 etcdctl snapshot save /backup/etcd.db \
  --endpoints=https://127.0.0.1:2379 \
  --cacert=/etc/kubernetes/pki/etcd/ca.crt \
  --cert=/etc/kubernetes/pki/etcd/peer.crt \
  --key=/etc/kubernetes/pki/etcd/peer.key
ETCDCTL_API=3 etcdctl snapshot status /backup/etcd.db -w table
```

演练节点宕机、CNI 故障、Ingress 证书过期、PVC 挂载失败、RBAC 误配、控制面不可用和 etcd 恢复。每次记录业务 RTO/RPO、Pod 重调度时间、数据校验和权限回归结果。

