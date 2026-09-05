默认情况下，容器会随着用户删除而消失，包括容器里面的数据。如果我们要对容器里面的数据进行长久保存，就不得不引用存储卷的概念。

  

在容器中管理数据持久化主要有两种方式：

1、数据卷（data volumes）

2、挂载目录（Bind volumes）

  

# 数据卷

数据卷是一个可供一个或多个容器使用的共同目录，它提供很多有用的特性：

1、数据卷可以在容器之间共享和重用；

2、对数据卷的修改会立马生效；

3、对数据卷的更新不会影响镜像；

4、数据卷默认会一直存在，即使容器被删除；

  

注意：数据卷的使用类似于Linux下对目录进行mount，镜像中被指定的挂载点中的文件会被隐藏，显示的是我们挂载的数据卷。

  

数据卷的常用命令是docker volume命令，常规用法如下：

```plain
# docker volume --help
Usage:	docker volume COMMAND
Manage volumes
Commands:
  create      Create a volume
  inspect     Display detailed information on one or more volumes
  ls          List volumes
  prune       Remove all unused local volumes
  rm          Remove one or more volumes

Run 'docker volume COMMAND --help' for more information on a command.
```

  

创建数据卷：

```plain
docker volume create my_volume
```

  

查看数据卷：

```plain
# docker volume ls
DRIVER              VOLUME NAME
local               7a9cbb48630c66180ba226974aa9307a502ce4c99648be48e1a0cfcbe4573854
local               861cb1d1c824570a426a6b2599357b6d66818cd98a36010857cb7d753312d11d
local               my_volume
local               mydata
local               nginx_volume
local               vol_simple
local               wpdata
```

  

查看数据卷的详细信息：

```plain
# docker volume inspect my_volume
[
    {
        "CreatedAt": "2019-07-28T13:01:27+08:00",
        "Driver": "local",
        "Labels": {},
        "Mountpoint": "/var/lib/docker/volumes/my_volume/_data",
        "Name": "my_volume",
        "Options": {},
        "Scope": "local"
    }
]

```

  

启动一个容器挂载数据卷，挂载数据卷的方法有两种：

1、用-v或者--volume；

  

```plain
# docker run -it --rm --name my_app -v my_volume:/data/apps busybox
```

  

2、用--mount；

  

```plain
# docker run -it --rm --name my_app --mount source=my_volume,target=/data/apps busybox
```

  

容器启动后可以查看容器信息，就可以看到具体的挂载信息：

```plain
# docker inspect my_app
......
"Mounts": [
            {
                "Type": "volume",
                "Name": "my_volume",
                "Source": "/var/lib/docker/volumes/my_volume/_data",
                "Destination": "/data/apps",
                "Driver": "local",
                "Mode": "z",
                "RW": true,
                "Propagation": ""
            }
        ],
......
```

  

删除数据卷：

```plain
# docker volume rm my_volume
```

  

数据卷是用来持久化容器数据的，它独立于容器的生命周期，如果需要删除容器的同时也移除数据卷，可以使用docker rm -v命令。

  

如果要清理一些无主的数据卷，可以使用下面命令：

  

```plain
# docker volume prune
```

  

# 挂载目录

挂载主机目录和挂载数据卷的方式一样，只是在指定需要挂载的目录是一个全路径目录，比如：

  

```plain
# docker run -it --rm --name my_app -v /tmp/my_app:/data/apps busybox
# docker run -it --rm --name my_app --mount type=bind,source=/tmp/my_app,target=/data/apps busybox
```

从上面知道用-v和--mount都可以进行挂载。如果使用-v来挂载目录，如果本地/tmp/my\_app存在，则直接将这个目录挂载到容器上，里面如果有文件等，就可以在容器中直接进行查看。如果本地没有这个目录，则在启动容器的过程中自动创建这个目录。如果使用--mount来挂载目录，如果本地目录不存在，就会报错，比如：

```plain
# docker run -it --rm --name my_app --mount type=bind,source=/tmp/my_app/web/data,target=/data/apps busybox
docker: Error response from daemon: invalid mount config for type "bind": bind source path does not exist: /tmp/my_app/web/data.
See 'docker run --help'.
```

  

默认挂载到容器中的目录，docker对其是有读写权限的，用户可以增加readonly参数使其只有只读权限。

```plain
# docker run -it --rm --name my_app --mount type=bind,source=/tmp/my_app,target=/data/apps,readonly busybox
/ # cd /data/apps/
/data/apps # ls
/data/apps # touch 1.txt
touch: 1.txt: Read-only file system

```

  

不仅可以挂载目录，还可以挂载单个文件，如下：

```plain
# docker run -it --rm --name my_app --mount type=bind,source=/$HOME/.bash_history,target=/data/apps/history busybox
# docker run -it --rm --name my_app -v /$HOME/.bash_history:/data/apps/history busybox

```

  

如果是跨主机使用，可以通过共享存储，比如NFS之类的。这样我们只要挂载NFS的目录，所有的读写操作其他主机也可见。

  

除了使用上面这两种挂载之外，还可以使用现有容器的挂载，通过--volumes-from命令就可以直接使用其他容器的挂载，比如：

```plain
# docker run -it --rm --name my_app -v /$HOME/.bash_history:/data/apps/history busybox
# docker run -it --rm --name new_app --volumes-from my_app busybox
```

  

这样，my\_app和new\_app使用的就是同一个挂载卷了。