# jenkins构建触发器

> 分类：CI/CD / 第7章：Jenkins流水线
> 原文：https://www.cuiliangblog.cn/detail/section/133017128
> 来源：崔亮的博客

---

# 触发器简介
之前的案例中我们都是在web页面点击立即构建，手动触发Build，通常在实际生产环境中，我们会使用触发器自动构建，Jenkins内置4种构建触发器：

+ 触发远程构建
+ 其他工程构建后触发（Build after other projects are build）
+ 定时构建（Build periodically）
+ 轮询SCM（Poll SCM）

# 触发远程构建
## 配置构建触发器
修改构建任务配置，在构建触发器选项中勾选触发远程构建，并指定token。

![](assets/04-CI-CD/17c6904c874e26ba2e7d.png)

## 构建测试
请求url地址http://jenkins服务器ip:jenkins服务端口/job/任务名称/build?token=设置的令牌，此处请求的地址为[http://192.168.8.135:8080/job/pipeline_demo/build?token=123456](http://192.168.8.135:8080/job/pipeline_demo/build?token=123456)

查看构建信息，输出从远程构建内容。

![](assets/04-CI-CD/f0ff4f65722c879bde11.png)

# 其他工程构建后触发
## 创建前置构建任务
此处以之前配置的自由风格构建任务gitee-demo为例

![](assets/04-CI-CD/41683c80c4d6a8a0c9d9.png)

## 修改后置构建任务
修改pipeline_demo任务的构建触发器配置，勾选build after other projects are built，填写前置构建任务名称。

![](assets/04-CI-CD/1c38873430ad68daa234.png)

## 构建测试
进入gitee-demo前置任务，点击立即构建。

![](assets/04-CI-CD/618456f0c85909681043.png)

点击查看后置任务pipeline_demo任务构建信息，显示由上游任务触发构建。

![](assets/04-CI-CD/5d771a34da720c063c09.png)

# 定时构建
## 配置构建触发器
修改构建任务构建触发器配置，改为Build periodically，填写crontab表达式，此处以每分钟构建一次为例

![](assets/04-CI-CD/d5983042adb54d775eef.png)

## 构建测试
等待一分钟后，查看构建任务信息，触发了一次自动构建，查看构建信息，输出<font style="color:rgb(20, 20, 31);">Started by timer</font>

![](assets/04-CI-CD/6dfac26f9153660ba32e.png)

# 轮询SCM构建
轮询SCM，是指定时扫描本地代码仓库的代码是否有变更，如果代码有变更就触发项目构建。需要注意的是，Jenkins会定时扫描本地整个项目的代码，增大系统的开销，不建议高频使用。

## 配置构建触发器
依旧配置每分钟查询一次SCM信息，判断是否需要触发构建。

![](assets/04-CI-CD/b7313eba518fa56d19c7.png)

## 构建测试
修改git仓库代码并提交

![](assets/04-CI-CD/d726a9229c7bfdb79db9.png)

查看jenkins构建任务信息，触发SCM构建

![](assets/04-CI-CD/da7a82a7c44fac753e88.png)


