### 如何linux上安装python3

  

1.下载源代码，方式有2个，

1.在windows上下载，下载完成后，通过lrzsz工具，或者xftp工具，传输到linux服务器中

2.在linux中直接下载

cd /opt

wget [https://www.python.org/ftp/python/3.6.2/Python-3.6.2.tgz](https://www.python.org/ftp/python/3.6.2/Python-3.6.2.tgz)

  

2.解压缩源代码

tar -xf Python-3.6.2.tgz

  

3.进入源代码目录，释放编译文件

cd  Python-3.6.2

  

释放编译文件，指定python3安装位置

./configure  --prefix=/opt/python36/

  

释放完毕后，开始编译且安装

make && make install

  

4.安装完毕后，会产生一个文件夹/opt/python36/

  

5.配置python3的环境变量

[root@bigc bin]# echo $PATH

/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/root/bin

  

注意一定要将python3的环境变量，添加到path的最前面

  

为了永久生效，将以下变量，添加到全局配置文件，每次登陆都加载

vim /etc/profile

  

在最底行写入如下path

  

PATH="/opt/python36/bin/:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/root/bin"

  

6.退出会话，python3即生效

  

或者是建立软连接

  

```bash
ln -s  /opt/python36/bin/python3 /usr/bin/python3
```

  

注：**安装在opt目录下才是专业的做法**

  

### 安装python的虚拟环境，解决多个解释器问题

  

## virtualenv

  

virtualenv 是python解释器的分身

它是基于物理解释器，进行一个解释器分身，这个分身，可以用于运行各种python开发环境，并且创建简单，删除销毁也简单，解决环境依赖灾难

  

1.安装虚拟环境

pip3 install  -i [https://pypi.douban.com/simple](https://pypi.douban.com/simple)   virtualenv

  

2.通过virtualenv创建虚拟环境

cd /opt/allenv #进入同一管理目录

virtualenv --no-site-packages --python=python3  venv1

  

\--no-site-packages  创建一个干净隔离的python环境

\--python=python3  基于python3创建虚拟环境

venv1  虚拟环境文件夹的名字 ，自己定义

  

3.激活虚拟环境

cd /opt/allenv/

通过source命令，读取激活脚本，激活虚拟环境

source /opt/allenv/venv1/bin/activate

  

4.激活虚拟环境后，检查以下几个步骤，是否正确激活

\-命令提示符的变化

(venv1) [root@bigc bin]#

  

```
-环境变量的变化，这就是虚拟环境的原理，修改path
echo $PATH 

-检查python3，pip3是否来自于虚拟环境
which python3 
which pip3 

-检查虚拟环境是否干净隔离
pip3 list
```

  

  

\-退出虚拟环境的命令

deactivate

  

5.在虚拟环境地下安装django

  

6.练习，分别安装2个虚拟环境，venv1 venv2，分别运行django1.11.15 和django2.0 ，启动

  

解决本地开发环境，和线上开发环境一致性的问题

  

1.在本地通过命令，导出解释器的模块

pip3 freeze > requirements.txt

  

2.将这个requirements.txt   文件传输到linux服务器上，可以通过 lrzsz

  

3.在linux服务器当中，创建一个新的虚拟环境 venv3，安装这个文本，即可一次性解决所有模块问题

pip3 install -r  requirements.txt

  

## virtualenvwrapper工具学习

  

1.因为virtualenv 工具使用的并不方便

  

2.安装virtualenvwrapper

pip3 install  -i [https://pypi.douban.com/simple](https://pypi.douban.com/simple)    virtualenvwrapper

  

3.配置virtualenvwrapper的环境变量，每次开机就启动

  

```
1.#这个文件是用户个人配置文件
vim ~/.bashrc

2.写入以下几行代码export 和source一样都是读取linux shell变量的命令
	export WORKON_HOME=~/Envs   #设置virtualenv的统一管理目录
	export VIRTUALENVWRAPPER_VIRTUALENV_ARGS='--no-site-packages'   #添加virtualenvwrapper的参数，生成干净隔绝的环境
	export VIRTUALENVWRAPPER_PYTHON=/opt/python36/bin/python3     #指定python解释器
	source /opt/python36/bin/virtualenvwrapper.sh   #这一步才是真正使用工具的步骤，执行virtualenvwrapper安装脚本
```

  

```
3.退出当前会话，重新登录linux
logout 
4.重新登录，查看是否可以使用virtualenvwrapper

5.确保可以使用后，学习这个工具的命令
	1.创建新的虚拟环境
	mkvirtualenv  django1.8
	mkvirtualenv  django1.11 
	
	2.切换不同的虚拟环境
	workon  django1.8
	workon  django1.11 
	
	3.退出虚拟环境
	deactivate

	4.删除虚拟环境
	rmvirtualenv   django1.11
	
	5.进入虚拟环境的家目录
	cdsitepackages 
	
	6.列举所有的环境
	lsvirtualenv
```

  

  

mkvirtualenv venv

  

这样会在WORKON\_HOME变量指定的目录下新建名为venv的虚拟环境。

  

**若想指定****python****版本，可通过****"--python"****指定****python****解释器**

  

mkvirtualenv --python=/usr/local/python3.5.3/bin/python venv\_name

  

  

## 安装

#### 1\. 我们先看看现有的 python2在哪里

```plain
[root@lidan /]# whereis python
python: /usr/bin/python /usr/bin/python2.7 /usr/bin/python.bak /usr/lib/python2.7 /usr/lib64/python2.7 /etc/python /usr/include/python2.7 /usr/share/man/man1/python.1.gz
```
```plain
[root@lidan bin]# ll python*
lrwxrwxrwx. 1 root root    9 5月  27 2016 python2 -> python2.7
-rwxr-xr-x. 1 root root 7136 11月 20 2015 python2.7
lrwxrwxrwx. 1 root root    7 5月  27 2016 python.bak -> python2
```

#### 2\. 接下来我们要安装编译 Python3的相关包

```plain
yum install zlib-devel bzip2-devel openssl-devel ncurses-devel sqlite-devel readline-devel tk-devel gcc make libffi-devel
```

这里面有一个包很关键`libffi-devel`，因为只有3.7才会用到这个包，如果不安装这个包的话，在 make 阶段会出现如下的报错：

```plain
# ModuleNotFoundError: No module named '_ctypes'
```

#### 3\. 安装pip，因为 CentOs 是没有 pip 的。

```plain
#运行这个命令添加epel扩展源 
yum -y install epel-release 
#安装pip 
yum install python-pip
```

#### 4\. 可以用 python 安装一下 wget

```plain
pip install wget
```

#### 5\. 我们可以下载 python3.7的源码包了

```plain
wget https://www.python.org/ftp/python/3.7.0/Python-3.7.0.tgz
```
```plain
#解压缩
tar -zxvf Python-3.7.0.tgz
#进入解压后的目录，依次执行下面命令进行手动编译
./configure prefix=/usr/local/python3 
make && make install
```

如果最后没提示出错，就代表正确安装了，在/usr/local/目录下就会有python3目录

#### 6\. 添加软链接

```plain
#添加python3的软链接 
ln -s /usr/local/python3/bin/python3.7 /usr/bin/python3.7 
#添加 pip3 的软链接 
ln -s /usr/local/python3/bin/pip3.7 /usr/bin/pip3.7
#测试是否安装成功了 
python -V
```

#### 7\. 更改yum配置，因为其要用到python2才能执行，否则会导致yum不能正常使用（不管安装 python3的那个版本，都必须要做的）

```plain
vi /usr/bin/yum 
把 #! /usr/bin/python 修改为 #! /usr/bin/python2 
vi /usr/libexec/urlgrabber-ext-down 
把 #! /usr/bin/python 修改为 #! /usr/bin/python2
```