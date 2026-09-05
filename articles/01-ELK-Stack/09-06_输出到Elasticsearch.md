# 输出到Elasticsearch

> 分类：ELK Stack / 第9章：Filebeat
> 原文：https://www.cuiliangblog.cn/detail/section/31224301
> 来源：崔亮的博客

---

# 默认标准输出
1. 配置读取文件项test.yml

```yaml
filebeat.inputs:
- type: log
  enabled: true
  paths:
  - /var/log/info.log
output.elasticsearch:  
  hosts:  ["https://127.0.0.1:9200"]
  username: "elastic" 
  password: "CHANGE_ME"
  ssl:
    certificate_authorities: ["/root/ca.crt"]
    # verification_mode: "none" # 或者使用none跳过证书验证
```

2. 启动filebeat

`filebeat -e -c test.yml `

3. 查看索引

![](assets/01-ELK-Stack/1f869f940f5b806ce18c.png)

# 自定义索引配置输出
1. 配置读取文件项test.yml

```yaml
filebeat.inputs:
- type: log 
  enabled: true
  paths:
    - /var/log/messages*
setup.ilm.enabled:  false #新版本的Filebeat则默认的配置开启了ILM，导致索引的命名规则被ILM策略控制
setup.template.name:  "myapp"
setup.template.pattern:  "myapp"
setup.template.overwrite:  false
setup.template.settings:
  index.number_of_shards: 2 # 索引分片数(可选参数)
  index.number_of_replicas: 2 # 索引副本数(可选参数)
output.elasticsearch:
  hosts:  ["https://127.0.0.1:9200"]
  username: "elastic" 
  password: "CHANGE_ME"
  ssl.certificate_authorities: ["/Users/cuiliang/docker/filebeat/certs/http_ca.crt"]
  index: "myapp"
```

2. 启动filebeat

`filebeat  -e -c test.yml `

3. 查看索引

![](assets/01-ELK-Stack/68f7a374d224b90e9006.png)

# API KEY方式验证
1. 创建api key

```json
# 请求
POST /_security/api_key
{
  "name": "filebeat"
}
# 响应
{
  "id": "xWgSOooBtFUihNJltt2T",
  "name": "filebeat",
  "api_key": "TGw4sf5IRXaTUXG6TF0HBQ",
  "encoded": "eFdnU09vb0J0RlVpaE5KbHR0MlQ6VEd3NHNmNUlSWGFUVVhHNlRGMEhCUQ=="
}
```

2. 修改filebeat配置

```bash
filebeat.inputs:
- type: log 
  enabled: true
  paths:
  - /opt/docker/log_demo/log/info.log
setup.template.name:  "myapp"
setup.template.pattern:  "myapp"
setup.template.overwrite:  false
output.elasticsearch:
  hosts:  ["https://elasticsearch.local.com:443"]
  api_key: "xWgSOooBtFUihNJltt2T:TGw4sf5IRXaTUXG6TF0HBQ"
  ssl.verification_mode: "none"
  index: "myapp"
```

3. kibana查看数据

![](assets/01-ELK-Stack/2b7abf9a6911ad6ddc0b.png)


