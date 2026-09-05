> 最近公司需要在测试环境搭建一个1.18版本的k8s高可用方式，因此采用kubeadm的方式搭建，如果想更熟悉k8s的各个组件的话还是建议使用二进制搭建学习。在自己本地搭建测试了一番，安全可靠，希望对大家有帮助！如果觉得有用的话就帮忙点个关注或转发吧

## 资源下载

```plain
资料下载

1.下文需要的yaml文件所在的github地址如下：

https://github.com/luckylucky421/kubernetes1.17.3/tree/master

大家可以把我的github仓库fork到你们自己的仓库里，这样就可以永久保存了，下面提供的yaml访问地址如果不能访问，那么就把这个github上的内容clone和下载到自己电脑

2.下文里提到的初始化k8s集群需要的镜像获取方式：镜像在百度网盘，链接如下：

链接：https://pan.baidu.com/s/1k1heJy8lLnDk2JEFyRyJdA

提取码：udkj
```

## 1 节点规划信息

<table class="lake-table" style="width: 720px;"><colgroup><col width="240" span="1" /><col width="240" span="1" /><col width="240" span="1" /></colgroup><tbody><tr style="height: 33px;"><td><p data-lake-id="9c16f8382a93d8ac2bb114322337244e_p_0">角色</p></td><td><p data-lake-id="1ac0cdd4e11430c3acfd6fb3b0f29f3c_p_0">IP地址</p></td><td rowspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><p data-lake-id="a20d224c568e48b9d67847a2c66a8c01_p_0">系统</p></td></tr><tr style="height: 33px;"><td><p data-lake-id="ad338f3e212f96b54a18525331b481ae"><span style="color: #333333;">k8s-master01</span></p></td><td><p data-lake-id="f5288918051daac58a0cdf74b1d666a8_p_0">10.211.55.3</p></td><td rowspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><p data-lake-id="a20d224c568e48b9d67847a2c66a8c01_p_0"><strong>CentOS7.6.1810</strong></p></td></tr><tr style="height: 33px;"><td rowspan="1" colspan="1"><span style="color: #333333; background-color: #FFFFFF;">k8s-master02</span></td><td rowspan="1" colspan="1"><span style="color: #262626;">10.211.55.5</span></td><td rowspan="1" colspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><strong>CentOS7.6.1810</strong></td></tr><tr style="height: 33px;"><td colspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><p data-lake-id="a20d224c568e48b9d67847a2c66a8c01_p_0"><span style="color: #333333;">k8s-master03</span></p></td><td colspan="1" rowspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><span style="color: #262626;">10.211.55.6</span></td><td rowspan="1" colspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><strong>CentOS7.6.1810</strong></td></tr><tr style="height: 33px;"><td colspan="1" rowspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><span style="color: #333333; background-color: #FFFFFF;">k8s-node01</span></td><td colspan="1" rowspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><span style="color: #262626;">10.211.55.7</span></td><td rowspan="1" colspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><strong>CentOS7.6.1810</strong></td></tr><tr style="height: 33px;"><td colspan="1" rowspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><span style="color: #333333; background-color: #FFFFFF;">k8s-lb</span></td><td colspan="1" rowspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><span style="color: #262626;">10.211.55.10</span></td><td rowspan="1" colspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><strong>CentOS7.6.1810</strong></td></tr></tbody></table>

## 2 基础环境准备

-   环境信息

<table class="lake-table" style="width: 480px;"><colgroup><col width="240" span="1" /><col width="240" span="1" /></colgroup><tbody><tr style="height: 33px;"><td><p data-lake-id="e144fa1d0394533c15f7ea2ee4870a7b_p_0">软件</p></td><td><p data-lake-id="cf5c20dff78cb1e710e45b42191b5299_p_0">版本</p></td></tr><tr style="height: 33px;"><td><p data-lake-id="51139d68eeb37c7ceac907fbdc5c1e72"><span class="lake-fontsize-12" style="color: #333333;">kubernetes</span></p></td><td><p data-lake-id="f5288918051daac58a0cdf74b1d666a8_p_0">1.18.2</p></td></tr><tr style="height: 33px;"><td rowspan="1" colspan="1"><span style="color: #333333; background-color: #F8F8F8;">docker</span></td><td rowspan="1" colspan="1"><span style="color: #333333; background-color: #F8F8F8;">19.0.3</span></td></tr></tbody></table>

### 2.1 环境初始化 

1）配置主机名，以k8s-master01为例(需要依次根据节点规划角色修改主机名)

> k8s-lb不需要设置

```plain
[root@localhost ~]# hostnamectl set-hostname k8s-master01
```

2）配置主机hosts映射

```plain
[root@localhost ~]# vim /etc/hosts
127.0.0.1   localhost localhost.localdomain localhost4 localhost4.localdomain4
::1         localhost localhost.localdomain localhost6 localhost6.localdomain6
10.1.10.100 k8s-master01
10.1.10.101 k8s-master02
10.1.10.102 k8s-master03
10.1.10.103 k8s-node01
10.1.10.200 k8s-lb
```

配置完后可以通过如下命令测试

```plain
[root@localhost ~]# for host in k8s-master01 k8s-master02 k8s-master03 k8s-node01 k8s-lb;do ping -c 1 $host;done
PING k8s-master01 (10.211.55.3) 56(84) bytes of data.
64 bytes from k8s-master01 (10.211.55.3): icmp_seq=1 ttl=64 time=0.063 ms

--- k8s-master01 ping statistics ---
1 packets transmitted, 1 received, 0% packet loss, time 0ms
rtt min/avg/max/mdev = 0.063/0.063/0.063/0.000 ms
PING k8s-master02 (10.211.55.5) 56(84) bytes of data.
64 bytes from k8s-master02 (10.211.55.5): icmp_seq=1 ttl=64 time=0.369 ms

--- k8s-master02 ping statistics ---
1 packets transmitted, 1 received, 0% packet loss, time 0ms
rtt min/avg/max/mdev = 0.369/0.369/0.369/0.000 ms
PING k8s-master03 (10.211.55.6) 56(84) bytes of data.
64 bytes from k8s-master03 (10.211.55.6): icmp_seq=1 ttl=64 time=0.254 ms
.....
```

