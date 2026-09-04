# Linux 主机初始化与安全基线

## 目标

主机初始化的结果应可复现、可审计、可回滚。基线不等于“关闭服务越多越安全”，而是明确系统用途、信任边界、补丁窗口、管理入口和最低资源要求。

## 1. 身份与补丁

创建个人管理员账户，禁止多人共用 root；使用 sudo 日志记录授权主体。启用发行版安全仓库、自动下载而非盲目自动重启，内核重启纳入维护窗口。

```bash
hostnamectl set-hostname ops-node-01
timedatectl set-timezone Asia/Shanghai
useradd -m -s /bin/bash opsadmin
usermod -aG wheel opsadmin
dnf updateinfo list security
```

时间同步是证书、日志、Kerberos 和集群选主的共同依赖，至少部署两个可信 NTP 源，并监控 offset 和同步状态。

## 2. 内核与网络基线

只启用业务需要的监听端口和内核模块；防火墙采用默认拒绝、按服务放行。校验反向路径过滤、IPv6 策略、转发开关和 conntrack 容量，避免把临时排障参数永久写入 sysctl。

```bash
ss -lntup
firewall-cmd --list-all
sysctl -a | egrep 'ip_forward|rp_filter|nf_conntrack_max'
```

## 3. 最小权限与审计

启用 SELinux/AppArmor，优先修复策略而不是直接切换为 permissive。审计规则覆盖 sudo、身份变化、服务配置、关键文件和登录来源；日志发送到独立、受限的集中系统。

## 验收清单

- [ ] 主机名、时区、NTP、DNS 和资产标签正确
- [ ] 管理账户、sudo、SSH 公钥和 root 策略已评审
- [ ] 补丁、内核、漏洞缓解和重启窗口已登记
- [ ] 监听端口、主机防火墙、SELinux 和审计策略有证据
- [ ] 基线脚本重复执行不会破坏业务配置

