# Nginx服务配置

> 分类：Linux / 第13章：服务部署
> 原文：https://www.cuiliangblog.cn/detail/section/31467998
> 来源：崔亮的博客

---

# Nginx简介
## 为什么需要负载均衡
通常情况下早期业务都是单节点运行，但是随着业务的增长，访问量的增多，单纯的提高服务器配置已不能满足要求，经常因为机器性能瓶颈而导致系统宕机，影响业务。此时就面临两个问题：

+ 单节点无法满足日益增长的流量负载，需要有新的服务器均摊访问压力。
+ 当节点宕机后，整个系统无法访问，需要有集群提供服务，当某一节点故障后，服务仍能正常访问。

为了解决上述问题，负载均衡技术<font style="color:rgb(51, 51, 51);">应运而生。目前的负载均衡实现思路主要有两种：</font>

+ <font style="color:rgb(51, 51, 51);">硬件负载，例如F5、A10，性能高但成本高昂。</font>
+ <font style="color:rgb(51, 51, 51);">软件负载，例如nginx、haproxy。</font>

## Nginx特点
<font style="color:rgb(18, 18, 18);">Nginx是一款轻量级的Web服务器、反向代理服务器，由于它的内存占用少，启动极快，高并发能力强，在互联网项目中广泛应用。</font>

# Nginx部署
## yum方式部署
```bash
安装pepl源
# yum -y install epel-release
安装nginx
# yum -y install nginx
查看nginx版本
# nginx -v
nginx version: nginx/1.14.1
启动nginx
# systemctl start nginx
设置nginx开机自启动
# systemctl enable nginx
```



## 二进制方式部署
## 源码编译安装nginx
1. 安装相关依赖包

![](assets/10-Linux/bfc1e8d126f8da818f04.png)

![](assets/10-Linux/c3e8be6319bb396403a5.png)

+ 安装基于perl的正则表达式，支持URL重写
+ 安装openssl软件库，用于https连接
2. 创建nginx程序用户

![](assets/10-Linux/945854ff0906dbccb7a7.png)

3. 额外准备编译所支持的路径目录

![](assets/10-Linux/c2240a4762d4a3bae5ab.png)

4. 编译安装

```yaml
./configure --prefix=/usr/local/nginx --conf-path=/etc/nginx/nginx.conf --group=nginx --error-log-path=/var/log/nginx/error.log --http-log-path=/var/log/nginx/access.log --pid-path=/var/run/nginx/nginx.pid --lock-path=/var/lock/nginx.lock --with-http_stub_status_module --with-http_ssl_module --with-http_gzip_static_module --with-http_flv_module --with-http_mp4_module --http-client-body-temp-path=/var/tmp/nginx/client --http-proxy-temp-path=/var/tmp/nginx/proxy --http-fastcgi-temp-path=/var/tmp/nginx/fastcgi --without-mail_pop3_module --without-mail_smtp_module
```

| --prefix=/usr/local/nginx | 默认安装的路径 |
| --- | --- |
| --conf-path=/etc/nginx/nginx.conf | 主配置文件目录 |
| --group=nginx | 属组 |
| --http-client-body-temp-path=/var/tmp/nginx/client | 客户端提交数据临时存放文件路径（若没有需要自行创建） |
| --http-proxy-temp-path | 作为代理服务器临时存放文件路径 |
| --http-fastcgi-temp-path=/var/tmp/nginx/fastcgi | 作为fastcgi的临时存放文件路径（若没有需要自行创建） |


5. 创建软连接<font style="color:white;">配置环境变量</font>

![](assets/10-Linux/61055346d62151847fa8.png)

# Nginx基本配置
## 正常运行配置
![](assets/10-Linux/843e04fb2fad5810c629.png)

1. 指定运行worker进程的用户和组

![](assets/10-Linux/48b29eef6b0f4197ad42.png)

2. 指定nginx守护进程的PID文件

编译安装时已经指定pid文件路径，不用配置（--pid-path=/var/run/nginx/nginx.pid）

