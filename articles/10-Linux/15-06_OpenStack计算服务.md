# OpenStack计算服务

> 分类：Linux / 第15章：OpenStack
> 原文：https://www.cuiliangblog.cn/detail/section/31515881
> 来源：崔亮的博客

---

    - 如下操作在控制节点controller进行

# 一、准备工作
    1. 用数据库连接客户端以 root 用户连接到数据库服务器
+ controller  ~# mysql -u root -p
    1. 创建 nova_api、nova、nova_cell0数据库
+ MariaDB  [(none)]> CREATE DATABASE nova_api;
+ MariaDB  [(none)]> CREATE DATABASE nova;
+ MariaDB  [(none)]> CREATE DATABASE nova_cell0;
    1. 对数据库授权
+ <font style="color:white;">MariaDB  [(none)]> GRANT ALL PRIVILEGES ON nova_api.* TO 'nova'@'localhost'  IDENTIFIED BY '</font><font style="color:red;">1111</font><font style="color:white;">';</font>
+ <font style="color:white;">MariaDB  [(none)]> GRANT ALL PRIVILEGES ON nova_api.* TO 'nova'@'%' IDENTIFIED BY '</font><font style="color:red;">1111</font><font style="color:white;">';</font>
+ <font style="color:white;">MariaDB  [(none)]> GRANT ALL PRIVILEGES ON nova.* TO 'nova'@'localhost' IDENTIFIED  BY '</font><font style="color:red;">1111</font><font style="color:white;">';</font>
+ <font style="color:white;">MariaDB  [(none)]> GRANT ALL PRIVILEGES ON nova.* TO 'nova'@'%' IDENTIFIED BY '</font><font style="color:red;">1111</font><font style="color:white;">';</font>
+ <font style="color:white;">MariaDB  [(none)]> GRANT ALL PRIVILEGES ON nova_cell0.* TO 'nova'@'localhost'  IDENTIFIED BY '</font><font style="color:red;">1111</font><font style="color:white;">';</font>
+ <font style="color:white;">MariaDB  [(none)]> GRANT ALL PRIVILEGES ON nova_cell0.* TO 'nova'@'%' IDENTIFIED BY  '</font><font style="color:red;">1111</font><font style="color:white;">';</font>
    1. 获得 admin       凭证来获取只有管理员能执行的命令的访问权限
+ controller  ~# . admin-openrc.sh
    1. 创建 nova 用户
+ controller  ~# openstack user create  --domain default --passwordCHANGE_ME nova
    1. 给 nova 用户添加 admin 角色
+ controller  ~# openstack role add  --project service --user nova admin
    1. 创建 nova 服务实体
+ controller  ~# openstack service  create --name nova --description "OpenStack Compute" compute
    1. 创建 Compute 服务 API 端点 
+ controller  ~# openstack endpoint  create --region RegionOne compute public [http://controller:8774/v2.1](http://controller:8774/v2.1)
+ controller  ~# openstack endpoint  create --region RegionOne compute internal [http://controller:8774/v2.1](http://controller:8774/v2.1)
+ controller  ~# openstack endpoint  create --region RegionOne compute admin [http://controller:8774/v2.1](http://controller:8774/v2.1)
    1. 创建placement用户
+ controller  ~# openstack user create  --domain default --passwordCHANGE_ME placement
    1. 使用admin角色将placement用户添加到服务项目
+ controller  ~# openstack role add  --project service --user placement admin
    1. 创建 placement api 服务实体
+ controller  ~# openstack service  create --name placement --description "Placement API" placement
    1. 创建 placement 服务 API 端点 
+ controller  ~# openstack endpoint  create --region RegionOne placement public [http://controller:8778](http://controller:8778)
+ controller  ~# openstack endpoint  create --region RegionOne placement internal [http://controller:8778](http://controller:8778)
+ controller  ~# openstack endpoint  create --region RegionOne placement admin [http://controller:8778](http://controller:8778)

# 二、安装并配置组件
    1. 安装软件包
+ controller  ~# yum -y install  openstack-nova-api openstack-nova-conductor openstack-nova-console  openstack-nova-novncproxy openstack-nova-scheduler  openstack-nova-placement-api
    1. 编辑/etc/nova/nova.conf文件完成下面操作
+ controller ~#  vim /etc/nova/nova.conf
    - 在[DEFAULT]部分，只启用计算和元数据API
+ [DEFAULT]
+ # ...
+ enabled_apis  = osapi_compute,metadata
    - 在[api_database]和[database]部分，配置数据库的连接
+ [api_database]
+ # ...
+ <font style="color:yellow;">connection  = mysql+pymysql://nova:</font><font style="color:red;">1111</font><font style="color:yellow;">@controller/nova_api</font>
+ [database]
+ # ...
+ <font style="color:yellow;">connection  = mysql+pymysql://nova:</font><font style="color:red;">1111</font><font style="color:yellow;">@controller/nova</font>
    - 在 [DEFAULT] 部分，配置       “RabbitMQ” 消息队列访问
