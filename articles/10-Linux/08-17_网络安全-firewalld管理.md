# 网络安全-firewalld管理

> 分类：Linux / 第8章：系统管理
> 原文：https://www.cuiliangblog.cn/detail/section/31508259
> 来源：崔亮的博客

---

# 一、firewalld简介
    1. 在CentOS       7里有几种防火墙共存：firewalld、iptables、ebtables。
    - 默认是使用firewalld来管理netfilter子系统，不过底层调用的命令仍然是iptables等。
    - firewalld跟iptables比起来，不好的地方是每个服务都需要去设置才能放行，因为默认是拒绝。
    - 而iptables里默认是每个服务是允许，需要拒绝的才去限制。
+ ![](assets/10-Linux/780808f57b2e42d392fb.png)
    2. firewalld相比iptables的优点
    - firewalld可以动态修改单条规则，而不需要像iptables那样，在修改了规则后必须得全部刷新才可以生效；
    - firewalld在使用上要比iptables人性化很多，即使不明白“五张表五条链”而且对TCP/IP协议也不理解也可以实现大部分功能。
    3. firewalld特点
    - firewalld自身并不具备防火墙的功能，而是和iptables一样需要通过内核的netfilter来实现，
    - firewalld和       iptables一样，他们的作用都是用于维护规则，而真正使用规则干活的是内核的netfilter，只不过firewalld和iptables的结构以及使用方法不一样罢了。
    4. 区域管理
    - firewalld将网卡对应到不同的区域（zone），zone       默认共有9个：
+ block  dmz drop external home internal public trusted work.
    - 不同的区域之间的差异是其对待数据包的默认行为不同，根据区域名字我们可以很直观的知道该区域的特征，在CentOS7系统中，默认区域被设置为public.
    - 在最新版本的fedora（fedora21）当中随着       server 版和 workstation 版的分化则添加了两个不同的自定义 zone FedoraServer 和       FedoraWorkstation 分别对应两个版本。
    - 通过将网络划分成不同的区域，制定出不同区域之间的访问控制策略来控制不同程序区域间传送的数据流。
    - 例如，互联网是不可信任的区域，而内部网络是高度信任的区域。网络安全模型可以在安装，初次启动和首次建立网络连接时选择初始化。
    5. 初始化区域：
    - 阻塞区域（block）：任何传入的网络数据包都将被阻止。
    - 工作区域（work）：相信网络上的其他计算机，不会损害你的计算机。
    - 家庭区域（home）：相信网络上的其他计算机，不会损害你的计算机。
    - 公共区域（public）：不相信网络上的任何计算机，只有选择接受传入的网络连接。
    - 隔离区域（DMZ）：隔离区域也称为非军事区域，内外网络之间增加的一层网络，起到缓冲作用。对于隔离区域，只有选择接受传入的网络连接。
    - 信任区域（trusted）：所有的网络连接都可以接受。
    - 丢弃区域（drop）：任何传入的网络连接都被拒绝。
    - 内部区域（internal）：信任网络上的其他计算机，不会损害你的计算机。只有选择接受传入的网络连接。
    - 外部区域（external）：不相信网络上的其他计算机，不会损害你的计算机。只有选择接受传入的网络连接。
    - 注：FirewallD的默认区域是public。
    6. firewalld默认提供了九个zone配置文件：block.xml、dmz.xml、drop.xml、external.xml、       home.xml、internal.xml、public.xml、trusted.xml、work.xml，他们都保存在“/usr/lib/firewalld/zones/”目录下。
    - 默认情况下,在/etc/firewalld/zones下面只有一个public.xml。如果给另外一个zone做一些改动，并永久保存，那么会自动生成对应的配置文件.
    7. 配置方法
+ firewalld的配置方法主要有三种：firewall-config、firewall-cmd和直接编辑xml文件，
+ 其中  firewall-config是图形化工具，firewall-cmd是命令行工具。
    7. firewalld默认配置文件有两个：
    - /usr/lib/firewalld/       （系统配置，尽量不要修改）
    - /etc/firewalld/ （用户配置地址）
    8. 什么是服务?
    - 在 /usr/lib/firewalld/services/       目录中，还保存了另外一类配置文件，每个文件对应一项具体的网络服务，如 ssh 服务等.
    - 与之对应的配置文件中记录了各项服务所使用的 tcp/udp       端口，在最新版本的 firewalld 中默认已经定义了 70+ 种服务供我们使用.
    - 当默认提供的服务不够用或者需要自定义某项服务的端口时，我们需要将       service 配置文件放置在 /etc/firewalld/services/ 目录中

# 二、使用firewalld
    1. 安装firewalld
+ [root@zcwyou  ~]# yum install firewalld firewall-config
    1. 启动服务
+ [root@zcwyou  ~]# systemctl start firewalld
    1. 开机自动启动服务
