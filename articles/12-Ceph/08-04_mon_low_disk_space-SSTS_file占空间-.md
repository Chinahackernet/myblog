# mon low disk space(SSTS file占空间)

> 分类：Ceph / 第8章：常见故障处理
> 原文：https://www.cuiliangblog.cn/detail/section/199159323
> 来源：崔亮的博客

---

# 问题现象
Ceph集群状态变为HEALTH_WARN， `ceph health detail` 输出 `mon low disk space; store is getting too big`

# 原因分析
主要是因为mon rocksdb的SSTS file占用了很多空间。SST是Sorted String Table的缩写，主要用于索引和存储key/value键值对。

# 处理过程
## 找到mon对应的ID
使用 `ceph mon dump` 命令可以查看到mon的ID信息，如下输出信息中，node1对应的ID是0

```plain
$ ceph mon dump
dumped monmap epoch 4
epoch 4
fsid 9a0ef35c-691a-4c3c-b242-c5a57e43e08a
last_changed 2018-07-20 12:01:29.580779
created 2018-07-20 11:57:44.542507
0: 192.168.1.10:6789/0 mon.node1
1: 192.168.1.11:6789/0 mon.node2
2: 192.168.1.12:6789/0 mon.node3
```

## 执行压缩
通过`ceph tell mon.{id} compact`进行压缩，如对node1进行压缩，可以执行：

```plain
$ ceph tell mon.0 compact
```

compact之后，会有一个mons自动重新启动，所以操作只能一个一个来，确定集群状态正常后再执行下一个

## 修改配置文件，并重启mon进程
确认在ceph.conf的global中是否有配置如下内容：

```plain
mon_compact_on_start = true
```

## 重启mon进程
# 结果验证
通过`ceph -s`或`ceph health detail`确认集群状态为HEALTH_OK


