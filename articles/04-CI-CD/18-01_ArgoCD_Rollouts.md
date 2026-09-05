# ArgoCD Rollouts

> 分类：CI/CD / 第18章：ArgoCD应用发布
> 原文：https://www.cuiliangblog.cn/detail/section/174841576
> 来源：崔亮的博客

---

# Argo Rollouts简介
Argo Rollouts 是一个用于 Kubernetes 的渐进式交付控制器，支持蓝绿部署、金丝雀发布、A/B 测试等高级部署策略。它是 Argo 项目的一部分，旨在帮助团队更安全和更可控地发布应用程序新版本。

## 主要功能
1. **蓝绿部署**：通过创建两个独立的环境（蓝环境和绿环境），在不影响现有用户的情况下发布新版本。当新版本稳定后，将流量切换到新版本。
2. **金丝雀发布**：逐步将新版本推送给一部分用户，监控其性能和稳定性，然后逐步扩大新版本的覆盖范围，直至完全取代旧版本。
3. **A/B 测试**：允许同时运行两个或多个版本的应用程序，以比较它们的性能和用户反馈，从而选择最佳版本。
4. **实验性部署**：能够在生产环境中进行实验性功能测试，同时将影响范围控制在可控范围内。

## 工作原理
Argo Rollouts 基于 Kubernetes 自定义资源 (CRD) 来定义和管理部署策略。关键的自定义资源包括：

+ **Rollout**：定义了应用程序的部署策略，如蓝绿部署、金丝雀发布等。
+ **Experiment**：用于定义和执行实验性部署。
+ **AnalysisTemplate** 和 **AnalysisRun**：用于定义和运行分析任务，以在部署过程中进行自动化验证。

![](assets/04-CI-CD/8546047b312105c5a2bc.png)

## <font style="color:rgb(49, 70, 89);">实现原理</font>
与 Deployment 对象类似，Argo Rollouts 控制器将管理 ReplicaSets 的创建、缩放和删除，这些 ReplicaSet 由 Rollout 资源中的 spec.template 定义，使用与 Deployment 对象相同的 pod 模板。

当 spec.template 变更时，这会向 Argo Rollouts 控制器发出信号，表示将引入新的 ReplicaSet，控制器将使用 spec.strategy 字段内的策略来确定从旧 ReplicaSet 到新 ReplicaSet 的 rollout 将如何进行，一旦这个新的 ReplicaSet 被放大（可以选择通过一个 Analysis），控制器会将其标记为稳定。

如果在 spec.template 从稳定的 ReplicaSet 过渡到新的 ReplicaSet 的过程中发生了另一次变更（即在发布过程中更改了应用程序版本），那么之前的新 ReplicaSet 将缩小，并且控制器将尝试发布反映更新 spec.template 字段的 ReplicasSet。

# 安装Rollouts
参考文档：[https://github.com/argoproj/argo-rollouts](https://github.com/argoproj/argo-rollouts)

## 安装argo-rollouts
```bash
[root@tiaoban ~]# kubectl create namespace argo-rollouts
[root@tiaoban ~]# kubectl apply -n argo-rollouts -f https://github.com/argoproj/argo-rollouts/releases/latest/download/install.yaml
customresourcedefinition.apiextensions.k8s.io/analysisruns.argoproj.io created
customresourcedefinition.apiextensions.k8s.io/analysistemplates.argoproj.io created
customresourcedefinition.apiextensions.k8s.io/clusteranalysistemplates.argoproj.io created
customresourcedefinition.apiextensions.k8s.io/experiments.argoproj.io created
customresourcedefinition.apiextensions.k8s.io/rollouts.argoproj.io created
serviceaccount/argo-rollouts created
clusterrole.rbac.authorization.k8s.io/argo-rollouts created
clusterrole.rbac.authorization.k8s.io/argo-rollouts-aggregate-to-admin created
clusterrole.rbac.authorization.k8s.io/argo-rollouts-aggregate-to-edit created
clusterrole.rbac.authorization.k8s.io/argo-rollouts-aggregate-to-view created
clusterrolebinding.rbac.authorization.k8s.io/argo-rollouts created
configmap/argo-rollouts-config created
secret/argo-rollouts-notification-secret created
service/argo-rollouts-metrics created
deployment.apps/argo-rollouts created
[root@tiaoban ~]# kubectl get all -n argo-rollouts 
NAME                                 READY   STATUS    RESTARTS   AGE
pod/argo-rollouts-699c7d8749-hlrkn   1/1     Running   0          71s

NAME                            TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)    AGE
service/argo-rollouts-metrics   ClusterIP   10.100.64.155   <none>        8090/TCP   71s

NAME                            READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/argo-rollouts   1/1     1            1           71s

NAME                                       DESIRED   CURRENT   READY   AGE
replicaset.apps/argo-rollouts-699c7d8749   1         1         1       71s
```

## 安装Kubectl 插件
```bash
[root@tiaoban ~]# wget https://github.com/argoproj/argo-rollouts/releases/download/v1.8.3/kubectl-argo-rollouts-linux-amd64
[root@tiaoban ~]# mv kubectl-argo-rollouts-linux-amd64 /usr/local/bin/kubectl-argo-rollouts
[root@tiaoban ~]# chmod u+x /usr/local/bin/kubectl-argo-rollouts
[root@tiaoban ~]# kubectl argo rollouts version
kubectl-argo-rollouts: v1.8.3+49fa151
  BuildDate: 2025-06-04T22:15:54Z
  GitCommit: 49fa1516cf71672b69e265267da4e1d16e1fe114
  GitTreeState: clean
  GoVersion: go1.23.9
  Compiler: gc
  Platform: linux/amd64
```

## 安装dashboard插件
```bash
[root@master1 argocd]# wget https://github.com/argoproj/argo-rollouts/releases/download/v1.8.3/dashboard-install.yaml
[root@master1 argocd]# kubectl apply -f dashboard-install.yaml -n argo-rollouts
serviceaccount/argo-rollouts-dashboard created
clusterrole.rbac.authorization.k8s.io/argo-rollouts-dashboard created
clusterrolebinding.rbac.authorization.k8s.io/argo-rollouts-dashboard created
service/argo-rollouts-dashboard created
deployment.apps/argo-rollouts-dashboard created
```

创建ingress资源

```yaml
apiVersion: traefik.io/v1alpha1
kind: Middleware
metadata:
  name: redirect-https-middleware
  namespace: argo-rollouts
spec:
  redirectScheme:
    scheme: https
---
apiVersion: traefik.io/v1alpha1
kind: IngressRoute
metadata:
  name: argo-rollouts
  namespace: argo-rollouts
spec:
  entryPoints:
    - web
    - websecure 
  tls:
    secretName: ingress-tls                
  routes:
  - match: Host(`argo-rollouts.cuiliangblog.cn`)
    kind: Rule
    services:
    - name: argo-rollouts-dashboard
      port: 3100
    middlewares:
    - name: redirect-https-middleware
```

绑定 hosts 后访问验证

![](assets/04-CI-CD/dbe48e0836e4b5749790.png)


