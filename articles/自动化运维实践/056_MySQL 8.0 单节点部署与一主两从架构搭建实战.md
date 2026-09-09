---
title: MySQL 8.0 单节点部署与一主两从架构搭建实战
---

**前言：在数据驱动的时代，数据库作为数据存储与管理的核心组件，其架构的选择与配置对系统的性能、可用性和扩展性至关重要。MySQL 作为一款广泛应用的开源关系型数据库，凭借其稳定的性能和丰富的功能，深受开发者和企业的青睐。​**  
**MySQL 8.0 版本带来了许多新特性和改进，无论是单节点部署还是主从架构搭建，都有其独特的优势和适用场景。单节点部署简单便捷，适用于小型应用或开发测试环境，能快速满足基本的数据存储需求；而一主两从架构则在高可用性、读写分离、数据备份等方面表现出色，适用于中大型系统，可有效提升系统的性能和可靠性。​**  
**本文将详细介绍 MySQL 8.0 单节点的部署流程，包括环境准备、安装配置等关键步骤。同时，针对手动配置一主两从架构，从主服务器的配置、从服务器的设置到主从复制的启动与验证，进行全面且深入的讲解。通过实际操作示例和注意事项的说明，帮助读者掌握相关技术要点，以便根据实际需求选择合适的数据库架构，为系统的数据管理奠定坚实基础。**

## 一、单节点 MySQL 8.0 安装与基础配置

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

命令：`systemctl enable mysqld`   
验证：返回结果为 enabled，则表示开机自启已成功设置

## 二、手动搭建一主两从架构

**这里就先不展示ansible自动化脚本了，执行后虽然是一步安装好，但是无法展示部署细节，下面我写下手动搭建mysql主从的具体步骤，便于理解些**

### 环境规划

| 角色 | IP地址 | server_id | 数据目录 | 密码统一 |
| --- | --- | --- | --- | --- |
| 主库(Master) | 192.168.1.100 | 101 | /var/lib/mysql | Root@2023# |
| 从库1(Slave) | 192.168.1.101 | 102 | /var/lib/mysql | Root@2023# |
| 从库2(Slave) | 192.168.1.102 | 103 | /var/lib/mysql | Root@2023# |

### 1. 初始化从库密码

从库都执行 ：`grep 'temporary password' /db/mysql/3306/log/errorlog/error.log|awk -F ' ' '{print $NF}'`    
生成密码：

```
从库1：MlMQppp1Si.h							
从库2：M9xiHdG7E+u
```

后`mysql -uroot -p`输入上述密码登录：   
这个只是初始密码，要改掉成为跟主库一样的，`ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'Root@2023#';`两个从库都执行这个命令，然后退出

### 2.从库创建用户并分配相应的权限

在从库上创建必要的用户和权限：

```
-- 创建管理用户
CREATE USER 'mysqladmin'@'%' IDENTIFIED WITH mysql_native_password BY 'Ma8gTsn19ln#';
GRANT ALL PRIVILEGES ON *.* TO 'mysqladmin'@'%' WITH GRANT OPTION;

-- 创建应用程序用户，允许进行常见的 DML 操作
CREATE USER 'appuser'@'%' IDENTIFIED WITH mysql_native_password BY 'Ma8gTsn19ln!';
GRANT SELECT, UPDATE, DELETE, INSERT ON *.* TO 'appuser'@'%';

-- 创建报表用户，仅允许进行查询操作
CREATE USER 'report'@'%' IDENTIFIED WITH mysql_native_password BY 'Ma8gTsn19ln!';
GRANT SELECT ON *.* TO 'report'@'%';

-- 创建备份用户，用于本地备份操作
CREATE USER 'bakuser'@'localhost' IDENTIFIED BY '57xUJQObLvM3KPux!';
GRANT ALL ON *.* TO 'bakuser'@'localhost';

-- 创建监控用户，赋予监控相关权限
CREATE USER 'orch_monitor'@'%' IDENTIFIED WITH mysql_native_password BY 'Monitor123456##915';
GRANT RELOAD, PROCESS, SUPER, REPLICATION SLAVE, REPLICATION CLIENT ON *.* TO 'orch_monitor'@'%';

-- 创建 proxysql 用户，允许进行常见的 DML 操作
CREATE USER 'proxysql'@'%' IDENTIFIED WITH mysql_native_password BY 'Wbymc521!@#';
GRANT SELECT, UPDATE, DELETE, INSERT ON *.* TO 'proxysql'@'%';

-- 创建 exporter 用户，赋予监控工具所需的权限
CREATE USER 'exporter'@'%' IDENTIFIED WITH mysql_native_password BY 'Exq#Py29!';
GRANT SELECT, PROCESS, REPLICATION CLIENT, RELOAD ON *.* TO 'exporter'@'%';

-- 创建复制用户，用于主从复制
CREATE USER 'repl'@'%' IDENTIFIED WITH mysql_native_password BY 'Aepl@897';
GRANT REPLICATION SLAVE ON *.* TO 'repl'@'%';
FLUSH PRIVILEGES;
```

