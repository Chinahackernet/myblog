# 输入插件-Redis

> 分类：ELK Stack / 第11章：Logstash
> 原文：https://www.cuiliangblog.cn/detail/section/133698206
> 来源：崔亮的博客

---

# <font style="color:rgb(51, 51, 51);">配置示例</font>
```bash
input {
    reids {
        host=> "192.168.10.12"#redis地址
        port => "6379" #redis端口号
        password => "CHANGE_ME" #如果有安全认证，此项为密码
        key => "logstash-*"
        type => "redis-input"
        data_type => "list"
        threads =>8 #启用线程数量
        batch_count => 10 #EVAL命令返回的事件数目
        db => 0 #redis数据库的编号
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

# 使用示例
logstash中的redis插件，指定了三种方式来读取redis队列中的信息。

+ list=>BLPOP
+ channel=>SUBSCRIBE
+ pattern_channel=>PSUBSCRIBE

其中list，相当于队列；channel相当于发布订阅的某个特定的频道；pattern_channel相当于发布订阅某组频道。channel与pattern_channel区别就在于一个是监听特定的键值，一个是监听某一组键值。

### <font style="color:rgb(51, 51, 51);">基本方法</font>


```plain
# redis-cli
127.0.0.1:6379> PUBLISH logstash-demochan "hello world"
```

<font style="color:rgb(51, 51, 51);">logstash 进程输出类似下面这样的内容：</font>

```ruby
{
       "message" => "hello world",
      "@version" => "1",
    "@timestamp" => "2014-08-08T16:26:29.399Z"
}
```

### <font style="color:rgb(51, 51, 51);">输入 JSON 数据</font>
<font style="color:rgb(51, 51, 51);">如果你想通过 redis 的频道给 logstash 事件添加更多字段，直接向频道发布 JSON 字符串就可以了。</font><font style="color:rgb(51, 51, 51);"> </font><font style="color:rgb(51, 51, 51);background-color:rgb(247, 247, 247);">LogStash::Inputs::Redis</font><font style="color:rgb(51, 51, 51);"> </font><font style="color:rgb(51, 51, 51);">会直接把 JSON 转换成事件。</font>

<font style="color:rgb(51, 51, 51);">在终端的交互式提示符下输入如下内容：</font>

```plain
127.0.0.1:6379> PUBLISH logstash-chan '{"message":"hello world","@version":"1","@timestamp":"2014-08-08T16:34:21.865Z","host":"raochenlindeMacBook-Air.local","key1":"value1"}'
```

<font style="color:rgb(51, 51, 51);">终端里的 logstash 进程随即也返回新的内容，如下所示：</font>

```ruby
{
       "message" => "hello world",
      "@version" => "1",
    "@timestamp" => "2014-08-09T00:34:21.865+08:00",
          "host" => "raochenlindeMacBook-Air.local",
          "key1" => "value1"
}
```

  



