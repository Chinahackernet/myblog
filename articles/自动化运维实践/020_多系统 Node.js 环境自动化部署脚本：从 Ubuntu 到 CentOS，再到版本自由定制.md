---
title: 多系统 Node.js 环境自动化部署脚本：从 Ubuntu 到 CentOS，再到版本自由定制
---

**前言：在前后端开发以及服务端部署场景中，Node.js 是极为关键的技术栈，而 pm2 作为 Node.js 应用的进程管理工具，能实现应用的守护、自动重启等功能，pnpm 则是高效的包管理器，提升依赖安装与管理的效率。不同的 Linux 发行版（如 Ubuntu、CentOS）在软件安装与环境配置上存在差异，同时我们也常常需要根据项目需求，灵活指定 Node.js 的版本。因此，本文将提供针对不同系统的 Node.js 环境自动化部署脚本，还会打造一个可自由指定 Node.js 版本的通用自动化脚本，助力开发者快速搭建所需的 Node.js 开发与运行环境。**

## 章节 1：Ubuntu 系统 Node.js 环境自动化安装脚本

以下是适用于 Ubuntu 系统，自动安装指定版本 Node.js、pm2、pnpm 等工具的脚本：

```
#!/bin/bash

# 1. 安装必要的依赖
sudo apt update
sudo apt install -y curl wget

# 2. 安装nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# 检查~/.bashrc中是否已有nvm相关配置，没有则添加
if ! grep -q "NVM_DIR=\"\$HOME/.nvm\"" ~/.bashrc; then
    cat >> ~/.bashrc << EOF

# NVM configuration added by install script
export NVM_DIR="$HOME/.nvm"
[ -s "\$NVM_DIR/nvm.sh" ] && \. "\$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "\$NVM_DIR/bash_completion" ] && \. "\$NVM_DIR/bash_completion"  # This loads nvm bash_completion
EOF
    echo "已向~/.bashrc添加nvm配置，未覆盖原有内容"
else
    echo "~/.bashrc中已存在nvm相关配置，无需重复添加"
fi

# 加载nvm（使当前会话生效）
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"

# 3. 安装并激活 Node.js v20.15.0
nvm install 20.15.0
nvm use 20.15.0

# 验证 Node.js 和 npm 版本
echo "Node.js 版本: $(node -v)"
echo "npm 版本: $(npm -v)"

# 4. 安装 pm2
npm install -g pm2
echo "pm2 版本: $(pm2 -v)"

# 5. 自动执行 pm2 startup 生成的命令
echo "正在配置 pm2 开机自启..."
pm2 startup | grep -oP 'sudo .*' | bash

# 6. 安装 pnpm
npm install -g pnpm
echo "pnpm 版本: $(pnpm -v)"

# 提示用户保存 pm2 进程列表（如需开机自启进程）
echo "请执行以下命令保存当前 pm2 进程列表（如需开机自启这些进程）："
echo "pm2 save"
```

脚本首先更新系统并安装必要依赖，接着安装 nvm（Node 版本管理器），并将 nvm 相关配置添加到 `~/.bashrc` 以实现永久生效。之后利用 nvm 安装指定版本的 Node.js，再通过 npm 全局安装 pm2 和 pnpm，同时配置 pm2 开机自启，最后提示用户保存 pm2 进程列表。  

## 章节 2：CentOS 系统 Node.js 环境自动化安装脚本

CentOS 系统的脚本如下，与 Ubuntu 版本在依赖安装和部分配置上有所不同：

```
#!/bin/bash

# 1. 安装必要的依赖
sudo yum install -y curl wget

# 2. 安装nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# 检查~/.bashrc中是否已有nvm相关配置，没有则添加
if ! grep -q "NVM_DIR=\"\$HOME/.nvm\"" ~/.bashrc; then
    cat >> ~/.bashrc << EOF

# NVM configuration added by install script
export NVM_DIR="$HOME/.nvm"
[ -s "\$NVM_DIR/nvm.sh" ] && \. "\$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "\$NVM_DIR/bash_completion" ] && \. "\$NVM_DIR/bash_completion"  # This loads nvm bash_completion
EOF
    echo "已向~/.bashrc添加nvm配置，未覆盖原有内容"
else
    echo "~/.bashrc中已存在nvm相关配置，无需重复添加"
fi

# 加载nvm（使当前会话生效）
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"

# 3. 安装并激活 Node.js（此处以v20.15.0为例，可根据需求修改）
nvm install 20.15.0
nvm use 20.15.0

# 验证 Node.js 和 npm 版本
echo "Node.js 版本: $(node -v)"
echo "npm 版本: $(npm -v)"

# 4. 安装 pm2
npm install -g pm2
echo "pm2 版本: $(pm2 -v)"

# 5. 自动执行 pm2 startup 生成的命令
echo "正在配置 pm2 开机自启..."
pm2 startup | grep -oP 'sudo .*' | bash

# 6. 安装 pnpm
npm install -g pnpm
echo "pnpm 版本: $(pnpm -v)"

# 提示用户保存 pm2 进程列表（如需开机自启进程）
echo "请执行以下命令保存当前 pm2 进程列表（如需开机自启这些进程）："
echo "pm2 save"
```

