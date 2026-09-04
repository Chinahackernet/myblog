# HAProxy 与 Keepalived：四/七层混合高可用与故障演练

## 1. 架构与连接生命周期

HAProxy 可在 TCP 四层透传，也可在 HTTP 七层解析 Host、路径、Header 并执行路由、TLS 终止和健康检查。Keepalived 通过 VRRP 提供 VIP，但 VIP 所有权、HAProxy 进程、后端健康和外部可达性必须同时纳入 `track_script`，否则会出现“VIP 在、服务死”的假高可用。

## 2. HAProxy 配置骨架

```haproxy
global
  log /dev/log local0
  maxconn 20000
  stats socket /run/haproxy/admin.sock mode 660 level admin
  ssl-default-bind-options no-tlsv10 no-tlsv11
defaults
  mode http
  option httplog
  timeout connect 3s
  timeout client 30s
  timeout server 30s
  timeout http-request 5s
frontend https_in
  bind :443 ssl crt-list /etc/haproxy/crt-list.txt alpn h2,http/1.1
  http-request set-header X-Request-ID %[uuid()]
  use_backend static if { path_beg /assets/ }
  default_backend app
backend app
  option httpchk GET /ready
  http-check expect status 200
  server app01 10.30.0.11:8080 check maxconn 2000
  server app02 10.30.0.12:8080 check maxconn 2000
```

生产配置要通过 `haproxy -c -f` 检查，证书目录和统计 socket 权限必须收敛。统计页面不应直接暴露公网，使用管理网、mTLS 或堡垒机隧道；管理员账号不复用业务密码。

## 3. 动静分离、TLS 与四/七层混合

静态资源应设置长缓存与不可变版本号，动态请求按 Host/Path/Header 路由到不同后端。需要透传非 HTTP 协议（数据库、TLS passthrough）时使用 `mode tcp` 的独立 frontend，不能在同一个 HTTP frontend 中混用。TLS 终止点要明确客户端真实 IP、重加密需求和合规密码套件。

## 4. 排空、发布与容量

滚动发布先将节点设为 `drain`，等待现有连接自然结束，再停止进程；WebSocket、长轮询和大文件连接必须设置最大排空窗口，超过窗口再按业务允许程度强制关闭。容量评估关注新建连接率、并发连接、TLS 握手 CPU、队列和后端响应时间，`maxconn` 需要与文件描述符和内核 backlog 同步。

```bash
echo 'show stat' | socat stdio /run/haproxy/admin.sock
echo 'set server app/app01 state drain' | socat stdio /run/haproxy/admin.sock
echo 'show sess' | socat stdio /run/haproxy/admin.sock
```

## 5. Keepalived 脑裂防护

VRRP 优先级只解决正常选主，不能阻止网络分区时双主。生产应使用 unicast peer、接口/进程探针、抢占延迟、云平台健康检查和必要的 fencing。通知脚本必须幂等、超时受控、记录结构化日志；脚本失败不能阻塞 Keepalived 主循环。

```conf
vrrp_script chk_proxy {
  script "/usr/local/sbin/check-haproxy.sh"
  interval 2
  timeout 1
  fall 2
  rise 3
}
vrrp_instance VI_1 {
  state BACKUP
  interface eth0
  virtual_router_id 51
  priority 110
  advert_int 1
  nopreempt
  track_script { chk_proxy }
  virtual_ipaddress { 10.30.0.100/24 }
}
```

演练必须覆盖 HAProxy 进程崩溃、后端全挂、主机断电、VRRP 广播被阻断、恢复节点抢占和脚本异常。验证 VIP 只有一个持有者，ARP/MAC 收敛后业务探针成功，并记录切换时间与现有连接损失。

