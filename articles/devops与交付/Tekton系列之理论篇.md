> 作者 | 乔克
> 
> 博客 | https://www.coolops.cn
> 
> 分享 | 运维开发故事（ID：mygsdcsf）

​  

上一篇文章我们介绍了Tekton的安装并且做了简单的测试，但是我们并不知其所以然，而这篇文章主要带大家来了解以及学习所以然。

​  

Tekton是开源的云原生CI/CD项目，是基于Kubernetes CRD来定义Pipeline，功能强大并且很容易扩展。

​  

在上篇文章中，我们安装完Tekton之后，可以看到安装的CRD如下：

```bash
# kubectl get crd | grep tekton
clustertasks.tekton.dev                       2022-02-28T06:15:38Z
conditions.tekton.dev                         2022-02-28T06:15:38Z
extensions.dashboard.tekton.dev               2022-02-28T06:18:40Z
pipelineresources.tekton.dev                  2022-02-28T06:15:38Z
pipelineruns.tekton.dev                       2022-02-28T06:15:38Z
pipelines.tekton.dev                          2022-02-28T06:15:38Z
runs.tekton.dev                               2022-02-28T06:15:38Z
taskruns.tekton.dev                           2022-02-28T06:15:38Z
tasks.tekton.dev                              2022-02-28T06:15:38Z
```

​  

其中`Task`、`TaskRun`、`Pipeline`、`PipelineRun`、`PipelineResource`、`Condition`作为其核心CRD，这里主要介绍它们。

​  

-   Task：定义构建任务，它由一系列有序steps构成。每个step可以定义输入和输出，且可以将上一个step的输出作为下一个step的输入。每个step都会由一个container来执行。
-   TaskRun：Task用于定义具体要做的事情，并不会真正的运行，而TaskRun就是真正的执行者，并且会提供执行所需需要的参数，一个TaskRun就是一个Pod。
-   Pipeline：顾名思义就是流水线，它由一系列Tasks组成。就像Task中的step一样，上一个Task的输出可以作为下一个Task的输入。
-   PipelineRun：Pipeline的实际执行，创建后会创建Pod来执行Task，一个PipelineRun中有多个Task。
-   PipelineResource：主要用于定义Pipeline的资源，常见的如Git地址、Docker镜像等。
-   Condition：它主要是在Pipeline中用于判断的，Task的执行与否通过Condition的判断结果来决定。

​  

> Tips：PipelineResource和Condition都会被废弃。但是在低版本中还是会继续使用，所以这里会简单介绍一下。

![image.png](assets/devops与交付/Tekton系列之理论篇/Tekton系列之理论篇-1.png)

*图片来自官网（*tekton.dev*）*

​  

如上图所示，一个Pipeline是由许多Task组成，每个Task又由许多step组成。在实际工作中，我们可以灵活定义各种Task，然后根据需要任意组合Task形成各类Pipeline来完成不同的需求。

  

## 实现原理

上面大致介绍了Tekton的主要CRD以及它们所具备的能力，那么，Tekton是如何把这些CRD串联起来的呢？

​  

我们在安装完Tekton后，可以看到如下两个Pod。

```bash
# kubectl get po -n tekton-pipelines 
NAME                                           READY   STATUS    RESTARTS   AGE
tekton-pipelines-controller-75c456df85-qxvq2   1/1     Running   0          2d22h
tekton-pipelines-webhook-5bc8d6b7c4-w6pdn      1/1     Running   0          2d22h
```

  

一个是tekton-pipelines-controller，一个是tekton-pipelines-webhook。其实从命名方式就可以看出，一个是tekton的控制器，用于监听CRD对象，一个是tekton的网络钩子，用于做CRD校验，其中tekton-pipelines-controller就是Tekton的核心实现Pod。

​  

