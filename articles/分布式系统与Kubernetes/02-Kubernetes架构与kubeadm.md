# Kubernetes 架构与 kubeadm

控制平面由 API Server、etcd、Scheduler 和 Controller Manager 组成，节点由 kubelet、容器运行时和 kube-proxy 组成。生产初始化前规划 Pod/Service CIDR、DNS、证书、etcd 备份和节点故障域。

```bash
kubeadm init --pod-network-cidr=<POD_CIDR>
kubectl get nodes -o wide
kubectl get componentstatuses 2>/dev/null || true
```

版本、运行时和 CNI 必须匹配；不要在未规划证书和 etcd 恢复的情况下直接扩容控制平面。
