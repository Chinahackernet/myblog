# Application管理最佳实践

> 分类：CI/CD / 第18章：ArgoCD应用发布
> 原文：https://www.cuiliangblog.cn/detail/section/241726007
> 来源：崔亮的博客

---

# 应用管理介绍
之前的教程中，所有 Application 的创建管理都是在 web 页面或者通过 yaml 文件管理。但是在实际生产环境中，所有 Application 的创建和更新也应该要通过 gitops 流程进行发布与版本管理，而不是手动的去创建一个又一个 Application。

## 最佳实践
最佳实践是让 ArgoCD 自动监听 Git 仓库中的 Application YAML 文件，一旦有新增或修改，就自动创建或更新对应的应用。  

这样配置后，你只需要：

1. 编写 Application YAML
2. 推送到 Git
3. 其他全部自动完成！

从而实现了 GitOps 的声明式自动化管理！

## 场景举例
假设我们是一家中大型的AI公司，需要使用GitLab 管理研发、运维、模型和数据项目。gitlab 层级关系设计如下：

Group：infra（基础设施组）

+ cmdb（运维平台代码仓库）

Group：model（模型训练与推理组）

+ project：vllm（推理服务代码仓库）

Group：product（产品线组）

+ project：backend（产品后端代码仓库）
+ project：frontend（产品前端代码仓库）

现在需要对所有项目通过 gitops 实现统一发布管理，但是每个用户组只能管理并发布自己组下的应用。

## 环境准备
### 创建部署文件项目
依次创建 infra、model、product群组，并新建相关的项目，以cmdb-deploy 项目为例，内容如下：

![](assets/04-CI-CD/23029e4ea4d03ac1f842.png)

其他 XXX-deploy 项目内容也是如此，我们可以提前规定所有部署文件必须位于项目根目录的manifests 目录下（也可以根据不同项目灵活指定，此处只是规范建议）

### 创建 project
依次创建 infra、model、product 项目，并记得给 project 授予创建 k8s 的 namespace 资源权限。

![](assets/04-CI-CD/fe3d487f8384d6ba8984.png)

### 创建 repo
依次添加cmdb-deploy、vllm-deploy、backend-deploy、frontend-deploy 项目。

![](assets/04-CI-CD/47bec03c12dbd026d870.png)

至此，准备工作已经就绪，接下来开始通过 gitops 方式管理 Application 应用。

# App of Apps 方式
## 实现原理与步骤
在上线新项目的时候，创建一个对应的 Application 配置仓库。

该仓库的根目录下创建一个“父级 Application”，它指向一个 Git 路径（例如 `apps/` 目录），  
该路径下包含多个子 `Application`的 YAML，例如前端、后端、生产、测试环境配置。  
ArgoCD 同步父 App 时，就会自动创建/更新所有子 App。  

## gitlab 项目结构
创建 gitlab 项目，内容如下

![](assets/04-CI-CD/dff4e06d4c1045d04c81.png)

### 目录结构
需要注意的是App of Apps 模式默认扫描该路径下的 YAML 是 Application 对象， 不会去递归扫描子目录 。  

```bash
# tree .
.
├── apps
│   ├── infra.yaml
│   └── model.yaml
└── root-app.yaml
```

### 父应用定义（root-app.yaml）
 一个顶层 `Application`，它指向一个 Git 仓库目录。

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: app-of-apps # 顶层 Application 的名称
  namespace: argocd  # Application 资源创建在 Argo CD 命名空间
spec:
  project: devops # 指定属于哪个 Argo CD Project（权限/命名空间范围）
  source:
    repoURL: http://gitlab.cuiliangblog.cn/devops/gitops-app-of-apps.git # 仓库地址
    targetRevision: main # 要拉取的分支
    path: apps         # Git 仓库中子 Application YAML 文件所在目录
    directory:
      recurse: true # 递归扫描目录下的Application文件
      jsonnet: {} # 递归查找子目录中的 Jsonnet 文件并渲染成 Kubernetes YAML
  destination:
    server: https://kubernetes.default.svc # 部署到当前集群
    namespace: argocd # Application 对象本身存放的命名空间
  syncPolicy: # 自动同步策略
    automated:
      prune: true # 当 Git 仓库里删掉某个资源时，Argo CD 会自动删除集群中的对应资源；
      selfHeal: true # 当集群状态偏离 Git（例如被手动修改），Argo CD 会自动恢复为 Git 定义的状态；