tekton-pipelines-controller在启动的时候会初始化两个Controller：PipelineRunController以及TaskRunController。我们可以通过main.go（[cmd/controller/main.go](https://github.com/tektoncd/pipeline/blob/main/cmd/controller/main.go)）看到，如下：

```go
	......
   go func() {
		// start the web server on port and accept requests
		log.Printf("Readiness and health check server listening on port %s", port)
		log.Fatal(http.ListenAndServe(":"+port, mux))
	}()

	ctx = filteredinformerfactory.WithSelectors(ctx, v1beta1.ManagedByLabelKey)
	sharedmain.MainWithConfig(ctx, ControllerLogKey, cfg,
		taskrun.NewController(opts, clock.RealClock{}),
		pipelinerun.NewController(opts, clock.RealClock{}),
	)
}
```

  

如上所示会通过`taskrun.NewController`和`pipelinerun.NewController`来进行初始化，然后通过`sharedmain.MainWithConfig`调用`controller.StartAll`来启动所有Controller。

​  

PipelineRunController通过监听PipelineRun对象的变化，然后从PipelineSpec中获取Task列表并构建成一张有向无环图（DAG），然后通过遍历DAG找到可被调度的Task节点创建对应的TaskRun对象。具体可以通过（pkg/reconciler/pipelinerun/pipelinerun.go）中的`reconcile`方法进行查看。

​  

TaskRunController监听到TaskRun对象的变化，就会将TaskRun中的Task转化为Pod，由Kubernetes调度执行。可以通过（pkg/reconciler/taskrun/taskrun.go）中的`reconcile`方法进行查看。

​  

利用 Kubernetes 的 OwnerReference 机制， PipelineRun Own TaskRun、TaskRun Own Pod、Pod 状态变更时，触发 TaskRun 的 reconcile 逻辑， TaskRun 状态变更时触发 PipelineRun 的 reconcile 逻辑。

​  

![image.png](assets/devops与交付/Tekton系列之理论篇/Tekton系列之理论篇-2.png)

*图片来自网络*

  

  

当TaskRun的Pod变成running过后，就会通知第一个step容器来执行（通过一个名叫`entrypoint`的二进制文件来完成）。

​  

当然这个`entrypoint`二进制文件也有运行条件的，当且仅当pipeline的状态的annotation通过

`Kubernetes Download Api`以文件的方式注入到step container后才会启动提供的命令。这句话是不是有点绕？按照官方的说法是：Tekton Pipeline是通过Kubernetes Annotation来跟踪Pipeline的状态，而且这些annotations会通过`Kubernetes Download Api`以文件的方式注入到Step Container中，Step Container中的`entrypoint`会监听着这些文件，当特定的annotation以文件的形式注入进来过后，`entrypoint`才会去执行命令。比方说，一个Task中有两个step，第二个step中的`entrypoint`会等待，直到annotation以文件的形式告诉它第一个step已经完成。

  

我们来梳理一下整体的流程，如下：

1.  用户通过client创建PipelineRun资源
2.  PipelineRunController监听到PipelineRun资源，就把里面的Task组成DAG（有向无环图），遍历DAG得到Task，并创建TaskRun
3.  TaskRunController监听到TaskRun资源，就会通过Kubernetes将Task转化为Pod启动（Task受Condition条件控制）
4.  Pod启动后会运行Task中的每一个Step完成具体的指令
5.  运行完成后Pod会变成`Completed`状态，同时也会更新PipelineRun的状态

  

到此一个Pipeline就运行完成了。

​  

## PipelineResources

这里将PipelintResource提到最前面来说明，主要是后面的操作有需要它的地方。

​  

PipelineResource用于定义资源的信息，虽然会被弃用，但是在旧版本中依然会使用。

​  

PipelineResource的定义很简单，如下：

```yaml
apiVersion: tekton.dev/v1alpha1
kind: PipelineResource
metadata:
  name: hello-word-resource
spec:
  type: git
  params:
  - name: url
    value: https://gitee.com/coolops/springboot-helloworld.git

```

​  

在TaskRun中就可以引用hello-word-resource资源得到具体的git地址。

​  

## Tasks

Task就是一个任务模板，Task的定义中可以包含变量，在真正执行的时候需要给变量赋值。

​  

Task通过input.params定义入参，每一个入参还可以指定默认值，在每一个step中可以$(params.A)引用变量。steps字段表示当前Task有哪些步骤组成，每一个step都会通过定义一个container来执行具体的操作。

​  

Task主要包括以下元素：

-   Parameters：用于定义params参数
-   Resources：定义输入、输出资源，老版本由PipelineResources定义，不过在新版本中PipelineResources将被弃用
-   Steps：定义具体的操作步骤
-   Workspaces：定义工作区，Task可以共享工作区
-   Results：定义结果输出，可以用于展示或者给另外的Task使用

​  

Task的定义如下：

```yaml
apiVersion: tekton.dev/v1beta1
kind: Task
metadata:
  name: maven-build
spec:
  resources:
    inputs:
    - name: repo
      type: git
  steps:
  - name: build
    image: maven:3.3-jdk-8
    command:
    - mvn clean package
    workingDir: /workspace/repo
    
```

  

再定义一个构建Dokcer镜像并推送到Hub的Task，如下：

```bash
apiVersion: tekton.dev/v1beta1
kind: Task
metadata:
  name: build-and-push-image
spec:
  params:
  - name: pathToDockerfile
    type: string
    default: /workspace/repo/Dockerfile
    description: define Dockerfile path
  - name: pathToContext
    type: string
    default: /workspace/repo
    description: 	Docker deamon build context
  - name: imageRepo
    type: string
    default: registry.cn-hangzhou.aliyuncs.com
    description: docker image repo
  resources:
    inputs:
    - name: repo
      type: git
    outputs:
    - name: builtImage
      type: image
  steps:
  - name: build-image
    image: docker:stable
    scripts: |
      #!/usr/bin/env sh
      docker login $(params.imageRepo)
      docker build -t $(resources.outputs.builtImage.url) -f $(params.pathToDockerfile) $(params.pathToContext)
      docker push $(resources.outputs.builtImage.url)
    volumeMounts:
    - name: dockersock
      mountPath: /var/run/docker.sock
  volumes:
  - name: dockersock
    hostPath:
      path: /var/run/docker.sock
```

如上，我们可以通过直接编写shell脚本的方式来实现需求，而且使用docker构建镜像需要sock文件，可以像pod挂载那样挂载需要的东西。

  

step还有其他的配置，比如为某个step设置超时时间，如下：

```yaml
steps:
  - name: sleep-then-timeout
    image: ubuntu
    script: |
      #!/usr/bin/env bash
      echo "I am supposed to sleep for 60 seconds!"
      sleep 60
    timeout: 5s
```

  

更多的操作可以通过（[https://tekton.dev/docs/pipelines/tasks/](https://tekton.dev/docs/pipelines/tasks/)）进行学习研究。

  

## TaskRuns

Task在定义好之后，并不会被执行，就像我们定义了一个函数，如果没被调用的话，这个函数就不会被执行一样。而TaskRun就可以就好似调用方，用它来执行Task里的具体内容。

​  

TaskRun会设置Task需要的参数，并通过taskRef字段来引用Task，如下：

​  

```yaml
apiVersion: tekton.dev/v1beta1
kind: TaskRun
metadata:
  name: build-and-push-image
spec:
  params:
  - name: imageRepo
    value: registry.cn-zhangjiakou.aliyuncs.com
  taskRef:
    name: build-and-push-image # 关联定义好的task
  resources:
    inputs:
      - name: repo # 指定输入的仓库资源
        resourceRef:
          name: hello-word-resource
    outputs: # 指定输出的镜像资源
      - name: builtImage
        resourceRef:
          name: hello-word-image
```

  

通过如上的定义，就将build-and-push-image的Task进行关联，并且通过resources定义Task需要的sources参数，然后通过parms来定义参数，该参数会替代掉Task中的默认参数。

​  

在实际中，基本不会去定义TaskRun，除非自己去测试某个Task是否正常。

## Pipelines

一个TaskRun只能执行一个Task，当我们需要同时编排许多Task的时候，就需要使用Pipeline了，就像使用Jenkinsfile来编排不同的任务一样。

​  

Pipeline是一个编排Task的模板，通过spec.params来声明执行时需要的入参，通过spec.tasks来编排具体的task，除此之外还可以通过runAfter来控制Task的先后顺序。

  

先定义一个简单的Pipeline，如下：

```yaml
apiVersion: tekton.dev/v1beta1
kind: Pipeline
metadata:
  name: build-and-push-image
spec:
  resources:
    - name: repo
      type: git
    - name: builtImage
      type: image
  tasks:
    # 构建并推送 Docker 镜像
    - name: build-and-push-image
      taskRef:
        name: build-and-push-image
      resources:
        inputs:
          - name: repo # Task 输入名称
            resource: repo # Pipeline 资源名称
        outputs:
          - name: builtImage
            resource: builtImage
```

  

上面定义的Pipeline关联了`build-and-push-image` Task，该Task所需要的输入输出参数，通过Pipeline的`spec.resources`定义，这里的`spec.resources`依然依赖PipelineResources中定义的具体资源。

  

上面提到过，如果要在Pipeline中控制Task顺序，则要使用runAfter参数，如下：

​  

```yaml
- name: test-app
  taskRef:
    name: make-test
  resources:
    inputs:
      - name: workspace
        resource: my-repo
- name: build-app
  taskRef:
    name: kaniko-build
  runAfter:
    - test-app
  resources:
    inputs:
      - name: workspace
        resource: my-repo
```

  

如上build-app的Task依赖test-app的Task。

​  

除此之外，还可以将上个Task的输出作为下一个Task的输入，如下。

```yaml
- name: build-app
  taskRef:
    name: build-push
  resources:
    outputs:
      - name: image
        resource: my-image
- name: deploy-app
  taskRef:
    name: deploy-kubectl
  resources:
    inputs:
      - name: image
        resource: my-image
        from:
          - build-app
```

  

如上通过`from`关键字来引入其他Task的输出。

​  

如果要在Pipeline中使用条件判断，也可以像以下方式使用`when`关键字。

```yaml
tasks:
  - name: deploy-to-dev
    when:
      - input: "$(params.branch)"
        operator: in
        values: ["dev"]
    taskRef:
      name: deploy-to-dev
---
tasks:
  - name: deploy-to-test
    when:
      - input: "$(params.branch)"
        operator: in
        values: ["test"]
    taskRef:
      name: deploy-to-test
```

  

> 注意：when和condition不能同时在一个Task中使用，不然会被认定为无效。

  

还有一个关键字和when效果一样，就是condition。

​  

condition的作用就是用一些条件来保护Task，只有在满足条件的情况下才会运行Task。在Task运行之前，会对所有的条件进行判断，只有全部条件成功，才会运行Task，否则不会允许。

​  

如下定义一个简单的条件语句。

```yaml
tasks:
  - name: deploy-if-branch-is-master
    conditions:
      - conditionRef: is-master-branch
        params:
          - name: branch-name
            value: my-value
    taskRef:
      name: deploy
```

  

当然条件约束仅针对当前的Task，如果其他Task不受当前Task影响，则不受约束。

  

更多的使用方式见（[https://tekton.dev/docs/pipelines/pipelines/](https://tekton.dev/docs/pipelines/pipelines/)）。

## PipelineRuns

Pipeline和Task一样，单纯的定义完并不会运行，Pipeline需要借助PipelineRun来完成真正的执行。

​  

PipelineRun会自动为Pipeline中定义的Task创建对应的TaskRun。

​  

下面定义一个简单的PipelineRun。

​  

```yaml
apiVersion: tekton.dev/v1beta1
kind: PipelineRun
metadata:
  name: build-and-push-image
spec:
  pipelineRef:
    name: build-and-push-image
  resources:
    - name: repo
      resourceRef:
        name: demo-git
    - name: builtImage
      resourceRef:
        name: harbor-image
```

  

其中`spec.pipelineRef`用来关联定义的Pipeline，`spec.resources`用来给Pipeline传递参数。

​  

上面的repo和builtImage参数依然需要通过`PipelineResources`定义。不过在新版本，也可以通过`resourceSpec`来进行定义，如下。

```yaml
apiVersion: tekton.dev/v1beta1
kind: PipelineRun
metadata:
  name: build-and-push-image
spec:
  pipelineRef:
    name: build-and-push-image
  resources:
    - name: repo
      resouorceSpec:
        type: git
        params:
        - name: url
          value: https://gitee.com/coolops/springboot-helloworld.git
    - name: builtImage
      resouorceSpec:
        type: image
        params:
        - name: url
          value: registry.cn-hangzhou.aliyuncs.com/coolops/helloworld:latest
```

  

## Conditions

condition用于在Pipeline中进行条件判断，不过在新版本中会被废弃，使用上面介绍的`when`替代，这里不再做多的介绍了。

  

  

## 鉴权管理

上面介绍了主要的CRD以及它们的使用方式，但是还有一种是需要我们关注的，比如代码仓库的密码怎么管理？镜像仓库的密码怎么管理？因为这些都是在实际工作中需要使用的。

​  

Tekton通过在`PipelineRun`中指定`ServiceAccount`来实现。不过Tekton要求定义的每个Secret都需要指定对应的annotation。目前支持的annotation有以下两种：

-   Git：`tekton.dev/git-**0****:** https**:**//github.com`
-   Docker：`tekton.dev/docker-**0****:** https**:**//gcr.io`

  

目前这两种分别支持以下类型。

<table data-lake-id="tukBR" id="tukBR" class="lake-table" style="width: 609px"><colgroup><col width="234"><col width="375"></colgroup><tbody><tr data-lake-id="ub64faf1c" id="ub64faf1c"><td data-lake-id="u5395784b" id="u5395784b"><p data-lake-id="u5516cbc0" id="u5516cbc0" style="text-align: left"><span data-lake-id="ua3e7023b" id="ua3e7023b" class="lake-fontsize-12" style="color: rgb(34, 34, 34)">Git</span></p></td><td data-lake-id="u59b5dc54" id="u59b5dc54"><p data-lake-id="ua46af1c0" id="ua46af1c0" style="text-align: left"><span data-lake-id="u6b5859e3" id="u6b5859e3" class="lake-fontsize-12" style="color: rgb(34, 34, 34)">Docker</span></p></td></tr><tr data-lake-id="u7503513b" id="u7503513b"><td data-lake-id="uf9ba7dfd" id="uf9ba7dfd"><p data-lake-id="u12f1d798" id="u12f1d798" style="text-align: left"><span data-lake-id="u3d92ee27" id="u3d92ee27" class="lake-fontsize-11" style="color: inherit">kubernetes.io/basic-auth</span><span data-lake-id="u28f0c1da" id="u28f0c1da" class="lake-fontsize-12" style="color: rgb(34, 34, 34)"><br /></span><span data-lake-id="udf0ffb1d" id="udf0ffb1d" class="lake-fontsize-11" style="color: inherit">kubernetes.io/ssh-auth</span></p></td><td data-lake-id="uef20963e" id="uef20963e"><p data-lake-id="u8c88c518" id="u8c88c518" style="text-align: left"><span data-lake-id="uba67d145" id="uba67d145" class="lake-fontsize-11" style="color: inherit">kubernetes.io/basic-auth</span><span data-lake-id="u7f1b61a3" id="u7f1b61a3" class="lake-fontsize-12" style="color: rgb(34, 34, 34)"><br /></span><span data-lake-id="ubb1f21b1" id="ubb1f21b1" class="lake-fontsize-11" style="color: inherit">kubernetes.io/dockercfg</span><span data-lake-id="ube4dc62b" id="ube4dc62b" class="lake-fontsize-12" style="color: rgb(34, 34, 34)"><br /></span><span data-lake-id="uf04be773" id="uf04be773" class="lake-fontsize-11" style="color: inherit">kubernetes.io/dockerconfigjson</span></p></td></tr></tbody></table>

  

Tekton到底是如何使用到这些secret的呢？

​  

原来，为了使用这些Secret，Tekton在实例化Pod的时候就会执行凭证初始化， Tekton会将具体的Secret进行关联并聚合到/tekton/creds目录中，之后才会执行具体的Task步骤。

​  

下面我们具体操作一下，以镜像仓库为例。

​  

（1）创建secret

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: docker-registry-secret
  annotations:
    tekton.dev/docker-0: https://gcr.io # Described below
type: kubernetes.io/basic-auth
stringData:
  username: <cleartext username>
  password: <cleartext password>
```

其中`tekton.dev/docker-0: [https://gcr.io](https://gcr.io)`用来指定对应的仓库地址。

​  

（2）创建seviceaccount

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: docker-registry-sa
secrets:
  - name: docker-registry-secret
```

  

（3）在PipelineRun中引用

```yaml
apiVersion: tekton.dev/v1beta1
kind: PipelineRun
metadata:
  name: demo-pipeline
  namespace: default
spec:
  serviceAccountName: docker-registry-sa
  pipelineRef:
    name: demo-pipeline
```

  

如果需要同时使用多个serviceaccount怎么办呢？比如我们在一条完成的Pipeline中，在拉取代码的时候会用到Git的账户，在推送镜像的时候会用到镜像仓库的账户。

​  

这时候我们就不能用`serviceAccountName`了，而是需要使用`serviceAccountNames`。`serviceAccountNames`是一个List，可以指定Task关联具体的serviceaccount，如下。

```yaml
apiVersion: tekton.dev/v1beta1
kind: PipelineRun
metadata:
  name: demo-pipeline
  namespace: default
spec:
  serviceAccountNames: 
    - taskName: build-app
      serviceAccountName: gitlab-sa
    - taskName: push-image
      serviceAccountName: docker-registry-sa
  pipelineRef:
    name: demo-pipeline
```

  

到这里基本的资源以及介绍完了，弄懂这篇文章，写一个简单的Pipeline应该不成问题，后续的文章会分享具体的实践。

  

## 参考文档

【1】[https://www.infoq.cn/article/aRAYxTo19Bd6AVBmXFQz](https://www.infoq.cn/article/aRAYxTo19Bd6AVBmXFQz)

【2】[https://cloudnative.to/blog/how-tekton-works/](https://cloudnative.to/blog/how-tekton-works/)