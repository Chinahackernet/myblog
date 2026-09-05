# 安装容器运行时(Containerd)

> 分类：Kubernetes / 第2章：kubeadm集群安装部署
> 原文：https://www.cuiliangblog.cn/detail/section/99861101
> 来源：崔亮的博客

---

> 从<font style="color:rgb(0, 0, 0);">Kubernetes 1.20版本开始官方不推荐使用Docker，1.24版本将完全弃用docker。如果安装1.22以上版本的k8s，官方推荐使用containerd，docker支持k8s版本最高为1.23.16。</font>
>

# 版本选择
每个k8s版本都有对应的Containerd版本范围，具体参考官方文档[https://github.com/kubernetes/kubernetes/releases](https://github.com/kubernetes/kubernetes/releases)

以1.24.X为例，查看[https://github.com/kubernetes/kubernetes/blob/master/CHANGELOG/CHANGELOG-1.24.md](https://github.com/kubernetes/kubernetes/blob/master/CHANGELOG/CHANGELOG-1.24.md)

![](assets/06-Kubernetes/2a2cb813113c5baa0bc1.png)

由更新日志可知，支持的最低版本Containerd为1.4.12

# <font style="color:rgb(0, 0, 0);">安装container</font>
## <font style="color:rgb(0, 0, 0);">RHEL</font>
```bash
# 安装依赖
[root@k8s-master ~]# yum install -y yum-utils device-mapper-persistent-data lvm2
# 添加yum源
[root@k8s-master ~]# yum-config-manager --add-repo http://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo
# 查看可安装的containerd版本
[root@k8s-master ~]# yum list containerd.io.x86_64 --showduplicates | sort -r
# 安装1.6.4版本containerd
[root@k8s-master ~]# yum install -y containerd.io-1.6.4-3.1.el8.x86_64
[root@k8s-master ~]# containerd -v
containerd containerd.io 1.6.4 212e8b6fa2f44b9c21b2798135fc6fb7c53efc16
```

## Debian
```bash
# step 1: 安装必要的一些系统工具
root@k8s-master:~# apt-get update && apt-get -y install apt-transport-https ca-certificates curl software-properties-common
# step 2: 安装GPG证书
root@k8s-master:~# curl -fsSL https://mirrors.aliyun.com/docker-ce/linux/ubuntu/gpg | apt-key add -
# Step 3: 写入软件源信息
root@k8s-master:~# add-apt-repository "deb [arch=amd64] https://mirrors.aliyun.com/docker-ce/linux/ubuntu $(lsb_release -cs) stable"
# Step 4: 更新并安装containerd
root@k8s-master:~# apt-get -y update && apt-cache madison containerd.io | sort -V
root@k8s-master:~# apt-get -y install containerd.io=1.5.11-1
# 验证
root@k8s-master:~# containerd -v
```

# 修改container配置
## 生成默认配置文件
```bash
[root@k8s-master ~]# containerd config default > /etc/containerd/config.toml
```

## <font style="color:black;">替换镜像源</font>
<font style="color:black;">由于国内环境原因我们需要将 sandbox_image 镜像源设置为阿里云google_containers镜像源。</font>把sandbox_image = "k8s.gcr.io/pause:3.6"修改为：sandbox_image="registry.aliyuncs.com/google_containers/pause:3.6"

```bash
[root@k8s-master ~]# sed -i "s|sandbox = 'registry.k8s.io/pause:|sandbox = 'registry.aliyuncs.com/google_containers/pause:|g" /etc/containerd/config.toml
[root@k8s-master ~]# cat /etc/containerd/config.toml | grep sandbox
```

container 版本不同，对应的 pause 版本也不相同，替换时注意检查。

## <font style="color:black;">配置</font><font style="color:rgb(18, 18, 18);">cgroup</font><font style="color:black;">驱动器</font>
<font style="color:rgb(18, 18, 18);">在 Linux 上，控制组（CGroup）用于限制分配给进程的资源。</font>

<font style="color:rgb(18, 18, 18);">kubelet 和底层容器运行时都需要对接控制组 为 Pod 和容器管理资源 ，如 CPU、内存这类资源设置请求和限制。 若要对接控制组（CGroup），kubelet 和容器运行时需要使用一个 cgroup 驱动。 关键的一点是 </font>**<font style="color:rgb(18, 18, 18);">kubelet 和容器运行时需使用相同的 cgroup 驱动</font>**<font style="color:rgb(18, 18, 18);">并且采用相同的配置。</font>

```bash
[root@k8s-master ~]# sed -i 's/SystemdCgroup\ =\ false/SystemdCgroup\ =\ true/g' /etc/containerd/config.toml
```

## <font style="color:rgb(34, 34, 38);">配置国内镜像加速</font>
与我们之前配置docker镜像源的做法类似，在国内使用containerd依然需要更换成国内的镜像源。但是这里有一些问题需要说明一下：

+ 配置的镜像仓库在使用crictl工具调用或者kubernetes调用时才会生效，如果使用ctr命令拉取镜像是不生效的。
+ Docker 只支持为 Docker Hub 配置 mirror，而 Containerd 支持为任意镜像仓库配置 mirror

```bash
# 修改container配置，指定registry配置从文件读取
[root@k8s-master ~]# vim /etc/containerd/config.toml
    [plugins."io.containerd.grpc.v1.cri".registry]
      config_path = "/etc/containerd/certs.d" # 添加配置文件地址

# 创建配置文件目录
[root@k8s-master ~]# mkdir -p /etc/containerd/certs.d/docker.io

# 新增加速配置
[root@k8s-master ~]# cat > /etc/containerd/certs.d/docker.io/hosts.toml << EOF
server = "https://docker.io"
[host."https://registry-1.docker.io"]
  capabilities = ["pull", "resolve"]

[host."https://934du3yi.mirror.aliyuncs.com"]
  capabilities = ["pull", "resolve"]
EOF
```

从配置文件里面我们看到的

+ server表示需要配置的mirror的镜像仓库，例如：[https://docker.io](https://docker.io)表示配置的是docker.io的mirror，这是最基本的镜像。
+ host：表示提供的mirror的镜像加速服务，可以使用中国科技大学的，也可以使用阿里云的镜像。

参考文档：[https://help.aliyun.com/zh/acr/user-guide/accelerate-the-pulls-of-docker-official-images](https://help.aliyun.com/zh/acr/user-guide/accelerate-the-pulls-of-docker-official-images)

# <font style="color:black;">启动 containerd 服务</font>
```bash
[root@k8s-master ~]# systemctl daemon-reload
[root@k8s-master ~]# systemctl enable containerd
[root@k8s-master ~]# systemctl start containerd
```

# 指定kubelet的容器运行时
+ 如果使用containerd作为容器运行时，需要指定kubelet的容器运行时，如果使用docker作为容器运行时，则无需操作下面的步骤。

crictl安装参考containerd进阶使用。

```bash
[root@k8s-master ~]# crictl config runtime-endpoint /run/containerd/containerd.sock
[root@k8s-master ~]# systemctl daemon-reload
[root@k8s-master ~]# systemctl restart kubelet
```

## 

