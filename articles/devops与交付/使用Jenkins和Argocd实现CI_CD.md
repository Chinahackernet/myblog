CI/CD并不是陌生的东西，大部分企业都有自己的CI/CD，不过今天我要介绍的是使用Jenkins和GitOps实现CI/CD。

  

整体架构如下：

![devops.png](assets/devops与交付/使用Jenkins和Argocd实现CI_CD/使用Jenkins和Argocd实现CI_CD-1.png)

  

  

涉及的软件以及版本信息如下：

<table data-lake-id="Qgzq4" id="Qgzq4" class="lake-table" style="width: 814px"><colgroup><col width="407"><col width="407"></colgroup><tbody><tr data-lake-id="u95529276" id="u95529276" style="height: 33px"><td data-lake-id="u6d747ee8" id="u6d747ee8"><p data-lake-id="3b914248e1537284bb5c08209506e45f" id="3b914248e1537284bb5c08209506e45f"><span data-lake-id="u227a2aa7" id="u227a2aa7"> 软件 </span></p></td><td data-lake-id="u72f9b110" id="u72f9b110"><p data-lake-id="0d734f8e870d20d0bcb1303ec64e18d3" id="0d734f8e870d20d0bcb1303ec64e18d3"><span data-lake-id="ub30f33f9" id="ub30f33f9"> 版本 </span></p></td></tr><tr data-lake-id="u5bf48de5" id="u5bf48de5" style="height: 33px"><td data-lake-id="u330e642a" id="u330e642a"><p data-lake-id="38a42796cdb897307e5de73aad6e5e6e" id="38a42796cdb897307e5de73aad6e5e6e"><span data-lake-id="u70a02fd9" id="u70a02fd9">kubernetes</span></p></td><td data-lake-id="uda3b621e" id="uda3b621e"><p data-lake-id="6aba160dce5c0fe09451d38ea9aaf3e4" id="6aba160dce5c0fe09451d38ea9aaf3e4"><span data-lake-id="u798ae45a" id="u798ae45a">1.17.9</span></p></td></tr><tr data-lake-id="u9459f283" id="u9459f283" style="height: 33px"><td data-lake-id="uffd7e19f" id="uffd7e19f"><p data-lake-id="6e4d70cf48bdec00b89aab0fbe9df3be" id="6e4d70cf48bdec00b89aab0fbe9df3be"><span data-lake-id="u8c60aa60" id="u8c60aa60">docker</span></p></td><td data-lake-id="u18a1c900" id="u18a1c900"><p data-lake-id="ueab09c1d" id="ueab09c1d"><span data-lake-id="u5bd441a0" id="u5bd441a0">19.03.13</span></p></td></tr><tr data-lake-id="u884d7112" id="u884d7112"><td data-lake-id="uf3314928" id="uf3314928" style="background-color: #FFFFFF; vertical-align: top"><p data-lake-id="ue8229c87" id="ue8229c87"><span data-lake-id="ub4fbd1e7" id="ub4fbd1e7">jenkins</span></p></td><td data-lake-id="ud3eb6640" id="ud3eb6640" style="background-color: #FFFFFF; vertical-align: top"><p data-lake-id="u20a4178d" id="u20a4178d"><a href="https://jenkins.io/" target="_blank" data-lake-id="u764e954b" id="u764e954b"><span data-lake-id="u3378e827" id="u3378e827">2.249.3</span></a></p></td></tr><tr data-lake-id="udf772a7d" id="udf772a7d"><td data-lake-id="u51017860" id="u51017860" style="background-color: #FFFFFF; vertical-align: top"><p data-lake-id="uf57191b9" id="uf57191b9"><span data-lake-id="u359d4e5f" id="u359d4e5f">argocd</span></p></td><td data-lake-id="ud82876a2" id="ud82876a2" style="background-color: #FFFFFF; vertical-align: top"><p data-lake-id="u2af1ab60" id="u2af1ab60"><span data-lake-id="u40a510d6" id="u40a510d6">1.8.0</span></p></td></tr><tr data-lake-id="u024a223e" id="u024a223e"><td data-lake-id="u2b77d72c" id="u2b77d72c" style="background-color: #FFFFFF; vertical-align: top"><p data-lake-id="uf3ad5ec2" id="uf3ad5ec2"><span data-lake-id="u0ae43163" id="u0ae43163">gitlab</span></p></td><td data-lake-id="u996414bf" id="u996414bf" style="background-color: #FFFFFF; vertical-align: top"><p data-lake-id="u4dec2298" id="u4dec2298"><span data-lake-id="uc0ed5857" id="uc0ed5857">社区版11.8.1</span></p></td></tr><tr data-lake-id="ue44f42f4" id="ue44f42f4"><td data-lake-id="ue223cee3" id="ue223cee3" style="background-color: #FFFFFF; vertical-align: top"><p data-lake-id="u7f08889d" id="u7f08889d"><span data-lake-id="uc414267d" id="uc414267d">sonarqube</span></p></td><td data-lake-id="ufd9909ef" id="ufd9909ef" style="background-color: #FFFFFF; vertical-align: top"><p data-lake-id="ub45030fd" id="ub45030fd"><span data-lake-id="ue1d8bb5a" id="ue1d8bb5a">社区版8.5.1</span></p></td></tr><tr data-lake-id="u9b004f59" id="u9b004f59"><td data-lake-id="u3ef19c70" id="u3ef19c70" style="background-color: #FFFFFF; vertical-align: top"><p data-lake-id="u18f622ed" id="u18f622ed"><span data-lake-id="u17e4ba48" id="u17e4ba48">traefik</span></p></td><td data-lake-id="u2c9fa682" id="u2c9fa682" style="background-color: #FFFFFF; vertical-align: top"><p data-lake-id="2437cac6ad8f03448ae403be9a3af9ed_p_0" id="2437cac6ad8f03448ae403be9a3af9ed_p_0"><span data-lake-id="u65702c8d" id="u65702c8d">2.3.3</span></p></td></tr><tr data-lake-id="u1044ac32" id="u1044ac32"><td data-lake-id="u98b0a05d" id="u98b0a05d" style="background-color: #FFFFFF; vertical-align: top"><p data-lake-id="uda7b1fbb" id="uda7b1fbb"><span data-lake-id="u1564a596" id="u1564a596">代码仓库</span></p></td><td data-lake-id="u049277e3" id="u049277e3" style="background-color: #FFFFFF; vertical-align: top"><p data-lake-id="2dcca0746ceda2d7f862a6a1500784f9_p_0" id="2dcca0746ceda2d7f862a6a1500784f9_p_0"><span data-lake-id="ua2c51f59" id="ua2c51f59">阿里云仓库</span></p></td></tr></tbody></table>

  

