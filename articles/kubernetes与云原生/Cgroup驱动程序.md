### Cgroup 驱动程序[](https://kubernetes.io/zh/docs/setup/production-environment/container-runtimes/#cgroup-%E9%A9%B1%E5%8A%A8%E7%A8%8B%E5%BA%8F)

当某个 Linux 系统发行版使用 systemd 作为其初始化系统时，初始化进程会生成并使用一个 root 控制组 （`cgroup`），并充当 cgroup 管理器。 systemd 与 cgroup 集成紧密，并将为每个进程分配 cgroup。 您也可以配置容器运行时和 kubelet 使用 `cgroupfs`。 连同 systemd 一起使用 `cgroupfs` 意味着将有两个不同的 cgroup 管理器。

控制组用来约束分配给进程的资源。 单个 cgroup 管理器将简化分配资源的视图，并且默认情况下将对可用资源和使用中的资源具有更一致的视图。 当有两个管理器时，最终将对这些资源产生两种视图。 在此领域我们已经看到案例，某些节点配置让 kubelet 和 docker 使用 `cgroupfs`，而节点上运行的其余进程则使用 systemd；这类节点在资源压力下会变得不稳定。

更改设置，令容器运行时和 kubelet 使用 `systemd` 作为 cgroup 驱动，以此使系统更为稳定。 请注意在 docker 下设置 `native.cgroupdriver=systemd` 选项。

/etc/docker/daemon.json

```shell
{
 "exec-opts": ["native.cgroupdriver=systemd"],
 "registry-mirrors" : [
 "https://ot2k4d59.mirror.aliyuncs.com/"
 ]
}
```

  

> **警告:**
> 
> 强烈建议不要更改已加入集群的节点的 cgroup 驱动。 如果 kubelet 已经使用某 cgroup 驱动的语义创建了 pod，尝试更改运行时以使用别的 cgroup 驱动，为现有 Pods 重新创建 PodSandbox 时会产生错误。 重启 kubelet 也可能无法解决此类问题。 推荐将工作负载逐出节点，之后将节点从集群中删除并重新加入。