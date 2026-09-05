# redis命令

> 分类：Database / 第20章：Redis
> 原文：https://www.cuiliangblog.cn/detail/section/31467504
> 来源：崔亮的博客

---

# 一、连接radis命令
1. 语法

redis-cli -h host -p port -a password

1. 实例

演示了如何连接到主机为 127.0.0.1，端口为 6379 ，密码为 mypass 的 redis 服务上。

redis-cli -h 127.0.0.1 -p 6379 -a "mypass"

1. 有时候会有中文乱码。要在 redis-cli 后面加上      --raw

redis-cli --raw

# 二、其他常用命令
1. flushdb清空当前数据库的所有值（慎用）
2. select切换数据库

select 15切换到第16个数据库

select 1 切换到第1个数据库

![](assets/07-Database/205731c5316694c907d5.png)

1. scan查看当前数据库的所有key

例如：scan 0 match * count 100 

其中0为产生一个新的游标，match后为匹配模式 *为所有，count 为显示数量

![](assets/07-Database/5f6ff6b0b83c665155d6.png)

![](assets/07-Database/da98efb50d3bbc2a7412.png)


