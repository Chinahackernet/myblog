---
title: Docker 实战：搭建本地 Registry 私有镜像仓库及批量导入脚本
---

**前言：在我之前的博客中，我分享了 Harbor 仓库搭建的详细操作步骤。然而，在实际的生产环境中，并非每个 Docker 环境都需要部署一个规模庞大的 Harbor 仓库。有时，一个轻量级的本地 Registry 私有镜像仓库会更为便捷。本文将介绍如何搭建一个本地 Registry 私有镜像仓库，并提供一个自动化脚本，用于从其他环境批量 “save” 众多镜像包后，一键自动导入到本地 Registry 私有镜像仓库。**

### 第一步：上传 registry 的镜像到 Docker服务器上

### 第二步：创建本地镜像仓库存储卷

命令：`mkdir -p /data/registry`  
命令：`docker load -i registry-2.7.1.tar`

### 第三步：运行 registry 服务

命令：`docker run -d --name registry -p 5000:5000 -v /data/registry:/var/lib/registry --restart=always registry.szlanyou.com/lke/registry:2.7.1`  

### 第四步：修改 docker 配置文件，增加以下配置

这个命令的配置在各docker节点都需要做  
命令：`vim /etc/docker/daemon.json`  
添加：

```
   {
     "insecure-registries": ["<ip>:5000"]
   }
```

参考详细信息：

```
{
  "log-opts": {
    "max-size": "5m",
    "max-file": "3"
  },
  "registry-mirrors": [
    "https://docker.mirrors.ustc.edu.cn",
    "http://hub-mirror.c.163.com"
  ],
  "exec-opts": [
    "native.cgroupdriver=systemd"
  ],
  "insecure-registries": ["ip:5000"]
}
```

### 第五步：重启 docker 服务让配置生效

这两个命令各个节点都需要执行

```
  systemctl daemon-reload
  systemctl restart docker
```

### 第六步：上传本地镜像到Docker服务器上，并执行以下命令，生成imagelist.txt文件

命令：`docker images | grep -v REPOSITORY | awk '{OFS=":";print $1,$2}' > imagelist.txt`

### 第七步：执行image_push.sh自动化脚本将镜像服务批量上传到本地仓库

```
#!/bin/bash

# 设置新镜像仓库的域名和旧域名
new_domain="<ip>:5000"
old_domain="<abc.dfmc.com.cn>"

# 读取imagelist.txt文件中的每一行
while IFS= read -r line; do
    # 检查镜像是否存在
    if [[ $(docker images -q "$line") ]]; then
        # 替换旧域名
        new_image=$(echo "$line" | sed "s|$old_domain|$new_domain|")
        
        # 打印信息，确认哪些镜像将被打包
        echo "Retagging $line -> $new_image"
        
        # 重新标记镜像
        docker tag "$line" "$new_image"
        
        # 推送镜像到新的仓库
        echo "Pushing $new_image"
        docker push "$new_image"
    else
        echo "Image not found: $line"
    fi
done < imagelist.txt
```

**注意：以上替换为具体仓库所在服务器ip，<abc.dfmc.com.cn>替换为旧镜像地址域名**  
上保存后执行 `sh image_push.sh` 命令，等待镜像上传到本地仓库后即可  
