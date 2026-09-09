---
title: k8s诊断与故障排除宝典-Kubernetes运维必备
---

**这篇文章是一份全面的指南，旨在帮助用户使用 `kubectl` 命令行工具来诊断 Kubernetes 集群中的各种问题，覆盖了从基础的集群信息获取到复杂的故障排除场景，包括但不限于以下几个方面：**

- **集群信息**：获取 Kubernetes 版本、集群信息、节点列表、命名空间等关键信息。
- **Pod 诊断**：列出和描述特定命名空间中的 Pods，查看 Pod 日志，以及在 Pod 中执行命令。
- **服务诊断**：检查服务的列表和详情，确保服务的正常运行。
- **部署诊断**：监控 Deployment 的状态，查看滚动更新的历史和状态。
- **网络诊断**：诊断网络相关问题，包括 Pod 的 IP 地址、网络策略等。
- **持久卷和持久卷声明诊断**：检查 Persistent Volumes (PV) 和 Persistent Volume Claims (PVC) 的状态。
- **资源使用情况**：监控资源使用情况，包括 Pod 和节点的资源消耗。
- **安全和授权**：涉及 RBAC、服务账号、Pod 安全策略等安全相关的命令。
- **节点故障排除**：诊断节点相关的问题，如节点状态、资源分配等。
- **其他诊断命令**：包括资源扩展、自动扩展、作业和定时作业、Pod 亲和性和反亲和性规则、服务账号诊断、节点排空和取消排空、资源清理等高级命令。

**这些命令是 Kubernetes 管理员和开发者在进行集群管理和故障排除时的宝贵资源。通过这些命令，用户可以更有效地诊断和解决集群中出现的问题。**  

### 一、集群信息查询

- `kubectl version`：显示 K8s 版本。
- `kubectl cluster-info`：显示集群信息。
- `kubectl get nodes`：列出集群中的所有节点。
- `kubectl get namespaces`：列出所有命名空间。
- `kubectl get pods -A`：列出所有命名空间中的所有 pod。
- `kubectl describe node <节点名>`：查看一个具体的节点详情。

### 二、Pod 诊断

- `kubectl get pods -n <命令空间>`：列出特定命名空间中的 pod。
- `kubectl describe pod <pod-name> -n <命令空间>`：查看一个 Pod 详情。
- `kubectl logs <pod-name> -n <命令空间>`：查看 Pod 日志。
- `kubectl logs -f <pod-name> -n <命令空间>`：尾部 Pod 日志。
- `kubectl exec -it <pod-name> -n <命令空间> -- <command>`：在 pod 中执行命令。
- `kubectl get pods <pod-name> -n <命令空间> -o jsonpath='{.status.conditions[?(@.type=="Ready")].status}'`：检查 Pod 准备情况。
- `kubectl get events -n <命令空间> --field-selector involvedObject.name=<pod-name>`：检查 Pod 事件。

### 三、Pod 健康检查

- `kubectl get pods <pod-name> -n <命令空间> -o jsonpath='{.status.conditions[?(@.type=="Ready")].status}'`：检查 Pod 准备情况。
- `kubectl get events -n <命令空间> --field-selector involvedObject.name=<pod-name>`：检查 Pod 事件。

### 四、Service 诊断

- `kubectl get svc -n <命令空间>`：列出命名空间中的所有服务。
- `kubectl describe svc <service-name> -n <命令空间>`：查看一个服务详情。

### 五、Deployment 诊断

- `kubectl get deployments -n <命令空间>`：列出命名空间中的所有 Deployment。
- `kubectl describe deployment <deployment-name> -n <命令空间>`：查看一个 Deployment 详情。
- `kubectl rollout status deployment/<deployment-name> -n <命令空间>`：查看滚动发布状态。
- `kubectl rollout history deployment/<deployment-name> -n <命令空间>`：查看滚动发布历史记录。

### 六、StatefulSet 诊断

- `kubectl get statefulsets -n <命令空间>`：列出命名空间中的所有 StatefulSet。
- `kubectl describe statefulset <statefulset-name> -n <命令空间>`：查看一个 StatefulSet 详情。

### 七、ConfigMap 和 Secret 诊断

