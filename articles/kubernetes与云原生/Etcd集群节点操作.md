# 备份

备份策略：

-   每两个小时用命令对etcd进行备份
-   备份数据保留2天

```plain
ETCDCTL_API=3 /opt/etcd/bin/etcdctl snapshot  save /root/backup/etcd_$(date "+%Y%m%d%H%M%S").db
```

  

# 恢复

（1）、停止kube-apiserver，确保不会再写入数据

  

```plain
systemctl stop kube-apiserver
```

  

（2）、停止所有节点etcd

```plain
systemctl stop etcd
```

  

（3）、将etcd节点上原有的数据目录备份（具体的目录可以在etcd的配置文件中查看）

  

```plain
mv /var/lib/etcd/default.etcd{,.bak}
```

  

（4）、将备份的数据拷贝到所有etcd节点

  

```plain
scp etcd_20200106152240.db 10.1.10.129:/root/backup/
scp etcd_20200106152240.db 10.1.10.130:/root/backup/
```

  

（5）、使用命令进行恢复

  

```plain
# 在etcd-1上
ETCDCTL_API=3 /opt/etcd/bin/etcdctl snapshot --endpoints="https://10.1.10.128:2379,https://10.1.10.129:2379,https://10.1.10.130:2379" --cacert=/opt/etcd/ssl/etcd-ca.pem --cert=/opt/etcd/ssl/etcd-server.pem --key=/opt/etcd/ssl/etcd-server-key.pem restore ~/backup/etcd_20200106152240.db --name=etcd-1 --data-dir=/var/lib/etcd/default.etcd --initial-cluster="etcd-1=https://10.1.10.128:2380,etcd-2=https://10.1.10.129:2380,etcd-3=https://10.1.10.130:2380" --initial-cluster-token="etcd-cluster" --initial-advertise-peer-urls=https://10.1.10.128:2380
# 在etcd-2上
ETCDCTL_API=3 /opt/etcd/bin/etcdctl snapshot --endpoints="https://10.1.10.128:2379,https://10.1.10.129:2379,https://10.1.10.130:2379" --cacert=/opt/etcd/ssl/etcd-ca.pem --cert=/opt/etcd/ssl/etcd-server.pem --key=/opt/etcd/ssl/etcd-server-key.pem restore ~/backup/etcd_20200106152240.db --name=etcd-2 --data-dir=/var/lib/etcd/default.etcd --initial-cluster="etcd-1=https://10.1.10.128:2380,etcd-2=https://10.1.10.129:2380,etcd-3=https://10.1.10.130:2380" --initial-cluster-token="etcd-cluster" --initial-advertise-peer-urls=https://10.1.10.129:2380
# 在etcd-3上
ETCDCTL_API=3 /opt/etcd/bin/etcdctl snapshot --endpoints="https://10.1.10.128:2379,https://10.1.10.129:2379,https://10.1.10.130:2379" --cacert=/opt/etcd/ssl/etcd-ca.pem --cert=/opt/etcd/ssl/etcd-server.pem --key=/opt/etcd/ssl/etcd-server-key.pem restore ~/backup/etcd_20200106152240.db --name=etcd-3 --data-dir=/var/lib/etcd/default.etcd --initial-cluster="etcd-1=https://10.1.10.128:2380,etcd-2=https://10.1.10.129:2380,etcd-3=https://10.1.10.130:2380" --initial-cluster-token="etcd-cluster" --initial-advertise-peer-urls=https://10.1.10.130:2380
```

  

（6）、启动etcd服务

  

```plain
systemctl start etcd
```

  

（7）、启动kube-apiserver

  

```plain
systemctl start kube-apiserver
```

  

（8）、查看集群状态

  

