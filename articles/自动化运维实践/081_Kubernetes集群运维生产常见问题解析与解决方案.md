---
title: Kubernetes集群运维生产常见问题解析与解决方案
---

**前言：在Kubernetes集群的日常运维工作中，我们难免会遇到各种各样的问题。这些问题可能涉及到集群的部署、配置、监控、性能优化等多个方面。为了解决这些问题，我们需要不断地学习和积累经验。在这里，我打算收集并整理一些网友曾经提出的问题，并提供相应的解析和解决方案，之前的问题无从考证，这里就用近几天的两个问题做起点案例。随着经验的不断积累，我会持续更新这个博客，希望能为大家在Kubernetes集群运维的过程中提供一些帮助和参考。**

## 问题一

## 一、Kubernetes集群内部流量未能成功返回到外部终端

**网友1问**：大佬，请教一下，k8s里面部署了一个开源的yudao-gateway服务测试，通过svc，nodeport类型可以直接访问，浏览器收到接口返回结果，部署了ingress+metal lb，svc变成clusterip类型，浏览器就没收到返回结果了，但是后端日志是有的刷的，日志显示user ip不同，nodeport为10.244.0.0，cluster ip类型为终端浏览器主机的ip

**我回复**：Ingress配置、MetalLB配置、DNS解析检查下

**网友1问**：感觉是后端服务返回数据给68这个ip，但是k8s内部不知道这个ip怎么走，所以没返回给终端浏览器。集群内部没返回到外部终端。感觉还是Dns解析问题，请问这个在哪里看呢

**我回复**：检查CoreDNS/KubeDNS Pod状态：`kubectl get pods -n kube-system -l k8s-app=kube-dns`  
查看CoreDNS/KubeDNS日志：`kubectl logs -n kube-system <coredns-pod-name>`  
检查Pod内部DNS配置：`kubectl exec -it <pod-name> -n <namespace> /bin/sh`  
`cat /etc/resolv.conf`  
测试DNS解析：`dig <service-name>.<namespace>.svc.cluster.local`

**网友1问**：Pod里面要配置解析，是配置跟coredns地址一样的吗？

**我回复**：pod 一般不用单独配置 DNS，k8s给pod提供了自动的DNS解析服务

**网友1说**：好的，谢谢

## 二、知识点详解

在构建Kubernetes集群并部署服务时，网络配置是至关重要的一环，它直接影响着服务的可访问性和稳定性。最近有位网友遇到了一个有趣的问题，让我们一起来看看具体情况，并分析其背后的原因。

### 1、问题描述

网友在Kubernetes集群中部署了一个开源的yudao-gateway服务进行测试。起初，他通过Service的NodePort类型直接访问该服务，浏览器能够顺利收到接口返回的结果。然而，当他引入了Ingress和MetalLB，并将Service类型改为ClusterIP后，浏览器却无法收到返回结果了。尽管后端日志显示请求正常，且日志中记录的用户IP地址发生了变化：NodePort时为10.244.0.0，而ClusterIP时则显示为终端浏览器主机的IP。

### 2、问题分析与排查建议

网友感觉问题可能出在后端服务返回数据给某个特定的IP（68）时，Kubernetes集群内部不知道如何将数据路由到这个IP，导致数据无法返回给终端浏览器。他认为集群内部没有正确地将数据返回到外部终端，怀疑是DNS解析出现了问题。

### 3、排查建议

针对网友的猜测，我给出了以下排查建议：

#### 检查Ingress配置

Ingress是Kubernetes中用于管理外部访问的资源，它定义了如何将外部请求路由到集群内的Service。需要检查Ingress的配置是否正确，包括：

- **路径匹配**：确保Ingress规则中的路径与请求的URL路径匹配。
- **Service选择**：确认Ingress规则中指定的Service名称和端口与实际部署的Service一致。
- **注解设置**：查看是否有相关的注解配置，如负载均衡策略、SSL证书等，确保它们符合预期。

