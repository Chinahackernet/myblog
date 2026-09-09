---
title: Linux系统上nacos崩溃故障分析
---

**前言：本月 21 日，公司的一个海外项目业测环境中的 Nacos 遭遇重大问题，竟意外 “宕机” 了。遗憾的是，这个项目交付给小日子后并未配置监控系统，还是由负责的小日子运维人员在上班时间发现并予以通告。而近日，我一直忙于搭建集团旗下某项目的云监控平台，实在分身乏术。领导遂安排一位同事前去处理此事，然而几日过去，却始终未能给出一个清晰的说法。今日下午，我依据日志进行了深入具体的分析，终于找出了问题的根源。在此，我愿与大家分享这份心得。**

**日志一：**  

**故障分析：**  
从提供的日志来看，Nacos 在启动过程中遇到了几个问题，这些问题很可能会导致 Nacos 服务无法正常运行。以下是日志中提到的几个关键问题：

1. **BeanCreationException**: 这个异常表明在创建 `Spring Bean` 时出现了问题。具体来说，是在尝试创建名为 `distroFilterRegistration` 的 Bean 时失败了。这通常是因为 Bean 的依赖关系没有得到满足。
2. **UnsatisfiedDependencyException**: 这个异常表明在创建 `distroFilter` Bean 时，其依赖的 `distroMapper` Bean 无法被创建。这可能是因为 `distroMapper` 的构造函数参数没有得到满足。
3. **BeanInstantiationException**: 这个异常表明在通过构造函数实例化 `serverMemberManager` Bean 时失败了。这可能是因为构造函数抛出了异常。
4. 线程未正确停止: 日志中提到 Nacos 启动了一个名为 `nacos.publisher-com.alibaba.nacos.common.event.ServerConfigChangeEvent` 的线程，但未能正确停止它。这可能会导致内存泄漏。

5.另一个线程未正确停止: 类似地，名为 `nacos-http-async-client.0` 的线程也未能正确停止，这同样可能导致内存泄漏。

**总结：**  
这些问题都可能导致 Nacos 服务无运行过程中出现问题。线程未能正确停止，会导致内存泄漏，随着时间的推移，这会导致服务性能下降甚至崩溃。

**要解决这些问题，你可以尝试以下步骤：**

- 检查 `distroFilter` 和 `distroMapper` 的定义，确保它们的依赖关系得到了正确的配置。
- 查看 `serverMemberManager` 的构造函数，找出可能抛出的异常，并进行修复。
- 确保所有线程都能在服务停止时正确地关闭。这可能需要检查你的代码中负责管理线程的部分，确保它们能够正确地释放资源。
- 如果不熟悉这些概念或者不确定如何进行调试，需要有此经验的后端开发人员协助处理。

**参考：**  
**单节点模式：**  
在Nacos单节点模式下，`distroFilter` 和 `distroMapper` 这两个组件与业务应用程序代码的关系主要体现在它们对Nacos服务注册与发现机制的支持上。`distroFilter` 是一个过滤器，它负责处理服务注册和发现过程中的请求，确保请求能够正确地路由到相应的服务实例。而 `distroMapper` 则负责映射服务名到具体的服务实例，它在Nacos中用于决定哪个节点应该负责处理特定的服务请求。

尽管在单节点模式下，Nacos的集群协调和数据同步机制简化了，但这两个组件仍然发挥着作用，确保服务注册和发现的功能正常运行。它们的存在对于业务应用程序来说，意味着可以依赖Nacos进行服务的注册和发现，而无需关心背后的复杂性。业务应用程序通过与Nacos交互，可以实现服务的动态注册、发现和配置管理，从而提高系统的灵活性和可维护性。

在单节点模式中，由于没有集群节点之间的数据同步问题，`distroFilter` 和 `distroMapper` 的作用更多地体现在本地服务的注册和查找上，而不是在集群环境中的节点间协调。因此，它们对业务应用程序代码的影响主要体现在提供了一种简单而有效的方式来管理服务的注册和发现过程。

**集群模式：**  
`distroFilter` 和 `distroMapper` 是 Nacos 应用程序中的两个组件，它们与业务应用程序的代码紧密相关。  
`distroFilter` 是一个过滤器（Filter），它在 Nacos 的 Web 应用程序中用于处理请求。当请求到达时，`distroFilter` 会根据请求的类型和目标服务名来判断当前节点是否应该处理这个请求。如果当前节点不负责处理该请求，`distroFilter` 会将请求转发到正确的节点。这个组件确保了请求能够被正确地路由到负责该服务的 Nacos 节点上。

`distroMapper` 是一个映射器，它在 Nacos 中用于决定哪个节点应该负责处理特定的服务请求。它通过维护一个健康的服务器列表，并使用哈希算法来确定哪个节点应该处理特定的服务名。`distroMapper` 的 `responsible` 方法会检查当前节点是否负责处理给定的服务名，而 `mapSrv` 方法则会映射服务名到相应的处理节点。

这两个组件共同工作，以支持 Nacos 的分布式一致性协议（Distro），确保在 Nacos 集群中数据的一致性和请求的正确路由。如果这些组件出现问题，可能会导致请求无法正确处理，从而影响 Nacos 服务的正常运行。

**日志二：**  

**故障分析：**  
具体来说，日志中提到的异常是 `org.springframework.context.ApplicationContextException`，它表明 Spring 应用程序上下文在启动过程中遇到了问题。这个异常的嵌套异常是 `org.springframework.boot.web.server.WebServerException`，这表明问题与 Spring Boot 内嵌的 Tomcat 服务器有关，无法启动这个服务器。

异常堆栈跟踪显示，问题发生在 `ServletWebServerApplicationContext.onRefresh` 方法中，这是 Spring Boot 应用程序上下文刷新的阶段。如果在这个阶段出现问题，通常会导致应用程序无法启动。
