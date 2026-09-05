# SELECT INTO 语句

> 分类：Database / 第8章：SQL高级
> 原文：https://www.cuiliangblog.cn/detail/section/31451712
> 来源：崔亮的博客

---

+ **SQL SELECT INTO  语句可用于创建表的备份复件。**
    1. **SELECT INTO 语句**
+ SELECT INTO  语句从一个表中选取数据，然后把数据插入另一个表中。
+ SELECT INTO  语句常用于创建表的备份复件或者用于对记录进行存档。
+ **SQL SELECT INTO 语法**
+ 您可以把所有的列插入新表：
+ SELECT *  
  INTO new_table_name [IN externaldatabase]   
  FROM old_tablename
+ 或者只把希望的列插入新表：
+ SELECT column_name(s)  
  INTO new_table_name [IN externaldatabase]   
  FROM old_tablename
    1. **SQL SELECT INTO 实例 - 制作备份复件**
+ 下面的例子会制作  "Persons" 表的备份复件：

|        1 <br/>       2 <br/>       3  | <font style="color:#3B6AC8;">SELECT</font><font style="color:#323232;"> *</font><br/><font style="color:#3B6AC8;">INTO</font><font style="color:#323232;"> Persons_backup</font><br/><font style="color:#3B6AC8;">FROM</font><font style="color:#323232;"> Persons</font> |
| --- | --- |


+ IN  子句可用于向另一个数据库中拷贝表：
+ <font style="color:#0000DD;">SELECT</font><font style="color:black;"> *  
</font><font style="color:black;">  </font><font style="color:#0000DD;">INTO</font><font style="color:black;"> Persons </font><font style="color:#0000DD;">IN</font><font style="color:black;"> 'Backup.mdb'  
</font><font style="color:black;">  FROM Persons</font>
+ 如果我们希望拷贝某些域，可以在  SELECT 语句后列出这些域：
+ <font style="color:#0000DD;">SELECT</font><font style="color:black;"> LastName,FirstName  
</font><font style="color:black;">  </font><font style="color:#0000DD;">INTO</font><font style="color:black;"> Persons_backup  
</font><font style="color:black;">  FROM Persons</font>
    1. **SQL SELECT INTO 实例 - 带有 WHERE 子句**
+ 我们也可以添加  WHERE 子句。
+ 下面的例子通过从  "Persons" 表中提取居住在 "Beijing" 的人的信息，创建了一个带有两个列的名为  "Persons_backup" 的表：
+ <font style="color:#0000DD;">SELECT</font><font style="color:black;"> LastName,Firstname  
</font><font style="color:black;">  </font><font style="color:#0000DD;">INTO</font><font style="color:black;"> Persons_backup  
</font><font style="color:black;">  FROM Persons  
</font><font style="color:black;">  </font><font style="color:#0000DD;">WHERE</font><font style="color:black;"> City='Beijing'</font>
    1. **SQL SELECT INTO 实例 - 被连接的表**
+ 从一个以上的表中选取数据也是可以做到的。
+ 下面的例子会创建一个名为  "Persons_Order_Backup" 的新表，其中包含了从 Persons 和 Orders 两个表中取得的信息：
+ <font style="color:#0000DD;">SELECT</font><font style="color:black;"> Persons.LastName,Orders.OrderNo  
</font><font style="color:black;">  </font><font style="color:#0000DD;">INTO</font><font style="color:black;"> Persons_Order_Backup  
</font><font style="color:black;">  </font><font style="color:#0000DD;">FROM</font><font style="color:black;"> Persons  
</font><font style="color:black;">  </font><font style="color:#0000DD;">INNER JOIN</font><font style="color:black;"> Orders  
</font><font style="color:black;">  </font><font style="color:#0000DD;">ON</font><font style="color:black;"> Persons.Id_P=Orders.Id_P</font>


