## 1、关于日志切割

　　日志文件包含了关于系统中发生的事件的有用信息，在排障过程中或者系统性能分析时经常被用到。对于忙碌的服务器，日志文件大小会增长极快，服务器会很快消耗磁盘空间，这成了个问题。除此之外，处理一个单个的庞大日志文件也常常是件十分棘手的事。

　　logrotate是个十分有用的工具，它可以自动对日志进行截断（或轮循）、压缩以及删除旧的日志文件。例如，你可以设置logrotate，让/var/log/foo日志文件每30天轮循，并删除超过6个月的日志。配置完后，logrotate的运作完全自动化，不必进行任何进一步的人为干预。

## 2、安装logrotate

系统版本说明

```bash
[root@clsn6 ~]# cat /etc/redhat-release 
CentOS release 6.9 (Final)
[root@clsn6 ~]# uname -r 
2.6.32-696.el6.x86_64
```

  

默认centos系统安装自带logrotate，安装方法如下

```bash
yum -y install logrotate crontabs
```

  

软件包信息说明

```bash
[root@clsn6 ~]# rpm -ql  logrotate
/etc/cron.daily/logrotate
/etc/logrotate.conf  # 主配置文件
/etc/logrotate.d   # 配置目录
```

  

logrotate的配置文件是/etc/logrotate.conf，通常不需要对它进行修改。日志文件的轮循设置在独立的配置文件中，它（们）放在/etc/logrotate.d/目录下。

## 3、实践配置logrotate

### 3.1 测试logrotate如何管理日志

　　这里我们将创建一个10MB的日志文件/var/log/log-file。我们将展示怎样使用logrotate来管理该日志文件。

我们从创建一个日志文件开始吧，然后在其中填入一个10MB的随机比特流数据文件。

```bash
[root@clsn6 ~]# touch /var/log/log-file
[root@clsn6 ~]# head -c 10M < /dev/urandom > /var/log/log-file
```

  

由于现在日志文件已经准备好，我们将配置logrotate来轮循该日志文件。让我们为该文件创建一个配置文件。

```bash
[root@clsn6 ~]# vim /etc/logrotate.d/log-file 
/var/log/log-file {
    monthly
    rotate 5
    compress
    delaycompress
    missingok
    notifempty
    create 644 root root
    postrotate
        /usr/bin/killall -HUP rsyslogd
    endscript
}
```

  

　　上面的模板是通用的，而配置参数则根据你的需求进行调整，不是所有的参数都是必要的。也可以通过man手册中的例子进行配置。

### 3.2配置文件说明

