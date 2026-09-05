#### Kubernetes中强制删除Pod、namespace

#### 解决方法

-   可使用kubectl中的强制删除命令

  

```plain
# 删除POD
kubectl delete pod PODNAME --force --grace-period=0
# 删除NAMESPACE
kubectl delete namespace NAMESPACENAME --force --grace-period=0
```

-   若以上方法无法删除，可使用第二种方法，直接从ETCD中删除源数据

  

```plain
# 删除default namespace下的pod名为pod-to-be-deleted-0
ETCDCTL_API=3 etcdctl del /registry/pods/default/pod-to-be-deleted-0
# 删除需要删除的NAMESPACE
etcdctl del /registry/namespaces/NAMESPACENAME
```

  

  

kubernetes 有时候在K8S中删除一个 namespace 会卡住，强制删除也没用，前面我们介绍了可以去 etcd 里面去删除对应的数据，这种方式比较暴力，除此之外我们也可以通过 API 去删除。

  

首先执行如下命令开启 API 代理：

```yaml
kubectl proxy
```

  

然后在另外一个终端中执行如下所示的命令：(将 monitoring 替换成你要删除的 namespace 即可)

```yaml
kubectl get namespace monitoring -o json | jq 'del(.spec.finalizers[] | select("kubernetes"))' | curl -s -k -H "Content-Type: application/json" -X PUT -o /dev/null --data-binary @- http://localhost:8001/api/v1/namespaces/monitoring/finalize
```

  

如果这样还是不行，就手动去edit namespace，如下：

```bash
 kubectl edit ns <NAMESPACE> -o json
```

然后找到里面的`"finalizers"`，把它的值设置成一个空数组。