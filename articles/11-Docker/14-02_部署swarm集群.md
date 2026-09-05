# 部署swarm集群

> 分类：Docker / 第14章：Docker Swarm
> 原文：https://www.cuiliangblog.cn/detail/section/29820602
> 来源：崔亮的博客

---

# 一、创建使用Swarm集群
创建三节点的 swarm 集群。

swarm-manager 是 manager node，swarm-worker1 和 swarm-worker2 是 worker node。

所有节点的 Docker 版本均不低于 v1.12。我们的实验环境 node 的操作系统为 centos7.4

在 swarm-manager 上执行如下命令创建 swarm。

`[root@host2 ~]# docker swarm init --advertise-addr 192.168.137.104` 

![](assets/11-Docker/88bfbdd9a66041367b9d.png)

--advertise-addr<font style="color:#383A42;"> </font><font style="color:#383A42;">指定与其他</font><font style="color:#383A42;"> node </font><font style="color:#383A42;">通信的地址。</font>

docker swarm init 输出告诉我们：

+ swarm 创建成功，swarm-manager 成为 manager node。
+ 添加 worker node 需要执行的命令。

`docker swarm join --token SWMTKN-1-5bob8gfqqopfxedxa09bm15fzi9p07vifinzw99c607yec5tvt-43uw9okdwssjtnib0ke1lqsst 192.168.137.104:2377` 

+ 添加 manager node 需要执行的命令。

`docker swarm join-token manager` 

执行 docker node ls 查看当前 swarm 的 node，目前只有一个 manager。

![](assets/11-Docker/aa0caa846b80cdc42651.png)

复制前面的 docker swarm join 命令，在 vm1 和 vm2 上执行，将它们添加到 swarm中。命令输出如下：

![](assets/11-Docker/89acf80ee9f8e5f6aac7.png)

docker node ls 可以看到两个 worker node 已经添加进来了。

![](assets/11-Docker/a7533a24a7b058a4dee7.png)

如果当时没有记录下 docker swarm init 提示的添加 worker 的完整命令，可以通过 docker swarm join-token worker 查看。

![](assets/11-Docker/9e06994ba80c88cb82f9.png)

注意：此命令只能在 manager node 上执行。

至此，三节点的 swarm 集群就已经搭建好了，操作还是相当简单的。

# 二、运行第一个Service 
现在部署一个运行 httpd 镜像的 service，执行如下命令：

docker service create --name web_server httpd

部署 service 的命令形式与运行容器的 docker run 很相似，--name 为 service 命名，httpd 为镜像的名字。

![](assets/11-Docker/7a70766dda0fb3e17bbc.png)

<font style="color:#383A42;">通过</font><font style="color:#383A42;"> </font>docker service ls<font style="color:#383A42;"> </font><font style="color:#383A42;">可以查看当前</font><font style="color:#383A42;"> swarm </font><font style="color:#383A42;">中的</font><font style="color:#383A42;"> service</font><font style="color:#383A42;">。</font>

![](assets/11-Docker/15655d852575f662835b.png)

REPLICAS 如果显示副本信息，0/1 的意思是 web_server 这个 service 期望的容器副本数量为1，目前已经启动的副本数量为 0。也就是当前 service 还没有部署完成。命令 docker service ps 可以查看 service 每个副本的状态。

![](assets/11-Docker/edfd89100247e841eb3f.png)

可以看到 service 唯一的副本被分派到 vm2，当前的状态是 Running，如果看到状态为Preparing，说明还没达到期望的状态 Running，这个副本在 Preparing 什么呢？

其实答案很简单，vm2 是在 pull 镜像，下载完成后，副本就会处于 Running 状态了。

service 的运行副本数也正常了。

如果觉得不放心，还可以到 vm2 去确认 httpd 容器已经运行。

![](assets/11-Docker/0862f38569e6e754cfec.png)

当前 web_server 在 swarm 中的分布

目前为止 Service 与普通的容器还没有太大的不同，下面我们就要学习容器编排引擎的强大功能了，首先从应用伸缩Scale Up/Down 开始。


