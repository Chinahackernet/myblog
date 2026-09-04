# MySQL 权限与审计

## 最小权限

```sql
CREATE USER 'app'@'10.%' IDENTIFIED BY '<强密码>';
GRANT SELECT,INSERT,UPDATE,DELETE ON appdb.* TO 'app'@'10.%';
SHOW GRANTS FOR 'app'@'10.%';
```

账号按应用、环境和职责拆分，禁止业务使用 root。授权范围优先到库/表，避免 `%` 来源和全局权限。

## 审计检查

```sql
SELECT user,host,plugin,account_locked,password_expired FROM mysql.user;
SHOW VARIABLES LIKE 'log%';
```

审计日志需脱敏、限权和设置保留周期；权限变更应关联工单并可回滚。删除账号前确认连接池、备份脚本和应急账号不受影响。
