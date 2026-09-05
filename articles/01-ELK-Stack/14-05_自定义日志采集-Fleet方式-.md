# 自定义日志采集(Fleet方式)

> 分类：ELK Stack / 第14章：ELK8生产实践
> 原文：https://www.cuiliangblog.cn/detail/section/162609572
> 来源：崔亮的博客

---

> 虽然Fleet为我们内置了大多数常见服务日志的接入配置，但是实际生产中往往会有自定义格式日志的接入需求，此时可以通过Custom Logs代理策略实现日志采集，数据经过ingest/logstash处理后，写入ES中。
>

# 日志demo程序部署
## 项目地址
代码仓库地址：[https://gitee.com/cuiliang0302/log_demo](https://gitee.com/cuiliang0302/log_demo)

## 日志格式
模拟常见的后端服务日志，格式如下。

```bash
2023-07-23 09:35:18.987 | INFO     | __main__:debug_log:49 - {'access_status': 200, 'request_method': 'GET', 'request_uri': '/account/', 'request_length': 67, 'remote_address': '186.196.110.240', 'server_name': 'cu-36.cn', 'time_start': '2023-07-23T09:35:18.879+08:00', 'time_finish': '2023-07-23T09:35:19.638+08:00', 'http_user_agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.2999.0 Safari/537.36'}
2023-07-23 09:35:19.728 | WARNING  | __main__:debug_log:47 - {'access_status': 403, 'request_method': 'PUT', 'request_uri': '/public/', 'request_length': 72, 'remote_address': '158.113.125.213', 'server_name': 'cu-35.cn', 'time_start': '2023-07-23T09:35:18.948+08:00', 'time_finish': '2023-07-23T09:35:20.343+08:00', 'http_user_agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.2999.0 Safari/537.36'}
2023-07-23 09:35:19.793 | INFO     | __main__:debug_log:49 - {'access_status': 200, 'request_method': 'GET', 'request_uri': '/public/', 'request_length': 46, 'remote_address': '153.83.121.71', 'server_name': 'cm-17.cn', 'time_start': '2023-07-23T09:35:19.318+08:00', 'time_finish': '2023-07-23T09:35:20.563+08:00', 'http_user_agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.9; rv:57.0) Gecko/20100101 Firefox/57.0'}
2023-07-23 09:35:20.614 | ERROR    | __main__:debug_log:45 - {'access_status': 502, 'request_method': 'GET', 'request_uri': '/public/', 'request_length': 62, 'remote_address': '130.190.246.56', 'server_name': 'cu-34.cn', 'time_start': '2023-07-23T09:35:20.061+08:00', 'time_finish': '2023-07-23T09:35:21.541+08:00', 'http_user_agent': 'Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 5.1; Trident/4.0; Hot Lingo 2.0)'}
```

## 部署
为方便部署，此处直接拉取代码后docker打包运行。

```bash
[root@es-fleet1 ~]# cd /opt/
[root@es-fleet1 opt]# git clone https://gitee.com/cuiliang0302/log_demo.git
[root@es-fleet1 opt]# cd log_demo/
[root@es-fleet1 log_demo]# ls
Dockerfile  log.py  main.py  readme.md  requirements.txt
[root@es-fleet1 log_demo]# docker build -t log_demo:1.0 .
[root@es-fleet1 log_demo]# docker run --name log_demo -d -v /var/log/log_demo:/opt/logDemo/log --restart always log_demo:1.0 
[root@es-fleet1 log]# cd /var/log/log_demo/
[root@es-fleet1 log_demo]# ll
total 44
-rw-r--r-- 1 root root  4320 Jul 19 22:33 error.log
-rw-r--r-- 1 root root 22729 Jul 19 22:33 info.log
-rw-r--r-- 1 root root  8612 Jul 19 22:33 warning.log
```

# 配置集成策略
## 添加集成策略
在Kibana集成菜单中，我们找到Custom Logs集成策略。

![](assets/01-ELK-Stack/8d11a024bfa323e69579.png)

然后点击右上角的添加集成配置。

![](assets/01-ELK-Stack/37c0c6a545c91d928823.png)

填写集成名称，并指定日志路径为/var/log/log_demo/info.log，代理策略选择现有的Fleet Server Policy。

![](assets/01-ELK-Stack/c56d4fd0da2f338d0216.png)

## 结果验证
添加完成后，在索引管理中可以看到数据流信息。

![](assets/01-ELK-Stack/999f20fab3291ec88504.png)

查看message字段信息，已采集到相关内容。

![](assets/01-ELK-Stack/3ffc739dea2acb0fb1e5.png)

# 使用ingest处理
经过上述操作，虽然实现了自定义日志采集并保存到es中，但是我们还需要从message字段中进一步提取关键内容，并清理无用的其他字段，此时我们可以使用ingest进行处理。关于ingest的详细内容请参考文章：[03-09_%E6%95%B0%E6%8D%AE%E5%A4%84%E7%90%86%EF%BC%88Ingest_Pipeline%EF%BC%89.md](articles/01-ELK-Stack/03-09_数据处理（Ingest_Pipeline）.md)

## 获取样例数据
我们先从discover中，找出一条样例数据，然后复制索引名称和id。

![](assets/01-ELK-Stack/cf12330450a13faed977.png)

## 修改集成
接下来在集成菜单中找到已经安装的集成Custom Logs。

![](assets/01-ELK-Stack/3b658ddff413ccd063f6.png)

接下来编辑集成配置。

![](assets/01-ELK-Stack/a02bbf0cfe10c8179402.png)

在高级设置中，添加自定义处理管道。

![](assets/01-ELK-Stack/41f926d885073cbbdd89.png)

## 添加ingest
ingest处理流程如下：

1. 使用grok正则捕获到log_timestamp和level以及日志内容content字段。
2. 由于content字段内容不是标准json字符，使用mutate插件将单引号替换为双引号。
3. 使用json插件，将替换好的content字符串转码为json对象。
4. 使用rename插件，将原本在content中的子字段替换为根级字段。
5. 使用geoip插件，根据remote_address字段的ip解析查询地理位置信息。
6. 最后使用remove插件，移除其他无关字段。

需要注意的是在filter中用到了geoip地址查询插件，Elasticsearch会自动从 Elastic GeoIP 下载IP地理数据库文件，默认情况下，Elasticsearch 每三天检查一次数据库文件是否有更新，但有些情况下可能会导致下载失败，此时就需要提前下载GeoLite2-City.mmdb文件，并放于指定路径下才能使用。

禁用数据库自动更新

```bash
PUT /_cluster/settings
{
  "persistent" : {
    "ingest.geoip.downloader.enabled" : false
  }
}
```

拷贝文件

```bash
# 创建目录
[root@es-master ~]# mkdir /etc/elasticsearch/config/ingest-geoip

# 拷贝文件
[root@es-master ~]# GeoLite2-City.mmdb /etc/elasticsearch/config/ingest-geoip

# 更改权限
[root@es-master ~]# chown -R elasticsearch:root /etc/elasticsearch/config/ingest-geoip
```

GeoLite2-City.mmdb文件已上传至demo程序仓库。

以添加grok处理器为例，grok配置如下：

![](assets/01-ELK-Stack/72a32f970b44467de5dc.png)

新增其他处理器

![](assets/01-ELK-Stack/b030a577d9825c2f6591.png)

ingest配置较多，也可使用直接导入处理器，内容如下：

```json
PUT _ingest/pipeline/logs-myapp@custom
{
  "processors": [
    {
      "grok": {
        "field": "message",
        "patterns": [
          "%{TIMESTAMP_ISO8601:log_timestamp} \\| %{LOGLEVEL:level} %{SPACE}* \\| (?<class>[__main__:[\\w]*:\\d*]+) \\- %{GREEDYDATA:content}"
        ]
      }
    },
    {
      "gsub": {
        "field": "content",
        "pattern": "'",
        "replacement": "\""
      }
    },
    {
      "json": {
        "field": "content"
      }
    },
    {
      "rename": {
        "field": "content.server_name",
        "target_field": "server_name"
      }
    },
    {
      "rename": {
        "field": "content.request_length",
        "target_field": "request_length"
      }
    },
    {
      "rename": {
        "field": "content.time_start",
        "target_field": "time_start"
      }
    },
    {
      "rename": {
        "field": "content.time_finish",
        "target_field": "time_finish"
      }
    },
    {
      "rename": {
        "field": "content.access_status",
        "target_field": "access_status"
      }
    },
    {
      "rename": {
        "field": "content.request_method",
        "target_field": "request_method"
      }
    },
    {
      "rename": {
        "field": "content.remote_address",
        "target_field": "remote_address"
      }
    },
    {
      "rename": {
        "field": "content.request_uri",
        "target_field": "request_uri"
      }
    },
    {
      "rename": {
        "field": "content.http_user_agent",
        "target_field": "http_user_agent"
      }
    },
    {
      "geoip": {
        "field": "remote_address"
      }
    },
    {
      "remove": {
        "field": [
          "agent",
          "log",
          "elastic_agent",
          "content",
          "input",
          "ecs",
          "data_stream",
          "host",
          "event"
        ]
      }
    }
  ]
}
```

## 调试ingest
编辑好管道处理器后，接下来我们添加测试数据，填写索引和id。

![](assets/01-ELK-Stack/b7366379a6d56a0ce975.png)

然后点击运行管道，查看输出结果，符合预期。

![](assets/01-ELK-Stack/95bd2aaf7b2fea9d8b3d.png)

调试无误后，保存ingest和集成。

## 结果验证
我们先删除数据流，有新的数据写入时，es会自动创建新的数据流。

![](assets/01-ELK-Stack/1a4eee331b769565073a.png)

然后查看写入的数据，发现已经是管道处理过的内容，格式符合预期。

![](assets/01-ELK-Stack/f6fb5ca93fa4d61ae50f.png)

# 使用Logstash处理
fleet采集到的日志除了交由ingest处理外，当数据量较大时，也可以在es集群外部署一个单独的logstash服务用于数据清洗过滤操作。需要注意的是fleet输出到logstash需要购买授权，免费版不支持输出到logstash。

## kibana配置加密密钥
Kibana 提供了一个命令行工具来生成加密字符串，该命令行工具在 bin 目录下，使用方式如下：

```bash
[root@es-master ~]# cd /usr/share/kibana/bin/
[root@es-master bin]# ./kibana-encryption-keys generate
## Kibana Encryption Key Generation Utility

The 'generate' command guides you through the process of setting encryption keys for:

xpack.encryptedSavedObjects.encryptionKey
    Used to encrypt stored objects such as dashboards and visualizations
    https://www.elastic.co/guide/en/kibana/current/xpack-security-secure-saved-objects.html#xpack-security-secure-saved-objects

xpack.reporting.encryptionKey
    Used to encrypt saved reports
    https://www.elastic.co/guide/en/kibana/current/reporting-settings-kb.html#general-reporting-settings

xpack.security.encryptionKey
    Used to encrypt session information
    https://www.elastic.co/guide/en/kibana/current/security-settings-kb.html#security-session-and-cookie-settings


Already defined settings are ignored and can be regenerated using the --force flag.  Check the documentation links for instructions on how to rotate encryption keys.
Definitions should be set in the kibana.yml used configure Kibana.

Settings:
xpack.encryptedSavedObjects.encryptionKey: 8b178d71a06bc40bdc4777eacefb4054
xpack.reporting.encryptionKey: 1dd5c0cccdab7d7369da8976b3e284d1
xpack.security.encryptionKey: a58cf5efa4ad7216cc7b508025df7841
```

修改kibana配置文件

```bash
[root@es-master ~]# vim /etc/kibana/kibana.yml
xpack.encryptedSavedObjects.encryptionKey: 8b178d71a06bc40bdc4777eacefb4054
xpack.reporting.encryptionKey: 1dd5c0cccdab7d7369da8976b3e284d1
xpack.security.encryptionKey: a58cf5efa4ad7216cc7b508025df7841
```

重启kibana

```plain
[root@es-master ~]# systemctl restart kibana
```

## 生成配置示例
![](assets/01-ELK-Stack/5be87a97104e1f57ed2a.png)

## logstash部署配置
> 以下操作在es-warm1执行
>

安装logstash

```bash
[root@es-warm1 ~]# wget https://artifacts.elastic.co/downloads/logstash/logstash-8.8.2-x86_64.rpm
[root@es-warm1 ~]# rpm -ivh logstash-8.8.2-x86_64.rpm
[root@es-warm1 ~]# systemctl enable logstash
Created symlink /etc/systemd/system/multi-user.target.wants/logstash.service → /usr/lib/systemd/system/logstash.service.
```

添加环境变量

```bash
[root@es-warm1 ~]# vim /etc/profile
export PATH=$PATH:/usr/share/logstash/bin
[root@es-warm1 ~]# source /etc/profile
[root@es-warm1 ~]# logstash -V
Using bundled JDK: /usr/share/logstash/jdk
logstash 8.8.2
```

拷贝ES ca证书

Logstash连接es时需要指定ca证书，从master节点拷贝证书至Logstash机器上。

```bash
[root@es-warm1 ~]# scp es-master:/etc/elasticsearch/certs/http_ca.crt /etc/logstash/http_ca.crt
[root@es-warm1 ~]# chown logstash:logstash /etc/logstash/http_ca.crt
```

生成SSL证书

```bash
[root@es-warm1 ~]# cd /usr/share/elasticsearch/
# 生成ca证书
[root@es-warm1 elasticsearch]# ./bin/elasticsearch-certutil ca --pem
Please enter the desired output file [elastic-stack-ca.zip]: ca.zip
[root@es-warm1 elasticsearch]# unzip ca.zip 
Archive:  ca.zip
   creating: ca/
  inflating: ca/ca.crt               
  inflating: ca/ca.key             
# 生成客户端证书
[root@es-warm1 elasticsearch]# ./bin/elasticsearch-certutil cert --name client --ca-cert ca/ca.crt --ca-key ca/ca.key --pem
Please enter the desired output file [certificate-bundle.zip]: client.zip
[root@es-warm1 elasticsearch]# unzip certificate-bundle.zip 
[root@es-warm2 elasticsearch]# unzip client.zip 
Archive:  client.zip
   creating: client/
  inflating: client/client.crt       
  inflating: client/client.key
# 生成logstash证书
[root@es-warm1 elasticsearch]# ./bin/elasticsearch-certutil cert --name logstash --ca-cert ca/ca.crt --ca-key ca/ca.key --dns es-warm1 --ip 192.168.10.136 --pem
Please enter the desired output file [certificate-bundle.zip]:logstash.zip 
[root@es-warm1 elasticsearch]# unzip logstash.zip 
Archive:  logstash.zip
   creating: logstash/
  inflating: logstash/logstash.crt   
  inflating: logstash/logstash.key 
# 将logstash证书转换为pkcs8
[root@es-warm1 elasticsearch]# openssl pkcs8 -inform PEM -in logstash/logstash.key -topk8 -nocrypt -outform PEM -out logstash/logstash.pkcs8.key
# 修改证书权限
[root@es-warm1 client]# chown -R logstash:logstash /usr/share/elasticsearch/ca
[root@es-warm1 client]# chown -R logstash:logstash /usr/share/elasticsearch/client
[root@es-warm1 client]# chown -R logstash:logstash /usr/share/elasticsearch/logstash
```

修改logstash配置文件

```bash
[root@es-warm1 ~]# vim /etc/logstash/conf.d/elastic-agent-pipeline.conf
input {
  elastic_agent {
    port => 5044
    ssl => true
    ssl_certificate_authorities => ["/usr/share/elasticsearch/ca/ca.crt"]
    ssl_certificate => "/usr/share/elasticsearch/client/client.crt"
    ssl_key => "/usr/share/elasticsearch/client/client.key"
    ssl_verify_mode => "force_peer"
  }
}
output {
  elasticsearch {
    hosts => "https://es-master:9200"
    api_key => "F2UBp4kBHLf-pL7J2k3h:4NoPw58EROaK_jKA5CB_LA"
    data_stream => true
    ssl => true
    cacert => "/etc/logstash/http_ca.crt"
  }
}
```

启动logstash

```bash
# 指定配置文件启动，查看日志是否有报错
[root@es-warm1 ~]# logstash -f /etc/logstash/conf.d/elastic-agent-pipeline.conf 
# 确认无报错后，启动logstash
[root@es-warm1 ~]# systemctl enable logstash
[root@es-warm1 ~]# systemctl start logstash
```

修改fleet输出配置，填写logstash相关配置信息。

![](assets/01-ELK-Stack/1afa1cd08e11bf106ad6.png)

接下来修改fleet输出策略，选择logstash服务即可。由于未购买授权，后续操作演示如果有条件继续补充。

![](assets/01-ELK-Stack/7a45732cca703b811de8.png)

# 参考文档
Fleet Server介绍：[https://www.elastic.co/guide/en/fleet/8.8/fleet-server.html](https://www.elastic.co/guide/en/fleet/8.8/fleet-server.html)

es 管道：[https://www.elastic.co/guide/en/elasticsearch/reference/current/ingest.html](https://www.elastic.co/guide/en/elasticsearch/reference/current/ingest.html)

es groke处理器：[https://www.elastic.co/guide/en/elasticsearch/reference/8.8/grok-processor.html](https://www.elastic.co/guide/en/elasticsearch/reference/8.8/grok-processor.html)

es gusb处理器：[https://www.elastic.co/guide/en/elasticsearch/reference/8.8/gsub-processor.html](https://www.elastic.co/guide/en/elasticsearch/reference/8.8/gsub-processor.html)

es json处理器：[https://www.elastic.co/guide/en/elasticsearch/reference/8.8/json-processor.html](https://www.elastic.co/guide/en/elasticsearch/reference/8.8/json-processor.html)

es rename处理器：[https://www.elastic.co/guide/en/elasticsearch/reference/8.8/rename-processor.html](https://www.elastic.co/guide/en/elasticsearch/reference/8.8/rename-processor.html)

es remove处理器：[https://www.elastic.co/guide/en/elasticsearch/reference/8.8/remove-processor.html](https://www.elastic.co/guide/en/elasticsearch/reference/8.8/remove-processor.html)

fleet输出到logstash：[https://www.elastic.co/guide/en/fleet/8.8/secure-logstash-connections.html](https://www.elastic.co/guide/en/fleet/8.8/secure-logstash-connections.html)


