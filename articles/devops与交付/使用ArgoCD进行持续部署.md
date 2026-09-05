## 什么是ArgoCD

​  

> Argo CD is a declarative, GitOps continuous delivery tool for Kubernetes.

​  

Argo CD是一个基于Kubernetes的声明式的GitOps工具。

  

在说Argo CD之前，我们先来了解一下什么是GitOps。

  

## 什么是GitOps

  

GitOps是以Git为基础，使用CI/CD来更新运行在云原生环境的应用，它秉承了DevOps的核心理念--“构建它并交付它(you built it you ship it)”。

​  

概念说起来有点虚，我画了张图，看了你就明白了。

​  

![image.png](assets/devops与交付/使用ArgoCD进行持续部署/使用ArgoCD进行持续部署-1.png)

-   当开发人员将开发完成的代码推送到git仓库会触发CI制作镜像并推送到镜像仓库
-   CI处理完成后，可以手动或者自动修改应用配置，再将其推送到git仓库
-   GitOps会同时对比目标状态和当前状态，如果两者不一致会触发CD将新的配置部署到集群中

  

其中，目标状态是Git中的状态，现有状态是集群的里的应用状态。

  

不用GitOps可以么？

  

当然可以，我们可以使用kubectl、helm等工具直接发布配置，但这会存在一个很严重的安全问题，那就是密钥共享。

  

为了让CI系统能够自动的部署应用，我们需要将集群的访问密钥共享给它，这会带来潜在的安全问题。

  

## ArgoCD

Argo CD遵循GitOps模式，使用Git存储库存储所需应用程序的配置。

Kubernetes清单可以通过以下几种方式指定:

-   kustomize应用程序
-   helm图表
-   ksonnet应用程序
-   jsonnet文件
-   基于YAML/json配置
-   配置管理插件配置的任何自定义配置管理工具

  

Argo CD实现为kubernetes控制器，它持续监视运行中的应用程序，并将当前的活动状态与期望的目标状态进行比较(如Git repo中指定的那样)。如果已部署的应用程序的活动状态偏离了目标状态，则认为是OutOfSync。Argo CD报告和可视化这些差异，同时提供了方法，可以自动或手动将活动状态同步回所需的目标状态。在Git repo中对所需目标状态所做的任何修改都可以自动应用并反映到指定的目标环境中。

  

Argo CD就处在如下位置：

![image.png](assets/devops与交付/使用ArgoCD进行持续部署/使用ArgoCD进行持续部署-2.png)

  

它的优势总结如下：

-   应用定义、配置和环境信息是声明式的，并且可以进行版本控制；
-   应用部署和生命周期管理是全自动化的，是可审计的，清晰易懂；
-   Argo CD是一个独立的部署工具，支持对多个环境、多个Kubernetes集群上的应用进行统一部署和管理

  

## 实践

> 前提：有一个可用的Kubernetes集群。

  

实验环境：

-   kubernetes：1.17.2
-   argo cd：latest

  

### 安装Argo CD

安装很简单，不过在实际使用中需要对数据进行持久化。

  

我这里直接使用官方文档的安装命令：

```shell
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
```

  

执行成功后会在`argocd`的namespace下创建如下资源。

