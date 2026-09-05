设置一个`preStop hook`，在hook中指定怎么优雅停止容器在K8S中，创建pod、删除pod是最频繁的操作，不论是新增还是升级都会触发。对于新增或者重建我们最关心的是什么时候提供服务，对于删除我们关心的是什么时候不提供服务。那么对于这个临界点在K8S中是如何判定的呢？

  

在讨论这个临界点之前，我们先看看创建或删除pod的流程。

  

## 创建Pod的过程

当API收到创建Pod的请求，然后会将Pod的定义存储到etcd中，然后scheduler会将pod加入到调度队列中（如果没有做调度优先级配置，默认是放在队列最后），然后scheduler会根据预选、优选策略给pod分配一个最有的node节点，然后这个pod会被标记为`Scheduled`，并将其状态存储到etcd中。

  

到目前为止pod还并没有被创建，因为创建Pod需要通过kubelet组件来完成。kubelet组件会通过apiserver来获取pod的状态，同样也会上报pod的状态。当某个节点检测到该pod是调度到自己节点的时候，就会在本节点创建这个pod，不过创建pod并不是kubelet自己动手，而是交给下面三个组件来完成。

-   **容器运行时接口（CRI）**：为 Pod 创建容器的组件。
-   **容器网络接口（CNI）**：将容器连接到集群网络并分配 IP 地址的组件。
-   **容器存储接口（CSI）**：在容器中装载卷的组件。

  

到现在pod创建完成了，然后会将该pod的状态上报给apiserver并存储在etcd中。

  

现在pod创建完成了，但是在k8s中，pod并不适合直接提供服务，如果在集群内部是通过service来提供服务，如果集群外部需要访问，是通过ingress来提供访问入口。那如果我ingress以及service的某个pod发生了变化，它们又该如何更新呢？

  

在这之前先简单介绍一下service和pod的关系。

service和pod是通过label selector（标签选择器）来进行关联的，只要符合service中定义的label selector，就会将其地址和端口维护到Endpoints中，如下：

```bash
# kubectl describe svc website 
Name:              website
Namespace:         default
Labels:            <none>
Annotations:       kubectl.kubernetes.io/last-applied-configuration:
                     {"apiVersion":"v1","kind":"Service","metadata":{"annotations":{},"name":"website","namespace":"default"},"spec":{"ports":[{"name":"http","...
Selector:          app=website
Type:              ClusterIP
IP:                10.101.58.163
Port:              http  80/TCP
TargetPort:        80/TCP
Endpoints:         192.168.4.9:80
Session Affinity:  None
Events:            <none>

```

Endpoints 对象会从 Pod 中收集所有的 IP 地址和端口，而且不仅一次。在以下情况中，Endpoint 对象将更新一个 endpiont 新列表：

-   Pod 创建时。
-   Pod 删除时。
-   在 Pod 上修改标签时。

  

当pod通过`Readiness`探针后，才标识这个pod真正可用。当pod可用过后，service会通过label selector找到所有匹配的Pod，然后通过k8s更新endpoint，Endpoints也会做相应的更新。

  

除了service，还有kube-proxy，ingress都会使用到endpoint，它们也会进行相应的更新，kube-proxy会通过endpoint来更新iptables或者ipvs规则，ingress更新endpoint是为了让pod接入外部流量。

  

所以创建pod的过程以及pod创建完成后的一系列变化可以总结如下：

1、apiserver收到创建pod的请求（可以是直接创建pod的定义，也可以是通过其他控制器来完成的）。

2、Pod 的定义存储在 etcd 中。

3、scheduler参与调度Pod，为其分配最优节点，并把相关信息存储到etcd中。

4、kubelet监听到pod的信息，在节点上创建pod，分配资源以及IP等，将信息存储到etcd中。

5、kubelet等待pod的Readiness探针成功，并对相关的Endpoints对象更改进行通知。

6、Endpoints将新的endpoint添加到列表中。

7、其他组件控制器根据Endpoints做相应的更改配置，比如kube-proxy会重新创建或者更改iptables/ipvs规则等。

## 删除Pod的过程

删除pod的主要流程如下：

1.  用户发送命令删除 Pod，使用的是默认的宽限期（30秒）
2.  API 服务器中的 Pod 会随着宽限期规定的时间进行更新，过了这个时间 Pod 就会被认为已 “死亡”。
3.  当使用客户端命令查询 Pod 状态时，Pod 显示为 “Terminating”。
4.  （和第 3 步同步进行）当 Kubelet 看到 Pod 由于步骤 2 中设置的时间而被标记为 terminating 状态时，它就开始执行关闭 Pod 流程。

