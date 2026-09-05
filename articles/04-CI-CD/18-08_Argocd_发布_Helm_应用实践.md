# Argocd 发布 Helm 应用实践

> 分类：CI/CD / 第18章：ArgoCD应用发布
> 原文：https://www.cuiliangblog.cn/detail/section/256585935
> 来源：崔亮的博客

---

# 项目描述
## 项目背景
在实际业务中，不同部门或项目往往需要部署**同一套应用逻辑**，但在以下方面存在差异：

+ 镜像版本
+ 副本数与资源规格
+ 配置文件（ConfigMap）
+ 自动扩缩容策略（HPA）
+ Service 暴露方式
+ Ingress 路由

如果每个项目单独维护一套 YAML，不仅重复劳动多，而且**配置漂移严重、难以统一管理**。  
因此，本项目通过 **Helm + Argo CD** 的方式，对应用进行标准化封装和 GitOps 化管理。

## 项目目标
+ 将 `myapp` 应用的 Kubernetes 资源进行 **Helm Chart 标准化封装**
+ 通过 `values.yaml` 实现 **多部门 / 多环境差异化配置**
+ 使用 **Argo CD** 实现应用的**声明式发布、自动同步和可视化管理**

# **Helm Chart 标准化封装**
## 封装 charts
具体参考可参考文档[../06_Kubernetes/15-04_%E8%87%AA%E5%AE%9A%E4%B9%89Charts.md](articles/06-Kubernetes/15-04_自定义Charts.md)，封装后的 charts 目录结构如下：

```bash
# tree charts      
charts
└── myapp
    ├── Chart.yaml
    ├── README.md
    ├── templates
    │   ├── configmap.yaml
    │   ├── deployment.yaml
    │   ├── _helpers.tpl
    │   ├── hpa.yaml
    │   ├── ingressroute.yaml
    │   ├── NOTES.txt
    │   └── service.yaml
    └── values.yaml
```

将该仓库推送到 gitlab 仓库，方便进行版本和配置文件管理

![](assets/04-CI-CD/dfe813cd740ed2c3d73e.png)

## 推送 Harbor 仓库
具体参考可参考文档[../06_Kubernetes/15-06_helm%E4%B8%8A%E4%BC%A0%E5%88%B0harbor_chart.md](articles/06-Kubernetes/15-06_helm上传到harbor_chart.md)，推送到 harbor 仓库后效果如下：

![](assets/04-CI-CD/84c4b21987ab7ccf6ccc.png)

# ArgoCD 创建项目与仓库
## 创建仓库
我们先创建 charts 仓库，需要注意的是 charts 仓库可能多个项目都要使用到，所以此处不要指定所属的项目，配置如下：

![](assets/04-CI-CD/85a89cad54e62f0350e9.png)

![](assets/04-CI-CD/3fdf3c2c2a0909e5e89d.png)

接下来先创建空白的 gitlab 仓库，地址分别是：  
http://gitlab.cuiliangblog.cn/gitops/argocd-root.git 和  
http://gitlab.cuiliangblog.cn/gitops/infra.git

仓库创建完成后效果如下：

![](assets/04-CI-CD/74e4f6d64453ab8a9239.png)

## 创建项目
创建一个名为 infra 的项目，用于基础设施部门部署文件使用，配置如下：

![](assets/04-CI-CD/e68e57af948facdc86c5.png)

![](assets/04-CI-CD/86e80048f91b23a081c5.png)

![](assets/04-CI-CD/81735172488cb8a72455.png)

# 创建 App of Apps 资源
## 创建 infra 仓库文件
infra 仓库用于存放 infra 项目相关的部署和配置文件，我们通过 yaml 方式管理 argocd 的 application 资源。

接下来模拟实际工作环境中，infra （基础设施部门）需要部署 myapp 应用，部署信息如下：

| 部署集群 | 名称空间 | 副本数 | 服务路由 |
| --- | --- | --- | --- |
| <font style="color:rgb(51, 51, 51);">k8s生产集群</font> | <font style="color:rgb(51, 51, 51);">infra</font> |  2 | prod.infra.cuiliangblog.cn |
| <font style="color:rgb(51, 51, 51);">k8s测试集群</font> | <font style="color:rgb(51, 51, 51);">infra</font> | 1 | test.infra.cuiliangblog.cn |


infra 仓库目录结构如下：

```bash
# tree infra 
infra
├── applications 
│   ├── prod
│   │   └── myapp.yaml # 生产环境配置
│   └── test
│       └── myapp.yaml # 测试环境配置
└── README.md # 说明文件
```

其中生产环境配置如下:

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: infra-prod-myapp      # 应用名称，可自定义
  namespace: argocd           # 注意：Application 必须部署在 argocd 命名空间
spec:
  project: infra             # 绑定到的 ArgoCD Project 名称
  source:
    repoURL: harbor.cuiliangblog.cn/helm-charts # harbor 仓库地址
    targetRevision: 0.1.0 # helm charts包版本
    chart: myapp # charts包名称
    helm:
      releaseName: infra-prod # 资源名称
      values: |- # 自定义资源值
        replicas:  2
        image: harbor.cuiliangblog.cn/myapp/myapp:v1
        ingressroute:
          match: "Host(`prod.infra.cuiliangblog.cn`)"
  destination:
    name: prod-cluster    # 目标集群（本集群）
    namespace: infra                         # 部署到的命名空间
  syncPolicy:
    syncOptions:
      - CreateNamespace=true                 # 若目标命名空间不存在则自动创建

