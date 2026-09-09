---
title: 基于CVE安全公告号，全面修复麒麟ARM系统OpenSSH漏洞
---

**前言：负责的其中一个从0开始搭建的某生产项目上线前需要做青藤安全扫描，过了后才允许上线，该项目从操作系统、中间件、数据库、容器等全国产信创化，公司公告为CVE安全公告号，而修复漏洞的责任归我，需要根据青藤安全发布的CVE公告号来修复麒麟ARM系统的漏洞是一门学问，以下分享在线修复和离线修复操作课程。**  
**青藤发布风险名称及安全公告号：**

```
1、OpenSSH 资源管理错误漏洞(CVE-2021-28041)
2、OpenSSH权限提升漏洞(CVE-2021-41617)
3、OpenSSH 输入验证错误漏洞(CVE-2020-12062)
4、OpenSSH 信息泄露漏洞(CVE-2020-14145)
```

**青藤风险描述：**  
1、OpenSSH（OpenBSD Secure Shell）是Openbsd计划组的一套用于安全访问远程计算机的连接工具。该工具是SSH协议的开源实现，支持对所有的传输进行加密，可有效阻止窃听、连接劫持以及其他网络级的攻击。 OpenSSH before 8.5 存在安全漏洞，攻击者可利用该漏洞在遗留操作系统上不受约束的代理套接字访问。  
2、OpenSSH（OpenBSD Secure Shell）是Openbsd计划组的一套用于安全访问远程计算机的连接工具。该工具是SSH协议的开源实现，支持对所有的传输进行加密，可有效阻止窃听、连接劫持以及其他网络级的攻击。 OpenSSH存在安全漏洞。该漏洞源于允许权限提升，因为补充组未按预期初始化。  
3、OpenSSH（OpenBSD Secure Shell）是OpenBSD计划组的一套用于安全访问远程计算机的连接工具。该工具是SSH协议的开源实现，支持对所有的传输进行加密，可有效阻止窃听、连接劫持以及其他网络级的攻击。 OpenSSH 8.2版本中存在安全漏洞，该漏洞源于在utimes系统调用失败时，scp客户端错误地向服务器发送了重复的响应。攻击者可通过在远程服务器上创建子目录利用该漏洞覆盖客户端下载目录中的任意文件。  
4、OpenSSH（OpenBSD Secure Shell）是OpenBSD计划组的一套用于安全访问远程计算机的连接工具。该工具是SSH协议的开源实现，支持对所有的传输进行加密，可有效阻止窃听、连接劫持以及其他网络级的攻击。 OpenSSH 5.7版本至8.3版本的客户端中存在安全漏洞。攻击者可利用该漏洞获取信息。  
**青藤修复建议：**  
1、目前厂商已发布升级补丁以修复漏洞，补丁获取链接：  
<https://github.com/openssh/openssh-portable/commit/e04fd6dde16de1cdc5a4d9946397ff60d96568db>  
2、升级到 OpenSSH 版本 8.8 或更高版本，链接：<https://www.openssh.com/txt/release-8.8>  
3、目前厂商已发布升级补丁以修复漏洞，补丁获取链接： <https://www.openssh.com/txt/release-8.3>  
目前厂商已发布升级补丁以修复漏洞，补丁获取链接： <https://www.openssh.com/txt/release-8.3>  
**以上修复建议对传统主流X86操作系统好使，但是该系统用的是麒麟ARM架构操作系统**  
**个人判断对应麒麟安全公告号：**

```
1、KYSA-202103-0046；KYSA-202112-1027
2、KYSA-202304-1008；KYSA-202205-1080；KYSA-202112-1022；KYSA-202110-1061
3、KYSA-202012-1004
4、KYSA-202304-1008；KYSA-202205-1080；KYSA-202106-1012；KYSA-202106-1006
```

**总结：**麒麟更新openssh版本非CVE版本号，而是对应8.2里的小版本

### 一、在线操作：

在线操作很简单，因为这里yum源配置的是自动更新最新路径的环境变量，所以只需要执行两条命令进行升级openssh，可以直接将以上漏洞一起更新。  
命令：`yum makecache`  
命令：`yum update openssh`  

