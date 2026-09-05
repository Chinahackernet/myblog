# Jenkins+k8s项目实战

> 分类：CI/CD / 第9章：Jenkins CICD项目实战
> 原文：https://www.cuiliangblog.cn/detail/section/166584265
> 来源：崔亮的博客

---

# Jenkins动态slave介绍
## 为什么需要动态slave
1. **配置管理困难：**不同项目可能使用不同的编程语言、框架或库，这导致了每个Slave的配置环境各不相同。因此，需要动态Slave能够根据不同的项目需求，灵活配置不同的运行环境，从而简化配置管理和维护工作。
2. **资源分配不均衡：**在使用静态Slave时，可能会出现某些Slave处于空闲状态，而其他Slave却处于繁忙状态，导致资源分配不均衡。动态Slave可以根据当前任务的需求自动调配资源，使得任务能够在空闲的Slave上尽快执行，从而提高资源利用率和任务执行效率。
3. **资源浪费：**静态Slave在没有任务执行时仍然占用着资源，这导致了资源的浪费。而动态Slave能够根据实际需要自动扩容或缩减，当没有任务执行时会释放资源，从而避免了资源的浪费。

## 动态slave工作流程
正因为上面的这些种种痛点，我们渴望一种更高效更可靠的方式来完成这个 CI/CD 流程，而 Docker虚拟化容器技术能很好的解决这个痛点，又特别是在 Kubernetes 集群环境下面能够更好来解决上面的问题，下图是基于 Kubernetes 搭建 Jenkins 集群的简单示意图：

![](assets/04-CI-CD/569b6fe9637cc9e8421d.png)

从图上可以看到 Jenkins Master 和 Jenkins Slave 以 Pod 形式运行在 Kubernetes 集群的 Node 上，Master 运行在其中一个节点，并且将其配置数据存储到一个 Volume 上去，Slave 运行在各个节点上，并且它不是一直处于运行状态，它会按照需求动态的创建并自动删除。 

这种方式的工作流程大致为：当 Jenkins Master 接受到 Build 请求时，会根据配置的 Label 动态创建一个运行在 Pod 中的 Jenkins Slave 并注册到 Master 上，当运行完 Job 后，这个 Slave 会被注销并且这个 Pod 也会自动删除，恢复到最初状态。

# 服务部署
本项目所有服务均运行在k8s集群上，使用nfs共享存储，具体部署配置过程可参考下文，此处不再赘述。

## k8s部署
参考文档：[../06_Kubernetes/16-01_kubeadm%E9%AB%98%E5%8F%AF%E7%94%A8%E9%83%A8%E7%BD%B2.md](articles/06-Kubernetes/16-01_kubeadm高可用部署.md)

## nfs共享存储部署
参考文档：[../06_Kubernetes/03-09_%E9%83%A8%E7%BD%B2NFS%E5%85%B1%E4%BA%AB%E6%96%87%E4%BB%B6%E5%AD%98%E5%82%A8.md](articles/06-Kubernetes/03-09_部署NFS共享文件存储.md)

## container部署
参考文档：[../06_Kubernetes/02-05_%E5%AE%89%E8%A3%85%E5%AE%B9%E5%99%A8%E8%BF%90%E8%A1%8C%E6%97%B6%28Containerd%29.md](articles/06-Kubernetes/02-05_安装容器运行时-Containerd-.md)

## harbor部署
参考文档：[../06_Kubernetes/03-01_%E9%83%A8%E7%BD%B2Harbor%E7%A7%81%E6%9C%89%E9%95%9C%E5%83%8F%E4%BB%93%E5%BA%93.md](articles/06-Kubernetes/03-01_部署Harbor私有镜像仓库.md)

## gitlab部署
参考文档：[10-03_gitlab%E9%83%A8%E7%BD%B2%28k8s%29.md](articles/04-CI-CD/10-03_gitlab部署-k8s-.md)

## jenkins部署
参考文档：[05-03_jenkins%E9%83%A8%E7%BD%B2%28k8s%29.md](articles/04-CI-CD/05-03_jenkins部署-k8s-.md)

## SonarQube部署
参考文档：[02-04_SonarQube%E9%83%A8%E7%BD%B2%28k8s%29.md](articles/04-CI-CD/02-04_SonarQube部署-k8s-.md)

# 项目与权限配置
## Harbor配置
**创建项目**