```shell
# kubectl get all -n argocd 
NAME                                      READY   STATUS    RESTARTS   AGE
pod/argocd-application-controller-0       1/1     Running   0          16h
pod/argocd-dex-server-74d9998fdb-mvpmh    1/1     Running   0          16h
pod/argocd-redis-59dbdbb8f9-msxrp         1/1     Running   0          16h
pod/argocd-repo-server-599bdc7cf5-ccv8l   1/1     Running   0          16h
pod/argocd-server-576b4c7ff4-cnp9d        1/1     Running   0          16h

NAME                            TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)                      AGE
service/argocd-dex-server       ClusterIP   10.105.217.139   <none>        5556/TCP,5557/TCP,5558/TCP   16h
service/argocd-metrics          ClusterIP   10.97.116.36     <none>        8082/TCP                     16h
service/argocd-redis            ClusterIP   10.105.63.34     <none>        6379/TCP                     16h
service/argocd-repo-server      ClusterIP   10.111.153.131   <none>        8081/TCP,8084/TCP            16h
service/argocd-server           ClusterIP   10.105.229.250   <none>        80/TCP,443/TCP               16h
service/argocd-server-metrics   ClusterIP   10.104.8.45      <none>        8083/TCP                     16h

NAME                                 READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/argocd-dex-server    1/1     1            1           16h
deployment.apps/argocd-redis         1/1     1            1           16h
deployment.apps/argocd-repo-server   1/1     1            1           16h
deployment.apps/argocd-server        1/1     1            1           16h

NAME                                            DESIRED   CURRENT   READY   AGE
replicaset.apps/argocd-dex-server-74d9998fdb    1         1         1       16h
replicaset.apps/argocd-redis-59dbdbb8f9         1         1         1       16h
replicaset.apps/argocd-repo-server-599bdc7cf5   1         1         1       16h
replicaset.apps/argocd-server-576b4c7ff4        1         1         1       16h

NAME                                             READY   AGE
statefulset.apps/argocd-application-controller   1/1     16h
```

  

访问Argo server的方式有两种：

-   通过web ui
-   使用argocd 客户端工具

  

我这里直接使用web ui进行管理。

  

通过`kubectl edit -n argocd svc argocd-server`将service的type类型改为NodePort。改完后通过以下命令查看端口：

```yaml
# kubectl get svc -n argocd 
NAME                    TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)                      AGE
argocd-dex-server       ClusterIP   10.105.217.139   <none>        5556/TCP,5557/TCP,5558/TCP   17h
argocd-metrics          ClusterIP   10.97.116.36     <none>        8082/TCP                     17h
argocd-redis            ClusterIP   10.105.63.34     <none>        6379/TCP                     17h
argocd-repo-server      ClusterIP   10.111.153.131   <none>        8081/TCP,8084/TCP            17h
argocd-server           NodePort    10.105.229.250   <none>        80:32109/TCP,443:30149/TCP   17h
argocd-server-metrics   ClusterIP   10.104.8.45      <none>        8083/TCP                     17h
```

然后通过http://IP:32109访问页面，如下：

![image.png](assets/devops与交付/使用ArgoCD进行持续部署/使用ArgoCD进行持续部署-3.png)

  

登录账号为admin，密码通过以下命令获取。

```yaml
kubectl get pods -n argocd -l app.kubernetes.io/name=argocd-server -o name | cut -d'/' -f 2
```

  

然后进入如下界面。

![image.png](assets/devops与交付/使用ArgoCD进行持续部署/使用ArgoCD进行持续部署-4.png)

  

### 更改密码

默认密码是pod的名字，使用客户端修改密码。

