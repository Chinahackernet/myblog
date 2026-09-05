# GitOps项目实践

> 分类：CI/CD / 第19章：CI/CD项目综合实践
> 原文：https://www.cuiliangblog.cn/detail/section/177846948
> 来源：崔亮的博客

---

# 项目简介
## 项目说明
本项目构建了一个基于GitOps理念的完整CI/CD管道，旨在实现软件开发与运维的高度自动化和一致性。通过GitLab、GitLab Runner（部署于Kubernetes）、Maven、Java、SonarQube、Harbor以及Argo CD等工具的紧密协作，实现代码提交后自动进行编译打包、单元测试、代码扫描、构建镜像、更新资源清单以及滚动更新、蓝绿部署、金丝雀发布、多集群发布功能。

## CI/CD管道流程
1. 代码提交：开发人员将Java代码提交到GitLab仓库，这一动作将触发CI/CD流水线的启动。
2. 编译与构建：GitLab Runner（基于Kubernetes）自动拉取最新的代码，并使用Maven和Java工具链进行编译和构建，生成可部署的制品（如Docker镜像）。
3. 单元测试与源码扫描：执行单元测试以验证代码的功能性，并通过SonarQube进行静态代码分析，确保代码质量和安全性。
4. 制品上传：将构建好的Docker镜像推送到Harbor私有镜像仓库，作为后续部署的输入。
5. GitOps部署：Argo CD监听Git仓库中的基础设施和应用配置更改，自动将更新应用到Kubernetes集群中。这里，Git仓库成为了基础设施和应用状态的唯一真实来源，所有的部署和更新都基于Git中的配置进行。支持滚动更新、蓝绿部署、金丝雀发布、多集群多环境批量发布等多种部署方式。
6. 持续监控与反馈：通过GitLab Runner、Argo CD等工具的exporter暴露的指标，团队可以实时监控CI/CD流水线的状态和部署结果，

## Gitlab CD劣势
1. agent权限过大：通常授予GitLab Runner集群管理员权限，无法有效通过更有限的权限来限制访问。这意味着必须授予对一个相当简单的功能的完全访问权限，这可能会成为一种隐患。
2. 部署功能单一：GitLab Runner的部署功能主要依赖kubectl工具执行，在Kubernetes集群的深入管理和部署方面，不如专门为此设计的工具如Argo CD全面，例如自动同步、健康检查、回滚、多种发布方式。
3. 审计与合规性：Argo CD提供了更加全面的审计日志，并以git作为唯一来源，除此之外，任何人都不可以对集群进行任何更改，也会被 Operator 还原为git仓库期望状态。

## GitOps优势
1. 强化安全保障：GitOps模式下，部署无需Kubernetes或云平台凭证，仅通过Git仓库更新，减少暴露风险。Git的密码学支持确保变更的真实性和来源，加固集群安全。
2. 统一真实来源：Git作为唯一事实来源，存储所有应用及基础设施配置。利用Git的版控、历史、审计和回滚等功能，简化操作，无需额外工具。
3. 提升开发效率：Git的熟悉度促进快速迭代，加快开发与部署速度，加速产品上市，同时提升系统稳定性和可靠性。
4. 简化合规审计：基础设施变更如同软件项目，通过Git管理，支持Pull Request和Code Review流程，确保合规与透明。

更多gitops介绍可参考文档：[GitOps-崔亮的博客 (cuiliangblog.cn)](articles/04-CI-CD/16-01_GitOps.md)

## <font style="color:rgb(0, 0, 0);">Kustomize对比Helm</font>
<font style="color:#0e0e0e;">Kustomize强调声明式管理，配置即代码。它允许用户通过层次化的覆盖和变更来定制Kubernetes资源，而不需要使用模板。</font>

<font style="color:#0e0e0e;">Helm是一个包管理工具，类似于Linux的apt或yum，旨在简化Kubernetes应用的部署和管理。Helm使用Charts（模板）来定义Kubernetes资源。</font>

<font style="color:#0e0e0e;">以下是两者的差异对比</font>

| <font style="color:rgb(0, 0, 0);">特征</font> | <font style="color:rgb(0, 0, 0);">Helm</font> | <font style="color:rgb(0, 0, 0);">Kustomize</font> |
| :--- | :--- | :--- |
| <font style="color:rgb(0, 0, 0);">模板支持</font> | <font style="color:rgb(0, 0, 0);">√</font> | <font style="color:rgb(0, 0, 0);">×</font> |
| <font style="color:rgb(0, 0, 0);">覆盖支持</font> | <font style="color:rgb(0, 0, 0);">×</font> | <font style="color:rgb(0, 0, 0);">√</font> |
| <font style="color:rgb(0, 0, 0);">打包支持</font> | <font style="color:rgb(0, 0, 0);">√</font> | <font style="color:rgb(0, 0, 0);">×</font> |
| <font style="color:rgb(0, 0, 0);">验证hooks</font> | <font style="color:rgb(0, 0, 0);">√</font> | <font style="color:rgb(0, 0, 0);">×</font> |
| <font style="color:rgb(0, 0, 0);">回滚支持</font> | <font style="color:rgb(0, 0, 0);">√</font> | <font style="color:rgb(0, 0, 0);">×</font> |
| <font style="color:rgb(0, 0, 0);">原生 K8s 集成</font> | <font style="color:rgb(0, 0, 0);">×</font> | <font style="color:rgb(0, 0, 0);">√</font> |
| <font style="color:rgb(0, 0, 0);">声明性</font> | <font style="color:rgb(0, 0, 0);">√</font> | <font style="color:rgb(0, 0, 0);">√</font> |
| <font style="color:rgb(0, 0, 0);">可见性和透明度</font> | <font style="color:rgb(0, 0, 0);">弱</font> | <font style="color:rgb(0, 0, 0);">强</font> |