+ [DEFAULT]
+ # ...
+ <font style="color:yellow;">transport_url  = rabbit://openstack:</font><font style="color:red;">1111</font><font style="color:yellow;">@controller</font>
    - 在 [api] 和       [keystone_authtoken]部分，配置认证服务访问
+ [api]
+ # ...
+ auth_strategy  = keystone
+  
+ [keystone_authtoken]
+ # ...
+ auth_uri = [http://controller:5000](http://controller:5000)
+ auth_url = [http://controller:35357](http://controller:35357)
+ memcached_servers  = controller:11211
+ auth_type =  password
+ project_domain_name  = default
+ user_domain_name  = default
+ project_name  = service
+ username =  nova
+ <font style="color:yellow;">password  = </font><font style="color:red;">1111</font>
    - 在 [DEFAULT]部分，配置my_ip来使用控制节点的管理接口的IP       地址
+ [DEFAULT]
+ # ...
+ <font style="color:yellow;">my_ip = </font><font style="color:red;">192.168.10.10</font>
    - 在 [DEFAULT] 部分，启动网络服务：
+ [DEFAULT]
+ # ...
+ use_neutron =  True
+ firewall_driver  = nova.virt.firewall.NoopFirewallDriver
    - 在``[vnc]``部分，配置VNC代理使用控制节点的管理接口IP地址       
+ [vnc]
+ enabled =  true
+ vncserver_listen  = $my_ip
+ vncserver_proxyclient_address  = $my_ip
    - 在 [glance] 区域，配置镜像服务       API 的位置
+ [glance]
+ # ...
+ api_servers =  [http://controller:9292](http://controller:9292)
    - 在 [oslo_concurrency]       部分，配置锁路径
+ [oslo_concurrency]
+ # ...
+ lock_path =  /var/lib/nova/tmp
    - 在[placement]部分，配置Placement API：
+ [placement]
+ # ...
+ os_region_name  = RegionOne
+ project_domain_name  = Default
+ project_name  = service
+ auth_type =  password
+ user_domain_name  = Default
+ auth_url = [http://controller:35357/v3](http://controller:35357/v3)
+ username =  placement
+ <font style="color:yellow;">password  = </font><font style="color:red;">1111</font>
    1. 在/etc/httpd/conf.d/00-nova-placement-api.conf配置文件中启用对Placement       API的访问
+ controller  ~# vim /etc/httpd/conf.d/00-nova-placement-api.conf
+ <Directory  /usr/bin>
+    <IfVersion >= 2.4>
+       Require all granted
+    </IfVersion>
+    <IfVersion < 2.4>
+       Order allow,deny
+       Allow from all
+    </IfVersion>
+ </Directory>
    1. 重启httpd服务
+ controller  ~# systemctl restart  httpd
    1. 填充nova-api数据库
+ controller  ~# su -s /bin/sh -c  "nova-manage api_db sync" nova
    1. 填充cell0数据库
+ controller  ~# su -s /bin/sh -c  "nova-manage cell_v2 map_cell0" nova
    1. 创建cell1单元格
+ controller  ~# su -s /bin/sh -c  "nova-manage cell_v2 create_cell --name=cell1 --verbose" nova
    1. 填充sync数据库
+ controller  ~# su -s /bin/sh -c  "nova-manage db sync" nova
    - 忽略输出中任何不推荐使用的信息。
    1. 验证nova cell0和cell1是否正确注册
+ controller  ~# nova-manage cell_v2  list_cells
    1. 启动 Compute       服务并将其设置为随系统启动：
+ controller  ~# systemctl enable  openstack-nova-api.service openstack-nova-consoleauth.service  openstack-nova-scheduler.service openstack-nova-conductor.service  openstack-nova-novncproxy.service
+ controller  ~# systemctl start  openstack-nova-api.service openstack-nova-consoleauth.service  openstack-nova-scheduler.service openstack-nova-conductor.service  openstack-nova-novncproxy.service
    - 在启动服务时因为消息队列导致服务无法正常启动
+ ![](assets/10-Linux/734b978cc12d61ce8798.png)
    - 删除OpenStack用户
+ controller  ~# rabbitmqctl  delete_user openstack
    - 添加OpenStack用户
+ <font style="color:white;">controller  ~#</font><font style="color:white;"> </font><font style="color:white;">rabbitmqctl add_user openstack</font><font style="color:red;"> 1111</font>
    - 对OpenStack用户授权
+ controller  ~# rabbitmqctl  set_permissions openstack ".*" ".*" ".*"
    - 重新启动 Compute 服务
+ systemctl  restart  openstack-nova-api.service openstack-nova-consoleauth.service  openstack-nova-scheduler.service openstack-nova-conductor.service  openstack-nova-novncproxy.service
    - 如下操作在计算节点compute进行

# 三、安装并配置组件
    1. 安装软件包
+ compute  ~# yum -y  install  openstack-nova-compute 
+ 编辑/etc/nova/nova.conf`文件并完成下面的操作
+ compute ~# vim  /etc/nova/nova.conf
    - 在[DEFAULT]部分，只启用计算和元数据API
+ [DEFAULT]
+ # ...
+ enabled_apis  = osapi_compute,metadata
    - 在[DEFAULT]部分，配置RabbitMQ消息对列访问
+ [DEFAULT]
+ # ...
+ <font style="color:yellow;">transport_url  = rabbit://openstack</font><font style="color:red;">:</font><font style="color:red;">1111</font><font style="color:yellow;">@controller</font>
    - 在[api]       和[keystone_authtoken]部分，配置认证服务访问
+ [api]
+ # ...
+ auth_strategy  = keystone
+  
+ [keystone_authtoken]
+ # ...
+ auth_uri = [http://controller:5000](http://controller:5000)
+ auth_url = [http://controller:35357](http://controller:35357)
+ memcached_servers  = controller:11211
+ auth_type =  password
+ project_domain_name  = default
+ user_domain_name  = default
+ project_name  = service
+ username =  nova
+ <font style="color:yellow;">password  =</font><font style="color:red;">1111</font>
    - 在 [DEFAULT] 部分，配置       my_ip 选项：
+ [DEFAULT]
+ # ...
+ <font style="color:yellow;">my_ip = </font><font style="color:red;">192.168.10.20</font>
+ 在  ``[DEFAULT]``部分，启用网络服务支持
+ [DEFAULT]
+ # ...
+ use_neutron =  True
+ firewall_driver  = nova.virt.firewall.NoopFirewallDriver
    - 在``[vnc]``部分，启用并配置远程控制台访问：
+ [vnc]
+ # ...
+ enabled =  True
+ vncserver_listen  = 0.0.0.0
+ vncserver_proxyclient_address  = $my_ip
+ novncproxy_base_url  = [http://controller:6080/vnc_auto.html](http://controller:6080/vnc_auto.html)
    - 在``[glance]``部分，配置镜像服务的位置：
+ [glance]
+ # ...
+ api_servers =  [http://controller:9292](http://controller:9292)
    - 在 [oslo_concurrency]       部分，配置锁路径：
+ [oslo_concurrency]
+ # ...
+ lock_path =  /var/lib/nova/tmp
    - 在[placement]部分，配置Placement       API：
+ [placement]
+ # ...
+ os_region_name  = RegionOne
+ project_domain_name  = Default
+ project_name  = service
+ auth_type =  password
+ user_domain_name  = Default
+ auth_url = [http://controller:35357/v3](http://controller:35357/v3)
+ username =  placement
+ <font style="color:yellow;">password  = </font><font style="color:red;">1111</font>

# 四、完成安装
    1. 确定您的计算节点是否支持虚拟机的硬件加速。
+ compute ~#  egrep -c '(vmx|svm)' /proc/cpuinfo
    - 如果这个命令返回       ``1或者更大``的值，说明您的计算节点支持硬件加速，一般不需要进行额外的配置。
    - 如果这个命令返回``0``，你的计算节点不支持硬件加速，你必须配置       libvirt 使用QEMU而不是使用KVM。
+ 在``/etc/nova/nova.conf``  文件像下面这样编辑 ``[libvirt]``部分：
+ compute  ~# vim /etc/nova/nova.conf
+ [libvirt]
+ # ...
+ virt_type =  qemu
    1. 启动计算服务及其依赖，并将其配置为随系统自动启动：
+ compute ~#  systemctl enable libvirtd.service openstack-nova-compute.service
+ compute ~#  systemctl start libvirtd.service openstack-nova-compute.service

# 五、将计算节点添加到数据库单元格
    - 如下操作在控制节点controller进行
    1. 获得 admin       凭证来获取只有管理员能执行命令的访问权限：
+ controller  ~# . admin-openrc.sh
    1. 列出数据库中所有的计算机节点
+ controller  ~# openstack hypervisor  list
    1. 添加计算节点
+ controller  ~# su -s /bin/sh -c  "nova-manage cell_v2 discover_hosts --verbose" nova

# 六、验证操作
    1. 获得 admin       凭证来获取只有管理员能执行命令的访问权限：
+ controller  ~# . admin-openrc.sh
    1. 列出服务组件，以验证是否成功启动并注册了每个进程：
+ controller  ~# openstack compute  service list
    1. 列出Identity服务中的API端点以验证与Identity服务的连接：
+ controller  ~# openstack catalog list
    1. 列出镜像服务目录的镜像，验证镜像服务的连通性:
+ controller  ~# openstack image list
    1. 检查单元格和放置API是否成功运行：
+ controller  ~# nova-status upgrade  check


