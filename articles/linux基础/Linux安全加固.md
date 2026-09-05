# 一、账号和口令

## 1.1 禁用或删除无用账号

减少系统无用账号，降低安全风险。

  

操作步骤

userdel <用户名> //删除不必要的账号。

passwd -l <用户名> //锁定不必要的账号。

passwd -u <用户名> //解锁必要的账号。

  

## 1.2 检查特殊账号

检查是否存在空口令和root权限的账号。

  

操作步骤

1、

awk -F: '($2=="")' /etc/shadow //查看空口令账号。

awk -F: '($3==0)' /etc/passwd //查看UID为零的账号。

2、

passwd <用户名> //为空口令账号设定密码。

确认UID为零的账号只有root账号。

  

## 1.3 添加口令策略

加强口令的复杂度等，降低被猜解的可能性。

  

操作步骤

1、vim /etc/login.defs 修改配置文件。

PASS\_MAX\_DAYS 90 #新建用户的密码最长使用天数

PASS\_MIN\_DAYS 0 #新建用户的密码最短使用天数

PASS\_WARN\_AGE 7 #新建用户的密码到期提前提醒天数

PASS\_MIN\_LEN 8 #设定最小用户密码长度为8位

  

2、使用chage命令修改用户设置。（针对已创建用户）

例如，chage -m 0 -M 30 -I 5 -W 7 <用户名>

表示将此用户的密码最长使用天数设为30，最短使用天数设为0，密码过期后5天之后账户失效，过期前7天警告用户。

  

3、设置连续输错五次密码，账号锁定十分钟。（普通账户）

vim /etc/pam.d/system-auth(redhat、centos)

-   auth required pam\_tally.so onerr=fail deny=5 unlock\_time=600(redhat6、centos6及以下版本)
-   auth required pam\_tally2.so onerr=fail deny=5 unlock\_time=600  vim /etc/pam.d/sshd (redhat、centos)(ssh登录)
-   auth required pam\_tally.so onerr=fail deny=5 unlock\_time=600(redhat6、centos6及以下版本)
-   auth required pam\_tally2.so onerr=fail deny=5 unlock\_time=600 

  

## 1.4 限制用户su

限制能su到root的用户。  

操作步骤 vim /etc/pam.d/su 例如，只允许wheel组用户su到root，则添加  

-   auth sufficient /lib/security/pam\_rootok.so  
-   auth required /lib/security/pam\_wheel.so group=wheel 

  

## 1.5 设置密码复杂度

对于采用静态口令认证技术的设备，口令包括数字、小写字母、大写字母和特殊符号4类中至少3类。  

操作步骤

-   Redhat、centos：/etc/pam.d/system-auth,
-   Suse9：/etc/pam.d/passwd，
-   Suse10,Suse11：/etc/pam.d/common-password，

例如：

-   password requisite pam\_cracklib.so ucredit=-1 lcredit=-1 dcredit=-1(redhat6、centos6)
-   password requisite pam\_pwquality.so dcredit=-1 ucredit=-1 ocredit=-1 lcredit=0(redhat7、 centos7)

  

注：ucredit：大写字母个数；lcredit：小写字母个数；dcredit：数字个数；ocredit：特殊字符个数 

  

## 1.6 设置密码重复使用次数限制

对于采用静态口令认证技术的设备，设置密码不能重复前5次使用过的。  

操作步骤

-   Redhat:/etc/pam.d/system-auth，
-   Suse9:/etc/pam.d/passwd
-   Suse10,Suse11:/etc/pam.d/common-password

在password sufficient pam\_unix.so xxxxx 一行后添加 remember=5  

例如：

password    sufficient    pam\_unix.so sha512 shadow nullok try\_first\_pass use\_authtok remember=5  

  

# 二、服务

## 2.1 关闭不必要的服务

关闭不必要的服务（如普通服务和xinetd服务），降低风险。

  

操作步骤

停止服务

systemctl stop <服务名>

设置服务在开机时不自动启动。

systemctl disable <服务名>

