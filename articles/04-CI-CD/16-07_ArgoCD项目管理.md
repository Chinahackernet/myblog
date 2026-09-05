# ArgoCD项目管理

> 分类：CI/CD / 第16章：ArgoCD与GitOps入门
> 原文：https://www.cuiliangblog.cn/detail/section/174837249
> 来源：崔亮的博客

---

# 项目管理介绍
通过项目，可以配置对应用程序的访问控制策略。例如，可以指定哪些用户或团队有权在特定命名空间或集群中进行部署操作。提供了资源隔离的功能，确保不同项目之间的资源不会互相干扰。这有助于维护不同团队或应用程序之间的清晰界限。

Argo CD 的 Project 可以控制的权限有：

+ 控制这个项目可以访问哪些 Git 仓库；
+ 可以部署到哪些 Kubernetes 集群与命名空间；
+ 可以使用哪些资源种类（RBAC 限制）。

最佳实践应该是为每个gitlab group在argoCD中创建对应的Project，便于各个组之间权限资源相互隔离。

## 核心概念
| 概念 | 说明 |
| --- | --- |
| Project | ArgoCD 的顶层逻辑单元，用于管理一组应用（Applications） |
| Applications | 部署单元，可以归属于某个 Project |
| Permissions & Policies | 控制 Project 下应用可以访问的 Git 仓库和集群 |
| Destination（目标集群）限制 | Project 可以限制应用只能部署到指定集群和 namespace |
| Source（Git/Helm 仓库）限制 | Project 可以限制应用只能拉取指定仓库或 Helm 仓库 |


# Project创建
## webUI创建
![](assets/04-CI-CD/7e30e74aa5e21207b8b8.png)

## CLI创建
```bash
## argocd CLI
# login
argocd login argocd.cuiliangblog.cn

# list 
argocd proj list

# remove
argocd proj remove dev1

# create
argocd proj create --help
argocd proj create dev2
argocd proj list
argocd proj add-source dev2 http://github.com/dev2/app.git
```

