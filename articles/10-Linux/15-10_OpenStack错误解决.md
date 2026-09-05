# OpenStack错误解决

> 分类：Linux / 第15章：OpenStack
> 原文：https://www.cuiliangblog.cn/detail/section/31515816
> 来源：崔亮的博客

---

# 一、创建实例时提示找不到有效主机
1. 错误提示

![](assets/10-Linux/22bdef815278dbd7d088.png)

1. 查看 neutron 代理状态

![](assets/10-Linux/e0e9dec33086bd2cb497.png)

1. 重启neutron相关服务

![](assets/10-Linux/1e3901ca66d8ffb55ef3.png)

# 二、开机自动启动pxe装机
1. 错误提示

![](assets/10-Linux/8e827dc10eead1574f6d.png)

1. 编辑计算节点配置

Compute # vim /etc/nova/nova.conf

![](assets/10-Linux/530e31a07a85c1703580.png)

1. 重启服务

compute # systemctl restart libvirtd.service openstack-nova-compute.service

# 三、安装完成后界面无法打开
1. 错误提示

tail /etc/httpd/logs/error_log

![](assets/10-Linux/e1a920b1a82f5e02222e.png)

1. 在配置文件中增加如下的一句解决问题

vim /etc/httpd/conf.d/openstack-dashboard.conf

WSGIApplicationGroup %{GLOBAL}

1. 重启服务