#### 检查MetalLB配置

MetalLB是用于在裸机环境或没有内置负载均衡器的云环境中提供负载均衡功能的工具。需要检查MetalLB的配置，包括：

- **IP地址池**：确认MetalLB配置的IP地址池是否包含用于Ingress的IP地址。
- **网络接口**：检查MetalLB是否正确配置了与集群外部网络通信的接口。
- **日志信息**：查看MetalLB的日志，了解其在处理请求时的行为和状态。

#### 检查DNS解析

DNS解析在Kubernetes集群中扮演着重要角色，它负责将服务名称解析为对应的IP地址。可以按照以下步骤检查DNS解析：

- **检查CoreDNS/KubeDNS Pod状态**：使用命令`kubectl get pods -n kube-system -l k8s-app=kube-dns`查看CoreDNS或KubeDNS Pod的状态，确保它们正常运行。
- **查看CoreDNS/KubeDNS日志**：通过命令`kubectl logs -n kube-system <coredns-pod-name>`查看CoreDNS或KubeDNS的日志，寻找可能的错误或异常信息。
- **检查Pod内部DNS配置**：使用命令`kubectl exec -it <pod-name> -n <namespace> /bin/sh`进入Pod内部，查看DNS配置文件`/etc/resolv.conf`的内容，确认DNS服务器地址是否正确。
- **测试DNS解析**：在Pod内部使用`dig <service-name>.<namespace>.svc.cluster.local`命令测试对服务名称的DNS解析，查看解析结果是否正确。

### 4、网友的进一步疑问

网友询问Pod内部是否需要配置DNS解析，是否需要配置与CoreDNS地址一样的DNS服务器。

#### 5、回答

Pod通常不需要单独配置DNS解析，因为Kubernetes会为Pod提供自动的DNS解析服务。每个Pod在启动时，Kubernetes会自动为其配置DNS设置，使其能够解析集群内的服务名称。Pod的DNS配置文件`/etc/resolv.conf`中会包含CoreDNS或KubeDNS的地址，这样Pod就可以通过这些DNS服务器来解析服务名称。因此，在大多数情况下，无需手动修改Pod的DNS配置。

### 6、原理解析

#### Ingress的工作原理

Ingress通过定义规则来管理外部访问，它将外部请求路由到集群内的Service。当请求到达Ingress时，Ingress会根据配置的规则（如路径匹配、主机匹配等）来确定将请求转发到哪个Service。Ingress本身并不直接处理请求，而是将请求转发给后端的Service，由Service再将请求分发给对应的应用Pod。

#### MetalLB的工作原理

MetalLB在没有内置负载均衡器的环境中提供负载均衡功能。它通过配置IP地址池和网络接口，将外部请求的流量分配到集群内的多个节点上。当请求到达MetalLB时，它会根据配置的策略（如轮询、最少连接等）将请求分配给不同的节点，从而实现负载均衡。

#### DNS解析的工作原理

在Kubernetes集群中，DNS解析主要依赖于CoreDNS或KubeDNS。它们会为集群内的服务名称提供DNS解析服务。当Pod需要访问某个服务时，它会通过DNS查询服务名称对应的IP地址。DNS服务器会根据服务名称和命名空间等信息，将服务名称解析为对应的ClusterIP或Pod IP，从而使Pod能够正确地访问服务。

## 问题二

## 一、如何在Kubernetes中确保两个Pod同时启动和停止，并在同一台机器上运行，同时实现日志目录共享

**网友2问**：大佬，怎么保证两个pod同时启动同时停止，并且在同一台机器，并且一个pod需要去读另一个pod的日志目录

**我回复**：yaml配置好两个参数：podAffinity和emptyDir就能实现，不过需要注意emptyDir是临时存储卷，生命周期与 Pod 同步

## 二、知识点详解

