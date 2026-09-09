---
title: 生产环境故障处理演练-mysql数据库主从恢复
---

**常用命令：**

```
1、查看myqsl当前所有用户：SELECT user, host FROM mysql.user;
2、查看表的创建语句：show create table 库名.表名;
3、从库执行查看是否都是只读状态：select @@read_only;
4、查询 MySQL 中 performance_schema 表中 replication_applier_status_by_worker 的所有行数据，以监控和审查复制工作线程的状态：SELECT * FROM performance_schema.replication_applier_status_by_worker\G;
5、停止从服务器：STOP SLAVE;
6、设置从服务器上下一个要执行的事务的 GTID：SET gtid_next = '主库GTID号';
7、开始一个新的事务，但不执行任何操作，然后立即提交：BEGIN;  和  COMMIT;
8、将 GTID 设置为自动模式：SET gtid_next = 'AUTOMATIC';
9、启动从服务器（启动复制进程的命令）：START SLAVE;
10、查看超级用户是否是只读（1：只读; 0:关闭只读）：select @@super_read_only;
11、查看普通用户是否是只读（1：只读; 0:关闭只读）：select @@read_only;
12、关闭只读：set global read_only=0;set global super_read_only=0; 
13、开启只读：set global read_only=1;set global super_read_only=1; 
14、mysql查看所有用户的命令：SELECT user, host FROM mysql.user;
15、MySQL创建一个新的用户：create user '用户名'@localhost IDENTIFIED WITH 'mysql_native_password' BY '密码';
16、给指定的用户授予对所有数据库（*.*）的所有权限：grant all on *.* to '用户名'@localhost;
17、显示从服务器的复制状态信息：show slave status \G;
①Slave_IO_State：显示从服务器 I/O 线程的当前状态。如果复制正常运行，通常应该看到 "Waiting for master to send event"。
②Master_Host 和 Master_Port：主服务器的地址和端口。
③Connect_Retry：从服务器尝试重新连接到主服务器的时间间隔。
④Master_Log_File 和 Read_Master_Log_Pos：从服务器当前读取的二进制日志文件名和位置。
⑤Relay_Log_File 和 Relay_Log_Pos：中继日志文件和位置，表明从服务器已经将主服务器的事件读取到哪里。
⑥Slave_IO_Running 和 Slave_SQL_Running：这两个字段显示 I/O 线程和 SQL 线程是否正在运行，正常情况下应该都是 "Yes"。
⑦Seconds_Behind_Master：表示从服务器在复制上落后主服务器的秒数。如果为 0，则表示从服务器与主服务器同步。
⑧Last_Error：最后发生的错误信息。
⑨Last_SQL_Error：最后发生的 SQL 错误的详细信息。
18、显示主服务器（Master）的二进制日志（Binary Log）的状态信息：show master status\G
①File: 当前主服务器正在写入的二进制日志文件的名称。
②Position: 在当前二进制日志文件中的写入位置。这个位置表示下一个事件将被写入的位置。
③Binlog_Do_DB: 一个可选参数，列出了需要复制的数据库名称。如果为空，则表示复制所有数据库。
19、列出 MySQL 服务器上所有数据库的 SQL 命令：show databases;
④Binlog_Ignore_DB: 一个可选参数，列出了不需要复制的数据库名称。
⑤Executed_Gtid_Set: 列出了所有已执行的全局事务标识符（Global Transaction Identifiers，GTIDs），如果启用了 GTID 模式。
⑥Auto_Position: 如果启用了 GTID 模式，这个值表示从服务器是否使用 GTID 来自动确定复制的位置。
20、配置从服务器以连接到主服务器并开始复制数据的命令：change master to master_host='主库ip',master_port=3306,master_user='repl',master_password='Repl@123',master_auto_position=1;
```

### 一、数据量大的数据库主从恢复方案：

### 第一步：排查主从不同步原因

### 1.查看从库

