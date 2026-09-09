---
title: Kubernetes-高可用k8s集群部署（多Master节点二进制方式）
---

**前言：Kubernetes（简称k8s）是一个开源的容器编排平台，用于自动化部署、扩展和管理容器化应用程序。以下是k8s的一些关键特性和概念：**

1. **容器编排**：k8s帮助用户管理容器的生命周期，包括部署、扩展和运行。
2. **服务发现和负载均衡**：k8s可以为容器提供内部和外部的服务发现和负载均衡。
3. **存储编排**：k8s允许您自动挂载存储系统，无论是本地还是公共云提供商。
4. **自动部署和回滚**：您可以描述应用的期望状态，k8s可以自动将当前状态变更为期望状态。例如，您可以自动化应用部署和回滚。
5. **自动完成装箱计算**：k8s允许您指定每个容器需要的CPU和内存（RAM）。k8s可以为容器自动完成装箱计算，以尽可能高效地利用集群资源。
6. **自我修复**：k8s可以重启失败的容器、替换和杀死不响应用户定义健康检查的容器、杀死不满足用户定义的资源需求的容器，并且在节点出问题时重新调度容器。
7. **密钥和配置管理**：您可以在k8s中存储和管理敏感信息，如密码、OAuth令牌和ssh密钥。您可以在不重建容器镜像的情况下部署和更新密钥和应用程序配置，也无需在堆栈配置中暴露密钥。
8. **扩展性**：k8s提供了一套机制，支持水平扩展和垂直扩展，以满足不同的工作负载需求。
9. **多租户**：k8s强大的社区已经开发出多种插件和扩展，支持多租户场景。
10. **平台无关性**：k8s支持多种平台，包括公有云、私有云、混合云以及多种虚拟化技术。

k8s通过声明式配置、控制器模式和操作的自动化，使得管理复杂的容器环境变得更加简单和高效。它已经成为容器编排领域的事实标准，被广泛应用于生产环境中。

### 一、安装Docker

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

### 二、基础环境准备

```
#设置每个机器自己的hostname
hostnamectl set-hostname xxx
hostnamectl set-hostname master1  &&  bash
hostnamectl set-hostname master2  &&  bash
hostnamectl set-hostname master3  &&  bash
hostnamectl set-hostname node1 && bash
hostnamectl set-hostname node2 && bash
hostnamectl set-hostname node3 && bash

添加hosts解析（所有节点操作）
cat >> /etc/hosts << EOF
10.0.0.6 k8s-master1
10.0.0.7 k8s-master2
10.0.0.8 k8s-master3
10.0.0.9 k8s-node1
10.0.0.10 k8s-node2
10.0.0.11 k8s-node3
EOF

# 将 SELinux 设置为 permissive 模式（相当于将其禁用）
sudo setenforce 0
sudo sed -i 's/^SELINUX=enforcing$/SELINUX=permissive/' /etc/selinux/config

#关闭swap
swapoff -a  
sed -ri 's/.*swap.*/#&/' /etc/fstab

# 在 master1 上生成 SSH 密钥对  
ssh-keygen -t rsa    
# 将公钥复制到其他的 Kubernetes 节点上（除了 master1）  
for i in master2 master3 node1 node2 node3; do  
    ssh-copy-id -i ~/.ssh/id_rsa.pub $i  
done

#时间同步：
yum install ntpdate -y
ntpdate time.windows.com

#安装工具
yum install -y device-mapper-persistent-data jq psmisc net-tools git   lvm2 yum-utils

#修改limit
ulimit -SHn 65535    #设置或 shell 会话的文件描述符数量限制
vim /etc/security/limits.conf
添加如下内容:
soft nofile 655360      #为所有用户设置软文件描述符限制
hard nofile 131072      #为所有用户设置硬文件描述符限制
soft nproc 655350       #为所有用户设置软进程数限制
hard nproc 655350       #为所有用户设置硬进程数限制
oft memlock unlimited   #所有用户设置软内存锁定限制为无限制
hard memlock unlimited  #为所有用户设置硬内存锁定限制为无限制

# 安装ipvs工具
yum -y install ipset ipvsadm conntrack sysstat  libseccomp
# 然后在所有节点配置ipvs模块,执行以下命令：
modprobe  ip_vs
modprobe  ip_vs_rr
modprobe  ip_vs_wrr
modprobe  ip_vs_sh
modprobe  nf_conntrack  #这里需要注意内核4.18下改为nf_conntrack_ipv4；内核4.19上改为nf_conntrack，血的教训

# 修改ipvs配置
vim/etc/modules-load.d/ipvs.conf  
添加一下内容：
# IPVS 模块  
ip_vs  
ip_vs_lc  
ip_vs_wlc  
ip_vs_rr  
ip_vs_wrr  
ip_vs_lblc  
ip_vs_lblcr  
ip_vs_dh  
ip_vs_sh  
ip_vs_fo  
ip_vs_nq  
ip_vs_sed  
ip_vs_ftp  
  
# Conntrack 模块  
nf_conntrack  
  
# IPTables 和 IPSet 模块  
ip_tables  
ip_set  
xt_set  
ipt_set  
  
# 其他网络模块  
ipt_rpfilter  
ipt_REJECT  
ipip

# 执行命令
systemctl enable --now systemd-modules-load.service  #--now = enable+start
lsmod | grep -e ip_vs -e nf_conntrack 查看是否加载

## 将桥接的IPv4流量传递到iptables的链（所有节点需要执行）
vim etc/sysctl.d/k8s.conf
添加：
net.ipv4.ip_forward = 1
net.bridge.bridge-nf-call-ip6tables = 1
net.bridge.bridge-nf-call-iptables = 1

fs.may_detach_mounts = 1
vm.overcommit_memory=1
net.ipv4.conf.all.route_localnet = 1

vm.panic_on_oom=0
fs.inotify.max_user_watches=89100
fs.file-max=52706963
fs.nr_open=52706963
net.netfilter.nf_conntrack_max=2310720

net.ipv4.tcp_keepalive_time = 600
net.ipv4.tcp_keepalive_probes = 3
net.ipv4.tcp_keepalive_intvl =15
net.ipv4.tcp_max_tw_buckets = 36000
net.ipv4.tcp_tw_reuse = 1
net.ipv4.tcp_max_orphans = 327680
net.ipv4.tcp_orphan_retries = 3
net.ipv4.tcp_syncookies = 1
net.ipv4.tcp_max_syn_backlog = 16768
net.ipv4.ip_conntrack_max = 65536
net.ipv4.tcp_timestamps = 0
net.core.somaxconn = 16768
执行：sysctl --system（重新加载 sysctl 设置）

# 所有节点需要重启服务器
reboot
lsmod | grep -e ip_vs -e nf_conntrack 验证重启后内核是否加载
```

