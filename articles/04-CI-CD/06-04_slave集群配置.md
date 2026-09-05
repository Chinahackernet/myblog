# slave集群配置

> 分类：CI/CD / 第6章：Jenkins基础配置
> 原文：https://www.cuiliangblog.cn/detail/section/166306888
> 来源：崔亮的博客

---

# <font style="color:rgba(51, 51, 51, 1);">Jenkins的Master/Slave机制</font>
Jenkins采用Master/Slave架构。Master/Slave相当于Server和agent的概念，Master提供web接口让用户来管理Job和Slave，Job可以运行在Master本机或者被分配到Slave上运行。一个Master可以关联多个Slave用来为不同的Job或相同的Job的不同配置来服务。

Jenkins的Master/Slave机制除了可以并发的执行构建任务，加速构建以外。还可以用于分布式自动化测试，当自动化测试代码非常多或者是需要在多个浏览器上并行的时候，可以把测试代码划分到不同节点上运行，从而加速自动化测试的执行。

# 集群角色功能
**Master：**Jenkins服务器。主要是处理调度构建作业，把构建分发到Slave节点实际执行，监视Slave节点的状态。当然，也并不是说Master节点不能跑任务。构建结果和构建产物最后还是传回到Master节点，比如说在jenkins工作目录下面的workspace内的内容，在Master节点照样是有一份的。

**Slave：**执行机(奴隶机)。执行Master分配的任务，并返回任务的进度和结果。

![](assets/04-CI-CD/b258d4286bed06ea9d58.png)

Jenkins Master/Slave的搭建需要至少两台机器，一台Master节点，一台Slave节点（实际生产中会有多个Slave节点）。

# 搭建步骤
前提：Master和Slave都已经安装JDK

+ Master节点上安装和配置Jenkins
+ Master节点上新增Slave节点配置，生成Master-Slave通讯文件SlaveAgent
+ Slave节点上运行SlaveAgent，通过SlaveAgent实现和Master节点的通讯
+ Master节点上管理Jenkins项目，指定Slave调度策略，实现Slave节点的任务分配和结果搜集来源。

# <font style="color:rgba(51, 51, 51, 1);">为Jenkins配置Master节点</font>
Master不需要主动去建立，安装Jenkins，在登录到主界面时，这台电脑就已经默认为master。

选择“Manage Jenkins”->“Manage Nodes and Clouds”，可以看到Master节点相关信息：

![](assets/04-CI-CD/fc98c132c5ed483f1784.png)

# <font style="color:rgba(51, 51, 51, 1);">为Jenkins添加Slave Node</font>
## 开启tcp代理端口
jenkins web代理是指slave通过jenkins服务端提供的一个tcp端口，与jenkins服务端建立连接，docker版的jenkins默认开启web tcp代理，端口为50000，而自己手动制作的jenkins容器或者在物理机环境部署的jenkins，都需要手动开启web代理端口，如果不开启，slave无法通过web代理的方式与jenkins建立连接。

jenkins web代理的tcp端口不是通过命令启动的而是通过在全局安全设置中配置的，配置成功后会在系统上运行一个指定的端口

![](assets/04-CI-CD/48e52c91429060a36c1c.png)

## 添加节点信息
在Jenkins界面选择“Manage Jenkins”->“Manage Nodes and Clouds”->“New Node

![](assets/04-CI-CD/244961a3ad38e25cb9c8.png)

配置Agent信息

![](assets/04-CI-CD/3918b6e38052480667b3.png)

Name：Slave机器的名字

Description：描述 ，不重要 随意填

Number of excutors：允许在这个节点上并发执行任务的数量，即同时可以下发多少个Job到Slave上执行，一般设置为 cpu 支持的线程数。[注：Master Node也可以通过此参数配置Master是否也执行构建任务、还是仅作为Jenkins调度节点]

Remote root directory：用来放工程的文件夹，jenkins master上设置的下载的代码会放到这个工作目录下。

Lables：标签，用于实现后续Job调度策略，根据Jobs配置的Label选择Salve Node

Usage：支持两种模式“Use this Node as much as possible”、“Only build Jobs with Label expressiong matching this Node”。选择“Only build Jobs with Label     expressiong matching this Node”，

添加完毕后，在Jenkins主界面，可以看到新添加的Slave Node，但是红叉表示此时的Slave并未与Master建立起联系。

![](assets/04-CI-CD/b9785967ffb1512f7dab.png)

## slave节点配置
安装jdk

```bash
[root@springboot1 ~]# dnf -y install java-17-openjdk
[root@springboot1 ~]# java -version
openjdk version "17.0.10" 2024-01-16 LTS
OpenJDK Runtime Environment (Red_Hat-17.0.10.0.7-1) (build 17.0.10+7-LTS)
OpenJDK 64-Bit Server VM (Red_Hat-17.0.10.0.7-1) (build 17.0.10+7-LTS, mixed mode, sharing)
```

安装agent

点击节点信息，根据控制台提示执行安装agent命令

```bash
[root@springboot1 ~]# curl -sO http://192.168.10.73:8080/jnlpJars/agent.jar
[root@springboot1 ~]# java -jar agent.jar -url http://192.168.10.73:8080/ -secret f47e23c0ee95ce8abe58520d3bfe2e048ea36d170841cae8086f77131752f1f9 -name node1 -workDir "/opt/jenkins"
```

## 查看agent状态
![](assets/04-CI-CD/33032ecba44901223b66.png)

#   
<font style="color:rgba(51, 51, 51, 1);">指定Node调度策略                                                    </font>
创建Job的页面，“General”下勾选“Restric where this project can be run”，填写Label Expression。

![](assets/04-CI-CD/5017964562f0cb4d0c03.png)


