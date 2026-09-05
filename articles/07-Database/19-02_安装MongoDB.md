# 安装MongoDB

> 分类：Database / 第19章：MongoDB
> 原文：https://www.cuiliangblog.cn/detail/section/31466593
> 来源：崔亮的博客

---

# 一、Linux系统安装
## 下载地址
[https://repo.mongodb.org/yum/redhat/](https://repo.mongodb.org/yum/redhat/)

以 RHEL8.X 系统安装 mongodb8.0 为例

参考文档：[https://mongodb.ac.cn/docs/manual/tutorial/install-mongodb-on-red-hat/](https://mongodb.ac.cn/docs/manual/tutorial/install-mongodb-on-red-hat/)

## 安装
添加 repo

```python
# vim /etc/yum.repos.d/mongodb-org-8.0.repo
[mongodb-org-8.0]
name=MongoDB Repository
baseurl=https://repo.mongodb.org/yum/redhat/8/mongodb-org/8.0/x86_64/
gpgcheck=0
enabled=1
```

安装软件包

```python
# dnf install -y mongodb-org
```

验证

```python
# mongod -version
db version v8.0.16
Build Info: {
    "version": "8.0.16",
    "gitVersion": "ba70b6a13fda907977110bf46e6c8137f5de48f6",
    "openSSLVersion": "OpenSSL 1.1.1k  FIPS 25 Mar 2021",
    "modules": [],
    "allocator": "tcmalloc-google",
    "environment": {
        "distmod": "rhel88",
        "distarch": "x86_64",
        "target_arch": "x86_64"
    }
}
```

## 修改配置文件
+ 参数文件位置：

/etc/mongod.conf

+ 数据文件位置：

/var/lib/mongo

+ 默认日志文件位置：

/var/log/mongodb/mongod.log

1. 允许远程连接

vim /etc/mongod.conf

![](assets/07-Database/cfa186fdd8b88a8264ce.png)

2. 重启服务

systemctl restart mongod

## 使用 mongodb
使用MongoShell连接MongoDB

本地连接：

mongo --host 127.0.0.1:27017

或

mongo

退出MongoDB客户端：

>quit()

或 

>exit;

# 二、docker安装MongoDB
1. 拉取镜像

[root@docker ~]# docker pull mongo

1. 运行容器

[root@docker ~]# docker run -p 27017:27017 -v $PWD/db:/data/db -d mongo

+ 命令说明：

-p 27017:27017 :将容器的27017 端口映射到主机的27017 端口

-v $PWD/db:/data/db :将主机中当前目录下的db挂载到容器的/data/db，作为mongo数据存储目录

1. 客户端连接mongo

[root@docker ~]# docker run -it mongo mongo --host 172.17.0.1

 