### 三、配置证书

### 1、下载cfssl核心组件

```
wget https://github.com/cloudflare/cfssl/releases/download/v1.5.0/cfssl_1.5.0_linux_amd64
wget https://github.com/cloudflare/cfssl/releases/download/v1.5.0/cfssljson_1.5.0_linux_amd64
wget https://github.com/cloudflare/cfssl/releases/download/v1.5.0/cfssl-certinfo_1.5.0_linux_amd64

#授予执行权限
chmod +x cfssl*

#批量重命名
for name in `ls cfssl*`; do mv $name ${name%_1.5.0_linux_amd64};  done

#移动到文件
mv cfssl* /usr/bin
```

### 2、ca根配置

```
命令：mkdir -p /etc/kubernetes/pki
命令：cd /etc/kubernetes/pki
```

命令：`vim ca-config.json`  
添加：

```
{
    "signing": {
        "default": {
            "expiry": "87600h"
        },
        "profiles": {
            "server": {
                "expiry": "87600h",
                "usages": [
                    "signing",
                    "key encipherment",
                    "server auth"
                ]
            },
            "client": {
                "expiry": "87600h",
                "usages": [
                    "signing",
                    "key encipherment",
                    "client auth"
                ]
            },
            "peer": {
                "expiry": "87600h",
                "usages": [
                    "signing",
                    "key encipherment",
                    "server auth",
                    "client auth"
                ]
            },
            "kubernetes": {
                "expiry": "87600h",
                "usages": [
                    "signing",
                    "key encipherment",
                    "server auth",
                    "client auth"
                ]
            },
            "etcd": {
                "expiry": "87600h",
                "usages": [
                    "signing",
                    "key encipherment",
                    "server auth",
                    "client auth"
                ]
            }
        }
    }
}
```

### 3、配置证书签名请求文件

命令：`vim /etc/kubernetes/pki/ca-csr.json`

```
{
  "CN": "kubernetes",    #公用名,如网站域
  "key": {
    "algo": "rsa",
    "size": 2048
  },
  "names": [
    {
      "C": "CN",          #国家名称，如：中国是CN
      "ST": "Hubei",      #申请单位所在的省份
      "L": "Wuhan",       #申请单位所在的城市
      "O": "Kubernetes",  #组织名，需要和营业执照上的名称完全一致
      "OU": "Kubernetes"  #单位部门，一般没有太多限制。
    }
  ],
  "ca": {
    "expiry": "87600h"
  }
}
```

### 4、生成证书和私钥

```
cfssl gencert -initca ca-csr.json | cfssljson -bare ca -
# ca.csr ca.pem(ca公钥) ca-key.pem(ca私钥)
```

### 四、搭建etcd

### 1、下载etcd

```
# 给所有master的节点，发送etcd包，用于部署etcd（高可用）
在master1上执行命令：wget https://github.com/etcd-io/etcd/releases/download/v3.4.16/etcd-v3.4.16-linux-amd64.tar.gz

## 复制到其他节点
for i in master2 master3;do scp etcd-* root@$i:/root/;done
## 解压到 /usr/local/bin
tar -zxvf etcd-v3.4.16-linux-amd64.tar.gz --strip-components=1 -C /usr/local/bin etcd-v3.4.16-linux-amd64/etcd{,ctl}
##验证
etcdctl #只要有打印就没问题
```

### 2、生成etcd证书

命令：`vim etcd-ca-csr.json`

```
{
  "CN": "etcd",
  "key": {
    "algo": "rsa",
    "size": 2048
  },
  "names": [
    {
      "C": "CN",
      "ST": "Hubei",
      "L": "Wuhan",
      "O": "etcd",
      "OU": "etcd"
    }
  ],
  "ca": {
    "expiry": "87600h"
  }
}
```

命令：`cfssl gencert -initca etcd-ca-csr.json | cfssljson -bare /etc/kubernetes/pki/etcd/ca -` #生成etcd根ca证书  
命令：`vim etcd-itdachang-csr.json`

```
{
    "CN": "etcd-itdachang",
    "key": {
        "algo": "rsa",
        "size": 2048
    },
    "hosts": [  
        "master1",
        "master2",
        "master3",
        "10.0.0.6",
        "10.0.0.7",
        "10.0.0.8"
    ],
    "names": [
        {
            "C": "CN",
            "ST": "Hubei",
            "L": "Wuhan",
            "O": "etcd",
            "OU": "etcd"
        }
    ]
}
```

```
# 使用 cfssl gencert 命令来签发itdachang的etcd证书
cfssl gencert \
   -ca=/etc/kubernetes/pki/etcd/ca.pem \
   -ca-key=/etc/kubernetes/pki/etcd/ca-key.pem \
   -config=/etc/kubernetes/pki/ca-config.json \
   -profile=etcd \
   etcd-itdachang-csr.json | cfssljson -bare /etc/kubernetes/pki/etcd/etcd

# 把生成的证书，复制给其他机器
for i in master2 master3;do scp -r /etc/kubernetes/pki/etcd root@$i:/etc/kubernetes/pki;done
```

### 3、安装etcd

编写etcd配置文件，在三个master节点上执行命令：`mkdir -p /etc/etcd`  
命令：`vim /etc/etcd/etcd.yaml`