相较而言Kustomize使用起来更简单，虽然不支持打包与回滚，但我们可以依赖ArgoCD完成这部分功能，更契合GitOps 版本化控制思想。

更多<font style="color:rgb(0, 0, 0);">Kustomize资料可参考文档：</font>[kustomize多环境管理-崔亮的博客 (cuiliangblog.cn)](articles/06-Kubernetes/17-16_kustomize多环境管理.md)

## 项目流程图
![](assets/04-CI-CD/26f28171aacaba8980d6.png)

# 准备工作
## 服务部署
需要部署Gitlab、SonarQube、Harbor、<font style="color:rgb(48, 49, 51);">buildkitd、Gitlab Runner服务，具体可参考文档：</font>[gitlab+k8s项目实战-崔亮的博客 (cuiliangblog.cn)](articles/04-CI-CD/19-03_gitlab-k8s项目实践.md)

部署完成后根据实际情况对Runner进行优化，具体可参考文档：[kubernetes类型runner优化-崔亮的博客 (cuiliangblog.cn)](articles/04-CI-CD/13-07_kubernetes类型runner优化.md)

部署ArgoCD服务，具体可参考文档：[ArgoCD部署-崔亮的博客 (cuiliangblog.cn)](articles/04-CI-CD/16-03_ArgoCD部署.md)

部署<font style="color:rgb(48, 49, 51);">ArgoCD Rollouts服务（可选，如果需要蓝绿部署或金丝雀发布时需要部署），具体可参考文档：</font>[ArgoCD Rollouts-崔亮的博客 (cuiliangblog.cn)](articles/04-CI-CD/18-01_ArgoCD_Rollouts.md)

## Runner镜像构建
<font style="color:rgb(48, 49, 51);">在Gitlab CI流程中，Runner主要的工作包括打包镜像、使用kustomize修改images信息，因此需要构建一个名为gitlab-runner-agent的镜像，dockerfile内容如下：</font>

```dockerfile
FROM alpine:latest
USER root
RUN apk update && \
    apk add --no-cache git && \
    rm -rf /var/cache/apk/*
COPY kustomize /usr/bin/kustomize
COPY nerdctl /usr/bin/nerdctl
COPY buildctl /usr/bin/buildctl
[root@tiaoban ~]# docker build -t harbor.local.com/cicd/gitlab-agent:v1.1 .
```

## <font style="color:rgb(48, 49, 51);">流水线镜像构建</font>
<font style="color:rgb(48, 49, 51);">需要构建maven、sonar-scanner、jmeter镜像，具体可参考文档：</font>[gitlab+docker项目实战-崔亮的博客 (cuiliangblog.cn)](articles/04-CI-CD/19-02_gitlab-docker项目实践.md)

