# kubernetes类型runner优化

> 分类：CI/CD / 第13章：Gitlab Runner
> 原文：https://www.cuiliangblog.cn/detail/section/174152592
> 来源：崔亮的博客

---

# 构建缓存问题
使用 maven 编译 Java 工程，我们期望保留本地 repository 缓存，避免每次构建都重新下载所有依赖包，毕竟这很耗时。为此，需要创建PVC来持久化构建缓存，加速构建速度。为了节省存储空间决定不在每个项目中存储构建缓存，而是配置全局缓存。

## 创建使用pvc
准备10G空间的nfs存储，用于存储自定义缓存内容。

```yaml
kind: PersistentVolumeClaim
apiVersion: v1
metadata:
  name: gitlab-runner-cache
  namespace: cicd
spec:
  storageClassName: nfs-client
  accessModes:
    - ReadWriteMany
  resources:
    requests:
      storage: 10Gi
```

修改deployment，使用刚刚创建的pvc资源。

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: gitlab-runner
  namespace: cicd
spec:
  replicas: 1
  selector:
    matchLabels:
      name: gitlab-runner
  template:
    metadata:
      labels:
        name: gitlab-runner
    spec:
      serviceAccountName: gitlab-runner-admin
      containers:
        - image: harbor.local.com/cicd/gitlab-runner:v17.0.0
          name: gitlab-runner
          env:
            # 将我们之前在 configmap 中设置的项通过环境变量的方式注入到容器中
            - name: GROUP_RUNNER_TOKEN
              valueFrom:
                configMapKeyRef:
                  name: gitlab-runner-config
                  key: group_runner_token
            - name: GROUP_RUNNER_URL
              valueFrom:
                configMapKeyRef:
                  name: gitlab-runner-config
                  key: group_runner_url
            - name: GROUP_RUNNER_EXECUTOR
              valueFrom:
                configMapKeyRef:
                  name: gitlab-runner-config
                  key: group_runner_executor
          lifecycle:
            # runner容器启动后,立即发送postStart事件
            postStart:
              exec:
                # command: ["/bin/sh", "-c", "cat /tmp/register.sh"]
                command: ["/bin/sh", "-c", "sh /tmp/register.sh"]
          resources:
            requests:
              memory: "1Gi"
              cpu: "1"
            limits:
              memory: "2Gi"
              cpu: "2"
          volumeMounts:
          - name: template
            mountPath: /tmp/config-template.toml
            subPath: config-template.toml
          - name: script
            mountPath: /tmp/register.sh
            subPath: register.sh
          - name: cache
            mountPath: /home/gitlab-runner/cache
      volumes:
        - name: template
          configMap:
            name: gitlab-runner-config
            items:
            - key: config-template.toml
              path: config-template.toml
        - name: script
          configMap:
            name: gitlab-runner-register
            items:
            - key: register.sh
              path: register.sh
              mode: 0755
        - name: cache
          persistentVolumeClaim:
            claimName: gitlab-runner-cache
      hostAliases:
      - ip: "192.168.10.150"
        hostnames:
        - "gitlab.local.com"
```

修改config，设置runner挂载pvc

```bash
apiVersion: v1
kind: ConfigMap
metadata:
  name: gitlab-runner-config
  namespace: cicd
data:
  # 以下配置用于后续注册 runner 时使用
  group_runner_executor: "kubernetes"
  group_runner_url: "http://gitlab.cicd.svc"
  group_runner_token: "glrt-bxuthgpZjirXbLaVaouE"
  # 以下是 gitlab-runner 的配置文件模板，gitlab-runner 会实时读取 config.toml 配置文件并热加载，因此，在 gitlab-runner 部署后，可以直接通过修改 config.toml 文件来更新配置
  config-template.toml: |-
    [[runners]]
      # 缓存项目的依赖包，从而大大减少项目构建的时间
      [runners.cache]
        # Type 可以选择 s3 和 gc3 两种对象存储协议
        Type = "s3"
        # Shared 字段控制不同 runner 之间的缓存是否共享，默认是 false
        Shared = false
        [runners.cache.s3]
          ServerAddress = "minio-service.minio.svc:9000"
          AccessKey = "syGCsrY5RWDNPb4VSdRs"
          SecretKey = "uSpAF1rWEQIF8laZpaZGMA9kBTlI5FYWF0qPKr5X"
          # 桶名
          BucketName = "gitlab-runner-cache"
          Insecure = true
      # 配置 kubernetes 执行器。
      [runners.kubernetes]
        # 默认镜像
        image = "alpine:latest"
        # 容器镜像拉取规则
        pull_policy = "if-not-present"
        # 名称空间，注意与之前创建的kube-config资源位于同一ns
        namespace = "cicd"
        # 启用特权模式
        privileged = true 
        cpu_limit = "1"
        memory_limit = "1Gi"
        service_cpu_limit = "1"
        service_memory_limit = "1Gi"
        dns_policy = "cluster-first"
        automount_service_account_token = true
      # 用于配置该 Executor 生成的 Pod 中的 /etc/hosts 文件
      [[runners.kubernetes.host_aliases]]
        ip = "192.168.10.150"
        hostnames = ["gitlab.local.com"]
      [runners.kubernetes.volumes]
          # 共用宿主机的containerd
         [[runners.kubernetes.volumes.host_path]]
           name = "sock"
           mount_path = "/var/run/containerd/containerd.sock"
           read_only = true
           host_path = "/var/run/containerd/containerd.sock"
          # 将 kubeconfig 内容挂载在runner容器中
         [[runners.kubernetes.volumes.secret]]
           name = "kube-config"
           mount_path = "/root/.kube/"
           read_only = true
          # 挂载持久化构建缓存目录
         [[runners.kubernetes.volumes.pvc]]
            name = "gitlab-runner-cache"
            mount_path = "/home/gitlab-runner/cache"
