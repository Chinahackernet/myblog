# Service(ClusterIP)

> 分类：Kubernetes / 第7章：Service和Ingress
> 原文：https://www.cuiliangblog.cn/detail/section/15275658
> 来源：崔亮的博客

---

## 简介
1. 通过集群内部IP地址暴露服务，此地址仅在集群内部可达，而无法被集群外部的客户端访问
2. clusterIP 主要在每个 node 节点使用 iptables，将发向 clusterIP对应端口的数据，转发到 kube-proxy 中。然后 kube-proxy自己内部实现有负载均衡的方法，并可以查询到这个 service 下对应 pod的地址和端口，进而把数据转发给对应的 pod 的地址和端口

![](assets/06-Kubernetes/269f3a59a3963ce8c5fd.png)

## 实现过程
+ apiserver  
用户通过kubectl命令向apiserver发送创建service的命令，apiserver接收到请求后将数据存储到etcd中
+ kube-proxy  
kubernetes的每个节点中都有一个叫做kube-porxy的进程，这个进程负责感知service，pod的变化，并将变化的信息写入本地的iptables规则中
+ iptables 使用NAT等技术将virtualIP的流量转至endpoint中

## 操作实践
### 创建deployment资源
```yaml
# cat myapp-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp-deploy
  namespace: default
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
        ports:
        - containerPort: 80
          name: http
```

### 创建ClusterIP资源
```yaml
# cat svc.yaml
apiVersion: v1
kind: Service
metadata:
  name: myapp
spec:
  type: ClusterIP # 类型设置为ClusterIP
  selector:
    app: myapp # 标签选择器，匹配deployment资源
  ports:
  - name: http
    port: 80   # service端口
    protocol: TCP  # 协议
    targetPort: 80 # deployment资源端口
```

### 查看service信息
```yaml
# kubectl get svc
NAME         TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)   AGE
kubernetes   ClusterIP   10.96.0.1       <none>        443/TCP   5d4h
myapp        ClusterIP   10.111.98.163   <none>        80/TCP    48s
```

### 访问验证
```yaml
# curl 10.111.98.163
Hello MyApp | Version: v1 | <a href="hostname.html">Pod Name</a>
```

## 结果分析
### 查看endpoints
+ 查看service信息

```yaml
# kubectl describe svc myapp
Name:              myapp
Namespace:         default
Labels:            <none>
Annotations:       <none>
Selector:          app=myapp
Type:              ClusterIP
IP:                10.111.98.163
Port:              http  80/TCP
TargetPort:        80/TCP
Endpoints:         10.244.1.57:80,10.244.1.58:80,10.244.2.50:80
Session Affinity:  None
```

+ 查看pod ip信息

```bash
# kubectl get pod -o wide
NAME                                          READY   STATUS    RESTARTS   AGE     IP              NODE         NOMINATED NODE   READINESS GATES
myapp-deploy-7ffb5fd5ff-cj6ql                 1/1     Running   0          4m16s   10.244.1.57     k8s-work1    <none>           <none>
myapp-deploy-7ffb5fd5ff-jgg7n                 1/1     Running   0          4m16s   10.244.1.58     k8s-work1    <none>           <none>
myapp-deploy-7ffb5fd5ff-tzhqd                 1/1     Running   0          4m16s   10.244.2.50     k8s-work2    <none>           <none>
```

可以发现，endpoints的ip端口信息与pod的ip端口信息完全一致

### 查看kube-proxy
+ 查看ipvs规则

```bash
[root@k8s-master ~]# ipvsadm -Ln
IP Virtual Server version 1.2.1 (size=4096)
Prot LocalAddress:Port Scheduler Flags
-> RemoteAddress:Port           Forward Weight ActiveConn InActConn 
TCP  10.111.98.163:80 rr
-> 10.244.1.57:80               Masq    1      0          0         
-> 10.244.1.58:80               Masq    1      0          0         
-> 10.244.2.50:80               Masq    1      0          0 
```

可以发现，ipvs规则与pod的ip和端口完全一致












