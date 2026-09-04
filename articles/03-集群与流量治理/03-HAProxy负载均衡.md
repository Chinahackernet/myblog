# HAProxy 四至七层负载均衡

```haproxy
frontend http_in
  bind :80
  default_backend app
backend app
  balance roundrobin
  option httpchk GET /health
  server app1 10.0.0.11:8080 check
```

用 `haproxy -c -f /etc/haproxy/haproxy.cfg` 校验语法后 reload。生产启用 stats 但限制来源；健康检查必须代表真实业务可用性。
