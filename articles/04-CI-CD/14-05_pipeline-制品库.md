# pipeline-制品库

> 分类：CI/CD / 第14章：Gitlab流水线
> 原文：https://www.cuiliangblog.cn/detail/section/170850834
> 来源：崔亮的博客

---

# artifacts
用于指定在作业成功或者失败时应附加到作业的文件或目录的列表。作业完成后，工件将被发送到GitLab，并可在GitLab UI中下载。

## paths
路径是相对于项目目录的，不能直接链接到项目目录之外。

将制品设置为target目录

```yaml
artifacts:
  paths:
    - target/
```

![](assets/04-CI-CD/4288af3990639dc42aa8.png)

禁用工件传递

```yaml
job:
  stage: build
  script: make build
  dependencies: []
```

您可能只想为标记的发行版创建构件，以避免用临时构建构件填充构建服务器存储。仅为标签创建工件（ default-job不会创建工件）：

```yaml
default-job:
  script:
    - mvn test -U
  except:
    - tags

release-job:
  script:
    - mvn package -U
  artifacts:
    paths:
      - target/*.war
  only:
    - tags
```

## name
通过name指令定义所创建的工件存档的名称。可以为每个档案使用唯一的名称。 artifacts:name变量可以使用任何[预定义变量](http://s0docs0gitlab0com.icopy.site/12.9/ee/ci/variables/README.html)。默认名称是artifacts，下载artifacts改为artifacts.zip。

使用当前作业的名称创建档案

```yaml
job:
  artifacts:
    name: "$CI_JOB_NAME"
    paths:
      - binaries/
```

使用内部分支或标记的名称（仅包括binaries目录）创建档案，

```yaml
job:
  artifacts:
    name: "$CI_COMMIT_REF_NAME"
    paths:
      - binaries/
```

使用当前作业的名称和当前分支或标记（仅包括二进制文件目录）创建档案

```yaml
job:
  artifacts:
    name: "$CI_JOB_NAME-$CI_COMMIT_REF_NAME"
    paths:
      - binaries/
```

要创建一个具有当前[阶段](http://s0docs0gitlab0com.icopy.site/12.9/ee/ci/yaml/README.html#stages)名称和分支名称的档案

```yaml
job:
  artifacts:
    name: "$CI_JOB_STAGE-$CI_COMMIT_REF_NAME"
    paths:
      - binaries/
```

---

## when
用于在作业失败时或尽管失败而上传工件。on_success仅在作业成功时上载工件。这是默认值。on_failure仅在作业失败时上载工件。always 上载工件，无论作业状态如何。

要仅在作业失败时上传工件：

```yaml
job:
  artifacts:
    when: on_failure
```

## expire_in
制品的有效期，从上传和存储到GitLab的时间开始算起。如果未定义过期时间，则默认为30天。

expire_in的值以秒为单位的经过时间，除非提供了单位。可解析值的示例：

```yaml
‘42’
‘3 mins 4 sec’
‘2 hrs 20 min’
‘2h20min’
‘6 mos 1 day’
‘47 yrs 6 mos and 4d’
‘3 weeks and 2 days’
```

一周后过期

```yaml
job:
  artifacts:
    expire_in: 1 week
```

# dependencies
定义要获取制品的作业列表，只能从当前阶段之前执行的阶段定义作业。定义一个空数组将跳过下载该作业的任何工件不会考虑先前作业的状态，因此，如果它失败或是未运行的手动作业，则不会发生错误。

![](assets/04-CI-CD/c94f1cc8a97e8db5865d.png)

如果设置为依赖项的作业的工件已过期或删除，那么依赖项作业将失败。

# 综合实例
```yaml
stages: # 定义作业的阶段，所有作业按stages指定的顺序执行
  - build

build: # 定义job
  stage: build # 与stages中定义的build匹配
  tags: # 指定build的runner执行
    - build
  script: # 编译打包并查看目录
    - mvn clean package
  artifacts: # 制品库配置
    paths: # 制品库路径
      - target/*.jar
    name: "$CI_JOB_NAME-$CI_COMMIT_REF_NAME" # 制品库名称
    when: on_success # 作业成功时上传
```

查看build阶段日志，打包完成后上传制品  
![](assets/04-CI-CD/a5a9abb80537ab5b3f1e.png)

查看test阶段日志，下载了build阶段的制品并使用。

![](assets/04-CI-CD/c362e2616a460cdbaa6b.png)

查看制品库信息

![](assets/04-CI-CD/ed16d0ab68ce6d76c50a.png)


