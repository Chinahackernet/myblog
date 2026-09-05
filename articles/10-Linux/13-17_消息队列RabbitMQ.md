# 消息队列RabbitMQ

> 分类：Linux / 第13章：服务部署
> 原文：https://www.cuiliangblog.cn/detail/section/89394395
> 来源：崔亮的博客

---

# 基础概念
## 什么是消息队列
消息队列是一种用于在应用程序之间传递消息的通信方式，消息队列允许应用程序异步的发送和接收消息，并且不需要直接连接到对方。

消息指的是两个应用间传递的数据。数据的类型有很多种形式，可能只包含文本字符串，也可能包含嵌入对象。

队列指的是存储数据的介质，遵循先进先出的规则。

![](assets/10-Linux/9680422b41979354425f.png)

## 为什么使用消息队列
### 解耦
在传统模式下，假设新增物流系统模块，则需要订单系统新增调用物流系统的代码逻辑。假设库存系统异常，订单系统调用出错，会导致整个服务不可用。为了降低这种强耦合，就可以使用MQ，系统订单系统只需要把数据发送到MQ，其他系统如果需要数据，则从MQ中获取即可。

+ 传统模式

![画板](assets/10-Linux/ad5b171f9668098c2244.jpeg)

+ 消息队列模式

![画板](assets/10-Linux/bca5a3c6154d228c58d8.jpeg)

### 异步
如图所示。进行用户注册时，会进行写入数据库、发送邮件、发送短信操作。同步请求的话，响应时间就是所有操作步骤时间的总和，也就是1s。如果使用MQ，用户模块发送数据到MQ，然后就可以返回响应给客户端，不需要再等待系统其他操作的响应，可以大大地提高性能。对于一些非必要的业务，比如发送短信，发送邮件等等，就可以采用MQ。

+ 传统模式

![画板](assets/10-Linux/94845e094493a136335b.jpeg)

+ 消息队列模式

![画板](assets/10-Linux/5ca1fed2cf34bc00ca6e.jpeg)

### 削峰
假设系统A在某一段时间请求数暴增，有5000个请求发送过来，系统A这时就会发送5000条SQL进入MySQL进行执行，MySQL对于如此庞大的请求当然处理不过来，MySQL就会崩溃，导致系统瘫痪。如果使用MQ，系统A不再是直接发送SQL到数据库，而是把数据发送到MQ，MQ短时间积压数据是可以接受的，然后由消费者每次拉取2000条进行处理，防止在请求峰值时期大量的请求直接发送到MySQL导致系统崩溃。

+ 传统模式

![画板](assets/10-Linux/fc5477f5cf5a2a906cc9.jpeg)

+ 消息队列模式

![画板](assets/10-Linux/ec2b2a39a01f75c0ae53.jpeg)

## RabbitMQ的特点
RabbitMQ是一款使用Erlang语言开发的，实现AMQP(高级消息队列协议)的开源消息中间件。

+ 可靠性。支持持久化，传输确认，发布确认等保证了MQ的可靠性。
+ 灵活的分发消息策略。这应该是RabbitMQ的一大特点。在消息进入MQ前由Exchange(交换机)进行路由消息。分发消息策略有：简单模式、工作队列模式、发布订阅模式、路由模式、通配符模式。
+ 支持集群。多台RabbitMQ服务器可以组成一个集群，形成一个逻辑Broker。
+ 多种协议。RabbitMQ支持多种消息队列协议，比如 STOMP、MQTT 等等。
+ 支持多种语言客户端。RabbitMQ几乎支持所有常用编程语言，包括 Java、.NET、Ruby 等等。
+ 可视化管理界面。RabbitMQ提供了一个易用的用户界面，使得用户可以监控和管理消息 Broker。
+ 插件机制。RabbitMQ提供了许多插件，可以通过插件进行扩展，也可以编写自己的插件。

## 消息队列中间件对比
目前在市面上比较主流的MQ中间件主要有，ActiveMQ、RabbitMQ、Kafka、RocketMQ 等这几种，对比如下表：

| 特性 | ActiveMQ | RabbitMQ | Kafka | RocketMQ |
| --- | --- | --- | --- | --- |
| 所属社区/公司 | Apache | Mozilla Public License | Apache | Apache/Ali |
| 单机呑吐量 | 万级 | 万级 | 几十万级 | 十万级 |
| 时效性 | 毫秒级 | 微秒级 | 毫秒级 | 毫秒级 |
| 可用性 | 主从 | 主从 | 分布式 | 分布式 |
| 功能特性 | MQ领域功能极其完备 | 基于erlang开发，所以并发能力很强，性能极其好，延时很低 | 功能较为简单，主要支持简单的MQ功能，在大数据领域的实时计算以及日志采集被大规模使用 | MQ功能比较完备，扩展性佳 |
| 消息可靠性 | 有较低的概率丢失数据 | 基本不丢 | 经过参数优化配置，可以做到 0 丢失 | 同 Kafka |
| 事务 | 支持 | 不支持 | 支持 | 支持 |
| broker端消息过滤 | 支持 | 不支持 | 不支持 | 可以支持Tag标签过滤和SQL表达式过滤 |
| 消息查询 | 支持 | 根据消息id查询 | 不支持 | 支持Message id或Key查询 |
| 消息回溯 | 支持 | 不支持 | 理论上可以支持时间或offset回溯，但是得修改代码。 | 支持按时间来回溯消息，精度毫秒，例如从一天之前的某时某分某秒开始重新消费消息。 |
| 路由逻辑    | 无 | 基于交换机，可配置复杂路由逻辑 | 根据topic | 根据topic，可以配置过滤消费 |
| 持久化 | 内存、文件、数据库 | 队列基于内存，只能少量堆积 | 磁盘，大量堆积 | 磁盘，大量堆积 |
| 顺序消息 | 支持 | 不支持 | 支持 | 支持 |
| 社区活跃度 | 低 | 中 | 高 | 高 |
| 适用场景 | 解耦和异步调用，较少在大规模吞吐的场景中使用 | 数据量小对时效性要求高的场景中使用 | 大数据类的系统来进行实时数据计算、日志采集等场景。 | 目前在阿里被广泛应用在订单、交易、充值、流计算、消息推送、日志流式处理、binglog分发消息等场景。 |


