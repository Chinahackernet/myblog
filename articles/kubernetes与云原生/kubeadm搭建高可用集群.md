PS: 最近经常有朋友问我有没有用kubeadm搭建高可用集群的文档，说实在的我确实没有，我自己测试的话就用kubeadm单master版，公司用的话就用二进制搭建的。所以就找了个下班时间搭建测试了一番。希望对大家有帮助！如果觉得有用的话就帮忙点个关注或转发吧，哈哈~

  

## 节点规划信息

<table class="lake-table" style="width: 480px;"><colgroup><col span="1" width="240" /><col span="1" width="240" /></colgroup><tbody><tr style="height: 33px;"><td>名称<p data-lake-id="fb5eef6b1378714e62d02a8ec2db5f60"></p></td><td><p data-lake-id="44390cf86d6b76c1e1f15320756d14b6_p_0">IP</p></td></tr><tr style="height: 33px;"><td><p data-lake-id="ae23fc5785fa83b81eb2e3eae90616d1_p_0">k8s-master01</p></td><td><p data-lake-id="f5288918051daac58a0cdf74b1d666a8_p_0">10.1.10.100</p></td></tr><tr style="height: 33px;"><td><p data-lake-id="ae23fc5785fa83b81eb2e3eae90616d1_p_0">k8s-master02</p></td><td><p data-lake-id="f5288918051daac58a0cdf74b1d666a8_p_0">10.1.10.101</p></td></tr><tr style="height: 33px;"><td colspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><p data-lake-id="ae23fc5785fa83b81eb2e3eae90616d1_p_0">k8s-master03</p></td><td colspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><p data-lake-id="f5288918051daac58a0cdf74b1d666a8_p_0">10.1.10.102</p></td></tr><tr style="height: 33px;"><td colspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><p data-lake-id="ae23fc5785fa83b81eb2e3eae90616d1_p_0">k8s-node01</p></td><td colspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><p data-lake-id="f5288918051daac58a0cdf74b1d666a8_p_0">10.1.10.103</p></td></tr><tr style="height: 33px;"><td colspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><p data-lake-id="ae23fc5785fa83b81eb2e3eae90616d1_p_0">k8s-lb</p></td><td colspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><p data-lake-id="f5288918051daac58a0cdf74b1d666a8_p_0">10.1.10.200</p></td></tr></tbody></table>

  

## 基础环境配置

### 环境信息

<table class="lake-table" style="width: 720px;"><colgroup><col span="1" width="360" /><col span="1" width="360" /></colgroup><tbody><tr style="height: 33px;"><td><p data-lake-id="9d5ec2753e957021744f4c4ad65b7784_p_0">系统</p></td><td><p data-lake-id="c8a82df712f816962a97880e0aff9fc5_p_0">CentOS7.6.1810</p></td></tr><tr style="height: 33px;"><td><p data-lake-id="a20d224c568e48b9d67847a2c66a8c01_p_0">内核版本</p></td><td rowspan="1" colspan="1">4.9.220</td></tr></tbody></table>
<table class="lake-table" style="width: 720px;"><colgroup><col span="1" width="360" /><col span="1" width="360" /></colgroup><tbody><tr style="height: 33px;"><td><p data-lake-id="8def25e138ac1d96fc8ba237a9ae472c">软件</p></td><td><p data-lake-id="648b3e2d3fdd258b144eb717b4ec498a">版本</p></td></tr><tr style="height: 33px;"><td><p data-lake-id="c0ab3a235ec19ab96822a5ff2e914dda_p_0">kubernetes</p></td><td><p data-lake-id="f5288918051daac58a0cdf74b1d666a8_p_0">1.18.2</p></td></tr><tr style="height: 33px;"><td><p data-lake-id="5394a8ea5a0306ce3ac1e6aa18b98826_p_0">docker</p></td><td><p data-lake-id="f5288918051daac58a0cdf74b1d666a8_p_0">19.0.3</p></td></tr></tbody></table>

### 

  

环境初始化

（1）、配置主机名，以k8s-master01为例

```shell
hostnamectl set-hostname k8s-master01
```

（1）、配置主机hosts映射

```shell
10.1.10.100 k8s-master01
10.1.10.101 k8s-master02
10.1.10.102 k8s-master03
10.1.10.103 k8s-node01
10.1.10.200 k8s-lb
```

配置完后可以通过如下命令测试