> 这里ping k8s-lb不通，是因为我们还没配置VIP

3）禁用防火墙

```plain
[root@localhost ~]# systemctl stop firewalld
[root@localhost ~]# systemctl disable firewalld
```

4）关闭selinux

```plain
[root@localhost ~]# setenforce 0
[root@localhost ~]# sed -i "s/^SELINUX=.*/SELINUX=disabled/g" /etc/selinux/config 
```

5）关闭swap分区

```plain
[root@localhost ~]# swapoff -a # 临时
[root@localhost ~]# sed -i '/ swap / s/^\(.*\)$/#\1/g' /etc/fstab #永久
```

6）时间同步

```plain
[root@localhost ~]# yum install chrony -y
[root@localhost ~]# systemctl enable chronyd
[root@localhost ~]# systemctl start chronyd
[root@localhost ~]# chronyc sources
```

7）配置ulimt

```plain
[root@localhost ~]# ulimit -SHn 65535
```

8）配置内核参数

```plain
[root@localhost ~]# cat >> /etc/sysctl.d/k8s.conf << EOF
net.bridge.bridge-nf-call-ip6tables = 1
net.bridge.bridge-nf-call-iptables = 1
net.ipv4.ip_forward = 1
vm.swappiness=0
EOF
[root@localhost ~]# sysctl -p
```

### 2.2 内核升级

由于centos7.6的系统默认内核版本是3.10，3.10的内核有很多BUG，最常见的一个就是group memory leak(四台主机都要执行)

1）下载所需要的内核版本，我这里采用rpm安装，所以直接下载的rpm包

```plain
[root@localhost ~]# wget https://cbs.centos.org/kojifiles/packages/kernel/4.9.220/37.el7/x86_64/kernel-4.9.220-37.el7.x86_64.rpm
```

2）执行rpm升级即可

```plain
[root@localhost ~]# rpm -ivh kernel-4.9.220-37.el7.x86_64.rpm
```

3）升级完reboot，然后查看内核是否成功升级

```plain
[root@localhost ~]# reboot
[root@k8s-master01 ~]# uname -r
```

## 3 组件安装

### 3.1 安装ipvs

3）安装ipvs需要的软件

由于我准备使用ipvs作为kube-proxy的代理模式，所以需要安装相应的软件包。

```plain
[root@k8s-master01 ~]# yum install ipvsadm ipset sysstat conntrack libseccomp -y
```

2）加载模块

```plain
[root@k8s-master01 ~]# cat > /etc/sysconfig/modules/ipvs.modules <<EOF
#!/bin/bash
modprobe -- ip_vs
modprobe -- ip_vs_rr
modprobe -- ip_vs_wrr
modprobe -- ip_vs_sh
modprobe -- nf_conntrack
modprobe -- ip_tables
modprobe -- ip_set
modprobe -- xt_set
modprobe -- ipt_set
modprobe -- ipt_rpfilter
modprobe -- ipt_REJECT
modprobe -- ipip
EOF
```

> 注意：在内核4.19版本nf\_conntrack\_ipv4已经改为nf\_conntrack

3）配置重启自动加载

```plain
[root@k8s-master01 ~]# chmod 755 /etc/sysconfig/modules/ipvs.modules && bash /etc/sysconfig/modules/ipvs.modules && lsmod | grep -e ip_vs -e nf_conntrack
```

### 3.2 安装docker-ce

> 所有主机都需要安装

```plain
[root@k8s-master01 ~]# # 安装需要的软件
[root@k8s-master01 ~]# yum install -y yum-utils device-mapper-persistent-data lvm2
[root@k8s-master01 ~]# # 添加yum源
[root@k8s-master01 ~]# yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
```

-   查看是否有docker-ce包

```plain
[root@k8s-master01 ~]# yum list | grep docker-ce
containerd.io.x86_64                        1.2.13-3.1.el7             docker-ce-stable
docker-ce.x86_64                            3:19.03.8-3.el7            docker-ce-stable
docker-ce-cli.x86_64                        1:19.03.8-3.el7            docker-ce-stable
docker-ce-selinux.noarch                    17.03.3.ce-1.el7           docker-ce-stable
```

-   安装docker-ce

```plain
[root@k8s-master01 ~]# yum install docker-ce-19.03.8-3.el7 -y
[root@k8s-master01 ~]# systemctl start docker
[root@k8s-master01 ~]# systemctl enable docker
```

-   配置镜像加速

```plain
[root@k8s-master01 ~]# curl -sSL https://get.daocloud.io/daotools/set_mirror.sh | sh -s http://f1361db2.m.daocloud.io
[root@k8s-master01 ~]# systemctl restart docker
```

### 3.3 安装kubernetes组件

> 以上操作在所有节点执行

-   添加yum源