# RabbitMQ原理
## 内部结构
RabbitMQ 本质是 AMQP 协议的一个开源实现，在详细介绍 RabbitMQ 之前，我们先来看一下 AMQP 的内部结构图

![](assets/10-Linux/f086b2b3f94112230602.png)

+ Publisher：消息的生产者，也是一个向交换器发布消息的客户端应用程序
+ Exchange：交换器，用来接收生产者发送的消息并将这些消息路由给服务器中的队列
+ Binding：绑定，用于将消息队列和交换器之间建立关联。一个绑定就是基于路由键将交换器和消息队列连接起来的路由规则，所以可以将它理解成一个由绑定构成的路由表。
+ Queue：消息队列，用来保存消息直到发送给消费者
+ Connection：网络连接，比如一个 TCP 连接
+ Channel：信道，多路复用连接中的一条独立的双向数据流通道
+ Consumer：消息的消费者，表示一个从消息队列中取得消息的客户端应用程序
+ Virtual Host：虚拟主机，表示一批交换器、消息队列和相关对象。虚拟主机是共享相同的身份认证和加密环境的独立服务器域。每个 vhost 本质上就是一个 mini 版的 RabbitMQ 服务器，拥有自己的队列、交换器、绑定和权限机制。vhost 是 AMQP 概念的基础，必须在连接时指定，RabbitMQ 默认的 vhost 是 `/`
+ Broker：表示消息队列服务器实体
+ Message：消息实体，它由消息头和消息体组成。消息头主要由路由键、交换器、队列、priority（相对于其他消息的优先权）、delivery-mode（指出该消息可能需要持久性存储）等属性组成，而消息体就是指具体的业务对象。

相比传统的 JMS 模型，AMQP 主要多了 Exchange、Binding 这个新概念。

在 AMQP 模型中，消息的生产者不是直接将消息发送到`Queue`队列，而是将消息发送到`Exchange`交换器，其中还新加了一个中间层`Binding`绑定，作用就是通过`路由键Key`将交换器和队列建立绑定关系。

![](assets/10-Linux/4807099915c5ffd25adc.jpeg)

就好比类似用户表和角色表，中间通过用户角色表来将用户和角色建立关系，从而实现关系绑定，在 RabbitMQ 中，消息生产者不直接跟队列建立关系，而是将消息发送到交换器之后，由交换器通过已经建立好的绑定关系，将消息发送到对应的队列！

RabbitMQ 最终的架构模型，核心部分就变成如下图所示：

![](assets/10-Linux/04ac0481b80128d605cc.jpeg)

从图中很容易看出，与 JMS 模型最明显的差别就是消息的生产者不直接将消息发送给队列，而是由`Binding`绑定决定交换器的消息应该发送到哪个队列，进一步实现了在消息的推送方面，更加灵活！

## 交换器分发策略
当消息的生产者将消息发送到交换器之后，是不会存储消息的，而是通过中间层绑定关系将消息分发到不同的队列上，其中交换器的分发策略分为四种：Direct、Topic、Headers、Fanout！

+ Direct：直连类型，即在绑定时设定一个 routing_key, 消息的 routing_key 匹配时, 才会被交换器投送到绑定的队列中去，原则是先匹配、后投送；
+ Topic：按照规则转发类型，支持通配符匹配，和 Direct 功能一样，但是在匹配 routing_key的时候，更加灵活，支持通配符匹配，原则也是先匹配、后投送；
+ Headers：头部信息匹配转发类型，根据消息头部中的 header attribute 参数类型，将消息转发到对应的队列，原则也是先匹配、后投送；
+ Fanout：广播类型，将消息转发到所有与该交互机绑定的队列上，不关心 routing_key；

### Direct
Direct 是 RabbitMQ 默认的交换机模式，也是最简单的模式，消息中的路由键（routing key）如果和 Binding 中的 binding key 一致， 交换器就将消息发到对应的队列中。

如果传入的 routing key 为 `black`，不会转发到`black.green`。Direct 类型交换器是完全匹配、单播的模式。

![](assets/10-Linux/c7a33acffffd500cd9b7.jpeg)

### Topic
Topic 类型交换器转发消息和 Direct 一样，不同的是：它支持通配符转发，相比 Direct 类型更加灵活！

两种通配符：`*`只能匹配一个单词，`#`可以匹配零个或多个。

如果传入的 routing key 为 `black#`，不仅会转发到`black`，也会转发到`black.green`。

![](assets/10-Linux/fec2c1896781c87629f7.jpeg)

### Headers
headers 也是根据规则匹配, 相比 direct 和 topic 固定地使用 routing_key , headers 则是通过一个自定义匹配规则的消息头部类进行匹配。

在队列与交换器绑定时，会设定一组键值对规则，消息中也包括一组键值对( headers 属性)，当这些键值对有一对, 或全部匹配时，消息被投送到对应队列。

此外 headers 交换器和 direct 交换器完全一致，但性能差很多，目前几乎用不到了。

![](assets/10-Linux/ad62af5d08107b3fbd96.jpeg)

