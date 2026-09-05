# RadosGW部署

> 分类：Ceph / 第7章：Ceph对象存储
> 原文：https://www.cuiliangblog.cn/detail/section/198934029
> 来源：崔亮的博客

---

# 部署RadosGW服务
## 创建 radosgw服务
```yaml
root@ceph-1:~# ceph orch apply rgw default zone1 --placement="count:2"
Scheduled rgw.default update...
```

+ `<realm-name>`：RadosGW 的域名，可以自定义，例如 `default`.
+ `<zone-name>`：RadosGW 的区域名，可以自定义，例如 `zone1`.
+ `--placement="count:1"`：表示 RadosGW 实例的数量。如果你想在多个节点上部署，可以增加 `count` 的值，或者指定节点列表

## 验证radosgw服务状态
```bash
root@ceph-1:~# ceph orch ps | grep rgw
rgw.default.ceph-2.xtsouy  ceph-2  *:80              running (4m)      4m ago   4m    19.5M        -  18.2.4   2bc0b0f4375d  b0b0ef40933c  
rgw.default.ceph-3.dolbwl  ceph-3  *:80              running (4m)      4m ago   4m    17.7M        -  18.2.4   2bc0b0f4375d  cdb00e5ddcf8
root@ceph-1:~# ceph -s
  cluster:
    id:     402d9800-afef-11ef-92d7-9fbbd69ceccd
    health: HEALTH_OK
 
  services:
    mon: 3 daemons, quorum ceph-1,ceph-3,ceph-2 (age 39m)
    mgr: ceph-1.cuuabg(active, since 39m), standbys: ceph-3.uhtqme
    osd: 3 osds: 3 up (since 39m), 3 in (since 13d)
    rgw: 2 daemons active (2 hosts, 1 zones) # 两台主机，一个区域
 
  data:
    pools:   7 pools, 193 pgs
    objects: 245 objects, 15 MiB
    usage:   943 MiB used, 149 GiB / 150 GiB avail
    pgs:     193 active+clean
 
  io:
    client:   140 KiB/s rd, 280 op/s rd, 0 op/s wr
```

## 验证 radosgw 存储池资源
查看存储池列表

```bash
root@ceph-1:~# ceph osd pool ls
.mgr
mypool
rbd-data
.rgw.root
default.rgw.log
default.rgw.control
default.rgw.meta
```

查看默认radosgw存储池信息

```bash
root@ceph-1:~# radosgw-admin zone get --rgw-zone=default --rgw-zonegroup=default
{
    "id": "6e4a2c03-6ab3-4bbc-b556-c1409fcf6870", # 区域的唯一标识符
    "name": "default", # 默认区域的名称
    "domain_root": "default.rgw.meta:root", # 区域的根域名
    "control_pool": "default.rgw.control", # 系统控制池，在有数据更新是，通知其他RGW更新缓存
    "gc_pool": "default.rgw.log:gc", # 用于垃圾回收的存储池
    "lc_pool": "default.rgw.log:lc", # 用于存储日志的存储池
    "log_pool": "default.rgw.log", # 存储日志信息，用于记录各种log信息
    "intent_log_pool": "default.rgw.log:intent",
    "usage_log_pool": "default.rgw.log:usage",
    "roles_pool": "default.rgw.meta:roles", # default.rgw.meta:元数据存储池，通过不同的名称空间分别存储不同的rados对象
    "reshard_pool": "default.rgw.log:reshard",
    "user_keys_pool": "default.rgw.meta:users.keys", # 用户的密钥名称空间users.keys
    "user_email_pool": "default.rgw.meta:users.email", # 用户的email名称空间users.email
    "user_swift_pool": "default.rgw.meta:users.swift", # 用户的subuser的名称空间users.swift
    "user_uid_pool": "default.rgw.meta:users.uid", # 用户UID
    "otp_pool": "default.rgw.otp",
    "system_key": {
        "access_key": "",
        "secret_key": ""
    },
    "placement_pools": [
        {
            "key": "default-placement",
            "val": {
                "index_pool": "default.rgw.buckets.index", # 存放bucket到object的索引信息
                "storage_classes": {
                    "STANDARD": {
                        "data_pool": "default.rgw.buckets.data" # 存放对象的数据
                    }
                },
                "data_extra_pool": "default.rgw.buckets.non-ec", # 数据的额外信息存储池
                "index_type": 0,
                "inline_data": true
            }
        }
    ],
    "realm_id": "",
    "notif_pool": "default.rgw.log:notif"
} 
 

```