命令：`select user,host from mysql.user;`  
检查下3台机的`select user,host from mysql.user;`  是不是一样的  

### 3. 配置主从复制

在两个从库执行以下语句，切记不要在主库上执行：

```
reset master;
change master to master_host='主库ip',master_port=3306,master_user='repl',master_password='Repl@123',master_auto_position=1;
start slave;
```

### 4.两个从库执行下 以下命令，查看结果

命令：`show slave status\G`  
**从库判断依据：**  
`Slave_IO_Running`：如果这个参数的值为Yes，则表示从服务器的IO线程正在运行，该服务器是作为从库的。  
`Slave_SQL_Running`：如果这个参数的值也是Yes，则表示从服务器的SQL线程也在运行，该服务器同样是作为从库的。  
如果一个MySQL服务器是主库，那么它不会有这些复制相关的参数，或者这些参数的值会是空的或者显示为No。

**主库判断依据：**  
`Master_UUID`：在主库上，这个参数会显示一个唯一的标识符，而在从库上，这个参数通常不会显示。  
`Read_Master_Log_Pos`：在主库上，这个参数通常为0，因为它不读取任何主日志位置。

### 5.所有节点查看是否只读

命令：`SELECT @@read_only;`  
这里查询的结果，从库只能为1；主库要为0，如果主库不为0，用下面的命令修改：

```
set global read_only=0;
grant all privileges on *.* to appuser@'%';
```

### 6.quit退出mysql命令行，执行以下命令，查看server_id

```
mysql -u appuser -h 主库 -p'密码' -e "select @@server_id;"
mysql -u appuser -h 从库1 -p'密码' -e "select @@server_id;"
mysql -u appuser -h 仓库2 -p'密码' -e "select @@server_id;"
```

**这里的输出结果，主库不能和从库一样，然后两个从库的输出值也不能一样，如果一样需要按下面的方法修正**

### 7.三个节点查看相关数值，查看各自是否能对上

```
cat /etc/my.cnf|grep server_id
cat /etc/my.cnf|grep innodb_buffer_pool_size
cat /etc/my.cnf|grep report_host
```

### 8. 修改从库核心配置

编辑 `vim /etc/my.cnf` 文件，添加以下内容：

```
server_id=102                   # 从库 1 设为 102，从库 2 设为 103
relay_log=relay-bin             # 中继日志文件，建议根据实际情况合理配置具体参数
read_only=1                     # 开启只读模式
super_read_only=1               # 增强只读保护
innodb_buffer_pool_size=30G     # 以当前服务器实际内存为准
```

重启服务：

```
systemctl restart mysqld
```

Mysql各节点全部都重启下，然后各节点使用 `步骤6.`的命令查看是否生效  
在主库执行：`set global read_only=0;`

### 9.两个从库都执行以下命令，查看Slave_IO_Running和Slave_SQL_Running是否为Yes

命令：`show slave status\G`

### 10.查看从库的innodb_buffer_pool_size当前值是否一致

命令：`show global variables like 'innodb_buffer_pool_size';`

