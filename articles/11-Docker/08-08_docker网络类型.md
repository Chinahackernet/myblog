# docker网络类型

> 分类：Docker / 第8章：网络管理
> 原文：https://www.cuiliangblog.cn/detail/section/29397251
> 来源：崔亮的博客

---



![](assets/11-Docker/72dcedff923bd34488fb.png)

# 一、none网络
+ none       网络就是什么都没有的网络。挂在这个网络下的容器除了 lo，没有其他任何网卡。
+ 容器创建时，可以通过 --network=none 指定使用       none 网络。
+ 一些对安全性要求高并且不需要联网的应用可以使用 none       网络。比如某个容器的唯一用途是生成随机密码，就可以放到 none 网络中避免密码被窃取。

![](assets/11-Docker/ea1c3b4b113a9372f77a.png)

# 二、host网络
+ 连接到 host 网络的容器共享 Docker host       的网络栈，容器的网络配置与 host 完全一样。
+ 通过 --network=host 指定使用 host 网络。
+ 直接使用 Docker host       的网络最大的好处就是性能，如果容器对网络传输效率有较高要求，则可以选择 host       网络。当然不便之处就是牺牲一些灵活性，比如要考虑端口冲突问题，Docker host 上已经使用的端口就不能再用了。

![](assets/11-Docker/482fbb530f183ccda0d4.png)

# 三、bridge网络
+ Docker 安装时会创建一个命名为       docker0 的 linux bridge。如果不指定--network，创建的容器默认都会挂到 docker0 上。
+ 创建一个容器后，查看容器网络信息。

![](assets/11-Docker/38dbc557ef3e6649444d.png)

![](assets/11-Docker/eb0422f94f2e789e6da9.png)

+ 查看服务器网络信息

![](assets/11-Docker/159e09eabce663aa7895.png)

+ 一个新的网络接口vethe38e866被挂到了 docker0 上，veth9bfd744就是新创建容器的虚拟网卡。eth0@if7和vethe38e866@if6是一对 veth pair。veth pair 是一种成对出现的特殊网络设备，可以把它们想象成由一根虚拟网线连接起来的一对网卡，网卡的一头（eth0@if57）在容器中，另一头（veth9bfd744）挂在网桥 docker0 上，其效果就是将 eth0@if59 也挂在了 docker0 上。
+ 每次创建一个新容器的时候，Docker从可用的地址段中选择一个空闲的IP地址分配给容器的eth0端口，并且使用本地主机上docker0接口的IP作为容器的默认网关

![](assets/11-Docker/e818878293b5cdd659f7.png)


