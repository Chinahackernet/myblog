---
title: 史上最全Docker教程，从容器发展史到实操演练(一）
---

**前言：今天我们所说的容器是一种 IT 技术。容器其实是一种沙盒技术。顾名思义，沙盒就是能够像一个集装箱一样，把你的应用装起来。这样，应用与应用之间就有了边界而不会相互干扰;同时装在沙盒里面的应用，也可以很方便的被搬来搬去，这也是 PaaS 想要的最理想的状态(可移植性,标准化,隔离性)。容器是软件工业上的集装箱的技术，装箱的标准化，减少了包装成本，大大提高货物运输和装卸效率，是传统运输行业的重大变革。早期的软件项目中软件更新，发布低效，开发测试发布周期很长，很难敏捷。有容器术，就可以利用其标准化的特点，大幅提高生产效率。容器技术是虚拟化、云计算、大数据之后的一门新兴的并且是炙手可热的新技术， 容器技术提高了硬件资源利用率、 方便了企业的业务快速横向扩容（可以达到秒级快速扩容）、 实现了业务宕机自愈功能（配合K8S可以实现，但OpenStack无此功能），因此未来数年会是一个容器愈发流行的时代 ，这是一个对于 IT 行业来说非常有影响和价值的技术，而对于IT行业的从业者来说， 熟练掌握容器，进而掌握云原生技术，对个人的发展很有前景。**

# "接下来，我将把我几年前的笔记和实操资料精心整理，并逐一呈现给大家作为参考。这是我的第一期内容，未来我将根据大家的反馈和需求，决定后续内容的发布。敬请期待！"

### 1 容器简介

Docker是一个开源的引擎，可以轻松的为任何应用创建一个轻量级的、可移植的、自给自足的容器。开发者在笔记本上编译测试通过的容器可以批量地在生产环境中部署，包括VMs（虚拟机）、 bare metal、OpenStack 集群和其他的基础应用平台。

### 1.1.1 什么是Docker？

Docker （码头工人）是一个开源项目，诞生于 2013 年初，最初是 dotCloud 公司（后由于 Docker 开源后大受欢迎就将公司改名为 Docker Inc ，总部位于美国加州的旧金山）内部的一个开源的 PAAS 服务(Platform as a ServiceService )的业余项目。它基于 Google 公司推出的 Go 语言实现。 项目后来加入了 Linux 基金会，遵从了 Apache 2.0 协议，项目代码在 GitHub 上进行维护。

Docker 是基于 linux 内核实现，Docker 最早采用 LXC 技术 ，LXC 是 Linux 原生支持的容器技术 ，可以提供轻量级的虚拟化 ，可以说 docker 就是基于 LXC 发展起来 的，提供 LXC 的高级封装，标准的配置方法，在LXC的基础之上，docker提供了一系列更强大的功能。而虚拟化技术 KVM(KernelKernelbased Virtual Machine Machine) 基于 模块实现， 后来Docker 改为自己研发并开源的 runc 技术运行容器，彻底抛弃了LXC。

Docker 相比虚拟机的交付速度更快，资源消耗更低，Docker 采用客户端/服务端架构，使用远程API来管理和创建容器，其可以轻松的创建一个轻量级的、可移植的、自给自足的容器，docker 的三大理念是build(构建)、ship(运输)、 run(运行)，Docker遵从apache 2.0协议，并通过（namespace及cgroup等）来提供容器的资源隔离与安全保障等，所以Docke容器在运行时不需要类似虚拟机（空运行的虚拟机占用物理机6-8%性能）的额外资源开销，因此可以大幅提高资源利用率,总而言之Docker是一种用了新颖方式实现的轻量级虚拟机.类似于VM但是在原理和应用上和VM的差别还是很大的，并且docker的专业叫法是应用容器(Application Container)。  
**Docker的主要目标**  
Build, Ship and Run Any App, Anywhere，即通过对应用组件的封装（Packaging）、分发（Distribution）、部署（Deployment）、运行（Runtime）等生命周期的管理，达到应用组件级别的“一次封装，到处运行”。这里的应用组件，既可以是一个Web应用，也可以是一套数据库服务，甚至是一个操作系统。将应用运行在Docker 容器上，可以实现跨平台，跨服务器，只需一次配置准备好相关的应用环境，即可实现到处运行，保证研发和生产环境的一致性，解决了应用和运行环境的兼容性问题，从而极大提升了部署效率，减少故障的可能性

### 1.1.1.1 Docker通常用场景：

- web应用的自动化打包和发布；
- 自动化测试和持续集成、发布；
- 在服务型环境中部署和调整数据库或其他的后台应用；
- 从头编译或者扩展现有的OpenShift或Cloud Foundry平台来搭建自己的PaaS环境；

### 1.1.1.2 容器发展历史

虽然 docker 把容器技术推向了巅峰，但容器技术却不是从 docker 诞生的。实际上，容器技术连新技术都算不上，因为它的诞生和使用确实有些年头了。下面的一串名称可能有的你都没有听说过，但它们的确都是容器技术的应用:

1、Chroot Jail  
就是我们常见的 chroot 命令的用法。它在 1979 年的时候就出现了，被认为是最早的容器化技术之一。它可以把一个进程的文件系统隔离起来。

2、The FreeBSD Jail  
Freebsd Jail 实现了操作系统级别的虚拟化，它是操作系统级别虚拟化技术的先驱之一。

3、Linux VServer  
使用添加到 Linux 内核的系统级别的虚拟化功能实现的专用虚拟服务器。

4、Solaris Containers  
它也是操作系统级别的虚拟化技术，专为 X86 和 SPARC 系统设计。Solaris 容器是系统资源控制和通过"区域" 提供边界隔离的组合。

5、OpenVZ  
OpenVZ 是一种 Linux 中操作系统级别的虚拟化技术。 它允许创建多个安全隔离的 Linux 容器，即VPS。

6、Process Containers  
Process 容器由 Google 的工程师开发，一般被称为 cgroups。

7、LXC  
LXC为Linux Container的简写。可以提供轻量级的虚拟化，以便隔离进程和资源，而且不需要提供指令解释机制以及全虚拟化的其他复杂性。容器有效地将由单个操作系统管理的资源划分到孤立的组中，以更好地在孤立的组之间平衡有冲突的资源使用需求Linux Container提供了在单一可控主机节点上支持多个相互隔离的server container同时执行的机制。Linux Container有点像chroot，提供了一个拥有自己进程和网络空间的虚拟环境，但又有别于虚拟机，因为lxc是一种操作系统层次上的资源的虚拟化。

8、Warden  
在最初阶段，Warden 使用 LXC 作为容器运行时。 如今已被 CloudFoundy 取代。

9、LMCTFY  
LMCTY 是 Let me contain that for you 的缩写。它是 Google 的容器技术栈的开源版本。Google 的工程师一直在与 docker 的 libertainer 团队合作，并将 libertainer 的核心概念进行抽象并移植到此项目中。该项目的进展不明，估计会被 libcontainer 取代。

10、Docker  
Docker 是一个可以将应用程序及其依赖打包到几乎可以在任何服务器上运行的容器的工具。

11、RKT  
RKT 是 Rocket 的缩写，它是一个专注于安全和开放标准的应用程序容器引擎。正如我们所看到的，docker 并不是第一个容器化技术，但它的确是最知名的一个。  
**使用Docker 容器化封装应用程序的意义:**  
传统的部署方式分别需要在开发、测试和生产环境上安装、配置和维护应用程序；而使用容器只需要拉取镜像，工作量几乎缩小了三倍，而且不需要考虑操作系统、服务应用等兼容性的问题。

- 统一基础设施环境-docker环境  
  硬件的组成配置  
  操作系统的版本  
  运行时环境的异构
- 统一程序打包（装箱）方式-docker镜像  
  java程序  
  python程序  
  nodejs程序
- 统一程序部署（运行）方式-docker容器  
  java-jar...→ docker run...  
  python manage.py runserver... → docker run...  
  npm run dev ... → docker run...

**Docker 的组成**  
docker 官网: <http://www.docker.com>  
帮助文档链接: <https://docs.docker.com/>  
docker 镜像: <https://hub.docker.com/>  
docker 中文网站: <http://www.docker.org.cn/>

- Docker 主机(Host): 一个物理机或虚拟机，用于运行Docker服务进程和容器，也称为宿主机，node节点
- Docker 服务端(Server): Docker守护进程，运行docker容器
- Docker 客户端(Client): 客户端使用docker 命令或其他工具调用docker API
- Docker 仓库(Registry): 保存镜像的仓库，官方仓库: <https://hub.docker.com/> ，可以搭建私有仓库harbor
- Docker 镜像(Images): 镜像可以理解为创建实例使用的模板,相当于RPM或DEB包
- Docker 容器(Container): 容器是从镜像生成对外提供服务的一个或一组服务 ,相当于将RPM包中的程序运行起来

### 1.1.2 容器管理工具

### 1.1.2.1 LXC

lxc启动容器依赖于模板，清华模板源: <https://mirrors.tuna.tsinghua.edu.cn/help/lxc-images/> ，但是做模板相对较难，需要手动一步步创构建文件系统、准备基础目录及可执行程序等，而且在大规模使用容器的场景很难横向扩展，另外后期代码升级也需要重新从头构建模板，基于以上种种原因便有了docker

### 1.1.2.2 docker

Docker 启动一个容器也需要一个外部模板，也称为镜像，docke的镜像可以保存在一个公共的地方共享使用，只要把镜像下载下来就可以使用，最主要的是可以在镜像基础之上做自定义配置并且可以再把其提交为一个镜像，一个镜像可以被启动为多个容器。  
Docker的镜像是分层的，镜像底层为库文件且只读层即不能写入也不能删除数据，从镜像加载启动为一个容器后会生成一个可写层，其写入的数据会复制到宿主机上对应容器的目录，但是容器内的数据在删除容器后也会被随之删除。

### 1.1.2.3 pouch

项目网点: <https://github.com/alibaba/pouch>  
Pouch （小袋子）起源于 2011 年，并于2017年11月19日上午，在中国开源年会现场，阿里巴巴正式开源了基于 Apache 2.0 协议的容器技术 Pouch。Pouch 是一款轻量级的容器技术，拥有快速高效、可移植性高、资源占用少等特性，主要帮助阿里更快的做到内部业务的交付，同时提高超大规模下数据中心的物理资源利用率

目前的容器方案大多基于 Linux 内核提供的 cgroup 和 namespace 来实现隔离，然后这样轻量级方案存在弊端:

- 容器间，容器与宿主间，共享同一个内核
- 内核实现的隔离资源，维度不足

面对如此的内核现状，阿里巴巴采取了三个方面的工作，来解决容器的安全问题:

- 用户态增强容器的隔离维度，比如网络带宽、磁盘使用量等
- 给内核提交 patch，修复容器的资源可见性问题，cgroup 方面的 bug
- 实现基于 Hypervisor 的容器，通过创建新内核来实现容器隔离

### 1.1.2.4 Podman

官网地址: <https://podman.io/>  
项目地址: <https://github.com/containers/libpod>  
虽然目前 Docker 是管理 Linux 容器最好的工具，注意没有之一，但是podman的横空出现即将改变这一点

Podman即Pod Manager tool，从名称上可以看出和kubernets的pod的密切联系，不过就其功能来说，简而言之: alias docker = podman

Podman是一个 为 Kubernetes 而生的开源的容器管理工具，原来是 CRI-O（即容器运行时接口CRI 和开放容器计划OCI） 项目的一部分，后来被分离成一个单独的项目叫 libpod。其可在大多数Linux平台上使用，它是一种无守护程序的容器引擎，用于在Linux系统上开发，管理和运行任何符合Open Container Initiative（OCI）标准的容器和容器镜像。

Podman 提供了一个与Docker兼容的命令行前端，Podman 里面87%的指令都和Docker CLI 相同，因此可以简单地为Docker CLI别名，即“ alias docker = podman”，事实上，podman使用的一些库也是docker的一部分。

**Podman 和docker不同之处：**

- docker 需要在我们的系统上运行一个守护进程(docker daemon)，这会产生一定的开销，而podman 不需要
- 启动容器的方式不同:  
  docker cli 命令通过API跟 Docker Engine(引擎) 交互告诉它我想创建一个container，然后docker Engine 才会调用 OCI container runtime(runc) 来启动一个container。这代表container的process(进程)不会是 Docker CLI 的 child process(子进程) ，而是 Docker Engine 的 child process 。Podman 是直接给 OCI containner runtime(runc) 进行交互来创建container的，所以container process 直接是 podman 的 child process 。
- 因为docke有docker daemon，所以docker启动的容器支持 --restart 策略，但是podman不支持
- docker需要使用root用户来创建容器。 这可能会产生安全风险，尤其是当用户知道docker run命令的--privileged选项时。podman既可以由root用户运行，也可以由非特权用户运行
- docker在Linux上作为守护进程运行扼杀了容器社区的创新。 如果要更改容器的工作方式，则需要更改docker守护程序并将这些更改推送到上游。 没有守护进程，容器基础结构更加模块化，更容易进行更改。 podman的无守护进程架构更加灵活和安全。

### 1.1.3 docker(容器)的核心技术

### 1.1.3.1 容器规范

容器技术除了的docker之外，还有coreOS的rkt，还有阿里的Pouch，为了保证容器生态的标准性和健康可持续发展，包括Linux 基金会、Docker、微软、红帽、谷歌和IBM等公司在2015年6月共同成立了一个叫open container（OCI）的组织，其目的就是制定开放的标准的容器规范，目前OCI一共发布了两个规范，分别是runtime spec和 image format spec，有了这两个规范，不同的容器公司开发的容器只要兼容这两个规范，就可以保证容器的可移植性和相互可操作性。

### 1.1.3.2 容器 runtime

runtime是真正运行容器的地方，因此为了运行不同的容器runtime需要和操作系统内核紧密合作相互在支持，以便为容器提供相应的运行环境

**范例：**

```
[root@ubuntu1804 ~]#docker info 
Client:
 Debug Mode: false
Server:
 Containers: 0
 Running: 0
 Paused: 0
 Stopped: 0
 Images: 1
 Server Version: 19.03.5
 Storage Driver: overlay2
 Backing Filesystem: extfs
 Supports d_type: true
Native Overlay Diff: true
 Logging Driver: json-file
 Cgroup Driver: cgroupfs
 Plugins:
 Volume: local
 Network: bridge host ipvlan macvlan null overlay
 Log: awslogs fluentd gcplogs gelf journald json-file local logentries splunk 
syslog
 Swarm: inactive
 Runtimes: runc
 Default Runtime: runc  #runtime
 Init Binary: docker-init
 containerd version: b34a5c8af56e510852c35414db4c1f4fa6172339
 runc version: 3e425f80a8c931f88e6d94a8c831b9d5aa481657
 init version: fec3683
 Security Options:
 apparmor
 seccomp
   Profile: default
 Kernel Version: 4.15.0-29-generic
 Operating System: Ubuntu 18.04.1 LTS
 OSType: linux
 Architecture: x86_64
 CPUs: 1
```

**1.1.3.3 容器管理工具**

管理工具连接runtime与用户，对用户提供图形或命令方式操作，然后管理工具将用户操作传递给runtime执行。

- lxc 是lxd 的管理工具
- Runc的管理工具是docker engine，docker engine包含后台deamon和cli两部分，大家经常提到的Docker就是指的docker engine
- Rkt的管理工具是rkt cli

**范例：查看docker engine**

```
[root@ubuntu1804 ~]#docker version
Client: Docker Engine - Community
 Version:           19.03.5
 API version:       1.40
 Go version:       go1.12.12
 Git commit:       633a0ea838
 Built:             Wed Nov 13 07:29:52 2019
 OS/Arch:           linux/amd64
 Experimental:      false
Server: Docker Engine - Community
 Engine:
 Version:          19.03.5
 API version:      1.40 (minimum version 1.12)
 Go version:       go1.12.12
 Git commit:       633a0ea838
 Built:           Wed Nov 13 07:28:22 2019
 OS/Arch:         linux/amd64
 Experimental:     false
 containerd:
 Version:          1.2.10
 GitCommit:       b34a5c8af56e510852c35414db4c1f4fa6172339
 runc:
 Version:          1.0.0-rc8+dev
 GitCommit:       3e425f80a8c931f88e6d94a8c831b9d5aa481657
 docker-init:
 Version:          0.18.0
 GitCommit:       fec3683
```

### 1.1.3.4 容器定义工具

- 容器定义工具允许用户定义容器的属性和内容，以方便容器能够被保存、共享和重建。
- Docker image: 是docker 容器的模板，runtime依据docker image创建容器
- Dockerfile: 包含N个命令的文本文件，通过dockerfile创建出docker image
- ACI(App container image): 与docker image类似，是CoreOS开发的rkt容器的镜像格式

### 1.1.3.5 镜像仓库 Registry

统一保存镜像而且是多个不同镜像版本的地方，叫做镜像仓库

- Docker hub: docker官方的公共仓库，已经保存了大量的常用镜像，可以方便大家直接使用
- 阿里云，网易等第三方镜像仓库
- Image registry: docker 官方提供的私有仓库部署工具，无web管理界面，目前使用较少
- Harbor: vmware 提供的自带web界面自带认证功能的镜像仓库，目前有很多公司使用

**范例: 镜像地址格式**

```
10.0.0.8/project/centos:7.2.1511
10.0.0.8/project/centos: latest
10.0.0.8/project/java-7.0.59:v1
10.0.0.8/project/java-7.0.59:v2
```

### 1.1.3.6 编排工具

当多个容器在多个主机运行的时候，单独管理容器是相当复杂而且很容易出错，而且也无法实现某一台主机宕机后容器自动迁移到其他主机从而实现高可用的目的，也无法实现动态伸缩的功能，因此需要有一种工具可以实现统一管理、动态伸缩、故障自愈、批量执行等功能，这就是容器编排引擎

容器编排通常包括容器管理、调度、集群定义和服务发现等功能

- Docker swarm: docker 开发的容器编排引擎
- Kubernetes: google领导开发的容器编排引擎，内部项目为Borg，且其同时支持docker和CoreOS
- Mesos+Marathon: Mesos是Apache下的开源分布式资源管理框架，它被称为是分布式系统的内核。Mesos最初是由加州大学伯克利分校的AMPLab开发的，后在Twitter得到广泛使用。通用的集群组员调度平台，mesos(资源分配)与marathon(容器编排平台)一起提供容器编排引擎功能

### 1.2 Docker 安装及基础命令介绍

### 1.2.1 Docker 安装准备

**OS系统版本选择:**  
Docker 目前已经支持多种操作系统的安装运行，比如Ubuntu、CentOS、Redhat、Debian、Fedora，甚至是还支持了Mac和Windows，在linux系统上需要内核版本在3.10或以上

**Docker版本选择:**  
docker版本号之前一直是0.X版本或1.X版本，但是从2017年3月1号开始改为每个季度发布一次稳定版，其版本号规则也统一变更为YY.MM，例如17.09表示是2017年9月份发布的

Docker之前没有区分版本，但是2017年推出(将docker更名为)新的项目Moby，github地址: <https://github.com/moby/moby> ，Moby项目属于Docker项目的全新上游，Docker将是一个隶属于的Moby的子产品，而且之后的版本之后开始区分为 CE（Docker Community Edition，社区版本）和 EE（Docker Enterprise Edition，企业收费版），CE社区版本和EE企业版本都是每个季度发布一个新版本，但是EE  
版本提供后期安全维护1年，而CE版本是4个月，以下为官方原文:  
<https://blog.docker.com/2017/03/docker-enterprise-edition/>

如果要布署到kubernetes上，需要查看相关kubernetes对docker版本要求的说明，比如:  
<https://github.com/kubernetes/kubernetes/blob/v1.17.2/CHANGELOG-1.17.md>

### 1.2.2 安装和删除方法

### 1.2.2.1 Ubuntu 安装和删除Docker

官方文档: <https://docs.docker.com/install/linux/docker-ce/ubuntu/>

**Ubuntu 14.04/16.04/18.04/20.04 安装 docker**

```
# step 1: 安装必要的一些系统工具
sudo apt-get update
sudo apt-get -y install apt-transport-https ca-certificates curl software-properties-common
# step 2: 安装GPG证书
curl -fsSL https://mirrors.aliyun.com/docker-ce/linux/ubuntu/gpg | sudo apt-key add -
# Step 3: 写入软件源信息
sudo add-apt-repository "deb [arch=amd64] https://mirrors.aliyun.com/docker-ce/linux/ubuntu $(lsb_release -cs) stable"
# Step 4: 更新并安装Docker-CE
sudo apt-get -y update
sudo apt-get -y install docker-ce

# 安装指定版本的Docker-CE:
# Step 1: 查找Docker-CE的版本:
apt-cache madison docker-ce 
 docker-ce | 5:19.03.5~3-0~ubuntu-bionic | https://mirrors.aliyun.com/docker-ce/linux/ubuntu bionic/stable amd64 Packages
 docker-ce | 5:19.03.4~3-0~ubuntu-bionic | https://mirrors.aliyun.com/docker-ce/linux/ubuntu bionic/stable amd64 Packages
 docker-ce | 5:19.03.3~3-0~ubuntu-bionic | https://mirrors.aliyun.com/docker-ce/linux/ubuntu bionic/stable amd64 Packages
 docker-ce | 5:19.03.2~3-0~ubuntu-bionic | https://mirrors.aliyun.com/docker-ce/linux/ubuntu bionic/stable amd64 Packages
 docker-ce | 5:19.03.1~3-0~ubuntu-bionic | https://mirrors.aliyun.com/docker-ce/linux/ubuntu bionic/stable amd64 Packages
 docker-ce | 5:19.03.0~3-0~ubuntu-bionic | https://mirrors.aliyun.com/docker-ce/linux/ubuntu bionic/stable amd64 Packages
 docker-ce | 5:18.09.9~3-0~ubuntu-bionic | https://mirrors.aliyun.com/docker-ce/linux/ubuntu bionic/stable amd64 Packages
 docker-ce | 5:18.09.8~3-0~ubuntu-bionic | https://mirrors.aliyun.com/docker-ce/linux/ubuntu bionic/stable amd64 Packages
 docker-ce | 5:18.09.7~3-0~ubuntu-bionic | https://mirrors.aliyun.com/docker-ce/linux/ubuntu bionic/stable amd64 Packages
 docker-ce | 5:18.09.6~3-0~ubuntu-bionic | https://mirrors.aliyun.com/docker-ce/linux/ubuntu bionic/stable amd64 Packages
 docker-ce | 5:18.09.5~3-0~ubuntu-bionic | https://mirrors.aliyun.com/docker-ce/linux/ubuntu bionic/stable amd64 Packages
 docker-ce | 5:18.09.4~3-0~ubuntu-bionic | https://mirrors.aliyun.com/docker-ce/linux/ubuntu bionic/stable amd64 Packages
 docker-ce | 5:18.09.3~3-0~ubuntu-bionic | https://mirrors.aliyun.com/docker-ce/linux/ubuntu bionic/stable amd64 Packages
 docker-ce | 5:18.09.2~3-0~ubuntu-bionic | https://mirrors.aliyun.com/docker-ce/linux/ubuntu bionic/stable amd64 Packages
 docker-ce | 5:18.09.1~3-0~ubuntu-bionic | https://mirrors.aliyun.com/docker-ce/linux/ubuntu bionic/stable amd64 Packages
 docker-ce | 5:18.09.0~3-0~ubuntu-bionic | https://mirrors.aliyun.com/docker-ce/linux/ubuntu bionic/stable amd64 Packages
 docker-ce | 18.06.3~ce~3-0~ubuntu | https://mirrors.aliyun.com/docker-ce/linux/ubuntu bionic/stable amd64 Packages
 docker-ce | 18.06.2~ce~3-0~ubuntu | https://mirrors.aliyun.com/docker-ce/linux/ubuntu bionic/stable amd64 Packages
 docker-ce | 18.06.1~ce~3-0~ubuntu | https://mirrors.aliyun.com/docker-ce/linux/ubuntu bionic/stable amd64 Packages
 docker-ce | 18.06.0~ce~3-0~ubuntu | https://mirrors.aliyun.com/docker-ce/linux/ubuntu bionic/stable amd64 Packages
 docker-ce | 18.03.1~ce~3-0~ubuntu | https://mirrors.aliyun.com/docker-ce/linux/ubuntu bionic/stable amd64 Packages

# Step 2: 安装指定版本的Docker-CE: (VERSION例如上面的17.03.1~ce-0~ubuntu-xenial)**
sudo apt-get -y install docker-ce=[VERSION] docker-ce-cli=[VERSION]
```

**删除docker**

```
[root@ubuntu ~]#apt purge docker-ce
[root@ubuntu ~]#rm -rf /var/lib/docker
```

**范例: 查看docker相关文件**

```
[root@ubuntu1804 ~]#dpkg -L docker-ce
/.
/etc
/etc/default
/etc/default/docker
/etc/init
/etc/init/docker.conf
/etc/init.d
/etc/init.d/docker
/lib
/lib/systemd
/lib/systemd/system
/lib/systemd/system/docker.service
/lib/systemd/system/docker.socket
/usr
/usr/bin
/usr/bin/docker-init
/usr/bin/docker-proxy
/usr/bin/dockerd
/usr/share
/usr/share/doc
/usr/share/doc/docker-ce
/usr/share/doc/docker-ce/README.md
/usr/share/doc/docker-ce/changelog.Debian.gz
/var
/var/lib
/var/lib/docker-engine
/var/lib/docker-engine/distribution_based_engine.json
```

### 1.2.2.2 CentOS 安装和删除Docker

官方文档: <https://docs.docker.com/install/linux/docker-ce/centos/>

- CentOS 6 因内核太旧，即使支持安装docker，但会有各种问题，不建议安装
- CentOS 7 的 extras 源虽然可以安装 docker，但包比较旧，建议从官方源或镜像源站点下载安装docker
- CentOS 8 有新技术 podman 代替 docker  
  因此建议在CentOS 7 上安装 docker

**#extras 源中包名为docker**

```
[root@centos7 ~]#yum list docker
Loaded plugins: fastestmirror
Repository base is listed more than once in the configuration
Repository extras is listed more than once in the configuration
Loading mirror speeds from cached hostfile
 * base: mirrors.tuna.tsinghua.edu.cn
 * extras: mirrors.tuna.tsinghua.edu.cn
 * updates: mirrors.tuna.tsinghua.edu.cn
Available Packages
docker.x86_64      2:1.13.1-103.git7f2769b.el7.centos                           
extras
```

**下载rpm包安装:**  
官方rpm包下载地址:  
<https://download.docker.com/linux/centos/7/x86_64/stable/Packages/>  
阿里镜像下载地址:  
<https://mirrors.aliyun.com/docker-ce/linux/centos/7/x86_64/stable/Packages/>  
**通过yum源安装:**  
由于官网的yum源太慢，下面使用阿里云的Yum源进行安装

```
rm -rf /etc/yum.repos.d/*
wget -O /etc/yum.repos.d/CentOS-Base.repo http://mirrors.aliyun.com/repo/Centos-7.repo
wget -O /etc/yum.repos.d/epel.repo http://mirrors.aliyun.com/repo/epel-7.repo
wget -O /etc/yum.repos.d/docker-ce.repo https://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo
yum clean all 
yum -y install docker-ce
systemctl enable --now docker
```

**删除 docker**

```
[root@centos7 ~]#yum remove docker-ce
#删除docker资源存放的相关文件
[root@centos7 ~]#rm -rf /var/lib/docker
```

**范例: CentOS 7 基于阿里云的安装docker方法**  
阿里云说明: <https://developer.aliyun.com/mirror/docker-ce?spm=a2c6h.13651102.0.0.3e221b11sUMKNV>

```
# step 1: 安装必要的一些系统工具
yum install -y yum-utils device-mapper-persistent-data lvm2
# Step 2: 添加软件源信息
yum-config-manager --add-repo https://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo
# Step 3: 更新并安装Docker-CE
yum makecache fast
yum -y install docker-ce
# Step 4: 开启Docker服务
service docker start
# 注意:  
# 官方软件源默认启用了最新的软件，您可以通过编辑软件源的方式获取各个版本的软件包。例如官方并没有将测试版本的软件源置为可用，您可以通过以下方式开启。同理可以开启各种测试版本等。
# vim /etc/yum.repos.d/docker-ee.repo
#   将[docker-ce-test]下方的enabled=0修改为enabled=1
#
# 安装指定版本的Docker-CE:
# Step 1: 查找Docker-CE的版本:
# yum list docker-ce.x86_64 --showduplicates | sort -r
#   Loading mirror speeds from cached hostfile
#   Loaded plugins: branch, fastestmirror, langpacks
#   docker-ce.x86_64           17.03.1.ce-1.el7.centos           docker-ce-stable
#   docker-ce.x86_64           17.03.1.ce-1.el7.centos           @docker-ce-stable
#   docker-ce.x86_64           17.03.0.ce-1.el7.centos           docker-ce-stable
#   Available Packages
# Step2: 安装指定版本的Docker-CE: (VERSION例如上面的17.03.0.ce.1-1.el7.centos)
yum -y install docker-ce-[VERSION]
```

**范例: 在CentOS 7上安装docker**

```
[root@centos7 ~]#cat /etc/redhat-release 
CentOS Linux release 7.6.1810 (Core) 
[root@centos7 ~]#ls /etc/yum.repos.d/
backup base.repo
[root@centos7 ~]#wget -P /etc/yum.repos.d/ https://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo
Saving to: ‘/etc/yum.repos.d/docker-ce.repo’
100%[====================================================================>] 
2,640       --.-K/s   in 0s      
2020-05-21 21:56:21 (505 MB/s) - ‘/etc/yum.repos.d/docker-ce.repo’ saved 
[2640/2640]
[root@centos7 ~]#ls /etc/yum.repos.d/
backup base.repo docker-ce.repo
[root@centos7 ~]#yum clean all
Loaded plugins: fastestmirror
Cleaning repos: base docker-ce-stable epel extras
Cleaning up list of fastest mirrors
[root@centos7 ~]#yum repolist 
repo id                   repo name                                           
status
base                       CentOS                                               
10,019
docker-ce-stable/x86_64   Docker CE Stable - x86_64                             
   63
epel/7/x86_64             EPEL                                                 
13,513
extras/7/x86_64           extras                                                 
307
repolist: 23,902
[root@centos7 ~]#yum list docker-ce* --showduplicates | sort -r
Loading mirror speeds from cached hostfile
Loaded plugins: fastestmirror
docker-ce.x86_64                3:19.03.5-3.el7                 docker-ce-stable
docker-ce.x86_64                3:19.03.4-3.el7                 docker-ce-stable
docker-ce.x86_64                3:19.03.3-3.el7                 docker-ce-stable
docker-ce.x86_64                3:19.03.2-3.el7                 docker-ce-stable
docker-ce.x86_64                3:19.03.1-3.el7                 docker-ce-stable
docker-ce.x86_64                3:19.03.0-3.el7                 docker-ce-stable
docker-ce.x86_64                3:18.09.9-3.el7                 docker-ce-stable
docker-ce.x86_64                3:18.09.8-3.el7                 docker-ce-stable
docker-ce.x86_64                3:18.09.7-3.el7                 docker-ce-stable
docker-ce.x86_64                3:18.09.6-3.el7                 docker-ce-stable
docker-ce.x86_64                3:18.09.5-3.el7                 docker-ce-stable
docker-ce.x86_64                3:18.09.4-3.el7                 docker-ce-stable
docker-ce.x86_64                3:18.09.3-3.el7                 docker-ce-stable
docker-ce.x86_64                3:18.09.2-3.el7                 docker-ce-stable
docker-ce.x86_64                3:18.09.1-3.el7                 docker-ce-stable
docker-ce.x86_64                3:18.09.0-3.el7                 docker-ce-stable
docker-ce.x86_64                18.06.3.ce-3.el7               docker-ce-stable
docker-ce.x86_64                18.06.2.ce-3.el7               docker-ce-stable
docker-ce.x86_64                18.06.1.ce-3.el7               docker-ce-stable
docker-ce.x86_64                18.06.0.ce-3.el7               docker-ce-stable
docker-ce.x86_64                18.03.1.ce-1.el7.centos         docker-ce-stable
docker-ce.x86_64                18.03.0.ce-1.el7.centos         docker-ce-stable
docker-ce.x86_64                17.12.1.ce-1.el7.centos         docker-ce-stable
docker-ce.x86_64                17.12.0.ce-1.el7.centos         docker-ce-stable
docker-ce.x86_64                17.09.1.ce-1.el7.centos         docker-ce-stable
docker-ce.x86_64                17.09.0.ce-1.el7.centos         docker-ce-stable
docker-ce.x86_64                17.06.2.ce-1.el7.centos         docker-ce-stable
docker-ce.x86_64                17.06.1.ce-1.el7.centos         docker-ce-stable
docker-ce.x86_64                17.06.0.ce-1.el7.centos         docker-ce-stable
docker-ce.x86_64                17.03.3.ce-1.el7               docker-ce-stable
docker-ce.x86_64                17.03.2.ce-1.el7.centos         docker-ce-stable
docker-ce.x86_64                17.03.1.ce-1.el7.centos         docker-ce-stable
docker-ce.x86_64                17.03.0.ce-1.el7.centos         docker-ce-stable
docker-ce-selinux.noarch        17.03.3.ce-1.el7               docker-ce-stable
docker-ce-selinux.noarch        17.03.2.ce-1.el7.centos         docker-ce-stable
docker-ce-selinux.noarch        17.03.1.ce-1.el7.centos         docker-ce-stable
docker-ce-selinux.noarch        17.03.0.ce-1.el7.centos         docker-ce-stable
docker-ce-cli.x86_64            1:19.03.5-3.el7                 docker-ce-stable
docker-ce-cli.x86_64            1:19.03.4-3.el7                 docker-ce-stable
docker-ce-cli.x86_64            1:19.03.3-3.el7                 docker-ce-stable
docker-ce-cli.x86_64            1:19.03.2-3.el7                 docker-ce-stable
docker-ce-cli.x86_64            1:19.03.1-3.el7                 docker-ce-stable
docker-ce-cli.x86_64            1:19.03.0-3.el7                 docker-ce-stable
docker-ce-cli.x86_64            1:18.09.9-3.el7                 docker-ce-stable
docker-ce-cli.x86_64            1:18.09.8-3.el7                 docker-ce-stable
docker-ce-cli.x86_64            1:18.09.7-3.el7                 docker-ce-stable
docker-ce-cli.x86_64            1:18.09.6-3.el7                 docker-ce-stable
docker-ce-cli.x86_64            1:18.09.5-3.el7                 docker-ce-stable
docker-ce-cli.x86_64            1:18.09.4-3.el7                 docker-ce-stable
docker-ce-cli.x86_64            1:18.09.3-3.el7                 docker-ce-stable
docker-ce-cli.x86_64            1:18.09.2-3.el7                 docker-ce-stable
docker-ce-cli.x86_64            1:18.09.1-3.el7                 docker-ce-stable
docker-ce-cli.x86_64            1:18.09.0-3.el7                 docker-ce-stable
Available Packages
[root@centos7 ~]#yum -y install docker-ce-18.09.9-3.el7 docker-ce-cli-18.09.9-3.el7
Dependencies Resolved
================================================================================
=========
 Package                         Arch             Version                   
Repository                 Size
================================================================================
=========
Installing:
 docker-ce                       x86_64           3:18.09.9-3.el7           
docker-ce-stable            21 M
 docker-ce-cli                   x86_64           1:18.09.9-3.el7           
docker-ce-stable            16 M
Installing for dependencies:
 audit-libs-python               x86_64           2.8.4-4.el7               
base                        76 k
 checkpolicy                     x86_64           2.5-8.el7                 
base                       295 k
 container-selinux               noarch           2:2.107-3.el7             
extras                      39 k
 containerd.io                   x86_64           1.2.10-3.2.el7           
docker-ce-stable            23 M
 libcgroup                       x86_64           0.41-20.el7               
base                        66 k
 libsemanage-python               x86_64           2.5-14.el7               
base                       113 k
 policycoreutils-python           x86_64           2.5-29.el7               
base                       456 k
 python-IPy                       noarch           0.75-6.el7               
base                        32 k
 setools-libs                     x86_64           3.3.8-4.el7               
base                       620 k
Transaction Summary
================================================================================
==============================
Install  2 Packages (+9 Dependent packages)
Total download size: 62 M
Installed size: 258 M
Downloading packages:
(1/4): container-selinux-2.107-3.el7.noarch.rpm                                   
    |  39 kB  00:00:00     
warning: /var/cache/yum/x86_64/7/docker-ce-stable/packages/containerd.io-1.2.10-3.2.el7.x86_64.rpm: Header V4 RSA/SHA512 Signature, key ID 621e9f35: NOKEY
Public key for containerd.io-1.2.10-3.2.el7.x86_64.rpm is not installed
(2/4): containerd.io-1.2.10-3.2.el7.x86_64.rpm                                   
      |  23 MB  00:00:03     
(3/4): docker-ce-18.09.9-3.el7.x86_64.rpm                                         
    |  21 MB  00:00:04     
(4/4): docker-ce-cli-18.09.9-3.el7.x86_64.rpm                                     
    |  16 MB  00:00:01                
Complete!
[root@centos7 ~]#docker version
Client:
 Version:           18.09.9
 API version:       1.39
 Go version:       go1.11.13
 Git commit:       039a7df9ba
 Built:             Wed Sep  4 16:51:21 2019
 OS/Arch:           linux/amd64
 Experimental:      false
Cannot connect to the Docker daemon at unix:///var/run/docker.sock. Is the docker 
daemon running?
[root@centos7 ~]#systemctl enable --now docker
[root@centos7 ~]#docker version
Client:
 Version:           18.09.9
 API version:       1.39
 Go version:       go1.11.13
 Git commit:       039a7df9ba
 Built:             Wed Sep  4 16:51:21 2019
 OS/Arch:           linux/amd64
 Experimental:      false
Server: Docker Engine - Community
 Engine:
 Version:          18.09.9
 API version:      1.39 (minimum version 1.12)
 Go version:       go1.11.13
 Git commit:       039a7df
 Built:           Wed Sep  4 16:22:32 2019
 OS/Arch:         linux/amd64
 Experimental:     false
[root@centos7 ~]#
```

### 1.2.2.3 Linux 二进制安装

本方法适用于无法上网(如部分公司的内网隔离环境）或无法通过包安装方式安装的主机上安装docker  
安装文档: <https://docs.docker.com/install/linux/docker-ce/binaries/>  
**二进制安装下载路径**  
<https://download.docker.com/linux/>  
<https://mirrors.aliyun.com/docker-ce/linux/static/stable/x86_64/>  
**范例:**

```
[root@centos8 ~]#wget 
https://download.docker.com/linux/static/stable/x86_64/docker-19.03.5.tgz
[root@centos8 ~]#tar xvf docker-19.03.5.tgz 
docker/
docker/docker-init
docker/docker
docker/dockerd
docker/runc
docker/ctr
docker/docker-proxy
docker/containerd
docker/containerd-shim
[root@centos8 ~]#cp docker/* /usr/bin/
#创建组
[root@centos8 ~]#groupadd -r docker
#将Ubuntu1804或CentOS7基于包方式安装的相关文件复制到相应目录下
[root@ubuntu1804 ~]#scp /lib/systemd/system/docker.* 
/lib/systemd/system/containerd.service 10.0.0.8:/lib/systemd/system/
root@10.0.0.8's password: 
docker.service                                             100% 1683   650.8KB/s 
  00:00  
docker.socket                                              100%  197   303.3KB/s 
  00:00 
containerd.service                                         100%  487   516.6KB/s 
  00:00 
[root@centos8 ~]#systemctl daemon-reload
[root@centos8 ~]#systemctl enable --now docker
[root@centos8 ~]#docker version
Client: Docker Engine - Community
 Version:           19.03.5
 API version:       1.40
 Go version:       go1.12.12
 Git commit:       633a0ea838
 Built:             Wed Nov 13 07:22:05 2019
 OS/Arch:           linux/amd64
 Experimental:      false
Server: Docker Engine - Community
 Engine:
 Version:          19.03.5
 API version:      1.40 (minimum version 1.12)
 Go version:       go1.12.12
 Git commit:       633a0ea838
 Built:           Wed Nov 13 07:28:45 2019
 OS/Arch:         linux/amd64
 Experimental:     false
 containerd:
 Version:         v1.2.10
 GitCommit:       b34a5c8af56e510852c35414db4c1f4fa6172339
 runc:
 Version:          1.0.0-rc8+dev
 GitCommit:       3e425f80a8c931f88e6d94a8c831b9d5aa481657
 docker-init:
 Version:          0.18.0
 GitCommit:       fec3683
[root@centos8 ~]#docker run hello-world
Unable to find image 'hello-world:latest' locally
latest: Pulling from library/hello-world
1b930d010525: Pull complete 
Digest: sha256:9572f7cdcee8591948c2963463447a53466950b3fc15a247fcad1917ca215a2f
Status: Downloaded newer image for hello-world:latest
Hello from Docker!
This message shows that your installation appears to be working correctly.
To generate this message, Docker took the following steps:
1. The Docker client contacted the Docker daemon.
2. The Docker daemon pulled the "hello-world" image from the Docker Hub.
   (amd64)
3. The Docker daemon created a new container from that image which runs the
   executable that produces the output you are currently reading.
4. The Docker daemon streamed that output to the Docker client, which sent it
   to your terminal.
To try something more ambitious, you can run an Ubuntu container with:
$ docker run -it ubuntu bash
Share images, automate workflows, and more with a free Docker ID:
 https://hub.docker.com/
For more examples and ideas, visit:
 https://docs.docker.com/get-started/
[root@centos8 ~]#pstree -p #查看docker结构
```

### 1.2.2.4 在不同系统上实现一键安装 docker 脚本

### 1.2.2.4.1 基于 ubuntu 1804和20.04 的 一键安装 docker 脚本

```
[root@ubuntu1804 ~]#cat install_docker_ubuntu.sh
#!/bin/bash
#Description: Install docker on Ubuntu18.04 and 20.04
#Version:1.0
#Date:2020-01-22
COLOR="echo -e \\033[1;31m"
END="\033[m"
DOCKER_VERSION="5:19.03.5~3-0~ubuntu-bionic"
install_docker(){
dpkg -s docker-ce &> /dev/null && ${COLOR}"Docker已安装，退出"${END} && exit
apt update
apt  -y install apt-transport-https ca-certificates curl software-properties-common
#curl -fsSL https://mirrors.aliyun.com/docker-ce/linux/ubuntu/gpg | sudo apt-key 
add -
#add-apt-repository "deb [arch=amd64] https://mirrors.aliyun.com/docker-ce/linux/ubuntu $(lsb_release -cs) stable"
curl -fsSL https://mirrors.tuna.tsinghua.edu.cn/docker-ce/linux/ubuntu/gpg | 
sudo apt-key add -
add-apt-repository "deb [arch=amd64] 
https://mirrors.tuna.tsinghua.edu.cn/docker-ce/linux/ubuntu $(lsb_release -cs)
stable"
apt update
${COLOR}"Docker有以下版本"${END}
apt-cache madison docker-ce
${COLOR}"5秒后即将安装: docker-"${DOCKER_VERSION}" 版本....."${END}
${COLOR}"如果想安装其它Docker版本，请按ctrl+c键退出，修改版本再执行"${END}
sleep 5
apt -y install docker-ce=${DOCKER_VERSION} docker-ce-cli=${DOCKER_VERSION}
mkdir -p /etc/docker
tee /etc/docker/daemon.json <<-'EOF'
{
  "registry-mirrors": ["https://si7y70hh.mirror.aliyuncs.com"]
}
EOF
systemctl daemon-reload
systemctl enable --now docker
docker version && ${COLOR}"Docker 安装成功"${END} ||  ${COLOR}"Docker 安装失败"${END}
}
install_docker
```

### 1.2.2.4.2 基于 CentOS 7 实现一键安装docker 脚本

```
[root@centos7 ~]#cat install_docker_for_centos7.sh 
#!/bin/bash
COLOR="echo -e \\033[1;31m"
END="\033[m"
VERSION="19.03.5-3.el7"
wget -P /etc/yum.repos.d/ https://mirrors.tuna.tsinghua.edu.cn/dockerce/linux/centos/docker-ce.repo || { ${COLOR}"互联网连接失败，请检查网络配
置!"${END};exit; }

yum clean all 
yum -y install docker-ce-$VERSION docker-ce-cli-$VERSION || { ${COLOR}"Base,Extras的yum源失败,请检查yum源配置"${END};exit; }

#使用阿里做镜像加速
mkdir -p /etc/docker
cat > /etc/docker/daemon.json <<EOF
{
"registry-mirrors": ["https://si7y70hh.mirror.aliyuncs.com"]
 }
EOF

systemctl enable --now docker
docker version && ${COLOR}"Docker安装成功"${END} || ${COLOR}"Docker安装失败"${END}
```

### 1.2.3 docker 命令帮助

官方文档: <https://docs.docker.com/reference/>  
docker 命令是最常使用的docker 客户端命令，其后面可以加不同的参数以实现不同的功能，  
docker 命令有很多子命令，可以用下面方法查看帮助

```
#docker 命令帮助
man docker 
docker
docker  --help

#docker 子命令帮助
man docker-COMMAND
docker COMMAND --help
```

### 1.2.4 验证 docker 信息

```
[root@ubuntu1804 ~]#docker info
Client:
 Debug Mode: false     #client 端是否开启 debug
Server:
 Containers: 2   #当前主机运行的容器总数
 Running: 0     #有几个容器是正在运行的
 Paused: 0      #有几个容器是暂停的
 Stopped: 2     #有几个容器是停止的
 Images: 4       #当前服务器的镜像数
 Server Version: 19.03.5   #服务端版本
 Storage Driver: overlay2  #正在使用的存储引擎
 Backing Filesystem: extfs   #后端文件系统，即服务器的磁盘文件系统
 Supports d_type: true  #是否支持 d_type
 Native Overlay Diff: true  #是否支持差异数据存储
 Logging Driver: json-file   #日志类型
 Cgroup Driver: cgroupfs  #Cgroups 类型
 Plugins:                  #插件
 Volume: local            #卷
 Network: bridge host ipvlan macvlan null overlay # overlay 跨主机通信
 Log: awslogs fluentd gcplogs gelf journald json-file local logentries splunk syslog  #日 志类型
 Swarm: inactive    #是否支持 swarm
 Runtimes: runc     #已安装的容器运行时
 Default Runtime: runc   #默认使用的容器运行时
 Init Binary: docker-init   #初始化容器的守护进程，即 pid 为 1 的进程
 containerd version: b34a5c8af56e510852c35414db4c1f4fa6172339 #版本
 runc version: 3e425f80a8c931f88e6d94a8c831b9d5aa481657  #runc 版本
 init version: fec3683  #init 版本
 Security Options:   #安全选项
 apparmor     #安全模块，https://docs.docker.com/engine/security/apparmor/
 seccomp  #安全计算模块，即制容器操作，
https://docs.docker.com/engine/security/seccomp/
   Profile: default  #默认的配置文件
 Kernel Version: 4.15.0-29-generic  #宿主机内核版本
 Operating System: Ubuntu 18.04.1 LTS  #宿主机操作系统
 OSType: linux    #宿主机操作系统类型
 Architecture: x86_64   #宿主机架构
 CPUs: 1    #宿主机 CPU 数量
 Total Memory: 962MiB   #宿主机总内存
 Name: ubuntu1804.magedu.org #宿主机 hostname
 ID: IZHJ:WPIN:BRMC:XQUI:VVVR:UVGK:NZBM:YQXT:JDWB:33RS:45V7:SQWJ #宿主机 ID
 Docker Root Dir: /var/lib/docker  #宿主机关于docker数据的保存目录
 Debug Mode: false   #server 端是否开启 debug
 Registry: https://index.docker.io/v1/  #仓库路径
 Labels:
 Experimental: false  #是否测试版
 Insecure Registries:
  127.0.0.0/8 : #非安全的镜像仓库
 Registry Mirrors:
 https://si7y70hh.mirror.aliyuncs.com/   #镜像仓库
 Live Restore Enabled: false  #是否开启活动重启 (重启docker-daemon 不关闭容器 )
WARNING: No swap limit support  #系统警告信息 (没有开启 swap 资源限制 )
```

**范例: 解决上述SWAP报警提示**

```
[root@ubuntu1804 ~]# vim /etc/default/grub
GRUB_DEFAULT=0
GRUB_TIMEOUT_STYLE=hidden
GRUB_TIMEOUT=2
GRUB_DISTRIBUTOR=`lsb_ release -i -s 2> /dev/null || echo Debian`
GRUB_CMDLINE_LINUX_DEFAULT=""
GRUB_CMDLINE_LINUX="net.ifnames=0 biosdevname=0 swapaccount=1"  #修改此行
[root@ubuntu1804 ~]# update-grub
[root@ubuntu1804 ~]# reboot
```

### 1.3 镜像管理

### 1.3.1 镜像结构和原理

镜像即创建容器的模版，含有启动容器所需要的文件系统及所需要的内容，因此镜像主要用于方便和快速的创建并启动容器

镜像含里面是一层层的文件系统,叫做 Union FS（联合文件系统）,联合文件系统，可以将几层目录挂载到一起（就像千层饼，洋葱头，俄罗斯套娃一样），形成一个虚拟文件系统,虚拟文件系统的目录结构就像普通 linux 的目录结构一样，镜像通过这些文件再加上宿主机的内核共同提供了一个 linux 的虚拟环境，每一层文件系统叫做一层layer，联合文件系统可以对每一层文件系统设置三种权限，只读（readonly）、读写（readwrite）和写出（whiteout-able），但是镜像中每一层文件系统都是只读的,  
构建镜像的时候，从一个最基本的操作系统开始，每个构建提交的操作都相当于做一层的修改，增加了一层文件系统，一层层往上叠加，上层的修改会覆盖底层该位置的可见性，这也很容易理解，就像上层把底层遮住了一样，当使用镜像的时候，我们只会看到一个完全的整体，不知道里面有几层,实际上也不需要知道里面有几层。

**查看镜像的分层结构命令**：`docker pull nginx`  
**查看镜像分层历史命令**：`docker image history nginx`

### 1.3.2 搜索镜像

### 1.3.2.1 搜索镜像

### 1.3.2.1.1 官方网站进行镜像的搜索

官网: <http://hub.docker.com>

### 1.3.2.2.2 执行docker search命令进行搜索

命令：`docker search centos`  
**范例: 选择性的查找镜像**  
**#搜索点赞100个以上的镜像**

```
#旧语法
[root@ubuntu1804 ~]#docker search -s 100 centos
Flag --stars has been deprecated, use --filter=stars=3 instead       
......  
#新语法
[root@ubuntu1804 ~]#docker search --filter=stars=100 centos
NAME                     DESCRIPTION                                     STARS   
            OFFICIAL           AUTOMATED
centos                   The official build of CentOS.                   6096   
            [OK]                
ansible/centos7-ansible   Ansible on Centos7                              132   
                                  [OK]
consol/centos-xfce-vnc   Centos container with "headless" VNC session…   117   
                                  [OK]
jdeathe/centos-ssh       OpenSSH / Supervisor / EPEL/IUS/SCL Repos - …   115   
                                  [OK]
```

### 1.3.3 下载镜像

从docker 仓库将镜像下载到本地，命令格式如下:

```
docker pull [OPTIONS] NAME[:TAG|@DIGEST]
Options:
  -a, --all-tags              ` Download all tagged images in the repository`
      --disable-content-trust  ` Skip image verification (default true)`
      --platform string         `Set platform if server is multi-platform capable`
  -q, --quiet                    `Suppress verbose output`

NAME: 是镜像名,一般的形式 仓库服务器:端口/项目名称/镜像名称
:TAG: 即版本号,如果不指定 :TAG 则下载最新版镜像,latest
```

**镜像下载说明**

```
[root@ubuntu1804 ~]#docker pull hello-world
Using default tag: latest   #默认下载最新版本
latest: Pulling from library/hello-world
1b930d010525: Pull complete  #分层下载
Digest: sha256:9572f7cdcee8591948c2963463447a53466950b3fc15a247fcad1917ca215a2f 
#摘要
Status: Downloaded newer image for hello-world:latest
docker.io/library/hello-world:latest  #下载的完整地址
```

**镜像下载保存的路径:/var/lib/docker/overlay2/镜像ID**  
`注意: 镜像下载完成后，会自动解压缩，比官网显示的可能会大很多，如: centos8.1.1911下载时只有70MB，下载完后显示237MB`  
**范例: 从docker官网下载镜像**

```
docker pull hello-world
docker pull alpine
docker pull busybox
docker pull nginx    
docker pull centos
docker pull centos:centos7.7.1908
docker pull docker.io/library/mysql:5.7.30
docker pull mysql:5.6.47
```

`范例: 指定 TAG下载特定版本的镜像`

```
[root@ubuntu1804 ~]#docker pull docker.io/library/mysql:5.7.30
5.7.29: Pulling from library/mysql
804555ee0376: Pull complete 
c53bab458734: Pull complete
ca9d72777f90: Pull complete 
2d7aad6cb96e: Pull complete 
8d6ca35c7908: Pull complete 
6ddae009e760: Pull complete 
327ae67bbe7b: Pull complete 
9e05241b7707: Pull complete 
e822978df8f0: Pull complete 
14ca71ed53be: Pull complete 
026afe6fd35e: Pull complete 
Digest: sha256:2ca675966612f34b4036bbcfa68cb049c03e34b561fba0f88954b03931823d29
Status: Downloaded newer image for mysql:5.7.30
docker.io/library/mysql:5.7.30
[root@ubuntu1804 ~]#docker pull mysql:5.6.47
```

### 1.3.4 docker 镜像加速配置

```
### 1. 安装／升级Docker客户端
推荐安装1.10.0以上版本的Docker客户端，参考文档 docker-ce
    
### 2. 配置镜像加速器
修改daemon配置文件/etc/docker/daemon.json来使用加速器
mkdir -p /etc/docker
tee /etc/docker/daemon.json <<-'EOF'
{
  "registry-mirrors": ["https://si7y70hh.mirror.aliyuncs.com"]
}
EOF
#网易云: http://hub-mirror.c.163.com/
#腾讯云: https://mirror.ccs.tencentyun.com
systemctl daemon-reload
systemctl restart docker
```

**范例: 利用阿里云实现镜像加速**

```
[root@ubuntu1804 ~]#docker info |tail
WARNING: the overlay storage-driver is deprecated, and will be removed in a future release.
 ID: IZHJ:WPIN:BRMC:XQUI:VVVR:UVGK:NZBM:YQXT:JDWB:33RS:45V7:SQWJ
 Docker Root Dir: /var/lib/docker
 Debug Mode: false
 Registry: https://index.docker.io/v1/
 Labels:
 Experimental: false
 Insecure Registries:
  127.0.0.0/8
 Live Restore Enabled: false
[root@ubuntu1804 ~]#vim /etc/docker/daemon.json 
[root@ubuntu1804 ~]#cat /etc/docker/daemon.json
{
  "storage-driver": "overlay",
  "registry-mirrors": ["https://si7y70hh.mirror.aliyuncs.com"] 
}
[root@ubuntu1804 ~]#systemctl daemon-reload 
[root@ubuntu1804 ~]#systemctl restart docker
[root@ubuntu1804 ~]#docker info |tail
WARNING: the overlay storage-driver is deprecated, and will be removed in a future release.
 Debug Mode: false
 Registry: https://index.docker.io/v1/
 Labels:
 Experimental: false
 Insecure Registries:
  127.0.0.0/8
 Registry Mirrors:
 https://si7y70hh.mirror.aliyuncs.com/
 Live Restore Enabled: false
```

### 1.3.5 查看本地镜像

`docker images` 可以查看下载至本地的镜像，格式：

```
docker images [OPTIONS] [REPOSITORY[:TAG]]
常用选项:  
-q, --quiet     Only show numeric IDs
-a, --all Show all images (default hides intermediate images)
--digests       Show digests
--no-trunc     Don't truncate output
```

**执行结果的显示信息说明:**

```
REPOSITORY      #镜像所属的仓库名称
TAG         #镜像版本号（标识符），默认为latest
IMAGE ID       #镜像唯一ID标识,如果ID相同,说明是同一个镜像有多个名称
CREATED       #镜像创建时间
VIRTUAL SIZE    #镜像的大小
```

**范例:**

```
[root@ubuntu1804 ~]#docker images 
REPOSITORY         TAG                 IMAGE ID           CREATED             
SIZE
alpine              3.11.3             e7d92cdc71fe        7 days ago         
5.59MB
centos             centos8.1.1911     470671670cac        7 days ago         
237MB
busybox             latest             6d5fcfe5ff17        4 weeks ago         
1.22MB
hello-world         latest             fce289e99eb9        12 months ago       
1.84kB
[root@ubuntu1804 ~]#docker images -q
e7d92cdc71fe
470671670cac
6d5fcfe5ff17
fce289e99eb9
#显示完整的ImageID
[root@ubuntu1804 ~]#docker images --no-trunc
REPOSITORY         TAG                 IMAGE ID                                 
                                CREATED             SIZE
tomcat              9.0.37-v1           
sha256:b8d669ebf99e65d5ed69378d0d53f054e7de4865d335ab7aa0a7a5508e1369f7   47
hours ago       652MB
tomcat             latest             
sha256:df72227b40e1985fa5ad529b9ca6582612a41d8f1ddf3a1bea1aa2cfcfa8fb07   5 days 
ago         647MB
nginx               latest             
sha256:0901fa9da894a8e9de5cb26d6749eaffb67b373dc1ff8a26c46b23b1175c913a   11
days ago         132MB
ubuntu             latest             
sha256:adafef2e596ef06ec2112bc5a9663c6a4f59a3dfd4243c9cabe06c8748e7f288   2
weeks ago         73.9MB
busybox             latest             
sha256:c7c37e472d31c1685b48f7004fd6a64361c95965587a951692c5f298c6685998   3
weeks ago         1.22MB
alpine             latest             
sha256:a24bb4013296f61e89ba57005a7b3e52274d8edd3ae2077d04395f806b63d83e   7
weeks ago         5.57MB
redis               5.0.9-alpine3.11   
sha256:3661c84ee9d0f6312a076b69eb2bd112674cadb70ef7e1594c4f00193f8df08e   2
months ago        29.8MB
#只查看指定REPOSITORY的镜像
[root@ubuntu1804 ~]#docker images tomcat
REPOSITORY         TAG                 IMAGE ID           CREATED             
SIZE
tomcat              9.0.37-v1           b8d669ebf99e        47 hours ago       
652MB
tomcat             latest             df72227b40e1        5 days ago         
647MB
#查看指定镜像的信息
[root@centos8 ~]#podman image inspect alpine
[
   {
        "Id": 
"e7d92cdc71feacf90708cb59182d0df1b911f8ae022d29e8e95d75ca6a99776a",
        "Digest": 
"sha256:ddba4d27a7ffc3f86dd6c2f92041af252a1f23a8e742c90e6e1297bfa1bc0c45",
        "RepoTags": [
            "docker.io/library/alpine:latest"
       ],
        "RepoDigests": [
           
"docker.io/library/alpine@sha256:ddba4d27a7ffc3f86dd6c2f92041af252a1f23a8e742c9e6e1297bfa1bc0c45"
       ],
        "Parent": "",
        "Comment": "",
        "Created": "2020-01-18T01:19:37.187497623Z",
        "Config": {
            "Env": [
               
"PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
           ],
            "Cmd": [
                "/bin/sh"
           ]
       },
        "Version": "18.06.1-ce",
        "Author": "",
        "Architecture": "amd64",
        "Os": "linux",
        "Size": 5859847,
        "VirtualSize": 5859847,
        "GraphDriver": {
            "Name": "overlay",
            "Data": {
                "MergedDir": 
"/var/lib/containers/storage/overlay/5216338b40a7b96416b8b9858974bbe4acc3096ee60acbc4dfb1ee02aecceb10/merged",
                "UpperDir": 
"/var/lib/containers/storage/overlay/5216338b40a7b96416b8b9858974bbe4acc3096ee60acbc4dfb1ee02aecceb10/diff",
......省略
```

**范例: 查看镜像的名称和TAG**

```
[root@centos7 ~]#docker image ls --format "{{.Repository}}:{{.Tag}}"
busybox:latest
ubuntu:latest
alpine:3.13.5
centos:centos8.3.2011
centos:latest
```

### 1.3.6 镜像导出

利用`docker save`命令可以将从本地镜像导出问为一个打包 tar文件，然后复制到其他服务器进行导入使用，格式:

```
docker save [OPTIONS] IMAGE [IMAGE...]
选项:  
-o, --output string   Write to a file, instead of STDOUT
#说明:
Docker save 使用IMAGE ID导出，在导入后的镜像没有REPOSITORY和TAG,显示为<none>
```

**常见用法:**

```
docker save IMAGE -o /path/file.tar
docker save IMAGE > /path/file.tar
```

**范例：**

```
[root@ubuntu1804 ~]#docker save mysql:5.7.30 -o /data/mysql5.7.29.tar
[root@ubuntu1804 ~]#docker save alpine:3.11.3 > /data/alpine.tar
[root@ubuntu1804 ~]#scp /data/mysql5.7.29.tar /data/alpine.tar   10.0.0.7:/data
The authenticity of host '10.0.0.7 (10.0.0.7)' can't be established.
ECDSA key fingerprint is SHA256:5bc0+A46C5m0zxT3WKIBg/i+oVUq9avVRjO9dy9gz2k.
Are you sure you want to continue connecting (yes/no)? yes
Warning: Permanently added '10.0.0.7' (ECDSA) to the list of known hosts.
root@10.0.0.7's password: 
mysql5.7.29.tar                                  100% 420MB  32.2MB/s   00:13   
alpine.tar                                       100% 5728KB  39.1MB/s   00:00  
```

**范例: 导出所有镜像至不同的文件中**

```
[root@centos8 ~]#docker images | awk 'NR!=1{print $1,$2}' | while read repo tag ;do docker save   $repo:$tag -o /opt/$repo-$tag.tar ;done
[root@centos8 ~]#ls /opt/*.tar
/opt/alpine-3.13.5.tar /opt/busybox-latest.tar /opt/centos-centos8.3.2011.tar 
/opt/centos-latest.tar /opt/ubuntu-latest.tar
```

### 1.3.7 镜像导入

利用`docker load`命令可以将镜像导出的压缩文件再导入，格式:

```
docker load [OPTIONS]
#选项
-i, --input string   Read from tar archive file, instead of STDIN
-q, --quiet         Suppress the load output
```

**常见用法:**

```
docker load -i /path/file.tar
docker load < /path/file.tar
```

**范例:**

```
#方法1: 使用image ID导出镜像,在导入后的镜像没有REPOSITORY和TAG,显示为<none>
[root@ubuntu1804 ~]#docker save `docker images -qa` -o all.tar
[root@ubuntu1804 ~]#scp all.tar 10.0.0.7:
[root@centos7 ~]#docker load -i all.tar
[root@centos7 ~]#docker images
REPOSITORY         TAG                 IMAGE ID           CREATED             
SIZE
<none>             <none>             a77dce18d0ec        10 days ago         
1.24MB
<none>             <none>             389fef711851        3 weeks ago         
5.58MB
<none>             <none>             300e315adb2f        4 weeks ago         
209MB
<none>             <none>             f643c72bc252        6 weeks ago         
72.9MB
#方法2: 将所有镜像导入到一个文件中,此方法导入后可以看REPOSITORY和TAG
[root@ubuntu1804 ~]#docker save `docker images | awk 'NR!=1{print $1":"$2}'` -o backup.tar
[root@ubuntu1804 ~]#scp backup.tar 10.0.0.200:
root@ubuntu2004:~# docker load -i backup.tar 
root@ubuntu2004:~# docker images
REPOSITORY   TAG       IMAGE ID       CREATED       SIZE
busybox     uclibc   a77dce18d0ec   10 days ago   1.24MB
alpine       latest   389fef711851   3 weeks ago   5.58MB
centos       latest   300e315adb2f   4 weeks ago   209MB
ubuntu       latest   f643c72bc252   6 weeks ago   72.9MB
```

### 1.3.8 删除镜像

`docker rmi` 命令可以删除本地镜像，格式：

```
docker rmi [OPTIONS] IMAGE [IMAGE...]
#选项:
-f, --force     Force removal of the image
    --no-prune   Do not delete untagged parents
```

**范例: 删除多个镜像**  
`[root@ubuntu1804 ~]#docker rmi nginx tomcat`  
**范例: 强制删除正在使用的镜像，也会删除对应的容器**

```
[root@ubuntu1804 ~]#docker ps -a
CONTAINER ID       IMAGE                   COMMAND                 CREATED     
        STATUS                       PORTS                     NAMES
b5a0d2e1e1d0       centos:centos8.1.1911   "bash"                   41 minutes 
ago     Up 41 minutes                                           jolly_burnell
[root@ubuntu1804 ~]#docker rmi centos:centos8.1.1911
Error response from daemon: conflict: unable to remove repository reference 
"centos:centos8.1.1911" (must force) - container b5a0d2e1e1d0 is using its 
referenced image 470671670cac
[root@ubuntu1804 ~]#docker rmi -f centos:centos8.1.1911
Untagged: centos:centos8.1.1911
Untagged: 
centos@sha256:fe8d824220415eed5477b63addf40fb06c3b049404242b31982106ac204f6700
[root@ubuntu1804 ~]#docker ps -a
CONTAINER ID       IMAGE               COMMAND                 CREATED         
    STATUS                       PORTS                     NAMES
```

### 1.3.9 镜像打标签

`docker tag` 可以给镜像打标签，类似于起别名，格式：  
`docker tag SOURCE_IMAGE[:TAG] TARGET_IMAGE[:TAG]`  
TAG默认为latest  
**范例:**

```
[root@ubuntu1804 ~]#docker images 
REPOSITORY         TAG                 IMAGE ID           CREATED             
SIZE
alpine             latest             e7d92cdc71fe        11 days ago         
5.59MB
centos             centos7.7.1908     08d05d1d5859        2 months ago       
204MB
[root@ubuntu1804 ~]#docker tag alpine alpine:3.11
[root@ubuntu1804 ~]#docker images 
REPOSITORY         TAG                 IMAGE ID           CREATED             
SIZE
alpine              3.11               e7d92cdc71fe        11 days ago         
5.59MB
alpine             latest             e7d92cdc71fe        11 days ago         
5.59MB
centos             centos7.7.1908     08d05d1d5859        2 months ago       
204MB
```

**总结: 企业使用镜像及常见操作: 搜索、下载、导出、导入、删除**  
**命令总结:**

```
docker search centos
docker pull alpine
docker images
docker save > /opt/centos.tar #centos #导出镜像
docker load -i /opt/centos.tar  #导入本地镜像
docker rmi 镜像ID/镜像名称  #删除指定ID的镜像，此镜像对应容器正启动镜像不能被删除，除非将容器全部关闭
```

### 1.4 容器操作基础命令

### 1.4.1 启动容器

`docker run` 可以启动容器，进入到容器，并随机生成容器ID和名称

### 1.4.1.1 启动容器用法

帮助: `man docker-run`  
**命令格式:**

```
docker run [选项] [镜像名] [shell命令] [参数]
选项:  
-i, --interactive   Keep STDIN open even if not attached，通常和-t一起使用
-t, --tty           分配pseudo-TTY，通常和-i一起使用,注意对应的容器必须运行shell才支持进入
-d, --detach         Run container in background and print container ID,台后运行，默认前台
--name string       Assign a name to the container
--rm                 Automatically remove the container when it exits
-p, --publish list   Publish a container's port(s) to the host
-P, --publish-all   Publish all exposed ports to random ports
--dns list           Set custom DNS servers
--entrypoint string Overwrite the default ENTRYPOINT of the image
--restart policy  
--privileged         Give extended privileges to container,此选项慎用
-e, --env=[] Set environment variables
--env-file=[]       Read in a line delimited file of environment variables
```

**注意: 容器启动后,如果容器内没有前台运行的进程,将自动退出停止**  
从容器内退出,并停止容器：`exit`  
从容器内退出,且容器不停止：`同时按三个键，ctrl+p+q`  
**范例: 运行容器**  
**#启动容器，自动随机字符作为容器名**

```
[root@ubuntu1804 ~]#docker run alpine 
[root@ubuntu1804 ~]#docker ps -a
CONTAINER ID       IMAGE               COMMAND             CREATED             
STATUS                     PORTS               NAMES
95967eaefd6a       alpine              "/bin/sh"           8 seconds ago       
Exited (0) 6 seconds ago                       confident_elion
```

**范例: 一次性运行容器中命令**  
**#启动的容器在执行完shell命令就退出，用于测试**

```
[root@ubuntu1804 ~]#docker run busybox echo "Hello laowang"
Unable to find image 'busybox:latest' locally
latest: Pulling from library/busybox
91f30d776fb2: Pull complete 
Digest: sha256:9ddee63a712cea977267342e8750ecbc60d3aab25f04ceacfa795e6fce341793
Status: Downloaded newer image for busybox:latest 
Hello laowang
[root@ubuntu1804 ~]#docker ps 
CONTAINER ID       IMAGE               COMMAND             CREATED             
STATUS             PORTS               NAMES
[root@ubuntu1804 ~]#docker ps -a
CONTAINER ID       IMAGE               COMMAND                 CREATED         
    STATUS                     PORTS               NAMES
7873aed1b5dd       busybox             "echo 'Hello laowang'"   19 seconds ago 
    Exited (0) 18 seconds ago                       pedantic_varahamihira
```

**范例: 指定容器名称**  
`#，注意每个容器的名称要唯一`

```
root@ubuntu1804 ~]#docker run --name alpine1 alpine 
[root@ubuntu1804 ~]#docker ps 
CONTAINER ID       IMAGE               COMMAND             CREATED             
STATUS             PORTS               NAMES
[root@ubuntu1804 ~]#docker ps -a
CONTAINER ID       IMAGE               COMMAND             CREATED             
STATUS                     PORTS               NAMES
edd2ac2690e6       alpine              "/bin/sh"           9 seconds ago       
Exited (0) 8 seconds ago                       alpine1
```

**什么是守护式容器:**

- 能够长期运行
- 无需交互式会话
- 适合运行应用程序和服务  
  **范例: 启动前台守护式容器**

```
[root@ubuntu1804 ~]#docker run nginx
Unable to find image 'nginx:latest' locally
latest: Pulling from library/nginx
6ec8c9369e08: Pull complete 
d3cb09a117e5: Pull complete 
7ef2f1459687: Pull complete 
e4d1bf8c9482: Pull complete 
795301d236d7: Pull complete 
Digest: sha256:0e188877aa60537d1a1c6484b8c3929cfe09988145327ee47e8e91ddf6f76f5c
Status: Downloaded newer image for nginx:latest
/docker-entrypoint.sh: /docker-entrypoint.d/ is not empty, will attempt to perform configuration
/docker-entrypoint.sh: Looking for shell scripts in /docker-entrypoint.d/
/docker-entrypoint.sh: Launching /docker-entrypoint.d/10-listen-on-ipv6-bydefault.sh
10-listen-on-ipv6-by-default.sh: Getting the checksum of 
/etc/nginx/conf.d/default.conf
10-listen-on-ipv6-by-default.sh: Enabled listen on IPv6 in
/etc/nginx/conf.d/default.conf
/docker-entrypoint.sh: Launching /docker-entrypoint.d/20-envsubst-ontemplates.sh
/docker-entrypoint.sh: Configuration complete; ready for start up
172.17.0.1 - - [28/Jul/2020:13:09:19 +0000] "GET / HTTP/1.1" 200 612 "-"
"curl/7.58.0" "-"
172.17.0.4 - - [28/Jul/2020:13:12:49 +0000] "GET / HTTP/1.1" 200 612 "-" "Wget"
"-"

[root@ubuntu1804 ~]#docker run --rm --name b1 busybox wget -qO - 172.17.0.3
<!DOCTYPE html>
<html>
<head>
<title>Welcome to nginx!</title>
<style>
.......省略
```

**范例: 启动后台守护式容器**

```
[root@ubuntu1804 ~]#docker run -d nginx 
888685a2487cf8150d264cb3086f78d0c3bddeb07b8ea9786aa3a564157a4cb8
[root@ubuntu1804 ~]#docker ps -l
CONTAINER ID       IMAGE               COMMAND                 CREATED         
    STATUS             PORTS               NAMES
888685a2487c       nginx               "/docker-entrypoint.…"   8 seconds ago   
    Up 6 seconds        80/tcp             busy_goodall
#有些容器后台启动不会持续运行
[root@ubuntu1804 ~]#docker run -d --name alpine4 alpine 
3a05bbf66dac8a6ac9829c876bdb5fcb70832bf4a2898d68f6979cd8e8c517cb
[root@ubuntu1804 ~]#docker ps -a
CONTAINER ID       IMAGE               COMMAND             CREATED             
STATUS                         PORTS               NAMES
3a05bbf66dac       alpine              "/bin/sh"           3 seconds ago       
Exited (0) 2 seconds ago                           alpine4
df428caf7128       alpine              "/bin/sh"           30 seconds ago       
Up 28 seconds                                       alpine3
6d64f47a83e6       alpine              "/bin/sh"           48 seconds ago       
Exited (0) 41 seconds ago                           alpine2
edd2ac2690e6       alpine              "/bin/sh"           About a minute ago   
Exited (0) About a minute ago                       alpine1
[root@ubuntu1804 ~]#docker run -td --name alpine5 alpine 
868b33da850cfcc7db8b84150fb9c7686b577889f10425bb4c5e17f28cf68a29
[root@ubuntu1804 ~]#docker ps -a
CONTAINER ID       IMAGE               COMMAND             CREATED             
STATUS                         PORTS               NAMES
868b33da850c       alpine              "/bin/sh"           2 seconds ago       
Up 1 second                                         alpine5
3a05bbf66dac       alpine              "/bin/sh"           23 seconds ago       
Exited (0) 23 seconds ago                           alpine4
df428caf7128       alpine              "/bin/sh"           50 seconds ago       
Up 49 seconds                                       alpine3
......省略
```

**范例: 开机自动运行容器**  
`#默认容器不会自动启动`

```
[root@ubuntu1804 ~]#docker run -d --name nginx -p 80:80 nginx 
bce473b8b1d2f728847cdc32b664cca1bd7578bf7bdac850b501e2e5557a718a
[root@ubuntu1804 ~]#docker ps 
CONTAINER ID       IMAGE                 COMMAND                 CREATED       
      STATUS             PORTS                                           NAMES
bce473b8b1d2       nginx                 "nginx -g 'daemon of…"   3 seconds ago 
      Up 2 seconds        0.0.0.0:80->80/tcp  
[root@ubuntu1804 ~]#reboot
[root@ubuntu1804 ~]#docker ps
CONTAINER ID       IMAGE       COMMAND     CREATED   STATUS       PORTS         
NAMES
#设置容器总是运行
[root@ubuntu1804 ~]#docker run -d --name nginx --restart=always -p 80:80 nginx
[root@ubuntu1804 ~]#reboot
[root@ubuntu1804 ~]#docker ps 
CONTAINER ID   IMAGE       COMMAND     CREATED       STATUS     PORTS   
NAMES
dbdba90076e1 nginx"nginx -g 'daemon of…" About a minute agoUp 49
seconds0.0.0.0:80->80/tcp   ng
```

### 1.4.2 查看容器信息

### 1.4.2.1 显示当前存在容器

格式：`docker ps [OPTIONS]`  
选项:

```
-a, --all             Show all containers (default shows just running)
-q, --quiet           Only display numeric IDs
-s, --size           Display total file sizes
-f, --filter filter   Filter output based on conditions provided
-l, --latest         Show the latest created container (includes all states)
-n, --last int       Show n last created containers (includes all states) 
(default -1)
```

**范例:**  
**#显示运行的容器**

```
[root@ubuntu1804 ~]#docker ps  
CONTAINER ID       IMAGE               COMMAND             CREATED             
STATUS             PORTS               NAMES
d7ece7f62532       centos              "/bin/bash"         23 seconds ago     
Up 22 seconds                           ecstatic_franklin
#显示全部容器，包括退出状态的容器
[root@ubuntu1804 ~]#docker ps -a
CONTAINER ID       IMAGE               COMMAND                 CREATED         
    STATUS                     PORTS               NAMES
d7ece7f62532       centos              "/bin/bash"              27 seconds ago 
    Up 26 seconds                                 ecstatic_franklin
dcdf71d17177       busybox             "/bin/echo 'hello wo…"   8 minutes ago   
    Exited (0) 8 minutes ago                       cool_jepsen
#只查看退出的容器
[root@ubuntu1804 ~]#docker ps -f "status=exited"
CONTAINER ID       IMAGE               COMMAND             CREATED             
STATUS                       PORTS               NAMES
0794bff71f5b       centos              "/bin/bash"         10 minutes ago     
Exited (130) 6 minutes ago                       centos01
#只显示容器ID
[root@ubuntu1804 ~]#docker ps -a -q
d7ece7f62532
dcdf71d17177
#显示容器大小
[root@ubuntu1804 ~]#docker ps -a -s
CONTAINER ID       IMAGE               COMMAND                 CREATED         
    STATUS                     PORTS               NAMES               SIZE
d7ece7f62532       centos              "/bin/bash"              51 seconds ago 
    Up 50 seconds                                 ecstatic_franklin   0B 
(virtual 237MB)
dcdf71d17177       busybox             "/bin/echo 'hello wo…"   8 minutes ago   
    Exited (0) 8 minutes ago                       cool_jepsen         0B 
(virtual 1.22MB)
[root@ubuntu1804 ~]   
#显示最新创建的容器(停止的容器也能显示)
[root@ubuntu1804 ~]#docker ps -l
```

**范例: 显示指定状态的容器**

```
[root@ubuntu1804 ~]#docker ps -a
CONTAINER ID       IMAGE               COMMAND                 CREATED         
    STATUS                       PORTS               NAMES
dd002f947cbe       nginx               "nginx -g 'daemon of…"   19 minutes ago 
    Exited (137) 11 minutes ago                       nginx2
1f3f82995e05       nginx               "nginx -g 'daemon of…"   19 minutes ago 
    Up 2 minutes                  80/tcp             nginx1
[root@ubuntu1804 ~]#docker ps 
CONTAINER ID       IMAGE               COMMAND                 CREATED         
    STATUS             PORTS               NAMES
1f3f82995e05       nginx               "nginx -g 'daemon of…"   19 minutes ago 
    Up 2 minutes        80/tcp             nginx1
[root@ubuntu1804 ~]#docker ps -f 'status=exited'
CONTAINER ID       IMAGE               COMMAND                 CREATED         
    STATUS                       PORTS               NAMES
dd002f947cbe       nginx               "nginx -g 'daemon of…"   19 minutes ago 
    Exited (137) 11 minutes ago                       nginx2
```

### 1.4.2.2 查看容器内的进程

`docker top CONTAINER [ps OPTIONS]`  
**范例：**

```
[root@ubuntu1804 ~]#docker run -d httpd
db144f1978148242dc20bd0be951628f1c00371b2c69dee53d84469c52995d8f
[root@ubuntu1804 ~]#docker top db144f19
UID       PID   PPID C   STIME TTY   TIME     CMD
root      9821  9797  3   22:02 ?     00:00:00 httpd -DFOREGROUND
daemon    9872  9821  0   22:02 ?     00:00:00 httpd -DFOREGROUND
daemon    9873  9821  0   22:02 ?     00:00:00 httpd -DFOREGROUND
daemon    9874  9821  0   22:02 ?     00:00:00 httpd -DFOREGROUND
[root@ubuntu1804 ~]#docker run -d alpine /bin/sh -c 'i=1;while true;do echo 
hello$i;let i++;sleep 1;done'
9997053f9766d4adf709d46161d7ec6739eacafbe8d4721133874b89112ad1a6
[root@ubuntu1804 ~]#docker top 9997
UID                 PID                 PPID               C                   
STIME               TTY                 TIME               CMD
root                10023               9997                3                   
22:03               ?                   00:00:00           /bin/sh -c i=1;while 
true;do echo hello$i;let i++;sleep 1;done
root                10074               10023               0                   
22:03               ?                   00:00:00            sleep 1
```

### 1.4.2.3 查看容器资源使用情况

```
docker stats [OPTIONS] [CONTAINER...]
Display a live stream of container(s) resource usage statistics
Options:
-a, --all             Show all containers (default shows just running)
    --format string   Pretty-print images using a Go template
    --no-stream       Disable streaming stats and only pull the first result
    --no-trunc       Do not truncate output
```

**范例:**

```
[root@ubuntu1804 ~]#docker stats 251c7c7cf2aa
CONTAINER ID NAME CPU % MEM USAGE / LIMIT     MEM % NET I/O   BLOCK I/O 
PIDS
251c7c7cf2aa busy_l0.00%  3.742MiB / 1.924GiB   0.19%  1.29kB / 0B0B / 8.19kB 
2
CONTAINER ID NAME CPU % MEM USAGE / LIMIT     MEM % NET I/O   BLOCK I/O 
PIDS
251c7c7cf2aa busy_l0.00%  3.742MiB / 1.924GiB   0.19%  1.29kB / 0B0B / 8.19kB 
2
#默认启动elasticsearch会使用较多的内存
[root@ubuntu1804 ~]#docker run -d --name elasticsearch -p 9200:9200 -p 9300:9300 
-e "discovery.type=single-node" elasticsearch:7.6.2
[root@ubuntu1804 ~]#curl 10.0.0.100:9200
{
  "name" : "29282e91d773",
  "cluster_name" : "docker-cluster",
  "cluster_uuid" : "w5lp_XmITliWa2Yc-XwJFw",
  "version" : {
    "number" : "7.6.2",
    "build_flavor" : "default",
    "build_type" : "docker",
    "build_hash" : "ef48eb35cf30adf4db14086e8aabd07ef6fb113f",
    "build_date" : "2020-03-26T06:34:37.794943Z",
    "build_snapshot" : false,
    "lucene_version" : "8.4.0",
    "minimum_wire_compatibility_version" : "6.8.0",
    "minimum_index_compatibility_version" : "6.0.0-beta1"
 },
  "tagline" : "You Know, for Search"
}
#查看所有容器
[root@ubuntu1804 ~]#docker stats
CONTAINER ID NAME   CPU %   MEM USAGE / LIMIT MEM % NET I/O BLOCK I/O     PIDS
5e470e7970f6 suspi  0.00%   3.992MiB / 1.924Gi0.20% 656B / 0B9.2MB / 8.19kB    2
829bcebbc9f6 elast  0.58%   1.24GiB / 1.924GiB64.43%2.97kB / 512kB / 729kB    47
#限制内存使用大小
[root@ubuntu1804 ~]#docker run -d --name elasticsearch -p 9200:9200 -p 9300:9300 
-e "discovery.type=single-node" -e ES_JAVA_OPTS="-Xms64m -Xmx128m" 
elasticsearch:7.6.2
[root@ubuntu1804 ~]#docker stats
CONTAINER ID NAME CPU % MEM USAGE / LIMIT     MEM % NET I/O   BLOCK     PIDS
29282e91d773 elasti254.23310.5MiB / 1.924GiB   15.76% 766B / 0B 766kB /46kB 22
```

**今天先整理到这里了，后续有时间了从"查看容器的详细信息"开始整理更新**
