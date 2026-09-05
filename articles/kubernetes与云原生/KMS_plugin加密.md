KMS 加密驱动使用封套加密模型来加密 etcd 中的数据。 数据使用数据加密秘钥（DEK）加密；每次加密都生成一个新的 DEK。 这些 DEK 经一个秘钥加密秘钥（KEK）加密后在一个远端的 KMS 中存储和管理。 KMS 驱动使用 gRPC 与一个特定的 KMS 插件通信。这个 KMS 插件作为一个 gRPC 服务器被部署在 Kubernetes 主服务器的同一个主机上，负责与远端 KMS 的通信。

  

现在基本云厂商都提供KMS服务。这里以阿里云为例。

  

（1）开通密钥管理服务

![image.png](assets/kubernetes与云原生/KMS_plugin加密/KMS_plugin加密-1.png)

  

（2）创建密钥

![image.png](assets/kubernetes与云原生/KMS_plugin加密/KMS_plugin加密-2.png)

（3）然后部署kms-plugin

```yaml
apiVersion: apps/v1
kind: Deployment 
metadata:
  name: ack-kms-plugin
  namespace: kube-system
spec:
  selector:
   matchLabels:
     name: ack-kms-plugin
  template:
   metadata:
     labels:
       name: ack-kms-plugin
   spec:
     affinity:
        nodeAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
            - preference: {}
              weight: 100
          requiredDuringSchedulingIgnoredDuringExecution:
            nodeSelectorTerms:
              - matchExpressions:
                  - key: node
                    operator: In
                    values:
                      - master
     restartPolicy: Always
     tolerations:
     - key: node-role.kubernetes.io/master
       effect: NoSchedule
     volumes:
     - name: kmssocket
       hostPath:
         path: /var/run/kmsplugin
         type: DirectoryOrCreate
     containers:
     - name: ack-kms-plugin
       image: registry.{{ .Region }}.aliyuncs.com/acs/ack-kms-plugin:v1.0.2
       imagePullPolicy: Always
       command:
       - ack-kms-plugin
       - --gloglevel=5
       - --key-id={{ .KeyId }}
       - --path-to-unix-socket=/var/run/kmsplugin/grpc.sock
       livenessProbe:
         exec:
           command:
           - ack-kms-plugin
           - health
           - --path-to-unix-socket=/var/run/kmsplugin/grpc.sock
         initialDelaySeconds: 30
         failureThreshold: 3
         timeoutSeconds: 5
         periodSeconds: 300
       env:
         - name: ACCESS_KEY_ID    #not required if you want plugin help to pull the sts credentials
           value: {{ .AK }}
         - name: ACCESS_KEY_SECRET   #not required if you want plugin help to pull the sts credentials
           value: {{ .AK_Secret }}
         - name: CREDENTIAL_INTERVAL   #not required if you want plugin help to pull the sts credentials
           value: {{ .Credential_Interval }}
       volumeMounts:
       - name: kmssocket
         mountPath: /var/run/kmsplugin
         readOnly: false
```

其中需要更改的地方：

-   {{ .Region }}：阿里巴巴云区域 ID， 如果您的群集部署在 ECS 上， 您可以通过curl [http://100.100.100.200/latest/meta-data/region-id](http://100.100.100.200/latest/meta-data/region-id)
-   {{ .KeyId }}：Kms 服务列表中用于秘密加密的阿里云 Kms 密钥 ID
-   {{ .AK }}：授权的角色ID
-   {{ .AK\_Secret }}：授权的角色密钥
-   {{ .Credential\_Interval }}：凭据轮询间隔

  

（4）创建kms插件配置文件/etc/kubernetes/kmsplugin/encryptionconfig.yaml

```yaml
apiVersion: apiserver.config.k8s.io/v1
kind: EncryptionConfiguration
resources:
  - resources:
    - secrets
    providers:
    - kms:
        name: grpc-kms-provider
        endpoint: unix:///var/run/kmsplugin/grpc.sock
        cachesize: 1000
        timeout: 3s
    - identity: {}
```

  

（5）修改kube-apiserver配置清单文件/etc/kubernetes/manifests/kube-apiserver.yaml

在启动参数里加入：

```yaml
......
spec:
  containers:
  - command:
    - kube-apiserver
    - --encryption-provider-config=/etc/kubernetes/kmsplugin/encryptionconfig.yaml
......
```

然后再配置挂载，如下：

```yaml
...
  volumeMounts:
  - name: kms-sock
    mountPath: /var/run/kmsplugin
  - name: kms-config
    mountPath: /etc/kubernetes/kmsplugin
...
  volumes:
  - name: kms-sock
    hostPath:
      path: /var/run/kmsplugin
  - name: kms-config
    hostPath:
      path: /etc/kubernetes/kmsplugin
```

（6）重启kube-apiserver

（7）验证

现在，群集应使用信封加密方案，使用阿里云 KMS 的给定密钥加密密钥 （KEK） 对 中的秘密进行加密

1\. 创建新机密

```bash
$ kubectl create secret generic secret1 -n default --from-literal=mykey=mydata
```

  

2\. 使用 etcdtl，读取主节点中的 etcd**中的机密**：

ps： [.local-ip] 应替换为主节点 IP 之一。

```bash
$ ETCDCTL_API=3 etcdctl --cacert=/etc/kubernetes/pki/etcd/ca.pem --cert=/etc/kubernetes/pki/etcd/etcd-client.pem --key=/etc/kubernetes/pki/etcd/etcd-client-key.pem --endpoints=https://{{.local-ip}}:2379 get /registry/secrets/default/secret1
```

  

3\. 验证存储的机密是否前缀，指示我们的 kms 提供商已加密生成的数据。`k8s:enc:kms:v1:grpc-kms-provider`

4\. 验证密钥是否已正确解密：

```bash
$ kubectl get secrets secret1 -o yaml
```