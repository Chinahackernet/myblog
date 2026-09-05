# 基础规划

  

1、IP规划

<table class="lake-table" style="width: 717px;"><colgroup><col span="1" width="179" /><col span="1" width="179" /><col span="1" width="180" /><col span="1" width="180" /></colgroup><tbody><tr style="height: 33px;"><td>主机名</td><td>IP</td><td>配置</td><td>软件</td></tr></tbody><tbody><tr style="height: 33px;"><td>master-k8s</td><td>10.1.10.128</td><td>2C4G</td><td>etcd,apiserver,controller-manager,scheduler</td></tr><tr style="height: 33px;"><td>node01-k8s</td><td>10.1.10.129</td><td>2C4G</td><td>etcd,docker,kubelet,kube-proxy</td></tr><tr style="height: 33px;"><td>node02-k8s</td><td>10.1.10.130</td><td>2C4G</td><td>etcd,docker,kubelet,kube-proxy</td></tr></tbody></table>

  

2、软件规划

  

<table class="lake-table" style="width: 717px;"><colgroup><col span="1" width="359" /><col span="1" width="359" /></colgroup><tbody><tr style="height: 33px;"><td><p>软件名</p></td><td><p>版本</p></td></tr><tr style="height: 33px;"><td rowspan="1" colspan="1"><span style="color: #262626;">etcd</span></td><td><p>3.3.18</p></td></tr><tr style="height: 33px;"><td><p>docker-ce</p></td><td rowspan="1" colspan="1"><span style="color: #262626;">19.03.5-3</span></td></tr><tr style="height: 33px;"><td colspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><p>cfssl</p></td><td colspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><p>1.2.0</p></td></tr><tr style="height: 33px;"><td colspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><p>kubernetes</p></td><td colspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><p>1.16.4</p></td></tr><tr style="height: 33px;"><td colspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><p>flannel</p></td><td colspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><p>0.11.0</p></td></tr><tr style="height: 33px;"><td colspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><p>cni</p></td><td colspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><p>0.8.3</p></td></tr></tbody></table>

  

3、目录规划

  

<table class="lake-table" style="width: 766px;"><colgroup><col span="1" width="216" /><col span="1" width="551" /></colgroup><tbody><tr style="height: 33px;"><td><p>目录名</p></td><td><p>用途</p></td></tr><tr style="height: 33px;"><td rowspan="1" colspan="1"><span style="color: #262626;">/var/log/kubernetes/</span></td><td><p>存储日志</p></td></tr><tr style="height: 33px;"><td><p><span>/root/kubernetes/install</span></p></td><td><p>安装软件目录</p></td></tr><tr style="height: 33px;"><td colspan="1" rowspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><p>/opt/kubernetes</p></td><td colspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><p>K8S项目部署目录，其中ssl是证书目录，bin是二进制目录，config是配置文件目录</p></td></tr><tr style="height: 33px;"><td colspan="1" rowspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><p>/opt/etcd</p></td><td colspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><p>Etcd项目部署目录，子目录功能如上</p></td></tr><tr style="height: 33px;"><td colspan="1" rowspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><p>/opt/cni</p></td><td colspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><p>cni二进制文件保存目录</p></td></tr><tr style="height: 33px;"><td colspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><p>/opt/kubernetes/ssl</p></td><td colspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><p>证书生成目录</p></td></tr><tr style="height: 33px;"><td colspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><p>/opt/kubernetes/kubeconfig</p></td><td colspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><p>kubeconfig统一生成目录</p></td></tr><tr style="height: 33px;"><td colspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><p>/opt/kubernetes/system</p></td><td colspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><p>系统组件YAML文件存储目录</p></td></tr></tbody></table>

  

```
mkdir /var/log/kubernetes /root/kubernetes/{ssl,install,kubeconfig} /root/kubernetes/ssl /opt/etcd/{bin,config,ssl} /opt/kubernetes/{bin,config,ssl} /opt/cni/bin -p
```

  

# 主机初始化配置

  

2、设置hostname

  

```
# 10.1.10.128
hostnamectl set-hostname master-k8s
# 10.1.10.129
hostnamectl set-hostname node01-k8s
# 10.1.10.130
hostnamectl set-hostname node02-k8s
```

  

3、配置Hosts（/etc/hosts）

  

```
cat >> /etc/hosts <<EOF
10.1.10.128 master-k8s
10.1.10.129 node01-k8s
10.1.10.130 node02-k8s
EOF
```

  

4、初始化

  

关闭防火墙

  

```
systemctl stop firewalld
systemctl disable firewalld
```

  

关闭SELINUX

  

```
setenforce 0
sed -i "s/SELINUX=enforcing/SELINUX=disabled/g" /etc/sysconfig/selinux
```

  

刷新yum缓存

  

```
yum clean all
yum makecache
```

  

修改内核参数

  

```
cat > /etc/sysctl.d/k8s.conf <<EOF
net.bridge.bridge-nf-call-ip6tables = 1
net.bridge.bridge-nf-call-iptables = 1
net.ipv4.ip_forward = 1
vm.swappiness=0
EOF

modprobe br_netfilter
sysctl -p /etc/sysctl.d/k8s.conf
```

  

安装IPVS

  

```
cat > /etc/sysconfig/modules/ipvs.modules <<EOF
#!/bin/bash
modprobe -- ip_vs
modprobe -- ip_vs_rr
modprobe -- ip_vs_wrr
modprobe -- ip_vs_sh
modprobe -- nf_conntrack_ipv4
EOF

chmod 755 /etc/sysconfig/modules/ipvs.modules && bash /etc/sysconfig/modules/ipvs.modules && lsmod | grep -e ip_vs -e nf_conntrack_ipv4

yum install ipset ipvsadm  -y
```

  

同步服务器时间

  

> master

```
#安装chrony：
yum -y install chrony
#注释默认ntp服务器
sed -i 's/^server/#&/' /etc/chrony.conf
#指定上游公共 ntp 服务器，并允许其他节点同步时间
cat >> /etc/chrony.conf << EOF
server 0.asia.pool.ntp.org iburst
server 1.asia.pool.ntp.org iburst
server 2.asia.pool.ntp.org iburst
server 3.asia.pool.ntp.org iburst
allow all
EOF
#重启chronyd服务并设为开机启动：
systemctl enable chronyd && systemctl restart chronyd
#开启网络时间同步功能
timedatectl set-ntp true
```

  

> slave

```
#安装chrony：
yum -y install chrony
#注释默认服务器
sed -i 's/^server/#&/' /etc/chrony.conf
#指定内网 master节点为上游NTP服务器
echo 'server 10.1.10.128 iburst' >> /etc/chrony.conf
#重启服务并设为开机启动：
systemctl enable chronyd && systemctl restart chronyd
```

  

关闭SWAP分区

  

```
swapoff -a
sed -i "s/\/dev\/mapper\/centos-swap/#\/dev\/mapper\/centos-swap/g" /etc/fstab
```

  

# 安装docker

  

```
yum install -y yum-utils device-mapper-persistent-data lvm2
yum-config-manager --add-repo https://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo
yum makecache fast
yum install docker-ce -y
systemctl start docker
systemctl enable docker
```

  

配置镜像加速（）

  

```
curl -sSL https://get.daocloud.io/daotools/set_mirror.sh | sh -s http://f1361db2.m.daocloud.io

systemctl restart docker
```

  

安装其他软件：

  

```
yum install unzip wget lrzsz -y
```

  

优化：

  

```
vi daemon.json
{
    "max-concurrent-downloads": 20,
    "log-driver": "json-file",
    "bridge": "none",
    "oom-score-adjust": -1000,
    "debug": false,
    "log-opts": {
        "max-size": "100M",
        "max-file": "10"
    },
    "default-ulimits": {
        "nofile": {
            "Name": "nofile",
            "Hard": 65535,
            "Soft": 65535
        },
        "nproc": {
            "Name": "nproc",
            "Hard": 65535,
            "Soft": 65535
        },
      "core": {
            "Name": "core",
            "Hard": -1,
            "Soft": -1    
      }

    }
}
```

  

# 安装cfssl证书生成工具

  

```
curl -L https://pkg.cfssl.org/R1.2/cfssl_linux-amd64 -o /usr/local/bin/cfssl
curl -L https://pkg.cfssl.org/R1.2/cfssljson_linux-amd64 -o /usr/local/bin/cfssljson
curl -L https://pkg.cfssl.org/R1.2/cfssl-certinfo_linux-amd64 -o /usr/local/bin/cfssl-certinfo
chmod +x /usr/local/bin/cfssl /usr/local/bin/cfssljson /usr/local/bin/cfssl-certinfo
```

  

# 搭建ETCD集群

  

