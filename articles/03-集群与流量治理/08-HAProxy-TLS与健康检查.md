# HAProxy TLS 与健康检查

前端 TLS 终止后，向后端转发时明确是否再次加密；真实健康检查应检查业务依赖，而不只是 TCP 端口。

```haproxy
frontend https_in
  bind :443 ssl crt /etc/haproxy/certs/site.pem
  http-request set-header X-Forwarded-Proto https
  default_backend app
backend app
  option httpchk GET /health
  http-check expect status 200
  server app1 10.0.0.11:8080 check
```

证书更新先校验 PEM 和配置，再 reload；保留旧证书直到新证书完成线上验证。