### 二、离线操作：

### 1、KYSA-202103-0046（麒麟对应公告号）；

①受影响的软件包  
`openssh-client、openssh-server、openssh-sftp-server、openssh-tests、ssh-askpass-gnome、ssh`  
②下载软件包进行升级安装  
通过软件包地址下载软件包，使用软件包升级命令根据受影响的软件包列表升级相关的组件包。  
`sudo dpkg -i /Path1/Package1 /Path2/Package2 /Path3/Package3……`  
注：Path 指软件包下载到本地的路径，Package指下载的软件包名称，多个软件包则以空格分开。  
③软件包下载地址

```
https://archive.kylinos.cn/kylin/KYLIN-ALL/pool/main/o/openssh/openssh-client_8.2p1-4kylin3_arm64.deb
https://archive.kylinos.cn/kylin/KYLIN-ALL/pool/main/o/openssh/openssh-server_8.2p1-4kylin3_arm64.deb
https://archive.kylinos.cn/kylin/KYLIN-ALL/pool/main/o/openssh/openssh-sftp-server_8.2p1-4kylin3_arm64.deb
https://archive.kylinos.cn/kylin/KYLIN-ALL/pool/main/o/openssh/openssh-tests_8.2p1-4kylin3_arm64.deb
https://archive.kylinos.cn/kylin/KYLIN-ALL/pool/main/o/openssh/ssh-askpass-gnome_8.2p1-4kylin3_arm64.deb
https://archive.kylinos.cn/kylin/KYLIN-ALL/pool/main/o/openssh/ssh_8.2p1-4kylin3_all.deb
```

④修复验证  
使用软件包查询命令，查看相关的软件包版本大于或等于修复版本则成功修复。  
`sudo dpkg -l |grep Package`  
注：Package为软件包包名。

### 2、KYSA-202112-1027（麒麟对应公告号）

①受影响的软件包  
银河麒麟高级服务器操作系统 V10 SP1：  
`openssh、openssh-askpass、openssh-cavs、openssh-clients、openssh-help、openssh-keycat、openssh-ldap、openssh-server、pam_ssh_agent_auth`  
银河麒麟高级服务器操作系统 V10 SP2：  
`openssh、openssh-askpass、openssh-cavs、openssh-clients、openssh-help、openssh-keycat、openssh-ldap、openssh-server、pam_ssh_agent_auth`  
②下载安装包进行升级安装  
通过软件包地址下载软件包，使用软件包升级命令根据受影响的软件包  
列表进行升级安装, 命令如下：  
`yum install Packagename`  
升级完成后是否需要重启服务或操作系统：  
CVE-2021-28041:需要重启 openssh 以使漏洞修复生效。  
③软件包下载地址  
银河麒麟高级服务器操作系统 V10 SP1：

```
https://update.cs2c.com.cn/NS/V10/V10SP1.1/os/adv/lic/updates/aarch64/Packages/openssh-8.2p1-9.p09.ky10.aarch64.rpm
https://update.cs2c.com.cn/NS/V10/V10SP1.1/os/adv/lic/updates/aarch64/Packages/openssh-askpass-8.2p1-9.p09.ky10.aarch64.rpm
https://update.cs2c.com.cn/NS/V10/V10SP1.1/os/adv/lic/updates/aarch64/Packages/openssh-cavs-8.2p1-9.p09.ky10.aarch64.rpm
https://update.cs2c.com.cn/NS/V10/V10SP1.1/os/adv/lic/updates/aarch64/Packages/openssh-clients-8.2p1-9.p09.ky10.aarch64.rpm
https://update.cs2c.com.cn/NS/V10/V10SP1.1/os/adv/lic/updates/aarch64/Packages/openssh-help-8.2p1-9.p09.ky10.noarch.rpm
https://update.cs2c.com.cn/NS/V10/V10SP1.1/os/adv/lic/updates/aarch64/Packages/openssh-keycat-8.2p1-9.p09.ky10.aarch64.rpm
https://update.cs2c.com.cn/NS/V10/V10SP1.1/os/adv/lic/updates/aarch64/Packages/openssh-ldap-8.2p1-9.p09.ky10.aarch64.rpm
https://update.cs2c.com.cn/NS/V10/V10SP1.1/os/adv/lic/updates/aarch64/Packages/openssh-server-8.2p1-9.p09.ky10.aarch64.rpm
https://update.cs2c.com.cn/NS/V10/V10SP1.1/os/adv/lic/updates/aarch64/Packages/pam_ssh_agent_auth-0.10.3-9.9.p09.ky10.aarch64.rpm
```

