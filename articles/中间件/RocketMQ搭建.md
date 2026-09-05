RocketMQ下载地址：[https://mirrors.tuna.tsinghua.edu.cn/apache/rocketmq/4.3.0/rocketmq-all-4.3.0-bin-release.zip](https://mirrors.tuna.tsinghua.edu.cn/apache/rocketmq/4.3.0/rocketmq-all-4.3.0-bin-release.zip)

![image.png](assets/中间件/RocketMQ搭建/RocketMQ搭建-1.png)

  

环境规划：

<table class="lake-table" style="width: 699px;"><colgroup><col span="1" width="176" /><col span="1" width="253" /><col span="1" width="269" /></colgroup><tbody><tr style="height: 33px;"><td><p>名称</p></td><td><p>IP</p></td><td rowspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><p>配置</p></td></tr><tr style="height: 33px;"><td><p>NameServer01</p></td><td><p>10.2.42.81</p></td><td rowspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><p>2C4G</p></td></tr><tr style="height: 33px;"><td><p>NameServer02</p></td><td><p>10.2.42.82</p></td><td rowspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><p>2C4G</p></td></tr><tr style="height: 33px;"><td colspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><p>Broker-a Master</p></td><td colspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><p>10.2.42.83</p></td><td rowspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><p>1C2G</p></td></tr><tr style="height: 33px;"><td colspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><p>Broker-a Slave</p></td><td colspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><p>10.2.42.84</p></td><td rowspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><p>1C2G</p></td></tr><tr style="height: 33px;"><td colspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><p>Broker-b Master</p></td><td colspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><p>10.2.42.85</p></td><td rowspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><p>1C2G</p></td></tr><tr style="height: 33px;"><td colspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><p>Broker-b Slave</p></td><td colspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><p>10.2.42.86</p></td><td rowspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><p>1C2G</p></td></tr></tbody></table>

  

# 修改配置文件

下载安装包，解压到opt目录下

```shell
wget https://mirrors.tuna.tsinghua.edu.cn/apache/rocketmq/4.3.0/rocketmq-all-4.3.0-bin-release.zip
unzip rocketmq-all-4.3.0-bin-release.zip -d /opt
mv rocketmq-all-4.3.0-bin-release rocketMQ
```

  

进入配置文件目录进行修改

```shell
cd /opt/rocketMQ/conf/2m-2s-sync
```

  

vim broker-a.properties

```shell
#所属集群名字
brokerClusterName=rocketmq-cluster
#broker名字，注意此处不同的配置文件填写的不一样
brokerName=broker-a
#0 表示 Master，>0 表示 Slave
brokerId=0
#nameServer地址，分号分割
namesrvAddr=10.2.42.81:9876;10.2.42.82:9876
#在发送消息时，自动创建服务器不存在的topic，默认创建的队列数
defaultTopicQueueNums=4
#是否允许 Broker 自动创建Topic，建议线下开启，线上关闭
autoCreateTopicEnable=true
#是否允许 Broker 自动创建订阅组，建议线下开启，线上关闭
autoCreateSubscriptionGroup=true
#Broker 对外服务的监听端口
listenPort=10911
haListenPort=10912
#删除文件时间点，默认凌晨 4点
deleteWhen=04
#文件保留时间，默认 48 小时
fileReservedTime=48
#commitLog每个文件的大小默认1G
mapedFileSizeCommitLog=1073741824
#ConsumeQueue每个文件默认存30W条，根据业务情况调整
mapedFileSizeConsumeQueue=300000
#destroyMapedFileIntervalForcibly=120000
#redeleteHangedFileInterval=120000
#检测物理文件磁盘空间
diskMaxUsedSpaceRatio=88
#存储路径
storePathRootDir=/data/alibaba-rocketmq/store
#commitLog 存储路径
storePathCommitLog=/data/alibaba-rocketmq/store/commitlog
#消费队列存储路径存储路径
storePathConsumeQueue=/data/alibaba-rocketmq/store/consumequeue
#消息索引存储路径
storePathIndex=/data/alibaba-rocketmq/store/index
#checkpoint 文件存储路径
storeCheckpoint=/data/alibaba-rocketmq/store/checkpoint
#abort 文件存储路径
abortFile=/data/alibaba-rocketmq/store/abort
#限制的消息大小
maxMessageSize=65536

#flushCommitLogLeastPages=4
#flushConsumeQueueLeastPages=2
#flushCommitLogThoroughInterval=10000
#flushConsumeQueueThoroughInterval=60000
#Broker 的角色
#- ASYNC_MASTER 异步复制Master
#- SYNC_MASTER 同步双写Master
#- SLAVE
brokerRole=SYNC_MASTER

#刷盘方式
#- ASYNC_FLUSH 异步刷盘
#- SYNC_FLUSH 同步刷盘
flushDiskType=ASYNC_FLUSH
#checkTransactionMessageEnable=false
#发消息线程池数量
#sendMessageThreadPoolNums=128
#拉消息线程池数量
#pullMessageThreadPoolNums=128
```

  

vim broker-a-s.properties

```shell
#所属集群名字
brokerClusterName=rocketmq-cluster
#broker名字，注意此处不同的配置文件填写的不一样
brokerName=broker-a
#0 表示 Master，>0 表示 Slave
brokerId=1
#nameServer地址，分号分割
namesrvAddr=10.2.42.81:9876;10.2.42.82:9876
#在发送消息时，自动创建服务器不存在的topic，默认创建的队列数
defaultTopicQueueNums=4
#是否允许 Broker 自动创建Topic，建议线下开启，线上关闭
autoCreateTopicEnable=true
#是否允许 Broker 自动创建订阅组，建议线下开启，线上关闭
autoCreateSubscriptionGroup=true
#Broker 对外服务的监听端口
listenPort=10921
haListenPort=10922
#删除文件时间点，默认凌晨 4点
deleteWhen=04
#文件保留时间，默认 48 小时
fileReservedTime=48
#commitLog每个文件的大小默认1G
mapedFileSizeCommitLog=1073741824
#ConsumeQueue每个文件默认存30W条，根据业务情况调整
mapedFileSizeConsumeQueue=300000
#destroyMapedFileIntervalForcibly=120000
#redeleteHangedFileInterval=120000
#检测物理文件磁盘空间
diskMaxUsedSpaceRatio=88
#存储路径
storePathRootDir=/data/alibaba-rocketmq/store
#commitLog 存储路径
storePathCommitLog=/data/alibaba-rocketmq/store/commitlog
#消费队列存储路径存储路径
storePathConsumeQueue=/data/alibaba-rocketmq/store/consumequeue
#消息索引存储路径
storePathIndex=/data/alibaba-rocketmq/store/index
#checkpoint 文件存储路径
storeCheckpoint=/data/alibaba-rocketmq/store/checkpoint
#abort 文件存储路径
abortFile=/data/alibaba-rocketmq/store/abort
#限制的消息大小
maxMessageSize=65536

#flushCommitLogLeastPages=4
#flushConsumeQueueLeastPages=2
#flushCommitLogThoroughInterval=10000
#flushConsumeQueueThoroughInterval=60000
#Broker 的角色
#- ASYNC_MASTER 异步复制Master
#- SYNC_MASTER 同步双写Master
#- SLAVE
brokerRole=SLAVE

#刷盘方式
#- ASYNC_FLUSH 异步刷盘
#- SYNC_FLUSH 同步刷盘
flushDiskType=ASYNC_FLUSH
#checkTransactionMessageEnable=false
#发消息线程池数量
#sendMessageThreadPoolNums=128
#拉消息线程池数量
#pullMessageThreadPoolNums=128
```

  

vim broker-b.properties

```shell
#所属集群名字
brokerClusterName=rocketmq-cluster
#broker名字，注意此处不同的配置文件填写的不一样
brokerName=broker-b
#0 表示 Master，>0 表示 Slave
brokerId=0
#nameServer地址，分号分割
namesrvAddr=10.2.42.81:9876;10.2.42.82:9876
#在发送消息时，自动创建服务器不存在的topic，默认创建的队列数
defaultTopicQueueNums=4
#是否允许 Broker 自动创建Topic，建议线下开启，线上关闭
autoCreateTopicEnable=true
#是否允许 Broker 自动创建订阅组，建议线下开启，线上关闭
autoCreateSubscriptionGroup=true
#Broker 对外服务的监听端口
listenPort=10911
haListenPort=10912
#删除文件时间点，默认凌晨 4点
deleteWhen=04
#文件保留时间，默认 48 小时
fileReservedTime=48
#commitLog每个文件的大小默认1G
mapedFileSizeCommitLog=1073741824
#ConsumeQueue每个文件默认存30W条，根据业务情况调整
mapedFileSizeConsumeQueue=300000
#destroyMapedFileIntervalForcibly=120000
#redeleteHangedFileInterval=120000
#检测物理文件磁盘空间
diskMaxUsedSpaceRatio=88
#存储路径
storePathRootDir=/data/alibaba-rocketmq/store
#commitLog 存储路径
storePathCommitLog=/data/alibaba-rocketmq/store/commitlog
#消费队列存储路径存储路径
storePathConsumeQueue=/data/alibaba-rocketmq/store/consumequeue
#消息索引存储路径
storePathIndex=/data/alibaba-rocketmq/store/index
#checkpoint 文件存储路径
storeCheckpoint=/data/alibaba-rocketmq/store/checkpoint
#abort 文件存储路径
abortFile=/data/alibaba-rocketmq/store/abort
#限制的消息大小
maxMessageSize=65536

#flushCommitLogLeastPages=4
#flushConsumeQueueLeastPages=2
#flushCommitLogThoroughInterval=10000
#flushConsumeQueueThoroughInterval=60000
#Broker 的角色
#- ASYNC_MASTER 异步复制Master
#- SYNC_MASTER 同步双写Master
#- SLAVE
brokerRole=SYNC_MASTER

#刷盘方式
#- ASYNC_FLUSH 异步刷盘
#- SYNC_FLUSH 同步刷盘
flushDiskType=ASYNC_FLUSH
#checkTransactionMessageEnable=false
#发消息线程池数量
#sendMessageThreadPoolNums=128
#拉消息线程池数量
#pullMessageThreadPoolNums=128
```

  

vim broker-b-s.properties

```shell
#所属集群名字
brokerClusterName=rocketmq-cluster
#broker名字，注意此处不同的配置文件填写的不一样
brokerName=broker-b
#0 表示 Master，>0 表示 Slave
brokerId=1
#nameServer地址，分号分割
namesrvAddr=10.2.42.81:9876;10.2.42.82:9876
#在发送消息时，自动创建服务器不存在的topic，默认创建的队列数
defaultTopicQueueNums=4
#是否允许 Broker 自动创建Topic，建议线下开启，线上关闭
autoCreateTopicEnable=true
#是否允许 Broker 自动创建订阅组，建议线下开启，线上关闭
autoCreateSubscriptionGroup=true
#Broker 对外服务的监听端口
listenPort=10921
haListenPort=10922
#删除文件时间点，默认凌晨 4点
deleteWhen=04
#文件保留时间，默认 48 小时
fileReservedTime=48
#commitLog每个文件的大小默认1G
mapedFileSizeCommitLog=1073741824
#ConsumeQueue每个文件默认存30W条，根据业务情况调整
mapedFileSizeConsumeQueue=300000
#destroyMapedFileIntervalForcibly=120000
#redeleteHangedFileInterval=120000
#检测物理文件磁盘空间
diskMaxUsedSpaceRatio=88
#存储路径
storePathRootDir=/data/alibaba-rocketmq/store
#commitLog 存储路径
storePathCommitLog=/data/alibaba-rocketmq/store/commitlog
#消费队列存储路径存储路径
storePathConsumeQueue=/data/alibaba-rocketmq/store/consumequeue
#消息索引存储路径
storePathIndex=/data/alibaba-rocketmq/store/index
#checkpoint 文件存储路径
storeCheckpoint=/data/alibaba-rocketmq/store/checkpoint
#abort 文件存储路径
abortFile=/data/alibaba-rocketmq/store/abort
#限制的消息大小
maxMessageSize=65536

#flushCommitLogLeastPages=4
#flushConsumeQueueLeastPages=2
#flushCommitLogThoroughInterval=10000
#flushConsumeQueueThoroughInterval=60000
#Broker 的角色
#- ASYNC_MASTER 异步复制Master
#- SYNC_MASTER 同步双写Master
#- SLAVE
brokerRole=SLAVE

#刷盘方式
#- ASYNC_FLUSH 异步刷盘
#- SYNC_FLUSH 同步刷盘
flushDiskType=ASYNC_FLUSH
#checkTransactionMessageEnable=false
#发消息线程池数量
#sendMessageThreadPoolNums=128
#拉消息线程池数量
#pullMessageThreadPoolNums=128
```

  

修改日志目录

```shell
cd /opt/rocketMQ/conf
sed -i 's/\${user.home}/\/data\/alibaba-rocketmq/g' logback_broker.xml
sed -i 's/\${user.home}/\/data\/alibaba-rocketmq/g' logback_filtersrv.xml
sed -i 's/\${user.home}/\/data\/alibaba-rocketmq/g' logback_namesrv.xml
sed -i 's/\${user.home}/\/data\/alibaba-rocketmq/g' logback_tools.xml
```

  

修改完毕后将整个项目重新进行打包，分发到其他主机

```shell
cd /opt
tar zcvf rocketMQ.tar.gz rocketMQ/
scp rocketMQ.tar.gz xx.xx.xx.xx:/opt
```

  

# 创建目录

在上面6台服务器上分别执行如下命令，创建我们所需要的日志和数据目录

```shell
mkdir /data/alibaba-rocketmq/logs/rocketmqlogs/otherdays -p
mkdir /data/alibaba-rocketmq/store/{commitlog,config,consumequeue,index} -p
touch /data/alibaba-rocketmq/store/{checkpoint,abort}
```

  

# 启动NameServer

进入NameServer主机10.2.42.81/82，然后解压opt目录下的rocketMQ.tar.gz，然后启动NameServer

```shell
cd /opt
tar xf rocketMQ.tar.gz
# 启动
nohup /opt/rocketMQ/bin/mqnamesrv &
```

  

查看端口和进程是否起来

```shell
[root@DCA-APP-COM-MQ-NameServer01 bin]# ss -ntl
State       Recv-Q Send-Q                                Local Address:Port                                               Peer Address:Port              
LISTEN      0      128                                               *:22                                                            *:*                  
LISTEN      0      100                                       127.0.0.1:25                                                            *:*                  
LISTEN      0      128                                               *:10050                                                         *:*                  
LISTEN      0      128                                              :::9876                                                         :::*                  
LISTEN      0      128                                              :::22                                                           :::*                 
```

  

也可以看日志如下表示启动成功

![image.png](assets/中间件/RocketMQ搭建/RocketMQ搭建-2.png)

  

另一台相同的操作。

  

# 启动Broker

在opt目录下解压rocketMQ.tar.gz

```shell
cd /opt
tar xf rocketMQ.tar.gz
```

  

由于我们的服务器配置是1C2G，所以我们需要修改一下启动脚本，修改为如下配置即可

vim runbroker.sh

```shell
JAVA_OPT="${JAVA_OPT} -server -Xms2g -Xmx2g -Xmn1g"
```

  

在10.2.42.83上启动

```shell
nohup /opt/rocketMQ/bin/mqbroker -c /opt/rocketMQ/conf/2m-2s-sync/broker-a.properties &
```

  

在10.2.42.84上启动

```shell
nohup /opt/rocketMQ/bin/mqbroker -c /opt/rocketMQ/conf/2m-2s-sync/broker-a-s.properties &
```

  

在10.2.42.85上启动

```shell
nohup /opt/rocketMQ/bin/mqbroker -c /opt/rocketMQ/conf/2m-2s-sync/broker-b.properties &
```

  

在10.2.42.86上启动

```shell
nohup /opt/rocketMQ/bin/mqbroker -c /opt/rocketMQ/conf/2m-2s-sync/broker-b-s.properties &
```

  

查看端口和进程是否启动成功，以10.2.42.83为例：

```shell
[root@DCA-APP-COM-MQ-BrokerM-S01 bin]# ss -ntl
State       Recv-Q Send-Q                                Local Address:Port                                               Peer Address:Port              
LISTEN      0      128                                               *:22                                                            *:*                  
LISTEN      0      100                                       127.0.0.1:25                                                            *:*                  
LISTEN      0      128                                               *:10050                                                         *:*                  
LISTEN      0      128                                              :::22                                                           :::*                  
LISTEN      0      128                                              :::10909                                                        :::*                  
LISTEN      0      128                                              :::10911                                                        :::*                  
LISTEN      0      50                                               :::10912                                                        :::*  
```

  

在NameServer上查看topic

```shell
[root@DCA-APP-COM-MQ-NameServer01 bin]# sh mqadmin topicList -n "10.2.42.81:9876;10.2.42.82:9876"
Java HotSpot(TM) 64-Bit Server VM warning: ignoring option PermSize=128m; support was removed in 8.0
Java HotSpot(TM) 64-Bit Server VM warning: ignoring option MaxPermSize=128m; support was removed in 8.0
RMQ_SYS_TRANS_HALF_TOPIC
rocketmq-cluster
AUTO_CREATE_TOPIC_KEY
broker-b
BenchmarkTest
OFFSET_MOVED_EVENT
broker-a
SELF_TEST_TOPIC

```

  

# 部署监控平台

下载源码包

```shell
cd /root
wget https://github.com/apache/rocketmq-externals/archive/rocketmq-console-1.0.0.tar.gz
tar xf rocketmq-console-1.0.0.tar.gz
```

  

进入配置文件目录，修改配置文件

```shell
cd /root/rocketmq-externals-rocketmq-console-1.0.0/rocketmq-console/src/main/resources
```

  

vim application.properties

```shell
server.contextPath=
server.port=8080
#spring.application.index=true
spring.application.name=rocketmq-console
spring.http.encoding.charset=UTF-8
spring.http.encoding.enabled=true
spring.http.encoding.force=true
logging.config=classpath:logback.xml
#if this value is empty,use env value rocketmq.config.namesrvAddr  NAMESRV_ADDR | now, you can set it in ops page.default localhost:9876
rocketmq.config.namesrvAddr=10.2.42.81:9876;10.2.42.82:9876
#if you use rocketmq version < 3.5.8, rocketmq.config.isVIPChannel should be false.default true
rocketmq.config.isVIPChannel=
#rocketmq-console's data path:dashboard/monitor
rocketmq.config.dataPath=/data/alibaba-rocketmq/rocketmq-console
#set it false if you don't want use dashboard.default true
rocketmq.config.enableDashBoardCollect=true
```

  

编译

```shell
mvn clean package -Dmaven.test.skip=true
```

  

编译完成后会在target目录下生成rocketmq-console-ng-1.0.0.jar，上传到指定服务器并启动，我这里上传到10.2.42.81，启动如下：

```shell
nohup java -jar rocketmq-console-ng-1.0.0.jar &
```

  

浏览器访问如下http://10.2.42.81:8080：

![image.png](assets/中间件/RocketMQ搭建/RocketMQ搭建-3.png)

  

添加topic

![image.png](assets/中间件/RocketMQ搭建/RocketMQ搭建-4.png)

  

可以看到添加成功

![image.png](assets/中间件/RocketMQ搭建/RocketMQ搭建-5.png)

  

# 命令行操作

查看topic

```shell
sh mqadmin topicList -n "10.2.42.81:9876;10.2.42.82:9876"
```

  

添加topic

```shell
sh mqadmin updateTopic -n "10.2.42.81:9876;10.2.42.82:9876" -c rocketmq-cluster -t qft-asyncNotify
```