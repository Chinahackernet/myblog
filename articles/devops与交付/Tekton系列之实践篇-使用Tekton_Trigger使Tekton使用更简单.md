在《Tekton实践篇-如何用Jenkins来管理Tekton》我们介绍了如何使用Jenkins来管理Tekton，这种方式是运维主动式管理，也就是需要运维去触发发布，哪有没有可能让自动触发Tekton PipelineRun的运行呢？

​  

答案是有的，也就是这篇文章分享的Tekton Trigger。

​  

## 什么是Tekton Trigger？

Tekton Trigger是Tekton的一个组件，它可以从各种来源的事件中检测并提取需要信息，然后根据这些信息来运行TaskRun和PipelineRun，还可以将提取出来的信息传递给它们以满足不同的运行要求。

​  

其核心组件如下：

-   EventListener：时间监听器，是外部事件的入口 ，通常需要通过HTTP方式暴露，以便于外部事件推送，比如配置Gitlab的Webhook。
-   Trigger：指定当EventListener检测到事件发生时会发生什么，它会定义TriggerBinding、TriggerTemplate以及可选的Interceptor。
-   TriggerTemplate：用于模板化资源，根据传入的参数实例化Tekton对象资源，比如TaskRun、PipelineRun等。
-   TriggerBinding：用于捕获事件中的字段并将其存储为参数，然后会将参数传递给TriggerTemplate。
-   ClusterTriggerBinding：和TriggerBinding相似，用于提取事件字段，不过它是集群级别的对象。
-   Interceptor：拦截器，在TriggerBinding之前运行，用于负载过滤、验证、转换等处理，只有通过拦截器的数据才会传递给TriggerBinding。

​  

工作原理图如下：

​  

![image.png](assets/devops与交付/Tekton系列之实践篇-使用Tekton_Trigger使Tekton使用更简单/Tekton系列之实践篇-使用Tekton_Trigger使Tekton使用更简单-1.png)

  

下面会详细介绍Trigger 的CRD对象。

​  

## Trigger CRD对象

### TriggerTemplate

TriggerTemplate可以模块化Tekton资源的资源，可以使传入的参数在资源模板中的任何位置被使用，它就好比我们定义了一个对象，这个对象可以接收外部的参数，在对象内部把接收到的参数再传递给Tekton资源对象进行使用。

​  

TriggerTemplate的定义很简单，如下：

```yaml
apiVersion: triggers.tekton.dev/v1beta1
kind: TriggerTemplate
metadata:
  name: pipeline-template
spec:
  params:  # 参数的定义，从外部接收的参数
  - name: gitrevision
    description: The git revision
    default: main
  - name: gitrepositoryurl
    description: The git repository url
  - name: message
    description: The message to print
    default: This is the default message
  - name: contenttype
    description: The Content-Type of the event
  resourcetemplates: # 资源模板，将参数传递给资源模板，实例化一个PipelineRun对象
  - apiVersion: tekton.dev/v1beta1
    kind: PipelineRun
    metadata:
      generateName: simple-pipeline-run-
    spec:
      pipelineRef:
        name: simple-pipeline
      params:
      - name: message
        value: $(tt.params.message)
      - name: contenttype
        value: $(tt.params.contenttype)
      resources:
      - name: git-source
        resourceSpec:
          type: git
          params:
          - name: revision
            value: $(tt.params.gitrevision)
          - name: url
            value: $(tt.params.gitrepositoryurl)
```

  

从上面可以看出，`resourcetemplates`字段中就是定义的资源模板，上面定义的PipelineRun的资源，里面的语法和定义一个PipelineRun CRD一致，就像Deployment的Template中定义的Pod资源和单独定义Pod资源的语义一样。

​  

而`params`字段定义我们需要从外部获得的参数，这个参数后续会传递给`resourcetemplates`以完成其资源实例化。

  

### TriggerBinding

