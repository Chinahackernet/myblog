# OpenStack认证服务

> 分类：Linux / 第15章：OpenStack
> 原文：https://www.cuiliangblog.cn/detail/section/31515900
> 来源：崔亮的博客

---

# 一、准备工作
1. root用户连接数据库

controller ~# mysql -u root -p

1. 创建keystone数据库

MariaDB [(none)]> CREATE DATABASE keystone;

1. 对keystone数据库授权

<font style="color:white;">MariaDB [(none)]> GRANT ALL PRIVILEGES ON keystone.* TO 'keystone'@'localhost' IDENTIFIED BY '</font><font style="color:red;">1111</font><font style="color:white;">';</font>

<font style="color:white;">MariaDB [(none)]> GRANT ALL PRIVILEGES ON keystone.* TO 'keystone'@'%' IDENTIFIED BY '</font><font style="color:red;">1111</font><font style="color:white;">';</font>

# 二、安装并配置组件
1. 安装软件包

controller ~# yum -y install openstack-keystone httpd mod_wsgi

1. 编辑/etc/keystone/keystone.conf      配置文件

controller ~# vim /etc/keystone/keystone.conf

+ 在 [database] 部分，配置数据库访问：

<font style="color:yellow;">[database]  
</font><font style="color:yellow;"># ...  
</font><font style="color:yellow;">connection = mysql+pymysql://keystone:</font><font style="color:red;">1111</font><font style="color:yellow;">@controller/keystone</font>

+ 在``[token]``部分，配置Fernet UUID令牌的提供者。<font style="color:#333333;">  
</font><font style="color:#333333;">          </font><font style="color:yellow;">[token]  
</font><font style="color:yellow;">          ...  
</font><font style="color:yellow;">          provider = fernet</font>
1. 初始化身份认证服务的数据库

controller ~# su -s /bin/sh -c "keystone-manage db_sync" keystone

1. 初始化fernet keys：

controller ~# keystone-manage fernet_setup --keystone-user keystone --keystone-group keystone

controller ~# keystone-manage credential_setup --keystone-user keystone --keystone-group keystone

1. 引导认证服务

<font style="color:white;">controller ~</font><font style="color:white;"># k</font><font style="color:white;">eystone-manage bootstrap --bootstrap-password </font><font style="color:red;">1111</font><font style="color:white;">--bootstrap-admin-url </font>[<font style="color:white;">http://controller:35357/v3/</font>](http://controller:35357/v3/)<font style="color:white;">--bootstrap-internal-url </font>[<font style="color:white;">http://controller:5000/v3/</font>](http://controller:5000/v3/)<font style="color:white;">--bootstrap-public-url </font>[<font style="color:white;">http://controller:5000/v3/</font>](http://controller:5000/v3/)<font style="color:white;">--bootstrap-region-id RegionOne</font>

# 三、配置Apache服务器
<font style="color:#333333;">编辑/etc/httpd/conf/httpd.conf文件，配置ServerName选项为控制节点：  
</font><font style="color:white;">controller ~# vim /etc/httpd/conf/httpd.conf</font>

ServerName controller

1. 给/usr/share/keystone/wsgi-keystone.conf文件创建链接

controller ~# ln -s /usr/share/keystone/wsgi-keystone.conf /etc/httpd/conf.d/

1. 启动Apache服务

controller~# systemctl enable httpd.service

controller~# systemctl start httpd.service

+ 在启动时遇到错误

![](assets/10-Linux/8632a29f09c7943ae645.png)

检查mod_wsgi是否成功安装

检查selinux是否关闭

1. 配置管理账户

controller~#  export OS_USERNAME=admin

controller~#  export OS_PASSWORD=CHANGE_ME

controller~#  export OS_PROJECT_NAME=admin

controller~#  export OS_USER_DOMAIN_NAME=Default

controller~#  export OS_PROJECT_DOMAIN_NAME=Default

controller~#  export OS_AUTH_URL=http://controller:35357/v3

controller~#  export OS_IDENTITY_API_VERSION=3

