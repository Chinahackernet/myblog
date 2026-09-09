---
title: "解决 nginx: [warn] “ssl_stapling“ ignored, issuer certificate not found 报错"
---

**前言：在 Nginx 部署 HTTPS 服务时，不少开发者会遇到 `nginx: [warn] "ssl_stapling" ignored, issuer certificate not found for certificate` 的警告。这个看似简单的警告背后，涉及到 HTTPS 证书验证的核心逻辑与性能优化机制。本文将从原理到实践，全面解析该问题的解决方法，并拓展相关知识点，帮助你深入理解 SSL/TLS 配置的精髓。**

## 一、为什么会出现这个警告？—— 从报错信息看本质

当 Nginx 启动或重载配置时，若出现 `ssl_stapling ignored, issuer certificate not found` 警告，直接原因是：**Nginx 启用了 `ssl_stapling` 功能，但找不到服务器证书对应的颁发者（CA）证书**。

- `ssl_stapling` 依赖 CA 证书来验证 OCSP 响应的合法性
- 若缺失 CA 证书，Nginx 无法完成 OCSP 响应的校验，只能忽略该功能
- 警告本身不会导致 HTTPS 服务中断，但会失去 `ssl_stapling` 带来的性能与安全优势

这个问题在使用 Cloudflare、Let's Encrypt 等第三方 CA 证书时尤为常见，因为这些场景下服务器证书与 CA 证书通常是分离的。  

## 二、OCSP 与 `ssl_stapling`：HTTPS 性能优化的关键

要理解警告的深层原因，需先掌握 OCSP 协议与 `ssl_stapling` 的工作原理。

### 2.1 OCSP 协议：证书状态的“实时查询器”

OCSP（Online Certificate Status Protocol）是 CA 机构提供的在线服务，用于查询证书的实时状态（如是否有效、是否被吊销）。在传统 HTTPS 握手流程中：

1. 客户端向服务器请求建立 HTTPS 连接
2. 服务器发送自身证书给客户端
3. 客户端收到证书后，需单独向 CA 的 OCSP 服务器发送查询请求
4. 客户端根据 OCSP 响应判断证书是否可信，再决定是否继续连接

这种模式存在明显缺陷：

- 增加握手延迟（多一次网络请求）
- 若 OCSP 服务器不可达，可能导致连接失败
- 客户端 IP 等信息会暴露给 CA 服务器，存在隐私风险

### 2.2 `ssl_stapling`：OCSP 响应的“快递服务”

`ssl_stapling`（OCSP 装订）是对传统 OCSP 流程的优化：

1. 服务器定期向 CA 的 OCSP 服务器请求并缓存证书状态（OCSP 响应）
2. 客户端请求连接时，服务器将缓存的 OCSP 响应直接“装订”到 TLS 握手信息中
3. 客户端无需再向 CA 服务器查询，直接验证服务器发送的 OCSP 响应

启用 `ssl_stapling` 后：

- 握手时间缩短 30%-50%，显著提升页面加载速度
- 减少对 CA 服务器的依赖，提升服务稳定性
- 避免客户端与 CA 服务器的直接交互，保护用户隐私

## 三、解决警告的完整步骤：从证书获取到配置生效

### 3.1 准备工作：明确证书颁发者

首先需确认服务器证书的颁发机构（CA），不同 CA 的证书链获取方式不同：

- Cloudflare Origin CA：适用于通过 Cloudflare 代理的网站
- Let's Encrypt：适用于免费证书用户
- 商业 CA（如 DigiCert、Comodo）：适用于付费证书用户

可通过 `openssl` 命令查看证书颁发者：

```
openssl x509 -in /path/to/server.crt -noout -issuer
```

### 3.2 获取 CA 证书链：以 Cloudflare 为例

以最常见的 Cloudflare 环境为例，获取 CA 证书链的步骤如下：