说明： 对于部分老版本的Linux操作系统（如CentOS 6）

chkconfig --level <init级别> <服务名> off设置服务在指定init级别下开机时不自动启动。

  

## 2.2 SSH服务安全

对SSH服务进行安全加固，防止容易被暴力破解成功。

 操作步骤 vim /etc/ssh/sshd\_config

-   不允许root账号直接登录系统。 设置 PermitRootLogin 的值为 no。
-   修改SSH使用的协议版本。 设置 Protocol 的版本为 2。(centos7默认第一版本已拒绝)
-   密码错误超过次数断开连接（默认6次）。 设置 MaxAuthTries 的值为 3。
-   修改默认端口 设置Port的值为非22。 配置文件修改完成后，重启sshd服务生效。 

  

# 三、文件系统

## 3.1 设置umask值

设置默认的umask值，增强安全性。

 操作步骤 vim /etc/profile

-   umask 077 #在最后一行添加
-   source /etc/profile  #使操作立即生效

即新创建的目录属主拥有读写执行权限，同组用户拥有读和执行权限，其他用户无权限。 文件属主拥有读写权限，同组用户拥有读权限，其他用户无权限。 

  

## 3.2 设置登录超时

设置系统登录后，连接超时时间，增强安全性。  

操作步骤 vim /etc/profile

-   export TMOUT=300    # 设置300秒内用户无操作就字段断开终端
-   readonly TMOUT     # 将值设置为readonly 防止用户更改
-   source /etc/profile  #使操作立即生效 

  

## 3.3 删除潜在危险文件

.rhosts，.netrc，hosts.equiv等文件都具有潜在的危险，如果没有应用，应该删除  

操作步骤

find / -name .rhosts  

find / -name .netrc

find / -name hosts.equiv

若存在相关文件，加上.bak后缀

mv .rhost .rhost.bak  

mv .netr .netr.bak  

mv hosts.equiv hosts.equiv.bak  

  

## 3.4 设置重要目录或文件权限  

操作步骤 chmod <权限> <目录或文件> 例如： chmod 750 /etc/ 请按照下表更改权限： 

