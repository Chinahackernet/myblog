# MySQL

> 分类：Docker / 第17章：常见服务部署
> 原文：https://www.cuiliangblog.cn/detail/section/33834509
> 来源：崔亮的博客

---

# 直接运行MySQL
## 拉取镜像
```dockerfile
docker pull mysql
```

## 运行MySQL
```dockerfile
# 或者直接运行
docker run -p 3306:3306 --name mysql -v $PWD/conf:/etc/mysql/conf.d -v $PWD/logs:/logs -v $PWD/data:/var/lib/mysql -e MYSQL_ROOT_PASSWORD=CHANGE_ME -d mysql
```

# Dockerfile打包
## 创建dockerfile
```dockerfile
FROM mysql:latest

# 添加文件夹下的 MYSQL 配置文件
ADD my.cnf /etc/mysql/conf.d/my.cnf

# 设置密码
ENV MYSQL_ROOT_PASSWORD 3zxnkt5zxpq
# MySQL数据目录设置挂载点
VOLUME  ["/var/lib/mysql"]
```

## 编辑my.cnf配置
```dockerfile
[mysqld]
pid-file        = /var/run/mysqld/mysqld.pid
socket          = /var/run/mysqld/mysqld.sock
datadir         = /var/lib/mysql
secure-file-priv= NULL

# Custom config should go here
!includedir /etc/mysql/conf.d/
```

## 构建与运行
```dockerfile
docker build -t mysql:v1 .
docker run -d -p 3306:3306 -v $PWD/mysql:/var/lib/mysql --name=mysql --restart=always mysql:v1

```




