前面的一系列文章基本已经把Tekton相关的知识介绍完了，如果你认真的看完并且实践过，相信你对Tekton已经有一定的掌握了。

​  

在实际的工作中，Tekton可以完成CICD的所有工作，并没有强制的将它划分为CI工具或者CD工具。在今天的文章中，我们就会将CI和CD进行分开，让Tekton专注于CI，CD则交给Argocd。

​  

![image.png](assets/devops与交付/Tekton系列之实践篇-Tekton和Argocd的梦幻联动/Tekton系列之实践篇-Tekton和Argocd的梦幻联动-1.png)

要使用Tekton+Argocd模式，只需要把我们之前deploy的task变成由Argocd完成即可。而原先的deploy的task改成更改镜像信息并推送到Gitlab。

​  

所以整体步骤变成如下：

-   拉代码
-   编译构建，构建镜像并推送
-   更改helm chart的value.yaml中的镜像信息，推送到仓库
-   argocd监控到chart仓库变化，更新应用

​  

​  

> 前提：自己部署好Argocd，如果对Argocd不熟悉可以到官网（[https://argo-cd.readthedocs.io/en/stable/](https://argo-cd.readthedocs.io/en/stable/)）进行学习，也可以在《运维开发故事》公众号搜索Argocd相关文章进行学习。

######   

## 将Helm Chart保存到Gitlab

因为Argocd是基于GitOps的实现，所以用它来部署应用也是基于Git。

​  

创建一个devops-helm-chart的仓库，如下：

![image.png](assets/devops与交付/Tekton系列之实践篇-Tekton和Argocd的梦幻联动/Tekton系列之实践篇-Tekton和Argocd的梦幻联动-2.png)

  

让后将具体的Helm Chart推送到仓库。

​  

## 在Argocd上部署应用

###### （1）添加仓库

![image.png](assets/devops与交付/Tekton系列之实践篇-Tekton和Argocd的梦幻联动/Tekton系列之实践篇-Tekton和Argocd的梦幻联动-3.png)

​  

###### （2）部署应用

![image.png](assets/devops与交付/Tekton系列之实践篇-Tekton和Argocd的梦幻联动/Tekton系列之实践篇-Tekton和Argocd的梦幻联动-4.png)

  

## 改造Tekton Pipeline

上面已经把基本需要的东西准备好了，下面就开始真正的改造了。

​  

### 创建更改Helm Chart的Task

顾名思义，Argocd是基于Git来进行应用的生命周期管理，所以我们的应用变更最好也是基于Git，这样整个流程是可追溯的。

​  

```yaml
apiVersion: tekton.dev/v1alpha1
kind: Task
metadata:
  name: deploy-to-gitlab
spec:
  workspaces:
    - name: source
    - name: kubernetesconfig
      mountPath: /root/.kube
  params:
    - name: IMAGE
    - name: TAG
    - name: GIT_USERNAME
    - name: GIT_PASSWORD
    - name: CHART_GITLAB_URL
    - name: GIT_NAME
      default: joker
    - name: GIT_EMAIL
      default: coolops@163.com
    - name: CHART_DIR
  steps:
    - name: run-change-helm-chart
      image: registry.cn-hangzhou.aliyuncs.com/coolops/helm-kubectl-curl-git-jq-yq:latest
      workingDir: $(workspaces.source.path)
      script: |
        git remote set-url origin http://$(params.GIT_USERNAME):$(params.GIT_PASSWORD)@$(params.CHART_GITLAB_URL)
        git config --global user.name "$(params.GIT_NAME)"
        git config --global user.email "$(params.GIT_EMAIL)"
        git clone http://$(params.GIT_USERNAME):$(params.GIT_PASSWORD)@$(params.CHART_GITLAB_URL) /opt/devops-cd
        cd /opt/devops-cd/$(params.CHART_DIR)
        git pull
        yq w --inplace values.yaml 'image.repository' "$(params.IMAGE)"
        yq w --inplace values.yaml 'image.tag' "$(params.TAG)"
        git commit -am 'image update'
        git push
```

  

### 修改Tekton Pipeline

上面已经准备好了Task，下面就是对Pipeline进行改造，改造后如下：

```yaml
apiVersion: tekton.dev/v1beta1
kind: Pipeline
metadata:
  name: rd-argocd-pipeline
spec:
  workspaces: # 声明 workspaces
    - name: rd-repo-pvc
    - name: docker-config
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
    - name: git_username
      type: string
      default: root
    - name: git_password
      type: string
    - name: chart_gitlab_url
      type: string
      default: 192.168.205.130/root/devops-helm-chart.git
    - name: git_name
      type: string
      default: joker
    - name: git_email
      type: string
      default: coolops@163.com
    - name: chart_dir
      type: string
      default: coolops-rd
    - name: app_name
      type: string
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
    - name: deploy-to-gitlab
      taskRef:
        name: deploy-to-gitlab
      params:
        - name: IMAGE
          value: $(params.imageUrl)
        - name: TAG
          value: $(tasks.clone.results.commit)
        - name: GIT_USERNAME
          value: $(params.git_username)
        - name: GIT_PASSWORD
          value: $(params.git_password)
        - name: CHART_GITLAB_URL
          value: $(params.chart_gitlab_url)
        - name: GIT_NAME
          value: $(params.git_name)
        - name: GIT_EMAIL
          value: $(params.git_email)
        - name: CHART_DIR
          value: $(params.chart_dir)
      workspaces:
        - name: source
          workspace: rd-repo-pvc
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

  

### 修改PipelineRun

上面已经把Pipeline准备好了，下面就i创建一个PipelineRun进行测试。

```yaml
apiVersion: tekton.dev/v1beta1
kind: PipelineRun
metadata:
  name: devops-hello-world-pipeline-run
spec:
  pipelineRef:
    name: rd-argocd-pipeline
  params:
    - name: revision
      value: test
    - name: git_url
      value: http://192.168.205.130/root/devops-hello-world.git    
    - name: imageUrl
      value: registry.cn-hangzhou.aliyuncs.com/coolops/devops-hello-world
    - name: imageTag
      value: latest
    - name: pathToDockerfile
      value: Dockerfile
    - name: git_password
      value: Joker@1qaz2wsx
    - name: app_name
      value: devops-hello-world
    - name: sonar_username
      value: admin
    - name: sonar_password
      value: Joker@123456
    - name: sonar_url
      value: http://sonarqube.coolops.cn
  workspaces:
    - name: rd-repo-pvc
      volumeClaimTemplate:
        spec:
          accessModes:
          - ReadWriteOnce
          storageClassName: local
          resources:
            requests:
              storage: 1Gi
    - name: docker-config
      secret:
        secretName: docker-config
  serviceAccountName: tekton-build-sa
```

  

然后在Tekton Dashboard上看到运行完成，如下：

![image.png](assets/devops与交付/Tekton系列之实践篇-Tekton和Argocd的梦幻联动/Tekton系列之实践篇-Tekton和Argocd的梦幻联动-5.png)

  

Chart仓库中的value.yaml也进行了对应的更改，如下：

![image.png](assets/devops与交付/Tekton系列之实践篇-Tekton和Argocd的梦幻联动/Tekton系列之实践篇-Tekton和Argocd的梦幻联动-6.png)

  

Argocd也对应用进行了对应的更新，如下：

![image.png](assets/devops与交付/Tekton系列之实践篇-Tekton和Argocd的梦幻联动/Tekton系列之实践篇-Tekton和Argocd的梦幻联动-7.png)

  

到此整个流水线的拆分以及使用就完成了。

​  

## 最后

到这里，Tekton系列文章基本告一段落了，整个系列耗时将近2个月，从最基础的安装，再慢慢到理论知识，以及最后的不同实践，不知道你掌握了多少？

​  

分享是另一种学习，也是我比较推崇的一种学习方式，毕竟自己学和写出来还是有不少的距离，从学习到分享，可以不断的加深对知识的印象，也能很好的整理自己的知识体系，当然也希望对大家有所帮助。

​  

《Tekton系列文章》

-   Tekton系列之安装篇
-   Tekton系列之理论篇
-   Tekton系列之实践篇-我的第一条Pipeline
-   Tekton系列之实践篇-由Jenkins改成Tekton
-   Tekton系列之实践篇-使用Jenkins来管理Tekton
-   Tekton系列之实践篇-使用Trigger让Tekton使用更简单
-   Tekton系列之实践篇-Tekton和Argocd的梦幻联动