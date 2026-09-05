优雅停止（Graceful shutdown）这个说法来自于操作系统，我们执行关机之后都得 OS 先完成一些清理操作，而与之相对的就是硬中止（Hard shutdown），比如拔电源。

到了分布式系统中，优雅停止就不仅仅是单机上进程自己的事了，往往还要与系统中的其它组件打交道。比如说我们起一个微服务，网关把一部分流量分给我们，这时：

  

-   假如我们一声不吭直接把进程杀了，那这部分流量就无法得到正确处理，部分用户受到影响。不过还好，通常来说网关或者服务注册中心会和我们的服务保持一个心跳，过了心跳超时之后系统会自动摘除我们的服务，问题也就解决了；这是硬中止，虽然我们整个系统写得不错能够自愈，但还是会产生一些抖动甚至错误。
-   假如我们先告诉网关或服务注册中心我们要下线，等对方完成服务摘除操作再中止进程，那不会有任何流量受到影响；这是优雅停止，将单个组件的启停对整个系统影响最小化。

  

按照惯例，SIGKILL 是硬终止的信号，而 SIGTERM 是通知进程优雅退出的信号，因此很多微服务框架会监听 SIGTERM 信号，收到之后去做反注册等清理操作，实现优雅退出。

  

回到 Kubernetes（下称 K8s），当我们想干掉一个 Pod 的时候，理想状况当然是 K8s 从对应的 Service（假如有的话）把这个 Pod 摘掉，同时给 Pod 发 SIGTERM 信号让 Pod 中的各个容器优雅退出就行了。但实际上 Pod 有可能犯各种幺蛾子：

-   已经卡死了，处理不了优雅退出的代码逻辑或需要很久才能处理完成。
-   优雅退出的逻辑有 BUG，自己死循环了。
-   代码写得野，根本不理会 SIGTERM。

  

因此，K8s 的 Pod 终止流程中还有一个“最多可以容忍的时间”，即 grace period（在 Pod 的 .spec.terminationGracePeriodSeconds 字段中定义），这个值默认是 30 秒，我们在执行 kubectl delete 的时候也可通过 --grace-period 参数显式指定一个优雅退出时间来覆盖 Pod 中的配置。而当 grace period 超出之后，K8s 就只能选择 SIGKILL 强制干掉 Pod 了。

  

很多场景下，除了把 Pod 从 K8s 的 Service 上摘下来以及进程内部的优雅退出之外，我们还必须做一些额外的事情，比如说从 K8s 外部的服务注册中心上反注册。这时就要用到 PreStop Hook 了，K8s 目前提供了 Exec 、 HTTP 两种 PreStop Hook，实际用的时候，需要通过 Pod 的 .spec.containers[].lifecycle.preStop 字段为 Pod 中的每个容器单独配置，比如：

  

```yaml
spec:
  contaienrs:
  - name: my-awesome-container
    lifecycle:
      preStop:
        exec:
          command: ["/bin/sh"，"-c"，"/pre-stop.sh"]
```

  

/pre-stop.sh 脚本里就可以写我们自己的清理逻辑。

比如从Eureka中下线：

```shell
curl -X POST --data DOWN http://127.0.0.1:8080/service-registry/instance-status  -H
              "Content-Type: application/vnd.spring-boot.actuator.v2+json;charset=UTF-8";sleep 30
```

其中：

-   127.0.0.1:8080代表eureka地址
-   service-registry代表注册中心
-   DOWN代表下线操作

  

最后我们串起来再整个表述一下 Pod 退出的流程：

  

1.  用户发送命令删除 Pod，使用的是默认的宽限期（30秒）
2.  API 服务器中的 Pod 会随着宽限期规定的时间进行更新，过了这个时间 Pod 就会被认为已 “死亡”。
3.  当使用客户端命令查询 Pod 状态时，Pod 显示为 “Terminating”。
4.  （和第 3 步同步进行）当 Kubelet 看到 Pod 由于步骤 2 中设置的时间而被标记为 terminating 状态时，它就开始执行关闭 Pod 流程。

1.  如果 Pod 定义了 [preStop 钩子](https://kubernetes.io/docs/concepts/containers/container-lifecycle-hooks/#hook-details)，就在 Pod 内部调用它。如果宽限期结束了，但是 `preStop` 钩子还在运行，那么就用小的（2 秒）扩展宽限期调用步骤 2。
2.  给 Pod 内的进程发送 TERM 信号。请注意，并不是所有 Pod 中的容器都会同时收到 TERM 信号，如果它们关闭的顺序很重要，则每个容器可能都需要一个 `preStop` 钩子。

5.  （和第 3 步同步进行）从服务的端点列表中删除 Pod，Pod 也不再被视为副本控制器的运行状态的 Pod 集的一部分。因为负载均衡器（如服务代理）会将其从轮换中删除，所以缓慢关闭的 Pod 无法继续为流量提供服务。
6.  当宽限期到期时，仍在 Pod 中运行的所有进程都会被 SIGKILL 信号杀死。
7.  kubelet 将通过设置宽限期为 0 （立即删除）来完成在 API 服务器上删除 Pod 的操作。该 Pod 从 API 服务器中消失，并且在客户端中不再可见。