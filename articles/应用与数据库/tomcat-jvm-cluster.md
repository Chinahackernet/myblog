# Tomcat JDK/JVM、线程池、会话复制与滚动发布

## 1. 运行时基线

固定 JDK 主版本和补丁，记录 GC、容器内存限制、文件描述符、时区和字符集。Tomcat 的 `maxThreads` 不能超过下游数据库/HTTP 连接池承载能力；线程越多不一定吞吐越高。

```xml
<Connector protocol="org.apache.coyote.http11.Http11NioProtocol" port="8080" maxThreads="400" minSpareThreads="40" acceptCount="200" connectionTimeout="5000" />
```

按“请求速率 × 平均响应时间”估算并发，再用压测校准。JVM 堆、Metaspace、直接内存和线程栈必须纳入容器 limit，避免宿主机 OOM。

## 2. JVM 诊断

```bash
jcmd $PID VM.flags; jcmd $PID GC.heap_info; jcmd $PID Thread.print > /tmp/thread.txt
jstat -gcutil $PID 5s 12
```

优先看停顿 P99、晋升失败、分配速率和 Old Gen 占用，不要仅凭一次 Full GC 调大堆。生产开启 JFR/GC 日志轮转，日志脱敏并限制保留期。

## 3. 会话与 Memcached

无状态优先：把 session 外置到 Redis/Memcached 或采用 token。Tomcat session replication 会产生广播/复制成本，适合小集群而非无限扩展。Memcached 不提供持久化，必须接受节点丢失和缓存重建；禁止把权限数据作为唯一来源。

## 4. 滚动发布

先摘除节点、等待连接排空和会话迁移，再部署新版本。探针需覆盖依赖初始化和数据库迁移状态；启动成功不等于可接流量。灰度阶段比较错误率、P95、GC、线程池队列和业务指标。

## 故障处理

线程池耗尽先查下游阻塞和连接池，再调大线程；频繁 Full GC 先查对象分配和缓存，再调堆；502/504 区分 Nginx 超时、Tomcat accept 队列和应用异常。回滚应用前确认数据库 schema 向前兼容。

## 参数评审方法

先通过压测得到请求服务时间、并发、GC 分配速率和下游连接占用，再确定 `maxThreads`、`acceptCount`、JVM 堆和连接池。线程栈过大可能让大量线程在容器内触发 OOM；直接内存和 Metaspace 也要单独设上限。所有参数变更保留旧值、观测窗口和撤销命令。

会话复制只适合数据量小、写频率低的场景；大对象 session 会放大网络和 GC。更稳妥的方案是无状态 token 或外置存储，并为 Memcached 设置 TTL、容量和重建预案。发布时先让旧节点停止新会话，再等待活跃会话自然结束，避免强制清空导致批量登录。

JVM 事故取证应保存 GC 日志、JFR、线程 dump、容器限制、节点 dmesg 和应用 request id。不得在高峰随意执行 Full GC 或 heap dump；先确认磁盘空间、敏感数据暴露风险和业务窗口。