```

测试环境配置如下:

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: infra-test-myapp      # 应用名称，可自定义
  namespace: argocd           # 注意：Application 必须部署在 argocd 命名空间
spec:
  project: infra             # 绑定到的 ArgoCD Project 名称
  source:
    repoURL: harbor.cuiliangblog.cn/helm-charts
    targetRevision: 0.1.0
    chart: myapp
    helm:
      releaseName: infra-prod
      values: |-
        replicas: 1
        image: harbor.cuiliangblog.cn/myapp/myapp:v1
        ingressroute:
          match: "Host(`test.infra.cuiliangblog.cn`)"
  destination:
    name: test-cluster    # 目标集群
    namespace: infra                         # 部署到的命名空间
  syncPolicy:
    automated:                               # 启用自动同步
      prune: true                            # 自动删除 Git 中已移除的资源
      selfHeal: true                         # 自动修复偏离集群状态的资源
    syncOptions:
      - CreateNamespace=true                 # 若目标命名空间不存在则自动创建
```

创建完成后将文件推送到 infra 仓库

![](assets/04-CI-CD/bc4d4611e665e6c76306.png)

## 创建<font style="color:rgb(24, 23, 29);">argocd-root 仓库文件</font>
我们通过 app-of-apps 方式管理项目，后续更新或者新增项目时，只需要维护改仓库即可。

argocd-root 仓库目录结构如下：

```yaml
# tree argocd-root                              
argocd-root
├── apps
│   └── infra.yaml # infra项目部署文件根应用
├── README.md # 说明文件
└── root-app.yaml # 根应用
```

root-app.yaml 文件内容如下：

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: argocd-root # 顶层 Application 的名称
  namespace: argocd  # Application 资源创建在 Argo CD 命名空间
  labels:
    app-type: root
  annotations:
    argocd.argoproj.io/sync-options: SkipPrune=true
  finalizers: []     # 禁止删除资源
spec:
  project: default # 指定属于哪个 Argo CD Project（权限/命名空间范围）
  source:
    repoURL: http://gitlab.cuiliangblog.cn/gitops/argocd-root.git # 仓库地址
    targetRevision: HEAD # 要拉取的分支
    path: apps         # Git 仓库中子 Application YAML 文件所在目录
  destination:
    server: https://kubernetes.default.svc # 部署到当前集群
    namespace: argocd # Application 对象本身存放的命名空间
  syncPolicy: # 自动同步策略
    automated:
      prune: true # 当 Git 仓库里删掉某个资源时，Argo CD 会自动删除集群中的对应资源；
      selfHeal: true # 当集群状态偏离 Git（例如被手动修改），Argo CD 会自动恢复为 Git 定义的状态；
```

infra.yaml 文件内容如下：

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: infra-root # 顶层 Application 的名称
  namespace: argocd  # Application 资源创建在 Argo CD 命名空间
  labels:
    app-type: root
  annotations:
    argocd.argoproj.io/sync-options: SkipPrune=true
spec:
  project: infra # 指定属于哪个 Argo CD Project（权限/命名空间范围）
  source:
    repoURL: http://gitlab.cuiliangblog.cn/gitops/infra.git # 仓库地址
    targetRevision: HEAD # 要拉取的分支
    path: applications      # Git 仓库中子 Application YAML 文件所在目录
    directory:
      recurse: true # 递归扫描目录下的Application文件
      jsonnet: {} # 递归查找子目录中的 Jsonnet 文件并渲染成 Kubernetes YAML
  destination:
    server: https://kubernetes.default.svc # 部署到当前集群
    namespace: argocd # Application 对象本身存放的命名空间
  syncPolicy:
    automated:
      prune: false # 不自动删除 Git 中不存在的资源
      selfHeal: false # 不自动修复被集群修改的资源，使其与 Git 同步
```

创建完成后将仓库推送到 gitlab

![](assets/04-CI-CD/f6b6d4c09e83e28408f5.png)

# 初始化应用与验证
## 初始化应用
一切准备继续后，接下来我们根据 argocd-root 仓库的root-app.yaml 文件创建第一个应用

```yaml
# kubectl apply -f root-app.yaml                            
application.argoproj.io/argocd-root configured
```

## 查看应用列表
登录 argocd，可以看到已经自动创建了 argocd-root 、infra-root、infra-prod-myapp、infra-test-myapp 应用。

其中 infra-prod-myapp 应用用于未开启自动同步，因此状态为 missing。

![](assets/04-CI-CD/8093d8bae7e879809a8a.png)

## 更新服务验证
接下来更新 infra-test 应用镜像 tag，模拟生产环境版本更新

![](assets/04-CI-CD/500402e535ea649a4dfe.png)

此时查看 argocd 应用信息，镜像 tag 已经更新到 v2。

![](assets/04-CI-CD/e75a14ee3b50cb831f98.png)


