## Centos7

```bash
yum install -y yum-utils device-mapper-persistent-data lvm2
yum-config-manager --add-repo https://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo
yum makecache fast
yum install docker-ce -y
systemctl start docker
systemctl enable docker
```

  

配置镜像加速（）

  

```
curl -sSL https://get.daocloud.io/daotools/set_mirror.sh | sh -s http://f1361db2.m.daocloud.io

systemctl restart docker
```

  

安装其他软件：

  

```
yum install unzip wget lrzsz -y
```

  

优化：

  

```
vi daemon.json
{
    "max-concurrent-downloads": 20,
    "log-driver": "json-file",
    "bridge": "none",
    "oom-score-adjust": -1000,
    "debug": false,
    "log-opts": {
        "max-size": "100M",
        "max-file": "10"
    },
    "default-ulimits": {
        "nofile": {
            "Name": "nofile",
            "Hard": 65535,
            "Soft": 65535
        },
        "nproc": {
            "Name": "nproc",
            "Hard": 65535,
            "Soft": 65535
        },
      "core": {
            "Name": "core",
            "Hard": -1,
            "Soft": -1    
      }

    }
}
```

  

## Centos8

```plain
yum-config-manager  --add-repo  https://download.docker.com/linux/centos/docker-ce.repo
dnf install https://download.docker.com/linux/centos/7/x86_64/stable/Packages/containerd.io-1.2.6-3.3.el7.x86_64.rpm
yum install docker-ce docker-ce-cli
```