3. 指定一个worker进程所能够打开的最大文件句柄数

![](assets/10-Linux/6c96492ea8299f9341f3.png)

设置按照默认1024，依然能启动

ulimit -n也能设置

4. 设置主机名，编码格式

![](assets/10-Linux/f8e540ae04b8efba274e.png)

5. 编写测试主页

![](assets/10-Linux/56691ac60d1350a44de8.png)

6. 检查配置文件语法

![](assets/10-Linux/6a8c674e455f429b3398.png)

7. 启动服务验证

![](assets/10-Linux/da34fc03a343e2814a75.png)

![](assets/10-Linux/f971b28e9b7a21df4acf.png)

## 性能优化配置
1. worker_processes（worker进程的个数）

![](assets/10-Linux/727cbc7cf334d3fdc630.png)

通常应略少于CPU物理核心数（可设置为auto）

可以设置为auto系统自动调节

进程切换  context switch会产生CPU不必要的消耗，进程数要少于CPU但能提升缓存命中率

2. worker_cpu_affinity [cpu mask]（将worker进程绑定在某CPU上）

![](assets/10-Linux/d52a757a51ad98fdd4b3.png)

可以设置为auto系统自动调节

cpumask由八位数的二进制表示，例如：00000001 00000010 00000100；

3. time_resolution计时器解析度

降低此值，可减少gettimeofday()系统调用的次数。（提升nginx性能）

4. worker_priority number（指明worker进程的优先(nice)值）

![](assets/10-Linux/25f2fa3eebbf4857e886.png)

![](assets/10-Linux/e6d7b017adb21ce17e73.png)

取值范围（-20-->100，19-->139）值越小，优先级越高

## 事件相关配置
1. accept_mutex {off|on};

master调度用户请求至各worker进程时使用的负载均衡锁，on表示能使多个worker进程轮流、序列化的响应新请求。

2. lock_file file

accept_mutex用到的锁文件路径（在编译安装时已配置）

3. use [epoll|select|poll|rtsig]

指明使用的事件模型，建议让nginx自动选择

4. worker_connections

设定单个worker进程能处理的最大并发连接数量

![](assets/10-Linux/c9f182ed23b41cc76a2c.png)

## 用于用户调试、定位问题
> 若使用调试功能，需在编译的时候--with-debug
>

1. daemon {on|off};

是否以守护进程方式运行nginx，调试时应该设置为on。

2. master_process {on|off};

是否以master/worker模型来运行nginx，调试时可以设为off。

3. error_log file

错误日志，包括日志位置和级别。（使用debug级别，需要编译时使用--with-debug选项）

# web服务器配置
## 虚拟主机配置
1. 设置端口、根路径、名称

![](assets/10-Linux/fa6810ffc06c2e7edbef.png)

![](assets/10-Linux/0c00782321e49113644b.png)

2. 开启日志记录

![](assets/10-Linux/07ba777034be7684d594.png)

3. 在全局配置中打开man格式

![](assets/10-Linux/367edbd81bc87bbacf58.png)

4. 开启404、500错误跳转页面

![](assets/10-Linux/e6dddafba80b6d380191.png)

5. 创建相关文件

![](assets/10-Linux/b9d60dd35e4e2a490256.png)

![](assets/10-Linux/6b64af4b637ce538922a.png)

6. 验证结果

![](assets/10-Linux/6daf294cb8fa9cb83ead.png)

![](assets/10-Linux/c69ebd3249a63888d2d7.png)

![](assets/10-Linux/7f0f1c8edafc2b4e233d.png)

## Location 配置
1. 正则表达式模式匹配检查

![](assets/10-Linux/c27d81d55909d654630c.png)

2. 结果验证

![](assets/10-Linux/568d5008d844ee0b7500.png)

3. 不带符号匹配

![](assets/10-Linux/3a91e125ea56d0db90a8.png)

![](assets/10-Linux/ed3b0641343ffd09dccc.png)

> 匹配遵循一定的优先等级
>

