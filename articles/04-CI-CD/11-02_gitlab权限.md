# gitlab权限

> 分类：CI/CD / 第11章：Gitlab基本配置与使用
> 原文：https://www.cuiliangblog.cn/detail/section/131513569
> 来源：崔亮的博客

---

# 组、用户、项目关系
## 创建组
使用管理员 root 创建组，一个组里面可以有多个项目分支，可以将开发添加到组里面进行设置权限，不同的组就是不同的开发项目或者服务模块，不同的组添加不同的开发即可实现对开发设置权限的管理 ，组类型有private、internal和public

+ <font style="color:rgb(51, 51, 51);">Private：只有组成员才能看到</font>
+ <font style="color:rgb(51, 51, 51);">Internal：只要登录的用户就能看到</font>
+ <font style="color:rgb(51, 51, 51);">Public：所有人都能看到</font>

## 在组中创建项目
以刚才创建的新用户身份登录到Gitlab，然后在用户组中创建新的项目，<font style="color:rgb(77, 77, 77);">GitLab的可见性权限有三种：Private、Internal、Public</font>

+ public：公共项目，无需任何身份验证即可克隆公共项目。任何登录的用户都将对该项目具有来宾权限。<font style="color:rgb(77, 77, 77);">公共项目登录和未登录GitLab的人都可以看到该项目并可以进行克隆下载，相当于公开。</font>
+ internal：内部项目，任何登录的用户都可以克隆内部项目。<font style="color:rgb(77, 77, 77);">任何登录的用户都将对该项目具有来宾权限。</font>内部项目只有登录GitLab的用户才会看到该项目和进行克隆，未登录的用户是看不到该项目的
+ private：私有项目，只有创建者和项目组员才可以访问私有项目在创建之后，刚开始是只有创建者可以访问看到，其他用户是访问不了（就是看不到这个项目）。只有创建者或者有权限的组员添加了用户为该项目的组员，用户才会看到该项目并访问。

## 创建用户
创建用户的时候，可以选择Regular或Admin类型，创建完用户之后需要修改密码。

+ Regular：普通用户，只能访问属于他的组和项目
+ Admin：可以访问所有组和项目 

## 将用户添加到组中
选择某个用户组，进行Members管理组成员。  
Gitlab用户在组里面有5种不同权限： 

+ Guest：可以创建issue、发表评论，不能读写版本库
+ Reporter：可以克隆代码，不能提交，赋予QA、PM这个权限
+ Developer：可以克隆代码、开发、提交、push，赋予普通开发人员这个权限
+ Maintainer：可以创建项目、添加tag、保护分支、添加项目成员、编辑项目，赋予核心开发人员这个权限
+ Owner：可以设置项目访问权限 - Visibility Level、删除项目、迁移项目、管理组成员，赋予管理人员这个权限

# 操作实践
![](assets/04-CI-CD/6be15a1f5edc7b21edb8.png)

## 开发组1与项目1创建
> 创建开发组1，组权限为私有。并创建项目1，项目权限为私有。然后创建普通用户张三并赋予Developer权限
>

管理员用户登录，创建开发组1，组名称为development_team1，组权限为私有

![](assets/04-CI-CD/9b2c614786a6a30a3164.png)

创建一个项目，并指定开发组1，项目类型为私有

![](assets/04-CI-CD/81efe057be8befa90a51.png)

创建一个普通用户张三

![](assets/04-CI-CD/ff909314a503903cc1a6.png)

将张三添加到群组development_team1中，张三角色为Developer

![](assets/04-CI-CD/09e88af0586885e33102.png)

## 开发组2与项目2创建
> 创建开发组2，组权限为内部。并创建项目2，项目权限为内部。然后创建普通用户李四并赋予owner权限
>

管理员用户登录，创建开发组2，组名称为development_team2，组权限为内部

![](assets/04-CI-CD/790a1f7d2c7280e963d7.png)

创建项目project2，项目类型为内部，所属于开发组2。

![](assets/04-CI-CD/62eb4040677a9c7e90da.png)

创建用户李四，角色为普通用户

![](assets/04-CI-CD/665d2cad68cfa9a36281.png)

将李四添加到组中，角色为owner。

![](assets/04-CI-CD/bbe81379262d9b5e03fd.png)

## 开发组3与项目3创建
> 创建开发组3，组权限为公开。并创建项目3，项目权限为公开。然后创建管理员用户王五并赋予reporter权限
>

管理员用户登录，创建开发组3，组名称为development_team3，组权限为公共

![](assets/04-CI-CD/d77fdee70d98a6cc9fa0.png)

创建项目project3，项目权限为公共

![](assets/04-CI-CD/9ba8cf9570e14b563910.png)

创建管理员用户王五

![](assets/04-CI-CD/0d84dbf80fed05c55165.png)

将王五添加到组中，角色为reporter

![](assets/04-CI-CD/5ceb74357afab817087c.png)

# 权限验证
## 张三登录验证
浏览项目权限发现， 可以查看所属项目、公开项目、内部项目

![](assets/04-CI-CD/48e4e6203dc84dbf7882.png)

## 李四登录验证
浏览项目权限发现， 可以查看所属项目、公开项目

![](assets/04-CI-CD/04996b2f6421a26c23ca.png)

## 王五登录验证
浏览项目权限发现， 可以查看全部项目

![](assets/04-CI-CD/438eecee054e240677d3.png)

## 未登录用户
浏览项目权限发现， 可以查看公开项目

![](assets/04-CI-CD/4dd8e4864c8d99de729a.png)


