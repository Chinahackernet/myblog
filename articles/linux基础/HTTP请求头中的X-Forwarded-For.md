```python
参考文档：https://www.cnblogs.com/diaosir/p/6890825.html
作者：weelin_area
```

## 概述

我们在做nginx方向代理的时候，为了记录整个代理过程，我们往往会在配置文件中加上如下配置：

  

```nginx
location ^~ /app/download/ {
    ...
    proxy_set_header  X-Forwarded-For $proxy_add_x_forwarded_for;
    ...
    proxy_pass http://10.1.10.203:8080;
}

```

proxy\_set\_header就是记录整个代理过程的配置。其中X-Forwarded-For(XFF)位于HTTP请求头，已经成为事实上的标准。

XFF的请求格式很简单，如下：

```nginx
X-Forwarded-For: client, proxy1, proxy2
```

由上面可以看到XFF的的内容由[IP+英文逗号+空格]组成（如果有多个代理的话），最开始的client是客户端的IP，proxy1和proxy2分别是一级代理和二级代理的IP。

假设代理如下：

![image.png](assets/linux基础/HTTP请求头中的X-Forwarded-For/HTTP请求头中的X-Forwarded-For-1.png)

如上，proxy1、proxy2和proxy3都用NG做反代，并且在它们的配置上都加上如下配置：

```nginx
proxy_set_header  X-Forwarded-For $proxy_add_x_forwarded_for;
```

那么在Real Server（NG的WEB容器）上打印的日志（日志里带$http\_x\_forwarded\_for）就会带有IP0,IP1,IP2的HTTP头，可以看到没有IP3，因为IP3是直连服务器，它会给XFF追加IP2的地址，表示它是帮proxy2做转发的，Real Server要获取IP3的地址，需通过remote Address字段获得。

同理，在proxy3上日志里只会有IP0和IP1，proxy2上日志里只有IP0，proxy1上没有IP。

  

## 测试

测试拓扑如下：

![image.png](assets/linux基础/HTTP请求头中的X-Forwarded-For/HTTP请求头中的X-Forwarded-For-2.png)

在proxy1上的配置如下：

```nginx
    server {
        listen       80 default_server;
        listen       [::]:80 default_server;
        server_name  _;
        root         /usr/share/nginx/html;

        # Load configuration files for the default server block.
        include /etc/nginx/default.d/*.conf;

        location / {
                proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
                proxy_pass http://192.168.169.130/;
        }
    }

```

在proxy2上的配置如下：

```nginx
    server {
        listen       80 default_server;
        listen       [::]:80 default_server;
        server_name  _;
        root         /usr/share/nginx/html;

        # Load configuration files for the default server block.
        include /etc/nginx/default.d/*.conf;

        location / {
                proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
                proxy_pass http://192.168.169.131/;
        }
    }

```

在proxy3的配置如下：

```nginx
    server {
        listen       80 default_server;
        listen       [::]:80 default_server;
        server_name  _;
        root         /usr/share/nginx/html;

        # Load configuration files for the default server block.
        include /etc/nginx/default.d/*.conf;

        location / {
                proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
                proxy_pass http://xxx.xxx.xxx.xxx:8888/;
        }
    }

```

proxy1,proxy2,proxy3上的日志格式如下：

```nginx
log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
                      '$status $body_bytes_sent "$http_referer" '
                      '"$http_user_agent" "$http_x_forwarded_for"';
```

Real Server日志格式如下：

```nginx
log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent $upstream_cache_status "$http_referer" '
                    '"$http_user_agent" "==$http_x_forwarded_for" "--$http_x_real_ipi"';
```

  

我在本机浏览器输入：[http://192.168.169.128/](http://192.168.169.128/)，然后分别在proxy1-3还有Real Server上抓取nginx日志，proxy1-3日志最后一个字段是$http\_x\_forwarded\_for，Real Server倒数二个字段是$http\_x\_forwarded\_for如下：

proxy1日志：

```nginx
192.168.169.1 - - [04/Jun/2019:10:57:06 +0800] "GET / HTTP/1.1" 200 20 "-" 
"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) 
Chrome/74.0.3729.169 Safari/537.36" "-"
```

proxy2日志：

```nginx
192.168.169.128 - - [04/Jun/2019:10:57:06 +0800] "GET / HTTP/1.0" 200 10 "-" 
"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) 
Chrome/74.0.3729.169 Safari/537.36" "192.168.169.1"
```

proxy3日志：

```nginx
192.168.169.130 - - [29/Mar/2019:23:29:36 +0800] "GET / HTTP/1.0" 200 10 "-" 
"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) 
Chrome/74.0.3729.169 Safari/537.36" "192.168.169.1, 192.168.169.128"
```

Real Server日志：

```nginx
183.66.224.50 - - [04/Jun/2019:10:57:03 +0800] "GET / HTTP/1.0" 200 10 - "-" 
"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) 
Chrome/74.0.3729.169 Safari/537.36" "==192.168.169.1, 192.168.169.128, 192.168.169.130" "---"
```

从上面的日志可以知道：

（1）、设置X-Forwarded-For是一个可叠加的过程；

（2）、后端服务器XFF获取不到直连服务器IP。比如Real-Server的日志中XFF字段没有proxy3的IP地址，依次类推；

（3）、代理中要配置proxy\_set\_header X-Forwarded-For $proxy\_add\_x\_forwarded\_for;