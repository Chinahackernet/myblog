# clock skew detected(节点时钟偏移)

> 分类：Ceph / 第8章：常见故障处理
> 原文：https://www.cuiliangblog.cn/detail/section/199159368
> 来源：崔亮的博客

---

# 问题现象
使用`ceph health detail`查看到如下信息

```plain
# ceph health detail
HEALTH_WARN clock skew detected on mon.node2; Monitor clock skew detected
mon.node2 addr 192.168.1.11:6789/0 clock skew 4653.04s > max 0.5s (latency 0.004019s
```

# 原因分析
Ceph集群之间默认有时间偏移量设置，在ceph.conf文件中通过参数 `mon-clock-drift-allowed` 来控制偏移量的大小(默认0.05s)。当节点之间的时钟偏移量超出这个值的范围时，会出现上述HEALTH_WARN信息。

`mon-clock-drift-allowed` 的值并非是越大就越好，所以这并不意味着你能够随意的对这个值进行修改。如果把这个值设置的过大，虽然出现比较大的时钟偏移时不会产生报警，但是这样对整个集群的运行产生很多不可预料的影响。所以不建议对这个值进行大幅度的调整。为了避免这种状况，一般在部署Ceph集群时都会部署时间同步工具，如：ntp、chrony。通过时间同步工具自动完成时间同步。

# 处理过程
## 确认时钟偏移状况
由于一般情况下ntpd自动同步时间会比较慢，出现时钟偏移时可以在运维节点上通过ansible命令核实一下时钟偏移状况，命令格式如下：

```plain
$ ansible {clients} -m raw -a 'date +%T-%s'
```

## 手动进行时间同步
确认出现时钟偏移的主机后，ntpdate命令手动进行一下时间同步，命令格式如下：

```plain
$ ntpdate -u xx.xx.xx.xx
```

# 结果验证
通过`ceph -s`或`ceph health detail`确认集群状态为HEALTH_OK


