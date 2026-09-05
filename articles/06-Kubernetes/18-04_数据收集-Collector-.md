# 数据收集(Collector)

> 分类：Kubernetes / 第18章：OpenTelemetry可观测性
> 原文：https://www.cuiliangblog.cn/detail/section/216910953
> 来源：崔亮的博客

---

 OpenTelemetry 的 Collector 组件是实现观测数据（Trace、Metrics、Logs）收集、处理和导出的一站式服务。它的配置主要分为以下 **四大核心模块**：  

+  receivers（接收数据）  
+  processors（数据处理）  
+  exporters（导出数据）  
+  service（工作流程）  

# 收集器配置详解
具体配置项可参考文档[https://opentelemetry.io/docs/collector/configuration/](https://opentelemetry.io/docs/collector/configuration/)

## 配置格式
```yaml
apiVersion: opentelemetry.io/v1beta1
kind: OpenTelemetryCollector          # 定义资源类型为 OpenTelemetryCollector
metadata:
  name: sidecar                       # Collector 的名称
spec:
  mode: sidecar                       # 以 sidecar 模式运行（与应用容器同 Pod）
  config:                             # Collector 配置部分（结构化 YAML）
    receivers:    # 数据接收器（如 otlp、prometheus）
    processors:   # 数据处理器（如 batch、resource、attributes）
    exporters:    # 数据导出器（如 otlp、logging、jaeger、prometheus）
    service:      # 服务配置（定义哪些 pipeline 生效）
      pipelines:
        traces:   # trace 数据的处理流程
        metrics:  # metric 数据的处理流程
        logs:     # log 数据的处理流程
```

##  Receivers（接收器）
用于**接收数据**。支持的类型有很多，

otlp：接收 otlp 协议的数据内容 

```yaml
receivers:
  otlp:
    protocols:
      grpc:                      # 高性能、推荐使用
        endpoint: 0.0.0.0:4317
      http:                      # 浏览器或无 gRPC 支持的环境
        endpoint: 0.0.0.0:4318
```

prometheus： 用于采集 `/metrics` 接口的数据。  

```yaml
receivers:
  prometheus:
    config:
      scrape_configs:
        - job_name: my-service
          static_configs:
            - targets: ['my-app:8080']
```

filelog: 从文件读取日志

```yaml
receivers:
  filelog:
    include: [ /var/log/myapp/*.log ]
    start_at: beginning
    operators:
      - type: json_parser
        parse_from: body
        timestamp:
          parse_from: attributes.time
```

##  Processors（处理器）  
 用于在导出前对数据进行**修改、增强或过滤**。常用的包括：  

 batch ： 将数据批处理后导出，提高吞吐量。  

```yaml
processors:
  batch:
    timeout: 10s
    send_batch_size: 1024
```

 resource ： 为 trace/metric/log 添加统一标签。  

```yaml
processors:
  resource:
    attributes:
      - key: service.namespace
        value: demo
        action: insert
```

 attributes ： 添加、修改或删除属性  

```yaml
processors:
  attributes:
    actions:
      - key: http.method
        value: GET
        action: insert
```

处理器配置可参考文档：[https://github.com/open-telemetry/opentelemetry-collector-contrib/tree/main/processor](https://github.com/open-telemetry/opentelemetry-collector-contrib/tree/main/processor)

##  Exporters（导出器）  
 用于**将数据导出到后端系统**

** **otlp: 用于将数据发送到另一个 OTEL Collector、Jaeger、Tempo、Datadog 等。 

```yaml
exporters:
  otlp:
    endpoint: tempo-collector:4317
    tls:
      insecure: true
```

  Prometheus： 用于暴露一个 `/metrics` HTTP 端口给 Prometheus 拉取。  

```yaml
exporters:
  prometheus:
    endpoint: "0.0.0.0:8889"
```

 logging ： 调试用，打印数据到控制台。  

```yaml
exporters:
  debug:
    loglevel: debug
```

##  Service（工作流程）
`service.pipelines` 是一个“调度图”，告诉 OpenTelemetry Collector，对于某种类型的数据，比如 trace，请用哪个 `receiver` 来接收，用哪些 `processor` 来处理，最终送到哪些 `exporter` 去导出。  

```yaml
service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [batch, resource]
      exporters: [otlp, logging]
    metrics:
      receivers: [prometheus]
      processors: [batch]
      exporters: [prometheus]
    logs:
      receivers: [filelog]
      processors: [batch]
      exporters: [otlp]
```

# Collector 发行版本区别
`opentelemetry-collector` 和 `opentelemetry-collector-contrib` 是两个 OpenTelemetry Collector 的发行版本，它们的区别主要在于 **内置组件的丰富程度** 和 **维护主体**。  

| 项目 | `opentelemetry-collector` | `opentelemetry-collector-contrib` |
| --- | --- | --- |
| **维护者** | OpenTelemetry 官方核心团队 | OpenTelemetry 社区（贡献者更广） |
| **组件数量** | 精简，包含核心组件（如 OTLP） | 丰富，包含大量插件（如 Loki、Elastic 等） |
| **稳定性** | 高，更加稳定 | 相对更快发布新功能，可能略微不稳定 |
| **推荐用途** | 做基础平台或自定义 Collector 构建的底座 | 直接使用或扩展，适合大多数场景 |
| **是否可扩展** | 支持自定义构建 | 支持自定义构建 |
| **编译时间** | 快（组件少） | 慢（组件多） |



