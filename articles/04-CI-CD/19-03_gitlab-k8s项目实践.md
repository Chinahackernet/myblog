# gitlab+k8s项目实践

> 分类：CI/CD / 第19章：CI/CD项目综合实践
> 原文：https://www.cuiliangblog.cn/detail/section/173478562
> 来源：崔亮的博客

---

# 项目简介
<font style="color:rgb(48, 49, 51);">利用Container、Gitlab、Gitlab Runner(k8s)、SonarQube、Harbor、Jmeter、Maven、Java技术，搭建一个完整的 CI/CD 管道，实现当开发人员完成代码提交后，开始流水线工作，完成编译打包、单元测试、源码扫描、上传制品、部署服务到Docker容器、自动化测试工作。通过自动化构建、测试、代码质量检查和容器化部署，将开发人员从繁琐的手动操作中解放出来，提高团队的开发效率、软件质量和安全性，实现持续更新迭代和持续部署交付。</font>

## <font style="color:rgb(48, 49, 51);">CI/CD流程图</font>
![](assets/04-CI-CD/4c59af7a874cafe42b98.png)

## <font style="color:rgb(48, 49, 51);">流程说明</font>
1. <font style="color:rgb(48, 49, 51);">开发人员将代码提交到Gitlab代码仓库时，触发持续构建和持续部署流程。</font>
2. <font style="color:rgb(48, 49, 51);">k8s Runner通过maven镜像实现编译打包、单元测试操作。</font>
3. <font style="color:rgb(48, 49, 51);">k8s Runner通过sonar-scanner镜像请求sonarqube服务，实现源码扫描操作。</font>
4. <font style="color:rgb(48, 49, 51);">k8s Runner通过docker-dind镜像实现项目镜像构建并推送至Harbor镜像仓库。</font>
5. <font style="color:rgb(48, 49, 51);">k8s Runner通过执行shell脚本完成镜像拉取以及启动容器服务操作。</font>
6. <font style="color:rgb(48, 49, 51);">k8s Runner通过jmeter镜像实现自动化测试操作。</font>
7. <font style="color:rgb(48, 49, 51);">流水线执行完成后，将结果邮件通知给开发和运维人员。</font>
8. <font style="color:rgb(48, 49, 51);">用户访问项目服务器。</font>

## <font style="color:rgb(48, 49, 51);">k8s资源列表</font>
| **<font style="color:rgb(48, 49, 51);">服务名称</font>** | **<font style="color:rgb(48, 49, 51);">Service/ingress地址</font>** | **<font style="color:rgb(48, 49, 51);">端口</font>** |
| --- | --- | --- |
| <font style="color:rgb(48, 49, 51);">镜像构建服务</font> | <font style="color:rgb(48, 49, 51);">buildkitd.cicd.svc</font> | <font style="color:rgb(48, 49, 51);">1234</font> |
| <font style="color:rgb(48, 49, 51);">代码托管服务</font> | <font style="color:rgb(48, 49, 51);">gitlab.cicd.svc</font> | <font style="color:rgb(48, 49, 51);">80</font> |
| 代码扫描服务 | sonarqube-sonarqube.cicd.svc | 9000 |
| <font style="color:rgb(48, 49, 51);">镜像仓库服务</font> | <font style="color:rgb(48, 49, 51);">harbor.local.com</font> | <font style="color:rgb(48, 49, 51);">443</font> |


# 准备工作
## 服务部署
+ Gitlab：[10-03_gitlab%E9%83%A8%E7%BD%B2%28k8s%29.md](articles/04-CI-CD/10-03_gitlab部署-k8s-.md)
+ <font style="color:rgb(48, 49, 51);">SonarQube</font>：[02-04_SonarQube%E9%83%A8%E7%BD%B2%28k8s%29.md](articles/04-CI-CD/02-04_SonarQube部署-k8s-.md)
+ Harbor：[../06_Kubernetes/03-01_%E9%83%A8%E7%BD%B2Harbor%E7%A7%81%E6%9C%89%E9%95%9C%E5%83%8F%E4%BB%93%E5%BA%93.md](articles/06-Kubernetes/03-01_部署Harbor私有镜像仓库.md)

