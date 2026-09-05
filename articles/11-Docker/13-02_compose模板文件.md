# compose模板文件

> 分类：Docker / 第13章：Docker Compose
> 原文：https://www.cuiliangblog.cn/detail/section/29428685
> 来源：崔亮的博客

---

# 一、概述
Docker Compose 的模板文件主要分为3 个区域

+ services服务：在它下面可以定义应用需要的一些服务，每个服务都有自己的名字、使用的镜像、挂载的数据卷、所属的网络、依赖哪些其他服务等等。
+ volumes数据卷：在它下面可以定义的数据卷（名字等等），然后挂载到不同的服务下去使用。
+ networks：应用的网络，在它下面可以定义应用的名字、使用的网络类型等等。

# 二、常用模板文件主要命令
| 命令 | 功能 |
| --- | --- |
| build | 指定Dockerfile所在文件夹的路径 |
| cap_add,cap_drop | 指定容器的内核能力分配 |
| command | 覆盖容器启动后默认执行的命令。 |
| configs | 仅用于 Swarm mode |
| cgroup_parent | 指定父 cgroup 组，意味着将继承该组的资源限制。 |
| container_name | 指定容器名称。默认将会使用    项目名称_服务名称_序号 这样的格式。 |
| domainname  | 指定容器中搜索域名 |
| deploy | 指定部署和运行时的容器相关配置，仅用于 Swarm mode |
| devices | 指定设备映射关系。 |
| depends_on | 解决容器的依赖、启动先后的问题。 |
| dns | 自定义 DNS 服务器。可以是一个值，也可以是一个列表。 |
| dns_search | 配置 DNS 搜索域。可以是一个值，也可以是一个列表。 |
| dockerfile | 指定额外的编译镜像的Dockerfile文件 |
| entrypoint | 覆盖容器中默认的入口命令 |
| env_file | 从文件中获取环境变量，可以为单独的文件路径或列表。 |
| environment | 设置环境变量 |
| expose | 暴露端口，但不映射到宿主机，只被连接的服务访问。仅可以指定内部端口为参数 |
| extends | 基于其他模板文件进行扩展 |
| external_links | 链接到 docker-compose.yml 外的容器，甚至并非 Compose 管理的外部容器。 |
| extra_hosts | 类似 Docker 中的   --add-host 参数，指定额外的 host 名称映射信息 |
| hostname | 指定容器中搜索主机名 |
| healthcheck | 通过命令检查容器是否健康运行。 |
| image | 指定为镜像名称或镜像 ID。如果镜像在本地不存在，   Compose 将会尝试拉取这个镜像。 |
| isolation | 配置容器隔离的机制 |
| labels | 为容器添加 Docker 元数据（metadata） 信息。 |
| links | 链接到其他服务中的容器 |
| logging | 配置日志选项。 |
| mac_address     | 指定容器中搜索mac 地址 |
| network_mode | 设置网络模式。 |
| networks | 配置容器连接的网络。 |
| pid | 跟主机系统共享进程命名空间。 |
| privileged  | 允许容器中运行一些特权命令。 |
| ports | 暴露端口信息。 |
| read_only  | 以只读模式挂载容器的 root 文件系统，意味着不能对容器内容进行修改。 |
| restart | 指定容器退出后的重启策略为始终重启 |
| secrets | 存储敏感数据 |
| security_opt | 指定容器模板标签（label） 机制的默认属性（用户、角色、类型、级别等） |
| stop_signal     | 设置另一个信号来停止容器 |
| stdin_open | 打开标准输入，可以接受外部输入。 |
| sysctls | 配置容器内核参数。 |
| tty  | 模拟一个伪终端。 |
| tmpfs | 挂载一个 tmpfs 文件系统到容器。 |
| ulimits | 指定容器的 ulimits 限制值。 |
| user  | 指定容器中运行应用的用户名。 |
| userns_mode | 指定用户命名空间模式 |
| volumes | 数据卷所挂载路径设置 |
| working_dir | 指定容器中工作目录。 |


1. build

指定Dockerfile所在文件夹的路径（可以是绝对路径，或者相对docker-compose.yml文件的路径）。Compose将会利用它自动构建应用镜像，然后使用这个镜像，例如：

```yaml
services:
  app:
  	build: /path/to/build/dir
```

+ build指令还可以指定创建镜像的上下文、Dockerfile路径、标签、Shm大小、参数和缓存来源等，例如：

```yaml
services:
  app:
    build:
      context:  /path/to/build/dir
      dockerfile: Dockerfile-app
      labels:
        version:  "2.0"
        released:  "true"
      shm_size: '2gb'
      args:
        key: value
        name: myApp
      cache_from:
        - myApp:1.0
```

2. cap_add, cap_drop

指定容器的内核能力（capacity）分配。

