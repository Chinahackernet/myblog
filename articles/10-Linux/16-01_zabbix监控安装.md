# zabbix监控安装

> 分类：Linux / 第16章：zabbix监控
> 原文：https://www.cuiliangblog.cn/detail/section/31515977
> 来源：崔亮的博客

---

# 一、官方安装教程
    - [参考链接](https://www.zabbix.com/cn/download)

# 二、安装的 zabbix server版本为 zabbix3.4
    1. 准备工作：安装源码库配置部署包
+ [root@localhost yum.repos.d]# rpm -ivh [https://mirrors.aliyun.com/zabbix/zabbix/3.4/rhel/7/x86_64/zabbix-release-3.4-1.el7.centos.noarch.rpm](https://mirrors.aliyun.com/zabbix/zabbix/3.4/rhel/7/x86_64/zabbix-release-3.4-1.el7.centos.noarch.rpm)
+ [root@localhost yum.repos.d]# vim zabbix.repo 
+ [root@localhost yum.repos.d]# yum -y  makecache
+ [root@localhost ~]# yum install zabbix-server-mysql  zabbix-web-mysql zabbix-agent mariadb-server
    1. **初始化****zabbix database**
+ [root@localhost ~]# systemctl start mariadb
+ [root@localhost ~]# mysql -uroot -p
+ MariaDB [(none)]> create database zabbix character set utf8  collate utf8_bin;
+ MariaDB [(none)]> grant all privileges on zabbix.* to  zabbix@localhost identified by 'CHANGE_ME';
+ MariaDB [(none)]> show databases;
+ MariaDB [(none)]> exit;
    1. 初始化zabbix所需要的数据库表。
+ [root@localhost ~]# cd  /usr/share/doc/zabbix-server-mysql-3.4.15/
+ 查看压缩包，查看后交给mysql
+ [root@localhost ~]# zcat create.sql.gz |mysql -uroot zabbix -p  
    1. 查看zabbix数据库，发现对应的表已经生成。
+ [root@localhost ~]# mysql -uroot -p
+ MariaDB [(none)]> show databases;
+ MariaDB [(none)]> use zabbix;
+ MariaDB [zabbix]> show tables;
    1. **配置****zabbix server****端并启动**
+ server端已经安装完毕，并且数据库也已经初始化，现在我们开始配置server端，编辑zabbix server端的配置文件。
+ [root@localhost ~]# vim /etc/zabbix/zabbix_server.conf 
+ 此处列出我们可能会经常修改的参数，如下：
+ ListenPort=10051
+ #服务端监听的端口，保持默认即可
+ SourceIP=
+ #通过SourceIP参数可以指定服务端的源IP，当server端有多个IP地址时，我们可以指定服务端使用固定的IP与agent端进行通讯，为了安全起见，agent端会基于IP进行一定的访问控制，也就是说agent端只允许指定的IP以server端的身份采集被监控主机的数据，如果IP不对应，则不允许采集被监控主机的数据，所以，当server端有多个IP时，我们可以通过SourceIP参数，指定server端通过哪个IP采集被监控主机的数据。
+ LogType=file
+ #通过LogType参数，可以指定通过哪种方式记录日志，此参数可以设置为三种值，system、file、console,system表示将日志发往syslog，file表示使用指定的文件作为日志文件，console表示将日志发往控制台，默认为file。
+ LogFile=/var/log/zabbix/zabbix_server.log
+ #当LogType设置为file时，通过LogFile参数设置日志文件位置。
+ LogFileSize=0
+ #指明日志文件达到多大时自动滚动，单位为MB，如果设置LogFileSize为50，表示日志大小达到50MB滚动一次，设置为0表示日志文件不会滚动，所有日志192保存在一个文件中。
+ DebugLevel=3
+ #通过DebugLevel参数可以定义日志的详细程度，即为日志级别。
+ DBHost=localhost
+ #通过DBHost参数设置zabbix数据库所在的服务器IP，由于此处zabbix与mysql安装在同一服务器上，所以此处设置为localhost
+ DBName=zabbix
+ #通过DBName指定zabbix数据库对应的名称
+ DBUser=zabbix
+ #通过DBUser指定zabbix数据库用户名
+ **DBPassword=CHANGE_ME
+ #通过DBPassword指定zabbix数据库用户的密码
+ DBPort=3306
+ #通过DBPort指定zabbix所在数据库服务监听的端口号
+ DBSocket=/var/lib/mysql/mysql.sock
+ #如果数据库服务与server端在同一台服务器上，可以通过DBSocket指定数据库本地套接字文件位置,但是需要注意，即使设置了mysql套接字文件的位置，还是需要配合DBHost参数，否则在登录zabbix控制台时，可能会出现警告，在zabbix server的log中，也可能会出现无法连接到数据库的提示。
+ 根据上述的配置参数的解释，根据具体需求进行实际配置即可。
    1. 配置完成后，启动zabbix服务端即可，启动后，10051端口已经被监听。
+ [root@localhost ~]# systemctl start zabbix-server
+ [root@localhost ~]# systemctl status zabbix-server
+ [root@bogon ~]# ss -tnl 
+ LISTEN     0      128      *:10051               *:*  
+ zabbix server已经启动，剩下的就是初始化zabbix设置了，初始化zabbix的设置需要zabbix web提供的GUI图形化界面，所以，需要先安装zabbix  web。

# 三、安装zabbix  web
    - zabbix web可以安装在单独的主机上，只要能连接到zabbix database所在的数据库即可，但是此处为了方便，我们将zabbix web与 mysql以及 zabbix server安装在同一台服务器上。
+ zabbix-web-mysql是之前安装完成zabbix-web程序包，可以看到，zabbix-web的web应用存放在/usr/share/zabbix中。
+ [root@bogon ~]# rpm -ql zabbix-web
    1. 编辑Zabbix前端的PHP配置
+ 调整一个时区，如果不调整，一打开页面会有很多乱码。
+ [root@localhost ~]# vim /etc/httpd/conf.d/zabbix.conf
+ php_value date.timezone **Asia/ShangHai**
+ 可以看到，针对zabbix web的文档路径，此文件中已经为我们准备好了默认配置，只要将时区稍加改动即可直接使用。将时区修改为亚洲上海。
    1. 配置完成后，启动httpd服务。
+ [root@localhost ~]# systemctl start httpd
+ [root@localhost ~]# systemctl status httpd
+ zabbix web安装配置完成  

# 四、初始化zabbix  配置
    1. 完成上述安装步骤后，访问 Zabbix_Web_IP/zabbix ，可以看到如下图的zabbix安装页面，点击下一步按钮
+ ![](assets/10-Linux/dadaf3ad1619e3d60c3e.png)
    1. 可以看到，zabbix自动检查了安装环境是否满足要求，如果出现不满足要求的情况，需要进一步处理，此处没有问题，点击下一步
+ ![](assets/10-Linux/ae543902f8b4f956bb23.png)
    1. 此处zabbix需要配置数据库连接，此处配置数据库的类型，IP，端口，数据库名，用户密码等信息，端口填写0表示使用默认端口（3306端口）
+ ![](assets/10-Linux/c0aafefb57dc626ccbd6.png)
    1. 此处填写zabbix server的详细信息，包括IP地址，端口号，以及server名称等，填写完成后点击下一步。
+ ![](assets/10-Linux/92bdc73bf83e64c9e6ff.png)
    1. 在配置之前，请确定概要信息无误，点击下一步。
+ ![](assets/10-Linux/d940a919e252ebabcf62.png)
    1. 从提示可以看出，初始化配置已经完成，而且zabbix提示我们，这些配置信息都被保存到了"/etc/zabbix/web/zabbix.conf.php" 配置文件中，如果想要更改刚才的一些配置，可以通过修改此文件完成，初始化已经完成，点击结束即可。
+ ![](assets/10-Linux/57f652202fb83292ebd4.png)
    1. 点击完成按钮后，可以看到zabbix的登录页面，默认的管理员用户为admin，密码为zabbix，输入用户名密码后登录。
+ ![](assets/10-Linux/e08ac8b3358ae36e8e4d.png)
    1. 登录完成后，可以看到zabbix的仪表盘。
+ ![](assets/10-Linux/b33b06cad324893fc090.png)
    1. 默认是英文显示，需要可以调成中文，点击下图中红框标注的图标。
+ ![](assets/10-Linux/28589d9cb88a9e6fdc36.png)
    1. 语言选择中文，点击更新即可，上述操作完成后，zabbix控制台即显示为中文了。
+ 为了更加安全，我们不应该使用管理员的默认密码，所以，我们最好先修改管理员密码
+ ![](assets/10-Linux/2d88b3182c641e24ffd0.png)
    1. 以后的监控工作就要围绕这个web界面展开了，为了以后更好的展开工作，先大概的了解一下zabbix的菜单。
+ 管理菜单中，一般用于管理zabbix自身及zabbix相关设置。
+ ![](assets/10-Linux/c7930475cb25b7aaa75b.png)
+ 配置菜单中，一般用于配置监控相关设置
+ ![](assets/10-Linux/a7115dd760851217b345.png)
+ 监测中菜单，一般用于查看被监控的相关数据
+ ![](assets/10-Linux/323b4529490c1403a4d2.png)
+ 报表菜单中，可以为管理员生成一段时间内的监控统计信息。
+ ![](assets/10-Linux/b608f8c6d0339ff55417.png)
+ 资产记录菜单中，管理员可以查看被管控的主机有哪些，以及相关的资产信息。
+ ![](assets/10-Linux/6714c65e6b262f1a148d.png)
+ zabbix web的安装及简介暂时告一段落。

# 五、安装zabbix  agent（YUM方式）
    1. agent端安装也非常方便，配置好zabbix源，直接被监控主机上安装zabbix-agent即可。（zabbix-server本身已安装zabbix-agent，再起一台机器做zabbix-agent）
+ [root@bogon ~]#  rpm -ivh [https://mirrors.aliyun.com/zabbix/zabbix/3.4/rhel/7/x86_64/zabbix-release-3.4-1.el7.centos.noarch.rpm](https://mirrors.aliyun.com/zabbix/zabbix/3.4/rhel/7/x86_64/zabbix-release-3.4-1.el7.centos.noarch.rpm)
+ [root@bogon ~]# yum install -y zabbix-agent
    1. 我们查看一下zabbix-agent都安装了哪些文件，最重要的就是zabbix_agentd.conf这个配置文件了。
+ [root@bogon ~]# rpm -ql zabbix-agent
+ vim /etc/zabbix/zabbix_agentd.conf
+ 在刚开始介绍zabbix时，说过"主动模式"与"被动模式"，这两种模式的相关配置，都需要在zabbix_agentd.conf中定义，打开这个文件，我们来配置一下最常用的agent端配置。打开配置文件，首先看到的就是"通用参数配置段"，可以在此配置段配置zabbix_agent进程的进程编号文件路径，存储日志方式，日志文件位置，日志滚动阈值等常用设定，zabbix_agent配置文件的"通用配置段"中的参数大多数与zabbix_server配置文件中的常用参数意义相同，此处不再过多赘述，如果没有特殊需要，保持默认即可。
+ 此处先说下马上会用到的两个配置段，如下图红框中的注释所描述的，"被动模式配置段"与"主动模式配置段"
+ ![](assets/10-Linux/fada88e4e39a8ade7bd0.png)
+  
+ ![](assets/10-Linux/471c3b6f0d8aad3ab133.png)
+ 在最开始的概念介绍中，描述过，"主动模式"与"被动模式"都是对于agent端来说的，而且它们可以同时存在，并不冲突。
+ 先来看看"被动模式"的相关配置参数。
+ 被动模式相关参数如下：
+ Server：用于指定允许哪台服务器拉取当前服务器的数据，当agent端工作于被动模式，则代表server端会主动拉取agent端数据，那么server端的IP必须与此参数的IP对应，此参数用于实现基于IP的访问控制，如果有多个IP ,可以使用逗号隔开。
+ ListenPort：用于指定当agent端工作于被动模式时所监听的端口号，默认端口为10050，也就是说，server端默认访问10050端口，从而拉取数据。
+ ListenIP：用于指定agent端工作于被动模式时所监听的IP地址，默认值为0.0.0.0，表示监听本机的所有IP地址。
+ StartAgents：用于指定预生成的agent进程数量。
+ 下面看看主动模式。
+ 主动模式的常用参数如下：
+ ServerActive：此参数用于指定当agent端工作于主动模式时，将信息主动推送到哪台server上，当有多个IP时，可以用逗号隔开。
+ Hostname：此参数用于指定当前主机的主机名，server端通过此参数对应的主机名识别当前主机。
+ RefreshActiveChecks：此参数用于指明agent端每多少秒主动将采集到的数据发往server端。
+ 此处，我们同时设置"被动模式"与"主动模式"的如下参数，其他保持默认即可，修改完成后保存退出。
+ **Server=192.168.137.104**
+ **ServerActive=192.168.137.104**
    1. 配置文件修改完成后，启动agent端进程。
+ [root@bogon ~]# systemctl start zabbix-agent
+ [root@bogon ~]# systemctl status zabbix-agent 
+ agent端也安装完毕。

# 六、安装zabbix  agent（源码包方式）
    - centos7
    1. 下载zabbix 源代码
+ [源代码地址](https://www.zabbix.com/cn/download_sources)
    1. 创建用户和用户组
+ [root@master ~]#groupadd zabbix
+ [root@master ~]#useradd -g zabbix zabbix -s  /sbin/nologin
    1. 编译安装zabbix-agent
+ [root@master ~]# wget [https://sourceforge.net/projects/zabbix/files/ZABBIX%20Latest%20Stable/3.4.14/zabbix-3.4.14.tar.gz/download](https://sourceforge.net/projects/zabbix/files/ZABBIX%20Latest%20Stable/3.4.14/zabbix-3.4.14.tar.gz/download)  -O zabbix_3.4.14.tar.gz 
+ [root@master  ~]# tar xf zabbix-3.4.14-tar.gz
+ [root@master  ~]# cd zabbix-3.4.14
+ [root@master  zabbix-3.4.14]# ./configure --prefix=/usr/local/zabbix_agent --enable-agent
+ [root@master  zabbix-3.4.14]# make && make install
    1. 创建服务脚本
+ vim /usr/lib/systemd/system/zabbix-agentd.service
+ [Unit]
+ Description=Zabbix-agentd
+ After=network.target
+  
+ [Service]
+ Environment="CONFFILE=/usr/local/zabbix_agent/etc/zabbix_agentd.conf"
+ Type=forking
+ Restart=on-failure
+ PIDFile=/tmp/zabbix_agentd.pid
+ KillMode=control-group
+ ExecStart=/usr/local/zabbix_agent/sbin/zabbix_agentd -c $CONFFILE
+ ExecStop=/bin/kill  -SIGTERM $MAINPID
+ RestartSec=10s
+  
+ [Install]
+ WantedBy=multi-user.target
+  
+ [root@master zabbix-3.4.14]# systemctl start zabbix-agentd
+ [root@master zabbix-3.4.14]# systemctl enable zabbix-agentd
    - centos 6
+  