```

### 子应用定义（各 Application）
 该目录下再存放多个子 `Application` 的 YAML 文件。  

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: cmdb            # 应用名称，可自定义
  namespace: argocd           # 注意：Application 必须部署在 argocd 命名空间
spec:
  project: infra             # 绑定到的 ArgoCD Project 名称
  source:
    repoURL: http://gitlab.cuiliangblog.cn/infra/cmdb-deploy.git   # 代码仓库地址
    targetRevision: HEAD                                         # 分支（HEAD=默认分支）
    path: manifests                                              # 仓库内 YAML/Helm 文件路径
  destination:
    server: https://kubernetes.default.svc   # 目标集群（本集群）
    namespace: default                       # 部署到的命名空间
  syncPolicy:
    automated:                               # 启用自动同步
      prune: true                            # 自动删除 Git 中已移除的资源
      selfHeal: true                         # 自动修复偏离集群状态的资源
    syncOptions:
      - CreateNamespace=true                 # 若目标命名空间不存在则自动创建
```

## argocd 创建应用
### 添加 repo
![](assets/04-CI-CD/bc97cb821b9bf939d47a.png)

### 部署父应用
```yaml
# ls
apps  root-app.yaml
# kubectl apply -f root-app.yaml
application.argoproj.io/devops-app created
```

## 查看验证
登录 argocd，查看 app-of-apps 应用信息。可以看到它自动创建了两个 Application。

![](assets/04-CI-CD/da1b2ea47ed46e11cc00.png)

![](assets/04-CI-CD/ec3ce4d773c16cb1d975.png)

后续如果需要对应用进行新增或者修改，只需要修改 git 仓库 apps 目录下的文件即可。

## 应用更新验证
假设 cmdb 应用新增 service 配置，我们只需要在 cmdb-deploy 项目的 manifests 目录下新增 service.yaml 文件。

![](assets/04-CI-CD/819d410c9f1ce19a8843.png)

查看 argocd 应用状态，已经成功新增了 service 资源。

![](assets/04-CI-CD/780d466b15b2d5eadb9f.png)

## 新增应用验证
假设现在有product（产品线组）应用需要发布。他们的项目分别是backend-deploy（产品后端代码仓库）和 frontend-deploy（产品前端代码仓库）。

我们之前已经在gitlab 分别创建对应项目，并且在argocd 新增 project 和 repo 资源。

接下来我们在gitops-App of Apps 项目的 apps 目录下新增如下内容如下。

```yaml
# tree .     
.
├── apps
│   ├── infra.yaml
│   ├── product.yaml # 新增product项目配置文件
│   └── model.yaml
└── root-app.yaml

1 directory, 4 files
# cat apps/product.yaml
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  name: product                # ApplicationSet 名称
  namespace: argocd            # 所在命名空间（必须与 Argo CD 控制器相同）
spec:
  generators:
  - list:                      # 使用 list 生成器，定义一组静态的应用参数
      elements:                # 每个元素代表一个要生成的 Application
      - name: backend          # 应用名标识（动态模板中可引用）
        server: https://kubernetes.default.svc     # 要部署的集群 API 地址（当前集群）
        repoURL: http://gitlab.cuiliangblog.cn/product/backend-deploy.git  # 后端应用的 Git 仓库
        namespace: prod        # 部署命名空间
      - name: frontend         # 第二个子应用（前端）
        server: https://192.168.10.15:6443         # 要部署到的另一集群（远程集群）
        repoURL: http://gitlab.cuiliangblog.cn/product/frontend-deploy.git  # 前端应用 Git 仓库
        namespace: prod        # 同样部署到 prod 命名空间
  template:                    # 模板部分：定义每个生成 Application 的通用模板
    metadata:
      name: '{{name}}-product' # 每个 Application 的名字会自动拼接 name（如 backend-product）
    spec:
      project: product         # 所属 Argo CD Project，用于权限范围划分
      source:
        path: manifests        # 指定在仓库中应用 YAML 文件所在路径
        repoURL: '{{repoURL}}' # 动态引用上面 list 元素中的 repoURL
        targetRevision: main   # 同步的分支（通常是 main 或 master）
      destination:
        server: '{{server}}'   # 动态指定目标集群地址
        namespace: '{{namespace}}' # 动态指定部署命名空间
      syncPolicy:              # 同步策略
        syncOptions:
          - CreateNamespace=true  # 自动创建目标 namespace（若不存在）
        automated:
          prune: false          # 不自动清理集群中多余资源（更安全）
          selfHeal: false       # 不自动修复偏移状态（避免误操作）
```

git 提交后，我们登录 app-root 应用进行同步，然后就会新增两个 Application。

![](assets/04-CI-CD/2ed19686c1fd1e11e805.png)

查看应用状态，已经全部完成发布。

![](assets/04-CI-CD/1cc71a9496794a8d4723.png)

