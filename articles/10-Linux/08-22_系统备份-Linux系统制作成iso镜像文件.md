# 系统备份-Linux系统制作成iso镜像文件

> 分类：Linux / 第8章：系统管理
> 原文：https://www.cuiliangblog.cn/detail/section/31508242
> 来源：崔亮的博客

---

    - 通过Mondo       Rescue开源工具来实现linux系统的打包备份，Mondo Rescue是开源的，官网地址[http://www.mondorescue.org/](http://www.mondorescue.org/)。

# 一、下载安装包
+ 可以根据你的系统类型自行去官网下载，由于会有很多依赖关系，条件允许建议者通过网络yum的形式安装
+ rpm  -ivh mondo-3.2.1-1.rhel6.x86_64.rpm

# 二、使用工具备份成镜像
    1. root用户下输入mondoarchive，然后就都是图形操作了
+ [root@TIANCOM  ~]# mondoarchive
+ See  /var/log/mondoarchive.log for details of backup run.
+ Checking  sanity of your Linux distribution
+ .......
    1. 选择标记的存放在服务器本地硬盘里面就可以了，点击回车下一步出现让你选择存放路径，直接默认即可，回车下一步
    2. 一般选择gzip作为压缩条件就可以了，回车下一步
    3. 选择镜像文件的大小，一般直接默认dvd的4480M就好了，选择Ok回车下一步
    4. 替你的镜像命名，随意命名即可，如果有多个镜像工具会在后面自行标记1-9来区分，ok下一步
    5. 选择你要备份的目录，一般默认根目录即可，直接下一步
    6. 选择你要排除的文件，一般镜像存放目录肯定排除不需要备份，还有根目录下的临时文件，或者一些其他不用的，具体根据实际情况和网上一些备份情况斟酌，注意在还原的时候你建立这些没有备份的文件。下一步
    7. 问你是否备份并且检测，点击yes下一步
    8. 选择你的系统内核，redhat内核不要改动，其他系统有些需要改动，不用改的直接下一步
    9. 选择yes就进去备份界面了，
    10. 等待几分钟，系统就会提示你制作成功了，然后到默认路径下查看是否生成iso文件即可。
+ [root@TIANCOM  home]# cd /var/cache/mondo
+ [root@TIANCOM  mondo]# ls -l
+ 总用量  3759816
+ -rw-r--r--.  1 root root         11 10月 31 13:38 difflevel.0
+ -rw-r--r--.  1 root root         11 10月 31 13:38 difflevel.0.aborted
+ -rw-r--r--.  1 root root 3850039296 10月 31 14:32 redhatora11g-1.iso

# 三、恢复镜像
+ 通过软通牒在win上刻录好光盘，刻录成功之后，在另外的机器上试着还原，有四个命令供你选择，一般选择第一个自动恢复(如果你不需要重新分区什么的)


