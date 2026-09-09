---
title: Terraform 从入门到实战：历史、原理、功能与阿里云/Azure 上手指南
---

**前言：在云时代，企业的IT基础设施早已从“几台服务器”演变为“横跨多云的复杂网络、计算、存储集群”。但随之而来的，是管理复杂度的爆炸式增长：开发环境和生产环境不一致、手动配置容易出错、多云平台操作方式各异、资源变更难以追溯……这些问题不仅拖慢迭代速度，更可能埋下合规与安全隐患。  
于是，“基础设施即代码（IaC）”成为破局的关键——用代码定义基础设施，像管理应用代码一样管理服务器、网络和数据库。而Terraform，正是这一领域的标杆工具。  
它不绑定任何单一云厂商，能统一管理阿里云、Azure、AWS等所有主流平台；它用声明式语法描述“目标状态”，无需关心“如何一步步实现”；它通过状态文件记录资源信息，自动处理变更与依赖……无论是初创公司的简单部署，还是大型企业的多云架构，Terraform都能提供一致、可重复、可审计的基础设施管理流程。  
本文将从Terraform的起源讲起，拆解其核心原理与功能，再通过两个实战案例（阿里云ECS与Azure VM完整部署），带你掌握“配置文件定义→初始化→计划→应用”的核心流程。即使是IaC新手，也能跟着步骤从零搭建起可用的云主机环境，真正体会“代码即基础设施”的高效与可靠。**

> 一文带你从 0 到 1 掌握 Terraform：了解它从哪里来、如何工作、能做什么，以及如何**按“配置文件定义 → 初始化 → 计划 → 应用”**的核心流程，在**阿里云 ECS**和**微软 Azure**上动手创建可用的云主机。AWS/GCP 等其他云的流程一致，仅资源与配置细节不同。

## 一、Terraform 是什么？为什么用它？

Terraform 是 HashiCorp 推出的 **IaC（Infrastructure as Code，基础设施即代码）**工具，通过**声明式配置**统一管理多云（阿里云、Azure、AWS、GCP 等）与本地资源（网络、主机、数据库、K8s、DNS、CDN……）。

### 核心收益

- **可重复**：同一份配置能在开发、测试、生产等多环境一致部署。
- **可审计**：基础设施改动以代码形式记录，配合 Git 可轻松审核、回滚。
- **可协作**：支持模块化、远程状态管理，便于团队并行开发。
- **多云统一**：一套工作流适配多个云厂商，避免被单一云平台锁定。

## 二、发展历史（里程碑）

- **2014年**：首个版本发布，提出“Plan/Apply”工作流与资源依赖图（DAG）核心概念。
- **2015–2018年**：生态快速扩张，支持的云厂商（Provider）持续增加；“远程状态存储”“状态锁”等团队协作最佳实践逐渐形成。
- **2019年（v0.12）**：引入 **HCL2** 语法，语言表达力大幅增强（支持 `for` 循环、`dynamic` 块、条件表达式等）。
- **2020年（v0.13）**：支持多 Provider 源，模块的 `count`/`for_each` 等特性更易用。
- **2021年（v1.0）**：发布标志性稳定版，承诺 1.x 版本兼容性。
- **2023年**：许可协议调整为 BUSL，社区分叉出 **OpenTofu**（开源且与 Terraform 配置基本兼容）。
- **2024–2025年（1.x）**：持续迭代，在“漂移检测”“供应链安全”“测试能力”等方面优化。

> 说明：本文以 Terraform 1.x 为例；若选择 **OpenTofu**，命令与语法几乎一致（将 `terraform` 替换为 `tofu` 即可），可平滑迁移。

## 三、工作原理（核心概念）

Terraform 核心逻辑可概括为“**声明式描述 + 自动化执行 + 状态记忆**”，依赖以下关键概念：

