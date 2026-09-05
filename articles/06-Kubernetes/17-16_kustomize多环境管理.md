# kustomize多环境管理

> 分类：Kubernetes / 第17章：日常维护
> 原文：https://www.cuiliangblog.cn/detail/section/119720072
> 来源：崔亮的博客

---

# kustomize简介
## kustomize功能
一般应用都会存在多套部署环境：开发环境、测试环境、生产环境，多套环境意味着存在多套 K8S 应用资源 YAML。而这么多套 YAML 之间只存在微小配置差异，比如镜像版本不同、Label 不同等，而这些不同环境下的YAML 经常会因为人为疏忽导致配置错误。再者，多套环境的 YAML 维护通常是通过把一个环境下的 YAML 拷贝出来然后对差异的地方进行修改。一些类似 Helm 等应用管理工具需要额外学习DSL 语法。总结以上，在 k8s 环境下存在多套环境的应用，经常遇到以下几个问题：

+ 如何管理不同环境或不同团队的应用的 Kubernetes YAML 资源
+ 如何以某种方式管理不同环境的微小差异，使得资源配置可以复用，减少 copy and change 的工作量
+ 如何简化维护应用的流程，不需要额外学习模板语法

Kustomize 通过以下几种方式解决了上述问题：

+ kustomize 通过 Base & Overlays 方式(下文会说明)方式维护不同环境的应用配置
+ kustomize 使用 patch 方式复用 Base 配置，并在 Overlay 描述与 Base 应用配置的差异部分来实现资源复用
+ kustomize 管理的都是 Kubernetes 原生 YAML 文件，不需要学习额外的 DSL 语法

## kustomize术语
在 kustomize 项目的文档中，经常会出现一些专业术语，这里总结一下常见的术语，方便后面讲解

+ kustomization

术语 kustomization 指的是 kustomization.yaml 文件，或者指的是包含 kustomization.yaml 文件的目录以及它里面引用的所有相关文件路径

+ base

base 指的是一个 kustomization , 任何的 kustomization 包括 overlay (后面提到)，都可以作为另一个 kustomization 的 base (简单理解为基础目录)。base 中描述了共享的内容，如资源和常见的资源配置

+ overlay

overlay 是一个 kustomization, 它修改(并因此依赖于)另外一个 kustomization. overlay 中的 kustomization指的是一些其它的 kustomization, 称为其 base. 没有 base, overlay 无法使用，并且一个 overlay 可以用作 另一个 overlay 的 base(基础)。简而言之，overlay 声明了与 base 之间的差异。通过 overlay 来维护基于 base 的不同 variants(变体)，例如开发、QA 和生产环境的不同 variants

+ variant

variant 是在集群中将 overlay 应用于 base 的结果。例如开发和生产环境都修改了一些共同 base 以创建不同的 variant。这些 variant 使用相同的总体资源，并与简单的方式变化，例如 deployment 的副本数、ConfigMap使用的数据源等。简而言之，variant 是含有同一组 base 的不同 kustomization

+ resource

在 kustomize 的上下文中，resource 是描述 k8s API 对象的 YAML 或 JSON 文件的相对路径。即是指向一个声明了 kubernetes API 对象的 YAML 文件

+ patch

修改文件的一般说明。文件路径，指向一个声明了 kubernetes API patch 的 YAML 文件

# 安装kustomize
在kubernetes 1.14版本以上，已经集成到kubectl中了，你可以通过kubectl version来进行查看命令。

```bash
[root@k8s-master ~]# kubectl version --client
Client Version: v1.30.14
Kustomize Version: v5.0.4-0.20230601165947-6ce0bf390ce3
```

但是内置的kustomize功能较少，推荐安装完整的kustomize客户端，使用更多功能。

