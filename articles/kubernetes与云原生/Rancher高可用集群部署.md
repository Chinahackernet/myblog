##### 一、**Rancher安装**

1、Rancher HA架构

![图片1.png](assets/kubernetes与云原生/Rancher高可用集群部署/Rancher高可用集群部署-1.png)

  

<table style="width: 324px;" class="lake-table"><colgroup><col width="144"><col width="144"><col width="144"></colgroup><tbody><tr style="height: 13px;"><td rowspan="2"><p style="text-indent: 21.0000pt;" data-lake-id="0dff0e2f304796b20b7d062b9df1b0c4"><span style="" class="lake-fontsize-10">ip</span><span style="" class="lake-fontsize-10"></span></p></td><td rowspan="2"><p style="text-indent: 21.0000pt;" data-lake-id="a1186289992df9996023f2b8be151a71"><span style="" class="lake-fontsize-10">hostname</span><span style="" class="lake-fontsize-10"></span></p></td><td rowspan="2"><p style="text-indent: 21.0000pt;" data-lake-id="ecf075ab7b9c79dc4d8385279d62a71c"><span style="" class="lake-fontsize-10">功能</span><span style="" class="lake-fontsize-10"></span></p></td></tr><tr style="height: 13px;"></tr><tr style="height: 13px;"><td rowspan="2"><p style="text-indent: 21.0000pt;" data-lake-id="676e4896ce39bca30eb87e06f7a36c94"><span style="" class="lake-fontsize-10">172.16.0.1</span><span style="" class="lake-fontsize-10">01</span><span style="" class="lake-fontsize-10"></span></p></td><td rowspan="2"><p style="text-indent: 21.0000pt;" data-lake-id="59332651b2313d4d1f73ec3f618ae598"><span style="" class="lake-fontsize-10">rancher-master-1</span><span style="" class="lake-fontsize-10"></span></p></td><td rowspan="2"><p style="text-indent: 21.0000pt;" data-lake-id="c26012f2b095d298cad187b029e07756"><span style="" class="lake-fontsize-10">etcd、k8s master</span><span style="" class="lake-fontsize-10"></span></p></td></tr><tr style="height: 13px;"></tr><tr style="height: 13px;"><td rowspan="2"><p style="text-indent: 21.0000pt;" data-lake-id="a47a04f78256980e88e585ea3039a7aa"><span style="" class="lake-fontsize-10">172.16.0.</span><span style="" class="lake-fontsize-10">10</span><span style="" class="lake-fontsize-10">2</span><span style="" class="lake-fontsize-10"></span></p></td><td rowspan="2"><p style="text-indent: 21.0000pt;" data-lake-id="e442cc32176f302ba7886b8a27b6d798"><span style="" class="lake-fontsize-10">rancher-master-2</span><span style="" class="lake-fontsize-10"></span></p></td><td rowspan="2"><p style="text-indent: 21.0000pt;" data-lake-id="50a8facd42e6ae395508fee17e382d64"><span style="" class="lake-fontsize-10">etcd、k8s master</span><span style="" class="lake-fontsize-10"></span></p></td></tr><tr style="height: 13px;"></tr><tr style="height: 13px;"><td rowspan="2"><p style="text-indent: 21.0000pt;" data-lake-id="8d5ead4867ab722c8fcb53cc1c7452b1"><span style="" class="lake-fontsize-10">172.16.0.</span><span style="" class="lake-fontsize-10">10</span><span style="" class="lake-fontsize-10">3</span><span style="" class="lake-fontsize-10"></span></p></td><td rowspan="2"><p style="text-indent: 21.0000pt;" data-lake-id="dca16d7441ed8854e2a49ad574a85b77"><span style="" class="lake-fontsize-10">rancher-master-3</span><span style="" class="lake-fontsize-10"></span></p></td><td rowspan="2"><p style="text-indent: 21.0000pt;" data-lake-id="1835fffe8a5d0e6cebead03e4de10915"><span style="" class="lake-fontsize-10">etcd、k8s master</span><span style="" class="lake-fontsize-10"></span></p></td></tr><tr style="height: 13px;"></tr><tr style="height: 13px;"><td rowspan="2"><p style="text-indent: 21.0000pt;" data-lake-id="fba213451e9888867a04a9893e3a438c"><span style="" class="lake-fontsize-10">172.16.0.104</span><span style="" class="lake-fontsize-10"></span></p></td><td rowspan="2"><p style="text-indent: 21.0000pt;" data-lake-id="c441cb3b160605422d920f6393c15a39"><span style="" class="lake-fontsize-10">rancehr-worker-1</span><span style="" class="lake-fontsize-10"></span></p></td><td rowspan="2"><p style="text-indent: 21.0000pt;" data-lake-id="a6defdf73988f98661a143991ebdfe06"><span style="" class="lake-fontsize-10">k8s worker</span><span style="" class="lake-fontsize-10"></span></p></td></tr><tr style="height: 13px;"></tr><tr style="height: 13px;"><td><p style="text-indent: 21.0000pt;" data-lake-id="a80b0cc7c86108795e7f92d8b6a8dfc6"><span style="" class="lake-fontsize-10">172.16.0.105</span><span style="color: rgb(0, 0, 0);" class="lake-fontsize-11"></span></p></td><td><p style="text-indent: 21.0000pt;" data-lake-id="ad2c77a99b8de3922844f2e45ab538fc"><span style="" class="lake-fontsize-10">rancehr-worker-2</span><span style="color: rgb(0, 0, 0);" class="lake-fontsize-11"></span></p></td><td><p style="text-indent: 21.0000pt;" data-lake-id="c5363a17682430dd8c91b837f96441a1"><span style="" class="lake-fontsize-10">k8s worker</span><span style="color: rgb(0, 0, 0);" class="lake-fontsize-11"></span></p></td></tr><tr style="height: 13px;"><td><p style="text-indent: 21.0000pt;" data-lake-id="35f5399afdf0905db57e3dba621ccc42"><span style="" class="lake-fontsize-10">172.16.0.106</span><span style="color: rgb(0, 0, 0);" class="lake-fontsize-11"></span></p></td><td><p style="text-indent: 21.0000pt;" data-lake-id="0f199171515afc31d7062e50edddab98"><span style="" class="lake-fontsize-10">rancehr-worker-3</span><span style="color: rgb(0, 0, 0);" class="lake-fontsize-11"></span></p></td><td><p style="text-indent: 21.0000pt;" data-lake-id="712d37913e02f1b34a9b5dbfb8d16a1b"><span style="" class="lake-fontsize-10">k8s worker</span><span style="color: rgb(0, 0, 0);" class="lake-fontsize-11"></span></p></td></tr><tr style="height: 13px;"><td><p style="text-indent: 21.0000pt;" data-lake-id="d7f351f0d8c5c7a87a935ce43873c643"><span style="" class="lake-fontsize-10">172.16.0.107</span><span style="color: rgb(0, 0, 0);" class="lake-fontsize-11"></span></p></td><td><p style="text-indent: 21.0000pt;" data-lake-id="d799ba81477c68c8bd025af809cdb7f5"><span style="color: rgb(0, 0, 0);" class="lake-fontsize-11">&nbsp;</span></p></td><td><p style="text-indent: 21.0000pt;" data-lake-id="b1453502879f85da090f2142af49a076"><span style="" class="lake-fontsize-10">负载均衡器</span><span style="color: rgb(0, 0, 0);" class="lake-fontsize-11"></span></p></td></tr></tbody></table>