```shell
for host in k8s-master01 k8s-master02 k8s-master03 k8s-node01 k8s-lb;do ping -c 1 $host;done
```

> 这里ping k8s-node01不通，是因为我们还没配置VIP

  

（2）、禁用防火墙

```shell
systemctl stop firewalld
systemctl disable firewalld
```

  

（3）、关闭selinux

```shell
setenforce 0
sed -i "s/^SELINUX=.*/SELINUX=disabled/g" /etc/sysconfig/selinux
sed -i "s/^SELINUX=.*/SELINUX=disabled/g" /etc/selinux/config
```

  

（4）、关闭swap分区

```shell
swapoff -a && sysctl -w vm.swappiness=0
```

（5）、时间同步

```shell
yum install chrony -y
systemctl enable chronyd
systemctl start chronyd
chronyc sources
```

（6）、配置ulimt

```shell
ulimit -SHn 65535
```

（7）、配置内核参数

```shell
cat >> /etc/sysctl.d/k8s.conf << EOF
net.bridge.bridge-nf-call-ip6tables = 1
net.bridge.bridge-nf-call-iptables = 1
net.ipv4.ip_forward = 1
vm.swappiness=0
EOF
```

使之生效

```shell
sysctl -p
```

（8）、master之间添加互信（按需）

```shell
ssh-keygen
ssh-copy-id 10.1.10.101
ssh-copy-id 10.1.10.102
```

### 内核升级

由于centos7.6的系统默认内核版本是3.10，3.10的内核有很多BUG，最常见的一个就是group memory leak。

  

（1）、下载所需要的内核版本，我这里采用rpm安装，所以直接下载的rpm包

```shell
wget https://cbs.centos.org/kojifiles/packages/kernel/4.9.220/37.el7/x86_64/kernel-4.9.220-37.el7.x86_64.rpm
```

（2）、执行rpm升级即可

```shell
rpm -ivh kernel-4.9.220-37.el7.x86_64.rpm
```

（3）、升级完reboot，然后查看内核是否成功升级

```shell
reboot
uname -r
```

  

### 组件安装

##### 安装ipvs

（1）、安装ipvs需要的软件

由于我准备使用ipvs作为kube-proxy的代理模式，所以需要安装相应的软件包。

```shell
yum install ipvsadm ipset sysstat conntrack libseccomp -y
```

（2）、加载模块

```shell
cat > /etc/sysconfig/modules/ipvs.modules <<EOF
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

配置重启自动加载

```shell
chmod 755 /etc/sysconfig/modules/ipvs.modules && bash /etc/sysconfig/modules/ipvs.modules && lsmod | grep -e ip_vs -e nf_conntrack
```

##### 安装docker-ce

```shell
# 安装需要的软件
yum install -y yum-utils device-mapper-persistent-data lvm2
# 添加yum源
yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
```

查看是否有docker-ce包

```shell
# yum list | grep docker-ce
containerd.io.x86_64                        1.2.13-3.1.el7             docker-ce-stable
docker-ce.x86_64                            3:19.03.8-3.el7            docker-ce-stable
docker-ce-cli.x86_64                        1:19.03.8-3.el7            docker-ce-stable
docker-ce-selinux.noarch                    17.03.3.ce-1.el7           docker-ce-stable
```

安装docker-ce

```shell
yum install docker-ce-19.03.8-3.el7 -y
systemctl start docker
systemctl enable docker
```

配置镜像加速

```shell
curl -sSL https://get.daocloud.io/daotools/set_mirror.sh | sh -s http://f1361db2.m.daocloud.io

systemctl restart docker
```

##### 安装kubernetes组件

添加yum源

```shell
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

安装软件

```shell
yum install -y kubelet-1.18.2-0 kubeadm-1.18.2-0 kubectl-1.18.2-0 --disableexcludes=kubernetes
```

将kubelet设置为开机自启动

```shell
systemctl enable kubelet.service
```

> 以上操作在所有节点执行

## 集群初始化

### 配置VIP

高可用采用的是HAProxy+Keepalived，HAProxy和KeepAlived以守护进程的方式在所有Master节点部署。

##### 安装软件

```shell
yum install keepalived haproxy -y
```

##### 配置haproxy

所有master节点的配置相同，如下：

