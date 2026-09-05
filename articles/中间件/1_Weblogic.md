## 一、简介

WebLogic是美国[Oracle](http://lib.csdn.net/base/oracle)公司出品的一个application server，确切的说是一个基于JAVAEE[架构](http://lib.csdn.net/base/architecture)的中间件，WebLogic是用于开发、集成、部署和管理大型分布式Web应用、网络应用和[数据库](http://lib.csdn.net/base/mysql)应用的[Java](http://lib.csdn.net/base/java)应用服务器。将Java的动态功能和[Java](http://lib.csdn.net/base/java) Enterprise标准的安全性引入大型网络应用的开发、集成、部署和管理之中。 

WebLogic是美商[oracle](http://lib.csdn.net/base/oracle)的主要产品之一，系并购BEA得来。是商业市场上主要的Java（J2EE）应用服务器软件（application server）之一，是世界上第一个成功商业化的J2EE应用服务器, 已推出到12c(12.1.3) 版。而此产品也延伸出WebLogic Portal，WebLogic Integration等企业用的中间件（但当下Oracle主要以Fusion Middleware融合中间件来取代这些WebLogic Server之外的企业包），以及OEPE(Oracle Enterprise Pack for Eclipse)开发工具。（来自百度百科）

官方文档地址：[http://docs.oracle.com/en/middleware/index.html](http://docs.oracle.com/en/middleware/index.html)

## 二、优点

WebLogic Server具有开发和部署关键任务电子商务Web应用系统 所需的多种特色和优势。

-   标准   
    对业内多种标准的全面支持，包括EJB、JSP、Servlet、JMS、JDBC、XML（标准通用标记语言的子集）和WML，使Web应用系统的实施更为简单，并且保护了投资，同时也使基于标准的解决方案的开发更加简便。  
    
-   可扩展性   
    WebLogic Server以其高扩展的架构体系闻名于业内，包括客户机连接的共享、资源pooling以及动态网页和EJB组件群集。  
    
-   快速开发   
    凭借对EJB和JSP的支持，以及WebLogic Server 的Servlet组件架 构体系，可加速投放市场速度。这些开放性标准与WebGain Studio配合时，可简化开发，并可发挥已有的技能，迅速部署应用系统。  
    

## 三、和其他服务器区别

1.  tomcat （免费）   
    Tomcat只能算Web Container，是官方指定的JSP&Servlet容器。只实现了JSP/Servlet的相关规范，不支持EJB（硬伤啊）!不过Tomcat配合jboss和apache可以实现j2ee应用服务器功能   
    一般来说考虑stucts等架构tomcat就可以了，但如果考虑EJB的话，WebLogic是比较好的选择。  
    
2.  Jboss （免费）   
    JBoss是一个管理EJB的容器和服务器，支持EJB 1.1、EJB 2.0和EJB3的规范。但JBoss核心服务不包括支持servlet/JSP的WEB容器，一般与Tomcat或Jetty绑定使用。  
    
3.  weblogic (收费)   
    weblogic是j2ee的应用服务器（application server），包括ejb ,jsp,servlet,jms等等，全能型的。是商业软件里排名第一的容器  
    （JSP、servlet、EJB等），并提供其他如JAVA编辑等工具，是一个综合的开发及运行环境。收费  
    

weblogic版本:

11g: 10.3.1/2/3/4/5/6/ (java 1.6)

12c: 12.1.1/1.2/1.3/2.1/2.2/(java1.6  java1.7   java1.8)

  

## 四.安装

### 4.1 准备weblogic安装包

[https://www.oracle.com/technetwork/middleware/weblogic/downloads/index.html](https://www.oracle.com/technetwork/middleware/weblogic/downloads/index.html)

![Image.png](assets/中间件/1_Weblogic/1_Weblogic-1.png)

### 4.2 安装jdk

注意：安装之前需要查看下系统是否安装了openjdk，如果安装了openjdk，请先卸载，否则安装不了oracle官方的jdk

卸载方法：yum remove java-\* -y

二进制包安装：

[root@weblogic2 ~ ]# tar jdk-8u161-linux-x64.tar.gz -C /usr/local/

[root@weblogic2 ~ ]#  cd /usr/local/

[root@weblogic2   local]# mv jdk1.8.0\_161/ jdk1.8

配置环境变量：

[root@weblogic2 ~]# vim /etc/profile

最后加

export JAVA\_HOME=/usr/local/jdk1.8

export JAVA\_BIN=/usr/local/jdk1.8/bin

export PATH=${JAVA\_HOME}/bin:$PATH

export CLASSPATH=.${JAVA\_HOME}/lib/dt.jar:${JAVA\_HOME}/li/tools/jar

[root@@weblogic2  local]# source /etc/profile    //加载环境变量

[root@@weblogic2  local]# java -version

java version "1.8.0\_161"

Java(TM) SE Runtime Environment (build 1.8.0\_161-b12)

Java HotSpot(TM) 64-Bit Server VM (build 25.161-b12, mixed mode)

### 4.3 创建 weblogic组和用户

[root@weblogic2 ~]# groupadd weblogic

[root@weblogic2 ~]# useradd -g weblogic weblogic

### 4.4 为用户创建密码

[root@weblogic2 ~]# passwd weblogic

更改用户 weblogic 的密码 。

新的 密码：

无效的密码： 密码包含用户名在某些地方

重新输入新的 密码：

passwd：所有的身份验证令牌已经成功更新。

### 4.5 切换用户  拷贝安装包

[root@weblogic2 ~]# su weblogic

[weblogic@weblogic2 root]$ cd /home/weblogic/

[weblogic@weblogic2 ~]$ ll

总用量 0

[weblogic@weblogic2 ~]$ rz -E

rz waiting to receive.

[weblogic@weblogic2 ~]$ ll

总用量 236472

\-rw-r--r-- 1 weblogic weblogic 242143918 5月  16 11:27 fmw\_12.2.1.3.0\_wls\_quick\_Disk1\_1of1.zip

### 4.6  在/home/weblogic目录下新建文件wsl.rsp

[ENGINE]

#DO NOT CHANGE THIS.

Response File Version=1.0.0.0.0

[GENERIC]

#The oracle home location. This can be an existing Oracle Home or a new Oracle Home

ORACLE\_HOME=/home/weblogic/oracle

#Set this variable value to the Installation Type selected. e.g. WebLogic Server, Coherence, Complete with Examples.

INSTALL\_TYPE=WebLogic Server

#Provide the My Oracle Support Username. If you wish to ignore Oracle Configuration Manager configuration provide empty string for user name.

MYORACLESUPPORT\_USERNAME=

#Provide the My Oracle Support Password

MYORACLESUPPORT\_PASSWORD=

#Set this to true if you wish to decline the security updates. Setting this to true and providing empty string for My Oracle Support username will ignore the Oracle Configuration Manager configuration

DECLINE\_SECURITY\_UPDATES=true

#Set this to true if My Oracle Support Password is specified

SECURITY\_UPDATES\_VIA\_MYORACLESUPPORT=false

#Provide the Proxy Host

PROXY\_HOST=

#Provide the Proxy Port

PROXY\_PORT=

#Provide the Proxy Username

PROXY\_USER=

#Provide the Proxy Password

PROXY\_PWD=

#Type String (URL format) Indicates the OCM Repeater URL which should be of the format [scheme\[Http/Https]\]://[repeater host]:[repeater port]

COLLECTOR\_SUPPORTHUB\_URL=

在/home/weblogic目录下新建文件oraInst.loc

inventory\_loc=/home/weblogic/oraInventory

inst\_group=weblogic

### 4.7  执行安装操作

[weblogic@weblogic2 ~]$ java -jar fmw\_12.2.1.3.0\_wls\_quick.jar -silent -responseFile /home/weblogic/wsl.rsp -invPtrLoc  /home/weblogic/oraInst.loc

开始检查: CheckJDKVersion

预期的结果: 1.8.0\_131

实际结果: 1.8.0\_211

检查完成。此次检查的总体结果为: 通过

CheckJDKVersion 检查: 成功。

已启用此会话的验证。

正在验证数据

复制文件

完成百分比: 10

完成百分比: 20

完成百分比: 30

完成百分比: 40

完成百分比: 50

完成百分比: 60

完成百分比: 70

完成百分比: 80

完成百分比: 90

完成百分比: 100

Oracle Fusion Middleware 12c WebLogic 和 Coherence Developer 12.2.1.3.0 的 安装 已成功完成。

日志已成功复制到/home/weblogic/wls12213/cfgtoollogs/oui。

### 4.8 查看安装目录

[weblogic@weblogic2 ~]$ cd wls12213/

[weblogic@weblogic2 wls12213]$ ll

总用量 8

drwxr-x---  4 weblogic weblogic  35 5月  20 13:35 cfgtoollogs

drwxr-x---  5 weblogic weblogic  62 5月  20 13:31 coherence

drwxr-x--- 19 weblogic weblogic 293 5月  20 13:35 inventory

drwxr-x--- 11 weblogic weblogic 265 5月  20 13:33 OPatch

drwxr-x---  9 weblogic weblogic 103 5月  20 13:31 oracle\_common

\-rw-r-----  1 weblogic weblogic 133 5月  20 13:34 oraInst.loc

drwxr-x---  8 weblogic weblogic 129 5月  20 13:34 oui

\-rwx------  1 weblogic weblogic  10 5月  20 13:29 root.sh

drwxr-x---  7 weblogic weblogic  81 5月  20 13:31 wlserver

### 4.9 新建域的目录

[weblogic@weblogic2 ~]$ mkdir -p /home/weblogic/wls12213/user\_projects/domains/base\_domain/

在home/weblogic创建域脚本create\_domain.rsp

read template from "/home/weblogic/wls12213/wlserver/common/templates/wls/wls.jar";

set JavaHome "/usr/local/jdk1.8";

set ServerStartMode "prod";

find Server "AdminServer" as AdminServer;

set AdminServer.ListenAddress "";

set AdminServer.ListenPort "7001";

set AdminServer.SSL.Enabled "true";

set AdminServer.SSL.ListenPort "7002";

//Create Machine

//create Machine "base" as Machinename;

//use templates default weblogic user

find User "weblogic" as u1;

set u1.password "weblogic";

write domain to "/home/weblogic/wls12213/user\_projects/domains/base\_domain/";

// The domain name will be "demo-domain"

close template;

### 4.10  切换到/home/weblogic/wls12213/wlserver/common/bin目录下

[weblogic@weblogic2 ~]$ cd /home/weblogic/wls12213/wlserver/common/bin

[weblogic@weblogic2 bin]$ ll

总用量 68

\-rwxr-x--- 1 weblogic weblogic   583 8月  10 2017 config.sh

\-rwxr-x--- 1 weblogic weblogic   578 8月  10 2017 pack.sh

\-rwxr-x--- 1 weblogic weblogic   582 8月  10 2017 unpack.sh

\-rwxr-x--- 1 weblogic weblogic 35171 8月  21 2017 wlscontrol.sh

\-rwxr-x--- 1 weblogic weblogic 16286 8月  21 2017 wlsifconfig.sh

\-rwxr-x--- 1 weblogic weblogic   807 8月  10 2017 wlst.sh

### 4.11 执行创建域脚本

[weblogic@weblogic2 bin]$ ./config.sh -mode=silent -silent\_script=/home/weblogic/create\_domain.rsp -logfile=/home/weblogic/create\_domain.log

  

WARNING: This is a deprecated script. Please invoke the config.sh script under oracle\_common/common/bin.

<< read template from "/home/weblogic/wls12213/wlserver/common/templates/wls/wls.jar"

succeed: read template from "/home/weblogic/wls12213/wlserver/common/templates/wls/wls.jar"

<< set config option JavaHome to "/usr/local/jdk1.8"

succeed: set config option JavaHome to "/usr/local/jdk1.8"

<< set config option ServerStartMode to "prod"

succeed: set config option ServerStartMode to "prod"

<< find Server "AdminServer" as AdminServer

succeed: find Server "AdminServer" as AdminServer

<< set AdminServer attribute ListenAddress to ""

succeed: set AdminServer attribute ListenAddress to ""

<< set AdminServer attribute ListenPort to "7001"

succeed: set AdminServer attribute ListenPort to "7001"

<< set AdminServer attribute SSL!Enabled to "true"

succeed: set AdminServer attribute SSL!Enabled to "true"

<< set AdminServer attribute SSL!ListenPort to "7002"

succeed: set AdminServer attribute SSL!ListenPort to "7002"

<< find User "weblogic" as u1

succeed: find User "weblogic" as u1

<< set u1 attribute Password to ""

succeed: set u1 attribute Password to ""

<< write Domain to "/home/weblogic/wls12213/user\_projects/domains/base\_domain/"

..................................................

succeed: write Domain to "/home/weblogic/wls12213/user\_projects/domains/base\_domain/"

<< close template

succeed: close template

  

### 4.12   切换到安全目录下新装控制台用户名和密码

(可能没有这个目录  则切换到   /home/weblogic/wls12213/user\_projects/domains/base\_domain/下执行启动脚本)

[weblogic@weblogic2 ~]$ cd /home/weblogic/wls12213/user\_projects/domains/base\_domain/servers/AdminServer/

[weblogic@weblogic2 AdminServer]$ mkdir security

[weblogic@weblogic2 AdminServer]$ cd security/

[weblogic@weblogic2 security]$ vi boot.properties  (必须使用一次手工输入的方式才会读取这个文件)

username=weblogic

password=weblogic

[weblogic@weblogic2 security]$ cat boot.properties   (已加密)

#Mon May 20 14:18:31 CST 2019

password={AES}qGKXc08b1198aG9zcvxuAqHR3akNxaxyR2tpffM47Rs=

username={AES}sLpz/Nl8m1V3A1zmwfmRcSDnAnaIyRFB9PKJMwGORT8=

### 4.13  切换到域目录  执行启动脚本 进入控制台

[weblogic@weblogic2 ~]$ cd /home/weblogic/wls12213/user\_projects/domains/base\_domain/

[weblogic@weblogic2 base\_domain]$ ll

总用量 20

drwxr-x--- 2 weblogic weblogic   24 5月  20 13:49 autodeploy

drwxr-x--- 6 weblogic weblogic 4096 5月  20 13:49 bin

drwxr-x--- 3 weblogic weblogic   1 6 5月  20 13:51 common

drwxr-x--- 9 weblogic weblogic  143 5月  20 13:52 config

drwxr-x--- 2 weblogic weblogic   24 5月  20 13:49 console-ext

\-rw-r----- 1 weblogic weblogic  321 5月  20 13:53 derby.log

\-rw-r----- 1 weblogic weblogic   91 5月  20 13:53 derbyShutdown.log

\-rw-r----- 1 weblogic weblogic  327 7月  19 2017 fileRealm.properties

drwxr-x--- 3 weblogic weblogic  318 5月  20 13:49 init-info

drwxr-x--- 2 weblogic weblogic   24 5月  20 13:49 lib

drwxr-x--- 2 weblogic weblogic   63 5月  20 13:49 nodemanager

drwxr-x--- 2 weblogic weblogic  143 5月  20 13:49 security

drwxr-x--- 3 weblogic weblogic   25 5月  20 13:52 servers

\-rwxr-x--- 1 weblogic weblogic  273 5月  20 13:49 startWebLogic.sh

[weblogic@weblogic2 base\_domain]$ ./startWebLogic.sh

![Image.png](assets/中间件/1_Weblogic/1_Weblogic-2.png)

### 4.14  在浏览器输入URL地址

 [http://192.168.XXX.XXX:7001/console/](http://192.168.XXX.XXX:7001/console/) ，输入在boot.properties文件中配置用户名和密码接口   (可能需要等待一会)

![Image.png](assets/中间件/1_Weblogic/1_Weblogic-3.png)