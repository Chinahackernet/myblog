# Gitlab与k8s集成(runner方式)

> 分类：CI/CD / 第15章：Gitlab工具链集成
> 原文：https://www.cuiliangblog.cn/detail/section/171825012
> 来源：崔亮的博客

---

# 准备工作
## 部署Kubernetes类型的runner
具体内容参考文档：[13-06_runner%E9%83%A8%E7%BD%B2%E4%B8%8E%E6%B3%A8%E5%86%8C%28yaml%29.md](articles/04-CI-CD/13-06_runner部署与注册-yaml-.md)

## 构建自定义镜像
在使用kubectl命令操作k8s集群时，由于dockerhub的kubectl基础镜像由于遵循最简化的原则，往往不符合我们的要求，因此我们需要构建自定义镜像。

如果k8s容器运行时为docker，在构建镜像时，可以直接使用docker in docker方案，具体内容可参考[15-04_Gitlab%E4%B8%8EHarbor%E9%9B%86%E6%88%90.md](articles/04-CI-CD/15-04_Gitlab与Harbor集成.md)。  
如果k8s容器运行时为container，则使用nerdctl+buildkitd方案，启动一个buildkit容器，通过nerdctl命令执行镜像构建与推送操作，具体内容可参考  
[../06_Kubernetes/02-06_Containerd%E8%BF%9B%E9%98%B6%E4%BD%BF%E7%94%A8.md](articles/06-Kubernetes/02-06_Containerd进阶使用.md)。  
本次实验以container环境为例，通过nerdctl+buildkitd方案演示如何构建并推送镜像。

```bash
[root@tiaoban gitlab-runner]# cat Dockerfile 
FROM alpine:latest
USER root
COPY kubectl /usr/bin/kubectl
COPY nerdctl /usr/bin/nerdctl
COPY buildctl /usr/bin/buildctl
[root@tiaoban gitlab-runner]# docker build -t harbor.local.com/cicd/gitlab-runner-agent:v1.0 .
```

然后修改gitlab-runer默认镜像

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
  group_runner_token: "glrt-Wnio9pMBqnjNH3dZYXc6"
  # 以下是 gitlab-runner 的配置文件模板，gitlab-runner 会实时读取 config.toml 配置文件并热加载，因此，在 gitlab-runner 部署后，可以直接通过修改 config.toml 文件来更新配置
  config-template.toml: |-
    # 配置最大并发数，默认为1
    concurrent = 10
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
          AccessKey = "HroS2nV03s82oIpvPTfr"
          # 相当于密码
          SecretKey = "Q7FGVQp9D4ZrnU0cLD9QJkK1u7S19xRhylmUidHW"
          # 桶名
          BucketName = "gitlab-runner-cache"
          Insecure = true
      # 配置 kubernetes 执行器。
      [runners.kubernetes]
        # 默认镜像
        image = "harbor.local.com/cicd/gitlab-runner-agent:v1.0"
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
        ip = "192.168.10.151"
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

## 部署buildkitd服务
通过deployment方式部署buildkitd服务，并开启1234端口，nerdctl工具通过tcp端口调用buildkitd服务完成镜像构建。

