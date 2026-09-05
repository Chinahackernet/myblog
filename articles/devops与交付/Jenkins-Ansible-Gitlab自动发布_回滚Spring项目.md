# 一、实现方法流程图

流程图如下：

![image.png](assets/devops与交付/Jenkins-Ansible-Gitlab自动发布_回滚Spring项目/Jenkins-Ansible-Gitlab自动发布_回滚Spring项目-1.png)

代码托管在本地GitLab上（为了复现整套流水线，我直接使用了GitHub，懒得再搭建GitLab），开发完成后提交代码到代码仓库，【自动】触发Jenkins进行持续集成和部署，如果代码出现问题，根据版本进行回滚。

（1）、自动触发Jenkins可以使用hooks来实现，具体是否使用取决于自己；

（2）、Jenkins从GitLab上拉取代码进行编译打包，并将项目target目录备份到备份目录下，以便回滚使用；

（3）、Jenkins将打好得包通过ansible部署到对应得服务器上并重启服务；

  

# 二、规范标准

  

```plain
ansible:
备份路径：/data/backup/{{ENV}}/{{JOB_NAME}}
	ENV：SIT,PRE,UAT,SANDBOX,PRO
  JOB_NAME：Jenkins内建参数，项目名
Jenkins工作目录：/data/apps ，默认在/root/.jenkins下

应用服务器：
应用路径：/home/tomcat/apache-tomcat-9.0.16/webapps/
日志路径：/home/tomcat/logs/
系统名称：{数据中心}-{服务器区域}-{战队名}-{应用名}-{IP后两位}
	比如：DCA-APP-KFPT-WGFW01-11-85，其中DCA表示数据中心A，DCB表示数据中心B
```

# 三、环境配置

## 1、软件版本

<table class="lake-table" style="width: 721px;"><colgroup><col span="1" width="360" /><col span="1" width="360" /></colgroup><tbody><tr style="height: 33px;"><td>软件</td><td>版本</td></tr></tbody><tbody><tr style="height: 33px;"><td>ansible</td><td>2.7.10</td></tr><tr style="height: 33px;"><td>python</td><td>2.7.5</td></tr><tr style="height: 33px;"><td>centos</td><td>7.4.1708</td></tr><tr style="height: 33px;"><td>java</td><td>1.8.0_171</td></tr><tr style="height: 33px;"><td>maven</td><td>3.6.1</td></tr><tr style="height: 33px;"><td>jenkins</td><td>2.164.1</td></tr></tbody></table>

## 2、软件部署

略.....（运维必备技能，不需要多说）

  

# 四、代码发布

## 1、脚本介绍

脚本名：deploy.yml

```plain
---
- hosts: "{{ TARGET }}"
  remote_user: "{{ REMOTE_USER }}"
  any_errors_fatal: true
  vars:
    BACKUP_DIR: /data/backup/{{ ENV }}/{{ JOB_NAME }}

  tasks:
  - name: 获取时间节点
    set_fact: BACKUP_TIME={{ '%Y%m%d_%H%M' | strftime  }}

  - name: 获取进程PID，并把它赋值给变量java_pid
    shell: ps -ef | grep /home/tomcat |grep -v grep|awk '{print $2}'
    register: java_pid

  - name: 创建备份目录
    file: path={{ BACKUP_DIR }}/{{ BACKUP_TIME  }} state=directory

  - name: 备份构建产物
    shell: cp -ra {{ WORKSPACE }}/* {{ BACKUP_DIR }}/{{ BACKUP_TIME  }}/

  - name: 停止服务
    shell: ps -ef | grep /home/tomcat |grep -v grep|awk '{print $2}'|xargs kill -9
    when: java_pid.stdout != ''

  - name: 删除原有war包，其实也可以不用删除
    file: path=/home/tomcat/apache-tomcat-9.0.16/webapps/*.war state=absent

  - name: 复制war包到应用路径
    shell: cp -ra {{ WORKSPACE }}/target/*.war /home/tomcat/apache-tomcat-9.0.16/webapps/

  - name: 启动服务
    shell: source /etc/profile && nohup sh /home/tomcat/apache-tomcat-9.0.16/bin/catalina.sh start &>/dev/null &

```

