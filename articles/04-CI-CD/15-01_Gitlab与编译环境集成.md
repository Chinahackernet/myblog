# Gitlab与编译环境集成

> 分类：CI/CD / 第15章：Gitlab工具链集成
> 原文：https://www.cuiliangblog.cn/detail/section/171824103
> 来源：崔亮的博客

---

# gitlab与maven集成
此处以rpm包部署maven为例，以下操作在gitlab-runner所在服务器执行。

maven下载地址：[https://maven.apache.org/download.cgi](https://maven.apache.org/download.cgi)

## 安装Maven
```bash
[root@client1 ~]# wget https://dlcdn.apache.org/maven/maven-3/3.9.6/binaries/apache-maven-3.9.6-bin.tar.gz
[root@client1 ~]# mkdir /usr/local/maven
[root@client1 ~]# tar -zxf apache-maven-3.9.6-bin.tar.gz -C /usr/local/maven/
[root@client1 ~]# cd /usr/local/maven/apache-maven-3.9.6/
[root@jenkins apache-maven-3.9.3]# ls
bin  boot  conf  lib  LICENSE  NOTICE  README.txt
```

## 设置maven的阿里云镜像
```bash
[root@client1 apache-maven-3.9.6]# vim conf/settings.xml
# 在159行的标签为</mirrors>前添加如下阿里云镜像
<mirror>
    <id>alimaven</id>
    <name>aliyun maven</name>
    <url>http://maven.aliyun.com/nexus/content/groups/public/</url>
    <mirrorOf>central</mirrorOf>
</mirror>
```

## 配置环境变量
```bash
[root@client1 apache-maven-3.9.6]# vim /etc/profile
# 文件末尾添加如下内容
export MAVEN_HOME=/usr/local/maven/apache-maven-3.9.6
export PATH=${MAVEN_HOME}/bin:${PATH}
[root@jenkins apache-maven-3.9.6]# source /etc/profile
[root@client1 ~]# mvn -v
Apache Maven 3.9.6 (bc0240f3c744dd6b6ec2920b3cd08dcc295161ae)
Maven home: /usr/local/maven/apache-maven-3.9.6
Java version: 17.0.7, vendor: OpenLogic, runtime: /usr/local/jdk/openlogic-openjdk-17.0.7+7-linux-x64
Default locale: zh_CN, platform encoding: UTF-8
OS name: "linux", version: "4.18.0-513.24.1.el8_9.x86_64", arch: "amd64", family: "unix"
```

## 修改runner标签
修改runner标签，新增java标签，用于构建时指定runner执行构建任务。

![](assets/04-CI-CD/18f066129a2bda24b629.png)

## 创建流水线作业
在java项目根目录添加一个.gitlab-ci.yml文件，文件内容如下

```yaml
stages:
  - build
  - test

build:
  stage: build
  tags:
    - java
  script:
    - mvn clean package # 编译打包
    - ls target

test:
  stage: test
  tags:
    - java
  script:
    - mvn test # 进行单元测试
    - ls target
  artifacts: # 收集单元测试报告
    reports:
      junit: 'target/surefire-reports/TEST-*.xml'
```

查看build阶段日志，已成功完成mvn打包。

![](assets/04-CI-CD/72f3034da519940f5d73.png)

查看test阶段日志，已成功完成单元测试。

![](assets/04-CI-CD/d57a370f9b865748e13a.png)

查看测试结果

![](assets/04-CI-CD/517aa4666f7896769a40.png)

# gitlab与npm集成
## 安装nodejs
下载地址[https://nodejs.org/en/download/prebuilt-binaries](https://nodejs.org/en/download/prebuilt-binaries)

```bash
[root@client1 ~]# wget https://nodejs.org/dist/v18.20.3/node-v18.20.3-linux-x64.tar.xz
[root@client1 ~]# tar -xf node-v18.20.3-linux-x64.tar.xz
[root@client1 ~]# mv node-v18.20.3-linux-x64 /usr/local/node
```

## 配置环境变量
```bash
[root@client1 ~]# vim /etc/profile
# 文件末尾添加如下内容
export PATH=$PATH:/usr/local/node/bin
[root@client1 ~]# source /etc/profile
[root@client1 ~]# node -v
v18.20.3
[root@client1 ~]# npm -v
10.7.0
```

## 配置镜像源
方法1：

```bash
npm config set registry https://mirrors.cloud.tencent.com/npm/
```

<font style="color:rgb(48, 49, 51);">方法2：使用nrm – NPM registry 管理工具</font>

```bash
[root@client1 ~]# npm install -g nrm

added 17 packages in 6s

4 packages are looking for funding
  run `npm fund` for details
npm notice
npm notice New minor version of npm available! 10.7.0 -> 10.8.1
npm notice Changelog: https://github.com/npm/cli/releases/tag/v10.8.1
npm notice To update run: npm install -g npm@10.8.1
npm notice
[root@client1 ~]# nrm ls
  npm ---------- https://registry.npmjs.org/
  yarn --------- https://registry.yarnpkg.com/
  tencent ------ https://mirrors.cloud.tencent.com/npm/
  cnpm --------- https://r.cnpmjs.org/
  taobao ------- https://registry.npmmirror.com/
  npmMirror ---- https://skimdb.npmjs.com/registry/
[root@client1 ~]# nrm use taobao
 SUCCESS  The registry has been changed to 'taobao'.
[root@client1 ~]# nrm ls
  npm ---------- https://registry.npmjs.org/
  yarn --------- https://registry.yarnpkg.com/
  tencent ------ https://mirrors.cloud.tencent.com/npm/
  cnpm --------- https://r.cnpmjs.org/
* taobao ------- https://registry.npmmirror.com/
  npmMirror ---- https://skimdb.npmjs.com/registry/
  
```

## 修改runner标签
操作同上，新增nodejs标签。

## 创建流水线作业
在nodejs项目根目录添加一个.gitlab-ci.yml文件，文件内容如下

```yaml
stages:
  - build

build:
  stage: build
  tags:
    - nodejs
  script:
    - npm install # 安装依赖
    - npm run build # 打包
```

观察build阶段日志，已成功完成打包




