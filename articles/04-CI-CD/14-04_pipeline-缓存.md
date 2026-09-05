# pipeline-缓存

> 分类：CI/CD / 第14章：Gitlab流水线
> 原文：https://www.cuiliangblog.cn/detail/section/170564184
> 来源：崔亮的博客

---

# cache 缓存
用来指定需要在job之间缓存的文件或目录。只能使用该项目工作空间内的路径。不要使用缓存在阶段之间传递工件，因为缓存旨在存储编译项目所需的运行时依赖项。

如果在job范围之外定义了cache ，则意味着它是全局设置，所有job都将使用该定义。如果未全局定义或未按job定义则禁用该功能。

![](assets/04-CI-CD/7ea2a6ba1f7cf1cddc56.png)

## cache:path目录
使用paths指令选择要缓存的文件或目录，路径是相对于项目目录，不能直接链接到项目目录之外。

$CI_PROJECT_DIR 项目目录

在job build中定义缓存，将会缓存target目录下的所有.jar文件。

```yaml
build:
  script: test
  cache:
    paths:
      - target/*.jar
```

当在全局定义了cache:paths会被job中覆盖。以下实例将缓存binaries目录。

```yaml
default:
  cache:
    paths:
      - my/files

build:
  script: echo "hello"
  cache:
    key: build
    paths:
      - target/
```

由于缓存是在job之间共享的，如果不同的job使用不同的路径就出现了缓存覆盖的问题。如何让不同的job缓存不同的cache呢？设置不同的cache:key。

## cache:key 缓存标记
为缓存做个标记，可以配置job、分支为key来实现分支、作业特定的缓存。为不同 job 定义了不同的 cache:key 时， 会为每个 job 分配一个独立的 cache。cache:key变量可以使用任何预定义变量，默认default ，从GitLab 9.0开始，默认情况下所有内容都在管道和作业之间共享。

按照分支设置缓存

```yaml
cache:
  key: ${CI_COMMIT_REF_SLUG}
```

files： 文件发生变化自动重新生成缓存(files最多指定两个文件)，提交的时候检查指定的文件。

根据指定的文件生成密钥计算SHA校验和，如果文件未改变值为default。

```yaml
cache:
  key:
    files:
      - Gemfile.lock
      - package.json
  paths:
    - vendor/ruby
    - node_modules
```

prefix: 允许给定prefix的值与指定文件生成的秘钥组合。

在这里定义了全局的cache，如果文件发生变化则值为 rspec-xxx111111111222222 ，未发生变化为rspec-default。

```yaml
cache:
  key:
    files:
      - Gemfile.lock
    prefix: ${CI_JOB_NAME}
  paths:
    - vendor/ruby

rspec:
  script:
    - bundle exec rspec
```

例如，添加$CI_JOB_NAME prefix将使密钥看起来像： rspec-feef9576d21ee9b6a32e30c5c79d0a0ceb68d1e5 ，并且作业缓存在不同分支之间共享，如果分支更改了Gemfile.lock ，则该分支将为cache:key:files具有新的SHA校验和. 将生成一个新的缓存密钥，并为该密钥创建一个新的缓存. 如果Gemfile.lock未发生变化 ，则将前缀添加default ，因此示例中的键为rspec-default 。

## cache:policy 策略
默认：在执行开始时下载文件，并在结束时重新上传文件。称为pull-push缓存策略.

policy: pull 跳过上传步骤，只拉取缓存

policy: push 跳过下载步骤，不写入缓存

```yaml
stages:
  - setup
  - test

prepare:
  stage: setup
  cache:
    key: gems
    paths:
      - vendor/bundle
  script:
    - bundle install --deployment

rspec:
  stage: test
  cache:
    key: gems
    paths:
      - vendor/bundle
    policy: pull
  script:
    - bundle exec rspec ...
```

# 实验案例
## 全局缓存
```yaml
default:
  cache: 
    paths: # 定义全局缓存路径
     - target/

stages: # 定义作业的阶段，所有作业按stages指定的顺序执行
  - build
  - test
  - deploy

build: # 定义job
  stage: build # 与stages中定义的build匹配
  tags: # 指定build的runner执行
    - build
  script: # 编译打包并查看目录
    - mvn clean package
    - ls target

unittest: # 定义job
  stage: test
  tags: # 指定build的runner执行
    - build
  script: # target目录新增文件并查看
    - echo 'test' >> target/a.txt
    - ls target

deploy: # 定义job
  stage: deploy
  tags: # 指定build的runner执行
    - build
  script: # 查看target目录
    - ls target
```

### Pipeline日志分析
build作业运行时会对项目代码打包，然后生成target目录。作业结束创建缓存。

![](assets/04-CI-CD/ada28e7a0883beded5b4.png)

开始第二个作业test，此时会把当前目录中的target目录删除掉（因为做了git 对比）。然后获取到第一个作业生成的缓存target目录。

![](assets/04-CI-CD/b6bfe214f68e46209623.png)

开始第三个作业，同样先删除了target目录，然后获取了第二个作业的缓存。最后生成了当前的缓存。

![](assets/04-CI-CD/eba23cfec121dfce10c2.png)

当我们再次重新运行流水线时，查看build日志发现，使用的是上一次流水线的缓存。

![](assets/04-CI-CD/a6b12a904293813962a5.png)

结论： 全局缓存生效于未在作业中定义缓存的所有作业，这种情况如果每个作业都对缓存目录做了更改，会出现缓存被覆盖的场景。

## 配置运行时不下载缓存
例如build阶段我们需要生成新的target目录内容，可以优化设置job运行时只拉取缓存。

```yaml
default:
  cache: 
    paths: # 定义全局缓存路径
     - target/

stages: # 定义作业的阶段，所有作业按stages指定的顺序执行
  - build
  - test
  - deploy

build: # 定义job
  stage: build # 与stages中定义的build匹配
  tags: # 指定build的runner执行
    - build
  script: # 编译打包并查看目录
    - mvn clean package
    - ls target
  cache:
    policy: pull  #只拉取缓存

unittest: # 定义job
  stage: test
  tags: # 指定build的runner执行
    - build
  script: # target目录新增文件并查看
    - echo 'test' >> target/a.txt
    - ls target

deploy: # 定义job
  stage: deploy
  tags: # 指定build的runner执行
    - build
  script: # 查看target目录
    - ls target
```

查看build阶段日志，不再使用上一次流水线的缓存

![](assets/04-CI-CD/8c6644cf6b0a412500ef.png)

## 

