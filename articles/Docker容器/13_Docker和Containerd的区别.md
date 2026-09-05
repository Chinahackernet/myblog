Containerd是从Docker中分离的一个项目，旨在为Kubernetes提供容器运行时，负责管理镜像和容器的生命周期。

  

在kubernetes1.20后会逐步移除docker，不过现在docker和containerd都可以同时为Kubernetes提供运行时。

-   如果是docker作为容器运行时，则调用关系是kubelet-->docker-shim-->dockerd-->containerd
-   如果是containerd作为容器运行时，则调用关系是kubelet-->cri-plugin-->containerd

  

可以看出containerd的调用链路比docker要短，但是相对的功能没有docker丰富。

  

## 镜像相关

<table class="lake-table" style="width: 715px;"><colgroup><col span="1" width="238.40000915527344" /><col span="1" width="238.40000915527344" /><col span="1" width="239.1999969482422" /></colgroup><thead><tr style="height: 33px;"><td style="text-align: left; background-color: #F5F7FA; color: #000000;">镜像相关功能</td><td style="text-align: left; background-color: #F5F7FA; color: #000000;">Docker</td><td style="text-align: left; background-color: #F5F7FA; color: #000000;">Containerd</td></tr></thead><tbody><tr style="height: 33px;"><td style="text-align: left; color: #666666;">显示本地镜像列表</td><td style="text-align: left; color: #666666;">docker images</td><td style="text-align: left; color: #666666;">crictl images</td></tr><tr style="height: 33px;"><td style="text-align: left; color: #666666;">下载镜像</td><td style="text-align: left; color: #666666;">docker pull</td><td style="text-align: left; color: #666666;">crictl pull</td></tr><tr style="height: 33px;"><td style="text-align: left; color: #666666;">上传镜像</td><td style="text-align: left; color: #666666;">docker push</td><td style="text-align: left; color: #666666;">无</td></tr><tr style="height: 33px;"><td style="text-align: left; color: #666666;">删除本地镜像</td><td style="text-align: left; color: #666666;">docker rmi</td><td style="text-align: left; color: #666666;">crictl rmi</td></tr><tr style="height: 33px;"><td style="text-align: left; color: #666666;">查看镜像详情</td><td style="text-align: left; color: #666666;">docker inspect IMAGE-ID</td><td style="text-align: left; color: #666666;">crictl inspecti IMAGE-ID</td></tr></tbody></table>

  

## 容器相关

<table class="lake-table" style="width: 715px;"><colgroup><col span="1" width="238" /><col span="1" width="238" /><col span="1" width="239" /></colgroup><thead><tr style="height: 33px;"><td style="text-align: left; background-color: #F5F7FA; color: #000000;">容器相关功能</td><td style="text-align: left; background-color: #F5F7FA; color: #000000;">Docker</td><td style="text-align: left; background-color: #F5F7FA; color: #000000;">Containerd</td></tr></thead><tbody><tr style="height: 33px;"><td style="text-align: left; color: #666666;">显示容器列表</td><td style="text-align: left; color: #666666;">docker ps</td><td style="text-align: left; color: #666666;">crictl ps</td></tr><tr style="height: 33px;"><td style="text-align: left; color: #666666;">创建容器</td><td style="text-align: left; color: #666666;">docker create</td><td style="text-align: left; color: #666666;">crictl create</td></tr><tr style="height: 33px;"><td style="text-align: left; color: #666666;">启动容器</td><td style="text-align: left; color: #666666;">docker start</td><td style="text-align: left; color: #666666;">crictl start</td></tr><tr style="height: 33px;"><td style="text-align: left; color: #666666;">停止容器</td><td style="text-align: left; color: #666666;">docker stop</td><td style="text-align: left; color: #666666;">crictl stop</td></tr><tr style="height: 33px;"><td style="text-align: left; color: #666666;">删除容器</td><td style="text-align: left; color: #666666;">docker rm</td><td style="text-align: left; color: #666666;">crictl rm</td></tr><tr style="height: 33px;"><td style="text-align: left; color: #666666;">查看容器详情</td><td style="text-align: left; color: #666666;">docker inspect</td><td style="text-align: left; color: #666666;">crictl inspect</td></tr><tr style="height: 33px;"><td style="text-align: left; color: #666666;">attach</td><td style="text-align: left; color: #666666;">docker attach</td><td style="text-align: left; color: #666666;">crictl attach</td></tr><tr style="height: 33px;"><td style="text-align: left; color: #666666;">exec</td><td style="text-align: left; color: #666666;">docker exec</td><td style="text-align: left; color: #666666;">crictl exec</td></tr><tr style="height: 33px;"><td style="text-align: left; color: #666666;">logs</td><td style="text-align: left; color: #666666;">docker logs</td><td style="text-align: left; color: #666666;">crictl logs</td></tr><tr style="height: 33px;"><td style="text-align: left; color: #666666;">stats</td><td style="text-align: left; color: #666666;">docker stats</td><td style="text-align: left; color: #666666;">crictl stats</td></tr></tbody></table>

  

## Pod相关

<table style="width: 717px;" class="lake-table"><colgroup><col><col><col></colgroup><thead><tr style="height: 33px;"><td style="text-align: left; background-color: #F5F7FA; color: #000000;">POD 相关功能</td><td style="text-align: left; background-color: #F5F7FA; color: #000000;">Docker</td><td style="text-align: left; background-color: #F5F7FA; color: #000000;">Containerd</td></tr></thead><tbody><tr style="height: 33px;"><td style="text-align: left; color: #666666;">显示 POD 列表</td><td style="text-align: left; color: #666666;">无</td><td style="text-align: left; color: #666666;">crictl pods</td></tr><tr style="height: 33px;"><td style="text-align: left; color: #666666;">查看 POD 详情</td><td style="text-align: left; color: #666666;">无</td><td style="text-align: left; color: #666666;">crictl inspectp</td></tr><tr style="height: 33px;"><td style="text-align: left; color: #666666;">运行 POD</td><td style="text-align: left; color: #666666;">无</td><td style="text-align: left; color: #666666;">crictl runp</td></tr><tr style="height: 33px;"><td style="text-align: left; color: #666666;">停止 POD</td><td style="text-align: left; color: #666666;">无</td><td style="text-align: left; color: #666666;">crictl stopp</td></tr></tbody></table>