# Redis集群方案

> 分类：Database / 第20章：Redis
> 原文：https://www.cuiliangblog.cn/detail/section/31467459
> 来源：崔亮的博客

---

# 一、常见Redis集群五种方案：
1. 官方cluster方案
2. twemproxy代理方案
3. 哨兵模式
4. codis
5. 客户端分片

# 二、官方cluser方案
1. 从redis      3.0版本开始支持redis-cluster集群，redis-cluster采用无中心结构，每个节点保存数据和整个集群状态，每个节点都和其他
2. 节点连接。redis-cluster是一种服务端分片技术。
3. redis-cluster架构图

![](assets/07-Database/7cb9e82e0f05f0168631.png)

1. redis-cluster特点：
+ 每个节点都和n-1个节点通信，这被称为集群总线（cluster      bus）。它们使用特殊的端口号，即对外服务端口号加10000。所以要维护好这个集群的每个节点信息，不然会导致整个集群不可用，其内部采用特殊的二进制协议优化传输速度和带宽。
+ redis-cluster把所有的物理节点映射到[0,16383]slot（槽）上，cluster负责维护node--slot--value。
+ 集群预分好16384个桶，当需要在redis集群中插入数据时，根据CRC16(KEY)      mod 16384的值，决定将一个key放到哪个桶中。
+ 客户端与redis节点直连，不需要连接集群所有的节点，连接集群中任何一个可用节点即可。
+ redis-trib.rb脚本（rub语言）为集群的管理工具，比如自动添加节点，规划槽位，迁移数据等一系列操作。
+ 节点的fail是通过集群中超过半数的节点检测失效时才生效。
+ 整个cluster被看做是一个整体，客户端可连接任意一个节点进行操作，当客户端操作的key没有分配在该节点上时，redis会返回转向指令，指向正确的节点。
+ 为了增加集群的可访问性，官方推荐的方案是将node配置成主从结构，即一个master主节点，挂n个slave从节点。如果主节点失效，redis      cluster会根据选举算法从slave节点中选择一个上升为master节点，整个集群继续对外提供服务。

# 三、twemproxy代理方案
1. twemproxy代理架构图：

![](assets/07-Database/7fe868d3dac8e0e83ba0.png)

 

1. Redis代理中间件twemproxy是一种利用中间件做分片的技术。twemproxy处于客户端和服务器的中间，将客户端发来的请求，进行一定的处理后（sharding），再转发给后端真正的redis服务器。也就是说，客户端不直接访问redis服务器，而是通过twemproxy代理中间件间接访问。降低了客户端直连后端服务器的连接数量，并且支持服务器集群水平扩展。
2. twemproxy中间件的内部处理是无状态的，它本身可以很轻松地集群，这样可以避免单点压力或故障。

# 四、哨兵模式
1. Sentinel（哨兵）是Redis的高可用性解决方案：由一个或多个Sentinel实例组成的Sentinel系统可以监视任意多个主服务器以及这些主服务器下的所有从服务器，并在被监视的主服务器进入下线状态时，自动将下线主服务器属下的某个从服务器升级为新的主服务器。
+ 架构图

![](assets/07-Database/9797d70a64f9641ecc28.png)

+ 在Server1掉线后：

![](assets/07-Database/43d5138cb35960397eff.png)

+ 升级Server2为新的主服务器：

![](assets/07-Database/31e83fc9a5a4a2aff601.png)

1. Sentinel的工作方式
+ 每个Sentinel以每秒钟一次的频率向它所知的Master、Slave以及其他Sentinel实例发送一个PING命令。
+ 如果一个实例距离最后一次有效回复PING命令的时间超过down-after-milliseconds选项所指定的值，则这个实例会被Sentinel标记为主观下线。
+ 如果一个Master被标记为主观下线，则正在监视这个Master的所有Sentinel要以每秒一次的频率确认Master的确进入了主观下线状态。
+ 当有足够数量的Sentinel（大于等于配置文件指定的值）在指定的时间范围内确认Master的确进入了主观下线状态，则Master会被标记为客观下线。
+ 在一般情况下，每个Sentinel会以每10秒一次的频率向它所知的所有Master、Slave发送INFO命令。
+ 当Master被Sentinel标记为客观下线时，Sentinel向下线的Master的所有Slave发送INFO命令的频率会从10秒一次改为每秒一次。
+ 若没有足够数量的Sentinel同意Master已经下线，Master的客观下线状态就会被移除。若Master重新向Sentinel的PING命令返回有效值，Master的主观下线状态就会被移除。

# 五、codis
codis是一个分布式的Redis解决方案，由豌豆荚开源，对于上层的应用来说，连接codis proxy和连接原生的redis server没什么明显的区别，上层应用可以像使用单机的redis一样使用，codis底层会处理请求的转发，不停机的数据迁移等工作，所有后边的事情，对于前面的客户端来说是透明的，可以简单的认为后边连接的是一个内存无限大的redis服务。

![](assets/07-Database/230565ab88a475e53507.png)

 

# 六、客户端分片
1. 客户端就已经决定数据会被 存储 到哪个 redis 节点或者从哪个 redis 节点 读取数据。其主要思想是采用 哈希算法 将 Redis 数据的 key 进行散列，通过 hash 函数，特定的 key会 映射 到特定的 Redis 节点上。这种方案通常适用于用户对客户端的行为有完全控制能力的场景。
2. 架构图

![](assets/07-Database/dbba19df2bcf66cf172c.png)

1. 优点

不使用 第三方中间件，分区逻辑 可控，配置 简单，节点之间无关联，容易 线性扩展，灵活性强。

1. 缺点

客户端 无法 动态增删 服务节点，客户端需要自行维护 分发逻辑，客户端之间 无连接共享，会造成 连接浪费。

 


