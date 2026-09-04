# Nginx 与 PHP-FPM 深度调优

## 进程池模型

PHP-FPM 的 `pm.max_children` 受单进程 RSS、可用内存和数据库连接上限约束；`pm.max_requests` 可缓解长期泄漏。动态进程模式适合波动流量，静态模式适合稳定高并发，但两者都必须由压测验证。

```ini
pm = dynamic
pm.max_children = 80
pm.start_servers = 8
pm.min_spare_servers = 8
pm.max_spare_servers = 24
pm.max_requests = 1000
slowlog = /var/log/php-fpm/www-slow.log
request_slowlog_timeout = 3s
```

## 请求链路

Nginx `fastcgi_read_timeout` 不应超过应用和数据库的超时预算；FPM status/ping 只允许管理网访问。慢日志与 Nginx upstream 时间关联 request ID，区分 FPM 排队、脚本执行和下游锁等待。

发布前预热 opcode/cache，灰度比较 FPM active/idle、listen queue、P95、错误率和数据库连接。节点排空后再重启，避免全量 FPM 同时冷启动。

