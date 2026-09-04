# 🚀 Linux 从零基础到 Ops 大神全栈实战大通关课程标准教程

---

## 🟢 第一阶段：极简破冰与系统基石（第 1 - 4 周）

### 📑 第 1 章：进入 Linux 的世界与环境构建
#### 1.1 核心理论与技术栈
* **技术栈**：Rocky Linux 9、Multipass 轻量化虚拟机、SSH (Termius/Xshell)。
* **核心思维**：理解 Linux 纯命令行操作环境，消除对黑盒的恐惧。Linux 的核心哲学是“一切皆文件”。

#### 1.2 保姆级操作步骤
1. **安装 Multipass**（以 Windows 为例）：
   * 前往官方下载并安装 Multipass。
   * 打开 Terminal/PowerShell，执行以下命令快速创建一个 Rocky Linux 9 虚拟机：
     ```bash
     multipass launch --name linux-base rocky9
     ```
2. **连接与基础探索**：
   * 进入虚拟机内部终端：
     ```bash
     multipass shell linux-base
     ```
3. **配置 SSH 密钥对登录**：
   * 在宿主机生成密钥对：`ssh-keygen -t rsa -b 4096`
   * 将公钥内容追加到虚拟机的 `~/.ssh/authorized_keys` 中。
   * 修改 `/etc/ssh/sshd_config`，确保 `PasswordAuthentication no`（关闭密码登录以保障安全），随后重启服务：
     ```bash
     sudo systemctl restart sshd
     ```

#### 1.3 ⚠️ 避坑指南（讲师踩坑血泪史）
* **避坑点 1**：学员在 Windows 环境下使用 Multipass 可能会遇到 Hyper-V 或 VirtualBox 冲突，导致报错 `launch failed`。
  * **解决方案**：确保 Windows 功能中勾选了“虚拟机平台”和“Hyper-V”，若仍失败，可在管理员 PowerShell 下运行 `multipass set local.driver=hyperv` 并重启电脑。
* **避坑点 2**：修改 `sshd_config` 时切记**不要关闭当前连接窗口**！必须另外开一个新窗口测试 SSH 密钥是否能正常登录。一旦配错且断开，虚拟机将彻底无法远程连入。

---

### 📑 第 2 章：文件系统、终端魔法与文本神兵
#### 2.1 核心理论与技术栈
* **技术栈**：FHS 标准、文件管理命令（`mkdir`, `cp`, `mv`, `rm`）、现代替代工具（`bat`, `eza`, `ripgrep`）、Vim 编辑器、Linux 三剑客（`grep`, `sed`, `awk`）。

#### 2.2 保姆级操作步骤
1. **文件防灾备操作**：
   * 严禁直接使用 `rm -rf`。在系统 `.bashrc` 中为 `rm` 设置别名或安全提示：
     ```bash
     alias rm='rm -i'
     ```
2. **利用现代化工具替代老旧命令**：
   * 安装现代化替代工具（提高 200% 的命令行生产力）：
     ```bash
     # 使用 eza 代替 ls (带颜色与文件类型图标)
     eza -lah --icons
     # 使用 ripgrep 代替 grep (极其丝滑的高性能文本搜索)
     rg "ERROR" /var/log/
     ```
3. **Vim 肌肉记忆通关**：
   * 输入 `vim test.txt` 进入**命令模式**。
   * 按 `i` 进入**输入模式**进行编辑。
   * 按 `Esc` 退回命令模式，输入 `:wq` 保存退出。在命令模式下，使用 `dd` 删除整行，`yy` 复制整行，`p` 粘贴。
4. **三剑客生产线洗数实战**：
   * 使用 `awk` 提取 `/etc/passwd` 中的所有用户名：
     ```bash
     awk -F: '{print $1}' /etc/passwd
     ```

#### 2.3 ⚠️ 避坑指南
* **避坑点 1**：小白学员在使用 `sed -i` 批量修改配置文件时，常常因为正则表达式写错导致整份配置文件被改坏。
  * **解决方案**：强制要求学员在执行 `sed -i` 之前，先不加 `-i` 参数进行预览输出，或者强制加上备份后缀，如 `sed -i.bak 's/old/new/g' config.conf`。
* **避坑点 2**：在 Vim 异常断电或未正常关闭时，再次打开会报 `.swp` 文件已存在的警告。指导学员使用 `rm -f .*.swp` 清理隐藏的交换文件即可恢复。

---

### 📑 第 3 章：系统安全、用户权限与 Systemd 服务守护
#### 3.1 核心理论与技术栈
* **技术栈**：UGO 权限模型、ACL（访问控制列表）、Systemd 进程管理器。

