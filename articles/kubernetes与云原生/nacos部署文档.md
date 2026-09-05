> 部署在kubernetes中，以NFS作为数据存储卷

  

环境介绍：

<table class="lake-table" style="width: 720px;"><colgroup><col span="1" width="360" /><col span="1" width="360" /></colgroup><tbody><tr style="height: 33px;"><td>名称</td><td>版本</td></tr></tbody><tbody><tr style="height: 33px;"><td>K8S</td><td>v1.17.2</td></tr><tr style="height: 33px;"><td>Docker</td><td>19.03.5</td></tr><tr style="height: 33px;"><td colspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><p data-lake-id="fc06ea377ed3bb2f227b8d21f4771bce_p_0">nacos</p></td><td colspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><p data-lake-id="f5288918051daac58a0cdf74b1d666a8_p_0">1.3.0</p></td></tr></tbody></table>

  

## 一、拉取代码

  

```bash
git clone https://github.com/nacos-group/nacos-k8s.git
```

  

## 二、安装NFS服务

  

1、安装服务

  

```
yum install nfs-utils rpcbind -y
```

  

2、创建共享目录

  

```
mkdir /data/k8s -p
```

  

3、配置NFS配置文件

  

```
[root@master ~]# vim /etc/exports
/data/k8s *(rw,sync,no_root_squash)
```

  

配置详解：

```yaml
ro                    只读访问
rw                   读写访问
sync                所有数据在请求时写入共享
async              NFS在写入数据前可以相应请求
secure             NFS通过1024以下的安全TCP/IP端口发送
insecure          NFS通过1024以上的端口发送
wdelay            如果多个用户要写入NFS目录，则归组写入（默认）
no_wdelay      如果多个用户要写入NFS目录，则立即写入，当使用async时，无需此设置。
Hide                在NFS共享目录中不共享其子目录
no_hide           共享NFS目录的子目录
subtree_check   如果共享/usr/bin之类的子目录时，强制NFS检查父目录的权限（默认）
no_subtree_check   和上面相对，不检查父目录权限
all_squash               共享文件的UID和GID映射匿名用户anonymous，适合公用目录。
no_all_squash         保留共享文件的UID和GID（默认）
root_squash             root用户的所有请求映射成如anonymous用户一样的权限（默认）
no_root_squas         root用户具有根目录的完全管理访问权限
anonuid=xxx            指定NFS服务器/etc/passwd文件中匿名用户的UID
```

  

  

4、启动服务

  

先启动rpcbind，再启动nfs

  

```
systemctl start rpcbind && systemctl enable rpcbind
systemctl start nfs && systemctl enable nfs
```

  

5、客户端安装nfs和rpcbind测试

  

安装见第一步。

  

```
[root@node01 ~]# showmount -e 172.16.1.128
Export list for 172.16.1.128:
/data/k8s *
```

  

自此，NFS创建完成。

  

## 三、部署NFS provisioner

  

上面拉取完代码后，进入nacos-k8s/deploy/nfs，然后修改deployment.yaml中的NFS配置，如下：

  

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: nfs-client-provisioner
---
kind: Deployment
apiVersion: apps/v1
metadata:
  name: nfs-client-provisioner
spec:
  replicas: 1
  selector:
    matchLabels:
      app: nfs-client-provisioner
  strategy:
    type: Recreate
  template:
    metadata:
      labels:
        app: nfs-client-provisioner
    spec:
      serviceAccount: nfs-client-provisioner
      containers:
      - name: nfs-client-provisioner
        image: quay.io/external_storage/nfs-client-provisioner:latest
        volumeMounts:
        - name: nfs-client-root
          mountPath: /persistentvolumes
        env:
        - name: PROVISIONER_NAME
          value: fuseim.pri/ifs
        - name: NFS_SERVER
          value: 172.17.100.50
        - name: NFS_PATH
          value: /home/middleware/nacos/cluster_nacos
      volumes:
      - name: nfs-client-root
        nfs:
          server: 172.17.100.50
          path: /home/middleware/nacos/cluster_nacos
```

  

> 其中需要修改的地方：
> 
> 1、NFS\_SERVER：NFS Server地址
> 
> 2、NFS\_PATH：NFS地址
> 
> 3、PROVISIONER\_NAME：可选泽修改，默认也可以，如果修改，后面使用的时候就用修改后的名字。
> 
> 另外，由于我的集群版本是v1.17.2，所以Deployment的版本还有一些语法需要修改，如上。

  

然后创建即可：

  

```
kubectl apply -f .
```

  

## 四、部署数据库

  

数据库依然部署在集群中，这里只部署单节点模式。进入数据库部署目录nacos-k8s/deploy/mysql

先创建namespace

```yaml
kubectl create ns nacos
```

  

（1）、部署数据库，依然以NFS作为后端存储，修改配置文件

  

mysql-nfs.yaml的配置如下：

  

```yaml
apiVersion: apps/v1
kind: Deployment 
metadata:
  name: mysql
  namespace: nacos
  labels:
    name: mysql
