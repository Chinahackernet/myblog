# runner部署与注册(helm)

> 分类：CI/CD / 第13章：Gitlab Runner
> 原文：https://www.cuiliangblog.cn/detail/section/179207220
> 来源：崔亮的博客

---

参考文档：[https://docs.gitlab.com/charts/charts/gitlab/gitlab-runner/](https://docs.gitlab.com/charts/charts/gitlab/gitlab-runner/)

# 部署runner
## 配置chart
```bash
[root@tiaoban ~]# helm repo add gitlab https://charts.gitlab.io
"gitlab" has been added to your repositories
[root@tiaoban ~]# helm search repo -l gitlab/gitlab-runner
NAME                    CHART VERSION   APP VERSION     DESCRIPTION  
gitlab/gitlab-runner    0.67.0          17.2.0          GitLab Runner
gitlab/gitlab-runner    0.66.0          17.1.0          GitLab Runner
gitlab/gitlab-runner    0.65.1          17.0.1          GitLab Runner
gitlab/gitlab-runner    0.65.0          17.0.0          GitLab Runner
[root@tiaoban cicd]# helm pull gitlab/gitlab-runner --untar --version=0.67.0
[root@tiaoban cicd]# cd gitlab-runner/
[root@tiaoban gitlab-runner]# ls
CHANGELOG.md  Chart.yaml  CONTRIBUTING.md  DEVELOPMENT.md  LICENSE  Makefile  NOTICE  README.md  templates  values.yaml
```

## 更新value.yaml
```yaml
image:
  registry: harbor.local.com
  image: cicd/gitlab-runner
  tag: alpine-v17.2.0
## Gitlab服务器地址
gitlabUrl: http://gitlab.cicd.svc/
## 注册token
runnerRegistrationToken: "glrt-sk2sVHh8bVu9U6wQgeZo"
# 创建rbac
rbac:
  create: true
  rules: 
    - apiGroups: ['']
      resources: ['*']
      verbs: ['*']
    - apiGroups: ['networking.k8s.io']
      resources: ['ingresses']
      verbs: ['*']
    - apiGroups: ['apps']
      resources: ['deployments']
      verbs: ['*']
  clusterWideAccess: true # 集群级别权限
serviceAccount:
  create: true
  name: gitlab-runner # 指定sa
# 添加hosts解析
hostAliases: 
  - ip: "192.168.10.150"
    hostnames:
    - "gitlab.local.com"
runners:
  config: |
    [[runners]]
      [runners.kubernetes]
        namespace = "{{.Release.Namespace}}"
        image = "alpine"
        service_account = "gitlab-runner" # 指定sa
      # 用于配置该 Executor 生成的 Pod 中的 /etc/hosts 文件
      [[runners.kubernetes.host_aliases]]
        ip = "192.168.10.150"
        hostnames = ["gitlab.local.com"]
```

## 创建helm资源
```bash
[root@tiaoban gitlab-runner]# helm install gitlab-runner -n cicd . -f values.yaml
NAME: gitlab-runner
LAST DEPLOYED: Tue Jul 23 23:27:39 2024
NAMESPACE: cicd
STATUS: deployed
REVISION: 1
TEST SUITE: None
NOTES:
Your GitLab Runner should now be registered against the GitLab instance reachable at: "http://gitlab.cicd.svc/"

Runner namespace "cicd" was found in runners.config template.
```

# runner优化
## 使用分布式缓存
修改value.yaml

```bash
runners:
  # runner configuration, where the multi line string is evaluated as a
  # template so you can specify helm values inside of it.
  #
  # tpl: https://helm.sh/docs/howto/charts_tips_and_tricks/#using-the-tpl-function
  # runner configuration: https://docs.gitlab.com/runner/configuration/advanced-configuration.html
  config: |
    [[runners]]
      # 缓存项目的依赖包，从而大大减少项目构建的时间
      [runners.cache]
        # Type 可以选择 s3 和 gc3 两种对象存储协议
        Type = "s3"
        # Shared 字段控制不同 runner 之间的缓存是否共享，默认是 false
        Shared = false
        [runners.cache.s3]
          ServerAddress = "minio-service.minio.svc:9000"
          AccessKey = "syGCsrY5RWDNPb4VSdRs"
          SecretKey = "uSpAF1rWEQIF8laZpaZGMA9kBTlI5FYWF0qPKr5X"
          # 桶名
          BucketName = "gitlab-runner-cache"
          Insecure = true
```

## 缓存目录持久化