| = | 精确匹配 |
| --- | --- |
| ~ | 正则表达式模式匹配检查，区分字符大小写 |
| ~* | 正则表达式模块匹配检查，不区分字符大小写 |
| ^~ | URI的前半部分匹配，不支持正则表达式 |
|   | 最后就是不带任何符号匹配 |


正则表达式优先级高，默认在/web/html2下查找/images/a.txt故而找不到

4. 注释正则表达式，继续访问

![](assets/10-Linux/d34f9c8c9ac848c4c7c0.png)

![](assets/10-Linux/273a77f1944609126e8c.png)

5. 定义路径别名alias

![](assets/10-Linux/3d1e8cdae32e2b7ae895.png)

6. 编写测试页

![](assets/10-Linux/98d3c7dacc3368140ecc.png)

7. 访问验证

![](assets/10-Linux/02a6ff1924f8fd1d5b94.png)

## Nginx访问控制
1. 基于IP的访问控制

修改nginx主配置文件

![](assets/10-Linux/34e40afa38627f4c86fe.png)

10.10.64网段测试

![](assets/10-Linux/dffd05a2e55a58304509.png)

192.168.10网段测试

![](assets/10-Linux/4515494f2a514ecaf288.png)

2. 基于用户的访问控制

安装htpasswd命令工具

![](assets/10-Linux/51209f8241fdf7543a3a.png)

创建存放密码文件的目录

![](assets/10-Linux/ffd1f3fa2fa67955bb95.png)

创建密码文件

![](assets/10-Linux/714b56b33902d573c77d.png)

修改nginx主配置文件

![](assets/10-Linux/f7d0168920754305a9f3.png)

访问验证

![](assets/10-Linux/ad259c13c64a4ff2ef63.png)

## https服务
1. CA服务器配置

![](assets/10-Linux/66b958c138d0c1a24de7.png)

2. 服务器生成CA请求文件

![](assets/10-Linux/29fe0f6e8c5bbae6bea0.png)

3. 签署证书

![](assets/10-Linux/e359999bf25af9d1701c.png)

![](assets/10-Linux/f2cc9d7250ab5e29cf99.png)

![](assets/10-Linux/fb1f7fc63fc6042e40c8.png)

4. 编辑nginx主配置文件

![](assets/10-Linux/25ef9bf2faa600d48f8f.png)

5. 将证书移动到配置文件对应的路径中

![](assets/10-Linux/8b72dc271fcf944e8a84.png)

6. 创建测试首页

![](assets/10-Linux/884e245880214fac9905.png)

7. 抓包工具模拟认证证书

![](assets/10-Linux/04f070cf8032b2e7846a.png)

![](assets/10-Linux/fbde824e6df2335acf8c.png)

## stub_status {on|off}  状态统计页面
1. 修改nginx主配置文件

![](assets/10-Linux/287004186528001d18fb.png)

2. 访问测试

![](assets/10-Linux/aae968d590e2fdeeb9c2.png)

| Active connections | 当前所有处于活动的连接 |
| --- | --- |
| server accepts | 接受的连接 |
| server handled | 处理过的连接 |
| server requests | 处理的请求 |
| Reading | 正在接受的请求 |
| Writing | 请求完成，处于发送响应报文状态 |
| Waiting | 处于活动状态的连接数 |


## URL重写（用户请求重定向）
1. 修改nginx主配置文件

![](assets/10-Linux/c2be2b6813da02b2ae18.png)

2. 创建测试页面

![](assets/10-Linux/95871699564730999b78.png)

![](assets/10-Linux/77c290bf4506cb55ef8f.png)

3. 访问测试

![](assets/10-Linux/d44b337aacda02a37a8e.png)

![](assets/10-Linux/d4cbfd458df7fc267af2.png)

## if上下文（通常定义在local或server上下文中）
| 变量名 | 变量值为空时，或者以“0”开始，即为false，其他的均为true |
| --- | --- |
| 以变量为基础的比较表达式 | > < = |
| 可以基于正则表达式模式匹配操作 | ~：区分大小写模式匹配<br/>~*：不区分大小写的模式匹配检查<br/>!~和!~*：对上面两种测试取反 |
| 测试文件是否存在 | -f  !-f |
| 测试指定目录是否存在 | -d  !-d |
| 测试文件是否存在 | -e  !-e |
| 检查文件是否有执行权 | -x  !-x |


