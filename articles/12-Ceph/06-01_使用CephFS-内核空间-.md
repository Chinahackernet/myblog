# 使用CephFS(内核空间)

> 分类：Ceph / 第6章：Ceph文件系统
> 原文：https://www.cuiliangblog.cn/detail/section/197232982
> 来源：崔亮的博客

---

# 服务端创建资源
##  检查是否启用了 MDS 服务 
 CephFS 依赖元数据服务（MDS）。检查是否已部署 MDS：  

```bash
root@ceph-1:~# ceph orch ps | grep mds
```

## 部署MDS服务
```bash
# 命令格式：ceph orch apply mds <filesystem-name> --placement=<number-of-instances>，如果未指定 --placement，默认会在任意可用节点上启动一个实例。
root@ceph-1:~# ceph orch apply mds cephfs --placement=2
Scheduled mds.cephfs update...
root@ceph-1:~# ceph orch ps | grep mds
mds.cephfs.ceph-1.lkihzh  ceph-1                    running (12s)      7s ago  12s    13.0M        -  18.2.4   2bc0b0f4375d  bbc98a11e324  
mds.cephfs.ceph-3.hjkmsp  ceph-3                    running (13s)      7s ago  13s    13.7M        -  18.2.4   2bc0b0f4375d  6642ca00f5db
```

## 创建 pool
使用cephFS之前需要事先于集群中创建一个文件系统，并为其分别制定元数据和数据相关的存储池。

```bash
# 创建保存元数据的cephfs-metadata存储池
root@ceph-1:~# ceph osd pool create cephfs-metadata 16 16
pool 'cephfs-metadata' created
 
# 创建保存数据的cephfs-data存储池
root@ceph-1:~# ceph osd pool create cephfs-data 32 32
pool 'cephfs-data' created

# 查看存储池
root@ceph-1:~# ceph osd pool ls 
.mgr
mypool
rbd-data
cephfs-metadata
cephfs-data
```

## 创建cephFS
```bash
# 创建cephfs
root@ceph-1:~# ceph fs new mycephfs cephfs-metadata cephfs-data
  Pool 'cephfs-data' (id '8') has pg autoscale mode 'on' but is not marked as bulk.
  Consider setting the flag by running
    # ceph osd pool set cephfs-data bulk true
new fs with metadata pool 7 and data pool 8
```

## 验证 cephFS
```bash
# 验证fs
root@ceph-1:~# ceph fs ls
name: mycephfs, metadata pool: cephfs-metadata, data pools: [cephfs-data ]
 
# 查看指定cephFS状态，cephfs-metadata存储池为元数据类型，cephfs-data为数据类型
root@ceph-1:~# ceph fs status mycephfs
mycephfs - 0 clients
========
RANK  STATE           MDS              ACTIVITY     DNS    INOS   DIRS   CAPS  
 0    active  cephfs.ceph-1.lkihzh  Reqs:    0 /s    10     13     12      0   
      POOL         TYPE     USED  AVAIL  
cephfs-metadata  metadata  96.0k  47.4G  
  cephfs-data      data       0   47.4G  
    STANDBY MDS       
cephfs.ceph-3.hjkmsp  
MDS version: ceph version 18.2.4 (e7ad5345525c7aa95470c26863873b581076945d) reef (stable)

# 验证cephFS服务状态
root@ceph-1:~# ceph mds stat
mycephfs:1 {0=cephfs.ceph-1.lkihzh=up:active} 1 up:standby # mycephfs为活动状态
```

