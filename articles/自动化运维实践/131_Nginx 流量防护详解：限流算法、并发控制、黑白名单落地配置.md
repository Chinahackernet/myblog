---
title: Nginx 流量防护详解：限流算法、并发控制、黑白名单落地配置
---

## 前言：

在高并发场景下，Nginx 不仅是静态资源服务和反向代理的利器，更是抵御恶意流量、保障服务稳定性的第一道防线。面对突发请求洪峰、单 IP 大量占用连接、爬虫滥用接口、大文件下载拖垮带宽等问题，合理运用 Nginx 的内建模块就能实现细粒度的访问控制，无需引入额外的第三方组件。

本文将围绕四个最常用的流量控制维度展开：

- 限制请求处理速率（`limit_req`）
- 限制并发连接数（`limit_conn`）
- 设置 IP 黑白名单（`allow` / `deny`）
- 限制数据传输速度（`limit_rate`）

针对每个模块，都会给出从定义区域到应用规则的完整配置示例，并解析关键参数的实际含义。通过组合这些策略，你可以构建一个既灵活又稳健的流量管控体系，让服务在高负载下依然从容运行。

## 一、限制请求处理速率

**使用模块：`ngx_http_limit_req_module`（HTTP 请求限制模块）**

要限制客户端请求的处理频率，可以使用 `limit_req` 指令。该指令依赖于预先定义的共享内存区域（zone）来跟踪请求速率。

**① 定义限速区域**  
在 `http` 块中通过 `limit_req_zone` 指令声明一个限速区域，通常以客户端 IP 地址作为区分键。

```
http {
    limit_req_zone $binary_remote_addr zone=mylimit:10m rate=1r/s;
    ...
}
```

参数说明：

- `$binary_remote_addr`：以二进制形式存储的客户端 IP，用于节省内存。
- `zone=mylimit:10m`：创建名为 `mylimit` 的共享内存区域，大小为 10 MB。
- `rate=1r/s`：限制每秒最多处理 1 个请求。

**② 应用限速规则**  
在 `server` 或 `location` 块中使用 `limit_req` 启用限制。

```
server {
    ...
    location / {
        limit_req zone=mylimit burst=5;
        ...
    }
    ...
}
```

参数说明：

- `zone=mylimit`：引用之前定义的限速区域。
- `burst=5`：允许在速率超限后临时突发最多 5 个请求。这些请求会被排队而不会被立刻拒绝；如果队列已满，后续请求将返回 503 错误。

> 提示：如果需要限制文件传输速度，可参考第四部分中 `limit_rate` 的相关配置。

## 二、限制并发连接数

**使用模块：`ngx_http_limit_conn_module`（HTTP 连接限制模块）**

要限制同一时刻的并发连接数，可以借助 `limit_conn` 模块，根据客户端 IP 或其它键值进行约束。

**① 定义连接限制区域**  
在 `http` 块中使用 `limit_conn_zone` 指令定义共享内存区域。

```
http {
    limit_conn_zone $binary_remote_addr zone=addr:10m;
    ...
}
```

参数说明：

- `$binary_remote_addr`：以二进制 IP 作为区分键。
- `zone=addr:10m`：定义名为 `addr` 的区域，大小为 10 MB。

**② 应用连接限制规则**  
在 `server` 或 `location` 块中使用 `limit_conn` 指令指定最大并发连接数。

```
server {
    ...
    location / {
        limit_conn addr 10;
        ...
    }
    ...
}
```

参数说明：

- `addr`：对应 `limit_conn_zone` 中定义的区域名称。
- `10`：同一键值下的最大并发连接数。

## 三、设置黑白名单

**涉及模块：`ngx_http_access_module`（基础访问控制），可结合 `ngx_http_geo_module`、`ngx_http_map_module` 实现动态规则**

黑白名单通过 `allow` 和 `deny` 指令即可实现，Nginx 会按配置顺序依次匹配，匹配到第一条规则后即停止。

**① 黑名单（禁止特定 IP）**  
在 `server` 或 `location` 块中使用 `deny` 屏蔽 IP。

