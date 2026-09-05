## 前言

去年12月份，当Kubernetes社区宣布1.20版本之后会逐步弃用`dockershim`，当时也有很多自媒体在宣传Kubernetes弃用Docker。其实，我觉得这是一种误导，也许仅仅是为了蹭热度。

  

`dockershim`是Kubernetes的一个组件，其作用是为了操作Docker。Docker是在2013年面世的，而Kubernetes是在2016年，所以Docker刚开始并没有想到编排，也不会知道会出现Kubernetes这个庞然大物（它要是知道，也不会败的那么快...）。但是Kubernetes在创建的时候就是以Docker作为容器运行时，很多操作逻辑都是针对的Docker，随着社区越来越健壮，为了兼容更多的容器运行时，才将Docker的相关逻辑独立出来组成了`dockershim`。

  

正因为这样，只要Kubernetes的任何变动或者Docker的任何变动，都必须维护`dockershim`，这样才能保证足够的支持，但是通过`dockershim`操作Docker，其本质还是操作Docker的底层运行时`Containerd`，而且`Containerd`自身也是支持`CRI`（Container Runtime Interface），那为什么还要绕一层Docker呢？是不是可以直接通过`CRI`和`Containerd`进行交互？这也是社区希望启动`dockershim`的原因之一吧。

  

再来看看启动`dockershim`究竟对用户、对维护者有多少影响。

  

对上层用户来说，其实并没有影响，因为上层已经屏蔽调了这些细节，只管用就可以了。更多的影响只是针对我们这些YAML工程师，因为我们主要是考虑用哪个容器运行时，如果继续用Docker，以后版本升级有没有影响？如果不用Docker，维护的成本、复杂度、学习成本会不会增加？其实我们是想多了，事情也远没那么复杂，喜欢用docker的依旧可以用docker，想用containerd的就用containerd，改动也不大，后面也有相关的部署文档。而且也只是kubernetes社区不再维护dockershim而已，Mirantis 和 Docker 已经决定之后共同合作维护 dockershim 组件，也就是说dockershim依然可以作为连接docker的桥梁，只是从kubernetes内置携带改成独立的而已。

  

那什么是containerd呢？

  

Containerd是从Docker中分离的一个项目，旨在为Kubernetes提供容器运行时，负责管理镜像和容器的生命周期。不过Containerd是可以抛开Docker独立工作的。它的特性如下：

-   支持OCI镜像规范，也就是runc
-   支持OCI运行时规范
-   支持镜像的pull
-   支持容器网络管理
-   存储支持多租户
-   支持容器运行时和容器的生命周期管理
-   支持管理网络名称空间

  

Containerd和Docker在命令使用上的一些区别主要如下：

