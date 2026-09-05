### 介绍

  

JIRA是Atlassian公司出品的项目与事务跟踪工具，被广泛应用于缺陷跟踪（bug管理）、客户服务、需求收集、流程审批、任务跟踪、项目跟踪和敏捷管理等工作领域。

  

Confluence 是一个专业的企业知识管理与协同软件，也可以用于构建企业wiki。使用简单，但它强大的编辑和站点管理特征能够帮助团队成员之间共享信息、文档协作、集体讨论，信息推送。

  

**注意**：在互联网企业使用 Jira+Confluence 较为常见，而且二者往往都是配套一起部署和使用；

  

### 环境

  

-   CentOS 7.8.2003
-   Openresty 1.15.8.3
-   MySQL 5.7.30
-   PHP 7.4.6
-   Jira 8.9.0
-   JDK 1.8.0\_251
-   Tomcat 8.5.56
-   mysql-connector-java-5.1.48

  

#### 一、安装JDK并配置环境变量

  

##### 1.安装 JDK,如果你已经安装,此步略过.....

  

```ssh
mkdir -p /usr/local/java
tar zxf jdk-8u251-linux-x64.tar.gz -C /usr/local/java
```

  

##### 2.配置环境变量。

  

vim /etc/profile 加入行

  

```ssh
export JAVA_HOME=/usr/local/java/jdk1.8.0_251
export CLASSPATH=.:$JAVA_HOME/lib/tools.jar:$JAVA_HOME/lib/dt.jar:$JAVA_HOME/lib
export PATH=$JAVA_HOME/bin:$PATH
```

  

##### 3.让配置文件立即生效

  

```ssh
source /etc/profile
```

  

##### 4.检查是否安装成功

  

```ssh
java -version
```

  

出现以下信息代表安装成功:

  

```
java version "1.8.0_251"
Java(TM) SE Runtime Environment (build 1.8.0_251-b08)
Java HotSpot(TM) 64-Bit Server VM (build 25.251-b08, mixed mode)
```

  

#### 二、 安装 MySQL

  

##### 1.编译安装MySQL安装方法 [https://www.fooher.com/20191225\_290.html](https://www.fooher.com/20191225_290.html)

  

```ssh
rpm -ivh https://repo.mysql.com/mysql57-community-release-el7-11.noarch.rpm
yum install -y mysql-server
systemctl enable mysqld
systemctl start mysqld
```

  

##### 2.除此之外，我们还需要修改配置文件，修改密码策略：

  

```ssh
cat > /etc/my.cnf << EOF
[client]
port = 3306
socket = /tmp/mysql.sock
default-character-set = utf8mb4

[mysql]
prompt="MySQL [\\d]> "
no-auto-rehash

[mysqld]
port = 3306
user = mysql
socket = /tmp/mysql.sock
character-set-server=utf8mb4        //注意这个不能写成default-character-set=utf8，否则会导致5.7版本mysql无法打开

pid-file = mysql.pid
bind-address = 0.0.0.0
log_error = mysql_error.log

#开启查询缓存
slow_query_log = 1
long_query_time = 1
slow_query_log_file = mysql_slow.log

server-id = 10
binlog_cache_size = 4M
max_binlog_size = 1G
max-binlog-cache-size = 2G
max-relay-log-size = 1G
log_bin = MySQL-Bin
binlog_format = mixed
log_bin_index = Binlog.index
expire_logs_days = 7

default_storage_engine = InnoDB
innodb_file_per_table = 1
innodb_open_files = 500
#导入大的sql文件的方法
interactive_timeout = 28800
wait_timeout = 28800
connect_timeout = 20
#thread_concurrency = 8

[mysqlhotcopy]
interactive-timeout

[mysqldump]
quick
max_allowed_packet = 500M

[myisamchk]
key_buffer_size = 8M
sort_buffer_size = 8M
read_buffer = 4M
write_buffer = 4M
EOF
```

  

