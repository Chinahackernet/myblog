# prometheus高可用

> 分类：Prometheus / 第7章：集群与高可用
> 原文：https://www.cuiliangblog.cn/detail/section/23468249
> 来源：崔亮的博客

---

# 一、基本HA：服务可用性
1. 由于Promthues的Pull机制的设计，为了确保Promthues服务的可用性，用户只需要部署多套Prometheus      Server实例，并且采集相同的Exporter目标即可。

![](assets/02-Prometheus/35c1596a88c4daa66b60.png)

1. 基本的HA模式只能确保Promthues服务的可用性问题，但是不解决Prometheus      Server之间的数据一致性问题以及持久化问题(数据丢失后无法恢复)，也无法进行动态的扩展。因此这种部署方式适合监控规模不大，Promthues      Server也不会频繁发生迁移的情况，并且只需要保存短周期监控数据的场景。

# 二、基本HA + 远程存储
1. 在基本HA模式的基础上通过添加Remote      Storage存储支持，将监控数据保存在第三方存储服务上。

![](assets/02-Prometheus/8326c32838c3f5c5b83d.png)

1. 在解决了Promthues服务可用性的基础上，同时确保了数据的持久化，当Promthues      Server发生宕机或者数据丢失的情况下，可以快速的恢复。 同时Promthues      Server可能很好的进行迁移。因此，该方案适用于用户监控规模不大，但是希望能够将监控数据持久化，同时能够确保Promthues      Server的可迁移性的场景。

# 三、基本HA + 远程存储 + 联邦集群
1. 当单台Promthues      Server无法处理大量的采集任务时，用户可以考虑基于Prometheus联邦集群的方式将监控采集任务划分到不同的Promthues实例当中即在任务级别功能分区。

![](assets/02-Prometheus/a0a0be72fefb3b1f525a.png)

1. 这种部署方式一般适用于两种场景：
+ 场景一：单数据中心 + 大量的采集任务

这种场景下Promthues的性能瓶颈主要在于大量的采集任务，因此用户需要利用Prometheus联邦集群的特性，将不同类型的采集任务划分到不同的Promthues子服务中，从而实现功能分区。例如一个Promthues Server负责采集基础设施相关的监控指标，另外一个Prometheus Server负责采集应用监控指标。再有上层Prometheus Server实现对数据的汇聚。

+ 场景二：多数据中心

这种模式也适合与多数据中心的情况，当Promthues Server无法直接与数据中心中的Exporter进行通讯时，在每一个数据中部署一个单独的Promthues Server负责当前数据中心的采集任务是一个不错的方式。这样可以避免用户进行大量的网络配置，只需要确保主Promthues Server实例能够与当前数据中心的Prometheus Server通讯即可。 中心Promthues Server负责实现对多数据中心数据的聚合。

# 四、按照实例进行功能分区
1. 当单个采集任务的Target数也变得非常巨大。这时简单通过联邦集群进行功能分区，Prometheus      Server也无法有效处理时。这种情况只能考虑继续在实例级别进行功能划分。

![](assets/02-Prometheus/589874181e17b4a5dfd8.png)

1. 如上图所示，将统一任务的不同实例的监控数据采集任务划分到不同的Prometheus实例。通过relabel设置，我们可以确保当前Prometheus      Server只收集当前采集任务的一部分实例的监控指标。

# 五、高可用方案选择
Promthues和高可用有关3个选项各自解决的问题，用户可以根据自己的需求灵活选择。

| 选项\需求 | 服务可用性 | 数据持久化 | 水平扩展 |
| --- | --- | --- | --- |
| 主备H | √ | × | × |
| 远程存储 | x | √ | × |
| 联邦集群 | x | x | √ |



