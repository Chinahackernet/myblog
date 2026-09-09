---
title: Tengine：Nginx二次开发-高性能进化
---

**前言：在当今的互联网时代，Web 服务器的性能和稳定性对于网站的成功至关重要。Nginx 以其高性能和可扩展性而闻名，但有时候，我们需要更多的特性来满足特定的业务需求。Tengine，作为一个由淘宝网发起的 Nginx 二次开发版本，不仅继承了 Nginx 的所有特性，还添加了许多高级功能和特性，以适应大访问量网站的需求。本文将详细介绍 Tengine 的特性、安装、配置以及如何利用其动态模块和 concat 模块来优化 Web 服务。让我们一起探索如何通过 Tengine 提升我们的 Web 服务平台。**  

### 1. Tengine 概览

Tengine 是基于 Nginx 的 Web 服务器项目，由淘宝网发起，专为高流量网站设计。它不仅在性能和稳定性上得到了大型网站如淘宝网、天猫商城的验证，还致力于提供一个高效、稳定、安全、易用的 Web 平台。

### 1.1 Tengine 资源

- **官网**：<http://tengine.taobao.org>
- **官方文档**：<http://tengine.taobao.org/documentation_cn.html>

### 1.2 Tengine 特性

Tengine 继承了 Nginx-1.16.0 的所有特性，并兼容 Nginx 的配置。以下是 Tengine 的一些关键特性：

- 支持 HTTP 的 CONNECT 方法，适用于正向代理场景。
- 支持异步 OpenSSL，可以使用硬件如 QAT 进行 HTTPS 的加速与卸载。
- 增强运维、监控能力，如异步打印日志及回滚、本地 DNS 缓存、内存监控等。
- Stream 模块支持 server_name 指令。
- 更加强大的负载均衡能力，包括一致性 hash 模块、会话保持模块，还可以对后端服务器进行主动健康检查。
- 支持设置 proxy、memcached、fastcgi、scgi、uwsgi 在后端失败时的重试次数。
- 动态脚本语言 Lua 支持，扩展功能非常高效简单。
- 支持按指定关键字（域名，url 等）收集 Tengine 运行状态。
- 组合多个 CSS、JavaScript 文件的访问请求变成一个请求。
- 自动去除空白字符和注释，减小页面体积。
- 自动根据 CPU 数目设置进程个数和绑定 CPU 亲缘性。
- 监控系统的负载和资源占用，对系统进行保护。
- 显示对运维人员更友好的出错信息，便于定位出错机器。
- 更强大的防攻击（访问速度限制）模块。
- 更方便的命令行参数，如列出编译的模块列表、支持的指令等。
- 可以根据访问文件类型设置过期时间。

### 1.3 动态模块

### 1.3.1 编译安装 Tengine-2.1.2

Tengine 支持运行时动态加载模块，无需每次都重新编译 Tengine。以下是编译安装 Tengine-2.1.2 的步骤：

1. 安装依赖：

   ```
   yum -y install gcc pcre-devel openssl-devel
   ```
2. 创建用户：

   ```
   useradd -r -s /sbin/nologin nginx
   ```
3. 下载并解压 Tengine 源码：

   ```
   cd /usr/local/src
   wget http://tengine.taobao.org/download/tengine-2.1.2.tar.gz 
   tar xf tengine-2.1.2.tar.gz
   cd tengine-2.1.2/
   ```
4. 配置并编译安装：

   ```
   ./configure --prefix=/apps/tengine-2.1.2 --user=nginx --group=nginx --with-http_ssl_module --with-http_v2_module --with-http_realip_module --with-http_stub_status_module --with-http_gzip_static_module --with-pcre
   make && make install
   ```
5. 链接二进制文件：

   ```
   ln -s /apps/tengine-2.1.2/sbin/* /usr/sbin/
   ```
6. 启动 Tengine：

   ```
   nginx
   ```