1. 修改nginx主配置文件

![](assets/10-Linux/1110d7285373c9a0c963.png)

2. 创建测试页面

![](assets/10-Linux/1d05c36f18ab52f96797.png)

3. 访问验证

![](assets/10-Linux/bcedee63d4635a7729c4.png)

## 防盗链
1. 默认情况下，其他网站能调用本网站的资源进行显示

![](assets/10-Linux/f65aea8278ec9e8917e8.png)

2. 修改nginx主配置文件

![](assets/10-Linux/dfb3d527db3a39195581.png)

3. 准备测试图片

![](assets/10-Linux/fa49f541a2aa2b4114bb.png)

4. 结果验证

![](assets/10-Linux/0021f2b3c4072dcd4f8a.png)

![](assets/10-Linux/b9f8d15ac77077c704b8.png)

## 访问日志格式
1. 修改nginx主配置文件

![](assets/10-Linux/a048d469b8a073ccf151.png)

![](assets/10-Linux/3524837bb81a00eac6aa.png)

2. 根据配置文件创建目录

![](assets/10-Linux/52666b30a2284efd0756.png)

3. 访问验证

![](assets/10-Linux/b5294f1156e689c53017.png)    

## 网络连接相关的配置
| Keepalive_timeout # | 长连接能允许请求超时时长，默认75s |
| --- | --- |
| Keepalive_requests # | 一个长连接所能够允许请求的最大资源数 |
| Keepalive_disable [msie8 | safari | none] | 为指定类型的User Agent禁用长连接 |
| tcp_nodelay  on|off | 是否对长连接使用TCP_NODELAY选项 |
| client_header_timeout # | 读取http请求报文首部的超时时长 |
| client_body_timeout# | 读取http请求报文body部分的超时时长 |
| Send_timeout # | 发送相应报文的超时时长 |


# 反向代理配置
> Nginx与Apache动静分离配置
>

![](assets/10-Linux/cabc5a36621037a6fe9b.jpeg)

## 搭建nginx服务器
1. 安装软件包

![](assets/10-Linux/38669d4fca194fe54a77.png)

2. 安装nginx调用php的php-fpm模块

![](assets/10-Linux/969e8092050803b1985f.png)

3. 修改nginx主配置文件

![](assets/10-Linux/22b3dd8cf18349cb049a.png)

4. 访问测试

![](assets/10-Linux/b221ba876ebb0f0bfb75.png)

## 搭建Apache、php服务器
1. 安装软件包

```yaml
yum -y install httpd php  php-mysql php-cgi php-mbstring php-gd php-fpm autoconf libjpeg libjpeg-devel libpng libpng-devel freetype freetype-devel libxml2 libxml2-devel zlib zlib-devel glibc glibc-devel glib2 glib2-devel bzip2 bzip2-devel ncurses ncurses-devel curl curl-devel e2fsprogs e2fsprogs-devel krb5 krb5-devel libidn libidn-devel openssl openssl-devel openldap openldap-devel nss_ldap openldap-clients openldap-servers
```

![](assets/10-Linux/940da9e7dba85738431a.png)

## 搭建数据库服务器
1. 安装软件包

![](assets/10-Linux/35a9345e942be5433003.png)

2. 数据库相关设置

![](assets/10-Linux/c7b6986dd301fd30f17f.png)

![](assets/10-Linux/740e2f035ecceb11bd74.png)

## Apache服务器配置，支持php
1. 修改httpd主配置文件

![](assets/10-Linux/2e6b37691b88724751f7.png)

![](assets/10-Linux/f1d8f590da48939fff94.png)

2. 访问测试

![](assets/10-Linux/6b98c2a12a2ded60273b.png)

## Nginx代理动态资源
1. 修改nginx主配置文件

