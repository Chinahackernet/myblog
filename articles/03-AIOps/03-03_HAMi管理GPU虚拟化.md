# HAMi管理GPU虚拟化

> 分类：AIOPS / 第3章：大模型 AI Infra 运维
> 原文：https://www.cuiliangblog.cn/detail/section/276341360
> 来源：崔亮的博客

---

# GPU 虚拟化介绍
## 为什么需要 GPU 虚拟化
+ 卡太贵：一块 A100/H100 要几万到二十几万块，独占浪费不起。
+ 用不满：很多任务只用到一小部分算力和显存，剩下的白白闲置（例如 8B 翻译模型，仅需 8-12G 显存即可，不需要独占一张 A 卡）。
+ 需求不一样：有人要大显存，有人要多算力，得灵活切分才能物尽其用。
+ 多人要共用：一个团队/一家云平台，很多人要同时用，需要安全地分开，互不干扰
+ 方便管理调度：配合 K8s ，GPU 资源能像水电一样"按需分配、用完释放"

总结来说，GPU 虚拟化 = 把一块昂贵又强大的显卡，安全地"切"给多个人同时用，既不浪费，又互不干扰。就像把一个大厨房分给多个厨师，而不是让一个人包场煎鸡蛋。

## 什么是 GPU 虚拟化
GPU 虚拟化（GPU Virtualization）是指通过软件或硬件技术，将一块或多块物理 GPU 抽象、切分或聚合，使其能够被多个用户、多个虚拟机（VM）或多个容器共享使用的技术。

核心目标是打破"一张 GPU 只能被一个进程/系统独占"的限制，实现类似 CPU、内存那样的资源池化与灵活调度。

从虚拟化的粒度上看，主要包括三个层面：

+ 算力（Compute）虚拟化：切分 GPU 的计算单元（SM/CUDA Core），实现多任务并行
+ 显存（Memory）虚拟化：隔离与限制每个用户可用的显存大小
+ 故障隔离（Fault Isolation）：一个任务崩溃不影响其他共享者

## 常见 GPU 虚拟化方案
### 硬件层虚拟化
NVIDIA vGPU（GRID）

+ 通过 Hypervisor（VMware ESXi、KVM、Citrix 等）将物理 GPU 切分为多个 vGPU，分配给不同虚拟机
+ 需要 NVIDIA 授权（License），成熟稳定
+ 适用场景：虚拟桌面（VDI）、云游戏、专业图形工作站

MIG（Multi-Instance GPU，多实例 GPU）

+ A100、H100 等 Ampere 及以后架构的硬件级切分能力
+ 可将一块 GPU 从物理上切分为最多 7 个独立实例，每个实例有独享的算力、显存、缓存和带宽
+ 隔离性最强（硬件级），性能可预测
+ 缺点：切分规格固定，粒度不够灵活

### 内核/驱动层虚拟化（API 拦截 + 时间片）
vCUDA / 时间分片方案

+ 通过拦截 CUDA API 调用，在软件层面实现算力和显存的限制与分配
+ 多任务通过时间片轮转（time-slicing）共享 GPU
+ 代表：NVIDIA MPS（Multi-Process Service） —— 允许多个进程的 Kernel 并发执行，提升利用率
+ 优点：灵活、无需特殊硬件；缺点：隔离性弱于 MIG

### 云原生 / 容器化方案
+ NVIDIA Device Plugin：K8s 中默认按整卡分配 GPU
+ 阿里 cGPU / 腾讯 qGPU：国内云厂商的容器 GPU 共享方案，支持显存和算力的细粒度隔离
+ 第四范式 HAMi（原 k8s-vgpu-scheduler）：开源，支持显存/算力切分与 GPU 共享调度
+ NVIDIA GPU Operator + MIG/MPS/Time-slicing：官方在 K8s 中的共享方案

### 远程 / 池化方案（GPU Pooling）
+ rCUDA、腾讯 GPUManager、趋动科技 OrionX 等
+ 将 GPU 从物理服务器解耦，形成远程 GPU 资源池，通过网络（RDMA 等）供计算节点按需调用
+ 优点：GPU 与 CPU 解耦，资源池化程度最高；缺点：受网络延迟影响

### 方案对比小结
| 方案 | 隔离级别 | 灵活性 | 硬件要求 | 典型场景 |
| --- | --- | --- | --- | --- |
| MIG | 硬件级（最强） | 低（规格固定） | A100/H100+ | 多租户强隔离推理 |
| vGPU | Hypervisor 级 | 中 | 需 License | VDI、虚拟机 |
| MPS / 时间片 | 进程级（弱） | 高 | 无特殊要求 | 高吞吐推理、开发测试 |
| cGPU/qGPU/HAMi | 容器级 | 高 | 无特殊要求 | 云原生、K8s 集群 |
| GPU 池化(OrionX等) | 软件级 | 最高 | 需高速网络 | 大规模资源池 |


### 选型建议
+ 追求强隔离 + 性能确定性 → MIG
+ 虚拟机/桌面场景 → vGPU
+ 提升推理吞吐、开发共享 → MPS / 时间片
+ K8s 云原生平台 → HAMi / cGPU / qGPU
+ 超大规模资源池化 → OrionX 等池化方案

# HAMi 介绍
## HAMi 是什么
HAMi 是一个面向 Kubernetes 的 开源 GPU 虚拟化层。它让 pod 可以精确申请一定量的显存和 AI 加速器的算力，然后把 pod 调度到有足够空闲容量的设备上，并在运行时把它绑定到那个切片上。同一套使用模式覆盖多种加速器，包括 NVIDIA GPU、寒武纪（Cambricon）MLU、海光（Hygon）DCU、昇腾（Ascend）NPU、摩尔线程（Moore Threads）、沐曦（MetaX）等，每种都通过自己的 device plugin 和隔离后端接入。以 NVIDIA 为例，HAMi 会替换原生的 device plugin，并通过在容器内拦截 CUDA 驱动 API 来强制执行显存上限；其他厂商则提供类似的库级或硬件级隔离。

用户体验刻意保持简单：在标准的设备资源请求之外，再加上一个或多个限制项，调度器在调度时读取这些限制，找到一块拥有足够空闲显存和算力资源的卡。在 NVIDIA 上，你继续请求 `nvidia.com/gpu`，并在旁边加上两个扩展资源：`nvidia.com/gpumem` 和 `nvidia.com/gpucores`。

```plain
resources:
  limits:
    nvidia.com/gpu: 1       
    nvidia.com/gpumem: 8000 
    nvidia.com/gpucores: 30
```