命令：`show slave status \G;`  
涉及公司数据库参数信息，图片我就不展示了，直接说结论：看参数，`Slave_IO_Running`为No；`Slave_SQL_Running`为No；`Seconds_Behind_Master`为NULL，而不是0和具体延迟数值，说明主从同步断开了。

### 2.试图抢救下

从库上连续执行 常用命令 里5-9的命令  

### 3.查看从库

命令：`show slave status\G;`  
过程：Slave_SQL_Running:为Yes了，过了几分钟后：Slave_SQL_Running为NO；Seconds_Behind_Master为NULL（说明有问题）

### 4.从库执行sql

命令：`SELECT * FROM performance_schema.replication_applier_status_by_worker\G;`  

**最终结论：根据上述参数信息，和开发核对，确定了是某开发操作不当，用超级用户往从库里导入了数据，所以导致的主从同步断开。**

### 第二步：主库全量备份

### 1、主库先登录MySQL执行如下，创建一个备份用户

命令：`create user '用户名'@localhost IDENTIFIED WITH 'mysql_native_password' BY '密码';`

### 2、赋权

命令：`grant all on *.* to 'bakuser'@localhost;`

### 3、主库先安装xtrabackup

命令：`yum localinstall -y percona-xtrabackup-80-8.0.14-1.el8.x86_64.rpm`

### 4、备份脚本

```
#!/bin/bash
ulimit -n 102400
######################################################## 
streammod=xb
keep_days=$1
hostip=当前主库ip
bakdir="/db/backup/mysql"
user=bakuser
password=39xUJQObLvM3KQux!
sock=当前主库mysql.sock路径
backupDir="${bakdir}"
start_time=`date +%y%m%d%H%M%S`
log=/log/${start_time}.log
backup_file=/files/${start_time}.xbstream
## parameters end

#如果没有填keep_days,那就默认设置3天
if [ "${keep_days}" == '' ]; then
  keep_days=3
fi

#备份
function backup() {
case ${streammod} in
###xb
"xb")
  backup_file=${bakdir}/${backup_file}
  xtrabackup --socket=${sock} --user=${user} --password="${password}" --kill-long-queries-timeout=20 --kill-long-query-type=all  --compress --compress-threads=8 --stream=xbstream --backup --target-dir=${bakdir} 1>${backup_file} 2>${bakdir}/${log}
  end_time=`date +%y%m%d%H%M%S`
  echo ${end_time}
  return $?
;;
esac
}

function check_result() {
    end_time=$1
    last_row=`tail -n 1 ${bakdir}/${log}`
    # 1表示备份成功，其余数表示可能备份异常
    backup_file_size=`du -sh ${bakdir}/${backup_file} | awk -F' ' '{print $1}'`
    is_success=`tail -n 1 ${bakdir}/${log} | grep 'completed OK' | wc -l`
    if [ ${is_success} -eq 1 ];then
        backup_result='success'
        delete_backup
    else
        backup_result='fail'
    fi
    mysql_bacup_info="{\"ip\":\"${hostip}\", \"port\":\"3306\", \"backup_tool\":\"${streammod}\", \"start_time\":\"${start_time}\", \"end_time\":\"${end_time}\", \"backup_file_size\":\"${backup_file_size}\", \"backup_file\":\"${backup_file}\", \"backup_dir\":\"${backupDir}\", \"backup_result\":\"${backup_result}\", \"log_last_row\":\"${last_row}\"}"  
    echo $mysql_bacup_info >> $bakdir/log/backup_info.log
}

function delete_backup() {
        find  ${bakdir}/files/  -name '*.xbstream' -mtime +${keep_days} -exec rm {} \;  > /dev/null 2>&1  
        find  ${bakdir}  -name '*.gz' -mtime +${keep_days} -exec rm {} \;  > /dev/null 2>&1  
        find  ${bakdir}/log/  -name '*.log' -mtime +${keep_days} -exec rm {} \;  > /dev/null 2>&1
}

if [ -d ${backupDir} ]; then
        end_time=$(backup)
        wait
        check_result ${end_time}
        if [ $? -gt 80 ]; then
            delete_backup
        fi
else
        mkdir -p ${backupDir}
        chmod 750 ${backupDir}
        end_time=$(backup)
        wait
        check_result ${end_time}
        if [ $? -gt 80 ]; then
            delete_backup
        fi
fi
```

