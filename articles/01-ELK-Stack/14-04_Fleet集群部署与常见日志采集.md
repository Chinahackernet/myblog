# Fleet集群部署与常见日志采集

> 分类：ELK Stack / 第14章：ELK8生产实践
> 原文：https://www.cuiliangblog.cn/detail/section/162609600
> 来源：崔亮的博客

---

> 为了更加方便的实现系统和应用程序日志接入ES，官方推出了Elastic Agent应用，Elastic Agent可以实现通过更少的配置和安装来简化数据采集配置，通过Fleet可以轻松的管理整个Elastic Agent队列。Kibana为我们内置了大多数场景下日志的采集与可视化分析配置，我们仅需要在kibanaUI中点击操作便可完成复杂的日志采集。更多fleet相关内容，可参考文档：[13-01_%E7%AE%80%E4%BB%8B.md](articles/01-ELK-Stack/13-01_简介.md)
>

# 安装Fleet Server
Fleet Server可以由多台机器组成Fleet server cluster，用于集中管理 Elastic Agent。 它作为 Elastic Agent 的一部分在用作服务器的主机上启动。 一个 Fleet Server 进程可以支持多个 Elastic Agent 连接，并作为一个控制面来更新代理策略、收集状态信息和协调 Elastic Agent 的操作。fleet server节点建议部署在es集群之外的机器上，生产环境建议2台及以上组成集群，通过负载均衡方式管理与下发agent策略。

## 配置Fleet Server
进入fleet菜单，点击添加fleet服务器。

![](assets/01-ELK-Stack/909260f780a12d50323f.png)

填写要部署fleet服务器的地址，格式为https://fleet服务器ip:8220，本实验填写地址分别为https://192.168.10.130:8220、https://192.168.10.131:8220

![](assets/01-ELK-Stack/b5af0b2de0ff2cbead08.png)

点击继续按钮，生成Fleet Server部署命令

![](assets/01-ELK-Stack/79266f34d43f5879cdae.png)

## 部署Fleet Server
拷贝es证书至fleet1和fleet2节点

```bash
[root@es-fleet1 ~]# mkdir -p /etc/elasticsearch/certs
[root@es-fleet1 ~]# scp es-master:/etc/elasticsearch/certs/http_ca.crt /etc/elasticsearch/certs/
```

根据kibana提示，依次在es-fleet1节点和es-fleet2节点执行命令

```bash
[root@es-fleet1 ~]# curl -L -O https://artifacts.elastic.co/downloads/beats/elastic-agent/elastic-agent-8.8.2-linux-x86_64.tar.gz
[root@es-fleet1 ~]# tar -zxf elastic-agent-8.8.2-linux-x86_64.tar.gz
[root@es-fleet1 ~]# cd elastic-agent-8.8.2-linux-x86_64
[root@es-fleet1 elastic-agent-8.8.2-linux-x86_64]# ./elastic-agent install \
  --fleet-server-es=https://192.168.8.5:9200 \
  --fleet-server-service-token=AAEAAWVsYXN0aWMvZmxlZXQtc2VydmVyL3Rva2VuLTE2ODk1ODQyMDczMjc6Y2F4SXp0djdSdWFob3FiRGFXMngxQQ \
  --fleet-server-policy=fleet-server-policy \
  --fleet-server-es-ca-trusted-fingerprint=7f19df998d554c92ecb505db6dae0954d74f3c47ef56b78b46b65662558b988c \
  --fleet-server-port=8220
Elastic Agent will be installed at /opt/Elastic/Agent and will run as a service. Do you want to continue? [Y/n]:y
{"log.level":"info","@timestamp":"2023-07-17T17:28:06.353+0800","log.origin":{"file.name":"cmd/enroll_cmd.go","file.line":410},"message":"Generating self-signed certificate for Fleet Server","ecs.version":"1.6.0"}
{"log.level":"info","@timestamp":"2023-07-17T17:28:10.468+0800","log.origin":{"file.name":"cmd/enroll_cmd.go","file.line":773},"message":"Waiting for Elastic Agent to start Fleet Server","ecs.version":"1.6.0"}
{"log.level":"info","@timestamp":"2023-07-17T17:28:14.472+0800","log.origin":{"file.name":"cmd/enroll_cmd.go","file.line":787},"message":"Fleet Server - Running on policy with Fleet Server integration: fleet-server-policy; missing config fleet.agent.id (expected during bootstrap process)","ecs.version":"1.6.0"}
{"log.level":"info","@timestamp":"2023-07-17T17:28:14.907+0800","log.origin":{"file.name":"cmd/enroll_cmd.go","file.line":478},"message":"Starting enrollment to URL: https://es-cold:8220/","ecs.version":"1.6.0"}
{"log.level":"info","@timestamp":"2023-07-17T17:28:16.899+0800","log.origin":{"file.name":"cmd/enroll_cmd.go","file.line":276},"message":"Successfully triggered restart on running Elastic Agent.","ecs.version":"1.6.0"}
Successfully enrolled the Elastic Agent.
Elastic Agent has been successfully installed.
# 设置开机自启动
[root@es-fleet1 ~]# systemctl enable elastic-agent
# 安装完成后，Fleet Server服务文件路径在/opt/Elastic/Agent
```

