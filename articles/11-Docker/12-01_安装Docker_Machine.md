# 安装Docker Machine

> 分类：Docker / 第12章：Docker Machine
> 原文：https://www.cuiliangblog.cn/detail/section/29427720
> 来源：崔亮的博客

---

# 一、简介
1. Docker      Machine是Docker官方三剑客项目之一，负责使用Docker容器的第一步：在多种平台上快速安装和维护Docker运行环境。它支持多种平台，让用户可以在很短时间内在本地或云环境中搭建一套Docker主机集群。
2. 基本功能包括：
+ 在指定节点或平台上安装Docker引擎，配置其为可使用的Docker环境；
+ 集中管理（包括启动、查看等）所安装的Docker环境。
3. Machine连接不同类型的操作平台是通过对应驱动来实现的，目前已经集成了包括AWS、IBM、Google，以及OpenStack、VirtualBox、vSphere等多种云平台的支持。

# 二、安装Machine
1. 环境准备

| IP | 主机名 | 角色 |
| --- | --- | --- |
| 192.168.10.220 | admin                            | Machine管理节点 |
| 192.168.10.221 | host1 | host主机1 |
| 192.168.10.222 | host2 | host主机2 |


+ 使用免密登录

[root@admin ~]# ssh-keygen

[root@admin ~]# ssh-copy-id 192.168.10.221

[root@admin ~]# ssh-copy-id 192.168.10.222

2. 安装docker-machine
+ 官网文档

[https://docs.docker.com/machine/install-machine/](https://docs.docker.com/machine/install-machine/)

+ admin主机安装docker

[root@admin ~]# base=https://github.com/docker/machine/releases/download/v0.16.0 && curl -L $base/docker-machine-$(uname -s)-$(uname -m) >/tmp/docker-machine && mv /tmp/docker-machine /usr/local/bin/docker-machine && chmod +x /usr/local/bin/docker-machine

+ 验证是否成功安装

[root@admin ~]# docker-machine version

4. 安装 bash completion      script，这样在 bash 能够通过 tab 键补全 docker-mahine 的子命令和参数
+ 参考链接

[https://github.com/docker/machine/tree/master/contrib/completion/bash](https://github.com/docker/machine/tree/master/contrib/completion/bash)

[root@admin ~]# base=https://raw.githubusercontent.com/docker/machine/v0.16.0

[root@admin ~]# for i in docker-machine-prompt.bash docker-machine-wrapper.bash docker-machine.bash

do

wget "$base/contrib/completion/bash/${i}" -P /etc/bash_completion.d

done

5. 修改环境变量

[root@localhost ~]# vim ~/.bashrc

+ 末尾添加如下内容

PS1='[\u@\h \W$(__docker_machine_ps1)]\$'

6. 加载环境变量配置

[root@localhost ~]# source /etc/bash_completion.d/docker-machine-prompt.bash

# 三、创建Machine（在 host 上安装和部署docker）
1. 验证确保admin主机能免密登录host1主机
2. 为host1主机安装docker

[root@admin ~]#docker-machine create --driver generic --generic-ip-address=192.168.10.221 host1

+ 其他系统安装参考[https://docs.docker.com/machine/drivers/](https://docs.docker.com/machine/drivers/)
+ --generic-ip-address 指定目标系统的 IP，并命名为 host1

![](assets/11-Docker/ed82b22085b102d601dd.png)

① 通过 ssh 登录到远程主机。

② 安装 docker。

③ 拷贝证书。

④ 配置 docker daemon。

⑤ 启动 docker。

+ 如果安装超时，执行命令重新安装

[root@admin ~]# docker-machine rm host1

3. 执行 docker-machine ls查看管理主机列表

![](assets/11-Docker/26e1aa23f778ecb89a26.png)

+ 登录到 host1 查看 docker daemon 的具体配置。

![](assets/11-Docker/01300d9ec37fc704589d.png)

-H tcp://0.0.0.0:2376 使 docker daemon 接受远程连接。

--tls* 对远程连接启用安全认证和加密。

+ 主机名自动修改为host1

![](assets/11-Docker/3727c6edc16bb21f5a74.png)


