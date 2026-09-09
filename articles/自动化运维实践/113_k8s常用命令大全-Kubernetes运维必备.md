---
title: k8s常用命令大全-Kubernetes运维必备
---

# k8s常用命令

**Kubernetes（通常简称为 k8s）是一个开源的容器编排平台，用于自动化部署、扩展以及管理容器化应用程序方面发挥着极为关键的作用。以下是一些常用的 Kubernetes 命令：**

### 一、集群信息查询

- `kubectl version`：查看集群的版本信息。
- `kubectl api-versions`：输出一系列的 API 组及其对应的版本号。
- `kubectl api-resources`：输出服务端 API 支持的资源类型。
- `kubectl cluster-info`：查看集群信息。
- `kubectl cluster-info dump`：查看集群更详细的信息。

### 二、资源详细信息查看

- `kubectl describe <资源类型，如：deployments> <资源名称>`：查看特定资源的详细信息。
- `kubectl -n <命名空间> describe pod <pod-name>`：查看指定命名空间下指定 pod 的详细信息，加`-o wide`参数显示详细信息。
- `kubectl describe nodes`：显示集群节点资源：CPU、GPU、内存的使用情况以及**标签**；nodes 后可加具体节点名。

### 三、资源创建

- `kubectl apply -f <文件名>`：更新资源&创建资源（推荐）。
- `kubectl create -f <文件名>`：创建资源。
- `kubectl create -f.`：创建当前目录下的所有 yaml 资源。
- `kubectl create -f./app1.yaml -f./app2.yaml`：批量创建资源。

### 四、资源删除

- `kubectl delete pod <pod-name>`：删除指定 pod。
- `kubectl delete service <service-name>`：删除指定 service。
- `kubectl delete <资源类型> <资源名称>`：删除指定资源。
- `kubectl delete -f./pod.json`：删除 pod.json 文件中定义的类型和名称的 pod。
- `kubectl delete pods --all -n <命名空间>`：删除指定命令空间下所有的 pod；pods 改为 services 即为删除所有的 services。
- `kubectl delete pod <pod-name> -n <命令空间> --force --grace-period=0`：强制删除 pod。
- `kubectl delete pods <pod-name> -n <命名空间>`：静态 POD 直接删除，非静态 POD 重启。
- `kubectl delete pods,services -l name=<标签名>`：删除指定标签 pod 和 serivce；加`--include-uninitialized`（含尚未初始化）。

### 五、资源扩缩容

- `kubectl scale <资源类型，如 rc> <资源名称，如 rc-nginx-2> --replicas=5`：扩展副本数到 5。
- `kubectl scale rc rc-nginx-2 —replicas=3`：副本数缩减到 3。
- `kubectl autoscale deployment my-app --min=3 --max=10`：自动扩缩容 my-app 的部署，指定副本范围在 3~10。
- `--cpu-percent=80`：上条命令结尾如果加这段的话，代表当 CPU 使用率达到 80% 时触发以上自动扩缩容操作。

### 六、资源使用情况查询

- `kubectl top node k8s-node`：显示节点（k8s-node）资源的使用情况。
- `kubectl top node`：显示集群所有节点的资源的使用情况。
- `kubectl top pod -n logging`：显示指定命名空间（如，logging）的 pod 的资源的使用情况。

### 七、资源注解更新

- `kubectl annotate pods <pod-name> description='my frontend'`：更新 pod，设置其注解description的值为`my frontend`。

### 八、容器操作

- `kubectl -n <命名空间> exec -it <Pod 名称> -- bash`：登录容器的命令。
- `kubectl -n <命名空间> cp /opt/sql <Pod 名称>:/tmp/`：复制本机/opt/sql 路径下的文件到 pod 的 /tmp/路径下。
- `kubectl -n <命名空间> cp <Pod 名称>:/tmp/app_bak ./mysql_bak/`：复制 Pod 内app_bak路径所有文件到本地 mysql_bak 路径。

### 九、回滚和历史查看

- `cat pod.json | kubectl apply -f -`：将控制台输入的 JSON 配置应用到 Pod。
- `kubectl rollout history deployment nginx-deployment`：查看修订版本的历史记录。
- `kubectl rollout undo deployment nginx-deployment --to-revision=1`：如果不加 `–to-revision=`版本号，会回退到上一个版本。

### 十、资源配额与限制查看

- `kubectl describe quota`：查看集群的资源配额。
- `kubectl describe limitrange`：查看集群的资源限制。

### 十一、日志查看

- `kubectl logs -f <Pod 名称> -n <命名空间>`：查看指定 Pod 的日志。
- `kubectl logs --tail=10 <Pod 名称>`：查看指定 pod 的最后 10 行日志。
- `kubectl logs <Pod 名称> -n <命名空间> | grep 关键字`：根据关键字查看日志。

### 十二、节点与标签操作

- `kubectl get nodes --show-labels`：查看所有节点和 label。
- `kubectl label nodes <节点名> <标签键>=<标签名>`：给节点增加标签。
- `kubectl label nodes <节点名> <标签键>-`：给节点去掉(删除）标签。
- `kubectl taint nodes <节点名> <标签键>=true:NoSchedule`：给节点增加污点。
- `kubectl taint nodes <节点名> <标签键>:NoSchedule-`：给节点去掉(删除）污点。
- `kubectl taint nodes --all <标签键>:NoSchedule-`：删除所有节点的指导标签。

### 十三、服务编辑

- `kubectl edit svc/docker-registry`：编辑名为 `docker-registry` 的 service。

### 十四、资源列表查看

- `kubectl get pods -A`：查看所有的 pod。
- `kubectl get pods -n <命名空间>`：查看特定命名空间下的 Pod 列表。
- `kubectl get po -A|grep -Ev '1/1|2/2|3/3|4/4|Com'`：查看异常 pod 的列表。
- `kubectl get pods -o wide | grep <需查询 pod 的关键字>`：查询包含特定关键字的 Pod，并且输出详细信息。
- `kubectl get namespaces`：查看命名空间列表。
- `kubectl get nodes`：查看节点列表，可以加上 `--show-labels` 查看 label，可以加上 `-o wide` 查看 IP。
- `kubectl get services`：查看集群中服务的状态。
- `kubectl get statefulset`：查看 statefulset 列表，中间件与底座大量使用该类型控制器。
- `kubectl get daemonset`：查看 daemonset 列表，基础组件大量使用该类型控制器。
- `kubectl get deployments`：查看 deployment 列表，大部分组件使用该类型控制器。
- `kubectl get svc`：查看服务列表，可指定参数 -A 参看所有命名空间中的服务。
- `kubectl get ingress -A`：查看域名列表，可指定参数 -A 参看所有命名空间中的对外域名列表。
- `kubectl get crd -A`：查看自定义资源列表。
- `kubectl get networkpolicies`：查看集群的网络策略。
- `kubectl get storageclass`：查看集群的存储类。

### 十五、资源格式信息获取

- `kubectl get <资源类型，如 deployment> <资源名称，如 my-deployment> -o yaml`：获取指定 namespace 的 yaml 格式格式信息。
- `kubectl get <资源类型，如 deployment> <资源名称，如 my-deployment> -o json`：获取指定 namespace 的 json 格式信息。

### 十六、节点调度管理

- `kubectl cordon k8s-node`：标记 k8s-node 节点不可调度。
- `kubectl uncordon k8s-node`：标记 k8s-node 节点可调度。
- `kubectl drain k8s-node`：排除 k8s-node 节点，准备进行维护。
