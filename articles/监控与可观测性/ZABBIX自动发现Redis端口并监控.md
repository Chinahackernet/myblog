由于一台服务器开启许多Redis实例，如果一台一台的监控太耗费时间，也非常容器出错。这种费力不讨好的事情我们是坚决杜绝的，幸好ZABBIX有自动发现功能，今天我们就来用该功能来监控我们的Redis实例。

  

## 监控项

Redis的监控信息主要通过`info`命令来获取，下面列举几个我们的监控项。

```shell
uptime_in_days				      ##redis启动的天数
connected_clients			      ##redis连接的客户端数
blocked_clients:            ##正在等待阻塞命令（BLPOP、BRPOP、BRPOPLPUSH）的客户端的数量
used_memory_peak_human:		  ##reids所用内存的高峰期
used_memory:				        ##redis运行起来使用的内存数
expired_keys:				        ##过期的key数量
evicted_keys:				        ##删除过期的key数量
keyspace_misses:			      ##没命中的key数量
keyspace_hits:				      ##命中的key数量
connected_slaves:			      ##已连接的从服务器数
rejected_connections:		    ##因为超过最大连接数被拒接的请求数量
```

上面只是列举了几个，如果需要更多的监控项可以通过`info`命令获取。如下：

![image.png](assets/监控与可观测性/ZABBIX自动发现Redis端口并监控/ZABBIX自动发现Redis端口并监控-1.png)

  

## 开发自动发现脚本

> 注：可以使用shell开发，也可以使用python开发。我这里附这两种语言脚本

### Shell脚本

  

```shell
#!/bin/bash
# 自动发现Redis端口脚本
port=(`sudo netstat -tpln | awk -F "[ :]+" '/redis/ && /0.0.0.0/ {print $5}'`)
printf '{\n'
printf '\t"data":[\n'
   for key in ${!port[@]}
       do
           if [[ "${#port[@]}" -gt 1 && "${key}" -ne "$((${#port[@]}-1))" ]];then
  socket=`ps aux|grep ${port[${key}]}|grep -v grep|awk -F '=' '{print $10}'|cut -d ' ' -f 1`
              printf '\t {\n'
              printf "\t\t\t\"{#REDISPORT}\":\"${port[${key}]}\"},\n"
         else [[ "${key}" -eq "((${#port[@]}-1))" ]]
  socket=`ps aux|grep ${port[${key}]}|grep -v grep|awk -F '=' '{print $10}'|cut -d ' ' -f 1`
              printf '\t {\n'
              printf "\t\t\t\"{#REDISPORT}\":\"${port[${key}]}\"}\n"
           fi
   done
              printf '\t ]\n'
              printf '}\n'
```

  

  

### Python脚本

```python
#!/usr/bin/env python 
import os 
import json
t=os.popen("""sudo netstat -tlpn |grep redis-server|grep 0.0.0.0|awk '{print $4}'|awk -F: '{print $2}' """) 
ports = [] 
for port in  t.readlines(): 
        r = os.path.basename(port.strip()) 
        ports += [{'{#REDISPORT}':r}] 
print json.dumps({'data':ports},sort_keys=True,indent=4,separators=(',',':'))
```

  

> 注：我这里直接监控的是Redis，所以上方两个脚本获取的直接是Redis的端口，你也可以将脚本内容改一下，比如服务名通过参数形式传递，那么该脚本就可以发现你想发现的服务端口了。

  

## 在被监控主机上配置

（1）、将上方的脚本其一拷贝到被监控主机上，比如我这里的10.2.42.16主机，主要命令如下

```shell
# 创建脚本存放路径
mkdir /etc/zabbix/scripts
# 在脚本存放路径下存放我们上面开发的脚本任一，我这里取名为discovery_redis.py
# 给脚本加执行权限
chmod +x discovery_redis.py
```

  

（2）、创建zabbix的key。在/etc/zabbix/zabbix\_agentd.d/目录下创建配置文件，如下：

```shell
vim userparameter_disvocery_redis.conf
UserParameter=redis.discovery,/etc/zabbix/scripts/discovery_redis.py
UserParameter=redis.stats[*],/usr/local/redis-3.2.9/src/redis-cli -h 127.0.0.1 -p $1 info | grep -w $2 | cat -d : -f2
```

> 参数说明：
> 
> 其中的格式为UserParameter=<key>,<command\>
> 
> <key>：就是在web端添加监控脚本时的key值
> 
> <command\>：就是该key值对应的执行脚本，也就是脚本执行路径

  

（3）、修改zabbix\_agentd.conf配置文件

```shell
# 添加配置目录
Include=/etc/zabbix/zabbix_agentd.conf.d/*.conf
# 允许自定义脚本
UnsafeUserParameters=1
```

  

（4）、增加sudo权限

之所以要增加sudo权限，是因为zabbix\_agentd是zabbix用户启动的，默认不能执行netstat -p等命令，因此可以配置sudo解决，也可以使用chmod +s /bin/netstat进行解决。

