# docker部署Django项目

> 分类：Python / 第5章：Django
> 原文：https://www.cuiliangblog.cn/detail/section/31629426
> 来源：崔亮的博客

---

部署流程以及运维



# 部署流程


## 代码目录准备


```bash
[root@aliyun root]# cd /opt
# git记住密码
[root@aliyun opt]# vim ~/.git-credentials
https://cuiliang0302:CHANGE_ME@gitee.com
[root@aliyun opt]# git config --global credential.helper store
# 拉取项目代码
[root@aliyun opt]# git clone https://gitee.com/cuiliang0302/myblog.git
# 初始化项目
[root@aliyun opt]# pip3 install click tinify
[root@aliyun opt]# chmod u+x /opt/myblog/other/update.sh 
[root@aliyun opt]# sh /opt/myblog/other/update.sh
```



## MySQL部署


```bash
[root@aliyun opt]# mkdir -p /opt/docker/mysql
[root@aliyun opt]# cd /opt/docker/mysql/
[root@aliyun mysql]# docker run -p 3306:3306 --name mysql -v $PWD/conf:/etc/mysql/conf.d -v $PWD/logs:/logs -v $PWD/data:/var/lib/mysql -e MYSQL_ROOT_PASSWORD=CHANGE_ME -d --restart=always mysql
```



## MySQL导入数据


```bash
# 拷贝数据库文件
[root@aliyun mysql]# docker cp myblog/other/myblog.sql mysql:/root
[root@aliyun mysql]# docker exec -it mysql bash
root@3bd762759930:/# mysql -u root -p

# 设置远程连接数据库权限(按需)
mysql> use mysql;
Reading table information for completion of table and column names
You can turn off this feature to get a quicker startup with -A

Database changed
mysql> grant all privileges on *.* to 'root'@'%';
Query OK, 0 rows affected (0.00 sec)

mysql> flush privileges;
Query OK, 0 rows affected (0.01 sec)

# 创建数据库
mysql> CREATE DATABASE myblog DEFAULT CHARACTER SET utf8 COLLATE utf8_general_ci;
Query OK, 1 row affected, 2 warnings (0.01 sec)

mysql> show databases;
+--------------------+
| Database           |
+--------------------+
| information_schema |
| myblog             |
| mysql              |
| performance_schema |
| sys                |
+--------------------+
5 rows in set (0.00 sec)

# 导入数据
mysql> use myblog;
Database changed
mysql> source /root/myblog.sql;
mysql> show tables;
```



## redis部署


```bash
[root@aliyun docker]# docker run --name redis -p 6379:6379 -d --restart=always redis --requirepass CHANGE_ME
fe24cb38242ed2f1c8c7340fa1ce05f39c8fc351a7a96506c43dff41ca0774bb
[root@aliyun docker]# docker exec -it redis redis-cli
127.0.0.1:6379> auth CHANGE_ME
OK
```



## django部署


```bash
[root@aliyun docker]# cd /opt/myblog/
# 构建镜像并运行
[root@aliyun myblog]# docker build -t myblog:v1 .
# 测试开发环境
[root@aliyun myblog]# docker run --name myblog -p 8000:8000 -v /opt/myblog:/opt/myblog -d --restart=always --link mysql --link redis myblog:v1
[root@aliyun myblog]# curl 127.0.0.1:8000
# 线上环境
[root@aliyun myblog]# docker run -d --name myblog -p 8997:8997 -v /opt/myblog:/opt/myblog -d --restart=always --link mysql --link redis myblog:v1
```



## nginx部署


```bash
# 将项目下的other/nginx移动至/opt/docker下
[root@aliyun myblog]# cp -R other/nginx/ /opt/docker/
[root@aliyun myblog]# cd /opt/docker/
[root@aliyun docker]# tree nginx/
nginx/
├── conf
│   └── nginx.conf
└── ssl
    ├── cdn.cuiliangblog.cn_chain.crt
    ├── cdn.cuiliangblog.cn_key.key
    ├── www.cuiliangblog.cn_chain.crt
    └── www.cuiliangblog.cn_key.key
[root@aliyun docker]# docker run --name nginx -p 80:80 -p 443:443 -v /opt/docker/nginx/conf/nginx.conf:/etc/nginx/nginx.conf -v /opt/docker/nginx/ssl:/etc/ssl -v /opt/myblog:/opt/myblog -v /opt/docker/nginx/log:/var/log/nginx -d --link myblog --restart=always nginx
```



+ 修改hosts文件，分别访问测试  
[https://www.cuiliangblog.cn/](https://www.cuiliangblog.cn/)  
[https://cdn.cuiliangblog.cn/media/](https://cdn.cuiliangblog.cn/media/)  
[https://cdn.cuiliangblog.cn/static/](https://cdn.cuiliangblog.cn/static/)



# 运维


## 壁纸定时更换


```bash
[root@aliyun ~]# chmod u+x /opt/myblog/other/make_bgc.py 
[root@aliyun ~]# crontab -e
* 3 * * * /usr/bin/python3 /opt/myblog/other/make_bgc.py >/dev/null
```



## 数据库定时备份


```bash
[root@aliyun ~]# chmod u+x /opt/myblog/other/db_backup.sh
[root@aliyun ~]# crontab -e
* 4 * * * /usr/bash /opt/myblog/other/db_backup.sh >/dev/null
```


