## 5.7

  

```bash
[root@xld ~]# rpm -q centos-release
centos-release-7-7.1908.0.el7.centos.x86_64
在此环境上成功安装
```

#### 1、home目录下新建安装包存放位置

```bash
cd home
mkdir install_packet
cd /home/install_packet
```

#### 2、检查是否已经过mysql，新买的服务器未安装过mysql直接略过

```bash
yum list installed | grep mysql
```

注意：如果已安装,则清除

```bash
yum -y remove mysql-libs.x86_64
```

#### 3、下载mysql5.7 rpm源

```bash
wget http://repo.mysql.com/mysql57-community-release-el7-8.noarch.rpm
```

#### 4、安装下载好的rpm包

```bash
rpm -ivh mysql57-community-release-el7-8.noarch.rpm
```
```bash
拓展rpm知识：
-i	安装软件包		-e	删除软件包		-U	升级软件包
-v			显示安装过程
-h			显示进度
-q			查询某个包是否已经安装，例：rpm -q mysql
-qa			查询所有被安装的rpm package
-qf			查询某个文件属于哪个包
-ql			查询某个已安装软件所包含的所有文件
-qpR		查询某个包的依赖关系
安装参数
--force		即使覆盖属于其它包的文件也强制安装
--nodeps	如果该RPM包的安装依赖其它包，即使其它包没装，也强制安装
```

更多`rpm`命令请查看 [https://man.linuxde.net/rpm](https://man.linuxde.net/rpm)

安装成功后，会在`/etc/yum.repos.d/`目录下增加了以下两个文件

> -   mysql-community.repo
> -   mysql-community-source.repo

```bash
查看命令
ls /etc/yum.repos.d/
```

#### 5、安装mysql

```bash
yum install -y mysql-server
```

#### 6、查看下mysql的版本，确定是否安装成功

```bash
mysql -V
```

#### 7、运行mysql

```bash
service mysqld start
```

#### 8、取得mysql初始化随机密码

```bash
grep "password" /var/log/mysqld.log
```

#### 9、登录mysql

```bash
mysql -u root -p
```

#### 10、更改root密码，需要带数字，大写字母，小写字母，特殊符号

例：`你的新密码`为`1qaz2wsx@!XLD`

```bash
# SET PASSWORD = PASSWORD('你的新密码');
# 上面的方式不行就用下面这个
ALTER USER USER() IDENTIFIED BY '你的新密码';
alter user "root"@"localhost" identified by "1qaz@WSX";
# 设置密码永不过期
ALTER USER 'root'@'localhost' PASSWORD EXPIRE NEVER;
# 刷新MySQL的系统权限相关表
flush privileges;
```

根据个人需求，设置数据库用户在所有ip下以及在本地可访问，以下用root用户做演示

```bash
grant all privileges on *.* to root@"%" identified by "你的密码";
grant all privileges on *.* to root@"localhost" identified by "你的密码";
flush privileges;
```

注意：若远程工具连接不上，请用 `iptables -F` 命令来清除防火墙规则

## 5.6

#### 1、下载源

```bash
wget http://repo.mysql.com/mysql-community-release-el7-5.noarch.rpm
rpm -ivh mysql-community-release-el7-5.noarch.rpm
```

#### 2、安装

```bash
yum install mysql-server -y
```

#### 3、改用户密码

```bash
# mysql -u root
mysql> use mysql;
mysql> update user set password=PASSWORD("这里输入root用户密码") where User='root';
mysql> flush privileges;
mysql> GRANT ALL PRIVILEGES ON *.* TO 'your username'@'%' IDENTIFIED BY 'your password';
```

  

## MySql拓展

#### 新建用户

```bash
CREATE USER 'xld_test'@'%' IDENTIFIED BY '你的密码';
```

#### 用户授权

```bash
添加用户权限： GRANT ALL ON databasename.tablename TO 'xld_test'@'%';
撤销用户权限： REVOKE ALL ON databasename.tablename TO 'xld_test'@'%';
删除用户及权限 ：drop user 'xld_test'@'%';
```