## 创建客户端账户
```bash
# 创建普通用户fs
root@ceph-1:/etc/ceph# ceph auth get-or-create client.fs mon 'allow r' mds 'allow rw' osd 'allow rwx pool=cephfs-data'
[client.fs]
        key = AQC/FVBnFzdqFRAAcv+wHeuiZCgOxfAH9jzzqA==
 
# 验证账户
root@ceph-1:/etc/ceph# ceph auth get client.fs
[client.fs]
        key = AQC/FVBnFzdqFRAAcv+wHeuiZCgOxfAH9jzzqA==
        caps mds = "allow rw"
        caps mon = "allow r"
        caps osd = "allow rwx pool=cephfs-data"
 
# 创建keyring文件
root@ceph-1:/etc/ceph# ceph-authtool --create-keyring ceph.client.fs.keyring
creating ceph.client.fs.keyring

# 创建fs用户keyring文件
root@ceph-1:/etc/ceph# ceph auth get client.fs -o ceph.client.fs.keyring
 
# 创建key文件
root@ceph-1:/etc/ceph# ceph auth print-key client.fs > fs.key
 
# 验证keyring文件
root@ceph-1:/etc/ceph# cat ceph.client.fs.keyring
[client.fs]
        key = AQC/FVBnFzdqFRAAcv+wHeuiZCgOxfAH9jzzqA==
        caps mds = "allow rw"
        caps mon = "allow r"
        caps osd = "allow rwx pool=cephfs-data"
```

# 客户端内核空间使用资源
## 安装ceph客户端
Ubuntu客户端安装ceph-common

```bash
root@ceph-client:~# cat > /etc/apt/sources.list.d/ceph.list << EOF
deb https://mirrors.ustc.edu.cn/ceph/debian-reef/ focal main 
EOF
root@ceph-client:~# wget -q -O- 'https://mirrors.ustc.edu.cn/ceph/keys/release.asc' | sudo apt-key add -
root@ceph-client:~# apt update && apt install ceph-common -y
root@ceph-client:~# ceph -v
ceph version 18.2.4 (e7ad5345525c7aa95470c26863873b581076945d) reef (stable)
```

## 同步客户端认证文件
```bash
root@ceph-1:/etc/ceph# scp ceph.conf ceph.client.fs.keyring fs.key 192.168.10.95:/etc/ceph/
```

## 客户端验证权限
```bash
root@ceph-client:~# ceph --user fs -s
  cluster:
    id:     402d9800-afef-11ef-92d7-9fbbd69ceccd
    health: HEALTH_OK
 
  services:
    mon: 3 daemons, quorum ceph-1,ceph-3,ceph-2 (age 12m)
    mgr: ceph-1.cuuabg(active, since 12m), standbys: ceph-3.uhtqme
    mds: 1/1 daemons up, 1 standby
    osd: 3 osds: 3 up (since 12m), 3 in (since 20h)
 
  data:
    volumes: 1/1 healthy
    pools:   5 pools, 161 pgs
    objects: 43 objects, 15 MiB
    usage:   173 MiB used, 150 GiB / 150 GiB avail
    pgs:     161 active+clean
```

客户端挂载有两种方式，一是内核空间，一是用户空间，内核空间挂载需要内核支持ceph模块，用户空间挂载需按照ceph-fuse，正常推荐使用内核挂载。

内核空间挂载分为secretfile文件和secret两种方式，同时支持多主机挂载。

## secretfile 方式多主机挂载
### 获取 mon 列表
```bash
root@ceph-1:/etc/ceph# cat /etc/ceph/ceph.conf 
# minimal ceph.conf for 402d9800-afef-11ef-92d7-9fbbd69ceccd
[global]
        fsid = 402d9800-afef-11ef-92d7-9fbbd69ceccd
        mon_host = [v2:192.168.10.91:3300/0,v1:192.168.10.91:6789/0] [v2:192.168.10.92:3300/0,v1:192.168.10.92:6789/0] [v2:192.168.10.93:3300/0,v1:192.168.10.93:6789/0]
```

