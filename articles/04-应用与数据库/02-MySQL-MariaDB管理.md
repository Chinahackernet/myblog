# MySQL/MariaDB 管理

## 基础检查

```sql
SHOW GLOBAL STATUS;
SHOW VARIABLES;
SHOW FULL PROCESSLIST;
```

运维重点包括字符集、连接数、慢查询、事务、索引、权限和磁盘容量。账号遵循最小权限，应用禁止使用 root。

变更前确认备份可恢复，修改参数区分动态变量与需重启变量，并记录持久化配置位置。
