# Centos6.10安装oracle11gR2_64安装过程截图

> 分类：Database / 第21章：Oracle
> 原文：https://www.cuiliangblog.cn/detail/section/31467566
> 来源：崔亮的博客

---

**Centos6.10安装 Oracle11gR2 (11.2.0.4.0) 单实例数据库**

# 一、安装前准备工作
## 当前Centos 6.10操作系统状况：
l  Centos6.10最小化安装

l  已经配置yum

 

## 关闭selinux
l  selinux默认开启，enforcing

l  安装oracle数据库要求selinux设置为permissive，permissive其含义是对于不合规的操作会记日志，不会阻止操作

l  通常安装oracle之前将selinux设置为disabled状态，即关闭

l  selinux默认嵌入到内核中，关闭selinux需要重启系统

l  关闭步骤：

root# vi /etc/selinux/config   

默认enforcing修改为disabled

![](assets/07-Database/57ec4ddb89106edec5fb.png)

root# reboot

重启后

root# getenforce

Disabled

## 在/etc/hosts文件中加入本机网卡IP地址
单实例数据库尽量使用静态IP，否则会经常面临监听器失效的情况，安装过程也会报错。ip变更需要调整hosts文件；如果是oracle集群环境，IP一定要固定下来，否则会导致集群软件不可用后果严重

 

l  查看网卡IP

![](assets/07-Database/26b09f5ccd263b813d58.png)

l  查看主机名

![](assets/07-Database/cdf7416efd4bbbf497ae.png)

l  修改/etc/hosts文件，添加一条记录

![](assets/07-Database/187b0cf7219d6e799edc.png)

## 建用户，用户组，目录，设置权限
l  创建用户组

有三个组，oinstall是主组，dba和oper是附加组

root# groupadd oinstall

root# groupadd dba

root# groupadd oper

l  创建用户

root# useradd -g oinstall -G dba,oper oracle

<font style="color:red;"> </font>

l  给用户设置密码

root# passwd oracle

Changing password for user oracle.

New UNIX password:<font style="color:red;">oracle</font>

BAD PASSWORD: it is based on a dictionary word

Retype new UNIX password:<font style="color:red;">oracle</font>

passwd: CHANGE_ME

 

l  创建oracle安装目录

root# mkdir -p /u01/app/

root# mkdir /u01/app/oracle

root# mkdir /u01/app/oraInventory

 

l  安装目录设置属主和属组

root# chown -R oracle:oinstall /u01/app/

 

l  安装目录设置权限

root# chmod -R 775 /u01/app/

<font style="color:red;"> </font>

## 设置操作系统参数
根据Oracle11gR2文档，设置核心参数值；oracle软件运行中需要调整系统参数，以符合oracle运行要求

 

l  root用户在/etc/sysctl.conf文件中加入下列行：

fs.aio-max-nr = 1048576

fs.file-max = 6815744

kernel.shmall = 2097152

kernel.shmmax = 975441920

kernel.shmmni = 4096

kernel.sem = 250 32000 100 128

net.ipv4.ip_local_port_range = 9000 65500

net.core.rmem_default = 262144

net.core.rmem_max = 4194304

net.core.wmem_default = 262144

net.core.wmem_max = 1048576

l  使修改的核心参数立即生效

root# sysctl -p

l  设置Shell Limits (系统资源限制)

root用户在/etc/security/limits.conf文件末尾中加入下列行：

oracle soft nofile 65536

oracle hard nofile 65536

oracle soft nproc 16384

oracle hard nproc 16384

 

l  设置oracle用户环境变量

oracle用户在/home/oracle/.bash_profile中删掉原来的最下面三行，然后加添下面的oracle环境变量

需要从root用户切换到oracle, su - oracle，然后修改 /home/oracle/.bash_profile

root# su - oracle

 

oracle$ vi .bash_profile

 

# add for oracle11gR2

ORACLE_BASE=/u01/app/oracle

ORACLE_HOME=$ORACLE_BASE/product/11.2.0/dbhome_1

