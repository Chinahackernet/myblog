前提：

-   可用的K8S集群
-   安装好Helm3

  

### （1）添加helm仓库

```yaml
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update
```

  

### （2）下载prometheus-stack包

```yaml
helm  pull prometheus-community/kube-prometheus-stack
tar xf kube-prometheus-stack.tar.gz
```

  

### （3）创建namespace

```yaml
kubectl create ns monitoring
```

  

### （4）创建storageclass

> PS：这里采用的local storageclass，磁盘是ssd磁盘

  

altermanager-storage.yaml

```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: local-storage-alertmanager
provisioner: kubernetes.io/no-provisioner
reclaimPolicy: Delete
volumeBindingMode: WaitForFirstConsumer
---
apiVersion: v1
kind: PersistentVolume
metadata:
  finalizers:
  - kubernetes.io/pv-protection
  name: local-pv-alertmanager
spec:
  accessModes:
  - ReadWriteOnce
  capacity:
    storage: 50Gi
  local:
    path: /opt/hipay/lib/altermanager
  nodeAffinity:
    required:
      nodeSelectorTerms:
      - matchExpressions:
        - key: category
          operator: In
          values:
          - monitoring
  persistentVolumeReclaimPolicy: Delete
  storageClassName: local-storage-alertmanager
  volumeMode: Filesystem
```

  

grafana-storage.yaml

```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: local-storage-grafana
provisioner: kubernetes.io/no-provisioner
reclaimPolicy: Delete
volumeBindingMode: WaitForFirstConsumer
---
apiVersion: v1
kind: PersistentVolume
metadata:
  finalizers:
  - kubernetes.io/pv-protection
  name: local-grafana-pv
spec:
  accessModes:
  - ReadWriteOnce
  capacity:
    storage: 20Gi
  local:
    path: /opt/hipay/lib/grafana
  nodeAffinity:
    required:
      nodeSelectorTerms:
      - matchExpressions:
        - key: category
          operator: In
          values:
          - monitoring
  persistentVolumeReclaimPolicy: Delete 
  storageClassName: local-storage-grafana
  volumeMode: Filesystem
```

  

prometheus-storage.yaml

```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: local-storage-prometheus
provisioner: kubernetes.io/no-provisioner
reclaimPolicy: Delete
volumeBindingMode: WaitForFirstConsumer
---
apiVersion: v1
kind: PersistentVolume
metadata:
  finalizers:
  - kubernetes.io/pv-protection
  name: local-pv-prometheus
spec:
  accessModes:
  - ReadWriteOnce
  capacity:
    storage: 400Gi
  local:
    path: /opt/hipay/lib/prometheus 
  nodeAffinity:
    required:
      nodeSelectorTerms:
      - matchExpressions:
        - key: category
          operator: In
          values:
          - monitoring
  persistentVolumeReclaimPolicy: Delete
  storageClassName: local-storage-prometheus
  volumeMode: Filesystem
```

其实创建一个Storageclass就足够了，不过我这里为了便与区分，每一个服务都创建了一个，无所谓了.......

  

### （5）创建自定义配置文件

my-values.yaml

```yaml
alertmanager:
  config:
    global:
      resolve_timeout: 5m
    templates:
    - '/etc/alertmanager/config/*.tmpl'
    route:
      group_by: ['job']
      group_wait: 30s
      group_interval: 5m
      repeat_interval: 12h
      receiver: webhook
      routes:
      - match:
          alertname: Watchdog
        receiver: 'webhook'
    receivers:
    - name: webhook
      webhook_configs:
      - url: "http://prometheus-alter-webhook.monitoring.svc:9000"
        send_resolved: false
  ingress:
    enabled: true
    hosts:
    - altermanager.coolops.cn
  alertmanagerSpec:
    image:
      repository: quay.io/prometheus/alertmanager
      tag: v0.21.0
      sha: ""
    replicas: 1
    storage:
      volumeClaimTemplate:
        spec:
          storageClassName: local-storage-alertmanager
          accessModes: ["ReadWriteOnce"]
          resources:
            requests:
              storage: 50Gi
    affinity: 
      nodeAffinity:
        requiredDuringSchedulingIgnoredDuringExecution:
          nodeSelectorTerms:
          - matchExpressions:
            - key: category
              operator: In
              values:
              - monitoring
grafana:
  adminPassword: dmCE9M$PQt@Q%eht
  ingress:
    enabled: true
    hosts:
    - grafana.coolops.cn
  persistence:
    type: pvc
    enabled: true
    storageClassName: local-storage-grafana
    accessModes:
      - ReadWriteOnce
    size: 20Gi
prometheusOperator:
  affinity: 
    nodeAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
        nodeSelectorTerms:
        - matchExpressions:
          - key: category
            operator: In
            values:
            - monitoring
prometheus:
  ingress:
    enabled: true
    hosts:
    - prometheus.coolops.cn
   
  prometheusSpec:
    affinity: 
      nodeAffinity:
        requiredDuringSchedulingIgnoredDuringExecution:
          nodeSelectorTerms:
          - matchExpressions:
            - key: category
              operator: In
              values:
              - monitoring
    storageSpec: 
      volumeClaimTemplate:
        spec:
          storageClassName: local-storage-prometheus
          accessModes: ["ReadWriteOnce"]
          resources:
            requests:
              storage: 400Gi
```

> PS：这里使用了nodeAffinity做高级调度，所以需要给Node节点打标签
> 
> kubectl label node xxxxx category=monitoring

  

### （6）安装

```yaml
helm install prometheus -n monitoring kube-prometheus-stack -f kube-prometheus-stack/my-values.yaml
```

然后可以在monitoring的namespace下看到创建的如下信息