```

## 查看验证
```bash
[root@tiaoban gitlab-runner]# kubectl get pvc -n cicd | grep runner
gitlab-runner-cache           Bound    pvc-a47a7a1e-e25a-49a4-bc04-d8551d3eb164   10Gi       RWX            nfs-client     37s
[root@tiaoban gitlab-runner]# kubectl exec -it -n cicd gitlab-runner-5574954f67-sbjsd -- bash
root@gitlab-runner-5574954f67-sbjsd:/# df -h | grep cache
192.168.10.100:/data/nfs-k8s/cicd-gitlab-runner-cache-pvc-a47a7a1e-e25a-49a4-bc04-d8551d3eb164  147G   52G   96G  36% /home/gitlab-runner/cache
```

## 指定缓存目录
后续使用构建工具打包时添加指定缓存目录。例如：maven

```plain
mvn clean package -DskipTests -Dmaven.repo.local=/home/gitlab-runner/cache/maven
```

# 解决构建制品问题
在kubernetes中对cache支持一般，以Maven项目为例，虽然我们配置了target目录全局缓存，但是在下个阶段再次查看target/目录时会发现为空，有两个方案可以解决这个问题。

## 使用artifacts进行代替
我们可以使用artifacts功能收集target制品，但缺点每次job执行时artifacts收集制品会占用存储空间。

## repo目录持久化
分析job阶段创建的pod我们可知，kubernetes执行器创建的构建pod会默认挂载一个名为repo的空目录。此目录用于存储每次下载的代码，因为是空目录的原因导致后续测试pod无法获取需要重新下载代码。

![](assets/04-CI-CD/052cbae4c1a2b264b1e2.png)

![](assets/04-CI-CD/8dff74d44f2688f9620b.png)

为了解决这个问题，我们可以直接将持久化的pvc挂载到空目录中的某个目录中。并配置runner自定义构建目录。

### 创建使用pvc
创建一个名为gitlab-runner-dir的pvc资源

```yaml
kind: PersistentVolumeClaim
apiVersion: v1
metadata:
  name: gitlab-runner-cache
  namespace: cicd
spec:
  storageClassName: nfs-client
  accessModes:
    - ReadWriteMany
  resources:
    requests:
      storage: 10Gi
---
kind: PersistentVolumeClaim
apiVersion: v1
metadata:
  name: gitlab-runner-dir
  namespace: cicd
spec:
  storageClassName: nfs-client
  accessModes:
    - ReadWriteMany
  resources:
    requests:
      storage: 10Gi
```

runner挂载pvc，并添加环境变量指定使用自定义build目录

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: gitlab-runner
  namespace: cicd
spec:
  replicas: 1
  selector:
    matchLabels:
      name: gitlab-runner
  template:
    metadata:
      labels:
        name: gitlab-runner
    spec:
      serviceAccountName: gitlab-runner-admin
      containers:
        - image: harbor.local.com/cicd/gitlab-runner:v17.0.0
          name: gitlab-runner
          env:
            # 将我们之前在 configmap 中设置的项通过环境变量的方式注入到容器中
            - name: GROUP_RUNNER_TOKEN
              valueFrom:
                configMapKeyRef:
                  name: gitlab-runner-config
                  key: group_runner_token
            - name: GROUP_RUNNER_URL
              valueFrom:
                configMapKeyRef:
                  name: gitlab-runner-config
                  key: group_runner_url
            - name: GROUP_RUNNER_EXECUTOR
              valueFrom:
                configMapKeyRef:
                  name: gitlab-runner-config
                  key: group_runner_executor
            - name: CUSTOM_BUILD_DIR_ENABLED # 开启自定义构建目录
              value: "true"
            - name: RUNNER_BUILDS_DIR # 指定自定义构建目录地址
              value: "/home/gitlab-runner/build-dir/"
          lifecycle:
            # runner容器启动后,立即发送postStart事件
            postStart:
              exec:
                # command: ["/bin/sh", "-c", "cat /tmp/register.sh"]
                command: ["/bin/sh", "-c", "sh /tmp/register.sh"]
          resources:
            requests:
              memory: "1Gi"
              cpu: "1"
            limits:
              memory: "2Gi"
              cpu: "2"
          volumeMounts:
          - name: template
            mountPath: /tmp/config-template.toml
            subPath: config-template.toml
          - name: script
            mountPath: /tmp/register.sh
            subPath: register.sh
          - name: cache
            mountPath: /home/gitlab-runner/cache
          - name: dir
            mountPath: /home/gitlab-runner/build-dir
      volumes:
        - name: template
          configMap:
            name: gitlab-runner-config
            items:
            - key: config-template.toml
              path: config-template.toml
        - name: script
          configMap:
            name: gitlab-runner-register
            items:
            - key: register.sh
              path: register.sh
              mode: 0755
        - name: cache
          persistentVolumeClaim:
            claimName: gitlab-runner-cache
        - name: dir
          persistentVolumeClaim:
            claimName: gitlab-runner-dir
      hostAliases:
      - ip: "192.168.10.150"
        hostnames:
        - "gitlab.local.com"
```