ORACLE_SID=prod

PATH=$ORACLE_HOME/bin:$PATH

export ORACLE_BASE ORACLE_HOME ORACLE_SID PATH

 

alias sqlplus='rlwrap sqlplus'

alias rman='rlwrap rman'

 

export NLS_LANG="SIMPLIFIED CHINESE"_CHINA.AL32UTF8

export NLS_DATE_FORMAT='YYYY-MM-DD HH24:MI:SS'

export NLS_TIMESTAMP_FORMAT='yyyy-mm-dd HH24:MI:SSXFF'

export NLS_TIMESTAMP_TZ_FORMAT='yyyy-mm-dd HH24:MI:SSXFF TZR'

 

修改完.bash_profile后，要想使环境变量生效，以oracle用户用source命令（当前shell生效）执行.bash_profile

oracle$ source /home/oracle/.bash_profile

 

## 挂载oracle11gR2安装盘
![](assets/07-Database/b5e7ea911c79f4711de5.png)

 

root# mount /dev/cdrom /mnt

 

![](assets/07-Database/3a565b32313e286a2c40.png)

 

 

## 启动XManager，passive
oracle默认安装过程需要图形界面支持，最小安装无图形界面，可以利用第三方xwindows解析软件如：xmanager, xming解决图形界面

 

![](assets/07-Database/bdfc05faaef4fc6c6189.png)

 

windows右下角图标tray中出现：

![](assets/07-Database/6b1648958dd06dbdf727.png)

 

## 安装缺失的显示器检测包
oracle安装程序使用命令xdpyinfo来检查显示器，linux最小安装时没有安装需要后续安装；当然不安装也可以，但是oracle的runInstaller程序会报错

 

root# yum install xdpyinfo 

 

## 设置Oracle用户LANG环境变量
切换oracle用户

root# su - oracle

 

注：windows版oracle 11.2.0.4.0支持中文安装界面，但是linux版的oracle 11.2.0.4.0 java安装程序忘记添加一个中文字体字库(bug)，中文环境汉字都是方块，所以linux需要采用英文环境，对系统环境变量LANG要重新设置成英文（本机安装时，LANG=zh_CN.UTF-8，需要修改国家和地区值为en和US）

 

oracle$ export LANG=en_US.UTF-8

 

## 设置Oracle用户DISPLAY环境变量
选用知道Centos虚机对应windows这边网卡的ip; cmd> ipconfig

![](assets/07-Database/f9896b766af5e5eaed96.png)

 

注：192.168.2.1windows这边已经打开了xwindows解析软件xmanager passive，linux的oracle安装图形界面将使用xmanager解析，使用windows的显卡画在windows这边

oracle$ export DISPLAY=192.168.2.1:0.0

 

 

# 二、安装oracle软件
## 进入安装目录
oracle$ cd /mnt

oracle$ ./runInstaller

![](assets/07-Database/3d7f174700fbd3cb9294.png)

 

## <font style="color:black;">开始安装</font><font style="color:black;">oracle</font><font style="color:black;">软件</font>
![](assets/07-Database/e945d9d762cb68df14c2.png)

 

![](assets/07-Database/af1b23916ada3a2e2a65.png)

 

![](assets/07-Database/ce5fdf8fbd12672e8187.png)

 

![](assets/07-Database/2ea358dbbc874423f48d.png)

 

![](assets/07-Database/4ede9ad0824eb70f7045.png)

 

![](assets/07-Database/492ff6180692afe8ebec.png)

 

![](assets/07-Database/8957e8c6161ff163b2c5.png)

 

 

![](assets/07-Database/856ef4f0c46f90c16a62.png)

/u01/app/oraInventory 目录下存放已安装的oracle各类软件（oracle不光有数据库还有其他软件，如：应用服务器，集群件，ERP等）的组件清单，一般是安装时需要这个目录

![](assets/07-Database/9ff700f099a8bb8a4b32.png)

 

![](assets/07-Database/4569a4d0dcfdcf51bb4f.png)

 

