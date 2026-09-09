---
title: Oracle 19c 数据库实战：从单机部署到 DG 高可用架构搭建
---

**前言：在当今数字化时代，数据已成为企业最宝贵的资产之一。而数据库作为数据存储和管理的核心工具，其重要性不言而喻。Oracle 数据库作为全球领先的商业数据库管理系统，以其卓越的性能、可靠性和强大的功能，广泛应用于企业的关键业务系统中。无论是大型企业的 ERP、CRM 系统，还是金融、电信等行业的核心业务数据库，Oracle 都以其出色的性能和稳定性赢得了用户的信赖。**

**Oracle 19c 是 Oracle 公司推出的一个重要版本，它在性能优化、安全性增强以及多租户管理等方面进行了大量改进和创新。Oracle 19c 不仅支持最新的硬件和操作系统，还引入了许多新特性，如增强的分区表功能、更高效的内存管理以及更智能的查询优化器等。这些改进使得 Oracle 19c 能够更好地满足现代企业对数据库性能和扩展性的需求。**

**在企业级应用中，数据库的高可用性和数据安全性是至关重要的。Oracle 提供了多种高可用性解决方案，其中 Data Guard（DG）是最为常用和强大的一种。Oracle Data Guard 通过在主库和备库之间实时同步数据，确保在发生故障时能够快速切换到备库，从而实现业务的连续性。DG 不仅可以防止数据丢失，还能在主库发生故障时提供快速的恢复能力，极大地提高了系统的可用性和可靠性。**

**本文将详细介绍 Oracle 19c 数据库的单机部署以及 DG 高可用架构的搭建过程。通过详细的步骤和实际操作，读者可以快速掌握如何在生产环境中部署和配置 Oracle 数据库，并实现高可用性架构。无论是数据库管理员、系统工程师还是开发人员，本文都将为您提供实用的参考和指导。**

**在接下来的内容中，我们将从环境准备、单机部署、DG 配置到常见问题解决等多个方面进行详细讲解。通过本文的介绍，您将能够快速掌握 Oracle 19c 数据库的部署和管理技能，为您的企业应用提供强大的数据支持。**

**让我们开始这段 Oracle 19c 数据库实战之旅吧！**

## 一、Oracle 19c 单机部署

### 1.1 环境准备

在开始安装 Oracle 19c 之前，需要对服务器环境进行一系列的配置和准备，以确保安装过程顺利进行。

**1.1.1 修改内核参数**

编辑 `/etc/sysctl.conf` 文件，添加以下内容以调整系统内核参数，适应 Oracle 数据库的运行需求：

```
fs.aio-max-nr = 1048576
fs.file-max = 6815744
kernel.shmmax = 17179869184  # 一般为系统内存的50%
kernel.shmall = 8388608        # 按照系统内存计算
kernel.shmmni = 4096
kernel.sem = 250 32000 100 128
net.ipv4.ip_local_port_range = 9000 65500
net.core.rmem_default = 262144
net.core.rmem_max = 4194304
net.core.wmem_default = 262144
net.core.wmem_max = 1048576
```

根据服务器的系统内存大小，调整 `kernel.shmmax` 和 `kernel.shmall` 的值。例如，对于 16GB 内存的服务器，`kernel.shmmax` 应设置为 `8589934592`，`kernel.shmall` 设置为 `4194304`。

保存文件后，执行 `sysctl -p` 命令使配置的参数立即生效。

**1.1.2 创建管理用户和组**

在 Linux 系统中，创建专门的用户和组来管理 Oracle 数据库，以确保权限的安全性和规范性。执行以下命令：

```
groupadd dba
groupadd oinstall
useradd oracle -g oinstall -G dba
passwd oracle
```

这将创建 `dba` 和 `oinstall` 两个组，以及 `oracle` 用户，并将 `oracle` 用户添加到 `oinstall` 组和 `dba` 组中。最后，为 `oracle` 用户设置登录密码。

**1.1.3 创建数据目录**

