# 本地持久化存储local pv

> 分类：Kubernetes / 第9章：存储
> 原文：https://www.cuiliangblog.cn/detail/section/53049890
> 来源：崔亮的博客

---

# local PV简介
## hostPath存在的问题
过去我们经常会通过hostPath volume让Pod能够使用本地存储，将Node文件系统中的文件或者目录挂载到容器内，但是hostPath volume的使用是很难受的，并不适合在生产环境中使用。

+ 由于集群内每个节点的差异化，要使用hostPath Volume，我们需要通过NodeSelector等方式进行精确调度，这种事情多了，你就会不耐烦了。
+ 注意DirectoryOrCreate和FileOrCreate两种类型的hostPath，当Node上没有对应的File/Directory时，你需要保证kubelet有在 Node上Create File/Directory的权限。
+ 另外，如果Node上的文件或目录是由root创建的，挂载到容器内之后，你通常还要保证容器内进程有权限对该文件或者目录进行写入，比如你需要以root用户启动进程并运行于privileged容器，或者你需要事先修改好Node上的文件权限配置。
+ Scheduler并不会考虑hostPath volume的大小，hostPath也不能申明需要的storagesize，这样调度时存储的考虑，就需要人为检查并保证。

k8s v1.10+以上的版本中推出local pv方案。Local volume 允许用户通过标准 PVC 接口以简单且可移植的方式访问 node 节点的本地存储。 PV 的定义中需要包含描述节点亲和性的信息，k8s 系统则使用该信息将容器调度到正确的 node 节点。

## Local PV 使用场景


Local Persistent Volume 并不适用于所有应用。它的适用范围非常固定，比如：高优先级的系统应用，需要在多个不同节点上存储数据，而且对 I/O 要求较高。Kubernetes 直接使用宿主机的本地磁盘目录 ，来持久化存储容器的数据。它的读写性能相比于大多数远程存储来说，要好得多，尤其是 SSD 盘。



典型的应用包括：分布式数据存储比如 MongoDB，分布式文件系统比如 GlusterFS、Ceph 等，以及需要在本地磁盘上进行大量数据缓存的分布式应用，其次使用 Local Persistent Volume 的应用必须具备数据备份和恢复的能力，允许你把这些数据定时备份在其他位置。

## Local PV 的实现


LocalPV 的实现可以理解为我们前面使用的`hostpath`加上`nodeAffinity`，比如：在宿主机 NodeA 上提前创建好目录 ，然后在定义 Pod 时添加`nodeAffinity=NodeA`，指定 Pod 在我们提前创建好目录的主机上运行。但是我们绝不应该把一个宿主机上的目录当作 PV 使用，因为本地目录的磁盘随时都可能被应用写满，甚至造成整个宿主机宕机。而且，不同的本地目录之间也缺乏哪怕最基础的 I/O 隔离机制。所以，一个 Local Persistent Volume 对应的存储介质，一定是一块额外挂载在宿主机的磁盘或者块设备（“额外” 的意思是，它不应该是宿主机根目录所使用的主硬盘）。这个原则，我们可以称为 “一个 PV 一块盘”。

## Local PV 和常规 PV 的区别


对于常规的 PV，Kubernetes 都是先调度 Pod 到某个节点上，然后再持久化” 这台机器上的 Volume 目录。而 Local PV，则需要运维人员提前准备好节点的磁盘。它们在不同节点上的挂载情况可以完全不同，甚至有的节点可以没这种磁盘。所以调度器就必须能够知道所有节点与 Local Persistent Volume 对应的磁盘的关联关系，然后根据这个信息来调度 Pod。也就是在调度的时候考虑 Volume 分布。

# 创建local PV
## 创建数据目录
创建 Local PV 其实应该给宿主机挂载并格式化一个可用的磁盘，这里我们就在宿主机上挂载几个 RAM Disk（内存盘）来模拟本地磁盘。



```plain
$ mkdir /mnt/disks
```



如果希望其他节点也能支持 Local Persistent Volume 的话，那就需要为它们也执行上述操作，可以创建多个目录供pv挂载。

## 创建StorageClass


