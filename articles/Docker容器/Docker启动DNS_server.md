配置一个DNS服务器，能让其他容器或者主机可以解析域名gitlab.example.com

  

## 1.启动DNS服务器

找一台新的linux服务器，安装docker，然后在上创建一个dnsmasq的容器

```plain
docker run -d -p 53:53/tcp -p 53:53/udp --cap-add=NET_ADMIN --name=dns-server andyshinn/dnsmasq
```

## 2.配置DNS服务

进入容器

```plain
docker ecec -it dns-server /bin/sh
```

首先配置上行真正的dns服务器地址，毕竟你只是本地的一个代理，不了解外部规则，创建文件：

```plain
vi /etc/reslov.dnsmasq
nameserver 114.114.114.114
nameserver 8.8.8.8
```

配置本地解析规则，新建配置文件

```plain
vi /etc/dnsmasqhosts
10.211.55.20 gitlab.examlpe.com
```

修改dnsmasq的配置文件，指定刚才新建的配置文件

```plain
vi /etc/reslov.dnsmasq
resolv-file=/etc/reslov.dnsmasq
addn-hosts=/etc/dnsmasqhosts
```

退出容器回到宿主机，重启dns-server容器服务

```plain
docker restart dns-server
```

## 3.测试

在gitlab ci机器上修改reslov.conf

```plain
vi /etc/reslov.conf
nameserver 10.211.55.20
```

其中10.211.55.20地址是我们的dns-server容器所在服务器地址

然后本地ping测试是否可以通gitlab.examlpe.com

  

  

### 1.Mac OS上安装Docker

参考 [https://docs.docker.com/install/linux/docker-ce/centos/](https://links.jianshu.com/go?to=https%3A%2F%2Fdocs.docker.com%2Finstall%2Flinux%2Fdocker-ce%2Fcentos%2F)

macOS 我们可以使用 Homebrew 来安装 Docker。

Homebrew 的 Cask 已经支持 Docker for Mac，因此可以很方便的使用 Homebrew Cask 来进行安装：

```plain
$ brew cask install docker
==> Creating Caskroom at /usr/local/Caskroom
==> We'll set permissions properly so we won't need sudo in the future
Password:          # 输入 macOS 密码
==> Satisfying dependencies
==> Downloading https://download.docker.com/mac/stable/21090/Docker.dmg
######################################################################## 100.0%
==> Verifying checksum for Cask docker
==> Installing Cask docker
==> Moving App 'Docker.app' to '/Applications/Docker.app'.
&#x1f37a;  docker was successfully installed!
```

在载入 Docker app 后，点击 Next，可能会询问你的 macOS 登陆密码，你输入即可。之后会弹出一个 Docker 运行的提示窗口，状态栏上也有有个小鲸鱼的图标（![](assets/docker容器/Docker启动DNS_server/Docker启动DNS_server-1.png)）。