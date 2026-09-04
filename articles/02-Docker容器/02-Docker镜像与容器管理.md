# Docker 镜像与容器管理

## 常用操作

```bash
docker version
docker info
docker image ls
docker ps -a
docker inspect <CONTAINER>
```

## 启动实例

```bash
docker run -d --name web --restart unless-stopped \
  -p 8080:80 nginx:1.27
```

启动前确认端口未被占用、镜像来源可信、容器是否需要持久化数据。`--restart` 不能替代健康检查和故障告警。

## 生命周期与清理

```bash
docker logs --tail 200 web
docker stop web
docker start web
docker rm web
docker image prune
```

清理前使用 `docker system df` 评估空间，避免误删仍被回滚或审计需要的镜像。
