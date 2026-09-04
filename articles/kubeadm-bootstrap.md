# kubeadm 初始化 Kubernetes 集群

## 前置条件

所有节点统一时间、主机名、内核转发、cgroup、容器运行时和 swap 策略；控制面、节点、Pod 网段和 Service 网段不能重叠。版本、镜像仓库和 CNI 先做离线可用性检查。

```bash
kubeadm config images list --kubernetes-version v1.30.0; kubeadm init --config kubeadm-config.yaml --upload-certs; kubectl get nodes
```

初始化后安装 CNI，复制 admin kubeconfig 到受控位置，加入其他控制面和 worker。不要把 admin.conf 发给普通运维人员；使用独立 ServiceAccount、RBAC 和审计。

验证 API readyz、DNS、CNI、CoreDNS、节点 NotReady、证书有效期、etcd 快照和业务 Pod 调度。初始化失败先清理临时节点或重装快照，禁止在不清楚状态时重复 init。

