# OpenStack镜像服务

> 分类：Linux / 第15章：OpenStack
> 原文：https://www.cuiliangblog.cn/detail/section/31515892
> 来源：崔亮的博客

---

# 一、准备工作
1. 用数据库连接客户端以 root 用户连接到数据库服务器

controller ~# mysql -u root -p

1. 创建 glance 数据库

MariaDB [(none)]> CREATE DATABASE glance;

1. 对``glance``数据库授予权限：

MariaDB [(none)]> GRANT ALL PRIVILEGES ON glance.* TO 'glance'@'localhost' IDENTIFIED BY 'CHANGE_ME';

MariaDB [(none)]> GRANT ALL PRIVILEGES ON glance.* TO 'glance'@'%' IDENTIFIED BY 'CHANGE_ME';

1. 获得 admin 凭证来获取只有管理员能执行的命令的访问权限：

controller ~# . admin-openrc.sh

1. 创建服务证书，创建 glance 用户：

controller ~# openstack user create --domain default --passwordCHANGE_ME glance

1. 添加 admin 角色到 glance 用户和 service 项目上。

controller ~# openstack role add --project service --user glance admin

1. 创建``glance``服务实体：

controller ~# openstack service create --name glance --description "OpenStack Image" image

1. 创建镜像服务的 API 端点：

controller ~# openstack endpoint create --region RegionOne image public [http://controller:9292](http://controller:9292)

controller ~# openstack endpoint create --region RegionOne image internal [http://controller:9292](http://controller:9292)

controller ~# openstack endpoint create --region RegionOne image admin [http://controller:9292](http://controller:9292)

# 二、安装并配置组件
1. 安装软件包

controller ~# yum -y install openstack-glance

1. 编辑文件 /etc/glance/glance-api.conf 并完成如下操作

controller ~# vim /etc/glance/glance-api.conf

+ 在 [database]      部分，配置数据库访问：

<font style="color:yellow;">[database]  
</font><font style="color:yellow;"># ...  
</font><font style="color:yellow;">connection = mysql+pymysql://glance:</font><font style="color:red;">1111</font><font style="color:yellow;">@controller/glance</font>

+ 在 [keystone_authtoken]      部分，配置认证服务访问：

<font style="color:yellow;">[keystone_authtoken]  
</font><font style="color:yellow;"># ...  
</font><font style="color:yellow;">auth_uri = </font>[<font style="color:yellow;">http://controller:5000</font>](http://controller:5000)<font style="color:yellow;">  
</font><font style="color:yellow;">auth_url = </font>[<font style="color:yellow;">http://controller:35357</font>](http://controller:35357)<font style="color:yellow;">  
</font><font style="color:yellow;">memcached_servers = controller:11211  
</font><font style="color:yellow;">auth_type = password  
</font><font style="color:yellow;">project_domain_name = default  
</font><font style="color:yellow;">user_domain_name = default  
</font><font style="color:yellow;">project_name = service  
</font><font style="color:yellow;">username = glance  
</font><font style="color:yellow;">password = </font><font style="color:red;">1111</font>

+ 在[paste_deploy]中设置认证方式。

[paste_deploy]  
# ...  
flavor = keystone

+ 在 [glance_store]      部分，配置本地文件系统存储和镜像文件位置：

[glance_store]  
# ...  
stores = file,http  
default_store = file  
filesystem_store_datadir = /var/lib/glance/images/

1. 编辑文件      ``/etc/glance/glance-registry.conf``并完成如下动作：

controller ~# vim /etc/glance/glance-registry.conf

+ 在 [database]      部分，配置数据库访问：

<font style="color:yellow;">[database]  
</font><font style="color:yellow;"># ...  
</font><font style="color:yellow;">connection = mysql+pymysql://glance:</font><font style="color:red;">1111</font><font style="color:yellow;">@controller/glance</font>

+ 在 [keystone_authtoken]      和 [paste_deploy] 部分，配置认证服务访问：

<font style="color:yellow;">[keystone_authtoken]  
</font><font style="color:yellow;"># ...  
</font><font style="color:yellow;">auth_uri = </font>[<font style="color:yellow;">http://controller:5000</font>](http://controller:5000)<font style="color:yellow;">  
</font><font style="color:yellow;">auth_url = </font>[<font style="color:yellow;">http://controller:35357</font>](http://controller:35357)<font style="color:yellow;">  
</font><font style="color:yellow;">memcached_servers = controller:11211  
</font><font style="color:yellow;">auth_type = password  
</font><font style="color:yellow;">project_domain_name = default  
</font><font style="color:yellow;">user_domain_name = default  
</font><font style="color:yellow;">project_name = service  
</font><font style="color:yellow;">username = glance  
</font><font style="color:yellow;">password = </font><font style="color:red;">1111</font>

 

[paste_deploy]  
# ...  
flavor = keystone

1. 写入镜像服务数据库：

controller ~# su -s /bin/sh -c "glance-manage db_sync" glance

+ 忽略此输出中的任何弃用消息。
1. 启动镜像服务、配置他们随机启动：

controller ~# systemctl enable openstack-glance-api.service openstack-glance-registry.service

controller ~# systemctl start openstack-glance-api.service openstack-glance-registry.service

# 三、操作验证
1. 获得 admin      凭证来获取只有管理员能执行的命令的访问权限

controller ~# . admin-openrc.sh

1. 下载源镜像

controller ~# wget [http://download.cirros-cloud.net/0.3.5/cirros-0.3.5-x86_64-disk.img](http://download.cirros-cloud.net/0.3.5/cirros-0.3.5-x86_64-disk.img)

1. 使用 QCOW2 磁盘格式， bare      容器格式上传镜像到镜像服务并设置公共可见，这样所有的项目都可以访问它

controller ~# openstack image create "cirros" --file cirros-0.3.5-x86_64-disk.img --disk-format qcow2 --container-format bare --public

1. 确认镜像的上传并验证属性

controller ~# openstack image list

 

 


