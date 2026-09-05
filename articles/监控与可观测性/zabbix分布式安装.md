# 项目规划

<table class="lake-table" style="width: 720px;"><colgroup><col span="1" width="240" /><col span="1" width="240" /><col span="1" width="240" /></colgroup><tbody><tr style="height: 33px;"><td><p>软件</p></td><td><p>版本</p></td><td><p>IP</p></td></tr><tr style="height: 33px;"><td><p>zabbix-server</p></td><td><p>3.4.15</p></td><td><p>10.1.10.128</p></td></tr><tr style="height: 33px;"><td><p>zabbix-proxy</p></td><td><p>3.4.15</p></td><td><p>10.1.10.129</p></td></tr><tr style="height: 33px;"><td colspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><p>zabbix-agent</p></td><td colspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><p>3.4.15</p></td><td colspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><p>10.1.10.130</p></td></tr><tr style="height: 33px;"><td colspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><p>centos</p></td><td colspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><p>7.6</p></td><td colspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><p><br /></p></td></tr><tr style="height: 33px;"><td colspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><p>mysql</p></td><td colspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><p>5.6.47</p></td><td colspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><p>10.1.10.128/129</p></td></tr></tbody></table>

  

# 系统初始化

关闭防火墙

```python
systemctl stop firewalld
systemctl disable firewalld
```

  

关闭SeLinux

```python
setenforce 0
sed -i 's/SELINUX=enforcing/SELINUX=disabled/g' /etc/sysconfig/selinux
```

  

# zabbix-server

安装yum源

```python
rpm -ivh https://mirrors.aliyun.com/zabbix/zabbix/3.4/rhel/7/x86_64/zabbix-release-3.4-1.el7.centos.noarch.rpm
```

  

安装软件

```python
yum install zabbix-server-mysql zabbix-web-mysql zabbix-agent -y
```

  

安装数据库

```python
wget http://repo.mysql.com/mysql-community-release-el7-5.noarch.rpm
rpm -ivh mysql-community-release-el7-5.noarch.rpm
yum repolist enabled | grep"mysql.*-community.*"
yum install -y mysql-community-server
```

  

启动数据库

```python
systemctl enable mysqld && systemctl start mysqld
```

  

创建数据库

```python
mysql -uroot -p
create database zabbix character set utf8 collate utf8_bin;
grant all privileges on zabbix.* to zabbix@localhost identified by 'zabbix';
flush privileges;
```

  

导入初始表

```python
cd /usr/share/doc/zabbix-server-mysql-3.4.15/
zcat create.sql.gz | mysql -uzabbix -p zabbix
```

  

配置zabbix-server配置文件（/etc/zabbix/zabbix-server.conf）

```python
DBHost=localhost
DBName=zabbix
DBUser=zabbix
DBPassword=zabbix
```

  

启动zabbix-server

```python
systemctl start zabbix-server && systemctl enable zabbix-server
```

  

配置http服务（/etc/httpd/conf.d/zabbix.conf ）

```python
php_value max_execution_time 300
php_value memory_limit 128M
php_value post_max_size 16M
php_value upload_max_filesize 2M
php_value max_input_time 300
php_value always_populate_raw_post_data -1
php_value date.timezone Asia/Shanghai
```

  

启动httpd

```python
 systemctl enable httpd && systemctl start httpd
```

  

在浏览器访问http://10.1.10.128/zabbix 配置

![image.png](assets/监控与可观测性/zabbix分布式安装/zabbix分布式安装-1.png)

![image.png](assets/监控与可观测性/zabbix分布式安装/zabbix分布式安装-2.png)

![image.png](assets/监控与可观测性/zabbix分布式安装/zabbix分布式安装-3.png)

![image.png](assets/监控与可观测性/zabbix分布式安装/zabbix分布式安装-4.png)

点击下一步直到登录，默认登录用户和密码（Admin/zabbix）

![image.png](assets/监控与可观测性/zabbix分布式安装/zabbix分布式安装-5.png)

![image.png](assets/监控与可观测性/zabbix分布式安装/zabbix分布式安装-6.png)

  

修正图形乱码

在windows上找相应得图片，上传到服务器上/usr/share/zabbix/fonts/，将其改名为graphfont.ttf

  

# zabbix-proxy

配置yum源

```python
rpm -ivh https://mirrors.aliyun.com/zabbix/zabbix/3.4/rhel/7/x86_64/zabbix-release-3.4-1.el7.centos.noarch.rpm
```

  

安装软件

```python
yum install zabbix-proxy zabbix-agent -y
```

  

因为zabbix-proxy会收集agent得数据，所以也需要安装数据库

```python
wget http://repo.mysql.com/mysql-community-release-el7-5.noarch.rpm
rpm -ivh mysql-community-release-el7-5.noarch.rpm
yum repolist enabled | grep"mysql.*-community.*"
yum install -y mysql-community-server
```

  

启动mysql

```python
systemctl enable mysqld && systemctl start mysqld
```

  

创建数据库和用户

```python
create database zbx_proxy character set utf8 collate utf8_bin;
grant all privileges on zbx_proxy.* to zbx_proxy@localhost identified by 'zbx_proxy';
flush privileges;
```

  

导入zabbix-proxy库

```python
cd /usr/share/doc/zabbix-proxy-mysql-3.4.15/
zcat schema.sql.gz | mysql -uzbx_proxy -p zbx_proxy
```

  