修改config，设置runner挂载pvc

```bash
apiVersion: v1
kind: ConfigMap
metadata:
  name: gitlab-runner-config
  namespace: cicd
data:
  # 以下配置用于后续注册 runner 时使用
  group_runner_executor: "kubernetes"
  group_runner_url: "http://gitlab.cicd.svc"
  group_runner_token: "glrt-bxuthgpZjirXbLaVaouE"
  # 以下是 gitlab-runner 的配置文件模板，gitlab-runner 会实时读取 config.toml 配置文件并热加载，因此，在 gitlab-runner 部署后，可以直接通过修改 config.toml 文件来更新配置
  config-template.toml: |-
    [[runners]]
      # 缓存项目的依赖包，从而大大减少项目构建的时间
      [runners.cache]
        # Type 可以选择 s3 和 gc3 两种对象存储协议
        Type = "s3"
        # Shared 字段控制不同 runner 之间的缓存是否共享，默认是 false
        Shared = false
        [runners.cache.s3]
          ServerAddress = "minio-service.minio.svc:9000"
          AccessKey = "syGCsrY5RWDNPb4VSdRs"
          SecretKey = "uSpAF1rWEQIF8laZpaZGMA9kBTlI5FYWF0qPKr5X"
          # 桶名
          BucketName = "gitlab-runner-cache"
          Insecure = true
      # 配置 kubernetes 执行器。
      [runners.kubernetes]
        # 默认镜像
        image = "alpine:latest"
        # 容器镜像拉取规则
        pull_policy = "if-not-present"
        # 名称空间，注意与之前创建的kube-config资源位于同一ns
        namespace = "cicd"
        # 启用特权模式
        privileged = true 
        cpu_limit = "1"
        memory_limit = "1Gi"
        service_cpu_limit = "1"
        service_memory_limit = "1Gi"
        dns_policy = "cluster-first"
      # 用于配置该 Executor 生成的 Pod 中的 /etc/hosts 文件
      [[runners.kubernetes.host_aliases]]
        ip = "192.168.10.150"
        hostnames = ["gitlab.local.com"]
      [runners.kubernetes.volumes]
          # 共用宿主机的containerd
         [[runners.kubernetes.volumes.host_path]]
           name = "sock"
           mount_path = "/var/run/containerd/containerd.sock"
           read_only = true
           host_path = "/var/run/containerd/containerd.sock"
          # 将 kubeconfig 内容挂载在runner容器中
         [[runners.kubernetes.volumes.secret]]
           name = "kube-config"
           mount_path = "/root/.kube/"
           read_only = true
          # 挂载持久化构建缓存目录
         [[runners.kubernetes.volumes.pvc]]
            name = "gitlab-runner-cache"
            mount_path = "/home/gitlab-runner/cache"
         [[runners.kubernetes.volumes.pvc]]
            name = "gitlab-runner-dir"
            mount_path = "/home/gitlab-runner/build-dir"
```

### 查看验证
查看pvc信息

```bash
[root@tiaoban ~]# kubectl get pvc -n cicd 
NAME                          STATUS   VOLUME                                     CAPACITY   ACCESS MODES   STORAGECLASS   AGE
gitlab-runner-cache           Bound    pvc-5cebfe33-f629-4318-b0af-1c18ad4213df   10Gi       RWX            nfs-client     9m41s
gitlab-runner-dir             Bound    pvc-3b40eda5-c1da-462e-895a-b01bc3fa2fe1   10Gi       RWX            nfs-client     9m41s
```

查看job日志

![](assets/04-CI-CD/c37e7451d3ee9c9d3360.png)

## 配置每次job不拉取代码
默认每次每个job运行的时候都会获取远程最新的代码，会把构建目录删除掉，此时就需要配置git checkout策略。通常情况下不需要每个作业都下载代码。只要第一个作业下载好最新的代码，然后运行流水线即可。

在ci文件中定义<font style="color:rgb(232, 62, 140);">GIT_CHECKOUT</font>变量，默认值为true，即每次都需要代码下载。我们将全局配置为false然后在build作业中配置为true。也就实现了只在build作业下载最新代码了。

```plain
GIT_CHECKOUT: "false"
```

参考链接：http://s0docs0gitlab0com.icopy.site/ee/ci/yaml/README.html#git-checkout


