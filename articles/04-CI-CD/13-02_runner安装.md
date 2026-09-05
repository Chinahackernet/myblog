# runner安装

> 分类：CI/CD / 第13章：Gitlab Runner
> 原文：https://www.cuiliangblog.cn/detail/section/123128550
> 来源：崔亮的博客

---

> 安装的gitlab runner版本与gitlab版本保持一致。
>

# 参考文档
[https://docs.gitlab.com/runner/install/index.html](https://docs.gitlab.com/runner/install/index.html)

# 查看gitlab版本
```bash
[root@gitlab ~]# gitlab-rake gitlab:env:info

System information
System:
Current User:   git
Using RVM:      no
Ruby Version:   3.1.4p223
Gem Version:    3.5.6
Bundler Version:2.5.6
Rake Version:   13.0.6
Redis Version:  7.0.15
Sidekiq Version:7.1.6
Go Version:     unknown

GitLab information
Version:        16.10.2
Revision:       7d1b278e7ce
Directory:      /opt/gitlab/embedded/service/gitlab-rails
DB Adapter:     PostgreSQL
DB Version:     14.11
URL:            http://192.168.10.72
HTTP Clone URL: http://192.168.10.72/some-group/some-project.git
SSH Clone URL:  git@192.168.10.72:some-group/some-project.git
Using LDAP:     no
Using Omniauth: yes
Omniauth Providers: 

GitLab Shell
Version:        14.34.0
Repository storages:
- default:      unix:/var/opt/gitlab/gitaly/gitaly.socket
GitLab Shell path:              /opt/gitlab/embedded/service/gitlab-shell

Gitaly
- default Address:      unix:/var/opt/gitlab/gitaly/gitaly.socket
- default Version:      16.10.2
- default Git Version:  2.43.0
```

通过打印信息可知当前gitlab版本为16.10.2，因此runner版本也要安装16.10版

# yum安装
[https://docs.gitlab.com/runner/install/linux-repository.html](https://docs.gitlab.com/runner/install/linux-repository.html)

```bash
# 添加官方仓库
[root@tiaoban ~]# curl -L "https://packages.gitlab.com/install/repositories/runner/gitlab-runner/script.rpm.sh" | sudo bash
# 安装最新版本runner
[root@tiaoban ~]# dnf install -y gitlab-runner
# 更新runner
[root@tiaoban ~]# dnf update -y gitlab-runner
# 安装指定版本的runner
[root@tiaoban ~]# dnf list gitlab-runner --showduplicates | grep 16.10
[root@tiaoban ~]# dnf install -y gitlab-runner-16.10.0
```

# rpm包安装
查找合适版本的软件包并下载

[https://mirrors.tuna.tsinghua.edu.cn/gitlab-runner/yum/el7-x86_64/](https://mirrors.tuna.tsinghua.edu.cn/gitlab-runner/yum/el7-x86_64/)

```bash
[root@tiaoban gitlab-runner]# wget https://mirrors.tuna.tsinghua.edu.cn/gitlab-runner/yum/el7-x86_64/gitlab-runner-16.10.0-1.x86_64.rpm
[root@tiaoban gitlab-runner]# rpm -ivh gitlab-runner-16.10.0-1.x86_64.rpm
```

# docker安装
```bash
[root@client2 docker]# mkdir gitlab-runner
[root@client2 docker]# ls
gitlab-runner
[root@client2 docker]# docker run --name gitlab-runner -itd -v /opt/docker/gitlab-runner:/etc/gitlab-runner --restart always gitlab/gitlab-runner:v16.10.0
```


