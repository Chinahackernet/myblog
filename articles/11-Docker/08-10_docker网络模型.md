# docker网络模型

> 分类：Docker / 第8章：网络管理
> 原文：https://www.cuiliangblog.cn/detail/section/29392774
> 来源：崔亮的博客

---

1. 容器网络模型包括三种基本元素：

![](assets/11-Docker/c635ecda92bdb6f2b02e.png)

+ 沙盒（Sandbox）：代表一个容器（准确地说，是其网络命名空间）；
+ 接入点（Endpoint）：代表网络上可以挂载容器的接口，会分配IP地址；
+ 网络（Network）：可以连通多个接入点的一个子网。
2. 对于使用CNM的容器管理系统来说，具体底下网络如何实现，不同子网彼此怎么隔离，有没有QoS，都不关心。只要插件能提供网络和接入点，只需把容器给接上或者拔下，剩下的都是插件驱动自己去实现，这样就解耦了容器和网络功能，十分灵活。
3. CNM的典型生命周期

![](assets/11-Docker/c3419b6bc6e21897adc9.png)

首先，驱动注册自己到网络控制器，网络控制器使用驱动类型，来创建网络；然后在创建的网络上创建接口；最后把容器连接到接口上即可。销毁过程则正好相反，先把容器从接入口上卸载，然后删除接入口和网络即可。

4. CNM的典型生命周期目前CNM支持的驱动类型有四种：Null、Bridge、Overlay、Remote，简单介绍如下：
+ Null：不提供网络服务，容器启动后无网络连接；
+ Bridge：就是Docker传统上默认用Linux网桥和Iptables实现的单机网络；
+ Overlay：是用vxlan隧道实现的跨主机容器网络；
+ Remote：扩展类型，预留给其他外部实现的方案，比如有一套第三方的SDN方案（如OpenStack       Neutron）就可以接进来。
5. 从位置上看，libnetwork往上提供容器支持，往下隐藏实现差异，自身处于十分关键的中间层。libnetwork可以类比为最核心的TCP/IP层。目前，已有大量的网络方案开始支持libnetwork。


