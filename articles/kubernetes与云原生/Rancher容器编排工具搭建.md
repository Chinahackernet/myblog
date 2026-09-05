# 介绍

本文主要目的在于记录rancher ha集群搭建步骤，内容包括系统配置、docker安装、k8s安装、rancher ha安装等。

![](assets/kubernetes与云原生/Rancher容器编排工具搭建/Rancher容器编排工具搭建-1.jpeg)

**服务器环境信息：**

![](assets/kubernetes与云原生/Rancher容器编排工具搭建/Rancher容器编排工具搭建-2.jpeg)

# 环境设置

# 操作系统文件限制

vim /etc/security/limits.conf

在文件末尾添加以下内容：

  

```python
root soft nofile 655350
root hard nofile 655350
* soft nofile 655350
* hard nofile 655350
```

  

# 关闭防火墙

  

```python
systemctl stop firewalld
systemctl disable firewalld
```

# 关闭setlinx

将SELINUX值设置为disabled：

vim /etc/selinux/config

```python
SELINUX=disabled
```

# 关闭swap

注释或删除swap交换分区：vim /etc/fstab

  

```python
# /etc/fstab
# Created by anaconda on Fri Jun 2 14:11:50 2017
#
# Accessible filesystems, by reference, are maintained under '/dev/disk'
# See man pages fstab(5), findfs(8), mount(8) and/or blkid(8) for more info
#
/dev/mapper/centos-root / xfs defaults 0 0
UUID=f5b4435a-77bc-48f4-8d22-6fa55e9e04a2 /boot xfs defaults 0 0
/dev/mapper/centos-grid0 /grid0 xfs defaults 0 0
#/dev/mapper/centos-swap swap swap defaults 0 0
```

# kernel调优

添加如下内容，vim /etc/sysctl.conf：

  

```python
net.ipv4.ip_forward=1
net.bridge.bridge-nf-call-iptables=1
net.bridge.bridge-nf-call-ip6tables=1
vm.swappiness=0
vm.max_map_count=655360
```

# 创建用户

创建用户并且添加到docker组：

```python
useradd rancher -G docker
```

# ssh免密登录

在31-33服务器上执行下面命令：

```python
su - rancher
ssh-keygen -t rsa
ssh-copy-id -i .ssh/id_rsa.pub rancher@192.168.100.31
ssh-copy-id -i .ssh/id_rsa.pub rancher@192.168.100.32
ssh-copy-id -i .ssh/id_rsa.pub rancher@192.168.100.33
```

root用户也需要ssh免密登录，命令参考：

```python
su - root
ssh-keygen -t rsa
ssh-copy-id -i .ssh/id_rsa.pub root@192.168.100.31
ssh-copy-id -i .ssh/id_rsa.pub root@192.168.100.32
ssh-copy-id -i .ssh/id_rsa.pub root@192.168.100.33
```

# docker安装

**rke工具目前只支持docker v17.03.2，请务必保持版本一致，否则后续安装会报错。**

**1、安装repo源：**

```python
yum-config-manager --add-repo http://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo
```

**卸载旧docker版本：**

```python
yum remove -y docker \
docker-client \
docker-client-latest \
docker-common \
docker-latest \
docker-latest-logrotate \
docker-logrotate \
docker-selinux \
docker-engine-selinux \
docker-engine \
container*
```

**2、安装自定义版本**

```python
export docker_version=17.03.2
```

**3、安装必要的一些系统工具**

```python
yum install -y yum-utils device-mapper-persistent-data lvm2 bash-completion
```

**4、添加软件源信息**

```python
yum-config-manager --add-repo http://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo
```

**5、安装docker-ce**

```python
version=$(yum list docker-ce.x86_64 --showduplicates | sort -r|grep ${docker_version}|awk '{print $2}')
yum -y install --setopt=obsoletes=0 docker-ce-${version} docker-ce-selinux-${version}
```

**6、开机自启动**

```python
systemctl enable docker
```

**7、添加国内加速代理，设置storage-driver**

vim /etc/docker/daemon.json

**输入如下内容：**

```python
{
"registry-mirrors": ["https://39r65dar.mirror.aliyuncs.com"],
"storage-driver": "overlay2",
"storage-opts": [
"overlay2.override_kernel_check=true"
]
}
```

**8、重启docker**

```python
systemctl restart docker
```

# 安装nginx

