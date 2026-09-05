# GPU Operator自动管理GPU

> 分类：AIOPS / 第3章：大模型 AI Infra 运维
> 原文：https://www.cuiliangblog.cn/detail/section/270458324
> 来源：崔亮的博客

---

# GPU Operator 介绍
## 为什么需要 GPU Operator
在 Kubernetes 中使用 GPU 时，传统方式需要手动在每个节点安装 GPU 驱动、NVIDIA Container Toolkit、配置 Device Plugin 等组件。当集群规模较大时，这种手动操作不仅繁琐，还容易出现版本不一致、配置错误等问题。

NVIDIA 推出的 GPU Operator 正是为了解决这些痛点，它通过自动化方式处理驱动安装、运行时配置、设备发现、监控集成等全流程，大幅简化 K8s 环境下的 GPU 部署，尤其适合规模化集群管理。

GPU Operator特别适合需要经常增减节点的云上环境，可以大幅提升运维效率。

## 组件介绍
### 节点与 GPU 信息发现组件
+ NFD（Node Feature Discovery）扫描节点基础信息，添加如 CPU 型号、操作系统版本、内核版本等标签，前缀为`feature.node.kubernetes.io`，用于节点特征描述。
+ GFD（GPU Feature Discovery）专门识别 GPU 节点，添加核心标签`nvidia.com/gpu.present=true`，并补充 GPU 型号、驱动版本、显存容量等信息（如`nvidia.com/gpu.product=Tesla-T4`）。

作用：这两个组件为后续组件提供 “准入条件”，只有携带`nvidia.com/gpu.present=true`标签的节点才会部署驱动和工具包。

### 驱动与运行时安装组件
+ NVIDIA Driver Installer以 DaemonSet 形式运行，根据节点内核版本（`uname -r`）和操作系统（`cat /etc/os-release`）生成对应镜像（如`nvcr.io/nvidia/driver:535-5.15.0-105-generic-ubuntu22.04`），自动安装 GPU 驱动。注意：若节点已手动安装驱动，会标记`nvidia.com/gpu.deploy.driver=pre-install`，跳过安装。
+ NVIDIA Container Toolkit Installer安装 NVIDIA 容器工具包，配置容器运行时（如 Docker/Containerd）使用`nvidia-runtime`，确保容器内可调用 GPU 资源，修改`/etc/docker/daemon.json`等配置文件。

作用：用于安装 GPU 驱动和 container toolkit。

### K8s 集成与监控组件
+ NVIDIA Device Plugin将 GPU 作为 K8s 扩展资源（`nvidia.com/gpu`）暴露，支持调度器感知 GPU 资源，实现 Pod 级别的 GPU 分配（如`limits: nvidia.com/gpu: 1`）。
+ DCGM Exporter采集 GPU 实时指标（温度、显存使用率、功耗等），对接 Prometheus 和 Grafana，提供监控能力。

### GPU 配置与管理组件
+ **Operator Validator**：GPU Operator 部署完成后自动执行环境校验，检查节点是否满足运行条件，包括 NVIDIA Driver、Container Runtime、Container Toolkit、Device Plugin 等组件是否安装正确，并验证 GPU 是否能够正常被 Kubernetes 识别和使用。若校验失败，会阻止后续组件继续部署，确保 GPU 环境配置完整且可用。
+ **MIG Manager**：针对支持 MIG（Multi-Instance GPU）的 GPU（如 A100、H100 等），负责自动配置和管理 MIG 实例。根据预设策略创建、删除或调整 GPU 分区，将一张物理 GPU 划分为多个独立的 GPU Instance，并同步更新 Device Plugin 暴露的 GPU 资源，实现 GPU 资源细粒度划分与调度。

## 组件安装顺序
NVIDIA GPU Operator 依如下的顺序部署各个组件，并且如果前一个组件部署失败，那么其后面的组件将停止部署：

| 顺序 | 组件 | 依赖 | 作用 |
| --- | --- | --- | --- |
| 1 | NFD | 无 | 发现节点基础信息，添加 CPU、内核、OS 等标签。 |
| 2 | GFD | NFD | 识别 GPU 节点，添加 `nvidia.com/gpu.present=true`<br/>、GPU 型号等标签。 |
| 3 | NVIDIA Driver Installer | GFD | 安装 NVIDIA Driver（已安装则跳过）。 |
| 4 | NVIDIA Container Toolkit Installer | Driver | 安装 Container Toolkit，配置容器运行时。 |
| 5 | NVIDIA Device Plugin | Driver + Toolkit | 将 GPU 注册为 `nvidia.com/gpu`<br/> 扩展资源。 |
| 6 | DCGM Exporter | Driver | 采集 GPU 监控指标。 |
| 7 | MIG Manager（可选） | Driver | 配置和管理 MIG 实例，并通知 Device Plugin 更新资源。 |
| 8 | Operator Validator | 所有组件 | 校验 Driver、Toolkit、Device Plugin、GPU 等组件是否正常工作。 |


每个组件都是以 DaemonSet 方式部署，并且只有当节点存在标签 nvidia.com/gpu.present=true 时，各 DaemonSet 控制的 Pod 才会在节点上运行。

Operator Validator 并不是最后才安装，它会随着 GPU Operator 一起部署，但会等待前面的组件准备完成后再执行校验。因此，从逻辑执行顺序来看，它位于整个流程的最后，用于验证 GPU 环境是否配置成功。

