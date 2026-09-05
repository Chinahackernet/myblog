# runner介绍

> 分类：CI/CD / 第13章：Gitlab Runner
> 原文：https://www.cuiliangblog.cn/detail/section/123124571
> 来源：崔亮的博客

---

# runner简介
+ gitlab runner是一个开源项目，用于运行作业并将结果发送回gitlab，类似与Jenkins的agent，执行CI持续集成、构建的脚本任务。
+ 与gitlab ci结合使用，gitlab ci是gitlab随附的用于协调作业的开源持续集成服务
+ gitlab runner是用go编写的，可以在Linux Windows和MacOS系统上运行
+ gitlab runner版本应与gitlab版本同步
+ 可以根据需要配置任意数量的runner

# runner特点
运行作业控制：同时执行多个作业。

作业运行环境：

+ 本地、docker容器、使用docker容器通过SSH执行作业。
+ 使用docker容器在不同的云和虚拟化管理程序上自动缩放。
+ 连接到远程SSH服务器

支持bash、Windows batsh和powershell

允许自定义作业运行环境

自动更新加载配置，无需重启

# runner类型
shared：共享类型，运行整个平台项目的作业(gitlab)

group：项目组类型，运行特定group下的所有项目的作业(group)

specific：项目类型，运行指定的项目作业(project)

# runner状态
locked：锁定状态，无法运行项目作业。

paused：暂停状态，暂时不会接受新的作业。

# 工作流程
![](assets/04-CI-CD/f7053c3f1f8731b517a2.png)




