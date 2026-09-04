# Docker 网络与存储卷

## 网络

```bash
docker network ls
docker network inspect bridge
docker port <CONTAINER>
```

默认 bridge 适合简单场景；多容器应用优先创建自定义 bridge，让容器通过服务名解析。跨主机网络需使用编排平台或专用网络方案，不要直接暴露 Docker daemon。

## 存储

```bash
docker volume create app-data
docker volume ls
docker volume inspect app-data
docker run -d --mount source=app-data,target=/var/lib/app <IMAGE>
```

卷数据独立于容器生命周期，但仍需纳入备份。删除容器前确认卷、宿主机 bind mount 和数据库一致性策略。
