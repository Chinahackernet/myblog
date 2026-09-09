---
title: 自动化运维-配置Mysql、emqx、redis、nginx等通用性Linux日志分割工具 - logrotate
---

**前言：logrotate 是一个在 Linux 系统中用于管理和轮转日志文件的工具。它的主要目的是帮助系统管理员自动执行日志文件的轮转、压缩、删除和邮件通知等任务，以防止日志文件占用过多的磁盘空间，同时保持日志文件的可管理性。**

```
参考命令：
1、手动运行 logrotate 命令来测试配置，并查看是否生成日志：
命令：sudo /usr/sbin/logrotate -v /etc/logrotate.d/当前服务
2、测试配置，不做实际操作
命令：logrotate -d /etc/logrotate.d/当前服务
3、手动执行 logrotate
命令：logrotate -vf /etc/logrotate.d/当前服务
4、查看 cron 日志，确定 logrotate 是否执行
命令：tail /var/log/cron
5、查看 logrotate 的状态文件，确定是否执行了具体切割任务
命令：cat /var/lib/logrotate/logrotate.statu
```

### 一、Mysql日志切割配置

### 1、服务实际情况

**mysql日志文件路径为：**`/var/log/mysqld.log`  
**日志文件的权限、用户、用户组为：** `-rw-r--r-- 1 mysql mysql`   
**mysql.pid路径为：**`/var/run/mysqld/mysqld.pid`

### 2、需求：保留最近3个月的

### 3、详细操作步骤

① **创建logrotate配置文件**：  
在/etc/logrotate.d/目录下创建一个新的配置文件，例如命名为mysql。  
命令：`vim /etc/logrotate.d/mysql`

②**添加以下l配置内容**：

```
/var/log/mysqld.log {
    daily
    rotate 90
    compress
    missingok
    notifempty
    create 0640 mysql mysql
    postrotate
        if [ -f /var/run/mysqld/mysqld.pid ]; then
            kill -USR1 `cat /var/run/mysqld/mysqld.pid`
        fi
    endscript
}
```

```
配置解释如下：
daily：表示每天进行日志轮转。
rotate 90：表示保留90天的日志文件，大约3个月。
compress：轮转后的日志文件将被压缩。
missingok：如果日志文件缺失，logrotate不会报错。
notifempty：如果日志文件为空，则不进行轮转。
create 0640 mysql mysql：创建新的日志文件，并设置权限为0640，所有者为mysql，组为mysql。
Postrotate：在日志轮转之后执行的命令，这里使用if语句检查/var/run/mysqld/mysqld.pid文件是否存在，如果存在，则发送USR1信号给MySQL，使其重新打开日志文件。
```

### 4.保存并退出vim编辑器

### 5. 测试logrotate配置

为了确保配置文件没有错误，手动运行logrotate并测试配置：  
命令：`sudo logrotate -d /etc/logrotate.d/mysql`  
**注释：**-d参数会打印出将要执行的操作，而不会实际执行它们。  
（权限限制，无法截图，复制的输出信息）

```
[root@ap04_mysql mysqld]# sudo logrotate -d /etc/logrotate.d/mysql
reading config file /etc/logrotate.d/mysql
Allocating hash table for state file, size 15360 B

Handling 1 logs

rotating pattern: /var/log/mysqld.log  after 1 days (90 rotations)
empty log files are not rotated, old logs are removed
considering log /var/log/mysqld.log
  log does not need rotating (log has been already rotated)[root@ap04_mysql mysqld]#
```

### 6. 验证logrotate能否正常运行

检查`/etc/cron.daily/logrotate`文件，确保logrotate的定时任务是启用的。  
**方法一：**  
命令：`cat /etc/cron.daily/logrotate`  
（无法截图，复制的输出信息）

```
[root@ap04_mysql mysqld]# cat /etc/cron.daily/logrotate
#!/bin/sh

/usr/sbin/logrotate -s /var/lib/logrotate/logrotate.status /etc/logrotate.conf
EXITVALUE=$?
if [ $EXITVALUE != 0 ]; then
    /usr/bin/logger -t logrotate "ALERT exited abnormally with [$EXITVALUE]"
fi
exit 0
```

