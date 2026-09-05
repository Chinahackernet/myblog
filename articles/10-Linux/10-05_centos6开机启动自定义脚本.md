# centos6开机启动自定义脚本

> 分类：Linux / 第10章：服务管理
> 原文：https://www.cuiliangblog.cn/detail/section/31508417
> 来源：崔亮的博客

---

# 一、脚本方式添加到rc.local
1. 新建执行脚本echo.sh
+ 脚本的位置在/root/python目录下

![](assets/10-Linux/a5e788ea64edee9a6fed.png)

1. 使自启动程序拥有执行权限

![](assets/10-Linux/2fc41634a06911864489.png)

1. 在/etc/rc.d/rc.local中加入执行脚本命令，并设置执行权限。
+ 在/etc/rc.d/rc.local文件末尾追加/root/python/echo.sh

![](assets/10-Linux/5547776fd3eec341e96c.png)

+ 设置执行权限

![](assets/10-Linux/30b114409355a69a7592.png)

1. 重启

# 二、服务方式chkconfig命令
1. 编写脚本

![](assets/10-Linux/f3e4c7035e146191ce8d.png)

+ 脚本第二行 “#chkconfig: 2345 80 90”      表示在2/3/4/5运行级别启动，启动序号(S80)，关闭序号(K90)； 
1. 将写好的autostart.sh脚本移动到/etc/rc.d/init.d/目录下给脚本赋可执行权限

![](assets/10-Linux/1b382d5bfdcdb0bb992d.png)

1. 添加脚本到开机自动启动项目中

![](assets/10-Linux/b4026637237d59bb7e06.png)

1. 重启


