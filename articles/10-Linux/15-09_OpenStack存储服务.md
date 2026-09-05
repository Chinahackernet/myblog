# OpenStack存储服务

> 分类：Linux / 第15章：OpenStack
> 原文：https://www.cuiliangblog.cn/detail/section/31515849
> 来源：崔亮的博客

---

# 一、准备工作
+ 如下操作在控制节点controller进行
1. 用数据库连接客户端以 root 用户连接到数据库服务器：

controller ~# mysql -u root -p

1. 创建 cinder 数据库：

MariaDB [(none)]> CREATE DATABASE cinder;

1. 允许 cinder 数据库合适的访问权限：

MariaDB [(none)]> GRANT ALL PRIVILEGES ON cinder.* TO 'cinder'@'localhost' IDENTIFIED BY 'CHANGE_ME';

MariaDB [(none)]> GRANT ALL PRIVILEGES ON cinder.* TO 'cinder'@'%' IDENTIFIED BY 'CHANGE_ME';

1. 获得 admin 凭证来获取只有管理员能执行的命令的访问权限：

controller ~# . admin-openrc

1. 创建一个 cinder 用户：

controller ~# openstack user create --domain default --passwordCHANGE_ME cinder

1. 添加 admin 角色到 cinder 用户上。

controller ~# openstack role add --project service --user cinder admin

1. 创建cinderv2和cinderv3服务实体

controller ~# openstack service create --name cinderv2 --description "OpenStack Block Storage" volumev2

controller ~# openstack service create --name cinderv3 --description "OpenStack Block Storage" volumev3

1. 创建块设备存储服务的 API 入口点：

controller ~# openstack endpoint create --region RegionOne volumev2 public [http://controller:8776/v2/%\(project_id\)s](http://controller:8776/v2/%25/(project_id/)s)

controller ~# openstack endpoint create --region RegionOne volumev2 internal [http://controller:8776/v2/%\(project_id\)s](http://controller:8776/v2/%25/(project_id/)s)

controller ~# openstack endpoint create --region RegionOne volumev2 admin [http://controller:8776/v2/%\(project_id\)s](http://controller:8776/v2/%25/(project_id/)s)

controller ~# openstack endpoint create --region RegionOne volumev3 public [http://controller:8776/v3/%\(project_id\)s](http://controller:8776/v3/%25/(project_id/)s)

controller ~# openstack endpoint create --region RegionOne volumev3 internal [http://controller:8776/v3/%\(project_id\)s](http://controller:8776/v3/%25/(project_id/)s)

controller ~# openstack endpoint create --region RegionOne volumev3 admin [http://controller:8776/v3/%\(project_id\)s](http://controller:8776/v3/%25/(project_id/)s)

# 二、安装并配置组件
1. 安装软件包：

controller ~# yum -y install openstack-cinder

1. 编辑 /etc/cinder/cinder.conf，同时完成如下动作：

controller ~#vim  /etc/cinder/cinder.conf

+ 在 [database] 部分，配置数据库访问：

[database]

# ...

<font style="color:yellow;">connection = mysql+pymysql://cinder:</font><font style="color:red;">1111</font><font style="color:yellow;">@controller/cinder</font>

+ 在``[DEFAULT]``部分，配置``RabbitMQ``消息队列访问权限：

[DEFAULT]

# ...

<font style="color:yellow;">transport_url = rabbit://openstack:</font><font style="color:red;">1111</font><font style="color:yellow;">@controller</font>

+ 在 “[DEFAULT]” 和     “[keystone_authtoken]” 部分，配置认证服务访问：

[DEFAULT]

# ...

auth_strategy = keystone

 

[keystone_authtoken]

# ...

