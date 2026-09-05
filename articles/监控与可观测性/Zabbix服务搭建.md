---

  

## title: Zabbix服务搭建  
tag: zabbix  
date: 2019.5.26

  

### 1.了解Zabbix

  

Zabbix 是一个非常强的监控系统，其官方说明是：Zabbix企业级的软件。被用来监控IT基础设施的可用性和性能。（Zabbix优点在于易于上手难于精通）

  

使用Zabbix时，一般需要在被监控主机安装Zabbix Agent与Zabbix Server通信，Zabbix Agentd收集信息发送给Zabbix Server，这是Zabbix监控的一般模式。

  

在学习之前先了解Zabbix的一些重要的组件这样对整套系统有些初步的概念。

  

```
zabbix_server : Zabbix的核心部分主要是采集信息、写入数据库

zabbix_agentd : 部署在被监控服务器的一个进程，负责采集信息与ZabbixServer交互

zabbix_get :  Zabbix工具，用于发送数据给Server或proxy，多用于故障排除

zabbix_proxy : Zabbix代理守护进程，相当于中转站的功能，把采集的数据提交到Zabbix Server里。一般用于多个机房分布式部署。
```

  

### 2.安装Zabbix

  

安装前确保服务器的时间是正确的

  

```
yum install -y ntpdate

ntpdate ntp1.aliyun.com
```

  

创建用户

  

```
useradd -M -s /sbin/nologin zabbix
```

  

解压源码包

  

```
tar xzvf zabbix-3.4.14.tar.gz -C /usr/local/src/

cd /usr/local/src/zabbix-3.4.14/
```

  

编译源码

  

```
yun install -y net-snmp* libevent-devel //安装依赖

./configure --prefix=/usr/local/zabbix --enable-server --enable-agent --enable-ipv6 --with-mysql --with-libxml2 --with-net-snmp --with-libcurl

make install
```

  

\--enable-server //启用服务器端

  

\--enable-agent //启用监控端  
注：命令行工具 zabbix\_get 和 zabbix\_sender 只有在 --enable-agent 选项启用时才会被编译。

  

\--enable-ipv6 //启用IPV6

  

\--with-mysql //指定数据库（可选指定mysql-config）

  

初始化数据库

  

```
create database zabbix;

grant all on zabbix.* to zabbix@localhost identified by 'hkjwoaini';
//如果报错：Your password does not satisfy the current policy requirements

set global validate_password_policy=0;
//这样判断密码则基于长度了。

flush privileges;
//刷新权限表

cd database/mysql/

mysql -uzabbix -phkjwoaini zabbix < schema.sql
//如果是初始化proxy，导这一个数据库就够了。
mysql -uzabbix -phkjwoaini zabbix < images.sql

mysql -uzabbix -phkjwoaini zabbix < data.sql
```

  

配置Zabbix Server和Zabbix Agentd（记得备份配置文件）

  

```
vi /usr/local/zabbix/etc/zabbix_server.conf

LogFile=/tmp/zabbix_server.log
DBHost=localhost
DBName=zabbix
DBUser=zabbix
DBPassword=hkjwoaini
Timeout=4
LogSlowQueries=3000
//这是我配置好的服务器配置供参考。

vi /usr/local/zabbix/etc/zabbix_agentd.conf

LogFile=/tmp/zabbix_agentd.log
Server=127.0.0.1
ServerActive=127.0.0.1
Hostname=Zabbix server
User=zabbix
//供参考

cp -r /usr/local/src/zabbix-3.4.14/misc/init.d/fedora/core5/zabbix_* /etc/init.d/
//拷贝启动脚本

ZABBIX_BIN="/usr/local/zabbix/sbin/zabbix_server"
//修改两个脚本的这个变量改为zabbix启动文件的真实路径

[root@localhost ~]# /etc/init.d/zabbix_server start
Starting zabbix_server (via systemctl):                    [  OK  ]
[root@localhost ~]# /etc/init.d/zabbix_agentd start
Starting zabbix_agentd (via systemctl):                    [  OK  ]

//启动成功
```

  

配置Web管理  
这里我用之前编译好的LNMP环境，直接拷贝网站源码

  

```
cp -r /usr/local/src/zabbix-3.4.14/frontends/php/* /usr/local/nginx/html/

Nginx配置如下
location / {
            index  index.php index.html index.htm;
        }

location ~ \.php$ {
            root           html;
            fastcgi_pass   127.0.0.1:9000;
            fastcgi_index  index.php;
            fastcgi_param  SCRIPT_FILENAME  /usr/local/nginx/html$fastcgi_script_name;
            include        fastcgi_params;
        }
//配置完重启Nginx
```

  

