# Docker Compose 生产发布与回滚

## 适用边界

Compose 适合单机或单节点内的多容器应用，不是集群调度器。生产使用必须明确节点故障域、持久化边界、发布锁和回滚条件。

## 配置分层

```text
app/compose.yaml       # 稳定基线
app/compose.prod.yaml  # 生产覆盖
app/.env.example       # 只有变量名
```

```yaml
services:
  api:
    image: registry.example.com/team/api:${IMAGE_DIGEST}
    user: "10001:10001"
    read_only: true
    tmpfs: [/tmp]
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://127.0.0.1:8080/ready"]
      interval: 10s
      timeout: 2s
      retries: 6
    deploy:
      resources: {limits: {cpus: "2.0", memory: 1G}}
```

固定 digest 而不是 `latest`；环境变量、网络、卷、健康检查和资源限制纳入评审。秘密用 secrets/外部密钥系统注入，不进入 `.env` 或镜像层。

## 发布、验证与回滚

```bash
docker compose -f compose.yaml -f compose.prod.yaml config --quiet; docker compose pull; docker compose up -d --remove-orphans; docker compose ps; docker compose events --since 10m
```

发布顺序是预检签名 → 备份数据 → 拉取镜像 → 更新无状态服务 → 观察健康和业务指标 → 再执行数据迁移。Compose 没有原生滚动更新，可通过反向代理权重或双项目目录实现蓝绿。

错误率、P95、重启次数或队列积压超过门限即停止发布。保存上一版本 digest，执行同一 compose 文件回滚。不可逆数据库迁移必须使用 expand/contract，否则应用回滚也无法回滚数据。

## 卷备份

```bash
docker run --rm -v app_data:/data -v "$PWD":/backup alpine tar czf /backup/app_data.tgz -C /data .; sha256sum app_data.tgz
```

恢复到临时卷并校验后再切换，定义加密、异地副本、保留期和恢复演练。故障时收集 `docker inspect`、事件、日志和内核 OOM 记录，先阻止重启风暴。

## 安全验收

使用非 root、只读根、最小 capability、私有网络和明确端口；删除 `privileged`、宿主机 Docker socket 和无必要的 bind mount。配置渲染、健康检查、备份恢复、指标门禁和审批记录全部通过后才算完成。

## 发布 Runbook

发布前冻结 compose 文件和镜像 digest，执行配置渲染、漏洞准入、磁盘空间和卷挂载预检；有状态服务先做一致性备份。发布时只更新一组服务，观察容器重启次数、健康检查延迟、应用错误率、数据库连接和宿主机 OOM。发现异常立即停止后续服务，不要用重复 `up` 掩盖问题。

蓝绿发布需要两套独立项目名和反向代理切换。切换前对绿色环境执行合成交易，切换后保留蓝色环境一段观察期。回滚只切换入口并停止绿色写入；如果数据库 schema 已扩展，不得立即删除新列，等待所有旧版本退出后再做 contract 阶段。

Compose 的 `restart: always` 不能替代健康管理。应用反复退出时，先看退出码、内核 OOM、依赖 DNS 和证书，而不是提高 restart 次数。日志必须配置大小轮转或驱动到集中系统，避免容器 stdout 填满宿主机磁盘。
