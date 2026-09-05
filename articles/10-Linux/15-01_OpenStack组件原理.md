# OpenStack组件原理

> 分类：Linux / 第15章：OpenStack
> 原文：https://www.cuiliangblog.cn/detail/section/31515938
> 来源：崔亮的博客

---

# 一、身份服务：Keystone
    1.  为 OpenStack 其他服务提供身份验证、服务规则和服务令牌的功能。管理Domains       、Projects 、Users 、 Groups 、 Roles。
    2. 组件
    - Server
+ 使用  RESTful 接口（三种 api）提供认证和授权服务的集中式 server。
    - Drivers
+ 指的是被集成到  server 内的驱动或者服务后端，它们被用来在 openstack 组件之外的库中访问身份信息
+ （言外之意：mysql  并不属于 openstack 的组件/服务），并可能已经存在于openstack 部署的架构中（比如, SQL databases or LDAP  servers)。
    - Modules
+ 中间件运行在正在使用认证服务的 openstack 组件的地址空间，这些模块(中间件)拦截服务请求，提取用户的  credentials，并且把它们发送给 server 去认证授权，在 openstack 中间件与 openstack 组件直接的整合操作使用  Python Web Server Gateway  Interface，即 wsgi。
    3. 原理
    - Keystone 服务通过检查用户的       Credential 来确
+ 定用户的身份。
    - 最开始，使用用户名/密码或者用户名/API key 作为       credential。当用户的credential 被验证后，Kestone 会给用户分配一个token 供该用户后续的请求使用。       Keystone 中通过 Policy（访问规则）来做到基于用户角色(Role)的访问控制。

# 二、镜像服务：Glance 
    1. 一套虚拟机镜像查找及检索系统，支持多种虚拟机镜像格式（ AKI       、 AMI 、 ARI 、 ISO 、 QCOW2 、 Raw 、VDI 、 VHD 、 VMDK       ），有创建上传镜像、删除镜像、编辑镜像基本信息的功能
    2. 组件
    - glance-api:       用于客户端及其他服务与 glance 的通信接口。对外提供 REST API，响应 image 查询、获取和存储的调用
    - glance-registry:       用于链接后端数据库(mariadb), 以便于对数据库进行操负责处理和存取 image 的metadata，例如 image 的大小和类型
    3. 原理
+ ![](assets/10-Linux/eb0b04e67139d3fc4560.png)
    - 当glance-api 获取到响应       image 查询、获取和存储的调用请求后，不会真正处理请求。如果操作是与 image metadata（元数据）相关，glance-api       会把请求转发给glance-registry；如果操作是与 image 自身存取相关，glance-api 会把请求转发给该 image的       store backend。

# 三、计算服务：Nova
    1. 一套控制器，用于为单个用户或使用群组管理虚拟机实例的整个生命周期，根据用户需求来提供虚拟服务。负责虚拟机创建、开机、关机、挂起、暂停、调整、迁移、重启、销毁等操作，配置CPU 、内存等信息规格
    2. 组件
    - scheduler       虚机调度服务，负责决定在哪个计算节点上运行虚机。
    - compute 管理虚机的核心服务，通过调用       Hypervisor API 实现虚机生命周期管理。
    - conductor nova-compute       经常需要更新数据库，比如更新虚机的状态。出于安全性和伸缩性的考虑，nova-compute 并不会直接访问数据库，而是将这个任务委托给       nova-conductor。
    4. 原理
+ ![](assets/10-Linux/0f4373b8af506423fd48.png)
    - 客户（可以是 OpenStack       最终用户，也可以是其他程序）向 API（nova-api）发送请求：“帮我创建一个虚机”
    - API 对请求做一些必要处理后，向       Messaging（RabbitMQ）发送了一条消息：“让 Scheduler 创建一个虚机”
    - Scheduler（nova-scheduler）从       Messaging 获取到 API 发给它的消息，然后执行调度算法，从若干计算节点中选出节点 A
    - Scheduler 向 Messaging       发送了一条消息：“在计算节点 A 上创建这个虚机”
    - 计算节点 A 的 Compute（nova-compute）从       Messaging 中获取到 Scheduler发给它的消息，然后在本节点的 Hypervisor 上启动虚机。
    - 在虚机创建的过程中，Compute       如果需要查询或更新数据库信息，会通过Messaging 向 Conductor（nova-conductor）发送消息，Conductor       负责数据库访问

