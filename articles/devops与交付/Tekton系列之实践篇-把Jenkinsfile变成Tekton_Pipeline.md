前面我们已经实现了第一条流水线，但是这条流水线还是比较简单，完成了基础的功能。这篇文章带你怎么根据Jenkins的Jenkinsfile来定制自己的Tekton Pipeline。

​  

首先我们来看看Jenkinsfile中是什么样子，如下：

```groovy
// 引入方法
def dingmes = new org.devops.sendDingTalk()
def BUILD_USER
def IS_IMAGE_PUSH

pipeline {
    agent {
        kubernetes {
            label "jenkins-slave-${UUID.randomUUID().toString()}"
            yaml """
apiVersion: v1
kind: Pod
spec:
  nodeSelector:
    kubernetes.io/hostname: node-2
  containers:
  - name: gradle
    image: registry.cn-hangzhou.aliyuncs.com/coolops/builder-gradle:v2
    command: ['cat']
    tty: true
    volumeMounts:
      - name: caches
        mountPath: /root/.gradle/caches/
      - name: indocker
        mountPath: /var/run/docker.sock
  - name: trivy
    image: registry.cn-hangzhou.aliyuncs.com/coolops/trivy:v2
    command: ['cat']
    tty: true
    volumeMounts:
      - name: indocker
        mountPath: /var/run/docker.sock
  - name: helm
    image: registry.cn-hangzhou.aliyuncs.com/coolops/helm3:3.2.4 
    command: ['cat']
    tty: true       
  - name: kubedog
    image: registry.cn-hangzhou.aliyuncs.com/coolops/kubedog:v0.5.0
    command: ['cat']
    tty: true
  - name: sonar
    image: registry.cn-hangzhou.aliyuncs.com/coolops/gradle:5.6.4-jdk11
    command: ['cat']
    tty: true
    volumeMounts:
      - name: sonarcache
        mountPath: /root/.gradle/caches/
  volumes:
    - name: caches
      hostPath:
        path: "/data/jenkins-job/${JOB_NAME}/gradle/"
    - name: indocker
      hostPath:
        path: "/var/run/docker.sock"
    - name: sonarcache
      hostPath:
        path: "/data/jenkins-job/${JOB_NAME}/sonar/"
"""
        }
    }
    environment {
        APP_NAME = "${params.APP_NAME}"
        DOCKER_CREDENTIAL_ID = 'dockerhub-token'
        GIT_CREDENTIAL_ID = 'git-token'
        SONAR_CREDENTIAL_ID = 'sonar-token'
        KUBECONFIG_CREDENTIAL_ID = 'kubeconfig-token'
        REGISTRY = 'registry.cn-hangzhou.aliyuncs.com'
        DOCKERHUB_NAMESPACE = 'coolops'
        CHART = 'coolops/rd'
        CHART_USERNAME=xxx
        CHART_PASSWORD=xxx
        IMG_REPO = "$REGISTRY/$DOCKERHUB_NAMESPACE/$APP_NAME"
        IMG_TAG = "$GIT_COMMIT"
        COMMON_ARGS = "--set image.repository=$IMG_REPO \
                       --set image.tag=$IMG_TAG \
                       --set ingress.hosts[0].paths[0]=/ "
    }

    parameters {
        choice(description: '通过 Gradle --refresh-dependencies 参数进行 Jar 包强制刷新',  name: 'refresh', choices: ['false', 'true'])
    }

    options {
        timeout(time: 30, unit: 'MINUTES') 
    }

    stages {
        stage('Checkout SCM') {
            steps {
                checkout(scm)
            }
        }
        
        stage('Build & Push') {
            steps {
                container('gradle') {
                    withCredentials([usernamePassword(credentialsId: "$DOCKER_CREDENTIAL_ID", passwordVariable: 'DOCKER_PASSWORD', usernameVariable: 'DOCKER_USERNAME')]) {
                        sh 'echo "$DOCKER_PASSWORD" | docker login $REGISTRY -u "$DOCKER_USERNAME" --password-stdin'
                        sh '''
                            export EXIST_IMG=$(docker pull $IMG_REPO:$IMG_TAG &>/dev/null && echo true || echo false)
                            echo $EXIST_IMG
                            if [ $refresh == "true" -o $EXIST_IMG == "false" ]
                            then
                                echo "开始编译并推送镜像" ;
                                $refresh && gradle clean bootJar --configure-on-demand --build-cache --refresh-dependencies || gradle clean bootJar --configure-on-demand --build-cache            
                                docker build -f Dockerfile -t $IMG_REPO:$IMG_TAG . ;
                                docker push $IMG_REPO:$IMG_TAG ;
                            else
                                echo "镜像已存在，跳过编译";
                            fi
                            '''
                    }
                }
            }
        }
        
        stage('helm3 add repo') {
                steps {
                    container('helm') {
                        withCredentials([kubeconfigContent(credentialsId : 'kubeconfig-token' ,variable : 'kubconfig' ,)]) {
                        sh '''
                            set +x
                            mkdir ~/.kube/
                            echo "$kubconfig" > ~/.kube/config
                            '''
                        sh 'helm repo add coolops https://repomanage.rdc.aliyun.com/helm_repositories/66465-coolops --username=${CHART_USERNAME} --password=${CHART_PASSWORD}'
                        }    
                    }
                }
            } 
        }

        stage('Deploy To Dev') {
            environment {
                NAMESPACE = 'coolops-dev'
                ENV = 'dev'
            }
            when {
                expression {
                    return "$BRANCH_NAME".contains('dev')
                }
            }
            steps {
                container('helm') {
                    script {
                      stepsHelm()
                    }               
                }
            }
        }
        
        stage('Deploy To test') {
            environment {
                NAMESPACE = 'coolops-test'
                ENV = 'test'
            }
            when {
                expression {
                    return "$BRANCH_NAME".contains('test')
                }
            }
            steps {
                container('helm') {
                    script {
                      stepsHelm()
                    }               
                }
            }
        }

        stage('Deploy To Uat') {
            environment {
                NAMESPACE = 'coolops-uat'
                ENV = 'uat'
            }
            when {
                expression {
                    return "$BRANCH_NAME".contains('uat')
                }
            }
            steps {
                container('helm') {                                   
                    script {
                      stepsHelm()
                    }               
                }
            }
        }

        stage('Deploy To Pre') {
            environment {
                NAMESPACE = 'coolops-pre'
                ENV = 'pre'
            }
            when {
                expression {
                    return "$BRANCH_NAME".contains('pre')
                }
            }
            steps {
                container('helm') {                                   
                    script {
                      stepsHelm()
                    }               
                }
            }
        }
        
        stage('Deploy To Prod') {
            environment {
                NAMESPACE = 'coolops-prod'
                ENV = 'prod'
            }
            when {
                expression {
                    return "$BRANCH_NAME".contains('prod')
                }
            }
            steps {
                container('helm') {                                   
                    script {
                      stepsHelm()
                    }               
                }
            }
        }

        // 扫描
        stage('Sonarqube Scanner') {   
              when {
                    expression {
                        return "$JOB_NAME".contains('skip')
                    }
                }    
              steps {
                timeout(time:20,unit:'MINUTES'){
                    catchError(buildResult: 'SUCCESS', stageResult: 'FAILURE') {
                    container('sonar') {
                        sh 'gradle sonarqube \
                            -x test\
                            -Dsonar.host.url=http://sonar.coolops.cn \
                            -Dsonar.login=c17650fa820d985daf1f29d8a3f685d789e47e45'
                        }
                    }
                }
            }
        }
    }
 }

```

  

