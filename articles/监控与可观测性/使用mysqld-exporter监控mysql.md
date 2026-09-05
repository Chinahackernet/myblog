### 安装

```yaml
# wget https://github.com/prometheus/mysqld_exporter/releases/download/v0.12.1/mysqld_exporter-0.12.1.linux-amd64.tar.gz
# tar xf mysqld_exporter-0.12.1.linux-amd64.tar.gz -C /opt
# mv mysqld_exporter-0.12.1.linux-amd64 mysqld_exporter
```

  

### 创建mysql只读账户

```yaml
mysql> create user 'mysqld_exporter'@'%' identified by '1qaz@WSX';
GRANT PROCESS, REPLICATION CLIENT, SELECT ON *.* TO 'mysqld_exporter'@'%'  WITH MAX_USER_CONNECTIONS 3;
flush privileges;
```

  

### 创建mysqld\_exporter配置文件

```yaml
# cat <<EOF>> /opt/mysqld-exporter/my.cnf
[client]
user=mysqld_exporter
password=1qaz@WSX
port=3306
host=127.0.0.1
EOF
```

  

### 创建systemd启动文件

```yaml
cat <<EOF>> /usr/lib/systemd/system/mysqld_exporter.service
[Unit]
Description=mysqld_exporter
Documentation=https://prometheus.io/
After=network.target

[Service]
Type=simple
User=root
ExecStart=/opt/mysqld_exporter/mysqld_exporter \
          --config.my-cnf "/opt/mysqld_exporter/my.cnf" \
          --collect.global_status \
          --collect.info_schema.innodb_metrics \
          --collect.auto_increment.columns \
          --collect.info_schema.processlist \
          --collect.binlog_size \
          --collect.info_schema.tablestats \
          --collect.global_variables \
          --collect.info_schema.query_response_time \
          --collect.info_schema.userstats \
          --collect.info_schema.tables \
          --collect.perf_schema.tablelocks \
          --collect.perf_schema.file_events \
          --collect.perf_schema.eventswaits \
          --collect.perf_schema.indexiowaits \
          --collect.perf_schema.tableiowaits \
          --collect.slave_status \
          --web.listen-address=0.0.0.0:9104
ExecReload=/bin/kill -HUP $MAINPID
Restart=on-failure

[Install]
WantedBy=multi-user.target
EOF
```

  

### 启动mysqld-exporter

```yaml
systemctl enable mysqld-exporter
systemctl start mysqld-exporter
```

  

### 配置prometheus抓取数据

这里使用的prometheus-operator部署的，所以配置serviceMonitor进行抓取，如下：

```yaml
---
apiVersion: v1
kind: Service
metadata:
  name: mysqld-exporter
  namespace: monitoring
  labels:
    k8s-app: mysqld-exporter
spec:
  type: ClusterIP
  clusterIP: None
  ports:
  - name: http
    port: 9104
    protocol: TCP
---
apiVersion: v1
kind: Endpoints
metadata:
  name: mysqld-exporter
  namespace: monitoring
  labels:
    k8s-app: mysqld-exporter
subsets:
- addresses:
  - ip: 172.16.0.185
  ports:
  - name: http
    port: 9104
    protocol: TCP
---
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: mysqld-exporter 
  namespace: monitoring
  labels:
    k8s-app: mysqld-exporter
    chart: prometheus-operator-8.5.0
    heritage: Helm
    release: prometheus
spec:
  jobLabel: k8s-app
  endpoints:
  - port: http
    interval: 30s
    scheme: http
  selector:
    matchLabels:
      k8s-app: mysqld-exporter 
  namespaceSelector:
    matchNames:
    - monitoring
```

  

### 添加grafana面板

导入**7362即可。**

### 配置告警规则

```yaml
groups:
- name: MySQLStatsAlert
    rules:
    - alert: MySQL is down
        expr: mysql_up == 0
        for: 1m
        labels:
            severity: critical
        annotations:
            summary: "Instance {{ $labels.instance }} MySQL is down"
            description: "MySQL database is down. This requires immediate action!"

    - alert: Mysql_High_QPS
        expr: rate(mysql_global_status_questions[5m]) > 500 
        for: 2m
        labels:
            severity: warning
        annotations:
            summary: "{{$labels.instance}}: Mysql_High_QPS detected"
            description: "{{$labels.instance}}: Mysql opreation is more than 500 per second ,(current value is: {{ $value }})"  
    - alert: Mysql_Too_Many_Connections
        expr: rate(mysql_global_status_threads_connected[5m]) > 200
        for: 2m
        labels:
            severity: warning
        annotations:
            summary: "{{$labels.instance}}: Mysql Too Many Connections detected"
            description: "{{$labels.instance}}: Mysql Connections is more than 100 per second ,(current value is: {{ $value }})"  

    - alert: Mysql_Too_Many_slow_queries
        expr: rate(mysql_global_status_slow_queries[5m]) > 3
        for: 2m
        labels:
            severity: warning
        annotations:
            summary: "{{$labels.instance}}: Mysql_Too_Many_slow_queries detected"
            description: "{{$labels.instance}}: Mysql slow_queries is more than 3 per second ,(current value is: {{ $value }})"  

    - alert: SQL thread stopped
        expr: mysql_slave_status_slave_sql_running != 1
        for: 1m
        labels:
            severity: critical
        annotations:
            summary: "Instance {{ $labels.instance }} Sync Binlog is enabled"
            description: "SQL thread has stopped. This is usually because it cannot apply a SQL statement received from the master."
    - alert: Slave lagging behind Master
        expr: rate(mysql_slave_status_seconds_behind_master[5m]) >30 
        for: 1m
        labels:
            severity: warning 
        annotations:
            summary: "Instance {{ $labels.instance }} Slave lagging behind Master"
            description: "Slave is lagging behind Master. Please check if Slave threads are running and if there are some performance issues!"
```