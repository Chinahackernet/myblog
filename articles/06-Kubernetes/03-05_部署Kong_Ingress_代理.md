# 部署Kong Ingress 代理

> 分类：Kubernetes / 第3章：周边组件安装部署
> 原文：https://www.cuiliangblog.cn/detail/section/260787281
> 来源：崔亮的博客

---

# Kong Ingress介绍
## KIC介绍
Kong 网关一般通过 Admin API 进行资源管理，可管理的资源包括 Service、Route、Plugin、Consumer 等，在定义资源规则后，Kong 将按照这些配置规则进行对上游服务的请求进行路由分发和控制。

在 Kubernetes 集群环境下，Admin API 方式不是很适应 Kubernetes 声明式管理方式。所以 Kong 在 Kubernetes 集群环境下推出Kong Ingress Controller，涵盖了原 Admin API 的各个方面。因此，Kong Ingress Controller 的作用不仅仅是代理进入 Kubernetes 集群的流量，也可以实现插件配置、负载平衡、健康检查等 Kong 提供的所有功能。

下图展示了它的工作原理：  
![](assets/06-Kubernetes/6b57e75778e103c9ccf0.png)

当您安装了 Kong Ingress Controller，Controller 管理器将监听 Kubernetes 集群内部发生的变化，并更新 Kong 以响应这些变化，从而能够正确代理所有流量。与此同时，Kong 也会根据 Controller 同步的信息进行动态更新，以响应 Kubernetes 集群内发生的扩展、配置更改和故障等变化。

## 资源对应关系
Kong Ingress Controller 旨在将您配置在 Kubernetes 集群中的资源同步到 Kong ，并生成对应的 Kong 资源以便能够使用 Kong 原有机制进行网关操作。两者资源的对应关系如下：

Kubernetes Service：对应 Kong Service 和 Kong Upstream

Kubernetes Pod：对应 Kong Target

Kubernetes Ingress：对应 Kong Route

![](assets/06-Kubernetes/bd368d08bfcda3f0ba11.png)

## Gateway API 介绍
Gateway API是 Kubernetes 的一项功能，它可以帮助创建网关，以便外部流量进入您的集群。

Ingress是一种主要用于 Kubernetes 环境的流量路由机制。然而，它存在一些局限性。例如，它仅支持基于 HTTP 的第 7 层流量

因此，为了克服 Ingress 的所有限制，Kubernetes Gateway API 应运而生Gateway API具有以下特性：   

+ Gateway  API 可以基于 HTTP、gRPC 或 TCP/UDP（实验性）执行 L4 和 L7 路由
+ 可以根据HTTP标头路由流量    
+ 可以执行跨命名空间路由    
+ 支持加权流量路由、蓝绿部署、金丝雀部署等    
+ 减少了对特定供应商控制器注释的依赖，使配置在不同环境之间更具可移植性    
+ Gateway API 也非常适合与Istio、Linkerd 等服务网格集成

总而言之，Gateway API 是 Kubernetes Ingress 的改进版本，提供了更强大、更灵活的流量管理虽然 Gateway API 提供了许多用于管理集群流量的对象，但实际的路由是由 Gateway API 控制器完成的。该控制器并非 Kubernetes 内置，您需要像配置 Ingress 一样，设置一个第三方（供应商）控制器。

