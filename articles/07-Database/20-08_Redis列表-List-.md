# Redis列表(List)

> 分类：Database / 第20章：Redis
> 原文：https://www.cuiliangblog.cn/detail/section/31467482
> 来源：崔亮的博客

---

# 一、简介
    1. Redis列表是简单的字符串列表，按照插入顺序排序。你可以添加一个元素到列表的头部（左边）或者尾部（右边），这使得list既可以用作栈，也可以用作队列。
    2. 一个列表最多可以包含 232 - 1 个元素       (4294967295, 每个列表超过40亿个元素)。

# 二、命令
    1. 添加list元素

| 命令 | 描述 |
| --- | --- |
| lpush key    value1 valueN  | 左侧添加元素到列表（头部添加） |
| rpush key    value1 valueN | 右侧添加元素到列表（尾部添加） |
| linsert    key BEFORE|AFTER pivot value | 将值 value 插入到列表 key 当中，位于值 pivot 之前或之后。 |


    1. 查看list元素

| 命令 | 描述 |
| --- | --- |
| lrange    key start end | 获取链表中从start开始到end的值，start从0开始计，倒数第一元素的位置为-1 |
| llen key | 获得列表元素的个数 |
| lindex    key 位置 | 获取指定位置列表的值 |


    1. 移出list元素

| 命令 | 描述 |
| --- | --- |
| lpop key | 左侧获取并删除一个元素(头部删除) |
| rpop key | 右侧获取并删除一个元素（尾部删除） |
| lrem key    count value | 删除指定value的元素 |
| ltrim key count value | 保留指定范围内的元素，其他的删除 |


    1. 操作list元素

| 命令 | 描述 |
| --- | --- |
| lset key    index value | 通过索引来设置元素的值 |


# 三、操作实例
    1. lpush左侧添加元素到一个列表(头部添加)
+ ![](assets/07-Database/8869dd81599b94b7d78f.png)
    1. lrange从左侧开始查看列表内容
+ ![](assets/07-Database/e9a5b516d648f42ebf56.png)
    1. llen获得列表元素的个数
+ ![](assets/07-Database/a8bd1faadfba46aac0ea.png)
    1. rpush右侧添加元素到一个列表(尾部添加)
+ ![](assets/07-Database/bf63b99f07e3fe0b7cf8.png)
    1. lpop左侧获取并删除一个元素(头部删除)
+ ![](assets/07-Database/df8bd8dc8e41cdfc916f.png)
    1. rpop右侧获取并删除一个元素(尾部删除)
+ ![](assets/07-Database/18e616162a6f20f8344f.png)
    1. lindex获取指定位置列表的值
+ ![](assets/07-Database/abfe86c9cad0b9e2bc5f.png)
    1. linsert插入指定位置的新元素
+ ![](assets/07-Database/068baea4b2517a7b483b.png)
    1. lset修改指定位置元素的值
+ ![](assets/07-Database/b221e5bd943f328885a7.png)
    1. lrem删除指定value的元素
    - lrem key count value
    - 如果count=0，删除所有指定value值的元素
    - 如果count>0，从左删除count个value值的元素
    - 如果count<0，从右删除count个value值的元素
+ ![](assets/07-Database/fcdfa8f9f8f2d0344243.png)
    2. ltrim保留指定范围内的元素，其他的删除
+ ![](assets/07-Database/7d11b4a925a8d7c58f9c.png)


