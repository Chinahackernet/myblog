# and&or条件运算符

> 分类：Database / 第2章：SQL查询-简单查询
> 原文：https://www.cuiliangblog.cn/detail/section/31323402
> 来源：崔亮的博客

---

1. **AND 和 OR 运算符**
+ AND 和 OR 可在  WHERE 子语句中把两个或多个条件结合起来。
+ 如果第一个条件和第二个条件都成立，则  AND 运算符显示一条记录。
+ 如果第一个条件和第二个条件中只要有一个成立，则  OR 运算符显示一条记录。
2. **原始的表 (用在例子中的)：**

| **LastName** | **FirstName** | **Address** | **City** |
| --- | --- | --- | --- |
| Adams | John | Oxford Street | London |
| Bush | George | Fifth Avenue | New York |
| Carter | Thomas | Changan Street | Beijing |
| Carter | William | Xuanwumen 10 | Beijing |


1. **AND**** 运算符实例**
+ 使用 AND  来显示所有姓为 "Carter" 并且名为 "Thomas" 的人：
+ <font style="color:black;">SELECT * FROM Persons WHERE  FirstName='Thomas' </font><font style="color:#0000DD;">AND</font><font style="color:black;"> LastName='Carter'</font>
+ **结果：**

| **LastName** | **FirstName** | **Address** | **City** |
| --- | --- | --- | --- |
| Carter | Thomas | Changan Street | Beijing |


1. **OR ****运算符实例**
+ 使用 OR  来显示所有姓为 "Carter" 或者名为 "Thomas" 的人：
+ <font style="color:black;">SELECT * FROM Persons WHERE  firstname='Thomas' </font><font style="color:#0000DD;">OR</font><font style="color:black;"> lastname='Carter'</font>
+ **结果：**

| **LastName** | **FirstName** | **Address** | **City** |
| --- | --- | --- | --- |
| Carter | Thomas | Changan Street | Beijing |
| Carter | William | Xuanwumen 10 | Beijing |


1. **结合**** ****AND       和 OR 运算符**
+ 我们也可以把 AND 和  OR 结合起来（使用圆括号来组成复杂的表达式）:
+ <font style="color:black;">SELECT * FROM Persons WHERE </font><font style="color:#0000DD;">(</font><font style="color:black;">FirstName='Thomas' </font><font style="color:#0000DD;">OR</font><font style="color:black;"> FirstName='William'</font><font style="color:#0000DD;">)</font><font style="color:black;">  
</font><font style="color:black;">  </font><font style="color:#0000DD;">AND</font><font style="color:black;"> LastName='Carter'</font>
+ **结果：**

| **LastName** | **FirstName** | **Address** | **City** |
| --- | --- | --- | --- |
| Carter | Thomas | Changan Street | Beijing |
| Carter | William | Xuanwumen 10 | Beijing |



