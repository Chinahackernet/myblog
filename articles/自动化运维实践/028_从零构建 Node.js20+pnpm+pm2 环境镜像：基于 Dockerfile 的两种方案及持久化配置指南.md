---
title: 从零构建 Node.js20+pnpm+pm2 环境镜像：基于 Dockerfile 的两种方案及持久化配置指南
---

**前言：在Node.js项目部署中，`环境一致性`和`服务自动恢复`是运维的核心需求。无论是本地开发还是生产部署，使用Docker封装Node20、pnpm（高效包管理）和pm2（进程守护）环境，能避免“本地能跑、线上崩了”的问题。但实际构建中，常遇到“pnpm命令找不到”“pm2无法自动启动”等问题。  
本文将提供两种Dockerfile方案（在线拉取pnpm和本地文件导入pnpm），并解决“环境变量持久化”“pm2自动启动”等核心问题，最终实现容器启动后自动加载所有工具并运行项目。**

## 一、核心目标与前置说明

### 目标

- 基于Node20（alpine轻量版）构建镜像，集成pnpm和pm2
- 确保pnpm、pm2命令全局可用，环境变量永久生效
- 容器启动时自动用pm2启动项目，且重启容器后进程自动恢复
- 支持项目代码通过挂载方式实时更新（无需重新构建镜像）

### 前置准备

