# 部署Calico网络组件

> 分类：Kubernetes / 第3章：周边组件安装部署
> 原文：https://www.cuiliangblog.cn/detail/section/15188793
> 来源：崔亮的博客

---

> flannel和calico部署其中一个即可，如果要部署calico的话，先卸载flannel。
>

# Calico 介绍
## 什么是 Calico
Calico 是一个云原生网络和网络安全解决方案，主要为 Kubernetes、OpenShift、Docker、裸机等环境提供：

+ 容器网络通信（CNI 插件）
+ 网络安全策略（NetworkPolicy）
+ 高性能、可扩展的 L3 路由网络

Calico 的核心特点是：

+ 基于 纯三层（L3）路由，不依赖 overlay（封装）网络。
+ 使用 BGP（Border Gateway Protocol） 或 VXLAN/IP-in-IP 进行跨节点路由。
+ 内置 网络策略（NetworkPolicy） 支持，且功能比 K8s 原生更丰富（GlobalNetworkPolicy 等）。
+ 可以和 Kubernetes 原生 CNI 直接集成，也可单独用作安全策略引擎（Policy-only 模式）。

## 为什么使用 Calico
Kubernetes 需要一个 CNI 插件来实现 Pod 之间的通信，而 Calico 解决了以下问题：

1. 跨节点通信  
Pod 之间的 IP 不会重叠，Calico 通过 BGP 或隧道让跨节点 Pod 能直接通信。
2. 网络安全控制  
支持 Kubernetes `NetworkPolicy`，并扩展了全局策略、基于命名空间隔离、基于 DNS 的规则等。
3. 高性能  
直接路由模式不依赖 VXLAN 等封装时，网络性能接近原生（尤其是低延迟场景）。
4. 可扩展性强  
支持云、公有云混合部署，以及多集群（通过 BGP peer）。

## Calico 与 Flannel 对比
| 特性 | **Calico** | **Flannel** |
| --- | --- | --- |
| **网络模型** | L3 路由 + 可选 VXLAN/IP-in-IP 封装 | 主要用 VXLAN/host-gw |
| **性能** | 路由模式接近物理网络性能，延迟低 | VXLAN 有额外封装开销，性能较低 |
| **网络策略** | 支持 Kubernetes NetworkPolicy + Calico 自定义策略 | 原生不支持网络策略（需搭配其他插件） |
| **可扩展性** | 支持 BGP，可与外部网络路由器集成 | 局限于 Kubernetes 集群内部 |
| **部署复杂度** | 稍高，需要理解 BGP/VXLAN 配置 | 简单，适合入门部署 |
| **应用场景** | 高性能、需要安全策略、与物理网络互通的场景 | 简单集群，性能要求不高，无策略需求 |


## 使用 Calico 的好处
1. 性能高
    - 如果用纯路由模式（no encapsulation），数据包不封装，延迟低，吞吐高。
2. 支持丰富的网络策略
    - 支持 L3/L4/L7 规则、基于 DNS 的访问控制、命名空间全局策略等。
3. 可与物理网络无缝集成
    - BGP 模式可以直接和物理路由器、交换机交互，实现跨集群、跨机房通信。
4. 灵活的网络模式
    - 路由、VXLAN、IP-in-IP 可自由选择，适应不同环境（云上、裸机、混合云）。
5. 多用途
    - 不只是容器 CNI，也可做虚拟机网络、裸机网络、云网络安全策略控制。
6. 可观测性强
    - 提供流量监控、策略日志等功能，方便排查网络问题。

# Calico 部署
## 版本选择
不同的k8s版本对应不同的calico版本，详情查看文档：[https://docs.tigera.io/calico/latest/getting-started/kubernetes/requirements](https://docs.tigera.io/calico/latest/getting-started/kubernetes/requirements)。

我的 k8s 版本是 1.30，支持的 calico 版本是 3.29。

![](assets/06-Kubernetes/234e94508b2d6544dbdc.png)

安装部署参考文档：[https://docs.tigera.io/calico/3.29/getting-started/kubernetes/self-managed-onprem/onpremises#install-calico](https://docs.tigera.io/calico/3.29/getting-started/kubernetes/self-managed-onprem/onpremises#install-calico)

## 安装部署
1. <font style="color:rgb(26, 32, 44);">在集群上安装 Operator。</font>

```bash
kubectl create -f https://raw.githubusercontent.com/projectcalico/calico/v3.29.3/manifests/tigera-operator.yaml
```

2. <font style="color:rgb(26, 32, 44);">下载配置 Calico 所需的自定义资源。</font>

```bash
curl https://raw.githubusercontent.com/projectcalico/calico/v3.29.3/manifests/custom-resources.yaml -O
```

3. <font style="color:rgb(26, 32, 44);">自定义 Calico 安装配置文件。</font>

```yaml
# This section includes base Calico installation configuration.
# For more information, see: https://docs.tigera.io/calico/latest/reference/installation/api#operator.tigera.io/v1.Installation
apiVersion: operator.tigera.io/v1
kind: Installation
metadata:
  name: default
spec:
  # Configures Calico networking.
  calicoNetwork:
    ipPools:
    - name: default-ipv4-ippool
      blockSize: 26
      cidr: 10.244.0.0/16 # 替换成kubeadm-conf定义的pod地址段
      encapsulation: VXLANCrossSubnet
      natOutgoing: Enabled
      nodeSelector: all()

---

# This section configures the Calico API server.
# For more information, see: https://docs.tigera.io/calico/latest/reference/installation/api#operator.tigera.io/v1.APIServer
apiVersion: operator.tigera.io/v1
kind: APIServer
metadata:
  name: default
spec: {}
```

4. <font style="color:rgb(26, 32, 44);">创建清单以安装 Calico。</font>

```plain
kubectl create -f custom-resources.yaml -n kube-system
```

5. <font style="color:rgb(26, 32, 44);">验证集群中的 Calico 安装。</font>

```bash
# kubectl get pods -n calico-system -o wide                             
NAME                                       READY   STATUS              RESTARTS        AGE     IP              NODE    NOMINATED NODE   READINESS GATES
calico-kube-controllers-7d7fc6dd7b-z4vdf   1/1     Running             2 (4m19s ago)   6m53s   10.244.0.9      k8s-1   <none>           <none>
calico-node-4w2f7                          1/1     Running             0               6m54s   192.168.10.12   k8s-2   <none>           <none>
calico-node-6xk25                          1/1     Running             0               6m54s   192.168.10.13   k8s-3   <none>           <none>
calico-node-86ptr                          1/1     Running             0               6m54s   192.168.10.11   k8s-1   <none>           <none>
calico-node-tqh98                          1/1     Running             0               6m54s   192.168.10.14   k8s-4   <none>           <none>
calico-typha-8549c67788-cnnlp              1/1     Running             0               6m46s   192.168.10.13   k8s-3   <none>           <none>
calico-typha-8549c67788-lb5jb              1/1     Running             0               6m54s   192.168.10.14   k8s-4   <none>           <none>
csi-node-driver-j9shz                      2/2     Running             0               6m54s   10.244.0.8      k8s-2   <none>           <none>
csi-node-driver-kwfcb                      2/2     Running             0               6m54s   10.244.0.8      k8s-4   <none>           <none>
csi-node-driver-rlwb9                      2/2     Running             0               6m54s   10.244.0.8      k8s-3   <none>           <none>
csi-node-driver-vkm68                      2/2     Running             0               6m54s   10.244.0.8      k8s-1   <none>           <none>
```


