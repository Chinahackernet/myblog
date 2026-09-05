# 下载percona-toolkit (可选)

```plain
工作目录 /apps/work/docker/sql-audit
下载percona-toolkit 套件
wget https://www.percona.com/downloads/percona-toolkit/3.0.13/binary/tarball/percona-toolkit-3.0.13_x86_64.tar.gz
tar -xvf percona-toolkit-3.0.13_x86_64.tar.gz
cd percona-toolkit-3.0.13
mv ./bin   /apps/work/docker/sql-audit/ptbin
```

# 下载Yearning-go

```plain
wget https://github.com/cookieY/Yearning/releases/download/v2.1.1/Yearning-2.1.1.linux-amd64.zip
tar -xvf Yearning-2.1.1.linux-amd64.zip
cd Yearning-2.1.1.linux-amd64/Yearning-go
# 删除无用文件
rm # README .DS_Store
# 复制文件到/apps/work/docker/sql-audit/ 目录
cp -pdr Yearning dist conf.toml /apps/work/docker/sql-audit/
# Yearning 可执行权限 
chmod +x Yearning
```

# 修改配置及修改dockerfile

```plain
cd  /apps/work/docker/sql-audit/
# 生成16位 SecretKey
< /dev/urandom tr -dc A-Z-a-z|head -c ${1:-16};echo 
[root@jenkins ~]# < /dev/urandom tr -dc A-Z-a-z|head -c ${1:-16};echo
vMEUDgvGIJqapfPQ
vi conf.toml
[Mysql]
Db = "Yearning"
Host = "sql-audit-mysql"
Port = "3306"
Password = "kUgUS6mYbL"
User = "root"

[General]
SecretKey = "vMEUDgvGIJqapfPQ"

#cp 一份时区文件
cp /usr/share/zoneinfo/Hongkong ./localtime
# 修改dockerfile
vi Dockerfile
ARG ARCH="amd64"
ARG OS="linux"
FROM alpine:latest
LABEL maintainer="The audit sql Authors <87984115@qq.com>"
ENV VERSION 2.1.1
COPY Yearning  /opt/Yearning
COPY dist /opt/dist
COPY conf.toml /opt/conf.toml
COPY ptbin/ /bin
COPY localtime /etc/localtime
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories
RUN mkdir /lib64 && ln -s /lib/libc.musl-x86_64.so.1 /lib64/ld-linux-x86-64.so.2
RUN apk add --no-cache ca-certificates \
            perl-dbi perl-dbd-mysql \
            perl-time-hires perl-io-socket-ssl \
            && rm -rf /tmp/* \
            && rm -rf /var/cache/apk/*
EXPOSE   8000
WORKDIR /opt

ENTRYPOINT  ["/opt/Yearning"]

CMD ["-m", "-s"]
```

# 制作docker images

```plain
docker build -t mysql-audit:2.1.1 .
# docker 标签上传仓库
 docker tag mysql-audit:2.1.1 docker.xxxx.com/library/mysql-audit:2.1.1
 docker push docker.xxxx.com/library/mysql-audit:2.1.1
```

# docker run 方式运行

```plain
# mysql版本必须5.7及以上版本，请事先自行安装完毕且创建Yearning库,字符集应为UTF-8/UTF8mb4 (仅Yearning所需mysql版本)
docker run -tid --name sql-audit-mysql \
           -e MYSQL_ROOT_PASSWORD="kUgUS6mYbL" \
           -p "3306:3306" \
           -v/apps/mysqldb:/var/lib/mysql \
           mysql:5.7.26 \
           --character-set-server=utf8mb4 \
           --collation-server=utf8mb4_unicode_ci \
           --max_allowed_packet=256M \
           --transaction-isolation=READ-COMMITTED
# 等待mysql 启动完成
使用Navicat  或者mysql 客户端工具连接登陆mysql 数据库 创建Yearning库
CREATE DATABASE `Yearning` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
# 启动Yearning
docker run -tid -p8000:8000 --link sql-audit-mysql:sql-audit-mysql mysql-audit:2.1.1 
#http://ip:8000 端口访问
#Yearning 基于1080p分辨率开发仅支持1080p及以上显示器访问
#由于使用较多新的前端技术栈,请使用Chrome最新版本(不包括360等其他魔改版本)
默认密码：admin/Yearning_admin
或者docker logs 容器ID 
```

