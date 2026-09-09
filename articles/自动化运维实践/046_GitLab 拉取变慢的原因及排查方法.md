---
title: GitLab 拉取变慢的原因及排查方法
---

**前言：在软件开发的快节奏世界里，高效协作与快速交付是制胜关键。然而，当开发团队兴高采烈地投入工作，却发现从GitLab拉取代码的速度慢如蜗牛，那种沮丧感简直能瞬间浇灭热情。在分布式开发环境中，这种情况时有发生，尤其是在涉及多层级架构的系统中，如典型的三服务器架构：客户端、A服务器（Nginx代理）、B服务器（GitLab）。这种复杂性让问题的排查变得棘手，但绝非无解。  
我们的目标很清晰：揪出拖慢拉取速度的罪魁祸首并消灭它。这是一次全方位的深度排查，涵盖网络、服务器性能、GitLab配置以及Nginx代理配置等多个领域。这不仅是一次技术上的挑战，更是一场对细节和耐心的考验。通过本文的排查方法，希望能帮助你迅速定位问题根源，让代码拉取速度恢复飞驰，让团队协作重新焕发生机。让我们一起踏上这场深度排查之旅，让GitLab的高效协作回归正轨。**

拉取流程涉及三台服务器：客户端 → A服务器(Nginx代理) → B服务器(GitLab)。这种情况下，变慢可能是由多个环节引起的。以下是详细的排查方法：

### 可能的原因

1. **网络问题**

   - A服务器与B服务器之间的网络延迟
   - Nginx配置不合理
   - 内网带宽限制
   - 网络拥塞或丢包
2. **服务器性能问题**

   - A服务器(Nginx)负载过高
   - B服务器(GitLab)资源不足
   - 磁盘I/O瓶颈
   - 内存不足
3. **GitLab配置问题**

   - GitLab本身配置不当
   - GitLab服务未优化
   - 数据库性能问题
4. **Nginx代理配置问题**

   - 代理缓冲区设置过小
   - 超时设置不合理
   - 未启用缓存
   - SSL/TLS配置影响性能

### 排查方法

#### 1. 网络层面排查

首先检查网络连接状态：

```
# 在A服务器上测试到B服务器的网络连接
ping B服务器IP地址
traceroute B服务器IP地址

# 在客户端测试到A服务器的网络连接
ping A服务器IP地址
traceroute A服务器IP地址

# 检查网络带宽使用情况
ifstat  # 安装: apt-get install ifstat 或 yum install ifstat
nload   # 安装: apt-get install nload 或 yum install nload
```

#### 2. 服务器性能排查

检查服务器资源使用情况：

```
# 在A服务器和B服务器上执行以下命令

# 检查CPU使用率
top

# 检查内存使用情况
free -h

# 检查磁盘I/O
iostat -x 1 5

# 检查网络连接数
netstat -an | grep :80 | wc -l
netstat -an | grep :443 | wc -l

# 检查Nginx进程数
ps aux | grep nginx | wc -l
```

#### 3. Nginx配置检查

检查Nginx代理配置是否合理：

```
# 查看Nginx配置文件
cat /etc/nginx/conf.d/gitlab.conf

# 检查关键参数是否合理
grep -E "proxy_buffer|proxy_buffers|proxy_connect_timeout|proxy_read_timeout|proxy_send_timeout" /etc/nginx/conf.d/gitlab.conf

# 检查Nginx错误日志
tail -n 50 /var/log/nginx/error.log

# 测试Nginx配置
nginx -t
```

#### 4. GitLab服务器检查

检查GitLab服务器状态和配置：

```
# 在B服务器上执行

# 检查GitLab状态
sudo gitlab-ctl status

# 查看GitLab日志
sudo gitlab-ctl tail

# 检查GitLab配置
sudo gitlab-rake gitlab:env:info
```

#### 5. 性能测试

使用工具测试不同环节的性能：

```
# 在客户端测试到A服务器的响应时间
time curl -o /dev/null -s -w "时间: %{time_total} sec\n状态: %{http_code}\n" http://A服务器/gitlab/项目路径.git/info/refs

# 在A服务器上测试到B服务器的响应时间
time curl -o /dev/null -s -w "时间: %{time_total} sec\n状态: %{http_code}\n" http://B服务器/gitlab/项目路径.git/info/refs

# 使用Git命令测试拉取速度
GIT_TRACE=1 git clone http://A服务器/gitlab/项目路径.git
```

#### 6. Nginx配置优化建议

如果发现Nginx配置有问题，可以尝试以下优化：

