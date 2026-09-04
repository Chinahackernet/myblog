# Linux 从零基础到 Ops 工程师：24 周全栈实战教程

> 一套以 Rocky Linux 9 为主线、以“能部署、会排错、敢值班”为目标的系统化课程。  
> 适用角色：Linux 初学者、系统管理员、DevOps/SRE 转型学习者、后端与云原生工程师。  
> 建议节奏：每周 6～10 小时；理论 30%，动手 50%，复盘 20%。

---

## 使用说明

这不是一份只供阅读的命令清单。每章都按照以下学习闭环组织：

1. **先理解**：知道组件解决什么问题、处于系统哪一层。
2. **再操作**：在隔离实验环境中完成可复现步骤。
3. **做验证**：每次变更后，用明确命令证明结果正确。
4. **练排错**：主动制造故障，按证据链定位根因。
5. **留记录**：把命令、现象、判断和回滚过程写进实验报告。

> [!WARNING]
> 文中的破坏性操作仅允许在实验虚拟机中执行。涉及磁盘格式化、防火墙、SELinux、SSH、集群删除、Terraform `apply/destroy` 的命令，执行前必须确认目标环境。生产环境应先备份、评审并准备回滚方案。

### 命令提示符约定

```text
$ command        # 普通用户执行
# command        # root 用户执行，通常应使用 sudo command
```

示例里的 IP、主机名、令牌、镜像版本和云资源 ID 都是占位值。不要照抄密码或密钥；不要把真实凭据提交到 Git。

---

## 快速导航

- 第一阶段：系统基石——环境、文件、权限、systemd
- 第二阶段：运维内功——存储、网络、Bash、Python
- 第三阶段：自动化与 IaC——Nginx、Ansible、Terraform
- 第四阶段：云原生——容器、Kubernetes、Cilium、持久化
- 第五阶段：交付与观测——GitLab CI、Argo CD、Prometheus、Loki
- 第六阶段：智能运维——K8sGPT、Backstage、平台工程
- 第七阶段：综合通关——事故响应、复盘、最终项目
- 附录：排错速查、安全变更检查单、术语与参考资料

---

## 课程总览

| 阶段 | 周次 | 核心能力 | 阶段作品 |
|---|---:|---|---|
| 系统基石 | 1～4 | 环境、文件、权限、进程、systemd | 一台安全可登录的 Linux 实验机 |
| 运维内功 | 5～9 | 存储、网络、Shell、Python、备份 | 自动巡检与故障采集工具 |
| 自动化与 IaC | 10～13 | Nginx、Ansible、Terraform | 可重复创建的 Web 基础设施 |
| 云原生 | 14～18 | 容器、Kubernetes、Cilium、存储 | 高可用集群与示例应用 |
| GitOps 与可观测 | 19～21 | CI/CD、Argo CD、Prometheus、Loki | 自动交付与监控闭环 |
| AIOps 与平台工程 | 22～24 | K8sGPT、Backstage、Golden Path | 内部开发者自助服务原型 |

### 24 周建议安排

| 周次 | 学习主题 | 最低验收标准 |
|---:|---|---|
| 1 | Linux、虚拟化与终端 | 能创建、登录、停止和恢复实验机 |
| 2 | FHS、文件与文本处理 | 能组合管道完成日志统计 |
| 3 | 用户、组、权限、ACL | 能设计共享目录权限 |
| 4 | 进程、日志与 systemd | 能编写并排错自定义服务 |
| 5 | 分区、文件系统与挂载 | 能安全配置 UUID 持久挂载 |
| 6 | LVM、容量与备份 | 能在线扩容并验证文件系统 |
| 7 | TCP/IP 与网络工具 | 能定位 DNS、路由、端口问题 |
| 8 | Bash 工程化 | 能写健壮、可审计的巡检脚本 |
| 9 | Python 运维自动化 | 能调用 API、处理超时与结构化日志 |
| 10 | Nginx 反向代理 | 能部署、验证并平滑重载配置 |
| 11 | Ansible 基础 | 能幂等配置多台主机 |
| 12 | Ansible Role 与测试 | 能组织可复用 Role 并预演变更 |
| 13 | Terraform | 能完成 plan、apply、远程状态与回滚演练 |
| 14 | 容器底层 | 能解释 namespace、cgroup 与镜像层 |
| 15 | 镜像工程 | 能构建非 root、多阶段、小体积镜像 |
| 16 | Kubernetes 工作负载 | 能部署 Deployment、Service、Ingress/Gateway |
| 17 | 集群高可用与网络 | 能解释控制平面、etcd、CNI 与服务转发 |
| 18 | 存储、弹性与发布 | 能配置 StatefulSet、PVC、探针和滚动发布 |
| 19 | CI/CD 与供应链安全 | 能输出镜像扫描报告并设置发布门禁 |
| 20 | Argo CD GitOps | 能演示漂移、自愈、回滚和审计 |
| 21 | 指标、日志与告警 | 能用 RED/USE 方法定位故障 |
| 22 | K8sGPT 辅助诊断 | 能安全地完成一次 AI 辅助排错 |
| 23 | Backstage 与平台产品 | 能定义服务目录和模板 |
| 24 | 综合演练 | 能从告警到复盘完整处理一次事故 |

---

# 第一阶段：系统基石（第 1～4 周）

## 第 1 章：进入 Linux 世界与实验环境构建

### 1.1 学习目标

完成本章后，你应该能够：

- 解释内核、Shell、发行版、软件仓库之间的关系；
- 创建一台可随时重置的 Linux 虚拟机；
- 使用 SSH 密钥登录，并安全地修改 SSH 配置；
- 通过系统信息命令确认自己正在操作哪台主机。

### 1.2 Linux 并不神秘

Linux 可以分成四层理解：

```text
应用程序：nginx、mysql、python、kubectl
系统工具：bash、systemd、ip、dnf、journalctl
Linux 内核：进程调度、内存、文件系统、网络、设备驱动
硬件/虚拟硬件：CPU、内存、磁盘、网卡
```

“一切皆文件”是理解 Linux 接口的一把钥匙，但不是字面意义上的绝对规则。普通文件、目录、设备节点、管道、套接字都可以通过类似的文件描述符接口操作；进程和内核参数则大量暴露在 `/proc`、`/sys` 这样的伪文件系统中。

### 1.3 选择实验环境

推荐三种路线：

| 路线 | 优点 | 适合人群 | 注意事项 |
|---|---|---|---|
| Multipass + Ubuntu LTS | 安装简单、快照方便 | 第一次接触 Linux | Multipass 的官方现成镜像以 Ubuntu 为主 |
| VMware/VirtualBox + Rocky Linux 9 | 与课程主线一致 | 希望学习 RHEL 系生态 | 需要下载 Rocky ISO 并手动安装 |
| 云主机 + Rocky Linux 9 | 接近真实服务器 | 已会管理云账单和安全组 | 可能产生费用，不要开放弱口令 SSH |

> [!NOTE]
> 原课程中的 `multipass launch rocky9` 不能被视为通用可用命令。先运行 `multipass find` 查看当前可用别名；使用 Rocky Linux 时，优先选择 Rocky 官方镜像配合 VMware/VirtualBox，或使用满足 `cloud-init` 与 SSH 要求的自定义云镜像 URL。

#### 路线 A：快速创建 Ubuntu 实验机

```bash
multipass version
multipass find
multipass launch lts --name linux-base --cpus 2 --memory 4G --disk 30G
multipass list
multipass shell linux-base
```

退出后管理生命周期：

```bash
multipass stop linux-base
multipass start linux-base
multipass info linux-base
```

#### 路线 B：Rocky Linux 9 最小化安装建议

- 2 vCPU、4 GiB 内存、40 GiB 动态磁盘；
- 网络先使用 NAT，学习网络章节时再添加仅主机网卡；
- 软件选择 `Minimal Install`；
- 创建普通管理用户，不长期直接使用 root；
- 安装后立刻创建虚拟机快照 `clean-install`。

首次进入 Rocky Linux 后：

```bash
cat /etc/os-release
uname -r
hostnamectl
lscpu
free -h
lsblk
ip -brief address
sudo dnf update -y
```

每条命令都在回答一个问题：发行版是什么、内核是什么、主机叫什么、CPU/内存/磁盘有多少、网络地址是什么。

### 1.4 SSH 密钥登录

在宿主机生成 Ed25519 密钥。它更短、更快，也是现代 OpenSSH 的常用选择：

```bash
ssh-keygen -t ed25519 -a 100 -C "linux-lab"
```

将公钥安装到服务器：

```bash
ssh-copy-id student@192.168.56.10
ssh student@192.168.56.10
```

如果没有 `ssh-copy-id`，在服务器上确保目录和文件权限正确：

