# SonarQube部署(rpm)

> 分类：CI/CD / 第2章：SonarQube代码扫描
> 原文：https://www.cuiliangblog.cn/detail/section/131467837
> 来源：崔亮的博客

---

# 准备工作
## 下载软件包
下载地址：[https://www.sonarsource.com/products/sonarqube/downloads/](https://www.sonarsource.com/products/sonarqube/downloads/)

安装文档：[https://docs.sonarqube.org/9.9/requirements/prerequisites-and-overview/](https://docs.sonarqube.org/9.9/requirements/prerequisites-and-overview/)

![](assets/04-CI-CD/9354ad0d80c2df183daa.png)

## 软件版本
从官方文档可知，<font style="color:rgba(0, 0, 0, 0.8);">SonarQube9.9.1支持的java版本为Oracle JRE17或OpenJDK17，数据库版本为PostgreSQL11-15，Microsoft SQL Server的MSSQL Server 12.0-16.0或者Oracle19c和21C</font>

<font style="color:rgba(0, 0, 0, 0.8);">此处使用OpenJDK17+PostgreSQL15为例安装。</font>

# openjdk17安装
本次使用的系统为rockylinux8.8，yum仓库中有openjdk17包，直接安装即可。如果为其他版本操作系统，可以前往openjdk官网下载[https://developers.redhat.com/products/openjdk/download](https://developers.redhat.com/products/openjdk/download)

```bash
# 查看yum仓库openjdk信息
[root@sonarqube ~]# dnf list java-17-openjdk*
上次元数据过期检查：0:07:06 前，执行于 2023年06月27日 星期二 10时03分19秒。
可安装的软件包
java-17-openjdk.x86_64                                                               1:17.0.7.0.7-3.el8                                                   appstream
java-17-openjdk-demo.x86_64                                                          1:17.0.7.0.7-3.el8                                                   appstream
java-17-openjdk-devel.x86_64                                                         1:17.0.7.0.7-3.el8                                                   appstream
java-17-openjdk-headless.x86_64                                                      1:17.0.7.0.7-3.el8                                                   appstream
java-17-openjdk-javadoc.x86_64                                                       1:17.0.7.0.7-3.el8                                                   appstream
java-17-openjdk-javadoc-zip.x86_64                                                   1:17.0.7.0.7-3.el8                                                   appstream
java-17-openjdk-jmods.x86_64                                                         1:17.0.7.0.7-3.el8                                                   appstream
java-17-openjdk-src.x86_64                                                           1:17.0.7.0.7-3.el8                                                   appstream
java-17-openjdk-static-libs.x86_64                                                   1:17.0.7.0.7-3.el8                                                   appstream
[root@sonarqube ~]# dnf -y install java-17-openjdk*
[root@sonarqube ~]# java -version
openjdk version "17.0.10" 2024-01-16 LTS
OpenJDK Runtime Environment (Red_Hat-17.0.10.0.7-1) (build 17.0.10+7-LTS)
OpenJDK 64-Bit Server VM (Red_Hat-17.0.10.0.7-1) (build 17.0.10+7-LTS, mixed mode, sharing)
```

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

## 开启远程访问
```bash
[root@sonarqube ~]# vim /var/lib/pgsql/15/data/postgresql.conf
listen_addresses = '*'
[root@sonarqube ~]# vim /var/lib/pgsql/15/data/pg_hba.conf
host    all             all             0.0.0.0/0            scram-sha-256
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

## 远程连接测试
```bash
[root@tiaoban ~]# dnf install postgresql -y
[root@tiaoban ~]# psql -U postgres -h 192.168.10.71
用户 postgres 的口令：postgres
psql (10.23, 服务器 15.6)
WARNING: psql major version 10, server major version 15.
         Some psql features might not work.
输入 "help" 来获取帮助信息.

postgres=# \l
                                     数据库列表
   名称    |  拥有者  | 字元编码 |  校对规则   |    Ctype    |       存取权限        
-----------+----------+----------+-------------+-------------+-----------------------
 postgres  | postgres | UTF8     | zh_CN.UTF-8 | zh_CN.UTF-8 | 
 template0 | postgres | UTF8     | zh_CN.UTF-8 | zh_CN.UTF-8 | =c/postgres          +
           |          |          |             |             | postgres=CTc/postgres
 template1 | postgres | UTF8     | zh_CN.UTF-8 | zh_CN.UTF-8 | =c/postgres          +
           |          |          |             |             | postgres=CTc/postgres
(3 行记录)
```

## 创建用户与库并授权
```bash
postgres=# CREATE ROLE sonarqube WITH LOGIN PASSWORD 'sonarqube';
CREATE ROLE
postgres=# CREATE DATABASE sonarqube;
CREATE DATABASE
postgres=# GRANT ALL PRIVILEGES ON DATABASE sonarqube TO sonarqube;
GRANT
postgres=# GRANT ALL ON SCHEMA public TO sonarqube;
GRANT
postgres=# \l
                                      数据库列表
   名称    |  拥有者  | 字元编码 |  校对规则   |    Ctype    |        存取权限        
-----------+----------+----------+-------------+-------------+------------------------
 postgres  | postgres | UTF8     | zh_CN.UTF-8 | zh_CN.UTF-8 | 
 sonarqube | postgres | UTF8     | zh_CN.UTF-8 | zh_CN.UTF-8 | =Tc/postgres          +
           |          |          |             |             | postgres=CTc/postgres +
           |          |          |             |             | sonarqube=CTc/postgres
 template0 | postgres | UTF8     | zh_CN.UTF-8 | zh_CN.UTF-8 | =c/postgres           +
           |          |          |             |             | postgres=CTc/postgres
 template1 | postgres | UTF8     | zh_CN.UTF-8 | zh_CN.UTF-8 | =c/postgres           +
           |          |          |             |             | postgres=CTc/postgres
(4 行记录)
```

# SonarQube安装
## 解压
```bash
[root@sonarqube ~]# wget https://binaries.sonarsource.com/Distribution/sonarqube/sonarqube-9.9.4.87374.zip
[root@sonarqube ~]# unzip -d /opt sonarqube-9.9.4.87374.zip
[root@sonarqube ~]# cd /opt
[root@sonarqube opt]# ls
sonarqube-9.9.4.87374
```

## 更改配置文件
```bash
[root@sonarqube opt]# vim /opt/sonarqube-9.9.4.87374/conf/sonar.properties
sonar.jdbc.username=sonarqube
sonar.jdbc.password= CHANGE_ME
sonar.jdbc.url=jdbc:postgresql://localhost:5432/sonarqube
sonar.path.data=/data/sonarqube/data
sonar.path.temp=/data/sonarqube/temp
sonar.web.host=192.168.10.71
sonar.web.port=9000
```

## 配置用户与权限
```bash
[root@sonarqube opt]# useradd sonarqube
[root@sonarqube opt]# chown sonarqube:sonarqube -R /opt/sonarqube-9.9.4.87374
[root@sonarqube opt]# mkdir -p /data/sonarqube/data
[root@sonarqube opt]# mkdir -p /data/sonarqube/temp
[root@sonarqube opt]# chown sonarqube:sonarqube -R /data/sonarqube
```

## 配置系统参数（启动es需要）
修改文件描述符数目

```bash
[root@sonarqube opt]# vim /etc/profile
ulimit -n 65535
[root@sonarqube opt]# source /etc/profile
[root@sonarqube opt]# vim /etc/security/limits.conf
* soft nofile 65535
* hard nofile 65535
[root@sonarqube opt]# ulimit -n
65535
```

修改虚拟内存数大小

```bash
[root@sonarqube opt]# sysctl -w vm.max_map_count=262144
vm.max_map_count = 262144
[root@sonarqube opt]# cat >> /etc/sysctl.conf << EOF
vm.max_map_count=262144
EOF
[root@sonarqube opt]# sysctl -p 
vm.max_map_count = 262144
```

关闭swap分区

```bash
[root@sonarqube opt]# swapoff -a
[root@sonarqube opt]# sed -i '/ swap / s/^(.*)$/#\1/g' /etc/fstab
```

## 启动SonarQube
```bash
[root@sonarqube opt]# su - sonarqube 
[sonarqube@sonarqube ~]$ cd /opt/sonarqube-9.9.4.87374/bin/linux-x86-64/
[sonarqube@sonarqube linux-x86-64]$ ls
sonar.sh
[sonarqube@sonarqube linux-x86-64]$ ./sonar.sh start
```

然后访问192.168.10.71:9000端口即可。默认用户名密码为admin

## 添加服务启动脚本
```bash
[root@sonarqube opt]# vim /usr/lib/systemd/system/sonarqube.service
[Unit]
#描述
Description=Sonarube Service
#代表要在其他的某些程序完成之后再执行.这些服务启动后，才允许启动Sonarube服务
After=syslog.target network.target

[Service]
Type=forking
# 绝对地址
ExecStart=/opt/sonarqube-9.9.4.87374/bin/linux-x86-64/sonar.sh start
# 绝对地址
ExecStop=/opt/sonarqube-9.9.4.87374/bin/linux-x86-64/sonar.sh stop
#启动的用户名
User=sonarqube
#启动的用户所在组
Group=sonarqube
Restart=always
#重启时间
RestartSec=120
LimitNOFILE=131072
LimitNPROC=8192

[Install]
WantedBy=multi-user.target

[root@sonarqube ~]# systemctl daemon-reload 
[root@sonarqube ~]# systemctl start sonarqube.service 
[root@sonarqube ~]# systemctl enable sonarqube.service 
```