## yaml创建
示例文档： [https://argo-cd.readthedocs.io/en/stable/operator-manual/project.yaml](https://argo-cd.readthedocs.io/en/stable/operator-manual/project.yaml)

```bash
apiVersion: argoproj.io/v1alpha1
kind: AppProject
metadata:
  name: dev3
  namespace: argocd
  finalizers:
    - resources-finalizer.argocd.argoproj.io
spec:
  description: Example Project
  sourceRepos:
  - 'https://github.com/dev3/app.git'
  destinations:
  - namespace: dev3
    server: https://kubernetes.default.svc
    name: in-cluster
  # Deny all cluster-scoped resources from being created, except for Namespace
  clusterResourceWhitelist:
  - group: ''
    kind: Namespace

  # Allow all namespaced-scoped resources to be created, except for ResourceQuota, LimitRange, NetworkPolicy
  namespaceResourceBlacklist:
  - group: ''
    kind: ResourceQuota
  - group: ''
    kind: LimitRange
  - group: ''
    kind: NetworkPolicy

  # Deny all namespaced-scoped resources from being created, except for Deployment and StatefulSet
  namespaceResourceWhitelist:
  - group: 'apps'
    kind: Deployment
  - group: 'apps'
    kind: StatefulSet
```

# project配置
## webUI配置
![](assets/04-CI-CD/9f4d92a472f31a952682.png)

## CLI 配置
```yaml
argocd proj create devops \
  --description "devops项目" \
  --src "http://gitlab.cuiliangblog.cn/devops/*" \
  --dest https://kubernetes.default.svc,default \
  --dest https://192.168.10.15:6443,test
```

## yaml配置
```yaml
apiVersion: argoproj.io/v1alpha1
kind: AppProject
metadata:
  name: devops
  namespace: argocd
spec:
  description: devops项目
  sourceRepos:
    - http://gitlab.cuiliangblog.cn/devops/*
  destinations:
    - name: in-cluster
      namespace: default
      server: https://kubernetes.default.svc
    - name: k8s-test
      namespace: test
      server: https://192.168.10.15:6443
  # 可选：允许同步集群资源类型（若需要，可以放开）
  clusterResourceWhitelist:
    - group: '*'
      kind: '*'
  # 可选：限制可以使用的 namespace 范围
  namespaceResourceBlacklist: []
```

# ProjectRole
ProjectRole 是一种用于定义在特定项目 (Project) 范围内的访问控制策略的资源。它允许你对项目中的资源进行细粒度的权限管理，指定哪些用户或服务账户可以执行哪些操作。ProjectRole 主要用于增强安全性和隔离性，确保只有被授权的用户或系统组件可以对项目内的应用程序和资源进行特定操作。

## 创建role
我们在demo项目下创建名为dev的角色，配置权限为：允许get sync操作权限，不允许delete操作。

![](assets/04-CI-CD/01173ca0173135ff67e7.png)

## 创建JWT Token
```bash
[root@tiaoban ~]# argocd proj role create-token demo-project dev-role
WARN[0000] Failed to invoke grpc call. Use flag --grpc-web in grpc calls. To avoid this warning message, use flag --grpc-web. 
Create token succeeded for proj:demo-project:dev-role.
  ID: 90899748-fb86-4ef9-b3f0-71f820cf10d6
  Issued At: 2024-06-23T12:12:29+08:00
  Expires At: Never
  Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJhcmdvY2QiLCJzdWIiOiJwcm9qOmRlbW8tcHJvamVjdDpkZXYtcm9sZSIsIm5iZiI6MTcxOTExNTk0OSwiaWF0IjoxNzE5MTE1OTQ5LCJqdGkiOiI5MDg5OTc0OC1mYjg2LTRlZjktYjNmMC03MWY4MjBjZjEwZDYifQ.RCLx7U-2RdQ_BD5z8sBW3Ghh5RA6DnwU9VHvmU8EgQM
```

## 验证测试
```bash
# 注销之前登录的admin账号
[root@tiaoban ~]# argocd logout argocd.cuiliangblog.cn
Logged out from 'argocd.cuiliangblog.cn'
# 使用token查看app列表
[root@tiaoban ~]# argocd app list --auth-token eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJhcmdvY2QiLCJzdWIiOiJwcm9qOmRlbW8tcHJvamVjdDpkZXYtcm9sZSIsIm5iZiI6MTcxOTExNTk0OSwiaWF0IjoxNzE5MTE1OTQ5LCJqdGkiOiI5MDg5OTc0OC1mYjg2LTRlZjktYjNmMC03MWY4MjBjZjEwZDYifQ.RCLx7U-2RdQ_BD5z8sBW3Ghh5RA6DnwU9VHvmU8EgQM
WARN[0000] Failed to invoke grpc call. Use flag --grpc-web in grpc calls. To avoid this warning message, use flag --grpc-web. 
NAME         CLUSTER                         NAMESPACE  PROJECT       STATUS  HEALTH   SYNCPOLICY  CONDITIONS  REPO                                          PATH       TARGET
argocd/demo  https://kubernetes.default.svc             demo-project  Synced  Healthy  Auto        <none>      http://gitlab.cuiliangblog.cn/devops/argo-demo.git  manifests  HEAD
# 使用token执行sync操作
[root@tiaoban ~]# argocd app sync argocd/demo --auth-token eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJhcmdvY2QiLCJzdWIiOiJwcm9qOmRlbW8tcHJvamVjdDpkZXYtcm9sZSIsIm5iZiI6MTcxOTExNTk0OSwiaWF0IjoxNzE5MTE1OTQ5LCJqdGkiOiI5MDg5OTc0OC1mYjg2LTRlZjktYjNmMC03MWY4MjBjZjEwZDYifQ.RCLx7U-2RdQ_BD5z8sBW3Ghh5RA6DnwU9VHvmU8EgQM
WARN[0000] Failed to invoke grpc call. Use flag --grpc-web in grpc calls. To avoid this warning message, use flag --grpc-web. 
TIMESTAMP                  GROUP                      KIND     NAMESPACE                  NAME    STATUS   HEALTH        HOOK  MESSAGE
2024-06-23T12:20:07+08:00                          Service       default                 myapp    Synced  Healthy              
2024-06-23T12:20:07+08:00   apps                Deployment       default                 myapp    Synced  Healthy              
2024-06-23T12:20:07+08:00  traefik.containo.us  IngressRoute     default                 myapp    Synced                       
2024-06-23T12:20:07+08:00  traefik.containo.us  IngressRoute     default                 myapp    Synced                       ingressroute.traefik.containo.us/myapp unchanged
2024-06-23T12:20:07+08:00                          Service       default                 myapp    Synced  Healthy              service/myapp unchanged
2024-06-23T12:20:07+08:00   apps                Deployment       default                 myapp    Synced  Healthy              deployment.apps/myapp unchanged

Name:               argocd/demo
Project:            demo-project
Server:             https://kubernetes.default.svc
Namespace:          
URL:                https://argocd.cuiliangblog.cn/applications/argocd/demo
Source:
- Repo:             http://gitlab.cuiliangblog.cn/devops/argo-demo.git
  Target:           HEAD
  Path:             manifests
SyncWindow:         Sync Allowed
Sync Policy:        Automated
Sync Status:        Synced to HEAD (0ea8019)
Health Status:      Healthy

Operation:          Sync
Sync Revision:      0ea801988a54f0ad73808454f2fce5030d3e28ef
Phase:              Succeeded
Start:              2024-06-23 12:20:07 +0800 CST
Finished:           2024-06-23 12:20:07 +0800 CST
Duration:           0s
Message:            successfully synced (all tasks run)

GROUP                KIND          NAMESPACE  NAME   STATUS  HEALTH   HOOK  MESSAGE
                     Service       default    myapp  Synced  Healthy        service/myapp unchanged
apps                 Deployment    default    myapp  Synced  Healthy        deployment.apps/myapp unchanged
traefik.containo.us  IngressRoute  default    myapp  Synced                 ingressroute.traefik.containo.us/myapp unchanged
# 使用token删除应用，提示权限拒绝
[root@tiaoban ~]# argocd app delete argocd/demo --auth-token eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJhcmdvY2QiLCJzdWIiOiJwcm9qOmRlbW8tcHJvamVjdDpkZXYtcm9sZSIsIm5iZiI6MTcxOTExNTk0OSwiaWF0IjoxNzE5MTE1OTQ5LCJqdGkiOiI5MDg5OTc0OC1mYjg2LTRlZjktYjNmMC03MWY4MjBjZjEwZDYifQ.RCLx7U-2RdQ_BD5z8sBW3Ghh5RA6DnwU9VHvmU8EgQM
WARN[0000] Failed to invoke grpc call. Use flag --grpc-web in grpc calls. To avoid this warning message, use flag --grpc-web. 
Are you sure you want to delete 'argocd/demo' and all its resources? [y/n] y
FATA[0001] rpc error: code = PermissionDenied desc = permission denied: applications, delete, demo-project/demo, sub: proj:demo-project:dev-role, iat: 2024-06-23T04:12:29Z
```