在es-fleet2节点也部署elastic agent服务。

## Fleet Server部署完成
fleet server部署完成后，kibana界面即可显示fleet server相关信息。

![](assets/01-ELK-Stack/8e6da9e3f388d6bf4f7c.png)

# 安装Elastic Agent
<font style="color:rgb(48, 49, 51);">Elastic Agent会根据策略中的配置信息来收集和发送数据到 Elasticsearch，通常情况下同种类型的服务器使用相关的agent策略。</font>

## 生成Agent安装命令
点击右侧添加代理按钮，进入配置页面

![](assets/01-ELK-Stack/8b207ff7eee7afd21d60.png)

然后会为我们生成代理安装命令

![](assets/01-ELK-Stack/b30f1701f96e55873cda.png)

## 安装Elastic Agent
依次在剩余的其他节点上执行生成的代理安装命令。以cold节点为例：

```bash
[root@es-cold ~]# curl -L -O https://artifacts.elastic.co/downloads/beats/elastic-agent/elastic-agent-8.8.2-linux-x86_64.tar.gz
[root@es-cold ~]# tar -zxf elastic-agent-8.8.2-linux-x86_64.tar.gz 
[root@es-cold ~]# cd elastic-agent-8.8.2-linux-x86_64
[root@es-cold elastic-agent-8.8.2-linux-x86_64]# ./elastic-agent install --url=https://192.168.10.130:8220 --url=https://192.168.10.131:8220 --enrollment-token=UGo4MGxZa0JFb2Q4b0ZUOFU4Zzk6cVlvaXc2SlBTb3VpRjhPLWFtMXJ1QQ== --insecure
Elastic Agent will be installed at /opt/Elastic/Agent and will run as a service. Do you want to continue? [Y/n]:y
{"log.level":"warn","@timestamp":"2023-07-21T18:57:06.341+0800","log.logger":"tls","log.origin":{"file.name":"tlscommon/tls_config.go","file.line":104},"message":"SSL/TLS verifications disabled.","ecs.version":"1.6.0"}
{"log.level":"info","@timestamp":"2023-07-21T18:57:06.878+0800","log.origin":{"file.name":"cmd/enroll_cmd.go","file.line":478},"message":"Starting enrollment to URL: https://192.168.10.132:8220/","ecs.version":"1.6.0"}
{"log.level":"warn","@timestamp":"2023-07-21T18:57:07.130+0800","log.logger":"tls","log.origin":{"file.name":"tlscommon/tls_config.go","file.line":104},"message":"SSL/TLS verifications disabled.","ecs.version":"1.6.0"}
{"log.level":"info","@timestamp":"2023-07-21T18:57:08.932+0800","log.origin":{"file.name":"cmd/enroll_cmd.go","file.line":276},"message":"Successfully triggered restart on running Elastic Agent.","ecs.version":"1.6.0"}
Successfully enrolled the Elastic Agent.
Elastic Agent has been successfully installed.
# 设置开机自启动
[root@es-cold ~]# systemctl enable elastic-agent
```

