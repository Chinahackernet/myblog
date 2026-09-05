## 目录

  

1、GitLabCI & Runner 介绍

2、环境、软件准备

3、GitLab Runner 在 MacOS 上升级

4、Kubernetes 集群中运行 GitLab Runner、 GitLab 并测试

5、GitLab 服务安装在非 Kubernetes 集群测试

## 1、GitLabCI & Runner 介绍

> GitLab-CI 是一套 GitLab 提供给用户使用的持续集成系统，GitLab 8.0 版本以后是默认集成并且默认启用。GitLab-Runner 是配合 GitLab-CI 进行使用的，GitLab 里面每个工程都会定义一些该工程的持续集成脚本，该脚本可配置一个或多个 Stage 例如构建、编译、检测、测试、部署等等。当工程有代码更新时，GitLab 会自动触发 GitLab-CI，此时 CitLab-CI 会找到事先注册好的 GitLab-Runner 通知并触发该 Runner 来执行预先定义好的脚本。

  

传统的 GitLab-Runner 我们一般会选择某个或某几个机器上，可以 Docker 安装启动亦或是直接源码安装启动，都会存在一些痛点问题，比如发生单点故障，那么该机器的所有 Runner 就不可用了；每个 Runner 所在机器环境不一样，以便来完成不同类型的 Stage 操作，但是这种差异化配置导致管理起来很麻烦；资源分配不平衡，有的 Runner 运行工程脚本出现拥塞时，而有的 Runner 缺处于空闲状态；资源有浪费，当 Runner 处于空闲状态时，也没有安全释放掉资源。因此，为了解决这些痛点，我们可以采用在 Kubernetes 集群中运行 GitLab-Runner 来动态执行 GitLab-CI 脚本任务，它整个流程如下图：

  

![image.png](assets/kubernetes与云原生/Kubernetes_集群中运行_GitLab-Runner_来执行_GitLab-CI/Kubernetes_集群中运行_GitLab-Runner_来执行_GitLab-CI-1.png)

  

这种方式带来的好处有：

  

-   服务高可用，当某个节点出现故障时，Kubernetes 会自动创建一个新的 GitLab-Runner 容器，并挂载同样的 Runner 配置，使服务达到高可用。
-   动态伸缩，合理使用资源，每次运行脚本任务时，Gitlab-Runner 会自动创建一个或多个新的临时 Runner，当任务执行完毕后，临时 Runner 会自动注销并删除容器，资源自动释放，而且 Kubernetes 会根据每个节点资源的使用情况，动态分配临时 Runner 到空闲的节点上创建，降低出现因某节点资源利用率高，还排队等待在该节点的情况。
-   扩展性好，当 Kubernetes 集群的资源严重不足而导致临时 Runner 排队等待时，可以很容易的添加一个 Kubernetes Node 到集群中，从而实现横向扩展。

## 2、环境、软件准备

通过之前的文章 Kubernetes 集群使用 Helm 搭建 GitLab 并配置 Ingress 和 Docker搭建自己的Gitlab CI Runner，我们已经演示了如何在本地安装并配置 GilLab-Runner，同时也能够在 Kubernetes 集群中安装 GitLab 服务。本次演示环境，我依旧是在本机 MAC OS 上操作，不过，需要将 GitLab-Runner 也安装 Kubernetes 中，以下是安装的软件及版本：

  

Docker: version 17.09.0-ce

Oracle VirtualBox: version 5.1.20 r114628 (Qt5.6.2)

GitLab: 10.6.2-ce.0

GitLab-Runner：11.0.2

Minikube: version v0.22.2

Helm: version v2.8.0

Kuberctl:

Client Version: v1.7.5

Server Version: v1.7.5

注意：这里 Kubernetes 集群搭建我使用 Minikube 来完成，Minikube 启动的单节点 k8s Node 实例是需要运行在本机的 VM 虚拟机里面，所以需要提前安装好 VM，这里我选择 Oracle VirtualBox。k8s 运行底层使用 Docker 容器，所以本机需要安装好 Docker 环境，这里忽略 Docker、VirtualBox、Minikube、Kuberctl 和 Helm 的安装过程，着重介绍下 GitLab-Runner 的安装并测试使用。

  

## 3、GitLab Runner 在 MacOS 上升级

