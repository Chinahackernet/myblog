# 持久存储卷pv/pvc

> 分类：Kubernetes / 第9章：存储
> 原文：https://www.cuiliangblog.cn/detail/section/15282247
> 来源：崔亮的博客

---

# 概念
## PersistentVolume（PV）
是由管理员设置的存储，它是群集的一部分。它是对底层共享存储的抽象，将共享存储作为一种可由用户申请使用的资源。PV 是Volume 之类的卷插件，但具有独立于使用 PV 的 Pod的生命周期。PV是集群级别的资源，不属于任何名称空间

## pv与volume区别
+ PV只能是网络存储（区别于上述的hostPath本地存储），不属于任何Node，但可以在每个Node上访问。
+ PV并不是定义在Pod上的，而是独立于Pod之外定义。
+ PV的生命周期与Pod是独立的。

## PersistentVolumeClaim（PVC）
是用户存储的请求。它与 Pod 相似。Pod 消耗节点资源，PVC 消耗 PV 资源。Pod可以请求特定级别的资源（CPU和内存）。声明可以请求特定的大小和访问模式（例如，可以以读/写一次或只读多次模式挂载）

静态 pv：集群管理员创建一些 PV。它们带有可供群集用户使用的实际存储的细节。它们存在于Kubernetes API 中，可用于消费

动态pv：当管理员创建的静态 PV都不匹配用户的PersistentVolumeClaim时，集群可能会尝试动态地为 PVC创建卷。此配置基于StorageClasses：PVC 必须请求存储类，并且管理员必须创建并配置该类才能进行动态创建。声明该类为""可以有效地禁用其动态配置要启用基于存储级别的动态存储配置，集群管理员需要启用 API server上的DefaultStorageClass[准入控制器]。例如，通过确保DefaultStorageClass位于API server组件的--admission-control标志，使用逗号分隔的有序值列表中，可以完成此操作

## pv与pvc绑定
master 中的控制环路监视新的 PVC，寻找匹配的PV（如果可能），并将它们绑定在一起。如果为新的 PVC 动态调配PV，则该环路将始终将该 PV 绑定到PVC。否则，用户总会得到他们所请求的存储，但是容量可能超出要求的数量。一旦 PV和 PVC 绑定后，PersistentVolumeClaim绑定是排他性的，不管它们是如何绑定的。PVC 跟PV 绑定是一对一的映射

## 持久化卷声明的保护
PVC 保护的目的是确保由 pod 正在使用的 PVC不会从系统中移除，因为如果被移除的话可能会导致数据丢失当启用PVC 保护 alpha功能时，如果用户删除了一个 pod 正在使用的 PVC，则该 PVC 不会被立即删除。PVC的删除将被推迟，直到 PVC 不再被任何 pod 使用

## PVC、PV、StorageClass关系
![](assets/06-Kubernetes/f4e5e1c97db9cb340ef8.png)

+ PVC：Pod 想要使用的持久化存储的属性，比如存储的大小、读写权限等。
+ PV ：具体的 Volume 的属性，比如 Volume的类型、挂载目录、远程存储服务器地址等。
+ StorageClass：充当 PV 的模板。并且，只有同属于一个 StorageClass 的 PV 和PVC，才可以绑定在一起。当然，StorageClass 的另一个重要作用，是指定 PV 的Provisioner（存储插件）。这时候，如果你的存储插件支持 Dynamic Provisioning的话，Kubernetes 就可以自动为你创建 PV 了。

# 创建PV
## PV容量(capacity)
设定当前PV的容量，单位为Gi、Mi

## 访问模式(accessModes)
PersistentVolume可以以资源提供者支持的任何方式挂载到主机上。每个PV的访问模式都将被设置为该卷支持的特定模式。



