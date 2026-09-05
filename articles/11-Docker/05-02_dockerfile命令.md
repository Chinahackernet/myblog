# dockerfile命令

> 分类：Docker / 第5章：dockerfile
> 原文：https://www.cuiliangblog.cn/detail/section/26458557
> 来源：崔亮的博客

---

# 命令总结
dockerfile指令包括配置指令（配置镜像信息）和操作指令（具体执行操作）两部分

| 分类 | 指令 | 说明 | 格式 |
| --- | --- | --- | --- |
| 配置命令 | ARG | 定义创建镜像过程中使用的变量 | ARG <name>[=<default value>] |
|   | FROM | 指定所创建的基础镜像 | FROM    <image>:<tag><br/>FROM    <image>:<digest>  |
|   | LABEL | 为生成的镜像添加元数据标签信息 | LABEL    <key>=<value> <key>=<value>    <key>=<value> ... |
|   | EXPOSE | 声明镜像内服务监听的端口 | EXPOSE <port> [<port>/<portocol>…] |
|   | ENV | 指定环境变量 | ENV <key>    <value><br/>ENV    <key>=<value> ... |
|   | ENTRYPOINT | 指定镜像的默认入口命令 | ENTRYOINT    ["executable","param1","param2"]:exec调用执行<br/>ENTRYOINT command param1 param2:shell中执行 |
|   | VOLUME | 创建一个数据卷挂载点 | VOLUME ["/data"] |
|   | USER | 指定运行容器时的用户名或UID | USER daemon |
|   | WORKDIR | 配置工作目录 | WORKDIR /path |
|   | ONBUILD | 创建子镜像时指定自动执行的操作命令 | ONBUILD [INSTRUCTION] |
|   | STOPSIGNAL | 指定退出的信号值 | STOPSIGNAL signal |
|   | HEALTHCHECK | 配置所启动容器如何进行健康检查 | HEALTHCHECK    [OPTIONS] CMD command：根据所执行命令返回值是否为0来判断；<br/>HEALTHCHECK NONE：禁止基础镜像中的健康检查。 |
|   | SHELL | 指定默认shell类型 | SHELL ["executable", "parameters"] |
| 操作命令 | RUN | 运行指定命令 | RUN <command>或RUN ["executable", "param1",    "param2"] |
|   | CMD | 启动容器时指定默认执行的命令 | CMD    ["executable", "param1",    "param2"]：相当于执行executable param1 param2，推荐方式；<br/>CMD    command param1 param2：在默认的Shell中执行，提供给需要交互的应用；<br/>CMD ["param1", "param2"]：提供给ENTRYPOINT的默认参数。 |
|   | ADD | 添加内容到镜像 | ADD <src> <dest> |
|   | COPY | 复制内容到镜像 | COPY <src> <dest> |


# 配置命令示例
## ARG
定义创建镜像过程中使用的变量

**ARG <name>[=<default value>]**

在docker build创建镜像的时候，使用 -build-arg [=]来指定参数,当镜像编译成功后，ARG指定的变量将不存在（ENV指定的变量将在镜像中保留）

## FROM
指定基础镜像

**FROM <image>:<tag>**

FROM必须是第一条指令。如果在一个dockerfile中指定多个镜像时，使用多个FROM指令

+ 如果不以任何镜像为基础，那么写法为：

FROM  scratch。

ARG VERSION=9.3

FROM debian:${VERSION}

## LABEL
为镜像指定标签

**LABEL       <key>=<value> <key>=<value>       <key>=<value> ...**

+ 一个Dockerfile种可以有多个LABEL，如下：

LABEL  version="1.0"

LABEL  multi.label1="value1" \

multi.label2="value2"  \

other="value3"

说明：LABEL会继承基础镜像种的LABEL，如遇到key相同，则值覆盖

## EXPOSE
声明镜像内服务监听的端口，

**EXPOSE <port>       [<port>/<portocol>…]**

该命令只是声明，并不会自动完成端口映射，如果想使得容器与主机的端口有映射关系，必须在容器启动的时候加上  -P参数

## ENV
指定环境变量，后续会被RUN命令使用，在镜像启动的容器中也会存在。

**ENV  <key> <value>**

**ENV  <key>=<value> ...**

两者的区别就是第一种是一次设置一个，第二种是一次设置多个

指定的环境变量在运行时可以被覆盖掉，为一个环境变量多次赋值，也会更新