2、对应节点分别配置主机名

```yaml
hostnamectl set-hostname rancher-master-1
hostnamectl set-hostname rancher-master-2
hostnamectl set-hostname rancher-master-3
hostnamectl set-hostname rancher-worker-1
hostnamectl set-hostname rancher-worker-2
hostnamectl set-hostname rancher-worker-3
```

  

3、分别配置每台主机的hosts(/etc/hosts),添加host\_ip $hostname到/etc/hosts文件中。

```yaml
172.16.0.101 rancher-master-1
172.16.0.102 rancher-master-2
172.16.0.103 rancher-master-3
172.16.0.104 rancher-worker-1
172.16.0.104 rancher-worker-2
172.16.0.104 rancher-worker-3
```

4、关闭防火墙

```yaml
systemctl stop firewalld.service && systemctl disable firewalld.service
```

  

5、关闭SeLinux

```yaml
sudo sed -i 's/SELINUX=enforcing/SELINUX=disabled/g' /etc/selinux/config
```

  

6、内核性能调优：

```yaml
cat >> /etc/sysctl.conf<<EOF
net.ipv4.ip_forward=1
net.bridge.bridge-nf-call-iptables=1
net.bridge.bridge-nf-call-ip6tables=1
vm.swappiness=0
vm.max_map_count=655360
EOF
 
 sysctl --system
```

  

7、禁用swap

```yaml
swapoff -a && sed -i '/ swap / s/^\(.*\)$/#\1/g' /etc/fstab
```

  

8、安装docker、配置容器目录、镜像加速地址等。

```yaml
https://www.rancher.cn/docs/rancher/v2.x/cn/install-prepare/basic-environment-configuration/
```

  

9、添加一个新的用户以创建rke集群：

```yaml
groupadd docker
useradd rancher -G docker
echo "gl2Hfc^JEF" | passwd --stdin rancher
```

  

10、从172.16.0.101配置免密登录到其他节点

```yaml
su - rancher
ssh-keygen
ssh-copy-id rancher@172.16.0.101
ssh-copy-id rancher@172.16.0.102
ssh-copy-id rancher@172.16.0.103
ssh-copy-id rancher@172.16.0.104
ssh-copy-id rancher@172.16.0.105
ssh-copy-id rancher@172.16.0.106
```

  

