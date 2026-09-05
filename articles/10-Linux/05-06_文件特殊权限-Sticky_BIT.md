# 文件特殊权限-Sticky BIT

> 分类：Linux / 第5章：权限管理
> 原文：https://www.cuiliangblog.cn/detail/section/31508026
> 来源：崔亮的博客

---

# 一、SBIT粘着位作用
1. 粘着位目前只对<font style="color:red;">目录</font>有效
2. 普通用户对该目录拥有w和x权限，即普通用户可以在此目录拥有写入权限
3. 如果没有粘着位，因为普通用户拥有w权限，所以可以删除此目录下所有文件，包括其他用户建立的文件。一但赋予了粘着位，除了root可以删除所有文件，普通用户就算拥有w权限，也<font style="color:red;">只能删除自己建立的文件，但是不能删除其他用户建立的文件</font>

# 二、设置与取消粘着位
1. 设置粘着位
+ chmod 1755 目录名

![](assets/10-Linux/6fe6f4a53bb7b8233140.png)

+ chmod o+t 目录名

![](assets/10-Linux/2dcce0073bbbf6b29b82.png)

1. 取消粘着位
+ chmod 777 目录名

![](assets/10-Linux/795ebc1af3b6e6de16be.png)

+ chmod 0-t 目录名

![](assets/10-Linux/e598035002ad47893bc8.png)