## 镜像构建服务部署
关于镜像构建问题，如果k8s容器运行时为docker，可以直接使用docker in docker方案，启动一个docker:dind容器，通过绑定宿主机/var/run/docker.sock即可调用。  
如果k8s容器运行时为container，则推荐使用nerdctl+buildkitd方案，启动一个buildkitd服务并暴露1234端口提供构建镜像服务，通过nerdctl命令请求buildkitd服务，执行镜像构建与推送操作，具体内容可参考  
[../06_Kubernetes/02-06_Containerd%E8%BF%9B%E9%98%B6%E4%BD%BF%E7%94%A8.md](articles/06-Kubernetes/02-06_Containerd进阶使用.md)。  
本次实验以container环境为例，通过nerdctl+buildkitd方案，实现构建并推送镜像。

+ buildkitd-configmap.yaml

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: buildkitd-config
  namespace: cicd
data:
  buildkitd.toml: |-
    debug = true
    [registry."docker.io"]
      mirrors = ["934du3yi.mirror.aliyuncs.com"]
    [registry."harbor.local.com"]
      http = false
```

+ buildkitd-deployment.yaml

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  labels:
    app: buildkitd
  name: buildkitd
  namespace: cicd
spec:
  replicas: 1
  selector:
    matchLabels:
      app: buildkitd
  template:
    metadata:
      labels:
        app: buildkitd
    spec:
      containers:
        - name: buildkitd
          # image: moby/buildkit:master-rootless
          image: harbor.local.com/cicd/buildkit:master-rootless
          args:
            - --addr
            - tcp://0.0.0.0:1234
            - --addr
            - unix:///run/user/1000/buildkit/buildkitd.sock
            - --config
            - /etc/buildkitd/buildkitd.toml
          resources:
            requests:
              memory: "1Gi"
              cpu: "1"
            limits:
              memory: "4Gi"
              cpu: "4"
          readinessProbe:
            exec:
              command:
                - buildctl
                - debug
                - workers
          livenessProbe:
            exec:
              command:
                - buildctl
                - debug
                - workers
          securityContext:
            privileged: true
          ports:
            - containerPort: 1234
          volumeMounts:
            - mountPath: /etc/buildkitd
              name: config
      volumes:
        - name: config
          configMap:
            name: buildkitd-config

```

+ buildkitd-svc.yaml

```yaml
apiVersion: v1
kind: Service
metadata:
  labels:
    app: buildkitd
  name: buildkitd
  namespace: cicd
spec:
  ports:
    - port: 1234
      protocol: TCP
  selector:
    app: buildkitd
```

## Runner镜像构建
Runner不仅要构建镜像，还需要操作k8s资源，因此需要构建一个名为gitlab-runner-agent的镜像，dockerfile内容如下：

```dockerfile
FROM alpine:latest
USER root
COPY kubectl /usr/bin/kubectl
COPY nerdctl /usr/bin/nerdctl
COPY buildctl /usr/bin/buildctl
```

## 部署gitlab-runner与优化
部署gitlab-runner具体内容可参考[13-06_runner%E9%83%A8%E7%BD%B2%E4%B8%8E%E6%B3%A8%E5%86%8C%28yaml%29.md](articles/04-CI-CD/13-06_runner部署与注册-yaml-.md)，此处不再赘述，注册后的runner效果如下：

![](assets/04-CI-CD/a6f9264cdd348808a691.png)

部署完gitlab-runner后可根据实际情况进行runner优化，具体可参考文档：[13-07_kubernetes%E7%B1%BB%E5%9E%8Brunner%E4%BC%98%E5%8C%96.md](articles/04-CI-CD/13-07_kubernetes类型runner优化.md)。

## 流水线镜像构建
需要构建maven、sonar-scanner、jmeter镜像，具体可参考文档：[19-02_gitlab%2Bdocker%E9%A1%B9%E7%9B%AE%E5%AE%9E%E8%B7%B5.md](articles/04-CI-CD/19-02_gitlab-docker项目实践.md)

# 模板库资源更新
模板库具体介绍可参考文档：[19-01_gitlab%2Blinux%E9%A1%B9%E7%9B%AE%E5%AE%9E%E8%B7%B5.md](articles/04-CI-CD/19-01_gitlab-linux项目实践.md)，本文是在gitlab+Linux项目基础上补充模板库内容。

