# MongoDB简介

> 分类：Database / 第19章：MongoDB
> 原文：https://www.cuiliangblog.cn/detail/section/31466599
> 来源：崔亮的博客

---

# 一、MongoDB简介
1. MongoDB是由10gen公司（现已改名为MongoDB      Inc.）用C++语言研发的一款数据库，于2009年开源
2. MongoDB按照类似于JSON的格式存储数据，称作BSON      (binary json)，由成对的field和value构成，value除了数值和字符之外也可以包括数组([ ])，其他文档等
3. ![](assets/07-Database/9d4893dc9ccd6d8cbc04.png)
4. 每一条数据称作一个文档(document)
5. 相对传统关系型数据库，文档之间可以有不一样的格式（字段field），因此更加灵活
6. 可以为数据创建索引，使用特定查询方式来分析统计数据
7. MongoDB开源免费，遵从GNU GPL协定

# 二、MongoDB使用的业务场景
1. 适用于：
+ 存储表结构不确定或经常变换的业务数据
+ 数据量很大，但价值较低的数据
+ 数据实时性要求高的数据，MongoDB批量插入性能非常高
2. 不适用于：
+ 对事务要求高的业务；和传统关系型数据库比较，MongoDB对事务的支持较差
+ 需要使用SQL的业务场景


