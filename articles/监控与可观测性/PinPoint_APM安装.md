# Pinpoint简介

  

[Pinpoint](https://github.com/naver/pinpoint)是一款对Java编写的大规模分布式系统的APM工具，有些人也喜欢称呼这类工具为调用链系统、分布式跟踪系统。我们知道，前端向后台发起一个查询请求，后台服务可能要调用多个服务，每个服务可能又会调用其它服务，最终将结果返回，汇总到页面上。如果某个环节发生异常，工程师很难准确定位这个问题到底是由哪个服务调用造成的，Pinpoint等相关工具的作用就是追踪每个请求的完整调用链路，收集调用链路上每个服务的性能数据，方便工程师能够快速定位问题。

  

其架构图如下：

![](assets/监控与可观测性/PinPoint_APM安装/PinPoint_APM安装-1.png)

架构说明：

-   Pinpoint-Collector：收集各种性能数据
-   Pinpoint-Agent：和自己运行的应用关联起来的探针
-   Pinpoint-Web：将收集到的数据显示成WEB网页形式
-   HBase Storage：收集到的数据存到HBase中

  

# Pinpoint搭建

  

我们这里直接将数据存储到HDFS中，所以整体规划如下：

<table class="lake-table" style="width: 741px;"><colgroup><col span="1" width="170" /><col span="1" width="161" /><col span="1" width="409" /></colgroup><tbody><tr style="height: 33px;"><td><p><span class="lake-fontsize-10">IP</span><span class="lake-fontsize-10"></span></p></td><td><p><span class="lake-fontsize-10">主机名</span><span class="lake-fontsize-10"></span></p></td><td><p><span class="lake-fontsize-10">用途</span><span class="lake-fontsize-10"></span></p></td></tr><tr style="height: 33px;"><td><p>10.2.42.59</p></td><td><p><span class="lake-fontsize-10">collector</span><span class="lake-fontsize-10"></span></p></td><td><p><span class="lake-fontsize-10">Pinpoint-collector</span><span class="lake-fontsize-10"></span></p></td></tr><tr style="height: 33px;"><td><p>10.2.42.60</p></td><td><p><span class="lake-fontsize-10">web</span><span class="lake-fontsize-10"></span></p></td><td><p><span class="lake-fontsize-10">Pinpoint-web</span><span class="lake-fontsize-10"></span></p></td></tr><tr style="height: 33px;"><td><p>10.2.42.61</p></td><td><p><span class="lake-fontsize-10">hbase-master</span><span class="lake-fontsize-10"></span></p></td><td><p><span class="lake-fontsize-10">Hadoop/Hbase/zookeeper</span><span class="lake-fontsize-10"></span></p></td></tr><tr style="height: 33px;"><td><p>10.2.42.62</p></td><td><p><span class="lake-fontsize-10">hbase-slave01</span><span class="lake-fontsize-10"></span></p></td><td><p><span class="lake-fontsize-10">Hadoop/Hbase/zookeeper</span><span class="lake-fontsize-10"></span></p></td></tr><tr style="height: 33px;"><td><p>10.2.42.63</p></td><td><p><span class="lake-fontsize-10">hbase-slave02</span><span class="lake-fontsize-10"></span></p></td><td><p><span class="lake-fontsize-10">Hadoop/Hbase/zookeeper</span><span class="lake-fontsize-10"></span></p></td></tr></tbody></table>

软件版本：

<table class="lake-table" style="width: 981px;"><colgroup><col span="1" width="190" /><col span="1" width="116" /><col span="1" width="674" /></colgroup><tbody><tr style="height: 33px;"><td><p>软件名</p></td><td><p>版本</p></td><td rowspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><p>下载地址</p></td></tr><tr style="height: 33px;"><td rowspan="1" colspan="1">pinpoint-collector</td><td rowspan="1" colspan="1">1.7.1</td><td rowspan="1" colspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><p><span><a href="https://github.com/naver/pinpoint/releases" target="_blank"><u><u>https://github.com/naver/pinpoint/releases</u></u></a></span></p></td></tr><tr style="height: 33px;"><td rowspan="1" colspan="1">pinpoint-web</td><td rowspan="1" colspan="1">1.7.1</td><td rowspan="1" colspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><p><span><a href="https://github.com/naver/pinpoint/releases" target="_blank"><u><u>https://github.com/naver/pinpoint/releases</u></u></a></span></p></td></tr><tr style="height: 33px;"><td colspan="1" rowspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;">pinpoint-agent</td><td colspan="1" rowspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;">1.7.1</td><td colspan="1" rowspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><p><span><a href="https://github.com/naver/pinpoint/releases" target="_blank"><u><u>https://github.com/naver/pinpoint/releases</u></u></a></span></p></td></tr><tr style="height: 33px;"><td colspan="1" rowspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;">java</td><td colspan="1" rowspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;">1.8.0_131</td><td colspan="1" rowspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><p><span><a href="http://www.oracle.com/technetwork/java/javase/downloads/java-archive-javase8-2177648.html" target="_blank"><u><u>http://www.oracle.com/technetwork/java/javase/downloads/java-archive-javase8-2177648.html</u></u></a></span></p></td></tr><tr style="height: 33px;"><td colspan="1" rowspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;">zookeeper</td><td colspan="1" rowspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;">3.4.10</td><td colspan="1" rowspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><p><span><a href="https://archive.apache.org/dist/zookeeper/stable/" target="_blank"><u><u>https://archive.apache.org/dist/zookeeper/stable/</u></u></a></span></p></td></tr><tr style="height: 33px;"><td colspan="1" rowspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;">hbase</td><td colspan="1" rowspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;">1.2.6</td><td colspan="1" rowspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><p><span><a href="http://apache.mirror.cdnetworks.com/hbase/" target="_blank"><u><u>http://apache.mirror.cdnetworks.com/hbase/</u></u></a></span></p></td></tr><tr style="height: 33px;"><td colspan="1" rowspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;">hadoop</td><td colspan="1" rowspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;">2.8.4</td><td colspan="1" rowspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><p><span><a href="https://mirrors.tuna.tsinghua.edu.cn/apache/hadoop/common/hadoop-2.8.3/" target="_blank"><u><u>https://mirrors.tuna.tsinghua.edu.cn/apache/hadoop/common/hadoop-2.8.4/</u></u></a></span></p></td></tr><tr style="height: 33px;"><td colspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><p>tomcat</p></td><td colspan="1" rowspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;">8.0.47</td><td colspan="1" rowspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><p><span><a href="https://tomcat.apache.org/download-80.cgi" target="_blank"><u><u>https://tomcat.apache.org/download-80.cgi</u></u></a></span></p></td></tr></tbody></table>

# 安装JDK

解压JDK到opt目录下，配置环境变量

```shell
tar xf jdk-8u131-linux-x64.tar.gz -C /opt
```

  

vim /etc/profile

```shell
export JAVA_HOME=/opt/jdk1.8.0_131
export PATH=$JAVA_HOME/bin:$PATH
```

  

加载环境变量

```shell
source /etc/profile
```

  

# 配置免密

配置10.2.42.61，10.2.42.62，10.2.42.63节点之间互信，可以三台同时操作。

```shell
ssh-keygen
ssh-copy-id 10.2.42.61
ssh-copy-id 10.2.42.62
ssh-copy-id 10.2.42.63
```

  

如果没有ssh-copy-id，则使用下面命令安装即可

```shell
yum -y install openssh-clients
```

  

# 配置Hosts映射

五台都需要配置hosts映射。

vim /etc/hosts

```shell
10.2.42.61	DCA-APP-COM-pinpoint-HBaseMaster
10.2.42.62	DCA-APP-COM-pinpoint-HBaseSlave01
10.2.42.63	DCA-APP-COM-pinpoint-HBaseSlave02
```

  

# 安装zookeeper集群

解压安装包到opt目录下，三台可以同时操作。

```shell
tar xf zookeeper-3.4.10.tar.gz -C /opt/
cd /opt/zookeeper-3.4.10/conf
cp zoo_sample.cfg zoo.cfg
```

  

vim zoo.cfg

```shell
# The number of milliseconds of each tick
tickTime=2000
# The number of ticks that the initial 
# synchronization phase can take
initLimit=10
# The number of ticks that can pass between 
# sending a request and getting an acknowledgement
syncLimit=5
# the directory where the snapshot is stored.
# do not use /tmp for storage, /tmp here is just 
# example sakes.
dataDir=/data/zookeeper/data
# the port at which the clients will connect
clientPort=2181
# the maximum number of client connections.
# increase this if you need to handle more clients
#maxClientCnxns=60
#
# Be sure to read the maintenance section of the 
# administrator guide before turning on autopurge.
#
# http://zookeeper.apache.org/doc/current/zookeeperAdmin.html#sc_maintenance
#
# The number of snapshots to retain in dataDir
#autopurge.snapRetainCount=3
# Purge task interval in hours
# Set to "0" to disable auto purge feature
#autopurge.purgeInterval=1
server.1=10.2.42.61:12888:13888
server.2=10.2.42.62:12888:13888
server.3=10.2.42.63:12888:13888
```

  

创建数据目录

```shell
mkdir /data/zookeeper/data -p
```

  

在10.2.42.61上添加竞选ID

```shell
echo 1 > /data/zookeeper/data/myid
```

  

在10.2.42.62上添加竞选ID

```shell
echo 2 > /data/zookeeper/data/myid
```

  

在10.2.42.63上添加竞选ID

```shell
echo 3 > /data/zookeeper/data/myid
```

  

启动服务

```shell
/opt/zookeeper-3.4.10/bin/zkServer.sh start
```

  

查看集群状态

```shell
[root@DCA-APP-COM-pinpoint-HBaseMaster data]# /opt/zookeeper-3.4.10/bin/zkServer.sh status
ZooKeeper JMX enabled by default
Using config: /opt/zookeeper-3.4.10/bin/../conf/zoo.cfg
Mode: follower
```

  

# 安装Hadoop集群

  

<table class="lake-table" style="width: 653px;"><colgroup><col span="1" width="292" /><col span="1" width="360" /></colgroup><tbody><tr style="height: 33px;"><td><p>namenode</p></td><td><p>10.2.42.61</p></td></tr><tr style="height: 33px;"><td><p>datanode01</p></td><td><p>10.2.42.62</p></td></tr><tr style="height: 33px;"><td><p>datanode02</p></td><td><p>10.2.42.63</p></td></tr></tbody></table>

  

  

解压安装文件到opt目录下，**注：没做特别说明，下面操作均在三台机器上同时操作。**

```shell
tar xf hadoop-2.8.3.tar.gz -C /opt/
```

  

进入hadoop配置文件目录，进行配置

```shell
cd /opt/hadoop-2.8.3/etc/hadoop
```

  

配置hadoop-env.sh，指定hadoop的java运行环境

vim hadoop-env.sh

```shell
#export JAVA_HOME=${JAVA_HOME}     # 默认就是这个，所以实际上这一步可以跳过
export JAVA_HOME=/opt/jdk1.8.0_131
```

  

配置core-site.xml，指定访问hadoop web界面访问

vim core-site.xml

```shell
<configuration>
  <property>
    <name>fs.defaultFS</name>
    <value>hdfs://10.2.42.61:9000</value>
  </property>
  <property>
　　<name>io.file.buffer.size</name>
　　<value>131072</value>
  </property>
  <property>
    <name>hadoop.tmp.dir</name>
    <value>/data/hadoop/tmp</value>
  </property>
</configuration>
```

  

配置hdfs-site.xml

vim hdfs-site.xml

```shell
<configuration>
<property>
　　<name>dfs.namenode.secondary.http-address</name>
　　<value>10.2.42.61:50090</value>
  </property>
  <property>
    <name>dfs.replication</name>
    <value>2</value>
  </property>
  <!-- 指定namenode数据存放临时目录,自行创建 -->
  <property>
    <name>dfs.namenode.name.dir</name>
    <value>file:/data/hadoop/dfs/name</value>
  </property>
  <!-- 指定datanode数据存放临时目录,自行创建 -->
  <property>
    <name>dfs.datanode.data.dir</name>
    <value>file:/data/hadoop/dfs/data</value>
  </property>
</configuration>
```

  

配置mapred-site.xml，这是mapreduce的任务配置，可以查看以运行完的作业情况。

vim mapred-site.xml

```shell
<configuration>
  <property>
    <name>mapreduce.framework.name</name>
      <value>yarn</value>
  </property>
  <property>
    <name>mapreduce.jobhistory.address</name>
      <value>0.0.0.0:10020</value>
  </property>
  <property>
    <name>mapreduce.jobhistory.webapp.address</name>
      <value>0.0.0.0:19888</value>
  </property>
</configuration>
```

  

配置yarn-site.xml，datanode不需要修改这个配置文件。

vim yarn-site.xml

```shell
<configuration>

<!-- Site specific YARN configuration properties -->
<property>
　　<name>yarn.nodemanager.aux-services</name>
　　<value>mapreduce_shuffle</value>
</property>
<property>
　　<name>yarn.resourcemanager.address</name>
　　<value>10.2.42.61:8032</value>
</property>
<property>
　　<name>yarn.resourcemanager.scheduler.address</name>
　　<value>10.2.42.61:8030</value> 
</property>
<property>
　　<name>yarn.resourcemanager.resource-tracker.address</name>
　　<value>10.2.42.61:8031</value> 
</property>
<property>
　　<name>yarn.resourcemanager.admin.address</name>
　　<value>10.2.42.61:8033</value> 
</property>
<property>
　　<name>yarn.resourcemanager.webapp.address</name>
　　<value>10.2.42.61:8088</value> 
</property>
</configuration>
```

  

配置datanode，方便namenode调用

vim slaves

```shell
10.2.42.62
10.2.42.63
```

  

创建数据目录

```shell
mkdir /data/hadoop/tmp -p
mkdir /data/hadoop/dfs/name -p
mkdir /data/hadoop/dfs/data -p
```

  

格式化namenode，由于namenode 上的文件系统是 HDFS 的，所以要格式化。

```shell
/opt/hadoop-2.8.3/bin/hdfs namenode -format
```

如下表示格式化成功。

![image.png](assets/监控与可观测性/PinPoint_APM安装/PinPoint_APM安装-2.png)

  

启动集群

```shell
/opt/hadoop-2.8.3/sbin/start-all.sh
```

输出日志如下：

![image.png](assets/监控与可观测性/PinPoint_APM安装/PinPoint_APM安装-3.png)

  

启动jobhistory 服务，查看 mapreduce 运行状态

```shell
/opt/hadoop-2.8.3/sbin/mr-jobhistory-daemon.sh start historyserver
```

通过URL访问的地址

```shell
http://10.2.42.61:50070  #整个hadoop 集群
http://10.2.42.61:50090  #SecondaryNameNode的情况
http://10.2.42.61:8088   #resourcemanager的情况
http://10.2.42.61:19888  #historyserver(MapReduce历史运行情况)
```

  

![image.png](assets/监控与可观测性/PinPoint_APM安装/PinPoint_APM安装-4.png)

  

# 配置HBase集群

**注：未做特别声明，一下操作在三个节点同时进行。**

解压安装包到opt目录下

```shell
tar xf hbase-1.2.6-bin.tar.gz -C /opt/
```

  

复制hdfs配置文件，这是为了保障hbase和hdfs两边的配置文件一致

```shell
cp /opt/hadoop-2.8.3/etc/hadoop/hdfs-site.xml /opt/hbase-1.2.6/conf/
```

  

配置HBase配置文件

vim hbase-site.xml

```shell
<configuration>
  <property>
    <name>hbase.zookeeper.property.clientPort</name>
    <value>2181</value>
  </property>
  <property>
    <name>hbase.zookeeper.quorum</name>
    <value>10.2.42.61,10.2.42.62,10.2.42.63</value>
    <description>The directory shared by RegionServers.</description>
  </property>
  <property>
    <name>hbase.zookeeper.property.dataDir</name>
    <value>/data/zookeeper/zkdata</value>
    <description>
    注意这里的zookeeper数据目录与hadoop ha的共用，也即要与 zoo.cfg 中配置的一致
    Property from ZooKeeper config zoo.cfg.
    The directory where the snapshot is stored.
    </description>
  </property>
  <property>
    <name>hbase.rootdir</name>
    <value>hdfs://10.2.42.61:9000/hbase</value>
    <description>The directory shared by RegionServers.
                 官网多次强调这个目录不要预先创建，hbase会自行创建，否则会做迁移操作，引发错误
                 至于端口，有些是8020，有些是9000，看 $HADOOP_HOME/etc/hadoop/hdfs-site.xml 里面的配置，本实验配置的是
                 dfs.namenode.rpc-address.hdcluster.nn1 , dfs.namenode.rpc-address.hdcluster.nn2
    </description>
  </property>
  <property>
    <name>hbase.cluster.distributed</name>
    <value>tre</value>
    <description>分布式集群配置，这里要设置为true，如果是单节点的，则设置为false
      The mode the cluster will be in. Possible values are
      false: standalone and pseudo-distributed setups with managed ZooKeeper
      true: fully-distributed with unmanaged ZooKeeper Quorum (see hbase-env.sh)
    </description>
  </property>
</configuration>
```

  

配置regionservers文件

vim regionservers

```shell
10.2.42.62
10.2.42.63
```

  

配置hbase-env.sh，由于我们是自己搭建的zookeeper，所以需要加入下面一段代码。

```shell
export HBASE_MANAGES_ZK=false
```

  

启动集群

```shell
/opt/hbase-1.2.6/bin/start-hbase.sh
```

![image.png](assets/监控与可观测性/PinPoint_APM安装/PinPoint_APM安装-5.png)

  

查看集群状态

1、通过URL查看：[http://10.2.42.61:16010/master-status](http://10.2.42.61:16010/master-status)

2、通过命令行查看

```shell
/opt/hbase-1.2.6/bin/hbase shell
hbase(main):002:0> status
1 active master, 0 backup masters, 1 servers, 0 dead, 2.0000 average load
```

  

如果报错：ERROR: org.apache.hadoop.hbase.PleaseHoldException: Master is initializing

1、先停止HBase：/opt/hbase-1.2.6/bin/stop-hbase.sh

2、启动regionserver：/opt/hbase-1.2.6/bin/hbase-daemon.sh start regionserver

3、启动master：/opt/hbase-1.2.6/bin/hbase-daemon.sh start master

  

初始化HBase的PinPoint库，hbase-create.hbase是需要下载的。

地址是：[https://github.com/naver/pinpoint/tree/master/hbase/scripts](https://github.com/naver/pinpoint/tree/master/hbase/scripts)

```shell
/opt/hbase-1.2.6/bin/hbase shell /root/install/hbase-create.hbase
```

![image.png](assets/监控与可观测性/PinPoint_APM安装/PinPoint_APM安装-6.png)

  

# 配置PinPoint-Collecter

解压war包到tomcat的webapps目录下

```shell
unzip pinpoint-collector-1.7.1.war -d /home/tomcat/apache-tomcat-8.0.47/webapps/ROOT
```

  

配置文件目录/home/tomcat/apache-tomcat-8.0.47/webapps/ROOT/WEB-INF/classes

修改配置文件hbase.properties

```shell
hbase.client.host=10.2.42.61,10.2.42.62,10.2.42.63
hbase.client.port=2181

......
```

  

修改配置文件pinpoint-collector.properties

```shell
cluster.enable=true
cluster.zookeeper.address=10.2.42.61,10.2.42.62,10.2.42.63
......
flink.cluster.zookeeper.address=10.2.42.61,10.2.42.62,10.2.42.63
flink.cluster.zookeeper.sessiontimeout=3000
```

  

启动tomcat

```shell
/home/tomcat/apache-tomcat-8.0.47/bin/startup.sh
```

  

# 配置PinPoint-WEB

解压对应的war包到tomcat的webapps目录

```shell
unzip pinpoint-web-1.7.1.war -d /home/tomcat/apache-tomcat-8.0.47/webapps/ROOT
```

  

配置文件目录/home/tomcat/apache-tomcat-8.0.47/webapps/ROOT/WEB-INF/classes

vim hbase.properties

```shell
hbase.client.host=10.2.42.61,10.2.42.62,10.2.42.63
hbase.client.port=2181
......
```

  

vim pinpoint-web.properties

```shell
cluster.enable=true
cluster.web.tcp.port=9997
cluster.zookeeper.address=10.2.42.61,10.2.42.62,10.2.42.63
cluster.zookeeper.sessiontimeout=30000
cluster.zookeeper.retry.interval=60000
.......
```

  

启动tomcat

```shell
/home/tomcat/apache-tomcat-8.0.47/bin/startup.sh
```

  

访问URL：[http://10.2.42.60:8080/#/main](http://10.2.42.60:8080/#/main)

![image.png](assets/监控与可观测性/PinPoint_APM安装/PinPoint_APM安装-7.png)

  

# 配置探针

复制pinpoint-agent-1.7.1.tar.gz到应用服务器上，解压到tomcat目录

```shell
tar xf pinpoint-agent-1.7.1.tar.gz -C /home/tomcat
```

  

修改配置文件：

vim /home/tomcat/ppagent/pinpoint.config

```shell
# ip为pinpoint-collecter的服务器ip
profiler.collector.ip=10.2.42.59
```

  

配置tomcat的Catalina.sh启动脚本，在脚本中加入如下代码

```shell
CATALINA_OPTS="$CATALINA_OPTS -javaagent:$AGENT_PATH/pinpoint-bootstrap-$VERSION.jar"
CATALINA_OPTS="$CATALINA_OPTS -Dpinpoint.agentId=$AGENT_ID"
CATALINA_OPTS="$CATALINA_OPTS -Dpinpoint.applicationName=$APPLICATION_NAME"
```

  

如果是jar包，直接用Java启动，需要跟下面参数

```shell
java -javaagent:/home/tomcat/tmp/ppagent/pinpoint-bootstrap-1.7.1.jar -Dpinpoint.agentId=jss-spring-boot-app11201 -Dpinpoint.applicationName=jss-spring-boot-app -jar jssSpringBootDemo-0.0.1-SNAPSHOT.jar
```

  

配置完后重启tomcat，然后在WEB端查看如下：

![image.png](assets/监控与可观测性/PinPoint_APM安装/PinPoint_APM安装-8.png)