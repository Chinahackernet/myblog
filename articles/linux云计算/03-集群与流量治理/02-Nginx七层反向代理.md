# Nginx 七层反向代理

## 配置骨架

```nginx
upstream app_backend { server 10.0.0.11:8080; server 10.0.0.12:8080; }
server { listen 80; server_name <DOMAIN>;
  location / { proxy_pass http://app_backend; proxy_set_header Host $host; proxy_set_header X-Real-IP $remote_addr; }
}
```

上线前执行 `nginx -t`，再 `systemctl reload nginx`。关注连接超时、缓冲、HTTP 头、WebSocket 和真实客户端地址。

## 排障

区分 4xx、5xx、超时和连接拒绝；关联 access log、error log、上游状态和应用 trace ID。配置变更必须保留上一版本并验证回滚。