<table class="lake-table" style="width: 687px;"><colgroup><col span="1" width="229" /><col span="1" width="229" /><col span="1" width="229" /></colgroup><tbody><tr style="height: 33px;"><td><p data-lake-id="f371bd6db5133a384f59e50c85531cfa"> 功能 </p></td><td><p data-lake-id="eb089a15282bdcbf836d7af041e641ca"> Docker </p></td><td><p data-lake-id="9fb457a55073eda34fc581a060cf185b"> Containerd </p></td></tr><tr style="height: 33px;"><td style="text-align: left; vertical-align: top; color: #666666;">显示本地镜像列表</td><td style="text-align: left; vertical-align: top; color: #666666;">docker images</td><td style="text-align: left; vertical-align: top; color: #666666;">crictl images</td></tr><tr style="height: 33px;"><td style="text-align: left; vertical-align: top; color: #666666;">下载镜像</td><td style="text-align: left; vertical-align: top; color: #666666;">docker pull</td><td style="text-align: left; vertical-align: top; color: #666666;">crictl pull</td></tr><tr><td colspan="1" style="text-align: left; vertical-align: top; color: #666666;">上传镜像</td><td colspan="1" style="text-align: left; vertical-align: top; color: #666666;">docker push</td><td colspan="1" style="text-align: left; vertical-align: top; color: #666666;">无</td></tr><tr><td colspan="1" style="text-align: left; vertical-align: top; color: #666666;">删除本地镜像</td><td colspan="1" style="text-align: left; vertical-align: top; color: #666666;">docker rmi</td><td colspan="1" style="text-align: left; vertical-align: top; color: #666666;">crictl rmi</td></tr><tr><td colspan="1" style="text-align: left; vertical-align: top; color: #666666;">查看镜像详情</td><td colspan="1" style="text-align: left; vertical-align: top; color: #666666;">docker inspect IMAGE-ID</td><td colspan="1" style="text-align: left; vertical-align: top; color: #666666;">crictl inspecti IMAGE-ID</td></tr><tr><td colspan="1" style="text-align: left; vertical-align: top; color: #666666;">显示容器列表</td><td colspan="1" style="text-align: left; vertical-align: top; color: #666666;">docker ps</td><td colspan="1" style="text-align: left; vertical-align: top; color: #666666;">crictl ps</td></tr><tr><td colspan="1" style="text-align: left; vertical-align: top; color: #666666;">创建容器</td><td colspan="1" style="text-align: left; vertical-align: top; color: #666666;">docker create</td><td colspan="1" style="text-align: left; vertical-align: top; color: #666666;">crictl create</td></tr><tr><td colspan="1" style="text-align: left; vertical-align: top; color: #666666;">启动容器</td><td colspan="1" style="text-align: left; vertical-align: top; color: #666666;">docker start</td><td colspan="1" style="text-align: left; vertical-align: top; color: #666666;">crictl start</td></tr><tr><td colspan="1" style="text-align: left; vertical-align: top; color: #666666;">停止容器</td><td colspan="1" style="text-align: left; vertical-align: top; color: #666666;">docker stop</td><td colspan="1" style="text-align: left; vertical-align: top; color: #666666;">crictl stop</td></tr><tr><td colspan="1" style="text-align: left; vertical-align: top; color: #666666;">删除容器</td><td colspan="1" style="text-align: left; vertical-align: top; color: #666666;">docker rm</td><td colspan="1" style="text-align: left; vertical-align: top; color: #666666;">crictl rm</td></tr><tr><td colspan="1" style="text-align: left; vertical-align: top; color: #666666;">查看容器详情</td><td colspan="1" style="text-align: left; vertical-align: top; color: #666666;">docker inspect</td><td colspan="1" style="text-align: left; vertical-align: top; color: #666666;">crictl inspect</td></tr><tr><td colspan="1" style="text-align: left; vertical-align: top; color: #666666;">attach</td><td colspan="1" style="text-align: left; vertical-align: top; color: #666666;">docker attach</td><td colspan="1" style="text-align: left; vertical-align: top; color: #666666;">crictl attach</td></tr><tr><td colspan="1" style="text-align: left; vertical-align: top; color: #666666;">exec</td><td colspan="1" style="text-align: left; vertical-align: top; color: #666666;">docker exec</td><td colspan="1" style="text-align: left; vertical-align: top; color: #666666;">crictl exec</td></tr><tr><td colspan="1" style="text-align: left; vertical-align: top; color: #666666;">logs</td><td colspan="1" style="text-align: left; vertical-align: top; color: #666666;">docker logs</td><td colspan="1" style="text-align: left; vertical-align: top; color: #666666;">crictl logs</td></tr><tr><td colspan="1" style="text-align: left; vertical-align: top; color: #666666;">stats</td><td colspan="1" style="text-align: left; vertical-align: top; color: #666666;">docker stats</td><td colspan="1" style="text-align: left; vertical-align: top; color: #666666;">crictl stats</td></tr></tbody></table>

可以看到使用方式大同小异。

  

下面介绍一下使用kubeadm安装K8S集群，并使用containerd作为容器运行时的具体安装步骤。

  

## 环境说明

### 主机节点

