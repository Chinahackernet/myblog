# docker网络管理

> 分类：Docker / 第8章：网络管理
> 原文：https://www.cuiliangblog.cn/detail/section/29398459
> 来源：崔亮的博客

---

# 一、启动和配置参数
1. 网路启动过程
+ 在主机上自动创建一个docker0虚拟网桥，实际上是一个Linux网桥。网桥可以理解为一个软件交换机，负责挂载其上的接口之间进行包转发。
+ 创建一对虚拟接口，分别放到本地主机和新容器的命名空间中；

本地主机一端的虚拟接口连接到默认的docker0网桥或指定网桥上，并具有一个以veth开头的唯一名字，如veth1234；另一端的虚拟接口将放到新创建的容器中，并修改名字作为eth0。这个接口只在容器的命名空间可见；

+ 从网桥可用地址段中获取一个空闲地址分配给容器的eth0（例如172.17.0.2/16），并配置默认路由网关为docker0网卡的内部接口docker0的IP地址（例如172.17.42.1/16）。
2. 网络相关参数
+ 在Docker服务启动的时候才能配置，修改后重启生效

| -b BRIDGE or --bridge=BRIDGE | 指定容器挂载的网桥 |
| --- | --- |
| --bip=CIDR | 定制docker0的掩码 |
| -H SOCKET... or --host=SOCKET | Docker服务端接收命令的通道 |
| --icc=true|false | 是否支持容器之间进行通信 |
| --ip-forward=true|false | 启用net.ipv4.ip_forward，即打开转发功能 |
| --iptables=true|false | 禁止Docker添加iptables规则 |
| --mtu=BYTES | 容器网络中的MTU |


+ 既可以在启动服务时指定，也可以Docker容器启动（使用docker      [con-tainer] run命令）时候指定。在Docker服务启动的时候指定则会成为默认值，后续执行该命令时可以覆盖设置的默认值：

| --dns=IP_ADDRESS | 使用指定的DNS服务器 |
| --- | --- |
| --dns-opt="" | 指定DNS选项 |
| --dns-search=DOMAIN | 指定DNS搜索域 |


+ 只能在docker [container] run命令执行时使用，因为它针对容器的配置

| -h HOSTNAME or --hostname=HOSTNAME | 配置容器主机名 |
| --- | --- |
| -ip | 指定容器内接口的IP地址 |
| --link=CONTAINER_NAME:ALIAS | 添加到另一个容器的连接 |
| --net=bridge|none|container:NAME_or_ID|host|user_defined_network | 配置容器的桥接模式 |
| --network-alias | 容器在网络中的别名 |
| -p SPEC or --publish=SPEC | 映射容器端口到宿主主机 |
| -P or --publish-all=true|false | 映射容器所有端口到宿主主机 |


+ --net选项支持以下五种模式：

| --net=bridge | 默认配置。为容器创建独立的网络命名空间，分配网卡、IP地址等网络配置，并通过veth接口对将容器挂载到一个虚拟网桥（默认为docker0）上 |
| --- | --- |
| --net=none | 为容器创建独立的网络命名空间，但不进行网络配置，即容器内没有创建网卡、IP地址等 |
| --net=container:NAME_or_ID | 新创建的容器共享指定的已存在容器的网络命名空间，两个容器内的网络配置共享，但其他资源（如进程空间、文件系统等）还是相互隔离的 |
|  --net=host | 不为容器创建独立的网络命名空间，容器内看到的网络配置（网卡信息、路由表、Iptables规则等）均与主机上的保持一致。注意其他资源还是与主机隔离的 |
| --net=user_defined_network | 用户自行用network相关命令创建一个网络，同一个网络内的容器彼此可见，可以采用更多类型的网络插件。 |


# 二、Docker网络命令
| create | 创建一个网络 |
| --- | --- |
| connect | 将容器接入到网络 |
| disconnect | 把容器从网络上断开 |
| inspect | 查看网络的详细信息 |
| ls | 列出所有的网络 |
| prune | 清理无用的网络资源 |
| rm | 删除一个网络 |


