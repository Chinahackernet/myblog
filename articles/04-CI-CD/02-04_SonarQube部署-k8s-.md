# SonarQube部署(k8s)

> 分类：CI/CD / 第2章：SonarQube代码扫描
> 原文：https://www.cuiliangblog.cn/detail/section/165547985
> 来源：崔亮的博客

---

参考文档：[https://docs.sonarsource.com/sonarqube/9.9/setup-and-upgrade/deploy-on-kubernetes/deploy-sonarqube-on-kubernetes/](https://docs.sonarsource.com/sonarqube/9.9/setup-and-upgrade/deploy-on-kubernetes/deploy-sonarqube-on-kubernetes/)

# 安装SonarQube
添加helm仓库

```bash
[root@tiaoban ~]# helm repo add sonarqube https://SonarSource.github.io/helm-chart-sonarqube
"sonarqube" has been added to your repositories
[root@tiaoban ~]# helm repo update
[root@tiaoban ~]# kubectl create namespace cicd
namespace/sonarqube created
[root@tiaoban ~]# helm pull sonarqube/sonarqube --untar
[root@tiaoban ~]# cd sonarqube/
[root@tiaoban sonarqube]# ls
CHANGELOG.md  Chart.lock  charts  Chart.yaml  ci  README.md  templates  values.schema.json  values.yaml
```

修改配置

```bash
[root@tiaoban sonarqube]# vim values.yaml
prometheusExporter: # 按需求开启指标监控
  enabled: true
persistence:
  enabled: true
  storageClass: nfs-client # 指定storageClass
postgresql:
  persistence:
    storageClass: nfs-client # 指定storageClass
plugins: # 安装分支代码扫描插件
  install:
    - https://github.com/mc1arke/sonarqube-community-branch-plugin/releases/download/1.18.0/sonarqube-community-branch-plugin-1.18.0.jar
jvmOpts: "-javaagent:/opt/sonarqube/extensions/plugins/sonarqube-community-branch-plugin-1.18.0.jar=web"
jvmCeOpts: "-javaagent:/opt/sonarqube/extensions/plugins/sonarqube-community-branch-plugin-1.18.0.jar=ce"
```

安装SonarQube

```bash
[root@tiaoban sonarqube]# helm install sonarqube -n cicd . -f values.yaml
NAME: sonarqube
LAST DEPLOYED: Mon Apr 29 11:19:35 2024
NAMESPACE: cicd
STATUS: deployed
REVISION: 1
NOTES:
1. Get the application URL by running these commands:
  export POD_NAME=$(kubectl get pods --namespace cicd -l "app=sonarqube,release=sonarqube" -o jsonpath="{.items[0].metadata.name}")
  echo "Visit http://127.0.0.1:8080 to use your application"
  kubectl port-forward $POD_NAME 8080:9000 -n cicd
WARNING: 
         Please note that the SonarQube image runs with a non-root user (uid=1000) belonging to the root group (guid=0). In this way, the chart can support arbitrary user ids as recommended in OpenShift.
         Please visit https://docs.openshift.com/container-platform/4.14/openshift_images/create-images.html#use-uid_create-images for more information.

WARNING: The embedded PostgreSQL is intended for evaluation only, it is DEPRECATED, and it will be REMOVED in a future release.
         Please visit https://artifacthub.io/packages/helm/sonarqube/sonarqube#production-use-case for more information.
```

查看资源

```bash
[root@tiaoban sonarqube]# kubectl get all -n cicd 
NAME                         READY   STATUS    RESTARTS   AGE
pod/sonarqube-postgresql-0   1/1     Running   0          9m7s
pod/sonarqube-sonarqube-0    1/1     Running   0          4m47s

NAME                                    TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)    AGE
service/sonarqube-postgresql            ClusterIP   10.106.30.230   <none>        5432/TCP   15m
service/sonarqube-postgresql-headless   ClusterIP   None            <none>        5432/TCP   15m
service/sonarqube-sonarqube             ClusterIP   10.100.65.45    <none>        9000/TCP   15m

NAME                                    READY   AGE
statefulset.apps/sonarqube-postgresql   1/1     15m
statefulset.apps/sonarqube-sonarqube    1/1     15m
```

# 创建ingress
以traefik为例

```bash
[root@tiaoban sonarqube]# cat ingress.yaml 
apiVersion: traefik.io/v1alpha1
kind: IngressRoute
metadata:
  name: sonarqube
  namespace: cicd
spec:
  entryPoints:
    - web
  routes:
    - match: Host(`sonarqube.local.com`)
      kind: Rule
      services:
        - name: sonarqube-sonarqube
          port: 9000
[root@tiaoban sonarqube]# kubectl apply -f ingress.yaml 
ingressroute.traefik.containo.us/sonarqube created
```

# 访问验证
浏览器访问[http://sonarqube.local.com](http://sonarqube.local.com)，默认用户名密码为admin

![](assets/04-CI-CD/edb27719a3fb40e65be6.png)


