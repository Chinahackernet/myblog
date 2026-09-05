用xtarbackup来同步数据，然后基于GTID来设置主从。

# 一、用xtarbackup备份数据库

## 1.1 优势

使用xtarbackup来做主从的前期准备是因为xtarbackup备份数据和恢复数据都很快，特别适合数据量很大的数据库备份，而且它的安装非常的简单，使用也很简单....(巴拉巴拉，废话编不出来了)。

  

## 1.2 安装

具体版本根据自己的具体情况来选择。就下面这几步就安装好了，是不是非常简单.....

```plain
# rpm -Uvh https://www.percona.com/redir/downloads/percona-release/redhat/percona-release-0.1-3.noarch.rpm
# yum list | grep percona
# yum -y install perl perl-devel libaio libaio-devel perl-Time-HiRes perl-DBD-MySQL 
# rpm -Uvh ftp://rpmfind.net/linux/epel/6/x86_64/libev-4.03-3.el6.x86_64.rpm
# yum install percona-xtrabackup –y
```

## 1.3 使用

### 1.3.1 普通备份

```plain
innobackupex --defaults-file=/etc/my.cnf --user=root --password=123456 /data/backupMysql/
```

  

### 1.3.2 tar备份

（1）、备份到本地

```bash
# 不压缩
innobackupex --defaults-file=/etc/my.cnf --user=root --password=123456 --stream=tar /data/backupMysql/>/data/mysql.tar

# 压缩
innobackupex --defaults-file=/etc/my.cnf --user=root --password=123456 --stream=tar /data/backupMysql/ | gzip >/data/mysql.tar.gz
```

（2）、备份到远程

```bash
# 不压缩
innobackupex --defaults-file=/etc/my.cnf --user=root --password=123456 --stream=tar /data/backupMysql/ | ssh root@192.168.1.7 \ "cat - >/data/mysql.tar

# 压缩
innobackupex --defaults-file=/etc/my.cnf --user=root --password=123456 --stream=tar /data/backupMysql/ | | ssh root@192.168.1.7 \ "gzip >/data/mysql.tar.gz
```

（3）、解压方式

```bash
# 未经过压缩的文件解压
tar xvf mysql.tar -C /data

# 压缩过的文件解压
tar zxvf mysql.tar.gz -C /data
```

  

### 1.3.3 xbstream备份

（1）、备份到本地

```bash
# 不压缩
innobackupex --defaults-file=/etc/my.cnf --user=root --password=123456 --stream=xbstream /data/backupMysql/>/data/mysql.xbstream

# 压缩
innobackupex --defaults-file=/etc/my.cnf --user=root --password=123456 --stream=xbstream --compress /data/backupMysql/ >/data/mysql_compress.xbstream
```

  

（2）、备份要远程

```bash
# 不压缩
innobackupex --defaults-file=/etc/my.cnf --user=root --password=123456 --stream=xbstream /data/backupMysql/| ssh root@192.168.1.7 "xbstream -x -C /backup/stream"

# 压缩
innobackupex --defaults-file=/etc/my.cnf --user=root --password=123456 --stream=xbstream --compress /data/backupMysql/ | ssh root@192.168.1.7 "xbstream -x -C /backup/stream"
```

  

（3）、解压方式

```bash
#### 未压缩的
xbstream -x < mysql.xbstream -C /data

#### 压缩过的
# 1、先解压xbstream
xbstream -x < mysql_compress.xbstream -C /data
# 2、再解压qp压缩格式
for bf in `find . -iname "*\.qp"`; do qpress -d $bf $(dirname $bf) && rm $bf; done

注：如果xtrabackup版本大于2.1.4，可以直接通过以下方式解压第二步。
innobackupex --decompress /data
```

### 1.3.4 恢复

先将原备份压缩包解压到一个目录，然后执行下面语句恢复。

```bash
innobackupex --defaults-file=/etc/my.cnf --user=root --password=123456 --copy-back /var/lib/mysql/backup/
```

注：在做备份，解压，恢复的过程中可以借助分屏工具，我喜欢用screen。

  

# 二、基于GTID做数据同步

## 2.1 GTID的概念

1、全局事务标识：global transaction identifiers。

2、GTID是一个事务一一对应，并且全局唯一ID。

3、一个GTID在一个服务器上只执行一次，避免重复执行导致数据混乱或者主从不一致。

4、GTID用来代替传统复制方法，不再使用MASTER\_LOG\_FILE+MASTER\_LOG\_POS开启复制。而是使用MASTER\_AUTO\_POSTION=1的方式开始复制。

5、MySQL-5.6.5开始支持的，MySQL-5.6.10后开始完善。