‍查看默认配置信息

```bash
# 默认crush规则是副本池即一主两备的三副本机制
root@ceph-1:~# ceph osd pool get default.rgw.meta crush_rule
crush_rule: replicated_rule
 
# 默认副本数为3
root@ceph-1:~# ceph osd pool get default.rgw.meta size
size: 3
 
# 默认pgp数量为32
root@ceph-1:~# ceph osd pool get default.rgw.meta pgp_num
pgp_num: 32
 
# 默认pg数量为32
root@ceph-1:~# ceph osd pool get default.rgw.meta pg_num
pg_num: 32
```

## 访问radosgw服务
访问radosgw服务所在的节点 IP+默认 80 端口既可。

![](assets/12-Ceph/6b0643296e42f1a9dedf.png)

# RadosGW https
## 生成自签证书
```bash
root@ceph-1:~# mkdir -p /etc/ceph/rgw/cert
root@ceph-1:~# openssl req -new -x509 -days 3650 -nodes -out /etc/ceph/rgw/cert/rgw-cert.pem -keyout /etc/ceph/rgw/cert/rgw-key.pem -subj "/CN=ceph-rgw.local.com"
Generating a RSA private key
....................+++++
.....................................................+++++
writing new private key to '/etc/ceph/rgw/cert/rgw-key.pem'
-----
root@ceph-1:~# tree /etc/ceph/rgw/cert/
/etc/ceph/rgw/cert/
├── rgw-cert.pem
└── rgw-key.pem

0 directories, 2 files
```

## 创建配置文件
将公钥和私钥内容添加到配置文件中

```yaml
service_type: rgw
service_id: default
placement:
  hosts:
    - ceph-1
    - ceph-2
spec:
  rgw_frontend_ssl_certificate: |
    [示例私钥已隐藏，请在部署环境注入临时密钥]
    -----BEGIN CERTIFICATE-----
    MIIDGzCCAgOgAwIBAgIUN4U/CuGb78PO+vzw370d0hz1aBUwDQYJKoZIhvcNAQEL
    BQAwHTEbMBkGA1UEAwwSY2VwaC1yZ3cubG9jYWwuY29tMB4XDTI0MTIxNzA3MDAz
    M1oXDTM0MTIxNTA3MDAzM1owHTEbMBkGA1UEAwwSY2VwaC1yZ3cubG9jYWwuY29t
    MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAvBGLXwiLcyrKMs4fQHom
    DLiQHmxWgZBKRdNAGBr574sDgVMfH+Ao0rZ1wFLTau5xa4U5XWotQfqXS3maJs4H
    xUzuqDdLc+igVxAyRvsqDKq3HtEZRiR+ouTC9c51plrFcp1Nca6hgtg9SYyBEbKM
    sftbyLmB0fBAaSn+5XS2A6me/WwBBI9Wss8zziEuF94PQAFqNxDAi0cwlGWNRiH6
    l7j4tsTCSmH6L1zNWoFNe/KgqjZRha47QBzkmKZjLLBjOt/CYfBMWicQVOFLynMX
    OeBH8qWp3I+mX34BMdOwOrVRZOM0Kxaftr22E5HLN7ReSq0QbzdRMQ6rG36HwkyP
    uwIDAQABo1MwUTAdBgNVHQ4EFgQUUxgqlKlO+Pmvr+1QYv0bzf8BY4wwHwYDVR0j
    BBgwFoAUUxgqlKlO+Pmvr+1QYv0bzf8BY4wwDwYDVR0TAQH/BAUwAwEB/zANBgkq
    hkiG9w0BAQsFAAOCAQEAJf0D5Wy3BS9fUWqqgxLgvUSuK9EzfVHyyBeAzW+AYzus
    Iqv3KscFnJFkl8U7tfy0E/03z6LzA91Ok/6IvlsQA9w5agJF++nqNSatVbEin4Fr
    h4hu1HFMDFLkaQeGLcaHBgmMWOgK0DonitYEJZMbHBBYY5W7IzoZfduaOsJaXVoG
    rYCsoYlH2JHwIu3hXelzCLPfZhdBpvcgWIsQCnVy2n4y2WLRif0R+zPPZ4ZIz0qT
    en7C+vmvtP9SrpI9eIPUC3VAcTKxftvzyOHqBIB0+BzDa8lk0b4MMmaJkzt7Uq1k
    EJmfIFBAfER1wHb2vVPKd5/zi3h55T3D366M8yLx9Q==
    -----END CERTIFICATE-----
  ssl: true
  rgw_frontend_port: 443
```

