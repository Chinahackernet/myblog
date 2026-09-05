# 一、获取镜像

官方提供了一个公共镜像仓库Docker Hub，默认是从这上面获取镜像的。

  

搜素镜像使用docker search 命令：

```plain
# docker search --help
Usage:	docker search [OPTIONS] TERM
Search the Docker Hub for images
Options:
  -f, --filter filter   Filter output based on conditions provided
      --format string   Pretty-print search using a Go template
      --limit int       Max number of search results (default 25)
      --no-trunc        Don't truncate output

```

  

拉取镜像使用docker pull 命令：

```plain
# docker pull --help
Usage:	docker pull [OPTIONS] NAME[:TAG|@DIGEST]
Pull an image or a repository from a registry
Options:
  -a, --all-tags                Download all tagged images in the repository
      --disable-content-trust   Skip image verification (default true)

```

在拉取镜像的时候，如果不指定版本号，默认是拉取版本为latest的镜像。

  

如果不是拉取Docker Hub上的镜像，需要指定私有仓库地址。比如在quay.io上拉取busybox，命令如下:

```plain
docker pull quay.io/quay/busybox
```

  

# 二、列出镜像

如果我们想要看一下我们本地有哪些镜像，可以使用如下命令：

```plain
# docker image ls
REPOSITORY                    TAG                 IMAGE ID            CREATED             SIZE
busybox                       latest              db8ee88ad75f        9 days ago          1.22MB
```

  

# 三、镜像的大小

如果仔细观察会注意到这里标识的所占用空间和在 Docker Hub 上看到的镜像大小不同。这是因为 Docker Hub 中显示的体积是压缩后的体积。在镜像下载和上传过程中镜像是保持着压缩状态的，因此 Docker Hub 所显示的大小是网络传输中更关心的流量大小。而`docker image ls`显示的是镜像下载到本地后，展开的大小，准确说，是展开后的各层所占空间的总和，因为镜像到本地后，查看空间的时候，更关心的是本地磁盘空间占用的大小。

  

另外一个需要注意的问题是，`docker image ls`列表中的镜像体积总和并非是所有镜像实际硬盘消耗。由于 Docker 镜像是多层存储结构，并且可以继承、复用，因此不同镜像可能会因为使用相同的基础镜像，从而拥有共同的层。由于 Docker 使用`Union FS`，相同的层只需要保存一份即可，因此实际镜像硬盘占用空间很可能要比这个列表镜像大小的总和要小的多。你可以通过以下命令来便捷的查看镜像、容器、数据卷所占用的空间。

```plain
# docker system df
```

  

# 四、启动容器

有了镜像之后，我们就可以基于这个镜像启动一个容器，启动容器的基本步骤是先创建一个容器，然后再start。不过docker 推出了一个docker run命令，可以帮我们完成那两步操作，如果本地没有这个镜像，就会去指定的仓库拉取，然后再创建并启动 容器。如果本地存在，则直接创建并启动容器。

  

当使用docker run来启动一个容器时，会进行如下操作：

-   检查本地是否存在指定的镜像，不存在就从公有仓库下载
-   利用镜像创建并启动一个容器
-   分配一个文件系统，并在只读的镜像层外面挂载一层可读写层
-   从宿主主机配置的网桥接口中桥接一个虚拟接口到容器中去
-   从地址池配置一个 ip 地址给容器
-   执行用户指定的应用程序
-   执行完毕后容器被终止

  

下面我们以docker run来启动一个容器：

```plain
# docker run -it --rm --name my_app busybox
```

  

参数的简单介绍，具体详情可以使用docker run --help查看。

-   \-it：这是两个参数，一个是 -i：交互式操作，一个是 -t 终端。我们这里打算进入 bash 执行一些命令并查看返回结果，因此我们需要交互式终端。
-   \--rm：这个参数是说容器退出后随之将其删除。默认情况下，为了排障需求，退出的容器并不会立即删除，除非手动 docker rm。我们这里只是随便执行个命令，看看结果，不需要排障和保留结果，因此使用`--rm`可以避免浪费空间
-   \--name：是为这个容器指定一个名字

  

进入容器后，就可以进行shell操作，当然不是所有的shell命令容器里都有。如果想退出容器可以使用exit命令。

  

# 五、启动已终止容器

如果一个容器已经终止了，可以通过如下命令重新启动这个容器：

```plain
# docker container start DOCKER_ID
或者
# docker start DOCKER_ID
```

  

# 六、后台运行容器

如果想让一个容器在后台运行，在启动容器的时候可以指定-d参数。

  

如果不使用-d参数，容器会把输出结果显示的打印在屏幕上：

```plain
# docker run ubuntu /bin/sh -c "while true; do echo hello world; sleep 1; done"
hello world
hello world
hello world
hello world

```

  

如果使用-d参数，此时并不会把输出显示的打印在屏幕上，我们可以通过docker logs命令来查看：

```plain
# docker run -d ubuntu /bin/sh -c "while true; do echo hello world; sleep 1; done"
46778af5088df71c6560e7b2d994712964b8b3bf84c5fea27ff3f4ccc636e70e
# docker logs 46778af5088d
hello world
hello world
hello world
hello world
hello world
hello world
hello world
```

  

注意：容器是否会长久运行，是和docker run指定的命令有关，和-d参数无关。

  

# 七、终止容器