Harbor的项目分为公开和私有的:  
公开项目:所有用户都可以访问，通常存放公共的镜像，默认有一个library公开项目。  
私有项目:只有授权用户才可以访问，通常存放项目本身的镜像。 我们可以为微服务项目创建一个新的项目  
![](assets/04-CI-CD/3869a537676fea48a432.png)

**创建用户**

创建一个普通用户cuiliang。  
![](assets/04-CI-CD/60ece9d8bd8012d3934e.png)

**配置项目用户权限**

在spring_boot_demo项目中添加普通用户cuiliang，并设置角色为开发者。  
![](assets/04-CI-CD/2a55dadfe9b2c3aadaf0.png)  
权限说明

| 角色 | 权限 |
| --- | --- |
| 访客 | 对项目有只读权限 |
| 开发人员 | 对项目有读写权限 |
| 维护人员 | 对项目有读写权限、创建webhook权限 |
| 项目管理员 | 出上述外，还有用户管理等权限 |


**上传下载镜像测试**

可参考文章[../06_Kubernetes/03-01_%E9%83%A8%E7%BD%B2Harbor%E7%A7%81%E6%9C%89%E9%95%9C%E5%83%8F%E4%BB%93%E5%BA%93.md](articles/06-Kubernetes/03-01_部署Harbor私有镜像仓库.md)，此处不再赘述。

## gitlab项目权限配置
具体gitlab权限配置参考文档：[11-02_gitlab%E6%9D%83%E9%99%90.md](articles/04-CI-CD/11-02_gitlab权限.md)  
创建开发组develop，用户cuiliang，项目springboot demo

**创建组**

管理员用户登录，创建群组，组名称为develop，组权限为私有  
![](assets/04-CI-CD/30f155b843c2c868bed4.png)

**创建项目**

创建sprint boot demo项目，并指定develop，项目类型为私有  
![](assets/04-CI-CD/39c32f3e3f24de814862.png)

**创建用户**

创建一个普通用户cuiliang  
![](assets/04-CI-CD/f56f3d7a797e7c16bed5.png)

**用户添加到组中**

将cuiliang添加到群组develop中，cuiliang角色为Developer  
![](assets/04-CI-CD/907cb25952baccc97a3b.png)

**配置分支权限**

![](assets/04-CI-CD/cf5b42f52aa2d13f4af5.png)

**用户权限验证**

使用任意一台机器模拟开发人员拉取代码，完成开发后推送至代码仓库。  
拉取仓库代码

```bash
[root@tiaoban opt]# git clone https://gitee.com/cuiliang0302/sprint_boot_demo.git
正克隆到 'sprint_boot_demo'...
remote: Enumerating objects: 69, done.
remote: Counting objects: 100% (69/69), done.
remote: Compressing objects: 100% (54/54), done.
remote: Total 69 (delta 15), reused 0 (delta 0), pack-reused 0
接收对象中: 100% (69/69), 73.15 KiB | 1.49 MiB/s, 完成.
处理 delta 中: 100% (15/15), 完成.
[root@tiaoban opt]# cd sprint_boot_demo/
[root@tiaoban sprint_boot_demo]# ls
email.html  Jenkinsfile  LICENSE  mvnw  mvnw.cmd  pom.xml  readme.md  sonar-project.properties  src  test
```

推送至gitlab仓库

```bash
# 修改远程仓库地址
[root@tiaoban sprint_boot_demo]# git remote set-url origin http://gitlab.local.com/develop/sprint_boot_demo.git
[root@tiaoban sprint_boot_demo]# git remote -v
origin  http://gitlab.local.com/develop/sprint_boot_demo.git (fetch)
origin  http://gitlab.local.com/develop/sprint_boot_demo.git (push)
# 推送代码至gitlab
[root@tiaoban sprint_boot_demo]# git push --set-upstream origin --all
Username for 'http://gitlab.local.com': cuiliang
Password for 'http://cuiliang@gitlab.local.com': 
枚举对象中: 55, 完成.
对象计数中: 100% (55/55), 完成.
使用 4 个线程进行压缩
压缩对象中: 100% (34/34), 完成.
写入对象中: 100% (55/55), 71.51 KiB | 71.51 MiB/s, 完成.
总共 55（差异 10），复用 52（差异 9），包复用 0
To http://gitlab.local.com/develop/sprint-boot-demo.git
 * [new branch]      main -> main
分支 'main' 设置为跟踪 'origin/main'。
```

