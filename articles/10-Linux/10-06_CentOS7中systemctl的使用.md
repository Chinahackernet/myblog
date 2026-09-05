# CentOS7中systemctl的使用

> 分类：Linux / 第10章：服务管理
> 原文：https://www.cuiliangblog.cn/detail/section/31508422
> 来源：崔亮的博客

---

# 一、文件配置文件夹
1. systemd有系统和用户区分；系统（/user/lib/systemd/system/）、用户（/etc/lib/systemd/user/）
2. 一般系统管理员手工创建的单元文件建议存放在/etc/systemd/system/目录下面。

# 二、配置文件类型
+ 系统服务（.service）
+ 启动目标（.target）
+ 挂载点（.mount）
+ sockets（.sockets） 
+ 系统设备（.device）
+ 交换分区（.swap）
+ 文件路径（.path）
+ 由 systemd      管理的计时器（.timer）

# 三、配置文件详解
1. [Unit]
+ Description：服务的说明，以及与其他相依      daemon 的设置，包括在什么服务之后才启动此服务等
+ Documentation：提供文档查询及技术支持
+ After：说明此 unit 是在哪个      daemon 启动之后才启动
+ Before：说明此 unit 是在哪个      daemon 启动之前启动
+ Requires：明确的定义此 unit      需要在哪个 daemon 启动后才能够启动！即如果在此项设置的前导服务没有启动，那么此 unit 就不会被启动
+ Wants：与 Requires      相反，规范的是这个 unit 之后还要启动什么服务
2. [Service]
+ Type：

（1）simple：默认值，这个 daemon 主要由 ExecStart 接的指令串来启动，启动后常驻于内存中                                             （2） forking：程序后台运行，由 ExecStart 启动的程序通过 spawns 延伸出其他子程序来作为此 daemon 的主要服务。原生的父程序在启动结束后就会终止运行。 传统的 unit 服务大多属于这种项目                                                                                 （3）oneshot：与 simple 类似，不过这个程序在工作完毕后就结束了，不会常驻在内存中，一次性的服务                             

（4）dbus：与 simple 类似，但这个 daemon 必须要在取得一个 D-Bus 的名称后，才会继续运行！因此设置这个项目时，通常也要设置 BusName="  " 才行                                                                                                                                                           （5）idle：与 simple 类似，要执行这个 daemon 必须要所有的工作都顺利执行完毕后才会执行，这类的 daemon 通常是开机到最后才执行即可的服务！                                                                                                                                                                 （6）notify：与simple一样

+ EnvironmentFile：可以指定启动脚本的环境配置文件！例如      sshd.service 的配置文件写入到 /etc/sysconfig/sshd 当中！也可以使用 Environment= 后面接多个不同的      Shell 变量来给予设置！
+ ExecStart：实际执行此 daemon      的指令或脚本程序，也可以使用 ExecStartPre （之前） 以及 ExecStartPost （之后）      两个设置，在实际启动服务前，进行额外的指令行为
+ ExecStop：与 systemctl      stop 的执行有关，关闭此服务时所进行的指令
+ ExecReload：与 systemctl      reload 有关的指令行为
+ Restart：当设置 Restart=1      时，则当此 daemon 服务终止后，会再次的启动此服务
+ PrivateTmp：True表示给服务分配独立的临时空间
+ PIDFile：服务进程号pid文件路径
+ RemainAfterExit：当设置为      RemainAfterExit=1 时，则当这个 daemon 所属的所有程序都终止之后，此服务会再尝试启动。这对于 Type=oneshot      的服务很有帮助！
+ TimeoutSec：若这个服务在启动或者是关闭时，因为某些缘故导致无法顺利“正常启动或正常结束”的情况下，则我们要等多久才进入“强制结束”的状态！
+ KillMode：可以是 process,      control-group, none 的其中一种，如果是 process，则 daemon 终止时，只会终止主要的程序 （ExecStart      接的后面那串指令），如果是 control-group 时， 则由此 daemon 所产生的其他 control-group      的程序，也都会被关闭。如果是 none 的话，则没有程序会被关闭！
+ RestartSec：与 Restart      有点相关性，如果这个服务被关闭，然后需要重新启动时，要 sleep 多少时间再重新启动的。默认是 100ms （毫秒）。
1. [Install]
+ WantedBy：这个设置后面接的大部分是      *.target unit ！这个 unit 本身是附挂在某个 target unit      下面！目录wants列表：/etc/systemd/system/multi-user.target.wants/redis.service
+ Also：指出和单元一起安装或者被协助的单元，当目前这个      unit 本身被 enable 时，Also 后面接的 unit 也请 enable 的意思！也就是具有相依性的服务可以写在这里！
+ Alias：systemctl enable      Unit时进行一个链接的别名的意思！当 systemctl enable 相关的服务时，则此服务会进行链接文件的创建！