### client1挂载
```bash
root@ceph-client:~# mount -t ceph 192.168.10.91:6789,192.168.10.92:6789,192.168.10.93:6789:/ /data -o name=fs,secretfile=/etc/ceph/fs.key
root@ceph-client:~# df -h
Filesystem                                                  Size  Used Avail Use% Mounted on
udev                                                        1.9G     0  1.9G   0% /dev
tmpfs                                                       389M  1.5M  388M   1% /run
/dev/mapper/ubuntu--vg-ubuntu--lv                            48G  7.6G   38G  17% /
tmpfs                                                       1.9G     0  1.9G   0% /dev/shm
tmpfs                                                       5.0M     0  5.0M   0% /run/lock
tmpfs                                                       1.9G     0  1.9G   0% /sys/fs/cgroup
/dev/sda2                                                   2.0G  109M  1.7G   6% /boot
/dev/loop2                                                   92M   92M     0 100% /snap/lxd/29619
/dev/loop1                                                   50M   50M     0 100% /snap/snapd/18357
/dev/loop0                                                   64M   64M     0 100% /snap/core20/1828
/dev/loop4                                                   92M   92M     0 100% /snap/lxd/24061
/dev/loop3                                                   45M   45M     0 100% /snap/snapd/23258
/dev/loop5                                                   64M   64M     0 100% /snap/core20/2434
tmpfs                                                       389M     0  389M   0% /run/user/0
192.168.10.91:6789,192.168.10.92:6789,192.168.10.93:6789:/   48G     0   48G   0% /data
```

### client2挂载
```bash
root@ceph-client2:~# mkdir /data
root@ceph-client2:~# mount -t ceph 192.168.10.91:6789,192.168.10.92:6789,192.168.10.93:6789:/ /data -o name=fs,secretfile=/etc/ceph/fs.key
root@ceph-client2:~# df -h
Filesystem                                                  Size  Used Avail Use% Mounted on
udev                                                        1.9G     0  1.9G   0% /dev
tmpfs                                                       389M  1.5M  388M   1% /run
/dev/mapper/ubuntu--vg-ubuntu--lv                            48G  7.6G   38G  17% /
tmpfs                                                       1.9G     0  1.9G   0% /dev/shm
tmpfs                                                       5.0M     0  5.0M   0% /run/lock
tmpfs                                                       1.9G     0  1.9G   0% /sys/fs/cgroup
/dev/loop0                                                   64M   64M     0 100% /snap/core20/1828
/dev/loop1                                                   92M   92M     0 100% /snap/lxd/29619
/dev/loop2                                                   92M   92M     0 100% /snap/lxd/24061
/dev/sda2                                                   2.0G  109M  1.7G   6% /boot
/dev/loop3                                                   50M   50M     0 100% /snap/snapd/18357
tmpfs                                                       389M     0  389M   0% /run/user/0
/dev/loop4                                                   45M   45M     0 100% /snap/snapd/23258
/dev/loop5                                                   64M   64M     0 100% /snap/core20/2434
192.168.10.91:6789,192.168.10.92:6789,192.168.10.93:6789:/   48G     0   48G   0% /data
```

### 验证主机数据共享
```bash
# client2写入数据
root@ceph-client2:/data# echo "hello cephfs" > test.log
root@ceph-client2:/data# cat test.log 
hello cephfs
 
# client1正常查看数据，并修改
root@ceph-client:/data# ls
test.log
root@ceph-client:/data# cat test.log 
hello cephfs
root@ceph-client:/data# mv test.log test.txt
root@ceph-client:/data# ls
test.txt
 
# client2查看显示原文件名已修改
root@ceph-client2:/data# ls
test.txt
```

## secret 方式多主机挂载
### 取消挂载
```bash
root@ceph-client:~# umount /data
root@ceph-client2:~# umount /data
```

### secret挂载
直接以secret文件内容（key）方式挂载

