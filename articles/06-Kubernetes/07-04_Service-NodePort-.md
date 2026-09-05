# Service(NodePort)

> 分类：Kubernetes / 第7章：Service和Ingress
> 原文：https://www.cuiliangblog.cn/detail/section/94199698
> 来源：崔亮的博客

---

## 简介
1. 这种类型建立在ClusterIP类型之上，其在每个node节点的IP地址的某静态端口（NodePort）暴露服务，因此，它依然会为Service分配集群IP地址，并将此作为NodePort的路由目标。
2. NodePort类型就是在工作节点的IP地址上选择一个端口用于将集群外部的用户请求转发至目标Service的ClusterIP和Port，因此，这种类型的Service既可如ClusterIP一样受到集群内部客户端Pod的访问，也会受到集群外部客户端通过套接字<NodeIP>:<NodePort>进行的请求。

![](assets/06-Kubernetes/243379fc01242bb4f7bc.png)

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

### 创建NodePort资源
```yaml
# cat svc.yaml 
apiVersion: v1
kind: Service
metadata:
  name: myapp
spec:
  type: NodePort # 指定资源类型为NodePort
  selector:      # 匹配指定标签的资源
    app: myapp
  ports:
  - name: http
    port: 80
    protocol: TCP
    targetPort: 80
    nodePort: 30303   # 指定节点端口，默认30000以上端口随机分配
```

### 查看service信息
```bash
# kubectl get svc
NAME         TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)        AGE
kubernetes   ClusterIP   10.96.0.1        <none>        443/TCP        5d4h
myapp        NodePort    10.101.173.202   <none>        80:30303/TCP   6s
```

### 访问验证
+ 集群外部客户端访问master节点ip+30303端口

![](assets/06-Kubernetes/002ffed9aea49357af72.png)

+ 集群外部客户端访问node1节点ip+30303端口

![](assets/06-Kubernetes/97b43f3a6e981f1af75c.png)

+ 集群外部客户端访问node2节点ip+30303端口

![](assets/06-Kubernetes/66d9eb2e1f4f10604bb2.png)

## 结果分析
### 查看ipvs规则
+ master节点

```bash
[root@k8s-master ~]# ipvsadm -Ln
IP Virtual Server version 1.2.1 (size=4096)
Prot LocalAddress:Port Scheduler Flags
-> RemoteAddress:Port           Forward Weight ActiveConn InActConn
TCP  192.168.10.10:30303 rr
-> 10.244.1.57:80               Masq    1      0          0         
-> 10.244.1.58:80               Masq    1      0          0         
-> 10.244.2.50:80               Masq    1      0          0    
```

查看其他节点也存在一样的规则，指向pod的ip和端口