```plain
[root@k8s-master01 ~]# cat <<EOF > /etc/yum.repos.d/kubernetes.repo
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

-   安装软件

```plain
[root@k8s-master01 ~]# yum install -y kubelet-1.18.2-0 kubeadm-1.18.2-0 kubectl-1.18.2-0 --disableexcludes=kubernetes
```

-   将kubelet设置为开机自启动

```plain
[root@k8s-master01 ~]# systemctl enable kubelet.service
```

## 4 集群初始化

### 4.1 配置集群高可用

高可用采用的是HAProxy+Keepalived来进行高可用和master节点的流量负载均衡，HAProxy和KeepAlived以守护进程的方式在所有Master节点部署

-   安装软件

```plain
[root@k8s-master01 ~]# yum install keepalived haproxy -y
```

-   配置haproxy

所有master节点的配置相同，如下：

> 注意：把apiserver地址改成自己节点规划的master地址

```plain
[root@k8s-master01 ~]# vim /etc/haproxy/haproxy.cfg
#---------------------------------------------------------------------
# Global settings
#---------------------------------------------------------------------
global
    # to have these messages end up in /var/log/haproxy.log you will
    # need to:
    #
    # 1) configure syslog to accept network log events.  This is done
    #    by adding the '-r' option to the SYSLOGD_OPTIONS in
    #    /etc/sysconfig/syslog
    #
    # 2) configure local2 events to go to the /var/log/haproxy.log
    #   file. A line like the following can be added to
    #   /etc/sysconfig/syslog
    #
    #    local2.*                       /var/log/haproxy.log
    #
    log         127.0.0.1 local2

    chroot      /var/lib/haproxy
    pidfile     /var/run/haproxy.pid
    maxconn     4000
    user        haproxy
    group       haproxy
    daemon

    # turn on stats unix socket
    stats socket /var/lib/haproxy/stats

#---------------------------------------------------------------------
# common defaults that all the 'listen' and 'backend' sections will
# use if not designated in their block
#---------------------------------------------------------------------
defaults
    mode                    http
    log                     global
    option                  httplog
    option                  dontlognull
    option http-server-close
    option                  redispatch
    retries                 3
    timeout http-request    10s
    timeout queue           1m
    timeout connect         10s
    timeout client          1m
    timeout server          1m
    timeout http-keep-alive 10s
    timeout check           10s
    maxconn                 3000

#---------------------------------------------------------------------
# kubernetes apiserver frontend which proxys to the backends
#---------------------------------------------------------------------
frontend kubernetes
    mode                 tcp
    bind                 *:16443
    option               tcplog
    default_backend      kubernetes-apiserver

#---------------------------------------------------------------------
# round robin balancing between the various backends
#---------------------------------------------------------------------
backend kubernetes-apiserver
    mode        tcp
    balance     roundrobin
    server  k8s-master01 10.211.55.3:6443 check
    server  k8s-master02 10.211.55.5:6443 check
    server  k8s-master03 10.211.55.6:6443 check

#---------------------------------------------------------------------
# collection haproxy statistics message
#---------------------------------------------------------------------
listen stats
    bind                 *:9999
    stats auth           admin:P@ssW0rd
    stats refresh        5s
    stats realm          HAProxy\ Statistics
    stats uri            /admin?stats

```

-   配置keepalived

k8s-master01

```plain
[root@k8s-master01 ~]# vim /etc/keepalived/keepalived.conf 
! Configuration File for keepalived

global_defs {
   notification_email {
     acassen@firewall.loc
     failover@firewall.loc
     sysadmin@firewall.loc
   }
   notification_email_from Alexandre.Cassen@firewall.loc
   smtp_server 192.168.200.1
   smtp_connect_timeout 30
   router_id LVS_DEVEL
   vrrp_skip_check_adv_addr
   vrrp_garp_interval 0
   vrrp_gna_interval 0
}
# 定义脚本
vrrp_script check_apiserver {
    script "/etc/keepalived/check_apiserver.sh" 
    interval 2                                  
    weight -5                                  
    fall 3                                   
    rise 2                               
}

vrrp_instance VI_1 {
    state MASTER
    interface eth0
    virtual_router_id 51
    priority 100
    advert_int 1
    authentication {
        auth_type PASS
        auth_pass 1111
    }
    virtual_ipaddress {
   10.211.55.10
    }

    # 调用脚本
    #track_script {
    #    check_apiserver
    #}
}

```

k8s-master02节点配置

```plain
[root@k8s-master02 ~]# vim /etc/keepalived/keepalived.conf 
! Configuration File for keepalived

global_defs {
   notification_email {
     acassen@firewall.loc
     failover@firewall.loc
     sysadmin@firewall.loc
   }
   notification_email_from Alexandre.Cassen@firewall.loc
   smtp_server 192.168.200.1
   smtp_connect_timeout 30
   router_id LVS_DEVEL
   vrrp_skip_check_adv_addr
   vrrp_garp_interval 0
   vrrp_gna_interval 0
}
# 定义脚本
vrrp_script check_apiserver {
    script "/etc/keepalived/check_apiserver.sh" 
    interval 2                                  
    weight -5                                  
    fall 3                                   
    rise 2                               
}

vrrp_instance VI_1 {
    state MASTER
    interface eth0
    virtual_router_id 51
    priority 99
    advert_int 1
    authentication {
        auth_type PASS
        auth_pass 1111
    }
    virtual_ipaddress {
   10.211.55.10
    }

    # 调用脚本
    #track_script {
    #    check_apiserver
    #}
}

```

k8s-master03节点配置

```plain
[root@k8s-master03 ~]# vim /etc/keepalived/keepalived.conf 
! Configuration File for keepalived

global_defs {
   notification_email {
     acassen@firewall.loc
     failover@firewall.loc
     sysadmin@firewall.loc
   }
   notification_email_from Alexandre.Cassen@firewall.loc
   smtp_server 192.168.200.1
   smtp_connect_timeout 30
   router_id LVS_DEVEL
   vrrp_skip_check_adv_addr
   vrrp_garp_interval 0
   vrrp_gna_interval 0
}
# 定义脚本
vrrp_script check_apiserver {
    script "/etc/keepalived/check_apiserver.sh" 
    interval 2                                  
    weight -5                                  
    fall 3                                   
    rise 2                               
}

vrrp_instance VI_1 {
    state MASTER
    interface eth0
    virtual_router_id 51
    priority 98
    advert_int 1
    authentication {
        auth_type PASS
        auth_pass 1111
    }
    virtual_ipaddress {
   10.211.55.10
    }

    # 调用脚本
    #track_script {
    #    check_apiserver
    #}
}

```

编写健康检测脚本

```plain
[root@k8s-master01 ~]# vim /etc/keepalived/check-apiserver.sh
#!/bin/bash

