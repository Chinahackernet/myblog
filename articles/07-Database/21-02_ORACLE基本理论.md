# ORACLE基本理论

> 分类：Database / 第21章：Oracle
> 原文：https://www.cuiliangblog.cn/detail/section/31467562
> 来源：崔亮的博客

---

## Oracle的基本介绍
**   ORACLE****，又称甲骨文公司，是全球最大的企业级数据库和软件公司。**

1970年，IBM研究院E.F.Codd博士提出关系模型的数据结构，关系型数据库应运而生，从此以表记录数据，格式就如excel一样，有行有列。

在今后的几十年中，关系模型的概念得到充分的发展，成为了数据库架构的主流模型。

![](assets/07-Database/c433b4b9f6e89b32ee59.jpeg)  ![](assets/07-Database/ec4efad678c103606dea.gif) ![](assets/07-Database/8e9ef5834bb412b1b989.jpeg) 

![](assets/07-Database/1cc9448491212fe78e09.jpeg)Bruce Scott  ![](assets/07-Database/e16f86f1219547622d55.jpeg)

1977年6月，Larry Ellison与Bob Miner和Ed Oates在硅谷共同创办了一家名为软件开发实验室（Software Development Laboratories，SDL）的计算机公司

Ellison和Miner预见到数据库软件的巨大潜力（跟着IBM走，没错），于是，SDL开始策划构建可商用的关系型数据库管理系统（RDBMS）。并命名为oracle（神迹），从此领跑关系型数据库市场，并后期收购了其他关系型数据库软件。

1989年进入中国市场，并翻译成”甲骨文”

## 1：体系结构
![](assets/07-Database/cdc20b197fc0fed7f0db.png)

** **

## 2：用户访问控制
Oracle数据库是多用户系统

 

超级用户：

sys，   管理员，权限最大，可以启动关闭数据库，可以控制任何用户的表

system，管理员，不能启动关闭数据库，可以控制任何用户的表

普通用户：

scott， 只能完全控制属于自己的表，除非别的用户授权

hr,          只能完全控制属于自己的表，除非别的用户授权

......

 

权限分为系统权限和对象权限：

系统权限：使用数据库提供的功能，如：建表，建视图，建用户

对象权限：select, update,insert,delete指定表对象，给表建索引，外键等

** **

![](assets/07-Database/45372ae4b1cfd11c2462.png)

角色起到简化权限管理的作用，MySQL从8.0开始支持角色

角色中可以包括：系统权限，对象权限和其他角色

 

内置角色：   connect (可以登录数据库), resource (可以建表等基本权限), dba (202种系统权限，和system一样)

自定义角色： 自建角色，可以把系统权限，对象权限，其他角色放进角色中，然后再授予指定用户

** **

![](assets/07-Database/cafff0d8ac1ded86189b.png)

 

查看数据库里有什么用户：

select * from dba_users;

<font style="color:navy;"> </font>

查看数据库中有什么角色：

<font style="color:navy;"> </font>

<font style="color:teal;">select</font><font style="color:navy;"> * </font><font style="color:teal;">from</font><font style="color:navy;"> dba_roles;</font>

<font style="color:navy;"> </font>

查看数据库中有什么系统权限：

<font style="color:teal;">select</font><font style="color:navy;"> * </font><font style="color:teal;">from</font><font style="color:navy;"> system_privilege_map;</font>

 

看当前用户有哪些系统权限

<font style="color:black;">select * from session_privs;</font>

创建一个新用户同时授予角色，添加密码

 

 

## 3：存储架构
![](assets/07-Database/1d2a7370c1d4e33b33fa.png)

默认6大表空间  

SYSTEM

SYSAUX

UNDOTBS1

USERS

TEMP  临时表空间

EXAMPLE

 

查看有哪些表空间

<font style="color:teal;"> </font>

查看表空间对应的磁盘文件

<font style="color:navy;"> </font>

<font style="color:navy;"> </font>

 

 

 

 

 


