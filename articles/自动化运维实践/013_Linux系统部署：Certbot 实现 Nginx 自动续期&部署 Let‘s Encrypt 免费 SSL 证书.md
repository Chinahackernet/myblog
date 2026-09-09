---
title: "Linux系统部署：Certbot 实现 Nginx 自动续期&部署 Let‘s Encrypt 免费 SSL 证书"
---

**前言：在当今网络环境中，HTTPS已成为网站安全的基础要求。Let's Encrypt提供的免费SSL证书，配合Certbot工具，能帮助我们在各类Linux系统上快速实现HTTPS部署。本文将详细介绍在不同Linux发行版中，如何使用Certbot为Nginx配置Let's Encrypt证书，并实现证书的自动续期，同时解析续期机制的核心原理，特别包含了在Cloudflare仅DNS模式下的完整配置流程。**

## 一、不同Linux系统的工具安装

Certbot在不同Linux发行版中的安装命令略有差异，以下是主流系统的安装方法：

### 1. Ubuntu/Debian系统

```
# 更新系统包
sudo apt update && sudo apt upgrade -y

# 安装Certbot及Nginx插件
sudo apt install certbot python3-certbot-nginx -y
```

### 2. CentOS/RHEL 7系统

```
# 安装EPEL仓库
sudo yum install epel-release -y

# 安装Certbot及Nginx插件
sudo yum install certbot python2-certbot-nginx -y
```

### 3. CentOS/RHEL 8系统

```
# 启用PowerTools仓库
sudo dnf config-manager --set-enabled powertools

# 安装EPEL仓库
sudo dnf install epel-release -y

# 安装Certbot及Nginx插件
sudo dnf install certbot python3-certbot-nginx -y
```

### 4. Fedora系统

```
# 安装Certbot及Nginx插件
sudo dnf install certbot python3-certbot-nginx -y
```

### 工具说明

- **Certbot**：与Let's Encrypt证书颁发机构交互的客户端工具，负责证书申请、续期等操作
- **python3-certbot-nginx/python2-certbot-nginx**：Certbot的Nginx插件，用于自动配置Nginx服务器使用证书

## 二、申请Let's Encrypt证书（默认HTTP-01挑战方式）

无论使用哪种Linux系统，使用HTTP-01挑战申请证书的核心命令基本一致，只需替换为你的实际域名：

```
sudo certbot --nginx -d example.com -d www.example.com
```

### 命令解析

- `--nginx`：指定使用Nginx插件，自动配置Nginx
- `-d`：指定要申请证书的域名，可多次使用以添加多个域名

### 申请流程

1. **执行命令**：在终端中输入上述命令并执行。
2. **输入邮箱**：Certbot会提示输入邮箱，该邮箱用于证书过期提醒。
3. **同意服务条款**：输入`A`并回车，表示同意Let's Encrypt的服务条款。
4. **选择是否共享邮箱**：根据需求选择`Y`（共享）或`N`（不共享）。
5. **选择HTTP重定向方式**：推荐选择`2`，将HTTP流量自动重定向到HTTPS，提升网站安全性。
6. **自动化**: 这里会将新证书自动修改到对应域名的nginx配置文件证书参数里，无需额外手动配置。

## 三、在Cloudflare仅DNS模式下配置自动续期的完整流程

### 一、在Cloudflare控制台创建API令牌（含字段填写说明）

#### 1. 进入API令牌管理页

登录Cloudflare控制台后：

- 点击右上角**头像** → 选择 **"我的个人资料"**
- 左侧菜单点击 **"API 令牌"**

#### 2. 创建API令牌

在`API 令牌`区域，点击 **"创建令牌"** 按钮。  

#### 3. 选择模板（关键！选对权限）

在模板列表里，找到并点击 **"DNS 编辑"**（Template: DNS Edit）：

- 该模板会自动赋予`Zone.DNS:Edit`（修改DNS记录）和`Zone:Read`（读取域名信息）权限，满足Certbot验证需求。  

#### 4. 配置令牌权限（逐字段填写）

在`Zone Resources`（区域资源）部分：

- **包括（Include）**：选择 **"Specific Zone"**（特定区域）
- **区域（Zone）**：从下拉框找到你的域名（如`example.com`）
- 作用：令牌仅对该域名生效，避免权限过大

（可选）客户端IP限制（增强安全性）：

- **运算符（Operator）**：选择 **"等于（Equals）"**
- **值（Value）**：填写服务器公网IP（通过`curl ifconfig.me`获取）
- 作用：仅允许你的服务器使用此令牌，防止泄漏后被滥用

#### 5. 确认并创建令牌

点击页面底部的 **"Continue to Create Token"**（继续创建令牌）→ 再点击 **"Create Token"**（创建令牌）。

#### 6. 复制API令牌

