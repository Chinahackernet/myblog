这里以`RocketMQ4.3.0`为例，另外这里以rocketmq单机版来做说明(集群版只是在配置上有所改变，在安装上并无差别)

## 一、安装RocketMQ

### 1.安装要求

  

```
系统要求：64位操作系统(推荐使用Linux和MacOS)
编程环境：JDK1.8+
包管理工具：Maven
```

  

### 2.源码安装

  

(1)下载源码并解压

  

```
wget http://mirror.bit.edu.cn/apache/rocketmq/4.3.0/rocketmq-all-4.3.0-source-release.zip
unzip rocketmq-all-4.3.0-source-release.zip
```

  

(2)打包编译安装

  

```
cd rocketmq-all-4.3.0/
mvn -Prelease-all -DskipTests clean install -U
```

  

扩展知识：

  

注：-P参数是设置环境变量的，对应maven配置中profiles中的环境或环境变量。

  

\-D参数为maven设置命令行属性，如

  

```
mvn -DpropertyName=propertyValue
```

  

如果pom.xml中已经存在propertyName这个属性，则使用pom.xml中对应的这个属性的值；如果在pom.xml不存在这个属性

那么则使用命令行中对应这个属性的值

### 3.设置安装目录

  

通过第２步，RocketMQ编译生成的文件在源码包distribution/target/apache-rocketmq下，为了以后管理方便，可将此

目录移动到相应的软件目录下，如/usr/local下

  

```
cd distribution/target/
mv apache-rocketmq /usr/local/rocketmq
```

  

### 4.目录介绍

  

```
benchmark : 基准测试的脚本
bin : 操作和管理RocketMQ的脚本
conf : 配置文件
lib : RocketMQ依赖的类包文件
```

  

## 二.RocketMQ的基本操作

### 1.启动RocketMQ

(1)启动Name Server

  

```
cd /usr/local/rocketmq
nohup sh bin/mqnamesrv &
```

  

可通过 tail -f ~/logs/rocketmqlogs/namesrv.log或jps来查看nameserver是否启动成功

(2)启动borker

  

```
nohup sh bin/mqbroker -n localhost:9876 &
```

  

可通过 tail -f ~/logs/rocketmqlogs/broker.log或jps来查看nameserver是否启动成功

  

```
启动broker常见的问题之一：因为内存限制，无法启动
```

  

解决方案：修改bin/runserver.sh和bin/runbroker.sh中的内存参数设置

  

第一步：修改runserver.sh中的JVM参数：

  

原参数值：

  

```
JAVA_OPT="${JAVA_OPT} -server -Xms4g -Xmx4g -Xmn2g -XX:MetaspaceSize=128m -XX:MaxMetaspaceSize=320m"
```

  

修改后的参数值：

  

```
JAVA_OPT="${JAVA_OPT} -server -Xms128m -Xmx128m -Xmn128m -XX:MetaspaceSize=128m -XX:MaxMetaspaceSize=128m"
```

  

注：根据服务器配置自行设置

  

第二步：修改runborker.sh中的JVM参数

  

原参数值：

  

```
JAVA_OPT="${JAVA_OPT} -server -Xms8g -Xmx8g -Xmn4g"
```

  

修改后的参数值：

  

```
JAVA_OPT="${JAVA_OPT} -server -Xms128m -Xmx128m -Xmn128m"
```

  

### 2.关闭服务

(1)关闭borker服务

  

```
sh bin/mqshutdown broker
```

  

(2)关闭nameserver服务

  

```
sh bin/mqshutdown namesrv
```

  

### 3.使用脚本管理rocketmq

(1)编写管理脚本命令:rocketmq.sh

  

```
#!/usr/bin/env bash
#
# rocketmq - this script starts and stops the rocketmq daemon
#
# chkconfig:   - 85 15
ROCKETMQ_HOME=/usr/local/rocketmq
ROCKETMQ_BIN=${ROCKETMQ_HOME}/bin
ADDR=`hostname -i`:9876
LOG_DIR=${ROCKETMQ_HOME}/logs
NAMESERVER_LOG=${LOG_DIR}/namesrv.log
BROKER_LOG=${LOG_DIR}/broker.log
start() {
    if [ ! -d ${LOG_DIR} ];then
        mkdir ${LOG_DIR}
    fi
    cd ${ROCKETMQ_HOME}
    nohup sh bin/mqnamesrv > ${NAMESERVER_LOG} 2>&1 &
    echo -n "The Name Server boot success..."
    nohup sh bin/mqbroker -n ${ADDR} > ${BROKER_LOG} 2>&1 &
    echo -n "The broker[%s, ${ADDR}] boot success..."
}
stop() {
    cd ${ROCKETMQ_HOME}
    sh bin/mqshutdown broker
    sleep 1
    sh bin/mqshutdown namesrv
}
restart() {
    stop
    sleep 5
    start
}
case "$1" in
    start)
        start
        ;;
    stop)
        stop
        ;;
    restart)
        restart
        ;;
    *)
        echo $"Usage: $0 {start|stop|restart}"
        exit 2
esac
```

  

注：

  

```
重启操作中，休眠5秒是为了等待服务的关闭，服务未关闭将无法重新启动服务(本人做过实验，当休眠时间为3秒时，可能还未完全停止服务)
```

  

(2)将rocketmq服务添加为开机启动服务

  

```
chmod a+x rocketmq.sh
sudo mv rocketmq.sh /etc/init.d/rocketmq
chkconfig --add rocketmq
```

  

(3)通过service命令来管理rocketmq

  

```
启动：service rocketmq start
关闭：service rocketmq stop
重启：service rocketmq restart
```