```yaml
# 例如，让容器拥有所有能力可以指定为：
cap_add:
	- ALL
# 去掉NET_ADMIN能力可以指定为：
cap_drop:
	- NET_ADMIN
```

3. command

覆盖容器启动后默认执行的命令，可以为字符串格式或JSON数组格式。 例如：

command: echo "hello world"

+ 或者：

command: ["bash",  "-c", "echo", "hello world"]

4. configs

在Docker  Swarm模式下，可以通过configs来管理和访问非敏感的配置信息。支持从文件读取或外部读取。例如：

```yaml
services:
  app:
    image: myApp:1.0
    deploy:
      replicas: 1
    configs:
      - file_config
      - external_config
configs:
  file_config:
    file: ./config_file.cfg
  external_config:
    external: true
```

5. cgroup_parent

指定父cgroup组，意味着将继承该组的资源限制。目前不支持在Swarm模式中使用。例如，创建了一个cgroup组名称为cgroups_1：

cgroup_parent: cgroups_1

6. container_name

指定容器名称。默认将会使用“项目名称_服务名称_序号”这样的格式。目前不支持在Swarm模式中使用。例如：

container_name: docker-web-container

+ 需要注意，指定容器名称后，该服务将无法进行扩展，因为Docker不允许多个容器实例重名。
7. devices

指定设备映射关系，不支持Swarm模式。例如：

```yaml
devices:
	-  "/dev/ttyUSB1:/dev/ttyUSB0"
```

8. depends_on

指定多个服务之间的依赖关系。启动时，会先启动被依赖服务。例如，可以指定依赖于db服务：

depends_on: db

9. dns

自定义DNS服务器。可以是一个值，也可以是一个列表。例如：

```yaml
dns: 8.8.8.8
dns:
  -8.8.8.8
  -9.9.9.9
```

10. dns_search

配置DNS搜索域。可以是一个值，也可以是一个列表。例如：

```yaml
dns_search: example.com
dns_search:
  - domain1.example.com
  - domain2.example.com
```

11. dockerfile

如果需要，指定额外的编译镜像的Dockefile文件，可以通过该指令来指定。例如：

dockerfile: Dockerfile-alternate

该指令不能跟image同时使用，否则Compose将不知道根据哪个指令来生成最终的服务镜像。

12. entrypoint

覆盖容器中默认的入口命令。注意，也会取消掉镜像中指定的入口命令和默认启动命令。例如，覆盖为新的入口命令：

entrypoint: python app.py

13. env_file

从文件中获取环境变量，可以为单独的文件路径或列表。如果通过docker-compose-f  FILE方式来指定Compose模板文件，则env_file中变量的路径会基于模板文件路径。如果有变量名称与environment指令冲突，则按照惯例，以后者为准。例如：

```yaml
env_file: .env
env_file:
  - ./common.env
  - ./apps/web.env
  - /opt/secrets.env
```

+ 环境变量文件中每一行必须符合格式，支持#开头的注释行，例如：

# common.env: Set development  environment

PROG_ENV=development

14. environment
+ 设置环境变量，可以使用数组或字典两种格式。只给定名称的变量会自动获取运行Compose主机上对应变量的值，可以用来防止泄露不必要的数据。

```yaml
# 例如
environment:
  RACK_ENV: development
  SESSION_SECRET:
# 或者：
environment:
  - RACK_ENV=development
  - SESSION_SECRET
```

15. expose

暴露端口，但不映射到宿主机，只被连接的服务访问。仅可以指定内部端口为参数，如下所示：

```yaml
expose:
  - "3000"
  - "8000"
```

16. extends

基于其他模板文件进行扩展。例如，我们已经有了一个webapp服务，定义一个基础模板文件为common.yml，如下所示：

```yaml
# common.yml
webapp:
  build: ./webapp
  environment:
    - DEBUG=false
    - SEND_EMAILS=false
# 再编写一个新的development.yml文件，使用common.yml中的webapp服务进行扩展：
# development.yml
web:
  extends:
    file: common.yml
    service: webapp
  ports:
  	- "8000:8000"
  links:
  	- db
  environment:
  	- DEBUG=true
db:
	image: postgres
```

+ 后者会自动继承common.yml中的webapp服务及环境变量定义。
17. external_links

链接到docker-compose.yml外部的容器，甚至并非Compose管理的外部容器。参数格式跟links类似。

```yaml
external_links:
  - redis_1
  - project_db_1:mysql
  - project_db_1:postgresql
```

18. extra_hosts

类似Docker中的--add-host参数，指定额外的host名称映射信息。

```yaml
extra_hosts:
        - "googledns:8.8.8.8"
        - "dockerhub:52.1.157.61"
# 会在启动后的服务容器中/etc/hosts文件中添加如下两条条目。
8.8.8.8 googledns
52.1.157.61 dockerhub
```

