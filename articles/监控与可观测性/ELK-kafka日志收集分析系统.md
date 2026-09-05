环境：

<table class="lake-table" style="width: 599px;"><colgroup><col span="1" width="171" /><col span="1" width="187" /><col span="1" width="240" /></colgroup><tbody><tr style="height: 33px;"><td><p>服务器IP</p></td><td><p>软件</p></td><td><p>版本</p></td></tr><tr style="height: 33px;"><td><p>192.168.0.156</p></td><td><p>zookeeper+kafka</p></td><td><p>zk:3.4.14  kafka:2.11-2.2.0</p></td></tr><tr style="height: 33px;"><td><p>192.168.0.42</p></td><td><p>zookeeper+kafka</p></td><td><p>zk:3.4.14  kafka:2.11-2.2.0</p></td></tr><tr style="height: 33px;"><td colspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><p>192.168.0.133</p></td><td colspan="1"><p>zookeeper+kafka</p></td><td colspan="1"><p>zk:3.4.14  kafka:2.11-2.2.0</p></td></tr><tr style="height: 33px;"><td colspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><p>192.168.0.193</p></td><td colspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><p>logstash</p></td><td colspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><p>7.1.1</p></td></tr><tr style="height: 33px;"><td colspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><p>192.168.0.107</p></td><td colspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><p>logstash</p></td><td colspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><p>7.1.1</p></td></tr><tr style="height: 33px;"><td colspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><p>192.168.0.87</p></td><td colspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><p>elasticseach</p></td><td colspan="1" rowspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;">7.1.1</td></tr><tr style="height: 33px;"><td colspan="1" rowspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;">192.168.0.169</td><td colspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><p>elasticseach</p></td><td colspan="1" rowspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;">7.1.1</td></tr><tr style="height: 33px;"><td colspan="1" rowspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;">192.168.0.113</td><td colspan="1" rowspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;">kibana</td><td colspan="1" rowspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;">7.1.1</td></tr><tr style="height: 33px;"><td colspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><p><br /></p></td><td colspan="1" rowspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;">filebeat</td><td colspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;">7.1.1</td></tr></tbody></table>

拓扑：

![image.png](assets/监控与可观测性/ELK-kafka日志收集分析系统/ELK-kafka日志收集分析系统-1.png)

  

# 安装JDK

不管需不需要，都装上JDK吧，省的麻烦，我这里装的是jdk1.8.0\_151

```python
tar xf jdk-8u151-linux-x64.tar.gz -C /opt/
```

  

配置环境变量

```python
vim /etc/profile
export JAVA_HOME=/opt/jdk1.8.0_151
export PATH=$JAVA_HOME/bin:$PATH
    
source /etc/profile
```

  

  

# 安装zk

以192.168.0.156为例

```python
wget https://mirrors.tuna.tsinghua.edu.cn/apache/zookeeper/zookeeper-3.4.14/zookeeper-3.4.14.tar.gz
tar xf zookeeper-3.4.14.tar.gz -C /opt/

# 修改配置信息
cd /opt/zookeeper-3.4.14/conf
cp zoo_sample.cfg zoo.cfg

```

  

修改zk配置文件：

```python
# vim zoo.cfg
tickTime=2000
initLimit=10
syncLimit=5
dataDir=/data/elk/zk/data/
clientPort=2181
server.1=192.168.0.156:12888:13888
server.2=192.168.0.42:12888:13888
server.3=192.168.0.133:12888:13888
```

  

创建数据目录，添加zk的竞选ID：

```python
# 添加数据目录
mkdir -p /data/elk/zk/data/

# 192.168.0.156上
echo 1 > /data/elk/zk/data/myid

# 192.168.0.42上
echo 2 > /data/elk/zk/data/myid

# 192.168.0.133上
echo 3 > /data/elk/zk/data/myid
```

  

其他两台的配置一样，除了myid不同。

  

启动三台ZK

```python
./bin/zkServer.sh start
```

  

查看状态，输出如下表示ZK集群OK了

```python
./bin/zkServer.sh status
ZooKeeper JMX enabled by default
Using config: /opt/zookeeper-3.4.14/bin/../conf/zoo.cfg
Mode: follower
```

  

# 安装Kafka

  

```python
wget https://www-us.apache.org/dist/kafka/2.2.0/kafka_2.11-2.2.0.tgz
tar xf kafka_2.11-2.2.0.tgz -C /opt/

# 配置文件
cd /opt/kafka_2.11-2.2.0/config
```

  

