## 1.创建一个python项目

使用github上开源的一个python的demo项目，地址为：[https://github.com/imooc-course/docker-cloud-flask-demo](https://github.com/imooc-course/docker-cloud-flask-demo)

打开自己的gitlab，点击New project，把项目导入。

![image.png](assets/python开发/gitlab-ci的简易入门—基于python项目的CI演示/gitlab-ci的简易入门—基于python项目的CI演示-1.png)

![image.png](assets/python开发/gitlab-ci的简易入门—基于python项目的CI演示/gitlab-ci的简易入门—基于python项目的CI演示-2.png)

## 2.手动部署

把项目clone到本地，可以先测试一下手动部署，build镜像之后，然后启动

```plain
➜  [/Users/mac/PycharmProjects] git clone http://gitlab.example.com/root/flask-demo.git
Cloning into 'flask-demo'...
Username for 'http://gitlab.example.com': root
Password for 'http://root@gitlab.example.com':
remote: Enumerating objects: 111, done.
remote: Counting objects: 100% (111/111), done.
remote: Compressing objects: 100% (83/83), done.
remote: Total 111 (delta 29), reused 103 (delta 25), pack-reused 0
Receiving objects: 100% (111/111), 33.19 KiB | 4.74 MiB/s, done.
Resolving deltas: 100% (29/29), done.
➜  [/Users/mac/PycharmProjects] cd flask-demo
➜  [/Users/mac/PycharmProjects/flask-demo] git:(master) ll
total 64
-rw-r--r--  1 mac  staff   220B  6 14 00:37 CONTRIBUTING.md
-rw-r--r--  1 mac  staff   252B  6 14 00:37 Dockerfile
-rw-r--r--  1 mac  staff   1.1K  6 14 00:37 LICENSE
-rw-r--r--  1 mac  staff   966B  6 14 00:37 README.md
drwxr-xr-x  5 mac  staff   160B  6 14 00:37 doc
-rw-r--r--  1 mac  staff   1.0K  6 14 00:37 manage.py
drwxr-xr-x  6 mac  staff   192B  6 14 00:37 migrations
-rw-r--r--  1 mac  staff   435B  6 14 00:37 requirements.txt
drwxr-xr-x  4 mac  staff   128B  6 14 00:37 scripts
drwxr-xr-x  5 mac  staff   160B  6 14 00:37 skeleton
-rw-r--r--  1 mac  staff    65B  6 14 00:37 test-requirements.txt
drwxr-xr-x  7 mac  staff   224B  6 14 00:37 tests
-rw-r--r--  1 mac  staff   1.5K  6 14 00:37 tox.ini
➜  [/Users/mac/PycharmProjects/flask-demo] git:(master) docker build -t flask-demo .
➜  [/Users/mac/PycharmProjects/flask-demo] git:(master) docker run -d -p 5000:5000 flask-demo
3a40a2b60d345bb754e1c43b01ad2da9afd9ff81f648ab51f59c960dee75b68d
➜  [/Users/mac/PycharmProjects/flask-demo] git:(master) docker ps |grep flask
3a40a2b60d34        flask-demo                      "sh scripts/dev.sh"      11 seconds ago      Up 9 seconds           0.0.0.0:5000->5000/tcp                              distracted_babbage
```

浏览器输入ip+prot

![image.png](assets/python开发/gitlab-ci的简易入门—基于python项目的CI演示/gitlab-ci的简易入门—基于python项目的CI演示-3.png)

## 3.使用gitlab的CI/CD中pipelines进行部署

整个持续集成和持续部署的流程如下：

![image.png](assets/python开发/gitlab-ci的简易入门—基于python项目的CI演示/gitlab-ci的简易入门—基于python项目的CI演示-4.png)

### 1）创建该项目所需要的runner

有的时候我们不同的项目常常需要不同的包，为了避免我们的gitlab-ci服务器上的环境比较杂乱，因此我们可以使用docker来当作runner的executor，因此我们给该项目创建了三个runner，需要用到python2和python3的环境，因为我们注册两个不同tags的runner，另外还创建了一个tags为demo的shell的runner

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
python2.7
Registering runner... succeeded                     runner=6-uZ1ndZ
Please enter the executor: docker+machine, kubernetes, ssh, virtualbox, docker-ssh, parallels, shell, docker-ssh+machine, custom, docker:
docker
Please enter the default Docker image (e.g. ruby:2.6):
python:2.7
Runner registered successfully. Feel free to start it, but if it's running already the config should be automatically reloaded!
➜  [/Users/mac] gitlab-runner verify
Runtime platform                                    arch=amd64 os=darwin pid=61635 revision=21cb397c version=13.0.1
WARNING: Running in user-mode.
WARNING: Use sudo for system-mode:
WARNING: $ sudo gitlab-runner...
Verifying runner... is alive                        runner=NkYLeMbb
Verifying runner... is alive                        runner=zTq8vB36
➜  [/Users/mac] gitlab-runner list
Runtime platform                                    arch=amd64 os=darwin pid=61640 revision=21cb397c version=13.0.1
Listing configured runners                          ConfigFile=/Users/mac/.gitlab-runner/config.toml
gitlab-ci                                           Executor=docker Token=zTq8vB36pwz52sHLFygP URL=http://gitlab.example.com/
gitlab-ci                                           Executor=docker Token=NkYLeMbbpJ2NyuwxaVKG URL=http://gitlab.example.com/
```
```plain
➜  [/Users/mac/flask-demo] git:(master) gitlab-runner register
Runtime platform                                    arch=amd64 os=darwin pid=62471 revision=21cb397c version=13.0.1
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
demo,test
Registering runner... succeeded                     runner=6-uZ1ndZ
Please enter the executor: docker+machine, docker-ssh+machine, custom, docker-ssh, parallels, virtualbox, docker, shell, ssh, kubernetes:
shell
Runner registered successfully. Feel free to start it, but if it's running already the config should be automatically reloaded!
➜  [/Users/mac] gitlab-runner verify
Runtime platform                                    arch=amd64 os=darwin pid=61635 revision=21cb397c version=13.0.1
WARNING: Running in user-mode.
WARNING: Use sudo for system-mode:
WARNING: $ sudo gitlab-runner...
Verifying runner... is alive                        runner=NkYLeMbb
Verifying runner... is alive                        runner=zTq8vB36
Verifying runner... is alive                        runner=T7QSUfHs
➜  [/Users/mac] gitlab-runner list
Runtime platform                                    arch=amd64 os=darwin pid=61640 revision=21cb397c version=13.0.1
Listing configured runners                          ConfigFile=/Users/mac/.gitlab-runner/config.toml
gitlab-ci                                           Executor=docker Token=zTq8vB36pwz52sHLFygP URL=http://gitlab.example.com/
gitlab-ci                                           Executor=docker Token=NkYLeMbbpJ2NyuwxaVKG URL=http://gitlab.example.com/
gitlab-ci                                           Executor=shell Token=T7QSUfHsnLkgGs8HFbY4 URL=http://gitlab.example.com/
```

### 2）验证runner的状态

![image.png](assets/python开发/gitlab-ci的简易入门—基于python项目的CI演示/gitlab-ci的简易入门—基于python项目的CI演示-5.png)

![image.png](assets/python开发/gitlab-ci的简易入门—基于python项目的CI演示/gitlab-ci的简易入门—基于python项目的CI演示-6.png)

![image.png](assets/python开发/gitlab-ci的简易入门—基于python项目的CI演示/gitlab-ci的简易入门—基于python项目的CI演示-7.png)

可以看到两个三个不同tags的runners已经创建好了

### 3）创建.gitlab-ci.yml

在该项目中添加.gitlab-ci.yml文件，使用pipelines进行流水线部署

```plain
➜  [/Users/mac/PycharmProjects/flask-demo] git:(master) vim .gitlab-ci.yml
stages:
    - style
    - test

pep8:
    stage: style
    script:
      - pip install tox
      - tox -e pep8
    tags:
      - python2.7

unittest-py27:
    stage: test
    script:
      - pip install tox
      - tox -e py27
    tags:
      - python2.7

unittest-py34:
    stage: test
    script:
      - pip install tox
      - tox -e py34
    tags:
      - python3.4
```

### 4）ci阶段演示

在上面我们只添加了style和test，代码风格和单元测试两个阶段，我们只需要把改文件提交到master上则会自动触发pipelines的动作中定义的两个阶段

```plain
➜  [/Users/mac/PycharmProjects/flask-demo] git:(master) ✗ git add .
➜  [/Users/mac/PycharmProjects/flask-demo] git:(master) ✗ git commit -m "add .gitlan-ci.yml"
[master 19652a3] add .gitlan-ci.yml
 1 file changed, 8 insertions(+)
➜  [/Users/mac/flask-demo] git:(master) git push -u origin master
Enumerating objects: 5, done.
Counting objects: 100% (5/5), done.
Delta compression using up to 8 threads
Compressing objects: 100% (3/3), done.
Writing objects: 100% (3/3), 334 bytes | 334.00 KiB/s, done.
Total 3 (delta 2), reused 0 (delta 0)
To http://gitlab.example.com/root/flask-demo.git
   000dd08..19652a3  master -> master
Branch 'master' set up to track remote branch 'master' from 'origin'.
```

打开gitlab-ci服务器，可以看到

打开CI/CD里面的pipelines可以看到每一个job的运行情况和日志，当我们看到日志中有如下情况时，则证明python2.7的运行环境已经准备好了

![image.png](assets/python开发/gitlab-ci的简易入门—基于python项目的CI演示/gitlab-ci的简易入门—基于python项目的CI演示-8.png)![image.png](assets/python开发/gitlab-ci的简易入门—基于python项目的CI演示/gitlab-ci的简易入门—基于python项目的CI演示-9.png)

可以在gitlab-ci服务器上看到多出来两个容器

```plain
➜  [/Users/mac/PycharmProjects/flask-demo] git:(master) docker ps |grep runner
CONTAINER ID        IMAGE                           COMMAND                  CREATED             STATUS                 PORTS                                               NAMES
1899fa281a09        68e7be49c28c                    "sh -c 'if [ -x /usr…"   4 minutes ago       Up 4 minutes                                                               runner-ztq8vb36-project-1-concurrent-0-73db69ec5150d95e-build-4
6243008edbc4        8c62b065252f                    "sh -c 'if [ -x /usr…"   4 minutes ago       Up 4 minutes                                                               runner-nkylembb-project-1-concurrent-0-441aa6544001fab6-build-4
```

等待所有阶段都完成之后可以看到passed的状态，则证明整个ci阶段是通过的

![image.png](assets/python开发/gitlab-ci的简易入门—基于python项目的CI演示/gitlab-ci的简易入门—基于python项目的CI演示-10.png)

## 4 完整的CI/CD流程

![image.png](assets/python开发/gitlab-ci的简易入门—基于python项目的CI演示/gitlab-ci的简易入门—基于python项目的CI演示-11.png)

我们在.gitlab-ci.yml中增加一个delpoy阶段来进行项目的部署，但是我们为了对master进行保护，必须要创建一个dev或者test分支，只有当分支通过了代码检查和单元测试才能合并到master进行部署，因此我们需要进行如下设置

### master分支保护

不允许任何人push

![image.png](assets/python开发/gitlab-ci的简易入门—基于python项目的CI演示/gitlab-ci的简易入门—基于python项目的CI演示-12.png)

### 分支合并要求

必须pipeline成功通过之后才能合并

![image.png](assets/python开发/gitlab-ci的简易入门—基于python项目的CI演示/gitlab-ci的简易入门—基于python项目的CI演示-13.png)

### 创建一个dev分支

![image.png](assets/python开发/gitlab-ci的简易入门—基于python项目的CI演示/gitlab-ci的简易入门—基于python项目的CI演示-14.png)

### 本地拉取分支

```plain
➜  [/Users/mac/PycharmProjects/flask-demo] git:(master) git fetch
From http://gitlab.example.com/root/flask-demo
 * [new branch]      dev        -> origin/dev
➜  [/Users/mac/PycharmProjects/flask-demo] git:(master) git checkout dev
Branch 'dev' set up to track remote branch 'dev' from 'origin'.
Switched to a new branch 'dev'
➜  [/Users/mac/PycharmProjects/flask-demo] git:(dev) ll -a
total 96
drwxr-xr-x  20 mac  staff   640B  6 14 15:53 .
drwxr-xr-x+ 69 mac  staff   2.2K  6 14 17:28 ..
-rw-r--r--   1 mac  staff   252B  6 14 15:19 .coveragerc
drwxr-xr-x  14 mac  staff   448B  6 14 17:28 .git
-rw-r--r--   1 mac  staff   1.0K  6 14 15:19 .gitignore
-rw-r--r--   1 mac  staff   379B  6 14 15:53 .gitlab-ci.yml
-rw-r--r--   1 mac  staff   196B  6 14 15:19 .travis.yml
-rw-r--r--   1 mac  staff   220B  6 14 15:19 CONTRIBUTING.md
-rw-r--r--   1 mac  staff   252B  6 14 15:19 Dockerfile
-rw-r--r--   1 mac  staff   1.1K  6 14 15:19 LICENSE
-rw-r--r--   1 mac  staff   966B  6 14 15:19 README.md
drwxr-xr-x   5 mac  staff   160B  6 14 15:19 doc
-rw-r--r--   1 mac  staff   1.0K  6 14 15:19 manage.py
drwxr-xr-x   6 mac  staff   192B  6 14 15:19 migrations
-rw-r--r--   1 mac  staff   435B  6 14 15:19 requirements.txt
drwxr-xr-x   4 mac  staff   128B  6 14 15:19 scripts
drwxr-xr-x   5 mac  staff   160B  6 14 15:19 skeleton
-rw-r--r--   1 mac  staff    65B  6 14 15:19 test-requirements.txt
drwxr-xr-x   7 mac  staff   224B  6 14 15:19 tests
-rw-r--r--   1 mac  staff   1.5K  6 14 15:19 tox.ini
```

### 创建一个私有的registry仓库

-   使用docker启动

```plain
➜  [/Users/mac/PycharmProjects/flask-demo] git:(dev) ✗ docker run -d -v ~/registry:/var/lib/registry -p 5001:5000 --restart=always --name registry registry:2
➜  [/Users/mac/flask-demo] git:(dev) ✗ docker ps |grep registry
5e97715c2f59        registry:2                      "/entrypoint.sh /etc…"   8 minutes ago       Up About a minute                      0.0.0.0:5001->5000/tcp                              registry
##添加本地host解析
➜  [/Users/mac/flask-demo] git:(dev) ✗ sudo vim /etc/hosts
##
# Host Database
#
# localhost is used to configure the loopback interface
# when the system is booting.  Do not change this entry.
##
127.0.0.1       localhost
255.255.255.255 broadcasthost
::1             localhost
192.168.0.160   gitlab.example.com registry.example.com
```

-   修改docker配置文件，然后重启

![image.png](assets/python开发/gitlab-ci的简易入门—基于python项目的CI演示/gitlab-ci的简易入门—基于python项目的CI演示-15.png)

-   测试

```plain
➜  [/Users/mac/flask-demo] git:(dev) ✗ docker tag busybox registry.example.com:5001/busybox
➜  [/Users/mac/flask-demo] git:(dev) ✗ docker push registry.example.com:5001/busybox
The push refers to repository [registry.example.com:5001/busybox]
1be74353c3d0: Pushed
latest: digest: sha256:fd4a8673d0344c3a7f427fe4440d4b8dfd4fa59cfabbd9098f9eb0cb4ba905d0 size: 527
```

### 修改dev中的.gitlab-ci.yml

```plain
➜  [/Users/mac/PycharmProjects/flask-demo] git:(dev) vim .gitlab-ci.yml
stages:
    - style
    - test
    - delpoy
    - release
    
pep8:
    stage: style
    script:
      - pip install tox
      - tox -e pep8
    tags:
      - python2.7
    except:
    	- tags
      
unittest-py27:
    stage: test
    script:
      - pip install tox
      - tox -e py27
    tags:
      - python2.7
    except:
    	- tags
      
unittest-py34:
    stage: test
    script:
      - pip install tox
      - tox -e py34
    tags:
      - python3.4
    except:
    	- tags
      
docker-deploy:
    stage: deploy
    script: 
      - docker build -t flask-demo .
      - if [ $(docker ps -aq --filter name=web )]; then docker rm -f web; fi 
      - docker run -d -p 5000:5000 --name web flask-demo
    tags: 
      - demo
    only:
      - master
```

### 提交dev分支代码

```plain
➜  [/Users/mac/flask-demo] git:(dev) ✗ git add .
➜  [/Users/mac/flask-demo] git:(dev) ✗ git commit -m "change .gitlab-ci.yml"
➜  [/Users/mac/flask-demo] git:(dev) git push origin dev
Enumerating objects: 7, done.
Counting objects: 100% (7/7), done.
Delta compression using up to 8 threads
Compressing objects: 100% (4/4), done.
Writing objects: 100% (4/4), 794 bytes | 794.00 KiB/s, done.
Total 4 (delta 2), reused 0 (delta 0)
remote:
remote: To create a merge request for dev, visit:
remote:   http://gitlab.example.com/root/flask-demo/-/merge_requests/new?merge_request%5Bsource_branch%5D=dev
remote:
To http://gitlab.example.com/root/flask-demo.git
   19652a3..ae05ae2  dev -> dev
```

## 5.CI实现版本发布

在.gitlab-ci.yml中加入release阶段，只需要给测试环境部署没有问题的master分支打上一哥版本号tags，就会重新构建镜像，然后推送到私有仓库，最终的一个交付物就是一个稳定的镜像版本，实现了版本发布

```plain
➜  [/Users/mac/PycharmProjects/flask-demo] git:(dev) vim .gitlab-ci.yml
stages:
    - style
    - test
    - deploy
    - release
    
pep8:
    stage: style
    script:
      - pip install tox
      - tox -e pep8
    tags:
      - python2.7
    except:
      - tags
      
unittest-py27:
    stage: test
    script:
      - pip install tox
      - tox -e py27
    tags:
      - python2.7
    except:
      - tags
      
unittest-py34:
    stage: test
    script:
      - pip install tox
      - tox -e py34
    tags:
      - python3.4
    except:
      - tags
      
docker-deploy:
    stage: deploy
    script: 
      - docker build -t flask-demo .
      - if [ $(docker ps -aq --filter name=web)]; then docker rm -f web; fi 
      - docker run -d -p 5000:5000 --name web flask-demo
    tags: 
      - demo
    only:
      - master
      
docker-images-release:
    stage: release
    script: 
      - docker build -t registry.example.com:5001/flask-demo:$CI_COMMIT_TAG .
      - docker push registry.example.com:5001/flask-demo:$CI_COMMIT_TAG
    tags: 
      - demo
    only:
      - tags
```