# SAMBA服务配置

> 分类：Linux / 第13章：服务部署
> 原文：https://www.cuiliangblog.cn/detail/section/31467982
> 来源：崔亮的博客

---



****

# 一、实验目的
1.  掌握跨网段SAMBA服务器中继的基本配置

# 二、实验内容
1.  内部网段1为192.168.10.0/24；内部网段2为192.168.20.0/24

2.  网段一：SAMBA服务器对应win7主机ip为192.168.10.110，

SAMBA客户机对应centos6主机ip为192.168.10.10

3.  网段二：SAMBA服务器对应centos7主机ip为192.168.20.101，

SAMBA客户机对应windowsxp主机ip为192.168.20.102

4.  进行正常的共享传输操作

# 三、实验环境与准备
1.  网段一：win7主机作为SAMBA服务器，

centos6主机作为SAMBA客户机

2.  网段二：centos7主机作为SAMBA服务器，

windowsxp主机作为SAMBA客户机

3.  一台centos6中继服务器，连通两个网段

# 四、实验分析与设计思路
1.   网络拓扑图

![](assets/10-Linux/196275346e01b7890777.png)

2.   实验思路

![](assets/10-Linux/3b98e857496d00437833.png)

# 五、实验准备
1.  设置两个不同网段

![](assets/10-Linux/5360be1e43683937fb2a.png)

2.  关闭所有主机防火墙

![](assets/10-Linux/353edd1bbc3a6a9a57c8.png)

3.  设置相关服务器IP地址

![](assets/10-Linux/0a7c69d64ed275391b58.png)

4.  指定中继器服务器地址

![](assets/10-Linux/820b081d80f44365067c.png)

5.  开启中继模式

![](assets/10-Linux/3324cf30e07768f0af8c.png)

6.  测试网段连通

①  Ping同一网段

![](assets/10-Linux/0a6943a2f1eb1e1c63bf.png)

②  Ping不同网段

![](assets/10-Linux/ca53b4c58a37398f1726.png)

# 六、实验过程及结果
1.    Linux作为客户端，windows作为服务端

①   安装文件传输系统

![](assets/10-Linux/d8f85dd59e5e83f13e06.png)

②   安装samba客户端

![](assets/10-Linux/faee66a05218099d927f.png)

③   Windows新建用户设置密码

![](assets/10-Linux/6def369054c9b4e8d8ae.png)

④   Windwos设置文件共享

![](assets/10-Linux/61aeaed2a53f261f25e0.png)

⑤   Centos6客户机探测有哪些可以共享的目录

![](assets/10-Linux/ba7accbaad88b0a1d436.png)

⑥   客户端通过命令行访问共享目录

![](assets/10-Linux/91fc93512445f6fc7dbe.png)

⑦   通过命令行上传下载文件

![](assets/10-Linux/36c925355a245fa8fac8.png)

![](assets/10-Linux/aceb9b46b1edb3d9707b.png)

⑧   挂载共享目录到当前centos7客户机

![](assets/10-Linux/e1d5e2108f353a9f3bcb.png)

![](assets/10-Linux/13f140f1e9139c00f239.png)

2.    Linux作为服务端，windows作为客户端

①    安装samba服务端

![](assets/10-Linux/e246d5b14c8cc4df4383.png)

②    创建共享用户

![](assets/10-Linux/ab17fc31bdcae219eb20.png)

③    创建共享用户密码

![](assets/10-Linux/aaac5db9cfdb98de56fb.png)

④    启动samba服务

![](assets/10-Linux/c57dc17541d101e4d8ea.png)

⑤    查看端口状态

![](assets/10-Linux/62813c1ef9015364d4f1.png)

![](assets/10-Linux/72207892959ef0498a5a.png)

⑥    Windows客户端访问共享目录

![](assets/10-Linux/3f851498b0c843d31c99.png)

⑦    添加一个共享目录

![](assets/10-Linux/4478558f5034dd47445d.png)

⑧    设置临时用户权限

![](assets/10-Linux/c83b3fd3a2dc883c77f6.png)

# 七、总结
1.  本次实验的重点在于配置文件的设置，以及用户权限的设置。


