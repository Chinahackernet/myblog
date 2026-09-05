# ELK监控与告警(Prometheus)

> 分类：ELK Stack / 第14章：ELK8生产实践
> 原文：https://www.cuiliangblog.cn/detail/section/162609454
> 来源：崔亮的博客

---

> kibana虽然也能实现告警，但仅能针对ES集群状态和查询结果配置告警规则，更多常用的告警媒介需要购买商业授权才可使用，且告警程序过度依赖Kibana服务，可能会因为单点故障导致告警无法正常触发。因此在生产环境中更推荐使用免费开源的Prometheus+Grafana方案实现ELK业务的监控与告警。
>

# 整体思路
## 监控架构图
![](assets/01-ELK-Stack/704f793249e3e4ffc9fa.png)

## 监控组件说明
虽然grafana也支持配置Prometheus的告警规则，计算并触发告警事件，使用告警媒介通知，可替代Alertmanager的一部分功能。但是相较于Alertmanager，缺少了告警分组和告警抑制功能。因此推荐还是在Prometheus中配置告警规则推送至Alertmanager，待grafana告警功能后续功能逐步完善再停用Alertmanager。

上图的监控架构中，Prometheus侧重各个exporter指标的监控，保障组件服务的正常运行。而grafana侧重日志内容监控，保障业务的正常运行。两者都将告警内容推送至Alertmanager，最终由Alertmanager实现告警分组、告警抑制、告警根据分组和等级实现自定义通知等功能。更多Alertmanager的功能请参考文档：[https://www.cuiliangblog.cn/detail/article/35](https://www.cuiliangblog.cn/detail/article/35)

除了上图的几个Exporter，还可以添加process export用于服务进程监控，详细内容可参考文章：[https://www.cuiliangblog.cn/detail/article/42](https://www.cuiliangblog.cn/detail/article/42)。以及使用blackbox-export黑盒检测，通过HTTP探针、TCP探针监控服务是否正常，详细内容可参考文章：[../02_Prometheus/05-06_Blackbox_Exporter.md](articles/02-Prometheus/05-06_Blackbox_Exporter.md)。

由于Filebeat未提供API接口，所以不支持export采集指标监控。但可以转换思路，我们可以监控Filebeat写入Kafka的Topic速率，间接实现Filebeat采集监控。

alertmanager对接webhook实现告警通知可参考文档：[https://www.cuiliangblog.cn/detail/article/57](https://www.cuiliangblog.cn/detail/article/57)

# 监控组件部署
为方便演示，所有服务均采用docker部署。

## <font style="color:rgb(48, 49, 51);">node-exporter部署</font>
在所有节点均执行

```bash
[root@es-master ~]# docker run -d -p 9100:9100 --pid="host" --name node-exporter --restart always -v "/:/host:ro,rslave" prom/node-exporter:latest --path.rootfs=/host
```

## <font style="color:rgb(48, 49, 51);">kafka-exporter部署</font>
在master节点执行

```bash
[root@es-master ~]# docker run -d -p 9308:9308 --name kafka-exporter --restart always danielqsj/kafka-exporter --kafka.server=192.168.10.133:9092 --kafka.server=192.168.10.134:9092 --kafka.server=192.168.10.135:9092
```

## logstash-exporter部署
先开启logstash api接口功能

```bash
[root@es-warm1 ~]# vim /etc/logstash/logstash.yml
api.http.host: 127.0.0.1
api.http.port: 9600
[root@es-warm1 ~]# systemctl restart logstash
```

在warm1节点部署

```bash
[root@es-warm1 ~]# docker run -d -p 9198:9198 --name logstash-exporter --restart always -e LOGSTASH_URL=http://192.168.10.136:9600 kuskoman/logstash-exporter:v1.4.0
```

## elasticsearch-exporter部署
在master节点部署

```bash
[root@es-master ~]# docker run -d -p 9114:9114 --name es-exporter --restart always quay.io/prometheuscommunity/elasticsearch-exporter:latest --es.uri=https://elastic:CHANGE_ME@192.168.10.132:9200 --es.indices --es.all --es.ssl-skip-verify
```

## Alertmanager部署配置
在master节点部署

```bash
[root@es-master ~]# docker run -d -p 9093:9093 --name alertmanager --restart always quay.io/prometheus/alertmanager
```

访问验证

![](assets/01-ELK-Stack/e096ead5669a64be7843.png)

## Prometheus部署配置
在master节点部署

```bash
[root@es-master ~]# mkdir /opt/prometheus
[root@es-master ~]# chown -R 65534:65534 /opt/prometheus
[root@es-master ~]# cd /opt/prometheus
[root@es-master prometheus]# docker run -d -p 9090:9090 --name prometheus --restart always -v $PWD/data:/prometheus prom/prometheus:latest
```

修改Prometheus配置文件，添加前面部署的exporter和alertmanager地址。

```bash
[root@es-master prometheus]# docker cp prometheus:/etc/prometheus/prometheus.yml .
[root@es-master prometheus]# vim prometheus.yml 
global:
  scrape_interval: 15s # Set the scrape interval to every 15 seconds. Default is every 1 minute.
  evaluation_interval: 15s # Evaluate rules every 15 seconds. The default is every 1 minute.
# 填写Alertmanager地址
alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - 192.168.10.132:9093

# 告警规则文件
rule_files:
  - /etc/prometheus/rules.yaml

# targets监控项
scrape_configs:
  - job_name: "prometheus"
    static_configs:
      - targets: ["localhost:9090"]
  - job_name: "node-exporter"
    static_configs:
      - targets: ["192.168.10.132:9100", "192.168.10.133:9100", "192.168.10.134:9100", "192.168.10.135:9100", "192.168.10.136:9100", "192.168.10.137:9100", "192.168.10.138:9100"]
  - job_name: "logstash-exporter"
    static_configs:
      - targets: ["192.168.10.136:9198"]
  - job_name: "kafka-exporter"
    static_configs:
      - targets: ["192.168.10.132:9308"]
  - job_name: "elasticsearch-exporter"
    static_configs:
      - targets: ["192.168.10.132:9114"]
[root@es-master prometheus]# docker cp prometheus.yml prometheus:/etc/prometheus/
[root@es-master prometheus]# docker restart prometheus
```

访问验证

![](assets/01-ELK-Stack/122ae9f23e3f7f6537bd.png)

## grafana部署配置
在master节点部署

```bash
[root@es-master ~]# docker run --name grafana -d -p 3000:3000 --restart always grafana/grafana:10.0.3
```

访问验证，默认用户名密码为admin

![](assets/01-ELK-Stack/ea21bdd83982deff5f91.png)

添加Elasticsearch数据源

![](assets/01-ELK-Stack/80a837fcdb4d78960daa.png)

填写Elasticsearch配置信息

![](assets/01-ELK-Stack/b11d94d4729392814dd6.png)

设置Alertmanager为默认告警媒介

![](assets/01-ELK-Stack/8ca178543cffb4ddbecf.png)

点击右侧test按钮，发送测试告警信息，在alertmanager中查看。

![](assets/01-ELK-Stack/b694cd3418b2809fbefc.png)

# grafana图表制作
我们可以通过grafana实现Prometheus监控指标的可视化，推荐大家从grafana的dashboard中心选择合适的dashboard，然后下载并导入本地grafana中，官方dashboard中心地址：[https://grafana.com/grafana/dashboards/](https://grafana.com/grafana/dashboards/)，本案例中制作的dashboard已上传至git仓库，仓库地址：[https://gitee.com/cuiliang0302/log_demo/tree/main/other/grafana%20dashboard](https://gitee.com/cuiliang0302/log_demo/tree/main/other/grafana%20dashboard)，以下是各个exporter监控效果图。

## Node
![](assets/01-ELK-Stack/f4f481153c455f180fcc.png)

![](assets/01-ELK-Stack/9e57aa9486945b40ab3f.png)

## Kafka
![](assets/01-ELK-Stack/4b0d85b3c9765cd0278f.png)

## Logstash
![](assets/01-ELK-Stack/06910fcb8256dacd2b42.png)

## Elasticsearch
![](assets/01-ELK-Stack/3818a4ce6ea599a38eab.png)

# 告警规则配置(Grafana)
接下来以业务告警为例，告警条件为最近连续5分钟日志中5XX错误个数超过10个触发告警。

## 添加告警规则
点击左边栏alerting进入告警管理中心：

+ Alert rules：告警规则管理
+ Contact points：告警联系人管理
+ Notification policies：告警通知策略管理
+ Silence：告警静默管理
+ Alert group：告警历史管理

![](assets/01-ELK-Stack/c1b4f8ff68af0ea36296.png)

点击create alert rule创建告警规则。

## 告警规则配置
### 设置告警名称
![](assets/01-ELK-Stack/5549fca03b57196ae762.png)

### 设置告警条件
![](assets/01-ELK-Stack/f745c772d5b81ff98885.png)

**选择 Expression**

Grafana 支持 5 种 expression 类型，根据需要选择合适的 expression 类型（使用方法 详见官方文档 ）：

1. Math： Math 是关于时间序列或数字数据的自由形式的数学公式。数学运算以数字和时间序列为输入，并将其转换为不同的数字和时间序列。
2. Reduce： Reduce 获取从查询或表达式返回的一个或多个时间序列，并将每个序列转换为单个数字。时间序列的标签作为标签保存在每个输出的减少数上。
3. Resample： Resample 更改每个时间序列中的时间戳，使其具有一致的时间间隔。主要用例是可以重新采样不共享相同时间戳的时间序列，以便在它们之间执行数学运算。这可以通过对两个系列中的每一个进行重新采样，然后在Math操作中引用重新采样的变量来实现。
4. Classic condition： 从查询或表达式返回的结果中获取一个或多个时间序列，并检查是否有任何序列匹配阈值条件。
5. Threshold： 从查询或表达式返回的结果中获取一个或多个时间序列，并检查是否有任何序列匹配阈值条件。

**设置告警策略**

即达到某个阈值后触发告警

is above：大于

is below：小于

is within range：在某个区间内

is outside range：在某个区间外

Input：数据来源

### 设置告警评估
![](assets/01-ELK-Stack/cdcf0c2cebed616dd711.png)

### 设置告警内容
![](assets/01-ELK-Stack/54a02f6a2a026464761b.png)

### 添加告警标签
![](assets/01-ELK-Stack/6f599ab8deafe55211c5.png)

通常情况下会为每条告警添加告警组、告警等级标签。方便alertmanager根据不同的告警组和标签，通过不同的告警媒介实现告警分组分级通知。

## 查看Alertmanager记录
![](assets/01-ELK-Stack/33fb00652f617c411652.png)

# 告警规则配置(Prometheus)
Prometheus主要侧重服务可用性与性能监控，主要从os、kafka、logstash、Elasticsearch几个方面监控，强烈推荐大家访问[https://samber.github.io/awesome-prometheus-alerts/](https://samber.github.io/awesome-prometheus-alerts/)，上面有上百条告警规则，直接抄作业即可。

## 添加告警规则
我们先添加4条测试告警，用于演示测试，大家可根据需求添加其他告警规则。

```bash
[root@es-master prometheus]# vim rules.yaml
groups:
- name: node
  rules:
  - alert: OsNodeStatusIsDown
    expr: up{job="node_exporter"} == 0
    for: 2m
    labels:
      severity: warning
    annotations:
      summary: "node {{ $labels.instance }} down"
      description: "{{$labels.instance}} OS down more than 5 minutes"
- name: prometheus
  rules: 
  - alert: PrometheusTargetMissing
    expr: up == 0
    for: 2m
    labels:
      severity: warning
    annotations:
      summary: "Prometheus target missing"
      description: "Prometheus {{ $labels.job }} target missing"
- name: elasticsearch
  rules:
  - alert: ElasticsearchHealthyNodes
    expr: elasticsearch_cluster_health_number_of_nodes < 7
    for: 2m
    labels:
      severity: danger
    annotations:
      summary: Elasticsearch Healthy Nodes (instance {{ $labels.instance }})
      description: "Missing node in Elasticsearch cluster VALUE = {{ $value }}"
- name: Kafka
  rules:
  - alert: KafkaBrokerNotReady
    expr: kafka_brokers < 3
    for: 2m
    labels:
      severity: danger
    annotations:
      summary: Kafka Healthy Nodes (instance {{ $labels.instance }})
      description: "Missing node in Kafka cluster VALUE = {{ $value }}"
[root@es-master prometheus]# docker cp rules.yaml prometheus:/etc/prometheus/
[root@es-master prometheus]# docker restart prometheus
```

## Prometheus查看告警规则
重启Prometheus后，查看alerts页面，已加载四条告警规则，且全部处于inactive状态。

![](assets/01-ELK-Stack/2eca60d934978ec71b1c.png)

## 故障模拟
我们将hot1节点es服务停止，模拟节点宕机导致服务异常停止运行状况。

```bash
[root@es-hot1 ~]# systemctl stop elasticsearch
```

## 查看Alertmanager记录
![](assets/01-ELK-Stack/879d3459e90978a81c10.png)

# 参考文档
node exporter：[https://github.com/prometheus/node_exporter](https://github.com/prometheus/node_exporter)

logstash exporter：[https://github.com/kuskoman/logstash-exporter](https://github.com/kuskoman/logstash-exporter)

kafka Exporter：[https://github.com/danielqsj/kafka_exporter](https://github.com/danielqsj/kafka_exporter)

es exporter：[https://github.com/prometheus-community/elasticsearch_exporter](https://github.com/prometheus-community/elasticsearch_exporter)

Prometheus告警规则参考：[https://samber.github.io/awesome-prometheus-alerts/](https://samber.github.io/awesome-prometheus-alerts/)

grafana告警配置：[https://grafana.com/docs/grafana/latest/alerting/fundamentals/alert-rules/](https://grafana.com/docs/grafana/latest/alerting/fundamentals/alert-rules/)




