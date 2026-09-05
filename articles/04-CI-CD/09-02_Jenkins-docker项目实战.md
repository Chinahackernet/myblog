# Jenkins+docker项目实战

> 分类：CI/CD / 第9章：Jenkins CICD项目实战
> 原文：https://www.cuiliangblog.cn/detail/section/169621642
> 来源：崔亮的博客

---

# 准备工作
## 服务器列表
| 服务器名称 | 主机名 | IP | 部署服务 |
| --- | --- | --- | --- |
| 代码托管服务器 | gitlab | 192.168.10.72 | Gitlab |
| 持续集成服务器 | jenkins | 192.168.10.73 | Jenkins、Maven、Docker |
| 代码审查服务器 | sonarqube | 192.168.10.71 | SonarQube |
| 镜像仓库服务器 | harbor | 192.168.10.100 | Docker、harbor |
| 服务部署服务器 | springboot | 192.168.10.74 | Docker |


## 服务部署(rpm方式)
gitlab部署

参考文档：[10-01_gitlab%E9%83%A8%E7%BD%B2%28rpm%29.md](articles/04-CI-CD/10-01_gitlab部署-rpm-.md)

jenkins部署

参考文档：[05-01_jenkins%E9%83%A8%E7%BD%B2%28rpm%29.md](articles/04-CI-CD/05-01_jenkins部署-rpm-.md)

docker部署

参考文档：[../11_Docker/01-02_docker%E5%AE%89%E8%A3%85%E4%B8%8E%E5%8D%B8%E8%BD%BD.md](articles/11-Docker/01-02_docker安装与卸载.md)

harbor部署

参考文档：[../06_Kubernetes/03-01_%E9%83%A8%E7%BD%B2Harbor%E7%A7%81%E6%9C%89%E9%95%9C%E5%83%8F%E4%BB%93%E5%BA%93.md](articles/06-Kubernetes/03-01_部署Harbor私有镜像仓库.md)

SonarQube部署

参考文档：[02-02_SonarQube%E9%83%A8%E7%BD%B2%28rpm%29.md](articles/04-CI-CD/02-02_SonarQube部署-rpm-.md)

# harbor项目权限配置
## 创建项目
Harbor的项目分为公开和私有的:  
公开项目:所有用户都可以访问，通常存放公共的镜像，默认有一个library公开项目。  
私有项目:只有授权用户才可以访问，通常存放项目本身的镜像。 我们可以为微服务项目创建一个新的项目  
![](assets/04-CI-CD/3869a537676fea48a432.png)

## 创建用户
创建一个普通用户cuiliang。  
![](assets/04-CI-CD/60ece9d8bd8012d3934e.png)

## 配置项目用户权限
在spring_boot_demo项目中添加普通用户cuiliang，并设置角色为开发者。  
![](assets/04-CI-CD/2a55dadfe9b2c3aadaf0.png)  
权限说明

| 角色 | 权限 |
| --- | --- |
| 访客 | 对项目有只读权限 |
| 开发人员 | 对项目有读写权限 |
| 维护人员 | 对项目有读写权限、创建webhook权限 |
| 项目管理员 | 出上述外，还有用户管理等权限 |


## 上传下载镜像测试
可参考文章[../06_Kubernetes/03-01_%E9%83%A8%E7%BD%B2Harbor%E7%A7%81%E6%9C%89%E9%95%9C%E5%83%8F%E4%BB%93%E5%BA%93.md](articles/06-Kubernetes/03-01_部署Harbor私有镜像仓库.md)，此处不再赘述。

# gitlab项目权限配置
具体gitlab权限配置参考文档：[11-02_gitlab%E6%9D%83%E9%99%90.md](articles/04-CI-CD/11-02_gitlab权限.md)  
创建开发组develop，用户cuiliang，项目spring boot demo

## 创建组
管理员用户登录，创建群组，组名称为devops，组权限为私有

![](assets/04-CI-CD/c851a1258c0dcbfaa654.png)

