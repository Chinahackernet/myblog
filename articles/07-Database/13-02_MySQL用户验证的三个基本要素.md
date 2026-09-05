# MySQL用户验证的三个基本要素

> 分类：Database / 第13章：MySQL用户权限管理
> 原文：https://www.cuiliangblog.cn/detail/section/31461186
> 来源：崔亮的博客

---

    1. MySQL 使用“用户名”、“客户端主机”和“密码”       三个基本要素来验证用户
    2. MySQL数据库使用“用户名”和“客户端主机”来区分不同的用户，例如：root@192.168.2.3和root@localhost为不同的用户
    3. MySQL的用户以行的形式存放在mysql数据库的user表中
    4. 查看MySQL用户
+ mysql>  select user,host,authentication_string from mysql.user; 
+ ![](assets/07-Database/de109e0f29f9c309762d.png)
    - mysql> select * from       mysql.user\G
+ *_priv  字段中的值 Y 表示已具有相应权限。root 帐户具有完全访问权限，该帐户的所有权限列的值均为 Y ,新建的普通用户liu均为N
+ ![](assets/07-Database/054f3d42a4bc554d7649.png)
    1. 客户端主机（host）的含义
+ MySQL早期应用于超市，每个pos机具有不同的IP，客户希望能够区分来自于不同pos机的刷卡记录，不希望收银员在超市以外的地方访问MySQL数据库，因此MySQL使用host列来限制客户机连接数据库以提高安全性，只有host列中指定的IP或主机名才能使用用户名和密码连接数据库。例如：用户知道root@localhost的密码，但是用户想从远程主机（IP:192.168.2.1）来连接数据库是不会成功的。
    1. 允许的客户端主机名（host）格式示例：
    - 主机名： localhost
    - 合格的主机名： mis.offcn.com
    - IP 地址： 192.168.2.1
    - IP 网络地址加掩码：       10.1.100.0/255.255.255.0
    - 模式或通配符： % (任意字符) 或 _ (任意1个字符)
    - %.offcn.com
    - 192.168.%
    - 192.168.2.1_
    - %
    2. 使用包含 %       通配符字符的host允许用户从整个域或子网中的任何主机连接数据库，存在潜在安全隐患
+  