6、在传统的slave端，binlog是不用开启的，但是在GTID中slave端的binlog是必须开启的，目的是记录执行过的GTID（强制）。

  

## 2.2 GTID的组成

GTID = source\_id:transaction\_id

source\_id：用于鉴别原服务器，即mysql服务器唯一的的server\_uuid，由于GTID会传递到slave，所以也可以理解为源ID。

transaction\_id：为当前服务器上已提交事务的一个序列号，通常从1开始自增长的序列，一个数值对应一个事务。        

示例：          

3E11FA47-71CA-11E1-9E33-C80AA9429562:23

前面的一串为服务器的server\_uuid，即3E11FA47-71CA-11E1-9E33-C80AA9429562，后面的23为transaction\_id

  

## 2.3 GTID的原理

1、当一个事务在主库端执行并提交时，产生GTID，一同记录到binlog日志中。

2、binlog传输到slave,并存储到slave的relaylog后，读取这个GTID的这个值设置gtid\_next变量，即告诉Slave，下一个要执行的GTID值。

3、sql线程从relay log中获取GTID，然后对比slave端的binlog是否有该GTID。

4、如果有记录，说明该GTID的事务已经执行，slave会忽略。

5、如果没有记录，slave就会执行该GTID事务，并记录该GTID到自身的binlog，在读取执行事务前会先检查其他session持有该GTID，确保不被重复执行。

6、在解析过程中会判断是否有主键，如果没有就用二级索引，如果没有就用全部扫描。

  

## 2.4 GTID的优势

1、更简单的实现failover，不用以前那样在需要找log\_file和log\_pos。

2、更简单的搭建主从复制。

3、比传统的复制更加安全。

4、GTID是连续的没有空洞的，保证数据的一致性，零丢失。

  

## 2.5 具体搭建过程

对于GTID的配置，主要修改配置文件中与GTID特性相关的几个重要参数，mysql版本建议mysql-5.6.5版本以上。

### 2.5.1 开启主（master）Gtid

其主要配置如下：

```bash
[mysqld]
#GTID:
server_id=135                #服务器id
gtid_mode=on                 #开启gtid模式
enforce_gtid_consistency=on  #强制gtid一致性，开启后对于特定create table不被支持

#binlog
log_bin=master-binlog
log-slave-updates=1    
binlog_format=row            #强烈建议，其他格式可能造成数据不一致

#relay log
skip_slave_start=1
```

### 2.5.2 在master上进行数据备份

```bash
innobackupex --defaults-file=/etc/my.cnf --user=root --password=123456 --stream=tar /data/backupMysql/ | | ssh root@192.168.1.7 \ "gzip >/data/mysql.tar.gz
```

### 2.5.3 解压备份的数据

```bash
tar zxvf /data/mysql.tar.gz -C /data/baskup
```

### 2.5.4 配置slave的配置文件

```bash
[mysqld]
#GTID:
gtid_mode=on
enforce_gtid_consistency=on
server_id=143

#binlog
log-bin=slave-binlog
log-slave-updates=1
binlog_format=row      #强烈建议，其他格式可能造成数据不一致

#relay log
skip_slave_start=1
```

### 2.5.5 恢复数据

```bash
innobackupex --defaults-file=/etc/my.cnf --user=root --password=123456 --copy-back /data/backup
```

### 2.5.6 获取GTID节点

```bash
more /data/backup/2018-02-08_15-03-18/xtrabackup_binlog_info
```

### 2.5.7 配置主从

（1）、在master上授权

```bash
grant replication slave on *.* to slaveuser@'192.168.1.7'  identified by "c2xhdmV1c2Vy";
```

（2）、在slave上配置

```bash
stop slave;
SET GLOBAL gtid_purged="c5b5ffe7-ce66-11e7-9a19-00163e00013d:1-515758";
CHANGE MASTER TO MASTER_HOST='192.168.1.6',MASTER_PORT=3306,MASTER_USER='slaveuser',MASTER_PASSWORD='c2xhdmV1c2Vy',MASTER_AUTO_POSITION=1;
start slave;
```

  

### 2.6 已运行经典复制mysql服务器转向GTID复制

a、按本文2.5.2描述配置参数文件；

b、所有服务器设置global.read\_only参数，等待主从服务器同步完毕；

        mysql> SET @@global.read\_only = ON;

c、依次重启主从服务器；

d、使用change master 更新主从配置；

        mysql> CHANGE MASTER TO

        > MASTER\_HOST = host,

        > MASTER\_PORT = port,

        > MASTER\_USER = user,

        > MASTER\_PASSWORD = password,

        > MASTER\_AUTO\_POSITION = 1;

e、从库开启复制

        mysql> START SLAVE;

f、验证主从复制