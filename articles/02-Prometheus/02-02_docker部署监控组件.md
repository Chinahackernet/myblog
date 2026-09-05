# docker部署监控组件

> 分类：Prometheus / 第2章：安装部署
> 原文：https://www.cuiliangblog.cn/detail/section/44309857
> 来源：崔亮的博客

---

## node-export部署
```bash
docker run -d --name node-exporter --restart always \
  --net="host" \
  --pid="host" \
  -v "/:/host:ro,rslave" \
  quay.io/prometheus/node-exporter:v1.8.1 \
  --path.rootfs=/host
```

## <font style="color:rgba(0, 0, 0, 0.75);">alertmanager部署</font>
```json
route:
  group_by: ['alertname']
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 1h
  receiver: 'web.hook'
receivers:
- name: 'web.hook'
  webhook_configs:
  - url: 'http://127.0.0.1:5001/'
inhibit_rules:
  - source_match:
      severity: 'critical'
    target_match:
      severity: 'warning'
    equal: ['alertname', 'dev', 'instance']
```

```bash
mkdir /opt/alertmanager
cd /opt/alertmanager
docker run -d -p 9093:9093 --name alertmanager -v $PWD/alertmanager.yml:/etc/alertmanager/alertmanager.yml --restart always prom/alertmanager:latest
```

## prometheus部署
+ /opt/prometheus/prometheus.yml

```json
global:
  scrape_interval: 15s # Set the scrape interval to every 15 seconds. Default is every 1 minute.
  evaluation_interval: 15s # Evaluate rules every 15 seconds. The default is every 1 minute.
  # scrape_timeout is set to the global default (10s).

# Alertmanager configuration
alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - 192.168.10.10:9093

# Load rules once and periodically evaluate them according to the global 'evaluation_interval'.
rule_files:
  # - "first_rules.yml"
  # - "second_rules.yml"

# A scrape configuration containing exactly one endpoint to scrape:
# Here it's Prometheus itself.
scrape_configs:
  # The job name is added as a label `job=<job_name>` to any timeseries scraped from this config.
  - job_name: "prometheus"

    # metrics_path defaults to '/metrics'
    # scheme defaults to 'http'.

    static_configs:
      - targets: ["localhost:9090"]
  - job_name: "node-export"
    static_configs:
      - targets: ["192.168.10.10:9100"]
  - job_name: "alertmanager"
    static_configs:
      - targets: ["192.168.10.10:9093"]
```

+ 创建容器

```bash
mkdir /opt/prometheus
cd /opt/prometheus
docker run -d -p 9090:9090 --name prometheus -v $PWD/prometheus.yml:/etc/prometheus/prometheus.yml -v $PWD/data:/prometheus -v $PWD/roles:/etc/prometheus/  --restart always prom/prometheus:latest
# 如果提示"open /prometheus/queries.active: permission denied"
docker exec -it prometheus sh
/prometheus $ cat /etc/passwd 
查看当前容器用户权限
nobody:x:65534:65534:nobody:/home:/bin/false
chown -R 65534:65534 /opt/prometheus
```

+ prometheus.yml是prometheus的配置文件
+ data目录用于存放prometheus程序持久化的数据

## grafana部署
```bash
docker run -d -p 3000:3000 -v /opt/grafana/data:/var/lib/grafana  -v /opt/grafana/grafana.ini:/etc/grafana/grafana.ini --name=grafana --restart always grafana/grafana:latest
```



## 



