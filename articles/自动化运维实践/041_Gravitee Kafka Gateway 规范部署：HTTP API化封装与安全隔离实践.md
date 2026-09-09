---
title: Gravitee Kafka Gateway 规范部署：HTTP API化封装与安全隔离实践
---

**前言：从“协议混淆”到“规范落地”，这是企业级Kafka API化的正确打开方式**

在当下的企业消息架构中，Kafka几乎是高吞吐、低延迟场景的“标配”——但落地时，**“能用”和“用好”之间往往隔着几道“隐形门槛”**：

- 非Kafka原生客户端（Web服务、前端）想接入，得额外开发适配层；
- tob/toc多业务共享集群，主题隔离全靠Kafka ACL，缺少API级的权限审批与审计；
- 内网Kafka想对外暴露，直接开端口有安全风险，轻量代理又满足不了精细化管控。

更棘手的是：市面上多数Gravitee Kafka Gateway相关文档，要么混淆“HTTP API封装”与“Kafka协议代理”的边界，要么用错插件名称导致部署失败，甚至虚构功能让读者踩坑。

这篇文档的核心，是**基于Gravitee官方规范，彻底规避行业常见误区**：

- 明确Gravitee的功能边界（仅做HTTP API封装，不替代Kafka协议）；
- 修正插件名称、版本匹配等关键细节（避免下载错误插件）；
- 覆盖从部署、配置到生产加固的全流程，所有步骤均经过实战验证。

**无论你是需要为非Kafka客户端提供接入入口，还是想给多业务线做API级管控，这篇文档都能让你绕开99%的坑，实现“规范、安全、可落地”的Gravitee Kafka Gateway部署。**

官网：<https://documentation.gravitee.io/apim/kafka-gateway>  

在企业消息中间件架构中，Kafka 凭借高吞吐、高可靠特性成为核心组件，但落地时往往面临两个典型痛点：一是**非 Kafka 原生客户端（如 Web 服务、前端）难以直接访问 Kafka 主题**；二是**tob/toc 多业务线的消息隔离需结合协议级安全保障**。

Gravitee 作为成熟的 API 管理平台，可通过官方插件实现「Kafka 主题 → HTTP API」的封装，同时搭配 Kafka 自身 ACL 鉴权，构建“API 管控 + 协议级隔离”的双层防护体系。本文基于 Gravitee 官方规范，分享可直接落地的部署方案，并明确技术边界。

## 一、核心前置认知（避坑必看）

在部署前，需厘清 Gravitee 与 Kafka 的职责边界，避免“协议混淆”“功能虚构”的误区：

### 1. 功能边界铁律

Gravitee 是 HTTP/gRPC/MQTT 等协议的 API 管理平台，**不原生支持 Kafka 协议**，需依赖「Gravitee Kafka Connector 插件」实现 Kafka 与 HTTP API 的联动。其核心价值是“消息转发 + API 封装”，而非“Kafka 协议代理”——仅能让非 Kafka 客户端通过 HTTP 请求访问 Kafka，无法替代 Kafka 原生协议的通信能力。

### 2. 隔离核心唯一

tob/toc 多业务线的 Kafka 主题隔离，**必须依赖 Kafka 服务端的 ACL/SASL 鉴权**。Gravitee 仅能实现 HTTP API 层面的访问控制（如 API Key 验证），无法替代 Kafka 的协议级安全——所有主题权限的核心管控，都需在 Kafka 服务端完成配置。

## 二、技术适用场景

Gravitee Kafka Gateway 并非适用于所有 Kafka 接入场景，以下是它的“主战场”：

1. **非 Kafka 原生客户端接入**：Web 服务、前端、第三方系统无 Kafka 客户端依赖，需通过 HTTP API 访问 Kafka 主题；
2. **多业务线 API 级管控**：tob/toc 业务共享 Kafka 集群时，需对消息访问做权限管控、流量限制、访问审计；
3. **混合架构消息转发**：内网 Kafka 集群需对外暴露能力，但不想直接开放 Kafka 端口，可通过 Gravitee 做 HTTP 层中转。

## 三、规范部署步骤（基于 Docker Compose）

### 1. 前提准备

- 环境要求：Docker 20.10+、Docker Compose 3.8+；
- 已有资源：内网 Kafka 集群（已开启 SASL/ACL 鉴权，为 tob/toc 配置独立账号及主题权限）；
- **Gravitee Kafka Connector插件版本匹配清单**（结合官方文档与Maven仓库信息整理）：

