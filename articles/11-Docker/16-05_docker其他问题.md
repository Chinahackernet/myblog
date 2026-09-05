# docker其他问题

> 分类：Docker / 第16章：总结
> 原文：https://www.cuiliangblog.cn/detail/section/29821932
> 来源：崔亮的博客

---

1. Docker能在非Linux平台（比如macOS或Windows）上运行么？

可以。macOS目前需要使用docker for      mac等软件创建一个轻量级的Linux虚拟机层。由于成熟度不高，暂时不推荐在Windows环境中使用Docker。

2. 如何将一台宿主主机的Docker环境迁移到另外一台宿主主机？

停止Docker服务。将整个Docker存储文件夹（如默认的/var/lib/docker）复制到另外一台宿主主机，然后调整另外一台宿主主机的配置即可。

3. 如何进入Docker容器的网络命名空间？

Docker在创建容器后，删除了宿主主机上/var/run/netns目录中的相关的网络命名空间文件。因此，在宿主主机上是无法看到或访问容器的网络命名空间的。用户可以通过如下方法来手动恢复它：

+ 使用下面的命令查看容器进程信息，比如这里的1234：

     $ docker [container] inspect --format='{{. State.Pid}} '     $container_id

     1234

+ 在/proc目录下，把对应的网络命名空间文件链接到/var/run/netns目录：

     $ sudo ln -s /proc/1234/ns/net /var/run/netns/

+ 在宿主主机上就可以看到容器的网络命名空间信息。例如：

      $ sudo ip netns show

      1234

此时，用户可以通过正常的系统命令来查看或操作容器的命名空间了。例如修改容器的IP地址信息为172.17.0.100/16：

      $ sudo ip netns exec 1234 ifconfig eth0172.17.0.100/16