**结论：这个脚本的目的是确保 logrotate 能够每天自动执行，并且在执行过程中如果遇到任何问题，会通过系统日志服务记录一个警告。这样，系统管理员也可以通过查看系统日志来监控 logrotate 的运行状况。**

### 方法二：

命令：`journalctl -xe | grep logrotate`  
（无法截图，复制的输出信息）

```
[root@ap04_mysql mysqld]# journalctl -xe | grep logrotate
Feb 15 04:48:01 ap04_mysql run-parts(/etc/cron.daily)[7233]: starting logrotate
Feb 15 04:48:01 ap04_mysql run-parts(/etc/cron.daily)[7242]: finished logrotate
Feb 16 03:44:01 ap04_mysql run-parts(/etc/cron.daily)[5443]: starting logrotate
Feb 16 03:44:01 ap04_mysql run-parts(/etc/cron.daily)[5448]: finished logrotate
Sep 12 19:37:01 ap04_mysql run-parts(/etc/cron.daily)[15728]: starting logrotate
Sep 12 19:37:01 ap04_mysql run-parts(/etc/cron.daily)[15737]: finished logrotate
Sep 13 03:20:01 ap04_mysql run-parts(/etc/cron.daily)[20829]: starting logrotate
Sep 13 03:20:01 ap04_mysql run-parts(/etc/cron.daily)[20834]: finished logrotate
Sep 13 10:13:19 ap04_mysql sudo[21880]:     root : TTY=pts/2 ; PWD=/run/mysqld ; USER=root ; COMMAND=/sbin/logrotate -d /etc/logrotate.d/mysql
```

**结论：从journalctl命令输出来看，logrotate任务已在系统上定期执行，并且没有显示错误或失败的记录。这表明logrotate正在正常运行，并且能够成功完成日志文件的轮转**

以下是输出信息的具体解释：

```
① starting logrotate 和 finished logrotate：这些行表明logrotate任务已经开始并成功完成。run-parts(/etc/cron.daily)是cron任务的一部分，它运行/etc/cron.daily目录下的所有脚本。
② sudo[21880]: root : TTY=pts/2 ; PWD=/run/mysqld ; USER=root ; COMMAND=/sbin/logrotate -d /etc/logrotate.d/mysql：这行显示了一次手动执行logrotate测试命令的记录。这里使用了-d选项，表示这是一个调试运行，用于测试配置文件而不实际进行轮转。
```

这些日志条目表明logrotate任务已经按照计划执行，并且没有遇到任何问题。如果您想要进一步验证轮转是否按预期工作，可以定期检查日志文件本身是否已经被轮转和压缩，以及是否创建了新的日志文件。

### 二、emqx日志切割配置：

### 1、服务实际情况

（无法截图，复制的输出信息）

```
[root@ap02_mp log]# ll -sh
total 924K
428K -rw-r--r-- 1 root root 428K Sep 12 23:39 emqx.log.1
4.0K -rw-r--r-- 1 root root   18 Sep 13 08:43 emqx.log.idx
4.0K -rw-r--r-- 1 root root   13 Sep 13 08:43 emqx.log.siz
484K -rw-r--r-- 1 root root 482K Sep 13 10:43 erlang.log.1
4.0K -rw-r--r-- 1 root root  260 Sep 13 08:43 run_erl.log
```

**emqx的日志路径为：**`/apps/emqx/log/emqx.log` ; `/apps/emqx/log/erlang.log` ; `/apps/emqx/log/run_erl.log`  
**日志文件的权限、用户、用户组都为：**`-rw-r--r-- 1 root root`

**日志功能解析：**

```
emqx.log.1：这是一个日志文件，大小为428K，看起来像是EMQX Broker（一个MQTT消息代理）的日志。日志切割可以帮助管理这个文件的大小，避免它无限制地增长。
erlang.log.1：这是另一个日志文件，大小为484K，可能是与EMQX相关的Erlang应用程序的日志。Erlang VM的日志通常包含应用程序的运行时信息。
run_erl.log：这个文件可能包含了Erlang运行时的启动日志。虽然它目前的大小只有4.0K，但是如果它随着时间增长，也可能需要日志切割。
```

