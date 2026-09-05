# jenkins凭据管理

> 分类：CI/CD / 第6章：Jenkins基础配置
> 原文：https://www.cuiliangblog.cn/detail/section/131888848
> 来源：崔亮的博客

---

jenkins在持续部署过程中，经常需要密文存储各种凭据信息，例如harbor账号密码、数据库账号密码、git账号密码等信息，以便jenkins能与这些第三方应用进行集成交互。

# 安装插件
在jenkins的插件管理中安装Credentials Binding插件

![](assets/04-CI-CD/5de51cd199f90408e143.png)

安装完成后，在jenkins菜单中可以看到凭证功能菜单

![](assets/04-CI-CD/527ac59e1dc8876b22a2.png)

# 凭据使用
## 创建凭据
依次点击jenkins——>系统管理——>Credentials——>全局凭据——> Add Credentials

![](assets/04-CI-CD/edbed18d9d3bd9c8d36c.png)

## 用户密码
用于使用用户名和密码验证，详细使用可参考jenkins通过http/https方式拉取gitlab代码配置，创建凭据内容如下：

![](assets/04-CI-CD/63f39497178c88281d1b.png)

## SSH密钥
用于ssh密钥验证，详细使用可参考jenkins通过ssh认证拉取gitlab代码配置，创建凭据内容如下：

![](assets/04-CI-CD/15d280722cc63c0c7bc3.png)

## <font style="color:rgb(48, 49, 51);">Certificate</font>
用于存储<font style="color:rgb(48, 49, 51);">PKCS#12格式的pfx证书文件，详细使用可参考jenkins连接远程k8s集群配置，创建凭据内容如下：</font>

![](assets/04-CI-CD/b2e908fea019c9168f55.png)

其他凭据使用后续补充


