# 第 5 章 Shell 与 Python 自动化

> **定位**：让重复性运维工作从「手动跑」升级为「自动跑、安心跑、可回滚跑」。
> 本章是课程第一阶段（系统基石）和第三阶段（自动化 IaC）之间的桥梁——你写的脚本会在第 6 章被 Ansible 承接，第 7 章的容器会用到本章的巡检逻辑，最终在第 8 章的 GitOps 中持续运行。
>
> | 项 | 值 |
> |---|---|
> | 周次 | 第 8～9 周 |
> | 建议学时 | 16～20 小时（讲解 5h / 实验 8h / 复盘 3h） |
> | 核心作品 | **多主机自动巡检器**：并发 SSH 多台主机，收集 CPU/磁盘/服务状态，生成 JSON + Markdown 双格式报告，异常时明确报警 |
> | 完成标准 | 能对 2～3 台实验机执行完整巡检，报告准确反映真实状态，某台主机离线时脚本不卡死、报告不缺失，重复运行不影响远端状态 |

**学习目标**

1. 理解 Bash 和 Python 各自的擅长场景，能正确选择工具；
2. 写出符合生产规范的 Bash 脚本（严格模式、参数解析、错误处理、幂等性）；
3. 用 Python `subprocess` 安全调用系统命令，用 `paramiko` 实现跨主机 SSH 操作；
4. 设计并实现一个**并发、容错、可配置、可回滚**的多主机巡检器；
5. 用 `shellcheck`、`bash -x`、dry-run 验证脚本正确性；
6. 将脚本和配置纳入 Git 版本管理，并制定 cron 定时执行方案；
7. 完成至少 2 个故障演练（SSH 卡死、非零退出码），建立完整的日志证据链定位能力。

> [!WARNING]
> 本章涉及 SSH 网络操作、cron 定时任务、配置文件修改。所有脚本**只在你自己的实验虚拟机**中执行和调试。生产环境部署前，必须通过 dry-run 验证、用 `shellcheck` 静态检查、确认幂等性，并准备回滚方案。永远不要把含明文密码、私钥或真实 IP 的脚本提交到 Git。

---

## 1. 原理讲解

### 1.1 为何要自动化

运维工程师每天做的很多工作本质上是**重复性操作**：

- "帮我看看这 10 台机器的磁盘还剩多少"——手动 SSH 10 次，复制粘贴；
- "这台服务重启后要确认状态"——盯着屏幕等日志；
- "每天早上要看一遍异常日志"——机械重复，注意力下降。

自动化解决三个核心问题：

| 问题 | 手动操作 | 自动化 |
|---|---|---|
| **时间** | 每次手动执行耗时 | 一次编写，秒级执行 |
| **一致性** | 人会疲劳、走神、记错 | 每次行为完全一致 |
| **可审计** | "上次是谁改的？" | Git 日志 + 执行日志 |

> [!NOTE]
> 自动化不是"把手动做的事原封不动搬进脚本"，而是一次性把**边界情况、错误处理、回滚路径**都想清楚，然后用代码固定下来。好的自动化脚本比人工操作更保守、更谨慎。

### 1.2 Shell（Bash）适合什么

Bash 是 Linux 默认预装的解释器，擅长：

```text
# 强项
- 调用系统命令、管道拼接       # df -h | grep /data
- 文件批处理、文本变换         # sed/awk 处理日志
- 启动/停止服务、cron 任务     # systemctl restart nginx
- 快速一次性脚本（<100行）     # 写完用完就丢的那种
- 依赖极少，无额外安装         # 救援模式、容器 init 进程

# 弱项
- 复杂数据结构（JSON/数组要靠字符串hack）
- 并发控制（GNU parallel 是补丁，不是原生方案）
- 单元测试（bats 是第三方生态）
- 跨平台（Windows 上 Bash 依赖 Git Bash/WSL）
```

### 1.3 Python 适合什么

Python 生态丰富，适合：

```text
# 强项
- API 调用、JSON/YAML 处理      # requests + paramiko
- 并发（threading/asyncio）      # 多主机并发巡检
- 复杂业务逻辑、状态机           # 配置驱动的巡检流程
- 跨平台、一致行为               # Linux/Windows/macOS
- 异常处理更精细                 # try/except + 自定义异常类
- 依赖管理（pip/venv）           # 可复现环境

# 弱项
- 依赖安装（服务器上不一定有 pip）
- 启动稍慢（毫秒级，对运维脚本通常可接受）
- 语法复杂度略高（学习曲线）
```

### 1.4 选择决策树

```
任务类型
├── 调用 1~3 个系统命令，输出简单
│   └── Bash（最轻量）
├── 需要并发 SSH 多台、收集结构化数据
│   └── Python + paramiko
├── 需要调用 HTTP API / 处理 JSON
│   └── Python
├── 需要幂等配置管理（确保状态正确，不重复执行）
│   └── Ansible（比两者都强，见第 6 章）
└── 一次性救援、容器 init、无依赖环境
    └── Bash（无依赖优势明显）
```

> [!CAUTION]
> 避坑：不要因为"Python 更强大"就把所有脚本都写成 Python。一个 20 行的日志处理 Bash 脚本强行改写为 Python，需要安装依赖、跨平台解释器，结果反而更脆弱。Bash 和 Python 是互补关系，不是替代关系。

### 1.5 幂等性（Idempotency）

**幂等**：运行一次和运行 N 次，得到同一个结果。

```bash
# ❌ 非幂等：每次运行都会追加一行
echo "$(date)" >> /var/log/my-script.log

# ✅ 幂等：检查后再决定是否执行
if ! grep -qF "backup cron" /etc/crontab; then
    echo "0 2 * * * /usr/local/bin/backup.sh" >> /etc/crontab
fi
```

```python
# ❌ 非幂等：每次调用都创建用户（重复运行报 already exists）
import subprocess
subprocess.run(["useradd", "monitor"], check=True)

# ✅ 幂等：检查后再创建
import subprocess
result = subprocess.run(
    ["id", "-u", "monitor"],
    capture_output=True,
    text=True,
)
if result.returncode != 0:
    subprocess.run(["useradd", "--system", "--no-create-home", "monitor"], check=True)
```

### 1.6 错误处理与退出码哲学

Linux 约定：退出码 `0` = 成功，非 `0` = 失败。**脚本的退出码是给调用者（cron、CI、其他脚本）的契约。**

| 退出码 | 含义 | 场景 |
|---|---|---|
| `0` | 成功 | 巡检正常完成 |
| `1` | 一般错误 | 参数错误、文件不存在 |
| `2` | 误用（参数对但逻辑错） | 用法正确但执行失败 |
| `3` | 部分成功（多主机中部分失败） | 建议保留，给调用者判断 |
| `124` | 超时（timeout 命令生成） | 某主机 SSH 卡死 |
| `137` | 被 SIGKILL 杀掉 | 资源耗尽或手动中止 |
| `143` | 被 SIGTERM 终止 | 优雅关闭 |

> [!NOTE]
> 关键原则：**脚本对错误沉默，调用者就无从判断**。无论是 Bash 还是 Python，每个关键步骤都要判断退出码或捕获异常，并在日志中记录上下文（哪台主机、哪个命令、什么错误）。

Bash 退出码的常见坑：

```bash
# ❌ 坑：管道中任何一个命令失败，整体退出码可能仍是 0
set -euo pipefail   # 加上这个后管道中任何一步失败都会导致脚本退出
some_command | grep -q pattern   # 如果 grep 没找到，grep 返回 1，脚本会退出

# ✅ 正确：明确处理管道中每个步骤
set -euo pipefail
output=$(some_command) || true   # 允许这一步失败
if echo "$output" | grep -q pattern; then
    echo "found"
fi
```

---

## 2. 架构

### 2.1 多主机自动巡检器——ASCII 整体架构图

```text
┌─────────────────────────────────────────────────────────────────────────┐
│  控制机（你的笔记本或一台专用巡检服务器）                                   │
│                                                                           │
│   ┌─────────────────────────┐    ┌──────────────────────────────────┐   │
│   │  巡检脚本 (Bash 或 Python) │    │  主机清单 hosts.ini / hosts.yml  │   │
│   │                          │    │                                  │   │
│   │  ┌──────────────────┐   │    │  [web]                           │   │
│   │  │ 参数解析 + dry-run │   │    │  web01 ansible_host=192.168.56.21│   │
│   │  │ set -euo pipefail │   │    │  web02 ansible_host=192.168.56.22│   │
│   │  └────────┬─────────┘   │    │                                  │   │
│   │           │             │    │  [db]                            │   │
│   │  ┌────────▼─────────┐   │    │  db01 ansible_host=192.168.56.31 │   │
│   │  │  并发调度器        │   │    └──────────────────────────────────┘   │
│   │  │ (GNU parallel /   │   │                                           │
│   │  │  Python 线程池)    │   │    ┌──────────────────────────────────┐   │
│   │  └────────┬─────────┘   │    │  SSH 密钥（控制机→各节点免密）       │   │
│   │           │             │    │  ~/.ssh/id_ed25519（不提交 Git）     │   │
│   │  ┌────────▼─────────┐   │    └──────────────────────────────────┘   │
│   │  │ SSH 并发连接池    │   │                                           │
│   │  │ (paramiko / ssh)  │   │    ┌──────────────────────────────────┐   │
│   │  └──────┬──────┬────┘   │    │  执行日志（每次巡检的原始输出）      │   │
│   │         │      │        │    │  /var/log/inspection/YYYY-MM-DD/   │   │
│   └─────────┼──────┼────────┘    └──────────────────────────────────┘   │
│             │      │                                                  │
│  ┌──────────▼──────▼──────────┐    ┌──────────────┐    ┌──────────────┐│
│  │ SSH: 192.168.56.21 (web01) │    │ SSH: ...22   │    │ SSH: ...31   ││
│  │ 执行命令:                   │    │              │    │              ││
│  │  - uptime, free, df        │    │  同上结构     │    │  同上结构     ││
│  │  - systemctl list-units    │    │              │    │              ││
│  │  - ss -lntup               │    │              │    │              ││
│  │  - journalctl --since      │    │              │    │              ││
│  │  - openssl x509 -enddate   │    │              │    │              ││
│  └────────────┬───────────────┘    └──────┬───────┘    └──────┬───────┘│
│               │                            │                  │        │
│  ┌────────────▼────────────────────────────▼──────────────────▼──────┐ │
│  │                      结果汇总与报告生成                             │ │
│  │                                                              　　　│ │
│  │   JSON 报告（供其他系统消费）    +   Markdown 报告（供人阅读）    　 │ │
│  │                                                              　　　│ │
│  │   异常主机 → 标红/报警（钉钉/企业微信/Slack）                      　│ │
│  └────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 巡检数据流（Mermaid）

```mermaid
flowchart LR
    A([主机清单\nhosts.ini]) --> B[加载配置\n验证格式]
    B --> C[并发调度\n线程池/parallel]
    C --> D{SSH 连接\n逐主机执行}
    D -->|超时 30s| E[标记 TIMEOUT\n记录日志]
    D -->|连接成功| F[执行巡检命令集]
    F --> G[解析输出\n结构化数据]
    G --> H{阈值判断\nOK / WARN / CRIT}
    H -->|正常| I[写入 JSON\nresults.json]
    H -->|异常| J[写入 JSON\n并触发报警]
    I --> K[生成 Markdown\nreport.md]
    J --> K
    K --> L([留存日志\n/var/log/inspection])
    K --> M([归档 Git\n每次 commit])
```

### 2.3 脚本分层设计

```
multi_host_inspector/
├── hosts.ini              # 主机清单（IP、别名、SSH 用户、标签）
├── config.yaml            # 全局配置（超时、并发数、阈值、告警渠道）
├── inspect.sh             # Bash 版入口（参数解析 + dry-run + 主循环）
├── lib/
│   ├── ssh_utils.sh       # SSH 执行函数（带超时、统一错误处理）
│   ├── check_funcs.sh     # 各项巡检函数（CPU/内存/磁盘/服务/端口/日志）
│   └── report.sh          # JSON / Markdown 报告生成
├── inspect.py             # Python 版入口（argparse + 并发）
├── lib/
│   ├── ssh_client.py      # paramiko SSH 封装（带超时、重试）
│   ├── checks.py          # 巡检命令与解析逻辑
│   └── reporter.py        # JSON / Markdown 报告生成
├── requirements.txt       # Python 依赖（paramiko, pyyaml, requests）
└── test/
    └── mock_hosts.sh      # 模拟主机响应，用于本地测试
