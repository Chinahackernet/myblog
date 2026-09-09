---
title: Linux系统安装Docker及部署Node.js 20.15.0（含pnpm、pm2）完整指南
---

**前言：在应用项目部署中，“环境不一致”往往是开发与运维的痛点——本地能跑的代码到了服务器就报错，依赖版本、系统配置差异都可能成为隐患。而Docker的容器化技术恰好能解决这一问题，通过“一次构建，到处运行”的特性，让环境完全可控。**

**Node.js作为前端工程化（如Vite、Webpack）和服务端渲染（SSR）的核心运行环境，搭配pnpm（高效的包管理器，比npm/yarn更节省磁盘空间）和pm2（Node进程守护工具，确保服务稳定运行），能形成一套高效的前端部署链路。**

**本文将从0到1拆解手动操作流程：从Docker安装开始，到Node.js 20.15.0环境部署，再到pnpm和pm2的配置，全程包含常见报错处理（如网络超时、命令找不到等）。步骤虽偏基础，但每一步都有明确的逻辑说明，适合新手直观理解容器化环境的搭建原理。**

（注：本文为手动操作指南，旨在帮助大家理清底层逻辑；后续会推出基于Dockerfile的自动化部署版本，通过代码固化流程，进一步提升部署效率。）

## 一、安装Docker

### （一）卸载旧版本（若有）

旧版本Docker可能与新版本冲突，执行以下命令卸载：

```
sudo yum remove docker docker-client docker-client-latest docker-common docker-latest docker-latest-logrotate docker-logrotate docker-engine
```

### （二）安装依赖包

Docker依赖`yum-utils`等工具配置软件源，安装命令：

```
sudo yum install -y yum-utils device-mapper-persistent-data lvm2
```

### （三）配置Docker官方软件源

使用官方源保障版本稳定，执行：

```
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
```

### （四）安装Docker Engine

安装包含`docker-ce`引擎、`docker-ce-cli`等的最新版Docker：

```
sudo yum install -y docker-ce docker-ce-cli containerd.io
```

#### 报错处理：

从报错信息 `[Errno 14] curl#35 - "TCP connection reset by peer"` 来看，这**不正常**，说明在执行 `yum-config-manager --add-repo` 命令拉取 Docker 官方 repo 文件时，网络连接被对方（Docker 官方服务器）重置了，可能是网络问题、Docker 官方源访问限制等导致。

##### 解决思路：

1. **检查网络**：确保服务器能正常访问外网，可尝试 `ping download.docker.com` ，或用 `curl https://download.docker.com` 测试基本连通性。若网络不通，排查服务器网络配置（如防火墙、代理等 ）。
2. **更换源**：如果访问 Docker 官方源一直有问题，可改用国内镜像源（比如阿里云的 Docker 镜像源 ），步骤如下：

   ```
   # 备份原 repo（若有）
   sudo mv /etc/yum.repos.d/docker-ce.repo /etc/yum.repos.d/docker-ce.repo.bak
   # 添加阿里云 Docker 源
   sudo yum-config-manager --add-repo http://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo
   ```

3. **清理缓存重试**：更换源或确保网络正常后，清理 yum 缓存再尝试安装相关操作：

   ```
   sudo yum clean all
   sudo yum makecache
   # 重新尝试 安装 Docker 引擎、客户端等
   sudo yum install -y docker-ce docker-ce-cli containerd.io
   # 启动 Docker 并设置开机自启
   sudo systemctl start docker
   sudo systemctl enable docker
   ```

报错处理完成

### （五）Docker版本验证

安装完成后，通过以下命令验证版本：

- **查看完整版本信息**（客户端和服务端）：

  ```
  docker version
  ```
- **简洁查看客户端版本**：

  ```
  docker -v
  ```

### （六）配置Docker镜像加速

添加国内镜像加速并优化配置，执行：

```
sudo mkdir -p /etc/docker && sudo tee /etc/docker/daemon.json <<-'EOF'
{
  "registry-mirrors": ["https://hub-mirror.c.163.com", "https://docker.mirrors.ustc.edu.cn"],
  "exec-opts": ["native.cgroupdriver=systemd"],
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "100m"
  },
  "storage-driver": "overlay2"
}
EOF
```

### （七）重启Docker服务使配置生效

```
sudo systemctl daemon-reload && sudo systemctl restart docker
```

### （八）验证Docker安装成功

运行`hello-world`容器测试：

```
sudo docker run hello-world
```

输出`Hello from Docker!`相关信息则安装成功。  

#### 报错处理：

若拉取镜像报错（如网络超时），需重新确认镜像加速配置：

