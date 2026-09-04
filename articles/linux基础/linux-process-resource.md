# Linux 进程管理与资源限制

## 进程模型

进程拥有地址空间、文件描述符、信号处理器和 cgroup 归属；线程共享地址空间但仍会消耗调度和栈资源。排障先确认 PID、父子关系、启动参数、工作目录和实际用户，不要直接 kill 最高 CPU 进程。

```bash
ps -eo pid,ppid,user,stat,ni,%cpu,%mem,etime,args --sort=-%cpu | head; pstree -aps <pid>; ls -l /proc/<pid>/fd; cat /proc/<pid>/limits
```

先发送 `SIGTERM`，观察应用是否排空连接和写完数据，再按 runbook 决定 `SIGKILL`。systemd、容器和编排平台的停止超时要与应用关闭时间一致。

CPU quota、memory.high、memory.max、pids.max 和 IO 权重共同决定服务边界。容器 OOM 可能由 cgroup 上限触发，而非主机内存耗尽；要同时查看 `memory.events`、内核日志和服务指标。

```bash
systemctl show app -p MainPID,TasksCurrent,MemoryCurrent,MemoryMax,CPUQuotaPerSecUSec; ulimit -n; cat /proc/sys/fs/file-nr
```

CPU 高先区分用户态、内核态、iowait、steal 和锁竞争；内存高先查 RSS、cache、swap、泄漏和 fork 峰值；句柄耗尽查进程 fd 与全局 file-max。调整限制前记录基线和回滚值。

