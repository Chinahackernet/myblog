# oracle-12c-linux安装

> 分类：Database / 第21章：Oracle
> 原文：https://www.cuiliangblog.cn/detail/section/31467567
> 来源：崔亮的博客

---

### 安装前准备阶段
#### * 修改linux内核参数以适应oracle12c
vi /etc/sysctl.conf

 

fs.aio-max-nr = 1048576

fs.file-max = 6815744

kernel.shmmni = 4096

kernel.sem = 250 32000 100 128

net.ipv4.ip_local_port_range = 9000 65500

net.core.rmem_default = 262144

net.core.rmem_max = 4194304

net.core.wmem_default = 262144

net.core.wmem_max = 1048576

 

 

sysctl -p

 

#### * 修改资源限制
vi /etc/security/limits.conf

 

oracle              soft    nproc   2047

oracle              hard    nproc   16384

oracle              soft    nofile  1024

oracle              hard    nofile  65536

oracle              soft    stack   10240

 

#### * 添加linux用户组
 

groupadd oinstall

groupadd dba

groupadd oper

groupadd backupdba

groupadd dgdba

groupadd kmdba

groupadd asmdba

groupadd racdba

 

#### * 添加用户oracle
useradd -g oinstall -G dba,oper,backupdba,dgdba,kmdba,asmdba,racdba oracle

 

* 给用户oracle设定密码

passwd oracle

 

 

#### * 创建oracle安装目录并授权
mkdir -p /u01/app/oracle

chown oracle:oinstall /u01/app /u01/app/oracle

chmod -R 775 /u01/

 

#### * 切换用户到oracle
su - oracle

 

#### * 修改 vi /home/oracle/.bash_profile
 

# add for oracle12cR2

ORACLE_BASE=/u01/app/oracle

ORACLE_HOME=$ORACLE_BASE/product/12.2.0/dbhome_1

ORACLE_SID=prodsid

ORACLE_UNQNAME=prod

PATH=$ORACLE_HOME/bin:$PATH

export ORACLE_BASE ORACLE_HOME ORACLE_SID ORACLE_UNQNAME PATH

 

NLS_LANG=AMERICAN_AMERICA.AL32UTF8

#NLS_LANG="SIMPLIFIED CHINESE"_CHINA.AL32UTF8

 

export NLS_LANG

export NLS_DATE_FORMAT='YYYY-MM-DD HH24:MI:SS'

export NLS_TIMESTAMP_FORMAT='YYYY-MM-DD HH24:MI:SSXFF'

export NLS_TIMESTAMP_TZ_FORMAT='YYYY-MM-DD HH24:MI:SSXFF TZR'

 

alias sqlplus='rlwrap sqlplus'

alias rman='rlwrap rman'

alias asmcmd='rlwrap asmcmd'

 

#### * 安装缺失软件包
yum install compat-libcap1-*

yum install compat-libstdc++-*

yum install libstdc++-devel-*

yum install gcc-c++-*

yum install libaio-devel-*

yum install ksh*

 

上传rlwrap-0.42-1.el6.i686.rpm到linux服务器/root

yum install /root/rlwrap-0.42-1.el6.i686.rpm 

#### * /etc/hosts文件添加本机静态IP
vi /etc/hosts

192.168.3.88 [hostname]  [hostname].localdomain

 

### 安装ORACLE软件阶段
#### * 安装oracle软件
上传oracle安装介质到oracle用户家目录

解压

export DISPLAY=192.168.3.100:0.0

 

![](assets/07-Database/a16bb2a94285950c7101.png)

 

![](assets/07-Database/afd06da09c5cd93369c6.png)

 

![](assets/07-Database/4f321cf923cdcdc351a9.png)

 

![](assets/07-Database/1d03280ff5661241674b.png)

 

![](assets/07-Database/2f9c4dce468a65cb1a47.png)

 

![](assets/07-Database/fafaa3b144a790bdf93f.png)

 

![](assets/07-Database/c9c481966eade0e4616a.png)

 

![](assets/07-Database/9e64a222dccda136da5a.png)

 

![](assets/07-Database/eb9d529c039808f4838f.png)

 

![](assets/07-Database/8577a68146e4c65b5d04.png)

 

![](assets/07-Database/10ba9d3c0aa6c660d46a.png)

 

![](assets/07-Database/f378b940f52cf1b0d6b5.png)

 

 