1. **访问官方文档**  
   打开 [Cloudflare SSL/TLS 开发者文档](https://developers.cloudflare.com/ssl/)，这是获取官方证书的权威来源。
2. **搜索关键证书**  
   在文档页面顶部搜索框输入关键字 **“Origin CA root certificate”**，找到证书下载章节。
3. **选择证书类型**  
   文档中会提供两个核心证书链接：

   - **Cloudflare Origin ECC PEM**：基于 ECC 算法的根证书
   - **Cloudflare Origin RSA PEM**：基于 RSA 算法的根证书
4. **复制证书内容**  
   点击对应链接，复制完整的 PEM 格式内容（必须包含 `-----BEGIN CERTIFICATE-----` 和 `-----END CERTIFICATE-----` 标记）。

### 3.3 配置 CA 证书链文件

不建议将 CA 证书与服务器证书混合存储，正确做法是创建独立文件：

```
# 创建 CA 证书链文件
sudo touch /etc/nginx/ssl/ca_chain.pem

# 设置文件权限（Nginx 需有读取权限）
sudo chmod 644 /etc/nginx/ssl/ca_chain.pem

# 编辑文件并粘贴证书内容
sudo nano /etc/nginx/ssl/ca_chain.pem  # 或使用 vim
```

粘贴完成后保存文件，确保内容格式正确（无多余空行、字符完整）。

### 3.4 配置 Nginx：关联证书与启用功能

编辑 Nginx 配置文件（如 `/etc/nginx/conf.d/your-site.conf`），添加以下核心配置：

```
server {
    listen 443 ssl;
    server_name example.com;  # 替换为你的域名

    # 服务器证书配置
    ssl_certificate /etc/nginx/ssl/server.crt;        # 服务器证书路径
    ssl_certificate_key /etc/nginx/ssl/server.key;    # 服务器私钥路径

    # 关键：指定 CA 证书链（解决 issuer not found 问题）
    ssl_trusted_certificate /etc/nginx/ssl/ca_chain.pem;

    # OCSP 装订核心配置
    ssl_stapling on;                  # 启用 OCSP 装订
    ssl_stapling_verify on;           # 验证 OCSP 响应有效性
    resolver 8.8.8.8 114.114.114.114 valid=300s;  # DNS 解析器（用于查询 OCSP 服务器）
    resolver_timeout 5s;              # DNS 解析超时时间

    # 推荐的 SSL 安全配置（可选但建议添加）
    ssl_protocols TLSv1.2 TLSv1.3;    # 禁用不安全协议
    ssl_prefer_server_ciphers on;     # 优先使用服务器端加密套件
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;  # 现代加密套件

    # 业务逻辑配置
    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 3.5 验证配置与重启服务

```
# 检查配置语法是否正确
sudo nginx -t

# 若输出 "syntax is ok" 和 "test is successful"，则平滑重启
sudo nginx -s reload
```

重启后，再次查看 Nginx 日志（如 `/var/log/nginx/error.log`），若警告消失，说明配置生效。

## 四、ECC 与 RSA 证书：如何选择？

Cloudflare 提供的 `Cloudflare Origin ECC PEM` 和 `Cloudflare Origin RSA PEM` 分别基于两种不同的加密算法，适用场景各有侧重。

### 4.1 Cloudflare Origin ECC PEM

- **算法特性**：基于椭圆曲线密码学（ECC），在相同安全强度下：

  - 密钥长度更短（256 位 ECC ≈ 3072 位 RSA）
  - 加密/解密速度提升 2-3 倍，节省 CPU 资源
  - 网络传输数据量更少
- **适用场景**：

  - 现代服务器环境（Nginx 1.11+、Apache 2.4+）
  - 主流客户端（Chrome 49+、Firefox 46+、Safari 9+）
  - 高并发场景（API 服务、电商网站）
  - 对性能要求高的移动应用后端
- **局限性**：

  - 不支持老旧系统（如 Windows XP、Android 4.3 以下）
  - 部分嵌入式设备可能存在兼容性问题

### 4.2 Cloudflare Origin RSA PEM

- **算法特性**：基于 RSA 算法，是应用最广泛的公钥加密标准：

  - 兼容性极强，支持几乎所有客户端（包括老旧设备）
  - 部署历史超过 30 年，安全性经过长期验证
- **适用场景**：

  - 需要支持老旧系统的通用网站
  - 政府、企业等对兼容性要求极高的场景
  - 嵌入式设备、物联网终端等特殊环境
- **局限性**：

  - 相同安全强度下，密钥更长（4096 位 RSA 才达到高级安全标准）
  - 计算开销较大，高并发场景下可能影响性能

### 4.3 选择建议

- 新部署的网站：优先选择 ECC 证书（性能更优）
- 需兼容老旧设备：选择 RSA 证书
- 不确定场景：可同时配置两种证书（Nginx 支持多证书配置）

## 五、常见问题与进阶技巧

### 5.1 警告依然存在？排查方向

- **证书链不完整**：部分 CA 需同时配置根证书和中间证书（中间证书可从 CA 官网获取）
- **文件权限问题**：确保 Nginx 进程（通常是 `nginx` 或 `www-data` 用户）有权限读取 `ca_chain.pem`
- **证书不匹配**：通过 `openssl verify` 命令验证证书链是否有效：

  ```
  openssl verify -CAfile /etc/nginx/ssl/ca_chain.pem /etc/nginx/ssl/server.crt
  ```

### 5.2 进阶优化：提升 OCSP 装订效率

- **调整缓存时间**：`resolver` 指令的 `valid` 参数可设置 DNS 缓存时间（建议 300s-3600s）
- **配置多个解析器**：增加备用 DNS 服务器（如 `8.8.8.8 1.1.1.1`），避免单点故障
- **预加载 OCSP 响应**：通过 `ssl_stapling_file` 指令指定预缓存的 OCSP 响应文件

## 六、总结

`nginx: [warn] "ssl_stapling" ignored` 警告的解决核心是**正确配置 CA 证书链**。通过从官方渠道获取匹配的 CA 证书，创建独立的证书链文件，并在 Nginx 中通过 `ssl_trusted_certificate` 指令关联，即可消除警告并启用 `ssl_stapling` 功能。

在实际部署中，需根据业务场景选择 ECC 或 RSA 证书，平衡性能与兼容性。启用 `ssl_stapling` 不仅能优化 HTTPS 握手性能，还能提升服务安全性与用户隐私保护水平，是现代网站部署的必备配置。

记住：HTTPS 配置的细节决定了服务的质量与安全，每一个警告都值得认真对待。  
