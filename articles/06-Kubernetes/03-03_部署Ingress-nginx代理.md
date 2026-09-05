# 部署Ingress-nginx代理

> 分类：Kubernetes / 第3章：周边组件安装部署
> 原文：https://www.cuiliangblog.cn/detail/section/15188441
> 来源：崔亮的博客

---

# 使用yaml配置文件部署
## 参考地址
[https://github.com/kubernetes/ingress-nginx](https://github.com/kubernetes/ingress-nginx)

[ingress-nginx官网](https://kubernetes.github.io/ingress-nginx/)

## 下载文件
> 注意ingress版本要与k8s版本匹配，可在github仓库中查看ingress与k8s对于的版本关系列表。
>

![](assets/06-Kubernetes/ba1ce8f1ced5d1b512a2.png)

本实验中k8s集群版本为1.30.13，因此部署1.13.1版本的ingress-nginx。

使用 helm 和 yaml 文件均可部署，此处一 yaml 文件为例：

```bash
wget https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.13.1/deploy/static/provider/cloud/deploy.yaml
```

## 修改资源清单配置
```yaml
# vim deploy.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  labels:
    app.kubernetes.io/component: controller
    app.kubernetes.io/instance: ingress-nginx
    app.kubernetes.io/name: ingress-nginx
    app.kubernetes.io/part-of: ingress-nginx
    app.kubernetes.io/version: 1.13.1
  name: ingress-nginx-controller
  namespace: ingress-nginx
spec:
  replicas: 1 # ingress节点数
  template:
    ……
    spec:
      dnsPolicy: ClusterFirstWithHostNet				# 配置DNS策略，实现pod可以访问集群内外的域名 
      hostNetwork: true                         # 新增。开启host网络，提高网络入口的网络性能
      nodeSelector:                             # 设置node筛选器，在特定label的节点上启动
        ingress: "true"                         # 修改。调度至IngressProxy: "true"的节点
        
# 修改service类型为nodeport
apiVersion: v1
kind: Service
metadata:
  labels:
    app.kubernetes.io/component: controller
    app.kubernetes.io/instance: ingress-nginx
    app.kubernetes.io/name: ingress-nginx
    app.kubernetes.io/part-of: ingress-nginx
    app.kubernetes.io/version: 1.13.1
  name: ingress-nginx-controller
  namespace: ingress-nginx
spec:
……
  type: NodePort
```

## 创建资源
给master节点设置标签，充当边缘节点

```yaml
[root@k8s-master k8s-install]# kubectl label nodes k8s-master ingress=true
[root@k8s-master k8s-install]# kubectl apply -f deploy.yaml
```

## 查看资源信息
```bash
[root@k8s-master k8s-install]# kubectl get pod -n ingress-nginx -o wide
NAME                                        READY   STATUS      RESTARTS   AGE   IP              NODE         NOMINATED NODE   READINESS GATES
ingress-nginx-admission-create-bspb8        0/1     Completed   0          4m1s  10.244.2.44     k8s-work2    <none>           <none>
ingress-nginx-admission-patch-7cprp         0/1     Completed   1          4m1s  10.244.2.45     k8s-work2    <none>           <none>
ingress-nginx-controller-5f889d7dcb-q5zzw   1/1     Running     0          3m12s 192.168.10.20   k8s-master   <none>           <none>
[root@k8s-master k8s-install]# kubectl get svc -n ingress-nginx
NAME                                 TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)                      AGE
ingress-nginx-controller             NodePort    10.101.104.16   <none>        80:32397/TCP,443:31686/TCP   5m3s
ingress-nginx-controller-admission   ClusterIP   10.96.142.4     <none>        443/TCP                      5m3s
```

# 使用helm部署
## 添加仓库
```bash
# helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
"ingress-nginx" has been added to your repositories
# helm search repo ingress-nginx
NAME                            CHART VERSION   APP VERSION     DESCRIPTION                                       
ingress-nginx/ingress-nginx     4.14.3          1.14.3          Ingress controller for Kubernetes using NGINX a...
```

## 部署ingress
```bash
# helm pull ingress-nginx/ingress-nginx --untar
# cd ingress-nginx 
# ls
changelog  Chart.yaml  ci  cloudbuild.yaml  OWNERS  README.md  README.md.gotmpl  templates  tests  values.yaml
# vim values.yaml
controller:
  dnsPolicy: ClusterFirstWithHostNet
  hostNetwork: true
  replicaCount: 3
  nodeSelector:
    kubernetes.io/os: linux
# helm install ingress-nginx .  -n ingress --create-namespace
NAME: ingress-nginx
LAST DEPLOYED: Sat Feb  7 19:37:37 2026
NAMESPACE: ingress
STATUS: deployed
REVISION: 1
TEST SUITE: None
NOTES:
The ingress-nginx controller has been installed.
It may take a few minutes for the load balancer IP to be available.
You can watch the status by running 'kubectl get service --namespace ingress ingress-nginx-controller --output wide --watch'

An example Ingress that makes use of the controller:
  apiVersion: networking.k8s.io/v1
  kind: Ingress
  metadata:
    name: example
    namespace: foo
  spec:
    ingressClassName: nginx
    rules:
      - host: www.example.com
        http:
          paths:
            - pathType: Prefix
              backend:
                service:
                  name: exampleService
                  port:
                    number: 80
              path: /
    # This section is only required if TLS is to be enabled for the Ingress
    tls:
      - hosts:
        - www.example.com
        secretName: example-tls

If TLS is enabled for the Ingress, a Secret containing the certificate and key must also be provided:

  apiVersion: v1
  kind: Secret
  metadata:
    name: example-tls
    namespace: foo
  data:
    tls.crt: <base64 encoded cert>
    tls.key: <base64 encoded key>
  type: kubernetes.io/tls
```

## 查看验证
```bash
# helm list -A                                               
NAME            NAMESPACE       REVISION        UPDATED                                 STATUS  CHART                   APP VERSION
ingress-nginx   ingress         1               2026-02-07 19:25:33.511753359 +0800 CST failed  ingress-nginx-4.14.3    1.14.3     
# kubectl get pod -n ingress                                
NAME                                        READY   STATUS    RESTARTS   AGE
ingress-nginx-controller-67fcf947c6-br9jc   1/1     Running   0          60s
ingress-nginx-controller-67fcf947c6-hbzz6   1/1     Running   0          61s
ingress-nginx-controller-67fcf947c6-vk888   1/1     Running   0          60s
```

# 访问测试
## 创建资源
```yaml
[root@k8s-master k8s-install]# cat test.yaml 
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
spec:
  replicas: 1
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
        image: swr.cn-north-4.myhuaweicloud.com/ddn-k8s/docker.io/nginx:1.25.5
        ports:
        - containerPort: 80
          name: http
        resources:
          limits:
            cpu: "1"
            memory: 1Gi
          requests:
            cpu: 100m
            memory: 128Mi
---
apiVersion: v1
kind: Service
metadata:
  name: myapp-svc
spec:
  selector:
    app: myapp
  ports:
  - port: 80
    targetPort:  80
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: myapp-ingreess
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  ingressClassName: nginx
  rules:
  - host: myapp.local.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: myapp-svc
            port:
              number: 80
```

## 修改hosts
`192.168.10.10 myapp.local.com`

## 访问测试
![](assets/06-Kubernetes/60884c4add6e65a115e1.png)


