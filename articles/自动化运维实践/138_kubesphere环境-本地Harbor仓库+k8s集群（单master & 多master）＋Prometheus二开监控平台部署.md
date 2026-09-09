---
title: "kubesphere环境-本地Harbor仓库+k8s集群（单master & 多master）＋Prometheus二开监控平台部署"
---

**前言：半月前在公司生产环境上离线部署了k8s集群(二开版）+Prometheus（二开版）+Victoria Metrics+skywalking+自研版夜莺 监控平台的搭建，下面我租用3台华为云服务器演示部署kubesphere环境-本地Harbor仓库+k8s集群（单master节点 & 单master节点）+Prometheus监控部署。**

### 单master部署：

安装步骤：  
安装Docker  
安装Kubernetes  
安装KubeSphere前置环境  
安装KubeSphere

### 1.安装Docker

```
配置docker的yum源地址
yum -y install wget 
wget https://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo -O /etc/yum.repos.d/docker-ce.repo
yum provides docker-ce
安装指定的docker版本
yum install -y docker-ce-20.10.7 docker-ce-cli-20.10.7 containerd.io-1.4.6
# 启动&开机启动docker
systemctl enable docker --now
​
# docker加速配置
sudo mkdir -p /etc/docker
sudo tee /etc/docker/daemon.json <<-'EOF'
{
  "registry-mirrors": ["https://82m9ar63.mirror.aliyuncs.com"],
  "exec-opts": ["native.cgroupdriver=systemd"],
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "100m"
  },
  "storage-driver": "overlay2"
}
EOF
sudo systemctl daemon-reload
sudo systemctl restart docker
```

### 2.安装kubernetes环境

### 2.1、基本环境

```
#设置每个机器自己的hostname
hostnamectl set-hostname xxx
hostnamectl set-hostname k8s-master1  &&  bash
hostnamectl set-hostname k8s-node1 && bash
hostnamectl set-hostname k8s-node2 && bash

添加hosts解析（所有节点操作）
cat >> /etc/hosts << EOF
192.168.0.182  k8s-master1
192.168.0.145  k8s-node1
192.168.0.28   k8s-node2
EOF

# 将 SELinux 设置为 permissive 模式（相当于将其禁用）
sudo setenforce 0
sudo sed -i 's/^SELINUX=enforcing$/SELINUX=permissive/' /etc/selinux/config

#关闭swap
swapoff -a  
sed -ri 's/.*swap.*/#&/' /etc/fstab

#将桥接的IPv4流量传递到iptables的链：
vim etc/sysctl.d/k8s.conf
添加：
net.bridge.bridge-nf-call-ip6tables = 1
net.bridge.bridge-nf-call-iptables = 1

sysctl --system  

时间同步：
yum install ntpdate -y
ntpdate time.windows.com
```

### 2.2、安装kubelet、kubeadm、kubectl

```
配置kubelet kubeadm kubectl 的yum源
cat > /etc/yum.repos.d/kubernetes.repo << EOF
[kubernetes]
name=Kubernetes
baseurl=https://mirrors.aliyun.com/kubernetes/yum/repos/kubernetes-el7-x86_64
enabled=1
gpgcheck=0
repo_gpgcheck=0
gpgkey=https://mirrors.aliyun.com/kubernetes/yum/doc/yum-key.gpg https://mirrors.aliyun.com/kubernetes/yum/doc/rpm-package-key.gpg
EOF

安装指定版本的kubeadm kubectl kubelet
sudo yum install -y kubelet-1.20.9 kubeadm-1.20.9 kubectl-1.20.9

启动kubelet
systemctl enable kubelet
```

### 2.3.初始化master节点

### 2.3.1初始化

`kubeadm init --apiserver-advertise-address=192.168.0.182 --image-repository registry.aliyuncs.com/google_containers --kubernetes-version v1.20.9 --service-cidr=10.96.0.0/12 --pod-network-cidr=10.244.0.0/16 --ignore-preflight-errors=all`

**2.3.2记录关键的信息**  

```
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

kubeadm join 192.168.0.182:6443 --token nbm1b1.zbd9dx9c1yvp1ebn \
--discovery-token-ca-cert-hash sha256:98c66d83855f52326939d916c21fc254359c771285932d72d15733c3f4972f52
```

### 2.3.3、安装Calico网络插件

```
curl https://docs.projectcalico.org/manifests/calico.yaml -O
kubectl apply -f calico.yaml
```

### 2.3.4、加入worker节点

将master节点初始化的结果命令如下，复制到各个节点  
`kubeadm join 192.168.0.182:6443 --token nbm1b1.zbd9dx9c1yvp1ebn --discovery-token-ca-cert-hash sha256:98c66d83855f52326939d916c21fc254359c771285932d72d15733c3f4972f52`  

### 3、安装KubeSphere前置环境

### 3.1、nfs文件系统

### 3.1.1、安装nfs-server

```
# 在每个机器。
yum install -y nfs-utils

## 创建了一个存储类,文件命名为sc.yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: nfs-storage
  annotations:
    storageclass.kubernetes.io/is-default-class: "true"
provisioner: k8s-sigs.io/nfs-subdir-external-provisioner
parameters:
  archiveOnDelete: "true"  ## 删除pv的时候，pv的内容是否要备份

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nfs-client-provisioner
  labels:
    app: nfs-client-provisioner
  # replace with namespace where provisioner is deployed
  namespace: default
spec:
  replicas: 1
  strategy:
    type: Recreate
  selector:
    matchLabels:
      app: nfs-client-provisioner
  template:
    metadata:
      labels:
        app: nfs-client-provisioner
    spec:
      serviceAccountName: nfs-client-provisioner
      containers:
        - name: nfs-client-provisioner
          image: registry.cn-hangzhou.aliyuncs.com/lfy_k8s_images/nfs-subdir-external-provisioner:v4.0.2
          # resources:
          #    limits:
          #      cpu: 10m
          #    requests:
          #      cpu: 10m
          volumeMounts:
            - name: nfs-client-root
              mountPath: /persistentvolumes
          env:
            - name: PROVISIONER_NAME
              value: k8s-sigs.io/nfs-subdir-external-provisioner
            - name: NFS_SERVER
              value: 192.168.0.182 ## 指定自己nfs服务器地址
            - name: NFS_PATH  
              value: /nfs/data  ## nfs服务器共享的目录
      volumes:
        - name: nfs-client-root
          nfs:
            server: 192.168.0.182
            path: /nfs/data
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: nfs-client-provisioner
  # replace with namespace where provisioner is deployed
  namespace: default
---
kind: ClusterRole
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  name: nfs-client-provisioner-runner
rules:
  - apiGroups: [""]
    resources: ["nodes"]
    verbs: ["get", "list", "watch"]
  - apiGroups: [""]
    resources: ["persistentvolumes"]
    verbs: ["get", "list", "watch", "create", "delete"]
  - apiGroups: [""]
    resources: ["persistentvolumeclaims"]
    verbs: ["get", "list", "watch", "update"]
  - apiGroups: ["storage.k8s.io"]
    resources: ["storageclasses"]
    verbs: ["get", "list", "watch"]
  - apiGroups: [""]
    resources: ["events"]
    verbs: ["create", "update", "patch"]
---
kind: ClusterRoleBinding
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  name: run-nfs-client-provisioner
subjects:
  - kind: ServiceAccount
    name: nfs-client-provisioner
    # replace with namespace where provisioner is deployed
    namespace: default
roleRef:
  kind: ClusterRole
  name: nfs-client-provisioner-runner
  apiGroup: rbac.authorization.k8s.io
---
kind: Role
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  name: leader-locking-nfs-client-provisioner
  # replace with namespace where provisioner is deployed
  namespace: default
rules:
  - apiGroups: [""]
    resources: ["endpoints"]
    verbs: ["get", "list", "watch", "create", "update", "patch"]
---
kind: RoleBinding
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  name: leader-locking-nfs-client-provisioner
  # replace with namespace where provisioner is deployed
  namespace: default
subjects:
  - kind: ServiceAccount
    name: nfs-client-provisioner
    # replace with namespace where provisioner is deployed
    namespace: default
roleRef:
  kind: Role
  name: leader-locking-nfs-client-provisioner
  apiGroup: rbac.authorization.k8s.io

#执行kubectl apply -f sc.yaml
#查看相关的存储，确认配置是否生效
kubectl get sc
```

### 3.2、安装metrics-server

集群指标监控组件，文件命名为metrics-server.yaml

```
apiVersion: v1
kind: ServiceAccount
metadata:
  labels:
    k8s-app: metrics-server
  name: metrics-server
  namespace: kube-system
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  labels:
    k8s-app: metrics-server
    rbac.authorization.k8s.io/aggregate-to-admin: "true"
    rbac.authorization.k8s.io/aggregate-to-edit: "true"
    rbac.authorization.k8s.io/aggregate-to-view: "true"
  name: system:aggregated-metrics-reader
rules:
- apiGroups:
  - metrics.k8s.io
  resources:
  - pods
  - nodes
  verbs:
  - get
  - list
  - watch
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  labels:
    k8s-app: metrics-server
  name: system:metrics-server
rules:
- apiGroups:
  - ""
  resources:
  - pods
  - nodes
  - nodes/stats
  - namespaces
  - configmaps
  verbs:
  - get
  - list
  - watch
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  labels:
    k8s-app: metrics-server
  name: metrics-server-auth-reader
  namespace: kube-system
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: extension-apiserver-authentication-reader
subjects:
- kind: ServiceAccount
  name: metrics-server
  namespace: kube-system
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  labels:
    k8s-app: metrics-server
  name: metrics-server:system:auth-delegator
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: system:auth-delegator
subjects:
- kind: ServiceAccount
  name: metrics-server
  namespace: kube-system
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  labels:
    k8s-app: metrics-server
  name: system:metrics-server
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: system:metrics-server
subjects:
- kind: ServiceAccount
  name: metrics-server
  namespace: kube-system
---
apiVersion: v1
kind: Service
metadata:
  labels:
    k8s-app: metrics-server
  name: metrics-server
  namespace: kube-system
spec:
  ports:
  - name: https
    port: 443
    protocol: TCP
    targetPort: https
  selector:
    k8s-app: metrics-server
---
apiVersion: apps/v1
kind: Deployment
metadata:
  labels:
    k8s-app: metrics-server
  name: metrics-server
  namespace: kube-system
spec:
  selector:
    matchLabels:
      k8s-app: metrics-server
  strategy:
    rollingUpdate:
      maxUnavailable: 0
  template:
    metadata:
      labels:
        k8s-app: metrics-server
    spec:
      containers:
      - args:
        - --cert-dir=/tmp
        - --kubelet-insecure-tls
        - --secure-port=4443
        - --kubelet-preferred-address-types=InternalIP,ExternalIP,Hostname
        - --kubelet-use-node-status-port
        image: registry.cn-hangzhou.aliyuncs.com/lfy_k8s_images/metrics-server:v0.4.3
        imagePullPolicy: IfNotPresent
        livenessProbe:
          failureThreshold: 3
          httpGet:
            path: /livez
            port: https
            scheme: HTTPS
          periodSeconds: 10
        name: metrics-server
        ports:
        - containerPort: 4443
          name: https
          protocol: TCP
        readinessProbe:
          failureThreshold: 3
          httpGet:
            path: /readyz
            port: https
            scheme: HTTPS
          periodSeconds: 10
        securityContext:
          readOnlyRootFilesystem: true
          runAsNonRoot: true
          runAsUser: 1000
        volumeMounts:
        - mountPath: /tmp
          name: tmp-dir
      nodeSelector:
        kubernetes.io/os: linux
      priorityClassName: system-cluster-critical
      serviceAccountName: metrics-server
      volumes:
      - emptyDir: {}
        name: tmp-dir
---
apiVersion: apiregistration.k8s.io/v1
kind: APIService
metadata:
  labels:
    k8s-app: metrics-server
  name: v1beta1.metrics.k8s.io
spec:
  group: metrics.k8s.io
  groupPriorityMinimum: 100
  insecureSkipTLSVerify: true
  service:
    name: metrics-server
    namespace: kube-system
  version: v1beta1
  versionPriority: 100

#执行 kubectl apply -f metrics-server.yaml
```

### 4、安装KubeSphere

### 4.1下载相关的配置文件

```
wget https://github.com/kubesphere/ks-installer/releases/download/v3.1.1/kubesphere-installer.yaml
wget https://github.com/kubesphere/ks-installer/releases/download/v3.1.1/cluster-configuration.yaml
```

### 4.2、修改cluster-configuration

在 cluster-configuration.yaml中指定我们需要开启的功能  
参照官网“启用可插拔组件”  
<https://kubesphere.com.cn/docs/pluggable-components/overview/>

### 4.3、执行安装

```
kubectl apply -f kubesphere-installer.yaml
kubectl apply -f cluster-configuration.yaml
```

这里的报错是和API版本有关系  
解决方法:vim kubesphere-installer.yaml 将找到的每个 apiextensions.k8s.io/v1beta1 更改为 apiextensions.k8s.io/v1  

**启动cluster-configuration.yaml无报错，忘了截图**

### 4.4、查看安装进度

`kubectl logs -n kubesphere-system $(kubectl get pod -n kubesphere-system -l app=ks-install -o jsonpath='{.items[0].metadata.name}') -f`  

访问 ： <http://192.168.0.182:30880>（kubesphere可视化界面）  
账号 ： admin  
密码 ： P@88w0rd

### 4.5、查看集群状态和pod

`命令：kubectl get nodes`  

`命令：kubectl get pods -A`  

**部署完成！**

### 多Master节点部署：

**前言：KubeKey 是一个用于部署 Kubernetes 集群的开源轻量级工具。它提供了一种灵活、快速、便捷的方式来仅安装 Kubernetes/K3s，或同时安装 Kubernetes/K3s 和 KubeSphere，以及其他云原生插件。除此之外，它也是扩展和升级集群的有效工具。**  
**KubeKey v2.1.0 版本新增了清单（manifest）和制品（artifact）的概念，为用户离线部署 Kubernetes 集群提供了一种解决方案。manifest 是一个描述当前 Kubernetes 集群信息和定义 artifact 制品中需要包含哪些内容的文本文件。在过去，用户需要准备部署工具，镜像 tar 包和其他相关的二进制文件，每位用户需要部署的 Kubernetes 版本和需要部署的镜像都是不同的。现在使用 KubeKey，用户只需使用清单 manifest 文件来定义将要离线部署的集群环境需要的内容，再通过该 manifest 来导出制品 artifact 文件即可完成准备工作。离线部署时只需要 KubeKey 和 artifact 就可快速、简单的在环境中部署镜像仓库和 Kubernetes 集群。**

### 1、下载 KubeKey 并解压：

如果能正常访问 GitHub/Googleapis  
`命令：curl -sfL https://get-kk.kubesphere.io | VERSION=v3.0.7 sh -`  
如果不能正常访问，先执行命令：export KKZONE=cn，再执行以上下载命令  

### 2、创建文件vim manifest.yaml（可选步骤）

添加以下内容：

```
---
apiVersion: kubekey.kubesphere.io/v1alpha2
kind: Manifest
metadata:
  name: sample
spec:
  arches:
  - amd64
  operatingSystems:
  - arch: amd64
    type: linux
    id: centos
    version: "7"
    repository:
      iso:
        localPath:
        url: https://github.com/kubesphere/kubekey/releases/download/v3.0.7/centos7-rpms-amd64.iso
  - arch: amd64
    type: linux
    id: ubuntu
    version: "20.04"
    repository:
      iso:
        localPath:
        url: https://github.com/kubesphere/kubekey/releases/download/v3.0.7/ubuntu-20.04-debs-amd64.iso
  kubernetesDistributions:
  - type: kubernetes
    version: v1.22.12
  components:
    helm:
      version: v3.9.0
    cni:
      version: v0.9.1
    etcd:
      version: v3.4.13
   ## For now, if your cluster container runtime is containerd, KubeKey will add a docker 20.10.8 container runtime in the below list.
   ## The reason is KubeKey creates a cluster with containerd by installing a docker first and making kubelet connect the socket file of containerd which docker contained.
    containerRuntimes:
    - type: docker
      version: 20.10.8
    crictl:
      version: v1.24.0
    docker-registry:
      version: "2"
    harbor:
      version: v2.5.3
    docker-compose:
      version: v2.2.2
  images:
  - registry.cn-beijing.aliyuncs.com/kubesphereio/kube-apiserver:v1.22.12
  - registry.cn-beijing.aliyuncs.com/kubesphereio/kube-controller-manager:v1.22.12
  - registry.cn-beijing.aliyuncs.com/kubesphereio/kube-proxy:v1.22.12
  - registry.cn-beijing.aliyuncs.com/kubesphereio/kube-scheduler:v1.22.12
  - registry.cn-beijing.aliyuncs.com/kubesphereio/pause:3.5
  - registry.cn-beijing.aliyuncs.com/kubesphereio/coredns:1.8.0
  - registry.cn-beijing.aliyuncs.com/kubesphereio/cni:v3.23.2
  - registry.cn-beijing.aliyuncs.com/kubesphereio/kube-controllers:v3.23.2
  - registry.cn-beijing.aliyuncs.com/kubesphereio/node:v3.23.2
  - registry.cn-beijing.aliyuncs.com/kubesphereio/pod2daemon-flexvol:v3.23.2
  - registry.cn-beijing.aliyuncs.com/kubesphereio/typha:v3.23.2
  - registry.cn-beijing.aliyuncs.com/kubesphereio/flannel:v0.12.0
  - registry.cn-beijing.aliyuncs.com/kubesphereio/provisioner-localpv:3.3.0
  - registry.cn-beijing.aliyuncs.com/kubesphereio/linux-utils:3.3.0
  - registry.cn-beijing.aliyuncs.com/kubesphereio/haproxy:2.3
  - registry.cn-beijing.aliyuncs.com/kubesphereio/nfs-subdir-external-provisioner:v4.0.2
  - registry.cn-beijing.aliyuncs.com/kubesphereio/k8s-dns-node-cache:1.15.12
  - registry.cn-beijing.aliyuncs.com/kubesphereio/ks-installer:v3.3.2
  - registry.cn-beijing.aliyuncs.com/kubesphereio/ks-apiserver:v3.3.2
  - registry.cn-beijing.aliyuncs.com/kubesphereio/ks-console:v3.3.2
  - registry.cn-beijing.aliyuncs.com/kubesphereio/ks-controller-manager:v3.3.2
  - registry.cn-beijing.aliyuncs.com/kubesphereio/ks-upgrade:v3.3.2
  - registry.cn-beijing.aliyuncs.com/kubesphereio/kubectl:v1.22.0
  - registry.cn-beijing.aliyuncs.com/kubesphereio/kubectl:v1.21.0
  - registry.cn-beijing.aliyuncs.com/kubesphereio/kubectl:v1.20.0
  - registry.cn-beijing.aliyuncs.com/kubesphereio/kubefed:v0.8.1
  - registry.cn-beijing.aliyuncs.com/kubesphereio/tower:v0.2.0
  - registry.cn-beijing.aliyuncs.com/kubesphereio/minio:RELEASE.2019-08-07T01-59-21Z
  - registry.cn-beijing.aliyuncs.com/kubesphereio/mc:RELEASE.2019-08-07T23-14-43Z
  - registry.cn-beijing.aliyuncs.com/kubesphereio/snapshot-controller:v4.0.0
  - registry.cn-beijing.aliyuncs.com/kubesphereio/nginx-ingress-controller:v1.1.0
  - registry.cn-beijing.aliyuncs.com/kubesphereio/defaultbackend-amd64:1.4
  - registry.cn-beijing.aliyuncs.com/kubesphereio/metrics-server:v0.4.2
  - registry.cn-beijing.aliyuncs.com/kubesphereio/redis:5.0.14-alpine
  - registry.cn-beijing.aliyuncs.com/kubesphereio/haproxy:2.0.25-alpine
  - registry.cn-beijing.aliyuncs.com/kubesphereio/alpine:3.14
  - registry.cn-beijing.aliyuncs.com/kubesphereio/openldap:1.3.0
  - registry.cn-beijing.aliyuncs.com/kubesphereio/netshoot:v1.0
  - registry.cn-beijing.aliyuncs.com/kubesphereio/cloudcore:v1.9.2
  - registry.cn-beijing.aliyuncs.com/kubesphereio/iptables-manager:v1.9.2
  - registry.cn-beijing.aliyuncs.com/kubesphereio/edgeservice:v0.2.0
  - registry.cn-beijing.aliyuncs.com/kubesphereio/gatekeeper:v3.5.2
  - registry.cn-beijing.aliyuncs.com/kubesphereio/openpitrix-jobs:v3.3.2
  - registry.cn-beijing.aliyuncs.com/kubesphereio/devops-apiserver:ks-v3.3.2
  - registry.cn-beijing.aliyuncs.com/kubesphereio/devops-controller:ks-v3.3.2
  - registry.cn-beijing.aliyuncs.com/kubesphereio/devops-tools:ks-v3.3.2
  - registry.cn-beijing.aliyuncs.com/kubesphereio/ks-jenkins:v3.3.0-2.319.1
  - registry.cn-beijing.aliyuncs.com/kubesphereio/inbound-agent:4.10-2
  - registry.cn-beijing.aliyuncs.com/kubesphereio/builder-base:v3.2.2
  - registry.cn-beijing.aliyuncs.com/kubesphereio/builder-nodejs:v3.2.0
  - registry.cn-beijing.aliyuncs.com/kubesphereio/builder-maven:v3.2.0
  - registry.cn-beijing.aliyuncs.com/kubesphereio/builder-maven:v3.2.1-jdk11
  - registry.cn-beijing.aliyuncs.com/kubesphereio/builder-python:v3.2.0
  - registry.cn-beijing.aliyuncs.com/kubesphereio/builder-go:v3.2.0
  - registry.cn-beijing.aliyuncs.com/kubesphereio/builder-go:v3.2.2-1.16
  - registry.cn-beijing.aliyuncs.com/kubesphereio/builder-go:v3.2.2-1.17
  - registry.cn-beijing.aliyuncs.com/kubesphereio/builder-go:v3.2.2-1.18
  - registry.cn-beijing.aliyuncs.com/kubesphereio/builder-base:v3.2.2-podman
  - registry.cn-beijing.aliyuncs.com/kubesphereio/builder-nodejs:v3.2.0-podman
  - registry.cn-beijing.aliyuncs.com/kubesphereio/builder-maven:v3.2.0-podman
  - registry.cn-beijing.aliyuncs.com/kubesphereio/builder-maven:v3.2.1-jdk11-podman
  - registry.cn-beijing.aliyuncs.com/kubesphereio/builder-python:v3.2.0-podman
  - registry.cn-beijing.aliyuncs.com/kubesphereio/builder-go:v3.2.0-podman
  - registry.cn-beijing.aliyuncs.com/kubesphereio/builder-go:v3.2.2-1.16-podman
  - registry.cn-beijing.aliyuncs.com/kubesphereio/builder-go:v3.2.2-1.17-podman
  - registry.cn-beijing.aliyuncs.com/kubesphereio/builder-go:v3.2.2-1.18-podman
  - registry.cn-beijing.aliyuncs.com/kubesphereio/s2ioperator:v3.2.1
  - registry.cn-beijing.aliyuncs.com/kubesphereio/s2irun:v3.2.0
  - registry.cn-beijing.aliyuncs.com/kubesphereio/s2i-binary:v3.2.0
  - registry.cn-beijing.aliyuncs.com/kubesphereio/tomcat85-java11-centos7:v3.2.0
  - registry.cn-beijing.aliyuncs.com/kubesphereio/tomcat85-java11-runtime:v3.2.0
  - registry.cn-beijing.aliyuncs.com/kubesphereio/tomcat85-java8-centos7:v3.2.0
  - registry.cn-beijing.aliyuncs.com/kubesphereio/tomcat85-java8-runtime:v3.2.0
  - registry.cn-beijing.aliyuncs.com/kubesphereio/java-11-centos7:v3.2.0
  - registry.cn-beijing.aliyuncs.com/kubesphereio/java-8-centos7:v3.2.0
  - registry.cn-beijing.aliyuncs.com/kubesphereio/java-8-runtime:v3.2.0
  - registry.cn-beijing.aliyuncs.com/kubesphereio/java-11-runtime:v3.2.0
  - registry.cn-beijing.aliyuncs.com/kubesphereio/nodejs-8-centos7:v3.2.0
  - registry.cn-beijing.aliyuncs.com/kubesphereio/nodejs-6-centos7:v3.2.0
  - registry.cn-beijing.aliyuncs.com/kubesphereio/nodejs-4-centos7:v3.2.0
  - registry.cn-beijing.aliyuncs.com/kubesphereio/python-36-centos7:v3.2.0
  - registry.cn-beijing.aliyuncs.com/kubesphereio/python-35-centos7:v3.2.0
  - registry.cn-beijing.aliyuncs.com/kubesphereio/python-34-centos7:v3.2.0
  - registry.cn-beijing.aliyuncs.com/kubesphereio/python-27-centos7:v3.2.0
  - registry.cn-beijing.aliyuncs.com/kubesphereio/argocd:v2.3.3
  - registry.cn-beijing.aliyuncs.com/kubesphereio/argocd-applicationset:v0.4.1
  - registry.cn-beijing.aliyuncs.com/kubesphereio/dex:v2.30.2
  - registry.cn-beijing.aliyuncs.com/kubesphereio/redis:6.2.6-alpine
  - registry.cn-beijing.aliyuncs.com/kubesphereio/configmap-reload:v0.5.0
  - registry.cn-beijing.aliyuncs.com/kubesphereio/prometheus:v2.34.0
  - registry.cn-beijing.aliyuncs.com/kubesphereio/prometheus-config-reloader:v0.55.1
  - registry.cn-beijing.aliyuncs.com/kubesphereio/prometheus-operator:v0.55.1
  - registry.cn-beijing.aliyuncs.com/kubesphereio/kube-rbac-proxy:v0.11.0
  - registry.cn-beijing.aliyuncs.com/kubesphereio/kube-state-metrics:v2.5.0
  - registry.cn-beijing.aliyuncs.com/kubesphereio/node-exporter:v1.3.1
  - registry.cn-beijing.aliyuncs.com/kubesphereio/alertmanager:v0.23.0
  - registry.cn-beijing.aliyuncs.com/kubesphereio/thanos:v0.25.2
  - registry.cn-beijing.aliyuncs.com/kubesphereio/grafana:8.3.3
  - registry.cn-beijing.aliyuncs.com/kubesphereio/kube-rbac-proxy:v0.8.0
  - registry.cn-beijing.aliyuncs.com/kubesphereio/notification-manager-operator:v1.4.0
  - registry.cn-beijing.aliyuncs.com/kubesphereio/notification-manager:v1.4.0
  - registry.cn-beijing.aliyuncs.com/kubesphereio/notification-tenant-sidecar:v3.2.0
  - registry.cn-beijing.aliyuncs.com/kubesphereio/elasticsearch-curator:v5.7.6
  - registry.cn-beijing.aliyuncs.com/kubesphereio/elasticsearch-oss:6.8.22
  - registry.cn-beijing.aliyuncs.com/kubesphereio/fluentbit-operator:v0.13.0
  - registry.cn-beijing.aliyuncs.com/kubesphereio/docker:19.03
  - registry.cn-beijing.aliyuncs.com/kubesphereio/fluent-bit:v1.8.11
  - registry.cn-beijing.aliyuncs.com/kubesphereio/log-sidecar-injector:1.1
  - registry.cn-beijing.aliyuncs.com/kubesphereio/filebeat:6.7.0
  - registry.cn-beijing.aliyuncs.com/kubesphereio/kube-events-operator:v0.4.0
  - registry.cn-beijing.aliyuncs.com/kubesphereio/kube-events-exporter:v0.4.0
  - registry.cn-beijing.aliyuncs.com/kubesphereio/kube-events-ruler:v0.4.0
  - registry.cn-beijing.aliyuncs.com/kubesphereio/kube-auditing-operator:v0.2.0
  - registry.cn-beijing.aliyuncs.com/kubesphereio/kube-auditing-webhook:v0.2.0
  - registry.cn-beijing.aliyuncs.com/kubesphereio/pilot:1.11.1
  - registry.cn-beijing.aliyuncs.com/kubesphereio/proxyv2:1.11.1
  - registry.cn-beijing.aliyuncs.com/kubesphereio/jaeger-operator:1.27
  - registry.cn-beijing.aliyuncs.com/kubesphereio/jaeger-agent:1.27
  - registry.cn-beijing.aliyuncs.com/kubesphereio/jaeger-collector:1.27
  - registry.cn-beijing.aliyuncs.com/kubesphereio/jaeger-query:1.27
  - registry.cn-beijing.aliyuncs.com/kubesphereio/jaeger-es-index-cleaner:1.27
  - registry.cn-beijing.aliyuncs.com/kubesphereio/kiali-operator:v1.38.1
  - registry.cn-beijing.aliyuncs.com/kubesphereio/kiali:v1.38
  - registry.cn-beijing.aliyuncs.com/kubesphereio/busybox:1.31.1
  - registry.cn-beijing.aliyuncs.com/kubesphereio/nginx:1.14-alpine
  - registry.cn-beijing.aliyuncs.com/kubesphereio/wget:1.0
  - registry.cn-beijing.aliyuncs.com/kubesphereio/hello:plain-text
  - registry.cn-beijing.aliyuncs.com/kubesphereio/wordpress:4.8-apache
  - registry.cn-beijing.aliyuncs.com/kubesphereio/hpa-example:latest
  - registry.cn-beijing.aliyuncs.com/kubesphereio/fluentd:v1.4.2-2.0
  - registry.cn-beijing.aliyuncs.com/kubesphereio/perl:latest
  - registry.cn-beijing.aliyuncs.com/kubesphereio/examples-bookinfo-productpage-v1:1.16.2
  - registry.cn-beijing.aliyuncs.com/kubesphereio/examples-bookinfo-reviews-v1:1.16.2
  - registry.cn-beijing.aliyuncs.com/kubesphereio/examples-bookinfo-reviews-v2:1.16.2
  - registry.cn-beijing.aliyuncs.com/kubesphereio/examples-bookinfo-details-v1:1.16.2
  - registry.cn-beijing.aliyuncs.com/kubesphereio/examples-bookinfo-ratings-v1:1.16.3
  - registry.cn-beijing.aliyuncs.com/kubesphereio/scope:1.13.0
```

### 3、导出制品 artifact（可选步骤）

`命令：./kk artifact export -m manifest.yaml -o kubesphere.tar.gz`  

**注意：因为不能正常访问 GitHub/Googleapis，下面我就只说全面的部署方法了。这里如果公司有自己的镜像仓库就直接用，如果没有就得上网，否则就会像我这样**  

### 4、将下载的 KubeKey 和制品 artifact 通过 scp命令拷贝至其他节点服务器。（可选步骤）

### 5、执行以下命令创建离线集群配置文件

`命令：./kk create config --with-kubesphere v3.3.2 --with-kubernetes v1.22.12 -f config-sample.yaml`  

### 6、修改配置文件

`命令：vim config-sample.yaml`

```
apiVersion: kubekey.kubesphere.io/v1alpha2
kind: Cluster
metadata:
  name: sample
spec:
  hosts:
  - {name: master, address: 192.168.0.3, internalAddress: 192.168.0.3, user: root, password: "<REPLACE_WITH_YOUR_ACTUAL_PASSWORD>"}
  - {name: node1, address: 192.168.0.4, internalAddress: 192.168.0.4, user: root, password: "<REPLACE_WITH_YOUR_ACTUAL_PASSWORD>"}

  roleGroups:
    etcd:
    - master
    control-plane:
    - master
    worker:
    - node1
    # 如需使用 kk 自动部署镜像仓库，请设置该主机组 （建议仓库与集群分离部署，减少相互影响）
    registry:
    - node1
  controlPlaneEndpoint:
    ## Internal loadbalancer for apiservers
    # internalLoadbalancer: haproxy

    domain: lb.kubesphere.local
    address: ""
    port: 6443
  kubernetes:
    version: v1.22.12
    clusterName: cluster.local
  network:
    plugin: calico
    kubePodsCIDR: 10.233.64.0/18
    kubeServiceCIDR: 10.233.0.0/18
    ## multus support. https://github.com/k8snetworkplumbingwg/multus-cni
    multusCNI:
      enabled: false
  registry:
    # 如需使用 kk 部署 harbor, 可将该参数设置为 harbor，不设置该参数且需使用 kk 创建容器镜像仓库，将默认使用docker registry。
    type: harbor
    # 如使用 kk 部署的 harbor 或其他需要登录的仓库，可设置对应仓库的auths，如使用 kk 创建的 docker registry 仓库，则无需配置该参数。
    # 注意：如使用 kk 部署 harbor，该参数请于 harbor 启动后设置。
    #auths:
    #  "dockerhub.kubekey.local":
    #    username: admin
    #    password: Harbor12345
    # 设置集群部署时使用的私有仓库
    privateRegistry: ""
    namespaceOverride: ""
    registryMirrors: []
    insecureRegistries: []
  addons: []
```

```
注意：1、master和worker可以根据具体环境来"自定义"，etcd:和 control-plane:指定master，这里我将其中两个节点即为master也为worker。另外一个节点为worker；
     2、必须指定 registry 仓库部署节点（用于 KubeKey 部署自建 Harbor 仓库）；
     3、registry 里必须指定 type 类型为 harbor，否则默认安装 docker registry；
```

### 7、执行以下命令安装镜像仓库（可选步骤）

`./kk init registry -f config.yaml -a kubesphere.tar.gz`  
**这个步骤可选，如果公司有自己的镜像仓库，则不需要创建**

```
命令中的参数解释如下：
config-sample.yaml 指离线环境集群的配置文件。
kubesphere.tar.gz 指源集群打包出来的 tar 包镜像。
```

### 8、创建 Harbor 项目（可选步骤）

```
说明：由于 Harbor 项目存在访问控制（RBAC）的限制，即只有指定角色的用户才能执行某些操作。如果您未创建项目，则镜像不能被推送到 Harbor。Harbor 中有两种类型的项目：
公共项目（Public）：任何用户都可以从这个项目中拉取镜像。
私有项目（Private）：只有作为项目成员的用户可以拉取镜像。
Harbor 管理员账号：admin，密码：Harbor12345。Harbor 安装文件在 /opt/harbor , 如需运维 Harbor，可至该目录下。
```

### 方法 1：执行脚本创建 Harbor 项目

### ①执行以下命令下载指定脚本初始化 Harbor 仓库：

`curl -O https://raw.githubusercontent.com/kubesphere/ks-installer/master/scripts/create_project_harbor.sh`

### ②修改脚本配置文件：vim create_project_harbor.sh

```
#!/usr/bin/env bash

# Copyright 2018 The KubeSphere Authors.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

url="https://dockerhub.kubekey.local"  #修改url的值为https://dockerhub.kubekey.local
user="admin"
passwd="Harbor12345"

harbor_projects=(library
    kubesphereio
    kubesphere
    calico
    coredns
    openebs
    csiplugin
    minio
    mirrorgooglecontainers
    osixia
    prom
    thanosio
    jimmidyson
    grafana
    elastic
    istio
    jaegertracing
    jenkins
    weaveworks
    openpitrix
    joosthofman
    nginxdemos
    fluent
    kubeedge
)

for project in "${harbor_projects[@]}"; do
    echo "creating $project"
    curl -u "${user}:${passwd}" -X POST -H "Content-Type: application/json" "${url}/api/v2.0/projects" -d "{ \"project_name\": \"${project}\", \"public\": true}" -k #curl命令末尾加上 -k
done
```

```
说明：
修改 url 的值为  https://dockerhub.kubekey.local 。
需要指定仓库项目名称和镜像列表的项目名称保持一致。
脚本末尾 curl 命令末尾加上 -k。
```

### ③执行以下命令创建 Harbor 项目：

```
命令：chmod +x create_project_harbor.sh
命令：./create_project_harbor.sh
```

### 方法 2：登录 Harbor 仓库创建项目。将项目设置为公开以便所有用户都能够拉取镜像。

### 9、再次执行以下命令修改集群配置文件：

`命令：vim config-sample.yaml`

```
  ...
  registry:
    type: harbor
    auths:
      "dockerhub.kubekey.local":
        username: admin
        password: Harbor12345
    privateRegistry: "dockerhub.kubekey.local"
    namespaceOverride: "kubesphereio"
    registryMirrors: []
    insecureRegistries: []
  addons: []
```

```
说明：
新增 auths 配置增加 dockerhub.kubekey.local 和账号密码；
privateRegistry 增加 dockerhub.kubekey.local；
namespaceOverride 增加 kubesphereio；
```

### 10、执行以下命令安装 KubeSphere 和 Kubernetes集群:

**注意：运行前一定要修改对应的hosts、roleGroups、registry镜像仓库**  
`命令：./kk create cluster -f config-sample.yaml -a kubesphere.tar.gz --with-packages`

```
说明：
config-sample.yaml：离线环境集群的配置文件；
kubesphere.tar.gz：源集群打包出来的 tar 包镜像；
--with-packages：若需要安装操作系统依赖，需指定该选项；
```

### 11、执行以下命令查看集群状态：

`命令：kubectl logs -n kubesphere-system $(kubectl get pod -n kubesphere-system -l 'app in (ks-install, ks-installer)' -o jsonpath='{.items[0].metadata.name}') -f`  
**最后安装完成后，会输出：Welcome to KubeSphere! 和有关KubeSphere登录地址，账号/密码的信息**  

**后台效果范例：**  
