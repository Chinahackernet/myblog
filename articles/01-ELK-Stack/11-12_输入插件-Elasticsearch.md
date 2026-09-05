# 输入插件-Elasticsearch

> 分类：ELK Stack / 第11章：Logstash
> 原文：https://www.cuiliangblog.cn/detail/section/175117156
> 来源：崔亮的博客

---

# logstash配置
```bash
input{
    elasticsearch{
        hosts =>  ["https://es01:9200"] # 源端ES地址。
        # 安全集群配置登录用户名密码。
        user => "elastic"
        password => "XXXXXX"
        ssl_enabled => true  # 启用SSL
        ssl_certificate_authorities => "/opt/logstash/config/ca.crt"  # 证书
        index => "logs-system.application-default" # 需要迁移的索引列表，多个索引以英文以逗号（,）分隔。
        # 包含线程数和迁移数据大小和Logstash JVM配置相关。
        slices => 5
        size => 5000
        # 获取文档元数据信息
        docinfo=> true
        docinfo_target => "[@metadata][doc]"
        # 按时间范围查询增量数据，以下配置表示查询最近3分钟的数据。
        query => '{"query":{"bool":{"must":[{"range":{"@timestamp":{"gte":"now-5m","lt":"now"}}}],"filter":[{"match":{"host.hostname":"ad-t-vm-dc01"}}]}}}'
        # 定时任务，以下配置表示每分钟执行一次。
        schedule => "*/5 * * * *"
        # 滚动查询活动时间
        scroll => "5m"
    }
}
filter {
  # 去掉一些Logstash自己加的字段。
  mutate {
    remove_field => ["@timestamp", "@version"]
  }
}
output {
    stdout {
        codec => rubydebug { } 
    }   
}
```


