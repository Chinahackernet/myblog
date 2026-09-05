# 配置PrometheusRule

> 分类：Prometheus / 第9章：Prometheus Operator
> 原文：https://www.cuiliangblog.cn/detail/section/163023388
> 来源：崔亮的博客

---

我们现在能收集到redis的监控指标了，但是现在并没有配置监控报警规则。需要我们自己根据实际关心的指标添加报警规则

# 分析prometheus规则
## 查看prometheus web页面
首先我们看下Prometheus默认的规则内容如下。

![](assets/02-Prometheus/06e6eaafbe5b01bc2b91.png)

在 Prometheus的 Config 页面下面查看关于 AlertManager 的配置

![](assets/02-Prometheus/45a0c8fed2b8c8b4bc04.png)

## 分析alertmanager-main Service
上面 alertmanagers 实例的配置我们可以看到是通过角色为 endpoints 的 kubernetes 的服务发现机制获取的，匹配的是服务名为 alertmanager-main，端口名未 web 的 Service 服务，我们查看下 alertmanager-main 这个 Service：

```bash
# kubectl describe svc -n monitoring alertmanager-main                  
Name:              alertmanager-main
Namespace:         monitoring
Labels:            app.kubernetes.io/component=alert-router
                   app.kubernetes.io/instance=main
                   app.kubernetes.io/name=alertmanager
                   app.kubernetes.io/part-of=kube-prometheus
                   app.kubernetes.io/version=0.27.0
Annotations:       <none>
Selector:          app.kubernetes.io/component=alert-router,app.kubernetes.io/instance=main,app.kubernetes.io/name=alertmanager,app.kubernetes.io/part-of=kube-prometheus
Type:              ClusterIP
IP Family Policy:  SingleStack
IP Families:       IPv4
IP:                10.104.114.202
IPs:               10.104.114.202
Port:              web  9093/TCP
TargetPort:        web/TCP
Endpoints:         10.244.0.10:9093,10.244.1.199:9093,10.244.2.108:9093
Port:              reloader-web  8080/TCP
TargetPort:        reloader-web/TCP
Endpoints:         10.244.0.10:8080,10.244.1.199:8080,10.244.2.108:8080
Session Affinity:  ClientIP
Events:            <none>
```

可以看到服务名就是 alertmanager-main，Port 定义的名称也是 web，符合上面的规则，所以 Prometheus 和 AlertManager 组件就正确关联上了。

## 分析告警规则文件
而对应的报警规则文件位于：/etc/prometheus/rules/prometheus-k8s-rulefiles-0/目录下面所有的 YAML 文件。可以进入 Prometheus 的 Pod 中验证下该目录下面是否有 YAML 文件：

