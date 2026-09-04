# Kubernetes 工作负载、Pod 控制器与 Service

## 控制器语义

Deployment 管理无状态 ReplicaSet，StatefulSet 提供稳定身份和卷绑定，DaemonSet 负责每节点副本，Job/CronJob 表达一次性任务。控制器只保证期望状态，不保证应用已经完成业务初始化。

```yaml
apiVersion: apps/v1
kind: Deployment
metadata: {name: api, namespace: prod}
spec:
  replicas: 3
  strategy: {type: RollingUpdate, rollingUpdate: {maxUnavailable: 0, maxSurge: 1}}
  selector: {matchLabels: {app: api}}
  template:
    metadata: {labels: {app: api}}
    spec:
      containers:
        - name: api
          image: registry.example.com/api@sha256:<digest>
          resources: {requests: {cpu: 100m, memory: 256Mi}, limits: {cpu: 1, memory: 1Gi}}
          readinessProbe: {httpGet: {path: /ready, port: 8080}}
```

## Service 与发布

ClusterIP 提供集群内稳定地址，NodePort/LoadBalancer 连接外部入口；EndpointSlice 反映真实后端。滚动发布同时设置 readiness、startup、PDB、优雅终止和 preStop，避免把“进程已启动”误判成可接流量。

## 排障

按 Pod 状态、事件、探针、Service selector、EndpointSlice、DNS、网络策略和入口控制器顺序定位。ImagePullBackOff 查镜像权限和 digest；CrashLoopBackOff 查退出码、配置、资源和依赖；Pending 查调度、污点、配额和卷。

