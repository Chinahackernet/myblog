# pipeline-条件分支

> 分类：CI/CD / 第14章：Gitlab流水线
> 原文：https://www.cuiliangblog.cn/detail/section/170615327
> 来源：崔亮的博客

---

# rules
rules允许按顺序评估单个规则对象的列表，直到一个匹配并为作业动态提供属性. 请注意， rules不能only/except与only/except组合使用。

可用的规则条款包括：

+ [if](http://s0docs0gitlab0com.icopy.site/12.9/ee/ci/yaml/README.html#rulesif) （类似于[only:variables](http://s0docs0gitlab0com.icopy.site/12.9/ee/ci/yaml/README.html#onlyvariablesexceptvariables) ）
+ [changes](http://s0docs0gitlab0com.icopy.site/12.9/ee/ci/yaml/README.html#ruleschanges) （ [only:changes](http://s0docs0gitlab0com.icopy.site/12.9/ee/ci/yaml/README.html#onlychangesexceptchanges)相同）
+ [exists](http://s0docs0gitlab0com.icopy.site/12.9/ee/ci/yaml/README.html#rulesexists)

## rules:if
如果DOMAIN的值匹配，则需要手动运行。不匹配on_success。 条件判断从上到下，匹配即停止。多条件匹配可以使用&& ||

```yaml
variables:
  DOMAIN: example.com

codescan:
  stage: codescan
  tags:
    - build
  script:
    - echo "codescan"
    - sleep 5;
  #parallel: 5
  rules:
    - if: '$DOMAIN == "example.com"'
      when: manual
    - when: on_success
```

### rules:changes
接受文件路径数组。 如果提交中Jenkinsfile文件发生的变化则为true。

```yaml
codescan:
  stage: codescan
  tags:
    - build
  script:
    - echo "codescan"
    - sleep 5;
  #parallel: 5
  rules:
    - changes:
      - Jenkinsfile
      when: manual
    - if: '$DOMAIN == "example.com"'
      when: on_success
    - when: on_success
```

## rules:exists
接受文件路径数组。当仓库中存在指定的文件时操作。

```yaml
codescan:
  stage: codescan
  tags:
    - build
  script:
    - echo "codescan"
    - sleep 5;
  #parallel: 5
  rules:
    - exists:
      - Jenkinsfile
      when: manual 
    - changes:
      - Jenkinsfile
      when: on_success
    - if: '$DOMAIN == "example.com"'
      when: on_success
    - when: on_success
```

## rules:allow_failure
使用[allow_failure: true](http://s0docs0gitlab0com.icopy.site/12.9/ee/ci/yaml/README.html#allow_failure) rules:在不停止管道本身的情况下允许作业失败或手动作业等待操作.

```yaml
job:
  script: "echo Hello, Rules!"
  rules:
    - if: '$CI_MERGE_REQUEST_TARGET_BRANCH_NAME == "master"'
      when: manual
      allow_failure: true
```

在此示例中，如果第一个规则匹配，则作业将具有以下when: manual和allow_failure: true。

# workflow:rules
顶级workflow:关键字适用于整个管道，并将确定是否创建管道。[when](http://s0docs0gitlab0com.icopy.site/12.9/ee/ci/yaml/README.html#when) ：可以设置为always或never . 如果未提供，则默认值always。

```yaml
variables:
  DOMAIN: example.com

workflow:
  rules:
    - if: '$DOMAIN == "example.com"'
    - when: always
```

# only/except
使用only / except 关键字来控制何时创建作业

+ only定义哪些分支和标签的git项目会被job执行
+ except定义哪些分支和标签的git项目不会被job执行

## 示例
只有在feature-开头的分支提交代码才会执行job1；只有在master分支提交代码，才会执行job2。

```yaml
job1:
 stage: restore
 script:
  - echo 'job1 script'
 only: 
  - /^feature-.*$/
job2:
 stage: compile
 script:
  - echo 'job2 script'
 only: 
  - master
```

# 综合案例
```yaml
variables: # 定义变量
  DOMAIN: example.com

stages: # 定义作业的阶段，所有作业按stages指定的顺序执行
  - build
  - deploy

workflow:
  rules: # 如果DOMAIN值为example.com，则创建该管道
    - if: '$DOMAIN == "example.com"'
    - when: always

build: # 定义job
  stage: build # 与stages中定义的build匹配
  script:
    - echo "mvn clean"
  rules: # if条件匹配
    - if: '$DOMAIN == "example.com"' # 如果DOMAIN值为example.com，则手动执行该job
      when: manual
    - if: '$DOMAIN == "example.cn"' # 如果DOMAIN值为example.cn，则延迟5秒执行该job
      when: delayed
      start_in: '10'
    - when: on_success # 如果上述条件都不满足，则认为该任务执行成功

deploy: # 定义job
  stage: deploy
  script:
    - echo "hello deploy"
    - sleep 2;
  rules: 
    - exists: # 文件存在匹配
      - Dockerfile
      when: on_success # 如果文件存在，则成功
    - changes: # 文件变化匹配
      - Dockerfile # Dockerfile文件内容发生变化
      when: manual
      allow_failure: true # 允许失败，不影响job
    - when: on_failure # 如果上述条件不满足，则该任务执行失败
```

执行结果

![](assets/04-CI-CD/9690145a4feca1b04d66.png)


