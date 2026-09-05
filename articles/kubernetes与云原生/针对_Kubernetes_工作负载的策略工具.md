以下文章来源于[崔秀龙](https://blog.fleeto.us/)的博客，文章原地址：[https://blog.fleeto.us/post/kubernetes-policies/](https://blog.fleeto.us/post/kubernetes-policies/)

---

原文：[Enforcing policies and governance for Kubernetes workloads](https://learnk8s.io/kubernetes-policies)

作者：[Amit Saha](https://echorand.me/)

> 本文将会讲述使用 [conftest](https://github.com/open-policy-agent/conftest) 这样的静态工具以及 [Gatekeeper](https://github.com/open-policy-agent/gatekeeper) 之类的集群内 Operator 为 Kubernetes 工作负载提供策略支持的方法。

本文所讲的策略，指的是在 Kubernetes 中，阻止特定工作负载进行部署的方法。

这种要求通常是出于合规的考虑，有一些最佳实践可以推荐给集群管理员：

1.  不要运行特权 Pod。
2.  不要用 root 运行 Pod。
3.  指定资源限制。
4.  不要使用 latest 标签的镜像。
5.  限制 Linux capability 的使用。

除去上述安全要求，可能还会有一些应用管理方面的需要，例如：

-   所有工作负载都应该有 project 和 app 标签。
-   所有工作负载都应该从特定镜像库获取（例如 my-company.com）。

最后还有一类需求，防止工作负载之间的冲突，例如多个服务不应使用同样的 Ingress 主机名。

下面会分别讲述集群内外进行策略实施的方法。

不符合策略规定的工作负载将被拒绝部署。

集群外方式是通过对 YAML 文件进行静态检查之后，根据检查结果决定是否放行的。

有[多种工具](https://deploy-preview-317--learnk8s.netlify.app/validating-kubernetes-yaml)能够完成这一任务。

集群内方式是使用 Validating admission controller，这些控制器会在工作负载进入数据库之前进行调用。

> 本文所涉的代码可以在 [github](https://github.com/amitsaha/kubernetes-policy-enforcement-demo) 找到。

## 不合规的 Deployment

假设我们有这样一个 YAML：

```plain
apiVersion: apps/v1
kind: Deployment
metadata:
  name: http-echo
  labels:
    app: http-echo
spec:
  replicas: 2
  selector:
    matchLabels:
      app: http-echo
  template:
    metadata:
      labels:
        app: http-echo
    spec:
      containers:
      - name: http-echo
        image: hashicorp/http-echo
        args: ["-text", "hello-world"]
        ports:
        - containerPort: 5678
      - name: http-echo-1
        image: hashicorp/http-echo:latest
        args: ["-text", "hello-world"]
        ports:
        - containerPort: 5678
```

上面的清单会生成一个 Pod，其中包含两个容器，这两个容器使用的是同一个镜像。

第一个容器没有指定镜像标签，另外一个用的是 latest，最终他们使用的都是 hashicorp/http-echo 镜像的 latest 版本。

这不符合前面说的最佳实践，应该阻止这种工作负载在我们的集群上运行。正确的指定镜像的方式是填写精确的标签，例如 hashicorp/http-echo:0.2.3。

那么就看看如何使用静态分析的方式，制定策略来制止这种工作负载的部署。

要阻止这种资源到达集群，可能要在如下位置嵌入这个分析过程：

-   Git 的 pre-commit，在进入 GIT 之前进行检查。
-   作为 CI/CD Pipeline 的一部分，在 Git 分支合并到主线之前进行检查。
-   作为 CI/CD Pipeline 的一部分，在资源被提交到集群之间进行检查。

## 使用 Conftest 实时策略

[Conftest](https://conftest.dev/) 是一个针对配置文件的测试框架，能够用于对 Kubernetes 清单文件进行检查和校验。

Conftest 的测试使用一种叫 [Rego](https://www.openpolicyagent.org/docs/latest/policy-language/) 的 DSL 编写。

可以根据项目网站上的[安装指导](https://www.conftest.dev/install/)进行安装。

> 目前的最新版本为 0.19.0。

接下来定义两条策略：

```plain
package main
deny[msg] {
  input.kind == "Deployment"
  image := input.spec.template.spec.containers[_].image
  not count(split(image, ":")) == 2
  msg := sprintf("image '%v' doesn't specify a valid tag", [image])
}
deny[msg] {
  input.kind == "Deployment"
  image := input.spec.template.spec.containers[_].image
  endswith(image, "latest")
  msg := sprintf("image '%v' uses latest tag", [image])
}
```

猜猜这两条策略有什么用？

两个策略都是用在 Deployment 对象上的，他们会从 spec.container 字段中获取内容。

第一条规则用于检查镜像是否带有标签：

```plain
not count(split(image, ":")) == 2
```

第二条规则会检查，标签是否为 latest：

```plain
endswith(image, "latest")
```

如果条件为真，那么 deny 块就会被判为非法。

如果代码中的 deny 超过一个，conftest 会分别进行检查，如果任意一个 deny 生效，都会做出违规判断。

把这段代码保存为 check\_image\_tag.rego，并运行 conftest 对 deployment.yaml 进行检查：

```plain
$ conftest test -p conftest-checks test-data/deployment.yaml
FAIL - test-data/deployment.yaml - image 'hashicorp/http-echo' doesn't specify a valid tag
FAIL - test-data/deployment.yaml - image 'hashicorp/http-echo:latest' uses latest tag
2 tests, 0 passed, 0 warnings, 2 failures
```

两个测试的结果都是失败。

conftest 是静态的，需要在把 YAML 提交给集群之前进行检查。

如果已经在使用 CICD 工具向集群提交 YAML，就需要新增一个步骤，使用 conftest 策略对所有资源进行校验。

但是这样就可以阻止用户向集群提交使用 latest 标签的 Deployment 对象吗？

当然了，所有具备权限的人，只要跳过 CICD 就可以用 kubectl apply -f deployment.yaml 中在集群中创建这种违规对象。

所以要在集群中部署动态检查来弥补这种不足——在非法对象被发送给集群之后拒绝。

## Kubernetes API

回顾一下创建下面 Pod 的过程：

```plain
apiVersion: v1
kind: Pod
metadata:
  name: my-pod
spec:
  containers:
  - name: sise
    image: learnk8s/app:1.0.0
    ports:
    - containerPort: 8080
```

kubectl apply -f pod.yaml 执行之后，对象定义被发送给 API Server：

1.  YAML 保存到 ETCD。
2.  调度器把 Pod 分配给 Node。
3.  Kubelet 收到 Pod 定义，并创建对象。

只有这么一点么？

如果 YAML 有拼写错误怎么办？

如何阻止无效的 YAML 进入 ETCD？

在 kubectl apply 时候，首先是 Kubelet 做了一些事：

1.  在客户端对资源定义进行检查。
2.  把 YAML 转换为 JSON。
3.  从 KUBECONFIG 读入配置。
4.  把对象报文发送给 kube-apiserver。

api-server 收到请求之后，也不会立即存入 etcd。

首先他要检查请求者身份是否合法，也就是进行[认证](https://kubernetes.io/docs/reference/access-authn-authz/authentication/)。

通过认证之后，还要判断该用户是否有权创建资源？

身份和权限不能混为一谈，能访问集群不代表能够读写所有对象。鉴权过程通常是使用 [RBAC](https://kubernetes.io/docs/reference/access-authn-authz/rbac/) 机制实现。

有了 RBAC，就可以通过适当的授权来限制用户的能力了。

假设用户已经能够通过认证并且具备所需权限，是不是就能够把 Pod 定义保存到 Pod 之中了？并不是。

api-server 自身也是一个 Pipeline。

请求报文在保存到数据库之前，还要经过几个组件。认证和授权就是这些组件的一部分，还有其他组件。

在对象进入数据库之前，首先会由 [Admission Controller](https://kubernetes.io/docs/reference/access-authn-authz/admission-controllers/) 进行处理。

这个步骤中，就有机会对当前资源进行更多检查。Kubernetes 缺省启用了几个 Admission Controller：

> kube-apiserver 的 --enable-admission-plugins 中可以看到启用的项目。

下面用 NamespaceLifecycle 为例来看看 Admission Controller 的行为。

## Validating admission controllers

NamespaceLifecycle 会阻止用户在不存在的 Namespace 中创建 Pod，例如下面的定义：

```plain
apiVersion: v1
kind: Pod
metadata:
  name: my-pod
  namespace: does-not-exist
spec:
  containers:
  - name: sise
    image: learnk8s/app:1.0.0
    ports:
    - containerPort: 8080
```

YAML 结构是有效的，所以它能通过 kubectl 的校验，提交给集群。

假设用户通过了认证和鉴权，这个请求就会进入 NamespaceLifecycle。does-not-exist 命名空间并不存在，请求被拒绝。

另外 NamespaceLifecycle 还会阻止删除 default、kube-system 和 kube-public 命名空间的请求。

用于对请求进行校验的控制器被集中在 Validating 分类之中。

除此之外还有另外一个分类，被称为 Mutating。

## Mutating admission controllers

从名字就看得出，Mutating Controller 控制器能够对请求报文做出变更。

DefaultStorageClass 就是一个很好的例子。

假设要创建一个 PVC 对象：

```plain
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: my-pvc
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 3Gi
```

这个对象提交之后，如果使用 kubectl get pvc，会发现存储卷状态为 Bound 并且被赋予了一个 standard 的 StorageClass。

```plain
NAME     STATUS   VOLUME         CAPACITY   ACCESS MODES   STORAGECLASS   AGE
my-pvc   Bound    pvc-059f2da2   3Gi        RWO            standard       3s
```

很明显我们的 YAML 中并没有这些定义。用 kubectl get pvc my-pvc -0 yaml 查看一下 YAML，会看到如下内容：

```plain
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: my-pvc
spec:
  accessModes:
  - ReadWriteOnce
  resources:
    requests:
      storage: 3Gi
  storageClassName: standard
  volumeMode: Filesystem
  volumeName: pvc-059f2da2-a216-42b7-875e-e7da327605dd
```

多出了一行 storageClassName: standard。这里的 standard 并不是 API 中硬编码的，而是把缺省 StorageClass 的名字注入到 spec.storageClassName 之中。

可以用命令读取缺省 StorageClass：

```plain
$ kubectl get storageclass
NAME                 PROVISIONER                RECLAIMPOLICY   VOLUMEBINDINGMODE   AGE
standard (default)   k8s.io/minikube-hostpath   Delete          Immediate           8m
```

如果缺省 StorageClass 名称为 aws-ebs，DefaultStorageClass Admission Controller 会把它注入到之前 standard 所在的位置。

Kubernetes 带有多个 Mutating 和 Validating Admission Controller，官方网站上有[完整的列表](https://kubernetes.io/docs/reference/access-authn-authz/admission-controllers/)。

请求在经过这些关卡之后，才能保存到数据库。

如果想要自定义检查或变更过程，如何能加入自己的规则呢？

### Admission Controller 的扩展性

除了 Kubernetes 内置之外，他也可以使用自己的 Admission Controller。

有两个可编程的点：MutationAdmissionWebhook 和 ValidationAdmissionWebhook。可以在这两个 Webhook 上注册自己的组件，这样在 Admission 阶段就可以使用自定义的组件来处理对象了。

因此可以编写一个组件，来检查当前 Pod 是否使用了来自特定私有镜像库的镜像。

把这个组件注册到 ValidationAdmissionWebhook，来对容器定义做出放行或阻拦的决策。

这就是 Gatekeeper 的用途——它可以被注册到集群，对请求信息进行校验。

## 用 Gatekeeper 实施策略

[Gatekeeper](https://github.com/open-policy-agent/gatekeeper) 让 Kubernetes 管理员可以定义策略来保证集群的合规性，并符合最佳实践的要求。

Gatekeeper 会将自己注册到 Validation Webhook。

### 提交到集群的任何资源都会被活动的策略进行检查。

同时 Gatekeeper 也符合 Kubernetes 的架构建议，使用 CRD 来管理策略，因此它的策略也是 Kubernetes 资源。

> [Google 云文档](https://cloud.google.com/anthos-config-management/docs/concepts/policy-controller)在这方面有很精彩的阐述。

从内部看，Gatekeeper 使用 Open Policy Agent(OPA) 作为核心的策略引擎，策略使用 Rego 语言编写——和 conftest 一样。

在下面的内容里，会尝试使用 Gatekeeper。此处要求用户使用管理用户操作 Kubernetes，使用下面的指令部署 Gatekeeper：

```plain
kubectl apply -f \
https://raw.githubusercontent.com/open-policy-agent/gatekeeper/master/deploy/gatekeeper.yaml
```

检查运行情况：

```plain
$ kubectl -n gatekeeper-system describe svc gatekeeper-webhook-service
Name:              gatekeeper-webhook-service
Namespace:         gatekeeper-system
Labels:            gatekeeper.sh/system=yes
Annotations:       ...
Type:              ClusterIP
IP:                10.102.199.165
Port:              <unset>  443/TCP
TargetPort:        8443/TCP
Endpoints:         172.18.0.4:8443
```

这个服务就是用于验证的的。所有的 Pod、Deployment、Service 等，都要受到 Gatekeeper 的监管

### 使用 ContstraintTemplate 定义可复用的策略

在 Gatekeeper 中，首先需要使用 ContstraintTemplate 创建策略。

下面的 ContstraintTemplate 定义会拒绝使用 latest 标签的镜像。

```plain
apiVersion: templates.gatekeeper.sh/v1beta1
kind: ConstraintTemplate
metadata:
  name: k8simagetagvalid
spec:
  crd:
    spec:
      names:
        kind: K8sImageTagValid
  targets:
    - target: admission.k8s.gatekeeper.sh
      rego: |
        package k8simagetagvalid
        violation[{"msg": msg, "details":{}}] {
          image := input.review.object.spec.template.spec.containers[_].image
          not count(split(image, ":")) == 2
          msg := sprintf("image '%v' doesn't specify a valid tag", [image])
        }
        violation[{"msg": msg, "details":{}}] {
          image := input.review.object.spec.template.spec.containers[_].image
          endswith(image, "latest")
          msg := sprintf("image '%v' uses latest tag", [image])
        }
```

这个策略和前面 conftest 的策略类似，但是也有些区别。

-   输入对象名称为 input.review.object，而不是 input，这里也无需检查输入对象的 kind。
-   deny 规则改为 violation。

violation 块的签名是一个包含两个属性的对象。

-   第一个是字符串类型的 msg。
-   第二个是 details 对象，其中可以包含任意属性。

这两个属性都会用作返回值。

接下来用 kubectl 把这个定义提交到集群。然后就可以使用 describe 命令查询模板情况：

```plain
$ kubectl apply -f templates/check_image_tag.yaml
constrainttemplate.templates.gatekeeper.sh/k8simagetagvalid created
$ kubectl describe constrainttemplate.templates.gatekeeper.sh/k8simagetagvalid
Name:         k8simagetagvalid
Namespace:
Labels:       <none>
Annotations:  kubectl.kubernetes.io/last-applied-configuration:
                {"apiVersion":"templates.gatekeeper.sh/v1beta1","kind":"ConstraintTemplate","metadata":
                {"annotations":{},"name":"k8simagetagvalid"},"spec"...
API Version:  templates.gatekeeper.sh/v1beta1
Kind:         ConstraintTemplate
```

这个对象并不能直接用于进行校验。它只是一个策略定义，要使用这个策略，还要创建一个 Constraint。

### 创建一个 Constraint

Constraint 对象的含义是“在集群中使用这个策略”。

可以把 ConstraintTemplates 当做一本菜谱，其中包含虽然包含几百个菜式，但是菜谱本身是无法食用的。必须选择菜谱并按照菜谱要求提供相应的材料，进行合适的操作，才能烤出蛋糕。

下面举个例子，用前面的 K8sImageTagValid 创建一个 Contraint：

```plain
apiVersion: constraints.gatekeeper.sh/v1beta1
kind: K8sImageTagValid
metadata:
  name: valid-image-tag
spec:
  match:
    kinds:
      - apiGroups: ["apps"]
        kinds: ["Deployment"]
```

这个 Constraint 引用了 ConstraintTemplate，并用 spec.match 字段规定了适用的资源类型。这里我们要求针对 api 组下的 Deployment 对象进行检查。

这些字段是数组类型的，因此可以指定多个值，把检查范围扩展到 StatefulSet、DaemonSet 等。

用 kubectl apply 提交这个对象。

### 测试策略

用带有两个镜像的 Deployment 进行测试：

```plain
$ kubectl apply -f deployment.yaml
Error from server ([denied by valid-image-tag] image 'hashicorp/http-echo' doesn't specify a valid tag
[denied by valid-image-tag] image 'hashicorp/http-echo:latest' uses latest tag): error when creating
"test-data/deployment.yaml": admission webhook "validation.gatekeeper.sh" denied the request:
[denied by valid-image-tag] image 'hashicorp/http-echo' doesn't specify a valid tag
[denied by valid-image-tag] image 'hashicorp/http-echo:latest' uses latest tag
```

Gatekeeper 拒绝了输入内容，可以看出这个过程是不能跳过的。

如果集群中正在运行工作负载，此时实施 Gatekeeper 策略可能会很有难度——这有因为合规问题导致业务中断的风险。

Gatekeeper 还允许使用 dry-run 模式运行 Constraint：

```plain
apiVersion: constraints.gatekeeper.sh/v1beta1
kind: K8sImageTagValid
metadata:
  name: valid-image-tag
spec:
  enforcementAction: dryrun
  match:
    kinds:
      - apiGroups: ["apps"]
        kinds: ["Deployment"]
```

这个模式中，策略不会阻止工作负载的部署，但是会在对象的 Violation 字段中记录违规行为：

```plain
$ kubectl describe k8simagetagvalid.constraints.gatekeeper.sh/valid-image-tag
Name:         valid-image-tag
Namespace:
Labels:       <none>
Annotations:  kubectl.kubernetes.io/last-applied-configuration:
....
  Total Violations:  2
  Violations:
    Enforcement Action:  dryrun
    Kind:                Deployment
    Message:             image 'hashicorp/http-echo' doesn't specify a valid tag
    Name:                http-echo
    Namespace:           default
    Enforcement Action:  dryrun
    Kind:                Deployment
    Message:             image 'hashicorp/http-echo:latest' uses latest tag
    Name:                http-echo
    Namespace:           default
Events:                  <none>
```

在确保所有工作负载都合规之后，就可以移除 dry-run，正式启用策略了。

### 标签检查

这个例子会检查 Deployment 对象，要求必须包含 project 和 app 两个标签。

如果用 conftest：

```plain
package main
deny[msg] {
  input.kind == "Deployment"
  required := {"app", "project"}
  provided := {label | input.metadata.labels[label]}
  missing := required - provided
  count(missing) > 0
  msg = sprintf("you must provide labels: %v", [missing])
}
```

上面代码中：

-   required 是一个集合，其中包含了 app 和 project 两个元素。我们希望每个 Deployment 都包含这两个标签。
-   provided 会从输入中读取当前对象的标签。
-   两个集合相减，得到缺失的标签的集合，赋值给 missing。
-   用 count() 函数获取 missing 集合的元素数量，如果大于零，代表该输入不合规。

测试一下：

```plain
$ conftest test -p conftest-checks/check_labels.rego test-data/deployment.yaml
FAIL - test-data/deployment.yaml - you must provide labels: {"project"}
1 test, 0 passed, 0 warnings, 1 failure
```

在 YAML 中加入要求的标签，才能通过测试。

```plain
apiVersion: apps/v1
kind: Deployment
metadata:
  name: http-echo
  labels:
    app: http-echo
    project: test
...
```

前面提到，这样的不合规对象还是可以提交给集群的，因此还是需要 Gatekeeper 来在集群之中使用策略。

首先创建一个 ConstraintTemplate：

```plain
apiVersion: templates.gatekeeper.sh/v1beta1
kind: ConstraintTemplate
metadata:
  name: k8srequiredlabels
spec:
  crd:
    spec:
      names:
        kind: K8sRequiredLabels
      validation:
        # Schema for the `parameters` field
        openAPIV3Schema:
          properties:
            labels:
              type: array
              items: string
  targets:
    - target: admission.k8s.gatekeeper.sh
      rego: |
        package k8srequiredlabels
        violation[{"msg": msg, "details": {"missing_labels": missing}}] {
          provided := {label | input.review.object.metadata.labels[label]}
          required := {label | label := input.parameters.labels[_]}
          missing := required - provided
          count(missing) > 0
          msg := sprintf("you must provide labels: %v", [missing])
        }
```

上述代码演示了如何从输入中抓取参数。

并且这里使用 openAPIV3Schema 对输入进行过滤，这一节代码表示要求输入对象有一个参数 label，其数据类型为字符串数组。所有输入都通过 input.parameters 属性传递给 constraint。

模板提交以后，就可以据此创建 Contstraint 了：

```plain
apiVersion: constraints.gatekeeper.sh/v1beta1
kind: K8sRequiredLabels
metadata:
  name: deployment-must-have-labels
spec:
  match:
    kinds:
      - apiGroups: ["apps"]
        kinds: ["Deployment"]
  parameters:
    labels: ["app", "project"]
```

这个对象提交以后，集群中就有了校验镜像和校验标签的两个 Constraint。

再次创建前面的 Deployment：

```plain
$ kubectl apply -f deployment.yaml
Error from server ([denied by deployment-must-have-labels] you must provide labels: {"project"}
[denied by valid-image-tag] image 'hashicorp/http-echo' doesn't specify a valid tag
[denied by valid-image-tag] image 'hashicorp/http-echo:latest' uses latest tag): error when creating
"deployment.yaml": admission webhook "validation.gatekeeper.sh" denied the request:
[denied by deployment-must-have-labels] you must provide labels: {"project"}
[denied by valid-image-tag] image 'hashicorp/http-echo' doesn't specify a valid tag
[denied by valid-image-tag] image 'hashicorp/http-echo:latest' uses latest tag
```

意料之中的创建失败。只有修改 YAML，合规之后才能通过。

## 总结

Conftest 和 Gatekeeper 都是用 Rego 语言定义策略的，这两个工具结合起来就能覆盖集群内外的校验要求了。

正如你所见，Conftest 的 Rego 策略需要做点修改才能用在 Gatekeeper 里。[Konstraint](https://github.com/plexsystems/konstraint) 项目可以解决这个问题。该工具能把 Conftest 策略转换为 Gatekeeper 的 ConstraintTemplate 和 Constraint，并且它还能方便地对策略进行测试。

除了本文的两个工具之外，集群内外的策略检查都还有别的选择。它们的主要优势就是使用了通用的 Rego 语言。例如 [Polaris](https://github.com/FairwindsOps/polaris) 同时提供了集群内外的校验功能。然而它使用的是基于 JSON 的策略描述方法，其表达能力远弱于 Rego。