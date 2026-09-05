# 安装Kubernets集群

> 分类：Kubernetes / 第2章：kubeadm集群安装部署
> 原文：https://www.cuiliangblog.cn/detail/section/15188146
> 来源：崔亮的博客

---

# kubeadm部署集群(1.20之前)
> 以下操作在master节点执行
>

## 配置文件创建集群
+ 获取默认的初始化参数文件

`# kubeadm config print init-defaults > kubeadm-conf.yaml ` 

+ 配置kubeadm-conf.yaml初始化文件

```yaml
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
  advertiseAddress: 192.168.10.10 # master节点ip地址，如果 Master 有多个interface，建议明确指定，
  bindPort: 6443
nodeRegistration:
  criSocket: /var/run/dockershim.sock
  name: k8s-master # master节点主机名
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
imageRepository: k8s.gcr.io
kind: ClusterConfiguration
kubernetesVersion: v1.19.16 # k8s安装版本
imageRepository: "registry.aliyuncs.com/google_containers" # 将其指定为阿里云镜像地址
networking:
  dnsDomain: cluster.local
  podSubnet: "10.244.0.0/16" #Kubernetes 支持多种网络方案，而且不同网络方案对--pod-network-cidr 有自己的要求，这里设置为 10.244.0.0/16 是因为我们将使用flannel 网络方案，必须设置成这个 CIDR。
  serviceSubnet: 10.96.0.0/12
scheduler: {}
---
apiVersion: kubeproxy.config.k8s.io/v1alpha1
kind: KubeProxyConfiguration
featureGates:
  SupportIPVSProxyMode: true
mode: ipvs
```

+ 指定配置文件创建k8s集群

`kubeadm init --config=kubeadm-conf.yaml --v=5` 

## 命令行创建k8s集群
`[root@master ~]# kubeadm init --apiserver-advertise-address=192.168.10.100 --image-repository registry.aliyuncs.com/google_containers --kubernetes-version v1.19.15 --pod-network-cidr=10.244.0.0/16` 

