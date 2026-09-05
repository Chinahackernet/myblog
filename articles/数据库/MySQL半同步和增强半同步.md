#### 增强半同步：after\_sync

  

##### 工作原理

  

```plain
master将新的事务写入binlog（buffer），
然后发送给slave并开启一个ack线程用于接收slave的ack应答，
然后master将自己的binlog sync到disk并等待slave的ack应答，
只有接收了ack应答才会commit。对于客户端来说，
他们看到的数据是一样的，因为他们看到的数据都是在接收slave的ack应答后才提交数据。
这种情况下，如果master突然故障，不会丢失数据，因为所有事务都写进slave的relay log中了，
slave的数据是最新的。
```

  

#### 半同步：after\_commit

  

##### 工作原理

  

```plain
master将新的事务写入binlog（buffer），然后发送给slave，
再然后直接sync到disk，然后直接commit，之后才接收slave的ack应答返回给客户端。
不同客户端看到的数据可能不一样，对于发起事务的那个客户端，
只有在master提交事务且收到slave的ack后才能看到提交的数据。
但对于那些非本次事务的客户端，他们在master提交后就能看到数据，
这时候master可能都还没收到slave的ack应答。
```