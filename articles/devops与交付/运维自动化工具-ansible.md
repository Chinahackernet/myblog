### 一、ansible概述

  

Ansible是一款为类Unix系统开发的自由开源的配置和自动化工具。它用Python写成，类似于saltstack和Puppet，但是有一个不同和优点是我们不需要在节点中安装任何客户端。它使用SSH来和节点进行通信。Ansible基于 Python paramiko 开发，分布式，无需客户端，轻量级，配置语法使用 YMAL 及 Jinja2模板语言，更强的远程命令执行操作。

  

### 二、ansible的特点

  

**1、部署简单，只需在主控端部署Ansible环境，被控端无需做任何操作；**

  

**2、默认使用SSH协议对设备进行管理；**

  

**3、主从集中化管理；**

  

**4、配置简单、功能强大、扩展性强；**

  

**5、支持API及自定义模块，可通过Python轻松扩展；**

  

**6、通过Playbooks来定制强大的配置、状态管理**

  

**7、对云计算平台、大数据都有很好的支持**

  

### 三、ansible的工作机制

  

**Ansible** **在管理节点将** **Ansible** **模块通过** **SSH** **协议推送到被管理端执行，执行完之后自动删除，可以使用** **SVN** **等来管理自定义模块及编排。**

  

**由上面的图可以看到** **Ansible** **的组成由** **5** **个部分组成：**

  

**Ansible** **：**     **ansible核心**

  

**Modules** **：**    **包括** **Ansible** **自带的核心模块及自定义模块**

  

**Plugins** **：**      **完成模块功能的补充，包括连接插件、邮件插件等**

  

**Playbooks** **：**   **剧本；定义** **Ansible** **多任务配置文件，由Ansible**自动执行\*\*

  

**Inventory** **：**    **定义** **Ansible** **管理主机的清单**  **[ˈɪnvəntri]清单**

  

### 四、ansible安装与配置

  

#### 1、安装并配置ansible

  

##### 1.1 实验环境如下

  

##### 1.2 安装ansible

  

```shell
yum install -y epel-release
yum install -y ansible
```

  

##### 1.3 ansible语法参数

  

###### 1.3.1 ansible的命令语法

  

```shell
ansible [-i 主机文件] [-f 批次] [组名] [-m 模块名称] [-a 模块参数]
```

  

###### 1.3.2 ansible的详细参数

  

```shell
-v,--verbose		            # 详细模式，如果命令执行成功，输出详细的结果（-v,-vv,-vvv）
-i PATH,--inventory=PATH        # 指定host文件路径，默认是/etc/ansible/hosts
-f NUM,--forks=NUM              # NUM是整数，默认是5，指定fork开启同步进程的个数
-m NAME,--module-name=NAME      # 指定module名称，默认使用command模块
-a,MODULE_ARGS                  # 指定module模块的参数
-k,--ask-pass                   # 提示输入ssh密码，而不是使用基于ssh的密钥认证
-sudo						    # 指定使用sudo获取root权限
-K,--ask-sudo-pass			    # 提示输入sudo密码，和-sudo一起使用
-u USERNAME,--user=USERNAME     # 指定移动端的执行用户
-C,--check						# 测试此命令执行会产生什么效果，不会真的执行
```

  

###### 1.3.3 ansible-doc的详细参数

  

```shell
-l								# 列出所有模块列表
-s MODULE-NAME					# 查看指定模块参数
```

  

##### 1.4 ansible的主机清单

  

###### 1.4.1 基于端口，用户，密码定义的主机清单

  

ansible基于ssh连接，-i（--inventory）参数后面指定远程主机时，也可以写端口，用户，密码。

  

其格式参数如下：

  

```shell
ansible_ssh_port				# 指定ssh端口
ansible_ssh_user				# 指定ssh用户
ansible_ssh_pass     			# 指定ssh用户的认证密码（明文，不安全）
ansible_sudo_pass				# 指定sudo时候的认证密码（明文，不安全）
```

  

例子(配置文件默认在/etc/ansible/hosts里)：

  