```
server {
    listen       80;
    server_name  你的gitlab域名;
    server_tokens off;
    
    # 安全措施：防止 DNS 预解析泄露信息
    add_header X-DNS-Prefetch-Control off;
    
    # 强制重定向到 HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen              443 ssl http2;
    server_name         你的gitlab域名;
    server_tokens       off;
    
    # 客户端请求体大小限制（保持现有配置）
    client_max_body_size 250m;
    
    # SSL 配置优化
    ssl_certificate            /你公司证书的具体路径/;
    ssl_certificate_key        /你公司证书key的具体路径/;
    ssl_protocols              TLSv1.2 TLSv1.3;  # 添加 TLSv1.3 支持
    ssl_prefer_server_ciphers  on;
    ssl_ciphers                ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305;
    ssl_session_cache          shared:SSL:10m;  # 共享 SSL 会话缓存
    ssl_session_timeout        1d;
    ssl_session_tickets        off;
    
    # 安全相关头部
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header X-Frame-Options "SAMEORIGIN";
    add_header Referrer-Policy "strict-origin-when-cross-origin";
    
    # 超时设置 - 关键优化点
    proxy_connect_timeout      120-600s;  # 连接后端超时时间（需要选个具体的时间）
    proxy_read_timeout         120-600s  # 读取响应超时时间（需要选个具体的时间）
    proxy_send_timeout         120-600s;  # 发送请求超时时间（需要选个具体的时间）
    
    # 缓冲区优化 - 关键优化点
    proxy_buffer_size          128k;
    proxy_buffers              4 256k;
    proxy_busy_buffers_size    256k;
    proxy_temp_file_write_size 256k;
    
    # TCP 优化 - 启用 HTTP/1.1 持久连接
    proxy_http_version         1.1;
    proxy_set_header           Connection "";
    
    # 日志配置 - 调整为独立子目录
    access_log                 /var/log/nginx/gitlab_access.log;
    error_log                  /var/log/nginx/gitlab_error.log;
    
    location / {
        proxy_pass             http://gitlab服务器ip:端口;
        proxy_redirect         default;
        
        # 传递客户端真实信息
        proxy_set_header       Host $host;
        proxy_set_header       Referer $http_referer;
        proxy_set_header       X-Real-IP $remote_addr;
        proxy_set_header       X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header       X-Forwarded-Proto $scheme;
        proxy_set_header       X-Forwarded-Host $host;
        proxy_set_header       X-Forwarded-Port $server_port;
    }
}
```

### 另外需要配置日志切割，如果有不会的就评论说下，我再补充。

### 常见问题及解决方案

#### 1. Nginx代理缓冲区设置过小

如果Nginx日志中出现类似"upstream sent too big header while reading response header from upstream"的错误，需要增加缓冲区大小：

```
proxy_buffer_size 128k;
proxy_buffers 4 256k;
proxy_busy_buffers_size 256k;
```

#### 2. 超时设置不合理

如果大文件传输经常中断，增加超时设置：

```
proxy_connect_timeout 600;
proxy_read_timeout 600;
proxy_send_timeout 600;
```

#### 3. GitLab服务器性能问题

如果GitLab服务器资源不足，可以：

- 增加服务器内存和CPU资源
- 优化GitLab配置
- 分离GitLab的数据库和存储服务

#### 4. 网络拥塞

如果网络带宽不足，可以：

- 升级网络设备和带宽
- 优化网络拓扑结构
- 实现流量控制和QoS

### 综合排查脚本

以下是一个综合排查脚本，可以帮助您快速定位问题（**需要注意的是请先在测试环境验证没问题后才能在生产环境上使用！**）：

