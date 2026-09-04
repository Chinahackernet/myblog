# qemu-img 磁盘映像管理

## 1. 查看与创建

```bash
qemu-img info /var/lib/libvirt/images/<IMAGE>.qcow2
qemu-img create -f qcow2 -o preallocation=metadata <IMAGE>.qcow2 40G
```

`qcow2` 支持快照和精简置备，但实际占用会增长。生产环境必须监控宿主机文件系统，而不是只看虚拟磁盘逻辑容量。

## 2. 转换与校验

```bash
qemu-img check --force-share <IMAGE>.qcow2
qemu-img convert -p -f qcow2 -O qcow2 <SRC>.qcow2 <DST>.qcow2
```

源映像正在被虚拟机使用时不要直接转换或复制；先关机，或使用存储后端提供的一致性快照。

## 3. 扩容流程

```bash
qemu-img resize <IMAGE>.qcow2 +20G
```

这只扩大虚拟磁盘，不会自动扩大客户机分区、LVM 或文件系统。客户机内还需按分区表、PV/LV 和文件系统类型完成扩容并验证。

## 4. 快照边界

快照适合短期变更保护，不等于备份。长时间保留会形成复杂的 backing chain 并影响 IO。变更完成并验证后及时合并或删除，并保留真正独立的备份。
