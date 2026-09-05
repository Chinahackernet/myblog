## 一、监控概述

### 1.1 为什么要监控

在需要的时刻，提前提醒我们服务器出问题了

当出问题之后，可以找到问题的根源

网站/服务器 的可用性

#### 1.1.1 网站可用性

在软件系统的高可靠性（也称为可用性，英文描述为HA，High Available）里有个衡量其可靠性的标准——X个9，这个X是代表数字3~5。X个9表示在软件系统1年时间的使用过程中，系统可以正常使用时间与总时间（1年）之比，我们通过下面的计算来感受下X个9在不同级别的可靠性差异。

> 1个9：(1-90%)*365=36.5天，表示该软件系统在连续运行1年时间里最多可能的业务中断时间是36.5天  
> 2个9：(1-99%)*365=3.65天 ，表示该软件系统在连续运行1年时间里最多可能的业务中断时间是3.65天
> 
> 3个9：(1-99.9%)*365*24=8.76小时，表示该软件系统在连续运行1年时间里最多可能的业务中断时间是8.76小时。
> 
> 4个9：(1-99.99%)*365*24=0.876小时=52.6分钟，表示该软件系统在连续运行1年时间里最多可能的业务中断时间是52.6分钟。
> 
> 5个9：(1-99.999%)*365*24*60=5.26分钟，表示该软件系统在连续运行1年时间里最多可能的业务中断时间是5.26分钟。  
> 6个9：(1-99.9999%)*365*24*60\*60=31秒， 示该软件系统在连续运行1年时间里最多可能的业务中断时间是31秒

### 1.2 监控什么东西

监控一切需要监控的东西，只要能够想到，能够用命令实现的都能用来监控

#### 1.2.1 监控范畴

![](assets/监控与可观测性/Zabbix_使用指南/Zabbix_使用指南-1.jpeg)

#### 1.3.1 远程管理服务器

如果想远程管理服务器就有远程管理卡，比如Dell idRAC，HP ILO，IBM IMM

#### 1.3.2 监控硬件

## 二、安装Zabbix

### 2.1 环境检查

![](assets/监控与可观测性/Zabbix_使用指南/Zabbix_使用指南-2.jpeg)

#### 2.2.1 安装方式选择

-   编译安装 （服务较多，环境复杂）  
    
-   yum安装（干净环境）  
    