在192.168.100.22服务器上安装nginx用户rancher-server负载均衡。

**安装nginx：**

```python
sudo rpm -Uvh http://nginx.org/packages/centos/7/noarch/RPMS/nginx-release-centos-7-0.el7.ngx.noarch.rpm
yum install nginx -y
sudo systemctl enable nginx.service
```

**修改配置文件：vi /etc/nginx/nginx.conf**

```python
user nginx;
worker_processes 4;
worker_rlimit_nofile 40000;
events {
worker_connections 8192;
}
http {
# Gzip Settings
gzip on;
gzip_disable "msie6";
gzip_disable "MSIE [1-6]\.(?!.*SV1)";
gzip_vary on;
gzip_static on;
gzip_proxied any;
gzip_min_length 0;
gzip_comp_level 8;
gzip_buffers 16 8k;
gzip_http_version 1.1;
gzip_types text/xml application/xml application/atom+xml application/rss+xml application/xhtml+xml image/svg+xml application/font-woff text/javascript application/javascript application/x-javascript text/x-json application/json application/x-web-app-manifest+json text/css text/plain text/x-component font/opentype application/x-font-ttf application/vnd.ms-fontobject font/woff2 image/x-icon image/png image/jpeg;
server {
listen 80;
return 301 https://$host$request_uri;
}
}
stream {
upstream rancher_servers {
least_conn;
server 192.168.100.31:443 max_fails=3 fail_timeout=5s;
server 192.168.100.32:443 max_fails=3 fail_timeout=5s;
server 192.168.100.33:443 max_fails=3 fail_timeout=5s;
}
server {
listen 443;
proxy_pass rancher_servers;
}
}
```

**启动nginx：**

```python
sudo systemctl restart nginx.service
```

# Rancher集群部署

# 安装必要工具

在291.168.100.31服务器上进行下面操作。

**安装rke:**

```python
su root
wget https://www.cnrancher.com/download/rke/rke_linux-amd64
chmod +x rke_linux-amd64
mv rke_linux-amd64 /usr/bin/rke
```

**安装kubectl：**

```python
wget https://www.cnrancher.com/download/kubectl/kubectl_amd64-linux
chmod +x kubectl_amd64-linux
mv kubectl_amd64-linux /usr/bin/kubectl
```

**安装helm：**

```python
wget https://storage.googleapis.com/kubernetes-helm/helm-v2.11.0-linux-amd64.tar.gz
tar zxvf helm-v2.12.0-linux-amd64.tar.gz
mv linux-amd64/helm /usr/bin/helm
mv linux-amd64/tiller /usr/bin/tiller
rm -rf helm-v2.12.0-linux-amd64.tar.gz linux-amd64/
```

# 安装k8s

**1、切换到rancher用户**

su - rancher

**2、创建rancher集群配置文件：**

vim rancher-cluster.yml

**输入如下内容：**

```python
nodes:
- address: 192.168.100.31
user: rancher
role: [controlplane,worker,etcd]
- address: 192.168.100.32
user: rancher
role: [controlplane,worker,etcd]
- address: 192.168.100.33
user: rancher
role: [controlplane,worker,etcd]
services:
etcd:
snapshot: true
creation: 6h
retention: 24h
```

**如果之前操作失败，重新安装需要清理数据：**

```python
su - root
rm -rf /var/lib/rancher/etcd/*
rm -rf /etc/kubernetes/*
su - rancher
rke remove --config ./rancher-cluster.yml
```

**3、启动集群**

```python
rke up --config ./rancher-cluster.yml
```

**完成后，它应显示：Finished building Kubernetes cluster successfully。**

**4、配置环境变量：**

**切换到root用户su - root**

vim /etc/profile

export KUBECONFIG=/home/rancher/kube\_config\_rancher-cluster.yml

**保存，并执行：**

source /etc/profile

  

**5、通过kubectl测试您的连接，并查看您的所有节点是否处于Ready状态**

```python
[rancher@bigman-s1 ~]$ kubectl get nodes
NAME STATUS ROLES AGE VERSION
192.168.100.31 Ready controlplane,etcd,worker 3m v1.11.6
192.168.100.32 Ready controlplane,etcd,worker 3m v1.11.6
192.168.100.33 Ready controlplane,etcd,worker 3m v1.11.6
```

  

**6、检查集群Pod的运行状况**

