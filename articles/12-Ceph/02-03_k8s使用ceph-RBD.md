# k8s使用ceph-RBD

> 分类：Ceph / 第2章：Ceph集群部署与k8s使用
> 原文：https://www.cuiliangblog.cn/detail/section/196465856
> 来源：崔亮的博客

---

# ceph创建资源
```bash
# 创建k8s存储池
root@k8s-1:~# pool=k8s-rbd
root@k8s-1:~# ceph osd pool create $pool
pool 'k8s-rbd' created
# 初始化存储池
root@k8s-1:~# rbd pool init $pool
# 新建一个ceph用户，用户名和key后续需要使用到
root@k8s-1:~# ceph auth get-or-create client.$pool mon "profile rbd" osd "profile rbd pool=$pool" mgr "profile rbd pool=$pool"
[client.k8s-rbd]
        key = AQA82CFndBkJNBAAkKx43ofxpIMUBJnKCp7Pjg==
# 也可以用这个命令获取 keyring
root@k8s-1:~# ceph auth get-key client.$pool
AQA82CFndBkJNBAAkKx43ofxpIMUBJnKCp7Pjg==
# 这个还可以看到所有的权限
root@k8s-1:~# ceph auth get client.$pool
[client.k8s-rbd]
        key = AQA82CFndBkJNBAAkKx43ofxpIMUBJnKCp7Pjg==
        caps mgr = "profile rbd pool=k8s-rbd"
        caps mon = "profile rbd"
        caps osd = "profile rbd pool=k8s-rbd"
```

# <font style="color:rgb(25, 27, 31);">创建secrets</font>
> ceph客户端连接需要认证信息， userID 访问 ceph 的用户名，userKey 访问 ceph 的 keyring 密钥
>

```yaml
root@k8s-1:~# cat > ceph-rbd-secrets.yaml << EOF               
apiVersion: v1
kind: Secret
metadata:
  name: csi-rbd-secret
  namespace: ceph-csi-rbd
stringData:
  userID: k8s-rbd
  userKey: AQA82CFndBkJNBAAkKx43ofxpIMUBJnKCp7Pjg==   
EFO                                                                                                                                                                                     
root@k8s-1:~# kubectl apply -f ceph-rbd-secrets.yaml                     
secret/csi-rbd-secret created
```

# 创建<font style="color:rgb(25, 27, 31);">StorageClass</font>
```yaml
root@k8s-1:~# cat > ceph-rbd-sc.yaml  << EOF    
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: ceph-rbd
provisioner: rbd.csi.ceph.com
reclaimPolicy: Delete # 数据删除策略
allowVolumeExpansion: true
mountOptions:
  - discard
parameters:
  clusterID: 1945ab20-95e5-11ef-a379-63253f41bb80 # 集群fsid
  pool: k8s # 使用的的 pool
  csi.storage.k8s.io/provisioner-secret-name: csi-rbd-secret # 用于访问 ceph 的 secrets
  csi.storage.k8s.io/provisioner-secret-namespace: ceph-csi-rbd # 访问ceph的secrets所在的名称空间
  csi.storage.k8s.io/controller-expand-secret-name: csi-rbd-secret # 指定卷扩展操作使用的Secret名称
  csi.storage.k8s.io/controller-expand-secret-namespace: ceph-csi-rbd
  csi.storage.k8s.io/node-stage-secret-name: csi-rbd-secret # 节点阶段node-stage操作使用的 Secret 名称
  csi.storage.k8s.io/node-stage-secret-namespace: ceph-csi-rbd
  csi.storage.k8s.io/fstype: ext4 # 文件系统类型，默认值是 ext4
root@k8s-1:~# kubectl apply -f ceph-rbd-sc.yaml       
storageclass.storage.k8s.io/ceph-rbd created
```

# <font style="color:rgb(25, 27, 31);">使用验证</font>
<font style="color:rgb(48, 49, 51);">创建pvc资源清单</font>

```yaml
root@k8s-1:~# cat > ceph-rbd-pvc.yaml << EOF
kind: PersistentVolumeClaim
apiVersion: v1
metadata:
  name: test-pvc
spec:
  storageClassName: ceph-rbd # StorageClass名称
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Mi
EOF
root@k8s-1:~# kubectl apply -f ceph-rbd-pvc.yaml
persistentvolumeclaim/test-pvc created
root@k8s-1:~# kubectl get pvc
NAME       STATUS   VOLUME                                     CAPACITY   ACCESS MODES   STORAGECLASS   VOLUMEATTRIBUTESCLASS   AGE
test-pvc   Bound    pvc-a6e0d717-e042-4ac9-a4c0-d0a5b79bfdee   10Mi       RWO            ceph-rbd       <unset>                 9s
root@k8s-1:~# kubectl get pv            
NAME                                       CAPACITY   ACCESS MODES   RECLAIM POLICY   STATUS   CLAIM                 STORAGECLASS   VOLUMEATTRIBUTESCLASS   REASON   AGE
pvc-2696c316-8b29-45ab-8bf1-b2d9f07be50d   10Mi       RWO            Delete           Bound    default/test-pvc      ceph-rbd       <unset>                          68s
```

<font style="color:rgb(48, 49, 51);">创建pod使用pvc</font>

```yaml
root@k8s-1:~# cat > pod.yaml << EOF 
apiVersion: v1
kind: Pod
metadata:
  name: redis
  labels:
    name: redis
spec:
  containers:
  - name: redis
    image: harbor.local.com/library/redis:7
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
EOF
root@k8s-1:~# kubectl apply -f pod.yaml 
pod/redis created
root@k8s-1:~# kubectl get pod
NAME                                               READY   STATUS    RESTARTS   AGE
redis                                              1/1     Running   0          2m37s
```

<font style="color:rgb(48, 49, 51);">进入pod添加数据</font>

```bash
root@k8s-1:~# kubectl exec -it redis -- redis-cli
127.0.0.1:6379> set key hello
OK
127.0.0.1:6379> get key
"hello"
127.0.0.1:6379> exit
```

<font style="color:rgb(48, 49, 51);">重启pod，测试数据</font>

```bash
root@k8s-1:~# kubectl delete pod redis 
pod "redis" deleted
root@k8s-1:~# kubectl apply -f pod.yaml 
pod/redis created
root@k8s-1:~# kubectl exec -it redis -- redis-cli
127.0.0.1:6379> get key
"hello"
127.0.0.1:6379> exit
```

# 

