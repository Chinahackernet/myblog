# tomcat服务配置

> 分类：Linux / 第13章：服务部署
> 原文：https://www.cuiliangblog.cn/detail/section/31467992
> 来源：崔亮的博客

---



<font style="color:#000000;"></font>

# 一、实验目的
1.  掌握tomcat服务的搭建

# 二、实验内容
1.  搭建一台缓存tomcat服务器。

# 三、实验环境
1.  tomcat服务器centos7对应主机ip为10.10.64.178

2.  客户机win7对应主机ip为10.10.64.227

# 四、环境搭建
1.   安装jdk

①  yum安装

![](assets/10-Linux/87c4910b1ac0c5dec6d5.png)

       ②  rpm安装

              ![](assets/10-Linux/b78d6ee4cc01f6f8c4fd.png)

2.   安装tomcat

![](assets/10-Linux/82130b8272bd0e450158.png)

3.   配置环境变量

![](assets/10-Linux/950956a83c997d2020fa.png)

![](assets/10-Linux/196017889151ca46c0fa.png)

![](assets/10-Linux/afd4462574c2b6a802d4.png)

4.   检查配置文件语法

![](assets/10-Linux/4669f120cbcd1572ac20.png)

5.   启动服务

![](assets/10-Linux/0bdd395d75f15a981567.png)

6.   访问验证

![](assets/10-Linux/5b71a1dd98df885c4759.png)

7.   查看文件树

![](assets/10-Linux/bd14100b329cf1a74433.png)

# 五、部署第一个web应用
1.   在webapps文件夹下创建项目目录

![](assets/10-Linux/8b093e2233ea53303298.png)

2.   在项目文件夹下编写测试页

![](assets/10-Linux/3c6ec65277f85d5416ed.png)

![](assets/10-Linux/ea1d422bf82474f96b45.png)

3.   访问测试

![](assets/10-Linux/ecbd64a73f82cee49061.png)

4.   查看work文件树

![](assets/10-Linux/494b5e56cd66630c3f28.png)

# 六、其他配置
1.   显示服务管理员页面

①  编辑webapps管理功能配置文件

       ![](assets/10-Linux/f77095cf68fad748b42b.png)

②  注释掉ip地址限制

       ![](assets/10-Linux/74abcbc48b81094d1a46.png)

③  编辑用户认证配置文件

       ![](assets/10-Linux/c42b230eb2a8bf934919.png)

④  添加账号密码信息

       ![](assets/10-Linux/85a17341cbcf520ddd76.png)

⑤  访问验证

       ![](assets/10-Linux/88df4688f08eeceb482a.png)

2.   显示虚拟主机管理页面

①  编辑虚拟主机管理功能配置文件

        ![](assets/10-Linux/54c0ada7e6b45d5c11e3.png)

②  注释掉ip地址限制

        ![](assets/10-Linux/e92808bc0382dc451b03.png)

③  编辑用户认证配置文件

        ![](assets/10-Linux/d534b0bdad57a5d54b7b.png)

④  添加账号密码信息

       ![](assets/10-Linux/94b10c8ff5ede0ec70f2.png)

⑤  访问验证

       ![](assets/10-Linux/fe01d8bdebaa7339ade0.png)

3.   修改端口号

①  编辑主配置文件

       ![](assets/10-Linux/a944d2080eae5a5c6150.png)

②  修改端口号

       ![](assets/10-Linux/728f4488e6d546d31254.png)

③  访问验证

       ![](assets/10-Linux/e8e05155f9f545cdb09b.png)

4.   https连接

①  使用keytool为tomcat生成密钥

             ![](assets/10-Linux/f1d6465aa55015579ce4.png)

              -genkey 表示生成密钥

-alias 指定密钥别名，这里是tomcat

-keyalg 指定密钥算法，这里是RSA

-keystore 指定密钥文件存储位置和文件名

-validity 指定有效期，单位天，这里是36000天

②  修改端口号

             ![](assets/10-Linux/2a849134a9d9472fbd4c.png)

③  修改https配置

       ![](assets/10-Linux/e1edcae7e94a646465ca.png)

④  抓包工具给客户端信任根证书

       ![](assets/10-Linux/ac0552a182c80149d1e1.png)