## 与 MIG 对比
MIG 画的是一条硬件边界：每个实例都有自己的 SM，以及一条穿过 L2 缓存切片、内存控制器和 DRAM 通道的专属通路。HAMi 的边界是一道栅栏，而不是一堵墙。它的限制在容器内部由软件强制执行，能够可靠地把工作负载约束在各自的预算内，却无法遏制设备级故障：共享卡上一个挂起的进程、一次驱动重置或一个 XID 错误，仍然会波及卡上的每一个租户。不过两者工作在不同的层面，它们可以互补而非竞争；后面我们会回到 HAMi 如何直接驱动 MIG。

## 与时间分片对比
与时间分片（time-slicing） 相比，HAMi 在稳定性上有显著提升。时间分片只是把单张卡宣告成多个可调度的副本，并在计算引擎上交错执行它们的工作负载，既没有按副本的显存上限，也没有隔离。这使得一个工作负载非常容易分配超出其名义份额的显存，并把其他工作负载一起拖垮。HAMi 则会直接拒绝超额分配。下面的日志显示 PyTorch 报告的总容量与 `nvidia.com/gpumem` 设置的 1000 MB 限制一致；当 pod 试图超出限制时，分配器用一个 OOM 错误拦下了它，其他 vGPU 租户不受影响

## POD请求GPU资源流程
HAMi 官方架构包含 Mutating Webhook、Scheduler Extender、Device Plugin 和 HAMi-Core 四个关键部分。

![](assets/03-AIOps/7c28fc2eb6f41660a2a3.png)

一个申请 HAMi GPU 的 Pod 进入集群后，会经过以下过程：

1. Mutating Webhook 识别请求。 它检查 Pod 的 `resources` 是否包含 HAMi 管理的设备资源，并将这类 Pod 交给 `hami-scheduler`。普通 CPU 应用仍然按原有路径调度。
2. HAMi Scheduler 选择节点和物理设备。 它不仅查看 GPU 数量，还维护设备型号、UUID、显存、Core 和已分配份额等信息，根据 binpack 或 spread 策略选择合适位置。
3. 分配结果写入 Pod Annotation。 这些信息记录了 Pod 最终获得哪张物理 GPU 以及多少显存和 Core。
4. Kubelet 调用 HAMi Device Plugin。 Device Plugin 读取已经完成的调度结果，将对应 GPU 设备和环境变量注入容器。
5. HAMi-Core 在容器内执行限额。 NVIDIA 场景中，`libvgpu.so` 通过 `/etc/ld.so.preload` 进入容器，拦截 CUDA 显存申请和 Kernel 启动调用。显存超出配额时返回 OOM，计算份额则通过节流方式执行。

这条链路中，Scheduler 解决“放在哪里”，Device Plugin 解决“把哪张设备交给容器”，HAMi-Core 则负责“容器最多能用多少”。只有调度没有运行时限额，Pod 仍然可能抢占物理卡；只有限额没有调度，Kubernetes 又无法根据剩余显存选择节点。

## HAMi 调度策略
如前所述，调度器首先过滤掉容量不足的节点。对剩下的候选者，HAMi 通过两个相互独立的调度层级确定最优放置：节点级和 GPU 级。目前，HAMi 在每个层级都支持两种主要策略：`binpack`（把任务尽可能密集地打包）和 `spread`（把任务尽可能广泛地分散）。

全局配置

```bash
helm install hami hami-charts/hami \
  --set scheduler.defaultSchedulerPolicy.nodeSchedulerPolicy=binpack \
  --set scheduler.defaultSchedulerPolicy.gpuSchedulerPolicy=spread \
  -n kube-system
```

节点级注解

```bash
# binpack：尽量把任务集中到已用节点，减少碎片
kubectl annotate node node1 hami.io/node-scheduler-policy=binpack

# spread：尽量把任务均匀分布到不同节点
kubectl annotate node node1 hami.io/node-scheduler-policy=spread
```

Pod 级注解（针对单个 Pod，优先级最高）

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: example-pod
  annotations:
    hami.io/node-scheduler-policy: "spread"   # 或 binpack
    hami.io/gpu-scheduler-policy: "binpack"   # 或 spread
spec:
  schedulerName: hami-scheduler
  containers:
  - name: app
    image: nvidia/cuda:11.8.0-runtime-ubuntu22.04
    resources:
      limits:
        nvidia.com/gpu: 1
        nvidia.com/gpumem: 8000
        nvidia.com/gpucores: 50
