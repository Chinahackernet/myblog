# ansible基础

> 分类：Linux / 第17章：ansible
> 原文：https://www.cuiliangblog.cn/detail/section/31516112
> 来源：崔亮的博客

---

# 一、安装
1. 安装epel源

```bash
[root@localhost ~]# yum install -y epel-release
```

2. 安装ansible

```bash
[root@localhost ~]# yum install -y ansible
```

3. 查看版本

```bash
[root@localhost ~]# ansible --version
ansible 2.7.2
```

4. 从ansible上生成ssh私钥同步到两台node主机上,实现无密钥登录管理

```bash
[root@localhost ~]# ssh-keygen
[root@localhost ~]# ssh-copy-id 192.168.137.106
```

5. 或者拷贝公钥到被登录主机实现免密登录

```bash
[root@tiaoban ~]# cat /root/.ssh/id_rsa.pub 

[root@test ~]# mkdir ~/.ssh
[root@test ~]# chmod 700 ~/.ssh
[root@test ~]# touch ~/.ssh/authorized_keys
[root@test ~]# chmod 600 ~/.ssh/authorized_keys
然后将tiaoban的id_rsa.pub内容粘贴到被登录主机的authorized_keys文件中
```

6. 被管理主机需写入host inventory文件中

```bash
[root@localhost ~]# egrep -v '(^$|^#)' /etc/ansible/hosts 
```

# 二、ansible的主配置文件
## /etc/ansible/ansible.cfg
这个文件主要定义了roles_path路径,主机清单路径,连接清单中的主机方式等配置,这些大部的默认配置已经足够我们平时使用,如需要特别配置可以自行去修改;

## /etc/ansible/hosts
这个配置文件就是默认主机清单配置文件,可通过ansible.cfg重新定义的;

除了以上两个重要的配置文件还有三个重要的可执行文件分别是:

ansible 主执行程序,一般用于命令行下执行

ansible-playbook 执行playbook中的任务

ansible-doc 获取各模块的帮助信息

# 三、hosts文件写法
## 定义组
+ 定义websrvs组：

```yaml
[websrvs]
node101.yqc.com
node102.yqc.com
node103.yqc.com
```

+ 使用列表定义主机

```yaml
[websrvs]
node[101:103].yqc.com
```

+ 组嵌套

组的嵌套（即定义一个组包含其它几个组），使用children定义：

testsrvs组中包含websrvs和dbsrvs组。

```yaml
[websrvs]
node[101:103].yqc.com

[dbsrvs]
db[1:3].yqc.com

[testsrvs:children]
websrvs
dbsrvs
```

+ 定义主机别名

比如，在调用主机时使用web1来指定主机，而web1对应的实际连接地址是node101.yqc.com。

```yaml
[websrvs]
web1 ansible_host=node101.yqc.com
web2 ansible_host=node102.yqc.com
web3 ansible_host=node103.yqc.com
```

## 定义 inventory 参数
指定本地连接，无需ssh：

```yaml
[websrvs]
192.168.1.101 ansible_connection=local
```

## 指定特定ssh连接参数：
```yaml
[websrvs]
192.168.1.101 ansible_connection=ssh ansible_port=222 ansible_user=manage ansible_password=CHANGE_ME
```




