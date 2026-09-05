# jenkins与k8s连接

> 分类：CI/CD / 第8章：Jenkins工具链集成
> 原文：https://www.cuiliangblog.cn/detail/section/127230452
> 来源：崔亮的博客

---

# 安装kubernetes插件
在Jenkins的插件管理中安装Kubernetes插件

jenkins——>系统管理——>插件管理——>avaliable plugins

![](assets/04-CI-CD/6feca85e22ff109f2203.png)

# 本集群连接
## 创建sa账号
如果jenkins在k8s集群中部署，直接创建sa账号，并进行rbac授权即可,yaml文件参考前面文章。

## 创建cloud资源
然后在jenkins——>系统管理——>Clouds——>New cloud——>输入cloud name并勾选类型为kubernetes

![](assets/04-CI-CD/e88e7278b7605a434fe0.png)

点击kubernetes cloud details填写cloud详细信息

+ Kubernetes地址：在集群内部暴露的k8s service名称https://kubernetes.default.svc
+ Kubernetes命名空间：jenkins sa所属的名称空间cicd
+ Jenkins地址：jenkins svc的名称:8080端口http://jenkins.cicd.svc:8080

配置完成后点击连接测试，显示k8s集群版本，证明配置无误。

![](assets/04-CI-CD/7c0a5b66532a00381985.png)

# 跨集群连接
在某些情况下，jenkins部署在k8s集群外，通过二进制或者docker方式部署，如果想要连接k8s集群实现资源自动创建。或者当前jenkins部署在k8s集群A中，需要通过jenkins实现集群B资源的自动创建发布，使用此方式连接。

## 配置思路
jenkins要想连接并操作k8s集群，需要配置授权，请求k8s集群的kube apiserver的请求，可以和kubectl一样利用config文件用作请求的鉴权，默认在~/.kube/config下，也可以单独严格指定权限细节，生成一个jenkins专用的config文件。

在jenkins中能够识别的证书文件为PKCS#12 certificate，因此需要先将kubeconfig文件中的证书转换生成PKCS#12格式的pfx证书文件

## 生成证书
我们可以使用yq命令行工具解析yaml，并提取相关的内容，然后通过base 64解码，最后生成文件