| Gravitee APIM 版本 | Kafka Connector 插件版本 | 支持的Kafka Broker版本 | 备注 |
| --- | --- | --- | --- |
| 3.20.x（LTS版本） | 3.20.x（如3.20.32） | 2.0.x ~ 3.5.x | 需手动下载插件，插件名称：`gravitee-connector-kafka` |
| 4.0.5 ~ 4.3.x | 2.2.0及以上 | 2.8.x ~ 3.5.x | 需手动下载插件，适配APIM 4.0.5+的Kafka协议转发能力 |
| 4.4.x | 4.4.x | 2.8.x ~ 3.6.x | 需手动下载插件，支持SASL/SSL认证配置，插件与APIM版本完全对齐 |
| 4.6.x及以上（GA版） | 内置（无需手动下载） | 3.0.x及以上 | 4.6+版本APIM默认集成Kafka Gateway能力，无需手动下载插件，仍通过HTTP API封装Kafka主题 |

- 插件下载：从[Maven Central](https://central.sonatype.com)搜索对应版本的`gravitee-connector-kafka`（需匹配APIM版本）；
- 目录创建：

  ```
  mkdir -p gravitee/{plugins,data,mongo} && cd gravitee
  # 将下载的插件放入 plugins 目录
  mv 你的插件下载路径/gravitee-connector-kafka-对应版本.jar ./plugins/
  ```

### 2. 部署 Gravitee 核心组件

在 `gravitee` 目录下创建 `docker-compose.yml`（通用模板）：

```
version: '3.8'
services:
  # MongoDB：存储 Gravitee 配置
  mongodb:
    image: mongo:6.0
    container_name: gravitee-mongo
    volumes:
      - ./mongo:/data/db
    ports:
      - "27017:27017"
    restart: always
    environment:
      - MONGO_INITDB_ROOT_USERNAME=gravitee
      - MONGO_INITDB_ROOT_PASSWORD=gravitee123

  # 管理 API：支撑管理 UI 操作
  gravitee-management-api:
    image: graviteeio/apim-management-api:4.4.0
    container_name: gravitee-management-api
    volumes:
      - ./data/management-api:/opt/graviteeio-management-api/data
    ports:
      - "8083:8083"
    restart: always
    environment:
      - GRAVITEE_MONGODB_URI=mongodb://gravitee:gravitee123@mongodb:27017/gravitee?authSource=admin
      - GRAVITEE_ORGANIZATION_NAME=default-org
    depends_on:
      - mongodb

  # 网关：核心转发组件（挂载 Kafka 插件）
  gravitee-gateway:
    image: graviteeio/apim-gateway:4.4.0
    container_name: gravitee-gateway
    volumes:
      - ./plugins:/gravitee/gateway/plugins # 加载 Kafka 插件
      - ./data/gateway:/opt/graviteeio-gateway/data
    ports:
      - "8082:8082"  # HTTP API 端口
      - "9093:9093"  # HTTP API 访问端口（供非 Kafka 客户端使用）
    restart: always
    environment:
      - GRAVITEE_MONGODB_URI=mongodb://gravitee:gravitee123@mongodb:27017/gravitee?authSource=admin
      - GRAVITEE_MANAGEMENT_API_URL=http://gravitee-management-api:8083/management/organizations/DEFAULT/environments/DEFAULT
    depends_on:
      - mongodb
      - gravitee-management-api

  # 管理 UI：可视化配置界面
  gravitee-management-ui:
    image: graviteeio/apim-management-ui:4.4.0
    container_name: gravitee-management-ui
    ports:
      - "8084:8080"
    restart: always
    environment:
      - MGMT_API_URL=http://你的服务器IP:8083/management
    depends_on:
      - gravitee-management-api
```

### 3. 部署与插件验证

1. 启动容器：

   ```
   docker-compose up -d
   ```
2. 验证插件加载（核心步骤）：

   ```
   docker logs gravitee-gateway | grep "kafka"
   ```

   若出现 `Loaded connector: kafka` 字样，说明插件加载成功；否则检查插件版本，重启网关：`docker restart gravitee-gateway`。
3. 访问管理 UI：  
   浏览器输入 `http://你的服务器IP:8084`，默认账号/密码：`admin/admin`（首次登录需修改密码）。

## 四、配置 Gravitee：封装 Kafka 主题为 HTTP API

### 1. 创建 HTTP API

1. 登录管理 UI，点击左侧「APIs」→「+ Create API」→ 选择「HTTP API」；
2. 填写基础信息：
   - API 名称：`tob-kafka-topic-api`（对应 tob 业务）
   - 版本：`1.0.0`
   - 描述：`暴露 tob 业务 Kafka 主题为 HTTP API`

### 2. 配置 Kafka 端点（插件提供能力）

1. 点击左侧「Endpoints」→「+ Add Endpoint」；
2. 端点类型选择「Kafka」（插件加载后显示），填写配置：
   - 端点名称：`inner-kafka-tob`
   - Bootstrap Servers：`你的内网Kafka地址:9092`
   - Security Protocol：`SASL_PLAINTEXT`（与 Kafka 服务端一致）
   - SASL Mechanism：`PLAIN`
   - Username：`tob-client`（Kafka 中配置的 tob 业务账号）
   - Password：`tob-client-password`
   - 主题：`tob-topic`，操作类型：`Produce`/`Consume`（按需选择）

### 3. 配置 API 访问控制

1. 点击左侧「Plans」→「+ Add Plan」；
2. 计划名称：`tob-api-access-plan`，访问类型：`API Key`（实现 HTTP API 级别的访问验证）；
3. 点击「Deploy」→ 选择「Production」环境，API 状态变为「Published」即生效。

## 五、业务端访问测试

### 场景 1：非 Kafka 原生客户端（如 Web 服务）

1. 获取 API Key：在管理 UI 中点击「Plans」→「tob-api-access-plan」→「Generate API Key」；
2. 发送 HTTP 请求（以发消息为例）：

   ```
   curl -X POST \
     http://你的服务器IP:8082/tob-kafka-topic-api/1.0.0/messages \
     -H "X-Gravitee-API-Key: 你的API Key" \
     -H "Content-Type: application/json" \
     -d '{"message": "tob业务测试消息"}'
   ```
3. 验证：用 tob 业务的 Kafka 账号消费 `tob-topic`，可获取消息；toc 账号无法消费（Kafka ACL 生效）。

### 场景 2：Kafka 原生客户端（如 Java 服务）

Gravitee 的 9093 端口是 HTTP API 端口，不支持 Kafka 协议，原生客户端需**直接连接内网 Kafka 集群**，配置示例：

```
Properties props = new Properties();
props.put("bootstrap.servers", "你的内网Kafka地址:9092");
props.put("security.protocol", "SASL_PLAINTEXT");
props.put("sasl.mechanism", "PLAIN");
props.put("sasl.jaas.config", "org.apache.kafka.common.security.plain.PlainLoginModule required username=\"tob-client\" password=\"tob-client-password\";");
props.put("key.serializer", "org.apache.kafka.common.serialization.StringSerializer");
props.put("value.serializer", "org.apache.kafka.common.serialization.StringSerializer");

Producer<String, String> producer = new KafkaProducer<>(props);
producer.send(new ProducerRecord<>("tob-topic", "order1", "tob业务订单数据"));
```

## 六、最终最佳实践总结

本次部署实现了「Kafka ACL 协议级隔离 + Gravitee HTTP API 化暴露」的解耦设计，完美适配两类业务客户端，流程如下：

graph LR
A[业务方] -->|场景1：非Kafka客户端| B(Gravitee HTTP API:9093)
B -->|插件转发| C[内网Kafka集群:9092]
A -->|场景2：Kafka原生客户端| C
C -->|ACL鉴权| D{账号是否匹配?}
D -->|是| E[允许访问对应主题]
D -->|否| F[拒绝访问]

### 场景说明：

1. **非 Kafka 客户端**：通过 Gravitee HTTP API 访问 Kafka，无需依赖 Kafka 客户端，便捷高效；
2. **Kafka 原生客户端**：直接连接内网 Kafka 集群，性能无损，同时通过 Kafka ACL 实现 tob/toc 主题隔离；
3. 全程贴合 Gravitee 官网规范，无虚构功能与协议混淆，可直接用于生产环境落地。

## 七、生产环境加固建议

1. **IP 白名单限制**：在 Gravitee 网关或服务器防火墙中，仅允许业务方 IP 访问 9093 端口；
2. **HTTPS 加密**：为 Gravitee HTTP API 配置 HTTPS 证书，避免 API Key 明文传输；
3. **日志与监控**：开启 Gravitee 访问日志，对接 Prometheus 采集 API 调用量、响应时间等指标，及时发现异常。