# 三、systemctl 和chkconfig指令用法比较
| 任务 | 旧指令 | 新指令 |
| --- | --- | --- |
| 使某服务自动启动 | chkconfig –level 3 httpd on | <font style="color:#4F4F4F;">systemctl </font>**enable**<font style="color:#4F4F4F;">  httpd.service</font> |
| 使某服务不自动启动 | chkconfig –level 3 httpd off | <font style="color:#4F4F4F;">systemctl </font>**disable**<font style="color:#4F4F4F;">  httpd.service</font> |
| 检查服务状态 | service httpd status | <font style="color:#4F4F4F;">systemctl </font>**status**<font style="color:#4F4F4F;"> httpd.service</font> |
| 显示所有已启动的服务 | chkconfig –list | <font style="color:#4F4F4F;">systemctl </font>**list-units –type=service** |
| 启动某服务 | service httpd start | <font style="color:#4F4F4F;">systemctl </font>**start**<font style="color:#4F4F4F;">  httpd.service</font> |
| 停止某服务 | service httpd stop | <font style="color:#4F4F4F;">systemctl </font>**stop**<font style="color:#4F4F4F;">  httpd.service</font> |
| 重启某服务 | service httpd restart | <font style="color:#4F4F4F;">systemctl </font>**restart**<font style="color:#4F4F4F;">  httpd.service</font> |


# 四、激活单元：新建target
1. 建立文件（用户启动需要内核启动）

![](assets/10-Linux/eec2586781fae30c58d4.png)

1. 启动目标（启动用户，内核随之启动）

![](assets/10-Linux/03b3936a5b6c74a02836.png)

1. 停止目标（停止内核，用户正常运行）

![](assets/10-Linux/9fa157af319163b63383.png)

1. 设置自定义内核开机启动
+ 修改文件[install]需要开启

![](assets/10-Linux/32e7b50b1e5d469b69f6.png)

+ 设置内核文件开机启动（**随着其它系统文件**）

![](assets/10-Linux/cf1b43f6fee4ecb9af7d.png)

+ 查看启动状态

![](assets/10-Linux/df1ce1d7ef62fc486023.png)

# 五、自定义服务设置自启动
## 存放路径
Centos7的服务systemctl 脚本一般存放在：/usr/lib/systemd , 目录下又有user和system之分

+ /usr/lib/systemd/system   # 系统服务，开机不需要登录就能运行的程序（相当于开机自启）
+ /usr/lib/systemd/user       # 用户服务，需要登录后才能运行的程序

目录下又存在两种类型的文件：

+ *.service   # 服务unit文件
+ *.target     # 开机级别unit

<font style="color:rgb(51, 51, 51);">Ce</font>ntOS7的每一个服务以.service结尾，一般会分为3部分：[Unit]、[Service]和[Install]