```

### 节点级策略
在节点级调度中，Binpack 策略会尽可能将工作负载集中部署到少量节点上，最大化节点资源利用率。这种方式能够让集群自动扩缩器（Cluster Autoscaler）快速腾空并回收空闲节点，从而降低基础设施成本。同时对于一些 8 卡模型服务，在扩容过程中也更加方便。

不过，高密度部署也意味着更多工作负载集中在同一节点，一旦节点或 GPU 驱动发生故障，影响范围会更大；同时，GPU、PCIe 和网络等资源竞争也会更加激烈，可用性能余量相对较少。

与之相对，Spread 策略会尽可能将工作负载均匀分布到所有可用节点。这种方式能够降低单节点的资源竞争，为突发流量预留更多资源，同时将故障影响限制在更小的范围内，提升整体可用性。

但其代价是更多节点始终处于运行状态，即使资源利用率较低，也难以被自动扩缩器回收。因此，集群需要长期维持更多的空闲容量，从而增加基础设施成本。

简单来说，Binpack 更侧重资源利用率和成本优化，而 Spread 更侧重性能隔离和高可用性。实际生产环境中，应根据业务特点和成本目标，在两种调度策略之间进行权衡。

### GPU级策略
在 GPU 级调度中，Binpack 策略会优先将工作负载调度到同一张物理 GPU 上，只有当该 GPU 的资源被充分利用后，才会继续使用下一张 GPU。这种策略能够尽可能保留完整空闲的 GPU，便于后续调度需要独占整卡资源的大模型，同时也能最大化 GPU 共享场景下的资源利用率。

不过，其代价是单卡上的工作负载密度更高，GPU 算力、显存带宽等资源竞争更加激烈，更容易出现"吵闹邻居"（Noisy Neighbor）问题；此外，一旦单张 GPU 发生 XID 或硬件故障，该卡上的所有工作负载都会受到影响。

与之相对，Spread 策略会将工作负载尽可能均匀地分布到所有可用 GPU 上。这样可以有效降低单卡上的算力和显存带宽竞争，为延迟敏感型推理任务提供更加稳定的性能，因此更适合在线推理等对响应时间要求较高的场景。  
然而，Spread 也会将空闲显存分散到整个集群，导致显存碎片化。虽然从整体来看，集群可能仍有充足的剩余显存，但由于缺少一张拥有足够连续空闲显存的 GPU，后续需要大量 GPU 资源或整卡资源的大模型任务仍可能无法完成调度。

简单来说，GPU 级 Binpack 更注重资源利用率和整卡资源保留，而 GPU 级 Spread 更注重性能稳定性和资源隔离。实际生产环境中，需要根据推理、训练等不同业务场景，在资源利用率与调度灵活性之间进行权衡。

# HAMi 部署（传统Device Plugin模式）
## 前提条件
+ [Helm](https://helm.sh/zh/docs/) v3+
+ [kubectl](https://kubernetes.io/docs/tasks/tools/install-kubectl/) v1.16+
+ [CUDA](https://developer.nvidia.com/cuda-toolkit) v10.2+
+ [NVIDIA 驱动](https://www.nvidia.cn/drivers/unix/) v440+
+ 已配置nvidia-container-toolkit

## 调整 GPU Operator
### 禁用nvidia-device-plugin
+ HAMi 会部署自己的 `hami-device-plugin`（取代 nvidia-device-plugin）和 `hami-scheduler`，负责把物理 GPU 按显存/算力切分成多个 vGPU 分给 Pod。
+ 如果 GPU Operator 的 device-plugin 和 HAMi 的 device-plugin 同时跑，会抢占同一个 kubelet socket / 资源上报，导致冲突。

### 禁用cdi
+ 从 gpu-operator v25.10 起，CDI（Container Device Interface）默认开启，并且不再把 `nvidia` 设为默认运行时。此时设备注入走 containerd 原生 CDI。
+ HAMi 的 vGPU（显存/算力限制）本来就是基于 legacy 的 nvidia-container-runtime hook 机制设计的，根据 gpu-operator 文档：`cdi.enabled=false` 时，operator 会重新把 `nvidia` 配成默认运行时。

```bash
# cd gpu-operator
# vim values.yaml 
devicePlugin:
  enabled: false
cdi:
  enabled: false
# helm upgrade gpu-operator -n gpu-operator . -f values.yaml
# 查看container runtime，已经从runc 更新为 nvidia
# containerd config dump | grep -i default_runtime_name                        
      default_runtime_name = 'nvidia'
```

## 标记节点
通过添加 "gpu=on" 标签将 GPU 节点标记为可调度 HAMi 任务。未标记的节点将无法被调度器管理。

```bash
kubectl label nodes gai-volcengine-gpu-a800-11 gpu=on
```

## 使用Helm部署
```bash
# helm repo add hami-charts https://project-hami.github.io/HAMi/
# helm pull hami-charts/hami --untar
# cd hami 
# ls
Chart.lock  charts  Chart.yaml  README.md  templates  values.yaml
# vim values.yaml
scheduler:
  kubeScheduler:
    image:
      tag: "v1.30.14" # 与k8s版本保持一致
devicePlugin:
  runtimeClassName: "nvidia" # 默认运行时是 runc（不是 nvidia），而 gpu-operator 建好了名为 nvidia 的 runtimeclass
# helm install hami -n kube-system . -f values.yaml                   
NAME: hami
LAST DEPLOYED: Sat Jul  4 11:52:27 2026
NAMESPACE: kube-system
STATUS: deployed
REVISION: 1
TEST SUITE: None
NOTES:
** Please be patient while the chart is being deployed **
Resource name: nvidia.com/gpu
```

如果 GPU 驱动是主机预装，非 GPU Operator 安装，则安装时需额外指定：

```plain
--set hami-dra.drivers.nvidia.containerDriver=false
```

# HAMi 部署（DRA模式）
具体可参考文档[03-04_K8S_DRA%E5%8A%A8%E6%80%81%E8%B5%84%E6%BA%90%E5%88%86%E9%85%8D.md](articles/03-AIOps/03-04_K8S_DRA动态资源分配.md)

# 使用与验证
## 资源验证
```bash
# 查看pod状态
# kubectl get pod -n kube-system | grep hami
hami-device-plugin-gmnlf                             2/2     Running   0          2m6s
hami-scheduler-64dd45bdc-sjmb6                       2/2     Running   0          2m6s
# 查看节点 gpu 资源
# kubectl describe node gai-volcengine-gpu-a800-11 | grep Allocatable: -A 7             
Allocatable:
  cpu:                128
  ephemeral-storage:  189961905862
  hugepages-1Gi:      0
  hugepages-2Mi:      0
  memory:             2113316640Ki
  nvidia.com/gpu:     80
  pods:               110
```

gai-volcengine-gpu-a800-11 这台节点实际有 8 张 A800 物理 GPU 资源，而HAMi 把一张物理 GPU 按默认配置注册成了多个可分配的 vGPU 份额。HAMi 配置中 `nvidia.deviceSplitCount` 默认值是 `10`，含义是单张 GPU 默认最多允许分配给 10 个任务。所以在机器上看到 `nvidia.com/gpu: 80`。

## 配置监控
添加 serviceMonitor，yaml 文件如下：

```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: hami-device-plugin
  namespace: monitoring   
spec:
  namespaceSelector:
    matchNames:
      - kube-system
  selector:
    matchLabels:
      app.kubernetes.io/component: hami-device-plugin
      app.kubernetes.io/instance: hami
      app.kubernetes.io/name: hami
  endpoints:
    - port: monitorport
      interval: 30s
      path: /metrics
      scheme: http
```

<font style="color:#3f3f3f;">查看 hami 对应的 targets</font>

![](assets/03-AIOps/837a11bc58fb74d3130e.png)

导入 dashboard，链接参考：[https://project-hami.io/zh/docs/userguide/monitoring/grafana-dashboard](https://project-hami.io/zh/docs/userguide/monitoring/grafana-dashboard)

![](assets/03-AIOps/afa91c1d7419dc77606b.png)

# vGPU使用
## 资源字段说明
<font style="color:#333;">HAMi 在 Pod 里主要通过下面几个资源字段控制 GPU 申请：</font>

```yaml
resources:  
  limits:    
    nvidia.com/gpu: 1    
    nvidia.com/gpumem: 3000
    nvidia.com/gpumem-percentage: 50    
    nvidia.com/gpucores: 30
