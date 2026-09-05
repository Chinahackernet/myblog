Docker在1.11之前主要是通过docker daemon来处理client的请求，容器的相关操作都是通过docker daemon来完成。从1.11之后，并不是简简单单的通过docker daemon来处理了，它集成了Containerd、RunC等多个组件。这些组件之间相互协作来完成客户端请求和容器管理。

  

现在的架构图如下：

![image.png](assets/kubernetes与云原生/9、Docker的架构/9、Docker的架构-1.png)

  

下面对这些组件进行一一说明。

  

## Dockerd

Dockerd是一个守护进程，它可以通过TCP和UNIX Domain Socket两种途径接收客户端的HTTP请求，这些请求都是Restful风格。也就是说Dockerd是面向用户的，它是对容器操作相关的API的上层封装。

  

## Containerd

Containerd对外提供gRPC形式的API，API的定义中不再包含于集群、编排等相关功能，但是它也不是简单的将Docker API照搬过来，而是进行了更细粒度的抽象，并且还实现了监控管理、多租户的接口，方便外部应用利用这套API来实现高效和定制容器管理功能。

  

## Containerd-shim

在默认情况下，Docker守护进程在停止容器的时候会发送SIGTERM信号，而容器进程有可能错误的忽略该信号，为了能够正确的处理系统信号等相关特性，通过Containerd-shim来保证能够正确处理各种信号，所以每个容器都会对应一个Containerd-shim实例。它对外的接口是ttRPC。

  

## RunC

OCI 定义了容器运行时标准，runC 是 Docker 按照开放容器格式标准（OCF, Open Container Format）制定的一种具体实现。runC 是从 Docker 的 libcontainer 中迁移而来的，实现了容器启停、资源隔离等功能。Docker 默认提供了 docker-runc 实现，事实上，通过 containerd 的封装，可以在 Docker Daemon 启动的时候指定 runc 的实现。

  

runc不是以守护进程的方式来执行，它会将容器的运行配置和状态数据记录在json文件中，当Containerd要求Runc执行例如停止、暂停容器等操作，它会根据容器ID在配置好的路径下找到该json文件，然后再利用json中记录的容器进程PID以及CGroup文件路径等作为参数来调用操作系统API，并完成自己的任务。

  

由RunC启动的容器进程的标准输入和标准输出被重定向到管道中，并在Contained中被关联到FIFO文件中，这些FIFO文件是在Dockerd中创建的，并通过gRPC请求将它们的路径名传递到Contained中。