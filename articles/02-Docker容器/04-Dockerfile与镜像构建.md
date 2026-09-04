# Dockerfile 与镜像构建

## 最小示例

```dockerfile
FROM nginx:1.27
COPY public/ /usr/share/nginx/html/
USER 101
```

## 构建原则

```bash
docker build --pull --tag <REGISTRY>/<TEAM>/<APP>:<VERSION> .
docker image inspect <IMAGE>
```

使用 `.dockerignore` 排除密钥、缓存和无关构建产物；多阶段构建减少运行时体积；每个构建应绑定源码版本并产生可追溯标签。

## 验证

扫描漏洞、确认非 root 运行、检查开放端口和健康检查。构建上下文不得包含 `.env`、SSH 私钥或云凭证。
