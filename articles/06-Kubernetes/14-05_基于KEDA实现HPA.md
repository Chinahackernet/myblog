# 基于KEDA实现HPA

> 分类：Kubernetes / 第14章：资源指标与HPA
> 原文：https://www.cuiliangblog.cn/detail/section/213947469
> 来源：崔亮的博客

---

# KEDA 简介
## <font style="color:rgb(28, 30, 33);">什么是 KEDA </font>
KEDA (Kubernetes-based Event-Driven Autoscaler) 是在 Kubernetes 中事件驱动的弹性伸缩器，功能非常强大。不仅支持根据基础的 CPU 和内存指标进行伸缩，还支持根据各种消息队列中的长度、数据库中的数据统计、QPS、Cron 定时计划以及您可以想象的任何其他指标进行伸缩，甚至还可以将副本缩到 0。

## <font style="color:rgb(28, 30, 33);">为什么需要 KEDA </font>
HPA 是 Kubernetes 自带的 Pod 水平自动伸缩器，只能根据监控指标对工作负载自动扩缩容，指标主要是工作负载的 CPU 和内存的利用率（Resource Metrics），如果需要支持其它自定义指标，一般是安装 prometheus-adapter 来作为 HPA 的 Custom Metrics 和 External Metrics 的实现来将 Prometheus 中的监控数据作为自定义指标提供给 HPA。理论上，用 HPA + prometheus-adapter 也能实现 KEDA 的功能，但实现上会非常麻烦，比如想要根据数据库中任务表里记录的待执行的任务数量统计进行伸缩，就需要编写并部署 Exporter 应用，将统计结果转换为 Metrics 暴露给 Prometheus 进行采集，然后 prometheus-adapter 再从 Prometheus 查询待执行的任务数量指标来决定是否伸缩。

KEDA 的出现主要是为了解决 HPA 无法基于灵活的事件源进行伸缩的这个问题，内置了几十种常见的 Scaler ，可直接跟各种第三方应用对接，比如各种开源和云托管的关系型数据库、时序数据库、文档数据库、键值存储、消息队列、事件总线等，也可以使用 Cron 表达式进行定时自动伸缩，常见的伸缩常见基本都涵盖了，如果发现有不支持的，还可以自己实现一个外部 Scaler 来配合 KEDA 使用。

## <font style="color:rgb(28, 30, 33);">KEDA 的原理</font>
KEDA 并不是要替代 HPA，而是作为 HPA 的补充或者增强，事实上很多时候 KEDA 是配合 HPA 一起工作的，这是 KEDA 官方的架构图：

![](assets/06-Kubernetes/57a7c847c1276f938023.png)

+ 当要将工作负载的副本数缩到闲时副本数，或从闲时副本数扩容时，由 KEDA 通过修改工作负载的副本数实现（闲时副本数小于 `minReplicaCount`，包括 0，即可以缩到 0）。
+ 其它情况下的扩缩容由 HPA 实现，HPA 由 KEDA 自动管理，HPA 使用 External Metrics 作为数据源，而 External Metrics 后端的数据由 KEDA 提供。
+ KEDA 各种 Scalers 的核心其实就是为 HPA 暴露 External Metrics 格式的数据，KEDA 会将各种外部事件转换为所需的 External Metrics 数据，最终实现 HPA 通过 External Metrics 数据进行自动伸缩，直接复用了 HPA 已有的能力，所以如果还想要控制扩缩容的行为细节（比如快速扩容，缓慢缩容），可以直接通过配置 HPA 的 `behavior` 字段来实现 (要求 Kubernetes 版本 >= 1.18)。

除了工作负载的扩缩容，对于任务计算类场景，KEDA 还可以根据排队的任务数量自动创建 Job 来实现对任务的及时处理：

![](assets/06-Kubernetes/4d9f066c47159fdad83b.png)

## <font style="color:rgb(28, 30, 33);">哪些场景适合使用 KEDA </font>
### <font style="color:rgb(28, 30, 33);">微服务多级调用</font>
<font style="color:rgb(28, 30, 33);">在微服务中，基本都存在多级调用的业务场景，压力是逐级传递的，下面展示了一个常见的情况：</font>