查看验证

![](assets/04-CI-CD/ce2b564296704fbc6fae.png)

# jenkins配置
## 插件安装与配置
GitLab插件安装与配置：[08-01_jenkins%E4%B8%8Egitlab%E8%BF%9E%E6%8E%A5.md](articles/04-CI-CD/08-01_jenkins与gitlab连接.md)

SonarQube Scanner插件安装与配置：[08-04_jenkins%E4%B8%8ESonarQube%E8%BF%9E%E6%8E%A5.md](articles/04-CI-CD/08-04_jenkins与SonarQube连接.md)

Kubernetes插件安装与配置：[08-03_jenkins%E4%B8%8Ek8s%E8%BF%9E%E6%8E%A5.md](articles/04-CI-CD/08-03_jenkins与k8s连接.md)

Email Extension邮件推送插件安装与配置：[07-07_jenkins%E9%82%AE%E4%BB%B6%E9%80%9A%E7%9F%A5%E9%85%8D%E7%BD%AE.md](articles/04-CI-CD/07-07_jenkins邮件通知配置.md)

<font style="color:rgb(0, 12, 26);">Version Number</font>版本号插件安装与配置：[https://plugins.jenkins.io/versionnumber/](https://plugins.jenkins.io/versionnumber/)

<font style="color:rgb(0, 12, 26);">Content Replace</font>文件内容替换插件安装与配置：[https://plugins.jenkins.io/content-replace/](https://plugins.jenkins.io/content-replace/)

## jenkins slave镜像制作
安装完Kubernetes插件后，默认的slave镜像仅包含一些基础功能和软件包，如果需要构建镜像，执行kubectl命令，则需要引入其他container或者自定义slave镜像。

关于镜像构建问题，如果k8s容器运行时为docker，可以直接使用docker in docker方案，启动一个docker:dind容器，通过Docker pipeline插件执行镜像构建与推送操作，具体内容可参考[08-06_Jenkins%E4%B8%8EHarbor%E8%BF%9E%E6%8E%A5.md](articles/04-CI-CD/08-06_Jenkins与Harbor连接.md)。

如果k8s容器运行时为container，则使用nerdctl+buildkitd方案，启动一个buildkit容器，通过nerdctl命令执行镜像构建与推送操作，具体内容可参考

[../06_Kubernetes/02-06_Containerd%E8%BF%9B%E9%98%B6%E4%BD%BF%E7%94%A8.md](articles/06-Kubernetes/02-06_Containerd进阶使用.md)。

本次实验以container环境为例，通过nerdctl+buildkitd方案演示如何构建并推送镜像。

**构建jenkins-slave镜像**

```bash
[root@tiaoban jenkins]# cat Dockerfile 
FROM jenkins/inbound-agent:latest-jdk17
USER root
COPY kubectl /usr/bin/kubectl
COPY nerdctl /usr/bin/nerdctl
COPY buildctl /usr/bin/buildctl
[root@tiaoban jenkins]# 
[root@tiaoban jenkins]# docker build -t harbor.local.com/cicd/jenkins-slave:v1.0 .
```

**测试jenkins-slave镜像构建容器与操作k8s**

以下操作在k8s集群master机器，容器运行时为container节点执行测试

```bash
# 启动buildkit镜像构建服务
# 挂载/run/containerd/containerd.sock方便container调用buildkitd
# 挂载/var/lib/buildkit，以便于将构建过程中下载的镜像持久化存储，方便下次构建时使用缓存
# 挂载/run/buildkit/目录方便nerctl调用buildkitd
[root@master3 ~]# nerdctl run --name buildkit -d --privileged=true \
-v /run/buildkit/:/run/buildkit/ \
-v /var/lib/buildkit:/var/lib/buildkit \
-v /run/containerd/containerd.sock:/run/containerd/containerd.sock \
moby/buildkit:v0.13.2
[root@master3 ~]# nerdctl ps
CONTAINER ID    IMAGE                    COMMAND        CREATED          STATUS    PORTS    NAMES
a8de5299dd84    moby/buildkit:v0.13.2    "buildkitd"    4 seconds ago    Up                 buildkit
# 启动jenkins-slave容器
# 挂载/run/containerd/containerd.sock方便netdctl操作container
# 挂载/run/buildkit/目录方便nerctl调用buildkitd构建镜像
# 挂载/root/.kube/目录方便kubectl工具操作k8s
[root@master3 ~]# nerdctl run --name jenkins-slave -it --privileged=true \
-v /run/buildkit/:/run/buildkit/ \
-v /root/.kube/:/root/.kube/ \
-v /run/containerd/containerd.sock:/run/containerd/containerd.sock \
harbor.local.com/cicd/jenkins-slave:v1.0 bash
# 测试container管理
root@28dcd3a667c9:/home/jenkins# nerdctl ps
CONTAINER ID    IMAGE                                       COMMAND                   CREATED           STATUS    PORTS    NAMES
28dcd3a667c9    harbor.local.com/cicd/jenkins-slave:v1.0    "/usr/local/bin/jenk…"    11 seconds ago    Up                 jenkins-slave
a8de5299dd84    harbor.local.com/cicd/buildkit:v0.13.2      "buildkitd"               11 minutes ago    Up                 buildkit
# 测试k8s管理
root@28dcd3a667c9:/home/jenkins# kubectl get node
NAME      STATUS   ROLES           AGE    VERSION
master1   Ready    control-plane   241d   v1.27.6
master2   Ready    control-plane   241d   v1.27.6
master3   Ready    control-plane   241d   v1.27.6
work1     Ready    <none>          241d   v1.27.6
work2     Ready    <none>          241d   v1.27.6
work3     Ready    <none>          241d   v1.27.6
# 测试镜像构建
root@28dcd3a667c9:/home/jenkins# echo 'FROM busybox' >> Dockerfile
root@28dcd3a667c9:/home/jenkins# echo 'CMD ["echo","hello","container"]' >> Dockerfile
root@28dcd3a667c9:/home/jenkins# cat Dockerfile 
FROM busybox
CMD ["echo","hello","container"]
root@28dcd3a667c9:/home/jenkins# nerdctl build -t test:v1 .
root@28dcd3a667c9:/home/jenkins# nerdctl images
REPOSITORY                             TAG        IMAGE ID        CREATED           PLATFORM       SIZE         BLOB SIZE
test                                   v1         4943762c7956    7 seconds ago     linux/amd64    4.1 MiB      2.1 MiB
harbor.local.com/cicd/buildkit         v0.13.2    c3cb08891c15    15 minutes ago    linux/amd64    190.3 MiB    87.2 MiB
harbor.local.com/cicd/jenkins-slave    v1.0       1d5c5b1572bc    6 minutes ago     linux/amd64    384.7 MiB    169.8 MiB
```

## job任务创建与配置
配置webhook构建触发器，当分支代码提交时触发构建，具体配置如下：

![](assets/04-CI-CD/2a0f44ca6c924c588361.png)

流水线选择SCM从代码仓库中获取jenkinsfile，脚本路径填写Jenkinsfile-k8s.groov

![](assets/04-CI-CD/51e0c284fecc993460d1.png)

# 效果演示
## 开发测试阶段
模拟开发人员完成功能开发后提交代码至test分支

```bash
[root@tiaoban sprint_boot_demo]# git checkout -b test  origin/test
分支 'test' 设置为跟踪 'origin/test'。
切换到一个新分支 'test'
[root@tiaoban sprint_boot_demo]# git branch -a
  master
* test
  remotes/origin/HEAD -> origin/master
  remotes/origin/master
  remotes/origin/test
# 修改SpringBoot首页内容为Version:v2
[root@tiaoban sprint_boot_demo]# cat src/main/java/com/example/springbootdemo/HelloWorldController.java
package com.example.springbootdemo;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;

@Controller
public class HelloWorldController {
    @RequestMapping("/")
    @ResponseBody
    public String hello() {
        return "<h1>Hello SpringBoot</h1><p>Version:v2 Env:test</p>";
    }
    @RequestMapping("/health")
    @ResponseBody
    public String healthy() {
        return "ok";
    }
}
[root@tiaoban sprint_boot_demo]# git add .
[root@tiaoban sprint_boot_demo]# git commit -m "test环境更新版本至v2"
[test 68fb576] test环境更新版本至v2
 1 file changed, 1 insertion(+), 1 deletion(-)
[root@tiaoban sprint_boot_demo]# git push 
枚举对象中: 17, 完成.
对象计数中: 100% (17/17), 完成.
使用 4 个线程进行压缩
压缩对象中: 100% (6/6), 完成.
写入对象中: 100% (9/9), 707 字节 | 707.00 KiB/s, 完成.
总共 9（差异 2），复用 0（差异 0），包复用 0
remote: 
remote: To create a merge request for test, visit:
remote:   http://gitlab.local.com/develop/sprint_boot_demo/-/merge_requests/new?merge_request%5Bsource_branch%5D=test
remote: 
To http://gitlab.local.com/develop/sprint_boot_demo.git
   86a166a..68fb576  test -> test
```

此时查看cicd名称空间下的pod信息，发现已经创建一个名为springbootdemo-275-rf832-h6jkq-630x8的pod，包含3个container，分别是jnlp、maven、buildkitd。

```bash
[root@tiaoban ~]# kubectl get pod -n cicd
NAME                                   READY   STATUS    RESTARTS        AGE
gitlab-5997c5cdcd-2rvgz                1/1     Running   14 (100m ago)   15d
jenkins-6df7d6479b-v25rt               1/1     Running   9 (100m ago)    5d13h
sonarqube-postgresql-0                 1/1     Running   14 (100m ago)   15d
sonarqube-sonarqube-0                  1/1     Running   14 (100m ago)   15d
springbootdemo-275-rf832-h6jkq-630x8   3/3     Running   0               65s
```

查看jenkins任务信息，已顺利完成了集成部署工作。

![](assets/04-CI-CD/7b119e312a32a1093b96.png)

并且收到了jenkins自动发出的邮件，内容如下：

![](assets/04-CI-CD/0f56cf37aba9e80ea3d6.png)

查看SonarQube代码扫描信息，未发现异常代码。

![](assets/04-CI-CD/b9f89ec9b47abf22c879.png)

查看k8s，已成功创建相关资源。

```bash
[root@tiaoban sprint_boot_demo]# kubectl get all -n test
NAME                        READY   STATUS    RESTARTS   AGE
pod/demo-5d44f794d9-s7jw2   1/1     Running   0          7m38s

NAME           TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)    AGE
service/demo   ClusterIP   10.111.167.204   <none>        8888/TCP   4d3h

NAME                   READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/demo   1/1     1            1           4d3h

NAME                              DESIRED   CURRENT   READY   AGE
replicaset.apps/demo-5d44f794d9   1         1         1       7m38s
```

此时模拟测试人员，访问测试环境域名

![](assets/04-CI-CD/b0c178ea0bf5cfbd3687.png)

至此，开发测试阶段演示完成。

## 生产发布阶段
接下来演示master分支代码提交后，触发生产环境版本发布流程。

```bash
[root@tiaoban sprint_boot_demo]# git branch -a
  master
* test
  remotes/origin/HEAD -> origin/master
  remotes/origin/master
  remotes/origin/test
[root@tiaoban sprint_boot_demo]# git checkout master
切换到分支 'master'
您的分支与上游分支 'origin/master' 一致。
[root@tiaoban sprint_boot_demo]# vim src/main/java/com/example/springbootdemo/HelloWorldController.java
[root@tiaoban sprint_boot_demo]# cat src/main/java/com/example/springbootdemo/HelloWorldController.java
package com.example.springbootdemo;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;

@Controller
public class HelloWorldController {
    @RequestMapping("/")
    @ResponseBody
    public String hello() {
        return "<h1>Hello SpringBoot</h1><p>Version:v2 Env:prod</p>";
    }
    @RequestMapping("/health")
    @ResponseBody
    public String healthy() {
        return "ok";
    }
}
[root@tiaoban sprint_boot_demo]# git add .
[root@tiaoban sprint_boot_demo]# git commit -m "生产环境更新版本至v2"
[master 889fc5c] 生产环境更新版本至v2
 1 file changed, 1 insertion(+), 1 deletion(-)
[root@tiaoban sprint_boot_demo]# git push
枚举对象中: 17, 完成.
对象计数中: 100% (17/17), 完成.
使用 4 个线程进行压缩
压缩对象中: 100% (6/6), 完成.
写入对象中: 100% (9/9), 719 字节 | 719.00 KiB/s, 完成.
总共 9（差异 2），复用 0（差异 0），包复用 0
To http://gitlab.local.com/develop/sprint_boot_demo.git
   600a1b6..889fc5c  master -> master
```

待收到邮件通知后，查看k8s资源，已经在prod名称空间下创建相关资源

```bash
[root@tiaoban sprint_boot_demo]# kubectl get all -n prod
NAME                        READY   STATUS    RESTARTS   AGE
pod/demo-7c57975bd8-7nmnx   1/1     Running   0          41s

NAME           TYPE        CLUSTER-IP    EXTERNAL-IP   PORT(S)    AGE
service/demo   ClusterIP   10.97.0.219   <none>        8888/TCP   41s

NAME                   READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/demo   1/1     1            1           41s

NAME                              DESIRED   CURRENT   READY   AGE
replicaset.apps/demo-7c57975bd8   1         1         1       41s
```

此时访问生产环境域名，服务可以正常访问。

![](assets/04-CI-CD/ada30e85616ec49caa5e.png)

此时查看Harbor仓库镜像信息，其中p开头的为生产环境镜像，t开头的为测试环境镜像。

![](assets/04-CI-CD/9f4e1af5e15e49389c72.png)

## jenkinsfile
完整的jenkinsfile如下所示，由于每个项目使用的开发语言和版本各不相同，因此建议将jenkinsfile存储在代码仓库随项目一同管理，使用yaml格式可以最大程度的定制slave容器。

```bash
pipeline {
    agent {
        kubernetes {
            // 定义要在 Kubernetes 中运行的 Pod 模板
            yaml '''
apiVersion: v1
kind: Pod
metadata:
  labels:
    app: jenkins-slave
spec:
  containers:
  - name: jnlp
    image: harbor.local.com/cicd/jenkins-slave:v1.0
    resources:
      limits:
        memory: "512Mi"
        cpu: "500m"
    securityContext:
      privileged: true
    volumeMounts:
    - name: buildkit
      mountPath: "/run/buildkit/"
    - name: containerd
      mountPath: "/run/containerd/containerd.sock"
    - name: kube-config
      mountPath: "/root/.kube/"
      readOnly: true
  - name: maven
    image: harbor.local.com/cicd/maven:3.9.3
    resources:
      limits:
        memory: "512Mi"
        cpu: "500m"
    command:
      - 'sleep'
    args:
      - '9999'
    volumeMounts:
      - name: maven-data
        mountPath: "/root/.m2"
  - name: buildkitd
    image: harbor.local.com/cicd/buildkit:v0.13.2
    resources:
      limits:
        memory: "256Mi"
        cpu: "500m"
    securityContext:
      privileged: true
    volumeMounts:
    - name: buildkit
      mountPath: "/run/buildkit/"
    - name: buildkit-data
      mountPath: "/var/lib/buildkit/"
    - name: containerd
      mountPath: "/run/containerd/containerd.sock"
  volumes:
  - name: maven-data
    persistentVolumeClaim:
      claimName: jenkins-maven
  - name: buildkit
    hostPath:
      path: /run/buildkit/
  - name: buildkit-data
    hostPath:
      path: /var/lib/buildkit/
  - name: containerd
    hostPath:
      path: /run/containerd/containerd.sock
  - name: kube-config
    secret:
      secretName: kube-config
            '''
      retries 2
        }
    }
    environment {
        // 全局变量
        HARBOR_CRED = "harbor-cuiliang-password"
        IMAGE_NAME = ""
        IMAGE_APP = "demo"
        branchName = ""
    }
    stages {
        stage('拉取代码') {
            environment {
                // gitlab仓库信息
                GITLAB_CRED = "gitlab-cuiliang-password"
                GITLAB_URL = "http://gitlab.cicd.svc/develop/sprint_boot_demo.git"
            }
            steps {
                echo '开始拉取代码'
                checkout scmGit(branches: [[name: '*/*']], extensions: [], userRemoteConfigs: [[credentialsId: "${GITLAB_CRED}", url: "${GITLAB_URL}"]])
                // 获取当前拉取的分支名称
                script {
                    def branch = env.GIT_BRANCH ?: 'master'
                    branchName = branch.split('/')[-1]
                }
                echo '拉取代码完成'
            }
        }
        stage('编译打包') {
            steps {
                container('maven') {
                    // 指定使用maven container进行打包
                    echo '开始编译打包'
                    sh 'mvn clean package'
                    echo '编译打包完成'
                }
            }
        }
        stage('代码审查') {
            environment {
                // SonarQube信息
                SONARQUBE_SCANNER = "SonarQubeScanner"
                SONARQUBE_SERVER = "SonarQubeServer"
            }
            steps {
                echo '开始代码审查'
                script {
                    def scannerHome = tool "${SONARQUBE_SCANNER}"
                    withSonarQubeEnv("${SONARQUBE_SERVER}") {
                        sh "${scannerHome}/bin/sonar-scanner"
                    }
                }
                echo '代码审查完成'
            }
        }
        stage('构建镜像') {
            environment {
                // harbor仓库信息
                HARBOR_URL = "harbor.local.com"
                HARBOR_PROJECT = "spring_boot_demo"
                // 镜像标签
                IMAGE_TAG = ''
                // 镜像名称
                IMAGE_NAME = ''
            }
            steps {
                echo '开始构建镜像'
                script {
                    if (branchName == 'master') {
                        IMAGE_TAG = VersionNumber versionPrefix: 'p', versionNumberString: '${BUILD_DATE_FORMATTED, "yyMMdd"}.${BUILDS_TODAY}'
                    } else if (branchName == 'test') {
                        IMAGE_TAG = VersionNumber versionPrefix: 't', versionNumberString: '${BUILD_DATE_FORMATTED, "yyMMdd"}.${BUILDS_TODAY}'
                    } else {
                        error("Unsupported branch: ${params.BRANCH}")
                    }
                    IMAGE_NAME = "${HARBOR_URL}/${HARBOR_PROJECT}/${IMAGE_APP}:${IMAGE_TAG}"
                    sh "nerdctl build --insecure-registry -t ${IMAGE_NAME} . "
                }
                echo '构建镜像完成'
                echo '开始推送镜像'
                // 获取harbor账号密码
                withCredentials([usernamePassword(credentialsId: "${HARBOR_CRED}", passwordVariable: 'HARBOR_PASSWORD', usernameVariable: 'HARBOR_USERNAME')]) {
                    // 登录Harbor仓库
                    sh """nerdctl login --insecure-registry ${HARBOR_URL} -u ${HARBOR_USERNAME} -p ${HARBOR_PASSWORD}
          nerdctl push --insecure-registry ${IMAGE_NAME}"""
                }
                echo '推送镜像完成'
                echo '开始删除镜像'
                script {
                    sh "nerdctl rmi -f ${IMAGE_NAME}"
                }
                echo '删除镜像完成'
            }
        }
        stage('项目部署') {
            environment {
                // 资源清单名称
                YAML_NAME = "k8s.yaml"
            }
            steps {
                echo '开始修改资源清单'
                script {
                    if (branchName == 'master' ) {
                        NAME_SPACE = 'prod'
                        DOMAIN_NAME = 'demo.local.com'
                    } else if (branchName == 'test') {
                        NAME_SPACE = 'test'
                        DOMAIN_NAME = 'demo.test.com'
                    } else {
                        error("Unsupported branch: ${params.BRANCH}")
                    }
                }
                // 使用Content Replace插件进行k8s资源清单内容替换
                contentReplace(configs: [fileContentReplaceConfig(configs: [fileContentReplaceItemConfig(replace: "${IMAGE_NAME}", search: 'IMAGE_NAME'),
                                                                            fileContentReplaceItemConfig(replace: "${NAME_SPACE}", search: 'NAME_SPACE'),
                                                                            fileContentReplaceItemConfig(replace: "${DOMAIN_NAME}", search: 'DOMAIN_NAME')],
                        fileEncoding: 'UTF-8',
                        filePath: "${YAML_NAME}",
                        lineSeparator: 'Unix')])
                echo '修改资源清单完成'
                sh "cat ${YAML_NAME}"
                echo '开始部署资源清单'
                sh "kubectl apply -f ${YAML_NAME}"
                echo '部署资源清单完成'
            }
        }
    }
    post {
        always {
            echo '开始发送邮件通知'
            emailext(subject: '构建通知：${PROJECT_NAME} - Build # ${BUILD_NUMBER} - ${BUILD_STATUS}!',
                    body: '${FILE,path="email.html"}',
                    to: 'cuiliang0302@qq.com')
            echo '邮件通知发送完成'
        }
    }
}
```