```python
[rancher@bigman-s1 ~]$ kubectl get pods --all-namespaces
NAMESPACE NAME READY STATUS RESTARTS AGE
ingress-nginx default-http-backend-797c5bc547-z4gj5 1/1 Running 0 3m
ingress-nginx nginx-ingress-controller-bvgxm 1/1 Running 0 3m
ingress-nginx nginx-ingress-controller-rjrss 1/1 Running 0 3m
ingress-nginx nginx-ingress-controller-z5nmf 1/1 Running 0 3m
kube-system canal-cwb9g 3/3 Running 0 4m
kube-system canal-lnvmt 3/3 Running 0 4m
kube-system canal-xfft6 3/3 Running 0 4m
kube-system kube-dns-7588d5b5f5-5lql6 3/3 Running 0 4m
kube-system kube-dns-autoscaler-5db9bbb766-qlskd 1/1 Running 0 4m
kube-system metrics-server-97bc649d5-vx7p7 1/1 Running 0 4m
kube-system rke-ingress-controller-deploy-job-ghz5d 0/1 Completed 0 3m
kube-system rke-kubedns-addon-deploy-job-snkfq 0/1 Completed 0 4m
kube-system rke-metrics-addon-deploy-job-kzlwb 0/1 Completed 0 4m
kube-system rke-network-plugin-deploy-job-4f8ms 0/1 Completed 0 4m
```

保存kube\_config\_rancher-cluster.yml和rancher-cluster.yml文件的副本,您将需要这些文件来维护和升级Rancher实例。

  

# Helm

使用Helm在集群上安装tiller服务以管理charts，由于RKE默认启用RBAC, 因此我们需要使用kubectl来创建一个serviceaccount，clusterrolebinding才能让tiller具有部署到集群的权限。

  

**1、在kube-system命名空间中创建ServiceAccount：**

```python
kubectl -n kube-system create serviceaccount tiller
```

**2、创建ClusterRoleBinding以授予tiller帐户对集群的访问权限：**

```python
kubectl create clusterrolebinding tiller --clusterrole cluster-admin --serviceaccount=kube-system:tiller
```

**3、安装Helm Server(Tiller)**

```python
helm init --service-account tiller --tiller-image registry.cn-hangzhou.aliyuncs.com/google_containers/tiller:v2.12.0 --stable-repo-url https://kubernetes.oss-cn-hangzhou.aliyuncs.com/charts
```

**4、安装Tiller金丝雀版本**

```python
helm init --service-account tiller --canary-image
```

**需要修改成国内镜像（可能需要delete再重新init）**

```python
export TILLER_TAG=v2.12.0 ;
kubectl --namespace=kube-system set image deployments/tiller-deploy tiller=hongxiaolu/tiller:$TILLER_TAG
```

  

# helm安装rancher

# 添加Chart仓库地址

使用helm repo add命令添加Rancher chart仓库地址,访问Rancher tag和Chart版本

