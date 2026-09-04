# systemd 服务管理

## 单元与依赖

systemd 以 unit 描述服务、挂载、定时器和依赖。`After=`只表达顺序，`Requires=`/`Wants=`表达依赖；不要把所有服务都写成强依赖，否则可选组件故障会拖垮启动链。

```bash
systemctl cat nginx; systemctl list-dependencies nginx; systemd-analyze critical-chain; systemd-analyze verify /etc/systemd/system/app.service
```

## 生产服务单元

```ini
[Service]
User=app
Group=app
ExecStart=/opt/app/bin/server
Restart=on-failure
RestartSec=5s
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ReadWritePaths=/var/lib/app
```

配置服务账户、工作目录、资源限制、文件描述符和日志策略。`Restart=always` 可能制造重启风暴，应配合 StartLimit 和健康检查；应用要用退出码区分可重试与配置错误。

新增或修改 unit 后执行 `daemon-reload`、语法校验和状态验证，再 reload/restart。故障时查看退出码、环境、权限、依赖和 journal，不要只重复 restart。高风险定时器要有超时、并发锁、失败告警和磁盘保护。