```yaml
kind: StorageClass
apiVersion: storage.k8s.io/v1
metadata:
  name: local-storage
provisioner: kubernetes.io/no-provisioner
volumeBindingMode: WaitForFirstConsumer
```

provisioner 字段定义为 no-provisioner，这是因为 Local Persistent Volume 目前尚不支持 Dynamic Provisioning 动态生成 PV，所以我们需要提前手动创建 PV。

volumeBindingMode 字段定义为 WaitForFirstConsumer，它是 Local Persistent Volume 里一个非常重要的特性，即：延迟绑定。延迟绑定就是在我们提交 PVC 文件时，StorageClass 为我们延迟绑定 PV 与 PVC 的对应关系。

这样做的原因是：比如我们在当前集群上有两个相同属性的 PV，它们分布在不同的节点 Node1 和 Node2 上，而我们定义的 Pod 需要运行在 Node1 节点上 ，但是 StorageClass 已经为 Pod 声明的 PVC 绑定了在 Node2 上的 PV，这样的话，Pod 调度就会失败，所以我们要延迟 StorageClass 的绑定操作。

也就是延迟到到第一个声明使用该 PVC 的 Pod 出现在调度器之后，调度器再综合考虑所有的调度规则，当然也包括每个 PV 所在的节点位置，来统一决定，这个 Pod 声明的 PVC，到底应该跟哪个 PV 进行绑定。

比如上面的 Pod 需要运行在 node1 节点上，StorageClass 发现可以绑定的 PV 后，先不为 Pod 中的 PVC 绑定 PV，而是等到 Pod 调度到 node1 节点后，再为 PVC 绑定当前节点运行的 PV。

所以，通过这个延迟绑定机制，原本实时发生的 PVC 和 PV 的绑定过程，就被延迟到了 Pod 第一次调度的时候在调度器中进行，从而保证了这个绑定结果不会影响 Pod 的正常调度。

现在我们创建 StoragClass

```plain
$ kubectl  create -f localpv-storageclass.yaml 
storageclass.storage.k8s.io/local-storage created
```

## 创建PV资源
我们创建4个pv资源，位于work1和work2节点上各两个，pv分布详情如下

| pv名称 | 所在主机 | 大小 | 路径 |
| --- | --- | --- | --- |
| local-pv1 | work1 | 10Gi | /mnt/data1 |
| local-pv2 | work1 | 10Gi | /mnt/data2 |
| local-pv3 | work2 | 50Gi | /mnt/data1 |
| local-pv4 | work2 | 50Gi | /mnt/data2 |




```yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: local-pv1
  labels:
    pv: local-pv1
spec:
  capacity:
    storage: 10Gi
  volumeMode: Filesystem
  accessModes:
  - ReadWriteOnce
  persistentVolumeReclaimPolicy: Delete
  storageClassName: local-storage
  local:
    path: /mnt/data1
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
  name: local-pv2
  labels:
    pv: local-pv2
spec:
  capacity:
    storage: 50Gi
  volumeMode: Filesystem
  accessModes:
  - ReadWriteOnce
  persistentVolumeReclaimPolicy: Delete
  storageClassName: local-storage
  local:
    path: /mnt/data2
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
  name: local-pv3
  labels:
    pv: local-pv3
spec:
  capacity:
    storage: 10Gi
  volumeMode: Filesystem
  accessModes:
  - ReadWriteOnce
  persistentVolumeReclaimPolicy: Delete
  storageClassName: local-storage
  local:
    path: /mnt/data1
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
  name: local-pv4
  labels:
    pv: local-pv4
spec:
  capacity:
    storage: 50Gi
  volumeMode: Filesystem
  accessModes:
  - ReadWriteOnce
  persistentVolumeReclaimPolicy: Delete
  storageClassName: local-storage
  local:
    path: /mnt/data2
  nodeAffinity:
    required:
      nodeSelectorTerms:
      - matchExpressions:
        - key: kubernetes.io/hostname
          operator: In
          values:
          - work2
```



