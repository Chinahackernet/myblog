# runner注册

> 分类：CI/CD / 第13章：Gitlab Runner
> 原文：https://www.cuiliangblog.cn/detail/section/123863613
> 来源：崔亮的博客

---

# gitlab runner类型
+ shared：运行整个平台项目的作业（gitlab）
+ group：运行特定group下的所有项目的作业（group）
+ specific：运行指定的项目作业（project）

# 创建不同类型的runner
## shared类型
依次点击主页——>管理中心——>CI/CD——>Runner——>新建实例runner

![](assets/04-CI-CD/0f1cb0361cb2a9710aff.png)

## group类型
依次点击主页——>群组——>指定组——>设置——>构建——>runner——>新建群组runner

![](assets/04-CI-CD/e90ed382895a4745e89f.png)

## specific类型
依次点击主页——>项目——>指定项目——>设置——>CI/CD——>Runner——>新建项目runner

![](assets/04-CI-CD/b49692cc733dce0a7164.png)

## 生成注册命令
![](assets/04-CI-CD/bac50cfb5d54e49baff2.png)

# 注册runner(shell类型)
## 注册runner（Linux）
```bash
[root@client1 ~]# gitlab-runner register --url http://192.168.10.72  --token glrt-sx_xdrgZF7sHn1-5u5rz
Runtime platform                                    arch=amd64 os=linux pid=2620 revision=81ab07f6 version=16.10.0
Running in system-mode.                            
                                                   
Enter the GitLab instance URL (for example, https://gitlab.com/):
# 输入gitlab地址，回车即可
[http://192.168.10.72]: 
Verifying runner... is valid                        runner=sx_xdrgZF
Enter a name for the runner. This is stored only in the local config.toml file:
# 输入runner名称，回车即可
[client1]:                
Enter an executor: docker, docker-windows, instance, virtualbox, docker+machine, kubernetes, docker-autoscaler, custom, shell, ssh, parallels:
# 输入执行器类型，此处选择shell
[build test for client1]: shell   
Runner registered successfully. Feel free to start it, but if it's running already the config should be automatically reloaded!
 
Configuration (with the authentication token) was saved in "/etc/gitlab-runner/config.toml" 
```

## 注册runner（docker非交互式）
```bash
# 启动runner
[root@client2 docker]# mkdir gitlab-runner
[root@client2 docker]# ls
gitlab-runner
[root@client2 docker]# docker run --name gitlab-runner -itd -v $PWD/gitlab-runner:/etc/gitlab-runner --restart always gitlab/gitlab-runner:v16.10.0 
# 注册runner
[root@client2 gitlab-runner]# docker exec -it gitlab-runner bash
root@b156016d750b:/# gitlab-runner register \
--non-interactive \
--executor "shell" \
--url "http://192.168.10.72" \
--token "glrt-sewzG59GqdxshPisQkFo" 
Runtime platform                                    arch=amd64 os=linux pid=24 revision=81ab07f6 version=16.10.0
Running in system-mode.                            
                                                   
There might be a problem with your config based on jsonschema annotations in common/config.go (experimental feature):
jsonschema: '/runners/0/Monitoring' does not validate with https://gitlab.com/gitlab-org/gitlab-runner/common/config#/$ref/properties/runners/items/$ref/properties/Monitoring/$ref/type: expected object, but got null
 
WARNING: A runner with this system ID and token has already been registered. 
Verifying runner... is valid                        runner=GAMvA99y_
Runner registered successfully. Feel free to start it, but if it's running already the config should be automatically reloaded!
 
Configuration (with the authentication token) was saved in "/etc/gitlab-runner/config.toml" 
```

# 注册runner(docker类型)
## 注册runner（Linux）
```bash
[root@client2 ~]# gitlab-runner register \
--non-interactive \
--executor "docker" \
--url "http://192.168.10.72" \
--token "glrt-JHbwfcKH4PZye2z6d6NT" \
--docker-image alpine:latest \
--docker-privileged
Runtime platform                                    arch=amd64 os=linux pid=2568 revision=81ab07f6 version=16.10.0
Running in system-mode.                            
                                                   
Verifying runner... is valid                        runner=JHbwfcKH4
Runner registered successfully. Feel free to start it, but if it's running already the config should be automatically reloaded!
 
Configuration (with the authentication token) was saved in "/etc/gitlab-runner/config.toml" 
```

## 注册runner（docker）
```bash
[root@client2 docker]# mkdir gitlab-runner
[root@client2 docker]# ls
gitlab-runner
[root@client2 docker]# docker run --name gitlab-runner -itd \
 -v $PWD/gitlab-runner:/etc/gitlab-runner \
 -v /var/run/docker.sock:/var/run/docker.sock \
 -v /etc/hosts:/etc/hosts \
 --restart always gitlab/gitlab-runner:v16.10.0
 [root@client2 gitlab-runner]# docker exec -it gitlab-runner bash
root@b156016d750b:/# gitlab-runner register \
--non-interactive \
--executor "docker" \
--url "http://192.168.10.72" \
--token "glrt-sewzG59GqdxshPisQkFo"
```

## 配置runner
修改最大并行作业数、镜像拉取策略、挂载路径。

```bash
[root@client2 ~]# vim /etc/gitlab-runner/config.toml
concurrent = 10 # 并行执行作业数
check_interval = 0 
connection_max_age = "15m0s"
shutdown_timeout = 0 

[session_server]
  session_timeout = 1800

[[runners]]
  name = "client2"
  url = "http://192.168.10.72"
  id = 9 
  token = "glrt-JHbwfcKH4PZye2z6d6NT"
  token_obtained_at = 2024-05-30T03:30:27Z
  token_expires_at = 0001-01-01T00:00:00Z
  executor = "docker"
  [runners.cache]
    MaxUploadedArchiveSize = 0 
  [runners.docker]
    pull_policy = "if-not-present" # 配置镜像拉取策略
    tls_verify = false
    image = "alpine:latest" # 配置默认镜像
    privileged = true
    disable_entrypoint_overwrite = false
    oom_kill_disable = false
    disable_cache = false
    volumes = ["/cache", "/var/run/docker.sock:/var/run/docker.sock", "/etc/hosts:/etc/hosts"] # 配置挂载路径
    shm_size = 0 
    network_mtu = 0
```

# 修改runner为特权用户
参考文档：[https://docs.gitlab.com/runner/commands/index.html#gitlab-runner-run](https://docs.gitlab.com/runner/commands/index.html#gitlab-runner-run)

以rpm方式安装的runner为例

```bash
[root@client1 ~]# vim /etc/systemd/system/gitlab-runner.service
ExecStart=/usr/bin/gitlab-runner "run" "--working-directory" "/home/gitlab-runner" "--config" "/etc/gitlab-runner/config.toml" "--service" "gitlab-runner" "--user" "root"
[root@client1 ~]# systemctl daemon-reload 
[root@client1 ~]# systemctl restart gitlab-runner.service
```

# 查看runner状态
![](assets/04-CI-CD/101e61eff042de101b40.png)

## 
## 



