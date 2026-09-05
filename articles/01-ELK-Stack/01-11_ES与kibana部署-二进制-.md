# ES与kibana部署(二进制)

> 分类：ELK Stack / 第1章：ES基础与部署
> 原文：https://www.cuiliangblog.cn/detail/section/149733643
> 来源：崔亮的博客

---

# 环境准备
环境准备工作参考文档：[01-10_ES%E4%B8%8Ekibana%E9%83%A8%E7%BD%B2%28rpm%29.md](articles/01-ELK-Stack/01-10_ES与kibana部署-rpm-.md)

# 安装ES+kibana（单节点）
## elasticsearch服务部署
### 新建elasticsearch账号和用户组
+ Elasticsearch不支持root账户运行，因此创建elasticsearch的账号名和用户组。

```bash
[root@es-1 ~]# useradd elasticsearch
```

### 解压压缩包并指定用户和用户组
```bash
[root@es-1 ~]# wget https://artifacts.elastic.co/downloads/elasticsearch/elasticsearch-8.10.4-linux-x86_64.tar.gz
[root@es-1 ~]# tar -zxf elasticsearch-8.10.4-linux-x86_64.tar.gz 
[root@es-1 ~]# mv elasticsearch-8.10.4 /usr/local/src/elasticsearch
[root@es-1 ~]# chown -R elasticsearch:elasticsearch /usr/local/src/elasticsearch
```

### 创建数据与日志目录并修改权限
```bash
[root@es-1 ~]# mkdir -p /data/es-data
[root@es-1 ~]# mkdir -p /data/es-log
[root@es-1 ~]# chown elasticsearch:elasticsearch /data/es-data
[root@es-1 ~]# chown elasticsearch:elasticsearch /data/es-log
```

### 修改elasticsearch配置
> 使用elasticsearch用户操作
>

```bash
[root@es-1 ~]# su elasticsearch
[elasticsearch@es-1 root]$ vim /usr/local/src/elasticsearch/config/elasticsearch.yml
cluster.name: my-es
node.name: es-1
path.data: /data/es-data
path.logs: /data/es-log
network.host: 192.168.10.61 # 或0.0.0.0
cluster.initial_master_nodes: ["es-1"]
```

+ **配置文件说明**

cluster.name: 集群名称，唯一确定一个集群。

node.name：节点名称，一个集群中的节点名称是唯一固定的，不同节点不能同名。

network.host： 本节点的ip

cluster.initial_master_nodes：指定集群初次选举中用到的具有主节点资格的节点，称为集群引导，只在第一次形成集群时需要。

path.data: 数据存放路径

path.logs: 日志存放路径

### jvm.option的设置
> 使用elasticsearch用户操作
>

实际生产环境中计算公式：**min（机器内存的一半，32GB内存）**。也就是说：取机器环境内存的一半和32GB内存之间的小值。

```bash
[elasticsearch@es-1 ~]$ cat > /usr/local/src/elasticsearch/config/jvm.options.d/es.options << EOF
-Xms2g
-Xmx2g
EOF
```

### 启动服务
> 使用elasticsearch用户操作，elasticsearch8.x系列默认需要密码验证和https，查看启动日志可以看到elasticsearch自动为超级管理员elasticsearch生成了密码，还会生成cert认证文件到/config/certs/目录。
>

+ 方式一：控制台启动并直接打印日志

