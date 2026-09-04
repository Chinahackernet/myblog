# Tomcat 安装、配置与应用部署

## 安装基线

固定 JDK/Tomcat 补丁，使用专用用户和独立 `CATALINA_BASE`，日志、临时目录、应用目录和配置分离。管理端口、AJP 和 shutdown 端口只允许本机或管理网访问。

```bash
useradd --system --home /opt/tomcat tomcat; tar -xf apache-tomcat.tar.gz -C /opt/tomcat --strip-components=1; sudo -u tomcat /opt/tomcat/bin/catalina.sh version
```

WAR 发布前验证 context path、数据源、JNDI、静态资源和迁移脚本；不要把数据库密码写入 WAR。Session 优先外置或无状态化，复制集群需评估序列化、网络和 GC 成本。

采用版本目录和符号链接，先在一台节点部署并执行健康/合成交易，再滚动其他节点。停止时等待连接排空和会话迁移；回滚应用前确认 schema 向前兼容。

