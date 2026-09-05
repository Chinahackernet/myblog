## 1\. Prometheus介绍

  

### 1.1. Prometheus简介

  

Prometheus 是一款基于时序数据库的开源监控告警系统，非常适合Kubernetes集群的监控。Prometheus的基本原理是通过HTTP协议周期性抓取被监控组件的状态，任意组件只要提供对应的HTTP接口就可以接入监控。不需要任何SDK或者其他的集成过程。这样做非常适合做虚拟化环境监控系统，比如VM、Docker、Kubernetes等。输出被监控组件信息的HTTP接口被叫做exporter 。目前互联网公司常用的组件大部分都有exporter可以直接使用，比如Varnish、Haproxy、Nginx、MySQL、Linux系统信息(包括磁盘、内存、CPU、网络等等)。Promethus有以下特点：

  

-   支持多维数据模型：由度量名和键值对组成的时间序列数据

-   内置时间序列数据库TSDB

-   支持PromQL查询语言，可以完成非常复杂的查询和分析，对图表展示和告警非常有意义

-   支持HTTP的Pull方式采集时间序列数据

-   支持PushGateway采集瞬时任务的数据

-   支持服务发现和静态配置两种方式发现目标

-   支持接入Grafana

  

### 1.2. Prometheus架构

  

![](assets/监控与可观测性/02-1-Prometheus入门/02-1-Prometheus入门-1.png)

  

#### 1.2.1. Prometheus Server

  

主要负责数据采集和存储，提供PromQL查询语言的支持。包含了三个组件：

  

-   Retrieval: 获取监控数据

-   TSDB: 时间序列数据库(Time Series Database)，我们可以简单的理解为一个优化后用来处理时间序列数据的软件，并且数据中的数组是由时间进行索引的。具备以下特点：

-   大部分时间都是顺序写入操作，很少涉及修改数据

-   删除操作都是删除一段时间的数据，而不涉及到删除无规律数据

-   读操作一般都是升序或者降序

-   HTTP Server: 为告警和出图提供查询接口

  

#### 1.2.2. 指标采集

  

-   Exporters: Prometheus的一类数据采集组件的总称。它负责从目标处搜集数据，并将其转化为Prometheus支持的格式。与传统的数据采集组件不同的是，它并不向中央服务器发送数据，而是等待中央服务器主动前来抓取

-   Pushgateway: 支持临时性Job主动推送指标的中间网关

  

#### 1.2.3. 服务发现

  

-   Kubernetes\_sd: 支持从Kubernetes中自动发现服务和采集信息。而Zabbix监控项原型就不适合Kubernets，因为随着Pod的重启或者升级，Pod的名称是会随机变化的。

-   file\_sd: 通过配置文件来实现服务的自动发现

  

#### 1.2.4. 告警管理

  

通过相关的告警配置，对触发阈值的告警通过页面展示、短信和邮件通知的方式告知运维人员。

  

#### 1.2.5. 图形化展示

  

通过ProQL语句查询指标信息，并在页面展示。虽然Prometheus自带UI界面，但是大部分都是使用Grafana出图。另外第三方也可以通过 API 接口来获取监控指标。

  

### 1.3. 对比Zabbix

<table class="lake-table" style=""><colgroup><col /><col /></colgroup><tr><th style="text-align:left"><strong>Zabbix</strong></th><th style="text-align:left"><strong>Prometheus</strong></th></tr><tbody><tr><td style="text-align:left">后端用 C 开发，界面用 PHP 开发，定制化难度很高。</td><td style="text-align:left">后端用 golang 开发，前端是 Grafana，JSON 编辑即可解决。定制化难度较低。</td></tr><tr><td style="text-align:left">集群规模上限为 10000 个节点。</td><td style="text-align:left">支持更大的集群规模，速度也更快。</td></tr><tr><td style="text-align:left">更适合监控物理机环境，以IP地址为监控标识</td><td style="text-align:left">更适合云环境的监控，对 OpenStack，Kubernetes 有更好的集成。</td></tr><tr><td style="text-align:left">监控数据存储在关系型数据库内，如 MySQL，很难从现有数据中扩展维度。</td><td style="text-align:left">监控数据存储在基于时间序列的数据库内，便于对已有数据进行新的聚合。</td></tr><tr><td style="text-align:left">安装简单，zabbix-server 一个软件包中包括了所有的服务端功能。</td><td style="text-align:left">安装相对复杂，监控、告警和界面都分属于不同的组件。</td></tr><tr><td style="text-align:left">图形化界面比较成熟，界面上基本上能完成全部的配置操作。</td><td style="text-align:left">界面相对较弱，很多配置需要修改配置文件。</td></tr></tbody></table>

  

