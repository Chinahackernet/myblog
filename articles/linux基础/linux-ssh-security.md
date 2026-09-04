# SSH 安全与访问控制

## 访问模型

SSH 是运维控制面，应通过堡垒机、短时凭据、MFA 和最小权限访问。个人账户对应个人公钥，禁止共享私钥；密钥泄漏、离职或项目结束时立即撤销。

```text
用户 → MFA/堡垒机 → 目标主机 sshd → sudo → 具体操作
```

## sshd 基线

```conf
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
AllowGroups opsadmin
MaxAuthTries 4
X11Forwarding no
```

变更前确保现有会话和备用管理通道；使用 `sshd -t` 校验后 reload，不要在唯一 SSH 会话中 restart。优先 Ed25519，私钥使用 passphrase 或硬件/代理保护。

集中记录登录主体、源地址、命令、sudo 授权和失败原因；自动化账号限制来源、命令和时间。暴力尝试先在堡垒机/防火墙限速和封禁，再保存日志；不要只把 `MaxStartups` 调大。

## 密钥轮换 Runbook

先生成新密钥并加入 authorized_keys，使用备用会话验证；再从堡垒机、CI、Ansible Vault 和旧主机清单中撤销旧密钥，最后检查仍在运行的 agent、cron 和隧道。任何轮换都要标记生效时间、负责人和回滚窗口，避免同时删除唯一可用凭据。

SSH 会话异常时区分认证失败、连接被防火墙丢弃、sshd 资源耗尽、PAM/LDAP 延迟和 shell 启动脚本阻塞。远程执行命令限制环境变量和 PATH，避免通过可写目录劫持程序；SFTP/端口转发按角色禁用。
