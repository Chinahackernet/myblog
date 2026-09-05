# Gitlab与k8s集成(agent方式)

> 分类：CI/CD / 第15章：Gitlab工具链集成
> 原文：https://www.cuiliangblog.cn/detail/section/172997707
> 来源：崔亮的博客

---

# agent方案介绍
## 为什么不推荐证书方式连接
1. 依赖于对 Kubernetes API 的直接访问。容易因暴露kubernetes api而导致高风险，尤其是saas而不是自建的用户。
2. 集成中最有价值的功能需要提升权限，通常需要您授予 GitLab 集群管理员权限。同时，不需要这些权限的功能不能通过更有限的访问来限制。这意味着您必须授予对一个相当简单的功能的完全访问权限，这可能会成为一种隐患。
3. 基于pull的部署开始普及，gitlab需要增强这方面的能力

## gitlab agent优势
+ 安全——可以使用常规 Kubernetes RBAC 规则配置代理，从而保持对集群的安全访问
+ 可靠性——通过代码配置您的集群
+ 可扩展性——扩展到多个环境仅需配置多个config.yaml
+ 速度——支持基于pull，支持现代 GitOps 方法
+ 功能性——可以将容器网络安全策略警报和容器扫描结果集成显示到 GitLab
+ 延续性——同样支持基于push，使现有的 GitLab CI/CD 工作流保持正常运行

## 与runner区别
+ Kubernetes Agent 主要用于集群管理和 GitOps 工作流，适合需要集中管理和安全连接的 Kubernetes 集群。
+ Kubernetes Runner 主要用于执行 CI/CD 作业，适合需要在 Kubernetes 集群中运行大量 CI/CD 作业的开发团队

# 安装部署agent
参考文档：[https://docs.gitlab.com/ee/user/clusters/agent/](https://docs.gitlab.com/ee/user/clusters/agent/)

## 创建agent配置文件
在GitLab 仓库中，创建一个名为 .gitlab/agents/devops/config.yaml 的文件，文件内容如下：

![](assets/04-CI-CD/be7dc86ef10c3cad591b.png)

```yaml
gitops:
  manifest_projects:
  - id: "devops/k8s-agent"
    paths:
    - glob: '/**/*.{yaml,yml,json}'
```

## 创建资源清单
![](assets/04-CI-CD/4f55eb105c187d864ebe.png)

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp1
  namespace: dev
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
---
apiVersion: v1
kind: Service
metadata:
  name: myapp1
  namespace: dev
spec:
  type: ClusterIP
  selector:
    app: myapp1
  ports:
  - port: 80
    targetPort: 80
```

## 生成agent token
在项目——>运维——>Kubernetes集群，注册agent，生成token。

![](assets/04-CI-CD/9f04777db594cd430eab.png)

## 安装agent
```bash
[root@tiaoban ~]# helm repo add gitlab https://charts.gitlab.io
[root@tiaoban ~]# helm repo update
[root@tiaoban ~]# helm upgrade --install devops gitlab/gitlab-agent \
    --namespace gitlab-agent-devops \
    --create-namespace \
    --set image.tag=v17.0.1 \
    --set replicas=1 \
    --set config.token=glagent-uMALA8woD31LynFAtMYU31XhXnL4drQwZzzECC2Jy3PC2Rqk2g \
    --set config.kasAddress=ws://gitlab.local.com/-/kubernetes-agent/
Release "devops" does not exist. Installing it now.
NAME: devops
LAST DEPLOYED: Mon Jun 10 11:27:04 2024
NAMESPACE: gitlab-agent-devops
STATUS: deployed
REVISION: 1
TEST SUITE: None
NOTES:
Thank you for installing gitlab-agent.

Your release is named devops.

## Changelog

### 1.17.0

- The default replica count has been increased from `1` to `2` to allow a zero-downtime upgrade experience.
  You may use `--set replicas=1` to restore the old default behavior.
```

## 查看agent状态
查看pod状态

```bash
[root@tiaoban ~]# kubectl get pod -n gitlab-agent-devops 
NAME                                     READY   STATUS    RESTARTS   AGE
devops-gitlab-agent-v2-84d4648d8-9wcfl   1/1     Running   0          49s
```

查看集群连接状态

![](assets/04-CI-CD/15fa6eb00f8fde570e46.png)

## 查看自动部署的资源信息
```yaml
[root@tiaoban ~]# kubectl get all -n dev
NAME                         READY   STATUS    RESTARTS   AGE
pod/myapp1-f486545bd-zxng2   1/1     Running   0          63s

NAME             TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)   AGE
service/myapp1   ClusterIP   10.97.134.217   <none>        80/TCP    63s

NAME                     READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/myapp1   1/1     1            1           63s

NAME                               DESIRED   CURRENT   READY   AGE
replicaset.apps/myapp1-f486545bd   1         1         1       63s
```

## 

