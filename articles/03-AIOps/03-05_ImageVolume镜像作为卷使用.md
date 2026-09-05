# ImageVolume镜像作为卷使用

> 分类：AIOPS / 第3章：大模型 AI Infra 运维
> 原文：https://www.cuiliangblog.cn/detail/section/280777393
> 来源：崔亮的博客

---

# ImageVolume简介
## 什么是ImageVolume
在 Kubernetes 中，容器的 `image` 通常代表容器运行所使用的镜像。例如：

```yaml
containers:
  - name: nginx
    image: nginx:1.29
```

容器启动后，镜像中的文件系统会作为容器自身的根文件系统使用。

而 ImageVolume 提供了一种不同的使用方式：将 OCI 镜像中的文件内容作为 Volume 挂载到容器中。

简单来说，可以理解为：

![画板](assets/03-AIOps/add56d74c388e1c6c302.jpeg)

ImageVolume 的核心思想就是把“镜像”从单纯的容器运行环境，进一步变成一种可挂载的文件分发载体。

## 为什么需要ImageVolume
在 Kubernetes 中，如果只是需要向容器提供一些文件，传统上有很多方式，例如：

+  ConfigMap 
+  Secret 
+  emptyDir 
+  PVC 
+  hostPath 
+  对象存储 
+  在容器镜像中直接打包文件 

但这些方案各有一定限制。

例如，在 AI 推理和训练场景中，模型文件通常是应用运行过程中非常重要的一部分。例如一个大模型可能包含：

```bash
/model
├── config.json
├── tokenizer.json
├── tokenizer_config.json
├── model-00001-of-00008.safetensors
├── model-00002-of-00008.safetensors
├── ...
└── model-00008-of-00008.safetensors
```

模型文件可能达到几十 GB 甚至数百 GB。如何将这些模型快速、稳定地分发到 Kubernetes Pod，一直是 AI 容器化部署中的一个问题。目前传统的方式通常有以下几种：

### 方式一：直接将模型打包到业务镜像
直接在 dockerfile 中 COPY 模型文件，使得打包后的 Docker 镜像包含模型文件数据。

![画板](assets/03-AIOps/045cf32dc1bd0bfa88a6.jpeg)

这种方式比较简单，但存在一个明显问题：模型和应用强耦合。

当模型从 `model-v1` 更新到 `model-v2` 时，即使 vLLM 和业务代码完全没有变化，也需要重新构建一个新的业务镜像。

对于几十 GB 甚至数百 GB 的模型来说，这会导致：

+ 镜像体积非常大 
+ 构建时间长 
+ 镜像单层最大 20G
+ 镜像推送耗时 
+ Registry 存储成本增加 
+ 模型更新与业务镜像发布流程耦合

### 方式二：使用 PVC 保存模型
创建 SC、PV、PVC 资源，并将模型文件放入存储服务中，通过挂载存储资源实现访问模型文件。

![画板](assets/03-AIOps/ff5040eaf4336d867b63.jpeg)

这种方式可以解决模型与业务镜像耦合的问题，但在大规模 AI 集群中也会面临一些问题，例如需要大量启动推理 pod 过程时，需要考虑：

+ PVC 后端存储性能
+ PVC 无法跨 namespace 使用
+ 多 Pod 并发读取模型的能力 
+ 跨节点访问网络 
+ 模型加载速度 
+ 存储系统容量 
+ 模型版本管理

尤其是分布式训练或者大规模推理场景，模型文件可能需要被多个节点同时读取，对底层存储系统的吞吐能力提出了较高要求。

### 方式三：使用 hostpath 挂载 FS 存储
在 GPU 节点上挂载共享文件系统（FS），然后通过 `hostPath` 将节点上的目录挂载到 Pod 中。

![画板](assets/03-AIOps/f91a904a7cd929a352c0.jpeg)

这种方式虽然也可以解决模型与业务镜像耦合的问题，但HostPath 依赖 Node 本地路径，而 Kubernetes 本身并不知道这个路径背后的 FS 是什么，使用 HostPath 时，通常还需要额外解决：

+ 所有目标节点提前挂载 FS
+ 节点目录保持一致 
+ 节点故障后的重新挂载 
+ Pod 调度与节点模型数据的关系 
+ FS 网络和性能 
+ FS 挂载的运维问题

虽然通过 FS 实现多个节点可以直接访问同一份模型数据，这对于几百 GB 甚至 TB 级模型比较有吸引力。但模型存储和节点强绑定，需要提前在节点上完成 FS 挂载，并保证节点环境的一致性。

## ImageVolume 使用场景
在 AI 推理场景中，推理框架和模型权重的更新节奏通常并不一致。例如：

