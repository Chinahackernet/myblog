# 修改用户密码passwd

> 分类：Linux / 第4章：用户和用户组管理
> 原文：https://www.cuiliangblog.cn/detail/section/31507973
> 来源：崔亮的博客

---

# 一、passwd命令格式
1. [root@localhost~]#passwd[选项]用户名
2. 选项：

| -S | 查询用户密码的密码状态。仅root用户<br/>可用。 |
| --- | --- |
| -l | 暂时锁定用户。仅root用户可用 |
| -u | 解锁用户。仅root用户可用 |
| echo "密码"   | --stdin | 可以通过管道符输出的数据作为用户<br/>的密码。 |


# 二、查看密码状态
+ [root@localhost~]#passwd -S lamp

lamp PS 2013一01一06 0 99999 7 -1

| 用户名密码设定时间 | 2013-01-06 |
| --- | --- |
| 密码修改间隔时间 | 0 |
| 密码有效期 | 99999 |
| 警告时间 | 7 |
| 密码不失效 | -1 |


# 三、锁定用户和解锁用户
1. [root@localhost~]#passwd-l lamp
2. [root@localhost~]#passwd-u lamp

# 四、使用字符串作为用户的密码
[root@localhost~]# echo "123" | passwd--stdin lamp


