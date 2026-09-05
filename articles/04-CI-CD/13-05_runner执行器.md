# runner执行器

> 分类：CI/CD / 第13章：Gitlab Runner
> 原文：https://www.cuiliangblog.cn/detail/section/123863610
> 来源：崔亮的博客

---

# 执行器介绍
CI/CD的流水线真正的执行环境是GitLab Runner提供的执行器，为了满足各种各样的需求，GitLab CI/CD支持的执行器有很多种，最常用的是Docker， shell，Kubernets三种。每一种执行器都与自己的特性，了解各个执行器的特性，并选择合适的执行器才能让我们流水线更加可靠，稳健。

# <font style="color:rgb(79, 79, 79);">执行器类型</font>
GitLab Runner支持的执行器有以下几种：

+ SSH
+ Shell
+ Parallels
+ VirtualBox
+ Docker
+ Docker Machine (auto-scaling)
+ Kubernetes
+ Custom

GitLab Runner 支持的执行器有GitLab Runner的安装方式有关也和宿主机环境有关。

# 执行器功能对比
具体可参考文档：[https://docs.gitlab.com/runner/executors/#selecting-the-executor](https://docs.gitlab.com/runner/executors/#selecting-the-executor)

![](assets/04-CI-CD/0527a1038bcdd673637e.png)


