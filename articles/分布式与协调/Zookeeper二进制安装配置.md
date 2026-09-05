```plain
[root@service01 ~]# vim /etc/profile              #配置JAVA环境
export JAVA_HOME=/usr/local/jdk/
export JRE_HOME=${JAVA_HOME}/jre
export CLASSPATH=.:${JAVA_HOME}/lib/dt.jar:${JAVA_HOME}/lib/tools.jar
export PATH=${JAVA_HOME}/bin::$PATH
```
```plain
[root@service01 ~]# wget https://mirrors.tuna.tsinghua.edu.cn/apache/zookeeper/zookeeper-3.4.14/zookeeper-3.4.14.tar.gz
[root@service01 ~]# tar xvf zookeeper-3.4.14.tar.gz -C /data/
[root@service01 ~]# mv /data/zookeeper-3.4.14/ /data/zookeeper
[root@service01 ~]# grep ^[a-z] /data/zookeeper/conf/zoo.cfg 
tickTime=2000               #tickTime表示服务器之间或客户端与服务器之间心跳的时间间隔，单位为毫秒
initLimit=10                #follower与leader的初始连接心跳数
syncLimit=5                 #follower与leader请求和应答的最大心跳数
dataDir=/data/zookeeper/data           #快照数据保存目录
dataLogDir=/data/zookeeper/logs        #日志保存目录
clientPort=2181                             #客户端连接端口
maxClientCnxns=60                          #客户端最大连接数,默认为60个
quorumListenOnAllIPs=false               #默认为false，设置成true，zk将监听所有可用ip地址的连接
server.1=192.168.10.242:3181:4181       #如果部署zookeeper集群，需配置节点信息，
server.2=192.168.10.26:3181:4181
server.3=192.168.10.39:3181:4181
server.A=B：C：D：
A 是一个数字，表示这个是第几号服务器，与myid对应；
B 是这个服务器的 ip 地址；
C 表示的是这个服务器与集群中的 Leader 服务器交换信息的端口；
D 表示的是万一集群中的 Leader 服务器挂了，需要一个端口来重新进行选举，选出一个新的 Leader，而这个端口就是用来执行选举时服务器相互通信的端口。
如果节点为observer：server.A=B:C:D:observer
#如果部署的zookeeper集群需配置节点ID
[root@service01 ~]# mkdir /data/zookeeper/data
[root@service01 ~]# echo 1 > /data/zookeeper/data/myid      #每个zookeeper节点ID需不一致
[root@service02 ~]# mkdir /data/zookeeper/data
[root@service02 ~]# echo 2 > /data/zookeeper/data/myid
[root@service03 ~]# mkdir /data/zookeeper/data
[root@service03 ~]# echo 3 > /data/zookeeper/data/myid
[root@service01 ~]# /data/zookeeper/bin/zkServer.sh start      #启动zookeeper，默认使用配置文件为安装目录下conf/zoo.cfg，可在启动命令后跟指定配置文件
[root@service01 ~]# /data/zookeeper/bin/zkServer.sh stop       #停止zookeeper
[root@service01 ~]# /data/zookeeper/bin/zkServer.sh status     #查看当前节点状态，Leader：主节点，提供读写；Follower：备节点，参与Leader选举，提供读请求；Observer：不参与选举的投票和写请求，只负责处理读请求、并向Leader转发写请求
[root@service01 ~]# /data/zookeeper/bin/zkCli.sh           #连接本地节点查看目录信息
[zk: localhost:2181(CONNECTED) 0] ls /
[zookeeper]
[root@service01 ~]# /data/zookeeper/bin/zkCli.sh -server 192.168.10.26:2181        #连接远程节点
[root@service01 ~]# vim /usr/lib/systemd/system/zookeeper.service       #配置systemctl管理 
[Unit]
Description=zookeeper.service
After=network.target
[Service]
Type=forking
User=root
Group=root
Environment=PATH=/usr/local/jdk/bin:/usr/local/git/bin:/usr/local/sbin:/usr/local/bin:/sbin:/bin:/usr/sbin:/usr/bin:/root/bin
WorkingDirectory=/data/zookeeper
ExecStart=/data/zookeeper/bin/zkServer.sh start
ExecStop=/data/zookeeper/bin/zkServer.sh stop
ExecReload=/data/zookeeper/bin/zkServer.sh restart
PrivateTmp=true
Restart=always
# Restart service after 10 seconds if the dotnet service crashes:
RestartSec=10
SyslogIdentifier=zookeeper-example
[Install]
WantedBy=multi-user.target
```