<table class="lake-table" style="width: 699px; height: 510pt;"><colgroup><col width="72" span="1" /><col width="168" span="1" /><col width="459" span="1" /></colgroup><tbody><tr style="height: 23px;"><td><p><strong>权限</strong></p></td><td><p><strong>目录或文件</strong></p></td><td><p><strong>备注</strong></p></td></tr><tr style="height: 23px;"><td><p><span class="lake-fontsize-14" style="color: #000000;">400</span></p></td><td><p><span class="lake-fontsize-14" style="color: #000000;">/</span><span class="lake-fontsize-14" style="color: #000000;">etc</span><span class="lake-fontsize-14" style="color: #000000;">/shadow</span></p></td><td><p><span class="lake-fontsize-14" style="color: #000000;"><br /></span></p></td></tr><tr style="height: 28px;"><td><p><span class="lake-fontsize-14" style="color: #000000;">600</span></p></td><td><p><span class="lake-fontsize-14" style="color: #000000;">/</span><span class="lake-fontsize-14" style="color: #000000;">etc</span><span class="lake-fontsize-14" style="color: #000000;">/</span><span class="lake-fontsize-14" style="color: #000000;">xinetd.conf</span></p></td><td><p><span class="lake-fontsize-14" style="color: #000000;">低版本的</span><span class="lake-fontsize-14" style="color: #000000;">Linux</span><span class="lake-fontsize-14" style="color: #000000;">系统采用</span><span class="lake-fontsize-14" style="color: #000000;">inetd.conf</span><span class="lake-fontsize-14" style="color: #000000;">配置文件</span></p></td></tr><tr style="height: 23px;"><td><p><span class="lake-fontsize-14" style="color: #000000;">600</span></p></td><td><p><span class="lake-fontsize-14" style="color: #000000;">/</span><span class="lake-fontsize-14" style="color: #000000;">etc</span><span class="lake-fontsize-14" style="color: #000000;">/security</span></p></td><td><p><span class="lake-fontsize-14" style="color: #000000;"><br /></span></p></td></tr><tr style="height: 18px;"><td><p><span class="lake-fontsize-14" style="color: #000000;">600</span></p></td><td><p><span class="lake-fontsize-14" style="color: #000000;">/</span><span class="lake-fontsize-14" style="color: #000000;">etc</span><span class="lake-fontsize-14" style="color: #000000;">/</span><span class="lake-fontsize-14" style="color: #000000;">grub.conf</span></p></td><td rowspan="3"><p><span class="lake-fontsize-14" style="color: #000000;">如果</span><span class="lake-fontsize-14" style="color: #000000;">/</span><span class="lake-fontsize-14" style="color: #000000;">etc</span><span class="lake-fontsize-14" style="color: #000000;">/</span><span class="lake-fontsize-14" style="color: #000000;">grub.conf</span><span class="lake-fontsize-14" style="color: #000000;">文件存在，且非链接文件，则执行</span><span class="lake-fontsize-14" style="color: #000000;">chmod</span><span class="lake-fontsize-14" style="color: #000000;"> 600 /</span><span class="lake-fontsize-14" style="color: #000000;">etc</span><span class="lake-fontsize-14" style="color: #000000;">/</span><span class="lake-fontsize-14" style="color: #000000;">grub.conf</span><span class="lake-fontsize-14" style="color: #000000;">; </span><span class="lake-fontsize-14" style="color: #000000;">如果</span><span class="lake-fontsize-14" style="color: #000000;">/boot/grub/</span><span class="lake-fontsize-14" style="color: #000000;">grub.conf</span><span class="lake-fontsize-14" style="color: #000000;">文件存在，则执行</span><span class="lake-fontsize-14" style="color: #000000;">chmod</span><span class="lake-fontsize-14" style="color: #000000;"> 600 /boot/grub/</span><span class="lake-fontsize-14" style="color: #000000;">grub.conf</span><span class="lake-fontsize-14" style="color: #000000;">; </span><span class="lake-fontsize-14" style="color: #000000;">如果</span><span class="lake-fontsize-14" style="color: #000000;">/</span><span class="lake-fontsize-14" style="color: #000000;">etc</span><span class="lake-fontsize-14" style="color: #000000;">/</span><span class="lake-fontsize-14" style="color: #000000;">lilo.conf</span><span class="lake-fontsize-14" style="color: #000000;">文件存在，则执行</span><span class="lake-fontsize-14" style="color: #000000;">chmod</span><span class="lake-fontsize-14" style="color: #000000;"> 600 /</span><span class="lake-fontsize-14" style="color: #000000;">etc</span><span class="lake-fontsize-14" style="color: #000000;">/</span><span class="lake-fontsize-14" style="color: #000000;">lilo.conf</span><span class="lake-fontsize-14" style="color: #000000;">。</span></p></td></tr><tr style="height: 23px;"><td><p><span class="lake-fontsize-14" style="color: #000000;">600</span></p></td><td><p><span class="lake-fontsize-14" style="color: #000000;">/boot/grub/</span><span class="lake-fontsize-14" style="color: #000000;">grub.conf</span></p></td></tr><tr style="height: 23px;"><td><p><span class="lake-fontsize-14" style="color: #000000;">600</span></p></td><td><p><span class="lake-fontsize-14" style="color: #000000;">/</span><span class="lake-fontsize-14" style="color: #000000;">etc</span><span class="lake-fontsize-14" style="color: #000000;">/</span><span class="lake-fontsize-14" style="color: #000000;">lilo.conf</span></p></td></tr><tr style="height: 23px;"><td><p><span class="lake-fontsize-14" style="color: #000000;">600</span></p></td><td><p><span class="lake-fontsize-14" style="color: #000000;">/</span><span class="lake-fontsize-14" style="color: #000000;">etc</span><span class="lake-fontsize-14" style="color: #000000;">/</span><span class="lake-fontsize-14" style="color: #000000;">lilo.conf</span></p></td><td><p><span class="lake-fontsize-14" style="color: #000000;"><br /></span></p></td></tr><tr style="height: 23px;"><td><p><span class="lake-fontsize-14" style="color: #000000;">644</span></p></td><td><p><span class="lake-fontsize-14" style="color: #000000;">/</span><span class="lake-fontsize-14" style="color: #000000;">etc</span><span class="lake-fontsize-14" style="color: #000000;">/services</span></p></td><td><p><span class="lake-fontsize-14" style="color: #000000;"><br /></span></p></td></tr><tr style="height: 23px;"><td><p><span class="lake-fontsize-14" style="color: #000000;">644</span></p></td><td><p><span class="lake-fontsize-14" style="color: #000000;">/</span><span class="lake-fontsize-14" style="color: #000000;">etc</span><span class="lake-fontsize-14" style="color: #000000;">/</span><span class="lake-fontsize-14" style="color: #000000;">passwd</span></p></td><td><p><span class="lake-fontsize-14" style="color: #000000;"><br /></span></p></td></tr><tr style="height: 23px;"><td><p><span class="lake-fontsize-14" style="color: #000000;">644</span></p></td><td><p><span class="lake-fontsize-14" style="color: #000000;">/</span><span class="lake-fontsize-14" style="color: #000000;">etc</span><span class="lake-fontsize-14" style="color: #000000;">/group</span></p></td><td><p><span class="lake-fontsize-14" style="color: #000000;"><br /></span></p></td></tr><tr style="height: 23px;"><td><p><span class="lake-fontsize-14" style="color: #000000;">750</span></p></td><td><p><span class="lake-fontsize-14" style="color: #000000;">/</span><span class="lake-fontsize-14" style="color: #000000;">etc</span><span class="lake-fontsize-14" style="color: #000000;">/</span></p></td><td><p><span class="lake-fontsize-14" style="color: #000000;"><br /></span></p></td></tr><tr style="height: 23px;"><td><p><span class="lake-fontsize-14" style="color: #000000;">750</span></p></td><td><p><span class="lake-fontsize-14" style="color: #000000;">/</span><span class="lake-fontsize-14" style="color: #000000;">etc</span><span class="lake-fontsize-14" style="color: #000000;">/rc2.d</span></p></td><td><p><span class="lake-fontsize-14" style="color: #000000;"><br /></span></p></td></tr><tr style="height: 23px;"><td><p><span class="lake-fontsize-14" style="color: #000000;">750</span></p></td><td><p><span class="lake-fontsize-14" style="color: #000000;">/</span><span class="lake-fontsize-14" style="color: #000000;">etc</span><span class="lake-fontsize-14" style="color: #000000;">/rc1.d/</span></p></td><td><p><span class="lake-fontsize-14" style="color: #000000;"><br /></span></p></td></tr><tr style="height: 23px;"><td><p><span class="lake-fontsize-14" style="color: #000000;">750</span></p></td><td><p><span class="lake-fontsize-14" style="color: #000000;">/</span><span class="lake-fontsize-14" style="color: #000000;">etc</span><span class="lake-fontsize-14" style="color: #000000;">/rc4.d</span></p></td><td><p><span class="lake-fontsize-14" style="color: #000000;"><br /></span></p></td></tr><tr style="height: 23px;"><td><p><span class="lake-fontsize-14" style="color: #000000;">750</span></p></td><td><p><span class="lake-fontsize-14" style="color: #000000;">/</span><span class="lake-fontsize-14" style="color: #000000;">etc</span><span class="lake-fontsize-14" style="color: #000000;">/rc5.d</span></p></td><td><p><span class="lake-fontsize-14" style="color: #000000;"><br /></span></p></td></tr><tr style="height: 23px;"><td><p><span class="lake-fontsize-14" style="color: #000000;">750</span></p></td><td><p><span class="lake-fontsize-14" style="color: #000000;">/</span><span class="lake-fontsize-14" style="color: #000000;">etc</span><span class="lake-fontsize-14" style="color: #000000;">/rc0.d</span></p></td><td><p><span class="lake-fontsize-14" style="color: #000000;"><br /></span></p></td></tr><tr style="height: 23px;"><td><p><span class="lake-fontsize-14" style="color: #000000;">750</span></p></td><td><p><span class="lake-fontsize-14" style="color: #000000;">/</span><span class="lake-fontsize-14" style="color: #000000;">etc</span><span class="lake-fontsize-14" style="color: #000000;">/rc6.d</span></p></td><td><p><span class="lake-fontsize-14" style="color: #000000;"><br /></span></p></td></tr><tr style="height: 23px;"><td><p><span class="lake-fontsize-14" style="color: #000000;">750</span></p></td><td><p><span class="lake-fontsize-14" style="color: #000000;">/</span><span class="lake-fontsize-14" style="color: #000000;">etc</span><span class="lake-fontsize-14" style="color: #000000;">/</span><span class="lake-fontsize-14" style="color: #000000;">rc.d</span><span class="lake-fontsize-14" style="color: #000000;">/</span><span class="lake-fontsize-14" style="color: #000000;">init.d</span><span class="lake-fontsize-14" style="color: #000000;">/</span></p></td><td><p><span class="lake-fontsize-14" style="color: #000000;"><br /></span></p></td></tr><tr style="height: 23px;"><td><p><span class="lake-fontsize-14" style="color: #000000;">750</span></p></td><td><p><span class="lake-fontsize-14" style="color: #000000;">/</span><span class="lake-fontsize-14" style="color: #000000;">etc</span><span class="lake-fontsize-14" style="color: #000000;">/rc3.d</span></p></td><td><p><span class="lake-fontsize-14" style="color: #000000;"><br /></span></p></td></tr><tr style="height: 23px;"><td><p><span class="lake-fontsize-14" style="color: #000000;">750</span></p></td><td><p><span class="lake-fontsize-14" style="color: #000000;">/</span><span class="lake-fontsize-14" style="color: #000000;">tmp</span></p></td><td><p><span class="lake-fontsize-14" style="color: #000000;"><br /></span></p></td></tr></tbody></table>

  