<table class="lake-table" style="width: 430px;"><colgroup><col span="1" width="143.1999969482422" /><col span="1" width="143.1999969482422" /><col span="1" width="144" /></colgroup><tbody><tr style="height: 33px;"><td><p data-lake-id="6e137335224a5e0507d4fe695ff18fca"> IP地址 </p></td><td><p data-lake-id="5046631d2fdcfb6a4e049e44abe99c58"> 系统 </p></td><td><p data-lake-id="4ae76502f8d18c2b1ae279afb2206657"> 内核 </p></td></tr><tr style="height: 33px;"><td><p data-lake-id="2e257cc9531d7841c0452e53c516e5a7">192.168.0.5</p></td><td><p data-lake-id="c8a82df712f816962a97880e0aff9fc5_p_0">CentOS7.6</p></td><td><p data-lake-id="51d6cd746c79a513e0ce3a75ec25e3f9_p_0">3.10</p></td></tr><tr style="height: 33px;"><td><p data-lake-id="f5288918051daac58a0cdf74b1d666a8_p_0">192.168.0.125</p></td><td><p data-lake-id="c8a82df712f816962a97880e0aff9fc5_p_0">CentOS7.6</p></td><td><p data-lake-id="51d6cd746c79a513e0ce3a75ec25e3f9_p_0">3.10</p></td></tr></tbody></table>

### 

  

软件说明

<table class="lake-table" style="width: 430px;"><colgroup><col span="1" width="215" /><col span="1" width="215" /></colgroup><tbody><tr style="height: 33px;"><td><p data-lake-id="caaf75449adfd2e5e60c78ba443b4f27"> 软件 </p></td><td><p data-lake-id="ff5262d46ca3635fdb45a8afc7092db3"> 版本 </p></td></tr><tr style="height: 33px;"><td><p data-lake-id="ae23fc5785fa83b81eb2e3eae90616d1_p_0">kubernetes</p></td><td><p data-lake-id="f5288918051daac58a0cdf74b1d666a8_p_0">1.20.5</p></td></tr><tr style="height: 33px;"><td><p data-lake-id="5e883a4fd23cfa7786abe4795391aff9_p_0">containerd</p></td><td><p data-lake-id="f5288918051daac58a0cdf74b1d666a8_p_0">1.4.4</p></td></tr></tbody></table>

  

## 环境准备

（1）在每个节点上添加 hosts 信息：

$ cat /etc/hosts

```python
192.168.0.5 k8s-master
192.168.0.125 k8s-node01
```

  

（2）禁用防火墙：

```python
$ systemctl stop firewalld
$ systemctl disable firewalld
```

  

（3）禁用SELINUX：

```python
$ setenforce 0
$ cat /etc/selinux/config
SELINUX=disabled
```

  

（4）创建/etc/sysctl.d/k8s.conf文件，添加如下内容：

```python
net.bridge.bridge-nf-call-ip6tables = 1
net.bridge.bridge-nf-call-iptables = 1
net.ipv4.ip_forward = 1
```

  

（5）执行如下命令使修改生效：

```python
$ modprobe br_netfilter
$ sysctl -p /etc/sysctl.d/k8s.conf
```

  

（6）安装 ipvs

```python
$ cat > /etc/sysconfig/modules/ipvs.modules <<EOF
#!/bin/bash
modprobe -- ip_vs
modprobe -- ip_vs_rr
modprobe -- ip_vs_wrr
modprobe -- ip_vs_sh
modprobe -- nf_conntrack_ipv4
EOF
$ chmod 755 /etc/sysconfig/modules/ipvs.modules && bash /etc/sysconfig/modules/ipvs.modules && lsmod | grep -e ip_vs -e nf_conntrack_ipv4
```

上面脚本创建了的/etc/sysconfig/modules/ipvs.modules文件，保证在节点重启后能自动加载所需模块。使用lsmod | grep -e ip\_vs -e nf\_conntrack\_ipv4命令查看是否已经正确加载所需的内核模块。

  

（7）安装了 ipset 软件包：

```python
$ yum install ipset -y
```

  

为了便于查看 ipvs 的代理规则，最好安装一下管理工具 ipvsadm：

```python
$ yum install ipvsadm -y
```

  

（8）同步服务器时间