```

> [!NOTE]
> 本章同时提供 Bash 版和 Python 版。Bash 版适合学习原理、快速上手；Python 版适合生产环境（并发控制更精细、异常处理更丰富、可对接 API）。**最终交付物二选一即可**，建议优先 Python 版。

---

## 3. 部署——准备多台实验机

### 3.1 用 Multipass 起 2～3 台实验机

> 目标：有一台控制机（做巡检发起端）+ 2 台被巡检机（模拟真实集群）。

```powershell
# 在宿主机（Windows PowerShell / macOS Terminal）执行
# 检查 Multipass 版本和状态
multipass version
multipass list

# 1) 创建控制机（巡检发起端）
multipass launch 22.04 --name inspector-ctrl --cpus 2 --memory 3G --disk 15G

# 2) 创建两台被巡检机（模拟 web01 和 db01）
multipass launch 22.04 --name web01 --cpus 1 --memory 2G --disk 10G
multipass launch 22.04 --name db01  --cpus 1 --memory 2G --disk 10G

# 3) 查看 IP 地址（记录下来，后面要用）
multipass list

# 示例输出：
# Name          State    IPv4           Image
# inspector-ctrl Running  192.168.64.3   Ubuntu 22.04 LTS
# web01          Running  192.168.64.4   Ubuntu 22.04 LTS
# db01           Running  192.168.64.5   Ubuntu 22.04 LTS
```

> [!NOTE]
> 如果你使用 Rocky Linux 9 路线（VirtualBox/VMware），同样创建 3 台虚拟机：控制机、web01、db01。实验机的 SSH 默认端口为 22，用户名默认与你当前宿主机用户名一致（Ubuntu Multipass）或 `rocky`/`admin`（Rocky 安装时创建的用户）。

### 3.2 在控制机上安装必要工具

```bash
# 以下在控制机（inspector-ctrl）内执行
# 通过 multipass shell inspector-ctrl 进入

# 1) 更新软件包
sudo apt update && sudo apt install -y openssh-client net-tools curl

# 2) 安装 ShellCheck（静态检查工具，必装）
sudo apt install -y shellcheck

# 3) 安装 Python3 和 pip
sudo apt install -y python3 python3-pip python3-venv

# 4) 用 venv 创建独立 Python 环境（生产推荐做法）
python3 -m venv ~/venv/inspector
source ~/venv/inspector/bin/activate

# 5) 安装 Python 依赖
pip install --upgrade pip
pip install paramiko pyyaml requests

# 6) 生成 SSH 密钥（控制机用来免密登录其他主机）
ssh-keygen -t ed25519 -C "inspector@inspector-ctrl" -f ~/.ssh/id_ed25519 -N ""
chmod 600 ~/.ssh/id_ed25519

# 7) 查看控制机 IP（确认可被其他主机访问）
hostname -I
```

### 3.3 配置 SSH 免密登录（控制机 → 被巡检机）

```bash
# 以下在控制机（inspector-ctrl）内执行
# 将公钥推送到 web01 和 db01
# 注意：Multipass 默认用户是 ubuntu，密码为空，首次需要用密码或直接操作

WEB01_IP=$(multipass info web01 | grep IPv4 | awk '{print $2}')
DB01_IP=$(multipass info db01  | grep IPv4 | awk '{print $2}')

# 第一次推公钥需要输入 ubuntu 用户的密码（默认是 ubuntu）
ssh-copy-id -o PreferredAuthentications=password ubuntu@${WEB01_IP}
ssh-copy-id -o PreferredAuthentications=password ubuntu@${DB01_IP}

# 验证免密登录
ssh -o BatchMode=yes ubuntu@${WEB01_IP} 'hostname && uptime'
ssh -o BatchMode=yes ubuntu@${DB01_IP}  'hostname && uptime'
# 预期：成功执行，无密码提示
```

> [!CAUTION]
> 避坑：`ssh-copy-id` 默认用 `~/.ssh/id_rsa`，但我们生成的是 Ed25519 密钥。如果报"Permission denied (publickey)"，指定正确密钥文件：`ssh-copy-id -i ~/.ssh/id_ed25519.pub ubuntu@${WEB01_IP}`。另外，Multipass 的 SSH 默认监听在 NAT 网络的虚拟网桥 IP，不是 localhost 的 22。

### 3.4 在被巡检机上安装必要工具（让巡检命令有输出）

```bash
# 以下在控制机上批量操作 web01 和 db01
# 安装 sysstat（提供 iostat、mpstat）、net-tools（提供 ss）、htop
for host in web01 db01; do
    ip=$(multipass info $host | grep IPv4 | awk '{print $2}')
    ssh ubuntu@${ip} 'sudo apt update && sudo apt install -y sysstat net-tools curl openssl'
    echo "=== $host ready ==="
done
```

### 3.5 验证工具链就绪

```bash
# 控制机上逐一验证
shellcheck --version
python3 --version
ssh -V

# paramiko 导入测试
source ~/venv/inspector/bin/activate
python3 -c "import paramiko, yaml, requests; print('deps OK')"
```

---

## 4. 配置——完整可复制代码

### 4.1 主机清单文件（hosts.ini）

> 集中管理所有被巡检主机信息，脚本读取此文件而非硬编码 IP。

```ini
# hosts.ini — 多主机巡检器主机清单
# 格式：每段 [groupname] 定义一个主机组，hosts 列出组内主机
# 字段说明（用冒号分隔）：
#   第一列：主机别名（用于报告显示）
#   第二列：ansible_host（实际 IP 或主机名）
#   第三列：ansible_user（SSH 用户名）
#   第四列：可选标签（web, db, prod, lab，用逗号分隔）

[web]
web01 ansible_host=192.168.64.4 ansible_user=ubuntu tags=web,lab
web02 ansible_host=192.168.64.4 ansible_user=ubuntu tags=web,lab

[db]
db01 ansible_host=192.168.64.5 ansible_user=ubuntu tags=db,lab

[all:vars]
# 全局默认值（被具体主机字段覆盖）
ansible_port=22
ansible_connect_timeout=30
ansible_command_timeout=60
```

> [!NOTE]
> `hosts.ini` 格式与 Ansible 清单文件兼容。如果你的实验机 IP 不同，请替换为你实际的 IP。`web02` 这里故意和 `web01` 设成同一台（演示多别名指向同一主机，验证脚本不重复巡检）。

### 4.2 全局配置文件（config.yaml）

```yaml
# config.yaml — 多主机巡检器全局配置
# 版本：此文件随脚本纳入 Git 版本控制（不含密码）

inspector:
  version: "1.0.0"
  log_dir: "/var/log/inspection"
  report_dir: "./reports"

ssh:
  connect_timeout: 30      # SSH 连接超时（秒）
  command_timeout: 60      # 单个命令执行超时（秒）
  retry_times: 2           # 连接失败重试次数
  key_file: "~/.ssh/id_ed25519"

concurrency:
  max_workers: 10          # 最大并发 SSH 连接数
  # 注意：并发数不要超过 SSH 服务器的 MaxSessions 限制（默认 10）

thresholds:
  cpu_load_crit: 4.0       # CPU 负载 > 此值 → CRIT（假设 4 核机器）
  mem_usage_warn: 80       # 内存使用率 > 此值(%) → WARN
  mem_usage_crit: 95       # 内存使用率 > 此值(%) → CRIT
  disk_root_warn: 80       # 根分区使用率 > 此值(%) → WARN
  disk_root_crit: 95       # 根分区使用率 > 此值(%) → CRIT
  disk_inode_warn: 80      # inode 使用率 > 此值(%) → WARN
  cert_expiry_warn: 30     # 证书到期天数 < 此值 → WARN
  cert_expiry_crit: 7      # 证书到期天数 < 此值 → CRIT

alert:
  enabled: false           # 是否启用告警（实验环境先 false）
  # 启用时需配置以下字段（下一章 CI/CD 中对接钉钉/企业微信）
  webhook_url: ""
  mention_all: false

report:
  format: ["json", "markdown"]   # 输出格式
  json_indent: 2
  markdown_include_ok: false     # Markdown 报告是否包含正常项（省篇幅）
```

### 4.3 Bash 版——严格模式 + 参数解析 + 日志框架

```bash
#!/usr/bin/env bash
#===============================================================================
# multi_host_inspector.sh — 多主机自动巡检器（Bash 版）
# 功能：对多台主机并发执行 CPU/内存/磁盘/服务/端口/证书巡检，输出 JSON + Markdown
# 用法：
#   ./inspect.sh --hosts hosts.ini                  # 巡检所有主机
#   ./inspect.sh --hosts hosts.ini --group web      # 仅巡检 web 组
#   ./inspect.sh --hosts hosts.ini --dry-run        # 仅显示将执行的命令
#   ./inspect.sh --hosts hosts.ini --verbose        # 详细输出
#   ./inspect.sh --help                             # 显示帮助
# 作者：课程练习（实验环境）
#===============================================================================

# ------------------------- 严格模式（写在所有代码之前）-------------------------
set -Eeuo pipefail
# 解释：
#   -E：子 Shell 中 ERR 陷阱也生效
#   -e：任何命令返回非 0 立即退出（但注意管道，见下）
#   -u：使用未定义变量时报错
#   -o pipefail：管道中任何一步失败，整个管道返回失败码

# ------------------------- 全局变量（只读）------------------------------------
readonly SCRIPT_NAME="${0##*/}"
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly LOG_DIR="${LOG_DIR:-/tmp/inspection-$$}"
readonly DATE_TAG="$(date --iso-8601=seconds)"

# ------------------------- 默认参数 -----------------------------------------
DRY_RUN=false
VERBOSE=false
HOSTS_FILE=""
TARGET_GROUP=""
CONFIG_FILE="${SCRIPT_DIR}/config.yaml"

# ------------------------- 颜色输出 ------------------------------------------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ------------------------- 日志函数（统一输出格式）----------------------------
log() {
    local level=$1; shift
    local color=""
    case $level in
        INFO)  color=$BLUE ;;
        OK)    color=$GREEN ;;
        WARN)  color=$YELLOW ;;
        ERROR) color=$RED ;;
    esac
    printf '%s [%s] [%s] %s\n' \
        "$(date --iso-8601=seconds)" \
        "$SCRIPT_NAME" \
        "${color}${level}${NC}" \
        "$*" >&2
}

die() {
    log ERROR "$*"
    exit 1
}

# ------------------------- 帮助信息 ------------------------------------------
usage() {
    cat <<EOF
用法: $SCRIPT_NAME [选项]

选项:
  -h, --hosts FILE      主机清单文件（必填）
  -g, --group NAME      仅巡检指定主机组（如 web, db）
  -c, --config FILE     配置文件路径（默认: ./config.yaml）
  -d, --dry-run         仅显示将执行的命令，不实际执行
  -v, --verbose         详细输出
  --help                显示此帮助

示例:
  $SCRIPT_NAME --hosts hosts.ini
  $SCRIPT_NAME -h hosts.ini -g web --dry-run
EOF
}

# ------------------------- 参数解析 ------------------------------------------
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--hosts)
            HOSTS_FILE="$2"; shift 2 ;;
        -g|--group)
            TARGET_GROUP="$2"; shift 2 ;;
        -c|--config)
            CONFIG_FILE="$2"; shift 2 ;;
        -d|--dry-run)
            DRY_RUN=true; shift ;;
        -v|--verbose)
            VERBOSE=true; shift ;;
        --help)
            usage; exit 0 ;;
        -*)
            die "未知选项: $1（使用 --help 查看帮助）" ;;
        *)
            die "多余参数: $1（使用 --help 查看帮助）" ;;
    esac
done

# ------------------------- 参数校验 ------------------------------------------
[[ -n "$HOSTS_FILE" ]] || die "缺少 --hosts 参数（使用 --help 查看帮助）"
[[ -f "$HOSTS_FILE" ]] || die "主机清单文件不存在: $HOSTS_FILE"
[[ -f "$CONFIG_FILE" ]] || log WARN "配置文件不存在，将使用默认值: $CONFIG_FILE"

