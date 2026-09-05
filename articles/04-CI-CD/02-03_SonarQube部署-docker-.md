# SonarQube部署(docker)

> 分类：CI/CD / 第2章：SonarQube代码扫描
> 原文：https://www.cuiliangblog.cn/detail/section/131602160
> 来源：崔亮的博客

---

# 简易安装
## 下载地址
镜像下载地址：[https://hub.docker.com/_/sonarqube](https://hub.docker.com/_/sonarqube)

## 拉取镜像
```plain
docker pull sonarqube:9.9.4-community
```

## 运行容器
```plain
docker run -d --name sonarqube -e SONAR_ES_BOOTSTRAP_CHECKS_DISABLE=true -p 9000:9000 sonarqube:9.9.4-community
```

# 登录SonarQube
实例启动并运行后，使用系统管理员凭据登录到 [http://localhost:9000](http://localhost:9000/)

+ 用户名：admin
+ 密码：admin

登录成功后需要重置密码  
![](assets/04-CI-CD/aff9c0d129bb95163994.png)