银河麒麟高级服务器操作系统 V10 SP2：

```
https://update.cs2c.com.cn/NS/V10/V10SP2/os/adv/lic/updates/aarch64/Packages/openssh-8.2p1-9.p09.ky10.aarch64.rpm
https://update.cs2c.com.cn/NS/V10/V10SP2/os/adv/lic/updates/aarch64/Packages/openssh-askpass-8.2p1-9.p09.ky10.aarch64.rpm
https://update.cs2c.com.cn/NS/V10/V10SP2/os/adv/lic/updates/aarch64/Packages/openssh-cavs-8.2p1-9.p09.ky10.aarch64.rpm
https://update.cs2c.com.cn/NS/V10/V10SP2/os/adv/lic/updates/aarch64/Packages/openssh-clients-8.2p1-9.p09.ky10.aarch64.rpm
https://update.cs2c.com.cn/NS/V10/V10SP2/os/adv/lic/updates/aarch64/Packages/openssh-help-8.2p1-9.p09.ky10.noarch.rpm
https://update.cs2c.com.cn/NS/V10/V10SP2/os/adv/lic/updates/aarch64/Packages/openssh-keycat-8.2p1-9.p09.ky10.aarch64.rpm
https://update.cs2c.com.cn/NS/V10/V10SP2/os/adv/lic/updates/aarch64/Packages/openssh-ldap-8.2p1-9.p09.ky10.aarch64.rpm
https://update.cs2c.com.cn/NS/V10/V10SP2/os/adv/lic/updates/aarch64/Packages/openssh-server-8.2p1-9.p09.ky10.aarch64.rpm
https://update.cs2c.com.cn/NS/V10/V10SP2/os/adv/lic/updates/aarch64/Packages/pam_ssh_agent_auth-0.10.3-9.9.p09.ky10.aarch64.rpm
```

④修复验证  
使用软件包查询命令，查看相关软件包版本是否与修复版本一致，如果版本一致，则说明修复成功。  
`sudo rpm -qa | grep Packagename`

### 3、KYSA-202304-1008（麒麟对应公告号）

①受影响的软件包  
`openssh、openssh-askpass、openssh-cavs、openssh-clients、openssh-keycat、openssh-ldap、openssh-server、pam_ssh_agent_auth`  
②下载安装包进行升级安装  
通过软件包地址下载软件包，使用软件包升级命令根据受影响的软件包  
列表进行升级安装, 命令如下：  
`yum install Packagename`  
升级完成后是否需要重启服务或操作系统：  
CVE-2020-14145:无需重启操作系统与服务即可使漏洞修复生效。  
CVE-2021-41617:需要重启 openssh 以使漏洞修复生效。  
③软件包下载地址

