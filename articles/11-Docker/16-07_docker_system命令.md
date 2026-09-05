# docker system命令

> 分类：Docker / 第16章：总结
> 原文：https://www.cuiliangblog.cn/detail/section/29815931
> 来源：崔亮的博客

---

1. 查看docker 空间使用情况,<font style="color:#4D4D4D;">包括镜像、容器和（本地）volume。</font>

```yaml
[root@worker1 ~]# docker system df
TYPE                TOTAL               ACTIVE              SIZE                RECLAIMABLE
Images              3                   0                   319.9MB             319.9MB (100%)
Containers          0                   0                   0B                  0B
Local Volumes       1                   0                   156.5kB             156.5kB (100%)
Build Cache         0                   0                   0B                  0B
```

2. <font style="background-color:transparent;">查看实时事件（例如容器创建，删除等均会实时显示）</font>

`[root@worker1 ~]# docker system events`

3. 查看docker 系统信息（同docker info）

`[root@worker1 ~]# docker system info` 

4. docker清理(清理停止的容器，没用容器使用的网络，镜像，缓存)

```bash
[root@worker1 ~]# docker system prune
WARNING! This will remove:
  - all stopped containers
  - all networks not used by at least one container
  - all dangling images
  - all dangling build cache
Are you sure you want to continue? [y/N] y
Total reclaimed space: 0B
```




