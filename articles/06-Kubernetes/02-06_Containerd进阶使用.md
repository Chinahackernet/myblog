# Containerd进阶使用

> 分类：Kubernetes / 第2章：kubeadm集群安装部署
> 原文：https://www.cuiliangblog.cn/detail/section/167380911
> 来源：崔亮的博客

---

# ctr命令使用
## 命名空间
查看命名空间

Containerd 中也支持命名空间的概念，比如查看命名空间：

```shell
[root@work3 ~]# ctr ns ls
NAME    LABELS 
default        
k8s.io         
moby 
```

创建命名空间

如果不指定，ctr 默认使用的是 default 空间。同样也可以使用 ns create 命令创建一个命名空间：

```shell
[root@work3 ~]# ctr ns create test
[root@work3 ~]# ctr ns ls
NAME    LABELS 
default        
k8s.io         
moby           
test
```

删除命名空间

使用 remove 或者 rm 可以删除 namespace：

```shell
[root@work3 ~]# ctr ns rm test
test
[root@work3 ~]# ctr ns ls
NAME    LABELS 
default        
k8s.io         
moby 
```

指定命名空间

有了命名空间后就可以在操作资源的时候指定 namespace，比如查看 test 命名空间的镜像，可以在操作命令后面加上 -n test 选项：

```shell
➜  ~ ctr -n test image ls
REF TYPE DIGEST SIZE PLATFORMS LABELS
```

我们知道 Docker 其实也是默认调用的 containerd，事实上 Docker 使用的 containerd 下面的命名空间默认是 moby，而不是 default，所以假如我们有用 docker 启动容器，那么我们也可以通过 ctr -n moby 来定位下面的容器：

```shell
➜  ~ ctr -n moby container ls
```

同样 Kubernetes 下使用的 containerd 默认命名空间是 k8s.io，所以我们可以使用 ctr -n k8s.io 来查看 Kubernetes 下面创建的容器。

## 镜像操作
通过ctr image命令完成，也可以简化为ctr i命令操作

拉取镜像

拉取镜像可以使用 ctr image pull 来完成，比如拉取 Docker Hub 官方镜像 nginx:alpine，需要注意的是镜像地址需要加上 docker.io Host 地址

```bash
[root@work3 ~]# ctr image pull docker.io/library/nginx:alpine
docker.io/library/nginx:alpine:                                                   resolved       |++++++++++++++++++++++++++++++++++++++| 
index-sha256:647c5c83418c19eef0cddc647b9899326e3081576390c4c7baa4fce545123b6c:    exists         |++++++++++++++++++++++++++++++++++++++| 
manifest-sha256:ccf066d2cfec0cfe57a63cf26f4b7cabbea80e11ab5b7f1cc11a1b5efd65ea0b: exists         |++++++++++++++++++++++++++++++++++++++| 
layer-sha256:9398808236ffac29e60c04ec906d8d409af7fa19dc57d8c65ad167e9c4967006:    exists         |++++++++++++++++++++++++++++++++++++++| 
layer-sha256:e6a5b569446606ea05a88fc5be4097b4982fc4bc8aeae0818385fe13b8b6066e:    done           |++++++++++++++++++++++++++++++++++++++| 
config-sha256:414132ff3b076936528928c823b4f3d1e1178b2692ae04defc8f8fdfd0a83a03:   exists         |++++++++++++++++++++++++++++++++++++++| 
layer-sha256:7b8bdebbb770eb9a7ceaecd729a82d21052fcdb9915873a67d5834960944fcf2:    exists         |++++++++++++++++++++++++++++++++++++++| 
layer-sha256:a2a4fe64baa08a5a04c1acd107b0026f81a72c7e35cdb3647e164f3b87871d09:    exists         |++++++++++++++++++++++++++++++++++++++| 
layer-sha256:0777b518fc6e4d42454db10fd2da40eb3f2e9086aa2529066ce6b314c2ec08cb:    exists         |++++++++++++++++++++++++++++++++++++++| 
layer-sha256:63f4060a8ef34058494aefc8ef63522d21056a40f00255d0c5d92ab51212e4c2:    exists         |++++++++++++++++++++++++++++++++++++++| 
layer-sha256:48703ecfcf806f280f159af73a1688374148f4860c52d016646a40a1a84853ec:    exists         |++++++++++++++++++++++++++++++++++++++| 
layer-sha256:9cbe387ec693ef1d8ece08c1ab2d510ac31d0745c157fbf948cacac343b47c34:    exists         |++++++++++++++++++++++++++++++++++++++| 
elapsed: 164.1s                                                                   total:  11.0 M (68.6 KiB/s)                                      
unpacking linux/amd64 sha256:647c5c83418c19eef0cddc647b9899326e3081576390c4c7baa4fce545123b6c...
done: 1.656214028s
```