可以使用`docker container stop`来终止一个运行中的容器。此外，当 Docker 容器中指定的应用终结时，容器也自动终止。

```plain
# docker container stop 46778af5088d
```

  

当然也可以直接使用docker stop命令来停止容器。

  

# 八、进入容器

在使用`-d`参数时，容器启动后会进入后台。某些时候需要进入容器进行操作：**exec 命令 -i -t 参数**。

只用`-i`参数时，由于没有分配伪终端，界面没有我们熟悉的`Linux`命令提示符，但命令执行结果仍然可以返回。 当`-i -t`参数一起使用时，则可以看到我们熟悉的 `Linux`命令提示符。

  

比如我们用以下命令来启动一个容器：

```plain
# docker run -d --name hello ubuntu /bin/sh -c "while true; do echo hello world; sleep 1; done"
```

  

然后通过exec来进入容器：

```plain
# docker exec -it hello /bin/bash
```

  

# 九、删除容器

可以使用docker container rm来删除容器：

  

```plain
# docker container rm hello
```

  

也可用使用docker rm容器名来删除，如果要删除一个运行中的容器，可以添加-f参数。Docker 会发送 SIGKILL信号给容器。

  

用docker container ls -a (或者docker ps -a)命令可以查看所有已经创建的包括终止状态的容器，如果数量太多要一个个删除可能会很麻烦，用下面的命令可以清理掉所有处于终止状态的容器。

```plain
# docker container prune
或者
# docker ps -aq
```

  

# 十、删除本地镜像

可以使用如下命令来删除本地镜像：

```plain
# docker image rm [选项] <镜像1> [<镜像2> ...]
或者
# docker rmi 镜像名
```

  

# 十一、定制镜像

如果我们基于一个镜像启动容器后做了很多操作，如果不小心将这个容器删除了，那么我们所有的操作和配置都不在了，这时候我们可以使用docker commit命令来将我们修改后的容器重新定制为镜像，下次我们可以直接基于这个新的镜像启动容器，这样我们所有的操作配置都还存在。

  

比如我们启动一个nginx容器：

```plain
# docker run -itd --name my_web -p 80:80 nginx
```

  

然后我们进入这个容器做配置：

```plain
# docker exec -it my_web /bin/bash
root@35aae505ffff:/# echo '<h1>Hello, Docker!</h1>' > /usr/share/nginx/html/index.html
```

  

我们可以通过docker diff命令来查看具体的改动：

```plain
# docker diff my_web
C /root
A /root/.bash_history
C /usr
C /usr/share
C /usr/share/nginx
C /usr/share/nginx/html
C /usr/share/nginx/html/index.html
C /run
A /run/nginx.pid
C /var
C /var/cache
C /var/cache/nginx
A /var/cache/nginx/client_temp
A /var/cache/nginx/fastcgi_temp
A /var/cache/nginx/proxy_temp
A /var/cache/nginx/scgi_temp
A /var/cache/nginx/uwsgi_temp
```

  

下面我们将容器保存为镜像：

```plain
# docker commit --author "Joker" --message "Change Home Page" my_web nginx:v2.0.0
```

  

查看我们刚制作的镜像

```plain
# docker image ls
REPOSITORY                    TAG                 IMAGE ID            CREATED             SIZE
nginx                         v2.0.0              5bde0491af12        33 seconds ago      109MB

```

  

我们可以通过docker history来查看镜像内的历史记录，可以看到每层的操作明细：

```plain
# docker history nginx:v2.0.0
IMAGE               CREATED              CREATED BY                                      SIZE                COMMENT
5bde0491af12        About a minute ago   nginx -g daemon off;                            97B                 Change Home Page
98ebf73aba75        10 days ago          /bin/sh -c #(nop)  CMD ["nginx" "-g" "daemon…   0B                  
<missing>           10 days ago          /bin/sh -c #(nop)  STOPSIGNAL SIGTERM           0B                  
<missing>           10 days ago          /bin/sh -c #(nop)  EXPOSE 80                    0B                  
<missing>           10 days ago          /bin/sh -c ln -sf /dev/stdout /var/log/nginx…   22B                 
<missing>           10 days ago          /bin/sh -c set -x     && addgroup --system -…   54.1MB              
<missing>           10 days ago          /bin/sh -c #(nop)  ENV PKG_RELEASE=1~stretch    0B                  
<missing>           10 days ago          /bin/sh -c #(nop)  ENV NJS_VERSION=0.3.3        0B                  
<missing>           10 days ago          /bin/sh -c #(nop)  ENV NGINX_VERSION=1.17.1     0B                  
<missing>           10 days ago          /bin/sh -c #(nop)  LABEL maintainer=NGINX Do…   0B                  
<missing>           2 weeks ago          /bin/sh -c #(nop)  CMD ["bash"]                 0B                  
<missing>           2 weeks ago          /bin/sh -c #(nop) ADD file:966bd7368f1e5a3e4…   55.3MB      
```

  

用新的镜像启动容器：

```plain
# docker run -itd --name my_web -p 80:80 nginx:v2.0.0
# curl localhost
<h1>Hello, Docker!</h1>
```

  

注：docker commit 命令除了学习之外，还有一些特殊的应用场合，比如被入侵后保存现场等。但是，不要使用 docker commit 定制镜像，定制镜像应该使用Dockerfile来完成。