```shell
[web-server]
172.16.2.101	ansible_ssh_port=22 ansible_ssh_user=root ansible_ssh_pass=P@ssW0rd
```

  

测试：

  

```shell
ansible -i /etc/ansible/hosts web-server -m ping
# 报下面错误
172.16.2.101 | FAILED! => {
    "msg": "Using a SSH password instead of a key is not possible because Host Key checking is enabled and sshpass does not support this.  Please add this host's fingerprint to your known_hosts file to manage this host."
}
# 解决办法1：手动连接一下客户端,ssh root@172.16.2.101
# 解决办法2：在/etc/ansible/ansible.cfg下，将host_key_checking=false启用
# 再运行上面命令测试
172.16.2.101 | SUCCESS => {
    "changed": false,
    "ping": "pong"
}
```

  

###### 1.4.2 基于ssh密钥来访问主机清单

  

一般来说，通过明文密码访问是不安全的，所以一般使用密钥的形式进行访问。

  

（1）、生产密钥

  

```shell
[root@ansible-server ansible]# ssh-keygen
Generating public/private rsa key pair.
Enter file in which to save the key (/root/.ssh/id_rsa):
Enter passphrase (empty for no passphrase):
Enter same passphrase again:
Your identification has been saved in /root/.ssh/id_rsa.
Your public key has been saved in /root/.ssh/id_rsa.pub.
The key fingerprint is:
SHA256:Hs3bs9rMZ5gW67WEdO7DpKJv1FzcZZkAj7G3iDm1XAI root@ansible-server
The key's randomart image is:
+---[RSA 2048]----+
|         E o... o|
|          . =  oo|
|           = = o.|
|         o= * + .|
|        S+o*.o.  |
|       . .o+++.  |
|        ... +O+  |
|          o+**=. |
|        .+o=*oo. |
+----[SHA256]-----+
```

  

（2）、分发密钥

  

```shell
# 配置ansible的hosts文件
[dev]
172.16.2.185
172.16.2.186
172.16.2.187
172.16.2.188
[dev:vars]
# 上面定义的几台服务器的用户，端口，密码都一样，所以就单独提出来写
ansible_ssh_user=root
ansible_ssh_port=22
ansible_ssh_pass=HJKJ123456hjkj
# 分发密码
ansible dev -m authorized_key -a "user=root key='{{lookup('file','/root/.ssh/id_rsa.pub')}}'"
# 删除hosts配置文件中的密码配置
# 测试
[root@ansible-server ansible]# ansible dev -m ping
172.16.2.186 | SUCCESS => {
    "changed": false,
    "ping": "pong"
}
172.16.2.185 | SUCCESS => {
    "changed": false,
    "ping": "pong"
}
172.16.2.187 | SUCCESS => {
    "changed": false,
    "ping": "pong"
}
172.16.2.188 | SUCCESS => {
    "changed": false,
    "ping": "pong"
}
```

  

##### 1.5 ansible模块

  

###### 1.5.1 command模块

  

command模块为ansible默认模块，不指定-m参数时，使用的就是command模块。command模块比较简单，常用的命令都可以使用，但其命令的执行不是通过shell脚本，所以，像 "<", ">", "|", and "&"操作都不可以。不支持管道，不能批量执行命令。

  

相关选项如下：

  

```shell
creates					# 一个文件名，当该文件存在，则该命令不执行
free_from				# 要执行的linux命令
chdir					# 在执行命令前，先切换到改目录
removes					# 一个文件名，当该文件不存在时，则该选项不执行
executable				# 切换shell来执行命令，	该命令的路径是一个绝对值
```

  

例子：

  

```shell
ansible dev -m command -a "uptime"
```

  

###### 1.5.2 shell模块

  

使用shell模块，在远程通过/bin/bash来执行，所以在终端使用Linux下各种命令都是可以的。

  

例子：

  

```shell
ansible dev -m shell -a "free -m | grep Swap"
```

  

但是我们在/.bashrc或/.bash\_profile中的环境变量shell由于没有加载，所以无法识别。如果需要使用自定义的环境变量，需要在执行的开始加载环境变量。

  

