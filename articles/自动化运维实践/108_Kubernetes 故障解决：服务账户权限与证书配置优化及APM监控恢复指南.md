---
title: Kubernetes 故障解决：服务账户权限与证书配置优化及APM监控恢复指南
---

**前言：鉴于隐私性，这里二次开发版的 k8s 容器平台的命名空间统一以 “lkk” 代称；二开云监控平台的命名空间用yjk来代称。下面分享k8s运维中关于服务账号权限及证书配置以及APM监控恢复的问题解决方法。**

### 一、k8s服务账号权限问题

### 1、部署 LKK 平台的 host 集群时发现lkk命令空间的lkk-installer-566877b4cd-wgljx（pod）启动不起来，使用以下命令查看日志进行排查

`kubectl logs -n lkk-system $(kubectl get pod -n lkk-system -l app=lkk-install -o jsonpath='{.items[0].metadata.name}') -f`  

**报错分析：**服务账户 lkk-installer （ServiceAccount），试图操作 alerting.lkk.io API 组下的 globalrulegroups 资源，但是没有足够的权限，因此遇到了 Forbidden 错误。需要授予相应的访问权限

### 2、编译yaml文件

命令：`vim lkk-installer.yaml`

```
:set number在248行下添加:
- alerting.lkk.io
```

**解析：**  
在Kubernetes中，`lkk-installer.yaml` 文件通常是一个用于安装或配置Kubernetes平台的YAML文件。在这个文件中，`apiGroups` 是一个关键的部分，它定义了Kubernetes API的访问权限。每个`apiGroup`代表一组相关的API资源，这些资源可以是核心API，也可以是扩展API。  
① **`application.lkk.io`**：这个API组可能代表了与应用管理相关的一组API资源。在Kubernetes生态中，这通常涉及到部署应用程序、管理应用配置和服务等。例如，它可能包括了部署（Deployments）、服务（Services）、 ingress资源等，这些都是用来定义、扩展和管理应用程序的API资源。

② **`alerting.lkk.io`**：这个API组可能代表了与告警系统相关的一组API资源。在Kubernetes中，告警系统用于监控集群资源和应用的状态，当某些指标超出预设阈值时触发告警。这可能包括了告警规则（Alerting Rules）、告警实例（Alert Instances）等资源，用于配置告警策略和管理告警事件。

**3、执行以下命令更新**  
`kubectl apply -f lkk-installer.yaml`

**4、删除对应的pod，重启**  
`kubectl delete pod lkk-installer-566877b4cd-wgljx -n lkk-system`

**5、再次查看日志,没有出现json就没有问题**  
`kubectl logs -n lkk-system $(kubectl get pod -n lkk-system -l app=lkk-install -o jsonpath='{.items[0].metadata.name}') -f`

### 二、证书配置问题

### 1、查看到promethues未运行起来，命令

`kubectl get -n lkk-monitoring-system pod`  

### 2、配置证书

**报错分析：**需要配置下etcd 的证书 secret  
**解决方法：**  
在 kubernetes 的 master 节点的 /etc/ssl/etcd/ssl/ 目录下的 etcd 证书文件创建成 secret 认证证书（该操作仅当 etcd 安装在 master 节点时执行）

**①错误示范**  
**命令(此条命令是我失误的步骤，这个步骤不需要执行，直接执行下一条）：**

```
kubectl -n lkk-monitoring-system create secret generic kube-etcd-client-certs --from-file=etcd-client-ca.crt=/etc/ssl/etcd/ssl/ca.pem --from-file=etcd-client.crt=/etc/ssl/etcd/ssl/admin-ms-yjk-1.pem
--from-file=etcd-client.key=/etc/ssl/etcd/ssl/admin-ms-yjk-1-key.pem
```

执行以上命令没有注意加`\`符号，导致只执行成功了第一条。  
**处理方法：**  
查看secret是不是创建成功：  
`kubectl -n lkk-monitoring-system get secrets kube-etcd-client-certs`  
删除secret的命令：  
`kubectl -n lkk-monitoring-system delete secret kube-etcd-client-certs`

**②正确示范**  
执行命令：

```
kubectl -n lkk-monitoring-system create secret generic kube-etcd-client-certs \
  --from-file=etcd-client-ca.crt=/etc/ssl/etcd/ssl/ca.pem \
  --from-file=etcd-client.crt=/etc/ssl/etcd/ssl/admin-ms-yjk-1.pem \
  --from-file=etcd-client.key=/etc/ssl/etcd/ssl/admin-ms-yjk-1-key.pem
```

### 3、验证

查看到promethues启动成功，命令  
`kubectl get -n lkk-monitoring-system pod`  

### 三、APM监控恢复

APM微服务云监控：apache.skywalking-agent采集服务链路信息上传到oap数据源服务，oap数据源服务存储elasticsearc的pod里。

### 1、某项目组反应APM应用性能失效

### 2、排查思路

搜集对应的日志  
命令：`kubectl logs -n <命令空间> <pod-name> >oap.txt`  
命令：`kubectl logs -n <命令空间> <pod-name> >elasticsearch.txt`  
根据`WARN`信息判断是索引断了，排查到是服务器资源不够，有告警，但是监控信息由项目组那边的运维接受，他们没有重视。

### 3、故障恢复

### 第一步：查看es的服务ip和端口

命令：`kubectl -n <elasticsearch所在的命令空间> get svc`  

### 第二步：根据es的服务ip和端口重新建议索引

命令：`curl -XPUT -H "Content-Type: application/json" http://<es-ip> :<es-端口>/_all/_settings -d '{"index.blocks.read_only_allow_delete": null}'`  
查看oap和es的pod日志有无报错，最后APM应用性能有数据，恢复了。然后建议某项目组运维一定重视监控告警