#### 3.2 保姆级操作步骤
1. **高级权限 ACL 配置**：
   * 当特殊需求要求某个文件对特定第三方用户只读，而不改变 UGO 属组时：
     ```bash
     setfacl -m u:testuser:r-- secret.txt
     getfacl secret.txt
     ```
2. **手写 Systemd 服务脚本（实现服务死机自动重启）**：
   * 编写自定义脚本服务 `/etc/systemd/system/myservice.service`：
     ```ini
     [Unit]
     Description=My Custom Monitoring Service
     After=network.target

     [Service]
     Type=simple
     ExecStart=/usr/local/bin/my_monitor.sh
     Restart=always
     RestartSec=5

     [Install]
     WantedBy=multi-user.target
     ```
   * 重新加载配置并启动服务：
     ```bash
     sudo systemctl daemon-reload
     sudo systemctl enable --now myservice
     ```

#### 3.3 ⚠️ 避坑指南
* **避坑点 1**：自定义编写 Systemd 的 `ExecStart` 路径时，**必须填写绝对路径**（例如 `/usr/bin/python3`，不能直接写 `python3`），否则 Systemd 会因找不到环境变量路径而直接报错闪退。
* **避坑点 2**：很多学员混淆 `systemctl reload` 与 `systemctl restart`。`reload` 是无损平滑重载配置，`restart` 会直接中断当前长连接并重启进程。生产环境核心服务（如 Nginx、Gateway）切记优先使用 `reload`。

---

## 🔵 第二阶段：内功修炼与自动化效率革命（第 5 - 9 周）

### 📑 第 4 章：高级磁盘管理（LVM）与硬核网络排错
#### 4.1 核心理论与技术栈
* **技术栈**：LVM（逻辑卷管理器）、TCP/IP、`tcpdump`、`ss`。

#### 4.2 保姆级操作步骤
1. **LVM 线上动态无缝扩容**：
   * 创建物理卷与卷组：
     ```bash
     pvcreate /dev/sdb
     vgcreate data_vg /dev/sdb
     lvcreate -L 20G -n data_lv data_vg
     mkfs.xfs /dev/data_vg/data_lv
     ```
   * 线上容量不足时，直接动态扩容（不影响线上业务）：
     ```bash
     lvextend -L +10G /dev/data_vg/data_lv
     # 针对 XFS 文件系统执行在线扩容刷新
     xfs_growfs /dev/data_vg/data_lv
     ```
2. **硬核 TCP 网络流量抓包排查**：
   * 线上出现网络丢包或连接异常，抓取指定端口的 TCP 握手报文：
     ```bash
     tcpdump -i eth0 tcp port 80 -w http_traffic.pcap
     ```
   * 配合 `ss -ntlp` 快速查看当前哪些系统端口被占用、连接队列是否溢出。

#### 4.3 ⚠️ 避坑指南
* **避坑点 1**：在对 LVM 调整大小时，XFS 文件系统**只支持扩容，绝对不支持缩容**（缩小容量会导致数据彻底损坏）。如需缩容，必须使用 Ext4 文件系统，且需要先 `umount`。
* **避坑点 2**：修改 `/etc/fstab` 实现开机自动挂载磁盘时，如果配置参数写错或 UUID 复制错误，会导致 Linux 重启直接卡在紧急救援模式（Emergency Mode）。
  * **避坑神技**：修改完 `/etc/fstab` 后，**千万不要直接重启机器**！立即执行 `mount -a`，如果没有报错，才说明配置正确，可以安全重启。

---

### 📑 第 5 章：Shell 脚本工程化与 Python 自动化开发
#### 5.1 核心理论与技术栈
* **技术栈**：Bash 高级语法、生产级健壮性防线、Python `paramiko`、`requests` 库。

#### 5.2 保姆级操作步骤
1. **声明生产级工业健壮性 Shell 模板**：
   * 每一个学员编写的 Shell 脚本，头部必须强制加上三大工业安全伞：
     ```bash
     #!/usr/bin/env bash
     set -e          # 任何命令出错立即退出脚本，防止错误滚雪球
     set -u          # 遇到未定义变量直接报错，避免 rm -rf /$UNSET_VAR 导致清空根目录
     set -o pipefail # 管道符中任何一环出错，整行命令视作失败
     ```
2. **Python 自动化调用 API 清单示例**：
   * 编写 Python 自动化巡检或调用云厂商获取实例状态：
     ```python
     import requests
     response = requests.get("https://api.cloud.com/v1/instances", headers={"Authorization": "Bearer TOKEN"})
     print(response.json())
     ```