例子：

  

```shell
ansible dev -m shell -a "source ~/.bash_profile && free -m | grep Swap"
```

  

对shell模块使用可以分为两类：

  

（1）、执行语句少，可以直接写在一句话中，如上。

  

（2）、如果语句较多，可以写成一个脚本，通过copy模块将脚本拷贝到远端，再用shell模块去执行脚本

  

例子：

  

```shell
vim /tmp/joker_test.sh
#!/bin/bash
date +%F_%H:%M:%S

chmod +x /tmp/joker_test.sh
ansible dev -m copy -a "src=/tmp/joker_test.sh dest=/tmp/joker_test.sh owner=root group=root mode=0755"
ansible dev -m shell -a "/tmp/joker_test.sh"
```

  

###### 1.5.3 script模块

  

使用script模块，在本地写一个脚本，在远端执行，刚好解决shell远端执行脚本的问题。

  

例子：

  

```shell
vim /root/joker/test.sh
#!/bin/bash
date +F%

chmod +x /root/joker/test.sh
ansible dev -m script -a "/root/joker/test.sh"
```

  

###### 1.5.4 copy模块

  

copy模块的主要作用就是实现主控端向目标主机拷贝文件，类似scp的功能。

  

相关的选项如下：

  

```shell
backup			# 在覆盖之前，将源文件备份，备份文件包含事件信息，选项有（yes|no）
content			# 用于替代src，可以直接设定指定文件的值
dest			# 必选项，远程主机的绝对路径，如果源文件是目录，那么该路径也必须是一个目录
directory_mode	# 递归设置目录的权限，默认为系统默认的权限
force			# 如果是yes，强制覆盖；如果是no，只有当目标位置不存在时才复制
others			# 所有file模块里的选项都可以在这里使用
src				# 本地目录，可以是相对路径，也可以是绝对路径，'/'结尾赋值里的内容，不然包括目录在内
```

  

例子：

  

```shell
ansible dev -m copy -a "src=/root/joker/test.sh dest=/tmp/ owner=root group=root mode=755"
ansible dev -a "ls /tmp/test.sh"
```

  

###### 1.5.5 file模块

  

file模块是用来设置文件的属性。

  

相关选项如下：

  

```shell
force	# 会在两种情况下创建软连接：1、源文件不存在，但之后会建立。2、目标软连接已经存在，先取消再创建
group	# 定义文件/目录的属组
owner	# 定义文件/目录的属主
mode	# 定义文件/目录的q权限
path	# 必选项，定义文件/目录的路径
recurse	# 递归设置属性，只对目录有效
src		# 被软链接的源文件路径，只应用在state=link的情况下
dest	# 被软链接的目标文件路径，只应用在state=link的情况下
stat
	directory	# 如果目录不存在，就创建目录
	file		# 即使文件不存在，也不会被创建
	link		# 创建软链接
	hard		# 创建硬链接
	touch		# 如果文件不存在，就创建文件，如果文件存在，更新修改时间
	absent		# 删除目录、文件或取消l链接文件
```

  

例子：

  

```shell
# 远程创建符号链接
ansible dev -m file -a "src=/etc/resolv.conf dest=/tmp/resolv.conf state=link"
# 查看
ansible dev -a "ls -l /tmp/resolv.conf"
172.16.2.187 | SUCCESS | rc=0 >>
lrwxrwxrwx 1 root root 16 Jan 29 16:16 /tmp/resolv.conf -> /etc/resolv.conf
# 删除符号链接
ansible dev -m file -a "path=/tmp/resolv.conf state=absent"
# 查看
ansible dev -a "ls -l /tmp/resolv.conf"
172.16.2.187 | FAILED | rc=2 >>
ls: cannot access /tmp/resolv.conf: No such file or directorynon-zero return code
```

  

###### 1.5.6 stat模块

  

stat模块的作用是获取远程文件的信息，包括atime,ctime等等。

  

例子：

  

