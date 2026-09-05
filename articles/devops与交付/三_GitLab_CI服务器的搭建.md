## 持续集成(CI)

CI，Continuous Integration，持续集成，是软件开发过程中一个非常重要的环节，在互联网敏捷开发的过程中，持续集成通常用来进行日常编译和自动化测试，来保证及时发现提交的问题，避免影响项目进度。

通常持续集成的过程包括：

-   提交（合并）代码
-   编译
-   测试
-   发布

不同的项目可能步骤有所不同，一些更加规范的公司的项目可能会加入静态代码检查，也有不少的小项目迫于进度和QA的工作压力，可能连测试过程都没有。

![image.png](assets/devops与交付/三_GitLab_CI服务器的搭建/三_GitLab_CI服务器的搭建-1.png)

GitLab CI/CD 转载自：[https://docs.gitlab.com/ee/ci/](https://docs.gitlab.com/ee/ci/)

## 持续集成工具

CI工具有很多，目前最为常用应该是Jenkins。Jenkins通常包括一个master和很多个slave。master用于配置和组织节点、任务，slave则用来真正执行配置好的任务。因为用户群体的庞大，Jenkins上的各种插件，尤其是很多可视化插件都非常丰富，可以帮助很多新手快速配置所需的任务。

gitlab-ci是git官方的持续集成工具，在Git工程管理页面上，也有专门的CI配置和展示页。

![image.png](assets/devops与交付/三_GitLab_CI服务器的搭建/三_GitLab_CI服务器的搭建-2.png)

Github上许多优秀的开源项目的Readme.md中，可以看到有如下图中“**build|passing**”的图标，就是通过markdown元素引用了当前版本CI/CD的结果的展示。

![image.png](assets/devops与交付/三_GitLab_CI服务器的搭建/三_GitLab_CI服务器的搭建-3.png)

随着代码更多地通过Git进行管理，gitlab-ci也成为了常见的CI平台。就我理解，gitlab-ci是一个简易版的jenkins，git服务器兼任了Jenkins master的功能，而我只需要准备好一个slave即可。而且，gitlab-ci的runner支持多重环境，尤其是Docker还有专属的配置支持。配置过程也非常的简便无脑，比起Jenkins的slave配置可以说是完胜了。

之前我一直都是在公司的Jenkins服务平台上做CI（其实也没做过几个）的，由于Jenkins权限管控的问题，不方便在slave上尝试和排查环境问题（可以看我之前的oclint出现环境问题的排查）。刚好现在的公司项目使用的是gitlab-ci，因此就想学习一下和尝试一下。

## gitlab-ci runner的安装与配置

### 1.安装Docker

安装docker是为了后面跑runner

参考 [https://docs.docker.com/install/linux/docker-ce/centos/](https://links.jianshu.com/go?to=https%3A%2F%2Fdocs.docker.com%2Finstall%2Flinux%2Fdocker-ce%2Fcentos%2F)

-   linux上

```plain
curl -sSL https://get.docker.com/ | sh
```

-   Mac OS上  
    

macOS 我们可以使用 Homebrew 来安装 Docker。

Homebrew 的 Cask 已经支持 Docker for Mac，因此可以很方便的使用 Homebrew Cask 来进行安装：

```plain
$ brew cask install docker
==> Creating Caskroom at /usr/local/Caskroom
==> We'll set permissions properly so we won't need sudo in the future
Password:          # 输入 macOS 密码
==> Satisfying dependencies
==> Downloading https://download.docker.com/mac/stable/21090/Docker.dmg
######################################################################## 100.0%
==> Verifying checksum for Cask docker
==> Installing Cask docker
==> Moving App 'Docker.app' to '/Applications/Docker.app'.
&#x1f37a;  docker was successfully installed!
```

在载入 Docker app 后，点击 Next，可能会询问你的 macOS 登陆密码，你输入即可。之后会弹出一个 Docker 运行的提示窗口，状态栏上也有有个小鲸鱼的图标（![](assets/devops与交付/三_GitLab_CI服务器的搭建/三_GitLab_CI服务器的搭建-4.png)）。

### 2.安装gitlab ci runner

-   linux上

参考链接：[https://docs.gitlab.com/runner/install/linux-manually.html](https://docs.gitlab.com/runner/install/linux-manually.html)

使用二进制文件安装

```plain
# Linux x86-64
sudo curl -L --output /usr/local/bin/gitlab-runner https://gitlab-runner-downloads.s3.amazonaws.com/latest/binaries/gitlab-runner-linux-amd64
sudo chmod +x /usr/local/bin/gitlab-runner
sudo useradd --comment 'GitLab Runner' --create-home gitlab-runner --shell /bin/bash
sudo gitlab-runner install --user=gitlab-runner --working-directory=/home/gitlab-runner
sudo gitlab-runner start
```

查看是否运行正常

```plain
root@i-klhcs1uo:~# gitlab-runner status
Runtime platform                                    arch=amd64 os=linux pid=16705 revision=c127439c version=13.0.0
gitlab-runner: Service is running!
```

-   Mac OS上

```plain
➜  [/Users/mac] brew install gitlab-runner
➜  [/Users/mac] brew services start gitlab-runner
➜  [/Users/mac] gitlab-runner status
Runtime platform                                    arch=amd64 os=darwin pid=61606 revision=21cb397c version=13.0.1
gitlab-runner: Service is running!
```

### 3.设置Docker权限

为了让gitlab-runner能正确的执行docker命令，需要把gitlab-runner用户添加到docker group里，然后重启docker和gitlab ci runner

```plain
usermod -aG docker gitlab-runner
service docker restart
gitlan-runner restart
```

### 4.gitlab-runner注册

注册流程是获取runner token >>  注册

#### 4.1 gitlab-runner的类型

-   shared ： 运行整个平台项目的作业（gitlab）
-   group： 运行特定group下的所有项目的作业（group）
-   specific: 运行指定的项目作业（project）
-   locked： 无法运行项目作业
-   paused： 不会运行作业

首先得知道gitlab-runner的类型有哪些，可以在不同的界面获取runner token就会生成不同类型的runner。。

gitlab-runner是支持分布式的，可以运行在各种环境，极大的方便开发和测试，当安装好gitlan-runner之后，需要进行注册到gitlab上，进行关联，首先登陆gitlab获取url和tocken

**获取**shared**类****型runnertoken**

进入系统设置 -> Runners

![image.png](assets/devops与交付/三_GitLab_CI服务器的搭建/三_GitLab_CI服务器的搭建-5.png)

**获**取group类**型的runnertoken**

进入group -> Settings -> CI/CD -> Runners -> Group Runners

![image.png](assets/devops与交付/三_GitLab_CI服务器的搭建/三_GitLab_CI服务器的搭建-6.png)

**获**取specific类**型的runnertoken**

进入具体的项目 -> Settings -> CI/CD -> Runners -> Specific Runners

![image.png](assets/devops与交付/三_GitLab_CI服务器的搭建/三_GitLab_CI服务器的搭建-7.png)

![image.png](assets/devops与交付/三_GitLab_CI服务器的搭建/三_GitLab_CI服务器的搭建-8.png)

#### 4.2 进行注册

-   方式1： 交互式注册

```plain
➜  [/Users/mac] gitlab-runner register
Runtime platform                                    arch=amd64 os=darwin pid=61621 revision=21cb397c version=13.0.1
WARNING: Running in user-mode.
WARNING: Use sudo for system-mode:
WARNING: $ sudo gitlab-runner...

Please enter the gitlab-ci coordinator URL (e.g. https://gitlab.com/):
http://gitlab.example.com/
Please enter the gitlab-ci token for this runner:
6-uZ1ndZ2NRGp8_TghnL
Please enter the gitlab-ci description for this runner:
[Double-dong.local]: gitlab-ci
Please enter the gitlab-ci tags for this runner (comma separated):
python3.4
Registering runner... succeeded                     runner=6-uZ1ndZ
Please enter the executor: docker+machine, kubernetes, ssh, virtualbox, docker-ssh, parallels, shell, docker-ssh+machine, custom, docker:
docker
Please enter the default Docker image (e.g. ruby:2.6):
python:3.4
Runner registered successfully. Feel free to start it, but if it's running already the config should be automatically reloaded!
➜  [/Users/mac] gitlab-runner verify
Runtime platform                                    arch=amd64 os=darwin pid=61635 revision=21cb397c version=13.0.1
WARNING: Running in user-mode.
WARNING: Use sudo for system-mode:
WARNING: $ sudo gitlab-runner...

Verifying runner... is alive                        runner=NkYLeMbb
➜  [/Users/mac] gitlab-runner list
Runtime platform                                    arch=amd64 os=darwin pid=61640 revision=21cb397c version=13.0.1
Listing configured runners                          ConfigFile=/Users/mac/.gitlab-runner/config.toml
gitlab-ci                                           Executor=docker Token=NkYLeMbbpJ2NyuwxaVKG URL=http://gitlab.example.com/
```

-   url：私有git的路径
-   token：项目的token，用于关联runner和项目
-   name：runner的名字，用于区分runner
-   tags：用于匹配任务（jobs）和执行任务的设备（runners）
-   executor：执行环境

其中url和token在项目的CI配置页上可以找到。name只是用来区分两个runner，没有特殊的作用。tags这个属性，job和runner都有，用来匹配任务和执行任务的runner。job的tags属性下一篇会提到，也可以自行查阅.gitlab-ci.yml的语法。runner的tag可以有多个，注册时用逗号（comma）分隔即可。当某个job的tag是当前runner tags的一个子集时，这个job就可以被分配到当前runner上执行。

> **举个栗子**
> 
> runner的tag设为：python2.7,python3.4
> 
> job的tag设为：python2.7或python3.4，macos就可以在这个runner上执行。
> 
> job的tag设为：java，这个job就不会被分配到这个runner上。

executor就是执行job的环境，通常我们都会选择docker，如果有其他需要的也可以自行查阅文档。

当我们完成设置以后，可以通过`vi ~/.gitlab-runner/config.toml`打开runner的配置文件，刚才所填写的信息都会记录在其中。如果配置了多个runner，就会像图中一样，出现两个runners的section。

![image.png](assets/devops与交付/三_GitLab_CI服务器的搭建/三_GitLab_CI服务器的搭建-9.png)

注册成功，返回到gitlab已经是激活的状态。

![image.png](assets/devops与交付/三_GitLab_CI服务器的搭建/三_GitLab_CI服务器的搭建-10.png)

-   方式2： 直接注册

```plain
➜  [/Users/mac] gitlab-runner register \
  --non-interactive \
  --executor "shell" \
  --url "http://gitlab.example.com/" \
  --registration-token "AvpQDzBCL66sYKyURChH" \
  --description "devops-runner" \
  --tag-list "build,deploy" \
  --run-untagged="true" \
  --locked="false" \
  --access-level="not_protected"
```

  

> ⚠️：这里说一下如果gitlab服务器开启了https，则gitlab-runner在注册的时候需要把证书的签名文件，解决办法如下：

```plain
➜  [/Users/mac]  gitlab-runner register \
   --non-interactive \
   --tls-ca-file=/etc/gitlab/ssl/gitlab.example.com.crt  \
   --url "https://gitlab.example.com/" \
   --registration-token "AvpQDzBCL66sYKyURChH" \
   --executor "docker" \
   --docker-image maven:latest \
   --description "runner " \
   --tag-list "run" \
   --run-untagged \
   --locked="false"
Running in system-mode.                            
                                                   
Registering runner... succeeded                     runner=AvpQDzBC
Runner registered successfully. Feel free to start it, but if it's running already the config should be automatically reloaded!
```

#### 4.3 注册之后的效果

![image.png](assets/devops与交付/三_GitLab_CI服务器的搭建/三_GitLab_CI服务器的搭建-11.png)

  

参考文章：

[https://www.jianshu.com/p/30e3f2940078](https://www.jianshu.com/p/30e3f2940078)

[https://docs.gitlab.com/11.9/runner/register/index.html](https://links.jianshu.com/go?to=https%3A%2F%2Fdocs.gitlab.com%2F11.9%2Frunner%2Fregister%2Findex.html)