# 总体架构

![](assets/中间件/Apollo_安装/Apollo_安装-1.png)

1.  用户在Portal操作配置发布
2.  Portal调用Admin Service的接口操作发布
3.  Admin Service发布配置后，发送ReleaseMessage给各个Config Service
4.  Config Service收到ReleaseMessage后，通知对应的客户端

  

# 实现原理

![](assets/中间件/Apollo_安装/Apollo_安装-2.png)

上图简要描述了Apollo客户端的实现原理：

1.  客户端和服务端保持了一个长连接，从而能第一时间获得配置更新的推送。（通过Http Long Polling实现）
2.  客户端还会定时从Apollo配置中心服务端拉取应用的最新配置。

-   这是一个fallback机制，为了防止推送机制失效导致配置不更新
-   客户端定时拉取会上报本地版本，所以一般情况下，对于定时拉取的操作，服务端都会返回304 - Not Modified
-   定时频率默认为每5分钟拉取一次，客户端也可以通过在运行时指定System Property: apollo.refreshInterval来覆盖，单位为分钟。

3.  客户端从Apollo配置中心服务端获取到应用的最新配置后，会保存在内存中
4.  客户端会把从服务端获取到的配置在本地文件系统缓存一份

-   在遇到服务不可用，或网络不通的时候，依然能从本地恢复配置

5.  应用程序可以从Apollo客户端获取最新的配置、订阅配置更新通知

  

# MySQL安装

  

版本要求：5.6.5+

主机：10.2.42.28

清除mysql依赖包：

  

```bash
rpm -qa | grep mysql
yum remove mysql-libs
```

  

安装mysql5.7：安装顺序：common→libs→client→server

  

```bash
rpm -ivh mysql-community-common-5.7.26-1.el7.x86_64.rpm
rpm -ivh mysql-community-libs-5.7.26-1.el7.x86_64.rpm  
rpm -ivh mysql-community-client-5.7.26-1.el7.x86_64.rpm
rpm -ivh mysql-community-server-5.7.26-1.el7.x86_64.rpm
```

  

安装成功界面：

  

```bash
[root@DCA-APP-COM-apollo02 mysql]# rpm -ivh mysql-community-common-5.7.26-1.el7.x86_64.rpm 
warning: mysql-community-common-5.7.26-1.el7.x86_64.rpm: Header V3 DSA/SHA1 Signature, key ID 5072e1f5: NOKEY
Preparing...                          ################################# [100%]
Updating / installing...
   1:mysql-community-common-5.7.26-1.e################################# [100%]
[root@DCA-APP-COM-apollo02 mysql]# rpm -ivh mysql-community-libs-5.7.26-1.el7.x86_64.rpm 
warning: mysql-community-libs-5.7.26-1.el7.x86_64.rpm: Header V3 DSA/SHA1 Signature, key ID 5072e1f5: NOKEY
Preparing...                          ################################# [100%]
Updating / installing...
   1:mysql-community-libs-5.7.26-1.el7################################# [100%]
[root@DCA-APP-COM-apollo02 mysql]# rpm -ivh mysql-community-client-5.7.26-1.el7.x86_64.rpm 
warning: mysql-community-client-5.7.26-1.el7.x86_64.rpm: Header V3 DSA/SHA1 Signature, key ID 5072e1f5: NOKEY
Preparing...                          ################################# [100%]
Updating / installing...
   1:mysql-community-client-5.7.26-1.e################################# [100%]
[root@DCA-APP-COM-apollo02 mysql]# rpm -ivh mysql-community-server-5.7.26-1.el7.x86_64.rpm 
warning: mysql-community-server-5.7.26-1.el7.x86_64.rpm: Header V3 DSA/SHA1 Signature, key ID 5072e1f5: NOKEY
Preparing...                          ################################# [100%]
Updating / installing...
   1:mysql-community-server-5.7.26-1.e################################# [100%]
```

  

启动mysql：

  

```bash
service mysqld start
```

  

mysql初始化：

  

