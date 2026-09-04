# Tomcat 生产运行时：JDK、线程池、JVM、会话与滚动发布

## 1. 运行时基线

Tomcat 的性能上限由 JDK、连接器、执行器、应用代码、数据库连接池和外部依赖共同决定。先固定 JDK 大版本、时区、字符集和容器镜像，再测量基线；不要仅凭 GC 日志调大堆。

```bash
java -version
java -XshowSettings:vm -version 2>&1 | egrep 'Max. Heap|Initial Heap|Compressed'
curl -fsS http://127.0.0.1:8080/health
```

JVM 堆应依据 live set、峰值分配速率和 GC 停顿目标确定，容器内存还要预留 metaspace、线程栈、直接内存和 native 库。生产启用统一 GC 日志、堆转储路径与磁盘水位告警，禁止 OOM 时无限生成 dump 填满根分区。

## 2. 连接器、线程池和数据库连接池

`maxThreads` 决定并发请求处理能力，但过大只会把排队从 Tomcat 推给数据库和下游。应以压测得到的服务时间、CPU 和依赖容量为依据，配合 `acceptCount`、连接超时、keep-alive 和最大连接数。业务线程池、异步线程池和 JDBC 连接池必须分离并设置队列上限。

```xml
<Executor name="tomcatThreadPool" namePrefix="catalina-exec-"
          maxThreads="300" minSpareThreads="30" maxQueueSize="1000"/>
<Connector executor="tomcatThreadPool" port="8080"
           connectionTimeout="5000" maxKeepAliveRequests="100"
           maxConnections="10000" acceptCount="500" />
```

监控 active threads、busy threads、队列、请求 P95/P99、5xx、JDBC active/等待和 GC pause。线程池饱和时先确认依赖变慢或锁争用，不能直接增加线程。

## 3. 会话复制、Memcached 与无状态化

优先将会话外置到 Redis/Memcached 或改造为无状态 Token；Tomcat 集群内存复制会放大网络和序列化成本，只适合规模较小且对象可序列化的场景。Memcached 仅作缓存，不承诺持久化；会话超时、淘汰、节点故障和序列化兼容必须有明确策略。

发布前检查 session cookie 的安全属性（Secure、HttpOnly、SameSite）、粘性策略和节点排空。任何节点都应能处理新请求，避免滚动发布因 session 绑定造成大面积登出。

## 4. 滚动发布与故障定位

发布顺序：预热新节点→健康检查（含数据库、缓存和关键业务）→加入负载均衡小权重→观察错误率/延迟→逐步放量→旧节点 drain→确认连接排空→停止旧版本。回滚使用上一制品和数据库兼容迁移，禁止把不可逆 schema 变更和应用发布绑成一步。

故障树按连接器拒绝、线程池耗尽、GC 停顿、类加载/内存泄漏、数据库池耗尽和下游超时分层。采集 `jstack`、JFR、GC 日志和线程池指标前控制采样范围；敏感请求参数和堆转储必须加密并设保留期限。

## 验收标准

- 固定 JDK 与 JVM 参数，容器内存留有 native 余量。
- 线程池、JDBC 池、GC 和下游依赖有独立指标与告警。
- 会话在节点摘除和滚动发布中保持或按设计失效。
- 发布可预热、排空、回滚，且数据库变更可前向/后向兼容。

## 5. 可重复的性能实验

压测至少记录并发、吞吐、P50/P95/P99、错误率、GC 暂停、线程池 busy/queue、JDBC active/waiting 和下游延迟。用阶梯流量找到拐点，再分别改变一个变量（堆大小、线程数、连接池、压缩或日志级别），避免多参数同时改变导致结论不可归因。所有测试请求使用脱敏数据，压测账号和数据在实验结束后销毁。

```bash
jcmd $PID VM.native_memory summary
jcmd $PID GC.heap_info
jstack -l $PID > /tmp/tomcat-$PID.jstack
```

遇到持续 Full GC，先确认 live set、晋升失败和 native 内存；遇到 503，区分连接器拒绝、应用线程池队列和负载均衡摘除；遇到会话丢失，核对 cookie、粘性、复制/外置存储和时钟。恢复动作应优先降低流量或摘除节点，再采集证据和重启，避免丢失现场。
