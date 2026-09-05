# registry私有仓库

> 分类：Docker / 第4章：仓库
> 原文：https://www.cuiliangblog.cn/detail/section/26457370
> 来源：崔亮的博客

---

## 1. 部署register私有仓库
+ 服务器规划

| ip | 角色 |
| --- | --- |
| 192.168.217.128 | 本地仓库 |
| 192.168.217.130 | docker客户端 |


+ 使用registry镜像创建私有仓库

`[root@docker ~]# docker run -d -p 5000:5000 registry:2` 

+ 该命令自动下载官方提供的registry镜像来搭建本地私有仓库，默认情况下创建在容器的/var/lib/registry目录下，可以通过-v来指定路径

`[root@docker ~]# docker run -d -p 5000:5000 -v  /registry:/var/lib/registry registry:2` 

+ 查看仓库运行情况

![](assets/11-Docker/745a35f13f269098d4e7.png)

+ {"repositories":       []} 表示现在仓库中，没有镜像images

## 2. 使用register私有仓库
+ 查看客户端已有的images

![](assets/11-Docker/49a1ca76307b1a35822f.png)

+ 将该镜像修改tag

![](assets/11-Docker/74f88de62fdbfd0414a8.png)

+ 上传标记镜像

![](assets/11-Docker/7672375f3db5233ae8ee.png)

+ 成功会出现上述提示，表示本地的仓库默认使用的是https进行上传，那行是latest是重新上传出现的。
+ 如果你在push镜像的时候出现问题,可能是因为我们启动的registry服务不是安全可信赖的
+ 修改配置文件

vim /etc/docker/daemon.json,

添加下面的内容:   ""insecure-registries":["192.168.217.128:5000"]"， 再重启docker 服务

+ 仓库端查看镜像

![](assets/11-Docker/25bf7cd26dc70d6254c7.png)

![](assets/11-Docker/1eb342e81566a4376b9f.png)

+ 删除客户端镜像，从本地仓库下载镜像

![](assets/11-Docker/3c0b4bca7d967a87493b.png)

## 3. 管理register私有仓库
+ 删除镜像仓库镜像

打开镜像的存储目录，如有-V操作打开挂载目录也可以，删除镜像文件夹

`# docker exec <容器名>  rm -rf /var/lib/registry/docker/registry/v2/repositories/<镜像名>` 

+ 执行垃圾回收操作，**注意2.4版本以上的registry才有此功能**

`# docker exec registry  bin/registry garbage-collect /etc/docker/registry/config.yml` 