- **HCL 配置**：通过 `.tf` 文件**声明式描述**基础设施的“期望状态”（无需关心“如何一步步创建”）。
- **资源依赖图（DAG）**：Terraform 会解析资源间的依赖关系，**并行创建无依赖冲突的资源**，保证执行效率与顺序性。
- **Plan/Apply 工作流**：
  - `terraform plan`：比对“期望状态（配置文件）”与“当前状态（State）”，生成“执行计划”（告知会新增、变更、销毁哪些资源）。
  - `terraform apply`：按计划执行变更，让基础设施与配置“同步”。
- **State（状态）**：通过 `.tfstate` 文件记录已创建资源的“实际状态与 ID”，是 Terraform “记忆能力”的核心。支持**状态锁**（防止多人并发操作冲突）与**远程存储**（如 OSS、Azure Blob、S3，便于团队协作）。
- **Provider**：与具体云平台/服务交互的插件（如 `alicloud` 对接阿里云，`azurerm` 对接 Azure）。
- **Resource / Data Source**：`Resource` 用于“创建/变更资源”；`Data Source` 用于**只读查询现有资源信息**（如“最新 Ubuntu 镜像 ID”）。
- **Module**：可复用的配置单元，能在团队内/外共享、版本化管理（类似“代码函数”，封装通用基础设施逻辑）。

> 总结：Terraform = HCL（声明期望） + Provider（执行操作） + State（记忆状态） + DAG（并发/有序执行）。  

## 四、核心功能一览

- **多云/混合云统一管理**：一套声明式配置，同时管理阿里云、Azure、AWS、GCP 及本地资源。
- **幂等与并发**：重复执行配置时，自动跳过“已符合期望状态”的资源；并通过依赖图并行创建无冲突资源。
- **远程状态与锁**：支持将 `.tfstate` 存储在 OSS、Azure Storage、S3 等远程服务，配合“状态锁”避免多人操作冲突。
- **漂移检测（Drift）**：`terraform plan` 阶段可自动发现“手动修改控制台资源”与“代码配置”的不一致。
- **资源导入（Import）**：能将已有手动创建的资源，纳入 Terraform 代码管理。
- **模块化复用**：通过“模块”封装通用逻辑（如“生产级 VPC 模板”），结合 Terraform Registry（公共模块库）或私有模块库复用。
- **策略管控**：配合 Sentinel、OPA 等工具，进行合规与安全检查（如“禁止创建公网可访问的数据库”）。

## 五、上手前准备