# k8s 方式运行

```plain
# 创建命名空间 sql-audit
kubectl create   namespace sql-audit
# helm 方式部署 mysql 
helm install -n sql-audit --name-template sql-audit --set metrics.enabled=true,metrics.serviceMonitor.enabled=true,persistence.size=50Gi stable/mysql
# 查看mysql 部署root 密码
kubectl get secret --namespace sql-audit sql-audit-mysql -o jsonpath="{.data.mysql-root-password}" | base64 --decode; echo
[root@]~]#kubectl get secret --namespace sql-audit sql-audit-mysql -o jsonpath="{.data.mysql-root-password}" | base64 --decode; echo
Fo7FZg8FuA
# 我这里内网环境与K8S pod 及k8s 自身网络已经打通可以远程直接访问
mysql -hsql-audit-mysql.sql-audit.svc.cluster.local -u root -p
# kubectl get pod --namespace sql-audit
[root@]~]#kubectl get pod --namespace sql-audit
NAME                               READY   STATUS    RESTARTS   AGE
sql-audit-mysql-6f6bcbf4bc-27d   2/2     Running   4          14d
kubectl exec -ti sql-audit-mysql-6f6bcbf4bc-27d /bin/bash -n  sql-audit
[root@]~]#kubectl exec -ti sql-audit-mysql-6f6bcbf4bc-27d /bin/bash -n  sql-audit
Defaulting container name to sql-audit-mysql.
Use 'kubectl describe pod/sql-audit-mysql-6f6bcbf4bc-27d -n sql-audit' to see all of the containers in this pod.
root@sql-audit-mysql-6f6bcbf4bc-27d:/#
root@sql-audit-mysql-6f6bcbf4bc-27d:/#
root@sql-audit-mysql-6f6bcbf4bc-27d:/#
root@sql-audit-mysql-6f6bcbf4bc-27d:/#

root@sql-audit-mysql-6f6bcbf4bc-27d:/# mysql -u root -p
Enter password:
Welcome to the MySQL monitor.  Commands end with ; or \g.
Your MySQL connection id is 7504
Server version: 5.7.26-log MySQL Community Server (GPL)

Copyright (c) 2000, 2019, Oracle and/or its affiliates. All rights reserved.

Oracle is a registered trademark of Oracle Corporation and/or its
affiliates. Other names may be trademarks of their respective
owners.

Type 'help;' or '\h' for help. Type '\c' to clear the current input statement.

mysql> CREATE DATABASE `Yearning` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
# 创建Yearning 数据库
CREATE DATABASE `Yearning` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
# 创建mysql-audit configmap
vi mysql-audit-configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: config-etc
  namespace: sql-audit
data:
  conf.toml: |
     [Mysql]
     Db = "Yearning"
     Host = "sql-audit-mysql"
     Port = "3306"
     Password = "Fo7FZg8FuA"
     User = "root"

     [General]
     SecretKey = "vMEUDgvGIJqapfPQ"
# 创建mysql-audit ingress
vi mysql-audit-ingress.yaml
apiVersion: extensions/v1beta1
kind: Ingress
metadata:
  name: mysql-audit
  namespace: sql-audit
  annotations:
    kubernetes.io/ingress.class: traefik
    traefik.frontend.rule.type: PathPrefixStrip
    traefik.ingress.kubernetes.io/frontend-entry-points: http,https
    traefik.ingress.kubernetes.io/redirect-entry-point: https
spec:
  rules:
  - host: audit.xxxx.com
    http:
      paths:
        - path: /
          backend:
            serviceName: mysql-audit
            servicePort: 8000
  tls:
   - secretName:  tls-cert
# 创建mysql-audit secrets 
vi mysql-audit-secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  labels:
    k8s-app: mysql-audit
  name: tls-cert
  namespace: sql-audit
type: Opaque
data:
  tls.crt: LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSUdYekNDQlVlZ0F3SUJBZ0lTQkdVcDlSaVAvK2lNMDVYM0FuY0FUeTg1TUEwR0NTcUdTSWIzRFFFQkN3VUEKTUVveEN6QUpCZ05WQkFZVEFsVlRNUll3RkFZRFZRUUtFdzFNWlhRbmN5QkZibU55ZVhCME1TTXdJUVlEVlFRRApFeHBNWlhRbmN5QkZibU55ZVhCMElFRjFkR2h2Y21sMGVTQllNekFlRncweE9UQTNNRGt3T1RJNU1ESmFGdzB4Ck9URXdNRGN3T1RJNU1ESmFNQll4RkRBU0JnTlZCQU1UQzIxa1pHZGhiV1V1WTI5dE1JSUNJakFOQmdrcWhraUcKOXcwQkFRRUZBQU9DQWc4QU1JSUNDZ0tDQWdFQW9mSVdOdTE4YUp1T3Jzd0JjZE9lODN0dWpXZ2dpUXl0VVYxQwpqNVhYbzNjQTM1L2ZxQXNGVHpJRGNwUmxhTGJ6SHd1d1psOWNSKzJuRENaUzI4VlhZaXcrSkQvQXpna3FzTHFJCjZ3YlFhcHNCa1lYUzRuT1UrZzhSMVgwcm52ckpickE1eHFJSWJKM002ajVLTXZ4RktwvMEV3YXNBY2NiYlVGOW4KMHQ2RzNreG4zWW1Sek5HeHh1bXZ4V2prNWNkSWMza0MyT1VuRktGOG5XemJab2JiNk9PUnZSaElEWW5YdjkxdgoyMUYwQnZ0Q21GY0FEaDRqZXUrLzNKVDVLcEJkdkFHOHI3aU1wbkhKaFU1alhqTXlPRytMbkcvcnJuRzJGaXpHCmx1UHQwKzRlK0ZRSXFZY1BUM1cyTUF2ZDlzQTNEMThsUW82M00vZlMyYjNIYVNidFY0b1pmNS9zTzJNeEVPVnoKVEd1M0NxYk40TkcrZE8ycXoxYWxMQmlGZlVjNEdmUVpYRmlLaDFzazl3Qm5zeWhqYUZmdUx6bHRxMDg3STJLYQorVlRaUzFQSlJFbGduM3UwY1FmaENjelF5ZTJ3Vjl6RE9lVmUxeTBjLzZ0RWJhNllCeGR2ZGcwOFpKL0QwYTBLCnJvWlVJMW5Rc2RKeE8rQ3N1OURLYjROZzJCYnZkWVpHVWJrSCtSUDU0UUdrS1VnYnVxNVIwbXI0U1I2VUwrRE4KZjNxem81a3ZiMXVRWXFpaDZYUFVDVUVPOTNOU1Y2MTNUSUVOTUpyYjVhbGRLUkhPZlpWL201QThlUy9ibFFYcgpOV3FCRy9OL2RtckZjMmcyNGJEY3d5OXIzL3FkNy9MTWxmMVRVdzJGczR3M2x2VHJFanlwWEZhQ3BRRGxkc0xJCkYwcWVKVnNDQXdFQUFhT0NBbkV3Z2dKdE1BNEdBMVVkRHdFQi93UUVBd0lGb0RBZEJnTlZIU1VFRmpBVUJnZ3IKQmdFRkJRY0RBUVlJS3dZQkJRVUhBd0l3REFZRFZSMFRBUUgvQkFJd0FEQWRCZ05WSFE0RUZnUVVHUUNXOGNFbgpaNWhVWjBDa004QW03Wjh6NGJNd0h3WURWUjBqQkJnd0ZvQVVxRXBxWXdSOTNicm0wVG0zcGtWbDcvT283S0V3CmJ3WUlLd1lCQlFVSEFRRUVZekJoTUM0R0NDc0dBUVVGQnpBQmhpSmukSFJ3T2k4dmIyTnpjQzVwYm5RdGVETXUKYkdWMGMyVnVZM0o1Y0hRdWIzSm5NQzhHQ0NzR0FRVUZCekFDaGlOb2RIUndPaTh2WTJWeWRDNXBiblF0ZURNdQpiR1YwYzJWdVkzSjVjSFF1YjNKbkx6QWxCZ05WSFJFRUhqQWNnZzBxTG0xa1pHZGhiV1V1WTI5dGdndHRaR1JuCllXMWxMbU52YlRCTUJnTlZIU0FFUlRCRE1BZ0dCbWVCREFFQ0FUQTNCZ3NyQmdFRUFZTGZFd0VCQVRBb01DWUcKQ0NzR0FRVUZCd0lCRmhwb2RIUndPaTh2WTNCekxteGxkSE5sYm1OeWVYQjBMbTl5WnpDQ0FRWUdDaXNHQVFRQgoxbmtDQkFJRWdmY0VnZlFBOGdCM0FPSnBTNjRtNk9sQUNlaUdHN1k3ZzlRKzUvNTBpUHVranlpVEFaM2Q4ZHYrCkFBQUJhOVpIamZBQUFBUURBRWd3UmdJaEFKNXBWaDFDSEpmcTFhd2NOYmxEU2FwL1prQmVBeXU5ajcrTVhISnMKTEI3TUFpRUFwM2xLVVNCZXpiQWpodkZWSTBGR3ZFWmtzU2lYKyt3SitiZ3VLOXlaS3JBQWR3QXBQRkdXVk1nNQpaYnFxVVB4WUI5UzNiNzlZZWlseTNLVEREUFRsUlVmMGVBQUFBV3ZXUjQzd0FBQUVBd0JJTUVZQ0lRRDI1L1NHClcrWHRDa2VzaHViekZtUnRnaDUrWXMxaXpnSG5CSmtOS1Z0cE9nSWhBT1lteWJCWjV3RjZBeE5UT29WdnkyYVMKNktEdURyWmRzSVYrN251WkhFSDdNQTBHQ1NxR1NJYjNEUUVCQ3dVQUE0SUJBUUNjRHFwTzF3OWdNbzJGaW1GTgpwSUlxT3d1N2hsUWVURU44enY1UmFiYWtGelpvZlhURXpRcGNtSlNWRUhET25MVGpjaWpITWxtbGdIbndTM2w0CjAyWFB0akIzUWJUNFRWUHlqUGpBZ1ZvL1ZmclNJT2N5S1pKRDNJMWxLNXV1anRCdGF3Rnh3cjBYeGd1Q2k5TlUKdlQ2R0RxYnlaVVdiL1I0bXVVYzFwRzMySVJiS3BxQnZveitsaGRMNHdOb1M5YXdiUlg3LzBmUytEZUZiZ09vbgpzYnBDYTFQeFdqWHYwNloxNkF0LzBRTlVZLzExdEw4bTRDK3Q2OW5kOUt6eUdRZmdOank2NmM1RmhIODVBQkNFClJ6L3NoVkdyb1lTQkh3M1Q0c0NKZnh4dW5oK0tVZ0dvRFk5VUc5RzI2T200eHgvWFQ5OTZONTNxUytPS21iY0wKajVJMgotLS0tLUVORCBDRVJUSUZJQ0FURS0tLS0tCgotLS0tLUJFR0lOIENFUlRJRklDQVRFLS0tLS0KTUlJRWtqQ0NBM3FnQXdJQkFnSVFDZ0ZCUWdBQUFWT0ZjMmuMaGV5bkNEQU5CZ2txaGtpRzl3MEJBUXNGQURBLwpNU1F3SWdZRFZRUUtFeHRFYVdkcGRHRnNJRk5wWjI1aGRIVnlaU0JVY25WemRDQkRieTR4RnpBVkJnTlZCQU1UCkRrUlRWQ0JTYjI5MElFTkJJRmd6TUI0WERURTJNRE14TnpFMk5EQTBObG9YRFRJeE1ETXhOekUyTkRBME5sb3cKU2pFTE1Ba0dBMVVFQmhNQ1ZWTXhGakFVQmdOVkJBb1REVXhsZENkeklFVnVZM0o1Y0hReEl6QWhCZ05WQkFNVApHa3hsZENkeklFVnVZM0o1Y0hRZ1FYVjBhRzl5YVhSNUlGZ3pNSUlCSWpBTkJna3Foa2lHOXcwQkFRRUZBQU9DCkFROEFNSUlCQ2dLQ0FRRUFuTk1NOEZybExrZTNjbDAzZzdOb1l6RHExelVtR1NYaHZiNDE4WENTTDdlNFMwRUYKcTZtZU5RaFk3TEVxeEdpSEM2UGpkZVRtODZkaWNicDVnV0FmMTVHYW4vUFFlR2R4eUdrT2xaSFAvdWFaNldBOApTTXgreWsxM0VpU2RSeHRhNjduc0hqY0FISnlzZTZjRjZzNUs2NzFCNVRhWXVjdjliVHlXYU44aktrS1FESVowClo4aC9wWnE0VW1FVUV6OWw2WUtIeTl2NkRsYjJob256aFQrWGhxK3czQnJ2YXcyVkZuM0VLNkJsc3BrRU5uV0EKYTZ4Szh4dVFTWGd2b3BaUEtpQWxLUVRHZE1EUU1jMlBNVGlWRnJxb003aEQ4YkVmd3pCL29ua3hFejB0TnZqagovUEl6YXJrNU1jV3Z4STBOSFdRV002cjZoQ20yMUF2QTJIM0Rrd0lEQVFBQm80SUJmVENDQVhrd0VnWURWUjBUCkFRSC9CQWd3QmdFQi93SUJBREFPQmdOVkhROEJBZjhFQkFNQ0FZWXdmd1lJS3dZQkJRVUhBUUVFY3pCeE1ESUcKQ0NzR0FRVUZCekFCaGlab2RIUndPaTh2YVhOeVp5NTBjblZ6ZEdsa0xtOWpjM0F1YVdSbGJuUnlkWE4wTG1OdgpiVEE3QmdnckJnRUZCUWN3QW9ZdmFIUjBjRG92TDJGd2NITXVhV1JsYm5SeWRYTjBMbU52YlM5eWIyOTBjeTlrCmMzUnliMjkwWTJGNE15NXdOMk13SHdZRFZSMGpCQmd3Ru9BVXhLZXhwSHNzY2ZyYjRVdVFkZi9FRldDRmlSQXcKVkFZRFZSMGdCRTB3U3pBSUJnWm5nUXdCQWdFd1B3WUxLd1lCQkFHQzN4TUJBUUV3TURBdUJnZ3JCZ0VGQlFjQwpBUllpYUhSMGNEb3ZMMk53Y3k1eWIyOTBMWGd4TG14bGRITmxibU55ZVhCMExtOXlaekE4QmdOVkhSOEVOVEF6Ck1ER2dMNkF0aGl0b2RIUndPaTh2WTNKc0xtbGtaVzUwY25WemRDNWpiMjB2UkZOVVVrOVBWRU5CV0RORFVrd3UKWTNKc01CMEdBMVVkRGdRV0JCU29TbXBqQkgzZHV1YlJPYmVtUldYdjg2anNvVEFOQmdrcWhraUc5dzBCQVFzRgpBQU9DQVFFQTNUUFhFZk5qV0RqZEdCWDdDVlcrZGxhNWNFaWxhVWNuZThJa0NKTHhXaDlLRWlrM0pIUlJIR0pvCnVNMlZjR2ZsOTZTOFRpaFJ6WnZvcmylZDZ0aTZXcUVCbXR6dzNXb2RhdGcrVnlPZXBoNEVZcHIvMXdYS3R4OC8Kd0FwSXZKU3d0bVZpNE1GVTVhTXFyU0RFNmVhNzNNajJ0Y015bzVqTWQ2am1lV1VISzhzby9qb1dVb0hPVWd3dQpYNFBvMVFZeiszZHN6a0RxTXA0ZmtseEJ3WFJzVzEwS1h6UE1UWitzT1BBdmV5eGluZG1qa1c4bEd5K1FzUmxHClBmWitHNlo2aDdtamVtMFkraVdsa1ljVjRQSVdMMWl3Qmk4c2FDYkdTNWpOMnA4TStYK1E3VU5LRWtST2IzTjYKS09xa3FtNTdUSDJIM2VESkFrU25oNi9ETkZ1MFFnPT0KLS0tLS1FTkQgQ0VSVElGSUNBVEUtLS0tLQ==
  tls.key: LS0tLS1CRUdJTiBSU0EgUFJJVkFURSBLRVktLS0tLQpNSUlKS0FJQkFBS0NBZ0VBb2ZJV051MThhSnVPcnN3QmNkT2U4M3R1aldnZ2lReXRVVjFDajVYWG8zY0EzNS9mCnFBc0ZUeklEY3BSbGFMYnpId3V3Wmw5Y1IrMm5EQ1pTMjhWWFlpdytKRC9BemdrcXNMcUk2d2JRYXBzQmtZWFMKNG5PVStnOFIxWDBybnZySmJyQTV4cUlJYkozTTZqNUtNdnhGS28wRXdhc0FjY2JiVUY5bjB0Nkcza3huM1ltUgp6Tkd4eHVtdnhXams1Y2RJYzNrQzJPVW5GS0Y4bld6YlpvYmI2T09SdlJoSURZblh2OTF2MjFGMEJ2dENtRmNBCkRoNGpldSsvM0pUNUtwQmR2QUc4cjdpTXBuSEpoVTVqWGpNeU9HK0xuRy9ycm5HMkZpekdsdVB0MCs0ZStGUUkKcVljUFQzVzJNQXZkOXNBM0QxOGxRbzYzTS9mUzJiM0hhU2J0VjRvWmY1L3NPMk14RU9WelRHdTNDcWJONE5HKwpkTzJxejFhbExCaUZmVWM0R2ZRWlhGaUtoMXNrOXdCbnN5aGphRmZ1THpsdHEwODdJMkthK1ZUWlMxUEpSRWxnCm4zdTBjUWZoQ2N6UXllMndWOXpET2VWZTF5MGMvNnRFYmE2WUJ4ZHZkZzA4WkovRDBhMEtyb1pVSTFuUXNkSngKTytDc3U5REtiNE5nMkJidmRZWkdVYmtIK1JQNTRRR2tLVWdidXE1UjBtcjRTUjZVTCtETmYzcXpvNWt2YjF1UQpZcWloNlhQVUNVRU85M05TVjYxM1RJRU5NSnJiNWFsZEtSSE9mWlYvbTVBOGVTL2JsUVhyTldxQkcvTi9kbXJGCmMyZzI0YkRjd3k5cjMvcWQ3L0xNbGYxVFV3MkZzNHczbHZUckVqeXBYRmFDcFFEbGRzTElGMHFlSlZzQ0F3RUEKQVFLQ0FnQXY5Zk13UnpzTisrdlF4cWd5M3JwM1gzbkpOU3BWakVTVUVTdVNQSTFGWXd3R0xtSGRjWTRiK3pMYwpMeWl0VDJsSEszNE5nM1pmOHZrQzl5S1k1YVBRZGt2ZERtaDZYR3FoTmswd1ZhOUpzeWhPd2JSSHpuVXpiVjBaCnZkMDZVd2x1MTQvMHpLMzBCUFBYOTZTZjN1aFpCclIrNnJiUisxT2VSUE1KbDArWDdFYmliRWlhd1F1R1hsVHAKQVB5eE5FaTNzZ0h1M0VhcnJIdXNYNzNHYW5BY1U3RW9zRlUrZFRGSktEcGxXSVVsUUNwajFYZzF0aVZKMWxFYQo4Wit0UkY0T1BQRjFsUkZLaGU1cHBXSjJWbkVzRjVUZ09xRXc0NHBLbk80Zlo5ZGFhVzRRbTBxSmNtOU5XQTRoCndwSDA3czRmcGt6eG5qU1JsbmFDZDlyandGeVBsSkJzUXNhVlFFNzlpQzJZMTRnTk9KQ0xyMXRKSEQ2ODN3bW4KS3ZNOHZpOTdHTmIybXZHeWNtZnloNVpzTFBpTWNqOFFER3VWZU53dlNESXpybnhqVkZlc0liTWt5UlZRemy9IVApTTHRQbXdVR3lwRHVrMDhaZytsT0lYOC85K3lqMER3MDRqenllTVptYlFVdkd2N2lNWjFUaHdaRHF1YkJXV3J4CmtYTmJwTG9BMGxrcHh4bjdGamyYa20zM2ZKQURjd2xWSS82WFNrSm1FaFVlZmZnaFFSMGNyVGphQVd1Qkx2Qk0KT0s5aEEzT3RTN2F0S2FDb1lvSmRrYkpHQTdWdytNNzA4NEJOTGhxM1Fyckg4S3M3Z05pdC9NN3lxSnU1alBaZgo2SE1seHNyWU9NVUhuVlk4VDkwN0Q3cS9ORUNnRThzODhnZzAyQ3JNWTFqanE4UnBpUUtDQVFFQTE2UHJaMUEwClNISS83akdmS3BETkJzQ0xrVUFxRERKSzQ0dFdJYmJBUXFhRTN1eDh3bkFlU2NjSHozbS9ScEpPSGtteHZTZlgKbTJ1Wk8veGtNTWhYK2lwOHdFOHZibzR1enVNYitTSXE3bWpialJkK1JJczJ5NHJsZVQ2NGVjRWc4R2pZckExZgpiSEI0MmhQclVTcXpxUVIwOTZocm1Lb1diU0RDZDZwOUVNeWVzT3IwTjdtQmJYVVZPazJxZGtYRlZWbHBlUDdpClFxWGdRUUI0bHgzLzJJdlpBMlhJUXlQdGJ0RWVRbmgyQ3FNM2NDMzR0VEVjZ244K0VwNG9SWmkwTTBHaUY3bXgKOTEvZHY2THZlNTR5K1pON1lXd1NFQ09ubzd5bDlvTlBZVnVGMGRiMjh0elppMThCeHJTQ2JESE1XbExvUzhWNgpXTEo0OGlSODJDYkc1d0tDQVFFQXdFRjM4KzYyeDhDU2x0blZZNlJaN0J0NEdiNEJqVWhWYXZ0NFkxUGFlbXFNCjFidFVnR2JyUnBoNHFUSEFTckUwUUZLeVZKYnlCUkJyRHIxWHU4WWRSVXQzZC92VzlIR1dPd1BKdTN2M3pLbHMKQ2xsZnpFY3J5L1l2aHAzSzlEcGR6OE1icHdueW5xcGV6b0xMNlJpL3JnK0hyTzBueXd1RSt0T2xYVFo2eUtadApHWVdTSVBWaG00NUJkc2ZxUzhnYjVvbjA0bHh3bnhxVnJvN0c0TUR6cmVEYlFhaGdyS3VuRWxwajZ4eW1PVWpBCkdCZDR3QUVrUExxNUUrRWcreDY4TkRLVTYwK29ybFhLWVhDQm5HSFZOQ3BVcmswVXkrcHFZZmFEN3VuR2VzaHMKSEwra3lXbXl5a3ErTmNKbnRXMFNSNy9sU1IvZUFhVEZyVzZVaXV0RGJRS0NBUUVBemhRYU9PNmVPSW51N016QgpScVdCT3EyeDg4cjFKQmpBRnZzbkFpc3JTOGJsZmtGVTdXREdvVTB5K3FWb0ZhSm1RMjI4RFlCUS9YZnp4aTdxCjlPL1JuQU1VbTVoUlJQOWVYbHNPZGFXZ2o1emyETXRoNFZHRnVUbHhHZERGN1oyU3hBMysyMVlnVm5xYUZCY3IKTUxOMVpOWWNqajJITGl1R0tSNUFtcW4wd2FRN0YrcENJQ3NKTkxqSzQ2QXJnc0lrMXU4TzdCSHgyeTI0eFlZVQp1SjV6emRmQU9nNEFONkhURzY5L2twaWFmb29DeGhNNDlyZ0xmZTdxUEZLbk8vTzJhckdUbmNiWi9BWEMzb3h3Ci81dHRMYlF6R2lSMGtyWHdWSHRKdys4elltQmIzL0RtcWF4RHZueTZMdEo5UGJiTmk1aGw1VnZCRTVqa0dzeWgKL3RQNEN3S0NBUUJ2R1dZb0lKcWZkRGxCMHovdEJOeXlCRzJ5OG9vVEN1blJtT0JKQmZ3TEllZWcyMUJKb3kveQo2OGxPZk9HU1NEVFp0dkEyMGNPcUNZTFVVYmFSWERzdUFCNVp4NzdBSTZPZEZ1Tk01S2FlTG9td3NWVWF4MFlYCjUzd3ZYcUFaNG1DejN4dnJ1MlBwTEtyOHk3anFTdEw1MHgra1hxZlFQaWZxaXNQVXlkYktmT0l2RFhFVWVyaWQKRytmWXJFNUkzS3JDM3BZVStUWmJ1eEVrZm4yUEEvSE5XVk5hN2VKdjVnSDJLU1gwaCtuRzBMT3hPRjhmRlluTApUbHdGa09OdU9xU254Vk1wYUM4aUQ1R1VIVi9JN3dBMTFRQjZlVEM3Wmd0ejhQRHM3MHN6U1A2dzNrNXIxaGpyCnJhV2RpMnBDL1hUQzRiR3VRQ3dhNXcwVTNBSWJCVGxCQW9JQkFEc1RONGhvclVHNWw3MXhLZk5ibVBTbDZ6RlIKYTJ4d2U2VVZPOVZzMFpHeEdLWWJSN1VuVDBDL1FqUiswS2JsbE9leDdFY3cyMklCcmFFVzBGbXpuVnoyUW9FNwpMUE5COXhyTTFEeE56UjZEbFBUeERMcEFGWVlUcm40SWY1cjFVdVdpc2lMdmd6T2xGTlVITnN5UFJIZWNGblhUCnNhTk9JWkgrQTJ5KzF3QWdpSFZIS2JPRGRHeVFQVlQ0TXFFWkJaY2pQcmRBekNKcnloSHlYdHBqRjFSdlFEYTMKTwVM3U3JVTGM4djJGQWJ1VG1QZ2R1ZHBKd1Q4dENCa2VRKzZ4YmJWN3YrZzBEMG5EWFNIZFVwNXFyUzcrTnhtVwp4NWV4UHo1VENhYXcxSnkzWjRmT1MzMTV6eHJGdmRHTmhWRXhMMzRlUVlzOHRYN0N0VWxuWkNray9zYz0KLS0tLS1FTkQgUlNBIFBSSVZBVEUgS0VZLS0tLS0=

# 创建mysql-audit service
vi mysql-audit-service.yaml
---
kind: Service
apiVersion: v1
metadata:
  labels:
    k8s-app: mysql-audit
  name: mysql-audit
  namespace: sql-audit
spec:
  sessionAffinity: ClientIP
  sessionAffinityConfig:
    clientIP:
      timeoutSeconds: 10800
  selector:
    k8s-app: mysql-audit
  ports:
    - protocol: TCP
      port: 8000
      name: web
  type: ClusterIP
# 创建 mysql-audit deployment 
vi mysql-audit-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mysql-audit
  namespace: sql-audit
spec:
  replicas: 1
  selector:
    matchLabels:
      k8s-app: mysql-audit
  template:
    metadata:
      labels:
        k8s-app: mysql-audit
    spec:
      containers:
        - name: mysql-audit
          image: docker.xxxx.com/library/mysql-audit:2.1.1
          ports:
           - containerPort: 8000
             name: web
             protocol: TCP
          readinessProbe:
           httpGet:
             path: /
             port: web
             scheme: HTTP
           initialDelaySeconds: 25
           periodSeconds: 2
          livenessProbe:
           httpGet:
             path: /           
             port: web
             scheme: HTTP
           initialDelaySeconds: 30
           periodSeconds: 2
          resources:
            requests:
              cpu: 200m
              memory: 1Gi
            limits:
              memory: 2Gi
              cpu: 250m
          volumeMounts:
          - name: config-etc-volume
            mountPath: /opt/conf.toml
            subPath: conf.toml
      volumes:
        - name: config-etc-volume
          configMap:
            name: config-etc
            defaultMode: 0644
            items:
            - key: conf.toml
              path: conf.toml 
```

# 创建 Yearning 服务

```plain
kubectl apply -f .
```

# 验证 Yearning 是否正常

```plain
 [root@]~]#kubectl get pod --namespace sql-audit | grep mysql-audit
mysql-audit-79899bdd44-4gb4l       1/1     Running   0          76m
#正常运行
#绑定hosts  我这个对外ingress ip 192.168.30.36
192.168.30.36 audit.xxxx.com
http://audit.mddgame.com # 会强制调整到https
查看密码
kubectl log mysql-audit-79899bdd44-4gb4l   --namespace sql-audit
默认密码：admin/Yearning_admin
# 都是中文版本具体里面功能操作摸索就能搞定
```

![image.png](assets/kubernetes与云原生/使用Yearning_做MYSQL审计docker-K8S部署/使用Yearning_做MYSQL审计docker-K8S部署-1.png)

![image.png](assets/kubernetes与云原生/使用Yearning_做MYSQL审计docker-K8S部署/使用Yearning_做MYSQL审计docker-K8S部署-2.png)

![image.png](assets/kubernetes与云原生/使用Yearning_做MYSQL审计docker-K8S部署/使用Yearning_做MYSQL审计docker-K8S部署-3.png)