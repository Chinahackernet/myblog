# Jenkins/GitLab 企业交付：制品治理、扫描、审批与密钥管理

## 1. 从提交到生产的可追溯链

交付流水线应把源代码提交、构建输入、依赖锁文件、测试结果、SBOM、扫描报告、制品 digest、审批人和部署环境串成一条不可篡改的证据链。生产部署只接受已签名、已扫描、已审批的制品，不在目标主机临时编译或 `git pull`。

```text
commit -> lint/unit -> build -> SBOM -> SAST/SCA/image scan
       -> sign artifact -> staging canary -> approval -> production
```

GitLab 负责仓库、Merge Request、保护分支和制品库；Jenkins 适合复杂编排和跨系统流水线。两者的职责边界要明确，避免同一项目在两套系统中重复构建造成“版本看似相同、digest 实际不同”。

## 2. Pipeline 与制品不可变

流水线按阶段设置超时、重试和人工门禁，失败时保留日志与工作区摘要。构建环境使用固定镜像和依赖锁定；制品以版本号和 digest 标识，禁止覆盖已发布版本。部署阶段把环境配置与制品分离，通过参数或配置中心注入。

```groovy
pipeline {
  options { timestamps(); disableConcurrentBuilds(); timeout(time: 45, unit: 'MINUTES') }
  stages {
    stage('Test') { steps { sh 'make test' } }
    stage('Build') { steps { sh 'make image VERSION=$GIT_COMMIT' } }
    stage('Verify') { steps { sh 'cosign verify --key env://COSIGN_PUB image@${IMAGE_DIGEST}' } }
    stage('Canary') { steps { sh './deploy.sh --env staging --digest ${IMAGE_DIGEST}' } }
    stage('Approve') { steps { input message: '生产发布审批' } }
  }
}
```

## 3. 扫描、审批与回滚

SAST/SCA、镜像漏洞、许可证和密钥泄露扫描要设严重度门禁与例外到期时间。高危漏洞是否阻断，应结合是否可利用、运行时暴露面和补丁可用性，例外必须由业务负责人和安全负责人签字。灰度发布按 1%→10%→50%→100% 放量，观测错误率、延迟、资源和业务指标；回滚只切换到已验证的旧 digest。

数据库迁移采用向后兼容的 expand/contract：先加字段和代码兼容，再回填，最后删除旧结构。不可逆迁移不得与自动回滚绑在同一个按钮上。

## 4. 密钥、代理与审计

Jenkins Credentials、GitLab CI Variables 和外部 Vault 只提供短期凭证；日志中禁止打印 Token、云密钥和数据库密码。Runner 按项目隔离，生产 Runner 不允许运行不受信任的合并请求。保护分支、强制评审、签名提交、制品下载权限和流水线配置变更都纳入审计。

## 验收与演练

演练构建节点失陷、制品仓库不可用、签名验证失败、扫描误报、审批超时、灰度指标恶化和密钥轮换。验收要求任意生产实例都能追溯到 commit/digest/审批记录，且在不重建制品的情况下完成回滚。

## 5. Runner 隔离与供应链威胁

不受信任的合并请求必须在短生命周期、无生产网络访问的 Runner 中执行；构建缓存按项目和权限隔离，避免恶意代码读取其他项目的凭据。锁定第三方 Action/插件版本并校验来源，禁止流水线从公网下载未审计脚本。制品库开启不可变标签、保留策略和下载审计，签名验证放在部署端再次执行。

## 6. 交付指标

持续跟踪变更前置时间、部署频率、变更失败率、平均恢复时间、扫描修复时长和审批等待时间。指标用于发现流程瓶颈，不应诱导绕过安全门禁；当错误预算耗尽时降低发布并行度，优先修复测试、回滚和可观测性缺口。
