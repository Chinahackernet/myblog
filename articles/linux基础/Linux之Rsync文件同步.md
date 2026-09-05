# 数据备份方案

1、需要备份的文件目录有（原则上，只要运维人员写入或更改的数据都需要备份）。/data,/etc/rc.local,/var/spool/cron/root等，根据不同都服务器做不同的调整

2、为了规范化，每台服务器进行本地备份时都备份到/backup目录下

3、每台WEB服务器进行本地备份时，都备份到/backup目录下以本机IP地址命名的目录中

4、打的tar包中需要包含当天的日期

5、统一存储数据备份的服务器统一采用Rsync daemon 方式提供存储备份数据都目录/backup

6、由于WEB服务器本地存储空间有限，需要将超过7天的备份数据删除

7、为了方便知道每次备份是否成功，我们需要做如下操作：

    （1、在每台服务器上检查备份是否成功

    （2、在存储备份数据的服务器上检查备份数据是否推送成功，并发送邮件到管理员邮箱

8、因为备份服务器空间有限，需要删除超过180天的备份数据，但每周六备份的数据要永久保留

  

做备份服务需要的基本步骤有：

1、    在Rsync备份服务器上安装，配置Rsync服务，实现推送

2、    在客户端服务器上，实现打包，推送，删除，定时任务推送

3、    在Rsync备份服务器上，做检查，发邮件给管理员

  

# Rsync服务端搭建

1、查看服务是否存在

```bash
rpm -qa rsync
```

  

2、如果不存在，安装rsync

```bash
yum install -y rsync
```

  

3、配置rsync的配置文件/etc/rsyncd.conf

vim /etc/rsyncd.conf

```bash
uid = rsync												# 同步的用户
gid = rsync												# 同步的组
address =172.16.1.15							# 本机IP
port =873													# 本机端口
hosts allow =172.16.1.0/24				# 允许连接的客户端
use chroot = no										# 是否固定目录
max connections = 50							# 允许的最大连接数
pid file =/var/run/rsyncd.pid			# pid文件
lock file =/var/run/rsync.lock		# lock文件
log file =/var/log/rsyncd.log			# 日志文件
motd file =/etc/rsyncd.motd				# 提示信息

[backup]													# 模块
path =/backup											# 备份到的目录
comment = used for web-data root
read only = false									# 是否只读
list = yes
auth users = rsyncuser						# 同步的认证用户
secrets file =/etc/rsyncd.passwd	# 认证的用户名和密码
```

  

4、添加用户名和密码

```bash
echo "rsyncuser:password" > /etc/rsyncd.passwd
chmod 600 /etc/rsyncd.passwd											# 只能是600权限
```

  

5、创建备份用户，如果存在此步略

```bash
useradd rsync -s /sbin/nologin –M
```

  

6、启动

```bash
rsync --daemon --config=/etc/rsyncd.conf  
```

启动完后可以看本机873端口是否存在。

  

# Rsync客户端搭建

安装rsync步骤和上面一样。

1、安装，略

2、创建密码文件

```bash
echo "password" > /etc/rsyncd.passwd
chmod 600 /etc/rsyncd.passwd
```

  

3、可以创建一个目录进行测试

```bash
mkdir /backup
touch /backup/file{1..10}
rsync -avz /backup/ rsyncuser@172.16.1.15::backup --password-file=/etc/rsyncd.passwd
```

  

# SeRsync实时同步

1、下载SeRsync

```bash
wget  https://storage.googleapis.com/google-code-archive-downloads/v2/code.google.com/sersync/sersync2.5.4_64bit_binary_stable_final.tar.gz
```

  

2、解压安装包

```bash
tar xf sersync2.5.4_64bit_binary_stable_final.tar.gz
```

  

3、创建需要的目录

```bash
mkdir /usr/local/sersync
mkdir /usr/local/sersync/conf
mkdir /usr/local/sersync/logs
mkdir /usr/local/sersync/bin
```

  

4、拷贝配置文件和启动脚本到创建的目录中

```bash
mv GNU-Linux-x86/sersync2 /usr/local/sersync/bin/
mv GNU-Linux-x86/confxml.xml /usr/local/sersync/conf/
```

  

5、配置配置文件confxml.xml

```bash
<?xml version="1.0" encoding="ISO-8859-1"?>
<head version="2.5">
	<!-- 本机IP地址和端口 -->
    <host hostip="172.16.1.16" port="8008"></host>
    <debug start="false"/>
    <fileSystem xfs="false"/>
    <filter start="false">
        <exclude expression="(.*)\.svn"></exclude>
        <exclude expression="(.*)\.gz"></exclude>
        <exclude expression="^info/*"></exclude>
        <exclude expression="^static/*"></exclude>
    </filter>
    <inotify>
        <delete start="true"/>
        <createFolder start="true"/>
        <createFile start="false"/>
        <closeWrite start="true"/>
        <moveFrom start="true"/>
        <moveTo start="true"/>
        <attrib start="false"/>
        <modify start="false"/>
    </inotify>
    <sersync>
    	<!-- 监听目录，该目录下文件发生变化，就触发同步 -->
        <localpath watch="/backup/">
        	<!-- 服务端IP和模块名 -->
            <remote ip="172.16.1.15" name="backup"/>
            <!--<remote ip="192.168.8.39" name="tongbu"/>-->
            <!--<remote ip="192.168.8.40" name="tongbu"/>-->
        </localpath>
        <rsync>
        	<!-- rsync的参数 -->
            <commonParams params="-avrtuz"/>
            <!-- 认证用户和密码文件 -->
            <auth start="true" users="rsyncuser" passwordfile="/etc/rsyncd.passwd"/>
            <userDefinedPort start="true" port="873"/><!-- port=874 -->
            <timeout start="false" time="100"/><!-- timeout=100 -->                    
            <ssh start="false"/>
        </rsync>
        <failLog path="/tmp/rsync_fail_log.sh" timeToExecute="60"/><!--default every 60mins execute once-->
        <crontab start="false" schedule="600"><!--600mins-->
            <crontabfilter start="false">
                <exclude expression="*.php"></exclude>
                <exclude expression="info/*"></exclude>
            </crontabfilter>
        </crontab>
        <plugin start="false" name="command"/>
    </sersync>
    
    <!-- 以下配置可以不管 -->
    <plugin name="command">
        <param prefix="/bin/sh" suffix="" ignoreError="true"/>  <!--prefix /opt/tongbu/mmm.sh suffix-->
        <filter start="false">
            <include expression="(.*)\.php"/>
            <include expression="(.*)\.sh"/>
        </filter>
    </plugin>
    <plugin name="socket">
        <localpath watch="/opt/tongbu">
            <deshost ip="192.168.138.20" port="8009"/>
        </localpath>
    </plugin>
    <plugin name="refreshCDN">
        <localpath watch="/data0/htdocs/cms.xoyo.com/site/">
            <cdninfo domainname="ccms.chinacache.com" port="80" username="xxxx" passwd="xxxx"/>
            <sendurl base="http://pic.xoyo.com/cms"/>
            <regexurl regex="false" match="cms.xoyo.com/site([/a-zA-Z0-9]*).xoyo.com/images"/>
        </localpath>
    </plugin>
</head>
```

  

6、启动

```bash
/usr/local/sersync/bin/sersync2 -d -r -o /usr/local/sersync/conf/confxml.xml
```