### 配置监听器阶段
#### * 配置监听
netca

![](assets/07-Database/829bb2eef2ea65d4be07.png)

![](assets/07-Database/07590e137461ffe4f93b.png)

![](assets/07-Database/ec7aa0a4d69b7a5a6fdc.png)

![](assets/07-Database/a335d32b019aff5c9831.png)

 

![](assets/07-Database/e313327c1b46ce9bc60b.png)

![](assets/07-Database/d889d33b3e1760389be7.png)

![](assets/07-Database/859b3c383b85da70abed.png)

![](assets/07-Database/5c68eefd59afcf9d316e.png)

 

 

### 创建数据库阶段
#### * 创建oracle数据库
dbca

 

![](assets/07-Database/8c783ff5563c7d8db1e2.png)

 

![](assets/07-Database/570d8b64a11c33011d0e.png)

 

![](assets/07-Database/6f8aab9b2ddc1335f25f.png)

 

![](assets/07-Database/28eba1c27f6b3c1874d8.png)

 

![](assets/07-Database/2b7a39e179630cb77a87.png)

 

![](assets/07-Database/b4b1590d38b7237401fe.png)

 

![](assets/07-Database/7f84748a3c264bea958f.png)

 

![](assets/07-Database/e8e3fe837b056e47c151.png)

 

![](assets/07-Database/4d97cf4442e2c97276da.png)

 

![](assets/07-Database/ff3ff8f81c55b0f1dc4d.png)

 

![](assets/07-Database/b315b3da7d97ae194170.png)

 

![](assets/07-Database/58e2a517d745d62942dd.png)

 

![](assets/07-Database/c958bb0314e119f5759d.png)

 

![](assets/07-Database/1ba46f2aecf00596f793.png)

 

![](assets/07-Database/f888e88245ddb262fb63.png)

 

![](assets/07-Database/5dc076dfb293f081d793.png)

 

![](assets/07-Database/80cc7d5c265750fe9775.png)

 

### 安装后检验阶段
#### * 修改$ORACLE_HOME/sqlplus/admin/glogin.sql，方便sqlplus使用
define _editor=vi

set linesize 220

set pagesize 50

set sqlprompt "_user'@'_connect_identifier>"

 

#### * 用sqlplus连接数据库实例
[oracle@offcn ~]$ sqlplus / as sysdba

![](assets/07-Database/9f53c836ba339ab58720.png)

 

#### * 查看监听器状态
[oracle@offcn ~]$ lsnrctl status

![](assets/07-Database/2bb0b7a3493f995c966d.png)

#### * 查看用户状态
![](assets/07-Database/98c47e4a96a157e3f63f.png)

 

#### * 测试使用监听器连接数据库实例
[oracle@offcn ~]$ sqlplus sys/oracle@192.168.3.88:1521/prod.localdomain as sysdba

![](assets/07-Database/4a3cadee638fffcfcc5d.png)

 

#### * 添加SCOTT用户
sqlplus / as sysdba @$ORACLE_HOME/rdbms/admin/utlsampl.sql

![](assets/07-Database/a2699dfadeb7389cbd71.png)

scott用户密码：tiger

 

### Oracle管理的常用命令
启动关闭数据库：

sqlplus / as sysdba

启动

sys@prod>startup

 

关闭

sys@prod>shutdown immediate

 

 

远程通过网络连接：

* 开库

* 启动监听器，同时服务注册到监听器

 

sqlplus sys/oracle@192.168.3.88:1521/prod.localdomain as sysdba

sqlplus scott/tiger@192.168.3.88:1521/prod.localdomain

本地连接：

sqlplus / as sysdba

sqlplus scott/tiger

 

解锁用户，修改密码：

sqlplus / as sysdba

select username,account_status from dba_users;

sys@prod>alter user scott identified by scott account unlock;解锁同时修改密码

sys@prod>alter user scott identified by scott; 修改密码

sys@prod>alter user scott account unlock;解锁用户

sys@prod>alter user hr identified by hr account unlock;解锁用户

 

sys用户查看用户的表：

sys@prod>select * from scott.emp;

普通用户查看属于自己的表：

sqlplus scott/scott

scott@prod>select * from tab;

scott@prod>select * from dept;

 

切换用户：

sys@prod>conn scott/tiger;          从sys切换到scott用户     

scott@prod>conn sys/system as sysdba 切换回sys

scott@prod>conn / as sysdba           切换回sys

 