```python
$ yum install chrony -y
$ systemctl enable chronyd
$ systemctl start chronyd
$ chronyc sources
```

  

（9）关闭 swap 分区：

```python
$ swapoff -a
```

  

（10）修改/etc/fstab文件，注释掉 SWAP 的自动挂载，使用free -m确认 swap 已经关闭。swappiness 参数调整，修改/etc/sysctl.d/k8s.conf添加下面一行：

```python
vm.swappiness=0
```

执行sysctl -p /etc/sysctl.d/k8s.conf使修改生效。

  

（11）接下来可以安装 Containerd

```python
$ yum install -y yum-utils \
 device-mapper-persistent-data \
 lvm2
$ yum-config-manager \
 --add-repo \
 https://download.docker.com/linux/centos/docker-ce.repo
$ yum list | grep containerd
```

  

可以选择安装一个版本，比如我们这里安装最新版本：

```python
$ yum install containerd.io-1.4.4 -y
```

  

（12）创建containerd配置文件：

```python
mkdir -p /etc/containerd
containerd config default > /etc/containerd/config.toml
# 替换配置文件
sed -i "s#k8s.gcr.io#registry.cn-hangzhou.aliyuncs.com/google_containers#g"  /etc/containerd/config.toml
sed -i '/containerd.runtimes.runc.options/a\ \ \ \ \ \ \ \ \ \ \ \ SystemdCgroup = true' /etc/containerd/config.toml
sed -i "s#https://registry-1.docker.io#https://registry.cn-hangzhou.aliyuncs.com#g"  /etc/containerd/config.toml
```

  

（13）启动Containerd:

```python
systemctl daemon-reload
systemctl enable containerd
systemctl restart containerd
```

  

在确保 Containerd安装完成后，上面的相关环境配置也完成了，现在我们就可以来安装 Kubeadm 了，我们这里是通过指定yum 源的方式来进行安装，使用阿里云的源进行安装：

```python
cat <<EOF > /etc/yum.repos.d/kubernetes.repo
[kubernetes]
name=Kubernetes
baseurl=http://mirrors.aliyun.com/kubernetes/yum/repos/kubernetes-el7-x86_64
enabled=1
gpgcheck=0
repo_gpgcheck=0
gpgkey=http://mirrors.aliyun.com/kubernetes/yum/doc/yum-key.gpg
 http://mirrors.aliyun.com/kubernetes/yum/doc/rpm-package-key.gpg
EOF
```

  

然后安装 kubeadm、kubelet、kubectl（我安装的是最新版，有版本要求自己设定版本）：

```python
$  yum install -y kubelet-1.20.5 kubeadm-1.20.5 kubectl-1.20.5
```

  

设置运行时：

```python
$ crictl config runtime-endpoint /run/containerd/containerd.sock
```

  

可以看到我们这里安装的是 v1.20.5版本，然后将 kubelet 设置成开机启动：

```python
$ systemctl daemon-reload
$ systemctl enable kubelet && systemctl start kubelet
```

> **到这里为止上面所有的操作都需要在所有节点执行配置。**

## 初始化集群

### 初始化Master

然后接下来在 master 节点配置 kubeadm 初始化文件，可以通过如下命令导出默认的初始化配置：

```python
$ kubeadm config print init-defaults > kubeadm.yaml
```

  

然后根据我们自己的需求修改配置，比如修改 imageRepository 的值，kube-proxy 的模式为 ipvs，需要注意的是由于我们使用的containerd作为运行时，所以在初始化节点的时候需要指定`cgroupDriver`为`systemd`【1】

  

