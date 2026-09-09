---
title: 【实战+原理】微软云 Azure Database 私有网络接入模式全解析：从子网委派到Private Endpoint
---

**前言：在云上构建应用，数据库的`网络安全`是重中之重。如何确保你的应用能以最安全、高效的方式访问Azure数据库，同时将攻击面降至最低？这篇博客将为你彻底厘清Azure各大数据库服务的私有网络接入机制。**

Azure提供了两大核心模式来实现VNet（虚拟网络）集成：

1. **VNet集成 (子网委ăpadă - Subnet Delegation):** 这种模式将数据库服务实例直接“注入”到你自己的VNet子网中。数据库就像一台虚拟机一样，拥有该子网的私有IP，与你的应用服务天然处于同一网络平面。
2. **私有终结点 (Private Endpoint) + 私有DNS区域 (Private DNS Zone):** 这种模式更为灵活。数据库本身仍在Azure托管的物理网络中，但它会通过一个专用的网络接口（Private Endpoint）在你的VNet中“投影”出一个私有IP。所有到该数据库的访问都通过这个私有IP进行，流量完全在Azure的骨干网络中，不经公网。

然而，并非所有数据库都支持这两种模式。不同的服务架构决定了其适配的网络模型。下面，我们将逐一拆解，并提供详尽的操作指南。

## 一、新一代灵活服务：Azure Database for PostgreSQL/MySQL Flexible Server

作为Azure新一代的开源数据库服务，“灵活服务器（Flexible Server）”在网络配置上提供了最大的灵活性。

- **支持模式**:
  - ✅ **VNet集成 (子网委派)**
  - ✅ **私有终结点 (Private Endpoint) + 私有DNS区域**

#### 原理通俗解释

- **子网委派**：就像你把数据库服务器这台“设备”直接搬进了自家的局域网（VNet子网），它和你的其他应用（VM、App Service）成了邻居，可以直接“内部通话”。
- **Private Endpoint**：数据库还在微软的大机房里，但你在自家局域网里安装了一部“内线电话”（Private Endpoint），可以直接拨打到数据库，通话内容（数据）全程加密且不走公共电话网（互联网）。

#### 如何选择？

- **推荐使用子网委派**：对于全新的、安全要求高的生产环境，这是最理想的选择。它提供了最彻底的网络隔离，配置也更直接，一旦设置，网络拓扑非常清晰。
- **选择Private Endpoint的场景**：
  1. **已有复杂网络**：当你的VNet已经规划完毕，无法轻易划分出一个空子网时。
  2. **混合云/跨VNet访问**：当需要从本地数据中心或其他对等VNet访问数据库时，Private Endpoint提供了更灵活的连接方案。
  3. **无法在创建时确定网络**：子网委派必须在创建数据库实例时配置，而Private Endpoint可以在实例创建后随时添加。

---

## 二、平台即服务(PaaS)的典范：Azure SQL Database & Cosmos DB

Azure SQL Database和Cosmos DB是高度托管、全球分布的多租户服务。其架构决定了你无法将其“搬进”自己的VNet。

- **支持模式**:
  - ❌ **子网委派** (不支持)
  - ✅ **私有终结点 (Private Endpoint) + 私有DNS区域**

#### 原理通俗解释

想象一下，SQL Database和Cosmos DB是一个巨大的“共享公寓楼”，由Azure统一管理。你无法把整个公寓楼搬到你的私人别墅区（VNet）里。但你可以在你的别墅区开一个“私密通道”（Private Endpoint），直达你在公寓楼里的房间，安全又私密。

#### 操作核心

配置这类服务的关键在于 **DNS解析**。当你创建Private Endpoint后，必须配置一个对应的私有DNS区域（例如 `privatelink.database.windows.net` for SQL DB），并将其链接到你的VNet。这样，当你的应用访问 `mydb.database.windows.net` 时，VNet内的DNS会将其解析到你在VNet中创建的私有IP，而不是公网IP。

---

## 三、托管的IaaS体验：Azure SQL Managed Instance

SQL Managed Instance (MI) 在产品形态上更接近于一个完整的、托管的SQL Server实例，它需要一个更独立的运行环境。

- **支持模式**:
  - ✅ **VNet集成 (子网委派)** - **强制且独占**
  - ❌ **私有终结点** (不支持)

#### 原理通俗解释

SQL MI就像一个“精装修的集装箱别墅”。你必须在你的地皮（VNet）上划出一块专用区域（一个空的、专用的子网），然后Azure会把这个“别墅”整个吊装进去。它需要独占这块地，不能和其他建筑（如VM）混用。

#### 关键要点

