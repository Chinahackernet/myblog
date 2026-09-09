---
title: 自动化运维-Linux通用性日志切割脚本
---

**一、公司提供的参考脚本：**

```
#!/bin/bash
# 定义需要清理的文件
log_file=(
    "/mpjava/ly.mp.dfpv.acc.biz/bin/nohup.out"
    "/mpjava/ly.mp.dfpv.acc.service/bin/nohup.out"
    # 添加更多微服务的日志目录路径
)
# 获取当天日期
date_now=$(date +%Y%m%d)

for file_dir in $log_file
do
   # 获取文件路径
   dir=$(dirname $file_dir)
   # 获取文件名
   file_name_new=$(basename $file_dir)
   # 创建备份目录
   mkdir -p ${dir}/backup
   # 备份日志
   cp ${file_dir} ${dir}/backup/${date_now}_${file_name_new}
   # 清空日志
   echo "" > ${file_dir}
   # 删除历史
   cd ${dir}/backup/ &&  find . -type f -mtime +6 -exec rm -f {} \;
done
```

**验证结果：并未验证成功**

**二、自己改进后脚本：**

```
#!/bin/bash

# 定义需要清理的文件
log_file=(
    "/mpjava/ly.mp.dfpv.acc.biz/bin/nohup.out"
    "/mpjava/ly.mp.dfpv.acc.service/bin/nohup.out"
    # 添加更多微服务或各服务组件的日志目录路径
)

# 获取当前日期和时间，用于备份文件名中包含时间戳
date_now=$(date +%Y%m%d_%H%M)

for file_dir in "${log_file[@]}"
do
    if [[ ! -f "$file_dir" ]]; then
        echo "Warning: File $file_dir does not exist, skipping."
        continue
    fi

    # 获取文件路径和文件名
    dir=$(dirname "$file_dir")
    file_name_new=$(basename "$file_dir")

    # 创建备份目录
    mkdir -p "${dir}/backup"

    # 备份日志，添加时间戳避免覆盖
    backup_file="${dir}/backup/${date_now}_${file_name_new}"
    cp "$file_dir" "$backup_file" && echo "Backup created: $backup_file" || echo "Error: Failed to backup $file_dir"

    # 清空日志
    > "$file_dir" && echo "Log cleared: $file_dir" || echo "Error: Failed to clear log $file_dir"

    # 删除超过7天的日志
    find "${dir}/backup" -type f -mtime +6 -exec rm -f {} \; &>/dev/null
    if [[ $? -eq 0 ]]; then
        echo "Old logs removed from ${dir}/backup"
    else
        echo "Error occurred while removing old logs from ${dir}/backup"
    fi
done
```

**脚本执行过程：**  
执行脚本前：  

执行脚本后：  

**结论：这个脚本是通用性脚本，nginx、各中间件、应用服务等日志清理都可以使用，只需要修改log_file变量为自己环境具体路径 和 日志文件即可**

**三、配置定时任务**  
1、打开当前用户的crontab文件：  
`crontab -e`

2、添加定时任务（每天凌晨1点执行）：  
`0 1 * * * /path/to/your/Log_cutting.sh`  
这里 /path/to/your/script.sh 应该替换为你的脚本实际所在的路径。

3、保存并关闭crontab文件：保存更改并退出编辑器。在 vi 或 vim 中，你可以按 ESC 然后输入 :wq 并按 Enter 保存并退出。在 nano 中，你可以按 Ctrl+X，然后按 Y 确认保存，最后按 Enter 退出。

4、确保脚本具有执行权限：  
`chmod +x /path/to/your/Log_cutting.sh`

5、检查cron服务状态：  
`systemctl status cron`  
如果服务没有运行，你可以使用以下命令启动它：systemctl start cron

6、查看cron日志：  
如果需要调试定时任务，你可以查看 /var/log/cron 日志文件来获取 cron 的日志信息。

7、注意环境问题：  
cron 定时任务运行在非登录shell环境中，这意味着它可能没有访问某些环境变量。如果依赖于特定的环境变量，需要在脚本本身或在 crontab 文件中设置这些变量。

例如，如果需要知道 PATH 环境变量，可以在 crontab 文件中设置它，如下所示：

```
SHELL=/bin/bash
PATH=/usr/bin:/usr/sbin:/bin:/sbin:/usr/local/bin
0 1 * * * /path/to/your/Log_cutting.sh
```

通过以上步骤，您可以设置一个定时任务来定期执行您的日志清理脚本。