## 更新 RGW 配置
```bash
root@ceph-1:/etc/ceph/rgw# ceph orch apply -i rgw.yaml 
Scheduled rgw.default update...
root@ceph-1:/etc/ceph/rgw# ceph orch ps | grep rgw
rgw.default.ceph-1.rengxb  ceph-1  *:443             running (33s)    28s ago  33s    87.5M        -  18.2.4   2bc0b0f4375d  6aabe6cfcd96  
rgw.default.ceph-2.mtmznz  ceph-2  *:443             running (34s)    29s ago  34s    87.6M        -  18.2.4   2bc0b0f4375d  1c4804231de5
```

## ‍验证访问
在本地host添加域名解析

```plain
echo "192.168.10.90 ceph-rgw.local.com" >> /etc/hosts
```

+ 浏览器访问

![](assets/12-Ceph/8be5d563f27f8e64d4a8.png)

证书信息

![](assets/12-Ceph/878f4b0d50f176a95873.png)

# RadosGW 高可用
## 高可用方案
![](assets/12-Ceph/2f30fec7aeee05907bbb.png)

## 自定义https 端口与副本数
修改默认端口并指定运行在 ceph1 和 ceph2 节点

```yaml
root@ceph-1:/etc/ceph/rgw# cat > rgw.yaml << EOF
service_type: rgw
service_id: default
placement:
  hosts:
    - ceph-1
    - ceph-2
    - ceph-3
spec:
  rgw_frontend_ssl_certificate: |
    [示例私钥已隐藏，请在部署环境注入临时密钥]
    -----BEGIN CERTIFICATE-----
    MIIDGzCCAgOgAwIBAgIUN4U/CuGb78PO+vzw370d0hz1aBUwDQYJKoZIhvcNAQEL
    BQAwHTEbMBkGA1UEAwwSY2VwaC1yZ3cubG9jYWwuY29tMB4XDTI0MTIxNzA3MDAz
    M1oXDTM0MTIxNTA3MDAzM1owHTEbMBkGA1UEAwwSY2VwaC1yZ3cubG9jYWwuY29t
    MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAvBGLXwiLcyrKMs4fQHom
    DLiQHmxWgZBKRdNAGBr574sDgVMfH+Ao0rZ1wFLTau5xa4U5XWotQfqXS3maJs4H
    xUzuqDdLc+igVxAyRvsqDKq3HtEZRiR+ouTC9c51plrFcp1Nca6hgtg9SYyBEbKM
    sftbyLmB0fBAaSn+5XS2A6me/WwBBI9Wss8zziEuF94PQAFqNxDAi0cwlGWNRiH6
    l7j4tsTCSmH6L1zNWoFNe/KgqjZRha47QBzkmKZjLLBjOt/CYfBMWicQVOFLynMX
    OeBH8qWp3I+mX34BMdOwOrVRZOM0Kxaftr22E5HLN7ReSq0QbzdRMQ6rG36HwkyP
    uwIDAQABo1MwUTAdBgNVHQ4EFgQUUxgqlKlO+Pmvr+1QYv0bzf8BY4wwHwYDVR0j
    BBgwFoAUUxgqlKlO+Pmvr+1QYv0bzf8BY4wwDwYDVR0TAQH/BAUwAwEB/zANBgkq
    hkiG9w0BAQsFAAOCAQEAJf0D5Wy3BS9fUWqqgxLgvUSuK9EzfVHyyBeAzW+AYzus
    Iqv3KscFnJFkl8U7tfy0E/03z6LzA91Ok/6IvlsQA9w5agJF++nqNSatVbEin4Fr
    h4hu1HFMDFLkaQeGLcaHBgmMWOgK0DonitYEJZMbHBBYY5W7IzoZfduaOsJaXVoG
    rYCsoYlH2JHwIu3hXelzCLPfZhdBpvcgWIsQCnVy2n4y2WLRif0R+zPPZ4ZIz0qT
    en7C+vmvtP9SrpI9eIPUC3VAcTKxftvzyOHqBIB0+BzDa8lk0b4MMmaJkzt7Uq1k
    EJmfIFBAfER1wHb2vVPKd5/zi3h55T3D366M8yLx9Q==
    -----END CERTIFICATE-----
  ssl: true
  rgw_frontend_port: 8443
EOF
root@ceph-1:/etc/ceph/rgw# ceph orch apply -i rgw.yaml 
Scheduled rgw.default update...
root@ceph-1:/etc/ceph/rgw# ceph orch ps | grep rgw
rgw.default.ceph-1.rsdmtv  ceph-1  *:9443            running (29s)     23s ago  29s    87.6M        -  18.2.4   2bc0b0f4375d  c4d059ef4eeb  
rgw.default.ceph-2.hyhuzv  ceph-2  *:9443            running (29s)     13s ago  29s    88.8M        -  18.2.4   2bc0b0f4375d  ff7f86383ba1  
rgw.default.ceph-3.wnnkpd  ceph-3  *:9443            running (30s)     24s ago  30s    88.4M        -  18.2.4   2bc0b0f4375d  3d198beac816 
```

