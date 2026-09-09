---
title: RocketMQ 5.1.3：单节点与集群部署实战指南
---

**前言：RocketMQ是一个开源的分布式消息中间件，由阿里巴巴集团开发并捐赠给Apache软件基金会，成为Apache顶级项目。它主要用于处理大规模消息的传递，提供高性能、高吞吐量、高可靠性的消息服务。以下是RocketMQ的一些关键特性和概念：**

### 核心特性

1. **高性能**：RocketMQ通过优化的I/O操作和网络通信，以及高效的队列模型，实现了低延迟和高吞吐量的消息处理能力。
2. **高可靠性**：通过消息持久化、副本机制和主从架构，确保消息不会因系统故障而丢失。
3. **高可用性**：支持集群部署，通过Name Server、Broker和Producer、Consumer等组件的协作，实现故障转移和负载均衡。
4. **灵活的扩展性**：支持水平扩展，可以通过增加Broker节点来提高系统的处理能力。
5. **丰富的消息类型**：支持多种消息类型，包括普通消息、顺序消息、延时消息和事务消息等。
6. **消息轨迹**：提供消息的完整生命周期追踪，方便问题定位和性能优化。
7. **多种部署方式**：支持多种部署方式，包括单机部署、集群部署和云环境部署。

### 核心概念

1. **Name Server**：负责管理集群的路由信息，为Producer和Consumer提供Broker的地址信息。
2. **Broker**：负责消息的存储和转发，是RocketMQ的核心组件。
3. **Topic**：消息的逻辑分类，生产者向Topic发送消息，消费者从Topic消费消息。
4. **Message Queue**：消息队列，是Topic的物理存储单元，每个Topic可以包含多个Message Queue。
5. **Producer**：消息的生产者，负责向Broker发送消息。
6. **Consumer**：消息的消费者，负责从Broker接收并消费消息。
7. **Offset**：消息在队列中的位置，用于标识消息的顺序。
8. **Tag**：消息的标签，用于对消息进行分类。

### 应用场景

1. **异步处理**：通过消息队列将任务异步处理，提高系统的响应速度。
2. **解耦**：通过消息队列将生产者和消费者解耦，降低系统的耦合度。
3. **流量削峰**：在高流量场景下，通过消息队列平滑流量，防止系统过载。
4. **日志收集**：将日志信息发送到消息队列，由专门的日志收集服务进行处理。
5. **分布式事务**：通过事务消息实现分布式系统中的事务一致性。

**RocketMQ以其强大的功能和稳定性，广泛应用于电商、金融、物联网等多个领域，成为企业级消息中间件的首选之一。**

## 一、RocketMQ单机部署

### 1. 安装JDK：需要下载并安装64位的JDK 1.8或更高版本，因为RocketMQ是基于Java开发的，需要Java环境来运行。具体步骤这里不做阐释了。

### 2. 上传RocketMQ压缩包：将RocketMQ压缩包（rocketmq-all-5.1.3-bin-release.zip）上传到服务器目录（例如：/mpjava）。

### 3. 解压压缩包

```
cd /mpjava
unzip rocketmq-all-5.1.3-bin-release.zip
```

## 4. 更改配置文件

- 更改 `/mpjava/rocketmq-all-5.1.3-bin-release/conf/broker.conf`，在最后面加上一行：

```
aclEnable=true
```

- 更改 `/mpjava/rocketmq-all-5.1.3-bin-release/conf/plain_acl.yml`，内容如下：

```
globalWhiteRemoteAddresses:

accounts:
- accessKey: rocketadmin
  secretKey: Mp@2020
  whiteRemoteAddress: 
  # if it is admin, it could access all resources
  admin: true
```

注：`rocketadmin` 为RocketMQ的用户，`Mp@2020` 为密码，可修改。

### 5. 启动RocketMQ

- 启动Name Server

```
cd /mpjava/rocketmq-all-5.1.3-bin-release
nohup bin/mqnamesrv > mqnamesrv_nohup.out 2>&1 &
```

检测Name Server是否启动成功：

```
tail -f /root/logs/rocketmqlogs/namesrv.log
```

显示 `The Name Server boot success…` 表示启动成功。

- 启动Broker

```
cd /mpjava/rocketmq-all-5.1.3-bin-release
nohup bin/mqbroker -n 172.26.223.86:9876 -c conf/broker.conf autoCreateTopicEnable=true > mqbroker_nohup.out 2>&1 &
```

`172.26.223.86` 为本机ip。  
检测Broker是否启动成功：

```
tail -f /root/logs/rocketmqlogs/broker.log
```

显示 `The broker[%s, xxx:10911] boot success...` 表示启动成功。

