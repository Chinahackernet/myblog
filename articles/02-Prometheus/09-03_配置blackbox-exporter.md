# 配置blackbox-exporter

> 分类：Prometheus / 第9章：Prometheus Operator
> 原文：https://www.cuiliangblog.cn/detail/section/192976745
> 来源：崔亮的博客

---

# 启用 icmp 模块
> 安装kube-prometheus 后默认在monitoring namespace中有创建 blackbox-exporter deployment。但默认没有[icmp](https://so.csdn.net/so/search?q=icmp&spm=1001.2101.3001.7020)的module配置，无法执行ping探测。因此首先需要启用 icmp 模块。
>

## 修改blackbox配置文件
修改blackbox 的config map，添加icmp的modules：

```yaml
# 复制配置文件
# cp ../../kube-prometheus/manifests/blackboxExporter-configuration.yaml .
# vim blackboxExporter-configuration.yaml
apiVersion: v1
data:
  config.yml: |-
    "modules":
      "http_2xx":
        "http":
          "preferred_ip_protocol": "ip4"
        "prober": "http"
      "http_post_2xx":
        "http":
          "method": "POST"
          "preferred_ip_protocol": "ip4"
        "prober": "http"
      "irc_banner":
        "prober": "tcp"
        "tcp":
          "preferred_ip_protocol": "ip4"
          "query_response":
          - "send": "NICK prober"
          - "send": "USER prober prober prober :prober"
          - "expect": "PING :([^ ]+)"
            "send": "PONG ${1}"
          - "expect": "^:[^ ]+ 001"
      "pop3s_banner":
        "prober": "tcp"
        "tcp":
          "preferred_ip_protocol": "ip4"
          "query_response":
          - "expect": "^+OK"
          "tls": true
          "tls_config":
            "insecure_skip_verify": false
      "ssh_banner":
        "prober": "tcp"
        "tcp":
          "preferred_ip_protocol": "ip4"
          "query_response":
          - "expect": "^SSH-2.0-"
      "tcp_connect":
        "prober": "tcp"
        "tcp":
          "preferred_ip_protocol": "ip4"
      "icmp_ping": # 添加如下module配置
         "prober": "icmp"
         "timeout": "5s"
         "icmp":
            "preferred_ip_protocol": "ip4"
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

## 修改 blackbox 控制器
ping 命令需要在网络层上执行操作，因此它需要特殊的权限，而 blackbox 默认没有配置 root 权限，因此需要修改配置

```yaml
# cp ../../kube-prometheus/manifests/blackboxExporter-deployment.yaml .
# vim blackboxExporter-deployment.yaml
spec:
  template:
    spec:
      containers:
        securityContext:
          allowPrivilegeEscalation: false
          #capabilities:
          #  drop:
          #  - ALL
          readOnlyRootFilesystem: true
          runAsGroup: 0
          runAsNonRoot: false
          runAsUser: 0
```

# ping 检测
## 资源清单
```yaml
apiVersion: monitoring.coreos.com/v1
kind: Probe
metadata:
  name: blackbox-exporter-ping
  namespace: monitoring
spec:
  interval: 30s
  module: icmp_ping # 指定模块icmp_ping
  prober:
    url: blackbox-exporter:19115 # blackbox exporter地址
  targets:
    staticConfig:
      static:
      - 10.119.202.201 # ping检测的ip地址
      labels:
        group: icmp
```

## 查看验证
![](assets/02-Prometheus/9616c0c1a1731abfa825.png)

# tcp 检测
## 资源清单
```yaml
apiVersion: monitoring.coreos.com/v1
kind: Probe
metadata:
  name: blackbox-exporter-tcp
  namespace: monitoring
spec:
  interval: 30s # 检测间隔
  module: tcp_connect # 指定模块
  prober:
    url: blackbox-exporter:19115 # blackbox exporter地址
  targets:
    staticConfig:
      static:
      - 192.168.10:5672 # tcp检测的ip和端口
```

## 查看验证
![](assets/02-Prometheus/cd2cfcb77cc596c1050a.png)

# URL 检测
## 资源清单
```yaml
apiVersion: monitoring.coreos.com/v1
kind: Probe
metadata:
  name: blackbox-exporter-http
  namespace: monitoring
spec:
  interval: 30s
  module: http_2xx # 指定模块
  prober:
    url: blackbox-exporter:19115 # blackbox exporter地址
  targets:
    staticConfig:
      static:
      - https://www.baidu.com # tcp检测的ip和端口
```

## 查看验证
![](assets/02-Prometheus/08db4e9d467f114c0602.png)