1.  如果 Pod 定义了 [preStop 钩子](https://kubernetes.io/docs/concepts/containers/container-lifecycle-hooks/#hook-details)，就在 Pod 内部调用它。如果宽限期结束了，但是 `preStop` 钩子还在运行，那么就用小的（2 秒）扩展宽限期调用步骤 2。
2.  给 Pod 内的进程发送 TERM 信号。请注意，并不是所有 Pod 中的容器都会同时收到 TERM 信号，如果它们关闭的顺序很重要，则每个容器可能都需要一个 `preStop` 钩子。

5.  （和第 3 步同步进行）从服务的端点列表中删除 Pod，Pod 也不再被视为副本控制器的运行状态的 Pod 集的一部分。因为负载均衡器（如服务代理）会将其从轮换中删除，所以缓慢关闭的 Pod 无法继续为流量提供服务。
6.  当宽限期到期时，仍在 Pod 中运行的所有进程都会被 SIGKILL 信号杀死。
7.  kubelet 将通过设置宽限期为 0 （立即删除）来完成在 API 服务器上删除 Pod 的操作。该 Pod 从 API 服务器中消失，并且在客户端中不再可见。

  

在这里就有一个不确定因素，那就是你无法判断到底是pod先终止还是endpoints列表先更新。这里简单说两种情况。

1、pod删除了endpoints还未更新，这种情况下会导致丢包。不管是从ingress还是从service来的流量，由于它们的endpoints并未及时更新，就会导致调度到已经不存在的Pod上，这样就会导致请求丢失。

2、endpoints更新了，pod还未删除，这种情况下也会丢包。虽然前面流量进不来了，但是自己还未处理完的请求也响应不了。当然，如果pod的停止时间超过了默认的宽限期，就会被强制终止。

  

鉴于此，就需要使用优雅退出来处理这种情况。

  

## 优雅退出

优雅退出有两种常见的解决方法：

-   应用本身可以处理SIGTERM信号。
-   设置一个preStop hook，在hook中指定怎么优雅停止容器

  

在这之前先简单介绍一下SIGTERM和SIGKILL这两个信号。

-   SIGKILL：立刻结束程序。该信号不能被阻塞、处理和忽略，不能在程序中被获取到。
-   SIGTERM：程序结束(Terminate)信号，又叫请求退出信号，与SIGKILL不同的是该信号可以被阻塞和处理，我们可以通过在程序中注册该信号来实现服务的优雅停止。使用kill命令缺省会发出这个信号。

  

那么具体应该如何做呢？

其大概思路如下：当Pod收到SIGTERM信号的时候，先等待一段时间再退出。在这等待的过程中可以继续处理流量，等待时间过后再关闭长连接，关闭进程退出。当然如果超过等待时间，会直接被kill。

> 上面提到了`等待时间`时间，如果我们不设置，默认为30秒。如果设置为0，将立刻发送SIGKILL信号来杀死Pod内所有进程。如果要设置的话，请根据服务情况酌情设置，避免因为程序内有死锁或者其他原因带来的其他问题。

  

  

### 应用处理SIGTERM信号

在应用中处理SIGTERM信号的思路如下：程序在启动过后，会一直阻塞并监听系统信号，直到监测到对应的系统信号后，输出到控制台并退出执行。

  

我们知道在容器中pid为1的进程是容器的主进程，这个进程退出则代表容器就退出了。

  

在这我们需要注意一个问题，通过在Dockerfle中使用CMD、ENTRYPOINT命令可以定义容器启动命令，关于这两个命令的区别这里就不讲了，我们只讲在使用时候一定要注意的问题。

这两个命令都支持下面几种格式：

-   shell 格式：CMD <命令>
-   exec 格式：CMD ["可执行文件", "参数1", "参数2"...]
-   参数列表格式：CMD ["参数1", "参数2"...]。在指定了 ENTRYPOINT 指令后，用 CMD 指定具体的参数。

一般推荐使用 `exec`格式，这类格式在解析时会被解析为 JSON 数组，因此一定要使用双引号 `"`，而不要使用单引号`'`。

如果使用 shell 格式的话，实际的命令会被包装为 sh -c 的参数的形式进行执行。比如：

```dockerfile
CMD java -jar demo.jar
```

在实际执行中，会将其变更为：

```dockerfile
CMD [ "sh", "-c", "java -jar demo.jar" ]
```

**因此容器的主进程是sh，当给容器发送信号，接收信号的是sh进程，sh进程收到信号后会直接退出，自然就会令容器退出。我们的程序永远收不到信号。**

  

### 使用preStop Hook来停止服务

preStop Hook是Pod资源定义中的一个参数，它支持http和exec，简单的demo如下：

```yaml
spec:
  contaienrs:
  - name: my-container
    lifecycle:
      preStop:
        exec:
          command: ["/bin/sh"，"-c"，"sleep 20"]
```

用该方法的主要思路如下：当pod收到SIGTERM信号后，会调用preStop然后等待一段时间，比如15s，这15s的时间留给kube-proxy、ingress等来更新endpoints，等它们更新完后再开始停pod。