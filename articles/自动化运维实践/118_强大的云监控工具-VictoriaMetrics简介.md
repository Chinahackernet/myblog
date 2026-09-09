---
title: 强大的云监控工具-VictoriaMetrics简介
---

**前言：在我们这里，所采用的云监控平台乃是二次开发后的 k8s+VictoriaMetrics+Prometheus+skywalking等。而与之搭配的 web 页面则是经过精心二次开发的夜莺，其页面设计更美观、可视度极高，监控项更加丰富多样且趋于完善，极具细节，以下是对 VictoriaMetrics 的简介。**

VictoriaMetrics 是一个高性能、成本效益高且可扩展的监控解决方案和时间序列数据库。它具有以下特点：

1. 快速且易于设置和操作，没有外部依赖，所有配置通过命令行标志完成，数据存储在单一目录中。
2. 支持作为 Prometheus 的长期存储解决方案，并且可以作为 Prometheus 或 Graphite 在 Grafana 中的直接替代品，因为它支持 Prometheus 查询 API 和 Graphite API。
3. 与 Graphite 相比，可以减少 10 倍以上的基础设施成本。
4. 实现了类似 PromQL 的查询语言 MetricsQL，提供全局查询视图，支持多 Prometheus 实例或任何其他数据源将数据摄入 VictoriaMetrics，后续可通过单一查询进行查询。
5. 在处理高基数时间序列时，内存使用量比 InfluxDB 少 10 倍，比 Prometheus、Thanos 或 Cortex 少 7 倍。
6. 针对具有高延迟 IO 和低 IOPS 的存储进行了优化，适用于 HDD 和网络存储。
7. 提供高数据压缩率，与 TimescaleDB 相比，可以存储多达 70 倍的数据点。
8. 支持通过多种协议进行指标抓取、摄取和回填，包括 Prometheus exporters、remote write API、InfluxDB line protocol 等。
9. 支持强大的流聚合，可以作为 statsd 的替代品。
10. 支持度量标准重标记，可以处理高基数和高流失率问题。

VictoriaMetrics 适用于 APM、Kubernetes、IoT 传感器、连接车辆、工业遥测、财务数据和各种企业工作负载等大量时间序列数据的存储和查询。

此外，VictoriaMetrics 还有开源集群版本，可以存储数据在 NFS 存储上，如 Amazon EFS 和 Google Filestore，并提供了一系列的工具和组件，如 vmagent、vmalert、vmauth 等，以支持不同的监控和告警需求。

对于安装和操作，VictoriaMetrics 提供了多种安装方法，包括二进制文件、Docker 镜像和源代码，并且提供了详细的文档和快速入门指南。

总的来说，VictoriaMetrics 是一个强大的工具，适用于需要高性能和可扩展监控解决方案的个人和企业。