+ 记得添加--insecure参数，否则自签证书会报x509证书错误。
+ 默认情况下生成的--url只有https://192.168.10.130:8220，改为--url https://192.168.10.130:8220 --url https://192.168.10.131:8220，防止fleet1节点故障时无法更新策略。

执行完上述命令后，查看Kibana页面，已经成功添加了一个代理

![](assets/01-ELK-Stack/1a38341da14c96874119.png)

其他节点也依次执行上述步骤，执行完成后，fleet页面信息如下所示

![](assets/01-ELK-Stack/1fd178df26b51619680d.png)

# 配置代理策略
## Linux审计日志
打开kibana集成菜单

![](assets/01-ELK-Stack/0e25b60e1442236def8d.png)

添加Linux登录审计日志

![](assets/01-ELK-Stack/e06565f66931fc704230.png)

配置代理策略

![](assets/01-ELK-Stack/c72e2d054608253e9f4f.png)

点击保存并继续，提示添加完成后，在已安装集成菜单中可以看到已添加Auditd Logs

![](assets/01-ELK-Stack/3841a956f67282c45fa8.png)

## Elasticsearch
在集成菜单中找到Elasticsearch并添加

![](assets/01-ELK-Stack/3aaa0eceaf506b5940c2.png)

与集成Linux审计日志一样，在代理策略中选择已有的Agent Policy

![](assets/01-ELK-Stack/11506a7b29821fcc63aa.png)

修改logs的默认值，指定日志路径

![](assets/01-ELK-Stack/14192fd941ef3c8de5e3.png)

修改metrics的默认值，修改为https，填写账号密码与ca证书路径

```bash
certificate_authorities: ["/etc/elasticsearch/certs/http_ca.crt"]
```

![](assets/01-ELK-Stack/90e1fe3848a3a149d4ef.png)

添加完成后查看已经集成的代理，显示Elasticsearch信息。

![](assets/01-ELK-Stack/5ecb34da41a5a90e16b0.png)

# 查看数据
## 查看dashboard
当我们添加Elastic代理集成后，会自动为我们创建相关的dashboard，接下来以Elasticsearch为例

![](assets/01-ELK-Stack/b3405e3331896948f2c3.png)

点击资产标签，既可查看默认的dashboard信息，点击其中一个查看详情

![](assets/01-ELK-Stack/0d698e491deae757e9a1.png)

dashboard内容如下所示

![](assets/01-ELK-Stack/df758c4af90a301e2f1f.png)

## 查看数据流内容
如果我们想查看日志的详细内容，可以通过添加discover查看，以auditd.log为例。可知审计日志数据集名称为auditd.log

![](assets/01-ELK-Stack/e0e74fcdac3a7985044f.png)

接下来创建kibana discover，选择菜单——>Stack Management——>kibana discover

![](assets/01-ELK-Stack/496cc558a5667916b2ef.png)

接下来创建数据视图，填写内容如下：

![](assets/01-ELK-Stack/52ebc57d58b4004b59b6.png)

打开discover菜单，选择auditd.log，<font style="color:rgb(58, 58, 58);">即可</font>查看详细的日志审计内容。

![](assets/01-ELK-Stack/5ca3a29f12e484f292e8.png)

# 内网环境离线包仓库
某些场景下elk集群部署在隔离内网环境，无法直接访问互联网下载各种集成策略，此时就需要在内网搭建离线软件包仓库，并将默认的公网仓库地址改为内网离线仓库地址。

## 启动离线集成策略仓库容器
外网机器操作

```bash
# 外网机器拉取Docker软件包仓库
docker pull docker.elastic.co/package-registry/distribution:8.10.4
# 外网机器导出镜像
docker save -o package-registry-8.10.4.tar docker.elastic.co/package-registry/distribution:8.10.4
```

内网仓库机器操作

