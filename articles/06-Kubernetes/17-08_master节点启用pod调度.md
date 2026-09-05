# master节点启用pod调度

> 分类：Kubernetes / 第17章：日常维护
> 原文：https://www.cuiliangblog.cn/detail/section/15290568
> 来源：崔亮的博客

---

> 默认情况下，出于安全原因，您的群集不会在控制节点上调度Pod。如果您希望能够在控制平面节点上调度Pod，例如用于单机Kubernetes集群进行开发时，可通过如下操作取消污点。
>

# 查询master节点污点
例如我们master节点名称为k8s-master，通过如下名称查询污点名称

```bash
[root@k8s-master ~]# kubectl describe nodes k8s-master | grep Taints
Taints:             node-role.kubernetes.io/control-plane:NoSchedule
```

通过查询可知，k8s-master节点污点为node-role.kubernetes.io/master:NoSchedule

# 取消master节点污点
通过kubectl taint node 节点名称 污点-命令即可取消污点。

```bash
[root@k8s-master ~]# kubectl taint node k8s-master node-role.kubernetes.io/control-plane:NoSchedule-
node/k8s-master untainted
```


