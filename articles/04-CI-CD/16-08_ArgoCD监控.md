# ArgoCD监控

> 分类：CI/CD / 第16章：ArgoCD与GitOps入门
> 原文：https://www.cuiliangblog.cn/detail/section/178422013
> 来源：崔亮的博客

---

参考文档：[https://argo-cd.readthedocs.io/en/stable/operator-manual/metrics/](https://argo-cd.readthedocs.io/en/stable/operator-manual/metrics/)

# 配置targets
## 查看metrics信息
```bash
[root@tiaoban ~]# kubectl get svc -n argocd 
NAME                                      TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)                      AGE
argocd-applicationset-controller          ClusterIP   10.97.81.94      <none>        7000/TCP,8080/TCP            27d
argocd-dex-server                         ClusterIP   10.106.72.83     <none>        5556/TCP,5557/TCP,5558/TCP   27d
argocd-metrics                            ClusterIP   10.103.26.87     <none>        8082/TCP                     27d
argocd-notifications-controller-metrics   ClusterIP   10.105.181.100   <none>        9001/TCP                     27d
argocd-redis                              ClusterIP   10.100.131.134   <none>        6379/TCP                     27d
argocd-repo-server                        ClusterIP   10.100.123.80    <none>        8081/TCP,8084/TCP            27d
argocd-server                             NodePort    10.106.11.146    <none>        80:30701/TCP,443:30483/TCP   27d
argocd-server-metrics                     ClusterIP   10.105.164.150   <none>        8083/TCP                     27d
[root@tiaoban ~]# kubectl exec -it rockylinux -- bash
[root@rockylinux /]# curl argocd-metrics.argocd.svc:8082/metrics
# HELP argocd_app_info Information about application.
# TYPE argocd_app_info gauge
argocd_app_info{autosync_enabled="true",dest_namespace="default",dest_server="https://kubernetes.default.svc",health_status="Healthy",name="blue-green",namespace="argocd",operation="",project="default",repo="http://gitlab.local.com/devops/argo-demo",sync_status="Synced"} 1
# HELP argocd_app_reconcile Application reconciliation performance.
# TYPE argocd_app_reconcile histogram
argocd_app_reconcile_bucket{dest_server="https://kubernetes.default.svc",namespace="argocd",le="0.25"} 12
argocd_app_reconcile_bucket{dest_server="https://kubernetes.default.svc",namespace="argocd",le="0.5"} 18
argocd_app_reconcile_bucket{dest_server="https://kubernetes.default.svc",namespace="argocd",le="1"} 21
argocd_app_reconcile_bucket{dest_server="https://kubernetes.default.svc",namespace="argocd",le="2"} 21
argocd_app_reconcile_bucket{dest_server="https://kubernetes.default.svc",namespace="argocd",le="4"} 22
argocd_app_reconcile_bucket{dest_server="https://kubernetes.default.svc",namespace="argocd",le="8"} 24
```

## 创建<font style="color:rgb(48, 49, 51);">ServiceMonitor</font>资源
```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: argocd-exporter # ServiceMonitor名称
  namespace: monitoring # ServiceMonitor所在名称空间
spec:
  jobLabel: argocd-exporter # job名称
  endpoints: # prometheus所采集Metrics地址配置，endpoints为一个数组，可以创建多个，但是每个endpoints包含三个字段interval、path、port
  - port: metrics # prometheus采集数据的端口，这里为port的name，主要是通过spec.selector中选择对应的svc，在选中的svc中匹配该端口
    interval: 30s # prometheus采集数据的周期，单位为秒
    scheme: http # 协议
    path: /metrics # prometheus采集数据的路径
  selector: # svc标签选择器
    matchLabels:
      app.kubernetes.io/name: argocd-metrics
  namespaceSelector: # namespace选择
    matchNames:
    - argocd
```

## 验证targets
![](assets/04-CI-CD/22ea2ef5222d1ae4c45e.png)

# grafana查看数据
## 导入dashboard
参考文档：[https://grafana.com/grafana/dashboards/14584-argocd/](https://grafana.com/grafana/dashboards/14584-argocd/)

## 查看数据
![](assets/04-CI-CD/19b2ff7c10552dbaaae4.png)


