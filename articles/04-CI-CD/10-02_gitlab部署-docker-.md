# gitlab部署(docker)

> 分类：CI/CD / 第10章：Gitlab安装部署
> 原文：https://www.cuiliangblog.cn/detail/section/126398301
> 来源：崔亮的博客

---

## 安装gitlab
```bash
[root@tiaoban gitlab]# mkdir config logs data
[root@tiaoban gitlab]# ls
config  data  logs
[root@tiaoban gitlab]# pwd
/opt/gitlab
[root@tiaoban gitlab]# docker run --name gitlab --detach \
  --hostname gitlab.test.com \
  --publish 443:443 --publish 80:80 --publish 8022:22 \
  --restart always \
  --volume $PWD/config:/etc/gitlab \
  --volume $PWD/logs:/var/log/gitlab \
  --volume $PWD/data:/var/opt/gitlab \
  --shm-size 256m \
  gitlab/gitlab-ce:17.0.0-ce.0
```

## 修改配置文件
```bash
[root@tiaoban gitlab]# vim config/gitlab.rb
external_url 'http://gitlab.test.com'
gitlab_rails['gitlab_ssh_host'] = '192.168.10.100'
gitlab_rails['time_zone'] = 'Asia/Shanghai'
gitlab_rails['gitlab_shell_ssh_port'] = 8022
# 解决头像显示异常问题
gitlab_rails['gravatar_plain_url'] = 'http://gravatar.loli.net/avatar/%{hash}?s=%{size}&d=identicon'
gitlab_rails['gravatar_ssl_url'] = 'https://gravatar.loli.net/avatar/%{hash}?s=%{size}&d=identicon'
# 关闭 promethues和alertmanager
prometheus['enable'] = false
alertmanager['enable'] = false
# 默认gitlab配置资源占用较高，可以根据情况减少资源占用
# 关闭邮件服务
gitlab_rails['gitlab_email_enabled'] = false
gitlab_rails['smtp_enable'] = false
# 减少 postgresql 数据库缓存
postgresql['shared_buffers'] = "128MB"
# 减少 postgresql 数据库并发数量
postgresql['max_connections'] = 200
# nginx减少进程数
nginx['worker_processes'] = 2
[root@tiaoban gitlab]# docker exec -it gitlab bash
root@gitlab:/# gitlab-ctl reconfigure
gitlab Reconfigured!
root@gitlab:/# gitlab-ctl restart
```

## 服务控制
```bash
[root@tiaoban gitlab]# docker restart gitlab
[root@tiaoban gitlab]# docker start gitlab
[root@tiaoban gitlab]# docker stop gitlab
[root@tiaoban gitlab]# docker rm gitlab
```

## 客户端添加hosts记录
修改hosts文件，添加如下记录`gitlab.test.com 192.168.10.100`，然后浏览器访问即可。