## <font style="color:rgb(48, 49, 51);">HaProxy部署</font>
<font style="color:rgb(106, 115, 125);">以下操作在 ceph1、2、3 机器执行</font>

<font style="color:rgb(48, 49, 51);">安装haproxy</font>

```bash
root@ceph-1:~# apt install haproxy -y
```

<font style="color:rgb(48, 49, 51);">修改配置文件</font>

```bash
root@ceph-1:~# cat > /etc/haproxy/haproxy.cfg << EOF
# 开启管理员监控页面
listen admin_stats
    bind *:8888    # 监听的IP和端口号
    mode http      # 开启HTTP模式，stats功能需要
    stats enable
    stats refresh 30s   # 统计页面自动刷新时间
    stats uri /admin    # 访问的uri   ip:8888/admin
    stats realm haproxy
    stats auth admin:admin  # 认证用户名和密码
    stats hide-version   # 隐藏HAProxy的版本号
    stats admin if TRUE   # 管理界面，如果认证成功了，可通过webui管理节点
    timeout client 5s    # 客户端超时
    timeout connect 3s    # 连接超时
    timeout server 5s    # 后端服务器超时
# 配置前端监听
frontend main
    # 监听地址
    bind *:443
    # 匹配后端服务
    default_backend rgw
    # 客户端超时
    timeout client 5s
# 配置后端代理
backend rgw
    # 连接超时
    timeout connect 3s
    # 后端服务器超时
    timeout server 5s
    server  rgw1 192.168.10.91:9443 check
    server  rgw2 192.168.10.92:9443 check
    server  rgw3 192.168.10.93:9443 check
EOF
```

<font style="color:rgb(48, 49, 51);">启动服务</font>

```bash
root@ceph-1:~# systemctl start haproxy
root@ceph-1:~# systemctl enable haproxy
Synchronizing state of haproxy.service with SysV service script with /lib/systemd/systemd-sysv-install.
Executing: /lib/systemd/systemd-sysv-install enable haproxy
root@ceph-1:~# ss -tunlp | grep haproxy
tcp     LISTEN   0        4096             0.0.0.0:443            0.0.0.0:*      users:(("haproxy",pid=61839,fd=7))                                             
tcp     LISTEN   0        4096             0.0.0.0:8888           0.0.0.0:*      users:(("haproxy",pid=61839,fd=6))
```

<font style="color:rgb(48, 49, 51);">确认无误后 ceph-2 和 ceph-3 服务器同样的步骤配置。</font>

![](assets/12-Ceph/0346d1f7b00cd462b896.png)

## <font style="color:rgb(48, 49, 51);">KeepAlived部署</font>
<font style="color:rgb(106, 115, 125);">以下操作在</font><font style="color:rgb(48, 49, 51);">ceph-</font><font style="color:rgb(106, 115, 125);">1、2、3 机器执行，设备网卡名称为ens33，VIP为192.168.10.90。</font>

<font style="color:rgb(48, 49, 51);">安装软件包</font>