整体的Jenkinsfile我做了一些删减，但是整个流程是没变的，咋一看是不是同样很简单？我将步骤整理如下：

-   从代码仓库拉取代码
-   编译代码并推送到仓库
-   根据不同的分支推送到不同的环境
-   代码扫描

  

整体的流程和上一篇文章没太大不同，区别在于：

-   多分支流水线发布
-   由kubectl改成了helm chart
-   新增了代码扫描

  

这里采用Helm Chart来部署应用，我使用的是阿里云的Chart仓库。不会使用的朋友可以通过阿里云-->云效DevOps-->研发-->私有仓库进行申请。

![image.png](assets/devops与交付/Tekton系列之实践篇-把Jenkinsfile变成Tekton_Pipeline/Tekton系列之实践篇-把Jenkinsfile变成Tekton_Pipeline-1.png)

  

我们现在先创建Task，然后再组装Pipeline。

​  

## 使用Helm Chart发布应用Task

我们在之前的文章中使用的是kubectl来发布应用，由于在我实际的使用过程中，是使用的Helm来管理的，为了保持一致，这里先创建一个Helm发布应用的Task。

​  

在创建之前，我们先来看看有哪些地方是需要参数的：

-   namespace：由于我是不同环境不同的namespace，所以在多分支发布的时候需要指定namespace。
-   app\_name：应用名，
-   chart\_name：helm chart 名
-   args：helm chart 的其他参数

