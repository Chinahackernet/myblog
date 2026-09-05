# ns处于Terminating状态删除

> 分类：Kubernetes / 第17章：日常维护
> 原文：https://www.cuiliangblog.cn/detail/section/179836599
> 来源：崔亮的博客

---

# 问题表现
```bash
[root@tiaoban argocd]# kubectl delete ns argocd 
namespace "argocd" deleted
^C[root@tiaoban argocd]# kubectl get ns
NAME                   STATUS        AGE
argocd                 Terminating   23h
```

# 使用force强制删除
```bash
[root@tiaoban argocd]# kubectl delete ns argocd --force 
Warning: Immediate deletion does not wait for confirmation that the running resource has been terminated. The resource may continue to run on the cluster indefinitely.
namespace "argocd" force deleted
[root@tiaoban argocd]# kubectl api-resources -o name --verbs=list --namespaced | xargs -n 1 kubectl get --show-kind --ignore-not-found -n argocd
NAME                                 SYNC STATUS   HEALTH STATUS
application.argoproj.io/blue-green   Unknown       Healthy
```

# 使用API接口删除
导出json格式的ns信息

```bash
[root@tiaoban ~]# kubectl get ns argocd -o json  > argocd.json
```

编辑argocd.json文件，确保spec中内容为空，如下：

```bash

"spec": {
    "finalizers": [    #########
        "kubernetes"   ######### 删除这三行内容，告知k8s要删除的ns中内容为空
    ]                  #########
},
```

使用kube-proxy开启端口

```bash
[root@master1 ~]# kubectl proxy --port=8081
Starting to serve on 127.0.0.1:8081
```

调用api接口覆盖原来的ns

```bash
[root@master1 ~]# curl -k \
-H "Content-Type: application/json" \
-X PUT \
--data-binary @argocd.json \
http://127.0.0.1:8081/api/v1/namespaces/argocd/finalize
```

查看验证

```bash
[root@master1 ~]# kubectl get ns
```

# 其他异常处理
## 存在 webhook 导致无法删除 
有时候该 ns 下存在 webhook 资源，如果强制删除后会提示无法创建新的 ns

```bash
# kubectl create ns test                  
Error from server (InternalError): Internal error occurred: failed calling webhook "rancher.cattle.io.namespaces.create-non-kubesystem": failed to call webhook: Post "https://rancher-webhook.cattle-system.svc:443/v1/webhook/validation/namespaces?timeout=10s": service "rancher-webhook" not found
```

此时需要找到MutatingWebhookConfiguration 和 ValidatingWebhookConfiguration 资源，然后删除对应的 webhook

```bash
# kubectl get MutatingWebhookConfiguration                  
NAME                WEBHOOKS   AGE
rancher.cattle.io   4          4d5h
# kubectl delete MutatingWebhookConfiguration rancher.cattle.io                                                                        
mutatingwebhookconfiguration.admissionregistration.k8s.io "rancher.cattle.io" deleted
# kubectl get ValidatingWebhookConfiguration                            
NAME                             WEBHOOKS   AGE
elastic-webhook.k8s.elastic.co   14         4d4h
rancher.cattle.io                9          4d5h
# kubectl delete ValidatingWebhookConfiguration rancher.cattle.io                            
validatingwebhookconfiguration.admissionregistration.k8s.io "rancher.cattle.io" deleted
# kubectl create ns test                                         
namespace/test created
```