```bash
mkdir -p ~/.ssh
chmod 700 ~/.ssh
printf '%s\n' '粘贴你的公钥内容' >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

安全修改 SSH 的正确顺序：

```bash
sudo sshd -t                         # 修改前/后都做语法检查
sudo cp -a /etc/ssh/sshd_config /etc/ssh/sshd_config.bak
sudoedit /etc/ssh/sshd_config
sudo sshd -t
sudo systemctl reload sshd
```

建议配置项：

```text
PermitRootLogin no
PubkeyAuthentication yes
PasswordAuthentication no
```

保持旧会话不关闭，另开一个终端验证新连接。确认密钥登录成功后再退出旧会话。

### 1.5 基础安全与时间

```bash
timedatectl
sudo timedatectl set-timezone Asia/Shanghai   # 按实际时区修改
systemctl status chronyd
sudo firewall-cmd --state
getenforce
```

不要为了“省事”永久关闭防火墙或 SELinux。学习环境也应练习正确放行端口、设置安全上下文。遇到访问问题时先收集证据：

```bash
sudo firewall-cmd --list-all
sudo ausearch -m AVC -ts recent
sudo journalctl -u sshd --since "10 min ago"
```

### 1.6 故障实验

1. 故意把公钥文件权限改成 `666`，观察 SSH 密钥认证失败；恢复为 `600`。
2. 将主机名改为 `ops-lab-01`，重新登录并验证提示符、`hostnamectl` 和 `/etc/hosts`。
3. 用 `multipass info` 或虚拟化软件控制台找回因网络配置错误而无法 SSH 的实验机。

### 1.7 验收清单

- [ ] 能说出发行版和内核的区别。
- [ ] 能从宿主机使用密钥登录普通用户。
- [ ] root 不能通过 SSH 直接登录。
- [ ] 修改 SSH 配置前有备份，修改后通过 `sshd -t`。
- [ ] 知道如何从虚拟机控制台恢复网络或 SSH 配置。

---

## 第 2 章：文件系统、终端与文本处理

### 2.1 FHS：先知道文件通常在哪里

| 路径 | 用途 | 运维常见内容 |
|---|---|---|
| `/etc` | 系统级配置 | `ssh/`、`systemd/`、`nginx/` |
| `/var` | 经常变化的数据 | 日志、缓存、队列、数据库数据 |
| `/home` | 普通用户家目录 | 个人配置、脚本、SSH 密钥 |
| `/root` | root 家目录 | 仅管理员可访问 |
| `/usr` | 用户空间程序和只读数据 | `/usr/bin`、`/usr/lib` |
| `/run` | 本次启动的运行时状态 | PID、套接字、临时状态 |
| `/tmp` | 临时文件 | 可能会被自动清理 |
| `/proc` | 进程和内核视图 | `/proc/cpuinfo`、`/proc/<PID>` |
| `/sys` | 设备与内核对象视图 | 块设备、网络、cgroup |

使用这些命令建立空间感：

```bash
pwd
ls -lah
findmnt
df -hT
du -xhd1 /var 2>/dev/null | sort -h
```

`df` 看文件系统整体剩余空间，`du` 统计目录实际可见文件占用；“文件删除了但空间没释放”时，两者可能明显不一致。

### 2.2 文件操作的安全习惯

```bash
mkdir -p ~/labs/ch02/{input,output,backup}
cp -a source.conf backup/source.conf.$(date +%F)
mv old-name.txt new-name.txt
install -m 0644 app.conf /tmp/app.conf
```

删除前先把范围列出来：

```bash
find ~/labs/ch02/output -type f -name '*.tmp' -print
# 确认无误后再把 -print 改为 -delete
```

`alias rm='rm -i'` 可以降低交互式误删概率，却不能代替备份，也不会自动保护脚本或非交互环境。真正可靠的做法是缩小权限、明确路径、先预览、定期备份。

### 2.3 重定向与管道

```bash
command > output.txt       # 覆盖标准输出
command >> output.txt      # 追加标准输出
command 2> error.log       # 单独记录标准错误
command > all.log 2>&1     # 合并输出和错误
producer | consumer        # 把前者输出交给后者
```

实战：统计 SSH 日志里来源地址出现次数（字段会随日志格式变化，先抽样确认）：

```bash
sudo journalctl -u sshd --no-pager |
  grep 'Failed password' |
  awk '{for (i=1;i<=NF;i++) if ($i=="from") print $(i+1)}' |
  sort | uniq -c | sort -nr | head
```

### 2.4 grep、sed、awk 三件套

#### grep：找行

```bash
grep -RIn --exclude-dir=.git 'TODO' .
grep -E 'ERROR|WARN' app.log
grep -v 'healthcheck' access.log
```

#### sed：变换文本流

```bash
sed -n '1,20p' app.conf
sed 's/old.example.com/new.example.com/g' app.conf
sed -i.bak 's/old.example.com/new.example.com/g' app.conf
diff -u app.conf.bak app.conf
```

#### awk：按字段计算

```bash
awk -F: '{printf "%-20s %s\n", $1, $7}' /etc/passwd
awk '$9 >= 500 {count[$9]++} END {for (code in count) print code, count[code]}' access.log
```

处理带空格、换行或特殊字符的文件名时，不要解析 `ls` 输出：

```bash
find . -type f -print0 | xargs -0 -r sha256sum
```

### 2.5 Vim 最小生存手册

| 目标 | 操作 |
|---|---|
| 插入文本 | `i` / `a` / `o` |
| 回到普通模式 | `Esc` |
| 保存 / 退出 | `:w` / `:q` / `:wq` / `:q!` |
| 删除 / 复制 / 粘贴一行 | `dd` / `yy` / `p` |
| 撤销 / 重做 | `u` / `Ctrl-r` |
| 搜索 / 下一个 | `/pattern` / `n` |
| 显示行号 | `:set number` |

出现交换文件警告时不要直接批量删除 `.*.swp`。先确认是否仍有另一个 Vim 进程；需要恢复时使用 `vim -r filename`，保存确认后再删除对应交换文件。

### 2.6 现代工具：提升效率但保留基本功

- `rg`：快速递归搜索文本；
- `bat`：带语法高亮和行号的文件查看器；
- `eza`：更友好的目录列表；
- `jq`：JSON 查询与转换；
- `yq`：YAML 查询与转换。

这些工具不一定预装在服务器。脚本若面向大量机器，先检查依赖，或优先使用系统自带工具。

### 2.7 综合实验：日志日报

目标：从 Nginx access log 生成 Markdown 日报，至少包含请求总量、5xx 数量、Top 10 URL、Top 10 来源 IP。

建议步骤：

1. 用 `head` 查看日志格式；
2. 用 `awk` 验证状态码和 URL 的字段位置；
3. 过滤健康检查流量；
4. 排序聚合；
5. 对空文件和不存在文件给出明确错误；
6. 保存原始命令和输出样例。

---

## 第 3 章：用户、权限、进程与 systemd

### 3.1 用户与组

```bash
sudo useradd -m -s /bin/bash deploy
sudo passwd deploy
sudo groupadd appops
sudo usermod -aG appops deploy
id deploy
getent passwd deploy
getent group appops
```

`/etc/passwd` 保存账号元数据，不保存明文密码；密码散列位于只有 root 可读的 `/etc/shadow`。服务账号通常不需要交互式 Shell，应设置为 `/sbin/nologin`。

### 3.2 UGO 权限模型

```text
r = 4：读
w = 2：写
x = 1：执行；对目录表示可以进入/遍历
```

```bash
chmod 640 app.conf
chown root:appops app.conf
stat app.conf
namei -l /srv/myapp/config/app.conf
```

文件可读并不代表一定能访问：路径上每一级目录都需要相应的执行权限。排查 `Permission denied` 时，`namei -l` 往往比只看最终文件更快。

#### 共享目录：setgid 与 umask

```bash
sudo install -d -m 2770 -o root -g appops /srv/shared
sudo -u deploy touch /srv/shared/test.txt
ls -ld /srv/shared /srv/shared/test.txt
```

目录上的 setgid 会让新文件继承目录的组。若还要保证组可写，需要设置合适的 `umask`（如 `0002`）或默认 ACL。

#### ACL：给特定用户额外权限

```bash
setfacl -m u:auditor:r-- /srv/shared/report.txt
getfacl /srv/shared/report.txt
setfacl -m d:g:appops:rwx /srv/shared
```

`ls -l` 权限位后的 `+` 表示存在 ACL。备份权限元数据时应选择支持 ACL/xattr 的工具和文件系统。

### 3.3 sudo 最小权限

使用 `visudo` 或 `/etc/sudoers.d/`，不要直接用普通编辑器修改主文件：

```sudoers
%appops ALL=(root) /usr/bin/systemctl status myservice, /usr/bin/journalctl -u myservice
```

不要随意授予可编辑任意文件、启动任意程序或带通配符的 sudo 命令；它们常常等价于完整 root 权限。

### 3.4 进程与信号

```bash
ps -eo pid,ppid,user,stat,%cpu,%mem,etime,cmd --sort=-%cpu | head
pgrep -a nginx
top
sudo lsof -p <PID>
sudo strace -p <PID>                 # 实验环境短时使用
```

常用信号：

| 信号 | 用途 |
|---|---|
| `SIGTERM` (15) | 请求进程优雅退出，首选 |
| `SIGHUP` (1) | 很多守护进程用它重载配置 |
| `SIGINT` (2) | 类似终端 `Ctrl-C` |
| `SIGKILL` (9) | 内核强制终止，进程无法清理资源，最后手段 |

### 3.5 systemd 单元

创建 `/etc/systemd/system/my-monitor.service`：

```ini
[Unit]
Description=Course health monitor
Wants=network-online.target
After=network-online.target

[Service]
Type=simple
User=monitor
Group=monitor
ExecStart=/usr/local/bin/my-monitor
Restart=on-failure
RestartSec=5s
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/var/lib/my-monitor