<table style="width: 784px;" class="lake-table"><colgroup><col><col></colgroup><tbody><tr style="height: 33px;"><td style="background: #9BBB59;"><p style="text-align: center;" data-lake-id="c08182d17610aaf46453e2f6d0755424"><strong><span style="color: white;">配置参数</span></strong></p></td><td style="background: #9BBB59;"><p style="text-align: center;" data-lake-id="fe79a0e3c8560ba59962482ca39b3d43"><strong><span style="color: white;">说明</span></strong></p></td></tr><tr style="height: 33px;"><td style="background: #EAF1DD;"><p style="text-align: justify;" data-lake-id="4186cbd29a47a07ffe90180bca7d73bd"><strong><span>monthly</span></strong></p></td><td style="background: #EAF1DD;"><p style="text-align: justify;" data-lake-id="03f4045be254a3f935c956b06ed498c7"><span>日志文件将按月轮循。其它可用值为</span><span>'daily'</span><span>，</span><span>'weekly'</span><span>或者</span><span>'yearly'</span><span>。</span></p></td></tr><tr style="height: 33px;"><td><p style="text-align: justify;" data-lake-id="555aace28e43bfa4366ef07d664b20c9"><strong><span>rotate 5</span></strong></p></td><td><p style="text-align: justify;" data-lake-id="117dfc8108dd4358595999d7f72f8d67"><span>一次将存储</span><span>5</span><span>个归档日志。对于第六个归档，时间最久的归档将被删除。</span></p></td></tr><tr style="height: 33px;"><td style="background: #EAF1DD;"><p style="text-align: justify;" data-lake-id="f43cec341f088799270ec50134d01213"><strong><span>compress</span></strong></p></td><td style="background: #EAF1DD;"><p style="text-align: justify;" data-lake-id="d7ce52f79e6a44a3c8d0c87d892569f2"><span>在轮循任务完成后，已轮循的归档将使用</span><span>gzip</span><span>进行压缩。</span></p></td></tr><tr style="height: 33px;"><td><p style="text-align: justify;" data-lake-id="f5c95146382219e01cb0352fcea89f76"><strong><span>delaycompress</span></strong></p></td><td><p style="text-align: justify;" data-lake-id="13d6b631a36f29440dc63d054e9911e2"><span>总是与</span><span>compress</span><span>选项一起用，</span><span>delaycompress</span><span>选项指示</span><span>logrotate</span><span>不要将最近的归档压缩，压缩将在下一次轮循周期进行。这在你或任何软件仍然需要读取最新归档时很有用。</span></p></td></tr><tr style="height: 33px;"><td style="background: #EAF1DD;"><p style="text-align: justify;" data-lake-id="cd14a1d1dedb0c69806c65894d48847f"><strong><span>missingok</span></strong></p></td><td style="background: #EAF1DD;"><p style="text-align: justify;" data-lake-id="e28a33ea7712064f9d03658f0ac0d1a5"><span>在日志轮循期间，任何错误将被忽略，例如“文件无法找到”之类的错误。</span></p></td></tr><tr style="height: 33px;"><td><p style="text-align: justify;" data-lake-id="890f2b248c0e4e099e6096d44bda9428"><strong><span>notifempty</span></strong></p></td><td><p style="text-align: justify;" data-lake-id="df9d8c277346fd13f136992da8c16c37"><span>如果日志文件为空，轮循不会进行。</span></p></td></tr><tr style="height: 33px;"><td style="background: #EAF1DD;"><p style="text-align: justify;" data-lake-id="83c969a4c294dab9cd4734748e90620c"><strong><span>create 644 root root</span></strong></p></td><td style="background: #EAF1DD;"><p style="text-align: justify;" data-lake-id="516a372bd5da9eeac8fa47a22791b373"><span>以指定的权限创建全新的日志文件，同时</span><span>logrotate</span><span>也会重命名原始日志文件。</span></p></td></tr><tr style="height: 33px;"><td><p style="text-align: justify;" data-lake-id="fff48c7133555e60c890e2399947a8e9"><strong><span>postrotate/endscript</span></strong></p></td><td><p style="text-align: justify;" data-lake-id="cb19ffd52341446a1b06bc9d3e1eef14"><span>在所有其它指令完成后，</span><span>postrotate</span><span>和</span><span>endscript</span><span>里面指定的命令将被执行。在这种情况下，</span><span>rsyslogd&nbsp;</span><span>进程将立即再次读取其配置并继续运行。</span></p></td></tr><tr style="height: 33px;"><td colspan="2" style="background: #DAEEF3;"><p style="text-align: justify;" data-lake-id="f328913de5fbb40f54e780aedadecc28"><span>以上信息来源</span> <span>"man logrotate"</span></p></td></tr></tbody></table>

### 3.3手动运行logrotate

logrotate可以在任何时候从命令行手动调用。要调用为/etc/lograte.d/下配置的所有日志调用logrotate：

```bash
[root@clsn6 ~]# logrotate /etc/logrotate.conf
```

  

要为某个特定的配置调用logrotate,执行一次切割任务测试

```bash
[root@clsn6 ~]# ll /var/log/log-file 
-rw-r--r-- 1 root root 10485760 Feb  7 18:50 /var/log/log-file
[root@clsn6 ~]# logrotate -vf /etc/logrotate.d/log-file 
[root@clsn6 ~]# ll /var/log/log-file* 
-rw-r--r-- 1 root root        0 Feb  7 19:17 /var/log/log-file
-rw-r--r-- 1 root root 10485760 Feb  7 18:50 /var/log/log-file.1
```

  

即使轮循条件没有满足，我们也可以通过使用‘-f’选项来强制logrotate轮循日志文件，‘-v’参数提供了详细的输出。

### 3.4Logrotate的记录日志

　　logrotate自身的日志通常存放于/var/lib/logrotate/status目录。如果处于排障目的，我们想要logrotate记录到任何指定的文件，我们可以指定像下面这样从命令行指定。

```bash
[root@clsn6 ~]# logrotate -vf -s /var/log/logrotate-status /etc/logrotate.d/log-file
reading config file /etc/logrotate.d/log-file
reading config info for /var/log/log-file 
Handling 1 logs
rotating pattern: /var/log/log-file  forced from command line (5 rotations)
empty log files are not rotated, old logs are removed
considering log /var/log/log-file
  log does not need rotating
not running postrotate script, since no logs were rotated
```

  

