# Redis事务

> 分类：Database / 第20章：Redis
> 原文：https://www.cuiliangblog.cn/detail/section/31467468
> 来源：崔亮的博客

---

# 一、Redis 事务
1. Redis 事务可以一次执行多个命令， 并且带有以下三个重要的保证：
+ 批量操作在发送 EXEC      命令前被放入队列缓存。
+ 收到 EXEC      命令后进入事务执行，事务中任意命令执行失败，其余的命令依然被执行。
+ 在事务执行过程，其他客户端提交的命令请求不会插入到事务执行命令序列中。
2. 一个事务从开始到执行会经历以下三个阶段：
+ 开始事务。
+ 命令入队。
+ 执行事务。

# 二、实例
1. 以下是一个事务的例子， 它先以 **MULTI** 开始一个事务，      然后将多个命令入队到事务中， 最后由 **EXEC** 命令触发事务， 一并执行事务中的所有命令：

<font style="color:black;">redis </font><font style="color:#006666;">127.0</font><font style="color:#666600;">.</font><font style="color:#006666;">0.1</font><font style="color:#666600;">:</font><font style="color:#006666;">6379</font><font style="color:#666600;">></font><font style="color:black;"> MULTI  
</font><font style="color:black;">OK</font>

<font style="color:black;">redis </font><font style="color:#006666;">127.0</font><font style="color:#666600;">.</font><font style="color:#006666;">0.1</font><font style="color:#666600;">:</font><font style="color:#006666;">6379</font><font style="color:#666600;">></font><font style="color:black;">SET book</font><font style="color:#666600;">-</font><font style="color:black;">name </font><font style="color:#008800;">"Mastering C++ in 21 days"</font><font style="color:black;">  
</font><font style="color:black;">QUEUED</font>

<font style="color:black;">redis </font><font style="color:#006666;">127.0</font><font style="color:#666600;">.</font><font style="color:#006666;">0.1</font><font style="color:#666600;">:</font><font style="color:#006666;">6379</font><font style="color:#666600;">></font><font style="color:black;">GET book</font><font style="color:#666600;">-</font><font style="color:black;">name  
</font><font style="color:black;">QUEUED</font>

<font style="color:black;">redis </font><font style="color:#006666;">127.0</font><font style="color:#666600;">.</font><font style="color:#006666;">0.1</font><font style="color:#666600;">:</font><font style="color:#006666;">6379</font><font style="color:#666600;">></font><font style="color:black;">SADD tag </font><font style="color:#008800;">"C++" "Programming" "Mastering Series"</font><font style="color:black;">  
</font><font style="color:black;">QUEUED</font>

<font style="color:black;">redis </font><font style="color:#006666;">127.0</font><font style="color:#666600;">.</font><font style="color:#006666;">0.1</font><font style="color:#666600;">:</font><font style="color:#006666;">6379</font><font style="color:#666600;">></font><font style="color:black;">SMEMBERS tag  
</font><font style="color:black;">QUEUED</font>

<font style="color:black;">redis </font><font style="color:#006666;">127.0</font><font style="color:#666600;">.</font><font style="color:#006666;">0.1</font><font style="color:#666600;">:</font><font style="color:#006666;">6379</font><font style="color:#666600;">></font><font style="color:black;">EXEC  
</font><font style="color:#006666;">1</font><font style="color:#666600;">)</font><font style="color:black;"> OK  
</font><font style="color:#006666;">2</font><font style="color:#666600;">) </font><font style="color:#008800;">"Mastering C++ in 21 days"</font><font style="color:black;">  
</font><font style="color:#006666;">3</font><font style="color:#666600;">) (</font><font style="color:black;">integer</font><font style="color:#666600;">)</font><font style="color:#006666;">3</font><font style="color:black;">  
</font><font style="color:#006666;">4</font><font style="color:#666600;">) </font><font style="color:#006666;">1</font><font style="color:#666600;">) </font><font style="color:#008800;">"Mastering Series"</font><font style="color:black;">  
</font><font style="color:black;">   </font><font style="color:#006666;">2</font><font style="color:#666600;">) </font><font style="color:#008800;">"C++"</font><font style="color:black;">  
</font><font style="color:black;">   </font><font style="color:#006666;">3</font><font style="color:#666600;">) </font><font style="color:#008800;">"Programming"</font>

1. 单个 Redis 命令的执行是原子性的，但 Redis      没有在事务上增加任何维持原子性的机制，所以 Redis 事务的执行并不是原子性的。
2. 事务可以理解为一个打包的批量执行脚本，但批量指令并非原子化的操作，中间某条指令的失败不会导致前面已做指令的回滚，也不会造成后续的指令不做。

比如：

<font style="color:black;">redis </font><font style="color:#006666;">127.0</font><font style="color:#666600;">.</font><font style="color:#006666;">0.1</font><font style="color:#666600;">:</font><font style="color:#006666;">7000</font><font style="color:#666600;">></font><font style="color:black;"> multi  
</font><font style="color:black;">OK  
</font><font style="color:black;">redis </font><font style="color:#006666;">127.0</font><font style="color:#666600;">.</font><font style="color:#006666;">0.1</font><font style="color:#666600;">:</font><font style="color:#006666;">7000</font><font style="color:#666600;">> </font><font style="color:#000088;">set</font><font style="color:black;"> a aaa  
</font><font style="color:black;">QUEUED  
</font><font style="color:black;">redis </font><font style="color:#006666;">127.0</font><font style="color:#666600;">.</font><font style="color:#006666;">0.1</font><font style="color:#666600;">:</font><font style="color:#006666;">7000</font><font style="color:#666600;">> </font><font style="color:#000088;">set</font><font style="color:black;"> b bbb  
</font><font style="color:black;">QUEUED  
</font><font style="color:black;">redis </font><font style="color:#006666;">127.0</font><font style="color:#666600;">.</font><font style="color:#006666;">0.1</font><font style="color:#666600;">:</font><font style="color:#006666;">7000</font><font style="color:#666600;">> </font><font style="color:#000088;">set</font><font style="color:black;"> c ccc  
</font><font style="color:black;">QUEUED  
</font><font style="color:black;">redis </font><font style="color:#006666;">127.0</font><font style="color:#666600;">.</font><font style="color:#006666;">0.1</font><font style="color:#666600;">:</font><font style="color:#006666;">7000</font><font style="color:#666600;">> </font><font style="color:#000088;">exec</font><font style="color:black;">  
</font><font style="color:#006666;">1</font><font style="color:#666600;">)</font><font style="color:black;"> OK  
</font><font style="color:#006666;">2</font><font style="color:#666600;">)</font><font style="color:black;"> OK  
</font><font style="color:#006666;">3</font><font style="color:#666600;">)</font><font style="color:black;"> OK</font>

# 三、Redis 事务命令
| **序号** | **命令及描述** |
| --- | --- |
| 1 | [DISCARD](https://www.runoob.com/redis/transactions-discard.html)<br/>取消事务，放弃执行事务块内的所有命令。 |
| 2 | [EXEC](https://www.runoob.com/redis/transactions-exec.html)<br/>执行所有事务块内的命令。 |
| 3 | [MULTI](https://www.runoob.com/redis/transactions-multi.html)<br/>标记一个事务块的开始。 |
| 4 | [UNWATCH](https://www.runoob.com/redis/transactions-unwatch.html)<br/>取消   WATCH 命令对所有 key 的监视。 |
| 5 | [WATCH key [key ...]](https://www.runoob.com/redis/transactions-watch.html)<br/>监视一个(或多个)   key ，如果在事务执行之前这个(或这些) key 被其他命令所改动，那么事务将被打断。 |