- `kubectl get configmaps -n <命令空间>`：列出命名空间中的 ConfigMap。
- `kubectl describe configmap <configmap-name> -n <命令空间>`：查看一个 ConfigMap 详情。
- `kubectl get secrets -n <命令空间>`：列出命名空间中的 Secret。
- `kubectl describe secret <secret-name> -n <命令空间>`：查看一个 Secret 详情。

### 八、命名空间诊断

- `kubectl describe namespace <namespace-name>`：查看一个命名空间详情。

### 九、资源使用情况

- `kubectl top pod <pod-name> -n <命令空间>`：检查 pod 的资源使用情况。
- `kubectl top nodes`：检查节点资源使用情况。

### 十、网络诊断

- `kubectl get pods -n <命令空间> -o custom-columns=POD:metadata.name,IP:status.podIP --no-headers`：显示命名空间中 Pod 的 IP 地址。
- `kubectl get networkpolicies -n <命令空间>`：列出命名空间中的所有网络策略。
- `kubectl describe networkpolicy <network-policy-name> -n <命令空间>`：查看一个网络策略详情。

### 十一、持久卷 (PV) 和持久卷声明 (PVC) 诊断

- `kubectl get pv`：列出 PV。
- `kubectl describe pv <pv-name>`：查看一个 PV 详情。
- `kubectl get pvc -n <命令空间>`：列出命名空间中的 PVC。
- `kubectl describe pvc <pvc-name> -n <命令空间>`：查看 PVC 详情。

### 十二、节点诊断

- `kubectl get pods --field-selector spec.nodeName=<节点名> -n <命令空间>`：获取特定节点上运行的 Pod 列表。

### 十三、资源配额和限制

- `kubectl get resourcequotas -n <命令空间>`：列出命名空间中的资源配额。
- `kubectl describe resourcequota <resource-quota-name> -n <命令空间>`：查看一个资源配额详情。

### 十四、自定义资源定义 (CRD) 诊断

- `kubectl get <custom-resource-name> -n <命令空间>`：列出命名空间中的自定义资源。
- `kubectl describe <custom-resource-name> <custom-resource-instance-name> -n <命令空间>`：查看自定义资源详情。

### 十五、资源伸缩和自动伸缩

- `kubectl scale deployment <deployment-name> --replicas=<replica-count> -n <命令空间>`：Deployment 伸缩。
- `kubectl autoscale deployment <deployment-name> --min=<min-pods> --max=<max-pods> --cpu-percent=<cpu-percent> -n <命令空间>`：设置 Deployment 的自动伸缩。
- `kubectl get hpa -n <命令空间>`：检查水平伸缩器状态。

### 十六、作业和 CronJob 诊断

- `kubectl get jobs -n <命令空间>`：列出命名空间中的所有作业。
- `kubectl describe job <job-name> -n <命令空间>`：查看一份工作详情。
- `kubectl get cronjobs -n <命令空间>`：列出命名空间中的所有 cron 作业。
- `kubectl describe cronjob <cronjob-name> -n <命令空间>`：查看一个 cron 作业详情。

### 十七、容量诊断

- `kubectl get pv --sort-by=.spec.capacity.storage`：列出按容量排序的持久卷 (PV)。
- `kubectl get pv <pv-name> -o=jsonpath='{.spec.persistentVolumeReclaimPolicy}'`：查看 PV 回收策略。
- `kubectl get storageclasses`：列出所有存储类别。

### 十八、Ingress 和服务网格诊断

- `kubectl get ingress -n <命令空间>`：列出命名空间中的所有 Ingress。
- `kubectl describe ingress <ingress-name> -n <命令空间>`：查看一个 Ingress 详情。
- `kubectl get virtualservices -n <命令空间>`：列出命名空间中的所有 VirtualServices (Istio)。
- `kubectl describe virtualservice <virtualservice-name> -n <命令空间>`：查看一个 VirtualService (Istio)详情。

### 十九、Pod 网络故障排除

- `kubectl run -it --rm --restart=Never --image=busybox net-debug-pod -- /bin/sh`：运行网络诊断 Pod（例如 busybox）进行调试。
- `kubectl exec -it <pod-name> -n <命令空间> -- curl <endpoint-url>`：测试从 Pod 到特定端点的连接。
- `kubectl exec -it <source-pod-name> -n <命令空间> -- traceroute <destination-pod-ip>`：跟踪从一个 Pod 到另一个 Pod 的网络路径。
- `kubectl exec -it <pod-name> -n <命令空间> -- nslookup <domain-name>`：检查 Pod 的 DNS 解析。

