# 构建 KVM 环境

## 实验目标

在 Rocky Linux 9 或 Ubuntu 24.04 上安装 KVM/libvirt，验证硬件虚拟化、默认网络和管理服务。

## 1. 安装组件

Rocky/AlmaLinux：

```bash
sudo dnf group install -y 'Virtualization Host'
sudo systemctl enable --now libvirtd
```

Ubuntu：

```bash
sudo apt update
sudo apt install -y qemu-kvm libvirt-daemon-system libvirt-clients virtinst bridge-utils
sudo systemctl enable --now libvirtd
```

## 2. 权限与验证

```bash
sudo usermod -aG libvirt,kvm $USER
virsh list --all
virsh net-list --all
virt-host-validate
```

重新登录使组权限生效。`virsh list --all` 能正常执行且没有权限错误，才算管理链路可用。

## 3. 网络选择

默认 NAT 网络适合实验；生产业务通常使用 Linux bridge 或 Open vSwitch，并由网络团队分配 VLAN、地址和网关。不要在远程主机上直接修改正在使用的管理网卡，先准备带外或控制台入口。

## 4. 验收清单

- KVM 内核模块已加载
- libvirt 服务开机启动
- 管理账号具备最小必要权限
- 默认网络状态为 active
- 虚拟机磁盘目录有容量、权限和备份策略
