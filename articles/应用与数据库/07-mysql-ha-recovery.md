# MySQL 企业级管理：索引、复制、高可用与时间点恢复

## 1. 逻辑架构与容量边界

MySQL 请求依次经过连接管理、解析/优化、执行器、存储引擎和 redo/undo/binlog。性能问题要区分 CPU、锁、buffer pool 命中、磁盘 fsync、网络和复制延迟，不能只看 QPS。生产基线包括字符集、时区、`sql_mode`、表结构、备份策略、账号权限和参数变更记录。

## 2. 索引与执行计划

索引设计以谓词、排序、连接和选择性为依据，联合索引遵循最左前缀；覆盖索引减少回表但增加写放大和 buffer pool 压力。`EXPLAIN ANALYZE` 用实际执行统计验证估算误差，重点看行数、过滤率、临时表、排序和回表次数。

```sql
EXPLAIN ANALYZE
SELECT o.id, o.created_at
FROM orders o JOIN users u ON u.id=o.user_id
WHERE u.tenant_id=42 AND o.created_at >= NOW() - INTERVAL 1 DAY
ORDER BY o.created_at DESC LIMIT 100;
SHOW INDEX FROM orders;
```

慢查询治理应先采样和归因，再改 SQL/索引。开启慢日志要设置阈值、采样比例和脱敏；用 `performance_schema`、sys schema 观察锁等待、表 I/O 和 digest，禁止直接在高峰执行大范围 `OPTIMIZE TABLE`。

## 3. 事务、锁与一致性

明确隔离级别、长事务上限、死锁重试和幂等语义。通过 `sys.innodb_lock_waits`、`SHOW ENGINE INNODB STATUS` 和事务开始时间定位锁阻塞；处理顺序是识别持锁业务、评估回滚成本、通知负责人、必要时终止最安全的会话，而不是批量 kill。

## 4. 半同步、MHA/Galera 与切换

异步复制延迟低但故障切换可能丢失已提交事务；半同步要求至少一个副本确认接收 binlog，可降低丢失窗口但增加提交延迟。切换前检查 `SHOW REPLICA STATUS`、GTID、只读状态、延迟、错误和数据校验。MHA 适合传统主从自动故障转移；Galera 提供多主写入但对网络、冲突和大事务敏感，不能把两者视为同一模型。

```sql
SHOW BINARY LOG STATUS;
SHOW REPLICA STATUS\G
SELECT @@gtid_executed, @@read_only, @@super_read_only;
```

切换必须冻结写入或启用应用层 fencing，提升新主后再逐步放量。旧主恢复不能直接加入写流量，先清理漂移事务、重建复制并确认唯一主身份。

## 5. 备份、PITR 与灾备演练

完整恢复链为全量备份 + 连续 binlog + 目标时间点前的校验。备份需记录 GTID/binlog 位点、校验和、加密密钥版本和保留策略。恢复流程应在新实例执行：还原全量→应用 binlog 到目标时间→业务校验→切换连接→保留旧实例观察。

```bash
mysql -e 'FLUSH BINARY LOGS; SHOW BINARY LOGS;'
mysqlbinlog --read-from-remote-server --raw --host=primary \
  --result-file=/backup/binlog/ mysql-bin.000123
mysql --binary-mode < backup.sql
mysqlbinlog --stop-datetime='2026-09-04 10:30:00' binlog.* | mysql
```

演练覆盖误删、主库磁盘损坏、复制中断、半同步无可用副本、MHA 切换失败和 Galera quorum 丢失。RPO/RTO 由业务确认，恢复后必须做行数、关键聚合、应用读写和权限校验。

## 6. 参数治理与安全边界

`innodb_buffer_pool_size`、redo 容量、并发连接、临时表、binlog 保留和刷盘策略应结合工作集、写入速率、磁盘延迟和恢复窗口设定。任何在线参数变更都要记录旧值、新值、影响范围和撤销命令；不要把经验值当作所有实例的基线。生产账号按应用、迁移、只读报表和运维职责拆分，禁止应用账号拥有 SUPER、FILE 或全库 DDL 权限。

```sql
SELECT * FROM sys.schema_table_lock_waits LIMIT 20;
SELECT * FROM performance_schema.replication_applier_status_by_worker;
SHOW VARIABLES LIKE 'innodb%log%';
```

恢复切换完成后保留旧主只读，持续比对关键表计数、校验和、业务订单/账务汇总和 binlog 位点。若发现数据分叉，立即停止双向写入并冻结证据；不要以“最新时间戳覆盖”解决未知冲突。