![](assets/07-Database/a66f2ab3be3710a414f8.png)

## <font style="color:black;">开启额外的会话，以</font><font style="color:black;">root</font><font style="color:black;">用户安装缺失软件包</font>
<font style="color:black;">root# yum install gcc-4*</font>

![](assets/07-Database/7f23f15c0ec1f1ba2df3.png)

<font style="color:black;">root# yum install libaio-devel-*</font>

 

<font style="color:black;">root# yum install compat-libstdc++-*</font>

 

<font style="color:black;">root# yum install elfutils-libelf-devel-*</font>

 

<font style="color:black;">root# yum install gcc-c++-*</font>

 

<font style="color:black;">root# yum install sysstat-*</font>

 

<font style="color:black;">上传</font><font style="color:black;">pdksh-5.2.14-37.el5_8.1.x86_64.rpm</font><font style="color:black;">到</font><font style="color:black;">root</font><font style="color:black;">家目录，</font><font style="color:black;">oracle</font><font style="color:black;">部分组件使用了</font><font style="color:black;">ksh</font><font style="color:black;">功能，需要额外安装</font><font style="color:black;">pdksh</font><font style="color:black;">包，该包</font><font style="color:black;">centos6</font><font style="color:black;">没有提供，</font><font style="color:black;">centos5</font><font style="color:black;">中有</font>

<font style="color:black;">yum install /root/pdksh-5.2.14-37.el5_8.1.x86_64.rpm</font>

 

![](assets/07-Database/9dedd795c5c909e884ac.png)

 

![](assets/07-Database/368ec0876fb0a74b0a5d.png)

 

 

![](assets/07-Database/a8a185cbedfb64bfc379.png)

 

 

![](assets/07-Database/7bb773f1d746b256e904.png)

 

## <font style="color:black;">以</font><font style="color:black;">root</font><font style="color:black;">用户执行</font><font style="color:black;">2</font><font style="color:black;">个脚本</font>
以root身份（多开个会话）执行，不要忘记了，否则后续DBCA建库有可能会报错

root# /u01/app/oraInventory/orainstRoot.sh

root# /u01/app/oracle/product/11.2.0/dbhome_1/root.sh

 

![](assets/07-Database/1539f3f2ead8103f7b09.png)

![](assets/07-Database/a69d29f2104a2cdf761d.png)

执行完了，点击OK按钮

![](assets/07-Database/a0ed4417903213fca3c0.png)

 

![](assets/07-Database/fb222db70e606f7d65fa.png)

 

## <font style="color:black;">安装</font><font style="color:black;">rlwrap</font><font style="color:black;">及其</font><font style="color:black;">unixODBC</font><font style="color:black;">软件包</font>
 

上传rlwrap-0.42-1.el6.x86_64.rpm到root家目录；该程序提供sqlplus历史记录，使用起来方便一些

root# yum install /root/rlwrap-0.42-1.el6.x86_64.rpm     #该包需要perl相关的软件包

 

 

 

如果有微软的应用程序需要连接oracle，需要安装unixODBC包，可以提前安装好，也可以需要时再安装

root# yum install unixODBC

root# yum install unixODBC-devel-*

 

# 三、配置监听器
**系统的****oracle****用户执行，安装过程用到图形界面，需要指定****DISPLAY****变量**

**oracle$ export DISPLAY=192.168.2.1:0.0     #****安装****oracle****软件时，安装的会话已经设置，如果变更其他会话需要设置**

**oracle$ netca**

 

 

![](assets/07-Database/7add1c33fe0634ba76a8.png)

 

 

![](assets/07-Database/226ea4b5cd8610fe7be6.png)

 

![](assets/07-Database/13148698071bcb03ca6a.png)

 

 

![](assets/07-Database/45b83321435a0694f016.png)

 

![](assets/07-Database/556382cdde5330baece1.png)

 

![](assets/07-Database/a4290b81db809a39317e.png)

 

![](assets/07-Database/21129a9091d2b626df72.png)

 

![](assets/07-Database/3339764af3427262a444.png)

 

