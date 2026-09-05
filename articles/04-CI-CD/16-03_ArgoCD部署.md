# ArgoCD部署

> 分类：CI/CD / 第16章：ArgoCD与GitOps入门
> 原文：https://www.cuiliangblog.cn/detail/section/119667444
> 来源：崔亮的博客

---

# 安装Argo CD
## 创建ns
```bash
[root@k8s-master ~]# kubectl create namespace argocd
```

## 安装argocd
```bash
[root@k8s-master ~]# kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
```

注意事项：默认下载的是最新版argocd，安装argocd时，务必参阅支持的k8s版本列表，否则会出现安装失败pod运行异常的情况。

参考文档：[https://argo-cd.readthedocs.io/en/stable/operator-manual/installation/#supported-versions](https://argo-cd.readthedocs.io/en/stable/operator-manual/installation/#supported-versions)

由于k8s集群版本为1.30.13。因此安装的argo cd版本为 3.1。argocd 分为 HA 和非 HA 版两种方式安装，以非 HA 为例，yaml文件地址：https://github.com/argoproj/argo-cd/blob/v3.1.9/manifests/install.yaml

其他版本安装可参考文档：[https://github.com/argoproj/argo-cd/releases/tag/v3.1.9](https://github.com/argoproj/argo-cd/releases/tag/v3.1.9)

<font style="color:rgb(18, 18, 18);">执行成</font>功后会在argocd的namespace下创建如下资<font style="color:rgb(18, 18, 18);">源。</font>

```bash
[root@tiaoban ~]# kubectl get all -n argocd
NAME                                                    READY   STATUS    RESTARTS   AGE
pod/argocd-application-controller-0                     1/1     Running   0          32s
pod/argocd-applicationset-controller-695985754c-vvww7   1/1     Running   0          32s
pod/argocd-dex-server-b566c57d4-9hrgt                   1/1     Running   0          32s
pod/argocd-notifications-controller-69fd67f96-2tnh2     1/1     Running   0          32s
pod/argocd-redis-c476db8bf-txbhj                        1/1     Running   0          32s
pod/argocd-repo-server-7f4945b77c-pmnzf                 1/1     Running   0          32s
pod/argocd-server-8596cd4c-t7fth                        1/1     Running   0          32s

NAME                                              TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)                      AGE
service/argocd-applicationset-controller          ClusterIP   10.98.113.109    <none>        7000/TCP,8080/TCP            33s
service/argocd-dex-server                         ClusterIP   10.107.128.17    <none>        5556/TCP,5557/TCP,5558/TCP   33s
service/argocd-metrics                            ClusterIP   10.98.160.14     <none>        8082/TCP                     33s
service/argocd-notifications-controller-metrics   ClusterIP   10.106.67.83     <none>        9001/TCP                     33s
service/argocd-redis                              ClusterIP   10.102.130.38    <none>        6379/TCP                     33s
service/argocd-repo-server                        ClusterIP   10.106.149.119   <none>        8081/TCP,8084/TCP            33s
service/argocd-server                             ClusterIP   10.100.238.93    <none>        80/TCP,443/TCP               32s
service/argocd-server-metrics                     ClusterIP   10.99.24.19      <none>        8083/TCP                     32s

NAME                                               READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/argocd-applicationset-controller   1/1     1            1           32s
deployment.apps/argocd-dex-server                  1/1     1            1           32s
deployment.apps/argocd-notifications-controller    1/1     1            1           32s
deployment.apps/argocd-redis                       1/1     1            1           32s
deployment.apps/argocd-repo-server                 1/1     1            1           32s
deployment.apps/argocd-server                      1/1     1            1           32s

NAME                                                          DESIRED   CURRENT   READY   AGE
replicaset.apps/argocd-applicationset-controller-695985754c   1         1         1       32s
replicaset.apps/argocd-dex-server-b566c57d4                   1         1         1       32s
replicaset.apps/argocd-notifications-controller-69fd67f96     1         1         1       32s
replicaset.apps/argocd-redis-c476db8bf                        1         1         1       32s
replicaset.apps/argocd-repo-server-7f4945b77c                 1         1         1       32s
replicaset.apps/argocd-server-8596cd4c                        1         1         1       32s

NAME                                             READY   AGE
statefulset.apps/argocd-application-controller   1/1     32s
```

<font style="color:rgb(18, 18, 18);">至此，argocd 部署完成，接下来访问Argo server，我们可以通过以下两种方式访问：</font>

+ <font style="color:rgb(18, 18, 18);">通过web ui</font>
+ <font style="color:rgb(18, 18, 18);">使用argocd 客户端工具</font>

# web访问argocd
## 访问web ui(NodePort方式)
通过kubectl edit -n argocd svc argocd-server将service的type类型从ClusterIP改为NodePort。改完后通过以下命令查看端口：

```bash
[root@k8s-master ~]# kubectl get svc -n argocd
NAME                                      TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)                      AGE
argocd-applicationset-controller          ClusterIP   10.107.129.45    <none>        7000/TCP,8080/TCP            15h
argocd-dex-server                         ClusterIP   10.101.106.223   <none>        5556/TCP,5557/TCP,5558/TCP   15h
argocd-metrics                            ClusterIP   10.111.3.69      <none>        8082/TCP                     15h
argocd-notifications-controller-metrics   ClusterIP   10.102.91.50     <none>        9001/TCP                     15h
argocd-redis                              ClusterIP   10.106.114.155   <none>        6379/TCP                     15h
argocd-repo-server                        ClusterIP   10.96.39.69      <none>        8081/TCP,8084/TCP            15h
argocd-server                             NodePort    10.108.206.123   <none>        80:30357/TCP,443:32640/TCP   15h
argocd-server-metrics                     ClusterIP   10.110.61.94     <none>        8083/TCP                     15h
```

访问[https://192.168.10.10:32640/](https://192.168.10.10:32640/)

![](assets/04-CI-CD/565405210238e802efc3.png)

## 获取admin密码
用户名为<font style="color:rgb(18, 18, 18);">admin，密码通过以下方式获取。</font>

```bash
[root@master1 argocd]# kubectl get secrets argocd-initial-admin-secret -n argocd -o jsonpath="{.data.password}" | base64 -d
oZoCs1ZVltSplhP5
```

## 访问web ui(ingress方式)
访问web ui必须使用https方式访问，以traefik为例，创建ingressroute资源

```yaml
# 创建证书文件
[root@k8s-master argo]# openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout tls.key -out tls.crt -subj "/CN=argocd.local.com"
# 创建secret资源
[root@k8s-master argo]# kubectl create secret tls ingress-tls --cert=tls.crt --key=tls.key -n argocd
secret/ingress-tls created
# 创建ingress资源
[root@k8s-master argo]# cat ingress.yaml 
apiVersion: traefik.io/v1alpha1
kind: Middleware
metadata:
  name: redirect-https-middleware
  namespace: argocd
spec:
  redirectScheme:
    scheme: https
---
apiVersion: traefik.io/v1alpha1
kind: ServersTransport
metadata:
  name: argocd-transport
  namespace: argocd
spec:
  serverName: "argocd.cuiliangblog.cn"
  insecureSkipVerify: true
---
apiVersion: traefik.io/v1alpha1
kind: IngressRoute
metadata:
  name: argocd
  namespace: argocd
spec:
  entryPoints:
    - web
    - websecure 
  tls:
    secretName: ingress-tls                
  routes:
  - match: Host(`argocd.cuiliangblog.cn`)
    kind: Rule
    services:
    - name: argocd-server
      port: 443
      serversTransport: argocd-transport
    middlewares:
    - name: redirect-https-middleware
[root@k8s-master argo]# kubectl apply -f ingress.yaml 
ingressroute.traefik.containo.us/argocd create
```

添加hosts解析记录 `192.168.10.10 argocd.cuiliangblog.cn`

![](assets/04-CI-CD/26fdce4988ea7b8d3e95.png)

# <font style="color:rgb(18, 18, 18);">客户端工具访问argocd</font>
## 下载argocd客户端工具
获取下载包地址

![](assets/04-CI-CD/31528416f92bfd7468de.png)

或者直接gitlab下载，地址为https://github.com/argoproj/argo-cd/releases/tag/v3.1.9

```bash
[root@tiaoban ~]# wget https://argocd.cuiliangblog.cn/download/argocd-linux-amd64
[root@tiaoban ~]# mv argocd-linux-amd64 /usr/local/bin/argocd
[root@tiaoban ~]# chmod u+x /usr/local/bin/argocd
[root@tiaoban ~]# argocd version
argocd: v3.1.9+8665140
  BuildDate: 2025-10-17T22:07:41Z
  GitCommit: 8665140f96f6b238a20e578dba7f9aef91ddac51
  GitTreeState: clean
  GoVersion: go1.24.6
  Compiler: gc
  Platform: linux/amd64
{"level":"fatal","msg":"Argo CD server address unspecified","time":"2025-10-22T16:35:30+08:00"}
```

## 客户端工具登录argocd
```bash
[root@tiaoban ~]# argocd login argocd.cuiliangblog.cn --username admin --password oZoCs1ZVltSplhP5
WARNING: server certificate had error: tls: failed to verify certificate: x509: certificate signed by unknown authority. Proceed insecurely (y/n)? y
{"level":"warning","msg":"Failed to invoke grpc call. Use flag --grpc-web in grpc calls. To avoid this warning message, use flag --grpc-web.","time":"2025-10-22T16:37:08+08:00"}
'admin:login' logged in successfully
Context 'argocd.cuiliangblog.cn' updated
```

## 更新admin密码
```bash
argocd account update-password --account admin --current-password oZoCs1ZVltSplhP5 --new-password '!QAZ2wsx'
{"level":"warning","msg":"Failed to invoke grpc call. Use flag --grpc-web in grpc calls. To avoid this warning message, use flag --grpc-web.","time":"2025-10-22T16:37:45+08:00"}
Password updated
Context 'argocd.cuiliangblog.cn' updated
```