# ApplicationSet 方式
通过 app of apps 方式，我们虽然实现了指定项目下所有 Application 的统一管理与 gitops 发布，但我们观察各个 Application 配置就会发现有 90%以上的配置都是重复的，并且每当有新项目上线时，仍然需要手动拷贝并修改 Application 配置。此时使用 ApplicationSet 可以大幅降低配置工作量。

## 实现思路
+ 为每个业务项目在 ArgoCD 中创建独立的 **AppProject**，并通过 ApplicationSet 模板中的 `project:` 字段分别关联。  
+ 通过 **ApplicationSet+Git **目录生成器；定期扫描一个 Git 仓库；
+ 读取其中的“应用定义文件”（例如 `apps/*.yaml`）；
+ 把这些文件的内容作为变量传入模板；
+ 自动生成多个 ArgoCD `Application` 对象。

## gitlab项目配置
### 目录结构
我们接下来创建一个类似 root 的项目，可以管理所有要通过 argocd 发布的项目。目录结构如下：

```bash
# tree gitops-applicationSet 
gitops-applicationSet
├── applications
│   ├── applicationset.yaml # 应用集
│   ├── infra
│   │   └── cmdb.yaml
│   └── model
│       └── vllm.yaml
└── root.yaml # 创建整个应用yaml
```

将该项目推送到 gitlab 仓库，并在 argocd 添加 repo。

### root.yaml
```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: root      # 应用名称，可自定义
  namespace: argocd           # 注意：Application 必须部署在 argocd 命名空间
spec:
  project: devops
  source:
    repoURL: http://gitlab.cuiliangblog.cn/devops/gitops-applicationSet.git
    path: applications
    targetRevision: HEAD
  destination:
    server: https://kubernetes.default.svc
    namespace: argocd
  syncPolicy:
    automated:                               # 启用自动同步
      prune: true                            # 自动删除 Git 中已移除的资源
      selfHeal: true                         # 自动修复偏离集群状态的资源
```

### applicationset.yaml
其中 applicationset.yaml 文件内容如下：

```yaml
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  name: applicationset
  namespace: argocd
spec:
  goTemplate: true
  goTemplateOptions: ["missingkey=error"]
  generators:
  - git:
      repoURL: http://gitlab.cuiliangblog.cn/devops/gitops-applicationSet.git
      revision: HEAD
      directories:
      - path: applications/* # 扫描路径
  template:      
    metadata:
      name: '{{.path.basename}}' # 组名（infra、model）
    spec:
      project: '{{.path.basename}}'
      source:
        repoURL: http://gitlab.cuiliangblog.cn/devops/gitops-applicationSet.git
        targetRevision: HEAD
        path: '{{.path.path}}'  # 完整的路径(application-set/myapps/prod或test)
      destination:
        server: https://kubernetes.default.svc
        namespace: argocd 
      syncPolicy:
        automated:                               # 启用自动同步
          prune: true                            # 自动删除 Git 中已移除的资源
          selfHeal: true                         # 自动修复偏离集群状态的资源
```

### cmdb.yaml
```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: cmdb            # 应用名称，可自定义
  namespace: argocd           # 注意：Application 必须部署在 argocd 命名空间
spec:
  project: infra             # 绑定到的 ArgoCD Project 名称
  source:
    repoURL: http://gitlab.cuiliangblog.cn/infra/cmdb-deploy.git   # 代码仓库地址
    targetRevision: HEAD                                         # 分支（HEAD=默认分支）
    path: manifests                                              # 仓库内 YAML/Helm 文件路径
  destination:
    server: https://kubernetes.default.svc   # 目标集群（本集群）
    namespace: default                       # 部署到的命名空间
  syncPolicy:
    automated:                               # 启用自动同步
      prune: true                            # 自动删除 Git 中已移除的资源
      selfHeal: true                         # 自动修复偏离集群状态的资源
    syncOptions:
      - CreateNamespace=true                 # 若目标命名空间不存在则自动创建
```

### vllm.yaml
```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: vllm            # 应用名称，可自定义
  namespace: argocd           # 注意：Application 必须部署在 argocd 命名空间
spec:
  project: model             # 绑定到的 ArgoCD Project 名称
  source:
    repoURL: http://gitlab.cuiliangblog.cn/model/vllm-deploy.git   # 代码仓库地址
    targetRevision: HEAD                                         # 分支（HEAD=默认分支）
    path: manifests                                              # 仓库内 YAML/Helm 文件路径
  destination:
    server: https://kubernetes.default.svc   # 目标集群（本集群）
    namespace: default                       # 部署到的命名空间
  syncPolicy:
    automated:                               # 启用自动同步
      prune: true                            # 自动删除 Git 中已移除的资源
      selfHeal: true                         # 自动修复偏离集群状态的资源
    syncOptions:
      - CreateNamespace=true                 # 若目标命名空间不存在则自动创建

```

