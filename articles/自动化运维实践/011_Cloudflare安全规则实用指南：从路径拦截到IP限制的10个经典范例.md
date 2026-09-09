---
title: Cloudflare安全规则实用指南：从路径拦截到IP限制的10个经典范例
---

**前言：在Cloudflare的安全防护体系中，自定义规则是抵御特定威胁的“精准武器”。除了基础的路径拦截，日常运维中还有许多高频场景需要针对性配置。本文将通过`10个实用范例`，带你掌握Cloudflare规则的灵活用法，覆盖路径防护、IP管控、请求频率限制、UA过滤、地域封锁等核心需求，构建更全面的安全防护网。**

## 一、基础范例：无视大小写拦截特定URL路径

（适用场景：阻止注册页、测试接口等敏感路径的访问）

### 需求

拦截 `https://your-domain.com/user/register` 及其所有大小写变种（如 `/User/Register`、`/USER/REGISTER`），但允许同域名其他路径正常访问。

### 规则表达式

```
(http.host eq "your-domain.com" and lower(http.request.uri.path) eq "/user/register")
```

### 逻辑解析

- `lower(http.request.uri.path)`：将请求的URI路径转为小写（如 `/User/Register` → `/user/register`）；
- 与目标路径 `/user/register` 精准匹配，无论原始路径大小写如何，均能触发拦截。

### 动作设置

选择“阻止（Block）”，拦截所有命中该规则的请求。

## 二、拦截敏感文件访问（如配置文件、备份文件）

（适用场景：防止 `.env`、`.sql` 等敏感文件被恶意爬取）

### 需求

禁止访问网站根目录下的配置文件（如 `.env`、`config.ini`）、数据库备份文件（如 `backup.sql`），无论这些文件是否实际存在（提前阻断探测行为）。

### 规则表达式

```
(http.host eq "your-domain.com" and 
 (http.request.uri.path ends_with ".env" or 
  http.request.uri.path ends_with ".ini" or 
  http.request.uri.path ends_with ".sql"))
```

### 逻辑解析

- `ends_with` 函数：匹配“以特定后缀结尾”的路径（如 `/admin/.env`、`/backup/2023.sql` 均会被命中）；
- 通过 `or` 连接多个条件，一次性覆盖多种敏感文件类型。

### 动作设置

选择“阻止（Block）”，并建议在“高级选项”中勾选“返回403状态码”，避免暴露文件是否存在的信息。

## 三、限制特定IP段访问后台管理路径

（适用场景：仅允许公司内网IP访问 `/admin` 等管理后台）

### 需求

仅允许 `192.168.1.0/24`（内网段）访问 `https://your-domain.com/admin` 路径，其他IP访问时直接拦截。

### 规则表达式

```
(http.host eq "your-domain.com" and 
 http.request.uri.path starts_with "/admin" and 
 not ip.src in {192.168.1.0/24})
```

### 逻辑解析

- `starts_with "/admin"`：匹配所有以 `/admin` 开头的路径（如 `/admin/login`、`/admin/user`）；
- `ip.src in {192.168.1.0/24}`：判断请求IP是否在内网段内；
- `not` 取反：仅当IP不在允许段且访问 `/admin` 路径时，规则触发。

### 动作设置

选择“阻止（Block）”，非内网IP访问管理后台时会被直接拦截。

## 四、阻止恶意User-Agent的请求

（适用场景：拦截爬虫、扫描工具等恶意客户端的访问）

### 需求

禁止包含“sqlmap”“nmap”“masscan”等关键词的User-Agent访问网站（这些通常是黑客扫描工具的标识）。

### 规则表达式

```
(http.host eq "your-domain.com" and 
 (lower(http.user_agent) contains "sqlmap" or 
  lower(http.user_agent) contains "nmap" or 
  lower(http.user_agent) contains "masscan"))
```

### 逻辑解析

- `http.user_agent`：获取请求头中的客户端标识（如浏览器、爬虫的名称）；
- `lower()` 函数：统一转为小写，避免因大小写差异漏判（如“SqlMap”“SQLMAP”均会被匹配）；
- `contains`：判断User-Agent中是否包含指定关键词。

### 动作设置

选择“阻止（Block）”，或“挑战（Challenge）”（要求验证验证码），根据防护严格程度选择。

## 五、限制API接口的请求频率（防滥用）

