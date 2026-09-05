# pod日志采集（EFK方案）

> 分类：ELK Stack / 第14章：ELK8生产实践
> 原文：https://www.cuiliangblog.cn/detail/section/162609303
> 来源：崔亮的博客

---

# EFK日志采集方案
## 方案介绍
+ 实现目标：k8s集群所有节点container和kubelet服务日志采集、k8s集群所有pod日志采集并对自定义应用日志实现过滤和清洗操作。
+ fluent bit采集：相较于fluentd而言，fluent bit更加轻量，且内置了pod日志解析插件和service日志采集功能无需编写复杂的日志处理配置。因此使用daemonset方式在每个节点部署fluent bit容器，可以最大程度减少资源占用。
+ fluentd处理：虽然fluent bit足够轻量，但日志解析处理能力弱于fluentd。fluentd支持更多的过滤处理插件，对于常用的数据处理操作，fluentd可以直接通过ruby语法处理，而fluent bit需要开发lua脚本才能实现。
+ fluentd集群方案：使用<font style="color:rgb(31, 35, 40);">Fluentd充当日志聚合层，接收fluent-bit日志后统一进行处理操作，最后批量写入elasticsearch集群。这样做的好处</font>是当k8s集群规模过大时，避免了过多的fluent-bit连接ES写入数据，导致ES连接资源消耗过高、网络拥堵、连接资源竞争等问题。
+ fluent bit+fluentd方案：将日志采集与日志处理拆后分别交由不同的组件负责，最大程度发挥各个组件的优势，使得配置文件更加清晰易读，便于后期维护管理。

## 架构图
![](assets/01-ELK-Stack/e70ec4ec579838c396e6.png)

