# Kubernetes 升级、etcd 备份与故障演练

## 1. 升级原则

控制面、节点、CNI、CSI、Ingress 和 admission webhook 必须有版本兼容矩阵。升级前冻结高风险变更，确认集群健康、PDB、空闲容量、镜像可用和回滚快照；一次只升级一个故障域。

```bash
kubectl get --raw='/readyz?verbose'; kubectl get nodes; kubectl get pdb -A
```

先升级控制面，再按批次 drain 节点：`kubectl drain node-1 --ignore-daemonsets --delete-emptydir-data`。升级后检查调度、DNS、CNI、存储挂载、Ingress 和业务 SLO。

## 2. etcd 备份

etcd 备份要使用一致性快照、加密存储和异地副本，并记录集群版本、endpoint、证书和快照 hash。

```bash
ETCDCTL_API=3 etcdctl --endpoints=https://127.0.0.1:2379 --cacert=ca.crt --cert=client.crt --key=client.key snapshot save etcd.db
ETCDCTL_API=3 etcdctl snapshot status etcd.db
```

恢复必须在隔离集群进行，验证对象数量、RBAC、Secret、PV 引用和控制器行为后再决定切换。不得把快照直接覆盖在线 etcd。

## 3. 故障演练

演练 API Server 不可用、etcd 单节点/多数派故障、CNI 中断、节点磁盘满、证书过期和误删 Deployment。每次记录探测、告警、升级路径、RTO、数据损失和回切条件。演练结束后清理临时权限与资源。

## 升级验收门禁

控制面升级后运行 API discovery、Webhook、Scheduler、Controller Manager 和 DNS 合成测试；节点升级后检查 kubelet、容器运行时、CNI/CSI、日志和时钟。PDB 只限制自愿驱逐，不能保证硬件故障时仍有副本，故障域和副本数必须单独设计。

etcd 恢复后的集群不等于业务恢复：需要重新确认 Secret、ConfigMap、PV 引用、Ingress、RBAC、CronJob 和外部依赖。恢复快照时保存原集群证书和成员信息，使用隔离网络防止旧成员误加入。

证书、镜像仓库和 admission 依赖在升级前做离线验证；如果升级卡在 drain，先处理 PDB、local data、daemonset 和 long-running connection，不要直接 `--force` 破坏业务。
