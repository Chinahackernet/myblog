# select查询语句

> 分类：Database / 第2章：SQL查询-简单查询
> 原文：https://www.cuiliangblog.cn/detail/section/31323475
> 来源：崔亮的博客

---

# 一、简介
1. **SQL**** SELECT 语句**

SELECT  语句用于从表中选取数据。

结果被存储在一个结果表中（称为结果集）。

3. **SQL SELECT 语法**

SELECT 列名称 FROM 表名称

以及：

SELECT * FROM 表名称

+ **注释：**SQL 语句对大小写不敏感。SELECT 等效于 select。

# 二、示例
+ **"Persons" 表:**

| Id | LastName | FirstName | Address | City |
| --- | --- | --- | --- | --- |
| 1 | Adams | John | Oxford Street | London |
| 2 | Bush | George | Fifth Avenue | New York |
| 3 | Carter | Thomas | Changan Street | Beijing |


1. 获取名为  "LastName" 和 "FirstName" 的列的内容（从名为 "Persons"  的数据库表）

SELECT LastName,FirstName  FROM Persons

+ 结果

| LastName | FirstName |
| --- | --- |
| Adams | John |
| Bush | George |
| Carter | Thomas |


2. 从  "Persons" 表中选取所有的列。

使用符号 *  取代列的名称，就像这样：

<font style="color:black;">SELECT </font><font style="color:#0000DD;">*</font><font style="color:black;"> FROM Persons</font>

+ **结果：**

| Id | LastName | FirstName | Address | City |
| --- | --- | --- | --- | --- |
| 1 | Adams | John | Oxford Street | London |
| 2 | Bush | George | Fifth Avenue | New York |
| 3 | Carter | Thomas | Changan Street | Beijing |





