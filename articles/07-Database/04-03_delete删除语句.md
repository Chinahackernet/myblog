# delete删除语句

> 分类：Database / 第4章：SQL数据操纵
> 原文：https://www.cuiliangblog.cn/detail/section/31451610
> 来源：崔亮的博客

---

    1. **DELETE 语句**
+ DELETE  语句用于删除表中的行。
+ **语法**
+ DELETE FROM 表名称 WHERE 列名称 = 值
    1. **Person:**

| **LastName** | **FirstName** | **Address** | **City** |
| --- | --- | --- | --- |
| Gates | Bill | Xuanwumen 10 | Beijing |
| Wilson | Fred | Zhongshan 23 | Nanjing |


    1. **删除某行**
+ "Fred  Wilson" 会被删除：
+ DELETE FROM Person WHERE  LastName = 'Wilson' 
+ **结果:**

| **LastName** | **FirstName** | **Address** | **City** |
| --- | --- | --- | --- |
| Gates | Bill | Xuanwumen 10 | Beijing |


    1. **删除所有行**
+ 可以在不删除表的情况下删除所有的行。这意味着表的结构、属性和索引都是完整的：
+ DELETE FROM table_name
+ 或者：
+ DELETE * FROM table_name


