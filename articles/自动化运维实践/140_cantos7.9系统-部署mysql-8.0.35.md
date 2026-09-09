---
title: cantos7.9系统-部署mysql-8.0.35
---

**前言:MySQL是一个流行的开源关系型数据库管理系统（RDBMS），它基于SQL（Structured Query Language）进行操作。以下是MySQL的一些基本介绍：**

1. **开源**：MySQL由瑞典MySQL AB公司开发，后来被Sun Microsystems公司收购，再后来被Oracle公司收购。MySQL的社区版是完全开源的，遵循GPL（通用公共许可证）。
2. **跨平台**：MySQL可以在多种操作系统上运行，包括多种Unix和Linux变体、Windows和macOS。
3. **高性能**：MySQL以其高性能和可靠性而闻名，适合处理大量数据和高并发的数据库访问。
4. **多功能性**：MySQL支持多种数据类型，包括数值、日期和时间、字符串等，并且支持多种存储引擎，如InnoDB、MyISAM、Memory等，每种存储引擎都有其特定的特性和用途。
5. **安全性**：MySQL提供了强大的数据加密和访问控制功能，以保护数据安全。
6. **灵活性**：MySQL支持多种编程语言，包括PHP、Java、C++、Python等，使其可以轻松集成到各种应用程序中。
7. **可扩展性**：MySQL可以通过多种方式进行扩展，包括增加更多的硬件资源、使用分区、复制和集群技术。
8. **ACID兼容**：MySQL支持ACID（原子性、一致性、隔离性、持久性）事务，这对于许多需要事务处理的应用程序来说非常重要。
9. **备份和恢复**：MySQL提供了多种数据备份和恢复工具，以确保数据的完整性和可恢复性。
10. **社区支持**：MySQL有一个活跃的社区，提供了大量的文档、教程和论坛支持，帮助用户解决各种问题。

MySQL广泛应用于网站和网络应用、企业软件解决方案以及各种需要数据库支持的场合。随着云计算的发展，MySQL也被广泛用于云数据库服务中。

### 部署mysql：

### 第一步：卸载系统自带mariadb

查看系统自带的Mariadb：`rpm -qa|grep mariadb`  
卸载系统自带的Mariadb：`rpm -e --nodeps mariadb-libs-5.5.44-2.el7.centos.x86_64`  
删除etc目录下的my.cnf：`rm -rf /etc/my.cnf`  
检查mysql是否存在：`rpm -qa | grep mysql`

### 第二步：将下载的mysql安装包`mysql-8.0.35-1.el7.x86_64.rpm-bundle`上传到指定路径/usr/local

### 第三步：在当前目录下创建一个 mysql-8.0.35 文件夹，解压安装包到该目录下

命令：`tar -xvf mysql-8.0.35-1.el7.x86_64.rpm-bundle`

### 第四步：下载并安装mysql依赖的插件

命令：`yum -y install openssl-devel；yum -y install libaio；yum -y remove mysql-libs`

### 第五步：装完该插件之后，依次按顺序执行以下命令安装这些 rpm 包

```
rpm -ivh mysql-community-server-8.0.28-1.el7.x86_64.rpm --force --nodeps
rpm -ivh mysql-community-client-plugins-8.0.35-1.el7.x86_64.rpm
rpm -ivh mysql-community-common-8.0.35-1.el7.x86_64.rpm
......
报错处理：
yum install perl-JSON
yum install -y perl-Module-Install.noarch
```

### 第六步：修改配置文件

命令：`vim /etc/my.cnf`  
加入以下内容：

```
[mysqld]
##设置端口
port=3306
##设置字符集
character-set-server=utf8mb4
##不区分大小写
lower_case_table_names=1
##group_concat()函数默认长度1024，需要调整200000
group_concat_max_len=200000
##数据库最大连接数100，改为10000
max_connections=10000
##锁等待的时间是默认为50s，修改为500
innodb_lock_wait_timeout=500
```

### 第七步：MySQL 安装好了之后系统会自动的注册一个服务，服务名称叫做 mysqld，所以可以通过以下命令操作 MySQL：

启动 MySQL 服务：`systemctl start mysqld`  
重启 MySQL 服务：`systemctl restart mysqld`  
关闭 MySQL 服务：`systemctl stop mysqld`  
先启动mysql服务

### 第八步：rpm 安装 MySQL 会自动生成一个随机密码，可在 `/var/log/mysqld.log` 这个文件中查找该密码

### 第九步：连接 MySQL

命令：`mysql -u root –p或mysql -uroot –p`  
这里如果报错：2800.且根本就没用登录密码的界面，无法登录数据库  

做以下操作处理：

### 第十步：在修改配置之前，先把 mysql 服务停止

命令：`systemctl stop mysqld.service`

### 第十一步：删除错误日志

命令：`rm -rf /var/log/mysqld.log`

### 第十二步：递归删除 /var/lib/mysql 目录下面的内容

命令：`cd /var/lib/mysql`   
`rm -rf *` #递归删除

### 第十三步：删除原目录，创建数据库目录并授权

命令：`rm -rf /var/lib/mysql`  
进入/var/lib 目录，创建目录：`cd /var/lib && mkdir mysql`  
赋权：`chown -R mysql:mysql mysql`

### 第十四步：初始化 MySql

命令：`mysqld --defaults-file=/etc/my.cnf --initialize --user=mysql --basedir=/var/lib/mysql --datadir=/var/lib/mysql`  
启动服务：`systemctl start mysqld.service`  
查看服务：`systemctl status mysqld.service`

### 第十五步：连接数据库，修改root用户密码

命令：`mysql -uroot –p`并输入密码

### 第十六步：1.8修改root用户密码

命令：`ALTER USER 'root'@'localhost' IDENTIFIED BY 'fjdkjkfhkfjlgk';`

### 第十七步：创建用户与权限分配

命令：`create user 'mysqladmin'@'%' IDENTIFIED WITH mysql_native_password BY 'Dfdghjgkjdl';`  
命令：`grant all on *.* to 'mysqladmin'@'%';`  
命令：`flush privileges;`

### Myaql开机自启动：

### 方法一：

命令：`systemctl enable mysqld`  
如果不生效，采用方法二

### 方法二：

搜索mysql.server文件：`find / -name 'mysql.server'`  
根据实际路径来，替换如下方法路径：  
先将/usr/local/mysql/mysql/support-files/ 文件夹下的mysql.server文件复制到 /etc/rc.d/init.d/ 目录下mysqld  
命令: `cp /usr/local/mysql/mysql/support-files/mysql.server /etc/rc.d/init.d/mysqld`  
赋予可执行权限：`chmod +x /etc/init.d/mysqld`  
添加为服务: `chkconfig --add mysqld`  
查看服务列表: `chkconfig --list`  
看到3、4、5状态为开或者为 on 则表示成功。如果是 关或者 off 则执行一下：`chkconfig --level 345 mysqld on`

重启计算机:`reboot`（***这条命令谨慎使用，会影响业务短暂的停止）
