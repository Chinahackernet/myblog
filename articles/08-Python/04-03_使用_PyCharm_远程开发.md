# 使用 PyCharm 远程开发

> 分类：Python / 第4章：pycharm
> 原文：https://www.cuiliangblog.cn/detail/section/31701066
> 来源：崔亮的博客

---

> 在 linux 主机上使用 vim 开发 Ansible 模块或插件，对于新手来说不是很方便。大多数人的工作环境都是基于 Windows 环境的，但是 Ansible 不能运行在 Windows 环境下，这个时候我们想使用 Windows 环境下的 PyCharm 工具时，只能通过远程连接的方式进行开发 playbook 或模块插件。
>



接下来，跟我一起来配置 PyCharm 工具，使其能够远程开发 Ansible 相关程序。

# 远程主机
OS: `cetnos 7.7 x64`

Python: `2.7.5`

Ansible: `2.9.6`

# 工作空间
新建一个工作目录，本次使用`D:\dev\ansible`目录

# 设置 Python Interpreter
使用 PyCharm 打开创建好的工作目录，选中项目，打开选项`Files`\=>`Settings`\=>`Project: ansible`\=>`Project Interpreter`

![](assets/08-Python/082ee2caac9681237c2b.png)

在`Project Interpreter` 右侧选择`Add`添加 

![](assets/08-Python/3c8801a50fb94190ed83.png)

选择 `SSH Interpreter` 进行设置远程主机的连接信息 

![](assets/08-Python/0910a388df848b59729c.png)

输入连接信息后，还需填写认证信息。 

![](assets/08-Python/c060297249f6173c1814.png)

认证通过后，就要设置远程主机的 `Python` 可执行路径和需要同步的目录 

> 本次使用的时工作目录和远程的`/etc/ansible`目录进行同步
>

![](assets/08-Python/3391fa9e96494b45b150.png)

设置完成后，点击 **OK** 确认设置 

# 同步目录
我们工作空间此刻还是空的，需要与远程目录进行同步，将远程目录的数据下载到工作空间

选中项目，打开选项`Tools`\=>`Deployment`\=>`Download from root@192.168.77.130:22` ![](assets/08-Python/dffbbeb182796c7a97e6.png)

![](assets/08-Python/ba25f69f5fd952c35e0a.png)

等待一会，就同步完成了 

# 开发文件
![](assets/08-Python/5d1e0a1b2122d755c6cd.png)

这个时候，我们在`library`目录中创建一个`remote_copy.py` 文件 

可以发现，我们在 Windows 上也能 import ansible 相关信息了。

![](assets/08-Python/0dc46f672c9571c16ed8.png)  
pycharm 会在后台起一个进程来监控工作空间的变动，如有变动将会同步到远程主机目录

点击左下角的`Python Console` 可以进入远程主机的 python 解释器中 ![](assets/08-Python/0c32f082f30de626b85e.png)

# 执行命令
在我们需要运行 ansible 模块或插件时，我们可以远程连接到主机上进行操作 ansible 命令运行 playbook

![](assets/08-Python/95a5a6223c171d84727a.png)

打开选项`Tools`\=>`Start SSH session...`, 选择 192.168.77.130 主机 

连接成功后，就可以在`Terminal`界面操作 ansible 命令了

![](assets/08-Python/2fe76af272b503b7607f.png)