创建成功后，会显示一串类似`v1.xxx...`的字符串，**立刻复制保存**（只显示一次，丢失需重新创建）

### 四、在服务器配置Certbot + Cloudflare插件（Ubuntu 20.04为例）

#### 1. 安装依赖

```
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装Certbot和Cloudflare DNS插件
sudo apt install certbot python3-certbot-dns-cloudflare -y
```

#### 2. 配置Cloudflare API令牌

创建Cloudflare凭据文件，让Certbot调用API：

```
sudo mkdir -p /etc/letsencrypt/cloudflare
sudo nano /etc/letsencrypt/cloudflare/cloudflare.ini
```

在文件中填入：

```
# Cloudflare API令牌（替换为刚复制的内容）
dns_cloudflare_api_token = v1.xxx...（你的令牌）
```

保存退出（按`Ctrl+X` → `Y` → `回车`）。

#### 3. 设置文件权限（必须！防止泄漏）

```
sudo chmod 600 /etc/letsencrypt/cloudflare/cloudflare.ini
```

### 五、用DNS-01挑战申请证书（针对`example.com`和`sub.example.com`）

#### 1. 执行Certbot命令

```
sudo certbot certonly \
  --dns-cloudflare \
  --dns-cloudflare-credentials /etc/letsencrypt/cloudflare/cloudflare.ini \
  -d example.com \
  -d sub.example.com
```

**命令解释**：

- `--dns-cloudflare`：启用Cloudflare DNS验证插件
- `--dns-cloudflare-credentials`：指定凭据文件路径
- `-d`：需申请证书的域名（可添加多个`-d`参数）

#### 2. 验证证书申请结果

若看到以下提示，说明成功：

```
Successfully received certificate.
Certificate is saved at: /etc/letsencrypt/live/example.com/fullchain.pem
Key is saved at:         /etc/letsencrypt/live/example.com/privkey.pem
```

## 六、证书选择选项解析

当执行证书申请命令时，若系统中已有相同域名的有效证书，会出现以下选项：

1. **`1: Keep the existing certificate for now`**

   - 保留现有证书，不进行替换
   - 不影响后续自动续期，适合证书仍有效且无需立即更新的情况
2. **`2: Replace the certificate (may be subject to rate limits)`**

   - 强制生成新证书替换现有证书
   - 可能受Let's Encrypt频率限制（同一域名每周最多5次）
   - 不影响后续自动续期机制，但会重置证书有效期

**选择建议**：

- 若现有证书仍有效且无需立即更新，选择`1`
- 若需测试配置或证书有问题，选择`2`，但需注意频率限制

## 七、配置Nginx使用新证书（确保站点启用HTTPS）

#### 1. 找到Nginx配置文件

假设域名配置在`/etc/nginx/conf.d/example.com.conf`，编辑它：

```
sudo nano /etc/nginx/conf.d/example.com.conf
```

#### 2. 替换证书路径

确保`ssl_certificate`和`ssl_certificate_key`指向新证书：

```
server {
    listen 443 ssl http2;
    server_name example.com sub.example.com;

    # Let's Encrypt证书路径
    ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;

    # 其他配置（反向代理、location等）...
}
```

#### 3. 重载Nginx使配置生效

```
sudo nginx -s reload
```

## 八、验证证书安装

证书配置完成后，可通过以下方式验证：

1. **浏览器验证**：访问`https://example.com`，地址栏显示安全锁图标表示配置成功
2. **命令行验证**：

```
curl -I https://example.com
```

若返回`HTTP/1.1 200 OK`且包含`Strict-Transport-Security`头信息，说明配置正常

## 九、自动续期机制详解

Let's Encrypt证书有效期为90天，Certbot会自动配置续期任务，不同系统的实现方式略有不同：

### 1. 定时任务配置

- **Ubuntu/Debian系统**：通过cron任务实现，配置文件位于`/etc/cron.d/certbot`
- **CentOS/RHEL 7系统**：通过cron任务实现
- **CentOS/RHEL 8及Fedora系统**：通过systemd timer实现

### 2. cron任务解析（以Ubuntu为例）

```
0 */12 * * * root test -x /usr/bin/certbot -a \! -d /run/systemd/system && perl -e 'sleep int(rand(43200))' && certbot -q renew
```

- **`0 */12 * * *`**：表示每12小时执行一次，每天两次检查续期
- **`test -x /usr/bin/certbot -a \! -d /run/systemd/system`**：检查Certbot可执行且系统不使用systemd
- **`perl -e 'sleep int(rand(43200))'`**：随机延迟0-12小时（43200秒），避免服务器集中请求
- **`certbot -q renew`**：静默模式执行续期，仅当证书剩余有效期≤30天时才会实际续期

### 3. systemd timer查看（适用于CentOS 8/Fedora）

```
# 查看certbot定时器状态
sudo systemctl list-timers | grep certbot

# 查看定时器详细信息
sudo systemctl show certbot.timer
```

