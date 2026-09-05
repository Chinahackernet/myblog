# Supervisor-守护进程工具

> 分类：Linux / 第9章：进程管理
> 原文：https://www.cuiliangblog.cn/detail/section/31508378
> 来源：崔亮的博客

---

# Supervisor简介
## supervisord
运行 Supervisor 时会启动一个进程 supervisord，它负责启动所管理的进程，并将所管理的进程作为自己的子进程来启动，而且可以在所管理的进程出现崩溃时自动重启。

### supervisorctl
命令行管理工具，可以用来执行 stop、start、restart 等命令，来对这些子进程进行管理。

### Supervisor
所有进程的父进程，管理着启动的子进展，supervisor以子进程的PID来管理子进程，当子进程异常退出时supervisor可以收到相应的信号量。

# 安装Supervisor
## 方式1：在线安装：
```plain
# 安装python包管理工具
yum -y install python-setuptools
# 安装Supervisor
pip3 install supervisor
```

### 方式2：离线安装
```plain
# 下载软件包
wgethttps://pypi.python.org/packages/source/s/supervisor/supervisor-3.1.3.tar.gz
# 解压软件包
tar zxvf supervisor-3.1.3.tar.gz
cd supervisor-3.1.3
# 安装
python setup.py install
```

### 配置Supervisor应用守护
通过运行echo_supervisord_conf程序生成supervisor的初始化配置文件

```plain
mkdir /etc/supervisor
echo_supervisord_conf > /etc/supervisor/supervisord.conf
```

为了不将所有新增配置信息全写在一个配置文件里，这里新建一个文件夹

```plain
mkdir /etc/supervisor/conf.d/
```

修改系统配置文件

```plain
# cat /etc/supervisor/supervisord.conf
[include]
files = conf.d/*.conf
```

若需要web页面查看进程，则去掉[inet_http_server]的注释

```plain
[inet_http_server]         ; inet (TCP) server disabled by default
port=*:9001        ; ip_address:port specifier, *:port for all iface
username=admin             ; default is no username (open server)
password= CHANGE_ME            ; default is no password (open server)
```

### 配置Supervisor服务管理
查看文件路径

```plain
# which supervisord
# which supervisorctl
```

创建服务管理文件，记得将supervisord和supervisorctl填写正确的绝对路径

```plain
# cat /usr/lib/systemd/system/supervisord.service
[Unit]
Description=Supervisor daemon
 
[Service]
Type=forking
ExecStart=/usr/bin/supervisord -c /etc/supervisor/supervisord.conf -l /var/log/supervisord/supervisord.log
ExecStop=/usr/bin/supervisorctl shutdown
ExecReload=/usr/bin/supervisorctl reload
KillMode=process
Restart=on-failure
RestartSec=42s
 
[Install]
WantedBy=multi-user.target
```

设置supervisord服务自启动

```plain
systemctl enable supervisord
```

开启supervisord服务

```plain
systemctl start supervisord
```

浏览器访问查看

![](assets/10-Linux/33493220a10cb6ef0bc3.png)

# 为程序创建守护进程
为你的程序创建一个.conf文件，放在目录"/etc/supervisor/conf.d/"下。

```plain
# cat /etc/supervisor/conf.d/ping.conf
 
[program:PingServer] ;程序名称，终端控制时需要的标识
command=sh ping.sh ; 运行程序的命令
directory=/root/ ; 命令执行的目录
autorestart=true ; 程序意外退出是否自动重启
stderr_logfile=/var/log/PingServer.err.log ; 错误日志文件
stdout_logfile=/var/log/PingServer.out.log ; 输出日志文件
user=root ; 进程执行的用户身份
stopsignal=INT
```

重启服务

```plain
 systemctl restart supervisord
```

查看后台进程状态

![](assets/10-Linux/80b407538b2117d28053.png)

![](assets/10-Linux/9770a1c9c9764da18f62.png)

查看输出日志

![](assets/10-Linux/0cdbe93afb0f462ec4e1.png)

# 常用的相关管理命令
supervisorctl restart <application name> ;重启指定应用

supervisorctl stop <application name> ;停止指定应用

supervisorctl start <application name> ;启动指定应用

Supervisorctl status all;查看所有应用状态

supervisorctl restart all ;重启所有应用

supervisorctl stop all ;停止所有应用

supervisorctl start all ;启动所有应用


