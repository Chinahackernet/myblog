## 1、安装要求

-   系统要求：64位操作系统(推荐使用Linux和MacOS)
-   编程环境：JDK1.8+
-   依赖： 依靠Zookeeper服务，如果zookeeper和kafka在同一台机器，需要先启动zookeeper再启动kafka

  

## 2、下载二进制包

```plain
[root@service01 ~]# wget http://mirrors.tuna.tsinghua.edu.cn/apache/kafka/2.4.0/kafka_2.12-2.4.0.tgz
```

## 3、安装部署

```plain
[root@service01 ~]# tar xvf kafka_2.12-2.4.0.tgz -C /data/
[root@service01 ~]# mv /data/kafka_2.12-2.4.0/ /data/kafka
```

## 3、单节点配置

```plain
[root@service01 ~]# grep ^[a-z] /data/kafka/config/server.properties 
broker.id=0     #每个节点的id需不同
delete.topic.enable=true        #运行删除topic
advertised.listeners=PLAINTEXT://192.168.10.242:9092        #生产者和消费者连接的地址，kafka会把该地址注册到zookeeper中
num.network.threads=3
num.io.threads=8
socket.send.buffer.bytes=102400
socket.receive.buffer.bytes=102400
socket.request.max.bytes=104857600
log.dirs=/data/kafka/data          #数据存放目录
num.partitions=3                        #分区数，可根据多少kafka节点来做调整，默认1
num.recovery.threads.per.data.dir=1
offsets.topic.replication.factor=1
transaction.state.log.replication.factor=1
transaction.state.log.min.isr=1
log.retention.hours=168             #消息保留时间
log.segment.bytes=1073741824
log.retention.check.interval.ms=300000
zookeeper.connect=192.168.10.242:2181,192.168.10.26:2181,192.168.10.39:2181     #zookeeper连接地址
zookeeper.connection.timeout.ms=6000
group.initial.rebalance.delay.ms=0
```

## 4、启动

```plain

[root@service01 ~]# nohup /data/kafka/bin/kafka-server-start.sh /data/kafka/config/server.properties &        #启动kafka
[root@service01 ~]# /data/kafka/bin/kafka-server-stop.sh       #停止kafka
```

## 5、配置systemctl管理

```plain
[root@service01 ~]# cat /usr/lib/systemd/system/kafka.service       #配置systemctl管理
[Unit]
Description=Apache Kafka server (broker)
After=network.target  zookeeper.service

[Service]
Type=simple
User=root
Group=root
Environment=PATH=/usr/local/jdk/bin:/usr/local/git/bin:/usr/local/sbin:/usr/local/bin:/sbin:/bin:/usr/sbin:/usr/bin:/root/bin
ExecStart=/data/kafka/bin/kafka-server-start.sh /data/kafka/config/server.properties
ExecStop=/data/kafka/bin/kafka-server-stop.sh
Restart=on-failure
 
[Install]
WantedBy=multi-user.target
```