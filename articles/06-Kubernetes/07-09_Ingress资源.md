# Ingress资源

> 分类：Kubernetes / 第7章：Service和Ingress
> 原文：https://www.cuiliangblog.cn/detail/section/15276213
> 来源：崔亮的博客

---

# 一、Ingress和Ingress Controller


1. Ingress就是一组基于DNS名称（host）或URL路径把请求转发至指定的Service资源的规则，用于将集群外部的请求流量转发至集群内部完成服务发布。然而，Ingress资源自身并不能进行“流量穿透”，它仅是一组路由规则的集合，这些规则要想真正发挥作用还需要其他功能的辅助，如监听某套接字，然后根据这些规则的匹配机制路由请求流量。这种能够为Ingress资源监听套接字并转发流量的组件称为Ingress控制器（Ingress Controller）。
2. Ingress控制器并不直接运行为kube-controller-manager的一部分，它是Kubernetes集群的一个重要附件，类似于CoreDNS，需要在集群上单独部署。
3. Ingress控制器可以由任何具有反向代理（HTTP/HTTPS）功能的服务程序实现，如Nginx、Envoy、HAProxy、Vulcand和Traefik等。Ingress控制器自身也是运行于集群中的Pod资源对象，它与被代理的运行为Pod资源的应用运行于同一网络中
4. 使用Ingress资源进行流量分发时，Ingress控制器可基于某Ingress资源定义的规则将客户端的请求流量直接转发至与Service对应的后端Pod资源之上，这种转发机制会绕过Service资源，从而省去了由kube-proxy实现的端口代理开销。

![](assets/06-Kubernetes/d16fd58f5437c5f2c9ac.png)



# 二、部署Ingress控制器（Nginx）


1. Ingress控制器自身是运行于Pod中的容器应用，一般是Nginx或Envoy一类的具有代理及负载均衡功能的守护进程，它监视着来自于API  
Server的Ingress对象状态，并以其规则生成相应的应用程序专有格式的配置文件并通过重载或重启守护进程而使新配置生效。
2. 对于Nginx来说，Ingress规则需要转换为Nginx的配置信息。简单来说，Ingress控制器其实就是托管于Kubernetes系统之上的用于实现在应用层发布服务的Pod资源，它将跟踪Ingress资源并实时生成配置规则。
3. 参考地址  
github地址  
ingress-nginx官网
4. 部署ingress-nginx  
• 创建ingress基础环境资源

`kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/master/deploy/static/provider/cloud-generic.yaml` 

+ 下载慢可以去Github下载

[https://github.com/kubernetes/ingress-nginx/blob/nginx-0.26.1/deploy/static/mandatory.yaml](https://github.com/kubernetes/ingress-nginx/blob/nginx-0.26.1/deploy/static/mandatory.yaml)

+ 创建资源

`kubectl apply -f mandatory.yaml` 

+ 查看pod资源信息

`kubectl get pod -n ingress-nginx` 

+ 采用nodepod暴露服务

`kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/master/deploy/static/provider/baremetal/service-nodeport.yaml` 

+ 查看svc资源信息

`kubectl get svc -n ingress-nginx` 

![](assets/06-Kubernetes/089780e0729f8232be99.png)

# 三、Ingress资源类型


1. 单Service资源型Ingress  
使用Ingress来暴露服务，此时只需要为Ingress指定“default backend”即可
+ 例如下面的示例：

```yaml
apiVersion: extensions/v1beta1
kind: Ingress
metadata:
	name: my-ingress
spec:
	backend:
		serviceName: my-svc
		servicePort: 80
```

+ Ingress控制器会为其分配一个IP地址接入请求流量，并将它们转至示例中的my-svc后端。
2. 基于URL路径进行流量分发  
垂直拆分或微服务架构中，每个小的应用都有其专用的Service资源暴露服务，但在对外开放的站点上，可通过主域名的URL路径（path）分别接入。
+ 例如，对www.ilinux.io/api的请求统统转发至API Service资源，将对www.ilinux.io/wap的请求转发至WAP Service资源

```yaml
apiVersion: extensions/v1beta1
kind: Ingress
metadata:
	name: test
	annotations:
		ingress.kubernetes.io/rewrite-target: /
spec:
  rules:
  - host: www.ilinux.io
    http:
      paths:
      - path: /wap
        backend:
        	serviceName: wap
        	servicePort: 80
      - path: /api
      	backend:
      		serviceName: api
      		servicePort: 80
```



3. 基于主机名称的虚拟主机  
将每个应用分别以独立的FQDN主机名进行输出，如wap.ik8s.io和api.ik8s.io，这两个主机名解析到external LB（如图6-12所示）的IP地址之上，分别用于发布集群内部的WAP和API这两个Service资源。这种实现方案其实就是Web站点部署中的“基于主机名的虚拟主机”，将多个FQDN解析至同一个IP地址，然后根据“主机头”进行转发。
+ 以独立FQDN主机形式发布服务的Ingress资源示例：

```yaml
apiVersion: extensions/v1beta1
kind: Ingress
metadata:
  name: test
spec:
  rules:
  - host: api.ik8s.io
    http:
      paths:
      - backend:
          serviceName: api
          servicePort: 80
  - host: wap.ik8s.io
    http:
      paths:
      - backend:
          serviceName: wap
          servicePort: 80
```



4. TLS类型的Ingress资源  
用于以HTTPS发布Service资源，基于一个含有私钥和证书的Secret对象即可配置TLS协议的Ingress资源，目前来说，Ingress资源仅支持单TLS端口，并且还会卸载TLS会话。在Ingress资源中引用此Secret即可让Ingress控制器加载并配置为HTTPS服务。
+ 下面是一个简单的TLS类型的Ingress资源示例：

```yaml
apiVersion: extensions/v1beta1
kind: Ingress
metadata:
  name: no-rules-map
spec:
  tls:
  - secretName: ikubernetesSecret
  backend:
    serviceName: homesite
    servicePort: 80
```





# 

