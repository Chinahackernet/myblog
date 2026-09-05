### 阿里云镜像加速：

[https://cr.console.aliyun.com](https://cr.console.aliyun.com/)

  

vim /etc/docker/daemon.json

```python
{
  "registry-mirrors": ["https://5uuoznyf.mirror.aliyuncs.com"]
}
```

  

systemctl daemon-reload

systemctl restart docker

  

```shell
curl -sSL https://get.daocloud.io/daotools/set_mirror.sh | sh -s http://f1361db2.m.daocloud.io

systemctl restart docker
```