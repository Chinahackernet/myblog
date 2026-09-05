# Prometheus Operator自定义监控项

> 分类：Prometheus / 第9章：Prometheus Operator
> 原文：https://www.cuiliangblog.cn/detail/section/163023458
> 来源：崔亮的博客

---

Prometheus Operator默认的监控指标并不能完全满足实际的监控需求，这时候就需要我们自己根据业务添加自定义监控。添加一个自定义监控的步骤如下：  
1. 创建一个ServiceMonitor对象，用于Prometheus添加监控项  
2. 为ServiceMonitor对象关联metrics数据接口的Service对象  
3. 确保Services对象可以正确获取到metrics数据

下面本文将以如何添加redis监控为例

# 部署redis
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: redis
---
apiVersion: apps/v1
kind: Deployment
metadata:
  namespace: redis
  name: redis
spec:
  replicas: 1
  selector:
    matchLabels:
      app: redis
  template:
    metadata:
      labels:
        app: redis
    spec:
      containers:
      - name: redis
        image: redis
        resources:
          requests:
            cpu: 100m
            memory: 100Mi
        ports:
        - containerPort: 6379
      - name: redis-exporter
        image: oliver006/redis_exporter
        resources:
          requests:
            cpu: 100m
            memory: 100Mi
        ports:
        - containerPort: 9121
```

部署redis的同时，我们把redis_exporter以sidecar的形式和redis服务部署在用一个Pod

# 创建 Redis Service
```yaml
apiVersion: v1
kind: Service
metadata:
  name: redis-svc
  namespace: redis
  labels: # 一定要写，后面通过这个标签匹配
    app: redis
spec:
  type: NodePort
  ports:
  - name: redis
    port: 6379
    targetPort: 6379
  - name: redis-exporter
    port: 9121
    targetPort: 9121
  selector:
    app: redis
```

检查下部署好的服务

```bash
[root@tiaoban ~]# kubectl get all -n redis 
NAME                         READY   STATUS    RESTARTS   AGE
pod/redis-64bbcc859b-fr6gc   2/2     Running   0          111s

NAME                TYPE       CLUSTER-IP      EXTERNAL-IP   PORT(S)                         AGE
service/redis-svc   NodePort   10.104.106.59   <none>        6379:31796/TCP,9121:30687/TCP   26s

NAME                    READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/redis   1/1     1            1           111s

NAME                               DESIRED   CURRENT   READY   AGE
replicaset.apps/redis-64bbcc859b   1         1         1       111s
```

验证metrics

```bash
[root@rocky /]# curl 10.104.106.59:9121/metrics
# HELP go_gc_duration_seconds A summary of the pause duration of garbage collection cycles.
# TYPE go_gc_duration_seconds summary
go_gc_duration_seconds{quantile="0"} 0
go_gc_duration_seconds{quantile="0.25"} 0
go_gc_duration_seconds{quantile="0.5"} 0
go_gc_duration_seconds{quantile="0.75"} 0
go_gc_duration_seconds{quantile="1"} 0
go_gc_duration_seconds_sum 0
go_gc_duration_seconds_count 0
# HELP go_goroutines Number of goroutines that currently exist.
# TYPE go_goroutines gauge
go_goroutines 8
# HELP go_info Information about the Go environment.
# TYPE go_info gauge
go_info{version="go1.17.5"} 1
............
```

# 创建 ServiceMonitor
现在 Prometheus 访问redis，接下来创建 ServiceMonitor 对象即可  
prometheus-serviceMonitorRedis.yaml

```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: redis-exporter # ServiceMonitor名称
  namespace: monitoring # ServiceMonitor所在名称空间
spec:
  jobLabel: redis # # job名称
  endpoints: # prometheus所采集Metrics地址配置，endpoints为一个数组，可以创建多个，但是每个endpoints包含三个字段interval、path、port
  - port: redis-exporter # prometheus采集数据的端口，这里为port的name，主要是通过spec.selector中选择对应的svc，在选中的svc中匹配该端口
    interval: 30s # prometheus采集数据的周期，单位为秒
    scheme: http # 协议
    path: /metrics # prometheus采集数据的路径
  selector: # svc标签选择器，匹配service的labels
    matchLabels:
      app: redis
  namespaceSelector: # namespace选择
    matchNames:
    - redis
