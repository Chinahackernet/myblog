## 配置webhook加速CD过程

Argo CD每三分钟轮询一次Git存储库，以检测清单的变化。为了消除轮询带来的延迟，可以将API服务器配置为接收Webhook事件。Argo CD支持来自GitHub，GitLab，Bitbucket，Bitbucket Server和Gogs的Git Webhook通知，更多点击[官网](https://argoproj.github.io/argo-cd/operator-manual/webhook/#2-configure-argo-cd-with-the-webhook-secret-optional)。

  

这里使用Gitlab作为仓库地址。

  

（1）在argocd中配置webhook token

使用`kubectl edit secret argocd-secret -n argocd`命令进行配置：

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: argocd-secret
  namespace: argocd
type: Opaque
data:
...

stringData:
  # gitlab webhook secret
  webhook.gitlab.secret: coolops
```

  

配置完点击保存会自动生成一个secret，如下：

```yaml
# kubectl describe secret argocd-secret -n argocd
Name:         argocd-secret
Namespace:    argocd
Labels:       app.kubernetes.io/name=argocd-secret
              app.kubernetes.io/part-of=argocd
Annotations:  
Type:         Opaque

Data
====
admin.passwordMtime:    20 bytes
server.secretkey:       44 bytes
tls.crt:                1237 bytes
tls.key:                1679 bytes
webhook.gitlab.secret:  7 bytes
admin.password:         60 bytes
```

（2）在gitlab的代码仓库配置webhook，如下：

![image.png](assets/devops与交付/Argocd使用优化/Argocd使用优化-1.png)

由于集群内部证书是无效证书，所有要把Enabled SSL去掉，如下：

![image.png](assets/devops与交付/Argocd使用优化/Argocd使用优化-2.png)

然后点击保存，点击测试，看是否链接成功。如果有如下提示则表示webhook配置没问题了。

![image.png](assets/devops与交付/Argocd使用优化/Argocd使用优化-3.png)

现在可以进行修改gitlab仓库，观察是否一提交，argocd那边就可以响应了。

  

  

  

## 配置监控

集群监控Prometheus是通过Prometheus-operator部署的，所以直接创建两个serviceMonitor即可，如下：

```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: argocd-metrics
  namespace: monitoring
  labels:
    k8s-app: prometheus-operator
spec:
  selector:
    matchLabels:
      app.kubernetes.io/name: argocd-metrics
      app.kubernetes.io/component: metrics
  endpoints:
  - port: metrics
    interval: 30s
    scheme: http
  namespaceSelector:
    matchNames:
    - argocd
---
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: argocd-server-metrics
  namespace: monitoring
  labels:
    k8s-app: prometheus-operator
spec:
  selector:
    matchLabels:
      app.kubernetes.io/name: argocd-server-metrics
  endpoints:
  - port: metrics
    interval: 30s
    scheme: http
  namespaceSelector:
    matchNames:
    - argocd
```

然后可以在Prometheus的UI界面查看是否监控成功，如下即为成功。

![image.png](assets/devops与交付/Argocd使用优化/Argocd使用优化-4.png)

  

然后在Grafana上导入以下[json](https://raw.githubusercontent.com/argoproj/argo-cd/master/examples/dashboard.json)内容，即可在面板查看信息：

![image.png](assets/devops与交付/Argocd使用优化/Argocd使用优化-5.png)