继上一篇文章，我们已经在 Kubernetes 集群中搭建好了 GitLab 服务，我本地测试下是否能够正常注册 GitLab-Runner，注意：由于未更新，此时我本地的 GitLab-Runner 版本为 1.11.2，算是比较老的版本了。注册前，我们得先去 GitLab 上新建一个项目去，这里偷个懒，创建时选择 Create from template，然后直接选择 Spring 这个模板项目，并命名为 spring-devops 项目。后续操作都是基于此模板项目，就不在重复描述了。

  

```plain
$ sudo gitlab-runner register
Running in system-mode.
Please enter the gitlab-ci coordinator URL (e.g. https://gitlab.com/):
http://my.gitlag.com/
Please enter the gitlab-ci token for this runner:
g-1YUWB4_JoLgshuPJ6y
Please enter the gitlab-ci description for this runner:
my-gitlab
Please enter the gitlab-ci tags for this runner (comma separated):
kubernetes
Whether to run untagged builds [true/false]:
[false]: true
ERROR: Registering runner... failed                 runner=g-1YUWB4 status=404 Not Found
PANIC: Failed to register this runner. Perhaps you are having network problems
```

  

注册失败，报错了。其实这是因为 GitLab 跟 GitLab Runner 版本兼容性不匹配导致的。详细兼容性列表可以点击 这里 查看。所以，我们需要先升级一下本地 GitLab-Runner 到最新版本，可参考 GitLab-Runner 安装文档 执行。

  

-   第一步：停止 GitLab-Runner 服务

$ gitlab-runner stop

-   第二步：下载 GitLab-Runner 源码，并覆盖现有文件

