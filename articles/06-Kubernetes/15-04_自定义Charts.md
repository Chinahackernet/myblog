# 自定义Charts

> 分类：Kubernetes / 第15章：helm
> 原文：https://www.cuiliangblog.cn/detail/section/15287438
> 来源：崔亮的博客

---

# 创建Chart


1. 执行命令helm create myapp，会创建一个myapp目录

```bash
[root@k8s-master k8s-test]# helm create myapp
Creating myapp
```

2. 查看myapp目录结构

```bash
[root@k8s-master k8s-test]# tree myapp
myapp
├── charts
├── Chart.yaml
├── templates
│   ├── deployment.yaml
│   ├── _helpers.tpl
│   ├── hpa.yaml
│   ├── ingress.yaml
│   ├── NOTES.txt
│   ├── serviceaccount.yaml
│   ├── service.yaml
│   └── tests
│       └── test-connection.yaml
└── values.yaml
```

# 修改配置文件


1. 编辑自描述文件 Chart.yaml , 修改version和appVersion信息

```bash
apiVersion: v2
name: myapp
description: A Helm chart for Kubernetes

# A chart can be either an 'application' or a 'library' chart.
#
# Application charts are a collection of templates that can be packaged into versioned archives
# to be deployed.
#
# Library charts provide useful utilities or functions for the chart developer. They're included as
# a dependency of application charts to inject those utilities and functions into the rendering
# pipeline. Library charts do not define any templates and therefore cannot be deployed.
type: application

# This is the chart version. This version number should be incremented each time you make changes
# to the chart and its templates, including the app version.
# Versions are expected to follow Semantic Versioning (https://semver.org/)
version: 1.0.0 # 项目版本号

# This is the version number of the application being deployed. This version number should be
# incremented each time you make changes to the application. Versions are not expected to
# follow Semantic Versioning. They should reflect the version the application is using.
# It is recommended to use it with quotes.
appVersion: "v1" # 镜像版本
```

2. 编辑values.yaml配置文件

```javascript
# vim values.yaml 

replicaCount: 1
image:
  repository: ikubernetes/myapp
  pullPolicy: IfNotPresent
  tag: "v1"
```

# 打包安装chart


1. 检查chart语法正确性

```bash
# helm lint myapp -f values.yaml                                                                                   
==> Linting myapp
[INFO] Chart.yaml: icon is recommended

1 chart(s) linted, 0 chart(s) failed
# 查看生成的yaml文件
# helm template myapp > myapp.yaml
```

2. 打包自定义的chart

```bash
# helm package myapp
Successfully packaged chart and saved it to: /opt/myapp-0.1.0.tgz
```

3. 安装chart

```bash
# helm install myapp myapp-0.1.0.tgz                                     
NAME: myapp
LAST DEPLOYED: Wed Oct 22 23:09:07 2025
NAMESPACE: default
STATUS: deployed
REVISION: 1
NOTES:
1. Get the application URL by running these commands:
  export POD_NAME=$(kubectl get pods --namespace default -l "app.kubernetes.io/name=myapp,app.kubernetes.io/instance=myapp" -o jsonpath="{.items[0].metadata.name}")
  export CONTAINER_PORT=$(kubectl get pod --namespace default $POD_NAME -o jsonpath="{.spec.containers[0].ports[0].containerPort}")
  echo "Visit http://127.0.0.1:8080 to use your application"
  kubectl --namespace default port-forward $POD_NAME 8080:$CONTAINER_PORT
```

4. 验证

```bash
# helm list                         
NAME    NAMESPACE       REVISION        UPDATED                                 STATUS          CHART           APP VERSION
myapp   default         1               2025-10-22 23:09:07.582992833 +0800 CST deployed        myapp-0.1.0     1.16.0     
# kubectl get pod 
NAME                     READY   STATUS    RESTARTS         AGE
myapp-758f78bb66-tpln6   1/1     Running   0                22s
```

# 更新


1. 编辑自描述文件 Chart.yaml , 修改version和appVersion信息

```bash
# cd myapp 
# ls
charts  Chart.yaml  templates  values.yaml
# vim Chart.yaml

version: 0.2.0
appVersion: "1.16.1"

# vim values.yaml

image:
  tag: "v2"
```

2. 重新打包charts

```bash
# helm lint myapp
==> Linting myapp
[INFO] Chart.yaml: icon is recommended

1 chart(s) linted, 0 chart(s) failed
# helm template myapp . -f values.yaml

# helm package myapp 
Successfully packaged chart and saved it to: /opt/myapp-0.2.0.tgz
```

3. 更新chart

```bash
# helm upgrade myapp myapp-0.2.0.tgz 
Release "myapp" has been upgraded. Happy Helming!
NAME: myapp
LAST DEPLOYED: Wed Oct 22 23:12:59 2025
NAMESPACE: default
STATUS: deployed
REVISION: 2
NOTES:
1. Get the application URL by running these commands:
  export POD_NAME=$(kubectl get pods --namespace default -l "app.kubernetes.io/name=myapp,app.kubernetes.io/instance=myapp" -o jsonpath="{.items[0].metadata.name}")
  export CONTAINER_PORT=$(kubectl get pod --namespace default $POD_NAME -o jsonpath="{.spec.containers[0].ports[0].containerPort}")
  echo "Visit http://127.0.0.1:8080 to use your application"
  kubectl --namespace default port-forward $POD_NAME 8080:$CONTAINER_PORT
```

4. 验证

```bash
# helm list                         
NAME    NAMESPACE       REVISION        UPDATED                                 STATUS          CHART           APP VERSION
myapp   default         2               2025-10-22 23:12:59.978668019 +0800 CST deployed        myapp-0.2.0     1.16.1     
# kubectl get pod 
NAME                     READY   STATUS    RESTARTS        AGE
myapp-7679455957-jpkvp   1/1     Running   0               11s
```

# 回滚
1. 查看当前版本信息

```bash
# helm list
NAME    NAMESPACE       REVISION        UPDATED                                 STATUS          CHART           APP VERSION
myapp   default         2               2025-10-22 23:12:59.978668019 +0800 CST deployed        myapp-0.2.0     1.16.1
```

2. 查看历史版本信息

```bash
# helm history myapp
REVISION        UPDATED                         STATUS          CHART           APP VERSION     DESCRIPTION     
1               Wed Oct 22 23:09:07 2025        superseded      myapp-0.1.0     1.16.0          Install complete
2               Wed Oct 22 23:12:59 2025        deployed        myapp-0.2.0     1.16.1          Upgrade complete
```

3. 回滚到指定版本

```bash
# helm rollback myapp 1                                                                                
Rollback was a success! Happy Helming!
```

4. 验证

```bash
# helm list
NAME    NAMESPACE       REVISION        UPDATED                                 STATUS          CHART           APP VERSION
myapp   default         3               2025-10-22 23:14:48.439139622 +0800 CST deployed        myapp-0.1.0     1.16.0     
# kubectl get pod 
NAME                     READY   STATUS    RESTARTS        AGE
myapp-758f78bb66-n9pfp   1/1     Running   0               27s
```