```
name: 'etcd-master1'  #每个机器写自己的名
data-dir: /var/lib/etcd
wal-dir: /var/lib/etcd/wal
snapshot-count: 5000
heartbeat-interval: 100
election-timeout: 1000
quota-backend-bytes: 0
listen-peer-urls: 'https://10.0.0.8:2380'  # 本机ip+2380端口，和集群通信
listen-client-urls: ' https://10.0.0.8:2379 ,http://10.0.0.8:2379' #改为自己的ip
max-snapshots: 3
max-wals: 5
cors:
initial-advertise-peer-urls: 'https://10.0.0.8:2380' #自己的ip
advertise-client-urls: 'https://10.0.0.8:2379'  #自己的ip
discovery:
discovery-fallback: 'proxy'
discovery-proxy:
discovery-srv:
initial-cluster: 'etcd-master1= https://110.0.0.6:2380,etcd-master2=https://10.0.0.7:2380 ,etcd-master3=https://10.0.0.8:2380'
initial-cluster-token: 'etcd-k8s-cluster'
initial-cluster-state: 'new'
strict-reconfig-check: false
enable-v2: true
enable-pprof: true
proxy: 'off'
proxy-failure-wait: 5000
proxy-refresh-interval: 30000
proxy-dial-timeout: 1000
proxy-write-timeout: 5000
proxy-read-timeout: 0
client-transport-security:
  cert-file: '/etc/kubernetes/pki/etcd/etcd.pem'
  key-file: '/etc/kubernetes/pki/etcd/etcd-key.pem'
  client-cert-auth: true
  trusted-ca-file: '/etc/kubernetes/pki/etcd/ca.pem'
  auto-tls: true
peer-transport-security:
  cert-file: '/etc/kubernetes/pki/etcd/etcd.pem'
  key-file: '/etc/kubernetes/pki/etcd/etcd-key.pem'
  peer-client-cert-auth: true
  trusted-ca-file: '/etc/kubernetes/pki/etcd/ca.pem'
  auto-tls: true
debug: false
log-package-levels:
log-outputs: [default]
force-new-cluster: false
```

配置开机自启  
命令：`vim /usr/lib/systemd/system/etcd.service`  
添加：

```
[Unit]
Description=Etcd Service
Documentation=https://etcd.io/docs/v3.4/op-guide/clustering/
After=network.target

[Service]
Type=notify
ExecStart=/usr/local/bin/etcd --config-file=/etc/etcd/etcd.yaml
Restart=on-failure
RestartSec=10
LimitNOFILE=65536

[Install]
WantedBy=multi-user.target
Alias=etcd3.service
```

开机启动

```
systemctl daemon-reload
systemctl enable --now etcd
```

测试访问

```
# 查看etcd集群状态
etcdctl --endpoints="10.0.0.6:2379,10.0.0.7 :2379,10.0.0.8:2379" --cacert=/etc/kubernetes/pki/etcd/ca.pem --cert=/etc/kubernetes/pki/etcd/etcd.pem --key=/etc/kubernetes/pki/etcd/etcd-key.pem  endpoint status --write-out=table

# 测试命令
export ETCDCTL_API=3
HOST_1=10.0.0.6
HOST_2=10.0.0.7
HOST_3=10.0.0.8 
ENDPOINTS=$HOST_1:2379,$HOST_2:2379,$HOST_3:2379

# 如果没有环境变量的话，调用方式：
etcdctl --endpoints=$ENDPOINTS --cacert=/etc/kubernetes/pki/etcd/ca.pem --cert=/etc/kubernetes/pki/etcd/etcd.pem --key=/etc/kubernetes/pki/etcd/etcd-key.pem member list --write-out=table

#如果有，导出环境变量
export ETCDCTL_DIAL_TIMEOUT=3s
export ETCDCTL_CACERT=/etc/kubernetes/pki/etcd/ca.pem
export ETCDCTL_CERT=/etc/kubernetes/pki/etcd/etcd.pem
export ETCDCTL_KEY=/etc/kubernetes/pki/etcd/etcd-key.pem
export ETCDCTL_ENDPOINTS=$HOST_1:2379,$HOST_2:2379,$HOST_3:2379
# 自动用环境变量定义的证书位置
etcdctl  member list --write-out=table
```

### 五、k8s组件与证书

### 1、下载安装包

k8s git地址：<https://github.com/kubernetes/kubernetes>  
命令：`wget https://dl.k8s.io/v1.30.1/kubernetes-server-linux-amd64.tar.gz`  

建议配置下网络，不然如上图下载到会让你怀疑人生

```
# 将kubernetes安装包把复制给所有节点
命令：for i in  master2 master3  node1 node2 node3;do scp kubernetes-server-linux-amd64.tar.gz root@$i:/root/;done
# 所有master节点解压kubelet，kubectl等到 /usr/local/bin。
命令：tar -xvf kubernetes-server-linux-amd64.tar.gz  --strip-components=3 -C /usr/local/bin kubernetes/server/bin/kube{let,ctl,-apiserver,-controller-manager,-scheduler,-proxy}
# master需要全部组件，node节点只需要 /usr/local/bin kubelet、kube-proxy
```

### 2、生成apiserver 证书

命令：`vim apiserver-csr.json`

```
{
    "CN": "kube-apiserver",
    "hosts": [
      "66.66.0.1",        #service网段，可以自定义
      "127.0.0.1",        #本机
      "10.0.0.250",       #负载均衡器
      "10.0.0.6",
      "10.0.0.7",
      "10.0.0.8",
      "10.0.0.9",
      "10.0.0.10",
      "10.0.0.11",
      "10.0.0.12",
      "kubernetes",
      "kubernetes.default",
      "kubernetes.default.svc",
      "kubernetes.default.svc.cluster",
      "kubernetes.default.svc.cluster.local"
    ],
    "key": {
        "algo": "rsa",
        "size": 2048
    },
    "names": [
        {
            "C": "CN",
            "ST": "Hubei",
            "L": "Wuhan",
            "O": "Kubernetes",
            "OU": "Kubernetes"
        }
    ]
}
```

### 3、生成apiserver证书

命令：`vim ca-csr.json`

```
{
  "CN": "kubernetes",
  "key": {
    "algo": "rsa",
    "size": 2048
  },
  "names": [
    {
      "C": "CN",
      "ST": "Hubei",
      "L": "Wuhan",
      "O": "Kubernetes",
      "OU": "Kubernetes"
    }
  ],
  "ca": {
    "expiry": "87600h"
  }
}
```

```
生成证书命令：cfssl gencert -initca ca-csr.json | cfssljson -bare ca -
生成API服务器证书命令：cfssl gencert   -ca=/etc/kubernetes/pki/ca.pem   -ca-key=/etc/kubernetes/pki/ca-key.pem   -config=/etc/kubernetes/pki/ca-config.json   -profile=kubernetes   apiserver-csr.json | cfssljson -bare /etc/kubernetes/pki/apiserver
```