```
https://update.cs2c.com.cn/NS/V10/8U2/os/adv/lic/BaseOS-updates/aarch64/Packages/openssh-8.0p1-13.el8.aarch64.rpm
https://update.cs2c.com.cn/NS/V10/8U2/os/adv/lic/BaseOS-updates/aarch64/Packages/openssh-askpass-8.0p1-13.el8.aarch64.rpm
https://update.cs2c.com.cn/NS/V10/8U2/os/adv/lic/BaseOS-updates/aarch64/Packages/openssh-cavs-8.0p1-13.el8.aarch64.rpm
https://update.cs2c.com.cn/NS/V10/8U2/os/adv/lic/BaseOS-updates/aarch64/Packages/openssh-clients-8.0p1-13.el8.aarch64.rpm
https://update.cs2c.com.cn/NS/V10/8U2/os/adv/lic/BaseOS-updates/aarch64/Packages/openssh-keycat-8.0p1-13.el8.aarch64.rpm
https://update.cs2c.com.cn/NS/V10/8U2/os/adv/lic/BaseOS-updates/aarch64/Packages/openssh-ldap-8.0p1-13.el8.aarch64.rpm
https://update.cs2c.com.cn/NS/V10/8U2/os/adv/lic/BaseOS-updates/aarch64/Packages/openssh-server-8.0p1-13.el8.aarch64.rpm
https://update.cs2c.com.cn/NS/V10/8U2/os/adv/lic/BaseOS-updates/aarch64/Packages/pam_ssh_agent_auth-0.10.3-7.13.el8.aarch64.rpm
```

④修复验证  
使用软件包查询命令，查看相关软件包版本是否与修复版本一致，如果版本一致，则说明修复成功。

```
sudo rpm -qa | grep Packagename
```

### 4、KYSA-202205-1080（麒麟对应公告号）

只支持mips64el操作系统，这里不做操作说明，有需要的评论获取

### 5、KYSA-202112-1022（麒麟对应公告号）

①受影响的软件包  
`openssh、openssh-askpass、openssh-cavs、openssh-clients、openssh-keycat、openssh-ldap、openssh-server、openssh-server-sysvinit、pam_ssh_agent_auth`  
③下载安装包进行升级安装  
通过软件包地址下载软件包，使用软件包升级命令根据受影响的软件包  
列表进行升级安装, 命令如下：  
`yum install Packagename`  
③软件包下载地址

```
https://update.cs2c.com.cn/NS/V10/V10-ZJ/os/adv/lic/updates/aarch64/Packages/openssh-7.4p1-22.el7_9.ns7.01.aarch64.rpm
https://update.cs2c.com.cn/NS/V10/V10-ZJ/os/adv/lic/updates/aarch64/Packages/openssh-askpass-7.4p1-22.el7_9.ns7.01.aarch64.rpm
https://update.cs2c.com.cn/NS/V10/V10-ZJ/os/adv/lic/updates/aarch64/Packages/openssh-cavs-7.4p1-22.el7_9.ns7.01.aarch64.rpm
https://update.cs2c.com.cn/NS/V10/V10-ZJ/os/adv/lic/updates/aarch64/Packages/openssh-clients-7.4p1-22.el7_9.ns7.01.aarch64.rpm
https://update.cs2c.com.cn/NS/V10/V10-ZJ/os/adv/lic/updates/aarch64/Packages/openssh-keycat-7.4p1-22.el7_9.ns7.01.aarch64.rpm
https://update.cs2c.com.cn/NS/V10/V10-ZJ/os/adv/lic/updates/aarch64/Packages/openssh-ldap-7.4p1-22.el7_9.ns7.01.aarch64.rpm
https://update.cs2c.com.cn/NS/V10/V10-ZJ/os/adv/lic/updates/aarch64/Packages/openssh-server-7.4p1-22.el7_9.ns7.01.aarch64.rpm
https://update.cs2c.com.cn/NS/V10/V10-ZJ/os/adv/lic/updates/aarch64/Packages/openssh-server-sysvinit-7.4p1-22.el7_9.ns7.01.aarch64.rpm
https://update.cs2c.com.cn/NS/V10/V10-ZJ/os/adv/lic/updates/aarch64/Packages/pam_ssh_agent_auth-0.10.3-2.22.el7_9.ns7.01.aarch64.rpm
```

### 5、KYSA-202110-1061（麒麟对应公告号）

①受影响的软件包  
银河麒麟高级服务器操作系统 V10 SP1：  
`openssh、openssh-askpass、openssh-cavs、openssh-clients、openssh-help、openssh-keycat、openssh-ldap、openssh-server、pam_ssh_agent_auth`  
银河麒麟高级服务器操作系统 V10 SP2：  
`openssh、openssh-askpass、openssh-cavs、openssh-clients、openssh-help、openssh-keycat、openssh-ldap、openssh-server、pam_ssh_agent_auth`  
②下载安装包进行升级安装  
通过软件包地址下载软件包，使用软件包升级命令根据受影响的软件包  
列表进行升级安装, 命令如下：  
`yum install Packagename`  
升级完成后是否需要重启服务或操作系统：  
CVE-2021-41617:需要重启 openssh 以使漏洞修复生效。  
③软件包下载地址  
银河麒麟高级服务器操作系统 V10 SP1：

