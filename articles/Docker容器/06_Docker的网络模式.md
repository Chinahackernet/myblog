# Bridge模式

  

当我们安装完docker后，启动Docker daemon，就会在主机上看到一个docker0的网桥，默认在此主机上启动的容器都会连接到这个网桥上。虚拟网桥的工作方式和物理交换机的工作方式类似，我们可以把主机当作是一个物理交换机，这样所有容器都通过交换机连接在了一个二层网络。

  

当我们启动一个容器，默认会从docker0的子网中分配一个IP给容器使用，并设置docker0的IP为容器的默认网关。并且会创建一对虚拟网卡veth pair设备，Docker将veth pair的一段放到容器中，命令为eth0，另一端放在主机上，并以vethxxxx命名，并将这个网络设备加入docker0网桥中。具体的网络信息可以通过brctl show查看，如果没有这个命令，可以通过如下方式安装。

```bash
yum install bridge-utils -y
```

![image.png](assets/docker容器/06_Docker的网络模式/06_Docker的网络模式-1.png)

  

如下，在我们没有启动容器的时候，我的服务器上的网卡信息

![image.png](assets/docker容器/06_Docker的网络模式/06_Docker的网络模式-2.png)

现在，我通过如下命令启动容器

```bash
docker run -it busybox /bin/sh
```

  

再次查看主机上网卡信息，可以看到主机上多了一个veth2978031@if51网卡信息

![image.png](assets/docker容器/06_Docker的网络模式/06_Docker的网络模式-3.png)

而我们在容器里面，可以看到容器的网卡信息

![image.png](assets/docker容器/06_Docker的网络模式/06_Docker的网络模式-4.png)

我们可以看到容器的网卡名为eth0，而且IP地址和docker0在同一个网段，这时候在容器内ping docker0是通的。

![image.png](assets/docker容器/06_Docker的网络模式/06_Docker的网络模式-5.png)

  

所以，如果用bridge模式，在同一台主机上启动的容器，默认情况下相互是可达的。

  

Bridge默认是docker默认的网络模式，如果不写-net参数，就是bridge模式。使用docker run -p时，docker实际是在iptables上做DNAT规则，实现端口转发功能。可以使用iptables -t nat -vnL查看。

  

Bridge默认如下所示：

![image.png](assets/docker容器/06_Docker的网络模式/06_Docker的网络模式-6.png)

如果你之前有 Docker 使用经验，你可能已经习惯了使用`--link`参数来使容器互联。随着 Docker 网络的完善，强烈建议大家将容器加入自定义的 Docker 网络来连接多个容器，而不是使用 --link 参数。

  

下面先创建一个新的 Docker 网络。

```plain
$ docker network create -d bridge my-net
```

  

`-d`参数指定 Docker 网络类型，有 `bridge overlay`。其中 overlay 网络类型用于 Swarm mode，在本小节中你可以忽略它。

  

运行一个容器并连接到新建的 my-net 网络

```plain
$ docker run -it --rm --name busybox1 --network my-net busybox sh
```

打开新的终端，再运行一个容器并加入到 my-net 网络

```plain
$ docker run -it --rm --name busybox2 --network my-net busybox sh
```

再打开一个新的终端查看容器信息

```plain
$ docker container ls
CONTAINER ID        IMAGE               COMMAND             CREATED             STATUS              PORTS               NAMES
b47060aca56b        busybox             "sh"                11 minutes ago      Up 11 minutes                           busybox2
8720575823ec        busybox             "sh"                16 minutes ago      Up 16 minutes                           busybox1
```

下面通过 ping 来证明 busybox1 容器和 busybox2 容器建立了互联关系。 在 busybox1 容器输入以下命令

```plain
/ # ping busybox2
PING busybox2 (172.19.0.3): 56 data bytes
64 bytes from 172.19.0.3: seq=0 ttl=64 time=0.072 ms
64 bytes from 172.19.0.3: seq=1 ttl=64 time=0.118 ms
```

用 ping 来测试连接 busybox2 容器，它会解析成 172.19.0.3。 同理在 busybox2 容器执行 ping busybox1，也会成功连接到。

```plain
/ # ping busybox1
PING busybox1 (172.19.0.2): 56 data bytes
64 bytes from 172.19.0.2: seq=0 ttl=64 time=0.064 ms
64 bytes from 172.19.0.2: seq=1 ttl=64 time=0.143 ms
```

这样，busybox1 容器和 busybox2 容器建立了互联关系。

如果你有多个容器之间需要互相连接，推荐使用`Docker Compose`。

  

# Host模式

  

如果启动容器的时候使用`host`模式，那么这个容器将不会获得一个独立的`Network Namespace`，而是和宿主机共用一个 Network Namespace。容器将不会虚拟出自己的网卡，配置自己的 IP 等，而是使用宿主机的 IP 和端口。但是，容器的其他方面，如文件系统、进程列表等还是和宿主机隔离的。 Host模式如下图所示：

![image.png](assets/docker容器/06_Docker的网络模式/06_Docker的网络模式-7.png)

  

例如：

首先启动两个容器，指定网络为host

```plain
docker run -itd --name docker1 --net=host busybox
docker run -itd --name docker2 --net=host busybox
```

  

然后进入容器查看容器的IP地址，以docker1为例

```plain
docker exec -it docker1 /bin/sh
```

![image.png](assets/docker容器/06_Docker的网络模式/06_Docker的网络模式-8.png)

可以发现和宿主机一模一样。

  

# None模式

  

使用`none`模式，Docker 容器拥有自己的 Network Namespace，但是，并不为Docker 容器进行任何网络配置。也就是说，这个 Docker 容器没有网卡、IP、路由等信息。需要我们自己为 Docker 容器添加网卡、配置 IP 等。

  

例如：

```plain
docker run -it --name docker1 --net=none busybox
```

然后查看IP信息，是没有配置IP的。

![image.png](assets/docker容器/06_Docker的网络模式/06_Docker的网络模式-9.png)

  

# Container模式

这个模式指定新创建的容器和已经存在的一个容器共享一个 Network Namespace，而不是和宿主机共享。新创建的容器不会创建自己的网卡，配置自己的 IP，而是和一个指定的容器共享 IP、端口范围等。同样，两个容器除了网络方面，其他的如文件系统、进程列表等还是隔离的。两个容器的进程可以通过 lo 网卡设备通信。

![image.png](assets/docker容器/06_Docker的网络模式/06_Docker的网络模式-10.png)

  

比如，我们启动先启动一个容器：

```plain
# # docker run -itd --name my_os ubuntu /bin/bash
```

  

然后我们共享my\_web的网络：

```plain
# # docker run -itd --rm --net=container:my_os --name new_os ubuntu
```

  

我们分别查看两个容器的网络信息：

在my\_os容器中：

```plain
docker exec -it my_os /bin/bash
ifconfig -a
```

  

在new\_os中：

```plain
docker exec -it new_os /bin/bash
ifconfig -a
```