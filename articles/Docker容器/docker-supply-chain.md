# 镜像供应链：签名、扫描、Registry 与 rootless

## 威胁模型

镜像风险包括恶意基础镜像、构建脚本投毒、秘密进入层、依赖混淆、Registry 凭据泄漏和运行时越权。控制面应覆盖源码、依赖、构建器、制品、部署和运行时。

## 可复现构建

```dockerfile
# syntax=docker/dockerfile:1.7
FROM golang:1.22@sha256:<verified-digest> AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -trimpath -o /out/api ./cmd/api
FROM gcr.io/distroless/static-debian12@sha256:<verified-digest>
COPY --from=build /out/api /api
USER 65532:65532
ENTRYPOINT ["/api"]
```

固定基础镜像和依赖版本，`.dockerignore` 排除密钥与缓存。记录源码 commit、构建器、工具链、SBOM 和签名。

## 扫描、签名与准入

扫描应结合可利用性、运行时暴露面和修复版本，不能机械阻断所有 CVE。部署阶段验签：

```bash
docker buildx build --provenance=true --sbom=true -t registry.example.com/team/api:$GIT_SHA --push .; cosign sign --key env://COSIGN_KEY registry.example.com/team/api@$DIGEST; cosign verify --key cosign.pub registry.example.com/team/api@$DIGEST
```

准入要求签名主体、来源仓库、漏洞豁免和制品有效期均满足策略。豁免要有负责人、到期日和补救工单。

## Registry 与 rootless

Registry 开启 TLS、私有仓库、最小权限 token、不可变标签、垃圾回收窗口和异地复制。Rootless Docker 依靠 user namespace 降低 daemon 风险，但会影响低端口、设备、overlayfs 和网络模式。

```bash
dockerd-rootless-setuptool.sh install; systemctl --user enable --now docker; docker info | grep -E 'Rootless|Cgroup'
```

低端口服务放到前置代理，不要为 rootless 重新授予 `CAP_NET_ADMIN`；结合 seccomp、AppArmor/SELinux、只读文件系统和资源限制。

发现恶意镜像时冻结发布、撤销凭据、保留取证副本、重建并滚动替换，检查运行时进程和秘密访问。删除标签不能证明实例已清理。

## 策略落地

把供应链策略写成可执行门禁：来源仓库必须在 allow-list；基础镜像只能来自经过签名的镜像项目；高危漏洞按运行时可达性和修复版本分类；豁免单必须有到期时间。构建器使用短期凭据和隔离网络，构建日志过滤 token、URL 中的密码和私有源码片段。

SBOM 要能反查到运行实例：制品清单记录 digest、部署命名空间、节点和启动时间。发生依赖漏洞时，先按 digest 找到受影响实例，再按发布批次滚动替换。Registry 垃圾回收要避开仍被部署引用的 manifest，并保留审计日志。

rootless 回归测试至少包含低端口映射、卷权限、cgroup 限制、DNS、日志驱动和备份恢复。若某个组件必须使用特权设备，应单独隔离节点和运行时策略，不应把整个 Compose 项目切换为 privileged。
