# MongoDB复制集

> 分类：Database / 第19章：MongoDB
> 原文：https://www.cuiliangblog.cn/detail/section/31466537
> 来源：崔亮的博客

---

# 一、MongoDB 复制集
1. 概述

MongoDB复制是将数据同步到多个服务器的过程；

复制集提供了数据的冗余备份并提高了数据的可用性，通常可以保证数据的安全性；

复制集还允许您从硬件故障和服务中断中恢复数据。

1. 优点
+ 保障数据的安全性
+ 数据高可用性 (24*7)
+ 灾难恢复
+ 无需停机维护（如备份，重建索引，压缩）
+ 分布式读取数据
+ 副本集对应用层是透明的
2. 工作原理
+ mongodb的复制集至少需要两个节点。其中一个是主节点，负责处理客户端请求，其余的都是从节点，负责复制主节点上的数据。
+ mongodb各个节点常见的搭配方式为：一主一从、一主多从。
+ 主节点记录在其上的所有操作oplog，从节点定期轮询主节点获取这些操作，然后对自己的数据副本执行这些操作，从而保证从节点的数据与主节点一致。
3. 复制结构图
+ 具有三个存储数据的成员的复制集有：

一个主库，两个从库组成，主库宕机时，这两个从库都可以被选为主库。

![](assets/07-Database/b8724eebc7f77863da83.png)

当主库宕机后,两个从库都会进行竞选，其中一个变为主库，当原主库恢复后，作为从库加入当前的复制集群即可。

![](assets/07-Database/64cc006721ddaac45c2d.png)

+ **当存在****arbiter****节点**

在三个成员的复制集中，有两个正常的主从，及一台arbiter节点：一个主库，一个从库，可以在选举中成为主库，一个aribiter节点，在选举中，只进行投票，不能成为主库

![](assets/07-Database/b6929c135de3a0ce7baa.png)

说明：由于arbiter节点没有复制数据，因此这个架构中仅提供一个完整的数据副本。arbiter节点只需要更少的资源，代价是更有限的冗余和容错。

当主库宕机时，将会选择从库成为主，主库修复后，将其加入到现有的复制集群中即可。

![](assets/07-Database/e12bb609650f010bd356.png)

1. 特点：
+ N 个节点的集群
+ 任何节点可作为主节点
+ 所有写入操作都在主节点上
+ 自动故障转移
+ 自动恢复

# 二、部署MongoDB复制集
**在同一台服务器上创建MongoDB的多实例（4个实例）来做MongoDB主从的实验。**

**1.创建4个MongoDB的实例**

**#**<font style="color:#333333;">创建各实例的数据目录</font><font style="color:#333333;">  
</font><font style="color:#333333;">mkdir -p /data/mongodb/mongodb{1,2,3,4}</font>

**#**<font style="color:#333333;">创建实例配置目录</font><font style="color:#333333;">  
</font><font style="color:#333333;">mkdir -p /data/conf/</font>

**#**<font style="color:#333333;">创建实例的日志目录</font><font style="color:#333333;">  
</font><font style="color:#333333;">mkdir -p /data/logs/</font>

**#**<font style="color:#333333;">创建各实例的日志文件</font><font style="color:#333333;">  
</font><font style="color:#333333;">touch  /data/logs/mongodb{1,2,3,4}.log</font>

