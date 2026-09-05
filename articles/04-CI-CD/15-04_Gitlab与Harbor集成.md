# Gitlab与Harbor集成

> 分类：CI/CD / 第15章：Gitlab工具链集成
> 原文：https://www.cuiliangblog.cn/detail/section/171825091
> 来源：崔亮的博客

---

# Harbor配置
## 创建项目
Harbor的项目分为公开和私有的:  
公开项目:所有用户都可以访问，通常存放公共的镜像，默认有一个library公开项目。  
私有项目:只有授权用户才可以访问，通常存放项目本身的镜像。 我们可以为devops项目创建一个新的项目

![](assets/04-CI-CD/1faa3957e2af28da130d.png)

## 创建用户
创建一个普通用户cuiliang。

![](assets/04-CI-CD/3e9802332af76fff286c.png)

## 配置项目用户权限
在devops项目中添加普通用户cuiliang，并设置角色为开发者。

![](assets/04-CI-CD/f854c23112f9378055aa.png)  
权限说明

| 角色 | 权限 |
| --- | --- |
| 访客 | 对项目有只读权限 |
| 开发人员 | 对项目有读写权限 |
| 维护人员 | 对项目有读写权限、创建webhook权限 |
| 项目管理员 | 除上述外，还有用户管理等权限 |


## 上传下载镜像测试
可参考文章[../06_Kubernetes/03-01_%E9%83%A8%E7%BD%B2Harbor%E7%A7%81%E6%9C%89%E9%95%9C%E5%83%8F%E4%BB%93%E5%BA%93.md](articles/06-Kubernetes/03-01_部署Harbor私有镜像仓库.md)，此处不再赘述。

# runner配置
如果runner类型为docker，则需要将宿主机的/var/run/docker.sock文件挂载至docker容器中，便于调用宿主机的docker进程构建镜像。

```bash
[root@client2 ~]# vim /etc/gitlab-runner/config.toml
volumes = ["/cache", "/var/run/docker.sock:/var/run/docker.sock"]
```

# gitlab配置
## 新增Dockerfile
在项目根目录创建**<font style="color:rgb(51, 50, 56);background-color:rgb(251, 250, 253);">Dockerfile</font>**文件，内容如下

```dockerfile
FROM openjdk:17-jdk-alpine
EXPOSE 8888
RUN apk --no-cache add curl
ARG JAR_FILE=target/SpringBootDemo-0.0.1-SNAPSHOT.jar
HEALTHCHECK --interval=5s --timeout=3s \
  CMD curl -fs http://127.0.0.1:8888/health || exit 1
ADD ${JAR_FILE} app.jar
CMD ["java","-jar","/app.jar"]
```

## 创建Harbor密码变量
![](assets/04-CI-CD/b667ea9873a50eec6ad9.png)

## 编辑流水线
```yaml
default:
  cache: 
    paths: # 定义全局缓存路径
     - target/

variables: # 定义镜像名称
  IMAGE_NAME: harbor.local.com/devops/$CI_PROJECT_NAME:$CI_COMMIT_BRANCH-$CI_COMMIT_SHORT_SHA-$CI_PIPELINE_ID

stages:
  - build
  - deploy

mvn:
  stage: build
  image: harbor.local.com/cicd/maven:3.9.3 # 构建阶段使用指定的maven镜像
  tags: # 在docker机器打包
    - docker
  script:
    - mvn clean package # 编译打包
    - ls target

docker: 
  stage: build
  image: harbor.local.com/cicd/docker:dind # 在构建镜像阶段使用docker:dind镜像操作
  tags: # 在docker机器构建镜像
    - docker
  script:
    - "docker build -t $IMAGE_NAME . " # 构建镜像
    - "docker login harbor.local.com -u cuiliang -p $HARBOR_PASSWORD" # 登录harbor
    - "docker push $IMAGE_NAME" # 上传镜像
    - "docker rmi -f $IMAGE_NAME " # 删除镜像

deploy:
  stage: deploy
  tags: # 在linux机器拉取镜像测试
    - linux
  script:
    - "docker login harbor.local.com -u cuiliang -p $HARBOR_PASSWORD" # 登录harbor
    - "docker pull $IMAGE_NAME" # 下载镜像
    - "docker run --name $CI_PROJECT_NAME -d -p 8888:8888 $IMAGE_NAME" # 运行容器
  cache:
    policy: push  #跳过上传缓存步骤
```

## 查看验证
查看harbor镜像仓库信息，已成功上传至harbor仓库

![](assets/04-CI-CD/aa7212477cc12160f6b6.png)

查看linux机器，容器已正常运行

```yaml
[root@client1 ~]# docker ps
CONTAINER ID   IMAGE                                                          COMMAND                CREATED          STATUS                    PORTS                                       NAMES
2337d670e00d   harbor.local.com/devops/sprint_boot_demo:master-98edd3d7-108   "java -jar /app.jar"   21 seconds ago   Up 19 seconds (healthy)   0.0.0.0:8888->8888/tcp, :::8888->8888/tcp   sprint_boot_demo
```

如果在部署阶段提示权限异常，可以将gitlab-runner用户添加到docker组

```bash
usermod -aG docker gitlab-runner
```


