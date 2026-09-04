# SSH 安全与访问控制

## 目标

在保证可恢复登录的前提下，采用个人账号、密钥认证、最小权限和可审计策略。

## 变更前准备

保持一个已验证的 SSH 会话，并准备第二个会话测试。修改前备份配置：

```bash
sudo cp -a /etc/ssh/sshd_config /etc/ssh/sshd_config.bak.$(date +%F-%H%M)
sudo sshd -t
```

## 推荐检查项

```bash
sudo sshd -T | egrep 'permitrootlogin|passwordauthentication|pubkeyauthentication|allowusers|allowgroups'
```

优先关闭 root 直接登录，限制允许的用户或组，使用密钥认证。是否关闭密码登录要根据密钥分发和应急入口确认，不能盲目操作。

## 应用与验证

```bash
sudo sshd -t && sudo systemctl reload sshd
```

在新终端验证新账号、密钥、sudo 和应急账号均可用，再关闭旧会话。检查认证日志：

```bash
journalctl -u sshd --since '30 min ago' --no-pager
```

## 回滚

若新会话无法登录，使用已验证的旧会话恢复备份配置，运行 `sshd -t` 后 reload。不要在唯一远程会话中直接重启 SSH 服务。
