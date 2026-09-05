# MySQL索引

> 分类：Database / 第12章：MySQL索引
> 原文：https://www.cuiliangblog.cn/detail/section/31461124
> 来源：崔亮的博客

---

    1. 索引是一种可以让SELECT语句提高效率的一种数据结构
    2. 索引的优缺点
    - 优点：某些情况下使SELECT语句大幅提高效率，合适的索引可以优化MySQL服务器的查询性能，从而起到优化MySQL的作用
    - 缺点：表行数据的变化（insert, update,       delete），建立在表列上的索引也会自动维护，一定程度上会使DML操作变慢；索引会占用磁盘额外的存储空间