# fluent bit部署与配置
## 参考文档
[https://docs.fluentbit.io/manual/installation/kubernetes](https://docs.fluentbit.io/manual/installation/kubernetes)

## 开启journal日志持久化
默认情况下fluent-bit通过socket获取journald日志，但如果使用pod运行fluent-bit时无法获取journald日志，需要配置journald参数，改为存储至宿主机本地/var/log/journal目录下，然后pod挂载宿主机/var/log目录进而读取kubelet和container日志。

```bash
[root@work1 ~]# vim /etc/systemd/journald.conf
Storage=persistent
[root@work1 ~]# systemctl restart systemd-journald
```

## 部署fluent-bit
拉取helm包

```bash
[root@master1 ~]# helm repo add fluent https://fluent.github.io/helm-charts
[root@master1 ~]# helm pull fluent/fluent-bit --untar
[root@master1 ~]# cd fluent-bit/
[root@master1 fluent-bit]# ls
Chart.yaml  ci  dashboards  README.md  templates  values.yaml
```

修改配置

```bash
[root@tiaoban fluent-bit]# vim values.yaml
image:
  repository: harbor.local.com/elk/fluentbit # 修改为本地仓库地址
  tag: v2.1.9 # 指定镜像版本

config:
	# 默认未配置文件缓冲，新增文件缓冲配置
  service: |
    [SERVICE]
        Daemon Off
        Flush {{ .Values.flush }}
        Log_Level {{ .Values.logLevel }}
        Parsers_File /fluent-bit/etc/parsers.conf
        Parsers_File /fluent-bit/etc/conf/custom_parsers.conf
        HTTP_Server On
        HTTP_Listen 0.0.0.0
        HTTP_Port {{ .Values.metricsPort }}
        Health_Check On
        storage.path              /var/log/flb-storage/ 
        storage.sync              normal               
        storage.checksum          off	                  
        storage.backlog.mem_limit 5M	
	
  # 默认配置文件只采集pod和kubelet服务日志，新增containerd日志，并排除Fluentd和Fluent-bit日志采集
  inputs: |
    [INPUT]
        Name systemd
        Tag containerd.service
        Systemd_Filter _SYSTEMD_UNIT=containerd.service
        Read_From_Tail On

    [INPUT]
        Name systemd
        Tag kubelet.service
        Systemd_Filter _SYSTEMD_UNIT=kubelet.service
        Read_From_Tail On

    [INPUT]
        Name tail
        Path /var/log/containers/*.log
        Exclude_Path /var/log/containers/fluent-bit*, /var/log/containers/fluentd-*
        multiline.parser docker, cri
        Tag kube.*
        Mem_Buf_Limit 5MB
        Skip_Long_Lines On
  
  # 原始字段中的time值不是标准时间格式，直接写入es会报错，可移除time字段，使用@timestamp标识时间
	filters: |
    [FILTER]
        name        record_modifier
        match       kube.*
        remove_key  time
 
  # 将所有采集到的数据直接转发至后端fluentd服务。
  outputs: |
    [OUTPUT]
        Name forward
        Match *
        Host fluentd.logging.svc
        Port 8888
        storage.total_limit_size 5M

hotReload:
  enabled: true # 按需开启配置热更新
  image:
    repository: harbor.local.com/elk/fluentbit # 修改为本地仓库地址
```

部署fluent-bit

```bash
[root@tiaoban fluent-bit]# kubectl create ns logging
namespace/logging created
[root@tiaoban fluent-bit]# helm install fluent-bit -n logging . -f values.yaml
NAME: fluent-bit
LAST DEPLOYED: Sat Sep 16 14:46:03 2023
NAMESPACE: logging
STATUS: deployed
REVISION: 1
NOTES:
Get Fluent Bit build information by running these commands:

export POD_NAME=$(kubectl get pods --namespace logging -l "app.kubernetes.io/name=fluent-bit,app.kubernetes.io/instance=fluent-bit" -o jsonpath="{.items[0].metadata.name}")
kubectl --namespace logging port-forward $POD_NAME 2020:2020
curl http://127.0.0.1:2020
```

验证

```bash
[root@tiaoban fluent-bit]# kubectl get pod -n logging -o wide
NAME               READY   STATUS    RESTARTS   AGE   IP             NODE      NOMINATED NODE   READINESS GATES
fluent-bit-4z7zj   1/1     Running   0          10m   10.244.1.16    master2   <none>           <none>
fluent-bit-56ff6   1/1     Running   0          10m   10.244.5.170   work1     <none>           <none>
fluent-bit-6lzqr   1/1     Running   0          10m   10.244.2.232   master3   <none>           <none>
fluent-bit-72h7w   1/1     Running   0          10m   10.244.0.29    master1   <none>           <none>
fluent-bit-ttb4x   1/1     Running   0          10m   10.244.3.254   work3     <none>           <none>
fluent-bit-xnrms   1/1     Running   0          10m   10.244.4.12    work2     <none>           <none>
```

# fluentd部署与配置
## 构建fluentd镜像
由于fluentd镜像未安装elasticsearch、geoip、rewrite-tag-filter插件，如果在pod的init阶段在线安装插件经常会导致拉取超时无法正常启动。因此需要提前构建包含相关插件的fluentd镜像，并上传至harbor仓库中。

```bash
[root@tiaoban fluent]# cat Dockerfile 
FROM fluent/fluentd:v1.16.2-debian-1.1
USER root
ADD GeoLite2-City.mmdb /fluentd/GeoLite2-City.mmdb
RUN sed -i "s@http://deb.debian.org@http://mirrors.aliyun.com@g" /etc/apt/sources.list \
    && apt-get update \
    && apt-get install -y --no-install-recommends build-essential libgeoip-dev autoconf automake libtool libffi-dev \
    && gem sources --add https://gems.ruby-china.com/ --remove https://rubygems.org/ \
    && fluent-gem install fluent-plugin-elasticsearch fluent-plugin-geoip fluent-plugin-rewrite-tag-filter \
    && apt-get autoclean \
    && gem sources --clear-all \
    && rm -rf /var/lib/apt/lists/* \
    && rm -rf /tmp/* /var/tmp/* /usr/lib/ruby/gems/*/cache/*.gem
[root@tiaoban fluent]# docker build -t harbor.local.com/elk/fluentd:fluentd:v1.16.2 .
[root@tiaoban fluent]# docker push harbor.local.com/elk/fluentd:fluentd:v1.16.2
```

## fluentd部署配置
fluentd使用deployment控制器部署多副本集群，用于接收fluent bit的数据然后写入es的数据流中。

+ fluentd-conf.yaml 

```yaml
[root@tiaoban fluentd]# cat fluentd-conf.yaml 
apiVersion: v1
kind: ConfigMap
metadata:
  name: fluentd-conf
  namespace: logging
data:
  fluent.conf : |-
    <source>
      @type forward
      port 8888
      bind 0.0.0.0
    </source>

    <match *.service>
      @type elasticsearch
      host elasticsearch-es-http.elk.svc
      port 9200
      default_elasticsearch_version 8
      user elastic
      scheme https
      password CHANGE_ME
      ssl_verify false
      data_stream_name logs-${tag}-fluentd
      include_timestamp true
      <buffer>
        @type file
        flush_interval 5s
        path /fluentd/buf/service-logs.*
      </buffer>
    </match>

    <match kube.**>
      @type elasticsearch
      host elasticsearch-es-http.elk.svc
      port 9200
      default_elasticsearch_version 8
      user elastic
      scheme https
      password CHANGE_ME
      ssl_verify false
      data_stream_name logs-pod-fluentd
      include_timestamp true
      <buffer>
        @type file
        flush_interval 5s
        path /fluentd/buf/pod-logs.*
      </buffer>
    </match>
```

+ fluentd-svc.yaml

```yaml
apiVersion: v1
kind: Service
metadata:
  name: fluentd
  namespace: logging
spec:
  selector:
    app: fluentd
  ports:
  - port: 8888
    targetPort: 8888
```

+ fluentd.yaml

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: fluentd
  namespace: logging
spec:
  replicas: 3
  selector:
    matchLabels:
      app: fluentd
  template:
    metadata:
      labels:
        app: fluentd
    spec:
      containers:
      - name: fluentd
        image: harbor.local.com/elk/fluentd:v1.16.2
        resources:
          limits:
            memory: "128Mi"
            cpu: "500m"
        ports:
        - containerPort: 8888
        volumeMounts:
          - name: fluentd-conf
            mountPath: /fluentd/etc/fluent.conf
            subPath: fluent.conf
      volumes:
        - name: fluentd-conf
          configMap:
            name: fluentd-conf
```

部署fluentd服务

```bash
[root@tiaoban fluentd]# ls
Dockerfile  fluentd-conf.yaml  fluentd-svc.yaml  fluentd.yaml  GeoLite2-City.mmdb
[root@tiaoban fluentd]# kubectl apply -f .
configmap/fluentd-conf created
service/fluentd created
deployment.apps/fluentd created
```

## 访问验证
此时查看kibana索引管理，已成功创建了pod、containerd、kubelet日志数据流。

![](assets/01-ELK-Stack/d5b831b78ec9d0364ede.png)

# service日志处理
虽然我们已经将service日志存储在了elasticsearch中，但观察发现默认情况下日志内容都在MESSAGE字段中，通常情况下，我们只会关注日志等级为warning和error的日志，因此我们需要对该字段内容做解析处理。

## 日志内容分析
观察container日志可知，MESSAGE中包含了日志时间、日志等级、日志内容三部分内容

![](assets/01-ELK-Stack/469e86b53bba136fef0d.png)

观察kubelet日志，MESSAGE中包含了日志时间、处理函数、日志内容三部分内容

![](assets/01-ELK-Stack/bc4a6aa0bd301b12470c.png)

## 新增service日志处理规则
我们可以通过正则匹配插件实现MESSAGE字段值解析操作，需要注意的是正则匹配时一定是所有字段都包含，否则会因为匹配不到而无法过滤处理操作。

+ service-conf.yaml

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: service-conf
  namespace: logging
data:
  service.conf : |
    <filter containerd.service>
      @type parser
      key_name MESSAGE
      reserve_data true
      <parse>
        @type regexp
        expression /time="(?<time>[^"]+)" level=(?<level>[^ ]+) msg="(?<msg>[^"]+)"/
        time_key time
        time_format %Y-%m-%dT%H:%M:%S.%N%z
      </parse>
    </filter>

    <filter kubelet.service>
      @type parser
      key_name MESSAGE
      reserve_data true
      <parse>
        @type regexp
        expression /[EI](?<time>\d{4} \d{2}:\d{2}:\d{2}.\d{6}) +\d* (?<class>\w*).go:\d*] (?<message>.*)/
        time_key time
        time_format %m%d %H:%M:%S.%N
        timezone +08:00
      </parse>
    </filter>

    <match *.service>
      @type elasticsearch_data_stream
      host elasticsearch-es-http.elk.svc
      port 9200
      default_elasticsearch_version 8
      user elastic
      scheme https
      password CHANGE_ME
      ssl_verify false
      data_stream_name logs-${tag}-fluentd
      include_timestamp true
      <buffer>
        @type file
        path /fluentd/buf/service-logs.*
      </buffer>
    </match>
```

## 访问验证
查看containerd服务日志，已成功解析了MESSAGE字段内容，并新增了@timestamp、leve、msg字段

![](assets/01-ELK-Stack/d827c1ab7ddc6e7cb19f.png)

查看kubelet服务日志，同样成功解析了MESSAGE字段内容，并新增了@timestamp、class、message字段

![](assets/01-ELK-Stack/d5b5a674bcbc6726c5dd.png)

# 自定义日志解析
## 需求分析
默认情况下，fluent bit会采集所有pod日志信息，并自动添加namespace、pod、container等信息，所有日志内容存储在log字段中。

以log-demo应为日志为例，将所有日志内容存储到log字段下无法很好的解析日志内容，因此需要编写fluentd解析规则，实现日志内容解析。

![](assets/01-ELK-Stack/0ae6143f8fd0750a6d73.png)

## 新增自定义日志处理规则
使用rewrite_tag_filter插件，匹配到container_name字段值为log-demo的事件时，新增myapp.log标签，接下来对myapp.log标签的事件进一步做解析处理操作。

+ myapp-conf.yaml

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: myapp-conf
  namespace: logging
data:
  myapp.conf : |
    <match kube.**>
      @type rewrite_tag_filter
      <rule>
        key $.kubernetes.container_name
        pattern log-demo
        tag myapp.log
      </rule>
    </match>

    <filter myapp.log>
      @type parser
      key_name log
      <parse>
        @type regexp
        expression /^(?<logtime>[^|]+) \| (?<level>[A-Z]*) *\| __main__:(?<class>\D*:\d*) - (?<content>.*)$/
        time_key logtime
        time_format %Y-%m-%d %H:%M:%S.%L
      </parse>
    </filter>

    <filter myapp.log>
      @type record_transformer
      enable_ruby
      <record>
        content ${record["content"].gsub("'", '"')}
      </record>
    </filter>

    <filter myapp.log>
      @type parser
      key_name content
      <parse>
        @type json
      </parse>
    </filter>

    <filter myapp.log>
      @type geoip
      geoip_lookup_keys remote_address
      geoip2_database /fluentd/GeoLite2-City.mmdb
      backend_library geoip2_c
      <record>
        geoip_city            ${city.names.en["remote_address"]}
        geoip_latitude        ${location.latitude["remote_address"]}
        geoip_longitude       ${location.longitude["remote_address"]}
        geoip_country         ${country.iso_code["remote_address"]}
        geoip_country_name    ${country.names.en["remote_address"]}
        geoip_postal_code     ${postal.code["remote_address"]}
        geoip_region_name     ${subdivisions.0.names.en["remote_address"]}
        geoip.location        '[${location.latitude["ClientHost"]},${location.longitude["ClientHost"]}]'
      </record>
    </filter>

    <match myapp.log>
      @type elasticsearch_data_stream
      host elasticsearch-es-http.elk.svc
      port 9200
      default_elasticsearch_version 8
      user elastic
      scheme https
      password CHANGE_ME
      ssl_verify false
      data_stream_name logs-myapp-default
      include_timestamp true
      <buffer>
        @type file
        flush_interval 5s
        path /fluentd/buf/myapp-logs.*
      </buffer>
    </match> 
```

## 访问验证
查看kibana索引信息，已成功创建名为logs-myapp-default的数据流。

![](assets/01-ELK-Stack/7db165bd1bc62db97dec.png)

查看logs-myapp-default字段信息，已成功解析了日志内容。

![](assets/01-ELK-Stack/7d9111409c2d63cef2a8.png)

# 完整资源清单
本实验案例所有yaml文件已上传至git仓库。访问地址如下：

## github
[https://github.com/cuiliang0302/blog-demo](https://github.com/cuiliang0302/blog-demo)

## gitee
[https://gitee.com/cuiliang0302/blog_demo](https://gitee.com/cuiliang0302/blog_demo)

# 参考文档
fluent bit转发事件至fluentd：[https://docs.fluentbit.io/manual/pipeline/outputs/forward](https://docs.fluentbit.io/manual/pipeline/outputs/forward)

构建自定义fluentd镜像：[https://github.com/fluent/fluentd-docker-image#31-for-current-images](https://github.com/fluent/fluentd-docker-image#31-for-current-images)

fluentd重写事件tag：[https://docs.fluentd.org/output/rewrite_tag_filter](https://docs.fluentd.org/output/rewrite_tag_filter)




