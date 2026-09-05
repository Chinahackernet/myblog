原创：何应生

  

## 1\. 备份策略

  

  

### 1.1. 备份工具

  

当数据库数据量不大，且写入操作比较少的情况下，可以采用 mysqldump 方式进行全量备份。

当数据量较大时，或者InnoDB数据库写入频繁时，建议采用 xtrabackup进行全量备份。

当有增量备份需求时，采用xtrabackup进行增量备份，以降低磁盘空间的消耗。

为了能更灵活的将数据恢复到指定的时间点，使用 binlog 作为增量备份。

  

### 1.2. 备份策略(某手机公司)

  

-   使用 xtrabackup 每天做一次全量备份，并以 binlog 作为增量备份
-   binlog 保留七天，全量备份保留一个月，超过一个月的保留近一年每个月1号的数据
-   使用xtrabackup备份时，都是在从库执行
-   一般一个实例仅一个业务数据库，因此不涉及分库备份

  

### 1.3. 数据恢复方式

  

  

#### 1.3.1. 数据库或者数据表误删除情况

  

这种情况几乎不可见，生产环境中一般用户是没有drop权限的，不会对数据表和数据库产生破坏。

如果真实发生了，可以参考以下方式恢复：

将 binlog 和上一次的备份结果拷贝到测试机器，将数据库恢复到drop语句之前的一次事务状态，并通过mysqldump将误删除的数据库或者数据表导出，并导入生产环境的主库。

  

#### 1.3.2. 数据库中部分数据被误修改或者删除

  

通过查询业务日志，找到被误操作的时间和语句；

结合binlog和备份，将测试环境数据库恢复到误操作之前，然后交由对于业务运维或者开发导出需要的数据，并写入生产环境的主库。

  

#### 1.3.3. 建议

  

尽可能不影响现网当前的业务，尽可能快的恢复，尽可能不破坏现有的日志信息。

实际操作中，根据数据量、紧急程度等灵活应变。

数据恢复属于高危操作，尽可能避免在生产库直接操作，尽可能避免破坏数据库。

  

  

## 2. binlog + mysqldump 恢复数据

  

  

### 2.1.在测试库还原数据 数据备份

  

  

#### 2.1.1. 运行数据插入脚本

  

`[root@MySQL-1-190 ~]# cat insert.sh`

  

```bash
#!/bin/bash
id=$(mysql -uroot -p'MySQL.1992' oracle -e "select id from test order by insert_time desc limit 1 ;" 2>/dev/null |tail -n 1)
[[ $id =~ ^[0-9]+$ ]] || id=0
while :
do
    id=$[id+1]
    uuid=$(cat /proc/sys/kernel/random/uuid)
    mysql -uroot -p'MySQL.1992' oracle -e "insert into test values ($id,\"$uuid\",now()) ;" 2>/dev/null
    echo "$(date +'%F %T')|$id|$uuid|T" >> run.log
    sleep 0.2
done
```

  

`[root@MySQL-1-190 ~]# bash insert.sh &`

  

#### 2.1.2. 使用mysqldump备份数据

```plain
[root@MySQL-1-190 ~]# mysqldump -uroot -p --master-data=2 --single-transaction --all-databases > $(date +%F).MySQL-1-190.sql
```

  

#### 2.1.3. 模拟误操作删除删除数据

```plain
mysql> delete from test where id < 10 ;
mysql> delete from test where id between 2100 and 2170 ;
```

  

### 2.2. 在测试库还原数据

  

#### 2.2.1. 拷贝备份和所需要的binlog到测试库服务器

```plain
[root@MySQL-1-190 ~]# scp /opt/logs/mysql/MySQL-1-190-bin.000010 $(date +%F).MySQL-1-190.sql 192.168.1.200:/opt/

[root@MySQL-1-200 opt]# mysql -uroot -p < 2019-06-16.MySQL-1-190.sql

[root@MySQL-1-200 opt]# grep -m 1 'MASTER' 2019-06-16.MySQL-1-190.sql ## 找到备份的binlog位置点
-- CHANGE MASTER TO MASTER_LOG_FILE='MySQL-1-190-bin.000010', MASTER_LOG_POS=5547297;

[root@MySQL-1-200 opt]# mysqlbinlog --database=oracle MySQL-1-190-bin.000010 > res.tmp.sql ## 转换binlog为文本文件
```

  

#### 2.2.2. 提取第一次被误删除的数据

  

