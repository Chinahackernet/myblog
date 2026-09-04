# Docker 网络、卷与运行时隔离

## 网络模型

bridge 适合单机容器互联，host 减少一层网络但扩大隔离面，macvlan/ipvlan 适合接入二层/三层网络却会增加交换和排障复杂度。跨主机网络不能仅靠默认 bridge，应使用平台网络或明确的 overlay 控制面。

```bash
docker network create --driver bridge --subnet 172.30.0.0/24 app_net
docker network inspect app_net
docker run --network app_net --name api alpine ip addr
```

## DNS 与暴露端口

Compose 服务名解析只在同一用户网络内有效；不要把容器 IP 写入配置。端口发布只暴露入口服务，数据库和内部管理接口使用 internal network。排障同时查看容器路由、宿主机 nftables、conntrack 和外部 LB。

## 卷与驱动

named volume 由 Docker 管理，bind mount 继承宿主机权限，tmpfs 适合临时敏感数据。备份卷前先停止写入或调用应用一致性接口；卷驱动的快照、加密、跨节点能力不能想当然。

## 隔离

去掉 `privileged` 和不必要 capabilities，设置 pids/memory/CPU/IO 限制，使用 seccomp、SELinux/AppArmor 和 rootless。宿主机 Docker socket 等价于 root 权限，应改用受限 API 或专用 sidecar。

