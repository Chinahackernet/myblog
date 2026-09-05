最近想做一个kafka监控，本来准备用zabbix来监控的，需要重复造轮子，本来准备用kafka-Manager的，在GitHub上无意发现了kafka-eagle，看了官方介绍准备试一下.....

  

## 下载地址

-   [Download](http://download.smartloli.org/)  
    
-   [Github](https://github.com/smartloli/kafka-eagle)

  

## 官方文档

[https://docs.kafka-eagle.org/2.env-and-install/2.installing](https://docs.kafka-eagle.org/2.env-and-install/2.installing)

更多资料可以去[GitHub](https://github.com/smartloli/kafka-eagle)或者[官网](https://www.kafka-eagle.org/)上查看。

  

## 部署

> 前提：部署好java环境，JDK8+

（1）、下载需要的版本到服务器上，我下载的是最新版本

  

```shell
wget https://github.com/smartloli/kafka-eagle-bin/archive/v1.4.5.tar.gz
```

  

（2）、解压压缩包，该压缩包有两层，需要解压两次

  

```shell
tar xf kafka-eagle-bin-1.4.5.tar.gz
tar xf kafka-eagle-bin-1.4.5/kafka-eagle-web-1.4.5-bin.tar.gz -C /opt
mv kafka-eagle-web-1.4.5 kafka-eagle-web
```

  

（3）、配置环境变量

`vim /etc/profile`

```shell
export KE_HOME=/opt/kafka-eagle-web
export PATH=$PATH:$KE_HOME/bin
```

  

（4）、加载环境变量

  

```shell
source /etc/profile
chmod +x /opt/kafka-eagle-web/bin/ke.sh
```

  

（5）、创建一个数据库，存储监控数据（数据按照略...）

  

```shell
# 创建数据库
CREATE DATABASE kafka DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 创建用户并授权
grant all privileges on kafka.* to kafka@localhost identified by 'kafka';

# 刷新
flush privileges;

# 测试看能否登录
mysql -ukafka -pkafka
```

  

（6）、修改配置文件（$KE\_HOME/conf/system-config.properties）

  

```shell
######################################
# multi zookeeper & kafka cluster list
######################################
kafka.eagle.zk.cluster.alias=public_cluster
public_cluster.zk.list=10.2.42.49:2181,10.2.42.50:2181,10.2.42.71:2181
#cluster1.zk.list=tdn1:2181,tdn2:2181,tdn3:2181
#cluster2.zk.list=xdn10:2181,xdn11:2181,xdn12:2181

######################################
# broker size online list
######################################
cluster1.kafka.eagle.broker.size=20

######################################
# zk client thread limit
######################################
kafka.zk.limit.size=25

######################################
# kafka eagle webui port
######################################
kafka.eagle.webui.port=8048

######################################
# kafka offset storage
######################################
cluster1.kafka.eagle.offset.storage=kafka
cluster2.kafka.eagle.offset.storage=zk

######################################
# kafka metrics, 30 days by default
######################################
kafka.eagle.metrics.charts=false
kafka.eagle.metrics.retain=30

######################################
# kafka sql topic records max
######################################
kafka.eagle.sql.topic.records.max=5000
kafka.eagle.sql.fix.error=false

######################################
# delete kafka topic token
######################################
kafka.eagle.topic.token=keadmin

######################################
# kafka sasl authenticate
######################################
cluster1.kafka.eagle.sasl.enable=false
cluster1.kafka.eagle.sasl.protocol=SASL_PLAINTEXT
cluster1.kafka.eagle.sasl.mechanism=SCRAM-SHA-256
cluster1.kafka.eagle.sasl.jaas.config=org.apache.kafka.common.security.scram.ScramLoginModule required username="kafka" password="kafka-eagle";
cluster1.kafka.eagle.sasl.client.id=
cluster1.kafka.eagle.sasl.cgroup.enable=false
cluster1.kafka.eagle.sasl.cgroup.topics=

cluster2.kafka.eagle.sasl.enable=false
cluster2.kafka.eagle.sasl.protocol=SASL_PLAINTEXT
cluster2.kafka.eagle.sasl.mechanism=PLAIN
cluster2.kafka.eagle.sasl.jaas.config=org.apache.kafka.common.security.plain.PlainLoginModule required username="kafka" password="kafka-eagle";
cluster2.kafka.eagle.sasl.client.id=
cluster2.kafka.eagle.sasl.cgroup.enable=false
cluster2.kafka.eagle.sasl.cgroup.topics=

######################################
# kafka sqlite jdbc driver address
######################################
# kafka.eagle.driver=org.sqlite.JDBC
# kafka.eagle.url=jdbc:sqlite:/hadoop/kafka-eagle/db/ke.db
# kafka.eagle.username=root
# kafka.eagle.password=www.kafka-eagle.org

######################################
# kafka mysql jdbc driver address
######################################
kafka.eagle.driver=com.mysql.jdbc.Driver
kafka.eagle.url=jdbc:mysql://127.0.0.1:3306/kafka?useUnicode=true&characterEncoding=UTF-8&zeroDateTimeBehavior=convertToNull
kafka.eagle.username=kafka
kafka.eagle.password=kafka
```

  

（7）、启动

  

```shell
ke.sh start
```

启动成功后效果如下：

![image.png](assets/监控与可观测性/kafka-eagle监控kafka/kafka-eagle监控kafka-1.png)

  

（8）、浏览器http://10.2.128.16:8048/ke，输入用户名和密码进去Dashboard

![image.png](assets/监控与可观测性/kafka-eagle监控kafka/kafka-eagle监控kafka-2.png)

  

（9）、配置告警

其支持邮箱，钉钉，微信告警。这里以钉钉为例：

![image.png](assets/监控与可观测性/kafka-eagle监控kafka/kafka-eagle监控kafka-3.png)

  

还支持用户和角色管理：

![image.png](assets/监控与可观测性/kafka-eagle监控kafka/kafka-eagle监控kafka-4.png)

  

还有一个装逼的监控大盘，如下:

![image.png](assets/监控与可观测性/kafka-eagle监控kafka/kafka-eagle监控kafka-5.png)

  

更多功能自己去点，反正就是点点点，多点几下就熟悉了。