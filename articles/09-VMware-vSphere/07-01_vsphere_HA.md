# vsphere HA

> 分类：VMware Vsphere / 第7章：HA
> 原文：https://www.cuiliangblog.cn/detail/section/31516707
> 来源：崔亮的博客

---

# 一、概述
1. 高可用级别

![](assets/09-VMware-vSphere/5ad329f68e01e46f40e7.png)

1. esxi主机故障

![](assets/09-VMware-vSphere/8ec8ede8d5442e646a97.png)

1. 虚拟机出现故障

![](assets/09-VMware-vSphere/f9d35e37c328cf0576ca.png)

# 二、HA体系结构
1. 代理通信

![](assets/09-VMware-vSphere/0f675a97f4979e655e66.png)

1. 网络检测信号

![](assets/09-VMware-vSphere/3fbcf7c399dc1b4f0a5a.png)

1. 数据存储信号检测

![](assets/09-VMware-vSphere/69260eaca69cbf02ef15.png)

# 三、HA开启
1. 数据中心——创建集群

![](assets/09-VMware-vSphere/a7a2298ec2f8b5c12c42.png)

1. 勾选HA选项

![](assets/09-VMware-vSphere/76d3a41b82ae196710f7.png)

# 四、HA故障模拟
1. 前提条件
+ 每个主机都能访问共享存储，虚拟机安装在共享存储上
+ 每个虚拟机安装vm tools


