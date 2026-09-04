# MogileFS/FastDFS 角色、故障域、扩容与 Nginx 代理

## 1. 角色与一致性

MogileFS 由 Tracker、MogStored 和元数据数据库组成；FastDFS 由 Tracker、Storage Group 和文件 ID 组成。两者都把元数据路由与对象存储分离，但一致性、复制和删除语义不同，不能当作 POSIX 文件系统。

## 2. 故障域设计

副本应跨主机、机架和可用区，副本数根据 RPO、容量和修复窗口计算。监控元数据服务、存储节点、磁盘 SMART、复制队列、坏块和 rebalancing 进度。删除操作必须有延迟回收和审计。

## 3. 扩容与恢复

先加入新节点并验证读写，再逐步迁移对象；限制迁移带宽，避免占满业务网络。节点故障时先摘除路由、确认副本可读，再替换磁盘或重建节点。不可只看节点在线，必须校验对象可读和校验和。

## 4. Nginx 代理

```nginx
location /files/ {
  proxy_set_header Host $host;
  proxy_pass http://storage_backend;
  proxy_read_timeout 60s;
  proxy_buffering off;
}
```

大对象下载需配置 Range、超时、限速和断点续传；上传接口校验长度、类型、病毒扫描和授权。代理日志记录对象 ID、节点、状态和耗时，避免记录敏感内容。

## 验收

模拟 Tracker/Storage/DB/磁盘故障，验证读写路由、复制补偿、扩容回收和 Nginx 回源；做抽样校验和异地恢复，形成对象级 RPO 报告。

## 一致性与运维边界

上传流程采用临时对象 → 校验和 → 元数据提交 → 对外可见，避免客户端读到半写文件。删除采用 tombstone/延迟回收，先确认所有副本和 CDN 缓存失效，再回收物理块。对象 ID、版本、校验和、创建者和保留期进入元数据审计。

扩容时把新节点加入低权重池，先做读流量和小批量写入，再逐步 rebalance。迁移失败要能从 checkpoint 继续，且不重复计费或覆盖新版本。Nginx 层限制单请求大小、并发上传和 Range 请求，后端节点异常时返回可重试状态而不是静默截断。