-   使用yum 需要镜像yum源 [http://www.cnblogs.com/clsn/p/7866643.html](http://www.cnblogs.com/clsn/p/7866643.html)  
    

#### 2.2.2 服务端快速安装脚本

  

![](assets/监控与可观测性/Zabbix_使用指南/Zabbix_使用指南-3.jpeg)

#### 2.2.3 客户端快速部署脚本

![](assets/监控与可观测性/Zabbix_使用指南/Zabbix_使用指南-4.png)

### 2.3 检测连通性

#### 2.3.1 服务端安装zabbix-get检测工具

```plain
yum install zabbix-get
```

![](assets/监控与可观测性/Zabbix_使用指南/Zabbix_使用指南-5.png)

## 三、Web界面操作

### 3.1 zabbix的web安装

#### 3.1.1 使用浏览器访问

[http://10.0.0.61/zabbix/setup.php](http://10.0.0.61/zabbix/setup.php)

![](assets/监控与可观测性/Zabbix_使用指南/Zabbix_使用指南-6.png)

在检测信息时，可查看具体的报错信息进行不同的解决

![](assets/监控与可观测性/Zabbix_使用指南/Zabbix_使用指南-7.png)

选择mysql数据库，输入密码即可

![](assets/监控与可观测性/Zabbix_使用指南/Zabbix_使用指南-8.png)

host与port不需要修改，name自定义

![](assets/监控与可观测性/Zabbix_使用指南/Zabbix_使用指南-9.png)

确认信息,正确点击下一步

![](assets/监控与可观测性/Zabbix_使用指南/Zabbix_使用指南-10.png)

安装完成、点击finsh

![](assets/监控与可观测性/Zabbix_使用指南/Zabbix_使用指南-11.png)

进入登陆界面  账号Admin密码zabbix 注意A大写

![](assets/监控与可观测性/Zabbix_使用指南/Zabbix_使用指南-12.png)

### 3.2 添加监控信息

#### 3.2.1 修改监控管理机zabbix server

配置 >> 主机

![](assets/监控与可观测性/Zabbix_使用指南/Zabbix_使用指南-13.png)

主机名称：要与主机名相同，这是zabbix server程序用的

可见名称：显示在zabbix网页上的，给我们看的

![](assets/监控与可观测性/Zabbix_使用指南/Zabbix_使用指南-14.jpeg)

修改后，要将下面的已启用要勾上

![](assets/监控与可观测性/Zabbix_使用指南/Zabbix_使用指南-15.png)

添加完成就有了管理机的监控主机

![](assets/监控与可观测性/Zabbix_使用指南/Zabbix_使用指南-16.jpeg)

#### 3.2.2 添加新的主机

配置 >> 主机 >> 创建主机

  

注意勾选以启用

  

然后添加模板，选择linux OS ，先点小添加，再点大添加。

![](assets/监控与可观测性/Zabbix_使用指南/Zabbix_使用指南-17.png)

添加完成，将会又两条监控主机信息

![](assets/监控与可观测性/Zabbix_使用指南/Zabbix_使用指南-18.jpeg)

#### 3.2.3 查看监控内容

检测中  >> 最新数据

在最新数据中需要筛选，

![](assets/监控与可观测性/Zabbix_使用指南/Zabbix_使用指南-19.jpeg)

输入ip或者名字都能够搜索出来

![](assets/监控与可观测性/Zabbix_使用指南/Zabbix_使用指南-20.png)

在下面就会列出所有的监控项

![](assets/监控与可观测性/Zabbix_使用指南/Zabbix_使用指南-21.png)

#### 3.2.4 查看图像

![](assets/监控与可观测性/Zabbix_使用指南/Zabbix_使用指南-22.jpeg)

检测中 >> 图形

选择正确的主机。选择要查看的图形即可出图

![](assets/监控与可观测性/Zabbix_使用指南/Zabbix_使用指南-23.jpeg)

## 四、自定义监控与监控报警

### 4.1 自定义监控

#### 4.1.1 说明

zabbix自带模板Template OS Linux (Template App Zabbix Agent)提供CPU、内存、磁盘、网卡等常规监控，只要新加主机关联此模板，就可自动添加这些监控项。

需求：服务器登陆人数不能超过三人，超过三人报警

#### 4.1.2 预备知识

![](assets/监控与可观测性/Zabbix_使用指南/Zabbix_使用指南-24.png)

### 4.2 实现自定义监控

#### 4.2.1 自定义语法

![](assets/监控与可观测性/Zabbix_使用指南/Zabbix_使用指南-25.png)

#### 4.2.2 agent注册

![](assets/监控与可观测性/Zabbix_使用指南/Zabbix_使用指南-26.png)

#### 4.2.3 在server端注册(web操作)

①   创建模板

配置 >> 模板 >> 创建模板

![](assets/监控与可观测性/Zabbix_使用指南/Zabbix_使用指南-27.jpeg)

点击添加，即可创建出来模板

![](assets/监控与可观测性/Zabbix_使用指南/Zabbix_使用指南-28.png)

查看创建出来的模板。

②   创建应用集

应用集类似(目录/文件夹)，其作用是给监控项分类。

点击 应用集 >> 创建应用集

![](assets/监控与可观测性/Zabbix_使用指南/Zabbix_使用指南-29.png)

自定义应用集的名称，然后点击添加

③   创建监控项

监控项 >> 创建监控项

![](assets/监控与可观测性/Zabbix_使用指南/Zabbix_使用指南-30.png)

键值 — key,即前面出创建的login-user。

![](assets/监控与可观测性/Zabbix_使用指南/Zabbix_使用指南-31.jpeg)

注意：创建监控项的时候，注意选择上应用集，即之前创建的安全。

![](assets/监控与可观测性/Zabbix_使用指南/Zabbix_使用指南-32.jpeg)

④创建触发器

触发器的作用：当监控项获取到的值达到一定条件时就触发报警

(根据需求创建)

触发器 >> 创建触发器

创建触发器，自定义名称，该名称是报警时显示的名称。

表达式，点击右边的添加，选择表达式。

严重性自定义。

![](assets/监控与可观测性/Zabbix_使用指南/Zabbix_使用指南-33.jpeg)

表达式的定义 ↓ ，选择之前创建的监控项，

最新的T值为当前获取到的值。

![](assets/监控与可观测性/Zabbix_使用指南/Zabbix_使用指南-34.png)

添加完成，能够在触发器中看到添加的情况

![](assets/监控与可观测性/Zabbix_使用指南/Zabbix_使用指南-35.png)

⑤创建图形

以图形的方式展示出来监控信息

图形 >> 创建图形

名称自定义，关联上监控项。

![](assets/监控与可观测性/Zabbix_使用指南/Zabbix_使用指南-36.jpeg)

⑥主机关联模板

配置 >> 主机

一个主机可以关联多个模板

![image.gif](assets/监控与可观测性/Zabbix_使用指南/Zabbix_使用指南-37.gif)

#### 4.2.4 查看监控的图形

![](assets/监控与可观测性/Zabbix_使用指南/Zabbix_使用指南-38.jpeg)

### 4.3 监控报警

#### 4.3.1 第三方报警平台

[http://www.onealert.com](http://www.onealert.com)

通过 OneAlert 提供的通知分派与排班策略，以及全方位的短信、微信、QQ、电话提醒服务，您可以在最合适的时间，将最重要的信息推送给最合适的人员。

#### 4.3.2 onealert配置

添加应用，注意添加的是zabbix

  

实现微信报警需要关注微信公众号即可。

  

#### 4.3.3 安装 onealert Agent

![](assets/监控与可观测性/Zabbix_使用指南/Zabbix_使用指南-39.png)

#### 4.3.1 如何删除onealert Agent

①删除报警媒介类型中的脚本

![](assets/监控与可观测性/Zabbix_使用指南/Zabbix_使用指南-40.jpeg)

②删除创建的用户

![](assets/监控与可观测性/Zabbix_使用指南/Zabbix_使用指南-41.jpeg)

③删除用户群组

![image.gif](assets/监控与可观测性/Zabbix_使用指南/Zabbix_使用指南-42.gif)

④删除创建的动作

![](assets/监控与可观测性/Zabbix_使用指南/Zabbix_使用指南-43.jpeg)

#### 4.3.2 触发器响应，发送报警信息

![](assets/监控与可观测性/Zabbix_使用指南/Zabbix_使用指南-44.jpeg)

在微信和邮件中，均能收到报警信息。

![](assets/监控与可观测性/Zabbix_使用指南/Zabbix_使用指南-45.png)

> 注意：当状态改变的时候才会发邮件
> 
> 好→坏
> 
> 坏→好

### 4.4 监控可视化

#### 4.4.1 聚合图形

最新数据 >> 图形

![image.gif](assets/监控与可观测性/Zabbix_使用指南/Zabbix_使用指南-46.gif)

自定义名称

![](assets/监控与可观测性/Zabbix_使用指南/Zabbix_使用指南-47.png)

点击聚合图形的名称，进行更改，添加要显示的图形即可。

![](assets/监控与可观测性/Zabbix_使用指南/Zabbix_使用指南-48.jpeg)

#### 4.4.2 幻灯片

添加幻灯片

监测中 >> 复合图形 >> 幻灯片演示

![](assets/监控与可观测性/Zabbix_使用指南/Zabbix_使用指南-49.png)

创建幻灯片，名称自定，选择要显示的

幻灯片根据设定的时间自动播放

### 4.5 模板的共享

#### 4.5.1 主机共享

在主机页打开，全选后点击导出

![](assets/监控与可观测性/Zabbix_使用指南/Zabbix_使用指南-50.png)

导入

![](assets/监控与可观测性/Zabbix_使用指南/Zabbix_使用指南-51.png)

#### 4.5.2 模板共享

> [https://github.com/zhangyao8/zabbix-community-repos](https://github.com/zhangyao8/zabbix-community-repos)

![](assets/监控与可观测性/Zabbix_使用指南/Zabbix_使用指南-52.png)

## 五、监控全网服务器

5.1 需求说明

实际需求：

公司已经有了100台服务器，现在需要使用zabbix全部监控起来。

### 5.2 规划方案

常规监控：cpu，内存，磁盘，网卡  问题：怎样快速添加100台机器

-   方法1：使用克隆的方式  
    
-   方法2：自动注册和自动发现  
    
-   方法3：调用zabbix api接口  curl 、python

开发自己的运维平台兼容zabbix的通道

服务监控，url监控等特殊监控：自定义监控

#### 5.2.1 api接口使用（curl）

![](assets/监控与可观测性/Zabbix_使用指南/Zabbix_使用指南-53.png)

### 5.3 具体实施规划

#### 5.3.1 硬件、系统、网络监控

所有集群节点（所有虚拟机）都监控上

交换机，路由器监控（简单方法：换成端口对应服务器网卡流量监控；标准方法：监控交换机的网卡）

snmp监控

#### 5.3.2 应用服务监控

1.  监控备份服务器，简单方法是监控rsync端口，如果有其他更佳方案可以说明；  
    方法1：监控873端口net.tcp.port[,873]  
    方法2：模拟推送拉取文件  
    
2.  监控NFS服务器，使用监控NFS进程来判断NFS服务器正常，如果有其他更佳方案可以说明；  
    方法1：端口（通过111的rpc端口获取nfs端口） net.tcp.port[,111]  
    方法2：showmount -e ip|wc -l  
    
3.  监控MySQL服务器，简单方法监控mysql的3306端口，或者使用zabbix提供的Mysql模板，如果有其他更佳方案可以说明；  
    方法1：端口（通过3306的mysql端口） net.tcp.port[,3306]  
    方法2：mysql远程登录  
    方法3：使用zabbix agent自带的模板及key  
    
4.  监控2台web服务器，简单方法监控80端口，如果有其他更佳方案可以说明；  
    方法1：端口（通过80的web端口） net.tcp.port[,80]  
    方法2：看网页状态码、返回内容==zabbix 自带WEB检测  
    
5.  监控URL地址来更精确的监控我们的网站运行正常；  
    使用zabbix自带的监控Web监测 进行监控  
    
6.  监控反向代理服务器，PPTP服务器等你在期中架构部署的服务。  
    nginx，pptp  
    ntp 端口udp 123  
    
7.  监控Nginx的7种连接状态。  
    自定义监控  
    

#### 5.3.3 监控服务通用方法

1.  监控端口 netstat ss lsof  ==》 wc -l  
    
2.  监控进程 ps -ef|grep 进程|wc -l  试运行一下  
    
3.  模拟客户端的使用方式监控服务端  
    web  ==》 curl  
    mysql ==》 select insert  
    memcache ==》 set再get  
    

### 5.4 实施全网监控

安装客户端脚本，for centos6

![](assets/监控与可观测性/Zabbix_使用指南/Zabbix_使用指南-54.png)

#### 5.4.1 使用自动发现规则

添加自动发现规则

![](assets/监控与可观测性/Zabbix_使用指南/Zabbix_使用指南-55.png)

创建发现动作

![](assets/监控与可观测性/Zabbix_使用指南/Zabbix_使用指南-56.jpeg)

查看自动发现的机器。

![](assets/监控与可观测性/Zabbix_使用指南/Zabbix_使用指南-57.jpeg)

### 5.4.2 监控备份服务器

利用系统自带键值进行监控net.tcp.listen[port] 创建新的模板

![](assets/监控与可观测性/Zabbix_使用指南/Zabbix_使用指南-58.png)

在服务端进行测试

![](assets/监控与可观测性/Zabbix_使用指南/Zabbix_使用指南-59.png)

将模板添加到主机

![](assets/监控与可观测性/Zabbix_使用指南/Zabbix_使用指南-60.png)

#### 5.4.3 监控NFS服务器

创建nfs监控模板

使用 proc.num[,,,]  键值，检测nfs进程的数量

  

在服务端进行测试

将模板绑定到主机

#### 5.4.4 监控MySQL服务器

将自带的mysqlkey值加上mysql的账户密码，否则不能获取到数据。

  

使用系统自带模板  net.tcp.port[,port] 利用自带的监控端口键值进行监控

  

添加新的mysql监控项端口

  

```plain
[root@m01 ~]# zabbix_get -s 172.16.1.51 -p 10050
-k "net.tcp.port[,3306]"1
#检查是否能建立 TCP 连接到指定端口。返回 0 - 不能连接；1 - 可以连接
```

将模板关联到主机

#### 5.4.5 监控web服务器

  

创建监控模板 监控 nginx服务与 80 端口

```plain
proc.num[<name>,<user>,<state>,<cmdline>]进程数。返回整数
  net.tcp.port[<ip>,port]
检查是否能建立 TCP 连接到指定端口。返回 0 - 不能连接；1 - 可以连接
```

![](assets/监控与可观测性/Zabbix_使用指南/Zabbix_使用指南-61.png)

[root@m01 ~]# zabbix\_get -s 172.16.1.8 -p 10050 -k

“proc.num[,,,nginx]”2[root@m01 ~]

# zabbix\_get -s 172.16.1.8 -p 10050 -k “net.tcp.port[,80]”1

将模板关联到主机

#### 5.4.6 监控URL地址

创建监测页面

```plain
echo ok >> /application/nginx/html/www/check.html
```

测试监控面页

```plain
[root@web03 ~]# for ip in 7 8 9 ;do curl 10.0.0.$ip/check.html ;doneok
ok
ok
```

创建web监测模板

创建应用集

![](assets/监控与可观测性/Zabbix_使用指南/Zabbix_使用指南-62.png)

创建Web场景

![](assets/监控与可观测性/Zabbix_使用指南/Zabbix_使用指南-63.png)

创建图形

![](assets/监控与可观测性/Zabbix_使用指南/Zabbix_使用指南-64.png)

将模板关联到主机

![image.gif](assets/监控与可观测性/Zabbix_使用指南/Zabbix_使用指南-65.gif)

监测结果

![](assets/监控与可观测性/Zabbix_使用指南/Zabbix_使用指南-66.jpeg)

#### 5.4.7 监控反向代理服务器

创建自定义key

```plain
[root@lb01 ~]
# cat /etc/zabbix/zabbix_agentd.d/userparameter_nk.confUserParameter=keep-ip,ip a |grep 10.0.0.3|wc -l
```

在服务端测试

```plain
[root@m01 ~]# zabbix_get -s 172.16.1.5  -p 10050 -k "keep-ip"1[root@m01 ~]# zabbix_get -s 172.16.1.6  -p 10050 -k "keep-ip"0
```

在web界面添加模板

![](assets/监控与可观测性/Zabbix_使用指南/Zabbix_使用指南-67.jpeg)

将模板关联到主机

#### 5.4.8 监控Nginx的7种连接状态

nginx服务器显示status

```plain
……
  location /status {
         stub_status on;
         access_log off;
  }
……
```
```plain
[root@web01 ~]# for ip in 7 8 9 ;do curl 172.16.1.$ip/status ;doneActive connections: 1server accepts handled requests 73 73 69Reading: 0 Writing: 1 Waiting: 0
Active connections: 1server accepts handled requests 134 134 127Reading: 0 Writing: 1 Waiting: 0
Active connections: 1server accepts handled requests 7 7 7Reading: 0 Writing: 1 Waiting: 0
```

在nginx服务器上添加key

```plain
cat >/etc/zabbix/zabbix_agentd.d/userparameter_nginx_status.conf <<'EOF'UserParameter=nginx_active,curl -s  127.0.0.1/status|awk
'/Active/ {print $NF}'UserParameter=nginx_accepts,curl -s  127.0.0.1/status|awk
'NR==3 {print $1}'UserParameter=nginx_handled,curl -s  127.0.0.1/status|awk
'NR==3 {print $2}'UserParameter=nginx_requests,curl -s  127.0.0.1/status|awk
'NR==3 {print $3}'UserParameter=nginx_reading,curl -s  127.0.0.1/status|awk
'NR==4 {print $2}'UserParameter=nginx_writing,curl -s  127.0.0.1/status|awk
'NR==4 {print $4}'UserParameter=nginx_waiting,curl -s  127.0.0.1/status|awk
'NR==4 {print $6}'EOF
```

服务端测试

```plain
[root@m01 ~]# zabbix_get -s 172.16.1.7  -p 10050 -k "nginx_waiting"0
[root@m01 ~]# zabbix_get -s 172.16.1.8  -p 10050 -k "nginx_waiting"0
[root@m01 ~]# zabbix_get -s 172.16.1.9  -p 10050 -k "nginx_waiting"0
```

在zabbix-web上添加

![image.gif](assets/监控与可观测性/Zabbix_使用指南/Zabbix_使用指南-68.gif)

监控项

![image.gif](assets/监控与可观测性/Zabbix_使用指南/Zabbix_使用指南-69.gif)

添加图形

![](assets/监控与可观测性/Zabbix_使用指南/Zabbix_使用指南-70.png)

将模板关联到主机

![](assets/监控与可观测性/Zabbix_使用指南/Zabbix_使用指南-71.jpeg)

查看添加的图形

![](assets/监控与可观测性/Zabbix_使用指南/Zabbix_使用指南-72.jpeg)

## 六、自动发现与自动注册

### 6.1 自动注册与自动注册

#### 6.1.1 简介

自动发现：

```plain
zabbix Server主动发现所有客户端，然后将客户端登记自己的小本本上，缺点zabbix server压力山大（网段大，客户端多），时间消耗多。
```

自动注册：

```plain
zabbix agent主动到zabbix Server上报到，登记；缺点agent有可能找不到Server（配置出错）
```

#### 6.1.2 两种模式

-   被动模式：默认  agent被server抓取数据 （都是在agent的立场上说）  
    
-   主动模式：agent主动将数据发到server端 （都是在agent的立场上说）  
    

> 注意：两种模式都是在agent上进行配置
> 
> zabbix 的使用要在hosts文件中预先做好主机名的解析

### 6.2 自动发现—被动模式

-   第一个里程碑：完成之前的安装  
    zabbix Server安装完毕  
    
-   第二个里程碑：配置agent客户端  
    zabbix agent安装完毕，注意配置Server=172.16.1.61  
    
-   第三个里程碑：在web界面上进行配置  
    web界面：配置 >> 自动发现 >> Local network

使用自带的自动发现规则（进行修改）即可

在ip范围内输入ip，注意格式；

延迟在实际的生产环境中要大一些，实验环境可以小一些

创建发现动作

配置 >> 动作 >> Auto discovery. Linux servers.

①  配置动作

![image.gif](assets/监控与可观测性/Zabbix_使用指南/Zabbix_使用指南-73.gif)

②  在条件中添加条件，让添加更准确

![](assets/监控与可观测性/Zabbix_使用指南/Zabbix_使用指南-74.jpeg)

③  在操作中添加

a)  添加主机与启用主机

![](assets/监控与可观测性/Zabbix_使用指南/Zabbix_使用指南-75.png)

## 七、分布式监控与SNMP监控

### 7.1 分布式监控

#### 7.1.1 作用

分担压力，减轻负载

多机房监控

zabbix Server  ===》  zabbix agent （只能同一个局域网监控）

分担压力，降低负载

```plain
zabbix Server ===》  zabbix proxy
===》zabbix agent1 agent2 agent3 。。。172.16.1.61           172.16.1.21        172.16.1.0/24
===》  zabbix proxy
===》zabbix agent4 agent5 agent6 。。。
```

多机房监控

```plain
zabbix Server(北京)
==》 zabbix proxy（每个机房搭建）
==》 zabbix agent    122.71.240.233/172.16.1.61
122.71.241.11/172.16.2.21     172.16.2.0/24
```

#### 7.1.2 环境说明

```plain
zabbix server m01
  zabbix proxy cache01
  zabbix agent  cache01
```

7.1.3 配置zabbix proxy

第一个里程碑：配置zabbix yum源，并安装proxy

```plain
rpm -ivh http://repo.zabbix.com/zabbix/3.0/rhel/7/x86_64/zabbix-release-3.0-1.el7.noarch.rpm
yum install zabbix-proxy-mysql -y
```

第二个里程碑：安装数据库

zabbix  proxy也需要数据库，这个数据库不是用于存储监控数据的 只是用于存储配置信息

安装数据库

```plain
yum -y install mariadb-server
systemctl start mariadb.service
```

建立数据库

```plain
mysql
create database zabbix_proxy character set utf8 collate utf8_bin;
grant all privileges on zabbix_proxy.* to zabbix@'localhost' identified by
'zabbix';
exit
```

导入数据文件

```plain
zcat /usr/share/doc/zabbix-proxy-mysql-3.0.13/schema.sql.gz |mysql -uzabbix -pzabbix zabbix_proxy
```

配置zabbix proxy 连接数据库

```plain
sed -i.ori
'162a DBPassword=zabbix' /etc/zabbix/zabbix_proxy.conf
sed -i
's#Server=127.0.0.1#Server=172.16.1.61#' /etc/zabbix/zabbix_proxy.conf
sed -i
's#Hostname=Zabbix proxy#Hostname=cache01#' /etc/zabbix/zabbix_proxy.conf# Hostname
```

作为后面添加的代理程序名称，要保持一致

启动

```plain
systemctl restart zabbix-proxy.service
```

检查端口

```plain
[root@cache01 ~]# netstat -lntup |grep zabbixtcp        0      0 0.0.0.0:10050     0.0.0.0:*       LISTEN      105762/zabbix_agent
tcp        0      0 0.0.0.0:10051   0.0.0.0:*         LISTEN      85273/zabbix_proxy
tcp6       0      0 :::10050       :::*      LISTEN      105762/zabbix_agent
tcp6       0      0 :::10051  :::*           LISTEN      85273/zabbix_proxy
```

第三个里程碑：修改agent配置指向 proxy

```plain
[root@cache01 ~]
# grep ^Server /etc/zabbix/zabbix_agentd.confServer=172.16.1.61ServerActive=172.16.1.61[root@cache01 ~]
# sed -i 's#172.16.1.61#172.16.1.21#g' /etc/zabbix/zabbix_agentd.conf[root@cache01 ~]
# grep ^Server /etc/zabbix/zabbix_agentd.confServer=172.16.1.21ServerActive=172.16.1.21[root@cache01 ~]
# systemctl restart zabbix-agent.service
```

第四个里程碑：web界面添加代理

管理 >> agent代理程序 >> 创建代理

![](assets/监控与可观测性/Zabbix_使用指南/Zabbix_使用指南-76.png)

代理程序名称要填写主机名

![](assets/监控与可观测性/Zabbix_使用指南/Zabbix_使用指南-77.jpeg)

稍等片刻就能在程序中出现代理

![](assets/监控与可观测性/Zabbix_使用指南/Zabbix_使用指南-78.png)

在主机中能发现主机代理

![image.gif](assets/监控与可观测性/Zabbix_使用指南/Zabbix_使用指南-79.gif)

### 7.2 SNMP监控

#### 7.2.1 使用范围

无法安装agent  很多前辈的监控软件都可以监控各种设备  都是通过snmp监控

snmp simple network manager protocol 简单网络管理协议

简单网络管理协议（SNMP），由一组网络管理的标准组成，包含一个应用层协议（application layer protocol）、数据库模型（database schema）和一组资源对象。该协议能够支持网络管理系统，用以监测连接到网络上的设备是否有任何引起管理上关注的情况。

#### 7.2.2 安装snmp程序

```plain
yum -y install net-snmp net-snmp-utils
```

#### 7.2.3 配置snmp程序

```plain
sed -i.ori
'57a view systemview   included  .1' /etc/snmp/snmpd.conf
systemctl start snmpd.service
```

#### 7.2.4 测试snmp

```plain
[root@m01 ~]# snmpwalk -v 2c -c public 127.0.0.1 sysnameSNMPv2-MIB::sysName.0 = STRING: m01
```

说明：

> -   snmpwalk 类似 zabbix\_get  
>     
> -   \-v 2c  指定使用snmp协议的版本  snmp分为v1 v2 v3  
>     
> -   \-c public  指定暗号  
>     
> -   sysname  类似zabbix的key  
>     

#### 7.2.5 在web界面进行配置

添加新的主机，注意使用snmp接口

![](assets/监控与可观测性/Zabbix_使用指南/Zabbix_使用指南-80.png)

选择模板，注意使用SNMP的模板

![](assets/监控与可观测性/Zabbix_使用指南/Zabbix_使用指南-81.png)

添加完成就能够在主机中看到snmp监控对的主机

![](assets/监控与可观测性/Zabbix_使用指南/Zabbix_使用指南-82.png)