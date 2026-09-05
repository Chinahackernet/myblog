# 一、Git和SVN的区别

和SVN类似，Git是一个版本控制系统（Version Control System，VCS），不同的是**SVN为集中式版本控制系统**，为单一的集中管理的服务器，保存所有文件的修订版本，而协同工作的人们都通过客户端连到这台服务器，取出最新的文件或者提交更新，**git为分布式版本控制系统，**关于SVN和git的对比，可以通过下图进行说明（但最大的区别在于svn为集中式，git为分布式）

  
![](assets/devops与交付/Gitlab/Gitlab-1.png)

svn好比一个巨大的图书馆，当你要借一本书的时候，需要先从图书馆借出，回家之后自己改，改完之后还是返回给图书馆，而git的方式完全不同，所有的客户端都一个是完整的版本库，没有中央控制的概念，可以这样类比，git提供了一个虚拟的全量图书馆，所有人都有一个虚拟的图书馆，当你想看其中一本书的时候，从自己的虚拟图书馆里面检索出来即可，如果你修改了其中的内容，可以直接提交到自己的虚拟图书馆里面，也不会影响其他人的图书馆，当有其他人想要看你修改的一本书的时候，你只要将对应的一本书的URL发给对方即可。

# 二、Gitlab的搭建与使用

Gitlab可以用rpm包安装，也可以用yum安装。我们这里采用yum安装。

## 2.1 配置YUM源

```plain
# 配置yum源
# cd /etc/yum.repos.d/
# vim gitlab_ce.repo
[gitlab-ce]  
name=gitlab-ce  
baseurl=http://mirrors.tuna.tsinghua.edu.cn/gitlab-ce/yum/el7  
repo_gpgcheck=0  
gpgcheck=0  
enabled=1  
gpgkey=https://packages.gitlab.com/gpg.key
```

## 2.2 安装与配置

### 2.2.1 安装

```plain
# yum install gitlab-ce -y
```

### 2.2.2 配置

  

```plain
	# 配置gitlab域名访问地址
	# vim /etc/gitlab/gitlab.rb
	改：external_url 'http://gitlab.example.com'
	为：external_url 'http://172.16.2.220'
	
	# 重新配置应用程序，修改了gitlab配置文件，都要执行这个命令
	# gitlab-ctl reconfigure
	# 查看gitlab状态
	# gitlab-ctl status
```

![image.png](assets/devops与交付/Gitlab/Gitlab-2.png)

### 2.2.3 使用

（1）、浏览器访问：[http://172.16.2.220](http://172.16.2.220)，设置密码

![image.png](assets/devops与交付/Gitlab/Gitlab-3.png)

（2）、登录，用户名是root，密码是设置的密码

![image.png](assets/devops与交付/Gitlab/Gitlab-4.png)

（3）、关闭注册功能

![image.png](assets/devops与交付/Gitlab/Gitlab-5.png)

（4）、创建组

![image.png](assets/devops与交付/Gitlab/Gitlab-6.png)

（5）、创建项目

![image.png](assets/devops与交付/Gitlab/Gitlab-7.png)

（6）、创建用户

![image.png](assets/devops与交付/Gitlab/Gitlab-8.png)

（7）、配置公钥，使用SSH拉取代码

```plain
# 生成公钥
# ssh-keygen
# 查看公钥
# cat ~/.ssh/id_rsa.pub
# 把公钥添加到项目里
```

  

![image.png](assets/devops与交付/Gitlab/Gitlab-9.png)

# 三、Gitlab备份

使用Gitlab一键安装包安装Gitlab非常简单, 同样的备份恢复与迁移也非常简单. 使用一条命令即可创建完整的Gitlab备份。

```plain
gitlab-rake gitlab:backup:create 
```

使用以上命令会在/var/opt/gitlab/backups目录下创建一个名称类似为1481598919\_gitlab\_backup.tar的压缩包, 这个压缩包就是Gitlab整个的完整部分, 其中开头的1481598919是备份创建的日期，此处以事务的形式进行gitlab的定时备份，创建定时脚本/iyunwen/bin/git\_backup/git\_backup.sh ，内容如下：

  

```plain
#!/bin/bash

cd /var/opt/gitlab/backups/

gitlab-rake gitlab:backup:create  

find  /var/opt/gitlab/backups/  -type f -ctime +5 -exec rm -rf {} \;
加入事务：echo "30 03 * * * root run-parts /iyunwen/bin/git_backup/" >>  /etc/crontab 

每天3:30分定时备份gitlab版本数据
```

  

# 四、G**itlab的迁移及数据恢复**

迁移如同备份与恢复的步骤一样, 只需要将老服务器/var/opt/gitlab/backups目录下的备份文件拷贝到新服务器上的/var/opt/gitlab/backups即可(如果你没修改过默认备份目录的话)

但是需要注意的是新服务器上的Gitlab的版本必须与创建备份时的Gitlab版本号相同. 比如新服务器安装的是最新的10.2.2版本的Gitlab, 那么迁移之前, 最好将老服务器的Gitlab 升级为10.2.2在进行备份。

  

（1）、停止gitlab服务

```plain
 gitlab-ctl stop unicorn

 gitlab-ctl stop sidekiq
```

（2）上传备份文件至/var/opt/gitlab/backups，此处的备份文件名称为：1534793618\_gitlab\_backup.tar

  
（3）、数据恢复

  

```plain
cd /var/opt/gitlab/backups

chmod 777 1534793618_gitlab_backup.tar

gitlab-rake gitlab:backup:restore BACKUP=1534793618
```

# 五、Gitlab项目迁

旧地址：git.aaa.com，新地址：git.bbb.net

（1）、查看目前的gitlab地址

```plain
# git remote -v
origin    git@git.aaa.com:360fang/360-fang.git (fetch)
origin    git@git.aaa.com:360fang/360-fang.git (push)
```

（2）、在新的gitlab上新建fang项目，生成gitlab地址：git@git.bbb:360-fyd/fang.git

（3）、设置把本地gitlab地址替换成为新gitlab地址

```plain
# git remote set-url origin git@git.bbb.net:360-fyd/fang.git
# git remote -v
origin  git@git.bbb.net:360-fyd/fang.git (fetch)
origin  git@git.bbb.net:360-fyd/fang.git (push)
```

（4）、查看分支情况

```plain
# git branch -a
master
* v1.0.0
v1.1.1
remotes/origin/HEAD -> origin/master
remotes/origin/develop
remotes/origin/master
remotes/origin/newtrust
remotes/origin/trust
remotes/origin/v1.0.0
remotes/origin/v1.0.1
remotes/origin/v1.1.1
```

（5）、把本地指定分支，推送到新的远程代码仓库

```plain
# git push origin master:master
```

（6）、把远程分支推送到远程

第一步：先checkout远程分支到本地

```plain
# git checkout -b develop origin/develop
```

  

第二步：在push本地分支到远程仓库

```plain
# git push origin develop:develop
```