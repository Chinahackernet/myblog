# 输入插件-事件日志(Syslog)

> 分类：ELK Stack / 第11章：Logstash
> 原文：https://www.cuiliangblog.cn/detail/section/133697327
> 来源：崔亮的博客

---

# 使用场景
<font style="color:rgb(51, 51, 51);">syslog 可能是运维领域最流行的数据传输协议了。当你想从设备上收集系统日志的时候，syslog 应该会是你的第一选择。尤其是网络设备，syslog 几乎是唯一可行的办法。</font>

# 配置示例
```bash
input {
  syslog {
    port => "514"
  }
}
output {
    stdout {
        codec => rubydebug { } 
    }   
}
```

# 使用演示
<font style="color:rgb(51, 51, 51);">我们先暂停一下本机的 </font><font style="color:rgb(51, 51, 51);background-color:rgb(247, 247, 247);">syslogd</font><font style="color:rgb(51, 51, 51);"> (或 </font><font style="color:rgb(51, 51, 51);background-color:rgb(247, 247, 247);">rsyslogd</font><font style="color:rgb(51, 51, 51);"> )进程，然后启动 logstash 进程（这样就不会有端口冲突问题）。现在，本机的 syslog 就会默认发送到 logstash 里了。我们可以用自带的 </font><font style="color:rgb(51, 51, 51);background-color:rgb(247, 247, 247);">logger</font><font style="color:rgb(51, 51, 51);"> 命令行工具发送一条 "Hello World"信息到 syslog 里（即 logstash 里）。看到的 logstash 输出像下面这样：</font>

```bash
{
           "message" => "Hello World",
          "@version" => "1",
        "@timestamp" => "2023-07-08T09:01:15.911Z",
              "host" => "127.0.0.1",
          "priority" => 31,
         "timestamp" => "Aug  8 17:01:15",
         "logsource" => "cuiliangdeMacBook-Air.local",
           "program" => "com.apple.metadata.mdflagwriter",
               "pid" => "381",
          "severity" => 7,
          "facility" => 3,
    "facility_label" => "system",
    "severity_label" => "Debug"
}
```


