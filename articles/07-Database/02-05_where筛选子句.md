# where筛选子句

> 分类：Database / 第2章：SQL查询-简单查询
> 原文：https://www.cuiliangblog.cn/detail/section/31323408
> 来源：崔亮的博客

---

1. **WHERE 子句**
+ 如需有条件地从表中选取数据，可将  WHERE 子句添加到 SELECT 语句。
+ **语法**
+ SELECT 列名称 FROM 表名称 WHERE 列 运算符 值
+ 下面的运算符可在  WHERE 子句中使用：

| **操作符** | **描述** |
| --- | --- |
| = | 等于 |
| <> | 不等于 |
| > | 大于 |
| < | 小于 |
| >= | 大于等于 |
| <= | 小于等于 |
| BETWEEN | 在某个范围内 |
| LIKE | 搜索某种模式 |


1. where子句对行记录进行过滤
+ 常用算数运算符：+,-,*, / 对应 加，减，乘，除
+ 常用逻辑运算符：and (而且)；or(或者)；not (非）
+ 常用比较运算符：
+ = 等于；!=或<>不等于；>大于；<小于；>=大于等于；<=小于等于；
+ is null为空值；is not null为非空值；
+ in (值列表) 在值列表中；not in (值列表)不在值列表中；
+ between 低值 and 高值       （包含低值和高值）在低值和高值之间；
+ not between 低值 and 高值       （包含低值和高值）不在低值和高值范围内；
+ like ‘通配符’按照通配符进行匹配；
+ 常用通配符：% 匹配0个或任意多个字符；_ 匹配任意1个字符 
+  
+ 运算符优先级
+ 各类运算符之间存在优先级，不用死记，只记住括号( )的优先级最高即可
+ **注释：**在某些版本的 SQL 中，操作符 <> 可以写为 !=。
2. **使用**** ****WHERE       子句**
+ 如果只希望选取居住在城市  "Beijing" 中的人，我们需要向 SELECT 语句添加 WHERE 子句：
+ <font style="color:black;">SELECT * FROM Persons </font><font style="color:#0000DD;">WHERE City='Beijing'</font>
+ **"Persons" 表**

| **LastName** | **FirstName** | **Address** | **City** | **Year** |
| --- | --- | --- | --- | --- |
| Adams | John | Oxford Street | London | 1970 |
| Bush | George | Fifth Avenue | New York | 1975 |
| Carter | Thomas | Changan Street | Beijing | 1980 |
| Gates | Bill | Xuanwumen 10 | Beijing | 1985 |


+ **结果：**

| **LastName** | **FirstName** | **Address** | **City** | **Year** |
| --- | --- | --- | --- | --- |
| Carter | Thomas | Changan Street | Beijing | 1980 |
| Gates | Bill | Xuanwumen 10 | Beijing | 1985 |


1. **引号的使用**
+ 请注意，我们在例子中的条件值周围使用的是单引号。
+ SQL 使用单引号来环绕**文本值**（大部分数据库系统也接受双引号）。如果是**数值**，请不要使用引号。
+ **文本值：**
+ <font style="color:black;">这是正确的：</font><font style="color:black;">  
</font><font style="color:black;">  SELECT * FROM Persons WHERE </font><font style="color:#0000DD;">FirstName='Bush'</font>
+ <font style="color:black;">这是错误的：</font><font style="color:black;">  
</font><font style="color:black;">  SELECT * FROM Persons WHERE </font><font style="color:red;">FirstName=Bush</font>
+ **数值：**
+ <font style="color:black;">这是正确的：</font><font style="color:black;">  
</font><font style="color:black;">  SELECT * FROM Persons WHERE </font><font style="color:#0000DD;">Year>1965</font>
+ <font style="color:black;">这是错误的：  
</font><font style="color:black;">  SELECT * FROM Persons WHERE </font><font style="color:red;">Year>'1965'</font>