（适用场景：防止 `/api` 接口被恶意调用导致服务器过载）

### 需求

对 `https://your-domain.com/api` 路径设置频率限制：单个IP每分钟最多请求60次，超过则临时拦截。

### 规则表达式

```
(http.host eq "your-domain.com" and 
 http.request.uri.path starts_with "/api" and 
 ratelimit(ip.src, 1m) > 60)
```

### 逻辑解析

- `ratelimit(ip.src, 1m) > 60`：统计单个IP（`ip.src`）在1分钟（`1m`）内的请求次数，超过60次则触发规则；
- 结合 `starts_with "/api"`，仅对API路径生效，不影响网站其他页面。

### 动作设置

选择“临时拦截（Block for 10 minutes）”，或“速率限制（Rate Limit）”（Cloudflare会自动返回429状态码）。

## 六、禁止非浏览器 UA 批量抓取

（适用场景：防止无浏览器标识的脚本爬虫批量爬取数据，减少内容盗用或服务器资源消耗）

### 需求

当请求的User-Agent（客户端标识）不包含常见浏览器关键字（如Mozilla、Chrome）时，触发验证机制，筛选合法用户与脚本爬虫。

### 规则表达式

```
(http.host eq "your-domain.com" and not http.request.headers["user-agent"] matches "(Mozilla|Chrome|Safari|Edg)")
```

### 逻辑解析

- `http.request.headers["user-agent"]`：精准提取请求头中的UA字段；
- `matches "(Mozilla|Chrome|Safari|Edg)"`：通过正则匹配UA是否包含常见浏览器核心标识（几乎所有主流浏览器UA均以“Mozilla”开头，Chrome、Safari等为具体浏览器名称）；
- `not` 取反：仅当UA不包含上述关键字时，规则触发（排除合法浏览器，锁定脚本爬虫）。

### 动作设置

选择“Managed Challenge”（托管挑战）：

- 对疑似爬虫的请求弹出验证码或JS验证，合法用户完成验证后可正常访问；
- 相比直接“Block”，大幅降低误杀风险（避免拦截特殊浏览器或合法工具）。

## 七、封锁特定国家或地区

（适用场景：屏蔽业务不覆盖、恶意流量高发的国家/地区，如境外攻击源、无目标用户的地区）

### 需求

根据业务需求，直接阻断来自中国（CN）、俄罗斯（RU）等特定国家/地区的所有访问（可根据实际风险调整国家列表）。

### 规则表达式

```
(http.host eq "your-domain.com" and (ip.geoip.country eq "CN" or ip.geoip.country eq "RU"))
```

### 逻辑解析

- `ip.geoip.country`：Cloudflare内置的地理定位字段，返回请求IP对应的**两位大写国家代码**（如中国为CN、美国为US、日本为JP，完整代码可参考Cloudflare官方文档）；
- `eq "CN" or eq "RU"`：通过逻辑“或”匹配多个目标国家，可根据需求增减（如新增“KP”“IR”等）；
- 需确保域名已开启Cloudflare地理定位功能（默认开启，无需额外配置）。

### 动作设置

- 严格防护：选择“Block”，直接返回403状态码，拒绝该地区所有请求；
- 宽松防护：可改为“Challenge”，允许该地区的合法用户通过验证访问（适合业务可能覆盖部分用户的场景）。

## 八、阻止空 Referer 的 POST 请求

（适用场景：防范CSRF（跨站请求伪造）攻击，POST请求通常用于提交敏感数据（如表单、支付），空Referer是CSRF的典型特征之一）

### 需求

仅拦截“POST方法+Referer为空”的请求，不影响GET方法（GET请求可能存在合法空Referer场景，如直接输入URL访问）。

### 规则表达式

```
(http.host eq "your-domain.com" and http.request.method eq "POST" and not http.request.headers["referer"] exists)
```

### 逻辑解析

- `http.request.method eq "POST"`：锁定提交数据的请求方法，GET/DELETE等方法不触发；
- `not http.request.headers["referer"] exists`：判断请求头中是否缺少“Referer”字段（空Referer包含“Referer字段不存在”或“字段值为空”两种情况，此表达式可覆盖两者）；
- 合法POST请求通常会携带Referer（标识请求来源页面），空Referer大概率为恶意伪造请求。

### 动作设置

选择“Block”：直接阻断空Referer的POST请求，避免恶意提交数据，降低CSRF攻击风险。

