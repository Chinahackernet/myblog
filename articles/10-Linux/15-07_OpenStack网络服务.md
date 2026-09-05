# OpenStack网络服务

> 分类：Linux / 第15章：OpenStack
> 原文：https://www.cuiliangblog.cn/detail/section/31515871
> 来源：崔亮的博客

---

+ 如下操作在控制节点controller进行

# 一、准备工作
1. 用数据库连接客户端以 root 用户连接到数据库服务器：

controller ~# mysql -u root -p

1. 创建``neutron`` 数据库：

MariaDB [(none)] CREATE DATABASE neutron;

1. 对``neutron`` 数据库授予恰当的访问权限，使用合适的密码替换

<font style="color:white;">MariaDB [(none)]> GRANT ALL PRIVILEGES ON neutron.* TO 'neutron'@'localhost' IDENTIFIED BY '</font><font style="color:red;">1111</font><font style="color:white;">';</font>

<font style="color:white;">MariaDB [(none)]> GRANT ALL PRIVILEGES ON neutron.* TO 'neutron'@'%' IDENTIFIED BY '</font><font style="color:red;">1111</font><font style="color:white;">';</font>

1. 获得 admin 凭证来获取只有管理员能执行命令的访问权限：

controller ~# . admin-openrc.sh

1. 创建``neutron``用户：

controller ~# openstack user create --domain default --passwordCHANGE_ME neutron

1. 添加``admin`` 角色到``neutron`` 用户：

controller ~# openstack role add --project service --user neutron admin

1. 创建``neutron``服务实体：

controller ~# openstack service create --name neutron --description "OpenStack Networking" network

1. 创建网络服务API端点：

controller ~# openstack endpoint create --region RegionOne network public [http://controller:9696](http://controller:9696)

controller ~# openstack endpoint create --region RegionOne network internal [http://controller:9696](http://controller:9696)

controller ~# openstack endpoint create --region RegionOne network admin [http://controller:9696](http://controller:9696)

# 二、配置网络选项
1. 安装组件

controller ~# yum -y install openstack-neutron openstack-neutron-ml2 openstack-neutron-linuxbridge ebtables

1. 编辑``/etc/neutron/neutron.conf`` 文件并完成如下动作：

controller ~# vim /etc/neutron/neutron.conf

+ 在 [database] 部分，配置数据库访问：

[database]

# ...

<font style="color:yellow;">connection = mysql+pymysql://neutron:</font><font style="color:red;">1111</font><font style="color:yellow;">@controller/neutron</font>

+ 在``[DEFAULT]``部分，启用Layer 2 (ML2)插件模块，路由服务和重叠的IP地址：

[DEFAULT]

# ...

core_plugin = ml2

service_plugins = router

allow_overlapping_ips = true

+ 在 “[DEFAULT]” 部分，配置 “RabbitMQ” 消息队列访问     

[DEFAULT]

# ...

<font style="color:yellow;">transport_url = rabbit://openstack:</font><font style="color:red;">1111</font><font style="color:yellow;">@controller</font>

+ 在 “[DEFAULT]” 和 “[keystone_authtoken]” 部分，配置认证服务访问：

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

username = neutron

<font style="color:yellow;">password =</font><font style="color:red;">1111</font>

+ 在 [keystone_authtoken]      中注释或者删除其他选项。
+ 在``[DEFAULT]``和``[nova]``部分，配置网络以能够反映计算网络拓扑变化

[DEFAULT]

# ...

notify_nova_on_port_status_changes = true

notify_nova_on_port_data_changes = true

 

[nova]

# ...

