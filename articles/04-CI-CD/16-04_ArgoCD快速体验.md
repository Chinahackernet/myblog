# ArgoCD快速体验

> 分类：CI/CD / 第16章：ArgoCD与GitOps入门
> 原文：https://www.cuiliangblog.cn/detail/section/119675638
> 来源：崔亮的博客

---

# gitlab仓库配置
创建一个名为Argo Demo的仓库，在manifests目录下仅包含应用的yaml文件，文件内容如下

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
spec:
  selector:
    matchLabels:
      app: myapp
  template:
    metadata:
      labels:
        app: myapp
    spec:
      containers:
      - name: myapp
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
  name: myapp
spec:
  type: ClusterIP
  selector:
    app: myapp
  ports:
  - port: 80
    targetPort: 80
---
apiVersion: traefik.io/v1alpha1
kind: IngressRoute
metadata:
  name: myapp
spec:
  entryPoints:
  - web
  routes:
  - match: Host(`myapp.test.com`)
    kind: Rule
    services:
      - name: myapp 
        port: 80  
```

gitlab仓库内容如下：

![](assets/04-CI-CD/8082c9591a4219940cc1.png)

# argocd配置
## 添加仓库地址
<font style="color:rgb(18, 18, 18);">添加仓库地址，Settings → Repositories，点击 </font><font style="color:rgb(18, 18, 18);background-color:rgb(246, 246, 246);">CONNECT REPO</font><font style="color:rgb(18, 18, 18);"> 按钮添加仓库，填写以下信息</font>

![](assets/04-CI-CD/d58d3bf826bd4942fa17.png)

如果集群连接失败，检查argocd-repo-server 日志，是否可以正常访问 git 仓库，账号密码是否正确，是否有权限访问仓库。

验证通过后显示如下，点击创建应用。

![](assets/04-CI-CD/6d505d842aa5e0564412.png)

## 创建应用
填写以下内容

![](assets/04-CI-CD/45430941c3ca44733e75.png)

![](assets/04-CI-CD/9e409959c4e83a8943b2.png)

创建完后如下所示：

![](assets/04-CI-CD/97f444cace3db690daf9.png)

# 访问验证
## 验证应用部署状态
查看k8s创建的资源信息，发现已经成功创建了对应的资源

```bash
[root@tiaoban ~]# kubectl get pod 
NAME                                               READY   STATUS    RESTARTS         AGE
myapp-68c8648d6d-54brv                             1/1     Running   0                62s
[root@tiaoban ~]# kubectl get svc
NAME         TYPE           CLUSTER-IP      EXTERNAL-IP      PORT(S)    AGE
myapp        ClusterIP      10.97.189.71    <none>           80/TCP     70s
[root@tiaoban ~]# kubectl get ingressroute
NAME     AGE
myapp    78s
```

访问web页面验证

![](assets/04-CI-CD/362d600181ba6c95636f.png)

## 版本更新
接下来模拟配置变更，将镜像版本从v1改为v2

![](assets/04-CI-CD/97d721e76faf76de894b.png)

Argo CD默认每180秒同步一次，查看argocd信息，发现已经自动同步了yaml文件，并且正在进行发布

![](assets/04-CI-CD/7a5fbfaecf5a05767bcc.png)

访问web页面状态，发现已经完成了发布工作。

![](assets/04-CI-CD/e1ed67e6bdf49f3ab425.png)

此时整个应用关联关系如下

![](assets/04-CI-CD/3c59705421f1e2e93c09.png)

## 版本回退
点击history and rollback即可看到整个应用的所有发布记录，并且可以选择指定版本进行回退操作。

![](assets/04-CI-CD/175aac014c2661a8c303.png)

再次访问发现已经回退到v1版本

![](assets/04-CI-CD/6e1c0ad9bb74acdccd5c.png)

# 

