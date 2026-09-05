# python版本与虚拟环境管理

> 分类：Python / 第3章：Python基本使用
> 原文：https://www.cuiliangblog.cn/detail/section/31616395
> 来源：崔亮的博客

---

# 多版本管理
由于各个 pip 包对 python 版本支持不同，在实际开发过程中，经常需要在不同 python 版本直接切换。此时就需要 python 版本管理工具，<font style="color:rgb(25, 27, 31);">这就是</font>`<font style="color:rgb(25, 27, 31);background-color:rgb(248, 248, 250);">pyenv</font>`<font style="color:rgb(25, 27, 31);">，一个简单的</font>`<font style="color:rgb(25, 27, 31);background-color:rgb(248, 248, 250);">Python</font>`<font style="color:rgb(25, 27, 31);">版本管理器，可以轻松地在各个</font>`<font style="color:rgb(25, 27, 31);background-color:rgb(248, 248, 250);">Python</font>`<font style="color:rgb(25, 27, 31);">版本之间进行切换。</font>

## <font style="color:rgb(25, 27, 31);">安装 pyenv</font>
```bash
curl https://pyenv.run | bash
# 或
curl -L https://github.com/pyenv/pyenv-installer/raw/master/bin/pyenv-installer | bash
```

## 配置环境变量
这一步就是把PYENV以及更新后的PATH配置成环境变量，官方文档按照shell类型进行了分类，根据自己情况选择即可。

+ bash 配置如下：

```bash
echo 'export PYENV_ROOT="$HOME/.pyenv"' >> ~/.bash_profile
echo 'export PATH="$PYENV_ROOT/bin:$PATH"' >> ~/.bash_profile
```

+ zsh 配置如下

```bash
echo 'export PYENV_ROOT="$HOME/.pyenv"' >> ~/.zshrc
echo 'export PATH="$PYENV_ROOT/bin:$PATH"' >> ~/.zshrc
```

## 初始化
<font style="color:rgb(25, 27, 31);">配置完环境变量后还要进行初始化操作，文档同样按</font>`<font style="color:rgb(25, 27, 31);background-color:rgb(248, 248, 250);">shell</font>`<font style="color:rgb(25, 27, 31);">类型进行了分类。</font>

```bash
# bash
echo -e 'if command -v pyenv 1>/dev/null 2>&1; then\n  eval "$(pyenv init -)"\nfi' >> ~/.bash_profile
source ~/.bash_profile

# Zsh
echo -e 'if command -v pyenv 1>/dev/null 2>&1; then\n  eval "$(pyenv init -)"\nfi' >> ~/.zshrc
source ~/.zshrc
```

## 验证
<font style="color:rgb(25, 27, 31);">输入</font>`<font style="color:rgb(25, 27, 31);background-color:rgb(248, 248, 250);">pyenv</font>`<font style="color:rgb(25, 27, 31);">，输出如下信息就表明安装成功了</font>

```bash
# pyenv --version                                                                                                                                                
pyenv 2.6.12
```

## 使用 pyenv
1. <font style="color:rgb(25, 27, 31);">查找需要安装的</font>`<font style="color:rgb(25, 27, 31);background-color:rgb(248, 248, 250);">Python</font>`<font style="color:rgb(25, 27, 31);">版本</font>

```bash
# pyenv install -l | grep 3.13                                                                                                                                   
  3.13.0
  3.13.0t
  3.13-dev
  3.13t-dev
  3.13.1
  3.13.1t
  3.13.2
  3.13.2t
  3.13.3
  3.13.3t
  3.13.4
  3.13.4t
  3.13.5
  3.13.5t
  3.13.6
  3.13.6t
  3.13.7
  3.13.7t
  3.13.8
  3.13.8t
  3.13.9
  3.13.9t
  miniconda3-3.13-25.3.1-1
  miniconda3-3.13-25.5.1-0
  miniconda3-3.13-25.5.1-1
  miniconda3-3.13-25.7.0-2
  pypy2.7-7.3.13-src
  pypy2.7-7.3.13
  pypy3.9-7.3.13-src
  pypy3.9-7.3.13
  pypy3.10-7.3.13-src
  pypy3.10-7.3.13
```