[Install]
WantedBy=multi-user.target
```

关键点：

- `ExecStart` 使用绝对路径；
- 服务不要默认以 root 运行；
- `Restart=on-failure` 通常比无条件 `always` 更容易发现正常退出逻辑；
- `After=` 只表达启动顺序，不自动创建依赖，所以常与 `Wants=`/`Requires=`配合；
- systemd 不会自动读取你的交互式 Shell 环境，显式配置 `EnvironmentFile=` 或完整路径。

验证与管理：

```bash
sudo systemd-analyze verify /etc/systemd/system/my-monitor.service
sudo systemctl daemon-reload
sudo systemctl enable --now my-monitor.service
systemctl status my-monitor.service
sudo journalctl -u my-monitor.service -f
```

修改单元后必须 `daemon-reload`。修改应用配置后，是 `reload` 还是 `restart` 取决于应用是否实现重载能力，不能一概而论。

### 3.6 journalctl 排错路径

```bash
journalctl -b -p warning
journalctl -u my-monitor --since "30 min ago" --no-pager
journalctl _PID=1234
journalctl -k -b
```

标准排错链：

```text
服务状态 → 最近日志 → 单元内容 → 命令手动运行 → 权限/路径 → 依赖 → SELinux/防火墙
```

### 3.7 实验与验收

1. 创建 `monitor` 系统用户和数据目录。
2. 编写每 10 秒输出一次时间和磁盘使用率的程序。
3. 用 systemd 启动，故意让程序返回非零，观察重启计数。
4. 通过只读文件系统保护证明服务不能修改 `/etc`。
5. 提交单元文件、日志片段、故障原因和恢复步骤。

---

# 第二阶段：运维内功与自动化（第 5～9 周）

## 第 4 章：磁盘、LVM、文件系统与备份

### 4.1 从设备到文件的完整链路

```text
磁盘 → 分区（可选）→ PV → VG → LV → 文件系统 → 挂载点 → 应用数据
```

查看而不修改：

```bash
lsblk -f
blkid
findmnt
pvs
vgs
lvs -a -o +devices
df -hT
```

### 4.2 新建 LVM 实验卷

假设 `/dev/sdb` 是专门添加的空实验盘。先三次确认：设备名、容量、是否有挂载或签名。

```bash
lsblk -o NAME,SIZE,TYPE,FSTYPE,MOUNTPOINTS,MODEL /dev/sdb
sudo wipefs -n /dev/sdb
sudo pvs
```

确认无数据后：

```bash
sudo pvcreate /dev/sdb
sudo vgcreate data_vg /dev/sdb
sudo lvcreate -L 10G -n data_lv data_vg
sudo mkfs.xfs /dev/data_vg/data_lv
sudo install -d /data
sudo mount /dev/data_vg/data_lv /data
df -hT /data
```

### 4.3 使用 UUID 持久挂载

```bash
sudo blkid /dev/data_vg/data_lv
```

在 `/etc/fstab` 加入类似配置：

```fstab
UUID=<实际UUID>  /data  xfs  defaults,nofail  0  0
```

验证时不要直接重启：

```bash
sudo findmnt --verify --verbose
sudo umount /data
sudo mount -a
findmnt /data
```

`nofail` 是否合适取决于业务：非关键数据盘可避免启动被阻塞；数据库关键卷若未挂载却继续启动，反而可能把数据写到根分区。应结合 systemd 挂载依赖设计。

### 4.4 在线扩容 XFS

先扩逻辑卷，再扩文件系统：

```bash
sudo lvextend -L +5G /dev/data_vg/data_lv
sudo xfs_growfs /data
lvs /dev/data_vg/data_lv
df -hT /data
```

`xfs_growfs` 的参数应使用已挂载的文件系统挂载点，例如 `/data`。XFS 可以在线扩容，但不能缩容。不要把“LVM 能缩小 LV”误解为“上层文件系统一定能安全缩小”。

也可在确认环境后使用：

```bash
sudo lvextend -r -L +5G /dev/data_vg/data_lv
```

`-r` 会尝试调用适当工具同步扩展文件系统；仍需检查命令输出并用 `df` 验证。

### 4.5 inode、已删除文件与空间告警

```bash
df -h
df -i
sudo du -xah /var | sort -h | tail
sudo lsof +L1
```

常见情形：

- `df` 满、`du` 不大：进程仍持有已删除文件；
- inode 100%、容量未满：大量小文件耗尽 inode；
- `/var` 暴涨：日志轮转失败、容器日志无限增长或缓存堆积；
- LVM 有空间但文件系统没变大：只扩了 LV，未扩文件系统。

### 4.6 备份不是复制

可靠备份至少回答：备什么、多久一次、保留多久、放哪里、如何加密、谁能恢复、恢复时间目标（RTO）和恢复点目标（RPO）是多少。

```bash
rsync -aHAX --numeric-ids --delete --dry-run /srv/app/ /backup/app/
rsync -aHAX --numeric-ids --delete /srv/app/ /backup/app/
sha256sum /backup/app/critical-file
```

`--delete` 会删除目标端多余文件，必须先 `--dry-run`。数据库不能简单依赖在线复制数据目录，应使用数据库一致性备份、快照或官方备份工具。

### 4.7 恢复演练

每月随机抽取备份进行恢复，记录：

- 恢复到隔离目录是否成功；
- 文件数量、校验和、ACL/xattr 是否一致；
- 应用能否启动并完成最小业务测试；
- 实际 RTO/RPO 是否满足要求；
- 备份管理员离席时，第二个人能否依文档完成恢复。

---

## 第 5 章：网络原理与硬核排错

### 5.1 从 URL 到响应的路径

```text
应用 → DNS 解析 → 路由选择 → ARP/邻居发现 → TCP/TLS → HTTP → 服务端应用
```

排错要从“哪一层失败”开始，而不是随机重启服务。

### 5.2 必会命令

```bash
ip -brief address
ip route
ip neigh
resolvectl status 2>/dev/null || cat /etc/resolv.conf
ss -lntup
ss -s
ping -c 4 192.168.1.1
tracepath example.com
dig +short example.com
curl -v --connect-timeout 3 https://example.com/
```

`ping` 不通不能单独证明目标服务不可用，因为 ICMP 可能被禁；`telnet` 端口通也不能证明 HTTP/TLS/业务正常。要选择与问题层级匹配的探测。

### 5.3 一套稳定的排错顺序

1. **确认问题定义**：谁访问谁、何时开始、持续还是间歇、错误文本是什么。
2. **检查本机**：地址、接口状态、默认路由、DNS 配置。
3. **检查监听**：服务是否监听正确 IP/端口，IPv4 还是 IPv6。
4. **逐层探测**：IP、TCP、TLS、HTTP、应用健康接口。
5. **检查策略**：主机防火墙、云安全组、NetworkPolicy、代理。
6. **抓包取证**：确认请求是否到达、响应是否返回。
7. **对照变更**：部署、证书、DNS、路由和防火墙最近是否变化。

### 5.4 tcpdump 实战

```bash
sudo tcpdump -ni any 'tcp port 443' -c 100
sudo tcpdump -ni eth0 'host 192.0.2.10 and tcp port 80' -w /tmp/http.pcap
```

抓包前写清过滤条件和时间窗口，避免收集无关敏感流量。PCAP 可能包含 Cookie、令牌或业务数据，应限制权限、短期保存并按安全流程传输。

TCP 三次握手：

```text
客户端 → SYN → 服务端
客户端 ← SYN,ACK ← 服务端
客户端 → ACK → 服务端
```

- 只有重复 SYN：请求发出但没收到响应，查路径、防火墙、服务端；
- 收到 RST：目标主机明确拒绝，常见于端口未监听；
- 握手成功后超时：继续看 TLS/应用处理；
- 大量重传或零窗口：查链路质量、拥塞、接收端处理能力。

### 5.5 DNS 与 TLS

```bash
dig example.com A
dig example.com AAAA
dig @1.1.1.1 example.com
curl --resolve example.com:443:203.0.113.10 https://example.com/
openssl s_client -connect example.com:443 -servername example.com </dev/null
```

`curl --resolve` 可以绕过 DNS，将域名、端口临时绑定到指定 IP，同时保留正确的 Host/SNI，特别适合验证新节点和证书。

### 5.6 防火墙原则

```bash
sudo firewall-cmd --get-active-zones
sudo firewall-cmd --list-all
sudo firewall-cmd --add-service=http --permanent
sudo firewall-cmd --reload
```

先添加规则并验证，再删除旧规则。远程操作 SSH 放行规则时，务必保持备用会话或控制台通道。

### 5.7 综合故障题

场景：浏览器访问 `https://app.lab` 超时，但服务进程显示 running。

需要提交证据：

- DNS 解析结果；
- 客户端路由和 TCP 连接结果；
- 服务端监听地址；
- 防火墙规则；
- 抓包中 SYN/SYN-ACK 情况；
- TLS 证书名称；
- 最终根因和最小修复。

---

## 第 6 章：Bash 与 Python 运维自动化

### 6.1 什么时候用 Bash，什么时候用 Python

| 场景 | Bash | Python |
|---|---:|---:|
| 调用少量系统命令、拼装管道 | 优 | 可用 |
| 复杂数据结构、JSON、API | 勉强 | 优 |
| 并发、重试、单元测试 | 较难 | 优 |
| 依赖极少的启动/救援脚本 | 优 | 需解释器 |
| 跨平台业务工具 | 较弱 | 优 |

### 6.2 生产级 Bash 基线

```bash
#!/usr/bin/env bash
set -Eeuo pipefail

readonly SCRIPT_NAME="${0##*/}"

log() {
  printf '%s [%s] %s\n' "$(date --iso-8601=seconds)" "$SCRIPT_NAME" "$*" >&2
}

die() {
  log "ERROR: $*"
  exit 1
}

cleanup() {
  : # 删除本脚本创建的临时资源
}
trap cleanup EXIT
trap 'die "line $LINENO failed"' ERR

main() {
  [[ $# -eq 1 ]] || die "usage: $SCRIPT_NAME <directory>"
  local target=$1
  [[ -d "$target" ]] || die "not a directory: $target"
  du -sh -- "$target"
}

main "$@"
```

注意：`set -e` 有条件列表、管道、子 Shell 等语义边界，不等于完整错误处理。关键步骤应显式判断并输出上下文。

### 6.3 安全引用与临时文件

```bash
readonly target_dir=${1:?target directory required}
tmp_dir=$(mktemp -d)
trap 'rm -rf -- "$tmp_dir"' EXIT
find "$target_dir" -type f -name '*.log' -print0
```

铁律：

- 变量展开通常使用双引号：`"$var"`；
- 参数和路径间加 `--`，防止以 `-` 开头的文件名被当成选项；
- 不解析 `ls`；
- 不用 `eval` 拼装不可信输入；
- 删除前验证变量非空且目标位于预期目录；
- ShellCheck 作为代码检查门禁。

### 6.4 可测试、可重复、可审计

运维脚本应尽可能幂等：运行一次和运行多次得到同一目标状态。

```bash
if ! id -u monitor >/dev/null 2>&1; then
  sudo useradd --system --home-dir /var/lib/monitor --shell /sbin/nologin monitor
fi
```

为脚本提供：

- `--help`；
- `--dry-run`；
- 明确退出码；
- 时间戳和操作对象；
- 超时、重试上限；
- 可恢复的中间状态；
- 敏感信息脱敏。

### 6.5 Python API 客户端骨架