TriggerBinding用于将事件进行绑定，通过捕获事件中的字段并将其存储为参数。

​  

其定义方式如下：

```yaml
apiVersion: triggers.tekton.dev/v1beta1
kind: TriggerBinding
metadata:
  name: pipeline-binding
spec:
  params:
  - name: gitrevision
    value: $(body.head_commit.id)
  - name: gitrepositoryurl
    value: $(body.repository.url)
  - name: contenttype
    value: $(header.Content-Type)
```

  

TriggerBinding接收从EventListener传递过来的参数，然后传给TriggerTemplate，在TriggerTemplate上实例化资源对象。

​  

TriggerBinding提供TriggerTemplate需要的参数，参数以key-value的方式存储并传递。其中的value是通过`$()`中包裹得`JSONPath`表达式来提取（[https://tekton.dev/docs/triggers/triggerbindings/](https://tekton.dev/docs/triggers/triggerbindings/)）。

  

### Trigger

用于指定当事件发生时需要做什么，它会定义TriggerBinding、TriggerTemplate以及可选的Interceptor。

​  

如下：

```yaml
apiVersion: triggers.tekton.dev/v1beta1
kind: Trigger
metadata:
  name: trigger
spec:
  interceptors:
    - ref:
        name: "cel"
      params:
        - name: "filter"
          value: "header.match('X-GitHub-Event', 'pull_request')"
        - name: "overlays"
          value:
            - key: extensions.truncated_sha
              expression: "body.pull_request.head.sha.truncate(7)"
  bindings:
  - ref: pipeline-binding
  template:
    ref: pipeline-template
```

  

上面定义了`interceptors`、`bindings`、`template`，一当EventListener收到事件，就会触发这个Trigger，先经过`interceptors`进行拦截筛选，然后再传给`bindings`和`template`。

  

### ClusterTriggerBinding

ClusterTriggerBinding和TriggerBinding功能一样，从名字就可以看到，ClusterTriggerBinding是集群级别的，可以作用于任何namespace。

  

其定义和TriggerBinding一样，如下：

```yaml
apiVersion: triggers.tekton.dev/v1beta1
kind: ClusterTriggerBinding
metadata:
  name: pipeline-clusterbinding
spec:
  params:
    - name: gitrevision
      value: $(body.head_commit.id)
    - name: gitrepositoryurl
      value: $(body.repository.url)
    - name: contenttype
      value: $(header.Content-Type)
```

  

### Interceptor

Interceptor是在TriggerBinding运行之前的事件处理器，可以做一些预处理，比如账户密码验证，再比如一些事件方式验证，如gitlab的push event。只有通过了Interceptor，才会把有效数据传递给TriggerBinding。

​  

Tekton Trigger目前支持两种Interceptor的实现方式：

-   独立Interceptor
-   传统Interceptor（将被废弃）

​  

独立Interceptor是ClusterInterceptor自定义资源的实例，可以在下面介绍的EventListener中引用这些Interceptor以及所需的参数。传统的Interceptor就是在EventListener中完全定义，不过这种方式将被废弃。

​  

目前已经内置了以下Interceptor：

-   Webhook Interceptor
-   Github Interceptor
-   Gitlab Interceptor
-   Bitbucket Interceptor
-   CEL Interceptor

​  

这里以Gitlab Interceptor为例。Gitlab Interceptor包括验证和过滤的逻辑，它可以验证Webhook的来源，也可以验证指定标准过滤传入的事件。如下：

```yaml
interceptors:
- ref:
    name: "gitlab"
  params:
  - name: "secretRef"
    value:
      secretName: foo
      secretKey: bar
  - name: "eventTypes"
    value: ["Push Hook"]
```

  

也可以直接在EventListener中定义，如下：

```yaml
apiVersion: triggers.tekton.dev/v1alpha1
kind: EventListener
metadata:
  name: gitlab-listener-interceptor
spec:
  serviceAccountName: tekton-triggers-example-sa
  triggers:
    - name: foo-trig
      interceptors:
        - gitlab:
            secretRef:
              secretName: foo
              secretKey: bar
            eventTypes:
              - Push Hook
      bindings:
        - ref: pipeline-binding
      template:
        ref: pipeline-template
```

  

### EventListener

EventListener是一个Kubernetes对象，用于监听Kubernetes上指定端口的事件，然后会接收传入的事件并指定一个或多个触发器。

​  

EventListener实际上是Tekton的另一种客户端形式，只是它是基于HTTP事件的，通过HTTP的方式可以绕过常规的认证路径，比如kubeconfig等，我们知道，任何需要通过kube-apiserver的事件都需要认证、鉴权等一系列操作，那HTTP方式是如何实现的呢？我们在创建一个简单的nginx deployment的时候，可以看到yaml文件里会自动生成一个default的serviceaccount，这个default就是用于认证、鉴权的。所以要使用EventListener，就需要让它拥有自己的serviceaccount，并且这个serviceaccount需要Tekton资源操作的权限才能让Event正常的和Tekton进行交互。

​  

EventListener的定义示例如下：

```yaml
apiVersion: triggers.tekton.dev/v1alpha1
kind: EventListener
metadata:
  name: gitlab-listener
spec:
  serviceAccountName: tekton-triggers-example-sa
  triggers:
    - name: gitlab-push-events-trigger
      interceptors:
        - name: "verify-gitlab-payload"
          ref:
            name: "gitlab"
            kind: ClusterInterceptor
          params:
            - name: secretRef
              value:
                secretName: "gitlab-secret"
                secretKey: "secretToken"
            - name: eventTypes
              value:
                - "Push Hook"
      bindings:
        - name: gitrevision
          value: $(body.checkout_sha)
        - name: gitrepositoryurl
          value: $(body.repository.git_http_url)
      template:
        spec:
          params:
            - name: gitrevision
            - name: gitrepositoryurl
          resourcetemplates:
            - apiVersion: tekton.dev/v1alpha1
              kind: TaskRun
              metadata:
                generateName: gitlab-run-
              spec:
                taskSpec:
                  inputs:
                    resources:
                      - name: source
                        type: git
                  steps:
                    - image: ubuntu
                      script: |
                        #! /bin/bash
                        ls -al $(inputs.resources.source.path)
                inputs:
                  resources:
                    - name: source
                      resourceSpec:
                        type: git
                        params:
                          - name: revision
                            value: $(tt.params.gitrevision)
                          - name: url
                            value: $(tt.params.gitrepositoryurl)
```

  

## Trigger安装

上面简单介绍了一下Trigger的常用功能，更多的可以到官方文档（[https://tekton.dev/docs/triggers/](https://tekton.dev/docs/triggers/)）进行学习。

​  

下面我们将正式的把之前的Pipeline流程接入Trigger，实现开发人员推送代码，通过Webhook自动触发对应的PipelineRun。

​  

首先我们需要安装Trigger（[https://tekton.dev/docs/triggers/install/](https://tekton.dev/docs/triggers/install/)）。

​  

> 安装的时候选择对应的版本安装，如果Kubernetes集群版本太低，会导致安装失败。

```yaml
kubectl apply --filename https://storage.googleapis.com/tekton-releases/triggers/latest/release.yaml
kubectl apply --filename https://storage.googleapis.com/tekton-releases/triggers/latest/interceptors.yaml
```

  

不过由于网络原因，直接按着官方文档进行安装是下载不了，我将自己用到的上传到了仓库（[https://gitee.com/coolops/tekton-install/tree/master/trigger](https://gitee.com/coolops/tekton-install/tree/master/trigger)），有需要的自己去下载。

​  

安装完成后，可以看到如下Pod。

```yaml
# kubectl get po -n tekton-pipelines 
NAME                                                 READY   STATUS    RESTARTS   AGE
tekton-dashboard-565c78b68d-6fjdz                    1/1     Running   12         32d
tekton-pipelines-controller-75c456df85-qxvq2         1/1     Running   5          32d
tekton-pipelines-webhook-5bc8d6b7c4-w6pdn            1/1     Running   5          32d
tekton-triggers-controller-686c6c8f79-fp7wd          1/1     Running   0          9m37s
tekton-triggers-core-interceptors-5d77595f79-8q9hb   1/1     Running   0          10s
tekton-triggers-webhook-76c55d6799-h997b             1/1     Running   0          9m36s
```

## 使用Tekton Trigger

上面已经安装好了Tekton Trigger，下面我们将正式接入Tekton Trigger实现自动持续部署。

​  

### 定义Trigger Template

回看《Tekton系列之实践篇-由Jenkins改成Tekton》中的PipelineRun的YAML文件，可以看到有参数revision、git\_url、imageUrl、imageTag、namespace等，所以在定义Trigger Template的时候需要这些参数传递进去。

​  

```yaml
apiVersion: triggers.tekton.dev/v1beta1 
kind: TriggerTemplate
metadata:
  name: trigger-rd-pipeline-template
spec:
  params:
    - name: gitrevision
      description: The git revision
      default: master
    - name: gitrepositoryurl
      description: The git repository url
    - name: namespace
      description: The namespace to create the resources
      default: tekton-devops-pipeline
    - name: projectname
      description: The project name
    - name: imagetag
      description: The image tag
      default: latest
  resourcetemplates:
    - apiVersion: tekton.dev/v1alpha1
      kind: PipelineRun
      metadata:
        name: rd-pipeline-run-$(uid)
        namespace: $(tt.params.namespace)
      spec:
        serviceAccountName: tekton-build-sa
        params: 
        - name: revision
          value: $(tt.params.gitrevision)
        - name: git_url
          value: $(tt.params.gitrepositoryurl)
        - name: imageUrl
          value: registry.cn-hangzhou.aliyuncs.com/coolops/$(tt.params.projectname)
        - name: imageTag
          value: latest
        - name: pathToDockerfile
          value: Dockerfile
        - name: chart_username
          value: AoWepE
        - name: chart_password
          value: XnifbX36lQ
        - name: app_name
          value: hello-world
        - name: namespace
          value: default
        - name: sonar_username
          value: admin
        - name: sonar_password
          value: Joker@123456
        - name: sonar_url
          value: http://sonarqube.coolops.cn
        pipelineRef:
          name: rd-pipeline
        workspaces:
        - name: rd-repo-pvc
          volumeClaimTemplate:
            spec:
              accessModes:
              - ReadWriteOnce
              storageClassName: local 
              resources:
                requests:
                  storage: 1Gi
        - name: docker-config
          secret:
            secretName: docker-config
        - name: kubernetes-config
          secret:
            secretName: kubernetes-config
```

  

### 定义Trigger Binding

Trigger Template的入参都可以通过PushEvent中获取，PushEvent里的数据需要通过Trigger Binding来绑定。

​  

```yaml
apiVersion: triggers.tekton.dev/v1beta1
kind: TriggerBinding
metadata:
  name: trigger-rd-pipeline-bingding
  namespace: tekton-devops-pipeline
spec:
  params:
    - name: gitrevision
      value: $(body.ref)
    - name: namespace
      value: tekton-devops-pipeline
    - name: gitrepositoryurl
      value: $(body.project.git_http_url)
    - name: projectname
      value: $(body.project.name)
```

  

### 定义EventListener

上面创建好Trigger Template和Trigger Binding，接下来就是创建EventListener，把Template和Binding关联起来。

```yaml
apiVersion: triggers.tekton.dev/v1beta1
kind: EventListener
metadata:
  name: trigger-rd-pipeline-eventlistener
spec:
  serviceAccountName: tekton-triggers-gitlab-sa
  triggers:
    - bindings:
        - ref: trigger-rd-pipeline-bingding
      template:
        ref: trigger-rd-pipeline-template
```

  

这里的`tekton-triggers-gitlab-sa`是需要我们创建的，如下：

```bash
apiVersion: v1
kind: ServiceAccount
metadata:
  name: tekton-triggers-gitlab-sa
secrets:
- name: gitlab-secret
- name: gitlab-auth
---
kind: ClusterRole
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  name: tekton-triggers-gitlab-minimal
rules:
  # Permissions for every EventListener deployment to function
  - apiGroups: ["triggers.tekton.dev"]
    resources: ["eventlisteners", "triggerbindings", "triggertemplates","clustertriggerbindings", "clusterinterceptors","triggers"]
    verbs: ["get","list","watch"]
  - apiGroups: [""]
    # secrets are only needed for Github/Gitlab interceptors, serviceaccounts only for per trigger authorization
    resources: ["configmaps", "secrets", "serviceaccounts"]
    verbs: ["get", "list", "watch"]
  # Permissions to create resources in associated TriggerTemplates
  - apiGroups: ["tekton.dev"]
    resources: ["pipelineruns", "pipelineresources", "taskruns"]
    verbs: ["create"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: tekton-triggers-gitlab-binding
subjects:
  - kind: ServiceAccount
    name: tekton-triggers-gitlab-sa
    namespace: tekton-devops-pipeline
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: tekton-triggers-gitlab-minimal
```

  

现在需要新增一个Gitlab的Webhook的Secret Token，如下：

```bash
apiVersion: v1
kind: Secret
metadata:
  name: gitlab-secret
type: Opaque
stringData:
  secretToken: "coolops"
```

  

当创建完EventListener过后，会在当前namespace下生成一个service和deployment，如下：

```bash
# kubectl get all | grep event
pod/el-trigger-rd-pipeline-eventlistener-674768c8d5-p8z66             2/2     Running     2          128m
service/el-trigger-rd-pipeline-eventlistener   ClusterIP   10.98.84.33      <none>        8080/TCP   128m
deployment.apps/el-trigger-rd-pipeline-eventlistener   1/1     1            1           128m
replicaset.apps/el-trigger-rd-pipeline-eventlistener-674768c8d5   1         1         1       128m
```

  

我们需要把这个service暴露出去，创建Ingress如下：

```yaml
apiVersion: extensions/v1beta1
kind: Ingress
metadata:
  name: el-trigger-test-eventlistener
spec:
  rules:
  - host: hello-word.webhook.coolops.cn
    http:
      paths:
      - backend:
          serviceName: el-trigger-rd-pipeline-eventlistener 
          servicePort: 8080
```

  

### 创建Webhook

上面已经把EventListener暴露出来了，下面就在代码仓库中创建Webhook。

​  

由于我的代码放在私有Gitlab中的，配置如下（由于内网，就直接使用了NodePort暴露EventListener）：

![image.png](assets/devops与交付/Tekton系列之实践篇-使用Tekton_Trigger使Tekton使用更简单/Tekton系列之实践篇-使用Tekton_Trigger使Tekton使用更简单-2.png)

  

然后可以测试一下，并查看更多的信息。

![image.png](assets/devops与交付/Tekton系列之实践篇-使用Tekton_Trigger使Tekton使用更简单/Tekton系列之实践篇-使用Tekton_Trigger使Tekton使用更简单-3.png)

  

需要的信息都是从Request中获取，如下：

```bash
{
  "object_kind": "push",
  "event_name": "push",
  "before": "77e1901516fc2ee1a47b03bb4bfc63ca02e6b23d",
  "after": "ac84d875c6094b5feebd477809a2021fd745c9df",
  "ref": "refs/heads/master",
  "checkout_sha": "ac84d875c6094b5feebd477809a2021fd745c9df",
  "message": null,
  "user_id": 1,
  "user_name": "Administrator",
  "user_username": "root",
  "user_email": "",
  "user_avatar": "https://www.gravatar.com/avatar/e64c7d89f26bd1972efa854d13d7dd61?s=80&d=identicon",
  "project_id": 2,
  "project": {
    "id": 2,
    "name": "Devops Hello World",
    "description": "",
    "web_url": "http://192.168.205.128/root/devops-hello-world",
    "avatar_url": null,
    "git_ssh_url": "git@192.168.205.128:root/devops-hello-world.git",
    "git_http_url": "http://192.168.205.128/root/devops-hello-world.git",
    "namespace": "Administrator",
    "visibility_level": 0,
    "path_with_namespace": "root/devops-hello-world",
    "default_branch": "master",
    "ci_config_path": null,
    "homepage": "http://192.168.205.128/root/devops-hello-world",
    "url": "git@192.168.205.128:root/devops-hello-world.git",
    "ssh_url": "git@192.168.205.128:root/devops-hello-world.git",
    "http_url": "http://192.168.205.128/root/devops-hello-world.git"
  },
  "commits": [
    {
      "id": "ac84d875c6094b5feebd477809a2021fd745c9df",
      "message": "ceshi ",
      "title": "ceshi ",
      "timestamp": "2022-03-30T08:54:11+00:00",
      "url": "http://192.168.205.128/root/devops-hello-world/-/commit/ac84d875c6094b5feebd477809a2021fd745c9df",
      "author": {
        "name": "coolops",
        "email": "baidjay@163.com"
      },
      "added": [

      ],
      "modified": [
        "Jenkinsfile"
      ],
      "removed": [

      ]
    },
    {
      "id": "cc36ed8cf920d9a3470fda6a28576ba7d29f9c04",
      "message": "ceshi ",
      "title": "ceshi ",
      "timestamp": "2022-03-30T08:52:13+00:00",
      "url": "http://192.168.205.128/root/devops-hello-world/-/commit/cc36ed8cf920d9a3470fda6a28576ba7d29f9c04",
      "author": {
        "name": "coolops",
        "email": "baidjay@163.com"
      },
      "added": [

      ],
      "modified": [
        "Jenkinsfile"
      ],
      "removed": [

      ]
    },
    {
      "id": "77e1901516fc2ee1a47b03bb4bfc63ca02e6b23d",
      "message": "多分支发布",
      "title": "多分支发布",
      "timestamp": "2022-03-30T08:45:11+00:00",
      "url": "http://192.168.205.128/root/devops-hello-world/-/commit/77e1901516fc2ee1a47b03bb4bfc63ca02e6b23d",
      "author": {
        "name": "coolops",
        "email": "baidjay@163.com"
      },
      "added": [

      ],
      "modified": [
        "Jenkinsfile"
      ],
      "removed": [

      ]
    }
  ],
  "total_commits_count": 3,
  "push_options": {
  },
  "repository": {
    "name": "Devops Hello World",
    "url": "git@192.168.205.128:root/devops-hello-world.git",
    "description": "",
    "homepage": "http://192.168.205.128/root/devops-hello-world",
    "git_http_url": "http://192.168.205.128/root/devops-hello-world.git",
    "git_ssh_url": "git@192.168.205.128:root/devops-hello-world.git",
    "visibility_level": 0
  }
}
```

  

需要什么就从Request中取什么。这样就可以通过WebHook触发一条Tekton流水线。

​  

可以看到流水线正常运行了。

![image.png](assets/devops与交付/Tekton系列之实践篇-使用Tekton_Trigger使Tekton使用更简单/Tekton系列之实践篇-使用Tekton_Trigger使Tekton使用更简单-4.png)

  

到目前为止，就可以实现代码提交到Gitlab，然后通过Webhook自动触发Tekton Pipeline了。