涉及的技术：

-   Jenkins shareLibrary
-   Jenkins pipeline
-   Jenkinsfile
-   Argocd
-   sonarqube api操作

  

## 软件安装

软件安装我这里不贴具体的安装代码了，所有的代码我都放在了github上，地址：[https://github.com/cool-ops/kubernetes-software-yaml.git](https://github.com/cool-ops/kubernetes-software-yaml.git)

  

所以这里默认你已经安装好所以软件了。

  

## 在Jenkins上安装如下插件

-   kubernetes
-   AnsiColor
-   HTTP Request
-   SonarQube Scanner
-   Utility Steps
-   Email Extension Template
-   Gitlab Hook
-   Gitlab

  

## 在Jenkins上配置Kubernetes集群信息

在系统管理-->系统配置-->cloud

![image.png](assets/devops与交付/使用Jenkins和Argocd实现CI_CD/使用Jenkins和Argocd实现CI_CD-2.png)

​  

## 在Jenkins上配置邮箱地址

系统设置-->系统配置-->Email

（1）设置管理员邮箱

![image.png](assets/devops与交付/使用Jenkins和Argocd实现CI_CD/使用Jenkins和Argocd实现CI_CD-3.png)

配置SMTP服务

![image.png](assets/devops与交付/使用Jenkins和Argocd实现CI_CD/使用Jenkins和Argocd实现CI_CD-4.png)

  

​  

## 在Gitlab上准备一个测试代码

我这里有一个简单的java测试代码，地址如下：[https://gitee.com/jokerbai/springboot-helloworld.git](https://gitee.com/jokerbai/springboot-helloworld.git)

  

可以将其导入到自己的gitlab仓库。

​  

## 在Gitlab上创建一个共享库

首先在gitlab上创建一个共享库，我这里取名叫shareLibrary，如下：

![image.png](assets/devops与交付/使用Jenkins和Argocd实现CI_CD/使用Jenkins和Argocd实现CI_CD-5.png)

然后创建src/org/devops目录，并在该目录下创建一下文件。

![image.png](assets/devops与交付/使用Jenkins和Argocd实现CI_CD/使用Jenkins和Argocd实现CI_CD-6.png)

它们的内容分别如下：

build.groovy

```groovy
package org.devops

// docker容器直接build
def DockerBuild(buildShell){
    sh """
        ${buildShell}
    """
}

```

sendEmail.groovy

```groovy
package org.devops

//定义邮件内容
def SendEmail(status,emailUser){
    emailext body: """
            <!DOCTYPE html> 
            <html> 
            <head> 
            <meta charset="UTF-8"> 
            </head> 
            <body leftmargin="8" marginwidth="0" topmargin="8" marginheight="4" offset="0"> 
                <table width="95%" cellpadding="0" cellspacing="0" style="font-size: 11pt; font-family: Tahoma, Arial, Helvetica, sans-serif">   
                <tr>
		            本邮件由系统自动发出，无需回复！<br/>
		            各位同事，大家好，以下为${JOB_NAME}项目构建信息</br>
		            <td><font color="#CC0000">构建结果 - ${status}</font></td>
		        </tr>

                    <tr> 
                        <td><br /> 
                            <b><font color="#0B610B">构建信息</font></b> 
                        </td> 
                    </tr> 
                    <tr> 
                        <td> 
                            <ul> 
                                <li>项目名称：${JOB_NAME}</li>         
                                <li>构建编号：${BUILD_ID}</li> 
                                <li>构建状态: ${status} </li>                         
                                <li>项目地址：<a href="${BUILD_URL}">${BUILD_URL}</a></li>    
                                <li>构建日志：<a href="${BUILD_URL}console">${BUILD_URL}console</a></li>   
                            </ul> 
                        </td> 
                    </tr> 
                    <tr>  
                </table> 
            </body> 
            </html>  """,
            subject: "Jenkins-${JOB_NAME}项目构建信息 ",
            to: emailUser
        
}
```

sonarAPI.groovy

```groovy
package ore.devops

// 封装HTTP请求
def HttpReq(requestType,requestUrl,requestBody){
    // 定义sonar api接口
    def sonarServer = "http://sonar.devops.svc.cluster.local:9000/api"
    result = httpRequest authentication: 'sonar-admin-user',
            httpMode: requestType,
            contentType: "APPLICATION_JSON",
            consoleLogResponseBody: true,
            ignoreSslErrors: true,
            requestBody: requestBody,
            url: "${sonarServer}/${requestUrl}"
    return result
}

// 获取soanr项目的状态
def GetSonarStatus(projectName){
    def apiUrl = "project_branches/list?project=${projectName}"
    // 发请求
    response = HttpReq("GET",apiUrl,"")
    // 对返回的文本做JSON解析
    response = readJSON text: """${response.content}"""
    // 获取状态值
    result = response["branches"][0]["status"]["qualityGateStatus"]
    return result
}

// 获取sonar项目，判断项目是否存在
def SearchProject(projectName){
    def apiUrl = "projects/search?projects=${projectName}"
    // 发请求
    response = HttpReq("GET",apiUrl,"")
    println "搜索的结果：${response}"
    // 对返回的文本做JSON解析
    response = readJSON text: """${response.content}"""
    // 获取total字段，该字段如果是0则表示项目不存在,否则表示项目存在
    result = response["paging"]["total"]
    // 对result进行判断
    if (result.toString() == "0"){
        return "false"
    }else{
        return "true"
    }
}

// 创建sonar项目
def CreateProject(projectName){
    def apiUrl = "projects/create?name=${projectName}&project=${projectName}"
    // 发请求
    response = HttpReq("POST",apiUrl,"")
    println(response)
}

// 配置项目质量规则
def ConfigQualityProfiles(projectName,lang,qpname){
    def apiUrl = "qualityprofiles/add_project?language=${lang}&project=${projectName}&qualityProfile=${qpname}"
    // 发请求
    response = HttpReq("POST",apiUrl,"")
    println(response)
}

// 获取质量阈ID
def GetQualityGateId(gateName){
    def apiUrl = "qualitygates/show?name=${gateName}"
    // 发请求
    response = HttpReq("GET",apiUrl,"")
    // 对返回的文本做JSON解析
    response = readJSON text: """${response.content}"""
    // 获取total字段，该字段如果是0则表示项目不存在,否则表示项目存在
    result = response["id"]
    return result
}

// 更新质量阈规则
def ConfigQualityGate(projectKey,gateName){
    // 获取质量阈id
    gateId = GetQualityGateId(gateName)
    apiUrl = "qualitygates/select?projectKey=${projectKey}&gateId=${gateId}"
    // 发请求
    response = HttpReq("POST",apiUrl,"")
    println(response)
}

//获取Sonar质量阈状态
def GetProjectStatus(projectName){
    apiUrl = "project_branches/list?project=${projectName}"
    response = HttpReq("GET",apiUrl,'')
    
    response = readJSON text: """${response.content}"""
    result = response["branches"][0]["status"]["qualityGateStatus"]
    
    //println(response)
    
   return result
}
```

sonarqube.groovy

```groovy
package ore.devops

def SonarScan(projectName,projectDesc,projectPath){
    // sonarScanner安装地址
    def sonarHome = "/opt/sonar-scanner"
    // sonarqube服务端地址
    def sonarServer = "http://sonar.devops.svc.cluster.local:9000/"
    // 以时间戳为版本
    def scanTime = sh returnStdout: true, script: 'date +%Y%m%d%H%m%S'
    scanTime = scanTime - "\n"
    sh """
    ${sonarHome}/bin/sonar-scanner  -Dsonar.host.url=${sonarServer}  \
    -Dsonar.projectKey=${projectName}  \
    -Dsonar.projectName=${projectName}  \
    -Dsonar.projectVersion=${scanTime} \
    -Dsonar.login=admin \
    -Dsonar.password=admin \
    -Dsonar.ws.timeout=30 \
    -Dsonar.projectDescription="${projectDesc}"  \
    -Dsonar.links.homepage=http://www.baidu.com \
    -Dsonar.sources=${projectPath} \
    -Dsonar.sourceEncoding=UTF-8 \
    -Dsonar.java.binaries=target/classes \
    -Dsonar.java.test.binaries=target/test-classes \
    -Dsonar.java.surefire.report=target/surefire-reports -X 

    echo "${projectName}  scan success!"
    """
}
```

tools.groovy

```groovy
package org.devops

//格式化输出
def PrintMes(value,color){
    colors = ['red'   : "\033[40;31m >>>>>>>>>>>${value}<<<<<<<<<<< \033[0m",
              'blue'  : "\033[47;34m ${value} \033[0m",
              'green' : "[1;32m>>>>>>>>>>${value}>>>>>>>>>>[m",
              'green1' : "\033[40;32m >>>>>>>>>>>${value}<<<<<<<<<<< \033[0m" ]
    ansiColor('xterm') {
        println(colors[color])
    }
}

// 获取镜像版本
def createVersion() {
	// 定义一个版本号作为当次构建的版本，输出结果 20191210175842_69
    return new Date().format('yyyyMMddHHmmss') + "_${env.BUILD_ID}"
}

// 获取时间
def getTime() {
	// 定义一个版本号作为当次构建的版本，输出结果 20191210175842
    return new Date().format('yyyyMMddHHmmss')
}
```

  

## 在Gitlab上创建一个YAML管理仓库

我这里创建了一个叫devops-cd的共享仓库，如下：

![image.png](assets/devops与交付/使用Jenkins和Argocd实现CI_CD/使用Jenkins和Argocd实现CI_CD-7.png)

  

然后以应用名创建一个目录，并在目录下创建以下几个文件。

![image.png](assets/devops与交付/使用Jenkins和Argocd实现CI_CD/使用Jenkins和Argocd实现CI_CD-8.png)

它们的内容分别如下。

service.yaml

```yaml
kind: Service
apiVersion: v1
metadata:
  name: the-service
  namespace: default
spec:
  selector:
    deployment: hello
  type: NodePort
  ports:
  - protocol: TCP
    port: 8080
    targetPort: 8080
```

ingress.yaml

```yaml
apiVersion: extensions/v1beta1
kind: Ingress
metadata:
  name: the-ingress 
  namespace: default
spec:
  rules:
    - host: test.coolops.cn 
      http:
        paths:
          - backend:
              serviceName: the-service 
              servicePort: 8080 
            path: /
```

deploymeny.yaml

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: the-deployment
  namespace: default
spec:
  replicas: 3
  selector:
    matchLabels:
      deployment: hello
  template:
    metadata:
      labels:
        deployment: hello
    spec:
      containers:
        - args:
            - -jar
            - /opt/myapp.jar
            - --server.port=8080
          command:
            - java
          env:
            - name: HOST_IP
              valueFrom:
                fieldRef:
                  apiVersion: v1
                  fieldPath: status.hostIP
          image: registry.cn-hangzhou.aliyuncs.com/rookieops/myapp:latest
          imagePullPolicy: IfNotPresent
          lifecycle:
            preStop:
              exec:
                command:
                  - /bin/sh
                  - -c
                  - /bin/sleep 30
          livenessProbe:
            failureThreshold: 3
            httpGet:
              path: /hello
              port: 8080
              scheme: HTTP
            initialDelaySeconds: 60
            periodSeconds: 15
            successThreshold: 1
            timeoutSeconds: 1
          name: myapp
          ports:
            - containerPort: 8080
              name: http
              protocol: TCP
          readinessProbe:
            failureThreshold: 3
            httpGet:
              path: /hello
              port: 8080
              scheme: HTTP
            periodSeconds: 15
            successThreshold: 1
            timeoutSeconds: 1
          resources:
            limits:
              cpu: "1"
              memory: 2Gi
            requests:
              cpu: 100m
              memory: 1Gi
          terminationMessagePath: /dev/termination-log
          terminationMessagePolicy: File
      dnsPolicy: ClusterFirstWithHostNet
      imagePullSecrets:
        - name: gitlab-registry
```

kustomization.yaml

```yaml
# Example configuration for the webserver
# at https://github.com/monopole/hello
commonLabels:
  app: hello

resources:
- deployment.yaml
- service.yaml
- ingress.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
images:
- name: registry.cn-hangzhou.aliyuncs.com/rookieops/myapp
  newTag: "20201127150733_70"
namespace: dev
```

  

## 在Jenkins上配置共享库

（1）需要在Jenkins上添加凭证

![image.png](assets/devops与交付/使用Jenkins和Argocd实现CI_CD/使用Jenkins和Argocd实现CI_CD-9.png)

（2）在Jenkins的系统配置里面配置共享库（系统管理-->系统配置）

![image.png](assets/devops与交付/使用Jenkins和Argocd实现CI_CD/使用Jenkins和Argocd实现CI_CD-10.png)

然后点击应用并保存

  

然后我们可以用一个简单的Jenkinsfile测试一下共享库，看配置是否正确。

  

在Jenkins上创建一个项目，如下：

![image.png](assets/devops与交付/使用Jenkins和Argocd实现CI_CD/使用Jenkins和Argocd实现CI_CD-11.png)

  

  

然后在最地下的pipeline处贴入以下代码：

```groovy
def labels = "slave-${UUID.randomUUID().toString()}"
// 引用共享库
@Library("jenkins_shareLibrary")

// 应用共享库中的方法
def tools = new org.devops.tools()

pipeline {
    agent {
    kubernetes {
        label labels
      yaml """
apiVersion: v1
kind: Pod
metadata:
  labels:
    some-label: some-label-value
spec:
  volumes:
  - name: docker-sock
    hostPath:
      path: /var/run/docker.sock
      type: ''
  containers:
  - name: jnlp
    image: registry.cn-hangzhou.aliyuncs.com/rookieops/inbound-agent:4.3-4
  - name: maven
    image: registry.cn-hangzhou.aliyuncs.com/rookieops/maven:3.5.0-alpine
    command:
    - cat
    tty: true
  - name: docker
    image: registry.cn-hangzhou.aliyuncs.com/rookieops/docker:19.03.11
    command:
    - cat
    tty: true
    volumeMounts:
    - name: docker-sock
      mountPath: /var/run/docker.sock
"""
    }
  }
    stages {
        stage('Checkout') {
            steps {
                script{
                	tools.PrintMes("拉代码","green")
                }
            }
        }
        stage('Build') {
            steps {
                container('maven') {
                    script{
                		tools.PrintMes("编译打包","green")
                	}
                }
            }
        }
        stage('Make Image') {
            steps {
                container('docker') {
                    script{
                		tools.PrintMes("构建镜像","green")
                    }
                }
            }
        }
    }
}
```

然后点击保存并运行，如果看到输出有颜色，就代表共享库配置成功，如下：

![image.png](assets/devops与交付/使用Jenkins和Argocd实现CI_CD/使用Jenkins和Argocd实现CI_CD-12.png)

到此共享库配置完成。

  

## 编写Jenkinsfile

整个java的Jenkinsfile如下：

```groovy
def labels = "slave-${UUID.randomUUID().toString()}"

// 引用共享库
@Library("jenkins_shareLibrary")

// 应用共享库中的方法
def tools = new org.devops.tools()
def sonarapi = new org.devops.sonarAPI()
def sendEmail = new org.devops.sendEmail()
def build = new org.devops.build()
def sonar = new org.devops.sonarqube()

// 前端传来的变量
def gitBranch = env.branch
def gitUrl = env.git_url
def buildShell = env.build_shell
def image = env.image
def dockerRegistryUrl = env.dockerRegistryUrl
def devops_cd_git = env.devops_cd_git

pipeline {
    agent {
    kubernetes {
        label labels
      yaml """
apiVersion: v1
kind: Pod
metadata:
  labels:
    some-label: some-label-value
spec:
  volumes:
  - name: docker-sock
    hostPath:
      path: /var/run/docker.sock
      type: ''
  - name: maven-cache
    persistentVolumeClaim:
      claimName: maven-cache-pvc
  containers:
  - name: jnlp
    image: registry.cn-hangzhou.aliyuncs.com/rookieops/inbound-agent:4.3-4
  - name: maven
    image: registry.cn-hangzhou.aliyuncs.com/rookieops/maven:3.5.0-alpine
    command:
    - cat
    tty: true
    volumeMounts:
    - name: maven-cache
      mountPath: /root/.m2
  - name: docker
    image: registry.cn-hangzhou.aliyuncs.com/rookieops/docker:19.03.11
    command:
    - cat
    tty: true
    volumeMounts:
    - name: docker-sock
      mountPath: /var/run/docker.sock
  - name: sonar-scanner
    image: registry.cn-hangzhou.aliyuncs.com/rookieops/sonar-scanner:latest
    command:
    - cat
    tty: true
  - name: kustomize
    image: registry.cn-hangzhou.aliyuncs.com/rookieops/kustomize:v3.8.1
    command:
    - cat
    tty: true
"""
    }
  }

    environment{
        auth = 'joker'
    }

    options {
		timestamps()	// 日志会有时间
		skipDefaultCheckout()	// 删除隐式checkout scm语句
		disableConcurrentBuilds()	//禁止并行
		timeout(time:1,unit:'HOURS') //设置流水线超时时间
	}

    stages {
        // 拉取代码
        stage('GetCode') {
            steps {
                checkout([$class: 'GitSCM', branches: [[name: "${gitBranch}"]],
                    doGenerateSubmoduleConfigurations: false,
                    extensions: [],
                    submoduleCfg: [],
                    userRemoteConfigs: [[credentialsId: '83d2e934-75c9-48fe-9703-b48e2feff4d8', url: "${gitUrl}"]]])
                }
            }

        // 单元测试和编译打包
        stage('Build&Test') {
            steps {
                container('maven') {
                    script{
                        tools.PrintMes("编译打包","blue")
                        build.DockerBuild("${buildShell}")
                    }
                }
            }
        }
        // 代码扫描
        stage('CodeScanner') {
            steps {
                container('sonar-scanner') {
                    script {
                        tools.PrintMes("代码扫描","green")
                        tools.PrintMes("搜索项目","green")
                        result = sonarapi.SearchProject("${JOB_NAME}")
                        println(result)

                        if (result == "false"){
                            println("${JOB_NAME}---项目不存在,准备创建项目---> ${JOB_NAME}！")
                            sonarapi.CreateProject("${JOB_NAME}")
                        } else {
                            println("${JOB_NAME}---项目已存在！")
                        }

                        tools.PrintMes("代码扫描","green")
                        sonar.SonarScan("${JOB_NAME}","${JOB_NAME}","src")

                        sleep 10
                        tools.PrintMes("获取扫描结果","green")
                        result = sonarapi.GetProjectStatus("${JOB_NAME}")

                        println(result)
                        if (result.toString() == "ERROR"){
                            toemail.Email("代码质量阈错误！请及时修复！",userEmail)
                            error " 代码质量阈错误！请及时修复！"

                        } else {
                            println(result)
                        }
                    }
                }
            }
        }
        // 构建镜像
        stage('BuildImage') {
            steps {
                withCredentials([[$class: 'UsernamePasswordMultiBinding',
                credentialsId: 'dockerhub',
                usernameVariable: 'DOCKER_HUB_USER',
                passwordVariable: 'DOCKER_HUB_PASSWORD']]) {
                    container('docker') {
                        script{
                            tools.PrintMes("构建镜像","green")
                            imageTag = tools.createVersion()
                            sh """
                            docker login ${dockerRegistryUrl} -u ${DOCKER_HUB_USER} -p ${DOCKER_HUB_PASSWORD}
                            docker build -t ${image}:${imageTag} .
                            docker push ${image}:${imageTag}
                            docker rmi ${image}:${imageTag}
                            """
                        }
                    }
                }
            }
        }
        // 部署
        stage('Deploy') {
            steps {
                 withCredentials([[$class: 'UsernamePasswordMultiBinding',
                credentialsId: 'ci-devops',
                usernameVariable: 'DEVOPS_USER',
                passwordVariable: 'DEVOPS_PASSWORD']]){
                    container('kustomize') {
                        script{
                            APP_DIR="${JOB_NAME}".split("_")[0]
                            sh """
                            git remote set-url origin http://${DEVOPS_USER}:${DEVOPS_PASSWORD}@${devops_cd_git}
                            git config --global user.name "Administrator"
                            git config --global user.email "coolops@163.com"
                            git clone http://${DEVOPS_USER}:${DEVOPS_PASSWORD}@${devops_cd_git} /opt/devops-cd
                            cd /opt/devops-cd
                            git pull
                            cd /opt/devops-cd/${APP_DIR}
                            kustomize edit set image ${image}:${imageTag}
                            git commit -am 'image update'
                            git push origin master
                            """
                        }
                    }
                }
            }
        }
        // 接口测试
        stage('InterfaceTest') {
            steps{
                sh 'echo "接口测试"'
            }
        }
    }
    // 构建后的操作
	post {
		success {
			script{
				println("success:只有构建成功才会执行")
				currentBuild.description += "\n构建成功！"
				// deploy.AnsibleDeploy("${deployHosts}","-m ping")
				sendEmail.SendEmail("构建成功",toEmailUser)
				// dingmes.SendDingTalk("构建成功 ✅")
			}
		}
		failure {
			script{
				println("failure:只有构建失败才会执行")
				currentBuild.description += "\n构建失败!"
				sendEmail.SendEmail("构建失败",toEmailUser)
				// dingmes.SendDingTalk("构建失败 ❌")
			}
		}
		aborted {
			script{
				println("aborted:只有取消构建才会执行")
				currentBuild.description += "\n构建取消!"
				sendEmail.SendEmail("取消构建",toEmailUser)
				// dingmes.SendDingTalk("构建失败 ❌","暂停或中断")
			}
		}
	}
}

```

需要在Jenkins上创建两个凭证，一个id叫dockerhub，一个叫ci-devops，还有一个叫sonar-admin-user。

  

dockerhub是登录镜像仓库的用户名和密码。

  

ci-devops是管理YAML仓库的用户名和密码。

  

sonar-admin-user是管理sonarqube的用户名和密码。

  

然后将这个Jenkinsfile保存到shareLibrary的根目录下，命名为java.Jenkinsfile。

![image.png](assets/devops与交付/使用Jenkins和Argocd实现CI_CD/使用Jenkins和Argocd实现CI_CD-13.png)

  

## 在Jenkins上配置项目

在Jenkins上新建一个项目，如下：

![image.png](assets/devops与交付/使用Jenkins和Argocd实现CI_CD/使用Jenkins和Argocd实现CI_CD-14.png)

然后添加以下参数化构建。

![image.png](assets/devops与交付/使用Jenkins和Argocd实现CI_CD/使用Jenkins和Argocd实现CI_CD-15.png)

![image.png](assets/devops与交付/使用Jenkins和Argocd实现CI_CD/使用Jenkins和Argocd实现CI_CD-16.png)

![image.png](assets/devops与交付/使用Jenkins和Argocd实现CI_CD/使用Jenkins和Argocd实现CI_CD-17.png)

![image.png](assets/devops与交付/使用Jenkins和Argocd实现CI_CD/使用Jenkins和Argocd实现CI_CD-18.png)

![image.png](assets/devops与交付/使用Jenkins和Argocd实现CI_CD/使用Jenkins和Argocd实现CI_CD-19.png)

![image.png](assets/devops与交付/使用Jenkins和Argocd实现CI_CD/使用Jenkins和Argocd实现CI_CD-20.png)

![image.png](assets/devops与交付/使用Jenkins和Argocd实现CI_CD/使用Jenkins和Argocd实现CI_CD-21.png)

然后在流水线处配置Pipeline from SCM

![image.png](assets/devops与交付/使用Jenkins和Argocd实现CI_CD/使用Jenkins和Argocd实现CI_CD-22.png)

![image.png](assets/devops与交付/使用Jenkins和Argocd实现CI_CD/使用Jenkins和Argocd实现CI_CD-23.png)

此处需要注意脚本名。

  

然后点击应用保存，并运行。

  

![image.png](assets/devops与交付/使用Jenkins和Argocd实现CI_CD/使用Jenkins和Argocd实现CI_CD-24.png)

也可以在sonarqube上看到代码扫描的结果。

![image.png](assets/devops与交付/使用Jenkins和Argocd实现CI_CD/使用Jenkins和Argocd实现CI_CD-25.png)

  

## 在Argocd上配置CD流程

在argocd上添加代码仓库，如下：

![image.png](assets/devops与交付/使用Jenkins和Argocd实现CI_CD/使用Jenkins和Argocd实现CI_CD-26.png)

![image.png](assets/devops与交付/使用Jenkins和Argocd实现CI_CD/使用Jenkins和Argocd实现CI_CD-27.png)

然后创建应用，如下：

![image.png](assets/devops与交付/使用Jenkins和Argocd实现CI_CD/使用Jenkins和Argocd实现CI_CD-28.png)

![image.png](assets/devops与交付/使用Jenkins和Argocd实现CI_CD/使用Jenkins和Argocd实现CI_CD-29.png)

点击创建后，如下：

![image.png](assets/devops与交付/使用Jenkins和Argocd实现CI_CD/使用Jenkins和Argocd实现CI_CD-30.png)

点进去可以看到更多的详细信息。

![image.png](assets/devops与交付/使用Jenkins和Argocd实现CI_CD/使用Jenkins和Argocd实现CI_CD-31.png)

> argocd有一个小bug，它ingress的健康检查必须要loadBalance有值，不然就不通过，但是并不影响使用。

  

然后可以正常访问应用了。

![image.png](assets/devops与交付/使用Jenkins和Argocd实现CI_CD/使用Jenkins和Argocd实现CI_CD-32.png)

  

node项目的Jenkinsfile大同小异，由于我没有测试用例，所以并没有测试。

  

## 集成Gitlab，通过Webhook触发Jenkins

在Jenkins中选择项目，在项目中配置gitlab触发，如下：

![image.png](assets/devops与交付/使用Jenkins和Argocd实现CI_CD/使用Jenkins和Argocd实现CI_CD-33.png)

生成token，如下

![image.png](assets/devops与交付/使用Jenkins和Argocd实现CI_CD/使用Jenkins和Argocd实现CI_CD-34.png)

在gitlab上配置集成。进入项目-->项目设置-->集成

![image.png](assets/devops与交付/使用Jenkins和Argocd实现CI_CD/使用Jenkins和Argocd实现CI_CD-35.png)

配置Jenkins上生成的回调URL和TOKEN

![image.png](assets/devops与交付/使用Jenkins和Argocd实现CI_CD/使用Jenkins和Argocd实现CI_CD-36.png)

到此配置完成，然后点击下方test，可以观察是否触发流水线。

![image.png](assets/devops与交付/使用Jenkins和Argocd实现CI_CD/使用Jenkins和Argocd实现CI_CD-37.png)

也可以通过修改仓库代码进行测试。

  

## 写在最后

本片文章是纯操作步骤，大家在测试的时候可能会对Jenkinsfile做细微的调整，不过整体没什么问题。