```bash
[elasticsearch@es-1 ~]$ cd /usr/local/src/elasticsearch/bin/
[elasticsearch@es-1 bin]$ ./elasticsearch
# 启动成功后控制台有如下信息
✅ Elasticsearch security features have been automatically configured!
✅ Authentication is enabled and cluster connections are encrypted.

ℹ️  Password for the elastic user (reset with `bin/elasticsearch-reset-password -u elastic`):
  DTn87ndVW=7yGx=*r+y6

ℹ️  HTTP CA certificate SHA-256 fingerprint:
  b3c9e7d1b5964d4eed85c40e1e6b3322deafbf93d9c66d74c69e04ab1f295583

ℹ️  Configure Kibana to use this cluster:
• Run Kibana and click the configuration link in the terminal when Kibana starts.
• Copy the following enrollment token and paste it into Kibana in your browser (valid for the next 30 minutes):
  eyJ2ZXIiOiI4LjEwLjQiLCJhZHIiOlsiMTkyLjE2OC4xMC42MTo5MjAwIl0sImZnciI6ImIzYzllN2QxYjU5NjRkNGVlZDg1YzQwZTFlNmIzMzIyZGVhZmJmOTNkOWM2NmQ3NGM2OWUwNGFiMWYyOTU1ODMiLCJrZXkiOiJheWozVTR3QkhlajNQYVpONjVIcjpsZWlwWTdRbVJUaW5sbDVKX3Z0X2hRIn0=

ℹ️ Configure other nodes to join this cluster:
• Copy the following enrollment token and start new Elasticsearch nodes with `bin/elasticsearch --enrollment-token <token>` (valid for the next 30 minutes):
  eyJ2ZXIiOiI4LjEwLjQiLCJhZHIiOlsiMTkyLjE2OC4xMC42MTo5MjAwIl0sImZnciI6ImIzYzllN2QxYjU5NjRkNGVlZDg1YzQwZTFlNmIzMzIyZGVhZmJmOTNkOWM2NmQ3NGM2OWUwNGFiMWYyOTU1ODMiLCJrZXkiOiJhU2ozVTR3QkhlajNQYVpONjVIZDo3WE9Kd0xqWlFlbVlfN1FXbHRrVXRBIn0=
```

+ 方式二：后台启动

```bash
[elasticsearch@es-1 ~]$ cd /usr/local/src/elasticsearch/bin/
[elasticsearch@es-1 bin]$ ./elasticsearch -d
```

+ 方式三：systemctl脚本管理（推荐）

```bash
[root@es-1 ~]# vim /usr/lib/systemd/system/elasticsearch.service
[Unit]
Description=Elasticsearch
Documentation=https://www.elastic.co
Wants=network-online.target
After=network-online.target

[Service]
Type=forking
User=elasticsearch
Group=elasticsearch
# 启动命令
ExecStart=/usr/local/src/elasticsearch/bin/elasticsearch -d
# 指定此进程可以打开的最大文件数
LimitNOFILE=65535
# 指定此进程可以打开的最大进程数
LimitNPROC=65535
# 最大虚拟内存
LimitAS=infinity
# 最大文件大小
LimitFSIZE=infinity
# 超时设置 0-永不超时
TimeoutStopSec=0
# SIGTERM是停止java进程的信号
KillSignal=SIGTERM
# 信号只发送给给JVM
KillMode=process
# java进程不会被杀掉
SendSIGKILL=no
# 正常退出状态
SuccessExitStatus=143

[Install]
WantedBy=multi-user.target

[root@es-1 ~]# systemctl daemon-reload
[root@es-1 ~]# systemctl enable elasticsearch --now 
```

### 访问验证
```bash
[elasticsearch@es-1 ~]$ curl --cacert /usr/local/src/elasticsearch/config/certs/http_ca.crt -u 'elastic:DTn87ndVW=7yGx=*r+y6' https://192.168.10.61:9200/_cluster/health
{"cluster_name":"my-es","status":"green","timed_out":false,"number_of_nodes":1,"number_of_data_nodes":1,"active_primary_shards":1,"active_shards":1,"relocating_shards":0,"initializing_shards":0,"unassigned_shards":0,"delayed_unassigned_shards":0,"number_of_pending_tasks":0,"number_of_in_flight_fetch":0,"task_max_waiting_in_queue_millis":0,"active_shards_percent_as_number":100.0}
```

## Kibana服务部署
### 新建Kibana账号和用户组
```bash
[root@es-1 ~]# useradd kibana
```

### 解压压缩包并指定用户和用户组
```bash
[root@es-1 ~]# wget https://artifacts.elastic.co/downloads/kibana/kibana-8.10.4-linux-x86_64.tar.gz
[root@es-1 ~]# tar -zxf kibana-8.10.4-linux-x86_64.tar.gz 
[root@es-1 ~]# mv kibana-8.10.4 /usr/local/src/kibana
[root@es-1 ~]# chown -R kibana:kibana /usr/local/src/kibana
```

### 修改kibana配置
> 使用kibana用户操作
>