##### 2.修改 root 127.0.0.1 密码

  

```ssh
mysql -uroot -e "grant all privileges on *.* to root@'127.0.0.1' identified by "转载请注明来源地址,fooher.com" with grant option;"
```

  

##### 3.修改 root localhost 密码

  

```ssh
mysql -uroot -e "grant all privileges on *.* to root@'localhost' identified by "转载请注明来源地址,fooher.com" with grant option;"
```

  

##### 4.添加用户远程访问

  

```ssh
mysql -uroot -e "grant all privileges on *.* to jirauser@'%' identified by "转载请注明来源地址,fooher.com" with grant option;"
```

  

##### 5.创建 jira 数据库

  

```ssh
mysql -uroot -e "create database jira_db default character set utf8mb4 collate utf8mb4_unicode_ci;"
```

  

##### 6.授权 jirauser 访问  jira\_db 数据库权限

  

```ssh
mysql -uroot -e "grant all privileges on jira_db.* to 'jira_login'@'127.0.0.1' identified by "转载请注明来源地址,fooher.com" with grant option;"
```

  

**注意**：MySQL 5.7 使用的权限多了一个 REFERENCES，如果不正确授权会导致打开 Jira 后只能创建 Business 项目，而不能创建 Software 项目，且进入创建后的项目会报错

  

-   Solved: How to create Software Project, I see only Busines…
-   Connecting Jira applications to MySQL - Atlassian Documentation

  

##### 7.刷新数据库

  

```ssh
mysql -uroot -e "flush privileges;"
```

  

#### 三、 安装  Jira

  

##### 1.添加 系统 jira 用户：

  

JIRA\_USER=jira

  

```ssh
id -u jira >/dev/null 2>&1
[ $? -ne 0 ] && useradd -M -s /bin/bash ${JIRA_USER} || { [ -z "$(grep ^${JIRA_USER} /etc/passwd | grep '/bin/bash')" ] && usermod -s /bin/bash ${JIRA_USER}; }
```

  

##### 2.下载  Jira：

  

-   官方文档：

  

