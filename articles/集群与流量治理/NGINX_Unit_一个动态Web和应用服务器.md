NGINX Unit 是一个动态Web和应用服务器，可以运行多种编程语言的应用。Unit 是轻量级的、支持多种语言，并且可以通过API进行动态配置。Unit 的设计允许开发或运维需要的情况下，重新配置特定应用参数。

  

目前已经发布1.21.0版本，其主要特性有：

-   可通过RESTful JSON API进行动态配置调整
-   可以零中断更新配置
-   支持正则进行筛选和调度
-   可以同时部署多语言多版本应用
-   可以实现动态负载均衡
-   为支持的语言提供公共语言API

  

支持的语言有：

-   [Assembly](https://www.nginx.com/blog/nginx-unit-adds-assembly-language-support/): via the embedded **libunit** library
-   [Go](https://unit.nginx.org/configuration/#configuration-external): by [overloading](https://unit.nginx.org/installation/#installation-go-package) the **http** module
-   [JavaScript (Node.js)](https://unit.nginx.org/configuration/#configuration-external): by [overloading](https://unit.nginx.org/installation/#installation-nodejs-package) the **http** and **websocket** modules
-   [Java](https://unit.nginx.org/configuration/#configuration-java): via the Servlet Specification 3.1 and WebSocket APIs
-   [Perl](https://unit.nginx.org/configuration/#configuration-perl): via PSGI
-   [PHP](https://unit.nginx.org/configuration/#configuration-php): via the **embed** SAPI
-   [Python](https://unit.nginx.org/configuration/#configuration-python): via WSGI and ASGI with WebSocket support
-   [Ruby](https://unit.nginx.org/configuration/#configuration-ruby): via the Rack API

  

更多可以去官方查看：[https://unit.nginx.org/](https://unit.nginx.org/)

  

### 安装

#### 在CentOS上安装

添加yum源

```shell
cat >> /etc/yum.repos.d/unit.repo <EOF
[unit]
name=unit repo
baseurl=https://packages.nginx.org/unit/centos/$releasever/$basearch/
gpgcheck=0
enabled=1
EOF
```

安装

```shell
sudo yum install unit
sudo yum install unit-devel unit-go unit-jsc8 unit-jsc11 \
      unit-perl unit-php unit-python27 unit-python36
```

启动

```shell
systemctl start unit
systemctl enable unit
```

socket位置：/var/run/unit/control.sock

log位置：/var/log/unit/unit.log

  

#### 在Ubuntu上安装

下载密钥

```shell
sudo curl -sL https://nginx.org/keys/nginx_signing.key | sudo apt-key add -
```

增加源

```shell
deb https://packages.nginx.org/unit/ubuntu/ groovy unit
deb-src https://packages.nginx.org/unit/ubuntu/ groovy unit
```

安装

```shell
sudo apt update
sudo apt install unit
sudo apt install unit-dev unit-go unit-jsc11 unit-jsc13 unit-jsc14 unit-jsc15 \
              unit-perl unit-php unit-python3.8 unit-ruby
```

socket位置：/var/run/unit/control.sock

log位置：/var/log/unit/unit.log

  

#### 在Docker上安装

在Docker上安装更简单了，官方已经做好了镜像，运行即可。如下：

```shell
docker pull nginx/unit
docker run -d nginx/unit
```

  

### 使用

我这里是直接在CentOS上安装的。

#### 测试PHP

首先创建一个目录/opt/php，然后在里面创建一个index.php文件，文件内容如下：

```shell
mkdir /opt/php
cat >> /opt/php/index.php <EOF
<html>
 <head>
  <title>PHP 测试</title>
 </head>
 <body>
 <?php echo '<p>Hello World，Joker is coming.</p>'; ?>
 </body>
</html>
EOF
```

然后创建一个php.json文件，内容如下：

```shell
cat >> php.json <EOF
{
        "listeners": {
            "0.0.0.0:8300": {
                "pass": "applications/blogs"
            }
        },

        "applications": {
            "blogs": {
                "type": "php",
                "root": "/opt/php"
            }
        }
    }
EOF
```

其中：

-   listeners：指定监听的地址以及绑定的应用
-   applications：应用配置

-   type：应用开发语言
-   root：应用根目录

然后使用以下命令启动：

```shell
curl -X PUT -d @php.json --unix-socket /var/run/unit/control.sock http://localhost/config/
```

启动成功会输出以下内容：

```shell
{
        "success": "Reconfiguration done."
}
```

然后就可以通过浏览器访问：http://IP:8300，如下：

![image.png](assets/集群与流量治理/NGINX_Unit_一个动态Web和应用服务器/NGINX_Unit_一个动态Web和应用服务器-1.png)

通过如下命令查看配置：

```shell
curl  --unix-socket /var/run/unit/control.sock http://localhost/config/
{
	"listeners": {
		"0.0.0.0:8300": {
			"pass": "applications/blogs"
		}
	},

	"applications": {
		"blogs": {
			"type": "php",
			"root": "/opt/php"
		}
	}
}

```

删除应用用以下命令

```shell
curl -X DELETE -d @php.json --unix-socket /var/run/unit/control.sock http://localhost/config/
```

  

#### 测试java

在/opt/java下面创建一个index.jsp，并输入以下内容：

```shell
mkdir /opt/java
car >> /opt/java/index.jsp <EOF
<%@ page language="java" contentType="text/plain" %>
<%= "Hello, JSP on Unit!" %>
EOF
```

创建应用json文件，如下：

```shell
cat >> java.json <EOF 
{
        "listeners": {
            "0.0.0.0:8400": {
                "pass": "applications/myapp"
            }
        },

        "applications": {
            "myapp": {
                "type": "java",
                "webapp": "/opt/java/",
            }
        }
    }
EOF
```

然后创建应用

```shell
# curl -X PUT -d @java.json --unix-socket /var/run/unit/control.sock http://localhost/config/
{
	"success": "Reconfiguration done."
}
```

然后通过浏览器访问，如下：

![image.png](assets/集群与流量治理/NGINX_Unit_一个动态Web和应用服务器/NGINX_Unit_一个动态Web和应用服务器-2.png)

  

### 写在最后

nginx unit是一个很棒的项目，支持的语言也非常多，不过配置略微复杂，而且全是API操作，使用起来有的蛋疼。