1. 创建网络
+ creat命令用于创建一个新的容器网络。Docker内置了bridge（默认使用）和overlay两种驱动，分别支持单主机和多主机场景。Docker服务在启动后，会默认创建一个bridge类型的网桥bridge。不同网络之间默认相互隔离。
+ 创建网络命令格式为docker      network create [OPTIONS] NETWORK。
+ 支持参数包括：

| -attachable[=false] | 支持手动容器挂载 |
| --- | --- |
| -aux-address=map[] | 辅助的IP地址 |
| -config-from="" | 从某个网络复制配置数据 |
| -config-only[=false] | 启用仅可配置模式 |
| -d,   -driver="bridge" | 网络驱动类型，如bridge或overlay |
| -gateway=[] | 网关地址 |
| -ingress[=false] | 创建一个Swarm可路由的网状网络用于负载均衡，可将对某个服务的请求自动转发给一个合适的副本 |
| -internal[=false] | 内部模式，禁止外部对所创建网络的访问 |
| -ip-range=[] | 指定分配IP地址范围 |
| -ipam-driver="default" | IP地址管理的插件类型 |
| -ipam-opt=map[] | IP地址管理插件的选项 |
| -ipv6[=false] | 支持IPv6地址 |
| -label   value | 为网络添加元标签信息 |
| -o,   -opt=map[] | 网络驱动所支持的选项 |
| -scope="" | 指定网络范围 |
| -subnet=[] | 网络地址段，CIDR格式，如172.17.0.0/16。 |


2. 接入网络
+ connect命令将一个容器连接到一个已存在的网络上。连接到网络上的容器可以跟同一网络中其他容器互通，同一个容器可以同时接入多个网络。也可以在执行docker      run命令时候通过-net参数指定容器启动后自动接入的网络。
+ 接入网络命令格式为docker      network connect [OPTIONS] NETWORK CONTAINER。
+ 支持参数包括：

| -alias=[] | 为容器添加一个别名，此别名仅在所添加网络上可见； |
| --- | --- |
| -ip="" | 指定IP地址，需要注意不能跟已接入的容器地址冲突； |
| -ip6="" | 指定IPv6地址； |
| -link   value | 添加链接到另外一个容器； |
| -link-local-ip=[] | 为容器添加一个链接地址。 |


3. 断开网络

disconnect命令将一个连接到网络上的容器从网络上断开连接。

命令格式为docker network disconnect [OPTIONS] NETWORK CONTAINER。

支持参数包括-f, -force：强制把容器从网络上移除。

4. 查看网络信息
+ inspect命令用于查看一个网络的具体信息（JSON格式），包括接入的容器、网络配置信息等。
+ 命令格式为docker network      inspect [OPTIONS] NETWORK [NETWORK...]。
+ 支持参数包括：

| -f,   -format="" | 给定一个Golang模板字符串，对输出结果进行格式化，如只查看地址配置可以用-f '{{.IPAM.Config}}' |
| --- | --- |
| -v,   -verbose[=false] | 输出调试信息 |


5. 列出网络

ls命令用于列出网络。命令格式为docker network ls [OPTIONS]，其中支持的选项主要有：

| -f,   -filter="" | 指定输出过滤器，如driver=bridge； |
| --- | --- |
| -format="" | 给定一个golang模板字符串，对输出结果进行格式化； |
| -no-trunc[=false] | 不截断地输出内容； |
| -q,   -quiet[=false] | 安静模式，只打印网络的ID。 |


6. 清理无用网络
+ prune命令用于清理已经没有容器使用的网络。
+ 命令格式为docker network      prune [OPTIONS] [flags]，支持参数包括：

| -filter="" | 指定选择过滤器 |
| --- | --- |
| -f, -force | 强制清理资源 |


7. 删除网络

rm命令用于删除指定的网络。当网络上没有容器连接上时，才会成功删除。

命令格式为docker network rm NETWORK [NETWORK...]。


