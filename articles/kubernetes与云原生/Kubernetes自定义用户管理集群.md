我们通过如下命令可以看到当前Kubernetes集群的管理用户是什么：

  

```yaml
[root@master ssl]# kubectl config view 
apiVersion: v1
clusters:
- cluster:
    certificate-authority-data: DATA+OMITTED
    server: https://172.16.1.128:6443
  name: cluster1
contexts:
- context:
    cluster: cluster1
    user: admin
  name: context-cluster1-admin
- context:
    cluster: kubernetes
    namespace: kube-system
    user: joker
  name: joker-context
current-context: context-cluster1-admin
kind: Config
preferences: {}
users:
- name: admin
  user:
    client-certificate-data: REDACTED
    client-key-data: REDACTED
- name: joker
  user:
    client-certificate: /root/k8s/rbac/joker.crt
    client-key: /root/k8s/rbac/joker.key
```

  

下面我们自定义证书文件，然后自定义用户来作为集群的管理用户：

1、我们用的ca证书还是集群的原有证书，我的证书位置在如下位置：

```yaml
[root@master ssl]# pwd
/etc/kubernetes/ssl
You have new mail in /var/spool/mail/root
[root@master ssl]# ll
total 72
-rw-r--r-- 1 root root 1679 Sep  4 18:17 admin-key.pem
-rw-r--r-- 1 root root 1391 Sep  4 18:17 admin.pem
-rw-r--r-- 1 root root  997 Sep  4 18:22 aggregator-proxy.csr
-rw-r--r-- 1 root root  219 Sep  4 16:54 aggregator-proxy-csr.json
-rw------- 1 root root 1679 Sep  4 18:22 aggregator-proxy-key.pem
-rw-r--r-- 1 root root 1383 Sep  4 18:22 aggregator-proxy.pem
-rw-r--r-- 1 root root  294 Sep  4 16:42 ca-config.json
-rw-r--r-- 1 root root 1679 Sep  4 16:42 ca-key.pem
-rw-r--r-- 1 root root 1350 Sep  4 16:42 ca.pem
-rw-r--r-- 1 root root   17 Sep  9 07:35 ca.srl
-rw-r--r-- 1 root root 1082 Sep  4 18:23 kubelet.csr
-rw-r--r-- 1 root root  281 Sep  4 16:56 kubelet-csr.json
-rw------- 1 root root 1679 Sep  4 18:23 kubelet-key.pem
-rw-r--r-- 1 root root 1448 Sep  4 18:23 kubelet.pem
-rw-r--r-- 1 root root 1265 Sep  4 18:22 kubernetes.csr
-rw-r--r-- 1 root root  466 Sep  4 16:54 kubernetes-csr.json
-rw------- 1 root root 1675 Sep  4 18:22 kubernetes-key.pem
-rw-r--r-- 1 root root 1631 Sep  4 18:22 kubernetes.pem
```

  

2、自定义证书

```bash
# 生成自定义key
# (umask 077; openssl genrsa -out unclejoker.key 2048)
# 生成csr签名请求文件
# openssl req -new -key unclejoker.key -out unclejoker.csr -subj "/CN=unclejoker"
# 用CA证书进行签名
# openssl  x509 -req -days 365 -in unclejoker.csr -CA ca.pem -CAkey ca-key.pem -CAcreateserial -out unclejoker.crt
```

  

3、配置集群config，添加集群（由于我们这里只有一个集群，所以这步不操作）

命令如下：

```bash
# kubectl config set-cluster joker-kubernetes --server=https://172.16.1.128:6443 --certificate-authority=./ca.pem --embed-certs=true
```

  

4、配置集群config，添加用户

命令如下：

```bash
# kubectl config set-credentials unclejoker --client-certificate=./unclejoker.crt --client-key=./unclejoker.key  --embed-certs=true
```

  

5、添加上下文关联contexts，命令如下：

```bash
# kubectl config set-context unclejoker@joker-kubernetes --cluster=joker-kubernetes --user=unclejoker --namespace=default
```

  

到此就配置完成，如果要使用这个用户，则配置current-context

```bash
# kubectl config use-context unclejoker@joker-kubernetes
```

  

这是我们使用kubectl等操作就是在unclejoker用户下执行了。