上面定义的 local 字段，指定了它是一个 Local Persistent Volume；而 path 字段，指定的正是这个 PV 对应的本地磁盘的路径，即：/mnt/data。而这个磁盘存在于指定的节点上，也就意味着 Pod 使用这个 PV 就必须运行在指定的上。所以 nodeAffinity 字段就指定节点的名字，声明 PV 与节点的对应关系。这正是 Kubernetes 实现 “在调度的时候就考虑 Volume 分布” 的主要方法。

+ 创建PV

```bash
[root@tiaoban test]# kubectl apply -f pv.yaml 
persistentvolume/local-pv1 created
persistentvolume/local-pv2 created
persistentvolume/local-pv3 created
persistentvolume/local-pv4 created
[root@tiaoban test]# kubectl get pv
NAME         CAPACITY   ACCESS MODES   RECLAIM POLICY   STATUS      CLAIM                STORAGECLASS          REASON   AGE
local-pv1    10Gi       RWO            Delete           Available                        local-storage                  16s
local-pv2    50Gi       RWO            Delete           Available                        local-storage                  16s
local-pv3    10Gi       RWO            Delete           Available                        local-storage                  16s
local-pv4    50Gi       RWO            Delete           Available                        local-storage                  16s
```

# 使用local pv
## Pod通过pvc使用
+ 创建pvc

```yaml
kind: PersistentVolumeClaim
apiVersion: v1
metadata:
  name: local-pvc
spec:
  accessModes:
  - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
  storageClassName: local-storage
  selector: # 指定使用local-pv3
    matchLabels:
      pv: local-pv3
```

+ 查看pvc

```bash
[root@tiaoban test]# kubectl apply -f pod-pvc.yaml 
persistentvolumeclaim/local-pvc created
[root@tiaoban test]# kubectl get pvc
NAME        STATUS    VOLUME   CAPACITY   ACCESS MODES   STORAGECLASS    AGE
local-pvc   Pending                                      local-storage   3s
[root@tiaoban test]# kubectl get pv
NAME         CAPACITY   ACCESS MODES   RECLAIM POLICY   STATUS      CLAIM                STORAGECLASS          REASON   AGE
local-pv1    10Gi       RWO            Delete           Available                        local-storage                  91s
local-pv2    50Gi       RWO            Delete           Available                        local-storage                  91s
local-pv3    10Gi       RWO            Delete           Available                        local-storage                  91s
local-pv4    50Gi       RWO            Delete           Available                        local-storage                  91s
```

<font style="color:rgb(48, 49, 51);">可以看到当前 PVC 的状态为 Pending，PV 与 PVC 也没有建立绑定关系。</font>

+ <font style="color:rgb(48, 49, 51);">创建pod</font>

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: nginx
spec:
  containers:
  - name: nginx
    image: harbor.local.com/app/nginx-slim:0.8
    resources:
      limits:
        memory: "128Mi"
        cpu: "500m"
    ports:
      - containerPort: 80
    volumeMounts:
      - name: www
        mountPath: /usr/share/nginx/html
  volumes:
    - name: www
      persistentVolumeClaim:
        claimName: local-pvc

```

+ 查看资源

```bash
[root@tiaoban test]# kubectl apply -f nginx-pod.yaml 
pod/nginx created
[root@tiaoban test]# kubectl get pod -o wide
NAME    READY   STATUS    RESTARTS   AGE   IP            NODE    NOMINATED NODE   READINESS GATES
nginx   1/1     Running   0          4s    10.244.4.73   work2   <none>           <none>
[root@tiaoban test]# kubectl get pvc
NAME        STATUS   VOLUME      CAPACITY   ACCESS MODES   STORAGECLASS    AGE
local-pvc   Bound    local-pv3   10Gi       RWO            local-storage   108s
[root@tiaoban test]# kubectl get pv
NAME         CAPACITY   ACCESS MODES   RECLAIM POLICY   STATUS      CLAIM                STORAGECLASS          REASON   AGE
local-pv1    10Gi       RWO            Delete           Available                        local-storage                  3m15s
local-pv2    50Gi       RWO            Delete           Available                        local-storage                  3m15s
local-pv3    10Gi       RWO            Delete           Bound       default/local-pvc    local-storage                  3m15s
local-pv4    50Gi       RWO            Delete           Available                        local-storage                  3m15s
```

可以看到pod已成功调度至work2节点，因为指定使用local-pvc资源，而local-pvc资源绑定到了local-pv3，local-pv3就位于work2节点上。

## StatefulSet通过pvc使用
+ 创建pvc

创建的时候注意pvc的名字的构成：pvc的名字 = volume_name-statefulset_name-序号

例如<font style="color:rgb(36, 41, 46);">挂载名称为www，statefulset名称为nginx，副本数为2。创建的pvc资源名分别是www-nginx-0、www-nginx-1</font>

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: www-nginx-0
spec:
  accessModes:
  - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
  storageClassName: local-storage
  selector:
    matchLabels:
      pv: local-pv1
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: www-nginx-1
spec:
  accessModes:
  - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
  storageClassName: local-storage
  selector:
    matchLabels:
      pv: local-pv3
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: log-nginx-0
spec:
  accessModes:
  - ReadWriteOnce
  resources:
    requests:
      storage: 50Gi
  storageClassName: local-storage
  selector:
    matchLabels:
      pv: local-pv2
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: log-nginx-1
spec:
  accessModes:
  - ReadWriteOnce
  resources:
    requests:
      storage: 50Gi
  storageClassName: local-storage
  selector:
    matchLabels:
      pv: local-pv4
```