- **必须使用空子网**：在部署SQL MI之前，你需要准备一个干净的、未被任何其他资源使用的子网。
- **子网独占**：一旦委派给SQL MI，该子网就不能再用于部署其他类型的Azure资源。
- **网络规划先行**：由于其强制性和独占性，必须在架构设计阶段就为SQL MI规划好网络空间。

---

## 四、即将退役的服务：Azure Database for MariaDB

作为经典版的数据库服务，其网络模型与SQL Database类似。

- **支持模式**:
  - ❌ **子网委派** (不支持)
  - ✅ **私有终结点 (Private Endpoint) + 私有DNS区域**

**说明**: 官方已不推荐使用此服务，建议所有新项目和现有项目迁移到功能更强大、网络更灵活的 **Azure Database for MySQL Flexible Server**。

---

## 快速查阅：全数据库接入模式总览表

| 数据库服务 | 子网委派 (Subnet Delegation) | Private Endpoint + DNS Zone | 核心特点与建议 |
| --- | --- | --- | --- |
| **PostgreSQL Flexible Server** | ✅ 支持 | ✅ 支持 | **推荐子网委派**，提供最彻底的网络隔离。 |
| **MySQL Flexible Server** | ✅ 支持 | ✅ 支持 | 与PostgreSQL FS一致，新建生产环境首选子网委派。 |
| **Azure SQL Database** | ❌ 不支持 | ✅ 支持 | PaaS多租户架构，只能通过Private Endpoint接入。 |
| **Azure SQL Managed Instance** | ✅ **强制** | ❌ 不支持 | 类IaaS体验，必须独占一个专用子网。 |
| **Cosmos DB** | ❌ 不支持 | ✅ 支持 | 全球分布的多租户服务，只能通过Private Endpoint接入。 |
| **MariaDB (经典版)** | ❌ 不支持 | ✅ 支持 | 旧版服务，建议迁移至MySQL Flexible Server。 |

---

## 五、实战操作指南：手把手带你配置（图形化界面版）-可选步骤

理论讲完，我们上实操。下面分两种模式，讲解核心配置步骤。

### 场景一：为PostgreSQL/MySQL Flexible Server配置VNet集成（子网委派）

1. **准备网络环境**：

   - 进入Azure门户，创建一个新的**虚拟网络 (VNet)**。
   - 在VNet内，创建一个专用于数据库的**子网 (Subnet)**，例如 `db-subnet`。**注意：此时不要做任何委派操作**。
2. **创建数据库实例**：

   - 新建一个 **Azure Database for PostgreSQL/MySQL flexible server**。
   - 在 **“网络 (Networking)”** 选项卡中，选择 **“专用访问(VNet集成)” (Private access (VNet integration))**。
   - 在下方选择你刚刚创建的VNet和`db-subnet`。
   - 点击创建。Azure会自动将该子网的委派设置为 `Microsoft.DBforPostgreSQL/flexibleServers` 或 `Microsoft.DBforMySQL/flexibleServers`。
3. **验证连接**：

   - 在同VNet的另一个子网中启动一台虚拟机（Jumpbox）。
   - 通过`psql`或`mysql`命令行工具，使用数据库的完全限定域名 (FQDN) 直接连接。你会发现它解析到的是`db-subnet`地址段内的一个私有IP。

### 场景二：为Azure SQL Database配置Private Endpoint

1. **创建数据库实例**：

   - 正常创建一个 **Azure SQL Database**。在网络设置中，可以选择“禁用公网访问”，或者保持启用状态但通过防火墙限制。
2. **创建Private Endpoint**：

   - 进入Azure门户，搜索并创建 **“私有终结点 (Private Endpoint)”**。
   - **基础 (Basics)** 页：选择订阅、资源组，并为Endpoint命名。
   - **资源 (Resource)** 页：
     - 连接方法选择“连接到我的目录中的Azure资源”。
     - 资源类型选择 `Microsoft.Sql/servers`。
     - 资源选择你刚刚创建的SQL Server实例。
     - 目标子资源选择 `sqlServer`。
   - **虚拟网络 (Virtual Network)** 页：选择你的VNet和希望放置Endpoint的子网。
   - **DNS** 页：这是最关键的一步！
     - 选择 **“与私有DNS区域集成” (Integrate with private DNS zone)** 为“是 (Yes)”。
     - Azure会自动检测并创建一个名为 `privatelink.database.windows.net` 的**私有DNS区域**。
   - 创建并等待部署完成。
3. **验证连接**：

   - 部署完成后，Azure会自动在该私有DNS区域中为你的数据库创建一个A记录，指向Private Endpoint的私有IP。同时，这个私有DNS区域会自动链接到你的VNet。
   - 从VNet内的VM上，使用 `nslookup your-db-server.database.windows.net`。你会看到它被解析为`10.x.x.x`这样的私有IP，而不是公网IP。
   - 现在，你可以安全地从VNet内通过私有IP访问数据库了。