![](assets/07-Database/ac018300eaffb8e025e0.png)

 

# 四、创建数据库
**oracle$ export DISPLAY=192.168.2.1:0.0     #****安装****oracle****软件时，安装的会话已经设置，如果变更其他会话需要设置**

**oracle$ dbca**

![](assets/07-Database/a44e6c64f4c46929cf5c.png)

![](assets/07-Database/a3e20104154c0bf7245f.png)

 

![](assets/07-Database/ab08c5fe4a257e1b8dbe.png)

选择“一般用途和事务处理”这个选项，其他选项是定制和数据仓库(主要是select语句，只读操作多，dml少)，主要区别是启动参数的设置不太一样

![](assets/07-Database/8858c54abbc294d122bd.png)

和系统oracle用户下的.bash_profile中的ORACLE_SID环境变量的值一致，如果更改需要调整ORACLE_SID的值，否则连接不了数据库

![](assets/07-Database/9eac3b613ad53d6558b3.png)

Oracle Enterprise Manager简称OEM，是oracle浏览器版客户端，功能强大但是耗费资源，bug也多

![](assets/07-Database/cd20e159600e5ffacd68.png)

给oracle内部用户设置密码

![](assets/07-Database/6799bd25b12d66d40df3.png)

 

 

![](assets/07-Database/a3ca2f012da9129d0b15.png)

 

Oracle可以安装到文件系统、ASM(oracle的lvm)、裸设备上，当前场景只能选择文件系统

![](assets/07-Database/f1e17e0331059adc25d0.png)

fast recovery area称为闪回恢复区，备份归档日志等如果没有指定路径会自动放到这个目录中，方便管理，oracle可以自动识别

![](assets/07-Database/c09a083e9611d392d6c3.png)

 

![](assets/07-Database/b7bd1e3e0a29244c7278.png)

当前虚拟机内存2048M，如果不指定会分配2048*0.9的内存给oracle数据库用，教学用500M足够，最小大约400M

![](assets/07-Database/73cb0832c581832c601d.png)

 

![](assets/07-Database/2e0626be6e5e171b4cf3.png)

 

![](assets/07-Database/78f9e826d38c2a4efa25.png)

 

![](assets/07-Database/3221e136407856a0b40a.png)

 

![](assets/07-Database/277f66b69b4d80b18ba5.png)

 

![](assets/07-Database/3c273abee225057dfef4.png)

点击“exit”按钮完成创建数据库

![](assets/07-Database/1fd9638e5bf09a19ae1e.png)

 

# 五、测试安装
安装oracle数据库以后，对于oracle数据库的相关操作都要以操作系统的oracle用户来做，如果以root身份登录系统，需要切换到oracle用户来操作，su - oracle

 

## 测试监听器状态
oracle$ lsnrctl status

 

![](assets/07-Database/9dfae7c84d3b9cd5b8dd.png)

如果出现Service.......等文字说明oracle实例prod已经注册到了监听器(listener)，可以通过网络访问数据库prod

 

 

## 测试sqlplus本地连接
oracle$ sqlplus / as sysdba

** **

![](assets/07-Database/cd68a44f1b088471a7bc.png)

查看实例状态

SQL> select instance_name,status from v$instance;

 

![](assets/07-Database/3f68efe5a918dfa9ae5e.png)

查看用户状态

SQL> select username,account_status from dba_users;

![](assets/07-Database/8374dcc4a06e84d103f6.png)

 

## 解锁示例用户
SQL> alter user scott identified by tiger account unlock;

用户名为scott已经存在，密码为tiger

SQL> select username,account_status from dba_users where username='SCOTT';

![](assets/07-Database/e33955f55c24f6515727.png)

 

## 修改sqlplus全局配置文件glogin.sql
SQL> quit

oracle$ vi $ORACLE_HOME/sqlplus/admin/glogin.sql

<font style="color:#0070C0;">末尾添加</font>

set linesize 220

set pagesize 50

set sqlprompt "_user'@'_connect_identifier>"

define _editor=vi

 

