# Cephadm集群部署

> 分类：Ceph / 第2章：Ceph集群部署与k8s使用
> 原文：https://www.cuiliangblog.cn/detail/section/192020453
> 来源：崔亮的博客

---

# 准备工作
## 部署方式
### 手动部署
手动部署 Ceph 适用于深度了解 Ceph 配置文件和内部工作原理的环境，一般用于实验和学习，或在高度自定义的场景下使用。

### 使用 Ceph Ansible 自动化部署
Ceph Ansible 是一个官方提供的 Ansible Playbook，用于在多节点环境中自动化部署 Ceph，非常适合需要快速、标准化部署的用户。

### 使用 Cephadm 部署（推荐方式）
Cephadm 是 Ceph 官方自 Ceph Octopus (v15) 版本引入的容器化部署工具，使用容器化的方式管理和部署 Ceph 集群，支持生命周期管理。参考文档：[https://docs.ceph.com/en/quincy/cephadm/install/#cephadm-deploying-new-cluster](https://docs.ceph.com/en/quincy/cephadm/install/#cephadm-deploying-new-cluster)

### 使用 Rook 部署在 Kubernetes 中
Rook 是一个开源项目，帮助在 Kubernetes 中以 Operator 方式管理 Ceph 集群。它为 Kubernetes 环境中的用户提供持久化存储。

## 集群规划
| 主机名 | <font style="color:#404040;">IP</font> | 配置 | 磁盘空间 |
| --- | --- | --- | --- |
| ceph-1 | <font style="color:#404040;">192.168.10.91</font> | 4C4G | sda（50G，安装系统）sdb（50G，不格式化） |
| ceph-2 | 192.168.10.92 | 4C4G | sda（50G，安装系统） sdb（50G，不格式化） |
| ceph-3 | 192.168.10.93 | <font style="color:#404040;">4C4G</font> | sda（50G，安装系统） sdb（50G，不格式化） |


## 系统初始化配置
+ 修改主机名
+ 添加hosts解析
+ 配置时间同步
+ 关闭防火墙、seLinux
+ 安装docker(如果k8s容器运行时是containerd也可安装docker，不会影响k8s)。需要注意的是cephadm会安装node export占用9100端口，需要修改。
+ 挂载数据盘，不要格式化

# ceph集群部署
ceph版本列表：[https://docs.ceph.com/en/latest/releases/#active-releases](https://docs.ceph.com/en/latest/releases/#active-releases)

离线包下载地址：[https://mirrors.ustc.edu.cn/ceph/](https://mirrors.ustc.edu.cn/ceph/)

以下操作所有ceph节点执行，参考文档：[https://docs.ceph.com/en/quincy/cephadm/install/#install-cephadm](https://docs.ceph.com/en/quincy/cephadm/install/#install-cephadm)

18.2.x版本代号为reef，19.2.x版本代号为squid，不同版本按需修改代号既可。

需要注意的是官方仓库并未提供 18.2、19.2 版本 rhel7 和 8 的软件包，所以推荐使用 ubuntu 或者 rhel9 系统安装。

## <font style="color:rgb(0, 0, 0);background-color:rgb(250, 250, 250);">安装cephadm(Debian)</font>
以 Ubuntu20 系统安装 ceph  18.2 为例：

```bash
root@ceph-1:~# cat > /etc/apt/sources.list.d/ceph.list << EOF
deb https://mirrors.ustc.edu.cn/ceph/debian-reef/ focal main 
EOF
root@ceph-1:~# wget -q -O- 'https://mirrors.ustc.edu.cn/ceph/keys/release.asc' | sudo apt-key add -
root@ceph-1:~# apt update && apt install cephadm -y
root@ceph-1:~# cephadm version
cephadm version 18.2.4 (e7ad5345525c7aa95470c26863873b581076945d) reef (stable)
```

## 安装cephadm(RHEL)
例如 rockylinux9 系统，安装 ceph 版本为 19.2，则 yum源配置如下：

```bash
[root@ceph-1 ~]# vim /etc/yum.repos.d/ceph.repo
[ceph-reef]
name=ceph-reef
baseurl=https://mirrors.ustc.edu.cn/ceph/rpm-squid/el9/x86_64/
gpgcheck=0
[ceph-noarch]
name=cephnoarch
baseurl=https://mirrors.ustc.edu.cn/ceph/rpm-squid/el9/noarch/
gpgcheck=0
[root@ceph-1 ~]# dnf install cephadm -y
```

## 拉取镜像
> 以下操作所有ceph节点执行
>

```bash
[root@ceph-1 ~]# cephadm pull
Pulling container image quay.io/ceph/ceph:v18...
{
    "ceph_version": "ceph version 18.2.4 (e7ad5345525c7aa95470c26863873b581076945d) reef (stable)",
    "image_id": "2bc0b0f4375ddf4270a9a865dfd4e53063acc8e6c3afd7a2546507cafd2ec86a",
    "repo_digests": [
        "quay.io/ceph/ceph@sha256:6ac7f923aa1d23b43248ce0ddec7e1388855ee3d00813b52c3172b0b23b37906"
    ]
}
[root@ceph-1 ~]# docker images
REPOSITORY          TAG       IMAGE ID       CREATED        SIZE
quay.io/ceph/ceph   v18       2bc0b0f4375d   4 months ago   1.22GB
```

## 初始化集群
> 保证8293、8765、8443端口未被占用
>

```bash
[root@ceph-1 ~]# cephadm bootstrap --mon-ip 192.168.10.91 --cluster-network 192.168.10.0/24 --allow-fqdn-hostname
# 初始化完成终端打印如下内容：
Ceph Dashboard is now available at:
             URL: https://ceph-1:8443/
            User: admin
        Password: CHANGE_ME
```

| 参数 | 说明 |
| --- | --- |
| –mon-ip | 指定第一个monitor的ip，即对外提供服务的ip地址 |
| –cluster-network | 指定集群子网， 该子网用于集群数据复制、数据重均衡、数据回复等。 |
| –allow-fqdn-hostname | 允许解析节点主机名 |


## 访问验证
![](assets/12-Ceph/76b636e00aeb9cba2e7f.png)

## 安装ceph命令行工具
```bash
[root@ceph-1 ~]# cephadm install ceph-common
# 或者使用apt命令安装
[root@ceph-1 ~]# apt install ceph-common
```

# 集群管理
## <font style="color:rgb(38, 38, 38);">添加节点</font>
<font style="color:rgb(38, 38, 38);">查看ceph集群现在的主机</font>

```bash
root@ceph-1:~# ceph orch host ls
HOST    ADDR           LABELS  STATUS  
ceph-1  192.168.10.91  _admin          
1 hosts in cluster
```

<font style="color:rgb(38, 38, 38);">在初始化后，cephadm会生成一对ssh密钥，存放在/etc/ceph/目录。组成集群需要k8s-1免密登录其他机器。  
</font><font style="color:rgb(38, 38, 38);">执行以下命令，把秘钥放到其他节点上</font>

```bash
root@ceph-1:~# ssh-copy-id -f -i /etc/ceph/ceph.pub ceph-2
root@ceph-1:~# ssh-copy-id -f -i /etc/ceph/ceph.pub ceph-3
```

### <font style="color:rgb(38, 38, 38);">dashboard添加主机</font>
![](assets/12-Ceph/b8ab83ed02750bb9bb34.png)

### <font style="color:rgb(38, 38, 38);">命令行添加主机</font>
```bash
root@ceph-1:~# ceph orch host add ceph-3 192.168.10.93
Added host 'ceph-3' with addr '192.168.10.93'
```

### <font style="color:rgb(38, 38, 38);">节点添加标签</font>
<font style="color:rgb(38, 38, 38);">查看集群主机列表</font>

```bash
root@ceph-1:~# ceph orch host ls
HOST    ADDR           LABELS  STATUS  
ceph-1  192.168.10.91  _admin          
ceph-2  192.168.10.92                  
ceph-3  192.168.10.93                  
3 hosts in cluster
```

节点添加admin标签

```plain
root@ceph-1:~# ceph orch host label add ceph-2 _admin
Added label _admin to host ceph-2
root@ceph-1:~# ceph orch host label add ceph-3 _admin
Added label _admin to host ceph-3
root@ceph-1:~# ceph orch host ls
HOST    ADDR           LABELS  STATUS  
ceph-1  192.168.10.91  _admin          
ceph-2  192.168.10.92  _admin          
ceph-3  192.168.10.93  _admin          
3 hosts in cluster
```

这样其他节点也可以使用ceph命令管理集群。

## <font style="color:rgb(38, 38, 38);">添加OSD设备</font>
> OSD设备必须满足未被格式化和空间大于5GB。
>

查看osd设备列表

```bash
root@ceph-1:~# ceph orch device ls
HOST    PATH      TYPE  DEVICE ID   SIZE  AVAILABLE  REFRESHED  REJECT REASONS  
ceph-1  /dev/sdb  hdd              50.0G  Yes        3m ago   
ceph-2  /dev/sdb  hdd              50.0G  Yes        3m ago                     
ceph-3  /dev/sdb  hdd              50.0G  Yes        3m ago
```

添加OSD设备到集群

### dashboard添加设备
![](assets/12-Ceph/919cc98bc4343db5b93a.png)

### 命令行添加设备
```bash
root@ceph-1:~# ceph orch daemon add osd ceph-1:/dev/sdb
```

<font style="color:rgb(38, 38, 38);">查看OSD信息</font>

```bash
root@ceph-1:~# ceph osd tree
ID  CLASS  WEIGHT   TYPE NAME        STATUS  REWEIGHT  PRI-AFF
-1         0.14639  root default                              
-3         0.04880      host ceph-1                           
 0    hdd  0.04880          osd.0        up   1.00000  1.00000
-5         0.04880      host ceph-2                           
 1    hdd  0.04880          osd.1        up   1.00000  1.00000
-7         0.04880      host ceph-3                           
 2    hdd  0.04880          osd.2        up   1.00000  1.00000
```

<font style="color:rgb(38, 38, 38);">字段说明：</font>

| 字段 | 说明 |
| --- | --- |
| ID | 表示设备或节点的唯一标识符，负值表示聚合节点（如 root或 host），正值代表具体的 OSD。 |
| CLASS | 存储设备的类型，比如 hdd（机械硬盘）、ssd（固态硬盘）。如果没有显示，通常表示设备的类型没有分类。 |
| WEIGHT    | OSD 在数据分布和权重计算中的权重值，通常基于设备的存储容量。WEIGHT值越高，表示该 OSD 可以存储更多的数据。 |
| TYPE | 节点类型，root表示根节点，host表示主机，osd表示具体的对象存储守护进程（OSD）。 |
| NAME | 节点名称或 OSD 守护进程名称，如k8s1表示主机名，osd.0表示 OSD 守护进程编号。 |
| STATUS | 显示 OSD 的状态，up表示 OSD 正在运行，down表示 OSD 已关闭或无法访问。 |
| REWEIGHT | OSD 的动态权重，用于手动调整数据分布。如果需要减小或增加某个 OSD 的数据分布，可以通过调节此值。通常为 1.00000，表示正常权重。 |
| PRI-AFF | 表示 OSD 的主优先级关联，通常用于调节数据在 OSD 之间的读取优先级。值为 1.00000表示正常优先级。 |


## <font style="color:rgb(38, 38, 38);">查看验证</font>
<font style="color:rgb(38, 38, 38);">查看设备状态</font>

```bash
root@ceph-1:~# lsblk -o NAME,FSTYPE,MOUNTPOINT /dev/sdb
NAME                                                                                                  FSTYPE         MOUNTPOINT
sdb                                                                                                   LVM2_member
└─ceph--cfd5c428--cb97--47bb--afde--289c9e001492-osd--block--76104b5e--6825--43c6--93bb--0227ebf1fb2e ceph_bluestore
```

<font style="color:rgb(38, 38, 38);">/dev/sdb设备被格式化为lvm格式，将一个设备规划成一个PV、VG和LV，命名格式是VG+LV</font>

```bash
root@ceph-1:~# pvs
  PV         VG                                        Fmt  Attr PSize   PFree 
  /dev/sda3  ubuntu-vg                                 lvm2 a--  <98.00g 49.00g
  /dev/sdb   ceph-cfd5c428-cb97-47bb-afde-289c9e001492 lvm2 a--  <50.00g     0
root@ceph-1:~# vgs
  VG                                        #PV #LV #SN Attr   VSize   VFree 
  ceph-cfd5c428-cb97-47bb-afde-289c9e001492   1   1   0 wz--n- <50.00g     0
  ubuntu-vg                                   1   1   0 wz--n- <98.00g 49.00g
root@ceph-1:~# lvs
  LV                                             VG                                        Attr       LSize   Pool Origin Data%  Meta%  Move Log Cpy%Sync Convert
  osd-block-76104b5e-6825-43c6-93bb-0227ebf1fb2e ceph-cfd5c428-cb97-47bb-afde-289c9e001492 -wi-ao---- <50.00g
  ubuntu-lv                                      ubuntu-vg                                 -wi-ao---- <49.00g
```

<font style="color:rgb(38, 38, 38);">新版Ceph默认是使用bluestore引擎，osd格式化后挂载到主机的/var/lib/ceph/<Ceph_Cluster_ID>/osd.<OSD_ID>/目录中。 指定osd0路径，执行命令查看：</font>

```plain
root@ceph-1:~# ll /var/lib/ceph/36ab3dfa-95b4-11ef-be0d-cb69477823ce/osd.1/                                                                                                                                                                 
total 72                                                                                                                                                                                                                                   
drwx------  2 167 167 4096 Oct 29 14:58 ./                                                                                                                                                                                                 
drwx------ 12 167 167 4096 Oct 29 14:58 ../                                                                                                                                                                                                
lrwxrwxrwx  1 167 167  111 Oct 29 14:58 block -> /dev/mapper/ceph--cfd5c428--cb97--47bb--afde--289c9e001492-osd--block--76104b5e--6825--43c6--93bb--0227ebf1fb2e                                                                           
-rw-------  1 167 167   37 Oct 29 14:58 ceph_fsid                                                                                                                                                                                          
-rw-------  1 167 167  277 Oct 29 14:58 config                                                                                                                                                                                             
-rw-------  1 167 167   37 Oct 29 14:58 fsid                                                                                                                                                                                               
-rw-------  1 167 167   55 Oct 29 14:58 keyring                                                                                                                                                                                            
-rw-------  1 167 167    6 Oct 29 14:58 ready                                                                                                                                                                                              
-rw-------  1 167 167    3 Oct 29 14:58 require_osd_release                                                                                                                                                                                
-rw-------  1 167 167   10 Oct 29 14:58 type                                                                                                                                                                                               
-rw-------  1 167 167   38 Oct 29 14:58 unit.configured                                                                                                                                                                                    
-rw-------  1 167 167   48 Oct 29 14:58 unit.created                                                                                                                                                                                       
-rw-------  1 167 167   90 Oct 29 14:58 unit.image                                                                                                                                                                                         
-rw-------  1 167 167  375 Oct 29 14:58 unit.meta                                                                                                                                                                                          
-rw-------  1 167 167 1639 Oct 29 14:58 unit.poststop                                                                                                                                                                                      
-rw-------  1 167 167 2817 Oct 29 14:58 unit.run                                                                                                                                                                                           
-rw-------  1 167 167  330 Oct 29 14:58 unit.stop                                                                                                                                                                                          
-rw-------  1 167 167    2 Oct 29 14:58 whoami
```

<font style="color:rgb(38, 38, 38);">目录结构说明：</font>

| **<font style="color:rgb(38, 38, 38);">目录</font>**<font style="color:rgb(38, 38, 38);"></font> | **<font style="color:rgb(38, 38, 38);">说明</font>**<font style="color:rgb(38, 38, 38);"></font> | **<font style="color:rgb(38, 38, 38);">作用</font>**<font style="color:rgb(38, 38, 38);"></font> |
| --- | --- | --- |
| <font style="color:rgb(38, 38, 38);">block</font> | <font style="color:rgb(38, 38, 38);">指向实际存储数据的 </font>**<font style="color:rgb(38, 38, 38);">块设备</font>**<font style="color:rgb(38, 38, 38);">（/dev/ceph-xxxx/osd-block-xxxx）。</font> | <font style="color:rgb(38, 38, 38);">该链接指向 OSD 数据存储的物理卷或逻辑卷。在 </font>**<font style="color:rgb(38, 38, 38);">BlueStore</font>**<font style="color:rgb(38, 38, 38);"> 引擎中，数据会直接写入块设备，而不通过文件系统，这可以提高性能。</font> |
| <font style="color:rgb(38, 38, 38);">ceph_fsid</font> | <font style="color:rgb(38, 38, 38);">文件内容是集群的 FSID（文件系统 ID），即整个 Ceph 集群的唯一标识符。</font> | <font style="color:rgb(38, 38, 38);">用于标识该 OSD 所属的 Ceph 集群。每个 Ceph 集群都有一个唯一的 FSID，所有 OSD 和守护进程会使用这个 FSID 来确认它们属于同一个集群。</font> |
| <font style="color:rgb(38, 38, 38);">config</font> | <font style="color:rgb(38, 38, 38);">这是 OSD 的配置文件，其中包含 Ceph OSD 守护进程的具体配置参数。</font> | <font style="color:rgb(38, 38, 38);">该文件包含了 OSD 的运行参数和配置选项。这些设置通常是由 ceph.conf   </font><font style="color:rgb(38, 38, 38);"> 继承的，可以覆盖或调整 OSD 的个性化配置。</font> |
| <font style="color:rgb(38, 38, 38);">fsid</font> | <font style="color:rgb(38, 38, 38);">这是 OSD 自身的 FSID（文件系统 ID），与 ceph_fsid不同，它是唯一标识该 OSD 的 UUID。</font> | <font style="color:rgb(38, 38, 38);">这个文件保存了每个 OSD 自己的 UUID，这对于 Ceph 集群管理和识别 OSD 非常重要。</font> |
| <font style="color:rgb(38, 38, 38);">keyring</font> | <font style="color:rgb(38, 38, 38);">OSD 使用的身份认证密钥。</font> | <font style="color:rgb(38, 38, 38);">该文件包含 OSD 用于与其他 Ceph 守护进程（如 MON、MDS）进行认证和通信的密钥。Ceph 使用这种方式确保集群中的各个组件之间的通信是安全的。</font> |
| <font style="color:rgb(38, 38, 38);">ready</font> | <font style="color:rgb(38, 38, 38);">标志文件，用于指示 OSD 已经准备好运行。</font> | <font style="color:rgb(38, 38, 38);">Ceph 启动 OSD 时会检查该文件是否存在，文件内容通常为 1，表示 OSD 已经准备好。如果没有这个文件，OSD 不会被标记为 “ready” 状态。</font> |
| <font style="color:rgb(38, 38, 38);">type</font> | <font style="color:rgb(38, 38, 38);">表示 OSD 使用的存储类型。</font> | <font style="color:rgb(38, 38, 38);">这个文件的内容通常是 bluestore，表示该 OSD 使用的是 BlueStore 存储引擎。</font> |
| <font style="color:rgb(38, 38, 38);">unit.* 系列文件</font> | <font style="color:rgb(38, 38, 38);">这些文件是与 systemd 相关的服务管理文件，主要用于跟踪和控制 OSD 守护进程的状态。</font> | <font style="color:rgb(38, 38, 38);">帮助 Ceph 通过 systemd来管理 OSD 的生命周期，跟踪 OSD 守护进程的启动、停止和运行状态。</font> |
| <font style="color:rgb(38, 38, 38);">whoami</font> | <font style="color:rgb(38, 38, 38);">文件内容为该 OSD 的编号。</font> | <font style="color:rgb(38, 38, 38);">这个文件存储了 OSD 的唯一编号（如文件内容 0表示 osd.0），Ceph 通过该编号识别 OSD。这个文件确保 OSD 的编号与 Ceph 集群中的 OSD ID 一致。</font> |


<font style="color:rgb(38, 38, 38);">查看集群的状态</font>

```bash
root@ceph-1:~# ceph -s
  cluster:
    id:     8e04b1c8-ad9f-11ef-a78d-07c031166f43 # Ceph 集群的唯一标识符（UUID）。这个 ID 在集群中每个节点上都是一致的，用于标识集群
    health: HEALTH_OK # 表示集群的健康状态

  services:
    mon: 3 daemons, quorum ceph-1,ceph-3,ceph-2 (age 2m) # 显示当前有 3 个 Monitor 守护进程，这些监控节点组成了仲裁（quorum），它们共同负责 Ceph 集群的状态管理和集群成员关系的协调。
    mgr: ceph-1.xklufv(active, since 2m), standbys: ceph-3.yjdakp # 显示有一个 Manager 守护进程，运行在ceph-1上，并且标记为 active，表示它是当前的活跃管理节点，管理集群监控、统计和调度功能。
    osd: 3 osds: 3 up (since 26s), 3 in (since 40s) # 显示集群中有3个 OSD 守护进程，所有的 OSD 都处于 up（运行状态）和 in（集群中）状态。

  data:
    pools:   1 pools, 1 pgs # 集群中有 1 个池（pool）。池是 Ceph 存储数据的逻辑分区，通常用来组织和管理存储对象。
    objects: 2 objects, 449 KiB # 集群中存储了 2 个对象，共计占用 449 KiB 的存储空间。Ceph 将数据对象分布到 OSD 中，并对这些对象进行存储管理。
    usage:   81 MiB used, 150 GiB / 150 GiB avail # 集群总共使用了 81MiB 的存储空间，当前可用存储空间为150GiB，总存储容量为150GiB。
    pgs:     1 active+clean # 显示集群中有 1 个 PG（Placement Group，放置组），PG 是 Ceph 数据分布的基本单元。PG 用于在 OSD 之间分布数据，1 个 PG 表示存储数据的分片数较少，适合小型集群。
```


