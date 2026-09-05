项目地址：[https://github.com/Staroon/zabbix-hadoop-template/tree/master/hbase-master-template](https://github.com/Staroon/zabbix-hadoop-template/tree/master/hbase-master-template)

  

（1）、下载脚本，将其放在agent端的脚本存放目录。

我这里是放在/usr/local/zabbix/con/scripts下的。

> 需要修改[cluster-HMaster-plugin.sh](https://github.com/RookieOperator/zabbix-hadoop-template/blob/master/hbase-master-template/cluster-HMaster-plugin.sh)中的zabbix-server或者zabbix-proxy地址

  

（2）、然后配置zabbix\_agent.conf，开启Include，如下：

![image.png](assets/监控与可观测性/zabbix监控hbase/zabbix监控hbase-1.png)

  

（3）、配置自定义Key，配置文件路径就放在上图中的/usr/local/zabbix/conf/zabbix\_agentd下，如下：

![image.png](assets/监控与可观测性/zabbix监控hbase/zabbix监控hbase-2.png)

  

```shell
UserParameter=hbase.hback.status,/usr/bin/sh /usr/local/zabbix/con/scripts/cluster-HMaster-plugin.sh 10.2.42.61 16010 10.2.62.61
```

> 第一个参数：监听的IP
> 
> 第二个参数：监听的Port
> 
> 第三个参数：在zabbix上配置的name

  

（4）、重启zabbix-agent

  

（5）、在zabbix web端导入模板。

配置->模板->导入。

**Template Cluster HBase Master.xml**

  

  

（8）、然后在最新数据里看到有数据上来了

![image.png](assets/监控与可观测性/zabbix监控hbase/zabbix监控hbase-3.png)