| Volume Plugin | ReadWriteOnce | ReadOnlyMany | ReadWriteMany |
| --- | --- | --- | --- |
| AWSElasticBlockStore | ✓ | - | - |
| AzureFile | ✓ | ✓ | ✓ |
| AzureDisk | ✓ | - | - |
| CephFS | ✓ | ✓ | ✓ |
| Cinder | ✓ | - | - |
| CSI | depends on the driver | depends on the driver | depends on the driver |
| FC | ✓ | ✓ | - |
| FlexVolume | ✓ | ✓ | depends on the driver |
| Flocker | ✓ | - | - |
| GCEPersistentDisk | ✓ | ✓ | - |
| Glusterfs | ✓ | ✓ | ✓ |
| HostPath | ✓ | - | - |
| iSCSI | ✓ | ✓ | - |
| Quobyte | ✓ | ✓ | ✓ |
| NFS | ✓ | ✓ | ✓ |
| RBD | ✓ | ✓ | - |
| VsphereVolume | ✓ | - | - (works when Pods are collocated) |
| PortworxVolume | ✓ | - | ✓ |
| ScaleIO | ✓ | ✓ | - |
| StorageOS | ✓ | - | - |


+ ReadWriteOnce：该卷可以被单个节点以读/写模式挂载
+ ReadOnlyMany：该卷可以被多个节点以只读模式挂载
+ ReadWriteMany：该卷可以被多个节点以读/写模式挂载

在命令行中，访问模式缩写为：

+ RWO：ReadWriteOnce
+ ROX ：ReadOnlyMany
+ RWX：ReadWriteMany

