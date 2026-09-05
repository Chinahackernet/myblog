# Service资源介绍

> 分类：Kubernetes / 第7章：Service和Ingress
> 原文：https://www.cuiliangblog.cn/detail/section/15275057
> 来源：崔亮的博客

---

## service资源概述


1. Service资源基于标签选择器将一组Pod定义成一个逻辑组合，并通过自己的IP地址和端口调度代理请求至组内的Pod对象之上，它向客户端隐藏了真实的、处理用户请求的Pod资源，使得客户端的请求看上去就像是由Service直接处理并进行响应的一样。

![](assets/06-Kubernetes/e8e13946bb750274bba6.png)

2. Service对象的IP地址位于为Kubernetes集群配置指定专用IP地址的范围之内，而且是一种虚拟IP地址，它在Service对象创建后即保持不变，并且能够被同一集群中的Pod资源所访问。Service端口用于接收客户端请求并将其转发至其后端的Pod中应用的相应端口之上。
3. 通过其标签选择器匹配到的后端Pod资源不止一个时，Service资源能够以负载均衡的方式进行流量调度，实现了请求流量的分发机制。Service与Pod对象之间的关联关系通过标签选择器以松耦合的方式建立，它可以先于Pod对象创建而不会发生错误。
4. Service并不直接链接至Pod对象，它们之间还有一个中间层——Endpoints资源对象，它是一个由IP地址和端口组成的列表，这些IP地址和端口则来自于由Service的标签选择器匹配到的Pod资源。默认情况下，创建Service资源对象时，其关联的Endpoints对象会自动创建。



## service实现原理
![](assets/06-Kubernetes/83c720965330cf788e7c.png)



<font style="color:#121212;">service只是一个抽象的概念，他的工作主要由endpointcontroller和kube-proxy搭配完成</font>

<font style="color:#121212;">endpoints </font><font style="color:#121212;">controller </font><font style="color:#121212;">是负责生成和维护所有 </font><font style="color:#121212;">endpoints </font><font style="color:#121212;">对象的控制器，监听 </font><font style="color:#121212;">service </font><font style="color:#121212;">和对应 </font><font style="color:#121212;">pod </font><font style="color:#121212;">的变化，更新对应 </font><font style="color:#121212;">service </font><font style="color:#121212;">的 </font><font style="color:#121212;">endpoints </font><font style="color:#121212;">对象。当用户创建 </font><font style="color:#121212;">service </font><font style="color:#121212;">后 </font><font style="color:#121212;">endpoints controller </font><font style="color:#121212;">会监听 </font><font style="color:#121212;">pod </font><font style="color:#121212;">的状态，当 </font><font style="color:#121212;">pod </font><font style="color:#121212;">处于 </font><font style="color:#121212;">running </font><font style="color:#121212;">且准备就绪时，</font><font style="color:#121212;">endpoints controller </font><font style="color:#121212;">会将 </font><font style="color:#121212;">pod </font><font style="color:#121212;">ip</font><font style="color:#121212;">记录到 </font><font style="color:#121212;">endpoints </font><font style="color:#121212;">对象中，因此，</font><font style="color:#121212;">service </font><font style="color:#121212;">的容器发现是通过 </font><font style="color:#121212;">endpoints </font><font style="color:#121212;">来实现的</font><font style="color:#121212;">。</font>

<font style="color:#121212;">而 kube-proxy 会监听 service 和 endpoints 的更新并调用其代理模块在主机上刷新路由转发规则。实际的路由转发都是由 kube-proxy 组件来实现的</font>

## 代理模式
### userspace
+ kube-proxy负责跟踪API  
Server上Service和Endpoints对象的变动，并据此调整Service资源的定义。对于每个Service对象，它会随机打开一个本地端口（运行于用户空间的kube-proxy进程负责监听），任何到达此代理端口的连接请求都将被代理至当前Service资源后端的各Pod对象上，至于会挑中哪个Pod对象则取决于当前Service资源的调度方式，默认的调度算法是轮询（round-robin）

![](assets/06-Kubernetes/8c8fcac842d9a9b737c4.png)

+ 这种代理模型中，请求流量到达内核空间后经由套接字送往用户空间的kube-proxy，而后再由它送回内核空间，并调度至后端Pod。

### iptables
+ kube-proxy负责跟踪API  
Server上Service和Endpoints对象的变动（创建或移除），并据此做出Service资源定义的变动。同时，对于每个Service，它都会创建iptables规则直接捕获到达ClusterIP和Port的流量，并将其重定向至当前Service的后端。对于每个Endpoints对象，Service资源会为其创建iptables规则并关联至挑选的后端Pod资源，默认算法是随机调度  
![](assets/06-Kubernetes/957a2040d96f1bc873b6.png)
+ 在创建Service资源时，集群中每个节点上的kube-proxy都会收到通知并将其定义为当前节点上的iptables规则，用于转发工作接口接收到的与此Service资源的ClusterIP和端口的相关流量。客户端发来的请求被相关的iptables规则进行调度和目标地址转换（DNAT）后再转发至集群内的Pod对象之上。  
相对于用户空间模型来说，iptables模型无须将流量在用户空间和内核空间来回切换，因而更加高效和可靠。不过，其缺点是iptables代理模型不会在被挑中的后端Pod资源无响应时自动进行重定向，而userspace模型则可以。

### ipvs代理模型
+ kube-proxy跟踪API  
Server上Service和Endpoints对象的变动，据此来调用netlink接口创建ipvs规则，并确保与API  
Server中的变动保持同步。它与iptables规则的不同之处仅在于其请求流量的调度功能由ipvs实现，余下的其他功能仍由iptables完成。  
![](assets/06-Kubernetes/54341349817cd700db3f.png)
+ 类似于iptables模型，ipvs构建于netfilter的钩子函数之上，但它使用hash表作为底层数据结构并工作于内核空间，因此具有流量转发速度快、规则同步性能好的特性。
+ ipvs支持众多调度算法，有rr：轮询调度lc：最小连接数dh：目标哈希sh：源哈希sed：最短期望延迟nq：不排队调度

## 会话粘性
1. 当客户端访问Pod中的应用程序时，如果有基于客户端身份保存某些私有信息，并基于这些私有信息追踪用户的活动等一类的需求时，那么应该启用session  
affinity机制。
2. Session  
affinity的效果仅会在一定时间期限内生效，默认值为10800秒，超出此时长之后，客户端的再次访问会被调度算法重新调度。另外，Service资源的Session  
affinity机制仅能基于客户端IP地址识别客户端身份，它会把经由同一个NAT服务器进行源地址转换的所有客户端识别为同一个客户端，调度粒度粗糙且效果不佳，因此，实践中并不推荐使用此种方法实现粘性会话。
3. Service资源通过．spec.sessionAffinity和．spec.sessionAffinityConfig两个字段配置粘性会话。spec.sessionAffinity字段用于定义要使用的粘性会话的类型，它仅支持使用“None”和“ClientIP”两种属性值。



+ None：不使用sessionAffinity，默认值。
+ ClientIP：基于客户端IP地址识别客户端身份，把来自同一个源IP地址的请求始终调度至同一个Pod对象。



1. 在启用粘性会话机制时，.spec.sessionAffinityConfig用于配置其会话保持的时长，它是一个嵌套字段，使用格式如下所示，其可用的时长范围为“1～86400”，默认为10800秒：

```yaml
spec:
  sessionAffinity: ClientIP
  sessionAffinityConfig:
  clientIP:
  timeoutSeconds: <integer>
```