**#**<font style="color:#333333;">赋予日志文件权限777</font><font style="color:#333333;">  
</font><font style="color:#333333;">chmod 777 /data/logs/*.log</font>

**2.编辑mongodb1.conf配置文件，开启复制集功能并配置replSetName参数**

<font style="color:navy;">vim</font><font style="color:#333333;">/data/mongodb/mongodb1.conf</font>

**#**<font style="color:#333333;">mongod.conf</font><font style="color:#333333;">  
</font>**#****for**<font style="color:#333333;"> documentation of all options, see:</font><font style="color:#333333;">  
</font>**#**[<font style="color:#333333;">http://docs.mongodb.org/manual/reference/configuration-options/</font>](http://docs.mongodb.org/manual/reference/configuration-options/)<font style="color:#333333;">  
</font>**#**<font style="color:#0086B3;">where</font><font style="color:#333333;"> to write logging data.</font><font style="color:#333333;">  
</font><font style="color:#333333;">systemLog:  
</font><font style="color:#333333;">  destination: file  
</font><font style="color:#333333;">  logAppend: true  
</font><font style="color:#333333;">  path: /data/logs/mongodb1.log         //mongodb1</font><font style="color:#333333;">的日志文件路径</font><font style="color:#333333;">  
</font>**#**<font style="color:#333333;">Where and how to store data.</font><font style="color:#333333;">  
</font><font style="color:#333333;">storage:  
</font><font style="color:#333333;">  dbPath: /data/mongodb/mongodb1/          //mongodb1</font><font style="color:#333333;">的数据文件路径</font><font style="color:#333333;">  
</font><font style="color:#333333;">  journal:  
</font><font style="color:#333333;">    enabled: true  
</font>**#**<font style="color:#333333;">engine:</font><font style="color:#333333;">  
</font>**#**<font style="color:#333333;">mmapv1:</font><font style="color:#333333;">  
</font>**#**<font style="color:#333333;">wiredTiger:</font><font style="color:#333333;">  
</font>**#**<font style="color:#333333;">how the process runs</font><font style="color:#333333;">  
</font><font style="color:#333333;">processManagement:  
</font><font style="color:#333333;">  fork: true  # fork and run in background  
</font><font style="color:#333333;">  pidFilePath: /data/mongodb/mongodb1/mongod.pid  # location of pidfile  
</font><font style="color:#333333;">  timeZoneInfo: /usr/share/zoneinfo  
</font>**#**<font style="color:#333333;">network interfaces</font><font style="color:#333333;">  
</font><font style="color:#333333;">net:  
</font><font style="color:#333333;">  port: 27017                   //mongodb1</font><font style="color:#333333;">的进程号</font><font style="color:#333333;">  
</font><font style="color:#333333;">  bindIp: 0.0.0.0  # Listen to local interface only, comment to listen on all interfaces.  
</font>**#**<font style="color:#333333;">security:</font><font style="color:#333333;">  
</font>**#**<font style="color:#333333;">operationProfiling:</font><font style="color:#333333;">  
</font><font style="color:#333333;">replication:                   //</font><font style="color:#333333;">删除</font><font style="color:#333333;">“#”</font><font style="color:#333333;">，开启复制集功能</font><font style="color:#333333;">  
</font><font style="color:#333333;">    replSetName: test-rc       //</font><font style="color:#333333;">名称为</font><font style="color:#333333;">test-rc  
</font>**#**<font style="color:#333333;">sharding:</font><font style="color:#333333;">  
</font>**#**_#Enterprise-Only Options_<font style="color:#333333;">  
</font>**#**<font style="color:#333333;">auditLog:</font><font style="color:#333333;">  
</font>**#**<font style="color:#333333;">snmp:</font>

**3.复制默认mongodb1.conf配置文件，生成另外三份实例的配置文件**

_#复制默认实例的配置文件_

<font style="color:navy;">cp</font><font style="color:#333333;"> -p /data/mongodb/mongodb1.conf /data/conf/mongodb2.conf  
</font><font style="color:#333333;">cp -p /data/mongodb/mongodb1.conf /data/conf/mongodb3.conf  
</font><font style="color:#333333;">cp -p /data/mongodb/mongodb1.conf /data/conf/mongodb4.conf</font>

**4.分别修改mongodb2.conf、mongodb3.conf、mongodb4.conf配置文件，如下**

**MongoDB2配置文件**

<font style="color:navy;">cat</font><font style="color:#333333;">/data/conf/mongodb2.conf</font>

**#**<font style="color:#333333;">mongod.conf</font><font style="color:#333333;">  
</font>**#****for**<font style="color:#333333;"> documentation of all options, see:</font><font style="color:#333333;">  
</font>**#**[<font style="color:#333333;">http://docs.mongodb.org/manual/reference/configuration-options/</font>](http://docs.mongodb.org/manual/reference/configuration-options/)<font style="color:#333333;">  
</font>**#**<font style="color:#0086B3;">where</font><font style="color:#333333;"> to write logging data.</font><font style="color:#333333;">  
</font><font style="color:#333333;">systemLog:  
</font><font style="color:#333333;">  destination: file  
</font><font style="color:#333333;">  logAppend: true  
</font><font style="color:#333333;">  path: /data/logs/mongodb2.log         //mongodb2</font><font style="color:#333333;">的日志文件路径</font><font style="color:#333333;">  
</font>**#**<font style="color:#333333;">Where and how to store data.</font><font style="color:#333333;">  
</font><font style="color:#333333;">storage:  
</font><font style="color:#333333;">  dbPath: /data/mongodb/mongodb2/          //mongodb2</font><font style="color:#333333;">的数据文件路径</font><font style="color:#333333;">  
</font><font style="color:#333333;">  journal:  
</font><font style="color:#333333;">    enabled: true  
</font>**#**<font style="color:#333333;">engine:</font><font style="color:#333333;">  
</font>**#**<font style="color:#333333;">mmapv1:</font><font style="color:#333333;">  
</font>**#**<font style="color:#333333;">wiredTiger:</font><font style="color:#333333;">  
</font>**#**<font style="color:#333333;">how the process runs</font><font style="color:#333333;">  
</font><font style="color:#333333;">processManagement:  
</font><font style="color:#333333;">  fork: true  # fork and run in background  
</font><font style="color:#333333;">  pidFilePath: /data/mongodb/mongodb1/mongod.pid  # location of pidfile  
</font><font style="color:#333333;">  timeZoneInfo: /usr/share/zoneinfo  
</font>**#**<font style="color:#333333;">network interfaces</font><font style="color:#333333;">  
</font><font style="color:#333333;">net:  
</font><font style="color:#333333;">  port: 27018                   //mongodb2</font><font style="color:#333333;">的进程号</font><font style="color:#333333;">  
</font><font style="color:#333333;">  bindIp: 0.0.0.0  # Listen to local interface only, comment to listen on all interfaces.  
</font>**#**<font style="color:#333333;">security:</font><font style="color:#333333;">  
</font>**#**<font style="color:#333333;">operationProfiling:</font><font style="color:#333333;">  
</font><font style="color:#333333;">replication:                    //</font><font style="color:#333333;">删除</font><font style="color:#333333;">“#”</font><font style="color:#333333;">，开启复制集功能</font><font style="color:#333333;">  
</font><font style="color:#333333;">    replSetName: test-rc        #</font><font style="color:#333333;">名称为</font><font style="color:#333333;">test-rc  
</font>**#**<font style="color:#333333;">sharding:</font><font style="color:#333333;">  
</font>**#**_#Enterprise-Only Options_<font style="color:#333333;">  
</font>**#**<font style="color:#333333;">auditLog:</font><font style="color:#333333;">  
</font>**#**<font style="color:#333333;">snmp:</font>

**MongoDB3配置文件**

<font style="color:navy;">cat</font><font style="color:#333333;">/data/conf/mongodb3.conf</font>

**#**<font style="color:#333333;">mongod.conf</font><font style="color:#333333;">  
</font>**#****for**<font style="color:#333333;"> documentation of all options, see:</font><font style="color:#333333;">  
</font>**#**[<font style="color:#333333;">http://docs.mongodb.org/manual/reference/configuration-options/</font>](http://docs.mongodb.org/manual/reference/configuration-options/)<font style="color:#333333;">  
</font>**#**<font style="color:#0086B3;">where</font><font style="color:#333333;"> to write logging data.</font><font style="color:#333333;">  
</font><font style="color:#333333;">systemLog:  
</font><font style="color:#333333;">  destination: file  
</font><font style="color:#333333;">  logAppend: true  
</font><font style="color:#333333;">  path: /data/logs/mongodb3.log         //mongodb3</font><font style="color:#333333;">的日志文件路径</font><font style="color:#333333;">  
</font>**#**<font style="color:#333333;">Where and how to store data.</font><font style="color:#333333;">  
</font><font style="color:#333333;">storage:  
</font><font style="color:#333333;">  dbPath: /data/mongodb/mongodb3/          //mongodb3</font><font style="color:#333333;">的数据文件路径</font><font style="color:#333333;">  
</font><font style="color:#333333;">  journal:  
</font><font style="color:#333333;">    enabled: true  
</font>**#**<font style="color:#333333;">engine:</font><font style="color:#333333;">  
</font>**#**<font style="color:#333333;">mmapv1:</font><font style="color:#333333;">  
</font>**#**<font style="color:#333333;">wiredTiger:</font><font style="color:#333333;">  
</font>**#**<font style="color:#333333;">how the process runs</font><font style="color:#333333;">  
</font><font style="color:#333333;">processManagement:  
</font><font style="color:#333333;">  fork: true  # fork and run in background  
</font><font style="color:#333333;">  pidFilePath: /data/mongodb/mongodb1/mongod.pid  # location of pidfile  
</font><font style="color:#333333;">  timeZoneInfo: /usr/share/zoneinfo  
</font>**#**<font style="color:#333333;">network interfaces</font><font style="color:#333333;">  
</font><font style="color:#333333;">net:  
</font><font style="color:#333333;">  port: 27019                   //mongodb3</font><font style="color:#333333;">的进程号</font><font style="color:#333333;">  
</font><font style="color:#333333;">  bindIp: 0.0.0.0  # Listen to local interface only, comment to listen on all interfaces.  
</font>**#**<font style="color:#333333;">security:</font><font style="color:#333333;">  
</font>**#**<font style="color:#333333;">operationProfiling:</font><font style="color:#333333;">  
</font><font style="color:#333333;">replication:                    //</font><font style="color:#333333;">删除</font><font style="color:#333333;">“#”</font><font style="color:#333333;">，开启复制集功能</font><font style="color:#333333;">  
</font><font style="color:#333333;">    replSetName: test-rc        #</font><font style="color:#333333;">名称为</font><font style="color:#333333;">test-rc  
</font>**#**<font style="color:#333333;">sharding:</font><font style="color:#333333;">  
</font>**#**_#Enterprise-Only Options_<font style="color:#333333;">  
</font>**#**<font style="color:#333333;">auditLog:</font><font style="color:#333333;">  
</font>**#**<font style="color:#333333;">snmp:</font>

**MongoDB4配置文件**

<font style="color:navy;">cat</font><font style="color:#333333;">/data/conf/mongodb4.conf</font>

**#**<font style="color:#333333;">mongod.conf</font><font style="color:#333333;">  
</font>**#****for**<font style="color:#333333;"> documentation of all options, see:</font><font style="color:#333333;">  
</font>**#**[<font style="color:#333333;">http://docs.mongodb.org/manual/reference/configuration-options/</font>](http://docs.mongodb.org/manual/reference/configuration-options/)<font style="color:#333333;">  
</font>**#**<font style="color:#0086B3;">where</font><font style="color:#333333;"> to write logging data.</font><font style="color:#333333;">  
</font><font style="color:#333333;">systemLog:  
</font><font style="color:#333333;">  destination: file  
</font><font style="color:#333333;">  logAppend: true  
</font><font style="color:#333333;">  path: /data/logs/mongodb4.log        //mongodb4</font><font style="color:#333333;">的日志文件路径</font><font style="color:#333333;">  
</font>**#**<font style="color:#333333;">Where and how to store data.</font><font style="color:#333333;">  
</font><font style="color:#333333;">storage:  
</font><font style="color:#333333;">  dbPath: /data/mongodb/mongodb4/          //mongodb4</font><font style="color:#333333;">的数据文件路径</font><font style="color:#333333;">  
</font><font style="color:#333333;">  journal:  
</font><font style="color:#333333;">    enabled: true  
</font>**#**<font style="color:#333333;">engine:</font><font style="color:#333333;">  
</font>**#**<font style="color:#333333;">mmapv1:</font><font style="color:#333333;">  
</font>**#**<font style="color:#333333;">wiredTiger:</font><font style="color:#333333;">  
</font>**#**<font style="color:#333333;">how the process runs</font><font style="color:#333333;">  
</font><font style="color:#333333;">processManagement:  
</font><font style="color:#333333;">  fork: true  # fork and run in background  
</font><font style="color:#333333;">  pidFilePath: /data/mongodb/mongodb1/mongod.pid  # location of pidfile  
</font><font style="color:#333333;">  timeZoneInfo: /usr/share/zoneinfo  
</font>**#**<font style="color:#333333;">network interfaces</font><font style="color:#333333;">  
</font><font style="color:#333333;">net:  
</font><font style="color:#333333;">  port: 27020                   //mongodb4</font><font style="color:#333333;">的进程号</font><font style="color:#333333;">  
</font><font style="color:#333333;">  bindIp: 0.0.0.0  # Listen to local interface only, comment to listen on all interfaces.  
</font>**#**<font style="color:#333333;">security:</font><font style="color:#333333;">  
</font>**#**<font style="color:#333333;">operationProfiling:</font><font style="color:#333333;">  
</font><font style="color:#333333;">replication:                    //</font><font style="color:#333333;">删除</font><font style="color:#333333;">“#”</font><font style="color:#333333;">，开启复制集功能</font><font style="color:#333333;">  
</font><font style="color:#333333;">    replSetName: test-rc        //</font><font style="color:#333333;">名称为</font><font style="color:#333333;">test-rc  
</font>**#**<font style="color:#333333;">sharding:</font><font style="color:#333333;">  
</font>**#**_#Enterprise-Only Options_<font style="color:#333333;">  
</font>**#**<font style="color:#333333;">auditLog:</font><font style="color:#333333;">  
</font>**#**<font style="color:#333333;">snmp:</font>

**5. 启动mongodb多实例**

**for**<font style="color:#333333;"> i </font>**in**<font style="color:#333333;"> 1 2 3 4  
</font>**do**<font style="color:#333333;">  
</font><font style="color:#333333;">        mongod </font><font style="color:#333333;">-f</font><font style="color:#333333;">/data/conf/mongodb</font><font style="color:teal;">$i</font><font style="color:#333333;">.conf  
</font>**done**

**检查mongod的进程信息**

<font style="color:#333333;">[root@localhost conf]</font>_# netstat -tunlp | grep mongod_

![](assets/07-Database/ddb76e3dc2e72d9e0e38.png)

**6.开始配置三个节点的复制集**

**6.1 登录默认MongoDB（默认端口号为：27017）**

mongo

**6.2 查看复制集的状态信息**

**>**<font style="color:#333333;"> rs.status()</font>

![](assets/07-Database/e43adf5ddbd5338a4414.png)

**6.3 定义cfg初始化参数(这里先加入三台，另一台后面实现添加节点功能)**

**>**<font style="color:#333333;"> cfg={</font><font style="color:#DD1144;">"_id"</font><font style="color:#333333;">:</font><font style="color:#DD1144;">"test-rc"</font><font style="color:#333333;">,</font><font style="color:#DD1144;">"members"</font><font style="color:#333333;">:[{</font><font style="color:#DD1144;">"_id"</font><font style="color:#333333;">:0,</font><font style="color:#DD1144;">"host"</font><font style="color:#333333;">:</font><font style="color:#DD1144;">"192.168.100.100:27017"</font><font style="color:#333333;">},{</font><font style="color:#DD1144;">"_id"</font><font style="color:#333333;">:1,</font><font style="color:#DD1144;">"host"</font><font style="color:#333333;">:</font><font style="color:#DD1144;">"192.168.100.100:27018"</font><font style="color:#333333;">},{</font><font style="color:#DD1144;">"_id"</font><font style="color:#333333;">:2,</font><font style="color:#DD1144;">"host"</font><font style="color:#333333;">:</font><font style="color:#DD1144;">"192.168.100.100:27019"</font><font style="color:#333333;">}]}</font>

![](assets/07-Database/cb9560eb6602e4182cb5.png)

**6.4 启动复制集功能（初始化配置时保证从节点没有数据）**

**>**<font style="color:#333333;"> rs.initiate(cfg)</font>

![](assets/07-Database/8781c204d76cf31d8dbf.png)

**6.5 查看复制集的状态信息**

**test-rc**:PRIMARY> **rs**.status()

<font style="color:#333333;">{  
</font><font style="color:#333333;">    </font><font style="color:#DD1144;">"set"</font><font style="color:#333333;"> : </font><font style="color:#DD1144;">"test-rc"</font><font style="color:#333333;">,  
</font><font style="color:#333333;">    </font><font style="color:#DD1144;">"date"</font><font style="color:#333333;"> : ISODate(</font><font style="color:#DD1144;">"2018-07-14T04:46:58.710Z"</font><font style="color:#333333;">),  
</font><font style="color:#333333;">    </font><font style="color:#DD1144;">"myState"</font><font style="color:#333333;"> : </font><font style="color:teal;">1</font><font style="color:#333333;">,  
</font><font style="color:#333333;">    </font><font style="color:#DD1144;">"term"</font><font style="color:#333333;"> : NumberLong(</font><font style="color:teal;">1</font><font style="color:#333333;">),  
</font><font style="color:#333333;">    </font><font style="color:#DD1144;">"syncingTo"</font><font style="color:#333333;"> : </font><font style="color:#DD1144;">""</font><font style="color:#333333;">,  
</font><font style="color:#333333;">    </font><font style="color:#DD1144;">"syncSourceHost"</font><font style="color:#333333;"> : </font><font style="color:#DD1144;">""</font><font style="color:#333333;">,  
</font><font style="color:#333333;">    </font><font style="color:#DD1144;">"syncSourceId"</font><font style="color:#333333;"> : </font><font style="color:teal;">-1</font><font style="color:#333333;">,  
</font><font style="color:#333333;">    </font><font style="color:#DD1144;">"heartbeatIntervalMillis"</font><font style="color:#333333;"> : NumberLong(</font><font style="color:teal;">2000</font><font style="color:#333333;">),  
</font><font style="color:#333333;">    </font><font style="color:#DD1144;">"optimes"</font><font style="color:#333333;"> : {  
</font><font style="color:#333333;">        </font><font style="color:#DD1144;">"lastCommittedOpTime"</font><font style="color:#333333;"> : {  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"ts"</font><font style="color:#333333;"> : Timestamp(</font><font style="color:teal;">1531543618</font><font style="color:#333333;">, </font><font style="color:teal;">1</font><font style="color:#333333;">),  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"t"</font><font style="color:#333333;"> : NumberLong(</font><font style="color:teal;">1</font><font style="color:#333333;">)  
</font><font style="color:#333333;">        },  
</font><font style="color:#333333;">        </font><font style="color:#DD1144;">"readConcernMajorityOpTime"</font><font style="color:#333333;"> : {  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"ts"</font><font style="color:#333333;"> : Timestamp(</font><font style="color:teal;">1531543618</font><font style="color:#333333;">, </font><font style="color:teal;">1</font><font style="color:#333333;">),  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"t"</font><font style="color:#333333;"> : NumberLong(</font><font style="color:teal;">1</font><font style="color:#333333;">)  
</font><font style="color:#333333;">        },  
</font><font style="color:#333333;">        </font><font style="color:#DD1144;">"appliedOpTime"</font><font style="color:#333333;"> : {  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"ts"</font><font style="color:#333333;"> : Timestamp(</font><font style="color:teal;">1531543618</font><font style="color:#333333;">, </font><font style="color:teal;">1</font><font style="color:#333333;">),  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"t"</font><font style="color:#333333;"> : NumberLong(</font><font style="color:teal;">1</font><font style="color:#333333;">)  
</font><font style="color:#333333;">        },  
</font><font style="color:#333333;">        </font><font style="color:#DD1144;">"durableOpTime"</font><font style="color:#333333;"> : {  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"ts"</font><font style="color:#333333;"> : Timestamp(</font><font style="color:teal;">1531543618</font><font style="color:#333333;">, </font><font style="color:teal;">1</font><font style="color:#333333;">),  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"t"</font><font style="color:#333333;"> : NumberLong(</font><font style="color:teal;">1</font><font style="color:#333333;">)  
</font><font style="color:#333333;">        }  
</font><font style="color:#333333;">    },  
</font><font style="color:#333333;">    </font><font style="color:#DD1144;">"lastStableCheckpointTimestamp"</font><font style="color:#333333;"> : Timestamp(</font><font style="color:teal;">1531543608</font><font style="color:#333333;">, </font><font style="color:teal;">1</font><font style="color:#333333;">),  
</font><font style="color:#333333;">    </font><font style="color:#DD1144;">"members"</font><font style="color:#333333;"> : [  
</font><font style="color:#333333;">        {  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"_id"</font><font style="color:#333333;"> : </font><font style="color:teal;">0</font><font style="color:#333333;">,  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"name"</font><font style="color:#333333;"> : </font><font style="color:#DD1144;">"192.168.100.100:27017"</font><font style="color:#333333;">,  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"health"</font><font style="color:#333333;"> : </font><font style="color:teal;">1</font><font style="color:#333333;">,               </font>_//健康状态_<font style="color:#333333;">  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"state"</font><font style="color:#333333;"> : </font><font style="color:teal;">1</font><font style="color:#333333;">,                </font>_//1：为主节点   ； 2：为从节点_<font style="color:#333333;">  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"stateStr"</font><font style="color:#333333;"> : </font><font style="color:#DD1144;">"PRIMARY"</font><font style="color:#333333;">,         </font>_//主节点_<font style="color:#333333;">  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"uptime"</font><font style="color:#333333;"> : </font><font style="color:teal;">2886</font><font style="color:#333333;">,  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"optime"</font><font style="color:#333333;"> : {  
</font><font style="color:#333333;">                </font><font style="color:#DD1144;">"ts"</font><font style="color:#333333;"> : Timestamp(</font><font style="color:teal;">1531543618</font><font style="color:#333333;">, </font><font style="color:teal;">1</font><font style="color:#333333;">),  
</font><font style="color:#333333;">                </font><font style="color:#DD1144;">"t"</font><font style="color:#333333;"> : NumberLong(</font><font style="color:teal;">1</font><font style="color:#333333;">)  
</font><font style="color:#333333;">            },  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"optimeDate"</font><font style="color:#333333;"> : ISODate(</font><font style="color:#DD1144;">"2018-07-14T04:46:58Z"</font><font style="color:#333333;">),  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"syncingTo"</font><font style="color:#333333;"> : </font><font style="color:#DD1144;">""</font><font style="color:#333333;">,  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"syncSourceHost"</font><font style="color:#333333;"> : </font><font style="color:#DD1144;">""</font><font style="color:#333333;">,  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"syncSourceId"</font><font style="color:#333333;"> : </font><font style="color:teal;">-1</font><font style="color:#333333;">,  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"infoMessage"</font><font style="color:#333333;"> : </font><font style="color:#DD1144;">""</font><font style="color:#333333;">,  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"electionTime"</font><font style="color:#333333;"> : Timestamp(</font><font style="color:teal;">1531543426</font><font style="color:#333333;">, </font><font style="color:teal;">1</font><font style="color:#333333;">),  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"electionDate"</font><font style="color:#333333;"> : ISODate(</font><font style="color:#DD1144;">"2018-07-14T04:43:46Z"</font><font style="color:#333333;">),  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"configVersion"</font><font style="color:#333333;"> : </font><font style="color:teal;">1</font><font style="color:#333333;">,  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"self"</font><font style="color:#333333;"> : </font><font style="color:teal;">true</font><font style="color:#333333;">,  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"lastHeartbeatMessage"</font><font style="color:#333333;"> : </font><font style="color:#DD1144;">""</font><font style="color:#333333;">  
</font><font style="color:#333333;">        },  
</font><font style="color:#333333;">        {  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"_id"</font><font style="color:#333333;"> : </font><font style="color:teal;">1</font><font style="color:#333333;">,  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"name"</font><font style="color:#333333;"> : </font><font style="color:#DD1144;">"192.168.100.100:27018"</font><font style="color:#333333;">,  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"health"</font><font style="color:#333333;"> : </font><font style="color:teal;">1</font><font style="color:#333333;">,               </font>_//健康状态_<font style="color:#333333;">  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"state"</font><font style="color:#333333;"> : </font><font style="color:teal;">2</font><font style="color:#333333;">,                </font>_//1：为主节点   ； 2：为从节点_<font style="color:#333333;">  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"stateStr"</font><font style="color:#333333;"> : </font><font style="color:#DD1144;">"SECONDARY"</font><font style="color:#333333;">,         </font>_//从节点_<font style="color:#333333;">  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"uptime"</font><font style="color:#333333;"> : </font><font style="color:teal;">202</font><font style="color:#333333;">,  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"optime"</font><font style="color:#333333;"> : {  
</font><font style="color:#333333;">                </font><font style="color:#DD1144;">"ts"</font><font style="color:#333333;"> : Timestamp(</font><font style="color:teal;">1531543608</font><font style="color:#333333;">, </font><font style="color:teal;">1</font><font style="color:#333333;">),  
</font><font style="color:#333333;">                </font><font style="color:#DD1144;">"t"</font><font style="color:#333333;"> : NumberLong(</font><font style="color:teal;">1</font><font style="color:#333333;">)  
</font><font style="color:#333333;">            },  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"optimeDurable"</font><font style="color:#333333;"> : {  
</font><font style="color:#333333;">                </font><font style="color:#DD1144;">"ts"</font><font style="color:#333333;"> : Timestamp(</font><font style="color:teal;">1531543608</font><font style="color:#333333;">, </font><font style="color:teal;">1</font><font style="color:#333333;">),  
</font><font style="color:#333333;">                </font><font style="color:#DD1144;">"t"</font><font style="color:#333333;"> : NumberLong(</font><font style="color:teal;">1</font><font style="color:#333333;">)  
</font><font style="color:#333333;">            },  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"optimeDate"</font><font style="color:#333333;"> : ISODate(</font><font style="color:#DD1144;">"2018-07-14T04:46:48Z"</font><font style="color:#333333;">),  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"optimeDurableDate"</font><font style="color:#333333;"> : ISODate(</font><font style="color:#DD1144;">"2018-07-14T04:46:48Z"</font><font style="color:#333333;">),  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"lastHeartbeat"</font><font style="color:#333333;"> : ISODate(</font><font style="color:#DD1144;">"2018-07-14T04:46:56.765Z"</font><font style="color:#333333;">),  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"lastHeartbeatRecv"</font><font style="color:#333333;"> : ISODate(</font><font style="color:#DD1144;">"2018-07-14T04:46:57.395Z"</font><font style="color:#333333;">),  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"pingMs"</font><font style="color:#333333;"> : NumberLong(</font><font style="color:teal;">0</font><font style="color:#333333;">),  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"lastHeartbeatMessage"</font><font style="color:#333333;"> : </font><font style="color:#DD1144;">""</font><font style="color:#333333;">,  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"syncingTo"</font><font style="color:#333333;"> : </font><font style="color:#DD1144;">"192.168.100.100:27017"</font><font style="color:#333333;">,  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"syncSourceHost"</font><font style="color:#333333;"> : </font><font style="color:#DD1144;">"192.168.100.100:27017"</font><font style="color:#333333;">,  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"syncSourceId"</font><font style="color:#333333;"> : </font><font style="color:teal;">0</font><font style="color:#333333;">,  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"infoMessage"</font><font style="color:#333333;"> : </font><font style="color:#DD1144;">""</font><font style="color:#333333;">,  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"configVersion"</font><font style="color:#333333;"> : </font><font style="color:teal;">1</font><font style="color:#333333;">  
</font><font style="color:#333333;">        },  
</font><font style="color:#333333;">        {  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"_id"</font><font style="color:#333333;"> : </font><font style="color:teal;">2</font><font style="color:#333333;">,  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"name"</font><font style="color:#333333;"> : </font><font style="color:#DD1144;">"192.168.100.100:27019"</font><font style="color:#333333;">,  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"health"</font><font style="color:#333333;"> : </font><font style="color:teal;">1</font><font style="color:#333333;">,               </font>_//健康状态_<font style="color:#333333;">  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"state"</font><font style="color:#333333;"> : </font><font style="color:teal;">2</font><font style="color:#333333;">,                </font>_//1：为主节点   ； 2：为从节点_<font style="color:#333333;">  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"stateStr"</font><font style="color:#333333;"> : </font><font style="color:#DD1144;">"SECONDARY"</font><font style="color:#333333;">,         </font>_//从节点_<font style="color:#333333;">  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"uptime"</font><font style="color:#333333;"> : </font><font style="color:teal;">202</font><font style="color:#333333;">,  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"optime"</font><font style="color:#333333;"> : {  
</font><font style="color:#333333;">                </font><font style="color:#DD1144;">"ts"</font><font style="color:#333333;"> : Timestamp(</font><font style="color:teal;">1531543608</font><font style="color:#333333;">, </font><font style="color:teal;">1</font><font style="color:#333333;">),  
</font><font style="color:#333333;">                </font><font style="color:#DD1144;">"t"</font><font style="color:#333333;"> : NumberLong(</font><font style="color:teal;">1</font><font style="color:#333333;">)  
</font><font style="color:#333333;">            },  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"optimeDurable"</font><font style="color:#333333;"> : {  
</font><font style="color:#333333;">                </font><font style="color:#DD1144;">"ts"</font><font style="color:#333333;"> : Timestamp(</font><font style="color:teal;">1531543608</font><font style="color:#333333;">, </font><font style="color:teal;">1</font><font style="color:#333333;">),  
</font><font style="color:#333333;">                </font><font style="color:#DD1144;">"t"</font><font style="color:#333333;"> : NumberLong(</font><font style="color:teal;">1</font><font style="color:#333333;">)  
</font><font style="color:#333333;">            },  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"optimeDate"</font><font style="color:#333333;"> : ISODate(</font><font style="color:#DD1144;">"2018-07-14T04:46:48Z"</font><font style="color:#333333;">),  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"optimeDurableDate"</font><font style="color:#333333;"> : ISODate(</font><font style="color:#DD1144;">"2018-07-14T04:46:48Z"</font><font style="color:#333333;">),  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"lastHeartbeat"</font><font style="color:#333333;"> : ISODate(</font><font style="color:#DD1144;">"2018-07-14T04:46:56.769Z"</font><font style="color:#333333;">),  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"lastHeartbeatRecv"</font><font style="color:#333333;"> : ISODate(</font><font style="color:#DD1144;">"2018-07-14T04:46:57.441Z"</font><font style="color:#333333;">),  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"pingMs"</font><font style="color:#333333;"> : NumberLong(</font><font style="color:teal;">0</font><font style="color:#333333;">),  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"lastHeartbeatMessage"</font><font style="color:#333333;"> : </font><font style="color:#DD1144;">""</font><font style="color:#333333;">,  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"syncingTo"</font><font style="color:#333333;"> : </font><font style="color:#DD1144;">"192.168.100.100:27017"</font><font style="color:#333333;">,  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"syncSourceHost"</font><font style="color:#333333;"> : </font><font style="color:#DD1144;">"192.168.100.100:27017"</font><font style="color:#333333;">,  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"syncSourceId"</font><font style="color:#333333;"> : </font><font style="color:teal;">0</font><font style="color:#333333;">,  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"infoMessage"</font><font style="color:#333333;"> : </font><font style="color:#DD1144;">""</font><font style="color:#333333;">,  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"configVersion"</font><font style="color:#333333;"> : </font><font style="color:teal;">1</font><font style="color:#333333;">  
</font><font style="color:#333333;">        }  
</font><font style="color:#333333;">    ],  
</font><font style="color:#333333;">    </font><font style="color:#DD1144;">"ok"</font><font style="color:#333333;"> : </font><font style="color:teal;">1</font><font style="color:#333333;">,  
</font><font style="color:#333333;">    </font><font style="color:#DD1144;">"operationTime"</font><font style="color:#333333;"> : Timestamp(</font><font style="color:teal;">1531543618</font><font style="color:#333333;">, </font><font style="color:teal;">1</font><font style="color:#333333;">),  
</font><font style="color:#333333;">    </font><font style="color:#DD1144;">"$clusterTime"</font><font style="color:#333333;"> : {  
</font><font style="color:#333333;">        </font><font style="color:#DD1144;">"clusterTime"</font><font style="color:#333333;"> : Timestamp(</font><font style="color:teal;">1531543618</font><font style="color:#333333;">, </font><font style="color:teal;">1</font><font style="color:#333333;">),  
</font><font style="color:#333333;">        </font><font style="color:#DD1144;">"signature"</font><font style="color:#333333;"> : {  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"hash"</font><font style="color:#333333;"> : BinData(</font><font style="color:teal;">0</font><font style="color:#333333;">,</font><font style="color:#DD1144;">"AAAAAAAAAAAAAAAAAAAAAAAAAAA="</font><font style="color:#333333;">),  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"keyId"</font><font style="color:#333333;"> : NumberLong(</font><font style="color:teal;">0</font><font style="color:#333333;">)  
</font><font style="color:#333333;">        }  
</font><font style="color:#333333;">    }  
</font><font style="color:#333333;">}</font>

**特别提醒：如以上可知道主节点在192.168.100.100:27017节点上**

**注意：严禁在从库做任何修改操作**

**7. 添加节点**

**test-rc**:PRIMARY>  **rs**.add("192.168.100.100:27020")

![](assets/07-Database/32a34a298861d9b8a06b.png)

**查看复制集的状态信息**

**test-rc**:PRIMARY>  **rs**.status()

![](assets/07-Database/964cc2b67fd8cc546640.png)

**8. 删除节点**

**test-rc**:PRIMARY>  **rs**.remove("192.168.100.100:27018")

![](assets/07-Database/e6560b15e5eb9e1e3718.png)

**查看复制集的状态信息**

**test-rc**:PRIMARY>  **rs**.status()

**发现192.168.100.100:27018节点已经没有相关信息了**

**9. 故障转移切换**

**9.1 退出MongoDB**

<font style="color:#0086B3;">test</font><font style="color:#333333;">-rc:PRIMARY> </font><font style="color:#0086B3;">exit</font>

**9.2 查看mongod进程信息**

<font style="color:navy;">netstat</font><font style="color:#333333;"> -tunlp | grep mongod</font>

![](assets/07-Database/4125166644c61fc52b1a.png)

**可以查看到共有4个实例的进程信息**

**9.3 结束主节点：端口号为27017的进程，检查是否能够自动切换**

<font style="color:#0086B3;">kill</font><font style="color:#333333;"> -9 48211        </font>

![](assets/07-Database/0c6e8001513126539767.png)

**9.4 登录MongoDB端口号为27019的实例**

<font style="color:navy;">mongo</font><font style="color:#333333;"> --port </font><font style="color:teal;">27019</font>

**9.5 查看各节点状态信息**

**test-rc**:PRIMARY>  **rs**.status()

<font style="color:#333333;">{  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"_id"</font><font style="color:#333333;"> : 2,  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"name"</font><font style="color:#333333;"> : </font><font style="color:#DD1144;">"192.168.100.100:27019"</font><font style="color:#333333;">,  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"health"</font><font style="color:#333333;"> : 1,  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"state"</font><font style="color:#333333;"> : 1,  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"stateStr"</font><font style="color:#333333;"> : </font><font style="color:#DD1144;">"PRIMARY"</font><font style="color:#333333;">,  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"uptime"</font><font style="color:#333333;"> : 1547,  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"optime"</font><font style="color:#333333;"> : {  
</font><font style="color:#333333;">                </font><font style="color:#DD1144;">"ts"</font><font style="color:#333333;"> : Timestamp(1531544567, 1),  
</font><font style="color:#333333;">                </font><font style="color:#DD1144;">"t"</font><font style="color:#333333;"> : NumberLong(2)  
</font><font style="color:#333333;">            },  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"optimeDate"</font><font style="color:#333333;"> : ISODate(</font><font style="color:#DD1144;">"2018-07-14T05:02:47Z"</font><font style="color:#333333;">),  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"syncingTo"</font><font style="color:#333333;"> : </font><font style="color:#DD1144;">""</font><font style="color:#333333;">,  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"syncSourceHost"</font><font style="color:#333333;"> : </font><font style="color:#DD1144;">""</font><font style="color:#333333;">,  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"syncSourceId"</font><font style="color:#333333;"> : -1,  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"infoMessage"</font><font style="color:#333333;"> : </font><font style="color:#DD1144;">""</font><font style="color:#333333;">,  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"electionTime"</font><font style="color:#333333;"> : Timestamp(1531544345, 1),  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"electionDate"</font><font style="color:#333333;"> : ISODate(</font><font style="color:#DD1144;">"2018-07-14T04:59:05Z"</font><font style="color:#333333;">),  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"configVersion"</font><font style="color:#333333;"> : 3,  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"self"</font><font style="color:#333333;"> : </font><font style="color:teal;">true</font><font style="color:#333333;">,  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"lastHeartbeatMessage"</font><font style="color:#333333;"> : </font><font style="color:#DD1144;">""</font><font style="color:#333333;">  
</font><font style="color:#333333;">        },  
</font><font style="color:#333333;">        {  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"_id"</font><font style="color:#333333;"> : 3,  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"name"</font><font style="color:#333333;"> : </font><font style="color:#DD1144;">"192.168.100.100:27020"</font><font style="color:#333333;">,  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"health"</font><font style="color:#333333;"> : 1,  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"state"</font><font style="color:#333333;"> : 2,  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"stateStr"</font><font style="color:#333333;"> : </font><font style="color:#DD1144;">"SECONDARY"</font><font style="color:#333333;">,  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"uptime"</font><font style="color:#333333;"> : 700,  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"optime"</font><font style="color:#333333;"> : {  
</font><font style="color:#333333;">                </font><font style="color:#DD1144;">"ts"</font><font style="color:#333333;"> : Timestamp(1531544567, 1),  
</font><font style="color:#333333;">                </font><font style="color:#DD1144;">"t"</font><font style="color:#333333;"> : NumberLong(2)  
</font><font style="color:#333333;">            },  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"optimeDurable"</font><font style="color:#333333;"> : {  
</font><font style="color:#333333;">                </font><font style="color:#DD1144;">"ts"</font><font style="color:#333333;"> : Timestamp(1531544567, 1),  
</font><font style="color:#333333;">                </font><font style="color:#DD1144;">"t"</font><font style="color:#333333;"> : NumberLong(2)  
</font><font style="color:#333333;">            },  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"optimeDate"</font><font style="color:#333333;"> : ISODate(</font><font style="color:#DD1144;">"2018-07-14T05:02:47Z"</font><font style="color:#333333;">),  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"optimeDurableDate"</font><font style="color:#333333;"> : ISODate(</font><font style="color:#DD1144;">"2018-07-14T05:02:47Z"</font><font style="color:#333333;">),  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"lastHeartbeat"</font><font style="color:#333333;"> : ISODate(</font><font style="color:#DD1144;">"2018-07-14T05:02:56.150Z"</font><font style="color:#333333;">),  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"lastHeartbeatRecv"</font><font style="color:#333333;"> : ISODate(</font><font style="color:#DD1144;">"2018-07-14T05:02:56.289Z"</font><font style="color:#333333;">),  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"pingMs"</font><font style="color:#333333;"> : NumberLong(0),  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"lastHeartbeatMessage"</font><font style="color:#333333;"> : </font><font style="color:#DD1144;">""</font><font style="color:#333333;">,  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"syncingTo"</font><font style="color:#333333;"> : </font><font style="color:#DD1144;">"192.168.100.100:27019"</font><font style="color:#333333;">,  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"syncSourceHost"</font><font style="color:#333333;"> : </font><font style="color:#DD1144;">"192.168.100.100:27019"</font><font style="color:#333333;">,  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"syncSourceId"</font><font style="color:#333333;"> : 2,  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"infoMessage"</font><font style="color:#333333;"> : </font><font style="color:#DD1144;">""</font><font style="color:#333333;">,  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"configVersion"</font><font style="color:#333333;"> : 3  
</font><font style="color:#333333;">        }</font>

**特别提醒：主节点已经到192.168.100.100:27019节点上，说明主节点已经自动切换了**

**10. 手动切换主节点**

**10.1 暂停30s不参与选举**

**test-rc**:PRIMARY> **rs**.freeze(30)

<font style="color:#333333;">{  
</font><font style="color:#333333;">    </font><font style="color:#DD1144;">"operationTime"</font><font style="color:#333333;"> : Timestamp(1531544867, 1),  
</font><font style="color:#333333;">    </font><font style="color:#DD1144;">"ok"</font><font style="color:#333333;"> : 0,  
</font><font style="color:#333333;">    </font><font style="color:#DD1144;">"errmsg"</font><font style="color:#333333;"> : </font><font style="color:#DD1144;">"cannot freeze node when primary or running for election. state: Primary"</font><font style="color:#333333;">,  
</font><font style="color:#333333;">    </font><font style="color:#DD1144;">"code"</font><font style="color:#333333;"> : 95,  
</font><font style="color:#333333;">    </font><font style="color:#DD1144;">"codeName"</font><font style="color:#333333;"> : </font><font style="color:#DD1144;">"NotSecondary"</font><font style="color:#333333;">,  
</font><font style="color:#333333;">    </font><font style="color:#DD1144;">"</font><font style="color:teal;">$clusterTime</font><font style="color:#DD1144;">"</font><font style="color:#333333;"> : {  
</font><font style="color:#333333;">        </font><font style="color:#DD1144;">"clusterTime"</font><font style="color:#333333;"> : Timestamp(1531544867, 1),  
</font><font style="color:#333333;">        </font><font style="color:#DD1144;">"signature"</font><font style="color:#333333;"> : {  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"hash"</font><font style="color:#333333;"> : B</font>**in**<font style="color:#333333;">Data(0,</font><font style="color:#DD1144;">"AAAAAAAAAAAAAAAAAAAAAAAAAAA="</font><font style="color:#333333;">),  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"keyId"</font><font style="color:#333333;"> : NumberLong(0)  
</font><font style="color:#333333;">        }  
</font><font style="color:#333333;">    }  
</font><font style="color:#333333;">}</font>

**10.2 交出主节点位置，维持从节点状态不少于60秒，等待30秒使主节点和从节点日志同步**

test-rc:PRIMARY> rs.stepDown(60,30)

**> **<font style="color:#0086B3;">test</font><font style="color:#333333;">-rc:PRIMARY> rs.stepDown(60,30)</font>

<font style="color:teal;">2018-07-14</font><font style="color:#333333;">T01:</font><font style="color:teal;">08</font><font style="color:#333333;">:</font><font style="color:teal;">07.326-0400</font><font style="color:#333333;"> E QUERY    [js] Error: error doing query: failed: network error </font>**while**<font style="color:#333333;"> attempting to run command </font><font style="color:#DD1144;">'replSetStepDown'</font><font style="color:teal;">on</font><font style="color:#333333;"> host </font><font style="color:#DD1144;">'127.0.0.1:27019'</font><font style="color:#333333;"> :  
</font><font style="color:#333333;">DB.prototype.runCommand@src/mongo/shell/db.js:</font><font style="color:teal;">168</font><font style="color:#333333;">:</font><font style="color:teal;">1</font><font style="color:#333333;">  
</font><font style="color:#333333;">DB.prototype.adminCommand@src/mongo/shell/db.js:</font><font style="color:teal;">186</font><font style="color:#333333;">:</font><font style="color:teal;">16</font><font style="color:#333333;">  
</font><font style="color:#333333;">rs.stepDown@src/mongo/shell/utils.js:</font><font style="color:teal;">1398</font><font style="color:#333333;">:</font><font style="color:teal;">12</font><font style="color:#333333;">  
</font><font style="color:#333333;">@(shell):</font><font style="color:teal;">1</font><font style="color:#333333;">:</font><font style="color:teal;">1</font><font style="color:#333333;">  
</font><font style="color:teal;">2018-07-14</font><font style="color:#333333;">T01:</font><font style="color:teal;">08</font><font style="color:#333333;">:</font><font style="color:teal;">07.328-0400</font><font style="color:#333333;"> I NETWORK  [js] trying reconnect to </font><font style="color:teal;">127.0.0.1</font><font style="color:#333333;">:</font><font style="color:teal;">27019</font><font style="color:#333333;"> failed  
</font><font style="color:teal;">2018-07-14</font><font style="color:#333333;">T01:</font><font style="color:teal;">08</font><font style="color:#333333;">:</font><font style="color:teal;">07.329-0400</font><font style="color:#333333;"> I NETWORK  [js] reconnect </font><font style="color:teal;">127.0.0.1</font><font style="color:#333333;">:</font><font style="color:teal;">27019</font><font style="color:#333333;"> ok</font>

**10.3 查看复制集的状态信息**

**> **<font style="color:#0086B3;">test</font><font style="color:#333333;">-rc:PRIMARY> rs.status()</font>

<font style="color:#333333;">{  
</font><font style="color:#333333;">    </font><font style="color:#DD1144;">"set"</font><font style="color:#333333;"> : </font><font style="color:#DD1144;">"test-rc"</font><font style="color:#333333;">,  
</font><font style="color:#333333;">    </font><font style="color:#DD1144;">"date"</font><font style="color:#333333;"> : ISODate(</font><font style="color:#DD1144;">"2018-07-14T05:10:31.161Z"</font><font style="color:#333333;">),  
</font><font style="color:#333333;">    </font><font style="color:#DD1144;">"myState"</font><font style="color:#333333;"> : 2,  
</font><font style="color:#333333;">    </font><font style="color:#DD1144;">"term"</font><font style="color:#333333;"> : NumberLong(3),  
</font><font style="color:#333333;">    </font><font style="color:#DD1144;">"syncingTo"</font><font style="color:#333333;"> : </font><font style="color:#DD1144;">"192.168.100.100:27020"</font><font style="color:#333333;">,  
</font><font style="color:#333333;">    </font><font style="color:#DD1144;">"syncSourceHost"</font><font style="color:#333333;"> : </font><font style="color:#DD1144;">"192.168.100.100:27020"</font><font style="color:#333333;">,  
</font><font style="color:#333333;">    </font><font style="color:#DD1144;">"syncSourceId"</font><font style="color:#333333;"> : 3,  
</font><font style="color:#333333;">    </font><font style="color:#DD1144;">"heartbeatIntervalMillis"</font><font style="color:#333333;"> : NumberLong(2000),  
</font><font style="color:#333333;">    </font><font style="color:#DD1144;">"optimes"</font><font style="color:#333333;"> : {  
</font><font style="color:#333333;">        </font><font style="color:#DD1144;">"lastCommittedOpTime"</font><font style="color:#333333;"> : {  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"ts"</font><font style="color:#333333;"> : Timestamp(1531545028, 1),  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"t"</font><font style="color:#333333;"> : NumberLong(3)  
</font><font style="color:#333333;">        },  
</font><font style="color:#333333;">        </font><font style="color:#DD1144;">"readConcernMajorityOpTime"</font><font style="color:#333333;"> : {  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"ts"</font><font style="color:#333333;"> : Timestamp(1531545028, 1),  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"t"</font><font style="color:#333333;"> : NumberLong(3)  
</font><font style="color:#333333;">        },  
</font><font style="color:#333333;">        </font><font style="color:#DD1144;">"appliedOpTime"</font><font style="color:#333333;"> : {  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"ts"</font><font style="color:#333333;"> : Timestamp(1531545028, 1),  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"t"</font><font style="color:#333333;"> : NumberLong(3)  
</font><font style="color:#333333;">        },  
</font><font style="color:#333333;">        </font><font style="color:#DD1144;">"durableOpTime"</font><font style="color:#333333;"> : {  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"ts"</font><font style="color:#333333;"> : Timestamp(1531545028, 1),  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"t"</font><font style="color:#333333;"> : NumberLong(3)  
</font><font style="color:#333333;">        }  
</font><font style="color:#333333;">    },  
</font><font style="color:#333333;">    </font><font style="color:#DD1144;">"lastStableCheckpointTimestamp"</font><font style="color:#333333;"> : Timestamp(1531545018, 1),  
</font><font style="color:#333333;">    </font><font style="color:#DD1144;">"members"</font><font style="color:#333333;"> : [  
</font><font style="color:#333333;">        {  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"_id"</font><font style="color:#333333;"> : 0,  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"name"</font><font style="color:#333333;"> : </font><font style="color:#DD1144;">"192.168.100.100:27017"</font><font style="color:#333333;">,  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"health"</font><font style="color:#333333;"> : 1,  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"state"</font><font style="color:#333333;"> : 2,  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"stateStr"</font><font style="color:#333333;"> : </font><font style="color:#DD1144;">"SECONDARY"</font><font style="color:#333333;">,  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"uptime"</font><font style="color:#333333;"> : 70,  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"optime"</font><font style="color:#333333;"> : {  
</font><font style="color:#333333;">                </font><font style="color:#DD1144;">"ts"</font><font style="color:#333333;"> : Timestamp(1531545028, 1),  
</font><font style="color:#333333;">                </font><font style="color:#DD1144;">"t"</font><font style="color:#333333;"> : NumberLong(3)  
</font><font style="color:#333333;">            },  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"optimeDate"</font><font style="color:#333333;"> : ISODate(</font><font style="color:#DD1144;">"2018-07-14T05:10:28Z"</font><font style="color:#333333;">),  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"syncingTo"</font><font style="color:#333333;"> : </font><font style="color:#DD1144;">"192.168.100.100:27020"</font><font style="color:#333333;">,  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"syncSourceHost"</font><font style="color:#333333;"> : </font><font style="color:#DD1144;">"192.168.100.100:27020"</font><font style="color:#333333;">,  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"syncSourceId"</font><font style="color:#333333;"> : 3,  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"infoMessage"</font><font style="color:#333333;"> : </font><font style="color:#DD1144;">""</font><font style="color:#333333;">,  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"configVersion"</font><font style="color:#333333;"> : 3,  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"self"</font><font style="color:#333333;"> : </font><font style="color:teal;">true</font><font style="color:#333333;">,  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"lastHeartbeatMessage"</font><font style="color:#333333;"> : </font><font style="color:#DD1144;">""</font><font style="color:#333333;">  
</font><font style="color:#333333;">        },  
</font><font style="color:#333333;">        {  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"_id"</font><font style="color:#333333;"> : 2,  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"name"</font><font style="color:#333333;"> : </font><font style="color:#DD1144;">"192.168.100.100:27019"</font><font style="color:#333333;">,  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"health"</font><font style="color:#333333;"> : 1,  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"state"</font><font style="color:#333333;"> : 2,  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"stateStr"</font><font style="color:#333333;"> : </font><font style="color:#DD1144;">"SECONDARY"</font><font style="color:#333333;">,  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"uptime"</font><font style="color:#333333;"> : 68,  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"optime"</font><font style="color:#333333;"> : {  
</font><font style="color:#333333;">                </font><font style="color:#DD1144;">"ts"</font><font style="color:#333333;"> : Timestamp(1531545028, 1),  
</font><font style="color:#333333;">                </font><font style="color:#DD1144;">"t"</font><font style="color:#333333;"> : NumberLong(3)  
</font><font style="color:#333333;">            },  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"optimeDurable"</font><font style="color:#333333;"> : {  
</font><font style="color:#333333;">                </font><font style="color:#DD1144;">"ts"</font><font style="color:#333333;"> : Timestamp(1531545028, 1),  
</font><font style="color:#333333;">                </font><font style="color:#DD1144;">"t"</font><font style="color:#333333;"> : NumberLong(3)  
</font><font style="color:#333333;">            },  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"optimeDate"</font><font style="color:#333333;"> : ISODate(</font><font style="color:#DD1144;">"2018-07-14T05:10:28Z"</font><font style="color:#333333;">),  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"optimeDurableDate"</font><font style="color:#333333;"> : ISODate(</font><font style="color:#DD1144;">"2018-07-14T05:10:28Z"</font><font style="color:#333333;">),  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"lastHeartbeat"</font><font style="color:#333333;"> : ISODate(</font><font style="color:#DD1144;">"2018-07-14T05:10:30.079Z"</font><font style="color:#333333;">),  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"lastHeartbeatRecv"</font><font style="color:#333333;"> : ISODate(</font><font style="color:#DD1144;">"2018-07-14T05:10:31.094Z"</font><font style="color:#333333;">),  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"pingMs"</font><font style="color:#333333;"> : NumberLong(0),  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"lastHeartbeatMessage"</font><font style="color:#333333;"> : </font><font style="color:#DD1144;">""</font><font style="color:#333333;">,  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"syncingTo"</font><font style="color:#333333;"> : </font><font style="color:#DD1144;">"192.168.100.100:27020"</font><font style="color:#333333;">,  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"syncSourceHost"</font><font style="color:#333333;"> : </font><font style="color:#DD1144;">"192.168.100.100:27020"</font><font style="color:#333333;">,  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"syncSourceId"</font><font style="color:#333333;"> : 3,  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"infoMessage"</font><font style="color:#333333;"> : </font><font style="color:#DD1144;">""</font><font style="color:#333333;">,  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"configVersion"</font><font style="color:#333333;"> : 3  
</font><font style="color:#333333;">        },  
</font><font style="color:#333333;">        {  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"_id"</font><font style="color:#333333;"> : 3,  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"name"</font><font style="color:#333333;"> : </font><font style="color:#DD1144;">"192.168.100.100:27020"</font><font style="color:#333333;">,  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"health"</font><font style="color:#333333;"> : 1,  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"state"</font><font style="color:#333333;"> : 1,  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"stateStr"</font><font style="color:#333333;"> : </font><font style="color:#DD1144;">"PRIMARY"</font><font style="color:#333333;">,  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"uptime"</font><font style="color:#333333;"> : 68,  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"optime"</font><font style="color:#333333;"> : {  
</font><font style="color:#333333;">                </font><font style="color:#DD1144;">"ts"</font><font style="color:#333333;"> : Timestamp(1531545028, 1),  
</font><font style="color:#333333;">                </font><font style="color:#DD1144;">"t"</font><font style="color:#333333;"> : NumberLong(3)  
</font><font style="color:#333333;">            },  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"optimeDurable"</font><font style="color:#333333;"> : {  
</font><font style="color:#333333;">                </font><font style="color:#DD1144;">"ts"</font><font style="color:#333333;"> : Timestamp(1531545028, 1),  
</font><font style="color:#333333;">                </font><font style="color:#DD1144;">"t"</font><font style="color:#333333;"> : NumberLong(3)  
</font><font style="color:#333333;">            },  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"optimeDate"</font><font style="color:#333333;"> : ISODate(</font><font style="color:#DD1144;">"2018-07-14T05:10:28Z"</font><font style="color:#333333;">),  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"optimeDurableDate"</font><font style="color:#333333;"> : ISODate(</font><font style="color:#DD1144;">"2018-07-14T05:10:28Z"</font><font style="color:#333333;">),  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"lastHeartbeat"</font><font style="color:#333333;"> : ISODate(</font><font style="color:#DD1144;">"2018-07-14T05:10:30.079Z"</font><font style="color:#333333;">),  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"lastHeartbeatRecv"</font><font style="color:#333333;"> : ISODate(</font><font style="color:#DD1144;">"2018-07-14T05:10:29.561Z"</font><font style="color:#333333;">),  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"pingMs"</font><font style="color:#333333;"> : NumberLong(0),  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"lastHeartbeatMessage"</font><font style="color:#333333;"> : </font><font style="color:#DD1144;">""</font><font style="color:#333333;">,  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"syncingTo"</font><font style="color:#333333;"> : </font><font style="color:#DD1144;">""</font><font style="color:#333333;">,  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"syncSourceHost"</font><font style="color:#333333;"> : </font><font style="color:#DD1144;">""</font><font style="color:#333333;">,  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"syncSourceId"</font><font style="color:#333333;"> : -1,  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"infoMessage"</font><font style="color:#333333;"> : </font><font style="color:#DD1144;">""</font><font style="color:#333333;">,  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"electionTime"</font><font style="color:#333333;"> : Timestamp(1531544897, 1),  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"electionDate"</font><font style="color:#333333;"> : ISODate(</font><font style="color:#DD1144;">"2018-07-14T05:08:17Z"</font><font style="color:#333333;">),  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"configVersion"</font><font style="color:#333333;"> : 3  
</font><font style="color:#333333;">        }  
</font><font style="color:#333333;">    ],  
</font><font style="color:#333333;">    </font><font style="color:#DD1144;">"ok"</font><font style="color:#333333;"> : 1,  
</font><font style="color:#333333;">    </font><font style="color:#DD1144;">"operationTime"</font><font style="color:#333333;"> : Timestamp(1531545028, 1),  
</font><font style="color:#333333;">    </font><font style="color:#DD1144;">"</font><font style="color:teal;">$clusterTime</font><font style="color:#DD1144;">"</font><font style="color:#333333;"> : {  
</font><font style="color:#333333;">        </font><font style="color:#DD1144;">"clusterTime"</font><font style="color:#333333;"> : Timestamp(1531545028, 1),  
</font><font style="color:#333333;">        </font><font style="color:#DD1144;">"signature"</font><font style="color:#333333;"> : {  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"hash"</font><font style="color:#333333;"> : B</font>**in**<font style="color:#333333;">Data(0,</font><font style="color:#DD1144;">"AAAAAAAAAAAAAAAAAAAAAAAAAAA="</font><font style="color:#333333;">),  
</font><font style="color:#333333;">            </font><font style="color:#DD1144;">"keyId"</font><font style="color:#333333;"> : NumberLong(0)  
</font><font style="color:#333333;">        }  
</font><font style="color:#333333;">    }  
</font><font style="color:#333333;">}</font>

**特别提醒：此刻主节点已经在192.168.100.100:27020节点上**

 

 

 


