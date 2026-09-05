在使用 Jenkins 驱动整个 CI/CD 的流程时，代码提交触发任务自动化构建是一个很重要的步骤。这篇文章主要介绍如何在 Jenkins 的多分支流水线（Multibranch Pipeline）中使用 [Generic Webhook Trigger](https://plugins.jenkins.io/generic-webhook-trigger/) 触发任务的自动化构建。

## 需求

  

我们项目的源代码是托管在本地的 Gitlab 服务上，Git Flow 也是相对比较简单的。目前分为 `Feature`、`Sprint` 和 `Master` 分支。平时的开发是在 `Feature` 分支下，当 `Feature` 分支代码合并到 `Sprint` 分支的时候，需要能做到代码构建并发布到本地测试环境，当 `Sprint` 分支合并到 `Master` 的时候，需要能做到代码发布到线上测试环境。

  

对于多分支流水线的问题是，每次触发的可能是所有的分支构建，这显然是不符合要求的。因此，我们需要的是 webhook 可以按分支触发构建，同时根据不同的分支完成不同的构建脚本。这里面涉及到两个需求：

  

1.  webhook 按分支触发  
    
2.  不同分支的构建脚本差异化处理  
    

## webhook 按分支触发

  

首先，我们完成每次 `feature` 和 `sprint` 分支有代码合并进去的时候，触发任务构建。这里需要借助到`Generic Webhook Trigger` 插件。

### Generic Webhook Trigger 插件

  

我们项目使用的 `Jenkinsfile` 是声明式脚本，在 `Generic Webhook Trigger` 的文档中，声明式脚本是这样使用的：

  

```groovy
pipeline {
  agent any
  triggers {
    GenericTrigger(
     genericVariables: [
      [key: 'ref', value: '$.ref']
     ],
     causeString: 'Triggered on $ref',
     token: 'abc123',
     printContributedVariables: true,
     printPostContent: true,
     silentResponse: false,
     regexpFilterText: '$ref',
     regexpFilterExpression: 'refs/heads/' + BRANCH_NAME
    )
  }
  stages {
    stage('Some step') {
      steps {
        sh "echo $ref"
      }
    }
  }
}
```

  

  

文档中没有对这些配置项做具体的说明，对使用者造成了一定的门槛。在实践中，发现有几个我们需要比较关注的配置项。

  

`**token**`

  

`Generic Webhook Trigger` 的触发 URL 是固定的：`http://localhost:8080/jenkins/generic-webhook-trigger/invoke`。通过 `token` 我们可以区分不同 job 的 trigger，同时该令牌还允许直接调用，而无需任何其他身份验证凭据。

  

也就是说，上面的 `token` 配置为 `abc123` ，我们可以在浏览器中通过访问`http://localhost:8080/jenkins/generic-webhook-trigger/invoke?token=abc123` 触发该任务。

  

`**genericVariables**`

  

这个配置项的写法基本是固定的，从 `JSONPath` 中取出 `$.ref` 赋值给 `ref` 变量，我们就可以在脚本中使用 `ref` 变量获取到 `Git` 的 `ref` 值。当然，我们也可以获取更多的内容复制给不同的变量，这个就看具体的需求了。

  

`**regexpFilterExpression**`

  

顾名思义，这是一个使用正则表达式的过滤器，也是我们做分支触发构建的关键因素。当满足该正则表达式的时候，`trigger` 才会触发构建。

  

这里有一个小坑，就是 `\` 反斜杠在 Jenkins 中是用来转义字符的。举个例子，我们需要匹配 `sprint48` 这个分支，我们的正则表达式是这样的：

  

```plain
regexpFilterExpression: '^refs/heads/(features/sprint\d*)$'
```

  

  

这样写会报错的，因为 `\` 直接转义了，我们需要再加一个 `\` ，如下：

  

```plain
regexpFilterExpression: '^refs/heads/(features/sprint\\d*)$'
```

  

  

`**regexpFilterText**`

  

这个字段跟上面的 `regexpFilterExpression` 是成对使用的，正则表达式过滤的就是该字段的内容。我们前面把 `Git` 的 `ref` 值赋值给了 `ref` 变量，这里就可以直接通过 `$ref` 来使用 `ref` 变量了。

  

```plain
regexpFilterText: '$ref'
```

  

  

### Trigger 配置

  

通过前面对 `Generic Webhook Trigger` 插件的了解，我们可以针对自己的项目进行配置了。

  

`token` 建议以项目名称开头，后面加上一定规则的哈希字符串，保证在 `Jenkins` 中 `token` 不会出现重复。

  

`regexpFilterExpression` 我们的过滤规则是只接受 `sprint` 和 `master` 分支

  

```groovy
triggers{
    GenericTrigger(
        genericVariables: [
          [key: 'ref', value: '$.ref']
         ],
        causeString: 'Triggered on $ref',
        token: 'leangoo-b73b246d4bc9c5c9',
        printContributedVariables: true,
        printPostContent: true,
        silentResponse: false,
        regexpFilterText: '$ref',
        regexpFilterExpression: '^refs/heads/(features/sprint\\d*|master)$'
    )
}
```

  

  

到这里为止，Jenkins 这部分的配置已经全部完成了。接下来就是配置 `Gitlab` 的 `webhook` 了。

### Gitlab webhook 配置

  

**1\. 进入项目的 `**Settings -> Integrations**` 界面，新增一个 `**webhook**`**

  

`url` 就是 `Jenkins` 的 `trigger` 地址，触发事件这里我们只勾选 `Push events` ，不需要 `SSL` 验证的话可以取消掉。

  

![](assets/devops与交付/使用_Generic_Webhook_Trigger_触发_Jenkins_多分支流水线自动化构建/使用_Generic_Webhook_Trigger_触发_Jenkins_多分支流水线自动化构建-1.png)

  

然后我们可以点击测试按钮进行测试。第一次尝试的时候，发现报 `url is blocked Requests to the local network are not allowed` 的错误，我们需要进入 `Gitlab` 的管理后台允许本地的请求。

  

**2\. 允许本地请求**

  

这一步操作需要有管理员权限。进入 `Admin Area` ，依次选择 `Settings -> Network -> Outbound requests` ，勾选 `Allow requests to the local network from hooks and services`

  

![](assets/devops与交付/使用_Generic_Webhook_Trigger_触发_Jenkins_多分支流水线自动化构建/使用_Generic_Webhook_Trigger_触发_Jenkins_多分支流水线自动化构建-2.png)

  

再次点击测试按钮，可以成功地触发 `Jenkins` 的自动化构建。我们可以 `push` 代码到不同的分支测试一下配置是否正确。

  

## 不同分支的构建脚本差异化处理

  

前面的配置做到了 `sprint` 和 `master` 分支有代码合并进来会触发自动化构建。但是对于多分支流水线，如果 `Jenkins` 检测到了分支的根目录下有 `Jenkinsfile` 文件，就会进行构建。最终导致的问题是，如果项目下有 n 个分支，每个分支都有 `Jenkinsfile` 文件，那么这 n 个分支都会构建一遍。这显然也不是我们想要的。

  

我们可以利用 `Jenkins pipeline` 的 [when](https://www.jenkins.io/doc/book/pipeline/syntax/#when) 语法来做到让不同的分支来做不同的事情。`when` 的语法示例如下：

  

```groovy
pipeline {
    agent any
    stages {
        stage('Example Build') {
            steps {
                echo 'Hello World'
            }
        }
        stage('Example Deploy') {
            when {
                branch 'production'
            }
            steps {
                echo 'Deploying'
            }
        }
    }
}
```

  

  

`when` 指令允许管道根据给定条件确定是否应执行该阶段。`when` 指令必须至少包含一个条件。如果 `when` 指令包含多个条件，则所有子条件必须返回 `true` 才能执行该阶段。

  

`when` 支持 `expression` 表达式，配合正则表达式可以构建出我们需要的条件。 比如这里，如果是`master` 或 `sprint` 分支我们就会下面的步骤。

  

```groovy
stage('build') {
            when {
                expression { BRANCH_NAME ==~ /(master|features\/sprint\d*)/ }
            }
            steps {
                sh '''
                    # 要执行的脚本
                    ...
                '''
            }
        }
```

  

触发器的配置如下：

```groovy
// 配置触发器
    triggers {
        GenericTrigger(
            genericVariables: [
                [key: 'ref', value: '$.ref'],
                [key: 'before', value: '$.before'],
                [key: 'after', value: '$.after'],
                [key: 'hook_name', value: '$.hook_name']
            ],
            causeString: 'Triggered on $ref',
            token: env.JOB_NAME,
            printContributedVariables: true,
            printPostContent: true,
            regexpFilterText: '$ref',
            regexpFilterExpression: 'refs/heads/(pre|master)',
            regexpFilterText: '$hook_name $before $after',
            regexpFilterExpression: '^push_hooks\s(?!0{40}).{40}\s(?!0{40}).{40}$'
        )
   }
```