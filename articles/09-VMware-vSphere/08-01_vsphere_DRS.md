# vsphere DRS

> 分类：VMware Vsphere / 第8章：DRS
> 原文：https://www.cuiliangblog.cn/detail/section/31516637
> 来源：崔亮的博客

---

# 一、理论知识
1. DRS启用条件

![](assets/09-VMware-vSphere/a6f766dad50d2030fcce.png)

1. 虚拟机关联性

![](assets/09-VMware-vSphere/f9e64e4e978183d0748f.png)

1. HA与DRS关系

![](assets/09-VMware-vSphere/ed40c447c36be78c20cd.png)

# 二、开启DRS
1. 集群——设置

![](assets/09-VMware-vSphere/efccc73986737688b648.png)

1. DRS——编辑

![](assets/09-VMware-vSphere/f74800628ce8ad09385c.png)

1. 打开DRS

![](assets/09-VMware-vSphere/b27767c48f02bc478b64.png)

# 三、配置DRS规则
1. 配置——虚拟机/主机规则

![](assets/09-VMware-vSphere/b57796881dae35b843b8.png)

+ 聚集，多个虚拟机绑定在一起，始终在一个主机运行
+ 分开，与聚集相反
+ 虚拟机到主机，虚拟机与主机进行绑定

![](assets/09-VMware-vSphere/9d6cae2d36828179e8d8.png)

1. 优先级配置

![](assets/09-VMware-vSphere/b21b97e7278797f8cf3a.png)

+ 必须在组中的主机运行：DRS>HA
+ 应在组中的主机运行：HA>DRS


