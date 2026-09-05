# redis的key

> 分类：Database / 第20章：Redis
> 原文：https://www.cuiliangblog.cn/detail/section/31467502
> 来源：崔亮的博客

---

# 一、简介
1. redis的key用来定位数据，可以想象成引用数据的标签
2. key在当前数据库中不能有重值（默认16个数据库，数据库可以想象成分类目录，一般情况一个业务系统的数据放在一个数据库中）

![](assets/07-Database/25e7f67a138ca07ca376.png)

1. key的名字不宜过长（超过1024），否则影响性能
2. key最多可以存512M
3. key命名规则除了<font style="color:red;">空格、</font><font style="color:red;">\n</font>换行外，其他的字符都可以

# 二、key命令
1. 语法

Redis 键命令的基本语法如下：

<font style="color:black;">redis </font><font style="color:#006666;">127.0</font><font style="color:#666600;">.</font><font style="color:#006666;">0.1</font><font style="color:#666600;">:</font><font style="color:#006666;">6379</font><font style="color:#666600;">></font><font style="color:black;"> COMMAND KEY_NAME</font>

1. 实例

<font style="color:black;">redis </font><font style="color:#006666;">127.0</font><font style="color:#666600;">.</font><font style="color:#006666;">0.1</font><font style="color:#666600;">:</font><font style="color:#006666;">6379</font><font style="color:#666600;">></font><font style="color:black;"> SET runoobkey redis  
</font><font style="color:black;">OK  
</font><font style="color:black;">redis </font><font style="color:#006666;">127.0</font><font style="color:#666600;">.</font><font style="color:#006666;">0.1</font><font style="color:#666600;">:</font><font style="color:#006666;">6379</font><font style="color:#666600;">></font><font style="color:black;">DEL runoobkey  
</font><font style="color:#666600;">(</font><font style="color:black;">integer</font><font style="color:#666600;">) </font><font style="color:#006666;">1</font>

+ 在以上实例中 DEL 是一个命令， runoobkey 是一个键。      如果键被删除成功，命令执行后输出 (integer) 1，否则将输出 (integer) 0
1. Redis      keys 命令
2. 查看key

| 命令 | 描述 |
| --- | --- |
| exists key | 查找指定key是否存在 |
| keys pattern | 通配符匹配符合条件的key |
| dbsize | 查看当前数据库key数量 |
| type key | 查看key的值类型 |


1. 删除key

| 命令 | 描述 |
| --- | --- |
| del key1   key2 | 删除指定key |
| flushdb | 删除当前数据库的所有key |
| flushall | 删除所有数据库中的key |


1. 修改key

| 命令 | 描述 |
| --- | --- |
| rename   oldkey newkey | 重命名key |


1. 其他操作

| 命令 | 描述 |
| --- | --- |
| expire key   seconds | 指定key过期时间，秒为单位，过期后自动删除 |
| ttl key | 返回key过期时间 |
| select   dbname | 选择数据库 |
| move key   dbname | 将key移动到指定数据库 |


# 三、示例
1. keys *查询所有key

![](assets/07-Database/98151928ce20760d38b7.png)

1. exists查看key是否存在

![](assets/07-Database/3badcf387082d950d835.png)

+ 返回1为存在，0为不存在
1. absize查看当前数据库数量

![](assets/07-Database/dab234c1fe310c9559bc.png)

1. type key查看key对应value的数据类型

![](assets/07-Database/07c7bca2ce097f90954a.png)

1. del删除指定key

![](assets/07-Database/4c2df8db5eb9ab14da68.png)

1. rename重命名key

![](assets/07-Database/4eefe15711c5166c8d87.png)

1. expire设置key过期时间

![](assets/07-Database/29085109c2a355a71dfb.png)

1. ttl查看key过期时间

![](assets/07-Database/517b6c7b8ebaa3cb5e13.png)

 


