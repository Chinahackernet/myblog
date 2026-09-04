# Keepalived 脑裂防护、通知脚本与故障演练

## 1. VRRP 状态机

VRRP 通过优先级和抢占决定 VIP 归属；健康检查失败时实例降权。`nopreempt` 适合避免网络抖动后立即抢回业务，但必须有明确的恢复流程。VRRP 只保证 VIP，不保证应用数据一致性。

```conf
vrrp_script chk_gateway { script "/usr/local/sbin/check-gateway" interval 2 weight -30 fall 3 rise 5 }
vrrp_instance VI_1 {
  state BACKUP; interface eth0; virtual_router_id 51; priority 120; advert_int 1; nopreempt
  authentication { auth_type PASS; auth_pass change-me }
  virtual_ipaddress { 198.51.100.10/24 }
  track_script { chk_gateway }
  notify /usr/local/sbin/notify-vrrp
}
```

脚本必须有超时、幂等和最小权限；不能因为 DNS 或一个短暂依赖失败就让 VIP 在两台主机间抖动。

## 2. 脑裂防护

脑裂来自 VRRP 报文隔离、二层环路、重复 VRID 或防火墙误拦。两台都认为自己 MASTER 时，必须通过交换机 MAC 漂移、探针、仲裁节点或 fencing 判定并隔离一方。禁止仅靠“重启 keepalived”解决，否则可能丢失现场。

## 3. 通知与审计

通知脚本记录旧/新状态、主机、原因、配置版本和时间，向告警系统发送一次事件；脚本失败不应阻塞状态机。日志中不得写入认证密钥。

## 4. 演练矩阵

分别断开主节点网卡、停止应用、阻断 VRRP、断开上游交换机、恢复主节点，记录 VIP 收敛、连接失败、ARP 学习和回切行为。验收包括“服务健康但 VIP 不在本机”和“VIP 在本机但服务不健康”两类反例。

## 回滚

配置变更先在备用节点 `keepalived -t` 校验；上线后观察一个完整探测周期。异常时恢复上一份配置、降低优先级并手动确认唯一 MASTER，再解除隔离。

## 生产脚本约束

健康脚本必须使用绝对路径、固定环境、超时和退出码；禁止调用会阻塞的网络命令或依赖未挂载的文件系统。脚本返回失败后，VRRP 至少连续 `fall` 次再降权，恢复至少连续 `rise` 次再加权，避免单次抖动触发切换。

通知脚本把状态事件写入结构化日志，并携带 `INSTANCE`、`STATE`、`PRIORITY` 和配置版本。告警系统要做去重，MASTER/BACKUP 变化与脑裂事件分开处理。脑裂期间先保证只有一台能够对外写入，再处理状态收敛。

演练应包含恢复主节点但设置低优先级的场景，确认 `nopreempt` 或抢占策略符合业务预期。回切之前比较两台的应用版本、连接数、数据位点和监控状态，不能因主机“恢复在线”就自动接管。
