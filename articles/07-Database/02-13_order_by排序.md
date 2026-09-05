# order by排序

> 分类：Database / 第2章：SQL查询-简单查询
> 原文：https://www.cuiliangblog.cn/detail/section/31311864
> 来源：崔亮的博客

---

# 一、简介
1. **ORD****ER BY 语句**

ORDER BY  语句用于根据指定的列对结果集进行排序。

ORDER BY  语句默认按照升序对记录进行排序。

如果您希望按照降序对记录进行排序，可以使用  DESC 关键字。

# 二、示例
1. **原始的表 (用在例子中的)：**
+ Orders 表:

| Company | OrderNumber |
| --- | --- |
| IBM | 3532 |
| W3School | 2356 |
| Apple | 4698 |
| W3School | 6953 |


2. **实例**** ****1**

以字母顺序显示公司名称：

`<font style="color:black;">SELECT Company, OrderNumber FROM  Orders ORDER BY  Company</font>`

+ **结果：**

| Company | OrderNumber |
| --- | --- |
| Apple | 4698 |
| IBM | 3532 |
| W3School | 6953 |
| W3School | 2356 |


3. **实例**** ****2**

以字母顺序显示公司名称（Company），并以数字顺序显示顺序号（OrderNumber）：

<font style="color:black;">SELECT Company, OrderNumber FROM  Orders </font><font style="color:#0000DD;">ORDER BY  Company, OrderNumber</font>

+ 结果：

| Company | OrderNumber |
| --- | --- |
| Apple | 4698 |
| IBM | 3532 |
| W3School | 2356 |
| W3School | 6953 |


4. **实例**** ****3**

以逆字母顺序显示公司名称：

<font style="color:black;">SELECT Company, OrderNumber FROM  Orders </font><font style="color:#0000DD;">ORDER BY  Company DESC</font>

+ **结果：**

| Company | OrderNumber |
| --- | --- |
| W3School | 6953 |
| W3School | 2356 |
| IBM | 3532 |
| Apple | 4698 |


5. **实例 4**

以逆字母顺序显示公司名称，并以数字顺序显示顺序号：

<font style="color:black;">SELECT Company, OrderNumber FROM  Orders </font><font style="color:#0000DD;">ORDER BY  Company DESC, OrderNumber ASC</font>

+ **结果：**

| Company | OrderNumber |
| --- | --- |
| W3School | 2356 |
| W3School | 6953 |
| IBM | 3532 |
| Apple | 4698 |


+ **注意：**<font style="color:black;">在以上的结果中有两个相等的公司名称  (W3School)。只有这一次，在第一列中有相同的值时，第二列是以升序排列的。如果第一列中有些值为 nulls 时，情况也是这样的。</font>