### 二十、配置和资源验证

- `kubectl apply --dry-run=client -f <yaml-file>`：验证 Kubernetes YAML 文件而不应用它。
- `kubectl auth can-i list pods --as=system:serviceaccount:<命令空间>:<serviceaccount-name>`：验证 pod 的安全上下文和功能。

### 二十一、RBAC 和安全性

- `kubectl get roles,rolebindings -n <命令空间>`：列出命名空间中的角色和角色绑定。
- `kubectl describe role <role-name> -n <命令空间>`：查看角色或角色绑定详情。

### 二十二、服务帐户诊断

- `kubectl get serviceaccounts -n <命令空间>`：列出命名空间中的服务帐户。
- `kubectl describe serviceaccount <serviceaccount-name> -n <命令空间>`：查看一个服务帐户详情。

### 二十三、清空节点和解除封锁

- `kubectl drain <节点名> --ignore-daemonsets`：清空节点以进行维护。
- `kubectl uncordon <节点名>`：解除对节点的封锁。

### 二十四、资源清理

- `kubectl delete pod <pod-name> -n <命令空间> --grace-period=0 --force`：强制删除 pod（不推荐）。

### 二十五、Pod 亲和性和反亲和性

- `kubectl get pod <pod-name> -n <命令空间> -o=jsonpath='{.spec.affinity}'`：列出 pod 的 pod 亲和性规则。
- `kubectl get pod <pod-name> -n <命令空间> -o=jsonpath='{.spec.affinity.podAntiAffinity}'`：列出 pod 的 pod 反亲和性规则。

### 二十六、Pod 安全策略 (PSP)

- `kubectl get psp`：列出所有 Pod 安全策略（如果启用）。

### 二十七、事件

- `kubectl get events --sort-by=.metadata.creationTimestamp`：查看最近的集群事件。
- `kubectl get events -n <命令空间>`：按特定命名空间过滤事件。

### 二十八、节点故障排除

- `kubectl describe node <节点名> | grep Conditions -A5`：检查节点情况。
- `kubectl describe node <节点名> | grep -E "Capacity|Allocatable"`：列出节点容量和可分配资源。

### 二十九、临时容器（Kubernetes 1.18+）

- `kubectl debug -it <pod-name> -n <命令空间> --image=<debug-image> -- /bin/sh`：运行临时调试容器。

### 三十、资源指标（需要指标服务器）

- `kubectl top pod -n <命令空间>`：获取 Pod 的 CPU 和内存使用情况。

### 三十一、Kuelet 诊断

- `kubectl logs -n kube-system kubelet-<节点名>`：查看节点上的 kubelet 日志。

### 三十二、使用 Telepresence 进行高级调试

- `telepresence --namespace <命令空间> --swap-deployment <pod-name>`：使用 Telepresence 调试 pod。

### 三十三、Kubeconfig 和上下文

- `kubectl config get-contexts`：列出可用的上下文。
- `kubectl config use-context <context-name>`：切换到不同的上下文。

### 三十四、Pod 安全标准（PodSecurity 准入控制器）

- `kubectl get psp -A | grep -vE 'NAME|REVIEWED'`：列出 PodSecurityPolicy (PSP) 违规行为。

### 三十五、Pod 中断预算 (PDB) 诊断

- `kubectl get pdb -n <命令空间>`：列出命名空间中的所有 PDB。
- `kubectl describe pdb <pdb-name> -n <命令空间>`：查看一个 PDB 详情。

### 三十六、资源锁诊断（如果使用资源锁）

- `kubectl get resourcelocks -n <命令空间>`：列出命名空间中的资源锁。

### 三十七、服务端点和 DNS

- `kubectl get endpoints <service-name> -n <命令空间>`：列出服务的服务端点。
- `kubectl exec -it <pod-name> -n <命令空间> -- cat /etc/resolv.conf`：检查 Pod 中的 DNS 配置。

### 三十八、自定义指标（Prometheus、Grafana）

- `kubectl port-forward <pod名称或选择器> <本地端口>:<远程端口>`：用于将本地计算机的端口转发到 K8s 集群中的某个服务上，这使得你可以从本地访问集群内的 Prometheus 和 Grafana 服务，进而查询和监控自定义指标

