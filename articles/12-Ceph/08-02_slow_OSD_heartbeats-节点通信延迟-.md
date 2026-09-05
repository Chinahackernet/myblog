# slow OSD heartbeats(节点通信延迟)

> 分类：Ceph / 第8章：常见故障处理
> 原文：https://www.cuiliangblog.cn/detail/section/199385885
> 来源：崔亮的博客

---

# 问题现象
执行`ceph -s`时会出现如下内容的报错：

```bash
  cluster:
    health: HEALTH_WARN
            Slow OSD heartbeats on back (longest 9124.616ms)
            Slow OSD heartbeats on front (longest 9124.620ms)
            2 slow ops, oldest one blocked for 37 sec, mon.c has slow ops
```

## 主要问题
**慢的 OSD 心跳（Slow OSD heartbeats）**

+ 后端（back）**和**前端（front）都出现了心跳延迟，最长延迟分别为 `9124.616ms` 和 `9124.620ms`。
+ 这通常是网络或硬件性能问题引起的。

**慢操作（slow ops）**

+ 当前有 2 个慢操作，其中最老的一个已经阻塞了 **37 秒**。
+ 监控服务 `mon.c` 被标记为处理慢操作。

# 可能原因
## 网络问题
心跳延迟问题通常与 OSD 节点之间的网络连接质量有关。可能是以下原因：

+ 网络链路拥堵或不稳定。
+ OSD 节点网络带宽不足。
+ 网络设备（如交换机、路由器）出现异常。

## 硬件资源问题
高负载或者磁盘性能瓶颈可能导致慢操作：

+ 磁盘 IOPS 不足。
+ CPU 或内存使用率过高。

## 配置问题
+ Ceph 配置不当可能导致心跳和操作超时。

# 排查思路
## 网络排查
+ 检查所有 OSD 节点之间的网络延迟和带宽，确保低延迟和足够的网络资源。
+ 使用 `ping` 或 `iperf` 工具对节点间网络进行测试。
+ 检查是否存在丢包或高延迟现象。

## 硬件优化
+ 检查 OSD 节点的硬件负载，重点关注磁盘 I/O、CPU 和内存使用情况。
+ 如果硬件资源不足，考虑添加新的 OSD 节点或升级现有硬件。

## 配置优化
+ 调整 OSD 心跳和超时参数：`osd_heartbeat_grace` 和 `osd_heartbeat_interval`。
+ 检查慢操作日志，定位具体的操作类型和问题原因。
+ 优化磁盘调度参数，如 `osd_op_threads` 和 `osd_max_backfills`。


