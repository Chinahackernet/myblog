# 配置blackbox-exporter监控项

> 分类：Prometheus / 第9章：Prometheus Operator
> 原文：https://www.cuiliangblog.cn/detail/section/239953721
> 来源：崔亮的博客

---

# 修改 blackbox 配置
在前面部署<font style="color:rgb(28, 30, 33);">kube-prometheus 中已经安装过了blackbox-exporter 了，查看相关资源</font>

```yaml
[root@k8s-test ~]# kubectl get pod -n monitoring | grep black
blackbox-exporter-74465f5fcb-hmhnr     3/3     Running   0              27m
[root@k8s-test ~]# kubectl get svc -n monitoring | grep black
blackbox-exporter     ClusterIP   10.96.241.32     <none>        9115/TCP,19115/TCP   27m
```

查看配置文件

```yaml
[root@k8s-test ~]# cat kube-prometheus-0.14.0/manifests/blackboxExporter-configuration.yaml 
apiVersion: v1
data:
  config.yml: |-
    "modules":
      "http_2xx":
        "http":
          "preferred_ip_protocol": "ip4"
        "prober": "http"
      ……
kind: ConfigMap
metadata:
  labels:
    app.kubernetes.io/component: exporter
    app.kubernetes.io/name: blackbox-exporter
    app.kubernetes.io/part-of: kube-prometheus
    app.kubernetes.io/version: 0.25.0
  name: blackbox-exporter-configuration
  namespace: monitoring
```

<font style="color:rgb(28, 30, 33);">可以根据我们自己的需求来修改该配置文件，这里我们将 irc、ssh 和 pop3 的检测模块去掉，新增 dns 模块，修改后的配置文件如下所示：</font>

```yaml
apiVersion: v1
data:
  config.yml: |-
    "modules":
      "http_2xx": # GET请求
        "http":
          "preferred_ip_protocol": "ip4"
          "valid_http_versions": ["HTTP/1.1", "HTTP/2"]
          "method": "GET"
        "prober": "http"
        "timeout": "5s"
      "http_post_2xx": # POST请求
        "http":
          "method": "POST"
          "preferred_ip_protocol": "ip4"
        "prober": "http"
      "tcp_connect": # tcp连接
        "prober": "tcp"
        "timeout": "10s"
        "tcp":
          "preferred_ip_protocol": "ip4"
      "dns":  # DNS 检测模块
        "prober": "dns"
        "dns":
          "transport_protocol": "udp"  # 默认是 udp，tcp
          "preferred_ip_protocol": "ip4"  # 默认是 ip6
          query_name: "kubernetes.default.svc.cluster.local" # 利用这个域名来检查dns服务器
      icmp:  # ping 检测服务器的存活
        prober: icmp
kind: ConfigMap
metadata:
  labels:
    app.kubernetes.io/component: exporter
    app.kubernetes.io/name: blackbox-exporter
    app.kubernetes.io/part-of: kube-prometheus
    app.kubernetes.io/version: 0.25.0
  name: blackbox-exporter-configuration
  namespace: monitoring
```

修改完成后重新 apply 配置文件即可。

# 配置检测探针
## ping 检测
```yaml
apiVersion: monitoring.coreos.com/v1
kind: Probe
metadata:
  name: probe-ping
  namespace: monitoring
spec:
  jobName: probe-ping
  prober:
    url: blackbox-exporter.monitoring.svc:19115 # blackbox-exporter的svc地址
  module: icmp # 使用icmp模块
  interval: 30s 
  targets:
    staticConfig:
      static:
        - 8.8.8.8 # 探测目标地址
      labels: # 自定义标签
        env: prod
  sampleLimit: 100
```

## tcp 检测
```yaml
apiVersion: monitoring.coreos.com/v1
kind: Probe
metadata:
  name: probe-tcp
  namespace: monitoring
spec:
  jobName: probe-tcp
  prober:
    url: blackbox-exporter.monitoring.svc:19115
  module: tcp_connect
  interval: 30s 
  targets:
    staticConfig:
      static:
        - 39.156.70.239:443
      labels:
        env: prod
  sampleLimit: 100
```

## http 检测
```yaml
apiVersion: monitoring.coreos.com/v1
kind: Probe
metadata:
  name: probe-http
  namespace: monitoring
spec:
  jobName: probe-http
  prober:
    url: blackbox-exporter.monitoring.svc:19115
  module: http_2xx
  interval: 30s 
  targets:
    staticConfig:
      static:
        - https://www.baidu.com
        - https://cuiliangblog.cn
      labels:
        env: prod
  sampleLimit: 100
```

# 访问验证
## 查看 targets
![](assets/02-Prometheus/ed4bf0376de4382984d4.png)

## grafana 查看
grafana 导入 dashboard，id 为9965

![](assets/02-Prometheus/149e63dfca0e5b34f7b3.png)


