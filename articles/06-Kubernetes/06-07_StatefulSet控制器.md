# StatefulSet控制器

> 分类：Kubernetes / 第6章：资源控制器
> 原文：https://www.cuiliangblog.cn/detail/section/15274292
> 来源：崔亮的博客

---

# 一、介绍


1. StatefulSet是Kubernetes提供的管理有状态应用的负载管理控制器API。用于部署和扩展有状态应用的Pod资源，确保它们的运行顺序及每个Pod资源的唯一性。其与ReplicaSet控制器不同的是，虽然所有的Pod对象都基于同一个spec配置所创建，但StatefulSet需要为每个Pod维持一个唯一且固定的标识符，必要时还要为其创建专有的存储卷
2. StatefulSet适用于具有以下特点的应用：
+ 稳定的持久化存储，即Pod重新调度后还是能访问到相同的持久化数据，基于 PVC来实现。
+ 稳定的网络标识符，即 Pod 重新调度后其 PodName 和 HostName 不变。
+ 有序部署，有序扩展，基于 init containers 来实现。
+ 有序收缩。
3. Statefulset的启停顺序：
+ 有序部署：部署StatefulSet时，如果有多个Pod副本，它们会被顺序地创建（从0到N-1）并且，在下一个Pod运行之前所有之前的Pod必须都是Running和Ready状态。
+ 有序删除：当Pod被删除时，它们被终止的顺序是从N-1到0。
+ 有序扩展：当对Pod执行扩展操作时，与部署一样，它前面的Pod必须都处于Running和Ready状态。
4. 一个完整的StatefulSet控制器需要由一个Headless Service、一个StatefulSet和一个volumeClaimTemplate组成。
+ HeadlessService用于为Pod资源标识符生成可解析的DNS资源记录，
+ StatefulSet用于管控Pod资源
+ volumeClaimTemplate则基于静态或动态的PV供给方式为Pod资源提供专有且固定的存储
5. 为什么要有headless？？  
在deployment中，每一个pod是没有名称，是随机字符串，是无序的。而statefulset中是要求有序的，每一个pod的名称必须是固定的。当节点挂了，重建之后的标识符是不变的，每一个节点的节点名称是不能改变的。pod名称是作为pod识别的唯一标识符，必须保证其标识符的稳定并且唯一。为了实现标识符的稳定，这时候就需要一个headless service 解析直达到pod，还需要给pod配置一个唯一的名称。
6. 为什么要有volumeClainTemplate？？  
大部分有状态副本集都会用到持久存储，比如分布式系统来说，由于数据是不一样的，每个节点都需要自己专用的存储节点。而在deployment中pod模板中创建的存储卷是一个共享的存储卷，多个pod使用同一个存储卷，而statefulset定义中的每一个pod都不能使用同一个存储卷，由此基于pod模板创建pod是不适应的，这就需要引入volumeClainTemplate，当在使用statefulset创建pod时，会自动生成一个PVC，从而请求绑定一个PV，从而有自己专用的存储卷。

# 二、创建StatefulSet对象


1. 先定义了一个名为myapp-svc的Headless Service资源，用于为关联到的每个Pod资源创建DNS资源记录。

![](assets/06-Kubernetes/cfc60c8aac9dceae24f5.png)

2. 定义多个使用NFS存储后端的PV，空间大小为2GB，仅支持单路的读写操作。

![](assets/06-Kubernetes/32f13f305dd732223043.png)

3. 定义了一个名为myapp的StatefulSet资源，它通过Pod模板创建了两个Pod资源副本，并基于volumeClaimTemplates（存储卷申请模板）向nfs存储类请求动态供给PV，从而为每个Pod资源提供大小为1GB的专用存储卷。

![](assets/06-Kubernetes/cee8f034a47e4ea02eb7.png)



+ headless保证它的网络，statefulset存储模版来保证每个pod存储的唯一性，这样才解决了有状态应用的两大痛点



4. 查看资源信息

![](assets/06-Kubernetes/7d2ee4ff95e135e37fe7.png)



# 三、Pod资源标识符及存储卷


> 由StatefulSet控制器创建的Pod资源拥有固定、唯一的标识和专用存储卷，即便重新调度或终止后重建，其名称也依然保持不变，且此前的存储卷及其数据不会丢失。
>



1. Pod资源的固定标识符

![](assets/06-Kubernetes/4aea280c6e019276719a.png)



+ 这些名称标识会由StatefulSet资源相关的Headless  
Service资源创建为DNS资源记录。在Pod资源创建后，与其相关的DNS资源记录格式为“$(pod_name).$(service_name).$(namespace).svc.cluster.local”
+ 使用coredns解析测试  
# dig -t A myapp-0.myapp-svc.default.svc.cluster.local@10.244.2.7