# 四、网络服务：Neutron    
    1. 提供云计算的网络虚拟化技术，为       OpenStack其他服务提供网络连接服务。为用户提供接口，可以定义 Network 、 Subnet 、 Router ，配置DHCP 、       DNS 、负载均衡、 L3 服务，网络支持GRE 、 VLAN 。插件架构支持许多主流的网络厂家和技术，如 OpenvSwitch 。
    2. 组件
+ ![](assets/10-Linux/8e670ef667bfcc2d4b3f.png)
    - Neutron-server       可以理解为一个专门用来接收 Neutron REST API 调用的服务器，然后负责将不同的 rest api 分发到不同的       neutron-plugin 上。
    - Neutron-plugin       可以理解为不同网络功能实现的入口，各个厂商可以开发自己的 plugin。Neutron-plugin 接收 neutron-server       分发过来的 REST API，向 neutrondatabase 完成一些信息的注册，然后将具体要执行的业务操作和参数通知给自身对应的       neutron agent。
    - Neutron-agent 可以直观地理解为       neutron-plugin 在设备上的代理，接收相应的 neutron-plugin       通知的业务操作和参数，并转换为具体的设备级操作，以指导设备的动作。当设备本地发生问题时，neutron-agent 会将情况通知给       neutron-plugin。
    - network       provider提供网络服务的虚拟或物理网络设备，例如 Linux Bridge，Open vSwitch 或者其他支持 Neutron       的物理交换机。

# 五、UI 界面：Horizon
    1. OpenStack       中各种服务的 Web 管理门户，用于简化用户对服务的操作，例如：启动实例、分配 IP地址、配置访问控制等
    2. 计算服务（       Compute Service ）： Nova
+ 一套控制器，用于为单个用户或使用群组管理虚拟机实例的整个生命周期，根据用户需求来提供虚拟服务。负责虚拟机创建、开机、关机、挂起、暂停、调整、迁移、重启、销毁等操作，配置CPU  、内存等信息规格。自 Austin 版本集成到项目中。
    1. 对象存储（       Object Storage ）： Swift
+ 一套用于在大规模可扩展系统中通过内置冗余及高容错机制实现对象存储的系统，允许进行存储或者检索文件。可为 Glance  提供镜像存储，为Cinder 提供卷备份服务。自 Austin 版本集成到项目中 。
    1. 镜像服务（       Image Service ）： Glance 。
+ 一套虚拟机镜像查找及检索系统，支持多种虚拟机镜像格式（ AKI 、 AMI 、 ARI 、 ISO 、 QCOW2 、  Raw 、VDI 、 VHD 、 VMDK ），有创建上传镜像、删除镜像、编辑镜像基本信息的功能。自 Bexar 版本集成到项目中。
    1. 身份服务（       Identity Service ）：Keystone
+  为 OpenStack  其他服务提供身份验证、服务规则和服务令牌的功能。管理Domains 、 Projects 、 Users 、 Groups 、 Roles。自 Essex  版本集成到项目中。
    1. 网络服务（       Network Service ）： Neutron    
+ 提供云计算的网络虚拟化技术，为 OpenStack其他服务提供网络连接服务。为用户提供接口，可以定义 Network 、  Subnet 、 Router ，配置DHCP 、 DNS 、负载均衡、 L3 服务，网络支持GRE 、 VLAN  。插件架构支持许多主流的网络厂家和技术，如 OpenvSwitch 。
    1. 块存储       (Block Storage) ： Cinder
+ 为运行实例提供稳定的数据块存储服务，它的插件驱动架构有利于块设备的创建和管理，如创建卷、删除卷，在实例上挂载和卸载卷。自  Folsom版本集成到项目中。
    1. UI 界面 (Dashboard) ： Horizon
+ OpenStack 中各种服务的 Web 管理门户，用于简化用户对服务的操作，例如：启动实例、分配  IP地址、配置访问控制等。自 Essex 版本集成到项目中。
    1. 测量 (Metering) ： Ceilometer
+ 像一个漏斗一样，能把 OpenStack  内部发生的几乎所有的事件都收集起来，然后为计费和监控以及其它服务提供数据支撑。自 Havana 版本集成到项目中。
    1. 部署编排       (Orchestration) ： Heat
+ 提供了一种通过模板定义的协同部署方式，实现云基础设施软件运行环境（计算、存储和网络资源）的自动化部署。自 Havana  版本集成到项目中。
+  


