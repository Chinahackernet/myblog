# Helm、指标与 Kubernetes 可观测性

## Helm 工程

Chart 应把镜像 digest、资源、探针、PDB、ServiceAccount、NetworkPolicy 和迁移开关参数化；默认值必须安全。发布前执行 `helm lint`、`helm template`、策略扫描和差异评审，升级使用 `--atomic` 前先理解其回滚边界。

```bash
helm lint charts/api; helm template api charts/api -n prod -f values-prod.yaml > rendered.yaml
helm diff upgrade api charts/api -n prod -f values-prod.yaml
```

## 指标体系

控制面监控 API 延迟、etcd fsync、调度队列和 webhook；节点监控 CPU、内存 PSI、磁盘、网络和 kubelet；工作负载监控请求率、错误率、P95、重启、队列和依赖。指标标签要控制基数，避免把 request ID 当 label。

## 日志与追踪

统一采集容器 stdout、审计日志和入口访问日志，使用 trace/request ID 关联指标、日志和调用链。采集器必须有背压、磁盘保护、脱敏和丢弃策略；保留期按合规和排障价值分级。

## 验收

模拟 rollout 失败、etcd 延迟、节点磁盘满和采集器断链，验证 Helm 回滚、告警、日志补传和业务 SLO。

