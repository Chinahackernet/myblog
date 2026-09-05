---

  

## title: Zabbix监控服务  
tag: zabbix  
date: 2019.5.27

  

### 1.Zabbix用户

  

创建用户管理->用户->创建-用户  
![](https://vimc-1255664370.cos.ap-guangzhou.myqcloud.com/Zabbix_2/5.png)

  

![](https://vimc-1255664370.cos.ap-guangzhou.myqcloud.com/Zabbix_2/6.png)

<table class="lake-table" style="width: 721px;"><colgroup><col span="1" width="360" /><col span="1" width="360" /></colgroup><tbody><tr style="height: 33px;"><td>属性</td><td>描述</td></tr></tbody><tbody><tr style="height: 33px;"><td>别名</td><td>账号</td></tr><tr style="height: 33px;"><td>用户名的第一部分</td><td>姓</td></tr><tr style="height: 33px;"><td>姓氏</td><td>名</td></tr><tr style="height: 33px;"><td>群组</td><td>选择群组，这里选择管理员组</td></tr><tr style="height: 33px;"><td>语言</td><td>用户语言</td></tr><tr style="height: 33px;"><td>自动注销</td><td>自动退出</td></tr><tr style="height: 33px;"><td>刷新</td><td>每30秒页面会刷新一次</td></tr></tbody></table>

  

添加报警媒介

  

![](https://vimc-1255664370.cos.ap-guangzhou.myqcloud.com/Zabbix_2/7.png)  
![](https://vimc-1255664370.cos.ap-guangzhou.myqcloud.com/Zabbix_2/8.png)

<table class="lake-table" style="width: 721px;"><colgroup><col span="1" width="360" /><col span="1" width="360" /></colgroup><tbody><tr style="height: 33px;"><td>属性</td><td>描述</td></tr></tbody><tbody><tr style="height: 33px;"><td>收件人</td><td>填写收件的邮箱</td></tr><tr style="height: 33px;"><td>当启用时</td><td>周一到周七的所有时间段，可自行定义</td></tr><tr style="height: 33px;"><td>如果存在严重性则使用</td><td>媒介通知类型，存在选中的类型则通知。</td></tr></tbody></table>

  

![](https://vimc-1255664370.cos.ap-guangzhou.myqcloud.com/Zabbix_2/9.png)

  

权限配置

  

这里选超级管理员

  

![](https://vimc-1255664370.cos.ap-guangzhou.myqcloud.com/Zabbix_2/10.png)  
![](https://vimc-1255664370.cos.ap-guangzhou.myqcloud.com/Zabbix_2/11.png)  
配置完成后，存档

  

用户登录  
![](https://vimc-1255664370.cos.ap-guangzhou.myqcloud.com/Zabbix_2/12.png)  
![](https://vimc-1255664370.cos.ap-guangzhou.myqcloud.com/Zabbix_2/14.png)

  

### 2.配置主机

  

![](https://vimc-1255664370.cos.ap-guangzhou.myqcloud.com/Zabbix_2/15.png)  
解释

<table class="lake-table" style="width: 721px;"><colgroup><col span="1" width="360" /><col span="1" width="360" /></colgroup><tbody><tr style="height: 33px;"><td>属性</td><td>描述</td></tr></tbody><tbody><tr style="height: 33px;"><td>主机名称</td><td>主机名，支持字符、空格、句号等，不支持非主流符号。其必须与agent端的主机名相同。</td></tr><tr style="height: 33px;"><td>可见的名称</td><td>主机别名（可选填）</td></tr><tr style="height: 33px;"><td>群组</td><td>每台主机都需要的一个群组</td></tr><tr style="height: 33px;"><td>新的群组</td><td>如果已存在的群组没有想要的就在这里添加群组</td></tr><tr style="height: 33px;"><td>主机接口</td><td>有Agent、SNMP、JMX、IPMI四种接口，如果需要增加接口，键入客户机IP即可，可以使用IP和域名两种方式。zabbix agent默认端口10050、snmp 161、jmx 12345、IMPI 623.</td></tr><tr style="height: 33px;"><td>由agent代理程序监测</td><td>是否通过Proxy监控，默认是no proxy，由Zabbix server直接监控。选择了proxy name，那么由proxy收集数据。</td></tr></tbody></table>

  

### 2.模块

  

在`链接指示器`搜索想要的模板关键词，比如：Template OS Linux,可以搜索linux。选择完成后点击添加然后更新模块。  
如果想要删除模板，可以选择取消链接 or 取消链接并清理。  
![](https://vimc-1255664370.cos.ap-guangzhou.myqcloud.com/Zabbix_2/16.png)

  

### 3.监控Apache服务器

  

这里用现成的模板  
[https://github.com/lorf/zapache/](https://github.com/lorf/zapache/)

  

```
git clone https://github.com/lorf/zapache.git   //克隆源码

yum install -y httpd //安装Apache

cp /usr/local/src/zapache/httpd-server-status.conf.sample /etc/httpd/conf.d/httpd-server-status.conf    //拷贝子配置文件

vi /etc/httpd/conf.d/httpd-server-status.conf   //修改配置文件

<Location /server-status>
    SetHandler server-status
    Order deny,allow
    Deny from all
    Allow from localhost
</Location>

改为

<Location /server-status>
    SetHandler server-status
    Order deny,allow
    Allow from localhost 192.168.123.61 192.168.123.44
</Location>

service httpd restart   //重启Apache

cp /usr/local/src/zapache/zapache  //拷贝可执行文件到bin目录下，注意检查有没有执行权限

cp /usr/local/src/zapache/userparameter_zapache.conf.sample /usr/local/zabbix_agent/etc/zabbix_agentd.conf.d/userparmeter_zapache.conf

vi /usr/local/zabbix_agent/etc/zabbix_agentd.conf.d/userparmeter_zapache.conf

UserParameter=zapache[*],/var/lib/zabbixsrv/externalscripts/zapache \$1
改为
UserParameter=zapache[*],/usr/local/bin/zapache \$1

//最后到zabbix的etc目录下，编辑zabbix_agentd.conf

vi /usr/local/zabbix_agent/etc/zabbix_agentd.conf

Include=/usr/local/zabbix_agent/etc/zabbix_agentd.conf.d//*.conf
//指定子配置文件
```

  

浏览器访问  
[http://192.168.123.50/server-status](http://192.168.123.50/server-status)  
![](https://vimc-1255664370.cos.ap-guangzhou.myqcloud.com/Zabbix_2/17.png)  
看到图上的内容则配置成功，下面配置模板，先把模板文件`zapache-template.xml`导出来。

  

然后在Web界面进行配置，配置->模板->导入选择模板文件，然后点导入。  
![](https://vimc-1255664370.cos.ap-guangzhou.myqcloud.com/Zabbix_2/18.png)

  

然后在配置主机的地方添加模板。  
![](https://vimc-1255664370.cos.ap-guangzhou.myqcloud.com/Zabbix_2/19.png)

  

然后到监控中->最新数据，可以看到已经开始出数据了。  
![](https://vimc-1255664370.cos.ap-guangzhou.myqcloud.com/Zabbix_2/20.png)