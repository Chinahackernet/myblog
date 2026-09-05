# 一.下载Python3.7

在官网下载python3.7版本 [官网](https://www.python.org/)

# 二.安装Python3.7

## 1首先删除之前安装的python3.6

### 1.1删除python框架

Mac安装python时的默认框架目录是/Library/Frameworks/Python.framework/Versions/

  

```bash
sudo rm -rf /Library/Frameworks/Python.framework/Versions/3.6
```

  

### 1.2删除python程序目录

  

```bash
sudo rm -rf /Applications/Python\ 3.6
```

  

### 1.3删除指向python的链接

  

```bash
ls -l /usr/local/bin | grep '../Library/Frameworks/Python.framework/Versions/3.6' | awk '{print $9}' | tr -d @ | xargs rm
```

  

# 三.安装pipenv并创建pipenv项目

  

```bash
pip3.7 install pipenv
mkdir myproject
cd myproject
pipenv install
```

  

# 四.更换国内源

  

```bash
vim Pipfile
[[source]]
url = "https://pypi.org/simple"
verify_ssl = true
name = "pypi"
[packages]
[dev-packages]
[requires]
python_version = "3.7"
修改url为清华源https://pypi.tuna.tsinghua.edu.cn/simple/
```