2. 安装 3.13.9 版本的 python

```bash
# pyenv install 3.13.9
Installing Python-3.13.9...
Installed Python-3.13.9 to /root/.pyenv/versions/3.13.9
```

如果安装报错，通常是系统缺少开发相关环境

```python
apt update
apt install -y build-essential
apt install -y \
  libssl-dev \
  zlib1g-dev \
  libbz2-dev \
  libreadline-dev \
  libsqlite3-dev \
  libncursesw5-dev \
  xz-utils \
  tk-dev \
  libxml2-dev \
  libxmlsec1-dev \
  libffi-dev \
  liblzma-dev
```

3. 切换 python 版本

<font style="color:rgb(25, 27, 31);">查看安装的版本，一个是系统自带的</font>`<font style="color:rgb(25, 27, 31);background-color:rgb(248, 248, 250);">Python3.12</font>`<font style="color:rgb(25, 27, 31);">，一个是</font>`<font style="color:rgb(25, 27, 31);background-color:rgb(248, 248, 250);">pyenv</font>`<font style="color:rgb(25, 27, 31);">安装的</font>`<font style="color:rgb(25, 27, 31);background-color:rgb(248, 248, 250);">Python3.13</font>`<font style="color:rgb(25, 27, 31);">：</font>

```bash
# pyenv versions                                                                                                                                   
* system (set by /root/.pyenv/version)
  3.13.9
```

切换 python3.13

```bash
# pyenv global 3.13.9                                                                                                                              
# pyenv versions                                                                                                                                   
  system
* 3.13.9 (set by /root/.pyenv/version)
# python                                                                                                                                           
Python 3.13.9 (main, Nov  2 2025, 12:41:52) [GCC 13.3.0] on linux
Type "help", "copyright", "credits" or "license" for more information.
>>> exit()
# pip -V                                                                                                                                           
pip 25.2 from /root/.pyenv/versions/3.13.9/lib/python3.13/site-packages/pip (python 3.13)
```

## 离线安装
由于下载速度或者网不行，那么就跳过 `pyenv` 下载，自己下载，然后放到它的缓存文件。

获取安装包地址

```python
pyenv install 3.13.13
Downloading Python-3.13.13.tar.xz...
-> https://www.python.org/ftp/python/3.13.13/Python-3.13.13.tar.xz
```

手动下载如下文件

```python
wget https://www.python.org/ftp/python/3.13.13/Python-3.13.13.tar.xz
```

将文件移动到 install_cache 目录

```python
mkdir ~/.pyenv/cache                       
mv Python-3.13.13.tar.xz ~/.pyenv/cache/
```

然后再次执行安装

```python
pyenv install 3.13.13
```

# 虚拟环境管理
## 安装软件包
```bash
# pip install virtualenv
# virtualenv --version                                                                                                                          
virtualenv 20.27.0 from /root/.local/share/pipx/venvs/virtualenv/lib/python3.12/site-packages/virtualenv/__init__.py
```

## 创建虚拟环境
```bash
# mkdir demo                                                                                                                                                     
# cd demo                                                                                                                                                        
# virtualenv venv                                                                                                                                         
created virtual environment CPython3.12.3.final.0-64 in 182ms
  creator CPython3Posix(dest=/tmp/demo/venv, clear=False, no_vcs_ignore=False, global=False)
  seeder FromAppData(download=False, pip=bundle, via=copy, app_data_dir=/root/.local/share/virtualenv)
    added seed packages: pip==24.3.1
  activators BashActivator,CShellActivator,FishActivator,NushellActivator,PowerShellActivator,PythonActivator
```

## 激活虚拟环境
```bash
# source venv/bin/activate                                                                                                                                  
(venv)  ⚡ root@liang-pc  /tmp/demo  
# pip list                                                                                                                                           
Package Version
------- -------
pip     24.3.1
```

## 退出虚拟环境
```bash
# deactivate                                                                                                                                         
# pip list                                                                                                                                                  
Package      Version
------------ -------
distlib      0.4.0
filelock     3.20.0
pip          25.3
platformdirs 4.5.0
virtualenv   20.35.4
```

 


