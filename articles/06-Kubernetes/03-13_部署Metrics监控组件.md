# 部署Metrics监控组件

> 分类：Kubernetes / 第3章：周边组件安装部署
> 原文：https://www.cuiliangblog.cn/detail/section/15189166
> 来源：崔亮的博客

---

# 一、<font style="color:rgb(79, 79, 79);">metrics-server(HPA使用)</font>
## 1. 版本说明
[github地址](https://github.com/kubernetes-sigs/metrics-server)

## 2. Aggregator开启
这个是k8s在1.7的新特性，如果是1.16版本的可以不用添加，1.17以后要添加。这个参数的作用是Aggregation允许在不修改Kubernetes核心代码的同时扩展Kubernetes API。

+ 查询是否开启：

master机器：ps -ef |grep apiserver|grep 'enable-aggregator-routing=true'

+ **开启方法：要在master机器上执行**

```yaml
vim /etc/kubernetes/manifests/kube-apiserver.yaml

- command:
    - kube-apiserver
    …………
    - --enable-aggregator-routing=true  //加入这一行
# 保存后apiserver会自动重启
```

## 3. 部署
1. 下载yaml文件

```bash
wget https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
```

2. 修改配置

```yaml
# vim components.yaml
apiVersion: apps/v1
kind: Deployment
spec:
  template:
    metadata:
      labels:
        k8s-app: metrics-server
    spec:
      containers:
      - args:
        - --kubelet-insecure-tls # 跳过 TLS 认证，否则会出现 x509 的认证问题
        - --kubelet-preferred-address-types=InternalIP # 使用 Node IP 进行通信。
```

3. 创建资源

`kubectl apply -f components.yaml`

4. 检验相应的API群组metrics.k8s.io是否出现在Kubernetes集群的API群组列表中

`# kubectl api-versions | grep metrics` 

5. 确认相关的Pod对象运行正常

`# kubectl get pods -n kube-system -l k8s-app=metrics-server` 

6. 使用kubectl top node查看结果

```yaml
[root@tiaoban ~]# kubectl top node
NAME         CPU(cores)   CPU%   MEMORY(bytes)   MEMORY%   
k8s-master   422m         10%    1471Mi          40%       
k8s-work1    268m         6%     1197Mi          33%       
k8s-work2    239m         5%     1286Mi          35%       
k8s-work3    320m         8%     1091Mi          30% 
```

# 二、kube-state-metrics部署(prometheus采集数据使用)
仓库地址：[kubernetes/kube-state-metrics: Add-on agent to generate and expose cluster-level metrics. (github.com)](https://github.com/kubernetes/kube-state-metrics)

## 版本说明
+ 版本依赖

| kube-state-metrics | Kubernetes client-go Version |
| --- | --- |
| v2.9.2 | v1.26 |
| v2.10.1 | v1.27 |
| v2.11.0 | v1.28 |
| v2.12.0 | v1.29 |
| v2.13.0 | v1.30 |
| main | v1.30 |


## 部署
+ 克隆项目至本地

```yaml
# git clone https://github.com/kubernetes/kube-state-metrics.git
# cd kube-state-metrics/examples/standard/
```

+ 修改service，允许prometheus自动发现

```yaml
# vim service.yaml
apiVersion: v1
kind: Service
metadata:
  labels:
    app.kubernetes.io/name: kube-state-metrics
    app.kubernetes.io/version: 2.2.0
  name: kube-state-metrics
  namespace: kube-system
  annotations:  
    prometheus.io/scrape: "true"       ##添加此参数，允许prometheus自动发现
```

+ 创建资源

```yaml
kubectl apply -f .
[root@tiaoban standard]# kubectl get pod -n kube-system -l app.kubernetes.io/name=kube-state-metrics
NAME                                 READY   STATUS    RESTARTS   AGE
kube-state-metrics-bb59558c8-cx9pz   1/1     Running   0          1m
```


