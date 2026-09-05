1、下载harbor

  

```shell
# --在线安装包
# wget https://storage.googleapis.com/harbor-releases/release-1.7.0/harbor-online-installer-v1.7.1.tgz
# --离线安装包
# wget https://storage.googleapis.com/harbor-releases/release-1.7.0/harbor-offline-installer-v1.7.1.tgz
# tar xf harbor-offline-installer-v1.7.1.tgz
```

  

2、安装docker-compose

  

```shell
# curl -L "https://github.com/docker/compose/releases/download/1.23.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
# chmod +x /usr/local/bin/docker-compose
# --官网安装地址
# https://docs.docker.com/compose/install/
```

  

3、安装harbor

  

```shell
# cd harbor && ./install.sh
```

  

4、登录WEB

  

```shell
# 账户密码
admin Harbor12345
```

  

5、配置client的daemon.json

  

```shell
{
  "registry-mirrors": ["https://5uuoznyf.mirror.aliyuncs.com"],
  "insecure-registries": [ "119.3.203.232"]
}
```

  

  

6、client登录

  

```shell
[root@ecs-5704-0003 docker]# docker login 119.3.203.232
Username: admin
Password:
Login Succeeded
```

  

7、打标签，上传

  

```shell
# docker tag docker.io/busybox:latest 119.3.203.232/joker/busybox:v1
# docker push 119.3.203.232/joker/busybox:v1
```