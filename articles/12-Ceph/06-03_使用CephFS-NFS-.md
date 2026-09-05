# 使用CephFS(NFS)

> 分类：Ceph / 第6章：Ceph文件系统
> 原文：https://www.cuiliangblog.cn/detail/section/197252500
> 来源：崔亮的博客

---

# 服务端创建资源
## 创建 pool
使用cephFS之前需要事先于集群中创建一个文件系统，并为其分别制定元数据和数据相关的存储池。

```bash
# 创建保存元数据的nfs-metadata存储池
root@ceph-1:~# ceph osd pool create nfs-metadata 16 16
pool 'nfs-metadata' created
 
# 创建保存数据的cephfs-data存储池
root@ceph-1:~# ceph osd pool create nfs-data 16 16
pool 'nfs-data' created

# 查看存储池
root@ceph-1:~# ceph osd pool ls
.mgr
mypool
rbd-data
cephfs-metadata
cephfs-data
nfs-metadata
nfs-data
```

## 创建cephFS
```bash
# 创建cephfs
root@ceph-1:~# ceph fs new mynfs nfs-metadata nfs-data
  Pool 'nfs-data' (id '10') has pg autoscale mode 'on' but is not marked as bulk.
  Consider setting the flag by running
    # ceph osd pool set nfs-data bulk true
new fs with metadata pool 9 and data pool 10
```

## 添加 NFS-Ganesha 服务
```bash
root@ceph-1:~# ceph orch apply nfs nfs-cluster --placement="ceph-1,ceph-2"
Scheduled nfs.mynfs update...
```

+ --placement：运行 NFS-Ganesha 服务的节点列表

## 验证 NFS 服务部署
```bash
root@ceph-1:~# ceph orch ps | grep nfs
nfs.nfs-cluster.0.1.ceph-1.ikmbpa  ceph-1  *:2049            running (13s)     3s ago  13s    44.9M        -  5.5      2bc0b0f4375d  18b13f107af6  
nfs.nfs-cluster.2.1.ceph-2.tuettr  ceph-2  *:2049            running (9s)      4s ago   9s    13.5M        -  5.5      2bc0b0f4375d  a1cd503bb24a
```

确认 NFS 服务的状态为 `running`。

## 创建 NFS 集群
```plain
root@ceph-1:~# ceph nfs cluster create nfs-cluster --virtual-ip 192.168.10.90 --ingress
```

其中192.168.10.90 为集群 VIP，实现 nfs 高可用。

## 创建 NFS 导出
使用 Ceph CLI 创建 NFS 导出。

```plain
ceph nfs export create cephfs <nfs-cluster-name> <export-path> --fsname <cephfs-name> 
```

参数说明：

+ `<nfs-cluster-name>`：之前配置的 NFS 集群名称。
+ `<export-path>`：导出路径，例如 `/export1`。
+ `<cephfs-name>`：CephFS 的名称。

```bash
root@ceph-1:~# ceph nfs export create cephfs nfs-cluster /export --fsname mynfs
{
  "bind": "/export",
  "cluster": "nfs-cluster",
  "fs": "mynfs",
  "mode": "RW",
  "path": "/"
}
```

此命令将在 NFS 集群中创建一个导出 `/export`，指向 CephFS 的根目录。

## 查看现有导出
```plain
root@ceph-1:~# ceph nfs export ls nfs-cluster
[
  "/export"
]
```

# 高可用配置
## 安装 keeplived
> 所有 nfs 节点安装
>

```bash
apt-get install keepalived -y
```

## 配置 keeplived
+ **主节点配置**

在每个 Ceph 节点上配置 Keepalived，以便它们可以共享虚拟 IP。您需要编辑 `/etc/keepalived/keepalived.conf` 文件。

在 主节点（负责提供虚拟 IP 的节点）上，配置如下：

```bash
root@ceph-1:~# vim /etc/keepalived/keepalived.conf
vrrp_instance VI_1 {
    state MASTER
    interface ens33  # 网络接口，可以根据实际情况更改
    virtual_router_id 51
    priority 101
    advert_int 1
    virtual_ipaddress {
        192.168.10.90  # 虚拟 IP 地址
    }
}
```

在 **备份节点** 上，配置如下：

```bash
root@ceph-1:~# vim /etc/keepalived/keepalived.conf
vrrp_instance VI_1 {
    state BACKUP
    interface ens33  # 网络接口，可以根据实际情况更改
    virtual_router_id 51
    priority 100 # 优先级递减
    advert_int 1
    virtual_ipaddress {
        192.168.10.90  # 虚拟 IP 地址
    }
}
```

## 启动 Keepalived 服务
启动并使 Keepalived 在所有节点上自启动：

```plain
systemctl enable keepalived
systemctl start keepalived
```

## 验证虚拟 IP 是否正常工作
使用 `ip a` 命令检查虚拟 IP 是否在主节点的网络接口上激活。您应该能够在主节点上看到该 IP，而备份节点只有在主节点失效时才会接管该 IP。

```bash
root@ceph-1:~# ip a | grep 192.168.10
    inet 192.168.10.91/24 brd 192.168.10.255 scope global ens33
    inet 192.168.10.90/32 scope global ens33
```

# 客户端挂载
## 获取 NFS 服务地址
```bash
root@ceph-1:~# ceph nfs cluster info nfs-cluster
{
  "nfs-cluster": {
    "backend": [
      {
        "hostname": "ceph-1",
        "ip": "192.168.10.91",
        "port": 12049
      },
      {
        "hostname": "ceph-2",
        "ip": "192.168.10.92",
        "port": 12049
      }
    ],
    "monitor_port": 9049,
    "port": 2049,
    "virtual_ip": "192.168.10.90"
  }
}
```

## 安装 NFS 客户端
```bash
apt install nfs-common
```

## 客户端挂载
```bash
root@ceph-client:~# mount -t nfs -o vers=4 192.168.10.90:/export /mnt/nfs
root@ceph-client:~# df -h
Filesystem                         Size  Used Avail Use% Mounted on
udev                               1.9G     0  1.9G   0% /dev
tmpfs                              389M  1.5M  388M   1% /run
/dev/mapper/ubuntu--vg-ubuntu--lv   48G  7.7G   38G  17% /
tmpfs                              1.9G     0  1.9G   0% /dev/shm
tmpfs                              5.0M     0  5.0M   0% /run/lock
tmpfs                              1.9G     0  1.9G   0% /sys/fs/cgroup
/dev/sda2                          2.0G  109M  1.7G   6% /boot
/dev/loop0                          92M   92M     0 100% /snap/lxd/24061
/dev/loop1                          64M   64M     0 100% /snap/core20/1828
/dev/loop3                          45M   45M     0 100% /snap/snapd/23258
/dev/loop2                          64M   64M     0 100% /snap/core20/2434
/dev/loop5                          92M   92M     0 100% /snap/lxd/29619
/dev/loop4                          50M   50M     0 100% /snap/snapd/18357
/dev/rbd0                          3.0G   54M  3.0G   2% /data
tmpfs                              389M     0  389M   0% /run/user/0
192.168.10.90:/export               48G     0   48G   0% /mnt/nfs
```

## 开机自动挂载
```bash
root@ceph-client:~# vim /etc/fstab
192.168.10.90:/export  /mnt/nfs  nfs  defaults,_netdev,vers=4  0  0
```


