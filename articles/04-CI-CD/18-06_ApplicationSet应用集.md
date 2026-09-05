# ApplicationSet应用集

> 分类：CI/CD / 第18章：ArgoCD应用发布
> 原文：https://www.cuiliangblog.cn/detail/section/174841493
> 来源：崔亮的博客

---

# 简介
Argo CD ApplicationSet 是 Argo CD 的一个高级功能，用于大规模和动态地管理应用程序。它允许你使用一个模板和一些参数来创建和管理多个 Argo CD Application 对象。

## 使用场景
+ 管理多个环境（如开发、测试、生产）
+ 管理多租户应用
+ 部署相同应用的多个实例

通常需要手动创建一个个 Application 配置，单个个 Application 大多数的内容都是一样的，此时使用ApplicationSet 就可以大幅减少配置工作量。

## 工作原理
Argo CD ApplicationSet 使用一个 ApplicationSet CRD（自定义资源定义），该 CRD 包含一个生成器（generator）和一个模板（template）。生成器定义如何生成应用程序参数（例如，从 Git 仓库、集群、列表等），而模板定义了生成的每个应用程序的配置。

## 生成器类型
| 生成器 | 介绍 | 使用场景 |
| --- | --- | --- |
| List 生成器 | 允许手动定义一组静态参数集合，每个集合用于生成一个应用。 | 适用于需要部署固定数量的应用程序，每个应用程序有不同的参数。例如，多个环境（开发、测试、生产）的配置。 |
| Git 生成器 | 根据 Git 仓库中的目录结构动态生成应用程序。它扫描指定的目录路径，并根据每个子目录生成一个应用。 | 适用于按照 Git 仓库结构部署多个应用。例如，每个子目录代表一个微服务或环境配置。 |
| Cluster 生成器 | 根据 Argo CD 中注册的集群列表生成应用程序。它会为每个注册的集群创建一个应用。 | 适用于需要在多个 Kubernetes 集群上部署相同应用的场景。比如在多集群环境中进行应用分发。 |
| Matrix 生成器 | 可以组合多个生成器生成的参数集合。它会创建所有可能的参数组合，每个组合生成一个应用。 | 适用于需要组合不同参数生成复杂应用集合的场景。例如，不同集群和不同环境的组合部署。 |
| SCM Provider 生成器 | 使用 SCM 提供商（如 GitHub、GitLab）的 API 列出仓库、分支或文件夹，根据这些信息生成应用。 | 适用于根据版本控制系统中的资源（如仓库或分支）动态生成应用程序的场景。比如根据所有活跃分支创建开发环境。 |
| Pull Request 生成器 | 根据 SCM 提供商（如 GitHub、GitLab）的 Pull Request 列表生成应用程序。每个 Pull Request 生成一个应用。 | 适用于创建临时环境以测试每个 Pull Request 的场景。例如，CI/CD 流程中为每个 Pull Request 部署一个临时测试环境。 |
| Cluster Decision Resource 生成器 | 根据 Open Cluster Management (OCM) 的 ClusterDecisionResource (CDR) 列表生成应用程序。 | 使用 OCM 管理多个集群，并需要根据集群决策资源动态生成应用程序的场景。 |
| Plugin生成器 | 通过 RPC HTTP 请求来获取生成应用程序所需的参数。它调用外部服务来获取参数集合。 | 适用于需要从外部服务动态获取参数并生成应用程序的场景。例如，根据外部配置管理系统或自定义服务的响应生成应用。 |
| Merge 生成器 | 可以合并两个或多个生成器生成的参数。附加生成器可以覆盖基础生成器的值。 | 适用于需要组合多个来源的数据，并且需要对部分参数进行覆盖的复杂场景。例如，基础参数从一个生成器获取，特定环境或集群的覆盖参数从另一个生成器获取。 |


