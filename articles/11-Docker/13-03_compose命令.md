# compose命令

> 分类：Docker / 第13章：Docker Compose
> 原文：https://www.cuiliangblog.cn/detail/section/29429596
> 来源：崔亮的博客

---

1. 对于Compose来说，大部分命令的对象既可以是项目本身，也可以指定为项目中的服务或者容器。如果没有特别的说明，命令对象将是项目，这意味着项目中所有的服务都会受到命令影响。
2. 执行docker-compose       [COMMAND] --help或者docker-compose help [COMMAND]可以查看具体某个命令的使用格式。
3. Compose命令的基本的使用格式是：

docker-compose  [-f=<arg>...] [options] [COMMAND] [ARGS...]

4. 命令选项：

| -f, --file    FILE | 指定使用的Compose模板文件，默认为docker-compose.yml，可以多次指定； |
| --- | --- |
| -p,    --project-name NAME | 指定项目名称，默认将使用所在目录名称作为项目名； |
| --verbose | 输出更多调试信息； |
| -v,    --version | 打印版本并退出； |
| -H, -host    HOST | 指定所操作的Docker服务地址； |
| -tls | 启用TLS，如果指定-tlsverify则默认开启； |
| -tlscacert    CA_PATH | 信任的TLS CA的证书； |
| -tlscert    CLIENT_CERT_PATH | 客户端使用的TLS证书； |
| -tlskey    TLS_KEY_PATH |  TLS的私钥文件路径； |
| -tlsverify | 使用TLS校验连接对方； |
| -skip-hostname-check | 不使用TLS证书校验对方的主机名； |
| -project-directory    PATH | 指定工作目录，默认为Compose文件所在路径。 |


5. 命令列表

![](assets/11-Docker/8556001ef47f12a5302a.png)

6. 使用说明
+ build

格式为docker-compose  build [options] [SERVICE...]。

构建（重新构建）项目中的服务容器。

服务容器一旦构建后，将会带上一个标记名，例如对于Web项目中的一个db容器，可能是web_db。

可以随时在项目目录下运行docker-compose  build来重新构建服务。

选项包括：

--force-rm：强制删除构建过程中的临时容器；

--no-cache：构建镜像过程中不使用cache（这将加长构建过程）；

--pull：始终尝试通过pull来获取更新版本的镜像；

-m, -memory MEM：指定创建服务所使用的内存限制；

-build-arg key=val：指定服务创建时的参数。

+ bundle

格式为docker-compose  bundle [options]。

创建一个可分发（Distributed  Application Bundle, DAB）的配置包，包括整个服务栈的所有数据，他人可以利用该文件启动服务栈。

支持选项包括：

❑ -push-images：自动推送镜像到仓库；

❑ -o, -output PATH：配置包的导出路径。

+ config

格式为docker-compose  config [options]。

校验和查看Compose文件的配置信息。

支持选项包括：

❑ -resolve-image-digests：为镜像添加对应的摘要信息；

❑ -q, -quiet：只检验格式正确与否，不输出内容；

❑ -services：打印出Compose中所有的服务信息；

❑ -volumes：打印出Compose中所有的挂载卷信息；

+ down

格式为docker-compose  down [options]。

停止服务栈，并删除相关资源，包括容器、挂载卷、网络、创建镜像等。

默认情况下只清除所创建的容器和网络资源。

支持选项包括：

❑ -rmi type：指定删除镜像的类型，包括all（所有镜像）, local（仅本地）；

❑ -v, -volumes：删除挂载数据卷；

❑ -remove-orphans：清除孤儿容器，即未在Compose服务中定义的容器；

❑ -t, -timeout TIMEOUT：指定超时时间，默认为10s。

+ events

格式为docker-compose  events [options] [SERVICE...]。

实时监控容器的事件信息。

支持选项包括-json：以Json对象流格式输出事件信息。

+ exec

