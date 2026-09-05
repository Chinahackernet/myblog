```yaml
yum install epel-release -y
yum install -y jemalloc
wget http://www.rpmfind.net/linux/remi/enterprise/7/remi/x86_64/redis-5.0.9-1.el7.remi.x86_64.rpm
rpm -ivh redis-5.0.9-1.el7.remi.x86_64.rpm
systemctl enable redis
systemctl start redis
```

查询redis版本：[http://www.rpmfind.net/](http://www.rpmfind.net/)