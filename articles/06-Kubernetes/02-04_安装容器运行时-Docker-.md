# 安装容器运行时(Docker)

> 分类：Kubernetes / 第2章：kubeadm集群安装部署
> 原文：https://www.cuiliangblog.cn/detail/section/99855602
> 来源：崔亮的博客

---

> 以下操作全部节点执行，如果使用docker作为容器运行时，最高支持的k8s版本为1.23.17。
>

# 版本选择
每个k8s版本都有对应的docker版本范围，具体参考官方文档[https://github.com/kubernetes/kubernetes/releases](https://github.com/kubernetes/kubernetes/releases)

以1.23.X为例，查看[https://github.com/kubernetes/kubernetes/blob/master/CHANGELOG/CHANGELOG-1.23.md](https://github.com/kubernetes/kubernetes/blob/master/CHANGELOG/CHANGELOG-1.23.md)

![](assets/06-Kubernetes/85856ebaa4d87adf50e7.png)

由更新日志可知，支持的docker版本为20.10.7以上，也不用安装最新版本的docker，以免出现docker版本与k8s版本不匹配的现象，此处就以安装20.10.7为例。

# docker安装
## RHEL安装
```bash
# 安装前源准备
[root@k8s-master ~]# yum install -y yum-utils device-mapper-persistent-data lvm2 
# 配置yum源
[root@k8s-master ~]# yum-config-manager --add-repo http://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo 
# 查看可安装的docker版本
[root@k8s-master ~]# yum list docker-ce --showduplicates | sort -r 
# 安装20.10.6版本docker
[root@k8s-master ~]# yum install -y docker-ce-20.10.7
```

## Debian安装
```yaml
# 安装前源准备
apt install -y apt-transport-https ca-certificates curl software-properties-common
# 配置yum源
curl -fsSL https://mirrors.aliyun.com/docker-ce/linux/ubuntu/gpg | sudo apt-key add -
add-apt-repository "deb [arch=amd64] https://mirrors.aliyun.com/docker-ce/linux/ubuntu $(lsb_release -cs) stable"
apt-get -y update
# 查看可安装的docker版本
apt-cache madison docker-ce | sort -V
# 安装docker
apt-get -y install docker-ce=5:20.10.24~3-0~ubuntu-focal
mkdir -p /etc/docker
tee /etc/docker/daemon.json <<-'EOF'
{
  "registry-mirrors": [
        "https://mirror.ccs.tencentyun.com",
        "https://o2j0mc5x.mirror.aliyuncs.com"
    ]
}
EOF
systemctl daemon-reload
systemctl enable docker
systemctl restart docker
```

# 禁用iptables的forward调用链
docker 1.13以上版本默认禁用iptables的forward调用链，因此需要执行开启命令：

`[root@k8s-master ~]# iptables -P FORWARD ACCEPT` 

# 修改docker cgroup driver为systemd
<font style="color:rgb(18, 18, 18);">systemd 是 Kubernetes 自带的 cgroup 管理器，负责为每个进程分配 cgroupfs，但 Docker 的 cgroup driver 默认是 cgroupfs，这样就同时运行了两个 cgroup 控制管理器。当资源有压力时，有可能会出现不稳定的情况。</font>

```bash
[root@k8s-master ~]# mkdir -p /etc/docker
[root@k8s-master ~]# vim /etc/docker/daemon.json 
{
    "registry-mirrors": [
        "https://mirror.ccs.tencentyun.com",
        "https://o2j0mc5x.mirror.aliyuncs.com"
    ],
    "exec-opts": [
        "native.cgroupdriver=systemd"
    ]
}
[root@k8s-master ~]# systemctl daemon-reload 
[root@k8s-master ~]# systemctl enable docker 
[root@k8s-master ~]# systemctl start docker 
[root@k8s-master ~]# docker info | grep Driver
 Storage Driver: overlay2
 Logging Driver: json-file
 Cgroup Driver: systemd
```


