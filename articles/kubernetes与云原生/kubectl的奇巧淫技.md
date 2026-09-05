以下文章来源于[崔秀龙](https://blog.fleeto.us/)的博客，文章地址：[https://blog.fleeto.us/post/tips-for-kubectl/](https://blog.fleeto.us/post/tips-for-kubectl/)

---

原文：[Ready-to-use commands and tips for kubectl](https://medium.com/flant-com/kubectl-commands-and-tips-7b33de0c5476)

作者：[Flant staff](https://medium.com/@flant_com)

  

Kubectl 是 Kubernetes 最重要的命令行工具。在 Flant，我们会在 Wiki 和 Slack 上相互分享 Kubectl 的妙用（其实我们还有个搜索引擎，不过那就是另外一回事了）。多年以来，我们在 kubectl 方面积累了很多技巧，现在想要将其中的部分分享给社区。

我相信很多读者对这些命令都非常熟悉；然而我还是希望读者能够从本文中有所获益，进而提高生产力。

> 下列内容有的是来自我们的工程师，还有的是来自互联网。我们对后者也进行了测试，并且确认其有效性。

现在开始吧。

## 获取 Pod 和节点

（1）、我猜你知道如何获取 Kubernetes 集群中所有 Namespace 的 Pod——使用 --all-namepsaces 就可以。然而不少朋友还不知道，现在这一开关还有了 -A 的缩写。

  

（2）、如何查找非 running 状态的 Pod 呢？

```bash
kubectl get pods -A --field-selector=status.phase!=Running | grep -v Complete
```

顺便一说，--field-selector 是个[值得深入](https://kubernetes.io/docs/concepts/overview/working-with-objects/field-selectors/)一点的参数。

  

（3）、如何获取节点列表及其内存容量：

```bash
kubectl get no -o json | \
  jq -r '.items | sort_by(.status.capacity.memory)[]|[.metadata.name,.status.capacity.memory]| @tsv'
```

  

（4）、获取节点列表，其中包含运行在每个节点上的 Pod 数量：

```bash
kubectl get po -o json --all-namespaces | \
  jq '.items | group_by(.spec.nodeName) | map({"nodeName": .[0].spec.nodeName, "count": length}) | sort_by(.count)'
```

  

（5）、有时候 DaemonSet 因为某种原因没能在某个节点上启动。手动搜索会有点麻烦：

```bash
$ ns=my-namespace
$ pod_template=my-pod
$ kubectl get node | grep -v \"$(kubectl -n ${ns} get pod --all-namespaces -o wide | fgrep ${pod_template} | awk '{print $8}' | xargs -n 1 echo -n "\|" | sed 's/[[:space:]]*//g')\"
```

  

（6）、使用 kubectl top 获取 Pod 列表并根据其消耗的 CPU 或 内存进行排序：

```bash
# cpu
$ kubectl top pods -A | sort --reverse --key 3 --numeric
# memory
$ kubectl top pods -A | sort --reverse --key 4 --numeric
```

  

（7）、获取 Pod 列表，并根据重启次数进行排序：

```bash
kubectl get pods –sort-by=.status.containerStatuses[0].restartCount
```

当然也可以使用 [PodStatus](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.18/#podstatus-v1-core) 以及 [ContainerStatus](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.18/#containerstatus-v1-core) 的其它字段进行排序。

  

## 获取其它数据

（1）、运行 Ingress 时，经常要获取 Service 对象的 selector 字段，用来查找 Pod。过去要打开 Service 的清单才能完成这个任务，现在使用 -o wide 参数也可以：

```bash
$ kubectl -n jaeger get svc -o wide
NAME                            TYPE        CLUSTER-IP        EXTERNAL-IP   PORT(S)                                  AGE   SELECTOR
jaeger-cassandra                ClusterIP   None              <none>        9042/TCP                                 77d   app=cassandracluster,cassandracluster=jaeger-cassandra,cluster=jaeger-cassandra
```

  

（2）、如何输出 Pod 的 requests 和 limits：

```bash
$ kubectl get pods -A -o=custom-columns='NAME:spec.containers[*].name,MEMREQ:spec.containers[*].resources.requests.memory,MEMLIM:spec.containers[*].resources.limits.memory,CPUREQ:spec.containers[*].resources.requests.cpu,CPULIM:spec.containers[*].resources.limits.cpu'
NAME                                  MEMREQ       MEMLIM        CPUREQ   CPULIM
coredns                               70Mi         170Mi         100m     <none>
coredns                               70Mi         170Mi         100m     <none>
...
```

  

（3）、kubectl run（以及 create、apply、patch）命令有个厉害的参数 --dry-run，该参数让用户无需真正操作集群就能观察集群的行为，如果配合 -o yaml，就能输出命令对应的 YAML：

```bash
$ kubectl run test --image=grafana/grafana --dry-run -o yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  creationTimestamp: null
  labels:
    run: test
  name: test
spec:
  replicas: 1
  selector:
    matchLabels:
      run: test
```

  

简单的把输出内容保存到文件，删除无用字段就可以使用了。

> 1.18 开始 kubectl run 生成的是 Pod 而非 Deployment。

  

（4）、获取指定资源的描述清单：

```bash
kubectl explain hpa
KIND:     HorizontalPodAutoscaler
VERSION:  autoscaling/v1
DESCRIPTION:
     configuration of a horizontal pod autoscaler.
FIELDS:
   apiVersion    <string>
...
```

## 网络

（1）、获取集群节点的内部 IP：

```bash
$ kubectl get nodes -o json | jq -r '.items[].status.addresses[]? | select (.type == "InternalIP") | .address' | \
  paste -sd "\n" -
9.134.14.252
```

  

（2）、获取所有的 Service 对象以及其 nodePort：

```bash
$ kubectl get -A svc -o json | jq -r '.items[] | [.metadata.name,([.spec.ports[].nodePort | tostring ] | join("|"))]| @tsv'
kubernetes  null
...
```

  

（3）、在排除 CNI（例如 Flannel）故障的时候，经常会需要检查路由来识别故障 Pod。Pod 子网在这里非常有用：

```bash
$ kubectl get nodes -o jsonpath='{.items[*].spec.podCIDR}' | tr " " "\n"                                                            fix-doc-azure-container-registry-config  ✭
10.120.0.0/24
10.120.1.0/24
10.120.2.0/24
```

## 日志

（1）、使用可读的时间格式输出日志：

```bash
$ kubectl logs -f fluentbit-gke-qq9w9  -c fluentbit --timestamps
2020-09-10T13:10:49.822321364Z Fluent Bit v1.3.11
2020-09-10T13:10:49.822373900Z Copyright (C) Treasure Data
2020-09-10T13:10:49.822379743Z
2020-09-10T13:10:49.822383264Z [2020/09/10 13:10:49] [ info] Configuration:
```

  

（2）、只输出尾部日志：

```bash
kubectl logs -f fluentbit-gke-qq9w9  -c fluentbit --tail=10
[2020/09/10 13:10:49] [ info] ___________
[2020/09/10 13:10:49] [ info]  filters:
[2020/09/10 13:10:49] [ info]      parser.0
...
```

  

（3）、输出一个 Pod 中所有容器的日志：

```bash
kubectl -n my-namespace logs -f my-pod –all-containers
```

  

（4）、使用标签选择器输出多个 Pod 的日志：

```bash
kubectl -n my-namespace logs -f -l app=nginx
```

  

（5）、获取“前一个”容器的日志（例如崩溃的情况）：

```bash
kubectl -n my-namespace logs my-pod –previous
```

  

## 其它

（1）、把 Secret 复制到其它命名空间：

```bash
kubectl get secrets -o json --namespace namespace-old | \
  jq '.items[].metadata.namespace = "namespace-new"' | \
  kubectl create-f  -
```

  

（2）、下面两个命令可以生成一个用于测试的自签发证书：

```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout tls.key -out tls.crt -subj "/CN=grafana.mysite.ru/O=MyOrganization"
kubectl -n myapp create secret tls selfsecret --key tls.key --cert tls.crt
```

## 相关链接

本文没什么结论，但是可以提供一个小列表，其中包含本文相关的有用链接。

1.  Kubernetes 官方文档：[https://kubernetes.io/docs/reference/kubectl/cheatsheet/](https://kubernetes.io/docs/reference/kubectl/cheatsheet/)  
    
2.  Linux Academy 的入门参考：[https://linuxacademy.com/blog/containers/kubernetes-cheat-sheet/](https://linuxacademy.com/blog/containers/kubernetes-cheat-sheet/)  
    
3.  Blue Matador 分类整理的命令列表：[https://www.bluematador.com/learn/kubectl-cheatsheet](https://www.bluematador.com/learn/kubectl-cheatsheet)  
    
4.  另一个命令指南，部分内容和本文重复：[https://gist.github.com/pydevops/0efd399befd960b5eb18d40adb68ef83](https://gist.github.com/pydevops/0efd399befd960b5eb18d40adb68ef83)  
    
5.  kubectl 别名搜集：[https://github.com/ahmetb/kubectl-aliases](https://github.com/ahmetb/kubectl-aliases)