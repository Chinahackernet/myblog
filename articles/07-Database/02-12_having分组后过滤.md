# having分组后过滤

> 分类：Database / 第2章：SQL查询-简单查询
> 原文：https://www.cuiliangblog.cn/detail/section/31312088
> 来源：崔亮的博客

---

# 一、简介
1. **HAVING 子句**

在 SQL 中增加 HAVING 子句原因是，WHERE 关键字无法与合计函数一起使用。

2. **SQL HAVING 语法**

```sql
SELECT column_name, aggregate_function(column_name)
FROM table_name
WHERE column_name operator value
GROUP BY column_name
HAVING aggregate_function(column_name) operator value
```

# 二、示例
+ 我们拥有下面这个 "Orders" 表：

| O_Id | OrderDate | OrderPrice | Customer |
| --- | --- | --- | --- |
| 1 | 2008/12/29 | 1000 | Bush |
| 2 | 2008/11/23 | 1600 | Carter |
| 3 | 2008/10/05 | 700 | Bush |
| 4 | 2008/09/28 | 300 | Bush |
| 5 | 2008/08/06 | 2000 | Adams |
| 6 | 2008/07/21 | 100 | Carter |


1. 查找订单总金额少于 2000 的客户。

```sql
SELECT Customer,SUM(OrderPrice) FROM Orders
GROUP BY Customer
HAVING SUM(OrderPrice)<2000
```

+ 结果集类似：

| Customer | SUM(OrderPrice) |
| --- | --- |
| Carter | 1700 |


2. 查找客户 "Bush" 或 "Adams" 拥有超过 1500 的订单总金额。

```sql
SELECT Customer,SUM(OrderPrice) FROM Orders
WHERE Customer='Bush' OR Customer='Adams'
GROUP BY Customer
HAVING SUM(OrderPrice)>1500
```

+ 结果集：

| Customer | SUM(OrderPrice) |
| --- | --- |
| Bush | 2000 |
| Adams | 2000 |




 

 


