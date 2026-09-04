# Zabbix Agent/Proxy、主动模式与容量告警

## 1. 架构

Server 保存配置和历史，Proxy 在分支网络采集并批量转发，Agent 负责主机指标。主动模式由 Agent 主动拉取任务，适合 NAT、间歇链路和大规模节点，但要求 TLS 身份和时间同步可靠。

## 2. Agent 基线

```ini
Server=10.0.0.10
ServerActive=zbx-proxy.example:10051
HostnameItem=system.hostname
TLSConnect=psk
TLSAccept=psk
```

使用 host metadata 自动注册，按环境/角色绑定模板。自定义脚本必须限制参数、超时和输出长度，禁止直接执行用户输入；低频项目采用 flexible interval，避免采集风暴。

## 3. 模板与容量

模板将 item、trigger、graph 和 discovery 版本化。容量告警看趋势而非单点：CPU steal、内存可回收量、磁盘 inode、数据库连接、队列长度和证书剩余天数分别设 warning/high/critical。

## 4. 通知与故障

邮件/短信/IM 通知应去重、抑制和升级，恢复消息必须包含影响时长。Proxy 队列堆积时检查链路、进程、数据库和时间；Server 恢复后要验证历史补传没有造成重复和延迟告警。

## 验收

安装一个主动 Agent、断网、恢复、触发自定义监控项和容量阈值，验证 TLS、自动注册、通知、维护窗口和审计记录。

## 主动模式与模板工程

主动 Agent 先向 Server/Proxy 请求待办，再按 `RefreshActiveChecks` 拉取任务；Hostname 必须稳定，否则会出现“无数据但机器在线”。Proxy 需要监控采集队列、数据发送延迟、缓存目录和数据库写入；分支网络断开时，Proxy 的本地保留时间必须覆盖最长链路中断窗口。

自定义模板通过低权限脚本读取 `/proc`、systemd 或应用管理接口，输出必须有明确单位和退出码。高基数 discovery 要设置过滤器和生命周期，否则节点、容器和临时卷会造成历史膨胀。趋势与预测项要标明样本窗口，避免把短时峰值当容量结论。

告警规则遵循“症状—原因—动作”格式，带上主机、服务、影响范围、最近变更和 runbook 链接。通知渠道故障时有备用升级路径，恢复告警必须能关闭原事件，避免值班人员重复处理。