```bash
# 查看key内容
root@ceph-client:~# cat /etc/ceph/fs.key
AQC/FVBnFzdqFRAAcv+wHeuiZCgOxfAH9jzzqA==
 
# 以secret形式挂载
root@ceph-client:~# mount -t ceph 192.168.10.91:6789,192.168.10.92:6789,192.168.10.93:6789:/ /data -o name=fs,secret=AQC/FVBnFzdqFRAAcv+wHeuiZCgOxfAH9jzzqA==
root@ceph-client:~# df -h
Filesystem                                                  Size  Used Avail Use% Mounted on
udev                                                        1.9G     0  1.9G   0% /dev
tmpfs                                                       389M  1.5M  388M   1% /run
/dev/mapper/ubuntu--vg-ubuntu--lv                            48G  7.7G   38G  17% /
tmpfs                                                       1.9G     0  1.9G   0% /dev/shm
tmpfs                                                       5.0M     0  5.0M   0% /run/lock
tmpfs                                                       1.9G     0  1.9G   0% /sys/fs/cgroup
/dev/sda2                                                   2.0G  109M  1.7G   6% /boot
/dev/loop2                                                   92M   92M     0 100% /snap/lxd/29619
/dev/loop1                                                   50M   50M     0 100% /snap/snapd/18357
/dev/loop0                                                   64M   64M     0 100% /snap/core20/1828
/dev/loop4                                                   92M   92M     0 100% /snap/lxd/24061
/dev/loop3                                                   45M   45M     0 100% /snap/snapd/23258
/dev/loop5                                                   64M   64M     0 100% /snap/core20/2434
tmpfs                                                       389M     0  389M   0% /run/user/0
192.168.10.91:6789,192.168.10.92:6789,192.168.10.93:6789:/   48G     0   48G   0% /data

# client2同样的操作
root@ceph-client2:~# mount -t ceph 192.168.10.91:6789,192.168.10.92:6789,192.168.10.93:6789:/ /data -o name=fs,secret=AQC/FVBnFzdqFRAAcv+wHeuiZCgOxfAH9jzzqA==
root@ceph-client2:~# df -h
Filesystem                                                  Size  Used Avail Use% Mounted on
udev                                                        1.9G     0  1.9G   0% /dev
tmpfs                                                       389M  1.5M  388M   1% /run
/dev/mapper/ubuntu--vg-ubuntu--lv                            48G  7.9G   38G  18% /
tmpfs                                                       1.9G     0  1.9G   0% /dev/shm
tmpfs                                                       5.0M     0  5.0M   0% /run/lock
tmpfs                                                       1.9G     0  1.9G   0% /sys/fs/cgroup
/dev/loop0                                                   64M   64M     0 100% /snap/core20/1828
/dev/loop1                                                   92M   92M     0 100% /snap/lxd/29619
/dev/loop2                                                   92M   92M     0 100% /snap/lxd/24061
/dev/sda2                                                   2.0G  211M  1.6G  12% /boot
/dev/loop3                                                   50M   50M     0 100% /snap/snapd/18357
tmpfs                                                       389M     0  389M   0% /run/user/0
/dev/loop4                                                   45M   45M     0 100% /snap/snapd/23258
/dev/loop5                                                   64M   64M     0 100% /snap/core20/2434
192.168.10.91:6789,192.168.10.92:6789,192.168.10.93:6789:/   48G     0   48G   0% /data
```

### 验证数据挂载
略

## 设置自动开机挂载
```bash
root@ceph-client:~# cat /etc/fstab 
# 添加该行
192.168.10.91:6789,192.168.10.92:6789,192.168.10.93:6789:/   /data   ceph   name=fs,secretfile=/etc/ceph/fs.key   0   0
 
# reboot重启验证
root@ceph-client:~# df -h
Filesystem                                                  Size  Used Avail Use% Mounted on
udev                                                        1.9G     0  1.9G   0% /dev
tmpfs                                                       389M  1.5M  388M   1% /run
/dev/mapper/ubuntu--vg-ubuntu--lv                            48G  7.7G   38G  17% /
tmpfs                                                       1.9G     0  1.9G   0% /dev/shm
tmpfs                                                       5.0M     0  5.0M   0% /run/lock
tmpfs                                                       1.9G     0  1.9G   0% /sys/fs/cgroup
/dev/sda2                                                   2.0G  109M  1.7G   6% /boot
/dev/loop1                                                   92M   92M     0 100% /snap/lxd/29619
/dev/loop0                                                   64M   64M     0 100% /snap/core20/2434
/dev/loop2                                                   50M   50M     0 100% /snap/snapd/18357
/dev/loop4                                                   64M   64M     0 100% /snap/core20/1828
/dev/loop3                                                   92M   92M     0 100% /snap/lxd/24061
/dev/loop5                                                   45M   45M     0 100% /snap/snapd/23258
192.168.10.91:6789,192.168.10.92:6789,192.168.10.93:6789:/   48G     0   48G   0% /data
tmpfs                                                       389M     0  389M   0% /run/user/0
```