修改zabbix-proxy配置文件（/etc/zabbix/zabbix\_proxy.conf）

> 注意：配置的时候将后面的配置去掉

```python
ProxyMode=0
Server=10.1.10.128		# server服务器地址
HostnameItem=system.hostname
LogFile=/var/log/zabbix/zabbix_proxy.log
LogFileSize=0
PidFile=/var/run/zabbix/zabbix_proxy.pid
SocketDir=/var/run/zabbix
DBHost=localhost		# zabbix-proxy 数据库配置
DBName=zbx_proxy
DBUser=zbx_proxy
DBPassword=zbx_proxy
ProxyLocalBuffer=3      # 数据同步到server，数据还会保存多久，单位小时
ProxyOfflineBuffer=24	# 未提交的数据保存多长时间
HeartbeatFrequency=60	# 心跳间隔检测时间， ， 默认60秒， 范围0-3600秒， 被动模式不使用
ConfigFrequency=5		# 间隔多久从zabbix server 获取监控信息
DataSenderFrequency=5	# 数据发送时间间隔， 默认为1秒， 范围为1-3600秒， 被动模式不使用
StartPollers=10			# 启动的线程数， 与客户端的数据保持一致
SNMPTrapperFile=/var/log/snmptrap/snmptrap.log
Timeout=4
ExternalScripts=/usr/lib/zabbix/externalscripts
LogSlowQueries=3000
```

  

启动zabbix-proxy

```python
systemctl start zabbix-proxy && systemctl enable zabbix-proxy
```

  

配置web端，创建代理

![image.png](assets/监控与可观测性/zabbix分布式安装/zabbix分布式安装-7.png)

![image.png](assets/监控与可观测性/zabbix分布式安装/zabbix分布式安装-8.png)

注意代理名称与我们配置文件配置的Hostname一致。

  

# zabbix-agent

安装YUM源

```python
rpm -ivh https://mirrors.aliyun.com/zabbix/zabbix/3.4/rhel/7/x86_64/zabbix-release-3.4-1.el7.centos.noarch.rpm
```

  

安装软件

```python
yum install zabbix-agent -y
```

  

修改客户端配置文件（/etc/zabbix/zabbix\_agentd.conf）

> 注意：配置的时候将后面的配置去掉

```python
PidFile=/var/run/zabbix/zabbix_agentd.pid
LogFile=/var/log/zabbix/zabbix_agentd.log
LogFileSize=0
Server=10.1.10.129			# zabbix-proxy地址
ServerActive=10.1.10.129	# zabbix-proxy地址
Hostname=10.1.10.130
Include=/etc/zabbix/zabbix_agentd.d/*.conf
UnsafeUserParameters=1
```

  

启动zabbix-agent

```python
systemctl enable zabbix-agent && systemctl start zabbix-agent
```

  

# 监控客户端

## 手动添加主机

![image.png](assets/监控与可观测性/zabbix分布式安装/zabbix分布式安装-9.png)

![image.png](assets/监控与可观测性/zabbix分布式安装/zabbix分布式安装-10.png)

![image.png](assets/监控与可观测性/zabbix分布式安装/zabbix分布式安装-11.png)

![image.png](assets/监控与可观测性/zabbix分布式安装/zabbix分布式安装-12.png)

  

然后查看最新数据。有时候会没有获取到数据，这个是因为proxy启动了，但是zabbix 的server端没有创建代理，解决方法重启一下zabbix proxy就可以了。

然后就可以看到最新数据了。

![image.png](assets/监控与可观测性/zabbix分布式安装/zabbix分布式安装-13.png)

  

## 自动发现

机器太多，手动配置太过繁琐，这时候就可以配置自动发现规则。

自动发现是由服务端发起。

  

1、配置自发现规则

![image.png](assets/监控与可观测性/zabbix分布式安装/zabbix分布式安装-14.png)

![image.png](assets/监控与可观测性/zabbix分布式安装/zabbix分布式安装-15.png)

> 备注：如果是通过代理去发现，就在上面代理程序配置代理

  

2、创建自动发现动作

![image.png](assets/监控与可观测性/zabbix分布式安装/zabbix分布式安装-16.png)

![image.png](assets/监控与可观测性/zabbix分布式安装/zabbix分布式安装-17.png)

![image.png](assets/监控与可观测性/zabbix分布式安装/zabbix分布式安装-18.png)

我们可以看到已有主机被自动发现，如下：

![image.png](assets/监控与可观测性/zabbix分布式安装/zabbix分布式安装-19.png)

  

## 自动注册

自动注册是由客户端发起，需要客户端配置好agent。

![image.png](assets/监控与可观测性/zabbix分布式安装/zabbix分布式安装-20.png)

![image.png](assets/监控与可观测性/zabbix分布式安装/zabbix分布式安装-21.png)

![image.png](assets/监控与可观测性/zabbix分布式安装/zabbix分布式安装-22.png)

  

有agent的就会自动注册上。

![image.png](assets/监控与可观测性/zabbix分布式安装/zabbix分布式安装-23.png)

## 自动下线

![image.png](assets/监控与可观测性/zabbix分布式安装/zabbix分布式安装-24.png)

![image.png](assets/监控与可观测性/zabbix分布式安装/zabbix分布式安装-25.png)