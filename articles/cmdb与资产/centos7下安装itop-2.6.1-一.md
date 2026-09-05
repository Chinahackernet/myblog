## 一、 iTop概述

      iTop，是IT运营门户（IT Operation Portal）的简称，它是一个开源web应用程序，适用于IT服务的日常运维管理。它基于ITIL最佳实践，适应符合ITIL最佳实践的流程，同时它又很灵活，可以适应一般的IT服务管理流程。

      iTop的核心是CMDB，即配置管理数据库（Configuration Management Data Base）。CMDB是iTop最早开发的部分。以CMDB为中心的设计理念，需要保证CMDB的准确性和及时更新，服务人员和客户均使用iTop来解决运维管理中的各类问题将会对这一点有帮助。此外，CMDB与其它工具，如监控系统、报表工具、库存管理系统等整合得越多，CMDB的信息就会越丰富。CMDB快速实施，与其它系统相比iTop有丰富的CMDB接口，支持多种方式的数据导入。

  

   iTop基于Apache/IIS、MySQL和PHP，它可以在任何支持这些程序的操作系统上运行，如Windows、Linux（Debian、Ubuntu和Redhat）、Solaris和MacOS X等。此外，由于iTop是基于B/S架构的应用程序，不需要在用户电脑上部署任何客户端，只需要一个简单的Web浏览器（IE 8+、Firefox 3.5+、Chrome或Safari 5+）即可使用。

iTop架构图

![](assets/cmdb与资产/centos7下安装itop-2.6.1-一/centos7下安装itop-2.6.1-一-1.jpeg)

iTop的管理界面

  
![](assets/cmdb与资产/centos7下安装itop-2.6.1-一/centos7下安装itop-2.6.1-一-2.png)

## 二、安装iTop

环境说明 ：

  

iTop 2.5只支持PHP5.6以上版本，本例安装的是php72w版本

  