## deploy.yml
```yaml
# 服务部署
.deploy-linux: # 部署到linux系统
  stage: deploy
  tags:
    - deploy
  script:
    - sh -x $DEPLOY_PATH $ARTIFACT_USER $ARTIFACTORY_KEY /opt/$ARTIFACT_URL_PATH $ARTIFACTORY_PUBLIC_URL/$ARTIFACT_REPO/$ARTIFACT_URL_PATH

.deploy-docker: # 部署到docker环境
  stage: deploy
  image: harbor.local.com/cicd/docker:dind # 在部署阶段使用docker:dind镜像操作
  tags:
    - docker
  script:
    - sh -x $DEPLOY_PATH $HARBOR_USER $HARBOR_PASSWORD $IMAGE_FULL_NAME $CI_PROJECT_NAME

.deploy-k8s: # 部署到k8s环境
  stage: deploy
  image: harbor.local.com/cicd/gitlab-runner-agent:v1.0 # 在部署阶段使用自定义镜像操作
  tags:
    - k8s
  script:
    - echo $NAME_SPACE
    - echo $DOMAIN_NAME
    - echo $IMAGE_FULL_NAME
    - sed -i "s|NAME_SPACE|${NAME_SPACE}|g" cicd/k8s.yaml
    - sed -i "s|DOMAIN_NAME|${DOMAIN_NAME}|g" cicd/k8s.yaml
    - sed -i "s|IMAGE_NAME|${IMAGE_FULL_NAME}|g" cicd/k8s.yaml
    - cat cicd/k8s.yaml
    - kubectl apply -f cicd/k8s.yaml
```

## harbor.yml
```yaml
# 镜像上传与下载
variables: # 全局变量
  HARBOR_URL: harbor.local.com # harbor仓库地址
  IMAGE_FULL_NAME: "$HARBOR_URL/$HARBOR_REPO/$IMAGE_NAME"

.docker-upload-harbor:
  stage: upload-harbor
  image: harbor.local.com/cicd/docker:dind # 在构建镜像阶段使用docker:dind镜像操作
  tags: # 在docker机器构建镜像
    - docker
  before_script:
    - cat $DOCKERFILE_PATH 
  script:
    - docker build -f $DOCKERFILE_PATH -t $IMAGE_FULL_NAME .
    - docker login $HARBOR_URL -u $HARBOR_USER -p $HARBOR_PASSWORD # 登录harbor
    - docker push $IMAGE_FULL_NAME # 上传镜像
    - docker rmi -f $IMAGE_FULL_NAME # 删除镜像

.docker-download-harbor:
  stage: download-harbor
  image: harbor.local.com/cicd/docker:dind # 在构建镜像阶段使用docker:dind镜像操作
  tags:
    - docker
  script:
    - docker login $HARBOR_URL -u $HARBOR_USER -p $HARBOR_PASSWORD # 登录harbor
    - docker pull $IMAGE_FULL_NAME # 下载镜像
  after_script:
    - docker images

.container-upload-harbor:
  stage: upload-harbor
  image: harbor.local.com/cicd/gitlab-runner-agent:v1.0 # 在构建镜像阶段使用自定义镜像操作
  tags: # 在k8s机器构建镜像
    - k8s
  before_script:
    - cat $DOCKERFILE_PATH 
  script:
    - nerdctl build --buildkit-host tcp://buildkitd.cicd.svc:1234 -f $DOCKERFILE_PATH -t $IMAGE_FULL_NAME .
    - nerdctl login $HARBOR_URL --insecure-registry -u $HARBOR_USER -p $HARBOR_PASSWORD # 登录harbor
    - nerdctl push $IMAGE_FULL_NAME --insecure-registry # 上传镜像
    - nerdctl rmi -f $IMAGE_FULL_NAME # 删除镜像

.container-download-harbor:
  stage: download-harbor
  image: harbor.local.com/cicd/gitlab-runner-agent:v1.0 # 在构建镜像阶段使用自定义镜像操作
  tags:
    - k8s
  script:
    - nerdctl login --insecure-registry $HARBOR_URL -u $HARBOR_USER -p $HARBOR_PASSWORD # 登录harbor
    - nerdctl pull $IMAGE_FULL_NAME --insecure-registry # 下载镜像
  after_script:
    - nerdctl images
```

