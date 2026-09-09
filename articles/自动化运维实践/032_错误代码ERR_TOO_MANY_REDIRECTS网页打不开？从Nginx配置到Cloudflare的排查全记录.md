---
title: 错误代码ERR_TOO_MANY_REDIRECTS网页打不开？从Nginx配置到Cloudflare的排查全记录
---

**前言：从“网页打不开”到找到根源的真实记录“ERR_TOO_MANY_REDIRECTS”——这个错误代码想必不少开发者都遇到过：明明域名解析、服务器配置都检查过了，可网页就是打不开，浏览器提示“重定向次数过多”。更让人头疼的是，有时候注释掉某段Nginx配置（比如用于强制跳转的`return 301`），网页突然就能打开了，但原本想要的功能（比如HTTP强制转HTTPS）却没了。**

**最近我就碰到了这个典型问题：给测试域名配置“HTTP强制转HTTPS”时，添加`return 301 https://$server_name$request_uri;`后立刻触发`ERR_TOO_MANY_REDIRECTS`，注释后虽然能访问，却失去了安全保障。排查了Nginx配置、证书等环节都没问题，最后才发现“真凶”藏在Cloudflare的设置里。**

**这篇文章会完整还原排查过程：从问题现象到逐步定位，再到最终解决，同时总结可能导致该错误的其他场景。无论你是刚接触Nginx的新手，还是遇到过类似问题的开发者，都能从这个真实案例中找到可复用的排查思路——毕竟解决问题的核心，从来不是“记住答案”，而是“学会找到答案的方法”。**

## 一、问题现象：一个“强制跳转”配置引发的打不开

最近给一个测试域名配置Nginx时，遇到个典型问题：为了实现“HTTP强制转HTTPS”，我在Nginx里加了这段配置：

```
# 用于HTTP强制转HTTPS的配置
return 301 https://$server_name$request_uri;
```

结果一启用（取消注释），网页直接报错“**ERR_TOO_MANY_REDIRECTS（重定向次数过多）** ”，完全打不开；但如果把这段配置注释掉，虽然HTTP和HTTPS都能访问域名，却失去了“强制HTTPS”的安全效果——这显然不是理想状态。

更让人困惑的是：证书配置明明没问题，也没涉及其他无关域名，为什么一个简单的跳转配置会导致网页打不开？这让我不得不从头排查。  

## 二、排查过程：从Nginx到证书，最后锁定“中间人”

遇到问题时，我先从“自己能控制的配置”开始排查，毕竟`return 301`是手动添加的，很可能是配置逻辑出了问题。

### 1. 第一步：检查Nginx配置，是不是跳转逻辑错了？

最开始怀疑`return 301`的参数是否有误。比如是否把`https`写成了`http`？（后来发现参数本身没错，但逻辑可能和其他环节冲突）。

接着检查Nginx的`server_name`是否和域名匹配（确认虚拟主机配置正确），又测试`request_uri`是否会导致路径拼接错误——单独用服务器本地访问（跳过任何代理）时，HTTP能正常转到HTTPS，说明Nginx本身的跳转逻辑没问题。

### 2. 第二步：检查证书，是不是HTTPS基础有问题？

因为涉及HTTPS跳转，我又排查了证书配置：确认证书包含当前域名（比如配置的是`*.example.com`通配符证书，覆盖测试域名`test.example.com`），且`ssl_certificate`和`ssl_certificate_key`的路径正确（权限设置为`600`，避免Nginx无法读取）。

用命令`openssl x509 -noout -text -in /path/to/cert.pem | grep DNS`检查，证书确实包含目标域名；本地用`curl https://test.example.com`也能正常返回内容——说明证书本身没问题。

### 3. 第三步：排除本地问题后，锁定“中间人”Cloudflare

排除Nginx和证书后，突然想到：这个域名用了Cloudflare的CDN和DNS解析，会不会是它在中间“改写”了请求？

登录Cloudflare后台一看，发现SSL/TLS加密模式是“灵活（Flexible）”——这才是问题的关键！

## 三、核心原因：Cloudflare与Nginx的“协议跳转”冲突了

为什么“灵活SSL模式”会导致`ERR_TOO_MANY_REDIRECTS`？这得从“请求流转路径”说起。

### 1. 正常逻辑（无冲突时）

如果所有环节协议一致，流程应该是：  
用户访问`http://test.example.com` → Nginx发现是HTTP，通过`return 301`强制转到`https://test.example.com` → 用户最终看到HTTPS页面（无跳转循环）。

### 2. 冲突逻辑（Cloudflare“灵活模式”+Nginx强制跳转）

但Cloudflare的“灵活SSL模式”会改变请求流转：

- 浏览器→Cloudflare：用户输入`http://`，但Cloudflare会给浏览器返回`HTTPS`（让用户看起来是安全连接）；
- Cloudflare→我的服务器：Cloudflare却用`HTTP`协议访问我的服务器（“灵活模式”的特性：中间人与源服务器走HTTP）；
- 我的服务器（Nginx）：收到HTTP请求，触发`return 301`，强制让Cloudflare跳转到`HTTPS`；
- 循环开始：Cloudflare再次用HTTP访问服务器（灵活模式不变）→ Nginx再次跳转→反复循环→浏览器报错“重定向次数过多”。

### 3. 为什么“注释Nginx配置后能打开”？

当注释`return 301`后，Nginx不再强制跳转，所以：

- 浏览器用HTTP访问：Cloudflare转HTTP到服务器→Nginx直接返回内容（HTTP）；
- 浏览器用HTTPS访问：Cloudflare转HTTPS到服务器→Nginx返回内容（HTTPS）；  
  因此HTTP和HTTPS都能打开，但失去了“强制HTTPS”的安全效果。

