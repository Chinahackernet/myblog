![](assets/devops与交付/基于Jira的运维发布平台/基于Jira的运维发布平台-1.jpeg)

  

上线发布是运维的日常工作，常见的发布方式有：

-   手动发布
-   Jenkins发布平台
-   Gitlab CI
-   ......

  

除此之外还有需要开源软件，他们都有非常不错的发布管理功能。

  

## 面临的问题

作为运维人员，上线发布是必不可少的一环，一个正常的发布流程是怎么样的？

-   需求方提发布任务，走发布流程
-   供应方执行发布上线

  

环节看似简单，但是中间其实是有断层的。一般企业在走上线流程都是通过一些公共渠道，比如邮件、钉钉、飞书的流程，这些都很难和运维执行上线发布平台进行关联上，而且也不够直观。所以我们就需要解决以下几个问题：

-   流程和运维平台建立连接
-   从发起到结束形成闭环

  

  

## 为啥选择JIRA？

JIRA优秀的项目管理，问题跟踪的工具，另外它的流程管理和看板模式也能够非常直观看到目前流程处在什么位置。另外它可以通过webhook和其他平台建立友好的连接，方便扩展。再者对于开发、测试、项目管理人员等来说Jira是他们日常的工具，使用熟练度非常高，降低了额外的学习成本。鉴于此，我们选择JIRA作为运维发布平台，争取做到一个平台做所有事。

  

## 方案设计

### 设计思路

充分利用Jira、Gitlab的webhook功能，以及Jenkins的灵活性。

-   Jira上更新状态触发Jenkins执行合并分支流水线
-   Gitlab上代码合并成功后触发Jenkins执行发布流水线
-   将发布结果通过钉钉等软件通知相应的人

  

整体思路相对简单，难点主要集中在Jenkins获取Jira、Gitlab的数据，所幸Jenkins的插件功能非常丰富，这里就使用`Generic Webhook Trigger`插件，可以很灵活地获取到触发软件地信息。

  

### 发布流程方案

然后整理出如下地发布流程。

![image.png](assets/devops与交付/基于Jira的运维发布平台/基于Jira的运维发布平台-2.png)

  

### 涉及软件

<table class="lake-table" style="width: 350px;"><colgroup><col span="1" width="175" /><col span="1" width="175" /></colgroup><tbody><tr style="height: 33px;"><td><p data-lake-id="bc8fe54a36a16d1fd5c37575715ee376"> 软件 </p></td><td><p data-lake-id="c7e8945c4fe4b46388bf76d7174d6053"> 功能 </p></td></tr><tr style="height: 33px;"><td><p data-lake-id="4ef81fe7174ed4a2ae5b0da60cff59ee">Jira</p></td><td><p data-lake-id="7503849c9a7c953088452d602b6823f0"><span>发布流程管理</span></p></td></tr><tr style="height: 33px;"><td><p data-lake-id="4e2b857d8c10bab074c97e4c3186a24f">Jenkins</p></td><td><p data-lake-id="12ea6966aaa3083ab3d11aa1f05648a4"><span>执行各种流水线</span></p></td></tr><tr style="height: 33px;"><td colspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #404040;"><p data-lake-id="a20d224c568e48b9d67847a2c66a8c01_p_0">Gitlab</p></td><td colspan="1" rowspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #404040;"><span style="color: #404040;">代码仓库</span></td></tr><tr style="height: 33px;"><td colspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #404040;"><p data-lake-id="a20d224c568e48b9d67847a2c66a8c01_p_0">Kubernetes</p></td><td colspan="1" rowspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #404040;"><span style="color: #404040;">应用管理</span></td></tr><tr style="height: 33px;"><td colspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #404040;"><p data-lake-id="a20d224c568e48b9d67847a2c66a8c01_p_0">Helm/kustomize</p></td><td colspan="1" rowspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #404040;"><span style="color: #404040;">包管理</span></td></tr><tr style="height: 33px;"><td colspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #404040;"><p data-lake-id="a20d224c568e48b9d67847a2c66a8c01_p_0">钉钉</p></td><td colspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #404040;"><p data-lake-id="a20d224c568e48b9d67847a2c66a8c01_p_0"><span>消息通知</span></p></td></tr><tr style="height: 33px;"><td colspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #404040;"><p data-lake-id="a20d224c568e48b9d67847a2c66a8c01_p_0">trivy</p></td><td colspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #404040;"><p data-lake-id="a20d224c568e48b9d67847a2c66a8c01_p_0">镜像扫描</p></td></tr><tr style="height: 33px;"><td colspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #404040;"><p data-lake-id="a20d224c568e48b9d67847a2c66a8c01_p_0">镜像仓库</p></td><td colspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #404040;"><p data-lake-id="a20d224c568e48b9d67847a2c66a8c01_p_0">阿里云镜像仓库</p></td></tr></tbody></table>

  

> PS：这里没有具体的软件部署

  

## Jira与Jenkins进行集成合并分支

### Jenkins配置

Jenkins的配置主要有两部分，如下：