CentOS 系统使用 `yum` 包管理器安装依赖，其余流程与 Ubuntu 类似，同样借助 nvm 管理 Node.js 版本，安装相关工具并配置 pm2 开机自启。

## 章节 3：版本自由定制的 Node.js 环境自动化安装脚本（多系统兼容版）

下面是支持多Linux发行版（包括Ubuntu、Debian、CentOS、RHEL、Fedora、Arch Linux、Alpine等）的通用脚本，可根据用户输入的Node.js版本自动安装对应环境及配套工具：

```
#!/bin/bash

# 提示用户输入需要安装的Node.js版本
read -p "请输入要安装的Node.js版本（例如：20.15.0）：" NODE_VERSION

# 从系统文件读取发行版信息（适配多系统识别）
. /etc/os-release

# 1. 安装必要的依赖（根据不同系统自动适配包管理器）
install_dependencies() {
    echo "检测到系统：$PRETTY_NAME，开始安装依赖..."
    case $ID in
        ubuntu|debian)
            # Debian系（Ubuntu、Debian）
            sudo apt update
            sudo apt install -y curl wget
            ;;
        centos|rhel)
            # RedHat系（CentOS、RHEL）
            sudo yum install -y curl wget
            ;;
        fedora)
            # Fedora（使用dnf包管理器）
            sudo dnf install -y curl wget
            ;;
        arch|manjaro)
            # Arch系（Arch Linux、Manjaro）
            sudo pacman -Syu --noconfirm curl wget
            ;;
        alpine)
            # Alpine Linux
            sudo apk add curl wget
            ;;
        *)
            # 不支持的系统
            echo "错误：不支持的Linux发行版（ID: $ID）"
            exit 1
            ;;
    esac
}

# 2. 安装nvm（Node版本管理器）
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# 3. 配置nvm永久生效（兼容bash和zsh）
configure_nvm() {
    # 定义nvm配置内容
    nvm_config=$(cat << 'EOF'

# NVM configuration added by install script
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # Load nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # Load nvm bash_completion
EOF
    )

    # 写入bash配置文件（~/.bashrc）
    if [ -f ~/.bashrc ] && ! grep -q "NVM_DIR=\"\$HOME/.nvm\"" ~/.bashrc; then
        echo "$nvm_config" >> ~/.bashrc
        echo "已向~/.bashrc添加nvm配置"
    fi

    # 写入zsh配置文件（~/.zshrc，若存在）
    if [ -f ~/.zshrc ] && ! grep -q "NVM_DIR=\"\$HOME/.nvm\"" ~/.zshrc; then
        echo "$nvm_config" >> ~/.zshrc
        echo "已向~/.zshrc添加nvm配置"
    fi
}

# 4. 加载nvm（使当前会话生效）
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"

# 5. 安装并激活指定版本的Node.js
nvm install "$NODE_VERSION"
nvm use "$NODE_VERSION"

# 验证Node.js和npm版本
echo "Node.js 版本: $(node -v)"
echo "npm 版本: $(npm -v)"

# 6. 安装pm2（进程管理工具）和pnpm（包管理器）
npm install -g pm2 pnpm
echo "pm2 版本: $(pm2 -v)"
echo "pnpm 版本: $(pnpm -v)"

# 7. 自动配置pm2开机自启
echo "正在配置pm2开机自启..."
pm2_startup_cmd=$(pm2 startup | grep -oP 'sudo .*')
if [ -n "$pm2_startup_cmd" ]; then
    echo "执行自启命令: $pm2_startup_cmd"
    $pm2_startup_cmd
else
    echo "未捕获到pm2 startup生成的命令，请手动执行pm2 startup并复制输出的命令运行"
fi

# 提示保存pm2进程列表
echo "===== 提示 ====="
echo "若需开机自动启动当前pm2管理的进程，请执行：pm2 save"

# 执行依赖安装函数
install_dependencies
```

### 脚本说明

1. **多系统适配逻辑**：  
   通过读取`/etc/os-release`文件中的系统标识（`$ID`），自动识别不同Linux发行版，并适配对应的包管理器（如Ubuntu/Debian用`apt`、CentOS用`yum`、Fedora用`dnf`、Arch用`pacman`、Alpine用`apk`），解决了不同系统依赖安装命令差异的问题。
2. **Shell兼容性优化**：  
   同时支持`bash`（配置文件`~/.bashrc`）和`zsh`（配置文件`~/.zshrc`），自动检测并向对应配置文件添加nvm永久生效配置，避免因默认Shell不同导致的环境变量失效问题。
3. **流程模块化**：  
   将依赖安装等步骤拆分为独立逻辑块，通过`case`分支和函数调用使代码结构更清晰，便于后续扩展更多系统支持。
4. **容错处理**：  
   对不支持的Linux发行版会主动报错并退出，避免无效执行；同时增加了pm2自启命令捕获的判断逻辑，若自动执行失败会提示手动操作。

### 适用系统范围

- **完全兼容**：Ubuntu、Debian、CentOS、RHEL、Fedora、Arch Linux、Manjaro、Alpine Linux。
- **注意事项**：Alpine Linux需确保已安装`sudo`并配置权限（部分精简版本默认无`sudo`）。

通过该脚本，可在主流Linux系统上一键部署指定版本的Node.js环境，无需手动适配系统差异，大幅提升环境搭建效率。  
