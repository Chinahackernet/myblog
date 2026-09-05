一个pod中可以有一或多个Init Container。Pod的中多个Init Container启动顺序为yaml文件中的描述顺序，且串行方式启动，下一个Init/app Container必须等待上一个Init Container完成后方可启动。例如，Init Container1-> … -> Init Containern -> app Container[1-n]。Init Container1成功启动并且完成后，后续的Init Container和app Container才可以启动，如Init Container启动或执行相关检查失败，后续的init Container和应用Container将不会被执行启动命令。

因此可利用Init Container来判断app Container中被依赖的服务是否成功启动。如被依赖的app Container服务启动失败，那么利用Init Container启动失败可以阻止后续app Container服务的启动。

  

由于Init Container必须要在pod状态变为Ready之前完成，所以其不需要readiness探针。另外在资源的requests与limits上与普通Container有细微差别，除以上2点外，Init Container与普通Container并无明显区别。

#### Init Containers用途

-   前文已经提及，由于Init Container必须在app Containers启动之前完成，所以可利用其特性，用作服务依赖处理。比如某一个服务A，需依赖db或memcached，那么可以利用服务A pod的Init Container判断db/memcached是否正常提供服务，如果启动服务失败或工作异常，设置Init Container启动失败，那么pod中的服务A就不会被启动了。
-   应用镜像因安全原因等没办法安装或运行的工具，可放到Init Container中运行。另外，Init Container独立于业务服务，与业务无关的工具如sed, awk, python, dig等也可以按需放到Init Container之中。最后，Init Container也可以被授权访问应用Container无权访问的内容。

#### Init Container处理服务依赖应用举例

serviceA服务依赖serviceB，而serviceB采用Readness探针的HTTPGetAction Handler。

  

```yaml
spec:
  initContainers:
  - name: init-serviceA
    image: registry.docker.dev.fwmrm.net/busybox:latest
    command: ['sh', '-c', "curl --connect-timeout 3 --max-time 5 --retry 10 --retry-delay 5 --retry-max-time 60 serviceB:portB/pathB/"]
  containers:
```

  

如果启动serviceA Pod时，serviceB还没有ready，通过kubectl get po -o wide查看pod处于Init状态。

  

```yaml
NAME                        READY     STATUS    RESTARTS   AGE       IP          .l  NODE
serviceA-3071943788-8x27q            0/1       Init:0/1   0          20s       10.244.1.172   bjo-ep-svc-017.dev.fwmrm.net
```

通过kubectl describe po serviceA-3071943788-g03wt查看,可以看出app Container的启动时在init Container启动并成功完成后：

  

```yaml
Events:
FirstSeen LastSeen    Count   From                    SubObjectPath               Type        Reason  Message
--------- --------    -----   ----                    -------------               --------    ------  -------
25s       25s     1   default-scheduler                               Normal      ScheduledSuccessfully assigned serviceA-3071943788-g03wt to bjo-ep-dep-040.dev.fwmrm.net
25s       25s     1   kubelet, bjo-ep-dep-040.dev.fwmrm.net                       Normal      SuccessfulMountVolume   MountVolume.SetUp succeeded for volume "serviceA-config-volume"
25s       25s     1   kubelet, bjo-ep-dep-040.dev.fwmrm.net                       Normal      SuccessfulMountVolume   MountVolume.SetUp succeeded for volume "default-token-2c9j1"
24s       24s     1   kubelet, bjo-ep-dep-040.dev.fwmrm.net   spec.initContainers{init-myservice} Normal      Pulling pulling image "registry.docker.dev.fwmrm.net/ui-search-solr-data:latest"
24s       24s     1   kubelet, bjo-ep-dep-040.dev.fwmrm.net   spec.initContainers{init-myservice} Normal      Pulled  Successfully pulled image "registry.docker.dev.fwmrm.net/busybox:latest"
24s       24s     1   kubelet, bjo-ep-dep-040.dev.fwmrm.net   spec.initContainers{init-myservice} Normal      Created Created container
24s       24s     1   kubelet, bjo-ep-dep-040.dev.fwmrm.net   spec.initContainers{init-myservice} Normal      Started Started container
20s       20s     1   kubelet, bjo-ep-dep-040.dev.fwmrm.net   spec.containers{is}         Normal      Pulling pulling image "registry.docker.dev.fwmrm.net/infra/is:latest"
20s       20s     1   kubelet, bjo-ep-dep-040.dev.fwmrm.net   spec.containers{is}         Normal      Pulled  Successfully pulled image "registry.docker.dev.fwmrm.net/infra/is:latest"
20s       20s     1   kubelet, bjo-ep-dep-040.dev.fwmrm.net   spec.containers{is}         Normal      Created Created container
19s       19s     1   kubelet, bjo-ep-dep-040.dev.fwmrm.net   spec.containers{is}         Normal      Started Started container
```

查看docker Container log，init Container正在按照预先的设定，每3秒轮询验证serviceB健康检查点.

  

```yaml
serviceB:portB/pathB/
docker logs 4fd58bf54f76
waiting for serviceB service
waiting for serviceB service
```

\`\`... ...

等待一段时间后，再次通过kubectl get po -o wide查看pod处于Running状态

  

```yaml
NAME                        READY     STATUS    RESTARTS   AGE       IP          .l  NODE
serviceA-3071943788-g03wt   1/1       Running   0          1m        10.244.2.68   bjo-ep-dep-040.dev.fwmrm.net
```

  

如果pod重启了，所有init Container都需重新运行。Kubernetes禁止Init Container使用readiness探针，可以使用Pod定义 activeDeadlineSeconds 和 Container的 livenessProbe 防止 init containers 一直重复失败. activeDeadlineSeconds 包含了 init container 启动的时间。