-   配置Jenkins ShareLibrary功能
-   编写Jira触发相应的Jenkinsfile

  

（1）Jenkins上配置ShareLibarary

系统配置-->系统配置-->Global Pipeline Libraries

![image.png](assets/devops与交付/基于Jira的运维发布平台/基于Jira的运维发布平台-3.png)

（2）创建流水线，配置Webhook以及添加Jenkinsfile

-   配置触发器

先配置一个变量和正则

![image.png](assets/devops与交付/基于Jira的运维发布平台/基于Jira的运维发布平台-4.png)

再配置一个Token即可

![image.png](assets/devops与交付/基于Jira的运维发布平台/基于Jira的运维发布平台-5.png)

-   配置流水线，添加对于的Jenkinsfile

![image.png](assets/devops与交付/基于Jira的运维发布平台/基于Jira的运维发布平台-6.png)

  

（3）Jenkinsfile的主要逻辑如下

> PS：下面仅列出大致的框架，并没有详细的代码

-   获取Jira的配置信息进行解析
-   根据不同信息执行不同的操作
-   合并分支主要是通过调Gitlab的API接口完成

```groovy
#!groovy

@Library('lotbrick') _

def gitlab = new org.devops.gitlab()
def tool = new org.devops.tools()
def dingmes = new org.devops.sendDingTalk()

pipeline {
    agent { node { label "master"}}

    environment {
        DINGTALKHOOK = "https://oapi.dingtalk.com/robot/send?access_token=xxxx"   
    }

    stages{

        stage("FileterData"){
            steps{
                script{
                    response = readJSON text: """${webHookData}"""

                    // println(response)

                    env.eventType = response["webhookEvent"]

                    if (eventType == "jira:issue_updated"){
                        // 获取状态值
                        env.jiraStatus = response['issue']['fields']['status']['name']
                        env.gitlabInfos = response['issue']['fields']['customfield_10219']
                        infos = "${gitlabInfos}".split("\r\n")
                        for (info in infos){
                            prName = "$info".split("/")[0]
                            // brName = "$info".split("/")[1]
                            brName = info - "${prName}/"
                            println(prName)
                            println(brName)
                            if (jiraStatus == "已发布(UAT)"){
                                println('进行合并PRE分支操作')
                            }else if (jiraStatus == "已发布(PROD)"){
                                println('进行合并PROD分支操作')
                            }else if (jiraStatus == "已完成"){
								println('进行分支打Tag并删除原分支')
                            }else{
                                println("查无此项")
                            }
                        }
                    }
                }
            }
        }
    }
    // 构建后的操作
	post {
		failure {
			script{ 
				println("failure:只有构建失败才会执行")
				dingmes.SendDingTalk("分支合并失败 ❌")
			}
		}
		aborted {
            script{
				println("aborted:只有取消构建才会执行")
				dingmes.SendDingTalk("分支合并取消 ❌","暂停或中断")
            }
		}
	}
}
```

以上Jenkins上配置基本完成。

  

### Jira上配置

Jira上的主要配置如下：

-   建立工作流
-   工作流关联项目
-   配置项目触发Webhook

#### 建立工作流

![image.png](assets/devops与交付/基于Jira的运维发布平台/基于Jira的运维发布平台-7.png)

  

#### 将工作流关联项目组

![image.png](assets/devops与交付/基于Jira的运维发布平台/基于Jira的运维发布平台-8.png)

  

#### 配置webhook

设置-->系统-->网络钩子

![image.png](assets/devops与交付/基于Jira的运维发布平台/基于Jira的运维发布平台-9.png)

  

上面配置完成后，即完成Jira上配置，然后就可以在对应项目的看板上查看所以待发布的项目，如下：

![image.png](assets/devops与交付/基于Jira的运维发布平台/基于Jira的运维发布平台-10.png)

然后进行拖拽或者点击发布按钮，即可改变状态，触发流水线进行相应的操作了。

  

## Gitlab与Jenkins集成发布系统

### 开发分支简要

这里主要使用的是功能分支开发模式，主要分为以下几个分支：

-   DEV分支：开发环境分支
-   TEST分支：测试环境分支
-   UAT分支：联调环境分支
-   PRE分支：预发布环境分支
-   MASTER分支：生产环境分支

  

代码合并路线是：DEV->TEST->UAT->PRE->MASTER

然后根据不同的分支判断执行不同环境的部署。

### Jenkins配置流水线

（1）配置Webhook插件参数

![image.png](assets/devops与交付/基于Jira的运维发布平台/基于Jira的运维发布平台-11.png)

  

获取Gitlab分支

![image.png](assets/devops与交付/基于Jira的运维发布平台/基于Jira的运维发布平台-12.png)

定义gitlab push条件，不是任何改动都需要触发流水线

![image.png](assets/devops与交付/基于Jira的运维发布平台/基于Jira的运维发布平台-13.png)

  

  

![image.png](assets/devops与交付/基于Jira的运维发布平台/基于Jira的运维发布平台-14.png)

