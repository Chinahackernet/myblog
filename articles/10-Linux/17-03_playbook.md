# playbook

> 分类：Linux / 第17章：ansible
> 原文：https://www.cuiliangblog.cn/detail/section/31516057
> 来源：崔亮的博客

---

# playbook简介
Playbooks 与 adhoc 相比,是一种完全不同的运用 ansible 的方式,是非常强大的。

简单来说,playbooks是一种简单的配置管理系统与多机器部署系统的基础.与现有的其他系统有不同之处,且非常适合于复杂应用的部署。

我们完成一个任务，例如安装部署一个httpd服务，我们需要多个模块（一个模块也可以称之为task）提供功能来完成。而playbook就是组织多个task的容器，他的实质就是一个文件，有着特定的组织格式，它采用的语法格式是YAML（Yet Another Markup Language）。YAML语法能够简单的表示散列表，字典等数据结构。

# YAML基本语法
1. 列表：每一个列表成员前面都要有一个短横线和一个空格

fruits:

    - Apple

    - Orange

    - Strawberry

    - Mango

1. 列表和字典可以混合使用

-  martin:

    name: Martin D'vloper

    job: Developer

    skills:

      - python

      - perl

      - pascal

**注意冒号和****-****后面要有空格**

1. Playbooks 可用于声明配置,更强大的地方在于,在 playbooks 中可以编排有序的执行过程,甚至于做到在多组机器间,来回有序的执行特别指定的步骤.并且可以同步或异步的发起任务。
2. 我们使用 adhoc 时,主要是使用 /usr/bin/ansible 程序执行任务。而使用     playbooks 时,更多是将之放入源码控制之中,用之推送你的配置或是用于确认你的远程系统的配置是否符合配置规范。
3. 在 play 之中,一组机器被映射为定义好的角色。在 ansible 中,play 的内容,被称为 tasks,即任务。在基本层次的应用中,一个任务是一个对 ansible 模块的调用。
4. ‘plays’ 好似音符,playbook 好似由 ‘plays’ 构成的曲谱,通过 playbook,可以编排步骤进行多机器的部署,比如在 webservers 组的所有机器上运行一定的步骤, 然后在 database server 组运行一些步骤,最后回到 webservers 组,再运行一些步骤,诸如此类。

# playbook的核心元素
**hosts** : playbook配置文件作用的主机

**remote_user**：在远程主机上执行任务的用户

**tasks**: 任务列表

**variables: **变量

**templates**:包含模板语法的文本文件，使用jinja2语法。

**handlers** :由特定条件触发的任务

**roles** :用于层次性、结构化地组织playbook。

**roles **能够根据层次型结构自动装载变量文件、tasks以及handlers等

整个playbook是以task为中心，表明要执行的任务。hosts和remote_user表明在哪些远程主机以何种身份执行。

templates

它是一个模块功能，与copy不同的是他的文本文件采用了jinga2语法，template只能在palybook中使用。

# playbook运行方式
ansible-playbook --check 只检测可能会发生的改变,但不真执行操作

ansible-playbook --list-hosts 列出运行任务的主机

ansible-playbook --syntax-check playbook.yaml 语法检测

ansible-playbook -t TAGS_NAME playbook.yaml 只执行TAGS_NAME任务

ansible-playbook playbook.yaml 运行

# handlers在变更时执行操作
notify：在所有任务结束时触发

handlers：触发后执行的tasks

`---`

`- hosts: test`

`  remote_user: dwchensenwen`

`  become: yes`

`  become_method: sudo`

`  tasks:`

`    - name: make file task1`

`      file: path=/data/task1.txt state=touch`

`      notify: task1`

`    - name: make file task2`

`      file: path=/data/task2.txt state=touch`

`      notify: task2`

 

  handlers:

    - name: task1

      file: path=/data/1.txt state=touch

    - name: task2

      file: path=/data/2.txt state=touch

# 任务控制tags
- hosts: test70

  remote_user: root

  tasks:

  - name: task1

    file:

      path: /testdir/t1

      state: touch

    tags: t1

  - name: task2

    file: path=/testdir/t2

          state=touch

    tags: t2

  - name: task3

    file: path=/testdir/t3

          state=touch

    tags: t3

1. 指定执行tag

ansible-playbook --tags=t2 testtag.yml

1. 跳过执行tag

ansible-playbook --skip-tags='t2' testtag.yml

