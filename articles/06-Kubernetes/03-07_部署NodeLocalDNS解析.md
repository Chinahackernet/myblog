# 部署NodeLocalDNS解析

> 分类：Kubernetes / 第3章：周边组件安装部署
> 原文：https://www.cuiliangblog.cn/detail/section/231697223
> 来源：崔亮的博客

---

# <font style="color:rgb(0, 0, 0);">介绍</font>
## <font style="color:rgb(0, 0, 0);">什么是 NodeLocalDNS</font>
`NodeLocal DNSCache` 是一套 DNS 本地缓存解决方案。NodeLocal DNSCache 通过在集群节点上运行一个 DaemonSet 来提高集群 DNS 性能和可靠性。

## <font style="color:rgb(0, 0, 0);">为什么需要 NodeLocalDNS</font>
当Pod中的程序请求域名时，相关的解析是由CoreDNS来处理的。因此，在集群处于较大规模的情况下，相关的请求也将非常多，这导致CoreDNS会面临较大的处理压力，从而出现部分请求超时的情况。

## <font style="color:rgb(0, 0, 0);">NodeLocalDNS 原理</font>
处于 ClusterFirst 的 DNS 模式下的 Pod 可以连接到 kube-dns 的 serviceIP 进行 DNS 查询，通过 kube-proxy 组件添加的 iptables 规则将其转换为 CoreDNS 端点，最终请求到 CoreDNS Pod。

通过在每个集群节点上运行 DNS 缓存，`NodeLocal DNSCache` 可以缩短 DNS 查找的延迟时间、使 DNS 查找时间更加一致，以及减少发送到 kube-dns 的 DNS 查询次数。

![](assets/06-Kubernetes/15d69a9d05cfa62b7e02.svg)

## NodeLocal DNSCache好处
+ 如果本地没有 CoreDNS 实例，则具有最高 DNS QPS 的 Pod 可能必须到另一个节点进行解析，使用 `NodeLocal DNSCache` 后，拥有本地缓存将有助于改善延迟
+ 跳过 iptables DNAT 和连接跟踪将有助于减少 conntrack 竞争并避免 UDP DNS 条目填满 conntrack 表（上面提到的 5s 超时问题就是这个原因造成的）
+ 从本地缓存代理到 kube-dns 服务的连接可以升级到 TCP，TCP conntrack 条目将在连接关闭时被删除，而 UDP 条目必须超时(默认 `nfconntrackudp_timeout` 是 30 秒)
+ 将 DNS 查询从 UDP 升级到 TCP 将减少归因于丢弃的 UDP 数据包和 DNS 超时的尾部等待时间，通常长达 30 秒（3 次重试+ 10 秒超时）