```shell
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
    server  k8s-master01 10.1.10.100:6443 check
    server  k8s-master02 10.1.10.101:6443 check
    server  k8s-master03 10.1.10.102:6443 check

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

##### 配置keepalived

k8s-master01

```shell
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
    interface eth33
    virtual_router_id 51
    priority 100
    advert_int 1
    authentication {
        auth_type PASS
        auth_pass 1111
    }
    virtual_ipaddress {
			10.1.10.200
    }

    # 调用脚本
    track_script {
        check_apiserver
    }
}

```

k8s-master02

```shell
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
    interface eth33
    virtual_router_id 51
    priority 99
    advert_int 1
    authentication {
        auth_type PASS
        auth_pass 1111
    }
    virtual_ipaddress {
				10.1.10.200
    }

    # 调用脚本
    track_script {
        check_apiserver
    }
}
```

k8s-master03

```shell
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
    interface ens33
    virtual_router_id 51
    priority 98 
    advert_int 1
    authentication {
        auth_type PASS
        auth_pass 1111
    }
    virtual_ipaddress {
	10.1.10.200
    }

    # 调用脚本
    #track_script {
    #    check_apiserver
    #}
}
```

> 先把健康检查关闭，等部署好了过后再打开

  

编写健康检测脚本check-apiserver.sh

```shell
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

```shell
systemctl enable --now keepalived
systemctl enable --now haproxy
```

### 部署master

（1）、在k8s-master01上，编写kubeadm.yaml配置文件，如下：

```yaml
cat >> kubeadm.yaml <<EOF
apiVersion: kubeadm.k8s.io/v1beta2
kind: ClusterConfiguration
kubernetesVersion: v1.18.2
imageRepository: registry.cn-hangzhou.aliyuncs.com/google_containers
controlPlaneEndpoint: "k8s-lb:16443"
networking:
  dnsDomain: cluster.local
  podSubnet: 192.168.0.0/16
  serviceSubnet: 10.96.0.0/12
---
apiVersion: kubeproxy.config.k8s.io/v1alpha1
kind: KubeProxyConfiguration
featureGates:
  SupportIPVSProxyMode: true
mode: ipvs
EOF
```

提前下载镜像

```yaml
kubeadm config images pull --config kubeadm.yaml
```

进行初始化

```yaml
kubeadm init --config kubeadm.yaml --upload-certs
```
```yaml
W0509 22:37:40.702752   65728 configset.go:202] WARNING: kubeadm cannot validate component configs for API groups [kubelet.config.k8s.io kubeproxy.config.k8s.io]
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
[certs] apiserver serving cert is signed for DNS names [k8s-master01 kubernetes kubernetes.default kubernetes.default.svc kubernetes.default.svc.cluster.local k8s-lb] and IPs [10.96.0.1 10.1.10.100]
[certs] Generating "apiserver-kubelet-client" certificate and key
[certs] Generating "front-proxy-ca" certificate and key
[certs] Generating "front-proxy-client" certificate and key
[certs] Generating "etcd/ca" certificate and key
[certs] Generating "etcd/server" certificate and key
[certs] etcd/server serving cert is signed for DNS names [k8s-master01 localhost] and IPs [10.1.10.100 127.0.0.1 ::1]
[certs] Generating "etcd/peer" certificate and key
[certs] etcd/peer serving cert is signed for DNS names [k8s-master01 localhost] and IPs [10.1.10.100 127.0.0.1 ::1]
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
W0509 22:37:47.750722   65728 manifests.go:225] the default kube-apiserver authorization-mode is "Node,RBAC"; using "Node,RBAC"
[control-plane] Creating static Pod manifest for "kube-scheduler"
W0509 22:37:47.764989   65728 manifests.go:225] the default kube-apiserver authorization-mode is "Node,RBAC"; using "Node,RBAC"
[etcd] Creating static Pod manifest for local etcd in "/etc/kubernetes/manifests"
[wait-control-plane] Waiting for the kubelet to boot up the control plane as static Pods from directory "/etc/kubernetes/manifests". This can take up to 4m0s
[apiclient] All control plane components are healthy after 20.024575 seconds
[upload-config] Storing the configuration used in ConfigMap "kubeadm-config" in the "kube-system" Namespace
[kubelet] Creating a ConfigMap "kubelet-config-1.18" in namespace kube-system with the configuration for the kubelets in the cluster
[upload-certs] Storing the certificates in Secret "kubeadm-certs" in the "kube-system" Namespace
[upload-certs] Using certificate key:
f25e738324e4f027703f24b55d47d28f692b4edc21c2876171ff87877dc8f2ef
[mark-control-plane] Marking the node k8s-master01 as control-plane by adding the label "node-role.kubernetes.io/master=''"
[mark-control-plane] Marking the node k8s-master01 as control-plane by adding the taints [node-role.kubernetes.io/master:NoSchedule]
[bootstrap-token] Using token: 3k4vr0.x3y2nc3ksfnei4y1
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

You can now join any number of the control-plane node running the following command on each as root:

  kubeadm join k8s-lb:16443 --token 3k4vr0.x3y2nc3ksfnei4y1 \
    --discovery-token-ca-cert-hash sha256:a5f761f332bd45a199d0676875e7f58c323226df6fb9b4f0b977b6f63b252791 \
    --control-plane --certificate-key f25e738324e4f027703f24b55d47d28f692b4edc21c2876171ff87877dc8f2ef

Please note that the certificate-key gives access to cluster sensitive data, keep it secret!
As a safeguard, uploaded-certs will be deleted in two hours; If necessary, you can use
"kubeadm init phase upload-certs --upload-certs" to reload certs afterward.

Then you can join any number of worker nodes by running the following on each as root:

kubeadm join k8s-lb:16443 --token 3k4vr0.x3y2nc3ksfnei4y1 \
    --discovery-token-ca-cert-hash sha256:a5f761f332bd45a199d0676875e7f58c323226df6fb9b4f0b977b6f63b252791 
```