$ curl -o /usr/local/bin/gitlab-runner [https://gitlab-runner-downloads.s3.amazonaws.com/latest/binaries/gitlab-runner-darwin-amd64](https://gitlab-runner-downloads.s3.amazonaws.com/latest/binaries/gitlab-runner-darwin-amd64)

-   第三步：对文件赋可执行权限

$ chmod +x /usr/local/bin/gitlab-runner

-   第四步：启动 GitLab-Runner 服务

$ gitlab-runner start

OK，升级完毕后，通过 gitlab-runner --version 命名可以查看当前安装版本，我们再来执行一下注册看下，妥妥没有问题了。

  

```plain
# 注册 runner
$ sudo gitlab-runner register
WARNING: Running in system-mode.
Please enter the gitlab-ci coordinator URL (e.g. https://gitlab.com/):
http://my.gitlab.com/
Please enter the gitlab-ci token for this runner:
g-1YUWB4_JoLgshuPJ6y
Please enter the gitlab-ci description for this runner:
my-gitlab
Please enter the gitlab-ci tags for this runner (comma separated):
kubernetes
Registering runner... succeeded                     runner=g-1YUWB4
Please enter the executor: virtualbox, docker+machine, docker-ssh+machine, docker, docker-ssh, parallels, shell, ssh, kubernetes:
kubernetes
Runner registered successfully. Feel free to start it, but if it's running already the config should be automatically reloaded!
# 查看 Runner 列表
$ gitlab-runner list
Listing configured runners            ConfigFile=/Users/wanyang3/.gitlab-runner/config.toml
my-gitlab                             Executor=kubernetes Token=71c294dafefcd12358a773bb35d0ea URL=http://my.gitlab.com/
# 查看 Runner 配置文件
$ cat /Users/wanyang3/.gitlab-runner/config.toml
concurrent = 2
check_interval = 0
[[runners]]
 name = "my-gitlab"
 url = "http://my.gitlab.com/"
 token = "71c294dafefcd12358a773bb35d0ea"
 executor = "kubernetes"
 [runners.cache]
 [runners.kubernetes]
   host = ""
   bearer_token_overwrite_allowed = false
   image = ""
   namespace = ""
   namespace_overwrite_allowed = ""
   privileged = false
   service_account_overwrite_allowed = ""
   pod_annotations_overwrite_allowed = ""
   [runners.kubernetes.volumes]
```

  

> 注意：这里 executor 执行类型，我特意选择了 kubernetes，主要是看下选择了 Kubernetes 作为执行类型的话，生成的 runner 配置有那些不同。通过 config.toml 文件，我们可以看到 [runners.kubernetes] 下边有很多配置，这些配置我就不在挨个介绍了，详细配置可参考文档 [runners.kubernetes] section of advanced configuration 以及 Kubernetes executor。

  

## 4、Kubernetes 集群中运行 GitLab Runner、 GitLab 并测试

好了，本地通过 GitLab-Runner 注册 Kubernetes 集群中的 GitLab 服务没有问题，现在，我们需要将 GitLab-Runner 也安装到 Kubernetes 集群中，看下是否能够注册并运行 GitLab-CI 成功。根据 Run GitLab Runner on a Kubernetes cluster 文档，我们需要创建一个 ConfigMap 和 Deployment，并部署到 Kubernetes 集群中。

  

新建 ConfigMap 文件 gitlab-runner-configmap.yaml

```plain
$ vim gitlab-runner-configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
 name: gitlab-runner
 namespace: default
data:
 config.toml: |
   concurrent = 2
   [[runners]]
     name = "Kubernetes Runner"
     url = "http://my.gitlab.com/"
     token = "71c294dafefcd12358a773bb35d0ea"
     executor = "kubernetes"
     [runners.kubernetes]
       namespace = "default"
       image = "busybox"
```

注意：这里有个坑，那就是 token 字段，该字段在 runner 注册成功后，在容器的 /etc/gitlab-runner/config.toml 配置文件中可以找到，而且该 token 跟 GitLab 上项目的 Settings > CI/CD > Runners settings > registration token 是不一致的，这个没有问题。但是下边 GitLab-Runner 的 Deployment 需要使用该 ConfigMap 配置 config.toml，此时，GitLab-Runner 还没有执行 register 操作呢，如何获取的到 token，而且每个 runner 注册时，生成的 token 是不一样的，没法直接使用已存在的别的 runner 的 token。最后，我的方案是，可以不使用该 ConfigMap，下边启动了 GitLab-Runner 后，进入到容器内部，手动执行注册。

  

新建 Deployment 文件 gitlab-runner-deployment.yaml

```plain
$ vim gitlab-runner-deployment.yaml
apiVersion: extensions/v1beta1
kind: Deployment
metadata:
 name: gitlab-runner
 namespace: default
spec:
 replicas: 1
 selector:
   matchLabels:
     name: gitlab-runner
 template:
   metadata:
     labels:
       name: gitlab-runner
   spec:
     containers:
     - args:
       - run
       image: gitlab/gitlab-runner:latest
       imagePullPolicy: IfNotPresent
       name: gitlab-runner
       volumeMounts:
       - mountPath: /etc/gitlab-runner
         name: config
       - mountPath: /etc/ssl/certs
         name: cacerts
         readOnly: true
     restartPolicy: Always
     volumes:
     - configMap:
         name: gitlab-runner
       name: config
     - hostPath:
         path: /usr/share/ca-certificates/mozilla
       name: cacerts
```

执行 kubectl 命令部署到 Kubernetes 中。

```plain
$ kubectl create -f gitlab-runner-configmap.yaml
configmap "gitlab-runner" created
$ kubectl create -f gitlab-runner-deployment.yaml
deployment "gitlab-runner" created
$ kubectl get pods
NAMESPACE     NAME                                 READY     STATUS    RESTARTS   AGE
default       gitlab-gitlab-ce-2349088227-z1nkn    1/1       Running   1          1d
default       gitlab-postgresql-1290581213-jbm0s   1/1       Running   1          1d
default       gitlab-redis-2286670209-dfrks        1/1       Running   1          1d
default       gitlab-runner-3178994166-1c10d       1/1       Running   0          13m
```

OK 服务已经启动起来了，接下来，我们进入到 gitlab-runner-3178994166-1c10d 容器内部，注册一下试试看。

```plain
$ kubectl exec -it gitlab-runner-3178994166-1c10d /bin/bash
root@gitlab-runner-3178994166-1c10d:/# gitlab-runner register
Running in system-mode.
Please enter the gitlab-ci coordinator URL (e.g. https://gitlab.com/):
http://my.gitlab.com/
Please enter the gitlab-ci token for this runner:
g-1YUWB4_JoLgshuPJ6y
Please enter the gitlab-ci description for this runner:
[gitlab-runner-3178994166-1c10d] : kubernetes-runner
Please enter the gitlab-ci tags for this runner (comma separated):
kubernetes
ERROR: Registering runner... failed                 runner=g-1YUWB4 status=couldn't execute POST against http://my.gitlab.com/api/v4/runners: Post http://my.gitlab.com/api/v4/runners: dial tcp: lookup my.gitlab.com on 10.0.0.10:53: no such host
PANIC: Failed to register this runner. Perhaps you are having network problems
```

额，注册失败了！看日志，应该是找不到 my.gitlab.com 这个域名，也是，这个域名是我本地绑定 host 来完成了，不是一个正确的域名地址。那么，我们在容器内绑定 host 试试看吧！

```plain
$ echo "192.168.99.100 my.gitlab.com" >> /etc/hosts
root@gitlab-runner-3178994166-1c10d:/# gitlab-runner register
Running in system-mode.
Please enter the gitlab-ci coordinator URL (e.g. https://gitlab.com/):
http://my.gitlab.com/
Please enter the gitlab-ci token for this runner:
g-1YUWB4_JoLgshuPJ6y
Please enter the gitlab-ci description for this runner:
[gitlab-runner-3178994166-1c10d] : kubernetes-runner
Please enter the gitlab-ci tags for this runner (comma separated):
kubernetes
Registering runner... succeeded                     runner=g-1YUWB4
Please enter the executor: kubernetes, docker, ssh, docker-ssh+machine, virtualbox, docker+machine, docker-ssh, parallels, shell:
kubernetes
Runner registered successfully. Feel free to start it, but if it's running already the config should be automatically reloaded!
root@gitlab-runner-3178994166-1c10d:/# gitlab-runner list
Listing configured runners                          ConfigFile=/etc/gitlab-runner/config.toml
kubernetes-runner                                   Executor=kubernetes Token=bb64a2fa634084d169b2c9dd992d45 URL=http://my.gitlab.com/
```

注册成功，目前看来一切还是比较顺利的，在 GitLab 里 spring-devops 项目下 Setting > CI/CD Settings > Runners settings 下也是可以看到该 runner 的，并且是 active 可用状态。

![image.png](assets/kubernetes与云原生/Kubernetes_集群中运行_GitLab-Runner_来执行_GitLab-CI/Kubernetes_集群中运行_GitLab-Runner_来执行_GitLab-CI-2.png)

  

接下来，我们测试一下 GitLab-CI 触发 GitLab-Runner 好不好使吧！首先，我们得有一个 .gitlab-ci.yml 的脚本文件，刚好这个 spring-devops 项目使用的模板就存在这个文件，不过我们还需要修改一下，增加 tags 标签，指明使用刚注册的 tag 为 kubernetes 的 runner 来执行，不然运行时会报错 This build is stuck.... 这样的信息，我贴一下修改之后的文件如下：

```plain
$ cat .gitlab-ci.yml
image: maven:3.5-jdk-8
variables:
 MAVEN_OPTS: "-Dmaven.repo.local=.m2/repository -Dorg.slf4j.simpleLogger.log.org.apache.maven.cli.transfer.Slf4jMavenTransferListener=WARN -Dorg.slf4j.simpleLogger.showDateTime=true -Djava.awt.headless=true"
 MAVEN_CLI_OPTS: "--batch-mode --errors --fail-at-end --show-version -DinstallAtEnd=true -DdeployAtEnd=true"
cache:
 paths:
   - .m2/repository
compile:
 stage: build
 script:
   - 'mvn $MAVEN_CLI_OPTS test-compile'
 tags:
   - kubernetes
verify:
 stage: test
 script:
   - 'mvn $MAVEN_CLI_OPTS verify'
 artifacts:
   paths:
   - target/*.jar
 tags:
   - kubernetes
```

这个 CI 脚本文件很简单，只有 compile 和 verify 两步，而且是基于 maven:3.5-jdk-8 镜像运行，tags: - kubernetes 就是我刚新加的配置。提交并 Push 修改到 GitLab 仓库，将会自动触发可用并且匹配 tag 的 runner 执行（如果，没有自动触发，请到项目 Setting > CI/CD > General pipelines settings > Auto DevOps > 选择 Instance default (disabled) 选项，其他项按实际需求配置）。CI/CD 流程可以启动啦！不过很遗憾，第一步 compile 就失败了。

![image.png](assets/kubernetes与云原生/Kubernetes_集群中运行_GitLab-Runner_来执行_GitLab-CI/Kubernetes_集群中运行_GitLab-Runner_来执行_GitLab-CI-3.png)

  

看日志，显示 Clone 仓库时不能识别 my.gitlab.com host。好吧，还是避不开这个问题。不过，从日志，我们还可以得到几个明显的信息。

  

```plain
...
Using Kubernetes namespace: default
Using Kubernetes executor with image maven:3.5-jdk-8 ...
Waiting for pod default/runner-bb64a2fa-project-1-concurrent-0gwxbd to be running, status is Pending
Running on runner-bb64a2fa-project-1-concurrent-0gwxbd via gitlab-runner-3178994166-mz5pq...
...
```

首先，当 GitLab-Runner 注册时选择 kubernetes 类型没有指定 namespace 时，默认选择 default 作为命名空间。

其次，它使用了脚本指定的镜像 maven:3.5-jdk-8 来运行，如果脚本没指定，那么它会使用配置文件中的默认 image 来使用。

最后，我们会发现，真正运行 Job 脚本的不是 gitlab-runner Pod，而是它创建的新的临时 runner pod 来执行，执行完任务脚本后，临时 runner 会自动销毁，而 gitlab-runner 依旧存在，那我们就明白了，Kubernetes 集群中的 gitlab-runner 主要是完成注册、接受并分配任务的工作，充当一个中介者的作用。也正是因为这个设计，才能带来文章之前说的种种好处。

好了，言归正传，还是得看看那个问题。原因也很明显，之前配置的 ingress 是外部访问集群内部服务时指定的 host，容器内访问肯定是不认的，容器内服务可以通过 Cluster\_ip 进行访问或 DNS 访问。然而，这个 Cluster\_ip 只有 gitlab-ce 服务启动之后才能获取的到，它每次启动都是变化的，我们通过 Helm 安装 GitLab 时没法指定这个 Cluster\_ip，而且，临时 runner Pod 是由 gitlab-runner Pod 创建的，不受我们的控制，也没法给它绑定 host。当然，如果我们的 Gitlab 服务运行在 LoadBalancer 类型 Service 或者有真正的域名来绑定该服务时，上边的问题就迎刃而解了。

  

那么，在没有上述条件的情况下，我们就真的没法解决了吗？

  

\==========================这里是分界线==========================

  

我们可以，通过安装 GitLab 服务到非 Kubernetes 集群，比如本地、服务器、虚拟机等，只要是 Kubernetes 集群内 Pod 可以访问的到 GitLab 服务的地方都可以。

  

## 5、GitLab 服务安装在非 Kubernetes 集群测试

这里我在本地虚拟机上以 Docker 方式安装 GitLab 服务，安装命令很简单，安装完毕，外部和 Kubernetes 内部可以通过 [http://10.222.78.79/](http://10.222.78.79/) 地址访问的到。

```plain
$ sudo docker run --detach \
   --hostname 10.222.78.79 \
   --publish 443:443 --publish 80:80 --publish 22:22 \
   --name gitlab \
   --restart always \
   --volume /data0/gitlab/config:/etc/gitlab:Z \
   --volume /data0/gitlab/logs:/var/log/gitlab:Z \
   --volume /data0/gitlab/data:/var/opt/gitlab:Z \
   gitlab/gitlab-ce:10.6.2-ce.0
```

启动成功后，同样的操作，新建一个 spring-devops 项目，以及修改 .gitlab-ci.yml 文件。接下来，在 Kubernete 集群中 gitlab-runner 容器内走一波 register 操作，同样没问题哈！

```plain
root@gitlab-runner-3178994166-mz5pq:/etc/gitlab-runner# gitlab-runner register
Running in system-mode.
Please enter the gitlab-ci coordinator URL (e.g. https://gitlab.com/):
http://10.222.78.79/
Please enter the gitlab-ci token for this runner:
rJQEh4d-M_g-K2SLPLJw
Please enter the gitlab-ci description for this runner:
[gitlab-runner-3178994166-mz5pq]: kubernetes-runner
Please enter the gitlab-ci tags for this runner (comma separated):
kubernetes
Registering runner... succeeded                     runner=rJQEh4d-
Please enter the executor: kubernetes, docker, parallels, virtualbox, docker+machine, docker-ssh+machine, docker-ssh, shell, ssh:
kubernetes
Runner registered successfully. Feel free to start it, but if it's running already the config should be automatically reloaded!
```

  

注册成功，看下新 GitLab 中 Runner Setting 是否显示成功吧！

![image.png](assets/kubernetes与云原生/Kubernetes_集群中运行_GitLab-Runner_来执行_GitLab-CI/Kubernetes_集群中运行_GitLab-Runner_来执行_GitLab-CI-4.png)

  

提交修改到 GitLab 仓库，自动触发 CI 脚本任务，这次看下能不能过吧！![image.png](assets/kubernetes与云原生/Kubernetes_集群中运行_GitLab-Runner_来执行_GitLab-CI/Kubernetes_集群中运行_GitLab-Runner_来执行_GitLab-CI-5.png)

![image.png](assets/kubernetes与云原生/Kubernetes_集群中运行_GitLab-Runner_来执行_GitLab-CI/Kubernetes_集群中运行_GitLab-Runner_来执行_GitLab-CI-6.png)

![image.png](assets/kubernetes与云原生/Kubernetes_集群中运行_GitLab-Runner_来执行_GitLab-CI/Kubernetes_集群中运行_GitLab-Runner_来执行_GitLab-CI-7.png)

这次，终于不用担心 Clone 不到项目的问题啦！我们可以看到 build 和 test 两步都正常完成，整个流程可以跑通。

![image.png](assets/kubernetes与云原生/Kubernetes_集群中运行_GitLab-Runner_来执行_GitLab-CI/Kubernetes_集群中运行_GitLab-Runner_来执行_GitLab-CI-8.png)

这里，我要在提一下，上边第一步 build 和第二步 test，通过日志输出，我们可以看到 gitlab-runner 启动了两个临时 runner 来分别完成这两步任务。它的执行顺序是 gitlab-runner 创建临时 runner Pod 执行 build 任务，任务完成后该 Pod 自动销毁，然后，创建另一个临时 runner Pod 执行 test 任务，任务完成后该 Pod 自动销毁。通过日志中临时 runner 名称可以看到它们是不同的 Pod。

```plain
test：Running on runner-8804ad3f-project-1-concurrent-09hcq8 via gitlab-runner-3178994166-mz5pq
build：Running on runner-8804ad3f-project-1-concurrent-0vzrjw via gitlab-runner-3178994166-mz5pq
```

  

其实，通过 kubectl 命令也可以看到。

  

```plain
# test 任务执行时，创建临时 runner。
$ kubectl get pods
NAME
                                         READY     STATUS    RESTARTS   AGE
gitlab-runner-3178994166-mz5pq                1/1       Running   0          5h
runner-8804ad3f-project-1-concurrent-09hcq8   2/2       Running   0          21s
# test 任务执行完毕后，会发现临时 runner 已经自动销毁了。
$ kubectl get pods
NAME                             READY     STATUS    RESTARTS   AGE
gitlab-runner-3178994166-mz5pq   1/1       Running   0          5h
```

  

最后，附带说一下，日志开头处显示 WARNING: Namespace is empty, therefore assuming 'default'. 这个，是因为没有设置默认 namespace 导致的，我们可以通过到 gitlab-runner 容器内部修改 config.toml 文件。

```plain
# gitlab-runner 容器内执行
$ vim /etc/gitlab-runner/config.toml
concurrent = 2
check_interval = 0
[[runners]]
 name = "kubernetes-runner"
 url = "http://10.222.78.79/"
 token = "8804ad3fc5eaf0cc3fadf3f719f427"
 executor = "kubernetes"
 [runners.cache]
 [runners.kubernetes]
   host = ""
   bearer_token_overwrite_allowed = false
   image = "busybox"
   namespace = "default"
   namespace_overwrite_allowed = ""
   privileged = false
   service_account_overwrite_allowed = ""
   pod_annotations_overwrite_allowed = ""
   [runners.kubernetes.volumes]
```

namespace 处指定为 “default”，也可以是其他命名空间，如果指定其他命名空间，要提前创建好该 namespaces。

Image 处可以指定临时 runner 使用的基础镜像，当 .gitlab-ci.yml 中未指定镜像时，默认使用该镜像，例如我填写为 busybox。

[runners.kubernetes.volumes] 处可以指定挂载 host\_path、pvc、config-map、empty\_dir、secret 等几种 Kubernetes 挂载方式，

[runners.kubernetes.node\_selector] 处可以指定 key=value 方式，来将 runner 调度到匹配值的节点上。

其他参数说明可参考官网 Kubernetes executor 和 [runners.kubernetes] section of advanced configuration 文档。

参考资料

  

Install & Update GitLab Runner on macOS

Run GitLab Runner on a Kubernetes cluster

GitLab Runner Kubernetes executor

GitLab Runner [runners.kubernetes] section of advanced configuration

Install GitLab Docker images

————————————————

版权声明：本文为CSDN博主「哎\_小羊\_168」的原创文章，遵循CC 4.0 BY-SA版权协议，转载请附上原文出处链接及本声明。

原文链接：[https://blog.csdn.net/aixiaoyang168/java/article/details/81149264](https://blog.csdn.net/aixiaoyang168/java/article/details/81149264)