### 4. 手动测试续期

无论哪种系统，都可以通过以下命令测试续期功能：

```
sudo certbot renew --dry-run
```

**成功标志**：输出包含`Congratulations, all simulated renewals succeeded`或`Congratulations, all renewals succeeded`，表示续期配置正常。  
这是模拟续期成功的**核心标志**，说明 Certbot 能正常完成“验证域名所有权 → 模拟生成新证书 → 模拟重载服务”的全流程。  
后续当证书真正临近过期（剩余有效期 ≤ 30 天左右）时，Certbot 会自动触发续期，无需人工干预 ✅

### 5.续期验证命令详解

#### ① `Plugins selected`：验证插件选择

输出中会显示本次模拟续期所使用的**验证插件（Authenticator）**和**安装插件（Installer）**。例如若看到 `Plugins selected: Authenticator dns-cloudflare, Installer none`，说明成功选用了 Cloudflare DNS 验证插件（或其他你配置的插件），这是续期验证的基础，若插件选择与预期一致，表明验证方式配置无误。

#### ② `Renewing an existing certificate`：续期流程启动

当出现该提示，意味着 Certbot 已开始针对现有证书执行模拟续期流程，会依次检查证书有效期、触发验证逻辑等后续操作。

#### ③ `Performing the following challenges`：验证方式执行

此部分会展示续期所采用的验证挑战类型，比如 `http-01 challenge`（通过临时 HTTP 资源验证域名所有权）或 `dns-01 challenge`（通过 DNS TXT 记录验证）。若显示的验证方式与你配置的一致（如你用 Cloudflare DNS 验证，此处显示 `dns-01 challenge`），说明验证逻辑正常触发。

#### ④ `Congratulations, all simulated renewals succeeded`：续期成功核心标志

这是判断模拟续期成功的最直接依据，表明从验证域名所有权到模拟生成新证书的全流程都顺利完成，自动续期的核心配置（包括插件、证书存储、服务联动等）均无问题。

#### ⑤ `The following certs are not close to expiry`：证书未到期提示

若有证书因剩余有效期较长（大于 30 天左右，Certbot 默认在证书过期前 30 天才会实际续期）未被模拟续期，会出现该提示，这属于正常现象，不代表续期配置有问题，仅说明当前证书还无需续期。

通过以上几部分输出的综合判断，能全面验证自动续期的配置有效性，确保后续证书临近过期时，Certbot 可自动完成续期操作。

## 十、扩展知识

### 1. 其他自动续期方法

除了Cloudflare API方式和默认的HTTP-01挑战，还有：

- **其他DNS提供商API**：

  - 阿里云DNS：使用`python3-certbot-dns-aliyun`插件
  - GoDaddy：使用`python3-certbot-dns-godaddy`插件
  - 安装方式（以Ubuntu为例）：

  ```
  sudo apt install python3-certbot-dns-aliyun -y
  ```
- **手动DNS验证**：适合无法使用API的场景

  ```
  sudo certbot certonly --manual --preferred-challenges dns -d example.com
  ```

  执行后会提示添加特定的DNS TXT记录，手动添加后完成验证

### 2. 查看证书有效期命令

#### ① openssl命令

```
# 替换example.com为你的域名
openssl x509 -noout -dates -in /etc/letsencrypt/live/example.com/fullchain.pem
```

输出将显示证书的生效时间（notBefore）和过期时间（notAfter）

#### ② certbot命令

Certbot 自身也提供了查看证书相关状态的方式，例如查看已申请的证书列表：

```
sudo certbot certificates
```

执行该命令后，会列出当前系统中通过 Certbot 管理的所有证书，包含证书对应的域名、有效期起止时间、证书文件存储路径等信息，方便快速掌握所有证书的整体情况，示例输出如下：

```
Found the following certs:
  Certificate Name: example.com
    Domains: example.com www.example.com
    Expiry Date: 2024-07-30 08:00:00+00:00 (VALID: 89 days)
    Certificate Path: /etc/letsencrypt/live/example.com/fullchain.pem
    Private Key Path: /etc/letsencrypt/live/example.com/privkey.pem
```

## 十一、总结

本文介绍了在不同Linux系统中使用Certbot为Nginx配置Let's Encrypt证书的详细步骤，包括默认HTTP-01挑战和Cloudflare仅DNS模式下的完整配置流程，从API令牌创建到自动续期验证。通过Certbot的自动配置，我们可以轻松实现HTTPS部署，并依靠其内置的定时任务确保证书持续有效。

建议定期执行`certbot renew --dry-run`测试续期功能，同时通过`openssl`命令检查证书有效期，确保网站始终处于安全状态。不同的验证方式各有优劣，可根据实际环境（如是否使用CDN、DNS管理方式等）选择最适合的方案。  
