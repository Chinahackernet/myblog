Linux下的namespace的主要作用是做资源隔离，主要包括6中资源隔离。它们分别是：

（1）、UTS namespace：隔离主机名和域名，标志位是CLONE\_NEWUTS

（2）、IPC namespace：隔离信号量、消息队列、共享内存，标志位是CLONE\_NEWIPC

（3）、Mount namaspace：隔离文件系统，标志位是CLONE\_NEWNS

（4）、Network namespace：隔离网络，标志位是CLONE\_NEWNET

（5）、User namespace：隔离用户和用户组，标志位是CLONE\_NEWUSER

（6）、PID namespace：隔离进程，标志位是CLONE\_NEWPID