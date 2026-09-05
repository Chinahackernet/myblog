# runner部署与注册(yaml)

> 分类：CI/CD / 第13章：Gitlab Runner
> 原文：https://www.cuiliangblog.cn/detail/section/172302364
> 来源：崔亮的博客

---

文件中的配置项及其功能可以查看官方文档： https://docs.gitlab.com/runner/executors/kubernetes.html#default-annotations-for-job-pods

# 概述
gitlab-runner 是 gitlab 提供的一种执行 CICD pipline 的组件。它有多种执行器，每一个执行器都提供一种实现 pipline 的方式，例如：shell 执行器是使用 shell 指令实现，docker 执行器是使用 docker api 实现。而Kubernetes执行器则是使用 k8s api 来实现 CICD pipline。

## 执行过程
runner 的 k8s 执行器是这样执行 pipline 的：

+ 首先，runner 会通过 RBAC 认证获取到调用 k8s 集群 API 的权限。
+ runner 会监听 gitlab，当有合适的 `job` 时，runner 会自动抓取任务执行。请注意，一个流水线中可以有很多个 `stage`，这些 `stage` 是串行执行的，而一个 `stage` 中又可以有多个并行的 `job`，runner 抓取的任务是以 `job` 为单位，而不是 `stage`，更不是 `pipline`。
+ 随后，runner 会调用 k8s API，创建一个用于执行该 job 的 pod。通常来说，runner 创建的所有 pod 有一个通用模板，我们需要在 runner 的 `config.toml` 配置文件中配置这个模板。但 pod 中具体使用什么镜像、在 pod 中执行什么命令，这些都是在后续的 `.gitlab-ci.yml` 文件中配置，并且随着 job 的不同而不同。
+ 在完成了 job 内的工作后，runner 会将这个临时 pod 删除。

![](assets/04-CI-CD/03c81f6966bcb3bb2192.png)

## 注意事项
每个 stage 都会选择一个 runner 来执行，这意味着可以根据 stage 的不同，选择具有特定功能的 runner

在 kubernetes executor 模式中，每一个 stage，runner 都会使用 k8s api 在指定的命名空间中创建一个专用于 pipline 的临时 Pod，在这个 Pod 中执行完当前 stage 的所有 script，随后自动销毁

CI 过程中，可以简单的认为，runner 将当前 git 代码仓库整个拷贝到了容器当中，而工作目录则是项目的根目录，因此，如果有什么文件需要进行拷贝、修改、删除，请尤其注意这一点。

## runner配置
runner配置信息可以通过参数指定，也可以以环境变量方式设置。详细内容可以通过 gitlab-runner register -h 获取到相关参数和变量名称。

在使用官方提供的runner镜像注册runner，默认的runner配置文件在/home/gitlab-runner/.gitlab-runner/config.toml

参考文档：http://s0docs0gitlab0com.icopy.site/runner/executors/kubernetes.html#using-volumes

# 配置对象存储仓库
在 kubernetes executor 模式中，每个stage执行完成都会销毁临时的pod，如果想要在多个stage中传递制品文件，则需要调用制品库或者使用缓存目录，而为了提高任务的执行效率，GitLab Runner 提供了分布式缓存（distributed caching）功能，使得多个 Runner 实例可以共享缓存，从而减少重复的工作，比如重新下载依赖项或重新编译代码。目前支持s3 和 gc3 两种对象存储协议。

