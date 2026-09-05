# 自定义Prometheus告警规则

> 分类：Prometheus / 第4章：prometheus告警处理
> 原文：https://www.cuiliangblog.cn/detail/section/23396661
> 来源：崔亮的博客

---

# 一、修改配置文件
1. 修改Prometheus配置文件prometheus.yml,指定告警规则文件路径：

![](assets/02-Prometheus/a933bad6dc7186d3f8b5.png)

1. 创建告警文件node-disk.rules

![](assets/02-Prometheus/243c75b5197a7d7bad5a.png)

+ 在告警规则文件的annotations中使用summary描述告警的概要信息，description用于描述告警的详细信息。同时Alertmanager的UI也会根据这两个标签值，显示告警信息。为了让告警信息具有更好的可读性，Prometheus支持模板化label和annotations的中标签的值。
+ 通过$labels.<labelname>变量可以访问当前告警实例中指定标签的值。$value则可以获取当前PromQL表达式计算的样本值。

# 二、查看验证告警规则
1. 通过Prometheus WEB界面中的Alerts菜单查看当前Prometheus下的所有告警规则，以及其当前所处的活动状态。

![](assets/02-Prometheus/0381d81feceb90033cfc.png)

1. 模拟磁盘写入大量数据，触发报警

# dd if=/dev/zero of=/test bs=1G count=8

1. 查看磁盘使用情况

100 - (node_filesystem_free_bytes{mountpoint="/",fstype=~"ext4|xfs"} / node_filesystem_size_bytes{fstype=~"ext4|xfs"} * 100)

![](assets/02-Prometheus/c2c1673ca2328989a9be.png)

1. Prometheus首次检测到满足触发条件后，hostCpuUsageAlert显示由一条告警处于活动状态。由于告警规则中设置了1m的等待时间，当前告警状态为PENDING，如下图所示：

![](assets/02-Prometheus/f34102216e69fc6b718d.png)

1. 如果1分钟后告警条件持续满足，则会实际触发告警并且告警状态为FIRING，如下图所示：

![](assets/02-Prometheus/abd0408e7efa9a434103.png)

 

 

 