```shell
ansible dev -m stat -a "path=/etc/resolv.conf"
```

  

###### 1.5.7 get\_url模块

  

get\_url模块实现从远程主机下载指定的url到本地，支持sha256sum文件校验。

  

force=yes 强制覆盖；force=no，目标文件不存在时才下载。

  

例子：

  

```shell
# 下载
ansible dev -m get_url -a "url=https://dl.fedoraproject.org/pub/epel/epel-release-latest-7.noarch.rpm dest=/tmp/ mode=0440"
# 查看
ansible dev -a "ls -l /tmp/"
```

  

###### 1.5.8 yum模块

  

yum模块可提供status状态，status状态有：latest，present，installed（这三个代表安装）,removed，absent（这两个代表卸载）

  

其选项如下：

  

```shell
name	# 用于指定软件包的名字，比如nginx
stat	# 用于指定软件包的状态status，其状态如上说明。
```

  

例子：

  

```shell
ansible dev -m yum -a "name=nginx stat=latest"
```

  

###### 1.5.9 cron模块

  

cron模块应用于配置远程主机crontab。

  

其选项参数如下：

  

```shell
name		# 为crontab设置一个名字环境变量
minute		# 分
hour		# 时
day			# 天
weekday		# 周
month		# 月
job			# 执行的命令
```

  

例子：

  

```shell
ansible dev -m cron -a "name='list dir' minute='*/30 job='ls /tmp'"
```

  

###### 1.5.10 service模块

  

service模块应用远程主机系统服务的管理。想要使用这个模块启动服务，被启动的服务可以使用service启动或关闭服务。

  

常用的选项参数如下：

  

```shell
name		# 指定需要操作的服务名称，比如nginx,httpd
stat		# 指定服务的状态，started,restarted,stoped,reloaded
enable		# 如果设置为yes表示开机启动，如果是no表示开机不启动
```

  

例子：

  

```shell
ansible dev -a "name=httpd stat=restarted enable=yes"
```

  

###### 1.5.11 sysctl模块

  

sysctl模块应用在远程主机sysctl配置。

  

常用选项参数如下：

  

```shell
name		# 需要设置的内核参数名
value		# 参数值
reload		# 如果是yes，相当于执行了sysctl -p命令，是no表示不重新加载
```

  

例子：

  

```shell
# 为系统添加路由转发功能
ansible dev -m sysctl -a "name=net.ipv4.ip_forward value=1 reload=yes"
```

  

###### 1.5.12 user模块

  

user模块应用于远程主机用户管理。

  

例子：

  

```shell
# 添加用户
ansible dev -m user -a "name=joker state=present"
# 删除用户
ansible dev -m user -a "name=joker state=absent remove=yes"
```

  

###### 1.5.13 mount模块

  

mount模块应用于被控端分区挂载。

  

例子：

  

```shell
ansible dev -m mount -a "name=/mnt/data src=/dev/sd1 fstype=nfs opts=ro state=present"
```

  

##### 1.6 playbook

  

###### 1.6.1 用法示例

  

```yaml
---
- hosts: webserver
  remote_user: root
  
  vars:
  	app_package: httpd
  	service_name: httpd
  	
  tasks:
  - name: Install {{ app_package }} package
  	yum: name={{ app_package }}
  	
  - name: copy conf
  	copy: src=files/httpd.conf dest=/etc/httpd/conf/ backup=yes
  	notify: restart {{ service_name }}
  	
  - name: start {{ service_name }} services
  	service: name={{ service_name }} state=started
  	
  handers:
  - name: restart {{ service_name }}
  	service: name={{ service_name }} state=restarted
```

  

说明：

  

```
hosts: 主机列表
remote_user: 远程执行用户
vars: 变量定义
tasks: 具体执行任务
name: 任务名字
notify: 如果该task改变，则会触发notify执行handers任务
handers: notify通知执行的任务
```

  

###### 1.6.2 playbook中的变量

  

1、变量的定义方式

  

（1）、通过命令指定

  

```yaml
ansible-playbook -e "app_package=httpd" app.yml
```

  