## 创建项目
导入外部项目，地址为[https://gitee.com/cuiliang0302/spring_boot_demo.git](https://gitee.com/cuiliang0302/spring_boot_demo.git)，并指定devops，项目类型为私有。

![](assets/04-CI-CD/92becb21a7e02aaab666.png)

## 创建用户
创建一个普通用户cuiliang  
![](assets/04-CI-CD/f56f3d7a797e7c16bed5.png)

## 用户添加到组中
将cuiliang添加到群组devops中，cuiliang角色为Developer

![](assets/04-CI-CD/5e7635dca64040b5cbb8.png)

## 开启分支推送权限
![](assets/04-CI-CD/cf5b42f52aa2d13f4af5.png)

# jenkins流水线配置
## 拉取gitlab仓库代码
具体步骤可参考文档：[08-01_jenkins%E4%B8%8Egitlab%E8%BF%9E%E6%8E%A5.md](articles/04-CI-CD/08-01_jenkins与gitlab连接.md)，此处以账号密码验证为例，并启用webhook配置。  
jenkins流水线配置如下  
![](assets/04-CI-CD/85590b896a59bae1bfbe.png)  
拉取代码部分的jenkinsfile如下

```groovy
pipeline {
    agent any
    stages {
        stage('拉取代码') {
            environment {
                // gitlab仓库信息
                GITLAB_CRED = "gitlab-cuiliang-password"
                GITLAB_URL = "http://192.168.10.72/devops/spring_boot_demo.git"
            }
            steps {
                echo '开始拉取代码'
                checkout scmGit(branches: [[name: '*/master']], extensions: [], userRemoteConfigs: [[credentialsId: "${GITLAB_CRED}", url: "${GITLAB_URL}"]])
                echo '拉取代码完成'
            }
        }
    }
}
```

当git仓库提交代码后，Gitlab会自动请求Jenkins的webhook地址，自动触发流水线，执行结果如下：  
![](assets/04-CI-CD/e021f32eb72682aa1e96.png)

## Maven打包编译
具体步骤可参考文档：[08-02_jenkins%E4%B8%8EMaven%E9%9B%86%E6%88%90.md](articles/04-CI-CD/08-02_jenkins与Maven集成.md)  
打包编译部分的jenkinsfile如下

```groovy
pipeline {
    agent any
    stages {
        stage('拉取代码') {
            ……
        }

        stage('打包编译') {
            steps {
                echo '开始打包编译'
                sh 'mvn clean package'
                echo '打包编译完成'
            }
        }
    }
}
```

触发流水线结果如下  
![](assets/04-CI-CD/1986597237a98378f189.png)

## SonarQube代码审查
具体步骤可参考文档：[08-04_jenkins%E4%B8%8ESonarQube%E8%BF%9E%E6%8E%A5.md](articles/04-CI-CD/08-04_jenkins与SonarQube连接.md)  
代码审查阶段的jenkinsfile如下

```groovy
pipeline {
    agent any
    stages {
        stage('拉取代码') {
            ……
        }

        stage('打包编译') {
            ……
        }

        stage('代码审查') {
            environment {
                // SonarQube信息
                SONARQUBE_SCANNER = "SonarQubeScanner"
                SONARQUBE_SERVER = "SonarQubeServer"
            }
            steps{
                echo '开始代码审查'
                script {
                    def scannerHome = tool "${SONARQUBE_SCANNER}"
                    withSonarQubeEnv("${SONARQUBE_SERVER}") {
                        sh "${scannerHome}/bin/sonar-scanner -Dproject.settings=cicd/sonar-project.properties"
                    }
                }
                echo '代码审查完成'
            }
        }
    }
}
```

触发流水线结果如下  
![](assets/04-CI-CD/6e93004ed7d73f149b7f.png)  
代码审查结果如下  
![](assets/04-CI-CD/65f2abc571dd87109ad0.png)

## 构建并推送镜像至仓库
具体步骤可参考文档：[08-06_Jenkins%E4%B8%8EHarbor%E8%BF%9E%E6%8E%A5.md](articles/04-CI-CD/08-06_Jenkins与Harbor连接.md)  
构建并推送镜像的jenkinsfile如下

```groovy
pipeline {
    agent any
    stages {
        stage('拉取代码') {
            ……
        }

        stage('打包编译') {
            ……
        }

        stage('代码审查') {
            ……
        }

        stage('构建镜像') {
            environment {
                // harbor仓库信息
                HARBOR_URL = "harbor.local.com"
                HARBOR_PROJECT = "devops"
                // 镜像名称
                IMAGE_TAG = sh(script: "git rev-parse --short HEAD", returnStdout: true).trim()
            }
            steps {
                echo '开始构建镜像'
                script {
                    IMAGE_NAME = "${HARBOR_URL}/${HARBOR_PROJECT}/${IMAGE_APP}:${IMAGE_TAG}"
                    docker.build "${IMAGE_NAME}", "-f cicd/Dockerfile ."
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

触发流水线结果如下  
![](assets/04-CI-CD/3e55f21334dceed66853.png)  
查看harbor镜像仓库，已上传镜像  
![](assets/04-CI-CD/9a868e6a61b2486812ed.png)

## docker运行服务
远程执行命令具体内容可参考文档：[08-05_jenkins%E8%BF%9C%E7%A8%8B%E6%9C%8D%E5%8A%A1%E5%99%A8%E6%89%A7%E8%A1%8Cshell.md](articles/04-CI-CD/08-05_jenkins远程服务器执行shell.md)  
部署运行阶段的jenkinsfile如下

```groovy
pipeline {
    agent any
    environment {
        // 全局变量
        HARBOR_CRED = "harbor-cuiliang-password"
        IMAGE_NAME = ""
        IMAGE_APP = "demo"
    } 
    stages {
        stage('拉取代码') {
            ……
        }

        stage('打包编译') {
            ……
        }

        stage('代码审查') {
            ……
        }

        stage('构建镜像') {
            ……
        }
        stage('项目部署') {
            environment {
                // 目标主机信息
                HOST_NAME = "springboot1"
            }
            steps {
                echo '开始部署项目'
                // 获取harbor账号密码
                withCredentials([usernamePassword(credentialsId: "${HARBOR_CRED}", passwordVariable: 'HARBOR_PASSWORD', usernameVariable: 'HARBOR_USERNAME')]) {
                    // 执行远程命令
                    sshPublisher(publishers: [sshPublisherDesc(configName: "${HOST_NAME}", transfers: [sshTransfer(
                        cleanRemote: false, excludes: '', execCommand: "sh -x /opt/jenkins/springboot/deployment-docker.sh ${HARBOR_USERNAME} ${HARBOR_PASSWORD} ${IMAGE_NAME} ${IMAGE_APP}",
                        execTimeout: 120000, flatten: false, makeEmptyDirs: false, noDefaultExcludes: false, patternSeparator: '[, ]+', remoteDirectory: '/opt/jenkins/springboot',
                        remoteDirectorySDF: false, removePrefix: '', sourceFiles: 'cicd/deployment-docker.sh')], usePromotionTimestamp: false, useWorkspaceInPromotion: false, verbose: false
                    )])
                }
                echo '部署项目完成'
            }
        }
    }
}
```

触发流水线后运行结果如下  
![](assets/04-CI-CD/4bd6ea29a76872a4e045.png)  
登录springboot服务器验证

```groovy
[root@springboot ~]# docker ps
CONTAINER ID   IMAGE                                            COMMAND                CREATED              STATUS                          PORTS                                       NAMES
e80896487125   harbor.local.com/spring_boot_demo/demo:8880a30   "java -jar /app.jar"   About a minute ago   Up About a minute (unhealthy)   0.0.0.0:8888->8888/tcp, :::8888->8888/tcp   demo
[root@springboot ~]# curl 127.0.0.1:8888/
<h1>Hello SpringBoot</h1><p>Version:v2 Env:test</p>[root@springboot1 ~]# 
[root@springboot ~]# ls /opt/jenkins/springboot/
deployment.sh  Dockerfile  email.html  Jenkinsfile  LICENSE  mvnw  mvnw.cmd  pom.xml  readme.md  sonar-project.properties  src  target  test
```

## 添加邮件通知推送
发送邮件配置具体内容可参考文档：[07-07_jenkins%E9%82%AE%E4%BB%B6%E9%80%9A%E7%9F%A5%E9%85%8D%E7%BD%AE.md](articles/04-CI-CD/07-07_jenkins邮件通知配置.md)  
在项目根路径下新增email.html文件，内容如下

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${ENV, var="JOB_NAME"}-第${BUILD_NUMBER}次构建日志</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        line-height: 1.6;
        margin: 0;
        padding: 0;
      }
      .container {
        max-width: 1000px;
        margin: 20px auto;
        padding: 20px;
        border: 1px solid #ccc;
        border-radius: 5px;
      }
      .container h2 {
        text-align: center;
      }
      .logo img {
        max-width: 150px;
        height: auto;
      }
      .content {
        padding: 20px;
        background-color: #f9f9f9;
        border-radius: 5px;
      }
      .footer {
        margin-top: 20px;
        text-align: center;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="content">
        <h2>Jenkins ${PROJECT_NAME}项目构建结果</h2>
        <p>尊敬的用户：</p>
        <p>${PROJECT_NAME}项目构建结果为<span style="color:red;font-weight: bold;">${BUILD_STATUS}</span>，以下是详细信息：</p>
        <h4>构建信息</h4>
        <hr/>
        <ul>
          <li>项目名称：${PROJECT_NAME}</li>
          <li>构建编号：第${BUILD_NUMBER}次构建</li>
          <li>触发原因：${CAUSE}</li>
          <li>构建状态：${BUILD_STATUS}</li>
          <li>构建日志：<a href="${BUILD_URL}console">${BUILD_URL}console</a></li>
          <li>构建Url：<a href="${BUILD_URL}">${BUILD_URL}</a></li>
          <li>工作目录：<a href="${PROJECT_URL}ws">${PROJECT_URL}ws</a></li>
          <li>项目Url：<a href="${PROJECT_URL}">${PROJECT_URL}</a></li>
        </ul>
        <h4>失败用例</h4>
        <hr/>
        <p>$FAILED_TESTS</p>
        <h4>最近提交</h4>
        <hr/>
        <ul>
          ${CHANGES_SINCE_LAST_SUCCESS, reverse=true, format="%c", changesFormat="<li>%d [%a] %m</li>"}
        </ul>
        <h4>提交详情</h4>
        <hr/>
        <p><a href="${PROJECT_URL}changes">${PROJECT_URL}changes</a></p>
        <p style="margin-top:50px">如有任何疑问或需要帮助，请随时联系我们。</p>
      </div>
      <div class="footer">
        <p>此为系统自动发送邮件，请勿回复。</p>
      </div>
    </div>
  </body>
</html>
```

完整的jenkinsfile如下

```groovy
pipeline {
    agent any
    environment {
        // 全局变量
        HARBOR_CRED = "harbor-cuiliang-password"
        IMAGE_NAME = ""
        IMAGE_APP = "demo"
    } 
    stages {
        stage('拉取代码') {
            environment {
                // gitlab仓库信息
                GITLAB_CRED = "gitlab-cuiliang-password"
                GITLAB_URL = "http://192.168.10.72/devops/spring_boot_demo.git"
            }
            steps {
                echo '开始拉取代码'
                checkout scmGit(branches: [[name: '*/master']], extensions: [], userRemoteConfigs: [[credentialsId: "${GITLAB_CRED}", url: "${GITLAB_URL}"]])
                echo '拉取代码完成'
            }
        }
        stage('打包编译') {
            steps {
                echo '开始打包编译'
                sh 'mvn clean package'
                echo '打包编译完成'
            }
        }
        stage('代码审查') {
            environment {
                // SonarQube信息
                SONARQUBE_SCANNER = "SonarQubeScanner"
                SONARQUBE_SERVER = "SonarQubeServer"
            }
            steps{
                echo '开始代码审查'
                script {
                    def scannerHome = tool "${SONARQUBE_SCANNER}"
                    withSonarQubeEnv("${SONARQUBE_SERVER}") {
                        sh "${scannerHome}/bin/sonar-scanner -Dproject.settings=cicd/sonar-project.properties"
                    }
                }
                echo '代码审查完成'
            }
        }
        stage('构建镜像') {
            environment {
                // harbor仓库信息
                HARBOR_URL = "harbor.local.com"
                HARBOR_PROJECT = "devops"
                // 镜像名称
                IMAGE_TAG = sh(script: "git rev-parse --short HEAD", returnStdout: true).trim()
            }
            steps {
                echo '开始构建镜像'
                script {
                    IMAGE_NAME = "${HARBOR_URL}/${HARBOR_PROJECT}/${IMAGE_APP}:${IMAGE_TAG}"
                    docker.build "${IMAGE_NAME}", "-f cicd/Dockerfile ."
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
        stage('项目部署') {
            environment {
                // 目标主机信息
                HOST_NAME = "springboot1"
            }
            steps {
                echo '开始部署项目'
                // 获取harbor账号密码
                withCredentials([usernamePassword(credentialsId: "${HARBOR_CRED}", passwordVariable: 'HARBOR_PASSWORD', usernameVariable: 'HARBOR_USERNAME')]) {
                    // 执行远程命令
                    sshPublisher(publishers: [sshPublisherDesc(configName: "${HOST_NAME}", transfers: [sshTransfer(
                        cleanRemote: false, excludes: '', execCommand: "sh -x /opt/jenkins/springboot/deployment-docker.sh ${HARBOR_USERNAME} ${HARBOR_PASSWORD} ${IMAGE_NAME} ${IMAGE_APP}",
                        execTimeout: 120000, flatten: false, makeEmptyDirs: false, noDefaultExcludes: false, patternSeparator: '[, ]+', remoteDirectory: '/opt/jenkins/springboot',
                        remoteDirectorySDF: false, removePrefix: '', sourceFiles: 'cicd/deployment-docker.sh')], usePromotionTimestamp: false, useWorkspaceInPromotion: false, verbose: false
                    )])
                }
                echo '部署项目完成'
            }
        }
    }
    post {
        always {
            echo '开始发送邮件通知'
            // 构建后发送邮件
            emailext(
                subject: '构建通知：${PROJECT_NAME} - Build # ${BUILD_NUMBER} - ${BUILD_STATUS}!',
                body: '${FILE,path="email.html"}',
                to: 'cuiliang0302@qq.com'
            )
            echo '邮件通知发送完成'
        }
    }
}
```

触发流水线后运行结果如下  
![](assets/04-CI-CD/eca8fef8bd241a573e15.png)  
邮件通知内容如下  
![](assets/04-CI-CD/19d083ae58fa0f8cbbe1.png)  
至此，整个CICD流程完成。


