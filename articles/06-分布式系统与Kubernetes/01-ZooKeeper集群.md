# ZooKeeper 集群与运维

ZooKeeper 通过 quorum 提供一致性，生产建议奇数节点并部署在故障域分散的主机。重点监控 leader、同步延迟、磁盘、连接数和 znode 数量。

```bash
echo ruok | nc 127.0.0.1 2181
echo mntr | nc 127.0.0.1 2181
```

不要把 ZooKeeper 当通用数据库；变更前备份配置并确认客户端超时、重连和会话语义。
