# ArgoCD简介

> 分类：CI/CD / 第16章：ArgoCD与GitOps入门
> 原文：https://www.cuiliangblog.cn/detail/section/174701863
> 来源：崔亮的博客

---

# ArgoCD简介
Argo CD 是一个为 Kubernetes 而生的，遵循声明式 GitOps 理念的持续部署工具。Argo CD 可在 Git 存储库更改时自动同步和部署应用程序。

Argo CD 遵循 GitOps 模式，使用 Git 仓库作为定义所需应用程序状态的真实来源，Argo CD 支持多种 Kubernetes 清单：

+ kustomize
+ helm charts
+ ksonnet applications
+ jsonnet files
+ Plain directory of YAML/json manifests
+ Any custom config management tool configured as a config management plugin

Argo CD 可在指定的目标环境中自动部署所需的应用程序状态，应用程序部署可以在 Git 提交时跟踪对分支、标签的更新，或固定到清单的指定版本。

# 架构
![](assets/04-CI-CD/88caa373999906ad6a7b.png)

Argo CD 是通过一个 Kubernetes 控制器来实现的，它持续 watch 正在运行的应用程序并将当前的实时状态与所需的目标状态（ Git 存储库中指定的）进行比较。已经部署的应用程序的实际状态与目标状态有差异，则被认为是 `OutOfSync` 状态，Argo CD 会报告显示这些差异，同时提供工具来自动或手动将状态同步到期望的目标状态。在 Git 仓库中对期望目标状态所做的任何修改都可以自动应用反馈到指定的目标环境中去。

# 架构组件
## API 服务
API 服务是一个 gRPC/REST 服务，它暴露了 Web UI、CLI 和 CI/CD 系统使用的接口，主要有以下几个功能：

+ 应用程序管理和状态报告
+ 执行应用程序操作（例如同步、回滚、用户定义的操作）
+ 存储仓库和集群凭据管理（存储为 K8S Secrets 对象）
+ 认证和授权给外部身份提供者
+ RBAC
+ Git webhook 事件的侦听器/转发器

## 仓库服务
存储仓库服务是一个内部服务，负责维护保存应用程序清单 Git 仓库的本地缓存。当提供以下输入时，它负责生成并返回 Kubernetes 清单：

+ 存储 URL
+ revision 版本（commit、tag、branch）
+ 应用路径
+ 模板配置：参数、ksonnet 环境、helm values.yaml 等

## 应用控制器
应用控制器是一个 Kubernetes 控制器，它持续 watch 正在运行的应用程序并将当前的实时状态与所期望的目标状态（ repo 中指定的）进行比较。它检测应用程序的 `OutOfSync` 状态，并采取一些措施来同步状态，它负责调用任何用户定义的生命周期事件的钩子（PreSync、Sync、PostSync）。

# <font style="color:rgb(28, 30, 33);">核心概念</font>
+ Application：应用，一组由资源清单定义的 Kubernetes 资源，这是一个 CRD 资源对象
+ Application source type：用来构建应用的工具
+ Target state：目标状态，指应用程序所需的期望状态，由 Git 存储库中的文件表示
+ Live state：实时状态，指应用程序实时的状态，比如部署了哪些 Pods 等真实状态
+ Sync status：同步状态表示实时状态是否与目标状态一致，部署的应用是否与 Git 所描述的一样？
+ Sync：同步指将应用程序迁移到其目标状态的过程，比如通过对 Kubernetes 集群应用变更
+ Sync operation status：同步操作状态指的是同步是否成功
+ Refresh：刷新是指将 Git 中的最新代码与实时状态进行比较，弄清楚有什么不同
+ Health：应用程序的健康状况，它是否正常运行？能否为请求提供服务？
+ Tool：工具指从文件目录创建清单的工具，例如 Kustomize 或 Ksonnet 等
+ Configuration management tool：配置管理工具
+ Configuration management plugin：配置管理插件


