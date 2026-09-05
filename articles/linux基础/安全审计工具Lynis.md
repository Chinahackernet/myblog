**Lynis**是一款Linux系统的安全审计以及加固工具，能够进行深层次的安全扫描，其目的是检测潜在的时间并对未来的系统加固提供建议。

  

安装

```yaml
cat >> /etc/yum.repos.d/cisofy-lynis.repo <<EOF
[lynis]
name=CISOfy Software - Lynis package
baseurl=https://packages.cisofy.com/community/lynis/rpm/
enabled=1
gpgkey=https://packages.cisofy.com/keys/cisofy-software-rpms-public.key
gpgcheck=1
priority=2
EOF

yum install lynis -y
```

  

使用：

```yaml
lynis -h

# 扫描系统
lynis audit system
```