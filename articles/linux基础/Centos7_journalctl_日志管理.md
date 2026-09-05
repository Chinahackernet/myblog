## **一、journalctl基础用法**

### 1、查看所有日志(默认显示本次启动的所有日志)

```plain
[root@localhost  ~]# journalctl
```

查看本次启动的所有日志也可以使用

```plain
[root@localhost  ~]# journalctl -b
```

### 2、查看内核日志

```plain
[root@localhost  ~]# journalctl -k
```

### 3、查看指定时间的日志

通过--since和--until选项，可以过滤任意时间限制，显示指定条件之前、之后或之间的日志

```plain
[root@localhost  ~]# journalctl --since="2019-11-27 14:21:00"
```

查询一个时间段范围内的日志

```plain
[root@localhost  ~]# journalctl --since="2019-11-27 14:21:00" --until="2019-11-27 14:30:00"
```

使用"yesterday"、"today"、"tomorrow"或"now"显示某时段的日志

```plain
[root@localhost  ~]# journalctl --since yesterday
```

### 4、根据不同的主题进行过滤筛选

```plain
[root@localhost  ~]# journalctl -u kubelet.service
[root@localhost  ~]# journalctl -u kubelet
```

#### a、根据进程ID查询

如果进程使用了systemd托管日志，则可以通过以下命令查找进程对应的日志

```plain
[root@localhost  ~]# journalctl _PID=1
```

Systemd journal 有很多可以用来过滤的字段，可以通过 man systemd.journal-fields 查看所有可以用来过滤的字段。对于用来筛选的字段，可以使用-F参数来查看所有可以用来过滤的值，例如journalctl -F \_PID;

#### b、按优先级

操作系统提供了从0 (emerg) 到 7 (debug) 一共7个级别的日志，可以配合-p参数分别查看对应级别的日志

```plain
[root@localhost  ~]# journalctl -p 5 -u kubelet
```

7个级别的含义为

0: emerg 紧急情况

1: alert 警告

2: crit 危险

3: err 错误

4: warning 警告

5: notice 注意

6: info 信息

7: debug 调试

### 5、调整显示输出

默认情况，journal输出进入分页模式，用户可以在终端上调整显示的内容，如果要不需要分页，需要加上--no-pager参数

以Json格式输出

通过-o参数，可以设置为json格式输出，这对于其他接收json格式的日志分析工具非常友好

```plain
[root@localhost  ~]# journalctl -p 5 --no-pager -o json
```

使用json-pretty则对于管理员查看日志非常易读

```plain
[root@localhost  ~]# journalctl -p 5 --no-pager -o json-pretty
```

支持的各种格式如下：

  

cat: 只显示信息字段本身。

export: 适合传输或备份的二进制格式。

json: 标准JSON，每行一个条目。

json-pretty: JSON格式，适合人类阅读习惯。

json-sse: JSON格式，经过打包以兼容server-sent事件。

short: 默认syslog类输出格式。

short-iso: 默认格式，强调显示ISO 8601挂钟时间戳。

short-monotonic: 默认格式，提供普通时间戳。

short-precise: 默认格式，提供微秒级精度。

verbose: 显示该条目的全部可用journal字段，包括通常被内部隐藏的字段。

### 6、活动日志跟踪

journalctl也支持类似tail的功能，如通过-n参数指定显示最近的多少行，默认为10行

```plain
[root@localhost  ~]# journalctl -n 20
```

显示cron.service服务的最新三行日志

```plain
[root@localhost  ~]# journalctl -u cron.service -n 3
```

跟tail -f命令类似，journalctl支持-f选项，以便实时显示日志，持续监控日志输出

```plain
[root@localhost  ~]# journalctl -f
```

## 二、journalctl维护

### 1、查看日志占用的磁盘空间

```plain
[root@localhost  ~]# journalctl --disk-usage
Archived and active journals take up 6.0M on disk.
```

### 2、设置日志占用的空间

```plain
[root@localhost  ~]# journalctl --vacuum-size=500M
Vacuuming done, freed 0B of archived journals on disk.
```

### 3、设置日志保存的时间

```plain
[root@localhost  ~]# journalctl --vacuum-time=1month
Vacuuming done, freed 0B of archived journals on disk.
```

## 三、journalctl清空删除日志

由于Linux是一个非常敏感的操作系统，若删除文件错误，很容易造成系统崩溃。

所以，清理journalctl日志的方法，请按日期、允许保留的容量进行删除。

```plain
[root@localhost  ~]# journalctl --vacuum-time=2d
[root@localhost  ~]# journalctl --vacuum-size=500M
```

如果要手动删除日志文件，则需要在删除之前轮转（循环）日志。

```plain
[root@localhost  ~]# systemctl kill --kill-who=main --signal=SIGUSR2 systemd-journald.service
```

## 四、journalctl配置持久性容量

要启用日志限制持久性配置，可以修改journald的配置文件 ▼

```plain
[root@localhost  ~]# vim/etc/systemd/journald.conf
SystemMaxUse=16M
ForwardToSyslog=no
```

  

然后，重启journald 

```plain
[root@localhost  ~]# systemctl restart systemd-journald.service
```

  

检查日志是否如常？日志文件是否完好且未损坏？ 

```plain
[root@localhost  ~]# journalctl --verify
```

  

## 五、其他日志命令

  

tail /var/log/messages            //系统主日志文件

  

tail -20 /var/log/messages        //查看20行日志文件

  

tail -f /var/log/messages         //动态查看日志文件的尾部

  

tail /var/log/secure              //认证、安全

  

tail /var/log/maillog             //跟邮件postfix相关

  

tail /var/log/cron                //crond、at进程产生的日志

  

tail /var/log/dmesg               //和系统启动相关

  

tail /var/log/audit/audit.log     //系统审计日志

  

tail /var/log/yum.log             //查看yum日志

  

tail /var/log/mysqld.log          //查看MySQL日志

  

tail /var/log/xferlog             //和访问FTP服务器相关

  

w /var/log/wtmp                   //当前登录的用户（命令：w）

  

last /var/log/btmp                //最近登录的用户（命令last)

  

lastlog /var/log/lastlog          //所有用户的登录情况（命令lastlog）