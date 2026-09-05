# apiserver 证书添加 certSANs IP

> 分类：Kubernetes / 第17章：日常维护
> 原文：https://www.cuiliangblog.cn/detail/section/234167957
> 来源：崔亮的博客

---

### 1. 查看当前证书里有哪些 IP
```bash
openssl x509 -in /etc/kubernetes/pki/apiserver.crt -text | grep -A1 "Subject Alternative Name"
```

能看到类似：

```plain
X509v3 Subject Alternative Name: 
    DNS:kubernetes, DNS:kubernetes.default, DNS:kubernetes.default.svc, DNS:kubernetes.default.svc.cluster.local, DNS:miaohua-a-m-79, IP Address:10.96.0.1, IP Address:10.119.118.79
```

### 2. 修改 kubeadm 配置文件
如果你没有保存初始化时的 `kubeadm-config.yaml`，可以先导出：

```plain
kubectl -n kube-system get cm kubeadm-config -o jsonpath='{.data.ClusterConfiguration}' > kubeadm-config.yaml
```

然后编辑：

```plain
vi /etc/kubernetes/kubeadm-config.yaml
```

在 `apiServer.certSANs` 段落里加上新 IP：

```plain
apiServer:
  certSANs:
  - 10.96.0.1
  - 10.119.118.79
  - 10.210.0.19   # 这里就是要加的新 IP
```

### 3. 重新生成 apiserver 证书
```plain
mv /etc/kubernetes/pki/apiserver.{crt,key} /etc/kubernetes/pki/backup/   # 先备份旧证书
kubeadm init phase certs apiserver --config=/etc/kubernetes/kubeadm-config.yaml
```

### 4. 更新 apiserver kubeconfig
```plain
kubeadm init phase kubeconfig all --config=/etc/kubernetes/kubeadm-config.yaml
```

### 5. 重启 kubelet
```plain
systemctl restart kubelet
```

### 6. 验证新证书
```plain
openssl x509 -in /etc/kubernetes/pki/apiserver.crt -text | grep "IP Address"
```

确保新 IP 已经在 SAN 里。