+ [root@zcwyou  ~]# systemctl enable firewalld
    1. 查看状态
+ [root@zcwyou  ~]# systemctl status firewalld
+ [root@zcwyou  ~]# firewall-cmd --state
    1. 关闭服务
+ [root@zcwyou  ~]# systemctl stop firewalld
    1. 取消开机启动
+ [root@zcwyou  ~]# systemctl disable firewalld
    1. 弃用FirewallD防火墙，改用iptables       （你也可以关闭目前还不熟悉的FirewallD防火墙，而使用iptables,但不建议:）
+ [root@zcwyou  ~]# yum install iptables-services
+ [root@zcwyou  ~]# systemctl start iptables
+ [root@zcwyou  ~]# systemctl enable iptables
    1. 查看版本
+ [root@zcwyou  ~]# firewall-cmd --version
    1. 查看帮助
+ [root@zcwyou  ~]# firewall-cmd --help
    1. 显示状态
+ [root@zcwyou  ~]# firewall-cmd --state
    1. 查看活动区域信息
+ [root@zcwyou  ~]# firewall-cmd --get-active-zones
    1. 查看XX接口所属区域
+ [root@zcwyou  ~]# firewall-cmd --get-zone-of-interface=XX
    1. 拒绝所有包
+ [root@zcwyou  ~]# firewall-cmd --panic-on
    1. 取消拒绝状态
+ [root@zcwyou  ~]# firewall-cmd --panic-off
    1. 查看是否拒绝
+ [root@zcwyou  ~]# firewall-cmd --query-panic
    1. 查看firewalld是否开启
+ [root@zcwyou  ~]# systemctl is-enabled firewalld
    1. 重启加载防火墙（以 root       身份输入以下命令，重新加载防火墙，并不中断用户连接，即不丢失状态信息：)
+ [root@zcwyou  ~]# firewall-cmd --reload
    1. 完全重启防火墙 (以 root       身份输入以下命令，重新加载防火墙并中断用户连接，即丢弃状态信息：)
+ [root@zcwyou  ~]# firewall-cmd --complete-reload
    - 注意:通常在防火墙出现严重问题时，这个命令才会被使用。比如，防火墙规则是正确的，但却出现状态信息问题和无法建立连接。
+ firewall-cmd  --reload与firewall-cmd --complete-reload两者的区别就是：
+ 第一个无需断开连接，就是firewalld特性之一动态添加规则，第二个需要断开连接，类似重启服务
    1. 显示默认区域
+ [root@zcwyou  ~]# firewall-cmd --get-default-zone
    1. 添加接口到区域（将接口添加到XX区域,如果不指定区域,则添加到默认区域）
+ [root@zcwyou  ~]# firewall-cmd --zone=XX --add-interface=eth0
    - 永久生效再加上--permanent 然后reload防火墙
    1. 设置默认区域，立即生效无需重启
+ [root@zcwyou  ~]# firewall-cmd --set-default-zone=XX
    1. 查看XX区域打开的端口
+ [root@zcwyou  ~]# firewall-cmd --zone=XX --list-ports
    1. 查看XX区域加载的服务
+ [root@zcwyou  ~]# firewall-cmd --zone=XX --list-services
    1. 临时加一个端口到XX区域
+ [root@zcwyou  ~]# firewall-cmd --zone=XX --add-port=8080/tcp
    - 若要永久生效方法加参数--permanent
    1. 打开一个服务，类似于将端口可视化，服务需要在配置文件中添加，/etc/firewalld       目录下有services文件夹，查看其它的xml文件以及参考前面说方法
+ [root@zcwyou  ~]# firewall-cmd --zone=work --add-service=smtp
    1. 移除服务
+ [root@zcwyou  ~]# firewall-cmd --zone=work --remove-service=smtp
    1. 显示支持的区域列表
+ [root@zcwyou  ~]# firewall-cmd --get-zones
    1. 列出全部区域启用的特性
+ [root@zcwyou  ~]# firewall-cmd --list-all-zones
    1. 显示XX区域详情
+ [root@zcwyou  ~]# firewall-cmd --zone=XX --list-all
    1. 查看当前活跃区域
+ [root@zcwyou  ~]# firewall-cmd --get-active-zones
    1. 设置XX接口所属区域
+ [root@zcwyou  ~]# firewall-cmd --get-zone-of-interface=XX
    1. 查询YY区域中是否包含XX接口
+ [root@zcwyou  ~]# firewall-cmd --zone=YY --query-interface=XX
    1. 删除指定XX网卡所在的zone(以YY为例)
+ [root@zcwyou  ~]# firewall-cmd --zone=YY --remove-interface=XX
    1. 临时修改XX接口为YY区域(永久修改加参数--permanent）
+ [root@zcwyou ~]# firewall-cmd --zone=YY --change-interface=XX 
+  


