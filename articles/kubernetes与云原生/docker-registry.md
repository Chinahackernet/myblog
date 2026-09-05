1、官网拉取镜像

  

```shell
# docker pull registry
```

  

  

2、运行容器

  

```shell
# docker run -itd --name my_registry -v /root/dockerfile/app/registry:/var/lib/registry -p 5000:5000 --restart=always registry:latest
```

  

  

3、测试镜像仓库

  

```shell
[root@ecs-5704-0004 registry]# curl 127.0.0.1:5000/v2/_catalog
{"repositories":[]}
```

  

  

  

4、在client端安装docker，配置daemon.json

  

```shell
{
  "registry-mirrors": ["https://5uuoznyf.mirror.aliyuncs.com"],
  "insecure-registries": [ "172.16.0.251:5000"]
}
```

  

  

  

5、下载一个镜像，打标签，上传

  

```shell
# docker pull busybox
# docker tag docker.io/busybox:latest 172.16.0.251:5000/busybox:v1
# docker push 172.16.0.251:5000/busybox:v1
```

  

  

  

6、在服务端查看

  

```shell
# curl 127.0.0.1:50000/v2/_catalog
{"repositories":["busybox"]}
```