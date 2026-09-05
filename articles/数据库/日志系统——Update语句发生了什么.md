在[《逻辑架构——Select语句发生了什么》](https://www.yuque.com/coolops/db/ga0ftgmkqrix7eyi?singleDoc# 《逻辑架构——Select语句发生了什么》)中，我们知道执行一条Select语句，它经历了哪些过程。相信你还记得，一条Select语句一般经历`连接器`、`分析器`、`优化器`以及`执行器`等功能模块，最后到达`存储引擎`。

​  

![](assets/数据库/日志系统——Update语句发生了什么/日志系统——Update语句发生了什么-1.png)

  

那对于一条Update语句，又会发生什么呢？

​  

比如我们执行下面一条语句：

```sql
update user set age=age+1 where id=2
```

  

其实，不管是哪种类型的SQL语句，整个执行链路大差不差，还是要走一遍Select的执行流程。

-   通过连接器建立连接，鉴别用户身份
-   更新语句不会经过查询缓存，但是会让查询缓存失效
-   分析器判断是update语句，会构建语法树、做语法和词法分析
-   优化器确定update执行计划
-   执行器负责语句执行操作

​  

与Select操作不同的是，Update操作还会涉及三个日志模块，它们分别是：

-   undo log（回滚日志）：是Innodb存储引擎生成日志，实现事务的原子性，主要做事务回滚和MVCC
-   redo log（重做日志）：是Innodb存储引擎日志，实现事务的持久性，主要用于故障恢复
-   binlog（归档日志）：是Server层日志，实现操作归档，主要用于数据备份和主从复制

​  

本章，我们主要来了解这三个日志模块主要是干什么的。

​  

## 回滚日志——undo log

### 作用

对MySQL的操作都是一条条的SQL语句，如果一条语句执行失败或者在执行语句的过程中，MySQL崩溃了，我们应该怎么办呢？

​  

`undo log`就是用来解决这个问题的。它会记录数据的逻辑变化，比如一条`Insert`语句，对应一条`delete`的`undo log`，对于每个`update`语句，对应一条相反的`update` 的`undo log`，这样在发生异常的时候，就能够通过`undo log`将数据回滚到事务之前。如下图：

​  

![image.png](assets/数据库/日志系统——Update语句发生了什么/日志系统——Update语句发生了什么-2.png)

  

  

所以在做`update`操作的时候，先在`undo log`中记录以下一条日志（假设id=2的原始数据为age=18）：

```sql
update user set age=18 where id = 2
```

​  

如果异常就直接把上面的日志拿来做回滚即可。

​  

另外，`undo log`也是`多版本控制`（`MVCC`）实现的关键。当读取的某一行被其他事务锁定时，它可以从undo log中分析出该行记录以前的数据版本是怎么样的，从而让用户能够读取当前事务操作之前的数据，也就是快照读。

​  

什么是快照读？

​  

SQL读取的数据是快照版本，也就是历史版本，不用加锁，普通的Select语句就是快照读。

​  

与之相反的就是当前读。顾名思义，读取的是当前的数据，也就是最新的数据。通过锁机制来保证读取的数据无法通过其他事务进行修改。`UPDATE`、`DELETE`、`INSERT`、`SELECT ... LOCK IN SHARE MODE`、`SELECT ... FOR UPDATE`都是当前读。

​  

上面就是`undo log`的作用，下面再来看看它的工作原理。

​  

### 工作原理

在更新数据之前，MySQL会提前生成undo log，当事务提交的时候，并不会立即删除undo log，因为后面可能还会进行回滚操作。undo log日志的删除是通过后台purge线程进行回收处理。

​  

下面是一张undo log的工作原理。

![image.png](assets/数据库/日志系统——Update语句发生了什么/日志系统——Update语句发生了什么-3.png)

-   事务A执行UPDATE操作，事务未提交，会将旧数据备份到undo buff，然后再持久化到undo log，此时undo log保存了未提交之前的操作日志，接着将user表中的已经操作的数据持久化到user的数据文件user.ibd中。
-   如果事务A还未提交，事务B的查询操作将从undo buff中读取数据（读取的数据是否一致看事务隔离级别，如果是可重复读，事务期间读取的数据都是事务前的数据，如果是读提交，则可能读取到不一致的数据），如果要回滚，不需要读盘，直接从undo buff中读取。

​  

### 存储机制

undo log的存储由InnoDB存储引擎实现，数据保存在InnoDB的数据文件中。在InnoDB存储引擎中，undo log是采用分段(segment)的方式进行存储的。rollback segment称为回滚段，每个回滚段中有1024个undo log segment。在MySQL5.5之前，只支持1个rollback segment，也就是只能记录1024个undo操作。在MySQL5.5之后，可以支持128个rollback segment，分别从resg slot0 - resg slot127，每一个resg slot，也就是每一个回滚段，内部由1024个undo segment 组成，即总共可以记录128 \* 1024个undo操作。

​  

![image.png](assets/数据库/日志系统——Update语句发生了什么/日志系统——Update语句发生了什么-4.png)

  

如上图，可以看到，undo log日志里面不仅存放着数据更新前的记录，还记录着RowID、事务ID、回滚指针。其中事务ID每次递增，回滚指针第一次如果是insert语句的话，回滚指针为NULL，第二次update之后的undo log的回滚指针就会指向刚刚那一条undo log日志，依次类推，就会形成一条undo log的回滚链，方便找到该条记录的历史版本。

​  

以上就是undo log相关的知识。

​  

## 重做日志——redo log

undo log记录了回滚相关的日志，也就是把后路想好了，那redo log是用来干嘛的呢？

​  

数据库在对数据进行操作的时候，最直接的对象并不是磁盘上的数据，而是一个叫Buffer Pool的东西。

-   当读取数据时，如果数据存在于 Buffer Pool 中，客户端就会直接读取 Buffer Pool 中的数据，否则再去磁盘中读取。
-   当修改数据时，如果数据存在于 Buffer Pool 中，那直接修改 Buffer Pool 中数据所在的页，然后将其页设置为脏页（该页的内存数据和磁盘上的数据已经不一致），为了减少磁盘I/O，不会立即将脏页写入磁盘，后续由后台线程选择一个合适的时机将脏页写入到磁盘。

​  

可以看到Buffer Pool是基于内存的，如果内存里的数据还没有落盘，系统崩溃就会导致数据丢失。

​  

为了防止这种数据丢失，MySQL的innodb引擎使用了redo log，每当有记录更新的时候，Innodb引擎会更新内存，同时标记为脏页，然后将这次修改记录到redo log中，这个时候更新就算完成。

​  

后续，Innodb引擎会在适当的时候将Buffer Pool里的数据刷到磁盘中，这就是WAL（Write-Ahead Logging）技术，它的关键点就是先写日志，再写磁盘。

  

redo log是一种物理日志，记录了某个数据页做了什么操作，每当执行一个事务就会产生一条或者多条物理日志。

​  

在事务提交时，只要redo log持久化到磁盘了，就算Buffer Poll里的脏页数据还未持久化到磁盘，系统异常也能将数据恢复到最新的状态。

​  

redo log和undo log都是innodb引擎层的日志，它们的区别如下：

-   redo log记录的是此次事务完成后的数据状态，记录的是更新之后的值。
-   undo log记录的是此次事务开始前的数据状态，记录的是更新之前的值。

​  

事务提交前系统崩溃，可以基于undo log进行回滚。事务提交后系统崩溃，可以基于redo log恢复事务。

![image.png](assets/数据库/日志系统——Update语句发生了什么/日志系统——Update语句发生了什么-5.png)

  

所以有了 redo log，再通过 WAL 技术，InnoDB 就可以保证即使数据库发生异常重启，之前已提交的记录都不会丢失，这个能力称为 crash-safe（崩溃恢复）。

​  

有了redo log，是不是代表万无一失了呢？

​  

其实不然，为了提升性能与效率，redo log也不是直接写入到磁盘，它也是先进到内存中——redo log buffer。

​  

上面已经提过，内存里的东西总是不安全的。那redo log buffer是什么时候落盘呢？

​  

主要有下面几种场景：

-   MySQL正常关闭时，会统一将buffer刷到磁盘。
-   当redo log buffer中记录的写入量大于其空间的一般半时，会触发落盘
-   InnoDB的后台线程每隔1秒，执行一次落盘
-   每次事务提交时都将redo log buffer里的数据落盘（这个策略由innodb\_flush\_log\_at\_trx\_commit控制）

​  

上面知道了日志什么时候落盘，那如果redo log日志满了应该怎么办呢？

​  

默认情况下，InnoDB引擎有一个重做日志组，它由两个redo log组成，这两个redo log的文件名叫`ib_logfile0` 和 `ib_logfile1`。

​  

每个redo log都是固定的大小，假如每个redo log的大小是1G，那个这个redo log group可记录2G的操作记录。如果满了，就会从开头进行循环写。

![image.png](assets/数据库/日志系统——Update语句发生了什么/日志系统——Update语句发生了什么-6.png)

  

其中：

-   write pos 和 checkpoint 的移动都是顺时针方向；
-   write pos ～ checkpoint 之间的部分（图中的红色部分），用来记录新的更新操作；
-   check point ～ write pos 之间的部分（图中蓝色部分），待落盘的脏数据页记录；

​  

如果 write pos 追上了 checkpoint，就意味着 redo log 文件满了，这时 MySQL 不能再执行新的更新操作，也就是说 MySQL 会被阻塞（因此所以针对并发量大的系统，适当设置 redo log 的文件大小非常重要），此时会停下来将 Buffer Pool 中的脏页刷新到磁盘中，然后标记 redo log 哪些记录可以被擦除，接着对旧的 redo log 记录进行擦除，等擦除完旧记录腾出了空间，checkpoint 就会往后移动（图中顺时针），然后 MySQL 恢复正常运行，继续执行新的更新操作。

​  

有了redo log，InnoDB就可以保证即使数据库发生异常重启，之前提交的数据都不会丢失，这个能力称之为crash-safe。

​  

## 归档日志——binlog

上面已经介绍了undo log和redo log，它们分别做到事前和事后的数据保障，那binlog是用来干什么的呢？

​  

在最开始的时候，MySQL并没有InnoDB存储引擎，它使用的是MyISAM存储引擎，但是MyISAM并没有crash-safe能力，binlog只能用来归档。而InnoDB存储引擎是另一个公司以插件的方式引入MySQL的，为了实现crash-safe能力，InnoDB就引入了redo log。

​  

binlog和redo log主要有以下区别：

-   redo log是InnoDB引擎特有的，binlog是Server层共有的。
-   redo log是物理日志，记录的是“在某个数据页上做了什么修改”，binlog是逻辑日志，记录的是这个语句的原始逻辑。
-   redo log的空间是固定的，写满了会覆盖以前的日志循环写，binlog是追加写，写满了会写下一个文件，不会覆盖以前的日志。

  

如果不小心把数据库的数据删除了，用哪个日志恢复呢？

​  

答案是binlog。

​  

上面介绍过redo log是循环写，它里面记录的是还未被刷入磁盘的数据，已经刷入磁盘的数据是会被清除的。但是binlog就不一样，它是追加写入的，完整的保存了数据变更的所有记录，理论情况下，只要记录在binlog里的数据，都是可以恢复的。

​  

对redo log和binlog有了简单的认识之后，我们再来看执行上面那条UPDATE语句在服务端的内部流程。

1.  执行器先找到id=2这一行，如果数据在buffer pool中，直接返回给执行器，如果不在，则从磁盘加载到buffer pool中再返回。
2.  执行器拿到数据后，对数据进行操作，将新旧数据都传送给InnoDB.
3.  开启事务，InnoDB在更新记录前，先记录undo log，undo log会写入buffer pool的undo页面，不过在内存中修改了对应的undo页面后，会记录redo log。
4.  InnoDB执行更新操作，先更新内存，将更新的页标记为脏页，然后记录到redo log，redo log处于prepare状态，脏页会通过WAL技术刷新到磁盘。
5.  然后开始记录binlog日志，先把记录写到binlog cache，然后再刷入磁盘。
6.  执行器调用引擎的提交事务接口，引擎把刚才的redo log改成commit状态。到此，整个更新流程才完成。

​  

上面把redo log的提交拆分成了prepare和commit两个阶段，也就是所谓的两阶段提交，为什么呢？

​  

redo log和binlog都记录了数据，并且都要刷盘，但是这两个日志模块是独立的逻辑，一个工作在InnoDB引擎层，一个工作在Server层，如果不采用两阶段提交，会出现数据不一致的情况。

​  

比如我们上面执行的`update user set age=age+1 where id = 2`语句，旧数据age=18，新数据age=19，如果redo log和binlog只有一个刷盘成功，会出现下面两种情况。

-   redo log刷盘成功，这个时候数据库崩溃了，binlog还未刷盘。数据库重启过后，能够通过redo log将数据恢复到age=19最新的数据，但是binlog里并没有这条数据，在做主从同步或者基于binlog做数据恢复的时候就会丢失这条数据。
-   binlog刷盘成功，redo log还没刷盘，这时候数据库崩溃了。数据库恢复后，由于redo log里没有最新的数据，会判定这次事务不成功，会基于undo log进行回滚，这时候数据库里的数据是age=18，但是由于binlog落盘成功，所以基于binlog的主从或者进行故障恢复得到的却是新的age=19数据，这时候也会导致数据不一致。

​  

所以为了避免这种半成功状态，MySQL使用了两阶段提交来解决。

​  

redo log和binlog都是先写内存再刷盘，上面已经介绍了redo log的刷盘时机，那binlog是什么时候刷盘呢？

​  

在MySQL中，是通过sync\_binlog参数来控制刷盘的频率，有以下三种配置：

-   sync\_binlog=0，表示每次提交事务只写入，不直接刷盘，由系统决定什么时候落盘。
-   sync\_binlog=1，表示每次提交事务不仅写入，而且直接刷盘。
-   sync\_binlog=N，表示每次提交事务先写入，当累计了N个事务了再刷盘。

​  

它们各有优缺点，根据不同的场景进行选择。

​  

当sync\_binlog=0的时候，性能是最好的，因为直接写到内存里，但是如果数据库崩溃，在内存中的数据就会丢失，导致数据不一致。

​  

当sync\_binlog=1的时候，性能损耗很大，因为每次都要写磁盘，但是安全性最高，就算数据库崩溃，最多也就丢失当前一个事务的binlog。

​  

sync\_binlog=N是一个折中方案，如果允许丢失N个事务，并且需要性能优势，可以选择这种方式。

​  

## 总结

上面就是MySQL日志模块的介绍，如果执行`update user set age=age+1 where id=2`，整个处理流程如下：

1.  通过连接器建立连接，进行用户认证。
2.  由于是update操作，不走查询缓存，但是update会导致查询缓存失效。
3.  分析器对语句进行词法和语法分析。
4.  优化器确定语句的执行计划。
5.  执行器通过执行计划，调用InnoDB引擎，在索引数中找到id=2这条记录。

1.  如果该记录在Buffer pool中，直接返回给执行器。
2.  如果该记录不在buffer pool中，则从磁盘加载到buffer pool中，再返回给执行器。

6.  执行器得到记录后，对记录进行操作，然后将新旧数据都传给InnoDB引擎。
7.  开启事务，InnoDB在更新记录前，先记录undo log，undo log会写入buffer pool的undo页面，不过在内存中修改了对应的undo页面后，会记录redo log。
8.  InnoDB执行更新操作，先更新内存，将更新的页标记为脏页，然后记录到redo log，redo log处于prepare状态，脏页会通过WAL技术刷新到磁盘。
9.  然后开始记录binlog日志，先把记录写到binlog cache，然后再刷入磁盘。
10.  执行器调用引擎的提交事务接口，引擎把刚才的redo log改成commit状态。
11.  到此，一条update更新语句执行完成。

  

## 文档

-   [《MySQL 日志：undo log、redo log、binlog 有什么用？》](https://xiaolincoding.com/mysql/log/how_update.html#%E4%B8%BA%E4%BB%80%E4%B9%88%E9%9C%80%E8%A6%81-undo-log)
-   [《MySQL实战45讲》](https://time.geekbang.org/column/article/68633?cid=100020801)
-   [《MySQL回滚日志总计》](https://blog.csdn.net/Weixiaohuai/article/details/117867353)