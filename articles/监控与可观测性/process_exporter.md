```bash
# 部署
wget https://github.com/ncabatoff/process-exporter/releases/download/v0.6.0/process-exporter-0.6.0.linux-amd64.tar.gz
tar xvf process-exporter-0.6.0.linux-amd64.tar.gz -C /opt
cd /opt
mv process-exporter-0.6.0.linux-amd64 process-exporter

# systemd启动脚本
cat <<EOF>> /lib/systemd/system/process_exporter.service 
[Unit]
Description=blackbox_exporter
Documentation=https://prometheus.io/
After=network.target
StartLimitIntervalSec=0

[Service]
Type=simple
User=root
ExecStart=/opt/process-exporter/process-exporter -config.path /opt/process-exporter/config.yml
RestartSec=1
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# 启动配置
systemctl enable process_exporter
systemctl start process_exporter
```

  

配置文件

```bash
process_names:
  - comm:
    - process-exporter
  - exe:
    - /opt/process-exporter/process-exporter
  - name: "{{.Matches}}"
    exe:
    - /usr/local/jdk1.8.0_112/bin/java
    cmdline:
    - 'pos'
  - name: "{{.Matches}}"
    exe:
    - /usr/local/jdk1.8.0_112/bin/java
    cmdline:
    - 'wallet'
```