```bash
# kubectl exec -it -n monitoring prometheus-k8s-0 -- sh                  
~ $ cd /etc/prometheus/rules/prometheus-k8s-rulefiles-0/
/etc/prometheus/rules/prometheus-k8s-rulefiles-0 $ ls -l
total 32
lrwxrwxrwx    1 root     2000            83 Nov  1 15:41 monitoring-alertmanager-main-rules-f4184f3c-4765-4b06-b0c4-d565560f6fec.yaml -> ..data/monitoring-alertmanager-main-rules-f4184f3c-4765-4b06-b0c4-d565560f6fec.yaml
lrwxrwxrwx    1 root     2000            73 Nov  1 15:41 monitoring-grafana-rules-92b472f3-eb4b-4f26-a588-6cdb5e782ca6.yaml -> ..data/monitoring-grafana-rules-92b472f3-eb4b-4f26-a588-6cdb5e782ca6.yaml
lrwxrwxrwx    1 root     2000            81 Nov  1 15:41 monitoring-kube-prometheus-rules-f9f5c968-e865-4d4b-b371-48cad1b818b7.yaml -> ..data/monitoring-kube-prometheus-rules-f9f5c968-e865-4d4b-b371-48cad1b818b7.yaml
lrwxrwxrwx    1 root     2000            84 Nov  1 15:41 monitoring-kube-state-metrics-rules-41c416f2-7deb-4d9e-a9f1-0b4f7105f656.yaml -> ..data/monitoring-kube-state-metrics-rules-41c416f2-7deb-4d9e-a9f1-0b4f7105f656.yaml
lrwxrwxrwx    1 root     2000            87 Nov  1 15:41 monitoring-kubernetes-monitoring-rules-0cb66dd7-6a82-407e-b193-4b1f306ca48e.yaml -> ..data/monitoring-kubernetes-monitoring-rules-0cb66dd7-6a82-407e-b193-4b1f306ca48e.yaml
lrwxrwxrwx    1 root     2000            79 Nov  1 15:41 monitoring-node-exporter-rules-35c9511c-25d1-4805-9560-3b55a8eb3855.yaml -> ..data/monitoring-node-exporter-rules-35c9511c-25d1-4805-9560-3b55a8eb3855.yaml
lrwxrwxrwx    1 root     2000            91 Nov  1 15:41 monitoring-prometheus-k8s-prometheus-rules-15ddbd27-22f4-47a5-a1c1-2495b8232e39.yaml -> ..data/monitoring-prometheus-k8s-prometheus-rules-15ddbd27-22f4-47a5-a1c1-2495b8232e39.yaml
lrwxrwxrwx    1 root     2000            85 Nov  1 15:41 monitoring-prometheus-operator-rules-38620493-f6ee-4293-804b-692a3b5502b8.yaml -> ..data/monitoring-prometheus-operator-rules-38620493-f6ee-4293-804b-692a3b5502b8.yaml
```

这个YAML文件实际上就是我们之前创建的一个 PrometheusRule 文件包含的：

```yaml
# cd /opt/k8s/kube-prometheus/manifests 
# cat prometheus-prometheusRule.yaml   
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  labels:
    app.kubernetes.io/component: prometheus
    app.kubernetes.io/instance: k8s
    app.kubernetes.io/name: prometheus
    app.kubernetes.io/part-of: kube-prometheus
    app.kubernetes.io/version: 2.54.1
    prometheus: k8s
    role: alert-rules
  name: prometheus-k8s-prometheus-rules
  namespace: monitoring
spec:
  groups:
  - name: prometheus
    rules:
    - alert: PrometheusBadConfig
      annotations:
        description: Prometheus {{$labels.namespace}}/{{$labels.pod}} has failed to reload its configuration.
        runbook_url: https://runbooks.prometheus-operator.dev/runbooks/prometheus/prometheusbadconfig
        summary: Failed Prometheus configuration reload.
      expr: |
        # Without max_over_time, failed scrapes could create false negatives, see
        # https://www.robustperception.io/alerting-on-gauges-in-prometheus-2-0 for details.
        max_over_time(prometheus_config_last_reload_successful{job="prometheus-k8s",namespace="monitoring"}[5m]) == 0
      for: 10m
      labels:
        severity: critical
```

这里的 PrometheusRule 的 name 为 prometheus-k8s-prometheus-rules，namespace 为 monitoring，我们可以猜想到我们创建一个 PrometheusRule 资源对象后，会自动在上面的 prometheus-k8s-rulefiles-0 目录下面生成一个对应的-.yaml文件，所以如果以后我们需要自定义一个报警选项的话，只需要定义一个 PrometheusRule 资源对象即可。

至于为什么 Prometheus 能够识别这个 PrometheusRule 资源对象呢？这就查看我们创建的 prometheus( prometheus-prometheus.yaml) 这个资源对象了，里面有非常重要的一个属性 ruleSelector，用来匹配 rule 规则的过滤器，要求匹配具有 prometheus=k8s 和 role=alert-rules 标签的 PrometheusRule 资源对象

```plain
ruleSelector:
    matchLabels:
      prometheus: k8s
      role: alert-rules
```

所以要想自定义一个报警规则，**只需要创建一个具有 prometheus=k8s 和 role=alert-rules 标签的 PrometheusRule 对象就行了**。

# 配置告警规则
## 创建规则文件
比如现在我们添加一个redis是否可用的报警，我们可以通过redis_up这个指标检查redis是否启动，创建文件 redisRules.yaml：

```yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  labels:
    prometheus: k8s
    role: alert-rules
  name: redis-rules
  namespace: monitoring
spec:
  groups:
  - name: redis
    rules:
    - alert: RedisUnavailable
      annotations:
        summary: redis instance info
        description: If redis_up == 0, redis will be unavailable
      expr: |
        redis_up == 0
      for: 3m
      labels:
        severity: critical
```

## 查看验证
创建prometheusrule后，可以看到我们自己创建的redis-rules

```yaml
# kubectl apply -f redisRules.yaml                                    
prometheusrule.monitoring.coreos.com/redis-rules created
# kubectl get prometheusrule -n monitoring
NAME                              AGE
alertmanager-main-rules           3d18h
grafana-rules                     3d18h
kube-prometheus-rules             3d18h
kube-state-metrics-rules          3d18h
kubernetes-monitoring-rules       3d18h
node-exporter-rules               3d18h
prometheus-k8s-prometheus-rules   3d18h
prometheus-operator-rules         3d18h
redis-rules                       22s
```

创建完成后，隔一会儿再去容器中查看下 rules 文件夹：

```bash
# kubectl exec -it -n monitoring prometheus-k8s-0 -- sh
/prometheus $ cd /etc/prometheus/rules/prometheus-k8s-rulefiles-0/
/etc/prometheus/rules/prometheus-k8s-rulefiles-0 $ ls -l
total 36
lrwxrwxrwx    1 root     2000            83 Nov  1 15:41 monitoring-alertmanager-main-rules-f4184f3c-4765-4b06-b0c4-d565560f6fec.yaml -> ..data/monitoring-alertmanager-main-rules-f4184f3c-4765-4b06-b0c4-d565560f6fec.yaml
lrwxrwxrwx    1 root     2000            73 Nov  1 15:41 monitoring-grafana-rules-92b472f3-eb4b-4f26-a588-6cdb5e782ca6.yaml -> ..data/monitoring-grafana-rules-92b472f3-eb4b-4f26-a588-6cdb5e782ca6.yaml
lrwxrwxrwx    1 root     2000            81 Nov  1 15:41 monitoring-kube-prometheus-rules-f9f5c968-e865-4d4b-b371-48cad1b818b7.yaml -> ..data/monitoring-kube-prometheus-rules-f9f5c968-e865-4d4b-b371-48cad1b818b7.yaml
lrwxrwxrwx    1 root     2000            84 Nov  1 15:41 monitoring-kube-state-metrics-rules-41c416f2-7deb-4d9e-a9f1-0b4f7105f656.yaml -> ..data/monitoring-kube-state-metrics-rules-41c416f2-7deb-4d9e-a9f1-0b4f7105f656.yaml
lrwxrwxrwx    1 root     2000            87 Nov  1 15:41 monitoring-kubernetes-monitoring-rules-0cb66dd7-6a82-407e-b193-4b1f306ca48e.yaml -> ..data/monitoring-kubernetes-monitoring-rules-0cb66dd7-6a82-407e-b193-4b1f306ca48e.yaml
lrwxrwxrwx    1 root     2000            79 Nov  1 15:41 monitoring-node-exporter-rules-35c9511c-25d1-4805-9560-3b55a8eb3855.yaml -> ..data/monitoring-node-exporter-rules-35c9511c-25d1-4805-9560-3b55a8eb3855.yaml
lrwxrwxrwx    1 root     2000            91 Nov  1 15:41 monitoring-prometheus-k8s-prometheus-rules-15ddbd27-22f4-47a5-a1c1-2495b8232e39.yaml -> ..data/monitoring-prometheus-k8s-prometheus-rules-15ddbd27-22f4-47a5-a1c1-2495b8232e39.yaml
lrwxrwxrwx    1 root     2000            85 Nov  1 15:41 monitoring-prometheus-operator-rules-38620493-f6ee-4293-804b-692a3b5502b8.yaml -> ..data/monitoring-prometheus-operator-rules-38620493-f6ee-4293-804b-692a3b5502b8.yaml
lrwxrwxrwx    1 root     2000            71 Nov  5 03:24 monitoring-redis-rules-be9938cf-5b73-4026-b81e-d6cc11adbbc4.yaml -> ..data/monitoring-redis-rules-be9938cf-5b73-4026-b81e-d6cc11adbbc4.yaml
```

