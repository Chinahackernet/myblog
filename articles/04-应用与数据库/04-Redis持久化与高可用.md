# Redis 持久化与高可用

RDB 适合周期性快照，AOF 记录写操作；选择取决于数据可重建性和丢失窗口。生产必须限制危险命令、启用认证/ACL、绑定可信网络并监控内存淘汰。

```bash
redis-cli INFO replication
redis-cli INFO persistence
redis-cli --latency -h <HOST>
```

哨兵、Cluster 和主从解决的问题不同；切换演练要验证客户端重连、数据一致性和脑裂保护。
