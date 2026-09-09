---
title: Linux 运维常用手册
---

**前言：在当今数字化时代，Linux系统作为服务器和云计算环境中的核心操作系统，其重要性不言而喻。无论是初入职场的运维新手，还是经验丰富的系统管理员，掌握高效、实用的Linux运维命令和技巧都是提升工作效率的关键。**  
**本博客旨在为Linux运维人员提供一份全面、实用且易于上手的手册。从基础命令到高级技巧，从常用操作到小众命令，我们精心整理了大量一线运维场景中高频使用的命令和实用技巧。无论你是正在为解决日常运维问题而苦恼，还是希望进一步提升自己的技术能力，这里都能找到你需要的内容。**  
**在接下来的篇章中，我们将深入探讨Linux文件操作、系统管理、网络配置、自动化运维等多个重要领域。同时，我们还会分享一些小众但极具价值的命令，帮助你在复杂的运维场景中快速定位问题、高效解决问题。此外，我们还整理了一份高频命令速查表，方便你在工作中随时查阅。**  
**希望本博客能成为你在Linux运维道路上的得力助手，助你轻松应对各种挑战，迈向高效运维的新境界。如果你有任何疑问或建议，欢迎随时留言交流，让我们共同进步！**

---

### 一、基础命令篇

#### 1. 文件与目录操作

- `ls -l`：查看目录详细属性（权限/大小/时间）
- `cp -r src_dir dst_dir`：递归复制目录及内容
- `find / -name "*.log"`：全局搜索日志文件
- `chmod 755 file`：设置文件权限（rwx权限计算）

#### 2. 文本处理工具

- `grep "error" /var/log/messages`：过滤关键错误信息
- `sed -i 's/old/new/g' file`：批量替换文件内容
- `tail -f app.log`：实时追踪日志尾部变化

#### 3. 压缩与解压

- `tar -czvf backup.tar.gz dir/`：打包并压缩目录
- `unzip -O GBK file.zip`：解压中文编码ZIP文件

---

### 二、系统管理篇

#### 1. 用户与权限

- `useradd -m username`：创建用户并生成家目录
- `usermod -aG sudo username`：添加用户到sudo组
- `passwd -l user`：锁定用户账户

#### 2. 进程与资源监控

- `top` 或 `htop`：实时查看CPU/内存占用
- `free -h`：显示内存使用情况（含Swap）
- `ps aux | grep nginx`：筛选Nginx相关进程

#### 3. 磁盘管理

- `df -Th`：查看磁盘分区及文件系统类型
- `fdisk -l`：列出所有磁盘分区表
- `mount /dev/sdb1 /mnt/data`：挂载新磁盘到目录

---

### 三、网络与服务篇

#### 1. 网络配置与诊断

- `ifconfig` 或 `ip addr`：查看IP地址
- `netstat -tulnp`：显示端口占用进程
- `traceroute baidu.com`：追踪网络路由路径

#### 2. 服务管理

- `systemctl start nginx`：启动Nginx服务
- `journalctl -u mysql -f`：查看MySQL实时日志
- `firewall-cmd --add-port=8080/tcp --permanent`：放行防火墙端口

---

### 四、自动化运维篇

#### 1. Shell脚本编写

```
#!/bin/bash
# 监控磁盘使用率
threshold=80
usage=$(df / | awk 'NR==2 {print $5}' | tr -d '%')
if [ $usage -gt $threshold ]; then
    echo "警告：根分区使用率超过${threshold}%"
fi
```

#### 2. 定时任务

- `crontab -e`：编辑定时任务（示例：`0 3 * * * /backup.sh` 每天3点备份）

---

### 五、故障排查技巧

#### 1. 日志分析

- `/var/log/messages`：系统主日志文件
- `dmesg | grep error`：查看内核错误信息

#### 2. 性能瓶颈定位

- `vmstat 1 5`：每1秒输出一次系统资源状态，共5次
- `iostat -x 1`：监控磁盘I/O负载

#### 3. 紧急恢复

- `fsck /dev/sda1`：修复损坏的文件系统
- `dd if=/dev/sda of=disk.img bs=4M`：全盘备份

---

### 六、Linux命令大全

#### 常用命令补充

| 命令 | 功能说明 | 示例 |
| --- | --- | --- |
| `alias` | 创建命令别名 | alias ll='ls -alF' |
| `cal` | 显示日历 | cal 2023 |
| `date` | 显示或设置系统日期和时间 | date +%F |
| `echo` | 输出字符串或变量值 | echo "Hello, World!" |
| `exit` | 退出当前Shell会话 | exit |
| `man` | 查看命令的手册页 | man ls |
| `pwd` | 显示当前工作目录 | pwd |
| `uname` | 显示系统信息 | uname -a |
| `which` | 查找命令的绝对路径 | which python |
| `who` | 显示当前登录的用户信息 | who |