# 四、日志

## 4.1 syslogd日志

启用日志功能，并配置日志记录。  

操作步骤

Linux系统默认启用以下类型日志：

-   系统日志（默认）/var/log/messages
-   cron日志（默认）/var/log/cron
-   安全日志（默认）/var/log/secure

注意：部分系统可能使用syslog-ng日志，配置文件为：/etc/syslog-ng/syslog-ng.conf。 您可以根据需求配置详细日志。 

  

## 4.2 记录所有用户的登录和操作日志

通过脚本代码实现记录所有用户的登录操作日志，防止出现安全事件后无据可查。

操作步骤    

-   1、运行 [root@xxx /]# vim /etc/profile打开配置文件。    
-   2、在配置文件中输入以下内容： 

```python
history
USER=`whoami`
USER_IP=`who -u am i 2>/dev/null| awk '{print $NF}'|sed -e 's/[()]//g'`
if [ "$USER_IP" = "" ]; then
USER_IP=`hostname`
fi
if [ ! -d /var/log/history ]; then
mkdir /var/log/history
chmod 733 /var/log/history
fi
if [ ! -d /var/log/history/${LOGNAME} ]; then
mkdir /var/log/history/${LOGNAME}
chmod 300 /var/log/history/${LOGNAME}
fi
export HISTSIZE=4096
DT=`date +"%Y%m%d_%H:%M:%S"`
export HISTFILE="/var/log/history/${LOGNAME}/${USER}@${USER_IP}_$DT"
chmod 600 /var/log/history/${LOGNAME}/* 2>/dev/null
```

