# 输出到kafka

> 分类：ELK Stack / 第9章：Filebeat
> 原文：https://www.cuiliangblog.cn/detail/section/31224252
> 来源：崔亮的博客

---

1. 新建一个filebeat的配置文件filebeat-kafka.yml

```yaml
filebeat.inputs:
- type: log
  paths:
  - /usr/local/tomcat/logs/catalina.*
output.kafka:
  enable: true
  hosts:  ["192.168.10.101:9092","192.168.10.102:9092","192.168.10.103:9092"] # kafka borker地址
  topic: "log_demo" # kafka生产主题
  compression: gzip # 使用压缩
  required_acks: -1 # borker要求的ACK可靠性级别。0=无响应，1=等待本地提交，-1=等待所有副本提交。默认值为 1。
  partition.round_robin:
    reachable_only: true # Filebeat提供多种输出至kafka分区的策略，包括random，round_robin，hash，默认是 hash。我们指定round_robin的策略，并指定reachable_only为true，这表示仅将日志发布到可用分区。
```

2. 启动filebeat

`filebeat -e -c filebeat-kafka.yml `

3. 查看kafka数据

![](assets/01-ELK-Stack/795b97e0e2599b4a5c76.png)