+ vLLM 可能从 `v0.10` 升级到 `v0.11`
+ 同一个模型可能存在 `v1`、`v2`、`v3` 多个权重版本 
+ 不同模型可能需要使用不同版本的推理框架 
+ 模型权重通常体积较大，需要频繁进行模型升级迭代

而ImageVolume 则可以将推理框架和模型权重进行拆分，分别将不同版本的推理镜像和模型权重镜像推送至镜像仓库，然后根据实际业务需求灵活组合，实现推理框架和模型权重解耦。

![画板](assets/03-AIOps/860cd2ad16029058c3e4.jpeg)

在 AI 推理场景中，可以将 ImageVolume 与三种比较常见的方式进行对比。

| 方案 | 模型存储位置 | 模型与推理镜像 | 版本管理 | 多节点分发 | 模型更新 | 主要问题 |
| --- | --- | --- | --- | --- | --- | --- |
| 模型打包业务镜像 | 镜像仓库 | 强耦合 | 镜像 Tag | 镜像分发 | 需要重新构建镜像 | 镜像大、构建慢 |
| PVC | PVC/存储系统 | 解耦 | 依赖存储/业务管理 | 依赖存储能力 | 更新存储中的模型 | 存储成本和性能压力 |
| HostPath + FS | FS | 解耦 | 需要额外管理 | FS 负责 | 更新 FS | 节点依赖、运维复杂 |
| ImageVolume | 镜像仓库 | 解耦 | 镜像 Tag/Digest | 镜像分发 | 切换模型镜像 | 首次拉取模型速度慢，可以使用Dragonfly的 P2P 分发解决。 |


## 版本发展历史
| 阶段 | K8s 版本 | 发布时间 | Feature Gate 默认值 | 说明 |
| --- | --- | --- | --- | --- |
| Alpha | v1.31 | 2024-08 | `false` | 需要手动开启 Feature Gate |
| Beta（默认关） | v1.33 | 2025-04 | `false` | Beta 代码合入但仍默认关闭 |
| Beta（默认关） | v1.34 | 2025-08 | `false` | 移除 noexec 限制，仍默认关闭 |
| Beta（默认开） | v1.35 | 2025-12 | `true` | 首次默认启用 |
| GA | v1.36 | 2026-04 | `true`<br/>（锁定） | Feature Gate 锁定，v1.39 移除 |


# ImageVolume 原理与发展历程
ImageVolume 并不是突然出现的一个 Kubernetes 新功能，而是 OCI 生态逐步演进之后，在 Kubernetes 中自然延伸出来的一种使用方式。要理解 ImageVolume，那就需要先要理解 OCI。

## OCI 解决“容器怎么标准化”
OCI（Open Container Initiative）是 2015 年在 Linux 基金会支持下成立的开放项目。Docker、CoreOS（后被 Red Hat 收购）以及容器领域的主要厂商共同参与，目标是围绕容器镜像格式和容器运行时建立开放、统一的行业标准。

在 OCI 成立之前，容器生态以 Docker 为主，不同容器工具之间存在一定的格式和实现绑定。Docker 随后将自己的容器镜像格式和 `libcontainer` 等核心技术贡献给社区，在此基础上逐步形成了 OCI 的三大核心规范：

+ Image Specification：定义容器镜像的格式和结构
+ Runtime Specification：定义容器运行时应该如何运行容器
+ Distribution Specification：定义镜像如何通过 Registry 进行分发

![画板](assets/03-AIOps/2b170cac73f4b72ce58b.jpeg)

2017 年，OCI Image Specification v1.0 发布，容器镜像的基本格式逐渐稳定下来。

在 OCI 标准下，一个典型的容器运行流程可以抽象为：

![画板](assets/03-AIOps/366a19f61106faafd8bb.jpeg)

也就是说，OCI Image 本质上描述的是一个标准化的文件系统内容，而 OCI Runtime 负责按照标准将这些内容运行起来。

与此同时，Docker 也将 `libcontainer` 的实现贡献给 OCI，并最终形成了现在广泛使用的 `runc`。有了 OCI 标准之后，镜像格式、Registry 和 Runtime 之间不再需要绑定在 Docker 这一套实现上。

这也是 Kubernetes 后来能够使用 containerd、CRI-O 等不同容器运行时，而不需要依赖 Docker 的重要基础。

## OCI 发现“Image 不一定只用来跑容器”
### OCI Image
要理解 ImageVolume，首先需要明确一个问题，OCI Image 到底是什么？

从结构上来看，一个 OCI Image 组成结构如下

![画板](assets/03-AIOps/8524a372713b11d03f3b.jpeg)

其中 Layer 本质上是一组文件系统变更，多个 Layer 按顺序叠加后，就可以形成一个完整的文件系统。

所以从更底层的角度来看：OCI Image 并不天然等于“一个可以运行的容器”，它首先是一种标准化的文件系统内容及其元数据描述。

