1、部署

```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/dashboard/v2.0.0-beta4/aio/deploy/recommended.yaml
```

  

2、把Service改成NodePort或者配置Ingress

```bash
kubectl patch svc kubernetes-dashboard -p '{"spec":{"type":"NodePort"}}' -n kube-system
```

  

3、认证

认证时的账号必须为ServiceAccount：被dashboard pod拿来由kubernetes进行认证；

  

（1）、Token

-   创建ServiceAccount，根据其管理目标，使用rolebinding或clusterrolebinding绑定至合理role或clusterrole;  
-   获取到此ServiceAccount的secret，查看secret的详细信息，其中就有token； 

  

（2）、kubeconfig：把ServiceAccount的token封装为kubeconfig文件

-   创建ServiceAccount，根据其管理目标，使用rolebinding或clusterrolebinding绑定至合理role或clusterrole; 
-   获取Token

```bash
# kubectl get secret | awk '/^ServiceAccount/{print $1}'
# KUBE_TOKEN=$(kubectl get secret SERVCIEACCOUNT_SERRET_NAME -o jsonpath={.data.token} |base64 -d)
```

-   生成kubeconfig文件

```bash
# kubectl config set-cluster --kubeconfig=/PATH/TO/SOMEFILE
# kubectl config set-credentials NAME --token=$KUBE_TOKEN --kubeconfig=/PATH/TO/SOMEFILE
# kubectl config set-context
# kubectl config use-context
```