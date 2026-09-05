# 修改IP和DNS

> 分类：Linux / 第19章：Ubuntu
> 原文：https://www.cuiliangblog.cn/detail/section/189060944
> 来源：崔亮的博客

---

# 修改IP
## 修改配置文件
```yaml
root@ubuntu20:~# vim /etc/netplan/50-cloud-init.yaml
network:
    ethernets:
        ens33:
          dhcp4: false # 动态ip
          addresses: [192.168.10.33/24]
          gateway4: 192.168.10.2
    version: 2
```

## 应用配置
```bash
netplan apply
```

# 修改DNS
## 修改配置
```bash

root@ubuntu20:~# mv /etc/resolv.conf /etc/resolv.conf.bak
root@ubuntu20:~# ln -s /run/systemd/resolve/resolv.conf /etc/
root@ubuntu20:~# vim /etc/systemd/resolved.conf
DNS=8.8.8.8 114.114.114.114
root@ubuntu20:~# systemctl restart systemd-resolved
root@ubuntu20:~# systemctl enable systemd-resolved
```

## 查看验证
```bash
root@ubuntu20:~# systemd-resolve --status | grep 'DNS Servers' -A2
```