```python
apiVersion: kubeadm.k8s.io/v1beta2
bootstrapTokens:
- groups:
  - system:bootstrappers:kubeadm:default-node-token
  token: abcdef.0123456789abcdef
  ttl: 24h0m0s
  usages:
  - signing
  - authentication
kind: InitConfiguration
localAPIEndpoint:
  advertiseAddress: 192.168.0.5 
  bindPort: 6443
nodeRegistration:
  criSocket: /run/containerd/containerd.sock 
  name: k8s-master
  taints:
  - effect: NoSchedule
    key: node-role.kubernetes.io/master
---
apiServer:
  timeoutForControlPlane: 4m0s
apiVersion: kubeadm.k8s.io/v1beta2
certificatesDir: /etc/kubernetes/pki
clusterName: kubernetes
controllerManager: {}
dns:
  type: CoreDNS
etcd:
  local:
    dataDir: /var/lib/etcd
imageRepository: registry.cn-hangzhou.aliyuncs.com/google_containers
kind: ClusterConfiguration
kubernetesVersion: v1.20.5
networking:
  dnsDomain: cluster.local
  podSubnet: 172.16.0.0/16
  serviceSubnet: 10.96.0.0/12
scheduler: {}
---
apiVersion: kubeproxy.config.k8s.io/v1alpha1
kind: KubeProxyConfiguration
mode: ipvs
---
apiVersion: kubelet.config.k8s.io/v1beta1
kind: KubeletConfiguration
cgroupDriver: systemd
```

  

然后使用上面的配置文件进行初始化：

```python
$ kubeadm init --config=kubeadm.yaml

[init] Using Kubernetes version: v1.20.5
[preflight] Running pre-flight checks
[preflight] Pulling images required for setting up a Kubernetes cluster
[preflight] This might take a minute or two, depending on the speed of your internet connection
[preflight] You can also perform this action in beforehand using 'kubeadm config images pull'
[certs] Using certificateDir folder "/etc/kubernetes/pki"
[certs] Generating "ca" certificate and key
[certs] Generating "apiserver" certificate and key
[certs] apiserver serving cert is signed for DNS names [k8s-master kubernetes kubernetes.default kubernetes.default.svc kubernetes.default.svc.cluster.local] and IPs [10.96.0.1 192.168.0.5]
[certs] Generating "apiserver-kubelet-client" certificate and key
[certs] Generating "front-proxy-ca" certificate and key
[certs] Generating "front-proxy-client" certificate and key
[certs] Generating "etcd/ca" certificate and key
[certs] Generating "etcd/server" certificate and key
[certs] etcd/server serving cert is signed for DNS names [k8s-master localhost] and IPs [192.168.0.5 127.0.0.1 ::1]
[certs] Generating "etcd/peer" certificate and key
[certs] etcd/peer serving cert is signed for DNS names [k8s-master localhost] and IPs [192.168.0.5 127.0.0.1 ::1]
[certs] Generating "etcd/healthcheck-client" certificate and key
[certs] Generating "apiserver-etcd-client" certificate and key
[certs] Generating "sa" key and public key
[kubeconfig] Using kubeconfig folder "/etc/kubernetes"
[kubeconfig] Writing "admin.conf" kubeconfig file
[kubeconfig] Writing "kubelet.conf" kubeconfig file
[kubeconfig] Writing "controller-manager.conf" kubeconfig file
[kubeconfig] Writing "scheduler.conf" kubeconfig file
[kubelet-start] Writing kubelet environment file with flags to file "/var/lib/kubelet/kubeadm-flags.env"
[kubelet-start] Writing kubelet configuration to file "/var/lib/kubelet/config.yaml"
[kubelet-start] Starting the kubelet
[control-plane] Using manifest folder "/etc/kubernetes/manifests"
[control-plane] Creating static Pod manifest for "kube-apiserver"
[control-plane] Creating static Pod manifest for "kube-controller-manager"
[control-plane] Creating static Pod manifest for "kube-scheduler"
[etcd] Creating static Pod manifest for local etcd in "/etc/kubernetes/manifests"
[wait-control-plane] Waiting for the kubelet to boot up the control plane as static Pods from directory "/etc/kubernetes/manifests". This can take up to 4m0s
[kubelet-check] Initial timeout of 40s passed.
[apiclient] All control plane components are healthy after 70.001862 seconds
[upload-config] Storing the configuration used in ConfigMap "kubeadm-config" in the "kube-system" Namespace
[kubelet] Creating a ConfigMap "kubelet-config-1.20" in namespace kube-system with the configuration for the kubelets in the cluster
[upload-certs] Skipping phase. Please see --upload-certs
[mark-control-plane] Marking the node k8s-master as control-plane by adding the labels "node-role.kubernetes.io/master=''" and "node-role.kubernetes.io/control-plane='' (deprecated)"
[mark-control-plane] Marking the node k8s-master as control-plane by adding the taints [node-role.kubernetes.io/master:NoSchedule]
[bootstrap-token] Using token: abcdef.0123456789abcdef
[bootstrap-token] Configuring bootstrap tokens, cluster-info ConfigMap, RBAC Roles
[bootstrap-token] configured RBAC rules to allow Node Bootstrap tokens to get nodes
[bootstrap-token] configured RBAC rules to allow Node Bootstrap tokens to post CSRs in order for nodes to get long term certificate credentials
[bootstrap-token] configured RBAC rules to allow the csrapprover controller automatically approve CSRs from a Node Bootstrap Token
[bootstrap-token] configured RBAC rules to allow certificate rotation for all node client certificates in the cluster
[bootstrap-token] Creating the "cluster-info" ConfigMap in the "kube-public" namespace
[kubelet-finalize] Updating "/etc/kubernetes/kubelet.conf" to point to a rotatable kubelet client certificate and key
[addons] Applied essential addon: CoreDNS
[addons] Applied essential addon: kube-proxy

Your Kubernetes control-plane has initialized successfully!

To start using your cluster, you need to run the following as a regular user:

  mkdir -p $HOME/.kube
  sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
  sudo chown $(id -u):$(id -g) $HOME/.kube/config

Alternatively, if you are the root user, you can run:

  export KUBECONFIG=/etc/kubernetes/admin.conf

You should now deploy a pod network to the cluster.
Run "kubectl apply -f [podnetwork].yaml" with one of the options listed at:
  https://kubernetes.io/docs/concepts/cluster-administration/addons/

Then you can join any number of worker nodes by running the following on each as root:

kubeadm join 192.168.0.5:6443 --token abcdef.0123456789abcdef \
    --discovery-token-ca-cert-hash sha256:446623b965cdb0289c687e74af53f9e9c2063e854a42ee36be9aa249d3f0ccec
```

  