`[root@MySQL-1-200 opt]# grep -B 5 "delete from test where id < 10" res.tmp.sql ##  找到第一次误操作的位置点`

  

```sql
BEGIN
/*!*/;
# at 5641004
#190616 20:52:02 server id 1  end_log_pos 5641112 CRC32 0x6c21b22d 	Query	thread_id=19658	exec_time=0	error_code=0
SET TIMESTAMP=1560689522/*!*/;
delete from test where id < 10
```

  

`[root@MySQL-1-200 opt]# mysqlbinlog --start-position=5547297 --stop-position=5641004 MySQL-1-190-bin.000010 > res1.sql ## 提取需要的binlog日志`

`[root@MySQL-1-200 opt]# mysql -uroot -p < res1.sql  ## 应用binlog日志`

`[root@MySQL-1-200 ~]# mysql -uroot -p oracle -e "select * from test where id < 10 ;" | awk 'NR!=1{print "insert into test values ("$1",\""$2"\",\""$3,$4"\");" }'  > insert.sql ## 提取数据，使用infile和outfile更简单，但是默认没开启这个功能，因此使用awk来处理`

  

#### 2.2.3. 提取第二次被误删除的数据

  

`[root@MySQL-1-200 opt]# grep -B 5 "delete from test where id between 2100 and 2170" res.tmp.sql`

  

```sql
BEGIN
/*!*/;
# at 6021552
#190616 20:56:48 server id 1  end_log_pos 6021677 CRC32 0x7bf90013 	Query	thread_id=19658	exec_time=0	error_code=0
SET TIMESTAMP=1560689808/*!*/;
delete from test where id between 2100 and 2170
```

  

```plain
[root@MySQL-1-200 opt]# mysqlbinlog --start-position=5641004 --stop-position=6021552 MySQL-1-190-bin.000010 > res2.sql

[root@MySQL-1-200 opt]# mysql -uroot -p < res2.sql

[root@MySQL-1-200 ~]# mysql -uroot -p oracle -e "select * from test where id between 2100 and 2170 ;" | awk 'NR!=1{print "insert into test values ("$1",\""$2"\",\""$3,$4"\");" }'  >> insert.sql

[root@MySQL-1-200 ~]# scp insert.sql 192.168.1.190:~/
```

  

### 2.3. 将误删除数据插入原数据库

  

```plain
mysql> source insert.sql ;
mysql> select count(*) from test where id<10 ;
+----------+
| count(*) |
+----------+
|        9 |
+----------+

mysql> select count(*) from test where id between 2100 and 2170 ;
+----------+
| count(*) |
+----------+
|       71 |
+----------+
```

  

## 3. xtrabackup + binlog

### 3.1. 数据备份

#### 3.1.1. 运行数据插入脚本

```bash
[root@MySQL-1-190 ~]# cat insert.sh
#!/bin/bash
id=$(mysql -uroot -p'MySQL.1992' oracle -e "select id from test order by insert_time desc limit 1 ;" 2>/dev/null |tail -n 1)
[[ $id =~ ^[0-9]+$ ]] || id=0
while :
do
    id=$[id+1]
    uuid=$(cat /proc/sys/kernel/random/uuid)
    mysql -uroot -p'MySQL.1992' oracle -e "insert into test values ($id,\"$uuid\",now()) ;" 2>/dev/null
    echo "$(date +'%F %T')|$id|$uuid|T" >> run.log
    sleep 0.2
done

[root@MySQL-1-190 ~]# bash insert.sh &
```

  

  

#### 3.1.2. 使用xtrabackup进行增量备

  

```bash
[root@MySQL-1-190 ~]# xtrabackup --user=backup --password='Backup.1992' --socket=/opt/apps/mysql/tmp/mysql.sock --backup --target-dir=/data/backup/mysql_data/20190617-full/ ## 全量备份

[root@MySQL-1-190 ~]# xtrabackup --user=backup --password='Backup.1992' --socket=/opt/apps/mysql/tmp/mysql.sock --backup --target-dir=/data/backup/mysql_data/20190617-inc01 --incremental-basedir=/data/backup/mysql_data/20190617-full/  ## 第一次增量

[root@MySQL-1-190 ~]# xtrabackup --user=backup --password='Backup.1992' --socket=/opt/apps/mysql/tmp/mysql.sock --backup --target-dir=/data/backup/mysql_data/20190617-inc02 --incremental-basedir=/data/backup/mysql_data/20190617-inc01 ## 第二次增量
```

  