![](assets/06-Kubernetes/85ea8c013d23410fcacf.png)

如果使用传统的 HPA 根据负载扩缩容，用户流量进入集群后：

1. `Deploy A` 负载升高，指标变化迫使 `Deploy A` 扩容。
2. A 扩容之后，吞吐量变大，B 受到压力，再次采集到指标变化，扩容 `Deploy B`。
3. B 吞吐变大，C 受到压力，扩容 `Deploy C`。

这个逐级传递的过程不仅缓慢，还很危险：每一级的扩容都是直接被 CPU 或内存的飙高触发的，被 “冲垮” 的可能性是普遍存在的。这种被动、滞后的方式，很明显是有问题的。

此时，我们可以利用 KEDA 来实现多级快速扩容：

+ `Deploy A` 可根据自身负载或网关记录的 QPS 等指标扩缩容。
+ `Deploy B` 和 `Deploy C` 可根据 `Deploy A` 副本数扩缩容（各级服务副本数保持一定比例）。

### <font style="color:rgb(28, 30, 33);">任务执行（生产者与消费者）</font>
如果有需要长时间执行的计算任务，如数据分析、ETL、机器学习等场景，从消息队列或数据库中取任务进行执行，需要根据任务数量来伸缩，使用 HPA 不太合适，用 KEDA 就非常方便，可以让 KEDA 根据排队中的任务数量对工作负载进行伸缩，也可以自动创建 Job 来消费任务。

![](assets/06-Kubernetes/70f8e260928de1781eaa.png)

### <font style="color:rgb(28, 30, 33);">周期性规律</font>
<font style="color:rgb(28, 30, 33);">如</font>果业务有周期性的波峰波谷特征，可以使用 KEDA 配置定时伸缩，在波峰来临之前先提前扩容，结束之后再缓慢缩容。

# <font style="color:rgb(28, 30, 33);">helm 部署 KEDA</font>
## 获取 helm 包
```bash
# helm repo add kedacore https://kedacore.github.io/charts
# helm repo update
# helm pull kedacore/keda --untar
# cd keda                 
# ls
Chart.yaml  README.md  templates  values.yaml
```