![](assets/10-Linux/ddd5c6d9a97525834a00.png)

2. 访问测试

![](assets/10-Linux/7ad63c66d58a32a7fb5d.png)

## 编写数据库、php、nginx资源测试文件
![](assets/10-Linux/ec0544885bdebc941648.png)

![](assets/10-Linux/4b3f08ffdae9156511ef.png)

## 项目上线
1. 解压移动项目文件

Nginx、Apache服务器都解压移动到对应web文件目录下

![](assets/10-Linux/22c467f52e1b67b18730.png)

2. 为项目创建数据库

![](assets/10-Linux/89032d839c767bc1663e.png)

## 反向代理
网络拓扑图

![](assets/10-Linux/8191ade55d5f49278025.jpeg)

1.  单个服务器反向代理

修改nginx主配置文件

![](assets/10-Linux/73c109533961eb53ae87.png)

访问测试

![](assets/10-Linux/f7b67621740b4b1388d5.png)

2. 代理服务器部分目录

修改nginx配置文件

![](assets/10-Linux/06c8cf3d53384d8e9432.png)

创建测试文件

![](assets/10-Linux/aaa8044e3f2020019f97.png)

访问测试

![](assets/10-Linux/fa0190cf4c2e23853b55.png)

![](assets/10-Linux/d04dc092cb6f5cd9e2e5.png)

3. 代理服务器部分格式资源

修改nginx配置文件

> 不要接uri地址
>

![](assets/10-Linux/0d6af6ff97f9e9a9b7b1.png)

编写测试文件

![](assets/10-Linux/d46aec6d9cc3e6d826da.png)

![](assets/10-Linux/7c7ddc8e6f0cbc0c36e6.png)

访问验证

![](assets/10-Linux/dbdb622ccd36cdd5a9f0.png)

4. 代理服务器日志设置

查看被代理的web服务器日志

![](assets/10-Linux/d34360c662a483ef4a6a.png)

> 默认不会记录源客户端的IP地址，无法完成用户日志的精准分析。
>

修改nginx主配置文件

![](assets/10-Linux/7ddc3a9d654a54ce0373.png)

> 使用proxy_set_head配置方法，来定义remote_addr。
>

修改web服务器httpd主配置文件

![](assets/10-Linux/8b25edad71c5a28803b4.png)

> 修改upsteam server日志的格式
>

访问验证

![](assets/10-Linux/933826d737358538c231.png)

## 缓存加速
![](assets/10-Linux/5b686dc5e170c1e366ab.jpeg)

1. 在nginx主配置文件中定义缓存

   ![](assets/10-Linux/e7ead8980db9709a1ca3.png)

2. 在server或location中调用缓存

       ![](assets/10-Linux/3d8482d733b4d33d0bc8.png)

3. 创建缓存目录并更改属主属组

       ![](assets/10-Linux/1bdb8e1895ca311d22d7.png)

4. 访问验证，查看缓存

       ![](assets/10-Linux/3240d485613e70500005.png)

# 负载均衡
![](assets/10-Linux/b9473ca4fc500227ac6d.jpeg)

## 负载均衡配置
| down | 表示单前的server暂时不参与负载 |
| --- | --- |
| Weight | 默认为1.weight越大，负载的权重就越大。 |
| max_fails | 允许请求失败的次数默认为1.当超过最大次数时，返回proxy_next_upstream 模块定义的错误 |
| fail_timeout | max_fails 次失败后，暂停的时间。 |
| Backup | 其它所有的非backup机器down或者忙的时候，请求backup机器。所以这台机器压力会最轻。 |


1. 定义模块

<font style="color:white;">            </font>       ![](assets/10-Linux/c9aec21d4c221a6f1a30.png)

2. 调用模块

           ![](assets/10-Linux/4c905d847d60dc2f68cc.png)

3. 访问验证

           ![](assets/10-Linux/517c393a49ca0bf7aa65.png)

## 模拟节点下线
1. 将节点1下线

       ![](assets/10-Linux/9f83aeb1c074ee4889c4.png)

