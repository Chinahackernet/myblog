---
title: 全网最全 GlusterFS 三节点集群部署指南（Heketi 管理模式）
---

**前言：随着信息技术的飞速发展，数据量呈爆炸式增长，传统的集中式存储系统已经难以满足现代应用对存储容量、性能和可靠性的苛刻需求。分布式存储技术应运而生，而 GlusterFS 作为其中的杰出代表，凭借其简单却强大的架构设计，成为了存储领域的一颗新星。**  
**GlusterFS 的魅力不仅在于它能够轻松应对海量数据的存储挑战，更在于它为用户提供了极高的灵活性和扩展性。无论是小型企业搭建私有云存储，还是大型互联网公司构建海量数据处理平台，GlusterFS 都能凭借其卓越的性能和可靠性，成为数据存储的坚实后盾。**  
**在接下来的内容中，我们将深入剖析 GlusterFS 的架构原理，带您领略它的功能特点，并通过实际的部署案例，展示如何在不同的应用场景中充分发挥 GlusterFS 的优势。让我们一起开启这场关于分布式存储技术的精彩之旅，探索 GlusterFS 如何改变我们对数据存储的认知。**

# GlusterFS：灵活高效的分布式文件系统简介

## GlusterFS 的历史

GlusterFS 的历史可以追溯到 2006 年，最初的目标是代替 Lustre 和 GPFS 等分布式文件系统。2007 年，GlusterFS 发布了第一个公开版本。2011 年，Gluster 公司被 Red Hat 收购。此后，GlusterFS 在开源社区的活跃度不断提升，逐渐成为与 Lustre、MooseFS、CEPH 并列的四大开源分布式文件系统之一。目前，GlusterFS 主要由 Red Hat 负责维护，在全球范围内拥有一定规模的用户群。

## 云计算三大论文的历史

云计算的发展历程中，有三篇具有里程碑意义的论文，它们奠定了云计算技术的基础，推动了整个行业的发展。

### 1. 虚拟化技术

虚拟化技术的历史可以追溯到 1959 年，当时计算机科学家 Christopher Strachey 在国际信息处理大会上首次提出了虚拟化的概念。虚拟化技术的核心思想是通过虚拟化软件在一台物理机上虚拟出多台虚拟机，从而实现计算机资源的最大化利用。这种技术为后来的云计算提供了基础架构支持。

### 2. 分布式计算技术

分布式计算技术的发展可以追溯到 1969 年，当时 J.C.R. Licklider 领导的研究小组成功建成了 Internet 的前身 ARPANET。ARPANET 允许用户从远程计算机访问信息和应用程序，为后来的云计算发展奠定了基础。此外，2003 年谷歌发表的三篇论文（MapReduce、GFS 和 BigTable）开创性地通过大量廉价服务器进行分布式存储和计算，这三篇论文被称为“三驾马车”，对云计算的发展产生了深远影响。

### 3. 云计算概念的提出

云计算的概念最早可以追溯到 20 世纪 50 年代，当时计算机科学家 John McCarthy 提出了“公共计算设施”的概念。2006 年，亚马逊推出了首批云产品，包括 S3（Simple Storage Service）和 EC2（Elastic Compute Cloud），正式拉开了云计算的大幕。同年，Google 首席执行官埃里克·施密特在搜索引擎大会上首次提出了“云计算”（Cloud Computing）的概念。

## GlusterFS 的核心特性

### 1. 高可扩展性

GlusterFS 支持水平扩展，用户可以通过简单地添加更多存储节点来增加存储容量和性能。这种灵活的扩展方式使得 GlusterFS 能够轻松应对从小型团队到大型企业的各种存储需求。

### 2. 高可用性

GlusterFS 提供了数据复制和自动故障转移功能，确保数据在硬件故障或其他意外情况下的高可用性。通过在多个节点上存储数据副本，GlusterFS 能够在节点故障时自动切换到其他副本，从而保证服务的连续性。

### 3. 简单易用

GlusterFS 提供了丰富的管理工具和接口，使得部署、管理和监控存储集群变得简单高效。无论是通过命令行工具还是图形化界面，用户都能轻松地进行存储资源的管理。

### 4. 丰富的功能

GlusterFS 支持多种存储功能，如数据分片、缓存、快照等。这些功能不仅提高了存储效率，还增强了数据的安全性和可靠性。

## 应用场景

GlusterFS 的灵活性和高性能使其适用于多种应用场景：

### 1. 私有云存储

GlusterFS 可以作为私有云的存储后端，为虚拟机和容器提供持久化存储。它支持多种虚拟化技术和容器编排工具，如 Kubernetes。

### 2. 大数据存储

GlusterFS 能够高效地存储和管理大数据，支持 Hadoop 等大数据处理框架。其分布式架构能够满足大数据处理对存储容量和性能的高要求。

### 3. 备份和归档

GlusterFS 提供了强大的数据备份和归档功能，支持数据的长期存储。其数据复制和快照功能能够确保数据的安全性和完整性。

