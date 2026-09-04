# MySQL SQL、事务、锁与表设计

## 关系模型

先定义实体、主键、唯一约束、外键和删除语义，再根据访问模式设计索引。避免把状态、金额和时间存成不可排序的字符串；字符集、排序规则、时区和精度必须在建表时固定。

```sql
CREATE TABLE order_item (
  id BIGINT UNSIGNED PRIMARY KEY,
  order_id BIGINT UNSIGNED NOT NULL,
  sku_id BIGINT UNSIGNED NOT NULL,
  quantity INT UNSIGNED NOT NULL,
  created_at TIMESTAMP(6) NOT NULL,
  UNIQUE KEY uk_order_sku (order_id, sku_id),
  KEY idx_sku_created (sku_id, created_at)
) ENGINE=InnoDB;
```

## 事务与锁

隔离级别决定一致性与并发。InnoDB 的 next-key lock、间隙锁和索引选择会影响范围更新；缺少合适索引的 `UPDATE` 可能锁住远多于预期的记录。长事务会阻塞 purge、扩大 undo 和复制延迟。

```sql
SELECT * FROM performance_schema.data_locks;
SELECT * FROM performance_schema.data_lock_waits;
```

事务必须短、可重试且幂等；跨服务流程用 outbox/补偿而不是长时间持有数据库锁。排查死锁要保存 deadlock log、SQL、索引和事务顺序，再通过统一加锁顺序或缩小范围修复。