```
https://update.cs2c.com.cn/NS/V10/V10SP1.1/os/adv/lic/updates/aarch64/Packages/openssh-8.2p1-9.p08.ky10.aarch64.rpm
https://update.cs2c.com.cn/NS/V10/V10SP1.1/os/adv/lic/updates/aarch64/Packages/openssh-askpass-8.2p1-9.p08.ky10.aarch64.rpm
https://update.cs2c.com.cn/NS/V10/V10SP1.1/os/adv/lic/updates/aarch64/Packages/openssh-cavs-8.2p1-9.p08.ky10.aarch64.rpm
https://update.cs2c.com.cn/NS/V10/V10SP1.1/os/adv/lic/updates/aarch64/Packages/openssh-clients-8.2p1-9.p08.ky10.aarch64.rpm
https://update.cs2c.com.cn/NS/V10/V10SP1.1/os/adv/lic/updates/aarch64/Packages/openssh-help-8.2p1-9.p08.ky10.noarch.rpm
https://update.cs2c.com.cn/NS/V10/V10SP1.1/os/adv/lic/updates/aarch64/Packages/openssh-keycat-8.2p1-9.p08.ky10.aarch64.rpm
https://update.cs2c.com.cn/NS/V10/V10SP1.1/os/adv/lic/updates/aarch64/Packages/openssh-ldap-8.2p1-9.p08.ky10.aarch64.rpm
https://update.cs2c.com.cn/NS/V10/V10SP1.1/os/adv/lic/updates/aarch64/Packages/openssh-server-8.2p1-9.p08.ky10.aarch64.rpm
https://update.cs2c.com.cn/NS/V10/V10SP1.1/os/adv/lic/updates/aarch64/Packages/pam_ssh_agent_auth-0.10.3-9.9.p08.ky10.aarch64.rpm
```

银河麒麟高级服务器操作系统 V10 SP2：

```
https://update.cs2c.com.cn/NS/V10/V10SP2/os/adv/lic/updates/aarch64/Packages/openssh-8.2p1-9.p08.ky10.aarch64.rpm
https://update.cs2c.com.cn/NS/V10/V10SP2/os/adv/lic/updates/aarch64/Packages/openssh-askpass-8.2p1-9.p08.ky10.aarch64.rpm
https://update.cs2c.com.cn/NS/V10/V10SP2/os/adv/lic/updates/aarch64/Packages/openssh-cavs-8.2p1-9.p08.ky10.aarch64.rpm
https://update.cs2c.com.cn/NS/V10/V10SP2/os/adv/lic/updates/aarch64/Packages/openssh-clients-8.2p1-9.p08.ky10.aarch64.rpm
https://update.cs2c.com.cn/NS/V10/V10SP2/os/adv/lic/updates/aarch64/Packages/openssh-help-8.2p1-9.p08.ky10.noarch.rpm
https://update.cs2c.com.cn/NS/V10/V10SP2/os/adv/lic/updates/aarch64/Packages/openssh-keycat-8.2p1-9.p08.ky10.aarch64.rpm
https://update.cs2c.com.cn/NS/V10/V10SP2/os/adv/lic/updates/aarch64/Packages/openssh-ldap-8.2p1-9.p08.ky10.aarch64.rpm
https://update.cs2c.com.cn/NS/V10/V10SP2/os/adv/lic/updates/aarch64/Packages/openssh-server-8.2p1-9.p08.ky10.aarch64.rpm
https://update.cs2c.com.cn/NS/V10/V10SP2/os/adv/lic/updates/aarch64/Packages/pam_ssh_agent_auth-0.10.3-9.9.p08.ky10.aarch64.rpm
```

