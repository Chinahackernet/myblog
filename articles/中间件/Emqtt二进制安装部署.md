> 官方文档：[https://docs.emqx.io/broker/v2/cn/](https://docs.emqx.io/broker/v2/cn/)

  

## 1 **二进制安装EMQTT**

```plain
[root@erp-test-emqtt ~]# wget https://www.emqx.io/downloads/broker/v2.3.11/emqttd-centos7-v2.3.11.zip

[root@erp-test-emqtt ~]# unzip emqttd-centos7-v2.3.11.zip

[root@erp-test-emqtt ~]# mv emqttd /data/

[root@erp-test-emqtt ~]# cat /usr/lib/systemd/system/emqttd.service
[Unit]
Description=emqttd server daemon
After=network.target

[Service]
Type=forking
User=root
Group=root
WorkingDirectory=/data/emqttd
ExecStart=/data/emqttd/bin/emqttd start
ExecReload=/data/emqttd/bin/emqttd restart
ExecStop=/data/emqttd/bin/emqttd stop
PrivateTmp=true
Restart=always
# Restart service after 10 seconds if the dotnet service crashes:
RestartSec=10
SyslogIdentifier=emqttd-example

[Install]
WantedBy=multi-user.target

WEB登录：IP:18083                  默认用户密码：admin/public
```

## 2 **安全配置**

```plain
[root@erp-test-emqtt ~]# /data/emqttd/bin/emqttd_ctl  plugins load emqx_auth_username

[root@erp-test-emqtt ~]# cat /data/emqttd/etc/plugins/emqx_auth_username.conf

[root@erp-test-emqtt ~]# cat /data/emqttd/etc/plugins/emq_auth_username.conf

[root@erp-test-emqtt ~]# vim /data/emqttd/etc/emq.conf                #配置WSS证书，证书不能为泛域名证书
listener.ssl.external.keyfile = etc/certs/key.pem
listener.ssl.external.certfile = etc/certs/cert.pem

listener.wss.external.keyfile = etc/certs/key.pem
listener.wss.external.certfile = etc/certs/cert.pem
```