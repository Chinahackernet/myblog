# 高可用集群keepalived

> 分类：Linux / 第13章：服务部署
> 原文：https://www.cuiliangblog.cn/detail/section/31467882
> 来源：崔亮的博客

---

# Keepalived 简要介绍
Keepalived 是一种高性能的服务器高可用或热备解决方案， Keepalived 可以用来防止服务器单点故障的发生，通过配合 Nginx 可以实现 web 前端服务的高可用。

Keepalived 以 VRRP 协议为实现基础，用 VRRP 协议来实现高可用性(HA)。 VRRP(Virtual RouterRedundancy Protocol)协议是用于实现路由器冗余的协议， VRRP 协议将两台或多台路由器设备虚拟成一个设备，对外提供虚拟路由器 IP(一个或多个)，而在路由器组内部，如果实际拥有这个对外 IP 的路由器如果工作正常的话就是 MASTER，或者是通过算法选举产生， MASTER 实现针对虚拟路由器 IP 的各种网络功能，如 ARP 请求， ICMP，以及数据的转发等；其他设备不拥有该虚拟 IP，状态是 BACKUP，除了接收 MASTER 的VRRP 状态通告信息外，不执行对外的网络功能。当主机失效时， BACKUP 将接管原先 MASTER 的网络功能。VRRP 协议使用多播数据来传输 VRRP 数据， VRRP 数据使用特殊的虚拟源 MAC 地址发送数据而不是自身网卡的 MAC 地址， VRRP 运行时只有 MASTER 路由器定时发送 VRRP 通告信息，表示 MASTER 工作正常以及虚拟路由器 IP(组)， BACKUP 只接收 VRRP 数据，不发送数据，如果一定时间内没有接收到 MASTER 的通告信息，各 BACKUP 将宣告自己成为 MASTER，发送通告信息，重新进行 MASTER 选举状态。

# 实验准备
## 环境准备
1.   设置两个不同网段，关闭防火墙，设置路由

2.   调度器开启中继模式

![](assets/10-Linux/66953d594255bea8efb4.png)

3.   Web服务器安装httpd，并编写测试页

![](assets/10-Linux/efbdaffd2f40ecea1fde.png)

![](assets/10-Linux/72b5c4e553ed1786ac54.png)

4.   外网客户机访问测试页

![](assets/10-Linux/2b8e887798b9741bf2b7.png)

5.   安装ipvsadm软件包

![](assets/10-Linux/fbdae670abb8bd570275.png)

6.   装载LVS模块

![](assets/10-Linux/f6ccfad328a6f28633d5.png)

## 时间同步
1.   安装软件包

![](assets/10-Linux/697b5d02b32426bf89c0.png)

2.   将网络时间同步到ntf服务器

![](assets/10-Linux/f86dfd6e9d03159f43fa.png)

3.   将系统时间写入硬件时间

![](assets/10-Linux/a13d8856d18468896b09.png)

4.   修改ntp服务主配置文件

![](assets/10-Linux/2bc7f770f472b4a4dec5.png)

![](assets/10-Linux/12a7c2f90c50d15b74a0.png)

5.   开启服务查看端口

![](assets/10-Linux/381650262f6da36b99d9.png)

6.   其他主机同步ntp服务器时间

![](assets/10-Linux/04c885032bec52337a4e.png)

# 漂移IP设置
![](assets/10-Linux/52728c07eb788ed4dd16.png)

## 部署配置
1.   软件包安装

![](assets/10-Linux/a20374c4fac2f880aa09.png)

2.   修改主调度器配置文件

![](assets/10-Linux/31f4142455a0f26489c8.png)

![](assets/10-Linux/7302c2c6a51ec5ff09bb.png)

3.   修改备调度器配置文件

![](assets/10-Linux/d7def870577b658cdb9b.png)

![](assets/10-Linux/c381a731fa1a42cb6a3c.png)

4.   启动服务，查看结果

![](assets/10-Linux/42ab07c06721efe98374.png)

![](assets/10-Linux/8ae33dc35fed7b7c4f60.png)

5.   停止主调度器，查看结果

![](assets/10-Linux/9af5cc5cacb95efc4104.png)

![](assets/10-Linux/2f3dcc53d5a1dd7ca90b.png)

![](assets/10-Linux/81fb3ed179390c4321d6.png)

## 手动开启keepalived日志
1.   修改Keepalived日志配置文件

![](assets/10-Linux/06039b66aff45d2050e9.png)

![](assets/10-Linux/6f6d7ad4f98db8a125b3.png)

-S 3定义日志facility ID号

2.   修改rsyslog配置文件

![](assets/10-Linux/b198bd090c8b5066e5b3.png)

![](assets/10-Linux/e0bbd02f8f03e5d29e9a.png)

3.   验证测试

![](assets/10-Linux/7de2e20b7beee6287a39.png)

## 编写脚本，热切换主备节点
1.   在Keepalived主配置文件中定义切换脚本

![](assets/10-Linux/bc7f2234346a9c1c934a.png)

2.   在主配置文件的vrrp实例中调用脚本

![](assets/10-Linux/7dac3e9bce711279a41d.png)

3.   备节点同样配置

![](assets/10-Linux/2ab25e9bffda4b481bdb.png)

4.   创建文件验证结果

# 实现双主模型
1.   修改原主服务器配置文件，增加备实例

![](assets/10-Linux/85327224ef5c4656bddf.png)

2.   修改原从服务器配置文件，增加主实例

![](assets/10-Linux/f521bcf42ee579cb4498.png)

3.   将切换脚本放到主实例中，进行调用

![](assets/10-Linux/773fc61ab382e11c41fb.png)

4.   重启服务验证

![](assets/10-Linux/4a5f00d38d870f6ae660.png)

![](assets/10-Linux/0c4c2ca05d6fbba661db.png)

![](assets/10-Linux/12445b7410dd22bbe8d4.png)

①和备节点进行交叉，双方都属于一主一备，通过优先级进行控制（这样就形成了双主模型）。

         ②在新的instance中使用不同的漂移IP

        ③优先级定义准确

        ④ID号不要重合

# 实现双主模型（LVS-DR）
1.   两个后端web服务器运行自动配置网卡和内核脚本

![](assets/10-Linux/d0bb7d7408ca43d67253.png)

2.   主备调度器安装ipvsadm

![](assets/10-Linux/1df61e016e1da7a786b1.png)

![](assets/10-Linux/f4e3b4ee78c11b92cb65.png)

3.   配置主备调度器

![](assets/10-Linux/1c968e075af1d6a6bdc8.png)

4.   查看虚拟ip

![](assets/10-Linux/86155f1623ec74ad2e6d.png)

5.   验证操作

![](assets/10-Linux/4dc891d64e4bb35608ac.png)

![](assets/10-Linux/5d57dcbe28e00aa83b03.png)

# 配置nginx高可用集群
**参见如下链接**

[**https://blog.csdn.net/l1028386804/article/details/72801492**](https://blog.csdn.net/l1028386804/article/details/72801492)


