# Service(ExternalName)

> 分类：Kubernetes / 第7章：Service和Ingress
> 原文：https://www.cuiliangblog.cn/detail/section/94199959
> 来源：崔亮的博客

---

## 简介
1. <font style="color:rgb(18, 18, 18);">externalName Service是k8s中一个特殊的service类型，它不需要指定selector去选择哪些pods实例提供服务，而是使用DNS CNAME机制把自己CNAME到你指定的另外一个域名上，你可以提供集群内的名字，比如mysql.db.svc这样的建立在db命名空间内的mysql服务，也可以指定http://mysql.example.com这样的外部真实域名。</font>
2. 此种类型并非定义由Kubernetes集群提供的服务，而是把集群外部的某服务以DNS CNAME记录的方式映射到集群内，从而让集群内的Pod资源能够访问外部的Service的一种实现方式。
3. 这种类型的Service没有ClusterIP和NodePort，也没有标签选择器用于选择Pod资源，因此也不会有Endpoints存在。

![](assets/06-Kubernetes/938679c945e1ebfaafbe.png)

## 使用示例
### 访问跨名称空间的资源
处于 default 命名空间下的test访问到处于demo命名空间下的 nginx-svc，不像以往 svc-name.ns-name.svc.cluster.local 方式跨命名空间访问的方式，这里我们使用 ExternalName 方式。

创建demo名称空间下的资源

```yaml
[root@k8s-master demo]# cat myapp.yaml 
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
  namespace: demo
spec:
  selector:
    matchLabels:
      app: myapp
  template:
    metadata:
      labels:
        app: myapp
    spec:
      containers:
      - name: myapp
        image: ikubernetes/myapp:v1
        resources:
          limits:
            memory: "128Mi"
            cpu: "500m"
        ports:
        - containerPort: 80
---
apiVersion: v1
kind: Service
metadata:
  name: myapp
  namespace: demo
spec:
  type: ClusterIP
  selector:
    app: myapp
  ports:
  - port: 80
    targetPort: 80
[root@k8s-master demo]# kubectl apply -f myapp.yaml 
deployment.apps/myapp created
service/myapp created
[root@k8s-master demo]# kubectl get pod -n demo 
NAME                     READY   STATUS    RESTARTS   AGE
myapp-5b9945f68c-x65jr   1/1     Running   0          7s
[root@k8s-master demo]# kubectl get svc -n demo 
NAME    TYPE        CLUSTER-IP     EXTERNAL-IP   PORT(S)   AGE
myapp   ClusterIP   10.109.31.98   <none>        80/TCP    15s
```

default名称空间下的test访问myapp测试

```bash
[root@test /]# curl myapp.demo.svc.cluster.local
Hello MyApp | Version: v1 | <a href="hostname.html">Pod Name</a>
[root@test /]# nslookup myapp.demo.svc.cluster.local
Server:         10.96.0.10
Address:        10.96.0.10#53

Name:   myapp.demo.svc.cluster.local
Address: 10.109.31.98
```

接下来在default名称空间创建ExternalName资源，将demo名称空间的svc引入并设置为myapp-demo

```yaml
# cat external-name.yaml 
apiVersion: v1
kind: Service
metadata:
  name: myapp-demo
spec:
  type: ExternalName
  externalName: myapp.demo.svc.cluster.local
  ports:
    - name: http
      port: 80
      targetPort: 80
[root@k8s-master demo]# kubectl get svc
NAME             TYPE           CLUSTER-IP      EXTERNAL-IP                    PORT(S)    AGE
myapp-demo       ExternalName   <none>          myapp.demo.svc.cluster.local   80/TCP     5m24s
```

default名称空间下的test访问myapp-demo 测试

```yaml
[root@test /]# curl myapp-demo
Hello MyApp | Version: v1 | <a href="hostname.html">Pod Name</a>
[root@test /]# nslookup myapp-demo
Server:         10.96.0.10
Address:        10.96.0.10#53

myapp-demo.default.svc.cluster.local    canonical name = myapp.demo.svc.cluster.local.
Name:   myapp.demo.svc.cluster.local
Address: 10.109.31.98
```

ExternalName的作用就相当于创建了一个链接，将其他名称空间下的资源映射为本名称空间下的资源，方便调用。

### 访问集群外部资源
假设我们购买了一个阿里云数据库，他的公网连接地址为rm-bp1xijh19ovdcrbqaro.mysql.rds.aliyuncs.com，后期这个地址可能会变化，我们就可以将数据库地址创建为ExternalName资源，后期更换地址时只需要更新ExternalName配置即可。

创建ExternalName资源，将阿里云数据库地址设置为mysql-aliyun

```yaml
[root@k8s-master demo]# cat external-name.yaml 
apiVersion: v1
kind: Service
metadata:
  name: mysql-aliyun
spec:
  type: ExternalName
  externalName: rm-bp1xijh19ovdcrbqaro.mysql.rds.aliyuncs.com
  ports:
    - name: mysql
      port: 3306
      targetPort: 3306
[root@k8s-master demo]# kubectl get svc 
NAME             TYPE           CLUSTER-IP      EXTERNAL-IP
mysql-aliyun     ExternalName   <none>          rm-bp1xijh19ovdcrbqaro.mysql.rds.aliyuncs.com   3306/TCP   23m
```

test资源使用ExternalName连接数据库

```yaml
[root@k8s-master demo]# kubectl exec -it test -- bash
[root@test /]# nslookup mysql-aliyun
Server:         10.96.0.10
Address:        10.96.0.10#53

mysql-aliyun.default.svc.cluster.local  canonical name = rm-bp1xijh19ovdcrbqaro.mysql.rds.aliyuncs.com.
Name:   rm-bp1xijh19ovdcrbqaro.mysql.rds.aliyuncs.com
Address: 47.111.211.100

[root@test /]# mysql -h mysql-aliyun -u cuiliang -p
Enter password: 
Welcome to the MySQL monitor.  Commands end with ; or \g.
Your MySQL connection id is 58346
Server version: 8.0.25 Source distribution

Copyright (c) 2000, 2021, Oracle and/or its affiliates.

Oracle is a registered trademark of Oracle Corporation and/or its
affiliates. Other names may be trademarks of their respective
owners.

Type 'help;' or '\h' for help. Type '\c' to clear the current input statement.

mysql> 
```



[  
](https://blog.51cto.com/u_14625168/2497366)


