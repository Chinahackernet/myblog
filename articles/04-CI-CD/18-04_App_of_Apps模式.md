# App of Apps模式

> 分类：CI/CD / 第18章：ArgoCD应用发布
> 原文：https://www.cuiliangblog.cn/detail/section/174841631
> 来源：崔亮的博客

---

# 简介
## 概念介绍
"App of Apps" 模式是指在 Argo CD 中创建一个父应用（App），这个父应用负责管理多个子应用（Apps）。每个子应用可以代表一个具体的应用程序或微服务。父应用定义了子应用的 Git 仓库位置和相关配置，当父应用被部署或更新时，Argo CD 会自动同步和管理所有子应用。

## 使用场景
+ **微服务架构**：每个微服务作为一个独立的子应用，通过父应用进行统一管理。
+ **多环境管理**：不同环境（如开发、测试、生产）的配置作为不同的子应用，通过父应用进行环境切换和配置管理。
+ **分层部署**：将复杂的应用拆分为多个模块，每个模块作为一个子应用进行管理。
+ **GitOps： **通过 Git 中的 YAML 定义 Application 对象，由 Argo CD 自动同步，实现Argo CD Application 的创建自动化。

# 创建 App of Apps
## 文件目录结构与内容
将app-of-apps目录推送至argo demo仓库，此时文件目录结构如下，其中root-app为父app，app1和2为子app。

```bash
app-of-apps
├── app1
│   ├── deployment.yaml
│   ├── ingress.yaml
│   └── svc.yaml
├── app2
│   ├── deployment.yaml
│   ├── ingress.yaml
│   └── svc.yaml
└── root-app
    └── applications.yaml
```

+ applications.yaml

```bash
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: app1 # 子app1
  namespace: argocd
spec:
  project: default
  source:
    repoURL: 'http://gitlab.local.com/devops/argo-demo.git' # 子app的仓库以及目录
    path: 'app-of-apps/app1'
    targetRevision: HEAD
  destination:
    server: 'https://kubernetes.default.svc'
    namespace: default
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
---
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: app2
  namespace: argocd
spec:
  project: default
  source:
    repoURL: 'http://gitlab.local.com/devops/argo-demo.git'
    path: 'app-of-apps/app2'
    targetRevision: HEAD
  destination:
    server: 'https://kubernetes.default.svc'
    namespace: default
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
```

两个子app只需要更改资源名称、镜像名称即可。

+ deployment.yaml

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp1
spec:
  selector:
    matchLabels:
      app: myapp1
  template:
    metadata:
      labels:
        app: myapp1
    spec:
      containers:
      - name: myapp1
        image: ikubernetes/myapp:v1
        resources:
          limits:
            memory: "128Mi"
            cpu: "500m"
        ports:
        - containerPort: 80
```

+ svc.yaml

```yaml
apiVersion: v1
kind: Service
metadata:
  name: myapp1
spec:
  type: ClusterIP
  selector:
    app: myapp1
  ports:
  - port: 80
    targetPort: 80
```

+ ingress.yaml

```yaml
apiVersion: traefik.containo.us/v1alpha1
kind: IngressRoute
metadata:
  name: myapp1
spec:
  entryPoints:
  - web
  routes:
  - match: Host(`myapp1.local.com`) # 域名
    kind: Rule
    services:
      - name: myapp1  # 与svc的name一致
        port: 80      # 与svc的port一致
```

## 创建APP
```yaml
[root@tiaoban argocd]# cat app-of-apps.yaml 
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: myapps
  namespace: argocd
spec:
  project: default
  source:
    repoURL: 'http://gitlab.local.com/devops/argo-demo.git'
    path: 'app-of-apps/root-app' # 指向父app仓库目录
    targetRevision: HEAD
  destination:
    server: 'https://kubernetes.default.svc'
    namespace: argocd
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
```

## 查看验证
此时查看ArgoCD dashboard，已经创建了一个父app和两个子app。

![](assets/04-CI-CD/c38cfb6f1d4d680d1e79.png)

查看部署资源信息，已成功创建两个app以及相关资源。

```bash
[root@tiaoban argocd]# kubectl get pod
NAME                      READY   STATUS    RESTARTS       AGE
myapp1-f486545bd-fdqcc    1/1     Running   0              6m22s
myapp2-6c5bbccf65-7lk26   1/1     Running   0              6m21s
[root@tiaoban argocd]# kubectl get svc
NAME         TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)    AGE
kubernetes   ClusterIP   10.96.0.1        <none>        443/TCP    283d
myapp1       ClusterIP   10.96.154.132    <none>        80/TCP     6m26s
myapp2       ClusterIP   10.105.126.196   <none>        80/TCP     6m25s
[root@tiaoban argocd]# kubectl get ingressroute
NAME     AGE
myapp1   6m31s
myapp2   6m30s
```


