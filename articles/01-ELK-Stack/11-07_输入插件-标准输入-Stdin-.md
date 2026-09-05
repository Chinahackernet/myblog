# 输入插件-标准输入(Stdin)

> 分类：ELK Stack / 第11章：Logstash
> 原文：https://www.cuiliangblog.cn/detail/section/31174860
> 来源：崔亮的博客

---

# 配置示例
```bash
input {
    stdin {
        add_field => {"key" => "value"}
        codec => "plain"
        tags => ["add"]
        type => "std"
    }
}
output {
    stdout {
        codec => rubydebug { } 
    }   
}
```

# 运行结果
logstash启动后，控制台输入hello world，输出如下内容：

```bash
hello world
{
       "message" => "hello world",
          "type" => "std",
          "tags" => [
        [0] "add"
    ],
          "host" => "tiaoban",
    "@timestamp" => 2022-09-27T09:15:28.696Z,
      "@version" => "1",
           "key" => "value"
}
```

# 分析
type 和 tags 是 logstash 事件中两个特殊的字段。通常来说我们会在输入区段中通过 type 来标记事件类型，而 tags 则是在数据处理过程中，由具体的插件来添加或者删除的。

使用举例

```bash
input {
    stdin {
        type => "web"
    }
}
filter {
    if [type] == "web" {
        grok {
            match => ["message", %{COMBINEDAPACHELOG}]
        }
    }
}
output {
    if "_grokparsefailure" in [tags] {
        nagios_nsca {
            nagios_status => "1"
        }
    } else {
        elasticsearch {
        }
    }
}
```