## 六、实战操作指南：手把手带你配置（Azure CLI命令版）-可选步骤

理论讲完，我们上实操。下面分两种模式，讲解核心配置步骤。

在开始之前，请确保你已经安装并登录了 Azure CLI：

```
az login
```

并设置了默认订阅：

```
az account set --subscription "YourSubscriptionNameOrID"
```

### 场景一：为PostgreSQL/MySQL Flexible Server配置VNet集成（子网委派）

在这个场景中，我们将以 PostgreSQL Flexible Server 为例。MySQL Flexible Server 的命令非常相似。

1. **准备网络环境**：

   - 创建一个新的**资源组 (Resource Group)**（如果还没有）。

   ```
   az group create --name MyFlexibleServerRG --location eastus
   ```

   - 创建一个新的**虚拟网络 (VNet)**。

   ```
   az network vnet create \
     --resource-group MyFlexibleServerRG \
     --name MyVNet \
     --address-prefix 10.0.0.0/16
   ```

   - 在VNet内，创建一个专用于数据库的**子网 (Subnet)**，例如 `db-subnet`。**注意：此时不要手动添加委派，创建数据库时会自动完成。**

   ```
   az network vnet subnet create \
     --resource-group MyFlexibleServerRG \
     --vnet-name MyVNet \
     --name db-subnet \
     --address-prefixes 10.0.1.0/24 \
     --service-endpoints Microsoft.Web Microsoft.Storage # 可选：根据应用需求添加服务终结点
   ```
2. **创建数据库实例**：

   - 新建一个 **Azure Database for PostgreSQL flexible server**，并将其集成到 `db-subnet`。

   ```
   # 定义一些变量，方便后续使用
   DB_SERVER_NAME="myflexpgserver-$RANDOM" # 确保服务器名称唯一
   DB_ADMIN_USER="pgadmin"
   DB_ADMIN_PASSWORD="YourStrongPassword123!" # 请替换为强密码
   LOCATION="eastus"
   RESOURCE_GROUP="MyFlexibleServerRG"
   VNET_NAME="MyVNet"
   SUBNET_ID=$(az network vnet subnet show \
                 --resource-group $RESOURCE_GROUP \
                 --vnet-name $VNET_NAME \
                 --name db-subnet \
                 --query id -o tsv)

   az postgres flexible-server create \
     --resource-group $RESOURCE_GROUP \
     --name $DB_SERVER_NAME \
     --location $LOCATION \
     --version 13 \
     --admin-user $DB_ADMIN_USER \
     --admin-password $DB_ADMIN_PASSWORD \
     --public-access None \
     --vnet $VNET_NAME \
     --subnet $SUBNET_ID \
     --tier Burstable \
     --sku-name Standard_B1ms \
     --storage-size 20 \
     --backup-retention 7 \
     --geo-redundant-backup Disabled \
     --yes
   ```

   - **重要提示**: 在此命令执行期间，Azure 会自动为 `db-subnet` 添加 `Microsoft.DBforPostgreSQL/flexibleServers` 的子网委派。
3. **验证连接**：

   - 在同VNet的另一个子网中创建一台虚拟机（作为Jumpbox或应用服务器）。
   - 在VM上安装 `psql` 客户端。
   - 尝试连接数据库：

   ```
   # 获取数据库的FQDN
   DB_FQDN=$(az postgres flexible-server show \
               --resource-group $RESOURCE_GROUP \
               --name $DB_SERVER_NAME \
               --query fqdn -o tsv)

   psql --host=$DB_FQDN --port=5432 --username=$DB_ADMIN_USER --dbname=postgres
   # 输入密码后即可连接
   ```

   - 你会发现连接成功，且网络流量完全在VNet内部。

### 场景二：为Azure SQL Database配置Private Endpoint

我们将以 Azure SQL Database 为例。Cosmos DB 的 Private Endpoint 配置命令非常相似。

1. **创建数据库实例**：

   - 首先创建一个SQL Server和SQL Database。

   ```
   # 定义一些变量
   SQL_RG="MySqlDbRG"
   SQL_SERVER_NAME="mysqldbserver-$RANDOM"
   SQL_DB_NAME="mysqldatabase"
   SQL_ADMIN_USER="sqladmin"
   SQL_ADMIN_PASSWORD="YourStrongPassword123!" # 请替换为强密码
   LOCATION="eastus"

   az group create --name $SQL_RG --location $LOCATION

   # 创建SQL Server
   az sql server create \
     --resource-group $SQL_RG \
     --name $SQL_SERVER_NAME \
     --location $LOCATION \
     --admin-user $SQL_ADMIN_USER \
     --admin-password $SQL_ADMIN_PASSWORD

   # 创建SQL Database
   az sql db create \
     --resource-group $SQL_RG \
     --server $SQL_SERVER_NAME \
     --name $SQL_DB_NAME \
     --edition GeneralPurpose \
     --family Gen5 \
     --capacity 2 \
     --zone-redundant false
   ```

   - **重要**：为了确保Private Endpoint生效，建议禁用SQL Server的公共网络访问。

   ```
   az sql server update \
     --resource-group $SQL_RG \
     --name $SQL_SERVER_NAME \
     --public-network-access Disabled
   ```