# List生成器
官方参考文档：[https://argo-cd.readthedocs.io/en/stable/operator-manual/applicationset/Generators-List/](https://argo-cd.readthedocs.io/en/stable/operator-manual/applicationset/Generators-List/)

从元素`elements`列表中生成变量。可以根据需要构建元素列表并使用。ApplicationSet控制器随后将循环该列表以生成变量。

## 前提条件
同时将myapp项目分别发布至dev、test、uat、prod名称空间下。需要注意的是[http://gitlab.cuiliangblog.cn/devops/argo-demo.git](http://gitlab.cuiliangblog.cn/devops/argo-demo.git)仓库manifests 目录下的文件不要设置 namespace，由 argocd 统一管理。

![](assets/04-CI-CD/720f6a635d3ed23b4d07.png)

提前创建 namespace 或者配置 devops 项目具备 namespace 管理权限。

![](assets/04-CI-CD/a6e904d5c2b8963d93ed.png)

## 创建应用集
使用 一份 ApplicationSet，自动在两个不同集群、不同 namespace 下部署相同的一套应用，App资源清单如下：

```yaml
[root@tiaoban application-set]# cat list.yaml 
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  name: applicationset-list
  namespace: argocd
spec:
  generators:
  - list:
      elements:
      - name: prod
        server: https://kubernetes.default.svc
        namespace: prod
      - name: test
        server: https://192.168.10.15:6443
        namespace: test
  template:      
    metadata:
      name: '{{namespace}}-myapp' # 使用动态值列表
    spec:
      project: devops
      source:
        path: manifests
        repoURL: http://gitlab.cuiliangblog.cn/devops/argo-demo.git
        targetRevision: main
      destination:
        server: '{{server}}' # 使用动态值列表
        namespace: '{{namespace}}' # 使用动态值列表
      syncPolicy:
        syncOptions: # 自动创建namespace
          - CreateNamespace=true  
        automated:
          prune: false
          selfHeal: false
[root@tiaoban application-set]# kubectl apply -f list.yaml 
applicationset.argoproj.io/applicationset-list created
```

## 查看验证
创建后查看argoCD dashboard，已经成功在两个集群不同的名称空间下创建了app应用。

![](assets/04-CI-CD/23faec1c16f07e3b89cd.png)

# Cluster生成器
官方参考文档：[https://argo-cd.readthedocs.io/en/stable/operator-manual/applicationset/Generators-Cluster/](https://argo-cd.readthedocs.io/en/stable/operator-manual/applicationset/Generators-Cluster/)

Cluster生成器允许遍历由 `ArgoCD 配置和管理的 Kubernetes 集群`。由于集群是`通过Secret`配置的，ApplicationSet控制器将使用这些 Kubernetes Secret为每个集群生成参数。

集群生成器是一个映射`{}`，默认情况下，以 ArgoCD 配置和管理的所有 Kubernetes 集群为目标，但它还允许您`使用选择器（可以是标签）来定位特定集群`。

+ server:  地址
+ name: cluster名称
+ selector: 通过label选择集群(Secret)
+ values: 添加其他字段,可以通过使用该字段根据目标 Kubernetes 集群添加额外设置，将其他键值对传递给集群生成器。

## 配置集群
## 添加其他集群
具体可参考文档[18-05_%E5%A4%9A%E9%9B%86%E7%BE%A4%E5%BA%94%E7%94%A8%E9%83%A8%E7%BD%B2.md](articles/04-CI-CD/18-05_多集群应用部署.md)，此处不再赘述，添加集群后的效果如下：

![](assets/04-CI-CD/b3f065f448a53c52bf17.png)

## 创建APP(全部集群)
```yaml
[root@tiaoban application-set]# cat cluster.yaml 
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  name: applicationset-cluster
  namespace: argocd
spec:
  generators:
  - clusters: {} # 全部集群部署
  template:      
    metadata:
      name: '{{name}}-myapp'  ## name值就是clustername(prod, test)
    spec:
      project: devops
      source:
        path: manifests
        repoURL: http://gitlab.cuiliangblog.cn/devops/argo-demo.git
        targetRevision: main
      destination:
        server: '{{server}}'   # server值就是cluster集群的地址
        namespace: default     # 部署到default名称空间
      syncPolicy:
        syncOptions: # 自动创建namespace
          - CreateNamespace=true  
        automated:
          prune: false
          selfHeal: false
[root@tiaoban application-set]# kubectl apply -f cluster.yaml 
applicationset.argoproj.io/applicationset-cluster created
```

查看部署信息，分别在 prod 和 test 集群创建了集群名-myapp 的应用。

![](assets/04-CI-CD/97a0a28d8e85bfdbc194.png)

## 添加集群标签
有时候我们并不需要所有集群都部署应用，我们可以通过标签选择器，让拥有指定标签的集群部署应用，例如只让具有prod=true标签的集群部署应用。

修改集群配置，新增 env=prod 的标签

![](assets/04-CI-CD/139fe9bb0852c7337077.png)

## 创建APP(指定标签)
```yaml
[root@tiaoban application-set]# cat cluster.yaml 
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  name: applicationset-cluster
  namespace: argocd
spec:
  generators:
  - clusters:
      selector:
        matchLabels: # 筛选指定标签
          env: "prod"
  template:      
    metadata:
      name: '{{name}}-myapp'  ## name值就是clustername(prod, test)
    spec:
      project: devops
      source:
        path: manifests
        repoURL: http://gitlab.cuiliangblog.cn/devops/argo-demo.git
        targetRevision: main
      destination:
        server: '{{server}}'   # server值就是cluster集群的地址
        namespace: default     # 部署到default名称空间
      syncPolicy:
        syncOptions: # 自动创建namespace
          - CreateNamespace=true  
        automated:
          prune: false
          selfHeal: false
[root@tiaoban application-set]# kubectl apply -f cluster.yaml 
applicationset.argoproj.io/applicationset-cluster created
```

查看验证

![](assets/04-CI-CD/fb15d8bece1ba19ebb46.png)

# Git生成器
参考文档：[https://argo-cd.readthedocs.io/en/stable/operator-manual/applicationset/Generators-Git/](https://argo-cd.readthedocs.io/en/stable/operator-manual/applicationset/Generators-Git/)

Git 生成器包含两个子类型：Git 目录生成器和 Git 文件生成器，可以根据git仓库的目录或文件作为参数传递到模板中。

## 目录生成器
在apps目录下分别创建两个目录，分别存放生产和测试环境的yaml文件

![](assets/04-CI-CD/7b305e6125b9c22b87fc.png)

目录结构如下：

```bash
# tree application-set 
application-set
└── myapp
    ├── prod
    │   └── deployment.yaml
    └── test
        └── deployment.yaml
```

创建APP，内容如下，通过不同的目录名创建不同的app。

```yaml
[root@tiaoban application-set]# kubectl apply -f git-dir.yaml 
applicationset.argoproj.io/applicationset-git-dir created
[root@tiaoban application-set]# cat git-dir.yaml 
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  name: applicationset-git-dir
  namespace: argocd
spec:
  generators:
  - git:
      repoURL: http://gitlab.cuiliangblog.cn/devops/argo-demo.git
      revision: HEAD
      directories:
      - path: application-set/myapp/* # 扫描路径
  template:      
    metadata:
      name: 'myapp-{{path.basename}}' # myapp-目录名称（prod,test）
    spec:
      project: devops
      source:
        repoURL: http://gitlab.cuiliangblog.cn/devops/argo-demo.git
        targetRevision: main
        path: '{{path}}'  # 完整的路径(application-set/myapps/prod或test)
      destination:
        server: https://kubernetes.default.svc
        namespace: '{{path.basename}}' # 目录名称
      syncPolicy:
        syncOptions:
          - CreateNamespace=true  
        automated:
          prune: false
          selfHeal: false
```

效果如下所示，分别在 prod 和 test 名称空间创建了两个myapp应用。

![](assets/04-CI-CD/000d3080778b0b1f4be5.png)

git 目录生成器可以使用的变量如下

| 变量名 | 含义 | 示例值 |
| --- | --- | --- |
| `{{path}}` | 目录的完整相对路径（相对仓库根目录） | `apps/backend` |
| `{{path.basename}}` | 目录的最后一层名称 | `backend` |
| `{{path.dirname}}` | 父目录路径 | `apps` |
| `{{path.basenameNormalized}}` | basename 中的特殊字符替换为 `-`（如 `/`、`_`、`.`） | `backend` |
| `{{revision}}` | 当前扫描的 Git 分支或标签 | `main` |
| `{{repoURL}}` | 当前仓库 URL | `https://gitlab.example.com/devops/gitops.git` |


## 文件生成器
在config目录下分别创建 dev、prod、test 目录，模拟不同环境下的配置文件。

![](assets/04-CI-CD/d574bd3f92e653722659.png)  
文件内容可以是 json 或者 yaml 文件格式，以 json 为例，内容和目录结构如下

```yaml
[root@tiaoban application-set]# tree application-set/config 
application-set/config
├── dev
│   └── config.json
├── prod
│   └── config.json
└── test
    └── config.json

3 directories, 3 files
[root@tiaoban application-set]# cat config/dev/config.json 
{
    "name": "myapp-dev",
    "config": {
        "server": "https://192.168.10.15:6443",
        "namespace": "dev"
    }
}
[root@tiaoban application-set]# cat config/test/config.json
{
    "name": "myapp-prod",
    "config": {
        "server": "https://192.168.10.15:6443",
        "namespace": "prod"
    }
}
[root@tiaoban application-set]# cat config/prod/config.json
{
    "name": "myapp-test",
    "config": {
        "server": "https://kubernetes.default.svc",
        "namespace": "test"
    }
}
```

创建APP，内容如下，通过不同的配置文件创建不同的app。

```yaml
[root@tiaoban application-set]# kubectl apply -f git-file.yaml 
applicationset.argoproj.io/applicationset-git-file created
[root@tiaoban application-set]# cat git-file.yaml 
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  name: applicationset-git-file
  namespace: argocd
spec:
  generators:
  - git:
      repoURL: http://gitlab.cuiliangblog.cn/devops/argo-demo.git
      revision: HEAD
      files:
      - path: "application-set/config/**/config.json"
  template:      
    metadata:
      name: '{{name}}' # config.json文件name字段内容(myapp-prod,myapp-test)
    spec:
      project: default
      source:
        repoURL: http://gitlab.cuiliangblog.cn/devops/argo-demo.git
        targetRevision: main
        path: manifests
      destination:
        server: '{{config.server}}' # config.json文件config.server字段内容
        namespace: '{{config.namespace}}' # config.json文件config.namespace字段内容(prod,test)
      syncPolicy:
        syncOptions:
          - CreateNamespace=true  
        automated:
          prune: false
          selfHeal: false
```

效果如下所示，分别创建了 dev、test、prod 的 myapp应用。

![](assets/04-CI-CD/c763fa8c8da0ea9f7887.png)

# Matrix 生成器
参考文档：[https://argo-cd.readthedocs.io/en/stable/operator-manual/applicationset/Generators-Matrix/](https://argo-cd.readthedocs.io/en/stable/operator-manual/applicationset/Generators-Matrix/)

Matrix 生成器组合了两个子生成器生成的参数，迭代每个生成器生成的参数的每个组合。

通过组合两个生成器参数来生成每种可能的组合，这使您能够获得两个生成器的内在属性。使用场景案例：

+ SCM Provider Generator + Cluster Generator：扫描 GitHub 组织的存储库以获取应用程序资源，并将这些资源定位到所有可用集群。
+ Git File Generator + List Generator：提供要通过配置文件部署的应用程序列表，以及可选的配置选项，并将它们部署到固定的集群列表。
+ Git Directory Generator + Cluster Decision Resource Generator：找到 Git 存储库的文件夹中包含的应用程序资源，并将它们部署到通过外部自定义资源提供的集群列表。

## git目录生成器+cluster生成器
将上述案例中的2个git目录和2个cluster进行组合，共生成4个应用。

创建APP，内容如下，通过不同的配置文件创建不同的app。

```yaml
[root@tiaoban application-set]# kubectl apply -f git-dir-cluster.yaml
applicationset.argoproj.io/applicationset-git-dir created
[root@tiaoban application-set]# cat git-dir-cluster.yaml
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  name: applicationset-git-dir-cluster
  namespace: argocd
spec:
  generators:
  - matrix:
      generators:
      - git: # git目录生成器，myapp目录下共有2个应用
          repoURL: http://gitlab.cuiliangblog.cn/devops/argo-demo.git
          revision: HEAD
          directories:
          - path: application-set/myapp/* # 扫描路径
      - clusters: {} # cluster生成器，共有2个集群
  template:      
    metadata:
      name: 'cluster.{{name}}-ns.{{path.basename}}' # clustername(prod、test)与目录名称（myapp1,myapp2）组合
    spec:
      project: devops
      source:
        repoURL: http://gitlab.cuiliangblog.cn/devops/argo-demo.git
        targetRevision: main
        path: '{{path}}'  # 完整的路径(application-set/myapps/prod或test)
      destination:
        server: '{{server}}' # cluster生成器的集群地址
        namespace: '{{path.basename}}' # git目录生成器的目录名称
      syncPolicy:
        syncOptions:
          - CreateNamespace=true  
        automated:
          prune: false
          selfHeal: false
```

效果如下所示，分别在prod和test集群创建了2个myapp应用。

![](assets/04-CI-CD/eb30d2ef0173d05e9ab3.png)