19. healthcheck
+ 指定检测应用健康状态的机制，包括检测方法（test）、间隔（interval）、超时（timeout）、重试次数（retries）、启动等待时间（start_period）等。
+ 例如，指定检测方法为访问8080端口，间隔为30秒，超时为15秒，重试3次，启动后等待30秒再做检查。

```yaml
healthcheck:
  test: ["CMD",  "curl", "-f", "http://localhost:8080"]
  interval: 30s
  timeout: 15s
  retries: 3
  start_period: 30s
```

20. image

指定为镜像名称或镜像ID。如果镜像在本地不存在，Compose将会尝试拉去这个镜像。

```yaml
image: ubuntu
image: orchardup/postgresql
image: a4bc65fd
```

21. isolation

配置容器隔离的机制，包括default、process和hyperv。

22. labels

为容器添加Docker元数据（metadata）信息。例如可以为容器添加辅助说明信息。

```yaml
labels:
  com.startupteam.description:  "webapp for a startup team"
  com.startupteam.department:  "devops department"
  com.startupteam.release: "rc3 for  v1.0"
```

23. links

注意：links命令属于旧的用法，可能在后续版本中被移除。

链接到其他服务中的容器。使用服务名称（同时作为别名）或服务名称：服务别名（SERVICE:ALIAS）格式都可以。

```yaml
links:
  - db
  - db:database
  - redis
# 使用的别名将会自动在服务容器中的/etc/hosts里创建。例如：
172.17.2.186   db
172.17.2.186   database
172.17.2.187   redis
# 被链接容器中相应的环境变量也将被创建。
```

24. logging

跟日志相关的配置，包括一系列子配置。

+ logging.driver：类似于Docker中的--log-driver参数，指定日志驱动类型。目前支持三种日志驱动类型：

driver: "json-file"

driver: "syslog"

driver: "none"

+ logging.options：日志驱动的相关参数。例如：

```yaml
logging:
  driver: "syslog"
  options:
  	syslog-address:  "tcp://192.168.0.42:123"
或：
logging:
  driver: "json-file"
  options:
    max-size: "1000k"
    max-file: "20"
```

25. network_mode

设置网络模式。使用和docker  client的--net参数一样的值。

network_mode: "none"

network_mode: "bridge"

network_mode: "host"

network_mode: "service:[service  name]"

network_mode: "container:[name or  id]"

26. networks

所加入的网络。需要在顶级的networks字段中定义具体的网络信息。

+ 例如，指定web服务的网络为web_net，并添加服务在网络中别名为web_app。

```yaml
services:
  web:
    networks:
      web_net：
        aliases: web_app
      ipv4_address: 172.16.0.10
networks:
  web_net:
    driver: bridge
    enable_ipv6: true
    ipam:
      driver: default
      config:
        subnet: 172.16.0.0/24
```

27. pid

跟主机系统共享进程命名空间。打开该选项的容器之间，以及容器和宿主机系统之间可以通过进程ID来相互访问和操作。

pid: "host"

28. ports

暴露端口信息。

使用宿主：容器（HOST:CONTAINER）格式，或者仅仅指定容器的端口（宿主将会随机选择端口）都可以。

```yaml
ports:
  - "3000"
  - "8000:8000"
  - "49100:22"
  - "127.0.0.1:8001:8001"
或者：
ports:
  - target: 80
    published: 8080
    protocol: tcp
    mode: ingress
```

29. secrets

配置应用的秘密数据。

可以指定来源秘密、挂载后名称、权限等。

```yaml
services:
  web:
    image: webapp:stable
    deploy:
      replicas: 2
    secrets:
      - source: web_secret
        target: web_secret
        uid: '103'
        gid: '103'
        mode: 0444
secrets:
  web_secret:
    file: ./web_secret.txt
```

30. security_opt

指定容器模板标签（label）机制的默认属性（用户、角色、类型、级别等）。

例如，配置标签的用户名和角色名：

```yaml
security_opt:
  - label:user:USER
  - label:role:ROLE
```

31. stop_grace_period

指定应用停止时，容器的优雅停止期限。过期后则通过SIGKILL强制退出。默认值为10s。

32. stop_signal

指定停止容器的信号，默认为SIGTERM。

33. sysctls

配置容器内的内核参数。Swarm模式中不支持。

例如，指定连接数为4096和开启TCP的syncookies：

```yaml
sysctls:
  net.core.somaxconn: 4096
  net.ipv4.tcp_syncookies: 1
```

34. ulimits

指定容器的ulimits限制值。

例如，指定最大进程数为65535，指定文件句柄数为20000（软限制，应用可以随时修改，不能超过硬限制）和40000（系统硬限制，只能root用户提高）。

```yaml
ulimits:
  nproc: 65535
  nofile:
    soft: 20000
    hard: 40000
```

35. userns_mode