主要使用场景区别是，Zabbix适合用于虚拟机、物理机的监控，因为每个监控指标是以 IP 地址作为标识进行区分的。而Prometheus的监控指标是由多个 label 组成，IP地址并不是唯一的区分指标，Prometheus 强大在可以支持自动发现规则，因此适合于容器环境。  
从自定义监控项角度而言，Prometheus 开发难度较大，zabbix配合shell脚本更加方便。Prometheus在监控虚拟机上业务时，可能需要安装多个 exporter，而zabbix只需要安装一个 Agent。  
Prometheus 采用拉数据方式，即使采用的是push-gateway，prometheus也是从push-gateway拉取数据。而Zabbix可以推可以拉。

---

## 2\. Prometheus简单部署

  

此处仅简单部署Promethues监控，用于熟悉Prometheus查询语句和配置文件。Prometheus高可用方案和自动发现可以参考后面的章节。

<table class="lake-table" style=""><colgroup><col /><col /><col /><col /></colgroup><tr><th>主机名</th><th>IP地址</th><th>OS</th><th>用途</th></tr><tbody><tr><td>prometheus-72</td><td>10.4.7.72</td><td>CentOS  7.5</td><td>Prometheus, Node Exporter</td></tr><tr><td>grafana-79</td><td>10.4.7.79</td><td>CentOS  7.5</td><td>Grafana</td></tr></tbody></table>

  

### 2.1. 部署Prometheus

  

#### 2.1.1. 部署和配置prometheus

  

```
[root@prometheus-72 ~]# cd /opt/src/
# 下载不成功，可以使用浏览器下载，或者多线程下载器。https://prometheus.io/download/
[root@prometheus-72 src]# wget https://github.com/prometheus/prometheus/releases/download/v2.22.0-rc.0/prometheus-2.22.0-rc.0.linux-amd64.tar.gz
[root@prometheus-72 src]# tar -xf prometheus-2.22.0-rc.0.linux-amd64.tar.gz -C /opt/release/
[root@prometheus-72 src]# ln -s /opt/release/prometheus-2.22.0-rc.0.linux-amd64 /opt/apps/prometheus
```

  

```
[root@prometheus-72 ~]# vim /opt/apps/prometheus/prometheus.yml # 主配置文件
global:
  # 采集周期
  scrape_interval:     60s
  external_labels:
    monitor: 'codelab-monitor'

scrape_configs:
  # prometheus 自身监控
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']
  
  # node_exporter 监控数据采集 
  - job_name: 'node'
    static_configs:
      - targets:
          - "10.4.7.72:9100"
    relabel_configs:
      - source_labels: [__address__]
        regex: (.+):[0-9]+
        target_label: host
[root@prometheus-72 ~]# /opt/apps/prometheus/promtool check config /opt/apps/prometheus/prometheus.yml # 检查配置文件
Checking /opt/apps/prometheus/prometheus.yml
  SUCCESS: 0 rule files found
```

  

```
[root@prometheus-72 ~]# vim /usr/lib/systemd/system/prometheus.service
[Unit]
Description=prometheus service
# 如果该机器上部署了时间同步服务或者ntp脚本，不太建议设置开机自启动
# 非常容易出现 Error on ingesting samples that are too old or are too far into the future
After=network.target ntpdate.service sntp.service ntpd.service chronyd.service

[Service]
User=prometheus
Group=prometheus
KillMode=control-group
Restart=on-failure
RestartSec=60
ExecStart=/opt/apps/prometheus/prometheus --config.file=/opt/apps/prometheus/prometheus.yml --web.console.templates=/opt/apps/prometheus/consoles --web.console.libraries=/opt/apps/prometheus/console_libraries --storage.tsdb.path=/data/prometheus --log.level=info
ExecReload=/bin/kill -HUP $MAINPID

[Install]
WantedBy=multi-user.target
[root@prometheus-72 ~]# systemctl daemon-reload 
[root@prometheus-72 ~]# systemctl start prometheus.service .
[root@prometheus-72 ~]# systemctl enable prometheus.service
```

  

#### 2.1.2. 配置域名

  

启动 promethues 后，可以通过 9090 端口访问web页面，为了更贴近生产环境，配置下nginx的虚拟主机  
![](assets/监控与可观测性/02-1-Prometheus入门/02-1-Prometheus入门-2.png)  
考虑到宿主机(win10)上开启 WSL2 ，并安装了 ubuntu-1804，直接在子系统中配置nginx，不再污染虚拟机环境。

  

```
[root@duduniao ~]# vim /etc/nginx/conf.d/prometheus.conf
server {
    server_name prometheus.ddn.com;
    listen 80;
    error_page   500 502 503 504  /50x.html;
    location / {
        proxy_pass http://10.4.7.72:9090;
    }
    location =50x.html {
        return 403 "error request\n";
    }
}
```

  

![](assets/监控与可观测性/02-1-Prometheus入门/02-1-Prometheus入门-3.png)

  

### 2.2. 部署Node-Exporter

  

