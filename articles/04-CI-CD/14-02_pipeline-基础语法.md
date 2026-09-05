# pipeline-基础语法

> 分类：CI/CD / 第14章：Gitlab流水线
> 原文：https://www.cuiliangblog.cn/detail/section/170373752
> 来源：崔亮的博客

---

# 关键字
## <font style="color:rgb(79, 79, 79);">default全局配置</font>
在GitLab CI/CD的流水线中存在几个全局关键词，设置后，这些配置对于整条流水线生效，如stages，include，workflow，default，variables。本篇文章就来详细讲解一下default的用法，了解之后会让你编写.gitlab-ci.yml更加优雅，美观，复用性更强。

在default中你可以将一些关键词配置成全局配置。配置后这些配置项将对每个作业生效，作为初始值，开发者也可以在作业中重新定义覆盖他们。说到这里 default的作用就比较明显的，就是提取一些公共配置，配置成全局生效。

default下可以配置的关键词如下

```yaml
default:
  image: 定义所有 jobs 的默认 Docker 镜像。
  services: 定义所有 jobs 的默认服务。
  before_script: 定义在所有 jobs 之前运行的脚本。
  after_script: 定义在所有 jobs 之后运行的脚本。
  tags: 定义所有 jobs 的默认标签。
  cache: 定义所有 jobs 的默认缓存策略。
  artifacts: 定义所有 jobs 的默认构件策略。
  retry: 定义所有 jobs 的默认重试策略。
  timeout: 定义所有 jobs 的默认超时时间。
  interruptible: 定义所有 jobs 是否可以被中断。
```

## job作业
在每个项目中，我们使用名为<font style="color:rgb(232, 62, 140);">.gitlab-ci.yml</font>的YAML文件配置GitLab CI / CD 管道。

这里在pipeline中定义了两个作业，每个作业运行不同的命令。命令可以是shell或脚本。

```yaml
job1:
  script: "execute-script-for-job1"

job2:
  script: "execute-script-for-job2"
```

+ 可以定义一个或多个作业(job)。
+ 每个作业必须具有唯一的名称（不能使用关键字）。
+ 每个作业是独立执行的。
+ 每个作业至少要包含一个script。

## script脚本
```yaml
job:
  script:
    - uname -a
    - bundle exec rspec
```

注意：有时， script命令将需要用单引号或双引号引起来. 例如，包含冒号命令（ : ）需要加引号，以便被包裹的YAML解析器知道来解释整个事情作为一个字符串，而不是一个"键：值"对. 使用特殊字符时要小心： : ， { ， } ， [ ， ] ， , ， & ， * ， # ， ? ， | ， - ， < ， > ， = ! ， % ， @ .

## before_script前置脚本
用于定义一个命令，该命令在每个作业之前运行。必须是一个数组。指定的script与主脚本中指定的任何脚本串联在一起，并在单个shell中一起执行。

## after_script后置脚本
用于定义将在每个作业（包括失败的作业）之后运行的命令。这必须是一个数组。指定的脚本在新的shell中执行，与任何before_script或script脚本分开。

可以在全局定义，也可以在job中定义。在job中定义会覆盖全局。

```yaml
default:
  before_script:
    - echo "before-script!!"
  after_script:
    - echo "after-script"

variables:
  DOMAIN: example.com

stages:
  - build
  - deploy

build:
  before_script:
    - echo "before-script in job"
  stage: build
  script:
    - echo "mvn clean "
    - echo "mvn install"
  after_script:
    - echo "after script in job"

deploy:
  stage: deploy
  script:
    - echo "hello deploy"
```

after_script失败不会影响作业失败。

before_script失败导致整个作业失败，其他作业将不再执行。作业失败不会影响after_script运行。

## stages阶段
用于定义作业可以使用的阶段，并且是全局定义的。同一阶段的作业并行运行，不同阶段按顺序执行。

```yaml
stages：
  - build
  - test
  - deploy
```

这里定义了三个阶段，首先build阶段并行运行，然后test阶段并行运行，最后deploy阶段并行运行。deploy阶段运行成功后将提交状态标记为passed状态。如果任何一个阶段运行失败，最后提交状态为failed。

### 未定义stages
全局定义的stages是来自于每个job。如果job没有定义stage则默认是test阶段。如果全局未定义stages,则按顺序运行 build,test,deploy。

如果作业中定义了其他阶段，例如"codescan"则会出现错误。原因是因为除了build test deploy阶段外的其他阶段作为.pre运行（也就是作为第一个阶段运行，需要将此作业的stage指定为.pre）。

```yaml
codescan:
  stage: .pre
  script:
    - echo "codescan"
```

