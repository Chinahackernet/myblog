# Artifactory介绍

> 分类：CI/CD / 第3章：Artifactory制品库
> 原文：https://www.cuiliangblog.cn/detail/section/172000780
> 来源：崔亮的博客

---

# 什么是制品与制品库
## <font style="color:rgb(0, 0, 0);">制品</font>
<font style="color:rgb(32, 45, 64);">软件制品是指由源码编译打包生成的二进制文件，不同的开发语言对应着不同格式的二进制文件，这些二进制通常可以直接运行在服务器上。</font>

## <font style="color:rgb(0, 0, 0);">制品库</font>
<font style="color:rgb(32, 45, 64);">制品库用以管理源代码编译后的构建产物，例如Docker、Maven、Helm、npm、PyPI 包等常见制品库类型。制品库可以跟源代码协同进行版本化控制，可以与本地各构建工具和云上的持续集成、持续部署无缝结合，并支持漏洞扫描等特性，是一种企业处理软件开发过程中产生的所有包类型的标准化方式。</font>

# 为什么需要制品库
目前常规的制品管理存在如下问题：

+ 外部依赖下载速度慢；
+ 安全漏洞风险：第三方依赖包的安全风险管理形同虚设，或者滞后；针对引入进来的第三组件没有进行组件扫描，极易引入漏洞；
+ 版本管理混乱：交付包使用FTP或者SVN进行管理，管理粒度相对较粗；由于受到监管约束，一键部署是不可能任务，跨网段的包交付智能依赖于手工拷贝；
+ 制品存储风险：团队内部搭建的制品库是单点的，缺乏集群部署；
+ 资源浪费：因为没有统一的制品库，存在重复建设的问题；维护成本高，或者说目前根本就没有维护

# <font style="color:rgb(34, 34, 38);">Artifactory Jfrog与Nexus对比</font>
| 功能 | jfrog | nexus |
| --- | --- | --- |
| 语言&工具支持 | Maven、Docker、Bower（html&js）、Chef、Puppet、CocoaPods（IOS）、Conan（C/C++）、Debian、Ruby Gems、Git LFS、Gradle、Ivy、Npm、Nuget、Opkg、Php composer、Pypi、SBT、Vagrant（box）、Rpm、Generic（通用） | Bower、Java、Npm、Docker、Nuget、Pypi |
| 多 Docker 镜像注册中心 | 支持多 Docker 镜像注册中心，用户可以做 Docker 镜像的流水线 Promotion。   删除 Docker 镜像时不需要停服。 | 支持 Docker 镜像注册中心。   删除 Docker 镜像时需要停服。 |
| 是否支持 REST API | 全面覆盖的 REST API。与 UI 松耦合，可以基于 REST API 实现自己的 UI。 | 部分支持。 |
| 元数据 | 支持自定义属性以及属性集到任何 Layout 的二进制文件上; | Nexus2 支持 Custom metadata plugin。 |
| CI 集成 | 收集所有构建相关环境信息。   收集发布以及依赖的模块信息。   支持构建 Promotion 升级。   建立二进制文件和构建的关系，多维度管理二进制文件生命周期。支持可视化的正-反向依赖关系展示。 | 不支持。 |
| Checksum 检查 | 在上传时检查 Checksum，若发现该文件已经被上传过，则不重复上传。   若文件丢失 Checksum，会重新计算并记录。 | 不支持。 |
| 主动并发下载依赖 | 支持主动并发下载相关的依赖。例如 A依赖 B，B 依赖 C，Artifactory 在下载 A 的同时，会并发的下载 B 和 C。 | 不支持。 |
| 任意全局查询 | 提供 AQL（Artifactory Query Language）支持任何条件的查询，包括排序，过滤，返回字段等等。 | 支持有限的查询，例如通过名字查询。 |
| 深度文件查询 | 支持在任意可解压文件里搜索类文件，并提供地址。例如：在任意 Jar 包里找到 .Class 文件。 | 不支持。 |
| 仓库数据统计 | 提供仓库大小，实际存储大小，文件数量，下载量，上传者等统计 | 不支持 |
| 查看 Jar 文件 | 能够查看 Jar文件里的任何内容，包括 Jar 文件里的源代码。 | 不支持。 |
| 仓库复制 | 支持文件夹级别的文件实时复制。支持并发多地复制（Multi-Push）保证多地仓库的一致性。 | 不支持。 |
| 支持高可用 | 支持0宕机时间的高可用集群，并且可以自由水平扩展。支持 Active-Active 高可用。 | 支持Master-Slave。 |
| 数据库存储 | 安装包默认绑定 Apache Derby。   支持MySQL，PostgreSQL，Oracle，MS SQL Server。 | 安装包默认绑定 H2。 |
| 商业支持 | 不限制用户数量，不限制服务器硬件配置。   30天免费试用，并可以适当延期。   24/7 support，4小时响应时间。 | 按用户数量收费，不限制服务器数量。   14天免费试用，并可以适当延期。   24/7 support。 |



