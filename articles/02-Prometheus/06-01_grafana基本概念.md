# grafana基本概念

> 分类：Prometheus / 第6章：grafana
> 原文：https://www.cuiliangblog.cn/detail/section/23468115
> 来源：崔亮的博客

---

# 一、数据源（Data Source）
1. 对于Grafana而言，Prometheus这类为其提供数据的对象均称为数据源（Data      Source）。
2. 对于Grafana管理员而言，只需要将这些对象以数据源的形式添加到Grafana中，Grafana便可以轻松的实现对这些数据的可视化工作。

# 二、仪表盘（Dashboard）
![](assets/02-Prometheus/a35dc5919ae860b5fece.png)

1. DashBoard：仪表盘，就像汽车仪表盘一样可以展示很多信息，包括车速，水箱温度等。Grafana的DashBoard就是以各种图形的方式来展示从Datasource拿到的数据。
2. Row：行，DashBoard的基本组成单元，一个DashBoard可以包含很多个row。一个row可以展示一种信息或者多种信息的组合，比如系统内存使用率，CPU五分钟及十分钟平均负载等。所以在一个DashBoard上可以集中展示很多内容。
3. Panel：面板，实际上就是row展示信息的方式，支持表格（table），列表（alert      list），热图（Heatmap）等多种方式，具体可以去官网上查阅。
4. Query      Editor：查询编辑器，用来指定获取哪一部分数据。类似于sql查询语句，比如你要在某个row里面展示test这张表的数据，那么Query      Editor里面就可以写成select *from      test。这只是一种比方，实际上每个DataSource获取数据的方式都不一样，所以写法也不一样（[http://docs.grafana.org/features/datasources/](http://docs.grafana.org/features/datasources/)），比如像zabbix，数据是以指定某个监控项的方式来获取的。

# 三、组织和用户
1. 在Grafana中Dashboard是属于一个Organization（组织），通过Organization，可以在更大规模上使用Grafana
2. 例如对于一个企业而言，我们可以创建多个Organization，其中User（用户）可以属于一个或多个不同的Organization。 并且在不同的Organization下，可以为User赋予不同的权限。 从而可以有效的根据企业的组织架构定义整个管理模型。


