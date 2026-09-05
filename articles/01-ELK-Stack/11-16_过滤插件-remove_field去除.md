# 过滤插件-remove_field去除

> 分类：ELK Stack / 第11章：Logstash
> 原文：https://www.cuiliangblog.cn/detail/section/133784397
> 来源：崔亮的博客

---

## remove_field的用法
> remove_field的用法也是很常见的，他的作用就是去重，在前面的例子中你也看到了，不管是我们要输出什么样子的信息，都是有两份数据，即message里面是一份，HTTPDATE或者IP里面也有一份，这样子就造成了重复，过滤的目的就是筛选出有用的信息，重复的不要，因此我们看看如何去重呢？
>

+ 以输出ip为例

```bash
filter{
        grok{
                match => {"message" => "%{IP:ip_address}"}
                remove_field => ["message"]
        }
        
}
```

+ 启动服务查看一下：

```bash
[root@:172.31.22.29/etc/logstash/conf.d]#/usr/share/logstash/bin/logstash -f /etc/logstash/conf.d/l5.conf
Sending Logstash logs to /var/log/logstash which is now configured via log4j2.properties172.16.213.132 - - [07/Feb/2018:16:24:19 +0800] "GET /HTTP/1.1" 403 5039　　　　　　#手动输入此行内容并按enter键
{
    "ip_address" => "172.16.213.132",
          "host" => "ip-172-31-22-29.ec2.internal",
      "@version" => "1",
    "@timestamp" => 2019-01-22T12:16:58.918Z
}
```

<font style="background-color:transparent;">这时候你会发现没有之前显示的那个message的那一行信息了。因为我们使用remove_field把他移除了，这样的好处显而易见，我们只需要日志中特定的信息而已。</font>

+ **在上面的几个例子中我们是把message一行的信息一个一个分开演示了，现在在一个logstash中全部显示出来。**

```json
filter{
        grok{
            match => {"message" => "%{IP:ip_address}\ -\ -\ \[%{HTTPDATE:timestamp}\]\ %{QS:referrer}\ %{NUMBER:status}\ %{NUMBER:bytes}"}
        }
        date{
            match => ["timestamp","dd/MMM/yyyy:HH:mm:ss Z"]
        }
        
}
```

+ 启动一下，看看情况：

```bash
[root@172.31.22.29/etc/logstash/conf.d]#/usr/share/logstash/bin/logstash -f /etc/logstash/conf.d/l5.conf
Sending Logstash logs to /var/log/logstash which is now configured via log4j2.properties
172.16.213.132 - - [07/Feb/2018:16:24:19 +0800] "GET /HTTP/1.1" 403 5039　　　　　　#手动输入此行内容
 
{
 "status" => "403",
 "bytes" => "5039",
 "message" => "172.16.213.132 - - [07/Feb/2018:16:24:19 +0800] \"GET /HTTP/1.1\" 403 5039",
 "ip_address" => "172.16.213.132",
 "timestamp" => "07/Feb/2018:16:24:19 +0800",
 "@timestamp" => 2018-02-07T08:24:19.000Z,
 "referrer" => "\"GET /HTTP/1.1\"",
 "@version" => "1",
 "host" => "ip-172-31-22-29.ec2.internal"
}
```

<font style="background-color:transparent;">在这个例子中，你能感受到输出内容的臃肿，相当于输出了两份的内容，因此我们很有必要将原始内容message的这一行给去掉。</font>

**使用remove_field去掉message这一行的信息**

```bash
filter{
        grok{
            match => {"message" => "%{IP:ip_address}\ -\ -\ \[%{HTTPDATE:timestamp}\]\ %{QS:referrer}\ %{NUMBER:status}\ %{NUMBER:bytes}"}
        }
        date{
            match => ["timestamp","dd/MMM/yyyy:HH:mm:ss Z"]
        }
        mutate{
            remove_field => ["message","timestamp"]
        }
}
```

启动一下看看：

```bash
[root@:172.31.22.29/etc/logstash/conf.d]#/usr/share/logstash/bin/logstash -f /etc/logstash/conf.d/l5.conf
Sending Logstash logs to /var/log/logstash which is now configured via log4j2.properties
172.16.213.132 - - [07/Feb/2018:16:24:19 +0800] "GET /HTTP/1.1" 403 5039　　　　　#手动输入此行内容尝试一下
{
      "referrer" => "\"GET /HTTP/1.1\"",
         "bytes" => "5039",
          "host" => "ip-172-31-22-29.ec2.internal",
    "@timestamp" => 2018-02-07T08:24:19.000Z,
        "status" => "403",
    "ip_address" => "172.16.213.132",
      "@version" => "1"
}
```