### 1、下载链接：

  

 2.5.1版本：[https://jaist.dl.sourceforge.net/project/itop/itop/2.5.1/iTop-2.5.1-4123.zip](https://jaist.dl.sourceforge.net/project/itop/itop/2.5.1/iTop-2.5.1-4123.zip) 这里找到一个汉化比较全的包：[https://pan.baidu.com/s/1u-UEJC84Xm2svKdNcSf0iQ](https://pan.baidu.com/s/1u-UEJC84Xm2svKdNcSf0iQ) 安装完成后替换掉/env-production/dictionaries/zh-cn.dict.php

 2.6.0版本：[https://nchc.dl.sourceforge.net/project/itop/itop/2.6.0/iTop-2.6.0-4294.zip](https://nchc.dl.sourceforge.net/project/itop/itop/2.6.0/iTop-2.6.0-4294.zip) 中文比较全，不需要换字典

 2.6.1版本：[https://jaist.dl.sourceforge.net/project/itop/itop/2.6.1/iTop-2.6.1-4463.zip](https://jaist.dl.sourceforge.net/project/itop/itop/2.6.1/iTop-2.6.1-4463.zip) 中文比较全，不需要换字典

### 2、安装lamp及相关组件

```plain
[root@tencent ~]# yum -y install epel-release
[root@tencent ~]# rpm -Uvh https://mirror.webtatic.com/yum/el7/webtatic-release.rpm
[root@tencent ~]# yum -y install httpd graphviz unzip mod_ssl php72w php72w-gd php72w-mysql php72w-imap php72w-soap php72w-ldap php72w-mbstring php72w-pecl-zendopcache php72w-xml php72w-cli
```

### 3、开启防火墙、关闭SELinux

```plain

[root@tencent ~]# firewall-cmd --permanent --add-service=http
[root@tencent ~]# firewall-cmd --permanent --add-service=https
[root@tencent ~]# firewall-cmd --reload
[root@tencent ~]# vi /etc/selinux/config    #修改为SELINUX=disabled，重启后生效
SELINUX=disabled
```

### 4、创建PHP会话目录，配置目录权限

```plain
[root@tencent ~]# mkdir -p /var/lib/php/session
[root@tencent ~]# chown apache:apache -R /var/lib/php/session/
```

-   启动httpd服务

```plain
[root@tencent ~]# systemctl start httpd
[root@tencent ~]# systemctl enable httpd
```

### 5、安装mariadb数据库

-   添加mariadb10.2的国内yum源

```plain
[root@tencent ~]# vim  /etc/yum.repos.d/Mariadb.repo
[mariadb]
name = MariaDB
baseurl = https://mirrors.ustc.edu.cn/mariadb/yum/10.2/centos7-amd64
gpgkey=https://mirrors.ustc.edu.cn/mariadb/yum/RPM-GPG-KEY-MariaDB
gpgcheck=1
```

-   **安装mariadb10.2**

```plain
[root@tencent ~]# yum install MariaDB-server MariaDB-client -y
[root@tencent ~]# systemctl start mariadb.service
[root@tencent ~]# systemctl enable mariadb.service
```

-   **mariadb的初始化**

```plain
[root@tencent ~]# /usr/bin/mysql_secure_installation
Enter current password for root (enter for none): Just press the Enter button
Set root password? [Y/n]: Y
New password: your-MariaDB-root-password
Re-enter new password: your-MariaDB-root-password
Remove anonymous users? [Y/n]: Y
Disallow root login remotely? [Y/n]: n
Remove test database and access to it? [Y/n]: Y
Reload privilege tables now? [Y/n]: Y
```

### 6、创建数据库、创建库用户、用户授权、修改数据配置

```plain
[root@tencent ~]# mysql -u root -p
Enter password: 
Welcome to the MySQL monitor.  Commands end with ; or \g.
Your MySQL connection id is 14
Server version: 5.6.41 Source distribution
 
Copyright (c) 2000, 2018, Oracle and/or its affiliates. All rights reserved.
 
Oracle is a registered trademark of Oracle Corporation and/or its
affiliates. Other names may be trademarks of their respective
owners.
 
Type 'help;' or '\h' for help. Type '\c' to clear the current input statement.
 
mysql> create database itop DEFAULT CHARACTER SET utf8;
mysql> create user itop@localhost identified by 'itopasswd';
mysql> grant all privileges on *.* to itop@'localhost' identified by 'itopasswd';
mysql> flush privileges;
mysql> exit
```

### 7、上传iTop网站程序 /var/www/iTop目录(可以通过xftp或者直接在此目录wget)

```plain

[root@tencent ~]# wget https://nchc.dl.sourceforge.net/project/itop/itop/2.6.1/iTop-2.6.1-4463.zip
[root@tencent ~]# mkdir -p /var/www/html/{conf,data,log,env-production}
[root@tencent ~]# chown -R apache:apache /var/www/html
[root@tencent ~]# cd /var/www/html
[root@tencent html]# unzip /root/iTop-2.6.1-4463.zip
```

### 8、WEB安装过程

浏览器打开 [http://](http://ip/setup/)[你的IP/web/setup/index.php](https://192.168.91.225/ossim/web/setup/index.php)

![](assets/cmdb与资产/centos7下安装itop-2.6.1-一/centos7下安装itop-2.6.1-一-3.png)

此时需要对增加权限

```plain
[root@tencent html]# chmod 777 web/
[root@tencent html]# chmod 777 web/log/
[root@tencent html]# chmod 777 web/data/
```

然后刷新浏览器

![](assets/cmdb与资产/centos7下安装itop-2.6.1-一/centos7下安装itop-2.6.1-一-4.png)

点击安装模式，全新安装还是升级安装

  
![](assets/cmdb与资产/centos7下安装itop-2.6.1-一/centos7下安装itop-2.6.1-一-5.png)

接受Licenses

  
![](assets/cmdb与资产/centos7下安装itop-2.6.1-一/centos7下安装itop-2.6.1-一-6.png)

配置数据库，选择使用现有数据库itop

  
![](assets/cmdb与资产/centos7下安装itop-2.6.1-一/centos7下安装itop-2.6.1-一-7.png)

设置管理员密码

  
![](assets/cmdb与资产/centos7下安装itop-2.6.1-一/centos7下安装itop-2.6.1-一-8.png)

设置URL和安装模式

  
![](assets/cmdb与资产/centos7下安装itop-2.6.1-一/centos7下安装itop-2.6.1-一-9.png)

![](assets/cmdb与资产/centos7下安装itop-2.6.1-一/centos7下安装itop-2.6.1-一-10.png)

![](assets/cmdb与资产/centos7下安装itop-2.6.1-一/centos7下安装itop-2.6.1-一-11.png)

![](assets/cmdb与资产/centos7下安装itop-2.6.1-一/centos7下安装itop-2.6.1-一-12.png)

![](assets/cmdb与资产/centos7下安装itop-2.6.1-一/centos7下安装itop-2.6.1-一-13.png)

![](assets/cmdb与资产/centos7下安装itop-2.6.1-一/centos7下安装itop-2.6.1-一-14.png)

![](assets/cmdb与资产/centos7下安装itop-2.6.1-一/centos7下安装itop-2.6.1-一-15.png)

![](assets/cmdb与资产/centos7下安装itop-2.6.1-一/centos7下安装itop-2.6.1-一-16.png)

![](assets/cmdb与资产/centos7下安装itop-2.6.1-一/centos7下安装itop-2.6.1-一-17.png)

![](assets/cmdb与资产/centos7下安装itop-2.6.1-一/centos7下安装itop-2.6.1-一-18.png)