# Docker 生产平台：Compose 发布、供应链与运行时隔离

## 1. 运行时模型与边界

容器共享宿主机内核，不等价于虚拟机。镜像由不可变层组成，容器层应视为临时写层；持久化数据必须进入显式卷或外部存储。生产设计先回答：进程身份、网络信任边界、数据生命周期、资源上限、发布回滚和镜像来源。

```bash
docker version
docker info --format '{{json .DriverStatus}}'
docker inspect --format '{{.Id}} {{.Config.User}} {{.HostConfig.ReadonlyRootfs}}' app
```

## 2. Compose 生产发布

Compose 文件应拆成基础定义、环境覆盖和机密注入；镜像使用 digest 固定版本，禁止生产使用 `latest`。健康检查必须验证业务依赖，而非只判断进程存在。资源限制、日志轮转、只读根文件系统、最小 capability 和重启策略应显式写出。

```yaml
services:
  api:
    image: registry.example.com/ops/api@sha256:replace-me
    read_only: true
    user: "10001:10001"
    cap_drop: [ALL]
    security_opt: [no-new-privileges:true]
    tmpfs: [/tmp:noexec,nosuid,size=64m]
    read_only: true
    healthcheck:
      test: [CMD-SHELL, "curl -fsS http://127.0.0.1:8080/ready"]
      interval: 10s
      timeout: 2s
      retries: 6
    deploy:
      resources:
        limits: {cpus: '2', memory: 1G}
```

发布流程：渲染配置→`docker compose config` 静态检查→拉取 digest→备份卷/配置→`up -d`→等待健康→业务探针→记录版本。失败时固定回滚上一 digest，而不是重新构建“看起来相同”的镜像。

## 3. 镜像构建、签名与扫描

Dockerfile 采用多阶段构建、非 root 运行、固定基础镜像、最小运行时和 SBOM。构建上下文必须有 `.dockerignore`，避免把密钥、Git 历史和本地缓存发送给 daemon。

```dockerfile
FROM golang:1.23 AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -trimpath -ldflags='-s -w' -o /out/api ./cmd/api

FROM gcr.io/distroless/static-debian12:nonroot
COPY --from=build /out/api /api
USER nonroot:nonroot
ENTRYPOINT ["/api"]
```

供应链门禁至少检查漏洞严重度、许可证、恶意包、SBOM、签名身份和来源仓库。签名验证应绑定发布工作流身份与 digest；扫描结果要区分可利用性、运行时暴露面和修复版本，不能把“扫描通过”解释为绝对安全。

## 4. 网络、卷和备份

默认 bridge 适合单机隔离；跨主机通信应使用受控 overlay 或编排平台网络。明确哪些端口对宿主机发布，避免 `ports: - "0.0.0.0:..."` 把内部服务暴露到公网。卷备份应在一致性窗口执行：数据库先 flush/备份，文件卷记录版本与校验和。

```bash
docker network inspect app_net
docker volume inspect app_data
docker run --rm -v app_data:/src -v "$PWD":/backup alpine \
  tar --numeric-owner -czf /backup/app_data.tgz -C /src .
sha256sum app_data.tgz
```

恢复必须在隔离卷验证，检查 UID/GID、扩展属性、SELinux 标签和应用级数据一致性。不要直接覆盖生产卷；先恢复为新卷，切换配置，保留旧卷用于回退。

## 5. Rootless 与资源治理

rootless Docker 将 daemon 与容器放入非 root 用户命名空间，降低 daemon 被攻破后的宿主机影响，但会受到低端口、设备、cgroup 和网络模式限制。上线前验证 cgroup v2、subuid/subgid、存储驱动和日志采集；不能因 rootless 省略宿主机补丁和 seccomp。

```bash
docker context ls
systemctl --user status docker
loginctl enable-linger ops
docker run --rm --read-only --cap-drop=ALL --security-opt=no-new-privileges alpine id
```

## 故障演练与验收

演练镜像拉取失败、健康检查失败、卷损坏、磁盘水位达到 90%、Registry 证书过期和 rootless cgroup 不可用。每次记录告警延迟、回滚耗时、数据丢失量和清理动作。验收必须包括 digest 一致性、容器非 root、资源限制生效、卷可恢复、网络端口最小化和发布可回滚。

