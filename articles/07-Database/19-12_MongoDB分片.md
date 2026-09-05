# MongoDB分片

> 分类：Database / 第19章：MongoDB
> 原文：https://www.cuiliangblog.cn/detail/section/31466534
> 来源：崔亮的博客

---

# 一、分片
1. 当MongoDB存储海量的数据时，一台机器可能不足以存储数据，也可能不足以提供可接受的读写吞吐量。这时，我们就可以通过在多台机器上分割数据，使得数据库系统能存储和处理更多的数据。
2. 为什么使用分片
+ 复制所有的写入操作到主节点
+ 延迟的敏感数据会在主节点查询
+ 单个副本集限制在12个节点
+ 当请求量巨大时会出现内存不足。
+ 本地磁盘不足
+ 垂直扩展价格昂贵
3. MongoDB分片架构

![](assets/07-Database/0e33e1b18a3c8f84071a.png)

+ Shard:

用于存储实际的数据块，实际生产环境中一个shard server角色可由几台机器组个一个replica set承担，防止主机单点故障

+ Config Server:

mongod实例，存储了整个 ClusterMetadata，其中包括 chunk信息。

+ Query Routers:

前端路由，客户端由此接入，且让整个集群看上去像单一数据库，前端应用可以透明使用。

二、服务器的安装及配置(3台服务器执行相同操作)

1. 下载解压MongoDB

到MongoDB官网下载：[https://fastdl.mongodb.org/linux/mongodb-linux-x86_64-4.0.2.tgz](https://fastdl.mongodb.org/linux/mongodb-linux-x86_64-4.0.2.tgz)

解压到/home/mongodb，设置环境变量:

export PATH=$PATH:/home/mongodb/bin

保存后执行：

srouce /etc/profile

1. 创建路由、配置、分片等的相关目录与文件

启动配置文件存放的文件夹：mkdir -p /home/mongodb/conf

配置服务数据存放目录：mkdir -p /home/mongodb/data/config

分片1服务数据存放目录：mkdir -p /home/mongodb/data/shard1

分片2服务数据存放目录：mkdir -p /home/mongodb/data/shard2

分片3服务数据存放目录：mkdir -p /home/mongodb/data/shard3

配置服务日志存放文件：mkdir -p /home/mongodb/log/config.log

路由服务日志存放文件：mkdir -p /home/mongodb/log/mongos.log

分片1服务日志存放文件：mkdir -p /home/mongodb/log/shard1.log

分片2服务日志存放文件：mkdir -p /home/mongodb/log/shard2.log

分片3服务日志存放文件：mkdir -p /home/mongodb/log/shard3.log

1. 配置服务器部署(3台服务器执行相同操作)
+ 在/home/mongodb/conf目录创建config.conf:

dbpath=/home/mongodb/data/config

logpath=/home/mongodb/log/config.log

port=27018

logappend=true

fork=true

maxConns=5000

#复制集名称

replSet=configs

#置参数为true

configsvr=true

#允许任意机器连接

bind_ip=0.0.0.0

+ 配置复制集

分别启动三台服务器的配置服务： 

mongod -f /home/mongodb/conf/config.conf

+ 连接mongo,只需在任意一台机器执行即可：

mongo --host 10.211.55.3 --port 27018

+ 切换数据库：

use admin

+ 初始化复制集：

rs.initiate({_id:"configs",members:[{_id:0,host:"10.211.55.3:27018"},{_id:1,host:"10.211.55.4:27018"}, {_id:2,host:"10.211.55.5:27018"}]})

其中_id:"configs"的configs是上面config.conf配置文件里的复制集名称，把三台服务器的配置服务组成复制集。

+ 查看状态：

rs.status()

等几十秒左右，执行上面的命令查看状态，三台机器的配置服务就已形成复制集，其中1台为PRIMARY，其他2台为SECONDARY。

1. 分片服务部署(3台服务器执行相同操作)
+ 在/home/mongodb/conf目录创建shard1.conf、shard2.conf、shard3.conf，内容如下：        

dbpath=/home/mongodb/data/shard1 #其他2个分片对应修改为shard2、shard3文件夹

logpath=/home/mongodb/log/shard1.log #其他2个分片对应修改为shard2.log、shard3.log

port=27001 #其他2个分片对应修改为27002、27003

logappend=true

fork=true

maxConns=5000

storageEngine=mmapv1

shardsvr=true

replSet=shard1 #其他2个分片对应修改为shard2、shard3

bind_ip=0.0.0.0

端口分别是27001、27002、27003，分别对应shard1.conf、shard2.conf、shard3.conf。

还有数据存放目录、日志文件这几个地方都需要对应修改。

+ 在3台机器的相同端口形成一个分片的复制集，由于3台机器都需要这3个文件，所以根据这9个配置文件分别启动分片服务：

mongod -f /home/mongodb/conf/shard{1/2/3}.conf

+ 将分片配置为复制集

连接mongo，只需在任意一台机器执行即可：

mongo --host 10.211.55.3 --port 27001 //这里以shard1为例，其他两个分片则再需对应连接到27002、27003的端口进行操作即可

+ 切换数据库：

use admin

+ 初始化复制集：

rs.initiate({_id:"shard1",members:[{_id:0,host:"10.211.55.3:27001"},{_id:1,host:"10.211.55.4:27001"},{_id:2,host:"10.211.55.5:27001"}]})

以上是基于分片1来操作，同理，其他2个分片也要连到各自的端口来执行一遍上述的操作，让3个分片各自形成1主2从的复制集，注意端口及仲裁节点的问题即可，操作完成后3个分片都启动完成，并完成复制集模式。

1. 路由服务部署(3台服务器执行相同操作)
+ 在/home/mongodb/conf目录创建mongos.conf，内容如下：        

logpath=/home/mongodb/log/mongos.log

logappend = true

port = 27017

fork = true

configdb = configs/10.211.55.3:27018,10.211.55.4:27018,10.211.55.5:27018

maxConns=20000

bind_ip=0.0.0.0

+ 启动mongos

分别在三台服务器启动：

mongos -f /home/mongodb/conf/mongos.conf

+ 启动分片功能

连接mongo：

mongo --host 10.211.55.3 --port 27017

+ 切换数据库：

use admin

+ 添加分片，只需在一台机器执行即可：        

sh.addShard("shard1/10.211.55.3:27001,10.211.55.4:27001,10.211.55.5:27001")

sh.addShard("shard2/10.211.55.3:27002,10.211.55.4:27002,10.211.55.5:27002")

sh.addShard("shard3/10.211.55.3:27003,10.211.55.4:27003,10.211.55.5:27003")

+ 查看集群状态：

sh.status()

1. 实现分片功能
+ 设置分片chunk大小        

use config

db.setting.save({"_id":"chunksize","value":1}) # 设置块大小为1M是方便实验，不然需要插入海量数据

+ 模拟写入数据        

use calon

for(i=1;i<=50000;i++){db.user.insert({"id":i,"name":"jack"+i})} #模拟往calon数据库的user表写入5万数据

+ 启用数据库分片

sh.enableSharding("calon")

+ 创建索引，对表进行分片        

db.user.createIndex({"id":1}) # 以"id"作为索引

sh.shardCollection(calon.user",{"id":1}) # 根据"id"对user表进行分片

sh.status() # 查看分片情况


