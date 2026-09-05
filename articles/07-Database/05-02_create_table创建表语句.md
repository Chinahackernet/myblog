# create table创建表语句

> 分类：Database / 第5章：SQL数据定义
> 原文：https://www.cuiliangblog.cn/detail/section/31451624
> 来源：崔亮的博客

---

    1. **CREATE TABLE 语句**
+ CREATE TABLE  语句用于创建数据库中的表。
+ **SQL CREATE TABLE 语法**
+ CREATE TABLE 表名称  
  (  
  列名称1 数据类型,  
  列名称2 数据类型,  
  列名称3 数据类型,  
  ....  
  )
+ 数据类型（data_type）规定了列可容纳何种数据类型。下面的表格包含了SQL中最常用的数据类型：

| **数据类型** | **描述** |
| --- | --- |
| + integer(size)<br/>+ int(size)<br/>+ smallint(size)<br/>+ tinyint(size) | 仅容纳整数。在括号内规定数字的最大位数。 |
| + decimal(size,d)<br/>+ numeric(size,d) | 容纳带有小数的数字。<br/>"size" 规定数字的最大位数。"d"    规定小数点右侧的最大位数。 |
| char(size) | 容纳固定长度的字符串（可容纳字母、数字以及特殊字符）。<br/>在括号中规定字符串的长度。 |
| varchar(size) | 容纳可变长度的字符串（可容纳字母、数字以及特殊的字符）。<br/>在括号中规定字符串的最大长度。 |
| date(yyyymmdd) | 容纳日期。 |


    1. **SQL CREATE TABLE 实例**
+ 本例演示如何创建名为  "Person" 的表。
+ 该表包含 5  个列，列名分别是："Id_P"、"LastName"、"FirstName"、"Address"  以及 "City"：
+ CREATE TABLE Persons  
  (  
  Id_P int,  
  LastName varchar(255),  
  FirstName varchar(255),  
  Address varchar(255),  
  City varchar(255)  
  )
+ Id_P 列的数据类型是  int，包含整数。其余 4 列的数据类型是 varchar，最大长度为 255 个字符。
+ 空的  "Persons" 表类似这样：

| **Id_P** | **LastName** | **FirstName** | **Address** | **City** |
| --- | --- | --- | --- | --- |


+ 可使用 INSERT  INTO 语句向空表写入数据。
+  
+ 来自 <[https://www.w3school.com.cn/sql/sql_create_table.asp](https://www.w3school.com.cn/sql/sql_create_table.asp)> 
    1. SQL CREATE TABLE其他用法
    - 基于已有数据表创建新表并复制所有数据
+ create  table student1 as select * from student; (CTAS建表方式)
    - 基于已有数据表创建新表并复制部分数据
+ create  table student2 as select * from student where gender='女';
    - 基于已有数据库创建新表仅复制表结构不包括行数据
+ create  table student3 as select * from student where 1=2;
+ create  table student4 like student; （MYSQL专有语法）