```bash
# 将镜像从外网机器导入内网仓库机器并导入镜像
docker load -i package-registry-8.10.4.tar
# 运行离线仓库容器
docker run --name=package-registry -d -p 8080:8080 --restart=always docker.elastic.co/package-registry/distribution:8.10.4
```

## 启动离线elastic agent仓库容器
外网机器操作

```bash
# 外网机器拉取nginx镜像
docker pull nginx
# 外网机器导出镜像
docker save -o nginx.tar nginx:latest
# 外网机器下载elastic agent、sha512、asc文件
wget https://artifacts.elastic.co/downloads/beats/elastic-agent/elastic-agent-8.10.4-linux-x86_64.tar.gz
wget https://artifacts.elastic.co/downloads/beats/elastic-agent/elastic-agent-8.10.4-windows-x86_64.zip
wget https://artifacts.elastic.co/downloads/beats/elastic-agent/elastic-agent-8.10.4-linux-x86_64.tar.gz.sha512
wget https://artifacts.elastic.co/downloads/beats/elastic-agent/elastic-agent-8.10.4-windows-x86_64.zip.sha512
wget https://artifacts.elastic.co/downloads/beats/elastic-agent/elastic-agent-8.10.4-linux-x86_64.tar.gz.asc
wget https://artifacts.elastic.co/downloads/beats/elastic-agent/elastic-agent-8.10.4-windows-x86_64.zip.asc
```

内网仓库机器操作

+ 将镜像从外网机器导入内网仓库机器并导入镜像

```bash
docker load -i nginx.tar
```

+ 软件包与nginx配置文件准备

```bash
[root@KA ~]# mkdir -p /opt/store/beats/elastic-agent/
[root@KA ~]# cd /opt/store/beats/elastic-agent/
# 导入elastic-agent包至/opt/store/beats/elastic-agent/路径下
[root@KA elastic-agent]# ls
elastic-agent-8.10.4-linux-x86_64.tar.gz elastic-agent-8.10.4-linux-x86_64.tar.gz.sha512 elastic-agent-8.10.4-windows-x86_64.zip elastic-agent-8.10.4-windows-x86_64.zip.sha512
[root@KA ~]# cd /opt/store
[root@KA ~]# ls 
nginx.conf beats
[root@KA store]# cat nginx.conf
server {
    listen       8030;
    server_name  ~^.*$;

    location / {
        root /opt/store/;
        autoindex on;
        autoindex_exact_size off;
        autoindex_localtime on;
    }
}
```

+ 修改权限

```bash
# 添加了一个指定gid为1001的upload用户
[root@KA store]# groupadd -g 101 nginx
# 添加了一个uid为1001的用户，并加入到upload的组中
[root@KA store]# useradd -u 101 -g nginx nginx
# 修改权限
[root@KA store]# chown -R nginx:nginx /opt/store
```

+ 启动容器

```bash
[root@ELP-T-VM-KA store]# docker run --name store -d -p 8030:8030 -v /opt/store:/opt/store -v /opt/store/nginx.conf:/etc/nginx/conf.d/default.conf --restart always nginx:latest
```

## 修改kibana配置文件
新增registryUrl地址配置

```bash
xpack.fleet.registryUrl: "http://192.168.10.51:8080"
```

修改elastic agent包下载地址

![](assets/01-ELK-Stack/673c1a604f1c85ae8d37.png)

## 验证
查看package-registry容器日志可知，所有集成策略资源均从内网elastic-repo中获取。