​  

所以我们定义的Task如下：

```yaml
apiVersion: tekton.dev/v1alpha1
kind: Task
metadata:
  name: helm-to-k8s
spec:
  workspaces:
    - name: source
    - name: kubernetesconfig
      mountPath: /root/.kube
  params:
    - name: IMAGE
    - name: TAG
    - name: NAMESPACE
    - name: BRANCH_NAME
    - name: CHART_NAME
    - name: CHART_USERNAME
    - name: CHART_PASSWORD
    - name: APP_NAME
  steps:
    - name: run-helm
      image: registry.cn-hangzhou.aliyuncs.com/coolops/helm3:3.2.4
      workingDir: $(workspaces.source.path)
      script: |
        helm repo add coolops https://repomanage.rdc.aliyun.com/helm_repositories/66465-coolops --username=$(params.CHART_USERNAME) --password=$(params.CHART_PASSWORD)
        common_args="--set image.repository=$(params.IMAGE) --set image.tag=$(params.TAG) --set ingress.hosts[0].paths[0]=/"
        helm  -n $(params.NAMESPACE) upgrade $(params.APP_NAME) $(params.CHART_NAME) ${common_args} || \
        helm  -n $(params.NAMESPACE) install $(params.APP_NAME) $(params.CHART_NAME) ${common_args} 
```

  

## 代码扫描Task

由于在Jenkins中使用了代码扫描，所以这里加一个代码扫描的Task，如下：

```groovy
apiVersion: tekton.dev/v1alpha1
kind: Task
metadata:
  name: sonar-scanner
spec:
  workspaces:
    - name: source
  params:
    - name: SONAR_USERNAME
    - name: SONAR_PASSWORD
    - name: SONAR_URL
    - name: APP_NAME
  steps:
    - name: sonar-scanner
      image: registry.cn-hangzhou.aliyuncs.com/coolops/sonar-scanner:2.2.0
      workingDir: $(workspaces.source.path)
      script: |
          scanTime=`date +%F-%H-%M-%S`
          sonar-scanner -Dsonar.host.url=$(params.SONAR_URL) \
                      -Dsonar.projectKey=$(params.APP_NAME)  \
                      -Dsonar.projectName=$(params.APP_NAME)  \
                      -Dsonar.projectVersion=${scanTime} \
                      -Dsonar.login=$(params.SONAR_USERNAME) \
                      -Dsonar.password=$(params.SONAR_PASSWORD) \
                      -Dsonar.projectDescription="$(workspaces.source.path)"
```

  

需要新增的Task就这两个，接下来就是组装Pipeline了，多分支发布也是在Pipeline中组装。

​  

## 整合Pipeline

在整合Pipeline之前，还是先来梳理一下流程：

-   拉代码
-   编译构建、推送镜像
-   发布应用----多环境
-   代码扫描

​  