![](assets/06-Kubernetes/7c6630c887f4f7c43c0c.png)

+ 终端中删除Pod资源myapp-1，删除完成后控制器将随之开始重建Pod资源，其名称标识符的确未发生改变：

![](assets/06-Kubernetes/1d97075975fdee555a86.png)



2. Pod资源的专有存储卷  
控制器通过volumeClaimTemplates为每个Pod副本自动创建并关联一个PVC对象，它们分别绑定了一个动态供给的PV对象：

![](assets/06-Kubernetes/86c413851f41ac3f5e56.png)

+ 重新调度或终止后重建，此前的存储卷及其数据不会丢失。

![](assets/06-Kubernetes/2d18d46bd24492d38d2f.png)



# 四、StatefulSet资源扩缩容


> 通过修改资源的副本数来改动其目标Pod资源数量。对StatefulSet资源来说，kubectl scale和kubectl patch命令均可实现此功能，也可以使用kubectl edit命令直接修改其副本数，或者在修改配置文件之后，由kubectl apply命令重新声明。
>



1. 将myapp中的Pod副本数量扩展至5个：

![](assets/06-Kubernetes/1ff5053deb4d89dfac50.png)

+ StatefulSet资源的扩展过程与创建过程的Pod资源生成策略相同，默认为顺次进行，而且其名称中的序号也将以现有Pod资源的最后一个序号向后进行
2. 执行缩容操作只需要将其副本数量调低即可，例如，这里可使用kubectl patch命令将StatefulSet资源myapp的副本数量修补为3个：

![](assets/06-Kubernetes/acdfea8b3a3af7c01259.png)



+ 终止Pod资源后，其存储卷并不会被删除，因此缩减规模后若再将其扩展回来，那么此前的数据依然可用，且Pod资源名称保持不变

![](assets/06-Kubernetes/617ec8c365a7fcf6d949.png)



# 五、StatefulSet资源升级


1. 滚动更新  
滚动更新StatefulSet控制器的Pod资源以逆序的形式从其最大索引编号的Pod资源逐一进行。对于主从复制类的集群应用来说，这样也能保证起主节点作用的Pod资源最后进行更新，确保兼容性。
+ 更新Pod中的容器镜像可以使用“kubectl set image”命令进行，例如下面的命令可将myapp控制器下的Pod资源镜像版本升级为“myapp:v2”：  
`# kubectl set image statefulset myapp nginx=192.168.10.110/k8s/myapp:v2` 

![](assets/06-Kubernetes/a99fc453bfe682f5d0dd.png)

2. 暂存更新  
当用户需要设定一个更新操作，但又不希望它立即执行时，可将更新操作予以“暂存”，待条件满足后再手动触发其执行更新。将．spec.update-Strategy.rollingUpdate.partition字段的值设置为Pod资源的副本数量，即比Pod资源的最大索引号大1，这就意味着，所有的Pod资源都不会处于可直接更新的分区之内，那么于其后设定的更新操作也就不会真正执行，直到用户降低分区编号至现有Pod资源索引号范围之内
+ 首先将StatefulSet资源myapp的滚动更新分区值设定为3：  
`# kubectl patch statefulset myapp -p '{"spec":{"updateStrategy":{"rollingUpdate":{"partition":3}}}}'` 
+ 而后，将myapp控制器的Pod资源镜像版本更新为“myapp:v3”  
`# kubectl set image statefulset myapp nginx=192.168.10.110/k8s/myapp:v3` 
+ 接着检测各Pod资源的镜像文件版本信息，可以发现其版本并未发生改变：

![](assets/06-Kubernetes/7378c81de10a47b62f0f.png)

+ 即便删除某Pod资源，它依然会基于旧的版本镜像进行重建。

![](assets/06-Kubernetes/f691714e7bebf3099ab0.png)



3. 灰度部署  
将处于暂存状态的更新操作的partition定位于Pod资源的最大索引号，即可放出一只金丝雀，由其测试第一轮的更新操作，在确认无误后通过修改partition属性的值更新其他的Pod对象是一种更为稳妥的更新操作。
+ 将暂停的更新StatefulSet控制器myapp资源的分区号设置为Pod资源的最大索引号2，将会触发myapp-2的更新操作：  
`# kubectl patch statefulset myapp -p '{"spec":{"updateStrategy":{"rollingUpdate":{"partition":2}}}}'` 

![](assets/06-Kubernetes/a35f2d61c0d3a7fcb8b0.png)

+ 将副本数目修改大于3后，也会触发更新操作

![](assets/06-Kubernetes/af60db8a3932b9eb5173.png)


