---
title: "Ubuntu 20.04 & 24.04 双网卡 Bond 配置指南"
---

**前言：在现代服务器管理中，网络的稳定性和可靠性至关重要。为了提高网络的冗余性和负载能力，我们经常需要配置多个网络接口以实现链路聚合或故障转移。Ubuntu系统自17.10版本起，引入了Netplan作为新的网络配置抽象化工具，它提供了一种简洁的YAML文件格式来管理网络配置。本指南旨在为Ubuntu 20.04和24.04用户提供一个详细的步骤说明，帮助您通过Netplan配置bonding（链路聚合）以及设置故障转移模式，确保网络的高可用性。**

**在本指南中，我们将从备份原始网络配置文件开始，逐步引导您编辑Netplan配置文件，应用新的网络设置，并验证配置的正确性。无论您是网络管理员还是系统管理员，本指南都将为您提供必要的知识和工具，以便您能够自信地管理Ubuntu服务器的网络配置。请按照以下步骤操作，确保在进行任何更改之前都已经理解每个命令的作用，并准备好应对可能出现的问题。让我们开始吧！**

### 第一步：先将原网卡备份

路径：`sudo cp etc/netplan/50-cloud-init.yaml etc/netplan/50-cloud-init.yaml.bak`

### 第二步：打开配置文件

命令：`sudo -i` #输入普通用户的密码切到root  
命令：`sudo vim /etc/netplan/50-cloud-init.yaml`

### 第三步：Ubuntu24.04系统添加以下配置（步骤可选，根据自己具体的系统版本来）

```
network:
  version: 2
  renderer: networkd
  ethernets:
    ens18f1np0:
      dhcp4: no  # 这里指定是否为静态ip，no为静态，您需要根据实际情况选择合适的模式
    ens20f1np0:
      dhcp4: no  # 这里指定是否为静态ip，no为静态，您需要根据实际情况选择合适的模式
  bonds:
    bond0:
      interfaces: [ens18f1np0, ens20f1np0]
      parameters:
        mode: active-backup   # 这里指定了绑定模式（主备），您需要根据实际情况选择合适的模式
        primary: ens18f1np0   # 主接口
      addresses:
        - 10.10.10.8/24       # 静态IP地址
      routes:
        - to: 0.0.0.0/0
          via: 10.10.10.2     # 网关
          type: unicast
      nameservers:
        addresses: [8.8.8.8, 8.8.4.4]
```

### 第三步：Ubuntu20.04系统添加以下配置（步骤可选，根据自己具体的系统版本来）

```
network:
  version: 2
  renderer: networkd
  ethernets:
    ens18f1np0:
      dhcp4: no   # 这里指定是否为静态ip，no为静态，您需要根据实际情况选择合适的模式
    ens20f1np0:
      dhcp4: no   # 这里指定是否为静态ip，no为静态，您需要根据实际情况选择合适的模式
  bonds:
    bond0:
      interfaces: [ens18f1np0, ens20f1np0]
      parameters:
		mode: active-backup           # 这里指定了绑定模式（主备），您需要根据实际情况选择合适的模式
		primary: ens18f1np0           # 主接口
      addresses:
        - 10.10.10.8/24               # 静态IP地址
      gateway4: 10.10.10.2            # 网关
      nameservers:
        addresses: [8.8.8.8, 8.8.4.4]
```

### 注意以上步骤不可用串系统，否则虽能生效但是会报以下错误，如24.04系统用20.04系统的配置：

### 第四步：重启网络

命令：`netplan apply`

根据您提供的信息，以下是查看网卡信息是否正常、查看bond0状态、验证主备以及用nload查看各网卡流量的具体命令和步骤：

### 第五步：查看网卡信息是否正常

1. **使用ifconfig查看网卡信息**：

   ```
   ifconfig
   ```

   或者使用`ip`命令：

   ```
   ip a
   ```
2. **检查bond0是否已经创建并且配置了正确的IP地址**：

   ```
   ifconfig bond0
   ```

   或者使用`ip`命令：

   ```
   ip a show bond0
   ```

### 第六步：查看bond0状态

1. **查看bond0的详细信息**：

   ```
   cat /proc/net/bonding/bond0
   ```

   这个命令会显示bond0的详细信息，包括模式、主备状态、MII状态等。

### 第七步：验证主备

1. **验证主备状态**：  
   通过查看`/proc/net/bonding/bond0`文件，您可以检查`Active`字段，它会显示当前活动的接口，即主接口。
2. **模拟主接口故障**：  
   您可以通过关闭主接口来模拟故障，检查备用接口是否接管：

   ```
   sudo ip link set ens18f1np0 down
   ```

   然后再次查看`/proc/net/bonding/bond0`文件，检查`Active`字段是否显示为备用接口`ens20f1np0`。
3. **恢复主接口**：  
   模拟故障后，记得恢复主接口：

   ```
   sudo ip link set ens18f1np0 up
   ```

### 第八步：用nload查看各网卡流量

1. **安装nload**：  
   如果系统中没有安装nload，可以通过以下命令安装：

   ```
   sudo apt-get update
   sudo apt-get install nload
   ```
2. **使用nload查看流量**：  
   启动nload查看所有网卡流量：

   ```
   nload
   ```

   或者，您可以通过指定网卡名称来查看特定网卡的流量：

   ```
   nload ens18f1np0 ens20f1np0 bond0
   ```

请注意，`nload`可能需要超级用户权限才能显示所有网卡的流量，如果遇到权限问题，可以尝试使用`sudo`运行nload。

以上步骤可以帮助您检查网络配置是否正确，bond0的状态，以及主备接口的工作情况，并通过nload实时监控网卡流量。
