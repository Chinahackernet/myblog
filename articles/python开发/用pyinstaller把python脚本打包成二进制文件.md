# 前言

在编写python脚本的时候，有时候我们会需要很多依赖库，如果只是脚本，在别的机器上运行就也需要安装这些依赖库，这是一个非常麻烦的时候，解决这个问题的思路有以下几种：

（1）、用docker，在docker里解决这些依赖，然后封装成镜像，这样就可以在各种机器上运行了；

（2）、使用virtualenv进行本地包安装，然后把安装好的文件拷贝到服务器上；

（3）、把包打成二进制文件；

  

由于我们内部业务没用docker，所以第一点就排除了，至于第二点还是比较麻烦，直接舍弃。妥妥的研究第三种了。

在用pyinstaller的时候踩了几个坑：

（1）、你原始主机（准备用来打包）的主机，如果环境比较混乱，比如有pyhton2也有python3，在用pyinstaller的时候会出现一些莫名奇妙的错误（就是打出来的包用不了），我在这个坑里躺了很久；

（2）、如果你在centos7上打的包，跑到centos6上运行脚本，会报一些openssl、glibc等版本太低的问题，这种情况下，你在centos7上打的包就只能在centos7上跑，要在6上跑，只能用centos6的服务器打包；

  

# 一、安装

## 1、安装pip(可选)

看你服务器上是否有pip，如果没有，需要安装，安装方法如下：

```python
# 通过yum来安装
yum install -y epel-release
yum install -y python-pip

# 通过安装脚本来安装（如果centos6的系统可能不适合）
curl https://bootstrap.pypa.io/get-pip.py -o get-pip.py
python get-pip.py
```

  

## 2、安装pyinstaller

```python
# 在7的系统上可以直接执行下面语句，经过测试最新3.4的版本还有一些不知名的问题
# 当然不是所有的机器都能装上3.3版本，如果在安装的时候报ImportError....，就把版本降低试试
pip install pyinstaller==3.3

# 在6的系统上需要选择pyinstaller其他的版本，我在centos6.10上安装的是2.1的版本
pip install pyinstaller==2.1
```

  

# 二、原理

简单的说一下pyinstaller的原理：

PyInstaller输入你指定的的脚本，首先分析脚本所依赖的其他脚本，然后去查找，复制，把所有相关的脚本收集起来，包括Python解析器，然后把这些文件放在一个目录下，或者打包进一个可执行文件里面。

可以直接发布输出的整个文件夹里面的文件，或者生成的可执行文件。你只需要告诉用户，你的应用App是自我包含的，不需要安装其他包，或某个版本的Python，就可以直接运行了。

**需要注意的是：**PyInstaller打包的执行文件，只能在和打包机器系统同样的环境下。也就是说，不具备可移植性，若需要在不同系统上运行，就必须针对该平台进行打包。

  

# 三、使用

语法：

```plain
pyinstaller [options] script [script ...] | specfile
```

  

参数介绍:

<table class="lake-table" style="width: 740px;"><colgroup><col span="1" width="157" /><col span="1" width="582" /></colgroup><tbody><tr style="height: 33px;"><td><p>参数</p></td><td><p>含义</p></td></tr><tr style="height: 33px;"><td><p>-F</p></td><td><p><span class="lake-fontsize-12" style="color: #2F2F2F;">指定打包后只生成一个可执行的文件</span></p></td></tr><tr style="height: 33px;"><td><p>-D</p></td><td><p><span class="lake-fontsize-12" style="color: #2F2F2F; background-color: rgba(181, 181, 181, 0.1);">–onedir 创建一个目录，包含可执行，但会依赖很多文件（默认选项）</span></p></td></tr><tr style="height: 33px;"><td colspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><p>-c</p></td><td colspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><p><span class="lake-fontsize-12" style="color: #2F2F2F;">–console, –nowindowed 使用控制台，无界面(默认)</span></p></td></tr><tr style="height: 33px;"><td colspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><p>-w</p></td><td colspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><p><span class="lake-fontsize-12" style="color: #2F2F2F; background-color: rgba(181, 181, 181, 0.1);">–windowed, –noconsole 使用窗口，无控制台</span></p></td></tr><tr style="height: 33px;"><td colspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><p>-p</p></td><td colspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><p><span class="lake-fontsize-12" style="color: #2F2F2F;">添加搜索路径，让其找到对应的库。</span></p></td></tr><tr style="height: 33px;"><td colspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><p>-i</p></td><td colspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><p><span class="lake-fontsize-12" style="color: #2F2F2F; background-color: rgba(181, 181, 181, 0.1);">改变生成程序的icon图标</span></p></td></tr></tbody></table>

由于我只是一些脚本，所以基本都只用"-F"参数。

测试：

（1）、不带参数脚本

```python
[root@ecs-5704-0006 test]# cat test.py 
print("hello world")
```

  

测试一下脚本是否有问题：

```python
[root@ecs-5704-0006 test]# python test.py 
hello world
```

  

用pyinstaller打包：