## 回收策略(persistentVolumeReclaimPolicy)
+ Retain（保留）：管理员手动回收
+ Recycle（回收）：基本擦除（rm -rf /thevolume/*），目前仅NFS和hostPath支持此操作。
+ Delete（删除）：关联的存储资产（例如 AWS EBS、GCE PD、Azure Disk 和OpenStack Cinder 卷）将被删除

## storageClassName
当前PV所属的StorageClass的名称；pvc与pv绑定时根据此name值匹配

## 卷可以处于以下的某种状态：
+ Available（可用）：块空闲资源还没有被任何声明绑定
+ Bound（已绑定）：卷已经被声明绑定
+ Released（已释放）：声明被删除，但是资源还未被集群重新声明
+ Failed（失败）：该卷的自动回收失败命令行会显示绑定到 PV 的 PVC 的名称

## 示例
+ 定义了一个使用NFS存储后端的PV，空间大小为10GB，支持多路的读写操作。

![](assets/06-Kubernetes/2bc5b4913047e5bb38ed.png)

+ 查看创建的pv信息

![](assets/06-Kubernetes/906f15a58148f525907b.png)

# 创建pvc
## 简介
1. PersistentVolumeClaim是存储卷类型的资源，它通过申请占用某个PersistentVolume而创建，它与PV是一对一的关系，用户无须关心其底层实现细节。申请时，用户只需要指定目标空间的大小、访问模式、PV标签选择器和StorageClass等相关信息即可。
2. PVC的Spec字段的可嵌套字段具体如下。
+ accessMode：当前PVC的访问模式，其可用模式与PV相同。
+ resources：当前PVC存储卷需要占用的资源量最小值
+ selector：绑定时对PV应用的标签选择器（matchLabels）或匹配条件表达式（matchEx-pressions），用于挑选要绑定的PV；如果同时指定了两种挑选机制，则必须同时满足两种选择机制的PV才能被选出。
+ storageClassName：所依赖的存储类的名称。
+ volumeName：用于直接指定要绑定的PV的卷名。

## 示例
+ 安装nfs服务器

```bash
# 安装nfs服务
dnf install -y nfs-utils
systemctl start nfs-server
systemctl enable nfs-server
# 创建目录授权
mkdir -p /data/nfs
chmod 666 /data/nfs
chown nfsnobody /data/nfs
# 导出文件系统
cat /etc/exports
/data/nfs *(rw,no_root_squash,no_all_squash,sync)
# 查看验证
# exportfs -rv
exporting *:/data/nfs
```

+ 客户端测试

`<font style="color:rgb(51, 51, 51);">yum install nfs-utils</font>`  
`showmount -e 192.168.8.100`   
`mount -t nfs 192.168.8.100:/data/nfs /mnt` 

+ 创建pvc资源清单，绑定release为stable且storageClassName为slow的pv

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: pvc-nfs
spec:
  accessModes:
    - ReadWriteMany
  volumeMode: Filesystem
  resources:
    requests:
      storage: 5Gi
  storageClassName: slow
  selector:
    matchLabels:
      release: "stable"
```

+ 查看pvc详细信息

![](assets/06-Kubernetes/ce38b50dd92c61285002.png)

# pod中使用pvc
## 创建说明
创建pvc时，如果使用nfs存储，storageClassName默认是nfs-client

在Pod资源中调用PVC资源，只需要在定义volumes时使用persistentVolumeClaims字段嵌套指定两个字段即可，具体如下。

+ claimName：要调用的PVC存储卷的名称，PVC卷要与Pod在同一名称空间中。
+ readOnly：是否将存储卷强制挂载为只读模式，默认为false。

## 示例
具体参考文档：[03-09_%E9%83%A8%E7%BD%B2NFS%E5%85%B1%E4%BA%AB%E6%96%87%E4%BB%B6%E5%AD%98%E5%82%A8.md](articles/06-Kubernetes/03-09_部署NFS共享文件存储.md)

# statefulset使用pvc
## 创建说明
statefulset可以使用volumeClaimTemplates直接指定pvc，其可以帮助我们自动创建pvc,不需要我们手动定义pvc

## 示例
资源清单如下所示：

```yaml
apiVersion: v1
kind: Service
metadata:
  name: nginx
  labels:
    app: nginx
spec:
  ports:
  - port: 80
    name: web
  clusterIP: None
  selector:
    app: nginx
---
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: web
spec:
  selector:
    matchLabels:
      app: nginx
  serviceName: nginx
  replicas: 3
  template:
    metadata:
      labels:
        app: nginx
    spec:
      terminationGracePeriodSeconds: 10
      containers:
      - name: nginx
        image: harbor.local.com/app/myapp:v1
        ports:
        - containerPort: 80
          name: web
        volumeMounts:
        - name: www
          mountPath: /usr/share/nginx/html
  volumeClaimTemplates:
  - metadata:
      name: www
    spec:
      accessModes: [ "ReadWriteOnce" ]
      storageClassName: "nfs-client"
      resources:
        requests:
          storage: 1Gi
```

创建资源并查看

```bash
[root@tiaoban ~]# kubectl apply -f test.yaml
service/nginx created
statefulset.apps/web created
[root@tiaoban ~]# kubectl get pod 
NAME         READY   STATUS    RESTARTS       AGE
rockylinux   1/1     Running   20 (35m ago)   20d
web-0        1/1     Running   0              34s
web-1        1/1     Running   0              29s
web-2        1/1     Running   0              25s
[root@tiaoban ~]# kubectl get pvc 
NAME        STATUS   VOLUME                                     CAPACITY   ACCESS MODES   STORAGECLASS   AGE
www-web-0   Bound    pvc-5c1c35e1-84b7-4845-bc82-55e5cae9dd60   1Gi        RWO            nfs-client     41s
www-web-1   Bound    pvc-0fad5855-e349-4967-a182-1456de5c619a   1Gi        RWO            nfs-client     36s
www-web-2   Bound    pvc-6d03354a-094b-436e-b69f-f2257e66d9a4   1Gi        RWO            nfs-client     32s
[root@tiaoban ~]# kubectl get pv | grep web
pvc-0fad5855-e349-4967-a182-1456de5c619a   1Gi        RWO            Delete           Bound    default/www-web-1                                  nfs-client                     45s
pvc-5c1c35e1-84b7-4845-bc82-55e5cae9dd60   1Gi        RWO            Delete           Bound    default/www-web-0                                  nfs-client                     50s
pvc-6d03354a-094b-436e-b69f-f2257e66d9a4   1Gi        RWO            Delete           Bound    default/www-web-2                                  nfs-client                     41s
```

# PV和PVC的生命周期


1. 存储供给  
存储供给（Provisioning）是指为PVC准备可用PV的机制。Kubernetes支持静态供给和动态供给。
+ 静态供给  
静态供给是指由集群管理员手动创建一定数量的PV的资源供应方式。这些PV负责处理存储系统的细节，并将其抽象成易用的存储资源供用户使用。
+ 动态供给  
不存在某静态的PV匹配到用户的PVC申请时，Kubernetes集群会尝试为PVC动态创建符合需求的PV，此即为动态供给。这种方式依赖于存储类的辅助，PVC必须向一个事先存在的存储类发起动态分配PV的请求，没有指定存储类的PVC请求会被禁止使用动态创建PV的方式。另外，为了支持使用动态供给机制，集群管理员需要为准入控制器（admission controller）启用“DefaultStorageClass”选项
2. 存储绑定  
用户基于一系列存储需求和访问模式定义好PVC后，Kubernetes系统的控制器即会为其查找匹配的PV，并于找到之后在此二者之间建立起关联关系，而后它们二者之间的状态即转为“绑定”（Binding）。若PV是为PVC而动态创建的，则该PV专用于其PVC。  
若是无法为PVC找到可匹配的PV，则PVC将一直处于未绑定（unbound）状态，直到有符合条件的PV出现并完成绑定方才可用。
+ 存储使用（Using）  
Pod资源基于persistenVolumeClaim卷类型的定义，将选定的PVC关联为存储卷，而后即可为内部的容器所使用。对于支持多种访问模式的存储卷来说，用户需要额外指定要使用的模式。一旦完成将存储卷挂载至Pod对象内的容器中，其应用即可使用关联的PV提供的存储空间。
+ PVC保护（Protection）  
为了避免使用中的存储卷被移除而导致数据丢失，Kubernetes自1.9版本起引入了“PVC保护机制”。启用了此特性后，万一有用户删除了仍处于某Pod资源使用中的PVC时，Kubernetes不会立即予以移除，而是推迟到不再被任何Pod资源使用后方才执行删除操作。处于此种阶段的PVC资源的status字段为“Termination”，并且其Finalizers字段中包含“kubernetes.io/pvc-protection”。
3. 存储回收（Reclaiming）  
完成存储卷的使用目标之后，即可删除PVC对象以便进行资源回收。不过，至于如何操作则取决于PV的回收策略。目前，可用的回收策略有三种：Retained、Recycled和Deleted。
+ 留存（Retain）  
留存策略意味着在删除PVC之后，Kubernetes系统不会自动删除PV，而仅仅是将它置于“释放”（released）状态。不过，此种状态的PV尚且不能被其他PVC申请所绑定，因为此前的申请生成的数据仍然存在，需要由管理员手动决定其后续处理方案。这就意味着，如果想要再次使用此类的PV资源，则需要由管理员按下面的步骤手动执行删除操作。  
1）删除PV，这之后，此PV的数据依然留存于外部的存储之上。  
2）手工清理存储系统上依然留存的数据。  
3）手工删除存储系统级的存储卷（例如，RBD存储系统上的image）以释放空间，以便再次创建，或者直接将其重新创建为PV。
+ 回收（Recycle）  
如果可被底层存储插件支持，资源回收策略会在存储卷上执行数据删除操作并让PV资源再次变为可被Claim。另外，管理员也可以配置一个自定义的回收器Pod模板，以便执行自定义的回收操作。不过，此种回收策略行将废弃。
+ 删除（Delete）  
对于支持Deleted回收策略的存储插件来说，在PVC被删除后会直接移除PV对象，同时移除的还有PV相关的外部存储系统上的存储资产（asset）。支持这种操作的存储系统有AWS  
EBS、GCE PD、Azure  
Disk或Cinder。动态创建的PV资源的回收策略取决于相关存储类上的定义，存储类上相关的默认策略为Delete，大多数情况下，管理员都需要按用户期望的处理机制修改此默认策略，以免导致数据非计划内的误删除。
4. 扩展PVC  
Kubernetes自1.8版本起增加了扩展PV空间的特性，截至目前，它所支持的扩展PVC机制的存储卷共有以下几种。
+ gcePersistentDisk
+ awsElasticBlockStore
+ Cinder
+ glusterfs
+ rbd  
“PersistentVolumeClaimResize”准入插件负责对支持空间大小变动的存储卷执行更多的验证操作，管理员需要事先启用此插件才能使用PVC扩展机制，那些将“allowVolume  
Expansion”字段的值设置为“true”的存储类即可动态扩展存储卷空间。随后，用户改动Claim请求更大的空间即能触发底层PV空间扩展从而带来PVC存储卷的扩展。  
对于包含文件系统的存储卷来说，只有在有新的Pod资源基于读写模式开始使用PVC时才会执行文件系统的大小调整操作。换句话说，如果某被扩展的存储卷已经由Pod资源所使用，则需要重建此Pod对象才能触发文件系统大小的调整操作。支持空间调整的文件系统仅有XFS和EXT3/EXT4。


