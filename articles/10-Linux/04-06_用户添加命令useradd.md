# 用户添加命令useradd

> 分类：Linux / 第4章：用户和用户组管理
> 原文：https://www.cuiliangblog.cn/detail/section/31507978
> 来源：崔亮的博客

---

# 一、useradd说明
1. 格式：[root@localhost~]#useradd[选项]用户名
2. 当使用useradd命令不加参数选项，后面直接跟所添加的用户名时，系统首先会读取配置文件/etc/login.defs和/etc/default/useradd文件中所配置的信息建立用户的家目录，并复制/etc/skel中的所有文件（包括隐藏的环境配置文件）到新用户的家目录中。
3. 选项：

| -u UID | 手工指定用户的UID号 |
| --- | --- |
| -d 家目录 | 手工指定用户的家目录 |
| -c 用户说明 | 手工指定用户的说明 |
| -e 过期天数 | 账户过期几天后永久停权 |
| -g 组名 | 手工指定用户的初始组 |
| -G 组名 | 指定用户的附加组 |
| -M 家目录 | 不为用户建立并初始化宿主目录 |
| -s shell | 手工指定用户的登录shell。默认是/bin/bash |


# 二、添加默认用户
![](assets/10-Linux/8960f237ff35afb1b364.png)

# 三、指定选项添加用户
![](assets/10-Linux/2db45a8742f16bdf52f4.png)


