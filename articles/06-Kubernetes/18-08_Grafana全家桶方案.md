# Grafana全家桶方案

> 分类：Kubernetes / 第18章：OpenTelemetry可观测性
> 原文：https://www.cuiliangblog.cn/detail/section/216756436
> 来源：崔亮的博客

---

# 方案介绍
OpenTelemetry +Prometheus+ Loki + Tempo + Grafana 是一套现代化、云原生的可观测性解决方案组合，涵盖 **Trace（链路追踪）**、**Log（日志）**、**Metrics（指标）** 三大核心维度，为微服务架构中的应用提供统一的可观测性平台。

## 组件介绍
| 组件 | 作用 | 说明 |
| --- | --- | --- |
| **OpenTelemetry** | 全面采集 | 应用侧统一采集日志、指标、追踪数据，支持多语言 SDK。 |
| **Prometheus** | 指标采集与存储 | 主动拉取应用和系统的监控指标，配合 Alertmanager 进行告警。 |
| **Loki** | 日志聚合存储 | 结构化日志存储，与 traceID 打通，轻量级类似 Prometheus 的日志系统。 |
| **Tempo** | 分布式追踪存储 | 收集 trace 信息，存储于对象存储（如 MinIO/S3）中，便于分析慢请求、链路瓶颈。 |
| **Grafana** | 可视化分析平台 | 将三种数据统一呈现，支持联动跳转（如日志 ⇄ 链路），支持告警、仪表盘、探索分析等功能。 |
| **Minio** | 对象存储服务 | MinIO是一个高性能的开源对象存储服务，兼容Amazon S3接口，适合存储大规模非结构化数据，如图片、视频和日志文件。可用于存储指标、日志、链路追踪数据。 |


## 系统架构
![](assets/06-Kubernetes/68fc9dbc2bcdde8eb3ce.png)

