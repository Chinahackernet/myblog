---
title: 生产环境Nginx-配置内网域名转发
---

**前言：Nginx（发音为“engine-x”）是一个开源的高性能HTTP和反向代理服务器，也是一个通用的TCP/UDP代理服务器，邮件代理服务器和通用的HTTP缓存服务器。它由俄罗斯的伊戈尔·赛索耶夫（Igor Sysoev）创建，并首次公开发布于2004年。Nginx以其高稳定性、丰富的功能集、简单的配置和低资源消耗而闻名。**

以下是Nginx的一些主要特点：

1. **高性能和高并发**：Nginx能够处理大量的并发连接，而内存消耗相对较低，这使得它非常适合作为高流量网站的服务器。
2. **模块化设计**：Nginx拥有一个模块化的设计，允许开发者根据需要添加或删除功能。
3. **反向代理**：Nginx可以作为反向代理服务器，将客户端请求转发到后端服务器，这有助于负载均衡和提高网站性能。
4. **负载均衡**：Nginx支持多种负载均衡算法，如轮询、最少连接、IP哈希等，可以有效地分配请求到多个服务器。
5. **静态文件服务**：Nginx非常适合作为静态文件服务器，它可以快速地提供图片、CSS和JavaScript文件等。
6. **SSL/TLS支持**：Nginx支持SSL/TLS协议，可以用于HTTPS连接，提供加密的数据传输。
7. **缓存机制**：Nginx提供了缓存机制，可以缓存静态资源以减少后端服务器的负载。
8. **配置简单**：Nginx的配置文件相对简单，易于理解和管理。
9. **跨平台**：Nginx可以在多种操作系统上运行，包括Linux、FreeBSD、Solaris、Mac OS X和Windows。
10. **社区和商业支持**：Nginx有一个活跃的社区，提供大量的文档和支持。同时，也有商业支持服务可供选择。

Nginx因其出色的性能和灵活性，被广泛应用于互联网上的网站和应用，从小型个人博客到大型企业级应用，都能看到Nginx的身影。

10.0.0.8和10.0.0.9部署nginx：

### 第一步：上传安装包

### 第二步：安装编译依赖（使用普通用户需要家sudo）

```
yum install gcc gcc-c++
yum install zlib zlib-devel
yum install pcre pcre-devel
yum install openssl libssl-dev
```

### 第三步：解压，编译安装：

解压命令： `sudo tar -zxvf nginx-1.24.0.tar.gz`   
进入nginx路径：`cd nginx-1.24.0`  
编译安装：  
命令：  
`sudo ./configure --prefix=/etc/nginx --sbin-path=/usr/bin/nginx --conf-path=/etc/nginx/nginx.conf --error-log-path=/var/log/nginx/error.log --http-log-path=/var/log/nginx/access.log --pid-path=/var/run/nginx.pid --lock-path=/var/run/nginx.lock`  
命令：`sudo make install`

### 第四步：启动nginx

命令：`sudo nginx`  

### 第五步：停止nginx

命令：`sudo nginx -s stop`

### 第六步：配置nginx开机启动

`sudo vim /etc/rc.d/rc.local`  
添加执行语句`/usr/bin/nginx`  
退出保存  
开机启动文件授权  
`sudo chmod +x /etc/rc.d/rc.local`

### 第七步：重载nginx

命令：`sudo nginx -s reload`  
注：nginx配置文件目录/etc/nginx/nginx.conf

### 第八步：配置内网域名转发

公司网络架构逻辑：公司的网络架构通过云服务SLB、前端集群负载、互备网关和路由器以及双节点nginx服务器等多个组件的协同工作。其中，SLB作为核心组件，负责流量的分发和负载均衡；前端集群负载提供处理请求的能力；互备网关和路由器确保网络连接的稳定性和可靠性；而双节点nginx服务器则负责内网域名的管理和转发。  
命令：`cat /etc/resolv.conf` 查看dns ip  
将以上ip配置于http块，如下图：  

配置域名转发，如下图：  

最后重启nginx生效
