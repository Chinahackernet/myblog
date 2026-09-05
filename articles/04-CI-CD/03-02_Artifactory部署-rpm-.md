# Artifactory部署(rpm)

> 分类：CI/CD / 第3章：Artifactory制品库
> 原文：https://www.cuiliangblog.cn/detail/section/172000978
> 来源：崔亮的博客

---

# <font style="color:rgba(0, 0, 0, 0.8);">PostgreSQL15安装部署</font>
## 下载软件包
软件包下载地址：[https://www.postgresql.org/download/](https://www.postgresql.org/download/)，根据系统环境选择合适的版本生成安装命令。

```bash
[root@sonarqube ~]# dnf install -y https://download.postgresql.org/pub/repos/yum/reporpms/EL-8-x86_64/pgdg-redhat-repo-latest.noarch.rpm
[root@sonarqube ~]# dnf -qy module disable postgresql
[root@sonarqube ~]# dnf install -y postgresql15-server
[root@sonarqube ~]# /usr/pgsql-15/bin/postgresql-15-setup initdb
[root@sonarqube ~]# systemctl enable postgresql-15
[root@sonarqube ~]# systemctl start postgresql-15
```

## 设置密码postgres用户密码
```bash
[root@sonarqube ~]# su - postgres
[postgres@sonarqube ~]$ psql
psql (15.6)
输入 "help" 来获取帮助信息.

postgres=# ALTER USER postgres WITH PASSWORD 'CHANGE_ME';
ALTER ROLE
```

## 重启服务
```bash
[root@sonarqube ~]# systemctl restart postgresql-15
```

## 本地连接测试
```bash
[root@sonarqube ~]# psql -U postgres -h 127.0.0.1
用户 postgres 的口令：postgres
psql (15.6)
输入 "help" 来获取帮助信息.

postgres=# \l
                                                     数据库列表
   名称    |  拥有者  | 字元编码 |  校对规则   |    Ctype    | ICU Locale | Locale Provider |       存取权限        
-----------+----------+----------+-------------+-------------+------------+-----------------+-----------------------
 postgres  | postgres | UTF8     | zh_CN.UTF-8 | zh_CN.UTF-8 |            | libc            | 
 template0 | postgres | UTF8     | zh_CN.UTF-8 | zh_CN.UTF-8 |            | libc            | =c/postgres          +
           |          |          |             |             |            |                 | postgres=CTc/postgres
 template1 | postgres | UTF8     | zh_CN.UTF-8 | zh_CN.UTF-8 |            | libc            | =c/postgres          +
           |          |          |             |             |            |                 | postgres=CTc/postgres
(3 行记录)

postgres=#
```

## 创建用户与库并授权
```bash
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

## 验证
```bash
[root@artifactory ~]# psql -U artifactory -h 127.0.0.1
用户 artifactory 的口令：artifactory
psql (15.7)
输入 "help" 来获取帮助信息.

artifactory=> \c artifactory
您现在已经连接到数据库 "artifactory",用户 "artifactory".
artifactory=> CREATE TABLE test_table (id SERIAL PRIMARY KEY, name VARCHAR(50));
CREATE TABLE
artifactory-> \dt
                   关联列表
 架构模式 |    名称    |  类型  |   拥有者    
----------+------------+--------+-------------
 public   | test_table | 数据表 | artifactory
(1 行记录)
```

# 安装Artifactory
## 下载并安装Artifactory
下载地址：[https://jfrog.com/community/download-artifactory-oss/](https://jfrog.com/community/download-artifactory-oss/)

yum安装

```bash
[root@artifactory ~]# wget https://releases.jfrog.io/artifactory/artifactory-rpms/artifactory-rpms.repo -O jfrog-artifactory-rpms.repo;
[root@artifactory ~]# mv jfrog-artifactory-rpms.repo /etc/yum.repos.d/
[root@artifactory ~]# yum install jfrog-artifactory-oss
```

rpm安装

```bash
[root@artifactory ~]# wget https://releases.jfrog.io/artifactory/artifactory-rpms/jfrog-artifactory-oss/jfrog-artifactory-oss-[RELEASE].rpm?_gl=1*1tj9am9*_ga*NjQ2OTM1MjY0LjE3MTcyNTI1NDE.*_ga_SQ1NR9VTFJ*MTcxNzI1MjU0MC4xLjEuMTcxNzI1MjcxNy4wLjAuNTI5NjE3MDM3*_fplc*THI3bGR2a3FVeG1nR3AwQ2glMkJMTlhXTnd4bUVVMTdZTWlpRmJIJTJGSlpLcWlGVEdITXNjVFBvSHUwZ3U4bnZSTVhqbHU2TE9adEVGWCUyRnNpZnRFTnZBNW1xdWZBMGU2WiUyRjZzMjJYRnBmUzZaYyUyRmFkeFhiY0ZrUTJFb1FDZ0pSZyUzRCUzRA..
[root@artifactory ~]# rpm -ivh jfrog-artifactory-oss-7.84.12.rpm
```

## 配置数据库连接地址
```bash
[root@artifactory ~]# vim /var/opt/jfrog/artifactory/etc/system.yaml
  database:
    type: postgresql
    driver: org.postgresql.Driver
    url: "jdbc:postgresql://localhost:5432/artifactory"
    username: artifactory
    password: CHANGE_ME
```

# 启动服务
```bash
[root@artifactory ~]# systemctl start artifactory
[root@artifactory ~]# systemctl enable artifactory
```

# 访问验证
浏览器访问8020端口，默认用户名admin，默认密码password

![](assets/04-CI-CD/3ccb2ba341c2040fb032.png)




