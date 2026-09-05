# gitlab部署(k8s)

> 分类：CI/CD / 第10章：Gitlab安装部署
> 原文：https://www.cuiliangblog.cn/detail/section/131418586
> 来源：崔亮的博客

---

# 创建资源
## pvc
```yaml
[root@tiaoban gitlab]# cat > gitlab-pvc.yaml << EOF
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: gitlab-data-pvc
  namespace: gitlab
spec:
  storageClassName: nfs-client
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 50Gi
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: gitlab-config-pvc
  namespace: gitlab
spec:
  storageClassName: nfs-client
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 5Gi
EOF
```

## deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: gitlab
  namespace: gitlab
spec:
  selector:
    matchLabels:
      app: gitlab
  replicas: 1
  template:
    metadata:
      labels:
        app: gitlab
    spec:
      containers:
        - name: gitlab
          image: gitlab/gitlab-ce:18.4.3-ce.0
          env:
            - name: GITLAB_SKIP_UNMIGRATED_DATA_CHECK  # 跳过 GitLab 启动时的数据迁移检查
              value: "true"
            - name: EXTERNAL_URL # 指定gitlab域名
              value: "http://gitlab.cuiliangblog.cn/"
            - name: GITLAB_OMNIBUS_CONFIG
              value: |
                prometheus['enable'] = false
                alertmanager['enable'] = false
                gitlab_rails['time_zone'] = 'Asia/Shanghai'
                gitlab_rails['gitlab_email_enabled'] = false
                gitlab_rails['smtp_enable'] = false
                gitlab_rails['gravatar_plain_url'] = 'http://gravatar.loli.net/avatar/%{hash}?s=%{size}&d=identicon'
                gitlab_rails['gravatar_ssl_url'] = 'https://gravatar.loli.net/avatar/%{hash}?s=%{size}&d=identicon'
                nginx['worker_processes'] = 2
                postgresql['max_connections'] = 100
                postgresql['shared_buffers'] = "128MB"
          ports:
            - containerPort: 80
              name: http
            - containerPort: 443
              name: https
            - containerPort: 22
              name: ssh
          readinessProbe:
            exec:
              command: ["sh", "-c", "curl -s http://127.0.0.1/-/health"]
          livenessProbe:
            exec:
              command: ["sh", "-c", "curl -s http://127.0.0.1/-/health"]
            timeoutSeconds: 5
            failureThreshold: 3
            periodSeconds: 60
          startupProbe:
            exec:
              command: ["sh", "-c", "curl -s http://127.0.0.1/-/health"]
            failureThreshold: 20
            periodSeconds: 120
          resources:
            requests:
              memory: "4Gi"
              cpu: "2"
            limits:
              memory: "8Gi"
              cpu: "4"
          volumeMounts:
            - name: data
              mountPath: /var/opt/gitlab
            - name: config
              mountPath: /etc/gitlab
            - name: log
              mountPath: /var/log/gitlab
            - mountPath: /dev/shm
              name: cache-volume
      volumes:
        - name: data
          persistentVolumeClaim:
            claimName: gitlab-data-pvc
        - name: config
          persistentVolumeClaim:
            claimName: gitlab-config-pvc
        - name: log
          emptyDir: {}
        - name: cache-volume
          emptyDir:
            medium: Memory
            sizeLimit: 256Mi
```

## svc
```yaml
[root@tiaoban gitlab]# cat > gitlab-svc.yaml << EOF
apiVersion: v1
kind: Service
metadata:
  name: gitlab-svc
  namespace: gitlab
spec:
  selector:
    app: gitlab
  ports:
    - port: 80
      targetPort: 80
      name: http
    - port: 443
      targetPort: 443
      name: https
    - port: 22
      targetPort: 22
      name: ssh
EOF
```

## ingress
```yaml
apiVersion: traefik.io/v1alpha1
kind: IngressRoute
metadata:
  name: gitlab-tls
  namespace: gitlab
spec:
  entryPoints:
    - websecure 
  tls:
    secretName: ingress-tls
  routes:
    - match: Host(`gitlab.cuiliangblog.cn`)
      kind: Rule
      services:
        - name: gitlab-svc
          port: 80
---
apiVersion: traefik.io/v1alpha1
kind: IngressRoute
metadata:
  name: gitlab
  namespace: gitlab
spec:
  entryPoints:
    - web
  routes:
    - match: Host(`gitlab.cuiliangblog.cn`)
      kind: Rule
      services:
        - name: gitlab-svc
          port: 80
```

# 访问验证
## 查看资源信息
```bash
[root@tiaoban gitlab]# kubectl get all -n gitlab
NAME                              READY   STATUS    RESTARTS    AGE
pod/gitlab-68b7b46dc7-m687z       1/1     Running   0           11m

NAME                     TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)                 AGE
service/gitlab-svc       ClusterIP   10.108.64.185    <none>        80/TCP,443/TCP,22/TCP   11m
```

## 访问验证
客户端新增hots记录`192.168.10.10 gitlab.cuiliangblog.cn`

![](assets/04-CI-CD/2575fd23a39aa0953689.png)

## 添加集群 hosts 记录
为了方便后续 gitlab runner、Jenkins、argocd 服务通过域名访问 gitlab 服务，可以将 hosts 记录添加到 coredns 中，具体可参考文档：[../06_Kubernetes/17-13_%E9%9B%86%E7%BE%A4hosts%E8%AE%B0%E5%BD%95.md](articles/06-Kubernetes/17-13_集群hosts记录.md)