四、创建域、项目、用户和角色

1. 创建service项目，添加用户

controller ~# openstack project create --domain default --description "Service Project" service

1. 创建demo项目

controller ~# openstack project create --domain default --description "Demo Project" demo

1. 创建demo用户

controller ~# openstack user create --domain default --passwordCHANGE_ME demo

1. 创建user角色

controller ~# openstack role create user

1. 将user角色添加到demo项目和用户中

controller ~# openstack role add --project demo --user demo user

# 五、验证操作
1. 禁用认证令牌机制

controller ~# vim /etc/keystone/keystone-paste.ini

从[pipeline:public_api], [pipeline:admin_api], 和[pipeline:api_v3]选项中删除admin_token_auth

![](assets/10-Linux/9b6d742d338649ad2560.png)

1. 取消设置临时的OS_AUTH_URL和OS_PASSWORD环境变量：

controller ~# unset OS_AUTH_URL OS_PASSWORD

1. 使用admin用户，请求一个认证令牌

controller ~# openstack --os-auth-url [http://controller:35357/v3](http://controller:35357/v3) --os-project-domain-name default --os-user-domain-name default --os-project-name admin --os-username admin token issue

+ 这里遇到错误

![](assets/10-Linux/b5afeee1b1e7d01c4f93.png)

由于是Http错误，所以返回Apache HTTP 服务配置的地方，重启Apache 服务，并重新设置管理账户：

# systemctlrestart httpd.service

$ export OS_USERNAME=admin

<font style="color:yellow;">$ export OS_PASSWORD=</font><font style="color:red;">1111</font>

$ export OS_PROJECT_NAME=admin

$ export OS_USER_DOMAIN_NAME=Default

$ export OS_PROJECT_DOMAIN_NAME=Default

$ export OS_AUTH_URL=http://controller:35357/v3

$ export OS_IDENTITY_API_VERSION=3

1. 使用demo用户，请求认证令牌：

controller ~# openstack --os-auth-url [http://controller:5000/v3](http://controller:5000/v3)   --os-project-domain-name default --os-user-domain-name default    --os-project-name demo --os-username demo token issue

+ 密码为创建demo用户时的密码。

# 五、创建OpenStack客户端环境脚本
1. 创建admin-openrc脚本，添加一下内容

controller ~# vim admin-openrc.sh

<font style="color:yellow;">export OS_PROJECT_DOMAIN_NAME=Default  
</font><font style="color:yellow;">export OS_USER_DOMAIN_NAME=Default  
</font><font style="color:yellow;">export OS_PROJECT_NAME=admin  
</font><font style="color:yellow;">export OS_USERNAME=admin  
</font><font style="color:yellow;">export OS_PASSWORD=</font><font style="color:red;">1111</font><font style="color:yellow;">  
</font><font style="color:yellow;">export OS_AUTH_URL=http://controller:35357/v3  
</font><font style="color:yellow;">export OS_IDENTITY_API_VERSION=3  
</font><font style="color:yellow;">export OS_IMAGE_API_VERSION=2</font>

controller ~# . admin-openrc.sh

1. 创建demo-openrc.sh文件，并添加以下内容

controller ~# vim demo-openrc.sh

<font style="color:yellow;">export OS_PROJECT_DOMAIN_NAME=Default  
</font><font style="color:yellow;">export OS_USER_DOMAIN_NAME=Default  
</font><font style="color:yellow;">export OS_PROJECT_NAME=demo  
</font><font style="color:yellow;">export OS_USERNAME=demo  
</font><font style="color:yellow;">export OS_PASSWORD=</font><font style="color:red;">1111</font><font style="color:yellow;">  
</font><font style="color:yellow;">export OS_AUTH_URL=http://controller:5000/v3  
</font><font style="color:yellow;">export OS_IDENTITY_API_VERSION=3  
</font><font style="color:yellow;">export OS_IMAGE_API_VERSION=2</font>

controller ~# . demo-openrc.sh

1. 请求一个认证令牌；

controller ~# openstack token issue


