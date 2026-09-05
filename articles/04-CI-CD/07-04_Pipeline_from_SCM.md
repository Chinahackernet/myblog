# Pipeline from SCM

> 分类：CI/CD / 第7章：Jenkins流水线
> 原文：https://www.cuiliangblog.cn/detail/section/132346649
> 来源：崔亮的博客

---

前面的示例中都是直接在jenkins中编写Pipeline代码，后续随着项目的增多，不便维护。在实际生产环境中，通常会把Pipeline脚本放在项目代码中一起进行版本控制

# 项目更改
## 新增jenkinsfile文件
在项目的根目录，建立Jenkinsfile文件，内容如下

![](assets/04-CI-CD/cb2962eb98e3a1a9c94e.png)

```bash
pipeline {
    agent any

    stages {
        stage('拉取代码') {
            steps {
                echo '拉取代码'
            }
        }
        stage('编译构建') {
            steps {
                echo '编译构建'
            }
        }
        stage('项目部署') {
            steps {
                echo '项目部署'
            }
        }
    }
}
```

# jenkins配置
## 修改流水线任务配置
修改流水线定义，改为pipeline script from SCM，现在仓库地址并选择认证方式。

![](assets/04-CI-CD/b11a522ca6bd1a24b64a.png)

指定脚本路径为默认项目根目录下的Jenkinsfile

![](assets/04-CI-CD/d6c7289d925cfeedbafa.png)

## 构建测试
保存任务后，点击立即构建，此时构建状态试图如下所示，第一步变成了Checkout SCM

![](assets/04-CI-CD/7d0c63f8935de6dc71ef.png)


