# Tomcat 应用容器与集群

生产部署应固定 JDK、Tomcat 和应用版本，分离 `CATALINA_BASE`、日志、临时目录和应用数据。通过 Nginx/HAProxy 将流量转发到多个实例。

```bash
${CATALINA_HOME}/bin/catalina.sh version
curl -fsS http://127.0.0.1:8080/health
jcmd <PID> VM.flags
```

会话优先外置到 Redis/数据库或采用无状态设计；发布使用滚动、健康检查和可回滚制品。
