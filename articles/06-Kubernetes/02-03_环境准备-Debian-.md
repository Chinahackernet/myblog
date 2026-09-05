# 环境准备(Debian)

> 分类：Kubernetes / 第2章：kubeadm集群安装部署
> 原文：https://www.cuiliangblog.cn/detail/section/189386499
> 来源：崔亮的博客

---

> 如果操作系统环境为Ubuntu、MX Linux、Deepin等De<font style="color:rgb(25, 27, 31);">bian系列操作系统，使用以下步骤操作。</font>
>

# 基础环境配置（所有节点）
## 修改主机名与hosts文件
```bash
root@k8s-master:~# hostnamectl set-hostname k8s-master

root@k8s-master:~# vim /etc/hosts
192.168.10.10   k8s-master
192.168.10.11   k8s-work1
192.168.10.12   k8s-work2
192.168.10.15   k8s-harbor
```

## 验证mac地址uuid
> 保证各节点mac和uuid唯一，避免克隆虚拟机后uuid一致导致加入集群异常
>

```bash
root@k8s-master:~# cat /sys/class/net/ens33/address 
root@k8s-master:~# cat /sys/class/dmi/id/product_uuid 
```

## 时间同步
```bash
root@k8s-master:~# vim /etc/systemd/timesyncd.conf 
[Time]
NTP=ntp1.aliyun.com ntp.neu.edu.cn

root@k8s-master:~# systemctl restart systemd-timesyncd.service
root@k8s-master:~# timedatectl set-timezone Asia/Shanghai
root@k8s-master:~# timedatectl
               Local time: Sun 2024-10-06 01:27:46 CST
           Universal time: Sat 2024-10-05 17:27:46 UTC
                 RTC time: Sat 2024-10-05 17:27:46
                Time zone: Asia/Shanghai (CST, +0800)
System clock synchronized: yes
              NTP service: active
          RTC in local TZ: no
```

## 关闭防火墙
```bash
systemctl stop ufw
systemctl disable ufw
```

## 关闭swap分区
```bash
root@k8s-master:~# swapoff -a  
root@k8s-master:~# sed -i '/ swap / s/^\(.*\)$/#\1/g' /etc/fstab  
```

# 其他配置（所有节点）
## 修改内核相关参数
加载`overlay`模块，提高文件系统通过减少磁盘使用和提高 I/O 性能。

加载`br_netfilter`模块，用于在 Linux 桥接接口和 Netfilter 子系统（负责网络包过滤和 NAT）之间提供数据包传递和处理功能 。

```bash
root@k8s-master:~# cat > /etc/modules-load.d/k8s.conf << EOF
overlay
br_netfilter
EOF
root@k8s-master:~# modprobe overlay
root@k8s-master:~# modprobe br_netfilter
root@k8s-master:~# lsmod | egrep overlay
overlay               118784  0
root@k8s-master:~# lsmod | egrep br_netfilter
br_netfilter           28672  0
bridge                176128  1 br_netfilter
```

开启网桥过滤、内核转发配置

vm.swappiness = 0 # 最大限度避免使用 swap

net.bridge.bridge-nf-call-ip6tables = 1  # 内核在桥接设备上让IPv6流量经过 Netfilter（iptables）过滤。

net.bridge.bridge-nf-call-iptables = 1 # 内核在桥接设备上让IPv4流量经过 Netfilter（iptables）过滤。

net.ipv4.ip_forward = 1 # 允许 IPv4 数据包从一个网络接口转发到另一个网络接口。

```bash
root@k8s-master:~# cat > /etc/sysctl.d/k8s.conf << EOF
vm.swappiness = 0 
net.bridge.bridge-nf-call-ip6tables = 1  
net.bridge.bridge-nf-call-iptables = 1
net.ipv4.ip_forward = 1 
fs.inotify.max_user_instances=8192 # 调整文件描述符，防止耗尽
fs.inotify.max_user_watches=524288
EOF
root@k8s-master:~# sysctl -p /etc/sysctl.d/k8s.conf
```

配置ipvs

```bash
# 安装ipset ipvsadm
root@k8s-master:~# apt install ipset ipvsadm -y
# 配置ipvsadm 添加模块
root@k8s-master:~# cat > /etc/sysctl.d/ipvs.sh <<EOF 
#!/bin/bash
modprobe -- ip_vs
modprobe -- ip_vs_rr
modprobe -- ip_vs_wrr
modprobe -- ip_vs_sh
modprobe -- nf_conntrack
modprobe -- br_netfilter
EOF
# 加载验证
root@k8s-master:~# chmod 755 /etc/sysctl.d/ipvs.sh
root@k8s-master:~# bash /etc/sysctl.d/ipvs.sh && lsmod | grep -e ip_vs -e nf_conntrack 
# 设置开机自启动
root@k8s-master:~# cat > /etc/systemd/system/ipvs-load.service <<EOF 
[Unit]
Description=IPVS Model Load
After=network.target

[Service]
ExecStart=/etc/sysctl.d/ipvs.sh
Restart=on-failure

[Install]
WantedBy=multi-user.target
EOF
root@k8s-master:~# systemctl daemon-reload
root@k8s-master:~# systemctl enable ipvs-load
```

## 配置阿里云仓库源
k8s版本1.28前，使用如下命令配置仓库源。

```bash
root@k8s-master:~# apt-get update && apt-get install -y apt-transport-https
root@k8s-master:~# curl https://mirrors.aliyun.com/kubernetes/apt/doc/apt-key.gpg | apt-key add - 
root@k8s-master:~# cat <<EOF >/etc/apt/sources.list.d/kubernetes.list
deb https://mirrors.aliyun.com/kubernetes/apt/ kubernetes-xenial main
EOF
root@k8s-master:~# apt-get update
```

k8s版本1.28以后，例如安装1.30，则修改对应的版本号即可。

```bash
root@k8s-master:~# apt-get update && apt-get install -y apt-transport-https && mkdir -p /etc/apt/keyrings
root@k8s-master:~# curl -fsSL https://mirrors.aliyun.com/kubernetes-new/core/stable/v1.30/deb/Release.key |
    gpg --dearmor -o /etc/apt/keyrings/kubernetes-apt-keyring.gpg
root@k8s-master:~# echo "deb [signed-by=/etc/apt/keyrings/kubernetes-apt-keyring.gpg] https://mirrors.aliyun.com/kubernetes-new/core/stable/v1.30/deb/ /" |
    tee /etc/apt/sources.list.d/kubernetes.list
root@k8s-master:~# apt-get update
```

## 安装kubeadm、kubectl、kubelet
```yaml
root@k8s-master:~# apt-get install -y kubelet kubeadm kubectl
root@k8s-master:~# systemctl enable kubelet
root@k8s-master:~# systemctl start kubelet
```

kubelet 运行在集群所有节点上，用于启动Pod和容器等对象的工具  
kubeadm 用于初始化集群，启动集群的命令工具  
kubectl 用于和集群通信的命令行，通过kubectl可以部署和管理应用，查看各种资源，创建、删除和更新各种组件

+ 默认安装最新版，也可以指定老版本安装

```bash
root@k8s-master:~# apt-cache madison kubeadm | sort -V
root@k8s-master:~# apt-get install -y kubelet=1.30.5-1.1 kubeadm=1.30.5-1.1 kubectl=1.30.5-1.1
```


