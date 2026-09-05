# 中间件(Middleware)

> 分类：Kubernetes / 第8章：Traefik
> 原文：https://www.cuiliangblog.cn/detail/section/94472549
> 来源：崔亮的博客

---

## <font style="color:rgb(18, 18, 18);">简介</font>
![](assets/06-Kubernetes/ce0f44250b01dd333ff8.png)

Traefik Middlewares 是一个处于路由和后端服务之前的中间件，在外部流量进入 Traefik，且路由规则匹配成功后，将流量发送到对应的后端服务前，先将其发给中间件进行一系列处理（类似于过滤器链 Filter，进行一系列处理），例如，添加 Header 头信息、鉴权、流量转发、处理访问路径前缀、IP 白名单等等，经过一个或者多个中间件处理完成后，再发送给后端服务，这个就是中间件的作用。

<font style="color:rgb(18, 18, 18);">Traefik内置了很多不同功能的Middleware，主要是针对HTTP和TCP，这里挑选几个比较常用的进行演示。 </font>

<font style="color:rgb(18, 18, 18);">参考文档：</font>[https://doc.traefik.io/traefik/middlewares/overview/](https://doc.traefik.io/traefik/middlewares/overview/)

## 重定向
redirectScheme的更多用法参考文档[https://doc.traefik.io/traefik/middlewares/http/redirectscheme/](https://doc.traefik.io/traefik/middlewares/http/redirectscheme/)

还是以前面的deployment应用与对应的svc为例

```bash
[root@k8s-master udp]# kubectl get pod
NAME                                          READY   STATUS    RESTARTS   AGE
myapp2-795d947b45-9lsm6                       1/1     Running   1          25h
[root@k8s-master udp]# kubectl get svc
NAME         TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)                                                                                 2d22h
myapp2       ClusterIP   10.104.91.200   <none>        80/TCP   
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

创建一个https的IngressRoute

```yaml
[root@k8s-master middleware]# cat https-ingress.yaml
apiVersion: traefik.io/v1alpha1
kind: IngressRoute
metadata:
  name: myapp2-tls
spec:
  entryPoints:
  - websecure
  routes:
  - match: Host(`myapp2.test.com`)
    kind: Rule
    services:
    - name: myapp2
      port: 80 
  tls:
    secretName: myapp2-tls         # 指定tls证书名称
[root@k8s-master middleware]# kubectl apply -f https-ingress.yaml
ingressroute.traefik.containo.us/myapp2-tls created
```

定义一个强制将http请求跳转到https的中间件。

```yaml
[root@k8s-master middleware]# cat https-middleware.yaml 
apiVersion: traefik.io/v1alpha1
kind: Middleware
metadata:
  name: redirect-https-middleware
spec:
  redirectScheme:
    scheme: https
[root@k8s-master middleware]# kubectl apply -f https-middleware.yaml 
middleware.traefik.containo.us/redirect-https-middleware created
```

定义一个http的IngressRoute，并使用中间件

```yaml
[root@k8s-master middleware]# cat http-ingress.yaml 
apiVersion: traefik.io/v1alpha1
kind: IngressRoute
metadata:
  name: myapp2
spec:
  entryPoints:
  - web
  routes:
  - match: Host(`myapp2.test.com`)
    kind: Rule
    services:
    - name: myapp2
      port: 80
    middlewares:
    - name: redirect-https-middleware   # 指定使用RedirectScheme中间件，完成http强制跳转至https
[root@k8s-master middleware]# kubectl apply -f http-ingress.yaml 
ingressroute.traefik.containo.us/myapp1 created
```

访问测试，当用户访问`http://myapp.test.com`时会强制跳转到`https://myapp.test.com`

![](assets/06-Kubernetes/a537f96eb1ce781decb5.png)

## 去除请求路径前缀
假设现在有这样一个需求，当访问`http://myapp.test.com/v1`时，流量调度至myapp1。当访问`http://myapp.test.com/v2`时，流量调度至myapp2。<font style="color:rgb(18, 18, 18);">这种需求是非常常见的，在</font><font style="color:rgb(18, 18, 18);background-color:rgb(246, 246, 246);">NGINX</font><font style="color:rgb(18, 18, 18);">中，我们可以配置多个</font><font style="color:rgb(18, 18, 18);background-color:rgb(246, 246, 246);">Location</font><font style="color:rgb(18, 18, 18);">来定制规则，使用</font><font style="color:rgb(18, 18, 18);background-color:rgb(246, 246, 246);">Traefik</font><font style="color:rgb(18, 18, 18);">也可以这么做。但是定制不同的前缀后，由于应用本身并没有这些前缀，导致请求返回</font><font style="color:rgb(18, 18, 18);background-color:rgb(246, 246, 246);">404</font><font style="color:rgb(18, 18, 18);">，这时候我们就需要对请求的</font><font style="color:rgb(18, 18, 18);background-color:rgb(246, 246, 246);">path</font><font style="color:rgb(18, 18, 18);">进行处理。</font>

参考文档[https://doc.traefik.io/traefik/middlewares/http/stripprefix/](https://doc.traefik.io/traefik/middlewares/http/stripprefix/)

<font style="color:rgb(18, 18, 18);">创建一个IngressRoute，并设置两条规则，根据不同的访问路径代理至相对应的service</font>

```yaml
[root@k8s-master middleware]# cat myapp-ingress.yaml
apiVersion: traefik.io/v1alpha1
kind: IngressRoute
metadata:
  name: myapp
spec:
  entryPoints:
  - web
  routes:
  - match: Host(`myapp.test.com`) && PathPrefix(`/v1`)
    kind: Rule
    services:
    - name: myapp1
      port: 80
  - match: Host(`myapp.test.com`) && PathPrefix(`/v2`)
    kind: Rule
    services:
    - name: myapp2
      port: 80 
[root@k8s-master middleware]# kubectl apply -f myapp-ingress.yaml 
ingressroute.traefik.containo.us/myapp created
```

进行访问测试`http://myapp.test.com/v1`，虽然traefik配置无误，但是由于myapp1应用并没有v1这个路径，因此返回404页面

![](assets/06-Kubernetes/478d49e0d3bd7f27ceaf.png)

![](assets/06-Kubernetes/86ae63b62127d39f35c6.png)

接下来定义**<font style="color:rgb(18, 18, 18);">去除前缀的中间件</font>**stripPrefix，指定将请求路径中的v1、v2去除。

```yaml
[root@k8s-master middleware]# cat prefix-url-middleware.yaml 
apiVersion: traefik.io/v1alpha1
kind: Middleware
metadata:
  name: prefix-url-middleware
spec:
  stripPrefix:
    prefixes:
      - /v1
      - /v2
[root@k8s-master middleware]# kubectl apply -f prefix-url-middleware.yaml 
middleware.traefik.containo.us/prefix-url-middleware created
```

修改上面的ingressRoute，添加刚刚定义的prefix-url-middleware中间件

```yaml
[root@k8s-master middleware]# cat myapp-ingress.yaml 
apiVersion: traefik.io/v1alpha1
kind: IngressRoute
metadata:
  name: myapp
spec:
  entryPoints:
  - web
  routes:
  - match: Host(`myapp.test.com`) && PathPrefix(`/v1`)
    kind: Rule
    services:
    - name: myapp1
      port: 80 
    middlewares:
    - name: prefix-url-middleware
  - match: Host(`myapp.test.com`) && PathPrefix(`/v2`)
    kind: Rule
    services:
    - name: myapp2
      port: 80 
    middlewares:
    - name: prefix-url-middleware
[root@k8s-master middleware]# kubectl apply -f myapp-ingress.yaml 
ingressroute.traefik.containo.us/myapp configured
```

查看traefik的dashboard，已添加了中间件

![](assets/06-Kubernetes/935cee67b23b18d385d3.png)

接下来进行访问测试

![](assets/06-Kubernetes/57b5b9f80207a9157917.png)

![](assets/06-Kubernetes/ea03a02ed283d7851e96.png)

## 添加IP白名单
<font style="color:rgb(18, 18, 18);">为提高安全性，通常情况下一些管理员界面会设置ip访问白名单，只希望个别用户可以访问，例如访问traefik的dashboard的url，这时候就可以使用</font><font style="color:rgb(18, 18, 18);background-color:rgb(246, 246, 246);">Traefik</font><font style="color:rgb(18, 18, 18);">中的</font><font style="color:rgb(18, 18, 18);background-color:rgb(246, 246, 246);">ipWhiteList</font><font style="color:rgb(18, 18, 18);">中间件来完成。</font>

参考文档[https://doc.traefik.io/traefik/middlewares/http/ipwhitelist/](https://doc.traefik.io/traefik/middlewares/http/ipwhitelist/)

<font style="color:rgb(18, 18, 18);">当前traefik的dashboard任何主机都可以访问</font>

```bash
[root@tiaoban ~]# curl http://traefik.test.com/dashboard/
<!DOCTYPE html><html><head><title>Traefik</title><meta charset=utf-8><meta name=description content="Traefik UI">……
```

接下来定义IP访问白名单的中间件<font style="color:rgb(18, 18, 18);background-color:rgb(246, 246, 246);">ipWhiteList</font>，指定可以访问的ip列表。

```yaml
[root@k8s-master middleware]# cat ip-white-middleware.yaml 
apiVersion: traefik.io/v1alpha1
kind: Middleware
metadata:
  name: ip-white-list-middleware
spec:
  ipWhiteList:
    sourceRange:
      - 127.0.0.1/32
      - 192.168.93.1
[root@k8s-master middleware]# kubectl apply -f ip-white-middleware.yaml 
middleware.traefik.containo.us/ip-white-list-middleware created
```

修改dashboard的ingressRoute，添加ip白名单中间件

```yaml
[root@k8s-master middleware]# cat dashboard-ingress.yaml 
apiVersion: traefik.io/v1alpha1
kind: IngressRoute
metadata:
  name: dashboard
spec:
  entryPoints:
    - web
  routes:
    - match: Host(`traefik.test.com`)
      kind: Rule
      services:
      - name: api@internal
        kind: TraefikService
      middlewares:
      - name: ip-white-list-middleware
[root@k8s-master middleware]# kubectl apply -f dashboard-ingress.yaml 
ingressroute.traefik.containo.us/dashboard configured
```

接下来使用白名单之外的ip访问测试

```bash
[root@tiaoban ~]# curl traefik.test.com/dashboard/
Forbidden[root@tiaoban ~]# 
[root@tiaoban ~]# curl -I http://traefik.test.com/dashboard/
HTTP/1.1 403 Forbidden
Date: Sun, 25 Sep 2022 13:32:49 GMT
Content-Length: 9
Content-Type: text/plain; charset=utf-8
```

## 基础用户认证
通常企业安全要求规范除了要对管理员页面限制访问ip外，还需要添加账号密码认证，而traefik默认没有提供账号密码认证功能，此时就可以通过BasicAuth中间件完成用户认证，只有认证通过的授权用户才可以访问页面。

参考文档：[https://doc.traefik.io/traefik/middlewares/http/basicauth/](https://doc.traefik.io/traefik/middlewares/http/basicauth/)

![](assets/06-Kubernetes/4c70477abd439938285a.png)

使用basicAuth认证需要使用htpasswd工具生成密码文件，因此先安装httpd软件包

```bash
[root@k8s-master middleware]# dnf install -y httpd
```

使用htpasswd工具设置用户名密码，生成密钥文件

```bash
[root@k8s-master middleware]# htpasswd -bc basic-auth-secret cuiliang 123
Adding password for user cuiliang

```

将生成的basic-auth-secret密码文件创建成secret资源

```bash
[root@k8s-master middleware]# kubectl create secret generic basic-auth --from-file=basic-auth-secret
secret/basic-auth created
[root@k8s-master middleware]# kubectl get secrets 
NAME                                     TYPE                                  DATA   AGE
basic-auth                               Opaque                                1      8s
```

接下来创建basicAuth中间件，指定使用刚刚创建的secret资源。

```yaml
[root@k8s-master middleware]# cat basic-auth-middleware.yaml 
apiVersion: traefik.io/v1alpha1
kind: Middleware
metadata:
  name: basic-auth-middleware
spec:
  basicAuth:
    secret: basic-auth
[root@k8s-master middleware]# kubectl apply -f basic-auth-middleware.yaml 
middleware.traefik.containo.us/basic-auth-middleware created
```

修改dashboard的ingressRoute，添加basicAuth中间件

```yaml
[root@k8s-master middleware]# cat basic-auth-middleware.yaml 
apiVersion: traefik.io/v1alpha1
kind: Middleware
metadata:
  name: basic-auth-middleware
spec:
  basicAuth:
    secret: basic-auth
[root@k8s-master middleware]# cat dashboard-ingress.yaml 
apiVersion: traefik.containo.us/v1alpha1
kind: IngressRoute
metadata:
  name: dashboard
spec:
  entryPoints:
    - web
  routes:
    - match: Host(`traefik.test.com`)
      kind: Rule
      services:
      - name: api@internal
        kind: TraefikService
      middlewares:
      - name: basic-auth-middleware
[root@k8s-master middleware]# kubectl apply -f basic-auth-middleware.yaml 
middleware.traefik.containo.us/basic-auth-middleware created
```

客户端访问验证，刷新页面后，弹出用户登录认证页面。

![](assets/06-Kubernetes/c3786a0bde9c8cb83af9.png)

## 修改请求/响应头信息
为了提高业务的安全性，安全团队会定期进行漏洞扫描，其中有些web漏洞就需要通过修改响应头处理，traefik的Headers中间件不仅可以修改返回客户端的响应头信息，还能修改反向代理后端service服务的请求头信息。

![](assets/06-Kubernetes/59cc195c62a22b073979.png)

例如对`https://myapp2.test.com`提高安全策略，强制启用HSTS

HSTS：即HTTP严格传输安全响应头，收到该响应头的浏览器会在 63072000s（约 2 年）的时间内，只要访问该网站，即使输入的是 http，浏览器会自动跳转到 https。（HSTS 是浏览器端的跳转，之前的HTTP 重定向到 HTTPS是服务器端的跳转）

参考文档[https://doc.traefik.io/traefik/middlewares/http/headers/](https://doc.traefik.io/traefik/middlewares/http/headers/)

定义响应头中间件Headers，指定响应内容中添加Strict-Transport-Security配置。

```yaml
[root@k8s-master middleware]# cat hsts-header-middleware.yaml 
apiVersion: traefik.io/v1alpha1
kind: Middleware
metadata:
  name: hsts-header-middleware
spec:
  headers:
    customResponseHeaders:
      Strict-Transport-Security: 'max-age=63072000'
[root@k8s-master middleware]# kubectl apply -f hsts-header-middleware.yaml 
middleware.traefik.containo.us/hsts-header-middleware created
```

修改myapp2的ingressRoute，添加headers中间件

```yaml
[root@k8s-master middleware]# cat myapp2-ingress.yaml 
apiVersion: traefik.io/v1alpha1
kind: IngressRoute
metadata:
  name: myapp2-tls
spec:
  entryPoints:
  - web
  - websecure
  routes:
  - match: Host(`myapp2.test.com`)
    kind: Rule
    services:
    - name: myapp2
      port: 80 
    middlewares:
      - name: hsts-header-middleware
  tls:
    secretName: myapp2-tls         # 指定tls证书名称
[root@k8s-master middleware]# kubectl apply -f myapp2-ingress.yaml 
ingressroute.traefik.containo.us/myapp2-tls configured
```

客户端访问验证，查看响应头信息

![](assets/06-Kubernetes/08a4e926f5188901e916.png)

## <font style="color:rgb(18, 18, 18);">限流</font>
<font style="color:rgb(51, 51, 51);">在实际生产环境中，流量限制也是经常用到的，它可以用作安全目的，比如可以减慢暴力密码破解的速率。通过将传入请求的速率限制为真实用户的典型值，并标识目标URL地址(通过日志)，还可以用来抵御 DDOS 攻击。更常见的情况，该功能被用来保护下游应</font>用服务器不被<font style="color:rgb(51, 51, 51);">同时太多用户请求所压垮。</font>

参考文档[https://doc.traefik.io/traefik/middlewares/http/ratelimit/](https://doc.traefik.io/traefik/middlewares/http/ratelimit/)

先模拟正常情况，无任何限流措施，对myapp1使用ab工具进行压力测试，<font style="color:rgb(77, 77, 77);">一共请求一百次，每次并发10次</font>。测试结果失败的请求为0，总耗时0.412秒

```yaml
[root@tiaoban ~]# ab -n 100 -c 10  "http://myapp1.test.com/"
This is ApacheBench, Version 2.3 <$Revision: 1843412 $>
Copyright 1996 Adam Twiss, Zeus Technology Ltd, http://www.zeustech.net/
Licensed to The Apache Software Foundation, http://www.apache.org/

Benchmarking myapp1.test.com (be patient).....done


Server Software:        nginx/1.12.2
Server Hostname:        myapp1.test.com
Server Port:            80

Document Path:          /
Document Length:        65 bytes

Concurrency Level:      10
Time taken for tests:   0.412 seconds
Complete requests:      100
Failed requests:        0
Total transferred:      27700 bytes
HTML transferred:       6500 bytes
Requests per second:    242.78 [#/sec] (mean)
Time per request:       41.189 [ms] (mean)
Time per request:       4.119 [ms] (mean, across all concurrent requests)
Transfer rate:          65.68 [Kbytes/sec] received

Connection Times (ms)
              min  mean[+/-sd] median   max
Connect:        1    4   4.3      3      16
Processing:     4   20  19.2     15     173
Waiting:        4   20  19.0     14     171
Total:          8   25  19.5     19     175

Percentage of the requests served within a certain time (ms)
  50%     19
  66%     27
  75%     30
  80%     32
  90%     43
  95%     55
  98%     61
  99%    175
 100%    175 (longest request)
```

定义限流中间件RateLimit，指定1s内请求数平均值不大于10个，高峰最大值不大于50个。

```yaml
[root@k8s-master middleware]# cat rate-limit-middleware.yaml 
apiVersion: traefik.io/v1alpha1
kind: Middleware
metadata:
  name: rate-limit-middleware
spec:
  rateLimit:
    burst: 10
    average: 50
[root@k8s-master middleware]# kubectl apply -f rate-limit-middleware.yaml 
middleware.traefik.containo.us/rate-limit-middleware created
```

修改myapp1的ingressRoute，添加RateLimit中间件

```yaml
[root@k8s-master middleware]# cat myapp1-ingress.yaml 
apiVersion: traefik.io/v1alpha1
kind: IngressRoute
metadata:
  name: myapp1
spec:
  entryPoints:
  - web
  routes:
  - match: Host(`myapp1.test.com`)
    kind: Rule
    services:
    - name: myapp1  
      port: 80   
    middlewares:
      - name: rate-limit-middleware
[root@k8s-master middleware]# kubectl apply -f myapp1-ingress.yaml 
ingressroute.traefik.containo.us/myapp1 created
```

接下来继续使用ab工具进行压力测试，<font style="color:rgb(77, 77, 77);">一共请求一百次，每次并发10次</font>。测试结果失败的请求为82次，总耗时0.297秒

```yaml
[root@tiaoban ~]# ab -n 100 -c 10  "http://myapp1.test.com/"
This is ApacheBench, Version 2.3 <$Revision: 1843412 $>
Copyright 1996 Adam Twiss, Zeus Technology Ltd, http://www.zeustech.net/
Licensed to The Apache Software Foundation, http://www.apache.org/

Benchmarking myapp1.test.com (be patient).....done


Server Software:        nginx/1.12.2
Server Hostname:        myapp1.test.com
Server Port:            80

Document Path:          /
Document Length:        65 bytes

Concurrency Level:      10
Time taken for tests:   0.297 seconds
Complete requests:      100
Failed requests:        82
   (Connect: 0, Receive: 0, Length: 82, Exceptions: 0)
Non-2xx responses:      82
Total transferred:      20562 bytes
HTML transferred:       2564 bytes
Requests per second:    336.30 [#/sec] (mean)
Time per request:       29.736 [ms] (mean)
Time per request:       2.974 [ms] (mean, across all concurrent requests)
Transfer rate:          67.53 [Kbytes/sec] received

Connection Times (ms)
              min  mean[+/-sd] median   max
Connect:        1    3   3.4      2      17
Processing:     2   12  15.9      9     151
Waiting:        2   11  15.7      7     150
Total:          3   15  16.2     11     153

Percentage of the requests served within a certain time (ms)
  50%     11
  66%     14
  75%     18
  80%     21
  90%     24
  95%     34
  98%     49
  99%    153
 100%    153 (longest request)
```

## <font style="color:rgb(18, 18, 18);">熔断</font>
![](assets/06-Kubernetes/f50fd5c2475eb05e4473.png)

**熔断简介**

服务熔断的作用类似于我们家用的保险丝，当某服务出现不可用或响应超时的情况时，为了防止整个系统出现雪崩，暂时停止对该服务的调用。

**熔断器三种状态**

+ Closed：关闭状态，所有请求都正常访问。
+ Open：打开状态，所有请求都会被降级。traefik会对请求情况计数，当一定时间内失败请求百分比达到阈值，则触发熔断，断路器会完全打开。
+ <font style="color:rgba(0, 0, 0, 0.87);">Recovering</font>：半开恢复状态，open状态不是永久的，打开后会进入休眠时间。随后断路器会自动进入半开状态。此时会释放部分请求通过，若这些请求都是健康的，则会完全关闭断路器，否则继续保持打开，再次进行休眠计时

**服务熔断原理(断路器的原理)**

统计用户在指定的时间范围（默认10s）之内的请求总数达到指定的数量之后，如果不健康的请求(超时、异常)占总请求数量的百分比（50%）达到了指定的阈值之后，就会触发熔断。触发熔断，断路器就会打开(open),此时所有请求都不能通过。在5s之后，断路器会恢复到半开状态(half open)，会允许少量请求通过，如果这些请求都是健康的，那么断路器会回到关闭状态(close).如果这些请求还是失败的请求,断路器还是恢复到打开的状态(open).

**traefik支持的触发器**

+ NetworkErrorRatio：网络错误率
+ ResponseCodeRatio：状态代码比率
+ LatencyAtQuantileMS：分位数的延迟（以毫秒为单位）

**参考文档**

[https://doc.traefik.io/traefik/middlewares/http/circuitbreaker/](https://doc.traefik.io/traefik/middlewares/http/circuitbreaker/)

定义熔断中间件circuitBreaker，指定50% 的请求比例响应时间大于 1MS 时熔断。

```yaml
[root@k8s-master middleware]# cat circuit-breaker-middleware.yaml 
apiVersion: traefik.io/v1alpha1
kind: Middleware
metadata:
  name: circuit-breaker-middleware
spec:
  circuitBreaker:
    expression: LatencyAtQuantileMS(50.0) > 1
[root@k8s-master middleware]# kubectl apply -f circuit-breaker-middleware.yaml 
middleware.traefik.containo.us/circuit-breaker-middleware created
```

修改myapp1的ingressRoute，添加circuitBreaker中间件

```yaml
root@k8s-master middleware]# cat myapp1-ingress.yaml 
apiVersion: traefik.io/v1alpha1
kind: IngressRoute
metadata:
  name: myapp1
spec:
  entryPoints:
  - web
  routes:
  - match: Host(`myapp1.test.com`)
    kind: Rule
    services:
    - name: myapp1  
      port: 80   
    middlewares:
      - name: circuit-breaker-middleware
root@k8s-master middleware]# kubectl apply -f myapp1-ingress.yaml 
ingressroute.traefik.containo.us/myapp1 created
```

继续进行压力测试，<font style="color:rgb(77, 77, 77);">一共请求一千次，每次并发100次</font>。触发熔断机制，测试结果失败的请求为999次，总耗时0.938秒。

```yaml
[root@tiaoban ~]# ab -n 1000 -c 100  "http://myapp1.test.com/"
This is ApacheBench, Version 2.3 <$Revision: 1843412 $>
Copyright 1996 Adam Twiss, Zeus Technology Ltd, http://www.zeustech.net/
Licensed to The Apache Software Foundation, http://www.apache.org/

Benchmarking myapp1.test.com (be patient)
Completed 100 requests
Completed 200 requests
Completed 300 requests
Completed 400 requests
Completed 500 requests
Completed 600 requests
Completed 700 requests
Completed 800 requests
Completed 900 requests
Completed 1000 requests
Finished 1000 requests


Server Software:        nginx/1.12.2
Server Hostname:        myapp1.test.com
Server Port:            80

Document Path:          /
Document Length:        65 bytes

Concurrency Level:      100
Time taken for tests:   0.938 seconds
Complete requests:      1000
Failed requests:        999
   (Connect: 0, Receive: 0, Length: 999, Exceptions: 0)
Non-2xx responses:      999
Total transferred:      153124 bytes
HTML transferred:       19046 bytes
Requests per second:    1065.54 [#/sec] (mean)
Time per request:       93.849 [ms] (mean)
Time per request:       0.938 [ms] (mean, across all concurrent requests)
Transfer rate:          159.34 [Kbytes/sec] received

Connection Times (ms)
              min  mean[+/-sd] median   max
Connect:        1   12   9.2     11      58
Processing:     2   66  53.3     53     314
Waiting:        1   63  51.7     51     309
Total:          5   79  52.8     66     326

Percentage of the requests served within a certain time (ms)
  50%     66
  66%     80
  75%     96
  80%    105
  90%    128
  95%    168
  98%    280
  99%    309
 100%    326 (longest request)
```

## 自定义错误页
在实际的业务中，肯定会存在4XX 5XX相关的错误异常，如果每个应用都开发一个单独的错误页，无疑大大增加了开发成本，traefik同样也支持自定义错误页，但是需要注意的是，错误页面不是有traefik存储处理，而是通过定义中间件，将错误的请求重定向到其他的页面。

![](assets/06-Kubernetes/d1015039a7286e7baeac.png)

参考文档：[https://doc.traefik.io/traefik/middlewares/http/errorpages/](https://doc.traefik.io/traefik/middlewares/http/errorpages/)

首先，我们先创建一个应用，使用flask开个一个简单的demo项目。这个web应用的功能是：当请求/时，返回状态码为200，当请求/400时，返回400状态码，当请求/500时，返回500状态码。

应用的源代码如下：

+ app.py

```python
from flask import Flask, abort

app = Flask(__name__)


@app.route('/')
def hello_world():  # put application's code here
    return 'Hello World!'


@app.route('/400')
def error_404():
    abort(400)


@app.route('/500')
def error_500():
    abort(500)


if __name__ == '__main__':
    app.run()
```

+ templates/index.html

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <title>flask</title>
  </head>
  <body>
    <h1>hello flask</h1>
    <img src="{{ url_for('static',filename='photo.jpg') }}" alt="photo">
  </body>
</html>
```

为了方便大家测试，已将镜像打包上传至docker hub仓库

```yaml
docker pull cuiliang0302/request-code:v2.0
```

接下来我们使用deployment控制器部署这个服务，并创建svc资源

```yaml
[root@k8s-master middleware]# cat flask.yaml 
apiVersion: apps/v1
kind: Deployment
metadata:
  name: flask
spec:
  selector:
    matchLabels:
      app: flask
  template:
    metadata:
      labels:
        app: flask
    spec:
      containers:
      - name: flask
        image: cuiliang0302/request-code:v1.0
        resources:
          limits:
            memory: "128Mi"
            cpu: "500m"
        ports:
        - containerPort: 5000
---
apiVersion: v1
kind: Service
metadata:
  name: flask
spec:
  type: ClusterIP
  selector:
    app: flask
  ports:
  - port: 5000
    targetPort: 5000

[root@k8s-master middleware]# kubectl apply -f flask.yaml 
deployment.apps/flask created
service/flask created
```

接下来创建ingressRouter资源

```yaml
[root@k8s-master middleware]# cat flask-ingress.yaml 
apiVersion: traefik.io/v1alpha1
kind: IngressRoute
metadata:
  name: flask
spec:
  entryPoints:
  - web
  routes:
  - match: Host(`flask.test.com`)
    kind: Rule
    services:
    - name: flask  
      port: 5000 
[root@k8s-master middleware]# kubectl apply -f flask-ingress.yaml 
ingressroute.traefik.containo.us/flask created
```

使用域名访问验证，先添加hosts解析记录`192.168.93.128  flask.test.com`，分别请求不同的路径，模拟4XX 5XX错误

```yaml
[root@k8s-master middleware]# curl -I flask.test.com/
HTTP/1.1 200 OK
Content-Length: 12
Content-Type: text/html; charset=utf-8
Date: Wed, 28 Sep 2022 03:11:03 GMT
Server: Werkzeug/2.2.2 Python/3.10.1

[root@k8s-master middleware]# curl -I flask.test.com/400
HTTP/1.1 400 Bad Request
Content-Length: 167
Content-Type: text/html; charset=utf-8
Date: Wed, 28 Sep 2022 03:11:07 GMT
Server: Werkzeug/2.2.2 Python/3.10.1

[root@k8s-master middleware]# curl -I flask.test.com/500
HTTP/1.1 500 Internal Server Error
Content-Length: 265
Content-Type: text/html; charset=utf-8
Date: Wed, 28 Sep 2022 03:11:11 GMT
Server: Werkzeug/2.2.2 Python/3.10.1

[root@k8s-master middleware]# curl -I flask.test.com/404
HTTP/1.1 404 Not Found
Content-Length: 207
Content-Type: text/html; charset=utf-8
Date: Wed, 28 Sep 2022 03:11:17 GMT
Server: Werkzeug/2.2.2 Python/3.10.1
```

现在提出一个新的需求，当我访问flask项目时，如果错误码为400，返回myapp1的页面，如果错误码为500，返回myapp2的页面(前提是myapp1和myapp2服务已创建)。

我们创建errorpages中间件

```yaml
[root@k8s-master middleware]# cat error-middleware.yaml 
apiVersion: traefik.io/v1alpha1
kind: Middleware
metadata:
  name: errors5
spec:
  errors:
    status:
      - "500-599"
    # query: /{status}.html   # 可以为每个页面定义一个状态码，也可以指定5XX使用统一页面返回
    query : /                 # 指定返回myapp2的请求路径
    service:
      name: myapp2
      port: 80
---
apiVersion: traefik.containo.us/v1alpha1
kind: Middleware
metadata:
  name: errors4
spec:
  errors:
    status:
      - "400-499"
    # query: /{status}.html   # 可以为每个页面定义一个状态码，也可以指定5XX使用统一页面返回
    query : /                 # 指定返回myapp1的请求路径
    service:
      name: myapp1
      port: 80
[root@k8s-master middleware]# kubectl apply -f error-middleware.yaml 
middleware.traefik.containo.us/errors5 created
middleware.traefik.containo.us/errors4 created
```

接下来修改ingressroute资源，添加错误码中间件

```yaml
[root@k8s-master middleware]# cat flask-ingress.yaml
apiVersion: traefik.io/v1alpha1
kind: IngressRoute
metadata:
  name: flask
spec:
  entryPoints:
  - web
  routes:
  - match: Host(`flask.test.com`)
    kind: Rule
    services:
    - name: flask  
      port: 5000
    middlewares:
      - name: errors4
      - name: errors5
[root@k8s-master middleware]# kubectl apply -f error-middleware.yaml 
middleware.traefik.containo.us/errors5 created
middleware.traefik.containo.us/errors4 created
```

最后进行访问验证

```yaml
# 测试200状态码
[root@k8s-master middleware]# curl -I flask.test.com/
HTTP/1.1 200 OK
Content-Length: 12
Content-Type: text/html; charset=utf-8
Date: Thu, 06 Oct 2022 00:36:19 GMT
Server: Werkzeug/2.2.2 Python/3.10.1

[root@k8s-master middleware]# curl flask.test.com/
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>flask</title>
</head>
<body>
<h1>hello flask</h1>
<img src="/static/photo.jpg" alt="photo">
</body>
# 测试400状态码
[root@k8s-master middleware]# curl -I flask.test.com/400
HTTP/1.1 400 Bad Request
Accept-Ranges: bytes
Content-Length: 65
Content-Type: text/html
Date: Thu, 06 Oct 2022 00:36:35 GMT
Etag: "5a98c760-41"
Last-Modified: Fri, 02 Mar 2018 03:39:12 GMT
Server: nginx/1.12.2

[root@k8s-master middleware]# curl flask.test.com/400
Hello MyApp | Version: v1 | <a href="hostname.html">Pod Name</a>
# 测试500状态码
[root@k8s-master middleware]# curl -I flask.test.com/500
HTTP/1.1 500 Internal Server Error
Accept-Ranges: bytes
Content-Length: 65
Content-Type: text/html
Date: Thu, 06 Oct 2022 00:36:46 GMT
Etag: "5a9251f0-41"
Last-Modified: Sun, 25 Feb 2018 06:04:32 GMT
Server: nginx/1.12.2

[root@k8s-master middleware]# curl flask.test.com/500
Hello MyApp | Version: v2 | <a href="hostname.html">Pod Name</a>
# 测试404状态码
[root@k8s-master middleware]# curl -I flask.test.com/404
HTTP/1.1 404 Not Found
Accept-Ranges: bytes
Content-Length: 65
Content-Type: text/html
Date: Thu, 06 Oct 2022 00:37:00 GMT
Etag: "5a98c760-41"
Last-Modified: Fri, 02 Mar 2018 03:39:12 GMT
Server: nginx/1.12.2

[root@k8s-master middleware]# curl flask.test.com/404
Hello MyApp | Version: v1 | <a href="hostname.html">Pod Name</a>
```

## 数据压缩
有时候客户端和服务器之间会传输比较大的报文数据，这时候就占用较大的网络带宽和时长。为了节省带宽，加速报文的响应速速，可以将传输的报文数据先进行压缩，然后再进行传输，traefik也同样支持数据压缩。

<font style="color:rgb(34, 34, 34);"></font>

![](assets/06-Kubernetes/7ec1886028d2236f6323.png)

参考文档：[https://doc.traefik.io/traefik/middlewares/http/compress/](https://doc.traefik.io/traefik/middlewares/http/compress/)

traefik默认只对大于1024字节，且请求标头包含`Accept-Encoding gzip`的资源进行压缩。可以指定排除特定类型不启用压缩或者根据内容大小来决定是否压缩。

继续使用上面创建的flask应用，现在创建中间件，使用默认配置策略即可。

```yaml
[root@k8s-master middleware]# cat compress.yaml 
apiVersion: traefik.io/v1alpha1
kind: Middleware
metadata:
  name: compress
spec:
  compress: {}
[root@k8s-master middleware]# kubectl apply -f compress.yaml 
middleware.traefik.containo.us/compress created
```

修改flask的ingressrouter资源，指定数据压缩中间件

```yaml
[root@k8s-master middleware]# cat flask-ingress.yaml 
apiVersion: traefik.io/v1alpha1
kind: IngressRoute
metadata:
  name: flask
spec:
  entryPoints:
  - web
  routes:
  - match: Host(`flask.test.com`)
    kind: Rule
    services:
    - name: flask  
      port: 5000
    middlewares:
      - name: compress
[root@k8s-master middleware]# kubectl apply -f flask-ingress.yaml 
ingressroute.traefik.containo.us/flask created
```

接下来查看浏览器f12调试信息

+ 图片资源大于1024字节，开启了压缩

![](assets/06-Kubernetes/a07219baee1731abb2d9.png)

+ html资源小于1024字节，未启用压缩

![](assets/06-Kubernetes/65183bcd952fc9c89fb8.png)

## [  
](https://nosaid.com/article/use-traefik#%E6%B5%81%E9%87%8F%E6%B5%81%E8%BD%AC)