# 文件复用include与import区别
1. include动态导入：在运行时导入
+ --list-tags不会显示到输出
+ 不能使用notify触发来自include内处理程序名称（handlers）
2. import静态导入：在playbook解析时预先导入
+ 不能与循环一起使用
+ 将变量用户目标文件或角色名称时，不能使用主机清单中的变量

# playbook流程控制
1. 条件判断

tasks:

<font style="color:#323232;">- name: </font><font style="color:#1094A0;">"shut down CentOS 6 and Debian 7 systems"</font>

  command: ls -a

<font style="color:#323232;">  when: (ansible_facts['distribution'] == </font><font style="color:#1094A0;">"CentOS"</font><font style="color:#323232;"> and ansible_facts['distribution_major_version'] == </font><font style="color:#1094A0;">"6"</font><font style="color:#323232;">) or</font>

<font style="color:#323232;">  (ansible_facts['distribution'] == </font><font style="color:#1094A0;">"Debian"</font><font style="color:#323232;"> and ansible_facts['distribution_major_version'] == </font><font style="color:#1094A0;">"7"</font><font style="color:#323232;">)</font>

1. 循环

tasks:

  - name: postfix and httpd are running

    service:

<font style="color:#323232;">      name: </font><font style="color:#1094A0;">"{{ item }}"</font>

      state: started

    loop:

      - postfix

      - httpd

# jinjia2模板
1. 使用jinjia2模板

tasks:

- template: src=f.j2 dest=/tmp/f.j2

1. 条件判断

{% if  i == 'two' %}

two

{% endif  %}

1. 循环

{% set list=['one','two','three'] %}

{% for i in list %}

{{i}}

{% endfor %}

# playbook 示例
## 安装管理httpd服务-version1
[root@localhost ~]# yum install -y httpd

[root@localhost ~]# cat httpd01.yml 

![](assets/10-Linux/9ac51685abd7bbad6604.png)

+ 测试playbook

[root@localhost ~]# ansible-playbook --check httpd01.yml 

gather facts是默认执行，用来获取远程主机的信息，ip,hostname,网络信息等。

TASK [install httpd] 

+ 创建task时，name后面的字符串

changed: [192.168.137.106]

changed表明此安装包没有安装，会执行安装命令

PLAY RECAP 

这是总结

+ 运行playbook

[root@localhost ~]# ansible-playbook httpd01.yml 

+ 查看服务启动时的端口

[root@localhost ~]# ansible webservers -m shell -a "ss -ltn |grep 80"

## 安装部署httpd服务-version2
copy命令拷贝配置文件时，无法对配置文件进行修改，不够灵活。接下来我们使用template拷贝文件，并使用主机变量设置httpd端口号

+ 修改hosts配置文件，并定义端口号变量

[root@localhost ~]# egrep -v "^$|^#" /etc/ansible/hosts 

[webservers]

192.168.137.106 httpd_port=8088

+ 复制httpd配置文件，引用端口号变量

[root@localhost conf]# cp httpd.conf httpd.conf.j2

[root@localhost conf]# grep ^Listen httpd.conf.j2 

Listen {{ httpd_port }}

+ 编写yul文件，使用template模块

[root@localhost ~]# cat httpd02.yml 

![](assets/10-Linux/fe3c67bec9fbecca2489.png)

+ 检查playbook

[root@localhost ~]# ansible-playbook --check httpd02.yml

+ 运行playbook

[root@localhost ~]# ansible-playbook httpd02.yml 

+ 查看端口信息

[root@localhost ~]# ansible webservers -m shell -a "ss -ltn|grep :80"

由此可以看出，playbook中只将文件拷贝过去了，并没有重启服务，所以我们可以看到端口监听的依然是80而不是8080。此时我们需要在配置文件修改时触发一个任务，这就是handlers的用法，重新修改playbook文件。

1. notify字段类似一个监控器，可以监控某个任务，一旦该任务状态为change，则触发handlers，注意notify后的名字一定要和handlers的名字对应上，然后执行handlers里预先定义的任务
+ 重新修改YAML文件，使用notify-handlers

[root@localhost ~]# cat httpd02.yml 

![](assets/10-Linux/f4eec0a5c29838cdb7ad.png)

+ 执行之前，需要把106主机上的Listen端口改为808

因为刚执行的，虽然没重启，但是文件复制过去了。

[root@localhost ~]# ansible-playbook httpd03.yml 

+ 我们修改配置文件并重启服务，这是一个非常常见的操作。
1. 自定义变量，编写剧本

![](assets/10-Linux/13679328fa27adcaf8a1.png)

[root@compute ~]# ansible all -m shell -a 'ss -tunl | grep 8888'