拷贝 kubeconfig 文件

```python
$ mkdir -p $HOME/.kube
$ sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
$ sudo chown $(id -u):$(id -g) $HOME/.kube/config
```

### 添加节点

记住初始化集群上面的配置和操作要提前做好，将 master 节点上面的 $HOME/.kube/config 文件拷贝到 node 节点对应的文件中，安装 kubeadm、kubelet、kubectl，然后执行上面初始化完成后提示的 join 命令即可：

```python
# kubeadm join 192.168.0.5:6443 --token abcdef.0123456789abcdef \
>     --discovery-token-ca-cert-hash sha256:446623b965cdb0289c687e74af53f9e9c2063e854a42ee36be9aa249d3f0ccec 
[preflight] Running pre-flight checks
[preflight] Reading configuration from the cluster...
[preflight] FYI: You can look at this config file with 'kubectl -n kube-system get cm kubeadm-config -o yaml'
[kubelet-start] Writing kubelet configuration to file "/var/lib/kubelet/config.yaml"
[kubelet-start] Writing kubelet environment file with flags to file "/var/lib/kubelet/kubeadm-flags.env"
[kubelet-start] Starting the kubelet
[kubelet-start] Waiting for the kubelet to perform the TLS Bootstrap...

This node has joined the cluster:
* Certificate signing request was sent to apiserver and a response was received.
* The Kubelet was informed of the new secure connection details.

Run 'kubectl get nodes' on the control-plane to see this node join the cluster.
```

> 如果忘记了上面的 join 命令可以使用命令kubeadm token create --print-join-command重新获取。

  

执行成功后运行 get nodes 命令：

```python
$ kubectl get no
NAME         STATUS     ROLES                  AGE   VERSION
k8s-master   NotReady   control-plane,master   29m   v1.20.5
k8s-node01   NotReady   <none>                 28m   v1.20.5
```

