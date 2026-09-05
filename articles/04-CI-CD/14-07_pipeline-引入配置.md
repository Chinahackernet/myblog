# pipeline-引入配置

> 分类：CI/CD / 第14章：Gitlab流水线
> 原文：https://www.cuiliangblog.cn/detail/section/170855849
> 来源：崔亮的博客

---

# include引入
可以允许引入外部YAML文件，文件具有扩展名.yml或.yaml 。使用合并功能可以自定义和覆盖包含本地定义的CI / CD配置。相同的job会合并，参数值以源文件为准。

## local
引入同一存储库中的文件，使用相对于根目录的完整路径进行引用，与配置文件在同一分支上使用。

在仓库新增一个ci/localci.yml: 定义一个作业用于发布。

![](assets/04-CI-CD/2b7cf1e5c7f8a72d87c8.png)

yml文件内容如下：

```yaml
stages:
  - deploy
  
deployjob:
  stage: deploy
  script:
    - echo 'deploy'
```

.gitlab-ci.yml 引入本地的CI文件’ci/localci.yml’。

```yaml
include: # 引入仓库ci目录下的localci文件
  local: 'ci/localci.yml' 
  
stages:
  - build
  - deploy
  
buildjob:
  stage: build
  script: 
    - echo 'deploy'
```

流水线执行效果如下：

![](assets/04-CI-CD/58ebb28b3956ef018c4f.png)

## file
另一个项目创建.gitlab-ci.yml文件。

![](assets/04-CI-CD/463eed38ca20cba1bfec.png)

文件内容如下：

```yaml
stages:
  - deploy

deployjob:
  stage: deploy
  script:
    - echo "deploy"
```

引入另一个项目的流水线

```yaml
include: # 引入另一个项目master分支下的流水线文件
  - project: develop/vue3_vite_element-plus
    ref: master
    file: '.gitlab-ci.yml' 
  
stages:
  - build
  - deploy
  
buildjob:
  stage: build
  script: 
    - echo 'deploy'
```

流水线执行效果如下：

![](assets/04-CI-CD/add0a78c8748afd25bde.png)

## template
只能使用官方提供的模板 [https://gitlab.com/gitlab-org/gitlab/tree/master/lib/gitlab/ci/templates](https://gitlab.com/gitlab-org/gitlab/tree/master/lib/gitlab/ci/templates)

```plain
include:
  - template: Auto-DevOps.gitlab-ci.yml
```

## remote
用于通过HTTP / HTTPS包含来自其他位置的文件，并使用完整URL进行引用. 远程文件必须可以通过简单的GET请求公开访问，因为不支持远程URL中的身份验证架构。

```plain
include:
  - remote: 'https://gitlab.com/awesome-project/raw/master/.gitlab-ci-template.yml'
```

# extends继承作业
继承模板作业，相同的配置将会覆盖，不同的配置将会继承。

```yaml
stages:
  - test

template-test: # 定义test模板
  stage: test
  script: 
  - echo "mvn test"

testjob:
  extends: template-test # 继承test模板
  script: # 覆盖script
  - echo "mvn clean test"
```

执行效果

![](assets/04-CI-CD/4c3a8217934541e376ba.png)

继承后的流水线内容如下：

```yaml
stages:
  - test

testjob:
  stage: test
  script:
  - echo "mvn clean test"
```

# include与extends组合使用
引入其他文件并覆盖相关值。

新建localci.yml文件，内容如下

```yaml
deployjob:
  stage: deploy
  script:
    - echo 'deploy'

template-build:
  stage: build
  script: 
    - echo "build"
```

```yaml
include: # 引入localci.yml文件
  local: 'ci/localci.yml'

stages: # 定义步骤
  - build 
  - deploy

testjob:
  extends: template-build # 继承template-build并覆盖值
  script: echo "mvn clean test"
```


