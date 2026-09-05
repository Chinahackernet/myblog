# distinct查询去重语句

> 分类：Database / 第2章：SQL查询-简单查询
> 原文：https://www.cuiliangblog.cn/detail/section/31323460
> 来源：崔亮的博客

---

# 一、简介
1. **SQL**** SELECT DISTINCT 语句**

在表中，可能会包含重复值。这并不成问题，不过，有时您也许希望仅仅列出不同（distinct）的值。

关键词 DISTINCT  用于返回唯一不同的值。

2. **语法：**

SELECT DISTINCT 列名称 FROM 表名称

# 二、示例
+ **"Orders"表：**

| Company | OrderNumber |
| --- | --- |
| IBM | 3532 |
| W3School | 2356 |
| Apple | 4698 |
| W3School | 6953 |


1. 从  "Company" 列中选取所有的值，我们需要使用 SELECT 语句：

SELECT Company FROM Orders

+ 结果

| Company |
| --- |
| IBM |
| W3School |
| Apple |
| W3School |


2. 从  Company" 列中仅选取唯一不同的值，我们需要使用 SELECT DISTINCT 语句：

<font style="color:black;">SELECT </font><font style="color:#0000DD;">DISTINCT</font><font style="color:black;"> Company FROM Orders </font>

+ **结果：**

| Company |
| --- |
| IBM |
| W3School |
| Apple |