```plain
# /opt/etcd/bin/etcdctl \
> --ca-file=/opt/etcd/ssl/etcd-ca.pem --cert-file=/opt/etcd/ssl/etcd-server.pem --key-file=/opt/etcd/ssl/etcd-server-key.pem \
> --endpoints="https://10.1.10.128:2379,https://10.1.10.129:2379,https://10.1.10.130:2379" \
> cluster-health
member a2dba8836695bcf6 is healthy: got healthy result from https://10.1.10.129:2379
member d1272b0b3cb41282 is healthy: got healthy result from https://10.1.10.128:2379
member e4a3a9c93ef84f2d is healthy: got healthy result from https://10.1.10.130:2379
cluster is healthy

# kubectl get node
NAME         STATUS   ROLES    AGE    VERSION
master-k8s   Ready    <none>   4h9m   v1.16.4
node01-k8s   Ready    <none>   40h    v1.16.4
node02-k8s   Ready    <none>   39h    v1.16.4
# kubectl get pod -n kube-system 
NAME                                          READY   STATUS    RESTARTS   AGE
coredns-9d5b6bdb6-mpwht                       1/1     Running   0          38h
kube-flannel-ds-amd64-2qkcb                   1/1     Running   0          38h
kube-flannel-ds-amd64-7nzj5                   1/1     Running   0          38h
kube-flannel-ds-amd64-hlfdf                   1/1     Running   0          4h9m
metrics-server-v0.3.6-6c57d48cb4-tzjc7        2/2     Running   0          3h53m
traefik-ingress-controller-7758594f89-lwf2t   1/1     Running   0          16h

```

  

# 剔除

如果我们要剔除某个节点，我们可以通过下面步骤进行。

（1）、查看现有节点的member信息

```plain
 /opt/etcd/bin/etcdctl --ca-file=/opt/etcd/ssl/etcd-ca.pem --cert-file=/opt/etcd/ssl/etcd-server.pem --key-file=/opt/etcd/ssl/etcd-server-key.pem  member list
a2dba8836695bcf6: name=etcd-2 peerURLs=https://10.1.10.129:2380 clientURLs=https://10.1.10.129:2379 isLeader=false
d1272b0b3cb41282: name=etcd-1 peerURLs=https://10.1.10.128:2380 clientURLs=https://10.1.10.128:2379 isLeader=true
e4a3a9c93ef84f2d: name=etcd-3 peerURLs=https://10.1.10.130:2380 clientURLs=https://10.1.10.130:2379 isLeader=false
```

  

（2）、根据member信息移除相应的实例

```plain
# /opt/etcd/bin/etcdctl --ca-file=/opt/etcd/ssl/etcd-ca.pem --cert-file=/opt/etcd/ssl/etcd-server.pem --key-file=/opt/etcd/ssl/etcd-server-key.pem  member remove e4a3a9c93ef84f2d
Removed member e4a3a9c93ef84f2d from cluster
```

  

（3）、停止被移除节点的etcd

```plain
systemctl stop etcd
```

  

（4）、修改现有etcd集群的配置文件，移除被踢掉的etcd集群

```plain
...
ETCD_INITIAL_CLUSTER="etcd-1=https://10.1.10.128:2380,etcd-2=https://10.1.10.129:2380"
...
```

  

（5）、重启现有集群的etcd

```plain
systemctl restart etcd
```

  

（6）、查看集群状态

```plain
#  /opt/etcd/bin/etcdctl --ca-file=/opt/etcd/ssl/etcd-ca.pem --cert-file=/opt/etcd/ssl/etcd-server.pem --key-file=/opt/etcd/ssl/etcd-server-key.pem  member list
a2dba8836695bcf6: name=etcd-2 peerURLs=https://10.1.10.129:2380 clientURLs=https://10.1.10.129:2379 isLeader=false
d1272b0b3cb41282: name=etcd-1 peerURLs=https://10.1.10.128:2380 clientURLs=https://10.1.10.128:2379 isLeader=true

# /opt/etcd/bin/etcdctl --ca-file=/opt/etcd/ssl/etcd-ca.pem --cert-file=/opt/etcd/ssl/etcd-server.pem --key-file=/opt/etcd/ssl/etcd-server-key.pem --endpoints="https://10.1.10.128:2379,https://10.1.10.129:2379" cluster-health
member a2dba8836695bcf6 is healthy: got healthy result from https://10.1.10.129:2379
member d1272b0b3cb41282 is healthy: got healthy result from https://10.1.10.128:2379
cluster is healthy
```

  

