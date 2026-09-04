# systemd 服务管理 Runbook

## 适用范围

适用于使用 systemd 的 Debian、Ubuntu、RHEL、Rocky Linux 等发行版。目标是安全地查看、启动、停止和变更服务。

## 变更前检查

```bash
systemctl status <service> --no-pager
systemctl cat <service>
systemctl is-enabled <service>
```

确认服务名称、配置文件位置、依赖关系和当前状态。生产变更前应确认维护窗口与回滚方式。

## 标准操作

```bash
sudo systemctl daemon-reload
sudo systemctl restart <service>
sudo systemctl enable <service>
sudo systemctl enable --now <service>
```

修改 unit 文件后必须执行 `daemon-reload`。不确定配置是否正确时，优先使用 `reload`，避免不必要的连接中断。

## 启动失败定位

```bash
systemctl status <service> -l --no-pager
journalctl -u <service> -b --no-pager
systemctl show <service> -p ExecMainStatus,Result,FragmentPath
```

检查退出码、配置语法、权限、端口占用和依赖服务。修复后先 `start`，确认健康后再决定是否设置开机启动。

## 验证与回滚

```bash
systemctl is-active <service>
ss -lntup | grep <port>
curl -fsS http://127.0.0.1:<port>/health
```

回滚时恢复已备份的 unit 或配置文件，执行 `daemon-reload` 后重启，并重新执行健康检查。