# 集群部署：

## **一、环境规划**

| 节点名称 | IP 地址 | 角色 | 数据盘 |
| --- | --- | --- | --- |
| soc-gfs-1 | 172.20.150.10 | 集群节点 & Heketi 管理节点 | /dev/sdb (2T) |
| soc-gfs-2 | 172.20.150.11 | 集群节点 | /dev/sdb (2T) |
| soc-gfs-3 | 172.20.150.12 | 集群节点 | /dev/sdb (2T) |

**软件版本**：

- GlusterFS：10.x（通过 PPA 安装）
- Heketi：v10.4.0
- 操作系统：Ubuntu Server（假设，基于 `apt-get` 命令）

### 配置 hosts 文件

在三台节点上均执行以下操作：

```
vi /etc/hosts
```

添加以下内容：

```
127.0.0.1   localhost localhost.localdomain localhost4 localhost4.localdomain4
::1         localhost localhost.localdomain localhost6 localhost6.localdomain6
172.20.150.10 soc-gfs-1
172.20.150.11 soc-gfs-2
172.20.150.12 soc-gfs-3
```

### 关闭防火墙和 SELINUX

在三台节点上执行以下命令：

```
systemctl stop firewalld
systemctl disable firewalld
setenforce 0
vi /etc/selinux/config
```

将 SELINUX 设置为 disabled：

```
SELINUX=disabled
SELINUXTYPE=targeted
```

## 二、部署 GlusterFS 服务

### 安装 GlusterFS 存储库

在三台节点上执行以下命令：

```
apt-get update
sudo add-apt-repository ppa:gluster/glusterfs-10
apt-get install glusterfs-server
```

### 启动 GlusterFS 服务

在三台节点上执行以下命令：

```
systemctl start glusterd
systemctl status glusterd
systemctl enable glusterd
```

## 三、创建 GlusterFS 受信存储池

在节点1（soc-gfs-1）上执行以下命令：

```
gluster peer probe soc-gfs-2
gluster peer probe soc-gfs-3
```

### 验证存储池状态（验证集群状态）

在三台节点上执行以下命令，确保每个节点都能看到其他两个节点的信息：

```
gluster peer status
```

## 四、安装和配置 Heketi

### 安装 Heketi

在节点1上执行以下命令：

```
cd /root
wget https://github.com/heketi/heketi/releases/download/v10.4.0/heketi-v10.4.0-release-10.linux.amd64.tar.gz
tar -zxf heketi-v10.4.0-release-10.linux.amd64.tar.gz
cd /root/heketi
cp heketi heketi-cli /usr/bin/
```

### 创建 Heketi 用户和配置文件目录

```
useradd -d /var/lib/heketi -s /sbin/nologin heketi
mkdir /etc/heketi -p
```

### 创建 Heketi 服务文件

```
vi /usr/lib/systemd/system/heketi.service
```

添加以下内容：

```
[Unit]
Description=Heketi Server

[Service]
Type=simple
WorkingDirectory=/var/lib/heketi
User=heketi
ExecStart=/usr/bin/heketi --config=/etc/heketi/heketi.json
Restart=on-failure
StandardOutput=syslog
StandardError=syslog

[Install]
WantedBy=multi-user.target
```

### 配置 SSH 密钥

```
ssh-keygen -N '' -t rsa -q -f /etc/heketi/heketi_key
chmod 0600 /etc/heketi/heketi_key.pub
chown heketi.heketi /etc/heketi/heketi_key*
```

### 配置节点间 SSH 互信

在节点1上执行以下命令：

```
ssh-keygen
ssh-copy-id 172.20.150.12
ssh-copy-id 172.20.150.11
ssh-copy-id 172.20.150.10
```

### 创建 Heketi 配置文件

```
cp /root/heketi/heketi.json /etc/heketi/
```

修改配置文件中的端口为8080。

### 启动 Heketi 服务

```
systemctl enable heketi --now
systemctl restart heketi
服务启动状态：
```

### 验证 Heketi 服务

```
curl http://127.0.0.1:8080/hello
```

## 五、配置存储拓扑

### 创建拓扑文件

在节点1上执行以下命令：

```
vi /etc/heketi/topology.json
```

添加以下内容：

```
{
  "clusters": [
    {
      "nodes": [
        {
          "node": {
            "hostnames": {
              "manage": [
                "soc-gfs-1"
              ],
              "storage": [
                "172.20.150.10"
              ]
            },
            "zone": 1
          },
          "devices": [
            "/dev/sdb"
          ]
        },
        {
          "node": {
            "hostnames": {
              "manage": [
                "soc-gfs-2"
              ],
              "storage": [
                "172.20.150.11"
              ]
            },
            "zone": 1
          },
          "devices": [
            "/dev/sdb"
          ]
        },
        {
          "node": {
            "hostnames": {
              "manage": [
                "soc-gfs-3"
              ],
              "storage": [
                "172.20.150.12"
              ]
            },
            "zone": 1
          },
          "devices": [
            "/dev/sdb"
          ]
        }
      ]
    }
  ]
}
```

