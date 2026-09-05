# ansible命令

> 分类：Linux / 第17章：ansible
> 原文：https://www.cuiliangblog.cn/detail/section/31516085
> 来源：崔亮的博客

---

## 一、ad-hoc命令部分
ansible  <host-pattern> [-m module_name] [options]

指令 匹配规则的主机清单 -m 模块名 选项 -a '参数'

```yaml
ansible all --list
ansible all -m command  -a 'ls'
ansible all -m ping 
```

## 二、常用模块
### copy模块
从本地copy文件分发到目录主机路径

参数说明:

src=  源文件路径

dest=  目标路径

注意src=  路径后面带/ 表示带里面的所有内容复制到目标目录下，不带/是目录递归复制过去

content=  自行填充的文件内容

owner  属主

group  属组

mode权限

```yaml
ansible all -m copy -a "src=/etc/hosts dest=/etc/hosts  mode=644" 
```

### fetch模块
从远程主机拉取文件到本地

需指定src和dest,dest只要指定一个接收目录,默认会在后面加上远程主机及src的路径

```yaml
ansible all -m fetch -a "src=/tmp/passwd dest=/tmp"
```

### command模块
在远程主机上执行命令,属于裸执行;<font style="color:red;">不进行shell解析;</font>

```yaml
ansible all -m command -a "ip  a" 
```

### shell模块
由于commnad只能执行裸命令(即系统环境中有支持的命令),至于管道之类的功能不支持,

shell模块可以做到

```yaml
[root@localhost  ~]# ansible all -m shell -a "ip a|grep ens"
```

### file模块
设置文件属性(创建文件)

常用参数:

path目标路径

state  directory为目录,link为软件链接

group  目录属组

owner  属主等,其他参数通过ansible-doc -s file 获取

```yaml
创建目录
[root@localhost  ~]# ansible all -m file -a "path=/tmp/xld state=directory"
创建软件链接
[root@localhost  ~]# ansible all -m file -a  "src=/etc/fstab  dest=/tmp/fstab.link state=link"
```

### yum模块
故名思义就是yum安装软件包的模块;

常用参数说明:

enablerepo,disablerepo表示启用与禁用某repo库

name  安装包名

state  (present' orinstalled', latest')表示安装, (absent' or `removed') 表示删除

示例:通过安装epel扩展源并安装nginx

```yaml
[root@localhost  ~]# ansible all -m yum -a "name=epel-release  state=installed"
[root@localhost  ~]# ansible all -m yum -a "name=nginx state=installed"
[root@localhost  ~]# ansible all  -a "systemctl start nginx"
[root@localhost  ~]# ansible all  -a "systemctl status nginx"
```

### service模块
服务管理模块

常用参数:

name:服务名

state:服务状态

enabled:  是否开机启动 true|false

```bash
[root@localhost  ~]# ansible all -m service  -a "name=nginx  state=stopped enabled=true"
[root@localhost  ~]# ansible all -m service  -a "name=nginx  state=started enabled=true"
[root@localhost  ~]# ansible all -m service  -a "name=nginx  state=restarted enabled=true"
```

### script模块
把本地的脚本传到远端执行;前提是到远端可以执行

```yaml
[root@localhost  ~]# ansible all -m script -a "/root/test.sh"
```

### user模块
可以快速在被管控主机上批量添加用户

state=present   ： 创建用户

state=absent  ： 删除用户

remove=true  ： 删除用户家目录

home=     ：来指定用户家目录路径；

system=true   ：创建系统用户

uid=  ： 来指定用户uid

shell=       ：指定用户的默认shell

```yaml
ansible  all -m user -a 'name=ly state=present' 
```

### cron模块
为被管控主机在crontab  -e列表中添加计划任务

name=         ：表示工作名称

job=             ：表示具体运行什么命令

hour=*          ： 每小时

day=*      :    每天

month=3    ： 3月

weekday=3   ： 周三

```yaml
# 为所有被管控主机添加一条计划任务，每5分钟向172.16.0.1同步一次系统时间
ansible  all -m cron -a "minute='*/5' job='/usr/sbin/ntpdate 10.10.64.180  &> /dev/null' name='sync time' state='present'"
```




