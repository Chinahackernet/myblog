# 输出到Logstash

> 分类：ELK Stack / 第9章：Filebeat
> 原文：https://www.cuiliangblog.cn/detail/section/133757861
> 来源：崔亮的博客

---

# 配置文件
配置filebeat-to-logstash.yml

```yaml
filebeat.inputs:
- type: log 
  enabled: true
  paths:
    - /var/log/messages*
output.logstash:
  # 如果是多节点可输入多个IP地址
  hosts: ["127.0.0.1:5044"]
  # 是否启用压缩，启用压缩的话会导致cpu运算压力增大
  compression_level: 3
  # 多节点的logstash负载均衡
  loadbalance: true
```

# 启动filebeat
`filebeat -e -c filebeat-to-logstash.yml`

# 配置启动Logstash
```yaml
[root@local-vm ~]# cat pipeline.conf 
input {
  beats {
    port => 5044
  }
}
#filter { #过滤，对数据进行分割、截取等处理
#	...
#}
output {
    stdout {
        codec => rubydebug { } 
    }   
}
[root@local-vm ~]# logstash -r -f /root/pipeline.conf
```

# 查看Logstash输出
```yaml
{
       "message" => "Jul 20 08:57:22 localhost kernel: pci 0000:00:16.0: PCI bridge to [bus 0a]",
           "ecs" => {
        "version" => "8.0.0"
    },
         "agent" => {
                  "id" => "a4d9724e-1ac6-41d2-afe3-afaaf6a7162d",
        "ephemeral_id" => "591f3fe6-7b78-45a5-9fab-1c1962b166eb",
                "type" => "filebeat",
             "version" => "8.8.2",
                "name" => "local-vm"
    },
          "host" => {
        "name" => "local-vm"
    },
           "log" => {
        "offset" => 54155,
          "file" => {
            "path" => "/var/log/messages"
        }
    },
    "@timestamp" => 2023-07-20T02:40:21.925Z,
          "tags" => [
        [0] "beats_input_codec_plain_applied"
    ],
         "input" => {
        "type" => "log"
    },
      "@version" => "1",
         "event" => {
        "original" => "Jul 20 08:57:22 localhost kernel: pci 0000:00:16.0: PCI bridge to [bus 0a]"
    }
}
```