![image.png](assets/devops与交付/基于Jira的运维发布平台/基于Jira的运维发布平台-15.png)

定义过滤正则表达式

![image.png](assets/devops与交付/基于Jira的运维发布平台/基于Jira的运维发布平台-16.png)

这样就只有commit的时候才会触发流水线。

  

（2）配置Jenkinsfile

```groovy
def labels = "slave-${UUID.randomUUID().toString()}"

// 引用共享库
@Library('jenkins_shareLibrary')

// 应用共享库中的方法
def tools = new org.devops.tools()

def branchName = ""

// 获取分支
if ("${gitlabWebhook}" == "gitlabPush"){
    branchName = branch - "refs/heads/"
	currentBuild.description = "构建者${userName} 分支${branchName}"
}

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
  - name: kubedog
    image: registry.cn-hangzhou.aliyuncs.com/rookieops/kubedog:v0.5.0
    command: ['cat']
    tty: true
  - name: trivy
    image: registry.cn-hangzhou.aliyuncs.com/rookieops/trivy:v2
    command: ['cat']
    tty: true
    volumeMounts:
      - name: docker-sock
        mountPath: /var/run/docker.sock
"""
        }
    }

    environment {
        auth = 'joker'
    }

    options {
        timestamps()    // 日志会有时间
        skipDefaultCheckout()    // 删除隐式checkout scm语句
        disableConcurrentBuilds()    //禁止并行
        timeout(time:1, unit:'HOURS') //设置流水线超时时间
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
                    script {
                        tools.PrintMes('编译打包', 'blue')
                    }
                }
            }
        }
        // 代码扫描
        stage('CodeScanner') {
            steps {
                container('sonar-scanner') {
                    script {
						tools.PrintMes('代码扫描', 'blue')
                    }
                }
            }
        }
        // 构建镜像
        stage('BuildImage') {
            steps {
                container('docker') {
					script {
						tools.PrintMes('构建镜像', 'blue')
					}
				}
            }
        }
		
		// 镜像扫描
		stage('Vulnerability Scanner') {
            steps {
                container('trivy') {
                    script{
						tools.PrintMes('镜像扫描', 'blue')
					}            
                }
            }
        }
		
		// 推送镜像
		stage('Push Image') {
            steps {
                container('docker') {
                    script{
						tools.PrintMes('推送镜像', 'blue')
					}            
                }
            }
        }
		
        // 部署
        stage('Deploy DEV') {
			when {
				branchName 'dev'
			}
            steps {
                container('kustomize'){
					script{
						tools.PrintMes('部署DEV环境','blue')
					}
				}
            }
        }
		stage('Deploy TEST') {
			when {
				branchName 'test'
			}
            steps {
                container('kustomize'){
					script{
						tools.PrintMes('部署TEST环境','blue')
					}
				}
            }
        }
		stage('Deploy UAT') {
			when {
				branchName 'uat'
			}
            steps {
                container('kustomize'){
					script{
						tools.PrintMes('部署UAT环境','blue')
					}
				}
            }
        }
		stage('Deploy PRE') {
			when {
				branchName 'pre'
			}
            steps {
                container('kustomize'){
					script{
						tools.PrintMes('部署PRE环境','blue')
					}
				}
            }
        }
		stage('Deploy PROD') {
			when {
				branchName 'master'
			}
            steps {
                container('kustomize'){
					script{
						tools.PrintMes('部署PROD环境','blue')
					}
				}
            }
        }
		
		// 跟踪应用启动情况
		stage('Check App Start') {
			steps{
				container('kubedog'){
					script{
						tools.PrintMes('跟踪应用启动', 'blue')
					}
				}
			}
		}
		
        // 接口测试
        stage('InterfaceTest') {
            steps {
                sh 'echo "接口测试"'
            }
        }

    }
    // 构建后的操作
    post {
        success {
            script {
                println('success:只有构建成功才会执行')
                currentBuild.description += '\n构建成功！'
                dingmes.SendDingTalk("构建成功 ✅")
            }
        }
        failure {
            script {
                println('failure:只有构建失败才会执行')
                currentBuild.description += '\n构建失败!'
                dingmes.SendDingTalk("构建失败 ❌")
            }
        }
        aborted {
            script {
                println('aborted:只有取消构建才会执行')
                currentBuild.description += '\n构建取消!'
                dingmes.SendDingTalk("构建失败 ❌","暂停或中断")
            }
        }
    }
}
```

  

（3）在Gitlab上配置钩子

settings->webhook

![image.png](assets/devops与交付/基于Jira的运维发布平台/基于Jira的运维发布平台-17.png)

  

到这里，Gitlab和Jenkins集成就差不多完成了，后面就是具体的调试以及配置了。

  

## 写到最后

道路千万条，适合自己才最好。

  

上面是根据工作的实际情况做的运维发布，整体思路还有实现方式并不复杂，主要是充分利用各个软件地webhook能力，以及充分利用Jenkins灵活的插件功能，使得从创建发布计划和执行发布进行打通。

  

个人觉得还是有必要记录一下，也希望能帮助到有这方面需要的人。