具体可参考文档：[https://docs.gitlab.com/runner/configuration/advanced-configuration.html#the-runnerscache-section](https://docs.gitlab.com/runner/configuration/advanced-configuration.html#the-runnerscache-section)

## <font style="color:rgb(48, 49, 51);">创建bucket</font>
<font style="color:rgb(48, 49, 51);">创建一个名为gitlab-runner-cache的bucket，并设置容量上限为1TB</font>

![](assets/04-CI-CD/1b9e6493932516bd3cd2.png)

## <font style="color:rgb(48, 49, 51);">创建Access Key并配置权限</font>
<font style="color:rgb(48, 49, 51);">创建access key并牢记，后续使用。</font>

<font style="color:rgb(48, 49, 51);">并配置权限，使该key仅允许操作gitlab-runner-cache这个bucket</font>

![](assets/04-CI-CD/bc3beaee365e7d9e9579.png)

HroS2nV03s82oIpvPTfr

Q7FGVQp9D4ZrnU0cLD9QJkK1u7S19xRhylmUidHW

# 部署gitlab runner
## 获取注册runner命令
![](assets/04-CI-CD/8e9dbb9978b27d79bf0f.png)

## 创建secrete
将主节点 kubeconfig 内容添加到 secret 中。这个文件的内容是 kubectl 工具访问 k8s 集群的准入 Token，只有在指定了该 Token 后，才能使用 kubectl 指令来对集群内的各种资源进行增删改查。如果在CICD过程需要使用kubectl工具对 k8s 集群进行操作，就需要在每一个runner中挂载Token以供 gitrunner的k8s执行器使用。

```bash
kubectl create secret generic -n cicd kube-config --from-file=/root/.kube/config
kubectl create secret generic -n cicd kube-ca --from-file=/etc/kubernetes/pki/ca.crt
```

## 创建configmap
接下来配置 runner 的 `config.toml` 文件

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: gitlab-runner-config
  namespace: cicd
data:
  # 以下配置用于后续注册 runner 时使用
  group_runner_executor: "kubernetes"
  group_runner_url: "http://gitlab.cicd.svc"
  group_runner_token: "glrt-xyGqTwozGnYR5JeAB6o5"
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
          # 相当于用户名
          AccessKey = "ZoxfsxcLVFHEM1UQpfAo"
          # 相当于密码
          SecretKey = "es3tVIBkohhKxJgwPjuBlKIF6PkUB6HhCIChkFhb"
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
```

## 创建gitlab-runner注册脚本
将 runner 部署到 k8s 上之后还需要将 runner 注册到 gitlab 上才能使用，为此，我们需要写一个脚本，让 runner 部署完成后自行执行，从而完成注册。我们通过 configmap 来将这个脚本挂载到 runner 所在的 Pod 中，这样，只要在之后创建容器时使用启动脚本就能自动执行。

需要注意的是通过模板注册仅支持指定 [[runners]] 部分，不支持全局选项。如下需要修改全局选项，可以在注册完成后替换/etc/gitlab-runner/config.toml文件内容。

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: gitlab-runner-register
  namespace: cicd
data:
  register.sh: |
    # !/bin/bash
    gitlab-runner register --non-interactive --url $GROUP_RUNNER_URL --token $GROUP_RUNNER_TOKEN --executor $GROUP_RUNNER_EXECUTOR --template-config /tmp/config-template.toml
    # 使用配置模板注册不支持全局选项，接下来修改全局参数
    sed -i "s/concurrent = 1/concurrent = 10/g" /etc/gitlab-runner/config.toml
    # 重启gitlab-runner
    gitlab-runner restart
```

## 创建rbac
创建角色，runner 生成的 pod 会使用下述角色信息通过 k8s 的 RBAC，从而能够创建 k8s 的相应资源

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: gitlab-runner-admin
  namespace: cicd
---
kind: Role
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  namespace: cicd
  name: gitlab-admin
rules:
  - apiGroups: [""]
    resources: ["*"] 
    verbs: ["*"]
---
kind: RoleBinding
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  name: gitlab-admin
  namespace: cicd
subjects:
  - kind: ServiceAccount
    name: gitlab-runner-admin
    namespace: cicd
roleRef:
  kind: Role
  name: gitlab-admin
  apiGroup: rbac.authorization.k8s.io
```

## 创建Deployment
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
      app: gitlab-runner
  template:
    metadata:
      labels:
        app: gitlab-runner
    spec:
      serviceAccountName: gitlab-runner-admin
      containers:
        - image: harbor.local.com/cicd/gitlab-runner:v17.2.0
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
      hostAliases:
      - ip: "192.168.10.150"
        hostnames:
        - "gitlab.local.com"
```

# 测试验证
## 查看runner状态
查看runner状态，已经成功注册并运行中。

![](assets/04-CI-CD/26e586ea70269a25271a.png)

## 创建测试流水线
```yaml
default:
  cache: 
    paths: # 定义全局缓存路径
     - target/

stages:
  - build
  - deploy

build:
  stage: build
  image: harbor.local.com/cicd/maven:v3.9.3 # 构建阶段使用指定的maven镜像
  tags: # 在标签为k8s的runner中运行
    - k8s
  script:
    - mvn clean package # 编译打包
    - ls target

deploy:
  stage: deploy
  tags: # 在标签为k8s的runner中运行
    - k8s
  script:
    - ls target
```

## 查看流水线缓存日志
![](assets/04-CI-CD/dd1127d4de024afaa35a.png)

## 查看bucket信息
![](assets/04-CI-CD/3e38ea269ec84f0bfe8a.png)

# 常见问题
[https://segmentfault.com/a/1190000044686362](https://segmentfault.com/a/1190000044686362)