### 2、需求：日志保留最近2周

### 3、详细步骤

① **编辑配置文件**：  
命令：`vim /etc/logrotate.d/emqx`  
② **添加以下内容**：

```
/apps/emqx/log/emqx.log {
    weekly
    rotate 2
    compress
    missingok
    notifempty
    create 0644 root root
}

/apps/emqx/log/erlang.log {
    weekly
    rotate 2
    compress
    missingok
    notifempty
    create 0644 root root
}

/apps/emqx/log/run_erl.log {
    weekly
    rotate 2
    compress
    missingok
    notifempty
    create 0644 root root
}
```

```
配置解释如下：
weekly：表示每周进行日志轮转。
rotate 2：表示保留2周的日志文件。
compress：轮转后的日志文件将被压缩。
missingok：如果日志文件缺失，logrotate不会报错。
notifempty：如果日志文件为空，则不进行轮转。
create 0644 root root：创建新的日志文件，并设置权限为0644，所有者为root，组为root。
```

### 4、保存并退出编辑器

### 5、测试logrotate配置

为了确保配置文件没有错误，手动运行logrotate并测试配置：  
命令：`sudo logrotate -d /etc/logrotate.d/emqx`  
**注释：**-d参数会打印出将要执行的操作，而不会实际执行它们。

### 6. 验证logrotate能否正常运行：

命令：`journalctl -xe | grep logrotate`  
（无法截图，复制的输出信息）

```
[root@ap02_mp logrotate.d]# journalctl -xe | grep logrotate
Sep 13 11:37:23 ap02_mp sudo[30010]:     root : TTY=pts/3 ; PWD=/etc/logrotate.d ; USER=root ; COMMAND=/sbin/logrotate -d /etc/logrotate.d/emqx
```

### 三、redis日志切割配置

### 1、服务实际情况

**redis日志路径为：**`/apps/redis/log/redis.log`  
**日志文件的权限、用户、用户组、为：**`-rw-r--r--. 1 redis redis`

### 2、需求：日志保留最近2周

### 3、详细操作步骤

① **编辑配置文件**：  
命令：`vim /etc/logrotate.d/redis`  
② **添加以下内容**：

```
/apps/redis/log/redis.log {
    weekly
    rotate 2
    compress
    missingok
    notifempty
    create 0640 redis redis
}
```

```
配置解释如下：
weekly：指定 logrotate 每周执行一次日志轮转。
rotate 2：指定保留最近两周的日志文件。这意味着 logrotate 会保留两个轮转周期的日志，超过这个时间范围的旧日志文件将被删除。
compress：指定在轮转时压缩旧的日志文件。这通常会使用 gzip 来压缩日志，以节省磁盘空间。
missingok：如果日志文件丢失或不存在，logrotate 不会报错，而是继续执行其他任务。
notifempty：如果日志文件为空，则不进行轮转。这可以防止创建不必要的压缩日志文件。
create 0640 redis redis：指定在轮转时创建新的日志文件，并设置其权限为 0640，所有者为 redis 用户，组为 redis 组。这意味着新日志文件将允许所有者读写，而组用户和其他用户只能读取。
```

### 4、保存并退出编辑器

### 5、测试logrotate配置

命令：`logrotate -d /etc/logrotate.d/redis`

### 6. 验证logrotate能否正常运行

命令：`journalctl -xe | grep logrotate`  
（无法截图，复制的输出信息）

```
[root@ap02_mp log]# journalctl -xe | grep logrotate
Sep 13 13:56:33 ap02_mp sudo[5259]:     root : TTY=pts/3 ; PWD=/apps/redis/log ; USER=root ; COMMAND=/usr/sbin/logrotate -v /etc/logrotate.d/redis
```

### 四、nginx日志切割配置

### 1、服务实际情况

（无法截图，复制的输出信息）