```shell
# visudo
#Defaults    requiretty 	# 注释掉
Defaults:zabbix    !requiretty
zabbix  ALL=(root)      NOPASSWD:/bin/netstat
```

  

（5）、重启zabbix-agent，并在server端用zabbix\_get测试

```shell
# 重启zabbix-agent
service zabbix-agent restart
# 在服务端用zabbix_get测试
zabbix_get -s 10.2.42.16 -p 10050 -k redis.discovery
zabbix_get -s 10.2.42.16 -p 10050 -k redis.stats[6383,expired_keys]
```

> 如果没有zabbix\_get命令需要自己安装，由于我这里都是用的yum安装的，如果你也和我一样就用下面命令安装即可`yum install zabbix_get -y`

  

到目前为止zabbix-agent端已经配置完毕，下面进行服务端配置。

## 服务端配置

服务端配置直接在WEB界面操作。

### 创建模板

![image.png](assets/监控与可观测性/ZABBIX自动发现Redis端口并监控/ZABBIX自动发现Redis端口并监控-2.png)

![image.png](assets/监控与可观测性/ZABBIX自动发现Redis端口并监控/ZABBIX自动发现Redis端口并监控-3.png)

  

### 创建应用集

配置>模板>选择刚才创建的模板

![image.png](assets/监控与可观测性/ZABBIX自动发现Redis端口并监控/ZABBIX自动发现Redis端口并监控-4.png)

![image.png](assets/监控与可观测性/ZABBIX自动发现Redis端口并监控/ZABBIX自动发现Redis端口并监控-5.png)

  

### 创建自动发现规则

配置>模板>选择刚才创建的模板

![image.png](assets/监控与可观测性/ZABBIX自动发现Redis端口并监控/ZABBIX自动发现Redis端口并监控-6.png)

![image.png](assets/监控与可观测性/ZABBIX自动发现Redis端口并监控/ZABBIX自动发现Redis端口并监控-7.png)

  

配置过滤器（可选），我这里配置的主要原因是还有其他我不需要监控的集群

![image.png](assets/监控与可观测性/ZABBIX自动发现Redis端口并监控/ZABBIX自动发现Redis端口并监控-8.png)

  

配置正则表达式

![image.png](assets/监控与可观测性/ZABBIX自动发现Redis端口并监控/ZABBIX自动发现Redis端口并监控-9.png)

![image.png](assets/监控与可观测性/ZABBIX自动发现Redis端口并监控/ZABBIX自动发现Redis端口并监控-10.png)

  

### 创建监控项

> 注意：这里要在模板中的自动发现规则处去添加监控项原型

![image.png](assets/监控与可观测性/ZABBIX自动发现Redis端口并监控/ZABBIX自动发现Redis端口并监控-11.png)

  

点击监控项原型，创建监控项原型

![image.png](assets/监控与可观测性/ZABBIX自动发现Redis端口并监控/ZABBIX自动发现Redis端口并监控-12.png)

上面是我添加的一些监控项原型，我只拿一个举例，其他配置相似。

![image.png](assets/监控与可观测性/ZABBIX自动发现Redis端口并监控/ZABBIX自动发现Redis端口并监控-13.png)

其中键值处配置如下：

```shell
redis_stats[{#REDISPORT},evicted_keys]
```

说明：

-   redis\_stats：是我们在zabbix-agent端配置的key
-   {#REDISPORT}：是我们自动发现脚本中定义的key，不要和上面的key混淆了。
-   evicted\_keys：是我们需要获取的监控项，这个参数是我们主要需要改的参数

### 创建图形原型

图形原型也需要在模板自动发现规则中配置，如下：

![image.png](assets/监控与可观测性/ZABBIX自动发现Redis端口并监控/ZABBIX自动发现Redis端口并监控-14.png)

  

我这里只配置了三个图形，我这里只列举一个，如下：

![image.png](assets/监控与可观测性/ZABBIX自动发现Redis端口并监控/ZABBIX自动发现Redis端口并监控-15.png)

> 注意，这里添加监控项的时候要添加原型，也就是我上面箭头指的地方

  

### 创建触发器

这里依旧在模板自动发现规则中配置。

![image.png](assets/监控与可观测性/ZABBIX自动发现Redis端口并监控/ZABBIX自动发现Redis端口并监控-16.png)

  

我这里仅仅配置了两个，根据需要自行配置，那一个举例，如下：

![image.png](assets/监控与可观测性/ZABBIX自动发现Redis端口并监控/ZABBIX自动发现Redis端口并监控-17.png)

  

到此服务端已经配置完成，下面将模板添加到我们的主机。

## 为主机添加模板

> 被添加模板的主机需要添加自动发现脚本和配置zabbix-agent端

![image.png](assets/监控与可观测性/ZABBIX自动发现Redis端口并监控/ZABBIX自动发现Redis端口并监控-18.png)

  

然后观察最新数据和图形。

![image.png](assets/监控与可观测性/ZABBIX自动发现Redis端口并监控/ZABBIX自动发现Redis端口并监控-19.png)