④修复验证  
使用软件包查询命令，查看相关软件包版本是否与修复版本一致，如果版本一致，则说明修复成功。  
`sudo rpm -qa | grep Packagename`

### 6、KYSA-202012-1004（麒麟对应公告号）

①受影响的软件包  
`openssh、openssh-askpass、openssh-cavs、openssh-clients、openssh-help、openssh-keycat、openssh-ldap、openssh-server、pam_ssh_agent_auth`  
②下载安装包进行升级安装  
通过软件包地址下载软件包，使用软件包升级命令根据受影响的软件包  
列表进行升级安装, 命令如下：  
`yum install Packagename`  
升级完成后是否需要重启服务或操作系统：  
CVE-2020-12062:需要重启 openssh 以使漏洞修复生效。  
③软件包下载地址

```
https://update.cs2c.com.cn/NS/V10/V10SP1/os/adv/lic/updates/aarch64/Packages/openssh-8.2p1-9.p02.ky10.aarch64.rpm
https://update.cs2c.com.cn/NS/V10/V10SP1/os/adv/lic/updates/aarch64/Packages/openssh-askpass-8.2p1-9.p02.ky10.aarch64.rpm
https://update.cs2c.com.cn/NS/V10/V10SP1/os/adv/lic/updates/aarch64/Packages/openssh-cavs-8.2p1-9.p02.ky10.aarch64.rpm
https://update.cs2c.com.cn/NS/V10/V10SP1/os/adv/lic/updates/aarch64/Packages/openssh-clients-8.2p1-9.p02.ky10.aarch64.rpm
https://update.cs2c.com.cn/NS/V10/V10SP1/os/adv/lic/updates/aarch64/Packages/openssh-help-8.2p1-9.p02.ky10.noarch.rpm
https://update.cs2c.com.cn/NS/V10/V10SP1/os/adv/lic/updates/aarch64/Packages/openssh-keycat-8.2p1-9.p02.ky10.aarch64.rpm
https://update.cs2c.com.cn/NS/V10/V10SP1/os/adv/lic/updates/aarch64/Packages/openssh-ldap-8.2p1-9.p02.ky10.aarch64.rpm
https://update.cs2c.com.cn/NS/V10/V10SP1/os/adv/lic/updates/aarch64/Packages/openssh-server-8.2p1-9.p02.ky10.aarch64.rpm
https://update.cs2c.com.cn/NS/V10/V10SP1/os/adv/lic/updates/aarch64/Packages/pam_ssh_agent_auth-0.10.3-9.9.p02.ky10.aarch64.rpm
```

④修复验证  
使用软件包查询命令，查看相关软件包版本是否与修复版本一致，如果版本一致，则说明修复成功。  
`sudo rpm -qa | grep Packagename`

### 7、KYSA-202106-1012（麒麟对应公告号）

①受影响的软件包  
`openssh、openssh-askpass、openssh-cavs、openssh-clients、openssh-keycat、openssh-ldap、openssh-server、openssh-server-sysvinit、pam_ssh_agent_auth`  
②下载安装包进行升级安装  
通过软件包地址下载软件包，使用软件包升级命令根据受影响的软件包  
列表进行升级安装, 命令如下：  
`yum install Packagename`  
升级完成后是否需要重启服务或操作系统：  
CVE-2016-10011:需要重启 openssh 以使漏洞修复生效。  
CVE-2016-6210:需要重启 openssh 以使漏洞修复生效。  
CVE-2020-14145:无需重启操作系统与服务即可使漏洞修复生效。  
③软件包下载地址