## ENTRYOINT
指定的镜像的默认入口命令

该入口命令会在启动容器时作为根命令执行，所有传入值作为该命令的参数

**ENTRYOINT       ["executable","param1","param2"]:exec调用执行**

**ENTRYOINT command       param1 param2:shell中执行**

此时，CMD指令指定值将作为根命令的参数

每个Dockerfile中只能有一个ENTRYPOINT，当指定多个时，只有最后一个起效。

## VOLUME
创建一个数据卷挂载点。

**VOLUME  ["/data"]**

运行容器时可以从本地主机或其他容器挂载数据卷，一般用来存放数据库和需要保持的数据等。

## USER
指定运行容器时的用户名或UID

**USER daemon**

当服务不需要管理员权限时，可以通过该命令指定运行用户，并且可以在Dockerfile中创建所需要的用户。

例如：RUN groupadd -r postgres &&useradd --no-log-init -r -g postgres postgres

要临时获取管理员权限可以使用gosu命令。

## WORKDIR
为后续的RUN、CMD、ENTRYPOINT指令配置工作目录。

**WORKDIR  /path/to/workdir**

可以使用多个WORKDIR指令，后续命令如果参数是相对路径，则会基于之

前命令指定的路径。例如：WORKDIR /aWORKDIR bWORKDIR cRUN pwd则最终路径为/a/b/c。因此，为了避免出错，推荐WORKDIR指令中只使用绝对路径。

## ONBUILD
指定当基于所生成镜像创建子镜像时，自动执行的操作指令。

**ONBUILD  [INSTRUCTION]。**

## STOPSIGNAL
指定所创建镜像启动的容器接收退出的信号值：

**STOPSIGNAL  signal**

## HEALTHCHECK
配置所启动容器如何进行健康检查（如何判断健康与否），自Docker 1.12开始支持。格式有两种：

+ HEALTHCHECK [OPTIONS] CMD command：根据所执行命令返回值是否为0来判断；
+ HEALTHCHECK NONE：禁止基础镜像中的健康检查。OPTION支持如下参数：
+ -interval=DURATION (default: 30s)：过多久检查一次；
+ -timeout=DURATION (default: 30s)：每次检查等待结果的超时；
+ -retries=N (default: 3)：如果失败了，重试几次才最终确定失败。

## SHELL
指定其他命令使用shell时的默认shell类型

**SHELL ["executable", "parameters"]**

默认值为["/bin/sh", "-c"]。

# 操作命令示例
## RUN
运行指定命令。

格式为RUN  <command>或RUN ["executable", "param1",  "param2"]。注意后者指令会被解析为JSON数组，因此必须用双引号。前者默认将在shell终端中运行命令，即/bin/sh  -c；后者则使用exec执行，不会启动shell环境。

指定使用其他终端类型可以通过第二种方式实现，例如RUN  ["/bin/bash", "-c","echo hello"]。

每条RUN指令将在当前镜像基础上执行指定命令，并提交为新的镜像层。当命令较长时可以使用\来换行。

## CMD
指定启动容器时默认执行的命令。支持三种格式：

CMD ["executable", "param1",  "param2"]：相当于执行executable param1 param2，推荐方式；

CMD command param1 param2：在默认的Shell中执行，提供给需要交互的应用；

CMD ["param1", "param2"]：提供给ENTRYPOINT的默认参数。

每个Dockerfile只能有一条CMD命令。如果指定了多条命令，只有最后一条会被执行。

如果用户启动容器时候手动指定了运行的命令（作为run命令的参数），则会覆盖掉CMD指定的命令。

## ADD
添加内容到镜像

格式为ADD  <src> <dest>。

该命令将复制指定的<src>路径下内容到容器中的<dest>路径下。

其中<src>可以是Dockerfile所在目录的一个相对路径（文件或目录）；也可以是一个URL；还可以是一个tar文件（自动解压为目录）<dest>可以是镜像内绝对路径，或者相对于工作目录（WORKDIR）的相对路径。

路径支持正则格式，例如：

ADD ＊.c /code/

## COPY
复制内容到镜像。

格式为COPY  <src> <dest>。

复制本地主机的<src>（为Dockerfile所在目录的相对路径，文件或目录）下内容到镜像中的<dest>。目标路径不存在时，会自动创建。

路径同样支持正则格式。


