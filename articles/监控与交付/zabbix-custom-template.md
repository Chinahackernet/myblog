# Zabbix 自定义模板、脚本与通知

## 模板设计

模板按角色拆分 item、trigger、graph、discovery 和宏；指标命名、单位、历史/趋势保留期统一。高基数 discovery 设置过滤器和生命周期，避免临时容器产生无限历史。

## 自定义监控

脚本以低权限运行，参数白名单、超时、输出长度和退出码固定；应用检查返回数值与文本时分开设计。监控端口/进程要区分“监听存在”和“业务可用”，URL 检查应验证状态码、关键字段和响应时间。

```bash
zabbix_get -s 10.0.0.21 -k app.ready; zabbix_sender -z zbx.example -s app-01 -k app.deploy.version -o "$GIT_SHA"
```

通知包含影响、主机、最近变更、runbook 和恢复条件；邮件、短信和 IM 做去重/升级，维护窗口不能吞掉真正的 P1。

