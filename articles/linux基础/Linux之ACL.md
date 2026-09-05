## ACL权限

### 1\. 什么是ACL

ACL(Access Control List)，访问控制列表。

那么这玩意有啥用处呢？下面我们考虑一种场景：

> 假设我Jimmy创建了一个项目文件夹，我和我的开发团队Rocket对该目录均具备 **`rwx`** 的权限，因为我该文件夹下有源码等，不能对外开放，所以对其他用户的权限为0，即我的文件夹目录为 **`drwxrwx---`**;
> 
> 然而有一天，我的一个灰常好的盆友Sherry想要看一下我的项目，看看我写的代码有多流弊，然而我不好意思拒绝，这个时候我有三种选择：
> 
> 1.  让其成为所有者(这个当然不可能)
> 2.  让其成为项目组成员(然而她并没有参与开发，再说她也基本看不懂代码，万一不小心删掉了部分代码咋弄？)
> 3.  给其它人赋以 **`r-x`** 的权限(然而，other用户太多了吧，万一我代码没发布就被竞争对手给copy了呢？)  
>     看来，以上三种手段都不靠谱啊，怪就怪other的用户全太大了，唉，这可咋整？

那么，我们为什么不为Sherry开小灶呢？就是让其不属于任何一个组，只是以单用户的身份被赋予特定权限。

这种“开小灶”的方式，其实就是ACL权限！

![](assets/linux基础/Linux之ACL/Linux之ACL-1.jpeg)

**ACL可以针对单一用户、单一文件或目录来进行r、w、x的权限设置，对于需要特殊权限的使用状况非常有帮助**

### 2\. ACL的操作

#### 0). 查看系统是否支持ACL

首先，我们看一下自己的Linux系统存在着那些硬盘：

```plain
[niesh@niesh ~]$ df -Th
文件系统                      类型      容量  已用  可用 已用% 挂载点
/dev/mapper/centos_niesh-root xfs        18G  8.5G  9.1G   49% /
devtmpfs                      devtmpfs  348M     0  348M    0% /dev
tmpfs                         tmpfs     363M   84K  363M    1% /dev/shm
tmpfs                         tmpfs     363M  5.5M  358M    2% /run
tmpfs                         tmpfs     363M     0  363M    0% /sys/fs/cgroup
/dev/sda1                     xfs       497M  158M  339M   32% /boot
.host:/                       vmhgfs    271G   42G  229G   16% /mnt/hgfs
tmpfs                         tmpfs      73M   16K   73M    1% /run/user/42
tmpfs                         tmpfs      73M     0   73M    0% /run/user/1000
```

根目录(/)的挂载点此处为`/dev/mapper/centos_niesh-root`，我们可以查看其是否支持ACL权限

```plain
[root@niesh ~]# dumpe2fs -h /dev/centos_niesh/root
dumpe2fs 1.42.9 (28-Dec-2013)
dumpe2fs: Bad magic number in super-block 当尝试打开 /dev/centos_niesh/root 时
找不到有效的文件系统超级块.
```

很郁闷，居然报这个错误，查了很多资料，发现`dumpe2fs`命令为ext文件系统家族的命令，我的系统为CentOS7，文件系统为**XFS**，**XFS**默认支持ACL：

```plain
[root@niesh ~]# lsb_release -a
LSB Version:    :core-4.1-amd64:core-4.1-noarch:cxx-4.1-amd64:cxx-4.1-noarch:desktop-4.1-amd64:desktop-4.1-noarch:languages-4.1-amd64:languages-4.1-noarch:printing-4.1-amd64:printing-4.1-noarch
Distributor ID: CentOS
Description:    CentOS Linux release 7.2.1511 (Core)
Release:        7.2.1511
Codename:       Core
[root@niesh ~]# df -Th
文件系统                      类型      容量  已用  可用 已用% 挂载点
/dev/mapper/centos_niesh-root xfs        18G  8.5G  9.1G   49% /
```

可以使用 `xfs_info /dev/xxx`查看'XFS\`文件系统信息：

```plain
[root@niesh ~]# xfs_info /dev/centos_niesh/root
meta-data=/dev/mapper/centos_niesh-root isize=256    agcount=4, agsize=1144832 blks
         =                       sectsz=512   attr=2, projid32bit=1
         =                       crc=0        finobt=0
data     =                       bsize=4096   blocks=4579328, imaxpct=25
         =                       sunit=0      swidth=0 blks
naming   =version 2              bsize=4096   ascii-ci=0 ftype=0
log      =internal               bsize=4096   blocks=2560, version=2
         =                       sectsz=512   sunit=0 blks, lazy-count=1
realtime =none                   extsz=4096   blocks=0, rtextents=0
```

但是，貌似看不到是否支持**ACL**权限，我也只能这样了 \*（谁知道怎么查看请留言告诉我，不胜感激） \* ！

#### 1). 安装ACL

系统默认的是不会安装ACL权限的，因此需要我们自己动手：

> -   **RPM 包**：  
>     前提：能够获取到系统安装包  
>     命令：rpm -ivh libacl-x.x.xx-x.x acl-x.x.xx-x.x.rpm
> -   **yum**:  
>     前提：主机已经联网，且yum可用  
>     命令：yum -y insatll libacl acl

