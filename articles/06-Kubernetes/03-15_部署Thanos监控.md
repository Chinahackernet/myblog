# 部署Thanos监控

> 分类：Kubernetes / 第3章：周边组件安装部署
> 原文：https://www.cuiliangblog.cn/detail/section/215968508
> 来源：崔亮的博客

---

# Thanos 介绍
## Prometheus 痛点
prometheus的单机痛点简单来说就是存在性能瓶颈，不得不降低采集频率，丢弃部分指标，缩小数据过去时间。想要实现水平扩容只能按服务进行拆分，或者服务分片。为了解决数据分散问题，可以指定远程集中存储，但抛弃了强大的promQL。上述方案虽然解决了prometheus的痛点，但是极大的提高了运维使用难度。针对这些问题上述问题，最好的方式办法是采用Thanos 的架构解决。

## thanos 架构
Sidecar模式：绑定部署在Prometheus 实例上，当进行查询时，由thanos sidecar返回监控数据给Thanos QueryT对数据进行聚合与去重。最新的监控数据存放于Prometheus 本机（适用于Sidecar数量少，单个prometheus集群，查询响应快的场景）

![](assets/06-Kubernetes/4dbdca08c1a728694101.png)

Receive模式:Prometheus 实例实时将数据 push 到 Thanos Receiver，最新数据也得以集中起来，然后 Thanos Query 也不用去所有 Sidecar 查最新数据了，直接查 Thanos Receiver 即可（适用于集群规模大，多个prometheus节点，跨集群查询响应慢的场景）

![](assets/06-Kubernetes/4d0306a4d0c222ad8c0f.png)

## thanos组件
+ 边车组件（Sidecar）：连接 Prometheus，并把 Prometheus 暴露给查询网关（Querier/Query），以供实时查询，并且可以上传 Prometheus 数据给云存储，以供长期保存
+ 查询网关（Querier/Query）：实现了 Prometheus API，与汇集底层组件（如边车组件 Sidecar，或是存储网关 Store Gateway）的数据
+ 存储网关（Store Gateway）：将对象存储的数据暴露给 Thanos Query 去查询。
+ 压缩器（Compactor）：将对象存储中的数据进行压缩和降低采样率，加速大时间区间监控数据查询的速度。
+ 接收器（Receiver）：从 Prometheus 的 remote-write WAL（Prometheus 远程预写式日志）获取数据，暴露出去或者上传到云存储
+ 规则组件（Ruler）：对监控数据进行评估和告警，还可以计算出新的监控数据，将这些新数据提供给 Thanos Query 查询并且/或者上传到对象存储，以供长期存储。
+ 存储（Bucket）：主要用于展示对象存储中历史数据的存储情况，查看每个指标源中数据块的压缩级别，解析度，存储时段和时间长度等信息。

# 部署 thanos
在部署 thanos 之前，需要先部署 kube-Prometheus，具体可参考文档[03-14_%E9%83%A8%E7%BD%B2Prometheus%E7%9B%91%E6%8E%A7.md](articles/06-Kubernetes/03-14_部署Prometheus监控.md)，