```
https://update.cs2c.com.cn/NS/V10/V10-ZJ/os/adv/lic/updates/aarch64/Packages/openssh-7.4p1-21.el7.ns7.07.aarch64.rpm
https://update.cs2c.com.cn/NS/V10/V10-ZJ/os/adv/lic/updates/aarch64/Packages/openssh-askpass-7.4p1-21.el7.ns7.07.aarch64.rpm
https://update.cs2c.com.cn/NS/V10/V10-ZJ/os/adv/lic/updates/aarch64/Packages/openssh-cavs-7.4p1-21.el7.ns7.07.aarch64.rpm
https://update.cs2c.com.cn/NS/V10/V10-ZJ/os/adv/lic/updates/aarch64/Packages/openssh-clients-7.4p1-21.el7.ns7.07.aarch64.rpm
https://update.cs2c.com.cn/NS/V10/V10-ZJ/os/adv/lic/updates/aarch64/Packages/openssh-keycat-7.4p1-21.el7.ns7.07.aarch64.rpm
https://update.cs2c.com.cn/NS/V10/V10-ZJ/os/adv/lic/updates/aarch64/Packages/openssh-ldap-7.4p1-21.el7.ns7.07.aarch64.rpm
https://update.cs2c.com.cn/NS/V10/V10-ZJ/os/adv/lic/updates/aarch64/Packages/openssh-server-7.4p1-21.el7.ns7.07.aarch64.rpm
https://update.cs2c.com.cn/NS/V10/V10-ZJ/os/adv/lic/updates/aarch64/Packages/openssh-server-sysvinit-7.4p1-21.el7.ns7.07.aarch64.rpm
https://update.cs2c.com.cn/NS/V10/V10-ZJ/os/adv/lic/updates/aarch64/Packages/pam_ssh_agent_auth-0.10.3-2.21.el7.ns7.07.aarch64.rpm
```

④修复验证  
使用软件包查询命令，查看相关软件包版本是否与修复版本一致，如果版本一致，则说明修复成功。  
`sudo rpm -qa | grep Packagename`

### 8、KYSA-202106-1006（麒麟对应公告号）

①受影响的软件包  
银河麒麟高级服务器操作系统 V10 SP1：  
`openssh、openssh-askpass、openssh-cavs、openssh-clients、openssh-help、openssh-keycat、openssh-ldap、openssh-server、pam_ssh_agent_auth`  
银河麒麟高级服务器操作系统 V10 SP2：  
`openssh、openssh-askpass、openssh-cavs、openssh-clients、openssh-help、openssh-keycat、openssh-ldap、openssh-server、pam_ssh_agent_auth`  
②下载安装包进行升级安装  
通过软件包地址下载软件包，使用软件包升级命令根据受影响的软件包  
列表进行升级安装, 命令如下：  
`yum install Packagename`  
升级完成后是否需要重启服务或操作系统：  
CVE-2018-15919:需要重启 openssh 以使漏洞修复生效。  
CVE-2020-14145:无需重启操作系统与服务即可使漏洞修复生效。  
③软件包下载地址  
银河麒麟高级服务器操作系统 V10 SP1：

