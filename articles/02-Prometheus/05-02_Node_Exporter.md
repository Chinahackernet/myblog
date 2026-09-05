# Node Exporter

> 分类：Prometheus / 第5章：Exporter
> 原文：https://www.cuiliangblog.cn/detail/section/69756180
> 来源：崔亮的博客

---

# Node Exporter 自定义指标采集


## 参考文档


[Node Exporter textfile 自定义指标收集器_富士康质检员张全蛋的博客-CSDN博客]([https://blog.csdn.net/qq_34556414/article/details/123478015#:~:text=node_exporter](https://blog.csdn.net/qq_34556414/article/details/123478015#:~:text=node_exporter) 除了本身可以收集系统指标之外，还可以通过 textfile,模块来采集我们自定义的监控指标，这对于系统监控提供了更灵活的使用空间，比如我们通过脚本采集的监控数据就可以通过该模块暴露出去，用于 Prometheus 进行监控报警。)



## 指标格式


> 指定一个生成的监控指标存放目录下，并以 `.prom` 文件名后缀结尾。
>



```plain
textfile_network_send_packages{src="172.18.252.1",dest="172.31.0.25"} 7
textfile_network_recieved_package{src="172.18.252.1",dest="172.31.0.25"} 7
textfile_network_availability{src="172.18.252.1",dest="172.31.0.25"} 100
textfile_network_rtt{src="172.18.252.1",dest="172.31.0.25"} 20
textfile_network_send_packages{src="172.18.252.1",dest="172.31.0.33"} 7
textfile_network_recieved_package{src="172.18.252.1",dest="172.31.0.33"} 7
textfile_network_availability{src="172.18.252.1",dest="172.31.0.33"} 100
textfile_network_rtt{src="172.18.252.1",dest="172.31.0.33"} 20
```



```plain
[root@k8s-node-nj-71 textfile]# pwd
/tmp/textfile
[root@k8s-node-nj-71 textfile]# ls
network.prom
[root@k8s-node-nj-71 textfile]# cat network.prom 
textfile_network_send_packages{src="172.18.252.1",dest="172.31.0.25"} 7
textfile_network_recieved_package{src="172.18.252.1",dest="172.31.0.25"} 7
textfile_network_availability{src="172.18.252.1",dest="172.31.0.25"} 100
textfile_network_rtt{src="172.18.252.1",dest="172.31.0.25"} 20
textfile_network_send_packages{src="172.18.252.1",dest="172.31.0.33"} 7
textfile_network_recieved_package{src="172.18.252.1",dest="172.31.0.33"} 7
textfile_network_availability{src="172.18.252.1",dest="172.31.0.33"} 100
textfile_network_rtt{src="172.18.252.1",dest="172.31.0.33"} 60
```



## node exporter yaml文件


```plain
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: node-exporter
  namespace: thanos
  labels:
    app: node-exporter
spec:
  selector:
    matchLabels:
      app: node-exporter
  template:
    metadata:
      labels:
        app: node-exporter
    spec:
      hostPID: true
      hostIPC: true
      hostNetwork: true
      nodeSelector:
        kubernetes.io/os: linux
      containers:
        - name: node-exporter
          image: 172.16.140.21/prometheus/node-exporter:v1.2.2
          args:
            - --web.listen-address=$(HOSTIP):9100
            - --path.procfs=/host/proc
            - --path.sysfs=/host/sys
            - --path.rootfs=/host/root
            - --collector.filesystem.ignored-mount-points=^/(dev|proc|sys|var/lib/docker/.+)($|/)
            - --collector.filesystem.ignored-fs-types=^(autofs|binfmt_misc|cgroup|configfs|debugfs|devpts|devtmpfs|fusectl|hugetlbfs|mqueue|overlay|proc|procfs|pstore|rpc_pipefs|securityfs|sysfs|tracefs)$
            - --collector.textfile.directory=/tmp/textfile
          ports:
            - containerPort: 9100
          env:
            - name: HOSTIP
              valueFrom:
                fieldRef:
                  fieldPath: status.hostIP
          resources:
            requests:
              cpu: 150m
              memory: 180Mi
            limits:
              cpu: 150m
              memory: 180Mi
          securityContext:
            runAsNonRoot: true
            runAsUser: 65534
          volumeMounts:
            - name: proc
              mountPath: /host/proc
            - name: sys
              mountPath: /host/sys
            - name: root
              mountPath: /host/root
              mountPropagation: HostToContainer
              readOnly: true
            - name: textfile
              mountPath: /tmp/textfile/
      tolerations:
        - operator: "Exists"
      volumes:
        - name: proc
          hostPath:
            path: /proc
        - name: dev
          hostPath:
            path: /dev
        - name: sys
          hostPath:
            path: /sys
        - name: root
          hostPath:
            path: /
        - name: textfile
          hostPath:
            path: /tmp/textfile/
```


