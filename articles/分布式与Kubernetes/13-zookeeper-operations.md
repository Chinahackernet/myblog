# ZooKeeper 生产运维：quorum、选主、滚动升级与恢复

## 1. Quorum 与数据目录

ZooKeeper 使用 Zab 保证顺序广播；写请求需要 quorum 确认，通常部署奇数节点（3/5）以容忍少数节点故障。节点必须分布在独立故障域，`dataDir` 与 `dataLogDir` 分离到低延迟磁盘，快照与事务日志纳入备份但不能直接跨集群复制运行时目录。

```properties
tickTime=2000
initLimit=10
syncLimit=5
dataDir=/var/lib/zookeeper/data
dataLogDir=/var/lib/zookeeper/txn
clientPort=2181
server.1=zk-01:2888:3888
server.2=zk-02:2888:3888
server.3=zk-03:2888:3888
```

## 2. 选主、会话与容量

启动时节点先发现彼此，再通过 3888 端口选举 leader；leader 负责提案与提交，follower 同步事务。客户端 session timeout、watch 数量、连接数和请求大小必须按业务设置。大量临时节点、watch 或大 value 会放大内存和重连风暴。

```bash
echo ruok | nc zk-01 2181
echo mntr | nc zk-01 2181
echo srvr | nc zk-01 2181
```

监控 `zk_server_state`、sync limit、outstanding requests、proposal 延迟、磁盘 fsync、连接数和 JVM GC。`ruok` 返回 imok 只说明进程响应，不能证明已经加入 quorum 或业务 znode 可读写。

## 3. ACL、滚动升级与故障处理

生产启用 digest/Kerberos 等认证与最小 ACL，敏感配置不放在公开 znode。滚动升级顺序为 follower→follower→leader，逐节点检查协议兼容、同步延迟和客户端会话；禁止同时停止超过 quorum 容忍数的节点。升级前备份快照、事务日志和配置，并确认回退版本兼容性。

网络分区时先判断是否仍有 quorum；少数派不可写是保护机制，不应通过强制启动制造双集群。磁盘满、事务日志损坏或数据目录不一致时，先隔离节点、保留证据，再从可信快照恢复并重新加入，禁止把任意节点目录直接覆盖到全体节点。

## 验收标准

- 3/5 节点在单节点和单故障域故障下仍能选主并提供业务读写。
- 快照恢复后 znode、ACL、版本号和客户端会话行为符合预期。
- 滚动升级期间无超过目标的会话断开和写入失败。
- quorum 丢失、脑裂、磁盘满和恢复动作都有演练记录。

## 5. 变更前检查与回滚

变更前保存 `zoo.cfg`、JAAS、TLS 证书、四字命令输出、JVM 参数和数据目录容量。滚动升级每次只操作一个节点，等待其重新加入并完成同步后再继续；若 leader 选举时间、同步延迟或客户端错误超过门限，立即暂停。回滚必须使用与当前数据格式兼容的版本，必要时从快照恢复到隔离集群，再通过应用级校验决定是否切换。

## 6. 安全与数据治理

限制四字命令到允许列表，关闭不必要的管理接口；客户端连接启用 TLS、认证和 ACL。znode value 设大小上限，配置、凭证和业务大对象不得混存。快照、事务日志和审计日志按合规期限加密保存，恢复演练结束后清理临时副本与访问凭证。

容量阈值应包含事务日志增长率、快照耗时、磁盘 fsync P99、连接数和 watch 数量；当任一项接近上限，先降低写入或拆分业务，再扩容，避免在 quorum 紧张时直接重启节点。

客户端应实现指数退避、会话重建和幂等初始化；在集群选主或网络抖动期间禁止无界重试。通过连接、请求和 watch 指标可以区分客户端风暴与服务端性能退化。

恢复完成的判据应包含 leader/follower 状态稳定、zxid 单调、同步延迟回到基线、关键 znode 版本正确以及客户端无持续重连。只有这些条件同时满足，才结束维护窗口并恢复正常发布。