function check_apiserver(){
 for ((i=0;i<5;i++))
 do
  apiserver_job_id=${pgrep kube-apiserver}
  if [[ ! -z ${apiserver_job_id} ]];then
   return
  else
   sleep 2
  fi
 done
 apiserver_job_id=0
}

# 1->running    0->stopped
check_apiserver
if [[ $apiserver_job_id -eq 0 ]];then
 /usr/bin/systemctl stop keepalived
 exit 1
else
 exit 0
fi
```

启动haproxy和keepalived

```plain
[root@k8s-master01 ~]# systemctl enable --now keepalived
[root@k8s-master01 ~]# systemctl enable --now haproxy
```

### 4.2 部署master

#### 1）在k8s-master01上，编写kubeadm.yaml配置文件，如下：

```plain
[root@k8s-master01 ~]# cat >> kubeadm.yaml <<EOF
apiVersion: kubeadm.k8s.io/v1beta2
kind: ClusterConfiguration
kubernetesVersion: v1.18.2
imageRepository: registry.cn-hangzhou.aliyuncs.com/google_containers
controlPlaneEndpoint: "k8s-lb:16443"
networking:
  dnsDomain: cluster.local
  podSubnet: 192.168.0.0/16
  serviceSubnet: 10.211.0.0/12
---
apiVersion: kubeproxy.config.k8s.io/v1alpha1
kind: KubeProxyConfiguration
featureGates:
  SupportIPVSProxyMode: true
mode: ipvs
EOF
```

#### 2）下载镜像

```plain
[root@k8s-master01 ~]# kubeadm config images pull --config kubeadm.yaml
```

镜像地址是使用的阿里云的地址，理论上应该也会很快，大家也可以直接下载文中开头所提供的镜像，然后导入到节点中

```plain
docker load -i  1-18-kube-apiserver.tar.gz
docker load -i  1-18-kube-scheduler.tar.gz
docker load -i  1-18-kube-controller-manager.tar.gz
docker load -i  1-18-pause.tar.gz
docker load -i  1-18-cordns.tar.gz
docker load -i  1-18-etcd.tar.gz
docker load -i 1-18-kube-proxy.tar.gz
说明：
pause版本是3.2，用到的镜像是k8s.gcr.io/pause:3.2
etcd版本是3.4.3，用到的镜像是k8s.gcr.io/etcd:3.4.3-0        
cordns版本是1.6.7，用到的镜像是k8s.gcr.io/coredns:1.6.7
apiserver、scheduler、controller-manager、kube-proxy版本是1.18.2，用到的镜像分别是
k8s.gcr.io/kube-apiserver:v1.18.2
k8s.gcr.io/kube-controller-manager:v1.18.2
k8s.gcr.io/kube-scheduler:v1.18.2
k8s.gcr.io/kube-proxy:v1.18.2
```

  

#### 3）进行初始化

```plain
[root@k8s-master01 ~]# kubeadm init --config kubeadm.yaml --upload-certs
W0514 01:09:20.846675   11871 configset.go:202] WARNING: kubeadm cannot validate component configs for API groups [kubelet.config.k8s.io kubeproxy.config.k8s.io]
[init] Using Kubernetes version: v1.18.2
[preflight] Running pre-flight checks
        [WARNING IsDockerSystemdCheck]: detected "cgroupfs" as the Docker cgroup driver. The recommended driver is "systemd". Please follow the guide at https://kubernetes.io/docs/setup/cri/