### 三十九、Pod 优先级和抢占

- `kubectl get priorityclasses`：列出优先级。

### 四十、Pod 开销（Kubernetes 1.18+）

- `kubectl get pod <pod-name> -n <命令空间> -o=jsonpath='{.spec.overhead}'`：列出 pod 中的开销。

### 四十一、存储卷快照诊断（如果使用存储卷快照）

- `kubectl get volumesnapshot -n <命令空间>`：列出存储卷快照。
- `kubectl describe volumesnapshot <snapshot-name> -n <命令空间>`：查看存储卷快照详情。

### 四十二、资源反序列化诊断

- `kubectl get <resource-type> <resource-name> -n <命令空间> -o=json`：反序列化并打印 Kubernetes 资源。

### 四十三、节点污点

- `kubectl describe node <节点名> | grep Taints`：列出节点污点。

### 四十四、更改和验证 Webhook 配置

- `kubectl get mutatingwebhookconfigurations`：列出变异 webhook 配置。
- `kubectl get validatingwebhookconfigurations`：列出验证 Webhook 配置。

### 四十五、Pod 网络策略

- `kubectl get networkpolicies -n <命令空间>`：列出命名空间中的 pod 网络策略。

### 四十六、节点条件（Kubernetes 1.17+）

- `kubectl get nodes -o custom-columns=NODE:.metadata.name,READY:.status.conditions[?(@.type=="Ready")].status -l 'node-role.kubernetes.io/worker='`：自定义查询输出。

### 四十七、节点操作系统详细信息

- `kubectl get node <节点名> -o jsonpath='{.status.nodeInfo.osImage}'`：获取节点的操作系统信息。

### 四十八、审核日志

- 若已启用审核日志功能，查阅 Kubernetes 的审核日志设置，以确定审核日志文件的具体存储路径。

### 四十九、Kubernetes 常用术语的注解

`<namespace>`- 命名空间是 Kubernetes 集群中的一个逻辑分区，用于隔离集群资源。不同的命名空间可以包含同名的资源。

`<pod-name>`- Pod 是 Kubernetes 基本的部署单元，可以包含一个或多个容器（例如，应用程序容器、侧边车容器等）。

`<service-name>`- Service 是定义一组 Pod 访问策略的抽象，它允许外部访问这些 Pod，而不管它们在集群中的实际位置如何。

`<deployment-name>`- Deployment 用于描述应用的期望状态，包括应用的副本数、更新策略等。它通过维护 ReplicaSet 来确保指定数量的 Pod 副本始终处于运行状态。

`<statefulset-name>`- StatefulSet 是用于管理有状态应用的控制器，它为 Pods 提供了持久化存储、网络标识等特性。

`<configmap-name>`- ConfigMap 允许你将配置数据如配置文件或环境变量分离成 Kubernetes 资源，这样可以在 Pod 中使用这些配置数据。

`<secret-name>`- Secret 是一种包含少量敏感数据如密码、令牌或密钥的对象，这些数据可以以加密形式存储并在 Pod 中使用。

`<namespace-name>`- 这通常指的是命名空间的名称，用于指定资源所在的命名空间。

`<pv-name>`- PV（PersistentVolume）是集群中的一块存储资源，已经被预先配置好，可以是本地磁盘、网络存储（NFS、iSCSI、云存储等）。

`<pvc-name>`- PVC（PersistentVolumeClaim）是用户对存储资源的请求，它指定了存储的大小、访问模式等要求。

`<node-name>`- Node 是 Kubernetes 中的工作节点，可以是虚拟机或物理机，负责运行 Pod。

`<network-policy-name>`- NetworkPolicy 是一种网络安全策略，用于控制 Pod 之间的网络流量。

`<resource-quota-name>`- ResourceQuota 用于限制命名空间中资源的总消费量，例如 CPU、内存等。

`<custom-resource-name>`- 自定义资源（CR）是 Kubernetes 扩展性的一部分，允许用户定义自己的 API 对象，这些对象可以由自定义控制器管理。

`<custom-resource-instance-name>`- 这是特定自定义资源实例的名称，例如，如果自定义资源是 “CronTab”，实例名称可能是 “my-cron-tab”。
