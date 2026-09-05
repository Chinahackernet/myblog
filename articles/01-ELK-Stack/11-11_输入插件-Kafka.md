# 输入插件-Kafka

> 分类：ELK Stack / 第11章：Logstash
> 原文：https://www.cuiliangblog.cn/detail/section/133733333
> 来源：崔亮的博客

---

# kafka数据查看
![](assets/01-ELK-Stack/43c1cb4210029cdee2c1.png)

# 修改Logstash配置
```bash
input {
    kafka {
        bootstrap_servers => "192.168.10.101:9092,192.168.10.102:9092,192.168.10.103:9092"
        auto_offset_reset => "latest" # 从最新的偏移量开始消费
        consumer_threads => 1 
        decorate_events => true # 此属性会将当前topic、offset、group、partition等信息也带到message中
        topics => ["log_demo"]
        codec => "json"
        group_id => "logstash" # 消费组id，如果需要重新从头消费的话，可更换id
    }
}
#filter { #过滤，对数据进行分割、截取等处理
#       ...
#}
output {
    stdout {
        codec => rubydebug { } 
    }
}
```

# 查看控制台打印
```bash
{
         "event" => {
        "original" => "{\"@timestamp\":\"2023-07-20T13:32:04.205Z\",\"@metadata\":{\"beat\":\"filebeat\",\"type\":\"_doc\",\"version\":\"8.8.2\"},\"input\":{\"type\":\"log\"},\"ecs\":{\"version\":\"8.0.0\"},\"host\":{\"name\":\"es-cold\"},\"agent\":{\"type\":\"filebeat\",\"version\":\"8.8.2\",\"ephemeral_id\":\"d135a581-fa8d-4749-af81-31bb1b73a6a5\",\"id\":\"5d6d4273-b4f8-4cf4-ba39-abab53f6aea2\",\"name\":\"es-cold\"},\"log\":{\"offset\":3378725,\"file\":{\"path\":\"/var/log/log_demo/info.log\"}},\"message\":\"{\\\"text\\\": \\\"2023-07-20 21:32:04.186 | INFO     | __main__:debug_log:49 - {'access_status': 200, 'request_method': 'GET', 'request_uri': '/management/', 'request_length': 36, 'remote_address': '126.99.204.228', 'server_name': 'cm-4.cn', 'time_start': '2023-07-20T21:32:03.750+08:00', 'time_finish': '2023-07-20T21:32:04.699+08:00', 'http_user_agent': 'Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.1; Trident/6.0; Touch; MASMJS)'}\\\\n\\\", \\\"record\\\": {\\\"elapsed\\\": {\\\"repr\\\": \\\"0:21:32.919851\\\", \\\"seconds\\\": 1292.919851}, \\\"exception\\\": null, \\\"extra\\\": {}, \\\"file\\\": {\\\"name\\\": \\\"main.py\\\", \\\"path\\\": \\\"/opt/logDemo/main.py\\\"}, \\\"function\\\": \\\"debug_log\\\", \\\"level\\\": {\\\"icon\\\": \\\"ℹ️\\\", \\\"name\\\": \\\"INFO\\\", \\\"no\\\": 20}, \\\"line\\\": 49, \\\"message\\\": \\\"{'access_status': 200, 'request_method': 'GET', 'request_uri': '/management/', 'request_length': 36, 'remote_address': '126.99.204.228', 'server_name': 'cm-4.cn', 'time_start': '2023-07-20T21:32:03.750+08:00', 'time_finish': '2023-07-20T21:32:04.699+08:00', 'http_user_agent': 'Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.1; Trident/6.0; Touch; MASMJS)'}\\\", \\\"module\\\": \\\"main\\\", \\\"name\\\": \\\"__main__\\\", \\\"process\\\": {\\\"id\\\": 1, \\\"name\\\": \\\"MainProcess\\\"}, \\\"thread\\\": {\\\"id\\\": 139940187904896, \\\"name\\\": \\\"MainThread\\\"}, \\\"time\\\": {\\\"repr\\\": \\\"2023-07-20 21:32:04.186187+08:00\\\", \\\"timestamp\\\": 1689859924.186187}}}\"}"
    },
         "input" => {
        "type" => "log"
    },
          "host" => {
        "name" => "es-cold"
    },
         "agent" => {
                  "id" => "5d6d4273-b4f8-4cf4-ba39-abab53f6aea2",
                "type" => "filebeat",
                "name" => "es-cold",
        "ephemeral_id" => "d135a581-fa8d-4749-af81-31bb1b73a6a5",
             "version" => "8.8.2"
    },
           "ecs" => {
        "version" => "8.0.0"
    },
           "log" => {
        "offset" => 3378725,
          "file" => {
            "path" => "/var/log/log_demo/info.log"
        }
    },
       "message" => "{\"text\": \"2023-07-20 21:32:04.186 | INFO     | __main__:debug_log:49 - {'access_status': 200, 'request_method': 'GET', 'request_uri': '/management/', 'request_length': 36, 'remote_address': '126.99.204.228', 'server_name': 'cm-4.cn', 'time_start': '2023-07-20T21:32:03.750+08:00', 'time_finish': '2023-07-20T21:32:04.699+08:00', 'http_user_agent': 'Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.1; Trident/6.0; Touch; MASMJS)'}\\n\", \"record\": {\"elapsed\": {\"repr\": \"0:21:32.919851\", \"seconds\": 1292.919851}, \"exception\": null, \"extra\": {}, \"file\": {\"name\": \"main.py\", \"path\": \"/opt/logDemo/main.py\"}, \"function\": \"debug_log\", \"level\": {\"icon\": \"ℹ️\", \"name\": \"INFO\", \"no\": 20}, \"line\": 49, \"message\": \"{'access_status': 200, 'request_method': 'GET', 'request_uri': '/management/', 'request_length': 36, 'remote_address': '126.99.204.228', 'server_name': 'cm-4.cn', 'time_start': '2023-07-20T21:32:03.750+08:00', 'time_finish': '2023-07-20T21:32:04.699+08:00', 'http_user_agent': 'Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.1; Trident/6.0; Touch; MASMJS)'}\", \"module\": \"main\", \"name\": \"__main__\", \"process\": {\"id\": 1, \"name\": \"MainProcess\"}, \"thread\": {\"id\": 139940187904896, \"name\": \"MainThread\"}, \"time\": {\"repr\": \"2023-07-20 21:32:04.186187+08:00\", \"timestamp\": 1689859924.186187}}}",
    "@timestamp" => 2023-07-20T13:32:04.205Z,
      "@version" => "1"
}
```

# 查看kafka的topic信息
![](assets/01-ELK-Stack/54c600ff0be9b7a3eae3.png)