### 3、1、front-proxy根ca

命令：`vim front-proxy-ca-csr.json`

```
{
  "CN": "kubernetes",
  "key": {
     "algo": "rsa",
     "size": 2048
  }
}
```

```
生成ront-proxy根ca命令：cfssl gencert   -initca front-proxy-ca-csr.json | cfssljson -bare /etc/kubernetes/pki/front-proxy-ca
```

### 3、2、证书front-proxy-client

命令：`vim front-proxy-client-csr.json`

```
{
  "CN": "front-proxy-client",
  "key": {
     "algo": "rsa",
     "size": 2048
  }
}
```

```
#生成front-proxy-client 证书：
命令：cfssl gencert   -ca=/etc/kubernetes/pki/front-proxy-ca.pem   -ca-key=/etc/kubernetes/pki/front-proxy-ca-key.pem   -config=ca-config.json   -profile=kubernetes   front-proxy-client-csr.json | cfssljson -bare /etc/kubernetes/pki/front-proxy-client
```

警告忽略

### 4、controller-manage证书生成与配置

命令：`vim controller-manager-csr.json`

```
{
  "CN": "system:kube-controller-manager",
  "key": {
    "algo": "rsa",
    "size": 2048
  },
  "names": [
    {
      "C": "CN",
      "ST": "Hubei",
      "L": "Wuhan",
      "O": "system:kube-controller-manager",
      "OU": "Kubernetes"
    }
  ]
}
```

生成证书

```
cfssl gencert \
   -ca=/etc/kubernetes/pki/ca.pem \
   -ca-key=/etc/kubernetes/pki/ca-key.pem \
   -config=ca-config.json \
   -profile=kubernetes \
  controller-manager-csr.json | cfssljson -bare /etc/kubernetes/pki/controller-manager
```

生成配置

```
# set-cluster：设置一个集群项，
kubectl config set-cluster kubernetes \
     --certificate-authority=/etc/kubernetes/pki/ca.pem \
     --embed-certs=true \
     --server=https://10.0.0.250:6443 \
     --kubeconfig=/etc/kubernetes/controller-manager.conf

# 设置一个环境项，一个上下文
kubectl config set-context system:kube-controller-manager@kubernetes \
    --cluster=kubernetes \
    --user=system:kube-controller-manager \
    --kubeconfig=/etc/kubernetes/controller-manager.conf

# set-credentials 设置一个用户项
kubectl config set-credentials system:kube-controller-manager \
     --client-certificate=/etc/kubernetes/pki/controller-manager.pem \
     --client-key=/etc/kubernetes/pki/controller-manager-key.pem \
     --embed-certs=true \
     --kubeconfig=/etc/kubernetes/controller-manager.conf

# 使用某个环境当做默认环境
kubectl config use-context system:kube-controller-manager@kubernetes \
     --kubeconfig=/etc/kubernetes/controller-manager.conf
# 后来也用来自动批复kubelet证书
```

### 5、scheduler证书生成与配置

命令：`vim scheduler-csr.json`

```
{
  "CN": "system:kube-scheduler",
  "key": {
    "algo": "rsa",
    "size": 2048
  },
  "names": [
    {
      "C": "CN",
      "ST": "Hubei",
      "L": "Wuhan",
      "O": "system:kube-scheduler",
      "OU": "Kubernetes"
    }
  ]
}
```

### 5、1、签发证书

```
cfssl gencert \
   -ca=/etc/kubernetes/pki/ca.pem \
   -ca-key=/etc/kubernetes/pki/ca-key.pem \
   -config=/etc/kubernetes/pki/ca-config.json \
   -profile=kubernetes \
   scheduler-csr.json | cfssljson -bare /etc/kubernetes/pki/scheduler
```

### 5、2、生成配置

```
kubectl config set-cluster kubernetes \
     --certificate-authority=/etc/kubernetes/pki/ca.pem \
     --embed-certs=true \
     --server=https://10.0.0.250:6443 \
     --kubeconfig=/etc/kubernetes/scheduler.conf
kubectl config set-credentials system:kube-scheduler \
     --client-certificate=/etc/kubernetes/pki/scheduler.pem \
     --client-key=/etc/kubernetes/pki/scheduler-key.pem \
     --embed-certs=true \
     --kubeconfig=/etc/kubernetes/scheduler.conf

kubectl config set-context system:kube-scheduler@kubernetes \
     --cluster=kubernetes \
     --user=system:kube-scheduler \
     --kubeconfig=/etc/kubernetes/scheduler.conf
kubectl config use-context system:kube-scheduler@kubernetes \
     --kubeconfig=/etc/kubernetes/scheduler.conf
```

### 6、admin证书生成与配置

命令：`vim admin-csr.json`

```
{
  "CN": "admin",
  "key": {
    "algo": "rsa",
    "size": 2048
  },
  "names": [
    {
      "C": "CN",
      "ST": "Hubei",
      "L": "Wuhan",
      "O": "system:masters",
      "OU": "Kubernetes"
    }
  ]
}
```

### 6、1、生成证书

```
cfssl gencert \
   -ca=/etc/kubernetes/pki/ca.pem \
   -ca-key=/etc/kubernetes/pki/ca-key.pem \
   -config=/etc/kubernetes/pki/ca-config.json \
   -profile=kubernetes \
   admin-csr.json | cfssljson -bare /etc/kubernetes/pki/admin
```

### 6、2、生成配置

```
kubectl config set-cluster kubernetes \
--certificate-authority=/etc/kubernetes/pki/ca.pem \
--embed-certs=true \
--server=https://10.0.0.250:6443 \
--kubeconfig=/etc/kubernetes/admin.conf
kubectl config set-credentials kubernetes-admin \
--client-certificate=/etc/kubernetes/pki/admin.pem \
--client-key=/etc/kubernetes/pki/admin-key.pem \
--embed-certs=true \
--kubeconfig=/etc/kubernetes/admin.conf
kubectl config set-context kubernetes-admin@kubernetes \
--cluster=kubernetes \
--user=kubernetes-admin \
--kubeconfig=/etc/kubernetes/admin.conf

kubectl config use-context kubernetes-admin@kubernetes \
--kubeconfig=/etc/kubernetes/admin.conf
```