[preflight] Pulling images required for setting up a Kubernetes cluster
[preflight] This might take a minute or two, depending on the speed of your internet connection
[preflight] You can also perform this action in beforehand using 'kubeadm config images pull'
[kubelet-start] Writing kubelet environment file with flags to file "/var/lib/kubelet/kubeadm-flags.env"
[kubelet-start] Writing kubelet configuration to file "/var/lib/kubelet/config.yaml"
[kubelet-start] Starting the kubelet
[certs] Using certificateDir folder "/etc/kubernetes/pki"
[certs] Generating "ca" certificate and key
[certs] Generating "apiserver" certificate and key
[certs] apiserver serving cert is signed for DNS names [k8s-master01 kubernetes kubernetes.default kubernetes.default.svc kubernetes.default.svc.cluster.local k8s-lb] and IPs [10.208.0.1 10.211.55.3]
[certs] Generating "apiserver-kubelet-client" certificate and key
[certs] Generating "front-proxy-ca" certificate and key
[certs] Generating "front-proxy-client" certificate and key
[certs] Generating "etcd/ca" certificate and key
[certs] Generating "etcd/server" certificate and key
[certs] etcd/server serving cert is signed for DNS names [k8s-master01 localhost] and IPs [10.211.55.3 127.0.0.1 ::1]
[certs] Generating "etcd/peer" certificate and key
[certs] etcd/peer serving cert is signed for DNS names [k8s-master01 localhost] and IPs [10.211.55.3 127.0.0.1 ::1]
[certs] Generating "etcd/healthcheck-client" certificate and key
[certs] Generating "apiserver-etcd-client" certificate and key
[certs] Generating "sa" key and public key
[kubeconfig] Using kubeconfig folder "/etc/kubernetes"
[endpoint] WARNING: port specified in controlPlaneEndpoint overrides bindPort in the controlplane address
[kubeconfig] Writing "admin.conf" kubeconfig file
[endpoint] WARNING: port specified in controlPlaneEndpoint overrides bindPort in the controlplane address
[kubeconfig] Writing "kubelet.conf" kubeconfig file
[endpoint] WARNING: port specified in controlPlaneEndpoint overrides bindPort in the controlplane address
[kubeconfig] Writing "controller-manager.conf" kubeconfig file
[endpoint] WARNING: port specified in controlPlaneEndpoint overrides bindPort in the controlplane address
[kubeconfig] Writing "scheduler.conf" kubeconfig file
[control-plane] Using manifest folder "/etc/kubernetes/manifests"
[control-plane] Creating static Pod manifest for "kube-apiserver"
[control-plane] Creating static Pod manifest for "kube-controller-manager"
W0514 01:09:26.356826   11871 manifests.go:225] the default kube-apiserver authorization-mode is "Node,RBAC"; using "Node,RBAC"
[control-plane] Creating static Pod manifest for "kube-scheduler"
W0514 01:09:26.358323   11871 manifests.go:225] the default kube-apiserver authorization-mode is "Node,RBAC"; using "Node,RBAC"
[etcd] Creating static Pod manifest for local etcd in "/etc/kubernetes/manifests"
[wait-control-plane] Waiting for the kubelet to boot up the control plane as static Pods from directory "/etc/kubernetes/manifests". This can take up to 4m0s
[apiclient] All control plane components are healthy after 21.018365 seconds
[upload-config] Storing the configuration used in ConfigMap "kubeadm-config" in the "kube-system" Namespace
[kubelet] Creating a ConfigMap "kubelet-config-1.18" in namespace kube-system with the configuration for the kubelets in the cluster
[upload-certs] Skipping phase. Please see --upload-certs
[mark-control-plane] Marking the node k8s-master01 as control-plane by adding the label "node-role.kubernetes.io/master=''"
[mark-control-plane] Marking the node k8s-master01 as control-plane by adding the taints [node-role.kubernetes.io/master:NoSchedule]
[bootstrap-token] Using token: q4ui64.gp5g5rezyusy9xw9
[bootstrap-token] Configuring bootstrap tokens, cluster-info ConfigMap, RBAC Roles
[bootstrap-token] configured RBAC rules to allow Node Bootstrap tokens to get nodes
[bootstrap-token] configured RBAC rules to allow Node Bootstrap tokens to post CSRs in order for nodes to get long term certificate credentials
[bootstrap-token] configured RBAC rules to allow the csrapprover controller automatically approve CSRs from a Node Bootstrap Token
[bootstrap-token] configured RBAC rules to allow certificate rotation for all node client certificates in the cluster
[bootstrap-token] Creating the "cluster-info" ConfigMap in the "kube-public" namespace
[kubelet-finalize] Updating "/etc/kubernetes/kubelet.conf" to point to a rotatable kubelet client certificate and key
[addons] Applied essential addon: CoreDNS
[endpoint] WARNING: port specified in controlPlaneEndpoint overrides bindPort in the controlplane address
[addons] Applied essential addon: kube-proxy

Your Kubernetes control-plane has initialized successfully!

To start using your cluster, you need to run the following as a regular user:

  mkdir -p $HOME/.kube
  sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
  sudo chown $(id -u):$(id -g) $HOME/.kube/config

You should now deploy a pod network to the cluster.
Run "kubectl apply -f [podnetwork].yaml" with one of the options listed at:
  https://kubernetes.io/docs/concepts/cluster-administration/addons/

You can now join any number of control-plane nodes by copying certificate authorities
and service account keys on each node and then running the following as root:

  kubeadm join k8s-lb:16443 --token q4ui64.gp5g5rezyusy9xw9 \
    --discovery-token-ca-cert-hash sha256:1b7cd42c825288a53df23dcd818aa03253b0c7e7e9317fa92bde2fb853d899d1 \
    --control-plane 

Then you can join any number of worker nodes by running the following on each as root:

kubeadm join k8s-lb:16443 --token q4ui64.gp5g5rezyusy9xw9 \
    --discovery-token-ca-cert-hash sha256:1b7cd42c825288a53df23dcd818aa03253b0c7e7e9317fa92bde2fb853d899d1 
```

> 最后输出的kubeadm jion需要记录下来，后面的master节点和node节点需要用

#### 4）配置环境变量

```plain
[root@k8s-master01 ~]# cat >> /root/.bashrc <<EOF
export KUBECONFIG=/etc/kubernetes/admin.conf
EOF
[root@k8s-master01 ~]# source /root/.bashrc
```

#### 5）查看节点状态

```plain
[root@k8s-master01 ~]# kubectl get node
NAME           STATUS     ROLES    AGE     VERSION
k8s-master01   NotReady   master   3m47s   v1.18.2
```

#### 6）安装网络插件

> 如果有节点是多网卡，所以需要在资源清单文件中指定内网网卡（如何单网卡可以不用修改）)

```plain
[root@k8s-master01 ~]# wget https://docs.projectcalico.org/v3.8/manifests/calico.yaml
[root@k8s-master01 ~]# vi calico.yaml
......
      containers:
        # Runs calico-node container on each Kubernetes node.  This
        # container programs network policy and routes on each
        # host.
        - name: calico-node
          image: calico/node:v3.8.8-1
          env:
            # Use Kubernetes API as the backing datastore.
            - name: DATASTORE_TYPE
              value: "kubernetes"
            # Wait for the datastore.
            - name: IP_AUTODETECTION_METHOD # DaemonSet中添加该环境变量
              value: interface=ens33 # 指定内网网卡
            - name: WAIT_FOR_DATASTORE
              value: "true"
            # Set based on the k8s node name.
            - name: NODENAME
              valueFrom:
                fieldRef:
                  fieldPath: spec.nodeName
......
# 安装calico网络插件
[root@k8s-master01 ~]# kubectl apply -f calico.yaml
```

当网络插件安装完成后，查看node节点信息如下：

```plain
[root@k8s-master01 ~]# kubectl get nodes
NAME           STATUS   ROLES    AGE   VERSION
k8s-master01   Ready    master   10m   v1.18.2
```

可以看到状态已经从NotReady变为ready了。

#### 7）将master02加入集群

-   下载镜像

```plain
[root@k8s-master02 ~]# kubeadm config images pull --config kubeadm.yaml
```

-   加入集群

```plain
[root@k8s-master02 ~]# kubeadm join k8s-lb:16443 --token q4ui64.gp5g5rezyusy9xw9 \
    --discovery-token-ca-cert-hash sha256:1b7cd42c825288a53df23dcd818aa03253b0c7e7e9317fa92bde2fb853d899d1 \
    --control-plane
