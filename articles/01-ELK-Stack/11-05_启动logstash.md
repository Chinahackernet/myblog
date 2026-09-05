# 启动logstash

> 分类：ELK Stack / 第11章：Logstash
> 原文：https://www.cuiliangblog.cn/detail/section/133530579
> 来源：崔亮的博客

---

# 传参启动
```python
# logstash  -e 'input { stdin { } } output { stdout {} }'
[INFO ] 2022-09-27 16:57:40.821 [Agent thread] agent - Pipelines running {:count=>1, :running_pipelines=>[:main], :non_running_pipelines=>[]}
hello
{
       "message" => "hello",
    "@timestamp" => 2022-09-27T08:57:49.111Z,
          "host" => "tiaoban",
      "@version" => "1"
}
```

# 指定pipeline启动
```python
# 编辑logstash配置文件
# cat logstash.conf 
input {
    stdin { } 
}
output {
    stdout {
        codec => rubydebug { } 
    }   
}
# 指定配置文件方式启动logstash
# logstash -f /etc/logstash/conf.d/logstash.conf
[INFO ] 2022-09-27 16:59:37.627 [Agent thread] agent - Pipelines running {:count=>1, :running_pipelines=>[:main], :non_running_pipelines=>[]}
{
       "message" => "1",
      "@version" => "1",
    "@timestamp" => 2022-09-27T08:59:37.625Z,
          "host" => "tiaoban"
}
```

# 长期后台运行
以rpm包安装的logstash为例，只需要修改pipeline，然后启动logstash即可。

```bash
# vim /etc/logstash/conf.d/logstash.conf 
input {
    stdin { } 
}
output {
    stdout {
        codec => rubydebug { } 
    }   
}
# systemctl start logstash
# systemctl enable logstash
```

# 运行多个pipeline
以rpm包安装的logstash为例，只需要在/etc/logstash/conf.d目录下存放多个.conf的pipeline即可。

```bash
[root@es-warm1 conf.d]# pwd
/etc/logstash/conf.d
[root@es-warm1 conf.d]# ls
demo1.conf  demo2.conf
[root@es-warm1 conf.d]# cat /etc/logstash/pipelines.yml 
# This file is where you define your pipelines. You can define multiple.
# For more information on multiple pipelines, see the documentation:
#   https://www.elastic.co/guide/en/logstash/current/multiple-pipelines.html
- pipeline.id: "main"
  path.config: "/etc/logstash/conf.d/*.conf"
```

如果是二进制安装，也是类型的操作，新建conf.d目录，将pipeline放到该目录，然后编辑pipelines.yml指定该目录。启动命令修改为

```bash
/opt/logstash/bin/logstash "--path.settings" "/opt/logstash/config"
```

# **常见问题**
## **jvm默认值过大**
**报错内容：Server VM warning: Option UseConcMarkSweepGC**

```python
OpenJDK 64-Bit Server VM warning: Option UseConcMarkSweepGC was deprecated in version 9.0 and will likely be removed in a future release.
```

**解决方案：调小jvm内存**

```python
# vim /etc/logstash/jvm.options
-Xms256m
-Xmx256m
```


