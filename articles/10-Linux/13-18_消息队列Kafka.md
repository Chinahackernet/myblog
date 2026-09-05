# 消息队列Kafka

> 分类：Linux / 第13章：服务部署
> 原文：https://www.cuiliangblog.cn/detail/section/201687574
> 来源：崔亮的博客

---

# kafka介绍
## 什么是 Kafka
Kafka 是由 `Linkedin` 公司开发的，它是一个分布式的，支持多分区、多副本的分布式消息流平台，它同时也是一款开源的基于发布订阅模式的消息引擎系统。

## Kafka 的基本术语
+  消息 (Message)  ：Kafka 中的数据单元被称为`消息`，也被称为记录，可以把它看作数据库表中某一行的记录。
+  批次 (Batch)  ：为了提高效率， 消息会`分批次`写入 Kafka，批次就代指的是一组消息。
+  主题 (Topic)  ：消息的种类称为 `主题`（Topic）,可以说一个主题代表了一类消息。相当于是对消息进行分类。主题就像是数据库中的表。
+  分区 (Partition)  ：主题可以被分为若干个分区（partition），同一个主题中的分区可以不在一个机器上，有可能会部署在多个机器上，由此来实现 kafka 的`伸缩性`，单一主题中的分区有序，但是无法保证主题中所有的分区有序

![](assets/10-Linux/ff4fdbda8c2b0a2b3dc4.png)

+  生产者 (Producer)  ：向主题发布消息的客户端应用程序称为`生产者`（Producer），生产者用于持续不断的向某个主题发送消息。
+  消费者 (Consumer)  ：订阅主题消息的客户端程序称为`消费者`（Consumer），消费者用于处理生产者产生的消息。
+  消费者组 (Consumer Group)  ：生产者与消费者的关系就如同餐厅中的厨师和顾客之间的关系一样，一个厨师对应多个顾客，也就是一个生产者对应多个消费者，`消费者群组`（Consumer Group）指的就是由一个或多个消费者组成的群体。

![](assets/10-Linux/a734f9e2ac740c9cd370.jpeg)

+ 偏移量 (Offset) ：是一种元数据，它是一个不断递增的整数值，用来记录消费者发生重平衡时的位置，以便用来恢复数据。
+ 节点（ broker）: 一个独立的 Kafka 服务器就被称为 `broker`，broker 接收来自生产者的消息，为消息设置偏移量，并提交消息到磁盘保存。broker 集群：broker 是`集群` 的组成部分，broker 集群由一个或多个 broker 组成，每个集群都有一个 broker 同时充当了`集群控制器`的角色（自动从集群的活跃成员中选举出来）。
+ 副本 (Replica)  ：Kafka 中消息的备份又叫做 `副本`（Replica），副本的数量是可以配置的，Kafka 定义了两类副本：领导者副本（Leader Replica） 和 追随者副本（Follower Replica），前者对外提供服务，后者只是被动跟随。
+ 重平衡（Rebalance）。消费者组内某个消费者实例挂掉后，其他消费者实例自动重新分配订阅主题分区的过程。Rebalance 是 Kafka 消费者端实现高可用的重要手段。

## Kafka 的特性
`高吞吐、低延迟`：kakfa 最大的特点就是收发消息非常快，kafka 每秒可以处理几十万条消息，它的最低延迟只有几毫秒。

`高伸缩性`：每个主题(topic) 包含多个分区(partition)，主题中的分区可以分布在不同的主机(broker)中。

`持久性、可靠性`：Kafka 能够允许数据的持久化存储，消息被持久化到磁盘，并支持数据备份防止数据丢失，Kafka 底层的数据存储是基于 Zookeeper 存储的，Zookeeper 我们知道它的数据能够持久存储。

`容错性`：允许集群中的节点失败，某个节点宕机，Kafka 集群能够正常工作

`高并发`：支持数千个客户端同时读写

## Kafka 的使用场景
活动跟踪：Kafka 可以用来跟踪用户行为，比如我们经常回去淘宝购物，你打开淘宝的那一刻，你的登陆信息，登陆次数都会作为消息传输到 Kafka ，当你浏览购物的时候，你的浏览信息，你的搜索指数，你的购物爱好都会作为一个个消息传递给 Kafka ，这样就可以生成报告，可以做智能推荐，购买喜好等。

传递消息：Kafka 另外一个基本用途是传递消息，应用程序向用户发送通知就是通过传递消息来实现的，这些应用组件可以生成消息，而不需要关心消息的格式，也不需要关心消息是如何发送的。

度量指标：Kafka也经常用来记录运营监控数据。包括收集各种分布式应用的数据，生产各种操作的集中反馈，比如报警和报告。

日志记录：Kafka 的基本概念来源于提交日志，比如我们可以把数据库的更新发送到 Kafka 上，用来记录数据库的更新时间，通过kafka以统一接口服务的方式开放给各种consumer，例如hadoop、Hbase、Solr等。

流式处理：流式处理是有一个能够提供多种应用程序的领域。

限流削峰：Kafka 多用于互联网领域某一时刻请求特别多的情况下，可以把请求写入Kafka 中，避免直接请求后端程序导致服务崩溃。

## Kafka 系统架构
![](assets/10-Linux/4f4e61b347dce9115914.jpeg)

如上图所示，一个典型的 Kafka 集群中包含若干Producer（可以是web前端产生的Page View，或者是服务器日志，系统CPU、Memory等），若干broker（Kafka支持水平扩展，一般broker数量越多，集群吞吐率越高），若干Consumer Group，以及一个Zookeeper集群。Kafka通过Zookeeper管理集群配置，选举leader，以及在Consumer Group发生变化时进行rebalance。Producer使用push模式将消息发布到broker，Consumer使用pull模式从broker订阅并消费消息。

## 核心 API
Kafka 有四个核心API，它们分别是

