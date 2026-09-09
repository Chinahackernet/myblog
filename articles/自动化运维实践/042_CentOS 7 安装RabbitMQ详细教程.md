---
title: CentOS 7 安装RabbitMQ详细教程
---

**前言：在分布式系统架构中，消息队列作为数据流转的 “高速公路”，是微服务架构不可或缺的核心组件。RabbitMQ 凭借其稳定的性能、灵活的路由机制和强大的生态支持，成为企业级消息中间件的首选之一。不过，当我们聚焦 CentOS 7 系统时，会发现它的生态适配存在特殊之处 —— 由于系统内核与依赖限制，CentOS 7 最高仅能稳定运行 RabbitMQ 3.9.16 版本，而更高版本的 RabbitMQ（如 4.x）则更适合 CentOS 8/Stream 或 Ubuntu 等较新系统。  
本文将围绕 CentOS 7 环境，详细拆解 RabbitMQ 3.9.16 的完整部署流程：从 Erlang 环境准备、GPG 密钥验证等基础操作，到配置文件优化、Web 管理界面搭建等核心环节，再到虚拟主机（Virtual Host）的原理与实战应用。无论你是初次接触消息队列的开发新手，还是需要在 legacy 系统中落地生产环境的运维工程师，都能通过这套流程完成 RabbitMQ 的稳定部署，并掌握虚拟主机这一关键的资源隔离机制。让我们一步步构建一个安全、高效的消息通信中枢！**

### RabbitMQ下载链接地址

RabbitMQ 安装包下载链接：  
<https://github.com/rabbitmq/rabbitmq-server/releases/>  
RabbitMQ依赖erlang安装包下载链接：  
<https://github.com/rabbitmq/erlang-rpm/releases>  
RabbitMQ版本 和 Erlang 版本兼容性关系：  
<https://www.rabbitmq.com/which-erlang.html>

#### **📌 系统版本适配说明**

- **CentOS 7**：因系统内核和依赖限制，最高适配 **RabbitMQ 3.9.16**，更高版本因 官方未维护 版本不兼容会导致启动失败。
- **CentOS 8/Stream** 和 **Ubuntu**：仍在持续维护，可安装 RabbitMQ 4.x 及更高版本（需参考对应系统教程）。  

- **或者在ubuntu系统上直接查可用版本的包**：
- **命令**：`apt search rabbitmq-server`  

### 一、环境准备与依赖安装

#### 1. 导入 GPG 密钥（确保包来源可信，可选步骤）

##### **步骤 1：传入密钥**

```
# 导入 RabbitMQ 官方签名密钥
rpm --import https://github.com/rabbitmq/signing-keys/releases/download/2.0/rabbitmq-release-signing-key.asc
rpm --import https://packagecloud.io/rabbitmq/erlang/gpgkey
rpm --import https://packagecloud.io/rabbitmq/rabbitmq-server/gpgkey
# 若网络受限，可手动在windows电脑上一一打开以上链接，下载密钥文件后导入centos系统上
```

##### **步骤 2：手动导入所有密钥**

```
# 导入 Erlang 仓库密钥
rpm --import rabbitmq-erlang-F032D9A6696558DA.pub.gpg  

# 导入 RabbitMQ Server 仓库密钥
rpm --import rabbitmq-rabbitmq-server-F6609E60DC62814E.pub.gpg  

# 导入全局发布签名密钥
rpm --import rabbitmq-release-signing-key.asc
```

##### **步骤 3：验证密钥导入**

```
rpm -q gpg-pubkey --qf '%{NAME}-%{VERSION}-%{RELEASE} --> %{SUMMARY}\n' | grep rabbitmq
```

**预期输出**（示例）：

```
gpg-pubkey-F032D9A6 --> RabbitMQ Erlang Repository Key  
gpg-pubkey-F6609E60 --> RabbitMQ Server Repository Key  
gpg-pubkey-<...>    --> RabbitMQ Release Signing Key
```

#### 2. 安装 Erlang 环境（RabbitMQ 依赖）

```
# 执行 RPM 包安装（需提前下载 erlang-23.3.2-1.el7.x86_64.rpm）
rpm -ivh erlang-23.3.2-1.el7.x86_64.rpm
# 验证安装
erl -version  # 应显示 Erlang/OTP 11.2.1
```

### 二、安装与启动 RabbitMQ

#### 1. 安装 RabbitMQ Server

```
# 执行 RPM 包安装（需提前下载 rabbitmq-server-3.9.16-1.el7.noarch.rpm）
rpm -ivh rabbitmq-server-3.9.16-1.el7.noarch.rpm
```

#### 2. 启动服务与状态检查

```
# 启动服务
systemctl start rabbitmq-server
# 查看服务状态
systemctl status rabbitmq-server
# 或者
rabbitmqctl status
# 或使用 RabbitMQ 诊断工具
rabbitmq-diagnostics status
```

**注意：这里为空，说明安装启动后默认不会使用配置文件**

#### 3. 查看日志（启动失败时排查）

```
tail -200f /var/log/rabbitmq/rabbit@localhost.log
```

- **home dir**：rabbitmq安装后的主目录，
- **config file(s)**：表示当前没有配置文件，显示为 `(none)`
- **database dir**：数据目录

### 三、核心配置文件优化

#### 1. 创建配置文件（生产环境必备）

```
vim /etc/rabbitmq/rabbitmq.conf
```