（1）下载客户端，在github上下载即可，[https://github.com/argoproj/argo-cd/releases](https://github.com/argoproj/argo-cd/releases)

（2）用客户端登录

```bash
# argocd login 172.17.100.50:32109
WARNING: server certificate had error: x509: cannot validate certificate for 172.17.100.50 because it doesn't contain any IP SANs. Proceed insecurely (y/n)? y
Username: admin
Password: 
'admin' logged in successfully
Context '172.17.100.50:32109' updated
```

（3）修改密码

```bash
# argocd account update-password \
   --account admin \
   --current-password argocd-server-5dcc6878cf-75j94 \
   --new-password admin
Password updated
Context '172.17.100.50:32109' updated
```

  

### 创建应用

> 这里仅仅是为了测试argo，所以并没有做ci部分。

  

我在gitlab上准备了一个仓库，仓库里的文件很简单，如下：

![image.png](assets/devops与交付/使用ArgoCD进行持续部署/使用ArgoCD进行持续部署-5.png)

其中manifests下就是一个deployment文件，内容如下：

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  labels:
    app: devops-argocd-test
  name: devops-argocd-test
  namespace: default
spec:
  minReadySeconds: 60
  progressDeadlineSeconds: 600
  replicas: 1
  revisionHistoryLimit: 10
  selector:
    matchLabels:
      app: devops-argocd-test
  template:
    metadata:
      labels:
        app: devops-argocd-test
    spec:
      containers:
        - name: devops-argocd-test
          image: registry.cn-hangzhou.aliyuncs.com/rookieops/argocd-test-app:v1
          imagePullPolicy: Always
          ports:
            - containerPort: 8080
              name: tcp-8080
              protocol: TCP
---
apiVersion: v1
kind: Service
metadata:
  labels:
    app: devops-argocd-test
  name: devops-argocd-test
  namespace: default
spec:
  ports:
    - name: tcp-8080
      port: 8080
      protocol: TCP
      targetPort: 8080
  selector:
    app: devops-argocd-test
  sessionAffinity: None
  type: NodePort
```

  

现在我们在Argo里创建应用，步骤如下：

（1）添加仓库地址，Settings → Repositories，点击 `Connect Repo using HTTPS` 按钮：

![image.png](assets/devops与交付/使用ArgoCD进行持续部署/使用ArgoCD进行持续部署-6.png)

填入以下信息。

![image.png](assets/devops与交付/使用ArgoCD进行持续部署/使用ArgoCD进行持续部署-7.png)

验证通过后显示如下：

![image.png](assets/devops与交付/使用ArgoCD进行持续部署/使用ArgoCD进行持续部署-8.png)

（2）创建应用

![image.png](assets/devops与交付/使用ArgoCD进行持续部署/使用ArgoCD进行持续部署-9.png)

![image.png](assets/devops与交付/使用ArgoCD进行持续部署/使用ArgoCD进行持续部署-10.png)

创建完成后如下所示：

![image.png](assets/devops与交付/使用ArgoCD进行持续部署/使用ArgoCD进行持续部署-11.png)

由于我设置的是手动SYNC，所以需要点以下下面的SYNC进行同步。

  

然后可以看到状态都变成正常。

![image.png](assets/devops与交付/使用ArgoCD进行持续部署/使用ArgoCD进行持续部署-12.png)

这时候我们在集群里可以看到创建了v1版本的应用了。

```yaml
# kubectl get pod | grep devops-argocd-test
devops-argocd-test-7f5fdd9fcf-xbzmp      1/1     Running   0          118s
# kubectl get svc | grep devops-argocd-test
devops-argocd-test   NodePort    10.97.159.140   <none>        8080:31980/TCP   2m6s

```

这时候访问应用，如下：

![image.png](assets/devops与交付/使用ArgoCD进行持续部署/使用ArgoCD进行持续部署-13.png)

  

### 配置变更

接下来我手动进行配置变更，修改manifests下的deploymeny.yaml文件中的镜像为v2版本，如下：

![image.png](assets/devops与交付/使用ArgoCD进行持续部署/使用ArgoCD进行持续部署-14.png)

  

然后提交到仓库。

  

这是到ArgoCD中可以看到状态变成了OutOfSync

![image.png](assets/devops与交付/使用ArgoCD进行持续部署/使用ArgoCD进行持续部署-15.png)

  

这时候再手动sync以下，直到状态都变正常。再访问上面的应用。

![image.png](assets/devops与交付/使用ArgoCD进行持续部署/使用ArgoCD进行持续部署-16.png)

![image.png](assets/devops与交付/使用ArgoCD进行持续部署/使用ArgoCD进行持续部署-17.png)

可以看到应用已经更新部署了。

  

我们可以看到整个应用的关系状态，如下：

![image.png](assets/devops与交付/使用ArgoCD进行持续部署/使用ArgoCD进行持续部署-18.png)

还可以看到部署历史。

![image.png](assets/devops与交付/使用ArgoCD进行持续部署/使用ArgoCD进行持续部署-19.png)

也可以通过这个界面进行回滚。

![image.png](assets/devops与交付/使用ArgoCD进行持续部署/使用ArgoCD进行持续部署-20.png)

不过这个回滚并不会回改gitlab上的代码哈。

  

我上面设置的是手动，你可以设置为自动，自己动手测试一番吧。

  

  

  

> 官方文档：[https://argoproj.github.io/argo-cd/#features](https://argoproj.github.io/argo-cd/#features)