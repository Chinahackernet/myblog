> 内容主要源自邹佳在云原生社区的分享。

  

Harbor 是一个用于存储和分发Docker 镜像的企业级Registry 服务器，由vmware开源，是一个可信的云原生制品仓库，用来存储、签名、管理相关的内容。

  

Harbor的一切设计都是围绕了云原生展开的，并且会在这个方向一直坚持下去。

  

在云原生下，镜像就是命脉，一切应用都是围绕着镜像，可以说镜像技术加速了云原生的发展。

  

那么Harbor在镜像方面做了哪些呢？

  

## 让镜像分发更高效

#### （1）基于策略的内容复制机制

Harbor支持多种过滤器（镜像库、标签等）与多种触发模式（手动、定时等）来实现镜像的推送和拉取。

-   初始的时候进行全量拉取
-   然后再通过增量拉取

![image.png](assets/kubernetes与云原生/harbor_在云原生中使用-附安装/harbor_在云原生中使用-附安装-1.png)

  

在大集群，多机房的情况下，可以使用主从模式（中心-边缘模式）来进行镜像的分发。

![image.png](assets/kubernetes与云原生/harbor_在云原生中使用-附安装/harbor_在云原生中使用-附安装-2.png)

#### （2）提供项目级别的缓存能力

最近开源圈热论的话题就是DockerHub限速问题，不过“上有政策，下有对策”，Harbor就可以有效解决这个问题。

  

通过Harbor缓存下来的制品与“本地”制品无异，而且Harbor方面相关的管理策略也可以应用到缓存的镜像上，比如配额、扫描等。目前仅支持上游的DockerHub和其他的Harbor。

  

在配置缓存时要注意几点：

-   要使用缓存功能，则必须在新建项目的时候选择启用，切该项目不可推送
-   已创建的普通项目无法直接转为缓存项目
-   Pull镜像的路径有专门的格式。`docker pull <harbor-host>/[cache-project-name]/<repository>_path`，比如`docker pull goharbor.io/my_cache_pro/library/nginx:latest`

  

![image.png](assets/kubernetes与云原生/harbor_在云原生中使用-附安装/harbor_在云原生中使用-附安装-3.png)

  

#### （3）可以使用P2P进行镜像预热

> PS：这里的P2P不是网贷机构，不会暴雷的。

那什么是P2P技术呢？

  

在C/S模式中，数据的分发采用专门的服务器，多个客户端都从此服务器获取数据。这种模式的优点是：数据的一致性容易控制，系统也容易管理。但是此种模式的缺点是：因为服务器的个数只有一个(即便有多个也非常有限)，系统容易出现单一失效点；单一服务器面对众多的客户端，由于CPU能力、内存大小、网络带宽的限制，可同时服务的客户端非常有限，可扩展性差。

  

P2P技术正是为了解决这些问题而提出来的一种对等网络结构。在P2P网络中，每个节点既可以从其他节点得到服务，也可以向其他节点提供服务。这样，庞大的终端资源被利用起来，一举解决了C/S模式中的两个弊端。

  

Harbor也充分利用了这种技术，将所选镜像提前分发到P2P网络中，以便客户端拉取的时候直接从P2P网络中拉取。

-   基于策略实现自动化

-   Repository过滤器
-   Tag过滤器
-   标签（Label）过滤器
-   漏洞状态条件
-   签名状态条件

-   基于事件触发或定时触发

  

Harbor目前仅支持：

-   Dragonfly。是阿里自研并捐献给 CNCF 的 P2P 文件分发系统。
-   Kraken。是 Uber 开源的点对点（P2P）Docker 容器仓库。

![image.png](assets/kubernetes与云原生/harbor_在云原生中使用-附安装/harbor_在云原生中使用-附安装-4.png)

  

## 让镜像分发更安全

**容器实际上是不透明的**，被封装成一个个繁琐的镜像。当越来越多的镜像被创建时，没有人能确定镜像里到底封装了什么，所以日常使用的镜像都面临着严重的安全问题。

  

Harbor在安全方面做了严格的把关。

  

#### （1）对镜像进行签名

  

-   基于开源的Notary实现镜像的签名

![image.png](assets/kubernetes与云原生/harbor_在云原生中使用-附安装/harbor_在云原生中使用-附安装-5.png)

-   基于GPG实现对Helm Chart的签名支持

