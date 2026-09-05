# 统一启动文件。

须要修改地方： REDISPORT 端口，  eIx6TynJq 密码  , CONF 配置文件地方

```plain
[root@public-redis01 init.d]# pwd
/etc/init.d
[root@public-redis01 init.d]# cat redis-erp-test
#!/bin/sh
#
# Simple Redis init.d script conceived to work on Linux systems
# as it does use of the /proc filesystem.
### BEGIN INIT INFO
# Provides: redis_6379
# Default-Start: 2 3 4 5
# Default-Stop: 0 1 6
# Short-Description: Redis data structure server
# Description: Redis data structure server. See https://redis.io
### END INIT INFO
REDISPORT=26379
EXEC=/data/redis/bin/redis-server
CLIEXEC=/data/redis/bin/redis-cli
PIDFILE=/var/run/redis_${REDISPORT}.pid
CONF="/data/redis/erp-test/${REDISPORT}.conf"
case "$1" in
start)
if [ -f $PIDFILE ]
then
echo "$PIDFILE exists, process is already running or crashed"
else
echo "Starting Redis server..."
$EXEC $CONF
fi
;;
stop)
if [ ! -f $PIDFILE ]
then
echo "$PIDFILE does not exist, process is not running"
else
PID=$(cat $PIDFILE)
echo "Stopping ..."
$CLIEXEC -p $REDISPORT -a eIx6TynJq shutdown 2>/dev/null
while [ -x /proc/${PID} ]
do
echo "Waiting for Redis to shutdown ..."
sleep 1
done
echo "Redis stopped"
fi
;;
*)
echo "Please use start or stop as first argument"
;;
esac
```
```

# conf 文件配置 conf 文件地址和名字在启动文件里面定义好了

须要修改的地方：

port  暴露端口 ，  pidfile  进程,  logfile 日志 ,   dir  目录,  requirepass 密码,

  

\`\`\`

bind 0.0.0.0

protected-mode yes

port 26379

tcp-backlog 511

timeout 0

tcp-keepalive 300

daemonize yes

pidfile /var/run/redis\_26379.pid

supervised no

loglevel notice

logfile /data/redis/erp-test/26379.log

databases 200

always-show-logo yes

save 900 1

save 300 10

save 60 10000

stop-writes-on-bgsave-error yes

rdbcompression yes

rdbchecksum yes

dbfilename dump.rdb

dir /data/redis/erp-test/

slave-serve-stale-data yes

slave-read-only yes

repl-diskless-sync no

repl-diskless-sync-delay 5

repl-disable-tcp-nodelay no

slave-priority 100

requirepass eIx6TynJq

maxmemory 4GB

maxmemory-policy volatile-lru

lazyfree-lazy-eviction no

lazyfree-lazy-expire no

lazyfree-lazy-server-del no

slave-lazy-flush no

appendonly yes

appendfilename "appendonly.aof"

appendfsync everysec

no-appendfsync-on-rewrite no

auto-aof-rewrite-percentage 100

auto-aof-rewrite-min-size 64mb

aof-load-truncated yes

aof-use-rdb-preamble no

lua-time-limit 5000

slowlog-log-slower-than 10000

slowlog-max-len 1024

latency-monitor-threshold 0

notify-keyspace-events ""

hash-max-ziplist-entries 512

hash-max-ziplist-value 64

list-max-ziplist-size -2

list-compress-depth 0

set-max-intset-entries 512

zset-max-ziplist-entries 128

zset-max-ziplist-value 64

hll-sparse-max-bytes 3000

activerehashing yes

client-output-buffer-limit normal 0 0 0

client-output-buffer-limit slave 256mb 64mb 60

client-output-buffer-limit pubsub 32mb 8mb 60

hz 10

aof-rewrite-incremental-fsync yes

  

\`\`\`