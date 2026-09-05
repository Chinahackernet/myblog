# Fleet部署与常见日志采集（ECK方式）

> 分类：ELK Stack / 第14章：ELK8生产实践
> 原文：https://www.cuiliangblog.cn/detail/section/162609388
> 来源：崔亮的博客

---

# Fleet简介
## Fleet概述
为了更加方便的实现系统和应用程序日志接入ES，官方推出了Elastic Agent采集方案。相较于之前使用beats采集数据，Elastic Agent可以实现通过更少的配置和安装来简化数据采集配置，仅需一个Elastic Agent代理即可实现日志、指标、APM 跟踪信息的采集，通过Fleet可以轻松的管理整个Elastic Agent队列。Kibana为我们内置了大多数场景下日志的采集与可视化分析配置，我们仅需要在kibanaUI中点击操作便可完成复杂的日志采集。

## 参考文档
更多fleet详细内容介绍，可参考文档：[13-01_%E7%AE%80%E4%BB%8B.md](articles/01-ELK-Stack/13-01_简介.md)

使用rpm方式部署fleet请参考文档：[https://www.cuiliangblog.cn/detail/article/61](https://www.cuiliangblog.cn/detail/article/61)

## fleet方式采集日志架构
我们只需要在k8s集群中部署一个fleet server服务，在每个k8s节点使用DaemonSet方式部署elastic agent，并将k8s节点的/var/log目录挂载到elastic agent容器即可。后续日志与指标采集均可在kibana图形界面中配置与管理，大大简化了应用程序日志接入ES的工作。k8s中使用fleet采集日志架构如下所示：

![](assets/01-ELK-Stack/c3e36d78900fc358d00b.png)

## 环境说明
由于演示环境资源有限，原本master1和master2节点运行各运行两个pod后，再运行elastic agent时内存资源紧张，因此改为单pod方式演示，现集群节点与角色如下：

| 主机名 | IP | 主机配置 | k8s用途 | ELK节点角色 |
| --- | --- | --- | --- | --- |
| <font style="color:rgb(48, 49, 51);">master1</font> | <font style="color:rgb(48, 49, 51);">192.168.10.151</font> | <font style="color:rgb(48, 49, 51);">2C8G</font> | <font style="color:rgb(48, 49, 51);">control-plane</font> | hot1、Elastic Agent |
| <font style="color:rgb(48, 49, 51);">master2</font> | <font style="color:rgb(48, 49, 51);">192.168.10.152</font> | <font style="color:rgb(48, 49, 51);">2C8G</font> | <font style="color:rgb(48, 49, 51);">control-plane</font> | hot2、Elastic Agent |
| <font style="color:rgb(48, 49, 51);">master3</font> | <font style="color:rgb(48, 49, 51);">192.168.10.153</font> | <font style="color:rgb(48, 49, 51);">2C8G</font> | <font style="color:rgb(48, 49, 51);">control-plane</font> | warm1、Elastic Agent |
| <font style="color:rgb(48, 49, 51);">work1</font> | <font style="color:rgb(48, 49, 51);">192.168.10.154</font> | <font style="color:rgb(48, 49, 51);">2C8G</font> | <font style="color:rgb(48, 49, 51);">work</font> | warm2、master1、Elastic Agent |
| <font style="color:rgb(48, 49, 51);">work2</font> | <font style="color:rgb(48, 49, 51);">192.168.10.155</font> | <font style="color:rgb(48, 49, 51);">2C8G</font> | <font style="color:rgb(48, 49, 51);">work</font> | cold、master2、Elastic Agent |
| <font style="color:rgb(48, 49, 51);">work3</font> | <font style="color:rgb(48, 49, 51);">192.168.10.156</font> | <font style="color:rgb(48, 49, 51);">2C8G</font> | <font style="color:rgb(48, 49, 51);">work</font> | master3、Elastic Agent |


kibana和fleet-server为无状态服务，由kube-scheduler自动调度至合适的节点运行。

# 资源清单介绍
## rbac
此处创建了两个ServiceAccount，分别是fleet-server和elastic-agent，并创建相应权限的ClusterRole与其绑定，保障可以有足够的权限采集k8s相关指标信息。

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: fleet-server
rules:
- apiGroups: [""]
  resources: ["*"]
  verbs:
  - get
  - watch
  - list
- apiGroups: ["coordination.k8s.io"]
  resources:
  - leases
  verbs:
  - get
  - create
  - update
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: fleet-server
  namespace: elk
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: fleet-server
subjects:
- kind: ServiceAccount
  name: fleet-server
  namespace: elk
roleRef:
  kind: ClusterRole
  name: fleet-server
  apiGroup: rbac.authorization.k8s.io
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: elastic-agent
rules:
- apiGroups: [""]
  resources: ["*"]
  verbs:
  - get
  - watch
  - list
- apiGroups: ["coordination.k8s.io"]
  resources:
  - leases
  verbs:
  - get
  - create
  - update
- nonResourceURLs:
  - "/metrics"
  verbs:
  - get
- apiGroups: ["extensions"]
  resources:
    - replicasets
  verbs: 
  - "get"
  - "list"
  - "watch"
- apiGroups:
  - "apps"
  resources:
  - statefulsets
  - deployments
  - replicasets
  verbs:
  - "get"
  - "list"
  - "watch"
- apiGroups:
  - ""
  resources:
  - nodes/stats
  verbs:
  - get
- apiGroups:
  - "batch"
  resources:
  - jobs
  verbs:
  - "get"
  - "list"
  - "watch"
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: elastic-agent
  namespace: elk
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: elastic-agent
subjects:
- kind: ServiceAccount
  name: elastic-agent
  namespace: elk
roleRef:
  kind: ClusterRole
  name: elastic-agent
  apiGroup: rbac.authorization.k8s.io
```

## fleet-server
fleet-server使用eck的CRD资源部署，关联kibana和elasticsearch资源。指定serviceAccount为前面创建的fleet-server，并将sa的token资源挂载到 Pod 中，用于连接验证k8s资源使用。

```yaml
apiVersion: agent.k8s.elastic.co/v1alpha1
kind: Agent
metadata:
  name: fleet-server
  namespace: elk
spec:
  version: 8.9.1
  image: harbor.local.com/elk/elastic-agent:8.9.1
  kibanaRef:
    name: kibana
  elasticsearchRefs:
  - name: elasticsearch
  mode: fleet
  fleetServerEnabled: true
  policyID: eck-fleet-server
  deployment:
    replicas: 1
    podTemplate:
      spec:
        serviceAccountName: fleet-server
        automountServiceAccountToken: true
        securityContext:
          runAsUser: 0
```

## elastic-agent
elastic-agent使用eck的CRD资源部署，并关联kibana和elasticsearch资源。指定serviceAccount为前面创建的elastic-agent，并将sa的token资源挂载到 Pod 中，用于连接验证k8s资源使用。并挂载宿主机的/var/log目录用于采集日志，挂载es的ca.crt资源用户连接ES服务验证，网络模式使用hostNetwork以便于访问kube-proxy服务，以及fleet管理菜单能正确显示主机名。

```yaml
apiVersion: agent.k8s.elastic.co/v1alpha1
kind: Agent
metadata:
  name: elastic-agent
  namespace: elk
spec:
  version: 8.9.1
  image: harbor.local.com/elk/elastic-agent:8.9.1
  kibanaRef:
    name: kibana
  fleetServerRef:
    name: fleet-server
  mode: fleet
  policyID: eck-agent
  daemonSet:
    podTemplate:
      spec:
        serviceAccountName: elastic-agent
        automountServiceAccountToken: true
        securityContext:
          runAsUser: 0
        containers:
        - name: agent
          volumeMounts:
          - mountPath: /var/log
            name: log-dir
          - mountPath: /etc/es-http-certs
            name: es-http-certs
        hostNetwork: true
        dnsPolicy: ClusterFirstWithHostNet
        volumes:
        - name: log-dir
          hostPath:
            path: /var/log
        - name: es-http-certs
          secret:
            secretName: elasticsearch-es-http-certs-public
```

## es-log4j2
<font style="color:rgb(48, 49, 51);">docker方式运行的elasticsearch日志默认使用的console输出, 不会记录到日志文件中, logs目录下面只有gc.log，因此我们可以需要修改配置log4j2设置，将日志写入对应文件中。方便elastic-agent挂载日志目录收集elasticsearch服务日志。</font>

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: es-log4j2
  namespace: elk
data:
  log4j2.properties : |-
    status = error

    appender.console.type = Console
    appender.console.name = console
    appender.console.layout.type = PatternLayout
    appender.console.layout.pattern = [%d{ISO8601}][%-5p][%-25c{1.}] [%node_name]%marker %m%consoleException%n

    ######## Server JSON ############################
    appender.rolling.type = RollingFile
    appender.rolling.name = rolling
    appender.rolling.fileName = ${sys:es.logs.base_path}${sys:file.separator}${sys:es.logs.cluster_name}_server.json
    appender.rolling.layout.type = ECSJsonLayout
    appender.rolling.layout.dataset = elasticsearch.server

    appender.rolling.filePattern = ${sys:es.logs.base_path}${sys:file.separator}${sys:es.logs.cluster_name}-%d{yyyy-MM-dd}-%i.json.gz
    appender.rolling.policies.type = Policies
    appender.rolling.policies.time.type = TimeBasedTriggeringPolicy
    appender.rolling.policies.time.interval = 1
    appender.rolling.policies.time.modulate = true
    appender.rolling.policies.size.type = SizeBasedTriggeringPolicy
    appender.rolling.policies.size.size = 128MB
    appender.rolling.strategy.type = DefaultRolloverStrategy
    appender.rolling.strategy.fileIndex = nomax
    appender.rolling.strategy.action.type = Delete
    appender.rolling.strategy.action.basepath = ${sys:es.logs.base_path}
    appender.rolling.strategy.action.condition.type = IfFileName
    appender.rolling.strategy.action.condition.glob = ${sys:es.logs.cluster_name}-*
    appender.rolling.strategy.action.condition.nested_condition.type = IfAccumulatedFileSize
    appender.rolling.strategy.action.condition.nested_condition.exceeds = 2GB
    ################################################
    ######## Server -  old style pattern ###########
    appender.rolling_old.type = RollingFile
    appender.rolling_old.name = rolling_old
    appender.rolling_old.fileName = ${sys:es.logs.base_path}${sys:file.separator}${sys:es.logs.cluster_name}.log
    appender.rolling_old.layout.type = PatternLayout
    appender.rolling_old.layout.pattern = [%d{ISO8601}][%-5p][%-25c{1.}] [%node_name]%marker %m%n

    appender.rolling_old.filePattern = ${sys:es.logs.base_path}${sys:file.separator}${sys:es.logs.cluster_name}-%d{yyyy-MM-dd}-%i.log.gz
    appender.rolling_old.policies.type = Policies
    appender.rolling_old.policies.time.type = TimeBasedTriggeringPolicy
    appender.rolling_old.policies.time.interval = 1
    appender.rolling_old.policies.time.modulate = true
    appender.rolling_old.policies.size.type = SizeBasedTriggeringPolicy
    appender.rolling_old.policies.size.size = 128MB
    appender.rolling_old.strategy.type = DefaultRolloverStrategy
    appender.rolling_old.strategy.fileIndex = nomax
    appender.rolling_old.strategy.action.type = Delete
    appender.rolling_old.strategy.action.basepath = ${sys:es.logs.base_path}
    appender.rolling_old.strategy.action.condition.type = IfFileName
    appender.rolling_old.strategy.action.condition.glob = ${sys:es.logs.cluster_name}-*
    appender.rolling_old.strategy.action.condition.nested_condition.type = IfAccumulatedFileSize
    appender.rolling_old.strategy.action.condition.nested_condition.exceeds = 2GB
    ################################################

    rootLogger.level = info
    rootLogger.appenderRef.console.ref = console
    rootLogger.appenderRef.rolling.ref = rolling
    rootLogger.appenderRef.rolling_old.ref = rolling_old

    ######## Deprecation JSON #######################
    appender.deprecation_rolling.type = RollingFile
    appender.deprecation_rolling.name = deprecation_rolling
    appender.deprecation_rolling.fileName = ${sys:es.logs.base_path}${sys:file.separator}${sys:es.logs.cluster_name}_deprecation.json
    appender.deprecation_rolling.layout.type = ECSJsonLayout
    # Intentionally follows a different pattern to above
    appender.deprecation_rolling.layout.dataset = deprecation.elasticsearch
    appender.deprecation_rolling.filter.rate_limit.type = RateLimitingFilter

    appender.deprecation_rolling.filePattern = ${sys:es.logs.base_path}${sys:file.separator}${sys:es.logs.cluster_name}_deprecation-%i.json.gz
    appender.deprecation_rolling.policies.type = Policies
    appender.deprecation_rolling.policies.size.type = SizeBasedTriggeringPolicy
    appender.deprecation_rolling.policies.size.size = 1GB
    appender.deprecation_rolling.strategy.type = DefaultRolloverStrategy
    appender.deprecation_rolling.strategy.max = 4

    appender.header_warning.type = HeaderWarningAppender
    appender.header_warning.name = header_warning
    #################################################

    logger.deprecation.name = org.elasticsearch.deprecation
    logger.deprecation.level = WARN
    logger.deprecation.appenderRef.deprecation_rolling.ref = deprecation_rolling
    logger.deprecation.appenderRef.header_warning.ref = header_warning
    logger.deprecation.additivity = false

    ######## Search slowlog JSON ####################
    appender.index_search_slowlog_rolling.type = RollingFile
    appender.index_search_slowlog_rolling.name = index_search_slowlog_rolling
    appender.index_search_slowlog_rolling.fileName = ${sys:es.logs.base_path}${sys:file.separator}${sys:es.logs\
      .cluster_name}_index_search_slowlog.json
    appender.index_search_slowlog_rolling.layout.type = ECSJsonLayout
    appender.index_search_slowlog_rolling.layout.dataset = elasticsearch.index_search_slowlog

    appender.index_search_slowlog_rolling.filePattern = ${sys:es.logs.base_path}${sys:file.separator}${sys:es.logs\
      .cluster_name}_index_search_slowlog-%i.json.gz
    appender.index_search_slowlog_rolling.policies.type = Policies
    appender.index_search_slowlog_rolling.policies.size.type = SizeBasedTriggeringPolicy
    appender.index_search_slowlog_rolling.policies.size.size = 1GB
    appender.index_search_slowlog_rolling.strategy.type = DefaultRolloverStrategy
    appender.index_search_slowlog_rolling.strategy.max = 4
    #################################################

    #################################################
    logger.index_search_slowlog_rolling.name = index.search.slowlog
    logger.index_search_slowlog_rolling.level = trace
    logger.index_search_slowlog_rolling.appenderRef.index_search_slowlog_rolling.ref = index_search_slowlog_rolling
    logger.index_search_slowlog_rolling.additivity = false

    ######## Indexing slowlog JSON ##################
    appender.index_indexing_slowlog_rolling.type = RollingFile
    appender.index_indexing_slowlog_rolling.name = index_indexing_slowlog_rolling
    appender.index_indexing_slowlog_rolling.fileName = ${sys:es.logs.base_path}${sys:file.separator}${sys:es.logs.cluster_name}\
      _index_indexing_slowlog.json
    appender.index_indexing_slowlog_rolling.layout.type = ECSJsonLayout
    appender.index_indexing_slowlog_rolling.layout.dataset = elasticsearch.index_indexing_slowlog


    appender.index_indexing_slowlog_rolling.filePattern = ${sys:es.logs.base_path}${sys:file.separator}${sys:es.logs.cluster_name}\
      _index_indexing_slowlog-%i.json.gz
    appender.index_indexing_slowlog_rolling.policies.type = Policies
    appender.index_indexing_slowlog_rolling.policies.size.type = SizeBasedTriggeringPolicy
    appender.index_indexing_slowlog_rolling.policies.size.size = 1GB
    appender.index_indexing_slowlog_rolling.strategy.type = DefaultRolloverStrategy
    appender.index_indexing_slowlog_rolling.strategy.max = 4
    #################################################


    logger.index_indexing_slowlog.name = index.indexing.slowlog.index
    logger.index_indexing_slowlog.level = trace
    logger.index_indexing_slowlog.appenderRef.index_indexing_slowlog_rolling.ref = index_indexing_slowlog_rolling
    logger.index_indexing_slowlog.additivity = false


    logger.org_apache_pdfbox.name = org.apache.pdfbox
    logger.org_apache_pdfbox.level = off

    logger.org_apache_poi.name = org.apache.poi
    logger.org_apache_poi.level = off

    logger.org_apache_fontbox.name = org.apache.fontbox
    logger.org_apache_fontbox.level = off

    logger.org_apache_xmlbeans.name = org.apache.xmlbeans
    logger.org_apache_xmlbeans.level = off


    logger.com_amazonaws.name = com.amazonaws
    logger.com_amazonaws.level = warn

    logger.com_amazonaws_jmx_SdkMBeanRegistrySupport.name = com.amazonaws.jmx.SdkMBeanRegistrySupport
    logger.com_amazonaws_jmx_SdkMBeanRegistrySupport.level = error

    logger.com_amazonaws_metrics_AwsSdkMetrics.name = com.amazonaws.metrics.AwsSdkMetrics
    logger.com_amazonaws_metrics_AwsSdkMetrics.level = error

    logger.com_amazonaws_auth_profile_internal_BasicProfileConfigFileLoader.name = com.amazonaws.auth.profile.internal.BasicProfileConfigFileLoader
    logger.com_amazonaws_auth_profile_internal_BasicProfileConfigFileLoader.level = error

    logger.com_amazonaws_services_s3_internal_UseArnRegionResolver.name = com.amazonaws.services.s3.internal.UseArnRegionResolver
    logger.com_amazonaws_services_s3_internal_UseArnRegionResolver.level = error


    appender.audit_rolling.type = RollingFile
    appender.audit_rolling.name = audit_rolling
    appender.audit_rolling.fileName = ${sys:es.logs.base_path}${sys:file.separator}${sys:es.logs.cluster_name}_audit.json
    appender.audit_rolling.layout.type = PatternLayout
    appender.audit_rolling.layout.pattern = {\
                    "type":"audit", \
                    "timestamp":"%d{yyyy-MM-dd'T'HH:mm:ss,SSSZ}"\
                    %varsNotEmpty{, "cluster.name":"%enc{%map{cluster.name}}{JSON}"}\
                    %varsNotEmpty{, "cluster.uuid":"%enc{%map{cluster.uuid}}{JSON}"}\
                    %varsNotEmpty{, "node.name":"%enc{%map{node.name}}{JSON}"}\
                    %varsNotEmpty{, "node.id":"%enc{%map{node.id}}{JSON}"}\
                    %varsNotEmpty{, "host.name":"%enc{%map{host.name}}{JSON}"}\
                    %varsNotEmpty{, "host.ip":"%enc{%map{host.ip}}{JSON}"}\
                    %varsNotEmpty{, "event.type":"%enc{%map{event.type}}{JSON}"}\
                    %varsNotEmpty{, "event.action":"%enc{%map{event.action}}{JSON}"}\
                    %varsNotEmpty{, "authentication.type":"%enc{%map{authentication.type}}{JSON}"}\
                    %varsNotEmpty{, "user.name":"%enc{%map{user.name}}{JSON}"}\
                    %varsNotEmpty{, "user.run_by.name":"%enc{%map{user.run_by.name}}{JSON}"}\
                    %varsNotEmpty{, "user.run_as.name":"%enc{%map{user.run_as.name}}{JSON}"}\
                    %varsNotEmpty{, "user.realm":"%enc{%map{user.realm}}{JSON}"}\
                    %varsNotEmpty{, "user.realm_domain":"%enc{%map{user.realm_domain}}{JSON}"}\
                    %varsNotEmpty{, "user.run_by.realm":"%enc{%map{user.run_by.realm}}{JSON}"}\
                    %varsNotEmpty{, "user.run_by.realm_domain":"%enc{%map{user.run_by.realm_domain}}{JSON}"}\
                    %varsNotEmpty{, "user.run_as.realm":"%enc{%map{user.run_as.realm}}{JSON}"}\
                    %varsNotEmpty{, "user.run_as.realm_domain":"%enc{%map{user.run_as.realm_domain}}{JSON}"}\
                    %varsNotEmpty{, "user.roles":%map{user.roles}}\
                    %varsNotEmpty{, "apikey.id":"%enc{%map{apikey.id}}{JSON}"}\
                    %varsNotEmpty{, "apikey.name":"%enc{%map{apikey.name}}{JSON}"}\
                    %varsNotEmpty{, "authentication.token.name":"%enc{%map{authentication.token.name}}{JSON}"}\
                    %varsNotEmpty{, "authentication.token.type":"%enc{%map{authentication.token.type}}{JSON}"}\
                    %varsNotEmpty{, "cross_cluster_access":%map{cross_cluster_access}}\
                    %varsNotEmpty{, "origin.type":"%enc{%map{origin.type}}{JSON}"}\
                    %varsNotEmpty{, "origin.address":"%enc{%map{origin.address}}{JSON}"}\
                    %varsNotEmpty{, "realm":"%enc{%map{realm}}{JSON}"}\
                    %varsNotEmpty{, "realm_domain":"%enc{%map{realm_domain}}{JSON}"}\
                    %varsNotEmpty{, "url.path":"%enc{%map{url.path}}{JSON}"}\
                    %varsNotEmpty{, "url.query":"%enc{%map{url.query}}{JSON}"}\
                    %varsNotEmpty{, "request.method":"%enc{%map{request.method}}{JSON}"}\
                    %varsNotEmpty{, "request.body":"%enc{%map{request.body}}{JSON}"}\
                    %varsNotEmpty{, "request.id":"%enc{%map{request.id}}{JSON}"}\
                    %varsNotEmpty{, "action":"%enc{%map{action}}{JSON}"}\
                    %varsNotEmpty{, "request.name":"%enc{%map{request.name}}{JSON}"}\
                    %varsNotEmpty{, "indices":%map{indices}}\
                    %varsNotEmpty{, "opaque_id":"%enc{%map{opaque_id}}{JSON}"}\
                    %varsNotEmpty{, "trace.id":"%enc{%map{trace.id}}{JSON}"}\
                    %varsNotEmpty{, "x_forwarded_for":"%enc{%map{x_forwarded_for}}{JSON}"}\
                    %varsNotEmpty{, "transport.profile":"%enc{%map{transport.profile}}{JSON}"}\
                    %varsNotEmpty{, "rule":"%enc{%map{rule}}{JSON}"}\
                    %varsNotEmpty{, "put":%map{put}}\
                    %varsNotEmpty{, "delete":%map{delete}}\
                    %varsNotEmpty{, "change":%map{change}}\
                    %varsNotEmpty{, "create":%map{create}}\
                    %varsNotEmpty{, "invalidate":%map{invalidate}}\
                    }%n
    
    appender.audit_rolling.filePattern = ${sys:es.logs.base_path}${sys:file.separator}${sys:es.logs.cluster_name}_audit-%d{yyyy-MM-dd}-%i.json.gz
    appender.audit_rolling.policies.type = Policies
    appender.audit_rolling.policies.time.type = TimeBasedTriggeringPolicy
    appender.audit_rolling.policies.time.interval = 1
    appender.audit_rolling.policies.time.modulate = true
    appender.audit_rolling.policies.size.type = SizeBasedTriggeringPolicy
    appender.audit_rolling.policies.size.size = 1GB
    appender.audit_rolling.strategy.type = DefaultRolloverStrategy
    appender.audit_rolling.strategy.fileIndex = nomax

    logger.xpack_security_audit_logfile.name = org.elasticsearch.xpack.security.audit.logfile.LoggingAuditTrail
    logger.xpack_security_audit_logfile.level = info
    logger.xpack_security_audit_logfile.appenderRef.audit_rolling.ref = audit_rolling
    logger.xpack_security_audit_logfile.additivity = false

    logger.xmlsig.name = org.apache.xml.security.signature.XMLSignature
    logger.xmlsig.level = error
    logger.samlxml_decrypt.name = org.opensaml.xmlsec.encryption.support.Decrypter
    logger.samlxml_decrypt.level = fatal
    logger.saml2_decrypt.name = org.opensaml.saml.saml2.encryption.Decrypter
    logger.saml2_decrypt.level = fatal
```

## elasticsearch
在elasticsearch资源的每个节点都配置名为elasticsearch-logs的存储资源(名称必须为elasticsearch-logs，否则eck无法正常识别)，类型为hostPath，指定路径为宿主机的/var/log/elasticsearch目录下。并挂载log4j2配置文件，替换默认的日志配置。

```yaml
apiVersion: elasticsearch.k8s.elastic.co/v1
kind: Elasticsearch
metadata:
  name: elasticsearch
  namespace: elk
spec:
  version: 8.9.1
  image: harbor.local.com/elk/elasticsearch:8.9.1
  secureSettings:
  - secretName: snapshot-settings
  nodeSets:
  - name: master
    count: 3
    config:
      node.roles: ["master", "ingest", "remote_cluster_client", "transform"]
      node.store.allow_mmap: false
    volumeClaimTemplates:
    - metadata:
        name: elasticsearch-data
      spec:
        accessModes:
        - ReadWriteOnce
        resources:
          requests:
            storage: 10Gi
        storageClassName: local-storage
    podTemplate:
      spec:
        containers:
        - name: elasticsearch
          env:
          - name: ES_JAVA_OPTS
            value: "-Xms512m -Xmx512m"
          - name: ES_SETTING_REINDEX_REMOTE_WHITELIST
            value: "192.168.10.100:9200"
          - name: ES_SETTING_REINDEX_SSL_VERIFICATION__MODE
            value: "none"
          resources:
            limits:
              cpu: 1
              memory: 1Gi
            requests:
              cpu: 500m
              memory: 512Mi
          volumeMounts:
          - name: es-log4j2
            mountPath: /usr/share/elasticsearch/config/log4j2.properties
            subPath: log4j2.properties
        volumes:
        - name: elasticsearch-logs
          hostPath:
            path: /var/log/elasticsearch
            type: DirectoryOrCreate
        - name: es-log4j2
          configMap:
            name: es-log4j2
  - name: hot
    count: 2
    config:
      node.roles: [ "data_content", "data_hot", "remote_cluster_client"]
      node.store.allow_mmap: false
    volumeClaimTemplates:
    - metadata:
        name: elasticsearch-data
      spec:
        accessModes:
        - ReadWriteOnce
        resources:
          requests:
            storage: 100Gi
        storageClassName: local-storage
    podTemplate:
      spec:
        containers:
        - name: elasticsearch
          env:
          - name: ES_JAVA_OPTS
            value: "-Xms512m -Xmx512m"
          - name: ES_SETTING_REINDEX_REMOTE_WHITELIST
            value: "192.168.10.100:9200"
          - name: ES_SETTING_REINDEX_SSL_VERIFICATION__MODE
            value: "none"
          resources:
            limits:
              cpu: 1
              memory: 1Gi
            requests:
              cpu: 500m
              memory: 512Mi
          volumeMounts:
          - name: es-log4j2
            mountPath: /usr/share/elasticsearch/config/log4j2.properties
            subPath: log4j2.properties
        volumes:
        - name: elasticsearch-logs
          hostPath:
            path: /var/log/elasticsearch
            type: DirectoryOrCreate
        - name: es-log4j2
          configMap:
            name: es-log4j2
  - name: warm
    count: 2
    config:
      node.roles: [ "data_content", "data_warm", "remote_cluster_client"]
      node.store.allow_mmap: false
    volumeClaimTemplates:
    - metadata:
        name: elasticsearch-data
      spec:
        accessModes:
        - ReadWriteOnce
        resources:
          requests:
            storage: 600Gi
        storageClassName: local-storage
    podTemplate:
      spec:
        containers:
        - name: elasticsearch
          env:
          - name: ES_JAVA_OPTS
            value: "-Xms512m -Xmx512m"
          - name: ES_SETTING_REINDEX_REMOTE_WHITELIST
            value: "192.168.10.100:9200"
          - name: ES_SETTING_REINDEX_SSL_VERIFICATION__MODE
            value: "none"
          resources:
            limits:
              cpu: 1
              memory: 1Gi
            requests:
              cpu: 500m
              memory: 512Mi
          volumeMounts:
          - name: es-log4j2
            mountPath: /usr/share/elasticsearch/config/log4j2.properties
            subPath: log4j2.properties
        volumes:
        - name: elasticsearch-logs
          hostPath:
            path: /var/log/elasticsearch
            type: DirectoryOrCreate
        - name: es-log4j2
          configMap:
            name: es-log4j2
  - name: cold
    count: 1
    config:
      node.roles: [ "data_content", "data_cold", "remote_cluster_client"]
      node.store.allow_mmap: false
    volumeClaimTemplates:
    - metadata:
        name: elasticsearch-data
      spec:
        accessModes:
        - ReadWriteOnce
        resources:
          requests:
            storage: 800Gi
        storageClassName: local-storage
    podTemplate:
      spec:
        containers:
        - name: elasticsearch
          env:
          - name: ES_JAVA_OPTS
            value: "-Xms512m -Xmx512m"
          - name: ES_SETTING_REINDEX_REMOTE_WHITELIST
            value: "192.168.10.100:9200"
          - name: ES_SETTING_REINDEX_SSL_VERIFICATION__MODE
            value: "none"
          resources:
            limits:
              cpu: 1
              memory: 1Gi
            requests:
              cpu: 500m
              memory: 512Mi
          volumeMounts:
          - name: es-log4j2
            mountPath: /usr/share/elasticsearch/config/log4j2.properties
            subPath: log4j2.properties
        volumes:
        - name: elasticsearch-logs
          hostPath:
            path: /var/log/elasticsearch
            type: DirectoryOrCreate
        - name: es-log4j2
          configMap:
            name: es-log4j2
```

## kibana
在kibana中关联elasticsearch资源，并指定elasticsearch和fleet_server的svc地址。声明在kibana中默认安装system、elastic_agent、fleet_server、elasticsearch、kubernetes这些集成策略。

```yaml
apiVersion: kibana.k8s.elastic.co/v1
kind: Kibana
metadata:
  name: kibana
  namespace: elk
spec:
  version: 8.9.1
  image: harbor.local.com/elk/kibana:8.9.1
  count: 1
  elasticsearchRef:
    name: elasticsearch
  config:
    xpack.fleet.agents.elasticsearch.hosts: ["https://elasticsearch-es-http.elk.svc:9200"]
    xpack.fleet.agents.fleet_server.hosts: ["https://fleet-server-agent-http.elk.svc:8220"]
    xpack.fleet.packages:
      - name: system
        version: latest
      - name: elastic_agent
        version: latest
      - name: fleet_server
        version: latest
      - name: elasticsearch
        version: latest
      - name: kubernetes
        version: latest
    xpack.fleet.agentPolicies:
      - name: Fleet Server on ECK policy
        id: eck-fleet-server
        namespace: elk
        monitoring_enabled:
          - logs
          - metrics
        unenroll_timeout: 900
        package_policies:
        - package:
            name: fleet_server
          name: fleet_server
      - name: Elastic Agent on ECK policy
        id: eck-agent
        namespace: elk
        monitoring_enabled:
          - logs
          - metrics
        unenroll_timeout: 900
        package_policies:
        - package:
            name: system
          name: system
        - package:
            name: elastic_agent
          name: elastic_agent
        - package:
            name: elasticsearch
          name: elasticsearch
        - package:
            name: kubernetes
          name: kubernetes
  podTemplate:
    spec:
      containers:
      - name: kibana
        env:
          - name: NODE_OPTIONS
            value: "--max-old-space-size=2048"
          - name: SERVER_PUBLICBASEURL
            value: "https://kibana.local.com"
          - name: I18N_LOCALE
            value: "zh-CN"
        resources:
          requests:
            memory: 1Gi
            cpu: 0.5
          limits:
            memory: 2Gi
            cpu: 2
```

# 部署资源并验证
## elasticsearch日志目录权限配置
由于elasticsearch容器运行用户为elasticsearch，uid为1000，<font style="color:rgb(48, 49, 51);">hostPath挂载后会出现权限不足的问题，需要提前修改宿主机目录权限。更多k8s安全上下文信息参考文档：</font>[<font style="color:rgb(48, 49, 51);">../06_Kubernetes/11-01_%E5%AE%89%E5%85%A8%E4%B8%8A%E4%B8%8B%E6%96%87.md</font>](articles/06-Kubernetes/11-01_安全上下文.md)

```bash
# mkdir /var/log/elasticsearch
# useradd -u 1000 elasticsearch
# chown elasticsearch:elasticsearch /var/log/elasticsearch
```

## 创建资源
```bash
[root@tiaoban fleet]# kubectl apply -f .
agent.agent.k8s.elastic.co/elastic-agent created
elasticsearch.elasticsearch.k8s.elastic.co/elasticsearch created
configmap/es-log4j2 created
agent.agent.k8s.elastic.co/fleet-server created
serverstransport.traefik.containo.us/elasticsearch-transport unchanged
ingressroute.traefik.containo.us/elasticsearch unchanged
serverstransport.traefik.containo.us/kibana-transport unchanged
ingressroute.traefik.containo.us/kibana unchanged
kibana.kibana.k8s.elastic.co/kibana created
persistentvolume/es-master-pv1 created
persistentvolume/es-master-pv2 created
persistentvolume/es-master-pv3 created
persistentvolume/es-hot-pv1 created
persistentvolume/es-hot-pv2 created
persistentvolume/es-warm-pv1 created
persistentvolume/es-warm-pv2 created
persistentvolume/es-cold-pv1 created
persistentvolumeclaim/elasticsearch-data-elasticsearch-es-master-0 created
persistentvolumeclaim/elasticsearch-data-elasticsearch-es-master-1 created
persistentvolumeclaim/elasticsearch-data-elasticsearch-es-master-2 created
persistentvolumeclaim/elasticsearch-data-elasticsearch-es-hot-0 created
persistentvolumeclaim/elasticsearch-data-elasticsearch-es-hot-1 created
persistentvolumeclaim/elasticsearch-data-elasticsearch-es-warm-0 created
persistentvolumeclaim/elasticsearch-data-elasticsearch-es-warm-1 created
persistentvolumeclaim/elasticsearch-data-elasticsearch-es-cold-0 created
clusterrole.rbac.authorization.k8s.io/fleet-server created
serviceaccount/fleet-server created
clusterrolebinding.rbac.authorization.k8s.io/fleet-server created
clusterrole.rbac.authorization.k8s.io/elastic-agent created
serviceaccount/elastic-agent created
clusterrolebinding.rbac.authorization.k8s.io/elastic-agent created
storageclass.storage.k8s.io/local-storage created
service/elasticsearch-nodeport created
service/kibana-nodeport created
```

## 查看资源信息
通过观察可知，pod创建顺序依次是elasticsearch和kibana，待服务正常后才会继续创建fleet-server资源，最后在每个节点创建elastic-agent资源

```bash
[root@tiaoban fleet]# kubectl get pod -n elk
NAME                                  READY   STATUS    RESTARTS   AGE
elastic-agent-agent-66hnd             1/1     Running   0          16s
elastic-agent-agent-b685g             1/1     Running   0          16s
elastic-agent-agent-jdxx9             1/1     Running   0          16s
elastic-agent-agent-m6stj             1/1     Running   0          16s
elastic-agent-agent-nlp2t             1/1     Running   0          16s
elastic-agent-agent-wxskg             1/1     Running   0          16s
elasticsearch-es-cold-0               1/1     Running   0          7m34s
elasticsearch-es-hot-0                1/1     Running   0          7m35s
elasticsearch-es-hot-1                1/1     Running   0          7m35s
elasticsearch-es-master-0             1/1     Running   0          7m35s
elasticsearch-es-master-1             1/1     Running   0          7m35s
elasticsearch-es-master-2             1/1     Running   0          7m35s
elasticsearch-es-warm-0               1/1     Running   0          7m34s
elasticsearch-es-warm-1               1/1     Running   0          7m34s
fleet-server-agent-65756b65f8-dmj5s   1/1     Running   0          94s
kibana-kb-5f4c67c676-mpt7d            1/1     Running   0          7m28s
[root@tiaoban fleet]# kubectl get elasticsearch -n elk
NAME            HEALTH   NODES   VERSION   PHASE   AGE
elasticsearch   green    8       8.9.1     Ready   8m5s
[root@tiaoban fleet]# kubectl get kibana -n elk
NAME     HEALTH   NODES   VERSION   AGE
kibana   green    1       8.9.1     8m13s
[root@tiaoban fleet]# kubectl get agent -n elk
NAME            HEALTH   AVAILABLE   EXPECTED   VERSION   AGE
elastic-agent   green    6           6          8.9.1     8m39s
fleet-server    green    1           1          8.9.1     8m39s
```

待所有资源都正常创建且状态为green后，访问kibana。

## 验证
查看fleet信息，发现fleet-server和elastic-agent均已正常运行。

![](assets/01-ELK-Stack/5bd29559ca6e75d3003a.png)

查看已安装的集成，已为我们默认安装了system、elastic_agent、fleet_server、elasticsearch、kubernetes这些集成资源。

![](assets/01-ELK-Stack/cc4278cb679d30408922.png)

# 集成策略配置
当我们发现集成某些集成策略虽然已安装，但是数据无法正常采集时，就需要修改默认的集成策略配置，重新配置采集的指标项和日志路径。

![](assets/01-ELK-Stack/c33ffdeef20511aff9bb.png)

配置完成后，我们点击资产标签即可查看为我们内置的各种dashboard和查询视图

![](assets/01-ELK-Stack/f13f73810c04f7748fdf.png)

## 系统日志
查看system集成配置可知系统日志默认采集的是/var/log/secure和/var/log/messages等日志内容，但RHEL8之后默认不安装<font style="color:rgb(48, 49, 51);">rsyslog服务，导致</font><font style="color:rgb(48, 49, 51);">/var/log/secure日志不存在，此时我们需要安装rsyslog服务并设置开机自启。</font>

```bash
dnf -y install rsyslog
systemctl enable rsyslog --now
```

接下来点击集成菜单的资产，查看kibana为我们内置的dashboard和discover

![](assets/01-ELK-Stack/6dd3436188030cf5a230.png)



![](assets/01-ELK-Stack/6fe5962e8f367b2b2718.png)

## elasticsearch指标日志
elasticsearch指标地址默认为http://127.0.0.1:9200，需要改为集群内的https地址，并指定账号密码和证书

![](assets/01-ELK-Stack/4ff1f59b66e37c0cb070.png)

elasticsearch日志查看：我们依次点击kibana的堆栈监测——>logs即可查看。

![](assets/01-ELK-Stack/8c373b2713ff0ddf8fb8.png)

elasticsearch指标查看，以ingest pipeline dashboard为例，内容如下：

![](assets/01-ELK-Stack/b3245be1bc8b50855fa7.png)

## kubernetes指标日志
kubernetes指标采集依赖kube-state-metrics组件，可单独部署metrics组件，参考文档：[../06_Kubernetes/03-13_%E9%83%A8%E7%BD%B2Metrics%E7%9B%91%E6%8E%A7%E7%BB%84%E4%BB%B6.md](articles/06-Kubernetes/03-13_部署Metrics监控组件.md)。也可以使用[kube-prometheus](https://github.com/prometheus-operator/kube-prometheus)部署，参考文档：[../06_Kubernetes/03-14_%E9%83%A8%E7%BD%B2Prometheus%E7%9B%91%E6%8E%A7.md](articles/06-Kubernetes/03-14_部署Prometheus监控.md)，部署后修改启动参数hots为0.0.0.0

```bash
spec:
  template:
    spec:
      containers:
      - args:
        - --host=0.0.0.0
        - --port=8081
```

将默认的metrics地址改为kube-state-metrics.<namespace>.svc格式端口为8081。

![](assets/01-ELK-Stack/271f5e8c70566cfe9b5c.png)

kubernetes日志

![](assets/01-ELK-Stack/bbdccb69a0954ce2cb96.png)

kubernetes指标

![](assets/01-ELK-Stack/78c7945c2b97222ffba3.png)

# 完整资源清单
本实验案例所有yaml文件已上传至git仓库。访问地址如下：

## github
[https://github.com/cuiliang0302/blog-demo](https://github.com/cuiliang0302/blog-demo)

## gitee
[https://gitee.com/cuiliang0302/blog_demo](https://gitee.com/cuiliang0302/blog_demo)

# 参考文档
在eck中部署fleet：[https://www.elastic.co/guide/en/cloud-on-k8s/current/k8s-elastic-agent-fleet.html](https://www.elastic.co/guide/en/cloud-on-k8s/current/k8s-elastic-agent-fleet.html)

log4j2配置：[https://www.elastic.co/guide/en/elasticsearch/reference/8.9/logging.html](https://www.elastic.co/guide/en/elasticsearch/reference/8.9/logging.html)

yaml配置fleet policy：[https://www.elastic.co/guide/en/kibana/current/fleet-settings-kb.html](https://www.elastic.co/guide/en/kibana/current/fleet-settings-kb.html)




