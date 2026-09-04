# Linux 防火墙与 SELinux/AppArmor

## 规则发布

规则按服务和信任区域管理，临时放行写入变更系统并设置到期时间。保存发布前后的完整规则集和计数器，先验证管理通道与回程流量，再验证业务端口；不要在生产使用“允许全部”排障。

SELinux 拒绝时先核对进程域、文件上下文、端口类型和最近变更，再修复标签或最小策略。策略上线后做拒绝日志监控和回滚演练，避免长期依赖 permissive 模式。

## 网络控制面

firewalld/nftables 规则按区域、接口、来源、目的和服务声明；默认拒绝，临时规则设置过期时间。规则变更先导出当前状态，再验证管理通道、DNS、NTP、监控和业务端口。

```bash
firewall-cmd --get-active-zones; firewall-cmd --list-all; nft list ruleset
```

SELinux 通过标签和策略限制进程，即使 Unix 权限允许也可能拒绝访问。先确认 enforcing 状态、上下文和 AVC，再用 `audit2why` 理解原因；不要直接生成宽泛的 `audit2allow` 策略。

```bash
getenforce; ls -Z /srv/app; ausearch -m AVC -ts recent; restorecon -Rv /srv/app
```

自定义策略进入版本管理。AppArmor 同理按 profile 限制路径和能力。分别从管理网、业务网和非授权网段验证允许/拒绝；异常时恢复上一份规则/策略并保留拒绝证据。