⑤  访问验证

             ![](assets/10-Linux/1a87df3133eba208e805.png)

5.   定义虚拟主机

①  修改主配置文件host区域

       ![](assets/10-Linux/284c2d0b759c17b6fc28.png)

name="www.cuiliang123.com" （网站名称）

appBase="/data/webapps" （web路径）

unpackWARs="true" （支持WAR包）

autoDeploy="true"（支持热部署）

docBase="/data/webapps" （web路径）

directory="/data/logs" （日志路径）

prefix="www.cuiliang123.com_access_log" suffix=".txt"（日志名称）

pattern="% %l %u %t &quot; %r&quot; %s %b" （日志格式）

②  创建对应的文件夹

       ![](assets/10-Linux/772461c6d7258b849525.png)

③  创建web应用

       ![](assets/10-Linux/0c6803e09791e75da294.png)

       ![](assets/10-Linux/e2796226099c9f610635.png)

④  访问验证

       ![](assets/10-Linux/be9ad2e48b500315e542.png)

⑤  查看日志

       ![](assets/10-Linux/8833e85722bd18e107b2.png)

6.   定义默认web应用

①  修改主配置文件host区域

      ![](assets/10-Linux/c26f4e35064d503dc34d.png)

②  创建ROOT文件夹,并将项目移动至ROOT文件夹中

      ![](assets/10-Linux/aa606048c0946b23640d.png)

③  访问验证

      ![](assets/10-Linux/d6186edeb82344048c65.png)

7.   定义别名访问

①  修改主配置文件host区域，定义别名

       ![](assets/10-Linux/1a75313f50ad4fb5fbd2.png)

②  创建shangcheng文件夹,并将项目移动至shangcheng文件夹中

       ![](assets/10-Linux/028790bb5e752973695b.png)

③  创建链接文件

       ![](assets/10-Linux/565d0de70c960fbfe5c4.png)

④  访问验证

       ![](assets/10-Linux/e2a4b29076eb321e68fa.png)

8.   设置访问控制

①  在host区域定义访问控制类

       ![](assets/10-Linux/50b37239468ec6e61e4b.png)

②  访问验证

       ![](assets/10-Linux/3c43ab050a422022c4d3.png)

9.   搭建项目勾连数据库

①  查看lib中是否有支持数据库的jar包

       ![](assets/10-Linux/70cbf2645153a398bb97.png)

②  在数据库服务器中创建相应表及账号授权

③  jdbc文件中配置数据库

       ![](assets/10-Linux/d2714ff4be1c9ac1406e.png)

       ![](assets/10-Linux/b5b320fdc4752263d424.png)

④  访问验证

       ![](assets/10-Linux/9f8fecc5c458e4659082.png)

# 七、LNMT架构
1.   实现动静分离

①  修改nginx服务器配置文件

       ![](assets/10-Linux/812b2ff6487b7992571c.png)

②  访问静态资源

       ![](assets/10-Linux/cdf7dfc2f37ff426669c.png)

③  访问动态资源

       ![](assets/10-Linux/2cc3e40396f1b9a45ab5.png)

2.   通过URL重写，默认访问index.jsp

①  修改nginx服务器配置文件

       ![](assets/10-Linux/f3e16684cf60c419867a.png)

②  访问测试

       ![](assets/10-Linux/ab7651ac91ecfc243990.png)

3.   Nginx调度tomcat

①  修改nginx服务器配置文件

![](assets/10-Linux/4a30f7854ccbb0ea284b.png)

![](assets/10-Linux/0f67e65f7ba45b1904d7.png)

       ②  访问测试

![](assets/10-Linux/a23df4a743528392982a.png)

![](assets/10-Linux/d621bb80a4a74837c38c.png)

# 八、LAMT架构
1.   使用apache虚拟主机，基于proxy_module模块代理

①  查看是否安装proxy_module模块

       ![](assets/10-Linux/657e1d3bbde3617b4d5a.png)

②  Apache服务器子文件配置

       ![](assets/10-Linux/da2ed340b34cd0a412cf.png)

       ![](assets/10-Linux/aca58428117ae36c6686.png)

③  访问测试

       ![](assets/10-Linux/3364545a4a063fee9d73.png)

      


