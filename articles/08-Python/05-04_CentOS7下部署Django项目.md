# CentOS7下部署Django项目

> 分类：Python / 第5章：Django
> 原文：https://www.cuiliangblog.cn/detail/section/31616486
> 来源：崔亮的博客

---

## 下载安装Pyhton3
1. 下载到/usr/local 目录   
cd /usr/localwget [https://www.python.org/ftp/python/3.6.6/Python-3.6.6.tgz](https://www.python.org/ftp/python/3.6.6/Python-3.6.6.tgz)
2. 解压

tar -zxvf Python-3.6.6.tgz

3. 进入Python-3.6.6路径

cd Python-3.6.6

4. 编译安装到指定路径

./configure --prefix=/usr/local/python3

+ 注意：/usr/local/python3      路径可以自己指定，自己记着就行，下边要用到。
5. 安装python3

make

make install

6. 安装完成之后 建立软链接      添加变量 方便在终端中直接使用python3

ln -s /usr/local/python3/bin/python3.6 /usr/bin/python3

7. Python3安装完成之后pip3也一块安装完成，不需要再单独安装  
同样给pip3建立软链接

ln -s /usr/local/python3/bin/pip3.6 /usr/bin/pip3

8. 查看Python3和pip3安装情况

![](assets/08-Python/48b083cec47f76454ccc.png)

## 安装virtualenv，方便不同版本项目管理。
1. 安装软件包

pip3 install virtualenv

2. 建立软链接

ln -s /usr/local/python3/bin/virtualenv /usr/bin/virtualenv

3. 安装成功在根目录下建立两个文件夹，主要用于存放env和网站文件的。(个人习惯，其它人可根据自己的实际情况处理)

mkdir -p /data/env

mkdir -p /data/wwwroot

4. 切换到/data/env/下，创建指定版本的虚拟环境。

virtualenv --python=/usr/bin/python3 pyweb

5. 然后进入/data/env/pyweb/bin      启动虚拟环境：

source activate

![](assets/08-Python/7e8f1838d9924126d1e8.png)

+ 留意我标记的位置，出现(pyweb)，说明是成功进入虚拟环境。

## 虚拟环境里用pip3安django和uwsgi
1. 安装django和uwsgi

pip3 install django （如果用于生产的话，则需要指定安装和你项目相同的版本）

pip3 install uwsgi

+ 留意：uwsgi要安装两次，先在系统里安装一次，然后进入对应的虚拟环境安装一次。
2. 给uwsgi建立软链接，方便使用

ln -s /usr/local/python3/bin/uwsgi /usr/bin/uwsgi

## 启动项目并配置uwsgi
1. 运行django项目

python3 manage.py runserver 0.0.0.0:8000

2. 在项目文件里创建      uwsgi.ini 文件,编辑文件 ，设置uwsgi属性

```bash
#添加配置选择
[uwsgi]
#配置和nginx连接的socket连接
socket=127.0.0.1:9000
#配置项目路径，项目的所在目录
chdir=/home/fundservice
#配置wsgi接口模块文件路径,也就是wsgi.py这个文件所在的目录名
wsgi-file=/home/fundservice/fundService/wsgi.py
#配置启动的进程数
processes=4
#配置每个进程的线程数
threads=5
#配置启动管理主进程
master=True
#配置存放主进程的进程号文件
pidfile=uwsgi.pid
#配置dump日志记录
daemonize=uwsgi.log
#虚拟环境路径
virtualenv=/home/fundservice/env/pyweb
```

3. 通过下面的命令启动运行uwsgi

uwsgi  --ini  uwsgi.ini

显示 [uWSGI] getting INI configuration from uwsgi.ini 表明uwsgi运行成功

+ 可通过ps      -ef|grep uwsgi   查看确认是否uwsgi启动.

ini配置文件其它相关命令:

+ 停止运行uwsgi，通过包含主进程编号的文件设置停止项目  
uwsgi --stop uwsgi.pid
+ 重启uwsgi  
uwsgi --reload uwsgi.pid

## 安装nginx和配置nginx.conf文件
1. 进入home目录，执行下面命令

cd /home/wget [http://nginx.org/download/nginx-1.13.7.tar.gz](http://nginx.org/download/nginx-1.13.7.tar.gz)

2. 下载完成后，执行解压命令：

tar -zxvf nginx-1.13.7.tar.gz

3. 进入解压后的nginx-1.13.7文件夹，依次执行以下命令：  
./configure  
make  
make install
4. nginx一般默认安装好的路径为/usr/local/nginx  
在/usr/local/nginx/conf/中先备份一下nginx.conf文件，以防意外。  
cp nginx.conf nginx.conf.bak
5. 然后打开nginx.conf，把原来的内容删除，直接加入以下内容：

```bash
events {
    worker_connections  1024;
}
http {
    include       mime.types;
    default_type  application/octet-stream;
    sendfile        on;
    server {
        listen 80;
        server_name  www.django.cn; #改为自己的域名，没域名修改为127.0.0.1:80
        charset utf-8;
        location / {
           include uwsgi_params;
           uwsgi_pass 127.0.0.1:8997;  #端口要和uwsgi里配置的一样  
        }
        location /static/ {
        alias /data/wwwroot/mysite/static/; #静态资源路径
        }
    }
}
```

  6.  进入/usr/local/nginx/sbin/目录

执行./nginx -t命令先检查配置文件是否有错，没有错就执行以下命令：

./nginx

7. 终端没有任何提示就证明nginx启动成功。可以使用你的服务器地址查看，成功之后就会看到一个nginx欢迎页面。

之后，在settings.py里设置：

+ 关闭DEBUG模式。

DEBUG = False  

+ ALLOWED_HOSTS设置为* 表示任何IP都可以访问网站。

 	ALLOWED_HOSTS = ['*']

8. 访问项目的页面。

进入网站项目目录

cd /data/wwwroot/mysite/

执行下面命令(xml配置文件为例)：

 	uwsgi -x mysite.xml

9. 以上步骤都没有出错的话。

进入/usr/local/nginx/sbin/目录执行：

 	./nginx -s reload

重启nginx 。

然后在浏览器里访问你的项目地址！

 

![](assets/08-Python/5e12085351df1d4971af.png)

## 关于线上部署admin后台样式没有生效的问题
方法一：

 

1、在settings.py尾部：

STATIC_ROOT  = os.path.join(BASE_DIR, 'static')#指定样式收集目录

#或

STATIC_ROOT = '/www/mysite/mysite/static'  #指定样式收集目录

2、收集CSS样式，在终端输入：

 

python manage.py collectstatic

运行这个命令之后，就会自动把后台CSS样式收集到/static/目录下。刷新页面就能恢复样式！

 

方法二：

 

在Python安装目录下（如果使用虚拟环境，则在虚拟环境目录下）找到\Lib\site-packages\django\contrib\admin\templates目录，把里面的admin目录复制到指定目录即可。

 

注意：收集或复制前一定先在settings里配置并指定STATIC_ROOT路径，static/ 个目录可以自己定。指定的时候一定要在settings.py和nginx里指定新的路径。不然无法生效。

 

## Django启用SSL证书(https域名)
1、进入之前我们下载nginx的源码目录

cd /home/nginx-1.13.7/

2、安装PCRE库

yum -y install pcre

3、安装SSL

 

yum -y install openssl openssl-devel

4、依次执行下面两行代码重新编译一下

 

./configure



./configure --with-http_ssl_module

5、执行make

 

make

注意：是make而不是make install 

 

6、备份原来的nginx

 

cp /usr/local/nginx/sbin/nginx /usr/local/nginx/sbin/nginx.bak

7、将新的 nginx 覆盖旧安装目录

cp objs/nginx /usr/local/nginx/sbin/nginx

如果报错，刚用执行下面的命令覆盖

 

cp -rfp objs/nginx /usr/local/nginx/sbin/nginx

8、免费证书下载后有两个文件。（以阿里云免费证书为例）一个是扩展名为.pem的文件，一个是扩展名为.key的文件。.pem文件中已经包含服务器证书和CA中间证书，第一段为服务器证书，第二段为CA中间证书，您可以使用文本编辑器自行提取。.key文件是证书私钥。这里我们直接把域名证书复制到网站根目录里去就行。

9、配置nginx.conf文件。

```bash
events {
    worker_connections  1024;
}
http {
    include       mime.types;
    default_type  application/octet-stream;
    sendfile        on;
    server {
        listen 443 ssl http2;
        server_name www.django.cn django.cn;
        root /data/wwwroot/mysite;#项目路径
        charset utf-8;
        ssl_certificate    /data/wwwroot/mysite/1_www.django.cn.pem;#.pem证书路径
        ssl_certificate_key  /data/wwwroot/mysite/2_www.django.cn.key;#.key证书路径
        ssl_protocols TLSv1 TLSv1.1 TLSv1.2;
        ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:HIGH:!aNULL:!MD5:!RC4:!DHE;
        ssl_prefer_server_ciphers on;
        ssl_session_cache shared:SSL:10m;
        ssl_session_timeout 10m;
        error_page 497  https://$host$request_uri;
        location / {
           include uwsgi_params;
           uwsgi_pass 127.0.0.1:8997;
           uwsgi_param UWSGI_SCRIPT wechatProject.wsgi;
           uwsgi_param UWSGI_CHDIR /data/wwwroot/mysite/;#项目路径
           
        }
        location /static/ {
        alias /data/wwwroot/mysite/static/; #静态资源路径
        }
        access_log  /data/wwwroot/mysite/www.django.cn.log;
        error_log  /data/wwwroot/mysite/www.django.cn.error.log;
    }
}
```

留意证书的路径，我们主要是把原来的80端口，修改成443，然后再加一些SSL证书配置，大家可以和前面的nginx的配置进行对比一下。

10、测试配置文件是否正确

/usr/local/nginx/sbin/nginx -t

如果没有报错则重启nginx即可。

/usr/local/nginx/sbin/nginx -s reload

留意：使用https时，要开启服务器的443端口，如果开启了服务器还不能访问，可能需要到服务器提供商后台安全组给端口放行。