+ 创建资源

```bash
[root@tiaoban test]# kubectl apply -f pvc.yaml 
persistentvolumeclaim/local-pvc-1 created
persistentvolumeclaim/local-pvc-2 created
persistentvolumeclaim/local-pvc-3 created
persistentvolumeclaim/local-pvc-4 created
[root@tiaoban test]# kubectl get pvc 
NAME          STATUS    VOLUME                                     CAPACITY   ACCESS MODES   STORAGECLASS    AGE
local-pvc-1   Pending                                                                        local-storage   13s
local-pvc-2   Pending                                                                        local-storage   13s
local-pvc-3   Pending                                                                        local-storage   13s
local-pvc-4   Pending                                                                        local-storage   13s
```

可以看到当前 PVC 的状态为 Pending，PV 与 PVC 也没有建立绑定关系。

+ 创建statefulset资源

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
  name: nginx
spec:
  selector:
    matchLabels:
      app: myapp
  serviceName: nginx
  replicas: 2
  template:
    metadata:
      labels:
        app: myapp
    spec:
      containers:
      - name: myapp
        image: harbor.local.com/app/nginx-slim:0.8
        ports:
        - containerPort: 80
          name: web
        volumeMounts:
        - name: www
          mountPath: /usr/share/nginx/html
        - name: log
          mountPath: /var/log/nginx
  volumeClaimTemplates:
  - metadata:
      name: www
    spec:
      accessModes: [ "ReadWriteOnce" ]
      storageClassName: "local-storage"
      resources:
        requests:
          storage: 10Gi
  - metadata:
      name: log
    spec:
      accessModes: [ "ReadWriteOnce" ]
      storageClassName: "local-storage"
      resources:
        requests:
          storage: 50Gi
