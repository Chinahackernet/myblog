# RHEL9允许root远程登录

> 分类：Linux / 第18章：RHEL8/9
> 原文：https://www.cuiliangblog.cn/detail/section/131706710
> 来源：崔亮的博客

---

<font style="color:rgb(38, 38, 38);">从centos9开始，默认禁止远程登录root用户，需要使用以下命令使他允许登录：</font>

```bash
vi /etc/ssh/sshd_config
```

<font style="color:rgb(38, 38, 38);">在文件中找到(可以使用搜索功能： 输入/Permit，找到后再按i进行编辑)</font>

```bash
#PermitRootLogin prohibit-password
更改为（# 要去掉）：按esc，输入:wq 保存。
PermitRootLogin yes
```

<font style="color:rgb(38, 38, 38);">重启ssh</font>

```bash
systemctl restart sshd
```




