# MySQL GRANT授权语句

> 分类：Database / 第13章：MySQL用户权限管理
> 原文：https://www.cuiliangblog.cn/detail/section/31461153
> 来源：崔亮的博客

---

grant语句可以用来创建用户也可以修改用户的权限

1. grant语法：

grant 权限(colname) on <dbname>.<tabname> to username@host identified by ‘password’;

1. 示例，创建用户wang，可以select      test库的stu表的sno列：

grant select(sno) on test.stu to wang@localhost identified by 'CHANGE_ME';

1. 测试 (wang)

# mysql -uwang –p

mysql> show databases;

mysql>use test;

mysql>show tables;

mysql> select * from stu; --报错，只能看sno这列的内容

mysql> select sno from stu;

![](assets/07-Database/88f453c93847d7fb16fc.png)

1. 测试 (root)

mysql> select * from mysql.tables_priv where user='wang';

mysql> select * from mysql.columns_priv where user='wang';

![](assets/07-Database/80d5f1a473f8c79a93cb.png)

 

![](assets/07-Database/f7cf444e27a7d8316a0c.png)

 


