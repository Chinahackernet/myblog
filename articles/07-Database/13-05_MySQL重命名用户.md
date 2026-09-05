# MySQL重命名用户

> 分类：Database / 第13章：MySQL用户权限管理
> 原文：https://www.cuiliangblog.cn/detail/section/31461166
> 来源：崔亮的博客

---

    1. 使用rename       user命令可以给用户名和客户端主机改名
+ 示例：把tom@192.168.2.1  改名为 tim@localhost
+ mysql> rename user tom@192.168.2.1 to tim@localhost;
+ ![](assets/07-Database/281617b187cf3c2fffd1.png)
+ ![](assets/07-Database/6840a8022020f71ab7db.png)
+  