### 6. 程序中配置：将 `ly-mp-other.properties` 中 `mp.component.amqUrl` 配置为：

```
mp.component.amqType=3
mp.component.amqUrl = 172.26.223.86:9876
mp.component.amqUser = rocketadmin
mp.component.amqPwd = Mp@2020
```

## 二、RocketMQ集群部署

### 1. 集群规划：两台机，部署两主两从4个broker，2个name server。

- `172.26.223.100`：部署1个name server，`broker-a`（主），`broker-b-s`（从）
- `172.26.223.101`：部署1个name server，`broker-b`（主），`broker-a-s`（从）  
  参照上面“RocketMQ单机部署”在 `172.26.223.100`、`172.26.223.101` 上分别部署RocketMQ。

### 2. 更改配置

- 更改JVM配置：更改name server和broker使用的内存。
- 更改 `/mpjava/rocketmq-all-5.1.3-bin-release/bin/runserver.sh`：`Xms4g -Xmx4g -Xmn2g`，根据实际情况更改，如果机器内存太小，将值改小。
- 更改 `/mpjava/rocketmq-all-5.1.3-bin-release/bin/runbroker.sh`：`Xms8g -Xmx8g -Xmn4g`，根据实际情况更改，如果机器内存太小，将值改小。
- 更改配置文件
- 更改 `/mpjava/rocketmq-all-5.1.3-bin-release/conf/2m-2s-sync/broker-a.properties`，增加3行：

```
storePathRootDir=/mpjava/rocketmq-all-5.1.3-bin-release/store_a
listenPort=10911
aclEnable=true
```

- 更改 `/mpjava/rocketmq-all-5.1.3-bin-release/conf/2m-2s-sync/broker-a-s.properties`，增加3行：

```
storePathRootDir=/mpjava/rocketmq-all-5.1.3-bin-release/store_a_s
listenPort=10921
aclEnable=true
```

- 更改 `/mpjava/rocketmq-all-5.1.3-bin-release/conf/2m-2s-sync/broker-b.properties`，增加3行：

```
storePathRootDir=/mpjava/rocketmq-all-5.1.3-bin-release/store_b
listenPort=10911
aclEnable=true
```

- 更改 `/mpjava/rocketmq-all-5.1.3-bin-release/conf/2m-2s-sync/broker-b-s.properties`，增加3行：

```
storePathRootDir=/mpjava/rocketmq-all-5.1.3-bin-release/store_b_s
listenPort=10921
aclEnable=true
```

- 更改 `/mpjava/rocketmq-all-5.1.3-bin-release/conf/plain_acl.yml`，内容如下（其他不相关项请删除）：

```
globalWhiteRemoteAddresses:

accounts:
- accessKey: rocketadmin
  secretKey: Mp@2020
  whiteRemoteAddress: 
  # if it is admin, it could access all resources
  admin: true
```

### 3. 启动RocketMQ

- 启动 `172.26.223.100` 和 `172.26.223.101` 两台机上的name server：

```
cd /mpjava/rocketmq-all-5.1.3-bin-release
nohup bin/mqnamesrv > mqnamesrv_nohup.out 2>&1 &
```

- 启动 `172.26.223.100` 上的1主1从2个broker：

```
cd /mpjava/rocketmq-all-5.1.3-bin-release
nohup bin/mqbroker -n "172.26.223.100:9876;172.26.223.101:9876" -c conf/2m-2s-sync/broker-a.properties autoCreateTopicEnable=true > broker_a_nohup.out 2>&1 &
nohup bin/mqbroker -n "172.26.223.100:9876;172.26.223.101:9876" -c conf/2m-2s-sync/broker-b-s.properties autoCreateTopicEnable=true > broker_b_s_nohup.out 2>&1 &
```

- 启动 `172.26.223.101` 上的1主1从2个broker：

```
cd /mpjava/rocketmq-all-5.1.3-bin-release
nohup bin/mqbroker -n "172.26.223.100:9876;172.26.223.101:9876" -c conf/2m-2s-sync/broker-b.properties autoCreateTopicEnable=true > broker_b_nohup.out 2>&1 &
nohup bin/mqbroker -n "172.26.223.100:9876;172.26.223.101:9876" -c conf/2m-2s-sync/broker-a-s.properties autoCreateTopicEnable=true > broker_a_s_nohup.out 2>&1 &
```

### 4. 程序中配置：将 `ly-mp-other.properties` 中 `mp.component.amqUrl` 配置为：

```
mp.component.amqType=3
mp.component.amqUrl = 172.26.223.100:9876;172.26.223.101:9876
mp.component.amqUser = rocketadmin
mp.component.amqPwd = Mp@2020
```