```python
from __future__ import annotations

import logging
import os
import sys
from typing import Any

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
)


def build_session() -> requests.Session:
    retry = Retry(
        total=3,
        backoff_factor=0.5,
        status_forcelist=(429, 500, 502, 503, 504),
        allowed_methods=("GET",),
    )
    session = requests.Session()
    session.mount("https://", HTTPAdapter(max_retries=retry))
    return session


def list_instances(base_url: str, token: str) -> list[dict[str, Any]]:
    response = build_session().get(
        f"{base_url.rstrip('/')}/v1/instances",
        headers={"Authorization": f"Bearer {token}"},
        timeout=(3.05, 15),
    )
    response.raise_for_status()
    payload = response.json()
    if not isinstance(payload, list):
        raise ValueError("API response must be a list")
    return payload


def main() -> int:
    token = os.environ.get("OPS_API_TOKEN")
    if not token:
        logging.error("OPS_API_TOKEN is not set")
        return 2
    try:
        instances = list_instances("https://api.example.com", token)
    except (requests.RequestException, ValueError) as exc:
        logging.error("request failed: %s", exc)
        return 1
    logging.info("instances=%d", len(instances))
    return 0


if __name__ == "__main__":
    sys.exit(main())
```

为什么不能只写 `requests.get(url)`：没有超时可能永久挂起；不检查状态码会把错误页面当成功；不校验 JSON 结构会在后续逻辑中产生更隐蔽的异常。

### 6.6 凭据管理

- 开发环境使用环境变量或本地密钥管理器；
- CI 使用受保护、掩码的 Secret；
- 云上优先使用短期身份凭据和工作负载身份；
- 日志中禁止打印 Authorization、Cookie、私钥和完整个人数据；
- 仓库启用 secret scanning，并建立轮换流程。

### 6.7 阶段项目：自动巡检器

输入：主机列表。输出：JSON 与 Markdown 两种报告。

至少检查：

- 主机时间与连通性；
- CPU load、内存、磁盘、inode；
- 关键服务状态；
- 监听端口；
- 最近 30 分钟高优先级日志；
- 证书到期天数；
- 明确的 OK/WARN/CRIT 阈值。

验收要求：某台主机失败不阻断全部巡检；凭据不出现在报告；命令有超时；重复运行不会改变远端状态。

---

# 第三阶段：大规模配置与基础设施即代码（第 10～13 周）

## 第 7 章：Nginx 高性能入口与安全代理

### 7.1 Nginx 在架构中的位置

Nginx 常承担静态资源服务、反向代理、TLS 终止、负载均衡、访问日志与基础限流。它不是业务服务的替代品，也不能单独解决数据库瓶颈或错误的容量模型。

```text
客户端 → DNS/CDN/WAF → Nginx → 应用实例 → 缓存/数据库
```

### 7.2 安装与最小配置

```bash
sudo dnf install -y nginx
sudo systemctl enable --now nginx
sudo nginx -t
curl -I http://127.0.0.1/
```

创建 `/etc/nginx/conf.d/app.conf`：

```nginx
upstream app_backend {
    least_conn;
    server 127.0.0.1:8081 max_fails=3 fail_timeout=10s;
    server 127.0.0.1:8082 max_fails=3 fail_timeout=10s;
    keepalive 32;
}

server {
    listen 80;
    server_name app.lab;

    access_log /var/log/nginx/app_access.log;
    error_log  /var/log/nginx/app_error.log warn;

    location = /healthz {
        access_log off;
        return 200 "ok\n";
    }

    location / {
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Connection "";

        proxy_connect_timeout 3s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
        proxy_pass http://app_backend;
    }
}
```

上线前：

```bash
sudo nginx -t
sudo systemctl reload nginx
curl -H 'Host: app.lab' http://127.0.0.1/healthz
```

永远先 `nginx -t`，再 reload。保留旧工作进程的平滑重载通常比 restart 更适合生产变更。

### 7.3 并发参数如何理解

```nginx
worker_processes auto;

events {
    worker_connections 4096;
    multi_accept on;
}
```

Linux 上 Nginx 通常会自动选择高效事件模型，不必盲目写死 `use epoll`。理论连接上限不仅由 `worker_connections × worker_processes` 决定；反向代理的一次客户端请求还可能占用上游连接，同时受文件描述符、内核、内存、端口范围和上游容量约束。

验证系统限制：

```bash
nginx -V
systemctl show nginx -p LimitNOFILE
cat /proc/$(pgrep -o nginx)/limits
ss -s
```

优化必须基于压测和指标。把 `worker_connections` 直接调到 65535，不代表系统就能稳定支撑对应并发。

### 7.4 TLS 与安全响应头

证书路径仅作示例：

```nginx
server {
    listen 443 ssl http2;
    server_name app.example.com;

    ssl_certificate     /etc/pki/tls/certs/app.fullchain.pem;
    ssl_certificate_key /etc/pki/tls/private/app.key;
    ssl_protocols TLSv1.2 TLSv1.3;

    add_header X-Content-Type-Options nosniff always;
    add_header Referrer-Policy strict-origin-when-cross-origin always;
}
```

HSTS 只有在确认整个域名都能长期提供 HTTPS 后再开启，否则可能让错误持续很久。CSP 必须结合前端资源逐步设计，不宜复制一个“万能值”。

### 7.5 限流与真实客户端 IP

```nginx
limit_req_zone $binary_remote_addr zone=api_rate:10m rate=10r/s;

location /api/ {
    limit_req zone=api_rate burst=20 nodelay;
    proxy_pass http://app_backend;
}
```

如果 Nginx 前面还有可信负载均衡器，应只信任明确代理网段，再解析真实 IP。无条件信任客户端传入的 `X-Forwarded-For` 会让限流和审计被伪造。

### 7.6 常见错误定位

| 现象 | 首查 |
|---|---|
| 502 Bad Gateway | 上游监听、协议、进程、SELinux、错误日志 |
| 504 Gateway Timeout | 上游响应时间、超时设置、依赖服务 |
| 413 Request Entity Too Large | `client_max_body_size` 与业务限制 |
| 403 Forbidden | 文件权限、目录执行权限、SELinux、location 匹配 |
| 配置不生效 | `nginx -T` 实际加载内容、include 顺序、是否 reload |

Rocky/RHEL 系上，Nginx 代理网络服务被 SELinux 拦截时，应验证审计日志，并根据最小权限启用正确布尔值，而不是关闭 SELinux。

---

## 第 8 章：Ansible 批量配置工程化

### 8.1 核心价值：声明目标状态

命令式思维：“在 100 台机器上执行 `systemctl restart nginx`。”  
声明式思维：“确保指定配置存在、语法正确；只有配置变化且验证通过时才重载 Nginx。”

### 8.2 项目结构

```text
ansible/
├── ansible.cfg
├── inventories/
│   ├── lab/hosts.yml
│   └── prod/hosts.yml
├── group_vars/
│   └── web.yml
├── playbooks/
│   └── site.yml
└── roles/
    └── nginx/
        ├── defaults/main.yml
        ├── handlers/main.yml
        ├── tasks/main.yml
        ├── templates/nginx.conf.j2
        └── meta/main.yml
```

清单示例：

```yaml
all:
  children:
    web:
      hosts:
        web01:
          ansible_host: 192.168.56.21
        web02:
          ansible_host: 192.168.56.22
```

### 8.3 幂等 Playbook

```yaml
---
- name: Configure web servers
  hosts: web
  become: true
  serial: 1
  roles:
    - nginx
```

`roles/nginx/tasks/main.yml`：

```yaml
---
- name: Install nginx
  ansible.builtin.dnf:
    name: nginx
    state: present

- name: Deploy validated nginx configuration
  ansible.builtin.template:
    src: nginx.conf.j2
    dest: /etc/nginx/nginx.conf
    owner: root
    group: root
    mode: "0644"
    validate: /usr/sbin/nginx -t -c %s
  notify: Reload nginx

- name: Ensure nginx is enabled and running
  ansible.builtin.systemd_service:
    name: nginx
    enabled: true
    state: started
```

`roles/nginx/handlers/main.yml`：

```yaml
---
- name: Reload nginx
  ansible.builtin.systemd_service:
    name: nginx
    state: reloaded
```

只有模板发生变化时 handler 才执行，这就是幂等和“变化驱动”。

### 8.4 预演与分批发布

```bash
ansible-inventory -i inventories/lab/hosts.yml --graph
ansible all -i inventories/lab/hosts.yml -m ping
ansible-playbook -i inventories/lab/hosts.yml playbooks/site.yml --syntax-check
ansible-playbook -i inventories/lab/hosts.yml playbooks/site.yml --check --diff
ansible-playbook -i inventories/lab/hosts.yml playbooks/site.yml --limit web01
```

Check mode 是预演，不是完美模拟：某些模块不支持，依赖前序注册变量的任务也可能无法准确判断。生产变更仍需测试环境、灰度、健康检查和回滚。

### 8.5 变量与 Secret

优先级复杂是 Ansible 常见事故源。变量应按环境和角色明确分层，不把所有值都塞进 `extra-vars`。敏感值使用 Ansible Vault 或外部 Secret Manager：

```bash
ansible-vault encrypt_string --name 'db_password'
ansible-playbook playbooks/site.yml --ask-vault-pass
```

即使使用 Vault，也避免在 debug 输出中打印 Secret，并控制解密权限。

### 8.6 性能与可维护性

- 优先使用专用模块而不是大段 `shell`；
- 减少无意义 fact 收集；
- 合理设置 `forks` 和 SSH 连接复用；
- 用动态 inventory 管理云实例；
- Role 写 `README`、默认变量和支持平台；
- 使用 `ansible-lint` 与 Molecule/测试环境验证；
- 不把第三方性能插件宣传成固定倍数收益，先测量当前瓶颈和兼容性。

### 8.7 实验：零停机配置更新

1. 两台后端都部署 Nginx。
2. `serial: 1` 每次只改一台。
3. 每批执行前从负载均衡摘除节点，执行后健康检查再加入。
4. 模板语法错误应被 `validate` 阻止。
5. 第二次运行 Playbook 应显示 `changed=0`。