安装yq工具，仓库地址：[https://github.com/mikefarah/yq](https://github.com/mikefarah/yq)

```bash
[root@k8s-master ~]# wget https://github.com/mikefarah/yq/releases/download/v4.34.1/yq_linux_amd64.tar.gz
[root@k8s-master ~]# tar -zxvf yq_linux_amd64.tar.gz 
[root@k8s-master ~]# mv yq_linux_amd64 /usr/bin/yq
[root@k8s-master ~]# yq --version
yq (https://github.com/mikefarah/yq/) version v4.34.1
[root@k8s-master ~]# mkdir -p /opt/jenkins-crt/
```

+ certificate-authority-data——>base 64解码——>ca.crt
+ client-certificate-data——>base 64解码——>client.crt
+ client-key-data——>base 64解码——>client.key

```bash
[root@k8s-master ~]# yq e '.clusters[0].cluster.certificate-authority-data' /root/.kube/config | base64 -d > /opt/jenkins-crt/ca.crt
[root@k8s-master ~]# yq e '.users[0].user.client-certificate-data' /root/.kube/config | base64 -d > /opt/jenkins-crt/client.crt
[root@k8s-master ~]# yq e '.users[0].user.client-key-data' /root/.kube/config | base64 -d > /opt/jenkins-crt/client.key
[root@k8s-master ~]# cd /opt/jenkins-crt/
[root@k8s-master jenkins-crt]# ls -la
总用量 12
drwxr-xr-x  2 root root   56 6月  10 20:54 .
drwxr-xr-x. 6 root root   65 6月  10 20:37 ..
-rw-r--r--  1 root root 1099 6月  10 20:53 ca.crt
-rw-r--r--  1 root root 1147 6月  10 20:53 client.crt
-rw-r--r--  1 root root 1675 6月  10 20:54 client.key
```

## 转换证书
通过openssl进行证书格式的转换，生成Client P12认证文件cert.pfx，输入两次密码并牢记密码。

```bash
[root@k8s-master jenkins-crt]# openssl pkcs12 -export -out cert.pfx -inkey client.key -in client.crt -certfile ca.crt
Enter Export Password:
Verifying - Enter Export Password: CHANGE_ME jenkins-crt]# ls -la
总用量 16
drwxr-xr-x  2 root root   72 6月  10 20:55 .
drwxr-xr-x. 6 root root   65 6月  10 20:37 ..
-rw-r--r--  1 root root 1099 6月  10 20:53 ca.crt
-rw-------  1 root root 3221 6月  10 20:55 cert.pfx
-rw-r--r--  1 root root 1147 6月  10 20:53 client.crt
-rw-r--r--  1 root root 1675 6月  10 20:54 client.key
```

## 导入证书
打开jenkins的web界面，系统管理——>Credentials——>添加全局凭据

凭据的类型选择Certificate，证书上传刚才生成的cert.pfx证书文件，输入通过openssl生成证书文件时输入的密码

![](assets/04-CI-CD/992269c3b3f39737c309.png)

## 配置远程k8s集群地址
jenkins——>系统管理——>Clouds——>New cloud——>输入cloud name并勾选类型为kubernetes

填写cloud详细信息

+ Kubernetes地址：/root/.kube/config文件中cluster部分中server的内容
+ Kubernetes命名空间：/root/.kube/config文件中cluster部分中name的内容
+ Jenkins地址：jenkins服务的地址
+ kubernetes服务证书key：ca.crt内容
+ 凭据：选择刚刚创建的Certificate凭据

![](assets/04-CI-CD/689105ebafce86ebb180.png)

配置完成后点击连接测试，显示k8s集群版本，证明配置无误。

# 动态slave介绍
## 为什么需要动态slave
目前大多公司都采用 Jenkins 集群来搭建符合需求的 CI/CD 流程，然而传统的 Jenkins Slave 一主多从方式会存在一些痛点，比如：

+ 主 Master 发生单点故障时，整个流程都不可用了
+ 每个 Slave 的配置环境不一样，来完成不同语言的编译打包等操作，但是这些差异化的配置导致管理起来非常不方便，维护起来也是比较费劲
+ 资源分配不均衡，有的 Slave 要运行的 job 出现排队等待，而有的 Slave 处于空闲状态
+ 资源有浪费，每台 Slave 可能是物理机或者虚拟机，当 Slave 处于空闲状态时，也不会完全释放掉资源。

正因为上面的这些种种痛点，我们渴望一种更高效更可靠的方式来完成这个 CI/CD 流程，而 Docker虚拟化[容器](https://cloud.tencent.com/product/tke?from_column=20065&from=20065)技术能很好的解决这个痛点，又特别是在 Kubernetes 集群环境下面能够更好来解决上面的问题，下图是基于 Kubernetes 搭建 Jenkins 集群的简单示意图：

![](assets/04-CI-CD/569b6fe9637cc9e8421d.png)

从图上可以看到 Jenkins Master 和 Jenkins Slave 以 Pod 形式运行在 Kubernetes 集群的 Node 上，Master 运行在其中一个节点，并且将其配置数据存储到一个 Volume 上去，Slave 运行在各个节点上，并且它不是一直处于运行状态，它会按照需求动态的创建并自动删除。 

这种方式的工作流程大致为：当 Jenkins Master 接受到 Build 请求时，会根据配置的 Label 动态创建一个运行在 Pod 中的 Jenkins Slave 并注册到 Master 上，当运行完 Job 后，这个 Slave 会被注销并且这个 Pod 也会自动删除，恢复到最初状态。

## Jenkins Slave好处
+ 服务高可用，当 Jenkins Master 出现故障时，Kubernetes 会自动创建一个新的 Jenkins Master 容器，并且将 Volume 分配给新创建的容器，保证数据不丢失，从而达到集群服务高可用(这是k8s带来的资源控制器带来的优势)
+ 动态伸缩，合理使用资源，每次运行 Job 时，会自动创建一个 Jenkins Slave，Job 完成后，Slave 自动注销并删除容器，资源自动释放，而且 Kubernetes 会根据每个资源的使用情况，动态分配 Slave 到空闲的节点上创建，降低出现因某节点资源利用率高，还排队等待在该节点的情况。
+ 扩展性好，当 Kubernetes 集群的资源严重不足而导致 Job 排队等待时，可以很容易的添加一个 Kubernetes Node 到集群中，从而实现扩展。

# <font style="color:rgb(51, 51, 51);">动态slave配置</font>
## 制作slave镜像
slave镜像应该包含以下功能：

+ 运行jenkins-agent服务
+ 使用kubectl命令操作k8s集群
+ 使用nerdctl工具管理container镜像
+ 使用buildctl构建container镜像。

获取文件

```bash
# 获取kubectl
[root@tiaoban jenkins]# cp /usr/bin/kubectl .
# 获取nerdctl
[root@tiaoban jenkins]# cp /usr/bin/nerdctl .
# 获取buildctl
[root@tiaoban jenkins]# cp /usr/local/bin/buildctl .
[root@tiaoban jenkins]# ls
buildctl kubectl nerdctl
```

构建镜像

在构建镜像过程中基于inbound-agent镜像，因为其中已经包含了jenkins-agent服务相关组件，再添加kubectl工具用于操作k8s，nerdctl和buildctl工具用于构建和管理container镜像。

```yaml
[root@tiaoban jenkins]# cat Dockerfile 
FROM jenkins/inbound-agent:latest-jdk17
USER root
COPY kubectl /usr/bin/kubectl
COPY nerdctl /usr/bin/nerdctl
COPY buildctl /usr/bin/buildctl
[root@tiaoban jenkins]# docker build -t jenkins-agent:v1 . 
```

## 创建kube-config资源
为了能让<font style="color:rgb(51, 51, 51);">slave容器中能够使用 kubectl 工具来访问我们的 Kubernetes 集群，需要将其添加为secret资源，并挂载到pod中。</font>

```bash
[root@tiaoban jenkins]# kubectl create secret generic -n cicd kube-config --from-file=/root/.kube/config
```

## 节点开启buildkit服务(可选)
container容器运行时仅能运行容器，如果需要在CICD阶段构建镜像，则需要在执行构建镜像的节点手动安装buildkit服务并启用，具体步骤可参考文档：[../06_Kubernetes/02-06_Containerd%E8%BF%9B%E9%98%B6%E4%BD%BF%E7%94%A8.md](articles/06-Kubernetes/02-06_Containerd进阶使用.md)。

也可以在slave pod中新增一个container，运行buildkit服务。

## <font style="color:rgb(0, 0, 0);">配置Pod Template(可选)</font>
配置 Pod Template，就是配置 Jenkins Slave 运行的 Pod 模板，命名空间我们同样是用cicd，Labels设置为jenkins-slave，对于后面执行 Job 的时候需要用到该值，容器名称填写jnlp，这样可以替换默认的agent容器。镜像使用的是刚刚我们制作的slave镜像，加入了 kubectl 等一些实用的工具。

运行命令和命令参数为空。

![](assets/04-CI-CD/4c84f3be0215818f096f.png)

另外需要注意我们这里需要在下面挂载三个目录

`/run/containerd/containerd.sock`：该文件是用于 Pod 中的容器能够共享[宿主机](https://cloud.tencent.com/product/cdh?from_column=20065&from=20065)的Container，用于管理container镜像。

`/root/.kube`：将之前创建的kube-config资源挂载到容器的/root/.kube目录下，这样能够在 Pod 的容器中能够使用 kubectl 工具来访问我们的 Kubernetes 集群，方便我们后面在 Slave Pod 部署 Kubernetes 应用

`/run/buildkit`：该文件是用于 Pod 中的容器能够共享buildkit进程，用于构建container镜像。

![](assets/04-CI-CD/7f1a54e906f477b06889.png)

同时指定Service Accoun为之前创建的jenkins

![](assets/04-CI-CD/73468531501fec0a1dd2.png)

除了在页面配置pod Template外，我们也可以通过pipeline配置。

# <font style="color:rgb(0, 0, 0);">测试</font>
Kubernetes 插件的配置工作完成了，接下来我们就来添加一个 Job 任务，看是否能够在 Slave Pod 中执行，任务执行完成后看 Pod 是否会被销毁。

## 自由流水线测试
创建自由流水线任务，勾选限制项目的运行节点，标签表达式填写我们配置的 Slave Pod 中的 Label，这两个地方必须保持一致。

![](assets/04-CI-CD/314d47caa6d8e60dc8e7.png)

然后往下拉，在 Build 区域选择Execute shell

![](assets/04-CI-CD/74ada3bb74c8cd81596b.png)

然后输入我们测试命令

```bash
echo "测试获取Kubernetes信息"
kubectl get node
echo "测试获取container信息"
nerdctl ns ls
echo "测试buildkitd构建镜像"
echo "FROM busybox" > Dockerfile
echo 'CMD ["echo","hello","container"]' >> Dockerfile
nerdctl build -t buildkitd-test:v1 .
nerdctl images | grep buildkitd-test
```

现在我们直接在页面点击做成的 Build now 触发构建即可，然后观察 Kubernetes 集群中 Pod 的变化 

```bash
[root@tiaoban jenkins]# kubectl get pod -n cicd
NAME                       READY   STATUS    RESTARTS   AGE
buildkit-4bhpm             1/1     Running   0          25m
buildkit-4ddks             1/1     Running   0          25m
buildkit-6mlqc             1/1     Running   0          25m
buildkit-6vlw6             1/1     Running   0          25m
buildkit-msmx5             1/1     Running   0          25m
buildkit-v4dnd             1/1     Running   0          25m
jenkins-59dfbb6854-dx42n   1/1     Running   0          148m
jenkins-agent-3p4j2        1/1     Running   0          6s
```

我们可以看到在我们点击立刻构建的时候可以看到一个新的 Pod：jenkins-agent-3p4j2被创建了，这就是我们的 Jenkins Slave。任务执行完成后我们<font style="color:rgb(51, 51, 51);">可以查看到对应的控制台信息： </font>

![](assets/04-CI-CD/87bc5b3c9d24c2180fe4.png)

到这里证明我们的任务已经构建完成，然后这个时候我们再去集群查看我们的 Pod 列表，发现cicd这个 namespace 下面已经没有之前的 Slave 这个 Pod 了。

```javascript
[root@tiaoban jenkins]# kubectl get pod -n cicd
NAME                       READY   STATUS    RESTARTS   AGE
buildkit-4bhpm             1/1     Running   0          26m
buildkit-4ddks             1/1     Running   0          26m
buildkit-6mlqc             1/1     Running   0          26m
buildkit-6vlw6             1/1     Running   0          26m
buildkit-msmx5             1/1     Running   0          26m
buildkit-v4dnd             1/1     Running   0          26m
jenkins-59dfbb6854-dx42n   1/1     Running   0          149m
```

到这里我们就完成了使用 Kubernetes 动态生成 Jenkins Slave 的方法

## pipeline-使用pod Template
在流水线中指定pipeline脚本

![](assets/04-CI-CD/eea0a455c7ee45c9fc6e.png)

pipeline脚本如下：

```groovy
podTemplate(label: 'jenkins-slave', inheritFrom: 'jenkins-agent', cloud: 'k8s-local'){
    node('jenkins-slave') {
        stage('测试获取Kubernetes信息') {
            sh 'kubectl get node'
        }
        stage('测试获取container信息') {
            sh 'nerdctl ns ls'
        }
        stage('测试buildkitd构建镜像'){
            sh '''echo "FROM busybox" > Dockerfile
            echo \'CMD ["echo","hello","container"]\' >> Dockerfile
            nerdctl build -t buildkitd-test:v2 .
            nerdctl images | grep buildkitd-test'''
        }
    }
}
```

点击立即构建，查看控制台输出。

![](assets/04-CI-CD/772aabe79c6675d939d3.png)

## pipeline-自定义pod Template
```groovy
//创建一个Pod的模板，label为jenkins-agent
podTemplate(label: 'jenkins-agent', cloud: 'k8s-local', containers: [
    containerTemplate(
        name: 'jnlp',
        image: "harbor.local.com/cicd/jenkins-agent:v3",
        workingDir: '/home/jenkins/agent'
    ),
    containerTemplate(
        name: 'buildkitd',
        image: "harbor.local.com/cicd/buildkit:v0.13.2",
        privileged: true
    )],
    volumes:[
        hostPathVolume(mountPath: '/run/containerd/containerd.sock', hostPath:'/run/containerd/containerd.sock'),
        secretVolume(mountPath: '/root/.kube/', secretName: 'kube-config', defaultMode: '420'),
        hostPathVolume(mountPath: '/run/buildkit',hostPath: '/run/buildkit')
    ]
   )
// 使用上文创建的pod模板
{
    node('jenkins-agent'){
        stage('测试获取Kubernetes信息') {
            sh 'kubectl get node'
        }
        stage('测试获取container信息') {
            sh 'nerdctl ns ls'
        }
        stage('测试buildkitd构建镜像'){
            sh '''echo "FROM busybox" > Dockerfile
              echo 'CMD ["echo","hello","container"]' >> Dockerfile
              nerdctl build -t buildkitd-test:v2 .
              nerdctl images | grep buildkitd-test'''
        }
    }
}
```

运行结果与上文一致。


