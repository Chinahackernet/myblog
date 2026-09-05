![](assets/kubernetes与云原生/使用Kustomize管理K8S的yaml清单/使用Kustomize管理K8S的yaml清单-1.jpeg)

  

  

将应用部署到Kubernetes中的方式有很多，目前主流是就是使用`kubectl`和`Helm`，不过其先决条件都需要YAML清单文件。

  

不同由于部署环境的多样化，比如有开发环境、测试环境、预生产环境、生产环境，我们就会针对不同的环境定制各种YAML文件，但是在很多情况下同一个应用在不同的环境可能只做了简单的更改，这样就会导致YAML泛滥。

  

而**Kustomize 就是用于帮助解决这些问题的开源配置管理工具。**从 Kubernetes v1.14 开始，kubectl 就完全支持 Kustomize 和 kustomization 文件。

  

## kustomize是什么？

> `kustomize` lets you customize raw, template-free YAML files for multiple purposes, leaving the original YAML untouched and usable as is.

  

上面是官方对于kustomize的定义。大致是说：kustomize允许您自定义无模板的原始YAML文件来用于多种目的，而原始的YAML则保持不变并可以使用。

  

## kustomize的作用

当我们在K8S中有多套环境的时候，就会面临如下问题：

-   多环境多团队多个YAML资源清单
-   不同环境差异微小，但是不得不copy and change
-   helm稍显复杂，需要额外的学习投入

  

而kustomize可以很好的解决这些问题：

-   kustomize 通过 Base & Overlays 方式方式维护不同环境的应用配置
-   kustomize 使用 patch 方式复用 Base 配置，并在 Overlay 描述与 Base 应用配置的差异部分来实现资源复用
-   kustomize 管理的都是 Kubernetes 原生 YAML 文件，不需要学习额外的 DSL 语法

  

## 安装

在kubernetes 1.14版本以上，已经集成到kubectl中了，你可以通过`kubectl --help`来进行查看命令。

  

