# MySQL显示用户权限

> 分类：Database / 第13章：MySQL用户权限管理
> 原文：https://www.cuiliangblog.cn/detail/section/31461148
> 来源：崔亮的博客

---

使用show grants语句查看用户拥有的权限

1. 测试（root）

mysql> show grants;                                  --查看自己所拥有的权限

mysql> show grants for wang@localhost; --查看用户wang的权限

![](assets/07-Database/06217e628210243dded7.png)

 

![](assets/07-Database/5216e5835947dcc53de9.png)

 


