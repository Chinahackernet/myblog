# 磁盘与 LVM 管理 Runbook

## 识别设备

```bash
lsblk -o NAME,SIZE,FSTYPE,TYPE,MOUNTPOINTS
blkid
df -hT
```

设备名可能因重启或云平台变化，生产操作优先使用 UUID 或稳定路径，不要凭 `/dev/sdX` 猜测磁盘。

## LVM 扩容流程

```bash
sudo pvdisplay
sudo vgdisplay
sudo lvdisplay
sudo vgs
```

标准顺序是：确认新盘 → 创建 PV → 扩展 VG → 扩展 LV → 扩展文件系统。每一步都记录输出并确认目标卷。

```bash
sudo pvcreate /dev/<disk>
sudo vgextend <vg> /dev/<disk>
sudo lvextend -r -L +20G /dev/<vg>/<lv>
```

`-r` 会尝试同步扩展文件系统；执行前必须确认文件系统类型和剩余空间。

## 风险与回滚

`pvcreate`、`mkfs` 等命令可能破坏数据，严禁在未确认设备上执行。扩容通常不能简单反向回滚，因此变更前应完成备份并保留快照或云盘版本。
