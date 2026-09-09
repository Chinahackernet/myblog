---
title: 企业生产环境-麒麟V10（ARM架构）操作系统部署jdk和redis三主三从交叉版集群
---

**前言：麒麟ARM操作系统是国企和政务机关推行信创化选择率比较高的一款操作系统，然而ARM操作系统非主流的X86系统，除了命令一样，在架构方面差别极大，初次接触多多少少会踩坑，下面我将在公司中部署的实例列举出来，供大家参考，ip和设计机密信息不方便展示，统用虚拟信息代替。**

**这里jdk和redis的安装是没有关系的，如果只需要redis的安装，可以直接忽略jdk篇幅**

经过多次验证，用了多种通用版本JDK版本，发现都不行，只有两个办法可以适配麒麟ARM操作系统。  
**方法一：Oracle官网以下的版本：`jdk-8u411-linux-aarch64.tar.gz`**

### 第一步：上次安装包到路径/usr/java

创建目录：`mkdir -p /usr/java`  
设置所有者`chown -R root:root /usr/java/`

### 第二步：解压`tar -zxvf jdk-8u411-linux-aarch64.tar.gz`

### 第三步：配置环境变量

`vim /etc/profile`  
添加以下内容

```
export JAVA_HOME=/usr/java/jdk1.8.0_411
export PATH=$JAVA_HOME/bin:$PATH
```

### 第四步：使用命令让环境变量生效：`source /etc/profile`

### 第五步：测试是否安装成功`java -version`

### 方法二：使用麒麟系统指定的openjdk

安装命令：`yum install java-1.8.0-openjdk java-1.8.0-openjdk-devel`后执行Y  
**注意：为什么要加java-1.8.0-openjdk-devel，这个是我在公司用Maven命令编译nacos源码，进行打包成适配国产达梦数据库时因报错信息，得出的经验。**

1.找到jdk位置 ，输入命令：`which java`  
2.继续查看，输入命令：`ll /usr/bin/java`  
3.继续查看java信息，输入命令：`ll /etc/alternatives/java`  
4.继续查看，输入命令：  
`ll /usr/lib/jvm/java-1.8.0-openjdk-1.8.0.402.b06-0.p01.ky10.p01.aarch64/`

*此时如果环境变量未配置的话则返回空

5.进行配置，输入命令：`vim /etc/profile`  
在最后增加：

```
export JAVA_HOME=/usr/lib/jvm/java-1.8.0-openjdk-1.8.0.402.b06-0.p01.ky10.p01.aarch64/jre
export JRE_HOME=/usr/lib/jvm/java-1.8.0-openjdk-1.8.0.402.b06-0.p01.ky10.p01.aarch64/jre
export CLASSPATH=.:${JAVA_HOME}/lib:${JRE_HOME}/lib
export PATH=${JAVA_HOME}/bin:$PATH
```

6.保存退出，输入命令：`source /etc/profile`

### 安装redis：