列出本地镜像

```bash
# 列出镜像列表
[root@work3 ~]# ctr image ls
REF                                         TYPE                                                      DIGEST                                                                  SIZE      PLATFORMS                                                                                                                          LABELS 
docker.io/library/nginx:alpine              application/vnd.docker.distribution.manifest.list.v2+json sha256:647c5c83418c19eef0cddc647b9899326e3081576390c4c7baa4fce545123b6c 16.2 MiB  linux/386,linux/amd64,linux/arm/v6,linux/arm/v7,linux/arm64/v8,linux/ppc64le,linux/s390x                                           -      
# 只查看镜像名称标签
[root@work3 ~]# ctr image ls -q
docker.io/flannel/flannel-cni-plugin:v1.2.0
docker.io/flannel/flannel:v0.22.1
docker.io/library/busybox:latest
docker.io/library/nginx:alpine
ghcr.io/kube-vip/kube-vip:v0.6.0
harbor.local.com/library/busybox:latest
```

重新打标签

```bash
[root@work3 ~]# ctr image tag docker.io/library/nginx:alpine harbor.local.com/library/nginx:alpine
harbor.local.com/library/nginx:alpine
[root@work3 ~]# ctr image ls -q
docker.io/library/nginx:alpine
harbor.local.com/library/nginx:alpine
```

删除镜像

```bash
[root@work3 ~]# ctr image rm harbor.local.com/library/nginx:alpine
harbor.local.com/library/nginx:alpine
[root@work3 ~]# ctr image ls -q
docker.io/library/nginx:alpine
```

将镜像导出为压缩包

```bash
[root@work3 ~]# ctr image export nginx.tar docker.io/library/nginx:alpine
```

从压缩包导入镜像

```shell
[root@work2 ~]# ctr image import nginx.tar 
```

## 容器操作
通过ctr container命令完成，也可以简化为ctr c命令操作

这里要解释一个概念  containers 和 task ，在docker里面 container 概念被弱化 ，将containers 和 task 整在一起 形成了docker中的 container。 

ctr中 containers 是镜像实例化的一个虚拟环境，提供一个磁盘，模拟空间，就好比你电脑处于关机状态一样。

ctr中 tasks 是将容器运行起来，电脑开机了 ，初始化进程等 ，task就是的这么个形式。

创建容器

```shell
[root@work3 ~]# ctr container create docker.io/library/nginx:alpine nginx
```

列出容器

```shell
[root@work3 ~]# ctr container ls
CONTAINER    IMAGE                             RUNTIME                  
nginx        docker.io/library/nginx:alpine    io.containerd.runc.v2    
[root@work3 ~]# ctr container ls -q
nginx
```

查看容器详情

```shell
[root@work3 ~]# ctr container info nginx
{
    "ID": "nginx",
    "Labels": {
        "io.containerd.image.config.stop-signal": "SIGQUIT",
        "maintainer": "NGINX Docker Maintainers \u003cdocker-maint@nginx.com\u003e"
    },
    "Image": "docker.io/library/nginx:alpine",
    "Runtime": {
        "Name": "io.containerd.runc.v2",
        "Options": {
            "type_url": "containerd.runc.v1.Options"
        }
    }
    ……
}
```

删除容器

```shell
[root@work3 ~]# ctr container rm nginx
[root@work3 ~]# ctr container ls
CONTAINER    IMAGE    RUNTIME 
```

## 任务操作
上面我们通过 container create 命令创建的容器，并没有处于运行状态，只是一个静态的容器。一个 container 对象只是包含了运行一个容器所需的资源及相关配置数据，表示 namespaces、rootfs 和容器的配置都已经初始化成功了，只是用户进程还没有启动。