## argocd 配置
创建对应的项目、repo，并配置项目对 repo 仓库的读取权限。

## 创建 root 应用
```yaml
# ls
applications  root.yaml
# kubectl apply -f root.yaml 
application.argoproj.io/root created
```

## 查看验证
创建完 root 应用后进行同步，便可以自动创建出对应的 Application

![](assets/04-CI-CD/752f78d7a154f8fd60ba.png)

此时应用发布状态如下

![](assets/04-CI-CD/0c30d3fbc4cd71675ff8.png)

## 应用更新验证
假设 vllm 应用新增 service 配置，我们只需要在 vllm-deploy 项目的 manifests 目录下新增 service.yaml 文件。

![](assets/04-CI-CD/130825d142bb08127b9d.png)

查看 argocd 应用状态，已经成功新增了 service 资源。

![](assets/04-CI-CD/e6ad7caf8365df1694ba.png)

## 新增应用验证
假设现在有product（产品线组）应用需要发布。他们的项目分别是backend-deploy（产品后端代码仓库）和 frontend-deploy（产品前端代码仓库）。

首先在gitlab 分别创建对应项目，然后在 argocd 新增 project 和 repo 资源，可参考前文，不再赘述。

gitops 项目 application 目录创建对应资源，内容如下。

```yaml
tree .     
.
├── applications
│   ├── applicationset.yaml
│   ├── infra
│   │   └── cmdb.yaml
│   ├── model
│   │   └── vllm.yaml
│   └── product
│       ├── backend.yaml
│       └── frontend.yaml
└── root.yaml
# cat applications/product/backend.yaml 
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: backend            # 应用名称，可自定义
  namespace: argocd           # 注意：Application 必须部署在 argocd 命名空间
spec:
  project: product             # 绑定到的 ArgoCD Project 名称
  source:
    repoURL: http://gitlab.cuiliangblog.cn/product/backend-deploy.git   # 代码仓库地址
    targetRevision: HEAD                                         # 分支（HEAD=默认分支）
    path: manifests                                              # 仓库内 YAML/Helm 文件路径
  destination:
    server: https://kubernetes.default.svc   # 目标集群（本集群）
    namespace: product                       # 部署到的命名空间
  syncPolicy:
    automated:                               # 启用自动同步
      prune: true                            # 自动删除 Git 中已移除的资源
      selfHeal: true                         # 自动修复偏离集群状态的资源
    syncOptions:
      - CreateNamespace=true                 # 若目标命名空间不存在则自动创建
# cat applications/product/frontend.yaml 
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: frontend            # 应用名称，可自定义
  namespace: argocd           # 注意：Application 必须部署在 argocd 命名空间
spec:
  project: product             # 绑定到的 ArgoCD Project 名称
  source:
    repoURL: http://gitlab.cuiliangblog.cn/product/frontend-deploy.git   # 代码仓库地址
    targetRevision: HEAD                                         # 分支（HEAD=默认分支）
    path: manifests                                              # 仓库内 YAML/Helm 文件路径
  destination:
    server: https://kubernetes.default.svc   # 目标集群（本集群）
    namespace: product                       # 部署到的命名空间
  syncPolicy:
    automated:                               # 启用自动同步
      prune: true                            # 自动删除 Git 中已移除的资源
      selfHeal: true                         # 自动修复偏离集群状态的资源
    syncOptions:
      - CreateNamespace=true                 # 若目标命名空间不存在则自动创建
```

git 提交后，我们登录root 应用查看信息，就会新增一个 product 对应的 ApplicationSet。

![](assets/04-CI-CD/0accab163ac3a19d0e97.png)

查看应用状态，已经全部完成发布。

![](assets/04-CI-CD/5953f667fc5b6c187d3f.png)

# 对比总结
| 项目 | App-of-Apps 模式 | ApplicationSet 模式 |
| --- | --- | --- |
| 子应用定义 | 直接在 Git 写多个 Application YAML | 写参数文件（简化） |
| 新增一个应用 | 手动添加一个新的 Application YAML | 只需在 `apps/`<br/> 目录新增一个 `xxx.yaml` |
| Application 创建方式 | ArgoCD 同步时直接 apply 这些 Application | ApplicationSet controller 自动生成 Application |
| 删除应用 | 删除 Application YAML | 删除参数文件，自动删除对应 Application |
| 适用场景 | 小量应用、结构复杂 | 大量相似结构、批量自动化 |


在实际使用中，App-of-Apps 和ApplicationSet 模式并不是二选一，而是可以混合使用的。因此我们可以根据实际需求，灵活组合，从而实现更加强大的部署模板配置。


