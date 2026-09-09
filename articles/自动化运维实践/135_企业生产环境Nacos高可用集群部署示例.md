---
title: 企业生产环境Nacos高可用集群部署示例
---

**前言：Nacos（Naming and Configuration Service）是一个易于使用的平台，用于服务发现（Service Discovery）和配置管理（Configuration Management）。它支持Spring Cloud和Dubbo等微服务框架，帮助用户更简便地构建、交付和管理微服务平台。以下是Nacos的一些关键特性：**

1. **服务发现**：

   - Nacos提供了服务注册与发现的功能，允许服务提供者在启动时注册服务，服务消费者可以查询服务列表并发现可用的服务实例。
2. **配置管理**：

   - Nacos支持集中化的配置管理，允许用户在不同环境中管理应用的配置，并能够动态地更新配置，而无需重新部署应用。
3. **动态服务配置**：

   - 支持服务的动态配置、服务的元数据以及权重信息的管理。
4. **服务健康检查**：

   - 提供服务健康检查机制，以确保服务实例的可用性。
5. **命名服务**：

   - 提供基于DNS或REST API的服务命名和解析能力。
6. **集群管理**：

   - 支持集群模式部署，提供高可用性和扩展性。
7. **数据一致性**：

   - 支持AP（最终一致性）和CP（强一致性）两种一致性模型。
8. **多租户支持**：

   - 支持多租户的配置管理，允许不同团队或项目在同一个Nacos实例中管理各自的配置。
9. **审计日志**：

   - 提供操作审计日志，帮助用户追踪配置的变更历史。
10. **插件化设计**：

    - 支持插件化扩展，方便集成第三方系统或服务。
11. **支持多种语言和框架**：

    - 提供Java、Go、Node.js等多种语言的客户端支持，并且兼容Spring Cloud、Dubbo等微服务框架。
12. **易用性**：

    - 提供了一个友好的用户界面，使得配置管理和服务发现的操作更加直观和简单。

**Nacos由阿里巴巴集团开发，并在2018年捐赠给Apache软件基金会，成为Apache的一个孵化项目。它被设计为一个更易于扩展和维护的解决方案，以满足现代微服务架构的需求。**

**Nacos运行环境需要jdk环境，集群各节点服务器需安装jdk1.8：**  
`jdk-8u341-linux-x64.tar`

### 第一步：上次安装包到/usr/java/路径

### 第二步：解压

命令：`sudo tar -zxvf jdk-8u341-linux-x64.tar.gz`

### 第三步：配置环境变量

配置环境变量`sudo vim /etc/profile`

### 第四步：添加以下内容

```
export JAVA_HOME=/usr/java/jdk1.8.0_341
export PATH=$JAVA_HOME/bin:$PATH
```

### 第五步：使用命令让环境变量生效

命令：source /etc/profile

### 第六步：测试是否安装成功

命令：`java -version`  

### 三台节点服务器分别部署nacos：

### 第一步：三台服务器依次上次安装包到/mpjava路径

### 第二步：解压**

命令：`sudo unzip nacos-server-2.1.2.zip`

### 第三步：创建数据库

根据nacos-2.2.3/conf目录下的`mysql-schema.sql`创建数据库  
连接数据库  
命令：`mysql -P 3306 -u root -p`并输入密码登录  
创建nacos数据库  
命令：`create database nacos_config default character set utf8mb4 collate utf8mb4_general_ci;`  
导入脚本  
命令：`use nacos_config;`  
命令：`source mysql-schema.sql;`  
查看表命令：`show tables;`

### 第四步：更改配置文件/mpjava/nacos/conf/application.properties

目前按上图实列就配置了这几项，未开启鉴权功能，需要开启还需自己配置以下几项，涉及公司隐私和安全，具体内容不方便展示。

```
nacos.core.auth.enabled=true
nacos.core.auth.server.identity.key=
nacos.core.auth.server.identity.value=
nacos.core.auth.plugin.nacos.token.secret.key=
添加：
management.endpoints.web.exposure.include=health,metrics,prometheus
```

### 第五步：更改配置文件

复制/mpjava/nacos/conf/cluster.conf.example 为/mpjava/nacos/conf/cluster.conf  
更改`vim /mpjava/nacos/conf/cluster.conf`，内容为：

```
10.0.0.8
10.0.0.9
10.0.0.10
```

***注意：以本公司生产环境具体ip为主，这里的ip为实验ip**

### 第六步：启动Nacos集群

三台服务器上分别执行启动脚本：`./startup.sh`  

显示：集群模式下成功启动。

**放行端口：**

```
firewall-cmd --zone=public --add-port=8848/tcp --permanent    #放行8848端口
firewall-cmd --zone=public --add-port=9848/tcp --permanent    #放行9848端口
firewall-cmd --zone=public --add-port=9849/tcp --permanent    #放行9849端口

firewall-cmd --reload  #重新载入 返回 success 代表成功

firewall-cmd --zone=public --query-port=8848/tcp    #查看 返回 yes 代表开启成功
firewall-cmd --zone=public --query-port=9848/tcp    #查看 返回 yes 代表开启成功
firewall-cmd --zone=public --query-port=9849/tcp    #查看 返回 yes 代表开启成功
```

### Nacos开机自启（三台nacos服务器）：

### 第一步：三台服务器分别`sudo vim /etc/systemd/system/nacos.service`添加以下内容：

```
[Unit]
Description=nacos
After=network.target

[Service]
# java安装位置
Environment="JAVA_HOME=/usr/java/jdk1.8.0_341"
Type=forking
ExecStart=/mpjava/nacos/bin/startup.sh
ExecReload=/mpjava/nacos/bin/shutdown.sh
ExecStop=/mpjava/nacos/bin/shutdown.sh
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

### 第二步，重启服务

`systemctl enable nacos` # 设置nacos开机自启动  
`cd /mpjava/nacos/bin/ && ./shutdown.sh` 停nacos  
`systemctl start nacos`  # 启动nacos服务  
`systemctl status nacos` # 查看nacos服务状态

### 第三步：验证开机自启

### 方法一：

命令：`sudo systemctl is-enabled nacos.service`  
返回enabled说明配置成功

### 方法二：`reboot`