```
[root@ap02_mp nginx]# ll -sh
total 136K
128K -rw-r--r--. 1 root root 115K Sep 13 14:05 access.log
8.0K -rw-r--r--. 1 root root 6.2K Sep 13 13:54 error.log
[root@ap02_mp nginx]# pwd
/apps/log/nginx
```

**nginx日志路径为：**`/apps/log/nginx/access.log` ; `/apps/log/nginx/error.log`  
**日志文件的权限、用户、用户组都为：**`-rw-r--r--. 1 root root`  
**nginx.pid路径为：**`/var/run/nginx.pid`

### 2、需求：日志保留最近2周

### 3、详细步骤操作

① **编辑配置文件**：  
命令：`vim /etc/logrotate.d/nginx`  
② **添加以下内容**：

```
/apps/log/nginx/*.log {
    weekly
    rotate 2
    compress
    missingok
    notifempty
    create 0640 root root
    postrotate
        if [ -f /var/run/nginx.pid ]; then
            kill -USR1 `cat /var/run/nginx.pid`
        fi
    endscript
}
```

```
配置解释如下：
weekly：表示每周进行日志轮转。
rotate 2：表示保留2周的日志文件。
compress：轮转后的日志文件将被压缩。
missingok：如果日志文件缺失，logrotate 不会报错。
notifempty：如果日志文件为空，则不进行轮转。
create 0640 root root：创建新的日志文件，并设置权限为 0640，所有者为 root，组为 root。
postrotate：在日志轮转之后执行的命令，这里发送 USR1 信号给 Nginx，使其重新打开日志文件。
```

### 4、保存并退出编辑器

### 5、使用-d选项进行测试

命令：`sudo logrotate -d /etc/logrotate.d/nginx`  
（无法截图，复制的输出信息）

```
[root@ap02_mp ~]# sudo logrotate -d /etc/logrotate.d/nginx
reading config file /etc/logrotate.d/nginx
Allocating hash table for state file, size 15360 B

Handling 1 logs

rotating pattern: /apps/log/nginx/*.log  weekly (2 rotations)
empty log files are not rotated, old logs are removed
considering log /apps/log/nginx/access.log
  log does not need rotating (log has been already rotated)considering log /apps/log/nginx/error.log
  log does not need rotating (log has been already rotated)[root@ap02_mp ~]#
```

**执行结果解释：**

```
①reading config file /etc/logrotate.d/nginx：logrotate 正在读取 /etc/logrotate.d/nginx 配置文件。
②Allocating hash table for state file, size 15360 B：logrotate 正在为状态文件分配哈希表，这是用于跟踪日志轮转状态的内部数据结构。
③Handling 1 logs：表示配置文件中定义了一组日志需要处理。
④rotating pattern: /apps/log/nginx/*.log weekly (2 rotations)：表示配置文件中定义了每周轮转一次 /apps/log/nginx/*.log 日志文件，并且保留2周的日志。
⑤empty log files are not rotated, old logs are removed：表示空的日志文件不会被轮转，旧的日志文件会被删除。
⑥considering log /apps/log/nginx/access.log 和 considering log /apps/log/nginx/error.log：logrotate 正在考虑是否需要轮转 access.log 和 error.log 文件。
⑦log does not need rotating (log has been already rotated)：表示 access.log 和 error.log 文件不需要轮转，因为它们已经被轮转过了。
```

**结论：这个输出表明 logrotate 配置文件是正确的，但是 access.log 和 error.log 文件已经被轮转过了，所以没有执行新的轮转操作**

### 6. 验证logrotate能否正常运行

命令：`journalctl -xe | grep logrotate`  
（无法截图，复制的输出信息）

```
[root@ap02_mp ~]# journalctl -xe | grep logrotate
Sep 13 15:58:00 ap02_mp sudo[5669]:     root : TTY=pts/3 ; PWD=/root ; USER=root ; COMMAND=/sbin/logrotate -d /etc/logrotate.d/nginx
```

**温馨提示：**  
记录当前配置时间，以上所有服务的日志切割日志logrotate任务是否按照计划预期执行，怠执行日期到后 需检查日志文件本身是否已经被轮转和压缩，以及是否创建了新的日志文件。
