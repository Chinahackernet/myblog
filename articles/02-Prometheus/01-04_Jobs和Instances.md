# Jobs和Instances

> 分类：Prometheus / 第1章：prometheus基础
> 原文：https://www.cuiliangblog.cn/detail/section/23385507
> 来源：崔亮的博客

---

1. 当我们需要采集不同的监控指标(例如：主机、MySQL、Nginx)时，我们只需要运行相应的监控采集程序，并且让Prometheus       Server知道这些Exporter实例的访问地址。在Prometheus中，每一个暴露监控样本数据的HTTP服务称为一个实例。例如在当前主机上运行的node       exporter可以被称为一个实例(Instance)。
2. 而一组用于相同采集目的的实例，或者同一个采集进程的多个副本则通过一个一个任务(Job)进行管理。

job: node

instance 2: 1.2.3.4:9100

instance 4: 5.6.7.8:9100

3. 当前在每一个Job中主要使用了静态配置(static_configs)的方式定义监控目标。除了静态配置每一个Job的采集Instance地址以外，Prometheus还支持与DNS、Consul、E2C、Kubernetes等进行集成实现自动发现Instance实例，并从这些Instance上获取监控数据。