```bash
vim /usr/lib/systemd/system/xxx.service 
[Unit]   # 主要是服务说明
Description=test   # 简单描述服务
After=network.target    # 描述服务类别，表示本服务需要在network服务启动后在启动
Before=xxx.service      # 表示需要在某些服务启动之前启动，After和Before字段只涉及启动顺序，不涉及依赖关系。

[Service]  # 核心区域
Type=forking     # 表示后台运行模式。
User=user        # 设置服务运行的用户
Group=user       # 设置服务运行的用户组
KillMode=control-group   # 定义systemd如何停止服务
PIDFile=/usr/local/test/test.pid    # 存放PID的绝对路径
Restart=no        # 定义服务进程退出后，systemd的重启方式，默认是不重启
ExecStart=/usr/local/test/bin/startup.sh    # 服务启动命令，命令需要绝对路径
PrivateTmp=true                               # 表示给服务分配独立的临时空间
   
[Install]   
WantedBy=multi-user.target  # 多用户
```

## 字段说明
```bash
Type的类型有：
    simple(默认）：# 以ExecStart字段启动的进程为主进程
    forking:  # ExecStart字段以fork()方式启动，此时父进程将退出，子进程将成为主进程（后台运行）。一般都设置为forking
    oneshot:  # 类似于simple，但只执行一次，systemd会等它执行完，才启动其他服务
    dbus：    # 类似于simple, 但会等待D-Bus信号后启动
    notify:   # 类似于simple, 启动结束后会发出通知信号，然后systemd再启动其他服务
    idle：    # 类似于simple，但是要等到其他任务都执行完，才会启动该服务。
    
EnvironmentFile:
    指定配置文件，和连词号组合使用，可以避免配置文件不存在的异常。

Environment:
    后面接多个不同的shell变量。
    例如：
    Environment=DATA_DIR=/data/elk
    Environment=LOG_DIR=/var/log/elasticsearch
    Environment=PID_DIR=/var/run/elasticsearch
    EnvironmentFile=-/etc/sysconfig/elasticsearch
    
连词号（-）：在所有启动设置之前，添加的变量字段，都可以加上连词号
    表示抑制错误，即发生错误时，不影响其他命令的执行。
    比如`EnviromentFile=-/etc/sysconfig/xxx` 表示即使文件不存在，也不会抛异常
    
KillMode的类型：
    control-group(默认)：# 当前控制组里的所有子进程，都会被杀掉
    process: # 只杀主进程
    mixed:   # 主进程将收到SIGTERM信号，子进程收到SIGKILL信号
    none:    # 没有进程会被杀掉，只是执行服务的stop命令
Restart的类型：
    no(默认值)： # 退出后无操作
    on-success:  # 只有正常退出时（退出状态码为0）,才会重启
    on-failure:  # 非正常退出时，重启，包括被信号终止和超时等
    on-abnormal: # 只有被信号终止或超时，才会重启
    on-abort:    # 只有在收到没有捕捉到的信号终止时，才会重启
    on-watchdog: # 超时退出时，才会重启
    always:      # 不管什么退出原因，都会重启
    # 对于守护进程，推荐用on-failure
RestartSec字段：
    表示systemd重启服务之前，需要等待的秒数：RestartSec: 30 
    
各种Exec*字段：
    # Exec* 后面接的命令，仅接受“指令 参数 参数..”格式，不能接受<>|&等特殊字符，很多bash语法也不支持。如果想支持bash语法，需要设置Tyep=oneshot
    ExecStart：    # 启动服务时执行的命令
    ExecReload：   # 重启服务时执行的命令 
    ExecStop：     # 停止服务时执行的命令 
    ExecStartPre： # 启动服务前执行的命令 
    ExecStartPost：# 启动服务后执行的命令 
    ExecStopPost： # 停止服务后执行的命令

    
WantedBy字段：
    multi-user.target: # 表示多用户命令行状态，这个设置很重要
    graphical.target:  # 表示图形用户状体，它依赖于multi-user.target
```

 

 

 

 

 

 

 

 

 