-    3、运行 [root@xxx /]# source /etc/profile 加载配置生效。

> 注意： /var/log/history 是记录日志的存放位置，可以自定义。

  

通过上述步骤，可以在 /var/log/history 目录下以每个用户为名新建一个文件夹，每次用户退出后都会产生以用户名、登录IP、时间的日志文件，包含此用户本次的所有操作。  

注：编辑/etc/bashrc文件，最后加入 HISTTIMEFORMAT="%F %T  " export HISTTIMEFORMAT 保存后退出，关闭当前shell，并重新登录这个时候，在变量HISTFILE所指向文件中，就有记录命令执行的时间了 。 

  

# 五、Linux升级

yum -y update

#内核、OS版本、所有软件都会升级，会更改相关配置环境。由于系统与硬件的兼容性问题，有可能升级内核后导致服务器不能正常启动，这是非常可怕的，如果没有特别的需要，建议不要随意升级内核！所以运维人员对于生产服务器操作系统的升级要慎重。  

  

如果不想升级内核及系统版本，则在执行yum update之前在 /etc/yum.conf 的 [main] 后面添加以下配置

-   exclude=kernel\*   #不升级内核
-   exclude=centos-release\*   #不升级系统 

  

# 六、防火墙维护

CentOS7默认的防火墙不是iptables,而是firewalld，如果要使用iptables，

