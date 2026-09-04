# KVM/libvirt 生产架构：bridge、cloud-init 与生命周期

## 目标与边界

本章建立一套可审计的 KVM 主机模型：libvirt 负责生命周期和权限，QEMU 负责设备模拟，KVM 内核模块负责硬件虚拟化。目标不是“启动一台虚拟机”，而是让实例具备可重复创建、可观测、可回滚和可迁移的属性。

## 架构决策

```text
租户/API → libvirt socket → QEMU → KVM ioctl → CPU/内存
                         ├─ bridge/VLAN → 物理网络
                         ├─ storage pool → qcow2/LVM/Ceph
                         └─ cloud-init → guest 首次启动配置
```

生产环境分离管理、存储和业务网络。桥接模式适合真实地址、VRRP 和高吞吐；NAT 仅适合隔离实验。宿主机根分区不得与虚拟机数据争抢 I/O，镜像、网络定义和 XML 必须版本化备份。

## 宿主机基线

```bash
egrep -o 'vmx|svm' /proc/cpuinfo | sort -u; lsmod | grep '^kvm'; virt-host-validate qemu; virsh -c qemu:///system list --all
```

时间同步、内核、固件、微码和 CPU 漏洞缓解应纳入基线。生产存储至少采用 RAID 或分布式副本，并监测 SMART、延迟和错误计数。

## Linux bridge 与 VLAN

先创建桥，再将物理接口作为从属接口；不要在远程 SSH 会话中直接删除当前连接。

```bash
nmcli con add type bridge ifname br-prod con-name br-prod ipv4.method manual ipv4.addresses 192.0.2.10/24 ipv4.gateway 192.0.2.1; nmcli con add type ethernet ifname eno1 master br-prod con-name br-prod-slave; nmcli con up br-prod
```

libvirt 网络定义应明确桥名、转发模式和 VLAN 策略。验证时同时检查 `bridge link`、交换机端口 VLAN、MTU、ARP/邻居表和 guest 默认路由；仅看到网卡 UP 不代表二层可达。

## cloud-init 可重复初始化

镜像、用户数据和网络数据分离。密码和令牌通过 secret store 注入，禁止提交私钥。

```yaml
#cloud-config
users:
  - name: ops
    groups: [wheel]
    sudo: ["ALL=(ALL) NOPASSWD:ALL"]
    ssh_authorized_keys: ["ssh-ed25519 AAAA..."]
package_update: true
packages: [qemu-guest-agent, chrony]
runcmd: [systemctl enable --now qemu-guest-agent, systemctl enable --now chronyd]
```

首启验证 `cloud-init status --wait`、用户、主机名、时间和 SSH。重用镜像前执行 `cloud-init clean --logs --seed`，避免 machine-id、SSH host key 和租户元数据冲突。

## 生命周期与权限

```bash
virt-install --name app-01 --memory 8192 --vcpus 4 --disk pool=images,size=40,format=qcow2 --network network=prod,model=virtio --import --os-variant rockylinux9 --cloud-init user-data=user-data; virsh dominfo app-01; virsh domblklist app-01; virsh domifaddr app-01
```

统一使用 `qemu:///system`，通过 polkit/RBAC 给最小权限。禁止业务账号访问 QEMU monitor；每次变更保存 XML、审批单、验证证据和回滚命令。

## 故障与验收

| 现象 | 优先检查 | 安全恢复 |
| --- | --- | --- |
| 无地址 | bridge/VLAN、DHCP、guest agent | 临时切换隔离网络，不反复改生产桥 |
| 启动失败 | virtqemud 日志、磁盘权限、XML | 用上一个 XML `virsh define` 恢复 |
| I/O 陡升 | iostat、qcow2 链、存储路径 | 暂停快照合并，迁移非关键实例 |

验收包括宿主机重启恢复、网络/磁盘连通、时间同步、备份可读性、权限审计和监控告警。

## 实验：从模板到可回收实例

1. 对黄金镜像执行 `cloud-init clean`，生成版本号、校验和及 SBOM；镜像只读保存，禁止在运行中的模板上直接修改。
2. 用 user-data 注入主机名、SSH 公钥、NTP 和监控 agent，使用 network-config 固定网卡匹配规则，避免重启后接口顺序变化。
3. 创建实例后记录 XML、镜像 digest、VLAN、分配地址和创建人；以 `virsh dumpxml` 导出的 XML 作为审计事实，而不是凭记忆填写工单。
4. 回收实例前先撤销 DNS、凭据和监控，再销毁 domain；数据盘根据保留策略进入加密回收区，不能把含业务数据的 qcow2 直接丢弃。

## 设计评审问题

- 迁移时目标主机是否具备同版本 CPU feature、同名 bridge/VLAN 和相同安全策略？
- cloud-init 失败是否会让调度器把“已开机但不可用”误判为成功？
- 存储池损坏时，是否仍能从异地恢复镜像、XML 和网络定义？
- 业务需要真实 MAC、SR-IOV 或多队列时，是否明确了硬件绑定和迁移限制？

这些问题应在上线评审表中逐项给出证据；没有证据的“已配置”不能视为完成。