auth_url = [http://controller:35357](http://controller:35357)

auth_type = password

project_domain_name = default

user_domain_name = default

region_name = RegionOne

project_name = service

username = nova

<font style="color:yellow;">password =</font><font style="color:red;">1111</font>

+ 在 [oslo_concurrency]      部分，配置锁路径：

[oslo_concurrency]

# ...

lock_path = /var/lib/neutron/tmp

1. ML2插件使用Linux桥接机制为实例创建layer-2 （桥接/交换）虚拟网络基础设施。

编辑``/etc/neutron/plugins/ml2/ml2_conf.ini``文件并完成下面的操作：

controller ~# vim /etc/neutron/plugins/ml2/ml2_conf.ini

+ 在``[ml2]`` 部分，启用flat，VLAN和VXLAN网络：

[ml2]

# ...

type_drivers = flat,vlan,vxlan

+ 在``[ml2]`` 部分，启用VXLAN项目（私有）网络：

[ml2]

# ...

tenant_network_types = vxlan

+ 在``[ml2]`` 部分，启用Linux 桥接和layer-2 population      mechanisms：

[ml2]

# ...

mechanism_drivers = linuxbridge,l2population

+ 在``[ml2]`` 部分，启用端口安全扩展驱动：

[ml2]

# ...

extension_drivers = port_security

+ 在``[ml2_type_flat]``部分，配置公共flat提供网络：

[ml2_type_flat]

# ...

flat_networks = provider

+ 在``[ml2_type_vxlan]``      部分，配置VXLAN网络标识范围与私有网络不同：

[ml2_type_vxlan]

# ...

vni_ranges = 1:1000

+ 在 ``[securitygroup]``部分，启用 ipset 增加安全组的方便性：

[securitygroup]

# ...

enable_ipset = true

1. Linux桥接代理为实例创建包括私有网络的VXLAN隧道和处理安全组的layer-2（桥接/交换）虚拟网络设施。

编辑``/etc/neutron/plugins/ml2/linuxbridge_agent.ini``文件并完成下面的操作

controller ~# vim /etc/neutron/plugins/ml2/linuxbridge_agent.ini

+ 在``[linux_bridge]`` 部分，映射公共虚拟网络到公共物理网络接口

[linux_bridge]

<font style="color:yellow;">physical_interface_mappings = provider:</font><font style="color:red;">ens33</font>

+ 在``[vxlan]``部分，启用VXLAN覆盖网络，配置处理覆盖网络和启用layer-2 的物理网络接口的IP地址。

[vxlan]

enable_vxlan = true

<font style="color:yellow;">local_ip =</font><font style="color:red;">10.10.64.164</font>

l2_population = true

+ 在 ``[securitygroup]``部分，启用安全组并配置 Linux 桥接 iptables 防火墙驱动：

[securitygroup]

# ...

enable_security_group = true

firewall_driver = neutron.agent.linux.iptables_firewall.IptablesFirewallDriver

1. 配置layer-3代理

编辑/etc/neutron/l3_agent.ini 文件并完成下面操作

vim /etc/neutron/l3_agent.ini

+ 在``[DEFAULT]``部分，配置Linux桥接网络驱动和外部网络桥接：

[DEFAULT]

# ...

interface_driver = linuxbridge

1. 配置DHCP代理

编辑``/etc/neutron/dhcp_agent.ini``文件并完成下面的操作：

vim /etc/neutron/dhcp_agent.ini

+ 在``[DEFAULT]``部分，配置Linux桥接网卡驱动，Dnsmasq DHCP驱动并启用隔离元数据，这样在公共网络上的实例就可以通过网络访问元数据：

[DEFAULT]

# ...

interface_driver = linuxbridge

dhcp_driver = neutron.agent.linux.dhcp.Dnsmasq

enable_isolated_metadata = true

# 三、配置元数据代理
1. 编辑``/etc/neutron/metadata_agent.ini``文件并完成下面的操作：

controller ~# vim /etc/neutron/metadata_agent.ini

+ 在``[DEFAULT]``部分，配置访问参数：

[DEFAULT]

# ...

nova_metadata_ip = controller

<font style="color:yellow;">metadata_proxy_shared_secret = </font><font style="color:red;">1111</font>

# 四、配置计算使用网络
1. 编辑``/etc/nova/nova.conf``文件并完成下面操作：

controller ~# vim /etc/nova/nova.conf

+ 在``[neutron]``部分，配置访问参数，启用元数据代理和配置secret：

[neutron]

# ...

url = [http://controller:9696](http://controller:9696)

auth_url = [http://controller:35357](http://controller:35357)

auth_type = password

project_domain_name = default

user_domain_name = default

region_name = RegionOne

project_name = service

username = neutron

<font style="color:yellow;">password =</font><font style="color:red;">1111</font>

service_metadata_proxy = true

<font style="color:yellow;">metadata_proxy_shared_secret = </font><font style="color:red;">1111</font>

# 五、完成安装
1. 网络服务初始化脚本需要一个超链接 /etc/neutron/plugin.ini``指向ML2插件配置文件/etc/neutron/plugins/ml2/ml2_conf.ini``。如果超链接不存在，使用下面的命令创建它：

controller ~# ln -s /etc/neutron/plugins/ml2/ml2_conf.ini /etc/neutron/plugin.ini

1. 同步数据库：

controller ~# su -s /bin/sh -c "neutron-db-manage --config-file /etc/neutron/neutron.conf --config-file /etc/neutron/plugins/ml2/ml2_conf.ini upgrade head" neutron

1. 重启计算API 服务：

controller ~# systemctl restart openstack-nova-api.service

1. 启动网络服务并配置他们开机自启动。

controller ~# systemctl enable neutron-server.service neutron-linuxbridge-agent.service neutron-dhcp-agent.service neutron-metadata-agent.service

controller ~# systemctl start neutron-server.service neutron-linuxbridge-agent.service neutron-dhcp-agent.service neutron-metadata-agent.service

1. 对网络选项2，同样也启用并启动layer-3服务：

controller ~# systemctl enable neutron-l3-agent.service

controller ~# systemctl start neutron-l3-agent.service

+ 如下操作在计算节点compute进行

# 六、安装组件
1. 安装组件

compute ~# yum -y install openstack-neutron-linuxbridge ebtables ipset

# 七、配置通用组件
1. 编辑``/etc/neutron/neutron.conf``      文件并完成如下动作：

compute ~# vim /etc/neutron/neutron.conf

+ 在``[database]``      部分，注释所有``connection`` 项，因为计算节点不直接访问数据库。
+ 在 “[DEFAULT]” 和      “[oslo_messaging_rabbit]”部分，配置 “RabbitMQ” 消息队列访问：

[DEFAULT]

# ...

<font style="color:yellow;">transport_url = rabbit://openstack:</font><font style="color:red;">1111</font><font style="color:yellow;">@controller</font>

+ 在 “[DEFAULT]” 和      “[keystone_authtoken]” 部分，配置认证服务访问：

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

username = neutron

<font style="color:yellow;">password =</font><font style="color:red;">1111</font>

+ 在 [oslo_concurrency]      部分，配置锁路径：

[oslo_concurrency]

# ...

lock_path = /var/lib/neutron/tmp

# 八、配置网络选项
Linux桥接代理为实例创建包括私有网络的VXLAN隧道和处理安全组的layer-2（桥接/交换）虚拟网络设施。

compute ~# vim /etc/neutron/plugins/ml2/linuxbridge_agent.ini

1. 编辑``/etc/neutron/plugins/ml2/linuxbridge_agent.ini``文件并完成下面的操作：

compute ~# vim /etc/neutron/plugins/ml2/linuxbridge_agent.ini

+ 在``[linux_bridge]``      部分，映射公共虚拟网络到公共物理网络接口：

[linux_bridge]

<font style="color:yellow;">physical_interface_mappings = provider:</font><font style="color:red;">ens33</font>

+ 在``[vxlan]``部分，启用VXLAN覆盖网络，配置处理覆盖网络和启用layer-2      的物理网络接口的IP地址。

[vxlan]

enable_vxlan = true

<font style="color:yellow;">local_ip =</font><font style="color:red;"> 10.10.64.180</font>

l2_population = true

+ 在 ``[securitygroup]``部分，启用安全组并配置      Linux 桥接 iptables 防火墙驱动：

[securitygroup]

# ...

enable_security_group = true

firewall_driver = neutron.agent.linux.iptables_firewall.IptablesFirewallDriver

# 九、配置计算使用网络
1. 编辑``/etc/nova/nova.conf``文件并完成下面的操作：

compute ~# vim /etc/nova/nova.conf

在``[neutron]`` 部分，配置访问参数：

[neutron]

# ...

url = [http://controller:9696](http://controller:9696)

auth_url = [http://controller:35357](http://controller:35357)

auth_type = password

project_domain_name = default

user_domain_name = default

region_name = RegionOne

project_name = service

username = neutron

<font style="color:yellow;">password =</font><font style="color:red;">1111</font>

# 十、完成安装
1. 重启计算服务：

compute ~# systemctl restart openstack-nova-compute.service

1. 启动Linux桥接代理并配置它开机自启动：

compute ~# systemctl enable neutron-linuxbridge-agent.service

compute ~# systemctl start neutron-linuxbridge-agent.service

+ 启动服务报错

![](assets/10-Linux/0d23c2607cf723902fc1.png)

![](assets/10-Linux/9c5fecb40e3a0501c1b5.png)

解决办法：

compute ~# setenforce 0

compute ~# vim /etc/selinux/config 

将SELINUX=enforcing改为SELINUX=disabled

# 十一、验证操作
+ 如下操作在控制节点controller进行
1. 获得 admin      凭证来获取只有管理员能执行命令的访问权限：

controller ~# . admin-openrc

1. 列出加载的扩展，对``neutron-server``进程是否启动正常进行验证：

controller ~# openstack extension list --network

1. 列出代理以验证启动 neutron 代理是否成功：

controller ~# openstack network agent list

# 十二、ovs网络配置
+ [https://blog.csdn.net/wylfengyujiancheng/article/details/70129720](https://blog.csdn.net/wylfengyujiancheng/article/details/70129720)

 


