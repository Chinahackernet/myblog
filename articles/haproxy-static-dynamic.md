# HAProxy 动静分离与四/七层混合

## 路由策略

HTTP frontend 按 Host、Path、Header 选择动态 backend；静态内容可由缓存或专用节点提供。TCP frontend 只做连接级转发，不能假设后端一定是 HTTP。

```haproxy
frontend web
  bind :80
  acl is_static path_end .css .js .png .jpg
  use_backend static if is_static
  default_backend dynamic
backend static
  balance roundrobin
  http-request set-header Cache-Control public,max-age=3600
  server s1 10.0.0.21:8080 check
backend dynamic
  balance leastconn
  option httpchk GET /ready
  server a1 10.0.0.31:8080 check
```

动静分离必须处理缓存失效、版本目录、Range、压缩和源地址；动态 backend 处理会话、限流、超时和重试。上线验证两种路径的 P99、缓存命中、后端队列和连接排空。