```bash
[root@es-1 ~]# su kibana
[kibana@es-1 root]$ cd /usr/local/src/kibana/config/
[kibana@es-1 config]$ ls
kibana.yml  node.options
[kibana@es-1 config]$ vim kibana.yml
server.host: "0.0.0.0"
i18n.locale: "zh-CN" # 设置为中文
```

### 启动kibana
+ 方式一：控制台启动

```bash
[kibana@es-1 config]$ cd /usr/local/src/kibana/bin/
[kibana@es-1 bin]$ ./kibana
```

+ 方式二：systemctl管理（推荐）

```bash
[root@es-1 ~]# vim /usr/lib/systemd/system/kibana.service
[Unit]
Description=Kibana
Documentation=https://www.elastic.co
Wants=network-online.target
After=network-online.target

[Service]
Type=simple
User=kibana
Group=kibana
PrivateTmp=true

Environment=KBN_HOME=/usr/local/src/kibana
Environment=KBN_PATH_CONF=/usr/local/src/kibana/config

ExecStart=/usr/local/src/kibana/bin/kibana

Restart=on-failure
RestartSec=3

StartLimitBurst=3
StartLimitInterval=60

WorkingDirectory=/usr/local/src/kibana

StandardOutput=journal
StandardError=inherit

[Install]
WantedBy=multi-user.target

[root@es-1 ~]# systemctl daemon-reload
[root@es-1 ~]# systemctl enable kibana --now
```

## 初始化kibana配置
浏览器访问http://es-1:5601，按提示生成kibana注册令牌并填写即可。

![](assets/01-ELK-Stack/cd17678e7395db3f7142.png)

使用elasticsearch用户生成kibana注册令牌

```bash
[kibana@es-1 ~]$ cd /usr/local/src/elasticsearch/bin/
[kibana@es-1 bin]$ ./elasticsearch-create-enrollment-token --scope kibana
```

使用kibana用户生成二次校验码

```bash
[kibana@es-1 kibana]$ cd /usr/local/src/kibana/bin/
[kibana@es-1 bin]$ ./kibana-verification-code
```

# 安装ES+kibana（集群）
以常见的3节点部署es集群与Kibana服务为例，三个节点信息如下

| 主机名 | ip | 角色 | 部署服务 |
| --- | --- | --- | --- |
| es-1 | 192.168.10.61 | master、data | elasticsearch、kibana |
| es-2 | 192.168.10.62 | master、data | elasticsearch |
| es-3 | 192.168.10.63 | master、data | elasticsearch |


## elasticsearch服务部署
参考上文，与单节点方式部署elasticsearch服务操作基本相同

### 各节点elasticsearch.yml配置
> 注意各节点的node.name和network.host不同，es-2和es-3节点无需配置discovery.seed_hosts和cluster.initial_master_nodes。network.host也可以填写0.0.0.0，如果分为冷热架构，可以在初始化的时候指定节点角色。
>

+ es-1

```bash
cluster.name: my-es
node.name: es-1
path.data: /data/es-data
path.logs: /data/es-log
network.host: 192.168.10.61
discovery.seed_hosts: ["es-1", "es-2" ,"es-3"]
cluster.initial_master_nodes: ["es-1"]
```

+ es-2

```bash
cluster.name: my-es
node.name: es-2
path.data: /data/es-data
path.logs: /data/es-log
network.host: 192.168.10.62
```

+ es-3

```bash
cluster.name: my-es
node.name: es-3
path.data: /data/es-data
path.logs: /data/es-log
network.host: 192.168.10.63
```

### es-1节点elasticsearch服务并获取新节点加入集群的token
```bash
[root@es-1 ~]# systemctl enable elasticsearch --now 

[elasticsearch@es-1 bin]$ ./elasticsearch-create-enrollment-token -s node
eyJ2ZXIiOiI4LjEwLjQiLCJhZHIiOlsiMTkyLjE2OC4xMC42MTo5MjAwIl0sImZnciI6IjRlZGQxYzY0YmFlZTVmMmQ0YWQ1ZWMxNDYwMjk1NmVjZGE0OTk0MWUyNTY3OTExYmQyZTQwYzBkMzJiNzE2ZmUiLCJrZXkiOiJlNE9nVm93QjNtaDByOUhfOURBbjpRWjJiMlVkU1QtNi00ejFaUXQydEV3In0=
```

