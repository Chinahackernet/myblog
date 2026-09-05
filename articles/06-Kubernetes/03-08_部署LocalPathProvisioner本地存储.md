# 部署LocalPathProvisioner本地存储

> 分类：Kubernetes / 第3章：周边组件安装部署
> 原文：https://www.cuiliangblog.cn/detail/section/231691272
> 来源：崔亮的博客

---

# 介绍
## 什么是 Local Path Provisioner
Local Path Provisioner 是由 Rancher 开源的 Kubernetes 动态存储卷供应器，专门为 Kubernetes 用户提供本地存储解决方案。

它基于 Kubernetes 的 Local Persistent Volume 特性，但提供了比内置本地卷功能更简单的解决方案。

Local Persistent Volume 基于节点亲和性（Node Affinity）机制和 Kubernetes 调度器的感知能力，确保使用本地存储的 Pod 始终调度到存储所在的特定节点，从而实现本地磁盘的持久化访问。

## 核心特性
动态供应：自动创建基于 hostPath 或 local 的持久卷

简化配置：相比 Kubernetes 内置的 Local Volume provisioner 更易配置

节点本地存储：充分利用每个节点的本地存储资源

自动清理：Pod 删除后自动清理存储数据

## 适用场景
开发测试环境：快速搭建本地存储环境

边缘计算：单节点或小规模集群的存储需求

高性能应用：需要低延迟本地存储的应用

临时存储：不需要跨节点共享的数据存储

## 与 HostPath 对比
| 特性 | Local Path Provisioner | HostPath |
| --- | --- | --- |
| 动态供应 | ✅ 支持自动创建 | ❌ 需要手动创建 |
| 生命周期管理 | ✅ 自动清理 | ❌ 需要手动管理 |
| 配置复杂度 | 🟡 中等（需要部署 Provisioner） | 🟢 简单（直接配置路径） |
| 存储隔离 | ✅ 每个 PVC 独立目录 | ❌ 共享目录路径 |
| 适用场景 | 生产环境的本地存储 | 开发测试的简单存储 |


## 优势
1. 自动化生命周期管理
+ 自动创建和清理存储目录
+ 无需手动管理 PV 资源
+ 支持配置热重载，运行时更新存储配置
2. 简化运维操作
+ 统一的 StorageClass 接口
+ 标准的 Kubernetes 存储 API
+ 减少人工干预和配置错误

# 部署
## 获取安装文件
使用官方最新版本进行部署，项目地址：[https://github.com/rancher/local-path-provisioner](https://github.com/rancher/local-path-provisioner)

```bash
# wget https://raw.githubusercontent.com/rancher/local-path-provisioner/v0.0.35/deploy/local-path-storage.yaml
# kubectl apply -f local-path-storage.yaml
```

## 验证部署状态
```bash
# 检查 Pod 状态
# kubectl get pod -n local-path-storage 
NAME                                      READY   STATUS    RESTARTS   AGE
local-path-provisioner-7dc9b86879-949z7   1/1     Running   0          98s

# 检查 StorageClass
# kubectl get storageclass
NAME            PROVISIONER                RECLAIMPOLICY   VOLUMEBINDINGMODE      ALLOWVOLUMEEXPANSION   AGE
local-path      rancher.io/local-path      Delete          WaitForFirstConsumer   false                  113s
```

# 使用
## 创建 PVC
```yaml
# cat pvc.yaml                  
kind: PersistentVolumeClaim
apiVersion: v1
metadata:
  name: test-pvc
spec:
  storageClassName: local-path
  accessModes:
    - ReadWriteMany
  resources:
    requests:
      storage: 10Mi#                                                                                                                                                                      
# kubectl apply -f pvc.yaml               
persistentvolumeclaim/test-pvc created
# kubectl get pvc                      
NAME       STATUS    VOLUME   CAPACITY   ACCESS MODES   STORAGECLASS   VOLUMEATTRIBUTESCLASS   AGE
test-pvc   Pending                                      local-path     <unset>                 4s
```

创建完 pvc 资源后默认是 pending 状态，等待创建资源使用 pvc。

## 创建 pod 使用 PVC
```yaml
# cat pod.yaml 
apiVersion: v1
kind: Pod
metadata:
  name: redis
  labels:
    name: redis
spec:
  containers:
  - name: redis
    image: redis:latest
    resources:
      limits:
        memory: "128Mi"
        cpu: "500m"
    ports:
      - containerPort: 6379
    volumeMounts:
      - name: redis-data
        mountPath: "/data"
  volumes:
    - name: redis-data
      persistentVolumeClaim:
        claimName: test-pvc
# kubectl apply -f pod.yaml            
pod/redis created
# kubectl get pod          
NAME      READY   STATUS             RESTARTS       AGE
redis     1/1     Running            0              79s
```

查看 pv pvc 状态

```bash
# kubectl get pv  
NAME                                       CAPACITY   ACCESS MODES   RECLAIM POLICY   STATUS   CLAIM                    STORAGECLASS    VOLUMEATTRIBUTESCLASS   REASON   AGE
pvc-f6dfa664-dda7-404a-93f5-4e8680f19ef6   10Mi       RWO            Delete           Bound    default/test-pvc         local-path      <unset>                          4m20s
# kubectl get pvc 
NAME       STATUS   VOLUME                                     CAPACITY   ACCESS MODES   STORAGECLASS   VOLUMEATTRIBUTESCLASS   AGE
test-pvc   Bound    pvc-f6dfa664-dda7-404a-93f5-4e8680f19ef6   10Mi       RWO            local-path     <unset>                 4m52s
```

## 数据持久化验证
进入pod添加数据

```bash
[root@k8s-master nfs]# kubectl exec -it redis -- redis-cli
127.0.0.1:6379> set key hello
OK
127.0.0.1:6379> get key
"hello"
127.0.0.1:6379> exit
```

重启pod，测试数据

```bash
[root@k8s-master nfs]# kubectl delete pod redis 
pod "redis" deleted
[root@k8s-master nfs]# kubectl apply -f pod.yaml 
pod/redis created
[root@k8s-master nfs]# kubectl exec -it redis -- redis-cli
127.0.0.1:6379> get key
"hello"
127.0.0.1:6379> exit
```

# 自定义配置
## 配置不同节点的存储路径
```yaml
# custom-config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: local-path-config
  namespace: local-path-storage
data:
  config.json: |-
    {
      "nodePathMap":[
        {
          "node":"DEFAULT_PATH_FOR_NON_LISTED_NODES",
          "paths":["/opt/local-path-provisioner"]
        },
        {
          "node":"worker-node-1",
          "paths":["/data/local-path-provisioner", "/mnt/ssd"]
        },
        {
          "node":"worker-node-2",
          "paths":["/storage/local-path"]
        }
      ]
    }
```

## 自定义 Helper Pod 模板
当它需要创建或删除本地目录（卷路径）时，不是直接在本地路径上操作，而是临时启动一个 “Helper Pod” 在目标节点执行这些操作。如果需要执行额外命令，可自定义如下配置：  

```yaml
helperPod.yaml: |-
    apiVersion: v1
    kind: Pod
    metadata:
      name: helper-pod
    spec:
      containers:
      - name: helper-pod
        image: busybox:1.35
        command:
        - sh
        - -c
        - |
          mkdir -m 0777 -p /opt/local-path-provisioner &&
          chmod 777 /opt/local-path-provisioner
        volumeMounts:
        - name: data
          mountPath: /opt/local-path-provisioner
      volumes:
      - name: data
        hostPath:
          path: /opt/local-path-provisioner
          type: DirectoryOrCreate
      restartPolicy: Never
```




