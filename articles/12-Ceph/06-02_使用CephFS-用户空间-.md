# 使用CephFS(用户空间)

> 分类：Ceph / 第6章：Ceph文件系统
> 原文：https://www.cuiliangblog.cn/detail/section/197252367
> 来源：崔亮的博客

---

 ceph文件系统由LINUX内核本地支持，但如果主机在较低的内核版本上运行，或者有任何应用程序依赖项，就需要使用FUSE客户端让Ceph挂载Ceph FS。    

# 客户端配置
## 安装软件包
在客户端节点上安装 `fuse` 包：

```bash
[root@ceph-client3 ~]# cat > /etc/yum.repos.d/ceph.repo << EOF
[ceph-reef]
name=ceph-reef
baseurl=https://mirrors.ustc.edu.cn/ceph/rpm-reef/el9/x86_64/
gpgcheck=0
[ceph-noarch]
name=cephnoarch
baseurl=https://mirrors.ustc.edu.cn/ceph/rpm-reef/el9/noarch/
gpgcheck=0
EOF
[root@ceph-client3 ceph]# dnf install -y ceph-fuse
[root@ceph-client3 ceph]# ceph-fuse --version
ceph version 18.2.4 (e7ad5345525c7aa95470c26863873b581076945d) reef (stable)
```

## 同步客户端认证文件
```bash
root@ceph-1:/etc/ceph# scp ceph.conf ceph.client.fs.keyring fs.key 192.168.10.96:/etc/ceph/
```

## 客户端验证权限
```bash
[root@ceph-client3 ceph]# ceph --id fs -s
  cluster:
    id:     402d9800-afef-11ef-92d7-9fbbd69ceccd
    health: HEALTH_OK
 
  services:
    mon: 3 daemons, quorum ceph-1,ceph-3,ceph-2 (age 23m)
    mgr: ceph-1.cuuabg(active, since 23m), standbys: ceph-3.uhtqme
    mds: 1/1 daemons up, 1 standby
    osd: 3 osds: 3 up (since 23m), 3 in (since 26h)
 
  data:
    volumes: 1/1 healthy
    pools:   5 pools, 161 pgs
    objects: 44 objects, 15 MiB
    usage:   144 MiB used, 150 GiB / 150 GiB avail
    pgs:     161 active+clean
```

# 挂载 CephFS 
## 使用 FUSE 挂载
```bash
[root@ceph-client3 ceph]# mkdir /mnt/cephfs
# 命令格式ceph-fuse -n client.<client-name> -k /etc/ceph/ceph.client.cephfs-user.key <mount-point>
[root@ceph-client3 ceph]# ceph-fuse -n client.fs -k /etc/ceph/ceph.client.fs.keyring /mnt/cephfs
2024-12-04T22:52:29.060+0800 7f4333e11480 -1 init, newargv = 0x5634f7fef660 newargc=15
ceph-fuse[2251]: starting ceph client
ceph-fuse[2251]: starting fuse
[root@ceph-client3 ceph]# df -h
Filesystem           Size  Used Avail Use% Mounted on
devtmpfs             4.0M     0  4.0M   0% /dev
tmpfs                1.8G     0  1.8G   0% /dev/shm
tmpfs                726M  8.9M  717M   2% /run
/dev/mapper/rl-root   47G  2.8G   45G   6% /
/dev/nvme0n1p1      1014M  400M  615M  40% /boot
tmpfs                363M     0  363M   0% /run/user/0
ceph-fuse             48G     0   48G   0% /mnt/cephfs
```

## **配置开机自动挂载**
为方便系统启动时自动挂载，可以将挂载配置添加到 `/etc/fstab`。

```bash
[root@ceph-client3 ~]# cat /etc/fstab
id=fs,conf=/etc/ceph/ceph.conf /mnt/cephfs fuse.ceph defaults 0 0
```

然后验证既可。


