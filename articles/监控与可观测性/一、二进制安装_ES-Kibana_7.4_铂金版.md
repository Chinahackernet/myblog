## 1 下载安装包  

从官方下载安装包。

[https://artifacts.elastic.co/downloads/elasticsearch/elasticsearch-7.4.0-linux-x86\_64.tar.gz](https://artifacts.elastic.co/downloads/elasticsearch/elasticsearch-7.4.0-linux-x86_64.tar.gz)

[https://artifacts.elastic.co/downloads/kibana/kibana-7.4.0-linux-x86\_64.tar.gz](https://artifacts.elastic.co/downloads/kibana/kibana-7.4.0-linux-x86_64.tar.gz)

## 2 解压安装  

解压：

tar zxf elasticsearch-7.7.0-linux-x86\_64.tar.gz

tar zxf kibana-7.4.0-linux-x86\_64.tar.gz

  

[root@holder-ops-logs data]# pwd

/data

[root@holder-ops-logs data]# ll

drwxr-xr-x 10 ops ops 4096 May 22 15:46 elasticsearch

drwxr-xr-x 15 root root 4096 May 22 15:48 kibana

drwx------ 2 root root 16384 May 21 12:34 lost+found

drwxr-xr-x 3 root root 4096 May 22 15:42 tools

## 3 ES配置

改启动内存   jvm.options

![图片.png](assets/监控与可观测性/一、二进制安装_ES-Kibana_7.4_铂金版/一、二进制安装_ES-Kibana_7.4_铂金版-1.png)

配置文件 elasticsearch.yml

[root@holder-ops-logs config]# grep ^[a-Z] elasticsearch.yml

[cluster.name](http://cluster.name): es-logs

[node.name](http://node.name): node-1

path.data: /data/elasticsearch/data

path.logs: /data/elasticsearch/logs

network.host: 172.16.204.250

http.port: 9200

discovery.seed\_hosts: ["172.16.204.250"]

cluster.initial\_master\_nodes: ["172.16.204.250"]

#下面是服务添加xpack密码验证的。

http.cors.enabled: true

http.cors.allow-origin: "\*"

http.cors.allow-headers: Authorization

xpack.security.enabled: true

xpack.security.transport.ssl.enabled: true

  

  

创建数据目录

mkdir /data/elasticsearch/data

  

替换破解文件

mv /data/elasticsearch/modules/x-pack-core/x-pack-core-7.4.0.jar /data/elasticsearch/modules/x-pack-core/x-pack-core-7.4.0.jar.bak

cp /data/tools/es7.4-key/x-pack-core-7.4.0.jar /data/elasticsearch/modules/x-pack-core/x-pack-core-7.4.0.jar

  

修改目录权限（es不能用root启动）

```plain
adduser ops -M
chown -R ops.ops /data/elasticsearch
添加systemd启动文件
```

  

```plain
[root@holder-ops-logs x-pack-core]# cat /etc/systemd/system/elasticsearch.service
[Unit]
Description=elasticsearch
After=network.target
[Service]
Type=simple
User=ops
Group=ops
WorkingDirectory=/data/elasticsearch
Environment=PATH=/usr/local/jdk/bin:/usr/local/git/bin:/usr/local/sbin:/usr/local/bin:/sbin:/bin:/usr/sbin:/usr/bin:/root/bin
ExecStart=/data/elasticsearch/bin/elasticsearch
LimitNOFILE=65536
StandardOutput=journal
StandardError=inherit
LimitNPROC=4096
LimitMEMLOCK=infinity
LimitAS=infinity
LimitFSIZE=infinity
TimeoutStopSec=0
KillMode=process
KillSignal=SIGTERM
SendSIGKILL=no
SuccessExitStatus=143
[Install]
WantedBy=multi-user.target
```

  

```plain
启动服务并添加密码。
systemctl start elasticsearch
/data/elasticsearch/bin/elasticsearch-setup-passwords interactive
输入y 然后创建对应用户密码。
```

## 4 Kibana配置

kibana.yml

  

[root@holder-ops-logs config]# grep ^[a-Z] kibana.yml

server.port: 5671

server.host: "0.0.0.0"

elasticsearch.hosts: \["[http://172.16.204.250:9200](http://172.16.204.250:9200)"\]

elasticsearch.username: "kibana"

elasticsearch.password: "刚刚输入的密码"

logging.dest: /data/kibana/logs/kibana.log

i18n.locale: "zh-CN"

  

创建日志目录

mkdir /data/kibana/logs

  

创建systemd启动文件

  

[root@holder-ops-logs config]# cat /etc/systemd/system/kibana.service

[Unit]

Description=Kibana

[Service]

Type=simple

User=root

Group=root

\# Load env vars from /etc/default/ and /etc/sysconfig/ if they exist.

\# Prefixing the path with '-' makes it try to load, but if the file doesn't

\# exist, it continues onward.

EnvironmentFile=-/usr/local/kibana/config

EnvironmentFile=-/etc/sysconfig/kibana

ExecStart=/data/kibana/bin/kibana --allow-root "-c /data/kibana/config/kibana.yml"

Restart=always

WorkingDirectory=/

[Install]

WantedBy=multi-user.target

  

启动服务

systemctl start kibana

  

web访问kibana

  

账户信息： 用户名  elastic   密码： 刚刚es时创建的密码。

  

最后在许可管理里面把license.json文件导入即可。