# Shell 与文本处理：运维自动化基础

## 目标

Shell 脚本是连接系统工具和运维流程的胶水。专业脚本应具备严格错误处理、幂等性、输入校验、结构化日志、超时和可回滚动作，而不是把多条命令简单串联。

## 1. 安全脚本基线

```bash
#!/usr/bin/env bash
set -Eeuo pipefail
IFS=$'\n\t'
trap 'printf "ERROR line=%s status=%s\n" "$LINENO" "$?" >&2' ERR
```

不要对不可信输入直接执行 `eval`；路径参数用数组传递；临时文件用 `mktemp` 并设置权限；清理逻辑放在 `trap`。脚本重复执行前先检查目标状态，成功后再写标记。

## 2. 管道与数据

`grep`/`awk`/`sed` 适合结构稳定的文本，JSON/YAML 应使用 `jq`/`yq`，不要用正则解析嵌套数据。管道中任何一步失败都应能传递到最终退出码，避免“最后一条命令成功”掩盖前面的错误。

```bash
mapfile -t hosts < <(awk -F, 'NR>1 && $3=="prod" {print $1}' inventory.csv)
for host in "${hosts[@]}"; do ssh -- "$host" hostname; done
```

## 3. 幂等与验证

脚本执行前输出目标、环境和变更摘要；执行后输出实际变化、耗时和证据。删除、权限变更、磁盘操作和服务重启必须有 `--dry-run` 或确认开关。生产脚本通过 shellcheck、单元测试、临时环境和故障注入后才能发布。

