---
title: 容器运维必备-Docker 常用命令
---

**前言：在 Kubernetes 的日常运维中，虽然我们主要依赖 kubectl 命令来管理容器和集群，但有时候，Docker 的一些命令因其直观和便捷性，能够为我们提供极大的帮助。以下是一些 Docker 的常用命令，它们可以在 Kubernetes 环境中作为辅助工具使用，以提高我们的工作效率和操作的灵活性**

**以下是 Docker 常用命令的详细介绍：**

### 一、版本与信息查询

1. `docker --version`：查看 Docker 版本。
2. `docker info`：查看 Docker 信息。

### 二、镜像相关命令

1. `docker images`：列出本地所有的镜像。
2. `docker search <image>`：搜索 Docker Hub 上的镜像。
3. `docker pull <image>`：从 Docker 镜像仓库拉取指定的镜像。

### 三、容器相关命令

1. `docker run [OPTIONS] IMAGE [COMMAND] [ARG...]`：运行容器，例如`docker run -d -p 4000:80 --name my-nginx nginx`会创建一个名为 my-nginx 的容器，映射容器的 80 端口到宿主机的 4000 端口，并在后台运行。
2. `docker ps`：列出正在运行的容器。
3. `docker ps -a`：列出所有容器，包括已停止的容器。
4. `docker stop <container>`：停止一个正在运行的容器。
5. `docker start <container>`：启动一个已停止的容器。
6. `docker restart <container>`：重启一个容器。
7. `docker rm <container>`：删除一个容器。
8. `docker container prune`：删除所有停止的容器。

### 四、容器操作命令

1. `docker exec -it <container> /bin/bash`：进入正在运行的容器。
2. `docker logs <container>`：查看容器的日志输出。

### 五、镜像构建与推送

1. `docker build -t <image>:<tag>.`：构建镜像，这里的`.`表示 Dockerfile 位于当前目录。
2. `docker push <image>`：推送镜像到 Docker Hub。

### 六、其他命令

1. `docker stats`：查看 Docker 容器的统计信息。
2. `docker stats <container>`：查看特定容器的统计信息。
3. `docker inspect <container>`：查看 Docker 容器的资源使用情况和资源限制等详细信息。
4. `docker system prune`：清理未使用的镜像、容器、卷和网络。
5. `docker tag [OPTIONS] IMAGE [REGISTRY_HOST[:REGISTRY_PORT]/][NAMESPACE/]NAME[:TAG]`：给一个Docker镜像打一个新的标签。  
   命令的详细格式和组成部分：

- `docker tag`：这是Docker命令行工具中用于打标签的命令。
- `[OPTIONS]`：这是可选参数，可以用来设置一些特定的选项，比如 `--force` 强制覆盖现有的标签。
- `IMAGE`：这是原始镜像的名称，包括仓库地址、镜像名称和标签。
- `[REGISTRY_HOST[:REGISTRY_PORT]/]`：这是目标仓库的地址和端口，如果仓库是Docker Hub，则可以省略。
- `[NAMESPACE/]`：这是命名空间，如果镜像在特定的命名空间下，需要指定。
- `NAME`：这是镜像的名称。
- `[:TAG]`：这是镜像的标签，可以是版本号或者其他标识符。  
  范例：  
  `docker tag 原镜像地址/项目路径/zookeeper:3.7.1 新镜像地址/项目路径/zookeeper:3.7.1`