```python
[root@ecs-5704-0006 test]# pyinstaller -F test.py 
33 INFO: PyInstaller: 3.3
33 INFO: Python: 2.7.5
34 INFO: Platform: Linux-3.10.0-862.14.4.el7.x86_64-x86_64-with-centos-7.5.1804-Core
34 INFO: wrote /usr/local/src/test/test.spec
38 INFO: UPX is not available.
38 INFO: Extending PYTHONPATH with paths
['/usr/local/src/test', '/usr/local/src/test']
38 INFO: checking Analysis
38 INFO: Building Analysis because out00-Analysis.toc is non existent
38 INFO: Initializing module dependency graph...
40 INFO: Initializing module graph hooks...
91 INFO: running Analysis out00-Analysis.toc
103 INFO: Caching module hooks...
106 INFO: Analyzing /usr/local/src/test/test.py
106 INFO: Loading module hooks...
106 INFO: Loading module hook "hook-encodings.py"...
1764 INFO: Looking for ctypes DLLs
1764 INFO: Analyzing run-time hooks ...
1768 INFO: Looking for dynamic libraries
2032 INFO: Looking for eggs
2032 INFO: Using Python library /lib64/libpython2.7.so.1.0
2034 INFO: Warnings written to /usr/local/src/test/build/test/warntest.txt
2044 INFO: Graph cross-reference written to /usr/local/src/test/build/test/xref-test.html
2079 INFO: checking PYZ
2079 INFO: Building PYZ because out00-PYZ.toc is non existent
2079 INFO: Building PYZ (ZlibArchive) /usr/local/src/test/build/test/out00-PYZ.pyz
2245 INFO: Building PYZ (ZlibArchive) /usr/local/src/test/build/test/out00-PYZ.pyz completed successfully.
2273 INFO: checking PKG
2273 INFO: Building PKG because out00-PKG.toc is non existent
2273 INFO: Building PKG (CArchive) out00-PKG.pkg
4820 INFO: Building PKG (CArchive) out00-PKG.pkg completed successfully.
4829 INFO: Bootloader /usr/lib/python2.7/site-packages/PyInstaller/bootloader/Linux-64bit/run
4829 INFO: checking EXE
4829 INFO: Building EXE because out00-EXE.toc is non existent
4829 INFO: Building EXE from out00-EXE.toc
4829 INFO: Appending archive to ELF section in EXE /usr/local/src/test/dist/test
4841 INFO: Building EXE from out00-EXE.toc completed successfully.
```

  

然后会在脚本目录下生成build和dist目录，还有test.spec文件，我们需要的脚本就在dist目录下：

```python
[root@ecs-5704-0006 test]# cd dist/
[root@ecs-5704-0006 dist]# ll
total 15048
-rwxr-xr-x 1 root root  4865824 Jun 19 17:21 test		<---这就是我们需要的二进制文件
[root@ecs-5704-0006 dist]# ./test 
hello world
```

  

（2）、带参数的脚本

```python
[root@ecs-5704-0006 test]# cat test2.py 
import sys
print("hello {}".format(sys.argv[1]))
[root@ecs-5704-0006 test]# python test2.py 12345
hello 12345
```

  

用pyinstaller打包：

```python
[root@ecs-5704-0006 test]# pyinstaller -F test2.py 
33 INFO: PyInstaller: 3.3
33 INFO: Python: 2.7.5
34 INFO: Platform: Linux-3.10.0-862.14.4.el7.x86_64-x86_64-with-centos-7.5.1804-Core
34 INFO: wrote /usr/local/src/test/test2.spec
37 INFO: UPX is not available.
38 INFO: Extending PYTHONPATH with paths
['/usr/local/src/test', '/usr/local/src/test']
38 INFO: checking Analysis
38 INFO: Building Analysis because out00-Analysis.toc is non existent
38 INFO: Initializing module dependency graph...
40 INFO: Initializing module graph hooks...
91 INFO: running Analysis out00-Analysis.toc
103 INFO: Caching module hooks...
106 INFO: Analyzing /usr/local/src/test/test2.py
106 INFO: Loading module hooks...
107 INFO: Loading module hook "hook-encodings.py"...
1777 INFO: Looking for ctypes DLLs
1777 INFO: Analyzing run-time hooks ...
1781 INFO: Looking for dynamic libraries
2047 INFO: Looking for eggs
2047 INFO: Using Python library /lib64/libpython2.7.so.1.0
2048 INFO: Warnings written to /usr/local/src/test/build/test2/warntest2.txt
2059 INFO: Graph cross-reference written to /usr/local/src/test/build/test2/xref-test2.html
2094 INFO: checking PYZ
2094 INFO: Building PYZ because out00-PYZ.toc is non existent
2094 INFO: Building PYZ (ZlibArchive) /usr/local/src/test/build/test2/out00-PYZ.pyz
2260 INFO: Building PYZ (ZlibArchive) /usr/local/src/test/build/test2/out00-PYZ.pyz completed successfully.
2288 INFO: checking PKG
2288 INFO: Building PKG because out00-PKG.toc is non existent
2288 INFO: Building PKG (CArchive) out00-PKG.pkg
4835 INFO: Building PKG (CArchive) out00-PKG.pkg completed successfully.
4843 INFO: Bootloader /usr/lib/python2.7/site-packages/PyInstaller/bootloader/Linux-64bit/run
4843 INFO: checking EXE
4843 INFO: Building EXE because out00-EXE.toc is non existent
4843 INFO: Building EXE from out00-EXE.toc
4843 INFO: Appending archive to ELF section in EXE /usr/local/src/test/dist/test2
4856 INFO: Building EXE from out00-EXE.toc completed successfully.
```

  

执行生成的二进制文件：

```python
[root@ecs-5704-0006 dist]# ./test2 9999999
hello 9999999
```