[Installing Jira applications on Linux - Atlassian Documentation](https://confluence.atlassian.com/adminjiraserver/installing-jira-applications-on-linux-938846841.html)

  

-   官方下载地址：[https://www.atlassian.com/software/jira/download](https://www.atlassian.com/software/jira/download)

  

```ssh
wget https://product-downloads.atlassian.com/software/jira/downloads/atlassian-jira-software-8.9.1.tar.gz
```

  

##### 3.解压安装 Jira：

  

```ssh
tar xzf atlassian-jira-software-8.9.0.tar.gz -C /usr/local/
cd /usr/local
/bin/mv atlassian-jira-software-8.9.0-standalone/ jira
```

  

##### 4.下载 MySQL Connector 驱动

  

在安装过程中如果选择使用 MySQL，连接测试时会提示 Could not find driver with class name: com.mysql.jdbc.Driver，

  

需要安装驱动  [MySQL :: Download Connector/J](https://dev.mysql.com/downloads/connector/j/5.1.html)

  

```ssh
wget https://dev.mysql.com/get/Downloads/Connector-J/mysql-connector-java-5.1.49.tar.gz
/bin/cp mysql-connector-java-5.1.49/ysql-connector-java-5.1.49.jar /usr/local/jira/atlassian-jira/WEB-INF/lib/
rm -rf mysql-connector-java-5.1.49/
```

  

##### 5.复制破解文件,这里暂时不提供破解补丁文件

  

-   将 atlassian-agent.jar 放在一个你不不会随便便删除的位置

  

```ssh
/bin/cp atlassian-agent.jar /usr/local/jira/atlassian-agent.jar
```

  

-   设置环境变量量 JAVA\_OPTS （这其实是Java的环境变量量，⽤用来指定其启动java程序时附带的参数），把-javaagent 参数附带上。具体可以这么做

  

```ssh
sed -i 's@export JAVA_OPTS@export JAVA_OPTS="-javaagent:/usr/local/jira/atlassian-agent.jar ${JAVA_OPTS}"@' /usr/local/jira/bin/setenv.sh
```

  

##### 6.优化配置 jira 文件

  

```ssh
rm -rf /usr/local/jira/{NOTICE,licenses,README.html,README.md,README.txt,BUILDING.txt,tomcat-docs,CONTRIBUTING.md}
rm -rf /usr/local/jira/bin/{*.bat,tomcat8.exe,tomcat8.exe.x64,tomcat8w.exe}
chmod +x /usr/local/jira/bin/*.sh
/bin/cp /usr/local/jira/conf/server.xml{,_bk}
```

  

##### 7.server.xml

  

```ssh
cat > /usr/local/jira/conf/tomcat.xml << EOF
<?xml version="1.0" encoding="utf-8"?>
<Server port="98005" shutdown="JIRAWORK">
    <Listener className="org.apache.catalina.startup.VersionLoggerListener"/>
    <Listener className="org.apache.catalina.core.AprLifecycleListener" SSLEngine="on"/>
    <Listener className="org.apache.catalina.core.JreMemoryLeakPreventionListener"/>
    <Listener className="org.apache.catalina.mbeans.GlobalResourcesLifecycleListener"/>
    <Listener className="org.apache.catalina.core.ThreadLocalLeakPreventionListener"/>

    <Service name="Catalina">
        <Connector port="8080"
                   server="Openresty 1.15.8.3"
                   maxHttpHeaderSize="8192"
                   URIEncoding="UTF-8"
                   maxThreads="1024"
                   minSpareThreads="25"
                   maxSpareThreads="1024"
                   enableLookups="false"
                   redirectPort="20443"
                   acceptCount="1000"
                   connectionTimeout="30000"
                   disableUploadTimeout="true"
                   useBodyEncodingForURI="true"
                   debug="0"
                   relaxedPathChars="[]|"
                   relaxedQueryChars="[]|{}^&#x5c;&#x60;&quot;&lt;&gt;"
                   bindOnInit="false"
                   compression="on"
                   compressionMinSize="2048"
                   noCompressionUserAgents="gozilla, traviata"
                   compressableMimeType="text/html,text/xml,text/javascript,text/css,text/plain,application/json"
                   protocol="org.apache.coyote.http11.Http11Protocol"/>
        <!--  protocol="HTTP/1.1"-->

        <Engine name="Catalina" defaultHost="localhost">
            <Host name="localhost" appBase="webapps" unpackWARs="true" autoDeploy="true">

                <Context path="" docBase="${catalina.home}/atlassian-jira" reloadable="false" useHttpOnly="true">
                    <Resource name="UserTransaction" auth="Container" type="javax.transaction.UserTransaction"
                              factory="org.objectweb.jotm.UserTransactionFactory" jotm.timeout="60"/>
                    <Manager pathname=""/>
                    <JarScanner scanManifest="false"/>
                    <Valve className="org.apache.catalina.valves.StuckThreadDetectionValve" threshold="120" />
                </Context>

            </Host>
            <Valve className="org.apache.catalina.valves.AccessLogValve"
                   pattern="%a %{jira.request.id}r %{jira.request.username}r %t &quot;%m %U%q %H&quot; %s %b %D &quot;%{Referer}i&quot; &quot;%{User-Agent}i&quot; &quot;%{jira.request.assession.id}r&quot;"/>
        </Engine>
    </Service>
</Server>
```

  

##### 8\. tomcat-users.xml

  

```ssh
cat > /usr/local/jira/conf/tomcat-users.xml << EOF
<?xml version='1.0' encoding='utf-8'?>
<tomcat-users xmlns="http://tomcat.apache.org/xml"
              xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
              xsi:schemaLocation="http://tomcat.apache.org/xml tomcat-users.xsd"
              version="1.0">
    <role rolename="admin-gui"/>
    <role rolename="admin-script"/>
    <role rolename="manager-gui"/>
    <role rolename="manager-status"/>
    <role rolename="manager-script"/>
    <role rolename="manager-jms"/>
    <user username="admin" password="ad97b335c5" roles="admin-gui,admin-script,manager-gui,manager-status,manager-script,manager-jms"/>
</tomcat-users>
EOF
```

  

##### 9.修改数据存放目录,请根据自己实际情况修改

  

```ssh
mkdir -p /data/logs/jiralogs /data/jira       # 设置权限
chown jira.jira -R /data/logs/jiralogs /data/jira
sed -i "s@^jira.home =.*@jira.home = /data/jira@" /usr/local/jira/atlassian-jira/WEB-INF/classes/jira-application.properties
```

  

##### 10.修改 jira 默认日志 catalina.out 的路径 215 行

  

```ssh
sed -i "s#AsyncFileHandler.directory = .*#AsyncFileHandler.directory = /data/logs/jiralogs#g" /usr/local/jira/conf/logging.properties
```

  

##### 11.隐藏tomcat版本信息

  

```ssh
cd /usr/local/jira/lib/
/bin/cp ../catalina.jar ../catalina.jar_bak
sed -i 's@^server.info=.*@server.info=Openresty@' org/apache/catalina/util/ServerInfo.properties
sed -i 's@^server.number=.*@server.number=1.15.8.3@' org/apache/catalina/util/ServerInfo.properties
sed -i "s@^server.built=.*@server.built=$(date)@" org/apache/catalina/util/ServerInfo.properties
jar cf ../catalina.jar ./*
```

  

##### 12.修改 Tomcat Connector 运行模式为 Apr

  

-   下载安装  Apr-1.7.0...

  

```ssh
wget http://archive.apache.org/dist/apr/apr-1.7.0.tar.gz
tar xzf apr-1.7.0.tar.gz > /dev/null
pushd apr-1.7.0 > /dev/null
./configure --prefix=/usr/local/apr
make -j 2 && make install
popd > /dev/null
rm -rf apr-1.7.0

pushd /usr/local/jira/bin > /dev/null 2>&1
tar xzf tomcat-native.tar.gz
pushd tomcat-native-*-src/native > /dev/null 2>&1
./configure --with-apr=${arp_install_dir}
```

  

#### 四、 启动&关闭  JIRA

  

```ssh
使用普通用户jira启动和停止
cd /usr/local/jira/
启动：
[jira_home]/bin/start-jira.sh
停止：
[jira_home]/bin/stop-jira.sh
```

  

##### 防火墙

  

```
firewall-cmd --zone=public --add-port=8080/tcp --permanent
firewall-cmd --reload
```

  

![](assets/中间件/部署Jira_8.9.0破解/部署Jira_8.9.0破解-1.png)

  

##### 1.验证是否配置成功

  

执⾏行行类似命令： ps aux|grep java 找到对应的进程看看-javaagent 参数是否正确附上

  

```ssh
ps -aux|grep javaagent
```

  

![](assets/中间件/部署Jira_8.9.0破解/部署Jira_8.9.0破解-2.png)

  

##### 2.查看启动日志

  

catclina.out 日志内应该能找到下面显示内容,确认已经配置好 agent

  

![](assets/中间件/部署Jira_8.9.0破解/部署Jira_8.9.0破解-3.png)

  

### 五、 使用反向代理访问 Jira

  

在安装完 Nginx 后，可以增加以下配置：

  

```ssh
server {
    listen       80;
    server_name  jira.fooher.com;
    client_max_body_size 60M;
    client_body_buffer_size 512k;
    location / {
        proxy_pass
        http://127.0.0.1:8080;
        proxy_redirect   off;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

  

使用 `systemctl restart nginx` 重启 Nginx 查看结果,配置完成后可以直接省略端口

  

### 六、 使用 [http://jira.fooher.com](http://jira.fooher.com) 访问

  

1.安装jira

  

![](assets/中间件/部署Jira_8.9.0破解/部署Jira_8.9.0破解-4.png)

  

![](assets/中间件/部署Jira_8.9.0破解/部署Jira_8.9.0破解-5.png)

  

![](assets/中间件/部署Jira_8.9.0破解/部署Jira_8.9.0破解-6.png)

  

点击测试数据库连接, 查看是否能连接数据库, 如果连接成功，需要您多等１到３分钟，大约需要创建255表

![](assets/中间件/部署Jira_8.9.0破解/部署Jira_8.9.0破解-7.png)

  

![](assets/中间件/部署Jira_8.9.0破解/部署Jira_8.9.0破解-8.png)

  

![](assets/中间件/部署Jira_8.9.0破解/部署Jira_8.9.0破解-9.png)

  

##### 2.使⽤用KeyGen

  

当你试着执⾏行行java -jar /path/to/atlassian-agent.jar 时应该可以看到输出的KeyGen参数帮助。

请仔细看看每个参数的作⽤用，特别是-p 参数的取值范围。

第三⽅方插件将其应⽤用密钥作为-p 参数。如： -p com.gliffy.integration.confluence

在Atlassian服务安装时你应该能看到类似： AAAA-BBBB-CCCC-DDDD 的 server id，请留留意。

提供了了正确的参数运⾏行行KeyGen会在终端输出计算好的激活码。

将⽣生成的激活码复制出来去激活你要使⽤用的服务。

  

Jira8.x版本破解生成密钥方法：

  

```ssh
java -jar atlassian-agent.jar -p jira -m service@fooher.com -n jirfan -o http://jira.fooher.com -s B60H-6CE7-0HUL-H9NM
```

  

![](assets/中间件/部署Jira_8.9.0破解/部署Jira_8.9.0破解-10.png)

  

![](assets/中间件/部署Jira_8.9.0破解/部署Jira_8.9.0破解-11.png)

  

![](assets/中间件/部署Jira_8.9.0破解/部署Jira_8.9.0破解-12.png)

  

![](assets/中间件/部署Jira_8.9.0破解/部署Jira_8.9.0破解-13.png)

  

![](assets/中间件/部署Jira_8.9.0破解/部署Jira_8.9.0破解-14.png)

  

![](assets/中间件/部署Jira_8.9.0破解/部署Jira_8.9.0破解-15.png)

  

![](https://www.fooher.com/wp-content/uploads/images/jira_20200602162.png)

  

![](https://www.fooher.com/wp-content/uploads/images/jira_20200602163.png)

  

![](https://www.fooher.com/wp-content/uploads/images/jira_20200618152846.png)

  

![](assets/中间件/部署Jira_8.9.0破解/部署Jira_8.9.0破解-16.png)

  

![](assets/中间件/部署Jira_8.9.0破解/部署Jira_8.9.0破解-17.png)

  

### 七、备份

  

注意：xml备份时不保证XML备份一致，因为在备份过程中可能会更新数据库。当生成具有不一致性的XML备份时，Jira不会报告任何警告或错误消息，并且此类XML备份将在还原过程中失败。在Jira处于活动状态时，本机数据库备份工具提供了更加一致和可靠的存储（和恢复）数据的方法。

jira的xml备份和confluence不同，不是完整备份

我目前采用的是【xml备份不包含附件】+【附件备份+数据库备份+家目录备份】两种方式共同使用。

  

```ssh
#!/bin/bash

export PATH=/usr/local/sbin:/usr/local/bin:/sbin:/bin:/usr/sbin:/usr/bin
clear
webserver_dir=$(dirname "`readlink -f $0`")
pushd ${webserver_dir} > /dev/null
# jira备份脚本
remote_IP=192.168.20.200
LogFile=/data/logs/jiralogs/jira-backup.log

##jira将xml备份(不包含附件)到 200 远程机器上,并将log输出到 /data/logs/jiralogs/jira-backup.log中
jira_dir=/data/jira/export
jira_remote=/backup/atlassian/jira/
jiraBegin=`date +"%Y-%m-%d %H:%M:%S"`
/usr/bin/rsync -avz --progress $jira_dir root@$remote_IP:$jira_remote
jiraEnd=`date +"$%Y-%m-%d %H:%M:%S"`
echo jira_backup_start:$jiraBegin end:$jiraEnd  >> $LogFile

##jira 将附件备份到 200 远程机器上，并将log输出到 jira-backup.log中
jira_dir_a=/data/jira/data/attachments
jira_remote_a=/backup/attachments/jira/
jira_a_Begin=`date +"%Y-%m-%d %H:%M:%S"`
/usr/bin/rsync -avz --progress $jira_dir_a root@$remote_IP:$jira_remote_a
jira_a_End=`date +"$%Y-%m-%d %H:%M:%S"`
echo jira_backup_start:$jira_a_Begin end:$jira_a_End  >> $LogFile

##jira将数据库备份到 200 远程机器上，并将log输出到jira-backup.log中
jira_dir_pg=/backup/pgBackup/jira/
jira_remote_pg=/backup/database/jira/
jira_pg_Begin=`date +"%Y-%m-%d %H:%M:%S"`
/usr/bin/rsync -avz --progress $jira_dir_pg root@$remote_IP:$jira_remote_pg
jira_pg_End=`date +"$%Y-%m-%d %H:%M:%S"`
echo wiki_backup_start:$jira_pg_Begin end:$jira_pg_End  >> $LogFile
```

  

### 九、备份找回JIRA中管理员密码

  

JIRA 忘记 admin 密码的恢复方法-- 更改密码为 123456789

  

```ssh
mysql -uroot -p"转载请注明来源地址,fooher.com" -e "update cwd_user set credential='x6KBlJr12zeLIvjpb7URV7gMIEjnMO6wJ48UOn7d4D2tc8bbKx/3zkKO7H7v4Nsg' where user_name='admin';"
```

  

### 十、配置好jira的邮件

  

Jira首次登陆后，同样要配置好jira的邮件发送功能，用于创建用户/邀请用户、发送通知等。

依次点击右上角设置图标的"系统"->"电邮"->"外发邮件"

![](assets/中间件/部署Jira_8.9.0破解/部署Jira_8.9.0破解-18.png)

  

![](https://www.fooher.com/wp-content/uploads/images/jira_20200618152958.png)

  

![](https://www.fooher.com/wp-content/uploads/images/jira_20200618152959.png)

  

![](https://www.fooher.com/wp-content/uploads/images/jira_20200618152960.png)

  

![](assets/中间件/部署Jira_8.9.0破解/部署Jira_8.9.0破解-19.png)

  

![](assets/中间件/部署Jira_8.9.0破解/部署Jira_8.9.0破解-20.png)

  

**接着还可以再设置"接收邮件"功能**

  

![](assets/中间件/部署Jira_8.9.0破解/部署Jira_8.9.0破解-21.png)

  

![](https://www.fooher.com/wp-content/uploads/images/jira_20200618152964.png)

  

![](https://www.fooher.com/wp-content/uploads/images/jira_20200618152965.png)

  

**这样邮件功能就设置完成了，然后就可以使用邮件方式邀请用户或创建用户以及分享、通知等。**

\---------------------------------------------------------------------------------------------

  

**到此 jira8 软件的安装破解工作就已经基本完成了，后续再介绍confluence连接jira，及其对接LDAP的操作记录。**

  

\*\* *当你发现自己的才华撑不起野心时，就请安静下来学习吧！*