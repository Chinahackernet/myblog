# linux yum安装

> 分类：Database / 第10章：MySQL部署
> 原文：https://www.cuiliangblog.cn/detail/section/31461017
> 来源：崔亮的博客

---

# 一、安装准备
1. 检查系统中是否安装了mysql 

rpm -qa|grep mysql 

2. 如果有安装mysql,则需要先卸载之前安装的mysql 

yum -y remove mysql 

3. 去MySQL官网中下载YUM源rpm安装包,

[http://dev.mysql.com/downloads/repo/yum/](http://dev.mysql.com/downloads/repo/yum/)

# 二、安装mysql
1. 使用wget下载 yum 源安装包 

wget [https://dev.mysql.com/get/mysql80-community-release-el8-1.noarch.rpm](https://dev.mysql.com/get/mysql80-community-release-el8-1.noarch.rpm)

2. 安装yum源 

rpm -ivh mysql80-community-release-el8-1.noarch.rpm

3. 安装mysql 

yum -y install mysql-server 

5. 安装完成后,启动mysql服务器 

systemctl start mysqld 

systemctl enable mysqld 

6. 然后查看mysql状态 

systemctl status mysqld 

+ 会在 /var/log/mysqld.log文件中会自动生成一个随机的密码,用于安装后登录mysql,查看该随机密码。      

grep “temporary password” /var/log/mysqld.log

# 三、重置mysql 的密码
1. 修改 /etc/my.cnf配置文件，在      [mysqld]下添加一行：skip-grant-tables=1 

这一行配置让 mysqld 启动时不对密码进行验证

1. 重启 mysqld 服务：systemctl      restart mysqld
2. 使用 root 用户登录到      mysql：mysql -u root
3. 切换到mysql数据库(use mysql)，更新 user      表： 

update user set authentication_string = password(‘root’), password_expired = ‘N’, password_last_changed = now() where user = ‘root’; 

在之前的版本中，密码字段的字段名是 password，5.7版本改为了 authentication_string

1. 退出 mysql，编辑 /etc/my.cnf      配置文件，删除 skip-grant-tables=1 这一行
2. systemctl restart mysqld      重启mysqld服务，再用新密码登录即可