```

-   输出如下：

```plain
...
This node has joined the cluster and a new control plane instance was created:

* Certificate signing request was sent to apiserver and approval was received.
* The Kubelet was informed of the new secure connection details.
* Control plane (master) label and taint were applied to the new node.
* The Kubernetes control plane instances scaled up.
* A new etcd member was added to the local/stacked etcd cluster.

To start administering your cluster from this node, you need to run the following as a regular user:

 mkdir -p $HOME/.kube
 sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
 sudo chown $(id -u):$(id -g) $HOME/.kube/config

Run 'kubectl get nodes' to see this node join the cluster.
...
```

-   配置环境变量

```plain
[root@k8s-master02 ~]# cat >> /root/.bashrc <<EOF
export KUBECONFIG=/etc/kubernetes/admin.conf
EOF
[root@k8s-master02 ~]# source /root/.bashrc
```

-   另一台的操作一样,把master03加入集群
-   查看集群状态

```plain
[root@k8s-master01 ~]# kubectl get nodes 
NAME           STATUS   ROLES    AGE   VERSION
k8s-master01   Ready    master   41m   v1.18.2
k8s-master02   Ready    master   29m   v1.18.2
k8s-master03   Ready    master   27m   v1.18.2
```

-   查看集群组件状态

全部都Running，则所有组件都正常了，不正常，可以具体查看pod日志进行排查

```plain
[root@k8s-master01 ~]# kubectl get pod -n kube-system
NAME                                       READY   STATUS     RESTARTS   AGE       NODE           NOMINATED NODE   READINESS GATES
calico-kube-controllers-77c5fc8d7f-stl57   1/1     Running    0          26m      k8s-master01   <none>           <none>
calico-node-ppsph                          1/1     Running    0          26m      k8s-master01   <none>           <none>
calico-node-tl6sq                          1/1     Running   0          26m      k8s-master02   <none>           <none>
calico-node-w92qh                          1/1     Running    0          26m      k8s-master03   <none>           <none>
coredns-546565776c-vtlhr                   1/1     Running    0          42m      k8s-master01   <none>           <none>
coredns-546565776c-wz9bk                   1/1     Running    0          42m      k8s-master01   <none>           <none>
etcd-k8s-master01                          1/1     Running    0          42m      k8s-master01   <none>           <none>
etcd-k8s-master02                          1/1     Running    0          30m      k8s-master02   <none>           <none>
etcd-k8s-master03                          1/1     Running    0          28m      k8s-master03   <none>           <none>
kube-apiserver-k8s-master01                1/1     Running    0          42m      k8s-master01   <none>           <none>
kube-apiserver-k8s-master02                1/1     Running    0          30m      k8s-master02   <none>           <none>
kube-apiserver-k8s-master03                1/1     Running    0          28m      k8s-master03   <none>           <none>
kube-controller-manager-k8s-master01       1/1     Running    1          42m      k8s-master01   <none>           <none>
kube-controller-manager-k8s-master02       1/1     Running    1          30m      k8s-master02   <none>           <none>
kube-controller-manager-k8s-master03       1/1     Running    0          28m      k8s-master03   <none>           <none>
kube-proxy-6sbpp                           1/1     Running    0          28m      k8s-master03   <none>           <none>
kube-proxy-dpppr                           1/1     Running    0          42m      k8s-master01   <none>           <none>
kube-proxy-ln7l7                           1/1     Running    0          30m      k8s-master02   <none>           <none>
kube-scheduler-k8s-master01                1/1     Running    1          42m      k8s-master01   <none>           <none>
kube-scheduler-k8s-master02                1/1     Running    1          30m      k8s-master02   <none>           <none>
kube-scheduler-k8s-master03                1/1     Running    0          28m      k8s-master03   <none>           <none>
```

-   查看CSR

```plain
[root@k8s-master01 ~]# kubectl get csr
NAME        AGE   SIGNERNAME                                    REQUESTOR                  CONDITION
csr-cfl2w   42m   kubernetes.io/kube-apiserver-client-kubelet   system:node:k8s-master01   Approved,Issued
csr-mm7g7   28m   kubernetes.io/kube-apiserver-client-kubelet   system:bootstrap:3k4vr0    Approved,Issued
csr-qzn6r   30m   kubernetes.io/kube-apiserver-client-kubelet   system:bootstrap:3k4vr0    Approved,Issued
```

### 4.3 部署node

-   node节点只需加入集群即可

```plain
[root@k8s-master01 ~]# kubeadm join k8s-lb:16443 --token q4ui64.gp5g5rezyusy9xw9 \
    --discovery-token-ca-cert-hash sha256:1b7cd42c825288a53df23dcd818aa03253b0c7e7e9317fa92bde2fb853d899d1 
```

-   输出日志如下：

```plain
W0509 23:24:12.159733   10635 join.go:346] [preflight] WARNING: JoinControlPane.controlPlane settings will be ignored when control-plane flag is not set.
[preflight] Running pre-flight checks
 [WARNING IsDockerSystemdCheck]: detected "cgroupfs" as the Docker cgroup driver. The recommended driver is "systemd". Please follow the guide at https://kubernetes.io/docs/setup/cri/
[preflight] Reading configuration from the cluster...
[preflight] FYI: You can look at this config file with 'kubectl -n kube-system get cm kubeadm-config -oyaml'
[kubelet-start] Downloading configuration for the kubelet from the "kubelet-config-1.18" ConfigMap in the kube-system namespace
[kubelet-start] Writing kubelet configuration to file "/var/lib/kubelet/config.yaml"
[kubelet-start] Writing kubelet environment file with flags to file "/var/lib/kubelet/kubeadm-flags.env"
[kubelet-start] Starting the kubelet
[kubelet-start] Waiting for the kubelet to perform the TLS Bootstrap...

