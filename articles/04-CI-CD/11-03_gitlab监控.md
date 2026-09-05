# gitlab监控

> 分类：CI/CD / 第11章：Gitlab基本配置与使用
> 原文：https://www.cuiliangblog.cn/detail/section/178422252
> 来源：崔亮的博客

---

参考文档：[https://docs.gitlab.com/ee/administration/monitoring/prometheus/gitlab_metrics.html](https://docs.gitlab.com/ee/administration/monitoring/prometheus/gitlab_metrics.html)

# gitlab配置
## 启用metrics监控
```bash
[root@tiaoban ~]# kubectl exec -it -n cicd gitlab-b5cb5f947-2swpw -- bash
root@gitlab-b5cb5f947-2swpw:/# vi /etc/gitlab/gitlab.rb
gitlab_exporter['enable'] = true                              
# gitlab_exporter['log_directory'] = "/var/log/gitlab/gitlab-exporter"
# gitlab_exporter['log_group'] = nil                                                           
# gitlab_exporter['home'] = "/var/opt/gitlab/gitlab-exporter"

##! Advanced settings. Should be changed only if absolutely needed.                                      
# gitlab_exporter['server_name'] = 'webrick'                                                                  
gitlab_exporter['listen_address'] = '0.0.0.0'    
gitlab_exporter['listen_port'] = '9168'
# 重载配置
root@gitlab-b5cb5f947-2swpw:/# gitlab-ctl reconfigure
# 重启gitlab
root@gitlab-b5cb5f947-2swpw:/# gitlab-ctl restart
```

修改service

```yaml
apiVersion: v1
kind: Service
metadata:
  name: gitlab
  namespace: cicd
  labels:
    app: gitlab
spec:
  selector:
    app: gitlab
  ports:
    - port: 80
      targetPort: 80
      name: http
    - port: 443
      targetPort: 443
      name: https
    - port: 22
      targetPort: 22
      name: ssh
    - port: 9168
      targetPort: 9168 
      name: gitlab-exporter
```

## 访问metrics验证
```bash
[root@rockylinux /]# curl gitlab.cicd.svc:9168/metrics
ruby_gc_stat_count 13
ruby_gc_stat_time 108
ruby_gc_stat_heap_allocated_pages 246
ruby_gc_stat_heap_sorted_length 317
ruby_gc_stat_heap_allocatable_pages 71
ruby_gc_stat_heap_available_slots 100516
ruby_gc_stat_heap_live_slots 80800
ruby_gc_stat_heap_free_slots 19716
ruby_gc_stat_heap_final_slots 0
ruby_gc_stat_heap_marked_slots 79756
```

# Prometheus配置
## 创建<font style="color:rgb(48, 49, 51);">ServiceMonitor</font>资源
```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: gitlab-exporter # ServiceMonitor名称
  namespace: monitoring # ServiceMonitor所在名称空间
spec:
  jobLabel: gitlab # job名称
  endpoints: # prometheus所采集Metrics地址配置，endpoints为一个数组，可以创建多个，但是每个endpoints包含三个字段interval、path、port
  - port: gitlab-exporter # prometheus采集数据的端口，这里为port的name，主要是通过spec.selector中选择对应的svc，在选中的svc中匹配该端口
    interval: 30s # prometheus采集数据的周期，单位为秒
    scheme: http # 协议
    path: /metrics # prometheus采集数据的路径
  selector: # svc标签选择器
    matchLabels:
      app: gitlab
  namespaceSelector: # namespace选择
    matchNames:
    - cicd
```

## 验证targets
![](assets/04-CI-CD/359febff9d0e2d4ddfd7.png)