请参考下列方法：  

安装iptables iptables-services  

#先检查是否安装了iptables service iptables status  

#安装iptables yum install -y iptables

#安装iptables-services yum install iptables-services  

#停止firewalld服务 systemctl stop firewalld  

#禁用firewalld服务 systemctl mask firewalld 

  

![image.png](assets/linux基础/Linux安全加固/Linux安全加固-1.png)

五链：

![image.png](assets/linux基础/Linux安全加固/Linux安全加固-2.png)

![image.png](assets/linux基础/Linux安全加固/Linux安全加固-3.png)

  

五表：

![image.png](assets/linux基础/Linux安全加固/Linux安全加固-4.png)

  

  

## linux防火墙基本使用：  

#查看iptables现有规则

iptables -L –n  

#先设置默认规则，允许入站，再设置规则

iptables -P INPUT ACCEPT  

#清空所有默认规则

iptables –F  

#清空所有自定义规则

iptables –X  

#所有计数器归0

iptables -Z 

  

```python
#允许来自于lo接口的数据包(本地访问)
iptables -A INPUT -i lo -j ACCEPT

#开放22端口
iptables -A INPUT -p tcp --dport 22 -j ACCEPT

#开放21端口(FTP)
iptables -A INPUT -p tcp --dport 21 -j ACCEPT

#开放80端口(HTTP)
iptables -A INPUT -p tcp --dport 80 -j ACCEPT

#开放443端口(HTTPS)
iptables -A INPUT -p tcp --dport 443 -j ACCEPT

#允许ping
iptables -A INPUT -p icmp --icmp-type 8 -j ACCEPT

#允许接受本机请求之后的返回数据 RELATED,是为FTP设置的
iptables -A INPUT -m state --state  RELATED,ESTABLISHED -j ACCEPT

#其他入站一律丢弃(默认规则)
iptables -P INPUT DROP

#所有出站一律绿灯(默认规则)
iptables -P OUTPUT ACCEPT

#所有转发一律丢弃(默认规则)
iptables -P FORWARD DROP

#如果要添加内网ip信任（接受其所有TCP请求）
iptables -A INPUT -p tcp -s ***.***.***.*** -j ACCEPT

#要封停一个IP，使用下面这条命令：
iptables -I INPUT -s ***.***.***.*** -j DROP

#要解封一个IP，使用下面这条命令:
iptables -D INPUT -s ***.***.***.*** -j DROP

# -----------------------------
#保存上述规则
service iptables save

#设置iptables开机启动
chkconfig iptables on(redhat6、centos6)
systemctl enable iptables.service(redhat7、centos7)

#重启服务
systemctl restart iptables.service(redhat7、centos7)
service iptables restart

#开启服务
systemctl start iptables.service(redhat7、centos7)
service iptables start

#查看状态
systemctl status iptables.service(redhat7、centos7)
service iptables status

```