### 7、ServiceAccount Key生成

每创建一个ServiceAccount，都会分配一个Secret，而Secret里面有秘钥，秘钥是由sa生成的，所以需要提前创建出sa信息。

```
openssl genrsa -out /etc/kubernetes/pki/sa.key 2048
openssl rsa -in /etc/kubernetes/pki/sa.key -pubout -out /etc/kubernetes/pki/sa.pub
```

### 8、发送证书到其他节点

在master1上执行：

```
for NODE in master2 master3
do
	for FILE in admin.conf controller-manager.conf scheduler.conf
	do
	scp /etc/kubernetes/${FILE} $NODE:/etc/kubernetes/${FILE}
	done
done
```

### 六、启动各组件

### 1、所有的master节点上执行：

```
mkdir -p /etc/kubernetes/manifests/ /etc/systemd/system/kubelet.service.d /var/lib/kubelet /var/log/kubernetes
三个master节点kube-xx相关的程序都在 /usr/local/bin
for NODE in master2 master3
do
	scp -r /etc/kubernetes/* root@$NODE:/etc/kubernetes/
done
```

### 2、配置apiserver服务

### 2、1、所有Master节点创建kube-apiserver.service

每个master节点执行以下内容：  
命令：`vim /usr/lib/systemd/system/kube-apiserver.service`  
添加：

```
[Unit]
Description=Kubernetes API Server
Documentation=https://github.com/kubernetes/kubernetes
After=network.target

[Service]
ExecStart=/usr/local/bin/kube-apiserver \
      --v=2  \
      --logtostderr=true  \
      --allow-privileged=true  \
      --bind-address=0.0.0.0  \
      --secure-port=6443  \
      --insecure-port=0  \
      --advertise-address=10.0.0.6 \
      --service-cluster-ip-range=10.96.0.0/16  \
      --service-node-port-range=30000-32767  \
      --etcd-servers= https://10.0.0.6:2379,https://10.0.0.7:2379 ,https://10.0.0.8:2379 \
      --etcd-cafile=/etc/kubernetes/pki/etcd/ca.pem  \
      --etcd-certfile=/etc/kubernetes/pki/etcd/etcd.pem  \
      --etcd-keyfile=/etc/kubernetes/pki/etcd/etcd-key.pem  \
      --client-ca-file=/etc/kubernetes/pki/ca.pem  \
      --tls-cert-file=/etc/kubernetes/pki/apiserver.pem  \
      --tls-private-key-file=/etc/kubernetes/pki/apiserver-key.pem  \
      --kubelet-client-certificate=/etc/kubernetes/pki/apiserver.pem  \
      --kubelet-client-key=/etc/kubernetes/pki/apiserver-key.pem  \
      --service-account-key-file=/etc/kubernetes/pki/sa.pub  \
      --service-account-signing-key-file=/etc/kubernetes/pki/sa.key  \
      --service-account-issuer=https://kubernetes.default.svc.cluster.local \
      --kubelet-preferred-address-types=InternalIP,ExternalIP,Hostname  \
      --enable-admission-plugins=NamespaceLifecycle,LimitRanger,ServiceAccount,DefaultStorageClass,DefaultTolerationSeconds,NodeRestriction,ResourceQuota  \
      --authorization-mode=Node,RBAC  \
      --enable-bootstrap-token-auth=true  \
      --requestheader-client-ca-file=/etc/kubernetes/pki/front-proxy-ca.pem  \
      --proxy-client-cert-file=/etc/kubernetes/pki/front-proxy-client.pem  \
      --proxy-client-key-file=/etc/kubernetes/pki/front-proxy-client-key.pem  \
      --requestheader-allowed-names=aggregator,front-proxy-client  \
      --requestheader-group-headers=X-Remote-Group  \
      --requestheader-extra-headers-prefix=X-Remote-Extra-  \
      --requestheader-username-headers=X-Remote-User
      # --token-auth-file=/etc/kubernetes/token.csv

Restart=on-failure
RestartSec=10s
LimitNOFILE=65535

[Install]
WantedBy=multi-user.target
```

### 2.2、启动apiserver

启动命令：`systemctl daemon-reload && systemctl enable --now kube-apiserver`  
查看状态命令：`systemctl status kube-apiserver`

### 3、配置controller-manager服务

### 3.1、所有Master节点配置kube-controller-manager.service

所有节点执行:  
命令：`vim /usr/lib/systemd/system/kube-controller-manager.service`  
添加：

```
[Unit]
Description=Kubernetes Controller Manager
Documentation=https://github.com/kubernetes/kubernetes
After=network.target

[Service]
ExecStart=/usr/local/bin/kube-controller-manager \
      --v=2 \
      --logtostderr=true \
      --address=127.0.0.1 \
      --root-ca-file=/etc/kubernetes/pki/ca.pem \
      --cluster-signing-cert-file=/etc/kubernetes/pki/ca.pem \
      --cluster-signing-key-file=/etc/kubernetes/pki/ca-key.pem \
      --service-account-private-key-file=/etc/kubernetes/pki/sa.key \
      --kubeconfig=/etc/kubernetes/controller-manager.conf \
      --leader-elect=true \
      --use-service-account-credentials=true \
      --node-monitor-grace-period=40s \
      --node-monitor-period=5s \
      --pod-eviction-timeout=2m0s \
      --controllers=*,bootstrapsigner,tokencleaner \
      --allocate-node-cidrs=true \
      --cluster-cidr=196.168.0.0/16 \
      --requestheader-client-ca-file=/etc/kubernetes/pki/front-proxy-ca.pem \
      --node-cidr-mask-size=24
      
Restart=always
RestartSec=10s

[Install]
WantedBy=multi-user.target
```

`--cluster-cidr=196.168.0.0/16` ： 为Pod的网段。可以修改成自己规划的网段

### 3.2、启动

```
# 所有master节点执行：
systemctl daemon-reload
systemctl daemon-reload && systemctl enable --now kube-controller-manager
systemctl status kube-controller-manager
```

### 4、所有Master节点配置kube-scheduler.service

命令：`vim /usr/lib/systemd/system/kube-scheduler.service`

