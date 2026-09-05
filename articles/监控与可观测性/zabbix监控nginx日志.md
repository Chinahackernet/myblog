### 监控需求

监控Nginx常见的状态码并对其进行监控，对常见的错误状态码创建相对应的触发器

以下按照分钟对数据进行抓取

### Zabbix\_Agentd创建监控脚本

**1）创建脚本之前核对Nginx日志格式**

我这里nginx日志格式如下,使用 “” 分割日志参数。

  

```shell
log_format  main  ' $http_x_forwarded_for" "$remote_user" "[$time_local]" "$request"'
                  ' "$status" "$body_bytes_sent" "$http_referer"'
                  ' "$http_user_agent" "$remote_addr" "$gzip_ratio"'
                  ' "$upstream_addr" "$request_time" "$upstream_response_time" "$http_host"';
 access_log  logs/access.log  main;
```

  

**2）创建日志监控脚本**

`vim /usr/local/zabbix/scripts/ngx_logs.sh`

  

```shell
#!/usr/bin/env bash
# -----------------------------------
# Script name   : nginx logs status code monitor
# Author        : WeiLiang Xu
# Contact me    : xuwl@micvs.com
# Last Modified : Jan, 06th, 2020
# -----------------------------------

[ ! -d /tmp/nginx ] && mkdir /tmp/nginx
LOG_PATH=/usr/local/nginx/logs/access.log               #Nginx日志路径
LOG_TEMP=/tmp/nginx/nginx_last_min.log                  #Nginx上一分钟文件
LOG_STAT=/tmp/nginx/nginx_stat.txt                      #Nginx状态码文件
LAST_MIN=`date -d "1 minute ago" +%Y:%H:%M`             #获取上一分钟值

tail -30000 ${LOG_PATH} | grep "${LAST_MIN}" > ${LOG_TEMP}  #tail 3万行数据然后进行过滤上一分钟，如果请求量较大则加大行数，过滤后将数据重定向到上一分钟文件中
cat ${LOG_TEMP} | awk -F '" "' '{print $5}' | sort | uniq -c | sort -rn > ${LOG_STAT}   #过滤上一分钟文件的状态码并对状态码进行排序去重然后显示状态码次数

#200 Code
#过滤临时文件中状态码等于200的值然后打印其次数后赋值给c_200，然后重定向到/tmp/nginx/nginx_200.txt,如果其值为空，则赋值为0后重定向到/tmp/nginx/nginx_200.txt
c_200=`cat ${LOG_STAT} | awk '$2==200{print $1}'`;[ -z ${c_200} ] && c_200=0;echo ${c_200} > /tmp/nginx/nginx_200.txt
c_202=`cat ${LOG_STAT} | awk '$2==202{print $1}'`;[ -z ${c_202} ] && c_202=0;echo ${c_202} > /tmp/nginx/nginx_202.txt

#300 Code
c_301=`cat ${LOG_STAT} | awk '$2==301{print $1}'`;[ -z ${c_301} ] && c_301=0;echo ${c_301} > /tmp/nginx/nginx_301.txt
c_302=`cat ${LOG_STAT} | awk '$2==302{print $1}'`;[ -z ${c_302} ] && c_302=0;echo ${c_302} > /tmp/nginx/nginx_302.txt
c_304=`cat ${LOG_STAT} | awk '$2==304{print $1}'`;[ -z ${c_304} ] && c_304=0;echo ${c_304} > /tmp/nginx/nginx_304.txt

#400 Code
c_400=`cat ${LOG_STAT} | awk '$2==400{print $1}'`;[ -z ${c_400} ] && c_400=0;echo ${c_400} > /tmp/nginx/nginx_400.txt
c_403=`cat ${LOG_STAT} | awk '$2==403{print $1}'`;[ -z ${c_403} ] && c_403=0;echo ${c_403} > /tmp/nginx/nginx_403.txt
c_404=`cat ${LOG_STAT} | awk '$2==404{print $1}'`;[ -z ${c_404} ] && c_404=0;echo ${c_404} > /tmp/nginx/nginx_404.txt
c_405=`cat ${LOG_STAT} | awk '$2==405{print $1}'`;[ -z ${c_405} ] && c_405=0;echo ${c_405} > /tmp/nginx/nginx_405.txt

#500 Code
c_502=`cat ${LOG_STAT} | awk '$2==502{print $1}'`;[ -z ${c_502} ] && c_502=0;echo ${c_502} > /tmp/nginx/nginx_502.txt
c_503=`cat ${LOG_STAT} | awk '$2==503{print $1}'`;[ -z ${c_503} ] && c_503=0;echo ${c_503} > /tmp/nginx/nginx_503.txt
c_504=`cat ${LOG_STAT} | awk '$2==504{print $1}'`;[ -z ${c_504} ] && c_504=0;echo ${c_504} > /tmp/nginx/nginx_504.txt

#以下来定义函数方便 UserParameter 调用
function c_200 {
        cat /tmp/nginx/nginx_200.txt
}

function c_202 {
        cat /tmp/nginx/nginx_202.txt
}

function c_301 {
        cat /tmp/nginx/nginx_301.txt
}

function c_302 {
        cat /tmp/nginx/nginx_302.txt
}

function c_304 {
        cat /tmp/nginx/nginx_304.txt
}                      

function c_400 {
        cat /tmp/nginx/nginx_400.txt
}

function c_403 {
        cat /tmp/nginx/nginx_403.txt
}

function c_404 {
        cat /tmp/nginx/nginx_404.txt
}

function c_405 {
        cat /tmp/nginx/nginx_405.txt
}

function c_502 {
        cat /tmp/nginx/nginx_502.txt
}

function c_503 {
        cat /tmp/nginx/nginx_503.txt
}

function c_504 {
        cat /tmp/nginx/nginx_504.txt
}

$1
```

  