# <font style="color:rgb(0, 0, 0);">NodeLocalDNS 部署</font>
## 获取资源清单
<font style="color:rgb(0, 0, 0);">直接获取官方的资源清单即可安装，文档链接：</font>[https://github.com/kubernetes/kubernetes/tree/master/cluster/addons/dns/nodelocaldns](https://github.com/kubernetes/kubernetes/tree/master/cluster/addons/dns/nodelocaldns)<font style="color:rgb(0, 0, 0);">：</font>

```bash
# wget -c https://raw.githubusercontent.com/kubernetes/kubernetes/master/cluster/addons/dns/nodelocaldns/nodelocaldns.yaml
```

## 配置<font style="color:rgb(0, 0, 0);">NodeLocalDNS</font>
该资源清单文件中包含几个变量，各自含义如下：

+ `__PILLAR__DNS__DOMAIN__`：表示集群域，默认为 `cluster.local`，它是用于解析 Kubernetes 集群内部服务的域名后缀。
+ `__PILLAR__LOCAL__DNS__`：表示 DNSCache 本地的 IP，也就是 NodeLocalDNS 要使用的 IP，默认为 169.254.20.10
+ _`_PILLAR__DNS__SERVER__` ：表示 kube-dns 这个 Service 的 ClusterIP，一般默认为 10.96.0.10。通过`kubectl get svc -n kube-system -l k8s-app=kube-dns -o jsonpath='{$.items[*].spec.clusterIP}'` 命令获取

下面两个变量则不需要关心，NodeLocalNDS Pod 会自动配置，对应的值来源于 kube-dns 的 ConfigMap 和定制的 `Upstream Server` 配置。直接执行如下所示的命令即可安装：

+ `__PILLAR__CLUSTER__DNS__`： 表示集群内查询的上游 DNS 服务器，一般也指向 kube-dns 的 service IP，默认为 10.96.0.10。
+ `__PILLAR__UPSTREAM__SERVERS__`：表示为外部查询的上游服务器，如果没有专门的自建 DNS 服务的话，也可以填 kube-dns 的 service ip。

接下来先设置变量值：

```bash
 # kubedns=`kubectl get svc kube-dns -n kube-system -o jsonpath={.spec.clusterIP}`
 # domain=cluster.local
 # localdns=169.254.20.10
 # echo kubedns=$kubedns, domain=$domain, localdns=$localdns
kubedns=10.96.0.10, domain=cluster.local, localdns=169.254.20.10
```

需要注意的是：根据 kube-proxy 运行模式不同，要替换的参数也不同，使用以下命令查看 kube-proxy 所在模式

```bash
# kubectl -n kube-system get cm kube-proxy -oyaml|grep mode
mode: ipvs
```

如果 kube-proxy 在 iptables 模式下运行, 则运行以下命令更新资源清单。

```plain
# cp nodelocaldns.yaml nodelocaldns-iptables.yaml
# sed -i "s/__PILLAR__LOCAL__DNS__/$localdns/g;
        s/__PILLAR__DNS__DOMAIN__/$domain/g;
        s/__PILLAR__DNS__SERVER__/$kubedns/g" nodelocaldns-iptables.yaml
```

> node-local-dns Pod 会设置 `PILLAR__CLUSTER__DNS` 和 `PILLAR__UPSTREAM__SERVERS`。
>

如果 kube-proxy 在 ipvs 模式下运行, 则运行以下命令更新资源清单。

```plain
# cp nodelocaldns.yaml nodelocaldns-ipvs.yaml
# sed -i "s/__PILLAR__LOCAL__DNS__/$localdns/g;
        s/__PILLAR__DNS__DOMAIN__/$domain/g;
        s/,__PILLAR__DNS__SERVER__//g;
        s/__PILLAR__CLUSTER__DNS__/$kubedns/g" nodelocaldns-ipvs.yaml
```

> node-local-dns Pod 会设置 `PILLAR__UPSTREAM__SERVERS`
>

然后就是将替换后的 yaml apply 到集群里：

```bash
# kubectl apply -f nodelocaldns-ipvs.yaml                  
serviceaccount/node-local-dns created
service/kube-dns-upstream created
configmap/node-local-dns created
daemonset.apps/node-local-dns created
service/node-local-dns created
```

创建完成后，就能看到每个节点上都运行了一个 pod

```bash
# kubectl -n kube-system get pod -l k8s-app=node-local-dns -o wide
NAME                   READY   STATUS    RESTARTS   AGE   IP              NODE    NOMINATED NODE   READINESS GATES
node-local-dns-6cvvf   1/1     Running   0          57s   192.168.10.13   k8s-3   <none>           <none>
node-local-dns-djph9   1/1     Running   0          57s   192.168.10.11   k8s-1   <none>           <none>
node-local-dns-llgbn   1/1     Running   0          57s   192.168.10.14   k8s-4   <none>           <none>
node-local-dns-zm4jx   1/1     Running   0          57s   192.168.10.12   k8s-2   <none>           <none>
```

> 需要注意的是这里使用 DaemonSet 部署 node-local-dns 使用了 hostNetwork=true，会占用宿主机的 `8080` 端口，所以需要保证该端口未被占用。
>

# <font style="color:rgb(0, 0, 0);">NodeLocalDNS 使用</font>
上一步部署好 NodeLocal DNSCache，但是还差了很重要的一步，配置pod使用 NodeLocal DNSCache 作为优先的DNS服务器。

## 方式一：修改 kubelet 参数
kubelet 通过`--cluster-dns`和`--cluster-domain` 两个参数来全局控制 Pod DNSConfig。

+ cluster-dns：部署 Pod 时，默认采用的 DNS 服务器地址，默认只引用了`kube-dns`的 ServiceIP，需要增加一个 NodeLocalDNS 的 169.254.20.10 。
+ cluster-domain：部署 Pod 时，默认采用的 DNS 搜索域，保持原有搜索域即可，一般为`cluster.local`。

```bash
vi /etc/default/kubelet (默认不存在该文件，需要新增创建）
# 增加 --cluster-dns
KUBELET_EXTRA_ARGS="--cluster-dns=169.254.20.10 --cluster-dns=10.96.0.10 --cluster-domain=cluster.local"
```

然后重启 kubelet 使其生效

```bash
systemctl daemon-reload
systemctl restart kubelet
```

## 方式二：自定义 Pod dnsConfig
通过 dnsConfig 字段自定义Pod的dns配置，nameservers 中除了指定 NodeLocalDNS 之外还指定了 KubeDNS，这样即使 NodeLocalDNS 异常也不影响 Pod 中的 DNS 解析。

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: alpine
  namespace: default
spec:
  containers:
  - image: alpine
    command:
      - sleep
      - "10000"
    imagePullPolicy: Always
    name: alpine
  dnsPolicy: None
  dnsConfig:
    nameservers: ["169.254.20.10","10.96.0.10"]
    searches:
    - default.svc.cluster.local
    - svc.cluster.local
    - cluster.local
    options:
    - name: ndots
      value: "3"
    - name: attempts
      value: "2"
    - name: timeout
      value: "1"
```

+ dnsPolicy：必须为`None`。
+ nameservers：配置成 169.254.20.10 和 kube-dns 的 ServiceIP 地址。
+ searches：设置搜索域，保证集群内部域名能够被正常解析。
+ ndots：默认为 5，可以适当降低 ndots 以提升解析效率。

## <font style="color:rgb(0, 0, 0);">方式三：Webhook 自动注入 dnsConfig</font>
<font style="color:rgb(1, 1, 1);">借助 DNSConfig 动态注入控制器在 Pod 创建时配置 DNSConfig 自动注入，需要自己开发一个 webhook，相当于把方式二自动化了，此处不过多介绍。 </font>

<font style="color:rgb(1, 1, 1);"></font>






