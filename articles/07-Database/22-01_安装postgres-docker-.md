# 安装postgres(docker)

> 分类：Database / 第22章：PostgreSQL
> 原文：https://www.cuiliangblog.cn/detail/section/245033126
> 来源：崔亮的博客

---

# 安装
镜像仓库地址：[https://hub.docker.com/_/postgres](https://hub.docker.com/_/postgres)

```bash
[root@aliyun opt]# mkdir -p /opt/docker/postgres
[root@aliyun opt]# cd /opt/docker/postgres/
[root@aliyun postgres]# docker run --name postgres -p 5432:5432 -e POSTGRES_PASSWORD=CHANGE_ME \
-v $PWD/data:/var/lib/postgresql \
-d postgres:18
```

# 配置
```bash
# 允许远程登录
[root@aliyun postgres]# docker cp postgres:/usr/share/postgresql/18/pg_hba.conf.sample .
[root@aliyun postgres]# vim pg_hba.conf.sample
# 允许所有 IP 访问（生产请限制范围）
# IPv4 - allow all
host    all    all    0.0.0.0/0     md5
# IPv6 - allow all
host    all    all    ::/0          md5
[root@aliyun postgres]# docker cp pg_hba.conf.sample postgres:/usr/share/postgresql/18/pg_hba.conf.sample
[root@aliyun postgres]# docker restart postgres
```

# 使用
```bash
# 进入容器
# docker exec -it -u postgres postgres bash                                                                                                                         
postgres@e7e760e7e708:/$ psql
psql (18.1 (Debian 18.1-1.pgdg13+2))
Type "help" for help.

postgres=# CREATE ROLE artifactory WITH LOGIN PASSWORD 'artifactory';
CREATE ROLE
postgres=# CREATE DATABASE artifactory;
CREATE DATABASE
postgres=# GRANT ALL PRIVILEGES ON DATABASE artifactory TO artifactory;
GRANT
postgres=# \c artifactory
您现在已经连接到数据库 "artifactory",用户 "postgres".
artifactory=# GRANT ALL PRIVILEGES ON SCHEMA public TO artifactory;
GRANT
postgres=# \l
                                                       数据库列表
    名称     |  拥有者  | 字元编码 |  校对规则   |    Ctype    | ICU Locale | Locale Provider |         存取权限         
-------------+----------+----------+-------------+-------------+------------+-----------------+--------------------------
 artifactory | postgres | UTF8     | zh_CN.UTF-8 | zh_CN.UTF-8 |            | libc            | =Tc/postgres            +
             |          |          |             |             |            |                 | postgres=CTc/postgres   +
             |          |          |             |             |            |                 | artifactory=CTc/postgres
 postgres    | postgres | UTF8     | zh_CN.UTF-8 | zh_CN.UTF-8 |            | libc            | 
 template0   | postgres | UTF8     | zh_CN.UTF-8 | zh_CN.UTF-8 |            | libc            | =c/postgres             +
             |          |          |             |             |            |                 | postgres=CTc/postgres
 template1   | postgres | UTF8     | zh_CN.UTF-8 | zh_CN.UTF-8 |            | libc            | =c/postgres             +
             |          |          |             |             |            |                 | postgres=CTc/postgres
(4 行记录)
```