![](assets/linux基础/Linux之ACL/Linux之ACL-2.jpeg)

#### 2). 开启ACL

首先，我们查看一下我们Linux系统的ACL权限有没有开启：

使用 `mount`命令：

```plain
[root@niesh ~]# mount
/dev/mapper/centos_niesh-root on / type xfs (rw,relatime,seclabel,attr2,inode64,noquota)
selinuxfs on /sys/fs/selinux type selinuxfs (rw,relatime)
systemd-1 on /proc/sys/fs/binfmt_misc type autofs (rw,relatime,fd=34,pgrp=1,timeout=300,minproto=5,maxproto=5,direct)
```

很明显，/dev/mapper/centos\_nie-root没有ACL权限，我们需要自己手动开启。

开启的方式有两种：

> -   **命令开启**  
>     命令： mount -o remount,acl /  
>     特点：临时性，重启失效
> -   **文件开启**  
>     命令： vim /etc/fstab  
>     特点：永久开启

![](assets/linux基础/Linux之ACL/Linux之ACL-3.jpeg)

完成修改后，需要重启或者重新挂载你设置的分区，此处我需要重新挂载根分区：

> -   **挂载**： mount -o remount /
> -   **重启**： restart

#### 3). ACL文件设置

最常用的有以下2个命令：

> -   **getfacl**: 获取文件或目录的ACL设置信息  
>     命令： getfacl [-bkndRLP] { -m|-M|-x|-X ... } file ...  
>     参数：
> 
> \-a , --access：显示文件或目录的访问控制列表
> 
> \-d , --default：显示文件或目录的默认（缺省）的访问控制列表
> 
> \-c , --omit-header：不显示默认的访问控制列表
> 
> \-R , --recursive：操作递归到子目录
> 
> -   **setfacl**: 设置文件或目录的ACL设置信息  
>     命令：setfacl [-bkndRLP] { -m|-M|-x|-X ... } file ...  
>     参数：
> 
> \-m, --modify=acl：修改文件或目录的扩展ACL设置信息
> 
> \-x, --remove=acl：从文件或目录删除一个扩展的ACL设置信息
> 
> \-b, --remove-all：删除所有的扩展的ACL设置信息
> 
> \-k, --remove-default：删除缺省的acl设置信息
> 
> \-n, --no-mask：不要重新计算有效权限。setfacl默认会重新计算ACL mask，除非mask被明确的制定
> 
> \-d, --default：设置默认的ACL设置信息（只对目录有效）
> 
> \-R, --recursive：操作递归到所有子目录和 文件

针对我们最开始讨论问题，此处我们进行实战练习。

首先，我建立一个目录Project：

```plain
[niesh@niesh tmp]$ mkdir -m 770 Project
[niesh@niesh tmp]$ ll
总用量 0
drwxrwx---. 2 niesh niesh 6 7月  28 15:44 Project
```

其次，我增加一个新用户叫做Sherry：

```plain
[root@niesh ~]# useradd Sherry
[root@niesh ~]# passwd Sherry
[root@niesh ~]#
```

再次，查看我和Sherry分别属于哪一个组：

```plain
[root@niesh ~]# groups Sherry
Sherry : Sherry
[root@niesh ~]# groups niesh
niesh : niesh wheel
```

很明显我俩不属于同一个组，因此Sherry对我建立的 Project 目录不具备任何权限：

```plain
[Sherry@niesh tmp]$ cd Project/
bash: cd: Project/: 权限不够
[Sherry@niesh tmp]$ ^C
[Sherry@niesh tmp]$ ll Project/
ls: 无法打开目录Project/: 权限不够
```

然后，我增加Sherry的ACL权限：

```plain
[niesh@niesh tmp]$ setfacl -m u:Sherry:rx Project/
[niesh@niesh tmp]$ ll
总用量 4
drwxrwx---+ 2 niesh niesh 6 7月  28 15:44 Project
```

看到了吧，以上权限第11位有一个 `+` 号，代表的就是ACL权限

#### 4). 查看ACL权限

我们可以使用 `getfacl`命令查看刚才设置好的权限：

设置之前：

```plain
[niesh@niesh tmp]$ getfacl Project/
# file: Project/
# owner: niesh
# group: niesh
user::rwx
group::rwx
other::---
```

设置之后：

```plain
[niesh@niesh tmp]$ getfacl Project/
# file: Project/
# owner: niesh
# group: niesh
user::rwx
user:Sherry:r-x
group::rwx
mask::rwx
other::---
```

多了几行：

> -   user:Sherry:r-x: 表示Sherry具备的ACL权限为 r-x
> -   mask::rwx: 表示ACL的最大权限，用你分配给用户的权限与mask相与（类似于子网掩码）

#### 5). 删除ACL

采用 `setfacl -d <dir>`命令：

```plain
[niesh@niesh tmp]$ setfacl -b Project/
[niesh@niesh tmp]$ ll
总用量 0
drwxrwx---. 2 niesh niesh 6 7月  28 15:44 Project
[niesh@niesh tmp]$ getfacl Project/
# file: Project/
# owner: niesh
# group: niesh
user::rwx
group::rwx
other::---
```

删除我刚才建立的Sherry用户：

```plain
[root@niesh ~]# userdel -r Sherry
[root@niesh ~]# cat /etc/passwd
```