```yaml
[root@tiaoban buildkitd]# cat buildkitd-configmap.yaml 
apiVersion: v1
kind: ConfigMap
metadata:
  name: buildkitd-config
  namespace: cicd
data:
  buildkitd.toml: |-
    debug = true
    [registry."docker.io"] # 镜像加速
      mirrors = ["934du3yi.mirror.aliyuncs.com"]
    [registry."harbor.local.com"] # 私有镜像仓库
      http = false
[root@tiaoban buildkitd]# cat buildkitd-deployment.yaml 
apiVersion: apps/v1
kind: Deployment
metadata:
  labels:
    app: buildkitd
  name: buildkitd
  namespace: cicd
spec:
  replicas: 1
  selector:
    matchLabels:
      app: buildkitd
  template:
    metadata:
      labels:
        app: buildkitd
    spec:
      containers:
        - name: buildkitd
          # image: moby/buildkit:master-rootless
          image: harbor.local.com/cicd/buildkit:master-rootless
          args:
            - --addr
            - tcp://0.0.0.0:1234
            - --addr
            - unix:///run/user/1000/buildkit/buildkitd.sock
            - --config
            - /etc/buildkitd/buildkitd.toml
          resources:
            requests:
              memory: "1Gi"
              cpu: "1"
            limits:
              memory: "4Gi"
              cpu: "4"
          readinessProbe:
            exec:
              command:
                - buildctl
                - debug
                - workers
          livenessProbe:
            exec:
              command:
                - buildctl
                - debug
                - workers
          securityContext:
            privileged: true
          ports:
            - containerPort: 1234
          volumeMounts:
            - mountPath: /etc/buildkitd
              name: config
      volumes:
        - name: config
          configMap:
            name: buildkitd-config
[root@tiaoban buildkitd]# cat buildkitd-svc.yaml 
apiVersion: v1
kind: Service
metadata:
  labels:
    app: buildkitd
  name: buildkitd
  namespace: cicd
spec:
  ports:
    - port: 1234
      protocol: TCP
  selector:
    app: buildkitd
```

# 使用k8s runner
## 配置 gitlab 环境变量
在 Group——>Your Group——>Settings——>CI/CD——>Variables 中填入相关环境变量

这些环境变量可以在该群组下的所有项目的 `.gitlab-ci.yml` 文件中使用。

![](assets/04-CI-CD/d51ad86a2aa3d7dea210.png)

## 配置Pipeline 文件
下例为springboot项目部署的 .gitlab-ci.yml 演示，对该文件有以下几点需要说明：

+ 每个 stage 都会选择一个 runner 来执行，这意味着可以根据 stage 的不同，选择具有特定功能的 runner
+ 在 kubernetes executor 模式中，每一个 stage，runner 都会使用 k8s api 在指定的命名空间中创建一个专用于 pipline 的临时 Pod，在这个 Pod 中执行完当前 stage 的所有 script，随后自动销毁
+ CI 过程中，可以简单的认为，runner 将当前 git 代码仓库整个拷贝到了容器当中，而工作目录则是项目的根目录，因此，如果有什么文件需要进行拷贝、修改、删除，请尤其注意这一点。

```yaml
default:
  cache: 
    paths: # 定义全局缓存路径
     - target/

variables: # 定义镜像名称
  IMAGE_NAME: harbor.local.com/devops/$CI_PROJECT_NAME:$CI_COMMIT_BRANCH-$CI_COMMIT_SHORT_SHA-$CI_PIPELINE_ID

stages:
  - build
  - deploy

mvn:
  stage: build
  image: harbor.local.com/cicd/maven:3.9.3 # 构建阶段使用指定的maven镜像
  tags: # 在标签为k8s的runner中运行
    - k8s
  script:
    - mvn clean package # 编译打包

images: 
  stage: build
  tags: # 在标签为k8s的runner中运行
    - k8s
  script:
    - "nerdctl build --buildkit-host tcp://buildkitd.cicd.svc:1234 -t $IMAGE_NAME ." # 构建镜像
    - nerdctl images
    - "nerdctl login --insecure-registry harbor.local.com -u admin -p $HARBOR_PASSWORD" # 登录harbor
    - "nerdctl push $IMAGE_NAME --insecure-registry" # 上传镜像
    - "nerdctl rmi -f $IMAGE_NAME " # 删除镜像

deploy:
  stage: deploy
  tags: # 在标签为k8s的runner中运行
    - k8s
  script:
    - kubectl get node # 查看k8s节点信息
```

当做好这一切的工作之后，就可以在 gitlab 上运行流水线了，如下图所示：

## 验证
查看流水线状态

![](assets/04-CI-CD/5e55c550ba536954221c.png)

查看deploy日志

![](assets/04-CI-CD/28640f32108f507ccb92.png)