- 服务器已安装Docker（建议20.10+版本）
- 本地有Node项目（以`server.js`为入口示例）
- 若用“本地文件导入pnpm”方案，需准备pnpm可执行文件（可从[pnpm官网](https://pnpm.io/installation)下载）

## 二、方案一：在线拉取pnpm（推荐，无需本地文件）

此方案通过pnpm官方脚本在线安装，无需提前准备pnpm文件，适合网络通畅的环境。

### 1. Dockerfile完整内容（在线安装版）

```
# 基础镜像：Node20 alpine版（轻量，适合生产）
FROM node:20.15.0-alpine

# 替换国内镜像源（加速alpine包安装）
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories && \
    # 安装基础依赖（curl用于下载pnpm，bash用于执行脚本）
    apk update && \
    apk add --no-cache curl bash ca-certificates && \
    update-ca-certificates && \
    # 清理缓存，减小镜像体积
    rm -rf /var/cache/apk/*

# 在线安装pnpm（官方脚本，自动配置环境变量）
RUN curl -fsSL https://get.pnpm.io/install.sh | sh -

# 加载pnpm环境变量（确保后续步骤能使用pnpm命令）
ENV PNPM_HOME=/root/.local/share/pnpm
ENV PATH=$PNPM_HOME:$PATH

# 用pnpm全局安装pm2（进程管理工具）
RUN pnpm add -g pm2 && \
    # 建立软链接，确保pm2全局可用（避免路径问题）
    ln -s $(which pm2) /usr/local/bin/pm2

# 设置工作目录（后续命令默认在此目录执行，与挂载路径对应）
WORKDIR /app

# 暴露项目端口（根据实际项目修改，如3000）
EXPOSE 3000

# 容器启动命令（核心！确保所有工具和项目自动运行）
CMD ["/bin/bash", "-c", " \
    # 确认环境变量已加载（调试用，可删除）
    echo '当前PATH：'$PATH && \
    echo 'pm2路径：'$(which pm2) && \
    # 用pm2启动项目（入口文件为/app/server.js，名称为node-app）
    pm2 start /app/server.js --name node-app && \
    # 保存pm2进程列表（容器重启后自动恢复）
    pm2 save && \
    # 保持容器前台运行（避免启动后退出）
    tail -f /dev/null \
"]
```

### 2. 构建与启动步骤

#### 步骤1：创建并进入工作目录

```
# 创建存放Dockerfile的目录（如/docker/node-env）
mkdir -p /docker/node-env && cd /docker/node-env

# 创建上述Dockerfile（可手动编辑或复制内容）
vim Dockerfile
```

#### 步骤2：构建镜像（清理缓存避免干扰）

```
# 清理旧构建缓存（可选，首次构建可跳过）
sudo docker builder prune -f

# 构建镜像（命名为node20-pnpm-pm2:v1，.表示当前目录为上下文）
sudo docker build -t node20-pnpm-pm2:v1 .
```

#### 步骤3：运行容器（挂载本地项目）

假设本地项目在`/home/project`（包含`server.js`），通过`-v`挂载到容器的`/app`目录：

```
sudo docker run -d \
  --name node-app-container \
  --restart always \  # 容器崩溃或服务器重启时自动启动
  -v /home/project:/app \  # 挂载本地项目到容器工作目录
  -p 3000:3000 \  # 端口映射（宿主机端口:容器端口）
  node20-pnpm-pm2:v1
```

### 3. 验证是否生效

#### 检查容器是否运行

```
sudo docker ps | grep node-app-container
# 输出应包含容器ID，状态为Up（运行中）
```

#### 检查pm2是否自动启动项目

```
# 进入容器执行pm2 list
sudo docker exec -it node-app-container pm2 list

# 预期输出（状态为online）：
# ┌────┬─────────────────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┬──────────┬──────────┬──────────┐
# │ id │ name            │ namespace   │ version │ mode    │ pid      │ uptime │ ↺    │ status    │ cpu      │ mem      │ user     │
# ├────┼─────────────────┼─────────────┼─────────┼─────────┼──────────┼────────┼──────┼───────────┼──────────┼──────────┼──────────┤
# │ 0  │ node-app        │ default     │ N/A     │ fork    │ 123      │ 10s    │ 0    │ online    │ 0%       │ 30.0mb   │ root     │
# └────┴─────────────────┴─────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┴──────────┴──────────┴──────────┘
```

#### 验证容器重启后pm2是否恢复

```
# 重启容器
sudo docker restart node-app-container

# 再次检查pm2进程（应仍为online）
sudo docker exec -it node-app-container pm2 list
```

## 三、方案二：本地文件导入pnpm（适合无网络或特定版本需求）

若服务器无法联网下载pnpm，或需要固定pnpm版本，可通过本地文件导入。核心是确保pnpm文件能被Docker构建上下文访问。

### 1. 前置准备：获取并上传pnpm文件

#### 步骤1：本地下载pnpm

从[pnpm发布页](https://github.com/pnpm/pnpm/releases)下载对应系统的可执行文件（如`pnpm-linux-x64`），重命名为`pnpm`（简化名称）。

#### 步骤2：上传到服务器

将本地`pnpm`文件上传到服务器的`/docker/node-env`目录（与Dockerfile同目录，确保构建时能访问）：

```
# 本地执行（通过scp上传，替换服务器IP和路径）
scp /本地路径/pnpm root@服务器IP:/docker/node-env/

# 服务器上确认文件存在并赋权
cd /docker/node-env
ls -l pnpm  # 应显示文件
chmod +x pnpm  # 赋予可执行权限
```

### 2. Dockerfile完整内容（本地文件版）

```
# 基础镜像：同方案一（Node20 alpine）
FROM node:20.15.0-alpine

# 替换国内镜像源（加速依赖安装）
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories && \
    apk update && \
    apk add --no-cache bash ca-certificates &&  # 无需curl（已本地导入pnpm）
    update-ca-certificates && \
    rm -rf /var/cache/apk/*

# 创建pnpm目录（容器内存储pnpm的路径）
RUN mkdir -p /root/.local/share/pnpm

# 从构建上下文（当前目录）复制pnpm到容器内
# 注意：pnpm文件必须在Dockerfile同目录（构建上下文内）
COPY pnpm /root/.local/share/pnpm/pnpm

# 赋予pnpm可执行权限（容器内生效）
RUN chmod +x /root/.local/share/pnpm/pnpm

# 配置pnpm环境变量（全局可用）
ENV PNPM_HOME=/root/.local/share/pnpm
ENV PATH=$PNPM_HOME:$PATH

# 用pnpm安装pm2（同方案一）
RUN pnpm add -g pm2 && \
    ln -s $(which pm2) /usr/local/bin/pm2

# 工作目录与端口（同方案一）
WORKDIR /app
EXPOSE 3000

# 启动命令（与方案一完全一致，确保pm2自动运行）
CMD ["/bin/bash", "-c", " \
    echo '当前PATH：'$PATH && \
    echo 'pm2路径：'$(which pm2) && \
    pm2 start /app/server.js --name node-app && \
    pm2 save && \
    tail -f /dev/null \
"]
```

### 3. 构建与启动步骤（与方案一类似）

#### 步骤1：构建镜像（确保pnpm在当前目录）

```
cd /docker/node-env  # 必须进入Dockerfile和pnpm所在目录
sudo docker build -t node20-pnpm-pm2:v1-local .
```

#### 步骤2：运行容器（挂载项目）

```
sudo docker run -d \
  --name node-app-container-local \
  --restart always \
  -v /home/project:/app \
  -p 3000:3000 \
  node20-pnpm-pm2:v1-local
```

#### 步骤3：验证（同方案一）

```
# 检查pm2状态
sudo docker exec -it node-app-container-local pm2 list
```

## 四、常见问题排查与解决

### 1. 构建时报“COPY pnpm: no such file or directory”

- **原因**：pnpm文件不在构建上下文目录（Dockerfile所在目录），或文件名错误。
- **解决**：

  ```
  # 确认文件位置和名称（必须在当前目录）
  ls -l /docker/node-env/pnpm

  # 若文件名是pnpm-linux-x64，修改Dockerfile的COPY指令
  # 如：COPY pnpm-linux-x64 /root/.local/share/pnpm/pnpm
  ```

### 2. 容器内“pm2: command not found”

- **原因**：pnpm安装pm2失败，或环境变量未加载。
- **解决**：

  ```
  # 进入容器检查环境变量
  docker exec -it 容器ID bash
  echo $PATH  # 应包含/root/.local/share/pnpm

  # 手动安装pm2（临时验证）
  pnpm add -g pm2
  ```

### 3. pm2启动成功，但容器重启后进程消失

- **原因**：未执行`pm2 save`，或pm2配置未持久化。
- **解决**：

  ```
  # 进入容器手动保存
  docker exec -it 容器ID pm2 save

  # 若需持久化pm2配置，挂载数据卷（修改run命令）
  sudo docker run -d \
    -v /home/project:/app \
    -v pm2-data:/root/.pm2 \  # 持久化pm2配置
    node20-pnpm-pm2:v1
  ```

### 4. 项目启动报错“server.js not found”

- **原因**：本地项目未正确挂载到容器的`/app`目录。
- **解决**：

  ```
  # 检查挂载是否生效
  docker exec -it 容器ID ls /app

  # 确保本地目录有server.js
  ls -l /home/project/server.js
  ```

## 五、总结

两种方案均能实现Node20+pnpm+pm2的环境封装，核心差异在于pnpm的获取方式：

- **在线拉取**：适合网络通畅场景，无需手动管理pnpm文件，推荐优先使用。
- **本地导入**：适合离线环境或特定版本需求，需注意文件路径和权限。

关键配置点：

- 通过`ENV`固化环境变量，确保工具全局可用。
- 在`CMD`中集成`pm2 start`和`pm2 save`，实现服务自动启动与恢复。
- 用`-v`挂载本地项目，避免频繁重构镜像。

按此方案构建的镜像，可直接用于开发或生产环境，且能通过Jenkins等工具集成自动化部署（只需添加镜像构建和容器启动的脚本步骤）。  