---

## 第 9 章：Terraform 多环境基础设施

### 9.1 Terraform 工作流

```text
write → fmt → validate → plan → review → apply → verify
```

Terraform 状态记录“配置中的资源”和“真实资源”的映射。它不是简单缓存，不能手工随意编辑，也不应提交到 Git。

### 9.2 最小配置结构

```hcl
terraform {
  required_version = ">= 1.8, < 2.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

variable "aws_region" {
  type        = string
  description = "AWS region for lab resources"
  default     = "us-east-1"
}
```

版本仅为结构示例，实际使用前通过官方 Registry 与变更日志选择兼容版本。

```bash
terraform fmt -recursive -check
terraform init
terraform validate
terraform plan -out=tfplan
terraform show tfplan
terraform apply tfplan
```

把 plan 保存为文件可确保 apply 的是刚刚评审过的计划，但计划文件可能包含敏感数据，不应提交或长期公开保存。

### 9.3 模块设计

```text
infra/
├── modules/
│   └── web-service/
│       ├── main.tf
│       ├── variables.tf
│       └── outputs.tf
└── environments/
    ├── staging/
    └── production/
```

一个模块应表达清晰能力边界，而不是把整个公司基础设施塞进一个巨型模块。变量带类型、描述和校验；输出只暴露消费者真正需要的值。

```hcl
variable "environment" {
  type = string
  validation {
    condition     = contains(["staging", "production"], var.environment)
    error_message = "environment must be staging or production"
  }
}
```

### 9.4 远程状态与锁

AWS S3 后端示例：

```hcl
terraform {
  backend "s3" {
    bucket       = "example-terraform-state"
    key          = "production/network/terraform.tfstate"
    region       = "us-east-1"
    encrypt      = true
    use_lockfile = true
  }
}
```

当前 S3 后端支持 `use_lockfile = true` 的锁文件方案；传统 DynamoDB 锁已被标记为弃用。状态桶应启用版本控制、加密、最小权限、审计和禁止公共访问。不同云后端的锁机制不同，需查对应官方文档。

需要提交 Git 的通常包括 `.tf`、`.terraform.lock.hcl`；不提交：

```gitignore
.terraform/
*.tfstate
*.tfstate.*
*.tfplan
crash.log
*.auto.tfvars
```

`.terraform.lock.hcl` 是 Provider 依赖锁文件，通常应提交；它和状态锁不是一回事。

### 9.5 生命周期与危险操作

```hcl
lifecycle {
  prevent_destroy = true
}
```

`prevent_destroy` 是护栏，不是备份。对数据库、状态桶、关键网络使用云端删除保护、快照与权限审批。

谨慎对待：

- `terraform destroy`：会真实删除资源；
- `-target`：仅用于特殊恢复，不是常规部署方式；
- `-refresh=false`：可能基于过期状态决策；
- `force-unlock`：只有确认没有其他运行时才使用；
- 修改 state：使用 `terraform state` 子命令并先备份。

### 9.6 漂移、导入和回滚

发现云控制台手工变更后：

1. 保存并评审 `terraform plan`；
2. 判断真实变更是应被配置覆盖，还是应回写代码；
3. 使用 import block/命令将既有资源纳管；
4. 不通过手工篡改 state “消除红色输出”。

Terraform 的“回滚”通常是回退代码后重新 plan/apply，无法保证所有云资源都可无损逆转。数据库数据、缩容和不可变属性尤其需要单独迁移方案。

### 9.7 阶段项目：三层环境

实现网络、负载均衡、两台应用节点和数据库子网；要求：

- dev/staging/prod 状态隔离；
- 所有资源有 owner、environment、cost-center 标签；
- CI 执行 fmt、validate、静态检查和 plan；
- production apply 需要人工审批；
- 远程状态加密和锁；
- 提供创建、验证、销毁实验环境的文档与费用提醒。

---

# 第四阶段：云原生编排（第 14～18 周）

## 第 10 章：容器底层与镜像工程

### 10.1 容器不是轻量虚拟机

容器进程与宿主机共享内核，隔离主要来自 namespace，资源约束和统计主要来自 cgroup，镜像提供只读分层文件系统。容器边界并不等同于虚拟机边界；内核漏洞、过高权限和挂载宿主机套接字都可能突破预期隔离。

```bash
docker run --rm alpine:3.22 cat /etc/os-release
docker run --rm alpine:3.22 ps aux
docker inspect <container>
```

镜像标签会变化，生产部署优先固定经过验证的版本或 digest，并建立自动更新评审流程。

### 10.2 多阶段、非 root Dockerfile

```dockerfile
# syntax=docker/dockerfile:1
FROM golang:1.25 AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /out/app ./cmd/app

FROM gcr.io/distroless/static-debian12:nonroot
COPY --from=build --chown=nonroot:nonroot /out/app /app
USER nonroot:nonroot
EXPOSE 8080
ENTRYPOINT ["/app"]
```

版本号是示例；构建前固定并验证受支持版本。多阶段构建会把编译器和中间文件留在构建阶段，降低最终镜像大小和攻击面，但“体积小”不自动等于“绝对安全”。仍需扫描依赖、生成 SBOM、签名、限制权限并及时更新基础镜像。

### 10.3 构建上下文与缓存

`.dockerignore`：

```text
.git
.env
*.pem
*.key
tmp/
coverage/
```

先复制依赖清单再复制源码，有利于复用缓存。不要用 `COPY . .` 无脑把密钥、Git 历史和构建产物送进构建上下文。

```bash
docker build --pull --tag app:dev .
docker history app:dev
docker image inspect app:dev
docker run --rm --read-only --cap-drop ALL -p 8080:8080 app:dev
```

### 10.4 PID 1 与优雅退出

使用 exec 形式：

```dockerfile
ENTRYPOINT ["/app"]
```

避免：

```dockerfile
ENTRYPOINT /app
```

后者通常经 Shell 启动，可能影响信号传递。应用自身应处理 SIGTERM、停止接收新请求、等待在途请求、关闭连接并在超时内退出。只有应用无法正确回收子进程时，才考虑 `--init` 或 tini；它不能替代应用的优雅关闭逻辑。

### 10.5 容器安全基线

- 非 root 用户；
- 只读根文件系统；
- 删除所有不需要的 Linux capabilities；
- 禁止 privileged；
- 不挂载 Docker socket；
- 设置 CPU/内存限制；
- Secret 运行时注入，不写入镜像和环境日志；
- 镜像扫描、SBOM、签名和准入策略；
- 使用 seccomp/AppArmor/SELinux 等纵深防御。

### 10.6 实验：可验证镜像

比较单阶段和多阶段镜像：大小、层、用户、文件清单、漏洞数量、启动时间。发送 SIGTERM 并记录退出耗时，证明应用没有被强制 SIGKILL。

---

## 第 11 章：Kubernetes 工作负载与服务发布

### 11.1 核心对象关系

```text
Deployment → ReplicaSet → Pod
Service → 稳定虚拟地址 → 一组带标签的 Pod
Ingress/Gateway → 七层路由 → Service
ConfigMap/Secret → 配置
PVC → 持久卷
```

### 11.2 一个更接近生产的 Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: demo-api
spec:
  replicas: 3
  strategy:
    rollingUpdate:
      maxUnavailable: 0
      maxSurge: 1
  selector:
    matchLabels:
      app: demo-api
  template:
    metadata:
      labels:
        app: demo-api
    spec:
      terminationGracePeriodSeconds: 30
      securityContext:
        runAsNonRoot: true
        seccompProfile:
          type: RuntimeDefault
      containers:
        - name: api
          image: registry.example.com/demo-api@sha256:<digest>
          ports:
            - name: http
              containerPort: 8080
          resources:
            requests:
              cpu: 100m
              memory: 128Mi
            limits:
              memory: 256Mi
          readinessProbe:
            httpGet:
              path: /readyz
              port: http
            periodSeconds: 5
          livenessProbe:
            httpGet:
              path: /livez
              port: http
            initialDelaySeconds: 15
          securityContext:
            allowPrivilegeEscalation: false
            readOnlyRootFilesystem: true
            capabilities:
              drop: ["ALL"]
```

含义：

- `requests` 参与调度；`limits.memory` 防止单容器无限占用内存；
- readiness 失败会从 Service 端点摘除，不等于重启；
- liveness 失败会触发重启，探针不应依赖容易抖动的外部系统；
- startupProbe 适合启动很慢的应用，避免 liveness 过早杀死它；
- CPU limit 可能造成节流，是否设置及数值应依据负载测试和平台策略。

### 11.3 Service 与调试

```yaml
apiVersion: v1
kind: Service
metadata:
  name: demo-api
spec:
  selector:
    app: demo-api
  ports:
    - name: http
      port: 80
      targetPort: http
```

```bash
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml
kubectl rollout status deployment/demo-api --timeout=2m
kubectl get pods -o wide
kubectl get endpointslices -l kubernetes.io/service-name=demo-api
kubectl describe pod <pod>
kubectl logs <pod> --previous
kubectl events --types=Warning
```

Service 无端点时，先检查 selector 是否匹配 Pod labels，以及 Pod readiness 是否通过。

### 11.4 ConfigMap 与 Secret

Secret 默认只是经过 Base64 编码，不等于加密。需要启用 etcd 静态加密、RBAC 最小权限、外部 Secret 管理和审计。不要通过命令行参数直接传高敏值，因为可能进入 Shell 历史或进程列表。

配置更新是否自动进入应用取决于挂载方式和应用行为：环境变量不会自动刷新；卷中的文件可能更新，但应用仍需实现 reload。

### 11.5 发布与回滚

```bash
kubectl set image deployment/demo-api api=registry.example.com/demo-api:<tag>
kubectl rollout status deployment/demo-api
kubectl rollout history deployment/demo-api
kubectl rollout undo deployment/demo-api
```

回滚镜像不等于回滚数据库 schema。数据库迁移应向前兼容，采用 expand/contract 等策略，并独立备份和验证。

---

## 第 12 章：高可用集群、Cilium 与有状态服务

### 12.1 kubeadm 高可用拓扑

官方常见两类：

- **堆叠 etcd**：etcd 与控制平面同机，基础设施较少；
- **外部 etcd**：etcd 独立，隔离更强，运维复杂度更高。

生产控制平面通常至少 3 台且使用奇数成员，API Server 前放置一个稳定的 TCP 负载均衡端点：

```bash
sudo kubeadm init \
  --control-plane-endpoint "lb.k8s.lab:6443" \
  --upload-certs
