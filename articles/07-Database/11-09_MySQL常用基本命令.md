# MySQL常用基本命令

> 分类：Database / 第11章：MySQL基本使用
> 原文：https://www.cuiliangblog.cn/detail/section/31451704
> 来源：崔亮的博客

---

客户端连接mysqld:

 

mysql -uroot -hlocalhost -p

mysql -uoffcn -h10.10.13.118 -P9999 -p

-Pxxxx为mysqld服务程序的端口号，默认3306，如果其他必须要指定

 

mysql>提示符下

 

查看服务器状态：

status;

 

查看当前时间：

select now();

 

查看当前用户是谁：

select user();

 

查看当前选择了哪个数据库：

select database();

 

查看版本：

status;

select version();

 

查看都有哪些数据库：

show databases;

 

使用数据库：

use db_name;

 

查看数据库都有哪些表：

show tables;

 

查看表都有哪些列：

desc tab_name;

 

查看引擎：

show engines;

 

使用tee

tee c:/1.txt  屏幕上的输出另存一份到c:\1.txt里面

 

取消tee

notee;

 

查看帮助：

help

 

查看如何用create database:

help create database;

 

查看如何用create table:

help create table;

 

 

创建数据库：

create database xyz;

create database if not exists xyz;

create database if not exists xyz character set utf8 collate utf8_general_ci;

 

删除数据库：

drop database aaa; 不存在报错

drop database if exists aaa; 不存在不会报错

 

查看告警：

show warnings;

 

 

创建学生表：

use xyz;

create table student (sno int,sname varchar(20),age int,phone char(11));

 

给学生表插入数据：

insert into student(sno,sname,age,phone) values('1','zhangsan',22,'13011228822');

insert into student(sno,sname,age,phone) values('2','lisi',23,'13522885566');

insert into student(sno,sname,age,phone) values('3','wangwu',25,'13766337890');

查看学生表结构：

desc student;

 

查看学生表（所有列，所有行）：

select * from student;

 

查看学生表（sno列和sname列，所有行）：

select sno,sname from student;

 

查看学生表（sno列和sname列，sno为1的行）：

select sno,sname from student where sno=1;

 

查看学生表（所有列，电话135开头的行）：

select * from student where phone like '135%';

 

查看学生表（所有列，电话135开头的行而且年龄大于20岁的行）：

select * from student where phone like '135%' and age>20;

 

 

删除学生表（sno为3的学生）

delete from student where sno=3;

select * from student;

 

修改学生表（sno为2的学生，age改成28，phone改成13501160001）

update student set age=28,phone='13501160001' where sno=2;

select * from student;