在部署Prometheus后，发现图像界面的Target中node状态异常，因为prometheus无法通过 [http://10.4.7.92:9100/metrics](http://10.4.7.92:9100/metrics) 接口取到监控数据。

  

```
[root@prometheus-72 ~]# cd /opt/src/
# 下载地址页面：https://prometheus.io/download/
[root@prometheus-72 src]# wget https://github.com/prometheus/node_exporter/releases/download/v1.0.1/node_exporter-1.0.1.linux-amd64.tar.gz
[root@prometheus-72 src]# tar -xf node_exporter-1.0.1.linux-amd64.tar.gz -C /opt/release/
[root@prometheus-72 src]# ln -s /opt/release/node_exporter-1.0.1.linux-amd64 /opt/apps/node_exporter
[root@prometheus-72 src]# groupadd -g 9100 monitor
[root@prometheus-72 src]# useradd -g 9100 -u 9100 -s /sbin/nologin -M monitor
[root@prometheus-72 src]# chown -R monitor.monitor /opt/release/node_exporter-1.0.1.linux-amd64
```

  

```
[root@prometheus-72 ~]# vim /usr/lib/systemd/system/node_exporter.service
[Unit]
Description=node-exporter service
After=network.target

[Service]
User=monitor
Group=monitor
KillMode=control-group
Restart=on-failure
RestartSec=60
# 启动参数可以使用 /opt/apps/node_exporter/node_exporter --help 查看
ExecStart=/opt/apps/node_exporter/node_exporter --collector.disable-defaults --log.level=error --collector.cpu --collector.meminfo --collector.cpu.info --collector.diskstats --collector.ipvs  --collector.loadavg --collector.netclass

[Install]
WantedBy=multi-user.target
[root@prometheus-72 ~]# systemctl daemon-reload 
[root@prometheus-72 ~]# systemctl start node_exporter.service ; systemctl enable node_exporter.service
```

  

![](assets/监控与可观测性/02-1-Prometheus入门/02-1-Prometheus入门-4.png)

  

### 2.3. 部署Grafana

  

#### 2.3.1. 部署grafana

  

```
[root@grafana-79 ~]# cd /opt/src/
[root@grafana-79 src]# wget https://dl.grafana.com/oss/release/grafana-7.2.1.linux-amd64.tar.gz

[root@grafana-79 src]# tar -xf grafana-7.2.1.linux-amd64.tar.gz -C /opt/release/
[root@grafana-79 src]# ln -s /opt/release/grafana-7.2.1 /opt/apps/grafana

[root@grafana-79 src]# cp /opt/apps/grafana/conf/sample.ini /opt/apps/grafana/conf/grafana.ini # 拷贝示例配置文件
[root@grafana-79 src]# vim /opt/apps/grafana/conf/grafana.ini # 仅对以下内容进行修改，更多配置后续博客更新
[paths]
data = /data/grafana
logs = /opt/logs/grafana
plugins = /opt/apps/grafana/plugins
[log]
mode = file
level = warn
```

  

```
[root@grafana-79 src]# groupadd -g 9100 monitor
[root@grafana-79 src]# useradd -g 9100 -u 9100 -s /sbin/nologin -M monitor
[root@grafana-79 src]# mkdir /data/grafana /opt/logs/grafana
[root@grafana-79 src]# chown -R monitor.monitor /opt/release/grafana-7.2.1 /data/grafana /opt/logs/grafana
[root@grafana-79 src]# vim /usr/lib/systemd/system/grafana.service
[Unit]
Description=grafana service
After=network.target

[Service]
User=monitor
Group=monitor
KillMode=control-group
Restart=on-failure
RestartSec=60
ExecStart=/opt/apps/grafana/bin/grafana-server -config /opt/apps/grafana/conf/grafana.ini -pidfile /opt/apps/grafana/grafana.pid -homepath /opt/apps/grafana

[Install]
WantedBy=multi-user.target
[root@grafana-79 src]# systemctl daemon-reload 
[root@grafana-79 src]# systemctl restart grafana.service 
[root@grafana-79 src]# systemctl enable grafana.service 
[root@grafana-79 src]# netstat -lntp | grep grafana
tcp6       0      0 :::3000                 :::*                    LISTEN      1547/grafana-server
```

  

#### 2.3.2. 配置数据源

  

-   访问 grafana.ddn.com，默认用户名和密码均为 admin

  

![](assets/监控与可观测性/02-1-Prometheus入门/02-1-Prometheus入门-5.png)

  

-   添加数据源

  

![](assets/监控与可观测性/02-1-Prometheus入门/02-1-Prometheus入门-6.png)  
![](assets/监控与可观测性/02-1-Prometheus入门/02-1-Prometheus入门-7.png)  
![](assets/监控与可观测性/02-1-Prometheus入门/02-1-Prometheus入门-8.png)  
![](assets/监控与可观测性/02-1-Prometheus入门/02-1-Prometheus入门-9.png)  
![](assets/监控与可观测性/02-1-Prometheus入门/02-1-Prometheus入门-10.png)

  

-   查看dashboard

  

![](assets/监控与可观测性/02-1-Prometheus入门/02-1-Prometheus入门-11.png)

---

![](assets/监控与可观测性/02-1-Prometheus入门/02-1-Prometheus入门-12.png)