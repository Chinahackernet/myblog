# kubectl多集群管理

> 分类：Kubernetes / 第17章：日常维护
> 原文：https://www.cuiliangblog.cn/detail/section/175557663
> 来源：崔亮的博客

---

> 通过 `kubectl` 连接k8s集群时，默认情况下，`kubectl` 会在 `$HOME/.kube` 目录下查找名为 `config` 的文件，如果root用户登录的、`config`配置文件路径为 `~/.kube/config`，文件内容如下：
>

```yaml
apiVersion: v1
clusters:
- cluster:
    certificate-authority-data: XXX
    server: https://192.168.10.150:6443
  name: kubernetes # 集群名称，和contexts里面的cluster对应
contexts:
- context:
    cluster: kubernetes
    user: kubernetes-admin
  name: kubernetes-admin@kubernetes 
current-context: kubernetes-admin@kubernetes # 上下文名称，与contexts里面的name对应
kind: Config
preferences: {}
users:
- name: kubernetes-admin # 用户名称，和contexts里面的user对应
  user:
    client-certificate-data: XXX
    client-key-data: XXX
```

# 修改config文件
为了便于管理和区分不同的集群，我们需要对所有集群的配置文件内容进行修改，主要修改的内容有：集群、上下文、用户信息。

## config文件传输至跳板机或操作节点
```bash
[root@tiaoban ~]# mkdir -p $HOME/.kube
[root@tiaoban .kube]# scp master1:/root/.kube/config config1
config                                                                                                                                               100% 5650     5.4MB/s   00:00    
[root@tiaoban .kube]# scp k8s-master:/root/.kube/config config2
config                                                                                                                                               100% 5641     4.8MB/s   00:00    
[root@tiaoban .kube]# ls
config1  config2
```

## 修改config1文件
修改config文件时，用户名、集群名称、上下文名称不能相同，否则合并后会出现问题。

```yaml
apiVersion: v1
clusters:
- cluster:
    certificate-authority-data: XXX
    server: https://192.168.10.150:6443
  name: k8s-ha # 修改集群名称
contexts:
- context:
    cluster: k8s-ha # 修改集群名称
    user: ha-admin # 修改用户名
  name: ha-admin@k8s-ha # 修改上下文名称
current-context: ha-admin@k8s-ha # 修改上下文名称
kind: Config
preferences: {}
users:
- name: ha-admin # 修改用户名
  user:
    client-certificate-data: XXX
    client-key-data: XXX
```

## 修改config2文件
```yaml
apiVersion: v1
clusters:
- cluster:
    certificate-authority-data: XXX
    server: https://192.168.10.10:6443
  name: k8s-test # 修改集群名称
contexts:
- context:
    cluster: k8s-test # 修改集群名称
    user: test-admin # 修改用户名
  name: test-admin@k8s-test # 修改上下文名称
current-context: test-admin@k8s-test # 修改上下文名称
kind: Config
preferences: {}
users:
- name: test-admin # 修改用户名
  user:
    client-certificate-data: XXX
    client-key-data: XXX
```

## 合并config文件
```yaml
[root@tiaoban .kube]# KUBECONFIG=config1:config2 kubectl config view --flatten > $HOME/.kube/config
[root@tiaoban .kube]# cat config # 此时发现已经合并为一个config文件
# 修改权限
[root@tiaoban .kube]# chown $(id -u):$(id -g) $HOME/.kube/config
[root@tiaoban .kube]# chmod 600 config
[root@tiaoban .kube]# kubectl config view 
apiVersion: v1
clusters:
- cluster:
    certificate-authority-data: DATA+OMITTED
    server: https://192.168.10.150:6443
  name: k8s-ha
- cluster:
    certificate-authority-data: DATA+OMITTED
    server: https://192.168.10.10:6443
  name: k8s-test
contexts:
- context:
    cluster: k8s-ha
    user: ha-admin
  name: ha-admin@k8s-ha
- context:
    cluster: k8s-test
    user: test-admin
  name: test-admin@k8s-test
current-context: ha-admin@k8s-ha
kind: Config
preferences: {}
users:
- name: ha-admin
  user:
    client-certificate-data: DATA+OMITTED
    client-key-data: DATA+OMITTED
- name: test-admin
  user:
    client-certificate-data: DATA+OMITTED
    client-key-data: DATA+OMITTED
```

## 添加环境变量
```bash
[root@tiaoban ~]# echo "export KUBECONFIG=/root/.kube/config" >> ~/.bash_profile
[root@tiaoban ~]# source ~/.bash_profile
```

# 多集群切换
## 获取全局上下文
```bash
[root@tiaoban .kube]# kubectl config get-contexts
CURRENT   NAME                  CLUSTER    AUTHINFO     NAMESPACE
*         ha-admin@k8s-ha       k8s-ha     ha-admin     
          test-admin@k8s-test   k8s-test   test-admin 
```

## 获取当前上下文
```bash
[root@tiaoban .kube]# kubectl config current-context
ha-admin@k8s-ha
[root@tiaoban .kube]# kubectl get node
NAME      STATUS   ROLES           AGE    VERSION
master1   Ready    control-plane   285d   v1.27.6
master2   Ready    control-plane   285d   v1.27.6
master3   Ready    control-plane   285d   v1.27.6
work1     Ready    <none>          285d   v1.27.6
work2     Ready    <none>          285d   v1.27.6
work3     Ready    <none>          285d   v1.27.6
```

## 切换当前上下文
```bash
[root@tiaoban .kube]# kubectl config use-context test-admin@k8s-test
Switched to context "test-admin@k8s-test".
[root@tiaoban .kube]# kubectl get node
NAME         STATUS   ROLES                  AGE   VERSION
k8s-master   Ready    control-plane,master   21h   v1.23.17
k8s-work1    Ready    <none>                 20h   v1.23.17
k8s-work2    Ready    <none>                 20h   v1.23.17
```