## 九、限制 URL 路径深度（防目录遍历）

（适用场景：防止“目录遍历攻击”，即黑客通过构造 `../../../etc/passwd` 等路径，试图读取服务器系统文件或敏感目录）

### 需求

当请求的URL路径层级≥6时触发拦截，避免路径过深导致的遍历风险（正常业务路径层级通常较少，如 `/user/profile` 层级为3）。

### 规则表达式

```
(http.host eq "your-domain.com" and length(split(lower(http.request.uri.path), "/")) ge 6)
```

### 逻辑解析

- `split(lower(http.request.uri.path), "/")`：将路径按“/”分割为数组（如 `/a/b/c/d/e/f` 分割后为 `["", "a", "b", "c", "d", "e", "f"]`），`lower()` 函数统一小写，避免路径大小写干扰；
- `length(...) ge 6`：计算分割后的数组长度，≥6即触发规则（上述例子数组长度为7，满足条件）；
- 路径层级的计算：数组长度-1（因路径开头的“/”会导致第一个元素为空），如数组长度6对应实际层级5，可根据业务调整“ge 6”中的数值（如业务路径最深为4层，可设为“ge 5”）。

### 动作设置

选择“Block”：直接拦截过深路径的请求，从源头阻止目录遍历攻击。

## 十、限速登录接口（基于路径+方法）

（适用场景：防止登录接口被“暴力破解”，即黑客通过批量尝试账号密码的方式非法登录）

### 需求

对 `/api/login` 路径的POST请求（登录接口通常为POST提交账号密码）设置严格速率限制：单个IP每分钟最多尝试10次，超过则临时拦截。

### 规则配置

#### 1. 规则表达式（定位登录接口）

```
(http.host eq "your-domain.com" and http.request.uri.path eq "/api/login" and http.request.method eq "POST")
```

#### 2. 速率限制设置（需在Cloudflare“WAF → Rate limiting rules”中单独创建）

| 限制维度 | 数值 | 说明 |
| --- | --- | --- |
| 统计对象 | 单个IP（ip.src） | 防止单IP高频尝试 |
| 时间窗口 | 1分钟（1m） | 短窗口快速响应暴力破解 |
| 最大请求数 | 10次 | 可根据业务调整（如5次/1分钟，更严格） |

### 逻辑解析

- 精准定位：通过“路径（/api/login）+方法（POST）”双重条件，仅对登录接口生效，不影响其他API；
- 速率限制：相比普通自定义规则的`ratelimit`函数，Cloudflare“Rate limiting rules”支持更灵活的配置（如阶梯限速、自定义响应码），更适合登录这类高敏感接口。

### 动作设置

选择“Block”：超过10次/分钟的IP将被临时拦截（默认返回429状态码），可在规则中设置拦截时长（如10分钟），限制黑客持续尝试。  

## 十一、规则配置的通用注意事项

1. **代理状态检查**：确保域名的DNS解析为“橙色云”（通过Cloudflare代理），否则规则无法生效；
2. **执行顺序**：拦截类规则需放在“允许类规则”之前（可在Cloudflare控制台拖动调整），避免允许规则优先触发导致拦截失效；
3. **测试验证**：通过 `curl -v 目标URL` 模拟请求（如指定空Referer、修改UA），或使用Cloudflare“规则测试器”（Rules Tester）验证规则是否精准命中；
4. **日志跟踪**：在“分析和日志 > Log Explorer”中搜索规则名称，查看拦截记录，确认是否存在误杀（如合法用户被拦截需调整规则条件）；
5. **业务适配**：所有规则需结合业务场景调整（如路径深度、速率限制数值），避免因规则过严影响正常用户访问。

## 总结

Cloudflare自定义规则的核心是“精准匹配 + 灵活动作”：通过路径、IP、UA、地理定位、请求方法等维度组合条件，再搭配Block/Challenge/Rate Limit等动作，可覆盖从基础拦截到高级防护的全场景需求。

本文的10个范例涵盖了“爬虫防护、地域封锁、CSRF防御、暴力破解防护、目录遍历防护”等高频场景，实际配置时可进一步组合条件（如“IP地域+路径+速率限制”），构建更严密的安全防护体系。同时，需定期查看规则日志，根据攻击趋势调整条件，确保防护效果与用户体验的平衡。  