## <font style="color:rgb(28, 30, 33);">安装</font>
需要注意的是 KEDA 版本需要与 k8s 版本对应，具体可参考文档[https://keda.sh/docs/2.16/operate/cluster/#kubernetes-compatibility](https://keda.sh/docs/2.16/operate/cluster/#kubernetes-compatibility)

```bash
# helm install keda -n keda . -f values.yaml --create-namespace --version 2.16 
# kubectl get pod -n keda                                              
NAME                                               READY   STATUS    RESTARTS      AGE
keda-admission-webhooks-54d5d54cfd-zcktq           1/1     Running   0             2m
keda-operator-555c5cbb87-d5bjf                     1/1     Running   0             2m
keda-operator-metrics-apiserver-7d9cd6dfc6-5f2nc   1/1     Running   0             2m
```

# 定时扩缩容(Cron)
KEDA 支持 Cron 触发器，即使用 Cron 表达式来配置周期性的定时扩缩容，用法参考[https://keda.sh/docs/2.16/scalers/cron/](https://keda.sh/docs/2.16/scalers/cron/)，适用于有周期性特征的业务，比如业务流量有固定的周期性波峰和波谷特征。

## <font style="color:rgb(28, 30, 33);">创建ScaledObject</font>
```yaml
# cat cron.yaml 
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: cron-sample-app
  namespace: default
spec:
  scaleTargetRef: #定时扩缩容目标，对default命名空间下的sample-app应用进行扩缩容
    apiVersion: apps/v1
    kind: Deployment
    name: sample-app
  pollingInterval: 15 # 15秒轮询一次指标
  minReplicaCount: 2 # 至少保留 2 个副本
  maxReplicaCount: 100
  advanced:
    horizontalPodAutoscalerConfig:
      behavior: # 控制扩缩容行为，使用比较保守的策略，快速扩容，缓慢缩容
        scaleDown: # 缓慢缩容：至少冷却 10 分钟才能缩容
          stabilizationWindowSeconds: 600
          selectPolicy: Min # 
        scaleUp: # 快速扩容：每 15s 最多允许扩容 5 倍
          policies:
            - type: Percent
              value: 500
              periodSeconds: 15
  triggers:
    - type: cron # 每天早上 10 点秒杀活动，确保前后半小时内至少有 50 个副本
      metadata:
        timezone: Asia/Shanghai
        start: 30 9 * * *
        end: 30 10 * * *
        desiredReplicas: "50"
    - type: cron # 每天晚上6点30秒杀活动，确保前后半小时内至少有 80 个副本
      metadata:
        timezone: Asia/Shanghai
        start: 00 18 * * *
        end: 00 18 * * *
        desiredReplicas: "80"
    - type: memory # CPU 利用率超过 60% 扩容
      metricType: Utilization
      metadata:
        value: "60"
    - type: cpu # 内存利用率超过 60% 扩容
      metricType: Utilization
      metadata:
        value: "60"
# kubectl apply -f cron.yaml 
scaledobject.keda.sh/cron-sample-app created
```

## 查看验证
```yaml
# kubectl get scaledobjects
NAME              SCALETARGETKIND      SCALETARGETNAME   MIN   MAX   READY   ACTIVE   FALLBACK   PAUSED    TRIGGERS   AUTHENTICATIONS   AGE
cron-sample-app   apps/v1.Deployment   sample-app        2     100   True    True     False      Unknown                                58s
# kubectl get deployments.apps             
NAME         READY   UP-TO-DATE   AVAILABLE   AGE
sample-app   80/80   80           80          20m
```

在 18 点时完成了定时扩容，当前副本 80 个。

# 同步扩缩容(<font style="color:rgb(28, 30, 33);">Workload</font>)
<font style="color:rgb(28, 30, 33);">比如下面这种多级微服务调用：</font>

![](assets/06-Kubernetes/0552d1b6a58ff80a1bf3.png)

+ A、B、C 这一组服务通常有比较固定的数量比例。
+ A 的压力突增，迫使扩容，B 和 C 也可以用 KEDA 的 Kubernetes Workload 触发器实现与 A 几乎同时扩容，而无需等待压力逐级传导才缓慢迫使扩容。

参考文档：[https://keda.sh/docs/2.16/scalers/kubernetes-workload/](https://keda.sh/docs/2.16/scalers/kubernetes-workload/)

## 创建 ScaledObject
假设服务间固定比例 A:B:C = 3:3:2，当A的压力增加时，A、B和C将几乎同时进行扩容，避免等待压力逐级传导，提高系统的弹性和性能。

```yaml
# cat workload.yaml 
cat workload.yaml 
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: a
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: app-a
  pollingInterval: 15
  minReplicaCount: 3
  maxReplicaCount: 30
  triggers:
    - type: memory
      metricType: Utilization
      metadata:
        value: "60"
    - type: cpu
      metricType: Utilization
      metadata:
        value: "60"
---
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: b
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: app-b
  pollingInterval: 15
  minReplicaCount: 3
  maxReplicaCount: 30
  triggers:
    - type: kubernetes-workload
      metadata:
        podSelector: 'app=app-a' # 选中 A 服务
        value: '1' # 副本比例 A/B=3/3=1
---
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: c
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: app-c
  pollingInterval: 15
  minReplicaCount: 2
  maxReplicaCount: 20
  triggers:
    - type: kubernetes-workload
      metadata:
        podSelector: 'app=app-a' # 选中 A 服务
        value: '1.5' # A/C=3/2=1.5                                                                                                                       
# kubectl apply -f workload.yaml 
scaledobject.keda.sh/a created
scaledobject.keda.sh/b created
scaledobject.keda.sh/c created
```

## <font style="color:rgb(28, 30, 33);">查看验证</font>
创建 3 组 deployment，内容如下：

```bash
# kubectl get deployments.apps             
NAME    READY   UP-TO-DATE   AVAILABLE   AGE
app-a   3/3     3            3           17s
app-b   3/3     3            3           17s
app-c   2/2     2            2           17s
```

查看 scaled

```bash
# kubectl get scaledobjects
NAME   SCALETARGETKIND      SCALETARGETNAME   MIN   MAX   READY   ACTIVE   FALLBACK   PAUSED    TRIGGERS   AUTHENTICATIONS   AGE
a      apps/v1.Deployment   app-a             3     30    True    True     False      Unknown                                29s
b      apps/v1.Deployment   app-b             3     30    True    True     False      Unknown                                29s
c      apps/v1.Deployment   app-c             2     20    True    True     False      Unknown                                29s
```

提升 app-a 负载，观察扩容情况

```bash
# kubectl get deployments.apps -w                                                        
NAME    READY   UP-TO-DATE   AVAILABLE   AGE
app-a   3/3     3            3           2m22s
app-b   3/3     3            3           2m22s
app-c   2/2     2            2           2m22s

app-a   4/4     4            4           2m38s
app-b   4/4     4            4           2m53s
app-c   3/3     3            3           2m54s

app-a   5/5     5            5           9m39s
app-b   5/5     5            5           9m54s
app-c   4/4     4            4           9m53s
```

# Prometheus 指标扩缩容(prometheus)
如数据分析、ETL、机器学习等场景，从消息队列或数据库中取任务进行执行，需要根据任务数量来伸缩，可以让 KEDA 根据排队中的任务数量对工作负载进行伸缩，也可以自动创建 Job 来消费任务。

![](assets/06-Kubernetes/f8600a38c1c335e0738d.png)

## 配置采集指标
### 部署 rabbitmq
具体可参考文档[https://m.cuiliangblog.cn/detail/section/192383630](https://m.cuiliangblog.cn/detail/section/192383630)

### 创建监控项
```yaml
# cat monitor.yaml                                             
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: rabbitmq-exporter
  namespace: monitoring
spec:
  jobLabel: rabbitmq-exporter
  endpoints:
  - interval: 30s
    port: prometheus
    path: /metrics
    scheme: http
  selector: # svc标签选择器，匹配service的labels
    matchLabels:
      app.kubernetes.io/name: rabbitmq-cluster
  namespaceSelector: # namespace选择
    matchNames:
    - rabbitmq-system
# kubectl apply -f monitor.yaml                                
servicemonitor.monitoring.coreos.com/rabbitmq-exporter created
```

查看 targets

![](assets/06-Kubernetes/48a541e54c7cb560f88d.png)

### 调试 promql
接下来进入 rabbitmq 管理页面创建 exchanges 和 channels，并发送测试消息，具体操作可参考文档[https://m.cuiliangblog.cn/detail/section/89394395](https://m.cuiliangblog.cn/detail/section/89394395)

此时通过 `quantile_over_time(0.95, sum(rabbitmq_queue_messages) [1m:])`指标查询最近 1 分钟消息队列数据总数95 值。

![](assets/06-Kubernetes/73992d1160a3764bb0a6.png)

## 创建 ScaledObject
```yaml
# cat scaled.yaml
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: a
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: app-a
  pollingInterval: 15
  minReplicaCount: 1
  maxReplicaCount: 100
  triggers:
    - type: prometheus
      metadata:
        serverAddress: http://prometheus-k8s.monitoring.svc:9090 # 替换 Prometheus 的地址
        query: | # 计算最近1分钟消息队列内容数95值的 PromQL
          quantile_over_time(0.95, sum(rabbitmq_queue_messages) [1m:])
        threshold: "10" # 每个副本能承受的工作量
# kubectl apply -f scaled.yaml
scaledobject.keda.sh/a created
```

## 查看验证
```bash
# kubectl get scaledobjects
NAME   SCALETARGETKIND      SCALETARGETNAME   MIN   MAX   READY   ACTIVE   FALLBACK   PAUSED    TRIGGERS   AUTHENTICATIONS   AGE
a      apps/v1.Deployment   app-a             1     100   True    False    False      Unknown                                6m18s
# kubectl get deployments.apps -w          
NAME    READY   UP-TO-DATE   AVAILABLE   AGE
app-a   1/1     1            1           110s
```

向 rabbitmq 队列发送数据，当前队列消息共 202 条，每个副本处理 10 条，自动创建 21 个副本。

![](assets/06-Kubernetes/02c05d299c617b2f0992.png)

```bash
# kubectl get deployments.apps   
NAME    READY   UP-TO-DATE   AVAILABLE   AGE
app-a   21/21   21           21          8m52s
```