```

### nvidia.com/gpu
申请的 GPU 数量（物理卡的份数）。

+ 值为 `1` 表示这个容器要用到 1 张 GPU（可以是被切分后的一份，不是独占整卡）。
+ 它是「入口」：只有申请了 `nvidia.com/gpu`，下面 `gpumem`/`gpucores` 才生效。
+ 如果申请 `2`，表示要 2 张卡，那 `gpumem`/`gpucores` 是分别应用到每张卡上的。

### nvidia.com/gpumem
给容器分配的 显存，单位 MB。

+ 例子里 `3000` = 每张卡上给这个容器 3000 MiB 显存。
+ HAMi 通过劫持 CUDA 调用做显存硬隔离：容器内 `nvidia-smi` / 程序看到的显存上限就是 3000MB，超了会 OOM，互相不串。
+ 和下面的 `gpumem-percentage` 二选一，不要同时写。

### nvidia.com/gpumem-percentage
给容器分配的 显存百分比，范围 0–100，是 `gpumem` 的「按比例」写法。

+ 比如 A800 单卡 80GB，写 `nvidia.com/gpumem-percentage: 50` = 分 40GB 显存。
+ 用途：不想写死 MB 数、希望「按比例切」时用它，换卡型时不用改数值。
+ 和 `nvidia.com/gpumem` 互斥，同一个容器只能用其中一个来限制显存。

### nvidia.com/gpucores
给容器分配的 算力（SM 计算核心）百分比，范围 0–100。

+ 例子里 `30` = 限制这个容器最多用该 GPU 30% 的算力。
+ 这是「软/时间片」限制：HAMi 通过控制 kernel 提交节奏，把算力大致压在 30% 左右。
+ `0` 或不写通常表示不限制算力（只隔离显存）。
+ 受 values 里 `devicePlugin.disablecorelimit` 影响：如果设为 `"true"`，算力限制会被忽略。

## 注意事项
### 资源字段搭配规则
+ `nvidia.com/gpu` 是前提：不写它，`gpumem`/`gpucores` 全都不生效。
+ 显存二选一：`nvidia.com/gpumem`（MB）和 `nvidia.com/gpumem-percentage`（%）不能同时写，只能用一个。
+ `nvidia.com/gpucores`（算力 %）范围 0–100，不写或 0 一般表示不限算力，只隔离显存。
+ 这些字段写在 `resources.limits` 里即可（HAMi 会当扩展资源处理，不用重复写 requests）。

### 数量与切分的正确理解
+ `nvidia.com/gpu: N` = 用 N 张不同的物理卡，不是从一张卡切 N 份。
+ 多卡时 `gpumem`/`gpucores` 是按每张卡分别应用（总量 = 单卡值 × N）。
+ 想让单个容器用更多资源 → 调大 gpumem/gpucores，而不是加 gpu 数量。
+ `nvidia.com/gpu: N` 要求节点上有 N 张卡各自都有余量，否则调度不上（不会把多份塞进同一张卡）。

### 和集群/切分参数保持一致
+ `deviceSplitCount`：一张物理卡最多切给多少个容器共享——记得确认最终生效值（`kubectl logs` 里的 `--device-split-count`），否则单卡能共享的 Pod 数会和预期不符。
+ 单容器申请的 `gpumem` 不要超过 `单卡显存 × deviceMemoryScaling`，否则永远调度不上。
+ 算力限制受 `devicePlugin.disablecorelimit` 控制：设成 `"true"` 时 `gpucores` 会被忽略。

# 实践案例
## GPU 基础调度
先运行一个基础 GPU，验证HAMi 调度链路和容器内 GPU 可见性。

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: hami-basic
spec:
  selector:
    matchLabels:
      app: hami-basic
  template:
    metadata:
      labels:
        app: hami-basic
    spec:
      containers:
      - name: hami-basic
        image: swr.cn-north-4.myhuaweicloud.com/ddn-k8s/docker.io/nvidia/cuda:13.0.0-devel-ubuntu22.04
        command:
          - sleep
        args:
          - infinity
        resources:
          limits:
            nvidia.com/gpu: 1 # 使用一张 GPU 资源
            nvidia.com/gpumem: 2000 # 最多使用 2000 MB（约 2 GB）显存
            nvidia.com/gpucores: 30 # 最多使用该 GPU 30% 的计算资源
```

访问验证

```bash
# kubectl get pod 
NAME                          READY   STATUS    RESTARTS   AGE
hami-basic-7f8969b958-p9sxv   1/1     Running   0          10s
# kubectl exec -it hami-basic-7f8969b958-p9sxv -- bash
root@hami-basic-7f8969b958-p9sxv:/# nvidia-smi 
Tue Jul 14 07:31:41 2026       
+-----------------------------------------------------------------------------------------+
| NVIDIA-SMI 580.126.20             Driver Version: 580.126.20     CUDA Version: 13.0     |
+-----------------------------------------+------------------------+----------------------+
| GPU  Name                 Persistence-M | Bus-Id          Disp.A | Volatile Uncorr. ECC |
| Fan  Temp   Perf          Pwr:Usage/Cap |           Memory-Usage | GPU-Util  Compute M. |
|                                         |                        |               MIG M. |
|=========================================+========================+======================|
|   0  NVIDIA A800-SXM4-80GB          On  |   00000000:E0:00.0 Off |                    0 |
| N/A   26C    P0             58W /  400W |       0MiB /   2000MiB |      0%      Default |
|                                         |                        |             Disabled |
+-----------------------------------------+------------------------+----------------------+

+-----------------------------------------------------------------------------------------+
| Processes:                                                                              |
|  GPU   GI   CI              PID   Type   Process name                        GPU Memory |
|        ID   ID                                                               Usage      |
|=========================================================================================|
|  No running processes found                                                             |
+-----------------------------------------------------------------------------------------+
```

重点看容器里显示的总显存是否变成了你申请的值。例如这里申请的是 `2000`，那么容器内看到的显存上限为 `2000MiB`。

## GPU 显存共享验证（显存固定分配）
测试 8 卡节点，每张卡显存共 80G，拆分成2 个 40G 显存 pod，理论可运行 16 个 pod。

