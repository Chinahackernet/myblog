## 安装

Tekton的安装非常简单，官方已经将具体的安装文件准备好了，直接安装即可。如下：

```go
kubectl apply --filename https://storage.googleapis.com/tekton-releases/pipeline/latest/release.yaml
```

  

该方式安装的是最新版本的Tekton。不过如果你的机器不能访问gcr.io，是无法正常下载镜像的，你可以先通过一台可以访问国外的机器下载镜像再同步到国内镜像仓库。

​  

如果想安装指定版本的tekton，则选择好对应的版本，比如选择`v0.32.1`版本，执行如下命令：

```go
kubectl apply -f https://storage.googleapis.com/tekton-releases/pipeline/previous/v0.32.1/release.yaml
```

  

更多的版本以及对应的安装方式可以到官网上（[https://github.com/tektoncd/pipeline/releases](https://github.com/tektoncd/pipeline/releases)）查看。

​  

我自己也同步了需要的版本，保存在Gitee仓库（[https://gitee.com/coolops/tekton-install](https://gitee.com/coolops/tekton-install)），有需要的自己去查看。

​  

当然，在安装的时候还需要注意Kubernetes版本，如果Kubernetes的版本太低，安装高版本的Tekton是安装不了的。由于我这里是Kubernetes 1.19.16，所以我安装的是Tekton 0.29.1版本。

​  

## 运行测试

​  

运行安装命令后，可以看到在Kubernetes集群中新增了哪些Tekton的crd，如下：

```go
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

  

并且可以看到安装了哪些具体的应用，如下：

```go
# kubectl get po -n tekton-pipelines 
NAME                                           READY   STATUS    RESTARTS   AGE
tekton-pipelines-controller-75c456df85-qxvq2   1/1     Running   0          6m57s
tekton-pipelines-webhook-5bc8d6b7c4-w6pdn      1/1     Running   0          8m
```

  

到这里我们就可以使用Tekton了，比如创建一个最简单的Task，如下：

```yaml
apiVersion: tekton.dev/v1beta1
kind: Task
metadata:
  name: hello
spec:
  steps:
    - name: hello
      image: ubuntu
      command:
        - echo
      args:
        - "Hello World!"
```

  

从上面的命令可以看到，该Task会输出"Hello World!"。

​  

我们是使用kubectl命令创建，如下：

```yaml
# kubectl apply -f test-task.yaml
```

  

然后通过如下命令查看创建结果：

```yaml
# kubectl get task
NAME             AGE
test             20h
```

​  

但是仅仅创建Task是没有用的，Task只是声明了我们要做什么，是一个静态的对象，如果要得到其结果，需要j借助TaskRun才行。TaskRun的声明也非常的简单，如下：

```yaml
apiVersion: tekton.dev/v1beta1
kind: TaskRun
metadata:
  name: hello
spec:
  taskRef:
    name: hello
```

  

在TaskRun中关联具体的Task即可。接下来就运行TaskRun，如下：

```yaml
# kubectl apply -f taskrun.yaml
```

  

然后可以通过如下命令查看：

```yaml
# kubectl get taskruns.tekton.dev 
NAME                                               SUCCEEDED   REASON      STARTTIME   COMPLETIONTIME
hello                                              True        Succeeded   41s         26s
```

  

我们可以看到状态是True，表示TaskRun执行成功。除此之外，还可以看到具体的Pod，如下：

```yaml
 kubectl get po
NAME                                                         READY   STATUS      RESTARTS   AGE
hello-pod-s86lh                                              0/2     Completed   1          98s
```

  

具体的Pod日志如下：

```yaml
# kubectl logs hello-pod-s86lh
Hello World!
```

  

从日志来看符合为我们的预期。而且可以看到执行完的Pod的状态是`Completed`状态，这个状态是不是很熟悉？当我们运行一个Job对象的时候，运行完成后也是这个状态。这个状态的Pod在运行完成后并不会消失，会保留以便查看具体的信息。

​  

## 安装Cli

Tekton除了使用kubectl操作之外，本身也有客户端，可以到[https://github.com/tektoncd/cli/releases](https://github.com/tektoncd/cli/releases)进行下载，如下：

```yaml
wget https://github.com/tektoncd/cli/releases/download/v0.22.0/tkn_0.22.0_Linux_x86_64.tar.gz
tar xf tkn_0.22.0_Linux_x86_64.tar.gz
mv tkn /usr/local/bin/
```

  

当然也提供其他的安装方式，可以到[https://tekton.dev/docs/getting-started/](https://tekton.dev/docs/getting-started/)进行学习。

​  

安装完成后，可以使用`tkn --help`查看具体的使用指南。

```yaml
# tkn --help
CLI for tekton pipelines

Usage:
tkn [flags]
tkn [command]

Available Commands:
  bundle                Manage Tekton Bundles
  clustertask           Manage ClusterTasks
  clustertriggerbinding Manage ClusterTriggerBindings
  condition             Manage Conditions
  eventlistener         Manage EventListeners
  hub                   Interact with tekton hub
  pipeline              Manage pipelines
  pipelinerun           Manage PipelineRuns
  resource              Manage pipeline resources
  task                  Manage Tasks
  taskrun               Manage TaskRuns
  triggerbinding        Manage TriggerBindings
  triggertemplate       Manage TriggerTemplates

Other Commands:
  completion            Prints shell completion scripts
  version               Prints version information

Flags:
  -h, --help   help for tkn

Use "tkn [command] --help" for more information about a command.
```

  

比如说要查看所有task，如下：

```yaml
# tkn task list
NAME             DESCRIPTION   AGE
build-and-push                 20 hours ago
hello                          21 hours ago
test                           21 hours ago
```

  

更多的操作指令需要自己去摸索了。

​  

## 安装Dashboard

为了对用户更友好，Tekton也有一个Dashboard（[https://tekton.dev/docs/dashboard/](https://tekton.dev/docs/dashboard/)），可以使用如下命令进行安装：

```yaml
kubectl apply --filename https://github.com/tektoncd/dashboard/releases/latest/download/tekton-dashboard-release.yaml

```

  

当然这依然有镜像拉取问题。操作方式和上面介绍的一样。

​  

安装完成后，界面如下：

![image.png](assets/devops与交付/Tekton系列之安装篇/Tekton系列之安装篇-1.png)

  

可以到这个界面上查看具体的资源，点点点的事情这里就不做多的介绍了。、

​  

## 最后

好了，这篇文章主要是基础的安装篇，对于大佬来说是小意思，而且官网（[https://tekton.dev/docs/getting-started/](https://tekton.dev/docs/getting-started/)）上也比较全。但是我依然在这里记录一下，主要是想出Tekton的系列文章，后续会介绍Tekton的理论，Tekton pipeline编写以及如何从Jenkins切换到Tekton等文章，欢迎大家关注。

​  

​  

## 文档

【1】[https://tekton.dev/docs/](https://tekton.dev/docs/)