**3) 修改权限属性**

  

```shell
chown -Rf zabbix.zabbix /usr/local/zabbix/scripts/ngx_logs.sh
chmod u+x /usr/local/zabbix/scripts/ngx_logs.sh
```

  

### 创建Nginx日志键值

  

```shell
vim /usr/local/zabbix/etc/zabbix_agentd.conf.d/userparameter_ngx_logs.conf
UserParameter=ngx.logs[*],/usr/local/zabbix/scripts/ngx_logs.sh $1
```

  

### 重启Zabbix\_Agentd

  

```shell
/etc/init.d/zabbix_agentd restart
```

  

### 测试数据获取

**1）本地测试数据获取**

  

```shell
/usr/local/zabbix/scripts/ngx_logs.sh c_200
0
/usr/local/zabbix/scripts/ngx_logs.sh c_200
0
/usr/local/zabbix/scripts/ngx_logs.sh c_200
24
/usr/local/zabbix/scripts/ngx_logs.sh c_202
0
/usr/local/zabbix/scripts/ngx_logs.sh c_301
0
/usr/local/zabbix/scripts/ngx_logs.sh c_302
2
/usr/local/zabbix/scripts/ngx_logs.sh c_304
14
/usr/local/zabbix/scripts/ngx_logs.sh c_400
0
/usr/local/zabbix/scripts/ngx_logs.sh c_403
1
/usr/local/zabbix/scripts/ngx_logs.sh c_404
0
/usr/local/zabbix/scripts/ngx_logs.sh c_405
0
/usr/local/zabbix/scripts/ngx_logs.sh c_502
0
/usr/local/zabbix/scripts/ngx_logs.sh c_503
0
/usr/local/zabbix/scripts/ngx_logs.sh c_504
0
```

  

**2）Zabbix Server进行数据获取**

  

```shell
zabbix_get -s 172.26.3.101 -p 10050 -k "ngx.logs[c_200]"
27
zabbix_get -s 172.26.3.101 -p 10050 -k "ngx.logs[c_202]"
0
zabbix_get -s 172.26.3.101 -p 10050 -k "ngx.logs[c_301]"
2
zabbix_get -s 172.26.3.101 -p 10050 -k "ngx.logs[c_302]"
1
zabbix_get -s 172.26.3.101 -p 10050 -k "ngx.logs[c_304]"
0
zabbix_get -s 172.26.3.101 -p 10050 -k "ngx.logs[c_400]"
0
zabbix_get -s 172.26.3.101 -p 10050 -k "ngx.logs[c_403]"
0
zabbix_get -s 172.26.3.101 -p 10050 -k "ngx.logs[c_404]"
0
zabbix_get -s 172.26.3.101 -p 10050 -k "ngx.logs[c_405]"
0
zabbix_get -s 172.26.3.101 -p 10050 -k "ngx.logs[c_502]"
0
zabbix_get -s 172.26.3.101 -p 10050 -k "ngx.logs[c_503]"
0
zabbix_get -s 172.26.3.101 -p 10050 -k "ngx.logs[c_504]"
0
```

  

### Zabbix\_Web创建模板及监控项

**1）创建模板**

主页面点击 配置——》模板——》创建模板

![](assets/监控与可观测性/zabbix监控nginx日志/zabbix监控nginx日志-1.jpeg)

**2）创建应用集**

应用集名称为`Nginx_logs`

过程略

**3）创建监控项**

进入模板后——》监控项——》创建监控项

![](assets/监控与可观测性/zabbix监控nginx日志/zabbix监控nginx日志-2.jpeg)

最后创建好如下：

![](assets/监控与可观测性/zabbix监控nginx日志/zabbix监控nginx日志-3.jpeg)

**4）创建触发器**

对进程监控添加触发器，触发器——》创建触发器

填入触发器名称，此名称是告警出的信息——》选择严重性——》添加表达式——》我这里是使用了`last`函数最新的值如果大于15则触发告警，恢复表达式为`last`函数最新的至小于15则恢复告警。

![](assets/监控与可观测性/zabbix监控nginx日志/zabbix监控nginx日志-4.jpeg)

最后创建好如下：

![](assets/监控与可观测性/zabbix监控nginx日志/zabbix监控nginx日志-5.jpeg)

**5) 创建图形**

我这里把Nginx日志监控的监控项都放到了图形中

![](assets/监控与可观测性/zabbix监控nginx日志/zabbix监控nginx日志-6.jpeg)

### 主机嵌套模板

配置——》主机——》进入需要监控Nginx性能的主机——》模板——》添加模板——》选中我们创建的模板

![](assets/监控与可观测性/zabbix监控nginx日志/zabbix监控nginx日志-7.jpeg)

### 查看数据

监测——》最新数据——》选中节点——》选中应用集

![](assets/监控与可观测性/zabbix监控nginx日志/zabbix监控nginx日志-8.jpeg)

通过图形查看数据

![](assets/监控与可观测性/zabbix监控nginx日志/zabbix监控nginx日志-9.jpeg)

  

> -   **本文作者：** 好好青年
> -   **本文链接：** [https://zabbix.abcops.cn/2020/01/13/Zabbix监控篇-Nginx日志监控/](https://zabbix.abcops.cn/2020/01/13/Zabbix%E7%9B%91%E6%8E%A7%E7%AF%87-Nginx%E6%97%A5%E5%BF%97%E7%9B%91%E6%8E%A7/)
> -   **版权声明：** 本博客所有文章除特别声明外，均采用 [BY-NC-SA](https://creativecommons.org/licenses/by-nc-sa/4.0/) 许可协议。转载请注明出处！