只是最开始 OCI Image 最主要的使用场景，就是作为 Container RootFS。

### OCI Artifacts
随着 OCI 生态的发展，社区逐渐发现一个问题：如果 OCI Image 本质上是“内容 + 元数据 + 分发机制”，那么为什么一定要把它限制在容器场景？

OCI Registry 本身具备很多非常有价值的能力：

+ 内容寻址
+ Digest 校验
+ Layer 去重
+ 版本管理
+ 权限控制
+ 镜像缓存
+ 高效分发
+ 跨节点复用

这些能力实际上并不只适用于容器镜像。

因此，社区开始尝试把 OCI Registry 当成一个通用内容分发平台。

最早很多项目采用的是“伪装”的方式：把非容器内容包装成一个看起来像容器镜像的 OCI Artifact，然后存进 Registry。

其中比较典型的实践包括：

+ Helm：支持将 Helm Chart 推送到 OCI Registry
+ Cosign：利用 OCI Registry 存储镜像签名等关联数据
+ ORAS（OCI Registry As Storage）：进一步将 OCI Registry 抽象成通用的 Artifact 存储和分发平台，可以存储 WASM、策略文件、模型等各种内容

这些实践逐渐证明了一件事情：

OCI Registry 完全可以从“容器镜像仓库”演变成“通用 Artifact 仓库”。

这也反过来推动了 OCI 规范本身的发展。

### OCI Image Spec 1.1
早期 OCI Image Specification 中，很多字段和语义都是围绕“容器镜像”设计的。

随着 Helm、Cosign、ORAS 等项目不断使用 OCI Registry 存储非容器内容，OCI 需要解决一个问题：

Registry 里面的这个东西，到底是不是一个 Container Image？如果不是，它到底是什么？

因此，OCI Image Specification v1.1 在 2024 年正式发布，引入了 `artifactType` 等能力，使 Manifest 可以明确声明 Artifact 的类型。

例如：

```plain
Manifest
├── mediaType
├── artifactType
├── config
└── layers
```

这样 OCI Artifact 就可以明确表达：

```plain
artifactType
├── Container Image
├── Helm Chart
├── Signature
├── SBOM
├── Model
└── Other Artifact
```

这意味着 OCI Registry 中存储的内容不再需要“伪装成容器镜像”。

OCI 从“容器镜像标准”，逐渐演变成了更通用的内容打包、描述和分发标准。

## Docker Hub Model：OCI 在大模型领域的实践
随着大模型的发展，这种“把模型作为 Artifact 存储和分发”的思路开始真正进入生产实践。

Docker Hub 已经提供了专门的 Model 类型，并上线了包括 `ai/gemma4`、`ai/gemma3`、`ai/qwen3` 等模型。Docker 官方明确将这些模型作为 OCI artifacts 进行打包和分发。

![](assets/03-AIOps/c18253b87d655f907895.png)

Docker 官方在 Gemma 4 的发布中也明确将模型描述为 OCI artifacts，并强调模型因此能够获得类似容器镜像的版本管理、共享、分发以及与现有 CI/CD、安全和权限体系的集成能力。

从这个角度来看，Docker Hub Model 可以看作 OCI 从“容器镜像分发”向“大模型 Artifact 分发”演进的一个典型实践。

## Kubernetes 进一步让“Image 成为 Volume”
到这里，OCI 已经解决了：

如何标准化地打包和分发各种内容。

但 Kubernetes 还有一个问题：

这些 OCI Artifact 到了 Kubernetes 里面，怎么被 Pod 使用？

传统情况下，OCI Image 在 Kubernetes 中的角色非常明确：

![画板](assets/03-AIOps/63597fcaeb8ffc8aa046.jpeg)

例如：

```yaml
containers:
  - name: inference
    image: registry.example.com/vllm:latest
```

Image 主要就是作为 Container 的 RootFS。

而如果希望把一个 OCI Image 中的文件直接提供给容器，就需要另外一种机制。

这就是 ImageVolume。

ImageVolume 的核心思想非常简单：

把 OCI Image 作为 Volume 的数据源，而不是作为 Container Image。

例如：

```yaml
apiVersion: v1
kind: Pod
spec:
  containers:
    - name: inference
      image: registry.example.com/vllm:latest
      volumeMounts:
        - name: model
          mountPath: /models

  volumes:
    - name: model
      image:
        reference: registry.example.com/models/qwen:32b
```

这里实际上存在两个完全不同的 OCI Image：

```plain
Pod
│
├── Container Image （用于运行应用）
│     └── vllm:latest
│
└── ImageVolume （用于提供文件系统内容）
      └── qwen:32b
```

最终容器看到：