一个容器真正运行起来是由 Task 任务实现的，Task 可以为容器设置网卡，还可以配置工具来对容器进行监控等。

启动容器

```shell
[root@work3 ~]# ctr container create docker.io/library/nginx:alpine nginx
[root@work3 ~]# ctr task start -d nginx
```

查看正在运行的容器

```shell
[root@work3 ~]# ctr task ls
TASK     PID      STATUS    
nginx    60394    RUNNING
```

获取容器信息

使用 task metrics 命令用来获取容器的内存、CPU 和 PID 的限额与使用量。

```shell
[root@work3 ~]# ctr task metrics nginx
ID       TIMESTAMP                                  
nginx    2023-08-13 04:42:31.648754469 +0000 UTC    

METRIC                   VALUE                                                                                                                                                                                                                                                                                          
memory.usage_in_bytes    5226496                                                                                                                                                                                                                                                                                        
memory.limit_in_bytes    9223372036854771712                                                                                                                                                                                                                                                                            
memory.stat.cache        155648                                                                                                                                                                                                                                                                                         
cpuacct.usage            74124077                                                                                                                                                                                                                                                                                       
cpuacct.usage_percpu     [32560123 27605021 7821698 6137235 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0]    
pids.current             5                                                                                                                                                                                                                                                                                              
pids.limit               0
```

获取容器PID

使用 task ps 命令查看容器中所有进程在宿主机中的 PID：

```shell
[root@work3 ~]# ctr task ps nginx
PID      INFO
62925    -
62954    -
62955    -
62956    -
62957    -
[root@work3 ~]# ctr task ls
TASK     PID      STATUS    
nginx    62925    RUNNING
```

其中第一个 PID 3984 就是我们容器中的 1 号进程。

进入容器进行操作

```shell
[root@work3 ~]# ctr task exec --exec-id 0 -t nginx sh
/ # ls
bin                   docker-entrypoint.sh  lib 
# 指定用户进入
[root@work3 ~]# ctr task exec --exec-id 0 --user 65534 -t nginx sh
$ whoami
nobody
$ exit
[root@work3 ~]# ctr task exec --exec-id 0 --user 0 -t nginx sh
# whoami
root
```

不过这里需要注意必须要指定 --exec-id 参数，这个 id 可以随便写，只要唯一就行。

暂停容器

```shell
[root@work3 ~]# ctr task pause nginx
[root@work3 ~]# ctr task ls
TASK     PID      STATUS    
nginx    60394    PAUSED
# 暂停后容器状态变成了 PAUSED
```

恢复容器

```shell
[root@work3 ~]# ctr task resume nginx
[root@work3 ~]# ctr task ls
TASK     PID      STATUS    
nginx    60394    RUNNING
```

停止容器

不过需要注意 ctr 没有 stop 容器的功能，只能暂停或者杀死容器。杀死容器可以使用 task kill 命令:

```shell
[root@work3 ~]# ctr task kill nginx
[root@work3 ~]# ctr task ls
TASK     PID      STATUS    
nginx    60394    STOPPED
```

删除容器

杀掉容器后可以看到容器的状态变成了 STOPPED。同样也可以通过 task rm 命令删除 Task：

```shell
[root@work3 ~]# ctr task rm nginx
[root@work3 ~]# ctr task ls
TASK    PID    STATUS
```

# 安装配置crictl
## 安装crictl
crictl 是 CRI 兼容的容器运行时命令行接口，和containerd无关，由Kubernetes提供，可以使用它来检查和调试 k8s 节点上的容器运行时和应用程序。

下载地址：https://github.com/kubernetes-sigs/cri-tools/releases，例如安装1.30.6版本的k8s，此处安装的crictl就是1.30.1。

```bash
Loading...# 下载
[root@k8s-master ~]# wget https://github.com/kubernetes-sigs/cri-tools/releases/download/v1.30.1/crictl-v1.30.1-linux-amd64.tar.gz
# 解压
[root@k8s-master ~]# tar -zxvf crictl-v1.30.1-linux-amd64.tar.gz -C /usr/local/bin
# 配置
[root@k8s-master ~]# cat > /etc/crictl.yaml << EOF
runtime-endpoint: "unix:///run/containerd/containerd.sock"
image-endpoint: "unix:///run/containerd/containerd.sock"
timeout: 0
debug: false
pull-image-on-create: false
disable-pull-on-run: false
EOF
[root@k8s-master ~]# crictl version
Version:  0.1.0
RuntimeName:  containerd
RuntimeVersion:  1.6.4
RuntimeApiVersion:  v1
```

