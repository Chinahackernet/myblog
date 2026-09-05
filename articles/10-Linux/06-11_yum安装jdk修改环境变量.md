# yum安装jdk修改环境变量

> 分类：Linux / 第6章：软件包管理
> 原文：https://www.cuiliangblog.cn/detail/section/31508073
> 来源：崔亮的博客

---

    1. 查看java命令文件路径
+ ![](assets/10-Linux/bdf94f2b4195ee554848.png)
    1. export       JAVA_HOME=/usr/lib/jvm/jre-1.6.0-openjdk
+ export  PATH=$PATH:$JAVA_HOME/bin
+ export CLASSPATH=.:$JAVA_HOME/lib/tools.jar:$JAVA_HOME/lib/dt.jar