```yaml
# cat hami-gpumem.yaml      
apiVersion: apps/v1
kind: Deployment
metadata:
  name: hami-gpumem
spec:
  replicas: 16 # 两个 pod 占用一张 GPU 资源,8卡节点共计可以启动 16 个 pod
  selector:
    matchLabels:
      app: hami-gpumem
  template:
    metadata:
      labels:
        app: hami-gpumem
    spec:
      containers:
      - name: hami-gpumem
        image: swr.cn-north-4.myhuaweicloud.com/ddn-k8s/docker.io/nvidia/cuda:13.0.0-devel-ubuntu22.04
        command:
          - sleep
        args:
          - infinity
        resources:
          limits:
            nvidia.com/gpu: 1 # 使用一张 GPU 资源
            nvidia.com/gpumem: 40000 # 最多使用40GB显存
            nvidia.com/gpucores: 50 # 最多使用该 GPU 50% 的计算资源
# kubectl apply -f hami-gpumem.yaml 
deployment.apps/hami-gpumem created

# kubectl get pod
NAME                         READY   STATUS    RESTARTS   AGE
hami-gpumem-8b698578-5dqhb   1/1     Running   0          97s
hami-gpumem-8b698578-5l6zt   1/1     Running   0          97s
hami-gpumem-8b698578-6hrds   1/1     Running   0          97s
hami-gpumem-8b698578-8ft7b   1/1     Running   0          97s
hami-gpumem-8b698578-f8dlr   1/1     Running   0          97s
hami-gpumem-8b698578-k7v5m   1/1     Running   0          97s
hami-gpumem-8b698578-ln66n   1/1     Running   0          97s
hami-gpumem-8b698578-lq7j4   1/1     Running   0          97s
hami-gpumem-8b698578-lvtkz   1/1     Running   0          97s
hami-gpumem-8b698578-lxgr9   1/1     Running   0          97s
hami-gpumem-8b698578-plztz   1/1     Running   0          97s
hami-gpumem-8b698578-rd4gb   1/1     Running   0          97s
hami-gpumem-8b698578-rjtcg   1/1     Running   0          97s
hami-gpumem-8b698578-spx8x   1/1     Running   0          97s
hami-gpumem-8b698578-vmbph   1/1     Running   0          97s
hami-gpumem-8b698578-w6r92   1/1     Running   0          97s
# kubectl exec -it hami-gpumem-8b698578-5dqhb -- ba
sh
root@hami-gpumem-8b698578-5dqhb:/# nvidia-smi 
Thu Jul 16 03:32:09 2026       
+-----------------------------------------------------------------------------------------+
| NVIDIA-SMI 580.126.20             Driver Version: 580.126.20     CUDA Version: 13.0     |
+-----------------------------------------+------------------------+----------------------+
| GPU  Name                 Persistence-M | Bus-Id          Disp.A | Volatile Uncorr. ECC |
| Fan  Temp   Perf          Pwr:Usage/Cap |           Memory-Usage | GPU-Util  Compute M. |
|                                         |                        |               MIG M. |
|=========================================+========================+======================|
|   0  NVIDIA A800-SXM4-80GB          On  |   00000000:C5:00.0 Off |                    0 |
| N/A   27C    P0             61W /  400W |       0MiB /  40000MiB |      0%      Default |
|                                         |                        |             Disabled |
+-----------------------------------------+------------------------+----------------------+

+-----------------------------------------------------------------------------------------+
| Processes:                                                                              |
|  GPU   GI   CI              PID   Type   Process name                        GPU Memory |
|        ID   ID                                                               Usage      |
|=========================================================================================|
|  No running processes found                                                             |
+-----------------------------------------------------------------------------------------+
root@hami-gpumem-8b698578-5dqhb:/#
```

所有 pod 均可调度，且每个 pod 显存均为 40G。

## GPU 显存共享验证（显存比例分配）
除了直接写 `nvidia.com/gpumem`，HAMi 也支持通过 `nvidia.com/gpumem-percentage` 按百分比申请显存。例如80G 显存的 GPU，申请 50%：

```yaml
# cat hami-gpumem-percent.yaml 
apiVersion: apps/v1
kind: Deployment
metadata:
  name: hami-gpumem-percent
spec:
  replicas: 16 # 两个 pod 占用一张 GPU 资源,8卡节点共计可以启动 16 个 pod
  selector:
    matchLabels:
      app: hami-gpumem-percent
  template:
    metadata:
      labels:
        app: hami-gpumem-percent
    spec:
      containers:
      - name: hami-gpumem-percent
        image: swr.cn-north-4.myhuaweicloud.com/ddn-k8s/docker.io/nvidia/cuda:13.0.0-devel-ubuntu22.04
        command:
          - sleep
        args:
          - infinity
        resources:
          limits:
            nvidia.com/gpu: 1 # 使用一张 GPU 资源
            nvidia.com/gpumem-percentage: 50 # 最多使用50% 显存
            nvidia.com/gpucores: 50 # 最多使用该 GPU 50% 的计算资源
# kubectl apply -f hami-gpumem-percent.yaml 
deployment.apps/hami-gpumem-percent created  
# kubectl get pod
NAME                                   READY   STATUS    RESTARTS   AGE
hami-gpumem-percent-567c9f8657-6mh4h   1/1     Running   0          5m4s
hami-gpumem-percent-567c9f8657-8lsx5   1/1     Running   0          5m4s
hami-gpumem-percent-567c9f8657-8psth   1/1     Running   0          5m4s
hami-gpumem-percent-567c9f8657-9jwdp   1/1     Running   0          5m4s
hami-gpumem-percent-567c9f8657-cm57x   1/1     Running   0          5m4s
hami-gpumem-percent-567c9f8657-g88kz   1/1     Running   0          5m4s
hami-gpumem-percent-567c9f8657-gqhvr   1/1     Running   0          5m4s
hami-gpumem-percent-567c9f8657-hc48g   1/1     Running   0          5m4s
hami-gpumem-percent-567c9f8657-jvxbt   1/1     Running   0          5m4s
hami-gpumem-percent-567c9f8657-mc7vm   1/1     Running   0          5m4s
hami-gpumem-percent-567c9f8657-mhch6   1/1     Running   0          5m4s
hami-gpumem-percent-567c9f8657-ndp92   1/1     Running   0          5m4s
hami-gpumem-percent-567c9f8657-q2g6h   1/1     Running   0          5m4s
hami-gpumem-percent-567c9f8657-sklq9   1/1     Running   0          5m4s
hami-gpumem-percent-567c9f8657-tcg4q   1/1     Running   0          5m4s
hami-gpumem-percent-567c9f8657-xbhpj   1/1     Running   0          5m4s
# kubectl exec -it hami-gpumem-percent-567c9f8657-6
mh4h -- bash
root@hami-gpumem-percent-567c9f8657-6mh4h:/# nvidia-smi
Thu Jul 16 06:59:36 2026       
+-----------------------------------------------------------------------------------------+
| NVIDIA-SMI 580.126.20             Driver Version: 580.126.20     CUDA Version: 13.0     |
+-----------------------------------------+------------------------+----------------------+
| GPU  Name                 Persistence-M | Bus-Id          Disp.A | Volatile Uncorr. ECC |
| Fan  Temp   Perf          Pwr:Usage/Cap |           Memory-Usage | GPU-Util  Compute M. |
|                                         |                        |               MIG M. |
|=========================================+========================+======================|
|   0  NVIDIA A800-SXM4-80GB          On  |   00000000:CA:00.0 Off |                    0 |
| N/A   27C    P0             61W /  400W |       0MiB /  40960MiB |      0%      Default |
|                                         |                        |             Disabled |
+-----------------------------------------+------------------------+----------------------+

+-----------------------------------------------------------------------------------------+
| Processes:                                                                              |
|  GPU   GI   CI              PID   Type   Process name                        GPU Memory |
|        ID   ID                                                               Usage      |
|=========================================================================================|
|  No running processes found                                                             |
+-----------------------------------------------------------------------------------------+
```