# 流水线项目创建
## 项目代码仓库地址
gitee：[https://gitee.com/cuiliang0302/spring_boot_demo](https://gitee.com/cuiliang0302/spring_boot_demo)  
github：[https://github.com/cuiliang0302/spring-boot-demo](https://github.com/cuiliang0302/spring-boot-demo)

## gitlab项目权限配置
具体参考文档：[09-02_Jenkins%2Bdocker%E9%A1%B9%E7%9B%AE%E5%AE%9E%E6%88%98.md](articles/04-CI-CD/09-02_Jenkins-docker项目实战.md)

## 配置密钥变量
进入项目——>设置——>CI/CD——>变量

新建SONAR_QUBE_TOEKN、HARBOR_PASSWORD两个变量，取消保护变量，并勾选隐藏变量。

变量配置信息内容如下：

![](assets/04-CI-CD/16784d5133c29b00672f.png)

## 配置邮件发送
具体可参考文档：[15-08_Gitlab%E4%B8%8EEmail%E9%9B%86%E6%88%90.md](articles/04-CI-CD/15-08_Gitlab与Email集成.md)

## 流水线配置
在项目根目录下创建.gitlab-ci.yml文件，流水线内容如下

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
    file: 'jobs/deploy.yml'
  - project: 'devops/gitlabci-template'
    ref: master
    file: 'jobs/jmeter.yml'

variables: # 全局变量
  SONAR_QUBE_PATH: "$CI_PROJECT_DIR/cicd/sonar-project.properties" # sonarqube配置文件地址
  # 镜像上传
  HARBOR_REPO: devops # harbor仓库名
  HARBOR_USER: admin # harbor用户名
  DOCKERFILE_PATH: cicd/Dockerfile # Dockerfile文件路径
  IMAGE_NAME: "$CI_PROJECT_NAME:$CI_COMMIT_BRANCH-$CI_COMMIT_SHORT_SHA" # 镜像名称
  # 服务部署
  DEPLOY_PATH: "$CI_PROJECT_DIR/cicd/deployment-docker.sh" # 服务部署脚本路径
  # 自动化测试
  JMETER_PATH: "$CI_PROJECT_DIR/cicd/jmeter/demo.jmx" # 自动化测试脚本路径

default:
  cache: # 全局缓存配置
    paths:
      - target/

stages:
  - build
  - code_scan
  - product
  - deploy
  - test

mvn: # 编译打包
  stage: build
  extends: .mvn-build
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
  
product: # 上传到harbor仓库
  stage: product
  extends: .container-upload-harbor
  tags:
    - k8s

deploy_to_prod: # 部署到生产环境
  stage: deploy
  extends: .deploy-k8s
  rules:
    - if: '$CI_COMMIT_BRANCH == "master"'
  tags: 
    - k8s
  variables:
    NAME_SPACE: prod
    DOMAIN_NAME: prod.local.com
  after_script:
    - sleep 10
    - kubectl get pod -n $NAME_SPACE -o wide
  environment: # 生产环境
    name: production
    url: http://$DOMAIN_NAME

deploy_to_test: # 部署到测试环境
  stage: deploy
  extends: .deploy-k8s
  rules:
    - if: '$CI_COMMIT_BRANCH == "test"'
  tags: 
    - k8s
  variables:
    NAME_SPACE: prod
    DOMAIN_NAME: prod.local.com
  after_script:
    - sleep 10
    - kubectl get pod -n $NAME_SPACE -o wide
  environment: # 测试环境
    name: test
    url: http://$DOMAIN_NAME

pages: # 自动化测试并收集测试报告
  stage: test
  extends: .jmeter
  image: harbor.local.com/cicd/jmeter:5.6.3 # 自动化阶段使用jmeter镜像
  tags: 
    - k8s
```

# 结果验证
## pod信息查看
```bash
[root@tiaoban ~]# kubectl get pod -n prod
NAME                    READY   STATUS    RESTARTS   AGE
demo-655457bb99-9s8hr   1/1     Running   0          51s
```

其他效果与之前gitlab+linux效果类似，区别在于本次全程使用k8s类型runner运行job任务。