可以看到是 NotReady 状态，这是因为还没有安装网络插件，接下来安装网络插件，可以在文档 [https://kubernetes.io/docs/setup/production-environment/tools/kubeadm/create-cluster-kubeadm/](https://kubernetes.io/docs/setup/production-environment/tools/kubeadm/create-cluster-kubeadm/) 中选择我们自己的网络插件，这里我们安装 calio:

```python
$ wget https://docs.projectcalico.org/v3.8/manifests/calico.yaml
```

\# 因为有节点是多网卡，所以需要在资源清单文件中指定内网网卡

$ vi calico.yaml

```python
......
spec:
 containers:
 - env:
 - name: DATASTORE_TYPE
   value: kubernetes
 - name: IP_AUTODETECTION_METHOD # DaemonSet中添加该环境变量
   value: interface=eth0 # 指定内网网卡
 - name: WAIT_FOR_DATASTORE
   value: "true"
- name: CALICO_IPV4POOL_CIDR # 由于在init的时候配置的172网段，所以这里需要修改
  value: "172.16.0.0/16"

......
```

  

安装calico网络插件

```python
$ kubectl apply -f calico.yaml
```

  

隔一会儿查看 Pod 运行状态：

```python
# kubectl get pod -n kube-system 
NAME                                      READY   STATUS              RESTARTS   AGE
calico-kube-controllers-bcc6f659f-zmw8n   0/1     ContainerCreating   0          7m58s
calico-node-c4vv7                         1/1     Running             0          7m58s
calico-node-dtw7g                         0/1     PodInitializing     0          7m58s
coredns-54d67798b7-mrj2b                  1/1     Running             0          46m
coredns-54d67798b7-p667d                  1/1     Running             0          46m
etcd-k8s-master                           1/1     Running             0          46m
kube-apiserver-k8s-master                 1/1     Running             0          46m
kube-controller-manager-k8s-master        1/1     Running             0          46m
kube-proxy-clf4s                          1/1     Running             0          45m
kube-proxy-mt7tt                          1/1     Running             0          46m
kube-scheduler-k8s-master                 1/1     Running             0          46m
```

  

网络插件运行成功了，node 状态也正常了：

```python
# kubectl get nodes 
NAME         STATUS   ROLES                  AGE   VERSION
k8s-master   Ready    control-plane,master   47m   v1.20.5
k8s-node01   Ready    <none>                 46m   v1.20.5
```

用同样的方法添加另外一个节点即可。

  

配置命令自动补全

  

```shell
yum install -y bash-completion
source /usr/share/bash-completion/bash_completion
source <(kubectl completion bash)
echo "source <(kubectl completion bash)" >> ~/.bashrc
```

  

## 踩坑

在1.20版本以上，当使用nfs做存储的时候，在创建PVC时，会报以下错误：

```yaml
I0323 08:41:25.264754       1 controller.go:987] provision "default/test-nfs-pvc2" class "nfs-client-storageclass": started
E0323 08:41:25.267631       1 controller.go:1004] provision "default/test-nfs-pvc2" class "nfs-client-storageclass": unexpected error getting claim reference: selfLink was empty, can't make reference
```

这是因为kubernetes1.20.0【3】废弃了`selfLink`，解决办法是重新加回来，如下在kube-apiserver.yaml中添加如下参数：

```yaml
$ vim /etc/kubernetes/manifests/kube-apiserver.yaml
# 增加一行
- --feature-gates=RemoveSelfLink=false
```

然后重新apply以下使之生效：

```yaml
kubectl apply -f /etc/kubernetes/manifests/kube-apiserver.yaml
```

  

## 参考文档

【1】：[https://github.com/containerd/containerd/issues/4857](https://github.com/containerd/containerd/issues/4857)

【2】：[https://github.com/containerd/containerd](https://github.com/containerd/containerd)

【3】：[https://github.com/kubernetes/kubernetes/blob/master/CHANGELOG/CHANGELOG-1.20.md](https://github.com/kubernetes/kubernetes/blob/master/CHANGELOG/CHANGELOG-1.20.md)