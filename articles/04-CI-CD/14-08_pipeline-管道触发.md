# pipeline-管道触发

> 分类：CI/CD / 第14章：Gitlab流水线
> 原文：https://www.cuiliangblog.cn/detail/section/170855955
> 来源：崔亮的博客

---

# trigger 管道触发
当GitLab从trigger定义创建的作业启动时，将创建一个下游管道。允许创建多项目管道和子管道。将trigger与when:manual一起使用会导致错误。

多项目管道： 跨多个项目设置流水线，以便一个项目中的管道可以触发另一个项目中的管道，通常在微服务中使用。

父子管道: 在同一项目中管道可以触发一组同时运行的子管道,子管道仍然按照阶段顺序执行其每个作业，但是可以自由地继续执行各个阶段，而不必等待父管道中无关的作业完成。

# 多项目管道
使用案例：一但上游管道develop/sprint_boot_demo执行完成后，触发develop/vue3_vite_element-plus项目master流水线。

需要注意的是，创建上游管道的用户需要具有对下游项目的访问权限。如果发现下游项目用户没有访问权限以在其中创建管道，则staging作业将被标记为失败。

上游管道develop/sprint_boot_demo项目pipeline内容如下：

```yaml
variables:
  DOMAIN: example.com

stages:
  - build
  - deploy
 
build:
  stage: build
  script:
    - echo "mvn clean "
    - echo "mvn install"

deploy:
  stage: deploy
  script:
    - echo "hello deploy"

staging:
  stage: deploy
  trigger: 
    project: develop/vue3_vite_element-plus # 下游项目的完整路径
    branch: master # 由指定的项目分支的名称
    strategy: depend # 将自身状态从触发的管道合并到源作业。
```

下游管道develop/vue3_vite_element-plus项目pipeline内容如下：

```yaml
stages:
  - deploy
  
deployjob:
  stage: deploy
  script:
    - echo 'deploy'
    - echo "Hello, $DOMAIN"
```

使用variables关键字将变量传递到下游管道。 全局变量也会传递给下游项目。上游管道优先于下游管道。如果在上游和下游项目中定义了两个具有相同名称的变量，则在上游项目中定义的变量将优先。

默认情况下，一旦创建下游管道，trigger作业就会以success状态完成。

在上游项目中查看管道信息

![](assets/04-CI-CD/51b76d2165dfaa3acd63.png)

查看下游项目打印变量信息

![](assets/04-CI-CD/2fbc735d2017466111e6.png)

# 父子管道
创建子管道ci/part1.yml，内容如下：

```yaml
stages:
  - deploy

child-deploy:
  stage: deploy
  script: 
    - echo "Hello, $DOMAIN"
    - sleep 10
```

在父管道触发子管道

```yaml
variables:
  DOMAIN: example.com
  
stages:
  - build
  - deploy
 
build:
  stage: build
  script:
    - echo "mvn clean "
    
staging2:
  stage: deploy
  trigger: 
    include: 'ci/part1.yml' # 引入同一项目下的子管道
    strategy: depend # 将自身状态从触发的管道合并到源作业。
```

此时流水线任务如下图所示：

![](assets/04-CI-CD/97a099469fafbf383e88.png)


