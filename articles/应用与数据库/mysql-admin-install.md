# MySQL/MariaDB 安装、安全与管理

## 安装与初始化

使用发行版或官方仓库的签名包，固定主版本，数据目录和日志目录放在独立存储。初始化后删除测试库、匿名用户和远程 root，启用 TLS、审计和最小权限。

```bash
mysql_secure_installation; mysql -uroot -p -e "SELECT VERSION(), @@datadir, @@log_bin;"
```

## 客户端与变量

`mysql` 用于诊断和事务操作，`mysqldump` 适合小中型逻辑备份；大库应使用物理备份工具。全局变量影响新会话，会话变量只影响当前连接；变更前区分动态/静态、持久化方式和重启要求。

```sql
SHOW GLOBAL STATUS LIKE 'Threads_connected';
SHOW GLOBAL VARIABLES LIKE 'innodb_buffer_pool_size';
SHOW PROCESSLIST;
```

配置、用户授权、日志、备份、复制和参数变更都要审计；不要把 root 密码写入命令行历史或自动化日志。

