# 磁盘与 LVM 管理

## 设备识别

先用 WWN、序列号和云盘 ID 确认设备，禁止依赖 `/dev/sdX` 顺序。区分系统、日志、数据库和备份盘，按 IOPS、吞吐、延迟和故障域选择存储。

```bash
lsblk -o NAME,SIZE,TYPE,FSTYPE,MOUNTPOINTS,WWN; blkid; findmnt; pvs; vgs; lvs -a -o +devices
```

## LVM 变更

扩容顺序是底层设备→PV→VG→LV→文件系统。XFS 只能扩容不能缩容，ext4 缩容必须离线并先备份。使用 `-r` 前在相同发行版和文件系统版本测试。

```bash
pvcreate /dev/disk/by-id/wwn-0x...; vgextend vg_data /dev/disk/by-id/wwn-0x...; lvextend -r -L +100G /dev/vg_data/lv_app
```

LVM snapshot 只适合短期一致性窗口，空间耗尽会使快照失效；数据库应使用原生备份或存储快照协议。挂载失败先查 UUID、文件系统、权限和 dmesg；I/O 错误先隔离设备并保留现场，不要反复 fsck。

恢复前确认 LVM metadata、加密密钥、fstab、备份和应用停止顺序，恢复后校验文件 hash 和业务数据。

