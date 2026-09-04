# Varnish HTTP 缓存策略与失效治理

## 缓存键与一致性

Varnish 的核心是缓存键、TTL、后端健康和失效策略。默认缓存不应包含认证、Set-Cookie 或个性化响应；缓存键需明确 Host、Path、查询参数和语言。

```vcl
sub vcl_recv {
  if (req.method != "GET" && req.method != "HEAD") { return (pass); }
  if (req.http.Authorization) { return (pass); }
}
sub vcl_backend_response { set beresp.ttl = 5m; set beresp.grace = 30s; }
```

## 击穿、雪崩与失效

用 grace、stale-if-error、请求合并和分层缓存降低后端压力；批量失效要限速，避免一次 purge 造成回源洪峰。缓存命中率必须与后端 QPS、P95 和错误率一起看，命中率高不代表内容正确。

## 安全与验收

PURGE/BAN 仅允许管理网和强认证，日志脱敏。演练后端故障、缓存过期、热点键、PURGE 误用和 TLS 终止，确认降级、回源、恢复和审计路径。

## 生产参数评审

TTL、grace 和 keep 按源站恢复时间与内存容量共同确定；grace 过长会提供旧内容，过短则后端故障时全量失败。缓存键中必须规范化查询参数和 Host，防止同一资源产生无限变体或缓存投毒。

上线前用真实 Header 测试匿名、认证、Cookie、Range、错误响应和 PURGE 权限。监控命中率、回源 QPS、对象数、内存、线程、后端响应和 BAN 队列；单看命中率无法发现错误内容缓存。

缓存配置变更保留完整 VCL、编译版本和回滚命令。紧急失效优先按标签/前缀限量 BAN，禁止无审计的全量清空；清空后要逐步预热并保护源站。
