# Linux 启动流程与内核管理

## 生产升级门禁

内核升级前记录当前内核、启动参数、模块、加密盘、网络设备和第三方驱动；在 canary 节点完成重启和业务探针后再扩大批次。保留至少一个已验证的旧内核启动项，grub 配置变更需要有控制台或带外回退路径。

启动失败取证优先保存上一轮 journal、dmesg、initramfs 清单和 bootloader 配置。修复完成后验证磁盘、NTP、SSH、容器运行时和监控，不能只看到 login prompt 就结束。

## 启动链

固件 → bootloader → 内核/initramfs → systemd target → 服务依赖。启动故障应先判断停在哪一层，再选择串口、救援模式、上一内核或 chroot 修复。

```bash
bootctl status 2>/dev/null || grubby --default-kernel; uname -a; systemd-analyze time; systemd-analyze blame | head
```

内核参数按用途和风险分类，持久化写入 `/etc/sysctl.d/` 并记录来源。模块加载、网卡驱动、存储驱动和 CPU 漏洞缓解会影响性能与可用性；升级前在同型号节点做 canary。

启动失败先尝试上一内核，保存 `journalctl -b -1`、dmesg 和 bootloader 配置。initramfs 缺少根盘驱动时在救援环境重建；fstab 错误可修正 UUID 或临时使用救援挂载恢复启动。修复后重新验证加密盘、网络和 systemd 依赖。