```
[Unit]
Description=Kubernetes Scheduler
Documentation=https://github.com/kubernetes/kubernetes
After=network.target

[Service]
ExecStart=/usr/local/bin/kube-scheduler \
      --v=2 \
      --logtostderr=true \
      --address=127.0.0.1 \
      --leader-elect=true \
      --kubeconfig=/etc/kubernetes/scheduler.conf

Restart=always
RestartSec=10s

[Install]
WantedBy=multi-user.target
```

### 4.2、启动

执行以下命令：

```
systemctl daemon-reload
systemctl daemon-reload && systemctl enable --now kube-scheduler
systemctl status kube-scheduler
```

### 七、TLS和Kubernetes的引导启动

### 1、master1配置bootstrap

```
#准备一个token
head -c 16 /dev/urandom | od -An -t x | tr -d ' '
# 值如下： 1ff64c60de40a57b5d30d8c40a14e354

# 生成16个字符的
head -c 8 /dev/urandom | od -An -t x | tr -d ' '
# 84d107288bc64d51
```

```
设置集群
kubectl config set-cluster kubernetes \
--certificate-authority=/etc/kubernetes/pki/ca.pem \
--embed-certs=true \
--server=https://10.0.0.250:6443 \
--kubeconfig=/etc/kubernetes/bootstrap-kubelet.conf

#设置秘钥
kubectl config set-credentials tls-bootstrap-token-user \
--token=l6fy8c.d683399b7a553977 \
--kubeconfig=/etc/kubernetes/bootstrap-kubelet.conf 

#设置上下文
kubectl config set-context tls-bootstrap-token-user@kubernetes \
--cluster=kubernetes \
--user=tls-bootstrap-token-user \
--kubeconfig=/etc/kubernetes/bootstrap-kubelet.conf

#使用设置
kubectl config use-context tls-bootstrap-token-user@kubernetes \
--kubeconfig=/etc/kubernetes/bootstrap-kubelet.conf
```

### 2、master1设置kubectl执行权限

```
命令：mkdir -p /root/.kube ;
命令：cp /etc/kubernetes/admin.conf /root/.kube/confi
# 只在master1生成，只让一台机器具有操作集群的权限，便于控制
```

```
#验证
命令：kubectl get nodes
[root@master1 ~]# kubectl get nodes
No resources found
#说明已经可以连接apiserver并获取资源
```

### 3、创建集群引导权限文件

master准备这个文件  
命令：`vim /etc/kubernetes/bootstrap.secret.yaml`

```
apiVersion: v1
kind: Secret
metadata:
  name: bootstrap-token-l6fy8c
  namespace: kube-system
type: bootstrap.kubernetes.io/token
stringData:
  description: "The default bootstrap token generated by 'kubelet '."
  token-id: l6fy8c
  token-secret: 84d107288bc64d51
  usage-bootstrap-authentication: "true"
  usage-bootstrap-signing: "true"
  auth-extra-groups:  system:bootstrappers:default-node-token,system:bootstrappers:worker,system:bootstrappers:ingress
 
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: kubelet-bootstrap
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: system:node-bootstrapper
subjects:
- apiGroup: rbac.authorization.k8s.io
  kind: Group
  name: system:bootstrappers:default-node-token
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: node-autoapprove-bootstrap
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: system:certificates.k8s.io:certificatesigningrequests:nodeclient
subjects:
- apiGroup: rbac.authorization.k8s.io
  kind: Group
  name: system:bootstrappers:default-node-token
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: node-autoapprove-certificate-rotation
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: system:certificates.k8s.io:certificatesigningrequests:selfnodeclient
subjects:
- apiGroup: rbac.authorization.k8s.io
  kind: Group
  name: system:nodes
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  annotations:
    rbac.authorization.kubernetes.io/autoupdate: "true"
  labels:
    kubernetes.io/bootstrapping: rbac-defaults
  name: system:kube-apiserver-to-kubelet
rules:
  - apiGroups:
      - ""
    resources:
      - nodes/proxy
      - nodes/stats
      - nodes/log
      - nodes/spec
      - nodes/metrics
    verbs:
      - "*"
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: system:kube-apiserver
  namespace: ""
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: system:kube-apiserver-to-kubelet
subjects:
  - apiGroup: rbac.authorization.k8s.io
    kind: User
    name: kube-apiserver
```

```
# 创建资源
kubectl create -f /etc/kubernetes/bootstrap.secret.yaml
```

### 八、引导Node节点启动

### 1、master1节点将核心证书发送给其他节点

```
命令：cd /etc/kubernetes/ 
#执行复制所有令牌操作
for NODE in master2 master3 node1 ode2; do
     ssh $NODE mkdir -p /etc/kubernetes/pki/etcd
     for FILE in ca.pem etcd.pem etcd-key.pem; do
       scp /etc/kubernetes/pki/etcd/$FILE $NODE:/etc/kubernetes/pki/etcd/
     done
     for FILE in pki/ca.pem pki/ca-key.pem pki/front-proxy-ca.pem bootstrap-kubelet.conf; do
       scp /etc/kubernetes/$FILE $NODE:/etc/kubernetes/${FILE}
 done
 done
```

### 2、所有节点配置kubelet

```
# 所有节点创建相关目录
mkdir -p /var/lib/kubelet /var/log/kubernetes /etc/systemd/system/kubelet.service.d /etc/kubernetes/manifests/

## 所有node节点必须有 kubelet kube-proxy
for NODE in master2 master3 node3 node1 node2; do
    scp -r /etc/kubernetes/* root@$NODE:/etc/kubernetes/
done
```

### 2.1、创建kubelet.service

所有节点，配置kubelet服务  
命令：`vim /usr/lib/systemd/system/kubelet.service`  
添加：

```
[Unit]
Description=Kubernetes Kubelet
Documentation=https://github.com/kubernetes/kubernetes
After=docker.service
Requires=docker.service

[Service]
ExecStart=/usr/local/bin/kubelet

Restart=always
StartLimitInterval=0
RestartSec=10

[Install]
WantedBy=multi-user.target
```

# 所有节点配置kubelet service配置文件

命令：`vim /etc/systemd/system/kubelet.service.d/10-kubelet.conf`  
添加：