为 Oracle 数据库软件和实例创建安装目录，并设置正确的权限：

```
mkdir -p /u01/app/oracle/product/19.0.0/dbhome_1
chown -R oracle:oinstall /u01
chmod -R 775 /u01
```

这将在 `/u01` 目录下创建 Oracle 软件安装目录和实例数据目录，并将目录的所有者和所属组设置为 `oracle` 和 `oinstall`，同时赋予适当的权限。

**1.1.4 修改用户资源限制**

编辑 `/etc/security/limits.conf` 文件，在文件末尾添加以下内容，以限制 Oracle 用户的资源使用：

```
oracle  soft  nproc  2047
oracle  hard  nproc  16384
oracle  soft  nofile  1024
oracle  hard  nofile  65536
```

此外，还需要检查 `/etc/security/limits.d/` 目录下是否有其他限制资源的配置文件，如果有，也需要进行相应的修改。

编辑 `/etc/pam.d/login` 文件，在文件末尾添加以下内容：

```
session required /lib64/security/pam_limits.so
session required pam_limits.so
```

编辑 `/etc/profile` 文件，在文件末尾添加以下内容：

```
if [ $USER = "oracle" ] || [ $USER = "grid" ]; then
    if [ $SHELL = "/bin/ksh" ]; then
        ulimit -p 16384
        ulimit -n 65536
    else
        ulimit -u 16384 -n 65536
    fi
    umask 022
fi
```

执行 `source /etc/profile` 命令使配置生效。

**1.1.5 修改 Oracle 用户环境变量**

编辑 `/home/oracle/.bash_profile` 文件，在文件末尾添加以下内容，设置 Oracle 用户的环境变量：

```
export TMP=/tmp
export TMPDIR=$TMP
export ORACLE_BASE=/u01/app/oracle
export ORACLE_HOME=$ORACLE_BASE/product/19.0.0/dbhome_1
export ORACLE_SID=orcl
export PATH=$ORACLE_HOME/bin:$PATH
export LD_LIBRARY_PATH=$ORACLE_HOME/lib:/lib:/usr/lib
export LANG="en_US.UTF-8"
export NLS_LANG=american_AMERICA.AL32UTF8
export NLS_DATE_FORMAT='yyyy-mm-dd hh24:mi:ss'
export CV_ASSUME_DISTID=OEL7
```

执行 `source /home/oracle/.bash_profile` 命令使环境变量配置生效。

**1.1.6 安装 Oracle 依赖**

使用 `yum` 包管理器安装 Oracle 数据库所需的依赖包：

```
yum install -y bc binutils-* compat-libcap1-* compat-libstdc++-* e2fsprogs-1.41.12-* e2fsprogs-libs-* glibc-* glibc-devel-* ksh libaio-* libaio-devel-* libX11-* libXau-* libXi-* libXtst-* libgcc-* libstdc++-* libstdc++-devel-* libxcb-* libXrender libXrender-devel make-* net-tools-* nfs-utils-* smartmontools-* sysstat-* gcc-c++*  ksh libaio-devel libstdc++-devel  libnsl
yum -y install compat-libcap1 compat-libstdc++-33 gcc gcc-c++ glibc-devel ksh libaio-devel libaio-devel sysstat elfutils-libelf-devel fontconfig-devel libxcb smartmontools libX11 libXau libXtst libXrender libXrender-devel
```

### 1.2 数据库安装

**1.2.1 上传并解压安装包**

将 Oracle 19c 的安装包 `LINUX.X64_193000_db_home.zip` 上传到 `/home/oracle` 目录下。使用 `unzip` 命令解压安装包到指定的 Oracle 安装目录：

```
su - oracle
unzip LINUX.X64_193000_db_home.zip -d /u01/app/oracle/product/19.0.0/dbhome_1
```

**1.2.2 编辑配置文件**

编辑以下三个配置文件，分别用于 Oracle 软件安装、数据库配置和网络配置：