保存退出vi

 

可以设置sqlplus显示效果，显示用户名实例名，指定行的宽度（默认一行显示80个字，多了会折行看起来不方便）和页中行的数量

 

![](assets/07-Database/adcefeebfc601da11f54.png)

 

## 以普通用户SCOTT登录
oracle$ sqlplus scott/tiger

![](assets/07-Database/30947819f5c8fe74def2.png)

 

## 查看用户SCOTT有哪些表、视图等数据对象
SCOTT@prod>select * from tab;

![](assets/07-Database/41413c343bb15dc523a0.png)

 

## 查看表中有哪些列
SCOTT@prod>desc emp

![](assets/07-Database/96710565c0856474ec10.png)

## 查看表中有哪些行
SCOTT@prod>select * from emp;

![](assets/07-Database/275115c36128ce403e4e.png)

 

## SQLPLUS中切换用户
**从****scott****切换到****sys**

SCOTT@prod>conn / as sysdba

SYS@prod>show user;

![](assets/07-Database/37c2e4ada093fbed9abe.png)

**从****sys****切换到****system**

SYS@prod>conn system/oracle

SYSTEM@prod>show user;

![](assets/07-Database/6bcf1d26b3859083e460.png)

**从****system****切换到****scott**

SYSTEM@prod>conn scott/tiger

SCOTT@prod>show user;

![](assets/07-Database/8b8581225e55877ae03d.png)

 

sys是oracle数据库prod中的超级用户可以启动关闭删除数据库，拥有最高的权限，相当于linux操作系统中的root用户

system是oracle数据库prod中的数据库管理员，除了不能启动关闭和删除数据库之外，其他的事情都能做，包括：删除其他用户的表，查看其他用户的表内容等等

scott是普通用户，对于自己的数据表有完全控制权限，但是其他用户的表做不了任何操作，除非其他用户授权给scott

 

## 测试通过监听器连接数据库
SCOTT@prod>quit

oracle$ sqlplus scott/tiger@localhost:1521/prod

![](assets/07-Database/881244499c8167eb3afc.png)

 

## 切换用户中使用监听器
**从****scott****切换到****sys**

SCOTT@localhost:1521/prod>conn sys/oracle@192.168.2.138:1521/prod as sysdba

**从****sys****切换到****system**

SYS@192.168.2.138:1521/prod>conn system/oracle@localhost:1521/prod

![](assets/07-Database/5b5b3f0b984c7feecda6.png)

如果是用户sys要加 as sysdba，其他用户不用加

 

## 关闭数据库(只能sys用户做)
SYSTEM@localhost:1521/prod>shutdown immediate;

ORA-01031: 权限不足

![](assets/07-Database/3048791d877bf2bdfe6b.png)

本地切换到sys

SYSTEM@localhost:1521/prod>conn / as sysdba

SYS@prod>shutdown immediate

![](assets/07-Database/438aa8c2978c1ca09a84.png)

关闭了数据库后，用户的数据表就访问不到了

## 开启数据库(只能sys用户做)
SYS@prod>startup

![](assets/07-Database/86023e90d4b8caaabcff.png)

 

## 关闭数据库后关闭监听器
SYS@prod>shutdown immediate

SYS@prod>quit

oracle$ lsnrctl stop

oracle$ lsnrctl status

 

![](assets/07-Database/86ecd8a6d88f46b29f00.png)

 

## 启动linux系统后，启动oracle数据库
root# su - oracle

oracle$ lsnrctl start

oracle$  sqlplus / as sysdba

SYS@prod>startup

SYS@prod>!lsnrctl status   # sqlplus调用系统命令可以用 ！或 host 后跟命令字

![](assets/07-Database/f9c7a5230b4629693d2c.png)

 

 

# 六、根据需要给虚拟机做快照和备份
利用虚拟机软件的功能生成快照

关闭虚拟机后，可以导出虚机，生成.ova或.ovf文件，后续可以根据需要导入到其他虚拟机软件中，因为安装一遍oracle步骤较多，费时间

 


