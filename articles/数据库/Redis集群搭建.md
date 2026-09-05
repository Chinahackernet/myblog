# 一、Redis主从

## 1.1 Redis主从原理

和MySQL需要主从复制的原因一样，Redis虽然读取写入的速度都特别快，但是也会产生性能瓶颈，特别是在读压力上，为了分担压力，Redis支持主从复制。Redis的主从结构一主一从，一主多从或级联结构，复制类型可以根据是否是全量而分为全量同步和增量同步。

下图为级联结构：

![image.png](assets/数据库/Redis集群搭建/Redis集群搭建-1.png)

### 1.1.1 全量同步

Redis全量复制一般发生在slave的初始阶段，这时slave需要将master上的数据都复制一份，具体步骤如下：

（1）、slave连接master，发送SYNC命令；

（2）、master街道SYNC命令后，执行BGSAVE命令生产RDB文件并使用缓冲区记录此后执行的所有写命令；

（3）、master的BGSAVE执行完成后，向所有的slave发送快照文件，并在发送过程中继续记录执行的写命令；

（4）、slave收到快照后，丢弃所有的旧数据，载入收到的数据；

（5）、master快照发送完成后就会开始向slave发送缓冲区的写命令；

（6）、slave完成对快照的载入，并开始接受命令请求，执行来自master缓冲区的写命令；

（7）、slave完成上面的数据初始化后就可以开始接受用户的读请求了。

大致流程图如下：

![image.png](assets/数据库/Redis集群搭建/Redis集群搭建-2.png)

  

### 1.1.2 增量复制

增量复制实际上就是在slave初始化完成后开始正常工作时master发生写操作同步到slave的过程。增量复制的过程主要是master每执行一个写命令就会向slave发送相同的写命令，slave接受并执行写命令，从而保持主从一致。

  

## 1.2 Redis主从同步的策略

主从同步刚连接的时候进行全量同步；全量同步结束后开始增量同步。如果有需要，slave在任何时候都可以发起全量同步，其主要策略就是无论如何首先会尝试进行增量同步，如果步成功，则会要求slave进行全量同步，之后再进行增量同步。

注意：如果多个slave同时断线需要重启的时候，因为只要slave启动，就会和master建立连接发送SYNC请求和主机全量同步，如果多个同时发送SYNC请求，可能导致master IO突增而发送宕机。

  

## 1.3 Redis主从同步的特点

（1）、采用异步复制；

（2）、可以一主多从；

（3）、主从复制对于master来说是非阻塞的，也就是说slave在进行主从复制的过程中，master依然可以处理请求；

（4）、主从复制对于slave来说也是非阻塞的，也就是说slave在进行主从复制的过程中也可以接受外界的查询请求，只不过这时候返回的数据不一定是正确的。为了避免这种情况发生，可以在slave的配置文件中配置，在同步过程中阻止查询；

（5）、每个slave可以接受来自其他slave的连接；

（6）、主从复制提高了Redis服务的扩展性，避免单节点问题，另外也为数据备份冗余提供了一种解决方案；

（7）、为了降低主redis服务器写磁盘压力带来的开销，可以配置让主redis不在将数据持久化到磁盘，而是通过连接让一个配置的从redis服务器及时的将相关数据持久化到磁盘，不过这样会存在一个问题，就是主redis服务器一旦重启，因为主redis服务器数据为空，这时候通过主从同步可能导致从redis服务器上的数据也被清空；

  

## 1.4 Redis主从同步的搭建

