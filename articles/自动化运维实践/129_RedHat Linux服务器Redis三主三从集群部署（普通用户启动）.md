---
title: RedHat Linux服务器Redis三主三从集群部署（普通用户启动）
---

### 一、安装redis：

先查看是否安装c++的编译器； 执行 `sudo yum -y install gcc-c++`(否则直接安装redis没依赖环境）

### 第一步：上传安装包

### 第二步：在/mpjava路径下解压`sudo tar -zxvf redis-6.2.5.tar.gz`

### 第三步：进入 `cd redis-6.2.5`路径

### 第四步：`sudo make`

### 第五步：安装

输入命令： `make PREFIX=/usr/local/redis install`

### 第六步：启动redis验证是否安装成功

进入src目录下，输入命令启动redis

```
cd src
./redis-server
```

处理方法：将“vm.overcommit_memory=1”添加到/etc/sysctl.conf，然后重新启动或运行命令“sudo sysctl -p”以使其生效。

### Redis三主三从交叉集群部署：

### 第一步：创建redis启动用户(非root用户）,创建节点配置文件路径：

创建用户：`sudo useradd -s /sbin/nologin -M redis`  
创建目录：`sudo mkdir -p /home/redis /home/redis/data /home/redis/run /home/redis/log`  
指定/home/redis目录属于redis用户:`sudo chown -R redis.redis /home/redis`

### 第二步：创建节点配置文件：

执行命令：

```
       cp redis.conf /home/redis/
       cd /home/redis
       cp -r redis.conf redis6379.conf
       cp -r redis.conf redis6380.conf
```

每台服务器复制redis目录redis.conf为redis6379.conf和redis6380.conf为，按以下内容进行调整。  
redis6379.conf：

```
pidfile /home/redis/run/redis6379.pid        #pid文件以端口来区分
port 6379                                    #监听端口不同, 可以更改端口提高安全性
logfile "/home/redis/log/redis6379.log"      #logfile以端口来区分
dir /home/redis/data                         #redis数据文件存放目录
dbfilename dump6379.rdb                      #数据文件dbfilename以端口来区分
masterauth LTTMS#2024!@cshj                  #主节点认证密码
requirepass LTTMS#2024!@cshj                 #Redis连接密码，和requirepass设置成相同的值
appendfilename "appendonly_6379.aof"         #追加文件名appendfilename以端口来区分
cluster-config-file nodes-6379.conf          #cluster-config-file以端口来区分
cluster-enabled yes                          #启用集群
bind ip地址                                  #绑定IP保证集群时能正常连接
cluster-node-timeout 2000                    #集群节点超时时间
daemonize yes                                #开启守护进程
```

redis6380.conf：

```
pidfile /home/redis/run/redis6380.pid        #pid文件以端口来区分
port 6380                                    #监听端口不同, 可以更改端口提高安全性
logfile "/home/redis/log/redis6380.log"      #logfile以端口来区分
dir /home/redis/data                         #redis数据文件存放目录
dbfilename dump6380.rdb                      #数据文件dbfilename以端口来区分
masterauth LTTMS#2024!@cshj                  #主节点认证密码
requirepass LTTMS#2024!@cshj                 #Redis连接密码，和requirepass设置成相同的值
appendfilename "appendonly_6380.aof"         #追加文件名appendfilename以端口来区分
cluster-config-file nodes-6380.conf          #cluster-config-file以端口来区分
cluster-enabled yes                          #启用集群
bind ip地址                                  #绑定IP保证集群时能正常连接
cluster-node-timeout 2000                    #集群节点超时时间
daemonize yes                                #开启守护进程
```

### 第三步：启动服务

三节点服务器进入路径：`cd /usr/local/redis/bin`

```
sudo -u redis ./redis-server /home/redis/redis6379.conf &
sudo -u redis ./redis-server /home/redis/redis6380.conf &
```

### 第四步：放行端口

如集群配置完成后开启防火墙报节点无法连接，需做放行端口配置：  
放行端口：  
节点1、2、3：

```
sudo firewall-cmd --zone=public --add-port=6379/tcp --permanent    放行6379端口
sudo firewall-cmd --zone=public --add-port=6380/tcp --permanent    放行6380端口
sudo firewall-cmd --zone=public --add-port=16379/tcp --permanent 放行16379内部通讯端口
sudo firewall-cmd --zone=public --add-port=16380/tcp --permanent 放行16380内部通讯端口

sudo firewall-cmd --reload  #重新载入 返回 success 代表成功

sudo firewall-cmd --zone=public --query-port=6379/tcp    查看 返回 yes 代表开启成功
sudo firewall-cmd --zone=public --query-port=6380/tcp    查看 返回 yes 代表开启成功

sudo firewall-cmd --zone=public --query-port=16379/tcp    查看 返回 yes 代表开启成功
sudo firewall-cmd --zone=public --query-port=16380/tcp    查看 返回 yes 代表开启成功
```

### 第五步：启动redis集群

在服务器上使用以下命令启动redis集群  
命令：  
`./redis-cli --cluster create 10.0.0.8:6379 10.0.0.9:6379 10.0.0.10:6379 10.0.0.9:6380 10.0.0.10:6380 10.0.0.8:6380 --cluster-replicas 1 -a ***********(密码)`

### 第六步：检查集群是否配置成功

```
命令：./redis-cli -h 10.0.0.8 -p 6379
输入密码：auth 密码
```

`查看集群信息：cluster info`  

cluster_state:ok 代表集群可用  
cluster_known_nodes:6 代表集群有6节点  
列出集群当前已知的所有节点（ node），以及这些节点的对应关系信息。命令:`cluster nodes`  

### 第七步配置开机自启

参考我的博客里开机自启篇-《Linux系统-redis集群、nacos、nginx、keepalived、mysql开机自启》
