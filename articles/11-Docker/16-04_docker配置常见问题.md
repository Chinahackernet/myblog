# docker配置常见问题

> 分类：Docker / 第16章：总结
> 原文：https://www.cuiliangblog.cn/detail/section/29821491
> 来源：崔亮的博客

---

1. Docker的配置文件放在哪里，如何修改配置？
+ 使用upstart的系统（如Ubuntu       16.04）的配置文件在/etc/default/docker，使用systemd的系统（如Ubuntu       16.04、Centos等）的配置文件在/etc/systemd/system/docker. service.d/docker.conf。

Ubuntu下面的配置文件内容如下，读者可以参考配置（如果出现该文件不存在的情况，重启或者自己新建一个文件都可以解决）：

# Customize location of Docker binary  (especially for development testing).

#DOCKERD="/usr/local/bin/dockerd"

# Use DOCKER_OPTS to modify the daemon  startup options.

#DOCKER_OPTS="--dns 8.8.8.8--dns  8.8.4.4"

# If you need Docker to use an HTTP proxy,  it can also be specified here.

#export  http_proxy="http://127.0.0.1:3128/"

# This is also a handy place to tweak  where Docker's temporary files go.

#export  TMPDIR="/mnt/bigdrive/docker-tmp"

2. 如何更改Docker的默认存储位置？

Docker的默认存储位置是/var/lib/docker，如果希望将Docker的本地文件存储到其他分区，可以使用Linux软连接的方式来完成，或者在启动daemon时通过-g参数指定。

+ 例如，如下操作将默认存储位置迁移到/storage/docker：

```bash
[root@s26~]#  df -h
Filesystem                         Size   Used Avail Use% Mounted on
/dev/mapper/VolGroup-lv_root    50G    5.3G    42G   12% /
tmpfs                                 48G   228K     48G    1% /dev/shm
/dev/sda1                          485M    40M    420M    9% /boot
/dev/mapper/VolGroup-lv_home   222G    188M   210G    1% /home
/dev/sdb2                          2.7T   323G    2.3T   13% /storage
[root@s26~]# service docker stop
[root@s26~]# cd /var/lib/
[root@s26 lib]# mv docker /storage/
[root@s26 lib]# ln -s /storage/docker/  docker
[root@s26 lib]# ls -la docker
lrwxrwxrwx. 1 root root 15 11月 17 13:43  docker -> /storage/docker
[root@s26 lib]# service docker start
```

3. 使用内存和swap限制启动容器时候报警告：“WARNING:       Your kernel does not support cgroup swap limit. WARNING: Your kernel does       not support swap limit capabilities. Limitation discarded.”，怎么办？
+ 这是因为系统默认没有开启对内存和swap使用的统计功能，引入该功能会带来性能的下降。要开启该功能，可以采取如下操作：
+ 编辑/etc/default/grub文件（Ubuntu系统为例），配置GRUB_CMDLINE_LINUX="cgroup_enable=memory  swapaccount=1"；
+ 更新grub:$  sudo update-grub；
+ 重启系统即可。


