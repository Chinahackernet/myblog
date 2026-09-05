# CronJob控制器

> 分类：Kubernetes / 第6章：资源控制器
> 原文：https://www.cuiliangblog.cn/detail/section/15274241
> 来源：崔亮的博客

---

# 一、简介


1. CronJob控制器用于管理Job控制器资源的运行时间。Job控制器定义的作业任务在其控制器资源创建之后便会立即执行，但CronJob可以以类似于Linux操作系统的周期性任务作业计划（crontab）的方式控制其运行的时间点及重复运行的方式
2. 具体如下。
+ 在未来某时间点运行作业一次。
+ 在指定的时间点重复运行作业。
3. CronJob对象支持使用的时间格式类似于Crontab，略有不同的是，CronJob控制器在指定的时间点时，“?”和“*”的意义相同，都表示任何可用的有效值。

# 二、创建CronJob对象


1. CronJob控制器的spec字段可嵌套使用以下字段。

| jobTemplate | Object | Job控制器模板，用于为CronJob控制器生成Job对象；必选字段 |
| --- | --- | --- |
| schedule | string | Cron格式的作业调度运行时间点；必选字段。 |
| concurrencyPolicy | string | 并发执行策略，可用值有“Allow”（允许）、“Forbid”（禁止）和“Replace”（替换），用于定义前一次作业运行尚未完成时是否以及如何运行后一次的作业 |
| failedJobHistoryLimit | integer | 为失败的任务执行保留的历史记录数，默认为1。 |
| successfulJobsHistoryLimit | integer | 为成功的任务执行保留的历史记录数，默认为3 |
| startingDeadlineSeconds | integer | 因各种原因缺乏执行作业的时间点所导致的启动作业错误的超时时长，会被记入错误历史记录 |
| suspend | boolean | 是否挂起后续的任务执行，默认为false，对运行中的作业不会产生影响。 |




2. 下面是一个定义在资源清单文件中的CronJob资源对象示例，它每隔2分钟运行一次由jobTemplate定义的简单任务：

![](assets/06-Kubernetes/372f17b0c8cdbe1edfe6.png)

3. 查看资源信息，命令结果中的SCHEDULE是指其调度时间点，SUSPEND表示后续任务是否处于挂起状态，即暂停任务的调度和运行，ACTIVE表示活动状态的Job对象的数量，而LAST SCHEDULE则表示上次调度运行至此刻的时长：

![](assets/06-Kubernetes/4878866e5a8b4972f662.png)



# 三、CronJob的控制机制


1. CronJob控制器是一个更高级别的资源，它以Job控制器资源为其管控对象，并借助它管理Pod资源对象。
2. 使用类似如下命令来查看某CronJob控制器创建的Job资源对象，其中的标签“mycronjob-jobs”是在创建cronjob-example时为其指定。不过，只有相关的Job对象被调度执行时，此命令才能将其正常列出。可列出的Job对象的数量取决于CronJob资源的．spec.successfulJobsHistoryLimit的属性值，默认为3。

![](assets/06-Kubernetes/e7b017b77abcaf1dda86.png)

3. 如果作业重复执行时指定的时间点较近，而作业执行时长（普遍或偶尔）跨过了其两次执行的时间长度，则会出现两个Job对象同时存在的情形。有些Job对象可能会存在无法或不能同时运行的情况，这个时候就要通过．spec.concurrencyPolicy属性控制作业并存的机制，其默认值为“Allow”，即允许前后Job，甚至属于同一个CronJob的更多Job同时运行。
4. 其他两个可用值中，“Forbid”用于禁止前后两个Job同时运行，如果前一个尚未结束，后一个则不予启动（跳过），“Replace”用于让后一个Job取代前一个，即终止前一个并启动后一个。


