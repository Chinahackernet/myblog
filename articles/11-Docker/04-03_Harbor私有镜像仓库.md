# Harbor私有镜像仓库

> 分类：Docker / 第4章：仓库
> 原文：https://www.cuiliangblog.cn/detail/section/26457268
> 来源：崔亮的博客

---

# 一、Harbor私有镜像仓库
1. 安装docker
2. 安装docker-compose
3. 下载harbor离线安装包

[参考链接](https://github.com/goharbor/harbor/releases)

`[root@harbor ~] wget https://github.com/vmware/harbor/releases/download/v1.8.6/harbor-offline-installer-v1.8.6.tgz`

`[root@harbor ~]# tar -xvf harbor-offline-installer-v1.8.6.tgz` 

4. 修改harbor.yml配置文件

![](assets/11-Docker/05af2daebbc18985e8fe.png)

+ 注释https相关配置

![](assets/11-Docker/995c4c8b424ea178e2d0.png)

5. 运行install.sh脚本

`[root@harbor harbor]# ./install.sh` 

![](assets/11-Docker/53010e5774e8a60a419d.png)

6. 访问Harbor并登陆。

![](assets/11-Docker/4bea73eeec09eb0c5b0b.png)

+ 初始用户名admin
+ 初始密码Harbor12345
7. 创建systemd服务管理脚本

```bash
[Unit]
Description=Harbor
After=docker.service systemd-networkd.service systemd-resolved.service
Requires=docker.service
Documentation=http://github.com/vmware/harbor
 
[Service]
Type=simple
Restart=on-failure
RestartSec=5
ExecStart=/usr/local/bin/docker-compose -f /opt/harbor/docker-compose.yml up
ExecReload=/usr/local/bin/docker-compose -f /opt/harbor/docker-compose.yml restart
ExecStop=/usr/local/bin/docker-compose -f /opt/harbor/docker-compose.yml down
 
[Install]
WantedBy=multi-user.target
```



# 二、docker授权访问harbor仓库
1. docker配置文件私有仓库设置

`[root@master ~]# vim /etc/docker/daemon.json` 

![](assets/11-Docker/7ff40509f9bc1e02f5e9.png)

2. 重启docker

`systemctl daemon-reload` 

`systemctl restart docker` 

3. master节点登陆测试

![](assets/11-Docker/34b7155ed3dc8693a8be.png)

4. 推送镜像测试

![](assets/11-Docker/25fd27482cd2c8f6e122.png)

`[root@master ~]# docker tag hello-world 192.168.10.103/library/hello-world:v1` 

`[root@master ~]# docker push 192.168.10.103/library/hello` 


