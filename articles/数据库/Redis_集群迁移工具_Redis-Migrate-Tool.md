GitHub地址：[https://github.com/vipshop/redis-migrate-tool.git](https://github.com/vipshop/redis-migrate-tool.git)

  

Redis-Migrate-Tool是在redis集群之间迁移数据方便而有用的工具。

  

# 一、特点

-   快速
-   多线程
-   基于redis复制
-   实时迁移
-   迁移过程中，不影响源集群对外服务
-   异构迁移
-   支持Twemproxy集群和redis cluster集群
-   当目标是twemproxy集群，数据会跳过twemproxy直接导入到后端的redis
-   迁移状态显示
-   完善的数据校验

  

迁移工具的来源可以是：单独的redis实例，twemproxy集群，redis cluster，rdb文件，aof文件。

迁移工具的目标可以是：单独的redis实例，twemproxy集群，redis cluster，rdb文件。

  

# 二、依赖

在安装之前需要提前安装automake, libtool, autoconf和bzip2

```bash
yum -y install automake libtool autoconf bzip2
```

  

# 三、编译安装

```bash
git clone https://github.com/vipshop/redis-migrate-tool.git
cd redis-migrate-tool
autoreconf -fvi
./configure
make
```

  

# 四、运行命令

```bash
src/redis-migrate-tool -c rmt.conf -o log -d
```

  

# 五、注意事项

（1）、在运行此工具之前，请确保源redis主机具有足够的内存，允许至少一个redis生成rdb文件。如果源机器的内存足够大，允许所有redis同时生成rdb文件，那么可以在rm .conf中设置“source\_safe: false”。

（2）、不允许一下的的命令传输到目标redis组，因为这些命令可能跨越不同的redis节点，如下：

```bash
RENAME
RENAMENX
RPOPLPUSH
BRPOPLPUSH
FLUSHALL
FLUSHDB
BITOP
MOVE
GEORADIUS
GEORADIUSBYMEMBER
EVAL
EVALSHA
SCRIPT
PFMERGE
```

  

# 六、配置文件简介

配置文件名为rmt.conf，主要由三个部分组成： source, target and common，如下:

```bash
[source]
type: twemproxy
hash: fnv1a_64
hash_tag: "{}"
distribution: ketama
servers : 
-127.0.0.1:12345:1 server1
-127.0.1.1:12345:1 server2
-127.0.2.1:12345:1 server3
-127.0.3.1:12345:1 server4

[target]
type: redis cluster
servers:
-127.0.0.1:23456

[common]
listen: 0.0.0.0:8888
```

  

## 6.1 source和target

（1）、type：redis的组类型，有如下几种类型:

```bash
single                         # redis单节点
twemproxy                      # twemproxy集群
redis cluster                  # redis cluster集群
rdb file                       # RDB文件
aof file                       # AOF文件
```

  

（2）、hash：hash函数的名称，仅支持type类型是twemproxy，有如下几种：

```bash
one_at_a_time
md5
crc16
crc32 (crc32 implementation compatible with libmemcached)
crc32a (correct crc32 implementation as per the spec)
fnv1_64
fnv1a_64
fnv1_32
fnv1a_32
hsieh
murmur
jenkins
```

  

（3）、hash\_tag：一个两个字符的字符串，指定用于散列的键的一部分。例如“{}”或“$$”。散列标记允许将不同的键映射到同一服务器，只要标记中的键的部分相同。仅支持类型是twemproxy。

  

（4）、distribution：密文分发模式，仅支持类型是twemproxy。有如下几种模式：

```bash
ketama
modula
random
```

  

（5）、servers：组中的redis地址列表。如果类型是twemproxy，这与twemproxy配置文件相同。如果类型是rdb文件，这就是文件名。

  

（6）、redis\_auth：连接redis服务的身份验证。

  

（7）、timeout：读写的超时时间。

  

## 6.2 common

主要是redis-migrate-tool的配置信息

```bash
listen: 监听地址和端口，比如 127.0.0.1:8888.
max_clients: 客户端最大连接数， 比如 100.
threads: redis-migrate-tool的最大线程数. 默认是CPU核心数.
step: 解析请求的步骤，数字越大，迁移的速度越快，但是使用的内存越多，默认为1.
mbuf_size: 请求的Mbuf大小. 默认为512.
noreply: 是否检查目标组. 默认是 false.
source_safe: 内存安全保护，避免内存不足导致宕机. 默认是true.
dir: 工作路径，用于存储文件(比如RDB,AOF文件). 默认就是当前目录.
filter: 过滤.如果键和默认不匹配就过滤键，模式是全局模式.默认是NULL，它支持正则匹配。
```

  

  

# 七、配置文件示例

示例1：从redis cluster集群迁移数据到twemproxy集群

```bash
[source]
type: redis cluster
servers:
 - 127.0.0.1:6379
 - 127.0.0.1:6380
 - 127.0.0.1:6381
 - 127.0.0.1:6382
[target]
type: twemproxy
hash: fnv1a_64
hash_tag: "{}"
distribution: ketama
servers:
 - 127.0.0.1:6380:1 server1
 - 127.0.0.1:6381:1 server2
 - 127.0.0.1:6382:1 server3
 - 127.0.0.1:6383:1 server4
[common]
listen: 0.0.0.0:8888
threads: 2
step: 1
mbuf_size: 1024
source_safe: true
```

  

示例2：从twemproxy迁移到redis集群

```bash
[source]
type: twemproxy
hash: fnv1a_64
hash_tag: "{}"
distribution: ketama
servers:
 - 127.0.0.1:6379
 - 127.0.0.1:6380
 - 127.0.0.1:6381
 - 127.0.0.1:6382

[target]
type: redis cluster
servers:
 - 127.0.0.1:7379

[common]
listen: 0.0.0.0:8888
step: 1
mbuf_size: 512
```

  

示例3：从redis集群迁移到redis集群

```bash
[source]
type: redis cluster
servers:
 - 127.0.0.1:8379

[target]
type: redis cluster
servers:
 - 127.0.0.1:7379

[common]
listen: 0.0.0.0:8888
```

  

示例4：从RDB文件恢复到redis集群

```bash
[source]
type: rdb file
servers:
 - /data/redis/dump1.rdb
 - /data/redis/dump2.rdb

[target]
type: redis cluster
servers:
 - 127.0.0.1:7379

[common]
listen: 0.0.0.0:8888
step: 2
mbuf_size: 512
source_safe: false
```

  

示例5：从redis集群保存RDB文件

```bash
[source]
type: redis cluster
servers:
 - 127.0.0.1:7379

[target]
type: rdb file

[common]
listen: 0.0.0.0:8888
source_safe: true
```

  

示例6：从AOF文件恢复到redis集群

```bash
[source]
type: aof file
servers:
 - /data/redis/appendonly1.aof
 - /data/redis/appendonly2.aof

[target]
type: redis cluster
servers:
 - 127.0.0.1:7379

[common]
listen: 0.0.0.0:8888
step: 2
```

  

# 八、数据校验

迁移数据之后，可以使用redis\_check命令检查源组和目标组中的数据。如下：

```bash
$src/redis-migrate-tool -c rmt.conf -o log -C redis_check
Check job is running...

Checked keys: 1000
Inconsistent value keys: 0
Inconsistent expire keys : 0
Other check error keys: 0
Checked OK keys: 1000

All keys checked OK!
Check job finished, used 1.041s
```

  

如果要检查更多的keys，可以使用如下命令：

```bash
$src/redis-migrate-tool -c rmt.conf -o log -C "redis_check 200000"
Check job is running...

Checked keys: 200000
Inconsistent value keys: 0
Inconsistent expire keys : 0
Other check error keys: 0
Checked OK keys: 200000

All keys checked OK!
Check job finished, used 11.962s
```

  

# 九、状态检查

通过redis-cli连接redis-migrate-tool监控的端口，运行info命令。如下:

```bash
$redis-cli -h 127.0.0.1 -p 8888
127.0.0.1:8888> info
# Server
version:0.1.0
os:Linux 2.6.32-573.12.1.el6.x86_64 x86_64
multiplexing_api:epoll
gcc_version:4.4.7
process_id:9199
tcp_port:8888
uptime_in_seconds:1662
uptime_in_days:0
config_file:/ect/rmt.conf

# Clients
connected_clients:1
max_clients_limit:100
total_connections_received:3

# Memory
mem_allocator:jemalloc-4.0.4

# Group
source_nodes_count:32
target_nodes_count:48

# Stats
all_rdb_received:1
all_rdb_parsed:1
all_aof_loaded:0
rdb_received_count:32
rdb_parsed_count:32
aof_loaded_count:0
total_msgs_recv:7753587
total_msgs_sent:7753587
total_net_input_bytes:234636318
total_net_output_bytes:255384129
total_net_input_bytes_human:223.77M
total_net_output_bytes_human:243.55M
total_mbufs_inqueue:0
total_msgs_outqueue:0
127.0.0.1:8888>
```