- `db_install.rsp`：位于 `/u01/app/oracle/product/19.0.0/dbhome_1/install/response/` 目录下，复制到 `/home/oracle/etc` 目录进行编辑。
- `dbca.rsp`：位于 `/u01/app/oracle/product/19.0.0/dbhome_1/assistants/dbca/` 目录下，复制到 `/home/oracle/etc` 目录进行编辑。
- `netca.rsp`：位于 `/u01/app/oracle/product/19.0.0/dbhome_1/assistants/netca/` 目录下，复制到 `/home/oracle/etc` 目录进行编辑。

在 `db_install.rsp` 文件中，根据实际环境修改以下关键参数：

```
oracle.install.responseFileVersion=/oracle/install/rspfmt_dbinstall_response_schema_v19.0.0
oracle.install.option=INSTALL_DB_SWONLY
UNIX_GROUP_NAME=oinstall
INVENTORY_LOCATION=/u01/app/oracle/oraInventory
ORACLE_HOME=/u01/app/oracle/product/19.0.0/dbhome_1
ORACLE_BASE=/u01/app/oracle
oracle.install.db.InstallEdition=EE
oracle.install.db.OSDBA_GROUP=dba
oracle.install.db.OSOPER_GROUP=dba
oracle.install.db.OSBACKUPDBA_GROUP=dba
oracle.install.db.OSDGDBA_GROUP=dba
oracle.install.db.OSKMDBA_GROUP=dba
oracle.install.db.OSRACDBA_GROUP=dba
oracle.install.db.config.starterdb.type=GENERAL_PURPOSE
oracle.install.db.config.starterdb.globalDBName=orcl
oracle.install.db.config.starterdb.SID=orcl
oracle.install.db.config.starterdb.characterSet=AL32UTF8
oracle.install.db.config.starterdb.memoryOption=true
oracle.install.db.config.starterdb.memoryLimit=2048
oracle.install.db.config.starterdb.installExampleSchemas=false
oracle.install.db.config.starterdb.password.ALL=oracle
```

在 `dbca.rsp` 文件中，修改以下参数以配置数据库实例：

```
responseFileVersion=/oracle/assistants/rspfmt_dbca_response_schema_v19.0.0
gdbName=orcl
sid=orcl
databaseConfigType=SI
templateName=General_Purpose.dbc
sysPassword=oracle
systemPassword=oracle
oracleHomeUserPassword=oracle
dbsnmpPassword=oracle
datafileDestination=/u01/app/oracle/oradata
recoveryAreaDestination=/u01/app/oracle/flash_recovery_area
```

`netca.rsp` 文件在本次安装中不做修改。

**1.2.3 静默安装 Oracle 软件**

在 Oracle 安装目录下执行以下命令，开始静默安装 Oracle 19c 软件：

```
cd /u01/app/oracle/product/19.0.0/dbhome_1
./runInstaller -silent -responseFile /home/oracle/etc/db_install.rsp
```

安装过程中可能会出现一些警告信息，如 `INS-13014`，提示目标环境不满足某些可选要求。此时，可以根据日志文件中的提示进行手动调整，或者在安装完成后根据实际情况进行优化。

安装完成后，根据提示以 `root` 用户身份执行以下两个脚本，完成安装的最后步骤：

```
su - root
sh /u01/app/oraInventory/orainstRoot.sh
sh /u01/app/oracle/product/19.0.0/dbhome_1/root.sh
```

**1.2.4 配置监听**

使用 `netca` 命令以静默模式配置 Oracle 监听器：

```
netca -silent -responsefile /home/oracle/etc/netca.rsp
```

配置完成后，可以通过 `lsnrctl status` 命令查看监听器的状态，确保监听器已成功启动并正常运行。

**1.2.5 静默创建数据库**

使用 `dbca` 命令以静默模式创建 Oracle 数据库实例：

```
dbca -createDatabase -silent -responseFile /home/oracle/etc/dbca.rsp
```

创建过程中，`dbca` 会按照配置文件中的参数逐步创建数据库，并在完成后提供详细的日志信息。可以通过查看日志文件 `/u01/app/oracle/cfgtoollogs/dbca/orcl/orcl.log` 来了解创建过程中的详细情况。