```
[Service]
Environment="KUBELET_KUBECONFIG_ARGS=--bootstrap-kubeconfig=/etc/kubernetes/bootstrap-kubelet.conf --kubeconfig=/etc/kubernetes/kubelet.conf"
Environment="KUBELET_SYSTEM_ARGS=--network-plugin=cni --cni-conf-dir=/etc/cni/net.d --cni-bin-dir=/opt/cni/bin"
Environment="KUBELET_CONFIG_ARGS=--config=/etc/kubernetes/kubelet-conf.yml --pod-infra-container-image=registry.cn-hangzhou.aliyuncs.com/lfy_k8s_images/pause:3.4.1"
Environment="KUBELET_EXTRA_ARGS=--node-labels=node.kubernetes.io/node='' "
ExecStart=
ExecStart=/usr/local/bin/kubelet $KUBELET_KUBECONFIG_ARGS $KUBELET_CONFIG_ARGS $KUBELET_SYSTEM_ARGS $KUBELET_EXTRA_ARGS
```

**2.2、创建kubelet-conf.yml文件**

```
#所有节点，配置kubelet-conf文件
命令：vim /etc/kubernetes/kubelet-conf.yml
# clusterDNS 为service网络的第10个ip值,改成自己的ip，如10.96.0.8
```

```
apiVersion: kubelet.config.k8s.io/v1beta1
kind: KubeletConfiguration
address: 0.0.0.0
port: 10250
readOnlyPort: 10255
authentication:
  anonymous:
    enabled: false
  webhook:
    cacheTTL: 2m0s
    enabled: true
  x509:
    clientCAFile: /etc/kubernetes/pki/ca.pem
authorization:
  mode: Webhook
  webhook:
    cacheAuthorizedTTL: 5m0s
    cacheUnauthorizedTTL: 30s
cgroupDriver: systemd
cgroupsPerQOS: true
clusterDNS:
- 10.96.0.8
clusterDomain: cluster.local
containerLogMaxFiles: 5
containerLogMaxSize: 10Mi
contentType: application/vnd.kubernetes.protobuf
cpuCFSQuota: true
cpuManagerPolicy: none
cpuManagerReconcilePeriod: 10s
enableControllerAttachDetach: true
enableDebuggingHandlers: true
enforceNodeAllocatable:
- pods
eventBurst: 10
eventRecordQPS: 5
evictionHard:
  imagefs.available: 15%
  memory.available: 100Mi
  nodefs.available: 10%
  nodefs.inodesFree: 5%
evictionPressureTransitionPeriod: 5m0s  #缩小相应的配置
failSwapOn: true
fileCheckFrequency: 20s
hairpinMode: promiscuous-bridge
healthzBindAddress: 127.0.0.1
healthzPort: 10248
httpCheckFrequency: 20s
imageGCHighThresholdPercent: 85
imageGCLowThresholdPercent: 80
imageMinimumGCAge: 2m0s
iptablesDropBit: 15
iptablesMasqueradeBit: 14
kubeAPIBurst: 10
kubeAPIQPS: 5
makeIPTablesUtilChains: true
maxOpenFiles: 1000000
maxPods: 110
nodeStatusUpdateFrequency: 10s
oomScoreAdj: -999
podPidsLimit: -1
registryBurst: 10
registryPullQPS: 5
resolvConf: /etc/resolv.conf
rotateCertificates: true
runtimeRequestTimeout: 2m0s
serializeImagePulls: true
staticPodPath: /etc/kubernetes/manifests
streamingConnectionIdleTimeout: 4h0m0s
syncFrequency: 1m0s
volumeStatsAggPeriod: 1m0s
```

### 2、3、所有节点启动kubelet

```
systemctl daemon-reload && systemctl enable --now kubelet
systemctl status kubelet
#提示 "Unable to update cni config"
```

### 3、配置kube-proxy

### 3.1、生成kube-proxy.conf

在master1执行：

```
#创建kube-proxy的sa
kubectl -n kube-system create serviceaccount kube-proxy

#创建角色绑定
kubectl create clusterrolebinding system:kube-proxy \
--clusterrole system:node-proxier \
--serviceaccount kube-system:kube-proxy

#导出变量，方便后面使用
SECRET=$(kubectl -n kube-system get sa/kube-proxy --output=jsonpath='{.secrets[0].name}')
JWT_TOKEN=$(kubectl -n kube-system get secret/$SECRET --output=jsonpath='{.data.token}' | base64 -d)
PKI_DIR=/etc/kubernetes/pki
K8S_DIR=/etc/kubernetes

# 生成kube-proxy配置
# --server: 指定自己的apiserver地址或者lb地址
kubectl config set-cluster kubernetes \
--certificate-authority=/etc/kubernetes/pki/ca.pem \
--embed-certs=true \
--server=https://10.0.0.250:6443 \
--kubeconfig=${K8S_DIR}/kube-proxy.conf

# kube-proxy秘钥设置
kubectl config set-credentials kubernetes \
--token=${JWT_TOKEN} \
--kubeconfig=/etc/kubernetes/kube-proxy.conf
kubectl config set-context kubernetes \
--cluster=kubernetes \
--user=kubernetes \
--kubeconfig=/etc/kubernetes/kube-proxy.conf
kubectl config use-context kubernetes \
--kubeconfig=/etc/kubernetes/kube-proxy.conf

#将生成的 kube-proxy.conf 传给每个节点
for NODE in master2 master3 node1 node2 node3; do
      scp /etc/kubernetes/kube-proxy.conf $NODE:/etc/kubernetes/
 done
```

### 3.2、配置kube-proxy.service

所有节点配置 kube-proxy.service 服务，设置开机自启  
命令：`vim /usr/lib/systemd/system/kube-proxy.service`  
添加：

```
[Unit]
Description=Kubernetes Kube Proxy
Documentation=https://github.com/kubernetes/kubernetes
After=network.target

[Service]
ExecStart=/usr/local/bin/kube-proxy \
  --config=/etc/kubernetes/kube-proxy.yaml \
  --v=2

Restart=always
RestartSec=10s

[Install]
WantedBy=multi-user.target
```

### 3.3、准备kube-proxy.yaml

所有机器执行  
命令：`vim /etc/kubernetes/kube-proxy.yaml`  
添加：

