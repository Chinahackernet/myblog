Docker是一种轻量级的虚拟化技术，它具备传统虚拟机无法比拟的优势，它更简易的安装和使用方式、更快的速度、服务集成和开源流程自动化。

  

# Docker的安装

  

安装Docker的基本要素：

1、Docker只支持64位CPU架构的计算机，目前不支持32位CPU；

2、建议系统的Linux内核版本为3.10以上；

3、Linux内核只需开启cgroups和namespace功能；

4、对于非Linux内核的平台，如Windows和OS X，需要安装使用Boot2Docker工具；

  

下面我们以CentOS7.5为例来安装Docker，以下操作均在root用户下操作。

Docker有企业版和社区版，我们安装社区版即可。在国内，由于各种原因，我们不用官方的源来安装，国内有很多的镜像站，比如阿里镜像，清华镜像等。

  

1、下载镜像仓库

```bash
cd /etc/yum.repo.d/
wget https://mirrors.tuna.tsinghua.edu.cn/docker-ce/linux/centos/docker-ce.repo
```

  

2、直接安装即可

```bash
yum install docker-ce
```

  

3、启动Docker

```bash
systemctl start docker
systemctl enable docker
```

  

Docker简单就安装完了。

如果需要配置镜像加速，这里以阿里云为例，登录到[https://cr.console.aliyun.com](https://cr.console.aliyun.com/)，然后获取自己独有的加速网址，配置/etc/docker/daemon.json中即可，这个文件是需要自己创建的。例如：

vim /etc/docker/daemon.json

```bash
{
  "registry-mirrors": ["https://5uuoznyf.mirror.aliyuncs.com"]
}
```

  

然后重启一下Docker即可：

```bash
systemctl daemon-reload
systemctl restart docker
```

  

# Docker的操作参数

  

用户在使用Docker，需要使用Docer命令行工具docker和Docker daemon建立通信，Docker daemon是Docker的守护进程，负责接收并分发执行Docker命令。

  

为了了解Docker命令行工具的概况，我们可以使用Docker命令或Docker help命令来获取Docker的命令清单，如下：

```bash
[root@hjkj ansible]# docker
Usage:	docker [OPTIONS] COMMAND

Management Commands:
  builder     Manage builds
  config      Manage Docker configs
  container   Manage containers
  engine      Manage the docker engine
  image       Manage images
  network     Manage networks
  node        Manage Swarm nodes
  plugin      Manage plugins
  secret      Manage Docker secrets
  service     Manage services
  stack       Manage Docker stacks
  swarm       Manage Swarm
  system      Manage Docker
  trust       Manage trust on Docker images
  volume      Manage volumes

Commands:
  attach      Attach local standard input, output, and error streams to a running container
  build       Build an image from a Dockerfile
  commit      Create a new image from a container's changes
	......
  update      Update configuration of one or more containers
  version     Show the Docker version information
  wait        Block until one or more containers stop, then print their exit codes

```

  

可以看到Docker的命令非常多，现在Docker官方已经将Docker命令分组了，当前以前的命令方式还是保留着。值得一提的是docker命令执行一般都需要获取root权限，因为Docker的命令行工具docker和Docker daemon是同一个二进制文件，而Docker daemon负责接收来自docker的命令，它的运行需要root权限。同时，Docker从0.5.2版本开始，Docker daemon默认绑定了一个UNIX Socket来代替原有的TCP端口，改UNIX Socket默认是属于root用户的。因此在执行docker命令时，需要root权限。

  

docker有非常多的命令，相应的命令都可以通过docker COMMAND --help来查看具体如何使用，包括子命令的使用方法以及可用的操作参数。

  

我们将docker的子命令进行如下分类：

<table class="lake-table" style="width: 707px;"><colgroup><col span="1" width="158" /><col span="1" width="548" /></colgroup><tbody><tr style="height: 33px;"><td><p>子命令分类</p></td><td><p>子命令</p></td></tr><tr style="height: 33px;"><td><p>Docker环境信息</p></td><td><p>info version</p></td></tr><tr style="height: 33px;"><td><p>容器生命周期管理</p></td><td><p>create exec kill pause restart rm run start stop unpause</p></td></tr><tr style="height: 33px;"><td colspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><p>镜像仓库命令</p></td><td colspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><p>login logout pull push search</p></td></tr><tr style="height: 33px;"><td colspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><p>镜像管理</p></td><td colspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><p>build images import load rmi save tag commit</p></td></tr><tr style="height: 33px;"><td colspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><p>容器运维操作</p></td><td colspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><p>attach export inspect port ps rename stats top wait cp diff update</p></td></tr><tr style="height: 33px;"><td colspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><p>容器资源管理</p></td><td colspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><p>volume network</p></td></tr><tr style="height: 33px;"><td colspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><p>系统日志信息</p></td><td colspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><p>events history logs</p></td></tr></tbody></table>

docker的命令结构图如下：

![](assets/kubernetes与云原生/2、Docker的基础用法/2、Docker的基础用法-1.png)

  

## Docker的环境信息

  

docker info命令用于查看Docker是否正确安装，如果正确安装，会输出Docker的配置信息。

输入docker info，可以看到一下的信息

![image.png](assets/kubernetes与云原生/2、Docker的基础用法/2、Docker的基础用法-2.png)

  

输入docker version可以看到当前使用的docker版本

![image.png](assets/kubernetes与云原生/2、Docker的基础用法/2、Docker的基础用法-3.png)

  

## Docker的生命周期管理

  

Docker生命周期管理涉及容器的启动、停止等功能，下面介绍几个常用的命令。

  

### docker run

docker run的使用语法：docker run [OPTIONS] IMAGE [COMMAND] [ARG...]

详细可以使用docker run --help来查看具体的参数。

docker run用来基于特定的镜像创建一个容器，并且依据选项来控制改容器。具体使用实例如下：

```bash
[root@hjkj ansible]# docker run busybox echo "hello world"
Unable to find image 'busybox:latest' locally
latest: Pulling from library/busybox
ee153a04d683: Pull complete 
Digest: sha256:9f1003c480699be56815db0f8146ad2e22efea85129b5b5983d0e0fb52d9ab70
Status: Downloaded newer image for busybox:latest
hello world

[root@hjkj ansible]# docker run busybox echo "hello world"
hello world

```

从上面可以看到这个命令我使用的两次，第一次是由于我本地没有busybox这个镜像，它需要到官方站点去拉取镜像，然后再运行。第二次由于我们上面已经拉取过了，那么busybox这个镜像就保存在本地了，我们再次运行就不需要再去拉取进行，直接运行即可。

  

docker run的参数很多，可以通过docker run --help来查看具体的参数，docker run常用的几个参数如下：

-   \-i ：表示使用交互模式，始终保持输入流开放
-   \-t ：表示分配一个伪终端，一般和-i结合使用
-   \--name ：指定容器的名字，若不指定，则随机分配一个名字
-   \-c ：用于给运行的容器分配cpu的权重值
-   \-m ： 用于给容器分配内存总量
-   \-v ：用于挂载一个volume，可以同时使用多个-v
-   \-p ：用于将容器内的端口暴露给宿主机，常用格式为 -p hostPort:containerPort，如果不指定hostPort，则在宿主机上随机生成一个端口

### docker start/stop/restart

docker start/stop/restart容器通常是对一个以存在的容器进行操作，它们分别是启动、关闭和重启容器。其中docker start命令可以使用-i来进入交互模式，使用-a来附加标准输入、输出或错误输出。docker stop和docker restart 命令使用-t选项来设定容器停止前的等待时间。

  

## Docker镜像仓库命令

  

Docker Registry是Docker的镜像仓库，用户可以通过Docker Client和Docker Registry进行通信，以完成镜像的搜搜索、下载、上传等操作。

  

### docker pull

docker pull是Docker中常用命令，用于将image或者repository从Registry中拉取下来。该命令的使用方法如下：

```bash
# docker pull --help
Usage:	docker pull [OPTIONS] NAME[:TAG|@DIGEST]
Pull an image or a repository from a registry
Options:
  -a, --all-tags                Download all tagged images in the repository
      --disable-content-trust   Skip image verification (default true)

```

  

使用docker pull的时候需要指定版本，如果不指定，默认版本是latest。

  

### docker push

docker push命令用于将本地的image或repository推送到Registry中。该命令的使用方法如下：

```bash
# docker push --help
Usage:	docker push [OPTIONS] NAME[:TAG]
Push an image or a repository to a registry
Options:
      --disable-content-trust   Skip image signing (default true)

```

  

在使用docker push的时候需要使用docker login进行登录。

  

## Docker镜像管理

### docker images

docker images命令可以列出主机上的镜像，默认只列出最顶层的镜像，可以使用-a来列出所有的镜像。其使用方法如下：

```bash
# docker images --help
Usage:	docker images [OPTIONS] [REPOSITORY[:TAG]]
List images
Options:
  -a, --all             Show all images (default hides intermediate images)
      --digests         Show digests
  -f, --filter filter   Filter output based on conditions provided
      --format string   Pretty-print images using a Go template
      --no-trunc        Don't truncate output
  -q, --quiet           Only show numeric IDs

```

  

### docker rm/rmi

这两个命令的作用都是删除，其中docker rm是用于删除容器，docker rmi是用于删除镜像。它们的使用方法如下：

```bash
# docker rm --help
Usage:	docker rm [OPTIONS] CONTAINER [CONTAINER...]
Remove one or more containers
Options:
  -f, --force     Force the removal of a running container (uses SIGKILL)
  -l, --link      Remove the specified link
  -v, --volumes   Remove the volumes associated with the container
  
# docker rmi --help
Usage:	docker rmi [OPTIONS] IMAGE [IMAGE...]
Remove one or more images
Options:
  -f, --force      Force removal of the image
      --no-prune   Do not delete untagged parents
```

  

值得一提的是，用docker rmi来删除镜像的时候，如果有基于该镜像的启动的容器存在，则需要先删除容器，再删除镜像。当然这两个命令都有-f选项，用于强制删除存在容器的镜像或启动中的容器。

  

## Docker运维操作

### docker attach

docker attach可以连接正在运行的容器，观察该容器的运行情况，或与容器的主机进程进行交互式操作。其使用方法如下：

```bash
# docker attach --help
Usage:	docker attach [OPTIONS] CONTAINER
Attach local standard input, output, and error streams to a running container
Options:
      --detach-keys string   Override the key sequence for detaching a container
      --no-stdin             Do not attach STDIN
      --sig-proxy            Proxy all received signals to the process (default true)

```

  

### docker inspect

docker inspect命令可以查看镜像和容器的详细信息，默认会列出全部信息，可以通过--format参数来指定输入的模板格式，以便输出特定的信息。该命令的使用方法如下：

  

```bash
# docker inspect --help
Usage:	docker inspect [OPTIONS] NAME|ID [NAME|ID...]
Return low-level information on Docker objects
Options:
  -f, --format string   Format the output using the given Go template
  -s, --size            Display total file sizes if the type is container
      --type string     Return JSON for specified type

```

  

### docker ps

docker ps命令可以查看容器的相关信息，默认只会显示正在运行的容器信息。其使用方法如下：

```bash
# docker ps --help
Usage:	docker ps [OPTIONS]
List containers
Options:
  -a, --all             Show all containers (default shows just running)
  -f, --filter filter   Filter output based on conditions provided
      --format string   Pretty-print containers using a Go template
  -n, --last int        Show n last created containers (includes all states) (default -1)
  -l, --latest          Show the latest created container (includes all states)
      --no-trunc        Don't truncate output
  -q, --quiet           Only display numeric IDs
  -s, --size            Display total file sizes

```

docker ps 常用-a和-l，-a查看所有的容器，-l查看最新创建的容器，包括不在运行的容器。

  

## 其他子命令

### docker commit

docker commit是将容器固化为一个新的镜像，当需要指定特定的镜像的时候，会对容器的配置进行修改，然后通过commit将这些修改保存起来，使其不会因为容器的停止而丢失。使用方法如下：

  

```bash
# docker commit --help
Usage:	docker commit [OPTIONS] CONTAINER [REPOSITORY[:TAG]]
Createza new image from a container's changes

Options:
  -a, --author string    Author (e.g., "John Hannibal Smith <hannibal@a-team.com>")
  -c, --change list      Apply Dockerfile instruction to the created image
  -m, --message string   Commit message
  -p, --pause            Pause container during commit (default true)

```

  

提交保存时，只能使用正在运行的容器来制作新的镜像。

  

### docker events/logs/history

这三个命令都是用于查看Docker的系统日志信息，其中events会打印出实时的系统事件，history会打印指定镜像的历史版本信息，即构建该镜像的每一层镜像的命令记录，logs命令会打印容器内进程的运行日志。其使用方法如下：

  

```bash
# docker events --help
Usage:	docker events [OPTIONS]
Get real time events from the server
Options:
  -f, --filter filter   Filter output based on conditions provided
      --format string   Format the output using the given Go template
      --since string    Show all events created since timestamp
      --until string    Stream events until this timestamp

# docker logs --help
Usage:	docker logs [OPTIONS] CONTAINER
Fetch the logs of a container
Options:
      --details        Show extra details provided to logs
  -f, --follow         Follow log output
      --since string   Show logs since timestamp (e.g. 2013-01-02T13:23:37) or relative (e.g. 42m for 42 minutes)
      --tail string    Number of lines to show from the end of the logs (default "all")
  -t, --timestamps     Show timestamps
      --until string   Show logs before a timestamp (e.g. 2013-01-02T13:23:37) or relative (e.g. 42m for 42 minutes)

# docker history --help
Usage:	docker history [OPTIONS] IMAGE
Show the history of an image
Options:
      --format string   Pretty-print images using a Go template
  -H, --human           Print sizes and dates in human readable format (default true)
      --no-trunc        Don't truncate output
  -q, --quiet           Only show numeric IDs

```