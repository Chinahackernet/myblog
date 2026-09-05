# swarm高可用

> 分类：Docker / 第14章：Docker Swarm
> 原文：https://www.cuiliangblog.cn/detail/section/29820743
> 来源：崔亮的博客

---

# 一、实现 Service伸缩
swarm 要实现<font style="color:#383A42;">运行多个实例。这样可以负载均衡，同时也能提供高可用</font>，增加 service 的副本数就可以了。在swarm-manager 上执行如下命令：

docker service scale web_server=5

![](assets/11-Docker/1fa853eca1996659e1b5.png)

副本数增加到 5，通过 docker service ls 和 docker service ps 查看副本的详细信息。

![](assets/11-Docker/9958dcbe4c98c4401843.png)

5 个副本已经分布在 swarm 的所有三个节点上。

默认配置下 manager node 也是 worker node，所以 swarm-manager 上也运行了副本。如果不希望在 manager 上运行 service，可以执行如下命令：

`docker node update --availability drain host2` 

![](assets/11-Docker/3a8cacff0693236af164.png)

通过 docker node ls 查看各节点现在的状态：

![](assets/11-Docker/3709011c35cc4470fb33.png)

Drain 表示swarm-manager 已经不负责运行 service，之前 swarm-manager 运行的那个副本会如何处理呢？用 docker service ps 查看一下：

![](assets/11-Docker/faeb8802d57374bbd3e0.png)

host2 上的副本 web_server.4 已经被 Shutdown 了，为了达到 5 个副本数的目标，在 vm1 上添加了副本 web_server.4。(web_server.5同理)

前面我们的场景是 scale up，我们还可以 scale down，减少副本数，运行下面的命令：

`docker service scale web_server=3` 

![](assets/11-Docker/a1a48906ccddebc5edf2.png)

可以看到，web_server.4 和 web_server.5 这两个副本已经被删除了。

![](assets/11-Docker/45243945f7ca97e532e9.png)

Service 的伸缩就讨论到这里，下边学习故障切换 Failover。

# 二、Swarm 实现 Failover
故障是在所难免的，容器可能崩溃，Docker Host 可能宕机，不过幸运的是，Swarm 已经内置了 failover 策略。

创建 service 的时候，我们没有告诉 swarm 发生故障时该如何处理，只是说明了我们期望的状态（比如运行3个副本），swarm 会尽最大的努力达成这个期望状态，无论发生什么状况。

<font style="color:#383A42;">以</font>[上一节我们部署的 Service ](http://mp.weixin.qq.com/s?__biz=MzIwMTM5MjUwMg==&mid=2653588026&idx=1&sn=d5dfbbe5d602154375dce2f566d21072&chksm=8d308223ba470b35682e0d77f2b1c4b8a3b9b6d3f2f0701cc30f59abca8efebc90de0847ebd1&scene=21#wechat_redirect)<font style="color:#383A42;">为例，当前</font><font style="color:#383A42;"> 3 </font><font style="color:#383A42;">个副本分布在</font><font style="color:#383A42;"> vm1</font><font style="color:#383A42;">和</font><font style="color:#383A42;"> vm2 </font><font style="color:#383A42;">上。</font>

现在我们测试 swarm 的 failover 特性，关闭 vm1。

![](assets/11-Docker/9fc826e4ab2e5ceb6837.png)

Swarm 会检测到 vm1 的故障，并标记为 Down。

![](assets/11-Docker/f0a50f9973daa7908165.png)

<font style="color:#383A42;">Swarm </font><font style="color:#383A42;">会将 </font><font style="color:#383A42;">vm1 </font><font style="color:#383A42;">上的副本调度到其他可用节点。我们可以通过</font><font style="color:#383A42;"> </font>docker service ps<font style="color:#383A42;"> </font><font style="color:#383A42;">观察这个</font><font style="color:#383A42;"> failover </font><font style="color:#383A42;">过程。</font>

![](assets/11-Docker/9951c14d8992648ad95e.png)

可以看到，web_server.1 和 web_server.2 已经从 vm1 迁移到了 vm2，之前运行在故障节点 vm1 上的副本状态被标记为 Shutdown。


