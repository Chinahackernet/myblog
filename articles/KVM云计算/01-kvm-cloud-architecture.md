# KVM 云计算架构：网络、内存、迁移与灾备

## 1. 设计边界与拓扑

KVM 生产平台至少区分管理网、存储网、迁移网和业务网。计算节点使用硬件虚拟化扩展（VT-x/AMD-V），libvirt 负责生命周期，QEMU 负责设备模型，Linux bridge 或 Open vSwitch 负责二层转发。迁移网必须与业务网隔离并限制来源，否则迁移内存流可能暴露敏感数据。

```text
管理网  10.10.0.0/24  bastion -> libvirt API
迁移网  10.10.1.0/24  compute-01 <-> compute-02
存储网  10.10.2.0/24  compute -> Ceph/NFS/iSCSI
业务网  10.10.3.0/24  VM bridge/VLAN
```

安装后先确认 CPU、IOMMU、libvirt 版本和桥接口，不要把物理接口直接当作业务地址使用：

```bash
egrep -wo 'vmx|svm' /proc/cpuinfo | sort -u
virt-host-validate qemu
virsh uri; virsh nodeinfo; virsh net-list --all
ip -br link; bridge link
```

## 2. Bridge、VLAN 与 cloud-init

桥接网络要求物理网卡作为 bridge port，IP 地址配置在 bridge 上；云平台通常为每个租户分配 VLAN 或 VXLAN。上线前验证 MTU、ARP、DHCP relay 和安全组，避免“虚机能出网但同网段互不通”的二层问题。

cloud-init 负责首次启动的用户、SSH 公钥、主机名、网络和磁盘初始化。镜像必须清除实例状态（如 `/var/lib/cloud/`），每次启动生成唯一 machine-id；不要把固定密码放在 user-data。

```yaml
# meta-data
instance-id: vm-001
local-hostname: app-01
```

```yaml
# user-data
#cloud-config
users:
  - name: ops
    groups: [wheel]
    sudo: ["ALL=(ALL) NOPASSWD:/usr/bin/systemctl,/usr/bin/journalctl"]
    ssh_authorized_keys:
      - ssh-ed25519 AAAA...replace-me
ssh_pwauth: false
package_update: true
runcmd:
  - [ systemctl, enable, --now, chronyd ]
```

验证要同时看 `cloud-init status --wait`、网络路由、SSH 公钥和日志；失败时读取 `cloud-init analyze blame` 与 `/var/log/cloud-init.log`，不要盲目重装镜像。

## 3. NUMA、CPU 与 hugepages

NUMA 主机上 vCPU、内存和设备应尽量绑定同一 NUMA 节点，跨节点访问会增加尾延迟。通过 `lscpu -e`、`numactl -H`、`virsh vcpupin` 和 `virsh numatune` 检查拓扑。数据库和 NFV 负载可使用 hugepages 降低页表开销，但会锁定宿主机内存并降低调度弹性，必须预留管理余量。

```bash
grep -i Huge /proc/meminfo
virsh domstats vm-001 --balloon --vcpu --memory
numastat -p $(pgrep qemu-system-x86_64 | head -1)
```

CPU model 要在集群能力与迁移兼容性之间取舍：`host-passthrough` 性能最好但迁移边界窄；稳定集群可定义统一 baseline。更改 CPU 模型前做应用兼容测试和回滚快照。

## 4. 在线迁移与停机条件

在线迁移分为预拷贝内存、重复脏页、短暂停机切换和目标端恢复。迁移前检查共享存储、CPU 兼容、目标剩余内存、时钟同步、网络带宽和设备直通限制。使用 TLS/SASL 或受限 SSH 通道，禁止将 libvirt 迁移端口暴露到公网。

```bash
virsh domjobinfo vm-001
virsh migrate --live --persistent --undefinesource \
  --copy-storage-all --tls vm-001 qemu+tls://compute-02/system
```

迁移失败常见原因：脏页速率高于网络复制速率、目标 CPU 不兼容、磁盘锁未释放、网桥名称不一致。先停止迁移并恢复源实例状态，再降低业务写入或提升迁移带宽；不要在未确认源/目标唯一运行时强制启动。

## 5. 快照链、备份与灾备

qcow2 外部快照形成 backing chain，链过长会放大随机 I/O 与恢复复杂度。快照不是备份：它依赖原始层、容易被误删，且不能替代跨故障域副本。策略是“短期快照用于回滚，定期合并；长期使用一致性备份/复制”。

```bash
qemu-img info --backing-chain vm-001.qcow2
virsh snapshot-create-as vm-001 pre-change --disk-only --atomic
qemu-img check --force-share vm-001.qcow2
```

数据库虚机必须先执行应用级冻结或备份，再做存储快照。灾备演练至少覆盖：单盘损坏、计算节点故障、存储域不可用、快照链损坏和跨区域恢复。记录 RPO、RTO、恢复顺序、DNS/VIP 切换和数据校验结果。

## 验收标准

- 新建虚机可通过 cloud-init 完成唯一身份、密钥登录和网络配置。
- 迁移前后 MAC、IP、磁盘数据和业务探针保持一致，迁移窗口与停顿时间有记录。
- NUMA/hugepages 配置有容量余量，宿主机不会因预留页耗尽而无法调度。
- 快照链可检测、可合并，且至少存在一份跨故障域可恢复备份。