### 定义stages控制stage运行顺序
一个标准的yaml文件中是需要定义stages，可以帮助我们对每个stage进行排序。

```yaml
stages:
  - build
  - test
  - codescan
  - deploy
```

![](assets/04-CI-CD/87d693bc28262c71fb3d.png)

### .pre & .post
.pre始终是整个管道的第一个运行阶段，.post始终是整个管道的最后一个运行阶段。 用户定义的阶段都在两者之间运行。.pre和.post的顺序无法更改。如果管道仅包含.pre或.post阶段的作业，则不会创建管道。

![](assets/04-CI-CD/6eca25d1ff1a7140410d.png)

## stage步骤
是按JOB定义的，并且依赖于全局定义的[stages](http://s0docs0gitlab0com.icopy.site/12.9/ee/ci/yaml/README.html#stages) 。 它允许将作业分为不同的阶段，并且同一stage作业可以并行执行。

```yaml
unittest:
  stage: test
  script:
    - echo "run test"
    
interfacetest:
  stage: test
  script:
    - echo "run test"
```

![](assets/04-CI-CD/cff4881f020fd6935898.png)

可能遇到的问题： 阶段并没有并行运行。

在这里我把这两个阶段在同一个runner运行了，所以需要修改runner每次运行的作业数量。默认是1，改为10.

![](assets/04-CI-CD/efe2bf5452dcb6249367.png)

vim /etc/gitlab-runner/config.toml 更改后自动加载无需重启。

```plain
concurrent = 10
```

## variables变量
定义变量，pipeline变量、job变量、Runner变量。job变量优先级最大。

gitlab也内置了一些变量，可通过如下命令查看：

```bash
job_name:
  script:
    - export
```

## inherit继承属性
使用或禁用全局定义的环境变量（variables）或默认值(default)。

使用true、false决定是否使用，默认为true

```yaml
inherit:
  default: false
  variables: false
```

继承其中的一部分变量或默认值使用list

```yaml
inherit: # 定义允许default和variables中使用到的变量
  default:
    - parameter1
    - parameter2
  variables:
    - VARIABLE1
    - VARIABLE2
```

## tags标签
用于从允许运行该项目的所有Runner列表中选择特定的Runner,在Runner注册期间，您可以指定Runner的标签。

tags可让您使用指定了标签的runner来运行作业,此runner具有ruby和postgres标签。

```yaml
job:
  tags:
    - ruby
    - postgres
```

指定作业分别在Linux和docker平台上运行。

```yaml
linux job:
  stage:
    - build
  tags:
    - linux
  script:
    - echo Hello, %USERNAME%!

docker job:
  stage:
    - build
  tags:
    - docker
  script:
    - echo "Hello, $USER!"
```

![](assets/04-CI-CD/13ac9ea842484bf35566.png)

## allow_failure允许失败
allow_failure允许作业失败，默认值为false 。启用后，如果作业失败，该作业将在用户界面中显示橙色警告. 但是，管道的逻辑流程将认为作业成功/通过，并且不会被阻塞。 假设所有其他作业均成功，则该作业的阶段及其管道将显示相同的橙色警告。但是，关联的提交将被标记为"通过”，而不会发出警告。

```yaml
job1:
  stage: test
  script:
    - execute_script_that_will_fail
  allow_failure: true
```

![](assets/04-CI-CD/ac1ec1984b5425d6a772.png)

## when条件
on_success前面阶段中的所有作业都成功（或由于标记为allow_failure而被视为成功）时才执行作业。 这是默认值。

on_failure当前面阶段出现失败则执行。

always -执行作业，而不管先前阶段的作业状态如何，放到最后执行。总是执行。

### manual 手动
manual -手动执行作业,不会自动执行，需要由用户显式启动. 手动操作的示例用法是部署到生产环境. 可以从管道，作业，环境和部署视图开始手动操作。

此时在deploy阶段添加manual，则流水线运行到deploy阶段为锁定状态，需要手动点击按钮才能运行deploy阶段。

![](assets/04-CI-CD/09dedccf497a55b3d5d8.png)

### delayed 延迟
delayed 延迟一定时间后执行作业（在GitLab 11.14中已添加）。

有效值'5',10 seconds,30 minutes, 1 day, 1 week 。

![](assets/04-CI-CD/f2bcda515134c9237787.png)

## retry重试
配置在失败的情况下重试作业的次数。

当作业失败并配置了retry ，将再次处理该作业，直到达到retry关键字指定的次数。如果retry设置为2，并且作业在第二次运行成功（第一次重试），则不会再次重试. retry值必须是一个正整数，等于或大于0，但小于或等于2（最多两次重试，总共运行3次）.

```yaml
unittest:
  stage: test
  retry: 2
  script:
    - ech "run test"
```

![](assets/04-CI-CD/80c0dfe6d6f0905e2549.png)

默认情况下，将在所有失败情况下重试作业。为了更好地控制retry哪些失败，可以是具有以下键的哈希值：

+ max ：最大重试次数.
+ when ：重试失败的案例.

根据错误原因设置重试的次数。

```plain
always ：在发生任何故障时重试（默认）.
unknown_failure ：当失败原因未知时。
script_failure ：脚本失败时重试。
api_failure ：API失败重试。
stuck_or_timeout_failure ：作业卡住或超时时。
runner_system_failure ：运行系统发生故障。
missing_dependency_failure: 如果依赖丢失。
runner_unsupported ：Runner不受支持。
stale_schedule ：无法执行延迟的作业。
job_execution_timeout ：脚本超出了为作业设置的最大执行时间。
archived_failure ：作业已存档且无法运行。
unmet_prerequisites ：作业未能完成先决条件任务。
scheduler_failure ：调度程序未能将作业分配给运行scheduler_failure。
data_integrity_failure ：检测到结构完整性问题。
```

### 实验
<font style="color:rgb(99, 99, 99);">定义当出现脚本错误重试两次，也就是会运行三次。</font>

```yaml
unittest:
  stage: test
  tags:
    - build
  only:
    - master
  script:
    - ech "run test"
  retry:
    max: 2
    when:
      - script_failure
```

<font style="color:rgb(99, 99, 99);">效果</font>

![](assets/04-CI-CD/7de744c5221a898ad93d.png)

## timeout超时
特定作业配置超时，作业级别的超时可以超过[项目级别的超时，](http://s0docs0gitlab0com.icopy.site/12.9/ee/ci/pipelines/settings.html#timeout)但不能超过Runner特定的超时。

```yaml
build:
  script: build.sh
  timeout: 3 hours 30 minutes

test:
  script: rspec
  timeout: 3h 30m
```

### 项目设置流水线超时时间
超时定义了作业可以运行的最长时间（以分钟为单位）。 这可以在项目的**“设置">” CI / CD">"常规管道"设置下进行配置** 。 默认值为60分钟。

![](assets/04-CI-CD/a4ea05311e6f1d413e34.png)

### runner超时时间
此类超时（如果小于[项目定义的超时](http://s0docs0gitlab0com.icopy.site/12.9/ee/ci/pipelines/settings.html#timeout) ）将具有优先权。此功能可用于通过设置大超时（例如一个星期）来防止Shared Runner被项目占用。未配置时，Runner将不会覆盖项目超时。

![](assets/04-CI-CD/c972fec0f7f046144935.png)

### 此功能如何工作
示例1-运行程序超时大于项目超时

runner超时设置为24小时，项目的CI / CD超时设置为2小时。该工作将在2小时后超时。

示例2-未配置运行程序超时

runner不设置超时时间，项目的CI / CD超时设置为2小时。该工作将在2小时后超时。

示例3-运行程序超时小于项目超时

runner超时设置为30分钟，项目的CI / CD超时设置为2小时。工作在30分钟后将超时

## parallel并行数
配置要并行运行的作业实例数,此值必须大于或等于2并且小于或等于50。

这将创建N个并行运行的同一作业实例. 它们从job_name 1/N到job_name N/N依次命名。

```yaml
codescan:
  stage: codescan
  tags:
    - build
  only:
    - master
  script:
    - echo "codescan"
    - sleep 5;
  parallel: 5
```

![](assets/04-CI-CD/8030b39db1b531a685cd.png)

## interruptible 允许中断
用于标记某个 job 是否可以被中断的关键字。这个功能特别有用，当你希望在推送新的代码时，中断当前正在运行的旧的 pipeline，从而避免浪费资源。设置 interruptible: true 允许 GitLab 在新 pipeline 触发时中断旧的 pipeline 中正在运行的 job。

# 综合案例
## 案例1
job+script+before_script+after_script+stages+.pre+.post+stage+variables

```yaml
before_script: # 每个job执行前先执行全局定义的before_script，如果失败会导致job不再执行
  - echo "before-script!!"

variables: # 定义变量
  DOMAIN: example.com
  
stages: # 定义作业的阶段，所有作业按stages指定的顺序执行
  - build
  - test
  - codescan
  - deploy

begin: # 定义名为begin的job
  stage: .pre # .pre表示整个管道第一个运行阶段
  script: # 每个job必须至少含一个script
    - echo "begin cicd"

build: # 定义job
  before_script: # 可以指定job单独执行before_script，会覆盖全局定义的before_script
    - echo "before-script in job"
  stage: build # 与stages中定义的build匹配
  script:
    - echo "mvn clean "
    - echo "mvn install"
    - echo "$DOMAIN" # 使用变量
  after_script: # 可以指定job单独执行after_script，会覆盖全局定义的after_script
    - echo "after script in buildjob"

unittest1: # 定义job
  stage: test # unittest1和unittest2都是test阶段，则会并行执行这两个job
  script:
    - echo "run test1"


unittest2: # 定义job
  stage: test
  script:
    - echo "run test2"

deploy: # 定义job
  stage: deploy
  script:
    - echo "hello deploy"
    - sleep 2;
  
codescan: # 定义job
  stage: codescan
  script:
    - echo "codescan"
    - sleep 5;

end: # 定义job
  stage: .post # .post表示整个管道最后一个运行阶段
  script:
    - echo "end cicd"

after_script: # 每个job执行完成后执行全局定义的after_script，作业失败不会影响其他job执行
  - echo "after-script"
  - ech
```

实验效果

![](assets/04-CI-CD/239d51b5499f2ad511d0.png)

可能遇到的问题： pipeline卡主,为降低复杂性目前没有学习tags，所以流水线是在共享的runner中运行的。需要设置共享的runner运行没有tag的作业。

![](assets/04-CI-CD/055be64d78c04d782cfd.png)

## 案例2
tags+allow_failure+when

```yaml
stages: # 定义作业的阶段，所有作业按stages指定的顺序执行
  - build
  - test
  - codescan
  - deploy

build: # 定义job
  stage: build # 与stages中定义的build匹配
  script:
    - echo "mvn clean "

unittest1: # 定义job
  stage: test # unittest1和unittest2都是test阶段，则会并行执行这两个job
  tags: # 指定在含有tags为linux的runner上执行该job
    - linux
  script:
    - echo1 "run test1 for linux"
  allow_failure: true # 允许job执行失败，如果job失败，会有警告，不影响其他作业执行。


unittest2: # 定义job
  stage: test
  tags: # 指定在含有tags为docker的runner上执行该job
    - docker
  script:
    - echo "run test2 for docker"

deploy: # 定义job
  stage: deploy
  script:
    - echo "hello deploy"
    - sleep 2;
  when: manual # 手动执行该job，需要手动点击按钮才能运行deploy阶段
  
codescan: # 定义job
  stage: codescan
  script:
    - echo "codescan"
    - sleep 5;
  when: delayed # 延迟执行该job
  start_in: '10' # 有效值'5',10 seconds,30 minutes, 1 day, 1 week
```

执行结果

![](assets/04-CI-CD/3d14f1b4c4a9661bd49b.png)

## 案例3
retry+timeout+parallel

```yaml
stages: # 定义作业的阶段，所有作业按stages指定的顺序执行
  - build
  - codescan
  - deploy

build: # 定义job
  stage: build # 与stages中定义的build匹配
  script:
    - echo "mvn clean "

deploy: # 定义job
  stage: deploy
  script:
    - echo2 "hello deploy"
    - sleep 2;
  retry: # 失败重试
    max: 2 # 最多重试2次
    when:
      - script_failure # 当脚本执行失败时执行
  timeout: 1m # 定义作业超时时间1分钟
  
codescan: # 定义job
  stage: codescan
  script:
    - echo "codescan"
    - sleep 5;
  parallel: 5 # 配置要并行运行的作业实例数为5
```

执行结果

![](assets/04-CI-CD/e4241c3d87b3350c1942.png)

deploy阶段失败1次，重试2次，共3次记录。

![](assets/04-CI-CD/d0f85d52dac44a12e46c.png)

## 案例4
default+variables+inherit

```yaml
variables: # 定义全局变量
  DOMAIN: example.com
  HOST: test

default: # 定义了一个默认的参数
  tags: # 如果 job 里没有 tages，就使用这个 tags
    - build
  after_script: # 如果 job 里没有 before_script，就使用这个 tags
    - echo "default after_script"
  before_script: # 如果 job 里没有 before_script，就使用这个 tags
    - echo "default before_script"

stages:
  - build
  - test

build:
  stage: build
  before_script:
    - echo "job before_script"
  script:
    - echo "job script"
  
test:
  stage: test
  tags:
    - build
  script:
    - echo "after_script for test ${DOMAIN}, ${HOST}"
  inherit:
    default: false # 不使用定义的 default，全部
    variables:
      - DOMAIN # 只使用指定变量
```

build阶段日志如下，观察可知使用了default参数：

![](assets/04-CI-CD/ab2ba5943c6a6d8b7bf8.png)

test阶段日志如下，观察可知未使用default参数，HOST变量也未生效：

![](assets/04-CI-CD/47e9f3de159a2227dced.png)


