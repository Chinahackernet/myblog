---
title: kafka开机自启失败问题处理
---

**前言：在当今大数据处理领域，Kafka 作为一款高性能、分布式的消息队列系统，发挥着举足轻重的作用。无论是海量数据的实时传输，还是复杂系统间的解耦通信，Kafka 都能轻松应对。然而，在实际部署和运维 Kafka 的过程中，我们常常会遭遇一些棘手的问题，其中 Kafka 开机自启配置就是一个看似简单却暗藏玄机的挑战。今天，就跟随我一同深入探究如何成功实现 Kafka 的开机自启，并巧妙化解其中可能遇到的陷阱。**

### 第一步：配置开机自启参数

命令：`sudo vim /etc/systemd/system/kafka.service`

```
[Unit]
Description=kafka
After=network.target

[Service]
Environment="JAVA_HOME=/usr/java/jdk1.8.0_421"
Type=forking
ExecStart=/app/kafka/bin/kafka-server-start.sh -daemon /app/kafka/config/server.properties
ExecStop=/app/kafka/bin/kafka-server-stop.sh
PrivateTmp=true
User=<普通用户名>
Group=<普通用户名>

[Install]
WantedBy=multi-user.target
```

将<普通用户名>改成你具体的普通用户名

### 第二步：启动并执行服务管理命令

```
./kafka-server-stop.sh  -daemon ../config/server.properties  #关闭原用命令启动的kafka服务
sudo systemctl daemon-reload                                 #重新加载
sudo systemctl start kafka.service                           #启动kafka
sudo systemctl status kafka.service                          #查看kafka进程状态
sudo systemctl enable kafka.service                          设置开机自启
```

### 第三步：验证kafka开启自启

命令：`sudo systemctl is-enabled kafka.service`  

这里返回了enabled说明开机自启功能配置成功了，但是需要严谨些，用以下命令模拟真正的服务器重启场景：  
命令：`sudo reboot`  

以上报错信息可以看得出来并未成功的开机自启

### 第四步：分析

从技术层面深入剖析，Kafka在运行机制上对Zookeeper存在强依赖关系，其启动过程需要与Zookeeper协同配合。有一种潜在的风险情景值得关注：当系统开机时，若Zookeeper.service与Kafka.service均被设置为开机自启，由于系统并行启动多个服务的特性，极有可能出现Zookeeper尚未完成启动流程、服务尚未就绪的情况，此时Kafka便开始尝试启动，进而导致启动失败。因为Kafka启动伊始需要向Zookeeper注册自身信息、获取关键配置数据以及协调分布式环境下的诸多事宜，缺少稳定运行的Zookeeper支持，这些关键步骤无法顺利推进，最终致使Kafka启动受阻。

### 第五步：解决依赖问题

结合以上分析思路，kafka开机自启配置文件需要额外添加：After=zookeeper.service，意思是：先启动zookeeper，再启动kafka  
命令：`sudo vim /etc/systemd/system/kafka.service`

```
[Unit]
Description=kafka
After=network.target
After=zookeeper.service

[Service]
Environment="JAVA_HOME=/usr/java/jdk1.8.0_421"
Type=forking
ExecStart=/app/kafka/bin/kafka-server-start.sh -daemon /app/kafka/config/server.properties
ExecStop=/app/kafka/bin/kafka-server-stop.sh
PrivateTmp=true
User=<普通用户名>
Group=<普通用户名>

[Install]
WantedBy=multi-user.target
```

### 第六步：再次验证：

命令：`sudo reoot`  

启动成功！
