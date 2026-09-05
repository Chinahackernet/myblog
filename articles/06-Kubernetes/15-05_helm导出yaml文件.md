# helm导出yaml文件

> 分类：Kubernetes / 第15章：helm
> 原文：https://www.cuiliangblog.cn/detail/section/125656555
> 来源：崔亮的博客

---

有时候，我们需要导出yaml分析yaml编写情况，而不是直接部署到k8s，这个时候，就需要使用template来实现了

# 拉取charts包
```bash
[root@k8s-master ~]# cd /opt/k8s
[root@k8s-master k8s]# helm pull nfs-subdir-external-provisioner/nfs-subdir-external-provisioner --untar
[root@k8s-master k8s]# ls
nfs-subdir-external-provisioner 
```

# 创建存放yaml文件的目录
```bash
[root@k8s-master ~]# mkdir -p /opt/k8s/nfs
[root@k8s-master opt]# cd /opt/k8s/
[root@k8s-master k8s]# ls
nfs-subdir-external-provisioner    nfs
```

# 渲染导出
```bash
[root@k8s-master k8s]# helm template nfs-subdir-external-provisioner --output-dir /opt/k8s/nfs-yaml/
wrote /opt/k8s/nfs-yaml//nfs-subdir-external-provisioner/templates/serviceaccount.yaml
wrote /opt/k8s/nfs-yaml//nfs-subdir-external-provisioner/templates/storageclass.yaml
wrote /opt/k8s/nfs-yaml//nfs-subdir-external-provisioner/templates/clusterrole.yaml
wrote /opt/k8s/nfs-yaml//nfs-subdir-external-provisioner/templates/clusterrolebinding.yaml
wrote /opt/k8s/nfs-yaml//nfs-subdir-external-provisioner/templates/role.yaml
wrote /opt/k8s/nfs-yaml//nfs-subdir-external-provisioner/templates/rolebinding.yaml
wrote /opt/k8s/nfs-yaml//nfs-subdir-external-provisioner/templates/deployment.yaml

[root@k8s-master k8s]# cd nfs-yaml/nfs-subdir-external-provisioner/templates/
[root@k8s-master templates]# ls
clusterrolebinding.yaml  clusterrole.yaml  deployment.yaml  rolebinding.yaml  role.yaml  serviceaccount.yaml  storageclass.yaml
```


