# Alias别名

> 分类：Database / 第2章：SQL查询-简单查询
> 原文：https://www.cuiliangblog.cn/detail/section/31323421
> 来源：崔亮的博客

---

1. **SQL Alias**
+ **表的 SQL Alias 语法**
+ SELECT column_name(s)  
  FROM table_name  
  AS alias_name
+ **列的 SQL Alias 语法**
+ SELECT column_name AS  alias_name  
  FROM table_name
2. **Alias 实例: 使用表名称别名**
+ 假设我们有两个表分别是："Persons"  和 "Product_Orders"。我们分别为它们指定别名 "p" 和 "po"。
+ 现在，我们希望列出  "John Adams" 的所有定单。
+ 我们可以使用下面的  SELECT 语句：
+ <font style="color:black;">SELECT po.OrderID, p.LastName,  p.FirstName  
</font><font style="color:black;">  FROM Persons </font><font style="color:#0000DD;">AS p</font><font style="color:black;">, Product_Orders </font><font style="color:#0000DD;">AS po</font><font style="color:black;">  
</font><font style="color:black;">  WHERE p.LastName='Adams' AND p.FirstName='John'</font>
+ 不使用别名的  SELECT 语句：
+ SELECT  Product_Orders.OrderID, Persons.LastName, Persons.FirstName  
  FROM Persons, Product_Orders  
  WHERE Persons.LastName='Adams' AND Persons.FirstName='John'
+ 从上面两条 SELECT  语句您可以看到，别名使查询程序更易阅读和书写。
3. **Alias 实例: 使用一个列名别名**
+ **表 Persons:**

| **Id** | **LastName** | **FirstName** | **Address** | **City** |
| --- | --- | --- | --- | --- |
| 1 | Adams | John | Oxford Street | London |
| 2 | Bush | George | Fifth Avenue | New York |
| 3 | Carter | Thomas | Changan Street | Beijing |


+ **SQL:**
+ <font style="color:black;">SELECT LastName </font><font style="color:#0000DD;">AS Family</font><font style="color:black;">, FirstName </font><font style="color:#0000DD;">AS Name</font><font style="color:black;">  
</font><font style="color:black;">  FROM Persons</font>
+ **结果：**

| **Family** | **Name** |
| --- | --- |
| Adams | John |
| Bush | George |
| Carter | Thomas |



