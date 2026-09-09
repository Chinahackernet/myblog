---
title: VictoriaMetrics 实战：vmui 使用指南与生产排错
---

**前言：在现代监控系统中，VictoriaMetrics 以其高性能和易用性逐渐成为许多团队的首选工具。vmui 作为 VictoriaMetrics 的内置 Web 界面，为用户提供了直观的查询和可视化体验。然而，尽管功能强大，vmui 仍处于 Beta 版本阶段，主要用于单节点查询。在生产环境中，我们常常需要面对更复杂的场景，例如多节点数据聚合或集群环境下的故障排查。**  
**本文将分为两部分。第一部分将详细介绍如何快速上手使用 vmui，包括其功能、基本操作以及配置方法。第二部分则结合实际案例，分享如何通过 vmui 排查生产环境中的问题。无论你是刚刚接触 VictoriaMetrics 的新手，还是在生产环境中遇到难题的资深运维人员，本文都希望能为你提供一些实用的参考。**

## 一、VictoriaMetrics 的 vmui 的使用入门指南

### 1. 访问 vmui

`vmui` 是 VictoriaMetrics 的内置 Web 界面，用于查询和可视化时间序列数据。对于单节点版本的 VictoriaMetrics，可以通过以下地址访问 `vmui`：  
  
例如，如果你的 VictoriaMetrics 运行在本地的 `192.168.1.102`，则访问地址为：

### 2. vmui 的功能

`vmui` 提供了以下功能：

- **查询结果可视化**：支持通过图表和表格展示查询结果。
- **Raw Query**：查看原始样本数据，有助于调试意外的查询结果。
- **Metrics Explorer**：自动为选定的指标生成图表。
- **Cardinality Explorer**：分析时间序列的基数，例如识别具有最多时间序列的指标名称、标签名称或标签值。
- **Top Queries 和 Active Queries**：查看最常执行的查询和当前正在执行的查询。
- **工具**：包括查询追踪分析器、查询分析器、WITH 表达式测试工具、指标重标签调试器等。

### 3. 使用 vmui 的基本操作

- **查询输入**：在查询框中输入 MetricsQL 查询语句，支持自动补全功能。
- **时间范围选择**：在页面右上角选择需要查看的时间范围。
- **图表操作**：支持缩放、滚动和拖动图表，以查看不同时间范围的数据。
- **多行查询**：通过按 `Shift-Enter` 输入多行查询。

### 4. 配置 vmui

`vmui` 支持通过配置文件或 HTML 参数进行自定义。例如，可以通过以下 JSON 格式配置 `vmui` 的外观和行为：

```
{
  "serverURL": "http://localhost:8428",
  "useTenantID": true,
  "headerStyles": {
    "background": "#FFFFFF",
    "color": "#538DE8"
  },
  "palette": {
    "primary": "#538DE8",
    "secondary": "#F76F8E",
    "error": "#FD151B",
    "warning": "#FFB30F",
    "success": "#7BE622",
    "info": "#0F5BFF"
  }
}
```

### 5. 注意事项

- **vmui** 目前仍处于 Beta 版本，功能相对简单，主要用于单节点查询。
- 如果需要更复杂的多节点数据聚合和展示，可以考虑使用 **promxy**。

通过以上步骤和功能，你可以快速上手使用 vmui 来查询和分析 VictoriaMetrics 中的时间序列数据。

## 二、生产排错 vmui 实操

**背景**  
**原因**：接到技术组同事反馈，在公司二开的云监控平台上发现其中一组项目不同板块的 Redis 集群，有的能显示内存使用率，有的却不能。如下图所示：  

## 排查思路：

### 1、获取VictoriaMetrics 的用户界面（VMUI）地址

在k8s上获取VictoriaMetrics服务对外的映射端口，这里不做截图展示了，涉及隐私

### 2、查询参数数值

首先，尝试使用以下 PromQL 查询计算 Redis 内存使用率：  
`sum(100 * (redis_memory_used_bytes{instance=~"<redis对应实例采集器信息>",job="redis_monitor",project="<实例所在命令空间信息>"}/redis_config_maxmemory{instance=~"<redis对应实例采集器信息>",job="redis_monitor",project="<实例所在命令空间信息>"}))`  
将以上`<redis对应实例采集器信息>`和`<实例所在命令空间信息>`替换为当前实际值  

然而，此查询未能返回任何数值。因此，需要将分子和分母分开查询，以定位问题。

#### ① 分子（已使用内存数值）：

`redis_memory_used_bytes{instance=~"<redis对应实例采集器信息>",job="redis_monitor",project="<实例所在命令空间信息>"`

#### ② 分母（总内存数值）：

`redis_config_maxmemory{instance=~"<redis对应实例采集器信息>",job="redis_monitor",project="<实例所在命令空间信息>"}`

### 3、查询分子和分母参数并判断结果

#### 查询分子数值：

这里可以看到已用内存的数值

##### 查询分母数值：

这里可以看到总内存的数值为0

**问题定位与总结：经过排查，问题根源在于，在部署 Redis 集群时，运维同事未正确配置 Redis 的总内存大小参数（redis_config_maxmemory）。这导致云监控平台无法计算出 Redis 的内存使用率。**
