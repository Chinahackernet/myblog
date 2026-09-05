# 编译安装Python3.11

> 分类：Python / 第3章：Python基本使用
> 原文：https://www.cuiliangblog.cn/detail/section/31616038
> 来源：崔亮的博客

---

# 准备工作
> <font style="color:rgba(0, 0, 0, 0.8);">从这个版本之后，</font><font style="color:rgb(199, 37, 78);background-color:rgb(249, 242, 244);">Python</font><font style="color:rgba(0, 0, 0, 0.8);"> 采用了 </font><font style="color:rgb(199, 37, 78);background-color:rgb(249, 242, 244);">SSL</font><font style="color:rgba(0, 0, 0, 0.8);"> 的加密方式，需要依赖 </font><font style="color:rgb(199, 37, 78);background-color:rgb(249, 242, 244);">openssl-1.1.1</font><font style="color:rgba(0, 0, 0, 0.8);">。同时，如果我们开启了 </font><font style="color:rgb(199, 37, 78);background-color:rgb(249, 242, 244);">--enable-optimization</font><font style="color:rgba(0, 0, 0, 0.8);"> 优化选项，还需要依赖 </font><font style="color:rgb(199, 37, 78);background-color:rgb(249, 242, 244);">gcc9</font><font style="color:rgba(0, 0, 0, 0.8);"> 以上版本才能支持，否则会一直出现报错。</font>
>

## <font style="color:rgba(0, 0, 0, 0.8);">安装依赖包</font>
```bash
[root@loaclhost root]# yum install -y sudo vim git make cmake gcc gcc-c++ kernel-devel bzip2 mlocate sqlite-devel zlib zlib-devel libffi-devel openssl-devel libcurl-devel chrony wget dmidecode net-tools openssh-server perl-CPAN perl-IPC-Cmd
```

## 安装glibc
```bash
[root@loaclhost root]# cd /tmp
[root@loaclhost tmp]# wget --no-check-certificate http://mirrors.ustc.edu.cn/gnu/libc/glibc-2.18.tar.gz 
[root@loaclhost tmp]# tar -xvf glibc-2.18.tar.gz
[root@loaclhost tmp]# cd glibc-2.18
[root@loaclhost tmp]# mkdir build
[root@loaclhost tmp]# cd build 
[root@loaclhost tmp]# ../configure --prefix=/usr --disable-profile --enable-add-ons --with-headers=/usr/include --with-binutils=/usr/bin
[root@loaclhost tmp]# make -j 4
[root@loaclhost tmp]# make install
```

## 安装gcc9
```bash
[root@loaclhost root]# cd /tmp
[root@loaclhost tmp]# mkdir gcc9
[root@loaclhost tmp]# cd gcc9
[root@loaclhost gcc9]# wget --no-check-certificate https://ftp.gnu.org/gnu/gcc/gcc-9.2.0/gcc-9.2.0.tar.gz
[root@loaclhost gcc9]# tar zxvf gcc-9.2.0.tar.gz
[root@loaclhost gcc9]# cd gcc-9.2.0 
[root@loaclhost gcc-9.2.0]# wget --no-check-certificate ftp://gcc.gnu.org/pub/gcc/infrastructure/gmp-6.1.0.tar.bz2
[root@loaclhost gcc-9.2.0]# wget --no-check-certificate ftp://gcc.gnu.org/pub/gcc/infrastructure/mpfr-3.1.4.tar.bz2
[root@loaclhost gcc-9.2.0]# wget --no-check-certificate ftp://gcc.gnu.org/pub/gcc/infrastructure/mpc-1.0.3.tar.gz
[root@loaclhost gcc-9.2.0]# wget --no-check-certificate ftp://gcc.gnu.org/pub/gcc/infrastructure/isl-0.18.tar.bz2
[root@loaclhost gcc-9.2.0]# ls
[root@loaclhost gcc-9.2.0]# tar jxvf gmp-6.1.0.tar.bz2
[root@loaclhost gcc-9.2.0]# tar zxvf mpc-1.0.3.tar.gz
[root@loaclhost gcc-9.2.0]# tar jxvf mpfr-3.1.4.tar.bz2 
[root@loaclhost gcc-9.2.0]# tar jxvf isl-0.18.tar.bz2
[root@loaclhost gcc-9.2.0]# ln -s gmp-6.1.0 gmp
[root@loaclhost gcc-9.2.0]# ln -s mpfr-3.1.4 mpfr
[root@loaclhost gcc-9.2.0]# ln -s mpc-1.0.3 mpc
[root@loaclhost gcc-9.2.0]# ln -s isl-0.18 isl
[root@loaclhost gcc-9.2.0]# ./configure --prefix=/usr/local/gcc9 --enable-bootstrap --enable-checking=release --enable-languages=c,c++ --disable-multilib
[root@loaclhost gcc-9.2.0]# make -j 4
[root@loaclhost gcc-9.2.0]# make install 
[root@loaclhost gcc-9.2.0]# echo  "export PATH=/usr/local/gcc9/bin:$PATH" >> /etc/profile.d/gcc.sh
[root@loaclhost gcc-9.2.0]# source /etc/profile.d/gcc.sh
[root@loaclhost gcc-9.2.0]# ln -sv /usr/local/gcc9/include/ /usr/include/gcc
[root@loaclhost gcc-9.2.0]# echo "/usr/local/gcc9/lib64" >> /etc/ld.so.conf.d/gcc.conf
[root@loaclhost gcc-9.2.0]# ldconfig -v
[root@loaclhost gcc-9.2.0]# ldconfig -p |grep gcc
[root@loaclhost gcc-9.2.0]# ln -sf /usr/local/gcc9/bin/g++ /usr/bin/g++
[root@loaclhost gcc-9.2.0]# ln -sf /usr/local/gcc9/bin/gcc /usr/bin/gcc
[root@loaclhost gcc-9.2.0]# ln -sf /usr/local/gcc9/bin/c++ /usr/bin/c++
[root@loaclhost gcc-9.2.0]# ln -sf /usr/local/gcc9/bin/cc /usr/bin/cc
```

