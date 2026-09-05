# nginx-Ingress案例

> 分类：Kubernetes / 第7章：Service和Ingress
> 原文：https://www.cuiliangblog.cn/detail/section/15276607
> 来源：崔亮的博客

---

> 注意要点：
>
> + ingress中的serviceName要与service中的metadata-name保持一致
> + service中的selector-app要与deployment中的selector-app保持一致
> + deployment中的matchlables-app要与template中的matadata-lables-app保持一致
>



# 一、部署myapp1实例


1. 使用Deployment控制器部署myapp1相关的Pod对象

![](assets/06-Kubernetes/baff66aefc3fd8742eb2.png)

+ 查看deployment状态

![](assets/06-Kubernetes/c944a4a828bd19897522.png)

2. 使用ClusterIP控制器部署svc1相关的对象

![](assets/06-Kubernetes/3e03b483ccfe5dc8af10.png)

+ 查看svc

![](assets/06-Kubernetes/b23e8a08a28df40eb637.png)



# 二、部署myapp2实例


1. 使用Deployment控制器部署myapp2相关的Pod对象

![](assets/06-Kubernetes/179797df1a1873334fd9.png)



+ 查看deployment状态

![](assets/06-Kubernetes/1830d71b827ac0d6cbdd.png)

2. 使用ClusterIP控制器部署svc2相关的对象

![](assets/06-Kubernetes/2abfd0b16d5610251623.png)



+ 查看svc

![](assets/06-Kubernetes/f669d7143bf908cd3f8b.png)



# 三、创建Ingress实例


1. 编写ingress使访问myapp1.cuiliang.com跳转至myapp1，访问myapp2.cuiliang.com跳转至myapp2

![](assets/06-Kubernetes/c7afb51e80b97749cbaa.png)

2. 查看svc服务信息

![](assets/06-Kubernetes/2016b81f53324d0cef60.png)

3. 查看ingress规则

![](assets/06-Kubernetes/839671baf9b73353efaf.png)

4. 查看ingress-nginx配置文件

![](assets/06-Kubernetes/08267a4df2c74caa1ffc.png)

5. 修改host文件

![](assets/06-Kubernetes/61655542491b0c6af8e0.png)

6. 访问测试

![](assets/06-Kubernetes/a3cc0d3855c636b5ce5f.png)

![](assets/06-Kubernetes/26726ded4abfd1ef84cd.png)



# 四、Ingress https代理


1. 创建证书，以及 cert 存储  
`# openssl req -x509 -sha256 -nodes -days 365 -newkey rsa:2048 -keyout tls.key -out tls.crt -subj "/CN=nginxsvc/O=nginxsvc"`   
`# kubectl create secret tls tls-secret --key tls.key --cert tls.crt` 
2. 使用Deployment控制器部署myapp3相关的Pod对象

![](assets/06-Kubernetes/982db63a2bffd04b13bd.png)



+ 查看deployment状态

![](assets/06-Kubernetes/136b82072f5bcea63eda.png)



3. 使用ClusterIP控制器部署svc3相关的对象

![](assets/06-Kubernetes/d0d669edea7481cf679d.png)



+ 查看svc

![](assets/06-Kubernetes/777cefd77dc958873c19.png)



4. 创建Ingress实例  
![](assets/06-Kubernetes/3613c5e9589b1a95dec5.png)

![](assets/06-Kubernetes/ed2c90153967e48b3049.png)



+ 查看svc-ingress信息

![](assets/06-Kubernetes/e3a4e52dcae9dcd7587e.png)



5. 修改host文件

![](assets/06-Kubernetes/d53494dba8829f0f0590.png)

6. 访问测试

![](assets/06-Kubernetes/0b9f83fdac7478243f62.png)



# 五、BasicAuth用户认证


1. 创建证书，以及 cert 存储  
`#yum -y install httpd`   
`#htpasswd -c auth foo`   
`#kubectl create secret generic basic-auth --from-file=auth` 
2. 使用Deployment控制器部署myapp4相关的Pod对象

![](assets/06-Kubernetes/fb248e1c86809b81c3dc.png)

+ 查看deployment状态  
![](assets/06-Kubernetes/edb4349ec0d56a7c260e.png)
3. 使用ClusterIP控制器部署svc4相关的对象

![](assets/06-Kubernetes/539fa7834d5b300c7845.png)

+ 查看svc

![](assets/06-Kubernetes/8b8bf349d3c9ee4f7fed.png)

4. 创建Ingress实例

![](assets/06-Kubernetes/3cc1b6d672ab91f8440b.png)

![](assets/06-Kubernetes/83118d7732488226fd8a.png)

5. 查看svc-ingress信息

![](assets/06-Kubernetes/62bc48de1fc9eedc0d21.png)

6. 修改host文件

![](assets/06-Kubernetes/40db6367b7fbf388b7e1.png)

7. 访问测试

![](assets/06-Kubernetes/50bb13987ece0b3c3a4a.png)



# 六、nginx重写


+ 当用户访问myapp5.cuiliang.com时跳转到myapp3.cuiliang.com



1. 创建Ingress实例

![](assets/06-Kubernetes/f05d624f163f9e2bf559.png)

2. 查看svc-ingress信息

![](assets/06-Kubernetes/5112602cbd9f231bf660.png)

3. 修改host文件

![](assets/06-Kubernetes/501748e30057653e5618.png)

4. 访问测试  
   ![](assets/06-Kubernetes/5073cde757e36f675848.png)

![](assets/06-Kubernetes/05d74bb87815e88c68c6.png)