```plain
下载软件包
# wget http://download.redis.io/releases/redis-4.0.10.tar.gz

解压软件包，主从都需要做（本次是单机多实例来做主从）
# tar xf redis-4.0.10.tar.gz -C /home/redis/6379/
# tar xf redis-4.0.10.tar.gz -C /home/redis/6380/

编译安装
# yum install -y gcc gcc++
# make MALLOC=libc

启动Redis（修改了Redis运行方式为守护进程方式）
# /home/redis/6379/redis-4.0.10/src/redis-server /home/redis/6379/redis-4.0.10/redis.conf

从库做相同的操作，由于是单机多实例，所以修改从库的port为6380，启动从库
# /home/redis/6380/redis-4.0.10/src/redis-server /home/redis/6380/redis-4.0.10/redis.conf

Redis测试
master：
[root@alex redis-4.0.10]# ./src/redis-cli
127.0.0.1:6379> set name 111
OK
127.0.0.1:6379> get name
"111"
slave：
[root@alex redis-4.0.10]# ./src/redis-cli -p 6380
127.0.0.1:6380> set name slave
OK
127.0.0.1:6380> get name
"slave"

主从搭建
1、只需要配置slave，指明master的IP地址和port就可以了，配置完后重启实例
# slaveof <masterip> <masterport>
slaveof 127.0.0.1 6379

测试：
master：
[root@alex redis-4.0.10]# ./src/redis-cli
127.0.0.1:6379> set password 123456
OK
127.0.0.1:6379> get password
"123456"

slave：
[root@alex redis-4.0.10]# ./src/redis-cli -p 6380
127.0.0.1:6380> get password
"123456"

在master上设定键值对，在slave上能够准确的查出来，主从配置成功
```

  

# 二、Redis哨兵

## 2.1 Redis哨兵机制

在主从复制实现之后，如果想对master进行监控，Redis提供了一种哨兵机制，哨兵的含义就是监控Redis系统的运行状态，并做相应的响应。

### 2.1.1 哨兵的功能

其主要的功能有以下两点：

（1）、监控所有Redis节点是否正常运行；

（2）、master故障后可以通过投票机制，从slave中选举出新的master，保证集群正常运行。

在一个一主多从的集群中，可以启用多个哨兵进行监控以保证集群足够稳健，这种情况下，哨兵不仅监控主从服务，哨兵之间也会相互监控，建议哨兵至少3个并且是奇数。

### 2.1.2 哨兵的任务

哨兵主要用于管理多个Redis服务器，主要有以下三个任务：

（1）、监控：哨兵会不断的检测master和slave之间是否运行正常；

（2）、提醒：当监控的某个Redis出现问题，哨兵可以通过API向管理员或其他应用程序发送通知；

（3）、故障迁移：当一个master不能正常工作时，哨兵会开始一次自动故障迁移操作，它会将失效master的其中一个slave提升为master，并让失效master和其他slave该为复制新的master，当客户端试图连接失效的master时，集群也会向客户端返回新的master地址，使得集群可以使用新的master代替失效的master。

## 2.2 Redis哨兵的工作原理

哨兵是一个分布式系统,你可以在一个架构中运行多个哨兵(sentinel) 进程,这些进程使用流言协议来接收关于Master是否下线的信息,并使用投票协议来决定是否执行自动故障迁移,以及选择哪个Slave作为新的Master。

每个哨兵会向其它哨兵、master、slave定时发送消息,以确认对方是否”活”着,如果发现对方在指定时间(可配置)内未回应,则暂时认为对方已挂。若“哨兵群”中的多数sentinel都报告某一master没响应,系统才认为该master"彻底死亡"，通过一定的vote算法,从剩下的slave节点中,选一台提升为master,然后自动修改相关配置。

虽然哨兵释出为一个单独的可执行文件 redis-sentinel ,但实际上它只是一个运行在特殊模式下的 Redis 服务器，你可以在启动一个普通 Redis 服务器时通过给定 --sentinel 选项来启动哨兵。

### 2.2.1 监控

sentinel会每秒一次的频率与之前创建了命令连接的实例发送PING，包括主服务器、从服务器和sentinel实例，以此来判断当前实例的状态。down-after-milliseconds时间内PING连接无效，则将该实例视为主观下线。之后该sentinel会向其他监控同一主服务器的sentinel实例询问是否也将该服务器视为主观下线状态，当超过某quorum后将其视为客观下线状态。

当一个主服务器被某sentinel视为客观下线状态后，该sentinel会与其他sentinel协商选出零头sentinel进行故障转移工作。每个发现主服务器进入客观下线的sentinel都可以要求其他sentinel选自己为领头sentinel，选举是先到先得。同时每个sentinel每次选举都会自增配置纪元，每个纪元中只会选择一个领头sentinel。如果所有超过一半的sentinel选举某sentinel领头sentinel。之后该sentinel进行故障转移操作。