替换为您要使用的Helm仓库分支(即latest或stable）。

helm repo add rancher-stable https://releases.rancher.com/server-charts/stable

  

# 安装证书管理器

**1、只有Rancher自动生成的证书和LetsEncrypt颁发的证书才需要cert-manager。如果是你自己的证书，可使用ingress.tls.source=secret参数指定证书，并跳过此步骤。**

```python
helm install stable/cert-manager \
--name cert-manager \
--namespace kube-system
```

**Rancher自动生成证书**

**默认情况下，Rancher会自动生成CA根证书并使用cert-manager颁发证书以访问Rancher server界面。**

**唯一的要求是将hostname配置为访问Rancher的域名地址，使用这种SSL证书配置方式需提前安装证书管理器。**

```python
helm install rancher-stable/rancher \
--name rancher \
--namespace cattle-system \
--set hostname=hi.rancher.cn
```

**hi.rancher.cn就是后面访问rancher的域名，需要在/etc/hosts文件中添加关联（所有主机）：**

vim /etc/hosts

192.168.100.22 hi.rancher.cn

由于我们通过hosts文件来添加映射，所以需要为Agent Pod添加主机别名(/etc/hosts)：

  

```python
kubectl -n cattle-system patch deployments cattle-cluster-agent --patch '{
"spec": {
"template": {
"spec": {
"hostAliases": [
{
"hostnames":
[
"hi.rancher.cn"
],
"ip": "192.168.100.22"
}
]
}
}
}
}'
kubectl -n cattle-system patch daemonsets cattle-node-agent --patch '{
"spec": {
"template": {
"spec": {
"hostAliases": [
{
"hostnames":
[
"hi.rancher.cn"
],
"ip": "192.168.100.22"
}
]
}
}
}
}'
```

# 登录rancher管理端

**1、需要在/etc/hosts文件中添加关联（所有主机）：**

vim /etc/hosts

192.168.100.22 hi.rancher.cn

**2、使用域名登录https://hi.rancher.cn**

![](assets/kubernetes与云原生/Rancher容器编排工具搭建/Rancher容器编排工具搭建-3.jpeg)

**输入：admin/admin，设置用户密码。**

**3、登录之后，此时可以看到已经创建好的k8s集群**

![](assets/kubernetes与云原生/Rancher容器编排工具搭建/Rancher容器编排工具搭建-4.jpeg)

# 安装rancher-cli

**1、下载rancher-cli工具**

```python
wget https://releases.rancher.com/cli2/v2.0.6/rancher-linux-amd64-v2.0.6.tar.gz
tar zxvf rancher-linux-amd64-v2.0.6.tar.gz
```

**2、配置变量**

```python
mv rancher-v2.0.6/rancher /usr/bin/rancher
rm -rf rancher-v2.0.6/
```

**3、测试登录**

**新建用户获取tonken：**

![](assets/kubernetes与云原生/Rancher容器编排工具搭建/Rancher容器编排工具搭建-5.jpeg)

**使用创建好的用户token登录：**

```python
rancher login https://hi.rancher.cn/v3 --token token-jpf2f:sjmptntdn6k7rf9mqz7k7c9w77q6pfxmxmr7fvtdjwswbprpjhzvq8
```

# 其它帮助

# docker xfs type问题

**在运行docker info 命令时，如果你的文件系统使用了xfs，那么Docker会检测ftype的值，如果ftype=0，那么会有警告出现。**

**具体警告如下：**

WARNING: overlay: the backing xfs filesystem is formatted without d\_type support, which leads to incorrect behavior.

Reformat the filesystem with ftype=1 to enable d\_type support.

Running without d\_type support will not be supported in future releases.

**这个问题需要解决，否则后续容器会出现异常退出等情况，具体docker为什么这么关系ftype值，可以去百度或者查阅官方文档。**

**由于docker默认是安装在系统盘的，那么重新格式化分区并挂盘肯定是行不通的，我这边环境正好还有多余的盘，所以讲docker切换到新的分区，并将分区参数调成成ftype=1。**

**1、查看分区信息**

[root@bigman-s1 ~]# df

文件系统 1K-块 已用 可用 已用% 挂载点

devtmpfs 32858088 0 32858088 0% /dev

tmpfs 32871880 8 32871872 1% /dev/shm

tmpfs 32871880 61024 32810856 1% /run

tmpfs 32871880 0 32871880 0% /sys/fs/cgroup

/dev/mapper/centos-root 598661528 81105212 517556316 14% /

/dev/mapper/centos-grid0 1227397576 66398088 1160999488 6% /grid0

**2、重新格式化磁盘（注意备份数据）**

umount /dev/mapper/centos-grid0

mkfs.xfs -n ftype=1 -f /dev/mapper/centos-grid0

mount /dev/mapper/centos-grid0 /grid0

xfs\_info /grid0

**3、修改docker数据目录**

vim /usr/lib/systemd/system/docker.service

ExecStart=/usr/bin/dockerd --graph /grid0/docker

**4、修改docker storage-driver驱动**

{

"registry-mirrors": ["https://39r65dar.mirror.aliyuncs.com"],

"storage-driver": "overlay2",

"storage-opts": [

"overlay2.override\_kernel\_check=true"

]

}

**5、重启docker**

systemctl disable docker

systemctl enable docker

systemctl daemon-reload

systemctl restart docker

docker info

**docker本地仓库**

**1、启动本地仓库服务:**

docker run -d -p 5000:5000 --restart=always --name registry registry:2

**2、修改配置**

vi /etc/docker/daemon.json

{

"registry-mirrors": ["https://39r65dar.mirror.aliyuncs.com","http://192.168.100.21:5000"],

"storage-driver": "overlay2",

"storage-opts": [

"overlay2.override\_kernel\_check=true"

],

"insecure-registries" : ["192.168.100.21:5000"]

}