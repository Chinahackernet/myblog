# Linux 文件系统与挂载管理

## 容量门禁

容量阈值应分别为 warning、critical 和不可写保护，并按数据、inode、quota、快照和日志分类。扩容前确认应用是否支持在线变更；缩容和修复一律先在副本演练，不把生产卷当实验对象。

挂载参数进入版本管理，变更前保存 `findmnt`、fstab、设备 UUID 和应用打开文件。网络存储故障时优先保护数据一致性和应用超时，避免强制卸载造成更大损坏。

## 选择与容量

ext4、XFS、Btrfs 等文件系统在在线扩缩、校验、快照和恢复方面不同。容量规划同时考虑数据、元数据、日志、临时文件、inode 和保留空间；磁盘未满也可能因 inode 或 quota 耗尽而写失败。

```bash
findmnt -D; df -hT; df -ih; du -xhd1 /var | sort -h; xfs_info /dev/vg_data/lv_app 2>/dev/null
```

使用 UUID/WWN 写入 fstab，评估 `noexec`、`nodev`、`nosuid` 和 `noatime` 的兼容性。远程文件系统要配置超时、自动挂载和故障降级，避免网络存储阻塞系统启动。

I/O 错误先停止写入、保留 dmesg 和设备健康信息，再按备份/副本恢复。fsck、xfs_repair 和快照回滚都有破坏性风险，必须在卸载或临时副本上操作。恢复后校验应用数据和权限，不以“能挂载”作为唯一成功标准。
