# LNMP服务部署(compose)

> 分类：Docker / 第17章：常见服务部署
> 原文：https://www.cuiliangblog.cn/detail/section/107105297
> 来源：崔亮的博客

---

> 以wordpress为例。官网：[https://cn.wordpress.org/download/](https://cn.wordpress.org/download/)
>

# 准备工作
## 下载项目源码包
```bash
[root@test ~]# wget https://cn.wordpress.org/latest-zh_CN.zip
[root@test ~]# ls
wordpress-6.5.5-zh_CN.zip
[root@test ~]# unzip wordpress-6.5.5-zh_CN.zip
[root@test ~]# ls
wordpress  wordpress-6.5.5-zh_CN.zip
[root@test ~]# mv wordpress/* /opt/docker/wordpress/
```

## 构建php镜像
<font style="color:rgb(33, 37, 41);">官方 php 镜像并未提供 mysql 扩展，所以我们必须要自己手动写 Dockerfile 安装扩展。</font>

```bash
[root@test ~]# mkdir -p /opt/docker/php
[root@test php]# cat Dockerfile 
FROM php:fpm
RUN docker-php-ext-install mysqli
[root@test php]# docker build -t my-php:v1 .
```

## 构建nginx镜像
自定义nginx配置文件，并封装至镜像中。

```bash
[root@test php]# mkdir -p /opt/docker/nginx
[root@test php]# cd /opt/docker/nginx/
[root@test nginx]# cat nginx.conf 
server {
    listen       80;
    server_name  ~^.*$;

    location / {
        root   /usr/share/nginx/html; # nginx静态资源路径
        index  index.php index.html index.htm;
    }

    location ~ \.php$ {
        fastcgi_pass   php:9000;
        fastcgi_index  index.php;
        fastcgi_param  SCRIPT_FILENAME  /var/www/html/$fastcgi_script_name; # php资源路径
        include        fastcgi_params; 
    }
}
[root@test nginx]# cat Dockerfile 
FROM nginx:latest
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
[root@test nginx]# docker build -t my-nginx:v1 .
```

## 准备目录
```bash
[root@test ~]# mkdir -p /opt/docker/mysql/
```

# 服务部署
## 全局变量创建
```bash
[root@test docker]# cat .env 
MYSQL_ROOT_PASSWORD=CHANGE_ME
WORDPRESS_PATH=/opt/docker/wordpress
MYSQL_PATH=/opt/docker/mysql
```

## docker-compose创建
```yaml
[root@test docker]# cat docker-compose.yaml 
services:
  mysql:
    image: mysql
    container_name: mysql
    ports:
      - "3306:3306"
    volumes:
      - $MYSQL_PATH/conf:/etc/mysql/conf.d
      - $MYSQL_PATH/logs:/logs
      - $MYSQL_PATH/data:/var/lib/mysql
    environment:
      MYSQL_ROOT_PASSWORD: $MYSQL_ROOT_PASSWORD
    restart: always

  php:
    image: my-php:v1
    container_name: php
    ports:
      - "9000:9000"
    volumes:
      - $WORDPRESS_PATH:/var/www/html
    depends_on:
      - mysql
    restart: always

  nginx:
    image: my-nginx:v1
    container_name: nginx
    ports:
      - "80:80"
    volumes:
      - $WORDPRESS_PATH:/usr/share/nginx/html
    depends_on:
      - php
    restart: always

  phpmyadmin:
    image: phpmyadmin/phpmyadmin
    container_name: phpmyadmin
    ports:
      - "8080:80"
    depends_on:
      - mysql 
    restart: always
    environment:
      PMA_HOST: mysql
      MYSQL_ROOT_PASSWORD: $MYSQL_ROOT_PASSWORD
```

## docker-compose启动
```bash
[root@test docker]# docker-compose up -d
[+] Running 4/4
 ✔ Container mysql       Started                                                                                                                              0.3s 
 ✔ Container php         Started                                                                                                                              0.9s 
 ✔ Container nginx       Started                                                                                                                              1.3s 
 ✔ Container phpmyadmin  Started                                                                                                                              1.0s
[root@test docker]# docker ps
CONTAINER ID   IMAGE                   COMMAND                   CREATED         STATUS          PORTS                                                  NAMES
f3485455dcca   my-nginx:v1             "/docker-entrypoint.…"   7 minutes ago   Up 10 seconds   0.0.0.0:80->80/tcp, :::80->80/tcp                      nginx
d113be5b2d05   phpmyadmin/phpmyadmin   "/docker-entrypoint.…"   7 minutes ago   Up 10 seconds   0.0.0.0:8080->80/tcp, :::8080->80/tcp                  phpmyadmin
9a945ca38cbd   my-php:v1               "docker-php-entrypoi…"   7 minutes ago   Up 10 seconds   0.0.0.0:9000->9000/tcp, :::9000->9000/tcp              php
c383165c6963   mysql                   "docker-entrypoint.s…"   7 minutes ago   Up 11 seconds   0.0.0.0:3306->3306/tcp, :::3306->3306/tcp, 33060/tcp   mysql
```

# 验证
## 访问phpmyadmin
![](assets/11-Docker/2b08bbab0ffd00238987.png)

用户名为root，密码为CHANGE_ME

![](assets/11-Docker/d4f1cda5d7f31bf888cb.png)

## 访问WordPress
![](assets/11-Docker/90d8e8a09f4702722ed0.png)


