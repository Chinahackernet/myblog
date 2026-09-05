# k8s使用ceph-资源部署

> 分类：Ceph / 第2章：Ceph集群部署与k8s使用
> 原文：https://www.cuiliangblog.cn/detail/section/192233002
> 来源：崔亮的博客

---

# 安装客户端
> k8s所有节点都需要安装与ceph服务端一样的客户端版本
>

```bash
查看可安装的ceph客户端版本
root@k8s-1:~# apt-cache madison ceph-common | sort -V
ceph-common | 15.2.1-0ubuntu1 | https://mirrors.aliyun.com/ubuntu focal/main amd64 Packages
ceph-common | 15.2.17-0ubuntu0.20.04.6 | https://mirrors.aliyun.com/ubuntu focal-security/main amd64 Packages
ceph-common | 15.2.17-0ubuntu0.20.04.6 | https://mirrors.aliyun.com/ubuntu focal-updates/main amd64 Packages
ceph-common | 18.2.4-1focal | https://mirrors.ustc.edu.cn/ceph/debian-reef focal/main amd64 Packages
      ceph | 15.2.1-0ubuntu1 | https://mirrors.aliyun.com/ubuntu focal/main Sources
      ceph | 15.2.17-0ubuntu0.20.04.6 | https://mirrors.aliyun.com/ubuntu focal-security/main Sources
      ceph | 15.2.17-0ubuntu0.20.04.6 | https://mirrors.aliyun.com/ubuntu focal-updates/main Sources
# 安装ceph客户端
root@k8s-1:~# apt-get install ceph-common=18.2.4-1focal
```

