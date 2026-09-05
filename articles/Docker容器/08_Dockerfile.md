# 一、简介

Dockerfile是一个文本文件，里面包含一条条指令，每一条指令就是一层镜像。

一般情况下，Dockerfile分为4个部分：

-   基础镜像
-   维护者信息
-   镜像操作指令
-   容器启动时执行命令

  

例如：

```plain
FROM docker.io/centos
LABEL "auth"="joker" \
      "mail"="unclejoker520@163.com"
ENV TIME_ZOME Asia/Shanghai
RUN yum install -y gcc gcc-c++ make openssl-devel prce-devel
ADD nginx-1.14.2.tar.gz /opt/
RUN cd /opt/nginx-1.14.2 && \
    ./configure --prefix=/usr/local/nginx && \
    make -j 4 && \
    make install

RUN rm -rf /opt/nginx* && \
    yum clean all && \
    echo "${TIME_ZOME}" > /etc/timezone && \
    ln -sf /usr/share/zoneinfo/${TIME_ZOME} /etc/localtime

COPY nginx.conf /usr/local/nginx/conf/
WORKDIR /usr/local/nginx/
EXPOSE 80
CMD ["./sbin/nginx","-g","daemon off;"]
```

  

其中FROM指令必须是开篇第一个非注释行，是必须存在的一个指令，后面所有的操作都是基于这个镜像的。后面的指令就是一些操作指令，指令的详情在后面介绍。最后是CMD指定，这个指令表示在容器运行是需要执行的命令。

  

# 二、工作逻辑

1、在一个自定义的目录下有Dockerfile文件；

-   命名首字母必须是大写；
-   引用的文件必须在当前的目录及其一下目录；
-   如果有些文件不需要被打包，可以将这些文件当前目录下隐藏文件（.dockeringore）中；

2、在当前目录下执行docker build来进行打包成镜像，Dockerfile中的命令必须是docker支持的命令；

3、基于刚才打包的镜像启动容器；

  

通过Dockerfile制作成镜像并启动容器的过程如下：

![image.png](assets/docker容器/08_Dockerfile/08_Dockerfile-1.png)

其中上面提到的CMD指令还有后面介绍的ENTRYPOINT指令都是在docker run的时候执行，其他指令在docker build的时候执行。

  

# 三、指令介绍

## 3.1 FROM

重要且必须是开篇第一个非注释行，用于为映像文件构建过程指定基础镜像，后续的指令运行是在此基础上运行。在实践中，基础镜像可以是任何可用镜像文件，默认情况下，docker build 会在docker主机上查找指定的镜像文件，在其不存在时，则会从docker HUB上拉取镜像，如果找不到镜像，则会报错。

  

语法如下：

```dockerfile
FROM <repository>[:<tag>] 或 FROM <repository>@<digest>
 - <repository>:指定作为base image的名称
 - <tag>:base image的标签，为可省略项，省略时默认为latest
```

  

## 3.2 MAINTANIER

用于指定Dockerfile制作者本人的信息，目前已经废弃了。

  

语法如下：

```dockerfile
MAINTANIER <AUTHOR'S detail>
```

  

## 3.3 LABEL

指定Dockerfile的标签信息，我们可以将MAINTANIER的作者信息写在LABEL标签里。

  

语法如下：

```dockerfile
LABEL <key>=<value>
```

  

## 3.4 COPY

从docker主机复制文件到镜像中。

  

语法如下：

```dockerfile
 COPY <SRC>...<DEST> 或者
 COPY ["<SRC>",..."<DEST>"]
```

  

其中：

-   SRC :源文件或目录；
-   DEST：目标路径，建议用绝对路径；

  

注意：

-   路径中有空白文件，通常使用第二种；
-   SRC目录，其内部文件和子目录会被递归复制，但是，但是SRC不会被复制；
-   复制多个SRC，则DEST必须是一个，切必须以/结尾；
-   如果DEST不存在，则会自动创建；

  

## 3.5 ADD