如果需要额外安装，直接到[https://github.com/kubernetes-sigs/kustomize/releases](https://github.com/kubernetes-sigs/kustomize/releases)里进行下载对应的版本。

  

比如：

```shell
wget https://github.com/kubernetes-sigs/kustomize/releases/download/kustomize%2Fv3.8.7/kustomize_v3.8.7_linux_amd64.tar.gz
tar xf kustomize_v3.8.7_linux_amd64.tar.gz
cp kustomize/kustomize /usr/local/bin
```

这样就完成了简单的安装了。

  

## 实践测试

### 背景

-   版本信息

-   kubernetes：1.17.9

-   集群信息，由于在一个环境中进行测试，所以采用不同的namespace进行分开

-   开发环境：dev
-   预发环境：stag
-   生产环境：prod

-   测试用例：一个简单的hello world示例

  

### 创建基础模板

首先创建一个helloworld目录，表示应用，然后在里面创建一个base目录，如下：

```shell
mkdir helloworld/base -p
```

然后在base目录下创建以下配置清单：

```shell
base/
├── configMap.yaml
├── deployment.yaml
├── ingress.yaml
├── kustomization.yaml
└── service.yaml
```

他们的清单内容分别如下：

configMap.yaml

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: the-map
  namespace: default
data:
  altGreeting: "Hello World!"
  enableRisky: "false"
```

deployment.yaml

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: the-deployment
  namespace: default
spec:
  replicas: 3
  selector:
    matchLabels:
      deployment: hello
  template:
    metadata:
      labels:
        deployment: hello
    spec:
      containers:
      - name: the-container
        image: monopole/hello:1
        command: ["/hello",
                  "--port=8080",
                  "--enableRiskyFeature=$(ENABLE_RISKY)"]
        ports:
        - containerPort: 8080
        env:
        - name: ALT_GREETING
          valueFrom:
            configMapKeyRef:
              name: the-map
              key: altGreeting
        - name: ENABLE_RISKY
          valueFrom:
            configMapKeyRef:
              name: the-map
              key: enableRisky
```

service.yaml

```yaml
kind: Service
apiVersion: v1
metadata:
  name: the-service
  namespace: default
spec:
  selector:
    deployment: hello
  type: NodePort
  ports:
  - protocol: TCP
    port: 8080
    targetPort: 8080
```

ingress.yaml

```yaml
apiVersion: extensions/v1beta1
kind: Ingress
metadata:
  name: the-ingress 
  namespace: default
spec:
  rules:
    - host: test.coolops.cn 
      http:
        paths:
          - backend:
              serviceName: the-service 
              servicePort: 8080 
            path: /
```

kustomization.yaml

```yaml
# Example configuration for the webserver
# at https://github.com/monopole/hello
commonLabels:
  app: hello

resources:
- deployment.yaml
- service.yaml
- configMap.yaml
- ingress.yaml
```

这样基础模板就创建好了，我们可以使用如下命令将所有文件连在一起。

```yaml
kustomize build ../base
```

然后如果想创建应用可以用以下方式。

```yaml
# 直接使用kubectl apply -k （集群版本要高于1.14）
kubectl apply -k ../base/
# 还可以通过kustomize命令
kustomize build ../base | kubectl apply -f -
```

删除应用命令类似，可以自行尝试。

  

### 根据不同环境创建overlays

上面的是基础模板，所有的配置都是基于它，现在我们根据不同的环境进行定制。

首先创建如下目录结构

```yaml
.
├── base
│   ├── configMap.yaml
│   ├── deployment.yaml
│   ├── ingress.yaml
│   ├── kustomization.yaml
│   └── service.yaml
└── overlays
    ├── dev
    ├── prod
    └── stag
```

其中：

-   dev目录下存放开发环境定制清单
-   stag目录下存放预发环境定制清单
-   prod目录下存放生产环境定制清单

  

#### 配置开发环境

在dev目录下创建以下文件：

```yaml
../dev/
├── ingress.yaml
├── kustomization.yaml
└── map.yaml
```

其中ingress.yaml如下：

```yaml
apiVersion: extensions/v1beta1
kind: Ingress
metadata:
  name: the-ingress 
  namespace: default
spec:
  rules:
    - host: hello-dev.coolops.cn 
      http:
        paths:
          - backend:
              serviceName: the-service 
              servicePort: 8080 
            path: /
```

map.yaml

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: the-map
data:
  altGreeting: "Hello,This is Dev!"
  enableRisky: "true"
```

kustomization.yaml

```yaml
namePrefix: dev-
commonLabels:
  org: acmeCorporation
  variant: dev
commonAnnotations:
  note: Hello, This is dev!
patchesStrategicMerge:
- map.yaml
- ingress.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
resources:
- ../../base
namespace: dev
```

开发环境更改了configmap的内容、ingress的host，还有namespace。

  

然后可以通过`kustomize build .`测试配置是否正确。

  

#### 配置预发环境

在stag目录下创建以下文件：

```yaml
../stag/
├── kustomization.yaml
└── map.yaml
```

其中map.yaml内容如下：

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: the-map
data:
  altGreeting: "Hello,This is Stag!"
  enableRisky: "true"
```

kustomization.yaml

```yaml
namePrefix: stag-
commonLabels:
  org: acmeCorporation
  variant: stag
commonAnnotations:
  note: Hello, This is stag!
patchesStrategicMerge:
- map.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
resources:
- ../../base
namespace: stag
```

预发环境更改了configmap和namespace。

  

#### 配置生产环境

在prod目录下创建以下文件：

```yaml
../prod/
├── deployment.yaml
├── kustomization.yaml
└── map.yaml
```

其中deployment.yaml配置如下：

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: the-deployment
spec:
  replicas: 3
```

map.yaml

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: the-map
data:
  altGreeting: "Hello,This is prod!"
  enableRisky: "true"
```

kustomization.yaml

```yaml
namePrefix: prod-
commonLabels:
  org: acmeCorporation
  variant: prod
commonAnnotations:
  note: Hello, This is prod!
patchesStrategicMerge:
- deployment.yaml
- map.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
resources:
- ../../base
namespace: prod
```

生产环境更改了configmap、deploy副本数、namspace。

  

### 发布使用

上面我们已经将整个需要的配置定制好了。现在就可以进行发布了。

如果要发布开发环境，则使用：

```yaml
cd helloworld/
kustomize build overlays/dev/ | kubectl apply -f -
```

然后我们可以看到发布完成，如下：

```yaml
# kubectl get all -n dev
NAME                                      READY   STATUS    RESTARTS   AGE
pod/dev-the-deployment-6cdcbbc878-27n5g   1/1     Running   0          50s
pod/dev-the-deployment-6cdcbbc878-fgx89   1/1     Running   0          50s
pod/dev-the-deployment-6cdcbbc878-xz5q2   1/1     Running   0          50s

NAME                      TYPE       CLUSTER-IP      EXTERNAL-IP   PORT(S)          AGE
service/dev-the-service   NodePort   10.103.77.190   <none>        8080:32414/TCP   50s

NAME                                 READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/dev-the-deployment   3/3     3            3           50s

NAME                                            DESIRED   CURRENT   READY   AGE
replicaset.apps/dev-the-deployment-6cdcbbc878   3         3         3       50s
```

然后通过域名访问如下：

![image.png](assets/kubernetes与云原生/使用Kustomize管理K8S的yaml清单/使用Kustomize管理K8S的yaml清单-2.png)

其他环境是类似的操作，这里不再赘述。

  

### 结合CD使用

在进行持续部署的时候每次都需要修改镜像地址为最新的版本，使用kustomize也可以简单的实现。

  

加入我们要修改dev环境下的镜像地址为nginx，命令如下

```yaml
cd overlays/dev
kustomize edit set image monopole/hello=nginx:latest
```

说明：

-   monopole/hello是原来的镜像名字
-   nginx:latest是新的镜像+标签

然后可以看到kustomization.yaml下的镜像地址已经变成了nginx，如下：

```yaml
namePrefix: dev-
commonLabels:
  org: acmeCorporation
  variant: dev
commonAnnotations:
  note: Hello, This is dev!
patchesStrategicMerge:
- map.yaml
- ingress.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
resources:
- ../../base
namespace: dev
images:
- name: monopole/hello
  newName: nginx
  newTag: latest
```

我们这时候再发布，就是nginx的镜像了。

```yaml
# kustomize build . | kubectl apply -f -
configmap/dev-the-map unchanged
service/dev-the-service unchanged
deployment.apps/dev-the-deployment configured
ingress.extensions/dev-the-ingress unchanged
```

同样，修改namespace可以使用如下命令。

```yaml
kustomize edit set namespace test
```

更多操作可以查看官方文档：[https://kubernetes-sigs.github.io/kustomize/zh/guides/](https://kubernetes-sigs.github.io/kustomize/zh/guides/)

  

### 写在最后

使用 Kustomize 简化了针对不同环境的应用程序配置的管理。我们将一组几乎重复的 YAML 文件重组为一个分层模型，这将减少错误，减少手动配置，并使代码更易于识别和维护。

  

### 参考文档

-   [https://kubernetes-sigs.github.io/kustomize/zh/guides/](https://kubernetes-sigs.github.io/kustomize/zh/guides/)
-   [https://github.com/kubernetes-sigs/kustomize](https://github.com/kubernetes-sigs/kustomize)
-   [https://kubernetes.io/zh/docs/tasks/manage-kubernetes-objects/kustomization/#%E5%87%86%E5%A4%87%E5%BC%80%E5%A7%8B](https://kubernetes.io/zh/docs/tasks/manage-kubernetes-objects/kustomization/#%E5%87%86%E5%A4%87%E5%BC%80%E5%A7%8B)