#### 5.3 ⚠️ 避坑指南
* **避坑点 1**：在写 Shell 循环或条件判断时，`if [ $name == "admin" ]` 如果变量 `$name` 为空，会直接报语法错误 `syntax error`。
  * **解决方案**：变量必须用双引号包裹，或者推荐使用现代的双中括号语法：`if [[ $name == "admin" ]]`，其天然具备容错性且支持逻辑与/或（`&&` / `||`）。

---

## 🟡 第三阶段：大规模集群配置与基础设施即代码（第 10 - 13 周）

### 📑 第 6 章：Nginx 高性能架构、Ansible 模块化与 Terraform 多云编排
#### 6.1 核心理论与技术栈
* **技术栈**：Nginx 反向代理与 epoll 调优、Ansible Roles、Terraform（HCL 语言）。

#### 6.2 保姆级操作步骤
1. **Nginx 基于 epoll 的高并发性能调优**：
   * 编辑 `/etc/nginx/nginx.conf`，优化连接数及事件模型：
     ```nginx
     events {
         use epoll;
         worker_connections 65535;
     }
     ```
2. **Ansible 一键集群编排构建**：
   * 使用标准的 `Ansible Roles` 目录结构（`tasks/`, `templates/`, `vars/`）。
   * 编写剧本，一键配置百台服务器的防火墙与基线安全策略：
     ```yaml
     - name: Setup secure baseline
       hosts: all
       roles:
         - common_security
     ```
3. **Terraform 一键买服务器基础设施 (IaC)**：
   * 编写 `main.tf` 声明基础设施：
     ```hcl
     resource "alicloud_instance" "web" {
       instance_name = "ops-prod-web"
       instance_type = "ecs.g6.large"
       image_id      = "rockylinux_9"
     }
     ```
   * 运行 `terraform init` 注入驱动，`terraform apply` 自动化创建。

#### 6.3 ⚠️ 避坑指南
* **避坑点 1**：在使用 Terraform 多人协同开发时，如果 `terraform.tfstate` 状态文件保存在学员本地，会导致团队状态冲突，覆写线上资源。
  * **大厂标准做法**：生产环境中必须配置远程状态后端（Remote Backend），将状态锁在阿里云 OSS 或 AWS S3 中，并启用 Redis/DynamoDB 分布式锁。
* **避坑点 2**：Ansible 执行大批量机器配置时速度极慢。可以通过开启 SSH 管道复用（Pipelining）以及开启 `Mitogen for Ansible` 插件，将执行速度提升 5 倍以上。

---

## 🟠 第四阶段：云原生微服务编排大通关（第 14 - 18 周）

### 📑 第 7 章：容器运行时底层机制与 Kubernetes 极速高可用构建
#### 7.1 核心理论与技术栈
* **技术栈**：Namespace、Cgroups、多阶段构建 (Multi-stage)、Kubeadm 高可用、Cilium eBPF 网络插件、Gateway API。

#### 7.2 保姆级操作步骤
1. **微服务 Dockerfile 极致瘦身（多阶段构建）**：
   * 严禁直接使用包含全套编译环境的轻量镜像作为线上产物。优雅示例：
     ```dockerfile
     # 阶段一：编译环境
     FROM golang:1.22 AS builder
     WORKDIR /app
     COPY . .
     RUN CGO_ENABLED=0 GOOS=linux go build -o main .

     # 阶段二：极简生产环境
     FROM gcr.io/distroless/static-debian12
     COPY --from=builder /app/main /main
     CMD ["/main"]
     ```
   * 这样打出来的镜像将从 800MB 骤降至十几 MB，无壳无多余工具，绝对安全。
2. **构建高可用 K8s 集群与部署 Cilium**：
   * 使用 `kubeadm init --control-plane-endpoint "lb.k8s.local:6443"` 接入高可用 VIP。
   * 抛弃传统过时的 kube-proxy，安装基于纯 **eBPF** 驱动的 **Cilium** 网络插件，获取极致的转发吞吐量：
     ```bash
     helm install cilium cilium/cilium --namespace kube-system        --set kubeProxyReplacement=strict
     ```

#### 7.3 ⚠️ 避坑指南
* **避坑点 1**：在 K8s 中部署有状态服务（如 Redis/MySQL）时，绝对不能直接使用普通的 Deployment，否则 Pod 一旦发生漂移或重启，宿主机上的本地数据会彻底丢失或卷冲突。
  * **解决方案**：必须使用 **StatefulSet**，并通过 CSI 接口挂载持久化存储卷（PV/PVC）。
* **避坑点 2**：容器内应用程序的 PID 1 问题。如果你的应用程序直接作为 Entrypoint 且不支持信号转发，当执行 `kubectl delete pod` 时，应用会无法接收到 `SIGTERM` 优雅关闭信号，直到 30 秒超时被强制 `SIGKILL` 杀死，导致线上流量发生短暂报错。
  * **解决方案**：在 Dockerfile 中首选使用 `tini` 作为初始化守护进程。

