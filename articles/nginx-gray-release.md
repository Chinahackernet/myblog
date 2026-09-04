# Nginx 配置灰度、TLS 续期与无损变更

## 1. 灰度原则

灰度是控制暴露面的实验，不是随机改配置。先定义分流键（租户、Header、Cookie、权重）、成功指标（错误率、P95、业务转化）和自动回退阈值。相同用户在窗口内应保持路由稳定，避免会话漂移。

```nginx
map $http_x_release $release_upstream { default stable; canary canary; }
upstream stable { server 10.0.0.11:8080; }
upstream canary { server 10.0.0.21:8080; }
```

更复杂的比例分流应交给服务网格或发布平台；Nginx 配置只做清晰、可审计的入口策略。

## 2. 无损发布

配置生成后执行 `nginx -t`、静态检查和差异评审，再 `systemctl reload nginx`。reload 会启动新 worker、等待旧 worker 排空；必须监控 worker 数、活动连接和 reload 错误。

```bash
nginx -T > /tmp/nginx-effective.conf; nginx -t; systemctl reload nginx
```

回滚要保留上一份完整生效配置，而不是只恢复修改行。若新 upstream 大量失败，先切回稳定 upstream，再恢复配置文件。

## 3. TLS 自动续期

证书续期流程应包括 ACME 账户权限、DNS/HTTP challenge、密钥文件权限、链完整性、过期告警和 reload 钩子。续期后用 `openssl s_client` 检查服务端实际发送的证书，不能只看文件时间。

## 4. 观测与审计

日志记录 request id、上游地址、状态、请求耗时、上游耗时和缓存状态；对 Authorization、Cookie 和个人数据脱敏。灰度期间按 stable/canary 分组看四类指标：流量、错误、延迟、资源。

## 验收

使用固定测试 Header 验证路由、断开 canary 验证回退、模拟证书续期、连续 reload 验证连接无损，记录每个步骤的时间和证据。

## 灰度控制表

| 阶段 | 流量 | 观察时间 | 自动停止 |
| --- | ---: | ---: | --- |
| 影子 | 0% 响应流量 | 15 分钟 | 解析错误、资源异常 |
| 小流量 | 1% | 30 分钟 | 5xx 或 P99 超基线 20% |
| 扩大 | 10%→50% | 每阶段 30 分钟 | 业务指标下降、连接排队 |
| 全量 | 100% | 1 小时 | 任一关键 SLO 违反 |

分流键必须可复现并写入日志。灰度配置、证书、upstream 和 map 的变更应一起做静态检查；只修改一个配置片段而忘记同步证书链，是最常见的“语法正确但上线失败”。

自动化续期脚本应在 reload 前检查证书 CN/SAN、有效期、链完整性和私钥权限，reload 后再从公网探测实际证书。失败时保留旧证书，不要删除最后一份可用证书。