### 3.5 Logrotate定时任务

logrotate需要的cron任务应该在安装时就自动创建了，我把cron文件的内容贴出来，以供大家参考。

```bash
[root@clsn6 ~]# cat /etc/cron.daily/logrotate 
#!/bin/sh
/usr/sbin/logrotate /etc/logrotate.conf
EXITVALUE=$?
if [ $EXITVALUE != 0 ]; then
    /usr/bin/logger -t logrotate "ALERT exited abnormally with [$EXITVALUE]"
fi
exit 0
```

  

## 4、logrotate生产应用

### 4.1为nginx设置日志切割

防止访问日志文件过大

```bash
[root@clsn nginx]# cat /etc/logrotate.d/nginx 
/var/log/nginx/*.log {
    daily
    rotate 5
    missingok
    notifempty
    create 644 www www
    postrotate
      if [ -f /application/nginx/logs/nginx.pid ]; then
          kill -USR1 `cat /application/nginx/logs/nginx.pid`
      fi
endscript
}
```

  

logrotate工具对于防止因庞大的日志文件而耗尽存储空间是十分有用的。配置完毕后，进程是全自动的，可以长时间在不需要人为干预下运行。本教程重点关注几个使用logrotate的几个基本样例，你也可以定制它以满足你的需求。

　　**对于其他服务日志切割后续补充**

## 5、附录

### 5.1关于USR1信号解释