![image.png](assets/kubernetes与云原生/harbor_在云原生中使用-附安装/harbor_在云原生中使用-附安装-6.png)

  

#### （2）对镜像进行漏洞扫描

  

-   通过插件化接入扫描器，对镜像进行漏洞扫描

![image.png](assets/kubernetes与云原生/harbor_在云原生中使用-附安装/harbor_在云原生中使用-附安装-7.png)

-   可以生成相应的扫描报告，以便与管理相关漏洞信息和了解安全威胁程度

![image.png](assets/kubernetes与云原生/harbor_在云原生中使用-附安装/harbor_在云原生中使用-附安装-8.png)

  

  

#### （3）通过策略限制不安全镜像分发

可以在项目里设置相关的安全策略，以阻止不合安全规范的镜像分发。

-   基于内容信任，仅允许通过认证的镜像分发
-   基于危害级别，可以设置危害级别限制镜像分发

![image.png](assets/kubernetes与云原生/harbor_在云原生中使用-附安装/harbor_在云原生中使用-附安装-9.png)

  

#### （4）通过规则来限制Tag不被覆盖或删除

默认情况下Harbor里的镜像是可以被覆盖和删除的，不过可以添加一些规则来保护一些Tag不被删除，比如latest的tag。

![image.png](assets/kubernetes与云原生/harbor_在云原生中使用-附安装/harbor_在云原生中使用-附安装-10.png)

规则可以通过正则匹配，匹配上的tag会被标记为不可变。

  

## 优雅的资源清理和垃圾回收

  

犹记Harbor1.x的时候，资源清理和垃圾回收是多么的繁杂。要先调API进行资源清理，然后进重启进行垃圾回收。为此还专门写脚本进行定时清理。

  

不过在Harbor2.x就不用这么麻烦了。

  

#### （1）可以通过策略保留需要的TAG

可以在项目仓库里通过策略来保留需要的TAG。

![image.png](assets/kubernetes与云原生/harbor_在云原生中使用-附安装/harbor_在云原生中使用-附安装-11.png)

规则可以自定义，如下

![image.png](assets/kubernetes与云原生/harbor_在云原生中使用-附安装/harbor_在云原生中使用-附安装-12.png)

说明：

-   不可变TAG一定会被保留
-   该操作不释放存储空间，仅释放配额

  

#### （2）可以通过垃圾清理来释放空间

可以通过垃圾清理来释放空间。当然不一定释放很多空间，比如你的这个镜像的底层是链接了一个大的镜像，大镜像没被清理，空间也就释放不到多少。

![image.png](assets/kubernetes与云原生/harbor_在云原生中使用-附安装/harbor_在云原生中使用-附安装-13.png)

  

## 多种HA方案

#### （1）基于内容复制能力的HA

通俗点说就是多套独立的环境，通过Replicate的方式来进行同步数据，如下：

![image.png](assets/kubernetes与云原生/harbor_在云原生中使用-附安装/harbor_在云原生中使用-附安装-14.png)

#### （2）基于外部共享服务的HA

![image.png](assets/kubernetes与云原生/harbor_在云原生中使用-附安装/harbor_在云原生中使用-附安装-15.png)

#### （3）在Kubernetes集群中的多实例HA

原则上和第二种HA差不多。

![image.png](assets/kubernetes与云原生/harbor_在云原生中使用-附安装/harbor_在云原生中使用-附安装-16.png)

#### （4）Harbor Operator基于Kubernetes的all-in-one HA

![image.png](assets/kubernetes与云原生/harbor_在云原生中使用-附安装/harbor_在云原生中使用-附安装-17.png)

#### （5）多数据中心的HA

![image.png](assets/kubernetes与云原生/harbor_在云原生中使用-附安装/harbor_在云原生中使用-附安装-18.png)

  

## 动手安装Harbor玩玩

“纸上得来终觉浅，绝知此事要躬行”。下面我们就来安装Harbor来玩玩。

  

Harbor的安装方式主要有以下几种。

-   离线安装包
-   在线安装包
-   Helm Chart
-   Harbor Operator（开发中）

  

这里主要尝试前三种安装方式。

系统：Centos 7.4

内核：Kernel 3.10

Harbor：2.1.1

docker-compose：1.27.4

helm：v3

kubernetes：1.17.9

  

下载地址：