## 安装openssl
```bash
[root@loaclhost root]# cd /usr/local/src/
[root@loaclhost src]# wget --no-check-certificate https://www.openssl.org/source/openssl-3.0.7.tar.gz
[root@loaclhost src]# tar -xvf openssl-3.0.7.tar.gz
[root@loaclhost src]# cd openssl-3.0.7
[root@loaclhost openssl-3.0.7]# ./config --prefix=/usr/local/openssl --openssldir=/usr/local/openssl no-shared zlib-dynamic
[root@loaclhost openssl-3.0.7]# make -j 4
[root@loaclhost openssl-3.0.7]# make install
[root@loaclhost openssl-3.0.7]# ln -s /usr/local/openssl/include/openssl /usr/include/openssl
[root@loaclhost openssl-3.0.7]# ln -s /usr/local/openssl/lib/libssl.so.1.1 /usr/local/lib64/libssl.so
[root@loaclhost openssl-3.0.7]# ln -s /usr/local/openssl/lib/libssl.so.1.1 /usr/lib64/libssl.so.1.1
[root@loaclhost openssl-3.0.7]# ln -s /usr/local/openssl/lib/libcrypto.so.1.1 /usr/lib64/libcrypto.so.1.1
[root@loaclhost openssl-3.0.7]# ln -s /usr/local/openssl/bin/openssl /usr/bin/openssl
[root@loaclhost openssl-3.0.7]# ln -s /usr/local/openssl/lib/libcrypto.so.1.1 /usr/lib64/libcrypto.so.1.1
[root@loaclhost openssl-3.0.7]# rm -rf /usr/lib64/libcrypto.so.1.1
[root@loaclhost openssl-3.0.7]# ln -s /usr/local/openssl/lib/libcrypto.so.1.1 /usr/lib64/libcrypto.so.1.1
[root@loaclhost openssl-3.0.7]# ln -s /usr/local/openssl/bin/openssl /usr/bin/openssl
[root@loaclhost openssl-3.0.7]# rm -rf /usr/bin/openssl
[root@loaclhost openssl-3.0.7]# ln -s /usr/local/openssl/bin/openssl /usr/bin/openssl
[root@loaclhost openssl-3.0.7]# echo "/usr/local/openssl/lib64" >> /etc/ld.so.conf
[root@loaclhost openssl-3.0.7]# ldconfig -v
[root@loaclhost openssl-3.0.7]# openssl version
OpenSSL 3.0.7 1 Nov 2022 (Library: OpenSSL 3.0.7 1 Nov 2022)
```

# 安装python
## 下载源码包
下载地址：[https://www.python.org/downloads/](https://www.python.org/downloads/)

选择合适的版本.tar.xz结尾的安装包文件

```bash
[root@loaclhost root]# cd /usr/local/src
[root@loaclhost src]# wget https://www.python.org/ftp/python/3.11.0/Python-3.11.0.tar.xz
[root@loaclhost src]# tar -xvf Python-3.11.0.tar.xz 
[root@loaclhost src]# ls
Python-3.11.0  Python-3.11.0.tar.xz
[root@loaclhost src]# cd Python-3.11.0/
```

## 编译安装
```bash
[root@localhost Python-3.11.0]# CFLAGS="-I/usr/local/openssl/include" LDFLAGS="-L/usr/local/openssl/lib64"
[root@localhost Python-3.11.0]# ./configure --enable-optimizations --enable-loadable-sqlite-extensions --prefix=/usr/local/python3.11 --with-openssl=/usr/local/openssl
[root@localhost Python-3.11.0]# make -j 4 
[root@localhost Python-3.11.0]# make install 
```

# 配置环境变量
## 修改环境变量配置
```bash
# vim ~/.bashrc
export PATH=$PATH:/usr/local/python3.11.0/bin
# source ~/.bashrc 
```

## 验证
```bash
# python3.11
Python 3.11.0 (main, Nov 28 2022, 17:41:34) [GCC 4.8.5 20150623 (Red Hat 4.8.5-44)] on linux
Type "help", "copyright", "credits" or "license" for more information.
```

# 

