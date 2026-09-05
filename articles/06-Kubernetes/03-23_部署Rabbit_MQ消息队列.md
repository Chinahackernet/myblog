# 部署Rabbit MQ消息队列

> 分类：Kubernetes / 第3章：周边组件安装部署
> 原文：https://www.cuiliangblog.cn/detail/section/192383630
> 来源：崔亮的博客

---

# 安装Kubernetes Operator
官网的文档 [https://www.rabbitmq.com/kubernetes/operator/operator-overview.html](https://link.zhihu.com/?target=https%3A//www.rabbitmq.com/kubernetes/operator/operator-overview.html)

```bash
# Operator的yaml文件地址
# wget https://github.com/rabbitmq/cluster-operator/releases/latest/download/cluster-operator.yml

# 安装
# kubectl apply -f cluster-operator.yml 
namespace/rabbitmq-system created
customresourcedefinition.apiextensions.k8s.io/rabbitmqclusters.rabbitmq.com created
serviceaccount/rabbitmq-cluster-operator created
role.rbac.authorization.k8s.io/rabbitmq-cluster-leader-election-role created
clusterrole.rbac.authorization.k8s.io/rabbitmq-cluster-operator-role created
clusterrole.rbac.authorization.k8s.io/rabbitmq-cluster-service-binding-role created
rolebinding.rbac.authorization.k8s.io/rabbitmq-cluster-leader-election-rolebinding created
clusterrolebinding.rbac.authorization.k8s.io/rabbitmq-cluster-operator-rolebinding created
deployment.apps/rabbitmq-cluster-operator created
```

安装完之后查看Operator是否启动正常, 默认pod在 rabbitmq-system命名空间下

```bash
# kubectl get pod -n rabbitmq-system
NAME                                        READY   STATUS    RESTARTS   AGE
rabbitmq-cluster-operator-9d69fc79f-kp7ff   1/1     Running   0          8s
```

# 安装rabbitmq
安装mq时，会使用storageClass创建pvc，所以k8s需要提前配置好storageClass。

自定义mq的yaml文件，配置项可以参考官网文档[https://www.rabbitmq.com/kubernetes/operator/using-operator#overview](https://www.rabbitmq.com/kubernetes/operator/using-operator#overview)

```yaml
apiVersion: rabbitmq.com/v1beta1
kind: RabbitmqCluster
metadata:
  name: rabbitmq-cluster
  namespace: rabbitmq-system
  labels:
    app: rabbitmq-cluster
spec:
  replicas: 3
  image: rabbitmq:4.0-management
  persistence:
    storageClassName: nfs
    storage: 5Gi
  resources:
    limits:
      cpu: 2
      memory: 4Gi
  rabbitmq:
    additionalPlugins:
      - rabbitmq_prometheus # 启用prometheus插件
    additionalConfig: |
      default_vhost = vhost      #配置Virtual Hosts
      default_user = admin       #配置登录账号
      default_pass = CHANGE_ME      #配置账号密码
```

创建并查看资源

```bash
# kubectl get pod -n rabbitmq-system                           
NAME                                         READY   STATUS    RESTARTS   AGE
rabbitmq-cluster-operator-5874fd544d-7275h   1/1     Running   0          2m2s
rabbitmq-cluster-server-0                    1/1     Running   0          63s
rabbitmq-cluster-server-1                    1/1     Running   0          63s
rabbitmq-cluster-server-2                    1/1     Running   0          63s
# kubectl get svc -n rabbitmq-system                           
NAME                     TYPE        CLUSTER-IP     EXTERNAL-IP   PORT(S)                        AGE
rabbitmq-cluster         ClusterIP   10.99.198.45   <none>        5672/TCP,15672/TCP,15692/TCP   78s   
rabbitmq-cluster-nodes   ClusterIP   None           <none>        4369/TCP,25672/TCP             78s
# kubectl get secrets -n rabbitmq-system                                                                            
NAME                             TYPE     DATA   AGE
rabbitmq-cluster-default-user    Opaque   8      2m41s
rabbitmq-cluster-erlang-cookie   Opaque   1      2m41s
```

创建管理员用户与权限

```yaml
# kubectl exec -it -n rabbitmq-system rabbitmq-cluster-server-1 -c rabbitmq -- bash
# 创建用户
rabbitmq@rabbitmq-cluster-server-1:/$ rabbitmqctl add_user admin CHANGE_ME
Adding user "admin" ...
Done. Don't forget to grant the user permissions to some virtual hosts! See 'rabbitmqctl help set_permissions' to learn more.
# 设置角色
rabbitmq@rabbitmq-cluster-server-1:/$ rabbitmqctl set_user_tags admin administrator
Setting tags for user "admin" to [administrator] ...
# 创建vhost
rabbitmq@rabbitmq-cluster-server-1:/$ rabbitmqctl add_vhost /
Adding vhost "/" ...
# 授权
rabbitmq@rabbitmq-cluster-server-1:/$ rabbitmqctl set_permissions -p / admin ".*" ".*" ".*"
Setting permissions for user "admin" in vhost "/" ...
```

# 添加ingress和nodeport资源
rabbitmq端口暴露

```yaml
apiVersion: v1
kind: Service
metadata:
  name: rabbitmq-nodeport
  namespace: rabbitmq-system
spec:
  type: NodePort
  selector:
    app.kubernetes.io/name: rabbitmq-cluster
  ports:
  - name: amqp
    port: 5672
    protocol: TCP
    targetPort: 5672
    nodePort: 30005
```

web管理页面ingress

```yaml
apiVersion: traefik.io/v1alpha1
kind: IngressRoute
metadata:
  name: grafana
  namespace: rabbitmq-system
spec:
  entryPoints:
  - web
  routes:
  - match: Host(`rabbitmq.local.com`)
    kind: Rule
    services:
      - name: rabbitmq-cluster
        port: 15672
```

# 访问验证
访问web管理页

![](assets/06-Kubernetes/4e17fffbf2a90e8d188d.png)

python测试脚本，发送消息

```python
import pika


def connect_rabbitmq(username, password, host, port=5672):
    # 创建带有用户名和密码认证的 RabbitMQ 连接
    credentials = pika.PlainCredentials(username, password)
    connection = pika.BlockingConnection(
        pika.ConnectionParameters(host=host, port=port, credentials=credentials)
    )
    return connection


def send_message_to_queue(message, queue_name, username, password, host):
    # 建立连接
    connection = connect_rabbitmq(username, password, host)
    channel = connection.channel()

    # 声明队列（如果不存在则创建）
    channel.queue_declare(queue=queue_name)

    # 向指定队列发送消息
    channel.basic_publish(
        exchange='',
        routing_key=queue_name,
        body=message
    )
    print(f"Sent message to queue {queue_name}")

    # 关闭连接
    connection.close()


if __name__ == "__main__":
    # 配置 RabbitMQ 用户认证信息
    username = "admin"
    password = "CHANGE_ME"
    host = "192.168.10.10"  # 可替换为 RabbitMQ 主机地址

    # 要发送的消息内容和目标队列
    message = "Hello, RabbitMQ with Auth!"
    queue_name = "single_queue"

    # 向单个队列发送消息
    send_message_to_queue(message, queue_name, username, password, host)

```

查看web页面成功收到消息。

![](assets/06-Kubernetes/ac5c0a7055ff895831c4.png)


