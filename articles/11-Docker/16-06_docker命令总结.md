# docker命令总结

> 分类：Docker / 第16章：总结
> 原文：https://www.cuiliangblog.cn/detail/section/29821987
> 来源：崔亮的博客

---

# 一、基本语法
1. Docker命令有两大类：客户端命令和服务端命令，前者是主要的操作接口，后者用来启动Docker服务。
+ 客户端命令：基本命令格式为docker [OPTIONS] COMMAND [arg...]；
+ 服务端命令：基本命令格式为dockerd [OPTIONS]。
2. 可以通过man docker或docker      help来查看这些命令，通过man docker-COMMAND或docker help COMMAND来查看这些命令的具体用法和支持的参数。

# 二、客户端命令
1. 命令选项

客户端命令负责操作接口，支持如下命令选项：

![](assets/11-Docker/48eac75863c60da3f9e1.png)

2. 客户端管理命令

Docker客户端单独提供了一组管理命令，对某个资源集中进行管理，包括快照、配置、容器、镜像、网络、节点、插件、秘密、服务、服务栈、集群、系统、密钥和挂载卷等，如下表所示。

![](assets/11-Docker/7e12f81790f2be154091.png)

3. 客户端常用命令

除了针对某个资源的管理命令外，Docker也兼容了之前版本的做法，为一些常见操作提供了快捷命令，如下表所示。

![](assets/11-Docker/59d22423216bc69f189d.png)

![](assets/11-Docker/933e4e81e708ef8dd20d.png)

# 三、服务端命令选项
dockerd命令负责启动服务端主进程，支持的命令选项如下表所示。

![](assets/11-Docker/3e0ffcd36a2d66dc63f8.png)

![](assets/11-Docker/2ded502b31c583c3a4ca.png)

![](assets/11-Docker/216252ba6cf0294c76d0.png)

![](assets/11-Docker/d2f3b13cdfab2d914d5d.png)

# 四、一张图总结Docker命令
![](assets/11-Docker/4532ca083f5f15b321f0.png)

 

 