# 部署示例应用
## 应用介绍
[https://opentelemetry.io/docs/demo/kubernetes-deployment/](https://opentelemetry.io/docs/demo/kubernetes-deployment/)

<font style="color:rgb(51, 51, 51);">官方为大家写了一个 opentelemetry-demo。</font>

<font style="color:rgb(51, 51, 51);">这个项目模拟了一个微服务版本的电子商城，主要包含了以下一些项目：</font>

| Service | 开发语言 | 服务描述 |
| --- | --- | --- |
| accounting service | Go | 处理和计算订单数据 |
| ad service | Java | 广告服务 |
| cart service | .NET | 购物车服务，主要会依赖 Redis |
| checkout service | Go | checkout |
| currency service | C++ | 货币转换服务，提供了较高的 QPS 能力。 |
| email service | Ruby | 邮件服务 |
| frauddetection service | Kotlin | 风控服务 |
| frontend | JavaScript | 前端应用 |
| loadgenerator | Python/Locust | 模拟压测服务 |
| payment service | JavaScript | 支付服务 |
| productcatalog service | Go | 商品服务 |
| quote service | PHP | 成本服务 |
| recommendation service | Python | 推荐服务 |
| shipping service | Rust | shipping service |


## 部署应用
获取 charts 包

```bash
# helm repo add open-telemetry https://open-telemetry.github.io/opentelemetry-helm-charts
# helm pull open-telemetry/opentelemetry-demo --untar
# cd opentelemetry-demo 
# ls
Chart.lock  Chart.yaml  examples  grafana-dashboards  README.md  UPGRADING.md        values.yaml
charts      ci          flagd     products            templates  values.schema.json
```

自定义 charts 包，默认 charts 包集成了opentelemetry-collector、prometheus、grafana、opensearch、jaeger 组件，我们先将其禁用

```bash
# vim values.yaml
default:
  # List of environment variables applied to all components
  env:
    - name: OTEL_COLLECTOR_NAME
      value: center-collector.opentelemetry.svc
opentelemetry-collector:
  enabled: false
jaeger:
  enabled: false
prometheus:
  enabled: false
grafana:
  enabled: false
opensearch:
  enabled: false
```

安装示例应用

```bash
# helm install demo . -f values.yaml
- All services are available via the Frontend proxy: http://localhost:8080
  by running these commands:
     kubectl --namespace default port-forward svc/frontend-proxy 8080:8080

  The following services are available at these paths after the frontend-proxy service is exposed with port forwarding:
  Webstore             http://localhost:8080/
  Jaeger UI            http://localhost:8080/jaeger/ui/
  Grafana              http://localhost:8080/grafana/
  Load Generator UI    http://localhost:8080/loadgen/
  Feature Flags UI     http://localhost:8080/feature/
# kubectl get pod                                 
NAME                               READY   STATUS    RESTARTS      AGE
accounting-79cdcf89df-h8nnc        1/1     Running   0             2m15s
ad-dc6768b6-lvzcq                  1/1     Running   0             2m14s
cart-65c89fcdd7-8tcwp              1/1     Running   0             2m15s
checkout-7c45459f67-xvft2          1/1     Running   0             2m13s
currency-65dd8c8f6-pxxbb           1/1     Running   0             2m15s
email-5659b8d84f-9ljr9             1/1     Running   0             2m15s
flagd-57fdd95655-xrmsk             2/2     Running   0             2m14s
fraud-detection-7db9cbbd4d-znxq6   1/1     Running   0             2m15s
frontend-6bd764b6b9-gmstv          1/1     Running   0             2m15s
frontend-proxy-56977d5ddb-cl87k    1/1     Running   0             2m15s
image-provider-54b56c68b8-gdgnv    1/1     Running   0             2m15s
kafka-976bc899f-79vd7              1/1     Running   0             2m14s
load-generator-79dd9d8d58-hcw8c    1/1     Running   0             2m15s
payment-6d9748df64-46zwt           1/1     Running   0             2m15s
product-catalog-658d99b4d4-xpczv   1/1     Running   0             2m13s
quote-5dfbb544f5-6r8gr             1/1     Running   0             2m14s
recommendation-764b6c5cf8-lnkm6    1/1     Running   0             2m14s
shipping-5f65469746-zdr2g          1/1     Running   0             2m15s
valkey-cart-85ccb5db-kr74s         1/1     Running   0             2m15s
# kubectl get svc 
NAME              TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)                      AGE
ad                ClusterIP   10.103.72.85     <none>        8080/TCP                     2m19s
cart              ClusterIP   10.106.118.178   <none>        8080/TCP                     2m19s
checkout          ClusterIP   10.109.56.238    <none>        8080/TCP                     2m19s
currency          ClusterIP   10.96.112.137    <none>        8080/TCP                     2m19s
email             ClusterIP   10.103.214.222   <none>        8080/TCP                     2m19s
flagd             ClusterIP   10.101.48.231    <none>        8013/TCP,8016/TCP,4000/TCP   2m19s
frontend          ClusterIP   10.103.70.199    <none>        8080/TCP                     2m19s
frontend-proxy    ClusterIP   10.106.13.80     <none>        8080/TCP                     2m19s
image-provider    ClusterIP   10.109.69.146    <none>        8081/TCP                     2m19s
kafka             ClusterIP   10.104.9.210     <none>        9092/TCP,9093/TCP            2m19s
kubernetes        ClusterIP   10.96.0.1        <none>        443/TCP                      176d
load-generator    ClusterIP   10.106.97.167    <none>        8089/TCP                     2m19s
payment           ClusterIP   10.102.143.196   <none>        8080/TCP                     2m19s
product-catalog   ClusterIP   10.109.219.138   <none>        8080/TCP                     2m19s
quote             ClusterIP   10.111.139.80    <none>        8080/TCP                     2m19s
recommendation    ClusterIP   10.97.118.12     <none>        8080/TCP                     2m19s
shipping          ClusterIP   10.107.102.160   <none>        8080/TCP                     2m19s
valkey-cart       ClusterIP   10.104.34.233    <none>        6379/TCP                     2m19s
```

接下来创建 ingress 资源，暴露frontend-proxy 服务 8080 端口

```yaml
apiVersion: traefik.io/v1alpha1
kind: IngressRoute
metadata:
  name: demo
spec:
  entryPoints:
  - web
  routes:
    - match: Host(`demo.cuiliangblog.cn`)
      kind: Rule
      services:
        - name: frontend-proxy
          port: 8080
```

创建完 ingress 资源后添加 hosts 解析并访问验证。

![](assets/06-Kubernetes/388671d918421ddc2900.png)

## 配置 Ingress 输出
以 ingress 为例，从 Traefik v2.6 开始，Traefik 原生支持使用 OpenTelemetry 协议导出追踪数据（traces），这使你可以将 Traefik 的 tracing 数据发送到兼容 OTel 的后端 。Traefik 部署可参考文档：[03-04_%E9%83%A8%E7%BD%B2Traefik%E4%BB%A3%E7%90%86.md](articles/06-Kubernetes/03-04_部署Traefik代理.md)，

access 配置参考文档：[https://doc.traefik.io/traefik/observability/access-logs/#opentelemetry](https://doc.traefik.io/traefik/observability/access-logs/#opentelemetry)

```yaml
# vim values.yaml 
experimental: # 实验性功能配置
  otlpLogs: true # 日志导出otlp格式
additionalArguments: # 自定义启动参数
  - "--experimental.otlpLogs=true"
  - "--accesslog.otlp=true"
  - "--accesslog.otlp.grpc=true"
  - "--accesslog.otlp.grpc.endpoint=center-collector.opentelemetry.svc:4317"
  - "--accesslog.otlp.grpc.insecure=true"
metrics: # 指标
  addInternals: true # 追踪内部流量
  otlp:
    enabled: true # 导出otlp格式
    grpc: # 使用grpc协议
      enabled: true
      endpoint: "center-collector.opentelemetry.svc:4317" # OpenTelemetry地址
      insecure: true # 跳过证书
tracing: # 链路追踪
  addInternals: true # 追踪内部流量（如重定向）
  otlp:
    enabled: true # 导出otlp格式
    grpc: # 使用grpc协议
      enabled: true
      endpoint: "center-collector.opentelemetry.svc:4317" # OpenTelemetry地址
      insecure: true # 跳过证书
```

# 部署组件
## 部署 MinIO
具体可参考文档：[03-10_%E9%83%A8%E7%BD%B2MinIO%E5%AF%B9%E8%B1%A1%E5%AD%98%E5%82%A8.md](articles/06-Kubernetes/03-10_部署MinIO对象存储.md)，此处不再赘述。部署完成后创建 loki、tempo、thanos 三个 bucket，并创建 ak、sk 然后赋予相关权限。

## 部署 Prometheus
具体可参考文档：[03-14_%E9%83%A8%E7%BD%B2Prometheus%E7%9B%91%E6%8E%A7.md](articles/06-Kubernetes/03-14_部署Prometheus监控.md)，此处不再赘述。

## 部署 Thanos（可选）
具体可参考文档：[03-15_%E9%83%A8%E7%BD%B2Thanos%E7%9B%91%E6%8E%A7.md](articles/06-Kubernetes/03-15_部署Thanos监控.md)，此处不再赘述。

## 部署 Grafana
具体可参考文档：[03-14_%E9%83%A8%E7%BD%B2Prometheus%E7%9B%91%E6%8E%A7.md](articles/06-Kubernetes/03-14_部署Prometheus监控.md)，此处不再赘述。

## 部署 OpenTelemetry
具体可参考文档：[18-02_OpenTelemetry%E9%83%A8%E7%BD%B2.md](articles/06-Kubernetes/18-02_OpenTelemetry部署.md)，此处不再赘述。OpenTelemetry 配置文件内容如下

```bash
apiVersion: opentelemetry.io/v1beta1
kind: OpenTelemetryCollector
# 元数据定义部分
metadata:
  name: center        # Collector 的名称为 center
  namespace: opentelemetry
# 具体的配置内容
spec:
  replicas: 1           # 设置副本数量为1
  # image: otel/opentelemetry-collector-contrib:latest  # 使用支持 elasticsearch 的镜像
  image: harbor.cuiliangblog.cn/otel/opentelemetry-collector-contrib:latest
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
      otlp:               # 数据发送到tempo的grpc端口
        endpoint: "tempo:4317"
        tls: # 跳过证书验证
          insecure: true
      prometheus:
        endpoint: "0.0.0.0:9464" # prometheus指标暴露端口
      loki:
        endpoint: http://loki.loki.svc:3100/loki/api/v1/push

    service:            # 服务配置部分
      telemetry:
        logs:
          level: "debug"              # 设置 Collector 自身日志等级为 debug（方便观察日志）
      pipelines:        # 定义处理管道
        traces:         # 定义 trace 类型的管道
          receivers: [otlp]                      # 接收器为 OTLP
          processors: [batch]                    # 使用批处理器
          exporters: [otlp]                      # 将数据导出到OTLP
        metrics:        # 定义 metrics 类型的管道
          receivers: [otlp]                      # 接收器为 OTLP
          processors: [batch]                    # 使用批处理器
          exporters: [prometheus]          # 将数据导出到prometheus
        logs:
          receivers: [otlp]
          processors: [batch]                    # 使用批处理器
          exporters: [loki]
```

## 部署 Tempo
具体可参考文档：[18-05_%E9%93%BE%E8%B7%AF%E8%BF%BD%E8%B8%AA%E6%95%B0%E6%8D%AE%E6%94%B6%E9%9B%86%E4%B8%8E%E5%AF%BC%E5%87%BA.md](articles/06-Kubernetes/18-05_链路追踪数据收集与导出.md)，此处不再赘述。

## 部署 Loki
具体可参考文档：[18-07_%E6%97%A5%E5%BF%97%E6%95%B0%E6%8D%AE%E6%94%B6%E9%9B%86%E4%B8%8E%E5%AF%BC%E5%87%BA.md](articles/06-Kubernetes/18-07_日志数据收集与导出.md)，此处不再赘述。

## ![](assets/06-Kubernetes/d7b92166122275ee29cc.png)
# Grafana配置
## 实现步骤
1. **<font style="color:rgb(51, 51, 51);">配置 Loki 、Temp、Prometheus</font>**<font style="color:rgb(51, 51, 51);"> ：按照上述步骤，分别部署 Prometheus、Loki 和 Tempo，并配置为 Grafana 的数据源。</font>
2. **<font style="color:rgb(51, 51, 51);">日志注入 Trace ID</font>**<font style="color:rgb(51, 51, 51);"> ：如果是手动注入，需要在微服务的日志中注入追踪 ID，通过统一的格式记录。</font>
3. **<font style="color:rgb(51, 51, 51);">创建联合仪表板</font>**<font style="color:rgb(51, 51, 51);"> ：在 Grafana 中创建联合仪表板，通过 Tempo 展示服务调用关系，通过 Prometheus 展示服务指标，通过Loki 展示日志，使用 Trace ID 、Service Name 进行链路追踪、日志、指标数据的关联查询。</font>
4. **<font style="color:rgb(51, 51, 51);">设置告警规则</font>**<font style="color:rgb(51, 51, 51);"> ：在 Grafana 中设置告警规则，例如，当特定的错误日志出现或某些追踪的延迟超出预期时，触发告警通知。</font>

## 联动配置前提
**在日志中注入 trace_id**

+ OTel SDK 支持自动注入（如在日志格式中添加 traceid 字段）

![](assets/06-Kubernetes/b6aedd736602fe056d71.png)

**Metrics 与 Traces 绑定**

+ 通过 labels（如 `service_name`、`span_id`）让时序指标和 Trace 关联。tempo开启metricsGenerator 功能后，可以将 traces 数据写入 prometheus。

![](assets/06-Kubernetes/40411c9a74b408293a5e.png)

# 关联查询实践
## Log->Trace
实现从某条日志记录中快速跳转查看相关的 trace 功能，以便更好地定位问题。  

loki 数据源配置派生字段，具体可参考文档：[https://grafana.com/docs/grafana/next/datasources/loki/configure-loki-data-source/#derived-fields](https://grafana.com/docs/grafana/next/datasources/loki/configure-loki-data-source/#derived-fields)。配置如下：

![](assets/06-Kubernetes/ac1eb8b270f39bf6671a.png)

其中 TraceID 是变量名，type 选择标签匹配，标签是 trace_id。将匹配到的内容通过 `${__value.raw}`提取 trace 的值，然后拼接变量到 tempo 的 dashboard 中。

此时我们查询 loki 日志，便可以通过 traceID 实现从日志到指标数据的关联与跳转查询。

![](assets/06-Kubernetes/277f7d6817d32890eb41.png)

新建 名为 Tempo 的 dashboard，定义 trace_id 参数，通过 url 获取。

![](assets/06-Kubernetes/5497d131fd3f363427a1.png)

此时重新加载 dashboard，便可以根据 url 获取 trace_id 参数并查询 tempo 数据。

![](assets/06-Kubernetes/2e5e5aaa77b86d1af7c7.png)

## Log->Metrics
 在 **Grafana 中实现 Log → Metrics（从日志跳转到指标）**，可以根据日志信息查询对应时间段指标数据，用于监控、告警和分析。 

OpenTelemetry Metrics 可以分为两大类指标来源  

1. **Service Graph 指标**（分布式追踪构建的依赖图）

这些是基于 **Trace 数据自动生成的 metrics**，比如：

traces_service_graph_request_client_seconds_count：服务之间调用的请求次数

traces_service_graph_request_client_seconds_sum：请求总耗时（秒）

traces_service_graph_request_client_seconds_bucket：请求延迟的 histogram 分桶数据

这些指标由 `**servicegraph**`** processor** 生成。

2. **OpenTelemetry SDK Runtime 指标**（运行时指标）

这些指标来自于 SDK 直接采集的应用运行状态，例如：

+ 对于 **JVM**：
    - `jvm_memory_used_bytes`
    - `jvm_threads_count`
    - `jvm_gc_collection_seconds_sum`
+ 对于 **Go**：
    - `go_memstats_alloc_bytes`
    - `process_cpu_seconds_total`
+ 对于 **Python**：
    - `python_gc_objects_collected_total`
    - `process_resident_memory_bytes`

创建名为 metrics 的 dashboard，内容如下：

![](assets/06-Kubernetes/5343c5152c647f64fd87.png)

配置一个名为server 的变量，用于关联日志与指标数据

![](assets/06-Kubernetes/f59fb90f83a47e4732f4.png)

修改 loki 数据源配置，新增派生关联字段

![](assets/06-Kubernetes/d4e43c3d1fc71d5006cc.png)

查看 loki 日志，既可跳转至对应服务的 metrics 信息

![](assets/06-Kubernetes/cbf33f28e8518262af7a.png)

## Trace->Metrics
在 Grafana 中实现 Trace → Metrics 查询，也就是从 链路追踪（Tracing）界面跳转到对应的 Metrics（指标）数据面板，可以用于从一个具体的 Trace 看到相关服务的性能指标，比如延迟、错误率、请求量等。这对于 SRE/DevOps 来说是非常有价值的。  

接下来我们配置 tempo 数据源关联 prometheus 配置，具体可参考文档[https://grafana.com/docs/grafana/next/datasources/tempo/configure-tempo-data-source/#trace-to-metrics](https://grafana.com/docs/grafana/next/datasources/tempo/configure-tempo-data-source/#trace-to-metrics)。

![](assets/06-Kubernetes/03ffb5bc8e4469147a88.png)

查询 traces 标签信息

![](assets/06-Kubernetes/ecfdd7878f6bfb645a23.png)

查询 metrics 标签信息

![](assets/06-Kubernetes/fda9ba8eff32200ed90e.png)

添加 tags 转换，将 traces 的 server.name 转换为 metrics 的 server。

添加两个指标，一个是总请求率，PromQL是 `sum by (client,server)(rate(traces_service_graph_request_total{$__tags}[$__rate_interval]))` ，另一个错误率的 PromQL 是 `sum by (client,server)(rate(traces_service_graph_request_failed_total{$__tags}[$__rate_interval]))`

接下来通过 traces 查询 metrics 数据。

![](assets/06-Kubernetes/9d858d7b1b517b26c8d9.png)

查询结果如下：

![](assets/06-Kubernetes/0b2da7b6c26c3b889d37.png)

## Trace->Log
在 **Grafana 中实现 Tracing → Logging 查询**（即从 Trace 页面跳转查看相关日志）是构建完整 Observability 的关键一环。实现从某个具体的 Trace span 跳转到相关时间段和服务的日志，进一步排查问题。  

接下来我们配置 tempo 数据源关联 loki 配置，具体可参考文档[https://grafana.com/docs/grafana/next/datasources/tempo/configure-tempo-data-source/#trace-to-logs](https://grafana.com/docs/grafana/next/datasources/tempo/configure-tempo-data-source/#trace-to-logs)

![](assets/06-Kubernetes/f3e325aac681fa7f4d9b.png)

添加 tags 转换，将 traces 的 server.name 转换为 logging 的 server_name。

添加自定义查询语句，将 tracing 与 logging 关联 `{${__tags}} | trace_id="${__span.traceId}"`

 接下来通过 tracing 查询 logging 数据。

![](assets/06-Kubernetes/423e898fb6b1990c7ad3.png)

查询结果如下：

![](assets/06-Kubernetes/4252491efaeed9b53434.png)

# 告警配置
在现代微服务架构中，服务数量众多、故障路径复杂、故障影响广泛，依靠人工排查日志和指标已无法满足快速定位问题的需求。借助 Grafana 配置 Prometheus 指标告警 和 Loki 日志关键字告警，能够实现问题的实时监测、自动预警、快速定位与响应，是构建高可用 Observability 系统的关键步骤。

+ Metrics 告警 可以基于服务延迟、错误率、CPU/内存等指标，及时发现性能瓶颈或异常行为，如 P95 延迟升高、请求失败率激增、内存飙升等。
+ Loki 日志告警 则弥补了指标粒度不足的问题，能够基于关键字或异常堆栈的出现频率，第一时间检测到程序错误、异常崩溃、权限问题等复杂事件，尤其在问题根因分析中不可或缺。

将两者结合配置告警，能实现从“宏观指标趋势”到“微观日志细节”的闭环监控体系，大幅提升系统稳定性与运维效率，是企业实现高可靠性、高可观测性体系的基础能力。Grafana 告警规则配置具体可参考文档：

[https://www.cuiliangblog.cn/detail/article/69](https://www.cuiliangblog.cn/detail/article/69)

## 指标告警
推荐配置的告警主要有以下两类：

### Service Graph 类
用于发现：服务响应慢、依赖超时、调用失败、服务“消失”等。

这些指标通过 OpenTelemetry 的 Trace 数据生成，适用于探测服务之间的延迟和调用失败：

| 指标 | 告警建议 | 示例 PromQL |
| --- | --- | --- |
| traces_service_graph_request_client_seconds_count | 调用次数异常下降（服务可能宕机） | increase(traces_service_graph_request_client_seconds_count[5m]) < 1 |
| traces_service_graph_request_client_seconds_sum | 平均延迟过高 | rate(traces_service_graph_request_client_seconds_sum[5m]) / rate(traces_service_graph_request_client_seconds_count[5m]) > 1 |
| traces_service_graph_request_client_seconds_bucket | p95 响应时间异常 | histogram_quantile(0.95, rate(traces_service_graph_request_client_seconds_bucket[5m])) > 1 |


### OpenTelemetry SDK 类
这些指标是 SDK 直接采集的，适用于监控服务进程状态和资源消耗：

**JVM 示例**

| 指标 | 告警建议 | 示例 PromQL |
| --- | --- | --- |
| jvm_memory_used_bytes/jvm_memory_max_bytes | JVM 内存使用率 > 80% | jvm_memory_used_bytes{area="heap"} / jvm_memory_max_bytes{area="heap"} > 0.8 |
| jvm_threads_count | 线程数飙升（可能死循环） | jvm_threads_count > 300 |
| jvm_gc_collection_seconds_sum | GC 时间异常增加 | increase(jvm_gc_collection_seconds_sum[5m]) > 5 |


**通用（跨语言）**

| 指标 | 告警建议 | 示例 PromQL |
| --- | --- | --- |
| process_cpu_seconds_total | CPU 使用率高 | rate(process_cpu_seconds_total[1m]) > 0.9 |
| process_resident_memory_bytes | 内存泄漏趋势 | increase(process_resident_memory_bytes[10m]) > 100000000 |


## 日志告警
配置 **日志关键字告警** 是发现异常最直接、最及时的方式，尤其适合监控应用抛出的错误、异常堆栈、拒绝请求等。以下是一些常见的关键字和告警配置建议  

### 推荐日志关键字  
错误类关键词（系统级/程序级异常）

| 关键词 | 说明 |
| --- | --- |
| error | 通用错误关键字 |
| Exception | Java/Python 等抛出的异常 |
| NullPointerException | JVM 常见致命错误 |
| Traceback | Python 错误堆栈 |
| panic | Go 程序崩溃时抛出的 panic |
| level=error | structured log 关键字段 |
| status=500 | HTTP 请求失败（服务端） |


性能类关键词（瓶颈、超时、拒绝）

| 关键词 | 说明 |
| --- | --- |
| timeout | 调用超时，可能是依赖或 DB 问题 |
| slow | 接口响应慢（配合上游埋点） |
| TooManyRequests/429 | 接入限流或被限流 |
| OutOfMemoryError | JVM OOM |
| rejected | 线程池拒绝执行任务等场景 |


业务/安全关键词（敏感场景）

| 关键词 | 说明 |
| --- | --- |
| unauthorized/401 | 非法访问请求 |
| forbidden/403 | 权限不足 |
| invalid token | Token 验证失败 |
| login failed | 登陆失败次数过多可能是攻击 |
| sql error/dberror | 数据库操作失败 |


### Loki Alerting 示例（基于 LogQL）
5 分钟内 `error` 日志超过 10 条：

```plain
count_over_time({app="my-app"} |= "error"[5m]) > 10
```

多关键词联合

```plain
count_over_time({job="checkout"} |= "error" or |= "Exception"[5m]) > 5
```

使用正则匹配关键词结尾

```plain
count_over_time({job="api"} |=~ "(?i)(panic|timeout|oom|Exception)$"[5m]) > 0
```


