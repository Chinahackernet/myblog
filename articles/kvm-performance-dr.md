# KVM 性能与灾备：NUMA、hugepages、在线迁移与快照链

## 性能基线

先测 CPU steal、内存带宽、磁盘延迟和网络 PPS，再决定 pinning、NUMA 对齐或 hugepages。过度超分会把调度延迟传给 guest，表现为尾延迟恶化。

```bash
lscpu -e; numactl -H; virsh nodecpustats; virsh nodememstats; pidstat -u -d 1 5
```

## NUMA 与 hugepages

双路服务器应让 vCPU、内存和虚拟磁盘尽量在同一 NUMA 节点。`numatune` 控制内存，`vcpupin` 控制 vCPU；为宿主机内核线程、中断和迁移预留 CPU。

```xml
<vcpu placement='static'>8</vcpu>
<cputune><vcpupin vcpu='0' cpuset='0'/><vcpupin vcpu='1' cpuset='1'/></cputune>
<numatune><memory mode='strict' nodeset='0'/></numatune>
```

2 MiB hugepages 可减少 TLB miss，1 GiB 页适合内存稳定的工作负载；它们会降低动态调整能力。预留失败应拒绝创建，不应静默回退：`sysctl -w vm.nr_hugepages=4096; grep Huge /proc/meminfo`。

## 在线迁移

源/目标 CPU 模型、存储可见性、VLAN、MTU、证书和安全策略都必须兼容。

```bash
virsh domjobinfo app-01; virsh migrate --live --persistent --verbose --copy-storage-all app-01 qemu+ssh://kvm02/system
```

记录脏页率、剩余时间和业务 P99。脏页产生速度高于迁移带宽时，限制业务写入、提升带宽或安排短暂停机，不能无限等待。

## 快照链

qcow2 外部快照会形成 backing chain；链越长随机读放大越明显，合并还会产生写放大。快照不是备份。

```bash
qemu-img info --backing-chain app-01.qcow2; virsh snapshot-create-as app-01 pre-change --disk-only --atomic; virsh blockcommit app-01 vda --active --pivot --verbose
```

合并前验证空间、延迟和备份副本。不要直接删除 backing 文件，必须先保存链清单和校验和。

## 灾备与恢复

将 RPO/RTO 转成工程约束：RPO 15 分钟要求复制、备份和校验延迟低于 15 分钟；RTO 30 分钟必须包含启动、数据恢复、DNS/VIP 切换和验收。采用“镜像模板 + 增量块备份 + 配置仓库 + 异地副本”，季度抽样恢复并记录证据。

故障决策：迁移失败先查 CPU 特性和存储；guest 卡顿区分 steal、NUMA miss、I/O await、丢包；链异常先冻结删除，复制元数据后逐级恢复。

## 性能实验设计

对同一镜像分别建立基线、NUMA 对齐和 hugepages 三组实例，只改变一个变量。使用 `fio`、`iperf3` 和业务压测采集吞吐、P99、CPU steal、major fault、NUMA miss、iowait 和迁移停顿。结果必须同时记录宿主机和 guest，避免把宿主机缓存误当成业务收益。

迁移前计算 dirty-page rate：若业务写入速率接近可用迁移带宽，预拷贝不会收敛。应通过 `virsh domjobinfo` 观察剩余数据和停顿计数，在业务低峰执行；设置最大迁移带宽和超时，任务超过窗口自动终止并恢复原实例。

灾备演练的成功标准不是“虚拟机启动”，而是：应用探针通过、数据位点满足 RPO、密钥和身份未复用、告警链路可用、业务方确认读写正确。演练后的原环境要做回切和数据清理，避免双写。