## 打印清单
打印 Pod 清单

```shell
# 打印所有 Pod 的清单
$ crictl pods
POD ID              CREATED              STATE               NAME                         NAMESPACE           ATTEMPT
926f1b5a1d33a       About a minute ago   Ready               sh-84d7dcf559-4r2gq          default             0
4dccb216c4adb       About a minute ago   Ready               nginx-65899c769f-wv2gp       default             0
a86316e96fa89       17 hours ago         Ready               kube-proxy-gblk4             kube-system         0
919630b8f81f1       17 hours ago         Ready               nvidia-device-plugin-zgbbv   kube-system         0

# 根据名称打印 Pod 清单：
$ crictl pods --name nginx-65899c769f-wv2gp
POD ID              CREATED             STATE               NAME                     NAMESPACE           ATTEMPT
4dccb216c4adb       2 minutes ago       Ready               nginx-65899c769f-wv2gp   default             0

# 根据标签打印 Pod 清单
$ crictl pods --label run=nginx
POD ID              CREATED             STATE               NAME                     NAMESPACE           ATTEMPT
4dccb216c4adb       2 minutes ago       Ready               nginx-65899c769f-wv2gp   default             0
```

打印镜像清单

```shell
# 打印所有镜像清单
$ crictl images
IMAGE                                     TAG                 IMAGE ID            SIZE
busybox                                   latest              8c811b4aec35f       1.15MB
k8s-gcrio.azureedge.net/hyperkube-amd64   v1.10.3             e179bbfe5d238       665MB
k8s-gcrio.azureedge.net/pause-amd64       3.1                 da86e6ba6ca19       742kB
nginx                                     latest              cd5239a0906a6       109MB

# 根据仓库打印镜像清单
$ crictl images nginx
IMAGE               TAG                 IMAGE ID            SIZE
nginx               latest              cd5239a0906a6       109MB

# 只打印镜像 ID
$ crictl images -q
sha256:8c811b4aec35f259572d0f79207bc0678df4c736eeec50bc9fec37ed936a472a
sha256:e179bbfe5d238de6069f3b03fccbecc3fb4f2019af741bfff1233c4d7b2970c5
sha256:da86e6ba6ca197bf6bc5e9d900febd906b133eaa4750e6bed647b0fbe50ed43e
sha256:cd5239a0906a6ccf0562354852fae04bc5b52d72a2aff9a871ddb6bd57553569
```

打印容器清单

```shell
# 打印所有容器清单
$ crictl ps -a
CONTAINER ID        IMAGE                                                                                                             CREATED             STATE               NAME                       ATTEMPT
1f73f2d81bf98       busybox@sha256:141c253bc4c3fd0a201d32dc1f493bcf3fff003b6df416dea4f41046e0f37d47                                   7 minutes ago       Running             sh                         1
9c5951df22c78       busybox@sha256:141c253bc4c3fd0a201d32dc1f493bcf3fff003b6df416dea4f41046e0f37d47                                   8 minutes ago       Exited              sh                         0
87d3992f84f74       nginx@sha256:d0a8828cccb73397acb0073bf34f4d7d8aa315263f1e7806bf8c55d8ac139d5f                                     8 minutes ago       Running             nginx                      0
1941fb4da154f       k8s-gcrio.azureedge.net/hyperkube-amd64@sha256:00d814b1f7763f4ab5be80c58e98140dfc69df107f253d7fdd714b30a714260a   18 hours ago        Running             kube-proxy                 0

# 打印正在运行的容器清单
$ crictl ps
CONTAINER ID        IMAGE                                                                                                             CREATED             STATE               NAME                       ATTEMPT
1f73f2d81bf98       busybox@sha256:141c253bc4c3fd0a201d32dc1f493bcf3fff003b6df416dea4f41046e0f37d47                                   6 minutes ago       Running             sh                         1
87d3992f84f74       nginx@sha256:d0a8828cccb73397acb0073bf34f4d7d8aa315263f1e7806bf8c55d8ac139d5f                                     7 minutes ago       Running             nginx                      0
1941fb4da154f       k8s-gcrio.azureedge.net/hyperkube-amd64@sha256:00d814b1f7763f4ab5be80c58e98140dfc69df107f253d7fdd714b30a714260a   17 hours ago        Running             kube-proxy                 0

```

