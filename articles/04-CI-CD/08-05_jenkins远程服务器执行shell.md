# jenkins远程服务器执行shell

> 分类：CI/CD / 第8章：Jenkins工具链集成
> 原文：https://www.cuiliangblog.cn/detail/section/166296541
> 来源：崔亮的博客

---

# jenkins免密登录配置
## 安装插件
![](assets/04-CI-CD/9de97a327daaa5a67297.png)

## 配置SSH免密登录
在jenkins主机执行操作。

```bash
[root@jenkins ~]# ssh-keygen
Generating public/private rsa key pair.
Enter file in which to save the key (/root/.ssh/id_rsa): 
Enter passphrase (empty for no passphrase): 
Enter same passphrase again: 
Your identification has been saved in /root/.ssh/id_rsa.
Your public key has been saved in /root/.ssh/id_rsa.pub.
The key fingerprint is:
SHA256:oAXhPPHpYXbfmefBgxkGe9MNKbr1aL9tiuCRoXcUJjk root@jenkins
The key's randomart image is:
+---[RSA 3072]----+
|    +.    .   .. |
|   o + .   +...o |
|    + O . E.B.. .|
|     B + ..B.X   |
|    . . S ooBo=  |
|         ..+oo.o |
|        . =....  |
|         o + ....|
|          . . o+.|
+----[SHA256]-----+
[root@jenkins ~]# ssh-copy-id 192.168.10.74
/usr/bin/ssh-copy-id: INFO: Source of key(s) to be installed: "/root/.ssh/id_rsa.pub"
The authenticity of host '192.168.10.74 (192.168.10.74)' can't be established.
ECDSA key fingerprint is SHA256:FfIN6cvtN9Wqorkx/0enHpwVBAMSDYDMeFt5nO6KHQU.
Are you sure you want to continue connecting (yes/no/[fingerprint])? yes
/usr/bin/ssh-copy-id: INFO: attempting to log in with the new key(s), to filter out any that are already installed
/usr/bin/ssh-copy-id: INFO: 1 key(s) remain to be installed -- if you are prompted now it is to install the new keys
root@192.168.10.74's password: 

Number of key(s) added: 1

Now try logging into the machine, with:   "ssh '192.168.10.74'"
and check to make sure that only the key(s) you wanted were added.

[root@jenkins ~]# ssh 192.168.10.74
Activate the web console with: systemctl enable --now cockpit.socket

Last login: Fri Apr 19 10:28:53 2024 from 192.168.10.100
[root@springboot1 ~]# 
```

## 插件配置
在Jenkins中【系统管理】—【系统配置】，找到“Publish over SSH”来配置该插件信息。

![](assets/04-CI-CD/a2639695b3dc999d8daf.png)

key通过查看jenkins服务器`cat .ssh/id_rsa`获取。

或者填写path to key路径/root/.ssh/id_ras。

# <font style="color:rgb(51, 51, 51);">验证测试</font>
## 创建自由风格项目
![](assets/04-CI-CD/b0971c9981c74e74810a.png)

## 创建测试脚本
在jenkins服务器ssh-test目录下

```bash
[root@jenkins ssh-test]# pwd
/var/lib/jenkins/workspace/ssh-test
[root@jenkins ssh-test]# cat test.sh 
#!/bin/bash
date >> /tmp/date.txt
```

## 添加构建步骤
![](assets/04-CI-CD/274db8a0cab5b3cbaefd.png)

Name：“系统管理>系统配置”设置的SSH Sverver的名字Name。

Source files：允许为空，复制到远程主机上的文件，**/*意思是当前工作目录下所有问题

Remove prefix：允许为空，文件复制时要过滤的目录。

Remote directory：允许为空，文件得到到远程机上的目录，如果填写目录名则是相对于“SSH Server”中的“Remote directory”的，如果不存在将会自动创建。

Exec command：在这里填写在远程主机上执行的命令。

## 构建查看结果
![](assets/04-CI-CD/82697c139c24c87fd7df.png)

由控制台打印内容可知，已经成功传输一个文件。

登录服务器查看执行结果。

```bash
[root@springboot2 jenkins]# cd /opt/jenkins/
[root@springboot2 jenkins]# ll
总用量 4
-rw-r--r-- 1 root root 34 4月  23 23:09 test.sh
[root@springboot2 jenkins]# cat test.sh 
#!/bin/bash
date >> /tmp/date.txt
[root@springboot2 jenkins]# cat /tmp/date.txt 
2024年 04月 23日 星期二 23:09:28 CST
```