在Kubernetes集群中，有时我们需要两个Pod同时启动和停止，并且在同一台机器上运行。此外，还可能需要一个Pod能够访问另一个Pod的日志目录。这种需求在一些特定的场景下非常常见，例如，一个Pod负责处理业务逻辑，而另一个Pod负责监控和日志收集。接下来，我们将探讨如何通过Kubernetes的配置来实现这一需求，并提供详细的原理解析。

### 1、实现方案

### 使用PodAffinity确保Pod在同一台机器上运行

PodAffinity是Kubernetes中用于定义Pod之间亲和性关系的调度策略。通过PodAffinity，我们可以确保两个Pod被调度到同一台机器上。具体来说，我们可以在Pod的定义中使用`podAffinity`配置，指定两个Pod需要在同一节点上运行。例如：

```
spec:
  affinity:
    podAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
      - labelSelector:
          matchExpressions:
          - key: "app"
            operator: In
            values:
            - my-app
        topologyKey: "kubernetes.io/hostname"
```

在这个配置中，`requiredDuringSchedulingIgnoredDuringExecution`表示硬限制，即必须满足的条件。`labelSelector`用于选择具有特定标签的Pod，`topologyKey`设置为`kubernetes.io/hostname`，表示Pod必须在同一台机器上运行。

### 2、使用emptyDir实现日志目录共享

emptyDir是Kubernetes中的一种临时存储卷类型，其生命周期与Pod相同。当Pod被分配到节点时，emptyDir会自动创建一个空目录，并且只要Pod在该节点上运行，该卷就会存在。当Pod被删除时，emptyDir中的内容也会被永久删除。通过将两个Pod的日志目录都挂载到同一个emptyDir卷上，可以实现日志目录的共享。例如：

```
spec:
  volumes:
  - name: logs-volume
    emptyDir: {}
  containers:
  - name: container1
    image: my-image
    volumeMounts:
    - mountPath: /var/logs
      name: logs-volume
  - name: container2
    image: my-image
    volumeMounts:
    - mountPath: /var/logs
      name: logs-volume
```

在这个配置中，`emptyDir`定义了一个名为`logs-volume`的临时存储卷，并将其挂载到两个容器的`/var/logs`目录上。这样，两个容器就可以共享同一个日志目录。

### 3、原理解析

#### PodAffinity的工作原理

PodAffinity通过在Pod的定义中添加亲和性规则，影响Kubernetes调度器的调度决策。调度器在选择节点时，会考虑PodAffinity的规则，确保满足条件的Pod被调度到同一台机器上。PodAffinity的规则可以是硬限制（必须满足）或软限制（优先考虑），这为Pod的调度提供了灵活的控制方式。

#### emptyDir的工作原理

emptyDir是一种临时存储卷，它在Pod被分配到节点时自动创建，并在Pod删除时自动清理。emptyDir的生命周期与Pod的生命周期同步，这意味着只要Pod还在运行，emptyDir就会存在。emptyDir可以被多个容器共享，使得容器之间能够方便地进行文件共享和数据传递。emptyDir的存储介质可以是磁盘或内存，具体取决于配置。

### 4、注意事项

- **emptyDir的临时性**：由于emptyDir是临时存储卷，当Pod被删除时，emptyDir中的数据也会丢失。因此，如果需要持久化存储日志数据，可以考虑使用持久卷（PersistentVolume）。
- **PodAffinity的标签选择**：在使用PodAffinity时，需要确保Pod的标签选择器（labelSelector）与目标Pod的标签匹配，否则亲和性规则将无法生效。
- **资源限制**：在部署多个Pod时，还需要考虑节点的资源限制，确保节点有足够的资源来容纳所有Pod。如果资源不足，可能会导致Pod调度失败或性能下降。

通过合理配置PodAffinity和emptyDir，我们可以在Kubernetes集群中实现两个Pod的同时启动和停止，并在同一台机器上运行，同时实现日志目录的共享。这为集群中的应用部署和管理提供了更大的灵活性和便利性。

## 问题三

