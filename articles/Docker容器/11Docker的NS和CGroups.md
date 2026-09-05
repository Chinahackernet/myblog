## namespace

Linux下的namespace的主要作用是做资源隔离，主要包括6中资源隔离。它们分别是：

（1）、UTS namespace：隔离主机名和域名，标志位是CLONE\_NEWUTS

（2）、IPC namespace：隔离信号量、消息队列、共享内存，标志位是CLONE\_NEWIPC

（3）、Mount namaspace：隔离文件系统，标志位是CLONE\_NEWNS

（4）、Network namespace：隔离网络，标志位是CLONE\_NEWNET

（5）、User namespace：隔离用户和用户组，标志位是CLONE\_NEWUSER

（6）、PID namespace：隔离进程，标志位是CLONE\_NEWPID

  

## cgroups

cgroups全名：control groups。

它不仅可以限制被namespache隔离起来的资源，还可以为资源设置权重、计算使用量、操控任务启停等。

  

### 定义

cgoups是Linux内核提供的一种机制，这种机制可以根据需要把一系列系统任务以及其子任务整合到按资源划分等级的不同组内，从而为系统资源管理提供一个统一的框架。

  

简单的说：cgroups可以限制、记录任务组所使用的物理资源。

  

cgroups的四个特点：

（1）、cgroups的API是一个伪文件系统的方式实现，用户态的程序可以通过文件操作实现cgroups的组织管理；

（2）、cgroups的组织管理操作单元可以细粒到线程级别，另外用户可以创建和销毁cgroup，从而实现资源的再分配和管理；

（3）、所有资源管理的功能都以子系统的方式实现，接口统一；

（4）、子任务创建之初与其父任务同属一个cgroups控制组；

  

本质来说，cgoups的内核附加在程序上的一系列钩子（hook），通过程序运行时对资源的调度触发相应的钩子以达到资源的追踪与限制功能。

  

### 作用

cgroups的主要目的是为不同用户层面的资源管理，提供一个统一化的接口。

其有四大功能：

（1）、资源限制：cgroups可以对任务使用的资源总额进行限制；

（2）、优先级分配：通过分配CPU的时间片数量及磁盘IO的带宽大小，实际上就相当于控制了任务运行时的优先级；

（3）、资源统计：cgroups可以统计系统资源的使用量，如CPU时长，内存用量等，这个功能非常适用于计费；

（4）、任务控制：cgoups可以对任务进行挂起、恢复等操作；