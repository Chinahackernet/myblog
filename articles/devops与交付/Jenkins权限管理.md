# 一、安装插件

> 插件名：[Role-based Authorization Strategy](https://plugins.jenkins.io/role-strategy)

![image.png](assets/devops与交付/Jenkins权限管理/Jenkins权限管理-1.png)

  

# 二、配置授权策略

![image.png](assets/devops与交付/Jenkins权限管理/Jenkins权限管理-2.png)

# 三、创建用户

![image.png](assets/devops与交付/Jenkins权限管理/Jenkins权限管理-3.png)

  

# 四、添加并配置权限

## 4.1、添加Global Role

![image.png](assets/devops与交付/Jenkins权限管理/Jenkins权限管理-4.png)

> 普通角色拥有全局只读权限

  

## 4.2、添加Project Role

![image.png](assets/devops与交付/Jenkins权限管理/Jenkins权限管理-5.png)

> bigdata这个Role可以匹配所有以bigdata-开头的项目
> 
> risk这个Role可以匹配所有以risk-开头的项目

  

## 4.3、配置Assign Roles

为用户和Role建立绑定关系。

（1）、配置用户的全局权限

![image.png](assets/devops与交付/Jenkins权限管理/Jenkins权限管理-6.png)

（2）、配置项目权限

![image.png](assets/devops与交付/Jenkins权限管理/Jenkins权限管理-7.png)

  

# 五、测试

（1）、以admin用户查看

![image.png](assets/devops与交付/Jenkins权限管理/Jenkins权限管理-8.png)

（2）、以bigdata用户查看

![image.png](assets/devops与交付/Jenkins权限管理/Jenkins权限管理-9.png)（3）、以risk用户查看

![image.png](assets/devops与交付/Jenkins权限管理/Jenkins权限管理-10.png)