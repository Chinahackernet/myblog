# Jmeter部署(源码+docker)

> 分类：CI/CD / 第4章：Jmeter自动化测试
> 原文：https://www.cuiliangblog.cn/detail/section/173491430
> 来源：崔亮的博客

---

# 源码部署jmeter
## 安装jdk
```bash
[root@jmeter ~]# dnf install java-17-openjdk -y 
[root@jmeter ~]# java -version
openjdk version "17.0.11" 2024-04-16 LTS
OpenJDK Runtime Environment (Red_Hat-17.0.11.0.9-3) (build 17.0.11+9-LTS)
OpenJDK 64-Bit Server VM (Red_Hat-17.0.11.0.9-3) (build 17.0.11+9-LTS, mixed mode, sharing)
```

## 安装<font style="color:rgb(77, 77, 77);">Jmeter</font>
下载地址：[https://jmeter.apache.org/download_jmeter.cgi](https://jmeter.apache.org/download_jmeter.cgi)

### 安装软件包
```bash
[root@jmeter ~]# wget https://dlcdn.apache.org//jmeter/binaries/apache-jmeter-5.6.3.tgz
[root@jmeter ~]# tar -zxf apache-jmeter-5.6.3.tgz 
[root@jmeter ~]# mv apache-jmeter-5.6.3 /opt/jmeter
[root@jmeter ~]# cd /opt/jmeter/
[root@jmeter jmeter]# ls
bin  docs  extras  lib  LICENSE  licenses  NOTICE  printable_docs  README.md
```

### 配置环境变量
```bash
[root@jmeter jmeter]# vim /etc/profile
export JMETER_HOME=/opt/jmeter
export CLASSPATH=$JMETER_HOME/lib/ext/ApacheJMeter_core.jar:$JMETER_HOME/lib/jorphan.jar:$CLASSPATH
export PATH=$JMETER_HOME/bin:$PATH
[root@jmeter bin]# source /etc/profile
```

### 验证
```bash
[root@jmeter bin]# jmeter -v
WARN StatusConsoleListener The use of package scanning to locate plugins is deprecated and will be removed in a future release
WARN StatusConsoleListener The use of package scanning to locate plugins is deprecated and will be removed in a future release
WARN StatusConsoleListener The use of package scanning to locate plugins is deprecated and will be removed in a future release
WARN StatusConsoleListener The use of package scanning to locate plugins is deprecated and will be removed in a future release
    _    ____   _    ____ _   _ _____       _ __  __ _____ _____ _____ ____
   / \  |  _ \ / \  / ___| | | | ____|     | |  \/  | ____|_   _| ____|  _ \
  / _ \ | |_) / _ \| |   | |_| |  _|    _  | | |\/| |  _|   | | |  _| | |_) |
 / ___ \|  __/ ___ \ |___|  _  | |___  | |_| | |  | | |___  | | | |___|  _ <
/_/   \_\_| /_/   \_\____|_| |_|_____|  \___/|_|  |_|_____| |_| |_____|_| \_\ 5.6.3

Copyright (c) 1999-2024 The Apache Software Foundation
```

# docker部署jmeter
由于官方并未提供jmeter镜像，且第三方镜像版本较老，因此推荐构建自定义镜像完成部署。

## 构建镜像
```bash
[root@jmeter ~]# cat Dockerfile
# FROM openjdk:17-jdk-alpine
FROM harbor.local.com/library/openjdk:17-jdk-alpine
ENV JMETER_HOME /opt/jmeter
ENV PATH $JMETER_HOME/bin:$PATH
ENV CLASSPATH $JMETER_HOME/lib/ext/ApacheJMeter_core.jar:$JMETER_HOME/lib/jorphan.jar:$CLASSPATH
COPY apache-jmeter-5.6.3.tgz /tmp/
RUN tar -zxf /tmp/apache-jmeter-5.6.3.tgz -C /tmp \
  && mv /tmp/apache-jmeter-5.6.3 /opt/jmeter \
  && rm -rf /tmp/apache-jmeter-5.6.3.tgz
CMD ["jmeter","-v"]
[root@jmeter ~]# docker build -t harbor.local.com/cicd/jmeter:5.6.3 .
```

## 验证
```bash
[root@jmeter ~]# docker run harbor.local.com/cicd/jmeter:5.6.3
WARN StatusConsoleListener The use of package scanning to locate plugins is deprecated and will be removed in a future release
WARN StatusConsoleListener The use of package scanning to locate plugins is deprecated and will be removed in a future release
WARN StatusConsoleListener The use of package scanning to locate plugins is deprecated and will be removed in a future release
WARN StatusConsoleListener The use of package scanning to locate plugins is deprecated and will be removed in a future release
Jun 13, 2024 5:04:59 AM java.util.prefs.FileSystemPreferences$1 run
INFO: Created user preferences directory.
    _    ____   _    ____ _   _ _____       _ __  __ _____ _____ _____ ____
   / \  |  _ \ / \  / ___| | | | ____|     | |  \/  | ____|_   _| ____|  _ \
  / _ \ | |_) / _ \| |   | |_| |  _|    _  | | |\/| |  _|   | | |  _| | |_) |
 / ___ \|  __/ ___ \ |___|  _  | |___  | |_| | |  | | |___  | | | |___|  _ <
/_/   \_\_| /_/   \_\____|_| |_|_____|  \___/|_|  |_|_____| |_| |_____|_| \_\ 5.6.3

Copyright (c) 1999-2024 The Apache Software Foundation
```