（2）、在playbook中定义，通过vars参数，见上面的示例

  

（3）、在/etc/ansible/hosts中定义

  

```
[webserver]
10.1.11.11 httpd_port=80
10.1.11.12
[webserver:vars]
httpd_post=81
```

  

（4）、内置变量，可以通过setup模块查看

  

```
ansible 10.1.11.12 -m setup
```

  

2、变量的优先级

  

直接通过命令传入的变量的优先级最高，其次是在playbook中定义的变量，再次是在/etc/ansible/hosts中的主机清单中定义的变量（主机清单的局部变量的优先级大于它全局变量的优先级），最后是内置变量。

  

3、变量的统一管理

  

在很多时候我们希望将变量放在一个文件里统一管理，这时候可以单独定义一个yml文件存放变量，然后在主playbook中导入即可。比如

  

```
variable.yml
---
- app_package: httpd
- app_port: 80

app.yml
---
- hosts: webserver
  remote_user: root
  include_vars:
  	file: variable.yml
  	name: variable
```

  

###### 1.6.3 template

  

模板的功能就是可以创建一个模板文件，模板文件必须以.j2结尾，而且模板里面支持变量，比如以nginx.conf为例：

  

```plain
// 根据机器的CPU不同，配置不同的work_process
vim templates/nginx.conf.j2
....
work_process {{ ansible_processor_vcpus * 2 }}
....

vim nginx.yml
---
- hosts: web
  remote_user: root
  
  tasks:
    - name: copy conf
      template: src=nginx.conf.j2 dest=/etc/nginx/nginx.conf
```

  

template里还支持for,if等语法，比如：

  

```
vim test.yml
---
- hosts: web
  remote_user: root
  vars:
  	ports:
  	  - web1:
  	    port: 81
  	    server_name: web1.joker.com
  	  - web2:
  	    port: 82
  	    server_name: web2.joker.com
  	  - web3:
  	    port: 83
  tasks:
  	- name: copy file
  	  template: src=test.j2 dest=/data/test.conf
  	  
vim tempates/test.j2
{% for p in ports%}
	server {
		listen {{ p.port }};
		{% if p.server_name if defined %}
			server_name p.server_name;
		{% endif %}
	}
{% endfor %}
```

  

###### 1.6.4 with\_items

  

很多时候需要同事进行多次操作，这时候with\_items就很有帮助，例如：

  

```
// 创建多个用户组，并将用户加入组
---
- hosts: web
  remote_user: root
  
  tasks:
  	- name: create some group
  	  group: name={{ item }}
  	  with_items:
  	    - group1
  	    - group2
  	    - group3
    - name: create some user
      user: name={{ item.user }} group={{ item.group }}
      with_items:
        - {user: "user1", group: "group1"}
        - {user: "user2", group: "group2"}
        - {user: "user3", group: "group3"}
```

  

##### 1.7 roles

  

###### 1.7.1 roles目录规范

  

```
ansible_playbooks/
└── roles  必须叫roles
    ├── dbsrvs -------------role1名称
    │   ├── defaults  ---------必须存在的目录，存放默认的变量，模板文件中的变量就是引用自这里。defaults中的变量优先级最低，通常我们可以临时指定变量来进行覆盖
    │   │   └── main.yml 
    │   ├── files -------------ansible中unarchive、copy等模块会自动来这里找文件，从而我们不必写绝对路径，只需写文件名
    │   │   ├── mysql.tar.gz
    │   │   └── nginx.tar.gz
    │   ├── handlers -----------存放tasks中的notify指定的内容
    │   │   └── main.yml
    │   ├── meta
    │   ├── tasks --------------存放playbook的目录，其中main.yml是主入口文件，在main.yml中导入其他yml文件，要采用import_tasks关键字，include要弃用了
    │   │   ├── install.yml
    │   │   └── main.yml -------主入口文件
    │   ├── templates 存放模板文件。template模块会将模板文件中的变量替换为实际值，然后覆盖到客户机指定路径上
    │   │   └── nginx.conf.j2
    │   └── vars
    └── websrvs -------------role2名称
        ├── defaults
        │   └── main.yml
        ├── files
        │   ├── mysql.tar.gz
        │   └── nginx.tar.gz
        ├── handlers
        │   └── main.yml
        ├── meta
        ├── tasks
        │   ├── install.yml
        │   └── main.yml
        ├── templates
        │   └── nginx.conf.j2
        └── vars
```

  