## 容器执行命令
```shell
$ crictl exec -i -t 1f73f2d81bf98 ls
bin   dev   etc   home  proc  root  sys   tmp   usr   var
```

## 获取容器日志
```shell
# 获取容器的所有日志
$ crictl logs 87d3992f84f74
10.240.0.96 - - [06/Jun/2018:02:45:49 +0000] "GET / HTTP/1.1" 200 612 "-" "curl/7.47.0" "-"
10.240.0.96 - - [06/Jun/2018:02:45:50 +0000] "GET / HTTP/1.1" 200 612 "-" "curl/7.47.0" "-"
10.240.0.96 - - [06/Jun/2018:02:45:51 +0000] "GET / HTTP/1.1" 200 612 "-" "curl/7.47.0" "-"

# 获取最近的 N 行日志
$ crictl logs --tail=1 87d3992f84f74
10.240.0.96 - - [06/Jun/2018:02:45:51 +0000] "GET / HTTP/1.1" 200 612 "-" "curl/7.47.0" "-"
```

## 运行 Pod 沙盒
用 crictl 运行 Pod 沙盒对容器运行时排错很有帮助。 在运行的 Kubernetes 集群中，沙盒会随机地被 kubelet 停止和删除。

1. 编写下面的 JSON 文件：

```shell
{
    "metadata": {
        "name": "nginx-sandbox",
        "namespace": "default",
        "attempt": 1,
        "uid": "hdishd83djaidwnduwk28bcsb"
    },
    "logDirectory": "/tmp",
    "linux": {
    }
}
```

2. 使用 crictl runp 命令应用 JSON 文件并运行沙盒。

```plain
$ crictl runp pod-config.json
```

返回了沙盒的 ID。

## 创建容器
用 crictl 创建容器对容器运行时排错很有帮助。 在运行的 Kubernetes 集群中，沙盒会随机的被 kubelet 停止和删除。

拉取 busybox 镜像

```plain
$ crictl pull busybox
Image is up to date for busybox@sha256:141c253bc4c3fd0a201d32dc1f493bcf3fff003b6df416dea4f41046e0f37d47
```

创建 Pod 配置

```plain
{
    "metadata": {
        "name": "nginx-sandbox",
        "namespace": "default",
        "attempt": 1,
        "uid": "hdishd83djaidwnduwk28bcsb"
    },
    "log_directory": "/tmp",
    "linux": {
    }
}
```

创建容器配置

```plain
{
  "metadata": {
      "name": "busybox"
  },
  "image":{
      "image": "busybox"
  },
  "command": [
      "top"
  ],
  "log_path":"busybox.log",
  "linux": {
  }
}
```

创建容器，传递先前创建的 Pod 的 ID、容器配置文件和 Pod 配置文件。返回容器的 ID。

```plain
$ crictl create f84dd361f8dc51518ed291fbadd6db537b0496536c1d2d6c05ff943ce8c9a54f container-config.json pod-config.json
```

查询所有容器并确认新创建的容器状态为 Created。

```plain
CONTAINER ID        IMAGE               CREATED             STATE               NAME                ATTEMPT
3e025dd50a72d       busybox             32 seconds ago      Created             busybox             0
```

## 启动容器
要启动容器，要将容器 ID 传给 crictl start：

```plain
$ crictl start 3e025dd50a72d956c4f14881fbb5b1080c9275674e95fb67f965f6478a957d60
3e025dd50a72d956c4f14881fbb5b1080c9275674e95fb67f965f6478a957d60
```

确认容器的状态为 Running。

```plain
$ crictl ps
CONTAINER ID        IMAGE               CREATED              STATE               NAME                ATTEMPT
3e025dd50a72d       busybox             About a minute ago   Running             busybox             0
```

# 安装与使用nerdctl
containerd虽然可直接提供给终端用户直接使用，也提供了命令行工具(ctr)，但并不是很友好，所以nerdctl应运而生，它也是containerd的命令行工具，支持docker cli关于容器生命周期管理的所有命令，并且支持docker compose (nerdctl compose up)

