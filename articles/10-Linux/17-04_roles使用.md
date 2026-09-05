# roles使用

> 分类：Linux / 第17章：ansible
> 原文：https://www.cuiliangblog.cn/detail/section/31516024
> 来源：崔亮的博客

---

# 一. roles作用
    1. 主要作用是复用playbook，例如我们无论安装什么软件都会安装时间同步服务，那么每个playbook都要编写ntp task。我们可以将ntp task写好，等到用的时候再调用就行了。ansible中将其组织成role，他有着固定的组织格式。以便playbook调用

# 二、relos介绍
+ 以特定的层级目录结构进行组织的tasks、variables、handlers、templates、files等；相当于函数的调用把各个功能切割成片段来执行
    1. 层级目录结构
+ role_name/：我们定义的role的名字
+ file/：用于存放copy或script等模块调用的函数
+ tasks/:用于定义各种任务列表，此目录一定要有main.yml
+ handlers/：用于定义各种handlers，此目录一定要有main.yml;
+ vars/:用于定义变量，此目录一定要有main.yml;
+ templates/：存储由template模块调用的模板文本；
+ default/：此目录中至少应该有一个名为main.yml的文件，用于设定默认变量；
    1. 在playbook中调用role
+ role存放的路径在配置文件/etc/ansible/ansible.cfg中定义
+ roles_path  = /etc/ansible/roles
    - 第一种：
+ -  hosts: HOSTS
+   remote_user: root
+   roles:
+     - ROLE_NAME1
+     - ROLE_NAME2
    - 第二种：除了字典第一个元素指明调用的role，后面是传递给role的变量
+ -  hosts: HOSTS
+   remote_user: root
+   roles:
+   - { role: ROLE_NAME1, VARIABLE1: VALUE1,  ...}

# 三、ansiable变量定义与使用
    1. 命令行-e定义
    2. 在主机清单中定义
    3. 在playbook中定义
    4. 在roles中定义
    5. register获取执行结果变量
    6. facts获取系统信息变量

# 四、ansiable变量优先级
    1. ansible-playbook命令中的变量，ansible-playbook       -e var=value
    2. task变量
    3. block变量
    4. role中定义的变量和include变量
    5. set_fact
    6. registered变量
    7. vars_files
    8. var_prompt
    9. play变量
    10. host facts
    11. playbook中设置的host_vars
    12. playbook中设置的group_vars
    13. inventory中设置的host_vars
    14. inventory中设置的group_vars
    15. inventory变量
    16. role中defaults/main.yml中定义的变量

# 五、示例
    1. 以远程安装httpd为例，使用role示例：
    - 目录结构：
+ [root@bogon  ~]# tree /etc/ansible/roles/
+ ![](assets/10-Linux/4928d4dda5eaa66f27a9.png)
+ httpd是playbook调用时role的名称
+ http.conf.c6.j2是httpd配置文件
    -  变量
+ ![](assets/10-Linux/663e6b6d562f574e5b9d.png)
+  
+ ![](assets/10-Linux/c6a5e41514229cfb91fe.png)
    - tasks文件
+ ![](assets/10-Linux/4c4df49b8def46bc3e61.png)
+  
+ ![](assets/10-Linux/0c95f2381cd45442f4d9.png)
+ 此处不用写task，执行时是在tasks目录下role组件能够自动识别
    - handlers文件
+ ![](assets/10-Linux/bd151aaf98efa9258e0a.png)
+  
+ ![](assets/10-Linux/1e9c1b9bc174235ad70f.png)
    - 模板文件
+ ![](assets/10-Linux/7c30f6206ccfb76ab858.png)
+ 使用httpd_port变量设置httpd_port端口号，此变量来自vars目录下申明的变量
    - playbook文件
+ ![](assets/10-Linux/1b3493906783f72534cf.png)
+  
+ ![](assets/10-Linux/0420bc1f7cfb1620fb93.png)
    - 测试playbook文件
+ [root@bogon  ~]# ansible-playbook --check httpd_role.yml   
+ [root@bogon  ~]# ansible-playbook httpd_role.yml  
+ [root@bogon ~]# ansible all -m shell -a "ss -tnlp|grep :80"
+ 可以看到httpd监听的端口为8088  
    2. roles中定义变量的方法
    - roles文件中定义变量
+ - hosts:  haiwan_init
+   vars:
+     project: haiwan
+   roles:
+   - role: system_init
+   - role: nginx
+     vars:
+ <font style="color:#323232;">      nginx_version: </font><font style="color:#1094A0;">1.18.0</font>
+       nginx_install_path: /usr/local/webserver
+       nginx_log_path: /var/log/httpd
+   - role: jdk
+     vars:
+ <font style="color:#323232;">      jdk_version: </font><font style="color:#1094A0;">8u71</font>
+       jdk_install_path: /usr/local
+       javacode_path: /var/webapps/javacode
+   - role: log_upload
    - 创建group_vars文件夹，下面按主机组创建文件，存放变量。文件夹与playbook同级
+ [https://github.com/ansible/ansible-examples/tree/master/lamp_simple](https://github.com/ansible/ansible-examples/tree/master/lamp_simple)