填入以下内容：

```
### ================ 基础网络配置 ================
# RabbitMQ 核心 AMQP 协议监听配置
listeners.tcp.default = 0.0.0.0:5672

### ================ 管理插件配置 ================
# 管理插件 Web 界面、HTTP API 监听端口，启用管理插件后可通过浏览器访问（需先执行 rabbitmq-plugins enable rabbitmq_management）
management.listener.port = 15672
# 关闭管理插件的 HTTPS 监听（生产环境若需加密可设为 true 并配置证书）
management.listener.ssl = false

### ================ 资源限制配置 ================
# 内存使用阈值，当 RabbitMQ 占用内存达到系统内存 40% 时，触发流控等机制，避免内存耗尽
vm_memory_high_watermark.relative = 0.4
# 磁盘空闲空间低于 100MB 时，阻塞消息写入，防止磁盘写满影响服务
disk_free_limit.absolute = 100MB

### ================ 用户安全配置 ================
# 禁用默认的 guest 用户（默认只能本地登录，生产环境为安全建议关闭）
loopback_users.guest = false
```

#### 2. 配置文件权限设置

```
chown rabbitmq:rabbitmq /etc/rabbitmq/rabbitmq.conf
chmod 640 /etc/rabbitmq/rabbitmq.conf
```

#### 3. 重启服务使配置生效

```
systemctl restart rabbitmq-server
```

启动成功

再次执行： `rabbitmq-diagnostics status` 查看新增的配置文件是否被使用  

### 四、服务管理与开机自启

#### 1. 常用服务命令

```
systemctl start rabbitmq-server  # 启动  
systemctl stop rabbitmq-server   # 停止  
systemctl restart rabbitmq-server  # 重启  
systemctl enable rabbitmq-server  # 开机自启
```

#### 2. 验证开机自启配置

```
systemctl is-enabled rabbitmq-server  # 输出 "enabled" 表示配置成功
```

### 五、Web 管理界面配置

#### 1. 启用管理插件

```
rabbitmq-plugins enable rabbitmq_management
```

#### 2. 创建管理员用户（安全加固）

```
# 添加用户（替换用户名和密码）
rabbitmqctl add_user <用户名> <密码>
# 设置全权限（默认虚拟主机 / 下）
rabbitmqctl set_permissions -p / <用户名> ".*" ".*" ".*"
# 注解：
# 第一个 ".*" 表示用户可以配置任意队列和交换机（configure 权限）
# 第二个 ".*" 表示用户可以向任意队列和交换机发送消息（write 权限）
# 第三个 ".*" 表示用户可以从任意队列中消费消息（read 权限）
# -p / 表示在默认虚拟主机 "/" 上设置权限

# 标记为管理员角色
rabbitmqctl set_user_tags <用户名> administrator
```

#### 3. 修改密码（避免后台命令行明文泄露）

- 登录 Web 管理界面（`http://服务器IP:15672`），进入 `Admin` → `Users` → 点击 `admin` 用户。
- 在 `Password` 区域输入<新密码> ，点击 `Update user` 保存。  

#### 4. 删除默认 guest 用户

`rabbitmq.conf`配置文件里禁止了guest用户，但是web页面上面还能登录，这里选择删除默认用户，永久禁用  
命令：

```
rabbitmqctl delete_user guest
```

### 六、虚拟主机（Virtual Host）详解与创建

#### 1. 虚拟主机的核心作用

虚拟主机是 RabbitMQ 中**资源隔离的逻辑容器**，类比为“独立的数据空间”，主要功能包括：

- **多租户隔离**：为不同业务线、团队或客户分配独立虚拟主机，避免数据混杂（如 SaaS 系统中隔离不同企业的数据）。
- **环境隔离**：区分开发、测试、生产环境，防止测试数据污染正式环境。
- **权限精细化管理**：为不同虚拟主机分配不同用户权限（如只读、读写、管理等），提升系统安全性。

#### 2. 创建虚拟主机（Web 界面操作）

1. 登录 Web 管理界面，进入 `Admin` → `Virtual Hosts` → 点击 `Add a new virtual host`。
2. 输入虚拟主机名称（如 `biz-system`），点击 `Add virtual host` 完成创建。  

#### 3. 绑定用户到虚拟主机

1. 进入 `Users` → 点击目标用户（如 `admin`）。
2. 在 `Virtual Hosts` 区域，选择已创建的虚拟主机（如 `biz-system`），点击 `Set permission` 即可赋予该用户在虚拟主机内的操作权限。  

### 七、验证与生产级建议

- **磁盘监控**：确保 `/var/lib/rabbitmq/` 目录有足够空间，避免因磁盘满导致服务阻塞。
- **内存监控**：通过 `top` 或监控工具查看 RabbitMQ 进程内存使用，避免超过配置的 `0.4` 阈值。
- **网络防火墙**：配置防火墙允许 `5672`（AMQP）和 `15672`（Web 管理）端口的访问，限制非信任IP。

### 📝 总结

CentOS 7 下安装 RabbitMQ 3.9.16 需注意版本兼容性，通过配置文件和权限管理可构建安全的消息队列服务。虚拟主机作为核心隔离机制，能有效支撑多业务场景的部署需求。后续若需升级系统，建议迁移至 CentOS 8/Stream 或 Ubuntu，以获取更高版本 RabbitMQ 的新特性支持。
