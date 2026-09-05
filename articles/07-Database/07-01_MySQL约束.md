# MySQL约束

> 分类：Database / 第7章：SQL约束
> 原文：https://www.cuiliangblog.cn/detail/section/31451721
> 来源：崔亮的博客

---

# 一、约束的作用
1. 约束(constraint)是数据库用来提高数据质量和保证数据完整性的一套机制
2. 约束作用在表列上，是表定义(DDL语句)的一部分

# 二、约束分类
1. 非空约束 (not null)

insert，update数据时是不允许空值(null)

1. 唯一性约束 (unique)

insert，update数据时不允许重值，可以允许空值，自动创建唯一性索引

1. 主键约束 (primary key)

非空约束 + 唯一约束。主键的列不允许有重值和空值，自动创建唯一性索引

1. 外键约束 (foreign key)

引用主键构成完整性约束。允许有空值，不允许存在对应主键约束的列所有数值以外的其它值

# 三、约束的定义方式
1. 创建表时建立约束（事中）

建表之前就已经规划好了

+ 列级定义

create table t (id int primary key,name char(10));

+ 表级定义

create table t (id int,name char(10),primary key(id));

1. 修改表时追加约束（事后）

建表之后根据需要追加

+ 追加定义

alter table t add primary key(id);

# 四、查看约束
1. desc table_name;
2. show create table      table_name\G
3. show keys from      table_name; 看不了非空约束
4. show index from      table_name;看不了非空约束

![](assets/07-Database/d30ee333b4e40c34ae8e.png)

![](assets/07-Database/3da08ff58a7bcea9f53c.png)

 

 


