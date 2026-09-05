> 温故而知新，每次学习都有不一样的收获，今天就来爬爬keepalived的坑。

# 一、Keepalived介绍

> 摘抄自官网的介绍：
> 
> Keepalived is a routing software written in C.
> 
> The main goal of this project is to provide simple and robust facilities for loadbalancing and high-availability to Linux system and Linux based infrastructures.
> 
> 项目地址：https://github.com/acassen/keepalived

Keepalived的作用是检测服务器状态，如果一台服务器宕机或者出现其他故障导致当前服务器不可用，keep alived就会检测到并将故障的服务器从系统中剔除，同时使用备用服务器替代该服务器的工作，当服务器工作正常后Keepalived自动将服务器加入到服务器群中，这些工作全部自动完成，不需要人工干涉，需要人工做的只是修复故障的服务器。

Keepalived软件起初是专为LVS负载均衡软件设计的，用来管理并监控LVS集群系统中各个服务节点的状态，后来又加入了可以实现高可用的VRRP功能。因此，Keepalived除了能够管理LVS软件外，还可以作为其他服务（例如：Nginx、Haproxy、MySQL等）的高可用解决方案软件。

Keepalived软件主要是通过VRRP协议实现高可用功能的。VRRP是Virtual Router RedundancyProtocol(虚拟路由器冗余协议）的缩写，VRRP出现的目的就是为了解决静态路由单点故障问题的，它能够保证当个别节点宕机时，整个网络可以不间断地运行。

所以，Keepalived 一方面具有配置管理LVS的功能，同时还具有对LVS下面节点进行健康检查的功能，另一方面也可实现系统网络服务的高可用功能。

# 二、Keepalived的应用场景

-   管理LVS软件
-   基于VRRP实现高可用
-   健康检查，故障切换

通过官网的介绍我们可以看到Keepalived提供了两个重要的功能：loadbalancing和high-availability。最初是专门为LVS负载均衡软件设计，可以用来管理并监控LVS集群系统中各个服务节点的状态，后来的版本中又加入了可以实现高可用的VRRP功能。

因此，Keeaplived主要有两种应用场景，一个是通过配置keepalived结合ipvs做到负载均衡（LVS+Keepalived）；另一个是通过自身健康检查、资源接管等功能做高可用（双机热备），实现故障转移，功能近似于Heartbeat。

目前全球监控的分布式MySQL集群，使用了Keeaplived来实现proxy的双机热备功能，所以下面只介绍在高可用场景下的相关知识。

# 三、Keepalived的工作原理

## 1 VRRP协议

keepalived是以VRRP协议为实现基础的，VRRP全称Virtual Router Redundancy Protocol，即虚拟路由冗余协议，可以认为是实现路由器高可用的协议。

-   VRRP是用来实现路由器冗余的协议。
-   VRRP协议是为了消除在静态缺省路由环境下路由器单点故障引起的网络失效而设计的主备模式的协议，使得发生故障而进行设计设备功能切换时可以不影响内外数据通信，不需要再修改内部网络的网络参数。
-   VRRP协议需要具有IP备份，优先路由选择，减少不必要的路由器通信等功能。
-   VRRP协议将两台或多台路由器设备虚拟成一个设备，对外提供虚拟路由器IP（一个或多个）。然而，在路由器组内部，如果实际拥有这个对外IP的路由器如果工作正常的话，就是master，或者是通过算法选举产生的，MASTER实现针对虚拟路由器IP的各种网络功能，如ARP请求，ICMP，以及数据的转发等，其他设备不具有该IP，状态是BACKUP。除了接收MASTER的VRRP状态通告信息外，不执行对外的网络功能，当主机失效时，BACKUP将接管原先MASTER的网络功能。
-   VRRP协议配置时，需要配置每个路由器的虚拟路由ID(VRID)和优先权值，使用VRID将路由器进行分组，具有相同VRID值的路由器为同一个组，VRID是一个0-255的整整数；同一个组中的路由器通过使用优先权值来选举MASTER。优先权大者为MASTER，优先权也是一个0-255的正整数。

对应到高可用的场景，实际上就是把路由器换成了服务器或者服务器上的应用：

通常情况下是将两台linux服务器组成一个热备组（master-backup），同一时间热备组内只有一台主服务器（master）提供服务，同时master会虚拟出一个共用IP地址（VIP），这个VIP只存在master上并对外提供服务。

如果keepalived检测到master宕机或服务故障，备服务器（backup）会自动接管VIP成为master，keepalived并将master从热备组移除，当master恢复后，会自动加入到热备组，默认再抢占成为master，起到故障转移功能。

## 2 核心组件

![image.png](assets/集群与流量治理/Keepalived的原理和web服务高可用实践/Keepalived的原理和web服务高可用实践-1.png)

keepalived是模块化设计，不同模块负责不同的功能，主要有三个模块，分别是core、check和VRRP，其中：

-   \*\*core模块：\*\*为keepalived的核心组件，负责主进程的启动、维护以及全局配置文件的加载和解析；
-   \*\*check：\*\*负责健康检查，包括常见的各种检查方式，这里的配置决定了工作在哪个层；
-   \*\*VRRP模块：\*\*是来实现VRRP协议的。

此外还有：

-   system call：系统调用
-   watch dog：监控check和vrrp进程的看管者
-   libipfwc：iptables(ipchains)库，配置LVS会用到
-   libipvs\*：配置LVS会用到

## 3 分层工作

keepalived做负载均衡时工作在TCP/IP协议的3/4/5层，做高可用时工作在OSI七层协议模型的3/4/7层，基本上是一样的，叫法不同而已

<table data-lake-id="fQpwc" id="fQpwc" class="lake-table" style="width: 750px"><colgroup><col width="250"><col width="250"><col width="250"></colgroup><tbody><tr data-lake-id="u1cf07427" id="u1cf07427"><td data-lake-id="ubab3d8e9" id="ubab3d8e9" style="background-color: rgb(240, 240, 240)"><p data-lake-id="u5e416819" id="u5e416819" style="text-align: left"><span data-lake-id="u046ce91b" id="u046ce91b" class="lake-fontsize-11" style="color: rgb(63, 63, 63)">分层</span></p></td><td data-lake-id="uf077628e" id="uf077628e" style="background-color: rgb(240, 240, 240)"><p data-lake-id="uf0d8a1f0" id="uf0d8a1f0" style="text-align: left"><span data-lake-id="u8347f4d1" id="u8347f4d1" class="lake-fontsize-11" style="color: rgb(63, 63, 63)">功能</span></p></td><td data-lake-id="u55693c21" id="u55693c21" style="background-color: rgb(240, 240, 240)"><p data-lake-id="u65cdc573" id="u65cdc573" style="text-align: left"><span data-lake-id="u93f17041" id="u93f17041" class="lake-fontsize-11" style="color: rgb(63, 63, 63)">相关协议</span></p></td></tr><tr data-lake-id="ufc8c1672" id="ufc8c1672"><td data-lake-id="u2f56bfde" id="u2f56bfde"><p data-lake-id="uea6f6de8" id="uea6f6de8" style="text-align: left"><span data-lake-id="ufce291c1" id="ufce291c1" class="lake-fontsize-11" style="color: rgb(63, 63, 63)">应用层</span></p></td><td data-lake-id="u61529221" id="u61529221"><p data-lake-id="ufb8b9012" id="ufb8b9012" style="text-align: left"><span data-lake-id="u08814594" id="u08814594" class="lake-fontsize-11" style="color: rgb(63, 63, 63)">网络服务和最终用户的一个接口</span></p></td><td data-lake-id="u2177889f" id="u2177889f"><p data-lake-id="u19c34fd3" id="u19c34fd3" style="text-align: left"><span data-lake-id="u253b8291" id="u253b8291" class="lake-fontsize-11" style="color: rgb(63, 63, 63)">TFTP,HTTP,SNMP,DNS,FTP,SMTP,TELNET</span></p></td></tr><tr data-lake-id="u60791ac8" id="u60791ac8"><td data-lake-id="u5d50adef" id="u5d50adef" style="background-color: rgb(248, 248, 248)"><p data-lake-id="uad306c40" id="uad306c40" style="text-align: left"><span data-lake-id="ud6027075" id="ud6027075" class="lake-fontsize-11" style="color: rgb(63, 63, 63)">表示层</span></p></td><td data-lake-id="u3b9bf565" id="u3b9bf565" style="background-color: rgb(248, 248, 248)"><p data-lake-id="u6c14183f" id="u6c14183f" style="text-align: left"><span data-lake-id="u92292c71" id="u92292c71" class="lake-fontsize-11" style="color: rgb(63, 63, 63)">数据的表示、安全、压缩</span></p></td><td data-lake-id="ua38b3e7f" id="ua38b3e7f" style="background-color: rgb(248, 248, 248)"><p data-lake-id="u33172e3d" id="u33172e3d" style="text-align: left"><span data-lake-id="u0d287fe7" id="u0d287fe7" class="lake-fontsize-11" style="color: rgb(63, 63, 63)">无协议</span></p></td></tr><tr data-lake-id="uaf40da33" id="uaf40da33"><td data-lake-id="u1dee37f9" id="u1dee37f9"><p data-lake-id="u6cfb9ae5" id="u6cfb9ae5" style="text-align: left"><span data-lake-id="ud5ab1646" id="ud5ab1646" class="lake-fontsize-11" style="color: rgb(63, 63, 63)">会话层</span></p></td><td data-lake-id="u64113847" id="u64113847"><p data-lake-id="uc59ebf8a" id="uc59ebf8a" style="text-align: left"><span data-lake-id="u7a94309b" id="u7a94309b" class="lake-fontsize-11" style="color: rgb(63, 63, 63)">会话的建立、管理、中止</span></p></td><td data-lake-id="u3063e403" id="u3063e403"><p data-lake-id="u48553f06" id="u48553f06" style="text-align: left"><span data-lake-id="ubb1953e0" id="ubb1953e0" class="lake-fontsize-11" style="color: rgb(63, 63, 63)">无协议</span></p></td></tr><tr data-lake-id="u50fe7434" id="u50fe7434"><td data-lake-id="u1c1631a3" id="u1c1631a3" style="background-color: rgb(248, 248, 248)"><p data-lake-id="u538388bd" id="u538388bd" style="text-align: left"><span data-lake-id="u1b70c4d2" id="u1b70c4d2" class="lake-fontsize-11" style="color: rgb(63, 63, 63)">传输层</span></p></td><td data-lake-id="u74a06db2" id="u74a06db2" style="background-color: rgb(248, 248, 248)"><p data-lake-id="ucc02615c" id="ucc02615c" style="text-align: left"><span data-lake-id="u6b807853" id="u6b807853" class="lake-fontsize-11" style="color: rgb(63, 63, 63)">定义传输数据的协议端口号，以及流控和差错校验</span></p></td><td data-lake-id="u8b403945" id="u8b403945" style="background-color: rgb(248, 248, 248)"><p data-lake-id="ucd0ec3aa" id="ucd0ec3aa" style="text-align: left"><span data-lake-id="u1d2c288b" id="u1d2c288b" class="lake-fontsize-11" style="color: rgb(63, 63, 63)">TCP,UDP</span></p></td></tr><tr data-lake-id="u05c52850" id="u05c52850"><td data-lake-id="u2ce067a5" id="u2ce067a5"><p data-lake-id="u9733655b" id="u9733655b" style="text-align: left"><span data-lake-id="u490f4b03" id="u490f4b03" class="lake-fontsize-11" style="color: rgb(63, 63, 63)">网络层</span></p></td><td data-lake-id="u459e2dce" id="u459e2dce"><p data-lake-id="u78eba7ec" id="u78eba7ec" style="text-align: left"><span data-lake-id="u6a91892a" id="u6a91892a" class="lake-fontsize-11" style="color: rgb(63, 63, 63)">进行逻辑地址寻址，实现不同网络之间的路径选择</span></p></td><td data-lake-id="udf6c58aa" id="udf6c58aa"><p data-lake-id="u2b372d4a" id="u2b372d4a" style="text-align: left"><span data-lake-id="u504ececd" id="u504ececd" class="lake-fontsize-11" style="color: rgb(63, 63, 63)">IP,ICMP,RIP,OSPF,BGP,IGMP</span></p></td></tr><tr data-lake-id="u62634a1a" id="u62634a1a"><td data-lake-id="uf88cbd8b" id="uf88cbd8b" style="background-color: rgb(248, 248, 248)"><p data-lake-id="ubbd961a6" id="ubbd961a6" style="text-align: left"><span data-lake-id="u8684d653" id="u8684d653" class="lake-fontsize-11" style="color: rgb(63, 63, 63)">数据链路层</span></p></td><td data-lake-id="uc370baa8" id="uc370baa8" style="background-color: rgb(248, 248, 248)"><p data-lake-id="u0cce20d8" id="u0cce20d8" style="text-align: left"><span data-lake-id="ubf0b8e77" id="ubf0b8e77" class="lake-fontsize-11" style="color: rgb(63, 63, 63)">建立逻辑连接、硬件地址寻址、差错校验等功能</span></p></td><td data-lake-id="uc49b5646" id="uc49b5646" style="background-color: rgb(248, 248, 248)"><p data-lake-id="u87e03682" id="u87e03682" style="text-align: left"><span data-lake-id="u0829cf12" id="u0829cf12" class="lake-fontsize-11" style="color: rgb(63, 63, 63)">SLIP,CSLIP,PPP,ARP,RARP,MTU</span></p></td></tr><tr data-lake-id="ufd6fc137" id="ufd6fc137"><td data-lake-id="ua9cb68e9" id="ua9cb68e9"><p data-lake-id="u3561c28d" id="u3561c28d" style="text-align: left"><span data-lake-id="uf83f58ba" id="uf83f58ba" class="lake-fontsize-11" style="color: rgb(63, 63, 63)">物理层</span></p></td><td data-lake-id="u8d7b7b53" id="u8d7b7b53"><p data-lake-id="uda99a76e" id="uda99a76e" style="text-align: left"><span data-lake-id="ud6992871" id="ud6992871" class="lake-fontsize-11" style="color: rgb(63, 63, 63)">建立、连接、断开物理连接</span></p></td><td data-lake-id="uf4d1c5dd" id="uf4d1c5dd"><p data-lake-id="uf4766d4a" id="uf4766d4a" style="text-align: left"><span data-lake-id="u32bc7a6b" id="u32bc7a6b" class="lake-fontsize-11" style="color: rgb(63, 63, 63)">ISO2110,IEEE802,IEEE802.2</span></p></td></tr></tbody></table>

具体工作在哪一层的区别就在于用什么样的网络协议来进行健康检查：

**Layer3：****工作在三层时，keepalived会定期向热备组中的服务器发送一个****ICMP**数据包，来判断某台服务器是否故障，如果没有响应则将这台服务器从热备组移除。

**Layer4：****工作在四层时，keepalived以****TCP**端口的状态判断服务器是否故障，比如检测MySQL的3306端口，如果无法访问则将这台服务器从热备组移除。

**Layer7：****工作在七层时，keepalived根据用户设定的策略判断服务器上的程序是否正常运行，比如使用****HTTP**请求的方式，如果返回错误的状态码则将这台服务器从热备组移除。

在Keepalived服务器群之间，只有作为主的服务器不断发送VRRP广播包，告诉备它还活着，此时备不会抢占主，只有当主不可用，既备接受不到主的VRRP广播包，这时候备就会启动相关的服务接管主的任务向外提供服务，以保证服务的正常使用。

## 4 工作状态

keepalived正常启动的时候，共启动3个进程：

一个是父进程，负责监控其子进程；一个是VRRP子进程，另外一个是checkers子进程；

两个子进程都被系统watchlog看管，Healthcheck子进程检查各自服务器的健康状况。

如果healthchecks进程检查到master上服务不可用了，就会通知本机上的VRRP子进程，让他删除通告，并且去掉虚拟IP，转换为BACKUP状态。

生产服务器上的keepalived进程：

# 四、Keepalived使用

## 1 配置介绍

keepalived配置文件按**层级**和**模块**划分的，每层由"{ }"来界定。在主配置文件中可以通过**include**来涵盖多个子配置文件。

详细语法说明：官方文档

配置文件包括以下几个模块：

-   LOBAL CONFIGURATION
-   BFD CONFIGURATION
-   VRRPD CONFIGURATION
-   LVS CONFIGURATION

```yaml
[root@localhost ~]# cat /etc/keepalived/keepalived.conf
! Configuration File for keepalived
global_defs {                                     #全局定义部分
    notification_email {                          #设置报警邮件地址，可设置多个
        acassen@firewall.loc                      #接收通知的邮件地址
    }
    notification_email_from test0@163.com         #设置 发送邮件通知的地址
    smtp_server smtp.163.com                      #设置 smtp server 地址，可是ip或域名.可选端口号 （默认25）
    smtp_connect_timeout 30                       #设置 连接 smtp server的超时时间
    router_id LVS_DEVEL                           #主机标识，用于邮件通知
    vrrp_skip_check_adv_addr
    vrrp_strict                                   #严格执行VRRP协议规范，此模式不支持节点单播
    vrrp_garp_interval 0
    vrrp_gna_interval 0
    script_user keepalived_script                 #指定运行脚本的用户名和组。默认使用用户的默认组。如未指定，默认为keepalived_script 用户，如无此用户，则使用root
    enable_script_security                        #如过路径为非root可写，不要配置脚本为root用户执行。
}
 
vrrp_instance VI_1 {                              #vrrp 实例部分定义，VI_1自定义名称
    state MASTER                                  #指定 keepalived 的角色，必须大写 可选值：MASTER|BACKUP
    interface ens33                               #网卡设置，lvs需要绑定在网卡上，realserver绑定在回环口。区别：lvs对访问为外，realserver为内不易暴露本机信息
    virtual_router_id 51                          #虚拟路由标识，是一个数字，同一个vrrp 实例使用唯一的标识，MASTER和BACKUP 的 同一个 vrrp_instance 下 这个标识必须保持一致
    priority 100                                  #定义优先级，数字越大，优先级越高。
    advert_int 1                                  #设定 MASTER 与 BACKUP 负载均衡之间同步检查的时间间隔，单位为秒，两个节点设置必须一样
    authentication {                              #设置验证类型和密码，两个节点必须一致
        auth_type PASS
        auth_pass 1111
    }
    virtual_ipaddress {                           #设置虚拟IP地址，可以设置多个虚拟IP地址，每行一个
        192.168.119.130
    }
    track_script {                                #脚本监控状态
        chk_nginx_service                         #可加权重，但会覆盖声明的脚本权重值。chk_nginx_service weight -20
    }
        notify_master "/etc/keepalived/start_haproxy.sh start"  #当前节点成为master时，通知脚本执行任务
        notify_backup "/etc/keepalived/start_haproxy.sh stop"   #当前节点成为backup时，通知脚本执行任务
        notify_fault  "/etc/keepalived/start_haproxy.sh stop"   #当当前节点出现故障，执行的任务;
}
 
virtual_server 192.168.119.130 80  {          #定义RealServer对应的VIP及服务端口，IP和端口之间用空格隔开
    delay_loop 6                              #每隔6秒查询realserver状态
    lb_algo rr                                #后端调试算法（load balancing algorithm）
    lb_kind DR                                #LVS调度类型NAT/DR/TUN
    #persistence_timeout 60                   同一IP的连接60秒内被分配到同一台realserver
    protocol TCP                              #用TCP协议检查realserver状态
    real_server 192.168.119.120 80 {
        weight 1                              #权重，最大越高，lvs就越优先访问
        TCP_CHECK {                           #keepalived的健康检查方式HTTP_GET | SSL_GET | TCP_CHECK | SMTP_CHECK | MISC
            connect_timeout 10                #10秒无响应超时
            retry 3                           #重连次数3次
            delay_before_retry 3              #重连间隔时间
            connect_port 80                   #健康检查realserver的端口
        }
    }
}
}
```

​  

## 2 使用keepalived对nginx进行高可用搭建

### 2.1 环境准备

<table data-lake-id="mlalH" id="mlalH" class="lake-table" style="width: 750px"><colgroup><col width="250"><col width="250"><col width="250"></colgroup><tbody><tr data-lake-id="u899af51e" id="u899af51e"><td data-lake-id="u5674b626" id="u5674b626" style="background-color: rgb(240, 240, 240)"><p data-lake-id="ucfae36e9" id="ucfae36e9" style="text-align: left"><span data-lake-id="u91cab2ca" id="u91cab2ca" class="lake-fontsize-11" style="color: rgb(63, 63, 63)">主机ip</span></p></td><td data-lake-id="u8e3ea2ab" id="u8e3ea2ab" style="background-color: rgb(240, 240, 240)"><p data-lake-id="ubc4370e9" id="ubc4370e9" style="text-align: left"><span data-lake-id="u6307ed34" id="u6307ed34" class="lake-fontsize-11" style="color: rgb(63, 63, 63)">角色</span></p></td><td data-lake-id="ua2808c8e" id="ua2808c8e" style="background-color: rgb(240, 240, 240)"><p data-lake-id="u77b005ca" id="u77b005ca" style="text-align: left"><span data-lake-id="ua48e71e1" id="ua48e71e1" class="lake-fontsize-11" style="color: rgb(63, 63, 63)">部署软件</span></p></td></tr><tr data-lake-id="u381da001" id="u381da001"><td data-lake-id="ub272b0fa" id="ub272b0fa"><p data-lake-id="u5077c4da" id="u5077c4da" style="text-align: left"><span data-lake-id="u03a3bab6" id="u03a3bab6" class="lake-fontsize-11" style="color: rgb(63, 63, 63)">192.168.73.135</span></p></td><td data-lake-id="u778f49d1" id="u778f49d1"><p data-lake-id="u14a5b551" id="u14a5b551" style="text-align: left"><span data-lake-id="u437347fd" id="u437347fd" class="lake-fontsize-11" style="color: rgb(63, 63, 63)">master</span></p></td><td data-lake-id="uf6679d6d" id="uf6679d6d"><p data-lake-id="u0f31b105" id="u0f31b105" style="text-align: left"><span data-lake-id="uc7c29b4a" id="uc7c29b4a" class="lake-fontsize-11" style="color: rgb(63, 63, 63)">keepalived、nginx</span></p></td></tr><tr data-lake-id="u378d4098" id="u378d4098"><td data-lake-id="ua29a11cd" id="ua29a11cd" style="background-color: rgb(248, 248, 248)"><p data-lake-id="u75101eee" id="u75101eee" style="text-align: left"><span data-lake-id="u979be19a" id="u979be19a" class="lake-fontsize-11" style="color: rgb(63, 63, 63)">192.168.73.136</span></p></td><td data-lake-id="ud97394a7" id="ud97394a7" style="background-color: rgb(248, 248, 248)"><p data-lake-id="u65b65f56" id="u65b65f56" style="text-align: left"><span data-lake-id="u87d7385c" id="u87d7385c" class="lake-fontsize-11" style="color: rgb(63, 63, 63)">salve</span></p></td><td data-lake-id="u9eca7436" id="u9eca7436" style="background-color: rgb(248, 248, 248)"><p data-lake-id="uf88f744e" id="uf88f744e" style="text-align: left"><span data-lake-id="u3cd31e85" id="u3cd31e85" class="lake-fontsize-11" style="color: rgb(63, 63, 63)">keepalived、nginx</span></p></td></tr><tr data-lake-id="u7b588b5d" id="u7b588b5d"><td data-lake-id="u014b165a" id="u014b165a"><p data-lake-id="ub8136750" id="ub8136750" style="text-align: left"><span data-lake-id="ued77ea50" id="ued77ea50" class="lake-fontsize-11" style="color: rgb(63, 63, 63)">192.168.73.100</span></p></td><td data-lake-id="u08920bb2" id="u08920bb2"><p data-lake-id="ude2a0136" id="ude2a0136" style="text-align: left"><span data-lake-id="uf1fefa13" id="uf1fefa13" class="lake-fontsize-11" style="color: rgb(63, 63, 63)">虚ip</span></p></td><td data-lake-id="u0eba928f" id="u0eba928f"><p data-lake-id="ucd676c96" id="ucd676c96" style="text-align: left"><span data-lake-id="u415a8e77" id="u415a8e77" class="lake-fontsize-11" style="color: rgb(63, 63, 63)"><br /><br /></span></p></td></tr></tbody></table>

### 2.2 nginx软件安装和配置

在192.168.73.136操作为例，135上把index改成135即可

```yaml
[root@localhost ~]# yum -y install nginx
[root@localhost ~]# cd /usr/share/nginx/html/
[root@localhost html]# mv index.html index.html.back
[root@localhost html]# echo "I am 192.168.73.136" > index.html
[root@localhost html]# systemctl start nginx
[root@localhost html]# curl 192.168.73.136
I am 192.168.73.136
```

### 2.3 Keepalived软件安装

```yaml
[root@localhost ~]# yum install keepalived -y
[root@localhost ~]# rpm -ql keepalived
/etc/keepalived
/etc/keepalived/keepalived.conf  # 主配置文件
/etc/sysconfig/keepalived
/usr/bin/genhash
/usr/lib/systemd/system/keepalived.service
/usr/libexec/keepalived
/usr/sbin/keepalived
```

### 2.4 监听存活脚本

```yaml
[root@localhost ~]# vim /etc/keepalived/check_port.sh
#!/bin/bash
#keepalived 监控端口脚本
#使用方法：
#在keepalived的配置文件中
#vrrp_script check_port {#创建一个vrrp_script脚本,检查配置
#    script "/etc/keepalived/check_port.sh 80" #配置监听的端口
#    interval 2 #检查脚本的频率,单位（秒）
#}
CHK_PORT=$1
if [ -n "$CHK_PORT" ];then
        PORT_PROCESS=`ss -lnt|grep $CHK_PORT|wc -l`
        if [ $PORT_PROCESS -eq 0 ];then
                echo "Port $CHK_PORT Is Not Used,End."
                exit 1
        fi
else
        echo "Check Port Cant Be Empty!"
fi
[root@localhost ~]# chmod  +x /etc/keepalived/check_port.sh
```

### 2.5 最终配置文件

（1）Master配置

```yaml
[root@localhost ~]# vim /etc/keepalived/keepalived.conf
! Configuration File for keepalived
global_defs {
   router_id 192.168.73.136
}
vrrp_script chk_nginx {
    script "/etc/keepalived/check_port.sh 80"
    interval 2
    weight -20
}
vrrp_instance VI_1 {
    state MASTER
    interface ens33
    virtual_router_id 251
    priority 100
    advert_int 1
    authentication {
        auth_type PASS
        auth_pass 11111111
    }
    track_script {
         chk_nginx
    }
    virtual_ipaddress {
        192.168.73.100
    }
}

```

（2）Slave配置

```yaml
! Configuration File for keepalived
global_defs {
        router_id 192.168.73.135
}
vrrp_script chk_nginx {
        script "/etc/keepalived/check_port.sh 80"
        interval 2
        weight -20
}
vrrp_instance VI_1 {
        state BACKUP
        interface ens33
        virtual_router_id 251
        priority 90
        advert_int 1
        authentication {
                auth_type PASS
                auth_pass 11111111
        }
        track_script {
                chk_nginx
        }
        virtual_ipaddress {
                192.168.73.100
        }
}
```

### 2.6 启动主从的Keepalived

```yaml
[root@localhost ~]]systemctl start keepalived && systemctl enable keepalive
```

### 2.7 查看VIP是否启动

```yaml
[root@localhost keepalived]# ip addr
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    inet 127.0.0.1/8 scope host lo
       valid_lft forever preferred_lft forever
    inet6 ::1/128 scope host
       valid_lft forever preferred_lft forever
2: ens33: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc pfifo_fast state UP group default qlen 1000
    link/ether 00:0c:29:6f:74:0a brd ff:ff:ff:ff:ff:ff
    inet 192.168.73.136/24 brd 192.168.73.255 scope global noprefixroute ens33
       valid_lft forever preferred_lft forever
    inet 192.168.73.100/32 scope global ens33
       valid_lft forever preferred_lft forever
    inet6 fe80::af0e:a936:d997:18da/64 scope link noprefixroute
       valid_lft forever preferred_lft forever
```

### 2.8 测试

首先在浏览器中访问vip，可以看到我们访问的是BACKUP上的web地址

![image.png](assets/集群与流量治理/Keepalived的原理和web服务高可用实践/Keepalived的原理和web服务高可用实践-2.png)

关掉master上的nginx,查看VIP是否漂移到备机。

```yaml
# 关闭主nginx
[root@localhost ~]# systemctl stop nginx
# 查看备上的IP信息，我们发现vip已经偏移到备机上了
[root@localhost ~]# ip addr
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    inet 127.0.0.1/8 scope host lo
       valid_lft forever preferred_lft forever
    inet6 ::1/128 scope host
       valid_lft forever preferred_lft forever
2: ens33: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc pfifo_fast state UP group default qlen 1000
    link/ether 00:0c:29:6f:74:0a brd ff:ff:ff:ff:ff:ff
    inet 192.168.73.136/24 brd 192.168.73.255 scope global noprefixroute ens33
       valid_lft forever preferred_lft forever
    inet6 fe80::af0e:a936:d997:18da/64 scope link noprefixroute
       valid_lft forever preferred_lft forever
```

在浏览器中访问vip，可以看到我们访问的是master上的web地址

![image.png](assets/集群与流量治理/Keepalived的原理和web服务高可用实践/Keepalived的原理和web服务高可用实践-3.png)

# 五、需要注意的问题：

## 1 脑裂介绍

在高可用系统中，如果两个节点的心跳线断开，本来两个节点为一个整体、动作协调的一个HA系统，现在由于两个之间的心跳线断开导致它们分裂成了两个单独的个体。由于双方互相失去了联系，都会以为对方出了故障。这时候这两个单独的个体就像"脑裂人"一样互相争抢共享资源、争用应用服务，这样就会造成严重问题：

-   共享资源被瓜分，两边服务都起不来；
-   两边服务都起来了，同时提供服务，同时读写存储，导致数据不一致甚至损坏。

### 1.1 产生脑裂的原因

一般来说，脑裂的发生，有以下几种原因：

-   （1）HA服务器之间心跳线故障，导致无法正常通信；
-   （2）HA服务器上开启了防火墙，阻挡了心跳线的信息传输；
-   （3）HA服务器上心跳网卡配置不正确，导致心跳信息发送失败；
-   （4）其他服务器配置不当的原因。比如心跳方式不同，心跳广播冲突，软件BUG等；
-   （5）Keepalived配置里同一 VRRP实例中如果 virtualrouterid两端参数配置不一致也会导致裂脑问题发生。

### 1.2 常见的解决办法

在实际环境中，我们可以从以下几个方面来防止脑裂的问题：

-   （1）同时使用串行线路或者以太网电缆连接，同时使用两条心跳线路，如果一条坏了，另外一条还能正常提供服务；
-   （2）当检测到脑裂时强行关闭一个节点（该功能需要特殊设备支持，如Stonith,feyce），相当于备节点接受不到心跳心跳消患，通过单独的线路发送关机命令关闭主节点的电源；
-   （3）做好脑裂监控报警（用zabbix等来监控），在问题发生时能在第一时间介入仲裁，降低损失。
-   （4）启动磁盘锁。正在服务一方锁住共享磁盘，“裂脑”发生时，让对方完全“抢不走”共享磁盘资源。但使用锁磁盘也会有一个不小的问题，如果占用共享盘的一方不主动“解锁”，另一方就永远得不到共享磁盘。现实中假如服务节点突然死机或崩溃，就不可能执行解锁命令。后备节点也就接管不了共享资源和应用服务。于是有人在HA中设计了“智能”锁。即：正在服务的一方只在发现心跳线全部断开（察觉不到对端）时才启用磁盘锁，平时就不上锁了；
-   （5）加入仲裁机制。例如设置网关IP，当脑裂发生时，两个节点都各自ping以下这个网关IP，不通则表明断点就在本端，不仅“心跳”、还兼对外“服务”的本端网络链路断了，即使启动（或继续）应用服务也没有用了，那就主动放弃竞争，让能够ping通网关IP的一端去起服务。更保险一些，ping不通网关IP的一方干脆就自我重启，以彻底释放有可能还占用着的那些共享资源。

### 1.3 Keepalived监控nginx防止脑裂

（1）执行脚本，用来检测

```yaml
[root@zdd211-11 ~]# vim /etc/keepalived/check_keepalived.sh
#!/bin/bash
NGINX_SBIN="which nginx"
NGINX_PORT=80
function check_nginx(){
     NGINX_STATUS="nmap localhost -p ${NGINX_PORT} | grep "80/tcp open" | awk '{print $2}'"
     NGINX_PROCESS="ps -ef | grep nginx|grep -v grep|wc -l"
}
check_nginx
if [ "$NGINX_STATUS" != "open"  -o  $NGINX_PROCESS -lt 2 ]
then
    ${NGINX_SBIN} -s stop
    ${NGINX_SBIN}
    sleep 3
    check_nginx
    if [ "$NGINX_STATUS" != "open"  -o  $NGINX_PROCESS -lt 2 ];then
        systemctl stop keepalived
    fi
 fi
 [root@localhost ~]# chmod  +x /etc/keepalived/check_port.sh
```

(2)安装nmap

因为上面脚本有用到这个工具，因此两个主机都需要安装

```yaml
[root@localhost ~]# yum install nmap -y

```

(3) 修改master配置

```yaml
[root@localhost ~]# vim /etc/keepalived/keepalived.conf
! Configuration File for keepalived
global_defs {
   router_id 192.168.73.136
}
vrrp_script chk_nginx {
    script "/etc/keepalived/check_port.sh 80"
    interval 2
    weight -20
}
vrrp_script chk_nginx {
    script "/etc/keepalived/check_keepalive.sh" # 脚本路径
    interval 2                                  # 执行时间间隔
    weight -5                                   # 计算权重值，脚本结果导致的优先级变更，检测失败（脚本返回非0）则优先级 -5
    fall 3                                      # 检测连续3次失败才算确定是真失败。会用weight减少优先级（1-255之间）
    rise 2                                      # 检测2次成功就算成功。但不修改优先级
vrrp_instance VI_1 {
    state MASTER
    interface ens33
    virtual_router_id 251
    priority 100
    advert_int 1
    authentication {
        auth_type PASS
        auth_pass 11111111
    }
    track_script {
         chk_nginx
    }
    virtual_ipaddress {
        192.168.73.100
    }
}
```

(4) 修改Slave配置配置

```yaml
! Configuration File for keepalived
global_defs {
        router_id 192.168.73.135
}
vrrp_script chk_nginx {
    script "/etc/keepalived/check_keepalive.sh"
    interval 2                     # 执行时间间隔
    weight -5                      # 计算权重值，脚本结果导致的优先级变更，检测失败（脚本返回非0）则优先级 -5
    fall 3                         # 检测连续3次失败才算确定是真失败。会用weight减少优先级（1-255之间）
    rise 2                         # 检测2次成功就算成功。但不修改优先级
vrrp_instance VI_1 {
        state BACKUP
        interface ens33
        virtual_router_id 251
        priority 90
        advert_int 1
        authentication {
                auth_type PASS
                auth_pass 11111111
        }
        track_script {
                chk_nginx
        }
        virtual_ipaddress {
                192.168.73.100
        }
}

```

  
  

## 2 Keepalived设置故障恢复后不重新抢回VIP

通常生产环境是不允许VIP来回漂移，当主机的业务出问题之后，vip漂移到备机上保证业务不中断，就算故障恢复keepalived也不会把vip切到主机上；需要进行对应的问题问题，确认主机环境没有问题之后手动重启主机上keepalived服务，让vip切回到主机上。

为了满足这样的业务场景，可以使用nopreempt参数，不抢占VIP的机制实现

修改master配置如下

```yaml
[root@localhost ~]# vim /etc/keepalived/keepalived.conf
! Configuration File for keepalived
global_defs {
   router_id 192.168.73.136
}
vrrp_script chk_nginx {
    script "/etc/keepalived/check_keepalive.sh" # 脚本路径
    interval 2                                  # 执行时间间隔
    weight -5                                   # 计算权重值，脚本结果导致的优先级变更，检测失败（脚本返回非0）则优先级 -5
    fall 3                                      # 检测连续3次失败才算确定是真失败。会用weight减少优先级（1-255之间）
    rise 2                                      # 检测2次成功就算成功。但不修改优先级
}
vrrp_instance VI_1 {
    state MASTER
    interface ens33
    virtual_router_id 251
    priority 100
    advert_int 1
    nopreempt    ##不抢VIP 机制
    authentication {
        auth_type PASS
        auth_pass 11111111
    }
    track_script {
         chk_nginx
    }
    virtual_ipaddress {
        192.168.73.100
    }
}
```

  
可以自己重启keepalived，然后停止web，然后再启动web，验证是否能够自动漂移回主机

## 3 组播地址冲突问题

当在同一个局域网内部署了多组keepalived服务器时，可能会发生高可用接管的严重故障问题。

因为keepalived高可用功能是通过VRRP协议实现的，VRRP协议默认通过IP多播的形式实现高可用对之间的通信，如果同一个局域网内存在多组Keepalived服务器对，就会造成IP多播地址冲突问题，导致接管错乱.

不同组的keepalived都会使用默认的224.0.0.18作为多播地址。此时的解决办法是，在同组的keepalived服务器所有的配置文件里指定独一无二的多播地址，配置如下：

```yaml
global_defs
{
  ``router_id LVS_19
  ``vrrp_mcast_group4 224.0.0.19` `#指定多播地址
}
```