+ --apiserver-advertise-address  
指明用 Master 的哪个 interface 与 Cluster 的其他节点通信。如果 Master 有多个interface，建议明确指定，如果不指定，kubeadm 会自动选择有默认网关的interface。
+ --pod-network-cidr  
指定 Pod 网络的范围。Kubernetes 支持多种网络方案，而且不同网络方案对--pod-network-cidr 有自己的要求，这里设置为 10.244.0.0/16 是因为我们将使用flannel 网络方案，必须设置成这个 CIDR。
+ --image-repository  
Kubenetes默认Registries地址是 k8s.gcr.io，在国内并不能访问gcr.io，在1.13版本中我们可以增加–image-repository参数，默认值是k8s.gcr.io，将其指定为阿里云镜像地址：registry.aliyuncs.com/google_containers。
+ --kubernetes-version=v1.19.15  
关闭版本探测，因为它的默认值是stable-1，会导致从[https://dl.k8s.io/release/stable-1.txt](https://dl.k8s.io/release/stable-1.txt)下载最新的版本号

执行完毕后控制台打印以下信息：

```bash
Your Kubernetes control-plane has initialized successfully!

To start using your cluster, you need to run the following as a regular user:

mkdir -p $HOME/.kube
sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
sudo chown $(id -u):$(id -g) $HOME/.kube/config

You should now deploy a pod network to the cluster.
Run "kubectl apply -f [podnetwork].yaml" with one of the options listed at:
https://kubernetes.io/docs/concepts/cluster-administration/addons/

Then you can join any number of worker nodes by running the following on each as root:

kubeadm join 192.168.10.10:6443 --token abcdef.0123456789abcdef \
--discovery-token-ca-cert-hash sha256:1f0931588ac578637042e96ebede6c086a36105ceb4cdb65399b6f315650b996 
```

## 根据提示初始化kubectl
```bash
[root@k8s-master k8s-install]# mkdir -p $HOME/.kube
[root@k8s-master k8s-install]# cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
[root@k8s-master k8s-install]# chown $(id -u):$(id -g) $HOME/.kube/config
```

## 启用 kubectl 命令自动补全功能
```bash
[root@k8s-master k8s-install]# yum -y install bash-completion
[root@k8s-master k8s-install]# echo "source <(kubectl completion bash)" >> ~/.bash_profile 
[root@k8s-master k8s-install]# source ~/.bash_profile 
```

## 测试kubectl
```bash
[root@k8s-master k8s-install]# kubectl get node
NAME         STATUS     ROLES                  AGE   VERSION
k8s-master   NotReady   control-plane,master   46s   v1.19.16
```

# kubeadm部署集群(1.20之后)
## 变化说明
从1.20开始，开启ipvs配置字段发生了变化，访问官方查看最新版本ipvs开启的正确配置,通过[https://github.com/kubernetes/kubernetes/blob/master/pkg/proxy/ipvs/README.md](https://github.com/kubernetes/kubernetes/blob/master/pkg/proxy/ipvs/README.md)可以看到官方说明

从1.22开始，推荐使用containerd作为容器运行时。

## init配置文件
```yaml
# cat kubeadm-conf.yaml 
apiVersion: kubeadm.k8s.io/v1beta3
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
  advertiseAddress: 192.168.10.10  #修改为控制节点IP（VIP）
  bindPort: 6443
nodeRegistration:
  criSocket: unix:///run/containerd/containerd.sock  #使用containerd为容器运行时
	# criSocket: /var/run/dockershim.sock  #使用docker为容器运行时
  imagePullPolicy: IfNotPresent
  name: k8s-master     #修改为控制节点主机名
  taints: null
---
apiServer:
  timeoutForControlPlane: 4m0s
apiVersion: kubeadm.k8s.io/v1beta3
certificatesDir: /etc/kubernetes/pki
clusterName: kubernetes
controllerManager: {}
dns: {}
etcd:
  local:
    dataDir: /var/lib/etcd
imageRepository: registry.aliyuncs.com/google_containers  #修改为阿里镜像地址
kind: ClusterConfiguration
kubernetesVersion: 1.24.13  #版本
networking:
  dnsDomain: cluster.local
  podSubnet: 10.244.0.0/16   #指定Pod网段
  serviceSubnet: 10.96.0.0/12  #指定Service网段
scheduler: {}
---
apiVersion: kubeproxy.config.k8s.io/v1alpha1
kind:  KubeProxyConfiguration
mode: ipvs
---
apiVersion: kubelet.config.k8s.io/v1beta1
kind: KubeletConfiguration
cgroupDriver: systemd
```

+ 如果初始化时出现以下报错，先停止master节点的kubelet

```bash
error execution phase preflight: [preflight] Some fatal errors occurred:
        [ERROR Port-10250]: Port 10250 is in use
```

`[root@k8s-master k8s-install]# systemctl stop kubelet`

# 初始化失败解决
如果因为配置文件异常导致集群初始化失败，可执行如下命令清理环境后重新初始化

```yaml
# kubeadm reset -f
# rm -rf /etc/kubernetes /var/lib/etcd ~/.kube
# rm -rf $HOME/.kube/config 
```

# 启用基于flannel的Pod网络
项目地址：[https://github.com/flannel-io/flannel](https://github.com/flannel-io/flannel)

## 下载配置文件
```bash
[root@master ~]# wget https://github.com/flannel-io/flannel/releases/latest/download/kube-flannel.yml 
```

## 启用flannel
```bash
[root@master ~]# kubectl apply -f kube-flannel.yml  
# 如果机器有多块物理网卡，需要指定网卡名称
containers:
- name: kube-flannel
    - args:
    - --ip-masq
    - --kube-subnet-mgr
    - --iface=bond0 # 添加这行
```

## 验证操作
```bash
[root@k8s-master k8s-install]# kubectl get pods -A
NAMESPACE      NAME                                 READY   STATUS    RESTARTS   AGE
kube-flannel   kube-flannel-ds-5tjkb                1/1     Running   0          9m1s
kube-system    coredns-6d56c8448f-vnrqf             1/1     Running   0          19m
kube-system    coredns-6d56c8448f-x9q75             1/1     Running   0          19m
kube-system    etcd-k8s-master                      1/1     Running   0          20m
kube-system    kube-apiserver-k8s-master            1/1     Running   0          20m
kube-system    kube-controller-manager-k8s-master   1/1     Running   0          20m
kube-system    kube-proxy-9df97                     1/1     Running   0          19m
kube-system    kube-scheduler-k8s-master            1/1     Running   0          20m
```

# 其他node节点加入集群
## 将节点加入到集群
```bash
[root@k8s-work1 ~]# kubeadm join 192.168.10.10:6443 --token abcdef.0123456789abcdef --discovery-token-ca-cert-hash sha256:1f0931588ac578637042e96ebede6c086a36105ceb4cdb65399b6f315650b996 
```

## 查看集群信息
```bash
[root@k8s-master ~]# kubectl get node
NAME         STATUS   ROLES                  AGE     VERSION
k8s-master   Ready    control-plane,master   5m26s   v1.24.13
k8s-work1    Ready    <none>                 3m39s   v1.24.13
k8s-work2    Ready    <none>                 3m48s   v1.24.13
[root@k8s-master ~]# kubectl get pod -A
NAMESPACE      NAME                                 READY   STATUS    RESTARTS   AGE
kube-flannel   kube-flannel-ds-22hrr                1/1     Running   2          17m
kube-flannel   kube-flannel-ds-5tjkb                1/1     Running   2          36m
kube-flannel   kube-flannel-ds-kmtnk                1/1     Running   0          84s
kube-system    coredns-6d56c8448f-vnrqf             1/1     Running   3          47m
kube-system    coredns-6d56c8448f-x9q75             1/1     Running   2          47m
kube-system    etcd-k8s-master                      1/1     Running   2          47m
kube-system    kube-apiserver-k8s-master            1/1     Running   2          47m
kube-system    kube-controller-manager-k8s-master   1/1     Running   2          47m
kube-system    kube-proxy-6wmsl                     1/1     Running   2          17m
kube-system    kube-proxy-9df97                     1/1     Running   2          47m
kube-system    kube-proxy-fkkm6                     1/1     Running   0          84s
kube-system    kube-scheduler-k8s-master            1/1     Running   2          47m
```


