# 临时存储emptyDir

> 分类：Kubernetes / 第9章：存储
> 原文：https://www.cuiliangblog.cn/detail/section/15280434
> 来源：崔亮的博客

---

# 一、概述


1. emptyDir存储卷是Pod对象生命周期中的一个临时目录，当 Pod被分配给节点时，首先创建emptyDir卷，并且只要该 Pod在该节点上运行，该卷就会存在。正如卷的名字所述，它最初是空的。Pod中的容器可以读取和写入emptyDir卷中的相同文件，尽管该卷可以挂载到每个容器中的相同或不同路径上。当出于任何原因从节点中删除Pod 时，emptyDir中的数据将被永久删除
2. emptyDir的用法有：
+ 同一Pod内的多个容器间文件的共享
+ 作为容器数据的临时存储目录用于数据缓存系统等
3. emptyDir存储卷则定义于．spec.volumes.emptyDir嵌套字段中，可用字段主要包含两个。
+ medium：此目录所在的存储介质的类型，可取值为“default”或“Memory”，默认为default，表示使用节点的默认存储介质；“Memory”表示使用基于RAM的临时文件系统tmpfs，空间受限于内存，但性能非常好，通常用于为容器中的应用提供缓存空间。
+ sizeLimit：当前存储卷的空间限额，默认值为null，表示不限制；不过，在medium字段值为“Memory”时建议务必定义此限额。

# 二、实例


> 存储卷名称为html，挂载于容器nginx的/usr/share/nginx/html目录，以及容器page的/html目录。容器page每隔10秒向存储卷上的index.html文件中追加一行信息，而容器nginx中的nginx进程则以其为站点主页。
>



1. 创建pod资源清单

![](assets/06-Kubernetes/217b7561bfdaf9549d0f.png)

2. 访问测试

![](assets/06-Kubernetes/7b720b63a2cb53b9c568.png)