修改配置文件：

```python
# vim server.properties
broker.id=1
listeners=PLAINTEXT://192.168.0.156:9092
num.network.threads=3
num.io.threads=8
socket.send.buffer.bytes=102400
socket.receive.buffer.bytes=102400
socket.request.max.bytes=104857600
log.dirs=/data/elk/kafka/logs
num.partitions=1
num.recovery.threads.per.data.dir=1
offsets.topic.replication.factor=1
transaction.state.log.replication.factor=1
transaction.state.log.min.isr=1
log.retention.hours=168
log.segment.bytes=1073741824
log.retention.check.interval.ms=300000
zookeeper.connect=192.168.0.156:2181,192.168.0.42:2181,192.168.0.133:2181
zookeeper.connection.timeout.ms=6000
group.initial.rebalance.delay.ms=0
```

  

另外两台配置信息需要改动的地方分别是broker.id=2和3，listeners改成自己本机IP。

  

创建日志目录：

```python
mkdir -p /data/elk/kafka/logs
```

  

配置hosts：

```python
kafka01   192.168.0.156
kafka02   192.168.0.42
kafka03   192.168.0.133
```

  

启动三台kafka

```python
../bin/kafka-server-start.sh -daemon server.properties
```

  

测试：

（1）、创建topic

```python
../bin/kafka-topics.sh --create --zookeeper 192.168.0.156:2181 --replication-factor 1 --partitions 2 --topic message_topic
```

（2）、查看topic

```python
../bin/kafka-topics.sh --list --zookeeper 192.168.0.156:2181
```

（3）、测试消费者，生产者

```python
# 在其中一台执行以下命令
./bin/kafka-console-consumer.sh --bootstrap-server 192.168.0.156:9092 --topic message_topic --from-beginning
    
# 另开一个终端执行以下命令
../bin/kafka-console-producer.sh --broker-list 192.168.0.156:9092 --topic message_topic
>hello
>

# 就会输出以下内容
./bin/kafka-console-consumer.sh --bootstrap-server 192.168.0.156:9092 --topic message_topic --from-beginning
hello

```

  

# 安装logstash

  

```python
wget https://artifacts.elastic.co/downloads/logstash/logstash-7.1.1.tar.gz
tar xf logstash-7.1.1.tar.gz -C /opt/
```

  

修改配置文件

vim logstash.yml

```python
path.data: /data/elk/logstash/data
pipeline.workers: 4
pipeline.batch.size: 125
pipeline.batch.delay: 50
path.config: /opt/logstash-7.1.1/config/conf.d
http.host: "192.168.0.193"
log.level: info
path.logs: /data/elk/logstash/logs
```

  

# 安装elasticsearch

  

```python
wget https://artifacts.elastic.co/downloads/elasticsearch/elasticsearch-7.1.1-linux-x86_64.tar.gz
tar xf elasticsearch-7.1.1-linux-x86_64.tar.gz -C /opt/
```

  

配置elasticsearch.yml

```python
node.name: node02
path.data: /data/elk/data
path.logs: /data/elk/logs
network.host: 192.168.0.169
http.port: 9200
discovery.seed_hosts: ["node01", "node02"]
cluster.initial_master_nodes: ["node01", "node02"]
```

**另外一台配置更改node.name和network即可。**

  

创建普通用户

```python
useradd elastic
chown elastic.elastic elasticsearch-7.1.1/ -R
```

  

创建数据日志目录

```python
mkdir -p /data/elk/{data,logs}
chown elastic.elastic /data -R
```

  

配置内核参数和文件描述符

```python
vim /etc/stsctl.conf
fs.file-max=65536
vm.max_map_count = 262144

sysctl -p

vim /etc/security/limits.conf
* soft nofile 65536
* hard nofile 65536
* soft nproc 2048
* hard nproc 4096
```

  

查看集群状态

```python
# curl  http://192.168.0.87:9200/_cluster/health?pretty
{
  "cluster_name" : "my-elk",
  "status" : "green",
  "timed_out" : false,
  "number_of_nodes" : 2,
  "number_of_data_nodes" : 2,
  "active_primary_shards" : 2,
  "active_shards" : 4,
  "relocating_shards" : 0,
  "initializing_shards" : 0,
  "unassigned_shards" : 0,
  "delayed_unassigned_shards" : 0,
  "number_of_pending_tasks" : 0,
  "number_of_in_flight_fetch" : 0,
  "task_max_waiting_in_queue_millis" : 0,
  "active_shards_percent_as_number" : 100.0
}
```

  