[https://github.com/goharbor/harbor/releases](https://github.com/goharbor/harbor/releases)

[https://github.com/docker/compose/releases](https://github.com/docker/compose/releases)

  

> 前提：系统做好了初始化

  

#### 01 系统初始化以及安装所需软件

（1）关闭防火墙、SeLinux、修改主机名

```shell
# systemctl stop firewalld
# systemctl disable firewalld
# setenforce 0
# vim /etc/sysconfig/selinux
	SELINUX=disabeld
# hostnamectl set-hostname harbor
# hostname
```

（2）安装docker-ce

```shell
# yum install -y yum-utils device-mapper-persistent-data lvm2
# yum-config-manager --add-repo http://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo
# yum install docker-ce -y
# systemctl start docker
# systemctl enable docker
# curl -sSL https://get.daocloud.io/daotools/set_mirror.sh | sh -s http://f1361db2.m.daocloud.io
# systemctl restart docker
```

（3）安装docker-compose

```shell
# wget https://github.com/docker/compose/releases/download/1.27.4/docker-compose-Linux-x86_64
# mv docker-compose-Linux-x86_64 /usr/local/bin/docker-compose
# chmod +x /usr/local/bin/docker-compose
# docker-compose version
```

  

#### 02 离线安装Harbor

（1）下载Harbor离线安装包并解压到/opt目录下

```shell
# wget https://github.com/goharbor/harbor/releases/download/v2.1.1/harbor-offline-installer-v2.1.1.tgz
# tar xf harbor-offline-installer-v2.1.1.tgz -C /opt/
```

（2）拷贝配置文件，并对起进行修改

```shell
# cd /opt/harbor
# cp harbor.yml.tmpl harbor.yml
```

配置文件主要修改以下几个地方。

-   hostname：主机名或域名
-   https证书
-   harbor\_admin\_password：管理员密码
-   data\_volume：数据存放目录

  

修改后如下：

```shell
hostname: 172.17.100.171,harbor.coolops.cn 
http:
  port: 80
https:
  port: 443
  certificate: /opt/harbor/ssl/harbor.coolops.cn.crt
  private_key: /opt/harbor/ssl/harbor.coolops.cn.key
harbor_admin_password: Harbor12345
database:
  password: root123
  max_idle_conns: 50
  max_open_conns: 1000
data_volume: /data
......
```

（3）生成ssl证书

这里使用openssl工具生成。

```shell
# yum install -y openssl
# mkdir /opt/harbor/ssl
# cd /opt/harbor/ssl
# openssl genrsa -out ca.key 4096
# openssl req -x509 -new -nodes -sha512 -days 3650 -subj "/C=CN/ST=Chongqing/L=Chongqing/O=harbor.coolops.cn/OU=harbor.coolops.cn/CN=harbor.coolops.cn" -key ca.key -out ca.crt
# openssl genrsa -out harbor.coolops.cn.key 4096
# openssl req -sha512 -new -subj "/C=CN/ST=Chongqing/L=Chongqing/O=harbor.coolops.cn/OU=harbor.coolops.cn/CN=harbor.coolops.cn" -key harbor.coolops.cn.key -out harbor.coolops.cn.csr
```

创建一个外部配置文件

```shell
#cat > xexternalfile.ext <<-EOF
authorityKeyIdentifier=keyid,issuer
basicConstraints=CA:FALSE
keyUsage = digitalSignature, nonRepudiation, keyEncipherment, dataEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names
[alt_names]
DNS.1=harbor.coolops.cn
EOF
```

通过外部配置文件生成crt和csr

```shell
# openssl x509 -req -sha512 -days 3650 -extfile xexternalfile.ext -CA ca.crt -CAkey ca.key -CAcreateserial -in harbor.coolops.cn.csr -out harbor.coolops.cn.crt
```

将crt转为cert

```shell
# openssl x509 -inform PEM -in harbor.coolops.cn.crt -out harbor.coolops.cn.cert
```

（4）预装harbor

```shell
# cd /opt/harbor
# ./prepare
```

通过预装可以看看配置是否有问题。

  

（5）正式安装

直接执行目录下`install.sh`脚本

```shell
# cd /opt/harbor
# ./install.sh
```

看到如下输出表示安装完成。

```shell
[Step 5]: starting Harbor ...
Creating network "harbor_harbor" with the default driver
Creating harbor-log ... done
Creating redis         ... done
Creating registry      ... done
Creating registryctl   ... done
Creating harbor-portal ... done
Creating harbor-db     ... done
Creating harbor-core   ... done
Creating harbor-jobservice ... done
Creating nginx             ... done
✔ ----Harbor has been installed and started successfully.----
```

然后就可以访问了，如下。

![image.png](assets/kubernetes与云原生/harbor_在云原生中使用-附安装/harbor_在云原生中使用-附安装-19.png)

  

#### 03 在线安装Harbor

在线安装和离线安装唯一的区别就是在线安装需要从网上自己下载镜像。 依然按照第一步装好必要的基本软件。

  

然后下载在线安装包。

```shell
# wget https://github.com/goharbor/harbor/releases/download/v2.1.1/harbor-online-installer-v2.1.1.tgz
```

  

然后按照离线安装的第2、第3步骤安装即可。

  

#### 04 Helm Chart

（1）安装helm3

helm安装在master节点。

```shell
# wget https://get.helm.sh/helm-v3.0.0-linux-amd64.tar.gz
# tar zxvf helm-v3.0.0-linux-amd64.tar.gz
# mv linux-amd64/helm /usr/bin/
# helm version
```

（2）添加Harbor仓库

```shell
# helm repo add harbor https://helm.goharbor.io
```

（3）查看helm版本，并下载

```shell
# helm search repo harbor
NAME         	CHART VERSION	APP VERSION	DESCRIPTION                                       
harbor/harbor	1.5.1        	2.1.1      	An open source trusted cloud native registry th...

# helm pull harbor/harbor --version 1.5.1
# tar xf harbor-1.5.1.tgz
```

（4）进入harbor目录，可以看到如下文件以及目录

```shell
# cd harbor/
# ll
total 128
drwxr-xr-x  2 root root  4096 Nov 13 14:07 cert
-rwxr-xr-x  1 root root   576 Oct 30 10:48 Chart.yaml
drwxr-xr-x  2 root root  4096 Nov 13 14:07 conf
-rwxr-xr-x  1 root root 11357 Oct 30 10:48 LICENSE
-rwxr-xr-x  1 root root 72587 Oct 30 10:48 README.md
drwxr-xr-x 15 root root  4096 Nov 13 14:07 templates
-rwxr-xr-x  1 root root 25467 Oct 30 10:48 values.yaml

```

（5）修改values.yaml配置文件

主要修改地方如下：

```shell
......
  ingress:
    hosts:
      core: harbor.coolops.cn
      notary: notary.coolops.cn
......
externalURL: https://harbor.coolops.cn
......
harborAdminPassword: "Harbor12345"
```

> 关于持久化存储，如果自己配置storageclass，就在values.yaml中对应填上名字，如果让起自动创建的话，则默认使用集群default的存储

  

（6）安装harbor

```shell
# helm install harbor ./harbor
NAME: harbor
LAST DEPLOYED: Fri Nov 13 14:21:06 2020
NAMESPACE: default
STATUS: deployed
REVISION: 1
TEST SUITE: None
NOTES:
Please wait for several minutes for Harbor deployment to complete.
Then you should be able to visit the Harbor portal at https://harbor.coolops.cn
For more details, please visit https://github.com/goharbor/harbor

```

查看部署情况

```shell
# helm list
NAME  	NAMESPACE	REVISION	UPDATED                                	STATUS  	CHART       	APP VERSION
harbor	default  	1       	2020-11-13 14:21:06.555605312 +0800 CST	deployed	harbor-1.5.1	2.1.1      
```

然后等待所有pod变成running，就可以通过Ingress访问了。

  

  

  

  

  

  

![Snipaste_2020-11-12_20-19-11.png](assets/kubernetes与云原生/harbor_在云原生中使用-附安装/harbor_在云原生中使用-附安装-20.png)![Snipaste_2020-11-12_20-19-46.png](assets/kubernetes与云原生/harbor_在云原生中使用-附安装/harbor_在云原生中使用-附安装-21.png)![Snipaste_2020-11-12_20-24-12.png](assets/kubernetes与云原生/harbor_在云原生中使用-附安装/harbor_在云原生中使用-附安装-22.png)![Snipaste_2020-11-12_20-26-55.png](assets/kubernetes与云原生/harbor_在云原生中使用-附安装/harbor_在云原生中使用-附安装-23.png)![Snipaste_2020-11-12_20-27-02.png](assets/kubernetes与云原生/harbor_在云原生中使用-附安装/harbor_在云原生中使用-附安装-24.png)![Snipaste_2020-11-12_20-30-52.png](assets/kubernetes与云原生/harbor_在云原生中使用-附安装/harbor_在云原生中使用-附安装-25.png)![Snipaste_2020-11-12_20-32-01.png](assets/kubernetes与云原生/harbor_在云原生中使用-附安装/harbor_在云原生中使用-附安装-26.png)![Snipaste_2020-11-12_20-34-55.png](assets/kubernetes与云原生/harbor_在云原生中使用-附安装/harbor_在云原生中使用-附安装-27.png)![Snipaste_2020-11-12_20-37-26.png](assets/kubernetes与云原生/harbor_在云原生中使用-附安装/harbor_在云原生中使用-附安装-28.png)![Snipaste_2020-11-12_20-40-10.png](assets/kubernetes与云原生/harbor_在云原生中使用-附安装/harbor_在云原生中使用-附安装-29.png)![Snipaste_2020-11-12_20-43-19.png](assets/kubernetes与云原生/harbor_在云原生中使用-附安装/harbor_在云原生中使用-附安装-30.png)![Snipaste_2020-11-12_20-44-21.png](assets/kubernetes与云原生/harbor_在云原生中使用-附安装/harbor_在云原生中使用-附安装-31.png)![Snipaste_2020-11-12_20-47-51.png](assets/kubernetes与云原生/harbor_在云原生中使用-附安装/harbor_在云原生中使用-附安装-32.png)![Snipaste_2020-11-12_20-50-52.png](assets/kubernetes与云原生/harbor_在云原生中使用-附安装/harbor_在云原生中使用-附安装-33.png)![Snipaste_2020-11-12_20-53-32.png](assets/kubernetes与云原生/harbor_在云原生中使用-附安装/harbor_在云原生中使用-附安装-34.png)![Snipaste_2020-11-12_20-54-55.png](assets/kubernetes与云原生/harbor_在云原生中使用-附安装/harbor_在云原生中使用-附安装-35.png)![Snipaste_2020-11-12_20-55-04.png](assets/kubernetes与云原生/harbor_在云原生中使用-附安装/harbor_在云原生中使用-附安装-36.png)![Snipaste_2020-11-12_20-57-49.png](assets/kubernetes与云原生/harbor_在云原生中使用-附安装/harbor_在云原生中使用-附安装-37.png)![Snipaste_2020-11-12_20-59-16.png](assets/kubernetes与云原生/harbor_在云原生中使用-附安装/harbor_在云原生中使用-附安装-38.png)![Snipaste_2020-11-12_21-00-15.png](assets/kubernetes与云原生/harbor_在云原生中使用-附安装/harbor_在云原生中使用-附安装-39.png)![Snipaste_2020-11-12_21-01-30.png](assets/kubernetes与云原生/harbor_在云原生中使用-附安装/harbor_在云原生中使用-附安装-40.png)![Snipaste_2020-11-12_21-04-25.png](assets/kubernetes与云原生/harbor_在云原生中使用-附安装/harbor_在云原生中使用-附安装-41.png)![Snipaste_2020-11-12_21-06-44.png](assets/kubernetes与云原生/harbor_在云原生中使用-附安装/harbor_在云原生中使用-附安装-42.png)![Snipaste_2020-11-12_21-09-36.png](assets/kubernetes与云原生/harbor_在云原生中使用-附安装/harbor_在云原生中使用-附安装-43.png)![Snipaste_2020-11-12_21-10-47.png](assets/kubernetes与云原生/harbor_在云原生中使用-附安装/harbor_在云原生中使用-附安装-44.png)![Snipaste_2020-11-12_21-13-02.png](assets/kubernetes与云原生/harbor_在云原生中使用-附安装/harbor_在云原生中使用-附安装-45.png)![Snipaste_2020-11-12_21-13-53.png](assets/kubernetes与云原生/harbor_在云原生中使用-附安装/harbor_在云原生中使用-附安装-46.png)![Snipaste_2020-11-12_21-17-38.png](assets/kubernetes与云原生/harbor_在云原生中使用-附安装/harbor_在云原生中使用-附安装-47.png)