```yaml
apiVersion: tekton.dev/v1beta1
kind: Pipeline
metadata:
  name: rd-pipeline
spec:
  workspaces: # 声明 workspaces
    - name: rd-repo-pvc
    - name: docker-config
    - name: kubernetes-config
  params:
    # 定义代码仓库
    - name: git_url
    - name: revision
      type: string
      default: "master"
    - name: gitInitImage
      type: string
      default: "registry.cn-hangzhou.aliyuncs.com/coolops/tekton-git-init:v0.29"
    # 定义镜像参数
    - name: pathToDockerfile
      description: The path to the build context, used by Kaniko - within the workspace
      default: .
    - name: imageUrl
      description: Url of image repository
    - name: imageTag
      description: Tag to apply to the built image
      default: latest
    - name: chart_name
      type: string
      default: coolops/coolops-rd
    - name: chart_username
      type: string
    - name: chart_password
      type: string
    - name: app_name
      type: string
    - name: namespace
      type: string
      default: default
    # 定义代码扫描
    - name: sonar_username
      type: string
      default: admin
    - name: sonar_password
      type: string
      default: admin
    - name: sonar_url
      type: string
  tasks: # 添加task到流水线中
    - name: clone
      taskRef:
        name: git-clone
      workspaces:
        - name: output
          workspace: rd-repo-pvc
      params:
        - name: url
          value: $(params.git_url)
        - name: revision
          value: $(params.revision)
        - name: gitInitImage
          value: $(params.gitInitImage)
    - name: unit-test
      workspaces: # 传递 workspaces
        - name: source
          workspace: rd-repo-pvc
      taskRef:
        name: unit-test
      runAfter:
        - clone
    - name: build-push-image
      params:
        - name: pathToDockerfile
          value: $(params.pathToDockerfile)
        - name: imageUrl
          value: $(params.imageUrl)
        - name: imageTag
          value: $(tasks.clone.results.commit)
      taskRef:
        name: build-push-image
      runAfter:
        - unit-test
      workspaces: # 传递 workspaces
        - name: source
          workspace: rd-repo-pvc
        - name: dockerconfig
          workspace: docker-config
    - name: deploy-to-dev
      when:
        - input: $(params.revision)
          operator: in
          values:
            - dev
      taskRef:
        name: helm-to-k8s
      params:
        - name: IMAGE
          value: $(params.imageUrl)
        - name: TAG
          value: $(tasks.clone.results.commit)
        - name: BRANCH_NAME
          value: $(params.revision)
        - name: CHART_NAME
          value: $(params.chart_name)
        - name: CHART_USERNAME
          value: $(params.chart_username)
        - name: CHART_PASSWORD
          value: $(params.chart_password)
        - name: APP_NAME
          value: $(params.app_name)
        - name: NAMESPACE
          value: coolops-dev
      workspaces:
        - name: source
          workspace: rd-repo-pvc
        - name: kubernetesconfig
          workspace: kubernetes-config
      runAfter:
        - build-push-image
    - name: deploy-to-test
      when:
        - input: $(params.revision)
          operator: in
          values:
            - test
      taskRef:
        name: helm-to-k8s
      params:
        - name: IMAGE
          value: $(params.imageUrl)
        - name: TAG
          value: $(tasks.clone.results.commit)
        - name: BRANCH_NAME
          value: $(params.revision)
        - name: CHART_NAME
          value: $(params.chart_name)
        - name: CHART_USERNAME
          value: $(params.chart_username)
        - name: CHART_PASSWORD
          value: $(params.chart_password)
        - name: APP_NAME
          value: $(params.app_name)
        - name: NAMESPACE
          value: coolops-test
      workspaces:
        - name: source
          workspace: rd-repo-pvc
        - name: kubernetesconfig
          workspace: kubernetes-config
      runAfter:
        - build-push-image
    - name: deploy-to-pre
      when:
        - input: $(params.revision)
          operator: in
          values:
            - pre
      taskRef:
        name: helm-to-k8s
      params:
        - name: IMAGE
          value: $(params.imageUrl)
        - name: TAG
          value: $(tasks.clone.results.commit)
        - name: BRANCH_NAME
          value: $(params.revision)
        - name: CHART_NAME
          value: $(params.chart_name)
        - name: CHART_USERNAME
          value: $(params.chart_username)
        - name: CHART_PASSWORD
          value: $(params.chart_password)
        - name: APP_NAME
          value: $(params.app_name)
        - name: NAMESPACE
          value: coolops-pre
      workspaces:
        - name: source
          workspace: rd-repo-pvc
        - name: kubernetesconfig
          workspace: kubernetes-config
      runAfter:
        - build-push-image
    - name: deploy-to-prod
      when:
        - input: $(params.revision)
          operator: in
          values:
            - prod
      taskRef:
        name: helm-to-k8s
      params:
        - name: IMAGE
          value: $(params.imageUrl)
        - name: TAG
          value: $(tasks.clone.results.commit)
        - name: BRANCH_NAME
          value: $(params.revision)
        - name: CHART_NAME
          value: $(params.chart_name)
        - name: CHART_USERNAME
          value: $(params.chart_username)
        - name: CHART_PASSWORD
          value: $(params.chart_password)
        - name: APP_NAME
          value: $(params.app_name)
        - name: NAMESPACE
          value: coolops-prod
      workspaces:
        - name: source
          workspace: rd-repo-pvc
        - name: kubernetesconfig
          workspace: kubernetes-config
      runAfter:
        - build-push-image
    - name: sonar-scanner
      when:
        - input: $(params.revision)
          operator: in
          values:
            - test
      taskRef:
        name: sonar-scanner
      runAfter:
        - clone
      params:
        - name: SONAR_USERNAME
          value: $(params.sonar_username)
        - name: SONAR_PASSWORD
          value: $(params.sonar_password)
        - name: SONAR_URL
          value: $(params.sonar_url)
        - name: APP_NAME
          value: $(params.app_name)
      workspaces:
        - name: source
          workspace: rd-repo-pvc

```

  

