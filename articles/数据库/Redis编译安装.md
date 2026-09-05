```plain
[root@public-redis01 ~]# wget http://download.redis.io/releases/redis-4.0.14.tar.gz
[root@public-redis01 ~]# tar xf redis-4.0.14.tar.gz
[root@public-redis01 ~]# cd redis-4.0.14
[root@public-redis01 ~]# make MALLOC=jemalloc
[root@public-redis01 ~]# make PREFIX=/data/redis install
[root@public-redis01 ~]# mkdir /data/redis/conf/
[root@public-redis01 ~]# cp redis-4.0.14/redis.conf /data/redis/conf/
[root@public-redis01 ~]# vim /data/redis/conf/redis.conf
....
bind 0.0.0.0
port 6379
pidfile /var/run/redis_6379.pid
logfile /data/redis/erp-dev/6379.log
dir /data/redis/erp-dev/
maxmemory 4GB
requirepass eIx6TynJq
......
[root@public-redis01 ~]# cp redis-4.0.14/utils/redis_init_script /etc/init.d/redis              #需调整对应命令的目录以及端口密码等
```