```plain
root@ceph-1:~# apt install keepalived -y
```

<font style="color:rgb(48, 49, 51);">新增haproxy检测脚本</font>

```bash
root@ceph-1:~# vim /etc/keepalived/check_port.sh
#!/bin/bash
# 检查指定端口是否正常
PORT=443
if netstat -tuln | grep -q ":${PORT}\b"; then
    echo "${PORT}端口正常: 服务正在监听"
    exit 0
else
    echo "${PORT}端口异常: 未发现监听服务"
    exit 1
fi
root@ceph-1:~# chmod u+x /etc/keepalived/check_port.sh
```

<font style="color:rgb(48, 49, 51);">修改配置文件</font>

```bash
root@ceph-1:/etc/keepalived# cat > /etc/keepalived/keepalived.conf << EOF
global_defs {
  script_user root
  enable_script_security
} 

vrrp_script chk_port {
    script "/etc/keepalived/check_port.sh"   # 自定义检测脚本路径
    interval 1        # 检测间隔，单位为秒
    weight -2         # 如果检测失败，权重降低2
}

vrrp_instance VI_1 {
    state MASTER					# 设置为master节点
    interface ens33    	# 物理网卡名称
    virtual_router_id 51 	# 虚拟路由ID，主备保持一致
    priority 100					# 优先级，主大于备
    advert_int 1					# 关播间隔
    authentication {			# 认证信息，主备一致
        auth_type PASS
        auth_pass 1111
    }
    virtual_ipaddress {
        192.168.10.90/24	# 虚拟IP信息
    }
    track_script {
        chk_port     # 引用上面定义的脚本
    }
}
EOF
```

<font style="color:rgb(48, 49, 51);">启动服务</font>

```bash
root@ceph-1:/etc/keepalived# systemctl start keepalived.service
root@ceph-1:/etc/keepalived# systemctl enable keepalived.service
Synchronizing state of keepalived.service with SysV service script with /lib/systemd/systemd-sysv-install.
Executing: /lib/systemd/systemd-sysv-install enable keepalived
root@ceph-1:/etc/keepalived# ip a | grep 192.168.10.90
    inet 192.168.10.90/24 scope global secondary ens33
```

> <font style="color:rgb(48, 49, 51);">此时可以看到vip 192.168.10.90绑定到了 ceph-1服务器ens33 网卡上。</font>
>

<font style="color:rgb(48, 49, 51);">同样的操作配置 ceph-2服务器，配置文件如下：</font>

```plain
global_defs {
  script_user root
  enable_script_security
}

vrrp_script chk_port {
    script "/etc/keepalived/check.sh"  
    interval 2      
    weight -2        
}

vrrp_instance VI_1 {
    state BACKUP # 主备类型
    interface ens33 
    virtual_router_id 51
    priority 99 # 优先级低于主
    advert_int 1
    authentication {
        auth_type PASS
        auth_pass 1111
    }
    virtual_ipaddress {
        192.168.10.90/24
    }
    track_script {
        chk_port     # 引用上面定义的脚本
    }
}
```

ceph-3 配置如下

```bash
global_defs {
  script_user root
  enable_script_security
}

vrrp_script chk_port {
    script "/etc/keepalived/check.sh"  
    interval 2      
    weight -2        
}

vrrp_instance VI_1 {
    state BACKUP # 主备类型
    interface ens33 
    virtual_router_id 51
    priority 98 # 优先级低于主
    advert_int 1
    authentication {
        auth_type PASS
        auth_pass 1111
    }
    virtual_ipaddress {
        192.168.10.90/24
    }
    track_script {
        chk_port     # 引用上面定义的脚本
    }
}
```

## <font style="color:rgb(48, 49, 51);">高可用测试</font>
<font style="color:rgb(48, 49, 51);">接下来停止 ceph-1服务，模拟异常故障，查看 ceph-2服务器，vip已经成功飘移过来</font>

```bash
root@ceph-1:~# systemctl stop haproxy.service 
root@ceph-2:~# ip a | grep 192.168.10.90
    inet 192.168.10.90/24 scope global secondary ens33
```

<font style="color:rgb(48, 49, 51);">访问vip的 443 端口，可正常提供服务</font>

![](assets/12-Ceph/83cd1ec06dbeb51f592d.png)


