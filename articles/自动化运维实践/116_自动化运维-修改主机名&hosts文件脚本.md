---
title: "自动化运维-修改主机名&hosts文件脚本"
---

**脚本：**

```
#!/bin/bash

# 提示用户输入新的主机名
read -p "请输入新的主机名: " NEW_HOSTNAME

# 检查是否提供了新主机名
if [ -z "$NEW_HOSTNAME" ]; then
    echo "错误: 没有输入新的主机名。"
    exit 1
fi

# 备份原有的 hostname 文件
sudo cp /etc/hostname /etc/hostname.bak

# 备份原有的 hosts 文件
sudo cp /etc/hosts /etc/hosts.bak

# 设置新的主机名
sudo hostname $NEW_HOSTNAME

# 编辑 /etc/hostname 文件
echo $NEW_HOSTNAME | sudo tee /etc/hostname > /dev/null

# 编辑 /etc/hosts 文件
sudo sed -i "s/^\(127.0.1.1\|127.0.0.1\).*/\1\t$NEW_HOSTNAME.localdomain\t$NEW_HOSTNAME/" /etc/hosts

# 显示当前主机名以确认更改
echo "主机名已更改为: $NEW_HOSTNAME"

# 提示用户重启系统以使更改生效
echo "请重启系统以使更改生效。"
```