格式为docker-compose  exec [options] [-e KEY=VAL...] SERVICE COMMAND [ARGS...]。

在一个运行中的容器内执行给定命令。

支持选项包括：

❑ -d：在后台运行命令；

❑ -privileged：以特权角色运行命令；

❑ -u, -user USER：以给定用户身份运行命令；

❑ -T：不分配TTY伪终端，默认情况下会打开；

❑ -index=index：当服务有多个容器实例时指定容器索引，默认为第一个；

❑ -e, -env KEY=VAL：设置环境变量。

+ help

获得一个命令的帮助。

+ images

格式为docker-compose  images [options] [SERVICE...]。

列出服务所创建的镜像。

支持选项为：-q：仅显示镜像的ID。

+ kill

格式为docker-compose  kill [options] [SERVICE...]。

通过发送SIGKILL信号来强制停止服务容器。

支持通过-s参数来指定发送的信号，例如通过如下指令发送SIGINT信号。

$ docker-compose kill -s SIGINT

+ logs

格式为docker-compose  logs [options] [SERVICE...]。

查看服务容器的输出。默认情况下，docker-compose将对不同的服务输出使用不同的颜色来区分。可以通过--no-color来关闭颜色。

该命令在调试问题的时候十分有用。

支持选项为：

❑ -no-color：关闭彩色输出；

❑ -f, -follow：持续跟踪输出日志消息；

❑ -t, -timestamps：显示时间戳信息；

❑ -tail="all"：仅显示指定行数的最新日志消息。

+ pause

格式为docker-compose  pause [SERVICE...]。

暂停一个服务容器。

+ port

格式为docker-compose  port [options] SERVICE PRIVATE_PORT。

打印某个容器端口所映射的公共端口。

选项：

❑ --protocol=proto：指定端口协议，tcp（默认值）或者udp；

❑ --index=index：如果同一服务存在多个容器，指定命令对象容器的序号（默认为1）。

+ ps

格式为docker-compose  ps [options] [SERVICE...]。

列出项目中目前的所有容器。

选项包括-q：只打印容器的ID信息。

+ pull

格式为docker-compose  pull [options] [SERVICE...]。

拉取服务依赖的镜像。

选项包括--ignore-pull-failures：忽略拉取镜像过程中的错误。

+ push

格式为docker-compose  push [options] [SERVICE...]。

推送服务创建的镜像到镜像仓库。

选项包括--ignore-push-failures：忽略推送镜像过程中的错误。

+ restart

格式为docker-compose  restart [options] [SERVICE...]。

重启项目中的服务。

选项包括-t,  --timeout TIMEOUT：指定重启前停止容器的超时（默认为10秒）。

+ rm

格式为docker-compose  rm [options] [SERVICE...]。

删除所有（停止状态的）服务容器。推荐先执行docker-compose  stop命令来停止容器。

选项：

❑ -f, --force：强制直接删除，包括非停止状态的容器。一般尽量不要使用该选项。

❑ -v：删除容器所挂载的数据卷。

+ run

格式为docker-compose  run [options] [-p PORT...] [-e KEY=VAL...] SERVICE [COMMAND] [ARGS...]。

在指定服务上执行一个命令。

例如：

    $ docker-compose run ubuntu ping  docker.com

将会启动一个ubuntu服务容器，并执行ping  docker.com命令。

默认情况下，如果存在关联，则所有关联的服务将会自动被启动，除非这些服务已经在运行中。

该命令类似启动容器后运行指定的命令，相关卷、链接等等都将会按照配置自动创建。

两个不同点：

❑ 给定命令将会覆盖原有的自动运行命令；

❑ 会自动创建端口，以避免冲突。

如果不希望自动启动关联的容器，可以使用--no-deps选项，例如

$  docker-compose run --no-deps web python manage.py shell

将不会启动web容器所关联的其他容器。

选项：

❑ -d：后台运行容器；