先查看是否安装c++的编译器； 执行 `yum -y install gcc-c++`(否则直接安装redis没依赖环境）

### 第一步：上传安装包，并将安装包用scp传输给需要的节点服务器；

### 第二步：在/usr/local/redis/路径下解压：`tar -zxvf redis-6.2.0.tar`

### 第三步：进入redis-6.2.0路径；

### 第四步：配置依赖库

latomic 代表的是 libatomic.so，麒麟ARM架构系统在编译的过程中，需要 libatomic.so 库，而系统又找不到这个库；  
解决方法是手动找到这个库，可能存在如下几种情况：  
1、通过执行下列命令安装相关依赖。  
`yum -y install libatomic libatomic_ops-devel`  
2、使用软链接的方法将依赖库libatomic.so链接到正确路径，执行如下命令：  
`ln -s /usr/lib64/libatomic.so.1.2.0 /usr/lib/libatomic.so`  
再执行 make 编译，问题解决，编译通过。

### 第五步：`make`

### 第六步：安装

输入命令：`make PREFIX=/usr/local/redis install`  

### 第七步：移动redis.conf文件到redis用户的home目录

`mv redis.conf /home/redis/`

### 第八步：更改配置文件/home/redis/redis.conf

命令：`vim redis.conf`

```
bind到本机地址：
bind IP号
设置redis访问密码(要设置为强密码，可更改)：
requirepass **********
设置log文件,pid文件，数据文件目录：
pidfile /home/redis/run/redis.pid
logfile /home/redis/log/redis.log
dir /home/redis/data
第八步：启动redis
进入src目录下，输入命令启动redis
cd src
./redis-server
```

报错  
处理方法：将`vm.overcommit_memory=1`添加到`/etc/sysctl.conf`，然后重新启动或运行命令`sudo sysctl -p`以使其生效。

### Redis三主三从交叉集群部署：

### 第一步：创建redis启动用户(非root用户）,创建节点配置文件路径：

创建用户：`sudo useradd -s /sbin/nologin -M redis`  
创建目录：`sudo mkdir -p /home/redis /home/redis/data /home/redis/run /home/redis/log`  
指定/home/redis目录属于redis用户:`sudo chown -R redis.redis /home/redis`

### 第二步：创建节点配置文件：

```
       cp redis.conf /home/redis/
       cd  /home/redis
       cp -r redis.conf redis6379.conf
       cp -r redis.conf redis6380.conf
```

每台服务器复制redis目录redis.conf为redis6379.conf和redis6380.conf为，按以下内容进行调整:

```
redis6379.conf：
pidfile /home/redis/run/redis6379.pid     #pid文件以端口来区分
port 6379                                 #监听端口不同, 可以更改端口提高安全性
logfile "/home/redis/log/redis6379.log"   #logfile以端口来区分
dir /home/redis/data                      #redis数据文件存放目录
dbfilename dump6379.rdb                   #数据文件dbfilename以端口来区分
masterauth ***********                    #主节点认证密码
requirepass ***********                   #Redis连接密码，和requirepass设置成相同的值
appendfilename "appendonly_6379.aof"      #追加文件名appendfilename以端口来区分
cluster-config-file nodes-6379.conf       #cluster-config-file以端口来区分
cluster-enabled yes                       #启用集群
bind 10.0.0.8                             #绑定IP保证集群时能正常连接
cluster-node-timeout 2000                 #集群节点超时时间
daemonize yes                             #开启守护进程
```

```
redis6380.conf：
pidfile /home/redis/run/redis6380.pid       #pid文件以端口来区分
port 6380                                   #监听端口不同, 可以更改端口提高安全性
logfile "/home/redis/log/redis6380.log"     #logfile以端口来区分
dir /home/redis/data                        #redis数据文件存放目录
dbfilename dump6380.rdb                     #数据文件dbfilename以端口来区分
masterauth ***********                      #主节点认证密码
requirepass ***********                     #Redis连接密码，和requirepass设置成相同的值
appendfilename "appendonly_6380.aof"        #追加文件名appendfilename以端口来区分
cluster-config-file nodes-6380.conf         #cluster-config-file以端口来区分
cluster-enabled yes                         #启用集群
bind 10.0.0.8                               #绑定IP保证集群时能正常连接
cluster-node-timeout 2000                   #集群节点超时时间
daemonize yes                               #开启守护进程
```

### 第三步：启动服务

三节点服务器进入路径：`cd /usr/local/redis/bin`  
命令：`sudo -u redis ./redis-server /home/redis/redis6379.conf &`  
命令：`sudo -u redis ./redis-server /home/redis/redis6380.conf &`

.8(1节点）  

.9(2节点）  

.10(3节点）  

### 第四步：启动redis集群

在服务器上使用以下命令启动redis集群  
**建议执行命令前先关闭集群各节点防火墙，集群部署成功后再开启**  
`命令：./redis-cli --cluster create 10.0.0.8:6379 10.0.0.9:6379 10.0.0.10:6379 10.0.0.9:6380 10.0.0.10:6380 10.0.0.8:6380 --cluster-replicas 1 -a ***********(密码)`  

### 第五步：检查集群是否配置成功

命令：`./redis-cli -h 10.0.0.8 -p 6379`  
输入密码：auth ***********(密码)  
查看集群信息命令：`cluster info`  
查看各节点对应关系命令：`cluster nodes`  

cluster_state:ok 代表集群可用  
cluster_known_nodes:6 代表集群有6节点  
列出集群当前已知的所有节点（ node），以及这些节点的对应关系信息。命令:`cluster nodes`  

### 第六步：放行端口

如集群配置完成后开启防火墙报节点无法连接，需做放行端口配置：  
放行端口：  
`firewall-cmd --zone=public --add-port=6379/tcp --permanent` 放行6379端口  
`firewall-cmd --zone=public --add-port=6380/tcp --permanent` 放行6380端口

`firewall-cmd --zone=public --add-port=16379/tcp --permanent` 放行16379 redis内部通讯端口  
`firewall-cmd --zone=public --add-port=16380/tcp --permanent` 放行16380 redis内部通讯端口

`firewall-cmd --reload` 重新载入 返回 success 代表成功

`firewall-cmd --zone=public --query-port=6379/tcp` 查看 返回 yes 代表开启成功  
`firewall-cmd --zone=public --query-port=6380/tcp` 查看 返回 yes 代表开启成功

`firewall-cmd --zone=public --query-port=16379/tcp` 查看 返回 yes 代表开启成功  
`firewall-cmd --zone=public --query-port=16380/tcp`  查看 返回 yes 代表开启成功

### 第七步：配置开机自启

1、分别在各节点添加以下redis.service文件  
命令：`vim /etc/systemd/system/redis6379.service`  
添加：

```
[Unit]
Description=Redis persistent key-value database
After=network.target
After=network-online.target
Wants=network-online.target

[Service]
Type=forking
ExecStart=/usr/local/redis/bin/redis-server /home/redis/redis6379.conf
ExecReload=/usr/local/redis/bin/redis-server -s reload
ExecStop=/usr/local/redis/bin/redis-server -s stop
PrivateTmp=true

User=redis
Group=redis

[Install]
WantedBy=multi-user.target
```

命令：`vim /etc/systemd/system/redis6380.service`  
添加：

```
[Unit]
Description=Redis persistent key-value database
After=network.target
After=network-online.target
Wants=network-online.target

[Service]
Type=forking
ExecStart=/usr/local/redis/bin/redis-server /home/redis/redis6380.conf
ExecReload=/usr/local/redis/bin/redis-server -s reload
ExecStop=/usr/local/redis/bin/redis-server -s stop
PrivateTmp=true

User=redis
Group=redis

[Install]
WantedBy=multi-user.target
```

2、启用服务：  
重新加载systemd配置：`sudo systemctl daemon-reload`  
并执行以下命令：

```
ps -ef |grep redis
kill -9 pid
sudo systemctl enable redis6379.service
sudo systemctl start redis6379.service

sudo systemctl enable redis6380.service
sudo systemctl start redis6380.service
```

检查服务状态：

```
sudo systemctl status redis6379.service
sudo systemctl status redis6380.service
```

有running信息状态输出表示启动成功  
**参考命令：**  
`systemctl stop redis-6379.service` # 停止redis服务  
`systemctl restart redis-6379.service` # 重启redis服务

`systemctl stop redis-6380.service` # 停止redis服务  
`systemctl restart redis-6380.service` # 重启redis服务

### 验证：

### 方法一：

```
sudo systemctl is-enabled redis6379.service
sudo systemctl is-enabled redis6380.service
```

返回enabled说明配置成功

### 方法二：重启

`reboot`