### es-2、es-3节点加入集群
> 执行此命令后，<font style="color:rgb(77, 77, 77);">会自动生成认证文件config/certs，并配置到elasticsearch.yml中，并启动elasticsearch服务。</font>
>

```bash
[elasticsearch@es-2 bin]$ ./elasticsearch --enrollment-token eyJ2ZXIiOiI4LjEwLjQiLCJhZHIiOlsiMTkyLjE2OC4xMC42MTo5MjAwIl0sImZnciI6IjRlZGQxYzY0YmFlZTVmMmQ0YWQ1ZWMxNDYwMjk1NmVjZGE0OTk0MWUyNTY3OTExYmQyZTQwYzBkMzJiNzE2ZmUiLCJrZXkiOiJlNE9nVm93QjNtaDByOUhfOURBbjpRWjJiMlVkU1QtNi00ejFaUXQydEV3In0=
[elasticsearch@es-3 bin]$ ./elasticsearch --enrollment-token eyJ2ZXIiOiI4LjEwLjQiLCJhZHIiOlsiMTkyLjE2OC4xMC42MTo5MjAwIl0sImZnciI6IjRlZGQxYzY0YmFlZTVmMmQ0YWQ1ZWMxNDYwMjk1NmVjZGE0OTk0MWUyNTY3OTExYmQyZTQwYzBkMzJiNzE2ZmUiLCJrZXkiOiJlNE9nVm93QjNtaDByOUhfOURBbjpRWjJiMlVkU1QtNi00ejFaUXQydEV3In0=
```

### 修改es配置
> 使用elasticsearch --enrollment-token命令加入集群后，默认配置文件discovery.seed_hosts: ["192.168.10.61:9300"]，本案例中使用3节点组成es集群，3个节点即是master节点也是数据节点，接下来改为集群所有节点配置。集群初始化完成后取消cluster.initial_master_nodes配置。
>

```bash
$ vim /usr/local/src/elasticsearch/config/elasticsearch.yml
discovery.seed_hosts: ["es-1", "es-2" ,"es-3"]
# cluster.initial_master_nodes: ["es-1"]
```

+ 重启elasticsearch服务

```bash
[root@es-2 ~]# systemctl enable elasticsearch
[root@es-2 ~]# systemctl restart elasticsearch
[root@es-3 ~]# systemctl enable elasticsearch
[root@es-3 ~]# systemctl restart elasticsearch
```

### 重新生成elastic密码
```bash
[elasticsearch@es-1 ~]$ cd /usr/local/src/elasticsearch/bin/
[elasticsearch@es-1 bin]$ ./elasticsearch-reset-password -u elastic
This tool will reset the password of the [elastic] user to an autogenerated value.
The password will be printed in the console.
Please confirm that you would like to continue [y/N]y
Password for the [elastic] user successfully reset.
New value: Ir7EQmINgxF4VhE8u=oV
```

### 访问验证
```bash
[root@es-1 ~]# curl --cacert /usr/local/src/elasticsearch/config/certs/http_ca.crt -u 'elastic:Ir7EQmINgxF4VhE8u=oV' https://192.168.10.61:9200/_cat/nodes?v
ip            heap.percent ram.percent cpu load_1m load_5m load_15m node.role   master name
192.168.10.61           17          95  46    1.44    0.39     0.13 cdfhilmrstw -      es-1
192.168.10.63           16          94  10    0.30    0.28     0.19 cdfhilmrstw -      es-3
192.168.10.62           26          92   8    0.26    0.28     0.21 cdfhilmrstw *      es-2
[root@es-1 ~]# curl --cacert /usr/local/src/elasticsearch/config/certs/http_ca.crt -u 'elastic:Ir7EQmINgxF4VhE8u=oV' https://192.168.10.61:9200/_cluster/health
{"cluster_name":"my-es","status":"green","timed_out":false,"number_of_nodes":3,"number_of_data_nodes":3,"active_primary_shards":1,"active_shards":2,"relocating_shards":0,"initializing_shards":0,"unassigned_shards":0,"delayed_unassigned_shards":0,"number_of_pending_tasks":0,"number_of_in_flight_fetch":0,"task_max_waiting_in_queue_millis":0,"active_shards_percent_as_number":100.0}
```

## kibana服务部署
参考上文，与单节点方式部署Kibana服务相同。