❑ --name NAME：为容器指定一个名字；

❑ --entrypoint CMD：覆盖默认的容器启动指令；

❑ -e KEY=VAL：设置环境变量值，可多次使用选项来设置多个环境变量；

❑ -u, --user=""：指定运行容器的用户名或者uid；

❑ --no-deps：不自动启动关联的服务容器；

❑ --rm：运行命令后自动删除容器，d模式下将忽略；

❑ -p, --publish=[]：映射容器端口到本地主机；

❑ --service-ports：配置服务端口并映射到本地主机；

❑ -T：不分配伪tty，意味着依赖tty的指令将无法运行。

+ scale

格式为docker-compose  scale [options] [SERVICE=NUM...]。

设置指定服务运行的容器个数。

通过service=num的参数来设置数量。例如：

    $ docker-compose scale web=3 db=2

将启动3个容器运行web服务，2个容器运行db服务。

一般的，当指定数目多于该服务当前实际运行容器，将新创建并启动容器；反之，将停止容器。

选项包括-t,  --timeout TIMEOUT：停止容器时候的超时（默认为10秒）。

+ start

格式为docker-compose  start [SERVICE...]。

启动已经存在的服务容器。

+  stop

格式为docker-compose  stop [options] [SERVICE...]。

停止已经处于运行状态的容器，但不删除它。通过docker-compose  start可以再次启动这些容器。

选项包括-t,  --timeout TIMEOUT：停止容器时候的超时（默认为10秒）。

+ top

格式为docker-compose  top [SERVICE...]。

显示服务栈中正在运行的进程信息。

+ unpause

格式为docker-compose  unpause [SERVICE...]。

恢复处于暂停状态中的服务。

+ up

格式为docker-compose  up [options] [SERVICE...]。

该命令十分强大，它将尝试自动完成包括构建镜像，（重新）创建服务，启动服务，并关联服务相关容器的一系列操作。

链接的服务都将会被自动启动，除非已经处于运行状态。

可以说，大部分时候都可以直接通过该命令来启动一个项目。

默认情况，docker-compose  up启动的容器都在前台，控制台将会同时打印所有容器的输出信息，可以很方便进行调试。

当通过Ctrl-C停止命令时，所有容器将会停止。

如果使用docker-compose  up -d，将会在后台启动并运行所有的容器。一般推荐生产环境下使用该选项。

默认情况，如果服务容器已经存在，docker-compose  up将会尝试停止容器，然后重新创建（保持使用volumes-from挂载的卷），以保证新启动的服务匹配docker-compose.yml文件的最新内容。如果用户不希望容器被停止并重新创建，可以使用docker-compose  up --no-recreate。这样将只会启动处于停止状态的容器，而忽略已经运行的服务。如果用户只想重新部署某个服务，可以使用docker-compose  up--no-deps -d <SERVICE_NAME>来重新创建服务并后台停止旧服务，启动新服务，并不会影响到其所依赖的服务。

选项：

❑ -d：在后台运行服务容器；

❑ --no-color：不使用颜色来区分不同的服务的控制台输出；

❑ --no-deps：不启动服务所链接的容器；

❑ --force-recreate：强制重新创建容器，不能与--no-recreate同时使用；

❑ --no-recreate：如果容器已经存在了，则不重新创建，不能与--force-recreate同

时使用；

❑ --no-build：不自动构建缺失的服务镜像；

❑ --abort-on-container-exit：当有容器停止时中止整个服务，与-d选项冲突。

❑ -t, --timeout TIMEOUT：停止容器时候的超时（默认为10秒），与-d选项冲突；

❑ --remove-orphans：删除服务中未定义的孤儿容器；

❑ --exit-code-from SERVICE：退出时返回指定服务容器的退出符；

❑ --scale SERVICE=NUM：扩展指定服务实例到指定数目。

+ version

格式为docker-compose  version。

打印版本信息。


