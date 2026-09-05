# jenkins基本设置

> 分类：CI/CD / 第6章：Jenkins基础配置
> 原文：https://www.cuiliangblog.cn/detail/section/131416679
> 来源：崔亮的博客

---

#  初始化设置
## 获取管理员密码
```bash
[root@tiaoban cicd]# cat /var/jenkins_home/secrets/initialAdminPassword
0ce189b4fad94ad487ec3263a061a3be
```

## 安装推荐的插件
![](assets/04-CI-CD/c689f13a85750f47e472.png)

## 创建管理员用户
也可以继续使用admin账号，在系统页面修改密码。

![](assets/04-CI-CD/fd8beb281e1e272717e2.png)

## 配置jenkins地址
如果是docker或者rpm包方式部署，填写jenkins域名即可，如果是k8s部署，可以填写svc形式。即http://jenkins.cicd.svc:8080/

![](assets/04-CI-CD/c1f5bf01c39d390f939c.png)

# 使用配置
## 修改admin用户密码和时区
依次点击用户名——>Configure找到密码和时区设置

![](assets/04-CI-CD/b9f1fea6c0fb80927b5b.png)

## 修改插件安装源
修改为国内插件源地址，提高插件下载速度

[https://mirrors.tuna.tsinghua.edu.cn/jenkins/updates/update-center.json](https://mirrors.tuna.tsinghua.edu.cn/jenkins/updates/update-center.json)

![](assets/04-CI-CD/d49369b4591ab9f0d90e.png)

## 插件卸载
如果遇到插件异常导致jenkins系统无法使用，可以尝试卸载异常插件

```bash
# 停止jenkins服务
systemctl stop jenkins
# 删除插件目录下异常插件.jpi文件
rm -rf /var/jenkins_home/plugins/role-strategy.jpi
# 重启jenkins
systemctl start jenkins
```