　　摘自： [http://www.xuebuyuan.com/323422.html](http://www.xuebuyuan.com/323422.html)

> USR1亦通常被用来告知应用程序重载配置文件；例如，向Apache HTTP服务器发送一个USR1信号将导致以下步骤的发生：停止接受新的连接，等待当前连接停止，重新载入配置文件，重新打开日志文件，重启服务器，从而实现相对平滑的不关机的更改。内容摘自wiki：[http://zh.wikipedia.org/wiki/SIGUSR1%E5%92%8CSIGUSR2](http://zh.wikipedia.org/wiki/SIGUSR1%25E5%2592%258CSIGUSR2)　　

　　对于USR1和2都可以用户自定义的，在POSIX兼容的平台上，SIGUSR1和SIGUSR2是发送给一个进程的信号，它表示了用户定义的情况。它们的符号常量在头文件signal.h中定义。在不同的平台上，信号的编号可能发生变化，因此需要使用符号名称。

kill -HUP pid 或者 killall -HUP pName：

　　其中pid是进程标识，pName是进程的名称。

　　如果想要更改配置而不需停止并重新启动服务，可以使用上面两个命令。在对配置文件作必要的更改后，发出该命令以动态更新服务配置。根据约定，当你发送一个挂起信号(信号1或HUP)时，大多数服务器进程(所有常用的进程)都会进行复位操作并重新加载它们的配置文件。

### 5.2常见配置参数小结

<table style="width: 776px;" class="lake-table"><colgroup><col><col></colgroup><tbody><tr style="height: 33px;"><td style="background: #9BBB59;"><p style="text-align: center;" data-lake-id="05fc2a41d33ee25bab84401719e50133"><strong><span style="color: white;">配置参数</span></strong></p></td><td style="background: #9BBB59;"><p style="text-align: center;" data-lake-id="3585b40865d65a3a165b765bdb1c7e3d"><strong><span style="color: white;">说明</span></strong></p></td></tr><tr style="height: 33px;"><td style="background: #EAF1DD;"><p style="text-align: justify;" data-lake-id="98506ed88da2bfae52052b89894ca843"><strong><span>compress&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></strong></p></td><td style="background: #EAF1DD;"><p style="text-align: justify;" data-lake-id="e37ebb78bfb95d68e50fbf14b2d01ce3"><span>通过</span><span>gzip</span><span>压缩转储以后的日志</span></p></td></tr><tr style="height: 33px;"><td><p style="text-align: justify;" data-lake-id="9ff9096f2d4c91b3958dca6d3d39aff1"><strong><span>nocompress&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></strong></p></td><td><p style="text-align: justify;" data-lake-id="3a13b792ed96b79d295a85f946e64adb"><span>不压缩</span></p></td></tr><tr style="height: 33px;"><td style="background: #EAF1DD;"><p style="text-align: justify;" data-lake-id="7133cd32f908ebc9f27dc5127b41e7f9"><strong><span>copytruncate&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></strong></p></td><td style="background: #EAF1DD;"><p style="text-align: justify;" data-lake-id="89487e2fdc2c8d8e453fd4c3684175b4"><span>用于还在打开中的日志文件，把当前日志备份并截断</span></p></td></tr><tr style="height: 33px;"><td><p style="text-align: justify;" data-lake-id="a1d606585749051c0739ef311bbef66e"><strong><span>nocopytruncate&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></strong></p></td><td><p style="text-align: justify;" data-lake-id="5c334f0a6b3898303224855662976741"><span>备份日志文件但是不截断</span></p></td></tr><tr style="height: 33px;"><td style="background: #EAF1DD;"><p style="text-align: justify;" data-lake-id="dc5be986f54a7ee3e928f02a6b9a252d"><strong><span>create<em>&nbsp;mode owner group</em> </span></strong></p></td><td style="background: #EAF1DD;"><p style="text-align: justify;" data-lake-id="5244eb57608e26b3c1b4b3e806cf8987"><span>转储文件，使用指定的文件模式创建新的日志文件</span></p></td></tr><tr style="height: 33px;"><td><p style="text-align: justify;" data-lake-id="3ee427f3d08a1c7fcf065e074df4f3d7"><strong><span>nocreate&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></strong></p></td><td><p style="text-align: justify;" data-lake-id="2e27b238bb543d16d9d55a88182974ad"><span>不建立新的日志文件</span></p></td></tr><tr style="height: 33px;"><td style="background: #EAF1DD;"><p style="text-align: justify;" data-lake-id="3499a9af20ca562d5a4a2607e3d81f76"><strong><span>delaycompress&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></strong></p></td><td style="background: #EAF1DD;"><p style="text-align: justify;" data-lake-id="ce0312e9cf4a603d243b831978cfc33b"><span>和</span> compress <span>一起使用时，转储的日志文件到下一次转储时才压缩</span></p></td></tr><tr style="height: 33px;"><td><p style="text-align: justify;" data-lake-id="66f8959b967fff1776ff931bb9c8a37f"><strong><span>nodelaycompress&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></strong></p></td><td><p style="text-align: justify;" data-lake-id="493254866704313d7aab03dee2b69045"><span>覆盖</span> delaycompress <span>选项，转储同时压缩。</span></p></td></tr><tr style="height: 33px;"><td style="background: #EAF1DD;"><p style="text-align: justify;" data-lake-id="b65924ae1e5a5554826c74c698358a4a"><strong><span>errors address&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></strong></p></td><td style="background: #EAF1DD;"><p style="text-align: justify;" data-lake-id="c4a4f2a069b22986bca6dcdf0320218c"><span>专储时的错误信息发送到指定的</span><span>Email&nbsp;</span><span>地址</span></p></td></tr><tr style="height: 33px;"><td><p style="text-align: justify;" data-lake-id="2bdf9d2dc303c766ebab80ab52d13c2f"><strong><span>ifempty&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></strong></p></td><td><p style="text-align: justify;" data-lake-id="4014aa4f8166a69d84fbdcb0e8b60426"><span>即使是空文件也转储，这个是</span> logrotate <span>的缺省选项。</span></p></td></tr><tr style="height: 33px;"><td style="background: #EAF1DD;"><p style="text-align: justify;" data-lake-id="1f163f588d3335c38c188a891eb7621e"><strong><span>notifempty&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></strong></p></td><td style="background: #EAF1DD;"><p style="text-align: justify;" data-lake-id="f0d2f271fe66163d77ac8c9a002a7bae"><span>如果是空文件的话，不转储</span></p></td></tr><tr style="height: 33px;"><td><p style="text-align: justify;" data-lake-id="eb02e0059c6afd9fb586bed57fe7ff92"><strong><span>mail <em>address&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</em> &nbsp;&nbsp;&nbsp;</span></strong></p></td><td><p style="text-align: justify;" data-lake-id="56bc7d97df0e2089c5441fbbd773817e"><span>把转储的日志文件发送到指定的</span><span>E-mail&nbsp;</span><span>地址</span></p></td></tr><tr style="height: 33px;"><td style="background: #EAF1DD;"><p style="text-align: justify;" data-lake-id="e8e69bf2d90256971ed75d894e0a93a7"><strong><span>nomail&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></strong></p></td><td style="background: #EAF1DD;"><p style="text-align: justify;" data-lake-id="cac61b5ab13650784b2d0ed9103cfc0d"><span>转储时不发送日志文件</span></p></td></tr><tr style="height: 33px;"><td><p style="text-align: justify;" data-lake-id="d7894c2af18dac42655b3173adbcf090"><strong><span>olddir<em>&nbsp;directory&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</em> &nbsp;&nbsp;&nbsp;</span></strong></p></td><td><p style="text-align: justify;" data-lake-id="22a091c5d460d33efd31f282aba9c095"><span>转储后的日志文件放入指定的目录，必须和当前日志文件在同一个文件系统</span></p></td></tr><tr style="height: 33px;"><td style="background: #EAF1DD;"><p style="text-align: justify;" data-lake-id="ca41954690e27e741c749110a7543f75"><strong><span>noolddir&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></strong></p></td><td style="background: #EAF1DD;"><p style="text-align: justify;" data-lake-id="999b6728cc8c789756b4bd64b6ef3ac2"><span>转储后的日志文件和当前日志文件放在同一个目录下</span></p></td></tr><tr style="height: 33px;"><td><p style="text-align: justify;" data-lake-id="8d74a8b064451574f7d092b6a4464f02"><strong><span>prerotate/endscript&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></strong></p></td><td><p style="text-align: justify;" data-lake-id="dba05cce393dda3b85d5d90ea267aa00"><span>在转储以前需要执行的命令可以放入这个对，这两个关键字必须单独成行</span></p></td></tr><tr style="height: 33px;"><td style="background: #EAF1DD;"><p style="text-align: justify;" data-lake-id="b33b6b2c6bb659041415958ddb01958f"><strong><span>daily&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></strong></p></td><td style="background: #EAF1DD;"><p style="text-align: justify;" data-lake-id="9c41956efc0cf1e1e23c112f9198e2eb"><span>指定转储周期为每天</span></p></td></tr><tr style="height: 33px;"><td><p style="text-align: justify;" data-lake-id="d93affa4e1aeb10e072e907bdd861cd3"><strong><span>weekly&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></strong></p></td><td><p style="text-align: justify;" data-lake-id="932c6c64de985e4313f4e46ea9dd4023"><span>指定转储周期为每周</span></p></td></tr><tr style="height: 33px;"><td style="background: #EAF1DD;"><p style="text-align: justify;" data-lake-id="7607720e584a45a541220cf3d0853b10"><strong><span>monthly&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></strong></p></td><td style="background: #EAF1DD;"><p style="text-align: justify;" data-lake-id="361605011744bfdfaa663ae0d7527738"><span>指定转储周期为每月</span></p></td></tr><tr style="height: 33px;"><td><p style="text-align: justify;" data-lake-id="63b930cc9671a9c481b304aefba574ff"><strong><span>rotate count&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></strong></p></td><td><p style="text-align: justify;" data-lake-id="469f91eb16a8fb6e37f04837484348dc"><span>指定日志文件删除之前转储的次数，</span><span>0&nbsp;</span><span>指没有备份，</span><span>5&nbsp;</span><span>指保留</span><span>5&nbsp;</span><span>个备份</span></p></td></tr><tr style="height: 33px;"><td style="background: #EAF1DD;"><p style="text-align: justify;" data-lake-id="82f256f7bc44b434cbb946647c9a8b41"><strong><span>tabooext [+] list</span></strong></p></td><td style="background: #EAF1DD;"><p style="text-align: justify;" data-lake-id="fbba0588a10b374d2be8ca9176eb7f3d"><span>让</span><span>logrotate</span><span>不转储指定扩展名的文件，缺省的扩展名是：</span><span>.rpm-orig, .rpmsave, v,&nbsp;</span><span>和</span> ~</p></td></tr><tr style="height: 33px;"><td><p style="text-align: justify;" data-lake-id="4a0c83a043b36613846d6bf5268f0693"><strong><span>size size&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></strong></p></td><td><p style="text-align: justify;" data-lake-id="475d3f623d4b6a39d22e1895084be0a0"><span>当日志文件到达指定的大小时才转储，</span><span>bytes(</span><span>缺省</span><span>)</span><span>及</span><span>KB(sizek)</span><span>或</span><span>MB(sizem)</span></p></td></tr><tr style="height: 33px;"><td style="background: #EAF1DD;"><p style="text-align: justify;" data-lake-id="39bcd57196fa1ff615d18966b655c211"><strong><span>missingok</span></strong></p></td><td style="background: #EAF1DD;"><p style="text-align: justify;" data-lake-id="8d1ed53744b21f7d88c194e020533516"><span>在日志轮循期间，任何错误将被忽略，例如“文件无法找到”之类的错误。</span></p></td></tr></tbody></table>