ADD命令和COPY命令有相似之处，都是像镜像中添加内容。

  

语法如下：

```dockerfile
ADD <src>...<dest> 或者
ADD ["<src>",...,"<dest>"]
```

  

操作准则如下：

-   如果SRC为URL，且DEST不以/结尾，则SRC指定的文件将被下载并直接创建为DEST；如果DEST以/结尾，则文件名URL指定的文件将被直接下载并保存为<dest>/<filename>；
-   如果SRC是一个本地系统上的压缩格式的tar文件，它将直接展开为一个目录，其行为类似于“tar -x”命令；然而，通过URL获取到的tar文件将不会自动展开；
-   如果SRC有多个，或其间接或直接使用的通配符，则DEST必须是一个以/结尾的目录路径；如果dest不以/结尾，则其被视作一个普通文件，SRC的内容将被直接写入到dest；

  

## 3.6 WORKDIR

指定工作目录，每一次只影响当前目录到后的目录。

  

语法如下：

```dockerfile
WORKDIR PATH
```

  

## 3.7 VOLUME

用于在image中创建一个挂载点目录，以挂载docker主机上的卷或者其它容器上的卷。

  

语法如下：

```dockerfile
VOLUME <mountpoint> 或者
VOLUME ["<mountpoint>"]
```

  

注意：如果挂载点目录路径下存在文件，docker run 命令会在挂载完成后将此前得所有文件复制到新挂载的卷中。

  

## 3.8 EXPOSE

用于为容器打开指定要监听的端口以实现与外部通信，在docker run的时候，如果没有指定-P参数，是不会暴露在docker 主机上的。

  

语法如下：

```dockerfile
EXPOSE <port>[/<portocol>] <port>[/<portocol>]
```

  

其中：<portocol>用于指定传输层协议，可以是tcp或udp二者之一，默认是TCP。

EXPOSE指令可以一次指定多个端口，例如：

```dockerfile
EXPOSE 11222/udp 11222/tcp
```

  

## 3.9 ENV

用于为镜像定义所需环境变量，并可被dockerfile文件中位于其后的其他指定所调用。如果在docker run的时候，在Dockerfile中指定的变量名如果没有被替换，在容器启动后通过执行printenv指令依然可以看到我们在Dockerfile中定义的变量。

  

语法如下：

```dockerfile
ENV <key> <value> 或者
ENV <key>=<value>
```

  

其中：

-   第一种格式中，<key>之后的所有内容均被视作value，因此，一次只能设置一个变量；
-   第二种格式可以设置多个变量，每个变量为一个<key>=<value>的键值对，如果<value>中包含空格，可以用\\进行转义，也可以用个对<value>加""进行标识；另外，反斜杠也可用于续行；
-   定义多个变量时，建议使用第二种方式，以便在同一层中完成所有功能；

  

调用方式为：

```dockerfile
$variable_nam 或者 
${variable_nam}
```

  

如果要指定默认参数可以用下面格式：

```dockerfile
${variable_name:-word}    # 变量为空，就用word，变量有值，就用本身的值
${variable_name:+word}    # 变量有值就现实word，没有值就不显示
```

  

## 3.10 RUN

用于指定docker build过程中运行的程序，其可以是任何可执行命令。

  

语法如下：

```dockerfile
RUN <COMMAND> 或者
RUN ["executable","<param1>","<param2>"]
```

  

其中：

-   第一种格式中，<command>通常是一个shell命令，且以“/bin/sh -c”来运行它，这意味着次进程在容器中的PID不为1，不能接受Unix信号，因此，当使用docker stop <container> 命令停止容器时，此进程接受不到SIGTERM信号；
-   第二种语法格式中的参数是一个JSON格式的数组，其中<executable>为要运行的命令，后面的<paramN>为传递给命令的选项或参数，然而，这种格式的指定不会以"/bin/sh -c"来发起，因此常见的shell操作如变量替换以及通配符(？，\*等)将不会被替换，如果要运行的命令依赖于此shell特性的话，可以将其替换为下面的格式：
-     
    

