# between范围

> 分类：Database / 第2章：SQL查询-简单查询
> 原文：https://www.cuiliangblog.cn/detail/section/31320924
> 来源：崔亮的博客

---

# 一、简介
1. **BETWEEN 操作符**

操作符 BETWEEN  ... AND 会选取介于两个值之间的数据范围。这些值可以是数值、文本或者日期。

2. **SQL BETWEEN 语法**

```sql
SELECT column_name(s)
  FROM table_name
  WHERE column_name
  BETWEEN value1 AND value2
```

# 二、示例
1. **原始的表 **
+ Persons 表:

| Id | LastName | FirstName | Address | City |
| --- | --- | --- | --- | --- |
| 1 | Adams | John | Oxford Street | London |
| 2 | Bush | George | Fifth Avenue | New York |
| 3 | Carter | Thomas | Changan Street | Beijing |
| 4 | Gates | Bill | Xuanwumen 10 | Beijing |


2. **BETWEEN 操作符实例**
+ 如需以字母顺序显示介于  "Adams"（包括）和 "Carter"（不包括）之间的人，请使用下面的 SQL：

```sql
SELECT * FROM Persons
  WHERE LastName
  BETWEEN 'Adams' AND 'Carter'
```

+ **结果集：**

| Id | LastName | FirstName | Address | City |
| --- | --- | --- | --- | --- |
| 1 | Adams | John | Oxford Street | London |
| 2 | Bush | George | Fifth Avenue | New York |


+ **重要事项：**<font style="color:black;">不同的数据库对  BETWEEN...AND 操作符的处理方式是有差异的。某些数据库会列出介于 "Adams" 和 "Carter"  之间的人，但不包括 "Adams" 和 "Carter" ；某些数据库会列出介于 "Adams"  和 "Carter" 之间并包括 "Adams" 和 "Carter"  的人；而另一些数据库会列出介于 "Adams" 和 "Carter" 之间的人，包括  "Adams" ，但不包括 "Carter" 。</font>
+ 所以，请检查你的数据库是如何处理  BETWEEN....AND 操作符的！
3. **实例 2**
+ 如需使用上面的例子显示范围之外的人，请使用  NOT 操作符：

```sql
SELECT * FROM Persons
  WHERE LastName
  NOT BETWEEN 'Adams' AND 'Carter'
```

+ **结果集：**

| Id | LastName | FirstName | Address | City |
| --- | --- | --- | --- | --- |
| 3 | Carter | Thomas | Changan Street | Beijing |
| 4 | Gates | Bill | Xuanwumen 10 | Beijing |