**1.2.6 验证安装结果**

通过 `lsnrctl status` 命令查看监听器状态，确认数据库服务已正确注册到监听器上。使用 `sqlplus / as sysdba` 登录到数据库，执行以下命令查看数据库的状态：

```
select status from v$instance;
```

如果返回结果为 `OPEN`，则表示数据库已成功打开并正常运行。

### 1.3 常见问题及解决方法

在 Oracle 19c 的安装过程中，可能会遇到一些常见问题，以下是两个典型的例子及其解决方法：

**1.3.1 共享库文件缺失问题**

在执行安装命令时，可能会遇到如下错误：

```
/u01/app/oracle/product/19.0.0/dbhome_1/perl/bin/perl: error while loading shared libraries: libnsl.so.1: cannot open shared object file: No such file or directory
```

这是由于系统缺少 `libnsl.so.1` 共享库文件所致。可以通过以下命令安装缺失的库文件来解决问题：

```
yum install libnsl -y
```

**1.3.2 操作系统标识问题**

在安装过程中，可能会出现 `INS-08101` 错误，提示操作系统标识不匹配。此时，可以通过设置环境变量 `CV_ASSUME_DISTID` 来指定操作系统标识为 `OEL7`，以解决此问题：

```
echo "export CV_ASSUME_DISTID=OEL7" >> /home/oracle/.bash_profile
source /home/oracle/.bash_profile
```

## 二、Oracle 19c DG 模式搭建

DG（Data Guard）模式是 Oracle 数据库提供的高可用性解决方案，通过在主库和备库之间同步数据，实现数据的实时备份和高可用性。以下是 DG 模式搭建的详细步骤。

### 2.1 备库环境准备

在备库服务器上，执行与主库相同的步骤 7.1 至 7.4，确保备库的目录结构和 Oracle 软件版本与主库完全一致。

### 2.2 主库配置

**2.2.1 数据库备份**

使用 RMAN（Recovery Manager）对主库进行全库备份，为后续的 DG 配置提供基础数据：

```
rman target /
backup database;
list backupset;
```

**2.2.2 打开数据库 Forced Logging 模式**

执行以下 SQL 命令，打开数据库的 Forced Logging 模式，确保所有数据修改操作都生成日志，避免备库数据出现不一致：

```
alter database force logging;
```

**2.2.3 设置数据库为归档模式**

将数据库设置为归档模式，以保存所有的重做日志文件，供备库进行数据同步：

```
archive log list;
shutdown immediate;
startup mount;
alter database archivelog;
archive log list;
```

**2.2.4 创建密码文件**

使用 `orapwd` 命令创建密码文件，以便在数据库未启动时也能进行身份验证：

```
orapwd file=/u01/app/oracle/product/19.0.0/dbhome_1/dbs/spfile$ORACLE_SID.ora password='orcl@12345' entries=10
```

**2.2.5 添加联机日志文件**

为主库添加联机日志文件，以提高数据同步的效率和可靠性：

```
alter database add standby logfile group 4('/u01/app/oracle/oradata/orcl/redo04.log') size 200m;
alter database add standby logfile group 5('/u01/app/oracle/oradata/orcl/redo05.log') size 200m;
alter database add standby logfile group 6('/u01/app/oracle/oradata/orcl/redo06.log') size 200m;
alter database add standby logfile group 7('/u01/app/oracle/oradata/orcl/redo07.log') size 200m;
```

**2.2.6 修改主库参数文件**

使用以下命令将服务器参数文件（spfile）转换为文本参数文件（pfile），以便进行修改：

```
create pfile from spfile;
```

在生成的 `init$ORACLE_SID.ora` 文件中，修改以下参数以配置 DG 模式：

