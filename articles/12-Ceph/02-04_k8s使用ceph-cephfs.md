# k8s使用ceph-cephfs

> 分类：Ceph / 第2章：Ceph集群部署与k8s使用
> 原文：https://www.cuiliangblog.cn/detail/section/196465852
> 来源：崔亮的博客

---

# ceph创建资源
查看admin用户keyring

```bash
root@k8s-1:~# ceph auth get client.admin
[client.admin]
        key = AQB3wCBnsY0QEBAAbWu8C78rfC2dFIPfLxPV9A==
        caps mds = "allow *"
        caps mgr = "allow *"
        caps mon = "allow *"
        caps osd = "allow *"
```

创建cephfs资源

```bash
# 创建存储池
root@k8s-1:~# ceph osd pool create cephfs_data
pool 'cephfs_data' created
root@k8s-1:~# ceph osd pool create cephfs_metadata
pool 'cephfs_metadata' created
# 创建 CephFS 文件系统
root@k8s-1:~# ceph fs new myfs cephfs_metadata cephfs_data
  Pool 'cephfs_data' (id '5') has pg autoscale mode 'on' but is not marked as bulk.
  Consider setting the flag by running
    # ceph osd pool set cephfs_data bulk true
new fs with metadata pool 6 and data pool 5
# 查看文件系统状态
root@k8s-1:~# ceph fs ls
name: myfs, metadata pool: cephfs_metadata, data pools: [cephfs_data ]
# 创建mds,部署两个，分别部署到k8s-1和k8s-2两台主机上
root@k8s-1:~# ceph orch apply mds myfs --placement="2 k8s-1 k8s-2"
Scheduled mds.myfs update...
# 创建subvolume，3.10.0版本后移除了自动创建sub volume，需要手动创建
root@k8s-1:~# ceph fs subvolumegroup create myfs csi
```

# <font style="color:rgb(25, 27, 31);">创建secrets</font>
> ceph客户端连接需要认证信息。
>

```yaml
root@k8s-1:~# cat > ceph-rbd-secrets.yaml << EOF               
apiVersion: v1
kind: Secret
metadata:
  name: csi-cephfs-secret
  namespace: ceph-csi-cephfs
stringData:
  adminID: admin
  adminKey: AQB3wCBnsY0QEBAAbWu8C78rfC2dFIPfLxPV9A==
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
  name: ceph-cephfs
provisioner: cephfs.csi.ceph.com
reclaimPolicy: Delete # 数据删除策略
parameters:
  clusterID: 1945ab20-95e5-11ef-a379-63253f41bb80 # 集群fsid
  pool: cephfs_data # ceph fs ls输出
  fsName: myfs # ceph fs ls输出
  csi.storage.k8s.io/provisioner-secret-name: csi-cephfs-secret # 用于访问 ceph 的 secrets
  csi.storage.k8s.io/provisioner-secret-namespace: ceph-csi-cephfs # 访问ceph的secrets所在的名称空间
  csi.storage.k8s.io/controller-expand-secret-name: csi-cephfs-secret  # 指定卷扩展操作使用的Secret名称
  csi.storage.k8s.io/controller-expand-secret-namespace: ceph-csi-cephfs
  csi.storage.k8s.io/node-stage-secret-name: csi-cephfs-secret # 节点阶段node-stage操作使用的 Secret 名称
  csi.storage.k8s.io/node-stage-secret-namespace: ceph-csi-cephfs
  csi.storage.k8s.io/fstype: ext4 # 文件系统类型，默认值是 ext4
allowVolumeExpansion: true
EOF
root@k8s-1:~# kubectl apply -f ceph-rbd-sc.yaml       
storageclass.storage.k8s.io/ceph-rbd created
```

# <font style="color:rgb(25, 27, 31);">使用验证</font>
<font style="color:rgb(48, 49, 51);">创建pvc资源清单</font>

```yaml
root@k8s-1:~# cat > ceph-cephfs-pvc.yaml << EOF
kind: PersistentVolumeClaim
apiVersion: v1
metadata:
  name: test-pvc
spec:
  storageClassName: ceph-cephfs # StorageClass名称
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Mi
EOF
root@k8s-1:~# kubectl apply -f ceph-cephfs-pvc.yaml
persistentvolumeclaim/test-pvc created
root@k8s-1:~# kubectl get pvc
NAME       STATUS   VOLUME                                     CAPACITY   ACCESS MODES   STORAGECLASS   VOLUMEATTRIBUTESCLASS   AGE
test-pvc   Bound    pvc-a6e0d717-e042-4ac9-a4c0-d0a5b79bfdee   10Mi       RWO            ceph-cephfs    <unset>                9s
root@k8s-1:~# kubectl get pv            
NAME                                       CAPACITY   ACCESS MODES   RECLAIM POLICY   STATUS   CLAIM                 STORAGECLASS   VOLUMEATTRIBUTESCLASS   REASON   AGE
pvc-2696c316-8b29-45ab-8bf1-b2d9f07be50d   10Mi       RWO            Delete           Bound    default/test-pvc      ceph-cephfs    <unset>                          68s
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