## 一、如何在Kubernetes中确保两个Pod多副本同时启动和停止，并在同一台机器上运行，同时实现一 一对应日志目录共享

**网友2问**：怎么保证两个pod多副本同时启动同时停止，并且在同一台机器，并且一个pod需要去读另一个pod的日志目录，并且要求pod直接一 一对应  
**我回复**：这个就需要做持久化存储卷了，PodAffinity和PersistentVolume，一 一对应的话要用StatefulSet来部署Pod

## 二、知识点详解

要在Kubernetes集群中保证两个Pod的多副本同时启动和停止，并且在同一台机器上运行，同时实现一个Pod读取另一个Pod的日志目录，并且要求Pod之间一一对应，可以采用以下方案：

### 使用StatefulSet来部署Pod

StatefulSet是Kubernetes中用于管理有状态应用的控制器，它可以保证Pod的顺序启动和停止，并且为每个Pod提供一个稳定的网络身份。通过StatefulSet，可以实现两个Pod的多副本同时启动和停止，并且确保它们之间一一对应。

### 使用PodAffinity确保Pod在同一台机器上运行

在StatefulSet的Pod模板中，使用PodAffinity配置，指定两个Pod需要在同一节点上运行。例如，可以使用`podAffinity`的`requiredDuringSchedulingIgnoredDuringExecution`规则，设置一个标签选择器来匹配另一个StatefulSet的Pod，并将`topologyKey`设置为`kubernetes.io/hostname`，这样可以确保两个Pod被调度到同一台机器上。

### 使用共享存储卷实现日志目录共享

由于StatefulSet的Pod副本之间不能直接共享emptyDir卷，因此需要使用持久化存储卷（如PersistentVolume（PV））来实现日志目录的共享。可以创建一个共享的PersistentVolume，并将其挂载到两个StatefulSet的Pod模板中，分别映射到日志目录路径。这样，一个Pod就可以通过访问共享的PersistentVolume来读取另一个Pod的日志目录。

### 示例配置

以下是一个简化的示例配置，展示了如何使用StatefulSet、PodAffinity和共享存储卷来实现上述需求：

```
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: pod-set-1
spec:
  serviceName: pod-set-1
  replicas: 3
  selector:
    matchLabels:
      app: pod-set-1
  template:
    metadata:
      labels:
        app: pod-set-1
    spec:
      affinity:
        podAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
          - labelSelector:
              matchExpressions:
              - key: app
                operator: In
                values:
                - pod-set-2
            topologyKey: kubernetes.io/hostname
      containers:
      - name: container-1
        image: my-image
        volumeMounts:
        - mountPath: /var/logs
          name: shared-logs
  volumeClaimTemplates:
  - metadata:
      name: shared-logs
    spec:
      accessModes: [ "ReadWriteMany" ]
      resources:
        requests:
          storage: 1Gi
---
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: pod-set-2
spec:
  serviceName: pod-set-2
  replicas: 3
  selector:
    matchLabels:
      app: pod-set-2
  template:
    metadata:
      labels:
        app: pod-set-2
    spec:
      affinity:
        podAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
          - labelSelector:
              matchExpressions:
              - key: app
                operator: In
                values:
                - pod-set-1
            topologyKey: kubernetes.io/hostname
      containers:
      - name: container-2
        image: my-image
        volumeMounts:
        - mountPath: /var/logs
          name: shared-logs
  volumeClaimTemplates:
  - metadata:
      name: shared-logs
    spec:
      accessModes: [ "ReadWriteMany" ]
      resources:
        requests:
          storage: 1Gi
```

在这个示例中，`pod-set-1`和`pod-set-2`是两个StatefulSet，它们分别部署了3个副本。通过PodAffinity配置，确保了每个`pod-set-1`的Pod与对应的`pod-set-2`的Pod在同一台机器上运行。同时，通过共享的PersistentVolumeClaim（`shared-logs`），实现了日志目录的共享，使得一个Pod可以访问另一个Pod的日志目录。  
