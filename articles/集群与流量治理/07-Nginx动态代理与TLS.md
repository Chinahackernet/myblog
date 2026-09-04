# Nginx 动态代理与 TLS

## PHP-FPM 代理

```nginx
location ~ \.php$ {
  try_files $uri =404;
  include fastcgi_params;
  fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
  fastcgi_pass unix:/run/php/php-fpm.sock;
}
```

`try_files` 可避免将任意路径交给解释器。生产配置需限制上传目录脚本执行、设置超时和连接池，并观察 PHP-FPM 慢请求。

## TLS 验证

```bash
nginx -t
openssl s_client -connect <DOMAIN>:443 -servername <DOMAIN> </dev/null
```

证书、私钥权限、协议版本、密码套件和续期告警必须纳入变更与监控。