```
#!/bin/bash

# GitLab代理性能排查脚本
# 用于诊断通过Nginx代理访问GitLab变慢的问题

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # 恢复默认颜色

# 检查命令是否存在
check_command() {
    command -v $1 >/dev/null 2>&1 || { echo -e "${RED}错误: 需要安装 $1${NC}"; exit 1; }
}

# 检查必要的命令
check_command curl
check_command ping
check_command traceroute
check_command netstat
check_command top
check_command free
check_command iostat

echo -e "${GREEN}===== GitLab代理性能排查工具 ====${NC}"
echo

# 用户输入
read -p "请输入GitLab服务器IP地址: " GITLAB_IP
read -p "请输入Nginx代理服务器IP地址: " NGINX_IP
read -p "请输入要测试的GitLab项目路径: " PROJECT_PATH

# 检查是否有root权限
if [ "$(id -u)" != "0" ]; then
   echo -e "${RED}此脚本需要root权限运行${NC}"
   exit 1
fi

# 1. 网络连接测试
echo -e "${YELLOW}=== 网络连接测试 ===${NC}"
echo "测试从Nginx服务器到GitLab服务器的网络连接..."
ping -c 5 $GITLAB_IP
echo

echo "跟踪从Nginx服务器到GitLab服务器的路由..."
traceroute -m 20 $GITLAB_IP
echo

# 2. 服务器性能检查
echo -e "${YELLOW}=== Nginx服务器性能检查 ===${NC}"
echo "CPU使用情况:"
top -bn1 | grep "Cpu(s)"
echo

echo "内存使用情况:"
free -h
echo

echo "磁盘I/O情况:"
iostat -x 1 3
echo

echo "网络连接数:"
netstat -an | grep :80 | wc -l
netstat -an | grep :443 | wc -l
echo

# 3. Nginx配置检查
echo -e "${YELLOW}=== Nginx配置检查 ===${NC}"
echo "检查Nginx配置文件..."
if [ -f /etc/nginx/conf.d/git.conf ]; then
    CONFIG_FILE="/etc/nginx/conf.d/git.conf"
elif [ -f /etc/nginx/sites-enabled/gitlab ]; then
    CONFIG_FILE="/etc/nginx/sites-enabled/gitlab"
else
    echo -e "${RED}未找到GitLab相关配置文件${NC}"
    echo "请手动检查Nginx配置"
fi

if [ -n "$CONFIG_FILE" ]; then
    echo "配置文件位置: $CONFIG_FILE"
    echo "关键配置参数:"
    grep -E "proxy_buffer|proxy_buffers|proxy_connect_timeout|proxy_read_timeout|proxy_send_timeout|proxy_pass" $CONFIG_FILE
    
    echo -e "\n检查Nginx错误日志..."
    if [ -f /var/log/nginx/error.log ]; then
        tail -n 20 /var/log/nginx/error.log
    else
        echo -e "${RED}未找到Nginx错误日志${NC}"
    fi
fi
echo

# 4. 性能测试
echo -e "${YELLOW}=== 性能测试 ===${NC}"
echo "测试从Nginx服务器到GitLab服务器的直接访问速度..."
TEST_URL="http://$GITLAB_IP/$PROJECT_PATH.git/info/refs"
echo "测试URL: $TEST_URL"
curl -o /dev/null -s -w "时间: %{time_total} sec\n状态: %{http_code}\n" $TEST_URL
echo

echo "测试通过Nginx代理访问GitLab的速度..."
TEST_URL="http://$NGINX_IP/$PROJECT_PATH.git/info/refs"
echo "测试URL: $TEST_URL"
curl -o /dev/null -s -w "时间: %{time_total} sec\n状态: %{http_code}\n" $TEST_URL
echo

# 5. 测试Git命令执行
echo -e "${YELLOW}=== Git命令测试 ===${NC}"
echo "使用GIT_TRACE测试克隆速度..."
echo "注意: 此测试会实际克隆仓库，请确保有足够空间"
read -p "是否继续Git克隆测试? (y/n): " CONTINUE

if [ "$CONTINUE" = "y" ] || [ "$CONTINUE" = "Y" ]; then
    mkdir -p gitlab_test
    cd gitlab_test
    
    echo "开始克隆测试..."
    START_TIME=$(date +%s)
    GIT_TRACE=1 git clone http://$NGINX_IP/$PROJECT_PATH.git
    END_TIME=$(date +%s)
    ELAPSED_TIME=$((END_TIME - START_TIME))
    
    echo -e "\n${GREEN}克隆完成，耗时: $ELAPSED_TIME 秒${NC}"
    cd ..
fi

echo -e "\n${GREEN}排查完成！${NC}"
echo "结果总结:"
echo "- Nginx到GitLab的网络延迟: 见ping测试结果"
echo "- Nginx服务器资源使用情况: 见CPU/内存/磁盘I/O测试"
echo "- Nginx配置检查: 见配置文件分析"
echo "- 直接访问速度: 见curl测试结果"
echo "- 代理访问速度: 见curl测试结果"
echo "- Git克隆耗时: 如执行了测试，见上述输出"
echo

echo "优化建议:"
echo "1. 如果网络延迟高，检查网络设备和路由配置"
echo "2. 如果Nginx服务器资源不足，考虑升级硬件或优化配置"
echo "3. 如果Nginx配置不合理，参考以下优化参数:"
echo "   proxy_buffer_size 128k;"
echo "   proxy_buffers 4 256k;"
echo "   proxy_busy_buffers_size 256k;"
echo "   proxy_connect_timeout 600;"
echo "   proxy_read_timeout 600;"
echo "   proxy_send_timeout 600;"
```

通过以上排查方法，您应该能够找出GitLab拉取变慢的具体原因并进行相应优化。如果问题仍然存在，可能需要联系网络管理员或系统管理员进一步排查。  

### 来源真实场景：