### 1.3.2 在 Tengine-2.1.2 中添加 Lua 动态模块

1. 安装 Lua 开发包：

   ```
   yum -y install lua-devel
   ```
2. 重新配置并安装 Lua 模块：

   ```
   ./configure --prefix=/apps/tengine-2.1.2 --user=nginx --group=nginx --with-http_ssl_module --with-http_v2_module --with-http_realip_module --with-http_stub_status_module --with-http_gzip_static_module --with-pcre --with-http_lua_module=shared
   make dso_install
   ```
3. 修改配置文件以加载 Lua 模块：

   ```
   vim /apps/tengine-2.1.2/conf/nginx.conf
   ```

   在 `dso` 块中添加：

   ```
   dso {
       load ngx_http_lua_module.so;
   }
   ```
4. 检查配置并重启 Tengine：

   ```
   nginx -t
   nginx -s reload
   ```

### 1.3.3 编译安装 Tengine-2.3.2

Tengine-2.3.2 的编译安装步骤与 Tengine-2.1.2 类似，但增加了 Stream 模块的支持。

1. 安装依赖：

   ```
   yum -y install gcc pcre-devel openssl-devel
   ```
2. 创建用户：

   ```
   useradd -r -s /sbin/nologin nginx
   ```
3. 下载并解压 Tengine 源码：

   ```
   cd /usr/local/src
   wget http://tengine.taobao.org/download/tengine-2.3.2.tar.gz 
   tar xvf tengine-2.3.2.tar.gz
   cd tengine-2.3.2/
   ```
4. 配置并编译安装：

   ```
   ./configure --prefix=/apps/tengine-2.3.2 --user=nginx --group=nginx --with-http_ssl_module --with-http_v2_module --with-http_realip_module --with-http_stub_status_module --with-http_gzip_static_module --with-pcre --with-stream --with-stream_ssl_module --with-stream_realip_module
   make && make install
   ```
5. 链接二进制文件：

   ```
   ln -s /apps/tengine-2.3.2/sbin/* /usr/sbin/
   ```
6. 启动 Tengine：

   ```
   nginx
   ```

### 1.4 Concat 模块使用

### 1.4.1 Concat 模块说明

Concat 模块用于合并多个文件在一个响应报文中，类似于 Apache 的 mod_concat 模块。这有助于减少 HTTP 请求数量，提高网站加载速度和用户体验。

### 1.4.2 编译安装 Concat 模块

1. 确认 Tengine 版本是否支持 concat 模块：

   ```
   ./configure --help | grep http_concat
   ```
2. 配置并编译安装 concat 模块：

   ```
   ./configure --prefix=/apps/tengine-2.1.2 --user=nginx --group=nginx --with-http_ssl_module --with-http_v2_module --with-http_realip_module --with-http_stub_status_module --with-http_gzip_static_module --with-pcre --with-http_lua_module=shared --with-http_concat_module=shared
   make dso_install
   ```
3. 修改配置文件以启用 concat 模块：

   ```
   vim /apps/tengine-2.1.2/conf/nginx.conf
   ```

   在 `location` 块中添加：

   ```
   location /static/css/ {
       concat on;
       concat_max_files 20;
   }

   location /static/js/ {
       concat on;
       concat_max_files 30;
   }
   ```
4. 检查配置并重启 Tengine：

   ```
   nginx -t
   nginx -s reload
   ```

### 1.5 Tengine 配置文件

Tengine 兼容 Nginx 指定版本的配置参数，允许用户在不修改配置的情况下迁移到 Tengine。用户可以根据需要调整配置文件，以充分利用 Tengine 提供的高级功能和特性。

---

以上是 Tengine 的详细介绍，包括其特性、安装步骤、动态模块的使用以及 concat 模块的配置。Tengine 是一个强大的 Nginx 二次开发版本，适用于需要高性能、高稳定性和高级功能的 Web 服务器环境。