+ Producer API，它允许应用程序向一个或多个 topics 上发送消息记录
+ Consumer API，允许应用程序订阅一个或多个 topics 并处理为其生成的记录流
+ Streams API，它允许应用程序作为流处理器，从一个或多个主题中消费输入流并为其生成输出流，有效的将输入流转换为输出流。
+ Connector API，它允许构建和运行将 Kafka 主题连接到现有应用程序或数据系统的可用生产者和消费者。例如，关系数据库的连接器可能会捕获对表的所有更改

![](assets/10-Linux/3ebc952ec39a52c99aae.jpeg)

## Kafka 为何快
Kafka 实现了`零拷贝`原理来快速移动数据，避免了内核之间的切换。Kafka 可以将数据记录分批发送，从生产者到文件系统（Kafka 主题日志）到消费者，可以端到端的查看这些批次的数据。

批处理能够进行更有效的数据压缩并减少 I/O 延迟，Kafka 采取顺序写入磁盘的方式，避免了随机磁盘寻址的浪费，更多关于磁盘寻址的了解，请参阅 [程序员需要了解的硬核知识之磁盘](https://cloud.tencent.com/developer/tools/blog-entry?target=https%3A%2F%2Fmp.weixin.qq.com%2Fs%3F__biz%3DMzU2NDg0OTgyMA%3D%3D%26mid%3D2247484654%26idx%3D1%26sn%3D9b6f5aaad05a49416e8f30e6b86691ae%26chksm%3Dfc45f91dcb32700b683b9a13d0d94d261171d346333d73967a4d501de3ecc273d67e8251aeae%26token%3D674527772%26lang%3Dzh_CN%26scene%3D21%23wechat_redirect&objectId=1547380&objectType=1&isNewArticle=undefined) 。

总结一下其实就是四个要点

+ 顺序读写
+ 零拷贝
+ 消息压缩
+ 分批发送

# KRaft模式介绍
## 架构介绍
Kafka的KRaft模式是一种新的元数据管理方式，旨在去除对ZooKeeper的依赖，使Kafka成为一个完全自包含的系统。在Kafka的传统模式下，元数据管理依赖于ZooKeeper，这增加了部署和运维的复杂性。为了解决这个问题，Kafka社区引入了KRaft模式。在KRaft模式下，所有的元数据，包括主题、分区信息、副本位置等，都被存储在Kafka集群内部的特殊日志中。这个日志使用Raft协议来保证一致性。

![](assets/10-Linux/200b8b786938aea9e8fb.png)

在传统架构中，Kafka集群包含多个 Broker 节点和一个ZooKeeper 集群。Kafka 集群的 Controller 在被选中后，会从 ZooKeeper 中加载它的状态。并且通知其他Broker发生变更，如 Leaderanddis r和 Updatemetdata 请求。

在新的架构中，三个 Controller 节点替代三个ZooKeeper节点。Controller节点和 Broker 节点运行在不同的进程中。Controller 节点中会选举出一个 Leader 角色。并且Leader 不会主动向 Broker 推送更新，而是由 Broker 拉取元数据信息。

注意：Controller 进程与 Broker 进程在逻辑上是分离的，同时允许部分或所有 Controller 进程和 Broker 进程是同一个进程，即一个Broker节点即是Broker也是Controller。

## 优点
简化部署：不再需要单独部署和维护ZooKeeper集群，降低了运维复杂性和成本。

一致性和可靠性：Raft协议提供了强一致性保证，确保元数据在多个节点之间的一致复制，提高了系统的可靠性。

高可用性：通过控制节点的多数共识机制，在少数节点故障的情况下仍能保证集群的正常运行。

性能优化：减少了Kafka与ZooKeeper之间的通信开销，可能带来性能上的提升。

# 集群部署
## 集群规划
一般模式下，元数据在 zookeeper 中，运行时动态选举 controller，由controller 进行 Kafka [集群管理](https://so.csdn.net/so/search?q=%E9%9B%86%E7%BE%A4%E7%AE%A1%E7%90%86&spm=1001.2101.3001.7020)。kraft 模式架构下，不再依赖 zookeeper 集群，而是用三台 controller 节点代替 zookeeper，元数据保存在 controller 中，由 controller 直接进行 Kafka 集群管理。

| ip | 主机名 | 角色 | node id |
| --- | --- | --- | --- |
| 192.168.10.31 | kafka-1 | Broker，Controller | 1 |
| 192.168.10.32 | kafka-2 | Broker，Controller | 2 |
| 192.168.10.33 | kafka-3 | Broker，Controller | 3 |


## 准备工作
> 以下操作在所有 kafka 节点执行
>

1. 下载软件包

下载地址：[https://kafka.apache.org/downloads](https://kafka.apache.org/downloads)

```bash
root@kafka-1:~# wget https://dlcdn.apache.org/kafka/3.9.0/kafka_2.13-3.9.0.tgz
```

2. 解压

```bash
root@kafka-1:~# tar -zxf kafka_2.13-3.9.0.tgz
root@kafka-1:~# mv kafka_2.13-3.9.0 /opt/kafka
root@kafka-1:~# cd /opt/kafka/
root@kafka-1:/opt/kafka# ls
bin  config  libs  LICENSE  licenses  NOTICE  site-docs
```

3. 安装 java 环境

```bash
root@kafka-1:/opt/kafka# apt install openjdk-21-jdk -y
root@kafka-1:/opt/kafka# java -version
openjdk version "21.0.5" 2024-10-15
OpenJDK Runtime Environment (build 21.0.5+11-Ubuntu-1ubuntu120.04)
OpenJDK 64-Bit Server VM (build 21.0.5+11-Ubuntu-1ubuntu120.04, mixed mode, sharing)
```

4. 创建 kafka 数据目录

```bash
root@kafka-1:/opt/kafka# mkdir -p /data/kafka/
```

## 修改配置文件
kafka 侦听器类型

```bash
PLAINTEXT：用于不加密的普通通信。 listeners=PLAINTEXT://:9092
SSL：用于加密通信，确保数据传输的安全性。 listeners=SSL://:9093
SASL_PLAINTEXT：在不加密的基础上，添加身份验证机制。listeners=SASL_PLAINTEXT://:9094
SASL_SSL：结合加密和身份验证，确保通信的机密性和完整性。listeners=SASL_SSL://:9095
CONTROLLER：用于 Kafka 集群控制器进行内部通信，管理 Broker 状态。listeners=CONTROLLER://:9096
EXTERNAL：专为外部客户端访问设计，通常用于跨网络的通信。listeners=EXTERNAL://:9097
```

### kafka-1 配置
```bash
root@kafka-1:/opt/kafka# vim /opt/kafka/config/kraft/server.properties
# 节点ID，集群内唯一
node.id=1 
# 集群地址信息
controller.quorum.voters=1@192.168.10.31:9093,2@192.168.10.32:9093,3@192.168.10.33:9093
# 侦听器名称、主机名和代理将向客户端公布的端口.(broker 对外暴露的地址)
advertised.listeners=PLAINTEXT://192.168.10.31:9092,CONTROLLER://192.168.10.31:9093
# kafka数据目录
log.dirs=/data/kafka
```

### kafka-2 配置
```bash
root@kafka-2:/opt/kafka# vim config/kraft/server.properties
# 节点ID，集群内唯一
node.id=2
# 集群地址信息
controller.quorum.voters=1@192.168.10.31:9093,2@192.168.10.32:9093,3@192.168.10.33:9093
# 侦听器名称、主机名和代理将向客户端公布的端口.(broker 对外暴露的地址)
advertised.listeners=PLAINTEXT://192.168.10.32:9092,CONTROLLER://192.168.10.32:9093
# kafka数据目录
log.dirs=/data/kafka
```

### kafka-3 配置
```bash
root@kafka-3:/opt/kafka# vim config/kraft/server.properties
# 节点ID，集群内唯一
node.id=3
# 集群地址信息
controller.quorum.voters=1@192.168.10.31:9093,2@192.168.10.32:9093,3@192.168.10.33:9093
# 侦听器名称、主机名和代理将向客户端公布的端口.(broker 对外暴露的地址)
advertised.listeners=PLAINTEXT://192.168.10.33:9092,CONTROLLER://192.168.10.33:9093
# kafka数据目录
log.dirs=/data/kafka
```

## 初始化集群
生成存储目录唯一ID

```bash
root@kafka-1:/opt/kafka# bin/kafka-storage.sh random-uuid
1pW25KKcSUmTTXCS8H3qsQ
```

格式化 kafka 存储目录（每个节点都需要执行）

```bash
root@kafka-1:/opt/kafka# bin/kafka-storage.sh format -t 1pW25KKcSUmTTXCS8H3qsQ -c /opt/kafka/config/kraft/server.properties
Formatting metadata directory /tmp/kraft-combined-logs with metadata.version 3.9-IV0.
```

## 启动集群
每个节点都执行启动服务命令

```bash
root@kafka-1:/opt/kafka# /opt/kafka/bin/kafka-server-start.sh -daemon /opt/kafka/config/kraft/server.properties
```

查看服务日志

```bash
root@kafka-1:/opt/kafka# tail -f /opt/kafka/logs/server.log
```

## 集群验证
查看 kafka 节点状态

```bash
root@kafka-1:/opt/kafka# bin/kafka-broker-api-versions.sh --bootstrap-server 127.0.0.1:9092
```

查看 topic 信息

```bash
root@kafka-1:/opt/kafka# bin/kafka-topics.sh --bootstrap-server 127.0.0.1:9092 --list
```

## systemd 管理服务
1. 创建服务文件

```bash
root@kafka-1:/opt/kafka# vim /etc/systemd/system/kafka.service
[Unit]
Description=Apache Kafka server (KRaft mode)
Documentation=https://kafka.apache.org/documentation/
After=network.target

[Service]
Type=simple
User=root
Group=root
ExecStart=/opt/kafka/bin/kafka-server-start.sh /opt/kafka/config/kraft/server.properties
ExecStop=/opt/kafka/bin/kafka-server-stop.sh
Restart=on-failure

# 设置 JMX 配置（可选）
Environment=KAFKA_OPTS="-Djava.rmi.server.hostname=192.168.10.31 -Dcom.sun.management.jmxremote.port=9997 -Dcom.sun.management.jmxremote.rmi.port=9997 -Dcom.sun.management.jmxremote. -Dcom.sun.management.jmxremote.authenticate=false -Dcom.sun.management.jmxremote.ssl=false"

# 设置 Kafka 日志输出（可选）
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=kafka

[Install]
WantedBy=multi-user.target
```

2. 重新启动 kafka 服务

```bash
root@kafka-1:~# systemctl daemon-reload 
root@kafka-1:~# systemctl enable kafka
Created symlink /etc/systemd/system/multi-user.target.wants/kafka.service → /etc/systemd/system/kafka.service.
root@kafka-1:~# systemctl restart kafka
root@kafka-1:~# systemctl status kafka
```

# 部署Kafka-ui
Kraft 模式的 kafka 集群管理工具推荐使用 kafka-ui。

## 下载 jar 包
下载地址：[https://github.com/provectus/kafka-ui/releases](https://github.com/provectus/kafka-ui/releases)

```bash
root@kafka-1:~# mkdir /opt/kafka-ui
root@kafka-1:~# cd /opt/kafka-ui/
root@kafka-1:/opt/kafka-ui# wget https://github.com/provectus/kafka-ui/releases/download/v0.7.2/kafka-ui-api-v0.7.2.jar
root@kafka-1:/opt/kafka-ui# ls
kafka-ui-api-v0.7.2.jar
```

## 创建配置文件
```bash
root@kafka-1:/opt/kafka-ui# cat > config.yml << EOF
kafka:
  clusters:
    -
      name: kafka-cluster
      bootstrapServers: http://192.168.10.31:9092,http://192.168.10.32:9092,http://192.168.10.33:9092
      metrics:
        port: 9997
        type: JMX
EOF
```

配置文件具体可参考样例配置：[https://github.com/provectus/kafka-ui/blob/master/documentation/compose/kafka-ui.yaml](https://github.com/provectus/kafka-ui/blob/master/documentation/compose/kafka-ui.yaml)。

需要注意的是样例文件为环境变量导入配置，如果需要转为配置文件，可使用此工具：[https://env.simplestep.ca/](https://env.simplestep.ca/)进行转换。

## 启动服务
```bash
root@kafka-1:/opt/kafka-ui# nohup java -Dspring.config.additional-location=/opt/kafka-ui/config.yml -jar /opt/kafka-ui/kafka-ui-api-v0.7.2.jar &
```

## 访问验证
![](assets/10-Linux/b6c3cf6c850a5fe76ac6.png)

## 使用 systemd 管理服务
```bash
root@kafka-1:/opt/kafka-ui# vim /etc/systemd/system/kafka-ui.service
[Unit]
Description=Kafka UI Service
After=network.target

[Service]
ExecStart=/usr/lib/jvm/java-21-openjdk-amd64/bin/java -Dspring.config.additional-location=/opt/kafka-ui/config.yml -jar /opt/kafka-ui/kafka-ui-api-v0.7.2.jar
User=root
Group=root
WorkingDirectory=/opt/kafka-ui
Restart=always
Environment=JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64  # 根据实际环境设置 JAVA_HOME
Environment=PATH=$PATH:/usr/lib/jvm/java-21-openjdk-amd64/bin

[Install]
WantedBy=multi-user.target
root@kafka-1:/opt/kafka-ui# systemctl daemon-reload 
root@kafka-1:/opt/kafka-ui# systemctl enable kafka-ui
root@kafka-1:/opt/kafka-ui# systemctl restart kafka-ui
```

# Kafka基本使用
## 查看Broker情况
```bash
root@kafka-1:/opt/kafka# bin/kafka-broker-api-versions.sh --bootstrap-server 127.0.0.1:9092
192.168.10.32:9092 (id: 2 rack: null) -> (
        ……
)
192.168.10.33:9092 (id: 3 rack: null) -> (
        ……
)
192.168.10.31:9092 (id: 1 rack: null) -> (
        ……
)
```

## 测试创建topic
```bash
root@kafka-1:/opt/kafka# bin/kafka-topics.sh --create --topic test --partitions 3 --replication-factor 2 --bootstrap-server 127.0.0.1:9092
Created topic test.
```

## 查看topic 的情况
```bash
root@kafka-1:/opt/kafka# bin/kafka-topics.sh --describe --bootstrap-server 127.0.0.1:9092
Topic: test     TopicId: SOYQa_56REWM9mt1vdmj7Q PartitionCount: 3       ReplicationFactor: 2    Configs: segment.bytes=1073741824
        Topic: test     Partition: 0    Leader: 2       Replicas: 2,3   Isr: 2,3        Elr:    LastKnownElr: 
        Topic: test     Partition: 1    Leader: 3       Replicas: 3,1   Isr: 3,1        Elr:    LastKnownElr:
        Topic: test     Partition: 2    Leader: 1       Replicas: 1,2   Isr: 1,2        Elr:    LastKnownElr:
```

## 生产者发送消息
```bash
root@kafka-1:/opt/kafka# bin/kafka-console-producer.sh --broker-list 127.0.0.1:9092 --topic test
>hello kafka
```

## 消费者消费消息
```bash
root@kafka-1:/opt/kafka# bin/kafka-console-consumer.sh --bootstrap-server 127.0.0.1:9092 --topic test
hello kafka
```

## 删除 topic
```bash
root@kafka-1:/opt/kafka# bin/kafka-topics.sh --bootstrap-server 127.0.0.1:9092 --delete --topic test
```

# TLS加密
## 准备证书
> 仅在其中一个节点操作既可。
>

```bash
root@kafka-1:/opt/kafka# mkdir /opt/kafka/pki
root@kafka-1:/opt/kafka# cd /opt/kafka/pki/
# 生成 CA 证书
root@kafka-1:/opt/kafka/pki# openssl req -x509 -nodes -days 3650 -newkey rsa:4096 -keyout ca.key -out ca.crt -subj "/CN=Kafka-CA"
Generating a RSA private key
...................................................++++
..................................................................................................................................................++++
writing new private key to 'ca.key'
# 生成私钥
root@kafka-1:/opt/kafka/pki# openssl genrsa -out kafka.key 4096
Generating RSA private key, 4096 bit long modulus (2 primes)
..............................................................................................................++++
........................................++++
e is 65537 (0x010001)
# 生成证书签名请求 (CSR)
root@kafka-1:/opt/kafka/pki# openssl req -new -key kafka.key -out kafka.csr -subj "/CN=kafka-cluster"
# 创建包含所有节点的SAN 配置文件
root@kafka-1:/opt/kafka/pki# cat > san.cnf << EOF
[ req ]
distinguished_name = req_distinguished_name
req_extensions = req_ext
prompt = no

[ req_distinguished_name ]
CN = kafka-cluster

[ req_ext ]
keyUsage = critical, digitalSignature, keyEncipherment
extendedKeyUsage = serverAuth, clientAuth
subjectAltName = @alt_names

[ alt_names ]
# 节点主机名与ip
DNS.1 = kafka-1
DNS.2 = kafka-2
DNS.3 = kafka-3
IP.1 = 192.168.10.31
IP.2 = 192.168.10.32
IP.3 = 192.168.10.33
EOF
# 签署证书
root@kafka-1:/opt/kafka/pki# openssl x509 -req -in kafka.csr -CA ca.crt -CAkey ca.key -CAcreateserial -out kafka.crt \
  -days 3650 -extfile san.cnf -extensions req_ext
Signature ok
subject=CN = kafka-cluster
Getting CA Private Key
# 验证证书
root@kafka-1:/opt/kafka/pki# openssl x509 -in kafka.crt -text -noout | grep -A 1 "Subject Alternative Name"
            X509v3 Subject Alternative Name: 
                DNS:kafka-1, DNS:kafka-2, DNS:kafka-3, IP Address:192.168.10.31, IP Address:192.168.10.32, IP Address:192.168.10.33
root@kafka-1:/opt/kafka/pki# ls -l
total 28
-rw-r--r-- 1 root root 1805 Jan 15 17:54 ca.crt
-rw------- 1 root root 3272 Jan 15 17:54 ca.key
-rw-r--r-- 1 root root   41 Jan 15 17:54 ca.srl
-rw-r--r-- 1 root root 1777 Jan 15 17:54 kafka.crt
-rw-r--r-- 1 root root 1590 Jan 15 17:49 kafka.csr
-rw------- 1 root root 3247 Jan 15 17:49 kafka.key
-rw-r--r-- 1 root root  259 Jan 15 17:51 san.cnf
```

## 创建 Keystore
将证书和私钥转换为 PKCS12 文件

```bash
root@kafka-1:/opt/kafka/pki# openssl pkcs12 -export -in kafka.crt -inkey kafka.key -out kafka.p12 -name kafka-cert -CAfile ca.crt -caname root -passout pass:CHANGE_ME
```

使用 `keytool` 将 `kafka.p12` 文件导入到 Keystore：

```bash
root@kafka-1:/opt/kafka/pki# keytool -importkeystore \
  -deststorepass CHANGE_ME \
  -destkeypass CHANGE_ME\
  -destkeystore kafka.keystore.jks \
  -srckeystore kafka.p12 \
  -srcstoretype PKCS12 \
  -srcstorepass CHANGE_ME \
  -alias kafka-cert
Importing keystore kafka.p12 to kafka.keystore.jks...
root@kafka-1:/opt/kafka/pki# ls -l
total 44
-rw-r--r-- 1 root root 1805 Jan 15 18:56 ca.crt
-rw------- 1 root root 3272 Jan 15 18:56 ca.key
-rw-r--r-- 1 root root   41 Jan 15 18:57 ca.srl
-rw-r--r-- 1 root root 1777 Jan 15 18:57 kafka.crt
-rw-r--r-- 1 root root 1590 Jan 15 18:57 kafka.csr
-rw------- 1 root root 3243 Jan 15 18:57 kafka.key
-rw-r--r-- 1 root root 4288 Jan 15 18:58 kafka.keystore.jks
-rw------- 1 root root 4098 Jan 15 18:58 kafka.p12
-rw-r--r-- 1 root root  303 Jan 15 18:57 san.cnf
```

## 创建 Truststore
 使用 `keytool` 创建 Truststore 并导入 CA 证书：  

```bash
root@kafka-1:/opt/kafka/pki# keytool -import \
  -file ca.crt \
  -keystore kafka.truststore.jks \
  -storepass CHANGE_ME \
  -alias root
Trust this certificate? [no]:  yes
Certificate was added to keystore
root@kafka-1:/opt/kafka/pki# ls -l
total 48
-rw-r--r-- 1 root root 1805 Jan 15 18:56 ca.crt
-rw------- 1 root root 3272 Jan 15 18:56 ca.key
-rw-r--r-- 1 root root   41 Jan 15 18:57 ca.srl
-rw-r--r-- 1 root root 1777 Jan 15 18:57 kafka.crt
-rw-r--r-- 1 root root 1590 Jan 15 18:57 kafka.csr
-rw------- 1 root root 3243 Jan 15 18:57 kafka.key
-rw-r--r-- 1 root root 4288 Jan 15 18:58 kafka.keystore.jks
-rw------- 1 root root 4098 Jan 15 18:58 kafka.p12
-rw-r--r-- 1 root root 1654 Jan 15 18:58 kafka.truststore.jks
-rw-r--r-- 1 root root  303 Jan 15 18:57 san.cnf
```

## 分发文件
将kafka.truststore.jks 和kafka.keystore.jks 文件分发到其他 kafka 节点

```bash
root@kafka-1:/opt/kafka/pki# scp kafka.truststore.jks 192.168.10.32:/opt/kafka/pki/
root@kafka-1:/opt/kafka/pki# scp kafka.keystore.jks  192.168.10.32:/opt/kafka/pki/
root@kafka-1:/opt/kafka/pki# scp kafka.truststore.jks 192.168.10.33:/opt/kafka/pki/
root@kafka-1:/opt/kafka/pki# scp kafka.keystore.jks  192.168.10.33:/opt/kafka/pki/
```

## Kafka服务端配置 TLS
在 Kafka KRaft 模式下的 `server.properties` 文件中，添加以下配置：

```bash
root@kafka-1:/opt/kafka/pki# vim /opt/kafka/config/kraft/server.properties
# 修改SSL配置
listeners=SSL://:9092,CONTROLLER://:9093
inter.broker.listener.name=SSL
advertised.listeners=SSL://192.168.10.31:9092,CONTROLLER://192.168.10.31:9093

# 新增Keystore配置
ssl.keystore.location=/opt/kafka/pki/kafka.keystore.jks
ssl.keystore.password= CHANGE_ME
ssl.key.password= CHANGE_ME
# 新增Truststore配置
ssl.truststore.location=/opt/kafka/pki/kafka.truststore.jks
ssl.truststore.password= CHANGE_ME
# 客户端连接时启用ssl
ssl.client.auth=required
```

重启 kafka

```bash
root@kafka-1:/opt/kafka/pki# systemctl restart kafka
```

## 客户端配置 TLS
创建客户端配置文件，指定证书信息 admin.properties文件内容如下：

```bash
root@kafka-1:/opt/kafka# cat > /opt/kafka/config/admin.properties << EOF
security.protocol=SSL
ssl.keystore.location=/opt/kafka/pki/kafka.keystore.jks
ssl.keystore.password= CHANGE_ME
ssl.truststore.location=/opt/kafka/pki/kafka.truststore.jks
ssl.truststore.password= CHANGE_ME
ssl.endpoint.identification.algorithm=
ssl.key.password= CHANGE_ME
EOF
```

连接 kafka 集群测试

```bash
# 查看节点信息
root@kafka-1:/opt/kafka# bin/kafka-broker-api-versions.sh --bootstrap-server 192.168.10.31:9092 --command-config /opt/kafka/config/admin.properties 
192.168.10.32:9092 (id: 2 rack: null) -> (
……
)
192.168.10.31:9092 (id: 1 rack: null) -> (
……
)
192.168.10.33:9092 (id: 3 rack: null) -> (
……
)
# 查看topic信息
root@kafka-1:/opt/kafka# bin/kafka-topics.sh --describe --bootstrap-server 192.168.10.31:9092 --command-config /opt/kafka/config/admin.properties
Topic: test     TopicId: RhzPTC_eRL-etwrn3p5z-g PartitionCount: 3       ReplicationFactor: 2    Configs: segment.bytes=1073741824
        Topic: test     Partition: 0    Leader: 3       Replicas: 3,1   Isr: 3,1        Elr:    LastKnownElr: 
        Topic: test     Partition: 1    Leader: 1       Replicas: 1,2   Isr: 1,2        Elr:    LastKnownElr:
        Topic: test     Partition: 2    Leader: 2       Replicas: 2,3   Isr: 3,2        Elr:    LastKnownElr:
```

生产消费消息测试

```bash
# 生产者发送消息
root@kafka-2:/opt/kafka# bin/kafka-console-producer.sh --bootstrap-server 192.168.10.31:9092 --topic test --producer.config /opt/kafka/config/admin.properties
>hello tls
# 消费者接收消息
root@kafka-3:/opt/kafka# bin/kafka-console-consumer.sh --bootstrap-server 192.168.10.31:9092 --topic test --from-beginning --consumer.config /opt/kafka/config/admin.properties
hello tls
```

## kafka-ui 配置 TLS
修改 kafka-ui 配置文件

```bash
root@kafka-1:/opt/kafka-ui# cat > config.yml << EOF
kafka:
  clusters:
    -
      name: kafka-cluster
      bootstrapServers: 192.168.10.31:9092,192.168.10.32:9092,192.168.10.33:9092
      metrics:
        port: 9997
        type: JMX
      properties:
        security:
          protocol: SSL
        ssl:
          keystore:
            location: /opt/kafka/pki/kafka.keystore.jks
            password: CHANGE_ME
        ssl_endpoint_identification_algorithm: ''
      ssl:
        truststorelocation: /opt/kafka/pki/kafka.truststore.jks
        truststorepassword: CHANGE_ME
EOF
```

重启 kafka-ui 并验证

```bash
root@kafka-1:/opt/kafka-ui# systemctl restart kafka-ui
```

# PLAIN认证
在Kafka中，SASL（Simple Authentication and Security Layer）机制包括三种常见的身份验证方式：

1. SASL/PLAIN认证：含义是简单身份验证和授权层应用程序接口，PLAIN认证是其中一种最简单的用户名、密码认证方式，生产环境使用维护简单易用。可用于Kafka和其他应用程序之间的认证。
2. SASL/SCRAM认证：SCRAM-SHA-256、SCRAM-SHA-512方式认证，本认证需要客户端、服务器共同协同完成认证过程，使用和维护上较为复杂。优势是可动态增加用户，而不必重启kafka组件服务端。
3. SASL/GSSAPI 认证：Kerberos认证，本认证适用于大型公司企业生产环境，通常结合Kerberos协议使用。使用Kerberos认证可集成目录服务，比如AD。通过本认证机制可实现优秀的安全性和良好的用户体验。

## 创建Kraft账号密码认证文件
> 以下操作在所有节点执行。
>

创建两个用户，分别为admin、test（此处仅用于演示，实际生产环境建议按业务创建多个不同的账号，并配置对指定 topic 的读写权限）

```bash
root@kafka-1:~
KafkaServer {
  org.apache.kafka.common.security.plain.PlainLoginModule required
    username="admin"
    password="password"
    user_admin="password"
    user_test="test";
};
EOF
```

该配置通过org.apache.org.apache.kafka.common.security.plain.PlainLoginModule由指定采用PLAIN机制，定义了用户。

usemame和password指定该代理与集群其他代理初始化连接的用户名和密码

suer_admin="password",这个表示一个用户名为admin用户，密码是password，这个必须要有一个，且要这一个跟上面的username和password保持一致。

user_test="test" 是第二个用户，表示的是用户名为test的账户，密码为test。

## 修改 kafka 配置文件
 Kafka broker 的 `server.properties` 配置文件，来启用 SASL/PLAIN 认证。以下是需要配置的参数

```bash
root@kafka-1:~# vim /opt/kafka/config/kraft/server.properties
# 修改以下配置
listeners=SASL_SSL://:9092,CONTROLLER://:9093
inter.broker.listener.name=SASL_SSL
advertised.listeners=SASL_SSL://192.168.10.31:9092,CONTROLLER://192.168.10.31:9093
# 节点间CONTROLLER映射为SASL_PLAINTEXT认证
listener.security.protocol.map=CONTROLLER:SASL_PLAINTEXT,PLAINTEXT:PLAINTEXT,SSL:SSL,SASL_PLAINTEXT:SASL_PLAINTEXT,SASL_SSL:SASL_SSL

# 新增以下配置
# 设置 SASL 认证机制
sasl.enabled.mechanisms=PLAIN
# 集群间认证时用的认证方式
sasl.mechanism.inter.broker.protocol=PLAIN
# 指定Kafka 客户端与 Broker 之间使用的 SASL 认证机制
sasl.mechanism=PLAIN
# 指定控制器通信时使用的认证机制
sasl.mechanism.controller.protocol=PLAIN
# 配置 SASL 认证存储方式为文件
authorizer.class.name=org.apache.kafka.metadata.authorizer.StandardAuthorizer
# 设置必须授权才能用
allow.everyone.if.no.acl.found=false
# 配置超级用户
super.users=User:admin
```

## 修改启动脚本
```bash
root@kafka-1:~# vim /opt/kafka/bin/kafka-server-start.sh
# 新增-Djava.security.auth.login.config=/opt/kafka/config/kafka_server_jaas.conf参数
if [ "x$KAFKA_HEAP_OPTS" = "x" ]; then
    export KAFKA_HEAP_OPTS="-Xmx1G -Xms1G -Djava.security.auth.login.config=/opt/kafka/config/kafka_server_jaas.conf"
fi
```

## 重启 kafka 集群
```bash
root@kafka-1:~# systemctl restart kafka
```

## 客户端使用账户密码认证
1. 修改客户端配置文件，新增认证信息

```bash
root@kafka-1:~# cat > /opt/kafka/config/admin.properties << EOF
bootstrap.servers=192.168.10.31:9092,192.168.10.32:9092,192.168.10.33:9092
ssl.keystore.location=/opt/kafka/pki/kafka.keystore.jks
ssl.keystore.password= CHANGE_ME
ssl.truststore.location=/opt/kafka/pki/kafka.truststore.jks
ssl.truststore.password= CHANGE_ME
ssl.endpoint.identification.algorithm=
ssl.key.password= CHANGE_ME
security.protocol=SASL_SSL
sasl.mechanism=PLAIN
sasl.jaas.config=org.apache.kafka.common.security.plain.PlainLoginModule required \
    username="admin" \
    password="password";
EOF
```

2. 查看 boorker 信息

```bash
root@kafka-1:~# /opt/kafka/bin/kafka-broker-api-versions.sh --bootstrap-server 192.168.10.31:9092 --command-config /opt/kafka/config/admin.properties
192.168.10.32:9092 (id: 2 rack: null) -> (
        ……
)
192.168.10.33:9092 (id: 3 rack: null) -> (
        ……
)
192.168.10.31:9092 (id: 1 rack: null) -> (
        ……
)
```

3. 查看 topic 信息

```bash
root@kafka-1:~# /opt/kafka/bin/kafka-topics.sh --bootstrap-server 192.168.10.31:9092 --list --command-config /opt/kafka/config/admin.properties
.properties
__consumer_offsets
test
```

4. 创建客户端认证文件

```bash
root@kafka-1:~# cat > /opt/kafka/config/client_jaas.conf << EOF
KafkaClient {
org.apache.kafka.common.security.plain.PlainLoginModule required
username="admin"
password="password";
};
EOF
```

5. 修改生产者和消费者脚本，添加-Djava.security.auth.login.config=/opt/kafka/config/client_jaas.conf

```bash
root@kafka-1:~# vim /opt/kafka/bin/kafka-console-producer.sh
exec $(dirname $0)/kafka-run-class.sh -Djava.security.auth.login.config=/opt/kafka/config/client_jaas.conf kafka.tools.ConsoleProducer "$@"
root@kafka-1:~# vim /opt/kafka/bin/kafka-console-consumer.sh
exec $(dirname $0)/kafka-run-class.sh -Djava.security.auth.login.config=/opt/kafka/config/client_jaas.conf org.apache.kafka.tools.consumer.ConsoleConsumer "$@"
```

6. 生产者发送消息

```bash
root@kafka-1:~# /opt/kafka/bin/kafka-console-producer.sh --broker-list 192.168.10.31:9092 --topic test --producer.config /opt/kafka/config/admin.properties
> hello kafka
```

7. 消费者消费消息

```bash
root@kafka-1:~# /opt/kafka/bin/kafka-console-consumer.sh --bootstrap-server 192.168.10.31:9092 --topic test --consumer.config /opt/kafka/config/admin.properties --from-beginning
hello kafka
```

## kafka-ui 使用账号密码认证
1. 更新 kafka-ui 配置文件

```yaml
root@kafka-1:~# vim /opt/kafka-ui/config.yml
kafka:
  clusters:
    -
      name: kafka-cluster
      bootstrapServers: 192.168.10.31:9092,192.168.10.32:9092,192.168.10.33:9092
      metrics:
        port: 9997
        type: JMX
      properties:
        security:
          protocol: SASL_SSL
        sasl:
          mechanism: PLAIN
          jaas:
            config: org.apache.kafka.common.security.plain.PlainLoginModule required username="admin" password="password";
        ssl:
          keystore:
            location: /opt/kafka/pki/kafka.keystore.jks
            password: CHANGE_ME
        ssl_endpoint_identification_algorithm: ''
      ssl:
        truststorelocation: /opt/kafka/pki/kafka.truststore.jks
        truststorepassword: CHANGE_ME
```

2. 重启 kafka-ui 验证

```bash
root@kafka-1:~# systemctl restart kafka-ui
```

# ACL权限
在Kafka中，ACL（Access Control List）是用来控制谁可以访问Kafka资源（如主题、消费者组等）的权限机制。ACL配置基于Kafka的`kafka-acls.sh`工具，能够管理对资源的读取、写入等操作权限。

## Kafka ACL的基本概念
Kafka的ACL是基于以下几个方面的：

+ 资源类型（Resource Type）: Kafka支持多种资源类型，包括主题（Topic）、消费者组（Consumer Group）、Kafka集群本身（Cluster）等。
+ 操作类型（Operation Type）: 如`Read`（读取）、`Write`（写入）、`Create`（创建）、`Describe`（描述）、`Alter`（修改）等。
+ 权限类型（Permission Type）: `Allow`表示允许访问，`Deny`表示拒绝访问。
+ 主体（Principal）: 访问Kafka的用户或客户端。Kafka支持通过SASL认证系统中的用户来定义主体，通常是`User:<username>`的形式。

## 查看现有ACL
```bash
root@kafka-1:/opt/kafka# bin/kafka-acls.sh --bootstrap-server 192.168.10.31:9092 --list --command-config /opt/kafka/config/admin.properties
```

## 添加ACL
给用户`User:test`添加对`test`主题的读取权限：

```bash
root@kafka-1:/opt/kafka# bin/kafka-acls.sh --bootstrap-server 192.168.10.31:9092 --add --allow-principal User:test --operation Read --topic test --command-config /opt/kafka/config/admin.properties
Adding ACLs for resource `ResourcePattern(resourceType=TOPIC, name=test, patternType=LITERAL)`: 
        (principal=User:test, host=*, operation=READ, permissionType=ALLOW)
```

+ --allow-principal: 允许访问的用户主体。
+ --operation: 操作类型，如`Read`、`Write`等。
+ --topic top 名称。

通过 kafka-ui 查看验证

![](assets/10-Linux/0b97a00c59ca9410f7b9.png)

## 删除ACL
删除`User:test`对`test`主题的读取权限：

```bash
root@kafka-1:/opt/kafka# bin/kafka-acls.sh --bootstrap-server 192.168.10.31:9092 --remove --allow-principal User:test --operation Read --topic test --command-config /opt/kafka/config/admin.properties
Are you sure you want to remove ACLs: 
        (principal=User:test, host=*, operation=READ, permissionType=ALLOW) 
 from resource filter `ResourcePattern(resourceType=TOPIC, name=test, patternType=LITERAL)`? (y/n)
y
```

# Kafka性能测试
kafka 不同的参数配置对 kafka 性能都会造成影响，通常情况下集群性能受分区、磁盘和线程等影响因素，因此需要进行性能测试，找出集群性能瓶颈和最佳参数。

## 测试工具
在 Kafka 安装目录 `$KAFKA_HOME/bin/` 有以下跟性能相关的测试脚本：

```bash
# 生产者和消费者的性能测试工具
kafka-producer-perf-test.sh
kafka-consumer-perf-test.sh
```

kafka-producer-perf-test.sh：用于测试Kafka Producer的性能，主要输出4项指标，总共发送消息量（以MB为单位），每秒发送消息量（MB/second），发送消息总数，每秒发送消息数（records/second）。

kafka-consumer-perf-test.sh：用于测试Kafka Consumer的性能，测试指标与Producer性能测试脚本一样

## 测试环境
+ 前置条件：3 个Broker（节点），1个Topic（主题），3个Partition（分区），1 个 Replication（副本），异步模式，消息Payload为300字节，消息数量 5000万，kafka 版本为 3.9.2
+ 硬件配置：4 核 CPU，8G 内存，1T HDD 硬盘 
+ 测试工具：Kafka自带的基准工具

## 生产者基准测试
```bash
root@kafka-1:/opt/kafka# bin/kafka-producer-perf-test.sh \
  --topic perf-test \
  --num-records 5000000 \
  --record-size 300 \
  --throughput -1 \
  --producer.config /opt/kafka/config/admin.properties \
  --print-metrics
1030901 records sent, 206180.2 records/sec (58.99 MB/sec), 436.0 ms avg latency, 915.0 ms max latency.
2392728 records sent, 478545.6 records/sec (136.91 MB/sec), 220.9 ms avg latency, 411.0 ms max latency.
5000000 records sent, 387176.707449 records/sec (110.77 MB/sec), 256.22 ms avg latency, 915.00 ms max latency, 222 ms 50th, 495 ms 95th, 765 ms 99th, 879 ms 99.9th.

Metric Name                                                                                                      Value
app-info:commit-id:{client-id=perf-producer-client}                                                            : a60e31147e6b01ee
app-info:start-time-ms:{client-id=perf-producer-client}                                                        : 1737285501613
app-info:version:{client-id=perf-producer-client}                                                              : 3.9.0
kafka-metrics-count:count:{client-id=perf-producer-client}                                                     : 149.000
producer-metrics:batch-size-avg:{client-id=perf-producer-client}                                               : 16128.974
producer-metrics:batch-size-max:{client-id=perf-producer-client}                                               : 16129.000
……
```

--topic 指定topic 

--num-records 指定生产数据量 

--throughput 指定吞吐量(-1表示无限制) 

--record-size record数据大小 

--producer.config 指定 kafka 客户端配置文件路径

--print-metrics 打印结果指标值

## 消费者基准测试
```bash
root@kafka-1:/opt/kafka# bin/kafka-consumer-perf-test.sh \
  --topic perf-test \
  --messages 50000000 \
  --consumer.config /opt/kafka/config/admin.properties \
  --bootstrap-server 192.168.10.31:9092,192.168.10.32:9092,192.168.10.33:9092 \
  --print-metrics
2025-01-19 19:23:35:491, 2025-01-19 19:23:53:343, 1430.5115, 80.1317, 5000000, 280080.6632, 3539, 14313, 99.9449, 349332.7744

Metric Name                                                                                                            Value
consumer-coordinator-metrics:assigned-partitions:{client-id=perf-consumer-client}                                    : 0.000
consumer-coordinator-metrics:commit-latency-avg:{client-id=perf-consumer-client}                                     : 11.333
consumer-coordinator-metrics:commit-latency-max:{client-id=perf-consumer-client}                                     : 29.000
……
```

# <font style="color:rgb(79, 79, 79);">公网暴露kafka服务</font>
<font style="color:rgb(51, 51, 51);">kafka 支持通过公网 ip+端口映射或者公网 ip 网卡的方式将其暴露在互联网提供服务。</font>

```bash
listeners 指明 kafka 当前节点监听本机的哪个网卡
advertised.listeners 指明客户端通过哪个 ip 可以访问到当前节点
```

配置文件如下，其中176.26.48.29:9092 客户端通过是内网连接 kafka 集群地址，176.26.48.29:9093 是 kafka 节点之间互相访问地址。

公网122.97.12.220:9295 映射到内网176.26.48.29:9094 提供互联网公网访问。

```bash
listeners=INTERNAL://:9092,EXTERNAL://:9094,CONTROLLER://:9093
advertised.listeners=INTERNAL://176.26.48.58:9092,EXTERNAL://122.97.12.220:9295,CONTROLLER://176.26.48.58:9093
inter.broker.listener.name=INTERNAL
listener.security.protocol.map=CONTROLLER:PLAINTEXT,PLAINTEXT:PLAINTEXT,SSL:SSL,SASL_PLAINTEXT:SASL_PLAINTEXT,SASL_SSL:SASL_SSL,INTERNAL:PLAINTEXT,EXTERNAL:PLAINTEXT
```