```

执行创建并查看-serviceMonitor

```bash
[root@]# kubectl apply -f prometheus-serviceMonitorRedis.yaml
servicemonitor.monitoring.coreos.com/redis-k8s created

[root@tiaoban ~]# kubectl describe serviceMonitor -n monitoring redis-exporter
Name:         redis-exporter
Namespace:    monitoring
Labels:       <none>
Annotations:  <none>
API Version:  monitoring.coreos.com/v1
Kind:         ServiceMonitor
Metadata:
  Creation Timestamp:  2024-03-24T08:28:51Z
  Generation:          1
  Resource Version:    1803744
  UID:                 a3b91318-8549-490b-875d-9e06b2636745
Spec:
  Endpoints:
    Interval:  30s
    Path:      /metrics
    Port:      redis-exporter
    Scheme:    http
  Job Label:   redis
  Namespace Selector:
    Match Names:
      redis
  Selector:
    Match Labels:
      App:  redis
Events:     <none>
```

也可以先创建 service monitor，然后再给 service 打上一个和 serviceMonitor 一样的 label

```bash
kubectl label svc monitoring redis-exporter app=redis
```

# 异常解决
查看Prometheus日志，发现如下报错：

```bash
ts=2024-03-24T08:46:17.028Z caller=klog.go:116 level=error component=k8s_client_runtime func=ErrorDepth msg="pkg/mod/k8s.io/client-go@v0.28.6/tools/cache/reflector.go:229: Failed to watch *v1.Endpoints: failed to list *v1.Endpoints: endpoints is forbidden: User \"system:serviceaccount:monitoring:prometheus-k8s\" cannot list resource \"endpoints\" in API group \"\" in the namespace \"redis\""
```

将 prometheus-clusterRole.yaml 改为下面的配置

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  labels:
    app.kubernetes.io/component: prometheus
    app.kubernetes.io/instance: k8s
    app.kubernetes.io/name: prometheus
    app.kubernetes.io/part-of: kube-prometheus
    app.kubernetes.io/version: 2.54.1
  name: prometheus-k8s
rules:
- apiGroups:
  - ""
  resources:
  - nodes
  - services
  - endpoints
  - pods
  - nodes/proxy
  - nodes/metrics
  verbs:
  - get
  - list
  - watch
- apiGroups:
  - ""
  resources:
  - configmaps
  - nodes/metrics
  verbs:
  - get
- nonResourceURLs:
  - /metrics
  - /metrics/slis
  verbs:
  - get

```

重新部署即可

```bash
kubectl apply -f prometheus-clusterRole.yaml
```

查看targets

![](assets/02-Prometheus/50e3b4be7d09e017810b.png)

# 外部资源监控
将外部资源引入k8s中创建svc资源，然后通过 ServiceMonitor 方式监控。

```yaml
apiVersion: v1
kind: Service
metadata:
  name: external-node-exporter
  namespace: monitoring
  labels:
    app: external-node-exporter
    app.kubernetes.io/name: node-exporter
spec:
  type: ClusterIP
  ports:
  - name: metrics
    port: 9100
    protocol: TCP
    targetPort: 9100
---
apiVersion: v1
kind: Endpoints
metadata:
    name: external-node-exporter
    namespace: monitoring
    labels:
      app: external-node-exporter
      app.kubernetes.io/name: node-exporter
subsets:
- addresses:
  - ip: 192.168.10.100  # 这里是外部的资源列表
  ports:
  - name: metrics
    port: 9100
---
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: external-node-exporter
  namespace: monitoring
  labels:
    app: external-node-exporter
    release: prometheus
spec:
  selector:
    matchLabels:            # Service选择器
      app: external-node-exporter
  namespaceSelector:        # Namespace选择器
    matchNames:
    - monitoring
  endpoints:
  - port: metrics           # 采集节点端口（svc定义）
    interval: 10s           # 采集频率根据实际需求配置，prometheus默认15s
    path: /metrics          # 默认地址/metrics
    relabelings:            # 新增ip标签
    - sourceLabels: [__address__]
      regex: '([^:]+):.*'
      targetLabel: 'ip'
      replacement: '$1'
```

查看验证

![](assets/02-Prometheus/ce69186f93510b15933d.png)