## <font style="color:rgb(48, 49, 51);">项目代码仓库地址</font>
<font style="color:rgb(48, 49, 51);">gitee：</font>[<font style="color:rgb(48, 49, 51);">https://gitee.com/cuiliang0302/spring_boot_demo</font>](https://gitee.com/cuiliang0302/spring_boot_demo)<font style="color:rgb(48, 49, 51);">  
</font><font style="color:rgb(48, 49, 51);">github：</font>[<font style="color:rgb(48, 49, 51);">https://github.com/cuiliang0302/spring-boot-demo</font>](https://github.com/cuiliang0302/spring-boot-demo)

## <font style="color:rgb(48, 49, 51);">gitlab项目权限配置</font>
<font style="color:rgb(48, 49, 51);">具体参考文档：</font>[Jenkins+docker项目实战-崔亮的博客 (cuiliangblog.cn)](articles/04-CI-CD/09-02_Jenkins-docker项目实战.md)

## <font style="color:rgb(48, 49, 51);">配置邮件发送</font>
<font style="color:rgb(48, 49, 51);">具体可参考文档：</font>[Gitlab与Email集成-崔亮的博客 (cuiliangblog.cn)](articles/04-CI-CD/15-08_Gitlab与Email集成.md)

## <font style="color:rgb(48, 49, 51);">创建ci用户并添加至devops组</font>
创建一个名为gitlabci的用户，用于提交<font style="color:rgb(48, 49, 51);">kustomize</font>更新后的资源清单文件。将gitlabci用户角色指定为维护者。

![](assets/04-CI-CD/e375c6ed3f667fa6b7d8.png)

## Argo CD创建project与<font style="color:rgb(48, 49, 51);">Repo</font>
创建project，具体可参考文档：[ArgoCD project-崔亮的博客 (cuiliangblog.cn)](articles/04-CI-CD/16-07_ArgoCD项目管理.md)，project配置如下：

![](assets/04-CI-CD/543017692c730ec89ab2.png)

创建repo，具体可参考文档：[ArgoCD快速体验-崔亮的博客 (cuiliangblog.cn)](articles/04-CI-CD/16-04_ArgoCD快速体验.md)，repo配置如下：

![](assets/04-CI-CD/ff7650c48407bd439da2.png)

# Gitlab CI流程
## <font style="color:rgb(48, 49, 51);">配置密钥变量</font>
<font style="color:rgb(48, 49, 51);">进入项目——>设置——>CI/CD——>变量  
</font><font style="color:rgb(48, 49, 51);">新建SONAR_QUBE_TOEKN、HARBOR_PASSWORD、CI_PASSWORD三个变量，取消保护变量，并勾选隐藏变量。  
</font><font style="color:rgb(48, 49, 51);">变量配置信息内容如下：</font>

![](assets/04-CI-CD/48867c8b869b126cbf94.png)

## 模板库资源更新
<font style="color:rgb(48, 49, 51);">模板库具体介绍可参考文档：</font>[gitlab+linux项目实战-崔亮的博客 (cuiliangblog.cn)](articles/04-CI-CD/19-01_gitlab-linux项目实践.md)<font style="color:rgb(48, 49, 51);">，本文是在gitlab+k8s项目基础上补充模板库内容。</font>

<font style="color:rgb(48, 49, 51);">完整模板库链接：</font>[https://gitee.com/cuiliang0302/gitlabci-template](https://gitee.com/cuiliang0302/gitlabci-template)

+ kustomize.yaml

该job的主要内容是通过kustomize工具，根据不同的分支提交事件，生成不同环境的资源清单，并将镜像替换为最新的镜像地址，并将资源清单文件提交至Gitlab仓库。

```yaml
# 更新kustomize
variables: # 全局变量
  KUSTOMIZE_OVERLAY: '' # kustomize环境目录

.update-kustomize:
  stage: update-kustomize
  tags:
    - build
  only:
    - master
    - test
  before_script:
    - git remote set-url origin http://${CI_USER}:${CI_PASSWORD}@gitlab.local.com/devops/spring_boot_demo.git
    - git config --global user.email "${CI_EMAIL}"
    - git config --global user.name "${CI_USER}"
    - if [ "$CI_COMMIT_BRANCH" == "master" ]; then KUSTOMIZE_OVERLAY="prod"; fi
    - if [ "$CI_COMMIT_BRANCH" == "test" ]; then KUSTOMIZE_OVERLAY="test"; fi
  script:
    - git checkout -B ${CI_COMMIT_BRANCH}
    - cd cicd/kustomize/overlays/${KUSTOMIZE_OVERLAY}
    - kustomize edit set image $CONTAINER_NAME=$IMAGE_FULL_NAME
    - kustomize build .
    - git commit -am '[gitlab ci] kustomize update'
    - git push origin ${CI_COMMIT_BRANCH}
```

## 流水线配置
<font style="color:rgb(48, 49, 51);">在项目根目录下创建.gitlab-ci.yml文件，流水线内容如下</font>

```yaml
include: # 引入模板库公共文件
  - project: 'devops/gitlabci-template'
    ref: master
    file: 'jobs/build.yml'
  - project: 'devops/gitlabci-template'
    ref: master
    file: 'jobs/test.yml'
  - project: 'devops/gitlabci-template'
    ref: master
    file: 'jobs/sonarqube.yml'
  - project: 'devops/gitlabci-template'
    ref: master
    file: 'jobs/harbor.yml'
  - project: 'devops/gitlabci-template'
    ref: master
    file: 'jobs/kustomize.yml'
variables: # 全局变量
  SONAR_QUBE_PATH: "$CI_PROJECT_DIR/cicd/sonar-project.properties" # sonarqube配置文件地址
  # 镜像上传
  HARBOR_REPO: devops # harbor仓库名
  HARBOR_USER: admin # harbor用户名
  DOCKERFILE_PATH: cicd/Dockerfile # Dockerfile文件路径
  IMAGE_NAME: "$CI_PROJECT_NAME:$CI_COMMIT_BRANCH-$CI_COMMIT_SHORT_SHA" # 镜像名称
  # 更新yaml
  CI_USER: gitlabci # gitlab ci用户名
  CI_EMAIL: gitlabci@qq.com # gitlab ci用户邮箱
  CONTAINER_NAME: demo # k8s控制器container名称

default:
  cache: # 全局缓存配置
    paths:
      - target/
      
workflow: # Gitlabci更新不触发流水线
  rules:
    - if: '$GITLAB_USER_LOGIN == "gitlabci"'
      when: never
    - when: always
stages:
  - build
  - code_scan
  - product
  - update_yaml

mvn: # 编译打包
  stage: build
  extends: .mvn_build
  image: harbor.local.com/cicd/maven:v3.9.3 # 构建阶段使用指定的maven镜像
  before_script:
    - ls -lh /home/gitlab-runner/cache/
  tags:
    - k8s
unit_test: # 单元测试
  stage: build
  extends: .mvn_unit_test
  image: harbor.local.com/cicd/maven:v3.9.3 # 构建阶段使用指定的maven镜像
  before_script:
    - ls -lh /home/gitlab-runner/cache/
  tags:
    - k8s
code_scan: # SonarQube代码扫描
  stage: code_scan
  extends: .sonarqube
  image: harbor.local.com/cicd/sonar-scanner-cli:10 # 代码扫描阶段使用sonar-scanner-cli镜像
  before_script:
    - ls target/
  tags:
    - k8s
  
product: # 打包上传镜像到harbor仓库
  stage: product
  image: harbor.local.com/cicd/gitlab-agent:v1.1
  extends: .container_upload_harbor
  tags:
    - k8s

update_yaml: # 更新资源清单
  stage: update_yaml
  image: harbor.local.com/cicd/gitlab-agent:v1.1
  extends: .update_kustomize
  tags:
    - k8s
```

## Gitlab CI结果验证
查看update_yaml阶段kustomize生成的资源清单文件，已完成image和namespace的更新

![](assets/04-CI-CD/12c195d2ec47a2ba9b6c.png)

查看kustomization.yaml文件，已替换并提交最新的镜像地址。

![](assets/04-CI-CD/4a67296c7b3024154770.png)

同样的操作，对test分支配置ci流水线，查看test分支kustomization.yaml文件信息

![](assets/04-CI-CD/d772b07a9338632fca89.png)

至此 CI流程配置完成，CI流程只需要将集成后的文件提交至Gitlab仓库即可，后续CD流程会根据Gitlab资源清单自动完成服务部署与状态同步。

# Argo CD流程(滚动更新)
## 创建APP
Argo CD支持通过web UI、CLI命令行工具、yaml文件创建APP，具体可参考文档[Directory APP创建与配置-崔亮的博客 (cuiliangblog.cn)](articles/04-CI-CD/17-01_Directory_APP.md)

此处以yaml文件创建<font style="color:rgb(48, 49, 51);">Kustomize类型APP为例，具体可参考文档：</font>[Kustomize App创建-崔亮的博客 (cuiliangblog.cn)](articles/04-CI-CD/17-03_Kustomize_App创建.md)，yaml文件内容如下：

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: demo-prod
  namespace: argocd
spec:
  destination:
    namespace: 'prod'
    server: 'https://kubernetes.default.svc'
  source:
    path: cicd/kustomize/overlays/prod
    repoURL: 'http://gitlab.local.com/devops/spring_boot_demo.git'
    targetRevision: 'master'
  sources: []
  project: devops
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
---
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: demo-test
  namespace: argocd
spec:
  destination:
    namespace: 'test'
    server: 'https://kubernetes.default.svc'
  source:
    path: cicd/kustomize/overlays/test
    repoURL: 'http://gitlab.local.com/devops/spring_boot_demo.git'
    targetRevision: 'test'
  sources: []
  project: devops
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
```

此时查看Argo CD页面，已根据master和test分支分别部署了两套demo服务。

![](assets/04-CI-CD/3749bf883fed438ef6e7.png)

## 结果验证
查看pod信息

```bash
[root@tiaoban ~]# kubectl get pod -n prod
NAME                   READY   STATUS    RESTARTS   AGE
demo-7dd977b57-5qdcx   1/1     Running   0          4m41s
[root@tiaoban ~]# kubectl get pod -n test
NAME                    READY   STATUS    RESTARTS   AGE
demo-6b67766cb5-c9fq9   1/1     Running   0          4m32s
```

修改host解析，分别访问测试和生产域名验证。

```bash
[root@tiaoban ~]# curl demo.prod.com
<h1>Hello SpringBoot</h1><p>Version:v1 Env:prod</p> 
[root@tiaoban ~]# curl demo.test.com
<h1>Hello SpringBoot</h1><p>Version:v1 Env:test</p>
```

修改springboot项目源码，将version内容从v1升级为v2，等待gitlab CI和Argo CD执行完成。

![](assets/04-CI-CD/9b3ad7c8ed60e8c71b85.png)

此时查看生产环境pod并访问服务，已经通过deployment滚动更新到v2版本。

```bash
[root@tiaoban ~]# kubectl get pod -n prod
NAME                   READY   STATUS        RESTARTS   AGE
demo-65b44b4d8-58f67   1/1     Running       0          21s
demo-7dd977b57-5qdcx   1/1     Terminating   0          10m
[root@tiaoban ~]# curl demo.prod.com
<h1>Hello SpringBoot</h1><p>Version:v2 Env:prod</p>
```

# Argo CD流程(蓝绿部署)
Argo CD蓝绿部署和金丝雀发布主要依赖<font style="color:rgb(48, 49, 51);">Rollouts组件实现，具体内容可参考文档：</font>[ArgoCD Rollouts-崔亮的博客 (cuiliangblog.cn)](articles/04-CI-CD/18-01_ArgoCD_Rollouts.md)

蓝绿部署具体内容可参考文档：[蓝绿部署-崔亮的博客 (cuiliangblog.cn)](articles/04-CI-CD/18-02_蓝绿部署.md)

## 模板库资源配置
+ rollout.yml

该job的主要内容是将镜像替换为最新的镜像地址，并将资源清单文件提交至Gitlab仓库。

```bash
# 更新rollout资源镜像
.update_rollout:
  stage: update_rollout
  tags:
    - build
  only:
    - master
  before_script:
    - git remote set-url origin http://${CI_USER}:${CI_PASSWORD}@gitlab.local.com/devops/spring_boot_demo.git
    - git config --global user.email "${CI_EMAIL}"
    - git config --global user.name "${CI_USER}"
  script:
    - git checkout -B master
    - sed -i "s|\(image:\s*\).*|\1${IMAGE_FULL_NAME}|" ${ROLLOUT_PATH}
    - git commit -am '[gitlab ci] rollout update'
    - git push origin ${CI_COMMIT_BRANCH}
  after_script:
    - cat ${ROLLOUT_PATH}
```

## 流水线配置
在流水线update_yaml阶段使用上面定义的更新rollout资源job。

```yaml
include: # 引入模板库公共文件
  - project: 'devops/gitlabci-template'
    ref: master
    file: 'jobs/build.yml'
  - project: 'devops/gitlabci-template'
    ref: master
    file: 'jobs/test.yml'
  - project: 'devops/gitlabci-template'
    ref: master
    file: 'jobs/sonarqube.yml'
  - project: 'devops/gitlabci-template'
    ref: master
    file: 'jobs/harbor.yml'
  - project: 'devops/gitlabci-template'
    ref: master
    file: 'jobs/rollout.yml'

variables: # 全局变量
  SONAR_QUBE_PATH: "$CI_PROJECT_DIR/cicd/sonar-project.properties" # sonarqube配置文件地址
  # 镜像上传
  HARBOR_REPO: devops # harbor仓库名
  HARBOR_USER: admin # harbor用户名
  DOCKERFILE_PATH: cicd/Dockerfile # Dockerfile文件路径
  IMAGE_NAME: "$CI_PROJECT_NAME:$CI_COMMIT_BRANCH-$CI_COMMIT_SHORT_SHA" # 镜像名称
  # 更新yaml
  CI_USER: gitlabci # gitlab ci用户名
  CI_EMAIL: gitlabci@qq.com # gitlab ci用户邮箱
  ROLLOUT_PATH: cicd/argo-cd/bluegreen/rollout.yaml # rollout文件路径

workflow: # Gitlabci更新不触发流水线
  rules:
    - if: '$GITLAB_USER_LOGIN == "gitlabci"'
      when: never
    - when: always
    
default:
  cache: # 全局缓存配置
    paths:
      - target/

stages:
  - build
  - code_scan
  - product
  - update_yaml

mvn: # 编译打包
  stage: build
  extends: .mvn_build
  image: harbor.local.com/cicd/maven:v3.9.3 # 构建阶段使用指定的maven镜像
  tags:
    - k8s
  
unit_test: # 单元测试
  stage: build
  extends: .mvn_unit_test
  image: harbor.local.com/cicd/maven:v3.9.3 # 构建阶段使用指定的maven镜像
  tags:
    - k8s

code_scan: # SonarQube代码扫描
  stage: code_scan
  extends: .sonarqube
  image: harbor.local.com/cicd/sonar-scanner-cli:10 # 代码扫描阶段使用sonar-scanner-cli镜像
  before_script:
    - ls target/
  tags:
    - k8s
  
product: # 打包上传镜像到harbor仓库
  stage: product
  image: harbor.local.com/cicd/gitlab-agent:v1.1
  extends: .container_upload_harbor
  tags:
    - k8s

update_yaml: # 更新资源清单
  stage: update_yaml
  image: harbor.local.com/cicd/gitlab-agent:v1.1
  extends: .update_rollout
  tags:
    - k8s
```

## Gitlab CI结果验证
查看update_yaml任务信息，已替换为最近的镜像地址。

![](assets/04-CI-CD/62792c6cf1b3b0413cb8.png)

查看仓库rollout.yaml文件，已经替换为最新的镜像地址。

![](assets/04-CI-CD/1bc9d742b46c6beba91e.png)

## Argo CD创建APP
接下来创建ArgoCD APP，资源清单内容如下：

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: blue-green
  namespace: argocd
spec:
  destination:
    namespace: default
    server: 'https://kubernetes.default.svc'
  source:
    path: cicd/argo-cd/bluegreen
    repoURL: 'http://gitlab.local.com/devops/spring_boot_demo.git'
    targetRevision: master
  sources: []
  project: devops
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
```

此时查看Argo CD页面，已经成功部署了名为blue-green的应用。

![](assets/04-CI-CD/b87f6741f99adef9ca18.png)

## 蓝绿部署验证
添加hosts域名解析后访问，由于刚发布第一个版本，因此正式环境和测试环境都是v1版本的镜像。

```bash
[root@tiaoban ~]# kubectl get pod
NAME                                READY   STATUS    RESTARTS       AGE
bluegreen-rollout-7679f8576-bj9lw   1/1     Running   0              4s
bluegreen-rollout-7679f8576-lrt5r   1/1     Running   0              4s
[root@tiaoban ~]# curl demo.prod.com
<h1>Hello SpringBoot</h1><p>Version:v2 Env:prod</p>
[root@tiaoban ~]# curl demo.test.com
<h1>Hello SpringBoot</h1><p>Version:v1 Env:prod</p>
```

修改springboot项目源码，将version内容从v2升级为v3，等待gitlab CI和Argo CD执行完成。

![](assets/04-CI-CD/9b3ad7c8ed60e8c71b85.png)

此时访问应用生产和测试域名，分别返回不同的版本信息。

```bash
[root@tiaoban ~]# kubectl get pod
NAME                                 READY   STATUS    RESTARTS       AGE
bluegreen-rollout-6f76ccc55c-gbgsc   1/1     Running   0              7s
bluegreen-rollout-7679f8576-bj9lw    1/1     Running   0              3m49s
bluegreen-rollout-7679f8576-lrt5r    1/1     Running   0              3m49s
[root@tiaoban ~]# curl demo.prod.com
<h1>Hello SpringBoot</h1><p>Version:v2 Env:prod</p>
[root@tiaoban ~]# curl demo.test.com
<h1>Hello SpringBoot</h1><p>Version:v3 Env:prod</p>
```

发布新版本后，此时就需要测试人员访问测试域名验证系统功能是否正常，验证无误后，将服务切换至生产域名。

```bash
[root@tiaoban ~]# kubectl argo rollouts promote bluegreen-rollout
rollout 'bluegreen-rollout' promoted
```

此时访问web页面，生产和测试环境均返回v3版本信息。

```bash
[root@tiaoban ~]# kubectl get pod
NAME                                 READY   STATUS    RESTARTS       AGE
bluegreen-rollout-6f76ccc55c-gbgsc   1/1     Running   0              83s
bluegreen-rollout-6f76ccc55c-hcflg   1/1     Running   0              19s
bluegreen-rollout-7679f8576-bj9lw    1/1     Running   0              5m5s
bluegreen-rollout-7679f8576-lrt5r    1/1     Running   0              5m5s
[root@tiaoban ~]# curl demo.prod.com
<h1>Hello SpringBoot</h1><p>Version:v3 Env:prod</p>
[root@tiaoban ~]# curl demo.test.com
<h1>Hello SpringBoot</h1><p>Version:v3 Env:prod</p>
```

至此整个蓝绿发布流程完成。

# Argo CD流程(金丝雀发布)
金丝雀发布具体内容可参考文档：[金丝雀发布-崔亮的博客 (cuiliangblog.cn)](articles/04-CI-CD/18-03_金丝雀发布.md)，此处不再赘述。

## 模板库与流水线配置
模板库与流水线配置与上面的蓝绿部署一致，区别在于流水线中ROLLOUT_PATH指定为金丝雀资源路径

```yaml
variables: # 全局变量
  ROLLOUT_PATH: cicd/argo-cd/canary/rollout.yaml # rollout文件路径
```

## Gitlab CI结果验证
查看流水线update_yaml阶段日志，已经替换为最新的镜像地址。

![](assets/04-CI-CD/15e473f4768d41c8d9e2.png)

## Argo CD创建APP
接下来创建ArgoCD APP，资源清单内容如下：

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: canary
  namespace: argocd
spec:
  destination:
    namespace: default
    server: 'https://kubernetes.default.svc'
  source:
    path: cicd/argo-cd/canary
    repoURL: 'http://gitlab.local.com/devops/spring_boot_demo.git'
    targetRevision: master
  sources: []
  project: devops
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
```

此时查看Argo CD页面，已经成功部署了名为canary的应用。

![](assets/04-CI-CD/5d9440b8233d8a2fbe03.png)

## 金丝雀发布验证
<font style="color:rgb(48, 49, 51);">添加hosts域名解析后访问，由于刚发布第一个版本，因此所有流量都调度到v3版本的服务。</font>

```bash
[root@tiaoban ~]# kubectl get pod
NAME                              READY   STATUS    RESTARTS        AGE
canary-rollout-7d77478fd7-4vdzn   1/1     Running   0               115s
canary-rollout-7d77478fd7-5rbmp   1/1     Running   0               115s
canary-rollout-7d77478fd7-6pm62   1/1     Running   0               115s
canary-rollout-7d77478fd7-98xmk   1/1     Running   0               115s
canary-rollout-7d77478fd7-jv6zk   1/1     Running   0               115s
canary-rollout-7d77478fd7-l22zh   1/1     Running   0               115s
canary-rollout-7d77478fd7-lhxm8   1/1     Running   0               115s
canary-rollout-7d77478fd7-tkfrb   1/1     Running   0               115s
canary-rollout-7d77478fd7-zcgwq   1/1     Running   0               115s
canary-rollout-7d77478fd7-zw4w2   1/1     Running   0               115s
[root@tiaoban ~]# for i in {1..10}; do curl canary.demo.com; done
<h1>Hello SpringBoot</h1><p>Version:v3 Env:prod</p>
<h1>Hello SpringBoot</h1><p>Version:v3 Env:prod</p>
<h1>Hello SpringBoot</h1><p>Version:v3 Env:prod</p>
<h1>Hello SpringBoot</h1><p>Version:v3 Env:prod</p>
<h1>Hello SpringBoot</h1><p>Version:v3 Env:prod</p>
<h1>Hello SpringBoot</h1><p>Version:v3 Env:prod</p>
<h1>Hello SpringBoot</h1><p>Version:v3 Env:prod</p>
<h1>Hello SpringBoot</h1><p>Version:v3 Env:prod</p>
<h1>Hello SpringBoot</h1><p>Version:v3 Env:prod</p>
<h1>Hello SpringBoot</h1><p>Version:v3 Env:prod</p>
```

修改springboot项目源码，将version内容从v3升级为v4，等待gitlab CI和Argo CD执行完成。

![](assets/04-CI-CD/5f7d6208cc6300399791.png)

查看<font style="color:rgb(48, 49, 51);">Rollouts状态，新增了canary-rollout-6c764844bd，运行v4版本的镜像。</font>

```bash
[root@tiaoban ~]#  kubectl argo rollouts get rollout canary-rollout
Name:            canary-rollout
Namespace:       default
Status:          ॥ Paused
Message:         CanaryPauseStep
Strategy:        Canary
  Step:          1/7
  SetWeight:     10
  ActualWeight:  10
Images:          harbor.local.com/devops/spring_boot_demo:master-3bccf809 (canary)
                 harbor.local.com/devops/spring_boot_demo:master-e58822da (stable)
Replicas:
  Desired:       10
  Current:       11
  Updated:       1
  Ready:         11
  Available:     11

NAME                                        KIND        STATUS     AGE  INFO
⟳ canary-rollout                            Rollout     ॥ Paused   12m  
├──# revision:2                                                         
│  └──⧉ canary-rollout-6c764844bd           ReplicaSet  ✔ Healthy  24s  canary
│     └──□ canary-rollout-6c764844bd-dzc4t  Pod         ✔ Running  24s  ready:1/1
└──# revision:1                                                         
   └──⧉ canary-rollout-7d77478fd7           ReplicaSet  ✔ Healthy  12m  stable
      ├──□ canary-rollout-7d77478fd7-4vdzn  Pod         ✔ Running  12m  ready:1/1
      ├──□ canary-rollout-7d77478fd7-5rbmp  Pod         ✔ Running  12m  ready:1/1
      ├──□ canary-rollout-7d77478fd7-6pm62  Pod         ✔ Running  12m  ready:1/1
      ├──□ canary-rollout-7d77478fd7-98xmk  Pod         ✔ Running  12m  ready:1/1
      ├──□ canary-rollout-7d77478fd7-jv6zk  Pod         ✔ Running  12m  ready:1/1
      ├──□ canary-rollout-7d77478fd7-l22zh  Pod         ✔ Running  12m  ready:1/1
      ├──□ canary-rollout-7d77478fd7-lhxm8  Pod         ✔ Running  12m  ready:1/1
      ├──□ canary-rollout-7d77478fd7-tkfrb  Pod         ✔ Running  12m  ready:1/1
      ├──□ canary-rollout-7d77478fd7-zcgwq  Pod         ✔ Running  12m  ready:1/1
      └──□ canary-rollout-7d77478fd7-zw4w2  Pod         ✔ Running  12m  ready:1/1
[root@tiaoban ~]# kubectl get pod
NAME                              READY   STATUS    RESTARTS        AGE
canary-rollout-6c764844bd-dzc4t   1/1     Running   0               28s
canary-rollout-7d77478fd7-4vdzn   1/1     Running   0               12m
canary-rollout-7d77478fd7-5rbmp   1/1     Running   0               12m
canary-rollout-7d77478fd7-6pm62   1/1     Running   0               12m
canary-rollout-7d77478fd7-98xmk   1/1     Running   0               12m
canary-rollout-7d77478fd7-jv6zk   1/1     Running   0               12m
canary-rollout-7d77478fd7-l22zh   1/1     Running   0               12m
canary-rollout-7d77478fd7-lhxm8   1/1     Running   0               12m
canary-rollout-7d77478fd7-tkfrb   1/1     Running   0               12m
canary-rollout-7d77478fd7-zcgwq   1/1     Running   0               12m
canary-rollout-7d77478fd7-zw4w2   1/1     Running   0               12m
rockylinux                        1/1     Running   21 (140m ago)   52d
```

循环请求访问验证,可以看到，在前5分钟只有10%的流量请求到了v4版本的服务中。

```bash
[root@tiaoban ~]# for i in {1..10}; do curl canary.demo.com; done
<h1>Hello SpringBoot</h1><p>Version:v3 Env:prod</p>
<h1>Hello SpringBoot</h1><p>Version:v3 Env:prod</p>
<h1>Hello SpringBoot</h1><p>Version:v3 Env:prod</p>
<h1>Hello SpringBoot</h1><p>Version:v3 Env:prod</p>
<h1>Hello SpringBoot</h1><p>Version:v4 Env:prod</p>
<h1>Hello SpringBoot</h1><p>Version:v3 Env:prod</p>
<h1>Hello SpringBoot</h1><p>Version:v3 Env:prod</p>
<h1>Hello SpringBoot</h1><p>Version:v3 Env:prod</p>
<h1>Hello SpringBoot</h1><p>Version:v3 Env:prod</p>
<h1>Hello SpringBoot</h1><p>Version:v3 Env:prod</p>
```

持续观察流量v4的占比会逐步增加直到最后达到100%。

# Argo CD流程(多集群发布)
我们在实际工作中会存在多个生产、测试集群，通常会将test分支代码发布至测试环境，master分支代码发布至生产环境，Argo同样支持这种多集群模式发布，且配置起来更为简单。

多集群发布配置具体可参考文档：[多集群应用部署-崔亮的博客 (cuiliangblog.cn)](articles/04-CI-CD/18-05_多集群应用部署.md)

## <font style="color:rgb(48, 49, 51);">添加集群</font>
<font style="color:rgb(48, 49, 51);">假设现在有两套集群，已经在k8s-ha集群部署了gitlab和Argocd，现在需要添加k8s-test集群。  
</font><font style="color:rgb(48, 49, 51);">在添加集群前，先配置config上下文，具体内容可参考文档：</font>[kubectl多集群管理-崔亮的博客 (cuiliangblog.cn)](articles/06-Kubernetes/17-17_kubectl多集群管理.md)

```bash
[root@tiaoban .kube]# kubectl config get-contexts
CURRENT   NAME                  CLUSTER    AUTHINFO     NAMESPACE
*         ha-admin@k8s-ha       k8s-ha     ha-admin     
          test-admin@k8s-test   k8s-test   test-admin 
[root@tiaoban .kube]# kubectl get node
NAME      STATUS   ROLES           AGE    VERSION
master1   Ready    control-plane   285d   v1.27.6
master2   Ready    control-plane   285d   v1.27.6
master3   Ready    control-plane   285d   v1.27.6
work1     Ready    <none>          285d   v1.27.6
work2     Ready    <none>          285d   v1.27.6
work3     Ready    <none>          285d   v1.27.6
[root@tiaoban .kube]# kubectl config use-context test-admin@k8s-test
Switched to context "test-admin@k8s-test".
[root@tiaoban .kube]# kubectl get node
NAME         STATUS   ROLES                  AGE   VERSION
k8s-master   Ready    control-plane,master   21h   v1.23.17
k8s-work1    Ready    <none>                 20h   v1.23.17
k8s-work2    Ready    <none>                 20h   v1.23.17
```

<font style="color:rgb(48, 49, 51);">ArgoCD添加集群</font>

```bash
[root@tiaoban ~]# argocd login argocd.local.com
WARNING: server certificate had error: tls: failed to verify certificate: x509: certificate is valid for de4d64dda4cc17aa063ca24baa2abc22.6d1744aa3a6f00c3129e20bc6d196dd0.traefik.default, not argocd.local.com. Proceed insecurely (y/n)? y
WARN[0002] Failed to invoke grpc call. Use flag --grpc-web in grpc calls. To avoid this warning message, use flag --grpc-web. 
Username: admin
Password: CHANGE_ME
Context 'argocd.local.com' updated
[root@tiaoban ~]# argocd cluster add test-admin@k8s-test --kubeconfig=/root/.kube/config
WARNING: This will create a service account `argocd-manager` on the cluster referenced by context `test-admin@k8s-test` with full cluster level privileges. Do you want to continue [y/N]? y
INFO[0003] ServiceAccount "argocd-manager" created in namespace "kube-system" 
INFO[0003] ClusterRole "argocd-manager-role" created    
INFO[0003] ClusterRoleBinding "argocd-manager-role-binding" created 
WARN[0004] Failed to invoke grpc call. Use flag --grpc-web in grpc calls. To avoid this warning message, use flag --grpc-web. 
Cluster 'https://192.168.10.10:6443' added
```

<font style="color:rgb(48, 49, 51);">查看集群状态信息如下  
</font>![](assets/04-CI-CD/415ea458dc8e89e925e4.png)

## <font style="color:rgb(48, 49, 51);">更新Project</font>
<font style="color:rgb(48, 49, 51);">更新devops项目权限配置，允许对k8s-test集群进行操作。</font>

![](assets/04-CI-CD/24b3043afb3bea5e265f.png)

## <font style="color:rgb(48, 49, 51);">创建应用</font>
<font style="color:rgb(48, 49, 51);">创建Argo CD app，按照不同的分支同时发布至不同的k8s集群中。</font>

```yaml
# master分支代码发布至生产环境
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: demo-prod
  namespace: argocd
spec:
  destination:
    namespace: 'prod'
    server: 'https://kubernetes.default.svc'
  source:
    path: cicd/kustomize/overlays/prod
    repoURL: 'http://gitlab.local.com/devops/spring_boot_demo.git'
    targetRevision: 'master'
  sources: []
  project: devops
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
---
# test分支代码发布至测试环境
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: demo-test
  namespace: argocd
spec:
  destination:
    namespace: 'test'
    server: 'https://192.168.10.10:6443'
  source:
    path: cicd/kustomize/overlays/test
    repoURL: 'http://gitlab.local.com/devops/spring_boot_demo.git'
    targetRevision: 'test'
  sources: []
  project: devops
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
```

## <font style="color:rgb(48, 49, 51);">多集群发布验证</font>
<font style="color:rgb(48, 49, 51);">ArgoCD会自动进行发布，查看发布信息如下：</font>

![](assets/04-CI-CD/5b693b80e2e2d6f8d10b.png)<font style="color:rgb(48, 49, 51);">  
</font><font style="color:rgb(48, 49, 51);">此时访问test集群查看资源，已经成功创建myapp2资源。</font>

```bash
[root@tiaoban ~]# kubectl config use-context test-admin@k8s-test
Switched to context "test-admin@k8s-test".
[root@tiaoban ~]# kubectl get pod -n test
NAME                    READY   STATUS    RESTARTS   AGE
demo-6c86b77bd6-dpf4m   1/1     Running   0          3m3s
[root@tiaoban ~]# kubectl config use-context ha-admin@k8s-ha
Switched to context "ha-admin@k8s-ha".
[root@tiaoban ~]# kubectl get pod -n prod
NAME                    READY   STATUS    RESTARTS   AGE
demo-77b7f4576b-vlwtc   1/1     Running   0          3m
```