This node has joined the cluster:
* Certificate signing request was sent to apiserver and a response was received.
* The Kubelet was informed of the new secure connection details.

Run 'kubectl get nodes' on the control-plane to see this node join the cluster.
```

-   最后然后查看集群节点信息

```plain
[root@k8s-master01 ~]# kubectl get nodes 
NAME           STATUS     ROLES    AGE   VERSION
k8s-master01   Ready      master   47m   v1.18.2
k8s-master02   Ready      master   35m   v1.18.2
k8s-master03   Ready      master   32m   v1.18.2
k8s-node01     Ready     node01   55s   v1.18.2
```

## 5 测试集群高可用

关闭master01主机，然后查看整个集群。

```plain
# 模拟关掉keepalived
systemctl stop keepalived
# 然后查看集群是否可用
[root@k8s-master02 ~]# ip addr
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    inet 127.0.0.1/8 scope host lo
       valid_lft forever preferred_lft forever
    inet6 ::1/128 scope host 
       valid_lft forever preferred_lft forever
2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc pfifo_fast state UP group default qlen 1000
    link/ether 00:1c:42:ab:d3:44 brd ff:ff:ff:ff:ff:ff
    inet 10.211.55.5/24 brd 10.211.55.255 scope global noprefixroute dynamic eth0
       valid_lft 1429sec preferred_lft 1429sec
    inet 10.211.55.10/32 scope global eth0
       valid_lft forever preferred_lft forever
    inet6 fdb2:2c26:f4e4:0:72b2:f577:d0e6:50a/64 scope global noprefixroute dynamic 
       valid_lft 2591676sec preferred_lft 604476sec
    inet6 fe80::c202:94c6:b940:2d6b/64 scope link noprefixroute 
