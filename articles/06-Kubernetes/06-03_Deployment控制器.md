# Deployment控制器

> 分类：Kubernetes / 第6章：资源控制器
> 原文：https://www.cuiliangblog.cn/detail/section/15273660
> 来源：崔亮的博客

---

# 一、Deployment


1. Deployment 的控制器，实际上控制的是 ReplicaSet 的数目，以及每个 ReplicaSet的属性。而一个应用的版本，对应的正是一个 ReplicaSet；这个版本应用的 Pod数量，则由 ReplicaSet 通过它自己的控制器（ReplicaSet Controller）来保证。

![](assets/06-Kubernetes/bf50637e5c7dab9fc042.png)

2. Deployment具备ReplicaSet的全部功能，同时还增添了部分特性。
+ 事件和状态查看：必要时可以查看Deployment对象升级的详细进度和状态。
+ 回滚：升级操作完成后发现问题时，支持使用回滚机制将应用返回到前一个或由用户指定的历史记录中的版本上。
+ 版本记录：对Deployment对象的每一次操作都予以保存，以供后续可能执行的回滚操作使用。
+ 暂停和启动：对于每一次升级，都能够随时暂停和启动。
+ 多种自动更新方案：一是Recreate，即重建更新机制，全面停止、删除旧有的Pod后用新版本替代；另一个是RollingUpdate，即滚动升级机制，逐步替换旧有的Pod至新的版本。



# 二、创建Deployment


1. 除了控制器类型和名称之外，它与前面ReplicaSet控制器示例中的内容几乎没有什么不同。

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp-deploy
  namespace: default
spec:
  replicas: 6
  selector:
    matchLabels:
      app: myapp
  template:
    metadata:
      labels:
        app: myapp
    spec:
      containers:
      - name: myapp
        image: 192.168.10.14/k8s/nginx:v1
        ports:
        - containerPort: 80
          name: http
```

2. 创建资源对象  
`kubectl apply -f Deployment.yaml` 
3. 查看Deployment资源

![](assets/06-Kubernetes/d707af2ed73a72d7aedb.png)

4. 查看ReplicaSets资源

![](assets/06-Kubernetes/2c30808f086c6234d19f.png)

5. 查看Pod资源

![](assets/06-Kubernetes/72cd25a99e9d2d607fb8.png)

6. 由此印证了Deployment借助于ReplicaSet管理Pod资源的机制，于是可以得知，其大部分管理操作与ReplicaSet相同

# 三、更新


1. 更新策略

> Deployment控制器支持两种更新策略：滚动更新和重新创建。
>

+ 滚动更新是默认的更新策略，它在删除一部分旧版本Pod资源的同时，补充创建一部分新版本的Pod对象进行应用升级。
+ 重新创建首先删除现有的Pod对象，而后由控制器基于新模板重新创建出新版本资源对象。
2. 滚动更新时，应用升级期间还要确保可用的Pod对象数量不低于某阈值以确保可以持续处理客户端的服务请求，变动的方式和Pod对象的数量范围将通过spec.strategy.rollingUpdate.maxSurge和spec.strategy.rollingUpdate.maxUnavailable两个属性协同进行定义，
+ maxSurge：指定升级期间存在的总Pod对象数量最多可超出期望值的个数，其值可以是0或正整数，也可以是一个期望值的百分比；例如，如果期望值为3，当前的属性值为1，则表示Pod对象的总数不能超过4个。
+ maxUnavailable：升级期间正常可用的Pod副本数（包括新旧版本）最多不能低于期望数值的个数，其值可以是0或正整数，也可以是一个期望值的百分比；默认值为1，该值意味着如果期望值是3，则升级期间至少要有两个Pod对象处于正常提供服务的状态
3. 为了保存版本升级的历史，需要在创建Deployment对象时于命令中使用“--record”选项。

![](assets/06-Kubernetes/17890677992491735d12.png)

4. 使用命令临时更新镜像
+ 使用192.168.10.110/k8s/myapp:v2镜像文件修改Pod模板中的myapp容器，启动Deployment控制器的滚动更新  
`$ kubectl set image deployments myapp-deploy myapp=192.168.10.110/k8s/myapp:v2` 
+ 访问验证

![](assets/06-Kubernetes/29227de58684f2ff5ddc.png)

5. 灰度发布（金色雀发布）
+ 待第一批新的Pod资源创建完成后立即暂停更新过程，此时，仅存在一小部分新版本的应用，主体部分还是旧的版本。然后，再根据用户特征精心筛选出小部分用户的请求路由至新版本的Pod应用，并持续观察其是否能稳定地按期望的方式运行。
+ 采用首批添加1个Pod资源的方式。将Deployment控制器的maxSurge属性的值设置为1，并将maxUnavailable属性的值设置为0：  
`$ kubectl patch deployments myapp-deploy -p '{"spec":{"strategy":{"rollingUpdate": {"maxSurge": 1, "maxUnavailable":0}}}}'` 
6. rollout pause和resume  
kubectl rollout pause会用来停止触发下一次rollout，正在执行的滚动历程是不会停下来的，而是会继续正常的进行滚动，直到完成。等下一次，用户再次触发rollout时，Deployment就不会真的去启动执行滚动更新了，而是等待用户执行了kubectl rollout resume，流程才会真正启动执行。
7. 灰度发布、滚动发布和蓝绿发布

**假设replicaSet=10 maxSurge &maxUnavailable不能同时为0 **

| 类型 | 描述 | maxSurge | maxUnavailable |
| :---: | :---: | :---: | :---: |
| 灰度发布 | 又名金丝雀发布。先极个别更新，通过后再一次全部更新 | 1或10% | 视对服务可用度的需求 |
| 滚动发布 | （部分更新，投入使用）* 直到全部更新完成 | 1<x<（具体看更新的粒度） | 视对服务可用度的需求 |
| 蓝绿发布 | 新旧版共存，靠切换流量完成更新 | 10 | 0 |


# 四、回滚


1. 将myapp-deploy回滚至此前的版本：  
`$ kubectl rollout undo deployments myapp-deploy` 

![](assets/06-Kubernetes/afe849ab0cc1e00fd68b.png)

2. 若要回滚到号码为1的revision记录，则使用如下命令即可完成：  
`$ kubectl rollout undo deployments myapp-deploy --to-revision=1` 

![](assets/06-Kubernetes/4669d7305b06582a2718.png)

+ 回滚操作中，其revision记录中的信息会发生变动，回滚操作会被当作一次滚动更新追加进历史记录中，而被回滚的条目则会被删除。
+ 如果此前的滚动更新过程处于“暂停”状态，那么回滚操作就需要先将Pod模板的版本改回到之前的版本，然后“继续”更新，否则，其将一直处于暂停状态而无法回滚。


