# OpenStack网络配置

> 分类：Linux / 第15章：OpenStack
> 原文：https://www.cuiliangblog.cn/detail/section/31515781
> 来源：崔亮的博客

---

# 一、两个不通网段相互通信
1. 创建网段1网络

![](assets/10-Linux/70a04069fcc409f96b45.png)

1. 设置网段ip

![](assets/10-Linux/da737d970a2d657195ee.png)

 

![](assets/10-Linux/d293fa83a7223ca3e1a4.png)

1. 如上方法创建网段2

![](assets/10-Linux/4f61345e5da63dc4aeb1.png)

1. 分别创建两个虚拟机连接不同网段

![](assets/10-Linux/c2f2852d9abea084eb4a.png)

1. 分别查看主机ip地址
2. 创建路由器

![](assets/10-Linux/8fc744c1edf971d785cf.png)

1. 路由器配置

![](assets/10-Linux/c8265332b5a393d67b90.png)

![](assets/10-Linux/81787aa1c1bdf56071bc.png)

![](assets/10-Linux/9d7a506d3696d4a4346a.png)

1. 查看拓扑图并ping验证

![](assets/10-Linux/ea0b5578d94f590e3deb.png)

# 二、虚拟机连通外网
1. 创建网络

![](assets/10-Linux/d727e57b52ce852147eb.png)

1. 编辑网络

![](assets/10-Linux/55c727712c29c01c0bae.png)

 

![](assets/10-Linux/3124765f0de11135b7f9.png)

 

![](assets/10-Linux/2527e73235bab09fc1cd.png)

 

![](assets/10-Linux/fac6245a9bdcf6d7881a.png)

1. 将网络设置为网关

![](assets/10-Linux/b1ac03c9165b5ecbc760.png)

1. 查看验证

![](assets/10-Linux/1249510ac679a8744676.png)

 

![](assets/10-Linux/5adbf120c8dbdc81656e.png)

# 三、外网连接虚拟机
1. 编辑安全组策略

![](assets/10-Linux/dec0b0b86b64efefdb99.png)

 

![](assets/10-Linux/a00fbc51b247fcfc6ef6.png)

 

![](assets/10-Linux/22616e48be38a34e5135.png)

1. 设置浮动ip

![](assets/10-Linux/f566ee51f80df6a76768.png)

1. 绑定浮动ip

![](assets/10-Linux/17f4f3ba022046e0dbb4.png)

1. 访问浮动ip验证

![](assets/10-Linux/ba615679a5b80a2ca330.png)

 

![](assets/10-Linux/f7607b4209e5efb7fa9e.png)

# 四、免密登录虚拟机
1. 远程机创建密钥

![](assets/10-Linux/52aab425835af16a63fa.png)

 


