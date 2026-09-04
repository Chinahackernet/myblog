# KVM、QEMU 与 libvirt 架构

## 1. 技术分层

KVM 是 Linux 内核中的硬件辅助虚拟化能力；QEMU 提供虚拟硬件和设备模型；libvirt 提供统一的管理 API，`virsh` 是其命令行客户端。生产环境通常通过 libvirt 管理 QEMU/KVM，而不是直接长期运行裸 QEMU 进程。

```text
管理工具（virsh / virt-manager / API）
              ↓
libvirt（权限、网络、存储、生命周期）
              ↓
QEMU（虚拟 CPU、内存、磁盘、网卡）
              ↓
KVM + Linux 内核 + CPU 虚拟化扩展
```

## 2. 能力检查

```bash
egrep -o 'vmx|svm' /proc/cpuinfo | sort -u
lsmod | grep kvm
virt-host-validate
```

若没有 `vmx`/`svm`，检查 BIOS/UEFI 的 Intel VT-x 或 AMD-V；云主机还要确认嵌套虚拟化是否开放。

## 3. 资源模型

虚拟机的 vCPU、内存、磁盘和网卡都属于可调度资源。超分配必须基于监控数据，不能把 vCPU 数量当成物理 CPU 数量；内存气球、NUMA、CPU pinning 和 hugepages 只在明确的性能场景下启用。

## 4. 生产边界

虚拟机 XML、磁盘映像、网络定义和密钥都属于基础设施配置，应纳入版本管理，但不得提交密码和私钥。迁移、快照和磁盘扩容前必须确认存储后端是否支持以及业务一致性要求。
