# 一 GitLab Server的搭建

参考：[链接](https://about.gitlab.com/installation)

## 1.准备工作

以centos7为例，准备一台至少内存为4G的机器。

系统版本：CentOS Linux release 7.3.1611 (Core)

软件版本：Gitlab-ce-11.10.1

硬件要求：最低2核4GB，建议4核8GB

## 2.安装依赖软件

```plain
[root@localhost ~]# sudo yum install -y git vim gcc glibc-static telnet
[root@localhost ~]# sudo yum install -y curl policycoreutiels-python openssh-server
[root@localhost ~]# sudo systemctl enable sshd
[root@localhost ~]# sudo systemctl start sshd
[root@localhost ~]# sudo yum install postfix -y 
[root@localhost ~]# sudo systemctl enable postfix
[root@localhost ~]# sudo systemctl start postfix                                                => 启动SSH远程服务
[root@localhost ~]# systemctl stop firewalld                                              => 停止Firewalld防火墙服务
[root@localhost ~]# systemctl disable firewalld                                           => 禁用Firwalld防火墙服务开机自启
[root@localhost ~]# sed -i 's/SELINUX=enforcing/SELINUX=disabled/' /etc/sysconfig/selinux => 关闭SeLinux（重启主机生效）
[root@localhost ~]# setenforce 0    
```

## 3.设置gitlab安装源

国内的话就使用清华大学源，内容为：

```plain
[root@localhost ~]# vim /etc/yum.repos.d/gitlab-ce.repo
[gitlab-ce]
name=Gitlab CE Repository
baseurl=https://mirrors.tuna.tsinghua.edu.cn/gitlab-ce/yum/el$releasever/
gpgcheck=0
enabled=1
[root@localhost ~]# yum makecache
```

## 4、安装Gitlab

```plain
[root@localhost ~]# yum install -y gitlab-ce
可以访问"https://mirrors.tuna.tsinghua.edu.cn/gitlab-ce/yum/el7/"查看Gitlab-ce的版本。
安装历史版本请使用下面命令：
[root@localhost ~]# yum install -y gitlab-ce-{VERSION}
```

## 5、配置Gitlab

建议使用HTTPS。

```plain
[root@localhost ~]# vim /etc/gitlab/gitlab.rb
### 基础配置 ###
external_url 'http://gitlab.example.com/'
#用户访问所使用的URL，域名或者IP地址
gitlab_rails['time_zone'] = 'Asia/Shanghai'
#时区

### SSH配置 ###
gitlab_rails['gitlab_shell_ssh_port'] = 10222
#使用SSH协议拉取代码所使用的连接端口。

### 邮箱配置 ###
gitlab_rails['smtp_enable'] = true
#启用SMTP邮箱功能，绑定一个第三方邮箱，用于邮件发送
gitlab_rails['smtp_address'] = "smtp.exmail.qq.com"
#设置SMTP服务器地址
gitlab_rails['smtp_port'] = 465
#设置SMTP服务器端口
gitlab_rails['smtp_user_name'] = "xxx@xxx.cn"
#设置邮箱账号
gitlab_rails['smtp_password'] = "xxx"
#设置邮箱密码
gitlab_rails['smtp_authentication'] = "login"
#设置邮箱账号密码身份验证方式，"login"表示采用账号密码的方式登陆
gitlab_rails['smtp_enable_starttls_auto'] = true
gitlab_rails['smtp_tls'] = true
#设置开启SMTP邮件使用TLS传输加密协议传输邮件，以保证邮件安全传输
gitlab_rails['gitlab_email_from'] = 'xxx@xxx.cn'
#设置Gitlab来源邮箱地址，设置登陆所使用的邮箱地址

### WEB配置 ###
nginx['enable'] = true
#启用Nginx服务
nginx['client_max_body_size'] = '250m'
#设置客户端最大文件上传大小
nginx['redirect_http_to_https'] = true
#设置开启自动将HTTP跳转到HTTPS
nginx['ssl_certificate'] = "/etc/gitlab/ssl/gitlab.xxx.cn.pem"
#设置HTTPS所使用的证书
nginx['ssl_certificate_key'] = "/etc/gitlab/ssl/gitlab.xxx.cn.key"
#设置HTTPS所使用的证书密码
nginx['ssl_protocols'] = "TLSv1.1 TLSv1.2"
#设置HTTPS所使用的TLS协议版本
nginx['ssl_session_cache'] = "builtin:1000  shared:SSL:10m"
#设置开启SSL会话缓存功能
nginx['ssl_session_timeout'] = "5m"
#设置SSL会话超时时间
nginx['listen_addresses'] = ['*', '[::]']
#设置Nginx监听地址，"*"表示监听主机上所有网卡的地址
nginx['gzip_enabled'] = true
#设置开启Nginx的传输压缩功能，以节约传输带宽，提高传输效率
```

## 6、上传SSL证书到指定目录

```plain
[root@localhost ~]# ll /etc/gitlab/ssl/
total 28
drwxr-xr-x 2 root root 4096 Apr 25 11:48 ./
drwxrwxr-x 4 root root 4096 Apr 25 12:50 ../
-rw-r--r-- 1 root root 1675 Apr 25 11:45 gitlab.xxx.cn.key
-rw-r--r-- 1 root root 3671 Apr 25 11:45 gitlab.xxx.cn.pem
```

## 7、刷新配置

```plain
当配置文件发生变化时，或者是第一次启动时，我们需要刷新配置。
[root@localhost ~]# systemctl restart gitlab-runsvdir
[root@localhost ~]# gitlab-ctl reconfigure
```

## 8、启动服务

```plain
[root@localhost ~]# gitlab-ctl restart
[root@localhost ~]# gitlab-ctl status
run: alertmanager: (pid 13541) 2171s; run: log: (pid 13221) 2192s
run: gitaly: (pid 13557) 2170s; run: log: (pid 12463) 2266s
run: gitlab-monitor: (pid 13580) 2169s; run: log: (pid 13103) 2208s
run: gitlab-workhorse: (pid 13602) 2169s; run: log: (pid 12887) 2226s
run: logrotate: (pid 13617) 2168s; run: log: (pid 12959) 2218s
run: nginx: (pid 13628) 2168s; run: log: (pid 12927) 2222s
run: node-exporter: (pid 13714) 2168s; run: log: (pid 13002) 2214s
run: postgres-exporter: (pid 13720) 2167s; run: log: (pid 13270) 2188s
run: postgresql: (pid 13740) 2167s; run: log: (pid 12669) 2258s
run: prometheus: (pid 13748) 2166s; run: log: (pid 13181) 2198s
run: redis: (pid 13761) 2166s; run: log: (pid 11907) 2293s
run: redis-exporter: (pid 13800) 2165s; run: log: (pid 13143) 2202s
run: sidekiq: (pid 13821) 2163s; run: log: (pid 12872) 2227s
run: unicorn: (pid 13833) 2162s; run: log: (pid 12832) 2233s
```

## 9、测试邮件发送

我们在启动完成后测试一下邮件发送功能是否正常工作。

```plain
[root@localhost ~]# gitlab-rails console
irb(main):001:0> Notify.test_email('邮箱地址', '标题', '内容').deliver_now
irb(main):002:0> exit
```

## 10、第一次访问登陆

本地hosts中加入域名解析[gitlab.example.com](http://gitlab.example.com/)，然后浏览器中输入域名访问，第一次需要输入新的超级管理员（root）密码。

修改成功后，我们使用超级管理员用户“root”账号登录Gitlab管理平台。

![](assets/devops与交付/一_搭建GitLab服务器/一_搭建GitLab服务器-1.png)

![](assets/devops与交付/一_搭建GitLab服务器/一_搭建GitLab服务器-2.png)

## 11、关闭用户注册功能

为了避免用户随便注册账号，我们将注册功能关闭。

![](assets/devops与交付/一_搭建GitLab服务器/一_搭建GitLab服务器-3.png)

![](assets/devops与交付/一_搭建GitLab服务器/一_搭建GitLab服务器-4.png)

## 11、设置语言为"简体中文"

保存后重启登陆即可。

![](assets/devops与交付/一_搭建GitLab服务器/一_搭建GitLab服务器-5.png)

  

# 二、docker安装gitlab

## 1 环境描述

<table class="lake-table" style="width: 921px;"><colgroup><col span="1" width="460" /><col span="1" width="461" /></colgroup><thead><tr style="height: 33px;"><td>环境</td><td>版本</td></tr></thead><tbody><tr style="height: 33px;"><td>centos</td><td>7</td></tr><tr style="height: 33px;"><td>docker</td><td>1.13.1</td></tr><tr style="height: 33px;"><td>gitlab/gitlab-ce</td><td>latest</td></tr></tbody></table>

## 2 确保安装顺利，linux先关闭selinux服务，否则容器内部可能权限不足

  

```plain
vi /etc/selinux/config
-------------------------------
SELINUX=enforcing  #注释掉
SELINUXTYPE=targeted #注释掉
SELINUX=disabled #增加
:wq! #保存退出
-------------------------------
setenforce 0 #使配置立即生效
```

## 3 搜索和下载gitlab镜像

  

```plain
#搜索镜像
docker search gitlab
#下载镜像
sudo docker pull gitlab/gitlab-ce:latest
```

  

## 4 创建docker中的网络

  

```plain
docker network create gitlab_net
```

## 5 使用镜像创建容器，并且使重要数据外部挂载到宿主机

  

```plain
docker run --name='gitlab' -d \
--net=gitlab_net \
--publish 443:443 --publish 80:80 \
--restart always \
--volume ~/docker/gitlab/config:/etc/gitlab \
--volume ~/docker/gitlab/logs:/var/log/gitlab \
--volume ~/docker/gitlab/data:/var/opt/gitlab \
--privileged=true \
gitlab/gitlab-ce:latest
```

  

```plain
## 查看容器是否运行起来
docker ps | grep gitlab
```

  

> ***参数解析***
> 
> **1.http端口使用 80  
> 2.网络使用 gitlab\_net网络  
> 3.将容器内部 /etc/gitlab,/var/log/gitlab,/var/opt/gitlab - 挂载到宿主机的 /root/docker/gitlab/config,logs,data 下，防止容器被删除数据丢失  
> 4.privileged=true 使用特权，怕什么地方权限不足，安装不顺  
> 5./root/docker/gitlab下的config,logs,data没有的话，创建容器会一并创建**

## 6 修改配置文件中的访问域名

```plain
vim ~/docker/gitlab/config/gitlab.rb
...
external_url 'http://gitlab.example.com/'
#用户访问所使用的URL，域名或者IP地址
...
```

## 7 打开浏览器看成效

> 浏览器输入 [http://gitlab.example.com/](http://gitlab.example.com/) 进行访问，第一次登陆需要修改密码
> 
> 这样子就安装OK了，输入账号密码进行注册

![](assets/devops与交付/一_搭建GitLab服务器/一_搭建GitLab服务器-6.png)

# 三、常见问题

1、访问浏览器被拒绝，不要慌 使用 docker logs gitlab 查看日志，看报什么错，进行解决

2、访问返回502，一般情况下是端口冲突  
修改gitlab.rb文件，设置端口,重启容器，稍等一会访问

  

```plain
#编辑文件
vi /root/docker/gitlab/config/gitlab.rb
#找到 unicorn['port'] = 8080 的地方，修改为不会被占用的端口
unicorn['port'] = 8888
#保存
:wq!
#重启容器 
docker restart gitlab
```

3、访问比较缓慢

因为镜像就有一个多G，每次启动容器，重启，需要花一段时间等待。

4、访问还是502

看看CPU占用率，电脑容量，有些情况是因为CPU、内存耗尽导致

  

> gitlab服务的搭建就到这里，下篇会写gitlab-ci runner的安装部署