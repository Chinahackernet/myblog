# 文件权限-Docker复制并自行更改

```yaml
FROM quay.io/kubernetes-ingress-controller/nginx-ingress-controller:0.32.0

ADD --chown=www-data nginx.tmpl /etc/nginx/template
ADD --chown=www-data skywalking /etc/nginx/lua/skywalking
```

> 注意：版本>Docker 17.09