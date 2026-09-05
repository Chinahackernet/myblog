# flannel网络插件

> 分类：Kubernetes / 第10章：网络
> 原文：https://www.cuiliangblog.cn/detail/section/15282589
> 来源：崔亮的博客

---

# 一、原理
1. 为了解决docker主机默认使用同一个子网造成容器ip地址相同问题，预留使用一个网络，如10.244.0.0/16，而后自动为每个节点的Docker容器引擎分配一个子网，如10.244.1.0/24和10.244.2.0/24，并将其分配信息保存于etcd持久存储。
2. 为了解决因为在网络中缺乏路由信息而无法准确送达。flannel有着多种不同的处理方法，每一种处理方法也可以称为一种网络模型，或者称为flannel使用的后端。
+ VxLAN：虚拟可扩展局域网，采用的是MAC in UDP封装方式，将虚拟网络的数据帧添加到VxLAN首部后，封装在物理网络的UDP报文中，然后以传统网络的通信方式传送该UDP报文，待其到达目的主机后，去掉物理网络报文的头部信息以及VxLAN首部，然后将报文交付给目的终端，
+ Host  
GateWay：通过在节点上创建到达目标容器地址的路由直接完成报文转发，因此这种方式要求各节点本身必须在同一个二层网络中，故该方式不太适用于较大的网络规模（大二层网络除外）。host-gw有着较好的转发性能，且易于设定，推荐对报文转发性能要求较高的场景使用。
+ UDP：使用普通UDP报文封装完成隧道转发，其性能较前两种方式要低很多，仅应该在不支持前两种方式的环境中使用。

![](assets/06-Kubernetes/862845cd924e4de1f743.png)

# 二、配置清单
1. 参考地址：[https://github.com/coreos/flannel/blob/master/Documentation/configuration.md](https://github.com/coreos/flannel/blob/master/Documentation/configuration.md)
2. flannel的网络地址是10.244.0.0/16,默认每个子网的掩码长度为24
3. K8s节点之间（Node）通过Vxlan技术进行通信，根据node情况，会把flannel的16位网络地址拆分成多个24位网络地址，供各Node进行分配
4. 每个Node节点按序占用一个C类地址，对应节点上面的Podip是在该C类地址中按规则分配的。

# 三、配置参数
> flannel的配置信息保存于etcd的键名/coreos.com/network/config之下，可以使用etcd服务的客户端工具来设定或修改其可用的相关配置。
>

1. Network：flannel于全局使用的CIDR格式的IPv4网络，字符串格式，此为必选键，余下的均为可选。
2. SubnetLen：将Network属性指定的IPv4网络基于指定位的掩码切割为供各节点使用的子网，此网络的掩码小于24时（如16），其切割子网时使用的掩码默认为24位。
3. SubnetMin：可用作分配给节点使用的起始子网，默认为切分完成后的第一个子网；字符串格式。
4. SubnetMax：可用作分配给节点使用的最大子网，默认为切分完成后最大的一个子网；字符串格式。
5. Backend：flannel要使用的后端类型，以及后端的相关配置，字典格式；VxLAN、host-gw和UDP后端各有其相关的参数。

# 四、配置实例
1. 全局网络为“10.244.0.0/16”，切分子网时用到的掩码长度为24，将相应的子网10.244.0.0/24-10.244.255.0/24分别分配给每一个工作节点使用，选择VxLAN作为使用的后端类型，并监听于8472端口

```json
{
    "Network": "10.244.0.0/16",
    "SubnetLen": 24,
    "SubnetMin": "10.244.0.0",
    "SubnetMax": "10.244.255.0",
    "Backend": {
        "Type": "VxLAN",
        "Port": 8472
    }
}
```