| 命令 | 功能说明 | 示例 |
| --- | --- | --- |
| `cat` | 查看文件内容 | cat file.txt |
| `head` | 查看文件头部内容 | head -n 5 file.txt |
| `tail` | 查看文件尾部内容 | tail -n 5 file.txt |
| `less` | 分页查看文件内容 | less file.txt |
| `more` | 分页查看文件内容 | more file.txt |
| `touch` | 创建空文件或修改文件时间戳 | touch newfile.txt |
| `vi`/`vim` | 编辑文件 | vi file.txt |
| `nano` | 简易文本编辑器 | nano file.txt |
| `chmod` | 修改文件权限 | chmod 755 file.txt |
| `chown` | 修改文件所有者 | chown user:group file.txt |

| 命令 | 功能说明 | 示例 |
| --- | --- | --- |
| `tar` | 打包文件 | tar -cvf backup.tar dir/ |
| `gzip` | 压缩文件 | gzip file.txt |
| `bzip2` | 压缩文件 | bzip2 file.txt |
| `zip` | 压缩文件为ZIP格式 | zip file.zip file.txt |
| `unzip` | 解压ZIP文件 | unzip file.zip |
| `rar` | 压缩文件为RAR格式 | rar a file.rar file.txt |
| `unrar` | 解压RAR文件 | unrar x file.rar |

| 命令 | 功能说明 | 示例 |
| --- | --- | --- |
| `scp` | 安全复制文件到远程主机 | scp file.txt user@host:/tmp |
| `rsync` | 同步文件和目录 | rsync -avz src/ user@host:dst/ |
| `ssh` | 远程登录到另一台计算机 | ssh user@host |
| `sftp` | 安全文件传输 | sftp user@host |
| `wget` | 从网络下载文件 | wget <http://example.com/file.zip> |
| `curl` | 传输数据到或从服务器 | curl -O <http://example.com/file.zip> |

| 命令 | 功能说明 | 示例 |
| --- | --- | --- |
| `ifconfig` | 配置和查看网络接口 | ifconfig |
| `ip` | 替代ifconfig的网络工具 | ip addr show |
| `ping` | 测试网络连通性 | ping www.example.com |
| `netstat` | 网络统计信息 | netstat -tuln |
| `nslookup` | 查询DNS记录 | nslookup www.example.com |
| `dig` | 域名查询工具 | dig www.example.com |
| `route` | 查看和修改路由表 | route -n |

| 命令 | 功能说明 | 示例 |
| --- | --- | --- |
| `systemctl` | 系统服务管理 | systemctl start service |
| `service` | 传统服务管理命令 | service nginx restart |
| `chkconfig` | 设置系统服务的运行级别 | chkconfig --list |
| `journalctl` | 查看系统日志 | journalctl -u service |

| 命令 | 功能说明 | 示例 |
| --- | --- | --- |
| `apt-get` | Debian/Ubuntu软件包管理 | apt-get install package |
| `yum` | Red Hat/CentOS软件包管理 | yum install package |
| `dnf` | 新一代的软件包管理器 | dnf install package |
| `rpm` | 红帽软件包管理器 | rpm -ivh package.rpm |
| `dpkg` | Debian软件包管理 | dpkg -i package.deb |

---

### 七、小众命令

#### 查看压缩包内容

- **查看gzip压缩文件内容**：

  - `zcat file.gz`：解压并查看gzip文件内容。
  - `zgrep "keyword" file.gz`：在gzip文件中搜索关键词。
- **查看zip压缩文件内容**：

  - `unzip -p file.zip`：解压并查看zip文件内容。
  - `zipgrep "keyword" file.zip`：在zip文件中搜索关键词。
- **查看tar.gz压缩包内容**：

  - `tar -tvf file.tar.gz`：列出tar.gz压缩包中的文件列表。
  - `zcat file.tar.gz | grep "keyword"`：在tar.gz压缩包中搜索关键词。

---

### 附：高频命令速查表（精简10项）

| 命令 | 功能说明 | 示例 |
| --- | --- | --- |
| `rsync -avz` | 增量同步文件 | rsync -avz src/ user@host:dst/ |
| `lsof -i :80` | 查看80端口占用进程 |  |
| `scp` | 跨主机安全拷贝 | scp file.txt user@host:/tmp |
| `awk` | 文本分析（如统计列求和） | awk '{sum+=$1} END{print sum}' |
| `history` | 查看命令历史记录 | history | grep "rm" |

---

以上手册涵盖了Linux运维中常见的操作和工具，希望对你的日常工作有所帮助。  