```

真正的高可用还包括：跨故障域、负载均衡器冗余、etcd 定期快照和恢复演练、控制平面证书轮换、版本升级策略，以及核心插件的兼容性检查。

### 12.2 etcd 备份观念

etcd 保存 Kubernetes 集群状态。备份必须：

- 从健康成员获取一致快照；
- 安全保存证书和加密配置；
- 异地保存并校验；
- 在隔离集群演练恢复；
- 记录 Kubernetes/etcd 版本和恢复顺序。

只有“有 snapshot 文件”不等于“可恢复”。

### 12.3 CNI 与 Cilium

CNI 负责 Pod 网络接入。Cilium 利用 eBPF 提供网络、策略和可观测能力，也可以替代 kube-proxy，但这不是默认必须项。替换 kube-proxy 会影响集群关键数据路径，需根据内核、发行版、Kubernetes/Cilium 版本和负载均衡需求评估。

当前配置使用布尔值：

```bash
helm install cilium cilium/cilium \
  --version <经过验证的版本> \
  --namespace kube-system \
  --set kubeProxyReplacement=true \
  --set k8sServiceHost=<API_SERVER_IP_OR_DNS> \
  --set k8sServicePort=6443
```

原示例中的 `kubeProxyReplacement=strict` 已不是当前文档推荐参数值。若建立无 kube-proxy 集群，需要确保 Cilium 在 kube-proxy 缺席时仍能到达 API Server；迁移已有集群则应使用官方迁移流程，不能直接删除 kube-proxy。

验证：

```bash
cilium status --wait
cilium connectivity test
kubectl -n kube-system get pods -o wide
```

### 12.4 NetworkPolicy：默认拒绝再按需开放

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-ingress
  namespace: production
spec:
  podSelector: {}
  policyTypes: [Ingress]
```

策略是否生效取决于 CNI 实现。实施 default-deny 前先枚举 DNS、监控、镜像拉取、控制面和业务依赖流量，分阶段推进并准备应急入口。

### 12.5 StatefulSet 与持久卷

StatefulSet 提供稳定 Pod 名称、有序行为和每副本 PVC 模板，适合需要稳定身份/存储的应用；但它不会自动把单机数据库变成高可用数据库。

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: redis
spec:
  serviceName: redis-headless
  replicas: 3
  selector:
    matchLabels:
      app: redis
  template:
    metadata:
      labels:
        app: redis
    spec:
      containers:
        - name: redis
          image: redis:<validated-version>
          volumeMounts:
            - name: data
              mountPath: /data
  volumeClaimTemplates:
    - metadata:
        name: data
      spec:
        accessModes: ["ReadWriteOnce"]
        storageClassName: fast-csi
        resources:
          requests:
            storage: 20Gi
```

删除 StatefulSet 通常不会自动删除其 PVC，这是数据保护设计，也意味着实验清理要明确处理遗留卷。

### 12.6 调度、弹性与中断

- Pod anti-affinity / topology spread：让副本跨节点或可用区；
- PodDisruptionBudget：限制自愿中断时同时不可用副本数；
- HPA：基于指标调副本；
- Cluster Autoscaler/Karpenter 类组件：调节点；
- priorityClass：资源紧张时表达优先级。

PDB 不能保护节点断电等非自愿中断，也不能替代足够副本和跨故障域设计。

### 12.7 云原生阶段故障演练

至少演练：

1. 删除一个应用 Pod，观察 Deployment 恢复；
2. readiness 失败，观察端点摘除；
3. 节点 drain，观察 PDB 与调度；
4. 制造 PVC Pending，使用事件定位 StorageClass/容量问题；
5. 制造镜像拉取失败，定位 tag、认证和网络；
6. 恢复一次 etcd 快照到隔离环境。

---

# 第五阶段：GitOps 与全栈可观测（第 19～21 周）

## 第 13 章：CI/CD、安全门禁与 Argo CD

### 13.1 一条可信交付链

```text
代码提交
  → 格式/单元测试
  → SAST/依赖/Secret 扫描
  → 构建镜像
  → SBOM/漏洞扫描/签名
  → 更新部署仓库中的镜像 digest
  → Argo CD 同步
  → 健康检查/指标观察
```

CI 负责验证和产出制品；CD/GitOps 负责把经过批准的期望状态交付到环境。流水线不要把长期集群管理员凭据放在变量里。

### 13.2 GitLab CI 示例

```yaml
stages: [test, build, scan, publish]

variables:
  IMAGE: "$CI_REGISTRY_IMAGE:$CI_COMMIT_SHA"

unit_test:
  stage: test
  image: golang:<validated-version>
  script:
    - go test ./...

build_image:
  stage: build
  script:
    - docker build --pull -t "$IMAGE" .
    - docker push "$IMAGE"

container_scan:
  stage: scan
  image:
    name: aquasec/trivy:<pinned-version>
    entrypoint: [""]
  script:
    - trivy image --exit-code 1 --severity CRITICAL --ignore-unfixed "$IMAGE"

publish_digest:
  stage: publish
  script:
    - docker inspect --format='{{index .RepoDigests 0}}' "$IMAGE"
  rules:
    - if: '$CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH'
```

生产实现还应：

- 固定 CI 镜像版本/digest；
- 缓存并镜像漏洞数据库，处理限流和离线环境；
- 输出机器可读报告和 SBOM；
- 对例外设置负责人、原因和到期时间；
- 高危漏洞门禁结合“是否有修复版本”和业务风险，不永久忽略；
- 保护默认分支、tag 和生产环境；
- 使用短期身份（OIDC/工作负载身份）访问云资源。

GitLab 也提供集成的容器扫描模板，实际采用手写 Trivy 还是平台模板，应根据许可证、报告展示、离线环境和统一策略决定。

### 13.3 GitOps 仓库结构

```text
deployments/
├── base/demo-api/
│   ├── deployment.yaml
│   ├── service.yaml
│   └── kustomization.yaml
└── overlays/
    ├── staging/
    └── production/
```

应用源码仓库负责构建不可变镜像；部署仓库记录各环境使用的精确 digest。生产变更通过合并请求评审，形成审计轨迹。

### 13.4 Argo CD Application

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: demo-api-production
  namespace: argocd
spec:
  project: production
  source:
    repoURL: https://git.example.com/platform/deployments.git
    targetRevision: main
    path: overlays/production
  destination:
    server: https://kubernetes.default.svc
    namespace: production
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
      - CreateNamespace=true
```

- `selfHeal`：集群实际状态偏离 Git 时尝试恢复；
- `prune`：Git 中删除对象后，允许自动删除集群对象；
- 两者都有破坏能力，应配合 AppProject 资源范围、RBAC、保护注解和环境晋级流程；
- 自动同步开启时，回滚通常应通过 Git revert 或修复提交表达，而不是留下未入库的手工状态。

### 13.5 漂移演示

```bash
kubectl -n production scale deployment demo-api --replicas=1
argocd app get demo-api-production
kubectl -n production get deployment demo-api -w
```

观察 self-heal 恢复 Git 声明的副本数。紧急调试前若必须暂停自动同步，需要事故负责人授权、记录时间，并在结束后把最终状态回写 Git、恢复同步。

### 13.6 Secret 与 GitOps

绝不能把 Base64 编码的明文 Secret 当作安全内容提交 Git。可选模式：

- External Secrets：Git 保存引用，Secret 从 Vault/云密钥服务同步；
- SOPS：加密文件可入库，解密密钥由受控身份持有；
- Sealed Secrets：公钥加密后提交，集群控制器解密。

无论哪种方案，都需要密钥轮换、最小权限、审计、备份和泄露响应。

### 13.7 发布策略

滚动、蓝绿、金丝雀不是按钮，而是风险策略：

- 定义业务成功指标和技术护栏；
- 小比例流量开始；
- 观察错误率、延迟、饱和度和业务转化；
- 自动或人工判断继续/停止；
- 能在数分钟内回到稳定版本；
- 数据库和消息格式保持新旧版本兼容。

---

## 第 14 章：Prometheus、Loki 与告警工程

### 14.1 可观测性的三个支柱

| 信号 | 擅长回答 | 不擅长回答 |
|---|---|---|
| Metrics | 趋势、阈值、聚合、告警 | 单个请求的完整细节 |
| Logs | 离散事件、错误上下文 | 低成本长期高维聚合 |
| Traces | 一次请求跨服务路径 | 宏观容量趋势 |

工具不是目标。目标是缩短发现时间（MTTD）和恢复时间（MTTR），同时避免无效告警消耗值班人员。

### 14.2 RED 与 USE 方法

面向请求驱动服务使用 RED：

- Rate：请求速率；
- Errors：错误率；
- Duration：延迟分布。

面向资源使用 USE：

- Utilization：利用率；
- Saturation：饱和度/排队；
- Errors：错误。

### 14.3 指标类型

- Counter：只增不减，如请求总数；重启可归零，使用 `rate()`；
- Gauge：可增可减，如队列长度、温度；
- Histogram：按 bucket 记录分布，可聚合估算分位数；
- Summary：客户端计算分位数，跨实例聚合受限。

PromQL 示例：

```promql
# 5 分钟请求速率
sum by (service) (rate(http_requests_total[5m]))

# 5xx 错误比例
sum(rate(http_requests_total{status=~"5.."}[5m]))
/
sum(rate(http_requests_total[5m]))

# 95 分位延迟（Histogram）
histogram_quantile(
  0.95,
  sum by (le, service) (rate(http_request_duration_seconds_bucket[5m]))
)
```