```
apiVersion: kubeproxy.config.k8s.io/v1alpha1
bindAddress: 0.0.0.0
clientConnection:
  acceptContentTypes: ""
  burst: 10
  contentType: application/vnd.kubernetes.protobuf
  kubeconfig: /etc/kubernetes/kube-proxy.conf   #kube-proxy引导文件
  qps: 5
clusterCIDR: 196.168.0.0/16  #修改成自己的Pod-CIDR
configSyncPeriod: 15m0s
conntrack:
  max: null
  maxPerCore: 32768
  min: 131072
  tcpCloseWaitTimeout: 1h0m0s
  tcpEstablishedTimeout: 24h0m0s
enableProfiling: false
healthzBindAddress: 0.0.0.0:10256
hostnameOverride: ""
iptables:
  masqueradeAll: false
  masqueradeBit: 14
  minSyncPeriod: 0s
  syncPeriod: 30s
ipvs:
  masqueradeAll: true
  minSyncPeriod: 5s
  scheduler: "rr"
  syncPeriod: 30s
kind: KubeProxyConfiguration
metricsBindAddress: 127.0.0.1:10249
mode: "ipvs"
nodePortAddresses: null
oomScoreAdj: -999
portRange: ""
udpIdleTimeout: 250ms
```

### 3.4、所有节点启动kube-proxy

```
systemctl daemon-reload && systemctl enable --now kube-proxy
systemctl status kube-proxy
```

### 九、calico部署

```
# 下载官网calico
curl https://docs.projectcalico.org/manifests/calico-etcd.yaml -o calico.yaml
## 把这个镜像修改成国内镜像
# 修改一些我们自定义的. 修改etcd集群地址
sed -i 's#etcd_endpoints: "http://<ETCD_IP>:<ETCD_PORT>"#etcd_endpoints: " https://10.0.0.6:2379,https://10.0.0.7:2379 ,https://10.0.0.8:2379"#g' calico.yaml
# etcd的证书内容，需要base64编码设置到yaml中
ETCD_CA=`cat /etc/kubernetes/pki/etcd/ca.pem | base64 -w 0 `
ETCD_CERT=`cat /etc/kubernetes/pki/etcd/etcd.pem | base64 -w 0 `
ETCD_KEY=`cat /etc/kubernetes/pki/etcd/etcd-key.pem | base64 -w 0 `

# 替换etcd中的证书base64编码后的内容
sed -i "s@# etcd-key: null@etcd-key: ${ETCD_KEY}@g; s@# etcd-cert: null@etcd-cert: ${ETCD_CERT}@g; s@# etcd-ca: null@etcd-ca: ${ETCD_CA}@g" calico.yaml
#打开 etcd_ca 等默认设置（calico启动后自己生成）。
sed -i 's#etcd_ca: ""#etcd_ca: "/calico-secrets/etcd-ca"#g; s#etcd_cert: ""#etcd_cert: "/calico-secrets/etcd-cert"#g; s#etcd_key: "" #etcd_key: "/calico-secrets/etcd-key" #g' calico.yaml

# 修改Pod网段 196.168.0.0/16
POD_SUBNET="196.168.0.0/16"  
sed -i "s@# *- name: CALICO_IPV4POOL_CIDR@  - name: CALICO_IPV4POOL_CIDR@g; s@# *value: *\"[0-9.]*\/[0-9]*\"@  value: \"${POD_SUBNET}\"@g" calico.yaml
# 一定确定是否修改好了

#确认calico是否修改好
grep "CALICO_IPV4POOL_CIDR" calico.yaml -A 1

# 应用calico配置
kubectl apply -f calico.yaml
```

### 十、部署coreDNS

```
git clone https://github.com/coredns/deployment.git
cd deployment/kubernetes

#10.96.0.8 改为 service 网段的 第 10 个ip
./deploy.sh -s -i 10.96.0.8 | kubectl apply -f -
```

### 十一、给机器打上标签

```
kubectl label node master1 node-role.kubernetes.io/master=''
kubectl label node master2 node-role.kubernetes.io/master=''
kubectl label node master3 node-role.kubernetes.io/master=''

kubectl taints node master1
```

### 十二、集群验证

① 验证Pod网络可访问性：同名称空间，不同名称空间可以使用 ip 互相访问；跨机器部署的Pod也可以互相访问  
② 验证Service网络可访问性：集群机器使用serviceIp可以负载均衡访问；pod内部可以访问service域名 serviceName.namespace；pod可以访问跨名称空间的service

```
# 部署以下Deployment用了进行测试
apiVersion: apps/v1
kind: Deployment
metadata:
  name:  nginx-1
  namespace: default
  labels:
    app:  nginx-1
spec:
  selector:
    matchLabels:
      app: nginx-1
  replicas: 1
  template:
    metadata:
      labels:
        app:  nginx-1
    spec:
      containers:
      - name:  nginx-1
        image:  nginx
---
apiVersion: v1
kind: Service
metadata:
  name: nginx-svc
  namespace: default
spec:
  selector:
    app:  nginx-1
  type: ClusterIP
  ports:
  - name: nginx-svc
    port: 80
    targetPort: 80
    protocol: TCP
---
apiVersion: v1
kind: Namespace
metadata:
  name: hello
spec: {}
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name:  nginx-hello
  namespace: hello
  labels:
    app:  nginx-hello
spec:
  selector:
    matchLabels:
      app: nginx-hello
  replicas: 1
  template:
    metadata:
      labels:
        app:  nginx-hello
    spec:
      containers:
      - name:  nginx-hello
        image:  nginx
---
apiVersion: v1
kind: Service
metadata:
  name: nginx-svc-hello
  namespace: hello
spec:
  selector:
    app:  nginx-hello
  type: ClusterIP
  ports:
  - name: nginx-svc-hello
    port: 80
    targetPort: 80
    protocol: TCP
```

```
# 给工作节点打上 worker 标签：
kubectl label nodes node3 node-role.kubernetes.io/worker=''  
kubectl label nodes node1 node-role.kubernetes.io/worker=''  
kubectl label nodes node2 node-role.kubernetes.io/worker=''

# 给master3节点添加一个为 master 角色的标签，并给名为 master1 的节点添加一个自定义污点，以确保新的 Pod 不会被调度到 master1 节点上，除非明确声明了容忍这个污点
kubectl label nodes master3 node-role.kubernetes.io/master=""
kubectl taint nodes master1 master-node.example.com/dedicated=:NoSchedule
```
