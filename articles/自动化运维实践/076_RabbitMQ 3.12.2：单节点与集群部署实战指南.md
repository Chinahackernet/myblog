---
title: RabbitMQ 3.12.2：单节点与集群部署实战指南
---

**前言：在当今的分布式系统架构中，消息队列已经成为不可或缺的组件之一。它不仅能够实现服务之间的解耦，还能有效提升系统的可扩展性和可靠性。RabbitMQ 作为一款功能强大且广泛使用的开源消息中间件，凭借其高可用性、灵活的路由策略和丰富的插件生态系统，成为了许多开发者和企业的首选。**  
**随着版本的不断迭代，RabbitMQ 3.12.2 带来了诸多改进和新特性，进一步提升了其性能和稳定性。无论是小型项目还是大规模的生产环境，RabbitMQ 都能提供可靠的解决方案。本文将详细介绍如何在 Linux 系统上部署 RabbitMQ 3.12.2 的单节点和集群版本，帮助读者快速搭建开发环境，并为生产环境的部署提供参考。**  
**无论是初学者还是有一定经验的开发者，都可以通过本文掌握 RabbitMQ 的核心部署流程。我们将从基础环境准备开始，逐步深入到单节点和集群的配置，最后通过实战案例展示如何优化和监控 RabbitMQ 系统。让我们一起开启 RabbitMQ 的部署之旅，探索其在现代架构中的强大能力。**

以下是基于 RabbitMQ 3.12.2 版本的单机部署和集群部署步骤，以及 JDK 的具体安装步骤：

## 一、JDK 安装步骤

### 1. 下载适合您系统的 JDK 安装包，可从 Oracle 官方网站获取。

### 2. 上传 JDK 安装包到服务器指定目录，如 `/mpjava`。

### 3. 使用以下命令安装 JDK：

```
cd /mpjava
rpm -ivh jdk-<version>-linux-x64.rpm
```

或使用 `yum` 安装：

```
yum install java-11-openjdk
```

### 4. 验证 JDK 是否安装成功：

```
java -version
```

## 二、RabbitMQ 3.12.2 单机部署

### 1. 安装依赖：

```
sudo yum install -y epel-release
sudo yum install socat logrotate -y
```

### 2. 安装 Erlang：

```
curl -s https://packagecloud.io/install/repositories/rabbitmq/erlang/script.rpm.sh | sudo bash
sudo yum install erlang-25.3.2-1.el7.x86_64 -y
```

### 3. 安装 RabbitMQ：

```
curl -s https://packagecloud.io/install/repositories/rabbitmq/rabbitmq-server/script.rpm.sh | sudo bash
sudo yum install rabbitmq-server-3.12.2-1.el8.noarch -y
```

### 4. 启动并启用 RabbitMQ 服务：

```
sudo systemctl start rabbitmq-server
sudo systemctl enable rabbitmq-server
```

### 5. 启用 Web 管理插件：

```
sudo rabbitmq-plugins enable rabbitmq_management
```

### 6. 创建用户并设置权限：

```
sudo rabbitmqctl add_user admin your_strong_password
sudo rabbitmqctl set_user_tags admin administrator
sudo rabbitmqctl set_permissions -p / admin ".*" ".*" ".*"
```

### 7. 防火墙设置（如需）：

```
sudo firewall-cmd --permanent --add-port={5672/tcp,15672/tcp,25672/tcp}
sudo firewall-cmd --reload
```

### 8. 查看 RabbitMQ 状态：

```
sudo rabbitmqctl status
```

### 9. 程序配置：在 `ly-mp-other.properties` 中配置：

```
mp.component.amqType=1
mp.component.amqUrl=<RabbitMQ服务器IP>
```

## 三、RabbitMQ 3.12.2 集群部署

### 1. 集群规划：3 台机器，部署两个 RabbitMQ 节点，使用 Nginx 做负载均衡。

- RabbitMQ 节点：
  - 172.26.223.76（rabbitmq01）
  - 172.26.223.77（rabbitmq02）
- Nginx：
  - 172.26.223.100

### 2. 在每台 RabbitMQ 节点上按照单机部署步骤安装 RabbitMQ。

### 3. 配置集群：

- 停止 RabbitMQ 服务：

  ```
  sudo systemctl stop rabbitmq-server
  ```
- 修改 `/etc/hosts` 文件，添加节点映射：

  ```
  172.26.223.76 rabbitmq01
  172.26.223.77 rabbitmq02
  ```
- 同步 `.erlang.cookie` 文件到所有节点：

  ```
  sudo scp /var/lib/rabbitmq/.erlang.cookie root@172.26.223.77:/var/lib/rabbitmq
  ```
- 在每台节点上启动 RabbitMQ：

  ```
  sudo systemctl start rabbitmq-server
  ```
- 在第二个节点上执行以下命令加入集群：

  ```
  sudo rabbitmqctl stop_app
  sudo rabbitmqctl join_cluster rabbit@rabbitmq01
  sudo rabbitmqctl start_app
  ```
- 配置镜像队列：

  ```
  sudo rabbitmqctl set_policy ha-all "^" '{"ha-mode":"all"}'
  ```
- 查看集群状态：

  ```
  sudo rabbitmqctl cluster_status
  ```

### 4. 安装和配置 Nginx：

- 安装 Nginx 并在 `/etc/nginx/conf.d` 目录下创建 `rabbitmq.conf` 文件，内容如下：

  ```
  stream {
      upstream rabbitTcp {
          server 172.26.223.76:5672;
          server 172.26.223.77:5672;
      }
      server {
          listen 5672;
          proxy_pass rabbitTcp;
      }
  }
  ```
- 在 `/etc/nginx/nginx.conf` 的最后增加：

  ```
  include /etc/nginx/conf.d/rabbitmq.conf;
  ```
- 重启 Nginx 服务：

  ```
  sudo systemctl restart nginx
  ```

### 5. 程序配置：在 `ly-mp-other.properties` 中配置：

```
mp.component.amqType=1
mp.component.amqUrl=172.26.223.100
```

通过以上步骤，您可以快速搭建一个高可用的RabbitMQ集群。希望本文对您有所帮助！如果有任何问题，欢迎在评论区留言。  
