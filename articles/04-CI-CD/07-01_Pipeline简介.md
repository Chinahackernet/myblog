# Pipeline简介

> 分类：CI/CD / 第7章：Jenkins流水线
> 原文：https://www.cuiliangblog.cn/detail/section/132343694
> 来源：崔亮的博客

---

# 概念
Pipeline简单来说，就是一套运行在 Jenkins 上的工作流框架，将原来独立运行于单个或者多个节点的任务连接起来，实现单个任务难以完成的复杂流程编排和可视化的工作。

# 使用Pipeline有以下好处
代码：Pipeline以代码的形式实现，通常被检入源代码控制，使团队能够编辑，审查和迭代其传送流程。 

持久：无论是计划内的还是计划外的服务器重启，Pipeline都是可恢复的。 

可停止：Pipeline可接收交互式输入，以确定是否继续执行Pipeline。 

多功能：Pipeline支持现实世界中复杂的持续交付要求。它支持fork/join、循环执行，并行执行任务的功能。 

可扩展：Pipeline插件支持其DSL的自定义扩展 ，以及与其他插件集成的多个选项。

# 如何创建 Jenkins Pipeline
Pipeline 脚本是由 Groovy 语言实现的，但是我们没必要单独去学习 Groovy

Pipeline 支持两种语法：Declarative(声明式)和 Scripted Pipeline(脚本式)语法。声明式pipeline是官方主推的方式

Pipeline 也有两种创建方法：可以直接在 Jenkins 的 Web UI 界面中输入脚本；也可以通过创建一个 Jenkinsfile 脚本文件放入项目源码库中（一般我们都推荐在 Jenkins 中直接从源代码控制(SCM)中直接载入 Jenkinsfile Pipeline 这种方法）。

# 获取示例
实际工作中没必要学习每个pipeline写法，可以在jenkins中配置相关参数，即可生成pipeline。

![](assets/04-CI-CD/4fdf785091cf99644793.png)


