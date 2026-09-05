# pipeline-容器

> 分类：CI/CD / 第14章：Gitlab流水线
> 原文：https://www.cuiliangblog.cn/detail/section/171542631
> 来源：崔亮的博客

---

# image
默认在注册runner的时候需要填写一个基础的镜像，请记住一点只要使用执行器为docker类型的runner所有的操作运行都会在容器中运行。 如果全局指定了images则所有作业使用此image创建容器并在其中运行。 全局未指定image，再次查看job中是否有指定，如果有此job按照指定镜像创建容器并运行，没有则使用注册runner时指定的默认镜像。

修改pipeline内容如下：

```yaml
stages:
  - build
  - deploy

build:
  stage: build
  image: harbor.local.com/cicd/maven:3.9.3 # 构建阶段使用指定的maven镜像
  tags:
    - docker
  script:
    - mvn clean package
    - ls target

deploy: 
  stage: deploy # 部署阶段使用注册时默认指定的alpine:latest镜像
  tags:
    - docker
  script:
    - echo "deploy success"
```

此时观察build阶段日志，发现使用了maven镜像执行操作

![](assets/04-CI-CD/4ad48e9d6b548e9766e2.png)

观察deploy阶段日志，则使用默认的alpine镜像执行操作

![](assets/04-CI-CD/d571b5d69f2b899b8f29.png)

# services
job运行期间运行的另一个Docker容器，并link到image关键字定义的Docker容器。这样，您就可以在构建期间访问服务容器.

服务容器可以运行任何应用程序，但是最常见的用例是运行数据库容器，例如mysql 。与每次安装项目时都安装mysql相比，使用现有容器并将其作为附加容器运行更容易，更快捷。

```yaml
stages:
  - build

services: # 运行一个redis容器
  - name: harbor.local.com/library/redis:7
    alias: redis # 指定容器别名

build:
  stage: build
  image: harbor.local.com/library/rockylinux:8
  tags:
    - docker
  script:
    - dnf -y install redis
    - redis-cli -h redis PING # 使用别名连接容器
```

观察执行日志，内容如下，成功访问到了redis服务。

![](assets/04-CI-CD/4285619ab80332bfd770.png)


