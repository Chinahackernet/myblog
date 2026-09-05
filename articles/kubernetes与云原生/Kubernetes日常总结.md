#### 1、kubelet报容器进程 no space left on device,最后导致cannot allocate memory ,node节点死机

问题原因：pid达到上限

  

（1）、查看当前pid的号码

```shell
ps aux
```

（2）、查看pid上限

  

```shell
sysctl kernel.pid_max
kernel.pid_max = 57344
```

  

解决方法:

暂时只能提高pid\_max的上限

```shell
sysctl -w kernel.pid_max=1024576
```

  

并修改配置文件,使开机自启

```shell
vim /etc/sysctl.conf
kernel.pid_max=1024576
```