2. 访问验证

       ![](assets/10-Linux/3158e07617d8fe0ab988.png)

3. 将节点1和2都下线，启动backup

       ![](assets/10-Linux/ee321e8d4b510811d7b7.png)

## 超时自动下线
![](assets/10-Linux/57ef56b51072df276284.png)

## 源地址hash绑定
1. 配置nginx主配置文件

       ![](assets/10-Linux/d1b1c020881cb43bb835.png)

2. 访问验证

      ![](assets/10-Linux/b3b9e1cf6d2107f21eec.png)

## Cookie会话绑定
1. 安装sticky模块

```bash
./configure --prefix=/usr/local/nginx  --user=nginx --group=nginx --with-http_stub_status_module --with-http_ssl_module --add-module=/server/tools/nginx-sticky-module-ng
```

2. 配置nginx主配置文件

        ![](assets/10-Linux/8bc3b09c80066612d661.png)

## Fastcgi缓存
1. Nginx主配置文件定义fastcgi缓存

![](assets/10-Linux/aabbaa7eaa2ac6d89bdc.png)

2. 配置fastcgi缓存

![](assets/10-Linux/ecdeefeedaad547b6586.png)

# 性能优化
## 网页缓存
> 在http、server、location配置区域均可配置
>

1. 修改nginx主配置文件

![](assets/10-Linux/a56617323b5b8774705b.png)

2. 访问验证

![](assets/10-Linux/3da66db9879c8744bb4a.png)

## 网页压缩
1. 修改nginx主配置文件

![](assets/10-Linux/3203b5a68d86193bab52.png)

2. 修改测试文件

![](assets/10-Linux/b64be9a45699c164200d.png)

3. 访问验证

![](assets/10-Linux/c9e7df7cb50adb0dcb30.png)

## nginx日志切割
Nginx没有自带模块对其日志进行切割，我们可以通过编写脚本，以周期性计划任务方式对nginx日志切割

| kill -1 nginx// | 平滑重启 nginx (reload) |
| --- | --- |
| kill -s HUP nginx // | 平滑重启 nginx (reload) |
| kill -3 nginx // | 正常停止 nginx (stop) |
| kill -s QUIT nginx // | 正常停止 nginx (stop) |
| kill -s USR1 nginx // | 用于 nginx 的日志切换，也就是重新打开一个日志文件，例如每天要生成一个日志文件时，可以使用这个信号来控制 |
| kill -s USR2 nginx // | 用于平滑升级可执行程序 |
| nginx -s reload | 平滑加载reload |
| nginx -s stop | 停止nginx服务 |


1. 安装killall命令程序包

![](assets/10-Linux/612b0fb1a73191a4c926.png)

![](assets/10-Linux/a1849d1c46871db38075.png)

2. 执行日志切换脚本

![](assets/10-Linux/a8ebd51fae67306fe957.png)

3. 查看日志

![](assets/10-Linux/14222cef4a602cc426e1.png)

4. 编写定时任务，每天执行

![](assets/10-Linux/0a9cae96b860860ebb8a.png)

## 修改服务器信息
1. 默认显示服务器种类，版本，存在安全隐患

![](assets/10-Linux/a0c08a520ab6f1fee1d3.png)

2. 修改版本号、服务器种类

![](assets/10-Linux/c2d2242f5d1163c21002.png)

![](assets/10-Linux/3f5cdb00722de57f3fed.png)

3. 修改http头信息connection字段，防止回显示版本号

![](assets/10-Linux/2588e751536dcdd4c3d0.png)

![](assets/10-Linux/d015903a4e89a79dad4b.png)

4. 隐藏/修改nginx的http错误码的返回值

![](assets/10-Linux/b2d74728fc92368ab5d2.png)

![](assets/10-Linux/f811947177d2c92af80b.png)

5. 验证结果

![](assets/10-Linux/aec1c5dc8e7623ae9b87.png)

![](assets/10-Linux/6303937a5dc216d4ef62.png)

### 

