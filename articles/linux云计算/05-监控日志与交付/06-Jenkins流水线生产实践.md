# Jenkins 流水线生产实践

```groovy
pipeline {
  stages {
    stage('Test') { steps { sh 'make test' } }
    stage('Build') { steps { sh 'docker build -t $IMAGE:$GIT_COMMIT .' } }
    stage('Deploy') { steps { input '批准生产发布'; sh './deploy.sh $GIT_COMMIT' } }
  }
}
```

流水线应固定构建节点、依赖版本和制品 digest；凭据通过 Credentials/Secret 注入，不出现在日志。生产阶段配置审批、并发控制、超时、失败通知和一键回滚。
