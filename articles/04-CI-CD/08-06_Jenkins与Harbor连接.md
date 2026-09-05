# Jenkins与Harbor连接

> 分类：CI/CD / 第8章：Jenkins工具链集成
> 原文：https://www.cuiliangblog.cn/detail/section/166573065
> 来源：崔亮的博客

---

# Jenkins服务器安装docker
具体安装步骤参考文档：[../11_Docker/01-02_docker%E5%AE%89%E8%A3%85%E4%B8%8E%E5%8D%B8%E8%BD%BD.md](articles/11-Docker/01-02_docker安装与卸载.md)

添加harbor私有仓库

```bash
[root@jenkins ~]# cat /etc/docker/daemon.json 
{
    "insecure-registries": [
        "https://harbor.local.com"
    ]
}
```

修改docker sock权限，允许jenkins调用

```bash
[root@jenkins ~]# chmod 666 /var/run/docker.sock
```

或者将jenkins用户添加到默认docker用户组下, 从而保证jenkins可以直接访问/var/run/docker.sock

```bash
[root@jenkins ~]# usermod -a -G docker jenkins
```

# 配置Jenkins
## 安装插件
**安装Docker Pipeline插件**

![](assets/04-CI-CD/5d934600a9fe8d39f7f5.png)

## 为Harbor添加凭证
![](assets/04-CI-CD/eb53330eacd6dbcf3b46.png)

## 安装Version Number插件
因为要自动给镜像打上tag，所以这里涉及到tag的取名规则，我用了一个Version Number 的插件，它能够获取到当天的年，月，日数据，我可以利用它来为tag进行取名。

![](assets/04-CI-CD/5cdff7159acbdc933eca.png)

# 修改pipeline
## 修改pipeline脚本
完整脚本如下：

```groovy
pipeline {
    agent any
    environment {  
        VERSION = VersionNumber versionPrefix:'prod.', versionNumberString: '${BUILD_DATE_FORMATTED, "yyyyMMdd"}.${BUILDS_TODAY}'
    } 
    stages {
        stage('构建镜像') {
            environment {
                // harbor信息
                HARBOR_CRED = "harbor-cuiliang"
                HARBOR_URL = "harbor.local.com"
                HARBOR_PROJECT = "spring_boot_demo"
                // image信息
                IMAGE_APP = "demo"
                IMAGE_TAG = sh(script: "git rev-parse --short HEAD", returnStdout: true).trim()
                IMAGE_NAME = "${HARBOR_URL}/${HARBOR_PROJECT}/${IMAGE_APP}:${IMAGE_TAG}"
            }
            steps {
                echo '开始构建镜像'
                script {
                    docker.build "${IMAGE_NAME}"
                }
                echo '构建镜像完成'
                echo '开始推送镜像'
                script {
                    docker.withRegistry("https://${HARBOR_URL}", "${HARBOR_CRED}") {
                        docker.image("${IMAGE_NAME}").push()
                    }
                }
                echo '推送镜像完成'
                echo '开始删除镜像'
                script {
                    sh "docker rmi -f ${IMAGE_NAME}"
                }
                echo '删除镜像完成'
            }
        }
    }
}
```

## 完成构建
![](assets/04-CI-CD/3dbc33eaeea515c9f5e1.png)

## 验证Harbor仓库镜像
![](assets/04-CI-CD/d659c05445261787b4e0.png)