### 加载并构建拓扑

在节点1上执行以下命令：

```
heketi-cli --user admin --secret admin@P@88W0rd topology load --json=/etc/heketi/topology.json
```

### 查看集群节点

```
heketi-cli --user admin --secret admin@P@88W0rd node list
```

### 查看集群拓扑信息

```
heketi-cli --user admin --secret admin@P@88W0rd topology info
```

## 六、创建和管理卷

### 创建测试卷

```
heketi-cli volume --user admin --secret admin@P@88W0rd create --size=1 --replica=2 --name=test-volume
```

### 查看卷列表

```
heketi-cli volume --user admin --secret admin@P@88W0rd list
```

### 删除卷

```
heketi-cli volume --user admin --secret admin@P@88W0rd delete <卷ID>
```

## 七、Kubernetes 集成

### 创建 Secret 资源

在 Kubernetes master 节点上执行以下命令：

```
echo -n "admin@P@88W0rd" | base64
```

创建 Secret 资源清单文件：

```
apiVersion: v1
kind: Secret
metadata:
  name: heketi-secret
  namespace: kube-system
data:
  key: YWRtaW5AUEA4OFcwcmQ=
type: kubernetes.io/glusterfs
```

应用 Secret 资源：

```
kubectl apply -f heketi-secret.yaml
```

### 创建 StorageClass 资源

创建 StorageClass 资源清单文件：

```
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: glusterfs
  namespace: kube-system
parameters:
  resturl: "http://172.20.150.10:8080"
  clusterid: "9ad37206ce6575b5133179ba7c6e0935"
  restauthenabled: "true"
  restuser: "admin"
  secretName: "heketi-secret"
  secretNamespace: "kube-system"
  volumetype: "replicate:3"
provisioner: kubernetes.io/glusterfs
reclaimPolicy: Delete
```

应用 StorageClass 资源：

```
kubectl apply -f heketi-storageclass.yaml
```

### 验证 StorageClass

```
kubectl get sc
```

## 九、验证存储功能

1. **创建 PVC & Pod（示例）**

   ```
   # pvc.yaml
   apiVersion: v1
   kind: PersistentVolumeClaim
   metadata:
     name: gluster-pvc
   spec:
     storageClassName: glusterfs
     accessModes:
       - ReadWriteOnce
     resources:
       requests:
         storage: 1Gi

   # pod.yaml
   apiVersion: v1
   kind: Pod
   metadata:
     name: gluster-test-pod
   spec:
     containers:
     - name: test-container
       image: busybox
       command: ["sh", "-c", "echo Hello GlusterFS > /mnt/gluster/test.txt && sleep 3600"]
       volumeMounts:
       - name: gluster-volume
         mountPath: "/mnt/gluster"
     volumes:
     - name: gluster-volume
       persistentVolumeClaim:
         claimName: gluster-pvc
   ```

   ```
   kubectl apply -f pvc.yaml -f pod.yaml
   kubectl exec gluster-test-pod -- cat /mnt/gluster/test.txt  # 验证数据写入
   ```

## 十、集群维护命令

| 操作 | 命令示例 |
| --- | --- |
| 查看节点状态 | `gluster peer status` |
| 查看卷信息 | `gluster volume info` |
| 扩展存储卷 | `heketi-cli volume expand --volume-id <ID> --size <NEW_SIZE_GB>` |
| 删除卷 | `heketi-cli volume delete <VOLUME_ID>` |
| 查看 Heketi 集群拓扑 | `heketi-cli topology info --user admin --secret <PASSWORD>` |

## 部署架构图

```
Kubernetes Master
├── GlusterFS Cluster (3节点)
│   ├── soc-gfs-1 (管理节点 + 存储节点)
│   ├── soc-gfs-2 (存储节点)
│   └── soc-gfs-3 (存储节点)
└── Heketi Service (soc-gfs-1)
    └── 管理接口：http://172.20.150.10:8080
```

## 注意事项

1. **数据盘准备**：所有节点需提前创建未格式化的空数据盘（如 `/dev/sdb`）。
2. **SSH 互信**：确保管理节点（soc-gfs-1）到所有节点的 SSH 无密码登录。
3. **防火墙规则**：若防火墙未关闭，需开放以下端口：
   - GlusterFS：24007（管理）、24008（数据）
   - Heketi：8080（管理接口）
4. **存储副本数**：根据需求调整 `volumetype: "replicate:3"`（默认 3 副本，建议至少 2 副本）。
5. **高可用**：生产环境建议部署 Heketi 集群（多实例），并配置负载均衡。

## 总结

通过以上步骤，成功部署了一个基于 Heketi 管理的 GlusterFS 三节点集群，并集成到 Kubernetes 中。该方案支持动态卷创建、副本冗余和故障自愈，适用于容器化应用的分布式存储需求。后续可通过 Heketi 接口或 Kubernetes 的 StorageClass 进一步扩展和管理存储资源。  
