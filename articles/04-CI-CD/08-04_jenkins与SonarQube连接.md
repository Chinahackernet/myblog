# jenkins与SonarQube连接

> 分类：CI/CD / 第8章：Jenkins工具链集成
> 原文：https://www.cuiliangblog.cn/detail/section/165534414
> 来源：崔亮的博客

---

# <font style="color:rgb(77, 77, 77);">jenkins安装插件</font>
## **<font style="color:rgb(77, 77, 77);">下载SonarQube插件</font>**
<font style="color:rgb(77, 77, 77);">进入Jenkins的系统管理->插件管理->可选插件，搜索框输入sonarqube，安装重启。</font>

![](assets/04-CI-CD/40746a816475db20060f.png)

## 启用SonarQube
<font style="color:rgb(77, 77, 77);">Jenkins的系统管理->系统配置，添加SonarQube服务。</font>

![](assets/04-CI-CD/06e2987f31a83367dd86.png)

# SonarQube配置
## 禁用审查结果上传到SCM功能
![](assets/04-CI-CD/1b81cf30c0676a5a018b.png)

## 生成token
![](assets/04-CI-CD/36181fccc33b4ae1f2bb.png)

# jenkins配置
## 添加令牌
<font style="color:rgb(77, 77, 77);">Jenkins的系统管理->系统配置->添加token</font>

![](assets/04-CI-CD/9600169b2ce2345ff037.png)

<font style="color:rgb(77, 77, 77);">类型切换成Secret text，粘贴token，点击添加。</font>

![](assets/04-CI-CD/b93516f6e563f22df9f6.png)

<font style="color:rgb(77, 77, 77);">选上刚刚添加的令牌凭证，点击应用保存。</font>

![](assets/04-CI-CD/d04096e99b7edd6a082e.png)

<font style="color:rgb(77, 77, 77);"></font>

## <font style="color:rgb(77, 77, 77);">SonarQube Scanner 安装</font>
<font style="color:rgb(77, 77, 77);">进入Jenkins的系统管理->全局工具配置，下滑找到图片里的地方，点击新增SonarQube Scanner，我们选择自动安装并选择最新的版本。</font>

![](assets/04-CI-CD/ae253b1c11c14c271e39.png)

# <font style="color:rgb(77, 77, 77);">非流水线项目添加代码审查</font>
## 添加构建步骤
编辑之前的自由风格构建的demo项目，在构建阶段新增步骤。

![](assets/04-CI-CD/cc27866c0a8eab2489dc.png)

analysis properties参数如下

```bash
# 项目名称id，全局唯一
sonar.projectKey=sprint_boot_demo
# 项目名称
sonar.projectName=sprint_boot_demo
sonar.projectVersion=1.0
# 扫描路径，当前项目根目录
sonar.sources=./src
# 排除目录
sonar.exclusions=**/test/**,**/target/**
# jdk版本
sonar.java.source=1.17
sonar.java.target=1.17
# 字符编码
sonar.sourceEncoding=UTF-8
# binaries路径
sonar.java.binaries=target/classes
```

## 构建并查看结果
jenkins点击立即构建，查看构建结果

![](assets/04-CI-CD/158fc91b8c0a77cb3493.png)

查看SonarQube扫描结果

![](assets/04-CI-CD/2907ba8d0142418e115a.png)

# 流水线项目添加代码审查
## 创建sonar-project.properties文件
项目根目录下，创建sonar-project.properties文件，内容如下

```bash
# 项目名称id，全局唯一
sonar.projectKey=sprint_boot_demo
# 项目名称
sonar.projectName=sprint_boot_demo
sonar.projectVersion=1.0
# 扫描路径，当前项目根目录
sonar.sources=./src
# 排除目录
sonar.exclusions=**/test/**,**/target/**
# jdk版本
sonar.java.source=1.17
sonar.java.target=1.17
# 字符编码
sonar.sourceEncoding=UTF-8
# binaries路径
sonar.java.binaries=target/classes
```

## 修改Jenkinsfile
加入SonarQube代码审查阶段 

```bash
pipeline {
    agent any

    stages {
        stage('拉取代码') {
            steps {
                echo '开始拉取代码'
                checkout([$class: 'GitSCM', 
                          branches: [[name: '*/main']], 
                          userRemoteConfigs: [[url: 'https://gitee.com/cuiliang0302/sprint_boot_demo.git']]])
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
            steps {
                echo '开始代码审查'
                script {
                    // 引入SonarQube scanner，名称与jenkins 全局工具SonarQube Scanner的name保持一致
                    def scannerHome = tool 'SonarQube'
                    // 引入SonarQube Server，名称与jenkins 系统配置SonarQube servers的name保持一致
                    withSonarQubeEnv('SonarQube') {
                        sh "${scannerHome}/bin/sonar-scanner"
                    }
                }
                echo '代码审查完成'
            }
        }
        
        stage('部署项目') {
            steps {
                echo '开始部署项目'
                echo '部署项目完成'
            }
        }
    }
}

```

## 构建测试
![](assets/04-CI-CD/d552d67668aa902b8ac0.png)

 		

 	 