```
https://update.cs2c.com.cn/NS/V10/V10SP1.1/os/adv/lic/base/aarch64/Packages/openssh-8.2p1-9.p03.ky10.aarch64.rpm
https://update.cs2c.com.cn/NS/V10/V10SP1/os/adv/lic/updates/aarch64/Packages/openssh-8.2p1-9.p03.ky10.aarch64.rpm
https://update.cs2c.com.cn/NS/V10/V10SP1.1/os/adv/lic/base/aarch64/Packages/openssh-askpass-8.2p1-9.p03.ky10.aarch64.rpm
https://update.cs2c.com.cn/NS/V10/V10SP1/os/adv/lic/updates/aarch64/Packages/openssh-askpass-8.2p1-9.p03.ky10.aarch64.rpm
https://update.cs2c.com.cn/NS/V10/V10SP1.1/os/adv/lic/base/aarch64/Packages/openssh-cavs-8.2p1-9.p03.ky10.aarch64.rpm
https://update.cs2c.com.cn/NS/V10/V10SP1/os/adv/lic/updates/aarch64/Packages/openssh-cavs-8.2p1-9.p03.ky10.aarch64.rpm
https://update.cs2c.com.cn/NS/V10/V10SP1.1/os/adv/lic/base/aarch64/Packages/openssh-clients-8.2p1-9.p03.ky10.aarch64.rpm
https://update.cs2c.com.cn/NS/V10/V10SP1/os/adv/lic/updates/aarch64/Packages/openssh-clients-8.2p1-9.p03.ky10.aarch64.rpm
https://update.cs2c.com.cn/NS/V10/V10SP1.1/os/adv/lic/base/aarch64/Packages/openssh-help-8.2p1-9.p03.ky10.noarch.rpm
https://update.cs2c.com.cn/NS/V10/V10SP1/os/adv/lic/updates/aarch64/Packages/openssh-help-8.2p1-9.p03.ky10.noarch.rpm
https://update.cs2c.com.cn/NS/V10/V10SP1.1/os/adv/lic/base/aarch64/Packages/openssh-keycat-8.2p1-9.p03.ky10.aarch64.rpm
https://update.cs2c.com.cn/NS/V10/V10SP1/os/adv/lic/updates/aarch64/Packages/openssh-keycat-8.2p1-9.p03.ky10.aarch64.rpm
https://update.cs2c.com.cn/NS/V10/V10SP1.1/os/adv/lic/base/aarch64/Packages/openssh-ldap-8.2p1-9.p03.ky10.aarch64.rpm
https://update.cs2c.com.cn/NS/V10/V10SP1/os/adv/lic/updates/aarch64/Packages/openssh-ldap-8.2p1-9.p03.ky10.aarch64.rpm
https://update.cs2c.com.cn/NS/V10/V10SP1.1/os/adv/lic/base/aarch64/Packages/openssh-server-8.2p1-9.p03.ky10.aarch64.rpm
https://update.cs2c.com.cn/NS/V10/V10SP1/os/adv/lic/updates/aarch64/Packages/openssh-server-8.2p1-9.p03.ky10.aarch64.rpm
https://update.cs2c.com.cn/NS/V10/V10SP1.1/os/adv/lic/base/aarch64/Packages/pam_ssh_agent_auth-0.10.3-9.9.p03.ky10.aarch64.rpm
https://update.cs2c.com.cn/NS/V10/V10SP1/os/adv/lic/updates/aarch64/Packages/pam_ssh_agent_auth-0.10.3-9.9.p03.ky10.aarch64.rpm
```

银河麒麟高级服务器操作系统 V10 SP2：

```
https://update.cs2c.com.cn/NS/V10/V10SP2/os/adv/lic/base/aarch64/Packages/openssh-8.2p1-9.p03.ky10.aarch64.rpm
https://update.cs2c.com.cn/NS/V10/V10SP2/os/adv/lic/base/aarch64/Packages/openssh-askpass-8.2p1-9.p03.ky10.aarch64.rpm
https://update.cs2c.com.cn/NS/V10/V10SP2/os/adv/lic/base/aarch64/Packages/openssh-cavs-8.2p1-9.p03.ky10.aarch64.rpm
https://update.cs2c.com.cn/NS/V10/V10SP2/os/adv/lic/base/aarch64/Packages/openssh-clients-8.2p1-9.p03.ky10.aarch64.rpm
https://update.cs2c.com.cn/NS/V10/V10SP2/os/adv/lic/base/aarch64/Packages/openssh-help-8.2p1-9.p03.ky10.noarch.rpm
https://update.cs2c.com.cn/NS/V10/V10SP2/os/adv/lic/base/aarch64/Packages/openssh-keycat-8.2p1-9.p03.ky10.aarch64.rpm
https://update.cs2c.com.cn/NS/V10/V10SP2/os/adv/lic/base/aarch64/Packages/openssh-ldap-8.2p1-9.p03.ky10.aarch64.rpm
https://update.cs2c.com.cn/NS/V10/V10SP2/os/adv/lic/base/aarch64/Packages/openssh-server-8.2p1-9.p03.ky10.aarch64.rpm
https://update.cs2c.com.cn/NS/V10/V10SP2/os/adv/lic/base/aarch64/Packages/pam_ssh_agent_auth-0.10.3-9.9.p03.ky10.aarch64.rpm
```

④修复验证  
使用软件包查询命令，查看相关软件包版本是否与修复版本一致，如果版本一致，则说明修复成功。  
`sudo rpm -qa | grep Packagename`
