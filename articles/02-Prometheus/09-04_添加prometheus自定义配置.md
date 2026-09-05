# 添加prometheus自定义配置

> 分类：Prometheus / 第9章：Prometheus Operator
> 原文：https://www.cuiliangblog.cn/detail/section/193000213
> 来源：崔亮的博客

---

> <font style="color:rgb(77, 77, 77);">prometheus的配置默认是不能修改的，目前可以通过新增prometheus-additional.yaml来添加新增配置。</font>
>

例如在 k8s 集群外部也有一台 Linux 主机，需要采集 node-exporter 指标，除了可以引入k8s中创建svc资源，然后通过 ServiceMonitor 方式监控外，也可以直接添加配置文件。

# 创建secret对象
新增 prometheus 配置文件内容

```yaml
# cat tiaoban-job.yaml            
- job_name: tiaoban-node_exporter
  static_configs:
  - targets:
    - 192.168.10.100:9100
```

根据配置文件创建 secret 资源

```bash
# kubectl create secret generic tiaoban-configs --from-file=tiaoban-job.yaml -n monitoring
secret/tiaoban-configs created
```

# 修改 prometheus 配置
查看资源名称

```bash
# kubectl get prometheus -n monitoring 
NAME   VERSION   DESIRED   READY   RECONCILED   AVAILABLE   AGE
k8s    2.54.1    2         2       True         True        6d14h
```

修改资源

```yaml
# kubectl edit prometheus -n monitoring k8s
spec:
  additionalScrapeConfigs: # 新增自定义资源
    name: tiaoban-configs   # secret 的名字   
    key: tiaoban-job.yaml # 文件名
  alerting:
    alertmanagers:
    - apiVersion: v2
      name: alertmanager-main
      namespace: monitoring
      port: web
```

# 访问验证
![](assets/02-Prometheus/0469d63a648090dba3ae.png)


