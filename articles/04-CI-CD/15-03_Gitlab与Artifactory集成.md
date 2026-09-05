# Gitlab与Artifactory集成

> 分类：CI/CD / 第15章：Gitlab工具链集成
> 原文：https://www.cuiliangblog.cn/detail/section/171824788
> 来源：崔亮的博客

---

# Artifactory配置
## 创建仓库
![](assets/04-CI-CD/bcd9b30bb325fbdb60fc.png)

## 获取命令
获取上传命令

![](assets/04-CI-CD/6e34e47f6106d1cbb3ba.png)

获取下载命令

![](assets/04-CI-CD/22345bf5c9b420eac540.png)

# gitlab配置
## 创建Artifactory密钥变量
![](assets/04-CI-CD/702e3a03d60abb19e291.png)

## 编辑流水线
```yaml
default:
  cache: 
    paths: # 定义全局缓存路径
     - target/

variables: # 定义制品存储路径
  ARTIFACT_NAME: $CI_PROJECT_NAME/$CI_COMMIT_BRANCH/$CI_COMMIT_SHORT_SHA-$CI_PIPELINE_ID.jar

stages:
  - build
  - product
  - deploy

build:
  stage: build
  tags:
    - java
  script:
    - mvn clean package # 编译打包
    - ls target

product: 
  stage: product
  tags: # 在java机器上传制品
    - java
  script:
    - curl -uadmin:$ARTIFACTORY_KEY -T target/*.jar "http://192.168.10.76:8081/artifactory/devops/$ARTIFACT_NAME"

deploy:
  stage: deploy
  tags: # 在docker机器下载制品
    - docker
  script:
    - apk add --update curl
    - curl -uadmin:$ARTIFACTORY_KEY -L -O "http://192.168.10.76:8081/artifactory/devops/$ARTIFACT_NAME"
    - ls
  cache:
    policy: push  #不上传缓存
```

## 查看上传信息
![](assets/04-CI-CD/2a3858082ae364dacccc.png)

## 查看下载信息
![](assets/04-CI-CD/2ce554ea3d5cb37a9282.png)


