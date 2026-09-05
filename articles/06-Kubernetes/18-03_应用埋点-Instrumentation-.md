# 应用埋点(Instrumentation)

> 分类：Kubernetes / 第18章：OpenTelemetry可观测性
> 原文：https://www.cuiliangblog.cn/detail/section/216678140
> 来源：崔亮的博客

---

# 埋点
## 什么是埋点
埋点，本质就是在你的应用程序里，在重要位置插入采集代码，比如：

+ 收集请求开始和结束的时间
+ 收集数据库查询时间
+ 收集函数调用链路信息
+ 收集异常信息

这些埋点数据（Trace、Metrics、Logs）被收集起来后，可以在监控平台看到系统运行时的真实表现，帮助你做：

+ 性能分析
+ 故障排查
+ 调用链路追踪

简单说就是："在合适的地方插追踪/监控代码"。

要使用 OpenTelemetry 检测应用程序，可以前往访问 OpenTelemetry 存储库，选择适用于的应用程序的语言，然后按照说明进行操作。具体可以参考文档：[https://opentelemetry.opendocs.io/docs/getting-started/dev/](https://opentelemetry.opendocs.io/docs/getting-started/dev/)

## 自动埋点
使用自动埋点是一个很好的方式，因为它简单、容易，不需要进行很多代码更改。

如果你没有必要的知识（或时间）来创建适合你应用程序量身的追踪代码，那么这种方法就非常合适。

OpenTelemetry 支持自动化埋点的语言：

+ .net
+ Java
+ JavaScript
+ PHP
+ Python

## 手动检测
手动检测是指为应用程序编写特定的埋点代码。这是向应用程序添加可观测性代码的过程。这样做可以更有效地满足你的需求，因为可以自己添加属性和事件。这样做的缺点是需要导入库并自己完成所有工作。

## 埋点方式对比
| | 手动埋点（Manual Instrumentation） | 自动埋点（Automatic Instrumentation） |
| --- | :--- | :--- |
| **定义** | 程序员自己在代码里显式写下采集逻辑 | 借助 SDK/Agent 自动拦截应用，无需修改业务代码 |
| **实现方式** | 引用 OpenTelemetry API，比如创建 `Tracer`，手动打 `span` | 安装一个 Agent（Java agent、Python instrumentation）自动检测框架和库，插入追踪 |
| **控制力度** | 非常高，想怎么打点都可以 | 较低，受限于 Agent 支持的范围 |
| **开发成本** | 高，需要自己判断哪里要加埋点 | 低，几乎开箱即用 |
| **支持范围** | 业务逻辑细粒度打点，比如特定函数、算法内部 | 框架级打点，比如 HTTP 请求、数据库访问、消息队列消费 |
| **性能影响** | 可控，看你打点多少 | 可能稍高，因为 Agent 会 Hook 很多地方 |
| **典型场景** | 需要追踪复杂业务逻辑 | 快速上线链路追踪，不想改代码 |


## k8s 应用自动埋点步骤
+ **部署 OpenTelemetry Operator**：它帮你管理 `Instrumentation` 和 `OpenTelemetryCollector`，实现自动注入、自动采集功能。
+ **部署 OpenTelemetryCollector**：用来接收自动埋点产生的数据，比如 traces。
+ **定义 Instrumentation 对象**：声明“我想要给哪些应用自动打点”（比如 Java 的 agent），并指定用哪个 `Collector`。
+ **给你的 Pod 加上 Annotation**：Operator 会根据 Annotation 自动注入 Agent 和 Sidecar。

# 自动埋点配置详解  
## 配置示例
```yaml
apiVersion: opentelemetry.io/v1alpha1
kind: Instrumentation
metadata:
  name: <name>
  namespace: <namespace>
spec:
  exporter:                     # 导出目标配置
    endpoint: <string>          # 指定导出的地址，通常是 OpenTelemetry Collector 的 OTLP 接收端口
    tls:											  # 是否使用非加密连接（跳过 TLS）
      insecure: <bool>          # 跳过 TLS 校验，默认 false
      insecureSkipVerify: <bool>
  propagators:								  # 上下文传播协议，如果是跨服务追踪，一定要所有服务使用同一传播协议
    - tracecontext              # W3C Trace Context 标准（推荐）
    - baggage                   #	W3C Baggage（支持传递 key-value）
    - b3                        #	B3 single-header（Zipkin 风格）
    - b3multi                   # B3 multi-header
    - jaeger                    # Jaeger 原生格式
  sampler:									  	# 采样器配置
    type: <sampler_type>
    argument: <string>        
  resource:											# 资源标签，可选配置
    attributes:
      service.name: <string>      # 用于区分不同服务
      service.namespace: <string> # 服务所属 namespace
      service.version: <string>   # 服务版本
  env:												  	# 全局环境变量
    - name: OTEL_FOO
      value: "bar"             
```

## 采样器配置
采样器配置如下：

| 类型 | 含义 | 是否支持 argument |
| --- | --- | --- |
| `always_on` | 全部采样 | 否 |
| `always_off` | 全部不采样 | 否 |
| `traceidratio` | 指定比例采样 | 是（如 `"0.25"`） |
| `parentbased_traceidratio` | 如果上游有 trace，继承上游；否则按照比例采样 | 是 |
| `parentbased_always_on` | 如果上游有 trace，继承；否则全部采样 | 否 |
| `parentbased_always_off` | 如果上游有 trace，继承；否则不采样 | 否 |


`argument` 字段通常是小数，表示采样概率，如 `"1"` 表示 100%，`"0.5"` 表示 50%。

## 其他配置
其他配置可通过环境变量方式注入，具体配置项可参考文档：

[https://opentelemetry.io/docs/languages/sdk-configuration/](https://opentelemetry.io/docs/languages/sdk-configuration/)

# 部署示例应用
## 部署 java 应用
这里我们将使用一个名为 Petclinic 的 Java 应用程序，这是一个使用 Maven 或 Gradle 构建的 Spring Boot 应用程序。该应用程序将使用 OpenTelemetry 生成数据。

Petclinic 示例项目地址：[https://github.com/spring-projects/spring-petclinic](https://github.com/spring-projects/spring-petclinic)

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: java-demo
spec:
  selector:
    matchLabels:
      app: java-demo
  template:
    metadata:
      labels:
        app: java-demo
    spec:
      containers:
      - name: java-demo
        image: contrastsecuritydemo/spring-petclinic:1.5.1
        imagePullPolicy: IfNotPresent
        resources:
          limits:
            memory: "2Gi"
            cpu: "500m"
          requests:
            memory: "1Gi"
            cpu: "200m"
        ports:
        - containerPort: 8080
---
apiVersion: v1
kind: Service
metadata:
  name: java-demo
spec:
  selector:
    app: java-demo
  ports:
  - port: 8080
    targetPort: 8080
---
apiVersion: traefik.io/v1alpha1
kind: IngressRoute
metadata:
  name: java-demo
spec:
  entryPoints:
  - web
  routes:
  - match: Host(`java-demo.cuiliangblog.cn`)
    kind: Rule
    services:
      - name: java-demo
        port: 8080
```

部署完成后通过域名访问验证。

![](assets/06-Kubernetes/5b358b64867ef7a89360.png)

## 部署 python 应用
这里我们将使用一个名为 [python-demoapp](https://github.com/benc-uk/python-demoapp) 的 python 应用程序，这是一个使用 flask 构建的 web 应用程序。该应用程序将使用 OpenTelemetry 生成数据。

项目地址：[https://github.com/benc-uk/python-demoapp](https://github.com/benc-uk/python-demoapp)

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: python-demo
spec:
  selector:
    matchLabels:
      app: python-demo
  template:
    metadata:
      labels:
        app: python-demo
    spec:
      containers:
      - name: python-demo
        image: ghcr.io/benc-uk/python-demoapp:latest
        imagePullPolicy: IfNotPresent
        resources:
          limits:
            memory: "500Mi"
            cpu: "200m"
        ports:
        - containerPort: 5000
---
apiVersion: v1
kind: Service
metadata:
  name: python-demo
spec:
  selector:
    app: python-demo
  ports:
  - port: 5000
    targetPort: 5000
---
apiVersion: traefik.io/v1alpha1
kind: IngressRoute
metadata:
  name: python-demo
spec:
  entryPoints:
  - web
  routes:
  - match: Host(`python-demo.local.com`)
    kind: Rule
    services:
      - name: python-demo
        port: 5000
```

接下来通过域名访问应用

![](assets/06-Kubernetes/152a29478b3b3e8feb30.png)

# 应用埋点
## java 应用自动埋点
对于 Java 应用，我们可以通过下载 OpenTelemetry 提供的 opentelemetry-javaagent 这个 jar 包来使用 OpenTelemetry 自动检测应用程序。

opentelemetry-javaagent 地址：[https://github.com/open-telemetry/opentelemetry-java-instrumentation](https://github.com/open-telemetry/opentelemetry-java-instrumentation)

只需要将这个 jar 包添加到应用程序的启动命令中即可，比如：

```bash
java -javaagent:opentelemetry-javaagent.jar -jar target/*.jar
```

Java 自动检测使用可附加到任何 Java 8+ 应用程序的 Java 代理 JAR。它动态注入字节码以从许多流行的库和框架捕获遥测数据。它可用于捕获应用程序或服务“边缘”的遥测数据，例如入站请求、出站 HTTP 调用、数据库调用等。通过运行以上命令，我们可以对应用程序进行插桩，并生成链路数据，而对我们的应用程序没有任何修改。<font style="color:rgb(38, 38, 38);">  
</font><font style="color:rgb(38, 38, 38);">尤其是在 Kubernetes 环境中，我们可以使用 OpenTelemetry Operator 来注入和配置 OpenTelemetry 自动检测库，这样连 javaagent 我们都不需要去手动注入了。  
</font><font style="color:rgb(38, 38, 38);">接下来为 Java 应用程序添加一个 Instrumentation 资源。</font>

```yaml
apiVersion: opentelemetry.io/v1alpha1    
kind: Instrumentation                     # 声明资源类型为 Instrumentation（用于语言自动注入）
metadata:
  name: java-instrumentation              # Instrumentation 资源的名称（可以被 Deployment 等引用）
  namespace: opentelemetry
spec:
  propagators:                            # 指定用于 trace 上下文传播的方式，支持多种格式
    - tracecontext                        # W3C Trace Context（最通用的跨服务追踪格式）
    - baggage                             # 传播用户定义的上下文键值对
    - b3                                  # Zipkin 的 B3 header（用于兼容 Zipkin 环境）
  sampler:                                # 定义采样策略（决定是否收集 trace）
    type: always_on                       # 始终采样所有请求（适合测试或调试环境）
  java:
    # image: ghcr.io/open-telemetry/opentelemetry-operator/autoinstrumentation-java:latest
                                          # 使用的 Java 自动注入 agent 镜像地址
    env:
      - name: OTEL_EXPORTER_OTLP_PROTOCOL
        value: grpc
      - name: OTEL_EXPORTER_OTLP_ENDPOINT
        value: http://localhost:4317
```

<font style="color:rgb(38, 38, 38);">为了启用自动检测，我们需要更新部署文件并向其添加注解。这样我们可以告诉 OpenTelemetry Operator 将 sidecar 和 java-instrumentation 注入到我们的应用程序中。修改 Deployment 配置如下：</font>

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: java-demo
spec:
  selector:
    matchLabels:
      app: java-demo
  template:
    metadata:
      labels:
        app: java-demo
      annotations:
        instrumentation.opentelemetry.io/inject-java: "opentelemetry/java-instrumentation" # 填写 Instrumentation 资源的名称
        sidecar.opentelemetry.io/inject: "opentelemetry/sidecar" # 注入一个 sidecar 模式的 OpenTelemetry Collector
    spec:
      containers:
      - name: java-demo
        image: contrastsecuritydemo/spring-petclinic:1.5.1
        imagePullPolicy: IfNotPresent
        resources:
          limits:
            memory: "2Gi"
            cpu: "500m"
          requests:
            memory: "1Gi"
            cpu: "200m"
        ports:
        - containerPort: 8080
```

<font style="color:rgb(38, 38, 38);">接下来更新 deployment，然后查看资源信息，java-demo 容器已经变为两个。</font>

```bash
# kubectl get pod
NAME                        READY   STATUS    RESTARTS      AGE
java-demo-557fff6b7c-x8tjg  2/2     Running   0               3m6s
# kubectl get opentelemetrycollectors -A                 
NAMESPACE       NAME      MODE         VERSION   READY   AGE   IMAGE                                                                                     MANAGEMENT
default         sidecar   sidecar      0.123.1           39m                                                                                             managed
opentelemetry   simple    deployment   0.123.1   1/1     39m   ghcr.io/open-telemetry/opentelemetry-collector-releases/opentelemetry-collector:0.123.1   managed
# kubectl get instrumentations -A                 
NAMESPACE       NAME                   AGE   ENDPOINT   SAMPLER     SAMPLER ARG
opentelemetry   java-instrumentation   39m              always_on 
```

<font style="color:rgb(38, 38, 38);">查看 sidecar日志，已正常启动并发送 spans 数据</font>

```bash
# kubectl logs java-demo-557fff6b7c-x8tjg -c otc-container
……
2026-04-12T03:04:55.322Z        info    Traces  {"resource": {"service.instance.id": "263a65ca-eaee-47a2-a8b8-0902ca3706ff", "service.name": "otelcol", "service.version": "0.148.0"}, "otelcol.component.id": "debug", "otelcol.component.kind": "exporter", "otelcol.signal": "traces", "resource spans": 1, "spans": 12}
2026-04-12T03:05:00.345Z        info    Traces  {"resource": {"service.instance.id": "263a65ca-eaee-47a2-a8b8-0902ca3706ff", "service.name": "otelcol", "service.version": "0.148.0"}, "otelcol.component.id": "debug", "otelcol.component.kind": "exporter", "otelcol.signal": "traces", "resource spans": 1, "spans": 26}
```

<font style="color:rgb(38, 38, 38);">查看collector 日志，已经收到 traces 数据</font>

```bash
# kubectl logs -n opentelemetry simple-collector-5b5699b46f-qgdw6
……
2026-04-12T03:04:50.327Z        info    Traces  {"resource": {"service.instance.id": "65e1358c-7ab3-44cd-8fef-3b6ce1ff1a51", "service.name": "otelcol", "service.version": "0.148.0"}, "otelcol.component.id": "debug", "otelcol.component.kind": "exporter", "otelcol.signal": "traces", "resource spans": 1, "spans": 19}
2026-04-12T03:04:55.351Z        info    Traces  {"resource": {"service.instance.id": "65e1358c-7ab3-44cd-8fef-3b6ce1ff1a51", "service.name": "otelcol", "service.version": "0.148.0"}, "otelcol.component.id": "debug", "otelcol.component.kind": "exporter", "otelcol.signal": "traces", "resource spans": 1, "spans": 12}
2026-04-12T03:05:00.376Z        info    Traces  {"resource": {"service.instance.id": "65e1358c-7ab3-44cd-8fef-3b6ce1ff1a51", "service.name": "otelcol", "service.version": "0.148.0"}, "otelcol.component.id": "debug", "otelcol.component.kind": "exporter", "otelcol.signal": "traces", "resource spans": 1, "spans": 26}
```

## python 应用自动埋点
与 java 应用类似，python 应用同样也支持自动埋点， OpenTelemetry 提供了 `opentelemetry-instrument` CLI 工具，在启动 Python 应用时通过 `sitecustomize` 或环境变量注入自动 instrumentation。

我们先创建一个java-instrumentation 资源

```yaml
apiVersion: opentelemetry.io/v1alpha1    
kind: Instrumentation                     # 声明资源类型为 Instrumentation（用于语言自动注入）
metadata:
  name: python-instrumentation              # Instrumentation 资源的名称（可以被 Deployment 等引用）
  namespace: opentelemetry
spec:
  propagators:                            # 指定用于 trace 上下文传播的方式，支持多种格式
    - tracecontext                        # W3C Trace Context（最通用的跨服务追踪格式）
    - baggage                             # 传播用户定义的上下文键值对
    - b3                                  # Zipkin 的 B3 header（用于兼容 Zipkin 环境）
  sampler:                                # 定义采样策略（决定是否收集 trace）
    type: always_on                       # 始终采样所有请求（适合测试或调试环境）
  python:
    image: ghcr.io/open-telemetry/opentelemetry-operator/autoinstrumentation-python:latest
    env:                                  
      - name: OTEL_PYTHON_LOGGING_AUTO_INSTRUMENTATION_ENABLED # 启用日志的自动检测
        value: "true"
      - name: OTEL_PYTHON_LOG_CORRELATION # 在日志中启用跟踪上下文注入
        value: "true"
      - name: OTEL_EXPORTER_OTLP_ENDPOINT
        value: http://localhost:4317
```

然后更新 deployment 资源清单，添加注解

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: python-demo
spec:
  selector:
    matchLabels:
      app: python-demo
  template:
    metadata:
      labels:
        app: python-demo
      annotations:
        instrumentation.opentelemetry.io/inject-python: "opentelemetry/python-instrumentation" # 填写 Instrumentation 资源的名称
        sidecar.opentelemetry.io/inject: "opentelemetry/sidecar" # 注入一个 sidecar 模式的 OpenTelemetry Collector
      ……
```

接下来观察日志既可。