### 11.主库执行命令查看是否将从库的ip加进来

命令：`show slave hosts;`

### 12.开启两个从库所有用户的只读（步骤可选）

set global read_only=1;set global super_read_only=1;

### 13.三个节点配置开机自启

参考MYSQL单节点部署的

## 三、以上步骤如果还是未能生效，可参考以下可选步骤：

### 1. 连接主库并启动复制（可选）

在从库上执行以下命令：

```
mysql -u root -p'Root@2023#'

STOP SLAVE;  # 停止可能存在的旧复制线程

CHANGE MASTER TO 
  MASTER_HOST='192.168.1.100',    # 主库 IP 地址
  MASTER_PORT=3306,
  MASTER_USER='repl',             # 复制用户
  MASTER_PASSWORD='Repl@123',     # 复制用户密码
  MASTER_AUTO_POSITION=1;         # 使用 GTID 自动定位

START SLAVE;  # 启动复制线程
```

### 2. 主从状态验证（可选）

#### ① 从库复制状态检查

检查从库的复制状态：

```
SHOW SLAVE STATUS\G

# 检查以下关键参数：
# Slave_IO_Running: Yes       （IO 线程正常）
# Slave_SQL_Running: Yes       （SQL 线程正常）
# Seconds_Behind_Master: 0     （无延迟）
```

#### ② 主库查看从库连接

在主库上查看从库连接情况：

```
SHOW SLAVE HOSTS;
```

#### ③ 数据一致性验证

在主库上创建测试数据库和表：

```
CREATE DATABASE test;
USE test;
CREATE TABLE t1(id INT PRIMARY KEY);
INSERT INTO t1 VALUES(1);
```

在从库上验证数据是否同步：

```
SELECT * FROM test.t1;  # 应返回与主库一致的数据
```

## 四、常见问题与解决方案

### 1. 初始化失败：权限不足

```
# 创建日志文件并设置权限
touch /var/log/mysqld.log
chown mysql:mysql /var/log/mysqld.log
chmod 644 /var/log/mysqld.log

# 重新初始化
mysqld --defaults-file=/etc/my.cnf --initialize --user=mysql --basedir=/usr --datadir=/var/lib/mysql
```

### 2. SELinux 导致初始化失败

```
# 临时关闭 SELinux
setenforce 0

# 永久修改（编辑 /etc/selinux/config）
SELINUX=disabled
```

### 3. 从库复制线程中断

修复步骤：

1. 在主库上刷新日志：

   ```
   FLUSH LOGS;
   ```
2. 在从库上重置复制状态：

   ```
   RESET SLAVE;
   ```
3. 重新配置复制并启动：

   ```
   CHANGE MASTER TO 
     MASTER_HOST='主库 IP',
     MASTER_PORT=3306,
     MASTER_USER='repl',
     MASTER_PASSWORD='Repl@123',
     MASTER_AUTO_POSITION=1;
   START SLAVE;
   ```

## 五、最佳实践与注意事项

### 1. 配置文件模板

```
[mysqld]
# 基础配置
port=3306
lower_case_table_names=1        # 表名不区分大小写

# 字符集
character-set-server=utf8mb4
collation-server=utf8mb4_bin

# 连接与性能
max_connections=10000
innodb_lock_wait_timeout=500

# 复制相关（主库）
log_bin=mysql-bin
server_id=101

# 复制相关（从库）
relay_log=relay-bin
read_only=1
super_read_only=1
```

### 2. 生产环境建议

- **定期备份**：使用 `mysqldump --master-data` 或物理备份工具
- **监控指标**：关注连接数和缓冲池命中率
- **版本一致性**：确保主从节点版本相同
- **防火墙设置**：开放 3306 端口，允许从库 IP 连接

通过以上步骤，我们完成了 MySQL 8.0 单节点安装及手动一主两从架构搭建。手动配置的优势在于可控性强，适合理解复制原理，后续维护也更便捷。生产环境中建议结合监控工具（如 Prometheus+Grafana）实时跟踪复制状态，确保数据高可用性与一致性。
