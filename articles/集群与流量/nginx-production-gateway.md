# Nginx 生产网关：PHP-FPM、缓存、限流、WebSocket 与 TLS

## 分层模型

Nginx 负责连接终止、路由、静态资源、缓存与访问控制；PHP-FPM 负责解释执行和进程池；应用自身负责业务超时和幂等。每层都应有独立的容量指标，不能仅看 Nginx 200 比例。

## PHP-FPM 与反向代理

```nginx
upstream php_backend { server unix:/run/php-fpm/www.sock; }
location ~ \.php$ {
  include fastcgi_params;
  fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
  fastcgi_pass php_backend;
  fastcgi_connect_timeout 2s; fastcgi_read_timeout 30s;
}
```

`pm.max_children` 由单进程 RSS、可用内存和目标并发计算；`pm.max_requests` 用于缓解泄漏。Nginx worker 数量、文件描述符和上游连接池应通过压测确定。超时必须从客户端到数据库逐级递增，避免下游仍在执行而上游已经重试。

## 缓存与限流

静态资源用长 TTL + 内容哈希；动态响应只缓存明确可共享且具备失效策略的请求。`proxy_cache_lock` 防止击穿，`proxy_no_cache` 排除 Set-Cookie、认证和错误响应。

```nginx
limit_req_zone $binary_remote_addr zone=api:10m rate=20r/s;
limit_conn_zone $server_name zone=conn:10m;
location /api/ { limit_req zone=api burst=40 nodelay; proxy_pass http://app; }
```

限流要区分用户、租户和 IP；返回 429 时提供 Retry-After，避免客户端重试风暴。

## WebSocket 与 TLS

WebSocket 需显式升级头并配置长读超时；连接数应纳入容量模型。TLS 使用现代协议、完整链、OCSP/安全头和密钥轮换；证书续期后先 `nginx -t` 再平滑 reload。

```bash
nginx -t && systemctl reload nginx; curl -I https://example.com/healthz
```

## 验证和安全

验证 upstream 失败转移、缓存命中率、限流命中、WebSocket 保活、TLS 握手和日志脱敏。禁止把 `X-Forwarded-For` 当作可信身份，必须由受信代理覆盖；管理接口只允许内网和强认证。

## 容量计算与故障树

以连接数、请求速率和响应时间分别建模：并发连接 ≈ 请求速率 × 平均响应时间；worker_connections 还要扣除上游连接、日志和文件描述符。PHP-FPM max_children 由可用内存 / 单进程 RSS 得到上限，再受数据库连接池和 CPU 限制。所有计算留出故障节点余量。

当 502/504 上升时，先区分 upstream connect timeout、read timeout、PHP-FPM 队列和应用主动 5xx。检查 `$upstream_status`、`$upstream_response_time`、FPM slowlog 和数据库锁，禁止盲目提高超时。缓存击穿时暂时提高 grace、限速回源并保护数据库，而不是清空全部缓存。

WebSocket 发布要先降低新连接权重，再等待最大连接寿命；长连接没有上限会让 reload 和滚动发布永远无法完成。日志中的 request id 贯穿 Nginx、FPM 和应用，才能把一次用户请求还原成完整链路。
