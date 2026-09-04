# Varnish HTTP 缓存

缓存设计先明确可缓存对象、TTL、键、Cookie、失效和回源保护。禁止缓存含用户身份、支付或私密数据的响应。

```bash
varnishstat
varnishlog -g request -q 'ReqURL ~ "^/api"'
curl -I http://<DOMAIN>/
```

通过响应头验证 HIT/MISS、Age 和 Cache-Control；变更 VCL 前用测试流量验证，并准备恢复上一版配置。
