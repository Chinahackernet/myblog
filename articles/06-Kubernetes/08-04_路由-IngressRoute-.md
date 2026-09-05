# 路由(IngressRoute)

> 分类：Kubernetes / 第8章：Traefik
> 原文：https://www.cuiliangblog.cn/detail/section/52787216
> 来源：崔亮的博客

---

## 环境准备
### 部署myapp1实例
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp1
spec:
  selector:
    matchLabels:
      app: myapp1
  template:
    metadata:
      labels:
        app: myapp1
    spec:
      containers:
      - name: myapp1
        image: ikubernetes/myapp:v1
        resources:
          limits:
            memory: "128Mi"
            cpu: "500m"
        ports:
        - containerPort: 80
---
apiVersion: v1
kind: Service
metadata:
  name: myapp1
spec:
  type: ClusterIP
  selector:
    app: myapp1
  ports:
  - port: 80
    targetPort: 80
```

### 部署myapp2实例
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp2
spec:
  selector:
    matchLabels:
      app: myapp2
  template:
    metadata:
      labels:
        app: myapp2
    spec:
      containers:
      - name: myapp2
        image: ikubernetes/myapp:v2
        resources:
          limits:
            memory: "128Mi"
            cpu: "500m"
        ports:
        - containerPort: 80
---
apiVersion: v1
kind: Service
metadata:
  name: myapp2
spec:
  type: ClusterIP
  selector:
    app: myapp2
  ports:
  - port: 80
    targetPort: 80

```

### 创建资源并访问测试
```bash
[root@k8s-master ingress]# kubectl get pod 
NAME                                          READY   STATUS    RESTARTS   AGE
myapp1-795d947b45-9lsm6                       1/1     Running   0          2m18s
myapp2-6ffd54f76-ljkr9                        1/1     Running   0          66s
[root@k8s-master ingress]# kubectl get svc 
NAME         TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)                                                                                  44h
myapp1       ClusterIP   10.104.91.200   <none>        80/TCP                                                                                   2m26s
myapp2       ClusterIP   10.111.245.32   <none>        80/TCP                                                                                   100s
[root@k8s-master ingress]# curl 10.104.91.200
Hello MyApp | Version: v1 | <a href="hostname.html">Pod Name</a>
[root@k8s-master ingress]# curl 10.111.245.32
Hello MyApp | Version: v2 | <a href="hostname.html">Pod Name</a>
```

