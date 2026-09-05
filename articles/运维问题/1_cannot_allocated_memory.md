# 问题描述

K8S的Pod调度到某个节点的时候，发现一直处于ContainerCreating状态，Describe Pod的时候发现如下报错：

```shell
/sys/fs/cgroup memory/kubepods cannot allocate memory
```

  

这个问题并不是新奇的问题，而是Linux内核在3.x版本普遍存在的问题。

​  

可以通过如下方式检查主机是否存在内存泄漏问题。

```shell
cat /sys/fs/cgroup/memory/kubepods/memory.kmem.slabinfo
```

  

如果输出如下，表示存在内存泄漏。

```shell
# cat /sys/fs/cgroup/memory/kubepods/memory.kmem.slabinfo
slabinfo - version: 2.1
# name            <active_objs> <num_objs> <objsize> <objperslab> <pagesperslab> : tunables <limit> <batchcount> <sharedfactor> : slabdata <active_slabs> <num_slabs> <sharedavail>
```

  

如果输出如下，则表示没有内存泄漏。

```shell
# cat /sys/fs/cgroup/memory/kubepods/memory.kmem.slabinfo
cat: /sys/fs/cgroup/memory/kubepods/memory.kmem.slabinfo: 输入/输出错误
```

  

显然我这台机器是第一种，存在内存泄漏。

​  

# 原因阐述

cgroup 的 kmem account 特性在 3.x 内核上有内存泄露问题，如果开启了 kmem account 特性 会导致可分配内存越来越少，直到无法创建新 pod 或节点异常。

几点解释：

1.  kmem account 是cgroup 的一个扩展，全称CONFIG\_MEMCG\_KMEM，属于机器默认配置，本身没啥问题，只是该特性在 3.10 的内核上存在漏洞有内存泄露问题，4.x的内核修复了这个问题。
2.  因为 kmem account 是 cgroup 的扩展能力，因此runc、docker、k8s 层面也进行了该功能的支持，即默认都打开了kmem 属性
3.  因为3.10 的内核已经明确提示 kmem 是实验性质，我们仍然使用该特性，所以这其实不算内核的问题，是 k8s 兼容问题。

​  

# 解决方案

这里推荐3种解决方案：

-   关闭runc和kubelet的kmem
-   在kernel层面关闭kmem
-   升级内核

​  

## 关闭runc和kubelet的kmem

因为升级内核的动作比较大，而且有时候因为业务应用的原因不能只单纯的升级一台服务器，所以先通过关闭runc和kubelet的kmem。

​  

这种操作就需要重新编译run和kubelet。

​  

### 安装Go环境

编译需要Go环境。

```shell
$ wget https://studygolang.com/dl/golang/go1.17.11.linux-amd64.tar.gz
$ tar xf go1.17.11.linux-amd64.tar.gz -C /usr/local/

$ vim ~/.bashrc
export GOPATH="/root/rebuild-kubernetes/Documents"
export GOROOT="/usr/local/go"
export PATH="$GOROOT/bin:$GOPATH/bin:$PATH"
export GO111MODULE=off

$ source ~/.bashrc
```

  

### 编译runc

（1）首先查看自己本地的runc版本

```shell
$ docker version
 runc:
  Version:          1.0.2
  GitCommit:        v1.0.2-0-g52b36a2
```

  

（2）下载源代码进行编译

```shell
$ mkdir /root/rebuild-kubernetes/Documents/src/github.com/opencontainers/ -p
$ cd /root/rebuild-kubernetes/Documents/src/github.com/opencontainers/
$ git clone https://github.com/opencontainers/runc.git
$ cd runc
$ git checkout v1.0.2
$ yum install libseccomp-devel -y
$ make BUILDTAGS='seccomp nokmem'
```

  

编译完成过后，会在当前目录下生成`runc`二进制文件。

​  

### 编译kubelet

（1）查看本地Kubernetes集群的版本

```shell
$ kubectl get node
NAME     STATUS   ROLES    AGE     VERSION
master   Ready    master   2y31d   v1.16.8
node-1   Ready    worker   2y31d   v1.16.8
```

  

（2）下载kubernetes源码进行编译

```shell
$ cd /root/rebuild-kubernetes/Documents/src/github.com
$ git clone https://github.com/kubernetes/kubernetes.git
$ cd kubernetes
$ git checkout v1.16.8
$ yum install rpm-build which where rsync gcc gcc-c++ automake autoconf libtool make -y
$ GO111MODULE=off KUBE_GIT_TREE_STATE=clean KUBE_GIT_VERSION=v1.16.8 make kubelet GOFLAGS="-tags=nokmem"
```

  

如果使用上面命令编译出来的kubelet还是有问题，可以通过修改源码的方式再编译，如下：

```shell
修改文件：
vendor/github.com/opencontainers/runc/libcontainer/cgroups/fs/kmem.go

为：

// +build linux,!nokmem

package fs

import (
    "errors"
)

func EnableKernelMemoryAccounting(path string) error {
    return nil
}

func setKernelMemory(path string, kernelMemoryLimit int64) error {
    return errors.New("kernel memory accounting disabled in this runc build")
}
```

  

### 替换runc和kubelet

（1）先把节点标记为不可调度并驱逐上面的Pod

​  

```shell
$ kubectl cordon node-1
$ kubectl drain node-1 --ignore-daemonsets=true  --delete-local-data=true
```

  

（2）停止docker和kubelet

```shell
$ systemctl stop docker
$ systemctl stop kubelet
```

​  

（3）备份故障节点的kubelet和runc

```shell
$ mv /usr/bin/runc{,.backup.20220615}
$ mv /usr/bin/kubelet{,.backup.20220615}
$ mv /usr/local/bin/kubelet{,.backup.20220615}
```

  

