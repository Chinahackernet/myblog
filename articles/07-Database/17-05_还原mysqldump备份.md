# 还原mysqldump备份

> 分类：Database / 第17章：MySQL备份与恢复
> 原文：https://www.cuiliangblog.cn/detail/section/31461367
> 来源：崔亮的博客

---

    1. 使用 mysql 命令重新装入       mysqldump 备份
    - db_test.sql       是包括了test数据库的备份，其中表t备份时包括了1,2,3三条记录
    - mysql>use test;
    - mysql> insert into t       values(4),(5),(6); 再插入3条记录
    - mysql> select * from t;
    - root# mysql -uroot -p test <       /root/db_test.sql
    - mysql> use test;
    - mysql>select * from t;
    - test数据库回到了原来备份时的状态
+ ![](assets/07-Database/b06745bca992eeb81b06.png)
+ ![](assets/07-Database/3e89d55d329e3ae4663c.png)
    2. 使用 mysql       的source命令执行备份(里面都是SQL语句)
    3. db_test.sql       是包括了test数据库的备份，其中表t备份时包括了1,2,3三条记录
    - mysql>use test;
    - mysql> insert into t       values(4),(5),(6); 再插入3条记录
    - mysql> select * from t;
    - mysql> source       /root/db_test.sql;
    - mysql> use test;
    - mysql>select * from t;
    - test数据库回到了原来备份时的状态
+ ![](assets/07-Database/c6826c78e63c27575600.png)
+ ![](assets/07-Database/26bf1002c62f5757afd0.png)
+  
+  


