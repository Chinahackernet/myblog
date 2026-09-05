# **Redis Cluster集群**

# 1、redis-cluster设计

Redis集群搭建的方式有多种，例如使用zookeeper等，但从redis 3.0之后版本支持redis-cluster集群，Redis-Cluster采用无中心结构，每个节点保存数据和整个集群状态,每个节点都和其他所有 节点连接。其redis-cluster架构图如下：

![Image.png](assets/数据库/Redis5.0_之Redis_cluster集群/Redis5.0_之Redis_cluster集群-1.png)

客户端访问任何服务器都可获得集群全部数据

  

-   Redis集群是一个可以在多个Redis节点之间进行数据共享的设施  
    
-   Redis集群不支持那些需要同时处理多个键的Redis命令, 因为执行这些命令需要在多个Redis节点之间移动数据,并且在高负债的情况下,这些命令将降低Redis集群的性能,并导致不可预测的行为.  
    
-   Redis集群通过分区来提供一定程度的可用性:即使集群中有一部分节点失效或者无法进行通信,集群也可以继续处理命令请求.  
    
-   将数据自动切分到多个节点的能力  
    

  

其结构特点：

     1、所有的redis节点彼此互联(PING-PONG机制),内部使用二进制协议优化传输速度和带宽。

     2、节点的fail是通过集群中超过半数的节点检测失效时才生效。

     3、客户端与redis节点直连,不需要中间proxy层.**客户端不需要连接集群所有节点,连接集群中任何一个可用节点即可**。

     4、redis-cluster把所有的物理节点映射到[0-16383]slot上（不一定是平均分配）,cluster 负责维护node<->slot<->value。

     5、Redis集群预分好16384个桶，当需要在 Redis 集群中放置一个 key-value 时，根据 CRC16(key) % 16384的值，决定将一个key放到哪个桶中。

        节点A负责处理0号到5500号哈希槽

        节点B负责处理5501号到11000号哈希槽

        节点C负责处理11001号到16384号哈希槽

  

  

# 2.redis-cluster 主从模式

redis cluster 为了保证数据的高可用性，加入了主从模式，一个主节点对应一个或多个从节点，主节点提供数据存取，从节点则是从主节点拉取数据备份，当这个主节点挂掉后，就会有这个从节点选取一个来充当主节点，从而保证集群不会挂掉。

  

       集群有ABC三个主节点, 如果这3个节点都没有加入从节点，如果B挂掉了，我们就无法访问整个集群了。A和C的slot也无法访问。

  

     所以我们在集群建立的时候，一定要为每个主节点都添加了从节点, 比如像这样, 集群包含主节点A、B、C, 以及从节点A1、B1、C1, 那么即使B挂掉系统也可以继续正确工作。

  

     B1节点替代了B节点，所以Redis集群将会选择B1节点作为新的主节点，集群将会继续正确地提供服务。 当B重新开启后，它就会变成B1的从节点。

  

    不过需要注意，如果节点B和B1同时挂了，Redis集群就无法继续正确地提供服务了。

  

# 3.redis集群搭建

集群中至少应该有奇数个节点，所以至少有三个节点，每个节点至少有一个备份节点，所以下面使用6节点（主节点、备份节点由redis-cluster集群确定） 此处采用redis-5.0

redis-5.0.0之后已经将 redis-trib.rb 脚本的功能全部集成到 redis-cli之中了  以下 基于redis-cli 的 --cluster 来搭建集群

  

## 3.1 安装redis 略

## 3.2 准备配置文件

Redis要求 一主一从的搭配至少要 六个节点，形成三对主从  6台机器配置相同

  

daemonize    yes                    # redis后台运行 (脚本启动无意义)

pidfile  /var/run/redis\_6379.pid   #pid文件 

port  6379                              #端口

cluster-enabled  yes              #开启集群

cluster-config-file  nodes-6379.conf #集群的配置文件  在dir配置目录下

cluster-node-timeout  5000         #超时时间 5s够了

appendonly  yes                    #开启AOF日志 在dir配置目录下

bind 172.17.10.89                 #修改为局域网中的IP地址，其他节点可通过局域网IP访问

dir /usr/local/redis              #持久化文件存放目录 提前创建并给写权限

  

## 3.3  依次启动各个Redis节点

[root@redis-1 ~]# systemctl restart redis

.....

[root@redis-6 ~]# systemctl restart redis

  

  

  

## 3.4  使用 reids-cli 搭建 Redis集群

[root@redis-1 ~]# redis-cli --cluster create 10.10.11.116:6379  10.10.11.117:6379 10.10.11.118:6379 10.10.11.121:6379 10.10.11.122:6379 10.10.11.123:6379   **\--cluster-replicas 1**

**\--cluster-replicas 1  命令的意思： 一主一从配置，六个节点就是 三主三从**

## 3.5 查看集群

[root@redis-1 ~]# **redis-cli --cluster check 10.10.11.116:6379**   #填写任意节点即可 会带出所有的

10.10.11.116:6379 (3977141b...) -> 0 keys | 5461 slots | 1 slaves.

10.10.11.118:6379 (18c52053...) -> 0 keys | 5461 slots | 1 slaves.

10.10.11.117:6379 (7d54bc3b...) -> 0 keys | 5462 slots | 1 slaves.

[OK] 0 keys in 3 masters.

0.00 keys per slot on average.

\>>> Performing Cluster Check (using node 10.10.11.116:6379)

M: 3977141b6e93471534ba5925dd544e09efec1bdc 10.10.11.116:6379

   slots:[0-5460] (5461 slots) master

   1 additional replica(s)

S: 9797d86ebd33040a89a05f52949ee13493c7fb7a 10.10.11.121:6379

   slots: (0 slots) slave

   replicates 18c52053146ca1ff99a581e89640ff79617f9f14

M: 18c52053146ca1ff99a581e89640ff79617f9f14 10.10.11.118:6379

   slots:[10923-16383] (5461 slots) master

   1 additional replica(s)

M: 7d54bc3b4bc48f374cd5eacc4a0124855bf9aef9 10.10.11.117:6379

   slots:[5461-10922] (5462 slots) master

   1 additional replica(s)

S: d1e39dce540e9d1976178b6d1d88a7d543f1a8d8 10.10.11.122:6379

   slots: (0 slots) slave

   replicates 3977141b6e93471534ba5925dd544e09efec1bdc

S: 1a30feee68d12df53efd4bd5d51d883e1faa6851 10.10.11.123:6379

   slots: (0 slots) slave

   replicates 7d54bc3b4bc48f374cd5eacc4a0124855bf9aef9

[OK] All nodes agree about slots configuration.

\>>> Check for open slots...

\>>> Check slots coverage...

[OK] All 16384 slots covered.

  

  

  

  

## 3.6 测试集群

**redis-cli -c -h {IP} -p {PORT} # -c 表示连接集群节点**

[root@redis-1 ~]# **redis-cli -c -h 10.10.11.116 -p 6379**

10.10.11.116:6379> set a b

\-> Redirected to slot [15495] located at 10.10.11.118:6379

OK

10.10.11.118:6379> get a

"b"

10.10.11.118:6379>

  

进行 读写操作时会根据 key计算出的slot，重新定位到 拥有该slot的节点，执行对应的命令。

**只有 Master节点拥有 slot**，读写都在 Master 节点进行

**![Image.png](assets/数据库/Redis5.0_之Redis_cluster集群/Redis5.0_之Redis_cluster集群-2.png)**