配置环境变量

```yaml
cat >> /root/.bashrc <<EOF
export KUBECONFIG=/etc/kubernetes/admin.conf
EOF
source /root/.bashrc
```

查看节点状态

```yaml
# kubectl get nodes
NAME           STATUS     ROLES    AGE    VERSION
k8s-master01   NotReady   master   3m1s   v1.18.2
```

安装网络插件

```yaml
wget https://docs.projectcalico.org/v3.8/manifests/calico.yaml
```

 如果有节点是多网卡，所以需要在资源清单文件中指定内网网卡

vi calico.yaml

```python
......
spec:
 containers:
 - env:
 - name: DATASTORE_TYPE
 value: kubernetes
 - name: IP_AUTODETECTION_METHOD # DaemonSet中添加该环境变量
 value: interface=ens33 # 指定内网网卡
 - name: WAIT_FOR_DATASTORE
 value: "true"
......
```

kubectl apply -f calico.yaml # 安装calico网络插件

  

当网络插件安装完成后，查看node节点信息如下：

```yaml
# kubectl get nodes
NAME           STATUS   ROLES    AGE   VERSION
k8s-master01   Ready    master   10m   v1.18.2
```

可以看到状态已经从NotReady变为ready了。

（2）、将master02加入集群

提前下载镜像

```yaml
kubeadm config images pull --config kubeadm.yaml
```

加入集群

```yaml
  kubeadm join k8s-lb:16443 --token 3k4vr0.x3y2nc3ksfnei4y1 \
    --discovery-token-ca-cert-hash sha256:a5f761f332bd45a199d0676875e7f58c323226df6fb9b4f0b977b6f63b252791 \
    --control-plane --certificate-key f25e738324e4f027703f24b55d47d28f692b4edc21c2876171ff87877dc8f2ef
```

输出如下：

