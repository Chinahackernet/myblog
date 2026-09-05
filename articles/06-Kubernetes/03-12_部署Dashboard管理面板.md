# 部署Dashboard管理面板

> 分类：Kubernetes / 第3章：周边组件安装部署
> 原文：https://www.cuiliangblog.cn/detail/section/15189013
> 来源：崔亮的博客

---

# kube-dashboard部署
## dashboard组件安装
+ 官方参考文档：  
[https://kubernetes.io/docs/tasks/access-application-cluster/web-ui-dashboard/#deploying-the-dashboard-ui](https://kubernetes.io/docs/tasks/access-application-cluster/web-ui-dashboard/#deploying-the-dashboard-ui)
+ github项目地址：  
[https://github.com/kubernetes/dashboard](https://github.com/kubernetes/dashboard)
+ 说明  
1.7及之后的版本默认在部署时仅定义了运行Dashboard所需要的最小权限，仅能够在Master主机上通过“kubectl  
proxy”命令创建代理后于本机进行访问，它默认禁止了来自于其他任何主机的访问请求。

### 自签证书
因为自动生成的证书很多浏览器无法使用，所以自己创建证书

```bash
# 新建证书存放目录
mkdir /etc/kubernetes/kube-dashboard
cd /etc/kubernetes/kube-dashboard/ 
# 创建命名空间
kubectl create namespace kubernetes-dashboard 
# 创建key文件
openssl genrsa -out dashboard.key 2048  
# 证书请求
openssl req -new -out dashboard.csr -key dashboard.key -subj '/CN=kubernetes-dashboard-certs' 
# 自签证书
openssl x509 -req -days 36000 -in dashboard.csr -signkey dashboard.key -out dashboard.crt  
# 创建kubernetes-dashboard-certs对象
kubectl create secret generic kubernetes-dashboard-certs --from-file=dashboard.key --from-file=dashboard.crt -n kubernetes-dashboard 
```

### 下载并修改配置文件
+ 下载配置文件

```bash
wget https://raw.githubusercontent.com/kubernetes/dashboard/v2.7.0/aio/deploy/recommended.yaml
```

+ 修改配置文件，增加直接访问端口

```bash
[root@k8s-master  ~]# vim recommended.yaml
kind: Service
apiVersion: v1
metadata:
  labels:
    k8s-app: kubernetes-dashboard
  name: kubernetes-dashboard
  namespace: kubernetes-dashboard
spec:
  type: NodePort # 改为nodeport暴露服务
  ports:
    - port: 443 
      targetPort: 8443
      nodePort: 30010 # 指定服务端口
  selector:
    k8s-app: kubernetes-dashboard
```

+ 修改配置文件，注释原kubernetes-dashboard-certs对象声明

```bash
#apiVersion: v1
#kind: Secret
#metadata:
#  labels:
#    k8s-app: kubernetes-dashboard
#  name: kubernetes-dashboard-certs
#  namespace: kubernetes-dashboard
#type: Opaque
#
#---
```

创建dashboard资源

```bash
[root@master  ~]# kubectl apply -f recommended.yaml
```

### 创建RBAC获取token（1.24之前）
<font style="color:rgba(0, 0, 0, 0.87);">创建一个具有全局所有权限的用户来登录 Dashboard</font>

```yaml
[root@k8s-master dashboard]# cat > rbac.yaml << EOF
kind: ClusterRoleBinding
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  name: admin
roleRef:
  kind: ClusterRole
  name: cluster-admin
  apiGroup: rbac.authorization.k8s.io
subjects:
- kind: ServiceAccount
  name: admin
  namespace: kubernetes-dashboard
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: admin
  namespace: kubernetes-dashboard
EOF
[root@k8s-master dashboard]# kubectl apply -f rbac.yaml 
clusterrolebinding.rbac.authorization.k8s.io/admin created
serviceaccount/admin created
```

+ 获取token信息

```bash
kubectl -n kubernetes-dashboard describe secret $(kubectl -n kubernetes-dashboard get secret | grep admin-token | awk '{print $1}')
```

### 创建RBAC获取token（1.24之后）
<font style="color:rgb(0, 0, 0);">k8s 1.24版本之前sa账号产生的token在secret中是永久不过期的。在1.24版本以后secret将不再保留token.而此时容器中的token是只有一个小时就过期的，这对于一个服务来操作多个k8s集群基本就不可能了。</font>

<font style="color:rgb(0, 0, 0);">既然1.24 以后不再创建secret 了。那么我们其实可以手动创建secret, 关联好serviceaccount, 让k8s帮我们填好永不过期token就可以了。</font>

```bash
[root@k8s-master dashboard]# cat > rbac.yaml << EOF
kind: ClusterRoleBinding
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  name: admin
roleRef:
  kind: ClusterRole
  name: cluster-admin
  apiGroup: rbac.authorization.k8s.io
subjects:
- kind: ServiceAccount
  name: admin
  namespace: kubernetes-dashboard
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: admin
  namespace: kubernetes-dashboard
---
apiVersion: v1
kind: Secret
metadata:
  name: admin-token
  namespace: kubernetes-dashboard
  annotations:
    kubernetes.io/service-account.name: "admin"
type: kubernetes.io/service-account-token
EOF
[root@k8s-master dashboard]# kubectl apply -f rbac.yaml 
clusterrolebinding.rbac.authorization.k8s.io/admin created
serviceaccount/admin created
```

+ 获取token信息

```bash
kubectl -n kubernetes-dashboard describe secret $(kubectl -n kubernetes-dashboard get secret | grep admin-token | awk '{print $1}')
```

### 登录访问
[https://192.168.10.10:30010/#/login](https://192.168.10.10:30010/#/login)

![](assets/06-Kubernetes/63de5564946df7b4ff20.png)

### 添加ingress资源
我们已经在集群部署了ingress-nginx，接下来部署ingress资源，通过域名访问。

+ 创建tls证书

```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout tls.key -out tls.crt -subj "/CN=dashboard.local.com"
```

+ 创建secret资源

```bash
# kubectl create secret tls dashboard-tls --cert=tls.crt --key=tls.key -n kubernetes-dashboard
secret/dashboard-tls created
```

+ 创建ingress资源(ingress-nginx)

```bash
# cat > ingress.yaml << EOF
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: dashboard-ingreess
  namespace: kubernetes-dashboard
  annotations:
    nginx.ingress.kubernetes.io/backend-protocol: "HTTPS"
spec:
  ingressClassName: nginx
  rules:
  - host: dashboard.local.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: kubernetes-dashboard
            port:
              number: 443
  tls:
  - hosts:    
    - dashboard.local.com   主机名
    secretName: dashboard-tls  这里引用创建的secrets
EOF
# kubectl apply -f ingress.yaml
```

+ 创建ingress（traefik）

<font style="color:rgb(35, 38, 41);">在第二次会话中，Traefik 将验证仪表板的 TLS 证书。</font><font style="color:rgb(35, 38, 41);">当仪表板证书未由 Traefik 列表中的任何 CA 签名时，它会关闭连接，然后仪表板会引发错误消息。</font>  
<font style="color:rgb(35, 38, 41);">如果要使用此方案，则需要跳过仪表板证书验证，或将仪表板证书添加到受信任 CA 的 Traefik 列表中。 以下配置通过跳过仪表板证书验证来工作。</font>

```bash
apiVersion: traefik.io/v1alpha1
kind: ServersTransport
metadata:
  name: mytransport
  namespace: kubernetes-dashboard
spec:
  serverName: "dashboard.local.com"
  insecureSkipVerify: true
---
apiVersion: traefik.io/v1alpha1
kind: IngressRoute
metadata:
  name: dashboard
  namespace: kubernetes-dashboard
spec:
  entryPoints:
  - websecure
  routes:
  - match: Host(`dashboard.local.com`) # 域名
    kind: Rule
    services:
      - name: kubernetes-dashboard  # 与svc的name一致
        port: 443      # 与svc的port一致
        serversTransport: mytransport
  tls:
    secretName: dashboard-tls       # 指定tls证书名称
```

+ 添加hosts地址访问验证

![](assets/06-Kubernetes/74636cb54b67bfa31d1b.png)

## kubeconfig方式验证
### 设置变量
+ 获取dashboard-admin-token的名称  
`kubectl get secrets --all-namespaces | grep dashboard-admin-token` 
+ 获取token  
`DASH_TOCKEN=$(kubectl -n kubernetes-dashboard get secret dashboard-admin-token-9k522 -o jsonpath={.data.token}| base64 -d)` 

### 初始化集群信息
```bash
# 提供API Server的URL，以及验证API Server证书所用到的CA证书等
kubectl config set-cluster kubernetes --server=192.168.10.100:6443 --kubeconfig=/root/dashbord-admin.conf 
# 获取dashboard-admin的token，并将其作为认证信息
kubectl config set-credentials dashboard-admin --token=$DASH_TOCKEN --kubeconfig=/root/dashbord-admin.conf 
```

### 设置context列表
```bash
# 定义一个名为dashboard-admin的context：
kubectl config set-context dashboard-admin@kubernetes  --cluster=kubernetes  --user=dashboard-admin --kubeconfig=/root/dashbord-admin.conf 
# 使用的context为前面定义的名为dashboard-admin的context：
kubectl config use-context dashboard-admin@kubernetes  --kubeconfig=/root/dashbord-admin.conf 
```

### sz发送kubeconfig，然后使用kubeconfig登录
```bash
# 切换到admin用户
kubectl config use-context kubernetes-admin@kubernetes  
```

## helm方式部署
### 部署软件包
```bash
[root@tiaoban k8s]# helm repo add kubernetes-dashboard https://kubernetes.github.io/dashboard/
"kubernetes-dashboard" has been added to your repositories
[[root@tiaoban k8s]# helm pull kubernetes-dashboard/kubernetes-dashboard --untar
[root@tiaoban k8s]# cd kubernetes-dashboard/
[root@tiaoban kubernetes-dashboard]# vim values.yaml 
kong:
  enabled: false # 取消安装kong网关
[[root@tiaoban k8s]# helm install kubernetes-dashboard -n kubernetes-dashboard . -f values.yaml
NAME: kubernetes-dashboard
LAST DEPLOYED: Sun Aug  4 21:17:41 2024
NAMESPACE: kubernetes-dashboard
STATUS: deployed
REVISION: 1
TEST SUITE: None
NOTES:
*************************************************************************************************
*** PLEASE BE PATIENT: Kubernetes Dashboard may need a few minutes to get up and become ready ***
*************************************************************************************************

Congratulations! You have just installed Kubernetes Dashboard in your cluster.

To access Dashboard run:
  kubectl -n kubernetes-dashboard port-forward svc/kubernetes-dashboard-kong-proxy 8443:443

NOTE: In case port-forward command does not work, make sure that kong service name is correct.
      Check the services in Kubernetes Dashboard namespace using:
        kubectl -n kubernetes-dashboard get svc

Dashboard will be available at:
  https://localhost:8443
```

### 添加ingress资源
+ 创建tls证书

```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout tls.key -out tls.crt -subj "/CN=dashboard.local.com"
```

+ 创建secret资源

```bash
# kubectl create secret tls dashboard-tls --cert=tls.crt --key=tls.key -n kubernetes-dashboard
secret/dashboard-tls created
```

+ 创建ingress（traefik）

<font style="color:rgb(35, 38, 41);">在第二次会话中，Traefik 将验证仪表板的 TLS 证书。</font><font style="color:rgb(35, 38, 41);">当仪表板证书未由 Traefik 列表中的任何 CA 签名时，它会关闭连接，然后仪表板会引发错误消息。</font>  
<font style="color:rgb(35, 38, 41);">如果要使用此方案，则需要跳过仪表板证书验证，或将仪表板证书添加到受信任 CA 的 Traefik 列表中。 以下配置通过跳过仪表板证书验证来工作。</font>

```yaml
apiVersion: traefik.io/v1alpha1
kind: ServersTransport
metadata:
  name: mytransport
  namespace: kubernetes-dashboard
spec:
  serverName: "dashboard.local.com"
  insecureSkipVerify: true
---
apiVersion: traefik.io/v1alpha1
kind: IngressRoute
metadata:
  name: dashboard
  namespace: kubernetes-dashboard
spec:
  entryPoints:
  - websecure
  routes:
  - match: Host(`dashboard.local.com`) # 域名
    kind: Rule
    services:
      - name: kubernetes-dashboard-web  # 与svc的name一致
        port: 8000     # 与svc的port一致
        serversTransport: mytransport
  tls:
    secretName: dashboard-tls       # 指定tls证书名称
```

# Kuboard部署
参考文档：[https://kuboard.cn/v4/install/#%E5%AE%89%E8%A3%85-kubernetes-%E5%A4%9A%E9%9B%86%E7%BE%A4%E7%AE%A1%E7%90%86%E5%B7%A5%E5%85%B7-kuboard-v4](https://kuboard.cn/v4/install/#%E5%AE%89%E8%A3%85-kubernetes-%E5%A4%9A%E9%9B%86%E7%BE%A4%E7%AE%A1%E7%90%86%E5%B7%A5%E5%85%B7-kuboard-v4)

## <font style="color:rgb(44, 62, 80);">创建MySQL数据库</font>
```sql
CREATE DATABASE kuboard DEFAULT CHARACTER SET = 'utf8mb4' DEFAULT COLLATE = 'utf8mb4_unicode_ci';
create user 'kuboard'@'%' identified by 'CHANGE_ME';
grant all privileges on kuboard.* to 'kuboard'@'%';
FLUSH PRIVILEGES;
```

## <font style="color:rgb(44, 62, 80);">启动 Kuboard</font>
```bash
docker run -d \
  --restart=unless-stopped \
  --name=kuboard \
  -p 80:80/tcp \
  -e TZ="Asia/Shanghai" \
  -e DB_DRIVER=com.mysql.cj.jdbc.Driver \
  -e DB_URL="jdbc:mysql://10.99.0.8:3306/kuboard?serverTimezone=Asia/Shanghai" \
  -e DB_USERNAME=kuboard \
  -e DB_PASSWORD= CHANGE_ME \
  swr.cn-east-2.myhuaweicloud.com/kuboard/kuboard:v4
  # eipwork/kuboard:v4
```


