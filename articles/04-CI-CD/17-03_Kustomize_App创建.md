# Kustomize App创建

> 分类：CI/CD / 第17章：ArgoCD创建APP
> 原文：https://www.cuiliangblog.cn/detail/section/174782965
> 来源：崔亮的博客

---

# 仓库资源配置
## 创建Kustomize应用
Kustomize具体参考可参考文档：[../06_Kubernetes/17-16_kustomize%E5%A4%9A%E7%8E%AF%E5%A2%83%E7%AE%A1%E7%90%86.md](articles/06-Kubernetes/17-16_kustomize多环境管理.md)

基础模板文件

```yaml
[root@tiaoban argo-demo]# mkdir kustomize
[root@tiaoban argo-demo]# cd kustomize/
[root@tiaoban kustomize]# mkdir base
[root@tiaoban kustomize]# cd base/
[root@tiaoban kustomize]# cat deployment.yaml 
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
[root@tiaoban kustomize]# cat service.yaml 
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
[root@tiaoban kustomize]# cat kustomization.yaml 
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

resources:
  - deployment.yaml
  - service.yaml
```

Kustomize文件验证

```yaml
[root@tiaoban base]# kustomize build .
apiVersion: v1
kind: Service
metadata:
  name: myapp
spec:
  ports:
  - port: 80
    targetPort: 80
  selector:
    app: myapp
  type: ClusterIP
---
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
      - image: ikubernetes/myapp:v1
        name: myapp
        ports:
        - containerPort: 80
        resources:
          limits:
            cpu: 500m
            memory: 128Mi
```

创建测试环境

```yaml
[root@tiaoban kustomize]# ls
base
[root@tiaoban kustomize]# mkdir overlays
[root@tiaoban kustomize]# cd overlays/
[root@tiaoban overlays]# mkdir dev
[root@tiaoban overlays]# cd dev/
[root@tiaoban dev]# cat env.yaml 
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
spec:
  template:
    spec:
      containers:
      - name: myapp
        env:
          - name: ENV_NAME
            value: dev
[root@tiaoban dev]# cat kustomization.yaml 
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

resources:
- ../../base

patches:
- path: env.yaml
namespace: dev
```

此时目录结构如下

```bash
[root@tiaoban argo-demo]# tree kustomize/
kustomize/
├── base
│   ├── deployment.yaml
│   ├── kustomization.yaml
│   └── service.yaml
└── overlays
    └── dev
        ├── env.yaml
        └── kustomization.yaml
```

测试验证

```yaml
[root@tiaoban argo-demo]# kustomize build kustomize/overlays/dev/
kustomize build kustomize/overlays/dev/
apiVersion: v1
kind: Service
metadata:
  name: myapp
  namespace: dev
spec:
  ports:
  - port: 80
    targetPort: 80
  selector:
    app: myapp
  type: ClusterIP
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
  namespace: dev
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
      - env:
        - name: ENV_NAME
          value: dev
        image: ikubernetes/myapp:v1
        name: myapp
        ports:
        - containerPort: 80
        resources:
          limits:
            cpu: 500m
            memory: 512Mi
          requests:
            cpu: 100m
            memory: 128Mi
```

## 推送代码
```bash
[root@tiaoban argo-demo]# git add .
[root@tiaoban argo-demo]# git commit -m "add kustomize"
[root@tiaoban argo-demo]# git push 
```

## 查看验证
![](assets/04-CI-CD/d30751d3202df9914c7f.png)

# Argo CD配置
## 创建Kustomize类型的app
通过Argo UI创建app，填写如下信息：

![](assets/04-CI-CD/631d89246c5bfd352134.png)

## 查看验证
查看argo cd应用信息，已完成部署。

![](assets/04-CI-CD/8226be5a373aeb30fc91.png)

登录k8s查看资源

```bash
[root@tiaoban ~]# kubectl get pod -n dev -o wide
NAME                     READY   STATUS    RESTARTS   AGE   IP            NODE    NOMINATED NODE   READINESS GATES
myapp-569fbc7fc9-x72pr   1/1     Running   0          41s   10.244.3.32   work3   <none>           <none>
[root@tiaoban ~]# kubectl get svc -n dev
NAME    TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)   AGE
myapp   ClusterIP   10.99.178.248   <none>        80/TCP    53s
[root@tiaoban ~]# kubectl exec -it rockylinux -- bash
[root@rockylinux /]# curl myapp.dev.svc
Hello MyApp | Version: v1 | <a href="hostname.html">Pod Name</a>
```

## 版本更新测试
修改git仓库文件，模拟版本更新

```bash
# 修改Kustomize镜像版本
[root@tiaoban dev]# cat image.yaml 
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
spec:
  template:
    spec:
      containers:
      - name: myapp
        image: ikubernetes/myapp:v2
[root@tiaoban dev]# cat kustomization.yaml 
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

resources:
- ../../base

patches:
- path: env.yaml
- path: image.yaml
namespace: dev
# 提交推送至git仓库
[root@tiaoban helm]# git add .
[root@tiaoban helm]# git commit -m "update helm v2"
[root@tiaoban helm]# git push
```

查看argo cd更新记录

![](assets/04-CI-CD/5f93925f312ce3cfbbbc.png)

访问验证

```bash
[root@tiaoban helm]# kubectl exec -it rockylinux -- bash
[root@rockylinux /]# curl myapp.dev.svc
Hello MyApp | Version: v2 | <a href="hostname.html">Pod Name</a>
```