```bash
[root@DCA-APP-COM-apollo02 mysql]# grep 'temporary password' /var/log/mysqld.log
2019-07-17T14:10:02.559365Z 1 [Note] A temporary password is generated for root@localhost: %hNW)P3Ly,8v
[root@DCA-APP-COM-apollo02 mysql]# mysql -uroot -p
Enter password: 
Welcome to the MySQL monitor.  Commands end with ; or \g.
Your MySQL connection id is 2
Server version: 5.7.26

Copyright (c) 2000, 2019, Oracle and/or its affiliates. All rights reserved.

Oracle is a registered trademark of Oracle Corporation and/or its
affiliates. Other names may be trademarks of their respective
owners.

Type 'help;' or '\h' for help. Type '\c' to clear the current input statement.
# 更改密码长度
mysql> set global validate_password_length=1;
Query OK, 0 rows affected (0.00 sec)
# 更改密码强度
mysql> set global validate_password_policy=0;
Query OK, 0 rows affected (0.00 sec)

mysql> set password for root@localhost=password('123456');
Query OK, 0 rows affected, 1 warning (0.00 sec)

mysql> grant all privileges on *.* to 'root' @'%' identified by '123456';
Query OK, 0 rows affected, 1 warning (0.00 sec)

mysql> flush privileges;
Query OK, 0 rows affected (0.00 sec)
```

  

Apollo数据库创建：SQL在官网自行下载

  

```bash
mysql> source apolloconfigdb.sql;
mysql> source apolloportaldb.sql;
```

  

msyql连接用户授权：

  

```bash
mysql> grant all privileges on ApolloConfigDB.* to Apollo@'%' IDENTIFIED BY 'Apollo' ;
Query OK, 0 rows affected, 1 warning (0.00 sec)

mysql> grant all privileges on ApolloPortalDB.* to Apollo@'%';
Query OK, 0 rows affected (0.00 sec)

mysql> flush privileges;
Query OK, 0 rows affected (0.00 sec)
```

  

数据库配置更改：

  

ApolloPortalDB：

![](assets/中间件/Apollo_安装/Apollo_安装-3.png)

  

ApolloConfigDB：

![](assets/中间件/Apollo_安装/Apollo_安装-4.png)

  

  

# Apollo安装

  