spec:
  replicas: 1
  selector:
    matchLabels:
      name: mysql
  template:
    metadata:
      labels:
        name: mysql
    spec:
      containers:
      - name: mysql
        image: nacos/nacos-mysql:5.7
        ports:
        - containerPort: 3306
        volumeMounts:
        - name: mysql-data
          mountPath: /var/lib/mysql
        env:
        - name: MYSQL_ROOT_PASSWORD
          value: "root"
        - name: MYSQL_DATABASE
          value: "nacos"
        - name: MYSQL_USER
          value: "nacos"
        - name: MYSQL_PASSWORD
          value: "nacos"
      volumes:
      - name: mysql-data
        nfs:
          server: 10.1.10.130
          path: /data/k8s/nacos/mysql
---
apiVersion: v1
kind: Service
metadata:
  name: mysql
  namespace: nacos
  labels:
    name: mysql
spec:
  ports:
  - port: 3306
    targetPort: 3306
  selector:
    name: mysql
```

  

然后执行即可。

  

```
kubectl apply  -f mysql-nfs.yaml
```

  

> 如果是自有数据库，则需要自己创建数据库，然后导入数据表。表所在位置：[https://github.com/alibaba/nacos/blob/master/distribution/conf/nacos-mysql.sql](https://github.com/alibaba/nacos/blob/master/distribution/conf/nacos-mysql.sql)

  

## 五、部署nacos

  

进入nacos-k8s/deploy/nacos，修改nacos-pvc-nfs.yaml，主要修改DB连接这块，修改成自己的。

1.0.0版本：

  

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: nfs-client-provisioner
  namespace: nacos

---
apiVersion: v1
kind: Service
metadata:
  name: nacos-headless
  namespace: nacos
  labels:
    app: nacos
  annotations:
    service.alpha.kubernetes.io/tolerate-unready-endpoints: "true"
spec:
  ports:
    - port: 8848
      name: server
      targetPort: 8848
  clusterIP: None
  selector:
    app: nacos
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: nacos-cm
  namespace: nacos
data:
  mysql.master.db.name: "nacos"
  mysql.master.db.host: "mysql.nacos.svc.cluster.local"
  mysql.master.port: "3306"
  mysql.master.user: "nacos"
  mysql.master.password: "nacos"
  mysql.slave.db.host: "mysql.nacos.svc.cluster.local"
  mysql.slave.db.port: "3306"
---
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: nacos
  namespace: nacos
spec:
  serviceName: nacos
  replicas: 3
  template:
    metadata:
      labels:
        app: nacos
      annotations:
        pod.alpha.kubernetes.io/initialized: "true"
    spec:
     # affinity:
     #   podAntiAffinity:
     #     requiredDuringSchedulingIgnoredDuringExecution:
     #       - labelSelector:
     #           matchExpressions:
     #             - key: "app"
     #               operator: In
     #               values:
     #                 - nacos
     #         topologyKey: "kubernetes.io/hostname"
      serviceAccountName: nfs-client-provisioner
      initContainers:
        - name: peer-finder-plugin-install
          image: nacos/nacos-peer-finder-plugin:1.0
          imagePullPolicy: IfNotPresent 
          volumeMounts:
            - mountPath: "/home/nacos/plugins/peer-finder"
              name: plugindir
      containers:
        - name: nacos
          imagePullPolicy: IfNotPresent 
          image: swr.cn-north-1.myhuaweicloud.com/cartechfin/nacos:latest
          resources:
            requests:
              memory: "2Gi"
              cpu: "500m"
          ports:
            - containerPort: 8848
              name: client-port
          env:
            - name: NACOS_REPLICAS
              value: "3"
            - name: SERVICE_NAME
              value: "nacos"
            - name: DOMAIN_NAME
              value: "cluster.local"
            - name: MYSQL_SLAVE_SERVICE_HOST
              valueFrom:
                configMapKeyRef:
                  name: nacos-cm
                  key: mysql.slave.db.host
            - name: MYSQL_SLAVE_SERVICE_PORT
              valueFrom:
                configMapKeyRef:
                  name: nacos-cm
                  key: mysql.slave.db.port
            - name: POD_NAMESPACE
              valueFrom:
                fieldRef:
                  apiVersion: v1
                  fieldPath: metadata.namespace
            - name: MYSQL_MASTER_SERVICE_DB_NAME
              valueFrom:
                configMapKeyRef:
                  name: nacos-cm
                  key: mysql.master.db.name
            - name: MYSQL_MASTER_SERVICE_PORT
              valueFrom:
                configMapKeyRef:
                  name: nacos-cm
                  key: mysql.master.port
            - name: MYSQL_MASTER_SERVICE_USER
              valueFrom:
                configMapKeyRef:
                  name: nacos-cm
                  key: mysql.master.user
            - name: MYSQL_MASTER_SERVICE_PASSWORD
              valueFrom:
                configMapKeyRef:
                  name: nacos-cm
                  key: mysql.master.password
            - name: MYSQL_MASTER_SERVICE_HOST
              valueFrom:
                configMapKeyRef:
                  name: nacos-cm
                  key: mysql.master.db.host
            - name: NACOS_SERVER_PORT
              value: "8848"
            - name: PREFER_HOST_MODE
              value: "hostname"
          volumeMounts:
            - name: plugindir
              mountPath: /home/nacos/plugins/peer-finder
            - name: datadir
              mountPath: /home/nacos/data
            - name: logdir
              mountPath: /home/nacos/logs
  volumeClaimTemplates:
    - metadata:
        name: plugindir
        annotations:
          volume.beta.kubernetes.io/storage-class: "managed-nfs-storage"
      spec:
        accessModes: [ "ReadWriteMany" ]
        resources:
          requests:
            storage: 5Gi
    - metadata:
        name: datadir
        annotations:
          volume.beta.kubernetes.io/storage-class: "managed-nfs-storage"
      spec:
        accessModes: [ "ReadWriteMany" ]
        resources:
          requests:
            storage: 5Gi
    - metadata:
        name: logdir
        annotations:
          volume.beta.kubernetes.io/storage-class: "managed-nfs-storage"
      spec:
        accessModes: [ "ReadWriteMany" ]
        resources:
          requests:
            storage: 5Gi
  selector:
    matchLabels:
      app: nacos

```

  

