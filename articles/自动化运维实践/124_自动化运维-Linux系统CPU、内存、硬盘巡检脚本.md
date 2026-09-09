---
title: 自动化运维-Linux系统CPU、内存、硬盘巡检脚本
---

**同事：写一个一键巡检服务器CPU、内存、硬盘的巡检脚本。**

**我(安排)：**

```
#!/bin/bash

echo "系统巡检报告"
echo "===================="

# 获取 CPU 使用率
cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print 100 - $8}' | head -n 1)
echo "CPU 使用率: ${cpu_usage}%"

# 获取内存信息
mem_info=$(free -h | grep Mem:)
echo "内存信息:"
echo "$mem_info"

# 提取内存信息并转换为GB
total_mem=$(echo "$mem_info" | awk '{print $2}' | sed 's/G//g')
used_mem=$(echo "$mem_info" | awk '{print $3}' | sed 's/G//g')
free_mem=$(echo "$mem_info" | awk '{print $4}' | sed 's/G//g')
echo "总计: ${total_mem}GB"
echo "已使用: ${used_mem}GB"
echo "空闲: ${free_mem}GB"

# 获取交换分区信息
swap_info=$(free -h | grep Swap:)
echo "交换分区使用情况:"
echo "$swap_info"

# 提取交换分区信息
swap_total=$(echo "$swap_info" | awk '{print $2}' | sed 's/G//g')
swap_used=$(echo "$swap_info" | awk '{print $3}' | sed 's/G//g')
swap_free=$(echo "$swap_info" | awk '{print $4}' | sed 's/G//g')
echo "总计: ${swap_total}GB"
echo "已使用: ${swap_used}GB"
echo "空闲: ${swap_free}GB"

# 获取硬盘空间信息
echo "硬盘空间信息:"
df -h | awk '$NF=="/" {print "根分区(/): " $5, $1}'

echo "===================="
echo "巡检完成。"
```

**服务器原值**：  

**脚本执行结果：**  
