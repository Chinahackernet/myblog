# Jenkins/GitLab 制品治理、扫描、审批与密钥

## 1. CI/CD 控制面

GitLab 管源码、合并请求和制品，Jenkins 负责可编排流水线；两者均不应成为秘密和生产权限的长期存储地。流水线以 commit SHA 为不可变身份，构建、测试、扫描、签名、审批和部署必须可追溯。

```groovy
pipeline {
  stages {
    stage('test') { steps { sh './gradlew test' } }
    stage('scan') { steps { sh 'trivy fs --exit-code 1 .' } }
    stage('build') { steps { sh 'docker buildx build --push -t registry/app:${GIT_COMMIT} .' } }
    stage('approve') { steps { input message: '生产发布批准' } }
    stage('deploy') { steps { sh './deploy.sh ${GIT_COMMIT}' } }
  }
}
```

## 2. 制品治理

Registry 制品要绑定源码、SBOM、测试报告、签名主体和保留期；禁止覆盖已发布标签。Promotion 应在同一 digest 上完成，不要重新构建“生产版”。过期制品删除前保留审计和回滚窗口。

## 3. 审批与部署策略

生产部署采用变更单、双人审批、时间窗口和自动门禁。蓝绿/金丝雀以错误率、P95、业务指标和日志异常作为停止条件；数据库迁移遵循向前兼容。回滚脚本与正向脚本同样纳入测试。

## 4. 密钥与代理

使用短时 OIDC/token、Jenkins Credentials Binding 或外部 Vault；禁止在参数、日志和制品中回显秘密。构建节点临时、隔离、无持久化生产密钥；插件和 Runner 定期升级并限制网络出口。

## 验收

模拟依赖漏洞、签名失败、审批拒绝、部署中断和回滚，确认流水线停止、制品可追溯、权限最小和审计完整。

## 流水线治理细节

共享库只允许经过代码评审的步骤，禁止项目自由拼接 shell 访问宿主机凭据。Runner 按信任等级分组：普通构建、发布签名和生产部署使用不同节点、不同网络和不同身份。构建完成后清理 workspace，避免前一任务的源码或秘密被下一任务读取。

质量门禁至少包括单元/集成测试、依赖和镜像扫描、许可证检查、SBOM、签名和部署前 smoke test。审批消息应显示 commit、变更摘要、扫描结果、目标环境和回滚版本，审批人不能与提交人相同。流水线失败要保留日志与制品元数据，但自动脱敏。

部署策略按风险选择：小变更采用滚动，核心服务采用金丝雀，数据库采用 expand/contract。每种策略都要定义最大并发、观察窗口、自动停止条件、回滚入口和人工接管方式。
