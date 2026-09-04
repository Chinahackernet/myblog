# MySQL 索引、执行计划、慢查询与复制

## 1. 索引设计

InnoDB 聚簇主键决定数据物理组织；二级索引叶子节点保存主键。联合索引遵循最左前缀，选择性、排序和覆盖列决定收益。索引不是越多越好：每个索引都会增加写放大、空间和 buffer pool 压力。

```sql
EXPLAIN ANALYZE SELECT id, status FROM orders WHERE tenant_id=7 AND created_at>=NOW()-INTERVAL 1 DAY ORDER BY created_at DESC LIMIT 50;
SHOW INDEX FROM orders;
```

关注实际行数与估算行数、访问类型、回表、排序和临时表。对生产查询使用影子流量或只读副本验证，避免直接在高峰创建大索引。

## 2. 慢查询与容量

开启慢查询日志并设置合理阈值，结合 digest 聚合，而非追逐单条语句。监控 buffer pool 命中率、历史列表长度、锁等待、redo 写入、复制延迟和连接使用率。连接池上限必须小于数据库线程和 CPU 承载能力。

## 3. 复制与半同步

GTID 复制简化故障切换；半同步只保证至少一个副本确认收到日志，不等于副本已落盘或业务一致。切换前检查 `Seconds_Behind_Source`、并行复制状态、只读标志和应用连接路由。

```sql
SHOW REPLICA STATUS\G
SELECT * FROM performance_schema.replication_applier_status_by_worker;
```

## 故障排查

慢查询先看计划和锁；复制延迟区分网络、单线程应用、DDL 和大事务；主库不可写时先冻结自动切换，确认数据位点和业务幂等。任何强制跳过事务都要记录 GTID、原因和补偿方案。

## 执行计划实验

在只读副本建立代表性数据量，使用 `EXPLAIN ANALYZE` 比较索引前后实际耗时、行数和临时表；不要用开发环境小表推断生产计划。对参数化查询关注数据分布变化、直方图和统计信息过期。索引上线采用在线 DDL 或影子表，提前评估锁等待、redo 增长和磁盘空间。

## 复制安全门禁

切换前检查 GTID 集合、复制线程、只读变量、延迟趋势、未完成事务和 binlog 保留窗口。半同步 ACK 只说明日志到达某个副本，不保证应用已经读到；跨地域链路要把 RTT 和故障降级行为写入 SLO。大事务拆分、DDL 排程和并行复制参数都应经过压测。

故障后禁止直接删除 relay log 或执行 `RESET MASTER`。先采集状态、位点和错误日志，制作副本，再按恢复方案处理；若数据出现分歧，必须通过校验工具和业务对账决定修复，不可凭行数判断一致。
