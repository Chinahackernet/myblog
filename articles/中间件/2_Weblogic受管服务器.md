# 一.创建受管服务器

## 1 点击左侧导航菜单[域结构]->[base\_domain]->[环境]->[服务器] 

![Image.png](assets/中间件/2_Weblogic受管服务器/2_Weblogic受管服务器-1.png) 

## 2.点击[域结构]上方的[锁定并编辑]

点击该按钮后可以在该域中修改、添加或删除项目并且锁定不让他人同时编辑

![Image.png](assets/中间件/2_Weblogic受管服务器/2_Weblogic受管服务器-2.png)

## 3.点击新建

打开新建服务器页面，输入服务器名称、监听端口以及是否属于某个群集

![Image.png](assets/中间件/2_Weblogic受管服务器/2_Weblogic受管服务器-3.png)

![Image.png](assets/中间件/2_Weblogic受管服务器/2_Weblogic受管服务器-4.png)

![Image.png](assets/中间件/2_Weblogic受管服务器/2_Weblogic受管服务器-5.png)

![Image.png](assets/中间件/2_Weblogic受管服务器/2_Weblogic受管服务器-6.png)

# 二.启动受管服务器

[weblogic@weblogic2 bin]$ cd /home/weblogic/wls12213/user\_projects/domains/base\_domain/bin

[weblogic@weblogic2 bin]$ ll

总用量 72

\-rwxr-x--- 1 weblogic weblogic  2655 5月  20 13:49 generateArchive.sh

drwxr-x--- 2 weblogic weblogic    27 5月  20 13:49 nodemanager

drwxr-x--- 2 weblogic weblogic    61 5月  20 13:49 patching

drwxr-x--- 2 weblogic weblogic    28 5月  20 13:49 server\_migration

drwxr-x--- 2 weblogic weblogic    24 5月  20 13:49 service\_migration

\-rwxr-x--- 1 weblogic weblogic 14683 5月  20 13:49 setDomainEnv.sh

\-rwxr-x--- 1 weblogic weblogic   886 5月  20 13:49 setNMJavaHome.sh

\-rwxr-x--- 1 weblogic weblogic   794 5月  20 13:49 setStartupEnv.sh

\-rwxr-x--- 1 weblogic weblogic  2279 5月  20 13:49 startComponent.sh

\-rwxr-x--- 1 weblogic weblogic  2810 5月  20 13:49 startManagedWebLogic.sh

\-rwxr-x--- 1 weblogic weblogic  1125 5月  20 13:49 startNodeManager.sh

\-rwxr-x--- 1 weblogic weblogic   703 5月  20 13:49 startRSDaemon.sh

\-rwxr-x--- 1 weblogic weblogic  7306 5月  20 13:49 startWebLogic.sh

\-rwxr-x--- 1 weblogic weblogic  1943 5月  20 13:49 stopComponent.sh

\-rwxr-x--- 1 weblogic weblogic  2640 5月  20 13:49 stopManagedWebLogic.sh

\-rwxr-x--- 1 weblogic weblogic  1071 5月  20 13:49 stopNodeManager.sh

\-rwxr-x--- 1 weblogic weblogic   847 5月  20 13:49 stopRSDaemon.sh

\-rwxr-x--- 1 weblogic weblogic  2133 5月  20 13:49 stopWebLogic.sh

[weblogic@weblogic2 bin]$ ./startManagedWebLogic.sh Server-0 [http://10.10.11.110:7001](http://10.10.11.110:7001)

![Image.png](assets/中间件/2_Weblogic受管服务器/2_Weblogic受管服务器-7.png)

## 建立密码文件

找到Server根目录  建立 security目录

创建boot.properties文件，输入如下信息

username=weblogic

password=weblogic

此时再启动Server不需输入用户名密码

![Image.png](assets/中间件/2_Weblogic受管服务器/2_Weblogic受管服务器-8.png)