```
*.db_unique_name='pr123'
*.log_archive_config='dg_config=(pr123,st124)'
*.log_archive_dest_1='location=/u01/app/oracle/oradata/orcl/archive valid_for=(all_logfiles,all_roles) db_unique_name=pr123'
*.log_archive_dest_2='service=st124 reopen=120 lgwr async valid_for=(online_logfiles,primary_role) db_unique_name=st124'
*.log_archive_dest_state_1='ENABLE'
*.log_archive_dest_state_2='ENABLE'
*.standby_file_management='auto'
*.fal_server='pr123'
*.fal_client='st124'
*.log_file_name_convert='st124','pr123'
```

修改完成后，使用以下命令重新创建 spfile 并重启数据库：

```
alter database nomount;
create spfile from pfile;
alter database open;
```

### 2.3 备库配置

**2.3.1 创建恢复目录**

在备库服务器上，创建与主库结构相同的目录，包括 `admin`、`fast_recovery_area` 和 `oradata` 等目录，以便后续的数据恢复操作。

**2.3.2 修改监听和网络配置**

将主库的 `listener.ora` 和 `tnsnames.ora` 文件复制到备库的相应目录中，并根据备库的 IP 地址修改监听文件中的主机信息。确保主库和备库之间的网络连通性，可以通过 `tnsping` 命令进行测试：

```
tnsping st124  # 在主库上执行
tnsping pr123  # 在备库上执行
```

**2.3.3 拷贝参数文件**

将主库配置好的 `init$ORACLE_SID.ora` 参数文件拷贝至备库的 `/u01/app/oracle/product/19.0.0/dbhome_1/dbs/` 目录中，并根据备库的实际情况进行修改：

```
*.db_unique_name='st124'
*.log_archive_dest_1='location=/u01/app/oracle/oradata/orcl/archive valid_for=(all_logfiles,all_roles) db_unique_name=st124'
*.log_archive_dest_2='service=pr123 reopen=120 lgwr async valid_for=(online_logfiles,primary_role) db_unique_name=pr123'
*.fal_server='pr123'
*.fal_client='st124'
```

**2.3.4 建立 SPFILE**

在备库上，使用以下命令创建 spfile 并启动数据库到 nomount 状态：

```
create spfile from pfile='/u01/app/oracle/product/19.0.0/dbhome_1/dbs/init$ORACLE_SID.ora';
create pfile from spfile;
alter database nomount;
```

**2.3.5 恢复备库**

确保主库处于 open 状态，备库处于 nomount 状态。在主库上执行以下 RMAN 命令，通过网络将主库的数据直接复制到备库，创建备库实例：

```
rman target sys/******@pr123 auxiliary sys/******@st124
duplicate target database for standby from active database nofilenamecheck;
```

恢复完成后，检查主备库中的文件是否一致，并重新建立联机重做日志：

```
alter database drop logfile group 4;
alter database drop logfile group 5;
alter database drop logfile group 6;
alter database drop logfile group 7;
alter database add standby logfile '/u01/app/oracle/oradata/orcl/redo04.log' SIZE 200m;
alter database add standby logfile '/u01/app/oracle/oradata/orcl/redo05.log' SIZE 200m;
alter database add standby logfile '/u01/app/oracle/oradata/orcl/redo06.log' SIZE 200m;
alter database add standby logfile '/u01/app/oracle/oradata/orcl/redo07.log' SIZE 200m;
```

### 2.4 启动数据同步

在备库上，执行以下命令启动数据同步：

```
alter database recover managed standby database using current logfile disconnect from session;
```

### 2.5 验证 DG 模式状态

在主库和备库上，分别执行以下命令查看实例名、日志序号等信息，确保数据同步正常进行，且不存在日志间隙（GAP）：

```
show parameter instance_name;
select max(sequence#) from v$archived_log;
select FIRST_TIME,NEXT_TIME, APPLIED,SEQUENCE# from v$archived_log order by SEQUENCE#;
```

在主库上执行 `Alter system switch logfile；` 命令测试切换日志，观察备库的日志应用情况。

通过以上步骤，您就可以成功搭建一个高可用的 Oracle 19c DG 模式环境，为企业的关键业务数据提供可靠的保障。  