# ------------------------- 创建临时目录（trap 清理）---------------------------
mkdir -p "$LOG_DIR"
trap 'log INFO "清理临时目录: $LOG_DIR"; rm -rf -- "$LOG_DIR"' EXIT
trap 'die "line $LINENO 发生错误，脚本退出"' ERR

# ------------------------- 辅助函数：读取配置 --------------------------------
# 简单的 YAML 解析（不依赖外部工具，纯 Bash 实现关键字段读取）
get_yaml_val() {
    local key=$1; local file=$2
    # 匹配 "key: value" 或 "key: value # 注释" 格式
    grep -E "^[[:space:]]*${key}[[:space:]]*:" "$file" 2>/dev/null \
        | head -n1 \
        | sed 's/.*:[[:space:]]*//' \
        | sed 's/[[:space:]]*#.*//' \
        | tr -d '"'"'"'" \
        | xargs
}

# ------------------------- 辅助函数：解析 hosts.ini --------------------------
# 读取主机清单，返回符合条件的 IP 列表（每行一个）
parse_hosts() {
    local group=${1:-}
    local in_section=false
    local section_name=""

    while IFS= read -r line; do
        # 跳过空行和注释行
        [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue

        # 检测段头 [sectionname]
        if [[ "$line" =~ ^\[([a-zA-Z0-9_:-]+)\] ]]; then
            section_name="${BASH_REMATCH[1]}"
            # 检查是否是 all:vars（全局变量段，不选主机）
            [[ "$section_name" == "all:vars" ]] && in_section=false || in_section=true
            # 如果指定了组，只有匹配的组才选主机
            if [[ -n "$group" && "$section_name" != "$group" && "$section_name" != "all:vars" ]]; then
                in_section=false
            fi
        elif [[ "$in_section" == "true" && "$line" =~ ^[[:space:]]*[a-zA-Z0-9_:-]+\ + ]]; then
            # 主机行，提取 ansible_host
            local host_alias ansible_host ansible_user
            host_alias=$(echo "$line" | awk '{print $1}')
            ansible_host=$(echo "$line" | grep -oP 'ansible_host=\K[^ ]+' || echo "")
            ansible_user=$(echo "$line" | grep -oP 'ansible_user=\K[^ ]+' || echo "ubuntu")
            [[ -n "$ansible_host" ]] && echo "${ansible_host}:${ansible_user}:${host_alias}"
        fi
    done < "$HOSTS_FILE"
}

# ------------------------- 辅助函数：带超时的 SSH 执行 ----------------------
# 参数：主机IP 用户名 别名 命令
# 返回：stdout 内容（通过全局变量）
# 全局变量：SSH_EXIT_CODE（命令退出码） SSH_STDERR（错误信息）
ssh_exec() {
    local host=$1; local user=$2; local alias=$3; shift 3
    local cmd="$*"
    local timeout=$(get_yaml_val "ssh.command_timeout" "$CONFIG_FILE" 2>/dev/null || echo 60)
    local key_file=$(get_yaml_val "ssh.key_file" "$CONFIG_FILE" 2>/dev/null || echo "~/.ssh/id_ed25519")
    local output exit_code

    [[ "$VERBOSE" == "true" ]] && log INFO "[$alias] 执行: ${cmd:0:80}..."

    if [[ "$DRY_RUN" == "true" ]]; then
        log INFO "[DRY-RUN] $user@$host: $cmd"
        SSH_EXIT_CODE=0
        SSH_STDERR=""
        return 0
    fi

    # 使用 timeout 限制执行时间，防止 SSH 卡死
    output=$(timeout "$timeout" ssh \
        -o BatchMode=yes \
        -o StrictHostKeyChecking=no \
        -o UserKnownHostsFile=/dev/null \
        -o ConnectTimeout=10 \
        -i "$key_file" \
        "${user}@${host}" \
        "$cmd" 2>&1) || exit_code=$?

    SSH_EXIT_CODE=${exit_code:-0}
    SSH_STDERR="$output"

    if [[ $SSH_EXIT_CODE -eq 124 ]]; then
        SSH_STDERR="TIMEOUT after ${timeout}s"
    fi
}

# ------------------------- 巡检函数：CPU 负载 --------------------------------
check_cpu() {
    local host=$1; local user=$2; local alias=$3
    # uptime 输出最后一组三个数字是 1/5/15 分钟平均负载
    # 对于 4 核机器，负载 4.0 表示满载
    ssh_exec "$host" "$user" "$alias" \
        "awk '{print \$1\",\"\$2\",\"\$3}' /proc/loadavg"
    if [[ $SSH_EXIT_CODE -eq 0 ]]; then
        local load1 load5 load15
        load1=$(echo "$SSH_STDERR" | awk -F, '{print $1}')
        load5=$(echo "$SSH_STDERR" | awk -F, '{print $2}')
        load15=$(echo "$SSH_STDERR" | awk -F, '{print $3}')
        echo "load_1m=${load1} load_5m=${load5} load_15m=${load15}"
    else
        echo "cpu_status=ERROR msg=\"${SSH_STDERR}\""
    fi
}

# ------------------------- 巡检函数：内存使用率 --------------------------------
check_memory() {
    local host=$1; local user=$2; local alias=$3
    # free -m 输出：total used free shared buff/cache available
    ssh_exec "$host" "$user" "$alias" \
        "free | awk '/^Mem:/{printf \"total=%d used=%d free=%d pct=%d\",\$2,\$3,\$4,int(\$3/\$2*100)}'"
    if [[ $SSH_EXIT_CODE -eq 0 ]]; then
        echo "mem_info=${SSH_STDERR}"
    else
        echo "mem_status=ERROR msg=\"${SSH_STDERR}\""
    fi
}

# ------------------------- 巡检函数：磁盘使用率 --------------------------------
check_disk() {
    local host=$1; local user=$2; local alias=$3
    # df -h 输出：Filesystem Size Used Avail Use% Mounted on
    # 重点检查根分区和 /data（如果存在）
    ssh_exec "$host" "$user" "$alias" \
        "df -h | awk 'NR==1{next} /^\/dev/{
            split(\$5,a,\"%\");
            printf \"fs=%s size=%s used=%s avail=%s use_pct=%s mount=%s\n\",\$1,\$2,\$3,\$4,a[1],\$6
        }'"
    echo "disk_info=${SSH_STDERR}"
}

# ------------------------- 巡检函数：关键服务状态 -------------------------------
check_services() {
    local host=$1; local user=$2; local alias=$3
    # 检查 ssh, cron, rsyslog, nginx（如果装了）等服务
    ssh_exec "$host" "$user" "$alias" \
        "systemctl list-units --type=service --state=running --no-pager --no-legend \
         | awk '{print \$0}' \
         | grep -E '^(ssh|cron|rsyslog|nginx|apache2|httpd)' \
         | awk '{print \$1\",\"\$3}' \
         || echo \"no_monitored_services_found\""
    echo "services=${SSH_STDERR}"
}

# ------------------------- 巡检函数：监听端口 ---------------------------------
check_ports() {
    local host=$1; local user=$2; local alias=$3
    # ss -lntup：监听 TCP 端口（需要 root）
    # 这里用普通用户执行，只能看到部分端口
    ssh_exec "$host" "$user" "$alias" \
        "ss -lnt | awk 'NR==1{next} {split(\$4,a,\":\"); printf \"%s,\", a[length(a)]}' \
         | sed 's/,$//'"
    echo "listening_ports=${SSH_STDERR}"
}

# ------------------------- 巡检函数：近期错误日志 -------------------------------
check_logs() {
    local host=$1; local user=$2; local alias=$3
    # 取最近 30 分钟的 ERROR/CRIT 日志（systemd journal）
    ssh_exec "$host" "$user" "$alias" \
        "journalctl --since '30 minutes ago' --priority err --no-pager --no-hostname -q \
         | tail -n 20 \
         | sed 's/\x0/ /g' \
         | tr '\n' '|' \
         || echo \"no_recent_errors\""
    # 注意：sed 替换是为了让多行日志变成单行输出，便于 JSON 序列化
    echo "recent_errors=${SSH_STDERR}"
}

# ------------------------- 巡检函数：SSL 证书到期 -------------------------------
check_cert() {
    local host=$1; local user=$2; local alias=$3
    local cert_path=${1:-}  # 留空表示检查默认证书路径
    # 检查 /etc/ssl/certs/ssl-cert-snakeoil.pem（练习用占位证书）
    local cert_file="/etc/ssl/certs/ssl-cert-snakeoil.pem"
    ssh_exec "$host" "$user" "$alias" \
        "openssl x509 -in $cert_file -noout -enddate -issuer 2>/dev/null \
         && openssl x509 -in $cert_file -noout -enddate | cut -d= -f2 \
         || echo \"no_cert_found\""
    if [[ $SSH_EXIT_CODE -eq 0 && "$SSH_STDERR" != "no_cert_found" ]]; then
        # 计算到期天数
        local expiry_str
        expiry_str=$(echo "$SSH_STDERR" | xargs)
        local expiry_ts now_ts days_left
        expiry_ts=$(date -d "$expiry_str" +%s 2>/dev/null || echo 0)
        now_ts=$(date +%s)
        days_left=$(( (expiry_ts - now_ts) / 86400 ))
        echo "cert_days_left=${days_left} expiry=${expiry_str}"
    else
        echo "cert_status=NOT_FOUND"
    fi
}

# ------------------------- 主函数：巡检单台主机 --------------------------------
inspect_host() {
    local host=$1; local user=$2; local alias=$3
    local host_log="${LOG_DIR}/${alias}.log"

    log INFO "[$alias] 开始巡检 $host..."

    {
        echo "=== 巡检 $alias ($host) @ $(date --iso-8601=seconds) ==="
        echo "[CPU]" && check_cpu "$host" "$user" "$alias"
        echo "[MEM]" && check_memory "$host" "$user" "$alias"
        echo "[DISK]" && check_disk "$host" "$user" "$alias"
        echo "[SVC]" && check_services "$host" "$user" "$alias"
        echo "[PORT]" && check_ports "$host" "$user" "$alias"
        echo "[LOG]" && check_logs "$host" "$user" "$alias"
        echo "[CERT]" && check_cert "$host" "$user" "$alias"
        echo "=== 巡检完成 ==="
    } >> "$host_log"

    if [[ "$DRY_RUN" == "false" ]]; then
        log OK "[$alias] 巡检完成，结果写入 ${host_log}"
    fi
}

# ------------------------- 主函数：汇总报告 -----------------------------------
generate_reports() {
    local json_out="${LOG_DIR}/inspection_report.json"
    local md_out="${LOG_DIR}/inspection_report.md"

    log INFO "生成汇总报告..."

    # 生成 Markdown 报告
    cat > "$md_out" <<'EOF'
# 多主机巡检报告

| 主机 | 状态 | CPU Load | 内存% | 磁盘% | 错误日志 |
|------|------|----------|-------|-------|----------|
EOF

    # 遍历所有主机日志，解析并写入报告
    for log_file in "$LOG_DIR"/*.log; do
        [[ -f "$log_file" ]] || continue
        local alias hostname cpu mem disk errors
        alias=$(basename "$log_file" .log)

        # 简单解析：提取关键行
        cpu=$(grep '^\[CPU\]' "$log_file" -A1 | tail -n1 | grep -oP 'load_1m=\K[^ ]+' || echo "N/A")
        mem=$(grep '^\[MEM\]' "$log_file" -A1 | tail -n1 | grep -oP 'pct=\K[^ ]+' || echo "N/A")
        disk=$(grep '^\[DISK\]' "$log_file" -A1 | tail -n1 | awk '{print $3}' | tr -d 'use_pct=' | head -n1 || echo "N/A")
        errors=$(grep '^\[LOG\]' "$log_file" -A1 | tail -n1 | grep -v 'no_recent_errors' | wc -l)
        local status="✅ OK"
        [[ "$errors" -gt 0 ]] && status="⚠️ WARN"
        [[ "$cpu" == "N/A" ]] && status="❌ ERROR"

        echo "| $alias | $status | ${cpu} | ${mem}% | ${disk}% | $errors 条 |" >> "$md_out"
    done

    echo "" >> "$md_out"
    echo "_报告生成时间：$(date --iso-8601=seconds)_" >> "$md_out"

    # 生成 JSON 报告
    echo "{" > "$json_out"
    echo "  \"report_time\": \"$(date --iso-8601=seconds)\"," >> "$json_out"
    echo "  \"total_hosts\": $(ls -1 "$LOG_DIR"/*.log 2>/dev/null | wc -l)," >> "$json_out"
    echo "  \"hosts\": [" >> "$json_out"

    local first=true
    for log_file in "$LOG_DIR"/*.log; do
        [[ -f "$log_file" ]] || continue
        $first || echo "," >> "$json_out"
        first=false
        local alias
        alias=$(basename "$log_file" .log)
        # 简化：JSON 中直接嵌入原始日志行（生产环境建议用 jq 精确解析）
        local raw_content
        raw_content=$(cat "$log_file" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))')
        echo "    {\"alias\": \"$alias\", \"raw_log\": $raw_content}" >> "$json_out"
    done

    echo "  ]" >> "$json_out"
    echo "}" >> "$json_out"

    log OK "Markdown 报告: $md_out"
    log OK "JSON 报告: $json_out"
}

# ------------------------- 主函数 --------------------------------------------
main() {
    log INFO "========== 多主机巡检器启动 =========="
    log INFO "主机清单: $HOSTS_FILE"
    [[ -n "$TARGET_GROUP" ]] && log INFO "目标组: $TARGET_GROUP"
    [[ "$DRY_RUN" == "true" ]] && log WARN "DRY-RUN 模式：不会实际执行任何操作"

    # 解析主机列表
    mapfile -t HOSTS < <(parse_hosts "$TARGET_GROUP")
    if [[ ${#HOSTS[@]} -eq 0 ]]; then
        die "未找到任何主机（检查 --hosts 和 --group 参数）"
    fi
    log INFO "共找到 ${#HOSTS[@]} 台主机"

    # 串行巡检（生产环境建议用 GNU parallel 加速，见第 6 节）
    for host_line in "${HOSTS[@]}"; do
        IFS=':' read -r host_ip ssh_user alias <<< "$host_line"
        inspect_host "$host_ip" "$ssh_user" "$alias"
    done

    # 生成报告
    if [[ "$DRY_RUN" == "false" ]]; then
        generate_reports
        log INFO "========== 巡检完成 =========="
    else
        log INFO "========== DRY-RUN 结束（无实际变更）=========="
    fi
}

main "$@"
```

> [!NOTE]
> 以上是 Bash 版完整巡检器，复制到 `inspect.sh` 后执行 `chmod +x inspect.sh` 即可运行。Bash 版使用串行执行（每台主机依次巡检），第 6 节会演示如何用 `GNU parallel` 加速为并发。

### 4.4 Python 版——subprocess、paramiko、异常处理、配置读取

```python
#!/usr/bin/env python3
"""
multi_host_inspector.py — 多主机自动巡检器（Python 版）
功能：对多台主机并发执行 CPU/内存/磁盘/服务/端口/证书巡检，输出 JSON + Markdown
依赖：paramiko, pyyaml, requests（见 requirements.txt）
用法：
  python3 inspect.py --hosts hosts.ini
  python3 inspect.py --hosts hosts.ini --group web --dry-run
  python3 inspect.py --help
"""

from __future__ import annotations

import argparse
import concurrent.futures
import configparser
import json
import logging
import os
import subprocess
import sys
import time
from dataclasses import dataclass, field, asdict
from datetime import datetime
from pathlib import Path
from typing import Optional

import paramiko
import yaml

# ------------------------- 日志配置 ------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stderr)],
)
log = logging.getLogger(__name__)

# ------------------------- 数据结构 ------------------------------------------
@dataclass
class HostConfig:
    """单台主机的配置信息"""
    alias: str
    ip: str
    user: str
    tags: list[str] = field(default_factory=list)
    connect_timeout: int = 30
    command_timeout: int = 60


@dataclass
class CheckResult:
    """单台主机的巡检结果"""
    alias: str
    ip: str
    status: str = "OK"          # OK / WARN / CRIT / ERROR / TIMEOUT
    cpu_load: str = ""
    mem_pct: int = 0
    disk_pct: int = 0
    services: list[str] = field(default_factory=list)
    listening_ports: list[int] = field(default_factory=list)
    recent_errors: list[str] = field(default_factory=list)
    cert_days_left: Optional[int] = None
    error_message: str = ""
    raw_output: str = ""

    def to_dict(self) -> dict:
        return {
            "alias": self.alias,
            "ip": self.ip,
            "status": self.status,
            "cpu_load": self.cpu_load,
            "mem_pct": self.mem_pct,
            "disk_pct": self.disk_pct,
            "services": self.services,
            "listening_ports": self.listening_ports,
            "recent_errors": self.recent_errors,
            "cert_days_left": self.cert_days_left,
            "error_message": self.error_message,
        }


# ------------------------- SSH 客户端封装 ------------------------------------
class SSHClient:
    """paramiko SSH 封装：带超时、统一错误处理、SSH 代理支持"""

    def __init__(self, host: str, user: str, key_file: str,
                 connect_timeout: int = 30, command_timeout: int = 60):
        self.host = host
        self.user = user
        self.key_file = os.path.expanduser(key_file)
        self.connect_timeout = connect_timeout
        self.command_timeout = command_timeout
        self._client: Optional[paramiko.SSHClient] = None

    def connect_ssh(self) -> paramiko.SSHClient:
        """建立 SSH 连接（可复用于多命令执行）"""
        if self._client is not None:
            return self._client

        client = paramiko.SSHClient()
        client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

        try:
            client.connect(
                hostname=self.host,
                username=self.user,
                key_filename=self.key_file,
                timeout=self.connect_timeout,
                banner_timeout=self.connect_timeout,
                auth_timeout=self.connect_timeout,
            )
            self._client = client
            return client
        except paramiko.AuthenticationException as exc:
            raise RuntimeError(f"SSH 认证失败 [{self.host}]: {exc}") from exc
        except paramiko.SSHException as exc:
            raise RuntimeError(f"SSH 连接异常 [{self.host}]: {exc}") from exc
        except Exception as exc:
            raise RuntimeError(f"SSH 连接失败 [{self.host}]: {exc}") from exc

    def exec_command(self, cmd: str, timeout: Optional[int] = None) -> tuple[int, str, str]:
        """
        执行远程命令，返回 (exit_code, stdout, stderr)
        注意：paramiko 的 exec_command 不支持 shell 管道重定向，
              复杂命令建议用 bash -c "..." 包裹
        """
        timeout = timeout or self.command_timeout
        client = self.connect_ssh()

        try:
            stdin, stdout, stderr = client.exec_command(
                cmd,
                timeout=timeout,
                get_pty=False,
            )
            exit_code = stdout.channel.recv_exit_status()
            out = stdout.read().decode("utf-8", errors="replace").strip()
            err = stderr.read().decode("utf-8", errors="replace").strip()
            return exit_code, out, err
        except Exception as exc:
            raise RuntimeError(f"命令执行失败 [{self.host}] '{cmd[:50]}...': {exc}") from exc

    def close(self):
        """关闭 SSH 连接"""
        if self._client:
            self._client.close()
            self._client = None

    def __enter__(self):
        return self

    def __exit__(self, *args):
        self.close()


# ------------------------- 巡检函数集合 --------------------------------------
def check_cpu(ssh: SSHClient) -> str:
    """获取 CPU 负载"""
    _, out, _ = ssh.exec_command(
        "awk '{print $1\",\"$2\",\"$3}' /proc/loadavg"
    )
    return out or "N/A"


def check_memory(ssh: SSHClient) -> tuple[int, str]:
    """
    获取内存使用率
    返回: (使用率百分比, 原始输出)
    """
    _, out, _ = ssh.exec_command(
        "free | awk '/^Mem:/{printf \"%d\\n%s\", int($3/$2*100), $0}'"
    )
    if not out:
        return 0, "N/A"
    lines = out.split("\n", 1)
    try:
        pct = int(lines[0])
        raw = lines[1] if len(lines) > 1 else "N/A"
        return pct, raw
    except (ValueError, IndexError):
        return 0, out


def check_disk(ssh: SSHClient) -> tuple[int, str]:
    """获取根分区使用率最高的挂载点"""
    _, out, _ = ssh.exec_command(
        "df -h | awk '/^\\/dev/ && $6==\"/\" {print $5}' | tr -d '%'"
    )
    try:
        return int(out), out
    except ValueError:
        return 0, "N/A"


def check_services(ssh: SSHClient) -> list[str]:
    """获取运行中的关键服务列表"""
    _, out, _ = ssh.exec_command(
        "systemctl list-units --type=service --state=running --no-pager --no-legend "
        "| awk '{print $1}' | grep -E '^(ssh|cron|rsyslog|nginx|apache2|httpd)' || true"
    )
    return [s.strip() for s in out.split("\n") if s.strip()]


def check_ports(ssh: SSHClient) -> list[int]:
    """获取监听端口列表（仅 TCP）"""
    _, out, _ = ssh.exec_command(
        "ss -lnt | awk 'NR>1 {split($4,a,\":\"); print a[length(a)]}' | sort -n | uniq"
    )
    ports = []
    for line in out.split("\n"):
        line = line.strip()
        if line.isdigit():
            ports.append(int(line))
    return ports


def check_logs(ssh: SSHClient, minutes: int = 30) -> list[str]:
    """获取近期错误日志"""
    _, out, _ = ssh.exec_command(
        f"journalctl --since '{minutes} minutes ago' --priority err "
        f"--no-pager --no-hostname -q | tail -n 20 || true"
    )
    return [line.strip() for line in out.split("\n") if line.strip()]


def check_cert(ssh: SSHClient) -> Optional[int]:
    """检查 SSL 证书到期天数（返回天数，None 表示未找到）"""
    cert_paths = [
        "/etc/ssl/certs/ssl-cert-snakeoil.pem",
        "/etc/ssl/certs/server.crt",
    ]
    for cert_path in cert_paths:
        exit_code, out, err = ssh.exec_command(
            f"openssl x509 -in {cert_path} -noout -enddate 2>/dev/null || echo 'NOT_FOUND'"
        )
        if exit_code == 0 and "NOT_FOUND" not in out:
            try:
                # 解析 "notAfter=Aug  1 12:00:00 2035 GMT"
                date_str = out.split("=", 1)[1].strip()
                expiry_ts = time.mktime(
                    time.strptime(date_str, "%b  %d %H:%M:%S %Y %Z")
                )
                days_left = int((expiry_ts - time.time()) / 86400)
                return days_left
            except (ValueError, IndexError):
                pass
    return None


# ------------------------- 巡检单台主机（完整流程）----------------------------
def inspect_single_host(
    host: HostConfig,
    thresholds: dict,
    dry_run: bool = False,
) -> CheckResult:
    """
    对单台主机执行完整巡检
    关键设计：每台主机的巡检是独立的，一台失败不影响其他主机
    """
    result = CheckResult(alias=host.alias, ip=host.ip)

    if dry_run:
        log.info(f"[DRY-RUN] {host.alias} ({host.ip}): 跳过实际执行")
        result.status = "DRY_RUN"
        return result

    log.info(f"[{host.alias}] 开始巡检 {host.ip}...")

    try:
        with SSHClient(
            host=host.ip,
            user=host.user,
            key_file="~/.ssh/id_ed25519",
            connect_timeout=host.connect_timeout,
            command_timeout=host.command_timeout,
        ) as ssh:
            # 逐项巡检，每项独立 try/catch（单项失败不影响其他项）
            try:
                result.cpu_load = check_cpu(ssh)
            except Exception as exc:
                log.warning(f"[{host.alias}] CPU 巡检失败: {exc}")

            try:
                result.mem_pct, _ = check_memory(ssh)
                if result.mem_pct >= thresholds.get("mem_usage_crit", 95):
                    result.status = "CRIT"
                elif result.mem_pct >= thresholds.get("mem_usage_warn", 80):
                    if result.status == "OK":
                        result.status = "WARN"
            except Exception as exc:
                log.warning(f"[{host.alias}] 内存巡检失败: {exc}")

            try:
                result.disk_pct, _ = check_disk(ssh)
                if result.disk_pct >= thresholds.get("disk_root_crit", 95):
                    result.status = "CRIT"
                elif result.disk_pct >= thresholds.get("disk_root_warn", 80):
                    if result.status == "OK":
                        result.status = "WARN"
            except Exception as exc:
                log.warning(f"[{host.alias}] 磁盘巡检失败: {exc}")

            try:
                result.services = check_services(ssh)
            except Exception as exc:
                log.warning(f"[{host.alias}] 服务巡检失败: {exc}")

            try:
                result.listening_ports = check_ports(ssh)
            except Exception as exc:
                log.warning(f"[{host.alias}] 端口巡检失败: {exc}")

            try:
                errors = check_logs(ssh)
                result.recent_errors = errors
                if errors:
                    if result.status == "OK":
                        result.status = "WARN"
            except Exception as exc:
                log.warning(f"[{host.alias}] 日志巡检失败: {exc}")

            try:
                result.cert_days_left = check_cert(ssh)
                cert_warn = thresholds.get("cert_expiry_warn", 30)
                cert_crit = thresholds.get("cert_expiry_crit", 7)
                if result.cert_days_left is not None:
                    if result.cert_days_left <= cert_crit:
                        result.status = "CRIT"
                    elif result.cert_days_left <= cert_warn:
                        if result.status == "OK":
                            result.status = "WARN"
            except Exception as exc:
                log.warning(f"[{host.alias}] 证书巡检失败: {exc}")

        log.info(f"[{host.alias}] 巡检完成，状态: {result.status}")

    except RuntimeError as exc:
        # SSH 连接失败，不阻断整体流程
        error_msg = str(exc)
        if "TIMEOUT" in error_msg.upper() or "timed out" in error_msg.lower():
            result.status = "TIMEOUT"
        else:
            result.status = "ERROR"
        result.error_message = error_msg
        log.error(f"[{host.alias}] 巡检失败: {exc}")

    except Exception as exc:
        result.status = "ERROR"
        result.error_message = str(exc)
        log.error(f"[{host.alias}] 未知异常: {exc}", exc_info=True)

    return result


# ------------------------- 并发调度器 ----------------------------------------
def inspect_all_hosts(
    hosts: list[HostConfig],
    thresholds: dict,
    max_workers: int = 10,
    dry_run: bool = False,
) -> list[CheckResult]:
    """并发巡检所有主机（使用线程池，避免阻塞）"""

    if dry_run:
        for host in hosts:
            log.info(f"[DRY-RUN] {host.alias} ({host.ip})")
        return []

    log.info(f"启动并发巡检，最多 {max_workers} 个并发连接...")

    results: list[CheckResult] = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
        future_to_host = {
            executor.submit(inspect_single_host, host, thresholds, dry_run): host
            for host in hosts
        }

        for future in concurrent.futures.as_completed(future_to_host, timeout=300):
            host = future_to_host[future]
            try:
                result = future.result(timeout=host.command_timeout + 30)
                results.append(result)
            except concurrent.futures.TimeoutError:
                log.error(f"[{host.alias}] 巡检超时（超过限制）")
                results.append(CheckResult(
                    alias=host.alias, ip=host.ip,
                    status="TIMEOUT",
                    error_message="巡检超时",
                ))
            except Exception as exc:
                log.error(f"[{host.alias}] 巡检异常: {exc}")
                results.append(CheckResult(
                    alias=host.alias, ip=host.ip,
                    status="ERROR",
                    error_message=str(exc),
                ))

    return results


# ------------------------- 报告生成 ------------------------------------------
def generate_json_report(results: list[CheckResult], output_path: Path):
    """生成 JSON 格式报告（供其他系统消费）"""
    report = {
        "report_time": datetime.now().isoformat(),
        "total_hosts": len(results),
        "summary": {
            "OK": sum(1 for r in results if r.status == "OK"),
            "WARN": sum(1 for r in results if r.status == "WARN"),
            "CRIT": sum(1 for r in results if r.status == "CRIT"),
            "ERROR": sum(1 for r in results if r.status == "ERROR"),
            "TIMEOUT": sum(1 for r in results if r.status == "TIMEOUT"),
        },
        "hosts": [r.to_dict() for r in results],
    }
    output_path.write_text(
        json.dumps(report, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )
    log.info(f"JSON 报告已写入: {output_path}")


def generate_markdown_report(results: list[CheckResult], output_path: Path):
    """生成 Markdown 格式报告（供人阅读）"""
    lines = [
        "# 多主机自动巡检报告",
        "",
        f"**生成时间**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
        f"**主机总数**: {len(results)}",
        "",
        "## 汇总",
        "",
        "| 状态 | 数量 |",
        "|:---|---:(|",
    ]

    summary = {"OK": 0, "WARN": 0, "CRIT": 0, "ERROR": 0, "TIMEOUT": 0}
    for r in results:
        summary[r.status] = summary.get(r.status, 0) + 1
    for status, count in summary.items():
        if count > 0:
            icon = {"OK": "✅", "WARN": "⚠️", "CRIT": "🔴", "ERROR": "❌", "TIMEOUT": "⏱️"}.get(status, "❓")
            lines.append(f"| {icon} {status} | {count} |")

    lines.extend(["", "## 详细结果", "",
                  "| 主机 | IP | 状态 | CPU Load | 内存% | 磁盘% | 错误数 | 证书(天) |",
                  "|:---|:---|:---|:---|:---:|:---:|:---:|:---:|"])

    for r in results:
        icon = {"OK": "✅", "WARN": "⚠️", "CRIT": "🔴", "ERROR": "❌", "TIMEOUT": "⏱️"}.get(r.status, "❓")
        error_count = len(r.recent_errors)
        cert_info = str(r.cert_days_left) if r.cert_days_left is not None else "N/A"
        lines.append(
            f"| {r.alias} | {r.ip} | {icon} {r.status} | "
            f"{r.cpu_load} | {r.mem_pct}% | {r.disk_pct}% | {error_count} | {cert_info} |"
        )

    lines.extend(["", "## 错误详情（仅 WARN/CRIT/ERROR）", ""])
    for r in results:
        if r.status not in ("OK", "DRY_RUN") and r.error_message:
            lines.append(f"### {r.alias} ({r.ip})")
            lines.append(f"```\n{r.error_message}\n```")
            lines.append("")

    output_path.write_text("\n".join(lines), encoding="utf-8")
    log.info(f"Markdown 报告已写入: {output_path}")


# ------------------------- 配置加载 ------------------------------------------
def load_config(config_path: str) -> dict:
    """加载 YAML 配置文件，返回配置字典"""
    p = Path(config_path)
    if not p.exists():
        log.warning(f"配置文件不存在: {config_path}，使用默认配置")
        return {}

    with p.open(encoding="utf-8") as f:\n        return yaml.safe_load(f) or {}\n\n\ndef parse_hosts_ini(ini_path: str) -> list[HostConfig]:
    """解析 hosts.ini 格式的主机清单文件"""
    parser = configparser.ConfigParser()
    parser.read(ini_path, encoding="utf-8")

    hosts = []
    for section in parser.sections():
        if section == "all:vars":
            continue
        for alias in parser.options(section):
            host_dict = dict(parser.items(section, alias))
            hosts.append(HostConfig(
                alias=alias,
                ip=host_dict.get("ansible_host", ""),
                user=host_dict.get("ansible_user", "ubuntu"),
                tags=host_dict.get("tags", "").split(",") if host_dict.get("tags") else [],
                connect_timeout=int(host_dict.get("ansible_connect_timeout", 30)),
                command_timeout=int(host_dict.get("ansible_command_timeout", 60)),
            ))
    return hosts


# ------------------------- 主入口 --------------------------------------------
def main() -> int:
    parser = argparse.ArgumentParser(
        description="多主机自动巡检器（Python 版）",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例:
  %(prog)s --hosts hosts.ini                  # 巡检所有主机
  %(prog)s --hosts hosts.ini --group web      # 仅巡检 web 组
  %(prog)s --hosts hosts.ini --dry-run        # 仅显示将执行的命令
  %(prog)s --hosts hosts.ini --verbose        # 详细输出
        """,
    )
    parser.add_argument("-h", "--hosts", required=True,
                        help="主机清单文件（hosts.ini 格式）")
    parser.add_argument("-g", "--group",
                        help="仅巡检指定主机组（对应 hosts.ini 中的段名）")
    parser.add_argument("-c", "--config", default="config.yaml",
                        help="配置文件路径（默认: config.yaml）")
    parser.add_argument("-d", "--dry-run", action="store_true",
                        help="仅显示将执行的命令，不实际执行")
    parser.add_argument("-v", "--verbose", action="store_true",
                        help="详细输出")

    args = parser.parse_args()

    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)

    # 加载配置
    config = load_config(args.config)
    thresholds = config.get("thresholds", {})
    concurrency = config.get("concurrency", {})
    max_workers = concurrency.get("max_workers", 10)

    # 解析主机清单
    if not Path(args.hosts).exists():
        log.error(f"主机清单文件不存在: {args.hosts}")
        return 1

    all_hosts = parse_hosts_ini(args.hosts)

    # 按组过滤
    if args.group:
        all_hosts = [h for h in all_hosts if args.group in h.tags or args.group in h.alias]

    if not all_hosts:
        log.error(f"未找到任何主机（检查 --hosts 和 --group 参数）")
        return 1

    log.info(f"========== 多主机巡检器启动 ==========")
    log.info(f"主机清单: {args.hosts}")
    log.info(f"主机数量: {len(all_hosts)}")
    if args.dry_run:
        log.warning("DRY-RUN 模式：不会实际执行任何操作")

    # 执行巡检
    results = inspect_all_hosts(
        hosts=all_hosts,
        thresholds=thresholds,
        max_workers=max_workers,
        dry_run=args.dry_run,
    )

    # 生成报告（dry-run 模式不生成）
    if not args.dry_run and results:
        report_dir = Path(config.get("inspector", {}).get("report_dir", "./reports"))
        report_dir.mkdir(parents=True, exist_ok=True)

        date_tag = datetime.now().strftime("%Y-%m-%d_%H%M%S")
        generate_json_report(results, report_dir / f"inspection_{date_tag}.json")
        generate_markdown_report(results, report_dir / f"inspection_{date_tag}.md")

        # 汇总统计
        log.info("========== 巡检汇总 ==========")
        for status in ("OK", "WARN", "CRIT", "ERROR", "TIMEOUT"):
            count = sum(1 for r in results if r.status == status)
            if count > 0:
                log.info(f"  {status}: {count}")

        # 有异常时返回非零退出码（供 cron 判断是否告警）
        abnormal = sum(1 for r in results if r.status not in ("OK",))
        if abnormal > 0:
            log.warning(f"共 {abnormal} 台主机存在异常，请查看报告")
            return 2

    log.info("========== 巡检完成 ==========")
    return 0


if __name__ == "__main__":
    sys.exit(main())
```

### 4.5 cron 定时任务配置

```bash
# 在控制机上添加 cron 任务
# 建议用 root 或专用服务账户运行，避免权限问题

# 方式一：crontab -e 编辑（推荐，有语法检查）
sudo crontab -e

# 方式二：写到 /etc/cron.d/（更适合系统级任务，自动加载所有文件）
sudo tee /etc/cron.d/inspection <<'EOF'
# 多主机巡检器 — 每天早上 8:00 和晚上 20:00 执行
# 环境变量确保 Python venv 可用
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
INSPECTOR_HOME=/opt/inspection
PYTHON_BIN=/home/ubuntu/venv/inspector/bin/python3

# 每天 8:00 和 20:00 执行（排除系统维护窗口 2:00~6:00）
0 8,20 * * * ubuntu cd $INSPECTOR_HOME && $PYTHON_BIN inspect.py \
    --hosts $INSPECTOR_HOME/hosts.ini \
    --config $INSPECTOR_HOME/config.yaml \
    >> /var/log/inspection/cron.log 2>&1

# 报告超过 30 天自动清理（每周一凌晨 3:00）
0 3 * * 1 root find /opt/inspection/reports -name "inspection_*.json" -mtime +30 -delete
EOF

sudo chmod 644 /etc/cron.d/inspection
sudo systemctl reload cron   # 或 systemctl restart crond (Rocky)

# 验证 cron 任务是否加载
sudo crontab -l
sudo cat /etc/cron.d/inspection

# 手动触发一次测试（不用等 cron）
cd /opt/inspection && ~/venv/inspector/bin/python3 inspect.py \
    --hosts hosts.ini \
    --dry-run
```

> [!WARNING]
> cron 环境变量极度受限：`PATH`、`HOME`、`USER` 可能是最小集合，`PYTHONPATH`、`venv` 激活状态都不继承。**脚本中所有路径必须用绝对路径**，或在 cron 命令开头显式设置 `PYTHON_BIN` 等环境变量。这是 cron 脚本最常见的"手动跑没问题，cron 跑就挂"的根因。

---

## 5. 验证

### 5.1 ShellCheck 静态检查

> ShellCheck 是 Bash 脚本的 lint 工具，能发现大量常见错误（未引用变量、命令不存在、语义问题等）。

```bash
# 在控制机上对 Bash 版脚本执行静态检查
shellcheck -x inspect.sh

# 预期：SCxxxx 编号的警告/错误列表（如有），每个都有解释和修复建议
# -x：跟踪 source 的脚本（自动检查被 source 的 lib/*.sh 文件）
```

**常见 ShellCheck 错误及修复：**

| 错误编号 | 问题 | 修复 |
|---|---|---|
| SC2086 | 变量展开未加引号 | `"$var"` 而不是 `$var` |
| SC2166 | `[ -z $var ]` 中 `$var` 未加引号 | `[ -z "$var" ]` |
| SC2248 | printf 用单引号字面量 | printf 不用引号包裹变量 |
| SC2154 | 引用了未定义的变量 | 确认变量在使用前已赋值 |
| SC2310 | `set -e` 下 `grep -q` 可能触发退出 | `\|\| true` 或 `grep ... \|\| :` |

> [!NOTE]
> ShellCheck 不是银弹——它检查的是语法和常见 idiom，不能验证"业务逻辑是否正确"。真正验证还是要靠实际运行。

### 5.2 bash -x 调试（逐命令跟踪）

```bash
# -x：在执行前打印每条命令（展开后的形式），清楚看到变量值
bash -x inspect.sh --hosts hosts.ini --dry-run 2>&1 | head -n 50

# 输出示例：
# + set -Eeuo pipefail
# + readonly SCRIPT_NAME=inspect.sh
# + LOG_DIR=/tmp/inspection-12345
# + '[' -z hosts.ini ']'
# + '[' '!' -f hosts.ini ']'
# + die '缺少 --hosts 参数'
```

### 5.3 dry-run 模式验证

```bash
# dry-run 模式：打印将执行的命令，不实际改动任何东西
./inspect.sh --hosts hosts.ini --dry-run
# 或 Python 版
python3 inspect.py --hosts hosts.ini --dry-run

# 预期：输出每台主机将执行的巡检命令，无任何 SSH 连接
```

### 5.4 单主机验证（逐台确认）

```bash
# 仅对 web01 执行巡检，验证单台逻辑正确
./inspect.sh --hosts hosts.ini --group web --verbose
# 或 Python 版
python3 inspect.py --hosts hosts.ini --group web -v

# 预期：报告准确反映 web01 的真实状态
# 验证方法：手动 SSH 进去对比
WEB01_IP=$(multipass info web01 | grep IPv4 | awk '{print $2}')
ssh ubuntu@${WEB01_IP} 'uptime && free -h && df -h /'
```

### 5.5 多主机完整验证

```bash
# 对所有主机执行巡检（串行，先确认网络连通性）
python3 inspect.py --hosts hosts.ini

# 验证 JSON 报告内容
cat reports/inspection_*.json | python3 -m json.tool | head -n 30

# 验证 Markdown 报告
ls -lh reports/inspection_*.md
```

### 5.6 验收清单

- [ ] `shellcheck -x inspect.sh` 无 ERROR（WARN 可接受但应有注释说明）
- [ ] `bash -x inspect.sh --dry-run` 输出符合预期
- [ ] 单主机巡检结果与手动 SSH 验证一致
- [ ] 某台主机离线时，其他主机巡检不受影响（结果文件不缺失）
- [ ] JSON 报告可被 `python3 -m json.tool` 解析（无语法错误）
- [ ] Markdown 报告包含所有主机状态行
- [ ] cron 任务加载成功（`sudo systemctl status cron`）
- [ ] 脚本和配置已纳入 Git（`git log --oneline` 可见）

---

## 6. 性能——并发巡检、超时控制

### 6.1 Bash 版并发：用 GNU parallel

```bash
# 安装 GNU parallel（Ubuntu/Rocky 默认可能未装）
sudo apt install -y parallel   # Ubuntu
sudo dnf install -y parallel   # Rocky

# 将串行巡检改为并行（关键改动：--jobs 控制并发数）
export -a HOSTS_ARR   # 定义为全局数组
HOSTS_ARR=($(parse_hosts ""))   # 读取所有主机

# GNU parallel 执行：--jobs 0 表示无限并发（实际受 SSH MaxSessions 限制）
# 建议设 --jobs 10（与 SSH 默认 MaxSessions 一致）
echo "${HOSTS_ARR[@]}" | tr ' ' '\n' \
    | parallel -j 10 --colsep ':' \
        '{1} {2} {3}' inspect_host '{1}' '{2}' '{3}'

# 更安全的写法：限制并发数并记录输出
echo "${HOSTS_ARR[@]}" | tr ' ' '\n' \
    | parallel -j 5 --joblog /tmp/parallel.log \
        'inspect_host {1} {2} {3}' ::: "${HOSTS_ARR[@]}"
```

> [!NOTE]
> GNU parallel 的 `--joblog` 参数会记录每次执行的开始/结束时间、主机名、退出码——这是生产环境排查"哪台主机跑得慢"的宝贵数据。

### 6.2 Python 版并发：线程池（已有实现）

Python 版（第 4.4 节）已使用 `concurrent.futures.ThreadPoolExecutor` 实现并发，`max_workers` 可通过 `config.yaml` 配置。关键参数说明：

```python
# config.yaml 中配置
concurrency:
  max_workers: 10        # 最大同时 SSH 连接数（建议 ≤ SSH 服务器 MaxSessions）
  # SSH 服务器默认 MaxSessions=10，如果超过会报 "Connection limit"
```

### 6.3 超时控制（防止 SSH 卡死）

SSH 卡死是生产环境的常见问题，原因包括：

| 原因 | 现象 | 解决方案 |
|---|---|---|
| 目标主机网络不通 | SSH 一直卡在 TCP 三次握手 | `ConnectTimeout=10` 限制连接超时 |
| 主机 SSH 服务挂了 | TCP 连上了但无响应 | `ServerAliveInterval=15` 主动保活 |
| 命令在主机内执行很慢 | 连接成功但命令不返回 | `timeout 60 ssh ...` 命令级超时 |
| 主机负载极高（OOM） | SSH 进程被杀死 | 结合系统级 timeout |

```bash
# SSH 全局超时配置（~/.ssh/config，控制机侧）
# 在 ~/.ssh/config 中为实验机网段添加：
cat >> ~/.ssh/config <<'EOF'

# 实验机 SSH 超时配置（全局生效）
Host 192.168.64.*
    StrictHostKeyChecking no
    UserKnownHostsFile /dev/null
    ConnectTimeout 10
    ServerAliveInterval 15
    ServerAliveCountMax 3
    ConnectionAttempts 2
EOF

chmod 600 ~/.ssh/config
```

### 6.4 大输出处理

某些命令（如 `journalctl --since '30 minutes ago'`）可能输出巨大，处理方式：

```bash
# ✅ 方式一：限制行数（推荐）
journalctl --since '30 minutes ago' --priority err --no-pager | tail -n 50

# ✅ 方式二：用 timeout 限制时长
timeout 30 journalctl --since '30 minutes ago' --no-pager || true

# ✅ 方式三：Python 中逐行处理（避免一次性读入内存）
def check_logs(ssh: SSHClient, minutes: int = 30) -> list[str]:
    # paramiko exec_command 支持分块读取
    _, stdout, _ = ssh.exec_command(
        f"journalctl --since '{minutes} minutes ago' --priority err "
        f"--no-pager -q | tail -n 20",
        timeout=30,
    )
    # 分块读取，避免阻塞
    errors = []
    for line in iter(lambda: stdout.readline(), ""):
        if len(errors) >= 20:
            break
        line = line.strip()
        if line:
            errors.append(line)
    return errors
```

> [!CAUTION]
> 避坑：不要把 SSH 命令的输出直接 `cat` 到变量中——如果输出是 1GB 日志，你的脚本会 OOM。始终加行数限制或用 `tail`。

### 6.5 监控并发脚本自身的资源占用

```bash
# 巡检脚本运行期间，在另一终端监控
watch -n 5 'ps aux | grep -E "inspect|paramiko|ssh" | grep -v grep'

# 确认没有进程泄漏（脚本结束后所有 SSH 进程应退出）
ps -ef | grep ssh | grep -v grep | wc -l  # 期望：0
```

---

## 7. 故障——故障演练

> [!WARNING]
> 故障演练**只允许在实验虚拟机**中执行。开始前确认机器可重置。

### 7.1 演练 A：SSH 连接卡死（超时）

**场景**：某台被巡检机网络中断或 SSH 服务无响应，巡检脚本卡死不动，无法生成报告。

**制造故障**：

```bash
# 在控制机上，让脚本在 SSH 执行中"等待"（模拟网络延迟）
# 真实场景：目标机网络断开，或 SSH 服务 hang
# 这里用 iptables 模拟：让 web01 的 SSH 对控制机"半关闭"（丢弃响应包）

# 先查 web01 的 IP
WEB01_IP=$(multipass info web01 | grep IPv4 | awk '{print $2}')

# 在 web01 上（SSH 进去）模拟故障：放行 SYN 但丢弃 ACK（TCP 半开攻击）
# 注：实验环境用 iptables 模拟，实际网络故障更难定位
ssh ubuntu@${WEB01_IP} 'sudo iptables -I INPUT -s 192.168.64.0/24 -p tcp --dport 22 ! --syn -j DROP' 2>/dev/null || true
```

**观察现象**：

```bash
# 控制机上运行巡检，观察哪台卡住
timeout 40 python3 inspect.py --hosts hosts.ini --group web
# 预期：40 秒后超时，web01 显示 TIMEOUT，其他主机正常完成

# 或者用 bash 版（串行），观察卡在哪里
bash -x inspect.sh --hosts hosts.ini --group web 2>&1 | tail -n 20
# 预期：ssh_exec 函数卡在 timeout 命令中
```

**证据链定位**：

```bash
# 1) 确认卡住的是哪台主机（在控制机另开终端）
ps aux | grep ssh | grep web01

# 2) 检查超时后的错误信息（脚本日志）
cat /tmp/inspection-*/web01.log

# 3) 从卡住的主机侧验证（用 Multipass 控制台进去）
multipass shell web01
sudo iptables -L INPUT -n --line-numbers   # 查找是否有 DROP 规则
sudo iptables -D INPUT <规则号>            # 删除 DROP 规则，恢复网络

# 4) 验证修复后恢复正常
python3 inspect.py --hosts hosts.ini --group web
# 预期：web01 不再 TIMEOUT
```

**根本原因**：SSH 连接缺乏超时控制，或超时时间设置过长。

**修复方案**（已在脚本中实现）：

```python
# 1) paramiko 层面：设置 banner_timeout 和 auth_timeout
client.connect(
    hostname=self.host,
    timeout=self.connect_timeout,
    banner_timeout=self.connect_timeout,  # SSH 协议握手超时
    auth_timeout=self.connect_timeout,    # 认证超时
)

# 2) 命令执行层面：使用 timeout 命令
# Bash 版已在 ssh_exec 中用 `timeout 60 ssh ...` 实现
# Python 版 paramiko exec_command 传入 timeout 参数

# 3) 全局兜底：SSH config 中的 ConnectTimeout
```

**复盘记录模板**：

```text
【故障报告】
- 现象：巡检脚本在 web01 处卡死，40s 后报告 TIMEOUT
- 根因：web01 SSH 服务无响应，Bash timeout 60s 生效前已卡在连接阶段
- 定位证据：timeout 返回码 124；journalctl 日志中 paramiko 超时异常
- 修复：iptables -D INPUT 删除 DROP 规则
- 防止复发：脚本中增加 banner_timeout、SSH config ConnectTimeout=10、
           每台主机单独 try/catch，TIMEOUT 不阻断其他主机
- 影响范围：仅 web01 巡检失败，其他主机正常完成
- 复盘时间：2024-XX-XX
```

### 7.2 演练 B：命令返回非零退出码（误判为失败）

**场景**：某些主机上 `systemctl list-units` 命令返回非零（权限不足），导致整个巡检函数失败，但脚本没有正确处理。

**制造故障**：

```bash
# 在 db01 上限制 Ubuntu 用户的 systemd 权限（模拟权限不足）
DB01_IP=$(multipass info db01 | grep IPv4 | awk '{print $2}')
ssh ubuntu@${DB01_IP} \
    'sudo chmod 750 /run/systemd/private && echo "已限制 systemd 权限"'

# 验证：现在非 root 用户执行 systemctl 会报权限错误
ssh ubuntu@${DB01_IP} 'systemctl list-units --type=service --state=running --no-pager --no-legend'
# 预期：Authentication is required 或类似权限错误
```

**观察现象**：

```bash
# 运行 Python 版巡检（Python 版的 try/catch 会捕获错误并继续）
python3 inspect.py --hosts hosts.ini --group db -v
# 预期：db01 的 services 检查显示 []（空列表），但整体状态仍为 OK/WARN

# 运行 Bash 版巡检（需要检查是否有 || true 兜底）
bash -x inspect.sh --hosts hosts.ini --group db 2>&1 | grep -A3 "SVC"
# 预期：systemctl 命令返回非零，如果脚本有 set -e 可能会中断
```

**证据链定位**：

```bash
# 检查 Python 巡检的原始输出
cat reports/inspection_*.json | python3 -c \
    'import json,sys; d=json.load(sys.stdin); print(d["hosts"][0]["services"])'

# 预期：services = []（权限不足返回空列表，脚本正确处理）

# 检查 Bash 脚本在权限不足时的行为
bash -x inspect.sh --hosts hosts.ini --group db 2>&1 | grep -E "(ERR|exit|SVC)"
# 如果没有 || true 兜底：脚本在 systemctl 命令失败时会 ERR trap 退出
```

**根本原因**：Bash 脚本中 `set -e` 会在管道/子命令返回非零时退出，而 `ssh_exec` 函数的 `timeout ... ssh ...` 返回 124（超时）或其他退出码时，如果未做判断，直接赋值给 `SSH_EXIT_CODE` 后继续执行，但某些场景下 `set -e` 会在子函数中触发。

**修复方案**：

```bash
# Bash 版修复：在关键调用点加 || true 兜底（适用于已知可能失败的命令）
# 在 check_services 函数中：
ssh_exec "$host" "$user" "$alias" \
    "systemctl list-units --type=service --state=running --no-pager --no-legend \
     | awk '{print \$1}' | grep -E '^(ssh|cron|rsyslog)' \
     || echo 'PERMISSION_DENIED'"
# 这样即使 systemctl 权限不足，也返回 0 并输出提示信息

# Python 版：已有 try/catch 兜底，不需要修改
# 但可以改进：区分"权限不足"和"真的没有服务"
```

**复盘记录模板**：

```text
【故障报告】
- 现象：db01 的服务列表为空，报告"PERMISSION_DENIED"
- 根因：Ubuntu 普通用户无法直接访问 systemd 私有 socket（/run/systemd/private 权限 750）
- 定位证据：ssh 执行 systemctl 返回非零；Python 异常被捕获
- 修复：chmod 750 /run/systemd/private（生产中应给监控用户正确授权）
- 改进：脚本中增加 "PERMISSION_DENIED" 检测，服务列表为空时给出明确状态而非静默
- 影响范围：仅 db01 的服务列表无法获取，其他指标正常
```

---

## 8. 回滚

### 8.1 脚本版本管理（Git）

```bash
# 在控制机上初始化 Git 仓库（管理巡检脚本和配置）
cd /opt/inspection
git init
git config user.email "inspector@lab.local"
git config user.name "Inspector Bot"

# .gitignore：排除敏感文件和构建产物
cat > .gitignore <<'EOF'
__pycache__/
*.pyc
*.pyo
venv/
reports/
*.log
.git/
# 不提交 SSH 私钥！
*.pem
id_ed25519
id_rsa
hosts.ini        # 替换为你实际实验机的 IP（可选）
EOF

# 首次提交
git add .
git commit -m "feat: initial multi-host inspector skeleton

- Bash + Python 双版本实现
- hosts.ini 主机清单
- config.yaml 阈值配置
- 包含 CPU/内存/磁盘/服务/端口/日志/证书巡检
- 幂等设计：单主机失败不影响整体"

# 后续变更：改前 commit，改后有记录
git add -p   # 逐块选择变更（生产建议用 git add -p 做 code review）
git commit -m "fix: add timeout to SSH connect (resolve #3)"
git log --oneline
```

### 8.2 配置改前备份

```bash
# 任何修改主机清单、阈值、cron 配置前，先备份
cp hosts.ini hosts.ini.bak.$(date +%F_%H%M)
cp config.yaml config.yaml.bak.$(date +%F_%H%M)

# 回滚
cp hosts.ini.bak.2024-01-15_0800 hosts.ini
git checkout -- config.yaml    # 如果已纳入 git，用 git checkout 更方便
```

### 8.3 cron 任务的安全增删

```bash
# ❌ 危险做法：直接 crontab -e（可能意外改坏其他任务）
# ✅ 安全做法：在 /etc/cron.d/ 下管理（独立文件，易回滚）

# 增：添加新的 cron 任务
sudo tee /etc/cron.d/inspection <<'EOF'
0 8,20 * * * ubuntu /opt/inspection/venv/bin/python3 /opt/inspection/inspect.py \
    --hosts /opt/inspection/hosts.ini >> /var/log/inspection/cron.log 2>&1
EOF
sudo chmod 644 /etc/cron.d/inspection

# 查：确认 cron 任务已加载
sudo crontab -l
sudo cat /etc/cron.d/inspection

# 改：备份后再改
sudo cp /etc/cron.d/inspection /etc/cron.d/inspection.bak.$(date +%F)
sudoedit /etc/cron.d/inspection
sudo systemctl reload cron

# 删：删除 cron 任务（不执行巡检了）
sudo cp /etc/cron.d/inspection /etc/cron.d/inspection.bak.$(date +%F)
sudo rm /etc/cron.d/inspection
sudo systemctl reload cron
```

> [!NOTE]
> `/etc/cron.d/` 下文件的权限必须是 644 且属主 root，否则 cron 会忽略该文件。这是容易被忽略的"cron 任务加上了但不执行"的根因。

---

## 9. 灾备

### 9.1 巡检脚本与清单纳入 Git

```bash
# 完整灾备策略：
# 1) 脚本 + 配置 → Git 仓库（代码可回滚）
# 2) 执行日志 → 本地文件系统（历史数据可查）
# 3) 报告归档 → Git（作为 artifact 提交）
# 4) 私钥 + hosts.ini 实际 IP → 不提交 Git（用 .gitignore 排除）

# 报告归档：每次巡检后自动 commit 报告（可选）
python3 inspect.py --hosts hosts.ini && \
    git add reports/ && \
    git commit -m "chore: archive inspection report $(date +%F)" || true
```

### 9.2 执行日志集中留存

```bash
# 日志留存策略：按日期分目录，保留 90 天
LOG_BASE="/var/log/inspection"
mkdir -p "$LOG_BASE"

# 每次巡检前创建当日子目录（避免跨天混淆）
TODAY=$(date +%Y-%m-%d)
mkdir -p "$LOG_BASE/$TODAY"

# Python 脚本已实现：${LOG_DIR} 指向当天目录
# Bash 脚本通过 trap 自动清理，但实际执行日志留在 $LOG_DIR

# 验证日志目录（手动执行后检查）
ls -lh /tmp/inspection-*/   # Bash 版原始日志
ls -lh ./reports/            # Python 版报告
```

### 9.3 可重建控制机

```bash
# 控制机灾备的核心：从零重建控制机的步骤记录在 README.md
# 任何人 clone 仓库后，运行以下脚本即可重建控制机环境：

cat > bootstrap_inspector.sh <<'EOF'
#!/usr/bin/env bash
# 控制机初始化脚本：从零搭建巡检环境
set -euo pipefail

echo "=== 安装系统依赖 ==="
sudo apt update && sudo apt install -y \
    python3 python3-pip python3-venv shellcheck git net-tools curl

echo "=== 创建 Python 虚拟环境 ==="
python3 -m venv ~/venv/inspector
source ~/venv/inspector/bin/activate
pip install --upgrade pip paramiko pyyaml requests

echo "=== 生成 SSH 密钥 ==="
mkdir -p ~/.ssh
chmod 700 ~/.ssh
ssh-keygen -t ed25519 -C "inspector@auto" -f ~/.ssh/id_ed25519 -N ""

echo "=== 克隆配置仓库 ==="
# 替换为你实际的仓库地址
# git clone <repo_url> /opt/inspection

echo "=== 控制机初始化完成 ==="
echo "下一步："
echo "  1. 将公钥 ~/.ssh/id_ed25519.pub 添加到各被巡检机"
echo "  2. 修改 hosts.ini 为实际 IP"
echo "  3. 运行: python3 inspect.py --hosts hosts.ini --dry-run"
EOF

chmod +x bootstrap_inspector.sh
```

---

## 10. 安全

### 10.1 密钥管理（不在脚本硬编码密码）

```bash
# ❌ 绝对禁止：在脚本/配置中硬编码密码或私钥
# 错误示例：
PASSWORD="MySecret123"              # ❌ 明文密码
KEY_CONTENT="-----BEGIN RSA PRIVATE KEY-----"  # ❌ 私钥内容

# ✅ 正确做法：使用 SSH 密钥认证（密钥本身也要保护）
# 1) 私钥文件权限必须是 600（SSH 强制要求）
chmod 600 ~/.ssh/id_ed25519

# 2) 通过 SSH Agent 转发密钥（不需要把私钥复制到每台机器）
ssh-agent bash
ssh-add ~/.ssh/id_ed25519
# 巡检时通过 Agent 认证，不需要在远程机器存放私钥

# 3) Python paramiko 使用密钥文件路径（不内嵌内容）
client.connect(
    key_filename="/path/to/id_ed25519"  # 路径在配置文件中指定，不在代码中硬编码
)

# 4) 使用环境变量传递密钥路径（比文件路径更灵活）
export SSH_KEY_PATH="$HOME/.ssh/id_ed25519"
# 脚本中读取环境变量
key_file="${SSH_KEY_PATH:-$HOME/.ssh/id_ed25519}"
```

### 10.2 最小权限原则

```bash
# ❌ 避免：使用 root 用户执行巡检
# root 权限过大，脚本漏洞可能导致系统被攻陷

# ✅ 正确：使用专用低权限账户
# 1) 创建巡检专用账户
sudo useradd -r -s /sbin/nologin -d /var/lib/inspector -m inspector

# 2) 给巡检账户最小必要权限（只读系统信息，不需要写操作）
#    巡检脚本本质上是"只读"操作，不应修改远端状态
sudo tee /etc/sudoers.d/inspector <<'EOF'
inspector ALL=(root) NOPASSWD: /usr/bin/systemctl is-active *
inspector ALL=(root) NOPASSWD: /usr/bin/df, /usr/bin/free, /usr/bin/uptime
# 不要给 systemctl start/stop/restart（那是变更操作，不是巡检）
EOF
sudo chmod 0440 /etc/sudoers.d/inspector

# 3) Python 脚本中指定运行用户
# systemd service 文件中指定：
# User=inspector
# Group=inspector
```

### 10.3 SSH 代理与跳板机

```bash
# 场景：控制机不能直接 SSH 到目标机，需要通过跳板机
# 拓扑：控制机 → 跳板机(bastion) → 目标机

# SSH Config 配置跳板机（ProxyJump）
cat >> ~/.ssh/config <<'EOF'

# 跳板机配置
Host bastion
    HostName 203.0.113.10
    User ubuntu
    IdentityFile ~/.ssh/id_ed25519

# 通过跳板机访问目标机（自动复用跳板机连接）
Host 192.168.56.*
    ProxyJump bastion
    StrictHostKeyChecking no
    UserKnownHostsFile /dev/null
EOF

# Python paramiko 不直接支持 ProxyJump，但支持跳板机 SSH 隧道：
def create_tunneled_client(target_host, target_user,
                           bastion_host, bastion_user, key_file):
    bastion = paramiko.SSHClient()
    bastion.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    bastion.connect(
        hostname=bastion_host,
        username=bastion_user,
        key_filename=key_file,
    )
    # 建立 SSH 隧道：本地随机端口 → 目标机 22
    transport = bastion.get_transport()
    dest_addr = (target_host, 22)
    local_addr = ("127.0.0.1", 0)
    channel = transport.open_channel("direct-tcpip", dest_addr, local_addr)

    # 通过隧道连接目标机
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(
        hostname="127.0.0.1",
        port=channel.origin_port,
        username=target_user,
        sock=channel,
    )
    return client
```

### 10.4 日志中脱敏

> [!CAUTION]
> 巡检结果中可能包含 IP、主机名、用户名、错误信息。**严禁将这些信息提交到公开的 Git 仓库或发给第三方系统**。

```bash
# ❌ 不安全：直接打印可能含敏感信息的原始输出
echo "$SSH_STDERR" >> report.txt   # 错误信息中可能有 IP、路径

# ✅ 安全做法：脱敏后再记录
sanitize_log() {
    local input=$1
    # 替换 IP 地址（保留格式但不可识别）
    echo "$input" | sed -E \
        -e 's/[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}/XXX.XXX.XXX.XXX/g' \
        -e 's/[0-9a-f:]{10,}/HASH_TOKEN/g' \
        -e 's/(password|token|secret)=[^ ,;]*/\1=REDACTED/g'
}

# Python 中使用正则脱敏
import re

def sanitize(s: str) -> str:
    """脱敏 IP、密码、token"""
    s = re.sub(r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}', 'XXX.XXX.XXX.XXX', s)
    s = re.sub(r'(?i)(password|token|secret|key)\s*=\s*\S+', r'\1=REDACTED', s)
    return s
```

### 10.5 自动化脚本的"爆炸半径"

> 理解"爆炸半径"（blast radius）：脚本出错时最多影响多少资源。

| 脚本行为 | 爆炸半径 | 缓解措施 |
|---|---|---|
| 读主机清单文件并 SSH 执行 | 仅目标主机受影响 | 幂等设计、只读操作 |
| 修改远端文件（如 `/etc/hosts`） | 影响目标主机系统配置 | dry-run 模式、备份 |
| 删除文件 `rm -rf` | 可能清空目标目录 | 先 `find -print`，确认后再删 |
| `sudo` 无密码执行 | 脚本被攻破 ≈ root 权限 | 最小化 sudo 授权、用专用账户 |
| cron 自动执行 | 无人值守时持续运行 | 监控 cron 执行日志、告警 |

> [!WARNING]
> 每次写脚本时问自己：**如果脚本被恶意利用，最坏会怎样？** 如果答案是"删除所有数据"或"获取 root 权限"，重新设计脚本，只保留最小必要能力。

---

## 11. 自测题与参考答案

### 自测题

1. Bash 的 `set -euo pipefail` 分别控制什么？哪种情况会让脚本在"看起来正常"时意外退出？
2. 为什么巡检脚本适合用幂等设计？举一个幂等和一个非幂等的 Bash 操作例子。
3. `shellcheck -x` 和 `shellcheck` 不带 `-x` 有什么区别？什么时候必须加 `-x`？
4. `bash -x script.sh` 的 `-x` 参数打印的是什么？适合排查什么类型的问题？
5. Python paramiko 的 `exec_command` 默认**不支持** shell 管道重定向，为什么？怎么绕过？
6. `concurrent.futures.ThreadPoolExecutor` 的 `max_workers` 设太大有什么风险？建议值是多少？
7. SSH 连接卡死的常见原因有哪些？分别从"连接阶段"和"命令执行阶段"说明如何设置超时。
8. 为什么 cron 任务要用绝对路径？`$HOME` 和 `~` 在 cron 中可能是什么值？
9. 巡检脚本的"爆炸半径"指的是什么？举两个降低爆炸半径的具体措施。
10. 为什么要在日志中脱敏？IP 地址、主机名、错误信息中哪些需要脱敏？给出一个 Bash 脱敏命令示例。
11. 为什么说"某台主机失败不阻断全部巡检"是巡检脚本的核心设计要求？Python 和 Bash 分别如何实现？
12. 主机清单文件（hosts.ini）和配置文件（config.yaml）纳入 Git 版本管理时，有什么文件**不能**一起提交？
13. 什么情况下 Bash `set -e` 会在管道中产生意外行为？如何用 `set -o pipefail` 和显式 `|| true` 解决？
14. `journalctl --since '30 minutes ago'` 如果输出量巨大（如 1GB+ 日志）会导致什么问题？Python/Bash 分别如何处理？
15. 用自己的语言解释：为什么"好的自动化脚本比人工操作更保守、更谨慎"？举一个具体例子。

### 参考答案

1. **`-e`**：任何命令返回非零时立即退出；**`-u`**：使用未定义变量时报错；**`-o pipefail`**：管道中任何一步失败，整个管道返回失败码。
   **意外退出场景**：在 `set -e` 下，`some_command | grep -q pattern` 如果 `grep` 没找到匹配，`grep` 返回 1，导致整个脚本退出，即使 `some_command` 执行成功。

2. **幂等性**：运行一次和运行 N 次产生相同结果。
   - **幂等**：`if ! grep -qF "cron_entry" /etc/crontab; then echo "..." >> /etc/crontab; fi`（只添加一次）
   - **非幂等**：`echo "$(date)" >> /var/log/script.log`（每次都追加，无法回到初始状态）

3. **`-x`** 跟踪 `source`/`.` 引入的文件（自动检查 `lib/*.sh`）；不带 `-x` 只检查主脚本。如果脚本 `source lib/utils.sh`，必须加 `-x` 才能检查 `utils.sh` 中的问题。

4. **`bash -x`** 打印每条命令执行前的展开形式（变量已展开、管道已拆分），适合排查"变量值是什么"、"哪一步失败了"、"条件判断的分支是什么"这类逻辑问题。

5. paramiko 的 `exec_command` 执行的是单个命令，不会启动 shell 来解析管道符（如 `|`, `&&`, `>`）。绕过后：`exec_command("bash -c 'cmd1 | cmd2'")`，让 bash 做 shell 解释。

6. `max_workers` 设太大（远超 SSH 服务器的 MaxSessions 限制，默认 10）会导致部分 SSH 连接被服务器拒绝（"Connection limit"）。建议值：`max(1, min(cpu_cores * 2, SSH_MaxSessions))`，保守值 5～10。

7. **连接阶段卡死**：目标机网络不通或 SSH 服务未启动 → 设置 `ConnectTimeout=10` 和 `ServerAliveInterval=15`。**命令执行阶段卡死**：命令本身执行很慢（如大查询、数据库锁） → 设置命令级 `timeout 60` 或 paramiko `exec_command(timeout=60)`。

8. cron 运行时，`$HOME` 和 `~` 取决于系统默认值（通常是 `/root` 或 `/usr/sbin`），不一定等于你登录时的家目录。因此 `~/script.py` 在 cron 中可能找不到文件。**必须用绝对路径**：`/home/ubuntu/venv/inspector/bin/python3`。

9. **爆炸半径**：脚本出错时最多影响多少资源（几台机器、什么权限、能做什么操作）。**降低措施**：
   - 只读巡检，不在远端执行写操作（`rm -rf`、配置修改等）；
   - 使用低权限专用账户（非 root）执行 SSH 操作；
   - dry-run 模式验证命令；
   - 每台主机独立 try/catch，单台失败不影响整体。

10. 日志可能泄露内部 IP、主机名、业务路径、错误堆栈等情报，若日志外泄或提交到公开 Git，会给攻击者提供目标信息。
    **Bash 脱敏示例**：
    ```bash
    echo "$raw_log" | sed -E \
        -e 's/[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}/IP_REDACTED/g' \
        -e 's/(password|token)\s*=\s*[^ ,;)]*/\1=REDACTED/g'
    ```

11. 巡检的目的是"了解全局状态"，不能因为一台机器的网络问题导致运维人员完全看不到其他 99 台机器的状态。**Python 实现**：每台主机巡检在独立线程中，有 `try/except` 包裹，异常捕获后存入结果列表，主循环继续处理下一台。**Bash 实现**：每台主机的 `ssh_exec` 调用在独立子 Shell 中，用 `|| true` 或 `|| { echo "ERROR"; }` 兜底，确保非零退出码不触发 `set -e` 退出主循环。

12. **不能提交**：SSH 私钥文件（`id_ed25519`, `id_rsa`）、主机清单中含真实 IP/密码的 `hosts.ini`（或将其替换为模板文件）、含真实 API Token 的 `config.yaml`。应该在 `.gitignore` 中排除这些文件，通过环境变量或加密 Vault 传递敏感配置。

13. `set -e` 默认只检查管道最后一个命令的退出码，所以 `cmd1 | cmd2`，如果 `cmd2` 成功但 `cmd1` 失败，脚本不会退出（因为只看 `cmd2`）。加上 `set -o pipefail` 后，管道中任意一步失败都会导致脚本退出。但有时我们希望"即使 grep 没找到也继续"，此时用 `|| true`：`output=$(cmd) || true`，或显式判断：`if echo "$output" | grep -q pattern; then`。

14. **问题**：输出量巨大时会撑爆内存（一次性读入 Python 变量），或 Bash 中 `SSH_STDERR=$(timeout 60 ssh ...)` 变量内容过大导致 OOM。**Bash 处理**：`timeout 30 ssh ... | tail -n 50`（管道输出，行数限制）；**Python 处理**：用 `iter(stdout.readline, "")` 逐行读，读够 20 行就停止，不要 `stdout.read()` 全量读取。

15. **人工操作的特点**：人可以实时判断风险，可以随时停下来问"这个要删吗"，可以凭直觉避开明显危险操作。**脚本没有这些能力**：它会**精确地、不假思索地**执行你写好的每一条指令——包括你写错的那些。
    **具体例子**：人工删除 `/var/log` 时，看到"哦这是日志目录，里面很大，我再确认一下"会停下来。脚本收到 `rm -rf /var/log` 时，会**精确地、无情地**删掉所有文件，不会问你。所以好的自动化脚本在执行危险操作前，要加 `--dry-run`、加 `echo "即将删除 $target"`、加确认逻辑，比人工操作更"胆小"。

---

## 参考资料

1. **ShellCheck 官方文档**（静态检查工具，含所有 SC 错误码解释）
   https://www.shellcheck.net/

2. **Google Shell Style Guide**（Bash 编码规范，工业级最佳实践）
   https://google.github.io/styleguide/shellguide.html

3. **Bash 严格模式（unofficial bash 3.x/4.x 手册）**
   https://www.gnu.org/software/bash/manual/html_node/The-Set-Builtin.html

4. **paramiko 官方文档**（SSH 客户端库，含 API 参考和示例）
   https://docs.paramiko.org/en/stable/

5. **Python subprocess 模块文档**（官方，标准库）
   https://docs.python.org/3/library/subprocess.html

6. **Fabric 官方文档**（比 paramiko 更高级的 SSH 封装，适合运维场景）
   https://docs.fabfile.org/en/latest/

7. **GNU parallel 官方手册**（Bash 并发执行工具）
   https://www.gnu.org/software/parallel/parallel_tutorial.html

8. **Ansible 主机清单格式（INI 和 YAML）**
   https://docs.ansible.com/ansible/latest/inventory_guide/intro_inventory.html

9. **Multipass 官方文档**（创建和管理 Linux VM）
   https://documentation.ubuntu.com/multipass/latest/

10. **运维脚本安全实践：NSA/CISA 网络安全指南**
    https://media.defense.gov/2022/Sep/08/file/28/SEcure_Practice_for_Enterprise_Systems.pdf

---

> **下一步**：第 6 章《Nginx、Ansible、Terraform》会在本章的自动化基础上，用 Ansible 把"手动配置"升级为"幂等声明式配置"，用 Terraform 把"手动建虚拟机"升级为"代码化基础设施"。
