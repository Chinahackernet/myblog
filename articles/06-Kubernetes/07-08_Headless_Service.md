# Headless Service

> 分类：Kubernetes / 第7章：Service和Ingress
> 原文：https://www.cuiliangblog.cn/detail/section/15276111
> 来源：崔亮的博客

---

## 概述
Headless Services是一种特殊的service，其spec:clusterIP表示为None，这样在实际运行时就不会被分配ClusterIP。也被称为无头服务。

## 区别
### Service的区别
Headless不分配clusterIP

Headless service可以通过解析service的DNS，返回所有Pod的地址和DNS(statefulSet部署的Pod才有DNS)

普通的service，只能通过解析service的DNS返回service的ClusterIP

### 控制器的区别
statefulSet下的Pod有DNS地址,通过解析Pod的DNS可以返回Pod的IP

deployment下的Pod没有DNS

### <font style="color:rgb(77, 77, 77);">解析结果区别</font>
ClusterIP：一个service对应一组endpoints(所有pod的地址+端口)，客户端使用DNS查询时只会返回Service的ClusterIP地址,具体Client访问的是哪个real server,由iptables或者ipvs决定

```yaml
[root@k8s-master demo]# cat myapp.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
spec:
  replicas: 3
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
spec:
  type: ClusterIP
  selector:
    app: myapp
  ports:
  - port: 80
    targetPort: 80
[root@k8s-master demo]# kubectl get svc
NAME             TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)    AGE
myapp            ClusterIP   10.108.21.3     <none>        80/TCP     5s
[root@k8s-master demo]# kubectl exec -it test -- bash
[root@test /]# nslookup myapp
Server:         10.96.0.10
Address:        10.96.0.10#53

Name:   myapp.default.svc.cluster.local
Address: 10.108.21.3
```

Headless service：客户端可以通过dns查询返回多个endpoint，也就是多个pod地址和DNS，解析pod的DNS也能返回Pod的IP，注意使用headless和StatefulSet搭配使用

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: mystatefulset
spec:
  selector:
    matchLabels:
      app: myapp-headless
  serviceName: myapp-headless
  replicas: 2
  template:
    metadata:
      labels:
        app: myapp-headless
    spec:
      containers:
      - name: myapp
        image: ikubernetes/myapp:v2
        ports:
        - containerPort: 80
          name: web
---
apiVersion: v1
kind: Service
metadata:
  name: myapp-headless
spec:
  clusterIP: None
  selector:
    app: myapp-headless
  ports:
  - port: 80
[root@k8s-master demo]# kubectl get pod -o wide
NAME                                          READY   STATUS    RESTARTS   AGE     IP              NODE         NOMINATED NODE   READINESS GATES
mystatefulset-0                               1/1     Running   0          103s    10.244.2.61     k8s-work2    <none>           <none>
mystatefulset-1                               1/1     Running   0          100s    10.244.2.62     k8s-work2    <none>           <none>
[root@k8s-master demo]# kubectl get svc
NAME             TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)    AGE
myapp-headless   ClusterIP   None            <none>        80/TCP     23h
[root@k8s-master demo]# kubectl exec -it test -- bash
[root@test /]# nslookup myapp-headless
Server:         10.96.0.10
Address:        10.96.0.10#53

Name:   myapp-headless.default.svc.cluster.local
Address: 10.244.2.60
Name:   myapp-headless.default.svc.cluster.local
Address: 10.244.1.75
```

### 访问指定的pod
```yaml
[root@k8s-master demo]# kubectl exec -it test -- bash
[root@test /]# curl consul-server-0.myapp-headless.default.svc
```

## 应用场景
<font style="color:rgb(18, 18, 18);">service的作用，主要是代理一组pod容器负载均衡服务，但是有时候我们不需要这种负载均衡场景，比如下面的两个例子。</font>

+ <font style="color:rgb(18, 18, 18);">kubernetes部署某个kafka集群，这种就不需要service来代理，客户端需要的是一组pod的所有的ip。</font>
+ <font style="color:rgb(18, 18, 18);">还有一种场景客户端自己处理负载均衡的逻辑，比如kubernates部署两个mysql，两个pod之间需要互相访问，实现主从同步。</font>


