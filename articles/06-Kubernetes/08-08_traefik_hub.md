# traefik hub

> 分类：Kubernetes / 第8章：Traefik
> 原文：https://www.cuiliangblog.cn/detail/section/95892910
> 来源：崔亮的博客

---

## 简介
### 什么是traefik hub
在traefik2.7后，推出了Traefik Hub云原生网络平台，可帮助你即时在边缘发布、保护和扩展容器。它提供了从用户到容器的端到端连接以及进入每个服务的网关。它是用于在分布式系统中连接多个集群的统一解决方案，它通过一个简单易用的仪表板整合了网络堆栈的多个层。Traefik Hub 是一种开箱即用的解决方案，易于学习，甚至更易于实施，开发团队只需单击一下即可将应用程序发布到 Internet，并自动配置重要的安全实践。

Traefik Hub 将完全托管于你的基础架构之上，并与你安装在每个集群中的代理进行连接。代理附加到入口实例。它们充当你的每项服务的网关，该平台向每个代理发送指令并从其接收关键指标。Traefik Hub 适用于 Kubernetes 或 Docker 集群。

官方文档：[https://doc.traefik.io/traefik/traefik-hub/](https://doc.traefik.io/traefik/traefik-hub/)

traefik hub操作参考文档：[https://traefik.io/blog/publish-and-secure-applications-with-traefik-hub/](https://traefik.io/blog/publish-and-secure-applications-with-traefik-hub/)

### traefik hub特性
**一键服务发布**

Traefik Hub 使发布和暴露任何应用程序到互联网变得容易。<font style="color:rgb(63, 63, 63);">对于每个发布的服务，Traefik Hub 提供了一个唯一的 DNS 名称，可以立即用于从互联网的任何地方访问该容器。</font>![](assets/06-Kubernetes/23bc76c813eb24e3bae2.png)

**<font style="color:rgb(63, 63, 63);">加密隧道</font>**

<font style="color:rgb(63, 63, 63);">Traefik Hub 通过一个私有的、加密的隧道连接到你的集群。利用该隧道，你可以发布你的容器供外部访问，而不必担心复杂和不安全的公共 IP 或 NAT 配置。</font>

![](assets/06-Kubernetes/678e0f58c59e1c6cef1b.png)

**<font style="color:rgb(63, 63, 63);">自动化证书管理</font>**

<font style="color:rgb(63, 63, 63);">Traefik Hub 将请求、更新和传播 ACME 证书到你所有的集群，以便所有服务保持一致的安全配置。</font>

![](assets/06-Kubernetes/b030af193812dfdfb6de.png)

**<font style="color:rgb(63, 63, 63);">灵活地访问控制</font>**

<font style="color:rgb(63, 63, 63);">无论你使用哪种容器编排工具，都能保护和保障对你的服务的访问。Traefik Hub 支持 JSON 网络令牌（JWT）、Basic Auth.</font>

![](assets/06-Kubernetes/15c70f086544166f282c.png)

**<font style="color:rgb(63, 63, 63);">集中化多集群管理仪表板</font>**

<font style="color:rgb(63, 63, 63);">在一个单一的窗口内，轻松地可视化所有关于你的所有集群、它们的配置以及服务性能和健康的入站流量的信息。</font>

![](assets/06-Kubernetes/833ec7a407d85e111ed8.png)

### traefik hub工作原理
![](assets/06-Kubernetes/072d65f96084684b8ece.png)

<font style="color:rgb(63, 63, 63);">首先在你自己的 Kubernetes 或 Docker 集群中，部署2 个 Traefik Hub 相关组件：</font>

+ <font style="color:rgb(63, 63, 63);">Traefik</font>
+ <font style="color:rgb(63, 63, 63);">Traefik Hub Agent（Hub Agent Auth Server+Hub Agent Controller+Hub Agent Tunnel）</font>

<font style="color:rgb(63, 63, 63);">当你对外发布服务的时候，Traefik Hub 会给你的服务分配一个唯一的域名 (DNS)，你需要访问该域名的 HTTPS 协议，然后 Traefik Hub 接收到请求，将请求通过 Traefik Hub 与你自己的 Traefik Hub Agent 之间建立的安全隧道，将请求转发给 Traefik Hub Agent，Traefik Hub Agent 再将请求转发给 Traefik，最后流转到具体的服务。</font>

### 温馨提示
<font style="color:rgb(63, 63, 63);">目前 Traefik Hub SaaS 服务是实验阶段，并不建议上生产使用，实测发现认证服务配置后会并不会自动弹出认证页面。目前免费用户创建服务上限为10个，后续随时可能收费。</font>

## 安装traefik hub
### 创建账户
点击traefik dashboard右侧的`Go to Hub Dashboard`跳转到traefik hub登录页

![](assets/06-Kubernetes/d6d71373f90703d90699.png)

注册账号后登录traefik hub

![](assets/06-Kubernetes/a6597c27887d4b523b90.png)

注册后traefik会自动为你的账号分配域名，安装traefik hub agent后，会自动创建通配符域名证书资源。

### 安装agent
接下来点击agent页面，选择安装traefik hub agent

![](assets/06-Kubernetes/41d8bee79990e383e885.png)

接下来按照提示，安装traefik proxy和traefik hub agent

![](assets/06-Kubernetes/d00a8487932f4d2a708d.png)

执行完成后查看资源信息

```bash
[root@k8s-master ~]# helm list -A
NAME            NAMESPACE       REVISION        UPDATED                                 STATUS          CHART                   APP VERSION
hub-agent       hub-agent       1               2022-10-08 22:51:39.810530479 +0800 CST deployed        hub-agent-0.24.0        v0.5.0     
traefik         hub-agent       1               2022-10-08 22:47:51.683322496 +0800 CST deployed        traefik-12.0.2          2.9.1      
[root@k8s-master ~]# kubectl get pod -n hub-agent 
NAME                                     READY   STATUS    RESTARTS   AGE
hub-agent-auth-server-7cc987c674-df4z4   1/1     Running   0          48s
hub-agent-auth-server-7cc987c674-lf9cj   1/1     Running   0          48s
hub-agent-auth-server-7cc987c674-m85tt   1/1     Running   0          48s
hub-agent-controller-8586f98687-nwhr5    1/1     Running   0          48s
hub-agent-tunnel-75c6f88b55-g6jbd        1/1     Running   0          48s
traefik-hub-64dff85f87-7r52j             1/1     Running   0          4m47s
[root@k8s-master ~]# kubectl get svc -n hub-agent 
NAME                    TYPE           CLUSTER-IP      EXTERNAL-IP      PORT(S)             AGE
hub-agent-auth-server   ClusterIP      10.101.16.85    <none>           80/TCP              108s
hub-agent-controller    ClusterIP      10.104.3.221    <none>           443/TCP             109s
hub-catch-all           ExternalName   <none>          hub.traefik.io   443/TCP             109s
traefik-hub             ClusterIP      10.111.28.192   <none>           9100/TCP,9901/TCP   5m37s
```

接下来查看traefik hub的agent详细信息

![](assets/06-Kubernetes/2ae4c13d863cd571bbe6.png)

## 发布服务
在本地的kubernetes集群有一个myapp1服务，并且创建了service资源(不需要创建ingressrouter资源)，此时访问myapp1只能通过本地svc访问，因为没有公网IP和域名，其他互联网用户无法访问。

```bash
[root@k8s-master ingress]# kubectl get svc
NAME         TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)                                                                                  AGE
kubernetes   ClusterIP   10.96.0.1       <none>        443/TCP                                                                                  14d
myapp1       ClusterIP   10.104.58.5     <none>        80/TCP                                                                                   11h
myapp2       ClusterIP   10.99.197.6     <none>        80/TCP                                                                                   11h
traefik      NodePort    10.104.36.193   <none>        80:32248/TCP,443:30732/TCP,9000:30517/TCP,9100:31763/TCP,9200:32614/TCP,9300:32084/UDP   45m
[root@k8s-master ingress]# kubectl get pod
NAME                                          READY   STATUS    RESTARTS   AGE
myapp1-795d947b45-lvfmb                       1/1     Running   2          11h
myapp2-6ffd54f76-b2thm                        1/1     Running   2          11h
myapp2-6ffd54f76-stvf8                        1/1     Running   0          115s
test                                          1/1     Running   5          8d
traefik-ingress-controller-5d474997df-qnm4l   1/1     Running   0          23m
```

接下来使用traefik hub发布myapp1服务。

![](assets/06-Kubernetes/c3f84581cc6809e88b46.png)

![](assets/06-Kubernetes/e9f9a28724b5b3b427c1.png)

![](assets/06-Kubernetes/74d838968d17ce0253af.png)

应用发布成功时，traefik会为我们自动配置域名并设置ssl证书，接下来访问公网域名即可。访问测试[https://valid-hookworm-xmat3h.qitgjjol.traefikhub.io/](https://valid-hookworm-xmat3h.qitgjjol.traefikhub.io/)

![](assets/06-Kubernetes/19e942583bd125b8d45e.png)

## 发布带访问控制策略的服务
先在访问控制策略页面，点击创建访问控制策略

![](assets/06-Kubernetes/65f4e6c24d2017d99440.png)

选择基本身份验证服务，并设置账号密码

![](assets/06-Kubernetes/488846eb4bd0564e94ed.png)

定义ACP后，我们可以在访问控制策略中看到详细信息

![](assets/06-Kubernetes/0e735680bbb86f6fa5fa.png)

接下来发布一个flask应用，在ACP选项中选择basic auth认证

![](assets/06-Kubernetes/92edce0368da9a4bf2f9.png)

等待应用发布成功，访问公网域名

![](assets/06-Kubernetes/e7214462067207a1d356.png)

实际访问测试并没有出现认证策略，期待官方修复。

![](assets/06-Kubernetes/6e16f9c1bcd9562fda3f.png)

## 发布非k8s服务
除了docker k8s服务的直接暴露外，如果有内网服务与k8s互通的话，也可以通过<font style="color:rgb(63, 63, 63);">Kubernetes Service + Endpoint 的方式将非 Kubernetes 服务配置为 Kubernetes 服务，通过traefik hub发布服务。</font>

<font style="color:rgb(63, 63, 63);">Kubernetes Service + Endpoint的详细用法</font>参考文章：[07-07_%E8%87%AA%E5%AE%9A%E4%B9%89Endpoints.md](articles/06-Kubernetes/07-07_自定义Endpoints.md)

<font style="color:rgb(63, 63, 63);">例如我在k8s集群外的机器部署了青龙面板，由于没有公网IP，只能内网访问。但是运行青龙面板的机器和k8s机器可以互通，此时就可以通过traefik hub发布服务</font>

![](assets/06-Kubernetes/6299f251d5df81b56041.png)

创建青龙服务的service和endpoints

```yaml
[root@tiaoban ingress]# cat qinglong-svc.yaml 
apiVersion: v1
kind: Service
metadata:
  name: qinglong
spec:
  ports:
  - port: 5700
    name: qinglong
    targetPort: 5700
---
apiVersion: v1
kind: Endpoints
metadata: 
  name: qinglong
subsets:
- addresses:
  - ip: 192.168.10.100 # 外部机器IP
  ports:
   - port: 5700 # 服务端口
     name: qinglong
[root@tiaoban ingress]# kubectl apply -f qinglong-svc.yaml 
service/qinglong created
endpoints/qinglong created
[root@tiaoban ingress]# kubectl get svc 
NAME         TYPE           CLUSTER-IP       EXTERNAL-IP      PORT(S)        AGE
flask        ClusterIP      10.104.29.157    <none>           5000/TCP       53m
myapp1       ClusterIP      10.105.147.187   <none>           80/TCP         13h
qinglong     ClusterIP      10.102.161.1     <none>           5700/TCP       6s
```

接下来查看traefik hub控制台，已自动发现qinglong服务。

![](assets/06-Kubernetes/f4f0dc63906f1295feb7.png)

配置qinglong服务发布

![](assets/06-Kubernetes/f5d5f0b6eb94818db424.png)

提示qinglong服务发布成功

![](assets/06-Kubernetes/efe85194c0c32c97593e.png)

通过公网域名访问服务

![](assets/06-Kubernetes/9ab595ae17a36203180d.png)


