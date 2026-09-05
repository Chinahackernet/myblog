# docker镜像常见问题

> 分类：Docker / 第16章：总结
> 原文：https://www.cuiliangblog.cn/detail/section/29821424
> 来源：崔亮的博客

---

1. 如何备份系统中所有的镜像？
+ 首先，备份镜像列表可以使用docker images|awk      'NR>1{print $1":"$2}'|sort > images.list。

导出所有镜像为当前目录下文件，可以使用如下命令：

    while read img; do

        echo $img

        file="${img/\//-}"

        sudo docker save --output $file.tar $img

    done < images.list

将本地镜像文件导入为Docker镜像：

    while read img; do

        echo $img

        file="${img/\//-}"

        docker load < $file.tar

    done < images.list

2. 如何批量清理临时镜像文件？
+ 可以使用docker rmi $(docker images      -q -f dangling=true)命令。
3. 如何删除所有本地的镜像？
+ 可以使用docker rmi -f $(docker      images -q)命令。
4. 如何清理Docker系统中的无用数据？
+ 可以使用docker system prune      --volumes -f命令，这个命令会自动清理处于停止状态的容器、无用的网络和挂载卷、临时镜像和创建镜像缓存。
5. 如何查看镜像内的环境变量？

可以使用docker run IMAGE env命令。

6. 本地的镜像文件都存放在哪里？

与Docker相关的本地资源（包括镜像、容器）默认存放在/var/lib/docker/目录下。以aufs文件系统为例，其中container目录存放容器信息，graph目录存放镜像信息，aufs目录下存放具体的镜像层文件。

7. 构建Docker镜像应该遵循哪些原则？

整体原则上，尽量保持镜像功能的明确和内容的精简，避免添加额外文件和操作步骤，要点包括：

+ 尽量选取满足需求但较小的基础系统镜像，例如大部分时候可以选择debian:wheezy或debian:jessie镜像，仅有不足百兆大小；
+ 清理编译生成文件、安装包的缓存等临时文件；
+ 安装各个软件时候要指定准确的版本号，并避免引入不需要的依赖；
+ 从安全角度考虑，应用要尽量使用系统的库和依赖；
+ 如果安装应用时候需要配置一些特殊的环境变量，在安装后要还原不需要保持的变量值；
+ 使用Dockerfile创建镜像时候要添加．dockerignore文件或使用干净的工作目录；
+ 区分编译环境容器和运行时环境容器，使用多阶段镜像创建。
8. 碰到网络问题，无法pull镜像，命令行指定http_proxy无效，怎么办？
+ 在Docker配置文件中添加export       http_proxy="http://<PROXY_HOST>:<PROXY_PORT>"，之后重启Docker服务即可。


