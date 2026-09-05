# 启用Prometheus监控

> 分类：Ceph / 第10章：Rook
> 原文：https://www.cuiliangblog.cn/detail/section/192814719
> 来源：崔亮的博客

---

> 参考文档：[https://rook.io/docs/rook/latest-release/Storage-Configuration/Monitoring/ceph-monitoring/](https://rook.io/docs/rook/latest-release/Storage-Configuration/Monitoring/ceph-monitoring/)
>

# 配置 prometheus
## 部署 prometheus 监控
参考文档：[../06_Kubernetes/03-14_%E9%83%A8%E7%BD%B2Prometheus%E7%9B%91%E6%8E%A7.md](articles/06-Kubernetes/03-14_部署Prometheus监控.md)

## 启用service-monitor
```bash
# git clone --single-branch --branch v1.15.5 https://github.com/rook/rook.git
# cd rook/deploy/examples/monitoring
kubectl create -f service-monitor.yaml
kubectl create -f exporter-service-monitor.yaml
```

## 查看验证
![](assets/12-Ceph/b46f62790c06a841842a.png)

# 配置 grafana
## 导入 dashboard
[https://grafana.com/dashboards/2842](https://grafana.com/dashboards/2842)

[https://grafana.com/dashboards/5336](https://grafana.com/dashboards/5336)

[https://grafana.com/dashboards/5342](https://grafana.com/dashboards/5342)

# 告警规则配置
参考文档：[https://samber.github.io/awesome-prometheus-alerts/rules#ceph](https://samber.github.io/awesome-prometheus-alerts/rules#ceph)