如果一个Sentinel为了指定的主服务器故障转移而投票给另一个Sentinel，将会等待一段时间后试图再次故障转移这台主服务器。如果该次失败另一个将尝试，Redis Sentinel保证第一个活性(liveness)属性，如果大多数Sentinel能够对话，如果主服务器下线，最后只会有一个被授权来故障转移。 同时Redis Sentinel也保证安全(safety)属性，每个Sentinel将会使用不同的配置纪元来故障转移同一台主服务器。

### 2.2.2 故障迁移

首先是从主服务器的从服务器中选出一个从服务器作为新的主服务器。选点的依据依次是：网络连接正常->5秒内回复过INFO命令->10\*down-after-milliseconds内与主连接过的->从服务器优先级->复制偏移量->运行id较小的。选出之后通过slaveif no ont将该从服务器升为新主服务器。

其次通过slaveof ip port命令让其他从服务器复制该信主服务器。

最后当旧主重新连接后将其变为新主的从服务器。注意如果客户端与就主服务器分隔在一起，写入的数据在恢复后由于旧主会复制新主的数据会造成数据丢失。

故障转移成功后会通过发布订阅连接广播新的配置信息，其他sentinel收到后依据配置纪元更大来更新主服务器信息。Sentinel保证第二个活性属性：一个可以相互通信的Sentinel集合会统一到一个拥有更高版本号的相同配置上。    

### 2.2.3 缺点

（1）、主从服务器的数据要经常进行主从复制，这样会造成性能下降；

（2）、当主服务器宕机后，从服务器切换成主服务器的那段时间，服务是不可用的。

  

## 2.3 Redis哨兵模式搭建

主从模式搭建看上面的步骤，以下主要是在主从搭建完的基础上搭建哨兵模式。

```plain
配置sentinel.conf文件
#工作路径，注意路径不要和主重复
dir "/tmp/23679"
#哨兵监控的master，主从配置一样，这里只用输入redis主节点的ip/port和法定人数。
sentinel monitor mymaster 192.168.125.128 6379 1
# master或slave多长时间（默认30秒）不能使用后标记为s_down状态。
sentinel down-after-milliseconds mymaster 5000
#若sentinel在该配置值内未能完成failover操作（即故障时master/slave自动切换），则认为本次failover失败。
sentinel failover-timeout mymaster 18000
#指定了在执行故障转移时， 最多可以有多少个从服务器同时对新的主服务器进行同步，有几个slave就设置几个
sentinel parallel-syncs mymaster 2

# 启动哨兵
/home/redis/26379/redis-4.0.10/src/redis-server /home/redis/26379/redis-4.0.10/sentinel.conf --sentinel

通过哨兵查看集群状态
[root@alex redis-4.0.10]# ./src/redis-cli -p 26379
127.0.0.1:26379> sentinel master mymaster
 1) "name"
2) "mymaster"
3) "ip"
4) "172.16.0.169"
5) "port"
6) "6379"
7) "runid"

127.0.0.1:26379> sentinel slaves mymaster
1)  1) "name"                                           # slave 1
    2) "127.0.0.1:6381"
    3) "ip"
    4) "127.0.0.1"
    5) "port"
    6) "6381"
    7) "runid"
    8) "0419f313098f6af1b4ccdb189d6beb22edf27a1c"

2)  1) "name"                                            # slave2
    2) "127.0.0.1:6380"
    3) "ip"
    4) "127.0.0.1"
    5) "port"
    6) "6380"
    7) "runid"
    8) "5b00b502a93245f7916efd1f564bd40b16aa7b22"

模拟主down掉
观察sentinel的状态
127.0.0.1:26379> sentinel master mymaster
1) "name"
2) "mymaster"
3) "ip"
4) "127.0.0.1"
5) "port"
6) "6381"                # 已经从6379切换到6381
7) "runid"
8) "0419f313098f6af1b4ccdb189d6beb22edf27a1c"

# 相应的slave也做了切换
127.0.0.1:26379> sentinel slaves mymaster
1)  1) "name"
    2) "127.0.0.1:6379"
    3) "ip"
    4) "127.0.0.1"
    5) "port"
    6) "6379"
    7) "runid"
    8) ""
    9) "flags"
   10) "s_down,slave,disconnected"

2)  1) "name"
    2) "127.0.0.1:6380"
    3) "ip"
    4) "127.0.0.1"
    5) "port"
    6) "6380"
    7) "runid"
    8) "5b00b502a93245f7916efd1f564bd40b16aa7b22"
```

  