1. **安装 Terraform**：参考 [官方安装指南](https://developer.hashicorp.com/terraform/downloads)（建议 1.3+，推荐 1.6+）。
2. **生成 SSH 公钥**：执行 `ssh-keygen -t rsa -b 4096`（或 `ed25519`），生成 `~/.ssh/id_rsa.pub`（用于云主机免密登录）。
3. **云厂商凭据准备**：
   - **阿里云**：建议通过环境变量传递（避免硬编码）：

     ```
     export ALICLOUD_ACCESS_KEY="你的AccessKey ID"
     export ALICLOUD_SECRET_KEY="你的AccessKey Secret"
     export ALICLOUD_REGION="目标地域（如 cn-hongkong）"
     ```
   - **Azure**：使用 Azure CLI 登录并选择订阅：

     ```
     az login
     az account set -s <你的订阅ID>
     ```
4. **费用提示**：创建云资源会产生费用，练习完成后请执行 `terraform destroy` 清理资源。

## 六、实战：阿里云 ECS 完整部署（VPC + 子网 + 安全组 + EIP + 实例）

### 项目结构

创建如下目录结构，分离配置文件：

```
terraform-demo/
├─ aliyun/        # 阿里云 ECS 示例
│  ├─ main.tf     # 核心配置
│  ├─ variables.tf # 变量定义
│  ├─ outputs.tf  # 输出结果
│  └─ versions.tf # 版本约束
└─ .gitignore     # 忽略敏感文件（如 .tfstate）
```

### 1. 版本约束（`aliyun/versions.tf`）

```
terraform {
  required_version = ">= 1.3.0"
  required_providers {
    alicloud = {
      source  = "aliyun/alicloud"
      version = ">= 1.0"
    }
  }
}
```

### 2. 变量定义（`aliyun/variables.tf`）

```
variable "name" { 
  type    = string  
  default = "tf-ecs-demo" 
}
variable "region" { 
  type    = string  
  default = "cn-hongkong" 
}
variable "zone_id" { 
  type    = string  
  default = "cn-hongkong-b" 
}

variable "vpc_cidr"    { type = string default = "10.10.0.0/16" }
variable "vsw_cidr"    { type = string default = "10.10.1.0/24" }
variable "instance_type" { type = string } # 示例：ecs.t5-lc1m1.small（需与地域匹配）

variable "ssh_public_key" { type = string } # 传入 ~/.ssh/id_rsa.pub 内容

# 生产建议收敛为办公网 IP 段，练习用 0.0.0.0/0
variable "allowed_ssh_cidr" { type = string default = "0.0.0.0/0" }

# 可选：手动指定镜像 ID，否则自动选最新 Ubuntu
variable "image_id" { type = string default = "" }
```

### 3. 核心配置（`aliyun/main.tf`）

```
provider "alicloud" {
  region = var.region
}

# 自动查询最新 Ubuntu 22.04 镜像（正则匹配，可按需调整）
data "alicloud_images" "ubuntu" {
  name_regex  = "^ubuntu_22_04.*x64.*"  
  owners      = "system"
  most_recent = true
}

# 创建 VPC
resource "alicloud_vpc" "this" {
  name       = "${var.name}-vpc"
  cidr_block = var.vpc_cidr
}

# 创建子网
resource "alicloud_vswitch" "this" {
  name              = "${var.name}-vsw"
  vpc_id            = alicloud_vpc.this.id
  cidr_block        = var.vsw_cidr
  availability_zone = var.zone_id
}

# 创建安全组
resource "alicloud_security_group" "this" {
  name   = "${var.name}-sg"
  vpc_id = alicloud_vpc.this.id
}

# 安全组规则：允许 SSH（22 端口）
resource "alicloud_security_group_rule" "ssh" {
  type              = "ingress"
  ip_protocol       = "tcp"
  port_range        = "22/22"
  priority          = 1
  cidr_ip           = var.allowed_ssh_cidr
  security_group_id = alicloud_security_group.this.id
}

# 导入本地 SSH 公钥为阿里云密钥对
resource "alicloud_key_pair" "kp" {
  key_pair_name = "${var.name}-kp"
  public_key    = var.ssh_public_key
}

# 申请公网 EIP
resource "alicloud_eip" "eip" {
  name      = "${var.name}-eip"
  bandwidth = 5
}

# 创建 ECS 实例
resource "alicloud_instance" "this" {
  instance_name              = var.name
  availability_zone          = var.zone_id
  instance_type              = var.instance_type
  # 优先用手动指定的镜像，否则用数据源查询的最新 Ubuntu
  image_id                   = var.image_id != "" ? var.image_id : data.alicloud_images.ubuntu.images[0].id
  security_groups            = [alicloud_security_group.this.id]
  vswitch_id                 = alicloud_vswitch.this.id
  system_disk_category       = "cloud_efficiency"
  internet_charge_type       = "PayByTraffic"
  key_name                   = alicloud_key_pair.kp.key_pair_name

  tags = {
    Project = "terraform-demo"
    Cloud   = "alicloud"
  }
}

# 绑定 EIP 到 ECS
resource "alicloud_eip_association" "bind" {
  allocation_id = alicloud_eip.eip.id
  instance_id   = alicloud_instance.this.id
}
```

### 4. 输出结果（`aliyun/outputs.tf`）

```
output "ecs_id" {
  value = alicloud_instance.this.id
}

output "ecs_public_ip" {
  value = alicloud_eip.eip.ip_address
}
```

### 5. 执行部署

```
cd aliyun

# 传入变量（实例规格 + SSH 公钥）
terraform init
terraform validate
terraform plan -var "instance_type=ecs.t5-lc1m1.small" \
               -var "ssh_public_key=$(cat ~/.ssh/id_rsa.pub)"
# 自动批准执行（生产建议先手动确认 plan）
terraform apply -auto-approve -var "instance_type=ecs.t5-lc1m1.small" \
                             -var "ssh_public_key=$(cat ~/.ssh/id_rsa.pub)"

# 登录 ECS（用输出的公网 IP）
ssh -i ~/.ssh/id_rsa root@$(terraform output -raw ecs_public_ip)

# 清理资源（务必执行）
terraform destroy
```

> 小贴士：若 `instance_type` 与地域不匹配，可到阿里云控制台查看“可用实例规格”，或更换 `zone_id`。

## 七、实战：Azure Linux VM 完整部署（VNet + 子网 + NSG + 公网 IP + NIC + VM）

### 项目结构

类似阿里云，创建 `azure/` 目录存放配置：

```
terraform-demo/
├─ azure/         # Azure VM 示例
│  ├─ main.tf
│  ├─ variables.tf
│  ├─ outputs.tf
│  └─ versions.tf
└─ .gitignore
```

### 1. 版本约束（`azure/versions.tf`）

```
terraform {
  required_version = ">= 1.3.0"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = ">= 3.0"
    }
  }
}
```

### 2. 变量定义（`azure/variables.tf`）

```
variable "name"      { type = string  default = "tf-az-vm" }
variable "location"  { type = string  default = "East Asia" } # 香港区域

variable "vnet_cidr"   { type = string default = "10.20.0.0/16" }
variable "subnet_cidr" { type = string default = "10.20.1.0/24" }
variable "vm_size"     { type = string default = "Standard_B1s" }

variable "admin_username" { type = string default = "azureuser" }
variable "ssh_public_key" { type = string }
```

### 3. 核心配置（`azure/main.tf`）

```
provider "azurerm" { features {} }

# 创建资源组
resource "azurerm_resource_group" "rg" {
  name     = "${var.name}-rg"
  location = var.location
}

# 创建虚拟网络（VNet）
resource "azurerm_virtual_network" "vnet" {
  name                = "${var.name}-vnet"
  address_space       = [var.vnet_cidr]
  location            = var.location
  resource_group_name = azurerm_resource_group.rg.name
}

# 创建子网
resource "azurerm_subnet" "subnet" {
  name                 = "${var.name}-subnet"
  resource_group_name  = azurerm_resource_group.rg.name
  virtual_network_name = azurerm_virtual_network.vnet.name
  address_prefixes     = [var.subnet_cidr]
}

# 创建网络安全组（NSG）
resource "azurerm_network_security_group" "nsg" {
  name                = "${var.name}-nsg"
  location            = var.location
  resource_group_name = azurerm_resource_group.rg.name

  # 允许 SSH（22 端口）入站
  security_rule {
    name                       = "Allow-SSH"
    priority                   = 100
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "22"
    source_address_prefix      = "*" # 生产建议收敛为办公网 IP
    destination_address_prefix = "*"
  }
}

# 关联 NSG 与子网
resource "azurerm_subnet_network_security_group_association" "assoc" {
  subnet_id                     = azurerm_subnet.subnet.id
  network_security_group_id = azurerm_network_security_group.nsg.id
}

# 创建公网 IP
resource "azurerm_public_ip" "pip" {
  name                = "${var.name}-pip"
  location            = var.location
  resource_group_name = azurerm_resource_group.rg.name
  allocation_method   = "Static"
  sku                 = "Standard"
}

# 创建网络接口（NIC）
resource "azurerm_network_interface" "nic" {
  name                = "${var.name}-nic"
  location            = var.location
  resource_group_name = azurerm_resource_group.rg.name

  ip_configuration {
    name                          = "primary"
    subnet_id                     = azurerm_subnet.subnet.id
    private_ip_address_allocation = "Dynamic"
    public_ip_address_id          = azurerm_public_ip.pip.id
  }
}

# 创建 Linux 虚拟机
resource "azurerm_linux_virtual_machine" "vm" {
  name                = var.name
  location            = var.location
  resource_group_name = azurerm_resource_group.rg.name
  size                = var.vm_size
  admin_username      = var.admin_username
  network_interface_ids = [azurerm_network_interface.nic.id]

  # 注入 SSH 公钥
  admin_ssh_key {
    username   = var.admin_username
    public_key = var.ssh_public_key
  }

  os_disk {
    caching              = "ReadWrite"
    storage_account_type = "Standard_LRS"
  }

  # 使用最新 Ubuntu 22.04 LTS 镜像
  source_image_reference {
    publisher = "Canonical"
    offer     = "0001-com-ubuntu-server-jammy"
    sku       = "22_04-lts-gen2"
    version   = "latest"
  }

  tags = {
    Project = "terraform-demo"
    Cloud   = "azure"
  }
}
```

### 4. 输出结果（`azure/outputs.tf`）

```
output "vm_id" {
  value = azurerm_linux_virtual_machine.vm.id
}

output "public_ip" {
  value = azurerm_public_ip.pip.ip_address
}
```

### 5. 执行部署

```
cd azure

# Azure CLI 登录并选择订阅
az login
az account set -s <你的订阅ID>

terraform init
terraform validate
terraform plan -var "ssh_public_key=$(cat ~/.ssh/id_rsa.pub)"
terraform apply -auto-approve -var "ssh_public_key=$(cat ~/.ssh/id_rsa.pub)"

# 登录 VM（默认用户为 azureuser）
ssh -i ~/.ssh/id_rsa azureuser@$(terraform output -raw public_ip)

# 清理资源
terraform destroy
```

## 八、核心工作流回顾（配置 → 初始化 → 计划 → 应用）

Terraform 遵循**“描述期望 → 准备环境 → 预览变更 → 执行变更”**的流程：

1. **配置（Write）**：通过 `.tf` 文件声明基础设施的“期望状态”。
2. **初始化（Init）**：执行 `terraform init`，下载 Provider 插件、初始化后端（如远程状态存储）。
3. **计划（Plan）**：执行 `terraform plan`，预览将“新增、变更、销毁”的资源。
4. **应用（Apply）**：执行 `terraform apply`，按计划变更基础设施。
5. **销毁（Destroy）**：执行 `terraform destroy`，清理不再需要的资源。

> 常用辅助命令：
>
> - `terraform fmt`：自动格式化配置文件，统一代码风格。
> - `terraform validate`：校验配置语法与逻辑合法性。
> - `terraform show`：查看当前状态的详细信息。
> - `terraform output`：读取配置中定义的“输出值”（如公网 IP）。
> - `terraform graph`：生成资源依赖关系图（需安装 Graphviz）。

## 九、进阶技巧：团队协作与生产级实践

### 1. 远程状态与锁（团队必备）

默认状态文件 `.tfstate` 存储在本地，团队协作时易冲突。推荐使用**远程后端**（如阿里云 OSS、Azure Storage、AWS S3）：

- **阿里云 OSS 后端**（需先创建 Bucket）：  
  在根模块的 `terraform` 块中添加：

  ```
  terraform {
    backend "oss" {
      bucket = "你的OSS桶名"
      prefix = "envs/dev" # 按环境区分
      region = "cn-hangzhou"
    }
  }
  ```
- **Azure Storage 后端**（需先创建 Storage Account/Container）：

  ```
  terraform {
    backend "azurerm" {
      resource_group_name  = "rg-tfstate"
      storage_account_name = "mystatestorage"
      container_name       = "tfstate"
      key                  = "azure/dev.terraform.tfstate"
    }
  }
  ```

> 注意：后端配置初始化后，若需修改，需执行 `terraform init -migrate-state` 迁移状态。

### 2. 变量、机密与环境区分

- **变量注入方式**：
  - 命令行参数：`terraform apply -var "instance_type=ecs.t6-c1m2.large"`。
  - 变量文件：`-var-file=dev.tfvars`（将变量集中写在 `dev.tfvars` 文件）。
  - 环境变量：以 `TF_VAR_` 为前缀（如 `TF_VAR_ssh_public_key`）。
- **敏感信息处理**：  
  不要将 AccessKey、私钥、`.tfstate` 提交到 Git；推荐使用**密钥管理工具**（如 HashiCorp Vault、Azure Key Vault）。
- **多环境管理（工作空间）**：  
  通过 `terraform workspace` 管理多环境（如 dev、test、prod）：

  ```
  terraform workspace new dev  # 创建 dev 环境
  terraform workspace select dev # 切换到 dev 环境
  ```

  不同环境可复用同一份代码，通过变量区分配置。

### 3. 排错与最佳实践

- **配额/规格不可用**：若创建失败，先到云平台控制台查看“资源配额”“实例规格是否支持当前可用区”。
- **镜像/名称匹配失败**：可通过 `terraform console` 进入交互模式，打印数据源结果（如 `data.alicloud_images.ubuntu.images`），调整 `name_regex`。
- **安全组/NSG 范围过宽**：练习时可用 `0.0.0.0/0`，生产环境务必收敛到办公网 IP 或堡垒机 IP。
- **模块化复用**：将“VPC 创建”“云主机初始化”等逻辑封装为模块，主配置只做“编排”；模块可通过 Terraform Registry 共享或内部版本化管理。
- **资源导入**：若已有手动创建的资源，可通过 `terraform import <资源地址> <资源ID>` 纳入管理，随后**补齐配置**（确保 `terraform plan` 无变更）。
- **生命周期控制**：通过 `lifecycle` 块精细控制资源行为，如：

  ```
  resource "alicloud_instance" "this" {
    # ...其他配置...
    lifecycle {
      create_before_destroy = true # 先创建新实例，再销毁旧实例（避免 downtime）
      ignore_changes = [tags] # 忽略 tags 变更（不触发实例重建）
    }
  }
  ```

### 4. 与 OpenTofu 的关系

若你需要**完全开源且社区治理**的 IaC 工具，可考虑 **OpenTofu**。它与 Terraform 1.x 配置**高度兼容**（命令从 `terraform` 改为 `tofu` 即可），大部分示例可直接复用。

## 十、Terraform 一次支持纳管多少个云平台？

Terraform **几乎没有上限**，可以一次性纳管任意数量的云平台，只要存在对应的 **Provider 插件**。目前官方和社区已经提供了数百个 Provider，覆盖了：

- **主流公有云**：AWS、Azure、Google Cloud、Alibaba Cloud、Oracle Cloud 等。
- **私有云与虚拟化平台**：VMware、OpenStack、vSphere 等。
- **SaaS 与开发者服务**：Cloudflare、GitHub、GitLab、Datadog、Kubernetes 等。

在实际项目中，你可以在同一个 Terraform 配置中同时引入多个 Provider，从而统一管理不同平台的资源。例如：

- 在阿里云创建 ECS
- 在 Azure 部署 VM
- 在 AWS 配置 S3 存储桶
- 在 GCP 启动 GKE 集群  
  Terraform 会根据依赖关系自动生成执行计划，确保资源按需顺序或并行创建。

**注意事项：**

1. **Provider 覆盖度**：不同 Provider 的功能成熟度和覆盖度不一，有些可能仅支持部分资源。
2. **性能开销**：当资源数量达到数千甚至上万时，`terraform plan` 与 `terraform apply` 的耗时会明显增加。
3. **状态文件管理**：建议通过模块化拆分和远程状态存储，避免单一 `.tfstate` 文件过大、难以维护。

## 十一、总结与下一步

通过本文，你已掌握 Terraform 的**发展历史、核心原理、核心功能**，并完成了**阿里云 ECS**与**Azure Linux VM**从“网络到主机”的完整部署。

下一步建议：

1. **模块化封装**：将“VPC 配置”“云主机创建”等逻辑封装为模块，形成可复用的基础设施模板。
2. **端到端环境编排**：尝试将“数据库、对象存储、负载均衡、域名解析”等资源一起编排，构建完整的应用环境。
3. **自动化发布流水线**：结合 CI/CD 工具（如 GitHub Actions、GitLab CI，或 Terraform Cloud/Atlantis），实现“代码提交 → 自动 Plan → 人工审核 → 自动 Apply”的合规发布流程。

若配置需要适配你的实际“地域、实例规格、镜像”，可根据云平台控制台的信息调整变量，快速跑通属于自己的基础设施代码！  