查看节点状态

```python
# curl  http://192.168.0.87:9200/_cat/nodes?v
ip            heap.percent ram.percent cpu load_1m load_5m load_15m node.role master name
192.168.0.169           16          27   0    0.03    0.09     0.10 mdi       -      node02
192.168.0.87            14          44   0    0.05    0.08     0.09 mdi       *      node01
```

  

# 安装kibana

```python
wget https://artifacts.elastic.co/downloads/kibana/kibana-7.1.1-linux-x86_64.tar.gz
tar xf kibana-7.1.1-linux-x86_64.tar.gz -C /opt/
```

  

修改配置文件

```python
server.port: 5601
server.host: 192.168.0.113
elasticsearch.hosts: ["http://192.168.0.87:9200"]
elasticsearch.hosts: ["http://192.168.0.169:9200"]
```

  

  

  

# 安装filebeat

```python
wget https://artifacts.elastic.co/downloads/beats/filebeat/filebeat-7.1.1-linux-x86_64.tar.gz
tar xf filebeat-7.1.1-linux-x86_64.tar.gz -C /opt/
```

  

# 示例nginx

## 在nginx服务器上配置filebeat

首先部署filebeat。

修改配置文件：

```python
# vim filebeat.yml
filebeat.inputs:
- type: log
  enabled: false
  paths:
    - /var/log/*.log
- type: log
  enable: true
  paths:
    - /var/log/nginx/access.log
  fields:
    name: nginx-access
  fields_under_root: false
  tail_files: false
- type: log
  enable: true
  paths:
    - /var/log/nginx/error.log
  fields:
    name: nginx-error
  fields_under_root: false
  tail_files: false
filebeat.config.modules:
  path: ${path.config}/modules.d/*.yml
  reload.enabled: false
setup.template.settings:
  index.number_of_shards: 1
setup.kibana:
output.kafka:
    enabled: true
    hosts: ["192.168.0.156:9092","192.168.0.42:9092","192.168.0.133:9092"]
    topic: 'nginx-topic'
    partition.round_robin:
        reachable_only: true
    worker: 4
    required_acks: 1
    compression: gzip
    max_message_bytes: 1000000
processors:
  - add_host_metadata: ~
  - add_cloud_metadata: ~
logging.level: info
logging.to_files: true
logging.files:
  path: /data/elk/filebeat/logs
  name: filebeat
  rotateeverybytes: 52428800 # 50MB
  keepfiles: 5
```

  

启动服务：

```python
nohup ./filebeat &
```

  

## 在logstash上配置获取日志

配置文件：

```python
# vim /opt/logstash-7.1.1/config/conf.d/nginx.conf
input {
  kafka {
    codec => "json"
    topics => ["nginx-topic"]
    bootstrap_servers => ["192.168.0.156:9092, 192.168.0.42:9092, 192.168.0.133:9092"]
    group_id => "logstash-g1"
  }
}
output {
  elasticsearch {
    hosts => ["192.168.0.87:9200", "192.168.0.169:9200"]
    index => "logstash-%{+YYYY.MM.dd}"
  }
}
```

  

启动服务：

```python
nohup ../../bin/logstash -f ../conf.d/nginx.conf  &
```

  

## 在ES上查看索引

```python
curl '192.168.0.87:9200/_cat/indices?v'
health status index                      uuid                   pri rep docs.count docs.deleted store.size pri.store.size
green  open   .kibana_task_manager       xaxQMaJsRnycacsKZJBW5A   1   1          2            9     33.2kb         16.6kb
green  open   .kibana_1                  TZ7_EmQMSFy1cPS4Irx7iw   1   1          7            0     87.4kb         43.7kb
green  open   logstash-2019.06.17-000001 vNCkz0a2R8unLxr5m9dSWg   1   1          2            0     82.1kb           41kb
```

  

## 在kibana上添加索引

![image.png](assets/监控与可观测性/ELK-kafka日志收集分析系统/ELK-kafka日志收集分析系统-2.png)

  

在NG的机器上随便curl以下：

```python
# curl localhost/121231
```

![image.png](assets/监控与可观测性/ELK-kafka日志收集分析系统/ELK-kafka日志收集分析系统-3.png)

  

日志比较乱，是因为我们没做日志的过滤。