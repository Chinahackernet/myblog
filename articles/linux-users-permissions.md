# Linux 用户、权限与 ACL

## 身份模型

用户、组、UID/GID、sudo 和文件 ACL 共同决定访问控制。服务使用专用系统账户，不共享登录 Shell；个人运维使用个人账户，通过 sudo 执行受控命令。

```bash
id app; getent passwd app; getent group opsadmin; namei -l /srv/app/config.yaml
```

目录执行位决定遍历，文件读写位决定内容访问；setgid 目录用于团队共享，sticky bit 限制目录内删除。SUID/SGID 文件要定期清单化并解释业务必要性。

```bash
install -o app -g app -m 0640 app.conf /etc/app/app.conf; find / -xdev -perm /6000 -type f -ls 2>/dev/null
```

ACL 用于补充而不是替代组模型；默认 ACL 会影响新建文件。sudoers 使用 `visudo`，按命令、参数和目标主机限制，禁止把任意 Shell 包装器授予 NOPASSWD。离职、密钥泄漏和服务下线要同时撤销账户、组、SSH key、token、sudo 和定时任务。