分母可能为零时应结合查询语义处理，避免产生 NaN 或误报。

### 14.4 标签基数是容量核心

每一种唯一标签组合都是一条时间序列。把 `user_id`、订单号、完整 URL、随机 UUID、时间戳放进 label，会造成基数爆炸。

```text
谨慎：method, status_code, route, region
禁止：user_id, request_id, raw_url, session_id, timestamp
```

请求 ID 应进入日志/Trace，而不是指标标签。路由使用模板 `/users/:id`，不要使用真实 `/users/123456`。

### 14.5 告警应当可行动

```yaml
groups:
  - name: demo-api
    rules:
      - alert: DemoApiHighErrorRate
        expr: |
          sum(rate(http_requests_total{service="demo-api",status=~"5.."}[5m]))
          /
          sum(rate(http_requests_total{service="demo-api"}[5m])) > 0.05
        for: 10m
        labels:
          severity: page
        annotations:
          summary: "demo-api 5xx ratio is above 5%"
          runbook_url: "https://runbooks.example.com/demo-api/high-error-rate"
```

好告警包含：影响、持续时间、当前值、相关仪表盘、变更链接、Runbook 和责任团队。能自动恢复且无用户影响的短暂抖动，通常不应叫醒人。

更成熟的服务使用 SLI/SLO 和错误预算进行多窗口、多燃烧率告警，避免只凭单点 CPU 阈值判断事故。

### 14.6 Loki 日志设计

日志标签与 Prometheus 标签同样要低基数。适合 Loki label：应用、环境、集群、namespace、日志级别；request ID、用户 ID 和错误详情放在日志正文，查询时解析。

结构化日志示例：

```json
{
  "timestamp": "2026-09-04T12:00:00Z",
  "level": "error",
  "service": "checkout",
  "trace_id": "abc123",
  "event": "payment_timeout",
  "duration_ms": 3012
}
```

禁止记录密码、Authorization、支付卡数据和不必要的个人信息。建立采样、脱敏、保留期与访问审计。

### 14.7 一次真实排错串联

1. 告警显示 checkout 5xx 燃烧率升高；
2. 仪表盘确定错误集中在一个 region 和版本；
3. 从 exemplar/trace 找到慢请求；
4. 用 `trace_id` 查询结构化日志；
5. 发现新版本连接池耗尽；
6. 回退部署并验证 SLI 恢复；
7. 补充容量测试、连接池指标和发布门禁。

---

# 第六阶段：AIOps 与平台工程（第 22～24 周）

## 第 15 章：K8sGPT 辅助诊断

### 15.1 正确定位

K8sGPT 的分析器先检查 Kubernetes 资源和常见问题；只有使用 `--explain` 时才会把诊断上下文交给配置的 AI 后端解释。它是只读诊断助手，不会自动修复集群，也不能替代 Kubernetes 基础知识、监控、安全扫描和人工变更评审。

### 15.2 安装与最小使用

安装方式随平台和版本变化，优先查官方发布页并验证校验和。通用流程：

```bash
k8sgpt version
k8sgpt auth list
k8sgpt auth add --backend openai
k8sgpt analyze
k8sgpt analyze --explain --with-doc
```

针对 namespace 和资源：

```bash
k8sgpt analyze --filter=Pod --namespace=demo
k8sgpt analyze --explain --filter=Service --output=json --anonymize
```

不要在命令行历史中直接写 API key。使用安全输入、环境注入或企业 Secret 管理方案，并限制配置文件权限。

### 15.3 隐私边界

`--anonymize` 可以掩码部分 Kubernetes 对象名称和标签，但不能假定它能清理所有内容。官方项目说明特别提示，某些分析器和事件消息可能不被完全掩码。生产使用前必须：

1. 明确哪些内容会发送到外部模型；
2. 限制 ServiceAccount 只读权限和 namespace 范围；
3. 禁止发送 Secret、完整日志、用户数据与凭据；
4. 评估企业合规、数据驻留和供应商留存策略；
5. 必要时使用企业网关或内网本地模型；
6. 对 AI 建议进行命令级人工审核。

### 15.4 AI 输出验证协议

对每条建议追问：

- 它引用了哪些可观察事实？
- 是否与 `kubectl describe`、events、logs 和 metrics 一致？
- 命令是只读还是会修改状态？
- 作用范围是一个 Pod、一个 namespace 还是全集群？
- 有备份和回滚吗？
- 建议是否适用于当前 Kubernetes/CNI/云版本？

禁止直接复制执行包含 `delete`、`patch`、`cordon`、`drain`、`scale` 或权限变更的 AI 命令。

### 15.5 实验：CrashLoopBackOff

1. 部署一个缺少必需环境变量而退出的 Pod；
2. 先人工收集 `describe`、当前日志、`--previous` 日志和事件；
3. 再运行 K8sGPT，不带 `--explain` 查看分析器结果；
4. 在非敏感实验 namespace 使用匿名化解释；
5. 对比人工根因和 AI 说明；
6. 修复清单、滚动发布并验证重启计数停止增长。

---

## 第 16 章：Backstage 与内部开发者平台

### 16.1 平台工程解决什么

平台团队不是把所有工具再包一层 UI，而是提供被产品化的“铺好路的路径”（Golden Path）：让开发团队能以低认知负担、安全地完成常见操作，同时允许必要的高级出口。

```text
开发者门户
├── 软件目录：有什么、谁负责、依赖谁
├── 软件模板：如何创建合规新服务
├── TechDocs：文档与代码同行
├── 插件：CI、K8s、告警、成本、质量
└── 权限与审计：谁能执行哪些自助操作
```

### 16.2 先做服务目录

`catalog-info.yaml` 示例：

```yaml
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: demo-api
  description: Demonstration API for the Ops course
  annotations:
    backstage.io/techdocs-ref: dir:.
spec:
  type: service
  lifecycle: production
  owner: group:platform-team
  system: demo-commerce
  providesApis:
    - demo-api
```

目录质量的关键不是条目数量，而是 owner 是否真实、元数据是否自动更新、离职/组织变化如何治理、是否能从事故快速找到责任团队和 Runbook。

### 16.3 软件模板

```yaml
apiVersion: scaffolder.backstage.io/v1beta3
kind: Template
metadata:
  name: secure-service
  title: Secure service golden path
  description: Create a service with CI, observability and documentation
spec:
  owner: group:platform-team
  type: service
  parameters:
    - title: Service information
      required: [name, owner]
      properties:
        name:
          title: Service name
          type: string
          pattern: '^[a-z][a-z0-9-]+$'
        owner:
          title: Owning team
          type: string
  steps:
    - id: fetch
      name: Render service skeleton
      action: fetch:template
      input:
        url: ./skeleton
        values:
          name: ${{ parameters.name }}
          owner: ${{ parameters.owner }}
    - id: publish
      name: Publish repository
      action: publish:gitlab
      input:
        repoUrl: gitlab.example.com?owner=services&repo=${{ parameters.name }}
    - id: register
      name: Register component
      action: catalog:register
      input:
        repoContentsUrl: ${{ steps['publish'].output.repoContentsUrl }}
        catalogInfoPath: /catalog-info.yaml
```

动作 ID 使用 camelCase 或不含连字符的简单名称，避免模板表达式把连字符解析为减法。先用 Template Editor/dry-run 验证，再向真实仓库和生产系统开放。

### 16.4 一个合格模板应自带什么

- README、TechDocs 和 owner；
- 单元测试、代码规范和依赖更新；
- CI/CD、镜像扫描、SBOM；
- 健康检查、资源 requests、探针和安全上下文；
- 指标、结构化日志、基础仪表盘与告警；
- 部署 overlay 与 GitOps Application；
- Runbook、SLO、值班与数据分级；
- 成本标签、保留策略和下线流程。

不要让模板直接“静默买服务器并上生产”。高成本或高风险动作需要配额、策略校验、预览、审批、审计、幂等和补偿/回滚。

### 16.5 衡量平台是否成功

不要只统计门户访问量。更有意义的指标：

- 从想法到首个可部署版本的时间；
- 新服务达到安全基线的比例；
- 开发团队自助完成任务的成功率；
- 平台支持工单数量和解决时间；
- 变更失败率、部署频率、恢复时间；
- 开发者满意度与认知负担；
- Golden Path 采用率以及退出路径的原因。

### 16.6 平台产品迭代

1. 访谈开发团队，挑选频率高、痛点大、模式稳定的场景；
2. 从一个服务模板和目录开始；
3. 找 1～2 个真实团队试用；
4. 观察失败步骤和人工绕路；
5. 自动化守护栏而不是堆积表单；
6. 提供版本升级和模板迁移；
7. 明确服务等级、责任边界和反馈入口。

---

# 第七阶段：综合通关与生产值班方法

## 第 17 章：故障响应、复盘与容量治理

### 17.1 事故响应角色

- Incident Commander：协调优先级、决策和资源；
- Operations Lead：执行技术调查与恢复；
- Communications Lead：对内外同步事实与影响；
- Scribe：维护时间线、命令和结论。

小团队可兼任，但责任必须清楚。事故现场最重要的是恢复服务和控制风险，不是寻找责任人。

### 17.2 前 15 分钟

```text
0～2 分钟：确认告警真实、声明事故、建立沟通频道
2～5 分钟：界定用户影响、范围、开始时间、最近变更
5～10 分钟：指定负责人，冻结非必要变更，提出最可能假设
10～15 分钟：选择最低风险缓解动作，持续验证用户指标
```

### 17.3 证据优先

每次操作记录：

```text
时间：14:03 UTC
操作者：Alice
假设：新版本导致连接池耗尽
证据：错误率只在 v2 Pod；数据库连接数达到上限
动作：将 v2 流量从 10% 调为 0%
预期：5xx 在 5 分钟内下降
结果：14:06 错误率恢复到基线
```

不要一边随机重启一边丢失现场。重启可能缓解症状，也可能清空关键证据。

### 17.4 Runbook 模板