kube-prometheus 内置了大量与 thanos 无缝集成的组件配置，具体可参考文档：[https://github.com/prometheus-operator/prometheus-operator/blob/main/Documentation/platform/thanos.md](https://github.com/prometheus-operator/prometheus-operator/blob/main/Documentation/platform/thanos.md)

## 获取资源清单
```bash
# git clone https://github.com/thanos-io/kube-thanos
# cd kube-thanos    
# ls
all.jsonnet   DCO              jsonnet                kustomization.yaml  manifests
build.sh      example.jsonnet  jsonnetfile.json       LICENSE             minio.jsonnet
CHANGELOG.md  examples         jsonnetfile.lock.json  Makefile            README.md
# cd manifests  
# ls
thanos-query-deployment.yaml                      thanos-receive-router-configmap.yaml
thanos-query-serviceAccount.yaml                  thanos-receive-router-deployment.yaml
thanos-query-serviceMonitor.yaml                  thanos-receive-router-serviceAccount.yaml
thanos-query-service.yaml                         thanos-receive-router-service.yaml
thanos-receive-ingestor-default-service.yaml      thanos-store-serviceAccount.yaml
thanos-receive-ingestor-default-statefulSet.yaml  thanos-store-serviceMonitor.yaml
thanos-receive-ingestor-serviceAccount.yaml       thanos-store-service.yaml
thanos-receive-ingestor-serviceMonitor.yaml       thanos-store-statefulSet.yaml
```

## 部署 query 组件
提取 thanos-query 相关组件资源清单并部署

```bash
# mkdir thanos/thanos-query                                                                              
# cd thanos/thanos-query                                                                                 
# cp -r ../../kube-thanos/manifests/thanos-query* .
# ls                                                                                 
thanos-query-deployment.yaml  thanos-query-serviceAccount.yaml  thanos-query-serviceMonitor.yaml  thanos-query-service.yaml
# kubectl create ns thanos
# deployment.apps/thanos-query created
service/thanos-query created
serviceaccount/thanos-query created
servicemonitor.monitoring.coreos.com/thanos-query created
# kubectl get pod -n thanos                                                          
NAME                            READY   STATUS    RESTARTS   AGE
thanos-query-6f96c66b59-q9zjd   1/1     Running   0          16s
# kubectl get svc -n thanos                                                          
NAME           TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)              AGE
thanos-query   ClusterIP   10.108.204.59   <none>        10901/TCP,9090/TCP   21s
```

创建 ingress 资源

```bash
# cd ..
# mkdir ingress
# cd ingress
# cat thanos-query.yaml
apiVersion: traefik.io/v1alpha1
kind: IngressRoute
metadata:
  name: thanos-query
  namespace: thanos
spec:
  entryPoints:
  - web
  routes:
  - match: Host(`thanos-query.cuiliangblog.cn`)
    kind: Rule
    services:
      - name: thanos-query
        port: 9090
# kubectl apply -f thanos-query.yaml                                                      
ingressroute.traefik.io/thanos-query created
```

访问验证

![](assets/06-Kubernetes/2dd349e0ce131be44085.png)

## 部署 store 组件
store 组件需要使用 s3 对象存储，此处以 minio 对象存储为例，创建 bucket、aksk、并配置权限，具体可参考[03-10_%E9%83%A8%E7%BD%B2MinIO%E5%AF%B9%E8%B1%A1%E5%AD%98%E5%82%A8.md](articles/06-Kubernetes/03-10_部署MinIO对象存储.md)

```yaml
# cd ..
# mkdir thanos-store
# cd thanos-store
# cat thanos-storage-minio.yaml
apiVersion: v1
kind: Secret
metadata:
  name: thanos-objectstorage
  namespace: thanos
type: Opaque
stringData:
  thanos.yaml: |
    type: s3
    config:
      bucket: thanos
      endpoint: minio-service.minio.svc:9000
      access_key: CHANGE_ME
      secret_key: CHANGE_ME
      insecure: true
      signature_version2: false                                                                                 
# kubectl apply -f thanos-storage-minio.yaml                                         
secret/thanos-objectstorage configured
```

store 组件需要使用 pv 持久化存储，先提前创建相关资源

```yaml
# cat thanos-store-pvc.yaml
kind: PersistentVolumeClaim
apiVersion: v1
metadata:
  name: data-thanos-store-0
  namespace: thanos
spec:
  storageClassName: nfs-client
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
# kubectl apply -f thanos-store-pvc.yaml                                             
persistentvolumeclaim/data-thanos-store-0 created
# kubectl get pvc -n thanos                                                          
NAME                  STATUS   VOLUME                                     CAPACITY   ACCESS MODES   STORAGECLASS   VOLUMEATTRIBUTESCLASS   AGE
data-thanos-store-0   Bound    pvc-db9a4b79-c036-4b8a-a9a6-c3f5ae3b282c   10Gi       RWO            nfs-client     <unset>                 5s
```

获取并部署 store 相关资源

```yaml
# cp -r ../../kube-thanos/manifests/thanos-store* .                                  
# ls                                                                                 
thanos-storage-minio.yaml  thanos-store-serviceAccount.yaml  thanos-store-service.yaml
thanos-store-pvc.yaml      thanos-store-serviceMonitor.yaml  thanos-store-statefulSet.yaml
# kubectl apply -f .                                                                 
secret/thanos-objectstorage configured
persistentvolumeclaim/data-thanos-store-0 unchanged
service/thanos-store created
serviceaccount/thanos-store created
servicemonitor.monitoring.coreos.com/thanos-store created
statefulset.apps/thanos-store created
# kubectl get pod -n thanos                                                          
NAME                            READY   STATUS    RESTARTS   AGE
thanos-query-6f96c66b59-q9zjd   1/1     Running   0          16m
thanos-store-0                  1/1     Running   0          24s
# kubectl get svc -n thanos                                                          
NAME           TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)               AGE
thanos-query   ClusterIP   10.108.204.59   <none>        10901/TCP,9090/TCP    16m
thanos-store   ClusterIP   None            <none>        10901/TCP,10902/TCP   30s
```

创建 ingress 资源

```yaml
# cd ../ingress
# cat thanos-store.yaml
apiVersion: traefik.io/v1alpha1
kind: IngressRoute
metadata:
  name: thanos-store
  namespace: thanos
spec:
  entryPoints:
  - web
  routes:
    - match: Host(`thanos-store.cuiliangblog.cn`)
      kind: Rule
      services:
        - name: thanos-store
          port: 10902
# kubectl apply -f thanos-store.yaml                                                      
ingressroute.traefik.io/thanos-store created
```

访问验证

![](assets/06-Kubernetes/dec88f523bb77ceea315.png)

# receive 模式配置
## 配置 pvc 资源
```yaml
# mkdir thanos-receive                                                                            
# cd thanos-receive              
# cat thanos-receive-pvc.yaml           
kind: PersistentVolumeClaim
apiVersion: v1
metadata:
  name: data-thanos-receive-ingestor-default-0
  namespace: thanos
spec:
  storageClassName: nfs-client
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
# kubectl apply -f thanos-receive-pvc.yaml                                         
persistentvolumeclaim/data-thanos-receive-ingestor-default-0 created
# kubectl get pvc -n thanos                                                        
NAME                                     STATUS   VOLUME                                     CAPACITY   ACCESS MODES   STORAGECLASS   VOLUMEATTRIBUTESCLASS   AGE
data-thanos-receive-ingestor-default-0   Bound    pvc-fad30083-9318-41fc-bb0e-b94166e5aa69   10Gi       RWO            nfs-client     <unset>           
      5s
data-thanos-store-0                      Bound    pvc-db9a4b79-c036-4b8a-a9a6-c3f5ae3b282c   10Gi       RWO            nfs-client     <unset>           
      11m
```

## 部署 receive 组件
获取 receive 资源清单

```yaml
# cp -r ../../kube-thanos/manifests/thanos-receive* .                              
# ls                                                                               
thanos-receive-ingestor-default-service.yaml      thanos-receive-ingestor-serviceMonitor.yaml  thanos-receive-router-deployment.yaml
thanos-receive-ingestor-default-statefulSet.yaml  thanos-receive-pvc.yaml                      thanos-receive-router-serviceAccount.yaml
thanos-receive-ingestor-serviceAccount.yaml       thanos-receive-router-configmap.yaml         thanos-receive-router-service.yaml
```

修改 receive 组件配置，默认 receive 组件未配置对象存储相关内容，需要添加配置，才能将指标数据传入 minio 对象存储。

```yaml
# cat thanos-receive-ingestor-default-statefulSet.yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  labels:
    app.kubernetes.io/component: database-write-hashring
    app.kubernetes.io/instance: thanos-receive-ingestor-default
    app.kubernetes.io/name: thanos-receive
    app.kubernetes.io/version: v0.31.0
    controller.receive.thanos.io: thanos-receive-controller
    controller.receive.thanos.io/hashring: default
  name: thanos-receive-ingestor-default
  namespace: thanos
spec:
  ……
      containers:
      - args:
        - receive
        - --log.level=info
        - --log.format=logfmt
        - --grpc-address=0.0.0.0:10901
        - --http-address=0.0.0.0:10902
        - --remote-write.address=0.0.0.0:19291
        - --receive.replication-factor=1
        - --tsdb.path=/var/thanos/receive
        - --tsdb.retention=1d # 本地只保留1天
        - --label=replica="$(NAME)"
        - --label=receive="true"
        - --receive.local-endpoint=$(NAME).thanos-receive-ingestor-default.$(NAMESPACE).svc.cluster.local:10901
        - --receive.hashrings-file=/var/lib/thanos-receive/hashrings.json
        - --objstore.config=$(OBJSTORE_CONFIG) # 新增对象存储相关配置
        env:
        - name: OBJSTORE_CONFIG
          valueFrom: # 使用secret资源
            secretKeyRef:
              key: thanos.yaml
              name: thanos-objectstorage
```

部署 receive

```yaml
# kubectl apply -f .                                                               
service/thanos-receive-ingestor-default created
statefulset.apps/thanos-receive-ingestor-default created
serviceaccount/thanos-receive-ingestor created
servicemonitor.monitoring.coreos.com/thanos-receive-ingestor created
persistentvolumeclaim/data-thanos-receive-ingestor-default-0 unchanged
configmap/hashring-config created
deployment.apps/thanos-receive-router created
service/thanos-receive-router created
serviceaccount/thanos-receive-router created
# kubectl get pod -n thanos                                                        
NAME                                     READY   STATUS    RESTARTS   AGE
thanos-query-6f96c66b59-q9zjd            1/1     Running   0          28m
thanos-receive-ingestor-default-0        1/1     Running   0          26s
thanos-receive-router-77dcc6c74d-cm2rv   1/1     Running   0          26s
thanos-store-0                           1/1     Running   0          12m
# kubectl get svc -n thanos                                                        
NAME                              TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)                         AGE
thanos-query                      ClusterIP   10.108.204.59   <none>        10901/TCP,9090/TCP              28m
thanos-receive-ingestor-default   ClusterIP   None            <none>        10901/TCP,10902/TCP,19291/TCP   31s
thanos-receive-router             ClusterIP   10.98.218.122   <none>        10901/TCP,10902/TCP,19291/TCP   31s
thanos-store                      ClusterIP   None            <none>        10901/TCP,10902/TCP             12m
```

## 更新 prometheus 配置
```yaml
# cat prometheus-prometheus.yaml 
apiVersion: monitoring.coreos.com/v1
kind: Prometheus
metadata:
  labels:
    app.kubernetes.io/component: prometheus
    app.kubernetes.io/instance: k8s
    app.kubernetes.io/name: prometheus
    app.kubernetes.io/part-of: kube-prometheus
    app.kubernetes.io/version: 2.54.1
  name: k8s
  namespace: monitoring
spec:
  ……
  externalLabels: # 修改额外标签，用于区分不同prometheus集群
    cluster: local
  remoteWrite: # 新增远程写入配置，数据写入thanos-receive
  - url: "http://thanos-receive-router.thanos.svc:19291/api/v1/receive"
# kubectl apply -f prometheus-prometheus.yaml      
prometheus.monitoring.coreos.com/k8s configured
```

## 访问验证
thanos-query 关联组件验证，如果显示为空可重启 thanos-query 后重试。

![](assets/06-Kubernetes/910b9c14c7798f13c748.png)

thanos-query 查询指标验证，可以看到指标中新增了 cluster 标签，用于区分不同 Prometheus 集群实例。

![](assets/06-Kubernetes/5914a8f58cc6e4c8591d.png)

访问 thanos-store 测试（默认两个小时生成一个 block 并上传，如果现在没数据可等 2 小时后再次查看）

![](assets/06-Kubernetes/0d6cd7bd5e94384b1373.png)

查看 minio 存储内容

![](assets/06-Kubernetes/20cfcca5ad667904d8ac.png)

# sidecar 模式配置
> sidecar 与 receive 模式二选一，如果使用 sidecar 模式，先卸载 receive 相关资源。
>

## 创建 secret 资源
该 Thanos Sidecar 将把 Prometheus 每 2 小时生成的所有新块备份到对象存储，因此需要先指定对象存储地址信息。

```yaml
# mkdir thanos-sidecar
# cd thanos-sidecar
# cat thanos-objstore-minio.yaml
apiVersion: v1
kind: Secret
metadata:
  name: thanos-objstore-config
  namespace: monitoring
type: Opaque
stringData:
  objectstorage.yaml: |
    type: s3
    config:
      bucket: thanos
      endpoint: minio-service.minio.svc:9000
      access_key: CHANGE_ME
      secret_key: CHANGE_ME
      insecure: true
      signature_version2: false 
# kubectl apply -f thanos-objstore-minio.yaml 
secret/thanos-objstore-config created
```

## 修改 Prometheus 配置
kube-prometheus 只需新增 thanos 配置即可。

```yaml
# vim prometheus-prometheus.yaml
apiVersion: monitoring.coreos.com/v1
kind: Prometheus
metadata:
  labels:
    app.kubernetes.io/component: prometheus
    app.kubernetes.io/instance: k8s
    app.kubernetes.io/name: prometheus
    app.kubernetes.io/part-of: kube-prometheus
    app.kubernetes.io/version: 2.54.1
  name: k8s
  namespace: monitoring
spec:
  ……
  # remoteWrite:
  # - url: "http://thanos-receive-router.thanos.svc:19291/api/v1/receive"
  thanos:
    image: quay.io/thanos/thanos:v0.31.0
    objectStorageConfig:
      key: objectstorage.yaml
      name: thanos-objstore-config
# kubectl apply -f prometheus-prometheus.yaml 
prometheus.monitoring.coreos.com/k8s configured
# kubectl get pod -n monitoring | grep prometheus-k8s                                
prometheus-k8s-0                       3/3     Running   0                58s
prometheus-k8s-1                       3/3     Running   0                58s
```

## 修改 thanos-query 配置
```yaml
# vim thanos-query-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  labels:
    app.kubernetes.io/component: query-layer
    app.kubernetes.io/instance: thanos-query
    app.kubernetes.io/name: thanos-query
    app.kubernetes.io/version: v0.31.0
  name: thanos-query
  namespace: thanos
spec:
  ……
  template:
    ……
    spec:
      ……
      containers:
      - args:
        - query
        …… 
        - --endpoint=dnssrv+_grpc._tcp.prometheus-operated.monitoring.svc.cluster.local:10901 # 新增Prometheus的grpc地址
        # - --endpoint=dnssrv+_grpc._tcp.thanos-receive-ingestor-default.thanos.svc.cluster.local:10901 # 注释receive组件grpc地址
        - --query.auto-downsampling
# kubectl apply -f thanos-query-deployment.yaml 
deployment.apps/thanos-query configured
```

## 访问验证
访问 thanos-query 即可获取 targets 信息以及 Prometheus 实例信息，这点是 receive 模式不具备的功能。

![](assets/06-Kubernetes/442f2a94df30fb35c29a.png)

![](assets/06-Kubernetes/9c492f3489bd51ca23fd.png)

# thanos-rule 安装
在之前安装 kube-prometheus 时已经安装了 prometheus-operator，其中就包含ThanosRuler 的自定义资源，我们只需要启用配置即可。

## 部署 thanos-rule
创建 thanos-rule 配置文件，将告警推送至 alertmanager

```yaml
# cat thanos-ruler-config.yaml
apiVersion: v1
kind: Secret
metadata:
  name: thanosruler-alertmanager-config
  namespace: monitoring
stringData:
  alertmanager-configs.yaml: |-
    alertmanagers:
    - static_configs:
      - "dnssrv+_web._tcp.alertmanager-main.monitoring.svc.cluster.local"
      api_version: v2  
type: Opaque
# kubectl apply -f thanos-ruler-config.yaml               
secret/thanosruler-alertmanager-config created
```

创建 thanos-rule 服务

```yaml
# cat thanos-ruler.yaml
apiVersion: monitoring.coreos.com/v1
kind: ThanosRuler
metadata:
  name: thanos-ruler
  namespace: monitoring
spec:
  image: quay.io/thanos/thanos:v0.31.0
  ruleSelector: # 匹配prometheusrules资源中role=alert-rules的告警规则
    matchLabels: 
      role: alert-rules 
  queryEndpoints: # 连接thanos-query获取指标数据
    - dnssrv+_http._tcp.thanos-query.thanos.svc.cluster.local
  alertmanagersConfig: # 告警推送至alertmanager
    key: alertmanager-configs.yaml
    name: thanosruler-alertmanager-config
# kubectl apply -f thanos-ruler.yaml       
thanosruler.monitoring.coreos.com/thanos-ruler created
```

## 创建 ingress 资源
```yaml
# cat thanos-rule.yaml
apiVersion: traefik.io/v1alpha1
kind: IngressRoute
metadata:
  name: thanos-ruler
  namespace: monitoring
spec:
  entryPoints:
  - web
  routes:
    - match: Host(`thanos-ruler.local.com`)
      kind: Rule
      services:
        - name: thanos-ruler-operated
          port: 10902
# kubectl apply -f thanos-rule.yaml 
ingressroute.traefik.io/thanos-ruler created
```

## 修改 thanos-query 配置
```yaml
# cat thanos-query-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  labels:
    app.kubernetes.io/component: query-layer
    app.kubernetes.io/instance: thanos-query
    app.kubernetes.io/name: thanos-query
    app.kubernetes.io/version: v0.31.0
  name: thanos-query
  namespace: thanos
spec:
  ……
      containers:
      - args:
        - query
        ……
        - --endpoint=dnssrv+_grpc._tcp.thanos-store.thanos.svc.cluster.local:10901
        - --endpoint=dnssrv+_grpc._tcp.prometheus-operated.monitoring.svc.cluster.local:10901 # 新增Prometheus的grpc地址
        # - --endpoint=dnssrv+_grpc._tcp.thanos-receive-ingestor-default.thanos.svc.cluster.local:10901 # 注释receive组件grpc地址
        - --endpoint=dnssrv+_grpc._tcp.thanos-ruler-operated.monitoring.svc.cluster.local:10901 # 新增thanos-ruler组件地址
# kubectl apply -f thanos-query-deployment.yaml 
deployment.apps/thanos-query configured
```

## 修改 Prometheus 配置
由于配置使用 thanos-rule 进行告警计算与推送到 alertmanager，那么原来的 Prometheus 则不需要推送告警到 alertmanager，注释相关配置。

```yaml
# vim prometheus-prometheus.yaml
apiVersion: monitoring.coreos.com/v1
kind: Prometheus
metadata:
  labels:
    app.kubernetes.io/component: prometheus
    app.kubernetes.io/instance: k8s
    app.kubernetes.io/name: prometheus
    app.kubernetes.io/part-of: kube-prometheus
    app.kubernetes.io/version: 2.54.1
  name: k8s
  namespace: monitoring
spec:
  # alerting: # 取消告警推送到alertmanager
  #   alertmanagers:
  #   - apiVersion: v2
  #     name: alertmanager-main
  #     namespace: monitoring
  #     port: web
# kubectl apply -f prometheus-prometheus.yaml
```

## 访问验证
访问 thanos-rule 组件，查看告警规则

![](assets/06-Kubernetes/4fb5d0bd4fc88e09de0e.png)

访问 thanos-query ，查看 thanos 组件信息。

![](assets/06-Kubernetes/069bcebc4b909ac9965f.png)

# thanos-compact 安装
kube-prometheus 中并未包含 thanos-compact 组件，需要从 kube-thanos 库中拷贝示例文件并部署配置。

## 创建 pvc 资源
```yaml
# cat thanos-compact-pvc.yaml          
kind: PersistentVolumeClaim
apiVersion: v1
metadata:
  name: data-thanos-compact-0
  namespace: thanos
spec:
  storageClassName: nfs-client
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
# kubectl apply -f thanos-rule-pvc.yaml
persistentvolumeclaim/data-thanos-rule-0 configured
# kubectl get pvc -n thanos               
NAME                    STATUS   VOLUME                                     CAPACITY   ACCESS MODES   STORAGECLASS   VOLUMEATTRIBUTESCLASS   AGE
data-thanos-compact-0   Bound    pvc-f7d0f3c6-2c37-45ae-8352-e94bdb2f314f   10Gi       RWO            nfs-client     <unset>                 4s
data-thanos-store-0     Bound    pvc-db9a4b79-c036-4b8a-a9a6-c3f5ae3b282c   10Gi       RWO            nfs-client     <unset>                 4h46m
```

## 部署 thanos-compact
拷贝资源清单文件

```bash
# cp -r ../../kube-thanos/examples/all/manifests/thanos-compact-* .

# 移除shard相关资源
# mkdir thanos-compact-back
# mv thanos-compact-shard{0,1,2}* thanos-compact-back 
# ls
thanos-compact-back      thanos-compact-serviceAccount.yaml  thanos-compact-service.yaml                thanos-compact-shards-serviceMonitor.yaml
thanos-compact-pvc.yaml  thanos-compact-serviceMonitor.yaml  thanos-compact-shards-serviceAccount.yaml  thanos-compact-statefulSet.yaml
```

修改 thanos-compact 配置

```yaml
# vim thanos-compact-statefulSet.yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  labels:
    app.kubernetes.io/component: database-compactor
    app.kubernetes.io/instance: thanos-compact
    app.kubernetes.io/name: thanos-compact
    app.kubernetes.io/version: v0.30.2
  name: thanos-compact
  namespace: thanos
spec:
  template:
    spec:
      containers:
      - args:
        - compact
        - --retention.resolution-raw=1d # 原始监控数据（15s/30s 粒度）只保留 1 天
        - --retention.resolution-5m=3d # 5 分钟下采样数据保留 3 天
        - --retention.resolution-1h=7d # 1 小时下采样数据保留 7 天
        - --delete-delay=1h # 数据块被标记删除后，延迟1小时再真正清理
```

创建 thanos-compact 资源

```bash
# kubectl apply -f .   
persistentvolumeclaim/data-thanos-compact-0 unchanged
service/thanos-compact created
serviceaccount/thanos-compact created
servicemonitor.monitoring.coreos.com/thanos-compact created
serviceaccount/thanos-compact unchanged
servicemonitor.monitoring.coreos.com/thanos-compact configured
statefulset.apps/thanos-compact created
# kubectl get pod -n thanos
NAME                            READY   STATUS    RESTARTS   AGE
thanos-compact-0                1/1     Running   0          21s
thanos-query-6d64b8d7ff-b7sqv   1/1     Running   0          8m29s
thanos-store-0                  1/1     Running   0          3h49m
```

## 创建 ingress 资源
```yaml
# cat thanos-compact.yaml 
apiVersion: traefik.io/v1alpha1
kind: IngressRoute
metadata:
  name: thanos-compact
  namespace: thanos
spec:
  entryPoints:
  - web
  routes:
  - match: Host(`thanos-compact.cuiliangblog.cn`)
    kind: Rule
    services:
    - name: thanos-compact
      port: 10902                                                                                                                                   
# kubectl apply -f thanos-compact.yaml    
ingressroute.traefik.io/thanos-compact created
```

## 访问验证
![](assets/06-Kubernetes/7c3712ce18b62ce1c610.png)

# 其他集群配置
以 receive 模式为例，演示如果跨集群采集上报监控指标数据。

## 部署 kube-prometheus
具体可参考文档：[03-14_%E9%83%A8%E7%BD%B2Prometheus%E7%9B%91%E6%8E%A7.md](articles/06-Kubernetes/03-14_部署Prometheus监控.md)

## 修改 prometheus 配置
```yaml
# cat prometheus-prometheus.yaml 
apiVersion: monitoring.coreos.com/v1
kind: Prometheus
metadata:
  labels:
    app.kubernetes.io/component: prometheus
    app.kubernetes.io/instance: k8s
    app.kubernetes.io/name: prometheus
    app.kubernetes.io/part-of: kube-prometheus
    app.kubernetes.io/version: 2.54.1
  name: k8s
  namespace: monitoring
spec:
  ……
  externalLabels: # 修改额外标签，用于区分不同prometheus集群
    cluster: remote
  remoteWrite: # 新增远程写入配置，数据写入thanos-receive
  - url: "http://192.168.10.10:39291/api/v1/receive" # 将远程thanos的receive服务配置为ingress，通过域名或者nodeport访问
# kubectl apply -f prometheus-prometheus.yaml      
prometheus.monitoring.coreos.com/k8s configured
```

## 访问验证
查看 cluster 标签信息

![](assets/06-Kubernetes/c30eba5f72dd94cbe43c.png)

# 多副本配置
为提高监控集群可用性，通常在生产环境所有组件至少都是 2 个副本运行。

## 调整组件副本
直接修改 query、receive、rule组件副本即可，由于 Compact的设计是非并发安全的，因此只能单例部署。

## 调整 receive 配置
调整完副本后，需要修改 receive 配置，否则只会往其中一个实例写入数据。

修改 thanos-receive-router-configmap.yaml，新增endpoints。

```yaml
apiVersion: v1
data:
  hashrings.json: '[{"endpoints": ["thanos-receive-ingestor-default-0.thanos-receive-ingestor-default.thanos.svc.cluster.local:10901","thanos-receive-ingestor-default-1.thanos-receive-ingestor-default.thanos.svc.cluster.local:10901"], "hashring": "default", "tenants": [ ]}]'
kind: ConfigMap
metadata:
  name: hashring-config
  namespace: thanos
```

修改thanos-receive-ingestor-default-statefulSet.yaml 和thanos-receive-router-deployment.yaml

```yaml
spec:
  containers:
  - args:
    - receive
    - --log.level=info
    - --log.format=logfmt
    - --grpc-address=0.0.0.0:10901
    - --http-address=0.0.0.0:10902
    - --remote-write.address=0.0.0.0:19291
    - --receive.replication-factor=2 # 每个时间序列副本数
```

## 调整 thanos-query 配置
修改thanos-query-deployment.yaml，新增query.replica-label 配置

```yaml
- args:
  - query
  - --grpc-address=0.0.0.0:10901
  - --http-address=0.0.0.0:9090
  - --log.level=info
  - --log.format=logfmt
  - --query.replica-label=prometheus_replica
  - --query.replica-label=rule_replica
  - --query.replica-label=replica # 新增receive组件副本标签
  - --endpoint=dnssrv+_grpc._tcp.thanos-store.thanos.svc.cluster.local:10901
  # - --endpoint=dnssrv+_grpc._tcp.prometheus-operated.monitoring.svc.cluster.local:10901 # 新增Prometheus的grpc地址
  - --endpoint=dnssrv+_grpc._tcp.thanos-receive-ingestor-default.thanos.svc.cluster.local:10901 # 注释receive组件grpc地址
  - --endpoint=dnssrv+_grpc._tcp.thanos-ruler-operated.monitoring.svc.cluster.local:10901 # 新增thanos-ruler组件地址
  - --query.auto-downsampling
```

## 访问验证
![](assets/06-Kubernetes/d05b436fab01c1472d23.png)


