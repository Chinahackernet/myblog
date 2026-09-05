# 引言

NodeLocal DNSCache 通过在集群节点上作为 DaemonSet 运行 dns 缓存代理来提高集群 DNS 性能。 在当今的体系结构中，处于 ClusterFirst DNS 模式的 Pod 可以连接到 kube-dns serviceIP 进行 DNS 查询。 通过 kube-proxy 添加的 iptables 规则将其转换为 kube-dns/CoreDNS 端点。 借助这种新架构，Pods 将可以访问在同一节点上运行的 dns 缓存代理，从而避免了 iptables DNAT 规则和连接跟踪。 本地缓存代理将查询 kube-dns 服务以获取集群主机名的缓存缺失（默认为 cluster.local 后缀）。

  

# 动机

-   使用当前的 DNS 体系结构，如果没有本地 kube-dns/CoreDNS 实例，则具有最高 DNS QPS 的 Pod 可能必须延伸到另一个节点。 在这种脚本下，拥有本地缓存将有助于改善延迟。
-   跳过 iptables DNAT 和连接跟踪将有助于减少 [conntrack 竞争](https://github.com/kubernetes/kubernetes/issues/56903)并避免 UDP DNS 条目填满 conntrack 表。
-   从本地缓存代理到 kube-dns 服务的连接可以升级到 TCP 。 TCP conntrack 条目将在连接关闭时被删除，相反 UDP 条目必须超时([默认](https://www.kernel.org/doc/Documentation/networking/nf_conntrack-sysctl.txt) `nf_conntrack_udp_timeout` 是 30 秒)
-   将 DNS 查询从 UDP 升级到 TCP 将减少归因于丢弃的 UDP 数据包和 DNS 超时的尾部等待时间，通常长达 30 秒（3 次重试+ 10 秒超时）。
-   在节点级别对 dns 请求的度量和可见性。
-   可以重新启用负缓存，从而减少对 kube-dns 服务的查询数量。

  

# 架构

启用 NodeLocal DNSCache 之后，这是 DNS 查询所遵循的路径：

![](assets/kubernetes与云原生/Kubernetes_集群中使用_NodeLocal_DNSCache/Kubernetes_集群中使用_NodeLocal_DNSCache-1.jpeg)

  

# 配置

可以使用以下命令启用此功能：

`KUBE_ENABLE_NODELOCAL_DNS=true go run hack/e2e.go -v --up`

这适用于在 GCE 上创建 e2e 集群。 在所有其他环境上，以下步骤将设置 NodeLocal DNSCache ：

-   可以使用 `kubectl create -f` 命令应用类似于[这个](https://github.com/kubernetes/kubernetes/blob/master/cluster/addons/dns/nodelocaldns/nodelocaldns.yaml)的 Yaml 。
-   需要修改 kubelet 的 –cluster-dns 标志以使用 NodeLocal DNSCache 正在侦听的 LOCAL\_DNS IP（默认为 169.254.20.10 ）

启用后，node-local-dns Pods 将在每个集群节点上的 kube-system 名称空间中运行。 此 Pod 在缓存模式下运行 [CoreDNS](https://github.com/coredns/coredns) ，因此每个节点都可以使用不同插件公开的所有 CoreDNS 指标。