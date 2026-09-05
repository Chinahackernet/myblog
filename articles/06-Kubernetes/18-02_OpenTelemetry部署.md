# OpenTelemetry部署

> 分类：Kubernetes / 第18章：OpenTelemetry可观测性
> 原文：https://www.cuiliangblog.cn/detail/section/215947486
> 来源：崔亮的博客

---

# OpenTelemetry 部署模式
OpenTelemetry Collector 按部署方式分为 Agent 和Gateway 模式。

## Agent 模式
在 Agent 模式下，OpenTelemetry 检测的应用程序将数据发送到与应用程序一起驻留的（收集器）代理。然后，该代理程序将接管并处理所有来自应用程序的追踪数据。

收集器可以通过 sidecar 方式部署为代理，sidecar 可以配置为直接将数据发送到存储后端。

![](assets/06-Kubernetes/84aef44990b4cf21a754.png)

## Gateway 模式
Gateway 模式则是将数据发送到另一个 OpenTelemetry 收集器，然后从（中心）收集器进一步将数据发送到存储后端。在这种配置中，我们有一个中心的 OpenTelemetry 收集器，它使用 `deployment/statefulset/daemonset` 模式部署，具有许多优势，如自动扩展。

![](assets/06-Kubernetes/115a76c68825330b14f0.png)

发送遥测数据最佳实践是将数据发送到OpenTelemetry Collector而不是直接发送到后端。Collector可以帮助简化密钥管理，将数据导出与应用程序解耦，并允许您在遥测数据中添加其他数据。