```dockerfile
RUN ["/bin/sh","-c","<executable>","<param1>","<param2>"]
```

  

## 3.11 CMD

类似于RUN命令，CMD指令也可以运行命令或应用程序，不过二者的运行时间点不同：

-   RUN指令运行于映像文件构建过程，CMD运行于docker run的时候；
-   CMD指令的首要目的在于启动容器的时候运行程序，切她运行结束后，容器也将终止，不过CMD指令可以被docker run的命令选项所覆盖；
-   在Dockerfile中可以存多个CMD指令，但仅最后一个会生效；

  

语法如下：

```dockerfile
CMD <command> 或者
CMD ["<executable>","<param1>","<param2>"] 或者
CMD ["<param1>","<param2>"]
```

  

其中：

-   前两种语法格式的意义同与RUN；
-   第三种则用于ENTRYPOINT指令提供默认参数；

  

## 3.12 ENTRYPOINT

类似CMD指令功能，用于容器指定默认运行程序，从而使得容器像是一个单独的可执行程序。

与CMD不同的是，由ENTRYPOINT启动程序不会被docker run命令指定的参数覆盖，而且，这些命令参数会被当做参数传递给ENTRYPOINT指定的程序。不过，docker run 命令的 --entrypoint选项的参数可覆盖NETRYPOINT指定的程序。

  

语法如下：

```dockerfile
ENTRYPOINT <command> 或者
ENTRYPOINT ["<executable>","<param1>","<param2>"]
```

  

其中：

-   docker 命令传入的参数会覆盖CMD指令的内容且附加到ENTRYPOINT命令最后作为其参数使用；
-   dockerfile文件中也可以存在多个ENTRYPOINT指令，但最后一个有效；

  

## 3.13 USER

用于指定运行image时的或运行dockerfile中任何RUN，CMD或者ENTRYPOINT指令指定的程序的用户名或UID。

  

语法如下：

```dockerfile
USER daemon
```

  

当服务器不需要管理员权限时，可以使用该命令指定运行用户，并且可以在之前创建所需要的用户，例如：

  

```dockerfile
RUN groupadd -r test && \
    useradd -r -g test test
```

  

如果需要临时获取管理员权限，推荐使用gosu，而不推荐sudo。

  

## 3.14 HEALTHCHECK

健康检查，可以设置定时去检查应用是否正常。

  

语法如下：

```dockerfile
 HEALTHCHECK [OPTIONS] CMD command
   --interval=DURATION    (default=30s)
   --timeout=DURATION (default=30s)
   --start-period=DURATION (default=0s)
   --retries=N (default=3)
```

返回值：0是成功，1是失败，2是预留值。

  

## 3.15 SHELL

指定SHELL环境，默认是/bin/sh -c

  

## 3.16 ARG

ARG在build的时候使用，语法如下：

```dockerfile
ARG <name>[=,default value.]
```

  

比如：

```dockerfile
ARG NGINX_TAG="1.14"'
docker build --build-arg NGINX_TAG="1.15"
```

  

## 3.17 ONBUILD

用于在dockerfile中定义一个触发器。

  

dockerfile用于build映像文件，此映像文件亦可作为base image被另一个dockerfile用作FRM指令参数，并以之构建新的映像，在后面的dockerfile中的FROM指令在build过程中被执行时，将会触发创建其baseimage的dockerfile文件中的ONBUILD指令定义的触发器。

  

语法如下：

```dockerfile
ONBUILD <INSTRUCTION>
```

  

注意：

-   尽管任何指令都可以注册成触发器指令，但ONBUILD不能自我嵌套，其不会触发FROM和MAINTAINER指令；
-   使用包含ONBUILD指令的dockerfile构建镜像应该使用特殊的标签，例如ruby:2.0-onbuild；
-   在ONBUILD指令中使用ADD或COPY指令应该格外小心，因为新构建过程中的上下文在缺少指定的源文件时会失败；