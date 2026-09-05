# 网络安全-selinux管理

> 分类：Linux / 第8章：系统管理
> 原文：https://www.cuiliangblog.cn/detail/section/31508254
> 来源：崔亮的博客

---

# 一、selinux的简介
什么是selinux：selinux(security enhanced linux)安全增强型linux系统，它是一个linux内核模块，也是linux的一个安全子系统。

selinux的主要作用就是最大限度地减小系统中服务进程可访问的资源（最小权限原则）

selinux有两个级别 强制和警告       setenforce  0|1  0表示警告(Permissive)，1表示强制（Enforcing）

selinux相当于一个插件  (内核级的插件)

selinux功能开启后，会关闭系统中不安全的功能

selinux有两个功能： 程序访问文件、安全上下文

# 二、selinux常用操作
1. 查看selinux状态：

```bash
[root@localhost ~]# getenforce
Enforcing
```

2. 临时关闭selinux

```bash
[root@localhost ~]# setenforce 0
[root@localhost ~]# getenforce
Permissive
```

3. 永久关闭：

```bash
[root@localhost ~]# vim /etc/sysconfig/selinux
SELINUX=enforcing 改为 SELINUX=disabled
```

重启服务reboot

查看日志中的警告：cat      /var/log/audit/audit.log


