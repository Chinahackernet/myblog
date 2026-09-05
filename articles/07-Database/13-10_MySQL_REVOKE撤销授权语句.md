# MySQL REVOKE撤销授权语句

> 分类：Database / 第13章：MySQL用户权限管理
> 原文：https://www.cuiliangblog.cn/detail/section/31461146
> 来源：崔亮的博客

---

revoke语句可以用来创建用户也可以修改用户的权限

1. grant语法：

revoke 权限(colname) on <dbname>.<tabname> from username@host;

1. 示例(root)，收回用户wang的select      test库的stu表的sno列权限：

mysql> revoke select(sno) on test.stu from wang@localhost;

mysql> show grants for wang@localhost;

![](assets/07-Database/2a065b3b65141f493e91.png)

 

![](assets/07-Database/c8294de3971e5cd31591.png)

 


