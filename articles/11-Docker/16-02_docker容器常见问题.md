# docker容器常见问题

> 分类：Docker / 第16章：总结
> 原文：https://www.cuiliangblog.cn/detail/section/29821468
> 来源：崔亮的博客

---

1. docker容器自启动

在运行docker容器时可以加如下参数来保证每次docker服务重启后容器也自动重启：

docker  run --restart=always

如果已经启动了则可以使用如下命令：

docker  update --restart=always <CONTAINER ID>

2. 容器退出后，通过docker ps命令查看不到，数据会丢失么？

容器退出后会处于终止（exited）状态，此时可以通过docker       ps -a查看。其中的数据也不会丢失，还可以通过docker [container] start命令来启动它。只有删除掉容器才会清除所有数据。

3. 如何停止所有正在运行的容器？

可以使用docker [container] stop       $(docker ps -q)命令。

4. 如何批量清理所有的容器，包括处于运行状态和停止状态的？

可以使用docker rm -f $(docker ps       -qa)命令。

5. 如何获取某个容器的PID信息？

可以使用docker [container] inspect       --format '{{ .State.Pid }}'<CONTAINER ID or NAME>命令。

6. 如何获取某个容器的IP地址？

可以使用docker [container] inspect       --format '{{ .NetworkSettings. IPAddress }}' <CONTAINER ID or       NAME>命令。

7. 如何给容器指定一个固定IP地址，而不是每次重启容器时IP地址都会变？

目前Docker并没有提供直接的对容器IP地址的管理支持，用户可以参考本书第三部的第20章“高级网络配置”中介绍的创建点对点连接例子，来手动配置容器的静态IP。或者在启动容器后，再手动进行修改（参考后面“其他类”的问题“如何进入Docker容器的网络命名空间？”）。

8. 如何临时退出一个正在交互的容器的终端，而不终止它？

按Ctrl-p       Ctrl-q。如果按Ctrl-c往往会让容器内应用进程终止，进而会终止容器。

9. 可以在一个容器中同时运行多个应用进程么？

一般并不推荐在同一个容器内运行多个应用进程。如果有类似需求，可以通过一些额外的进程管理机制，比如supervisord，来管理所运行的进程。可以参考[https://docs.docker.com/articles/using_supervisord/](https://docs.docker.com/articles/using_supervisord/)。

10. 如何控制容器占用系统资源（CPU、内存）的份额？

在使用docker [container]       create命令创建容器或使用docker [con-tainer]       run创建并启动容器的时候，可以使用-c|-cpu-shares[=0]参数来调整容器使用CPU的权重；使用-m|-memory[=MEMORY]参数来调整容器使用内存的大小。