官方地址：[https://github.com/ctripcorp/apollo](https://github.com/ctripcorp/apollo)

本次测试版本为：0.10.2

下载地址：[https://github.com/ctripcorp/apollo/releases/tag/v0.10.2](https://github.com/ctripcorp/apollo/releases/tag/v0.10.2)

apollo-adminservice-0.10.2-github.zip

apollo-configservice-0.10.2-github.zip

apollo-portal-0.10.2-github.zip

  

## apollo-config

  

主机：10.2.42.27

创建apollo用户：

  

```bash
groupadd apollo && useradd -g apollo apollo
```

  

配置configserver：

  

```bash
cd /home/apollo/
mkdir apollo-config
unzip apollo-configservice-0.10.2-github.zip -d apollo-config
```

  

ApolloconfigDB配置：

  

```bash
vim apollo-config/config/application-github.properties

# DataSource
spring.datasource.url = jdbc:mysql://10.2.42.28:3306/ApolloConfigDB?characterEncoding=utf8
spring.datasource.username = Apollo
spring.datasource.password = Apollo
```

  

日志路径及JVM参数修改：部分配置，后面的配置不需要修改

  

```bash
vim apollo-config/scripts/startup.sh 
# 修改日志路径
LOG_DIR=/home/apollo/logs/100003171
# 默认端口
SERVER_PORT=8080
# 默认注释看需求打开
## Adjust memory settings if necessary
export JAVA_OPTS="-Xms6144m -Xmx6144m -Xss256k -XX:MetaspaceSize=128m -XX:MaxMetaspaceSize=384m -XX:NewSize=4096m -XX:MaxNewSize=4096m -XX:SurvivorRatio=8"
```

  

启动Apollo-configservice：

  

```bash
cd /home/apollo/
chown -R apollo.apollo *
su apollo

./apollo-config/scripts/startup.sh
```

  

启动成功：

  

```bash
Thu Jul 18 15:06:53 CST 2019 ==== Starting ==== 
Started [53700]
Waiting for server startup......
Thu Jul 18 15:07:24 CST 2019 Server started in 30 seconds!
```

  

  

## apollo-admin

  

主机：10.2.42.28

  

```bash
groupadd apollo && useradd -g apollo apollo
cd /home/apollo/
mkdir {apollo-admin,apollo-portal}
unzip apollo-adminservice-0.10.2-github.zip -d apollo-admin
unzip apollo-portal-0.10.2-github.zip -d apollo-portal
```

  

ApolloconfigDB配置：

  

```bash
cd apollo-admin
vim config/application-github.properties

# DataSource
spring.datasource.url = jdbc:mysql://10.2.42.28:3306/ApolloConfigDB?characterEncoding=utf8
spring.datasource.username = Apollo
spring.datasource.password = Apollo
```

  

日志路径及JVM参数配置：部分配置，后面的配置不需要修改

  

```bash
vim scripts/startup.sh

#!/bin/bash
SERVICE_NAME=apollo-adminservice
## Adjust log dir if necessary
LOG_DIR=/home/apollo/logs/100003172
## Adjust server port if necessary
SERVER_PORT=8090

## Adjust memory settings if necessary
export JAVA_OPTS="-Xms2560m -Xmx2560m -Xss256k -XX:MetaspaceSize=128m -XX:MaxMetaspaceSize=384m -XX:NewSize=1536m -XX:MaxNewSize=1536m -XX:SurvivorRatio=8"
```

  

启动apollo-admin：

  

```bash
cd /home/apollo/
chown -R apollo.apollo *
su apollo
./scripts/startup.sh 

Thu Jul 18 16:17:32 CST 2019 ==== Starting ==== 
Started [56497]
Waiting for server startup......
Thu Jul 18 16:18:02 CST 2019 Server started in 30 seconds!
```

  

  

## apollo-portal

  

主机：10.2.42.28

apolloportlDB配置：

  

```bash
cd /home/apollo/apollo-portal
vim config/application-github.properties 

# DataSource
spring.datasource.url = jdbc:mysql://10.2.42.28:3306/ApolloPortalDB?characterEncoding=utf8
spring.datasource.username = Apollo
spring.datasource.password = Apollo
```

  

configservice配置：一套portal可以管理多个configservice，也可以直接配置在startup.sh脚本里

  

```bash
vim config/apollo-env.properties 

local.meta=http://localhost:8080
dev.meta=http://10.2.42.27:8080
fat.meta=http://10.2.42.27:8080
uat.meta=${lpt_meta}
lpt.meta=${lpt_meta}
pro.meta=${lpt_meta}
```

  

日志路径及JVM参数修改：部分配置，后面的配置不需要修改

  

```bash
vim scripts/startup.sh 

#!/bin/bash
SERVICE_NAME=apollo-portal
## Adjust log dir if necessary
LOG_DIR=/home/apollo/logs/100003173
## Adjust server port if necessary
SERVER_PORT=8070

## Adjust memory settings if necessary
export JAVA_OPTS="-Xms2560m -Xmx2560m -Xss256k -XX:MetaspaceSize=128m -XX:MaxMetaspaceSize=384m -XX:NewSize=1536m -XX:MaxNewSize=1536m -XX:SurvivorRatio=8"
```

  

apollo-portal启动：

  

```bash
su apollo
./scripts/startup.sh 

Thu Jul 18 16:25:55 CST 2019 ==== Starting ==== 
Started [56773]
Waiting for server startup...
Thu Jul 18 16:26:10 CST 2019 Server started in 15 seconds!
```

  

  

# Apollo使用

  

服务端页面展示：10.2.42.27:8080

![](assets/中间件/Apollo_安装/Apollo_安装-5.png)

  

配置中心页面展示：10.2.42.28:8070

apollo/admin

![](assets/中间件/Apollo_安装/Apollo_安装-6.png)

  

项目创建：

  

![](assets/中间件/Apollo_安装/Apollo_安装-7.png)

  

![](assets/中间件/Apollo_安装/Apollo_安装-8.png)