软件包下载地址：[https://github.com/kubernetes-sigs/kustomize/releases/tag/kustomize%2Fv5.0.2](https://github.com/kubernetes-sigs/kustomize/releases/tag/kustomize%2Fv5.0.2)，安装时注意与k8s版本相匹配。

```bash
[root@k8s-master ~]# wget https://github.com/kubernetes-sigs/kustomize/releases/download/kustomize%2Fv5.0.2/kustomize_v5.0.2_linux_amd64.tar.gz
[root@k8s-master ~]# tar -zxvf kustomize_v5.0.2_linux_amd64.tar.gz 
[root@k8s-master ~]# mv kustomize /usr/local/bin/
[root@k8s-master ~]# kustomize version
v5.0.2
```

# 实践使用
## 环境说明
|  | 副本数 | 环境变量 | 名称空间 |
| --- | --- | --- | --- |
| 测试环境 | 1 | env_test | test |
| 生产环境 | 5 | emv_prod | prod |


## 创建基础模板文件
首先创建一个项目目录，并在其中新建一个base目录作为基础目录，后续其他环境配置以此为基础更改。

```bash
[root@k8s-master k8s-test]# tree kustomize-test/
kustomize-test/
└── base
    ├── deployment.yaml
    ├── kustomization.yaml
    └── service.yaml
```

yaml资源文件内容如下：

```yaml
[root@k8s-master base]# cat deployment.yaml 
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
[root@k8s-master base]# cat service.yaml 
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
```

kustomization.yaml内容如下，在resources中列出所有base的yaml文件即可。

```yaml
[root@k8s-master base]# cat kustomization.yaml 
resources:
  - deployment.yaml
  - service.yaml
```

查看构建后的文件，实际上就是将多个yaml文件合并到一个文件中。

```yaml
[root@k8s-master base]# kustomize build .
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

创建资源，用法和kubectl创建资源一样，只不过将-f改为-k

```bash
[root@k8s-master base]# kubectl apply -k .
service/myapp created
deployment.apps/myapp created
[root@k8s-master base]# kubectl get pod 
NAME                                               READY   STATUS    RESTARTS         AGE
myapp-7b5d6dcdd5-gc7rv                             1/1     Running   0                7s
[root@k8s-master base]# kubectl get svc
NAME         TYPE           CLUSTER-IP      EXTERNAL-IP      PORT(S)    AGE
myapp        ClusterIP      10.99.127.46    <none>           80/TCP     11s

```

还可以通过kustomize命令创建

```bash
kustomize build . | kubectl apply -f -
```

删除命令创建命令类似，使用delete即可。

```bash
[root@k8s-master base]# kubectl delete -k .
service "myapp" deleted
deployment.apps "myapp" deleted
```

## 配置测试环境
在base目录同级下新建overlays目录，然后再按不同的环境建立子目录即可。

```bash
[root@k8s-master kustomize-test]# tree .
.
├── base
│   ├── deployment.yaml
│   ├── kustomization.yaml
│   └── service.yaml
└── overlays
    └── test
        ├── env.yaml
        └── kustomization.yaml
```

在测试环境，我们需要新增环境变量，直接根据deployment.yaml修改即可，注意deployment的name和containers的name要和base中的保持一致，才能匹配到并覆盖。

```yaml
[root@k8s-master test]# cat env.yaml 
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
            value: test
```

在kustomization.yaml中，要将resources改为base目录路径，并加载env.yaml文件，指定名称空间

```yaml
[root@k8s-master test]# cat kustomization.yaml 
resources:
- ../../base

patches:
- path: env.yaml
namespace: test
```

创建资源测试

```yaml
[root@k8s-master test]# kustomize build .
apiVersion: v1
kind: Service
metadata:
  name: myapp
  namespace: test
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
  namespace: test
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
          value: test
        image: ikubernetes/myapp:v1
        name: myapp
        ports:
        - containerPort: 80
        resources:
          limits:
            cpu: 500m
            memory: 128Mi
[root@k8s-master test]# kubectl apply -k .
service/myapp created
deployment.apps/myapp created
[root@k8s-master test]# kubectl get all -n test
NAME                        READY   STATUS    RESTARTS   AGE
pod/myapp-7f88884b4-ls97g   1/1     Running   0          19s

NAME            TYPE        CLUSTER-IP     EXTERNAL-IP   PORT(S)   AGE
service/myapp   ClusterIP   10.105.95.46   <none>        80/TCP    19s

NAME                    READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/myapp   1/1     1            1           19s

NAME                              DESIRED   CURRENT   READY   AGE
replicaset.apps/myapp-7f88884b4   1         1         1       19s
```

## 配置生产环境
在overlays目录，然后再新建prod目录，此时目录结构如下：

```bash
[root@k8s-master kustomize-test]# tree .
.
├── base
│   ├── deployment.yaml
│   ├── kustomization.yaml
│   └── service.yaml
└── overlays
    ├── prod
    │   ├── env.yaml
    │   ├── kustomization.yaml
    │   └── replicas.yaml
    └── test
        ├── env.yaml
        └── kustomization.yaml
```

在生成环境，我们需要新增环境变量，修改副本数

```yaml
[root@k8s-master prod]# cat env.yaml 
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
            value: prod
[root@k8s-master prod]# cat replicas.yaml 
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
spec:
  replicas: 3
```

在kustomization.yaml中，要将resources改为base目录路径，并加载env.yaml文件，指定名称空间

```yaml
[root@k8s-master prod]# cat kustomization.yaml 
resources:
  - ../../base

patches:
  - path: env.yaml
  - path: replicas.yaml
namespace: prod
```

创建资源测试

```yaml
[root@k8s-master prod]# kustomize build .
apiVersion: v1
kind: Service
metadata:
  name: myapp
  namespace: prod
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
  namespace: prod
spec:
  replicas: 3
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
          value: prod
        image: ikubernetes/myapp:v1
        name: myapp
        ports:
        - containerPort: 80
        resources:
          limits:
            cpu: 500m
            memory: 128Mi
[root@k8s-master prod]# kubectl create ns prod
namespace/prod created
[root@k8s-master prod]# kubectl apply -k .
service/myapp created
deployment.apps/myapp created
[root@k8s-master prod]# kubectl get all -n prod
NAME                        READY   STATUS    RESTARTS   AGE
pod/myapp-87c99f65c-hvs2b   1/1     Running   0          10s
pod/myapp-87c99f65c-kzhgk   1/1     Running   0          10s
pod/myapp-87c99f65c-zlpl8   1/1     Running   0          10s

NAME            TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)   AGE
service/myapp   ClusterIP   10.99.161.128   <none>        80/TCP    10s

NAME                    READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/myapp   3/3     3            3           10s

NAME                              DESIRED   CURRENT   READY   AGE
replicaset.apps/myapp-87c99f65c   3         3         3       10s
```

## 其他操作
在进行持续部署的时候每次都需要修改镜像地址为最新的版本，使用kustomize也可以简单的实现。

加入我们要修改test环境下的镜像地址为nginx，命令如下，其中myapp表示container名， nginx:latest为新镜像名

```yaml
cd overlays/test
kustomize edit set image myapp=nginx:latest
```

同样，修改namespace可以使用如下命令。

```yaml
kustomize edit set namespace test
```

其他特性字段配置可参考文档：[https://kubernetes.io/zh-cn/docs/tasks/manage-kubernetes-objects/kustomization/#kustomize-feature-list](https://kubernetes.io/zh-cn/docs/tasks/manage-kubernetes-objects/kustomization/#kustomize-feature-list)


