# linux rpm安装

> 分类：Database / 第10章：MySQL部署
> 原文：https://www.cuiliangblog.cn/detail/section/31461021
> 来源：崔亮的博客

---

## 下载rpm安装包
+ 访问MySQL官网[https://downloads.mysql.com/archives/community/](https://downloads.mysql.com/archives/community/)，因为我的操作系统是 rockylinux8.10。安装的版本如下：

![](assets/07-Database/925606b5064fe3479797.png)

+ 复制下载地址

```bash
wget https://cdn.mysql.com//Downloads/MySQL-8.4/mysql-8.4.4-1.el8.x86_64.rpm-bundle.tar
```

## 安装软件
解压

```bash
[root@mysql-2 ~]# mkdir mysql
[root@mysql-2 ~]# tar -xf mysql-8.4.4-1.el8.x86_64.rpm-bundle.tar -C /root/mysql/
[root@mysql-2 ~]# cd /root/mysql/
[root@mysql-2 mysql]# ls
mysql-community-client-8.4.4-1.el8.x86_64.rpm                    mysql-community-libs-compat-8.4.4-1.el8.x86_64.rpm
mysql-community-client-debuginfo-8.4.4-1.el8.x86_64.rpm          mysql-community-libs-compat-debuginfo-8.4.4-1.el8.x86_64.rpm
mysql-community-client-plugins-8.4.4-1.el8.x86_64.rpm            mysql-community-libs-debuginfo-8.4.4-1.el8.x86_64.rpm
mysql-community-client-plugins-debuginfo-8.4.4-1.el8.x86_64.rpm  mysql-community-server-8.4.4-1.el8.x86_64.rpm
mysql-community-common-8.4.4-1.el8.x86_64.rpm                    mysql-community-server-debug-8.4.4-1.el8.x86_64.rpm
mysql-community-debuginfo-8.4.4-1.el8.x86_64.rpm                 mysql-community-server-debug-debuginfo-8.4.4-1.el8.x86_64.rpm
mysql-community-debugsource-8.4.4-1.el8.x86_64.rpm               mysql-community-server-debuginfo-8.4.4-1.el8.x86_64.rpm
mysql-community-devel-8.4.4-1.el8.x86_64.rpm                     mysql-community-test-8.4.4-1.el8.x86_64.rpm
mysql-community-icu-data-files-8.4.4-1.el8.x86_64.rpm            mysql-community-test-debuginfo-8.4.4-1.el8.x86_64.rpm
mysql-community-libs-8.4.4-1.el8.x86_64.rpm
```

安装 mysql

```bash
[root@mysql-2 mysql]# dnf -y install ./*
```

启动服务

```bash
[root@mysql-2 mysql]# systemctl start mysqld
[root@mysql-2 mysql]# systemctl enable mysqld
[root@mysql-2 mysql]# systemctl status mysqld
```

登录

```bash
# 查看日志获取初始密码
[root@mysql-2 mysql]# cat /var/log/mysqld.log | grep password
2025-03-03T12:48:09.792955Z 6 [Note] [MY-010454] [Server] A temporary password is generated for root@localhost: FW?x!utGg7Ub
# 使用初始密码登录
[root@mysql-2 mysql]# mysql -u root -p
Enter password: 
Welcome to the MySQL monitor.  Commands end with ; or \g.
Your MySQL connection id is 8
Server version: 8.4.4

Copyright (c) 2000, 2025, Oracle and/or its affiliates.

Oracle is a registered trademark of Oracle Corporation and/or its
affiliates. Other names may be trademarks of their respective
owners.

Type 'help;' or '\h' for help. Type '\c' to clear the current input statement.

mysql>
```

## 密码修改
```json
# mysql8初始对密码要求高，简单的字符串不让改，先修改一个用户密码（按照安全要求修改）
mysql> alter user 'root'@'localhost' identified by 'CHANGE_ME';
Query OK, 0 rows affected (0.01 sec)
mysql> 

# 降低安全策略
mysql> set global validate_password.policy=0;
Query OK, 0 rows affected (0.00 sec)
mysql> set global validate_password.length=1;
Query OK, 0 rows affected (0.00 sec)

# 设置简单密码
mysql> alter user 'root'@'localhost' identified by 'CHANGE_ME';
Query OK, 0 rows affected (0.01 sec)

# 用户root用户远程登录
mysql> rename user root@localhost to root@'%';
Query OK, 0 rows affected (0.02 sec)
```

+ 也可以在配置文件中更改密码安全策略配置

```bash
[root@mysql-2 mysql]# vim /etc/my.cnf
validate_password.policy=0
validate_password.length=1
```

## 修改存储路径
> 默认数据目录为：datadir=/var/lib/mysql(该数据目录占用根目录空间)，此时需要更改数据目录为其他目录(比如非系统盘目录)
>

查看当前数据目录

```bash
# 登录数据库
[root@mysql-1 ~]# mysql -u root -p
# 查看确认数据目录路径（查看datadir 那一行所指的路径）
mysql> show variables like '%dir%';
+-----------------------------------------+--------------------------------+
| Variable_name                           | Value                          |
+-----------------------------------------+--------------------------------+
| basedir                                 | /usr/                          |
| binlog_direct_non_transactional_updates | OFF                            |
| character_sets_dir                      | /usr/share/mysql-8.4/charsets/ |
| datadir                                 | /var/lib/mysql/                |
| innodb_data_home_dir                    |                                |
| innodb_directories                      |                                |
| innodb_doublewrite_dir                  |                                |
| innodb_log_group_home_dir               | ./                             |
| innodb_max_dirty_pages_pct              | 90.000000                      |
| innodb_max_dirty_pages_pct_lwm          | 10.000000                      |
| innodb_redo_log_archive_dirs            |                                |
| innodb_temp_tablespaces_dir             | ./#innodb_temp/                |
| innodb_tmpdir                           |                                |
| innodb_undo_directory                   | ./                             |
| lc_messages_dir                         | /usr/share/mysql-8.4/          |
| plugin_dir                              | /usr/lib64/mysql/plugin/       |
| replica_load_tmpdir                     | /tmp                           |
| slave_load_tmpdir                       | /tmp                           |
| tmpdir                                  | /tmp                           |
+-----------------------------------------+--------------------------------+
```

切换数据目录

```bash
# 停止mysql服务
[root@mysql-1 ~]# systemctl stop mysqld
# 创建数据目录
[root@mysql-1 ~]# mkdir -p /data/mysql
# 移动数据
[root@mysql-1 ~]# cp -R /var/lib/mysql/* /data/mysql/
[root@mysql-1 ~]# chown -R mysql:mysql /data/mysql
# 查看
[root@mysql-1 ~]# cd /data/mysql/
[root@mysql-1 mysql]# ls
 auto.cnf        binlog.index   client-cert.pem     '#ib_16384_1.dblwr'  '#innodb_redo'   mysql.ibd               private_key.pem   server-key.pem   undo_002
 binlog.000001   ca-key.pem     client-key.pem       ib_buffer_pool      '#innodb_temp'   mysql_upgrade_history   public_key.pem    sys
 binlog.000002   ca.pem        '#ib_16384_0.dblwr'   ibdata1              mysql           performance_schema      server-cert.pem   undo_001
```

修改配置文件(datadir指向新的数据目录)

```bash
[root@mysql-1 ~]# vim /etc/my.cnf
datadir=/data/mysql
[root@mysql-1 ~]# systemctl restart mysqld.service 
```

查看验证

```bash
[root@mysql-1 ~]# mysql -u root -p
Enter password: 
Welcome to the MySQL monitor.  Commands end with ; or \g.
Your MySQL connection id is 8
Server version: 8.4.4 MySQL Community Server - GPL

Copyright (c) 2000, 2025, Oracle and/or its affiliates.

Oracle is a registered trademark of Oracle Corporation and/or its
affiliates. Other names may be trademarks of their respective
owners.

Type 'help;' or '\h' for help. Type '\c' to clear the current input statement.

mysql> show variables like '%dir%';
+-----------------------------------------+--------------------------------+
| Variable_name                           | Value                          |
+-----------------------------------------+--------------------------------+
| basedir                                 | /usr/                          |
| binlog_direct_non_transactional_updates | OFF                            |
| character_sets_dir                      | /usr/share/mysql-8.4/charsets/ |
| datadir                                 | /data/mysql/                   |
```

## <font style="color:rgb(26, 32, 44);">启用 MySQL Native Password 插件</font>
<font style="color:rgb(51, 51, 51);">MySQL8.0.4开始，默认</font><font style="color:rgb(0, 82, 217);">身份认证</font><font style="color:rgb(51, 51, 51);">开始改变。因为之前，</font><font style="color:rgb(0, 82, 217);">MySQL</font><font style="color:rgb(51, 51, 51);">的密码认证插件是“mysql_native_password”，而现在使用的是“caching_sha2_password”，如果有些老的客户端需要连接 mysql，则需要启用</font><font style="color:rgb(26, 32, 44);">MySQL Native Password 插件</font>

```bash
[root@mysql-1 ~]# vim /etc/my.cnf
mysql_native_password=CHANGE_ME
[root@mysql-1 ~]# systemctl restart mysqld
```

## 忘记密码


1. 修改 /etc/my.cnf配置文件，启动时不验证密码

![](assets/07-Database/511692b02a6e25f30619.png)

1. 重启服务，使用root登录

![](assets/07-Database/3ee7de02e541f6f763a7.png)

2. 重新修改密码

![](assets/07-Database/527d071bb9629e7f988e.png)

3. 开启登录验证，重启mysqld

![](assets/07-Database/5a0dd4d73efc3e6723f9.png)

![](assets/07-Database/f1899fe859a362d8a85d.png)

![](assets/07-Database/d6f02546835e8c3905aa.png)

1. 使用新密码登录

## 自定义提示符
1. 编辑系统变量配置文件

![](assets/07-Database/e496b2d71015898b3d70.png)

2. 添加配置

![](assets/07-Database/117ca9bca024c73c6f22.png)

3. 重载配置文件

![](assets/07-Database/2e93f72eb290d50ee522.png)

4. 登录验证

![](assets/07-Database/882d7f704ad59cf91050.png)

 


