# qemu-img 与虚拟机存储后端

## 映像格式

raw 提供简单、稳定的块布局；qcow2 支持稀疏、快照和压缩，但需要管理 backing chain 和元数据；LVM、Ceph RBD、NFS 等后端在锁、一致性、快照和迁移能力上不同。选型必须以 IOPS、尾延迟、故障域和恢复工具为依据。

```bash
qemu-img create -f qcow2 -o cluster_size=2M,lazy_refcounts=on app.qcow2 40G
qemu-img info --backing-chain app.qcow2
qemu-img check --force-share app.qcow2
```

## 镜像生命周期

黄金镜像只读保存并记录版本、校验和、操作系统补丁和 cloud-init 清理状态。实例盘与模板盘分离；克隆前确认 UUID、machine-id、SSH host key 和应用身份不会重复。删除 backing 文件前必须解析完整链并建立备份。

## I/O 性能

virtio-blk/virtio-scsi、多队列、cache 模式、discard 和 iothread 需要结合存储后端测试。`cache=writeback` 可能提高吞吐但扩大断电风险；数据库虚拟机要优先保证持久化语义。监控 guest fsync 延迟、宿主机 await、队列和写放大。

## 迁移与恢复

共享存储迁移只传输内存与设备状态，非共享存储还要复制磁盘；两者对带宽、停顿和失败回滚的要求不同。恢复时先在隔离网络导入 XML 和磁盘，验证文件系统、应用和数据位点，再接入生产网络。

