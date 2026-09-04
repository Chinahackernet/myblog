# MySQL 复制、备份与恢复

备份策略应由 RPO/RTO 驱动：逻辑备份便于迁移，物理备份适合大数据量，binlog 用于时间点恢复。复制延迟、错误和 GTID 必须监控。

```sql
SHOW REPLICA STATUS\G;
SHOW BINARY LOG STATUS;
```

恢复演练要在隔离环境执行，校验表数量、关键数据、权限、应用连接和恢复耗时；不要把复制副本误当作独立备份。
