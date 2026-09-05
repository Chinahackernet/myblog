# 部署Traefik代理

> 分类：Kubernetes / 第3章：周边组件安装部署
> 原文：https://www.cuiliangblog.cn/detail/section/140101250
> 来源：崔亮的博客

---

> ingress-NGINX和traefik二选一
>

# 参考文档
官方文档：[https://doc.traefik.io/traefik/getting-started/install-traefik/](https://doc.traefik.io/traefik/getting-started/install-traefik/)

gtihub地址：[https://github.com/traefik/traefik-helm-chart](https://github.com/traefik/traefik-helm-chart)

# 必要条件
Kubernetes版本1.14+

Helm版本3+

# 安装traefik
```bash
# 添加repo
[root@k8s-master ~]# helm repo add traefik https://helm.traefik.io/traefik
# 更新repo仓库资源
[root@k8s-master ~]# helm repo update
# 查看repo仓库traefik
[root@k8s-master ~]# helm search repo traefik                                    
NAME                    CHART VERSION   APP VERSION     DESCRIPTION                                       
traefik/traefik         29.0.1          v3.0.4          A Traefik based Kubernetes ingress controller     
traefik/traefik-hub     4.2.0           v2.11.0         Traefik Hub Ingress Controller                    
traefik/traefik-mesh    4.1.1           v1.4.8          Traefik Mesh - Simpler Service Mesh               
traefik/traefikee       4.0.1           v2.11.3         Traefik Enterprise is a unified cloud-native ne...
traefik/maesh           2.1.2           v1.3.2          Maesh - Simpler Service Mesh[root@k8s-master ~]# kubectl create ns traefik
# 拉取helm包
[root@k8s-master ~]# helm pull traefik/traefik --untar
# 修改配置
[root@k8s-master ~]# cd traefik/
[root@k8s-master traefik]# vim values.yaml 
deployment:
  replicas: 1 # master节点数

# Configure ports
ports:
  traefik:
    port: 8080
    hostPort:  8080 # 使用 hostport 模式
  web:
    port: 8000
    hostPort: 80  # 使用 hostport 模式
  websecure:
    port: 8443
    hostPort: 443  # 使用 hostport 模式

service:  # 使用 hostport 模式就不需要Service了
  enabled: false

logs:
  general:
    level: DEBUG # 开启debug调试模式

nodeSelector:   # 固定到master1节点（该节点才可以访问外网）
  kubernetes.io/hostname: "k8s-master"
  
tolerations:   # kubeadm 安装的集群默认情况下master是有污点，需要容忍这个污点才可以部署
- key: "node-role.kubernetes.io/master"
  operator: "Equal"
  effect: "NoSchedule"



metrics:
  service:
    enabled: true # 开启metrics指标暴露
logs:
  access:
    enabled: true # 启用access访问日志记录
    format: json # 输出json格式
  fields:
    headers:
      defaultmode: keep # 保留请求头信息
# 安装
[root@k8s-master traefik]# helm install traefik -n traefik . -f values.yaml
NAME: traefik
LAST DEPLOYED: Mon Aug 14 13:11:04 2023
NAMESPACE: traefik
STATUS: deployed
REVISION: 1
TEST SUITE: None
NOTES:
Traefik Proxy v2.10.4 has been deployed successfully on traefik namespace !

# 查看helm列表
[root@k8s-master traefik]# helm list -n traefik
NAME    NAMESPACE       REVISION        UPDATED                                 STATUS          CHART           APP VERSION
traefik traefik         1               2023-08-14 13:11:04.879891529 +0800 CST deployed        traefik-24.0.0  v2.10.4    
# 查看pod资源信息
[root@k8s-master traefik]# kubectl get pod -n traefik
NAME                       READY   STATUS    RESTARTS   AGE
traefik-5bfc574f88-vz4zr   1/1     Running   0          65s
```

如果需要将所有 http 请求强制转为 https，修改如下配置

```yaml
ports:
  web:
    redirections:
      entryPoint:
        to: websecure
        scheme: https
        permanent: true
```

# 域名访问dashboard服务
添加dashboard的IngressRoute资源：`kubectl apply -f dashboard.yaml`

```yaml
apiVersion: traefik.containo.us/v1alpha1
kind: IngressRoute
metadata:
  name: dashboard
  namespace: traefik
spec:
  entryPoints:
    - web
  routes:
    - match: Host(`traefik.local.com`)
      kind: Rule
      services:
        - name: api@internal
          kind: TraefikService
```

如果是traefik3以上版本，ingress资源如下

```yaml
apiVersion: traefik.io/v1alpha1
kind: IngressRoute
metadata:
  name: dashboard
  namespace: traefik
spec:
  entryPoints:
    - web
  routes:
    - match: Host(`traefik.local.com`)
      kind: Rule
      services:
        - name: api@internal
          kind: TraefikService
```

接下来使用集群外部机器访问，添加hosts解析

```yaml
192.168.10.100 traefik.local.com
```

![](assets/06-Kubernetes/3115845c928c86d89125.png)


