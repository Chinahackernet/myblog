# k8s部署与维护ELK集群（ECK）

> 分类：ELK Stack / 第14章：ELK8生产实践
> 原文：https://www.cuiliangblog.cn/detail/section/162609409
> 来源：崔亮的博客

---

# ECK简介
## ECK是什么
要理解ECK，首先需要了解CRD、Controller、Operator这三个基础概念。

**什么是CRD**

CRD(Custom Resource Definitions)也就是<font style="color:rgb(48, 49, 51);">自定义K8S资源类型。当内置的POD、Deployment、Configmap等资源类型不满足需求时，我们就需要扩展k8s，常用方式有三种：</font>

+ <font style="color:rgb(48, 49, 51);">使用CRD自定义资源类型</font>
+ <font style="color:rgb(48, 49, 51);">开发自定义的APIServer（例如HPA）</font>
+ <font style="color:rgb(48, 49, 51);">定制扩展二次开发Kubernetes源码（例如阿里云ACK、腾讯云TKE）</font>

<font style="color:rgb(48, 49, 51);">在 Kubernetes中，资源是 Kubernetes API中的一个端点，用于存储一堆特定类型的API对象。它允许我们通过向集群添加更多种类的对象来扩展Kubernetes。添加新种类的对象之后，我们可以像其他任何内置对象一样，使用 kubectl 来访问我们自定义的 API 对象，CRD无须修改Kubernetes源代码就能扩展它支持使用API资源类型。</font>

**<font style="color:rgb(48, 49, 51);">什么是Controller</font>**

<font style="color:rgb(48, 49, 51);">Kubernetes 的所有控制器，都有一个控制循环，负责监控集群中特定资源的更改，并确保特定资源在集群里的当前状态与控制器自身定义的期望状态保持一致。  
</font><font style="color:rgb(48, 49, 51);">Controller是需要CRD配套开发的程序，它通过Apiserver监听相应类型的资源对象事件，例如：创建、删除、更新等等，然后做出相应的动作，例如一个 Deployment 控制器管控着集群里的一组 Pod ，当你 Kill 掉一个 Pod 。控制器发现定义中期望的Pod数量与当前的数量不匹配，它就会马上创建一个 Pod 让当前状态与期望状态匹配。</font>

**<font style="color:rgb(48, 49, 51);">什么是Operator</font>**

<font style="color:rgb(48, 49, 51);">operator 是一种 kubernetes的扩展形式，利用自定义资源对象CRD来管理应用和组件，允许用户以 Kubernetes 的声明式 API 风格来管理应用及服务。operator 定义了一组在 Kubernetes 集群中打包和部署复杂业务应用的方法，operator主要是为解决特定应用或服务关于如何运行、部署及出现问题时如何处理提供的一种特定的自定义方式。</font>

**什么是eck**

Elastic Cloud on Kubernetes（ECK） 是一种 Kubernetes Operator，为了方便我们管理Elastic Stack全家桶中的各种组件，例如 Elasticsearch，Kibana，APM，Beats 等。通过Operator我们可以快速部署一套Elasticsearch集群，并大大简化日常运维工作。

## ECK功能
1. <font style="color:rgb(33, 37, 41);">快速部署、管理和监控多个集群</font>
2. <font style="color:rgb(33, 37, 41);">快速扩展集群规模和存储空间</font>
3. <font style="color:rgb(33, 37, 41);">通过滚动升级完成配置更改</font>
4. <font style="color:rgb(33, 37, 41);">使用 TLS 证书保护集群安全</font>
5. <font style="color:rgb(33, 37, 41);">设置具有可用性区域感知功能的热-温-冷体系结构</font>

## 版本支持
以最新的eck2.9为例，支持的组件版本如下：

+ Kubernetes 1.24-1.27
+ OpenShift 4.9-4.13
+ Google Kubernetes Engine (GKE), Azure Kubernetes Service (AKS), and Amazon Elastic Kubernetes Service (EKS)
+ Helm: 3.2.0+
+ Elasticsearch, Kibana, APM Server: 6.8+, 7.1+, 8+
+ Enterprise Search: 7.7+, 8+
+ Beats: 7.0+, 8+
+ Elastic Agent: 7.10+ (standalone), 7.14+ (Fleet), 8+
+ Elastic Maps Server: 7.11+, 8+
+ Logstash: 8.7+

