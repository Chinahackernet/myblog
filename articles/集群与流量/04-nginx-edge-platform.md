# Nginx 生产边缘平台：PHP-FPM、缓存、限流、WebSocket 与 TLS

## 1. 请求链路与职责边界

典型链路为 CDN/WAF → Nginx → PHP-FPM/Tomcat/静态对象。Nginx 负责连接复用、TLS 终止、路由、缓存和保护后端，不负责业务鉴权和数据一致性。配置评审先画清每个 location 的匹配顺序、信任代理头来源和缓存边界，再写指令。

```text
client --TLS--> Nginx --HTTP/FastCGI--> app --SQL--> database
                       |-- static/object storage
                       |-- websocket upstream
```

## 2. PHP-FPM 调优与故障定位

PHP-FPM 的 `pm.max_children` 不是越大越好，应按可用内存计算：`max_children = (应用可用内存 - 预留) / 单进程 RSS`，并留出 Nginx、内核页缓存和突发余量。`pm.max_requests` 用于缓解长期运行进程的碎片增长，但会增加重建开销。

```ini
; pool.d/www.conf（示例，必须按压测结果调整）
pm = dynamic
pm.max_children = 48
pm.start_servers = 8
pm.min_spare_servers = 8
pm.max_spare_servers = 24
pm.max_requests = 1000
request_slowlog_timeout = 2s
slowlog = /var/log/php-fpm/www-slow.log
```

Nginx FastCGI 必须显式传递 `SCRIPT_FILENAME`、限制请求体、设置合理的连接/读取超时，并通过独立 upstream 监控队列。出现 502 时按“DNS/连接拒绝→FPM 进程耗尽→脚本致命错误→上游响应超时”顺序定位，结合 `stub_status`、FPM slowlog、应用日志和 `ss -tanp`。

## 3. 缓存、限流与 WebSocket

缓存键必须包含协议、主机、URI 和必要的鉴权维度；带 `Set-Cookie`、Authorization 或写请求默认不缓存。用 stale-if-error 保护依赖故障，但要定义最大陈旧时间和主动失效机制。限流按真实风险选择漏桶/令牌桶，并区分 IP、用户、接口和全局容量。

```nginx
limit_req_zone $binary_remote_addr zone=login:10m rate=5r/s;
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api:100m max_size=10g inactive=30m use_temp_path=off;
map $http_upgrade $connection_upgrade { default upgrade; '' close; }
```

WebSocket 要求 `Upgrade`/`Connection` 头、长读取超时和后端心跳；缓存 location 与 WebSocket location 必须分开。上线前验证连接排空、后端重启和代理超时，避免发布造成大规模断连。

## 4. TLS 与无损变更

证书续期使用 ACME 的 staging 环境先演练，生产续期必须有到期告警、权限隔离、原子替换和失败回滚。`nginx -t` 只能检查语法，不能证明证书链、SNI、OCSP、协议版本和业务路由正确。

```bash
nginx -t
systemctl reload nginx
curl -vkI --resolve api.example.com:443:127.0.0.1 https://api.example.com/health
openssl s_client -connect api.example.com:443 -servername api.example.com -showcerts </dev/null
```

灰度发布可按 header、cookie、用户哈希或独立 upstream 权重实现。灰度前定义错误率、P95 延迟、FPM 队列和业务成功率阈值；超过阈值立即恢复旧配置，保留新旧版本日志以便比较。

## 验收与演练

必须验证静态文件、PHP、长连接、缓存命中/绕过、限流返回码、证书续期和 reload 无中断。演练 FPM 耗尽、缓存后端不可用、证书替换失败、WebSocket 后端滚动重启和灰度回滚，记录 RTO 与连接损失。

