# 自定义Endpoints

> 分类：Kubernetes / 第7章：Service和Ingress
> 原文：https://www.cuiliangblog.cn/detail/section/94200051
> 来源：崔亮的博客

---

## 简介
endpoint 是k8s集群中一个资源对象，存储在etcd里面，用来记录一个service对应的所有pod的访问地址。service配置selector endpoint controller 才会自动创建对应的endpoint 对象，否则是不会生产endpoint 对象

k8s集群中创建一个名为test的service,就h会生成一个同名的endpoint 对象，endpoint对象就是关联pod的ip 地址和端口 (使用kubectl describe svc mongodb -n namespace-name， 查看当前的service 下面有一个pod 的)

一个service由一组后端的pod组成，这些后端的pod通过service endpoint暴露出来，如果有一个新的pod创建创建出来，且podd的标签名称(label:pod)跟service里面的标签（label selector 的label）一致会自动加入到service的endpoints 里面，如果pod对象终止后，pod 会自动从edponts 中移除。在集群中任意节点 可以使用curl请求service :

endpoints: 实际上servce服务后端的pod端点集合

service 不仅可以代理pod 还可以代理任意其它的后端比如运行在k8s集群外部的服务 比如mysql mongodb (如果需要从k8s里面链接外部服务（mysql）需要定义同名的service和endpoint)

## 应用场景
在实际生成环境中，像mysql mongodb这种IO密集行应用，性能问题会显得非常突出，所以在实际应用中，一般不会把这种有状态的应用（mysql 等）放入k8s里面，而是使用单独的服务来部署，而像web这种无状态的应用更适合放在k8s里面 里面k8s的自动伸缩，和负载均衡，故障自动恢复 等强大功能

如果在应用程序中直接使用存储应用的ip 地址，考虑如果后期的ip变化了，我们要手动修改应用的配置，如果是一俩个服务还好，如果是多服务的话 我们就要一个一个去替换，万一哪个服务没有改到 那就麻烦了！

当然使用configmap也可以解决我说的上述问题，只需要将端点存储在Configmap里面，并将其作为环境变量用于代码中读取，但是如果端点发生变化，我们可能要重新所有的应用的容器

我们需要能够在k8s里面像使用同一个命名空间下面的服务那种直接使用service name 名称,我们可以使用k8s的静态服务来解决，如果后期需要将有状态服务添加到k8s里面，则代码不需要任何修改。

## 操作实践
### 创建service
```yaml
apiVersion: v1
kind: Service
metadata:
  name: kafka
spec:
  ports:
  - port: 9092
    name: kafka
    targetPort: 9092
```

### 创建 endpoints
```yaml
apiVersion: v1
kind: Endpoints
metadata: 
  name: kafka
subsets:
- addresses:
  - ip: 192.168.10.22
  - ip: 192.168.10.23
  - ip: 192.168.10.24
  ports:
   - port: 9092
     name: kafka
```

### 查看资源信息
```yaml
# kubectl describe svc kafka 
Name:              kafka
Namespace:         default
Labels:            <none>
Annotations:       <none>
Selector:          <none>
Type:              ClusterIP
IP:                10.109.127.37
Port:              kafka  9092/TCP
TargetPort:        9092/TCP
Endpoints:         192.168.10.22:9092,192.168.10.23:9092,192.168.10.24:9092
Session Affinity:  None
Events:            <none>
```

可以看到service跟endpoint成功挂载一起了，表面外面服务成功挂载到k8s里面了，在应用中配置链接的地方使用kafka.default.svc即可