# 新增

如果我们需要新增一个etcd节点，则可以按照以下步骤进行。

（1）、通过以下命令新增节点

```plain
# /opt/etcd/bin/etcdctl --ca-file=/opt/etcd/ssl/etcd-ca.pem --cert-file=/opt/etcd/ssl/etcd-server.pem --key-file=/opt/etcd/ssl/etcd-server-key.pem  member add etcd-3 https://10.1.10.130:2380
Added member named etcd-3 with ID 16ebaad9c9a3a3e3 to cluster

ETCD_NAME="etcd-3"
ETCD_INITIAL_CLUSTER="etcd-3=https://10.1.10.130:2380,etcd-2=https://10.1.10.129:2380,etcd-1=https://10.1.10.128:2380"
ETCD_INITIAL_CLUSTER_STATE="existing"
```

> 注意：
> 
> -   etcd\_name: etcd.conf配置文件中ETCD\_NAME内容
> -   etdc\_node\_address: etcd.conf配置文件中的ETCD\_LISTEN\_PEER\_URLS内容

  

（2）、删除新增成员旧数据目录，并且启动新增成员etcd服务，加入集群时要改下配置文件，把初始化集群状态由new改成existing，如下

```plain
#[Member]
ETCD_NAME="etcd-3"
ETCD_DATA_DIR="/var/lib/etcd/default.etcd"
ETCD_LISTEN_PEER_URLS="https://10.1.10.130:2380"
ETCD_LISTEN_CLIENT_URLS="https://10.1.10.130:2379"

#[Clustering]
ETCD_INITIAL_ADVERTISE_PEER_URLS="https://10.1.10.130:2380"
ETCD_ADVERTISE_CLIENT_URLS="https://10.1.10.130:2379"
ETCD_INITIAL_CLUSTER="etcd-1=https://10.1.10.128:2380,etcd-2=https://10.1.10.129:2380,etcd-3=https://10.1.10.130:2380"
ETCD_INITIAL_CLUSTER_TOKEN="etcd-cluster"
ETCD_INITIAL_CLUSTER_STATE="existing"
```

（3）、还需要修改systemd unit文件中的参数，如下：

```plain
......
--initial-cluster-state=existing \
......
```

  

（4）、在现存etcd的配置文件中修改

```plain
ETCD_INITIAL_CLUSTER="etcd-1=https://10.1.10.128:2380,etcd-2=https://10.1.10.129:2380,etcd-3=https://10.1.10.130:2380"
```

（5）、重启etcd

```plain
systemctl restart etcd
```

（6）、查看状态

```plain
# /opt/etcd/bin/etcdctl  --ca-file=/opt/etcd/ssl/etcd-ca.pem --cert-file=/opt/etcd/ssl/etcd-server.pem --key-file=/opt/etcd/ssl/etcd-server-key.pem  member list
7d38a6cc82b63e33: name=etcd-3 peerURLs=https://10.1.10.130:2380 clientURLs=https://10.1.10.130:2379 isLeader=false
a2dba8836695bcf6: name=etcd-2 peerURLs=https://10.1.10.129:2380 clientURLs=https://10.1.10.129:2379 isLeader=true
d1272b0b3cb41282: name=etcd-1 peerURLs=https://10.1.10.128:2380 clientURLs=https://10.1.10.128:2379 isLeader=false

# /opt/etcd/bin/etcdctl \
> --ca-file=/opt/etcd/ssl/etcd-ca.pem --cert-file=/opt/etcd/ssl/etcd-server.pem --key-file=/opt/etcd/ssl/etcd-server-key.pem \
> --endpoints="https://10.1.10.128:2379,https://10.1.10.129:2379,https://10.1.10.130:2379" \
> cluster-health
member 7d38a6cc82b63e33 is healthy: got healthy result from https://10.1.10.130:2379
member a2dba8836695bcf6 is healthy: got healthy result from https://10.1.10.129:2379
member d1272b0b3cb41282 is healthy: got healthy result from https://10.1.10.128:2379
```