Web界面初始化  
上面配置完成以后浏览服务器IP  
![](https://vimc-1255664370.cos.ap-guangzhou.myqcloud.com/Zabbix_1/1.png)  
这里直接，下一步。  
![](https://vimc-1255664370.cos.ap-guangzhou.myqcloud.com/Zabbix_1/2.png)  
这里进PHP配置文件，改对应的地方。

  

```
vi /usr/local/php/php.ini

post_max_size = 2M
max_execution_time = 30
max_input_time = 60
;date.timezone =

改为

post_max_size = 16M
max_execution_time = 300
max_input_time = 300
date.timezone = Asia/Shanghai
```

  

往下拉看到缺少LDAP模块  
![](https://vimc-1255664370.cos.ap-guangzhou.myqcloud.com/Zabbix_1/3.png)  
下面来编译LDAP模块

  

```
cd /usr/local/src/php-7.2.9/ext/ldap/

/usr/local/php/bin/phpize
//生成编译文件
yum install openldap-devel openldap -y
//安装编译依赖
./configure --with-php-config=/usr/local/php/bin/php-config  -with-ldap && make && make install
//如果报错：configure: error: Cannot find ldap libraries in /usr/lib.
cp -frp /usr/lib64/libldap* /usr/lib

vi /usr/local/php/php.ini

extension=ldap.so
//指定模块

/etc/init.d/php-fpm restart
```

  

![](https://vimc-1255664370.cos.ap-guangzhou.myqcloud.com/Zabbix_1/4.png)  
刷新页面，发现所有都配置OK了，然后下一步。  
![](https://vimc-1255664370.cos.ap-guangzhou.myqcloud.com/Zabbix_1/5.png)  
配置数据库  
![](https://vimc-1255664370.cos.ap-guangzhou.myqcloud.com/Zabbix_1/6.png)  
配置服务器详细信息  
![](https://vimc-1255664370.cos.ap-guangzhou.myqcloud.com/Zabbix_1/7.png)  
安装前的总结，下一步，安装前如果报错下载配置文件拷贝到zabbix网站的conf目录。  
![](https://vimc-1255664370.cos.ap-guangzhou.myqcloud.com/Zabbix_1/8.png)  
安装完成。  
![](https://vimc-1255664370.cos.ap-guangzhou.myqcloud.com/Zabbix_1/9.png)  
默认登录密码admin or zabbix.  
![](https://vimc-1255664370.cos.ap-guangzhou.myqcloud.com/Zabbix_1/10.png)  
登录成功。  
![](https://vimc-1255664370.cos.ap-guangzhou.myqcloud.com/Zabbix_1/11.png)  
设置中文  
![](https://vimc-1255664370.cos.ap-guangzhou.myqcloud.com/Zabbix_1/12.png)  
启用监控本机  
![](https://vimc-1255664370.cos.ap-guangzhou.myqcloud.com/Zabbix_1/13.png)  
刷新页面看到`ZBX`亮了则监控成功!

  

### 2.监控远程主机

  

准备工作

  

```
tar xzvf zabbix-4.0.0.tar.gz -C /usr/local/src/
//在远端主机解压源码包
yum install -y net-snmp-devel libevent libevent-devel pcre*
//安装依赖
useradd -M -s /sbin/nologin zabbix
//添加zabbix用户
```

  

编译Agentd端

  

```
./configure --prefix=/usr/local/zabbix_agent --enable-agent

make install

cp /usr/local/zabbix_agent/etc/zabbix_agentd.conf /usr/local/zabbix_agent/etc/zabbix_agentd.conf.bak
//备份配置文件

vi /usr/local/zabbix_agent/etc/zabbix_agentd.conf

LogFile=/tmp/zabbix_agentd.log
Server=192.168.123.61
ServerActive=192.168.123.61
Hostname=xuegod50       //这里的主机名要与Web界面配置的主机名要一样
User=zabbix     //以zabbix用户权限启动

cp -r /usr/local/src/zabbix-4.0.0/misc/init.d/fedora/core5/zabbix_agentd /etc/init.d/

vi /etc/init.d/zabbix_agentd

ZABBIX_BIN="/usr/local/zabbix_agent/sbin/zabbix_agentd"
//修改zabbix_agentd路径

/etc/init.d/zabbix_agentd restart
//启动agentd
```

  

配置远端主机  
![](https://vimc-1255664370.cos.ap-guangzhou.myqcloud.com/Zabbix_1/14.png)  
配置模板-Template OS Linux-更新  
![](https://vimc-1255664370.cos.ap-guangzhou.myqcloud.com/Zabbix_1/15.png)  
这里我出错了，因为我agent端口是用Zabbix4.0的源码编译的，server端又是3.4的zabbix。

  

当如果`ZBX`可用性为红色的时候，可以用zabbix\_get来测试，使用方法如下.

  

```
/usr/local/zabbix/bin/zabbix_get -s 192.168.123.60 -p 10050 -k system.hostname
```

  

这一般是在server端执行的。

  

### 3.解决乱码问题

  

![](https://vimc-1255664370.cos.ap-guangzhou.myqcloud.com/Zabbix_1/16.png)  
从Windows的`C:\Windows\Fonts`目录找出一个中文字体，把它拷贝出来，重名名为`DejaVuSans.ttf`，上传到服务器的`/usr/local/nginx/html/fonts/`目录下，刷新页面看到可以正常显示了。  
![](https://vimc-1255664370.cos.ap-guangzhou.myqcloud.com/Zabbix_1/17.png)