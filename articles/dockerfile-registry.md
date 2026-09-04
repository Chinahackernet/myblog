# Dockerfile 分层构建与 Registry 实战

## Dockerfile 规范

多阶段构建把编译工具与运行时分离；固定基础镜像 digest；使用非 root、显式工作目录和健康检查。减少层大小不应牺牲可读性和可复现性。

```dockerfile
FROM node:22-bookworm AS build
WORKDIR /src
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
RUN npm run build
FROM nginx:1.27-alpine
COPY --from=build /src/dist /usr/share/nginx/html
USER 101:101
```

## Registry 发布

Registry 需要 TLS、私有项目、token 权限、不可变标签、镜像复制、垃圾回收和审计。发布流程生成 digest、SBOM、签名和扫描报告，Promotion 只移动同一 digest，不重新构建。

```bash
docker buildx build --platform linux/amd64,linux/arm64 --push -t registry.example.com/web:$GIT_SHA .; docker manifest inspect registry.example.com/web:$GIT_SHA
```

拉取失败按 DNS/TLS、认证、架构、配额和仓库同步排查；删除镜像前确认没有运行实例、回滚版本和合规保留要求。

