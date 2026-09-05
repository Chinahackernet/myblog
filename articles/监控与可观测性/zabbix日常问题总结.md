##### 1、connection to database 'zabbix' failed: [1040] Too many connections

问题：数据库连接池太少

解决：增加数据库连接池

步骤：

（1）、进入数据库

```python
show variables like 'max_connections';(查可以看当前的最大连接数)
set global max_connections=1000;(设置最大连接数为1000，可以再次查看是否设置成功)
```

（2）、修改my.cnf参数

```python
max_connections=(根据需要填写连接数)
```

（3）、重启zabbix-server

  

##### 2、cannot open log: cannot create semaphore set: [28] No space left on device

解决：

```python
# sysctl -a | grep kernel.sem
kernel.sem = 250 32000 32 128
# echo "kernel.sem = 500 64000 64 256" >> /etc/sysctl.conf
# sysctl -p
# systemctl restart zabbix-server
```

上面的4个数据分别对应:SEMMSL、SEMMNS、SEMOPM、SEMMNI这四个核心参数，具体含义和配置如下。

SEMMSL ：用于控制每个信号集的最大信号数量。

SEMMNS：用于控制整个 Linux 系统中信号（而不是信号集）的最大数。

SEMOPM： 内核参数用于控制每个 semop 系统调用可以执行的信号操作的数量

  

##### 3、cannot send list of active checks to "10.2.128.252": host [dca-app-datasource] not found

解决：  
zabbix\_agentd.conf文件中配置的Hostname内容和zabbix的web界面"配置"->"主机"的主机名称配置不一致导致的，修改成一致内容即可！

  

##### 4、zbx\_mem\_malloc(): out of memory (requested 16 bytes)

解决：

修改zabbix\_server.conf或者zabbix\_proxy.conf中找到CacheSize字段。

比如：

```shell
### Option: CacheSize
#   Size of configuration cache, in bytes.
#   Shared memory size for storing host, item and trigger data.
#
# Mandatory: no
# Range: 128K-8G
# Default:
CacheSize=2048M
```

然后重启服务。

  

##### 5、icmp pinger processes more than 75% busy

修改StartPingers参数，比如：

```java
StartPingers=5
```

然后重启zabbix-server服务。

  

##### 6、**zabbix unreachable poller processes more than 75 busy  
**

**可能情况：**

1.通过Zabbix agent采集数据的设备处于moniting的状态但是此时机器死机或其他原因导致zabbix agent死掉server获取不到数据，此时unreachable poller就会升高。

2.通过Zabbix agent采集数据的设备处于moniting的状态但是server向agent获取数据时时间过长，经常超过server设置的timeout时间，此时unreachable poller就会升高。

3.支撑Zabbix的MySQL卡住了，Zabbix服务器的IO卡住了都有可能，Zabbix进程分配到内存不足都有可能。

一个简单的方法是增加Zabbix Server启动时初始化的进程数量，这样直接增加了轮询的负载量，从比例上来讲忙的情况就少了

```shell
[root@localhost zabbix]#  vi /etc/zabbix/zabbix_server.conf
# 将这个值设置成StartPollers=500，然后重启zabbix-server服务。也可以定时重启zabbix服务。
```

  

##### 7、**Zabbix alerter processes more than 75% busy**

可能原因：

-   zabbix的数据库问题
-   zabbix服务器的IO负载
-   zabbix进程分配到内存不足
-   网络延时或者不通

解决：

```shell
[root@localhost zabbix] vim /etc/zabbix/zabbix_server.conf 
# 将其默认值5修改为20：
StartPollers=500
# 修改的位置
# StartDiscoverers=1
StartDiscoverers=100
```

  

##### 8、M**ore than 100 items having missing data for more than 10 minutes****和****Zabbix poller processes more than 75% bus**y  
修改配置文件增大线程数和缓存。

```shell
[root@localhost zabbix]#  vim /usr/local/zabbix/etc/zabbix_server.conf
StartPollers=500
StartPollersUnreachable=50
StartTrappers=30
StartDiscoverers=6
CacheSize=1G
CacheUpdateFrequency=300
StartDBSyncers=20
HistoryCacheSize=512M
TrendCacheSize=256M
HistoryTextCacheSize=80M
ValueCacheSize=1G
```

  

##### 9、**server日志很多first network error, wait for 15 seconds**  

server配置文件Timeout时间改大点，我改成了30s。

  

##### **10、zabbix\_server: error while loading shared libraries: libmysqlclient.so.16: cannot open shared object file: No such file or directory**

这是因为找不到 libmysqlclient.so.16 文件所致，可以查找mysql的安装目录，找到此文件然后做一个软链接即可：

ln -s /usr/local/mysql/lib/mysql/libmysqlclient.so.16 /usr/lib

或者打开  /etc/ld.so.confrs 文件，在其中添加： /usr/local/mysql/lib

  

##### 11、Zabbix housekeeper processes more than 75% busy

问题原因：

为了防止数据库持续增大，zabbix有自动删除历史数据的机制即housekeeper，而mysql删除数据时性能会降低，就会报错

解决方案：

调整HousekeepingFrequency参数

HousekeepingFrequency=12 #间隔时间 2 3 

MaxHousekeeperDelete=1000000 #最大删除量 

  

##### 12、**zabbix server is not running: the information displayed may not be current.**

排查：编辑zabbix.conf.php文件，把$ZBX\_SERVER的原来的值localhost改为本机的IP地址。

vim /etc/zabbix/web/zabbix.conf.php

$ZBX\_SERVER = '172.16.2.116'; 

  

##### 13、s**candir() has been disabled for security reasons \[profile.php:198 → CView->**

解决：

php环境中把scandir写在了disable\_functions中。在php.ini文件把disable\_functions中的scandir去掉即可。

（重启php-fpm和nginx）