```

+ 创建并查看资源信息

```bash
[root@tiaoban test]# kubectl apply -f nginx.yaml 
service/nginx created
statefulset.apps/nginx created
[root@tiaoban test]# kubectl get pod -o wide
NAME      READY   STATUS    RESTARTS   AGE   IP            NODE    NOMINATED NODE   READINESS GATES
nginx-0   1/1     Running   0          6s    10.244.5.77   work1   <none>           <none>
nginx-1   1/1     Running   0          4s    10.244.4.74   work2   <none>           <none>
[root@tiaoban test]# kubectl get pvc
NAME          STATUS   VOLUME      CAPACITY   ACCESS MODES   STORAGECLASS    AGE
log-nginx-0   Bound    local-pv2   50Gi       RWO            local-storage   27s
log-nginx-1   Bound    local-pv4   50Gi       RWO            local-storage   27s
www-nginx-0   Bound    local-pv1   10Gi       RWO            local-storage   27s
www-nginx-1   Bound    local-pv3   10Gi       RWO            local-storage   27s
[root@tiaoban test]# kubectl get pv
NAME         CAPACITY   ACCESS MODES   RECLAIM POLICY   STATUS   CLAIM                 STORAGECLASS          REASON   AGE
local-pv1    10Gi       RWO            Delete           Bound    default/www-nginx-0   local-storage                  114s
local-pv2    50Gi       RWO            Delete           Bound    default/log-nginx-0   local-storage                  114s
local-pv3    10Gi       RWO            Delete           Bound    default/www-nginx-1   local-storage                  114s
local-pv4    50Gi       RWO            Delete           Bound    default/log-nginx-1   local-storage                  114s
```

可以看到 Pod 分别调度在work1和work2节点并成功运行后，PVC 和 PV 的状态已经 Bound 绑定。

# 验证
## 验证pod与pv节点绑定
+ 查看资源信息，nginx-0调度至work1节点，nginx-1调度至work2节点。

```bash
[root@tiaoban test]# kubectl get pod -o wide
NAME      READY   STATUS    RESTARTS   AGE     IP            NODE    NOMINATED NODE   READINESS GATES
nginx-0   1/1     Running   0          4m38s   10.244.5.77   work1   <none>           <none>
nginx-1   1/1     Running   0          4m36s   10.244.4.74   work2   <none>           <none>
[root@tiaoban test]# kubectl get pvc
NAME          STATUS   VOLUME      CAPACITY   ACCESS MODES   STORAGECLASS    AGE
log-nginx-0   Bound    local-pv2   50Gi       RWO            local-storage   5m6s
log-nginx-1   Bound    local-pv4   50Gi       RWO            local-storage   5m6s
www-nginx-0   Bound    local-pv1   10Gi       RWO            local-storage   5m6s
www-nginx-1   Bound    local-pv3   10Gi       RWO            local-storage   5m6s
```

+ 删除pod，让k8s重新调度，看是否能和之前一样调度至原来的节点

```bash
[root@tiaoban test]# kubectl delete pod `kubectl get pod | grep nginx | awk '{ print $1 }'`
pod "nginx-0" deleted
pod "nginx-1" deleted
[root@tiaoban test]# kubectl get pod -o wide
NAME      READY   STATUS    RESTARTS   AGE   IP            NODE    NOMINATED NODE   READINESS GATES
nginx-0   1/1     Running   0          4s    10.244.5.79   work1   <none>           <none>
nginx-1   1/1     Running   0          2s    10.244.4.76   work2   <none>           <none>
```

多次删除后发现pod依然可以调度至先前的节点。

## 验证文件持久化
现在验证文件是否可以持久化存储，进入当前这个 Pod 的挂载目录新建一个测试文件

```bash
[root@tiaoban test]# kubectl exec -it nginx-0 -- bash
root@nginx-0:/# cd /usr/share/nginx/html/
root@nginx-0:/usr/share/nginx/html# echo "hello" > test.html
root@nginx-0:/usr/share/nginx/html# cat test.html 
hello
```

在work1的挂载目录上查看是否创建

```bash
[root@work1 ~]# cd /mnt/data1/
[root@work1 data1]# ls
test.html
[root@work1 data1]# cat test.html 
hello
```

现在我们删除或者重建这个 Pod，进入容器验证文件是否存在

```bash
[root@tiaoban test]# kubectl delete pod nginx-0 
pod "nginx-0" deleted
[root@tiaoban test]# kubectl exec -it nginx-0 -- bash
root@nginx-0:/# cd /usr/share/nginx/html/
root@nginx-0:/usr/share/nginx/html# ls
test.html
root@nginx-0:/usr/share/nginx/html# cat test.html 
hello
```

可以看到文件是依旧存在的，这也说明，像 Kubernetes 这样构建出来的、基于本地存储的 Volume，完全可以提供容器持久化存储的功能。所以，像 StatefulSet 这样的有状态编排工具，也完全可以通过声明 Local 类型的 PV 和 PVC，来管理应用的存储状态。

# 删除local PV
需要注意的是，我们上面手动创建 PV 的方式，在删除 PV 时需要按如下流程执行操作：



+ 删除使用这个 PV 的 Pod；
+ 从宿主机移除本地磁盘（比如，umount 它）；
+ 删除 PVC；
+ 删除 PV。

如果不按照这个流程的话，这个 PV 的删除就会失败。