2. **准备网络环境**：

   - 创建一个新的VNet（如果还没有），或使用现有VNet。

   ```
   az network vnet create \
     --resource-group $SQL_RG \
     --name SQLVNet \
     --address-prefix 10.10.0.0/16
   ```

   - 创建一个子网来托管Private Endpoint。

   ```
   az network vnet subnet create \
     --resource-group $SQL_RG \
     --vnet-name SQLVNet \
     --name pe-subnet \
     --address-prefixes 10.10.1.0/24 \
     --disable-private-endpoint-network-policies true # 私有终结点子网必须禁用网络策略
   ```

   - **重要提示**：托管 Private Endpoint 的子网必须禁用私有终结点网络策略 (`--disable-private-endpoint-network-policies true`)。
3. **创建Private Endpoint**：

   - 为SQL Server创建Private Endpoint。

   ```
   # 定义Private Endpoint相关变量
   PE_NAME="my-sql-privateendpoint"
   PRIVATE_DNS_ZONE_NAME="privatelink.database.windows.net"
   SUBNET_ID=$(az network vnet subnet show \
                 --resource-group $SQL_RG \
                 --vnet-name SQLVNet \
                 --name pe-subnet \
                 --query id -o tsv)
   SQL_SERVER_ID=$(az sql server show \
                     --resource-group $SQL_RG \
                     --name $SQL_SERVER_NAME \
                     --query id -o tsv)

   az network private-endpoint create \
     --resource-group $SQL_RG \
     --name $PE_NAME \
     --location $LOCATION \
     --vnet-name SQLVNet \
     --subnet $SUBNET_ID \
     --private-connection-resource-id $SQL_SERVER_ID \
     --group-id sqlServer \
     --connection-name "mySQLConnection"
   ```
4. **创建并链接私有DNS区域**：

   - Private Endpoint 需要与对应的私有DNS区域协同工作，才能在VNet内部正确解析到私有IP。

   ```
   # 创建私有DNS区域
   az network private-dns zone create \
     --resource-group $SQL_RG \
     --name $PRIVATE_DNS_ZONE_NAME

   # 将私有DNS区域链接到VNet
   az network private-dns link vnet create \
     --resource-group $SQL_RG \
     --zone-name $PRIVATE_DNS_ZONE_NAME \
     --name SQLVNetLink \
     --virtual-network SQLVNet \
     --registration-enabled false # 这里无需自动注册
   ```

   - **自动创建DNS记录**：当Private Endpoint创建成功并与私有DNS区域集成后，Azure会自动在 `privatelink.database.windows.net` 区域中创建一个 A 记录，指向 Private Endpoint 的私有 IP。
5. **验证连接**：

   - 从VNet内的VM上（比如部署在 `pe-subnet` 或其他子网的VM），使用 `nslookup` 命令查看数据库的FQDN解析结果。

   ```
   # 从VNet内的VM执行
   nslookup $SQL_SERVER_NAME.database.windows.net
   ```

   - 你会看到它解析为一个`10.10.1.x`（或 `pe-subnet` 地址段内）的私有IP，而不是公网IP。
   - 现在，你可以通过 `sqlcmd` 或其他SQL客户端工具，使用数据库的FQDN和凭据安全地从VNet内部访问数据库了。

   ```
   # 从VNet内的VM执行
   sqlcmd -S $SQL_SERVER_NAME.database.windows.net -U $SQL_ADMIN_USER -P $SQL_ADMIN_PASSWORD
   ```

## 总结：选择最适合你的模式

为Azure数据库选择网络接入模式，本质上是在**隔离级别、灵活性和架构适配性**之间做权衡。

- **追求极致隔离的新项目？** -> 选择 **PostgreSQL/MySQL Flexible Server** 并使用 **VNet集成（子网委派）**。
- **需要托管一个完整的SQL Server环境？** -> **SQL Managed Instance** 是唯一选择，并为其规划好专用子网。
- **使用高度托管的PaaS或全球分布式数据库？** -> **Private Endpoint** 是你接入 **SQL Database** 和 **Cosmos DB** 的标准且唯一的方式。

理解这些模式的底层逻辑和适用场景，你就能为你的云上应用构建一个既安全又高效的数据库网络架构。  