编排一个PipelineRun运行一下，如下：

```yaml
apiVersion: tekton.dev/v1beta1
kind: PipelineRun
metadata:
  name: test-hello-world-pipeline-run
spec:
  pipelineRef:
    name: rd-pipeline
  params:
    - name: revision
      value: test
    - name: git_url
      value: https://gitee.com/coolops/devops-hello-world.git    
    - name: imageUrl
      value: registry.cn-hangzhou.aliyuncs.com/coolops/devops-hello-world
    - name: imageTag
      value: latest
    - name: pathToDockerfile
      value: Dockerfile
    - name: chart_username
      value: username
    - name: chart_password
      value: password
    - name: app_name
      value: hello-world
    - name: sonar_username
      value: username
    - name: sonar_password
      value: password
    - name: sonar_url
      value: http://sonarqube.coolops.cn
  workspaces:
    - name: rd-repo-pvc
      volumeClaimTemplate:
        spec:
          accessModes:
          - ReadWriteOnce
          storageClassName: openebs-hostpath
          resources:
            requests:
              storage: 1Gi
    - name: docker-config
      secret:
        secretName: docker-config
    - name: kubernetes-config
      secret:
        secretName: kubernetes-config
  serviceAccountName: tekton-build-sa
```

  

运行效果如下：

![image.png](assets/devops与交付/Tekton系列之实践篇-把Jenkinsfile变成Tekton_Pipeline/Tekton系列之实践篇-把Jenkinsfile变成Tekton_Pipeline-2.png)

  

上面只是把应用部署到同一个集群得不同namespace下，在实际情况下可能有多个集群，我们只需要指定不同的`kubernetes-config`即可，当然， 需保证Tekton所在的集群能与其他集群相通。

​  

sonar上的扫描结果如下：

![image.png](assets/devops与交付/Tekton系列之实践篇-把Jenkinsfile变成Tekton_Pipeline/Tekton系列之实践篇-把Jenkinsfile变成Tekton_Pipeline-3.png)

​  

## 总结

从Jenkins迁移到Tekton，主要就是Pipeline的改写，但是从整体来看并不复杂，因为Jenkins中的过程都是定义好的，我们只需要按它的步骤改造成Tekton适配的语法即可。