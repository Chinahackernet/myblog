rsyslog提供三个远程日志传输方式：

  

-   UDP: 数据包传输可信度不高，传输速度快
-   TCP: 数据包传输可信度比较高
-   RELP: 数据包传输可信度最高，避免数据丢失，比较新的协议，目前应用较少

  

**服务端配置**

  

服务端服务基本信息如下：

  

系统版本：CentOS 7.6

  

内核版本：3.10

  

远程日志保存目录：/backup/syslog/

  

服务端IP：172.16.1.73

  

（1）修改配置文件，新增/etc/rsyslog.d/other-system.conf，内容如下：

  

```
# Provides UDP syslog reception
$ModLoad imudp
$UDPServerRun 514
$AllowedSender UDP, 172.16.0.0/16 

# This one is the template to generate the log filename dynamically, depending on the client's IP address. 
# 根据客户端的IP单独存放主机日志在不同目录，syslog需要手动创建             
$template Remote,"/backup/syslog/%fromhost-ip%/%PROGRAMNAME%_%$YEAR%-%$MONTH%-%$DAY%.log"

# Log all messages to the dynamically formed file.
:fromhost-ip, !isequal, "127.0.0.1" ?Remote
# 排除本地主机IP日志记录，只记录远程主机日志
# 注意此规则需要在其它规则之前，否则配置没有意义，远程主机的日志也会记录到Server的日志文件中
& ~ # 忽略之前所有的日志，远程主机日志记录完之后不再继续往下记录
```

  

（2）检查主配置/etc/rsyslog.conf中是否有如下配置，如果没有，则加上。

  

```
$IncludeConfig /etc/rsyslog.d/*.conf
```

  

（3）重启rsyslog

  

```
systemctl restart rsyslog
```

  

服务端配置完成。

  

**客户端配置**

  

客户端只需要将日志传输给服务端。

  

（1）在/etc/rsyslog.conf里新增如下内容：

  

```
*.*                     @172.16.1.73
```

  

（2）重启rsyslog

  

```
systemctl restart rsyslog
```

  

客户端配置完成。

  

**检查是否有日志传输**

  

在服务端/backup/syslog/下查看是否生成IP的目录，进入目录是否有日志产生。

  

**配置auditd日志到远程存储**

  

（1）检查/etc/rsyslog.conf下是否有如下配置，如果没有则加上

  

```
#### MODULES ####
$ModLoad imfile
```

  

（2）在/etc/rsyslog.conf下加入如下配置

  

```
$InputFileName /var/log/audit/audit.log  
$InputFileTag audit_log:  
$InputFileStateFile audit_log  
$InputFileSeverity info  
$InputFileFacility local6  
$InputRunFileMonitor
```

  

（3）重启rsyslog

  

```
systemctl restart rsyslog
```

  

然后到日志服务器上观察是否有audit\_log\_\*开头的日志。