auth_uri = [http://controller:5000](http://controller:5000)

auth_url = [http://controller:35357](http://controller:35357)

memcached_servers = controller:11211

auth_type = password

project_domain_name = default

user_domain_name = default

project_name = service

username = cinder

<font style="color:yellow;">password =</font><font style="color:red;">1111</font>

+ 在 [DEFAULT 部分，配置``my_ip`` 来使用控制节点的管理接口的IP 地址。

[DEFAULT]

# ...

<font style="color:yellow;">my_ip = </font><font style="color:red;">192.168.10.10</font>

+ 在 [oslo_concurrency]      部分，配置锁路径：

[oslo_concurrency]

# ...

lock_path = /var/lib/cinder/tmp

1. 初始化块设备服务的数据库：

controller ~# su -s /bin/sh -c "cinder-manage db sync" cinder

+ 忽略输出中任何不推荐使用的信息。
1. 配置计算节点以使用块设备存储

编辑文件/etc/nova/nova.conf 并添加如下到其中：

controller ~# vim /etc/nova/nova.conf

[cinder]

os_region_name = RegionOne

1. 重启计算API 服务：

controller ~# systemctl restart openstack-nova-api.service

1. 启动块设备存储服务，并将其配置为开机自启：

controller ~# systemctl enable openstack-cinder-api.service openstack-cinder-scheduler.service

controller ~# systemctl start openstack-cinder-api.service openstack-cinder-scheduler.service

# 三、安装并配置一个存储节点
+ 如下操作在计算节点compute进行
1. 虚拟机添加准备好一块存储设备。

compute ~# lsblk

1. 安装 LVM 包：

compute ~# yum -y install lvm2

1. 启动LVM的metadata服务并且设置该服务随系统启动：

compute ~# systemctl enable lvm2-lvmetad.service

compute ~# systemctl start lvm2-lvmetad.service

1. 创建LVM 物理卷 /dev/sdb：

compute ~# pvcreate /dev/sdb

1. 创建 LVM 卷组 cinder-volumes：

compute ~# vgcreate cinder-volumes /dev/sdb

# 四、安装并配置组件
1. 安装软件包：

compute ~# yum -y install openstack-cinder targetcli python-keystone

1. 编辑 /etc/cinder/cinder.conf，同时完成如下动作：

compute ~# vim  /etc/cinder/cinder.conf

+ 在 [database] 部分，配置数据库访问：

[database]

# ...

<font style="color:yellow;">connection = mysql+pymysql://cinder:</font><font style="color:red;">1111</font><font style="color:yellow;">@controller/cinder</font>

+ 在``[DEFAULT]``部分，配置``RabbitMQ``消息队列访问权限：

[DEFAULT]

# ...

<font style="color:yellow;">transport_url = rabbit://openstack:</font><font style="color:red;">1111</font><font style="color:yellow;">@controller</font>

+ 在 “[DEFAULT]” 和     “[keystone_authtoken]” 部分，配置认证服务访问：

[DEFAULT]

# ...

auth_strategy = keystone

 

[keystone_authtoken]

# ...

auth_uri = [http://controller:5000](http://controller:5000)

auth_url = [http://controller:35357](http://controller:35357)

memcached_servers = controller:11211

auth_type = password

project_domain_name = default

user_domain_name = default

project_name = service

username = cinder

<font style="color:yellow;">password =</font><font style="color:red;">1111</font>

+ 在 [DEFAULT] 部分，配置 my_ip 选项：

[DEFAULT]

# ...

<font style="color:yellow;">my_ip = </font><font style="color:red;">192.168.10.20</font>

+ 在末行创建``[lvm]``部分中，配置LVM后端，包括LVM驱动，``cinder-volumes``卷组 ，iSCSI 协议和适当的 iSCSI服务。

[lvm]

volume_driver = cinder.volume.drivers.lvm.LVMVolumeDriver

volume_group = cinder-volumes

iscsi_protocol = iscsi

iscsi_helper = lioadm

+ 在 [DEFAULT] 部分，启用 LVM 后端：

[DEFAULT]

# ...

enabled_backends = lvm

+ 在 [DEFAULT] 区域，配置镜像服务 API 的位置：

[DEFAULT]

# ...

glance_api_servers = [http://controller:9292](http://controller:9292)

+ 在 [oslo_concurrency]      部分，配置锁路径：

[oslo_concurrency]

# ...

lock_path = /var/lib/cinder/tmp

1. 启动块存储卷服务及其依赖的服务，并将其配置为随系统启动：

compute ~# systemctl enable openstack-cinder-volume.service target.service

compute ~# systemctl start openstack-cinder-volume.service target.service

# 五、验证操作
+ 如下操作在控制节点controller进行
1. 获得 admin 凭证来获取只有管理员能执行的命令的访问权限：

controller ~# . admin-openrc

1. 列出服务组件以验证是否每个进程都成功启动：

controller ~# openstack volume service list


