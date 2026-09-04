# Linux 运维基础：从主机基线到生产应急

## 章节定位

本章建立后续虚拟化、容器、数据库和 Kubernetes 实验共用的主机能力。目标不是记住命令，而是形成“基线—观测—变更—验证—回滚”的闭环。示例以 Rocky Linux 9 与 Ubuntu 24.04 的共同能力为主；涉及 firewalld、SELinux、AppArmor 时，必须按发行版替换命令。

## 1. 主机初始化与安全基线

初始化前登记资产编号、环境（实验/预发/生产）、业务负责人、时区、网段、允许的管理源地址和回滚联系人。任何直接复制到生产的脚本都应先经过静态检查，禁止把密码、私钥、云厂商 Token 写入脚本或 Markdown。

```bash
hostnamectl set-hostname ops-node-01
timedatectl set-timezone Asia/Shanghai
dnf update -y                     # Ubuntu 使用 apt-get update && apt-get upgrade
dnf install -y vim bash-completion curl jq rsync lsof sysstat chrony audit
systemctl enable --now chronyd auditd sysstat
```

基线至少包括：关闭不需要的监听端口；root 仅用于救援；运维使用个人账号并通过 sudo 审计；SSH 禁止密码登录和 root 直登；启用时间同步、审计、主机级防火墙和强制访问控制；配置日志轮转和磁盘水位告警。验证基线时同时看配置与运行态：

```bash
ss -lntup
sudo nft list ruleset                 # 或 firewall-cmd --list-all
getenforce 2>/dev/null || aa-status
sudo ausearch -m USER_LOGIN -ts today
```

## 2. 日常巡检与证据采集

巡检分为四层：可用性（服务、端口、业务探针）、资源（CPU、内存、磁盘、网络）、一致性（时间、配置、复制位点）、安全（登录、权限、策略拒绝）。不要用“进程存在”代替业务可用性。

```bash
uptime; free -h; df -hT; df -ih
systemctl --failed
vmstat 1 5
iostat -xz 1 3
ip -s link; ss -s
journalctl -p warning..alert --since '-1 hour' --no-pager
```

巡检输出应带时间、主机名和命令版本，写入工单或对象存储。发现异常先保存证据，再修复：`dmesg -T`、`journalctl -b`、`sar -A`、`ss -tanp`、相关服务状态和最近变更记录缺一不可。

## 3. 网络、日志与故障定位

网络排障遵循分层路径：链路（`ip link`、交换机端口）→地址/路由（`ip addr`、`ip route get`）→解析（`resolvectl query`）→传输（`nc -vz`、`ss`）→协议（`curl -vk`、应用日志）→依赖（数据库、队列、DNS）。抓包前确认隐私边界和保存期限：

```bash
ip route get 10.20.0.15
dig +time=2 +tries=1 api.internal A
curl --connect-timeout 2 --max-time 5 -sv http://10.20.0.15:8080/health
sudo tcpdump -ni any host 10.20.0.15 and port 8080 -c 200 -w /tmp/health.pcap
```

日志定位先确定时间窗口和请求 ID，再按网关→应用→数据库顺序关联。`journalctl -u nginx --since ...`、`ausearch -m AVC`、`dmesg -T` 分别对应服务、访问控制和内核层证据。日志出现 `<!DOCTYPE html>`、连接被重置或超时，不要直接归因于缓存，应验证实际请求 URL、响应头、部署版本和静态文件是否命中。

## 4. systemd、进程与性能

生产服务单元应显式声明依赖、用户、工作目录、资源上限和退出策略。变更后执行 `systemd-analyze verify`，再 `daemon-reload`、重启、健康检查和回滚。

```bash
systemctl cat myservice
systemctl show myservice -p User,LimitNOFILE,Restart,After
systemd-analyze critical-chain
ps -eo pid,ppid,stat,ni,%cpu,%mem,cmd --sort=-%cpu | head
pidstat -dur -p ALL 1 5
```

性能分析先区分饱和与错误：CPU 看 run queue 和 steal；内存看 reclaim、swap、major fault；磁盘看 await、util、队列；网络看丢包、重传和 listen overflow。用 eBPF、perf 或 strace 前必须评估开销，并设置采样时长与输出脱敏。

## 5. 存储、LVM 与备份恢复

分区、文件系统和 LVM 扩容前确认设备序列号、挂载点、文件系统类型、备份可恢复性。典型在线扩容：

```bash
lsblk -o NAME,SIZE,FSTYPE,MOUNTPOINTS,UUID
pvdisplay; vgdisplay; lvdisplay
lvextend -r -L +20G /dev/vg_data/lv_app
```

备份策略按 RPO/RTO 设计：配置与小文件可用版本化快照；数据库必须有逻辑/物理备份、校验和、异地副本和定期恢复演练。备份成功不等于可恢复，至少每月做一次隔离环境恢复并记录恢复耗时、数据校验和、权限与 SELinux 上下文。

## 6. SSH 与权限控制

`sshd_config` 使用最小授权：`PermitRootLogin no`、`PasswordAuthentication no`、限制 `AllowGroups ops`，必要时通过跳板机和源地址白名单收敛入口。修改前保持一个已验证会话，使用 `sshd -t` 检查语法，确认新会话可以登录后再关闭旧会话。sudo 规则必须按命令和参数收敛，禁止无审计的 `NOPASSWD: ALL`。

## 7. 生产故障应急流程

1. 定义影响面：受影响租户、错误率、延迟、数据风险和开始时间。
2. 建立指挥角色：指挥、执行、记录、对外沟通分离。
3. 先止损：暂停发布、摘除异常节点、限流或降级；不在证据不足时批量重启。
4. 保留证据：指标、日志、进程、连接、变更 diff 和时间线。
5. 分层恢复：先恢复可用性，再修复根因；每一步都记录预期现象。
6. 业务验收：真实探针、关键写入/读取、队列积压和数据一致性全部通过。
7. 复盘改进：根因、触发条件、检测缺口、动作项、负责人和截止日期。

## 验收清单

- 新主机无未知监听端口，SSH 仅允许个人密钥登录。
- 时间偏差、磁盘 inode、水位、服务失败和策略拒绝都有告警。
- 能从客户端到服务端完成 DNS、TCP、TLS、应用四层验证。
- 至少恢复过一次文件和一次数据库备份，并记录 RTO/RPO。
- 任一高风险变更都有备份、健康探针、停止条件和回滚命令。

