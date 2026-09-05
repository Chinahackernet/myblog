# 一、什么是Docker

  

Docker，中文翻译是"码头工人"。根据官方的定义，Docker是以Docker容器为资源分割和调度的基本单元，封装了整个软件运行的环境，为开发者和系统管理员设计的，用于构建、发布和运行分布式应用的平台。它是一个跨平台、可移植并且简单易用的容器解决方案。

  

从概念上看，Docker和我们传统的虚拟机比较类似，只是它更加轻量级，更加方便使用。Docker和虚拟机的主要区别在于：

1\. 虚拟化技术依赖的是物理CPU和内存，是硬件级别的；而我们的 Docker 是构建在操作系统层面的，利用操作系统的容器化技术，所以 Docker 同样的可以运行在虚拟机上面；

2\. 虚拟机中的系统就是我们常说的操作系统镜像，比较复杂；而 Docker 比较轻量级，我们的可以用 Docker 部署一个独立的 Redis，就类似于在虚拟机当中安装一个 Redis 应用，但是我们用 Docker 部署的应用是完全隔离的；

3.传统的虚拟化技术是通过快照来保存状态的；而 Docker 引入了类似于源码管理的机制，将容器的快照历史版本一一记录下来，切换成本非常之低；

4\. 传统虚拟化技术在构建系统的时候非常复杂；而 Docker 可以通过一个简单的 Dockerfile 文件来构建整个容器，更重要的是 Dockerfile 可以手动编写，这样应用程序开发人员可以通过发布 Dockerfile 来定义应用的环境和依赖，这样对于持续交付非常有利；

  

# 二、为什么要用Docker

  

假如我们要部署一个nginx的应用，传统的做法是创建一台虚拟机，然后我们装系统，再然后安装nginx软件，这其中的我们把大量的时间都花在了安装上面，这样极大的降低了工作效率。而对于Docker，我们只需要在Docker Hub上拉取nginx的镜像，然后使用docker run就可以完成整个软件的安装了，而且Docker的启动速度很快，如果镜像在本地存在，可以达到秒级。

  

而且传统的安装部署移植性很差，如果是VMware虚拟机，我们要克隆，克隆完成后，有时候还需要去更改一些UUID避免冲突，很是繁琐。而对于Docker，我们只需要把我们部署好的应用commit成一个镜像推送到Registry中或者save成一个压缩包scp到目标服务器load即可，简单快捷。

  

# 三、Docker的架构

  

Docker是一种C/S架构，所谓的C/S架构就是有Client端和服务端。其中Docker Engine包括一下几个组件。

1、常驻的后台进程Dockerd；

2、一个用来和Dockerd交互的REST API Server；

3、命令行CLI接口，通过和REST API进行交互。

如下图所示：

![](assets/docker容器/01_Docker简介/01_Docker简介-1.png)

  

Docker Client负责和Docker daemon进程通信，Docker daemon负责构建、运行和分发Docker容器。Docker Client和Docker daemon可以运行在一台主机上，也可以连接远程的Docker daemon。Docker Client和Docker daemon使用REST API通过UNIX套接字和网络接口进行通信。

  

下图是整个Docker运行的示意图：

![](assets/docker容器/01_Docker简介/01_Docker简介-2.png)

  

其中：

-   Docker Damon：dockerd，用来监听 Docker API 的请求和管理 Docker 对象，比如镜像、容器、网络和 Volume。
-   Docker Client：docker，docker client 是我们和 Docker 进行交互的最主要的方式方法，比如我们可以通过 docker run 命令来运行一个容器，然后我们的这个 client 会把命令发送给上面的 Dockerd，让他来做真正事情。
-   Docker Registry：用来存储 Docker 镜像的仓库，Docker Hub 是 Docker 官方提供的一个公共仓库，而且 Docker 默认也是从 Docker Hub 上查找镜像的，当然你也可以很方便的运行一个私有仓库，当我们使用 docker pull 或者 docker run 命令时，就会从我们配置的 Docker 镜像仓库中去拉取镜像，使用 docker push 命令时，会将我们构建的镜像推送到对应的镜像仓库中。
-   Images：镜像，镜像是一个只读模板，带有创建 Docker 容器的说明，一般来说的，镜像会基于另外的一些基础镜像并加上一些额外的自定义功能。比如，你可以构建一个基于 Centos 的镜像，然后在这个基础镜像上面安装一个 Nginx 服务器，这样就可以构成一个属于我们自己的镜像了。
-   Containers：容器，容器是一个镜像的可运行的实例，可以使用 Docker REST API 或者 CLI 来操作容器，容器的实质是进程，但与直接在宿主执行的进程不同，容器进程运行于属于自己的独立的[命名空间](https://en.wikipedia.org/wiki/Linux_namespaces)。因此容器可以拥有自己的 **root 文件系统、自己的网络配置、自己的进程空间，甚至自己的用户 ID 空间**。容器内的进程是运行在一个隔离的环境里，使用起来，就好像是在一个独立于宿主的系统下操作一样。这种特性使得容器封装的应用比直接在宿主运行更加安全。
-   底层技术支持：Namespaces（做隔离）、CGroups（做资源限制）、UnionFS（镜像和容器的分层） the-underlying-technology Docker 底层架构分析。