## 安装nerdctl
下载地址：[https://github.com/containerd/nerdctl/releases](https://github.com/containerd/nerdctl/releases)

```bash
# 下载
[root@k8s-master ~]# wget https://github.com/containerd/nerdctl/releases/download/v2.2.2/nerdctl-2.2.2-linux-amd64.tar.gz
# 解压
[root@k8s-master ~]# tar -zxvf nerdctl-2.2.2-linux-amd64.tar.gz
nerdctl
containerd-rootless-setuptool.sh
containerd-rootless.sh
# 复制文件
[root@k8s-master ~]# mv nerdctl /usr/bin/
# 配置 nerdctl 参数自动补齐
[root@k8s-master ~]# echo 'source <(nerdctl completion bash)' >> ~/.bash_profile 
[root@k8s-master ~]# source ~/.bash_profile 
# 验证
[root@k8s-master ~]# nerdctl -v
nerdctl version 2.2.2
```

## 命名空间
这个和K8s的名字空间不是一回事，其中default就是containerd的默认名字空间，[http://k8s.io](http://k8s.io)是K8s的名字空间

```bash
# 查看命名空间
[root@k8s-master ~]# nerdctl ns ls
NAME         CONTAINERS    IMAGES    VOLUMES    LABELS
default      0             2         0              
docker.io    0             1         0              
k8s.io       18            51        0              
moby         0             0         0
# 创建命名空间
[root@k8s-master ~]# nerdctl ns create test
# 删除命名空间
[root@k8s-master ~]# nerdctl ns remove test
test
# 查看名称空间详情
[root@k8s-master ~]# nerdctl ns inspect k8s.io
[
    {
        "Name": "k8s.io",
        "Labels": null
    }
]
```

## 镜像
```bash
# 查看镜像
[root@k8s-master ~]# nerdctl -n k8s.io images
REPOSITORY                                                         TAG         IMAGE ID        CREATED         PLATFORM       SIZE         BLOB SIZE
registry.aliyuncs.com/google_containers/coredns                    v1.8.6      5b6ec0d6de9b    5 days ago      linux/amd64    44.7 MiB     13.0 MiB
registry.aliyuncs.com/google_containers/etcd                       3.5.6-0     dd75ec974b0a    5 days ago      linux/amd64    289.0 MiB    97.8 MiB
# 拉取镜像
[root@k8s-master ~]# nerdctl -n test pull nginx:alpine
# 构建镜像
[root@k8s-master ~]# cat Dockerfile 
FROM     debian
RUN apt-get install -y --force-yes locales
RUN echo "LC_ALL=\"zh_CN.UTF-8\"" >> /etc/default/locale
RUN locale-gen "zh_CN.UTF-8"
[root@k8s-master ~]# nerdctl -n test build -t abc.com/debian .
# 上传镜像
[root@k8s-master ~]# nerdctl -n test push abc.com/debian
# 导出镜像
[root@k8s-master ~]# nerdctl -n test save -o debian.tar abc.com/debian
# 导入镜像
[root@k8s-master ~]# nerdctl -n test load -i debian.tar
```

## 容器
```bash
# 查看容器
[root@k8s-master ~]# nerdctl -n k8s.io ps 
CONTAINER ID    IMAGE                                                                      COMMAND                   CREATED         STATUS    PORTS    NAMES
05be77648e0c    registry.aliyuncs.com/google_containers/kube-proxy:v1.25.0                 "/usr/local/bin/kube…"    13 hours ago    Up                 k8s://kube-system/kube-proxy-qd2dg/kube-proxy
240c8fdfb7dd    registry.aliyuncs.com/google_containers/pause:3.6                          "/pause"                  13 hours ago    Up                 k8s://kube-system/kube-apiserver-k8s-master
24728a2d2f1b    docker.io/flannel/flannel:v0.21.5                                          "/opt/bin/flanneld -…"    17 hours ago    Up                 k8s://kube-flannel/kube-flannel-ds-45rxr/kube-flannel
# 启动容器
[root@k8s-master ~]# nerdctl -n test run -d -p 80:80 --name web nginx:alpine
# 进入容器
[root@k8s-master ~]# nerdctl -n test exec -it web sh
/ # 
# 停止容器
[root@k8s-master ~]# nerdctl -n test stop web
web
# 删除容器
[root@k8s-master ~]# nerdctl -n test rm web
web
```

## 其他操作
```bash
# 查看网络信息
[root@k8s-master ~]# nerdctl network ls
NETWORK ID      NAME      FILE
                cbr0      /etc/cni/net.d/10-flannel.conflist
17f29b073143    bridge    /etc/cni/net.d/nerdctl-bridge.conflist
                host      
                none
# 查看系统信息
[root@k8s-master ~]# nerdctl system info
Client:
 Namespace:     default
 Debug Mode:    false

Server:
 Server Version: 1.6.4
 Storage Driver: overlayfs
 Logging Driver: json-file
 Cgroup Driver: cgroupfs
 Cgroup Version: 1
 Plugins:
  Log: fluentd journald json-file syslog
  Storage: native overlayfs
 Security Options:
  seccomp
   Profile: default
 Kernel Version: 4.18.0-425.13.1.el8_7.x86_64
 Operating System: Rocky Linux 8.7 (Green Obsidian)
 OSType: linux
 Architecture: x86_64
 CPUs: 2
 Total Memory: 3.618GiB
 Name: k8s-master
 ID: d2b76909-9552-4be5-a12a-00b955f756f2
# 清理数据，它不是和Docker那样只是把标签为"none"的镜像清理掉，而是把所有没有"正在使用"的镜像清理了
[root@k8s-master ~]# nerdctl system prune -h
```

# nerdctl替代docker-compose
## 安装bridge插件
```bash
[root@tiaoban ~]# mkdir -p /opt/cni/bin
[root@tiaoban ~]# cd /opt/cni/bin
[root@tiaoban ~]# wget https://github.com/containernetworking/plugins/releases/download/v1.4.1/cni-plugins-linux-amd64-v1.4.1.tgz
[root@tiaoban ~]# tar -zxvf cni-plugins-linux-amd64-v1.4.1.tgz
```

## 管理compose
以Harbor为例演示，启动容器

```bash
[root@tiaoban harbor]# nerdctl compose up -d
INFO[0000] Creating network harbor_harbor               
INFO[0000] Creating network harbor_default 
```

查看启动的容器

```bash
[root@tiaoban harbor]# nerdctl ps
CONTAINER ID    IMAGE                                            COMMAND                   CREATED           STATUS    PORTS                                          NAMES
276a4f6a92e5    docker.io/goharbor/harbor-jobservice:v2.10.1     "/harbor/entrypoint.…"    32 seconds ago    Up                                                       harbor-jobservice
7c3699c62fc7    docker.io/goharbor/redis-photon:v2.10.1          "redis-server /etc/r…"    35 seconds ago    Up                                                       redis
810fbb8229c1    docker.io/goharbor/harbor-core:v2.10.1           "/harbor/entrypoint.…"    35 seconds ago    Up                                                       harbor-core
9a6237f63aeb    docker.io/goharbor/nginx-photon:v2.10.1          "nginx -g daemon off;"    33 seconds ago    Up        0.0.0.0:80->8080/tcp, 0.0.0.0:443->8443/tcp    nginx
a0198a493795    docker.io/goharbor/harbor-db:v2.10.1             "/docker-entrypoint.…"    36 seconds ago    Up                                                       harbor-db
b4c2c4a1f934    docker.io/goharbor/harbor-log:v2.10.1            "/bin/sh -c /usr/loc…"    37 seconds ago    Up        127.0.0.1:1514->10514/tcp                      harbor-log
d9ec21d50e55    docker.io/goharbor/harbor-portal:v2.10.1         "nginx -g daemon off;"    34 seconds ago    Up                                                       harbor-portal
f1e6c92a6000    docker.io/goharbor/harbor-registryctl:v2.10.1    "/home/harbor/start.…"    33 seconds ago    Up                                                       registryctl
f2f383e2a191    docker.io/goharbor/registry-photon:v2.10.1       "/home/harbor/entryp…"    36 seconds ago    Up                                                       registry
```

查看日志

```bash
[root@tiaoban harbor]# nerdctl compose logs
db          |time="2024-04-26T20:39:54+08:00" level=fatal msg="no log viewer type registered for logging driver \"syslog\""
portal      |time="2024-04-26T20:39:54+08:00" level=fatal msg="no log viewer type registered for logging driver \"syslog\""
redis       |time="2024-04-26T20:39:54+08:00" level=fatal msg="no log viewer type registered for logging driver \"syslog\""
registry    |time="2024-04-26T20:39:54+08:00" level=fatal msg="no log viewer type registered for logging driver \"syslog\""
nginx       |time="2024-04-26T20:39:54+08:00" level=fatal msg="no log viewer type registered for logging driver \"syslog\""
core        |time="2024-04-26T20:39:54+08:00" level=fatal msg="no log viewer type registered for logging driver \"syslog\""
jobservice  |time="2024-04-26T20:39:54+08:00" level=fatal msg="no log viewer type registered for logging driver \"syslog\""
registryctl |time="2024-04-26T20:39:54+08:00" level=fatal msg="no log viewer type registered for logging driver \"syslog\""
```

停止容器

```bash
[root@tiaoban harbor]# nerdctl compose down
```

# nerdctl+buildkitd构建镜像
## buildkit介绍
buildkit 从Docker公司的开源的镜像构建工具包，支持OCI标准的镜像构建

buildkitd组成部分：

buildkitd（服务端），目前支持runc和containerd作为镜像构建环境，默认是runc，可以更换containerd。

buildctl（客户端），负责解析Dockerfile文件、并向服务端buildkitd发出构建请求。

构建镜像并推送至Harbor为例，整个服务调用过程如下：

![](assets/06-Kubernetes/3a660a3d2b492427b02a.png)

## 安装buildkit
软件包下载地址：[https://github.com/moby/buildkit/releases](https://github.com/moby/buildkit/releases)

```bash
[root@master ~]# wget https://github.com/moby/buildkit/releases/download/v0.13.2/buildkit-v0.13.2.linux-amd64.tar.gz
[root@master ~]# tar -zxvf buildkit-v0.13.2.linux-amd64.tar.gz 
bin/
bin/buildctl
bin/buildkit-cni-bridge
bin/buildkit-cni-firewall
bin/buildkit-cni-host-local
bin/buildkit-cni-loopback
bin/buildkit-qemu-aarch64
bin/buildkit-qemu-arm
bin/buildkit-qemu-i386
bin/buildkit-qemu-mips64
bin/buildkit-qemu-mips64el
bin/buildkit-qemu-ppc64le
bin/buildkit-qemu-riscv64
bin/buildkit-qemu-s390x
bin/buildkit-runc
bin/buildkitd
[root@master ~]# cd bin/
[root@master bin]# cp * /usr/local/bin/
```

创建service脚本

```bash
[root@master bin]# cat /etc/systemd/system/buildkitd.service
[Unit]
Description=BuildKit
Documentation=https://github.com/moby/buildkit

[Service]
ExecStart=/usr/local/bin/buildkitd --oci-worker=false --containerd-worker=true

[Install]
WantedBy=multi-user.target
```

新增buildkitd配置文件，添加镜像仓库使用http访问

```groovy
[root@master bin]# vim /etc/buildkit/buildkitd.toml
[registry."harbor.local.com"]
  http = false
  insecure = true
```

启动buildkitd

```bash
[root@master bin]# systemctl daemon-reload
[root@master bin]# systemctl start buildkitd
[root@master bin]# systemctl enable buildkitd
```

## 构建镜像并测试
```bash
[root@master ~]# cat Dockerfile 
FROM busybox
CMD ["echo","hello","container"]
[root@master ~]# nerdctl build -t busybox:v1 .
[root@master ~]# nerdctl images
REPOSITORY    TAG    IMAGE ID        CREATED               PLATFORM       SIZE       BLOB SIZE
busybox       v1     fb6a2dfc7899    About a minute ago    linux/amd64    4.1 MiB    2.1 MiB
[root@master ~]# nerdctl run busybox:v1
hello container
```

## 推送至Harbor仓库
```bash
[root@master ~]# nerdctl tag busybox:v1 harbor.local.com/app/busybox:v1
[root@master ~]# nerdctl push harbor.local.com/app/busybox:v1
```

此时查看Harbor仓库发现已经推送成功

![](assets/06-Kubernetes/44775609449ff1d435f1.png)