## 2、Jenkins配置

### 2.1、插件

-   [Ansible plugin](https://wiki.jenkins-ci.org/display/JENKINS/Ansible+Plugin): 执行Ansible所需插件。
-   [AnsiColor](http://wiki.jenkins-ci.org/display/JENKINS/AnsiColor+Plugin)：彩色输出，非必须
-   [Build With Parameters](https://wiki.jenkins-ci.org/display/JENKINS/Build+With+Parameters+Plugin)：参数化构建需要
-   [Git plugin](http://wiki.jenkins-ci.org/display/JENKINS/Git+Plugin)：git需要
-   [JDK Parameter Plugin](https://wiki.jenkins-ci.org/display/JENKINS/JDK+Parameter+Plugin)：自己按需吧
-   [Mask Passwords Plugin](https://wiki.jenkins.io/display/JENKINS/Mask+Passwords+Plugin)：参数化构建，加密密码类参数，非必须
-   [Readonly Param](https://wiki.jenkins-ci.org/display/JENKINS/Readonly+Parameter+Plugin)链接eter plugin：参数化构建里的，只读参数选项
-   [Active Choices Plug-in](https://wiki.jenkins-ci.org/display/JENKINS/Active+Choices+Plugin)： 动态参数插件，发布不会用到，后面会介绍，有奇用
-   [Run Selector Plugin](http://wiki.jenkins-ci.org/display/JENKINS/Run+Selector+Plugin)：参数化构建，选择插件
-   [Git Parameter Plug-In](http://wiki.jenkins-ci.org/display/JENKINS/Git+Parameter+Plugin)：git分支选择插件，非必要
-   Maven Release Plug-in Plug-in：Maven插件，创建Maven项目必须

### 2.2、配置

#### 2.2.1 Jenkins项目命名规范

{环境}-{战队}-{项目}

#### 2.2.2 创建一个maven项目

![image.png](assets/devops与交付/Jenkins-Ansible-Gitlab自动发布_回滚Spring项目/Jenkins-Ansible-Gitlab自动发布_回滚Spring项目-2.png)

设置构建保存日期：

![image.png](assets/devops与交付/Jenkins-Ansible-Gitlab自动发布_回滚Spring项目/Jenkins-Ansible-Gitlab自动发布_回滚Spring项目-3.png)

描述业务环境：

![image.png](assets/devops与交付/Jenkins-Ansible-Gitlab自动发布_回滚Spring项目/Jenkins-Ansible-Gitlab自动发布_回滚Spring项目-4.png)

GIT配置：

![image.png](assets/devops与交付/Jenkins-Ansible-Gitlab自动发布_回滚Spring项目/Jenkins-Ansible-Gitlab自动发布_回滚Spring项目-5.png)

构建环境配置：

![image.png](assets/devops与交付/Jenkins-Ansible-Gitlab自动发布_回滚Spring项目/Jenkins-Ansible-Gitlab自动发布_回滚Spring项目-6.png)

构建配置：

![image.png](assets/devops与交付/Jenkins-Ansible-Gitlab自动发布_回滚Spring项目/Jenkins-Ansible-Gitlab自动发布_回滚Spring项目-7.png)

ansible配置：

![image.png](assets/devops与交付/Jenkins-Ansible-Gitlab自动发布_回滚Spring项目/Jenkins-Ansible-Gitlab自动发布_回滚Spring项目-8.png)

点击高级，配置Extra Variable，配置需要传递得参数：

![image.png](assets/devops与交付/Jenkins-Ansible-Gitlab自动发布_回滚Spring项目/Jenkins-Ansible-Gitlab自动发布_回滚Spring项目-9.png)

![image.png](assets/devops与交付/Jenkins-Ansible-Gitlab自动发布_回滚Spring项目/Jenkins-Ansible-Gitlab自动发布_回滚Spring项目-10.png)

然后配置完成，保存项目。

点击构建可以看到具体得输出：

![image.png](assets/devops与交付/Jenkins-Ansible-Gitlab自动发布_回滚Spring项目/Jenkins-Ansible-Gitlab自动发布_回滚Spring项目-11.png)

# 五、代码回滚

由于各种各样的原因，发布的代码可能会出现异常，这时候可能需要紧急回滚代码，庆幸的是，我们前面有做备份策略，我们可以手动去回滚备份的代码，但是缺点也很明显，当主机实例过多时，手动回滚明显是不再明智的，所以我们想办法结合Jenkins+Ansible这两者来做到一个通用的服务回滚策略，首先我们先分析下我们回滚代码需要用到什么？

1.  代码的历史备份
2.  回滚应用名称
3.  需要回滚的主机

首先看下第1点，我们发布过程是是有对代码做备份的。再看第2,3点，应用名称跟回滚的主机哪里可以获取到呢？答案是jenkins job里。

我们进JENKINS\_HOME得jobs查看下面得文件如下：

![image.png](assets/devops与交付/Jenkins-Ansible-Gitlab自动发布_回滚Spring项目/Jenkins-Ansible-Gitlab自动发布_回滚Spring项目-12.png)

我们将PRE-DSJ-ORDER进行拆分可以得到{业务环境}-{战队}-{业务名}等信息，而主机信息就在config.xml得content字段，如下：

![image.png](assets/devops与交付/Jenkins-Ansible-Gitlab自动发布_回滚Spring项目/Jenkins-Ansible-Gitlab自动发布_回滚Spring项目-13.png)

  

## 1、创建业务回滚JOB

![image.png](assets/devops与交付/Jenkins-Ansible-Gitlab自动发布_回滚Spring项目/Jenkins-Ansible-Gitlab自动发布_回滚Spring项目-14.png)

下拉选择参数化构建，选择动态参数，新建一个Avctive Choices Parameter ==>ENV，选择Groovy script，里面用groovy套了一个shell去执行(当然，你groovy熟悉不套shell能获取一个列表也行)。

![image.png](assets/devops与交付/Jenkins-Ansible-Gitlab自动发布_回滚Spring项目/Jenkins-Ansible-Gitlab自动发布_回滚Spring项目-15.png)

我们可以在服务器上执行一下这条命令，看看输出：

```plain
[root@hjkj jobs]# cd /data/apps/jobs && ls |grep -Po '^(?!PRD|APP)[A-Z]+(?=-)'  | sort -n | uniq
PRE
```

从这一步可以获取业务环境。

  

接下来，我们添加第二个参数Active Choices Reactive Parameter(要引用其他参数)==> GROUP，Groovy Script里多了一个env=ENV是为了引入前面获取的ENV，Choice Type里继续勾选单选框，不同的是下面多了一个Referenced parameter,这里填写ENV(这个是因为要关联上面的ENV)

![image.png](assets/devops与交付/Jenkins-Ansible-Gitlab自动发布_回滚Spring项目/Jenkins-Ansible-Gitlab自动发布_回滚Spring项目-16.png)

![image.png](assets/devops与交付/Jenkins-Ansible-Gitlab自动发布_回滚Spring项目/Jenkins-Ansible-Gitlab自动发布_回滚Spring项目-17.png)

看看这条命令的输出：

```plain
[root@hjkj jobs]# cd /data/apps/jobs && ls -d $env* | grep -Po '(?<=-)[A-Z0-9]+(?=-)' | sort -n | uniq
DSJ
ZT
```

  

  

接下来，我们添加第三个动态参数Active Choices Reactive Parameter(要引用其他参数)==>SERVICE，Groovy Script里多了一个env=ENV,group=GROUP是为了引入前面获取的ENV跟GROUP，Choice Type里继续勾选单选框，

不同的是下面多了一个Referenced parameter,这里填写ENV,GROUP(这个是因为要关联上面的ENV,GROUOP)

![image.png](assets/devops与交付/Jenkins-Ansible-Gitlab自动发布_回滚Spring项目/Jenkins-Ansible-Gitlab自动发布_回滚Spring项目-18.png)

![image.png](assets/devops与交付/Jenkins-Ansible-Gitlab自动发布_回滚Spring项目/Jenkins-Ansible-Gitlab自动发布_回滚Spring项目-19.png)

看看这条命令的输出：

```plain
[root@hjkj jobs]# cd /data/apps/jobs/ && ls -d ${env}-${group}-* | grep -Po "(?<=-)[a-zA-Z0-9-].*" | grep -Po "(?<=-)[a-zA-Z0-9-].*"| sort
config
ORDER
```

  

最后，我们再配置一个Active Choices Reactive Parameter==>HISTORY，用于获取历史版本,选择单选框，关联ENV，GROUP，SERVICE参数。

![image.png](assets/devops与交付/Jenkins-Ansible-Gitlab自动发布_回滚Spring项目/Jenkins-Ansible-Gitlab自动发布_回滚Spring项目-20.png)

![image.png](assets/devops与交付/Jenkins-Ansible-Gitlab自动发布_回滚Spring项目/Jenkins-Ansible-Gitlab自动发布_回滚Spring项目-21.png)

看看这条命令的输出结果:

```plain
[root@hjkj jobs]# env=PRE
[root@hjkj jobs]# group=DSJ
[root@hjkj jobs]# service=ORDER
[root@hjkj jobs]# cd /data/backup/${env}/${env}-${group}-${service}/ && ls  | sort -nr | head -n10
20190506_140
```

  

作为可选项，我们还可以加个Active Choices Reactive Parameter==>INFO的动态参数构建，用于获取config.xml里的job描述，这里要关联三个参数ENV,GROUP,SERVICE.

![image.png](assets/devops与交付/Jenkins-Ansible-Gitlab自动发布_回滚Spring项目/Jenkins-Ansible-Gitlab自动发布_回滚Spring项目-22.png)

![image.png](assets/devops与交付/Jenkins-Ansible-Gitlab自动发布_回滚Spring项目/Jenkins-Ansible-Gitlab自动发布_回滚Spring项目-23.png)

看看命令的执行结果：

```plain
[root@hjkj PRE-DSJ-ORDER]# grep -Po '(?<=<description>).*(?=<)' /data/apps/jobs/${env}-${group}-${service}/config.xml | head -n 1
PRE-DSJ-ORDER
```

  

  

我们正确获取到了{环境}，{项目分组}，{应用名}以及{历史备份点}等信息，但是还没有关联的inventory,既然inventory信息在config.xml中已有，我们可以通过声明ENV,GROUP,SERVICE环境变量，再通过脚本获取这几个值来拼接出config.xml所在位置，再通过解析xml来获取主机host,得到一个ansible动态inventory,（不单单是host，我们可以在xml里获取各种我们定义的值来作为inventory vars变量为我们所用！）

在构建选项添加Executor shell,我们将ENV,GROUP,SERVICE声明到了执行的环境变量中：

![image.png](assets/devops与交付/Jenkins-Ansible-Gitlab自动发布_回滚Spring项目/Jenkins-Ansible-Gitlab自动发布_回滚Spring项目-24.png)

  

获取信息的inventory.py脚本如下：

```python
#!/usr/bin/python
# -- encoding: utf-8 --
## pip install xmltodict ##
import xmltodict
import json
import re
import os

# 从环境变量获取参数
# 账号密码你做了信任就不需要，自己看着办
options = {
    'ENV': os.getenv('ENV'),
    'GROUP': os.getenv('GROUP'),
    'SERVICE': os.getenv('SERVICE'),
    'ACTION': os.getenv('ACTION'),
    'ansible_user': 'stguser',
    'ansible_password': 'abc',
    'ansible_become_pass': '123',
    'ansible_become_method': 'su',
    'ansible_become_user': 'root',
    'ansible_become': True
}

def getXml(env,group,service):
    ''' 拼接对应项目的jenkinx config.xml路径'''
    file = '/data/apps/jobs/{}-{}-{}/config.xml'.format(env,group,service)
    return file

def getData(file): 
    data = dict()
    xml = open(file)
    try:  
        xmldata = xml.read()  
    finally:  
        xml.close()
    convertedDict = xmltodict.parse(xmldata)
 
    # maven2 项目模板数据提取
    if convertedDict.has_key('maven2-moduleset'):
        name = convertedDict['maven2-moduleset']['rootModule']['artifactId']
        _ansi_obj = convertedDict['maven2-moduleset']['postbuilders']['org.jenkinsci.plugins.ansible.AnsiblePlaybookBuilder']

        # 可能有多个playbbok,只要是inventory一样就无所谓取哪一个（这里取第一个,如果多个不一样，自己想办法合并）
        if isinstance(_ansi_obj,list):
            host_obj = _ansi_obj[0]['inventory']['content']
        else:
            host_obj = _ansi_obj['inventory']['content']

        data['hosts'] = re.findall('[\d+\.]{3,}\d+',host_obj)

        # 如果设置了参数化构建，把只读参数作为ansible参数
        if convertedDict['maven2-moduleset']['properties'].has_key('hudson.model.ParametersDefinitionProperty'):
            parameter_data = convertedDict['maven2-moduleset']['properties']['hudson.model.ParametersDefinitionProperty']['parameterDefinitions']['com.wangyin.ams.cms.abs.ParaReadOnly.WReadonlyStringParameterDefinition']
    
    # 这里使用的自由风格模板模板，数据结构与maven2不一样，需要拆开判断
    if convertedDict.has_key('project'):
        host_obj = convertedDict['project']['builders']['org.jenkinsci.plugins.ansible.AnsiblePlaybookBuilder']['inventory']['content']

        data['hosts'] = re.findall('[\d+\.]{3,}\d+',host_obj)
        
        # 如果设置了参数化构建，把只读参数作为ansible参数
        if convertedDict['project']['properties'].has_key('hudson.model.ParametersDefinitionProperty'):
            parameter_data = convertedDict['project']['properties']['hudson.model.ParametersDefinitionProperty']['parameterDefinitions']['com.wangyin.ams.cms.abs.ParaReadOnly.WReadonlyStringParameterDefinition']
    
    # 插入参数化构建参数(我这里是只读字符串参数)
    try:       
        for parameter in parameter_data:
            data[parameter['name']] = parameter['defaultValue']
    except:
        pass

    #print(json.dumps(convertedDict,indent=4))
    return data

def returnInventory(xmldata,**options):
    ''' 合并提取的数据，返回inventory的json'''

    inventory = dict()
    inventory['_meta'] = dict()
    inventory['_meta']['hostvars'] = dict()
    inventory[options['SERVICE']] = dict()
    inventory[options['SERVICE']]['vars'] = dict()

    # 合并xmldata提取的数据
    for para_key,para_value in xmldata.items():
        # 单独把hosts列表提取出来,其他的都丢vars里
        if para_key == 'hosts':
            inventory[options['SERVICE']][para_key] = para_value
        else:
            inventory[options['SERVICE']]['vars'][para_key] = para_value
    # 合并options里的所有东西到vars里
    for opt_key,opt_value in options.items():
        inventory[options['SERVICE']]['vars'][opt_key] = opt_value
    return inventory
  
if __name__ == "__main__":
    xmldata = getData(getXml(options['ENV'],options['GROUP'],options['SERVICE']))
    print(json.dumps(returnInventory(xmldata,**options),indent=4))
```

执行结果如下：

```bash
[root@hjkj python]# export ENV=PRE GROUP=DSJ SERVICE=ORDER
[root@hjkj python]# ./inventory.py 
{
    "_meta": {
        "hostvars": {}
    }, 
    "ORDER": {
        "hosts": [
            "172.16.0.33"
        ], 
        "vars": {
            "ansible_become_method": "su", 
            "GROUP": "DSJ", 
            "SERVER_PORT": "8080", 
            "SERVICE": "ORDER", 
            "ansible_become_user": "root", 
            "ansible_become": true, 
            "ansible_user": "stguser", 
            "ENV": "PRE", 
            "ansible_become_pass": "123", 
            "ACTION": null, 
            "ansible_password": "abc"
        }
    }
}
```

  

最后我们看下jenkins里的ansible配置，inventory执行了python脚本，并传入了一个extra vars 的HISTORY参数：

![image.png](assets/devops与交付/Jenkins-Ansible-Gitlab自动发布_回滚Spring项目/Jenkins-Ansible-Gitlab自动发布_回滚Spring项目-25.png)![image.png](assets/devops与交付/Jenkins-Ansible-Gitlab自动发布_回滚Spring项目/Jenkins-Ansible-Gitlab自动发布_回滚Spring项目-26.png)

  

## 2、ansible roles介绍

目录结构：

```plain
.
├── roles
│   └── spring_rollback
│       ├── defaults
│       │   └── main.yml
│       └── tasks
│           ├── common.yml
│           ├── main.yml
│           └── rollback.yml
├── rollback.yml
```

  

rollback.yml

```plain
---
- hosts: all
  pre_tasks:
    - assert:
        that:
        - "HISTORY != ''"
        fail_msg: "请选择一个正确的历史版本。"
  roles:
    - spring_rollback
```

  

defaults/main.yml

```plain
---
BACKUP: "/data/backup/{{ ENV }}/{{ENV}}-{{GROUP}}-{{ SERVICE }}/{{ HISTORY }}"
OWNER: stguser
```

  

tasks/main.yml

```plain
---
- include_tasks: common.yml

- include_tasks: rollback.yml
  loop: "{{ play_hosts }}"
  run_once: true
  become: yes
```

  

tasks/common.yml

```plain
---
- shell: "ls -d /home/tomcat/apache-tomcat-9.0.16/webapps"
  register: result

- set_fact:
    src_package: "{{ BACKUP }}"
    dest_package: "{{ result.stdout }}"
```

  

tasks/rollback.yml

```plain
---
- block:
  - name: get pid
    shell: ps -ef | grep /home/tomcat |grep -v grep|awk '{print $2}'
    register: java_pid

  - name: stop tomcat
    shell: ps -ef | grep /home/tomcat |grep -v grep|awk '{print $2}'|xargs kill -9
    when: java_pid.stdout != ''

  - name: 回滚{{ SERVICE }}至{{ HISTORY }}历史版本
    shell: |
      [[ -f {{ dest_package }}/*.war ]] && rm -rf {{ dest_package }}/*
      \cp -ra {{ src_package }}/target/*.war {{ dest_package }}/

  - name: start tomcat
    shell: source /etc/profile && nohup sh /home/tomcat/apache-tomcat-9.0.16/bin/catalina.sh start &>/dev/null &
```

  

## 3、执行效果

![image.png](assets/devops与交付/Jenkins-Ansible-Gitlab自动发布_回滚Spring项目/Jenkins-Ansible-Gitlab自动发布_回滚Spring项目-27.png)

![image.png](assets/devops与交付/Jenkins-Ansible-Gitlab自动发布_回滚Spring项目/Jenkins-Ansible-Gitlab自动发布_回滚Spring项目-28.png)