# 部署 OpenTelemetry
建议使用 OpenTelemetry Operator 来部署，因为它可以帮助我们轻松部署和管理 OpenTelemetry 收集器，还可以自动检测应用程序。具体可参考文档[https://opentelemetry.io/docs/platforms/kubernetes/operator/](https://opentelemetry.io/docs/platforms/kubernetes/operator/)

## 部署cert-manager
因为 Operator 使用了 Admission Webhook 通过 HTTP 回调机制对资源进行校验/修改。Kubernetes 要求 Webhook 服务必须使用 TLS，因此 Operator 需要为其 webhook server 签发证书，所以需要先安装cert-manager。

需要注意的是 cert-manager 对 k8s 版本有依赖要求，以 1.30 版本的 k8s 为例，可安装的cert-manager 最新为v1.18.6。[https://cert-manager.io/docs/releases/#supported-releases](https://cert-manager.io/docs/releases/#supported-releases)

```bash
# wget https://github.com/cert-manager/cert-manager/releases/download/v1.18.6/cert-manager.yaml
# kubectl apply -f cert-manager.yaml
# kubectl get pod -n cert-manager
NAME                                       READY   STATUS    RESTARTS   AGE
cert-manager-5577849d6c-kwg7f              1/1     Running   0          3m18s
cert-manager-cainjector-5755f77bbb-knlm2   1/1     Running   0          3m18s
cert-manager-webhook-b78d65b96-vpvrn       1/1     Running   0          3m18s
```

## 部署Operator
在 Kubernetes 上使用 OpenTelemetry，主要就是部署 OpenTelemetry 收集器。

```bash
# wget https://github.com/open-telemetry/opentelemetry-operator/releases/latest/download/opentelemetry-operator.yaml
# kubectl apply -f opentelemetry-operator.yaml
# kubectl get pod -n opentelemetry-operator-system 
NAME                                                         READY   STATUS    RESTARTS   AGE
opentelemetry-operator-controller-manager-6d94c5db75-cz957   2/2     Running   0          74s
# kubectl get crd |grep opentelemetry
instrumentations.opentelemetry.io           2025-04-21T09:48:53Z
opampbridges.opentelemetry.io               2025-04-21T09:48:54Z
opentelemetrycollectors.opentelemetry.io    2025-04-21T09:48:54Z
targetallocators.opentelemetry.io           2025-04-21T09:48:54Z
```

## 部署Collector(中心)
接下来我们部署一个精简版的 OpenTelemetry Collector，用于接收 OTLP 格式的 trace 数据，通过 gRPC 或 HTTP 协议接入，经过内存控制与批处理后，打印到日志中以供调试使用。

```yaml
# cat center-collector.yaml              
apiVersion: opentelemetry.io/v1beta1
kind: OpenTelemetryCollector
# 元数据定义部分
metadata:
  name: center        # Collector 的名称为 center
  namespace: opentelemetry
# 具体的配置内容
spec:
  replicas: 1           # 设置副本数量为1
  config:               # 定义 Collector 配置
    receivers:          # 接收器，用于接收遥测数据（如 trace、metrics、logs）
      otlp:             # 配置 OTLP（OpenTelemetry Protocol）接收器
        protocols:      # 启用哪些协议来接收数据
          grpc: 
            endpoint: 0.0.0.0:4317      # 启用 gRPC 协议
          http: 
            endpoint: 0.0.0.0:4318      # 启用 HTTP 协议
    processors:         # 处理器，用于处理收集到的数据
      batch: {}         # 批处理器，用于将数据分批发送，提高效率

    exporters:          # 导出器，用于将处理后的数据发送到后端系统
      debug: {}         # 使用 debug 导出器，将数据打印到终端（通常用于测试或调试）

    service:            # 服务配置部分
      pipelines:        # 定义处理管道
        traces:         # 定义 trace 类型的管道
          receivers: [otlp]                      # 接收器为 OTLP
          processors: [batch]                    # 使用批处理器
          exporters: [debug]                     # 将数据打印到终端

# kubectl apply -f center-collector.yaml 
opentelemetrycollector.opentelemetry.io/center created
# kubectl get pod -n opentelemetry
NAME                                READY   STATUS    RESTARTS      AGE
center-collector-5c5987f4ff-zwqbk   1/1     Running   0             9s
# kubectl get svc -n opentelemetry  
NAME                          TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)                       AGE
center-collector              ClusterIP   10.109.226.90    <none>        4317/TCP,4318/TCP             22s
center-collector-headless     ClusterIP   None             <none>        4317/TCP,4318/TCP             22s
center-collector-monitoring   ClusterIP   10.110.106.116   <none>        8888/TCP                      22s
```

## 部署Collector(代理)
我们使用 Sidecar 模式部署 OpenTelemetry 代理。该代理会将应用程序的追踪发送到我们刚刚部署的中心OpenTelemetry 收集器。

```yaml
# cat sidecar-collector.yaml 
apiVersion: opentelemetry.io/v1beta1
kind: OpenTelemetryCollector          # 定义资源类型为 OpenTelemetryCollector
metadata:
  name: sidecar                       # Collector 的名称
  namespace: opentelemetry
spec:
  mode: sidecar                       # 以 sidecar 模式运行（与应用容器同 Pod）
  imagePullPolicy: IfNotPresent
  config:                             # Collector 配置部分（结构化 YAML）
    receivers:
      otlp:                           # 使用 OTLP 协议作为接收器
        protocols:
          grpc: {}                    # 启用 gRPC 协议接收 trace/metric/log 数据
          http: {}                    # 启用 HTTP 协议接收 trace/metric/log 数据
    processors:
      batch: {}                       # 使用 batch 处理器将数据批量发送，提高性能

    exporters:
      debug: {}                       # 将数据输出到 stdout 日志（用于调试）
      otlp_grpc:                           # 添加一个 OTLP 类型导出器，发送到 central collector
        endpoint: "center-collector-headless.opentelemetry.svc:4317"  # 替换为 central collector 的地址
        tls:
          insecure: true              # 不使用 TLS

    service:
      telemetry:
        logs:
          level: "debug"              # 设置 Collector 自身日志等级为 debug（方便观察日志）

      pipelines:
        traces:                       # 定义 trace 数据处理流水线
          receivers: [otlp]           # 从 otlp 接收 trace 数据
          processors: [batch]         # 使用批处理器
          exporters: [debug, otlp_grpc]    # 同时导出到 debug（日志）和 otlp（中心 Collector）

# kubectl apply -f sidecar-collector.yaml                
opentelemetrycollector.opentelemetry.io/sidecar created
# kubectl get opentelemetrycollectors -n opentelemetry   
NAME      MODE         VERSION   READY   AGE   IMAGE                                                                                     MANAGEMENT
center    deployment   0.123.1   1/1     10m   ghcr.io/open-telemetry/opentelemetry-collector-releases/opentelemetry-collector:0.123.1   managed
sidecar   sidecar      0.123.1           11s                                                                                             managed
# kubectl get pod -n opentelemetry                    
NAME                                READY   STATUS    RESTARTS      AGE
center-collector-5c5987f4ff-zwqbk   1/1     Running   0             10m
```

sidecar 代理依赖于应用程序启动，因此现在创建后并不会立即启动，需要我们创建一个应用程序并使用这个 sidecar 模式的 collector。

# 



