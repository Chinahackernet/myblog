# Linux 性能分析方法

## 先定义问题

性能分析先明确吞吐、延迟、错误率、CPU、内存、I/O、网络或启动时间。记录基线、采样窗口和业务版本，避免在系统已变更后拿旧数据比较。

## 四大资源

```bash
vmstat 1 10; mpstat -P ALL 1 5; pidstat -u -d -r 1 5; iostat -xz 1 5; sar -n DEV 1 5; ss -s
```

CPU 看 user/system/iowait/steal、run queue 和上下文切换；内存看 reclaim、swap、major fault 和 PSI；磁盘看 await、队列、util 和文件系统；网络看丢包、重传、softirq、PPS 和 conntrack。

生产采样使用 perf、eBPF 或应用 profiling 时要限时、限权限和脱敏。火焰图只显示 CPU 栈，不代表锁等待、I/O 或 GC，必须与延迟和资源指标交叉验证。

一次只改一个变量，先在非生产或小流量节点验证；记录参数、预期机制、观测窗口和回滚。若 P99 改善但错误率或资源成本恶化，不应视为成功。

## 分析决策表

| 信号 | 优先假设 | 下一步 |
| --- | --- | --- |
| load 高、CPU idle 高 | I/O 或不可中断等待 | 查 iostat、D 状态进程、存储和 NFS |
| CPU steal 高 | 虚拟化超分或邻居争抢 | 查宿主机/云平台指标，迁移或降载 |
| 内存 PSI 高、swap 增长 | 回收压力或泄漏 | 查 cgroup、RSS、分配速率和 OOM |
| 网络重传升高 | 丢包、MTU 或队列 | 查接口错误、tcpdump、路径和 conntrack |

采样工具需注明版本、权限和开销；结果附带时间窗口、过滤条件和原始输出路径。性能报告必须给出“观测—假设—实验—结论—回滚”链条。