11、在172.16.0.101安装rke、kubectl、helm

```yaml
su root
sudo wget https://www.cnrancher.com/download/rke/v0.2.2-rke_linux-amd64
sudo wget https://www.cnrancher.com/download/kubernetes/linux-amd64-v1.13.6-kubectl
sudo wget https://www.cnrancher.com/download/helm/helm-v2.14.0-linux-amd64.tar.gz
sudo cp v0.2.2-rke_linux-amd64 /usr/bin/rke
sudo chmod +x /usr/bin/rke
sudo cp linux-amd64-v1.13.6-kubectl /usr/bin/kubectl
sudo chmod +x /usr/bin/kubectl
sudo tar -xvf helm-v2.14.0-linux-amd64.tar.gz
sudo mv linux-amd64/helm /usr/bin/helm
sudo mv linux-amd64/tiller /usr/bin/tiller
sudo rm -rf  linux-amd64/
```

  

12、在172.16.0.101创建rancher集群配置文件:

```yaml
su - rancher
 
cat > rancher-cluster.yml << EOF
nodes:
  - address: 172.16.0.101 
    user: rancher
    role: [controlplane,etcd]
  - address: 172.16.0.102
    user: rancher
    role: [controlplane,etcd]
  - address: 172.16.0.103
    user: rancher
    role: [controlplane,etcd]
  - address: 172.16.0.104
    user: rancher
    role: [worker]
  - address: 172.16.0.105
    user: rancher
    role: [worker]
  - address: 172.16.0.106
    user: rancher
    role: [worker]
 
services:
  etcd:
    snapshot: true
    creation: 6h
    retention: 24h
EOF
```

  

13、在172.16.0.101上启动rke集群

```yaml
rke up --config ./rancher-cluster.yml
```

  

14、增删节点、修改12中的配置文件，执行13中的命令

15、在172.16.0.101配置环境变量：

```yaml
su - root
echo export KUBECONFIG=/home/rancher/kube_config_rancher-cluster.yml  >>  /etc/profile
source /etc/profile
```

  

16、在172.16.0.101配置kubectl命令补全

```yaml
echo "source <(kubectl completion bash)" >> ~/.bashrc
source ~/.bashrc
su - rancher
echo "source <(kubectl completion bash)" >> ~/.bashrc
source ~/.bashrc
```

  

17、在172.16.0.101配置Helm客户端访问权限

```yaml
(1)、kubectl -n kube-system create serviceaccount tiller
(2)、kubectl create clusterrolebinding tiller --clusterrole cluster-admin --serviceaccount=kube-system:tiller
```

  

18、在172.16.0.101安装Helm客户端

```yaml
helm init --service-account tiller  --tiller-image registry.cn-hangzhou.aliyuncs.com/google_containers/tiller:v2.14.0 --stable-repo-url https://kubernetes.oss-cn-hangzhou.aliyuncs.com/charts
```

  

18、在172.16.0.101添加Chart仓库地址

```yaml
helm repo add rancher-stable https://releases.rancher.com/server-charts/stable
```

  

19、使用权威CA机构颁发的证书安装rancher-server

（1）、创建secret

```yaml
kubectl create namespace cattle-system
kubectl -n cattle-system \
create secret tls tls-rancher-ingress \
--cert=./cartechfin.com.pem \
--key=./cartechfin.com.key
```

  

（2）、在172.16.0.101上使用helm安装rancher-server，域名为financial-k8s.coolops.cn

```yaml
helm install rancher-stable/rancher \
--name rancher \
--namespace cattle-system \
--set hostname=financial-k8s.coolops.cn \
--set ingress.tls.source=secret
```

  

20、配置负载均衡，使用四层负载将ingress节点80、443端口配置到负载均衡，并将域名financial-k8s.coolops.cn解析到负载均衡外网IP。

##### 二、**其他设置**

1、Ingress-NginX传递自定义header：

```yaml
kind: ConfigMap
apiVersion: v1
metadata:
  name: nginx-configuration
  namespace: ingress-nginx
  labels:
    app: ingress-nginx
data:
  enable-underscores-in-headers: "true"
```

  

2、配置集群内部使用内网域名访问（非必须）

```yaml
（1）kubectl -n cattle-system patch  daemonsets cattle-node-agent --patch '{
    "spec": {
        "template": {
            "spec": {
                "hostAliases": [
                    {
                        "hostnames":
                        [
                            "financial-k8s.coolops.cn"
                        ],
                            "ip": "172.16.0.107"
                    }
                ]
            }
        }
    }
}'
（2） 、kubectl -n cattle-system patch  deployments cattle-cluster-agent --patch '{
    "spec": {
        "template": {
            "spec": {
                "hostAliases": [
                    {
                        "hostnames":
                        [
                            "financial-k8s.coolops.cn"
                        ],
                            "ip": "172.16.0.107"
                    }
                ]
            }
        }
    }
}'
```