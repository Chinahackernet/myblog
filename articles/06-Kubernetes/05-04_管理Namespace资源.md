# 管理Namespace资源

> 分类：Kubernetes / 第5章：资源对象
> 原文：https://www.cuiliangblog.cn/detail/section/15261076
> 来源：崔亮的博客

---

# 一、简介


1. 名称空间（Namespace）是Kubernetes集群级别的资源，用于将集群分隔为多个隔离的逻辑分区以配置给不同的用户、租户、环境或项目使用，例如，可以为development、qa和production应用环境分别创建各自的名称空间。
2. Kubernetes的绝大多数资源都隶属于名称空间级别（另一个是全局级别或集群级别），名称空间资源为这类的资源名称提供了隔离的作用域，同一名称空间内的同一类型资源名必须是唯一的，但跨名称空间时并无此限制。不过，Kubernetes还是有一些资源隶属于集群级别的，如Node、Namespace和PersistentVolume等资源，它们不属于任何名称空间，因此资源对象的名称必须全局唯一



# 二、Namespaces 的常用操作


1. 查看命名空间  
`# kubectl get namespaces ` 



2. Kubernetes默认有三个命名空间
+ default:默认的命名空间
+ kube-system:由Kubernetes系统对象组成的命名空间
+ kube-public:该空间由系统自动创建并且对所有用户可读性，做为集群公用资源的保留命名空间
3. 查看特定名称空间的详细信息  
`# kubectl describe namespaces default ` 
4. 创建命名空间  
`# kubectl create namespace test-cluster ` 
5. 查询命名空间中的资源  
`# kubectl get all --namespace=test-cluster `   
`# kubectl get all -n test-clutser `   
`# kubectl get nodes `   
`# kubectl get pods -n kube-system ` 
6. 修改默认的namespace配置  
`# kubectl config view` 
+ 先查看是否设置了current-context  
`# kubectl config set-context default --namespace=bs-test` 
+ 设置default配置的namespace参数  
`# kubectl config set current-context default`  //设置当前环境变量为 default
+ 通过这段代码设置默认的命名空间后，就不用每次在输入命令的时候带上--namespace参数了。



# 三、其他操作


1. 查看命名空间中的资源。  
`# kubectl api-resources --namespaced=true ` 
2. 查看不在命名空间中的资源  
`# kubectl api-resources --namespaced=false ` 