```bash
[root@es-repo ~]# docker logs elastic-repo -f
{"log.level":"info","@timestamp":"2023-11-27T14:06:47.440Z","log.logger":"http","message":"GET /package/elasticsearch/1.10.0/ HTTP/1.1","source.address":"192.168.10.50","http.request.method":"GET","url.path":"/package/elasticsearch/1.10.0/","url.domain":"192.168.10.51","http.response.code":200,"http.response.body.bytes":31938,"event.duration":4252455,"source.ip":"192.168.10.50","user_agent.original":"Kibana/8.10.4 node-fetch","url.port":8080,"ecs.version":"1.6.0"}
{"log.level":"info","@timestamp":"2023-11-27T14:06:47.455Z","log.logger":"http","message":"GET /package/elasticsearch/1.10.0/ HTTP/1.1","source.address":"192.168.10.50","http.request.method":"GET","url.path":"/package/elasticsearch/1.10.0/","url.domain":"192.168.10.51","http.response.code":200,"http.response.body.bytes":31938,"event.duration":3262071,"source.ip":"192.168.10.50","user_agent.original":"Kibana/8.10.4 node-fetch","url.port":8080,"ecs.version":"1.6.0"}
{"log.level":"info","@timestamp":"2023-11-27T14:06:47.493Z","log.logger":"http","message":"GET /epr/elasticsearch/elasticsearch-1.10.0.zip HTTP/1.1","source.address":"192.168.10.50","http.request.method":"GET","url.path":"/epr/elasticsearch/elasticsearch-1.10.0.zip","url.domain":"192.168.10.51","http.response.code":200,"http.response.body.bytes":638234,"event.duration":30916835,"source.ip":"192.168.10.50","user_agent.original":"Kibana/8.10.4 node-fetch","url.port":8080,"ecs.version":"1.6.0"}
{"log.level":"info","@timestamp":"2023-11-27T14:06:47.509Z","log.logger":"http","message":"GET /package/elasticsearch/1.10.0/ HTTP/1.1","source.address":"192.168.10.50","http.request.method":"GET","url.path":"/package/elasticsearch/1.10.0/","url.domain":"192.168.10.51","http.response.code":200,"http.response.body.bytes":31938,"event.duration":3209607,"source.ip":"192.168.10.50","user_agent.original":"Kibana/8.10.4 node-fetch","url.port":8080,"ecs.version":"1.6.0"}
{"log.level":"info","@timestamp":"2023-11-27T14:06:47.522Z","log.logger":"http","message":"GET /epr/elasticsearch/elasticsearch-1.10.0.zip.sig HTTP/1.1","source.address":"192.168.10.50","http.request.method":"GET","url.path":"/epr/elasticsearch/elasticsearch-1.10.0.zip.sig","url.domain":"192.168.10.51","http.response.code":200,"http.response.body.bytes":488,"event.duration":2503974,"source.ip":"192.168.10.50","user_agent.original":"Kibana/8.10.4 node-fetch","url.port":8080,"ecs.version":"1.6.0"}
{"log.level":"info","@timestamp":"2023-11-27T14:06:48.030Z","log.logger":"http","message":"GET /package/elasticsearch/1.10.0/img/logo_elasticsearch.svg HTTP/1.1","source.address":"192.168.10.50","http.request.method":"GET","url.path":"/package/elasticsearch/1.10.0/img/logo_elasticsearch.svg","url.domain":"192.168.10.51","http.response.code":200,"http.response.body.bytes":898,"event.duration":2825153,"source.ip":"192.168.10.50","user_agent.original":"Kibana/8.10.4 node-fetch","url.port":8080,"ecs.version":"1.6.0"}
```

# 参考文档
Elastic Agent介绍：[https://www.elastic.co/guide/en/fleet/current/beats-agent-comparison.html#supported-outputs-beats-and-agent](https://www.elastic.co/guide/en/fleet/current/beats-agent-comparison.html#supported-outputs-beats-and-agent)

Fleet Server介绍：[https://www.elastic.co/guide/en/fleet/8.8/fleet-server.html](https://www.elastic.co/guide/en/fleet/8.8/fleet-server.html)

Elastic Agent命令：[https://www.elastic.co/guide/en/fleet/current/elastic-agent-cmd-options.html#elastic-agent-cmd-options](https://www.elastic.co/guide/en/fleet/current/elastic-agent-cmd-options.html#elastic-agent-cmd-options)

elastic离线环境仓库配置：[https://www.elastic.co/guide/en/fleet/current/air-gapped.html](https://www.elastic.co/guide/en/fleet/current/air-gapped.html)


