# HAProxy 四/七层混合、TLS、连接排空与安全统计

## 体系结构

TCP mode 适合数据库和 TLS 透传，只能做连接级健康检查；HTTP mode 可按 Host、Path、Header 路由并观测响应码。四层与七层混合时要分开 frontend、backend、超时和指标，避免把 HTTP 语义误用于任意 TCP。

```haproxy
frontend https_in
  bind :443 ssl crt /etc/haproxy/certs/site.pem alpn h2,http/1.1
  mode http
  http-request set-header X-Request-ID %[unique-id]
  use_backend api if { path_beg /api/ }
  default_backend web
backend api
  balance leastconn
  option httpchk GET /ready
  server api01 10.0.0.11:8080 check drain
```

## TLS 与超时

证书文件权限最小化，私钥不进仓库；启用现代协议和完整链。`timeout client/server/connect/queue/http-request` 要结合最慢合法请求设定，过短会误杀，过长会占满连接资源。

## 动静分离与排空

静态资源可由 CDN/Nginx 提供，动态请求进应用 backend。发布时先将服务器置为 `drain`，停止新会话并等待现有请求完成，再下线；长连接必须有最大生命周期和关闭通知。

```bash
echo 'set server web/api01 state drain' | socat stdio /run/haproxy/admin.sock
```

## 统计接口安全

Runtime API 只绑定 Unix socket 或管理网，通过文件权限和跳板机访问；不要把 stats 页面裸露公网。审计命令、登录主体和配置版本，敏感 Header 不写入日志。

## 验证与故障

用 `show servers state`、`show stat` 检查健康、队列和会话；分别模拟后端拒绝、TLS 失败、连接排空和 stats 权限错误。发生 503 时先区分无可用 server、队列超时和应用返回 503，再决定扩容或回滚。

## 调优与保护

`maxconn` 应由内存、文件描述符和后端能力共同决定；队列上限用于削峰，不是无限缓存。对慢客户端设置 `timeout client`，对后端设置独立 connect/server timeout；HTTP keep-alive 和 TCP 长连接按业务连接复用率评估。

动态变更通过 Runtime API 时必须记录操作者、原因和过期时间；临时 `disable server` 不应成为永久配置。发布排空前确认新连接已被路由到其他节点，且 drain 超时后有强制关闭和告警。

TLS 证书轮换使用双证书验证窗口，先加载新证书、抽样握手，再删除旧证书。统计接口只开放 Unix socket 或管理网，配合文件权限和跳板机审计；任何公网 stats 页面都视为安全缺陷。