## GPU 算力比例限制
上述配置中的`nvidia.com/gpucores: 50`就是申请 GPU 算力比例为 50%。这里的 50% 并不是使用一半的物理 CUDA Core，而是通过CUDA time-slicing（时间片调度） 实现的，所以通过 `nvidia-smi` 查询 core utilization 时可能会有波动，不一定稳定卡在某一个固定数值。

```yaml
# cat hami-gpucores.yaml      
apiVersion: apps/v1
kind: Deployment
metadata:
  name: hami-gpucores-100
spec:
  selector:
    matchLabels:
      app: hami-gpucores-100
  template:
    metadata:
      labels:
        app: hami-gpucores-100
    spec:
      containers:
      - name: hami-gpucores-100
        image: swr.cn-north-4.myhuaweicloud.com/ddn-k8s/docker.io/nvidia/cuda:13.0.0-devel-ubuntu22.04
        command:
          - sleep
        args:
          - infinity
        resources:
          limits:
            nvidia.com/gpu: 1 # 使用一张 GPU 资源
            nvidia.com/gpumem-percentage: 50 # 最多使用50% 显存
            nvidia.com/gpucores: 50 # 最多使用该 GPU 50% 的计算资源
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: hami-gpucores-50
spec:
  selector:
    matchLabels:
      app: hami-gpucores-50
  template:
    metadata:
      labels:
        app: hami-gpucores-50
    spec:
      containers:
      - name: hami-gpucores-50
        image: swr.cn-north-4.myhuaweicloud.com/ddn-k8s/docker.io/nvidia/cuda:13.0.0-devel-ubuntu22.04
        env:
        - name: GPU_CORE_UTILIZATION_POLICY
          value: "force"   # 强制限制核心利用率
        command:
          - sleep
        args:
          - infinity
        resources:
          limits:
            nvidia.com/gpu: 1 # 使用一张 GPU 资源
            nvidia.com/gpumem-percentage: 50 # 最多使用50% 显存
            nvidia.com/gpucores: 30 # 最多使用该 GPU 30% 的计算资源
# kubectl apply -f hami-gpucores.yaml      
deployment.apps/hami-gpucores-100 created
deployment.apps/hami-gpucores-50 created
# kubectl get pod                    
NAME                                 READY   STATUS    RESTARTS   AGE
hami-gpucores-100-67977bc987-7z65w   1/1     Running   0          92s
hami-gpucores-50-67f454c947-dv4wx    1/1     Running   0          92s
```

接下来持续运行 60 秒矩阵乘法，统计不同算力限制下完成的次数

```python
# kubectl exec -it hami-gpucores-100-67977bc987-7z65w -- bash  
# 准备环境
root@hami-gpucores-100-67977bc987-7z65w:/# apt update && apt install python3 python3-pip -y
root@hami-gpucores-100-67977bc987-7z65w:/# pip3 install torch numpy -i https://repo.huaweicloud.com/repository/pypi/simple
# 执行压测
root@hami-gpucores-100-67977bc987-7z65w:/# python3 <<EOF
import torch, time
device = "cuda"
a = torch.randn((8192, 8192), device=device)
b = torch.randn((8192, 8192), device=device)
# 预热
for _ in range(10):
    torch.matmul(a, b)
torch.cuda.synchronize()
count = 0
start = time.time()
while time.time() - start < 60:
    c = torch.matmul(a, b)
    torch.cuda.synchronize()
    count += 1
print("Iterations:", count)
EOF
```

100%算力 pod 执行结果是`Iterations: 2068`

50%算力 pod 执行结果是`Iterations: 1047`

## <font style="color:rgb(34, 34, 34);">GPU_CORE_UTILIZATION_POLICY 策略</font>
HAMi 允许通过 `nvidia.com/gpucores` 这个资源请求,给容器分配一部分 GPU 的算力份额(比如 100 代表 100% 的 GPU 算力,分配 20 就是占用 20% 的算力上限)。而 `GPU_CORE_UTILIZATION_POLICY` 就是控制"这个上限到底要不要真的被强制执行"的开关。

需要注意的是这个配置不是 Kubernetes 原生字段，而是 HAMi 容器侧配置项，主要给容器里的 HAMi-core 使用。它属于容器运行时侧的环境变量，不是 Kubernetes 原生资源字段。

<font style="color:rgb(51, 51, 51);">要理解这个参数，关键是要把 HAMi 的两个阶段分开看：</font>

第一阶段：调度阶段HAMi scheduler 根据 Pod 里申请的 nvidia.com/gpu、nvidia.com/gpumem、nvidia.com/gpucores 判断当前节点、当前 GPU 是否还有足够资源。调度成功不代表容器运行时一定会强制把 GPU 利用率压到 `30%` 以下。因为调度器只负责“把 Pod 放到哪里”，Pod 真正运行起来以后，就进入了 HAMi-core 的运行时控制阶段。

第二阶段：容器运行阶段Pod 启动以后，容器里的 CUDA/NVML 调用会受到 HAMi-core 的影响，从而让容器看到被分配后的 GPU 资源视图，并对显存、GPU core 等资源进行运行时控制。

它有三个可选值(字符串类型):

| 值 | 含义 |
| --- | --- |
| default | 默认策略,按照系统的默认利用率限制逻辑执行 |
| force | 容器会始终将核心利用率限制在 "nvidia.com/gpucores" 所设定的值以下 |
| disable | 容器会在任务执行期间忽略 "nvidia.com/gpucores" 所设置的利用率限制 |


