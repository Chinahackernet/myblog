# 一、流程介绍

Nodejs应用部署比较简单，我采用的具体流程如下：

1、从git上拉包

2、将上次安装成功后保存的node\_modules和package-lock.json解压进现在的工程目录

3、用python脚本去判定package.json和package-lock.json中版本是否一致，不一致的话npm install，一致就直接跳过

4、上一步执行成功后，将最新的node\_modules和package-local.json打包存放，供下次使用

5、编译

6、打包

7、将包存放到部署服务器

8、删除当前工程目录

  

# 二、应用部署

## 2.1 安装nodejs

这一步主要是安装npm。

1、下载nodejs包，解压到安装目录

```plain
tar zxvf node-v10.14.1-linux-x64.tar.gz -C /usr/install
```

2、添加环境变量

```plain
export NODE_HOME=/usr/install/nodeJs10.14
export PATH=$NODE_HOME/bin:$PATH
```

3、更换源，因为国外源太慢

```plain
(1)、添加淘宝源
npm config set registry https://registry.npm.taobao.org
(2)、添加私有源
npm config set registry http://10.1.56.12:4873/
```

## 2.2 配置jenkins

Jenkins里配置也比较简单，我直接上图了。

![image.png](assets/devops与交付/Jenkins-Nodejs自动化部署/Jenkins-Nodejs自动化部署-1.png)

![image.png](assets/devops与交付/Jenkins-Nodejs自动化部署/Jenkins-Nodejs自动化部署-2.png)

![image.png](assets/devops与交付/Jenkins-Nodejs自动化部署/Jenkins-Nodejs自动化部署-3.png)

![image.png](assets/devops与交付/Jenkins-Nodejs自动化部署/Jenkins-Nodejs自动化部署-4.png)

构建--->Execute shell里的内容：

```shell
#source /etc/profile
cd ${appName} 
project_dir=`pwd`
echo ${project_dir}
#npm install --unsafe-perm &>/dev/null 2>&1
# 将上一次打包成功的包文件解压到项目目录
[ -e  /home/hudson/node_module/${appName}.tar.gz ] && tar zxf /home/hudson/node_module/${appName}.tar.gz -C .
# 执行脚本，校验包是否存在或者版本是否一致
/home/hudson/script/node_md_check.py ${project_dir}
[ $? -eq 0  ] && [ -e /home/hudson/node_module/${appName}.tar.gz ] && rm -f  /home/hudson/node_module/${appName}.tar.gz
# 将最新的库和lock文件保存，以备下次编译使用
tar -zcf /home/hudson/node_module/${appName}.tar.gz node_modules/ package-lock.json

/usr/install/nodeJs10.14/bin/fm start --release prod -c config/pre.config.js &>/dev/null 2>&1
/usr/bin/tar -zcf fdl-h5.tar.gz * && echo "OK" || echo "ERROR" &>/dev/null 2>&1

request1="buildNum=${BUILD_NUMBER}"
packageName="warName=@fdl-h5.tar.gz"
curl -X POST -F "${packageName}" -F 'crid=${crid}' -F 'compileId=${compileId}' -F 'appName=${appName}' -F "${request1}" http://xxxx:9090/upload
```

  

**注：如果在部署的时候肯定不能完全按着我的来做，因为环境不一样，架构不一样，而且我们的部署平台是二次开发的，所以上面脚本的参数变量都是定制好的，保存后就会在上图生成对应的值。**

**python脚本内容：**

```python
#!/usr/bin/env python
# -*- coding: utf-8 -*
##############################################################
# date: 2019-5-13
# auth: joker
# func: Nodejs编译打包之前的库校验
# vers: v0.1
##############################################################
import os
import json
import sys
import re
import subprocess

class NodeMdCheck:
    def __init__(self, project_dir):
        self.project_dir = project_dir
        self.package = os.path.join(self.project_dir, 'package.json')
        self.package_lock = os.path.join(self.project_dir, 'package-lock.json')
        self.flag = True

    def runCmd(self, cmd):
        """
            功能：执行shell命令
        """
        process = subprocess.Popen(cmd,stdout=subprocess.PIPE,stderr=subprocess.PIPE,stdin=subprocess.PIPE,shell=True)
        stdout,stderr = process.communicate(input = None)
        return stdout

    def format_package(self,dir):
        """
            功能：格式化package.json
        """
        for i in dir:
                if '^' in dir[i]:
                    dir[i] = re.split('\^',dir[i])[1]
        

    def main(self):
        # 如果package-lock.json不存在，则执行npm install
        if not os.path.exists(self.package_lock):
            print("------没有缓存，开始npm install------")
            self.runCmd("cd {} && npm install --unsafe-perm".format(self.project_dir))

        # 如果存在，则对比包版本，如果版本一致，则直接编译，否正执行npm install
        else:
            f = open(self.package, 'r')
            f_lock = open(self.package_lock, 'r')
            date = f.read()
            date = json.loads(date)

            lock_date = f_lock.read()
            lock_date = json.loads(lock_date)

            # 格式化package.json，去掉'^'
            self.format_package(date['dependencies'])
            self.format_package(date['devDependencies'])

            # 将date['dependencies']和date['devDependencies']组合为一个字典
            for i in date['devDependencies']:
                if i not in date['dependencies']:
                    date['dependencies'][i] = date['devDependencies'][i]

            # print(date['dependencies'])
            # print(date['devDependencies'])
                
            # 判断版本是否一致，不一致执行npm install
            for i in date['dependencies']:
                if i in lock_date['dependencies']:
                    if date['dependencies'][i] != lock_date['dependencies'][i]['version']:
                        self.flag = False

            # print(self.flag)

            if not self.flag:
                print("------版本不对，开始npm install------")
                self.runCmd("cd {} && npm install --unsafe-perm".format(self.project_dir))
            f_lock.close()
            f.close()

    
if __name__ == "__main__":
    # 工程目录
    project_dir = sys.argv[1]
    # project_dir = 'E:\测试\\nodejs'

    # 初始化
    package_check = NodeMdCheck(project_dir)
    package_check.main()
```