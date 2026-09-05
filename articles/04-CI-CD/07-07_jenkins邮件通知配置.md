# jenkins邮件通知配置

> 分类：CI/CD / 第7章：Jenkins流水线
> 原文：https://www.cuiliangblog.cn/detail/section/133029974
> 来源：崔亮的博客

---

# 安装与配置插件
## 安装插件
在jenkins的插件管理中安装Email Extension插件

![](assets/04-CI-CD/b741f6f0aee711da9580.png)

## 配置邮件相关参数
依次点击manage jenkins——>system，找到jenkins Location项，填写系统管理员邮件地址。

![](assets/04-CI-CD/0d9219b03f46bbdab10c.png)

配置邮件服务器相关参数，然后点击通过发送测试邮件测试配置，填写收件人邮箱号。

![](assets/04-CI-CD/fda5770aa6406be234e1.png)

配置Extended E-mail Notification配置，内容如下

![](assets/04-CI-CD/758e01d7df2ecfbcff6c.png)

登录收件人邮件，看到有测试邮件。

![](assets/04-CI-CD/bb89a005da5601808da7.png)

# 自由风格任务配置
## 修改任务配置构建后操作内容
![](assets/04-CI-CD/353035bf6982790d78f5.png)

![](assets/04-CI-CD/b1ea48a5d75555ce639a.png)

## 构建测试
点击立即构建，查看收件人邮箱

![](assets/04-CI-CD/88d8aab047f981446d5c.png)

# 流水线任务配置
## 配置邮件内容
在项目根目录编写email.html，并推送至项目仓库。邮件模板如下所示：

```html
<!DOCTYPE html>    
<html>    
<head>    
<meta charset="UTF-8">    
<title>${ENV, var="JOB_NAME"}-第${BUILD_NUMBER}次构建日志</title>    
</head>    
    
<body leftmargin="8" marginwidth="0" topmargin="8" marginheight="4"    
    offset="0">    
    <table width="95%" cellpadding="0" cellspacing="0"  style="font-size: 11pt; font-family: Tahoma, Arial, Helvetica, sans-serif">    
        <tr>    
            本邮件由系统自动发出，无需回复！<br/>            
            各位同事，大家好，以下为${PROJECT_NAME }项目构建信息</br>
            <td><font color="#CC0000">构建结果 - ${BUILD_STATUS}</font></td>   
        </tr>    
        <tr>    
            <td><br />    
            <b><font color="#0B610B">构建信息</font></b>    
            <hr size="2" width="100%" align="center" /></td>    
        </tr>    
        <tr>    
            <td>    
                <ul>    
                    <li>项目名称 ： ${PROJECT_NAME}</li>    
                    <li>构建编号 ： 第${BUILD_NUMBER}次构建</li>    
                    <li>触发原因： ${CAUSE}</li>    
                    <li>构建状态： ${BUILD_STATUS}</li>    
                    <li>构建日志： <a href="${BUILD_URL}console">${BUILD_URL}console</a></li>    
                    <li>构建Url ： <a href="${BUILD_URL}">${BUILD_URL}</a></li>    
                    <li>工作目录 ： <a href="${PROJECT_URL}ws">${PROJECT_URL}ws</a></li>    
                    <li>项目Url ： <a href="${PROJECT_URL}">${PROJECT_URL}</a></li>    
                </ul>    


<h4><font color="#0B610B">失败用例</font></h4>
<hr size="2" width="100%" />
$FAILED_TESTS<br/>


<h4><font color="#0B610B">最近提交(#$SVN_REVISION)</font></h4>
<hr size="2" width="100%" />
<ul>
${CHANGES_SINCE_LAST_SUCCESS, reverse=true, format="%c", changesFormat="<li>%d [%a] %m</li>"}
</ul>
详细提交: <a href="${PROJECT_URL}changes">${PROJECT_URL}changes</a><br/>


            </td>    
        </tr>    
    </table>    
</body>    
</html>  
```

## 修改pipeline添加邮件发送
修改流水线内容，新增邮件发送

![](assets/04-CI-CD/586573c9f3e1ab469725.png)

```html
pipeline {
    agent any

    stages {
        stage('拉取代码') {
            steps {
                checkout scmGit(branches: [[name: '*/${branch}']], extensions: [], userRemoteConfigs: [[credentialsId: 'gitee-cuiliang0302', url: 'https://gitee.com/cuiliang0302/sprint_boot_demo.git']])
            }
        }
        stage('编译构建') {
            steps {
                sh 'mvn clean package'
            }
        }
        stage('部署运行') {
            steps {
                sh 'nohup java -jar target/SpringBootDemo-0.0.1-SNAPSHOT.jar &'
                sh 'sleep 10'
            }
        }
    }
    post {
        always {
            emailext(
                subject: '构建通知：${PROJECT_NAME} - Build # ${BUILD_NUMBER} - ${BUILD_STATUS}!',
                body: '${FILE,path="email.html"}',
                to: 'cuiliang0302@qq.com'
            )
        }
    }
}
```

## 构建测试
点击立即构建，查看收件人邮箱

![](assets/04-CI-CD/ecc2c434c32adbcbd959.png)


