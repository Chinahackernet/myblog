# Jenkins 与 GitLab CI/CD

流水线应分为校验、构建、扫描、制品发布、部署、验收和回滚。凭据放在 Secret/Credentials 管理中，禁止写入仓库和日志。

```text
Commit → Test → Build → Scan → Artifact → Deploy → Verify → Rollback
```

生产部署采用审批、环境隔离、最小权限和可追溯制品；失败时保留构建日志、版本号和回滚入口。