现在看到我们创建的 rule 文件已经被注入到了对应的 rulefiles 文件夹下面了。然后再去 Prometheus的 Alert 页面下面就可以查看到上面我们新建的报警规则了：

![](assets/02-Prometheus/cf6a2cf3a4f866e2a192.png)

# 配置告警媒介
> 接下来以alertmanager 推送告警到 prometheus-alert 为例
>

## 查看默认配置文件
```yaml
# cd /opt/k8s/kube-prometheus/manifests 
# cat alertmanager-secret.yaml         
apiVersion: v1
kind: Secret
metadata:
  labels:
    app.kubernetes.io/component: alert-router
    app.kubernetes.io/instance: main
    app.kubernetes.io/name: alertmanager
    app.kubernetes.io/part-of: kube-prometheus
    app.kubernetes.io/version: 0.27.0
  name: alertmanager-main
  namespace: monitoring
stringData:
  alertmanager.yaml: |-
    "global":
      "resolve_timeout": "5m"
    "inhibit_rules":
    - "equal":
      - "namespace"
      - "alertname"
      "source_matchers":
      - "severity = critical"
      "target_matchers":
      - "severity =~ warning|info"
    - "equal":
      - "namespace"
      - "alertname"
      "source_matchers":
      - "severity = warning"
      "target_matchers":
      - "severity = info"
    - "equal":
      - "namespace"
      "source_matchers":
      - "alertname = InfoInhibitor"
      "target_matchers":
      - "severity = info"
    "receivers":
    - "name": "Default"
    - "name": "Watchdog"
    - "name": "Critical"
    - "name": "null"
    "route":
      "group_by":
      - "namespace"
      "group_interval": "5m"
      "group_wait": "30s"
      "receiver": "Default"
      "repeat_interval": "12h"
      "routes":
      - "matchers":
        - "alertname = Watchdog"
        "receiver": "Watchdog"
      - "matchers":
        - "alertname = InfoInhibitor"
        "receiver": "null"
      - "matchers":
        - "severity = critical"
        "receiver": "Critical"
type: Opaque
```

现在我们需要修改这个文件，配置 webhook 接收地址，具体可参考文档[https://github.com/feiyu563/PrometheusAlert/blob/master/doc/readme/system-prometheus.md](https://github.com/feiyu563/PrometheusAlert/blob/master/doc/readme/system-prometheus.md)。

## 创建配置文件
根据 prometheus alert 示例文件，修改 webhook 地址既可。

```yaml
apiVersion: v1
kind: Secret
metadata:
  labels:
    app.kubernetes.io/component: alert-router
    app.kubernetes.io/instance: main
    app.kubernetes.io/name: alertmanager
    app.kubernetes.io/part-of: kube-prometheus
    app.kubernetes.io/version: 0.27.0
  name: alertmanager-main
  namespace: monitoring
stringData:
  alertmanager.yaml: |-
    global:
      resolve_timeout: 5m
    route:
      group_by: ['instance']
      group_wait: 10m
      group_interval: 10s
      repeat_interval: 10m
      receiver: 'web.hook.prometheusalert'
    receivers:
    - name: 'web.hook.prometheusalert'
      webhook_configs:
      - url: 'http://[prometheusalert_url]:8080/prometheusalert?type=dd&tpl=prometheus-dd&ddurl=https://oapi.dingtalk.com/robot/send?access_token=xxxxxxxxxxxxxxxxxxxxxx&at=18888888888'
type: Opaque
```

## 查看 alertmanager 配置
![](assets/02-Prometheus/de2c2a9000296875b68c.png)

## 查看 alertmanager 推送记录
![](assets/02-Prometheus/0de1447da4894d05339d.png)


