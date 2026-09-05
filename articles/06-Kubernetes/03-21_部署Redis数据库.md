# 部署Redis数据库

> 分类：Kubernetes / 第3章：周边组件安装部署
> 原文：https://www.cuiliangblog.cn/detail/section/190364765
> 来源：崔亮的博客

---

# 安装Redis(集群模式)
Redis 集群模式是一种 分布式 Redis 方案，通过 分片（sharding） 把数据分布到多个节点上，同时支持 副本复制（replication） 和 故障转移（failover）。集群模式最少需要 6 节点(3 主 3 从)  ，每个主负责一部分数据。

部署配置参考文档：[https://github.com/bitnami/charts/tree/main/bitnami/redis-cluster](https://github.com/bitnami/charts/tree/main/bitnami/redis-cluster)

## 获取配置
```bash
# 添加repo
[root@k8s-master ~]# helm repo add bitnami https://charts.bitnami.com/bitnami
# 更新repo仓库资源
[root@k8s-master ~]# helm repo update
# 拉取helm包
[root@k8s-master ~]# helm pull bitnami/redis-cluster --untar
# 修改配置
[root@k8s-master ~]# cd redis-cluster/
[root@k8s-master redis-cluster]# vim values.yaml 
global:
  storageClass: "nfs-client"
  redis:
    password: "password"
persistence:
  size: 10Gi # 节点存储空间
cluster:
  init: true 
  nodes: 6 # nodes：是包括副本在内的节点总数。这意味着将有 3 个主节点和 3 个副本节点
  replicas: 1 # 每个主节点1副本
metrics:
  enabled: true # 启用prometheus监控
```

## 安装
```bash
[root@k8s-master redis-cluster]# helm install redis -n redis . -f values.yaml --create-namespace         
NAME: redis
LAST DEPLOYED: Tue Sep 23 20:57:32 2025
NAMESPACE: redis
STATUS: deployed
REVISION: 1
TEST SUITE: None
NOTES:
CHART NAME: redis-cluster
CHART VERSION: 13.0.4
APP VERSION: 8.2.1

⚠ WARNING: Since August 28th, 2025, only a limited subset of images/charts are available for free.
    Subscribe to Bitnami Secure Images to receive continued support and security updates.
    More info at https://bitnami.com and https://github.com/bitnami/containers/issues/83267

** Please be patient while the chart is being deployed **


To get your password run:
    export REDIS_PASSWORD=$(kubectl get secret --namespace "redis" redis-redis-cluster -o jsonpath="{.data.redis-password}" | base64 -d)

You have deployed a Redis&reg; Cluster accessible only from within you Kubernetes Cluster.
INFO: The Job to create the cluster will be created.

To connect to your Redis&reg; cluster:

1. Run a Redis&reg; pod that you can use as a client:
kubectl run --namespace redis redis-redis-cluster-client --rm --tty -i --restart='Never' \
 --env REDIS_PASSWORD=$REDIS_PASSWORD \
--image docker.io/bitnami/redis-cluster:8.2.1-debian-12-r0 -- bash

2. Connect using the Redis&reg; CLI:

redis-cli -c -h redis-redis-cluster -a $REDIS_PASSWORD



WARNING: There are "resources" sections in the chart not set. Using "resourcesPreset" is not recommended for production. For production installations, please set the following values according to your workload needs:
  - metrics.resources
  - redis.resources
  - updateJob.resources
+info https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/
```

## 验证
```bash
# kubectl get pod -n redis          
NAME                            READY   STATUS    RESTARTS    AGE
redis-redis-cluster-0           1/1     Running   0           3m
redis-redis-cluster-1           1/1     Running   0           3m
redis-redis-cluster-2           1/1     Running   0           3m
redis-redis-cluster-3           1/1     Running   0           3m
redis-redis-cluster-4           1/1     Running   0           3m
redis-redis-cluster-5           1/1     Running   0           3m
# kubectl get svc -n redis          
NAME                           TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)              AGE
redis-redis-cluster            ClusterIP   10.108.21.222    <none>        6379/TCP             4m51s
redis-redis-cluster-headless   ClusterIP   None             <none>        6379/TCP,16379/TCP   4m51s
redis-redis-cluster-metrics    ClusterIP   10.103.240.105   <none>        9121/TCP             4m51s
# kubectl exec -it -n redis redis-redis-cluster-0 -c redis-redis-cluster -- bash
I have no name!@redis-redis-cluster-0:/$ redis-cli -c -h redis-redis-cluster.redis.svc -p 6379 -a password
Warning: Using a password with '-a' or '-u' option on the command line interface may not be safe.
redis-redis-cluster.redis.svc:6379> CLUSTER NODES
d95007fee1cd84a889d88e20a48e81d84a971c9c 10.244.3.138:6379@16379 slave 83043b84b8e1744e179be76727f79ae493e35d7a 0 1758632644000 3 connected
83043b84b8e1744e179be76727f79ae493e35d7a 10.244.3.137:6379@16379 master - 0 1758632643844 3 connected 10923-16383
96937174e9380f01256747cbd2c33f57a57cd41c 10.244.2.219:6379@16379 slave a62d88f874705722df86a7594dbe899f31e87c05 0 1758632644000 2 connected
a62d88f874705722df86a7594dbe899f31e87c05 10.244.0.159:6379@16379 myself,master - 0 0 2 connected 5461-10922
6401e137724b03f0f64dfb1074391fcffd793c22 10.244.1.138:6379@16379 slave d8096c92e779850394eb0f2f0089b0daccd371d3 0 1758632643000 1 connected
d8096c92e779850394eb0f2f0089b0daccd371d3 10.244.1.137:6379@16379 master - 0 1758632644852 1 connected 0-5460
redis-redis-cluster.redis.svc:6379> CLUSTER INFO
cluster_state:ok
cluster_slots_assigned:16384
cluster_slots_ok:16384
cluster_slots_pfail:0
cluster_slots_fail:0
cluster_known_nodes:6
cluster_size:3
cluster_current_epoch:6
cluster_my_epoch:2
cluster_stats_messages_ping_sent:115
cluster_stats_messages_pong_sent:126
cluster_stats_messages_sent:241
cluster_stats_messages_ping_received:126
cluster_stats_messages_pong_received:115
cluster_stats_messages_received:241
total_cluster_links_buffer_limit_exceeded:0
```

# 安装 Redis(哨兵模式)
Redis 哨兵模式通过部署 Sentinel 进程 来实时监控主节点状态，当主节点故障时自动将从节点提升为新主节点，并通知客户端更新连接，从而实现 高可用性和自动故障转移，但整体仍是 单主架构，不具备分片与水平扩展能力，哨兵模式最少需要 3 个节点。

部署配置参考文档：[https://github.com/bitnami/charts/tree/main/bitnami/redis](https://github.com/bitnami/charts/tree/main/bitnami/redis)

## 获取配置
```bash
# 添加repo
[root@k8s-master ~]# helm repo add bitnami https://charts.bitnami.com/bitnami
# 更新repo仓库资源
[root@k8s-master ~]# helm repo update
# 拉取helm包
[root@k8s-master ~]# helm pull bitnami/redis --untar
# 修改配置
[root@k8s-master ~]# cd redis/
[root@k8s-master redis-cluster]# vim values.yaml 
global:
  storageClass: "nfs-client"
  redis:
    password: "password"
master:
  persistence:
    size: 10Gi # 节点存储空间
replica:
  replicaCount: 3 # 节点数
  persistence:
    size: 10Gi # 节点存储空间
sentinel:
  enabled: true # 开启哨兵模式
metrics:
  enabled: true # 启用prometheus监控
```

## 安装
```bash
[root@k8s-master redis-cluster]# helm install redis -n redis . -f values.yaml --create-namespace         
NAME: redis
LAST DEPLOYED: Tue Sep 23 22:09:43 2025
NAMESPACE: redis
STATUS: deployed
REVISION: 1
TEST SUITE: None
NOTES:
CHART NAME: redis
CHART VERSION: 22.0.7
APP VERSION: 8.2.1

⚠ WARNING: Since August 28th, 2025, only a limited subset of images/charts are available for free.
    Subscribe to Bitnami Secure Images to receive continued support and security updates.
    More info at https://bitnami.com and https://github.com/bitnami/containers/issues/83267

** Please be patient while the chart is being deployed **

Redis&reg; can be accessed via port 6379 on the following DNS name from within your cluster:

    redis.redis.svc.cluster.local for read only operations

For read/write operations, first access the Redis&reg; Sentinel cluster, which is available in port 26379 using the same domain name above.



To get your password run:

    export REDIS_PASSWORD=$(kubectl get secret --namespace redis redis -o jsonpath="{.data.redis-password}" | base64 -d)

To connect to your Redis&reg; server:

1. Run a Redis&reg; pod that you can use as a client:

   kubectl run --namespace redis redis-client --restart='Never'  --env REDIS_PASSWORD=$REDIS_PASSWORD  --image docker.io/bitnami/redis:8.2.1-debian-12-r0 --command -- sleep infinity

   Use the following command to attach to the pod:

   kubectl exec --tty -i redis-client \
   --namespace redis -- bash

2. Connect using the Redis&reg; CLI:
   REDISCLI_AUTH="$REDIS_PASSWORD" redis-cli -h redis -p 6379 # Read only operations
   REDISCLI_AUTH="$REDIS_PASSWORD" redis-cli -h redis -p 26379 # Sentinel access

To connect to your database from outside the cluster execute the following commands:

    kubectl port-forward --namespace redis svc/redis 6379:6379 &
    REDISCLI_AUTH="$REDIS_PASSWORD" redis-cli -h 127.0.0.1 -p 6379

WARNING: There are "resources" sections in the chart not set. Using "resourcesPreset" is not recommended for production. For production installations, please set the following values according to your workload needs:
  - metrics.resources
  - replica.resources
  - sentinel.resources
+info https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/
```

## 验证
```bash
# kubectl get pod -n redis        
NAME           READY   STATUS    RESTARTS   AGE
redis-node-0   3/3     Running   0          86s
redis-node-1   3/3     Running   0          65s
redis-node-2   3/3     Running   0          42s
# kubectl get svc -n redis
NAME             TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)              AGE
redis            ClusterIP   10.96.187.151   <none>        6379/TCP,26379/TCP   100s
redis-headless   ClusterIP   None            <none>        6379/TCP,26379/TCP   100s
redis-metrics    ClusterIP   10.100.46.68    <none>        9121/TCP             100s          4m51s
# kubectl exec -it -n redis redis-node-0 -c redis -- bash

# 需要注意的是node0节点为master可读写节点
I have no name!@redis-node-0:/$ redis-cli -h redis-node-0.redis-headless.redis.svc.cluster.local -p 6379 -a password
Warning: Using a password with '-a' or '-u' option on the command line interface may not be safe.
redis.redis.svc:6379> INFO replication
# Replication
role:slave
master_host:redis-node-0.redis-headless.redis.svc.cluster.local
master_port:6379
master_link_status:up
master_last_io_seconds_ago:0
master_sync_in_progress:0
slave_read_repl_offset:55237
slave_repl_offset:55237
replica_full_sync_buffer_size:0
replica_full_sync_buffer_peak:0
master_current_sync_attempts:1
master_total_sync_attempts:1
master_link_up_since_seconds:152
total_disconnect_time_sec:0
slave_priority:100
slave_read_only:1
replica_announced:1
connected_slaves:0
master_failover_state:no-failover
master_replid:b8eb7c0aa072b0acfaa9bafe233ed5a4a1e44699
master_replid2:0000000000000000000000000000000000000000
master_repl_offset:55237
second_repl_offset:-1
repl_backlog_active:1
repl_backlog_size:1048576
repl_backlog_first_byte_offset:6165
repl_backlog_histlen:49073
# 查看集群其他哨兵节点信息
redis.redis.svc:26379> SENTINEL sentinels mymaster
1)  1) "name"
    2) "2a09ba7abbb41ee71e79087310d75f9809c3c815"
    3) "ip"
    4) "redis-node-0.redis-headless.redis.svc.cluster.local"
    5) "port"
    6) "26379"
    7) "runid"
    8) "2a09ba7abbb41ee71e79087310d75f9809c3c815"
    9) "flags"
   10) "sentinel"
   11) "link-pending-commands"
   12) "0"
   13) "link-refcount"
   14) "1"
   15) "last-ping-sent"
   16) "0"
   17) "last-ok-ping-reply"
   18) "656"
   19) "last-ping-reply"
   20) "656"
   21) "down-after-milliseconds"
   22) "60000"
   23) "last-hello-message"
   24) "448"
   25) "voted-leader"
   26) "?"
   27) "voted-leader-epoch"
   28) "0"
2)  1) "name"
    2) "33535e4e17bf8f9f9ff9ce8f9ddf609e558ff4f2"
    3) "ip"
    4) "redis-node-1.redis-headless.redis.svc.cluster.local"
    5) "port"
    6) "26379"
    7) "runid"
    8) "33535e4e17bf8f9f9ff9ce8f9ddf609e558ff4f2"
    9) "flags"
   10) "sentinel"
   11) "link-pending-commands"
   12) "0"
   13) "link-refcount"
   14) "1"
   15) "last-ping-sent"
   16) "0"
   17) "last-ok-ping-reply"
   18) "656"
   19) "last-ping-reply"
   20) "656"
   21) "down-after-milliseconds"
   22) "60000"
   23) "last-hello-message"
   24) "1011"
   25) "voted-leader"
   26) "?"
   27) "voted-leader-epoch"
   28) "0"
```

# 安装 Redis(主从模式)
 Redis 主从模式就是一个主节点负责写，从节点同步主节点数据、提供只读服务，实现数据冗余和读写分离的架构。  最少需要 2 节点即可实现。

## 获取配置
与哨兵模式使用一个 charts，只是配置文件略有不同。

```bash
vim values.yaml 
global:
  storageClass: "nfs-client"
  redis:
    password: "password"
master:
  persistence:
    size: 10Gi # 节点存储空间
replica:
  replicaCount: 1 # 从节点副本数
  persistence:
    size: 10Gi # 节点存储空间
sentinel:
  enabled: false # 禁用哨兵模式
metrics:
  enabled: true # 启用prometheus监控
```

## 安装
```bash
# helm install redis -n redis . -f values.yaml --create-namespace
NAME: redis
LAST DEPLOYED: Tue Sep 23 22:41:35 2025
NAMESPACE: redis
STATUS: deployed
REVISION: 1
TEST SUITE: None
NOTES:
CHART NAME: redis
CHART VERSION: 22.0.7
APP VERSION: 8.2.1

⚠ WARNING: Since August 28th, 2025, only a limited subset of images/charts are available for free.
    Subscribe to Bitnami Secure Images to receive continued support and security updates.
    More info at https://bitnami.com and https://github.com/bitnami/containers/issues/83267

** Please be patient while the chart is being deployed **

Redis&reg; can be accessed on the following DNS names from within your cluster:

    redis-master.redis.svc.cluster.local for read/write operations (port 6379)
    redis-replicas.redis.svc.cluster.local for read-only operations (port 6379)



To get your password run:

    export REDIS_PASSWORD=$(kubectl get secret --namespace redis redis -o jsonpath="{.data.redis-password}" | base64 -d)

To connect to your Redis&reg; server:

1. Run a Redis&reg; pod that you can use as a client:

   kubectl run --namespace redis redis-client --restart='Never'  --env REDIS_PASSWORD=$REDIS_PASSWORD  --image docker.io/bitnami/redis:8.2.1-debian-12-r0 --command -- sleep infinity

   Use the following command to attach to the pod:

   kubectl exec --tty -i redis-client \
   --namespace redis -- bash

2. Connect using the Redis&reg; CLI:
   REDISCLI_AUTH="$REDIS_PASSWORD" redis-cli -h redis-master
   REDISCLI_AUTH="$REDIS_PASSWORD" redis-cli -h redis-replicas

To connect to your database from outside the cluster execute the following commands:

    kubectl port-forward --namespace redis svc/redis-master 6379:6379 &
    REDISCLI_AUTH="$REDIS_PASSWORD" redis-cli -h 127.0.0.1 -p 6379

WARNING: There are "resources" sections in the chart not set. Using "resourcesPreset" is not recommended for production. For production installations, please set the following values according to your workload needs:
  - metrics.resources
  - replica.resources
  - master.resources
+info https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/
```

## 验证
```bash
# kubectl get pod -n redis
NAME                            READY   STATUS              RESTARTS   AGE
redis-master-0                  2/2     Running             0          35s
redis-replicas-0                2/2     Running             0          35s
# kubectl get svc -n redis
NAME             TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)    AGE
redis-headless   ClusterIP   None            <none>        6379/TCP   56s
redis-master     ClusterIP   10.110.77.165   <none>        6379/TCP   56s
redis-metrics    ClusterIP   10.108.21.223   <none>        9121/TCP   56s
redis-replicas   ClusterIP   10.104.30.125   <none>        6379/TCP   56s
# kubectl exec -it -n redis redis-master-0 -c redis -- bash
I have no name!@redis-master-0:/$ redis-cli -h redis-master.redis.svc -p 6379 -a password
Warning: Using a password with '-a' or '-u' option on the command line interface may not be safe.
redis-master.redis.svc:6379> INFO replication
# Replication
role:master
connected_slaves:1
slave0:ip=redis-replicas-0.redis-headless.redis.svc.cluster.local,port=6379,state=online,offset=210,lag=1
master_failover_state:no-failover
master_replid:d4cc41efb0d7e6f35a594001903dabc27aa7d5ce
master_replid2:0000000000000000000000000000000000000000
master_repl_offset:210
second_repl_offset:-1
repl_backlog_active:1
repl_backlog_size:1048576
repl_backlog_first_byte_offset:1
repl_backlog_histlen:210
```

# 部署redisinsight服务
## 创建资源
```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: redisinsight-pvc
  namespace: redis
  labels:
    app: redisinsight  
spec:
  storageClassName: nfs
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 500Mi
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: redisinsight
  namespace: redis
  labels:
    app: redisinsight
spec:
  replicas: 1
  selector:
    matchLabels:
      app: redisinsight
  template:
    metadata:
      labels:
        app: redisinsight
    spec:
      containers:
      - name:  redisinsight
        image: redislabs/redisinsight:latest
        imagePullPolicy: IfNotPresent
        securityContext:
          runAsUser: 0
        volumeMounts:
        - name: db
          mountPath: /db
        ports:
        - containerPort: 5540
          protocol: TCP
        resources:
          limits:
            memory: "1Gi"
            cpu: "500m"
      volumes:
      - name: db
        persistentVolumeClaim:
          claimName: redisinsight-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: redisinsight
  namespace: redis
spec:
  selector:
    app: redisinsight
  ports:
  - port: 5540
    targetPort: 5540
---
apiVersion: traefik.io/v1alpha1
kind: IngressRoute
metadata:
  name: redis
  namespace: redis
spec:
  entryPoints:
    - web
  routes:
    - match: Host(`redisinsight.cuiliangblog.cn`)
      kind: Rule
      services:
        - name: redisinsight
          port: 5540
```

## 访问验证
添加域名解析后访问验证

![](assets/06-Kubernetes/8ba1d49e863a9d578bf0.png)