### 7、赋权

命令：`chmod +x /db/backup/mysql/mysqlbackup.sh`

### 8、执行全备脚本

命令：`sh /db/backup/mysql/mysqlbackup.sh`  
查看脚本生成的日志显示备份成功，此时/db/backup/mysql/files路径下为生成240813171655.xbstream文件传到从库

### 第三步：恢复主从

### 1、在两个从库的240813171655.xbstream备份文件的当前目录执行如下命令：

```
systemctl stop mysqld
rm -rf /db/mysql/3306/data/*
rm -rf /db/mysql/3306/log/{binlog,relaylog,slowlog,errorlog}
xbstream -x < 240813171655.xbstream  -C /db/mysql/3306/data
xtrabackup --decompress --parallel=4 --target-dir=/db/mysql/3306/data
xtrabackup --prepare --parallel=4 --target-dir=/db/mysql/3306/data
cd /db/mysql/3306/data
mkdir -p /db/mysql/3306/log/{binlog,relaylog,slowlog,errorlog}
chown -R mysql:mysql /db/mysql/3306/
systemctl start mysqld
start slave; 
change master to master_host='主库ip',master_port=3306,master_user='repl',master_password='从连接主的密码',master_auto_position=1;
start slave;
登录从库，执行show slave status\G看看结果
```

**此时可以查看到`Slave_IO_Running`参数为yes；`Slave_SQL_Running`参数为Yes；`Seconds_Behind_Master`的参数在下降，到0就说明主从完全恢复成功**

### 2、开启两个从库所有用户的只读

命令：`set global read_only=1;set global super_read_only=1;`   
这一手是为了防止后续同事的误操作，至于为啥从库不能写数据，因为 一主两从mysql架构 又叫 一写两读

### 二、数据量小的数据库主从恢复方案：

### 第一步：从库上停止主从关系

命令：`stop slave;`

### 第二步：在主库服务器上生成备份sql

主库上用root登录  
服务器上执行命令：`mysqldump --single-transaction --quick --master-data -S </db/mysql/3306/mysql.sock> -P <3306> --user=<backup_user> --password=<'backup_password'> -A > <dbname_backup1.sql>`  
注意：以上<>的内容替换成当前环境的，然后`-A`参数代表全库备份，然后不是恢复主从，单纯的只是备份的话，的换成库名，比如`dbname1 dbname2 dbname3`

### 第三步：从库上执行备份sql同步数据

登录从库里执行命令：`source /usr/local/dbname_backup1.sql`

### 第四步：恢复主从

### 方法一：开启了GTID（全局事务标识符）模式

命令：`change master to master_host='主库ip',master_port=3306,master_user='rep',master_password=<'rep_password'>,master_auto_position=1;`

### 方法二：未开启了GTID（全局事务标识符）模式

从dbname_backup1.sql查看前50行找到：MASTER_LOG_FILE和MASTER_LOG_POS两个数值并记录下来  
服务器上执行命令：`head -50n dbname_backup1.sql`  
登录从库里上执行命令：`CHANGE MASTER TO MASTER_HOST = '主库ip', master_port=3306, MASTER_USER = 'rep', MASTER_PASSWORD = <'rep_password'>, MASTER_LOG_FILE='<mysql-bin.123>', MASTER_LOG_POS=<456>;`

### 第五步：启动从库slave

命令：`start slave;`

### 第六步：查看是否恢复

查看`Slave_IO_Running`参数为yes；`Slave_SQL_Running`参数为Yes；`Seconds_Behind_Master`的参数在下降，到0就说明主从完全恢复成功**

### 第七步：开启两个从库所有用户的只读

命令：`set global read_only=1;set global super_read_only=1;`