## GPU 按 NS 限制资源
当 GPU 集群从单团队演进为多团队共享平台后，资源管理的重点不再是“能否调度成功”，而是“如何合理分配资源”。平台需要回答三个关键问题：团队的 GPU 资源上限是多少、不同模型应匹配哪类 GPU，以及任务应优先集中部署还是分散部署。 为此，首先可以借助 ResourceQuota 为各团队设置 GPU（显存）配额，实现资源的精细化管理。

通过ResourceQuota 设置Namespace 的资源限额：

```yaml
# cat ns.yaml          
apiVersion: v1
kind: Namespace
metadata:
  name:  hami-quota
---
apiVersion: v1
kind: ResourceQuota
metadata:
  name: hami-quota
  namespace: hami-quota
spec:
  hard:
    limits.nvidia.com/gpu: "2"
    limits.nvidia.com/gpumem: "2000"
# kubectl apply -f ns.yaml                              
namespace/hami-quota created
resourcequota/hami-quota created
```

接下来创建 2 个 pod，共申请显存 3GB，第一个 pod 可以正常创建，第二个 pod 会因达到 ns 显存限制而处于 pending 状态。

```yaml
# cat ns-quota.yaml       
apiVersion: apps/v1
kind: Deployment
metadata:
  name: hami-quota
  namespace: hami-quota
spec:
  replicas: 2 
  selector:
    matchLabels:
      app: hami-quota
  template:
    metadata:
      labels:
        app: hami-quota
    spec:
      containers:
      - name: hami-quota
        image: swr.cn-north-4.myhuaweicloud.com/ddn-k8s/docker.io/nvidia/cuda:13.0.0-devel-ubuntu22.04
        command:
          - sleep
        args:
          - infinity
        resources:
          limits:
            nvidia.com/gpu: 1 # 使用一张 GPU 资源
            nvidia.com/gpumem: 1500 # 最多使用1.5GB显存
# kubectl apply -f ns-quota.yaml 
deployment.apps/hami-quota created
# kubectl get pod -n hami-quota                                                  
NAME                          READY   STATUS    RESTARTS   AGE
hami-quota-7f5795fbd8-5g85m   1/1     Running   0          50s
hami-quota-7f5795fbd8-tcl5h   0/1     Pending   0          50s
# kubectl describe pod -n hami-quota hami-quota-7f5795fbd8-tcl5h | grep -A 5 Events
Events:
  Type     Reason            Age   From            Message
  ----     ------            ----  ----            -------
  Warning  FailedScheduling  86s   hami-scheduler  0/1 nodes are available: 1 NodeUnfitPod. preemption: 0/1 nodes are available: 1 No preemption victims found for incoming pod.
  Warning  FilteringFailed   87s   hami-scheduler  1 nodes ResourceQuotaNotFit(gai-volcengine-gpu-a800-11)
  Warning  FilteringFailed   87s   hami-scheduler  no available node, 1 nodes do not meet
```

## 指定 GPU 型号调度
HAMi 支持通过 Pod annotation 指定要使用的 GPU 型号。官方配置文档中 `nvidia.com/use-gputype` 的含义是：如果设置了这个 annotation，那么 Pod 分配到的设备类型必须是这里指定的类型。先查看本机 GPU 型号：

```bash
# nvidia-smi --query-gpu=name --format=csv,noheader
NVIDIA A800-SXM4-80GB
```

yaml 文件如下

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: hami-gputype
  annotations:
    nvidia.com/use-gputype: "NVIDIA A800-SXM4-80GB"
spec:
  replicas: 16 # 两个 pod 占用一张 GPU 资源,8卡节点共计可以启动 16 个 pod
  selector:
    matchLabels:
      app: hami-gputype
  template:
    metadata:
      labels:
        app: hami-gputype
    spec:
      containers:
      - name: hami-gputype
        image: swr.cn-north-4.myhuaweicloud.com/ddn-k8s/docker.io/nvidia/cuda:13.0.0-devel-ubuntu22.04
        command:
          - sleep
        args:
          - infinity
        resources:
          limits:
            nvidia.com/gpu: 1 # 使用一张 GPU 资源
            nvidia.com/gputypeage: 50 # 最多使用50% 显存
            nvidia.com/gpucores: 50 # 最多使用该 GPU 50% 的计算资源
```

## 指定 GPU UUID 调度
HAMi 也支持通过 `nvidia.com/use-gpuuuid` 指定 GPU UUID。官方配置文档中说明，如果设置了 `nvidia.com/use-gpuuuid`，Pod 分配到的设备必须属于指定 UUID 列表。先查看 UUID：

```yaml
# nvidia-smi --query-gpu=index,name,uuid,memory.total --format=csv,noheader
0, NVIDIA A800-SXM4-80GB, GPU-12845128-f0d6-bc49-c86d-696e956dd9b0, 81920 MiB
1, NVIDIA A800-SXM4-80GB, GPU-93529c47-f654-acb2-ba35-21669750b0d5, 81920 MiB
2, NVIDIA A800-SXM4-80GB, GPU-ce57610c-8922-e1c5-7068-450433473522, 81920 MiB
3, NVIDIA A800-SXM4-80GB, GPU-6886b13a-5d02-d4ce-21b2-503fc9399253, 81920 MiB
4, NVIDIA A800-SXM4-80GB, GPU-1822d438-0fd6-c40e-bddb-df3e18e49aa7, 81920 MiB
5, NVIDIA A800-SXM4-80GB, GPU-643cf675-065d-9ab4-3ead-63143f2b7dc2, 81920 MiB
6, NVIDIA A800-SXM4-80GB, GPU-11fc9964-5382-2722-8cc1-42821ff30bda, 81920 MiB
7, NVIDIA A800-SXM4-80GB, GPU-0d208f82-9a0e-c478-23f1-d239178fc2cb, 81920 MiB
```

指定 uuid 调度，yaml 文件如下

```yaml
# cat hami-gpuuuid.yaml             
apiVersion: apps/v1
kind: Deployment
metadata:
  name: hami-gpuuuid