---

## 🔴 第五阶段：现代 GitOps 交付与全栈可观测性（第 19 - 21 周）

### 📑 第 8 章：GitLab CI/CD 安全防线、ArgoCD 落地与 Prometheus 观测
#### 8.1 核心理论与技术栈
* **技术栈**：GitLab CI/CD、Trivy 镜像安全扫描、ArgoCD GitOps、PromQL、Loki。

#### 8.2 保姆级操作步骤
1. **在 CI 流水线中嵌入 Trivy 安全熔断机制**：
   * 修改 `.gitlab-ci.yml`，在镜像打包完成后立即进行漏洞扫描，若发现严重高危漏洞（CRITICAL）直接阻断流水线不予发布：
     ```yaml
     container_scan:
       stage: test
       image: aquasec/trivy:latest
       script:
         - trivy image --exit-code 1 --severity CRITICAL registry.local/my-app:$CI_COMMIT_SHA
     ```
2. **ArgoCD 声明式托管微服务**：
   * 创建 ArgoCD 资源应用，实现应用配置的“防漂移”和自动同步：
     ```yaml
     apiVersion: argoproj.io/v1alpha1
     kind: Application
     metadata:
       name: microservice-prod
       namespace: argocd
     spec:
       syncPolicy:
         automated:
           prune: true
           selfHeal: true # 任何人如果在集群里手动改了配置，ArgoCD 会秒级将其强制恢复回 Git 的基线状态
     ```

#### 8.3 ⚠️ 避坑指南
* **避坑点 1**：**Prometheus 内存暴涨（OOM 崩溃）惨案**。由于线上业务微服务设计不当，将用户个人的 UserID 作为指标的 Label 写入了 Prometheus（例如 `http_requests_total{user_id="12345"}`）。这会导致 Prometheus 系统产生极其恐怖的**高基数（High Cardinality）数据**，内存会在几分钟内爆满崩溃。
  * **铁律**：严禁将任何高动态、无限且唯一的随机值（如 UserID、UUID、时间戳）作为 Prometheus 指标的 Label 标签。
* **避坑点 2**：ArgoCD 开启 `selfHeal`（自愈）后，如果线上需要紧急手动拉起临时配置进行调试，变更会被秒级抹除。调试时需要先在 ArgoCD 界面临时将同步模式调整为 Manual。

---

## 🔥 第六阶段：顶级 Ops 破局：AI 智能运维与平台工程（第 22 - 24 周）

### 📑 第 9 章：K8sgpt 智能大模型诊断与 Backstage 平台工程构建
#### 9.1 核心理论与技术栈
* **技术栈**：K8sgpt 算力诊断、Backstage (IDP 内部开发者平台)。

#### 9.2 保姆级操作步骤
1. **安装 K8sgpt 接入大模型辅助极速排错**：
   * 在集群中安装并授权 K8sgpt：
     ```bash
     brew install k8sgpt
     k8sgpt auth --backend openai --model gpt-4 --password "YOUR_API_KEY"
     ```
   * 当线上 K8s 出现大面积报错或 CrashLoopBackOff 时，一键让 AI 分析根因：
     ```bash
     k8sgpt analyze --explain --language Chinese
     ```
   * AI 将直接读取内核报错和容器事件，输出完美的中文故障根因与修复命令。
2. **构建 Backstage 一键式自助服务门户（IDP 平台工程落地）**：
   * 编写 Backstage 软件模板（Software Templates），开发人员只需在前端网页表格中输入项目名 `new-java-service`、选择规格并点击提交：
   * Backstage 会在后台静默调用预先编写好的 Terraform 脚本买好云服务器、调用 GitLab API 自动初始化包含安全扫描的 CI/CD 流水线，并自动在 ArgoCD 中注册托管。开发人员不需要懂一句 K8s YAML，实现“自服务架构”。

#### 9.3 ⚠️ 避坑指南
* **避坑点 1**：大模型（AI）辅助排错虽然极度高效，但在生产环境中，**严禁将包含公司核心机密、账号密码、或是敏感数据（如用户隐私日志）的报错上下文直接脱水上传到公共大模型 API**！
  * **安全避坑方案**：在企业落地 AIOps 时，必须配置 K8sgpt 的匿名化过滤器（Anonymize），或者直接在公司内网私有化本地部署 DeepSeek-R1 等开源大模型作为后端对接。
* **避坑点 2**：推行平台工程（Platform Engineering）和 Backstage 时，容易将其做成另一个复杂的配置系统。切记产品化思维，要多做减法，让开发人员在前端的操作选项越傻瓜、越简单越好。

---