```yaml
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

配置环境变量

```yaml
cat >> /root/.bashrc <<EOF
export KUBECONFIG=/etc/kubernetes/admin.conf
EOF
source /root/.bashrc
```

另一台的操作一样。

  

查看集群状态

```yaml
# kubectl get nodes 
NAME           STATUS   ROLES    AGE   VERSION
k8s-master01   Ready    master   41m   v1.18.2
k8s-master02   Ready    master   29m   v1.18.2
k8s-master03   Ready    master   27m   v1.18.2
```

查看集群组件状态

```yaml
# kubectl get pod -n kube-system -o wide
NAME                                       READY   STATUS     RESTARTS   AGE   IP               NODE           NOMINATED NODE   READINESS GATES
calico-kube-controllers-77c5fc8d7f-stl57   1/1     Running    0          26m   192.168.32.130   k8s-master01   <none>           <none>
calico-node-ppsph                          1/1     Running    0          26m   10.1.10.100      k8s-master01   <none>           <none>
calico-node-tl6sq                          0/1     Init:2/3   0          26m   10.1.10.101      k8s-master02   <none>           <none>
calico-node-w92qh                          1/1     Running    0          26m   10.1.10.102      k8s-master03   <none>           <none>
coredns-546565776c-vtlhr                   1/1     Running    0          42m   192.168.32.129   k8s-master01   <none>           <none>
coredns-546565776c-wz9bk                   1/1     Running    0          42m   192.168.32.131   k8s-master01   <none>           <none>
etcd-k8s-master01                          1/1     Running    0          42m   10.1.10.100      k8s-master01   <none>           <none>
etcd-k8s-master02                          1/1     Running    0          30m   10.1.10.101      k8s-master02   <none>           <none>
etcd-k8s-master03                          1/1     Running    0          28m   10.1.10.102      k8s-master03   <none>           <none>
kube-apiserver-k8s-master01                1/1     Running    0          42m   10.1.10.100      k8s-master01   <none>           <none>
kube-apiserver-k8s-master02                1/1     Running    0          30m   10.1.10.101      k8s-master02   <none>           <none>
kube-apiserver-k8s-master03                1/1     Running    0          28m   10.1.10.102      k8s-master03   <none>           <none>
kube-controller-manager-k8s-master01       1/1     Running    1          42m   10.1.10.100      k8s-master01   <none>           <none>
kube-controller-manager-k8s-master02       1/1     Running    1          30m   10.1.10.101      k8s-master02   <none>           <none>
kube-controller-manager-k8s-master03       1/1     Running    0          28m   10.1.10.102      k8s-master03   <none>           <none>
kube-proxy-6sbpp                           1/1     Running    0          28m   10.1.10.102      k8s-master03   <none>           <none>
kube-proxy-dpppr                           1/1     Running    0          42m   10.1.10.100      k8s-master01   <none>           <none>
kube-proxy-ln7l7                           1/1     Running    0          30m   10.1.10.101      k8s-master02   <none>           <none>
kube-scheduler-k8s-master01                1/1     Running    1          42m   10.1.10.100      k8s-master01   <none>           <none>
kube-scheduler-k8s-master02                1/1     Running    1          30m   10.1.10.101      k8s-master02   <none>           <none>
kube-scheduler-k8s-master03                1/1     Running    0          28m   10.1.10.102      k8s-master03   <none>           <none>

```

查看CSR

```yaml
 kubectl get csr
NAME        AGE   SIGNERNAME                                    REQUESTOR                  CONDITION
csr-cfl2w   42m   kubernetes.io/kube-apiserver-client-kubelet   system:node:k8s-master01   Approved,Issued
csr-mm7g7   28m   kubernetes.io/kube-apiserver-client-kubelet   system:bootstrap:3k4vr0    Approved,Issued
csr-qzn6r   30m   kubernetes.io/kube-apiserver-client-kubelet   system:bootstrap:3k4vr0    Approved,Issued
```

### 部署node

node节点只需加入集群即可

```yaml
kubeadm join k8s-lb:16443 --token 3k4vr0.x3y2nc3ksfnei4y1 \
    --discovery-token-ca-cert-hash sha256:a5f761f332bd45a199d0676875e7f58c323226df6fb9b4f0b977b6f63b252791 
```

输出日志如下：

```yaml
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

然后查看集群节点信息

```yaml
# kubectl get nodes 
NAME           STATUS     ROLES    AGE   VERSION
k8s-master01   Ready      master   47m   v1.18.2
k8s-master02   Ready      master   35m   v1.18.2
k8s-master03   Ready      master   32m   v1.18.2
k8s-node01     Ready   		node01   55s   v1.18.2

```

## 测试切换

关闭一台master主机，看集群是否可用。

关闭master01主机，然后查看整个集群。

```yaml
# 模拟关掉keepalived
systemctl stop keepalived
# 然后查看集群是否可用
[root@k8s-master03 ~]# kubectl get nodes
NAME           STATUS   ROLES    AGE   VERSION
k8s-master01   Ready    master   64m   v1.18.2
k8s-master02   Ready    master   52m   v1.18.2
k8s-master03   Ready    master   50m   v1.18.2
k8s-node01     Ready    <none>   18m   v1.18.2
[root@k8s-master03 ~]# kubectl get pod -n kube-system
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

  

> 到此集群搭建完了，然后可以开启keepalived的检查脚本了。另外一些组件就自己自行安装。

## 安装自动补全命令

```yaml
yum install -y bash-completion
source /usr/share/bash-completion/bash_completion
source <(kubectl completion bash)
echo "source <(kubectl completion bash)" >> ~/.bashrc
```