```plain
/
├── ...
└── models/
      ├── config.json
      ├── tokenizer.json
      ├── model-00001.safetensors
      └── model-00002.safetensors
```

# ImageVolume使用
## 环境要求
+ Kubernetes >= v1.36
+ Container Runtime：
    - containerd >= v2.1.0
    - CRI-O >= v1.31（subPath 需要 >= v1.34）

## 构建镜像
构建一个 qwen 模型权重镜像，包含 qwen3.6-27b 和 qwen3.8-27b 两个模型。（最佳实践应该是每个模型一个目录，对应一个镜像，此处是为了方便演示subPath

）

```bash
# 创建目录结构
# mkdir -p /opt/qwen/models/{qwen3.6-27b,qwen3.8-27b}

# 拉取模型权重,可以直接从魔搭社区拉取，命令如下
# modelscope download --model Qwen/Qwen3.6-27B --local_dir /opt/qwen/models/qwen3.6-27b --max-workers=20
# modelscope download --model Qwen/Qwen3.8-27B --local_dir /opt/qwen/models/qwen3.8-27b --max-workers=20

# 为方便演示，创建测试文件充当模型文件
# echo "qwen3.6-27b" > /opt/qwen/qwen3.6-27b/models/model-qwen3.6-27b.safetensors
# echo "qwen3.8-27b" > /opt/qwen/qwen3.8-27b/models/model-qwen3.8-27b.safetensors

# 创建 Dockerfile
# vim Dockerfile
FROM scratch
COPY ./models /models
```

目录结构如下：

```bash
# tree /opt/qwen
/opt/qwen
├── Dockerfile
└── models
    ├── qwen3.6-27b
    │   └── model-qwen3.6-27b.safetensors
    └── qwen3.8-27b
        └── model-qwen3.8-27b.safetensors
```

构建并推送到镜像仓库：

```bash
docker build -t registry-cn-beijing.cr.volces.com/model/qwen:v1 .
docker push registry-cn-beijing.cr.volces.com/model/qwen:v1
```

## 挂载使用
创建 Pod 挂载这个镜像：

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: image-volume-demo
  labels:
    name: image-volume-demo
spec:
  containers:
  - name: image-volume-demo
    image: swr.cn-north-4.myhuaweicloud.com/ddn-k8s/quay.io/prometheus/busybox:latest
    command:
      - /bin/sh
      - -c
      - "while true; do sleep 3600; done"
    volumeMounts:
      - name: model-volume
        mountPath: /data
        readOnly: true
  volumes:
    - name: model-volume
      image:
        reference: registry-cn-beijing.cr.volces.com/model/qwen:v1
```

等 Pod Running 后查看挂载内容，镜像中的模型权重已挂载：

```bash
# kubectl apply -f c.yaml 
pod/image-volume-demo created

# kubectl get pod image-volume-demo
NAME                READY   STATUS    RESTARTS   AGE
image-volume-demo   1/1     Running   0          55s

# kubectl exec -it image-volume-demo -- sh
/ # tree /data
/data
└── models
    ├── qwen3.6-27b
    │   └── model-qwen3.6-27b.safetensors
    └── qwen3.8-27b
        └── model-qwen3.8-27b.safetensors
```

镜像里的文件都挂载进来了，跟预期一致。

## subPath 挂载
上面那个镜像里放了两个模型目录，如果 Pod 只需要qwen3.8-27b，不需要把整个镜像都挂进来，用 subPath 就行：

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: image-volume-demo
  labels:
    name: image-volume-demo
spec:
  containers:
  - name: image-volume-demo
    image: swr.cn-north-4.myhuaweicloud.com/ddn-k8s/quay.io/prometheus/busybox:latest
    command:
      - /bin/sh
      - -c
      - "while true; do sleep 3600; done"
    volumeMounts:
      - name: model-volume
        mountPath: /data
        subPath: /models/qwen3.8-27b
        readOnly: true
  volumes:
    - name: model-volume
      image:
        reference: registry-cn-beijing.cr.volces.com/model/qwen:v1
```

验证一下，挂载目录里只有qwen3.8-27b的内容：

```bash
# kubectl exec -it image-volume-demo -- sh
/ # tree /data
/data
└── model-qwen3.8-27b.safetensors
```

# 注意事项
## 只读挂载
ImageVolume 挂载是只读的，尝试写入会报 `Read-only file system`：

```bash
# kubectl exec image-volume-demo -- sh -c 'echo test > /models/test.txt'
sh: can't create /models/test.txt: Read-only file system
```

如果需要运行时修改文件还是得用 PVC，目前没有读写支持的 KEP。

## 使用digest
Pod 重建时 ImageVolume 会重新解析远端镜像，所以生产环境建议用 digest 而不是 tag 引用镜像，避免 Pod 重建后 tag 被覆盖导致拿到非预期版本。


