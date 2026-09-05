# docker网络分析

> 分类：Docker / 第8章：网络管理
> 原文：https://www.cuiliangblog.cn/detail/section/29397487
> 来源：崔亮的博客

---

# 一、容器访问外部网络
1. centos 位于 docker0 这个私有      bridge 网络中（172.17.0.0/16），当 centos 从容器向外 ping 时，数据包通过NAT地址转换到达 baidu.com 
2. 查看一下 docker host 上的 iptables 规则：

![](assets/11-Docker/80b930d125776cf5a600.png)

+ 在 NAT 表中，有这么一条规则：

-A POSTROUTING -s 172.17.0.0/16 ! -o docker0 -j MASQUERADE

其含义是：如果网桥 docker0 收到来自 172.17.0.0/16 网段的外出包，把它交给 MASQUERADE 处理。而 MASQUERADE 的处理方式是将包的源地址替换成 host 的地址发送出去，即做了一次网络地址转换（NAT）。

3. 通过 tcpdump 查看地址是如何转换的。先查看 docker      host 的路由表：

![](assets/11-Docker/af4b98bb42314bcc8621.png)

+ 默认路由通过 ens33 发出去，所以我们要同时监控 ens33      和 docker0 上的 icmp（ping）数据包。
+ 当 centos ping baidu.com      时，tcpdump 输出如下：

![](assets/11-Docker/65f94defe6cfaf75cc0e.png)

+ docker0 收到 centos 的 ping      包，源地址为容器 IP 172.17.0.2，这没问题，交给 MASQUERADE 处理。这时，在 ens33 上我们看到了变化：

![](assets/11-Docker/5fe840f74b298d2413cf.png)

+ ping 包的源地址变成了 ens33 的 IP      192.168.137.104
4. 这就是 iptable NAT      规则处理的结果，从而保证数据包能够到达外网。下面用一张图来说明这个过程：

![](assets/11-Docker/412d422befa1c6434f16.png)

+ centos 发送 ping 包：172.17.0.2 >      [www.baidu.com](http://www.baidu.com)。
+ docker0 收到包，发现是发送到外网的，交给 NAT 处理。
+ NAT 将源地址换成 ens33 的      IP：192.168.137.104 > [www.baidu.com](http://www.baidu.com)。
+ ping 包从ens33 发送出去，到达 [www.baidu.com](http://www.baidu.com)。

# 二、外部网络访问容器
1. docker 可将容器对外提供服务的端口映射到 host      的某个端口，外网通过该端口访问容器。容器启动时通过-p参数映射端口：
2. 容器启动后，可通过 docker ps 或者 docker      port 查看到 host 映射的端口。在上面的例子中，httpd 容器的 80 端口被映射到 host 32770 上，这样就可以通过      <host ip>:<32770> 访问容器的 web 服务了。

![](assets/11-Docker/ff96a1a53f07a7299432.png)

+ 除了映射动态端口，也可在 -p 中指定映射到 host      某个特定端口，例如可将 80 端口映射到 host 的 8080 端口：

![](assets/11-Docker/5c9908e98769ee992f32.png)

3. 每一个映射的端口，host 都会启动一个      docker-proxy 进程来处理访问容器的流量：

![](assets/11-Docker/ef8834d00655f2bac3fa.png)

4. 以 0.0.0.0:32770->80/tcp      为例分析整个过程：

![](assets/11-Docker/e9bc5fc15d2d02a2d451.png)

+ docker-proxy 监听 host 的 32770 端口。
+ 当 curl 访问 10.0.2.15:32770      时，docker-proxy 转发给容器172.17.0.2:80。
+ httpd 容器响应请求并返回结果。