## 路由简介
### 路由功能
<font style="color:rgb(48, 49, 51);">参考文档：</font>[https://doc.traefik.io/traefik/routing/overview/](https://doc.traefik.io/traefik/routing/overview/)

![](assets/06-Kubernetes/63b89cca6dde9ca03499.png)

<font style="color:rgb(48, 49, 51);">当启动Traefik时，需要定义</font><font style="color:rgb(48, 49, 51);">entrypoints</font><font style="color:rgb(48, 49, 51);">，然后通过entrypoints的路由来分析传入的请求，来查看他们是否是一组规则匹配，如果匹配，则路由可能将请求通过一系列的转换过来在发送到服务上去。</font>

### traefik支持的匹配规则
| 规则 | 描述 |
| --- | --- |
| Headers(`key`, `value`) | 检查headers中是否有一个键为key值为value的键值对 |
| HeadersRegexp(`key`, `regexp`) | 检查headers中是否有一个键位key值为正则表达式匹配的键值对 |
| Host(`example.com`, ...) | 检查请求的域名是否包含在特定的域名中 |
| HostRegexp(`example.com`, `{subdomain:[a-z]+}.example.com`, ...) | 检查请求的域名是否包含在特定的正则表达式域名中 |
| Method(`GET`, ...) | 检查请求方法是否为给定的methods(GET、POST、PUT、DELETE、PATCH)中 |
| Path(`/path`, `/articles/{cat:[a-z]+}/{id:[0-9]+}`, ...) | 匹配特定的请求路径，它接受一系列文字和正则表达式路径 |
| PathPrefix(`/products/`, `/articles/{cat:[a-z]+}/{id:[0-9]+}`) | 匹配特定的前缀路径，它接受一系列文字和正则表达式前缀路径 |
| Query(`foo=bar`, `bar=baz`) | 匹配查询字符串参数，接受key=value的键值对 |
| ClientIP(`10.0.0.0/16`, `::1`) | 如果请求客户端 IP 是给定的 IP/CIDR 之一，则匹配。它接受 IPv4、IPv6 和网段格式。 |


## 路由配置（IngressRoute）
### HTTP域名路由
实现目标：集群外部用户通过访问http://myapp1.test.com域名时，将请求代理至myapp1应用。

创建ingressrouter规则文件

```yaml
apiVersion: traefik.io/v1alpha1
kind: IngressRoute
metadata:
  name: myapp1
spec:
  entryPoints:
  - web
  routes:
  - match: Host(`myapp1.test.com`) # 域名
    kind: Rule
    services:
      - name: myapp1  # 与svc的name一致
        port: 80      # 与svc的port一致
```

创建资源

```bash
[root@k8s-master ingress]# kubectl apply -f myapp1-ingress.yaml 
ingressroute.traefik.containo.us/myapp1 created
[root@k8s-master ingress]# kubectl get ingressroute
NAME        AGE
dashboard   4h26m
myapp1      20s
```

客户端添加hosts记录`192.168.93.128 myapp1.test.com`，然后访问验证

![](assets/06-Kubernetes/e51bb59de1963c702018.png)

### HTTPS域名路由(自有证书)
公网服务的话，可以在云厂商那里购买证书。内部服务的话，就直接用 openssl 来创建一个自签名的证书即可，要注意证书文件名称必须是 tls.crt 和 tls.key。接下来演示自签证书的配置。

创建自签证书

```bash
[root@k8s-master ingress]# openssl req -x509 -nodes -days 3650 -newkey rsa:2048 -keyout tls.key -out tls.crt -subj "/CN=myapp2.test.com"
```

创建Secret资源来引用证书文件

```bash
[root@k8s-master ingress]# kubectl create secret tls myapp2-tls --cert=tls.crt --key=tls.key
secret/myapp2-tls created
[root@k8s-master ingress]# kubectl describe secrets myapp2-tls 
Name:         myapp2-tls
Namespace:    default
Labels:       <none>
Annotations:  <none>

Type:  kubernetes.io/tls

Data
====
tls.crt:  1131 bytes
tls.key:  1704 bytes
```

创建IngressRouter规则文件，集群外部用户通过访问https://myapp2.test.com域名时，将请求代理至myapp2应用。

```yaml
[root@k8s-master ingress]# cat myapp2-ingress.yaml 
[root@k8s-master ingress]# cat myapp2-ingress.yaml 
apiVersion: traefik.io/v1alpha1
kind: IngressRoute
metadata:
  name: myapp2
spec:
  entryPoints:
    - websecure                    # 监听 websecure 这个入口点，也就是通过 443 端口来访问
  routes:
  - match: Host(`myapp2.test.com`)
    kind: Rule
    services:
    - name: myapp2
      port: 80
  tls:
    secretName: myapp2-tls         # 指定tls证书名称
```

创建资源

```bash
[root@k8s-master ingress]# kubectl apply -f myapp2-ingress.yaml 
ingressroute.traefik.containo.us/myapp2 created
[root@k8s-master ingress]# kubectl get ingressroute 
dashboard  myapp2     
[root@k8s-master ingress]# kubectl get ingressroute
NAME        AGE
dashboard   5h11m
myapp1      45m
myapp2      2m55s
```

客户端添加hosts记录`192.168.93.128 myapp2.test.com`，然后访问验证，<font style="color:rgb(53, 53, 53);">由于我们是自签名的证书，所以证书是不受信任的。</font>

![](assets/06-Kubernetes/24f0ebc79ed0f543e0b7.png)

### HTTPS域名路由(自动生成证书)
> 参考文档：[https://doc.traefik.io/traefik-enterprise/tls/acme/](https://doc.traefik.io/traefik-enterprise/tls/acme/)
>

Traefik除了使用自有证书外，还支持在创建ingress资源时自动请求Let's Encrypt生成证书，并且在证书过期前30天自动续订证书。

要使用Let's Encrypt自动生成证书，需要使用ACME。需要在静态配置中定义 "证书解析器"，Traefik负责从ACME服务器中检索证书。然后，每个 "路由器 "被配置为启用TLS，并通过tls.certresolver配置选项与一个证书解析器关联。

如果使用tlsChallenge，则要求Let's Encrypt到 Traefik 443 端口必须是可达的。如果使用httpChallenge，则要求Let's Encrypt到 Traefik 80端口必须是可达的。如果使用dnsChallenge<font style="color:rgb(53, 53, 53);">，只需要配置上 DNS 解析服务商的 API 访问密钥即可校验。</font>

**tlsChallenge/httpChallenge**

使用tlsChallenge或者httpChallenge的前提条件是traefik所在节点可以正常访问Let's Encrypt网站，国内网络可能访问存在异常，并且配置的ingress域名已经设置了dns的A记录解析，指向traefik所在的节点公网IP地址才可以，否则申请成功证书后无法通过验证。

修改traefik配置文件，新增certificatesResolvers配置

```yaml
# traefik-config.yaml
kind: ConfigMap
apiVersion: v1
metadata:
  name: traefik-config
data:
  traefik.yaml: |-
    global:
      checkNewVersion: false    ## 周期性的检查是否有新版本发布
      sendAnonymousUsage: false ## 周期性的匿名发送使用统计信息
    serversTransport:
      insecureSkipVerify: true  ## Traefik忽略验证代理服务的TLS证书
    api:
      insecure: true            ## 允许HTTP 方式访问API
      dashboard: true           ## 启用Dashboard
      debug: false              ## 启用Debug调试模式
    metrics:
      prometheus:               ## 配置Prometheus监控指标数据，并使用默认配置
        addRoutersLabels: true  ## 添加routers metrics
        entryPoint: "metrics"     ## 指定metrics监听地址
    entryPoints:
      web:
        address: ":80"          ## 配置80端口，并设置入口名称为web
        forwardedHeaders: 
          insecure: true        ## 信任所有的forward headers
      websecure:
        address: ":443"         ## 配置443端口，并设置入口名称为 websecure
        forwardedHeaders: 
          insecure: true
      traefik:
        address: ":9000"        ## 配置9000端口，并设置入口名称为 dashboard
      metrics:
        address: ":9100"        ## 配置9100端口，作为metrics收集入口
      tcpep:
        address: ":9200"        ## 配置9200端口，作为tcp入口
      udpep:
        address: ":9300/udp"    ## 配置9300端口，作为udp入口
    certificatesResolvers:      ## 开启ACME自动续签证书
      sample:
        acme:
          email: 1554382111@qq.com  # 邮箱配置
          storage: /etc/traefik/acme/acme.json    # 保存 ACME 证书的位置
          # tlsChallenge: {}            # tlsChallenge模式续签
          httpChallenge:
            entryPoint: web             # httpChallenge模式续签
    providers:
      kubernetesCRD:            ## 启用Kubernetes CRD方式来配置路由规则
        ingressClass: ""
        allowCrossNamespace: true   ##允许跨namespace
        allowEmptyServices: true    ##允许空endpoints的service
      kubernetesIngress:        ## 启动Kubernetes Ingress方式来配置路由规则
        ingressClass: ""
    log:
      filePath: "/etc/traefik/logs/traefik.log" ## 设置调试日志文件存储路径，如果为空则输出到控制台
      level: "DEBUG"             ## 设置调试日志级别
      format: "common"          ## 设置调试日志格式
    accessLog:
      filePath: "/etc/traefik/logs/access.log" ## 设置访问日志文件存储路径，如果为空则输出到控制台
      format: "common"          ## 设置访问调试日志格式
      bufferingSize: 0          ## 设置访问日志缓存行数
      filters:
        #statusCodes: ["200"]   ## 设置只保留指定状态码范围内的访问日志
        retryAttempts: true     ## 设置代理访问重试失败时，保留访问日志
        minDuration: 20         ## 设置保留请求时间超过指定持续时间的访问日志
      fields:                   ## 设置访问日志中的字段是否保留（keep保留、drop不保留）
        defaultMode: keep       ## 设置默认保留访问日志字段
        names:                  ## 针对访问日志特别字段特别配置保留模式
          ClientUsername: drop
          StartUTC: drop        ## 禁用日志timestamp使用UTC
        headers:                ## 设置Header中字段是否保留
          defaultMode: keep     ## 设置默认保留Header中字段
          names:                ## 针对Header中特别字段特别配置保留模式
            #User-Agent: redact  ## 可以针对指定agent
            Authorization: drop
            Content-Type: keep
```

修改traefik的deployment资源文件，挂载acme目录存储ACME证书信息

```yaml
# traefik-deployment.yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  namespace: default
  name: traefik-ingress-controller
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: traefik-ingress-controller
  namespace: default
  labels:
    app: traefik
spec:
  replicas: 1   #副本数为1，因为集群只设置一台master为边缘节点
  selector:
    matchLabels:
      app: traefik
  template:
    metadata:
      name: traefik
      labels:
        app: traefik
    spec:
      serviceAccountName: traefik-ingress-controller
      terminationGracePeriodSeconds: 1
      containers:
      - name: traefik
        image: traefik:v2.8.7
        env:
        - name: KUBERNETES_SERVICE_HOST       ##手动指定k8s api,避免网络组件不稳定。
          value: "192.168.10.10"
        - name: KUBERNETES_SERVICE_PORT_HTTPS ## API server端口
          value: "6443"
        - name: KUBERNETES_SERVICE_PORT       ## API server端口
          value: "6443"
        - name: TZ                            ##指定时区
          value: "Asia/Shanghai"
        ports:
          - name: web
            containerPort: 80
            hostPort: 80                      ## 将容器端口绑定所在服务器的 80 端口
          - name: websecure
            containerPort: 443
            hostPort: 443                     ## 将容器端口绑定所在服务器的 443 端口
          - name: admin
            containerPort: 9000               ## Traefik Dashboard 端口
          - name: metrics
            containerPort: 9100               ## metrics端口
          - name: tcpep
            containerPort: 9200               ## tcp端口
          - name: udpep
            containerPort: 9300               ## udp端口
        securityContext:                      ## 只开放网络权限  
          capabilities:
            drop:
              - ALL
            add:
              - NET_BIND_SERVICE
        args:
          - --configfile=/etc/traefik/config/traefik.yaml
        volumeMounts:
        - mountPath: /etc/traefik/config
          name: config
        - mountPath: /etc/traefik/logs
          name: logdir
        - mountPath: /etc/localtime
          name: timezone
          readOnly: true
        - mountPath: /etc/traefik/acme
          name: acme
      volumes:
        - name: config
          configMap:
            name: traefik-config 
        - name: logdir
          hostPath:
            path: /data/traefik/logs
            type: "DirectoryOrCreate"
        - name: timezone                       #挂载时区文件
          hostPath:
            path: /etc/localtime
            type: File
        - name: acme                           # 自动续签证书文件
          hostPath:
            path: /data/traefik/acme
            type: "DirectoryOrCreate"
      tolerations:                             ## 设置容忍所有污点，防止节点被设置污点
        - operator: "Exists"
      hostNetwork: true                        ## 开启host网络，提高网络入口的网络性能
      nodeSelector:                            ## 设置node筛选器，在特定label的节点上启动
        IngressProxy: "true"                   ## 调度至IngressProxy: "true"的节点
```

配置IngressRouter规则

```yaml
apiVersion: traefik.io/v1alpha1
kind: IngressRoute
metadata:
  name: myapp2
spec:
  entryPoints:
    - websecure                    # 监听 websecure 这个入口点，也就是通过 443 端口来访问
  routes:
  - match: Host(`myapp2.cuiliangblog.cn`) # 必须是真实存在的域名，且配置了dns解析记录，指向traefik节点所在的公网IP
    kind: Rule
    services:
    - name: myapp2
      port: 80
  tls:
    certResolver: sample         # 使用自动生成证书，名字与traefik的certificatesResolvers名称一致
```

**dnsChallenge**

dns 校验方式可以生成通配符的证书，只需要配置上 DNS 解析服务商的 API 访问密钥即可校验。每个厂商的配置都略有差异，此处以阿里云为例，其他厂商的配置请查看文档[https://go-acme.github.io/lego/dns/](https://go-acme.github.io/lego/dns/)

修改traefik配置文件，新增dnsChallenge配置

```yaml
kind: ConfigMap
apiVersion: v1
metadata:
  name: traefik-config
data:
  traefik.yaml: |-
    global:
      checkNewVersion: false    ## 周期性的检查是否有新版本发布
      sendAnonymousUsage: false ## 周期性的匿名发送使用统计信息
    serversTransport:
      insecureSkipVerify: true  ## Traefik忽略验证代理服务的TLS证书
    api:
      insecure: true            ## 允许HTTP 方式访问API
      dashboard: true           ## 启用Dashboard
      debug: false              ## 启用Debug调试模式
    metrics:
      prometheus:               ## 配置Prometheus监控指标数据，并使用默认配置
        addRoutersLabels: true  ## 添加routers metrics
        entryPoint: "metrics"     ## 指定metrics监听地址
    entryPoints:
      web:
        address: ":80"          ## 配置80端口，并设置入口名称为web
        forwardedHeaders: 
          insecure: true        ## 信任所有的forward headers
      websecure:
        address: ":443"         ## 配置443端口，并设置入口名称为 websecure
        forwardedHeaders: 
          insecure: true
      traefik:
        address: ":9000"        ## 配置9000端口，并设置入口名称为 dashboard
      metrics:
        address: ":9100"        ## 配置9100端口，作为metrics收集入口
      tcpep:
        address: ":9200"        ## 配置9200端口，作为tcp入口
      udpep:
        address: ":9300/udp"    ## 配置9300端口，作为udp入口
    certificatesResolvers:      ## 开启ACME自动续签证书
      sample:
        acme:
          email: 1554382111@qq.com  # 邮箱配置
          storage: /etc/traefik/acme/acme.json    # 保存 ACME 证书的位置
          # tlsChallenge: {}              # tls模式续签
          # httpChallenge:
          #   entryPoint: web             # http模式续签
          dnsChallenge:                   # dns模式续签证书
            provider: alidns              # 云厂商编号       
            delayBeforeCheck: 0           # ACME 验证之前，会验证 TXT 记录。设定延迟验证时间(以秒为单位)
    providers:
      kubernetesCRD:            ## 启用Kubernetes CRD方式来配置路由规则
        ingressClass: ""
        allowCrossNamespace: true   ##允许跨namespace
        allowEmptyServices: true    ##允许空endpoints的service
      kubernetesIngress:        ## 启动Kubernetes Ingress方式来配置路由规则
        ingressClass: ""
    log:
      filePath: "/etc/traefik/logs/traefik.log" ## 设置调试日志文件存储路径，如果为空则输出到控制台
      level: "DEBUG"             ## 设置调试日志级别
      format: "common"          ## 设置调试日志格式
    accessLog:
      filePath: "/etc/traefik/logs/access.log" ## 设置访问日志文件存储路径，如果为空则输出到控制台
      format: "common"          ## 设置访问调试日志格式
      bufferingSize: 0          ## 设置访问日志缓存行数
      filters:
        #statusCodes: ["200"]   ## 设置只保留指定状态码范围内的访问日志
        retryAttempts: true     ## 设置代理访问重试失败时，保留访问日志
        minDuration: 20         ## 设置保留请求时间超过指定持续时间的访问日志
      fields:                   ## 设置访问日志中的字段是否保留（keep保留、drop不保留）
        defaultMode: keep       ## 设置默认保留访问日志字段
        names:                  ## 针对访问日志特别字段特别配置保留模式
          ClientUsername: drop
          StartUTC: drop        ## 禁用日志timestamp使用UTC
        headers:                ## 设置Header中字段是否保留
          defaultMode: keep     ## 设置默认保留Header中字段
          names:                ## 针对Header中特别字段特别配置保留模式
            #User-Agent: redact  ## 可以针对指定agent
            Authorization: drop
            Content-Type: keep
```

登录阿里云后台获取ALICLOUD_ACCESS_KEY、ALICLOUD_SECRET_KEY、ALICLOUD_REGION_ID信息

创建Secret 对象存放密钥信息，记得填写base64编码后的值

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: alidns-secret
type: Opaque
data:
  ALICLOUD_ACCESS_KEY: XXX
  ALICLOUD_SECRET_KEY: XXX
	ALICLOUD_REGION_ID: XXX
```

修改traefik的deployment资源清单，添加密钥env变量

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  namespace: default
  name: traefik-ingress-controller
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: traefik-ingress-controller
  namespace: default
  labels:
    app: traefik
spec:
  replicas: 1   # 副本数为1，因为集群只设置一台master为边缘节点
  selector:
    matchLabels:
      app: traefik
  template:
    metadata:
      name: traefik
      labels:
        app: traefik
    spec:
      serviceAccountName: traefik-ingress-controller
      terminationGracePeriodSeconds: 1
      containers:
      - name: traefik
        image: traefik:v2.8.7
        env:
        - name: KUBERNETES_SERVICE_HOST       # 手动指定k8s api,避免网络组件不稳定。
          value: "192.168.10.10"
        - name: KUBERNETES_SERVICE_PORT_HTTPS # API server端口
          value: "6443"
        - name: KUBERNETES_SERVICE_PORT       # API server端口
          value: "6443"
        - name: TZ                            # 指定时区
          value: "Asia/Shanghai"
        - name: ALICLOUD_ACCESS_KEY           # 阿里云AK
          valueFrom:
            secretKeyRef:
              name: alidns-secret
              key: ALICLOUD_ACCESS_KEY
        - name: ALICLOUD_SECRET_KEY           # 阿里云SK
          valueFrom:
            secretKeyRef:
              name: alidns-secret
              key: ALICLOUD_SECRET_KEY
        - name: ALICLOUD_REGION_ID            # 阿里云资源区域编号
          valueFrom:
            secretKeyRef:
              name: alidns-secret
              key: ALICLOUD_REGION_ID
        ports:
          - name: web
            containerPort: 80
            hostPort: 80                      # 将容器端口绑定所在服务器的 80 端口
          - name: websecure
            containerPort: 443
            hostPort: 443                     # 将容器端口绑定所在服务器的 443 端口
          - name: admin
            containerPort: 9000               # Traefik Dashboard 端口
          - name: metrics
            containerPort: 9100               # metrics端口
          - name: tcpep
            containerPort: 9200               # tcp端口
          - name: udpep
            containerPort: 9300               # udp端口
        securityContext:                      # 只开放网络权限  
          capabilities:
            drop:
              - ALL
            add:
              - NET_BIND_SERVICE
        args:
          - --configfile=/etc/traefik/config/traefik.yaml
        volumeMounts:
        - mountPath: /etc/traefik/config
          name: config
        - mountPath: /etc/traefik/logs
          name: logdir
        - mountPath: /etc/localtime
          name: timezone
          readOnly: true
        - mountPath: /etc/traefik/acme
          name: acme
      volumes:
        - name: config
          configMap:
            name: traefik-config 
        - name: logdir
          hostPath:
            path: /data/traefik/logs
            type: "DirectoryOrCreate"
        - name: timezone                       #挂载时区文件
          hostPath:
            path: /etc/localtime
            type: File
        - name: acme                           # 自动续签证书文件
          hostPath:
            path: /data/traefik/acme
            type: "DirectoryOrCreate"
      tolerations:                             # 设置容忍所有污点，防止节点被设置污点
        - operator: "Exists"
      hostNetwork: true                        # 开启host网络，提高网络入口的网络性能
      nodeSelector:                            # 设置node筛选器，在特定label的节点上启动
        IngressProxy: "true"                   # 调度至IngressProxy: "true"的节点
```

修改ingressrouter配置

```yaml
apiVersion: traefik.io/v1alpha1
kind: IngressRoute
metadata:
  name: myapp2
spec:
  entryPoints:
    - websecure                    # 监听 websecure 这个入口点，也就是通过 443 端口来访问
  routes:
  - match: Host(`myapp2.cuiliangblog.cn`)
    kind: Rule
    services:
    - name: myapp2
      port: 80
  tls:
    certResolver: sample         # 使用自动生成证书，名字与traefik的certificatesResolvers名称一致
    domains:
    - main: "*.cuiliangblog.cn"  # 不指定的话，默认申请Host域名，可以指定申请通配符域名
```

然后在阿里云DNS上做解析，重新创建ingress资源时即可触发申请证书。

常见错误处理方案

| 日志关键词 | 原因 | 解决方案 |
| --- | --- | --- |
| net/http: timeout awaiting response headers或者connect: connection refused | traefik所在节点无法访问Let's Encrypt申请证书 | 使用工具加速 |
| acme:  error :400/403  | 申请的域名DNS解析记录为配置，或者配置地址不正确，指向了其他IP | 更改DNS解析配置，指向traefik节点所在的公网IP |
| acme: error : 429 | 失败次数过多，每个小时只允许请求5次 | 换账号/域名/IP重试或者等一个小时后再试 |


## 路由配置（IngressRouteTCP）
### TCP路由(不带TLS证书)
首先部署一个简单的redis服务，资源清单文件如下所示：

```yaml
# redis.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: redis
spec:
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
        image: redis:latest
        resources:
          limits:
            memory: "128Mi"
            cpu: "500m"
        ports:
        - containerPort: 6379
          protocol: TCP
---
apiVersion: v1
kind: Service
metadata:
  name: redis
spec:
  selector:
    app: redis
  ports:
  - port: 6379
    targetPort: 6379

```

创建redis应用

```bash
[root@k8s-master ingress]# kubectl apply -f redis.yaml 
deployment.apps/redis created
service/redis created
```

<font style="color:rgb(18, 18, 18);">创建</font>IngressRouter<font style="color:rgb(18, 18, 18);">进行对外暴露</font>

```yaml
apiVersion: traefik.io/v1alpha1
kind: IngressRouteTCP
metadata:
  name: redis
spec:
  entryPoints:
    - tcpep											# 指定入口点为tcp端口
  routes:
  - match: HostSNI(`*`)         # 由于Traefik中使用TCP路由配置需要SNI，而SNI又是依赖TLS的，所以我们需要配置证书才行，如果没有证书的话，我们可以使用通配符*(适配ip的)进行配置
    services:
    - name: redis
      port: 6379
```

查看traefik的dashboard页面是否生效

![](assets/06-Kubernetes/47fdcc2d4b2b7ae1a3fd.png)

集群外部客户端配置hosts解析`192.168.93.128 redis.test.com`（域名可以随意填写，只要能解析到traefik所在节点即可），然后通过redis-cli工具访问redis，记得指定tcpep的端口。

```bash
[root@tiaoban ~]# redis-cli -h redis.test.com -p 9200
redis.test.com:9200> set key_a value_a
OK
redis.test.com:9200> get key_a
"value_a"
redis.test.com:9200> 
```

如果需要再添加其他tcp路由，需要修改traefik配置，新增entryPoints端口。

### TCP路由(带TLS证书)
有时候为了安全要求，tcp传输也需要使用TLS证书加密，redis从6.0开始支持了tls证书通信。

```bash
[root@k8s-master ingress]# mkdir redis-ssl
[root@k8s-master ingress]# cd redis-ssl/
[root@k8s-master redis-ssl]# openssl genrsa -out ca.key 4096
[root@k8s-master redis-ssl]# openssl req -x509 -new -nodes -sha256 -key ca.key -days 3650 -subj '/O=Redis Test/CN=Certificate Authority' -out ca.crt
[root@k8s-master redis-ssl]# openssl genrsa -out redis.key 2048
[root@k8s-master redis-ssl]# openssl req -new -sha256 -key redis.key -subj '/O=Redis Test/CN=Server' | openssl x509 -req -sha256 -CA ca.crt -CAkey ca.key -CAserial ca.txt -CAcreateserial -days 365 -out redis.crt
oot@k8s-master redis-ssl]# openssl dhparam -out redis.dh 2048
[root@k8s-master redis-ssl]# ll
总用量 24
-rw-r--r-- 1 root root 1895 9月  25 08:34 ca.crt
-rw------- 1 root root 3243 9月  25 08:34 ca.key
-rw-r--r-- 1 root root   41 9月  25 08:35 ca.txt
-rw-r--r-- 1 root root 1407 9月  25 08:35 redis.crt
-rw-r--r-- 1 root root  424 9月  25 08:35 redis.dh
-rw------- 1 root root 1679 9月  25 08:34 redis.key
```

<font style="color:rgb(43, 43, 43);">创建secret资源，使用tls类型，包含</font>redis.crt和redis.key

```bash
[root@k8s-master redis-ssl]# kubectl create secret tls redis-tls --key=redis.key --cert=redis.crt
secret/redis-tls created
[root@k8s-master redis-ssl]# kubectl describe secrets redis-tls 
Name:         redis-tls
Namespace:    default
Labels:       <none>
Annotations:  <none>

Type:  kubernetes.io/tls

Data
====
tls.crt:  1407 bytes
tls.key:  1679 bytes
```

创建secret资源，使用generic类型，包含ca.crt

```bash
[root@k8s-master redis-ssl]# kubectl create secret generic redis-ca --from-file=ca.crt=ca.crt
secret/redis-ca created
[root@k8s-master redis-ssl]# kubectl describe secrets redis-ca 
Name:         redis-ca
Namespace:    default
Labels:       <none>
Annotations:  <none>

Type:  Opaque

Data
====
ca.crt:  1895 bytes
```

修改redis配置，启用tls证书，并挂载证书文件

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: redis
  labels:
    app: redis
data:
  redis.conf : |-
    port 0
    tls-port 6379
    tls-cert-file   /etc/tls/tls.crt
    tls-key-file   /etc/tls/tls.key
    tls-ca-cert-file   /etc/ca/ca.crt
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: redis
spec:
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
        image: redis:latest
        resources:
          limits:
            memory: "128Mi"
            cpu: "500m"
        ports:
        - containerPort: 6379
          protocol: TCP
        volumeMounts:
          - name: config
            mountPath: /etc/redis
          - name: tls
            mountPath: /etc/tls
          - name: ca
            mountPath: /etc/ca
        args:
        - /etc/redis/redis.conf
      volumes:
        - name:  config
          configMap:
            name: redis
        - name: tls
          secret:
            secretName: redis-tls
        - name: ca
          secret:
            secretName: redis-ca
---
apiVersion: v1
kind: Service
metadata:
  name: redis
spec:
  selector:
    app: redis
  ports:
  - port: 6379
    targetPort: 6379
```

创建资源并查看状态

```yaml
[root@k8s-master ingress]# kubectl apply -f redis.yaml 
configmap/redis created
deployment.apps/redis created
service/redis created
[root@k8s-master ingress]# kubectl get pod
NAME                                          READY   STATUS              RESTARTS   AGE
redis-69974c8b56-rzxb6                        1/1     Running             0          7s
```

创建IngressRouter资源，指定域名和证书

```yaml
apiVersion: traefik.io/v1alpha1
kind: IngressRouteTCP
metadata:
  name: redis
spec:
  entryPoints:
    - tcpep
  routes:
  - match: HostSNI(`redis.test.com`)
    services:
    - name: redis
      port: 6379
  tls:
    secretName: redis-tls
```

traefik管理页查看

![](assets/06-Kubernetes/60e33139644ac9273f10.png)

yum安装的redis-cli版本为5.0.3，不支持tls，需要编译安装6.0以上版本，并在编译时开启TLS

```bash
yum install openssl openssl-devel -y
wget http://download.redis.io/redis-stable.tar.gz
tar xvzf redis-stable.tar.gz
cd redis-stable
make redis-cli BUILD_TLS=yes MALLOC=libc
cp src/redis-cli /usr/local/bin/
```

客户端添加hosts记录`192.168.93.128 redis.test.com`，直接访问redis，直接报错

```bash
[root@tiaoban src]# ./src/redis-cli -h redis.test.com -p 9200

127.0.0.1:6379> set key 1
Error: Connection reset by peer
```

客户端使用证书访问redis测试成功

```bash
[root@tiaoban src]# ./redis-cli -h redis.test.com -p 9200 --tls --cert /tmp/redis-ssl/redis.crt --key /tmp/redis-ssl/redis.key --cacert /tmp/redis-ssl/ca.crt
redis.test.com:9200> set key 1
OK
```

## 路由配置（IngressRouteUDP）
### UDP路由
traefik同样也提供了UDP的支持，以我们最常用的rsyslog服务为例，演示traefik如果配置使用

首先制作一个rsyslog镜像

```bash
[root@k8s-master udp]# ls
Dockerfile  rsyslog.conf
# rsyslog配置
[root@k8s-master udp]# cat rsyslog.conf 
$ModLoad imuxsock # provides support for local system logging (e.g. via logger command)
$ModLoad imudp
$UDPServerRun 514
$WorkDirectory /var/lib/rsyslog
$ActionFileDefaultTemplate RSYSLOG_TraditionalFileFormat
$IncludeConfig /etc/rsyslog.d/*.conf
$OmitLocalLogging off
*.info;mail.none;authpriv.none;cron.none                /var/log/messages
authpriv.*                                              /var/log/secure
mail.*                                                  -/var/log/maillog
cron.*                                                  /var/log/cron
*.emerg                                                 :omusrmsg:*
uucp,news.crit                                          /var/log/spooler
local7.*                                                /var/log/boot.log
# dockerfile配置
[root@k8s-master udp]# cat Dockerfile 
FROM centos:7
RUN yum -y install rsyslog && rm -rf /etc/rsyslog.d/listen.conf
COPY rsyslog.conf /etc/rsyslog.conf
EXPOSE 514/udp
CMD ["/usr/sbin/rsyslogd", "-dn"]
# 构建镜像
[root@k8s-master udp]# docker build -t rsyslog:v1 .
```

接下来创建rsyslog的资源清单

```yaml
[root@k8s-master udp]# cat rsyslog-deployment.yaml 
apiVersion: apps/v1
kind: Deployment
metadata:
  name: rsyslog
spec:
  selector:
    matchLabels:
      app: rsyslog
  template:
    metadata:
      labels:
        app: rsyslog
    spec:
      containers:
      - name: rsyslog
        image: rsyslog:v1
        resources:
          limits:
            memory: "128Mi"
            cpu: "500m"
        ports:
        - containerPort: 514
          protocol: UDP
---
apiVersion: v1
kind: Service
metadata:
  name: rsyslog
spec:
  selector:
    app: rsyslog
  ports:
  - port: 514
    protocol: UDP
    targetPort: 514
```

部署上面的应用并查看

```yaml
[root@k8s-master udp]# kubectl apply -f rsyslog-deployment.yaml 
deployment.apps/rsyslog created
service/rsyslog created
[root@k8s-master udp]# kubectl get pod
NAME                                          READY   STATUS    RESTARTS   AGE
rsyslog-5dfc9d64b5-d9wjj                      1/1     Running   0          3s
```

创建IngressRouter资源，代理UDP应用，需要注意的是UDP资源访问时直接通过公网ip+dup的entryPoints端口即可，不需要配置域名

```yaml
[root@k8s-master udp]# cat rsyslog-ingress.yaml 
apiVersion: traefik.io/v1alpha1
kind: IngressRouteUDP
metadata:
  name: rsyslog
spec:
  entryPoints:
    - udpep
  routes:
  - services:
    - name: rsyslog
      port: 514
[root@k8s-master udp]# kubectl apply -f rsyslog-ingress.yaml 
ingressrouteudp.traefik.containo.us/rsyslog created
```

查看dashboard的udp信息

![](assets/06-Kubernetes/334e1c7fab4eb3ead8d1.png)

集群外部访问udp服务，<font style="color:rgb(53, 53, 53);">通过 Traefik 所在节点的公网 IP（</font>192.168.93.128<font style="color:rgb(53, 53, 53);">）与 </font>entryPoints<font style="color:rgb(53, 53, 53);">端口（</font>9300<font style="color:rgb(53, 53, 53);">）来访问 UDP 应用进行测试</font>

```yaml
[root@tiaoban ~]# logger -n 192.168.93.128 -P 9300 "cuiliang123"
[root@tiaoban ~]# logger -n 192.168.93.128 -P 9300 "hello 123"
```

查看rsyslog日志，验证请求是否成功

```yaml
[root@k8s-master ~]# kubectl get pod
NAME                                          READY   STATUS    RESTARTS   AGE
rsyslog-5dfc9d64b5-d9wjj                      1/1     Running   0          6m48s
[root@k8s-master ~]# kubectl exec -it rsyslog-5dfc9d64b5-d9wjj -- bash
[root@rsyslog-5dfc9d64b5-d9wjj /]# tail -n 5 /var/log/messages 
Sep 25 04:06:20 rsyslog-5dfc9d64b5-d9wjj rsyslogd:  [origin software="rsyslogd" swVersion="8.24.0-57.el7_9.3" x-pid="1" x-info="http://www.rsyslog.com"] start
Sep 25 12:12:55 tiaoban root cuiliang123
Sep 25 12:17:19 tiaoban root hello 123
```

## 负载均衡配置
traefik可以对http、TCP、UDP实现负载均衡，根据需求创建IngressRoute/IngressRouteTCP/IngressRouteUDP即可，此处以http为例。

### http路由多个k8s service配置
创建两个deployment应用与对应的svc

```bash
[root@k8s-master udp]# kubectl get pod
NAME                                          READY   STATUS    RESTARTS   AGE
myapp1-795d947b45-9lsm6                       1/1     Running   1          25h
myapp2-6ffd54f76-ljkr9                        1/1     Running   1          25h
[root@k8s-master udp]# kubectl get svc
NAME         TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)                                                                                 2d22h
myapp1       ClusterIP   10.104.91.200   <none>        80/TCP                                                                                   25h
myapp2       ClusterIP   10.111.245.32   <none>        80/TCP    
```

创建IngressRouter资源，配置域名为myapp.test.com，请求流量均摊到两个k8s的service上。

```yaml
[root@k8s-master ingress]# cat myapp-ingress.yaml 
apiVersion: traefik.io/v1alpha1
kind: IngressRoute
metadata:
  name: myapp
  namespace: default
spec:
  entryPoints:
    - web
  routes:
  - match: Host(`myapp.test.com`)
    kind: Rule
    services:
    - name: myapp1
      namespace: default
      port: 80 
    - name: myapp2
      namespace: default
      port: 80
[root@k8s-master ingress]# kubectl apply -f myapp-ingress.yaml 
ingressroute.traefik.containo.us/myapp created
```

查看dashboard页面路由信息，发现已成功配置代理两个service服务，且权重均为1

![](assets/06-Kubernetes/fbda65e0dd8f7de8a5aa.png)

解析来访问测试，发现依次循环响应myapp1和myapp2的内容

```bash
[root@tiaoban ~]# curl myapp.test.com
Hello MyApp | Version: v1 | <a href="hostname.html">Pod Name</a>
[root@tiaoban ~]# curl myapp.test.com
Hello MyApp | Version: v2 | <a href="hostname.html">Pod Name</a>
[root@tiaoban ~]# curl myapp.test.com
Hello MyApp | Version: v1 | <a href="hostname.html">Pod Name</a>
[root@tiaoban ~]# curl myapp.test.com
Hello MyApp | Version: v2 | <a href="hostname.html">Pod Name</a>
```