### Fanout
Fanout  类型交换器与上面几个不同，不管路由键或者是路由模式，会把消息发给绑定给它的全部队列，如果配置了 routing_key 会被忽略，也被成为消息广播模式。很像子网广播，每台子网内的主机都获得了一份复制的消息

fanout 类型转发消息在四种类型中是最快的。

![](assets/10-Linux/e85c4d5c23da7b040534.jpeg)

# 单节点部署
## docker部署
参考文档：[https://hub.docker.com/_/rabbitmq](https://hub.docker.com/_/rabbitmq)

```bash
docker run -d --name RabbitMQ -e RABBITMQ_DEFAULT_USER=admin -e RABBITMQ_DEFAULT_PASS=CHANGE_ME -p 15672:15672 rabbitmq:4.0-management
```

然后打开浏览器访问`服务器ip:15672`，输入我们创建的账号密码登录即可。

## rpm部署
### 安装Erlang
RabbitMQ是采用 Erlang语言开发的，所以系统环境必须提供 Erlang环境，需要是安装 Erlang

`Erlang`和`RabbitMQ`版本对照：[https://www.rabbitmq.com/which-erlang.html](https://www.rabbitmq.com/which-erlang.html)

本次安装4.0版本的RabbitMQ，需要的Erlang版本为26.2，

下载地址：[https://packagecloud.io/rabbitmq/erlang](https://packagecloud.io/rabbitmq/erlang)

```bash
[root@tiaoban ~]# wget https://packagecloud.io/rabbitmq/erlang/packages/el/8/erlang-26.2.5.3-1.el8.x86_64.rpm/download.rpm -O ./erlang-26.2.5.3-1.el8.x86_64.rpm
[root@tiaoban ~]# ls
erlang-26.2.5.3-1.el8.x86_64.rpm
# 安装erlang
[root@tiaoban ~]# rpm -ivh erlang-26.2.5.3-1.el8.x86_64.rpm
警告：erlang-26.2.5.3-1.el8.x86_64.rpm: 头V4 RSA/SHA256 Signature, 密钥 ID 6026dfca: NOKEY
Verifying...                          ################################# [100%]
准备中...                          ################################# [100%]
正在升级/安装...
   1:erlang-26.2.5.3-1.el8            ################################# [100%]
# 验证
[root@tiaoban ~]# erl -v
Erlang/OTP 26 [erts-14.2.5.3] [source] [64-bit] [smp:4:4] [ds:4:4:10] [async-threads:1] [jit:ns]

Eshell V14.2.5.3 (press Ctrl+G to abort, type help(). for help)
1>
```

### 安装RabbitMQ
下载地址：[https://www.rabbitmq.com/docs/install-rpm](https://www.rabbitmq.com/docs/install-rpm)

在RabiitMQ安装过程中需要依赖socat和logrotate插件，首先安装该插件

```bash
[root@tiaoban ~]# dnf -y install socat logrotate
```

安装RabbitMQ

```bash
[root@tiaoban ~]# wget https://github.com/rabbitmq/rabbitmq-server/releases/download/v4.0.1/rabbitmq-server-4.0.1-1.el8.noarch.rpm
[root@tiaoban ~]# ls
erlang-26.2.5.3-1.el8.x86_64.rpm  k8s  rabbitmq-server-4.0.1-1.el8.noarch.rpm
[root@tiaoban ~]# rpm -ivh rabbitmq-server-4.0.1-1.el8.noarch.rpm
警告：rabbitmq-server-4.0.1-1.el8.noarch.rpm: 头V4 RSA/SHA512 Signature, 密钥 ID 6026dfca: NOKEY
Verifying...                          ################################# [100%]
准备中...                          ################################# [100%]
正在升级/安装...
   1:rabbitmq-server-4.0.1-1.el8      ################################# [100%]
[/usr/lib/tmpfiles.d/rabbitmq-server.conf:1] Line references path below legacy directory /var/run/, updating /var/run/rabbitmq → /run/rabbitmq; please update the tmpfiles.d/ drop-in file accordingly.
```

启动RabbitMQ服务

```bash
[root@tiaoban ~]# systemctl start rabbitmq-server
[root@tiaoban ~]# systemctl enable rabbitmq-server
Created symlink /etc/systemd/system/multi-user.target.wants/rabbitmq-server.service → /usr/lib/systemd/system/rabbitmq-server.service.
[root@tiaoban ~]# systemctl status rabbitmq-server
```

默认情况下，rabbitmq没有安装web端的客户端软件，需要安装才可以生效

```bash
[root@tiaoban ~]# rabbitmq-plugins enable rabbitmq_management
```

访问`服务器ip:15672`，就可以看到管理界面  
![](assets/10-Linux/9d2a3716f2d9a6681128.png)

# 高可用集群部署
## 高可用集群方案
RabbitMQ的集群主要有两种模式：普通集群模式和克隆队列模式。

普通集群模式：集群中各个节点之间只会相互同步元数据，消息数据不会被同步。不论是生产者还是消费者，假如连接到的节点上没有存储队列数据，那么内部会将其转发到存储队列数据的节点上进行存储。虽然说内部可以实现转发，但是因为消息仅仅只是存储在一个节点，所以这种普通集群模式并没有达到高可用的目的。

克隆队列模式：集群中各个节点之间不仅仅会同步元数据，消息内容也会在镜像节点间同步，可用性更高。这种方案提升了可用性的同时，因为同步数据之间也会带来网络开销从而在一定程度上会影响到性能。

程序通过访问 KeepAlived 提供的 VIP（虚拟 ip）指定到其中一个Haproxy，然后 Haproxy 将访问请求代理到其管理的多个 Rabbitmq Server 中的一个，从而实现了高可用、负载均衡的功能。

![](assets/10-Linux/731332b536d29a5f6224.png)

## 集群角色规划
通过hk1和hk2两台服务，部署HA-proxy和KeepAlived实现高可用和负载均衡服务，通过VIP 192.168.10.90对外提供服务，所有请求反向代理至mq1、mq2、mq3组成的RabbitMQ集群。

| 服务器IP | hostname | 节点服务 |
| --- | --- | --- |
| 192.168.10.90 |  | vip |
| 192.168.10.91 | hk1 | HA proxy、KeepAlived |
| 192.168.10.92 | hk2 | HA proxy、KeepAlived |
| 192.168.10.93 | mq1 | RabbitMQ |
| 192.168.10.94 | mq2 | RabbitMQ |
| 192.168.10.95 | mq3 | RabbitMQ |


## Rabbit MQ集群部署
MQ集群节点修改hosts解析和主机名（每台mq节点执行）

```bash
[root@mq1 ~]# cat /etc/hosts
192.168.10.93  mq1
192.168.10.94  mq2
192.168.10.95  mq3
```

部署Erlang和RabbitMQ服务（每台mq节点执行）

> 参考上文单节点部署流程，此处不再赘述。
>

启动RabbitMQ服务（每台mq节点执行）

```bash
[root@mq1 ~]# systemctl enable rabbitmq-server --now
```

RabbitMQ集群节点需要共享一个Erlang cookie，默认存储在`/var/lib/rabbitmq/.erlang.cookie`。需要在所有节点上保持该文件一致：（mq1节点执行）

```bash
[root@mq1 ~]# ls /var/lib/rabbitmq/.erlang.cookie
/var/lib/rabbitmq/.erlang.cookie
[root@mq1 ~]# scp /var/lib/rabbitmq/.erlang.cookie mq2:/var/lib/rabbitmq/                                                                                                                      100%   20     9.4KB/s   00:00
[root@mq1 ~]# scp /var/lib/rabbitmq/.erlang.cookie mq3:/var/lib/rabbitmq/
# 确保复制后的文件权限为400：
[root@mq2 ~]# chmod 400 /var/lib/rabbitmq/.erlang.cookie
```

在节点2和节点3上执行以下命令，将它们加入到节点1的集群中（mq2和3节点执行）：

```bash
[root@mq2 ~]# systemctl restart rabbitmq-server
[root@mq2 ~]# rabbitmqctl stop_app
Stopping rabbit application on node rabbit@mq2 ...
[root@mq2 ~]# rabbitmqctl join_cluster rabbit@mq1
Clustering node rabbit@mq2 with rabbit@mq1
[root@mq2 ~]# rabbitmqctl start_app
Starting node rabbit@mq2 ...
```

在任何一个节点上查看集群状态

```bash
[root@mq3 ~]# rabbitmqctl cluster_status
Cluster status of node rabbit@mq3 ...
Basics

Cluster name: rabbit@mq3
Total CPU cores available cluster-wide: 12

Disk Nodes

rabbit@mq1
rabbit@mq2
rabbit@mq3

Running Nodes

rabbit@mq1
rabbit@mq2
rabbit@mq3

Versions

rabbit@mq3: RabbitMQ 4.0.1 on Erlang 26.2.5.3
rabbit@mq1: RabbitMQ 4.0.1 on Erlang 26.2.5.3
rabbit@mq2: RabbitMQ 4.0.1 on Erlang 26.2.5.3

CPU Cores

Node: rabbit@mq3, available CPU cores: 4
Node: rabbit@mq1, available CPU cores: 4
Node: rabbit@mq2, available CPU cores: 4

Maintenance status

Node: rabbit@mq3, status: not under maintenance
Node: rabbit@mq1, status: not under maintenance
Node: rabbit@mq2, status: not under maintenance
```

安装web端插件并设置账户密码

```bash
# 所有mq节点执行
[root@mq1 ~]# rabbitmq-plugins enable rabbitmq_management
# 其中一个节点执行
[root@mq1 ~]# rabbitmqctl add_user admin CHANGE_ME
Adding user "admin" ...
Done. Dont forget to grant the user permissions to some virtual hosts! See 'rabbitmqctl help set_permissions' to learn more.
[root@mq1 ~]# rabbitmqctl set_user_tags admin administrator
Setting tags for user "admin" to [administrator] ...
[root@mq1 ~]# rabbitmqctl set_permissions -p / admin ".*" ".*" ".*"
Setting permissions for user "admin" in vhost "/" ...
```

浏览器访问mq1:15672，查看UI信息

![](assets/10-Linux/1e2e57a4e5d9f918c66c.png)

此时，集群搭建完毕，但是默认采用的模式“普通模式”，只会相互同步元数据，消息数据不会被同步，如果某一个节点宕机，则会导致该节点上的消息数据不可用。

## 创建克隆队列策略
在之前的mq中，我们可以将所有队列设置为镜像队列，即队列会被复制到各个节点，各个节点元数据和消息内容保持一致。 从 RabbitMQ 3.8 开始，官方不推荐使用经典的镜像队列，而是推荐使用 队列克隆（Quorum Queues） 来代替镜像队列。Quorum Queues 提供了更稳定的高可用性，尤其是在节点故障和网络分区的情况下。  

1. name：策略名，可自定义
2. pattern：队列的匹配模式（正则表达式）
+ "^" 可以使用正则表达式，比如"^queue_" 表示对队列名称以“queue_”开头的所有 队列进行镜像，而"^"表示匹配所有的队列
3. definition：镜像定义，`x-queue-type: quorum`：指定队列类型为 Quorum Queue。  
+ quorum.initial-group-size：指定 Quorum Queue 初始副本数量（通常与集群节点数量相匹配）  
+ max-length：设置队列的最大长度，以限制存储的消息数量。当队列中的消息数超过此限制时，RabbitMQ 会丢弃最早的消息。  
+ delivery-limit： 设置消息在投递失败后的最大重试次数。达到这个次数后，消息会被转移到死信队列（DLX）。  
+ message-ttl：消息在队列中的生存时间，单位为毫秒。
4. priority：可选参数，policy的优先级。

![](assets/10-Linux/c2334f70380dca4243b3.png)

## HaProxy部署
> 以下操作在hk1和hk2机器执行
>

安装haproxy

```bash
[root@hk1 ~]# dnf -y install haproxy
```

修改配置文件

```bash
[root@hk1 ~]# cp /etc/haproxy/haproxy.cfg /etc/haproxy/haproxy.cfg.bak
[root@hk1 ~]# vim /etc/haproxy/haproxy.cfg
# 开启管理员监控页面
listen admin_stats
    bind    *:8080    #监听的ip端口号
    stats   enable
    stats   refresh 30s   #统计页面自动刷新时间
    stats   uri /admin    #访问的uri   ip:8080/admin
    stats   realm haproxy
    stats   auth admin:admin  #认证用户名和密码
    stats   hide-version   #隐藏HAProxy的版本号
    stats   admin if TRUE   #管理界面，如果认证成功了，可通过webui管理节点                       
# 配置前端监听
frontend main
    mode tcp
    bind *:5672 # 监听地址
    default_backend  rabbitmq # 匹配后端服务
    timeout client 30s
# 配置后端代理
backend rabbitmq # 后端服务名称
    mode tcp
    server  rabbitmq1 192.168.10.93:5672 check
    server  rabbitmq2 192.168.10.94:5672 check
    server  rabbitmq3 192.168.10.95:5672 check
    timeout connect 5s
    timeout server 30s
```

启动服务

```bash
[root@hk1 ~]# systemctl start haproxy.service 
[root@hk1 ~]# systemctl enable haproxy.service 
Created symlink /etc/systemd/system/multi-user.target.wants/haproxy.service → /usr/lib/systemd/system/haproxy.service.
[root@hk1 ~]# ss -tunlp | grep haproxy
udp   UNCONN 0      0            0.0.0.0:59334      0.0.0.0:*    users:(("haproxy",pid=2489,fd=6),("haproxy",pid=2487,fd=6))
tcp   LISTEN 0      2048         0.0.0.0:5672       0.0.0.0:*    users:(("haproxy",pid=2489,fd=7))                          
tcp   LISTEN 0      2048         0.0.0.0:8080       0.0.0.0:*    users:(("haproxy",pid=2489,fd=5))   
```

访问haproxy管理员页面验证配置是否生效。

![](assets/10-Linux/e062cd279c1f0a1bc333.png)

确认无误后hk2服务器同样的步骤配置。

## KeepAlived部署
> 以下操作在hk1和hk2机器执行，设备网卡名称为ens160，VIP为192.168.10.90。
>

安装软件包

```bash
[root@hk1 ~]# dnf -y install keepalived
```

新增haproxy检测脚本

```bash
[root@hk1 ~]# cd /etc/keepalived
[root@hk1 ~]# cat check_port_5672.sh 
#!/bin/bash
# 检测5672端口是否存活
timeout 2 bash -c "</dev/tcp/127.0.0.1/5672"
if [ $? -ne 0 ]; then
  exit 1 # 不存活返回1
else
  exit 0 # 存活时返回 0
fi
[root@hk1 ~]# chmod +x check_port_5672.sh 
```

修改配置文件

```bash
[root@hk1 ~]# cp /etc/keepalived/keepalived.conf /etc/keepalived/keepalived.conf.bak
[root@hk1 ~]# vim /etc/keepalived/keepalived.conf
global_defs {
  script_user root
  enable_script_security
} 

vrrp_script chk_port_5672 {
    script "/etc/keepalived/check_port_5672.sh"   # 自定义检测脚本路径
    interval 1        # 检测间隔，单位为秒
    weight -2         # 如果检测失败，权重降低2
}

vrrp_instance VI_1 {
    state MASTER					# 设置为master节点
    interface ens160    	# 物理网卡名称
    virtual_router_id 51 	# 虚拟路由ID，主备保持一致
    priority 100					# 优先级，主大于备
    advert_int 1					# 关播间隔
    authentication {			# 认证信息，主备一致
        auth_type PASS
        auth_pass 1111
    }
    virtual_ipaddress {
        192.168.10.90/24	# 虚拟IP信息
    }
    track_script {
        chk_port_5672     # 引用上面定义的脚本
    }
}
```

启动服务

```bash
[root@hk1 ~]# systemctl start keepalived.service 
[root@hk1 ~]# systemctl enable keepalived.service 
[root@hk1 ~]# ip a 
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    inet 127.0.0.1/8 scope host lo
       valid_lft forever preferred_lft forever
    inet6 ::1/128 scope host 
       valid_lft forever preferred_lft forever
2: ens160: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc mq state UP group default qlen 1000
    link/ether 00:0c:29:2a:b6:b3 brd ff:ff:ff:ff:ff:ff
    altname enp3s0
    inet 192.168.10.91/24 brd 192.168.10.255 scope global noprefixroute ens160
       valid_lft forever preferred_lft forever
    inet 192.168.10.90/24 scope global secondary ens160
       valid_lft forever preferred_lft forever
```

此时可以看到vip 192.168.10.90绑定到了hk1服务器ens160网卡上。

同样的操作配置hk2服务器，配置文件如下：

```bash
global_defs {
  script_user root
  enable_script_security
}

vrrp_script chk_port_5672 {
    script "/etc/keepalived/check_port_5672.sh"  
    interval 2      
    weight -2        
}

vrrp_instance VI_1 {
    state BACKUP # 主备类型
    interface ens160 
    virtual_router_id 51
    priority 99 # 优先级低于主
    advert_int 1
    authentication {
        auth_type PASS
        auth_pass 1111
    }
    virtual_ipaddress {
        192.168.10.90/24
    }
    track_script {
        chk_port_5672      # 引用上面定义的脚本
    }
}
```

## 高可用测试
接下来停止hk1服务，模拟异常故障，查看hk2服务器，vip已经成功飘移过来

```bash
[root@hk2 ~]# ip a
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    inet 127.0.0.1/8 scope host lo
       valid_lft forever preferred_lft forever
    inet6 ::1/128 scope host 
       valid_lft forever preferred_lft forever
2: ens160: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc mq state UP group default qlen 1000
    link/ether 00:0c:29:17:68:2a brd ff:ff:ff:ff:ff:ff
    altname enp3s0
    inet 192.168.10.92/24 brd 192.168.10.255 scope global noprefixroute ens160
       valid_lft forever preferred_lft forever
    inet 192.168.10.90/24 scope global secondary ens160
       valid_lft forever preferred_lft forever
```

访问vip的8080端口，可正常提供服务

![](assets/10-Linux/614b9431cfe3834f9545.png)

# web界面使用
进入 web 管理界面之后，可以很清晰的看到分了 6 个菜单目录，分别是：Overview、Connections、Channels、Exchanges、Queues、Admin。

+ Overview：总览概述，主要介绍 rabbitmq 一些基础汇总等信息

![](assets/10-Linux/27fe052c815787185329.png)

+ Connections：连接池管理，主要介绍客户端连接等信息

![](assets/10-Linux/c81b5ee4fd938f97a9fa.png)

+ Channels：信道管理，主要介绍信道连接等信息

![](assets/10-Linux/1673e4b1cff1c7d41558.png)

点击具体某个具体的信道，可以看到对应的消费队列等信息。

![](assets/10-Linux/62eecfd822e50c84e8fb.png)

+ Exchanges：交换器管理，主要介绍交换器等信息

![](assets/10-Linux/3b3a4cf148953ae755a6.png)

+ Queues：队列管理，主要介绍队列等信息

![](assets/10-Linux/47aaa3459ac4e638ac59.png)

+ Admin：系统管理，主要介绍用户、虚拟主机、权限等信息

![](assets/10-Linux/36dbdc097b53e3e6569c.png)

下面，我们重点介绍一些如何通过 web 页面来操作 rabbitMQ！

## 交换器管理
点击进入 Exchanges 菜单，最下面有一个`Add a new exchange`标签。点击`Add a new exchange`，会展示如下信息！

![](assets/10-Linux/53cf2ce02052a929cb4a.png)

+ Name：交换器名称
+ Type：交换器类型
+ Durability：是否持久化，Durable：持久化，Transient：不持久化
+ Auto delete：是否自动删除，当最后一个绑定（队列或者exchange）被unbind之后，该exchange 自动被删除
+ Internal：是否是内部专用exchange，是的话，就意味着我们不能往该exchange里面发消息
+ Arguments：参数，是AMQP协议留给AMQP实现做扩展使用的

我们先新建一个名称为`test.exchange`，类型为`direct`的交换器，结果如下。

![](assets/10-Linux/3016a84caccd2cd4f328.png)

等会用于跟队列关联！

## 队列管理
点击进入 Queues 菜单，最下面也有一个`Add a new queue`标签。

点击标签，即可进入添加队列操作界面！

![](assets/10-Linux/e2eabb219b7893244c90.png)

+ Name：队列名称
+ Durability：是否持久化，Durable：持久化，Transient：不持久化
+ Auto delete：是否自动删除，是的话，当队列内容为空时，会自动删除队列
+ Arguments：参数，是AMQP协议留给AMQP实现做扩展使用的

同样的，新建一个名称为`test_queue`的消息队列，结果如下。

![](assets/10-Linux/b0168f2e74619f9ae51a.png)

队列新建好了之后，继续来建立绑定关系！

## 绑定管理
建立绑定关系，既可以从队列进入也可以从交换器进入。

如果是从交换器进入，那么被关联的对象就是队列。

![](assets/10-Linux/934a9e7490bff4670e39.png)

如果是从队列进入，那么被关联的对象就是交换器。

![](assets/10-Linux/7d9bf1bacfd94f7f7c8f.png)

我们选择从队列入手，被绑定的交换器是`test.exchange`。建立完成之后，在交换器那边也可以看到对应的绑定关系。

![](assets/10-Linux/b08165a5490a9c93a589.png)

## 发送消息
最后，我们从交换器入手，选择对应的交换器，点击`Publish message`标签，填写对应的路由键 key，发送一下数据，查看数据是否发送到对应的队列中。

![](assets/10-Linux/32d427473d2fb51dd693.png)

然后点击进入 Queues 菜单，查询消息队列基本情况。其中Ready表示待消费的消息数，total表示总消息数。

![](assets/10-Linux/12d6ad00f4224e2aa425.png)

## 接收消息
然后选择`hello-mq`消息队列，点击`Get messages`标签，获取队列中的消息。结果如下，可以很清晰的看到，消息写入到队列！

![](assets/10-Linux/d2c86f5846aa2964b882.png)

# rabbitmqctl命令
## 服务管理
```bash
rabbitmqctl stop [{pid_file}]
# 表示stop 在RabbitMQ服务器上运行的一个Erlang 节点，可以指定某一个 *pid_file*，表示会等待这个指定的程序结束

rabbitmqctl shutdown
# 表示终止RabbitMQ 服务器上的Erlang进程，如果终止失败，会返回非零数字

rabbitmqctl stop_app
# 表示终止RabbitMQ的应用，但是Erlang节点还在运行。该命令典型的运行在一些需要RabbitMQ应用被停止的管理行为之前，例如 reset

rabbitmqctl start_app
# 表示启动RabbitMQ的应用。该命令典型的运行在一些需要RabbitMQ应用被停止的管理行为之后，例如 reset

rabbitmqctl wait {pid_file}
# 表示等待RabbitMQ应用启动。该命令会等待指定的pid file被创建，也就是启动的进程对应的pid保存在这个文件中，然后RabbitMQ应用在这个进程中启动。如果该进程终止，没有启动RabbitMQ应用，就会返回错误。
# 合适的pid file是有rabbitmq-server 脚本创建的，默认保存在 Mnesia 目录下，可以通过修改 RABBITMQ_PID_FILE 环境变量来修改
# 例如 rabbitmqctl wait /var/run/rabbitmq/pid

rabbitmqctl reset
# 表示设置RabbitMQ节点为原始状态。会从该节点所属的cluster中都删除，从管理数据库中删除所有数据，例如配置的用户和vhost，还会删除所有的持久消息。
# 要想reset和force_reset操作执行成功，RabbitMQ应用需要处于停止状态，即执行过 stop_app

rabbitmqctl force_reset
# 表示强制性地设置RabbitMQ节点为原始状态。它和reset的区别在于，可以忽略目前管理数据库的状态和cluster的配置，无条件的reset。
# 该方法的使用，应当用在当数据库或者cluster配置损坏的情况下作为最后的方法。

rabbitmqctl rotate_logs {suffix}
# 表示将日志文件的内容追加到新的日志文件中去，这个新的日志文件的文件名是原有的日志文件名加上命令中的 suffix，并且恢复日志到原来位置的新文件中。
# 注意：如果新文件原先不存在，那么会新建一个；如果suffix为空，那么不会发生日志转移，只是重新打开了一次日志文件而已。

rabbitmqctl hipe_compile {directory}
# 表示在指定的目录下执行HiPE编译和缓存结果文件 .beam-files
# 如果需要父目录会被创建。并且在编译之前，该目录下的所有 .beam-files会被自动删除。
# 使用预编译的文件，你应该设置 RABBITMQ_SERVER_CODE_PATH 环境变量为 hipe_compile 调用指定的目录。
```

## 集群管理
```bash
rabbitmqctl join_cluster {clusternode} [--ram]
# 表示结合到指定的集群，如果有参数 --ram 表示作为RAM节点结合到该集群中。
# 该命令指令本节结合到指定的集群中，在结合之前，该节点需要reset，所以在使用时，需要格外注意。为了成功运行本命令，必须要停止RabbitMQ应用，例如 stop_app
# 集群节点有两种类型: disc 和 RAM。disc类型，复制数据在RAM和disc上，在节点失效的情况下，提供了冗余保证，也能从一些全局事件中恢复，例如所有节点失效。RAM类型，只复制数据在RAM上，主要表现在伸缩性上，特别是在管理资源（例如：增加删除队列，交换器，或者绑定）上表现突出。
# 一个集群必须至少含有一个disc节点，当通常都多余一个。通过该命令时，默认是设置为disc节点，如果需创建RAM节点，需要指定参数 --ram
# 执行此命令之后，在该节点上启动的RabbitMQ应用，在该节点挂掉之后，会尝试连接节点所在集群中的其他节点。
# 为了离开集群，可以 reset 该节点，也可以使用命令 forget_cluster_node 远程删除节点

rabbitmqctl cluster_status
# 表示显示通过节点类型聚合在一起的集群中的所有节点，还有目前正在运行的节点

rabbitmqctl change_cluster_node_type {disc|ram}
# 表示改变集群节点的类型。该操作的正确执行，必定会停止该节点。并且在调整一个node为ram类型时，该节点不能为该集群的唯一node

rabbitmqctl forget_cluster_node [--offline]
# 表示远程移除一个集群节点。要删除的节点必须脱机，如果没有脱机，需要使用 --offline 参数。当使用 --offline 参数时，rabbitmqctl不会去连接节点，而是暂时变成节点，以便进行变更。这在节点不能正常启动时非常有用。在这种情况下，节点会成为集群元数据的规范来源（例如哪些队列存在）。因此如果可以的话，应该使用此命令在最新的节点上关闭。
# --offline 参数使节点从脱机节点上移除。使用场景主要是在所有节点脱机，且最后一个节点无法联机时，从而防止整个集群启动。在其他情况不应该使用，否则会导致不一致。
# 例如 rabbitmqctl -n hare@mcnulty forget_cluster_node  rabbit@stringer
# 上述命令将从节点 hare@mcnulty 中移除节点 rabbit@stringer

rabbitmqctl rename_cluster_node {oldnode1} {newnode1} [oldnode2] [newnode2...]
# 表示在本地数据库上修改集群节点名称。该命令让rabbitmqctl暂时成为一个节点来做出做变更。因此，本地的待修改的集群节点一定要完全停止，其他节点可以是online或者offline

rabbitmqctl update_cluster_nodes {clusternode}
# 表示指示已经集群的节点在唤醒时联系 {clusternode} 进行集群。这与 join_cluster 命令不同，因为它不加入任何集群，它是检查节点是否已经在具有 {clusternode} 的集群中。
# 该命令的需求，是在当一个节点offline时，修改了集群节点的情形下。例如：节点A和B聚群，节点A offline了，节点C和B集群，并且B节点离开了该集群，那么当节点A起来的时候，A会尝试连接B，但是由于B节点已经不在该集群中，所以会失败。
# 通过 update_cluster_nodes -n A C 将会解决上述问题。

rabbitmqctl force_boot
# 表示强制确保节点启动，即使该节点并不是最后down的。
# 一般情况下，当你同时shut down了RabbitMQ集群时，第一个重启的节点应该是最后一个down掉的，因为它可能已经看到了其他节点发生的事情。但是有时候这并不可能：例如当整个集群lose power，那么该集群的所有节点会认为他们不是最后一个关闭的。
# 如果最后down的节点永久的lost，那么应该优先使用 rabbitmqctl forget_cluster_node --offline ，因为这将确保在丢失节点上的镜像队列得到优先处理。

rabbitmqctl sync_queue [-p vhost] {queue}
# {queue} 表示待同步的队列名称
# 指引含有异步slaves的镜像队列去同步自身。当队列执行同步化时，其将会被锁定（指所有publishers发送出去的和consumers获取到的队列都会被锁定）。为了成功执行此命令，队列必须要被镜像。
# 注意，排除消息的异步队列将最终被同步化，此命令主要运用于未被排除完全消息的队列。

rabbitmqctl cancel_sync_queue [-p vhost] {queue}
# 指引一个正在同步的镜像队列停止此操作。

rabbitmqctl purge_queue [-p vhost] {queue}
# {queue} 表示待清空消息的队列名称
# 该命令表示清空队列（即删除队列中的所有消息）

rabbitmqctl set_cluster_name {name}
# 设置集群的名称。在连接中，集群的名称被声明在客户端上，被同盟和插件用来记录一个消息所在的位置。集群的名称默认来自于集群中第一个节点的主机名，但是可以被修改。
```

## 用户管理
`rabbitmq`有一个默认的账号密码`guest`，但该情况仅限于本机localhost进行访问，所以需要添加一个远程登录的用户

用户管理命令

```plain
# 添加用户
rabbitmqctl add_user 用户名 密码

# 设置用户角色,分配操作权限
rabbitmqctl set_user_tags 用户名 角色

# 为用户添加资源权限(授予访问虚拟机根节点的所有权限)
rabbitmqctl set_permissions -p / 用户名 ".*" ".*" ".*"

# 修改密码
rabbitmqctl change_ password 用户名 新密码

# 删除用户
rabbitmqctl delete_user 用户名

# 查看用户清单
rabbitmqctl list_users
```

角色种类：

+ `administrator`：可以登录控制台、查看所有信息、并对rabbitmq进行管理
+ `monToring`：监控者；登录控制台，查看所有信息
+ `policymaker`：策略制定者；登录控制台指定策略
+ `managment`：普通管理员；登录控制

这里创建用户admin，密码CHANGE_ME，设置adminstator角色，赋予所有权限

```bash
[root@tiaoban ~]# rabbitmqctl add_user admin CHANGE_ME
Adding user "admin" ...
Done. Dont forget to grant the user permissions to some virtual hosts! See 'rabbitmqctl help set_permissions' to learn more.
[root@tiaoban ~]# rabbitmqctl set_user_tags admin administrator
Setting tags for user "admin" to [administrator] ...
[root@tiaoban ~]# rabbitmqctl set_permissions -p / admin ".*" ".*" ".*"
Setting permissions for user "admin" in vhost "/" ...
```

## 访问控制
```bash
rabbitmqctl add_vhost {vhost}
# ｛vhost｝ 表示待创建的虚拟主机项的名称

rabbitmqctl delete_vhost {vhost}
# 表示删除一个vhost。删除一个vhost将会删除该vhost的所有exchange、queue、binding、用户权限、参数和策略。

rabbitmqctl list_vhosts {vhostinfoitem ...}
# 表示列出所有的vhost。其中 {vhostinfoitem} 表示要展示的vhost的字段信息，展示的结果将按照 {vhostinfoitem} 指定的字段顺序展示。这些字段包括： name（名称） 和 tracing （是否为此vhost启动跟踪）。
# 如果没有指定具体的字段项，那么将展示vhost的名称。

rabbitmqctl set_permissions [-p vhost] {user} {conf} {write} {read}
# 表示设置用户权限。 {vhost} 表示待授权用户访问的vhost名称，默认为 "/"； {user} 表示待授权反问特定vhost的用户名称； {conf}表示待授权用户的配置权限，是一个匹配资源名称的正则表达式； {write} 表示待授权用户的写权限，是一个匹配资源名称的正则表达式； {read}表示待授权用户的读权限，是一个资源名称的正则表达式。
# rabbitmqctl set_permissions -p myvhost tonyg "^tonyg-.*" ".*" ".*"
# 例如上面例子，表示授权给用户 "tonyg" 在vhost为 `myvhost` 下有资源名称以 "tonyg-" 开头的 配置权限；所有资源的写权限和读权限。

rabbitmqctl clear_permissions [-p vhost] {username}
# 表示设置用户拒绝访问指定指定的vhost，vhost默认值为 "/"

rabbitmqctl list_permissions [-p vhost]
# 表示列出具有权限访问指定vhost的所有用户、对vhost中的资源具有的操作权限。默认vhost为 "/"。
# 注意，空字符串表示没有任何权限。

rabbitmqctl list_user_permissions {username}
# 表示列出指定用户的权限vhost，和在该vhost上的资源可操作权限。
```


