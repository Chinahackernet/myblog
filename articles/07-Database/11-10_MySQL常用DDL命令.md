# MySQL常用DDL命令

> 分类：Database / 第11章：MySQL基本使用
> 原文：https://www.cuiliangblog.cn/detail/section/31451698
> 来源：崔亮的博客

---

建表T 

create database if not exists xyz;

use xyz;

create table t(id int,name char(10));

show tables;

 

 

 

修改表名：

alter table t rename to t1;

show tables;

 

 

 

添加字段：

add 

t1表添加字段sal,decimal(8,2)

alter table t1 add sal decimal(8,2);

desc t1;

 

 

 

修改字段类型：

modify

t1表修改name char(10) 到 varchar(10)

alter table t1 modify name varchar(10);

desc t1;

 

 

 

修改字段名称：

change

t1表字段sal修改为salary

desc t1;

alter table t1 change sal salary decimal(8,2);

desc t1;

 

 

 

修改字段位置：

desc t1；

修改字段salary成第一列

alter table t1 modify salary decimal(8,2) first;

修改字段salary成最后一列

alter table t1 modify salary decimal(8,2) after name;

desc t1;

 

 

修改字段默认值：

desc t1;

修改salary默认值为1000.00

alter table t1 modify salary decimal(8,2) default 1000.00;

 

 

修改字段为非空：

desc t1;

修改salary为非空

alter table t1 modify salary decimal(8,2) not null;

desc t1;

 

 

追加表的某个字段唯一约束：

desc t1;

给字段name添加唯一性约束(name不能有重值，但是可以有空值）

alter table t1 add unique(name);

desc t1;

 

追加表的某个字段为主键：

desc t1;

给字段id添加主键约束（id不能有重值，不能有空值）

alter table t1 add primary key(id);

desc t1;

 

取消表的主键：

alter table t1 drop primary key;

 

 

 

添加多列：

desc t1;

alter table t1 add col1 int,add col2 char(10),add col3 varchar(20);

desc t1;

 

删除多列：

alter table t1 drop col1,drop col2,drop col3;

desc t1;

 

 

 

 