（4）替换新的runc和kubelet

```shell
$ cp runc /usr/bin/runc
$ cp kubelet /usr/bin/kubelet
$ cp kubelet /usr/local/bin/kubelet
```

  

（5）启动docker和kubelet

```shell
$ systemctl start docker
$ system start kubelet
```

  

### 验证

替换完成过后，可以验证一下是否正常。

（1）打开节点调度

```shell
$ kubectl uncordon node-1
```

​  

（2）创建一个Pod调度到node-1上

```yaml
apiVersion: v1
kind: Pod
metadata:
  labels:
    run: nginx-1
  name: nginx-1
  namespace: default
spec:
  containers:
  - image: nginx
    imagePullPolicy: Always
    name: nginx-1
    ports:
    - containerPort: 80
      protocol: TCP
    resources:
      limits:
        cpu: 200m
        memory: 200Mi
      requests:
        cpu: 100m
        memory: 100Mi
  dnsPolicy: ClusterFirst
  enableServiceLinks: true
  nodeSelector:
    kubernetes.io/hostname: node-1

```

  

（3）查看容器ID

```shell
$ docker ps | grep nginx-1
142a6c5f1422        nginx                                                                      "/docker-entrypoint.…"   22 seconds ago      Up 21 seconds                                    k8s_nginx-1_nginx-1_default_8f11a256-a119-4285-a4b7-384a97bb6f60_0
2cbaa22e4c46        kubesphere/pause:3.1                                                       "/pause"                 38 seconds ago      Up 37 seconds                                    k8s_POD_nginx-1_default_8f11a256-a119-4285-a4b7-384a97bb6f60_0
```

  

（4）获取slabinfo路径，查看是否有内容

```shell
$ find /sys/fs/cgroup/memory -name "memory.kmem.slabinfo" | grep 142a6c5f1422
/sys/fs/cgroup/memory/kubepods/burstable/pod8f11a256-a119-4285-a4b7-384a97bb6f60/142a6c5f1422fdaf211c11abe5b1477da2410e4a3d37ec18021867ddf5daf66f/memory.kmem.slabinfo

$ cat /sys/fs/cgroup/memory/kubepods/burstable/pod8f11a256-a119-4285-a4b7-384a97bb6f60/142a6c5f1422fdaf211c11abe5b1477da2410e4a3d37ec18021867ddf5daf66f/memory.kmem.slabinfo
cat: /sys/fs/cgroup/memory/kubepods/burstable/pod8f11a256-a119-4285-a4b7-384a97bb6f60/142a6c5f1422fdaf211c11abe5b1477da2410e4a3d37ec18021867ddf5daf66f/memory.kmem.slabinfo: 输入/输出错误
```

  

如上表示kmem已经关闭。

如果修改了kubelet和runc依然无效，可能需要重启服务器。如果确定要重启，可以结合第二个方案一起执行。

​  

## 从kernel层面关闭kmem

修改服务器引导，让起在启动的时候直接金庸kmem。

```shell
$ vim /etc/default/grub
GRUB_CMDLINE_LINUX="crashkernel=auto rd.lvm.lv=centos/root rhgb quiet cgroup.memory=nokmem"

$ /usr/sbin/grub2-mkconfig -o /boot/grub2/grub.cfg

$ reboot
```

  

重启过后，验证是否关闭。

```shell
$ cat /sys/fs/cgroup/memory/kubepods/memory.kmem.slabinfo
cat: /sys/fs/cgroup/memory/kubepods/memory.kmem.slabinfo: 输入/输出错误
```

  

## 升级内核

kmem是Linux 3.x的一个实验特性，在4.x已经修复，在条件允许的情况下，可以选择升级kernel。

​  

（1）先确定本地的系统信息

```shell
$ uname -r
3.10.0-1160.11.1.el7.x86_64

$ cat /etc/redhat-release 
CentOS Linux release 7.6.1810 (Core)
```

  

### 升级到最新稳定版

```shell
$ rpm -import https://www.elrepo.org/RPM-GPG-KEY-elrepo.org
$ rpm -Uvh http://www.elrepo.org/elrepo-release-7.0-2.el7.elrepo.noarch.rpm
$ yum --disablerepo="*" --enablerepo="elrepo-kernel" list available
$ yum -y --enablerepo=elrepo-kernel install kernel-ml.x86_64 kernel-ml-devel.x86_64
```

  

### 安装指定版本

> [http://mirrors.coreix.net/elrepo-archive-archive/kernel/el7/x86\_64/RPMS/](http://mirrors.coreix.net/elrepo-archive-archive/kernel/el7/x86_64/RPMS/) 可以到这里下载

```shell
# 下载kernel和kernel-devel
$ wget http://mirrors.coreix.net/elrepo-archive-archive/kernel/el7/x86_64/RPMS/kernel-lt-4.4.169-1.el7.elrepo.x86_64.rpm
$ wget http://mirrors.coreix.net/elrepo-archive-archive/kernel/el7/x86_64/RPMS/kernel-lt-devel-4.4.169-1.el7.elrepo.x86_64.rpm

$ yum install kernel-lt-devel-4.4.169-1.el7.elrepo.x86_64.rpm -y
$ yum install kernel-lt-4.4.169-1.el7.elrepo.x86_64.rpm -y

```

  

### 设置启动

```shell
$ awk -F\' '$1=="menuentry " {print $2}' /etc/grub2.cfg
$ grub2-set-default 1
$ reboot
```

  

重启过后可以看看升级是否成功，然后可以按`方案一`验证一下kmem是否关闭。

​  

当然升级内核除了使用rpm安装，还可以使用源码安装，只是rpm安装简单快捷一点。