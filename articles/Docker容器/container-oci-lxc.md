# Linux 容器、OCI 与 LXC

## 隔离原理

Linux 容器由 namespaces、cgroups、capabilities、seccomp 和 LSM 共同实现隔离；OCI 规定镜像格式和运行时接口，Docker/containerd/runc 是不同层次的实现。容器共享宿主机内核，因此不等同于虚拟机隔离。

LXC 更接近系统容器，适合运行完整用户空间和传统服务；Docker 更偏向单进程应用交付。选择时评估内核共享、启动模型、设备访问、网络、存储、升级和故障域，不能只比较启动速度。

```bash
unshare --mount --uts --ipc --net --pid --fork /bin/sh
lsns; systemd-cgtop; runc spec
```

## 安全边界

删除 privileged、host PID/network、宿主机 socket 和不必要 capabilities；使用 rootless、只读根、设备白名单、资源限制和 seccomp。系统容器要限制宿主机挂载、内核接口和 init 权限。

## 运维

容器身份、日志、网络和数据卷都要有生命周期。升级内核或运行时前先验证所有工作负载；隔离故障时保存 namespace、cgroup、进程和网络信息，不要只重启容器。

