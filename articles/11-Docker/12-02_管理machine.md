# 管理machine

> 分类：Docker / 第12章：Docker Machine
> 原文：https://www.cuiliangblog.cn/detail/section/29427608
> 来源：崔亮的博客

---

# 一、命令总结
Machine提供了一系列的子命令，每个命令都带有一系列参数，可以通过如下命令查看具体用法：

[root@admin ~]#docker-machine  <COMMAND> -h

![](assets/11-Docker/7b400d0720a9f89bfb43.png)

# 二、常用命令
1. 切换到被管理主机

[root@admin ~]#eval $(docker-machine env host1)

2. 节点之间文件拷贝

[root@admin ~]#docker-machine scp  host1:/tmp/a host2:/tmp/b

3. 更新 machine 的 docker 到最新版本，可以批量执行

[root@admin ~]#docker-machine upgrade host1 host2

4. 查看 machine 的 docker daemon 配置

[root@admin ~]#docker-machine config host1

# 三、其他命令
## 1. active——查看激活状态的主机
+ 默认为非激活状态

![](assets/11-Docker/a3dbc5e29a5545e984f2.png)

+ 查看主机信息

![](assets/11-Docker/5a25d530de3951361c8a.png)

+ 激活主机

[root@admin ~]#export DOCKER_HOST="tcp://192.168.10.221:2376"

+ 查看激活状态的主机

![](assets/11-Docker/941dcfe703ebd4cdda90.png)

## 2. create
格式为docker-machine  create [OPTIONS] [arg...]。创建一个Docker主机环境。支持的选项包括：

-driver, -d "virtualbox"：指定驱动类型；

-engine-install-url "[https://get.docker.com](https://get.docker.com)"：配置Docker主机时的安装URL；

-engine-opt option：以键值对格式指定所创建Docker引擎的参数；

-engine-insecure-registry option：以键值对格式指定所创建Docker引擎允许访问的不支持认证的注册仓库服务；

-engine-registry-mirror option：指定使用注册仓库镜像；

-engine-label option：为所创建的Docker引擎添加标签；

-engine-storage-driver：存储后端驱动类型；

-engine-env option：指定环境变量；

-swarm：配置Docker主机加入到Swarm集群中；

-swarm-image "swarm:latest"：使用Swarm时候采用的镜像；

-swarm-master：配置机器作为Swarm集群的master节点；

-swarm-discovery:Swarm集群的服务发现机制参数；

-swarm-strategy “spread”:Swarm默认调度策略；

-swarm-opt option：任意传递给Swarm的参数；

-swarm-host "tcp://0.0.0.0:3376"：指定地址将监听Swarm master节点请求；

-swarm-addr：从指定地址发送广播加入Swarm集群服务。

例如，通过如下命令可以创建一个Docker主机的虚拟机镜像：

```bash
[root@admin ~]#docker-machine create -d  virtualbox \
--engine-storage-driver overlay \
--engine-label name=testmachine \
--engine-label year=2018 \
--engine-opt dns=8.8.8.8 \
--engine-env  HTTP_PROXY=http://proxy.com:3128 \
--engine-insecure-registry  registry.private.com \
mydockermachine
```

所创建Docker主机虚拟机中的Docker引擎将：

+ 使用overlay类型的存储驱动；
+ 带有name=testmachine和year=2015两个标签；
+ 引擎采用8.8.8.8作为默认DNS；
+ 环境变量中指定HTTP代理服务[http://proxy.com:3128](http://proxy.com:3128)。
+ 允许使用不带验证的注册仓库服务registry.private.com。

## 3. env
格式为docker-machine  env [OPTIONS] [arg...]。

显示连接到某个主机需要的环境变量。支持的选项包括：

+ -swarm：显示Swarm集群配置；
+ -shell：指定所面向的Shell环境，默认为当前自动探测；
+ -unset, -u：取消对应的环境变量；
+ -no-proxy：添加对象主机地址到NO_PROXY环境变量。

例如，显示连接到host1主机所需要的环境变量：

![](assets/11-Docker/0407de7dd6a0bc23069c.png)

## 4. inspect
格式为docker-machine  inspect [OPTIONS] [arg...]。

以json格式输出指定Docker主机的详细信息。支持-format,  -f选项使用指定的Go模板格式化输出。例如：

![](assets/11-Docker/907cc5ca2b5f3df2395f.png)

## 5. ip
获取指定Docker主机地址。例如，获取default主机的地址，可以用如下命令：

![](assets/11-Docker/232e36b4d04f6ecbd182.png)

## 6. kill
+ 直接杀死指定的Docker主机，指定Docker主机会强行停止。