......
[root@k8s-master02 ~]# kubectl get nodes
NAME           STATUS   ROLES    AGE   VERSION
k8s-master01   Ready    master   64m   v1.18.2
k8s-master02   Ready    master   52m   v1.18.2
k8s-master03   Ready    master   50m   v1.18.2
k8s-node01     Ready    <none>   18m   v1.18.2
[root@k8s-master02 ~]# kubectl get pod -n kube-system
NAME                                       READY   STATUS    RESTARTS   AGE
calico-kube-controllers-77c5fc8d7f-stl57   1/1     Running   0          49m
calico-node-8t5ft                          1/1     Running   0          19m
calico-node-ppsph                          1/1     Running   0          49m
calico-node-tl6sq                          1/1     Running   0          49m
calico-node-w92qh                          1/1     Running   0          49m
coredns-546565776c-vtlhr                   1/1     Running   0          65m
coredns-546565776c-wz9bk                   1/1     Running   0          65m
etcd-k8s-master01                          1/1     Running   0          65m
etcd-k8s-master02                          1/1     Running   0          53m
etcd-k8s-master03                          1/1     Running   0          51m
kube-apiserver-k8s-master01                1/1     Running   0          65m
kube-apiserver-k8s-master02                1/1     Running   0          53m
kube-apiserver-k8s-master03                1/1     Running   0          51m
kube-controller-manager-k8s-master01       1/1     Running   2          65m
kube-controller-manager-k8s-master02       1/1     Running   1          53m
kube-controller-manager-k8s-master03       1/1     Running   0          51m
kube-proxy-6sbpp                           1/1     Running   0          51m
kube-proxy-dpppr                           1/1     Running   0          65m
kube-proxy-ln7l7                           1/1     Running   0          53m
kube-proxy-r5ltk                           1/1     Running   0          19m
kube-scheduler-k8s-master01                1/1     Running   2          65m
kube-scheduler-k8s-master02                1/1     Running   1          53m
kube-scheduler-k8s-master03                1/1     Running   0          51m
```

## 6 安装自动补全命令

```plain
yum install -y bash-completion
source /usr/share/bash-completion/bash_completion
source <(kubectl completion bash)
echo "source <(kubectl completion bash)" >> ~/.bashrc
```

## 7 **安装kubernetes-dashboard-2版本（kubernetes的web ui界面）**

把kubernetes-dashboard镜像上传到各个节点，按照如下方法通过docker load -i解压，镜像地址在文章开头处的百度网盘里，可自行下载

docker load -i dashboard\_2\_0\_0.tar.gz

docker load -i metrics-scrapter-1-0-1.tar.gz

解压出来的镜像是kubernetesui/dashboard:v2.0.0-beta8和kubernetesui/metrics-scraper:v1.0.1

### 7.1 在master01节点操作

```plain
[root@k8s-master01 ~]# kubectl apply -f kubernetes-dashboard.yaml
```

> kubernetes-dashboard.yaml文件内容在如下链接地址处复制[https://raw.githubusercontent.com/luckylucky421/kubernetes1.17.3/master/kubernetes-dashboard.yaml](https://raw.githubusercontent.com/luckylucky421/kubernetes1.17.3/master/kubernetes-dashboard.yaml)

上面如果访问不了，可以访问下面的链接，然后把下面的分支克隆和下载，手动把yaml文件传到master1上即可：

[https://github.com/luckylucky421/kubernetes1.17.3](https://github.com/luckylucky421/kubernetes1.17.3)

-   验证

```plain
[root@k8s-master01 ~]# kubectl get pods -n kubernetes-dashboard
NAME                                        READY   STATUS    RESTARTS  AGE 
dashboard-metrics-scraper-694557449d-8xmtf   1/1    Running   0          60s  
kubernetes-dashboard-5f98bdb684-ph9wg        1/1    Running   2          60s
```

-   查看dashboard前端的service

```plain
[root@k8s-master01 ~]# kubectl get svc -n kubernetes-dashboard
NAME                       TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)   AGE 
dashboard-metrics-scraper  ClusterIP   10.211.23.9      <none>        8000/TCP        3m59s
kubernetes-dashboard       ClusterIP   10.211.253.155   <none>        443/TCP    50s
```

-   修改service type类型变成NodePort

```plain
[root@k8s-master01 ~]# kubectl edit svc kubernetes-dashboard -n kubernetes-dashboard
把type: ClusterIP变成 type: NodePort，保存退出即可。
```

-   查看对外暴露的端口

```plain
[root@k8s-master01 ~]# kubectl get svc -n kubernetes-dashboard
NAME                       TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)         AGE
dashboard-metrics-scraper  ClusterIP   10.211.23.9      <none>        8000/TCP        3m59s
kubernetes-dashboard       NodePort    10.211.253.155   <none>        443:31175/TCP   4m
```

上面可看到service类型是NodePort，访问master1节点ip:31175端口即可访问kubernetes dashboard，我的环境需要输入如下地址

[https://10.211.55.10:31775/](https://192.168.0.6:31775/)

### 7.2 **通过yaml文件里指定的默认的token登陆dashboard**

**1)** **查看kubernetes-dashboard名称空间下的secret**

```plain
[root@k8s-master01 ~]# kubectl get secret -n kubernetes-dashboard
NAME                              TYPE                                 DATA   AGE
default-token-vxd7t               kubernetes.io/service-account-token  3      5m27s
kubernetes-dashboard-certs        Opaque                               0      5m27s
kubernetes-dashboard-csrf         Opaque                               1      5m27s
kubernetes-dashboard-key-holder   Opaque                               2      5m27s
kubernetes-dashboard-token-ngcmg  kubernetes.io/service-account-token  3      5m27s
```

**2****）找到对应的带有token的kubernetes-dashboard-token-ngcmg**

```plain
[root@k8s-master01 ~]# kubectl  describe  secret kubernetes-dashboard-token-ngcmg  -n   kubernetes-dashboard
```

**记住token后面的值，把下面的token值复制到浏览器token登陆处即可登陆：**

点击sing in登陆，显示如下，默认是只能看到default名称空间内容

**3)** **创建管理员token，可查看任何空间权限**

```plain
[root@k8s-master01 ~]# kubectl create clusterrolebinding dashboard-cluster-admin--clusterrole=cluster-admin --serviceaccount=kubernetes-dashboard:kubernetes-dashboard
```

**找到对应的带有token的kubernetes-dashboard-token-ngcmg**

```plain
[root@k8s-master01 ~]# kubectl  describe  secret kubernetes-dashboard-token-ngcmg  -n   kubernetes-dashboard
```

**记住token后面的值，把下面的token值复制到浏览器token登陆处即可登陆,这样就有权限查看所有的资源了**

## **8 安装metrics组件**

把metrics-server-amd64\_0\_3\_1.tar.gz和addon.tar.gz镜像上传到各个节点，按照如下方法通过docker load -i解压，镜像地址在文章开头处的百度网盘里，可自行下载

```plain
[root@k8s-master01 ~]# docker load -i metrics-server-amd64_0_3_1.tar.gz
[root@k8s-master01 ~]# docker load -i addon.tar.gz
```

metrics-server版本0.3.1，用到的镜像是k8s.gcr.io/metrics-server-amd64:v0.3.1       

addon-resizer版本是1.8.4，用到的镜像是k8s.gcr.io/addon-resizer:1.8.4

### 8.1 在k8s的master1节点操作

```plain
[root@k8s-master01 ~]# kubectl apply -f metrics.yaml
```

metrics.yaml文件内容在如下链接地址处复制

[https://raw.githubusercontent.com/luckylucky421/kubernetes1.17.3/master/metrics.yaml](https://raw.githubusercontent.com/luckylucky421/kubernetes1.17.3/master/metrics.yaml)

上面如果访问不了，可以访问下面的链接，然后把下面的分支克隆和下载，手动把yaml文件传到master1上即可：

[https://github.com/luckylucky421/kubernetes1.17.3](https://github.com/luckylucky421/kubernetes1.17.3)

-   验证

上面组件都安装之后，查看组件安装是否正常，STATUS状态是Running，说明组件正常，如下所示：

```plain
[root@k8s-master01 ~]# kubectl  get  pods  -n kube-system  -o wide
NAME                               READY   STATUS   RESTARTS   AGE   IP             NODE      NOMINATE
calico-node-h66ll                  1/1     Running  0          51m   192.168.0.56   node1    <none> 
calico-node-r4k6w                  1/1     Running  0          58m   192.168.0.6    master1  <none> 
coredns-66bff467f8-2cj5k           1/1     Running  0          70m   10.244.0.3     master1  <none> 
coredns-66bff467f8-nl9zt           1/1     Running  0          70m   10.244.0.2     master1  <none> 
etcd-master1                       1/1     Running  0          70m   192.168.0.6    master1  <none> 
kube-apiserver-master1             1/1     Running  0          70m   192.168.0.6    master1  <none> 
kube-controller-manager-master1    1/1    Running   0          70m  192.168.0.6    master1   <none> 
kube-proxy-qts4n                   1/1     Running  0          70m   192.168.0.6    master1  <none> 
kube-proxy-x647c                   1/1     Running  0          51m   192.168.0.56   node1    <none> 
kube-scheduler-master1             1/1     Running  0          70m   192.168.0.6    master1  <none> 
metrics-server-8459f8db8c-gqsks    2/2    Running   0          16s  10.244.1.6     node1     <none> 
traefik-ingress-controller-xhcfb   1/1    Running   0          39m  192.168.0.6    master1   <none> 
traefik-ingress-controller-zkdpt   1/1    Running   0          39m  192.168.0.56   node1     <none>
```

上面如果看到metrics-server-8459f8db8c-gqsks是running状态，说明metrics-server组件部署成功了，接下来就可以在master1节点上使用kubectl top pods -n kube-system或者kubectl top nodes命令