指定用户命名空间模式。Swarm模式中不支持。例如，使用主机上的用户命名空间：

userns_mode: "host"

36. volumes

数据卷所挂载路径设置。可以设置宿主机路径（HOST:CONTAINER）或加上访问模式（HOST:CONTAINER:ro）。

支持driver、driver_opts、external、labels、name等子配置。

```yaml
# 该指令中路径支持相对路径。例如
volumes:
  - /var/lib/mysql
  - cache/:/tmp/cache
  - ~/configs:/etc/configs/:ro
# 或者可以使用更详细的语法格式：
volumes:
  - type: volume
    source: mydata
    target: /data
    volume:
    	nocopy: true
volumes:
	mydata:
```

37. restart

指定重启策略，可以为no（不重启）、always（总是）、on-failure（失败时）、unless-stopped（除非停止）。

注意Swarm模式下要使用restart_policy。在生产环境中推荐配置为always或者unless-stopped。

例如，配置除非停止：

restart: unless-stopped

38. deploy

指定部署和运行时的容器相关配置。该命令只在Swarm模式下生效，且只支持docker  stack deploy命令部署。

```yaml
version: '3'
  services:
    redis:
      image: web:stable
      deploy:
        replicas: 3
        update_config:
          parallelism: 2
          delay: 10s
        restart_policy:
          condition: on-failure
```

deploy命令中包括endpoint_mode、labels、mode、placement、replicas、resources、restart_policy、update_config等配置项。

+ endpoint_mode

指定服务端点模式。包括两种类型：

vip:Swarm分配一个前端的虚拟地址，客户端通过给地址访问服务，而无须关心后端的应用容器个数；

dnsrr:Swarm分配一个域名给服务，用户访问域名时候回按照轮流顺序返回容器地址。

```yaml
version: '3'
  services:
    redis:
      image: web:stable
      deploy:
        mode: replicated
        replicas: 3
        endpoint_mode: vip
```

+ labels

指定服务的标签。注意标签信息不会影响到服务内的容器。

```yaml
version: "3"
  services:
    web:
      image: web:stable
      deploy:
        labels:
          description: "This is  a web application service."
```

+ mode

定义容器副本模式，可以为：

global：每个Swarm节点上只有一个该应用容器；

replicated：整个集群中存在指定份数的应用容器副本，默认值。

例如，指定集群中web应用保持3个副本：

```yaml
version: "3"
  services:
    web:
      image: web:stable
      deploy:
        mode: replicated
        replicas: 3
```

+ placement

定义容器放置的限制（constraints）和配置（preferences）。限制可以指定只有符合要求的节点上才能运行该应用容器；配置可以指定容器的分配策略。例如，指定集群中web应用容器只存在于高安全的节点上，并且在带有zone标签的节点上均匀分配。

```yaml
version: '3'
  services:
    db:
      image: web:stable
      deploy:
        placement:
          constraints:
            -  node.labels.security==high
          preferences:
            - spread:  node.labels.zone
```

+ replicas

容器副本模式为默认的replicated时，指定副本的个数。

+ resources

指定使用资源的限制，包括CPU、内存资源等。例如，指定应用使用的CPU份额为10%～25%，内存为200  MB到500 MB。

```yaml
version: '3'
  services:
    redis:
      image: web:stable
      deploy:
        resources:
          limits:
            cpus: '0.25'
            memory: 500M
          reservations:
            cpus: '0.10'
            memory: 200M
```

+ restart_policy

指定容器重启的策略。例如，指定重启策略为失败时重启，等待2s，重启最多尝试3次，检测状态的等待时间为10s。

```yaml
version: "3"
  services:
    redis:
      image: web:stable
      deploy:
        restart_policy:
          condition: on-failure
          delay: 2s
          max_attempts: 3
          window: 10s
```

+ update_config

有些时候需要对容器内容进行更新，可以使用该配置指定升级的行为。包括每次升级多少个容器（parallelism）、升级的延迟（delay）、升级失败后的行动（failure_action）、检测升级后状态的等待时间（monitor）、升级后容忍的最大失败比例（max_failure_ratio）、升级顺序（order）等。例如，指定每次更新两个容器、更新等待10s、先停止旧容器再升级。

```yaml
version: "3.4"
  services:
    redis:
      image: web:stable
      deploy:
        replicas: 2
        update_config:
          parallelism: 2
          delay: 10s
          order: stop-first
```



# 三、其他指令
domainname、hostname、ipc、mac_address、privileged、read_only、shm_size、stdin_open、tty、user、working_dir等指令，基本跟docker-run中对应参数的功能一致。

+ 指定容器中工作目录：

working_dir: /code

+ 指定容器中搜索域名、主机名、mac地址等：

domainname: your_website.com    

hostname: test

mac_address: 08-00-27-00-0C-0A

+ 允许容器中运行一些特权命令：

privileged: true