```markdown
# 告警名称

## 用户影响
## 触发条件与可能原因
## 仪表盘和日志入口
## 只读诊断步骤
## 缓解步骤
## 风险和停止条件
## 回滚步骤
## 验证恢复
## 升级联系人
```

Runbook 中的命令要写清环境、namespace、资源名占位符和预期输出，不提供模糊的全局删除命令。

### 17.5 无责复盘

复盘包括：

- 客观影响和持续时间；
- 精确时间线；
- 触发因素与促成条件；
- 哪些防线生效、哪些失败；
- 为什么检测/缓解花了这么久；
- 带 owner、优先级、截止日期的行动项；
- 如何验证行动项真正降低复发概率。

“工程师操作失误”不是充分根因。继续追问：为什么单个操作能造成大范围影响？为什么没有预览、双人审批、自动校验、渐进发布或快速回滚？

### 17.6 容量与可靠性

容量计划至少考虑：

- 正常峰值、季节性、增长率；
- 单实例吞吐与延迟曲线；
- 失去一个故障域后的剩余容量；
- 下游限额、连接池、队列和磁盘；
- 扩容生效时间；
- 成本上限和降级策略。

平均值会隐藏峰值。使用分位数、并发、饱和度和业务单位成本建立模型，并用压测、故障注入和真实流量回放验证。

---

## 第 18 章：24 周最终项目

### 18.1 项目目标

交付一个可从零重建、可发布、可观测、可恢复的示例服务平台：

```text
Terraform 创建基础设施
  → Ansible 配置基础系统
  → CI 构建/测试/扫描/签名镜像
  → GitOps 更新环境
  → Kubernetes 运行服务
  → Prometheus/Loki 观察
  → K8sGPT 辅助诊断
  → Backstage 提供目录和模板
```

### 18.2 必交成果

- 架构图和数据流；
- 威胁模型与 Secret 管理方式；
- Terraform 模块、远程状态设计；
- Ansible Role 和幂等测试；
- 非 root 多阶段镜像与 SBOM；
- Kubernetes 清单、探针、资源、PDB、网络策略；
- CI/CD 与 GitOps 晋级流程；
- SLI/SLO、仪表盘、告警和 Runbook；
- 备份恢复记录；
- 一次故障演练时间线和复盘；
- Backstage 服务条目与模板原型。

### 18.3 评分表（100 分）

| 维度 | 分值 | 核心标准 |
|---|---:|---|
| 可复现性 | 15 | 新环境按文档可重建 |
| 安全性 | 15 | 最小权限、Secret、扫描、审计 |
| 可靠性 | 15 | 高可用、优雅退出、故障域 |
| 可观测性 | 15 | 指标日志清晰、告警可行动 |
| 自动化质量 | 15 | 幂等、校验、预演、错误处理 |
| 恢复能力 | 15 | 真实完成备份恢复和回滚 |
| 文档与表达 | 10 | 架构、Runbook、复盘易懂 |

### 18.4 通关答辩问题

1. 如果 GitOps 仓库不可用，现有业务会怎样？
2. 如果一个可用区消失，剩余容量够吗？
3. 如果状态文件泄露，需要轮换哪些凭据？
4. 如何证明备份可恢复，而不是只有文件？
5. 为什么这个告警必须叫醒人？
6. AI 诊断发送了哪些数据，如何验证隐私？
7. 数据库 schema 如何与应用回滚兼容？
8. Golden Path 给开发者减少了哪些认知负担？

---

# 附录 A：通用排错速查表

## 系统变慢

```bash
uptime
top
vmstat 1 10
pidstat 1 10
iostat -xz 1 10
free -h
df -hT
df -i
```

先区分 CPU、内存、I/O、锁等待、外部依赖还是应用级问题。Load Average 包含不可中断睡眠任务，不能简单等同于 CPU 使用率。

## 服务失败

```bash
systemctl status <service> --no-pager
journalctl -u <service> -b -n 200 --no-pager
systemctl cat <service>
systemctl show <service>
```

## 端口不通

```bash
ss -lntup
curl -v --connect-timeout 3 http://127.0.0.1:<port>/healthz
firewall-cmd --list-all
tcpdump -ni any 'tcp port <port>'
```

## 磁盘满

```bash
df -hT
df -i
du -xhd1 /var | sort -h
lsof +L1
journalctl --disk-usage
```

## Kubernetes Pod 异常

```bash
kubectl get pod <pod> -o wide
kubectl describe pod <pod>
kubectl logs <pod> --all-containers
kubectl logs <pod> --all-containers --previous
kubectl get events --sort-by=.metadata.creationTimestamp
kubectl get endpointslices
```

---

# 附录 B：安全变更检查单

## 变更前

- [ ] 明确目标、范围、负责人、维护窗口。
- [ ] 评估用户影响和最坏情况。
- [ ] 已备份配置/数据并验证可用。
- [ ] 有可执行回滚方案和停止条件。
- [ ] 在测试环境验证。
- [ ] 生产目标经过二次确认。
- [ ] 相关监控、日志、沟通频道已就绪。

## 变更中

- [ ] 分批执行，一次只改变一个变量。
- [ ] 记录时间、命令、输出和判断。
- [ ] 每一步都验证技术指标和用户指标。
- [ ] 异常达到停止条件时立即暂停或回滚。

## 变更后

- [ ] 健康检查、错误率、延迟、容量正常。
- [ ] 没有新高优先级日志和告警。
- [ ] 配置已进入版本库/期望状态系统。
- [ ] 临时权限、调试开关和旁路已撤销。
- [ ] 更新文档并安排延迟观察。

---

# 附录 C：术语表

| 术语 | 简明解释 |
|---|---|
| Idempotency | 幂等；重复执行仍收敛到同一目标状态 |
| Drift | 漂移；实际状态偏离代码声明状态 |
| RTO | 故障后允许多长时间恢复服务 |
| RPO | 最多允许丢失多长时间范围的数据 |
| SLI | 实际测量的服务可靠性指标 |
| SLO | 对 SLI 设定的可靠性目标 |
| Error Budget | 目标允许的不可靠额度 |
| Golden Path | 平台提供的推荐、低摩擦、带护栏路径 |
| Cardinality | 标签组合形成的唯一时间序列数量 |
| Blast Radius | 一次故障或变更可能影响的范围 |
| Toil | 重复、手工、可自动化、随规模线性增长的工作 |

---

# 附录 D：推荐学习与验证方式

## 建立个人实验仓库

```text
linux-ops-labs/
├── notes/
├── scripts/
├── ansible/
├── terraform/
├── containers/
├── kubernetes/
├── runbooks/
└── postmortems/
```

每次实验写下：目标、环境、操作、预期、实际、证据、问题、恢复、结论。一个能解释失败原因的实验，比十次不理解的成功复制更有价值。

## 版本变化处理

Linux、Kubernetes、Terraform、Cilium、GitLab、Argo CD 和 K8sGPT 都快速迭代。执行课程命令前：

1. 记录当前版本；
2. 查官方安装矩阵与发行说明；
3. 固定已验证版本；
4. 在实验环境升级；
5. 重新运行回归、连通性、备份恢复和回滚测试。

---

# 参考资料

以下资料用于校验本教程中的关键事实；技术版本变化时，以对应项目的当前官方文档为准。

- [Multipass 官方文档：镜像与自定义镜像](https://documentation.ubuntu.com/multipass/latest/explanation/image/)
- [Multipass 官方安装指南](https://documentation.ubuntu.com/multipass/en/latest/how-to-guides/install-multipass)
- [Red Hat Enterprise Linux 9：文件系统管理](https://docs.redhat.com/en/documentation/red_hat_enterprise_linux/9/html-single/managing_file_systems/managing_file_systems)
- [Docker 官方文档：多阶段构建](https://docs.docker.com/build/building/multi-stage/)
- [Docker 官方文档：构建最佳实践](https://docs.docker.com/build/building/best-practices/)
- [Kubernetes 官方文档：kubeadm 高可用集群](https://kubernetes.io/docs/setup/production-environment/tools/kubeadm/high-availability/)
- [Kubernetes 官方文档：StatefulSet](https://kubernetes.io/docs/concepts/workloads/controllers/statefulset/)
- [Cilium 官方文档：无 kube-proxy 部署](https://docs.cilium.io/en/stable/network/kubernetes/kubeproxy-free/)
- [Ansible 官方文档：Check Mode 与 Diff Mode](https://docs.ansible.com/projects/ansible-core/devel/playbook_guide/playbooks_checkmode.html)
- [Terraform 官方文档：State](https://developer.hashicorp.com/terraform/language/state)
- [Terraform 官方文档：S3 Backend 与锁](https://developer.hashicorp.com/terraform/language/backend/s3)
- [Terraform 官方文档：依赖锁文件](https://developer.hashicorp.com/terraform/language/files/dependency-lock)
- [GitLab 官方文档：Container Scanning](https://docs.gitlab.com/user/application_security/container_scanning/)
- [Argo CD 官方文档：Automated Sync Policy](https://argo-cd.readthedocs.io/en/stable/user-guide/auto_sync/)
- [Prometheus 官方文档：Instrumentation 与标签基数](https://prometheus.io/docs/practices/instrumentation/)
- [Prometheus 官方文档：The Zen of Prometheus](https://prometheus.io/docs/practices/the_zen/)
- [K8sGPT 官方项目与 CLI 示例](https://github.com/k8sgpt-ai/k8sgpt)
- [K8sGPT 隐私指南](https://docs.k8sgpt.ai/reference/guidelines/privacy/)
- [Backstage 官方文档：Software Templates](https://backstage.io/docs/features/software-templates/)
- [Backstage 官方文档：添加模板](https://backstage.io/docs/features/software-templates/adding-templates/)

---

## 结语

Ops 能力不是记住最多命令，而是在压力下仍能做到：先界定影响、用证据判断、缩小变更范围、随时能够回滚、恢复后留下更可靠的系统。完成这 24 周后，继续保留实验、复盘和自动化的习惯，你会从“会操作 Linux”逐渐成长为“能对生产结果负责”的工程师。
