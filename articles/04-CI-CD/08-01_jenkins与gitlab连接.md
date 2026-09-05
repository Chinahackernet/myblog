# jenkins与gitlab连接

> 分类：CI/CD / 第8章：Jenkins工具链集成
> 原文：https://www.cuiliangblog.cn/detail/section/127410630
> 来源：崔亮的博客

---

# gitlab配置
## 创建用户并登录
注册一个普通用户cuiliang并登录

![](assets/04-CI-CD/4573a883541315a4fd38.png)

## 导入项目
此处以Vue项目为例，项目地址：[https://gitee.com/cuiliang0302/vue3_vite_element-plus.git](https://gitee.com/cuiliang0302/vue3_vite_element-plus.git)

![](assets/04-CI-CD/03e1fd5834beba107c75.png)

# jenkins配置
## 安装gitlab插件
依次点击jenkins——>Manage Jenkins——>插件管理——>Plugins，在Jenkins的插件管理中安装GitLab插件

![](assets/04-CI-CD/7d4685332288db6a2fb6.png)

# 连接配置
## 验证方式简介
为了让我们本地可以通过Git连接到远程仓库（Github/Gitee/Gitlab ），远程仓库给我们提供了三种验证方式进行连接。

1. SSH验证

这是最原始的方式，如果使用git bash只要按照官方文档一步一步配置就好了。 需要在客户端生成公钥，然后复制到远程仓库地址的公钥位置。

注意点：SSH有可能需要配置代理，否则无法解析服务器域名。错误如下：

```bash
ssh: Could not resolve hostname github.com: no address associated with name
```

解决办法：给SSH以及git 客户端配置代理。

2. HTTPS验证

这也是比较方便的方式，但是每一次都需要输入用户名和密码。

注意点：本机的SSL证书不是正规机构颁发的，验证失败。错误如下：

```bash
fatal: unable to access ‘https://github.com/owner/repo.git/’: SSL certificate problem: unable to get local issuer certificate
```

解决办法：将Git的SSL验证关闭，命令如下。

```bash
git config --global http.sslVerify false
```

3. Access Token验证

拉取gitlab私有代码库代码一定要注意安全性，如果是在个人电脑上，使用个人的账号密码方式或者公钥方式都是可以的。但是如果是在公共系统例如CI（自动集成）场景下或者使用公共账号场景下再使用账号密码方式和公钥方式就不能保证安全性了。这时候使用access token方式可以解决对应的安全问题。

使用方法：

+ 从Settings页面生成唯一的Token
+ 手动拼接出远程仓库的地址，比如：https://$GH_TOKEN@github.com/owner/repo.git
+ 从以上地址克隆或使用git remote add 的方式关联本地仓库，之后都不需要输入用户名和密码信息。

## SSH验证
1. 在jenkins容器中生成密钥

```bash
[root@tiaoban ~]# kubectl exec -it -n cicd jenkins-5558bcd59f-s6b2s -- bash
jenkins@jenkins-5558bcd59f-pwfhq:/$ ssh-keygen
Generating public/private rsa key pair.
Enter file in which to save the key (/var/jenkins_home/.ssh/id_rsa): 
Created directory '/var/jenkins_home/.ssh'.
Enter passphrase (empty for no passphrase): 
Enter same passphrase again: 
Your identification has been saved in /var/jenkins_home/.ssh/id_rsa
Your public key has been saved in /var/jenkins_home/.ssh/id_rsa.pub
The key fingerprint is:
SHA256:NLMfZkXBLxey0WhOIg46hZLqBQmRWWrvWebAxuKY/CI jenkins@jenkins-5558bcd59f-pwfhq
The key's randomart image is:
+---[RSA 3072]----+
|+=o. .     .o+   |
|o+o . o . ..B o  |
|.o.. o o+. =.= . |
|o +.o  ..+ .+ o  |
|...* +  S +  o   |
|+o+ *    + .     |
|oo o .    .      |
|E..              |
|. ..             |
+----[SHA256]-----+
jenkins@jenkins-5558bcd59f-pwfhq:/$ 
jenkins@jenkins-5558bcd59f-pwfhq:/$ cat ~/.ssh/id_rsa.pub 
ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQC+SCLNn6RcOJs9anR2VB8xEOXbxW3HfqMfdWQc7m3LHMEy7bNjUrCc0iKURyYa41szVx39NRQXYT/Eh1mSXH1UV9royAQIM8Tw74/JfZWpvU0kIc4QGphsmHxZHn2TixvwwUF99VOsOnF+bBU9CPKxx2r1txQvHkUgdkJ3KC3uLZ6TA1yt5qN6SaEC/c+TgDjdD36/iIjmZDhdtFfyqLGx4avEhZKv6I3orCDLpN4Ug4rI/kDKX/kSv4vkfUmF6vFH/O0mwm31+o+9SvLwXB2vJyvFQ0pBSXBhE7RP3bDAy8Ler4mFwHNexji2LVckSaNFLEExS/SSB9WuqRmpHwnd0P15qHT5Tl12t2mEEC6u5zaz1HlhAFoXSzNtDabsFlvAbwIV43N/hPkJ8vWyAXIxeHgYAVNR0XWsFirWVIszjuqX22BKpC5mEIdQWkqwFc0CAu4Fv8fHok2hPtxvvCKF4TCwA9FUg62q9eUEs2fV903mIKPyKacl2kO9C9mQE68= jenkins@jenkins-5558bcd59f-pwfhq
```

2. 在gitlab中添加ssh密钥信息

依次点击用户——>设置——>ssh密钥，填写密钥信息。

![](assets/04-CI-CD/4c175cde85747814a3bf.png)

3. 获取jenkins容器用户名和私钥

```bash
jenkins@jenkins-5558bcd59f-s6b2s:/$ whoami
jenkins
jenkins@jenkins-5558bcd59f-s6b2s:/$ cat ~/.ssh/id_rsa
[示例私钥已隐藏，请在部署环境注入临时密钥]
```

4. jenkins创建密钥凭据，类型选择ssh username with private key

![](assets/04-CI-CD/42c8eda1f658484e40f4.png)

5. 获取仓库git连接地址

![](assets/04-CI-CD/5ed9c03a402be87c39a7.png)

6. 创建自由风格的软件项目

![](assets/04-CI-CD/a7e123325593494ed5dc.png)

7. 在源码管理中添加仓库地址，需要注意的是默认地址为git@gitlab-559d798d49-hpcjt:cuiliang/vue3_vite_element-plus.git，修改为git@gitlab-svc.cicd.svc:cuiliang/vue3_vite_element-plus.git，并在jenkins容器中执行命令，添加远程仓库地址。

```bash
jenkins@jenkins-5558bcd59f-vsv2x:/$ git ls-remote -h -- git@gitlab-svc.cicd.svc:cuiliang/vue3_vite_element-plus.git HEAD
The authenticity of host 'gitlab-svc.cicd.svc (10.103.77.84)' can't be established.
ECDSA key fingerprint is SHA256:CdqN3MItwSLeUWQ5H2vl4wm1ZhHqQK11lPoHA3Uuu9M.
Are you sure you want to continue connecting (yes/no/[fingerprint])? yes
Warning: Permanently added 'gitlab-svc.cicd.svc' (ECDSA) to the list of known hosts.
```

![](assets/04-CI-CD/f04ad5d84c61747649b2.png)

8. 点击立即构建，可以拉取代码并获取git commit信息。

![](assets/04-CI-CD/579e5eb9223e5f20891c.png)

## HTTP/HTTPS验证
1. 添加jenkins凭据

在jenkins中添加凭据，账号为gitlab账户和密码。

jenkins——>系统管理——>Credentials——>添加类型为username with password的全局凭据

![](assets/04-CI-CD/f4981e1abd0c73340fc9.png)

2. 获取项目克隆地址

访问gitlab项目页，获取项目http克隆地址。[http://gitlab-559d798d49-hpcjt/cuiliang/vue3_vite_element-plus.git](http://gitlab-559d798d49-hpcjt/cuiliang/vue3_vite_element-plus.git)

![](assets/04-CI-CD/78c01ceaef92b0e17651.png)

3. 创建自由风格任务测试

新建一个自由风格软件项目测试

![](assets/04-CI-CD/2bce1f3aa73d41e63c74.png)

在源码管理中填写http仓库地址，并选择账号密码凭据，需要注意的是仓库地址默认使用gitlab的pod名称，需要改为svc名称方式。即[http://gitlab-svc.cicd.svc/cuiliang/vue3_vite_element-plus.git](http://gitlab-svc.cicd.svc/cuiliang/vue3_vite_element-plus.git)

![](assets/04-CI-CD/949408dee6f064624827.png)

点击立即构建，查看控制台日志，已经可以正常拉取项目代码，获取到git commit信息。

![](assets/04-CI-CD/94eeae1a9d30eb8471c1.png)

## Access Token验证
1. 登录gitlab，依次点击项目——>设置——>访问令牌。角色设置为guest，授予api权限即可。

![](assets/04-CI-CD/c45484d64a1f169d1a3a.png)

2. 创建凭据，依次点击jenkins——>系统管理——>Credentials——> Add Credentials，类型选择gitlab api token

![](assets/04-CI-CD/b877c08d60dedf971429.png)

3. 配置gitlab信息

jenkins——>系统管理——>系统配置，找到gitlab配置区域，

gitlab url填写http://gitlab-svc.cicd.svc，然后点击 Test Connection，显示 Success，表示成功。

![](assets/04-CI-CD/92dcae5d965d81eb5af1.png)

# webhook配置
通常在企业实际开发过程中，当代码提交到master分支或者创建tag时，gitlab请求jenkins的webhook地址，完成持续构建和持续部署流程。

## 创建jenkins流水线项目
新建一个类型为流水线的任务

![](assets/04-CI-CD/e912fe7ac6c800df6263.png)

找到构建触发器选择，勾选Build when a change is pushed to GitLab. GitLab webhook URL: http://jenkins-svc.cicd.svc:8080/project/gitlab-webhook

![](assets/04-CI-CD/9207ddfde9c35d6e0e64.png)

## 编辑pipeline并测试
编写pipeline script，我们可以点击下方的流水线语法，生成checkout代码

![](assets/04-CI-CD/2b48eadc24d111ecebbf.png)

将生成的pipeline粘贴到流水线配置中

```bash
pipeline {
    agent any  	
    stages {
        stage('checkout code') {
            steps {
                checkout scmGit(branches: [[name: '*/master']], extensions: [], userRemoteConfigs: [[credentialsId: 'gitlab-cuiliang-password', url: 'http://gitlab-svc.cicd.svc/cuiliang/vue3_vite_element-plus.git']])
            }
        }
        stage('build') {
            steps {
                echo '编译打包完成'
            }
        }
    }
}
```

![](assets/04-CI-CD/01b7caff9533a645411e.png)

接下来点击立即构建，测试是否可以正常拉取代码

![](assets/04-CI-CD/76b44d38d7cf3f45e8a2.png)

## 开启webhook配置
配置gitlab策略，使用root用户登录——>管理员——>网络——>出站请求——>允许来自webhook和集成对本地网络的请求。

![](assets/04-CI-CD/62059075c8a7583be81a.png)

获取jenkins webhook令牌

修改流水线任务，点击Build when a change is pushed to GitLab的高级选项，生成令牌。

![](assets/04-CI-CD/662cd6b72f8d00fb4e2d.png)

切换回cuiliang用户——>vue项目——>设置——>webhooks——>填写jenkins生成的webhook地址和令牌。触发来源选择所有分支。

[http://jenkins-svc.cicd.svc:8080/project/gitlab-webhook](http://jenkins-svc.cicd.svc:8080/project/gitlab-webhook)

![](assets/04-CI-CD/637da5f5135e113a58b8.png)

推送测试事件

依次点击测试，选择推送时间，gitlab页面提示200状态码。

![](assets/04-CI-CD/b0d8d6d29d4591696bbf.png)

如果状态码为403，检查jenkins系统配置，取消勾选Enable authentication for '/project' end-point

![](assets/04-CI-CD/7577b51cac681a4e3c5b.png)

查看jenkins构建历史，发现触发了一次自动构建

![](assets/04-CI-CD/29ba7896d96efdb3acb2.png)

## 项目添加Jenkinsfile
> 通常在企业开发中，jenkinsfile文件存放在项目指定路径下，与仓库代码一同维护，根据环境灵活配置，而非jenkins中的固定配置。
>

修改流水线配置，选择pipeline文件来自仓库

![](assets/04-CI-CD/ec6c5bbc5245c5e17a08.png)

编辑gitlab项目，添加Jenkinsfile文件，文件内容为

```bash
pipeline {
    agent any  	
    stages {
        stage('checkout code') {
            steps {
                checkout scmGit(branches: [[name: '*/master']], extensions: [], userRemoteConfigs: [[credentialsId: 'gitlab-cuiliang-password', url: 'http://gitlab-svc.cicd.svc/cuiliang/vue3_vite_element-plus.git']])
            }
        }
        stage('build') {
            steps {
                echo '编译打包完成'
            }
        }
    }
}
```

![](assets/04-CI-CD/64a249ea9be8432ae54a.png)

提交代码到仓库后，查看jenkins构建历史，发现已经自动触发了一次构建

![](assets/04-CI-CD/7ba223a446d1ec5f85fc.png)


