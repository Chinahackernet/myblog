# Ansible/IaC、变更管理与配置治理

## 1. 声明式与幂等

IaC 描述期望状态，Ansible 负责配置收敛；模块必须幂等，敏感变量通过 Vault/外部 secret 注入。Inventory 按环境、区域、角色分层，避免把生产主机写死在 playbook。

```yaml
- hosts: web
  become: true
  serial: 10%
  roles: [nginx]
  pre_tasks:
    - ansible.builtin.assert: {that: "ansible_facts.os_family in ['RedHat','Debian']"}
```

## 2. 变更与漂移

所有变更有工单、影响评估、审批窗口、观测指标、回滚动作和执行人。先 `--check --diff`，再小批次执行；生产密码不能出现在 diff。定期扫描实际状态与 Git 期望状态的漂移，漂移修复要有原因记录。

## 3. 测试与发布

角色通过 lint、单元测试、临时环境和故障注入；大规模变更使用 canary、serial 和自动停止门禁。回滚不是简单反向脚本，必须验证服务版本、配置兼容和数据迁移。

## 验收

新主机从零收敛、重复执行无变化、权限最小、秘密不落盘、失败可中止且审计可追溯。

## 代码与状态治理

Terraform/OpenTofu state 使用远端加密后端、锁和版本保留；禁止多人在本地 state 上并发 apply。模块输入、输出和 provider 版本锁定，计划文件在审批后短期有效，避免计划与真实环境漂移。

Ansible 采用 check/diff、serial、max_fail_percentage 和 handler；对重启、分区、数据库迁移等高风险任务设置显式确认。Vault 变量在 stdout、diff、facts 和错误堆栈中都要屏蔽，执行账户只拥有目标资源的 sudo 权限。

漂移修复前先判定是手工热修、外部控制器还是代码缺陷。直接覆盖漂移可能抹掉事故缓解措施，应先把现场变更导入代码或记录豁免，再恢复收敛。