# Kong Ingress
安装可参考官方文档：[https://developer.konghq.com/kubernetes-ingress-controller/install/#install-site-kic-product-name](https://developer.konghq.com/kubernetes-ingress-controller/install/#install-site-kic-product-name)

## 启用 Gateway API
安装 Gateway API CRD

```bash
# kubectl apply -f https://github.com/kubernetes-sigs/gateway-api/releases/download/v1.4.1/standard-install.yaml
customresourcedefinition.apiextensions.k8s.io/backendtlspolicies.gateway.networking.k8s.io created
customresourcedefinition.apiextensions.k8s.io/gatewayclasses.gateway.networking.k8s.io created
customresourcedefinition.apiextensions.k8s.io/gateways.gateway.networking.k8s.io created
customresourcedefinition.apiextensions.k8s.io/grpcroutes.gateway.networking.k8s.io created
customresourcedefinition.apiextensions.k8s.io/httproutes.gateway.networking.k8s.io created
customresourcedefinition.apiextensions.k8s.io/referencegrants.gateway.networking.k8s.io created
```

创建一个实例来使用Gateway

```bash
echo "
apiVersion: v1
kind: Namespace
metadata:
  name: kong
---
apiVersion: gateway.networking.k8s.io/v1
kind: GatewayClass
metadata:
  name: kong
  annotations:
    konghq.com/gatewayclass-unmanaged: 'true'
spec:
  controllerName: konghq.com/kic-gateway-controller
---
apiVersion: gateway.networking.k8s.io/v1
kind: Gateway
metadata:
  name: kong
spec:
  gatewayClassName: kong
  listeners:
  - name: proxy
    port: 80
    protocol: HTTP
    allowedRoutes:
      namespaces:
         from: All
" | kubectl apply -n kong -f -

```

## helm 安装Kong Ingress
参考文档：[https://developer.konghq.com/kubernetes-ingress-controller/install/](https://developer.konghq.com/kubernetes-ingress-controller/install/)

需要注意不同 kong ingress 版本对 k8s 支持情况不同，具体可参考文档：[https://developer.konghq.com/kubernetes-ingress-controller/support/](https://developer.konghq.com/kubernetes-ingress-controller/support/)

以 k8s1.30 版本为例，最新的支持版本为3.4 LTS

添加 repo 仓库并获取 charts 包

```bash
# helm repo add kong https://charts.konghq.com 
"kong" has been added to your repositories
# helm repo update                            
# helm search repo kong             
NAME                    CHART VERSION   APP VERSION     DESCRIPTION                                       
kong/kong               3.0.2           3.9             The Cloud-Native Ingress and API-management       
kong/kong-operator      1.2.2           2.1.2           Deploy Kong Operator                              
stable/kong             0.36.7          1.4             DEPRECATED The Cloud-Native Ingress and API-man...
kong/gateway-operator   0.6.1           1.6             Deploy Kong Gateway Operator                      
kong/ingress            0.22.0          3.9             Deploy Kong Ingress Controller and Kong Gateway 

# helm pull kong/ingress --untar             
# cd ingress    
# ls
CHANGELOG.md  Chart.lock  charts  Chart.yaml  README.md  values.yaml
```

通常在实际生产环境中，会分别部署两套 ingress 用于处理内网和外网请求，这样做的好处是：

+ 安全隔离 — 外网 Kong 被攻击或配置错误，不影响内网流量
+ 配置独立 — 外网可以挂 WAF、限流、鉴权插件，内网宽松策略，互不干扰
+ 故障域隔离 — 外网 Kong 崩溃，内网服务不受影响
+ 权限管控 — 可以对两个 Kong 的 CRD 资源设置不同的 RBAC 权限

values 值定义可参考文档：[https://github.com/Kong/charts/blob/main/charts/kong/README.md](https://github.com/Kong/charts/blob/main/charts/kong/README.md)

接下来以内外网共用一套 ingressclass 为例，修改 kong 的 values.yaml 文件如下：

```bash
# vim values.yaml
deployment:
  test:
    enabled: false

controller:
  proxy:
    nameOverride: "{{ .Release.Name }}-gateway-proxy"

  enabled: true

  replicaCount: 3  # controller 副本数
  deployment:
    kong:
      enabled: false

  ingressController:
    # image: # 自定义镜像地址
    #   repository: swr.cn-north-4.myhuaweicloud.com/ddn-k8s/docker.io/kong/kubernetes-ingress-controller
    #   tag: "3.5"
    #   pullPolicy: IfNotPresent
    enabled: true
    # ingressClass: kong-internal  # 可指定 ingressClass 名称
    gatewayDiscovery:
      enabled: true
      generateAdminApiService: true
      # gatewayClassName: kong-internal # 可指定 ingressClass 名称

  podAnnotations:
    kuma.io/gateway: enabled
    # This port must match your Kong admin API port. 8444 is the default.
    # If you set gateway.admin.tls.containerPort, change these annotations
    # to use that value.
    traffic.kuma.io/exclude-outbound-ports: "8444"
    traffic.sidecar.istio.io/excludeOutboundPorts: "8444"

  nodeSelector:
    ingress: "true"  # 调度到指定标签节点

gateway:
  enabled: true
  replicaCount: 3 # 指定副本数
  # image: # 自定义镜像地址
  #   repository: swr.cn-north-4.myhuaweicloud.com/ddn-k8s/docker.io/library/kong
  #   tag: "3.9"
  #   pullPolicy: IfNotPresent
  deployment:
    kong:
      enabled: true

  # 默认使用LoadBalancer，自建机房的k8s修改为使用节点端口暴露服务。
  proxy: 
    nameOverride: kong-gateway-proxy
    type: ClusterIP
    http:
      containerPort: 8000
      hostPort: 80
    tls:
      containerPort: 8443
      hostPort: 443

  admin:
    enabled: true
    type: ClusterIP
    clusterIP: None

  ingressController:
    enabled: false

  env:
    role: traditional
    database: "off"
  nodeSelector:
    ingress: "true"  # 调度到指定标签节点
```

## 安装 Kong
```bash
# helm install kong -n kong . -f values.yaml --create-namespace
NAME: kong
LAST DEPLOYED: Sat Mar 28 23:35:10 2026
NAMESPACE: kong
STATUS: deployed
REVISION: 1
TEST SUITE: None
```

也可指定内网安装命令 `helm install kong-internal -n kong . -f values-internal.yaml`

## 查看验证
```bash
#  kubectl get pod -n kong
NAME                              READY   STATUS    RESTARTS   AGE
kong-controller-d9f9d759f-fd5hp   1/1     Running   0          49s
kong-controller-d9f9d759f-rqtzh   1/1     Running   0          50s
kong-controller-d9f9d759f-zhl5w   1/1     Running   0          49s
kong-gateway-84bd945747-bfb2s     1/1     Running   0          50s
kong-gateway-84bd945747-p6g8c     1/1     Running   0          49s
kong-gateway-84bd945747-vf8c2     1/1     Running   0          49s
# kubectl get svc -n kong           
NAME                                 TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)                         AGE
kong-controller-metrics              ClusterIP   10.107.226.243   <none>        10255/TCP,10254/TCP             3m22s
kong-controller-validation-webhook   ClusterIP   10.103.88.212    <none>        443/TCP                         3m22s
kong-gateway-admin                   ClusterIP   None             <none>        8444/TCP                        3m22s
kong-gateway-manager                 NodePort    10.100.243.48    <none>        8002:30597/TCP,8445:31009/TCP   3m22s
kong-gateway-proxy                   ClusterIP   10.96.224.187    <none>        80/TCP,443/TCP                  3m22s
# kubectl get gateway -n kong
NAME   CLASS   ADDRESS   PROGRAMMED   AGE
kong   kong              True         36s
# kubectl get gatewayclasses.gateway.networking.k8s.io
NAME   CONTROLLER                          ACCEPTED   AGE
kong   konghq.com/kic-gateway-controller   True       36s
```

# 使用 ingress
## 基本使用
kong ingress 使用和 nginx ingress 完全一致，接下来创建最简单的 nginx，并配置 svc 和 ingress，查看效果。

部署测试服务

```yaml
# kubectl apply -f https://developer.konghq.com/manifests/kic/echo-service.yaml
# kubectl get pod              
NAME                    READY   STATUS    RESTARTS   AGE
echo-55d7d4c86d-q8pgm   1/1     Running   0          43s
# kubectl get svc 
NAME         TYPE        CLUSTER-IP   EXTERNAL-IP   PORT(S)                               AGE
echo         ClusterIP   10.97.37.8   <none>        1025/TCP,1026/TCP,1027/TCP,1030/TCP   7m21s
```

创建路由

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: echo
  # annotations: # 后端收到的 URL 去掉 Ingress 中匹配的前缀
    # konghq.com/strip-path: "true"
spec:
  ingressClassName: kong # 指定ingressclass
  rules:
    - host: echo.cuiliangblog.cn
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: echo
                port:
                  number: 1027
```

创建完后绑定 host，访问验证

![](assets/06-Kubernetes/16ddb9766c1e3de7c80d.png)

## http 强制跳转 https
为保证数据安全，在实际生产环境中，通常会把所有不安全的 HTTP 请求，强制升级成安全的 HTTPS

创建证书资源

```bash
# ls
cuiliangblog.cn.crt.pem  cuiliangblog.cn.key.pem
# kubectl create secret tls cuiliangblog-tls \
  --cert=cuiliangblog.cn.crt.pem \
  --key=cuiliangblog.cn.key.pem \
  -n default 
secret/cuiliangblog-tls created
```

更新 ingress 资源

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: echo
  annotations:
    konghq.com/protocols: "https" # 添加https协议注解
    konghq.com/https-redirect-status-code: "301" # http强制 301 跳转到 https
spec:
  ingressClassName: kong # 指定ingressclass
  rules:
  - host: echo.cuiliangblog.cn
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: echo
            port:
              number: 1027
  tls: # 绑定tls证书secret资源
  - hosts:
    - echo.cuiliangblog.cn
    secretName: cuiliangblog-tls
```

访问验证，此时 http 请求会强制跳转到 https

![](assets/06-Kubernetes/d3c7baced54776e86be2.png)

## 代理后端跳过证书验证
在代理 Kubernetes dashboard、kibana 等服务时，后端服务指定为 https 请求，此时可以让 Kong 访问后端 Service（Upstream）时，用 HTTPS 且跳过证书校验

```yaml
apiVersion: v1
kind: Service
metadata:
  name: your-svc
  annotations:
    konghq.com/protocol: "https"          # 后端使用 HTTPS
    konghq.com/tls-verify: "false"        # 跳过证书验证
spec:
  ports:
  - port: 443
    targetPort: 8443
```

修改已有 svc

```yaml
kubectl patch svc your-svc \
  -p '{"metadata":{"annotations":{"konghq.com/protocol":"https","konghq.com/tls-verify":"false"}}}'
```

## 速率限制
速率限制用于控制发送到上游服务的请求频率，是保障系统稳定性的重要手段。通过限制单位时间内的请求数量，可以有效防止拒绝服务攻击（DoS）、抑制恶意爬虫以及避免资源被过度消耗。若未启用速率限制，客户端可以无限制访问上游服务，容易导致系统负载过高，甚至影响整体可用性。

在 Kong Gateway 中，可以通过速率限制插件对客户端实施访问控制。启用后，系统会在设定的时间窗口内限制客户端的请求次数。该插件支持多种识别方式，例如基于已认证的消费者身份，或根据客户端的 IP 地址进行限流，从而实现灵活、精细化的流量管理。

创建限制速率的 kong 插件

```yaml
apiVersion: configuration.konghq.com/v1
kind: KongPlugin
metadata:
  name: rate-limit-5-min         # 插件名称，可以自定义
  namespace: default             # 所在命名空间，通常与ingress相同
  annotations:
    kubernetes.io/ingress.class: kong # 指定ingressclass
plugin: rate-limiting            # 指定使用的插件类型，这里是速率限制插件
config:
  minute: 5                      # 每分钟允许的请求次数，超过则被限制
  policy: local                   # 限流策略
                                  # local：在单个 Kong 实例本地计数
                                  # cluster：在整个集群中共享计数（跨节点）
```

ingress 使用 kong 插件

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: echo
  namespace: default
  annotations:
    konghq.com/plugins: rate-limit-5-min # 使用插件
spec:
  ingressClassName: kong # 指定ingressclass
  rules:
  - host: echo.cuiliangblog.cn
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: echo
            port:
              number: 1027
```

访问验证

```yaml
# for _ in {1..6}; do  
  curl -I echo.cuiliangblog.cn
done
# 前五个请求返回正常，第六个请求响应如下
HTTP/1.1 429 Too Many Requests
Date: Sun, 29 Mar 2026 03:17:09 GMT
Content-Type: application/json; charset=utf-8
Connection: keep-alive
X-RateLimit-Remaining-Minute: 0
X-RateLimit-Limit-Minute: 5
RateLimit-Remaining: 0
RateLimit-Reset: 51
Retry-After: 51
RateLimit-Limit: 5
Content-Length: 92
X-Kong-Response-Latency: 0
Server: kong/3.9.1
X-Kong-Request-Id: b4f9026aa1968a13b88be43466342e5f
```

## 代理缓存
Kong Gateway 提供提高性能的一种方式是缓存。代理缓存插件可以根据可配置的响应状态码、内容类型和请求方法缓存响应，从而加速请求处理。当启用缓存后，上游服务无需处理重复请求，Kong Gateway 会直接返回缓存的结果，从而减轻上游负载。缓存可以 针对特定路由启用，也可以 全局生效，应用于所有请求。

启用代理缓存插件后，Kong 会在响应中返回一个头部，用于标识缓存状态：

```plain
proxy-cacheX-Cache-Status
```

头部可能的取值及含义如下：

| 值 | 含义 |
| --- | --- |
| Miss | 请求本可以从缓存满足，但缓存中未找到对应条目，请求被转发到上游服务。 |
| Hit | 请求已命中缓存，响应直接从缓存返回。 |
| Refresh | 缓存中找到了资源条目，但由于行为限制或 TTL（`config.cache_ttl`<br/>）到期，缓存无法直接满足请求，请求被刷新。 |
| Bypass | 根据插件配置，缓存无法使用，请求直接转发到上游。 |


创建全局缓存插件，可以使整个集群跨 namespace 共享插件配置。也可以创建 KongPlugin，针对单个 Ingress 配置策略。以创建全局缓存策略为例：

```yaml
apiVersion: configuration.konghq.com/v1
kind: KongClusterPlugin
metadata:
  name: proxy-cache-all
  annotations:
    kubernetes.io/ingress.class: kong
  # labels:
  #   global: 'true'                      # 全局生效：所有使用 kong的路由都会应用
plugin: proxy-cache
config:
  response_code:
  - 200
  request_method:
  - GET
  - HEAD
  content_type:
  - text/plain; charset=utf-8
  cache_ttl: 300
  strategy: memory
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: echo
  namespace: default
  annotations:
    konghq.com/plugins: proxy-cache-all # 使用插件
spec:
  ingressClassName: kong # 指定ingressclass
  rules:
  - host: echo.cuiliangblog.cn
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: echo
            port:
              number: 1027
```

访问验证

```yaml
# curl -v echo.cuiliangblog.cn/echo 2>&1 | grep -E "(Status|< HTTP)"
< HTTP/1.1 200 OK
< X-Cache-Status: Miss
# curl -v echo.cuiliangblog.cn/echo 2>&1 | grep -E "(Status|< HTTP)"
< HTTP/1.1 200 OK
< X-Cache-Status: Hit
# curl -v echo.cuiliangblog.cn/echo 2>&1 | grep -E "(Status|< HTTP)"
< HTTP/1.1 200 OK
< X-Cache-Status: Hit
```

可以看到第一次未命中缓存，后面都使用缓存。

## 基本认证
Kong 的 auth 认证逻辑是：

1. 请求到达 Ingress，Kong 发现该路由挂了 `basic-auth` 插件
2. Kong 去所有 `KongConsumer` 的 credentials 里查找匹配的用户名密码
3. 匹配成功则放行，否则返回 401

定义认证凭据

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: echo-credentials
  labels:
    konghq.com/credential: basic-auth
type: Opaque
stringData:
  username: admin
  password: "CHANGE_ME"    # 替换为实际密码
---
apiVersion: configuration.konghq.com/v1
kind: KongConsumer
metadata:
  name: echo-user
  annotations:
    kubernetes.io/ingress.class: kong
username: echo-admin
credentials:
  - echo-credentials
```

定义插件并使用

```yaml
apiVersion: configuration.konghq.com/v1
kind: KongPlugin
metadata:
  name: echo-basic-auth
plugin: basic-auth
config:
  hide_credentials: true    # 不把认证头转发给后端服务
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: echo
  annotations:
    konghq.com/protocols: "https" # 添加https协议注解
    konghq.com/https-redirect-status-code: "301" # http强制 301 跳转到 https
    konghq.com/plugins: echo-basic-auth # 使用认证插件
spec:
  ingressClassName: kong # 指定ingressclass
  rules:
    - host: echo.cuiliangblog.cn
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: echo
                port:
                  number: 1027
  tls: # 绑定tls证书secret资源
  - hosts:
    - echo.cuiliangblog.cn
    secretName: cuiliangblog-tls
```

此时访问 echo 就需要输入密码验证

![](assets/06-Kubernetes/d264c660dc8e0049194c.png)

## 密钥认证
Kong Gateway 也提供密钥认证（Key Authentication）是一种 API 访问控制机制，它通过验证客户端提供的 API Key 或者密钥令牌来决定是否允许请求访问上游服务。  

Kong 的 API Key 认证逻辑是：

1. 请求到达 Ingress，Kong 发现该路由挂了 `key-auth` 插件
2. Kong 从请求 Header / Query String 中提取 `apikey` 字段，去所有 `KongConsumer` 的 credentials 里查找匹配的 key
3. 匹配成功则放行，否则返回 401

 创建 Consumer 和 API Key  

```yaml
apiVersion: v1
kind: Secret
metadata:
   name: echo-key-auth
   namespace: kong
   labels:
      konghq.com/credential: key-auth
stringData:
   key: hello_world
---
apiVersion: configuration.konghq.com/v1
kind: KongConsumer
metadata:
  name: echo
  namespace: kong
  annotations:
    kubernetes.io/ingress.class: kong
username: echo
credentials:
- echo-key-auth
```

 创建 key-auth 插件  

```yaml
apiVersion: configuration.konghq.com/v1
kind: KongPlugin
metadata:
  name: key-auth
  namespace: kong
  annotations:
    kubernetes.io/ingress.class: kong
plugin: key-auth
```

使用插件

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: echo
  annotations:
    konghq.com/protocols: "https" # 添加https协议注解
    konghq.com/https-redirect-status-code: "301" # http强制 301 跳转到 https
    konghq.com/plugins: key-auth # 使用认证插件
spec:
  ingressClassName: kong # 指定ingressclass
  rules:
    - host: echo.cuiliangblog.cn
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: echo
                port:
                  number: 1027
  tls: # 绑定tls证书secret资源
  - hosts:
    - echo.cuiliangblog.cn
    secretName: cuiliangblog-tls
```

访问验证

```yaml
# curl -k -I https://echo.cuiliangblog.cn/echo 
HTTP/2 401 
date: Sun, 05 Apr 2026 14:20:11 GMT
content-type: application/json; charset=utf-8
www-authenticate: Key
content-length: 96
x-kong-response-latency: 0
server: kong/3.9.1
x-kong-request-id: eb5f5272eec9d731a061801c4363f104

# curl -k -I -H "apikey:hello_world" https://echo.cuiliangblog.cn/echo 
HTTP/2 200 
content-type: text/plain; charset=utf-8
content-length: 133
date: Sun, 05 Apr 2026 14:20:15 GMT
server: kong/3.9.1
x-kong-upstream-latency: 0
x-kong-proxy-latency: 1
via: 1.1 kong/3.9.1
x-kong-request-id: 89a6a07d00efb329cad2c139f289831f

# curl -k -I https://echo.cuiliangblog.cn/echo\?apikey\=hello_world
HTTP/2 200 
content-type: text/plain; charset=utf-8
content-length: 134
date: Sun, 05 Apr 2026 15:36:12 GMT
server: kong/3.9.1
x-kong-upstream-latency: 0
x-kong-proxy-latency: 1
via: 1.1 kong/3.9.1
x-kong-request-id: 3279510459d8a5673efb0d3c3773136d
```

# 可观测性
## 启用 prometheus 监控
开启 Kong 的 Prometheus 插件。Kong 的监控是通过插件实现的，直接创建一个 **KongClusterPlugin**：

```yaml
apiVersion: configuration.konghq.com/v1
kind: KongClusterPlugin
metadata:
  name: prometheus
  annotations:
    kubernetes.io/ingress.class: kong
  labels:
    global: 'true'
config:
  status_code_metrics: true
  bandwidth_metrics: true
  upstream_health_metrics: true
  latency_metrics: true
  per_consumer: false
plugin: prometheus
```

暴露 metrics Service，默认情况下 kong 并未创建 metrics 的 svc 资源，需要我们手动创建

```yaml
apiVersion: v1
kind: Service
metadata:
  name: kong-gateway-metrics
  namespace: kong
  labels:
    app.kubernetes.io/name: gateway
spec:
  selector:
    app: kong-gateway
  ports:
    - name: metrics
      port: 8100
      targetPort: 8100
```

创建采集项

```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: kong
  namespace: monitoring
spec:
  selector:
    matchLabels:
      app.kubernetes.io/name: gateway
  namespaceSelector:
    matchNames:
      - kong
  endpoints:
    - port: metrics
      path: /metrics
      interval: 30s
```

访问验证

![](assets/06-Kubernetes/8bfb340d213401ef1f04.png)

grafana 添加可视化。直接用官方 dashboard：

+  Dashboard ID：7424（Kong） 
+  或 15662（KIC）

![](assets/06-Kubernetes/24157a4656f74f7a1b78.png)

指标详情可参考官方文档：[https://developer.konghq.com/kubernetes-ingress-controller/observability/prometheus-grafana/](https://developer.konghq.com/kubernetes-ingress-controller/observability/prometheus-grafana/)

## 采集 access 日志
kong 默认未启用 access 日志导出功能，我们可以修改 values.yaml 文件，指定将 access 日志打印到终端，也可以通过 Kong 的 Logging 类插件将 Kong Ingress Controller的访问日志（Access Logs）采集到 Elasticsearch 或 loki 等工具中。

启用 access 日志打印

```yaml
# vim values.yaml
gateway:
  env:
    proxy_access_log: /dev/stdout
    proxy_error_log: /dev/stderr
# 更新helm
helm upgrade kong -n kong . -f values.yaml
```

查看kong-gateway 日志验证

```yaml
# kubectl logs -n kong kong-gateway-66df4bd95d-zswvr
{"tries":[{"port":1027,"balancer_start":1775462399040,"balancer_start_ns":1.7754623990405e+18,"balancer_latency_ns":13568,"ip":"10.244.13.118","balancer_latency":0}],"route":{"created_at":1775461581,"path_handling":"v0","tags":["k8s-name:echo","k8s-namespace:default","k8s-kind:Ingress","k8s-uid:241d6449-31a3-4b7d-9382-a06a90c229de","k8s-group:networking.k8s.io","k8s-version:v1"],"hosts":["echo.cuiliangblog.cn"],"ws_id":"0dc6f45b-8f8d-40d2-a504-473544ee190b","preserve_host":true,"strip_path":false,"paths":["/"],"protocols":["https"],"name":"default.echo.echo.echo.cuiliangblog.cn.1027","updated_at":1775461581,"regex_priority":0,"id":"f7791fe8-8a31-557d-ac59-eaa96127eab0","https_redirect_status_code":301,"request_buffering":true,"response_buffering":true,"service":{"id":"4a3125fc-7d51-5575-b0f3-978d9a44a49b"}},"latencies":{"proxy":1,"kong":0,"receive":0,"request":1},"client_ip":"192.168.10.1","started_at":1775462399040,"workspace_name":"default","request":{"headers":{"host":"echo.cuiliangblog.cn","sec-fetch-site":"none","user-agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36","sec-fetch-user":"?1","priority":"u=0, i","sec-fetch-dest":"document","accept-encoding":"gzip, deflate, br, zstd","sec-ch-ua":"\"Chromium\";v=\"146\", \"Not-A.Brand\";v=\"24\", \"Google Chrome\";v=\"146\"","accept-language":"zh-CN,zh;q=0.9,en;q=0.8","sec-ch-ua-mobile":"?0","sec-fetch-mode":"navigate","sec-ch-ua-platform":"\"Windows\"","accept":"text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7","upgrade-insecure-requests":"1","cache-control":"max-age=0"},"id":"4eb85d5862f40b087e603e77a58fa929","tls":{"client_verify":"NONE","cipher":"TLS_AES_128_GCM_SHA256","version":"TLSv1.3"},"uri":"/","size":470,"querystring":{},"method":"GET","url":"https://echo.cuiliangblog.cn:443/"},"workspace":"0dc6f45b-8f8d-40d2-a504-473544ee190b","source":"upstream","upstream_uri":"/","service":{"port":1027,"created_at":1775461581,"updated_at":1775461581,"tags":["k8s-name:echo","k8s-namespace:default","k8s-kind:Service","k8s-uid:494c5195-7176-41c4-8b15-72ad8a776a39","k8s-version:v1"],"enabled":true,"connect_timeout":60000,"ws_id":"0dc6f45b-8f8d-40d2-a504-473544ee190b","host":"echo.default.1027.svc","protocol":"http","name":"default.echo.1027","retries":5,"id":"4a3125fc-7d51-5575-b0f3-978d9a44a49b","read_timeout":60000,"path":"/","write_timeout":60000},"upstream_status":"200","response":{"headers":{"via":"1.1 kong/3.9.1","x-kong-proxy-latency":"0","content-type":"text/plain; charset=utf-8","connection":"close","x-kong-upstream-latency":"1","x-kong-request-id":"4eb85d5862f40b087e603e77a58fa929","content-length":"134","server":"kong/3.9.1","date":"Mon, 06 Apr 2026 07:59:59 GMT"},"status":200,"size":319}}
192.168.10.1 - - [06/Apr/2026:07:59:59 +0000] "GET / HTTP/2.0" 200 134 "-" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36" kong_request_id: "4eb85d5862f40b087e603e77a58fa929"
{"tries":[{"port":1027,"balancer_start":1775462399100,"balancer_start_ns":1.7754623991002e+18,"balancer_latency_ns":19968,"ip":"10.244.13.118","balancer_latency":0}],"route":{"created_at":1775461581,"path_handling":"v0","tags":["k8s-name:echo","k8s-namespace:default","k8s-kind:Ingress","k8s-uid:241d6449-31a3-4b7d-9382-a06a90c229de","k8s-group:networking.k8s.io","k8s-version:v1"],"hosts":["echo.cuiliangblog.cn"],"ws_id":"0dc6f45b-8f8d-40d2-a504-473544ee190b","preserve_host":true,"strip_path":false,"paths":["/"],"protocols":["https"],"name":"default.echo.echo.echo.cuiliangblog.cn.1027","updated_at":1775461581,"regex_priority":0,"id":"f7791fe8-8a31-557d-ac59-eaa96127eab0","https_redirect_status_code":301,"request_buffering":true,"response_buffering":true,"service":{"id":"4a3125fc-7d51-5575-b0f3-978d9a44a49b"}},"latencies":{"proxy":0,"kong":1,"receive":1,"request":2},"client_ip":"192.168.10.1","started_at":1775462399099,"workspace_name":"default","request":{"headers":{"host":"echo.cuiliangblog.cn","sec-fetch-site":"same-origin","user-agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36","sec-fetch-dest":"image","priority":"u=1, i","sec-ch-ua":"\"Chromium\";v=\"146\", \"Not-A.Brand\";v=\"24\", \"Google Chrome\";v=\"146\"","accept-language":"zh-CN,zh;q=0.9,en;q=0.8","sec-ch-ua-mobile":"?0","accept-encoding":"gzip, deflate, br, zstd","sec-ch-ua-platform":"\"Windows\"","referer":"https://echo.cuiliangblog.cn/","sec-fetch-mode":"no-cors","accept":"image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8"},"id":"3c66db51da2fd60b1e7f570fda10e721","tls":{"client_verify":"NONE","cipher":"TLS_AES_128_GCM_SHA256","version":"TLSv1.3"},"uri":"/favicon.ico","size":128,"querystring":{},"method":"GET","url":"https://echo.cuiliangblog.cn:443/favicon.ico"},"workspace":"0dc6f45b-8f8d-40d2-a504-473544ee190b","source":"upstream","upstream_uri":"/favicon.ico","service":{"port":1027,"created_at":1775461581,"updated_at":1775461581,"tags":["k8s-name:echo","k8s-namespace:default","k8s-kind:Service","k8s-uid:494c5195-7176-41c4-8b15-72ad8a776a39","k8s-version:v1"],"enabled":true,"connect_timeout":60000,"ws_id":"0dc6f45b-8f8d-40d2-a504-473544ee190b","host":"echo.default.1027.svc","protocol":"http","name":"default.echo.1027","retries":5,"id":"4a3125fc-7d51-5575-b0f3-978d9a44a49b","read_timeout":60000,"path":"/","write_timeout":60000},"upstream_status":"200","response":{"headers":{"via":"1.1 kong/3.9.1","x-kong-proxy-latency":"1","content-type":"text/plain; charset=utf-8","connection":"close","x-kong-upstream-latency":"0","x-kong-request-id":"3c66db51da2fd60b1e7f570fda10e721","content-length":"134","server":"kong/3.9.1","date":"Mon, 06 Apr 2026 07:59:59 GMT"},"status":200,"size":318}}
192.168.10.1 - - [06/Apr/2026:07:59:59 +0000] "GET /favicon.ico HTTP/2.0" 200 134 "https://echo.cuiliangblog.cn/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36" kong_request_id: "3c66db51da2fd60b1e7f570fda10e721"
```

kibana 查看访问日志

![](assets/06-Kubernetes/7d24cfafdee9a6fdd6bf.png)

## 启用opentelemetry
在 Kong3.0 后支持通过 **opentelemetry 插件**来导出 traces，可以在全局或针对特定路由/服务启用。  

创建 `KongClusterPlugin` 资源，对所有流量生效。

```yaml
apiVersion: configuration.konghq.com/v1
kind: KongClusterPlugin
metadata:
  name: opentelemetry-global
  annotations:
    kubernetes.io/ingress.class: kong
  labels:
    global: "true"          # 关键：全局生效
plugin: opentelemetry
config:
  endpoint: "http://otel-collector.observability.svc.cluster.local:4318/v1/traces"
  resource_attributes:
    service.name: "kong-gateway"
  propagation:
    default_format: w3c     # 或 b3, b3_single, jaeger
  sampling_rate: 1.0        # 1.0 = 100% 采样
```

验证是否收到 trace 信息。