下载地址：[https://github.com/etcd-io/etcd/releases/download/v3.3.18/etcd-v3.3.18-linux-amd64.tar.gz](https://github.com/etcd-io/etcd/releases/download/v3.3.18/etcd-v3.3.18-linux-amd64.tar.gz)

  

```
wget https://github.com/etcd-io/etcd/releases/download/v3.3.18/etcd-v3.3.18-linux-amd64.tar.gz
```

  

## 生成ETCD证书

  

证书生成的目录统一下/root/kubernetes/ssl/下

  

```
mkdir /root/kubernetes/ssl/etcd -p && cd /root/kubernetes/ssl/etcd
```

  

（1）、创建CA的请求文件（etcd-ca-csr.json）

  

```
cat > etcd-ca-csr.json <<EOF
{
    "CN": "etcd",
    "key": {
        "algo": "rsa",
        "size": 2048
    },
    "names": [
        {
            "C": "CN",
            "L": "Chongqing",
            "ST": "Chongqing"
        }
    ]
}
EOF
```

  

（2）、创建CA的配置文件（etcd-ca-config.json）

  

```
cat > etcd-ca-config.json <<EOF
{
  "signing": {
    "default": {
      "expiry": "87600h"
    },
    "profiles": {
      "www": {
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
EOF
```

  

（3）、创建CA证书

  

```
cfssl gencert -initca etcd-ca-csr.json | cfssljson -bare etcd-ca -
```

  

（4）、创建etcd证书请求文件（etcd-server-csr.json）：

  

```
cat > etcd-server-csr.json <<EOF
{
    "CN": "etcd",
    "hosts": [
        "10.1.10.128",
        "10.1.10.129",
        "10.1.10.130"
        ],
    "key": {
        "algo": "rsa",
        "size": 2048
    },
    "names": [
        {
            "C": "CN",
            "L": "Chongqing",
            "ST": "Chongqing"
        }
    ]
}
EOF
```

  

（5）、生成etcd证书并用 CA签名

  

```
cfssl gencert -ca=etcd-ca.pem -ca-key=etcd-ca-key.pem -config=etcd-ca-config.json -profile=www etcd-server-csr.json | cfssljson -bare etcd-server

# ls *.pem
ca-key.pem  ca.pem  etcd-key.pem  etcd.pem
# cp *.pem /opt/etcd/ssl/
```

  

## 安装ETCD

  

解压安装包：

  

```
tar xf etcd-v3.3.18-linux-amd64.tar.gz
cp etcd etcdctl /opt/etcd/bin/
```

  

创建配置文件（etcd.conf）

  

```
cat > /opt/etcd/config/etcd.conf <<EOF
#[Member]
ETCD_NAME="etcd-1"
ETCD_DATA_DIR="/var/lib/etcd/default.etcd"
ETCD_LISTEN_PEER_URLS="https://10.1.10.128:2380"
ETCD_LISTEN_CLIENT_URLS="https://10.1.10.128:2379"

#[Clustering]
ETCD_INITIAL_ADVERTISE_PEER_URLS="https://10.1.10.128:2380"
ETCD_ADVERTISE_CLIENT_URLS="https://10.1.10.128:2379"
ETCD_INITIAL_CLUSTER="etcd-1=https://10.1.10.128:2380,etcd-2=https://10.1.10.129:2380,etcd-3=https://10.1.10.130:2380"
ETCD_INITIAL_CLUSTER_TOKEN="etcd-cluster"
ETCD_INITIAL_CLUSTER_STATE="new"
EOF
```

  

> 注意：相应的地址按需更改
> 
> ETCD\_NAME：三台不能相同
> 
> ip地址不能相同

  

创建etcd的启动文件etcd.service

  

```
cat > /usr/lib/systemd/system/etcd.service <<EOF
[Unit]
Description=Etcd Server
After=network.target
After=network-online.target
Wants=network-online.target

[Service]
Type=notify
EnvironmentFile=/opt/etcd/config/etcd.conf
ExecStart=/opt/etcd/bin/etcd \\
        --name=\${ETCD_NAME} \\
        --data-dir=\${ETCD_DATA_DIR} \\
        --listen-peer-urls=\${ETCD_LISTEN_PEER_URLS} \\
        --listen-client-urls=\${ETCD_LISTEN_CLIENT_URLS},http://127.0.0.1:2379 \\
        --advertise-client-urls=\${ETCD_ADVERTISE_CLIENT_URLS} \\
        --initial-advertise-peer-urls=\${ETCD_INITIAL_ADVERTISE_PEER_URLS} \\
        --initial-cluster=\${ETCD_INITIAL_CLUSTER} \\
        --initial-cluster-token=\${ETCD_INITIAL_CLUSTER_TOKEN} \\
        --initial-cluster-state=new \\
        --cert-file=/opt/etcd/ssl/etcd-server.pem \\
        --key-file=/opt/etcd/ssl/etcd-server-key.pem \\
        --peer-cert-file=/opt/etcd/ssl/etcd-server.pem \\
        --peer-key-file=/opt/etcd/ssl/etcd-server-key.pem \\
        --trusted-ca-file=/opt/etcd/ssl/etcd-ca.pem \\
        --peer-trusted-ca-file=/opt/etcd/ssl/etcd-ca.pem
Restart=on-failure
LimitNOFILE=65536

[Install]
WantedBy=multi-user.target
EOF
```

  

另外两天部署一样，只有配置文件需要更改一下，将文件拷贝到另外两台：

  

```
scp -r /opt/etcd 10.1.10.129:/opt/
scp -r /opt/etcd 10.1.10.130:/opt/
scp /usr/lib/systemd/system/etcd.service 10.1.10.129:/usr/lib/systemd/system/
scp /usr/lib/systemd/system/etcd.service 10.1.10.130:/usr/lib/systemd/system/
```

  

然后分别修改配置文件：

  

10.1.10.129

  

```
#[Member]
ETCD_NAME="etcd-2"
ETCD_DATA_DIR="/var/lib/etcd/default.etcd"
ETCD_LISTEN_PEER_URLS="https://10.1.10.129:2380"
ETCD_LISTEN_CLIENT_URLS="https://10.1.10.129:2379"

#[Clustering]
ETCD_INITIAL_ADVERTISE_PEER_URLS="https://10.1.10.129:2380"
ETCD_ADVERTISE_CLIENT_URLS="https://10.1.10.129:2379"
ETCD_INITIAL_CLUSTER="etcd-1=https://10.1.10.128:2380,etcd-2=https://10.1.10.129:2380,etcd-3=https://10.1.10.130:2380"
ETCD_INITIAL_CLUSTER_TOKEN="etcd-cluster"
ETCD_INITIAL_CLUSTER_STATE="new"
```

  

10.1.10.130

  

```
#[Member]
ETCD_NAME="etcd-3"
ETCD_DATA_DIR="/var/lib/etcd/default.etcd"
ETCD_LISTEN_PEER_URLS="https://10.1.10.130:2380"
ETCD_LISTEN_CLIENT_URLS="https://10.1.10.130:2379"

#[Clustering]
ETCD_INITIAL_ADVERTISE_PEER_URLS="https://10.1.10.130:2380"
ETCD_ADVERTISE_CLIENT_URLS="https://10.1.10.130:2379"
ETCD_INITIAL_CLUSTER="etcd-1=https://10.1.10.128:2380,etcd-2=https://10.1.10.129:2380,etcd-3=https://10.1.10.130:2380"
ETCD_INITIAL_CLUSTER_TOKEN="etcd-cluster"
ETCD_INITIAL_CLUSTER_STATE="new"
```

  

然后启动三台的etcd服务

  

```
systemctl daemon-reload && systemctl start etcd && systemctl enable etcd
```

  

查看集群状态：

  

```
/opt/etcd/bin/etcdctl \
--ca-file=/opt/etcd/ssl/etcd-ca.pem --cert-file=/opt/etcd/ssl/etcd-server.pem --key-file=/opt/etcd/ssl/etcd-server-key.pem \
--endpoints="https://10.1.10.128:2379,https://10.1.10.129:2379,https://10.1.10.130:2379" \
cluster-health
member a2dba8836695bcf6 is healthy: got healthy result from https://10.1.10.129:2379
member d1272b0b3cb41282 is healthy: got healthy result from https://10.1.10.128:2379
member e4a3a9c93ef84f2d is healthy: got healthy result from https://10.1.10.130:2379
cluster is healthy
```

  

# 安装Flannel

  

> 我是在所有节点都部署了，你也可以只部署Node。

  

下载地址：[https://github.com/coreos/flannel/releases/download/v0.11.0/flannel-v0.11.0-linux-amd64.tar.gz](https://github.com/coreos/flannel/releases/download/v0.11.0/flannel-v0.11.0-linux-amd64.tar.gz)

  

Falnnel要用etcd存储自身一个子网信息，所以要保证能成功连接Etcd，写入预定义子网段：

  

```
/opt/etcd/bin/etcdctl --ca-file=/opt/etcd/ssl/ca.pem --cert-file=/opt/etcd/ssl/etcd.pem --key-file=/opt/etcd/ssl/etcd-key.pem --endpoints="https://10.1.10.128:2379,https://10.1.10.129:2379,https://10.1.10.130:2379" set /coreos.com/network/config  '{ "Network": "172.17.0.0/16", "Backend": {"Type": "vxlan"}}'
```

  

然后可以查看一下：

  

```
# /opt/etcd/bin/etcdctl --ca-file=/opt/etcd/ssl/ca.pem --cert-file=/opt/etcd/ssl/etcd.pem --key-file=/opt/etcd/ssl/etcd-key.pem --endpoints="https://10.1.10.128:2379,https://10.1.10.129:2379,https://10.1.10.130:2379" get /coreos.com/network/config
{ "Network": "172.17.0.0/16", "Backend": {"Type": "vxlan"}}
```

  

解压压缩包

  

```
tar xf flannel-v0.11.0-linux-amd64.tar.gz
```

  

将两个重要的二进制文件flanneld和mk-docker-opts.sh拷贝到/opt/kubernetes/bin下

  

```
cp flanneld mk-docker-opts.sh /opt/kubernetes/bin/
```

  

配置Flannel的配置文件：

  

```
cat > /opt/kubernetes/config/flanneld.conf <<EOF
FLANNEL_OPTIONS="\
--etcd-endpoints=https://10.1.10.128:2379,https://10.1.10.129:2379,https://10.1.10.130:2379 \
-etcd-cafile=/opt/etcd/ssl/ca.pem \
-etcd-certfile=/opt/etcd/ssl/etcd.pem \
-etcd-keyfile=/opt/etcd/ssl/etcd-key.pem"
EOF
```

  

配置系统systemd启动文件

  

```
cat > flanneld.service <<EOF
[Unit]
Description=Flanneld overlay address etcd agent
After=network-online.target network.target
Before=docker.service

[Service]
Type=notify
EnvironmentFile=/opt/kubernetes/config/flanneld.conf
ExecStart=/opt/kubernetes/bin/flanneld --ip-masq $FLANNEL_OPTIONS
ExecStartPost=/opt/kubernetes/bin/mk-docker-opts.sh -k DOCKER_NETWORK_OPTIONS -d /run/flannel/subnet.env
Restart=on-failure

[Install]
WantedBy=multi-user.target
EOF
```

  

配置Docker的系统文件，指定子网（/usr/lib/systemd/system/docker.service）

  

```
[Unit]
Description=Docker Application Container Engine
Documentation=https://docs.docker.com
BindsTo=containerd.service
After=network-online.target firewalld.service containerd.service
Wants=network-online.target
Requires=docker.socket
[Service]
Type=notify
EnvironmentFile=/run/flannel/subnet.env
ExecStart=/usr/bin/dockerd $DOCKER_NETWORK_OPTIONS
ExecReload=/bin/kill -s HUP $MAINPID
TimeoutSec=0
RestartSec=2
Restart=always
StartLimitBurst=3
StartLimitInterval=60s
LimitNOFILE=infinity
LimitNPROC=infinity
LimitCORE=infinity
TasksMax=infinity
Delegate=yes
KillMode=process
[Install]
WantedBy=multi-user.target
```

  

将配置文件拷贝到另外主机

  

```
cp /opt/kubernetes/flanneld.service /usr/lib/systemd/system/
scp -r /opt/kubernetes/ 10.1.10.129:/opt/
scp -r /opt/kubernetes/ 10.1.10.130:/opt/
scp /usr/lib/systemd/system/{docker,flanneld}.service 10.1.10.129:/usr/lib/systemd/system/
scp /usr/lib/systemd/system/{docker,flanneld}.service 10.1.10.130:/usr/lib/systemd/system/
```

  

启动flannel和重启docker

  

```
systemctl daemon-reload && systemctl enable flanneld && systemctl start flanneld
systemctl restart docker
```

  

检查docker是否使用了flannel网络：

  

```
# ps -ef | grep docker
root      10201      1  0 11:08 ?        00:00:00 /usr/bin/dockerd --bip=172.17.69.1/24 --ip-masq=false --mtu=1450
```

  

起一个容器测试网络连通性是否正确

  

```yaml
# docker run -it --name node02 --rm busybox /bin/sh
/ # ip a
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    inet 127.0.0.1/8 scope host lo
       valid_lft forever preferred_lft forever
7: eth0@if8: <BROADCAST,MULTICAST,UP,LOWER_UP,M-DOWN> mtu 1450 qdisc noqueue 
    link/ether 02:42:ac:11:50:02 brd ff:ff:ff:ff:ff:ff
    inet 172.17.80.2/24 brd 172.17.80.255 scope global eth0
       valid_lft forever preferred_lft forever
/ # ping 10.1.10.128 -c 1
PING 10.1.10.128 (10.1.10.128): 56 data bytes
64 bytes from 10.1.10.128: seq=0 ttl=63 time=0.802 ms

--- 10.1.10.128 ping statistics ---
1 packets transmitted, 1 packets received, 0% packet loss
round-trip min/avg/max = 0.802/0.802/0.802 ms
/ # ping 10.1.10.129 -c 1
PING 10.1.10.129 (10.1.10.129): 56 data bytes
64 bytes from 10.1.10.129: seq=0 ttl=63 time=0.515 ms

--- 10.1.10.129 ping statistics ---
1 packets transmitted, 1 packets received, 0% packet loss
round-trip min/avg/max = 0.515/0.515/0.515 ms
/ # ping 10.1.10.130 -c 1
PING 10.1.10.130 (10.1.10.130): 56 data bytes
64 bytes from 10.1.10.130: seq=0 ttl=64 time=0.075 ms

--- 10.1.10.130 ping statistics ---
1 packets transmitted, 1 packets received, 0% packet loss
round-trip min/avg/max = 0.075/0.075/0.075 ms
/ # ping 172.17.7.2 -c 1
PING 172.17.7.2 (172.17.7.2): 56 data bytes
64 bytes from 172.17.7.2: seq=0 ttl=62 time=0.884 ms

--- 172.17.7.2 ping statistics ---
1 packets transmitted, 1 packets received, 0% packet loss
round-trip min/avg/max = 0.884/0.884/0.884 ms
```

  

# 安装mater组件

  

下载地址： [https://dl.k8s.io/v1.16.4/kubernetes-server-linux-amd64.tar.gz](https://dl.k8s.io/v1.16.4/kubernetes-server-linux-amd64.tar.gz)

  

```
mkdir /root/kubernetes/ssl/kubernetes -p
```

  

（1）、解压安装压缩文件

  

```
tar xf kubernetes-server-linux-amd64.tar.gz
```

  

（2）、将我们需要的二进制文件拷贝到我们部署目录中

  

```
cp kubernetes/server/bin/{kube-apiserver,kubectlkube-scheduler,kube-controller-manager} /opt/kubernetes/bin/
scp kubernetes/server/bin/{kubelet,kube-proxy} 10.1.10.129:/opt/kubernetes/bin/
scp kubernetes/server/bin/{kubelet,kube-proxy} 10.1.10.130:/opt/kubernetes/bin/
```

  

（3）、将其加入环境变量

  

```
echo "PATH=/opt/kubernetes/bin/:$PATH" >> /etc/profile
source /etc/profile
```

  

（4）、将我们所需的证书和密钥拷贝到部署目录中

  

> 由于我们master也准备当Node使用，所以我们将所有证书都拷贝到部署证书目录

  

```
cp /root/kubernetes/ssl/kubernetes/*.pem /opt/kubernetes/ssl/
```

  

## 生成证书

  

### 创建CA证书

  

（1）、新建CA配置文件（ca-csr.json）

  

```
cat > /root/kubernetes/ssl/kubernetes/ca-csr.json <<EOF
{
    "CN": "kubernetes",
    "key": {
        "algo": "rsa",
        "size": 2048
    },
    "names": [
        {
            "C": "CN",
            "L": "Chongqing",
            "ST": "Chongqing",
      	    "O": "kubernetes",
            "OU": "System"
        }
    ]
}
EOF
```

  

```
CN CommonName,kube-apiserver从证书中提取该字段作为请求的用户名(User Name)，浏览器使用该字段验证网站是否合法
O Organization,kube-apiserver 从证书中提取该字段作为请求用户和所属组(Group)
kube-apiserver将提取的User、Group作为RBAC授权的用户和标识
```

  

（2）、新建CA配置文件（ca-config.json）

  

```
cat > /root/kubernetes/ssl/kubernetes/ca-config.json <<EOF
{
  "signing": {
    "default": {
      "expiry": "87600h"
    },
    "profiles": {
      "kubernetes": {
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
EOF
```

  

```
signing 表示该证书可用于签名其它证书，生成的ca.pem证书找中CA=TRUE
server auth 表示client可以用该证书对server提供的证书进行验证
client auth 表示server可以用该证书对client提供的证书进行验证
```

  

（3）、生成CA证书

  

```
# cfssl gencert -initca ca-csr.json | cfssljson -bare ca -
```

  

### 创建apiserver证书

  

（1）、新建apiserver证书文件

  

```
cat > /root/kubernetes/ssl/kubernetes/apiserver-csr.json <<EOF
{
    "CN": "kubernetes",
    "hosts": [
      "10.254.0.1",
      "127.0.0.1",
      "10.1.10.128",
      "10.1.10.129",
      "10.1.10.130",
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
            "L": "Chongqing",
            "ST": "Chongqing",
      	    "O": "kubernetes",
            "OU": "System"
        }
    ]
}
EOF
```

  

（2）、生成证书

  

```
cfssl gencert -ca=ca.pem -ca-key=ca-key.pem -config=ca-config.json -profile=kubernetes apiserver-csr.json | cfssljson -bare apiserver
```

  

### 创建 Kubernetes webhook 证书配置文件

  

（1）、创建证书文件

  

```
cat >  /root/kubernetes/ssl/kubernetes/aggregator-csr.json <<EOF
{
  "CN": "aggregator",
  "hosts": [""], 
  "key": {
    "algo": "rsa",
    "size": 2048
  },
  "names": [
        {
            "C": "CN",
            "L": "Chongqing",
            "ST": "Chongqing",
      	    "O": "kubernetes",
            "OU": "System"
        }
  ]
}
EOF
```

  

（2）、生成证书文件

  

```
cfssl gencert -ca=ca.pem -ca-key=ca-key.pem -config=ca-config.json -profile=kubernetes aggregator-csr.json | cfssljson -bare aggregator
```

  

### 创建 Kubernetes admin 证书配置文件

  

（1）、创建证书文件

  

```
cat >  /root/kubernetes/ssl/kubernetes/admin-csr.json <<EOF
{
  "CN": "admin",
  "hosts": [""], 
  "key": {
    "algo": "rsa",
    "size": 2048
  },
  "names": [
        {
            "C": "CN",
            "L": "Chongqing",
            "ST": "Chongqing",
      	    "O": "system:masters",
            "OU": "System"
        }
  ]
}
EOF
```

  

（2）、生成证书和私钥

  

```
cfssl gencert -ca=ca.pem -ca-key=ca-key.pem -config=ca-config.json -profile=kubernetes admin-csr.json | cfssljson -bare admin
```

  

### 创建kube-scheduler  证书配置文件

  

（1）、创建证书文件

  

```
cat >  /root/kubernetes/ssl/kubernetes/kube-scheduler-csr.json <<EOF
{
  "CN": "system:kube-scheduler",
  "hosts": [""], 
  "key": {
    "algo": "rsa",
    "size": 2048
  },
  "names": [
        {
            "C": "CN",
            "L": "Chongqing",
            "ST": "Chongqing",
      	    "O": "system:kube-scheduler",
            "OU": "System"
        }
  ]
}
EOF
```

  

（2）、生成证书文件和私钥

  

```
cfssl gencert -ca=ca.pem -ca-key=ca-key.pem -config=ca-config.json -profile=kubernetes kube-scheduler-csr.json | cfssljson -bare kube-scheduler
```

  

### 生成kube-controller-manager证书配置文件

  

（1）、创建证书文件

  

```
cat >  /root/kubernetes/ssl/kubernetes/kube-controller-manager-csr.json <<EOF
{
  "CN": "system:kube-controller-manager",
  "hosts": [""], 
  "key": {
    "algo": "rsa",
    "size": 2048
  },
  "names": [
        {
            "C": "CN",
            "L": "Chongqing",
            "ST": "Chongqing",
      	    "O": "system:kube-controller-manager",
            "OU": "System"
        }
  ]
}
EOF
```

  

（2）、生成证书和私钥

  

```
cfssl gencert -ca=ca.pem -ca-key=ca-key.pem -config=ca-config.json -profile=kubernetes kube-controller-manager-csr.json | cfssljson -bare kube-controller-manager
```

  

### 创建flannel 证书配置文件

  

（1）、创建证书文件

  

```
cat > /root/kubernetes/ssl/kubernetes/flannel-csr.json <<EOF
{
  "CN": "flannel",
  "hosts": [""], 
  "key": {
    "algo": "rsa",
    "size": 2048
  },
  "names": [
        {
            "C": "CN",
            "L": "Chongqing",
            "ST": "Chongqing",
      	    "O": "system:masters",
            "OU": "System"
        }
  ]
}
EOF
```

  

（2）、生成证书和私钥

  

```
cfssl gencert -ca=ca.pem -ca-key=ca-key.pem -config=ca-config.json -profile=kubernetes flannel-csr.json | cfssljson -bare flannel
```

  

### 创建kube-proxy证书

  

（1）、创建证书文件

  

```
cat > /root/kubernetes/ssl/kubernetes/kube-proxy-csr.json <<EOF
{
  "CN": "system:kube-proxy",
  "hosts": [],
  "key": {
    "algo": "rsa",
    "size": 2048
  },
  "names": [
    {
            "C": "CN",
            "L": "Chongqing",
            "ST": "Chongqing",
      	    "O": "system:masters",
            "OU": "System"
    }
  ]
}
EOF
```

  

（2）、生成证书文件

  

```
cfssl gencert -ca=ca.pem -ca-key=ca-key.pem -config=ca-config.json -profile=kubernetes kube-proxy-csr.json | cfssljson -bare kube-proxy
```

  

### 创建 kubernetes-dashboard证书配置文件

  

（1）、创建证书文件

  

```
cat > /root/kubernetes/ssl/kubernetes/dashboard-csr.json <<EOF
{
  "CN": "dashboard",
  "hosts": [""], 
  "key": {
    "algo": "rsa",
    "size": 2048
  },
  "names": [
        {
            "C": "CN",
            "L": "Chongqing",
            "ST": "Chongqing",
      	    "O": "kubernetes",
            "OU": "System"
        }
  ]
}
EOF
```

  

（2）、生成证书文件和私钥

  

```
cfssl gencert -ca=ca.pem -ca-key=ca-key.pem -config=ca-config.json -profile=kubernetes dashboard-csr.json | cfssljson -bare dashboard
```

  

### 创建metrics-server 证书配置文件

  

（1）、创建证书文件

  

```
cat > /root/kubernetes/ssl/kubernetes/metrics-server-csr.json <<EOF
{
  "CN": "metrics-server",
  "key": {
    "algo": "rsa",
    "size": 2048
  },
  "names": [
        {
            "C": "CN",
            "L": "Chongqing",
            "ST": "Chongqing",
      	    "O": "kubernetes",
            "OU": "System"
        }
  ]
}
EOF
```

  

（2）、生成证书和私钥

  

```
cfssl gencert -ca=ca.pem -ca-key=ca-key.pem -config=ca-config.json -profile=kubernetes metrics-server-csr.json | cfssljson -bare metrics-server
```

  

## 创建kubeconfig配置文件

  

> 在/root/kubernetes/kubeconfig目录下创建这些文件

  

（1）、设置kube-apiserver环境变量

  

```
export KUBE_APISERVER="https://10.1.10.128:6443"
```

  

### 创建admin kubeconfig

  

```
# 设置集群参数
kubectl config set-cluster kubernetes \
--certificate-authority=../ssl/kubernetes/ca.pem \
--embed-certs=true  \
--server=${KUBE_APISERVER} \
--kubeconfig=admin.kubeconfig
# 设置客户端认证参数
 kubectl config set-credentials admin \
 --client-certificate=../ssl/kubernetes/admin.pem \
 --client-key=../ssl/kubernetes/admin-key.pem \
 --embed-certs=true \
 --kubeconfig=admin.kubeconfig
 # 设置上下文参数
kubectl config set-context kubernetes \
--cluster=kubernetes \
--user=admin \
--namespace=kube-system \
--kubeconfig=admin.kubeconfig
# 设置默认上下文
kubectl config use-context kubernetes --kubeconfig=admin.kubeconfig
```

  

### 创建kube-scheduler kubeconfig

  

```
# 设置集群参数
kubectl config set-cluster kubernetes \
    --certificate-authority=../ssl/kubernetes/ca.pem \
    --embed-certs=true \
    --server=${KUBE_APISERVER} \
    --kubeconfig=kube-scheduler.kubeconfig
# 设置客户端认证参数
kubectl config set-credentials system:kube-scheduler \
    --client-certificate=../ssl/kubernetes/kube-scheduler.pem \
    --embed-certs=true \
    --client-key=../ssl/kubernetes/kube-scheduler-key.pem \
    --kubeconfig=kube-scheduler.kubeconfig
 # 设置上下文参数
kubectl config set-context kubernetes \
    --cluster=kubernetes \
    --user=system:kube-scheduler \
    --kubeconfig=kube-scheduler.kubeconfig
# 设置默认上下文
kubectl config use-context kubernetes --kubeconfig=kube-scheduler.kubeconfig
```

  

### 创建kube-controller-manager kubeconfig

  

```
# 设置集群参数
kubectl config set-cluster kubernetes \
   --certificate-authority=../ssl/kubernetes/ca.pem \
   --embed-certs=true \
   --server=${KUBE_APISERVER} \
   --kubeconfig=kube-controller-manager.kubeconfig
# 设置客户端认证参数
kubectl config set-credentials system:kube-controller-manager \
   --client-certificate=../ssl/kubernetes/kube-controller-manager.pem \
   --embed-certs=true \
   --client-key=../ssl/kubernetes/kube-controller-manager-key.pem \
   --kubeconfig=kube-controller-manager.kubeconfig
 # 设置上下文参数
kubectl config set-context kubernetes \
   --cluster=kubernetes \
   --user=system:kube-controller-manager \
   --kubeconfig=kube-controller-manager.kubeconfig
 # 设置默认上下文
kubectl config use-context kubernetes --kubeconfig=kube-controller-manager.kubeconfig
```

  

### 创建bootstrap  kubeconfig

  

```
# 生成TOKEN
export TOKEN_ID=$(head -c 6 /dev/urandom | md5sum | head -c 6)
export TOKEN_SECRET=$(head -c 16 /dev/urandom | md5sum | head -c 16)
export BOOTSTRAP_TOKEN=${TOKEN_ID}.${TOKEN_SECRET}
# 设置集群参数
kubectl config set-cluster kubernetes \
  --certificate-authority=../ssl/kubernetes/ca.pem \
  --embed-certs=true \
  --server=${KUBE_APISERVER} \
  --kubeconfig=bootstrap.kubeconfig
# 设置客户端认证参数
kubectl config set-credentials system:bootstrap:${TOKEN_ID} \
  --token=${BOOTSTRAP_TOKEN} \
  --kubeconfig=bootstrap.kubeconfig
# 设置上下文参数
kubectl config set-context default \
  --cluster=kubernetes \
  --user=system:bootstrap:${TOKEN_ID} \
  --kubeconfig=bootstrap.kubeconfig
# 设置默认上下文
kubectl config use-context default --kubeconfig=bootstrap.kubeconfig
```

  

> BOOTSTRAP\_TOKEN=0a22e7.4b91472175b8aaab

  

### 创建flannel kubeconfig

  

```
# 设置集群参数
kubectl config set-cluster kubernetes \
  --certificate-authority=../ssl/kubernetes/ca.pem \
  --embed-certs=true \
  --server=${KUBE_APISERVER} \
  --kubeconfig=kubeconfig.conf
# 设置客户端认证参数
    kubectl config set-credentials flannel \
  --client-certificate=../ssl/kubernetes/flannel.pem \
  --client-key=../ssl/kubernetes/flannel-key.pem \
  --embed-certs=true \
  --kubeconfig=kubeconfig.conf
# 设置上下文参数
    kubectl config set-context default \
  --cluster=kubernetes \
  --user=flannel \
  --kubeconfig=kubeconfig.conf
# 设置默认上下文
kubectl config use-context default --kubeconfig=kubeconfig.conf
```

  

### 创建kube-proxy kubeconfig

  

```
# 设置集群参数
kubectl config set-cluster kubernetes \
  --certificate-authority=../ssl/kubernetes/ca.pem \
  --embed-certs=true \
  --server=${KUBE_APISERVER} \
  --kubeconfig=kube-proxy.kubeconfig 
# 设置客户端认证参数
    kubectl config set-credentials system:kube-proxy \
  --client-certificate=../ssl/kubernetes/kube-proxy.pem \
  --client-key=../ssl/kubernetes/kube-proxy-key.pem \
  --embed-certs=true \
  --kubeconfig=kube-proxy.kubeconfig 
# 设置上下文参数
    kubectl config set-context default \
  --cluster=kubernetes \
  --user=system:kube-proxy \
  --kubeconfig=kube-proxy.kubeconfig 
# 设置默认上下文
kubectl config use-context default --kubeconfig=kube-proxy.kubeconfig
```

  

## 创建组件配置文件

  

### 创建kube-apiserver配置文件

  

（1）、创建主配置文件

  

```
cat > /opt/kubernetes/config/kube-apiserver.conf <<EOF
KUBE_APISERVER_OPTS="--logtostderr=false \\
        --bind-address=10.1.10.128 \\
        --advertise-address=10.1.10.128 \\
        --secure-port=6443 \\
        --insecure-port=0 \\
        --service-cluster-ip-range=10.254.0.0/16 \\
        --service-node-port-range=20000-40000 \\
        --etcd-cafile=/opt/etcd/ssl/etcd-ca.pem \\
        --etcd-certfile=/opt/etcd/ssl/etcd-server.pem \\
        --etcd-keyfile=/opt/etcd/ssl/etcd-server-key.pem \\
        --etcd-prefix=/registry \\
        --etcd-servers=https://10.1.10.128:2379,https://10.1.10.129:2379,https://10.1.10.130:2379 \\
        --client-ca-file=/opt/kubernetes/ssl/ca.pem \\
        --tls-cert-file=/opt/kubernetes/ssl/apiserver.pem\\
        --tls-private-key-file=/opt/kubernetes/ssl/apiserver-key.pem \\
        --kubelet-client-certificate=/opt/kubernetes/ssl/apiserver.pem \\
        --kubelet-client-key=/opt/kubernetes/ssl/apiserver-key.pem \\
        --service-account-key-file=/opt/kubernetes/ssl/ca.pem \\
        --requestheader-client-ca-file=/opt/kubernetes/ssl/ca.pem \\
        --proxy-client-cert-file=/opt/kubernetes/ssl/aggregator.pem \\
        --proxy-client-key-file=/opt/kubernetes/ssl/aggregator-key.pem \\
        --requestheader-allowed-names=aggregator \\
        --requestheader-group-headers=X-Remote-Group \\
        --requestheader-extra-headers-prefix=X-Remote-Extra- \\
        --requestheader-username-headers=X-Remote-User \\
        --enable-aggregator-routing=true \\
        --anonymous-auth=false \\
        --allow-privileged=true \\
        --experimental-encryption-provider-config=/opt/kubernetes/config/encryption-config.yaml \\
        --enable-admission-plugins=DefaultStorageClass,DefaultTolerationSeconds,LimitRanger,NamespaceExists,NamespaceLifecycle,NodeRestriction,OwnerReferencesPermissionEnforcement,PodNodeSelector,PersistentVolumeClaimResize,PodPreset,PodTolerationRestriction,ResourceQuota,ServiceAccount,StorageObjectInUseProtection MutatingAdmissionWebhook ValidatingAdmissionWebhook \\
        --disable-admission-plugins=DenyEscalatingExec,ExtendedResourceToleration,ImagePolicyWebhook,LimitPodHardAntiAffinityTopology,NamespaceAutoProvision,Priority,EventRateLimit,PodSecurityPolicy \\
        --cors-allowed-origins=.* \\
        --enable-swagger-ui \\
        --runtime-config=api/all=true \\
        --kubelet-preferred-address-types=InternalIP,ExternalIP,Hostname \\
        --authorization-mode=Node,RBAC \\
        --apiserver-count=1 \\
        --audit-log-maxage=30 \\
        --audit-log-maxbackup=3 \\
        --audit-log-maxsize=100 \\
        --kubelet-https \\
        --event-ttl=1h \\
        --feature-gates=RotateKubeletServerCertificate=true,RotateKubeletClientCertificate=true \\
        --enable-bootstrap-token-auth=true \\
        --audit-log-path=/var/log/kubernetes/api-server-audit.log \\
        --alsologtostderr=true \\
        --log-dir=/var/log/kubernetes \\
        --v=2 \\
        --endpoint-reconciler-type=lease \\
        --max-mutating-requests-inflight=100 \\
        --max-requests-inflight=500 \\
        --target-ram-mb=6000"
EOF
```

  

（2）、创建encryption-config.yaml

  

```
export ENCRYPTION_KEY=$(head -c 32 /dev/urandom | base64)
 cat > /opt/kubernetes/config/encryption-config.yaml <<EOF
kind: EncryptionConfig
apiVersion: v1
resources:
  - resources:
      - secrets
    providers:
      - aescbc:
          keys:
            - name: key1
              secret: ${ENCRYPTION_KEY}
      - identity: {}
EOF
```

  

### 创建kube-controller-manager配置文件

  

```
cat > /opt/kubernetes/config/kube-controller-manager.conf <<EOF
KUBE_CONTROLLER_MANAGER_OPTS="--logtostderr=false \\
 --leader-elect=true \\
 --address=0.0.0.0 \\
 --service-cluster-ip-range=10.254.0.0/16 \\
 --cluster-cidr=172.20.0.0/16 \\
 --node-cidr-mask-size=24 \\
 --cluster-name=kubernetes \\
 --allocate-node-cidrs=true \\
 --kubeconfig=/opt/kubernetes/config/kube-controller-manager.kubeconfig \\
 --authentication-kubeconfig=/opt/kubernetes/config/kube-controller-manager.kubeconfig \\
 --authorization-kubeconfig=/opt/kubernetes/config/kube-controller-manager.kubeconfig \\
 --use-service-account-credentials=true \\
 --client-ca-file=/opt/kubernetes/ssl/ca.pem \\
 --requestheader-client-ca-file=/opt/kubernetes/ssl/ca.pem \\
 --node-monitor-grace-period=40s \\
 --node-monitor-period=5s \\
 --pod-eviction-timeout=5m0s \\
 --terminated-pod-gc-threshold=50 \\
 --alsologtostderr=true \\
 --cluster-signing-cert-file=/opt/kubernetes/ssl/ca.pem \\
 --cluster-signing-key-file=/opt/kubernetes/ssl/ca-key.pem  \\
 --deployment-controller-sync-period=10s \\
 --experimental-cluster-signing-duration=86700h0m0s \\
 --enable-garbage-collector=true \\
 --root-ca-file=/opt/kubernetes/ssl/ca.pem \\
 --service-account-private-key-file=/opt/kubernetes/ssl/ca-key.pem \\
 --feature-gates=RotateKubeletServerCertificate=true,RotateKubeletClientCertificate=true \\
 --controllers=*,bootstrapsigner,tokencleaner \\
 --horizontal-pod-autoscaler-use-rest-clients=true \\
 --horizontal-pod-autoscaler-sync-period=10s \\
 --tls-cert-file=/opt/kubernetes/ssl/kube-controller-manager.pem \\
 --tls-private-key-file=/opt/kubernetes/ssl/kube-controller-manager-key.pem \\
 --kube-api-qps=100 \\
 --kube-api-burst=100 \\
 --log-dir=/var/log/kubernetes \\
 --v=2"
EOF
```

  

### 创建kube-scheduler配置文件

  

```
cat > /opt/kubernetes/config/kube-scheduler.conf <<EOF
KUBE_SCHEDULER_OPTS=" \\
    --logtostderr=false \\
    --address=0.0.0.0 \\
    --leader-elect=true \\
    --kubeconfig=/opt/kubernetes/config/kube-scheduler.kubeconfig \\
    --authentication-kubeconfig=/opt/kubernetes/config/kube-scheduler.kubeconfig \\
    --authorization-kubeconfig=/opt/kubernetes/config/kube-scheduler.kubeconfig \\
    --alsologtostderr=true \\
    --kube-api-qps=100 \\
    --kube-api-burst=100 \\
    --log-dir=/var/log/kubernetes \\
    --v=2"
EOF
```

  

### 创建kubelet配置文件

  

> 在node节点上创建

  

```
cat > /opt/kubernetes/config/kubelet.conf <<EOF
KUBELET_OPTS="--logtostderr=true \\
--v=4 \\
--network-plugin=cni \\
--cni-conf-dir=/etc/cni/net.d --cni-bin-dir=/opt/cni/bin \\
--hostname-override=10.1.10.129 \\
--kubeconfig=/opt/kubernetes/config/kubelet.kubeconfig \\
--bootstrap-kubeconfig=/opt/kubernetes/config/bootstrap.kubeconfig \\
--config=/opt/kubernetes/config/kubelet.yaml \\
--cert-dir=/opt/kubernetes/ssl \\
--pod-infra-container-image=registry.cn-hangzhou.aliyuncs.com/rookieops/pause-amd64:3.0"
EOF
```

  

> address: 节点IP，不同节点需要更改
> 
> node-ip：节点IP，不同节点需要更改
> 
> hostname-override：节点hostname，也可以配置节点IP，不同节点需要更改
> 
> healthz-bind-address：节点IP，不同节点需要更改
> 
> \--hostname-override 在集群中显示的主机名，其他节点需要更改
> 
> \--kubeconfig 指定kubeconfig文件位置，会自动生成
> 
> \--bootstrap-kubeconfig 指定刚才生成的bootstrap.kubeconfig文件
> 
> \--cert-dir 颁发证书存放位置
> 
> \--pod-infra-container-image 管理Pod网络的镜像

  

创建kubelet.yaml配置文件

  

```
cat > /opt/kubernetes/config/kubelet.yaml <<EOF
kind: KubeletConfiguration
apiVersion: kubelet.config.k8s.io/v1beta1
address: 10.1.10.129
port: 10250
readOnlyPort: 10255
cgroupDriver: cgroupfs
clusterDNS: ["10.254.0.2"]
clusterDomain: cluster.local.
failSwapOn: false
authentication:
  anonymous:
    enabled: false
  webhook:
    cacheTTL: 2m0s
    enabled: true
  x509:
    clientCAFile: /opt/kubernetes/ssl/ca.pem
authorization:
  mode: Webhook
  webhook:
    cacheAuthorizedTTL: 5m0s
    cacheUnauthorizedTTL: 30s
evictionHard:
  imagefs.available: 15%
  memory.available: 100Mi
  nodefs.available: 10%
  nodefs.inodesFree: 5%
maxOpenFiles: 1000000
maxPods: 110 
EOF
```

  

> 不同节点需要修改的地方为IP

  

### 创建kube-proxy配置文件

  

```
cat > /opt/kubernetes/config/kube-proxy.conf <<EOF
KUBE_PROXY_OPTS="--logtostderr=false \\
--v=2 \\
--feature-gates=SupportIPVSProxyMode=true \\
--masquerade-all=true \\
--proxy-mode=ipvs \\
--ipvs-min-sync-period=5s \\
--ipvs-sync-period=5s \\
--ipvs-scheduler=rr \\
--cluster-cidr=172.20.0.0/16 \\
--log-dir=/var/log/kubernetes \\
--kubeconfig=/opt/kubernetes/config/kube-proxy.kubeconfig"
EOF
```

  

## 创建组件systemd启动文件

  

### 创建kube-apiserver启动文件

  

```
cat > /usr/lib/systemd/system/kube-apiserver.service <<EOF
[Unit]
Description=Kubernetes API Server
Documentation=https://github.com/kubernetes/kubernetes

[Service]
EnvironmentFile=-/opt/kubernetes/config/kube-apiserver.conf
ExecStart=/opt/kubernetes/bin/kube-apiserver \$KUBE_APISERVER_OPTS
Restart=on-failure
RestartSec=10
Type=notify
LimitNOFILE=65536

[Install]
WantedBy=multi-user.target
EOF
```

  

### 创建kube-controller-manager启动文件

  

```
cat > /usr/lib/systemd/system/kube-controller-manager.service <<EOF
[Unit]
Description=Kubernetes Controller Manager
Documentation=https://github.com/kubernetes/kubernetes

[Service]
EnvironmentFile=-/opt/kubernetes/config/kube-controller-manager.conf
ExecStart=/opt/kubernetes/bin/kube-controller-manager \$KUBE_CONTROLLER_MANAGER_OPTS
Restart=on-failure

[Install]
WantedBy=multi-user.target
EOF
```

  

### 创建kube-scheduler启动文件

  

```
cat > /usr/lib/systemd/system/kube-scheduler.service <<EOF
[Unit]
Description=Kubernetes Scheduler
Documentation=https://github.com/kubernetes/kubernetes

[Service]
EnvironmentFile=-/opt/kubernetes/config/kube-scheduler.conf
ExecStart=/opt/kubernetes/bin/kube-scheduler \$KUBE_SCHEDULER_OPTS
Restart=on-failure

[Install]
WantedBy=multi-user.target
EOF
```

  

### 创建kubelet启动文件

  

> 在需要部署的Node上创建

  

```
cat > /usr/lib/systemd/system/kubelet.service <<EOF
[Unit]
Description=Kubernetes Kubelet
After=docker.service
Requires=docker.service

[Service]
EnvironmentFile=/opt/kubernetes/config/kubelet.conf
ExecStart=/opt/kubernetes/bin/kubelet \$KUBELET_OPTS
Restart=on-failure
KillMode=process

[Install]
WantedBy=multi-user.target
EOF
```

  

### 创建kube-proxy启动文件

  

> 在需要部署的Node上创建

  

```
cat > /usr/lib/systemd/system/kube-proxy.service <<EOF
[Unit]
Description=Kubernetes Proxy
After=network.target

[Service]
EnvironmentFile=-/opt/kubernetes/config/kube-proxy.conf
ExecStart=/opt/kubernetes/bin/kube-proxy \$KUBE_PROXY_OPTS
Restart=on-failure

[Install]
WantedBy=multi-user.target
EOF
```

  

## 启动组件

  

### master组件

  

> 由于我们master也准备当Node使用，所以我们将所有证书都拷贝到部署证书目录

  

```
cp /root/kubernetes/ssl/kubernetes/*.pem /opt/kubernetes/ssl/
```

  

（1）、将我们创建的kubeconfig配置文件也拷贝到部署目录

  

```
cp /root/kubernetes/kubeconfig/* /opt/kubernetes/config/
```

  

（2）、创建日志目录，并启动kube-apiserver

  

```
mkdir /var/log/kubernetes
systemctl daemon-reload && systemctl enable kube-apiserver && systemctl start kube-apiserver
```

  

（3）、复制kubeconfig文件到~/.kube/

  

```
mv ~/.kube/config{,.old}
 cp /opt/kubernetes/config/admin.kubeconfig ~/.kube/config
```

  

（4）、查看状态

  

```
systemctl status kube-apiserver
# kubectl cluster-info
Kubernetes master is running at https://10.1.10.128:6443
```

  

（5）、启动kube-controller-manager

  

```
systemctl daemon-reload && systemctl enable kube-controller-manager && systemctl start kube-controller-manager
```

  

（6）、启动kube-scheduler

  

```
systemctl daemon-reload && systemctl enable kube-scheduler && systemctl start kube-scheduler
```

  

（7）、查看集群状态

  

```
# kubectl get cs -o=go-template='{{printf "|NAME|STATUS|MESSAGE|\n"}}{{range .items}}{{$name := .metadata.name}}{{range .conditions}}{{printf "|%s|%s|%s|\n" $name .status .message}}{{end}}{{end}}'
|NAME|STATUS|MESSAGE|
|scheduler|True|ok|
|controller-manager|True|ok|
|etcd-2|True|{"health":"true"}|
|etcd-0|True|{"health":"true"}|
|etcd-1|True|{"health":"true"}|
# kubectl get all --all-namespaces
NAMESPACE   NAME                 TYPE        CLUSTER-IP   EXTERNAL-IP   PORT(S)   AGE
default     service/kubernetes   ClusterIP   10.254.0.1   <none>        443/TCP   8m26s
```

  

（8）、授权访问kube-apiserver

  

```
授予 kubernetes API 的权限
kubectl create clusterrolebinding controller-node-clusterrolebing --clusterrole=system:kube-controller-manager  --user=system:kube-controller-manager
kubectl create clusterrolebinding scheduler-node-clusterrolebing  --clusterrole=system:kube-scheduler --user=system:kube-scheduler
kubectl create clusterrolebinding controller-manager:system:auth-delegator --user system:kube-controller-manager --clusterrole system:auth-delegator
授予 kubernetes 证书访问 kubelet API 的权限
kubectl create clusterrolebinding --user system:serviceaccount:kube-system:default kube-system-cluster-admin --clusterrole cluster-admin
kubectl create clusterrolebinding kubelet-node-clusterbinding --clusterrole=system:node --group=system:nodes
kubectl create clusterrolebinding kube-apiserver:kubelet-apis --clusterrole=system:kubelet-api-admin --user kubernetes
```

  

（9）、配置kubectl自动补全

  

```
yum install -y bash-completion
source /usr/share/bash-completion/bash_completion
source <(kubectl completion bash)
echo "source <(kubectl completion bash)" >> ~/.bashrc
```

  

> 如果要更改默认得namespace，可以使用如下命令

```
kubectl config set-context --current --namespace={{namespace}}
```

  

### node组件

  

> 在master上部署bootstrap secret，脚本可以放置任意位置，我习惯放于/root/manifests下。另外TOKEN\_ID和TOKEN\_SECRET是我们在创建bootstrap kubeconfig生成的，在做那一步的时候以防万一应该记录下来。

```
cat << EOF | tee bootstrap.secret.yaml
apiVersion: v1
kind: Secret
metadata:
  # Name MUST be of form "bootstrap-token-<token id>"
  name: bootstrap-token-${TOKEN_ID}
  namespace: kube-system

# Type MUST be 'bootstrap.kubernetes.io/token'
type: bootstrap.kubernetes.io/token
stringData:
  # Human readable description. Optional.
  description: "The default bootstrap token generated by 'kubelet '."

  # Token ID and secret. Required.
  token-id: ${TOKEN_ID}
  token-secret: ${TOKEN_SECRET}

  # Allowed usages.
  usage-bootstrap-authentication: "true"
  usage-bootstrap-signing: "true"

  # Extra groups to authenticate the token as. Must start with "system:bootstrappers:"
  auth-extra-groups: system:bootstrappers:worker,system:bootstrappers:ingress
---
# A ClusterRole which instructs the CSR approver to approve a node requesting a
# serving cert matching its client cert.
kind: ClusterRole
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  name: system:certificates.k8s.io:certificatesigningrequests:selfnodeserver
rules:
- apiGroups: ["certificates.k8s.io"]
  resources: ["certificatesigningrequests/selfnodeserver"]
  verbs: ["create"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  annotations:
    rbac.authorization.kubernetes.io/autoupdate: "true"
  labels:
    kubernetes.io/bootstrapping: rbac-defaults
  name: system:kubernetes-to-kubelet
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
  name: system:kubernetes
  namespace: ""
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: system:kubernetes-to-kubelet
subjects:
  - apiGroup: rbac.authorization.k8s.io
    kind: User
    name: kubernetes
EOF
```

> 然后创建资源

```
#  创建资源
kubectl create -f bootstrap.secret.yaml
### 查看创建的token
kubeadm token list
# 允许 system:bootstrappers 组用户创建 CSR 请求
kubectl create clusterrolebinding kubelet-bootstrap --clusterrole=system:node-bootstrapper --group=system:bootstrappers
# 自动批准 system:bootstrappers 组用户 TLS bootstrapping 首次申请证书的 CSR 请求
kubectl create clusterrolebinding node-client-auto-approve-csr --clusterrole=system:certificates.k8s.io:certificatesigningrequests:nodeclient --group=system:bootstrappers
# 自动批准 system:nodes 组用户更新 kubelet 自身与 apiserver 通讯证书的 CSR 请求
kubectl create clusterrolebinding node-client-auto-renew-crt --clusterrole=system:certificates.k8s.io:certificatesigningrequests:selfnodeclient --group=system:nodes

# 自动批准 system:nodes 组用户更新 kubelet 10250 api 端口证书的 CSR 请求
kubectl create clusterrolebinding node-server-auto-renew-crt --clusterrole=system:certificates.k8s.io:certificatesigningrequests:selfnodeserver --group=system:nodes
```

  

（1）、在Node节点创建我们需要的目录

  

```
mkdir /opt/kubernetes/{bin,config,ssl} -p
```

  

（2）、将node节点需要的二进制文件拷贝过去

  

```
cd /root/kubernetes/install/kubernetes/server/bin
scp kubelet kube-proxy 10.1.10.129:/opt/kubernetes/bin/
scp kubelet kube-proxy 10.1.10.130:/opt/kubernetes/bin/
```

  

（3）、将kubeconfig文件拷贝到Node节点上

  

```
cd /root/kubernetes/kubeconfig
scp * 10.1.10.129:/opt/kubernetes/config/
scp * 10.1.10.130:/opt/kubernetes/config/
```

  

（4）、将证书拷贝到Node节点上

  

> 只拷贝需要的，我这里仅仅是为了方便~~

  

```
cd /root/kubernetes/ssl/kubernetes
scp *.pem 10.1.10.129:/opt/kubernetes/ssl/
scp *.pem 10.1.10.130:/opt/kubernetes/ssl/
```

  

（5）、启动kubelet

  

```
systemctl daemon-reload && systemctl enable kubelet && systemctl start kubelet
```

  

（6）、启动kube-proxy

  

```
systemctl daemon-reload && systemctl enable kube-proxy && systemctl start kube-proxy
```

  

（7）、在master上查看

  

```
kubectl get node
NAME         STATUS     ROLES    AGE     VERSION
node01-k8s   NotReady   <none>   72m     v1.16.4
node02-k8s   NotReady   <none>   5m12s   v1.16.4
```

  

> 之所以是NotReady，是因为我们还没有部署网络

  

# 安装组件

  

## 部署Flannel

  

kubernetes提供一个CNI接口，它可以和任何支持CNI的网络插件对接，所以我们这里不直接部署Flannel，改成部署cni，然后将flannel部署在集群中。

  

> 使用CNI插件时，需要做三个配置：
> 
> -   kubelet启动参数中networkPlugin设置为cni
> -   在/etc/cni/net.d中增加cni的配置文件，配置文件中可以指定需要使用的cni组件及参数
> -   将需要用到的cni组件（二进制可执行文件）放到/opt/cni/bin目录下

  

（1）、确保配置中开启了cni，如下

  

```
KUBELET_OPTS="--logtostderr=true \
--v=4 \
--network-plugin=cni \
--cni-conf-dir=/etc/cni/net.d --cni-bin-dir=/opt/cni/bin \
--hostname-override=10.1.10.128 \
--kubeconfig=/opt/kubernetes/config/kubelet.kubeconfig \
--bootstrap-kubeconfig=/opt/kubernetes/config/bootstrap.kubeconfig \
--config=/opt/kubernetes/config/kubelet.config \
--cert-dir=/opt/kubernetes/ssl \
--pod-infra-container-image=registry.cn-hangzhou.aliyuncs.com/rookieops/pause-amd64:3.0"
```

  

（2）、下载cni文件

  

下载地址：[https://github.com/containernetworking/plugins/releases/download/v0.8.3/cni-plugins-linux-amd64-v0.8.3.tgz](https://github.com/containernetworking/plugins/releases/download/v0.8.3/cni-plugins-linux-amd64-v0.8.3.tgz)

  

（3）、创建需要的目录

  

```
mkdir /opt/cni/bin /etc/cni/net.d -p
```

  

（4）、解压压缩包到安装目录/opt/cni/bin

  

```
tar xf cni-plugins-linux-amd64-v0.8.3.tgz -C /opt/cni/bin/
```

  

（5）、将其拷贝到另外的节点

  

```
scp -r /opt/cni/bin/*  10.1.10.129:/opt/cni/bin/
scp -r /opt/cni/bin/*  10.1.10.130:/opt/cni/bin/
```

  

（6）、配置kube-flannel YAML清单文件（kube-flannel.yaml）

  

> 下载地址：[https://raw.githubusercontent.com/coreos/flannel/2140ac876ef134e0ed5af15c65e414cf26827915/Documentation/kube-flannel.yml](https://raw.githubusercontent.com/coreos/flannel/2140ac876ef134e0ed5af15c65e414cf26827915/Documentation/kube-flannel.yml)

  

```
---
apiVersion: policy/v1beta1
kind: PodSecurityPolicy
metadata:
  name: psp.flannel.unprivileged
  annotations:
    seccomp.security.alpha.kubernetes.io/allowedProfileNames: docker/default
    seccomp.security.alpha.kubernetes.io/defaultProfileName: docker/default
    apparmor.security.beta.kubernetes.io/allowedProfileNames: runtime/default
    apparmor.security.beta.kubernetes.io/defaultProfileName: runtime/default
spec:
  privileged: false
  volumes:
    - configMap
    - secret
    - emptyDir
    - hostPath
  allowedHostPaths:
    - pathPrefix: "/etc/cni/net.d"
    - pathPrefix: "/etc/kube-flannel"
    - pathPrefix: "/run/flannel"
  readOnlyRootFilesystem: false
  # Users and groups
  runAsUser:
    rule: RunAsAny
  supplementalGroups:
    rule: RunAsAny
  fsGroup:
    rule: RunAsAny
  # Privilege Escalation
  allowPrivilegeEscalation: false
  defaultAllowPrivilegeEscalation: false
  # Capabilities
  allowedCapabilities: ['NET_ADMIN']
  defaultAddCapabilities: []
  requiredDropCapabilities: []
  # Host namespaces
  hostPID: false
  hostIPC: false
  hostNetwork: true
  hostPorts:
  - min: 0
    max: 65535
  # SELinux
  seLinux:
    # SELinux is unsed in CaaSP
    rule: 'RunAsAny'
---
kind: ClusterRole
apiVersion: rbac.authorization.k8s.io/v1beta1
metadata:
  name: flannel
rules:
  - apiGroups: ['extensions']
    resources: ['podsecuritypolicies']
    verbs: ['use']
    resourceNames: ['psp.flannel.unprivileged']
  - apiGroups:
      - ""
    resources:
      - pods
    verbs:
      - get
  - apiGroups:
      - ""
    resources:
      - nodes
    verbs:
      - list
      - watch
  - apiGroups:
      - ""
    resources:
      - nodes/status
    verbs:
      - patch
---
kind: ClusterRoleBinding
apiVersion: rbac.authorization.k8s.io/v1beta1
metadata:
  name: flannel
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: flannel
subjects:
- kind: ServiceAccount
  name: flannel
  namespace: kube-system
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: flannel
  namespace: kube-system
---
kind: ConfigMap
apiVersion: v1
metadata:
  name: kube-flannel-cfg
  namespace: kube-system
  labels:
    tier: node
    app: flannel
data:
  cni-conf.json: |
    {
      "cniVersion": "0.2.0",
      "name": "cbr0",
      "plugins": [
        {
          "type": "flannel",
          "delegate": {
            "hairpinMode": true,
            "isDefaultGateway": true
          }
        },
        {
          "type": "portmap",
          "capabilities": {
            "portMappings": true
          }
        }
      ]
    }
  net-conf.json: |
    {
      "Network": "172.20.0.0/16",
      "Backend": {
        "Type": "vxlan"
      }
    }
---
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: kube-flannel-ds-amd64
  namespace: kube-system
  labels:
    tier: node
    app: flannel
spec:
  selector:
    matchLabels:
      app: flannel
  template:
    metadata:
      labels:
        tier: node
        app: flannel
    spec:
      affinity:
        nodeAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
            nodeSelectorTerms:
              - matchExpressions:
                  - key: beta.kubernetes.io/os
                    operator: In
                    values:
                      - linux
                  - key: beta.kubernetes.io/arch
                    operator: In
                    values:
                      - amd64
      hostNetwork: true
      tolerations:
      - operator: Exists
        effect: NoSchedule
      serviceAccountName: flannel
      initContainers:
      - name: install-cni
        image: registry.cn-hangzhou.aliyuncs.com/rookieops/flannel:v0.11.0-amd64 
        command:
        - cp
        args:
        - -f
        - /etc/kube-flannel/cni-conf.json
        - /etc/cni/net.d/10-flannel.conflist
        volumeMounts:
        - name: cni
          mountPath: /etc/cni/net.d
        - name: flannel-cfg
          mountPath: /etc/kube-flannel/
      containers:
      - name: kube-flannel
        image: registry.cn-hangzhou.aliyuncs.com/rookieops/flannel:v0.11.0-amd64 
        command:
        - /opt/bin/flanneld
        args:
        - --ip-masq
        - --kube-subnet-mgr
        resources:
          requests:
            cpu: "100m"
            memory: "50Mi"
          limits:
            cpu: "100m"
            memory: "50Mi"
        securityContext:
          privileged: false
          capabilities:
             add: ["NET_ADMIN"]
        env:
        - name: POD_NAME
          valueFrom:
            fieldRef:
              fieldPath: metadata.name
        - name: POD_NAMESPACE
          valueFrom:
            fieldRef:
              fieldPath: metadata.namespace
        volumeMounts:
        - name: run
          mountPath: /run/flannel
        - name: flannel-cfg
          mountPath: /etc/kube-flannel/
      volumes:
        - name: run
          hostPath:
            path: /run/flannel
        - name: cni
          hostPath:
            path: /etc/cni/net.d
        - name: flannel-cfg
          configMap:
            name: kube-flannel-cfg
```

  

（7）、生成资源清单

  

```
kubectl apply -f  kube-flannel.yaml
```

  

（8）、查看集群状态

  

```
# kubectl get pod -n kube-system
NAME                          READY   STATUS    RESTARTS   AGE
kube-flannel-ds-amd64-2qkcb   1/1     Running   0          85s
kube-flannel-ds-amd64-7nzj5   1/1     Running   0          85s
# kubectl get node
NAME         STATUS   ROLES    AGE    VERSION
node01-k8s   Ready    <none>   104m   v1.16.4
node02-k8s   Ready    <none>   37m    v1.16.4
```

  

> 可以看到集群状态已经变为ready

  

（9）、用一个demo文件测试一下

  

```
apiVersion: v1
kind: Pod
metadata:
  name: pod-demo
spec:
  containers:
  - name: test-ng
    image: nginx
```

  

查看是否能成功分配IP

  

```
# kubectl get pod -o wide
NAME                          READY   STATUS    RESTARTS   AGE     IP            NODE         NOMINATED NODE   READINESS GATES
kube-flannel-ds-amd64-2qkcb   1/1     Running   0          5m36s   10.1.10.129   node01-k8s   <none>           <none>
kube-flannel-ds-amd64-7nzj5   1/1     Running   0          5m36s   10.1.10.130   node02-k8s   <none>           <none>
pod-demo                      1/1     Running   0          55s     172.20.1.2    node02-k8s   <none>           <none>
```

  

> 测试正常

  

## 部署core dns

  

YAML清单如下

  

```
apiVersion: v1
kind: ServiceAccount
metadata:
  name: coredns
  namespace: kube-system
  labels:
      kubernetes.io/cluster-service: "true"
      addonmanager.kubernetes.io/mode: Reconcile
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  labels:
    kubernetes.io/bootstrapping: rbac-defaults
    addonmanager.kubernetes.io/mode: Reconcile
  name: system:coredns
rules:
- apiGroups:
  - ""
  resources:
  - endpoints
  - services
  - pods
  - namespaces
  verbs:
  - list
  - watch
- apiGroups:
  - ""
  resources:
  - nodes
  verbs:
  - get
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  annotations:
    rbac.authorization.kubernetes.io/autoupdate: "true"
  labels:
    kubernetes.io/bootstrapping: rbac-defaults
    addonmanager.kubernetes.io/mode: EnsureExists
  name: system:coredns
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: system:coredns
subjects:
- kind: ServiceAccount
  name: coredns
  namespace: kube-system
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: coredns
  namespace: kube-system
  labels:
      addonmanager.kubernetes.io/mode: EnsureExists
data:
  Corefile: |
    .:53 {
        errors
        health
        kubernetes cluster.local in-addr.arpa ip6.arpa {
            pods insecure
            upstream /etc/resolv.conf
            fallthrough in-addr.arpa ip6.arpa
        }
        prometheus :9153
        forward . /etc/resolv.conf
        cache 30
        reload
        loadbalance
    }
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: coredns
  namespace: kube-system
  labels:
    k8s-app: kube-dns
    kubernetes.io/cluster-service: "true"
    addonmanager.kubernetes.io/mode: Reconcile
    kubernetes.io/name: "CoreDNS"
spec:
  # replicas: not specified here:
  # 1. In order to make Addon Manager do not reconcile this replicas parameter.
  # 2. Default is 1.
  # 3. Will be tuned in real time if DNS horizontal auto-scaling is turned on.
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 1
  selector:
    matchLabels:
      k8s-app: kube-dns
  template:
    metadata:
      labels:
        k8s-app: kube-dns
      annotations:
        seccomp.security.alpha.kubernetes.io/pod: 'docker/default'
    spec:
      priorityClassName: system-cluster-critical
      serviceAccountName: coredns
      tolerations:
        - key: "CriticalAddonsOnly"
          operator: "Exists"
      nodeSelector:
        beta.kubernetes.io/os: linux
      containers:
      - name: coredns
        image: coredns/coredns
        imagePullPolicy: Always
        resources:
          limits:
            memory: 170Mi
          requests:
            cpu: 100m
            memory: 70Mi
        args: [ "-conf", "/etc/coredns/Corefile" ]
        volumeMounts:
        - name: config-volume
          mountPath: /etc/coredns
          readOnly: true
        ports:
        - containerPort: 53
          name: dns
          protocol: UDP
        - containerPort: 53
          name: dns-tcp
          protocol: TCP
        - containerPort: 9153
          name: metrics
          protocol: TCP
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
            scheme: HTTP
          initialDelaySeconds: 60
          timeoutSeconds: 5
          successThreshold: 1
          failureThreshold: 5
        readinessProbe:
          httpGet:
            path: /health
            port: 8080
            scheme: HTTP
        securityContext:
          allowPrivilegeEscalation: false
          capabilities:
            add:
            - NET_BIND_SERVICE
            drop:
            - all
          readOnlyRootFilesystem: true
      dnsPolicy: Default
      volumes:
        - name: config-volume
          configMap:
            name: coredns
            items:
            - key: Corefile
              path: Corefile
---
apiVersion: v1
kind: Service
metadata:
  name: kube-dns
  namespace: kube-system
  annotations:
    prometheus.io/port: "9153"
    prometheus.io/scrape: "true"
  labels:
    k8s-app: kube-dns
    kubernetes.io/cluster-service: "true"
    addonmanager.kubernetes.io/mode: Reconcile
    kubernetes.io/name: "CoreDNS"
spec:
  selector:
    k8s-app: kube-dns
  clusterIP: 10.254.0.2
  ports:
  - name: dns
    port: 53
    protocol: UDP
  - name: dns-tcp
    port: 53
    protocol: TCP
  - name: metrics
    port: 9153
    protocol: TCP
```

  

测试：

  

```
# 安装测试攻击
yum install bind-utils-y
# 测试百度，要在Node节点测试，因为我们master没有安装网络
# dig @10.254.0.2 www.baidu.com

; <<>> DiG 9.11.4-P2-RedHat-9.11.4-9.P2.el7 <<>> @10.254.0.2 www.baidu.com
; (1 server found)
;; global options: +cmd
;; Got answer:
;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 24278
;; flags: qr rd ra; QUERY: 1, ANSWER: 3, AUTHORITY: 0, ADDITIONAL: 1

;; OPT PSEUDOSECTION:
; EDNS: version: 0, flags:; udp: 4096
;; QUESTION SECTION:
;www.baidu.com.			IN	A

;; ANSWER SECTION:
www.baidu.com.		30	IN	CNAME	www.a.shifen.com.
www.a.shifen.com.	30	IN	A	112.80.248.75
www.a.shifen.com.	30	IN	A	112.80.248.76

;; Query time: 54 msec
;; SERVER: 10.254.0.2#53(10.254.0.2)
;; WHEN: Sat Dec 28 23:40:43 CST 2019
;; MSG SIZE  rcvd: 149
```

  

> 返回解析正常

  

## 部署Traefik Ingress

  

（1）、创建RBAC认证配置清单（traefik-rbac.yaml）

  

```
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: traefik-ingress-controller
  namespace: kube-system 
---
kind: ClusterRole
apiVersion: rbac.authorization.k8s.io/v1beta1
metadata:
  name: traefik-ingress-controller
rules:
  - apiGroups:
      - ""
    resources:
      - services
      - endpoints
      - secrets
    verbs:
      - get
      - list
      - watch
  - apiGroups:
      - extensions
    resources:
      - ingresses
    verbs:
      - get
      - list
      - watch
---
kind: ClusterRoleBinding
apiVersion: rbac.authorization.k8s.io/v1beta1
metadata:
  name: traefik-ingress-controller
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: traefik-ingress-controller
subjects:
- kind: ServiceAccount
  name: traefik-ingress-controller
  namespace: kube-system
```

  

（2）、创建traefik配置清单（traefik.yaml）

  

```
---
kind: Deployment
apiVersion: apps/v1
metadata:
  name: traefik-ingress-controller
  namespace: kube-system 
  labels:
    k8s-app: traefik-ingress-lb
spec:
  replicas: 1
  selector:
    matchLabels:
      k8s-app: traefik-ingress-lb
  template:
    metadata:
      labels:
        k8s-app: traefik-ingress-lb
        name: traefik-ingress-lb
    spec:
      serviceAccountName: traefik-ingress-controller
      terminationGracePeriodSeconds: 60
#      tolerations:
#      - operator: "Exists"
#      nodeSelector:
#        kubernetes.io/hostname: master
      containers:
      - image: traefik:v1.7.17
        name: traefik-ingress-lb
        ports:
        - name: http
          containerPort: 80
        - name: admin
          containerPort: 8080
        args:
        - --api
        - --kubernetes
        - --logLevel=INFO
---
kind: Service
apiVersion: v1
metadata:
  name: traefik-ingress-service
  namespace: kube-system 
spec:
  selector:
    k8s-app: traefik-ingress-lb
  ports:
    - protocol: TCP
      port: 80
      name: web
      nodePort: 38000
    - protocol: TCP
      port: 8080
      nodePort: 38080
      name: admin
  type: NodePort
```

  

（3）、创建配置清单

  

```
kubectl apply -f traefik-rbac.yaml
kubectl apply -g traefik.yaml
```

  

（4）、查看结果

  

```
kubectl get pod -n kube-system 
NAME                                          READY   STATUS    RESTARTS   AGE
coredns-9d5b6bdb6-mpwht                       1/1     Running   0          22h
kube-flannel-ds-amd64-2qkcb                   1/1     Running   0          22h
kube-flannel-ds-amd64-7nzj5                   1/1     Running   0          22h
pod-demo                                      1/1     Running   0          22h
traefik-ingress-controller-7758594f89-lwf2t   1/1     Running   0          41s
# kubectl get svc -n kube-system 
NAME                      TYPE        CLUSTER-IP     EXTERNAL-IP   PORT(S)                       AGE
kube-dns                  ClusterIP   10.254.0.2     <none>        53/UDP,53/TCP,9153/TCP        22h
traefik-ingress-service   NodePort    10.254.33.90   <none>        80:38000/TCP,8080:38080/TCP   3m33s
```

  

我们可以通过http://10.1.10.129:38080 来查看Dashboard，如下

  

  

## 部署Dashboard

  

（1）、部署，直接是官方部署文档

  

```
kubectl apply -f https://raw.githubusercontent.com/kubernetes/dashboard/v2.0.0-beta8/aio/deploy/recommended.yaml
```

  

（2）、配置Ingress或者将service类型改为NodePort，我这里改为NodePort

  

```
kubectl edit svc -n kubernetes-dashboard kubernetes-dashboard
```

  

（3）、然后我们在浏览器访问

  

```
# kubectl get svc -n kubernetes-dashboard 
NAME                        TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)         AGE
dashboard-metrics-scraper   ClusterIP   10.254.224.240   <none>        8000/TCP        2m28s
kubernetes-dashboard        NodePort    10.254.82.50     <none>        443:28330/TCP   2m28s
```

  

（4）、创建一个admin token

  

```
# 创建sa
kubectl create sa dashboard-admin -n kube-system
# 授权
kubectl create clusterrolebinding dashboard-admin --clusterrole=cluster-admin --serviceaccount=kube-system:dashboard-admin
# 获取token
ADMIN_SECRET=$(kubectl get secrets -n kube-system | grep dashboard-admin | awk '{print $1}')
# 获取dashboard kubeconfig使用token的值
DASHBOARD_LOGIN_TOKEN=$(kubectl describe secret -n kube-system ${ADMIN_SECRET} | grep -E '^token' | awk '{print $2}')
echo ${DASHBOARD_LOGIN_TOKEN}
```

  

（5）、创建dashboard kubeconfig

  

> 还是在我们统一的Kubeconfig目录下创建/root/kubernetes/kubeconfig

  

```
# 设置集群参数
kubectl config set-cluster kubernetes \
  --certificate-authority=../ssl/kubernetes/ca.pem \
  --embed-certs=true \
  --server=${KUBE_APISERVER} \
  --kubeconfig=dashboard.kubeconfig

# 设置客户端认证参数，使用上面创建的 Token
kubectl config set-credentials dashboard_user \
  --token=${DASHBOARD_LOGIN_TOKEN} \
  --kubeconfig=dashboard.kubeconfig

# 设置上下文参数
kubectl config set-context default \
  --cluster=kubernetes \
  --user=dashboard_user \
  --kubeconfig=dashboard.kubeconfig

# 设置默认上下文
kubectl config use-context default --kubeconfig=dashboard.kubeconfig
```

  

然后下载dashboard.kubeconfig，在登录的时候上传即可进入主界面，如下

![image.png](assets/kubernetes与云原生/二进制部署K8S/二进制部署K8S-1.png)

  

## 部署Metrics Server

  

> github：[https://github.com/kubernetes-sigs/metrics-server](https://github.com/kubernetes-sigs/metrics-server)
> 
> 稳定版：[https://github.com/kubernetes/kubernetes/tree/master/cluster/addons/metrics-server](https://github.com/kubernetes/kubernetes/tree/master/cluster/addons/metrics-server)

  

（1）、下载YAML清单

  

```
for file in auth-delegator.yaml auth-reader.yaml metrics-apiservice.yaml metrics-server-deployment.yaml metrics-server-service.yaml resource-reader.yaml;do wget https://raw.githubusercontent.com/kubernetes/kubernetes/master/cluster/addons/metrics-server/${file}; done
```

（2）、修改metrics-server-deployment.yaml配置清单，如下

  

```
apiVersion: v1
kind: ServiceAccount
metadata:
  name: metrics-server
  namespace: kube-system
  labels:
    kubernetes.io/cluster-service: "true"
    addonmanager.kubernetes.io/mode: Reconcile
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: metrics-server-config
  namespace: kube-system
  labels:
    kubernetes.io/cluster-service: "true"
    addonmanager.kubernetes.io/mode: EnsureExists
data:
  NannyConfiguration: |-
    apiVersion: nannyconfig/v1alpha1
    kind: NannyConfiguration
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: metrics-server-v0.3.6
  namespace: kube-system
  labels:
    k8s-app: metrics-server
    kubernetes.io/cluster-service: "true"
    addonmanager.kubernetes.io/mode: Reconcile
    version: v0.3.6
spec:
  selector:
    matchLabels:
      k8s-app: metrics-server
      version: v0.3.6
  template:
    metadata:
      name: metrics-server
      labels:
        k8s-app: metrics-server
        version: v0.3.6
      annotations:
        seccomp.security.alpha.kubernetes.io/pod: 'docker/default'
    spec:
      priorityClassName: system-cluster-critical
      serviceAccountName: metrics-server
      nodeSelector:
        kubernetes.io/os: linux
      containers:
      - name: metrics-server
        image: registry.cn-hangzhou.aliyuncs.com/rookieops/metrics-server-amd64:v0.3.6 
        command:
        - /metrics-server
        - --metric-resolution=30s
        - --kubelet-insecure-tls
        # These are needed for GKE, which doesn't support secure communication yet.
        # Remove these lines for non-GKE clusters, and when GKE supports token-based auth.
        # - --deprecated-kubelet-completely-insecure=true
        - --kubelet-port=10250
        - --kubelet-preferred-address-types=InternalIP,Hostname,InternalDNS,ExternalDNS,ExternalIP
        ports:
        - containerPort: 443
          name: https
          protocol: TCP
      - name: metrics-server-nanny
        image: registry.cn-hangzhou.aliyuncs.com/rookieops/addon-resizer:1.8.6 
        resources:
          limits:
            cpu: 100m
            memory: 300Mi
          requests:
            cpu: 100m
            memory: 300Mi
        env:
          - name: MY_POD_NAME
            valueFrom:
              fieldRef:
                fieldPath: metadata.name
          - name: MY_POD_NAMESPACE
            valueFrom:
              fieldRef:
                fieldPath: metadata.namespace
        volumeMounts:
        - name: metrics-server-config-volume
          mountPath: /etc/config
        command:
          - /pod_nanny
          - --config-dir=/etc/config
          - --cpu=100m
          - --extra-cpu=0.5m
          - --memory=100Mi
          - --extra-memory=50Mi
          - --threshold=5
          - --deployment=metrics-server-v0.3.6
          - --container=metrics-server
          - --poll-period=300000
          - --estimator=exponential
          # Specifies the smallest cluster (defined in number of nodes)
          # resources will be scaled to.
          # - --minClusterSize=2
      volumes:
        - name: metrics-server-config-volume
          configMap:
            name: metrics-server-config
```

  

（3）、修改resource-reader.yaml如下

  

```
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: system:metrics-server
  labels:
    kubernetes.io/cluster-service: "true"
    addonmanager.kubernetes.io/mode: Reconcile
rules:
- apiGroups:
  - ""
  resources:
  - pods
  - nodes
  - namespaces
  - nodes/stats
  verbs:
  - get
  - list
  - watch
- apiGroups:
  - "apps"
  resources:
  - deployments
  verbs:
  - get
  - list
  - update
  - watch
- apiGroups:
  - "extensions"
  resources:
  - deployments
  verbs:
  - get
  - list
  - update
  - watch

---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: system:metrics-server
  labels:
    kubernetes.io/cluster-service: "true"
    addonmanager.kubernetes.io/mode: Reconcile
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: system:metrics-server
subjects:
- kind: ServiceAccount
  name: metrics-server
  namespace: kube-system
```

  

（4）、然后创建 配置清单

  

```
for file in auth-delegator.yaml auth-reader.yaml metrics-apiservice.yaml metrics-server-deployment.yaml metrics-server-service.yaml resource-reader.yaml;do kubectl apply -f ${file};done
```

  

（5）、查看

  

```
# kubectl top node
NAME         CPU(cores)   CPU%   MEMORY(bytes)   MEMORY%   
master-k8s   195m         19%    1147Mi          66%       
node01-k8s   117m         11%    885Mi           51%       
node02-k8s   117m         11%    945Mi           54%
```

  

> 如果出现error: metrics not available yet，重启kubelet（至少我是这样）

![image.png](assets/kubernetes与云原生/二进制部署K8S/二进制部署K8S-2.png)

  

  

  

> 参考文档
> 
> 作者：[juestnow](https://blog.51cto.com/juestnow)
> 
> 地址：[https://blog.51cto.com/juestnow/2439614](https://blog.51cto.com/juestnow/2439614)
> 
> 作者：余温竹下侯
> 
> 地址：[https://note.youdao.com/ynoteshare1/index.html?id=62351b1d4c803f7c6f180368b75fd3bf&type=note](https://note.youdao.com/ynoteshare1/index.html?id=62351b1d4c803f7c6f180368b75fd3bf&type=note)