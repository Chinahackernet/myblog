# Helm App创建

> 分类：CI/CD / 第17章：ArgoCD创建APP
> 原文：https://www.cuiliangblog.cn/detail/section/174782935
> 来源：崔亮的博客

---

# gitlab仓库配置
## 克隆代码
```bash
[root@tiaoban opt]# cd /opt/
[root@tiaoban opt]# git clone http://gitlab.local.com/devops/argo-demo.git
正克隆到 'argo-demo'...
remote: Enumerating objects: 18, done.
remote: Counting objects: 100% (18/18), done.
remote: Compressing objects: 100% (15/15), done.
remote: Total 18 (delta 4), reused 0 (delta 0), pack-reused 0 (from 0)
接收对象中: 100% (18/18), 4.41 KiB | 4.41 MiB/s, 完成.
处理 delta 中: 100% (4/4), 完成.
[root@tiaoban opt]# cd argo-demo/
[root@tiaoban argo-demo]# ls
manifests  README.md
```

## 创建Helm应用
helm具体参考可参考文档：[../06_Kubernetes/15-04_%E8%87%AA%E5%AE%9A%E4%B9%89Charts.md](articles/06-Kubernetes/15-04_自定义Charts.md)

创建一个名为helm的app

```bash
[root@tiaoban argo-demo]# helm create helm
Creating helm
[root@tiaoban argo-demo]# ls
helm  manifests  README.md
[root@tiaoban argo-demo]# tree helm
helm
├── charts
├── Chart.yaml
├── templates
│   ├── deployment.yaml
│   ├── _helpers.tpl
│   ├── hpa.yaml
│   ├── ingress.yaml
│   ├── NOTES.txt
│   ├── serviceaccount.yaml
│   ├── service.yaml
│   └── tests
│       └── test-connection.yaml
└── values.yaml

3 directories, 10 files
```

修改helm配置

```bash
[root@tiaoban argo-demo]# cd helm/
[root@tiaoban helm]# vim Chart.yaml
appVersion: "v1" # 修改默认镜像版本为v1
[root@tiaoban helm]# vim values.yaml
image:
  repository: ikubernetes/myapp # 修改镜像仓库地址
```

helm文件校验

```bash
[root@tiaoban helm]# cd ..
[root@tiaoban argo-demo]# helm lint helm
==> Linting helm
[INFO] Chart.yaml: icon is recommended

1 chart(s) linted, 0 chart(s) failed
```

## 推送代码
```bash
[root@tiaoban helm]# git add .
[root@tiaoban helm]# git commit -m "add helm"
[main ad69f78] add helm
 11 files changed, 405 insertions(+)
 create mode 100644 helm/.helmignore
 create mode 100644 helm/Chart.yaml
 create mode 100644 helm/templates/NOTES.txt
 create mode 100644 helm/templates/_helpers.tpl
 create mode 100644 helm/templates/deployment.yaml
 create mode 100644 helm/templates/hpa.yaml
 create mode 100644 helm/templates/ingress.yaml
 create mode 100644 helm/templates/service.yaml
 create mode 100644 helm/templates/serviceaccount.yaml
 create mode 100644 helm/templates/tests/test-connection.yaml
 create mode 100644 helm/values.yaml
[root@tiaoban helm]# git push 
枚举对象中: 17, 完成.
对象计数中: 100% (17/17), 完成.
使用 4 个线程进行压缩
压缩对象中: 100% (15/15), 完成.
写入对象中: 100% (16/16), 5.56 KiB | 2.78 MiB/s, 完成.
总共 16（差异 0），复用 0（差异 0），包复用 0
To http://gitlab.local.com/devops/argo-demo.git
   2a78761..ad69f78  main -> main
```

## 查看验证
![](assets/04-CI-CD/143a339387b8110e2ecf.png)

# Argo CD配置
## 创建helm类型的app（UI）
通过Argo UI创建app，填写如下信息：

![](assets/04-CI-CD/a948e1aa553ddd2fa4e9.png)

除了指定 yaml 文件外，也可以在 Application 中自定义 values 值。

![](assets/04-CI-CD/236a87f3bb422d195aaf.png)

## 创建 helm 类型的 app（yaml）
```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: demo-helm
  namespace: argocd
spec:
  project: devops
  source:
    repoURL: http://gitlab.cuiliangblog.cn/devops/argo-demo.git
    targetRevision: HEAD
    path: helm
    helm:
      valueFiles:
        - values.yaml
  destination:
    server: https://kubernetes.default.svc
    namespace: test
  syncPolicy:
    automated:
      enabled: true
```

## 创建 helm 类型的 app（CLI）
```bash
argocd app create demo-helm \
  --project devops \
  --repo http://gitlab.cuiliangblog.cn/devops/argo-demo.git \
  --path helm \
  --dest-server https://kubernetes.default.svc \
  --dest-namespace test \
  --helm-value-files values.yaml \
  --sync-policy automated
```

## 查看验证
查看argo cd应用信息，已完成部署。

![](assets/04-CI-CD/dbc964248aaf49044c0c.png)

登录k8s查看资源

```bash
# kubectl get all -n test  
NAME                                  READY   STATUS    RESTARTS   AGE
pod/demo-helm-myapp-c89789845-v2frf   1/1     Running   0          13m

NAME                      TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)   AGE
service/demo-helm-myapp   ClusterIP   10.100.159.152   <none>        80/TCP    13m

NAME                              READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/demo-helm-myapp   1/1     1            1           13m

NAME                                        DESIRED   CURRENT   READY   AGE
replicaset.apps/demo-helm-myapp-c89789845   1         1         1       13m
```

## 版本更新测试
修改git仓库文件，模拟版本更新。

```bash
# 修改chart包和镜像版本
[root@tiaoban helm]# vim Chart.yaml
version: 0.2.0
appVersion: "v2"
[root@tiaoban helm]# vim values.yaml
image:
  tag: "v2"
# 提交推送至git仓库
[root@tiaoban helm]# git add .
[root@tiaoban helm]# git commit -m "update helm v2"
[root@tiaoban helm]# git push
```

查看argo cd更新记录

![](assets/04-CI-CD/3c97dd419b1f2088e6f4.png)

访问验证

```bash
[root@tiaoban helm]# kubectl exec -it rockylinux -- bash
[root@rockylinux /]# curl demo-helm 
Hello MyApp | Version: v2 | <a href="hostname.html">Pod Name</a>
```