# 三、Redis集群

Redis在3.0版本开始正式引用集群特性，Redis集群是一个分布式，高容错的内存K/V系统，集群可以使用的功能是普通单机Redis所使用的功能的一个子集，比如，Redis集群并不支持处理多个keys的命令，因为这需要在不同节点间移动数据，从而达不到像Redis那样的性能，在高负载的情况下可能会出现无法预估的错误。

## 3.1 Redis集群的特征

Redis集群有以下几个重要的特征：

（1）、Redis集群的分片特征在于将空间拆分为16384个槽位，某一个节点负责其中一些槽位；

（2）、Redis集群提供一定程度的可用性，可以在某个节点宕机或者不可达的情况继续处理命令；

（3）、Redis集群不存在中心节点或代理节点，集群的其中一个最重要的设计目标是达到线性可扩展性；

其架构如下：

![image.png](assets/数据库/Redis集群搭建/Redis集群搭建-3.png)

  

其中每一个圆代表一个节点，任何两个节点是互通的，可以归纳以下几点：

-   所有的节点相互连接；
-   集群消息通信通过集群总线通信，，集群总线端口大小为客户端服务端口+10000，这个10000是固定值；
-   节点与节点之间通过二进制协议进行通信；
-   客户端和集群节点之间通信和通常一样，通过文本协议进行；
-   集群节点不会代理查询；

  

## 3.2 Redis集群的原理

Redis Cluster中有一个16384长度的槽的概念，他们的编号为0、1、2、3……16382、16383。这个槽是一个虚拟的槽，并不是真正存在的。正常工作的时候，Redis Cluster中的每个Master节点都会负责一部分的槽，当有某个key被映射到某个Master负责的槽，那么这个Master负责为这个key提供服务，至于哪个Master节点负责哪个槽，这是可以由用户指定的，也可以在初始化的时候自动生成（redis-trib.rb脚本）。这里值得一提的是，在Redis Cluster中，只有Master才拥有槽的所有权，如果是某个Master的slave，这个slave只负责槽的使用，但是没有所有权。

如下所示：

![image.png](assets/数据库/Redis集群搭建/Redis集群搭建-4.png)

那么Redis集群是怎么存储的呢？

首先，在redis的每一个节点上，都有这么两个东西，一个是插槽（slot）可以理解为是一个可以存储两个数值的一个变量这个变量的取值范围是：0-16383。还有一个就是cluster我个人把这个cluster理解为是一个集群管理的插件。当我们的存取的key到达的时候，redis会根据crc16的算法得出一个结果，然后把结果对 16384 求余数，这样每个 key 都会对应一个编号在 0-16383 之间的哈希槽，通过这个值，去找到对应的插槽所对应的节点，然后直接自动跳转到这个对应的节点上进行存取操作。

还有就是因为如果集群的话，是有好多个redis一起工作的，那么，就需要这个集群不是那么容易挂掉，所以，理论上就应该给集群中的每个节点至少一个备用的redis服务，这个备用的redis称为从节点（slave）。然后，每一个节点都存有这个集群所有主节点以及从节点的信息，它们之间通过互相的ping-pong判断是否节点可以连接上。

如果有一半以上的节点去ping一个节点的时候没有回应，集群就认为这个节点宕机了，然后去连接它的备用节点。如果某个节点和所有从节点全部挂掉，我们集群就进入faill状态。还有就是如果有一半以上的主节点宕机，那么我们集群同样进入发力了状态。这就是我们的redis的投票机制。

具体的原理图如下：

![image.png](assets/数据库/Redis集群搭建/Redis集群搭建-5.png)

  
      (1)、投票过程是集群中所有master参与,如果半数以上master节点与master节点通信超时(cluster-node-timeout)认为当前master节点挂掉.

