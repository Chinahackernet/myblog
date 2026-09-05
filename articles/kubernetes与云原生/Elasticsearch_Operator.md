ElasticsearchCloudOnKubernetes是一个 Elasticsearch Operator，但远不止于此。ECK 使用 Kubernetes Operator 模式构建而成，需要安装在您的 Kubernetes 集群内，其功能绝不仅限于简化 Kubernetes 上 Elasticsearch 和 Kibana 的部署工作这一项任务。ECK 专注于简化所有后期运行工作，例如：

-   管理和监测多个集群
-   轻松升级至新的版本
-   扩大或缩小集群容量
-   更改集群配置
-   动态调整本地存储的规模（包括 Elastic Local Volume（一款本地存储驱动器））
-   备份

Github地址：[https://github.com/elastic/cloud-on-k8s](https://github.com/elastic/cloud-on-k8s)

  

# 安装

## 部署elastic

如果kubernets集群版本在1.13及其以上，用如下命令：

```yaml
kubectl apply -f https://download.elastic.co/downloads/eck/1.0.0-beta1/all-in-one.yaml
```

  

如果kubernetes集群版本在1.12及其以下，用如下命令：

```yaml
kubectl apply -f https://download.elastic.co/downloads/eck/1.0.0-beta1/all-in-one-no-validation.yaml
```

  

执行成功后会创建一个namespace（elastic-system）和一个Operator（elastic-operator）：

```yaml
# kubectl get pod -n elastic-system 
NAME                 READY   STATUS             RESTARTS   AGE
elastic-operator-0   0/1     ImagePullBackOff   0          60s
```

  

并且其会创建几个CRD对象：

```yaml
# kubectl get crd
NAME                                           CREATED AT
apmservers.apm.k8s.elastic.co                  2019-11-20T01:29:08Z
elasticsearches.elasticsearch.k8s.elastic.co   2019-11-20T01:29:11Z
kibanas.kibana.k8s.elastic.co                  2019-11-20T01:29:12Z
```

  

通过如下命令来获取operator日志：

```yaml
kubectl -n elastic-system logs -f statefulset.apps/elastic-operator
```

  

然后我们创建一个简单的Elasticsearch集群：

simple-elstic.yaml

```yaml
apiVersion: elasticsearch.k8s.elastic.co/v1beta1
kind: Elasticsearch
metadata:
  name: quickstart
spec:
  version: 7.4.2
  nodeSets:
  - name: default
    count: 1
    config:
      node.master: true
      node.data: true
      node.ingest: true
      node.store.allow_mmap: false
```

  

然后创建这个YAML文件：

```yaml
# kubectl apply -f simple-elastic.yaml
```

  

创建的Elasticsearch集群有如下几个字段：

```yaml
# kubectl get elasticsearch
NAME          HEALTH    NODES     VERSION   PHASE         AGE
quickstart    green     1         7.4.2     Ready         1m
```

注意：在集群刚启动的时候PHASE和HEALTH状态都没有，只有等PHASE状态变为Ready，HEALTH才会变为green。

  

我们查看Pod状态：

```yaml
# kubectl get pods --selector='elasticsearch.k8s.elastic.co/cluster-name=quickstart'
NAME                      READY   STATUS    RESTARTS   AGE
quickstart-es-default-0   1/1     Running   0          79s
```

  

当创建完集群后，集群会自动创建一个Service：

```yaml
# kubectl get service quickstart-es-http
NAME                 TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)    AGE
quickstart-es-http   ClusterIP   10.15.251.145   <none>        9200/TCP   34m
```

并且会创建一个认证用户elastic，它的密码存储在secret里：

```yaml
PASSWORD=$(kubectl get secret quickstart-es-elastic-user -o=jsonpath='{.data.elastic}' | base64 --decode)
```

  

## 部署kibana

YAML文件如下：

simple-kibana.yaml

```yaml
apiVersion: kibana.k8s.elastic.co/v1beta1
kind: Kibana
metadata:
  name: quickstart
spec:
  version: 7.4.2
  count: 1
  elasticsearchRef:
    name: quickstart
```

其依然会自动创建一个Service，用户还是上面创建的elastic。

```yaml
# kubectl get service quickstart-kb-http
```

  

# 更新升级

## 增加节点

我们上面部署的简单集群是单节点的，如果要增加节点，只需更新count的数量，如下：

```yaml
apiVersion: elasticsearch.k8s.elastic.co/v1beta1
kind: Elasticsearch
metadata:
  name: quickstart
spec:
  version: 7.4.2
  nodeSets:
  - name: default
    count: 3
    config:
      node.master: true
      node.data: true
      node.ingest: true
      node.store.allow_mmap: false
```

  

## 持久化存储

我们上面定义的简单的集群，使用的默认存储，只有1GiB，我们可以自定义存储，如下：

```yaml
spec:
  nodeSets:
  - name: default
    count: 3
    volumeClaimTemplates:
    - metadata:
        name: elasticsearch-data
      spec:
        accessModes:
        - ReadWriteOnce
        resources:
          requests:
            storage: 5Gi
        storageClassName: standard
```

当然，storageClass需要我们自己定义好。

  

## 增加运行内存和CPU

默认的内存大小为2GiB，如过不够可以引用podTemplate模板进行扩充，如下：

```yaml
spec:
  nodeSets:
  - podTemplate:
      spec:
        containers:
        - name: elasticsearch
          env:
          - name: ES_JAVA_OPTS
            value: -Xms2g -Xmx2g
          resources:
            requests:
              memory: 4Gi
              cpu: 0.5
            limits:
              memory: 4Gi
              cpu: 2
```