MIG Manager 与 DCGM Exporter 并不是串行关系，它们都依赖 Driver 安装完成，可以并行启动；其中 MIG Manager 仅在支持 MIG（如 A100、H100、H200、B200 等）的 GPU 上启用。

# 安装 GPU Operator
## 前提条件
在安装 GPU Operator 之前，请配置好安装环境如下：

+ 所有节点 不需要 预先安装NVIDIA组件(`driver`, `container runtime`, `device plugin`)；
+ 所有GPU节点必须配置 `Docker`, `cri-o`,  `containerd`，例如都是 containerd 或者都是 docker；
+ 如果使用HWE内核(e.g. kernel 5.x) 的 Ubuntu 18.04 LTS 环境下,需要给 `nouveau driver` 添加黑名单，需要更新 `initramfs`；

## 安装Operator
添加 nvidia helm 仓库并更新：

```bash
# helm repo add nvidia https://helm.ngc.nvidia.com/nvidia
# helm repo update
```

获取 charts 包，需要注意的是不同操作系统支持的版本有限，支持的驱动镜像列表可参考文档[https://catalog.ngc.nvidia.com/orgs/nvidia/containers/driver/tags](https://catalog.ngc.nvidia.com/orgs/nvidia/containers/driver/tags?version=580.159.03-ubuntu22.04)，例如操作系统为 Ubuntu 20.04，支持的版本如下

![](assets/03-AIOps/f40eb2d66b7a7568bf40.png)

```bash
# helm pull nvidia/gpu-operator --untar
# cd gpu-operator
# vim values.yaml
operator:
  defaultRuntime: containerd # 指定 runtime，可选docker、crio、containerd
driver:
  version: "550.163.01" # 指定驱动版本
```

安装 operator

```bash
# helm install gpu-operator -n gpu-operator . -f values.yaml --create-namespace       
NAME: gpu-operator
LAST DEPLOYED: Thu May 21 15:38:40 2026
NAMESPACE: gpu-operator
STATUS: deployed
REVISION: 1
TEST SUITE: None
```

常见 charts 参数可参考文档：[https://docs.nvidia.com/datacenter/cloud-native/gpu-operator/latest/getting-started.html#common-chart-customization-options](https://docs.nvidia.com/datacenter/cloud-native/gpu-operator/latest/getting-started.html#common-chart-customization-options)

## 查看部署的资源
部署后，会在`gpu-operator` namespace 下启动相关 Pod，查看一下 Pod 的运行情况，除了一个 `Completed` 之外其他应该都是 Running 状态。

```bash
# kubectl get pod -n gpu-operator
NAME                                                          READY   STATUS      RESTARTS   AGE
gpu-feature-discovery-4kxmq                                   1/1     Running     0          4m52s
gpu-operator-6867f745b4-frllj                                 1/1     Running     0          12m
gpu-operator-node-feature-discovery-gc-55476d698f-kznrz       1/1     Running     0          12m
gpu-operator-node-feature-discovery-master-648cb4c9d7-6nn9p   1/1     Running     0          12m
gpu-operator-node-feature-discovery-worker-r98cq              1/1     Running     0          12m
nvidia-container-toolkit-daemonset-ccwhh                      1/1     Running     0          11m
nvidia-cuda-validator-tgqdk                                   0/1     Completed   0          4m42s
nvidia-dcgm-exporter-vrfc8                                    1/1     Running     0          4m52s
nvidia-device-plugin-daemonset-2vcbb                          1/1     Running     0          4m52s
nvidia-driver-daemonset-mgtct                                 1/1     Running     0          11m
nvidia-mig-manager-hvxgq                                      1/1     Running     0          5m38s
nvidia-operator-validator-bqwff                               1/1     Running     0          4m51s
```

进入 `nvidia-driver-daemonset-xxx` Pod，这个 Pod 负责 GPU Driver 的安装，在该 Pod 中可以执行 `nvidia-smi` 命令，查看 GPU 信息与 NVLink 状态：

```bash
# kubectl exec -it -n gpu-operator nvidia-driver-daemonset-mgtct -- bash      
root@nvidia-driver-daemonset-mgtct:/drivers# nvidia-smi 
Tue May 19 10:04:44 2026       
+-----------------------------------------------------------------------------------------+
| NVIDIA-SMI 550.163.01             Driver Version: 550.163.01     CUDA Version: 12.4     |
|-----------------------------------------+------------------------+----------------------+
| GPU  Name                 Persistence-M | Bus-Id          Disp.A | Volatile Uncorr. ECC |
| Fan  Temp   Perf          Pwr:Usage/Cap |           Memory-Usage | GPU-Util  Compute M. |
|                                         |                        |               MIG M. |
|=========================================+========================+======================|
|   0  NVIDIA A100-SXM4-80GB          On  |   00000000:3F:00.0 Off |                    0 |
| N/A   33C    P0             64W /  400W |       1MiB /  81920MiB |      0%      Default |
|                                         |                        |             Disabled |
+-----------------------------------------+------------------------+----------------------+
|   1  NVIDIA A100-SXM4-80GB          On  |   00000000:44:00.0 Off |                    0 |
| N/A   31C    P0             68W /  400W |       1MiB /  81920MiB |      0%      Default |
|                                         |                        |             Disabled |
+-----------------------------------------+------------------------+----------------------+
|   2  NVIDIA A100-SXM4-80GB          On  |   00000000:62:00.0 Off |                    0 |
| N/A   31C    P0             65W /  400W |       1MiB /  81920MiB |      0%      Default |
|                                         |                        |             Disabled |
+-----------------------------------------+------------------------+----------------------+
|   3  NVIDIA A100-SXM4-80GB          On  |   00000000:68:00.0 Off |                    0 |
| N/A   34C    P0             65W /  400W |       1MiB /  81920MiB |      0%      Default |
|                                         |                        |             Disabled |
+-----------------------------------------+------------------------+----------------------+
|   4  NVIDIA A100-SXM4-80GB          On  |   00000000:A9:00.0 Off |                    0 |
| N/A   34C    P0             65W /  400W |       1MiB /  81920MiB |      0%      Default |
|                                         |                        |             Disabled |
+-----------------------------------------+------------------------+----------------------+
|   5  NVIDIA A100-SXM4-80GB          On  |   00000000:AD:00.0 Off |                    0 |
| N/A   31C    P0             65W /  400W |       1MiB /  81920MiB |      0%      Default |
|                                         |                        |             Disabled |
+-----------------------------------------+------------------------+----------------------+
|   6  NVIDIA A100-SXM4-80GB          On  |   00000000:D2:00.0 Off |                    0 |
| N/A   31C    P0             63W /  400W |       1MiB /  81920MiB |      0%      Default |
|                                         |                        |             Disabled |
+-----------------------------------------+------------------------+----------------------+
|   7  NVIDIA A100-SXM4-80GB          On  |   00000000:D5:00.0 Off |                    0 |
| N/A   33C    P0             67W /  400W |       1MiB /  81920MiB |      0%      Default |
|                                         |                        |             Disabled |
+-----------------------------------------+------------------------+----------------------+
                                                                                         
+-----------------------------------------------------------------------------------------+
| Processes:                                                                              |
|  GPU   GI   CI        PID   Type   Process name                              GPU Memory |
|        ID   ID                                                               Usage      |
|=========================================================================================|
|  No running processes found                                                             |
+-----------------------------------------------------------------------------------------+

root@nvidia-driver-daemonset-mgtct:/drivers# nvidia-smi topo -m
        GPU0    GPU1    GPU2    GPU3    GPU4    GPU5    GPU6    GPU7    NIC0    NIC1    NIC2    CPU Affinity    NUMA Affinity   GPU NUMA ID
GPU0     X      NV12    NV12    NV12    NV12    NV12    NV12    NV12    PXB     SYS     SYS     0-31,64-95      0               N/A
GPU1    NV12     X      NV12    NV12    NV12    NV12    NV12    NV12    PXB     SYS     SYS     0-31,64-95      0               N/A
GPU2    NV12    NV12     X      NV12    NV12    NV12    NV12    NV12    NODE    SYS     SYS     0-31,64-95      0               N/A
GPU3    NV12    NV12    NV12     X      NV12    NV12    NV12    NV12    NODE    SYS     SYS     0-31,64-95      0               N/A
GPU4    NV12    NV12    NV12    NV12     X      NV12    NV12    NV12    SYS     PXB     NODE    32-63,96-127    1               N/A
GPU5    NV12    NV12    NV12    NV12    NV12     X      NV12    NV12    SYS     PXB     NODE    32-63,96-127    1               N/A
GPU6    NV12    NV12    NV12    NV12    NV12    NV12     X      NV12    SYS     NODE    NODE    32-63,96-127    1               N/A
GPU7    NV12    NV12    NV12    NV12    NV12    NV12    NV12     X      SYS     NODE    NODE    32-63,96-127    1               N/A
NIC0    PXB     PXB     NODE    NODE    SYS     SYS     SYS     SYS      X      SYS     SYS
NIC1    SYS     SYS     SYS     SYS     PXB     PXB     NODE    NODE    SYS      X      NODE
NIC2    SYS     SYS     SYS     SYS     NODE    NODE    NODE    NODE    SYS     NODE     X 

Legend:

  X    = Self
  SYS  = Connection traversing PCIe as well as the SMP interconnect between NUMA nodes (e.g., QPI/UPI)
  NODE = Connection traversing PCIe as well as the interconnect between PCIe Host Bridges within a NUMA node
  PHB  = Connection traversing PCIe as well as a PCIe Host Bridge (typically the CPU)
  PXB  = Connection traversing multiple PCIe bridges (without traversing the PCIe Host Bridge)
  PIX  = Connection traversing at most a single PCIe bridge
  NV#  = Connection traversing a bonded set of # NVLinks

NIC Legend:

  NIC0: mlx5_0
  NIC1: mlx5_3
  NIC2: mlx5_bond_0

root@nvidia-driver-daemonset-mgtct:/drivers#
```

检查节点资源是否处于可分配，确认 capacity 是否包含 GPU，正常应该是有的。

```bash
# kubectl describe node miaohua-a-79 | grep Allocatable: -A 7
Allocatable:
  cpu:                128
  ephemeral-storage:  3454990344616
  hugepages-1Gi:      0
  hugepages-2Mi:      0
  memory:             1056364224Ki
  nvidia.com/gpu:     8
  pods:               110
```

至此，说明我们的 GPU Operator 已经安装成功，K8s 也能感知到节点上的 GPU，接下来就可以在 Pod 中使用 GPU 了。

## 使用验证
创建资源清单

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: cuda-8gpu-test
  namespace: default
spec:
  replicas: 1
  selector:
    matchLabels:
      app: cuda-8gpu-test
  template:
    metadata:
      labels:
        app: cuda-8gpu-test
    spec:
      nodeSelector:
        nvidia.com/gpu.present: "true"
      containers:
        - name: cuda
          image: swr.cn-north-4.myhuaweicloud.com/ddn-k8s/docker.io/nvidia/cuda:12.4.1-devel-ubuntu22.04
          imagePullPolicy: IfNotPresent
          command:
            - /bin/bash
            - -c
            - |
              sleep infinity
          resources:
            limits:
              nvidia.com/gpu: 8
            requests:
              nvidia.com/gpu: 8
          securityContext:
            privileged: true
          tty: true
          stdin: true
```

查看验证

```bash
# kubectl get pod
NAME                              READY   STATUS    RESTARTS   AGE
cuda-8gpu-test-65c96cc4f9-zc9s8   1/1     Running   0          18m
# kubectl exec -it cuda-8gpu-test-65c96cc4f9-zc9s8 -- bash              
root@cuda-8gpu-test-65c96cc4f9-zc9s8:/# nvidia-smi -L
GPU 0: NVIDIA A100-SXM4-80GB (UUID: GPU-15d4f017-b14e-d7cb-4d10-e893a6abd5dc)
GPU 1: NVIDIA A100-SXM4-80GB (UUID: GPU-52343998-21eb-227c-8c39-00888c3b3fe9)
GPU 2: NVIDIA A100-SXM4-80GB (UUID: GPU-1cd99017-fe63-22bb-85fa-aa071e9eb433)
GPU 3: NVIDIA A100-SXM4-80GB (UUID: GPU-1f9fb931-27a2-3212-2d3d-85e51c67fd81)
GPU 4: NVIDIA A100-SXM4-80GB (UUID: GPU-f229271e-77e5-4684-3134-38d470efe467)
GPU 5: NVIDIA A100-SXM4-80GB (UUID: GPU-40aec4fd-464f-b2b1-a93f-a662102234c4)
GPU 6: NVIDIA A100-SXM4-80GB (UUID: GPU-86534461-ea76-ca1e-e748-bf553578228b)
GPU 7: NVIDIA A100-SXM4-80GB (UUID: GPU-2545335d-3baa-188c-36b5-f645e39e1923)
```

## 常见问题
个别版本安装时会出现找不到当前内核对应的头文件/源码，具体报错如下

```bash
# kubectl logs -n gpu-operator nvidia-driver-daemonset-87qxk -f
DRIVER_ARCH is x86_64

========== NVIDIA Software Installer ==========

Starting installation of NVIDIA driver version 580.126.20 for Linux kernel version 5.15.0-113-generic

Stopping NVIDIA fabric manager daemon...
/usr/local/bin/nvidia-driver: line 375: kill: (3401) - No such process
Unloading NVIDIA driver kernel modules...
Unmounting NVIDIA driver rootfs...
Updating the package cache...
Resolving Linux kernel version...
Could not resolve Linux kernel version
Stopping NVIDIA fabric manager daemon...
/usr/local/bin/nvidia-driver: line 375: kill: (3401) - No such process
Unloading NVIDIA driver kernel modules...
Unmounting NVIDIA driver rootfs...
```

确认原因

```bash
# 进入 driver 容器查看
kubectl exec -n gpu-operator nvidia-driver-daemonset-87qxk -- bash -c "uname -r"

# 查看容器内能否找到宿主机内核头文件
kubectl exec -n gpu-operator nvidia-driver-daemonset-87qxk -- ls /host/usr/src/


# kubectl get pod -n gpu-operator nvidia-driver-daemonset-87qxk -o jsonpath='{.spec.containers[*].name}'
echo ""
# kubectl get pod -n gpu-operator nvidia-driver-daemonset-87qxk -o jsonpath='{.spec.initContainers[*].name}'
nvidia-driver-ctr
# kubectl exec -n gpu-operator nvidia-driver-daemonset-87qxk -c nvidia-driver-ctr -- \
  apt-cache show linux-headers-6.8.0-60-generic 2>&1 | head -5
E: No packages found
command terminated with exit code 100
```

如果 pod 提示No packages found，就是容器内 apt 源找不到 `linux-headers-6.8.0-60-generic`，所以内核版本解析失败 。

解决办法：driver 版本 580 + ubuntu22.04/24.04 支持预编译，跳过容器内编译内核模块：  

```bash
helm upgrade gpu-operator nvidia/gpu-operator \
  -n gpu-operator \
  --reuse-values \
  --set driver.usePrecompiled=true
```

升级操作系统内核版本，与 drive 支持的版本保持一致

```bash
# 查询当前操作系统内核版本
# uname -r
6.8.0-60-generic
```

查看 drive 支持的内核版本列表

![](assets/03-AIOps/aa54d89030b2822bdd41.png)

接下来将内核版本从6.8.0-60-generic 升级到6.8.0-124-generic

```bash
# 查看当前可用的 6.8.0-124 内核包
apt-cache search linux-image | grep 6.8.0-124

# 安装新内核
apt-get install -y linux-headers-6.8.0-124-generic linux-image-6.8.0-124-generic linux-modules-6.8.0-124-generic

# 确认安装成功
dpkg -l | grep 6.8.0-124

# 查看 grub 菜单条目
grep -E "menuentry|submenu" /boot/grub/grub.cfg | head -20

# 更新 grub（一般安装后自动设为默认）
update-grub

# 重启
reboot

uname -r
# 应该输出 6.8.0-124-generic
```

# 日常维护
## 监控告警
helm 安装完 gpu operator 后，已经配置了gpu-operator，但是我们还需要手动添加 dcgm-exporter 用于采集 GPU 使用率，显存，pod 使用量等信息

```bash
# cat nvidia-dcgm-exporter.yaml 
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: nvidia-dcgm-exporter
  namespace: gpu-operator 
spec:
  selector:
    matchLabels:
      app: nvidia-dcgm-exporter
  namespaceSelector:
    matchNames:
      - gpu-operator
  endpoints:
    - port: gpu-metrics
      interval: 15s
      scrapeTimeout: 10s
      path: /metrics
# kubectl apply -f b.yaml 
servicemonitor.monitoring.coreos.com/nvidia-dcgm-exporter created
# kubectl get servicemonitors.monitoring.coreos.com -n gpu-operator
NAME                   AGE
gpu-operator           29m
nvidia-dcgm-exporter   6s
```

查看 prometheus 页面 targets

![](assets/03-AIOps/334b8f93c9e895e0020c.png)

## 升级驱动
在我们之前安装 operator 时通过 `--set driver.version=550.163.01`指定驱动版本为 550，现在需要升级版本至 570。

核心思路：利用 Upgrade Controller 的两个关键机制：

+ maxParallelUpgrades: 1 — 每次只升级一个节点
+ nvidia.com/gpu-driver-upgrade.skip=true — 跳过不想立即升级的节点

通过给节点打 skip 标签，可以精确控制哪个节点、什么时候升级。

给不想现在升级的节点打 skip 标签

```bash
kubectl label node miaohua-a-79 nvidia.com/gpu-driver-upgrade.skip=true
```

修改 charts 包配置

```bash
# cd gpu-operator
# vim values.yaml
driver:
  version: "570.172.08" # 指定驱动版本号
  upgradePolicy:
    autoUpgrade: true # 自动批量升级所有节点。
    maxParallelUpgrades: 1 # 每次只允许升级1个节点
  drain:
    enable: true # 启用 drain 兜底机制，pod-deletion 失败 → 自动 drain 整个节点兜底
```

更新 charts 包

```bash
# helm upgrade gpu-operator -n gpu-operator . -f values.yaml                  
Release "gpu-operator" has been upgraded. Happy Helming!
NAME: gpu-operator
LAST DEPLOYED: Thu May 21 15:26:16 2026
NAMESPACE: gpu-operator
STATUS: deployed
REVISION: 2
TEST SUITE: None
```

查看节点升级状态

```bash
# kubectl get node -l nvidia.com/gpu.present \
   -ojsonpath='{range .items[*]}{.metadata.name}{"\t"}{.metadata.labels.nvidia\.com/gpu-driver-upgrade-state}{"\n"}{end}'
miaohua-a-79  upgrade-required
```

驱逐miaohua-a-79 节点的 pod 后，对该节点进行升级

```bash
kubectl label node miaohua-a-79 nvidia.com/gpu-driver-upgrade.skip-
```

查看节点状态

```bash
# kubectl get node -l nvidia.com/gpu.present \           
   -ojsonpath='{range .items[*]}{.metadata.name}{"\t"}{.metadata.labels.nvidia\.com/gpu-driver-upgrade-state}{"\n"}{end}'
miaohua-a-79  pod-restart-required
升级完成后，状态会变为 upgrade-done
```

如果某个节点升级失败（状态变为 upgrade-failed）：

```bash
# 1. 查看失败原因
kubectl get events -n default --sort-by='.lastTimestamp' | grep GPUDriverUpgrade

# 2. 查看 operator 日志
kubectl logs -n gpu-operator <gpu-operator-pod-name> | grep controllers.Upgrade

# 3. 修复问题后，重新触发该节点升级
kubectl label node <node-name> nvidia.com/gpu-driver-upgrade-state=upgrade-required --overwrite
```

## GPU 故障隔离
NVIDIA device-plugin 自带健康检查，如果 GPU 出现致命 Xid 错误，会自动把这张卡标记为 unhealthy 并从 `nvidia.com/gpu` 可分配数量里剔除（8 → 7），不需要你手动操作。可以先 `kubectl describe node <node>` 看 `Allocatable` 是否已经变成 7。

```bash
# 进入故障节点
kubectl exec -n gpu-operator nvidia-driver-daemonset-5ggh9 -it -- bash

# 例如GPU0出现故障，查看 GPU 0 详细状态和报错
nvidia-smi -i 0 -q | grep -iE "Xid|ECC|Pending|Retired|Remapped|Failure"
# 或看内核日志里的 Xid
dmesg | grep -i xid
```

从 PCI 层屏蔽这张卡

```bash
# 先拿到 0 号卡的 PCI 地址
# nvidia-smi -i 0 --query-gpu=pci.bus_id --format=csv
pci.bus_id
00000000:3F:00.0
# 在宿主机上把该 PCI 设备从驱动解绑,注意名字转换为小写、4 位域
echo "0000:3f:00.0" > /sys/bus/pci/drivers/nvidia/unbind
```

# GPU 共享访问
## <font style="color:rgb(0, 0, 0);">MIG</font>
### 设置 MIG 策略
GPU Operator 有一个全局的 MIG 策略参数 `mig.strategy`,有三个值:

+ `none`:不启用 MIG(默认)
+ `single`:节点上所有 GPU 使用相同的单一 MIG 配置
+ `mixed`:节点上可以有不同大小的 MIG 实例

```bash
# cd gpu-operator
# vim values.yaml
mig:
  strategy: mixed
# helm upgrade gpu-operator -n gpu-operator . -f values.yaml  
```

### 调整节点 MIG 配置
MIG Manager 是一个 DaemonSet,它只在带有特定标签的节点上执行 MIG 配置。给你想启用 MIG 的节点打上 `nvidia.com/mig.config` 标签:

```bash
# 节点重新切分前需要"清空"GPU。如果有占用 GPU 的工作负载没被驱逐,会卡住或失败
kubectl cordon miaohua-a-79
kubectl drain miaohua-a-79 --ignore-daemonsets --delete-emptydir-data
# 只对 miaohua-a-79 启用,使用名为all-1g.20gb的配置
kubectl label node miaohua-a-79 nvidia.com/mig.config=all-1g.20gb --overwrite
# 查看节点状态，切分完成后会变为 success 状态。
kubectl get node miaohua-a-79 -o jsonpath='{.metadata.labels.nvidia\.com/mig\.config\.state}'
success
# 查看节点切分详情
kubectl exec -it -n gpu-operator nvidia-driver-daemonset-7kg52 -- bash
root@nvidia-driver-daemonset-7kg52:/drivers# nvidia-smi -L
GPU 0: NVIDIA A100-SXM4-80GB (UUID: GPU-15d4f017-b14e-d7cb-4d10-e893a6abd5dc)
  MIG 1g.20gb     Device  0: (UUID: MIG-190b983f-88d5-5629-9434-2a97925f4032)
  MIG 1g.20gb     Device  1: (UUID: MIG-d0bccf56-229a-5d45-8240-5be37f8c109e)
  MIG 1g.20gb     Device  2: (UUID: MIG-e04dfed7-7679-59f8-b433-2a64f0e090d5)
  MIG 1g.20gb     Device  3: (UUID: MIG-e708fb91-6167-569f-aeaf-efa2972b84a7)
GPU 1: NVIDIA A100-SXM4-80GB (UUID: GPU-52343998-21eb-227c-8c39-00888c3b3fe9)
  MIG 1g.20gb     Device  0: (UUID: MIG-6355b262-163b-5784-8836-f90ac1b04ff1)
  MIG 1g.20gb     Device  1: (UUID: MIG-771cb234-32b5-5c94-af35-c6a92f7e8d9d)
  MIG 1g.20gb     Device  2: (UUID: MIG-8fd17408-d140-5092-9511-190c1dd7aa50)
  MIG 1g.20gb     Device  3: (UUID: MIG-dccb859f-07f0-5cae-88ae-5d2ac9a1b133)
GPU 2: NVIDIA A100-SXM4-80GB (UUID: GPU-1cd99017-fe63-22bb-85fa-aa071e9eb433)
  MIG 1g.20gb     Device  0: (UUID: MIG-51ebae14-1d0b-5c95-8498-7717f87f68f9)
  MIG 1g.20gb     Device  1: (UUID: MIG-830229f7-b9dc-5d5a-9870-74ead4eec804)
  MIG 1g.20gb     Device  2: (UUID: MIG-349169e8-c692-5676-a413-33a33b88dfd8)
  MIG 1g.20gb     Device  3: (UUID: MIG-e4acec2a-0a8d-52ed-991f-ef6285fc2a52)
GPU 3: NVIDIA A100-SXM4-80GB (UUID: GPU-1f9fb931-27a2-3212-2d3d-85e51c67fd81)
  MIG 1g.20gb     Device  0: (UUID: MIG-00068245-bd55-5165-8615-f19a06ca04b4)
  MIG 1g.20gb     Device  1: (UUID: MIG-0f05cb62-d5e9-5881-9407-3be3868e69f5)
  MIG 1g.20gb     Device  2: (UUID: MIG-ff7f6a88-e9c6-5fef-a933-f18305ae4fe5)
  MIG 1g.20gb     Device  3: (UUID: MIG-c21419e5-1b23-53c6-996c-43497967ba3e)
GPU 4: NVIDIA A100-SXM4-80GB (UUID: GPU-f229271e-77e5-4684-3134-38d470efe467)
  MIG 1g.20gb     Device  0: (UUID: MIG-7ca41d36-0b9a-59b2-bda4-93720c1d8e69)
  MIG 1g.20gb     Device  1: (UUID: MIG-8cdd21a6-9345-5aaa-b4d3-79d95dbc0f64)
  MIG 1g.20gb     Device  2: (UUID: MIG-b2285199-1e78-550e-b5a4-e425b4662a8f)
  MIG 1g.20gb     Device  3: (UUID: MIG-3f43b723-5b35-5439-b41e-5fe0941e5dc9)
GPU 5: NVIDIA A100-SXM4-80GB (UUID: GPU-40aec4fd-464f-b2b1-a93f-a662102234c4)
  MIG 1g.20gb     Device  0: (UUID: MIG-9a462f05-5405-51a4-8547-9378f6b0dac1)
  MIG 1g.20gb     Device  1: (UUID: MIG-634b9abd-e651-576f-b7a3-7db611eb5950)
  MIG 1g.20gb     Device  2: (UUID: MIG-dbfab35b-4f39-5b75-88ef-e36eb7c9d2c2)
  MIG 1g.20gb     Device  3: (UUID: MIG-ec8239de-36c3-5a6a-9b1a-523ca271fa27)
GPU 6: NVIDIA A100-SXM4-80GB (UUID: GPU-86534461-ea76-ca1e-e748-bf553578228b)
  MIG 1g.20gb     Device  0: (UUID: MIG-504a21bb-6369-58a5-ab73-060d2d3821bb)
  MIG 1g.20gb     Device  1: (UUID: MIG-f668eb35-c275-5014-bd7a-a056849c358b)
  MIG 1g.20gb     Device  2: (UUID: MIG-4aa6cc1d-bf8e-5346-8a56-e193889e314f)
  MIG 1g.20gb     Device  3: (UUID: MIG-ebc8f9fb-127d-56b7-b85f-18595c057ca1)
GPU 7: NVIDIA A100-SXM4-80GB (UUID: GPU-2545335d-3baa-188c-36b5-f645e39e1923)
  MIG 1g.20gb     Device  0: (UUID: MIG-1cb6c93b-53c0-58d7-a9f4-984e59a59034)
  MIG 1g.20gb     Device  1: (UUID: MIG-d3a39972-68ed-5380-9c1c-a022b0447eb3)
  MIG 1g.20gb     Device  2: (UUID: MIG-16af1924-146f-57ab-8224-11176bbec1e3)
  MIG 1g.20gb     Device  3: (UUID: MIG-97fd2f1e-214f-5eb6-a21b-66c3fb251ce9)
```

其他没有打这个标签的节点 不会 被切分,保持整卡模式。这就是"指定节点启用 MIG"的本质。

`nvidia.com/mig.config` 的值来自一个 ConfigMap(默认叫 `default-mig-parted-config`)。常见内置值(以 A100 80GB 为例):

| Profile 名 | 计算(g) | 显存 | 单卡最多实例数 | 用途 |
| --- | --- | --- | --- | --- |
| `all-1g.10gb` | 1/7 | 10GB | 7 | 最小粒度,轻量推理/多租户 |
| `all-1g.20gb` | 1/7 | 20GB | 4 | 算力小但需要更大显存 |
| `all-2g.20gb` | 2/7 | 20GB | 3 | 中等推理 |
| `all-3g.40gb` | 3/7 | 40GB | 2 | 较大模型推理/小训练 |
| `all-4g.40gb` | 4/7 | 40GB | 1 | 大算力单实例 |
| `all-7g.80gb` | 7/7 | 80GB | 1 | 等于整卡(MIG 模式下) |
| `all-disabled` | - | - | - | 关闭 MIG,恢复整卡 |


查看可用配置:

```bash
kubectl get configmap default-mig-parted-config -n gpu-operator -o yaml
```

### 自定义 MIG 切分
如果内置配置不满足需求,可以编辑 ConfigMap 自定义,例如混合切分:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: custom-mig-config
  namespace: gpu-operator
data:
  config.yaml: |
    version: v1
    mig-configs:
      gpu0-only:
        # 0 号卡:切成 4g.40gb×1 + 2g.20gb×1 + 1g.20gb×1
        - devices: [0]
          mig-enabled: true
          mig-devices:
            "4g.40gb": 1
            "2g.20gb": 1
            "1g.20gb": 1
        # 1-7 号卡:不切,保持整卡
        - devices: [1, 2, 3, 4, 5, 6, 7]
          mig-enabled: false
```

创建策略并应用

```bash
# 创建ConfigMap
kubectl apply -f custom-mig-config.yaml
# 让 Operator 使用它
helm upgrade gpu-operator nvidia/gpu-operator -n gpu-operator \
  --reuse-values \
  --set migManager.config.name=custom-mig-config
# 给节点打标签
kubectl label node miaohua-a-79 nvidia.com/mig.config=gpu0-only --overwrite
# 等待并验证
kubectl get node miaohua-a-79 -o jsonpath='{.metadata.labels.nvidia\.com/mig\.config\.state}'
success# 
```

查看节点 mig 状态

```bash
# kubectl exec -it -n gpu-operator nvidia-driver-daemonset-7kg52 -- bash
root@nvidia-driver-daemonset-7kg52:/drivers# nvidia-smi -L
GPU 0: NVIDIA A100-SXM4-80GB (UUID: GPU-15d4f017-b14e-d7cb-4d10-e893a6abd5dc)
  MIG 4g.40gb     Device  0: (UUID: MIG-5efd26fe-37b7-5950-8ea2-a3720583947d)
  MIG 2g.20gb     Device  1: (UUID: MIG-07dc60d2-2f24-5146-8438-170ff45dfada)
  MIG 1g.20gb     Device  2: (UUID: MIG-db5655e4-86b1-50f3-ab0e-c1c8607c1bfa)
GPU 1: NVIDIA A100-SXM4-80GB (UUID: GPU-52343998-21eb-227c-8c39-00888c3b3fe9)
GPU 2: NVIDIA A100-SXM4-80GB (UUID: GPU-1cd99017-fe63-22bb-85fa-aa071e9eb433)
GPU 3: NVIDIA A100-SXM4-80GB (UUID: GPU-1f9fb931-27a2-3212-2d3d-85e51c67fd81)
GPU 4: NVIDIA A100-SXM4-80GB (UUID: GPU-f229271e-77e5-4684-3134-38d470efe467)
GPU 5: NVIDIA A100-SXM4-80GB (UUID: GPU-40aec4fd-464f-b2b1-a93f-a662102234c4)
GPU 6: NVIDIA A100-SXM4-80GB (UUID: GPU-86534461-ea76-ca1e-e748-bf553578228b)
GPU 7: NVIDIA A100-SXM4-80GB (UUID: GPU-2545335d-3baa-188c-36b5-f645e39e1923)
```

### MIG兼容性
| **共享方式** | **允许的 mig-strategy** |
| :--- | :--- |
| Time-Slicing | none / single / mixed 都行 |
| **MPS** | **只能 none 或 single**(不支持 mixed) |
| MIG 本身用 mixed 切分 | mixed |


```bash
# vim values.yaml
mig:
  strategy: none
# helm upgrade gpu-operator -n gpu-operator . -f values.yaml  
```

## <font style="color:rgb(0, 0, 0);">CUDA timeslice</font>
### 创建Time-Slicing策略
默认不共享+指定Time-Slicing

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: time-slicing-config
  namespace: gpu-operator
data:
  # 默认:不共享(不写 sharing 段即可,等于普通整卡)
  no-sharing: |-
    version: v1
    flags:
      migStrategy: none

  # 指定节点用:每卡 4 份
  shared-4: |-
    version: v1
    flags:
      migStrategy: none
    sharing:
      timeSlicing:
        resources:
          - name: nvidia.com/gpu
            replicas: 4
```

### 启用Time-Slicing
```bash
# kubectl apply -f time-slicing-config.yaml
configmap/time-slicing-config created
# helm upgrade gpu-operator nvidia/gpu-operator -n gpu-operator \
  --reuse-values \
  --set devicePlugin.config.name=time-slicing-config \
  --set devicePlugin.config.default=no-sharing
```

+ `config.name`:刚创建的 ConfigMap。
+ `config.default`:默认使用哪个策略，此处指定所有没打标签的节点都不开共享。

### 指定节点打标签
```bash
kubectl label node miaohua-a-79 nvidia.com/device-plugin.config=shared-4 --overwrite
```

### 访问验证
```bash
# kubectl describe node miaohua-a-79 | grep -E "nvidia.com/gpu:|sharing-strategy|replicas"
                    nvidia.com/gpu.replicas=4
                    nvidia.com/gpu.sharing-strategy=time-slicing
  nvidia.com/gpu:          32
  nvidia.com/gpu:          32
```

每张物理 GPU 上报成 4 个可分配单位，该节点共计可使用8 张物理卡 × 4 个时间片副本，接下来创建32 副本的 deployment ，每个容器只要 1 个 GPU,这样就能直观看到"超分"——32 个 Pod 全部 Running 在仅有的 8 张物理卡上。

```bash
# cat cuda-ts-test.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: cuda-ts-test
  namespace: default
spec:
  replicas: 32
  selector:
    matchLabels:
      app: cuda-ts-test
  template:
    metadata:
      labels:
        app: cuda-ts-test
    spec:
      nodeSelector:
        kubernetes.io/hostname: miaohua-a-79   # 锁定到这台开了 time-slicing 的节点
      containers:
        - name: cuda
          image: swr.cn-north-4.myhuaweicloud.com/ddn-k8s/docker.io/nvidia/cuda:12.4.1-devel-ubuntu22.04
          imagePullPolicy: IfNotPresent
          command:
            - /bin/bash
            - -c
            - |
              sleep infinity
          resources:
            limits:
              nvidia.com/gpu: 1
            requests:
              nvidia.com/gpu: 1
          tty: true
          stdin: true
# kubectl apply -f cuda-ts-test.yaml  
configmap/custom-mig-config unchanged
# kubectl get pod -l app=cuda-ts-test -o wide |grep miaohua-a-79 | wc -l
32
```

## CUDA MPS
整体流程和 time-slicing 几乎一样,只是把配置里的 `timeSlicing` 换成 `mps`。MPS 的好处是并发执行 + 可限制每个客户端的显存(不像 time-slicing 那样裸共享)。

### 创建 MPS 策略
默认不共享+指定 MPS

```yaml
# cat mps-config.yaml 
apiVersion: v1
kind: ConfigMap
metadata:
  name: mps-config
  namespace: gpu-operator
data:
  # 默认:不共享(不写 sharing 段,等于普通整卡)
  no-sharing: |-
    version: v1
    flags:
      migStrategy: none

  # 指定节点用:每卡 MPS 切 4 份
  mps-4: |-
    version: v1
    flags:
      migStrategy: none
    sharing:
      mps:
        resources:
          - name: nvidia.com/gpu
            replicas: 4
# kubectl apply -f mps-config.yaml 
```

### 启用 MPS
```bash
# helm upgrade gpu-operator nvidia/gpu-operator -n gpu-operator \
  --reuse-values \
  --set devicePlugin.config.name=mps-config \
  --set devicePlugin.config.default=no-sharing
```

+ `config.default`:默认使用哪个策略，此处指定所有没打标签的节点都不开共享。

接下来把 mps-4 设为默认配置

```bash
# 确认 ClusterPolicy 名字
# kubectl get clusterpolicy
NAME             STATUS   AGE
cluster-policy   ready    2026-06-29T03:33:57Z
# 把默认配置改成 mps-4
# kubectl patch clusterpolicy cluster-policy --type merge \
  -p '{"spec":{"devicePlugin":{"config":{"default":"mps-4"}}}}'
```

### 指定节点打标签
```bash
# 想 MPS 切 4 份的节点，打 mps-4
kubectl label node miaohua-a-79 nvidia.com/device-plugin.config=mps-4 --overwrite

# 想整卡不共享的节点，显式打 no-sharing
kubectl label node <节点名> nvidia.com/device-plugin.config=no-sharing --overwrite
```

### 访问验证
```bash
# kubectl describe node miaohua-a-79 | grep -E "nvidia.com/gpu:|sharing-strategy|replicas|mps.capable"
                    nvidia.com/gpu.replicas=4
                    nvidia.com/gpu.sharing-strategy=mps
                    nvidia.com/mps.capable=true
  nvidia.com/gpu:     32
  nvidia.com/gpu:     32
```


