# Registry 与镜像发布

## 发布流程

```bash
docker login <REGISTRY>
docker tag <IMAGE> <REGISTRY>/<TEAM>/<APP>:<VERSION>
docker push <REGISTRY>/<TEAM>/<APP>:<VERSION>
docker image inspect <REGISTRY>/<TEAM>/<APP>:<VERSION>
```

生产 Registry 应启用 TLS、访问控制、镜像签名或 digest 校验、生命周期清理和审计日志。将构建、扫描、签名、发布拆成可审计阶段。

## 回滚

部署清单记录镜像 digest，而不是只记录可变 tag。回滚到上一个已验证 digest，验证业务健康后再处理问题版本。