每个eck版本都有对应支持的kubernetes版本范围，需要根据当前kubernetes版本选择尽可能新的eck版本，版本对应关系参考文档：[https://www.elastic.co/cn/support/matrix#matrix_kubernetes](https://www.elastic.co/cn/support/matrix#matrix_kubernetes)

## 存储方案介绍
ES数据持久化通过使用挂载PV实现。目前实现方案有以下两种：

方案1：使用本地持久卷，优点是提供了最大的IO性能，缺点是pod与主机强绑定。如果主机出现故障，上面的pod无法调度至其他主机，直到主机恢复后上面异常的pod才能正常运行，集群扩展节点时需要手动操作配置PV。适用于数据量较大，追求集群更高的读写性能，集群规模变更不频繁的场景。

方案2：使用网络持久卷（例如ceph RBD块存储、公有云云盘），优点是如果主机出现故障，可以快速将上面的pod调度至其他主机运行，自动完成故障切换无需人工干预，还可以根据集群负载状态实现节点自动扩缩容。缺点是读写性能受网络带宽影响，速度低于本地持久卷。适用于数据量较小，追求集群服务更高的SLO，集群规模频繁变更的场景。

如果是IDC机房私有化环境，使用ECK部署ES集群时，推荐使用local pv或者ceph RBD块存储方案存储ES数据，使用minIO或者ceph <font style="color:rgb(48, 49, 51);">RGW对象方案</font>存储ES备份数据。

如果是公有云环境，可一步到位直接购买现成的ES集群服务。如果使用ECK部署ES集群时，以阿里云为例，在选择ES节点数据存储类型时，hot节点使用<font style="color:rgb(1, 1, 1);">高效云盘，warm节点使用SSD云盘，clod节点使用ESSD云盘。ES数据备份使用</font><font style="color:rgb(0, 0, 0);">OSS对象存储。</font>

本实验以私有云环境为例，ES存储使用local pv，ES备份使用minIO。

<font style="color:rgb(18, 18, 18);">更多local pv详细内容参考文档：</font>[<font style="color:rgb(18, 18, 18);">../06_Kubernetes/09-07_%E6%9C%AC%E5%9C%B0%E6%8C%81%E4%B9%85%E5%8C%96%E5%AD%98%E5%82%A8local_pv.md</font>](articles/06-Kubernetes/09-07_本地持久化存储local_pv.md)

# 集群部署与规划
## 组件版本
操作系统版本：Rocky Linux release 8.8  
内核版本：4.18.0-477.21.1.el8_8.x86_64  
kubernetes版本：1.27.4  
containerd版本：1.6.21  
kube-vip版本：0.6.0

ECK版本：2.9.0

ELK版本：8.9.0（后续实验演示更新至8.9.1）

## 节点容量预估
<font style="color:rgb(52, 55, 65);">模拟日志类业务，假设理想情况下，此集群每天最多能够采集20GB的原始日志，需要经常查询最近7天数据，历史数据最大查询时间为30天，日志数据归档存储最多为60天。</font>在先前已完成集群规模与存储容量预估，具体内容参考文档：[https://www.cuiliangblog.cn/detail/article/58](https://www.cuiliangblog.cn/detail/article/58)

| 节点类型 | 有效保留期（天） | 需存储的数据量 (GB) | 所需总磁盘空间 (GB) | 所需总内存 (GB) |
| --- | --- | --- | --- | --- |
| hot | 7 | 308 | 370 | 12 |
| warm | <font style="color:rgb(48, 49, 51);">23</font> | <font style="color:rgb(48, 49, 51);">1012</font> | <font style="color:rgb(48, 49, 51);">1214</font> | <font style="color:rgb(48, 49, 51);">12</font> |
| cold | <font style="color:rgb(48, 49, 51);">30</font> | <font style="color:rgb(48, 49, 51);">660</font> | <font style="color:rgb(48, 49, 51);">792</font> | <font style="color:rgb(48, 49, 51);">1</font> |
| master | |  | 10 | |


## 集群角色规划
需要将上述节点尽可能均匀分配至k8s集群，因此规划hot为4节点，warm为2节点，cold为1节点，master为3节点。k8s集群es节点分布信息如下所示：

| 主机名 | IP | 主机配置 | k8s用途 | ELK节点角色 |
| --- | --- | --- | --- | --- |
| <font style="color:rgb(48, 49, 51);">master1</font> | <font style="color:rgb(48, 49, 51);">192.168.10.151</font> | <font style="color:rgb(48, 49, 51);">2C8G</font> | <font style="color:rgb(48, 49, 51);">control-plane</font> | hot1-0、hot2-0 |
| <font style="color:rgb(48, 49, 51);">master2</font> | <font style="color:rgb(48, 49, 51);">192.168.10.152</font> | <font style="color:rgb(48, 49, 51);">2C8G</font> | <font style="color:rgb(48, 49, 51);">control-plane</font> | hot1-1、hot2-1 |
| <font style="color:rgb(48, 49, 51);">master3</font> | <font style="color:rgb(48, 49, 51);">192.168.10.153</font> | <font style="color:rgb(48, 49, 51);">2C8G</font> | <font style="color:rgb(48, 49, 51);">control-plane</font> | warm1 |
| <font style="color:rgb(48, 49, 51);">work1</font> | <font style="color:rgb(48, 49, 51);">192.168.10.154</font> | <font style="color:rgb(48, 49, 51);">2C8G</font> | <font style="color:rgb(48, 49, 51);">work</font> | warm2、master1 |
| <font style="color:rgb(48, 49, 51);">work2</font> | <font style="color:rgb(48, 49, 51);">192.168.10.155</font> | <font style="color:rgb(48, 49, 51);">2C4G</font> | <font style="color:rgb(48, 49, 51);">work</font> | cold、master2 |
| <font style="color:rgb(48, 49, 51);">work3</font> | <font style="color:rgb(48, 49, 51);">192.168.10.156</font> | <font style="color:rgb(48, 49, 51);">2C4G</font> | <font style="color:rgb(48, 49, 51);">work</font> | master3 |


## jvm与内存配置
<font style="color:rgb(48, 49, 51);">jvm配置取pod内存的一半和32GB内存之间的小值，jvm配置如下</font>

| 服务 | 内存limit | jvm上限 |
| --- | --- | --- |
| master | 1G | 512m |
| hot | 3G | <font style="color:rgb(51, 51, 51);">1536m</font> |
| warm | 6G | 3g |
| cold | 1G | 512m |
| kibana | 1G | 512m |


## 数据盘容量规划
master1和master2节点数据盘使用SSD，分区后分别挂载至data1和data2目录下

master3、work1、work2数据盘使用HDD，分区后挂载至data目录下

各节点数据盘挂载路径及容量如下所示，数据盘挂载可参考文章：[../10_Linux/07-06_fdisk%E5%88%86%E5%8C%BA-%E5%88%86%E5%8C%BA%E8%BF%87%E7%A8%8B.md](articles/10-Linux/07-06_fdisk分区-分区过程.md)

各节点数据盘挂载容量以及路径规划如下：

| 主机名 | ELK节点角色 | 磁盘类型 | data | data1 | data2 |
| --- | --- | --- | --- | --- | --- |
| <font style="color:rgb(48, 49, 51);">master1</font> | hot1-0、hot2-0 | SSD | | 100G | 100G |
| <font style="color:rgb(48, 49, 51);">master2</font> | hot1-1、hot2-1 | SSD | | 100G | 100G |
| <font style="color:rgb(48, 49, 51);">master3</font> | warm1 | <font style="color:rgb(48, 49, 51);">HDD</font> | 600G |  | |
| <font style="color:rgb(48, 49, 51);">work1</font> | warm2、master1 | <font style="color:rgb(48, 49, 51);">HDD</font> | 600G | | |
| <font style="color:rgb(48, 49, 51);">work2</font> | cold、master2 | <font style="color:rgb(48, 49, 51);">HDD</font> | 800G | | |
| <font style="color:rgb(48, 49, 51);">work3</font> | master3 | <font style="color:rgb(48, 49, 51);">HDD</font> | |  | |


# 环境准备
## k8s及相关组件部署
kubernetes集群部署参考文档：[../06_Kubernetes/16-01_kubeadm%E9%AB%98%E5%8F%AF%E7%94%A8%E9%83%A8%E7%BD%B2.md](articles/06-Kubernetes/16-01_kubeadm高可用部署.md)

harbor部署参考文档：[../06_Kubernetes/03-01_%E9%83%A8%E7%BD%B2Harbor%E7%A7%81%E6%9C%89%E9%95%9C%E5%83%8F%E4%BB%93%E5%BA%93.md](articles/06-Kubernetes/03-01_部署Harbor私有镜像仓库.md)

traefik部署参考文档：[../06_Kubernetes/08-03_%E9%83%A8%E7%BD%B2%E4%B8%8E%E9%85%8D%E7%BD%AE.md](articles/06-Kubernetes/08-03_部署与配置.md)

minIO部署参考文档：[../06_Kubernetes/03-10_%E9%83%A8%E7%BD%B2MinIO%E5%AF%B9%E8%B1%A1%E5%AD%98%E5%82%A8.md](articles/06-Kubernetes/03-10_部署MinIO对象存储.md)

## 系统参数调整
**<font style="color:rgb(48, 49, 51);">修改文件描述符数目</font>**

<font style="color:rgb(48, 49, 51);">设置环境变量</font>

```plain
# 修改环境变量文件
vim /etc/profile
ulimit -n 65535
# 使配置生效
source /etc/profile
```

<font style="color:rgb(48, 49, 51);">修改limits.conf配置文件</font>

```plain
# 修改limits.conf配置
vim /etc/security/limits.conf
* soft nofile 65535
* hard nofile 65535
```

<font style="color:rgb(48, 49, 51);">验证</font>

```plain
# ulimit -n
65535
```

**<font style="color:rgb(48, 49, 51);">修改虚拟内存数大小</font>**

内核设置可以直接在主机上设置，也可以通过具有特权的初始化容器中设置，通常情况下直接在主机上设置。

<font style="color:rgb(48, 49, 51);">临时设置</font>

```plain
# sysctl -w vm.max_map_count=262144
vm.max_map_count = 262144
```

<font style="color:rgb(48, 49, 51);">永久设置</font>

```plain
cat >> /etc/sysctl.conf << EOF
vm.max_map_count=262144
EOF
# sysctl -p 
vm.max_map_count = 262144
```

## 创建local pv资源
1. 创建StorageClass

<font style="color:rgb(48, 49, 51);">provisioner 字段定义为 no-provisioner，这是因为 Local Persistent Volume 目前尚不支持 Dynamic Provisioning 动态生成 PV，所以我们需要提前手动创建 PV。</font>  
<font style="color:rgb(48, 49, 51);">volumeBindingMode 字段定义为 WaitForFirstConsumer，它是 Local Persistent Volume 里一个非常重要的特性，即：延迟绑定。延迟绑定就是在我们提交 PVC 文件时，StorageClass 为我们延迟绑定 PV 与 PVC 的对应关系。</font>

```bash
[root@tiaoban eck]# cat > storageClass.yaml << EOF
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: local-storage
provisioner: kubernetes.io/no-provisioner
volumeBindingMode: WaitForFirstConsumer
EOF
[root@tiaoban eck]# kubectl apply -f storageClass.yaml 
storageclass.storage.k8s.io/local-storage created
[root@tiaoban eck]# kubectl get storageclass
NAME                  PROVISIONER                                         RECLAIMPOLICY   VOLUMEBINDINGMODE      ALLOWVOLUMEEXPANSION   AGE
local-storage         kubernetes.io/no-provisioner                        Delete          WaitForFirstConsumer   false                  19s
```

2. 创建pv

pv资源分布如下：

| pv名称 | 主机 | 路径 | 容量 |
| --- | --- | --- | --- |
| es-hot-pv1 | master1 | /data1/es-hot-data | 100G |
| es-hot-pv2 | master1 | /data2/es-hot-data | 100G |
| es-hot-pv3 | master2 | /data1/es-hot-data | 100G |
| es-hot-pv4 | master2 | /data2/es-hot-data | 100G |
| es-warm-pv1 | master3 | /data/es-warm-data | 600G |
| es-warm-pv2 | work1 | /data/es-warm-data | 600G |
| es-cold-pv1 | work2 | /data/es-cold-data | 800G |
| es-master-pv1 | work1 | /data/es-master-data | 10G |
| es-master-pv2 | work2 | /data/es-master-data | 10G |
| es-master-pv3 | work3 | /data/es-master-data | 10G |


我们需要提前在各个节点下创建对应的数据存储目录。

```yaml
[root@tiaoban eck]# cat > pv.yaml << EOF
apiVersion: v1
kind: PersistentVolume
metadata:
  name: es-master-pv1
  labels:
    app: es-master-1
spec:
  capacity:
    storage: 10Gi
  volumeMode: Filesystem
  accessModes:
  - ReadWriteOnce
  persistentVolumeReclaimPolicy: Delete # 删除策略
  storageClassName: local-storage # storageClass名称，与前面创建的storageClass保持一致
  local:
    path: /data/es-master-data # 本地存储路径
  nodeAffinity: # 调度至work1节点
    required:
      nodeSelectorTerms:
      - matchExpressions:
        - key: kubernetes.io/hostname
          operator: In
          values:
          - work1
---
apiVersion: v1
kind: PersistentVolume
metadata:
  name: es-master-pv2
  labels:
    app: es-master-2
spec:
  capacity:
    storage: 10Gi
  volumeMode: Filesystem
  accessModes:
  - ReadWriteOnce
  persistentVolumeReclaimPolicy: Delete
  storageClassName: local-storage
  local:
    path: /data/es-master-data
  nodeAffinity:
    required:
      nodeSelectorTerms:
      - matchExpressions:
        - key: kubernetes.io/hostname
          operator: In
          values:
          - work2
---
apiVersion: v1
kind: PersistentVolume
metadata:
  name: es-master-pv3
  labels:
    app: es-master-3
spec:
  capacity:
    storage: 10Gi
  volumeMode: Filesystem
  accessModes:
  - ReadWriteOnce
  persistentVolumeReclaimPolicy: Delete
  storageClassName: local-storage
  local:
    path: /data/es-master-data
  nodeAffinity:
    required:
      nodeSelectorTerms:
      - matchExpressions:
        - key: kubernetes.io/hostname
          operator: In
          values:
          - work3
---
apiVersion: v1
kind: PersistentVolume
metadata:
  name: es-hot-pv1
  labels:
    app: es-hot-1
spec:
  capacity:
    storage: 100Gi
  volumeMode: Filesystem
  accessModes:
  - ReadWriteOnce
  persistentVolumeReclaimPolicy: Delete
  storageClassName: local-storage
  local:
    path: /data1/es-hot-data
  nodeAffinity:
    required:
      nodeSelectorTerms:
      - matchExpressions:
        - key: kubernetes.io/hostname
          operator: In
          values:
          - master1
---
apiVersion: v1
kind: PersistentVolume
metadata:
  name: es-hot-pv2
  labels:
    app: es-hot-2
spec:
  capacity:
    storage: 100Gi
  volumeMode: Filesystem
  accessModes:
  - ReadWriteOnce
  persistentVolumeReclaimPolicy: Delete
  storageClassName: local-storage
  local:
    path: /data2/es-hot-data
  nodeAffinity:
    required:
      nodeSelectorTerms:
      - matchExpressions:
        - key: kubernetes.io/hostname
          operator: In
          values:
          - master1
---
apiVersion: v1
kind: PersistentVolume
metadata:
  name: es-hot-pv3
  labels:
    app: es-hot-3
spec:
  capacity:
    storage: 100Gi
  volumeMode: Filesystem
  accessModes:
  - ReadWriteOnce
  persistentVolumeReclaimPolicy: Delete
  storageClassName: local-storage
  local:
    path: /data1/es-hot-data
  nodeAffinity:
    required:
      nodeSelectorTerms:
      - matchExpressions:
        - key: kubernetes.io/hostname
          operator: In
          values:
          - master2
---
apiVersion: v1
kind: PersistentVolume
metadata:
  name: es-hot-pv4
  labels:
    app: es-hot-4
spec:
  capacity:
    storage: 100Gi
  volumeMode: Filesystem
  accessModes:
  - ReadWriteOnce
  persistentVolumeReclaimPolicy: Delete
  storageClassName: local-storage
  local:
    path: /data2/es-hot-data
  nodeAffinity:
    required:
      nodeSelectorTerms:
      - matchExpressions:
        - key: kubernetes.io/hostname
          operator: In
          values:
          - master2
---
apiVersion: v1
kind: PersistentVolume
metadata:
  name: es-warm-pv1
  labels:
    app: es-warm-1
spec:
  capacity:
    storage: 600Gi
  volumeMode: Filesystem
  accessModes:
  - ReadWriteOnce
  persistentVolumeReclaimPolicy: Delete
  storageClassName: local-storage
  local:
    path: /data/es-warm-data
  nodeAffinity:
    required:
      nodeSelectorTerms:
      - matchExpressions:
        - key: kubernetes.io/hostname
          operator: In
          values:
          - master3
---
apiVersion: v1
kind: PersistentVolume
metadata:
  name: es-warm-pv2
  labels:
    app: es-warm-2
spec:
  capacity:
    storage: 600Gi
  volumeMode: Filesystem
  accessModes:
  - ReadWriteOnce
  persistentVolumeReclaimPolicy: Delete
  storageClassName: local-storage
  local:
    path: /data/es-warm-data
  nodeAffinity:
    required:
      nodeSelectorTerms:
      - matchExpressions:
        - key: kubernetes.io/hostname
          operator: In
          values:
          - work1
---
apiVersion: v1
kind: PersistentVolume
metadata:
  name: es-cold-pv1
  labels:
    app: es-cold-1
spec:
  capacity:
    storage: 800Gi
  volumeMode: Filesystem
  accessModes:
  - ReadWriteOnce
  persistentVolumeReclaimPolicy: Delete
  storageClassName: local-storage
  local:
    path: /data/es-cold-data
  nodeAffinity:
    required:
      nodeSelectorTerms:
      - matchExpressions:
        - key: kubernetes.io/hostname
          operator: In
          values:
          - work2
EOF
[root@tiaoban eck]# kubectl apply -f pv.yaml 
persistentvolume/es-hot-pv1 created
persistentvolume/es-hot-pv2 created
persistentvolume/es-hot-pv3 created
persistentvolume/es-hot-pv4 created
persistentvolume/es-warm-pv1 created
persistentvolume/es-warm-pv2 created
persistentvolume/es-cold-pv1 created
persistentvolume/es-master-pv1 created
persistentvolume/es-master-pv2 created
persistentvolume/es-master-pv3 created
[root@tiaoban eck]# kubectl get pv | grep es
es-master-pv1     10Gi       RWO            Delete           Available                        local-storage                  17s
es-master-pv2     10Gi       RWO            Delete           Available                        local-storage                  17s
es-master-pv3     10Gi       RWO            Delete           Available                        local-storage                  17s
es-cold-pv1       800Gi      RWO            Delete           Available                        local-storage                  17s
es-hot-pv1        100Gi      RWO            Delete           Available                        local-storage                  18s
es-hot-pv2        100Gi      RWO            Delete           Available                        local-storage                  18s
es-hot-pv3        100Gi      RWO            Delete           Available                        local-storage                  17s
es-hot-pv4        100Gi      RWO            Delete           Available                        local-storage                  17s
es-warm-pv1       600Gi      RWO            Delete           Available                        local-storage                  17s
es-warm-pv2       600Gi      RWO            Delete           Available                        local-storage                  17s
```

3. 创建pvc

<font style="color:rgb(48, 49, 51);">创建的时候注意pvc的名字的构成：pvc的名字 = volume_name-statefulset_name-序号，然后通过selector标签选择，强制将pvc与pv绑定。</font>

```yaml
[root@tiaoban eck]# cat > pvc.yaml << EOF
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: elasticsearch-data-elasticsearch-es-master-0
  namespace: elk
spec:
  accessModes:
  - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
  storageClassName: local-storage
  selector:
    matchLabels:
      app: es-master-1
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: elasticsearch-data-elasticsearch-es-master-1
  namespace: elk
spec:
  accessModes:
  - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
  storageClassName: local-storage
  selector:
    matchLabels:
      app: es-master-2
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: elasticsearch-data-elasticsearch-es-master-2
  namespace: elk
spec:
  accessModes:
  - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
  storageClassName: local-storage
  selector:
    matchLabels:
      app: es-master-3
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: elasticsearch-data-elasticsearch-es-hot1-0
  namespace: elk
spec:
  accessModes:
  - ReadWriteOnce
  resources:
    requests:
      storage: 100Gi
  storageClassName: local-storage
  selector:
    matchLabels:
      app: es-hot-1
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: elasticsearch-data-elasticsearch-es-hot1-1
  namespace: elk
spec:
  accessModes:
  - ReadWriteOnce
  resources:
    requests:
      storage: 100Gi
  storageClassName: local-storage
  selector:
    matchLabels:
      app: es-hot-2
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: elasticsearch-data-elasticsearch-es-hot2-0
  namespace: elk
spec:
  accessModes:
  - ReadWriteOnce
  resources:
    requests:
      storage: 100Gi
  storageClassName: local-storage
  selector:
    matchLabels:
      app: es-hot-3
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: elasticsearch-data-elasticsearch-es-hot2-1
  namespace: elk
spec:
  accessModes:
  - ReadWriteOnce
  resources:
    requests:
      storage: 100Gi
  storageClassName: local-storage
  selector:
    matchLabels:
      app: es-hot-4
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: elasticsearch-data-elasticsearch-es-warm-0
  namespace: elk
spec:
  accessModes:
  - ReadWriteOnce
  resources:
    requests:
      storage: 600Gi
  storageClassName: local-storage
  selector:
    matchLabels:
      app: es-warm-1
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: elasticsearch-data-elasticsearch-es-warm-1
  namespace: elk
spec:
  accessModes:
  - ReadWriteOnce
  resources:
    requests:
      storage: 600Gi
  storageClassName: local-storage
  selector:
    matchLabels:
      app: es-warm-2
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: elasticsearch-data-elasticsearch-es-cold-0
  namespace: elk
spec:
  accessModes:
  - ReadWriteOnce
  resources:
    requests:
      storage: 800Gi
  storageClassName: local-storage
  selector:
    matchLabels:
      app: es-cold-1
EOF
[root@tiaoban eck]# kubectl create ns elk
namespace/elk created
[root@tiaoban eck]# kubectl apply -f pvc.yaml 
persistentvolumeclaim/es-hot-claim created
persistentvolumeclaim/es-warm-claim created
persistentvolumeclaim/es-cold-claim created
[root@tiaoban eck]# kubectl get pvc -n elk
NAME                                           STATUS   VOLUME   CAPACITY   ACCESS MODES   STORAGECLASS    AGE
elasticsearch-data-elasticsearch-es-cold-0     Pending                                     local-storage   9s
elasticsearch-data-elasticsearch-es-hot1-0     Pending                                     local-storage   9s
elasticsearch-data-elasticsearch-es-hot1-1     Pending                                     local-storage   9s
elasticsearch-data-elasticsearch-es-hot2-0     Pending                                     local-storage   9s
elasticsearch-data-elasticsearch-es-hot2-1     Pending                                     local-storage   9s
elasticsearch-data-elasticsearch-es-master-0   Pending                                     local-storage   9s
elasticsearch-data-elasticsearch-es-master-1   Pending                                     local-storage   9s
elasticsearch-data-elasticsearch-es-master-2   Pending                                     local-storage   9s
elasticsearch-data-elasticsearch-es-warm-0     Pending                                     local-storage   9s
elasticsearch-data-elasticsearch-es-warm-1     Pending                                     local-storage   9s
```

# ECK部署与配置
## ECK部署
1. 部署CRD资源

```bash
[root@tiaoban eck]# wget https://download.elastic.co/downloads/eck/2.13.0/crds.yaml
[root@tiaoban eck]# kubectl apply -f crds.yaml 
customresourcedefinition.apiextensions.k8s.io/agents.agent.k8s.elastic.co created
customresourcedefinition.apiextensions.k8s.io/apmservers.apm.k8s.elastic.co created
customresourcedefinition.apiextensions.k8s.io/beats.beat.k8s.elastic.co created
customresourcedefinition.apiextensions.k8s.io/elasticmapsservers.maps.k8s.elastic.co created
customresourcedefinition.apiextensions.k8s.io/elasticsearchautoscalers.autoscaling.k8s.elastic.co created
customresourcedefinition.apiextensions.k8s.io/elasticsearches.elasticsearch.k8s.elastic.co created
customresourcedefinition.apiextensions.k8s.io/enterprisesearches.enterprisesearch.k8s.elastic.co created
customresourcedefinition.apiextensions.k8s.io/kibanas.kibana.k8s.elastic.co created
customresourcedefinition.apiextensions.k8s.io/logstashes.logstash.k8s.elastic.co created
customresourcedefinition.apiextensions.k8s.io/stackconfigpolicies.stackconfigpolicy.k8s.elastic.co created
```

2. 部署Operator

```bash
[root@tiaoban eck]# wget https://download.elastic.co/downloads/eck/2.13.0/operator.yaml
[root@tiaoban eck]# kubectl apply -f operator.yaml 
namespace/elastic-system created
serviceaccount/elastic-operator created
secret/elastic-webhook-server-cert created
configmap/elastic-operator created
clusterrole.rbac.authorization.k8s.io/elastic-operator created
clusterrole.rbac.authorization.k8s.io/elastic-operator-view created
clusterrole.rbac.authorization.k8s.io/elastic-operator-edit created
clusterrolebinding.rbac.authorization.k8s.io/elastic-operator created
service/elastic-webhook-server created
statefulset.apps/elastic-operator created
validatingwebhookconfiguration.admissionregistration.k8s.io/elastic-webhook.k8s.elastic.co created
```

3. 验证

```bash
[root@tiaoban eck]# kubectl get pod -n elastic-system 
NAME                 READY   STATUS    RESTARTS   AGE
elastic-operator-0   1/1     Running   0          2s
[root@tiaoban eck]# kubectl get svc -n elastic-system 
NAME                     TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)   AGE
elastic-webhook-server   ClusterIP   10.103.185.159   <none>        443/TCP   5m55s
```

当看到elastic-operator-0状态为Running时，表示eck已成功部署并运行在k8s集群上。

## Elasticsearch部署
1. 创建资源清单

需要注意的是案例中使用了hot1、hot2两组hot节点。模拟实际生产环境中大内存机器一个节点运行多个pod的情况。

```yaml
apiVersion: elasticsearch.k8s.elastic.co/v1
kind: Elasticsearch
metadata:
  namespace: elk
  name: elasticsearch
spec:
  version: 8.9.1
  image: harbor.local.com/elk/elasticsearch:8.9.1  # 自定义镜像地址，如果不指定则从elastic官方镜像仓库拉取
  nodeSets:
  - name: master # 节点名称
    count: 3  # 节点数量
    config:
      node.roles: ["master", "ingest", "remote_cluster_client", "transform"] # 节点角色
    volumeClaimTemplates:
    - metadata:
        name: elasticsearch-data 
      spec:
        accessModes:
        - ReadWriteOnce
        resources:
          requests:
            storage: 10Gi # 指定master节点存储容量，与pvc容量保持一致。
        storageClassName: local-storage
    podTemplate:
      spec:
        containers:
        - name: elasticsearch
          env:
          - name: ES_JAVA_OPTS           # 指定节点JVM大小
            value: "-Xms512m -Xmx512m"
          resources:
            limits:											# 资源限制值，通常为JVM的2倍
              cpu: 1
              memory: 1Gi
            requests:										# 资源请求值，通常与JVM保持一致
              cpu: 500m
              memory: 512Mi
  - name: hot1
    count: 2
    config:
      node.roles: [ "data_content", "data_hot", "remote_cluster_client"]
    volumeClaimTemplates:
    - metadata:
        name: elasticsearch-data
      spec:
        accessModes:
        - ReadWriteOnce
        resources:
          requests:
            storage: 100Gi
        storageClassName: local-storage
    podTemplate:
      spec:
        containers:
        - name: elasticsearch
          env:
          - name: ES_JAVA_OPTS
            value: "-Xms1536m -Xmx1536m"
          resources:
            limits:
              cpu: 1
              memory: 3Gi
            requests:
              cpu: 500m
              memory: 1536Mi
  - name: hot2
    count: 2
    config:
      node.roles: [ "data_content", "data_hot", "remote_cluster_client"]
    volumeClaimTemplates:
    - metadata:
        name: elasticsearch-data
      spec:
        accessModes:
        - ReadWriteOnce
        resources:
          requests:
            storage: 100Gi
        storageClassName: local-storage
    podTemplate:
      spec:
        containers:
        - name: elasticsearch
          env:
          - name: ES_JAVA_OPTS
            value: "-Xms1536m -Xmx1536m"
          resources:
            limits:
              cpu: 1
              memory: 3Gi
            requests:
              cpu: 500m
              memory: 1536Mi
  - name: warm
    count: 2
    config:
      node.roles: [ "data_content", "data_warm", "remote_cluster_client"]
    volumeClaimTemplates:
    - metadata:
        name: elasticsearch-data
      spec:
        accessModes:
        - ReadWriteOnce
        resources:
          requests:
            storage: 600Gi
        storageClassName: local-storage
    podTemplate:
      spec:
        containers:
        - name: elasticsearch
          env:
          - name: ES_JAVA_OPTS
            value: "-Xms3g -Xmx3g"
          resources:
            limits:
              cpu: 1
              memory: 6Gi
            requests:
              cpu: 500m
              memory: 3Gi
  - name: cold
    count: 1
    config:
      node.roles: [ "data_content", "data_cold", "remote_cluster_client"]
    volumeClaimTemplates:
    - metadata:
        name: elasticsearch-data
      spec:
        accessModes:
        - ReadWriteOnce
        resources:
          requests:
            storage: 800Gi
        storageClassName: local-storage
    podTemplate:
      spec:
        containers:
        - name: elasticsearch
          env:
          - name: ES_JAVA_OPTS
            value: "-Xms512m -Xmx512m"
          resources:
            limits:
              cpu: 1
              memory: 1Gi
            requests:
              cpu: 500m
              memory: 512Mi
```

2. 创建资源并查看

```bash
[root@tiaoban eck]# kubectl apply -f elasticsearch.yaml 
elasticsearch.elasticsearch.k8s.elastic.co/elasticsearch created
[root@tiaoban eck]# kubectl get pod -n elk
NAME                        READY   STATUS    RESTARTS   AGE
elasticsearch-es-cold-0     1/1     Running   0          4m32s
elasticsearch-es-hot1-0     1/1     Running   0          4m33s
elasticsearch-es-hot1-1     1/1     Running   0          4m33s
elasticsearch-es-hot2-0     1/1     Running   0          4m32s
elasticsearch-es-hot2-1     1/1     Running   0          4m32s
elasticsearch-es-master-0   1/1     Running   0          4m33s
elasticsearch-es-master-1   1/1     Running   0          4m33s
elasticsearch-es-master-2   1/1     Running   0          4m33s
elasticsearch-es-warm-0     1/1     Running   0          4m32s
elasticsearch-es-warm-1     1/1     Running   0          4m32s
[root@tiaoban eck]# kubectl get svc -n elk
NAME                             TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)    AGE
elasticsearch-es-cold            ClusterIP   None            <none>        9200/TCP   6m5s
elasticsearch-es-hot1            ClusterIP   None            <none>        9200/TCP   6m6s
elasticsearch-es-hot2            ClusterIP   None            <none>        9200/TCP   6m6s
elasticsearch-es-http            ClusterIP   10.99.207.200   <none>        9200/TCP   6m9s
elasticsearch-es-internal-http   ClusterIP   10.102.112.10   <none>        9200/TCP   6m9s
elasticsearch-es-master          ClusterIP   None            <none>        9200/TCP   6m6s
elasticsearch-es-transport       ClusterIP   None            <none>        9300/TCP   6m9s
elasticsearch-es-warm            ClusterIP   None            <none>        9200/TCP   6m6s
[root@tiaoban eck]# kubectl get es -n elk
NAME            HEALTH   NODES   VERSION   PHASE   AGE
elasticsearch   green    10      8.9.0     Ready   4m51s
```

3. 获取elastic用户密码

```bash
[root@tiaoban eck]# kubectl get secrets -n elk elasticsearch-es-elastic-user  -o go-template='{{.data.elastic | base64decode}}'
E892Og59n83ufLxCF0D6duS2
```

4. 导出CA证书

```bash
[root@tiaoban eck]# kubectl -n elk get secret elasticsearch-es-http-certs-public -o go-template='{{index .data "ca.crt" | base64decode }}' > ca.crt
```

5. 访问验证

```bash
[root@master1 ~]# curl -k https://elastic:CHANGE_ME@10.99.207.200:9200/_cat/nodes?v
ip          heap.percent ram.percent cpu load_1m load_5m load_15m node.role master name
10.244.0.28            7          63  29    9.69    6.21     3.27 hs        -      elasticsearch-es-hot1-1
10.244.0.27            8          63  30    9.69    6.21     3.27 hs        -      elasticsearch-es-hot1-0
10.244.5.92           69          86  32    0.34    0.98     0.85 im        -      elasticsearch-es-master-0
10.244.4.88           20          86  30    0.35    0.42     0.53 cs        -      elasticsearch-es-cold-0
10.244.3.70           42          88  28    0.41    0.53     0.65 im        *      elasticsearch-es-master-2
10.244.5.93           11          57  33    0.34    0.98     0.85 sw        -      elasticsearch-es-warm-1
10.244.4.87           54          87  30    0.35    0.42     0.53 im        -      elasticsearch-es-master-1
10.244.1.21           18          63  35    1.26    3.12     2.04 hs        -      elasticsearch-es-hot2-1
10.244.2.24            5          59  33    1.09    1.82     1.66 sw        -      elasticsearch-es-warm-0
10.244.1.20           17          63  29    1.26    3.12     2.04 hs        -      elasticsearch-es-hot2-0
```

## Kibana部署
1. 资源清单

```bash
apiVersion: kibana.k8s.elastic.co/v1
kind: Kibana
metadata:
  name: kibana
  namespace: elk
spec:
  version: 8.9.1
  image: harbor.local.com/elk/kibana:8.9.1
  count: 1
  elasticsearchRef: # 与Elasticsearch资源名称匹配
    name: elasticsearch
  podTemplate:
    spec:
      containers:
      - name: kibana
        env:
          - name: NODE_OPTIONS
            value: "--max-old-space-size=2048"
          - name: SERVER_PUBLICBASEURL
            value: "https://kibana.local.com"
        resources:
          requests:
            memory: 1Gi
            cpu: 0.5
          limits:
            memory: 2Gi
            cpu: 2
```

2. 创建资源并查看

```bash
[root@tiaoban eck]# kubectl apply -f kibana.yaml 
kibana.kibana.k8s.elastic.co/kibana created
[root@tiaoban eck]# kubectl get pod -n elk | grep kibana
kibana-kb-6698c6c45d-r7jj6   1/1     Running       0          3m39s
[root@tiaoban eck]# kubectl get svc -n elk | grep kibana
kibana-kb-http                   ClusterIP   10.105.217.119   <none>        5601/TCP   3m43s
[root@tiaoban eck]# kubectl get kibana -n elk
NAME     HEALTH   NODES   VERSION   AGE
kibana   green    1       8.9.0     3m50s
```

至此，elasticsearch集群和kibana均已部署完毕。但由于svc默认使用cluster方式，因此无法在集群外部访问该服务。此时可以使用nodePort或者ingress方式暴露服务。

## 创建Ingress资源
1. <font style="color:rgb(48, 49, 51);">创建自签证书</font>

```bash
[root@tiaoban tls]# openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout tls.key -out tls.crt -subj "/CN=elk-tls"
Generating a RSA private key
writing new private key to 'tls.key'
-----
[root@tiaoban tls]# ls
tls.crt  tls.key
```

2. <font style="color:rgb(48, 49, 51);">创建Secret资源来引入证书文件</font>

```bash
[root@tiaoban tls]# kubectl create secret tls -n elk elk-tls --cert=tls.crt --key=tls.key
secret/elk-tls created
```

3. <font style="color:rgb(48, 49, 51);">创建IngressRouter规则文件和ServersTransport文件，配置insecureSkipVerify使得traefik代理访问后端服务时跳过证书验证。</font>

```yaml
apiVersion: traefik.io/v1alpha1
kind: ServersTransport
metadata:
  name: elasticsearch-transport
  namespace: elk
spec:
  serverName: "elasticsearch.local.com"
  insecureSkipVerify: true
---
apiVersion: traefik.io/v1alpha1
kind: IngressRoute
metadata:
  name: elasticsearch
  namespace: elk
spec:
  entryPoints:
    - websecure                  
  routes:
  - match: Host(`elasticsearch.local.com`)
    kind: Rule
    services:
    - name: elasticsearch-es-http
      port: 9200
      serversTransport: elasticsearch-transport
  tls:
    secretName: elk-tls
---
apiVersion: traefik.io/v1alpha1
kind: ServersTransport
metadata:
  name: kibana-transport
  namespace: elk
spec:
  serverName: "kibana.local.com"
  insecureSkipVerify: true
---
apiVersion: traefik.io/v1alpha1
kind: IngressRoute
metadata:
  name: kibana
  namespace: elk
spec:
  entryPoints:
    - websecure             
  routes:
  - match: Host(`kibana.local.com`)
    kind: Rule
    services:
    - name: kibana-kb-http
      port: 5601
      serversTransport: kibana-transport
  tls:
    secretName: elk-tls
```

4. <font style="color:rgb(48, 49, 51);">创建资源</font>

```bash
[root@tiaoban eck]# kubectl apply -f ingress.yaml 
ingressroute.traefik.containo.us/elasticsearch created
ingressroute.traefik.containo.us/kibana created
[root@tiaoban eck]# kubectl get ingressroute -n elk
NAME            AGE
elasticsearch   8s
kibana          7s
```

## 访问验证
1. 客户端添加hosts记录

```bash
192.168.10.150 elasticsearch.local.com kibana.local.com
```

2. 访问kibana测试

![](assets/01-ELK-Stack/2656b4f028a27678f86d.png)

3. 客户端连接ES测试

```bash
➜  curl -k https://elastic:CHANGE_ME@elasticsearch.local.com/_cat/nodes?v
ip           heap.percent ram.percent cpu load_1m load_5m load_15m node.role master name
10.244.4.117           32         100   9    1.11    0.73     0.63 crs       -      elasticsearch-es-cold-0
10.244.1.32            46          69   6    5.22    5.79     4.04 hrs       -      elasticsearch-es-hot2-0
10.244.4.118           75          99   5    1.11    0.73     0.63 imr       -      elasticsearch-es-master-1
10.244.1.35            63          69   9    5.22    5.79     4.04 hrs       -      elasticsearch-es-hot2-1
10.244.0.42            30          68  11    1.14    1.31     1.48 hrs       -      elasticsearch-es-hot1-0
10.244.3.93            72         100   6    1.02    0.79     0.60 imr       *      elasticsearch-es-master-2
10.244.0.43            38          67   8    1.14    1.31     1.48 hrs       -      elasticsearch-es-hot1-1
10.244.2.33            47          61   6    1.36    1.35     1.14 rsw       -      elasticsearch-es-warm-0
10.244.5.116           54         100   4    0.65    0.70     0.68 imr       -      elasticsearch-es-master-0
10.244.5.113           42          61   7    0.65    0.70     0.68 rsw       -      elasticsearch-es-warm-1
```

# 分片分配感知
## 使用场景
在实际生产环境中，可能会由于服务器资源紧张，或者服务器内存较大，为充分利用资源，我们可以在一台主机上运行多个pod。如下所示，我们在master1节点运行了elasticsearch-es-hot1-1和elasticsearch-es-hot2-1，在master2节点运行了elasticsearch-es-hot1-0和elasticsearch-es-hot2-0

```bash
[root@tiaoban ~]# kubectl get pod -n elk -o wide | grep master1
elasticsearch-es-hot1-1      1/1     Running   2 (141m ago)   23h   10.244.0.90    master1   <none>           <none>
elasticsearch-es-hot2-1      1/1     Running   2 (141m ago)   23h   10.244.0.89    master1   <none>           <none>
[root@tiaoban ~]# kubectl get pod -n elk -o wide | grep master2
elasticsearch-es-hot1-0      1/1     Running   2 (141m ago)   23h   10.244.1.75    master2   <none>           <none>
elasticsearch-es-hot2-0      1/1     Running   2 (141m ago)   23h   10.244.1.76    master2   <none>           <none>
```

此时我们写入一个新的index，设置4个分片1个副本。此时ES并不知道4个pod运行在了两个节点上，在ES分配策略中只要保证主副分片不在一个pod即可。此时观察分片分配情况，会出现如下情况：

![](assets/01-ELK-Stack/3e34d11769d4660c0c7b.png)

仔细观察会发现，虽然每个节点都均匀的分配了1主1副分片，且主副分片不在一个节点，表面上看其中一个节点宕机不会导致索引数据不可用。但是从上面的分析可知，master2节点运行了elasticsearch-es-hot1-0和elasticsearch-es-hot2-0，而分片2的主副分片两个节点恰好都在master2上，一但master2节点宕机，分片2就会不可以，从而导致整个集群变为red状态。

## 配置节点属性
我们可以通过分片分配感知设置，让es在分片分配时考虑到节点属性从而避免分配到同一物理机节点上。分片分配感知可参考文档：[01-08_ES%E5%88%86%E7%89%87%E5%88%86%E9%85%8D%E6%84%9F%E7%9F%A5.md](articles/01-ELK-Stack/01-08_ES分片分配感知.md)

+ 修改elasticsearch资源清单，对hot1和hot2新增node.attr配置

```bash
- name: hot1
    count: 2
    config:
      node.roles: [ "data_content", "data_hot", "remote_cluster_client"]
      node.attr.rack_id: rack1 # 新增node.attr节点属性配置
  - name: hot2
    count: 2
    config:
      node.roles: [ "data_content", "data_hot", "remote_cluster_client"]
      node.attr.rack_id: rack2 # 新增node.attr节点属性配置
```

+ 更新elasticsearch资源

```bash
[root@tiaoban eck]# kubectl apply -f elasticsearch.yaml 
elasticsearch.elasticsearch.k8s.elastic.co/elasticsearch configured
```

## 配置集群分片分配策略
+ 待hot节点重启并加入集群后，通过dev tools新增集群分片分配感知设置

```bash
PUT _cluster/settings
{
  "persistent": {
    "cluster.routing.allocation.awareness.attributes": "rack_id"
  }
}
```

## 结果验证
+ 通过monitor查看分片分配情况，已解决上述问题

![](assets/01-ELK-Stack/0ebb644cf0e9badd304d.png)

# 数据备份与恢复
ES支持快照功能，用于实现数据的备份与恢复。我们可以生成单个索引或整个集群的快照，并将其存储在共享文件系统上的存储库中，并且有一些插件支持 S3、HDFS、Azure、Google Cloud Storage 等上的远程存储库，本实验以minio为例演示es的快照备份与恢复。

## <font style="color:rgb(48, 49, 51);">创建bucket和Access Key</font>
<font style="color:rgb(48, 49, 51);">创建一个名为es-backup的bucket，并设置容量上限为1TB</font>

<font style="color:rgb(48, 49, 51);">创建access key并牢记，后续使用。  
</font><font style="color:rgb(48, 49, 51);">创建访问权限策略。</font>

<font style="color:rgb(48, 49, 51);">以上操作可参考文档</font>[<font style="color:rgb(48, 49, 51);">https://www.cuiliangblog.cn/detail/article/60</font>](https://www.cuiliangblog.cn/detail/article/60)<font style="color:rgb(48, 49, 51);">，此处不再过多赘述。</font>

## <font style="color:rgb(0, 0, 0);">Elasticsearch配置</font><font style="color:rgb(33, 37, 41);">存储库</font><font style="color:rgb(0, 0, 0);">资源</font>
创建名为snapshot-settings的secret资源存储ak和sk

```bash
[root@tiaoban eck]# kubectl create secret generic -n elk snapshot-settings \
   --from-literal=s3.client.default.access_key= CHANGE_ME \
   --from-literal=s3.client.default.secret_key= CHANGE_ME
```

修改elasticsearch资源清单，挂载snapshot-settings资源

```bash
apiVersion: elasticsearch.k8s.elastic.co/v1
kind: Elasticsearch
metadata:
  namespace: elk
  name: elasticsearch
spec:
  version: 8.9.1
  image: harbor.local.com/elk/elasticsearch:8.9.1
  secureSettings:                   # 新增存储库资源配置
  - secretName: snapshot-settings
```

## 注册存储库并验证
查看minIO存储服务名和端口

```bash
[root@tiaoban ~]# kubectl get svc -n minio 
NAME             TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)             AGE
minio            ClusterIP   10.106.159.124   <none>        9000/TCP,9001/TCP   13d
minio-headless   ClusterIP   None             <none>        9000/TCP,9001/TCP   13d
```

使用dev tools工具注册存储库，填写minIO服务的svc地址和端口

```bash
POST _snapshot/minIO
{
  "type": "s3",
  "settings": {
    "bucket": "es-backup",
    "path_style_access": true,
    "protocol":"http",	
    "endpoint": "minio.minio.svc:9000" 
  }
}
```

## 访问验证
我们查看存储库详情，点击验证可以看到ES集群所有节点均可连接到minIO服务。

![](assets/01-ELK-Stack/b0da3ea89b50bb75ee48.png)

接下来我们就可以使用minIO备份和恢复ES资源，具体使用可参考文档：[https://www.cuiliangblog.cn/detail/article/60](https://www.cuiliangblog.cn/detail/article/60)

# ECK日常维护
## Elasticsearch配置更改
> 目前由ECK托管的配置项可参考文档：[https://www.elastic.co/guide/en/cloud-on-k8s/current/k8s-reserved-settings.html](https://www.elastic.co/guide/en/cloud-on-k8s/current/k8s-reserved-settings.html)，这些配置均由Operator自动生成，不建议修改上述配置项参数。
>

场景案例：假设我们使用ECK部署一套新的ES集群，此时如果想要通过reindex将原本老集群数据迁移到新集群，如果我们直接执行reindex会报错，因为没有在新的ES集群中配置远程集群白名单。

![](assets/01-ELK-Stack/5876c2a700d7eb1ae584.png)

由于只对es的data目录使用了持久化存储，但配置文件未做持久化，因此直接修改yaml配置文件后，pod重启后配置文件会还原为默认值。如果想修改elasticsearch的配置，可以通过环境变量传参方式注入容器中，环境变量传参修改es配置可参考文档：[https://www.elastic.co/guide/en/elasticsearch/reference/current/docker.html#docker-configuration-methods](https://www.elastic.co/guide/en/elasticsearch/reference/current/docker.html#docker-configuration-methods)

如果修改elasticsearch.yaml配置文件，应该添加两行配置，内容为:

```bash
reindex.remote.whitelist: "192.168.10.100:9200" # 远程集群白名单
reindex.ssl.verification_mode: "none"           # 跳过证书验证
```

当我们通过环境变量注入时，环境变量调整如下：

1. <font style="color:rgb(33, 37, 41);">将设置名称更改为大写</font>
2. <font style="color:rgb(33, 37, 41);">在前面加上前缀</font><font style="color:rgb(85, 85, 85);background-color:rgb(248, 248, 248);">ES_SETTING_</font>
3. <font style="color:rgb(33, 37, 41);">将原本的_转换为__(如果docker启动转换为_\_)</font>
4. <font style="color:rgb(33, 37, 41);">将所有.转换为下划线_</font>

修改elasticsearch资源清单，对所有节点新增reindex配置，以master节点为例，配置如下：

```yaml
- name: master
    podTemplate:
      spec:
        containers:
        - name: elasticsearch
          env:
          - name: ES_JAVA_OPTS
            value: "-Xms512m -Xmx512m"
          - name: ES_SETTING_REINDEX_REMOTE_WHITELIST       # 远程集群白名单
            value: "192.168.10.100:9200"
          - name: ES_SETTING_REINDEX_SSL_VERIFICATION__MODE # 跳过证书验证
            value: "none"
          resources:
            limits:
              cpu: 1
              memory: 1Gi
            requests:
              cpu: 500m
              memory: 512Mi
```

更新elasticsearch配置

```bash
[root@tiaoban eck]# kubectl apply -f elasticsearch.yaml 
elasticsearch.elasticsearch.k8s.elastic.co/elasticsearch configured
```

观察更新过程

```bash
[root@tiaoban eck]# kubectl get pod -n elk 
NAME                         READY   STATUS        RESTARTS   AGE
elasticsearch-es-cold-0      1/1     Terminating   0          83m
elasticsearch-es-hot1-0      1/1     Running       0          83m
elasticsearch-es-hot1-1      1/1     Running       0          83m
elasticsearch-es-hot2-0      1/1     Running       0          83m
elasticsearch-es-hot2-1      1/1     Running       0          83m
elasticsearch-es-master-0    1/1     Running       0          83m
elasticsearch-es-master-1    1/1     Running       0          83m
elasticsearch-es-master-2    1/1     Running       0          83m
elasticsearch-es-warm-0      1/1     Running       0          83m
elasticsearch-es-warm-1      1/1     Running       0          83m
kibana-kb-65686c844f-6ktrr   1/1     Running       0          83m
[root@tiaoban eck]# kubectl get pod -n elk 
NAME                         READY   STATUS        RESTARTS   AGE
elasticsearch-es-cold-0      1/1     Running       0          2m15s
elasticsearch-es-hot1-0      1/1     Running       0          85m
elasticsearch-es-hot1-1      1/1     Running       0          85m
elasticsearch-es-hot2-0      1/1     Running       0          85m
elasticsearch-es-hot2-1      1/1     Running       0          85m
elasticsearch-es-master-0    1/1     Running       0          85m
elasticsearch-es-master-1    1/1     Running       0          85m
elasticsearch-es-master-2    1/1     Running       0          85m
elasticsearch-es-warm-0      1/1     Running       0          85m
elasticsearch-es-warm-1      1/1     Running       0          85m
kibana-kb-65686c844f-6ktrr   1/1     Running       0          85m
```

观察发现，在更新时，会将其中一个节点退出，然后重启新的节点，直到这个节点加入集群后，才会继续退出下一个节点，滚动更新操作仅针对配置发生变更的节点，滚动更新期间ES集群服务正常运行。

接下来重新执行reindex操作，可以完成远程数据迁移写入。

![](assets/01-ELK-Stack/8878992f6eac791970f2.png)

## Kibana配置更改
如果想修改kibana的配置，也可以通过环境变量传参方式注入容器中，我们只需要将原本配置项小写转大写，.替换为_即可。支持修改的配置项可参考文档：[https://www.elastic.co/guide/en/kibana/current/settings.html](https://www.elastic.co/guide/en/kibana/current/settings.html)。

例如：将kibana修改为中文，如果修改配置文件，应该添加一行配置，内容为：

```plain
i18n.locale: "zh-CN"
```

当我们通过环境变量注入时，kibana资源清单如下：

```yaml
podTemplate:
    spec:
      containers:
      - name: kibana
        env:
          - name: I18N_LOCALE # 中文配置
            value: "zh-CN"
```

更新kibana配置时，kubernetes会为我们滚动更新，直到新的pod可用后才会停止旧的pod，保证更新期间服务不中断。

```bash
[root@tiaoban eck]# kubectl apply -f kibana.yaml 
kibana.kibana.k8s.elastic.co/kibana configured
[root@tiaoban eck]# kubectl get pod -n elk | grep kibana
kibana-kb-85f54fc9c8-9mmn6   1/1     Running   0            3h4m
kibana-kb-fcb4766f5-sm52t    0/1     Running   0            4s
[root@tiaoban eck]# kubectl get pod -n elk | grep kibana
kibana-kb-fcb4766f5-sm52t   1/1     Running   0             103s
```

访问Kibana测试

![](assets/01-ELK-Stack/6b7cb71020dce18529de.png)

## 节点维护
在实际运维中，可能会因为硬件故障或系统参数调整需要重启节点。因ES是分布式集群，如果节点一旦关机，为保证服务可用性，异常索引的副本分片会自动提升为主分片，并在其他节点复制副本分片。但如果集群数据很大，这个动作很耗时间，且集群IO会很高，为此，需要在维护期间禁用分片分配。

1. 禁用分片分配

```json
PUT _cluster/settings
{
  "persistent": {
    "cluster.routing.allocation.enable": "primaries"
  }
}
```

cluster.routing.allocation.enable参数可选值如下

+ null - （默认值）允许各种分片的分片平衡。
+ primaries - 仅允许主分片的分片平衡。
+ replicas - 仅允许对副本分片进行分片平衡。
+ none - 任何索引都不允许任何类型的分片平衡，会导致创建新的index异常。
2. <font style="color:rgb(33, 37, 41);">执行刷新</font>

```json
POST /_flush
```

flush操作可以确保在translog中存在的数据也永久存在于lucene中。这样打开lucene索引后就无需再从translog中reindex数据，减少了索引恢复时间。

3. 重启机器

以work1节点为例，模拟故障需要重启操作

```json
[root@work1 ~]# reboot
```

此时观察pod状态，在work1节点上的elasticsearch-es-warm-1和elasticsearch-es-master-2已变为Terminating状态

```json
[root@tiaoban eck]# kubectl get pod -n elk -o wide
NAME                         READY   STATUS        RESTARTS      AGE     IP             NODE      NOMINATED NODE   READINESS GATES
elasticsearch-es-cold-0      1/1     Running       0             3h16m   10.244.4.211   work2     <none>           <none>
elasticsearch-es-hot1-0      1/1     Running       0             3h8m    10.244.1.96    master2   <none>           <none>
elasticsearch-es-hot1-1      1/1     Running       0             3h12m   10.244.0.111   master1   <none>           <none>
elasticsearch-es-hot2-0      1/1     Running       0             3h1m    10.244.1.95    master2   <none>           <none>
elasticsearch-es-hot2-1      1/1     Running       0             3h5m    10.244.0.112   master1   <none>           <none>
elasticsearch-es-master-0    1/1     Running       0             163m    10.244.4.213   work2     <none>           <none>
elasticsearch-es-master-1    1/1     Running       0             167m    10.244.3.165   work3     <none>           <none>
elasticsearch-es-master-2    1/1     Terminating   0             170m    10.244.5.215   work1     <none>           <none>
elasticsearch-es-warm-0      1/1     Running       0             174m    10.244.2.79    master3   <none>           <none>
elasticsearch-es-warm-1      1/1     Terminating   0             177m    10.244.5.216   work1     <none>           <none>
kibana-kb-7769c98f75-cnvz7   1/1     Running       0             27h     10.244.3.163   work3     <none>           <none>
```

查看集群状态，依然是green，所有索引数据均可正常读写。

```json
[root@tiaoban eck]# curl -k https://elastic:CHANGE_ME@elasticsearch.local.com/_cluster/health
{"cluster_name":"elasticsearch","status":"green","timed_out":false,"number_of_nodes":8,"number_of_data_nodes":6,"active_primary_shards":33,"active_shards":67,"relocating_shards":0,"initializing_shards":0,"unassigned_shards":0,"delayed_unassigned_shards":0,"number_of_pending_tasks":0,"number_of_in_flight_fetch":0,"task_max_waiting_in_queue_millis":0,"active_shards_percent_as_number":100.0}
```

4. 启用分片分配

待work1节点重启后，可以通过health接口查看集群节点个数，确保work1节点上的加入集群，然后开启分片分配。

```json
PUT _cluster/settings
{
  "persistent": {
    "cluster.routing.allocation.enable": null
  }
}
```

5. 查看恢复进度

```json
GET _cat/health
GET _cat/recovery
```

## 集群重建
由于ES集群故障导致数据无法正常写入时，或者需要对ES集群全部节点进行重启操作时，具体步骤如下：

1. 停止往ES中写入数据的客户端
2. 执行刷新操作，保证数据全部落盘保存。

```json
POST /_flush
```

3. 停止es服务

```bash
[root@tiaoban eck]# kubectl delete -f elasticsearch.yaml 
elasticsearch.elasticsearch.k8s.elastic.co "elasticsearch" deleted
[root@tiaoban eck]# kubectl get pod -n elk
NAME                         READY   STATUS        RESTARTS      AGE
elasticsearch-es-cold-0      1/1     Terminating   0             3h41m
elasticsearch-es-hot1-0      1/1     Terminating   0             3h34m
elasticsearch-es-hot1-1      1/1     Terminating   0             3h37m
elasticsearch-es-hot2-0      1/1     Terminating   0             3h26m
elasticsearch-es-hot2-1      1/1     Terminating   0             3h30m
elasticsearch-es-master-0    1/1     Terminating   0             3h8m
elasticsearch-es-master-1    1/1     Terminating   0             3h12m
elasticsearch-es-master-2    1/1     Terminating   0             20m
elasticsearch-es-warm-0      1/1     Terminating   0             3h19m
elasticsearch-es-warm-1      1/1     Terminating   0             20m
kibana-kb-7769c98f75-cnvz7   1/1     Running       0             28h
```

4. 启动es服务

```bash
[root@tiaoban eck]# kubectl apply -f elasticsearch.yaml 
elasticsearch.elasticsearch.k8s.elastic.co/elasticsearch created
```

5. 获取elastic用户密码

```bash
[root@tiaoban eck]# kubectl get secrets -n elk elasticsearch-es-elastic-user  -o go-template='{{.data.elastic | base64decode}}'
2M37UkiKB5Iy1Ah95v214Frd
```

6. 导出CA证书

```bash
[root@tiaoban eck]# kubectl get secret -n elk elasticsearch-es-http-certs-public -o go-template='{{index .data "ca.crt" | base64decode }}' > ca.crt
```

7. 访问验证

```bash
[root@tiaoban eck]# curl -k https://elastic:CHANGE_ME@elasticsearch.local.com/_cat/nodes?v
ip           heap.percent ram.percent cpu load_1m load_5m load_15m node.role master name
10.244.4.216           52          90  29    2.82    4.80     3.32 imrt      *      elasticsearch-es-master-0
10.244.0.117            6          64  11    4.20    5.81     4.56 hrs       -      elasticsearch-es-hot2-1
10.244.3.172           36          96  20    0.72    1.26     1.04 imrt      -      elasticsearch-es-master-1
10.244.4.217           48          87  20    2.82    4.80     3.32 crs       -      elasticsearch-es-cold-0
10.244.1.100           13          64  22    3.30    4.82     3.10 hrs       -      elasticsearch-es-hot1-0
10.244.5.225            4          57   9    0.96    0.83     0.70 rsw       -      elasticsearch-es-warm-1
10.244.0.116           36          65  29    4.20    5.81     4.56 hrs       -      elasticsearch-es-hot1-1
10.244.5.224           25          87  12    0.96    0.83     0.70 imrt      -      elasticsearch-es-master-2
10.244.1.99            17          64  16    3.30    4.82     3.10 hrs       -      elasticsearch-es-hot2-0
10.244.2.81             7          58  18    1.79    2.33     1.60 rsw       -      elasticsearch-es-warm-0
```

## ES集群密码与证书问题
集群重建后，发现Operator会自动生成一个新的elastic密码，且es证书也会更新(默认情况下ES证书有效期为1年，到期会自动更新证书)

此时如果使用旧的客户端配置连接ES就会出现连接失败的情况。

针对密码更新问题，可以通过以下方式解决：

+ 使用API密钥，每次es集群重建后，token依然可以继续使用。filebeat、logstash、SDK均支持token连接。生成API密钥与SDK使用token可参考文档：[https://www.cuiliangblog.cn/detail/article/70](https://www.cuiliangblog.cn/detail/article/70)，filebeat使用API密钥参考文档：[09-06_%E8%BE%93%E5%87%BA%E5%88%B0Elasticsearch.md](articles/01-ELK-Stack/09-06_输出到Elasticsearch.md)，logstash使用API密钥参考文档：[11-21_%E8%BE%93%E5%87%BA%E6%8F%92%E4%BB%B6-Elasticsearch.md](articles/01-ELK-Stack/11-21_输出插件-Elasticsearch.md)

以curl方式连接es为例：

```bash
# 创建api key
# dev tools请求
POST /_security/api_key
{
  "name": "curl"
}
# 响应
{
  "id": "t9O3bYoBXukIs46qQVzz",
  "name": "curl",
  "api_key": "GoS2PDZzRvyC23Vr3beUUA",
  "encoded": "dDlPM2JZb0JYdWtJczQ2cVFWeno6R29TMlBEWnpSdnlDMjNWcjNiZVVVQQ=="
}
# curl连接访问es
curl -k -H "Authorization: ApiKey dDlPM2JZb0JYdWtJczQ2cVFWeno6R29TMlBEWnpSdnlDMjNWcjNiZVVVQQ==" https://localhost:9200/_cluster/health
```

+ 修改Operator源码，将设置随机密码函数改为指定密码后重新打包镜像。此方法需要会go语言，且每个eck版本密码设置逻辑可能有变化。

针对证书问题，可以通过以下方式解决：

+ 通过ssl.verification_mode: "none"选项跳过证书验证。
+ 将证书创建为k8s的secret资源，其他服务挂载secret证书资源，并对证书有效期监控，后期维护secret证书资源即可。

## 集群扩容
随着后续业务增长，对ES集群性能和规模需求不断增加，此时就需要横向扩展集群节点提高集群容量与性能。此处模拟新增一台服务器，并挂载两块数据盘，将ES集群原来hot节点数从4变为6个。

扩容后集群信息如下：

| 主机名 | IP | 主机配置 | k8s用途 | ELK节点角色 | 磁盘类型 | 数据盘挂载 |
| --- | --- | --- | --- | --- | --- | --- |
| <font style="color:rgb(48, 49, 51);">master1</font> | <font style="color:rgb(48, 49, 51);">192.168.10.151</font> | <font style="color:rgb(48, 49, 51);">2C8G</font> | <font style="color:rgb(48, 49, 51);">control-plane</font> | hot1-0、hot2-0 | SSD | data1:100G data2:100G |
| <font style="color:rgb(48, 49, 51);">master2</font> | <font style="color:rgb(48, 49, 51);">192.168.10.152</font> | <font style="color:rgb(48, 49, 51);">2C8G</font> | <font style="color:rgb(48, 49, 51);">control-plane</font> | hot1-1、hot2-1 | SSD | data1:100G data2:100G |
| <font style="color:rgb(48, 49, 51);">master3</font> | <font style="color:rgb(48, 49, 51);">192.168.10.153</font> | <font style="color:rgb(48, 49, 51);">2C8G</font> | <font style="color:rgb(48, 49, 51);">control-plane</font> | warm1 | HDD | data:600G |
| <font style="color:rgb(48, 49, 51);">work1</font> | <font style="color:rgb(48, 49, 51);">192.168.10.154</font> | <font style="color:rgb(48, 49, 51);">2C8G</font> | <font style="color:rgb(48, 49, 51);">work</font> | warm2、master1 | HDD | data:600G |
| <font style="color:rgb(48, 49, 51);">work2</font> | <font style="color:rgb(48, 49, 51);">192.168.10.155</font> | <font style="color:rgb(48, 49, 51);">2C4G</font> | <font style="color:rgb(48, 49, 51);">work</font> | cold、master2 | HDD | data:800G |
| <font style="color:rgb(48, 49, 51);">work3</font> | <font style="color:rgb(48, 49, 51);">192.168.10.156</font> | <font style="color:rgb(48, 49, 51);">2C4G</font> | <font style="color:rgb(48, 49, 51);">work</font> | master3 | HDD | |
| work4 | <font style="color:rgb(48, 49, 51);">192.168.10.157</font> | <font style="color:rgb(48, 49, 51);">2C8G</font> | <font style="color:rgb(48, 49, 51);">work</font> | hot1-2、hot2-2 | SSD | data1:100G data2:100G |


1. 系统初始化并加入k8s集群

k8s集群新增节点参考文档：[../06_Kubernetes/17-07_%E6%B7%BB%E5%8A%A0work%E8%8A%82%E7%82%B9.md](articles/06-Kubernetes/17-07_添加work节点.md)

修改文件描述符数目和虚拟内存数大小

挂载数据盘并创建相关目录

2. 创建pv资源

```yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: es-hot-pv5
  labels:
    app: es-hot-5
spec:
  capacity:
    storage: 100Gi
  volumeMode: Filesystem
  accessModes:
  - ReadWriteOnce
  persistentVolumeReclaimPolicy: Delete
  storageClassName: local-storage
  local:
    path: /data1/es-hot-data
  nodeAffinity:
    required:
      nodeSelectorTerms:
      - matchExpressions:
        - key: kubernetes.io/hostname
          operator: In
          values:
          - work4
---
apiVersion: v1
kind: PersistentVolume
metadata:
  name: es-hot-pv6
  labels:
    app: es-hot-6
spec:
  capacity:
    storage: 100Gi
  volumeMode: Filesystem
  accessModes:
  - ReadWriteOnce
  persistentVolumeReclaimPolicy: Delete
  storageClassName: local-storage
  local:
    path: /data2/es-hot-data
  nodeAffinity:
    required:
      nodeSelectorTerms:
      - matchExpressions:
        - key: kubernetes.io/hostname
          operator: In
          values:
          - work4
```

3. 创建并查看pv资源

```bash
[root@tiaoban eck]# kubectl apply -f pv.yaml 
persistentvolume/es-hot-pv5 created
persistentvolume/es-hot-pv6 created
[root@tiaoban eck]# kubectl get pv
NAME            CAPACITY   ACCESS MODES   RECLAIM POLICY   STATUS      CLAIM                                              STORAGECLASS          REASON   AGE
es-cold-pv1     800Gi      RWO            Delete           Bound       elk/elasticsearch-data-elasticsearch-es-cold-0     local-storage                  2d21h
es-hot-pv1      100Gi      RWO            Delete           Bound       elk/elasticsearch-data-elasticsearch-es-hot2-1     local-storage                  2d21h
es-hot-pv2      100Gi      RWO            Delete           Bound       elk/elasticsearch-data-elasticsearch-es-hot1-1     local-storage                  2d21h
es-hot-pv3      100Gi      RWO            Delete           Bound       elk/elasticsearch-data-elasticsearch-es-hot1-0     local-storage                  2d21h
es-hot-pv4      100Gi      RWO            Delete           Bound       elk/elasticsearch-data-elasticsearch-es-hot2-0     local-storage                  2d21h
es-hot-pv5      100Gi      RWO            Delete           Available                                                      local-storage                  6s
es-hot-pv6      100Gi      RWO            Delete           Available                                                      local-storage                  6s
es-master-pv1   10Gi       RWO            Delete           Bound       elk/elasticsearch-data-elasticsearch-es-master-2   local-storage                  2d21h
es-master-pv2   10Gi       RWO            Delete           Bound       elk/elasticsearch-data-elasticsearch-es-master-0   local-storage                  2d21h
es-master-pv3   10Gi       RWO            Delete           Bound       elk/elasticsearch-data-elasticsearch-es-master-1   local-storage                  2d21h
es-warm-pv1     600Gi      RWO            Delete           Bound       elk/elasticsearch-data-elasticsearch-es-warm-0     local-storage                  2d21h
es-warm-pv2     600Gi      RWO            Delete           Bound       elk/elasticsearch-data-elasticsearch-es-warm-1     local-storage                  2d21h
```

4. 创建pvc资源

```bash
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: elasticsearch-data-elasticsearch-es-hot1-2
  namespace: elk
spec:
  accessModes:
  - ReadWriteOnce
  resources:
    requests:
      storage: 100Gi
  storageClassName: local-storage
  selector:
    matchLabels:
      app: es-hot-5
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: elasticsearch-data-elasticsearch-es-hot2-2
  namespace: elk
spec:
  accessModes:
  - ReadWriteOnce
  resources:
    requests:
      storage: 100Gi
  storageClassName: local-storage
  selector:
    matchLabels:
      app: es-hot-6
---
```

5. 创建pvc资源并验证

```bash
[root@tiaoban eck]# kubectl apply -f pvc.yaml 
persistentvolumeclaim/elasticsearch-data-elasticsearch-es-hot1-2 created
persistentvolumeclaim/elasticsearch-data-elasticsearch-es-hot2-2 created
[root@tiaoban eck]# kubectl get pvc -n elk
NAME                                           STATUS    VOLUME          CAPACITY   ACCESS MODES   STORAGECLASS    AGE
elasticsearch-data-elasticsearch-es-cold-0     Bound     es-cold-pv1     800Gi      RWO            local-storage   2d21h
elasticsearch-data-elasticsearch-es-hot1-0     Bound     es-hot-pv3      100Gi      RWO            local-storage   2d21h
elasticsearch-data-elasticsearch-es-hot1-1     Bound     es-hot-pv2      100Gi      RWO            local-storage   2d21h
elasticsearch-data-elasticsearch-es-hot1-2     Pending                                             local-storage   7s
elasticsearch-data-elasticsearch-es-hot2-0     Bound     es-hot-pv4      100Gi      RWO            local-storage   2d21h
elasticsearch-data-elasticsearch-es-hot2-1     Bound     es-hot-pv1      100Gi      RWO            local-storage   2d21h
elasticsearch-data-elasticsearch-es-hot2-2     Pending                                             local-storage   7s
elasticsearch-data-elasticsearch-es-master-0   Bound     es-master-pv2   10Gi       RWO            local-storage   2d21h
elasticsearch-data-elasticsearch-es-master-1   Bound     es-master-pv3   10Gi       RWO            local-storage   2d21h
elasticsearch-data-elasticsearch-es-master-2   Bound     es-master-pv1   10Gi       RWO            local-storage   2d21h
elasticsearch-data-elasticsearch-es-warm-0     Bound     es-warm-pv1     600Gi      RWO            local-storage   2d21h
elasticsearch-data-elasticsearch-es-warm-1     Bound     es-warm-pv2     600Gi      RWO            local-storage   2d21h
```

6. 修改Elasticsearch.yaml

```bash
  - name: hot2
    count: 3
```

7. 更新验证

```bash
[root@tiaoban eck]# kubectl apply -f elasticsearch.yaml 
elasticsearch.elasticsearch.k8s.elastic.co/elasticsearch configured
[root@tiaoban eck]# kubectl get pod -n elk -o wide
NAME                         READY   STATUS     RESTARTS   AGE     IP             NODE      NOMINATED NODE   READINESS GATES
elasticsearch-es-cold-0      1/1     Running    0          4h18s   10.244.4.247   work2     <none>           <none>
elasticsearch-es-hot1-0      1/1     Running    0          4h18s   10.244.1.113   master2   <none>           <none>
elasticsearch-es-hot1-1      1/1     Running    0          4h18s   10.244.0.133   master1   <none>           <none>
elasticsearch-es-hot1-2      0/1     Init:1/3   0          53s     10.244.6.4     work4     <none>           <none>
elasticsearch-es-hot2-0      1/1     Running    0          4h18s   10.244.1.114   master2   <none>           <none>
elasticsearch-es-hot2-1      1/1     Running    0          4h18s   10.244.0.132   master1   <none>           <none>
elasticsearch-es-hot2-2      0/1     Init:1/3   0          19s     10.244.6.5     work4     <none>           <none>
elasticsearch-es-master-0    1/1     Running    0          4h18s   10.244.4.246   work2     <none>           <none>
elasticsearch-es-master-1    1/1     Running    0          4h18s   10.244.3.197   work3     <none>           <none>
elasticsearch-es-master-2    1/1     Running    0          4h18s   10.244.5.238   work1     <none>           <none>
elasticsearch-es-warm-0      1/1     Running    0          4h18s   10.244.2.92    master3   <none>           <none>
elasticsearch-es-warm-1      1/1     Running    0          4h18s   10.244.5.239   work1     <none>           <none>
kibana-kb-7fd46b85c8-tfrdr   1/1     Running    0          4h18s   10.244.3.198   work3     <none>           <none>
```

观察发现，已经自动在work4节点上调度两个新的pod启动中，待pod状态为Running后查看集群状态

8. 检查集群节点状态

```bash
➜  curl -k https://elastic:CHANGE_ME@elasticsearch.local.com/_cat/nodes?v
ip           heap.percent ram.percent cpu load_1m load_5m load_15m node.role master name
10.244.4.117           32         100   9    1.11    0.73     0.63 crs       -      elasticsearch-es-cold-0
10.244.1.32            46          69   6    5.22    5.79     4.04 hrs       -      elasticsearch-es-hot2-0
10.244.4.118           75          99   5    1.11    0.73     0.63 imr       -      elasticsearch-es-master-1
10.244.1.35            63          69   9    5.22    5.79     4.04 hrs       -      elasticsearch-es-hot2-1
10.244.0.42            30          68  11    1.14    1.31     1.48 hrs       -      elasticsearch-es-hot1-0
10.244.3.93            72         100   6    1.02    0.79     0.60 imr       *      elasticsearch-es-master-2
10.244.0.43            38          67   8    1.14    1.31     1.48 hrs       -      elasticsearch-es-hot1-1
10.244.2.33            47          61   6    1.36    1.35     1.14 rsw       -      elasticsearch-es-warm-0
10.244.5.116           54         100   4    0.65    0.70     0.68 imr       -      elasticsearch-es-master-0
10.244.5.113           42          61   7    0.65    0.70     0.68 rsw       -      elasticsearch-es-warm-1
10.244.6.4             54          78   8    1.54    0.39     3.14 hrs       -      elasticsearch-es-hot1-2
10.244.6.5             25          45   7    1.42    0.45     4.24 hrs       -      elasticsearch-es-hot2-2
```

9. 修改组件模板shard设置，将原来的number_of_shards由4改为6个。所有自定义模板均继承该组件模板，就可以实现所有新建的索引为6分片，保证数据均匀分布到各个节点上面。组件模板可参考文档：[03-07_%E7%BB%84%E4%BB%B6%E6%A8%A1%E6%9D%BF%28component_templates%29.md](articles/01-ELK-Stack/03-07_组件模板-component_templates-.md)

![](assets/01-ELK-Stack/e1a76633d56d16ed09d2.png)

## 版本升级
1. 确定版本升级路线方案

ECK通常支持多个版本的ES，以目前2.9为例，支持的Elasticsearch版本为6.8+，Kibana版本为7.1+。只有当ECK不满足新的ELK组件版本时，才会考虑升级ECK。

要升级到哪个ES版本，我们就查看对应版本的升级操作文档，本案例以升级到最新8.9.1为例，官方文档参考地址：[https://www.elastic.co/guide/en/elastic-stack/8.9/upgrading-elastic-stack.html](https://www.elastic.co/guide/en/elastic-stack/8.9/upgrading-elastic-stack.html)

从官方文档可知，版本升级路线与操作如下：

+ 对于8.X的版本，可直接升级。
+ 对于7.X的版本，需要先升级到7.17.16，然后<font style="color:rgb(18, 18, 18);">借助reindex 方式，实现</font>再从7.17.16升级到8.9.1。
2. 备份集群数据

在升级操作前，建议做好集群快照，<font style="color:rgb(18, 18, 18);">以备不时之需</font>。

3. 禁用副本分片分配

```bash
PUT _cluster/settings
{
  "persistent": {
    "cluster.routing.allocation.enable": "primaries"
  }
}
```

4. 同步刷新

```bash
POST /_flush
```

5. 修改elasticsearch.yaml版本号

```yaml
apiVersion: elasticsearch.k8s.elastic.co/v1
kind: Elasticsearch
metadata:
  namespace: elk
  name: elasticsearch
spec:
  version: 8.9.1 # 由原来的8.9.0改为8.9.1
  image: harbor.local.com/elk/elasticsearch:8.9.1 # 修改镜像地址
```

6. 更新资源并验证

```yaml
[root@tiaoban eck]# kubectl apply -f elasticsearch.yaml 
elasticsearch.elasticsearch.k8s.elastic.co/elasticsearch configured
[root@tiaoban eck]# kubectl get pod -n elk
NAME                         READY   STATUS        RESTARTS      AGE
elasticsearch-es-cold-0      1/1     Terminating   1 (11m ago)   18h
elasticsearch-es-hot1-0      1/1     Running       1 (12m ago)   18h
elasticsearch-es-hot1-1      1/1     Running       1 (12m ago)   18h
elasticsearch-es-hot2-0      1/1     Running       1 (11m ago)   18h
elasticsearch-es-hot2-1      1/1     Running       1 (11m ago)   18h
elasticsearch-es-master-0    1/1     Running       1 (11m ago)   18h
elasticsearch-es-master-1    1/1     Running       1 (11m ago)   18h
elasticsearch-es-master-2    1/1     Running       1 (11m ago)   18h
elasticsearch-es-warm-0      1/1     Running       1 (11m ago)   18h
elasticsearch-es-warm-1      1/1     Running       1 (11m ago)   18h
kibana-kb-774cb85c58-qgg6p   1/1     Running       1 (11m ago)   18h
```

在ES版本升级过程中，ECK会将其中一个节点退出，然后创建新版本的pod，继续挂载先前的pv数据，直到这个节点加入集群后，才会继续退出下一个节点，滚动更新期间ES集群服务正常运行。

7. 查看各pod的es版本信息与集群状态

```bash
[root@master1 ~]# kubectl get pod -n elk -o wide | grep elasticsearch-es | awk '{ print $6 }' > /tmp/pod_ip.txt
[root@master1 ~]# for ip in `cat /tmp/pod_ip.txt`; do  echo $ip;  curl -k -s https://elastic:CHANGE_ME@$ip:9200 | grep number; done
10.244.4.15
    "number" : "8.9.1",
10.244.0.148
    "number" : "8.9.1",
10.244.0.147
    "number" : "8.9.1",
10.244.1.128
    "number" : "8.9.1",
10.244.1.127
    "number" : "8.9.1",
10.244.5.253
    "number" : "8.9.1",
10.244.4.16
    "number" : "8.9.1",
10.244.3.215
    "number" : "8.9.1",
10.244.2.101
    "number" : "8.9.1",
10.244.5.252
    "number" : "8.9.1",
[root@tiaoban ~]# curl -k https://elastic:CHANGE_ME@elasticsearch.local.com/_cluster/health
{"cluster_name":"elasticsearch","status":"green","timed_out":false,"number_of_nodes":12,"number_of_data_nodes":9,"active_primary_shards":23,"active_shards":47,"relocating_shards":0,"initializing_shards":0,"unassigned_shards":0,"delayed_unassigned_shards":0,"number_of_pending_tasks":0,"number_of_in_flight_fetch":0,"task_max_waiting_in_queue_millis":0,"active_shards_percent_as_number":100.0}
```

8. 开启分片分配

待所有节点均升级成功并加入集群后，开启分片分配

```bash
PUT _cluster/settings
{
  "persistent": {
    "cluster.routing.allocation.enable": null
  }
}
```

9. 修改kibana版本信息并更新资源

```yaml
apiVersion: kibana.k8s.elastic.co/v1
kind: Kibana
metadata:
  name: kibana
  namespace: elk
spec:
  version: 8.9.1 # 修改版本信息
  image: harbor.local.com/elk/kibana:8.9.1
[root@tiaoban eck]# kubectl apply -f kibana.yaml 
kibana.kibana.k8s.elastic.co/kibana configured
```

10. 访问验证

查看kibana信息，已从原来的8.9.0升级到了8.9.1

![](assets/01-ELK-Stack/9ea6fcf5ee25e930ae65.png)

# 完整资源清单
本实验案例所有yaml文件已上传至git仓库。访问地址如下：

## github
[https://github.com/cuiliang0302/blog-demo](https://github.com/cuiliang0302/blog-demo)

## gitee
[https://gitee.com/cuiliang0302/blog_demo](https://gitee.com/cuiliang0302/blog_demo)

# 参考文档
eck部署文档：[https://www.elastic.co/guide/en/cloud-on-k8s/current/k8s-deploy-eck.html](https://www.elastic.co/guide/en/cloud-on-k8s/current/k8s-deploy-eck.html)

es存储方案选型：[https://www.elastic.co/guide/en/cloud-on-k8s/current/k8s-storage-recommendations.html](https://www.elastic.co/guide/en/cloud-on-k8s/current/k8s-storage-recommendations.html)

Elasticsearch部署配置：[https://www.elastic.co/guide/en/cloud-on-k8s/current/k8s-elasticsearch-specification.html](https://www.elastic.co/guide/en/cloud-on-k8s/current/k8s-elasticsearch-specification.html)

es备份快照配置:[https://www.elastic.co/guide/en/cloud-on-k8s/current/k8s-snapshots.html](https://www.elastic.co/guide/en/cloud-on-k8s/current/k8s-snapshots.html)

es集群分片分配感知配置：[https://www.elastic.co/guide/en/cloud-on-k8s/current/k8s-advanced-node-scheduling.html](https://www.elastic.co/guide/en/cloud-on-k8s/current/k8s-advanced-node-scheduling.html)

eck常见问题处理：[https://www.elastic.co/guide/en/cloud-on-k8s/current/k8s-common-problems.html](https://www.elastic.co/guide/en/cloud-on-k8s/current/k8s-common-problems.html)

eck故障排查手册：[https://www.elastic.co/guide/en/cloud-on-k8s/current/k8s-troubleshooting-methods.html](https://www.elastic.co/guide/en/cloud-on-k8s/current/k8s-troubleshooting-methods.html)

eck升级操作手册：[https://www.elastic.co/guide/en/cloud-on-k8s/current/k8s-upgrading-eck.html](https://www.elastic.co/guide/en/cloud-on-k8s/current/k8s-upgrading-eck.html)

es集群重启操作指南：[https://www.elastic.co/guide/en/elasticsearch/reference/8.9/restart-cluster.html](https://www.elastic.co/guide/en/elasticsearch/reference/8.9/restart-cluster.html)

es集群版本升级指南：[https://www.elastic.co/guide/en/elastic-stack/8.9/upgrading-elastic-stack.html](https://www.elastic.co/guide/en/elastic-stack/8.9/upgrading-elastic-stack.html)


