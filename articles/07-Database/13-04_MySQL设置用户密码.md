# MySQL设置用户密码

> 分类：Database / 第13章：MySQL用户权限管理
> 原文：https://www.cuiliangblog.cn/detail/section/31461177
> 来源：崔亮的博客

---

    1. 修改自己的密码
+ mysql>  set password=password('newpass');
+ password为口令函数，把口令加密存放在mysql数据库的user表的authentication_string列中
    1. 修改其他用户密码(要有相应权限)
+ mysql>  set password for 'username'@'host'= ('newpass');
    - 示例：
+ mysql>set  password for tom@192.168.2.1=password('newpass');
+ mysql>set password=password('root');