#### 3.1.3. 模拟误操作（update 语句少了条件）

```bash
mysql> update test set fid="ffd09512-8d11-450b-94ba-6d309b1ee167" ;
```

  

### 3.2. 在测试库还原数据

#### 3.2.1. 将需要的备份、binlog拷贝到测试库服务器

```bash
[root@MySQL-1-190 ~]# scp -qr /opt/logs/mysql/MySQL-1-190-bin.000010 /data/backup/mysql_data/20190617-* 192.168.1.200:~/backup_data

[root@MySQL-1-190 ~]# grep bin /data/backup/mysql_data/20190617-*/xtrabackup_binlog_info  ## 查看binlog位置

/data/backup/mysql_data/20190617-full/xtrabackup_binlog_info:MySQL-1-190-bin.000010   9245580
/data/backup/mysql_data/20190617-inc01/xtrabackup_binlog_info:MySQL-1-190-bin.000010  9375450
/data/backup/mysql_data/20190617-inc02/xtrabackup_binlog_info:MySQL-1-190-bin.000010  9514686
```

  

#### 3.2.2. 恢复数据到误操作前一个事务

```bash
[root@MySQL-1-200 backup_data]# xtrabackup --prepare --apply-log-only --target-dir=20190617-full/

[root@MySQL-1-200 backup_data]# xtrabackup --prepare --apply-log-only --target-dir=20190617-full --incremental-dir=20190617-inc01

[root@MySQL-1-200 backup_data]# xtrabackup --prepare --target-dir=20190617-full --incremental-dir=20190617-inc02

[root@MySQL-1-200 backup_data]# grep bin 20190617-*/xtrabackup_binlog_info  ## 将xtrabackup备份恢复到指定时间

20190617-full/xtrabackup_binlog_info:MySQL-1-190-bin.000010   9514686
20190617-inc01/xtrabackup_binlog_info:MySQL-1-190-bin.000010  9375450
20190617-inc02/xtrabackup_binlog_info:MySQL-1-190-bin.000010  9514686
[root@MySQL-1-200 backup_data]# grep bin 20190617-*/xtrabackup_binlog_pos_innodb ## start-pos=9514686

MySQL-1-190-bin.000010  9514686
[root@MySQL-1-200 backup_data]# mysqlbinlog MySQL-1-190-bin.000010 | grep -C 5 'set fid="ffd09512-8d11-450b-94ba-6d309b1ee167"' # stop-pos=9638723

BEGIN
/*!*/;
# at 9638723
#190617  7:45:08 server id 1  end_log_pos 9638859 CRC32 0x02910a15  Query thread_id=33595 exec_time=0 error_code=0
SET TIMESTAMP=1560728708/*!*/;
update test set fid="ffd09512-8d11-450b-94ba-6d309b1ee167"
/*!*/;
# at 9638859
#190617  7:45:08 server id 1  end_log_pos 9638890 CRC32 0x5b1e92ba  Xid = 103146
COMMIT/*!*/;
# at 9638890

[root@MySQL-1-200 backup_data]# mysqlbinlog --start-position=9514686 --stop-position=9638723 MySQL-1-190-bin.000010 --result-file res.sql

```

  

#### 3.2.3. 提取误操作前的数据

```bash
[root@MySQL-1-200 backup_data]# /etc/init.d/mysql.server stop

[root@MySQL-1-200 backup_data]# rm /opt/apps/mysql/data/* -fr

[root@MySQL-1-200 backup_data]# cp -r 20190617-full/* /opt/apps/mysql/data/ ## 导入xtrabackup数据

[root@MySQL-1-200 backup_data]# chown -R mysql.mysql /opt/apps/mysql/data/

[root@MySQL-1-200 backup_data]# /etc/init.d/mysql.server start

[root@MySQL-1-200 backup_data]# mysql -uroot -p < res.sql ## 导入增量备份数据

[root@MySQL-1-200 backup_data]# mysqldump -uroot -p --no-create-info oracle test > test.sql ## 导出需要恢复的数据表，不包含创表语句
```

  

### 3.3. 还原被误操作数据

  

根据实际情况灵活选择还原方式，比如：

  

-   删除被误操作的数据，并将 test.sql 导入数据库
-   将test.sql导入临时表，使用update命令将被修改的数据还原