```yaml
# kubectl  get all -n monitoring 
NAME                                                         READY   STATUS    RESTARTS   AGE
pod/alertmanager-prometheus-kube-prometheus-alertmanager-0   2/2     Running   0          4d20h
pod/prometheus-grafana-6d644ff97b-hxdxq                      2/2     Running   0          4d20h
pod/prometheus-kube-prometheus-operator-db6d5c564-nwm82      1/1     Running   0          4d20h
pod/prometheus-kube-state-metrics-c65b87574-4qx95            1/1     Running   0          4d20h
pod/prometheus-prometheus-kube-prometheus-prometheus-0       2/2     Running   1          4d20h
pod/prometheus-prometheus-node-exporter-2t8pt                1/1     Running   0          4d20h
pod/prometheus-prometheus-node-exporter-52bj4                1/1     Running   0          4d20h
pod/prometheus-prometheus-node-exporter-xwsbw                1/1     Running   0          4d20h

NAME                                              TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)                      AGE
service/alertmanager-operated                     ClusterIP   None             <none>        9093/TCP,9094/TCP,9094/UDP   4d20h
service/prometheus-alter-webhook                  ClusterIP   192.168.12.211   <none>        9000/TCP                     2d18h
service/prometheus-grafana                        ClusterIP   192.168.11.93    <none>        80/TCP                       4d20h
service/prometheus-kube-prometheus-alertmanager   ClusterIP   192.168.11.95    <none>        9093/TCP                     4d20h
service/prometheus-kube-prometheus-operator       ClusterIP   192.168.10.102   <none>        443/TCP                      4d20h
service/prometheus-kube-prometheus-prometheus     ClusterIP   192.168.7.216    <none>        9090/TCP                     4d20h
service/prometheus-kube-state-metrics             ClusterIP   192.168.13.249   <none>        8080/TCP                     4d20h
service/prometheus-operated                       ClusterIP   None             <none>        9090/TCP                     4d20h
service/prometheus-prometheus-node-exporter       ClusterIP   192.168.8.215    <none>        9100/TCP                     4d20h

NAME                                                 DESIRED   CURRENT   READY   UP-TO-DATE   AVAILABLE   NODE SELECTOR   AGE
daemonset.apps/prometheus-prometheus-node-exporter   15        15        15      15           15          <none>          4d20h

NAME                                                  READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/prometheus-alert-webhook              1/1     1            1           2d18h
deployment.apps/prometheus-grafana                    1/1     1            1           4d20h
deployment.apps/prometheus-kube-prometheus-operator   1/1     1            1           4d20h
deployment.apps/prometheus-kube-state-metrics         1/1     1            1           4d20h

NAME                                                            DESIRED   CURRENT   READY   AGE
replicaset.apps/prometheus-alert-webhook-7bd7766977             1         1         1       2d18h
replicaset.apps/prometheus-grafana-6d644ff97b                   1         1         1       4d20h
replicaset.apps/prometheus-kube-prometheus-operator-db6d5c564   1         1         1       4d20h
replicaset.apps/prometheus-kube-state-metrics-c65b87574         1         1         1       4d20h

NAME                                                                    READY   AGE
statefulset.apps/alertmanager-prometheus-kube-prometheus-alertmanager   1/1     4d20h
statefulset.apps/prometheus-prometheus-kube-prometheus-prometheus       1/1     4d20h
```

然后就可以通过域名进行访问了。

  

### （7）其他配置

#### 自定义告警规则

如果要自定义监控告警规则，可以直接在my-values.yaml添加additionalPrometheusRules字段，如下：

```yaml
## 自定义告警规则
additionalPrometheusRules:
- name: blackbox-monitoring-rule
  groups:
  - name: blackbox_check
    rules:
    - alert: "ssl证书过期警告"
      expr: (probe_ssl_earliest_cert_expiry - time())/86400 <30
      for: 1h
      labels:
        severity: warn
      annotations:
        description: '域名{{$labels.instance}}的证书还有{{ printf "%.1f" $value }}天就过期了,请尽快更新证书'
        summary: "ssl证书过期警告"

    - alert: "接口/主机/端口 可用性异常"
      expr: probe_success == 0
      for: 1m
      labels:
        severity: critical
      annotations:
        summary: "接口/主机/端口异常检测"
        description: "接口/主机/端口 {{ $labels.instance }}  无法联通"
```

  

#### 自定义job\_name

如果要自定义job抓取规则，则prometheus.prometheusSpec字段下新增additionalScrapeConfigs，如下：

```yaml
prometheus:
  ......
  prometheusSpec:
    ......
    additionalScrapeConfigs:
    - job_name: "ingress-endpoint-status"
      metrics_path: /probe
      params:
        module: [http_2xx]  # Look for a HTTP 200 response.
      static_configs:
        - targets:
          - http://172.16.51.23/healthz
          - http://172.16.51.24/healthz
          - http://172.16.51.25/healthz
          labels:
            group: nginx-ingress
      relabel_configs:
        - source_labels: [__address__]
          target_label: __param_target
        - source_labels: [__param_target]
          target_label: instance
        - target_label: __address__
          replacement: blackbox.monitoring:9115

```

  

#### 自定义serviceMonitor

如果要自定义serviceMonitor监控，则直接在prometheus下新增additionalServiceMonitors，如下：

```yaml
prometheus:
  ......
  ## 自定义监控
  additionalServiceMonitors:
  - name: ingress-nginx-controller
    selector:
      matchLabels:
        app: ingress-nginx-metrics 
    namespaceSelector:
       matchNames:
       - ingress-nginx
    endpoints:
    - port: metrics
      interval: 30s
```