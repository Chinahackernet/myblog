# 主DNS及DNS缓存服务配置

> 分类：Linux / 第13章：服务部署
> 原文：https://www.cuiliangblog.cn/detail/section/31467881
> 来源：崔亮的博客

---



 

****

# 一、实验目的
1.  掌握缓存DNS服务、主DNS服务器的搭建

# 二、实验内容
1.  搭建一台缓存DNS服务器。

2.  搭建一台主DNS服务器。

# 三、实验环境
1.  缓存DNS服务器centos6对应主机ip为10.10.64.226

2.  主DNS服务器centos7对应主机ip为10.10.64.225

3.  客户机win7对应主机ip为10.10.64.227

# 四、实验分析与设计思路
1.   网络拓扑图

![](assets/10-Linux/f91905afc9682c0674b2.png)

2.   实验思路

![](assets/10-Linux/5b5ab027e8502156743a.png)

# 五、实验准备
1.   设置环境为同一网段，连接公网，DHCP获取ip

2.   关闭所有主机防火墙

3.   测试网络连通性

# 六、实验过程
1.   安装相关软件包

![](assets/10-Linux/6dc286bc3c09a86a71b5.png)

2.   配置centos6缓存DNS主配置文件

![](assets/10-Linux/4ad1f4757163a1d07144.png)

![](assets/10-Linux/194fe02f7d9cd009c2b1.png)

3.   配置centos7主DNS主配置文件

![](assets/10-Linux/9a1a49636e711fc4dd85.png)

![](assets/10-Linux/194fe02f7d9cd009c2b1.png)

4.   配置centos7子配置文件

![](assets/10-Linux/d4533f6d62c9c30b0d92.png)

![](assets/10-Linux/d2351a9ea5853aff48d8.png)

5.   配置centos7区域配置文件

![](assets/10-Linux/eacf55c564e55dfb34af.png)

![](assets/10-Linux/8fe5a0ee537ccf176c44.png)

6.   开启服务

①   开启缓存dns服务

![](assets/10-Linux/b3f639bc9142692d645d.png) 

# 七、实验结果
1.   查看端口状态

①   查看缓存dns服务器状态

![](assets/10-Linux/be393a4dfa6e3e7e180c.png)

②    

2.   验证缓存DNS服务

①   设置win7主机dns服务器

![](assets/10-Linux/5aa79a08f626fa4ae353.png)

②   使用命令验证

![](assets/10-Linux/001ded97212ee9949e38.png)

③   设置centos7dns服务器

![](assets/10-Linux/6025c5e7f44e68902f11.png)

④  使用dig 命令

![](assets/10-Linux/ccedacfb1dc7c5b2376f.png)

⑤  使用nslookup命令

![](assets/10-Linux/1dfeb92b208f429714c7.png)

3.   验证主DNS服务

![](assets/10-Linux/e2d68654f641c5d808bd.png)

# 八、实验总结
1.   主配置文件（/etc/named.conf）

![](assets/10-Linux/edef378ee557a1b8d1ac.png)

![](assets/10-Linux/73af39fea891a842e1e2.png)

![](assets/10-Linux/fc71b56f43542793ea06.png)

## 2.   子配置文件（/etc/named.rfc1912.zones）
![](assets/10-Linux/8b384b2b4758d48c27c3.png)

## 3.   区域配置文件（/var/named/named.localhost）
![](assets/10-Linux/6ec95a3c8428ff1ea305.png)

①  TTL：缓存的默认生存周期

②  @：当前域（/etc/named.rfc1912.zones文件中定义的域）

③  IN：互联网

④  SOA：一个区域解析库的授权记录，必须要为解析库第一条记录

⑤  rname.invalid：管理员邮箱

⑥  NS：表明当前区域的DNS服务器

⑦  A记录：ipv4正向解析（FQDN ----> IP）

⑧  AAAA：ipv6正向解析（FQDN ----> IPV6）

⑨  PTR：IP ----> FQDN

⑩  CNAME：别名记录

⑪  MX：邮件交换器

## 4.   复制配置文件时用cp-p命令复制属性
![](assets/10-Linux/433ae9c0d9236f8b8834.png)

 


