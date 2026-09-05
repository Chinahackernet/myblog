# Redis哨兵集群

> 分类：Database / 第20章：Redis
> 原文：https://www.cuiliangblog.cn/detail/section/31467456
> 来源：崔亮的博客

---

# 一、环境准备
| 角色 | ip | 哨兵进程 | redis |
| --- | --- | --- | --- |
| redis主 | 192.168.68.110 | 开启 | 安装 |
| redis从 | 192.168.68.111 | 开启 | 安装 |
| redis从 | 192.168.68.112 | 开启 | 安装 |


# 二、安装Redis
$ wget [http://download.redis.io/releases/redis-5.0.4.tar.gz](http://download.redis.io/releases/redis-5.0.4.tar.gz)

$ tar xzf redis-5.0.4.tar.gz

$ cd redis-5.0.4

$ make

# 三、Redis配置文件
+ vim /usr/local/redis/redis.conf
1. 配置主即master的redis配置文件（redis.conf）

#绑定本机IP

bind 192.168.68.110

protected-mode yes

#端口

port 6379

tcp-backlog 511

#开启守护进程

daemonize yes

#日志文件存放位置，提前创建目录

logfile "/var/log/redis/redis.log"

#SNAPSHOTTING目录提前创建

dir /data/redis

#使用AOF持久化

appendonly yes

1. 配置从服务器的配置文件（reids.conf）

#绑定本机IP

bind 192.168.68.111

#指定主服务IP 端口

replicaof 10.1.1.5 6379

#日志文件存放位置，提前创建目录

logfile "/var/log/redis/redis.log"

#如果slave 无法与master 同步，设置成slave不可读，方便监控脚本发现问题。

replica-serve-stale-data no

1. 执行info replication查看当前主从配置

![](assets/07-Database/7031edf52af0943ccc0d.png)

# 四、哨兵配置sentinel.conf 文件
1. 复制配置文件并修改

cp /usr/src/redis-3.2.1/sentinel.conf /usr/local/redis/

vim /usr/local/redis/sentinel.conf

1. 内容如下

port 26379

#开启守护进程

daemonize yes

pidfile /var/run/redis-sentinel.pid

#指定日志文件存放位置

logfile "/var/log/redis/sentinel/"

dir /tmp

#指定主的IP 端口 “2”代表有两个哨兵进程发现主服务器宕机便选取一个从服务器为主

sentinel monitor mymaster 192.168.68.110 6379 2

#5秒内master6800没有响应，就认为SDOWN

sentinel down-after-milliseconds mymaster 5000

1. 启动redis-sentinel

./bin/redis-sentinel ./sentinel.conf

# 五、测试主从复制
1. 主节点添加数据

![](assets/07-Database/3db350ed6c7b0a63c0b7.png)

1. 从节点获取数据

![](assets/07-Database/1938717bb4d629354ec4.png)

# 六、测试故障转移
1. 停掉主节点

![](assets/07-Database/7ec3f94e777f2d0de53f.png)

1. 查看redis集群信息

![](assets/07-Database/3a4baf6a3d7ff1c3c2b2.png)

1. 从节点192.168.68.112升级为主节点

![](assets/07-Database/8e379206050f7c6d33fa.png)