# 获取配置文件与信息
> <font style="color:rgb(25, 27, 31);">K8S主要通过容器存储接口CSI和Ceph进行交互。参考文档：</font>[https://github.com/ceph/ceph-csi/tree/devel](https://github.com/ceph/ceph-csi/tree/devel)，需要注意k8s与CSI版本对应关系。
>

## 获取配置文件
```bash
root@k8s-1:~/k8s-install# wget https://github.com/ceph/ceph-csi/archive/refs/tags/v3.12.2.tar.gz
root@k8s-1:~/k8s-install# tar -zxf v3.12.2.tar.gz 
root@k8s-1:~/k8s-install# cp -R ceph-csi-3.12.2/charts/ceph-csi-rbd .
root@k8s-1:~/k8s-install# cp -R ceph-csi-3.12.2/charts/ceph-csi-cephfs .
root@k8s-1:~/k8s-install# ls ceph-csi-cephfs 
Chart.yaml  README.md  templates  values.yaml
root@k8s-1:~/k8s-install# ls ceph-csi-rbd   
Chart.yaml  README.md  templates  values.yaml
```

## 查看ceph集群信息
```yaml
# 查看ceph 的fsid，也就是clusterID
root@k8s-1:~# ceph -s |grep id
    id:     1945ab20-95e5-11ef-a379-63253f41bb80
# 查看ceph的monitor服务ip
root@k8s-1:~# ceph mon stat
e3: 3 mons at {k8s-1=[v2:192.168.10.11:3300/0,v1:192.168.10.11:6789/0],k8s-2=[v2:192.168.10.12:3300/0,v1:192.168.10.12:6789/0],k8s-3=[v2:192.168.10.13:3300/0,v1:192.168.10.13:6789/0]} removed_ranks: {} disallowed_leaders: {}, election epoch 18, leader 0 k8s-1, quorum 0,1,2 k8s-1,k8s-2,k8s-3
```

# 部署ceph-csi-rbd
## 修改ceph-csi-rbd配置文件
```yaml
root@k8s-1:~/k8s-install/ceph-csi-rbd# vim values.yaml
csiConfig:
  # clusterID: ceph 集群的 fsid
  - clusterID: 1945ab20-95e5-11ef-a379-63253f41bb80
    # monitor 的地址
    monitors:
      - "192.168.10.11:6789"
      - "192.168.10.11:6789"
      - "192.168.10.11:6789"

CSIDriver:
  seLinuxMount: false # 改为禁用selinux

selinuxMount: false # 改为禁用
```

## 部署ceph-csi-rbd
```bash
root@k8s-1:~/k8s-install/ceph-csi-rbd# helm install ceph-csi-rbd -n ceph-csi-rbd . -f values.yaml --create-namespace 
NAME: ceph-csi-rbd
LAST DEPLOYED: Tue Oct 29 17:54:06 2024
NAMESPACE: ceph-csi-rbd
STATUS: deployed
REVISION: 1
TEST SUITE: None
NOTES:
Examples on how to configure a storage class and start using the driver are here:
https://github.com/ceph/ceph-csi/tree/devel/examples/rbd
root@k8s-1:~/k8s-install/ceph-csi-rbd# kubectl get pod -n ceph-csi-rbd   
NAME                                        READY   STATUS    RESTARTS   AGE
ceph-csi-rbd-nodeplugin-77wm7               3/3     Running   0          12m
ceph-csi-rbd-nodeplugin-dpc5z               3/3     Running   0          12m
ceph-csi-rbd-nodeplugin-ft4mc               3/3     Running   0          12m
ceph-csi-rbd-nodeplugin-nfvtq               3/3     Running   0          12m
ceph-csi-rbd-provisioner-69d56c9945-dl27c   7/7     Running   0          12m
ceph-csi-rbd-provisioner-69d56c9945-kshzq   7/7     Running   0          12m
ceph-csi-rbd-provisioner-69d56c9945-wllzm   7/7     Running   0          12m
```

# 部署ceph-csi-cephfs
## 修改ceph-csi-cephfs配置文件
```yaml
root@k8s-1:~/k8s-install/ceph-csi-cephfs# vim values.yaml
csiConfig: 
  # clusterID: ceph 集群的 fsid
  - clusterID: 1945ab20-95e5-11ef-a379-63253f41bb80
    # monitor 的地址
    monitors:
      - "192.168.10.11:6789"
      - "192.168.10.11:6789"
      - "192.168.10.11:6789"
CSIDriver:
  seLinuxMount: false # 改为禁用selinux
nodeplugin:
  name: nodeplugin
  # 如果使用的是 ceph-fuse 客户端，这个配置要改为 OnDelete
  updateStrategy: RollingUpdate
selinuxMount: false # 改为禁用
```

## 部署ceph-csi-cephfs
```bash
root@k8s-1:~/k8s-install/ceph-csi-rbd# helm install ceph-csi-cephfs -n ceph-csi-cephfs . -f values.yaml --create-namespace 
NAME: ceph-csi-cephfs
LAST DEPLOYED: Tue Oct 29 17:54:06 2024
NAMESPACE: ceph-csi-cephfs
STATUS: deployed
REVISION: 1
TEST SUITE: None
NOTES:
Examples on how to configure a storage class and start using the driver are here:
https://github.com/ceph/ceph-csi/tree/devel/examples/rbd
root@k8s-1:~/k8s-install/ceph-csi-rbd# kubectl get pod -n ceph-csi-cephfs               
NAME                                           READY   STATUS    RESTARTS   AGE
ceph-csi-cephfs-nodeplugin-5ffz9               3/3     Running   0          12m
ceph-csi-cephfs-nodeplugin-gwdhx               3/3     Running   0          12m
ceph-csi-cephfs-nodeplugin-kfqdx               3/3     Running   0          12m
ceph-csi-cephfs-nodeplugin-rgtf9               3/3     Running   0          12m
ceph-csi-cephfs-provisioner-5cbf57b878-2w5nq   5/5     Running   0          12m
ceph-csi-cephfs-provisioner-5cbf57b878-q8wfl   5/5     Running   0          12m
ceph-csi-cephfs-provisioner-5cbf57b878-s72vb   5/5     Running   0          12m
```

# 

