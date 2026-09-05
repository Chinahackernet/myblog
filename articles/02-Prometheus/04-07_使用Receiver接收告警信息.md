# 使用Receiver接收告警信息

> 分类：Prometheus / 第4章：prometheus告警处理
> 原文：https://www.cuiliangblog.cn/detail/section/23397001
> 来源：崔亮的博客

---

1. 在Alertmanager中路由负责对告警信息进行分组匹配，并向告警接收器发送通知。告警接收器可以通过以下形式进行配置：

```yaml
receivers:
  - <receiver> ...
```

2. 每一个receiver具有一个全局唯一的名称，并且对应一个或者多个通知方式：

name:  <string>

email_configs:

  [ - <email_config>, ... ]

hipchat_configs:

  [ - <hipchat_config>, ... ]

pagerduty_configs:

  [ - <pagerduty_config>, ... ]

pushover_configs:

  [ - <pushover_config>, ... ]

slack_configs:

  [ - <slack_config>, ... ]

opsgenie_configs:

  [ - <opsgenie_config>, ... ]

webhook_configs:

  [ - <webhook_config>, ... ]

victorops_configs:

  [ - <victorops_config>, ... ]

3. 目前官方内置的第三方通知集成包括：邮件、 即时通讯软件（如Slack、Hipchat）、移动应用消息推送(如Pushover)和自动化运维工具（例如：Pagerduty、Opsgenie、Victorops）。Alertmanager的通知方式中还可以支持Webhook，通过这种方式开发者可以实现更多个性化的扩展支持。


