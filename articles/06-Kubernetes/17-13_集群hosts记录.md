# 集群hosts记录

> 分类：Kubernetes / 第17章：日常维护
> 原文：https://www.cuiliangblog.cn/detail/section/140980525
> 来源：崔亮的博客

---

# pod新增hosts记录
可以在pod资源清单中指定hosts解析记录

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: hostaliases-pod
spec:
  hostAliases:
  - ip: "127.0.0.1"
    hostnames:
    - "foo.local"
    - "bar.local"
  - ip: "10.1.2.3"
    hostnames:
    - "foo.remote"
    - "bar.remote"
  containers:
  - name: cat-hosts
    image: busybox
    command:
    - cat
    args:
    - "/etc/hosts"
```

# coredns新增记录
也可以修改coredns配置，这样集群每个pod都可以解析到自定义hosts记录

```bash
# kubectl edit configmaps -n kube-system coredns
apiVersion: v1
data:
  Corefile: |
    .:53 {
        errors
        health {
           lameduck 5s
        }
        ready
        kubernetes cluster.local in-addr.arpa ip6.arpa {
           pods insecure
           fallthrough in-addr.arpa ip6.arpa
           ttl 30
        }
        # 新增hosts记录
        hosts {
            192.168.10.150 minio-api.local.com 
            fallthrough
        }
        prometheus :9153
        forward . /etc/resolv.conf {
           max_concurrent 1000
        }
        cache 30
        loop
        reload
        loadbalance
    }
```


