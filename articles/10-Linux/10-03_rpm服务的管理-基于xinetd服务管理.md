# rpm服务的管理-基于xinetd服务管理

> 分类：Linux / 第10章：服务管理
> 原文：https://www.cuiliangblog.cn/detail/section/31508435
> 来源：崔亮的博客

---

# 一、安装xinetd与telnet
[root@localhost ~]# yum -y install xinetd

[root@localhost ~]# yum -y install telnet-server

# 二、xinetd服务的启动
[root@localhost ~]# vi /etc/xinetd.d/telnet

service telnet ß服务的名称为telnet

{

flags = REUSE ß标志为REUSE，设定TCP/IP socket可重用

socket_type = stream ß使用TCP协议数据包

wait = no ß允许多个连接同时连接

user = root ß启动服务的用户为root

server = /usr/sbin/in.telnetd ß服务的启动程序

log_on_failure += USERID ß登陆失败后，记录用户的ID

disable = no ß服务不启动

}

重启xinetd服务

[root@localhost ~]# service xinetd restart

# 三、xinetd服务的自启动
1. [root@localhost ~]#      chkconfig telnet on
2. ntsysv

 