(2)、什么时候整个集群不可用(cluster\_state:fail)

    a、如果集群任意master挂掉,且当前master没有slave.集群进入fail状态,也可以理解成集群的slot映射[0-16383]不完整时进入fail状态. ps : redis-3.0.0.rc1加入cluster-require-full-coverage参数,默认关闭,打开集群兼容部分失败。

    b、如果集群超过半数以上master挂掉，无论是否有slave，集群进入fail状态。

## 3.3 Redis集群搭建

要求：至少6个节点，3主3从。

  

```plain
Redis.conf配置：大致如下
port 7000
cluster-enabled yes
cluster-config-file nodes.conf
cluster-node-timeout 5000
appendonly yes

# 创建集群
    redis集群的命令工具redis-trib可以让我们创建集群变得非常简单。redis-trib是一个用ruby写的脚本，用于给各节点发指令创建集群、检查集群状态或给集群重新分片等。
    redis-trib在Redis源码的src目录下，需要gem redis来运行redis-trib。

# 安装ruby环境
# yum install rubygems -y
1.安装curl
sudo yum install curl
2. 安装RVM
curl -L get.rvm.io | bash -s stable 
3. 
source /usr/local/rvm/scripts/rvm
4. 查看rvm库中已知的ruby版本
rvm list known
5. 安装一个ruby版本
rvm install 2.3.3
6. 使用一个ruby版本
rvm use 2.3.3
7. 设置默认版本
rvm remove 2.0.0
8. 卸载一个已知版本
ruby --version
9. 再安装redis就可以了
gem install redis

# 启动集群
./redis-trib.rb create --replicas 1 127.0.0.1:7000 127.0.0.1:7001 127.0.0.1:7002 127.0.0.1:7003 127.0.0.1:7004 127.0.0.1:7005

# 测试集群
[root@alex redis_cluster]# 7000/redis-4.0.10/src/redis-cli -c -p 7000
127.0.0.1:7000> set name alex
-> Redirected to slot [5798] located at 127.0.0.1:7001
OK
127.0.0.1:7001> get name
"alex"
```

## 3.4 Redis集群迁移

用户需要把redis的数据迁移到redis集群，原来的数据可能是只有一个主节点，也可能是用已有的方式分片过，key被存储在N个几节点中。

上面2中情况都很容易迁移，特别重要的细节是是否使用了多个key以及是如何使用多个key的。下面是3种不同的情况：

  

1.  没有操作多个key（包括操作多个key的指令、事务、lua脚本）。所有key都是独立操作的.
2.  操作了多个key（包括操作多个key的指令、事务、lua脚本），但这些key都有相同的哈希标签，比如这些被同时操作的key：SUNION{user:1000}.foo {user:1000}.bar
3.  操作了多个key（包括操作多个key的指令、事务、lua脚本），这些key没有特别处理，也没有相同标签。  
    

  

第三种情况redis集群没法处理，需要修改应用程序，不要使用多个key，或者给这些key加上相同的哈希标签。  
第一和第二种情况可以处理，而且他们的处理方式一样。  
    假设你已有的数据被分成N个主节点存储（当N=1时，就是没有分片的情况），要把数据迁移到redis集群，需要执行下面几个步骤：

1.  停止你的客户端。目前没有自动在线迁移到redis集群的方法。你可以自己策划如何让你的应用程序支持在线迁移。
2.  使用BGREWRITEAOF指令让所有主节点产生AOF文件，并且等待这些文件创建完成。
3.  把这些AOF文件保存下来，分别命名为aof-1, aof-2, ..aof-N，如果需要，可以停止原来的redis实例（对于非虚拟化部署，需要重用这台电脑来说，把旧进程停掉很有帮助）。
4.  创建N个主节点+0个从节点的redis集群。晚些时候再添加从节点。请确认所有节点都开启了appendonly的配置。
5.  停止集群的所有节点，然后用刚才保存的AOF文件，代替每个节点的AOF文件，aof-1给第一个节点，aof-2给第二个节点，以此类推。
6.  重启所有节点，这些节点可能会提示说根据配置有些key不应该存储在这个节点。
7.  使用redis-trib fix指令，让集群自动根据哈希槽迁移数据
8.  使用redis-trib check指令确保你的集群是正常的
9.  让你的客户端使用redis集群客户端库，并重启它。