##### 1. 获取专属镜像加速地址

登录阿里云 [容器镜像服务控制台](https://cr.console.aliyun.com/cn-hangzhou/instances/mirrors) ，在“镜像工具”下找到“镜像加速器”，复制专属的镜像加速地址。这里就不展示我个人的镜像站了。

##### 2. 检查并修改配置文件

检查 `/etc/docker/daemon.json` 文件，确保配置正确。如果文件内容有误或不完整，你可以按照以下内容修改：

```
sudo nano /etc/docker/daemon.json
```

将文件内容修改为（将 `https://你的专属加速地址.mirror.aliyuncs.com` 替换为你从阿里云控制台获取的真实加速地址）：

```
{
  "registry-mirrors": ["https://你的专属加速地址.mirror.aliyuncs.com"],
  "exec-opts": ["native.cgroupdriver=systemd"],
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "100m"
  },
  "storage-driver": "overlay2"
}
```

修改完成后，按下 `Ctrl + X` ，然后按 `Y` 保存修改，最后按 `Enter` 确认。

保存后重启Docker：

```
sudo systemctl daemon-reload && sudo systemctl restart docker
```

如果启动失败：  
这是在 Linux 系统中执行 `jq . /etc/docker/daemon.json` 命令时出现的报错，实体信息是：系统提示 `jq` 命令未找到（`-bash: jq: command not found` ），说明当前系统没有安装 `jq` 工具 。

若要使用 `jq` 检查 `daemon.json` 语法，需先安装 `jq`，以 CentOS/RHEL 系统为例，可执行 `sudo yum install -y jq` ；以 Debian/Ubuntu 系统为例，可执行 `sudo apt install -y jq` 进行安装。

### 更换其他镜像加速源

如果阿里云镜像加速依然无法解决问题，可以尝试使用其他镜像源：

- **网易云镜像源**：

```
sudo nano /etc/docker/daemon.json
```

将文件内容修改为：

```
{
  "registry-mirrors": ["https://hub-mirror.c.163.com"]
}
```

修改完成后保存并退出，然后重新加载Docker配置并重启Docker服务：

```
sudo systemctl daemon-reload
sudo systemctl restart docker
```

- **清华大学镜像源**：

```
sudo nano /etc/docker/daemon.json
```

将文件内容修改为：

```
{
  "registry-mirrors": ["https://docker.mirrors.tuna.tsinghua.edu.cn"]
}
```

同样修改完成后保存并退出，执行以下命令重新加载配置和重启服务：

```
sudo systemctl daemon-reload
sudo systemctl restart docker
```

报错处理完成

### 验证镜像加速配置是否生效

配置完成后，再次尝试拉取 `hello-world` 镜像：

```
sudo docker run hello-world
```

如果配置生效，应该能够正常从镜像加速源拉取镜像并运行，显示类似 `Hello from Docker!` 的成功提示信息。

##### 2. 验证配置生效

重新执行`hello-world`测试：

```
sudo docker run hello-world
```

若仍报错，可能是网络限制，建议检查服务器网络或更换镜像源。

## 二、部署Node.js 20.15.0环境（含pnpm、pm2）

### （一）选择Node.js镜像

Node.js官方提供`alpine`版本（轻量级），适合容器化部署，无需依赖底层OS（如CentOS、Rocky、ubuntu），镜像体积小且环境完整，完全满足前端项目（静态文件、Vite Server）需求。

### （二）拉取Node.js 20.15.0官方镜像

执行以下命令拉取轻量的`alpine`版本：

```
sudo docker pull node:20.15.0-alpine
```

通过`sudo docker images`查看，显示`node:20.15.0-alpine`即拉取成功。  

### （三）创建并进入Node.js容器

创建持久化容器并进入终端：

```
sudo docker run -itd --name node20-container node:20.15.0-alpine /bin/sh
sudo docker exec -it node20-container /bin/sh
```

进入后终端前缀显示`/#` ，表示在容器内操作。

### （四）在容器内安装pnpm

pnpm是高效包管理工具，通过官方脚本安装：

```
apk update
apk add curl
curl -fsSL https://get.pnpm.io/install.sh | sh -
```

#### 报错原因分析

- **`WARN` 提示**：`using --force I sure hope you know what you are doing` 是因为安装脚本检测到使用了一些强制操作相关的参数（`curl` 里的 `--force` 类似强制行为 ），不过这不是关键问题。
- **`ERR_PNPM_UNKNOWN_SHELL` 错误**：安装脚本无法推断当前使用的 Shell 类型，虽然报错，但并不影响 `pnpm` 二进制文件的拷贝安装。
- **`pnpm: not found`**：这是因为安装脚本没成功配置环境变量，使得系统无法在默认路径找到 `pnpm` 命令 。  
  安装过程中出现了问题，但其实 `pnpm` 已经安装成功了 ，只是环境变量没配置好，导致系统找不到 `pnpm` 命令。

如果以上curl很慢，就执行以下命令：

```
curl -fsSL https://registry.npmmirror.com/-/binary/pnpm/install.sh | sh -
```

**如果想更猛的话就修改为共用宿主机网络：（生产环境上谨慎操作）**

##### 1. 如果容器已启动，但未使用 `--network=host`

进入容器后直接执行原命令（无需添加 `--network=host`）：

```
docker exec -it <容器名> /bin/sh
# 在容器内执行：
curl -fsSL https://get.pnpm.io/install.sh | sh -
```

##### 2. **如果需要使用 `host` 网络模式**

**步骤 1**：先停止并删除当前容器（如果已存在）：

```
docker stop <容器名> && docker rm <容器名>
```

**步骤 2**：使用 `--network=host` 参数重新创建容器：

```
docker run -itd --name <容器名> --network=host node:20.15.0-alpine /bin/sh
```

**步骤 3**：进入容器并执行安装命令：

```
docker exec -it <容器名> /bin/sh
# 在容器内执行：
curl -fsSL https://get.pnpm.io/install.sh | sh -
```

- **网络慢或超时**：改用国内源脚本：

  ```
  curl -fsSL https://registry.npmmirror.com/-/binary/pnpm/install.sh | sh -
  ```
- **`pnpm: not found`**：环境变量未配置，执行：

  ```
  echo 'export PATH="$HOME/.local/share/pnpm:$PATH"' >> ~/.profile && source ~/.profile
  ```

### （五）配置pnpm环境变量（让命令全局可用）

执行：

```
echo 'export PATH="$HOME/.local/share/pnpm:$PATH"' >> ~/.profile && source ~/.profile
```

### （六）验证pnpm安装

```
pnpm -v
```

输出版本号（如`10.13.1` ）即成功。

### 可选步骤（根据具体需求选择执行不）

插个题外话，如果想降级到指定版本，需要先彻底卸载当前版本，再用指定版本安装命令，如 pnpm8.15.0版本（此步骤谨慎操作）  
要完全卸载 pnpm 并清理所有相关文件和配置，可以执行以下命令：

#### **1. 删除 pnpm 二进制文件**

```
# 删除 pnpm 和 pnpx 可执行文件
rm -f ~/.local/share/pnpm/pnpm
rm -f ~/.local/share/pnpm/pnpx

# （可选）如果使用了全局安装路径，也删除这些位置的文件
rm -f /usr/local/bin/pnpm
rm -f /usr/local/bin/pnpx
```

#### **2. 清理环境变量配置**

```
# 编辑 Shell 配置文件（根据你使用的 Shell 选择）
nano ~/.profile  # 或 .bashrc, .zshrc, .shrc 等

# 在文件中找到并删除以下类似的行（如果存在）：
export PATH="$PATH:/root/.local/share/pnpm"
# 或
export PNPM_HOME="/root/.local/share/pnpm"
export PATH="$PNPM_HOME:$PATH"

# 保存并退出编辑器（按 Ctrl+O 保存，Ctrl+X 退出）

# 使配置立即生效
source ~/.profile  # 或 source ~/.bashrc, ~/.zshrc 等
```

#### **3. 删除 pnpm 存储的全局包和缓存**

```
# 删除 pnpm 全局包存储目录
rm -rf ~/.local/share/pnpm/store

# 删除 pnpm 缓存目录
rm -rf ~/.pnpm-store
```

#### **4. 验证卸载结果**

```
pnpm -v  # 应显示 "command not found"
```

#### **额外说明**

- 如果是通过 `npm install -g pnpm` 安装的，先执行：

  ```
  npm uninstall -g pnpm
  ```
- 如果使用的是 Fish Shell，配置文件路径为 `~/.config/fish/config.fish`，需编辑该文件删除相关环境变量。

完成上述步骤后，pnpm 会被彻底移除，可以重新开始干净的安装流程。  
安装指定版本：`curl -fsSL https://get.pnpm.io/install.sh | sh -s -- --version 8.15.0`

### （七）在容器内安装pm2

pm2用于守护Node.js应用进程，执行：

```
pnpm add -g pm2
```

#### 报错处理：

由于 `pnpm setup` 命令因无法推断 Shell 类型报错，导致不能自动创建全局二进制目录，这种情况下使用方法二手动设置全局二进制目录和环境变量是比较好的选择。以下是具体的操作步骤：

##### 1. 创建全局二进制目录

在容器内执行以下命令，创建用于存放 pnpm 全局包二进制文件的目录：

```
mkdir -p ~/.local/share/pnpm_global_bin
```

`mkdir -p` 命令会创建目录，如果目录已经存在则不会报错。

##### 2. 设置环境变量

将创建的全局二进制目录添加到 `PATH` 环境变量中，同时设置 `PNPM_HOME` 环境变量：

```
export PNPM_HOME=~/.local/share/pnpm
export PATH="$PNPM_HOME/global_bin:$PATH"
```

上述命令设置了 `PNPM_HOME` 为 pnpm 的主目录，并且将全局二进制目录路径添加到了 `PATH` 中，这样系统就能找到全局安装的包的可执行文件。

为了让这些环境变量在每次进入容器时都生效，可以将它们追加到 Shell 配置文件中。在 Alpine Linux 中，默认的 Shell 是 `/bin/sh`，通常可以编辑 `~/.profile` 文件（如果是其他 Shell，如 `bash`，则编辑对应的配置文件，如 `~/.bashrc` ）：

```
echo 'export PNPM_HOME=~/.local/share/pnpm' >> ~/.profile
echo 'export PATH="$PNPM_HOME/global_bin:$PATH"' >> ~/.profile
source ~/.profile
```

`source ~/.profile` 命令用于立即生效刚刚添加到配置文件中的环境变量，而不需要重新登录或重启容器。

##### 3. 安装 pm2

完成上述环境变量设置后，再次尝试使用 pnpm 安装 pm2：

```
pnpm add -g pm2
```

安装完成后，可以使用 `pm2 -v` 命令来检查 pm2 是否安装成功，如果能输出版本号，就说明安装成功了。  

### （八）验证pm2安装

```
pm2 -v
```

输出版本号（如`5.3.0` ）即成功。

## 三、验证环境完整性

在容器内依次执行以下命令，验证所有依赖：

```
# 验证Node.js版本
node -v  # 应输出v20.15.0
# 验证npm版本（Node自带）
npm -v   # 应输出对应版本（如10.7.0 ）
# 验证pnpm版本
pnpm -v  # 输出安装的版本 
# 验证pm2版本
pm2 -v   # 输出安装的版本
```

所有命令正常输出版本号，环境配置完成。

## 四、容器与项目管理

### （一）容器持久化（挂载项目目录）

为同步宿主机项目代码到容器，启动容器时添加挂载参数：

```
# 先停止并删除现有容器（若需）
sudo docker stop node20-container && sudo docker rm node20-container

# 启动容器并挂载宿主机项目目录
sudo docker run -itd \
  --name node20-container \
  -v /your/local/project:/container/project \
  node:20.15.0-alpine /bin/sh
```

- `/your/local/project`：宿主机项目目录（需替换为实际路径）
- `/container/project`：容器内映射目录

### （二）应用部署流程

1. 进入容器并切换到项目目录：

   ```
   sudo docker exec -it node20-container /bin/sh
   cd /container/project
   ```
2. 安装项目依赖：

   ```
   pnpm install
   ```
3. 用pm2启动应用：

   ```
   pm2 start server.js --name your-app-name
   ```

### （三）容器管理常用命令

- 停止容器：`sudo docker stop <容器名>`
- 重启容器：`sudo docker restart <容器名>`
- 删除容器（需先停止）：`sudo docker rm <容器名>`
- 查看容器日志：`sudo docker logs <容器名>`

## 五、环境持久化验证

为确保容器重启后环境可用，可按以下步骤验证：

1. **停止并删除当前容器**：

   ```
   docker stop node20-container && docker rm node20-container
   ```
2. **重新创建容器**：

   ```
   docker run -itd --name node20-container node:20.15.0-alpine /bin/sh
   ```
3. **进入新容器，重新配置环境**：

   ```
   docker exec -it node20-container /bin/sh
   # 重新执行pnpm和pm2安装步骤（容器重建后需重新配置）
   ```

> 说明：容器本身是“无状态”的，重建后需重新安装依赖。若需环境持久化，后续可通过Dockerfile固化环境（后续文章将详细介绍）。

## 总结

本文详细演示了通过手动操作完成 Docker 安装、Node.js 20.15.0 环境部署的全过程，同步实现了 pnpm 包管理工具与 pm2 进程管理工具的配置，并针对性解决了网络连接异常、环境变量配置错误等常见问题。尽管手动操作流程相对繁琐，但能让使用者更直观地理解容器化环境的底层运行逻辑与核心配置原理，为后续灵活应对复杂场景打下基础。  
