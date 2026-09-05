# 敏感信息Secret

> 分类：Kubernetes / 第9章：存储
> 原文：https://www.cuiliangblog.cn/detail/section/15278153
> 来源：崔亮的博客

---

## 一、Secret概述


1. Secret对象存储数据以键值方式存储数据，在Pod资源中通过环境变量或存储卷进行数据访问。Secret对象仅会被分发至调用了此对象的Pod资源所在的工作节点，且只能由节点将其存储于内存中。Secret对象的数据的存储及打印格式为Base64编码的字符串，因此用户在创建Secret对象时也要提供此种编码格式的数据。
2. Secret对象主要有两种用途，一是作为存储卷注入到Pod上由容器应用程序所使用，二是用于kubelet为Pod里的容器拉取镜像时向私有仓库提供认证信息。使用ServiceAccount资源自建的Secret对象是一种更具安全性的方式。
3. Secret资源主要由四种类型组成
+ Opaque：自定义数据内容；base64编码，用来存储密码、密钥、信息、证书等数据，类型标识符为generic。
+ kubernetes.io/service-account-token:Service Account的认证信息，可在创建Service Accout时由Kubernetes自动创建。
+ kubernetes.io/dockerconfigjson：用来存储Docker镜像仓库的认证信息，类型标识为docker-registry。
+ kubernetes.io/tls：用于为SSL通信模式存储证书和私钥文件，命令式创建时类型标识为tls。

## 二、Opaque


### 通过命令创建资源
> 使用 `“kubectl createsecret generic <SECRET_NAME>--from-literal=key=value”` 命令直接进行创建
>

+ 创建了一个名为mysql-auth的Secret对象，用户名为root，密码为CHANGE_ME  
`# kubectl create secret generic mysql-auth --from-literal=username=root --from-literal=password= CHANGE_ME` 
+ 查看资源详细信息  
![](assets/06-Kubernetes/ad934b172c826a334183.png)

### 通过文件创建资源
> 使用“ `kubectl create secret generic <SECRET_NAME> --from-file[=KEY1]=/PATH/TO/FILE` ”命令加载认证文件内容并生成为Secret对象
>

```bash
[root@k8s-master redis-ssl]# ls
ca.crt
[root@k8s-master redis-ssl]# kubectl create secret generic redis-ca --from-file=ca.crt=ca.crt
secret/redis-ca created
[root@k8s-master redis-ssl]# kubectl describe secrets redis-ca 
Name:         redis-ca
Namespace:    default
Labels:       <none>
Annotations:  <none>

Type:  Opaque

Data
====
ca.crt:  1895 bytes
```

### 使用Secret清单创建
+ Opaque 类型的数据是一个 map 类型，要求 value 是 base64 编码格式

![](assets/06-Kubernetes/f2fe88adeb636d8619f2.png)

+ 创建资源清单文件

![](assets/06-Kubernetes/7b12ad19c61e621af5e3.png)

+ 或者将用户名和密码保存至文件中

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: thanos-objectstorage
type: Opaque
stringData:
  key.yaml: |
    username: YWRtaW4=
    passowrd: MTIzLmNvbQ==
```

### 将secret挂载到volume中
+ 创建pod资源清单

![](assets/06-Kubernetes/35f5c3dc3b619b410b03.png)

+ 查看pod信息

![](assets/06-Kubernetes/eb64f94d046339f7c377.png)

### 将secret导入到环境变量中
+ 创建pod资源清单

![](assets/06-Kubernetes/041850e065a9936eb5b1.png)

+ 查看pod信息

![](assets/06-Kubernetes/df04365fcf2d2f8e8d3a.png)

## 三、Service Account


1. Service Account 用来访问 Kubernetes API，由 Kubernetes自动创建，并且会自动挂载到Pod的/run/secrets/kubernetes.io/serviceaccount目录中
2. 验证
+ 创建nginx资源  
`# kubectl run nginx --image nginx` 
+ 查看资源信息

![](assets/06-Kubernetes/552e9d64385334b3dd8e.png)



## 四、docker config json


1. 使用 Kuberctl 创建 docker registry 认证的 secret  
`kubectl create secret docker-registry myregistrykey --docker-server=DOCKER_REGISTRY_SERVER --docker-username=DOCKER_USER --docker-password=DOCKER_PASSWORD --docker-email=DOCKER_EMAIL` 
2. 在创建 Pod 的时候，通过imagePullSecrets来引用刚创建的 `myregistrykey`

![](assets/06-Kubernetes/4670767a838a6d727d11.png)



## 五、TLS


1. 使用“kubectl create secret tls <SECRET_NAME> --cert=--key=”命令加载TLS文件内容并生成secret对象
+ 将TLS密钥认证文件创建secret对象

```bash
[root@k8s-master redis-ssl]# ls
redis.crt redis.key
[root@k8s-master redis-ssl]# kubectl create secret tls redis-tls --key=redis.key --cert=redis.crt
secret/redis-tls created
[root@k8s-master redis-ssl]# kubectl describe secrets redis-tls 
Name:         redis-tls
Namespace:    default
Labels:       <none>
Annotations:  <none>

Type:  kubernetes.io/tls

Data
====
tls.crt:  1407 bytes
tls.key:  1679 bytes
```


