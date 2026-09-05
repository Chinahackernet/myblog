## 什么是argo rollouts

[Argo-Rollout](https://links.jianshu.com/go?to=https%3A%2F%2Fargoproj.github.io%2Fargo-rollouts%2F)是一个Kubernetes Controller和对应一系列的CRD，提供更强大的Deployment能力。包括灰度发布、蓝绿部署、更新测试(experimentation)、渐进式交付(progressive delivery)等特性。

  

支持特性如下：

-   蓝绿色更新策略
-   金丝雀更新策略
-   细粒度，加权流量转移
-   自动回rollback和promotion
-   手动判断
-   可定制的指标查询和业务KPI分析
-   入口控制器集成：NGINX，ALB
-   服务网格集成：Istio，Linkerd，SMI
-   Metric provider集成：Prometheus，Wavefront，Kayenta，Web，Kubernetes Jobs

  

Argo原理和Deployment差不多，只是加强rollout的策略和流量控制。当spec.template发送变化时，Argo-Rollout就会根据spec.strategy进行rollout，通常会产生一个新的ReplicaSet，逐步scale down之前的ReplicaSet的pod数量。

  

## 安装

按着官方文档进行安装，官方地址为：[https://argoproj.github.io/argo-rollouts/installation/#kubectl-plugin-installation](https://argoproj.github.io/argo-rollouts/installation/#kubectl-plugin-installation)

  

（1）在Kubernetes集群中安装argo-rollouts

  

```bash
kubectl create namespace argo-rollouts
kubectl apply -n argo-rollouts -f https://raw.githubusercontent.com/argoproj/argo-rollouts/stable/manifests/install.yaml
```

  

（2）安装argo-rollouts的kubectl plugin

  

```bash
curl -LO https://github.com/argoproj/argo-rollouts/releases/latest/download/kubectl-argo-rollouts-linux-amd64
chmod +x ./kubectl-argo-rollouts-linux-amd64
mv ./kubectl-argo-rollouts-linux-amd64 /usr/local/bin/kubectl-argo-rollouts
```

  

## 金丝雀发布

  

灰度发布包含Replica Shifting和Traffic Shifting两个过程。

-   Replica Shifting：版本替换
-   Traffic Shifting：流量接入

  

这里使用官方的demo来进行测试。例子：[https://argoproj.github.io/argo-rollouts/getting-started/](https://argoproj.github.io/argo-rollouts/getting-started/)

### Replica Shifting

#### 部署应用

使用如下命令部署示例：

```bash
kubectl apply -f https://raw.githubusercontent.com/argoproj/argo-rollouts/master/docs/getting-started/basic/rollout.yaml
kubectl apply -f https://raw.githubusercontent.com/argoproj/argo-rollouts/master/docs/getting-started/basic/service.yaml
```

我们先看看第一个rollout.yaml的具体内容，如下：

```bash
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: rollouts-demo
spec:
  replicas: 5
  strategy:
    canary:
      steps:
      - setWeight: 20
      - pause: {}
      - setWeight: 40
      - pause: {duration: 10}
      - setWeight: 60
      - pause: {duration: 10}
      - setWeight: 80
      - pause: {duration: 10}
  revisionHistoryLimit: 2
  selector:
    matchLabels:
      app: rollouts-demo
  template:
    metadata:
      labels:
        app: rollouts-demo
    spec:
      containers:
      - name: rollouts-demo
        image: argoproj/rollouts-demo:blue
        ports:
        - name: http
          containerPort: 8080
          protocol: TCP
        resources:
          requests:
            memory: 32Mi
            cpu: 5m
```

可以看到除了`apiVersion`，`kind`以及`strategy`之外，其他和Deployment无异。

`strategy`字段定义的是发布策略，其中：

-   setWeight：设置流量的权重
-   pause：暂停，如果里面没有跟`duration: 10`则表示需要手动更新，如果跟了表示等待多长时间会自动跟新。

  

而service.yaml文件定义的就是普通的service，如下：

```bash
apiVersion: v1
kind: Service
metadata:
  name: rollouts-demo
spec:
  ports:
  - port: 80
    targetPort: http
    protocol: TCP
    name: http
  selector:
    app: rollouts-demo
```

  

执行上面命令部署后，会在`default`命名空间下创建5个pod，如下：

```bash
# kubectl get pod 
NAME                                    READY   STATUS    RESTARTS   AGE
nfs-client-prosioner-598d477ff6-fmgwf   1/1     Running   2          17d
rollouts-demo-7bf84f9696-4glv6          1/1     Running   0          78s
rollouts-demo-7bf84f9696-7kqt6          1/1     Running   0          78s
rollouts-demo-7bf84f9696-8k9hw          1/1     Running   0          78s
rollouts-demo-7bf84f9696-9cz2r          1/1     Running   0          78s
rollouts-demo-7bf84f9696-jvzvd          1/1     Running   0          78s
```

  

可以使用`kubectl-argo-rollouts get rollout rollouts-demo`命令来查看部署状态，如下：

```bash
# kubectl-argo-rollouts get rollout rollouts-demo
Name:            rollouts-demo
Namespace:       default
Status:          ✔ Healthy
Strategy:        Canary
  Step:          8/8
  SetWeight:     100
  ActualWeight:  100
Images:          argoproj/rollouts-demo:blue (stable)
Replicas:
  Desired:       5
  Current:       5
  Updated:       5
  Ready:         5
  Available:     5

NAME                                       KIND        STATUS     AGE   INFO
⟳ rollouts-demo                            Rollout     ✔ Healthy  114s  
└──# revision:1                                                         
   └──⧉ rollouts-demo-7bf84f9696           ReplicaSet  ✔ Healthy  114s  stable
      ├──□ rollouts-demo-7bf84f9696-4glv6  Pod         ✔ Running  114s  ready:1/1
      ├──□ rollouts-demo-7bf84f9696-7kqt6  Pod         ✔ Running  114s  ready:1/1
      ├──□ rollouts-demo-7bf84f9696-8k9hw  Pod         ✔ Running  114s  ready:1/1
      ├──□ rollouts-demo-7bf84f9696-9cz2r  Pod         ✔ Running  114s  ready:1/1
      └──□ rollouts-demo-7bf84f9696-jvzvd  Pod         ✔ Running  114s  ready:1/1
```

可以看到该版本被标记为`stable`，而且STATUS为`healthy`。还可以在命令后面加一个`--watch`来实时监控服务状态，完整命令为`kubectl argo rollouts get rollout rollouts-demo --watch`。

  

#### 更新应用

接下来对应用进行更新。对应用进行更新和更新用Deployment部署的应用一样，更新镜像即可。argo rollouts插件有一个`set image`命令来更新镜像，如下：

```bash
kubectl argo rollouts set image rollouts-demo \
  rollouts-demo=argoproj/rollouts-demo:yellow
```

更新过后，我们可以通过观察`kubectl argo rollouts get rollout rollouts-demo --watch`服务状态，如下：

```bash
Name:            rollouts-demo
Namespace:       default
Status:          ॥ Paused
Message:         CanaryPauseStep
Strategy:        Canary
  Step:          1/8
  SetWeight:     20
  ActualWeight:  20
Images:          argoproj/rollouts-demo:blue (stable)
                 argoproj/rollouts-demo:yellow (canary)
Replicas:
  Desired:       5
  Current:       5
  Updated:       1
  Ready:         5
  Available:     5

NAME                                       KIND        STATUS     AGE    INFO
⟳ rollouts-demo                            Rollout     ॥ Paused   9m12s  
├──# revision:2                                                          
│  └──⧉ rollouts-demo-789746c88d           ReplicaSet  ✔ Healthy  44s    canary
│     └──□ rollouts-demo-789746c88d-l4gmd  Pod         ✔ Running  44s    ready:1/1
└──# revision:1                                                          
   └──⧉ rollouts-demo-7bf84f9696           ReplicaSet  ✔ Healthy  9m12s  stable
      ├──□ rollouts-demo-7bf84f9696-4glv6  Pod         ✔ Running  9m12s  ready:1/1
      ├──□ rollouts-demo-7bf84f9696-8k9hw  Pod         ✔ Running  9m12s  ready:1/1
      ├──□ rollouts-demo-7bf84f9696-9cz2r  Pod         ✔ Running  9m12s  ready:1/1
      └──□ rollouts-demo-7bf84f9696-jvzvd  Pod         ✔ Running  9m12s  ready:1/1

```

可以看到多了一个`revision:2`，而且该版本被标记为`canary`，而且状态是`Status: Paused`，canary接入流量为20%。

  

部署之所以处于`Paused`阶段，是因为我们在rollout.yaml中定义了发布第一个版本后会暂停，这时候需要手动接入接下来的更新。

  

argo rollouts提供了`promote` 来进行后续的更新，命令如下：

```bash
kubectl argo rollouts promote rollouts-demo
```

然后我们可以在watch界面，看到如下的更新过程。

```bash
Name:            rollouts-demo
Namespace:       default
Status:          ॥ Paused
Message:         CanaryPauseStep
Strategy:        Canary
  Step:          3/8
  SetWeight:     40
  ActualWeight:  40
Images:          argoproj/rollouts-demo:blue (stable)
                 argoproj/rollouts-demo:yellow (canary)
Replicas:
  Desired:       5
  Current:       5
  Updated:       2
  Ready:         5
  Available:     5

NAME                                       KIND        STATUS         AGE    INFO
⟳ rollouts-demo                            Rollout     ॥ Paused       15m    
├──# revision:2                                                              
│  └──⧉ rollouts-demo-789746c88d           ReplicaSet  ✔ Healthy      6m46s  canary
│     ├──□ rollouts-demo-789746c88d-l4gmd  Pod         ✔ Running      6m46s  ready:1/1
│     └──□ rollouts-demo-789746c88d-67dwp  Pod         ✔ Running      19s    ready:1/1
└──# revision:1                                                              
   └──⧉ rollouts-demo-7bf84f9696           ReplicaSet  ✔ Healthy      15m    stable
      ├──□ rollouts-demo-7bf84f9696-4glv6  Pod         ✔ Running      15m    ready:1/1
      ├──□ rollouts-demo-7bf84f9696-8k9hw  Pod         ✔ Running      15m    ready:1/1
      ├──□ rollouts-demo-7bf84f9696-9cz2r  Pod         ✔ Running      15m    ready:1/1
      └──□ rollouts-demo-7bf84f9696-jvzvd  Pod         ◌ Terminating  15m    ready:1/1
```

因为后续的更新在pause阶段只暂停10s，所以会依次自动更新完，不需要手动介入，待更新完后整体的状态如下：

```bash
Name:            rollouts-demo
Namespace:       default
Status:          ✔ Healthy
Strategy:        Canary
  Step:          8/8
  SetWeight:     100
  ActualWeight:  100
Images:          argoproj/rollouts-demo:yellow (stable)
Replicas:
  Desired:       5
  Current:       5
  Updated:       5
  Ready:         5
  Available:     5

NAME                                       KIND        STATUS        AGE    INFO
⟳ rollouts-demo                            Rollout     ✔ Healthy     17m    
├──# revision:2                                                             
│  └──⧉ rollouts-demo-789746c88d           ReplicaSet  ✔ Healthy     8m35s  stable
│     ├──□ rollouts-demo-789746c88d-l4gmd  Pod         ✔ Running     8m35s  ready:1/1
│     ├──□ rollouts-demo-789746c88d-67dwp  Pod         ✔ Running     2m8s   ready:1/1
│     ├──□ rollouts-demo-789746c88d-k7mfk  Pod         ✔ Running     106s   ready:1/1
│     ├──□ rollouts-demo-789746c88d-glbfb  Pod         ✔ Running     94s    ready:1/1
│     └──□ rollouts-demo-789746c88d-d7m4f  Pod         ✔ Running     83s    ready:1/1
└──# revision:1                                                             
   └──⧉ rollouts-demo-7bf84f9696           ReplicaSet  • ScaledDown  17m 
```

可以看到第一个版本已经下线，第二个版本的状态为`Healthy`，而且镜像被标记为`stable`。

  

#### 终止更新

如果在更新应用的过程中，最新的应用有问题，需要终止更新需要怎么做呢？

  

我们先使用下面命令发布新版本应用，如下：

```bash
kubectl argo rollouts set image rollouts-demo \
  rollouts-demo=argoproj/rollouts-demo:red
```

然后更新动作会在第一次更新的时候处于`Paused`状态，现在我们可以用`abort`来终止发布，如下：

```bash
kubectl argo rollouts abort rollouts-demo
```

待执行完命令后，可以在watch页面，看到如下信息：

```bash
Name:            rollouts-demo
Namespace:       default
Status:          ✖ Degraded
Message:         RolloutAborted: Rollout is aborted
Strategy:        Canary
  Step:          0/8
  SetWeight:     0
  ActualWeight:  0
Images:          argoproj/rollouts-demo:yellow (stable)
Replicas:
  Desired:       5
  Current:       5
  Updated:       0
  Ready:         5
  Available:     5

NAME                                       KIND        STATUS        AGE    INFO
⟳ rollouts-demo                            Rollout     ✖ Degraded    21m    
├──# revision:3                                                             
│  └──⧉ rollouts-demo-6f75f48b7            ReplicaSet  • ScaledDown  90s    canary
├──# revision:2                                                             
│  └──⧉ rollouts-demo-789746c88d           ReplicaSet  ✔ Healthy     13m    stable
│     ├──□ rollouts-demo-789746c88d-l4gmd  Pod         ✔ Running     13m    ready:1/1
│     ├──□ rollouts-demo-789746c88d-67dwp  Pod         ✔ Running     6m46s  ready:1/1
│     ├──□ rollouts-demo-789746c88d-k7mfk  Pod         ✔ Running     6m24s  ready:1/1
│     ├──□ rollouts-demo-789746c88d-glbfb  Pod         ✔ Running     6m12s  ready:1/1
│     └──□ rollouts-demo-789746c88d-nntc9  Pod         ✔ Running     18s    ready:1/1
└──# revision:1                                                             
   └──⧉ rollouts-demo-7bf84f9696           ReplicaSet  • ScaledDown  21m  
```

最终应用会回退到稳定版本。

  

但是我们可以看到Status是`Degraded`状态而并非`Healthy`状态，我们有必须要将其变成`Healthy`状态。最简单的办法就是执行如下命令重新发布一下版本：

```bash
kubectl argo rollouts set image rollouts-demo \
  rollouts-demo=argoproj/rollouts-demo:yellow
```

执行过后，可以看到其状态立即变成Healthy，并且没有创建新的副本、新的版本，如下：

```bash
Name:            rollouts-demo
Namespace:       default
Status:          ✔ Healthy
Strategy:        Canary
  Step:          8/8
  SetWeight:     100
  ActualWeight:  100
Images:          argoproj/rollouts-demo:yellow (stable)
Replicas:
  Desired:       5
  Current:       5
  Updated:       5
  Ready:         5
  Available:     5

NAME                                       KIND        STATUS        AGE  INFO
⟳ rollouts-demo                            Rollout     ✔ Healthy     40m  
├──# revision:4                                                           
│  └──⧉ rollouts-demo-789746c88d           ReplicaSet  ✔ Healthy     32m  stable
│     ├──□ rollouts-demo-789746c88d-l4gmd  Pod         ✔ Running     32m  ready:1/1
│     ├──□ rollouts-demo-789746c88d-67dwp  Pod         ✔ Running     26m  ready:1/1
│     ├──□ rollouts-demo-789746c88d-k7mfk  Pod         ✔ Running     25m  ready:1/1
│     ├──□ rollouts-demo-789746c88d-glbfb  Pod         ✔ Running     25m  ready:1/1
│     └──□ rollouts-demo-789746c88d-nntc9  Pod         ✔ Running     19m  ready:1/1
├──# revision:3                                                           
│  └──⧉ rollouts-demo-6f75f48b7            ReplicaSet  • ScaledDown  20m  
└──# revision:1                                                           
   └──⧉ rollouts-demo-7bf84f9696           ReplicaSet  • ScaledDown  40m 
```

  

#### 回退应用

有时候在应用上线过后，有些BUG并没有发现，这时候要回退怎么办呢？argo rollouts有一个`undo`命令，可以进行回退。

  

比如我们要将版本回退到第一个版本，则执行一下命令：

```bash
kubectl-argo-rollouts undo  rollouts-demo --to-revision=1
```

然后通过watch界面可以看到如下信息：

```bash
Name:            rollouts-demo
Namespace:       default
Status:          ॥ Paused
Message:         CanaryPauseStep
Strategy:        Canary
  Step:          1/8
  SetWeight:     20
  ActualWeight:  20
Images:          argoproj/rollouts-demo:blue (canary)
                 argoproj/rollouts-demo:yellow (stable)
Replicas:
  Desired:       5
  Current:       5
  Updated:       1
  Ready:         5
  Available:     5

NAME                                       KIND        STATUS        AGE  INFO
⟳ rollouts-demo                            Rollout     ॥ Paused      45m  
├──# revision:5                                                           
│  └──⧉ rollouts-demo-7bf84f9696           ReplicaSet  ✔ Healthy     45m  canary
│     └──□ rollouts-demo-7bf84f9696-bn2lz  Pod         ✔ Running     36s  ready:1/1
├──# revision:4                                                           
│  └──⧉ rollouts-demo-789746c88d           ReplicaSet  ✔ Healthy     36m  stable
│     ├──□ rollouts-demo-789746c88d-l4gmd  Pod         ✔ Running     36m  ready:1/1
│     ├──□ rollouts-demo-789746c88d-67dwp  Pod         ✔ Running     30m  ready:1/1
│     ├──□ rollouts-demo-789746c88d-k7mfk  Pod         ✔ Running     29m  ready:1/1
│     └──□ rollouts-demo-789746c88d-glbfb  Pod         ✔ Running     29m  ready:1/1
└──# revision:3                                                           
   └──⧉ rollouts-demo-6f75f48b7            ReplicaSet  • ScaledDown  25m 
```

首先revision为1的版本标记没有，重新创建了一个为5的标记，而且第一步处于暂停状态，然后我们执行`promote`命令继续后续的更新，如下：

```bash
kubectl argo rollouts promote rollouts-demo
```

然后我们可以看到如下信息：

```bash
Name:            rollouts-demo
Namespace:       default
Status:          ✔ Healthy
Strategy:        Canary
  Step:          8/8
  SetWeight:     100
  ActualWeight:  100
Images:          argoproj/rollouts-demo:blue (stable)
Replicas:
  Desired:       5
  Current:       5
  Updated:       5
  Ready:         5
  Available:     5

NAME                                       KIND        STATUS        AGE    INFO
⟳ rollouts-demo                            Rollout     ✔ Healthy     48m    
├──# revision:5                                                             
│  └──⧉ rollouts-demo-7bf84f9696           ReplicaSet  ✔ Healthy     48m    stable
│     ├──□ rollouts-demo-7bf84f9696-bn2lz  Pod         ✔ Running     3m21s  ready:1/1
│     ├──□ rollouts-demo-7bf84f9696-xn6dr  Pod         ✔ Running     56s    ready:1/1
│     ├──□ rollouts-demo-7bf84f9696-w58vm  Pod         ✔ Running     44s    ready:1/1
│     ├──□ rollouts-demo-7bf84f9696-fns8d  Pod         ✔ Running     33s    ready:1/1
│     └──□ rollouts-demo-7bf84f9696-qt6f9  Pod         ✔ Running     22s    ready:1/1
├──# revision:4                                                             
│  └──⧉ rollouts-demo-789746c88d           ReplicaSet  • ScaledDown  39m    
└──# revision:3                                                             
   └──⧉ rollouts-demo-6f75f48b7            ReplicaSet  • ScaledDown  27m 
```

从`Images`可以看到回退到我们最初版本为`blue`的镜像了。

  

### Traffic Shifting

上面我们并没有接入外部流量，仅仅是在内部使用展示了金丝雀部署过程，下面我们接入外部流量进行测试。

​  

Argo-Rollout主要集成了**Ingress**和**ServiceMesh**两种流量控制方法。

​  

目前Ingress支持ALB和NGINX ingress。但是我使用的是nginx ingress。

  

#### 部署应用

我们依然使用官方的例子进行展示。

  

首先删除上面的例子。

```bash
kubectl delete -f https://raw.githubusercontent.com/argoproj/argo-rollouts/master/docs/getting-started/basic/rollout.yaml
kubectl delete -f https://raw.githubusercontent.com/argoproj/argo-rollouts/master/docs/getting-started/basic/service.yaml
```

然后重新部署一个官方的例子，如下：

```bash
kubectl apply -f https://raw.githubusercontent.com/argoproj/argo-rollouts/master/docs/getting-started/nginx/rollout.yaml
kubectl apply -f https://raw.githubusercontent.com/argoproj/argo-rollouts/master/docs/getting-started/nginx/services.yaml
kubectl apply -f https://raw.githubusercontent.com/argoproj/argo-rollouts/master/docs/getting-started/nginx/ingress.yaml
```

这个例子包含1个rollout，2个service，1个ingress。

  

它们的配置文件分别如下。

rollout.yaml，为了便与测试，我将权重改为了50

```bash
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: rollouts-demo
spec:
  replicas: 1
  strategy:
    canary:
      canaryService: rollouts-demo-canary
      stableService: rollouts-demo-stable
      trafficRouting:
        nginx:
          stableIngress: rollouts-demo-stable
      steps:
      - setWeight: 50
      - pause: {}
  revisionHistoryLimit: 2
  selector:
    matchLabels:
      app: rollouts-demo
  template:
    metadata:
      labels:
        app: rollouts-demo
    spec:
      containers:
      - name: rollouts-demo
        image: argoproj/rollouts-demo:blue
        ports:
        - name: http
          containerPort: 8080
          protocol: TCP
        resources:
          requests:
            memory: 32Mi
            cpu: 5m
```

services.yaml

```bash
apiVersion: v1
kind: Service
metadata:
  name: rollouts-demo-canary
spec:
  ports:
  - port: 80
    targetPort: http
    protocol: TCP
    name: http
  selector:
    app: rollouts-demo
    # This selector will be updated with the pod-template-hash of the canary ReplicaSet. e.g.:
    # rollouts-pod-template-hash: 7bf84f9696

---
apiVersion: v1
kind: Service
metadata:
  name: rollouts-demo-stable
spec:
  ports:
  - port: 80
    targetPort: http
    protocol: TCP
    name: http
  selector:
    app: rollouts-demo
    # This selector will be updated with the pod-template-hash of the stable ReplicaSet. e.g.:
    # rollouts-pod-template-hash: 789746c88d
```

ingress.yaml

```bash
apiVersion: networking.k8s.io/v1beta1
kind: Ingress
metadata:
  name: rollouts-demo-stable
  annotations:
    kubernetes.io/ingress.class: nginx
spec:
  rules:
  - host: rollouts-demo.local
    http:
      paths:
      - path: /
        backend:
          # Reference to a Service name, also specified in the Rollout spec.strategy.canary.stableService field
          serviceName: rollouts-demo-stable
          servicePort: 80
```

从配置文件可以看出Rollout里分别用`canaryService`和`stableService`分别定义了该应用灰度的Service Name(rollouts-demo-canary)和当前版本的Service Name(rollouts-demo-stable)。而且rollouts-demo-canary 和 rollouts-demo-stable的service的内容是一样的。selector中暂时没有填上pod-template-hash，Argo-Rollout Controller会根据实际的ReplicaSet hash来修改该值。

​  

当我们创建完ingress后，Rollout Controller会根据`ingress` rollouts-demo-stable内容，自动创建一个`ingress`用了灰度的流量，名字为<ROLLOUT-NAME>-<INGRESS-NAME>-canary，所以这里多了一个`ingress` rollouts-demo-rollouts-demo-stable-canary，将流量导向Canary `Service`(rollouts-demo-canary)。如下：

```bash
# kubectl get ingress
NAME                                        HOSTS                     ADDRESS   PORTS   AGE
rollouts-demo-rollouts-demo-stable-canary   rollout-demo.coolops.cn             80      9m25s
rollouts-demo-stable                        rollout-demo.coolops.cn             80      4m12s
```

  

rollouts-demo-rollouts-demo-stable-canary的内容如下：

```bash
# kubectl get ingress rollouts-demo-rollouts-demo-stable-canary -o yaml
apiVersion: extensions/v1beta1
kind: Ingress
metadata:
  annotations:
    kubernetes.io/ingress.class: traefik
    nginx.ingress.kubernetes.io/canary: "true"
    nginx.ingress.kubernetes.io/canary-weight: "0"
  creationTimestamp: "2020-12-09T02:21:52Z"
  generation: 2
  name: rollouts-demo-rollouts-demo-stable-canary
  namespace: default
  ownerReferences:
  - apiVersion: argoproj.io/v1alpha1
    blockOwnerDeletion: true
    controller: true
    kind: Rollout
    name: rollouts-demo
    uid: 4e74913b-5c89-4275-8f4c-768f23c63c34
  resourceVersion: "15681411"
  selfLink: /apis/extensions/v1beta1/namespaces/default/ingresses/rollouts-demo-rollouts-demo-stable-canary
  uid: bc66dfc4-6e98-419b-a288-f67e1233ef3e
spec:
  rules:
  - host: rollout-demo.coolops.cn
    http:
      paths:
      - backend:
          serviceName: rollouts-demo-canary
          servicePort: 80
        path: /
```

通过域名访问，可以看到如下界面。

![image.png](assets/devops与交付/使用argo-rollouts实现金丝雀发布/使用argo-rollouts实现金丝雀发布-1.png)

  

#### 更新应用

现在通过以下命令来进行应用更新操作。

```bash
kubectl argo rollouts set image rollouts-demo rollouts-demo=argoproj/rollouts-demo:yellow
```

然后通过状态窗口可以看到如下信息。

```bash
Name:            rollouts-demo
Namespace:       default
Status:          ॥ Paused
Message:         CanaryPauseStep
Strategy:        Canary
  Step:          1/2
  SetWeight:     50
  ActualWeight:  50
Images:          argoproj/rollouts-demo:blue (stable)
                 argoproj/rollouts-demo:yellow (canary)
Replicas:
  Desired:       1
  Current:       2
  Updated:       1
  Ready:         2
  Available:     2

NAME                                       KIND        STATUS     AGE    INFO
⟳ rollouts-demo                            Rollout     ॥ Paused   2m13s  
├──# revision:2                                                          
│  └──⧉ rollouts-demo-789746c88d           ReplicaSet  ✔ Healthy  89s    canary
│     └──□ rollouts-demo-789746c88d-spn4s  Pod         ✔ Running  89s    ready:1/1
└──# revision:1                                                          
   └──⧉ rollouts-demo-7bf84f9696           ReplicaSet  ✔ Healthy  2m     stable
      └──□ rollouts-demo-7bf84f9696-7rwkx  Pod         ✔ Running  2m     ready:1/1
```

然后可以看到`rollouts-demo-rollouts-demo-stable-canary`的ingress的annotations中新增了两个参数，如下：

```bash
# kubectl get ingress rollouts-demo-rollouts-demo-stable-canary -o yaml
apiVersion: extensions/v1beta1
kind: Ingress
metadata:
  annotations:
    kubernetes.io/ingress.class: nginx
    nginx.ingress.kubernetes.io/canary: "true"
    nginx.ingress.kubernetes.io/canary-weight: "50"
  creationTimestamp: "2020-12-09T03:01:04Z"
  generation: 1
  name: rollouts-demo-rollouts-demo-stable-canary
  namespace: default
  ownerReferences:
  - apiVersion: argoproj.io/v1alpha1
    blockOwnerDeletion: true
    controller: true
    kind: Rollout
    name: rollouts-demo
    uid: 4d956f2a-9e15-4453-b918-926c4a75f884
  resourceVersion: "15686969"
  selfLink: /apis/extensions/v1beta1/namespaces/default/ingresses/rollouts-demo-rollouts-demo-stable-canary
  uid: c9242819-d088-4fc4-bd4d-8870360fa96e
spec:
  rules:
  - host: rollout-demo.coolops.cn
    http:
      paths:
      - backend:
          serviceName: rollouts-demo-canary
          servicePort: 80
        path: /

```

然后通过网页，可以看到如下的输出展示。

![image.png](assets/devops与交付/使用argo-rollouts实现金丝雀发布/使用argo-rollouts实现金丝雀发布-2.png)

  

然后可以通过验证结果来判断是否继续还是终止。

如果继续使用如下命令：

```bash
kubectl argo rollouts promote rollouts-demo
```

如果终止使用如下命令：

```bash
kubectl argo rollouts abort rollouts-demo
```

  

## 写在最后

目前我还在测试阶段，并没有实际接入使用。通过测试来看，Argo-Rollout提供更加强大的Deployment，包含比较适合运维的金丝雀发布和蓝绿发布功能，要使用蓝绿发布，仅需要配置rollout，如下：

```bash
apiVersion: argoproj.io/v1alpha1
kind: Rollout  ##部署完rollout后就有了这个kind 资源，这个资源和deployment类似也是管理你的副本集的，所以不能像deployment那样在k8s界面看见，只能通过kubectl命令行
metadata:
  name: rollout-bluegreen
  namespace: rollout-test
spec:
  template:
    spec:
      terminationGracePeriodSeconds: 30
      containers:
      - resources: #{}
          requests:
            cpu: "1"
            memory: "2Gi"
          limits:
            cpu: "2"
            memory: "2Gi"
        terminationMessagePolicy: File
        imagePullPolicy: Always
        name: rollout-bluegreen
        image: argoproj/rollouts-demo:green #nginx:1.17.1
      schedulerName: default-scheduler
      securityContext: {}
      dnsPolicy: ClusterFirst
      restartPolicy: Always
    metadata:
      labels:
        app: rollout-bluegreen
  selector:
    matchLabels:
      app: rollout-bluegreen
  replicas: 2
  strategy:
    blueGreen:  ##蓝绿启用配置
      activeService: rollout-bluegreen-active   #生效的服务，需要自己创建建本代码最下面service资源。
      previewService: rollout-bluegreen-preview  #配置预览服务，同理需要自己创建
      autoPromotionEnabled: true  ##是否直接切换，如为true，会在新版本变绿后直接切换到对外服务。
      scaleDownDelayRevisionLimit: 0
      previewReplicaCount: 1  #新版本的pod数量，设为一个从而控制资源消耗
    rollingUpdate:
      maxUnavailable: 25%
      maxSurge: 25%
    type: RollingUpdate
  revisionHistoryLimit: 2
  progressDeadlineSeconds: 600

---
apiVersion: v1
kind: Service
metadata:
  name: rollout-bluegreen-active
  namespace: rollout-test
spec:
  sessionAffinity: None
  selector:
    app: rollout-bluegreen
  ports:
  - protocol: TCP
    port: 80
    targetPort: 8080
  type: LoadBalancer
```

  

整体使用还是比较丝滑，如果测试通过后续考虑集成进CD中。更多内容可以到[https://argoproj.github.io/argo-rollouts/](https://argoproj.github.io/argo-rollouts/)进行学习。