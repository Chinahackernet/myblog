# mysqldump备份

> 分类：Database / 第17章：MySQL备份与恢复
> 原文：https://www.cuiliangblog.cn/detail/section/31461374
> 来源：崔亮的博客

---

1. 备份过程中客户可能仍然对数据库表在做修改
2. mysqldump提供相关选项保证备份的相关数据库处于同一个版本
3. 一致性选项
+ master-data=2

备份过程锁住所有表，禁止select之外的所有语句

会把备份时刻的头标注和当前binlog文件名写到备份文件中        

+ 示例：

root# mysqldump -uroot -p --master-data=2 test > db_test1.sql

![](assets/07-Database/23fabbbeba04cf7dbad8.png)

+ --master-data=2 和      --single-transaction 一起用 (备份事务引擎库)

对于innodb引擎的数据表，可以在备份时确保一致性

--single-transaction选项开启一个新事务进行备份，事务读一致性确保备份的多个表属于一个版本（热备）

对于不支持事务的其他引擎不确保备份的一致性

+ --lock-all-tables

锁定所有数据库的所有表来确保备份一致性（温备）

+ --flush-logs

先切换binlog日志，再开始备份

1. 删除选项：
+ --add-drop-database 

将drop database语句添加到每个create database之前，还原时会先删除已有数据库再创建

+ --add-drop-table

将drop table语句添加到每个create table语句之前，还原时会先删除已有数据表再建表

1. MySQL 编程组件：

--routines  导出存储过程和函数到备份文件

--triggers  导出触发器到备份文件

1. 默认最高选项 --opt

--opt选项相当于同时使用以下选项：

+ --add-drop-table 
+ --add-locks 

还原时给insert语句前加独占写锁，写入时不许其他用户更新数据，写入完成解锁

+ --create-options 

添加所有数据对象的create语句,如：database,table

+ --quick

不把备份过程中的SQL语句放到查询缓冲区中，输出到标准输出

+ --extended-insert

使用多行插入语法，例如：insert into t values(1),(2),(3)...

+ --lock-tables  

给备份过程中遇到的每个表加只读锁，备份时其他修改表的用户要等待该表备份完成

+ --set-charset 

添加set names default_character_set到输出文件

+ --disable-keys 

添加disable keys和enable keys到备份输出文件，还原插入记录时，插入完成后再建立索引提高还原效率

 

 


