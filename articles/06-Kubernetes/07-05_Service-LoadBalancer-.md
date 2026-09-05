# Service(LoadBalancer)

> 分类：Kubernetes / 第7章：Service和Ingress
> 原文：https://www.cuiliangblog.cn/detail/section/94199827
> 来源：崔亮的博客

---

## LoadBalancer简介
1. 这种类型建构在NodePort类型之上，<font style="color:rgb(18, 18, 18);">大部分情况下只适用于支持外部负载均衡器的云提供商（AWS,阿里云,华为云等）使用</font>，由它接入外部客户端的请求并调度至集群节点相应的NodePort之上。因此LoadBalancer一样具有NodePort和ClusterIP。
2. 简而言之，一个LoadBalancer类型的Service会指向关联至Kubernetes集群外部的、切实存在的某个负载均衡设备，该设备通过工作节点之上的NodePort向集群内部发送请求流量。
3. 例如Amazon云计算环境中的ELB实例即为此类的负载均衡设备。此类型的优势在于，它能够把来自于集群外部客户端的请求调度至所有节点（或部分节点）的NodePort之上，而不是依赖于客户端自行决定连接至哪个节点，从而避免了因客户端指定的节点故障而导致的服务不可用。

![](assets/06-Kubernetes/5bb40ada8396d1a5381f.png)

## 公有云(以阿里云为例)配置
参考文档：[https://help.aliyun.com/zh/ack/ack-managed-and-ack-dedicated/user-guide/add-annotations-to-the-yaml-file-of-a-service-to-configure-clb-instances?spm=a2c4g.11186623.help-menu-85222.d_2_3_3_3.22542dbcn4SlOF&scm=20140722.H_86531._.OR_help-T_cn~zh-V_1](https://help.aliyun.com/zh/ack/ack-managed-and-ack-dedicated/user-guide/add-annotations-to-the-yaml-file-of-a-service-to-configure-clb-instances?spm=a2c4g.11186623.help-menu-85222.d_2_3_3_3.22542dbcn4SlOF&scm=20140722.H_86531._.OR_help-T_cn~zh-V_1)

## 私有云(以<font style="color:rgb(36, 41, 46);">MetalLB为例配置</font>)
### 简介
MetalLB 是为裸机Kubernetes集群实现的负载均衡器，使用标准路由协议ARP或BGP。Kubernetes官方没有为裸机集群提供网络负载均衡器（LoadBalancer类型的服务）的实现。各家云厂商（GCP、AWS、Azure…）有相应实现，但必须运行在自身的云环境上才能使用，如果没有在受支持的IaaS平台（GCP、AWS、Azure…）上运行，那么负载均衡器在创建时将无限期地保持pending状态，如果你要使用loadbalancer service，那么就要用到metallb了

### 工作模式
layer 2模式：也就是工作在2层来负责相应arp请求，对于局域网中的人来说仿佛就是给服务分配了一个ip，但是2层模式不是真正的负载均衡，因为所有的流量会经过集群中的一个节点，当这个节点挂了的话，metallb会迁移ip到另外一个节点上。<font style="color:rgb(51, 51, 51);">Layer 2模式更为通用，不需要用户有额外的设备；但由于Layer 2模式使用ARP/ND，地址池分配需要跟客户端在同一子网，地址分配略为繁琐。</font>

![](assets/06-Kubernetes/97e9f3f7519cf642b9f0.png)

bgp模式：<font style="color:rgb(51, 51, 51);">集群中所有node都会跟上联路由器建立BGP连接，并且会告知路由器应该如何转发service的流量。</font>

<font style="color:rgb(51, 51, 51);">BGP模式是真正的LoadBalancer。</font>但是需要你的路由器支持bgp，此处使用layer 2模式。

![](assets/06-Kubernetes/1b1aaccbbb86893085b6.png)

### 文档
安装：[https://metallb.universe.tf/installation/](https://metallb.universe.tf/installation/)

配置使用：[https://metallb.universe.tf/configuration/](https://metallb.universe.tf/configuration/)

### 安装
```bash
# 如果kube-proxy使用的是IPVS模式，你需要启用staticARP
[root@k8s-master MetalLB]# kubectl edit configmap -n kube-system kube-proxy
# 设置staticARP为true
mode: "ipvs"
ipvs:
  strictARP: true
# 创建资源
[root@k8s-master MetalLB]# kubectl apply -f https://raw.githubusercontent.com/metallb/metallb/v0.13.5/config/manifests/metallb-native.yaml
# 查看资源
[root@k8s-master MetalLB]# kubectl get pod -n metallb-system 
NAME                          READY   STATUS    RESTARTS   AGE
controller-79d46b9996-thtw2   1/1     Running   0          2m35s
speaker-9r59c                 1/1     Running   0          2m34s
speaker-shdvj                 1/1     Running   0          2m34s
speaker-w4g96                 1/1     Running   0          2m34s
# 设置ip地址池
[root@k8s-master MetalLB]# cat config.yaml 
apiVersion: metallb.io/v1beta1
kind: IPAddressPool
metadata:
  name: first-pool
  namespace: metallb-system
spec:
  addresses:
  - 192.168.10.200-192.168.10.250
---
apiVersion: metallb.io/v1beta1
kind: L2Advertisement
metadata:
  name: example
  namespace: metallb-system
spec:
  ipAddressPools:
  - first-pool
```

### 使用
```yaml
[root@k8s-master k8s-test]# cat deployment.yaml 
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
[root@k8s-master k8s-test]# cat svc.yaml 
apiVersion: v1
kind: Service
metadata:
  name: myapp
spec:
  type: LoadBalancer
  selector:
    app: myapp
  ports:
  - name: http
    port: 80
    protocol: TCP
    targetPort: 80
  loadBalancerIP: 192.168.10.222   # 可以指定ip，也可以自动分配，指定的ip必须在ip地址池内
# 查看svc
[root@k8s-master k8s-test]# kubectl get svc
NAME         TYPE           CLUSTER-IP       EXTERNAL-IP      PORT(S)        AGE
kubernetes   ClusterIP      10.96.0.1        <none>           443/TCP        5d4h
myapp        LoadBalancer   10.101.173.202   192.168.10.222   80:32482/TCP   16m
# 使用EXTERNAL-IP+端口访问
[root@k8s-master k8s-test]# curl 192.168.10.222:80
Hello MyApp | Version: v1 | <a href="hostname.html">Pod Name</a>
# 集群外部访问
http://192.168.10.222:80
```

![](assets/06-Kubernetes/ec422f2c28fde7ae3c20.png)