spec:
  selector:
    matchLabels:
      app: hami-gpuuuid
  template:
    metadata:
      labels:
        app: hami-gpuuuid
      annotations:
        nvidia.com/use-gpuuuid: "GPU-0d208f82-9a0e-c478-23f1-d239178fc2cb"
    spec:
      containers:
      - name: hami-gpuuuid
        image: swr.cn-north-4.myhuaweicloud.com/ddn-k8s/docker.io/nvidia/cuda:13.0.0-devel-ubuntu22.04
        command:
          - sleep
        args:
          - infinity
        resources:
          limits:
            nvidia.com/gpu: 1 # 使用一张 GPU 资源
            nvidia.com/gpumem-percentage: 50 # 最多使用50% 显存
            nvidia.com/gpucores: 50 # 最多使用该 GPU 50% 的计算资源
# kubectl apply -f hami-gpuuuid.yaml 
deployment.apps/hami-gpuuuid created
# kubectl get pod                   
NAME                            READY   STATUS    RESTARTS   AGE
hami-gpuuuid-6c585f6454-xpvp7   1/1     Running   0          78s
# kubectl exec -it hami-gpuuuid-6c585f6454-xpvp7 -- bash
root@hami-gpuuuid-6c585f6454-xpvp7:/# nvidia-smi --query-gpu=index,name,uuid,memory.total --format=csv,noheader
0, NVIDIA A800-SXM4-80GB, GPU-0d208f82-9a0e-c478-23f1-d239178fc2cb, 40960 MiB
[HAMI-core Msg(58:140420692704128:multiprocess_memory_limit.c:703)]: Cleanup on exit for PID 58
[HAMI-core Msg(58:140420692704128:multiprocess_memory_limit.c:739)]: Exit cleanup complete for PID 58
```

## 将任务分配给 MIG
通过 Pod 注解让 HAMi 自动为任务分配 MIG（Multi-Instance GPU）切片实例。

配置节点为 MIG 模式

```yaml
# kubectl edit cm hami-device-plugin -n kube-system
修改nodeconfig字段，内容如下：
{
  "nodeconfig": [
    {
      "name": "gai-volcengine-gpu-a800-11",
      "operatingmode": "mig",
      "filterdevices": {
        "uuid": [],
        "index": []
      }
    }
  ]
}

重启相关组件让配置生效
# kubectl rollout restart deployment hami-scheduler -n kube-system
# kubectl delete pod -n kube-system -l app.kubernetes.io/component=hami-device-plugin --field-selector spec.nodeName=gai-volcengine-gpu-a800-11
```

创建 deployment 资源，使用 mig。

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: hami-mig
spec:
  selector:
    matchLabels:
      app: hami-mig
  template:
    metadata:
      labels:
        app: hami-mig
      annotations:
        nvidia.com/vgpu-mode: "mig"              # 指定使用 MIG 模式
        hami.io/gpu-scheduler-policy: "binpack"  # 可选：GPU调度策略
    spec:
      containers:
      - name: hami-mig
        image: swr.cn-north-4.myhuaweicloud.com/ddn-k8s/docker.io/nvidia/cuda:13.0.0-devel-ubuntu22.04
        command:
          - sleep
        args:
          - infinity
        resources:
          limits:
            nvidia.com/gpu: 2        # 请求2个MIG实例
            nvidia.com/gpumem: 8000  # 每个实例显存需求(MB)
# kubectl get pod   
NAME                       READY   STATUS    RESTARTS        AGE
hami-mig-c4cf7bd9c-6rl5l   1/1     Running   0               3m18s
# kubectl exec -it hami-mig-c4cf7bd9c-6rl5l -- bash   
root@hami-mig-c4cf7bd9c-6rl5l:/# nvidia-smi 
Tue Jul 28 07:35:27 2026       
+-----------------------------------------------------------------------------------------+
| NVIDIA-SMI 580.126.20             Driver Version: 580.126.20     CUDA Version: 13.0     |
+-----------------------------------------+------------------------+----------------------+
| GPU  Name                 Persistence-M | Bus-Id          Disp.A | Volatile Uncorr. ECC |
| Fan  Temp   Perf          Pwr:Usage/Cap |           Memory-Usage | GPU-Util  Compute M. |
|                                         |                        |               MIG M. |
|=========================================+========================+======================|
|   0  NVIDIA A800-SXM4-80GB          On  |   00000000:C5:00.0 Off |                    0 |
| N/A   27C    P0             61W /  400W |       0MiB /   8000MiB |      0%      Default |
|                                         |                        |             Disabled |
+-----------------------------------------+------------------------+----------------------+
|   1  NVIDIA A800-SXM4-80GB          On  |   00000000:E4:00.0 Off |                    0 |
| N/A   27C    P0             62W /  400W |       0MiB /   8000MiB |      0%      Default |
|                                         |                        |             Disabled |
+-----------------------------------------+------------------------+----------------------+

+-----------------------------------------------------------------------------------------+
| Processes:                                                                              |
|  GPU   GI   CI              PID   Type   Process name                        GPU Memory |
|        ID   ID                                                               Usage      |
|=========================================================================================|
|  No running processes found                                                             |
+-----------------------------------------------------------------------------------------+
```

## GPU 拓扑感知
HAMi 支持在 vGPU 环境下根据 GPU 之间的物理互联拓扑（可用 `nvidia-smi topo -m` 查看）来优化调度，从而提升 GPU 资源利用率和多卡任务的通信性能。这样做的好处是可以让单卡任务"让路"给多卡任务——故意占用互联较差的卡，把 NVLink/高带宽互联的卡组合完整地保留给真正需要多卡协同（如分布式训练）的负载使用，从而在整体集群层面提高资源分配的合理性。

安装时设置

```bash
helm install hami hami-charts/hami \
  --set scheduler.defaultSchedulerPolicy.gpuSchedulerPolicy=topology-aware \
  -n kube-system
```

已安装集群配置

1. device-plugin DaemonSet 设置环境变量 `ENABLE_TOPOLOGY_SCORE: 'true'`
2. hami-scheduler 启动参数加 `gpu-scheduler-policy=topology-aware`
3. Pod 注解单独指定：

```yaml
metadata:
     annotations:
       hami.io/gpu-scheduler-policy: topology-aware
```

提交 Pod 后可通过 scheduler 日志（日志级别 >5）验证实际分配到的 GPU 组合。

调度逻辑如下：

| 场景 | 策略 |
| --- | --- |
| 节点选择 | 优先选 GPU 数量最少、但仍能满足需求的节点，把大节点留给未来的大规模任务 |
| 单卡任务（一个 Pod 一块 GPU） | 优先选互联性最差的 GPU（把高带宽互联的 GPU 对留给以后的多卡任务） |
| 多卡任务（一个 Pod 多块 GPU） | 优先选互联性最好的 GPU 组合（最大化卡间通信带宽） |



