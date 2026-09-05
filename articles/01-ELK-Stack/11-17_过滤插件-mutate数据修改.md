# 过滤插件-mutate数据修改

> 分类：ELK Stack / 第11章：Logstash
> 原文：https://www.cuiliangblog.cn/detail/section/133763511
> 来源：崔亮的博客

---

mutate插件是logstash另一个非常重要的插件，它提供了丰富的基础类型数据处理能力，包括重命名、删除、替换、修改日志事件中的字段。我们这里举几个常用的mutate插件：字段类型转换功能covert、正则表达式替换字段功能gsub、分隔符分隔字符串为数值功能split、重命名字段功能rename、删除字段功能remove_field

# 字段类型转换convert
```bash
filter{
        grok{
                match => {"message" => "%{IPV4:ip}"}
                remove_field => ["message"]
        }
        mutate{
                convert => ["ip","string"]
        }
}
或者这样子写也行，写法区别较小：
filter{
        grok{
                match => {"message" => "%{IPV4:ip}"}
                remove_field => ["message"]
        }
        mutate{
                convert => {
                        "ip" => "string"
                }
        }
}
```

现在我们启动服务查看一下效果

```bash
[root@:172.31.22.29/etc/logstash/conf.d]#/usr/share/logstash/bin/logstash -f /etc/logstash/conf.d/l6.conf
Sending Logstash logs to /var/log/logstash which is now configured via log4j2.properties172.16.213.132 - - [07/Feb/2018:16:24:9 +0800] "GET /HTTP/1.1" 403 5039
{
    "@timestamp" => 2019-01-23T04:13:55.261Z,
            "ip" => "172.16.213.132",
          "host" => "ip-172-31-22-29.ec2.internal",
      "@version" => "1"
}
```

在这里的ip行中，效果可能不太明显，但是确实是已经转化成string模式了。

# 正则表达式替换匹配字段
gsub可以通过正则表达式替换字段中匹配到的值，但是这本身只对字符串字段有效。

```bash
filter{
        grok{
                match => {"message" => "%{QS:referrer}"}
                remove_field => ["message"]
        }
        mutate{
                gsub => ["referrer","/","-"]
        }
}
```

<font style="background-color:transparent;">启动一下看看效果：</font>

```bash
172.16.213.132 - - [07/Feb/2018:16:24:9 +0800] "GET /HTTP/1.1" 403 5039
{
          "host" => "ip-172-31-22-29.ec2.internal",
    "@timestamp" => 2019-01-23T05:51:30.786Z,
      "@version" => "1",
      "referrer" => "\"GET -HTTP-1.1\""
}
```

# 字符替换
## 分隔符分隔字符串为数组
split可以通过指定的分隔符分隔字段中的字符串为数组。

```json
filter{
        mutate{
                split => ["message","-"]
                add_field => ["A is lower case :","%{[message][0]}"]
        }
}
```

这里的意思是对一个字段按照“-”进行分隔为数组

```bash
a-b-c-d-e-f-g　　　　　　　　　　　　#手动输入此行内容，并按下enter键。
{
    "A is lower case :" => "a",
              "message" => [
        [0] "a",
        [1] "b",
        [2] "c",
        [3] "d",
        [4] "e",
        [5] "f",
        [6] "g"
    ],
                 "host" => "ip-172-31-22-29.ec2.internal",
             "@version" => "1",
           "@timestamp" => 2019-01-23T06:07:18.062Z
}
```

## <font style="color:rgb(79, 79, 79);">双引号替换成单引号</font>
```plain
input {
        stdin{}
      }
filter {
        mutate {
          gsub => [
            "message", '"' , "'"
          ]
        }
}

output {
        stdout{}
}
```

![](assets/01-ELK-Stack/150bfc043d08f6962977.png)

## 大小写转换
```json
filter {
    mutate {
        uppercase => [ "fieldname" ]
    }
}
```

# 重命名字段
rename可以实现重命名某个字段的功能。

```json
filter{
        grok{
                match => {"message" => "%{IPV4:ip}"}
                remove_field => ["message"]
        }
        mutate{
                convert => {
                        "ip" => "string"
                }
                rename => {
                       "ip"=>"IP"
                }
        }
}
```

<font style="background-color:transparent;">rename字段使用大括号{}括起来，其实我们也可以使用中括号达到同样的目的</font>

```json
mutate{
                convert => {
                        "ip" => "string"
                }
                rename => ["ip","IP"]
        }
```

<font style="background-color:transparent;">启动后检查一下：</font>

```json
172.16.213.132 - - [07/Feb/2018:16:24:9 +0800] "GET /HTTP/1.1" 403 5039　　　　　　#手动输入此内容
{
      "@version" => "1",
    "@timestamp" => 2019-01-23T06:20:21.423Z,
          "host" => "ip-172-31-22-29.ec2.internal",
            "IP" => "172.16.213.132"
}
```

# 添加字段add_field
添加字段多用于split分隔中，主要是对split分隔后的字段中指定格式输出。

```json
filter {
  mutate {
    split => ["message", "|"]
      add_field => {
        "timestamp" => "%{[message][0]}"
　　　　}
　}
}
```

添加字段后，该字段会与@timestamp一样同等格式显示出来。

# 删除字段remove_field
```yaml
filter {
      mutate {
        remove_field => [ "event" ]
      }
    }
```


