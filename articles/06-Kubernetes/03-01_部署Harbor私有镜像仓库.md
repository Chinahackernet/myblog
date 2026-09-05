# 部署Harbor私有镜像仓库

> 分类：Kubernetes / 第3章：周边组件安装部署
> 原文：https://www.cuiliangblog.cn/detail/section/15189547
> 来源：崔亮的博客

---

# 部署 Harbor（docker-compose）
## 下载软件包
1. 安装docker
2. 安装docker-compose
3. 下载harbor离线安装包  
[github仓库软件包下载地址](https://github.com/goharbor/harbor/releases)

```bash
[root@opt ~]# wget https://github.com/goharbor/harbor/releases/download/v2.12.2/harbor-offline-installer-v2.12.2.tgz
[root@opt ~]# tar -xvf harbor-offline-installer-v2.12.2.tgz 
```

## http方式
复制配置文件并修改

```bash
[root@harbor ~]# cp harbor.yml.tmpl harbor.yml
[root@harbor ~]# vim harbor.yml
# 设置域名
hostname: harbor.local.com
# 注释https相关配置
# http related config
http:
  # port for http, default is 80. If https enabled, this port will redirect to https port
  port: 80

# https related config
#https:
  # https port for harbor, default is 443
  #port: 443
  # The path of cert and key files for nginx
  #certificate: /your/certificate/path
  #private_key: /your/private/key/path
```

## https方式(建议)
**<font style="color:rgb(51, 51, 51);">生成自签名证书</font>**

这里我们使用[https://github.com/Fishdrowned/ssl](https://github.com/Fishdrowned/ssl)提供的shell脚本生成ssl证书，<font style="color:rgb(31, 35, 40);">证书有效期是 2 年，可以修改 </font><font style="color:rgb(31, 35, 40);">ca.cnf</font><font style="color:rgb(31, 35, 40);"> 来修改这个年限。</font>

```bash
# 克隆项目
[root@tiaoban opt]# git clone https://github.com/Fishdrowned/ssl.git
# 一键生成证书
[root@tiaoban opt]# cd ssl
[root@tiaoban ssl]# ./gen.cert.sh harbor.local.com # 生成harbor.local.com域名的证书
Removing dir out
Creating output structure
Done
Generating a RSA private key
...................................+++++
....+++++
writing new private key to 'out/root.key.pem'
-----
Generating RSA private key, 2048 bit long modulus (2 primes)
.............+++++
....................................+++++
e is 65537 (0x010001)
Using configuration from ./ca.cnf
Check that the request matches the signature
Signature ok
The Subject's Distinguished Name is as follows
countryName           :PRINTABLE:'CN'
stateOrProvinceName   :ASN.1 12:'Guangdong'
localityName          :ASN.1 12:'Guangzhou'
organizationName      :ASN.1 12:'Fishdrowned'
organizationalUnitName:ASN.1 12:'harbor.local.com'
commonName            :ASN.1 12:'*.harbor.local.com
Certificate is to be certified until Aug 12 10:49:02 2025 GMT (730 days)

Write out database with 1 new entries
Data Base Updated

Certificates are located in:
lrwxrwxrwx 1 root root 43 8月  13 18:49 /opt/ssl/out/harbor.local.com/harbor.local.com.bundle.crt -> ./20230813-1849/harbor.local.com.bundle.crt
lrwxrwxrwx 1 root root 36 8月  13 18:49 /opt/ssl/out/harbor.local.com/harbor.local.com.crt -> ./20230813-1849/harbor.local.com.crt
lrwxrwxrwx 1 root root 15 8月  13 18:49 /opt/ssl/out/harbor.local.com/harbor.local.com.key.pem -> ../cert.key.pem
lrwxrwxrwx 1 root root 11 8月  13 18:49 /opt/ssl/out/harbor.local.com/root.crt -> ../root.crt

# 查看证书文件
[root@tiaoban ssl]# cd out/harbor.local.com/
[root@tiaoban harbor.local.com]# ll
总用量 0
drwxr-xr-x 2 root root 101 8月  13 18:49 20230813-1849
lrwxrwxrwx 1 root root  43 8月  13 18:49 harbor.local.com.bundle.crt -> ./20230813-1849/harbor.local.com.bundle.crt
lrwxrwxrwx 1 root root  36 8月  13 18:49 harbor.local.com.crt -> ./20230813-1849/harbor.local.com.crt
lrwxrwxrwx 1 root root  15 8月  13 18:49 harbor.local.com.key.pem -> ../cert.key.pem
lrwxrwxrwx 1 root root  11 8月  13 18:49 root.crt -> ../root.crt

# 拷贝证书至harbor目录
[root@tiaoban harbor.local.com]# cp harbor.local.com.crt /opt/harbor/
[root@tiaoban harbor.local.com]# cp harbor.local.com.key.pem /opt/harbor/
```

浏览器信任自签证书可参考：[https://github.com/Fishdrowned/ssl/blob/master/docs/chrome-trust.md](https://github.com/Fishdrowned/ssl/blob/master/docs/chrome-trust.md)

**修改配置文件**

```bash
[root@harbor ~]# cp harbor.yml.tmpl harbor.yml
[root@harbor ~]# vim harbor.yml
# 设置域名
hostname: harbor.local.com
# 注释http相关配置
# http related config
# http:
  # port for http, default is 80. If https enabled, this port will redirect to https port
  # port: 80

# https related config
https:
  # https port for harbor, default is 443
  port: 443
  # The path of cert and key files for nginx
  certificate: /opt/harbor/harbor.local.com.crt 
  private_key: /opt/harbor/harbor.local.com.key.pem
data_volume: /data/harbor
```

## 执行安装脚本
运行install.sh脚本

```bash
[root@harbor  harbor]# ./install.sh 
[Step 5]: starting Harbor ...
[+] Building 0.0s (0/0)                                                                                                                                            
[+] Running 10/10
 ✔ Network harbor_harbor        Created                                                                                                                       0.3s 
 ✔ Container harbor-log         Started                                                                                                                       1.8s 
 ✔ Container harbor-portal      Started                                                                                                                      12.8s 
 ✔ Container registry           Started                                                                                                                      13.1s 
 ✔ Container redis              Started                                                                                                                      13.2s 
 ✔ Container registryctl        Started                                                                                                                      11.4s 
 ✔ Container harbor-db          Started                                                                                                                      12.0s 
 ✔ Container harbor-core        Started                                                                                                                      14.3s 
 ✔ Container nginx              Started                                                                                                                      18.2s 
 ✔ Container harbor-jobservice  Started                                                                                                                      18.1s 
✔ ----Harbor has been installed and started successfully.----
```

## 访问Harbor并登录
![](assets/06-Kubernetes/d950ac7dc9e4c856973a.png)

+ 初始用户名admin
+ 初始密码Harbor12345

## systemd服务管理
```bash

vim /lib/systemd/system/harbor.service
[Unit]
Description=Harbor
After=docker.service systemd-networkd.service systemd-resolved.service
Requires=docker.service
Documentation=http://github.com/vmware/harbor

[Service]
Type=simple
Restart=on-failure
RestartSec=5
ExecStart=/usr/local/bin/docker-compose -f /opt/harbor/docker-compose.yml up
ExecReload=/usr/local/bin/docker-compose -f /opt/harbor/docker-compose.yml restart
ExecStop=/usr/local/bin/docker-compose -f /opt/harbor/docker-compose.yml down

[Install]
WantedBy=multi-user.target


systemctl enable harbor --now
```

# 部署 Harbor（Helm）
部署 helm 可参考文档：[03-02_%E9%83%A8%E7%BD%B2Helm%E5%8C%85%E7%AE%A1%E7%90%86%E5%B7%A5%E5%85%B7.md](articles/06-Kubernetes/03-02_部署Helm包管理工具.md)

部署 localpath 存储可参考文档：[03-08_%E9%83%A8%E7%BD%B2LocalPathProvisioner%E6%9C%AC%E5%9C%B0%E5%AD%98%E5%82%A8.md](articles/06-Kubernetes/03-08_部署LocalPathProvisioner本地存储.md)

部署 ingress 可参考文档：[03-03_%E9%83%A8%E7%BD%B2Ingress-nginx%E4%BB%A3%E7%90%86.md](articles/06-Kubernetes/03-03_部署Ingress-nginx代理.md)

helm 方式部署 harbor 参考文档：[https://github.com/goharbor/harbor-helm](https://github.com/goharbor/harbor-helm)

## 获取 charts 包
```bash
# helm pull harbor/harbor --untar                           
# ls
anaconda-ks.cfg  harbor  ingress-nginx  kubeadm-conf.yaml  kube-flannel.yml  kube-prometheus  tls
# cd harbor 
# ls
Chart.yaml  LICENSE  README.md  templates  values.yaml
```

## 自定义 values
官方提供四种方式暴露Harbor service：

+ Ingress: 借助Ingress暴露服务，K8S集群中已经部署ingress nginx controller。
+ ClusterIP: 使用ClusterIP暴露服务，只能在集群内部进行访问。
+ NodePort: 使用NodePort暴露服务，通过NodeIP:NodePort进行访问。
+ LoadBalancer: 使用云供应商提供的LB进行访问。

此处以ingress暴露服务为例，配置如下：

```bash
# vim values.yaml
# ingress配置
expose:
  tls:
    enabled: true # 开启tls证书
    certSource: secret # 使用自定义证书
    secret:
      secretName: "ingress-tls" # 证书名称
  ingress:
    hosts:
      harbor.cuiliangblog.cn # 自定义域名
    className: "nginx" # 对应 ingressclass
# 自定义域名
externalURL: https://harbor.cuiliangblog.cn
# harbor管理员密码
harborAdminPassword: "CHANGE_ME"
# 配置pvc持久化存储
persistence:
  persistentVolumeClaim:
    registry:
      storageClass: "local-path"
    jobservice
      storageClass: "local-path"
    database:
      storageClass: "local-path"
    redis:
      storageClass: "local-path"
    trivy:
      storageClass: "local-path"
```

## 创建 tls 证书
```bash
# kubectl create ns harbor                    
namespace/harbor created
# ls
cuiliangblog.cn.crt  cuiliangblog.cn.key.pem
# kubectl create secret tls ingress-tls \
  --cert=cuiliangblog.cn.crt \
  --key=cuiliangblog.cn.key.pem \
  -n harbor
secret/ingress-tls created
```

## 部署 harbor
```bash
# helm install harbor . -n harbor  
NAME: harbor
LAST DEPLOYED: Sun Feb  8 12:42:57 2026
NAMESPACE: harbor
STATUS: deployed
REVISION: 1
TEST SUITE: None
NOTES:
Please wait for several minutes for Harbor deployment to complete.
Then you should be able to visit the Harbor portal at https://harbor.cuiliangblog.cn
For more details, please visit https://github.com/goharbor/harbor
```

## 访问验证
```bash
# kubectl get pod -n harbor        
NAME                                 READY   STATUS    RESTARTS   AGE
harbor-core-7597bf6d88-xdb88         1/1     Running   0          99s
harbor-database-0                    1/1     Running   0          2m57s
harbor-jobservice-659989959d-qrq2p   1/1     Running   0          41s
harbor-portal-59944bcfd-z4ghp        1/1     Running   0          2m57s
harbor-redis-0                       1/1     Running   0          2m57s
harbor-registry-8579db74b6-h6n5k     2/2     Running   0          2m57s
harbor-trivy-0                       1/1     Running   0          2m57s
# kubectl get pvc -n harbor 
NAME                              STATUS   VOLUME                                     CAPACITY   ACCESS MODES   STORAGECLASS   VOLUMEATTRIBUTESCLASS   AGE
data-harbor-redis-0               Bound    pvc-b7ac6cf9-d661-4601-a029-860ab45e8849   1Gi        RWO            local-path     <unset>                 60m
data-harbor-trivy-0               Bound    pvc-54b34b93-800a-4ef6-92ed-e655d90df3b4   5Gi        RWO            local-path     <unset>                 60m
database-data-harbor-database-0   Bound    pvc-ece4b566-52cb-492c-b80e-df32014c35c3   1Gi        RWO            local-path     <unset>                 60m
harbor-jobservice                 Bound    pvc-5db2dd5a-5725-4062-a123-26cbf1de96e7   1Gi        RWO            local-path     <unset>                 60m
harbor-registry                   Bound    pvc-5e3ba624-555a-45b0-ac86-186e484c574d   5Gi        RWO            local-path     <unset>                 60m
# kubectl get ingress -n harbor
NAME             CLASS   HOSTS                    ADDRESS   PORTS     AGE
harbor-ingress   nginx   harbor.cuiliangblog.cn             80, 443   61m
```

绑定 hosts 后访问harbor.cuiliangblog.cn 验证

![](assets/06-Kubernetes/06cb1106b8cf13b879bb.png)

# 授权访问
## docker授权访问


1. docker配置文件私有仓库设置  
`[root@master  ~]# vim /etc/docker/daemon.json ` 

```json
{
    "registry-mirrors": [
        "https://mirror.ccs.tencentyun.com",
        "https://o2j0mc5x.mirror.aliyuncs.com"
    ],
    "insecure-registries": [
        "https://harbor.local.com"
    ]
}
```

2. 重启docker  
`systemctl daemon-reload`   
`systemctl restart docker` 
3. master节点登陆测试

```bash
[root@tiaoban ~]# docker login harbor.local.com -u admin
Password: CHANGE_ME
Configure a credential helper to remove this warning. See
https://docs.docker.com/engine/reference/commandline/login/#credentials-store

Login Succeeded
```

4. 推送镜像测试

```bash
[root@tiaoban ~]# docker pull busybox
Using default tag: latest
latest: Pulling from library/busybox
5cc84ad355aa: Pull complete 
Digest: sha256:5acba83a746c7608ed544dc1533b87c737a0b0fb730301639a0179f9344b1678
Status: Downloaded newer image for busybox:latest
docker.io/library/busybox:latest
[root@tiaoban ~]# docker tag busybox:latest harbor.local.com/library/busybox:latest
[root@tiaoban ~]# docker push harbor.local.com/library/busybox:latest
The push refers to repository [harbor.local.com/library/busybox]
01fd6df81c8e: Pushed 
latest: digest: sha256:62ffc2ed7554e4c6d360bce40bbcf196573dd27c4ce080641a2c59867e732dee size: 527
```

## Containerd授权访问
1. 修改配置文件

```bash
[root@master1 ~]# mkdir -p /etc/containerd/certs.d/harbor.local.com
[root@master1 ~]# cat > /etc/containerd/certs.d/harbor.local.com/hosts.toml << EOF
server = "https://harbor.local.com"
[host."https://harbor.local.com"]
  capabilities = ["pull", "resolve", "push"]
  skip_verify = true
EOF
```

2. 确保 containerd 加载配置文件

```bash
# 修改container配置，指定registry配置从文件读取
[root@k8s-master ~]# vim /etc/containerd/config.toml
    [plugins."io.containerd.grpc.v1.cri".registry]
      config_path = "/etc/containerd/certs.d" # 添加配置文件地址
```

3. 重启containerd

```bash
[root@master1 ~]# systemctl restart containerd 
```

4. 登录测试

```bash
[root@master1 ~]# nerdctl login -u admin -p Harbor12345 --insecure-registry harbor.local.com
WARN[0000] WARNING! Using --password via the CLI is insecure. Use --passwordCHANGE_ME 
WARN[0000] skipping verifying HTTPS certs for "harbor.local.com" 
WARNING: Your password will be stored unencrypted in /root/.docker/config.json.
Configure a credential helper to remove this warning. See
https://docs.docker.com/engine/reference/commandline/login/#credentials-store

Login Succeeded
```

4. 推送镜像测试

```bash
[root@master1 ~]# nerdctl pull busybox
[root@master1 ~]# nerdctl tag busybox:latest harbor.local.com/library/busybox:latest
[root@master1 ~]# nerdctl push --insecure-registry harbor.local.com/library/busybox:latest
```

## kubernets授权访问
> 由于harbor采用了用户名密码认证，所以在镜像下载时，如果仓库类型为私有，则需要配置sercet才可以拉取镜像。
>

1. 创建认证secret

```yaml
kubectl create secret docker-registry registry-secret --namespace=default --docker-server=harbor.local.com --docker-username=admin --docker-passwordCHANGE_ME CHANGE_ME
```

2. 查看secret

```yaml
# kubectl get secrets 
NAME              TYPE                             DATA   AGE
registry-secret   kubernetes.io/dockerconfigjson   1      9s
```

3. 使用相应的私有registry中镜像的Pod资源的定义，即可通过imagePullSecrets字段使用此Secret对象

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: your-deploy
spec:
  template:
    spec:
      imagePullSecrets:
        - name: registry-secret
```

# 

