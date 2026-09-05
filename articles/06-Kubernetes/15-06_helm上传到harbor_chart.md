# helm上传到harbor chart

> 分类：Kubernetes / 第15章：helm
> 原文：https://www.cuiliangblog.cn/detail/section/241615859
> 来源：崔亮的博客

---

# harbor支持helm chart
在 harbor v1.6 版本开始，通过**ChartMuseum** 子服务提供对 chart 的支持，从 **2.7 起**更换为原生 OCI Charts 实现内置支持 Helm Charts 的 OCI 上传。参考文档：[https://goharbor.cn/docs/2.13.0/working-with-projects/working-with-oci/working-with-helm-oci-charts/](https://goharbor.cn/docs/2.13.0/working-with-projects/working-with-oci/working-with-helm-oci-charts/)

# harbor chart 上传
## 创建项目
创建一个名为helm-charts 的项目仓库。

![](assets/06-Kubernetes/867c9949d362e84f9514.png)

## helm 登录 harbor
--insecure 为跳过自签证书选项

```bash
# helm registry login -u admin harbor.cuiliangblog.cn --insecure                
Password: CHANGE_ME
```

## 打包自定义charts
具体可参考文档：[15-04_%E8%87%AA%E5%AE%9A%E4%B9%89Charts.md](articles/06-Kubernetes/15-04_自定义Charts.md)

```bash
# helm package myapp                                            
Successfully packaged chart and saved it to: /opt/myapp-0.1.0.tgz
```

## 推送 charts 包
```bash
# helm push myapp-0.1.0.tgz oci://harbor.cuiliangblog.cn/helm-charts --insecure-skip-tls-verify
Pushed: harbor.cuiliangblog.cn/helm-charts/myapp:0.1.0
Digest: sha256:3e22ac7d2735959b6c368a8d578664e4cd96febcf26fda5b64e1a53217b40bf7
```

## 查看 harbor 仓库验证
![](assets/06-Kubernetes/8321c1f6c725cc7f6299.png)

# Harbor chart 下载
## 查看可用的 Chart  
```bash
curl -k -u admin:Harbor12345 https://harbor.cuiliangblog.cn/api/v2.0/projects/helm-charts/repositories
[{"artifact_count":1,"creation_time":"2025-10-22T14:35:32.350Z","id":4,"name":"helm-charts/myapp","project_id":2,"pull_count":0,"update_time":"2025-10-22T14:35:32.350Z"}]
```

## 拉取 Chart 到本地
```bash
# helm pull oci://harbor.cuiliangblog.cn/helm-charts/myapp --version 0.1.0 --insecure-skip-tls-verify
Pulled: harbor.cuiliangblog.cn/helm-charts/myapp:0.1.0
Digest: sha256:3e22ac7d2735959b6c368a8d578664e4cd96febcf26fda5b64e1a53217b40bf7
# ls
myapp-0.1.0.tgz 
```

## 直接从 Harbor 安装
```bash
# helm install myapp oci://harbor.cuiliangblog.cn/helm-charts/myapp \
  --version 0.1.0 \
  --insecure-skip-tls-verify
```