## 四、解决方案：统一协议逻辑，让“跳转”有明确方向

解决的核心是让Cloudflare与Nginx的“协议规则”一致，避免“互相拉扯”。

### 1. 调整Cloudflare的SSL模式（最关键）

登录Cloudflare后台→进入目标域名→左侧`SSL/TLS`→`加密模式`，选择**完全（Full）** 或**严格（Full Strict）**：

- **完全（Full）**：Cloudflare与浏览器、Cloudflare与服务器之间都走HTTPS（不验证服务器证书有效性，适合自签名证书）；
- **严格（Full Strict）**：Cloudflare会验证服务器证书（需证书有效且域名匹配，推荐生产环境使用）。

**作用**：让Cloudflare与服务器之间也走HTTPS，避免Nginx收到HTTP请求后反复跳转。

### 2. 关闭Cloudflare的“始终使用HTTPS”（避免双重跳转）

在Cloudflare的`SSL/TLS`→`边缘证书`中，关闭“始终使用HTTPS”（如果开启）。

**原因**：如果Cloudflare已强制HTTPS，同时Nginx也配置强制跳转，会导致“双重跳转”（比如Cloudflare转一次，Nginx再转一次），触发循环。  

### 3. 优化Nginx配置，确保跳转逻辑清晰

保留“HTTP强制转HTTPS”的核心配置，但简化逻辑（避免多余判断）：

```
# HTTP服务器：仅处理HTTP请求，强制转HTTPS
server {
    listen 80;
    server_name test.example.com;  # 替换为你的域名

    # 核心跳转配置：HTTP→HTTPS
    return 301 https://$server_name$request_uri;
}

# HTTPS服务器：处理实际业务请求
server {
    listen 443 ssl;
    server_name test.example.com;  # 替换为你的域名

    # 证书配置（路径替换为你的证书实际路径）
    ssl_certificate /path/to/your/cert.pem;
    ssl_certificate_key /path/to/your/key.pem;

    # 其他业务配置（示例）
    root /var/www/html;
    try_files $uri $uri/ /index.html =404;

    # 反向代理配置（如果需要）
    location /api {
        proxy_pass http://127.0.0.1:3000;  # 替换为你的后端服务地址
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 4. 验证：确认问题解决

配置后按以下步骤验证：

1. 重载Nginx：`nginx -t`（测试配置）→ `nginx -s reload`（重载）；
2. 用`curl`测试：
   - 访问`http://test.example.com`，应返回`301`，且`Location`指向`https://test.example.com`；
   - 访问`https://test.example.com`，应返回`200`（正常页面）；
3. 浏览器访问：清除缓存后访问，不再出现`ERR_TOO_MANY_REDIRECTS`，且HTTP会自动转到HTTPS。

## 五、扩展：除了Cloudflare，这些情况也会导致ERR_TOO_MANY_REDIRECTS

这次问题由Cloudflare引发，但实际开发中，以下场景也可能导致相同错误，需要注意：

### 1. Nginx配置中“HTTP与HTTPS互相跳转”

比如同时配置了双向跳转，导致请求在两种协议间循环：

```
# 错误示例：双向跳转导致循环
server {
    listen 80;
    return 301 https://$server_name$request_uri;  # HTTP→HTTPS
}
server {
    listen 443 ssl;
    return 301 http://$server_name$request_uri;  # HTTPS→HTTP（错误！）
}
```

**解决**：确保跳转方向唯一（只让HTTP转HTTPS，HTTPS不跳转）。

### 2. 多个Nginx配置文件的“重复跳转”

如果服务器上有多个`server`块（比如主域名和子域名配置），且都配置了`return 301`，可能导致请求在不同配置间反复跳转。

**解决**：检查`/etc/nginx/conf.d/`下所有文件，确保只有目标域名配置了跳转规则。

### 3. 应用程序与Nginx的跳转逻辑冲突

比如Nginx强制HTTP转HTTPS，但后端应用（如PHP/Node.js）又强制把HTTPS转回HTTP（例如代码中写了`header("Location: http://...")`）。

**解决**：统一跳转逻辑（推荐用Nginx跳转，性能更好，且避免应用层干扰）。

### 4. 证书无效导致“HTTPS访问失败”

如果HTTPS证书无效（过期、域名不匹配），浏览器会拒绝访问，而Nginx又强制HTTP转HTTPS，可能被误认为“重定向错误”（实际是证书问题）。

**解决**：用`openssl s_client -connect test.example.com:443`检查证书是否有效，无效则重新签发。

### 5. 其他CDN/反向代理的“协议传递错误”

除了Cloudflare，其他CDN（如阿里云CDN、腾讯云CDN）或反向代理如果未正确传递`X-Forwarded-Proto`（协议类型），可能导致服务器误判请求协议（比如实际是HTTPS，服务器却认为是HTTP，从而强制跳转）。

**解决**：在Nginx中配置`proxy_set_header X-Forwarded-Proto $scheme;`，并让代理服务传递正确的协议头。

## 六、总结

从`ERR_TOO_MANY_REDIRECTS`错误到解决，核心是找到“谁在改写请求协议”。这次的问题源于Cloudflare的“灵活SSL模式”与Nginx的强制跳转冲突，本质是“中间代理与源服务器的协议规则不一致”。

遇到类似问题时，可按“Nginx配置→证书有效性→代理/CDN”的顺序排查，重点关注“请求流转路径中是否有协议改写”——只要确保所有环节的协议逻辑统一，就能避免“重定向循环”。

希望这篇文章能帮到遇到相同问题的同学！如果有其他排查经验，欢迎在评论区补充~  