```
server {
    ...
    location / {
        deny 192.168.1.100;
        deny 192.168.1.101;
        ...
    }
    ...
}
```

**② 白名单（仅允许特定 IP）**  
先通过 `allow` 放行指定 IP，再使用 `deny all;` 拒绝其余所有访问。

```
server {
    ...
    location / {
        allow 192.168.1.100;
        deny all;
        ...
    }
    ...
}
```

**③ 组合规则与动态管理**

- **复杂静态规则**：可将多个 `allow` 和 `deny` 指令搭配使用，注意把 `allow` 放在 `deny` 前，确保白名单优先匹配。
- **动态黑白名单**：对于需要频繁更新、或基于地理位置等条件的名单，可借助 `ngx_http_geo_module` 和 `ngx_http_map_module` 生成变量，再配合 `if` 或 `deny`/`allow` 动态控制；也可使用外部脚本生成配置文件并重载 Nginx。如需根据 IP 归属地实现黑白名单，还可引入 `ngx_http_geoip_module`。

## 四、限制数据传输速度

**使用模块：`ngx_http_core_module`（HTTP 核心模块）**

限制传输速度主要指对客户端下载响应的带宽进行控制，常用 `limit_rate` 和 `limit_rate_after` 指令实现。

**① 直接限速**  
在目标 `location` 中设置速度上限，并可指定在传输一定数据量后才开始限速。

```
location /download/ {
    limit_rate_after 500k;
    limit_rate 50k;
    ...
}
```

参数说明：

- `limit_rate_after 500k`：传输前 500 KB 不限速，之后启用限制。
- `limit_rate 50k`：限制速度为每秒 50 KB。

**② 通过请求速率间接控制传输量**  
第一部分介绍的 `limit_req` 模块虽然主要限制请求频率，但也能间接控制单位时间内的数据吞吐量。例如限制每秒最多 6 个请求，可防止某客户端占用过多带宽。

```
http {
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=6r/s;
    ...
    server {
        ...
        location /api/ {
            limit_req zone=api_limit;
            ...
        }
    }
}
```

> 如需更精细的传输控制（如针对不同用户分级限速），可查阅 Nginx 官方文档或社区提供的第三方模块。

---

## 五、总结

Nginx 提供了轻量且高效的流量管理能力，以上四类模块分别对应不同的控制维度：

- **`limit_req`（请求速率）**：从时间维度限制请求频率，适合防止接口被高频调用或 CC 攻击。通过 `rate` 和 `burst` 参数可在“刚性限速”与“允许突发”之间取得平衡。
- **`limit_conn`（并发连接数）**：从并发维度控制同时建立的连接，能有效避免单一 IP 占用过多服务器资源，保护后端服务的稳定性。
- **`allow/deny`（黑白名单）**：基于 IP 地址的直接访问控制，可作为最基础的防御手段。结合 `geo` 或 `map` 模块还能实现动态名单和地理位置过滤。
- **`limit_rate`（传输速度）**：对下载类的响应带宽进行约束，避免大文件传输耗尽出口带宽，影响其他正常业务。

在实际生产环境中，这些策略往往需要**组合使用**。例如，对 API 路径同时施加请求速率限制和并发连接限制，能在总量和频率上双重保护；而将白名单与限速搭配，则可以为核心合作方提供高优先级服务的同时，对普通用户执行限速。

配置时需要注意以下几点：

- **共享内存大小**：`zone` 的大小应与预期的客户端数量相匹配，过小会导致状态无法存储而限速失效。
- **规则顺序**：`allow` 和 `deny` 按书写顺序匹配，白名单务必在前。
- **突发队列**：合理的 `burst` 值可以平滑削峰，避免误伤正常用户；如需无缓冲拒绝，可结合 `nodelay` 参数。
- **监控与调优**：上线后应结合日志与监控数据，观察限速触发情况，根据实际流量调整阈值。

合理运用 Nginx 的内建模块，无需引入第三方组件就能构建出灵活稳健的访问控制体系，是保障服务高可用和安全运行的重要一环。  
