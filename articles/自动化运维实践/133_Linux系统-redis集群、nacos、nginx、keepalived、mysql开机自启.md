---
title: Linux系统-redis集群、nacos、nginx、keepalived、mysql开机自启
---

### 一、Redis集群开机自启：

如三主三从交叉式redis集群，有两个方法，自行选择。

### 方法一：

### 第一步：分别在各节点添加以下redis.service文件

命令：`vim /lib/systemd/system/redis_6379.service`  
添加：

```
[Unit]
Description=Redis persistent key-value database
After=network.target
After=network-online.target
Wants=network-online.target

[Service]
Type=forking
ExecStart=/usr/local/redis/bin/redis-server /home/redis/redis6379.conf
ExecReload=/usr/local/redis/bin/redis-server -s reload
ExecStop=/usr/local/redis/bin/redis-server -s stop
PrivateTmp=true

User=redis
Group=redis

[Install]
WantedBy=multi-user.target
```

命令：`vim /lib/systemd/system/redis_6380.service`  
添加：

```
[Unit]
Description=Redis persistent key-value database
After=network.target
After=network-online.target
Wants=network-online.target

[Service]
Type=forking
ExecStart=/usr/local/redis/bin/redis-server /home/redis/redis6380.conf
ExecReload=/usr/local/redis/bin/redis-server -s reload
ExecStop=/usr/local/redis/bin/redis-server -s stop
PrivateTmp=true

User=redis
Group=redis

[Install]
WantedBy=multi-user.target
```

注意以上按自己的实际路径添加

### 第二步，重启服务

依次执行以下命令

```
systemctl enable redis     # 设置redis开机自启动
ps -ef |grep redis
kill -9 pid
systemctl start redis      # 启动redis服务
systemctl status redis     # 查看redis服务状态
```

参考命令：  
systemctl stop redis # 停止redis服务  
systemctl restart redis # 重启redis服务  
systemctl daemon-reload # 重启所有服务

### 第三步：验证

命令：`reboot`

### 方法二：

### 第一步，添加rc.local文件内容

命令：`vim /etc/rc.d/rc.local`  
在结尾添加：

```
/usr/local/redis/bin/redis-server   /home/redis/redis6379.conf &
/usr/local/redis/bin/redis-server   /home/redis/redis6380.conf &
```

### 第二步：添加执行权限：`chmod +x /etc/rc.d/rc.local`

### 第三步：验证：`reboot`

### 二、nacos集群配置开机自启

### 第一步：各节点服务器创建/lib/systemd/system/nacos.service文件

命令：`vim /lib/systemd/system/nacos.service`  
添加：

```
[Unit]
Description=nacos
After=network.target

[Service]
# java安装位置
Environment="JAVA_HOME=/usr/local/jdk1.8.0_341"
Type=forking
ExecStart=/usr/local/nacos/bin/startup.sh
ExecReload=/usr/local/nacos/bin/shutdown.sh
ExecStop=/usr/local/nacos/bin/shutdown.sh
PrivateTmp=true

[Install]
WantedBy=multi-user.target

```

### 第二步，重启服务

依次执行以下命令

```
cd /usr/local/nacos/bin/ && ./shutdown.sh   停nacos
systemctl enable nacos     # 设置nacos开机自启动
systemctl start nacos      # 启动nacos服务
systemctl status nacos     # 查看nacos服务状态
```

参考命令：

```
systemctl stop nacos      # 停止nacos服务
systemctl restart nacos    # 重启nacos服务
systemctl daemon-reload   # 重启所有服务
```

### 三、nginx集群配置开机自启

各节点服务器配置nginx开机启动

```
sudo vim /etc/rc.d/rc.local
添加执行语句/usr/bin/nginx
退出保存
开机启动文件授权
sudo chmod +x /etc/rc.d/rc.local
```

### 四、keepalived多节点配置开机自启

```
systemctl status keepalived    检查服务的当前状态
systemctl enable keepalived    设置开机自启
systemctl is-enabled keepalived 验证服务是否已设置为开机自启
```

`systemctl is-enabled keepalived 并得到 enabled 的结果意味着 keepalived 服务已经被配置为在系统启动时自动启动`  
参考命令：

```
启动：systemctl start keepalived
停止：systemctl stop keepalived
重启：systemctl  restart keepalived
```

### 五、mysql配置开机自启

`systemctl enable keepalived 设置开机自启`  
参考命令：

```
启动：systemctl start keepalived
停止：systemctl stop keepalived
重启：systemctl  restart keepalived
systemctl status keepalived    检查服务的当前状态
systemctl is-enabled keepalived 验证服务是否已设置为开机自启
```