###### 1.7.2 简要说明

  

```
roles的好处就是将咱们以前一个Playbook干的很多活细分化，这样方便管理，特别是对于复杂的任务。
```

  

###### 1.7.3 基本用法示例

  

```
// 安装nginx
// 目录结构
ansible_playbook/
├── nginx_role.yml
└── roles
    └── app
        ├── defaults		--- 存放变量
        │   └── main.yml
        ├── files			--- 存放需要拷贝得文件
        │   └── python3.tar.gz
        ├── handlers		--- 存放handler触发文件
        │   └── main.yml
        ├── tasks			--- 存放具体得剧本
        │   ├── copyfile.yml		--- 拷贝文件
        │   ├── groupAdd.yml		--- 添加用户
        │   ├── main.yml		    --- 主配置文件
        │   ├── start.yml		    --- 启动服务
        │   ├── template.yml		--- 拷贝模板
        │   ├── userAdd.yml			--- 添加用户
        │   └── yum.yml			    --- 安装软件
        └── templates		--- 存放模板文件
            └── nginx.conf.j2

//具体配置
/*nginx_role.yml*/
- hosts: web
  remote_user: root

  roles:
    - app

/*defultes/main.yml*/
username: app
usergroup: app
uid: 520
gid: 520

/*handlers/main.yml*/
- name: restart nginx
  service: name=nginx state=reload

/*tasks/copyfile.yml*/
- name: copy file
  copy: src=python3.tar.gz dest=/data/ owner=app group=app
  
/*tasks/groupAdd.yml*/
- name: create group
  group: name={{ usergroup }} gid={{ gid }} system=yes
  
/*tasks/userAdd.yml*/
- name: create user
  user: name={{ username }} uid={{ uid }} group={{ usergroup }} system=yes shell=/sbin/nologin
  
/*tasks/yum.yml*/
- name: install package
  yum: name=nginx
  
/*tasks/template.yml*/
- name: copy template
  template: src=nginx.conf.j2 dest=/etc/nginx/nginx.conf
  notify: restart nginx

/*tasks/start.yml*/
- name: start nginx
  service: name=nginx state=started
  
/*tasks/main.yml*/
- include: groupAdd.yml
- include: userAdd.yml
- include: yum.yml
- include: template.yml
- include: copyfile.yml
- include: start.yml
```

  

###### 1.7.4 调用多个roles

  

```
//调用多个roles，只需要在主配置文件里指定就可以了，比如
/*nginx_role.yml*/
- hosts: web
  remote_user: root

  roles:
    - app
    - mysql
    - php
```

  

###### 1.7.5 role之间相互调用

  

```
//比如如下结构
.
├── nginx_role.yml
└── roles
    ├── app
    │   ├── defaults
    │   │   └── main.yml
    │   ├── files
    │   │   └── python3.tar.gz
    │   ├── handlers
    │   │   └── main.yml
    │   ├── tasks
    │   │   ├── copyfile.yml
    │   │   ├── groupAdd.yml
    │   │   ├── main.yml
    │   │   ├── start.yml
    │   │   ├── template.yml
    │   │   ├── userAdd.yml
    │   │   └── yum.yml
    │   └── templates
    │       └── nginx.conf.j2
    └── mysql
        └── tasks
            └── test.yml
            
// app要调用MySQL中的test.yml，只需要在app的tasks中的main.yml中引用就可以了，如下：
vim main.yml
- include: groupAdd.yml
- include: userAdd.yml
- include: yum.yml
- include: template.yml
- include: copyfile.yml
- include: start.yml
- include: roles/mysql/tasks/test.yml
```