1.3.0版本：

（1）、把配置文件挂载到configMap中，方便修改参数

nacos-conf.yaml

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: nacos-application-conf
  namespace: nacos
data:
  application.properties: |
      # spring
      server.servlet.contextPath=${SERVER_SERVLET_CONTEXTPATH:/nacos}
      server.contextPath=/nacos
      server.port=${NACOS_APPLICATION_PORT:8848}
      spring.datasource.platform=${SPRING_DATASOURCE_PLATFORM:""}
      nacos.cmdb.dumpTaskInterval=3600
      nacos.cmdb.eventTaskInterval=10
      nacos.cmdb.labelTaskInterval=300
      nacos.cmdb.loadDataAtStart=false
      db.num=${MYSQL_DATABASE_NUM:1}
      db.url.0=jdbc:mysql://${MYSQL_SERVICE_HOST}:${MYSQL_SERVICE_PORT:3306}/${MYSQL_SERVICE_DB_NAME}?characterEncoding=utf8&connectTimeout=1000&socketTimeout=3000&autoReconnect=true
      db.url.1=jdbc:mysql://${MYSQL_SERVICE_HOST}:${MYSQL_SERVICE_PORT:3306}/${MYSQL_SERVICE_DB_NAME}?characterEncoding=utf8&connectTimeout=1000&socketTimeout=3000&autoReconnect=true
      db.user=${MYSQL_SERVICE_USER}
      db.password=${MYSQL_SERVICE_PASSWORD}
      ### The auth system to use, currently only 'nacos' is supported:
      nacos.core.auth.system.type=${NACOS_AUTH_SYSTEM_TYPE:nacos}
      
      
      ### The token expiration in seconds:
      nacos.core.auth.default.token.expire.seconds=${NACOS_AUTH_TOKEN_EXPIRE_SECONDS:18000}
      
      ### The default token:
      nacos.core.auth.default.token.secret.key=${NACOS_AUTH_TOKEN:SecretKey012345678901234567890123456789012345678901234567890123456789}
      
      ### Turn on/off caching of auth information. By turning on this switch, the update of auth information would have a 15 seconds delay.
      nacos.core.auth.caching.enabled=${NACOS_AUTH_CACHE_ENABLE:false}
      
      server.tomcat.accesslog.enabled=${TOMCAT_ACCESSLOG_ENABLED:false}
      server.tomcat.accesslog.pattern=%h %l %u %t "%r" %s %b %D
      # default current work dir
      server.tomcat.basedir=
      ## spring security config
      ### turn off security
      nacos.security.ignore.urls=/,/error,/**/*.css,/**/*.js,/**/*.html,/**/*.map,/**/*.svg,/**/*.png,/**/*.ico,/console-fe/public/**,/v1/auth/**,/v1/console/health/**,/actuator/**,/v1/console/server/**
      # metrics for elastic search
      management.metrics.export.elastic.enabled=false
      management.metrics.export.influx.enabled=false
      
      nacos.naming.distro.taskDispatchThreadCount=10
      nacos.naming.distro.taskDispatchPeriod=200
      nacos.naming.distro.batchSyncKeyCount=1000
      nacos.naming.distro.initDataRatio=0.9
      nacos.naming.distro.syncRetryDelay=5000
      nacos.naming.data.warmup=true
```

修改deploy.yaml配置文件如下

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: nfs-client-provisioner
  namespace: nacos

---
apiVersion: v1
kind: Service
metadata:
  name: nacos
  namespace: nacos
  labels:
    app: nacos
  annotations:
    service.alpha.kubernetes.io/tolerate-unready-endpoints: "true"
spec:
  ports:
    - port: 8848
      name: server
      targetPort: 8848
  clusterIP: None
  selector:
    app: nacos
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: nacos-cm
  namespace: nacos
data:
  mysql.db.name: "nacos"
  mysql.db.host: "mysql.nacos.svc.cluster.local"
  mysql.port: "3306"
  mysql.user: "nacos"
  mysql.password: "nacos"
---
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: nacos
  namespace: nacos
spec:
  serviceName: nacos
  replicas: 3
  template:
    metadata:
      labels:
        app: nacos
      annotations:
        pod.alpha.kubernetes.io/initialized: "true"
    spec:
     # affinity:
     #   podAntiAffinity:
     #     requiredDuringSchedulingIgnoredDuringExecution:
     #       - labelSelector:
     #           matchExpressions:
     #             - key: "app"
     #               operator: In
     #               values:
     #                 - nacos
     #         topologyKey: "kubernetes.io/hostname"
      serviceAccountName: nfs-client-provisioner
      initContainers:
        - name: peer-finder-plugin-install
          image: nacos/nacos-peer-finder-plugin:1.0
          imagePullPolicy: IfNotPresent 
          volumeMounts:
            - mountPath: "/home/nacos/plugins/peer-finder"
              name: plugindir
      volumes:
      - name: application-conf
        configMap:
          name: nacos-application-conf
      containers:
        - name: nacos
          imagePullPolicy: IfNotPresent 
          image: nacos/nacos-server:1.3.0
          resources:
            requests:
              memory: "2Gi"
              cpu: "500m"
          ports:
            - containerPort: 8848
              name: client-port
          env:
            - name: NACOS_REPLICAS
              value: "3"
            - name: SERVICE_NAME
              value: "nacos"
            - name: DOMAIN_NAME
              value: "cluster.local"
            - name: POD_NAMESPACE
              valueFrom:
                fieldRef:
                  apiVersion: v1
                  fieldPath: metadata.namespace
            - name: MYSQL_SERVICE_DB_NAME
              valueFrom:
                configMapKeyRef:
                  name: nacos-cm
                  key: mysql.db.name
            - name: MYSQL_SERVICE_PORT
              valueFrom:
                configMapKeyRef:
                  name: nacos-cm
                  key: mysql.port
            - name: MYSQL_SERVICE_USER
              valueFrom:
                configMapKeyRef:
                  name: nacos-cm
                  key: mysql.user
            - name: MYSQL_SERVICE_PASSWORD
              valueFrom:
                configMapKeyRef:
                  name: nacos-cm
                  key: mysql.password
            - name: MYSQL_SERVICE_HOST
              valueFrom:
                configMapKeyRef:
                  name: nacos-cm
                  key: mysql.db.host
            - name: NACOS_SERVER_PORT
              value: "8848"
            - name: PREFER_HOST_MODE
              value: "hostname"
          volumeMounts:
            - name: plugindir
              mountPath: /home/nacos/plugins/peer-finder
            - name: datadir
              mountPath: /home/nacos/data
            - name: logdir
              mountPath: /home/nacos/logs
            - name: application-conf
              mountPath: /home/nacos/conf/application.properties
              subPath: application.properties
  volumeClaimTemplates:
    - metadata:
        name: plugindir
        annotations:
          volume.beta.kubernetes.io/storage-class: "managed-nfs-storage"
      spec:
        accessModes: [ "ReadWriteMany" ]
        resources:
          requests:
            storage: 5Gi
    - metadata:
        name: datadir
        annotations:
          volume.beta.kubernetes.io/storage-class: "managed-nfs-storage"
      spec:
        accessModes: [ "ReadWriteMany" ]
        resources:
          requests:
            storage: 5Gi
    - metadata:
        name: logdir
        annotations:
          volume.beta.kubernetes.io/storage-class: "managed-nfs-storage"
      spec:
        accessModes: [ "ReadWriteMany" ]
        resources:
          requests:
            storage: 5Gi
  selector:
    matchLabels:
      app: nacos
```

浏览器访问

  

```yaml
apiVersion: extensions/v1beta1
kind: Ingress
metadata:
  name: nacos
  namespace: nacos
spec:
  rules:
    - host: nacos.coolops.cn
      http:
        paths:
          - backend:
              serviceName: nacos
              servicePort: 8848
```

  

## 六、参数调优

（1）、JVM调优

集群模式默认的配置如下：

```yaml
  if [[ "${EMBEDDED_STORAGE}" == "embedded" ]]; then
        JAVA_OPT="${JAVA_OPT} -DembeddedStorage=true"
    fi
  JAVA_OPT="${JAVA_OPT} -server -Xms${JVM_XMS} -Xmx${JVM_XMX} -Xmn${JVM_XMN} -XX:MetaspaceSize=${JVM_MS} -XX:MaxMetaspaceSize=${JVM_MMS}"
  if [[ "${NACOS_DEBUG}" == "y" ]]; then
    JAVA_OPT="${JAVA_OPT} -Xdebug -Xrunjdwp:transport=dt_socket,address=9555,server=y,suspend=n"
  fi
  JAVA_OPT="${JAVA_OPT} -XX:-OmitStackTraceInFastThrow -XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=${BASE_DIR}/logs/java_heapdump.hprof"
  JAVA_OPT="${JAVA_OPT} -XX:-UseLargePages"
  print_servers

```

如果要更改内存大小，直接更新deployment的yaml文件，将上面的参数通过env的方式传递进去。

  

## 七、监控

  

使用Prometheus进行监控，首先打开server端metrics。如下修改configMap的配置文件：

  

```
     nacos.security.ignore.urls=/,/error,/**/*.css,/**/*.js,/**/*.html,/**/*.map,/**/*.svg,/**/*.png,/**/*.ico,/console-fe/public/**,/v1/auth/**,/v1/console/health/**,/v1/console/server/**
      # metrics for elastic search
      management.metrics.export.elastic.enabled=false
      management.metrics.export.influx.enabled=false
      management.endpoints.web.exposure.include=*
```

  

然后访问{ip}:8848/nacos/actuator/prometheus 查看是否能正确收集到指标：

  

  

需要监控的指标主要有：

<table class="lake-table" style="width: 720px;"><colgroup><col span="1" width="360" /><col span="1" width="360" /></colgroup><tbody><tr style="height: 33px;"><td>指标</td><td>含义</td></tr></tbody><tbody><tr style="height: 33px;"><td>system_cpu_usage</td><td>cpu的使用率</td></tr><tr style="height: 33px;"><td>jvm_memory_used_bytes</td><td>内存使用率</td></tr><tr style="height: 33px;"><td>system_load_average_1m</td><td>系统负载</td></tr><tr style="height: 33px;"><td>nacos_monitor{name='failedPush'}</td><td>Nacos naming推送失败数</td></tr><tr style="height: 33px;"><td>nacos_exception_total{name='db'}</td><td>数据库异常检查</td></tr><tr style="height: 33px;"><td>nacos_exception_total{name='configNotify'}</td><td>Nacos config水平通知失败</td></tr><tr style="height: 33px;"><td>nacos_exception_total{name='unhealth'}</td><td>集群健康检查</td></tr><tr style="height: 33px;"><td>nacos_exception_total{name='disk'}</td><td>读写磁盘异常检查</td></tr><tr style="height: 33px;"><td>nacos_exception_total{name='leaderSendBeatFailed'}</td><td>Nacos naming leader发送心跳异常</td></tr><tr style="height: 33px;"><td>nacos_exception_total{name='illegalArgument'}</td><td>请求参数不合法</td></tr><tr style="height: 33px;"><td>nacos_exception_total{name='nacos'}</td><td>Nacos请求响应内部错误异常（读写失败，没权限，参数错误）</td></tr><tr style="height: 33px;"><td>nacosSync_sync_task_error</td><td>所有同步执行时的异常检查</td></tr></tbody></table>

  

以上指标如果异常需要及时告警处理。